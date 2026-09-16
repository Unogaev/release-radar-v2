// packages/testing/acceptance/AT-02.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence } from "../../domain/evidence/types";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT02: AcceptanceTest = {
  id: "AT-02",
  title: "PlayStation Direct transient status — indexed status flipped, live UI still Unavailable",
  run: () => {
    const t = new TestContext();

    // Conflict: an indexable/API-derived status briefly showed availability,
    // but the freshest live-UI observation says Currently Unavailable.
    // Per spec §6: "При конфликте источников побеждает самый свежий
    // пользовательский UI/checkout, а не метаданные."
    const availability: AvailabilityEvidence = {
      metadataStatus: "InStock", // stale/transient indexed signal
      visibleUiStatus: "Currently Unavailable", // freshest live UI observation — wins
      ctaState: "disabled",
      variantAvailable: null,
      shippingState: "unavailable",
      pickupState: "unavailable",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: "playstation-direct",
      checkedAt: "2026-09-01T12:05:00Z",
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: "blob:at02-snapshot",
      sourceType: "official",
    };

    const evidenceLevel = classifyEvidenceLevel(availability);

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: "playstation-direct",
        allowedSellers: ["playstation-direct"],
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
      score: { demand: 75, scarcity: 70, margin: 50, access: 20, logistics: 60, userFit: 40 },
      evidenceLevel,
      // hasConflictingEvidence=true is the whole point of this test — the
      // metadata and live-UI observations disagree, and that conflict must
      // be recorded (surfaced via a lower evidenceConfidence), not silently
      // resolved by trusting the more optimistic source.
      sourceCount: 2,
      hasConflictingEvidence: true,
    };

    const result = decide(ctx);
    const baselineConfidence = 70; // same inputs but hasConflictingEvidence=false would score higher

    t.assertEqual(result.status, DecisionStatus.WATCH_RESTOCK, "AT-02 status");
    t.assertTrue(result.status !== DecisionStatus.BUY_NOW, "AT-02 BUY_NOW must be forbidden");
    t.assertTrue(
      result.evidenceConfidence < baselineConfidence,
      "AT-02 evidence conflict must lower evidenceConfidence (conflict recorded)"
    );

    return t.failures;
  },
};
