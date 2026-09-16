// packages/testing/acceptance/AT-10.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence } from "../../domain/evidence/types";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT10: AcceptanceTest = {
  id: "AT-10",
  title: "Local clearance viral screenshot — no store-level checkout confirmed",
  run: () => {
    const t = new TestContext();

    const availability: AvailabilityEvidence = {
      metadataStatus: null,
      visibleUiStatus: null, // no confirmed in-store checkout observation
      ctaState: null,
      variantAvailable: null,
      shippingState: "unknown",
      pickupState: "unknown",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: null, // specific store not confirmed
      checkedAt: "2026-09-01T09:00:00Z",
      zip: null, // no ZIP/store confirmed
      sessionRegion: null,
      evidenceBlobRef: "blob:at10-viral-screenshot", // a Reddit/Slickdeals screenshot only
      sourceType: "signal", // not official — this is a social/community report
    };
    const evidenceLevel = classifyEvidenceLevel(availability);

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: null,
        allowedSellers: ["target"],
        evidenceLevel,
        isProblematicRetailer: false,
        availability,
        checkoutPriceKnown: false, // "фактическая локальная цена" not confirmed
        fullCostKnown: false,
        maxBuyPriceSet: false,
        quantityLimitSet: false,
        isResaleScenario: true,
        hasCompletedSalesOrConfirmedClient: false,
        projectedEconomicsPasses: false,
        hasBlockingLegalOrLogisticsRisk: false,
      },
      applyNow: null,
      prepare: null,
      clientFirst: null,
      fallbackHint: "local_clearance_unconfirmed",
      score: { demand: 55, scarcity: 60, margin: 50, access: 30, logistics: 40, userFit: 30 },
      evidenceLevel,
      sourceCount: 1,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);

    t.assertEqual(result.status, DecisionStatus.VERIFY_IN_STORE, "AT-10 status is VERIFY_IN_STORE");
    t.assertTrue(result.status !== DecisionStatus.BUY_NOW, "AT-10 BUY_NOW must be forbidden");

    return t.failures;
  },
};
