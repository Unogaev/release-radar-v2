// packages/testing/acceptance/AT-09.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { requiresClientFirstOverride } from "../../domain/decision/hardGates";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";
import { EvidenceLevel } from "../../domain/evidence/types";

export const AT09: AcceptanceTest = {
  id: "AT-09",
  title: "Expensive watch $50,000, application open, no client — never BUY_NOW",
  run: () => {
    const t = new TestContext();

    const overrideApplies = requiresClientFirstOverride({
      priceUsd: 50_000,
      category: "watch",
      provenScarcity: true,
      crossBorderComplexity: false,
    });
    t.assertTrue(overrideApplies, "AT-09 override applies for watch > $10,000");

    // Even with a BUY_NOW gate input that would otherwise PASS (full valid
    // evidence, seller, price, limits), the override must still block it.
    const suspiciouslyPerfectBuyNowInput = {
      productIdentified: true,
      sellerOfRecord: "official-boutique",
      allowedSellers: ["official-boutique"],
      evidenceLevel: EvidenceLevel.E4_CART_VERIFIED,
      isProblematicRetailer: false,
      availability: {
        metadataStatus: "InStock",
        visibleUiStatus: "In Stock",
        ctaState: "enabled" as const,
        variantAvailable: true,
        shippingState: "available" as const,
        pickupState: "unavailable" as const,
        cartState: "add_to_cart_succeeded" as const,
        checkoutState: "reached_checkout" as const,
        sellerOfRecord: "official-boutique",
        checkedAt: "2026-09-01T12:00:00Z",
        zip: "33160",
        sessionRegion: "US-FL",
        evidenceBlobRef: "blob:at09-snapshot",
        sourceType: "official" as const,
      },
      checkoutPriceKnown: true,
      fullCostKnown: true,
      maxBuyPriceSet: true,
      quantityLimitSet: true,
      isResaleScenario: false,
      hasCompletedSalesOrConfirmedClient: false,
      projectedEconomicsPasses: false,
      hasBlockingLegalOrLogisticsRisk: false,
    };

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: true },
      buyNow: suspiciouslyPerfectBuyNowInput,
      applyNow: {
        applicationOrRaffleOpen: true,
        closingTimeKnown: true,
        rulesKnown: true,
        autoChargeDisclosed: true,
        eligibilityKnown: true,
        userUnderstandsWinOutcome: true,
      },
      prepare: null,
      clientFirst: null,
      fallbackHint: "low_interest",
      score: { demand: 90, scarcity: 95, margin: 80, access: 60, logistics: 70, userFit: 80 },
      evidenceLevel: EvidenceLevel.E4_CART_VERIFIED,
      sourceCount: 2,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);

    t.assertTrue(result.status !== DecisionStatus.BUY_NOW, "AT-09 BUY_NOW must never be produced");
    t.assertEqual(result.status, DecisionStatus.APPLY_NOW, "AT-09 status is APPLY_NOW");

    return t.failures;
  },
};
