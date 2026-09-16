// packages/testing/acceptance/AT-07.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence } from "../../domain/evidence/types";
import { checkBuyNowGate } from "../../domain/decision/hardGates";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT07: AcceptanceTest = {
  id: "AT-07",
  title: "Marketplace third-party seller — Amazon listing available but sold by a third party",
  run: () => {
    const t = new TestContext();

    const availability: AvailabilityEvidence = {
      metadataStatus: "InStock",
      visibleUiStatus: "In Stock",
      ctaState: "enabled",
      variantAvailable: true,
      shippingState: "available",
      pickupState: "unavailable",
      cartState: "add_to_cart_succeeded",
      checkoutState: "reached_checkout",
      sellerOfRecord: "third-party-marketplace-seller-xyz", // NOT "sold by Amazon"
      checkedAt: "2026-09-01T12:00:00Z",
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: "blob:at07-snapshot",
      sourceType: "official",
    };
    const evidenceLevel = classifyEvidenceLevel(availability);

    const buyNowInput = {
      productIdentified: true,
      sellerOfRecord: "third-party-marketplace-seller-xyz",
      allowedSellers: ["amazon", "walmart"], // only "sold by Amazon/Walmart" allowed, per spec §10
      evidenceLevel,
      isProblematicRetailer: false,
      availability,
      checkoutPriceKnown: true,
      fullCostKnown: true,
      maxBuyPriceSet: true,
      quantityLimitSet: true,
      isResaleScenario: false,
      hasCompletedSalesOrConfirmedClient: false,
      projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
    };

    const gateResult = checkBuyNowGate(buyNowInput);
    t.assertFalse(gateResult.passed, "AT-07 BUY_NOW gate must fail for third-party seller");
    t.assertIncludes(
      gateResult.failedReasons,
      "Seller of record",
      "AT-07 failure reason mentions seller of record"
    );

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: buyNowInput,
      applyNow: null,
      prepare: null,
      clientFirst: null,
      fallbackHint: "insufficient_evidence",
      score: { demand: 70, scarcity: 50, margin: 50, access: 70, logistics: 70, userFit: 50 },
      evidenceLevel,
      sourceCount: 1,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);
    t.assertEqual(result.status, DecisionStatus.VERIFY, "AT-07 status is VERIFY, not official stock");

    return t.failures;
  },
};
