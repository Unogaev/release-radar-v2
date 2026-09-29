// apps/web/collectors/decisionContext.ts
//
// Wave 2: the single honest place where a DecisionContext is built.
// Used by the hourly collector (pipeline.ts) AND the manual browser-verified
// intake route — so a human verification and an automated check go through
// the exact same gates, economics and rationale. No parallel logic.
//
// Honesty rules enforced here:
//  - Owner thresholds (budget, min profit, min ROI, allowed sellers) are
//    READ from UserPreferences. Unset = not applied, and the rationale says so.
//  - The expensive-item override gets the REAL observed price and a mapped
//    category — never priceUsd: 0.
//  - Resale economics only run on REAL market data (MarketSale rows) or a
//    REAL confirmed BuyerRequest. Asks alone never count.
//  - Every money line is labeled observed / estimated / user_set.

import { PrismaClient } from "../generated/prisma";
import { AvailabilityEvidence, EvidenceLevel } from "@domain/evidence/types";
import {
  decide,
  DecisionContext,
  requiresClientFirstOverride,
} from "@domain/decision/decisionEngine";
import { DecisionResult } from "@domain/decision/types";
import { ScoreComponents } from "@domain/scoring/score";
import {
  buildDirectPurchaseModel,
  buildResaleProceedsModel,
  formatMoneyMinor,
  summarizeCostModel,
  summarizeProceedsModel,
  CostModel,
} from "@domain/economics/costModel";
import {
  calculateEconomics,
  economicsPassesThreshold,
  EconomicsCategory,
} from "@domain/economics/landedCost";
import { FallbackHint } from "@domain/decision/decisionEngine";

// Same honest placeholder as before: deliberately above the skip threshold
// so an evidence-backed item defaults to WATCH (visible) instead of
// vanishing. Replace with real per-category scoring once a demand/scarcity
// data source exists.
export const DEFAULT_SCORE: ScoreComponents = {
  demand: 70,
  scarcity: 60,
  margin: 60,
  access: 70,
  logistics: 70,
  userFit: 60,
};

export interface DecisionBuildInput {
  productId: string;
  variantId: string;
  brand: string;
  model: string;
  sourceId: string;
  sourceType: string;
  sourceCategory: string;
  availability: AvailabilityEvidence;
  evidenceLevel: EvidenceLevel;
  priceUsd: number | null;
  rawUrl: string | null;
  zip: string;
  fallbackHint?: FallbackHint;
}

export interface DecisionBuildOutput {
  result: DecisionResult;
  /** Persisted to Decision.economicsJson — the auditable money trail. */
  economicsJson: Record<string, unknown> | null;
  priceUsd: number | null;
}

/** Idempotent: matches what `prisma db push` would generate for the
 *  `economicsJson Json?` field added to the Decision model. */
export async function ensureEconomicsColumn(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Decision" ADD COLUMN IF NOT EXISTS "economicsJson" JSONB`
  );
}

/** First user by creation time = the owner (same definition as getOwnerUserId). */
async function loadOwnerPrefs(prisma: PrismaClient) {
  const owner = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    include: { preferences: true },
  });
  return { owner, prefs: owner?.preferences ?? null };
}

/** Map the free-form source category to the override's narrow taxonomy.
 *  Only watch/automotive are mapped — everything else is "other", because
 *  spec §3.6's "expensive tech" clause targets unproven first-gen gadgets,
 *  not ordinary cameras/GPUs/sneakers. Documented, not silent. */
function mapOverrideCategory(sourceCategory: string): "watch" | "automotive" | "other" {
  const c = sourceCategory.toLowerCase();
  if (c.includes("watch")) return "watch";
  if (c.includes("car") || c.includes("auto")) return "automotive";
  return "other";
}

/** Map to the spec §11 threshold categories. */
function mapEconomicsCategory(sourceCategory: string): EconomicsCategory {
  const c = sourceCategory.toLowerCase();
  if (
    c.includes("gpu") ||
    c.includes("camera") ||
    c.includes("console") ||
    c.includes("lego") ||
    c.includes("luxury") ||
    c.includes("watch") ||
    c.includes("apple")
  ) {
    return "liquid_fast_turn";
  }
  if (c.includes("clearance")) return "clearance";
  return "standard_resale";
}

