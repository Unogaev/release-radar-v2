// TEST_FIXTURE — deterministic, offline test of the domain decision engine.
// Calls the REAL production decide()/classifyEvidenceLevel() functions with
// hand-built AvailabilityEvidence fixtures. NO database writes, NO network calls.
// Cannot leak into production feed, analytics, or notifications.
// Never import this file from application code.

import { decide, DecisionContext } from "../../../packages/domain/decision/decisionEngine";
import { classifyEvidenceLevel } from "../../../packages/domain/evidence/ladder";
import type { AvailabilityEvidence } from "../../../packages/domain/evidence/types";

const ALLOWED_SELLERS = ["Nike.com"];

function baseEvidence(overrides: Partial<AvailabilityEvidence>): AvailabilityEvidence {
  return {
    sourceType: "official",
    metadataStatus: "found",
    visibleUiStatus: "unknown",
    ctaState: "unknown",
    variantAvailable: null,
    shippingState: "unknown",
    pickupState: "unknown",
    cartState: "unknown",
    checkoutState: "unknown",
    sellerOfRecord: null,
    zip: "33101",
    sessionRegion: "US-FL",
    evidenceBlobRef: "TEST_FIXTURE",
    ...overrides,
  } as AvailabilityEvidence;
}

type Scenario = {
  name: string;
  evidence: AvailabilityEvidence;
  buyNowOverrides: Partial<DecisionContext["buyNow"]>;
  fallbackHint: DecisionContext["fallbackHint"];
};

const scenarios: Scenario[] = [
  {
    name: "[TEST] InStock — full happy path",
    evidence: baseEvidence({
      visibleUiStatus: "in_stock", ctaState: "enabled", variantAvailable: true,
      shippingState: "available", pickupState: "available",
      cartState: "add_to_cart_succeeded", checkoutState: "reached_checkout",
      sellerOfRecord: "Nike.com",
    }),
    buyNowOverrides: {
      checkoutPriceKnown: true, fullCostKnown: true, maxBuyPriceSet: true, quantityLimitSet: true,
      isResaleScenario: true, hasCompletedSalesOrConfirmedClient: true, projectedEconomicsPasses: true,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    fallbackHint: "low_interest",
  },
  {
    name: "[TEST] OutOfStock",
    evidence: baseEvidence({
      visibleUiStatus: "out_of_stock", ctaState: "disabled", variantAvailable: false,
      shippingState: "unavailable", pickupState: "unavailable",
      cartState: "add_to_cart_failed", checkoutState: "not_attempted",
      sellerOfRecord: "Nike.com",
    }),
    buyNowOverrides: {
      checkoutPriceKnown: false, fullCostKnown: false, maxBuyPriceSet: false, quantityLimitSet: false,
      isResaleScenario: false, hasCompletedSalesOrConfirmedClient: false, projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    fallbackHint: "insufficient_evidence",
  },
  {
    name: "[TEST] Marketplace seller (not on allowed list)",
    evidence: baseEvidence({
      visibleUiStatus: "in_stock", ctaState: "enabled", variantAvailable: true,
      shippingState: "available", pickupState: "available",
      cartState: "add_to_cart_succeeded", checkoutState: "reached_checkout",
      sellerOfRecord: "eBay Reseller #4821",
    }),
    buyNowOverrides: {
      checkoutPriceKnown: true, fullCostKnown: true, maxBuyPriceSet: true, quantityLimitSet: true,
      isResaleScenario: true, hasCompletedSalesOrConfirmedClient: true, projectedEconomicsPasses: true,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    fallbackHint: "insufficient_evidence",
  },
  {
    name: "[TEST] Price above limit (no max buy price ceiling set)",
    evidence: baseEvidence({
      visibleUiStatus: "in_stock", ctaState: "enabled", variantAvailable: true,
      shippingState: "available", pickupState: "available",
      cartState: "add_to_cart_succeeded", checkoutState: "reached_checkout",
      sellerOfRecord: "Nike.com",
    }),
    buyNowOverrides: {
      checkoutPriceKnown: true, fullCostKnown: true,
      maxBuyPriceSet: false, quantityLimitSet: false,
      isResaleScenario: true, hasCompletedSalesOrConfirmedClient: true, projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    fallbackHint: "low_interest",
  },
  {
    name: "[TEST] Missing checkout button / CTA disabled",
    evidence: baseEvidence({
      visibleUiStatus: "in_stock", ctaState: "disabled", variantAvailable: true,
      shippingState: "available", pickupState: "available",
      cartState: "add_to_cart_failed", checkoutState: "not_attempted",
      sellerOfRecord: "Nike.com",
    }),
    buyNowOverrides: {
      checkoutPriceKnown: false, fullCostKnown: false, maxBuyPriceSet: false, quantityLimitSet: false,
      isResaleScenario: false, hasCompletedSalesOrConfirmedClient: false, projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
    },
    fallbackHint: "local_clearance_unconfirmed",
  },
];

console.log("=== FIXTURE E2E TEST — domain decision engine (TEST DATA, no DB, no network) ===\n");

for (const s of scenarios) {
  const evidenceLevel = classifyEvidenceLevel(s.evidence);
  const ctx: DecisionContext = {
    expensiveItemOverride: { applies: false },
    buyNow: {
      productIdentified: true,
      sellerOfRecord: s.evidence.sellerOfRecord,
      allowedSellers: ALLOWED_SELLERS,
      evidenceLevel,
      isProblematicRetailer: false,
      availability: s.evidence,
      checkoutPriceKnown: false, fullCostKnown: false, maxBuyPriceSet: false, quantityLimitSet: false,
      isResaleScenario: false, hasCompletedSalesOrConfirmedClient: false, projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
      ...s.buyNowOverrides,
    },
    applyNow: null,
    prepare: null,
    clientFirst: null,
    fallbackHint: s.fallbackHint,
    score: {} as any,
    evidenceLevel,
    sourceCount: 1,
    hasConflictingEvidence: false,
  };

  const result = decide(ctx);
  console.log(s.name);
  console.log(`  evidenceLevel: ${evidenceLevel}`);
  console.log(`  status: ${result.status}`);
  console.log(`  rationale: ${result.rationale}`);
  if (result.blockedReasons?.length) {
    console.log("  blockedReasons:");
    for (const r of result.blockedReasons) console.log(`    - ${r}`);
  }
  console.log("");
}

console.log("=== END FIXTURE TEST — nothing above touched the database or any real source ===");
