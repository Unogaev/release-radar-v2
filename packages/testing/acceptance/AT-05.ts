// packages/testing/acceptance/AT-05.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { checkPrepareGate } from "../../domain/decision/hardGates";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";
import { EvidenceLevel } from "../../domain/evidence/types";

export const AT05: AcceptanceTest = {
  id: "AT-05",
  title: "Time TBA — date confirmed but time only guessed by media",
  run: () => {
    const t = new TestContext();

    const gateResult = checkPrepareGate({
      confirmedBySourceE2: true,
      dateAndTimeOfficial: false, // only the date is official; time is a media guess
      timePrecision: "tba",
      isFirstGenerationTechAnnouncement: false,
      launchUrlKnown: true,
      preparationActionsFormed: true,
    });

    t.assertFalse(gateResult.passed, "AT-05 PREPARE gate must fail on TBA time");
    t.assertIncludes(gateResult.failedReasons, "TBA", "AT-05 failure reason mentions TBA");

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: null,
        allowedSellers: [],
        evidenceLevel: EvidenceLevel.E2_OFFICIAL,
        isProblematicRetailer: false,
        availability: {
          metadataStatus: null,
          visibleUiStatus: null,
          ctaState: null,
          variantAvailable: null,
          shippingState: "unknown",
          pickupState: "unknown",
          cartState: "not_attempted",
          checkoutState: "not_attempted",
          sellerOfRecord: null,
          checkedAt: "2026-09-01T00:00:00Z",
          zip: null,
          sessionRegion: null,
          evidenceBlobRef: null,
          sourceType: "official",
        },
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
        confirmedBySourceE2: true,
        dateAndTimeOfficial: false,
        timePrecision: "tba",
        isFirstGenerationTechAnnouncement: false,
        launchUrlKnown: true,
        preparationActionsFormed: true,
      },
      clientFirst: null,
      fallbackHint: "low_interest",
      // Genuinely interesting official announcement (just missing a confirmed
      // time) — weighted score must land in the "watch" band (>=65), not
      // "skip". This is what distinguishes AT-05 from a low-interest signal.
      score: { demand: 80, scarcity: 70, margin: 60, access: 70, logistics: 70, userFit: 70 },
      evidenceLevel: EvidenceLevel.E2_OFFICIAL,
      sourceCount: 1,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);

    // Never PREPARE (which would carry a 1h/opening-hour alarm) while TBA.
    t.assertTrue(result.status !== DecisionStatus.PREPARE, "AT-05 must not produce PREPARE while TBA");
    t.assertEqual(result.status, DecisionStatus.WATCH, "AT-05 status is WATCH");

    return t.failures;
  },
};