export async function buildDecision(
  prisma: PrismaClient,
  input: DecisionBuildInput
): Promise<DecisionBuildOutput> {
  await ensureEconomicsColumn(prisma);
  const { owner, prefs } = await loadOwnerPrefs(prisma);

  const priceUsd = input.priceUsd;
  const priceMinor = priceUsd !== null ? Math.round(priceUsd * 100) : null;
  const currency = "USD";

  // ---- Expensive-item override with the REAL observed price ----
  const expensiveOverrideApplies = requiresClientFirstOverride({
    priceUsd: priceUsd ?? 0,
    category: mapOverrideCategory(input.sourceCategory),
    provenScarcity: false, // no scarcity data source yet — conservative by design
    crossBorderComplexity: false,
  });

  // ---- Honest landed-cost model (spec §11 inputs) ----
  let landed: CostModel | null = null;
  if (priceMinor !== null) {
    landed = buildDirectPurchaseModel({
      priceMinor,
      currency,
      taxRate: null, // unknown until the owner sets a ZIP — documented estimate
    });
  }
  const landedMinor = landed?.totalMinor ?? null;

  const budgetMinor = prefs?.budgetMinor ?? null;
  const checkoutPriceKnown = priceMinor !== null;
  // The full cost is known when we can build the landed model from an
  // observed price. Estimates inside it are labeled, not hidden.
  const fullCostKnown = landed !== null;
  const maxBuyPriceSet = checkoutPriceKnown;
  // A direct product listing is a single-unit purchase — the quantity limit
  // is inherently 1. For signal-type sources we still don't know it.
  const quantityLimitSet = input.sourceType === "PRODUCT_LISTING";

  // ---- Seller allow-list: owner's list wins; otherwise the observed seller ----
  const sellerOfRecord = input.availability.sellerOfRecord;
  const allowedSellers =
    prefs && prefs.allowedRetailers.length > 0
      ? prefs.allowedRetailers
      : sellerOfRecord
        ? [sellerOfRecord]
        : [];

  // ---- Resale path: ONLY on real market data or a real buyer request ----
  const goal = prefs?.goal ?? "self";
  const isResaleScenario = goal === "resale";

  const marketSales = await prisma.marketSale.findMany({
    where: { productVariantId: input.variantId },
    orderBy: { observedAt: "desc" },
    take: 20,
  });
  const buyerRequest = owner
    ? await prisma.buyerRequest.findFirst({
        where: { productVariantId: input.variantId, userId: owner.id },
        orderBy: { id: "desc" },
      })
    : null;

  const hasCompletedSalesOrConfirmedClient =
    marketSales.length > 0 || buyerRequest !== null;

  let projectedEconomicsPasses = false;
  let proceedsSummary: string[] | null = null;
  let resaleEconomicsJson: Record<string, unknown> | null = null;

  if (isResaleScenario && landed && (marketSales.length > 0 || buyerRequest)) {
    // Asks are NEVER treated as completed-sale proof: only MarketSale rows
    // (actual completed sales) set the market price. A buyer request sets a
    // confirmed ceiling instead.
    const avgSaleMinor =
      marketSales.length > 0
        ? Math.round(
            marketSales.reduce(
              (s: number, r: { priceMinor: number }) => s + r.priceMinor,
              0
            ) / marketSales.length
          )
        : null;
    const salePriceMinor = buyerRequest?.customerCeilingMinor ?? avgSaleMinor;
    if (salePriceMinor !== null) {
      const proceeds = buildResaleProceedsModel({
        salePriceMinor,
        currency,
        saleLabel:
          buyerRequest !== null
            ? "confirmed buyer request ceiling"
            : `average of ${marketSales.length} completed sale(s)`,
        saleBasis: buyerRequest !== null ? "user_set" : "observed",
        saleNote:
          buyerRequest !== null
            ? "Buyer confirmed they will pay up to this"
            : "Completed sales only — asks are never used",
      });
      proceedsSummary = summarizeProceedsModel(proceeds);

      const econ = calculateEconomics(
        {
          retail: { amountMinor: priceMinor!, currency },
          salesTax: { amountMinor: landed.lines[1].amountMinor, currency },
          inboundShipping: { amountMinor: landed.lines[2].amountMinor, currency },
          membershipOrEntryFee: { amountMinor: 0, currency },
          insurance: { amountMinor: 0, currency },
          importDuties: { amountMinor: 0, currency },
        },
        {
          salePrice: { amountMinor: proceeds.salePriceMinor, currency },
          platformFee: { amountMinor: proceeds.deductions[0].amountMinor, currency },
          paymentFee: { amountMinor: 0, currency },
          outboundShipping: { amountMinor: proceeds.deductions[1].amountMinor, currency },
          insurance: { amountMinor: 0, currency },
          returnsRiskReserve: { amountMinor: 0, currency },
        }
      );

      const econCategory = mapEconomicsCategory(input.sourceCategory);
      let passes = economicsPassesThreshold(econCategory, econ);
      // Owner thresholds override the category defaults when set.
      if (prefs?.minRoi != null) passes = econ.roi >= prefs.minRoi;
      if (prefs?.minProfitMinor != null)
        passes = passes && econ.netProfitMinor >= prefs.minProfitMinor;
      projectedEconomicsPasses = passes;

      resaleEconomicsJson = {
        salePriceMinor: proceeds.salePriceMinor,
        saleBasis: proceeds.saleBasis,
        saleLabel: proceeds.saleLabel,
        netProceedsMinor: proceeds.netMinor,
        netProfitMinor: econ.netProfitMinor,
        roi: econ.roi,
        thresholdCategory: econCategory,
        passes,
      };
    }
  }

  // ---- Factual economics summary for the rationale ----
  const econLines: string[] = [];
  if (landed) {
    econLines.push(
      `Full cost ${landed.hasEstimates ? "≈" : ""}${formatMoneyMinor(landed.totalMinor, currency)}${
        landed.hasEstimates ? " (contains estimates)" : ""
      }:`
    );
    econLines.push(...summarizeCostModel(landed).map((l) => `  • ${l}`));
  } else {
    econLines.push("Full cost: unknown — no observed price.");
  }
  if (budgetMinor !== null) {
    econLines.push(`Budget: ${formatMoneyMinor(budgetMinor, currency)} (your setting)`);
  } else {
    econLines.push("Budget: not set — no cap applied (set it in Settings).");
  }
  if (proceedsSummary) {
    econLines.push(...proceedsSummary.map((l) => `  • ${l}`));
  } else if (isResaleScenario) {
    econLines.push("Resale economics: no completed sales or buyer request yet.");
  }
  const economicsSummary = econLines.join("\n");

  const ctx: DecisionContext = {
    expensiveItemOverride: { applies: expensiveOverrideApplies },
    buyNow: {
      productIdentified: true,
      sellerOfRecord,
      allowedSellers,
      evidenceLevel: input.evidenceLevel,
      isProblematicRetailer: false,
      availability: input.availability,
      checkoutPriceKnown,
      fullCostKnown,
      maxBuyPriceSet,
      quantityLimitSet,
      landedCostMinor: landedMinor,
      budgetMinor,
      isResaleScenario,
      hasCompletedSalesOrConfirmedClient,
      projectedEconomicsPasses,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    applyNow: null,
    prepare: {
      confirmedBySourceE2:
        input.evidenceLevel !== EvidenceLevel.E0_RUMOR &&
        input.evidenceLevel !== EvidenceLevel.E1_SIGNAL,
      dateAndTimeOfficial: false,
      timePrecision: "tba",
      isFirstGenerationTechAnnouncement: false,
      launchUrlKnown: Boolean(input.rawUrl),
      preparationActionsFormed: false,
    },
    clientFirst: null,
    fallbackHint: input.fallbackHint ?? "low_interest",
    score: DEFAULT_SCORE,
    evidenceLevel: input.evidenceLevel,
    sourceCount: 1,
    hasConflictingEvidence: false,
    economicsSummary,
  };

  const result = decide(ctx);

  const economicsJson: Record<string, unknown> | null = landed
    ? {
        ruleVersion: result.ruleVersion,
        currency,
        priceMinor,
        priceBasis: "observed",
        landed: {
          totalMinor: landed.totalMinor,
          hasEstimates: landed.hasEstimates,
          lines: landed.lines,
        },
        budgetMinor,
        budgetBasis: budgetMinor !== null ? "user_set" : "unset",
        resale: resaleEconomicsJson,
        marketSalesCount: marketSales.length,
        hasBuyerRequest: buyerRequest !== null,
        computedAt: new Date().toISOString(),
      }
    : null;

  return { result, economicsJson, priceUsd };
}
