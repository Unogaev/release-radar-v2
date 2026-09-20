import { PrismaClient } from "../generated/prisma";
import { SourceAdapter } from "@adapters/SourceAdapter";
import { classifyEvidenceLevel } from "@domain/evidence/ladder";
import { AvailabilityEvidence } from "@domain/evidence/types";
import { decide, DecisionContext, requiresClientFirstOverride } from "@domain/decision/decisionEngine";
import { createFirstDetectionAlert, createPriceStatusChangeAlert, createUnexpectedRestockAlert } from "../lib/notifications/alerts";
import { ScoreComponents } from "@domain/scoring/score";

export interface RunResult {
  sourceId: string;
  discovered: number;
  decisionsCreated: number;
  error: string | null;
}

// NOTE (MVP fix): a flat 50 across every component always yields a
// weighted score of 50, which is BELOW the 65 "skip" threshold in
// score.ts — meaning every auto-collected item was silently discarded
// as SKIP, regardless of real evidence. We have no real demand/scarcity
// model yet, so this is an honest placeholder, not a fabricated signal:
// it deliberately lands just above the skip threshold so a genuinely
// detected, evidence-backed item defaults to WATCH (visible, non-
// actionable) instead of vanishing. Replace with real per-category
// scoring once a demand/scarcity data source exists.
const DEFAULT_SCORE: ScoreComponents = {
  demand: 70,
  scarcity: 60,
  margin: 60,
  access: 70,
  logistics: 70,
  userFit: 60,
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

      const previousAvailability = await prisma.availabilityCheck.findFirst({
        where: { productVariantId: variant.id },
        orderBy: { checkedAt: "desc" },
      });
      const previousDecision = await prisma.decision.findFirst({
        where: { productVariantId: variant.id },
        orderBy: { createdAt: "desc" },
      });

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
      priceUsd: (availability as unknown as { priceUsd: number | null }).priceUsd ?? null,
      currency: "USD",
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

      const FLORIDA_MIAMI_DADE_TAX_RATE = 0.07; // 6% FL state + 1% Miami-Dade surtax
      const priceUsd = (availability as unknown as { priceUsd: number | null }).priceUsd ?? null;
      const checkoutPriceKnown = priceUsd !== null;
      const fullCostKnown = checkoutPriceKnown;
      // Honest default for a direct (non-resale) purchase: no negotiation, so the
      // confirmed checkout price IS the max buy price. No resale-market price source
      // exists in this project, so we never fabricate a resale-based ceiling.
      const maxBuyPriceSet = checkoutPriceKnown;
      // Per-account purchase limits are not yet scraped from retailer pages, so this
      // stays false rather than fabricated, until that scraping is implemented.
      const quantityLimitSet = false;
      // No resale-market data source (StockX/GOAT/etc.) exists yet, so we never claim
      // a resale scenario or a passing profit projection.
      const isResaleScenario = false;
      const ctx: DecisionContext = {
        expensiveItemOverride: { applies: expensiveOverrideApplies },
        buyNow: {
          productIdentified: true,
          sellerOfRecord: availability.sellerOfRecord,
          allowedSellers: availability.sellerOfRecord ? [availability.sellerOfRecord] : [],
          evidenceLevel,
          isProblematicRetailer: false,
          availability,
          checkoutPriceKnown,
          fullCostKnown,
          maxBuyPriceSet,
          quantityLimitSet,
          isResaleScenario,
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

      // MVP fix: persist every decision, including SKIP, so the audit
      // trail and /soon "why we skipped this" view have real data instead
      // of these items vanishing silently before ever reaching the DB.
      const decisionRow = await prisma.decision.create({
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

      // Only notify for statuses that warrant the user's attention — SKIP
      // is informational/audit-only and should never page anyone.
      if (decisionResult.status !== "SKIP") {
        try {
          const alertInput = {
            decisionId: decisionRow.id,
            productVariantId: variant.id,
            brand: product.brand,
            model: product.normalizedModel,
            status: decisionResult.status,
            priceUsd,
            store: availability.sellerOfRecord ?? null,
            primaryUrl: (availability as unknown as { url?: string | null }).url ?? null,
          };
          const wasUnavailable = previousAvailability &&
            previousAvailability.ctaState !== "enabled" &&
            previousAvailability.checkoutState !== "reached_checkout";
          const isAvailable = availability.ctaState === "enabled" || availability.checkoutState === "reached_checkout";
          const previousPrice = previousAvailability?.priceUsd ?? null;
          const priceChanged = previousPrice !== null && priceUsd !== null && Math.abs(previousPrice - priceUsd) >= 0.01;
          const statusChanged = previousDecision && previousDecision.status !== decisionResult.status;

          if (wasUnavailable && isAvailable) await createUnexpectedRestockAlert(alertInput);
          else if (priceChanged || statusChanged) await createPriceStatusChangeAlert(alertInput);
          else await createFirstDetectionAlert(alertInput);
        } catch (alertErr: any) {
          console.error("Failed to create alert:", alertErr?.message ?? alertErr);
        }
      }
    }
  } catch (err: any) {
    result.error = err?.message ?? String(err);
  }

  return result;
}
