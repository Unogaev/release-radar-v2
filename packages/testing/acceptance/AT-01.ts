// packages/testing/acceptance/AT-01.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence } from "../../domain/evidence/types";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT01: AcceptanceTest = {
  id: "AT-01",
  title: "Best Buy false positive — metadata Pre-order, UI Coming Soon, CTA disabled",
  run: () => {
    const t = new TestContext();

    const availability: AvailabilityEvidence = {
      metadataStatus: "Pre-order",
      visibleUiStatus: "Coming Soon",
      ctaState: "disabled",
      variantAvailable: null,
      shippingState: "unknown",
      pickupState: "unknown",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: "bestbuy",
      checkedAt: "2026-09-01T12:00:00Z",
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: "blob:at01-snapshot",
      sourceType: "official",
    };

    const evidenceLevel = classifyEvidenceLevel(availability);

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: "bestbuy",
        allowedSellers: ["bestbuy", "microsoft-store"],
        evidenceLevel,
        isProblematicRetailer: true,
        availability,
        checkoutPriceKnown: true,
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
      fallbackHint: "restock_candidate",
      score: { demand: 70, scarcity: 60, margin: 50, access: 20, logistics: 60, userFit: 40 },
      evidenceLevel,
      sourceCount: 1,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);

    t.assertEqual(result.status, DecisionStatus.WATCH_RESTOCK, "AT-01 status");
    t.assertTrue(result.status !== DecisionStatus.BUY_NOW, "AT-01 BUY_NOW must be forbidden");
    t.assertIncludes(result.blockedReasons, "CTA", "AT-01 blocked reasons mention CTA");

    return t.failures;
  },
};
