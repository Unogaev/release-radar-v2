// packages/testing/acceptance/AT-04.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { classifyEvidenceLevel } from "../../domain/evidence/ladder";
import { AvailabilityEvidence } from "../../domain/evidence/types";
import { decide, DecisionContext } from "../../domain/decision/decisionEngine";
import { DecisionStatus } from "../../domain/decision/types";

export const AT04: AcceptanceTest = {
  id: "AT-04",
  title: "Travis missed drop — sold out + buyer request -> SOURCE_NOW, then restock -> BUY_NOW",
  run: () => {
    const t = new TestContext();

    // --- Scenario A: sold out, athlete debut, buyer request exists ---
    const soldOutAvailability: AvailabilityEvidence = {
      metadataStatus: "SoldOut",
      visibleUiStatus: "Sold Out",
      ctaState: "disabled",
      variantAvailable: false,
      shippingState: "unavailable",
      pickupState: "unavailable",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: "nike-official",
      checkedAt: "2026-09-01T18:00:00Z",
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: "blob:at04-soldout",
      sourceType: "official",
    };
    const soldOutLevel = classifyEvidenceLevel(soldOutAvailability);

    const ctxSoldOut: DecisionContext = {
      expensiveItemOverride: { applies: false },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: "nike-official",
        allowedSellers: ["nike-official"],
        evidenceLevel: soldOutLevel,
        isProblematicRetailer: false,
        availability: soldOutAvailability,
        checkoutPriceKnown: false,
        fullCostKnown: false,
        maxBuyPriceSet: false,
        quantityLimitSet: false,
        isResaleScenario: true,
        hasCompletedSalesOrConfirmedClient: true, // completed sales above retail exist
        projectedEconomicsPasses: false, // can't buy retail — it's sold out
        hasBlockingLegalOrLogisticsRisk: false,
      },
      applyNow: null,
      prepare: null,
      clientFirst: {
        hasBuyerRequest: true, // US 6.5/7/10/12 buyer requests
        priceTooHighForInventoryRisk: false,
        variantDetailsSaved: true,
        deadlineSaved: true,
        customerCeilingSaved: true,
        sourceCostBelowMaxSourcePrice: null,
      },
      fallbackHint: "restock_candidate",
      score: { demand: 90, scarcity: 85, margin: 60, access: 10, logistics: 70, userFit: 60 },
      evidenceLevel: soldOutLevel,
      sourceCount: 3,
      hasConflictingEvidence: false,
    };

    const resultSoldOut = decide(ctxSoldOut);
    t.assertEqual(resultSoldOut.status, DecisionStatus.SOURCE_NOW, "AT-04a status is SOURCE_NOW");

    // --- Scenario B: official retail restock, economics now pass ---
    const restockAvailability: AvailabilityEvidence = {
      ...soldOutAvailability,
      metadataStatus: "InStock",
      visibleUiStatus: "In Stock",
      ctaState: "enabled",
      variantAvailable: true,
      shippingState: "available",
      cartState: "add_to_cart_succeeded",
      checkoutState: "reached_checkout",
      checkedAt: "2026-09-05T10:00:00Z",
    };
    const restockLevel = classifyEvidenceLevel(restockAvailability);

    const ctxRestock: DecisionContext = {
      ...ctxSoldOut,
      buyNow: {
        ...ctxSoldOut.buyNow,
        evidenceLevel: restockLevel,
        availability: restockAvailability,
        checkoutPriceKnown: true,
        fullCostKnown: true,
        maxBuyPriceSet: true,
        quantityLimitSet: true,
        projectedEconomicsPasses: true, // now economics pass at restock retail price
      },
      evidenceLevel: restockLevel,
    };

    const resultRestock = decide(ctxRestock);
    t.assertEqual(resultRestock.status, DecisionStatus.BUY_NOW, "AT-04b status is BUY_NOW after restock");

    return t.failures;
  },
};
