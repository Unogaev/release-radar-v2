import { PrismaClient } from "@prisma/client";
import { SourceAdapter } from "@adapters/SourceAdapter";
import { classifyEvidenceLevel } from "@domain/evidence/ladder";
import { AvailabilityEvidence } from "@domain/evidence/types";
import { decide, DecisionContext, requiresClientFirstOverride } from "@domain/decision/decisionEngine";
import { ScoreComponents } from "@domain/scoring/score";

export interface RunResult {
  sourceId: string;
  discovered: number;
  decisionsCreated: number;
  error: string | null;
}

const DEFAULT_SCORE: ScoreComponents = {
  demand: 50,
  scarcity: 50,
  margin: 50,
  access: 50,
  logistics: 50,
  userFit: 50,
};

export async function runSourcePipeline(
  prisma: PrismaClient,
  sourceRow: { id: string; category: string },
  adapter: SourceAdapter,
  zip: string
): Promise<RunResult> {
  const result: RunResult = { sourceId: sourceRow.id, discovered: 0, decisionsCreated: 0, error: null };

  try {
    const rawSignals = await adapter.discover();
    result.discovered = rawSignals.length;

    for (const raw of rawSignals.slice(0, 10)) {
      await prisma.signal.create({
        data: {
          sourceId: sourceRow.id,
          rawText: raw.rawText,
          url: raw.url,
          observedAt: new Date(raw.observedAt),
        },
      });

      const candidates = await adapter.identify(raw);
      const best = candidates[0];
      if (!best || best.confidence < 0.5) continue;

      const normalizedModel = best.model.toLowerCase().slice(0, 200);

      let product = await prisma.product.findFirst({
        where: { brand: best.brand, normalizedModel, category: sourceRow.category },
      });
      if (!product) {
        product = await prisma.product.create({
          data: { brand: best.brand, normalizedModel, category: sourceRow.category },
        });
      }

      let variant = await prisma.productVariant.findFirst({
        where: { productId: product.id, variantLabel: best.variant ?? "default" },
      });
      if (!variant) {
        variant = await prisma.productVariant.create({
          data: { productId: product.id, variantLabel: best.variant ?? "default" },
        });
      }

      const availability: AvailabilityEvidence = await adapter.checkAvailability(
        { productVariantId: variant.id, sellerId: "unknown" },
        { zip, sessionRegion: "US-FL" }
      );

      const evidenceLevel = classifyEvidenceLevel(availability);

      await prisma.availabilityCheck.create({
        data: {
          productVariantId: variant.id,
          sourceId: sourceRow.id,
          metadataStatus: availability.metadataStatus,
          visibleUiStatus: availability.visibleUiStatus,
          ctaState: availability.ctaState,
          variantAvailable: availability.variantAvailable,
          shippingState: availability.shippingState,
          pickupState: availability.pickupState,
          cartState: availability.cartState,
          checkoutState: availability.checkoutState,
          sellerOfRecord: availability.sellerOfRecord,
          zip: availability.zip,
          sessionRegion: availability.sessionRegion,
          evidenceBlobRef: availability.evidenceBlobRef,
        },
      });

      await prisma.evidence.create({
        data: {
          productVariantId: variant.id,
          sourceId: sourceRow.id,
          level: evidenceLevel,
          rawSnapshotRef: `auto:${sourceRow.id}:${Date.now()}`,
          parseVersion: "collector-v1",
        },
      });

      const expensiveOverrideApplies = requiresClientFirstOverride({
        priceUsd: 0,
        category: "other",
        provenScarcity: false,
        crossBorderComplexity: false,
      });

      const ctx: DecisionContext = {
        expensiveItemOverride: { applies: expensiveOverrideApplies },
        buyNow: {
          productIdentified: true,
          sellerOfRecord: availability.sellerOfRecord,
          allowedSellers: [],
          evidenceLevel,
          isProblematicRetailer: false,
          availability,
          checkoutPriceKnown: false,
          fullCostKnown: false,
          maxBuyPriceSet: false,
          quantityLimitSet: false,
          isResaleScenario: false,
          hasCompletedSalesOrConfirmedClient: false,
          projectedEconomicsPasses: false,
          hasBlockingLegalOrLogisticsRisk: false,
        },
        applyNow: null,
        prepare: {
          confirmedBySourceE2: evidenceLevel !== "E0_RUMOR" && evidenceLevel !== "E1_SIGNAL",
          dateAndTimeOfficial: false,
          timePrecision: "tba",
          isFirstGenerationTechAnnouncement: false,
          launchUrlKnown: Boolean(raw.url),
          preparationActionsFormed: false,
        },
        clientFirst: null,
        fallbackHint: "low_interest",
        score: DEFAULT_SCORE,
        evidenceLevel,
        sourceCount: 1,
        hasConflictingEvidence: false,
      };

      const decisionResult = decide(ctx);

      if (decisionResult.status === "SKIP") continue;

      await prisma.decision.create({
        data: {
          productVariantId: variant.id,
          status: decisionResult.status,
          ruleVersion: decisionResult.ruleVersion,
          rationale: decisionResult.rationale,
          blockedReasons: decisionResult.blockedReasons,
          evidenceConfidence: decisionResult.evidenceConfidence,
        },
      });
      result.decisionsCreated += 1;
    }
  } catch (err: any) {
    result.error = err?.message ?? String(err);
  }

  return result;
}
