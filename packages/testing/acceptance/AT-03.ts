// packages/testing/acceptance/AT-03.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence, EvidenceLevel } from "../../domain/evidence/types";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT03: AcceptanceTest = {
  id: "AT-03",
  title: "SKYLRK successful path — official page, SKU, Ready to ship, Add to Cart succeeds",
  run: () => {
    const t = new TestContext();

    const availability: AvailabilityEvidence = {
      metadataStatus: "InStock",
      visibleUiStatus: "Ready to ship",
      ctaState: "enabled",
      variantAvailable: true,
      shippingState: "available",
      pickupState: "unavailable",
      cartState: "add_to_cart_succeeded",
      checkoutState: "reached_checkout",
      sellerOfRecord: "skylrk-official",
      checkedAt: "2026-09-01T15:00:00Z",
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: "blob:at03-snapshot",
      sourceType: "official",
    };

    const evidenceLevel = classifyEvidenceLevel(availability);
    t.assertEqual(evidenceLevel, EvidenceLevel.E4_CART_VERIFIED, "AT-03 evidence level reaches E4");

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true, // SKU SLE003-1011, exact model
        sellerOfRecord: "skylrk-official",
        allowedSellers: ["skylrk-official"],
        evidenceLevel,
        isProblematicRetailer: false,
        availability,
        checkoutPriceKnown: true, // $190
        fullCostKnown: true,
        maxBuyPriceSet: true,
        quantityLimitSet: true,
        isResaleScenario: false,
        hasCompletedSalesOrConfirmedClient: false,
        projectedEconomicsPasses: false,
        hasBlockingLegalOrLogisticsRisk: false,
      },
      applyNow: null,
      prepare: null,
      clientFirst: null,
      fallbackHint: "low_interest",
      score: { demand: 80, scarcity: 70, margin: 60, access: 90, logistics: 80, userFit: 70 },
      evidenceLevel,
      sourceCount: 1,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);

    t.assertEqual(result.status, DecisionStatus.BUY_NOW, "AT-03 status is BUY_NOW");
    t.assertEqual(result.blockedReasons.length, 0, "AT-03 no blocked reasons");

    return t.failures;
  },
};
