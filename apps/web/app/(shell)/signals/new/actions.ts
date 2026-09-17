"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { classifyEvidenceLevel } from "@domain/evidence/ladder";
import { AvailabilityEvidence } from "@domain/evidence/types";
import {
  decide,
  DecisionContext,
  FallbackHint,
  requiresClientFirstOverride,
} from "@domain/decision/decisionEngine";
import { ScoreComponents } from "@domain/scoring/score";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}
function num(formData: FormData, key: string, fallback = 0): number {
  const v = parseFloat(String(formData.get(key) ?? ""));
  return isNaN(v) ? fallback : v;
}
function minor(formData: FormData, key: string): number {
  return Math.round(num(formData, key, 0) * 100);
}

export async function createSignal(formData: FormData) {
  const userId = await requireUserId();

  // ---- 1. Product identity ----
  const brand = str(formData, "brand");
  const model = str(formData, "model");
  const category = str(formData, "category") || "other";
  const variantLabel = str(formData, "variantLabel") || "default";
  const identifierValue = str(formData, "identifier");

  const product = await prisma.product.create({
    data: { brand, normalizedModel: model.toLowerCase(), category },
  });
  const productVariant = await prisma.productVariant.create({
    data: { productId: product.id, variantLabel },
  });
  if (identifierValue) {
    await prisma.identifier.create({
      data: { productVariantId: productVariant.id, kind: "sku", value: identifierValue },
    });
  }

  // ---- 2. Source (manual entry always uses a fixed "manual" source row) ----
  let manualSource = await prisma.source.findFirst({ where: { name: "manual-entry" } });
  if (!manualSource) {
    manualSource = await prisma.source.create({
      data: { name: "manual-entry", sourceClass: "A_truth", url: "", parseVersion: "manual-v1" },
    });
  }

  // ---- 3. Availability evidence, exactly the fields spec §6 requires ----
  const sellerOfRecord = str(formData, "sellerOfRecord") || null;
  const allowedSellers = str(formData, "allowedSellers")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const availability: AvailabilityEvidence = {
    metadataStatus: str(formData, "metadataStatus") || null,
    visibleUiStatus: str(formData, "visibleUiStatus") || null,
    ctaState: (str(formData, "ctaState") || null) as AvailabilityEvidence["ctaState"],
    variantAvailable: bool(formData, "variantAvailable"),
    shippingState: bool(formData, "shippingAvailable") ? "available" : "unavailable",
    pickupState: bool(formData, "pickupAvailable") ? "available" : "unavailable",
    cartState: bool(formData, "cartSucceeded") ? "add_to_cart_succeeded" : "not_attempted",
    checkoutState: bool(formData, "reachedCheckout") ? "reached_checkout" : "not_attempted",
    sellerOfRecord,
    checkedAt: new Date().toISOString(),
    zip: str(formData, "zip") || null,
    sessionRegion: "US-FL",
    evidenceBlobRef: null,
    sourceType: (str(formData, "sourceType") || "official") as AvailabilityEvidence["sourceType"],
  };

  const evidenceLevel = classifyEvidenceLevel(availability);

  await prisma.availabilityCheck.create({
    data: {
      productVariantId: productVariant.id,
      sourceId: manualSource.id,
      metadataStatus: availability.metadataStatus,
      visibleUiStatus: availability.visibleUiStatus,
      ctaState: availability.ctaState,
      variantAvailable: availability.variantAvailable,
      shippingState: availability.shippingState,
      pickupState: availability.pickupState,
      cartState: availability.cartState,
      checkoutState: availability.checkoutState,
      sellerOfRecord: availability.sellerOfRecord,
      zip: availability.zip,
      sessionRegion: availability.sessionRegion,
      evidenceBlobRef: availability.evidenceBlobRef,
      url: str(formData, "evidenceUrl") || null,
    },
  });

  await prisma.evidence.create({
    data: {
      productVariantId: productVariant.id,
      sourceId: manualSource.id,
      level: evidenceLevel,
      rawSnapshotRef: `manual:${Date.now()}`,
      parseVersion: "manual-v1",
      url: str(formData, "evidenceUrl") || null,
    },
  });

  // ---- 4. Optional release event ----
  const startAtRaw = str(formData, "startAt");
  const timePrecision = str(formData, "timePrecision") || "tba";
  if (startAtRaw || timePrecision !== "tba") {
    await prisma.releaseEvent.create({
      data: {
        productVariantId: productVariant.id,
        startAtUtc: startAtRaw ? new Date(startAtRaw) : null,
        sourceTimezone: "America/New_York",
        timePrecision,
      },
    });
  }

  // ---- 5. Economics / expensive-item override ----
  const priceUsd = num(formData, "retailPrice", 0);
  const isProblematicRetailer = bool(formData, "isProblematicRetailer");
  const isResaleScenario = bool(formData, "isResaleScenario");
  const expensiveOverrideApplies = requiresClientFirstOverride({
    priceUsd,
    category: (str(formData, "priceCategory") || "other") as
      | "watch"
      | "automotive"
      | "expensive_tech"
      | "other",
    provenScarcity: bool(formData, "provenScarcity"),
    crossBorderComplexity: bool(formData, "crossBorderComplexity"),
  });

  // ---- 6. Build DecisionContext and run the real engine ----
  const score: ScoreComponents = {
    demand: num(formData, "scoreDemand", 50),
    scarcity: num(formData, "scoreScarcity", 50),
    margin: num(formData, "scoreMargin", 50),
    access: num(formData, "scoreAccess", 50),
    logistics: num(formData, "scoreLogistics", 50),
    userFit: num(formData, "scoreUserFit", 50),
  };

  const ctx: DecisionContext = {
    expensiveItemOverride: { applies: expensiveOverrideApplies },
    buyNow: {
      productIdentified: Boolean(brand && model),
      sellerOfRecord,
      allowedSellers,
      evidenceLevel,
      isProblematicRetailer,
      availability,
      checkoutPriceKnown: priceUsd > 0,
      fullCostKnown: priceUsd > 0,
      maxBuyPriceSet: num(formData, "maxBuyPrice", 0) > 0,
      quantityLimitSet: num(formData, "quantityLimit", 0) > 0,
      isResaleScenario,
      hasCompletedSalesOrConfirmedClient: bool(formData, "hasCompletedSalesOrClient"),
      projectedEconomicsPasses: bool(formData, "economicsPasses"),
      hasBlockingLegalOrLogisticsRisk: bool(formData, "hasLegalRisk"),
    },
    applyNow: bool(formData, "isApplicationScenario")
      ? {
          applicationOrRaffleOpen: bool(formData, "applicationOpen"),
          closingTimeKnown: bool(formData, "closingTimeKnown"),
          rulesKnown: bool(formData, "rulesKnown"),
          autoChargeDisclosed: bool(formData, "autoChargeDisclosed"),
          eligibilityKnown: bool(formData, "eligibilityKnown"),
          userUnderstandsWinOutcome: bool(formData, "userUnderstandsWinOutcome"),
        }
      : null,
    prepare:
      timePrecision !== "tba" || bool(formData, "isFirstGenTech")
        ? {
            confirmedBySourceE2: evidenceLevel !== "E0_RUMOR" && evidenceLevel !== "E1_SIGNAL",
            dateAndTimeOfficial: Boolean(startAtRaw) && timePrecision === "exact",
            timePrecision: timePrecision as "exact" | "date_only" | "tba",
            isFirstGenerationTechAnnouncement: bool(formData, "isFirstGenTech"),
            launchUrlKnown: bool(formData, "launchUrlKnown"),
            preparationActionsFormed: bool(formData, "preparationActionsFormed"),
          }
        : {
            confirmedBySourceE2: false,
            dateAndTimeOfficial: false,
            timePrecision: "tba",
            isFirstGenerationTechAnnouncement: bool(formData, "isFirstGenTech"),
            launchUrlKnown: bool(formData, "launchUrlKnown"),
            preparationActionsFormed: bool(formData, "preparationActionsFormed"),
          },
    clientFirst: bool(formData, "isClientScenario")
      ? {
          hasBuyerRequest: bool(formData, "hasBuyerRequest"),
          priceTooHighForInventoryRisk: expensiveOverrideApplies,
          variantDetailsSaved: bool(formData, "variantDetailsSaved"),
          deadlineSaved: bool(formData, "deadlineSaved"),
          customerCeilingSaved: bool(formData, "customerCeilingSaved"),
          sourceCostBelowMaxSourcePrice: null,
        }
      : null,
    fallbackHint: (str(formData, "fallbackHint") || "low_interest") as FallbackHint,
    score,
    evidenceLevel,
    sourceCount: 1,
    hasConflictingEvidence: false,
  };

  const result = decide(ctx);

  const decision = await prisma.decision.create({
    data: {
      productVariantId: productVariant.id,
      status: result.status,
      ruleVersion: result.ruleVersion,
      rationale: result.rationale,
      blockedReasons: result.blockedReasons,
      evidenceConfidence: result.evidenceConfidence,
    },
  });

  redirect(`/signals/${decision.id}`);
}
