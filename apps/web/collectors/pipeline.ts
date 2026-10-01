import { PrismaClient } from "../generated/prisma";
import { SourceAdapter } from "@adapters/SourceAdapter";
import { classifyEvidenceLevel } from "@domain/evidence/ladder";
import { AvailabilityEvidence } from "@domain/evidence/types";
import { buildDecision, DEFAULT_SCORE } from "./decisionContext";
import { createFirstDetectionAlert, createPriceStatusChangeAlert, createUnexpectedRestockAlert } from "../lib/notifications/alerts";

export interface RunResult {
  sourceId: string;
  discovered: number;
  decisionsCreated: number; decisionsSkipped: number;
  error: string | null;
}

export async function runSourcePipeline(
  prisma: PrismaClient,
  sourceRow: { id: string; category: string; sourceType: string },
  adapter: SourceAdapter,
  zip: string
): Promise<RunResult> {
  const result: RunResult = { sourceId: sourceRow.id, discovered: 0, decisionsCreated: 0, decisionsSkipped: 0, error: null };

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
      const priceUsd = (availability as unknown as { priceUsd: number | null }).priceUsd ?? null;

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
          priceUsd,
          currency: "USD",
        },
      });

      await prisma.evidence.create({
        data: {
          productVariantId: variant.id,
          sourceId: sourceRow.id,
          level: evidenceLevel,
          rawSnapshotRef: `auto:${sourceRow.id}:${Date.now()}`,
          parseVersion: "collector-v2",
        },
      });

      // Wave 2: one honest context builder for every path — real owner
      // thresholds, real override price, real market/buyer data, labeled
      // observed/estimated economics. See decisionContext.ts.
      const built = await buildDecision(prisma, {
        productId: product.id,
        variantId: variant.id,
        brand: product.brand,
        model: product.normalizedModel,
        sourceId: sourceRow.id,
        sourceType: sourceRow.sourceType,
        sourceCategory: sourceRow.category,
        availability,
        evidenceLevel,
        priceUsd,
        rawUrl: raw.url ?? null,
        zip,
      });
      const decisionResult = built.result;

      const wasUnavailable = previousAvailability !== null && previousAvailability.ctaState !== "enabled" && previousAvailability.checkoutState !== "reached_checkout"; const wasAvailable = previousAvailability !== null && !wasUnavailable; const isAvailable = availability.ctaState === "enabled" || availability.checkoutState === "reached_checkout"; const previousPrice = previousAvailability?.priceUsd ?? null; const priceChanged = previousPrice !== null && priceUsd !== null && Math.abs(previousPrice - priceUsd) >= 0.01; const statusChanged = previousDecision !== null && previousDecision.status !== decisionResult.status; const availabilityChanged = previousAvailability !== null && ((wasAvailable && !isAvailable) || (wasUnavailable && isAvailable)); const materialChange = priceChanged || statusChanged || availabilityChanged; const DECISION_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000; const previousFresh = previousDecision !== null && Date.now() - new Date(previousDecision.createdAt).getTime() < DECISION_DEDUPE_WINDOW_MS; if (previousDecision !== null && previousDecision.status === decisionResult.status && previousFresh && !materialChange) { result.decisionsSkipped += 1; continue; } // Persist the decision (SKIP included) so the audit trail and
      // /soon "why we skipped this" view have real data.
      const decisionRow = await prisma.decision.create({
        data: {
          productVariantId: variant.id,
          status: decisionResult.status,
          ruleVersion: decisionResult.ruleVersion,
          rationale: decisionResult.rationale,
          blockedReasons: decisionResult.blockedReasons,
          evidenceConfidence: decisionResult.evidenceConfidence,
          // Added to the Prisma schema in Wave 2; the column is ensured
          // idempotently by buildDecision before this write.
          economicsJson: (built.economicsJson ?? undefined) as never,
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

// Re-exported for tests/consumers that referenced the old location.
export { DEFAULT_SCORE };
