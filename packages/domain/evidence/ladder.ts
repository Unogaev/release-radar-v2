// packages/domain/evidence/ladder.ts
//
// Implements spec §6 exactly:
//   - "Запрет на ложный BUY NOW" — a list of conditions, ANY of which blocks
//     BUY_NOW regardless of how high the evidence level or score is.
//   - Classification of raw evidence into an EvidenceLevel.
//
// This is the single most safety-critical file in the domain layer: AT-01
// and AT-02 exist specifically to prove this logic never lets a metadata-only
// signal produce BUY_NOW.

import { AvailabilityEvidence, EvidenceLevel } from "./types";

export interface BuyNowBlockReason {
  code: string;
  message: string;
}

/**
 * Returns the list of reasons BUY_NOW is blocked for this availability
 * evidence, per the exact bullet list in spec §6 "Запрет на ложный BUY NOW".
 * An empty array means none of the listed prohibitions apply — this does
 * NOT by itself mean BUY_NOW is allowed; see hardGates.ts for the full gate.
 */
export function findBuyNowBlockReasons(
  evidence: AvailabilityEvidence,
  allowedSellers: string[]
): BuyNowBlockReason[] {
  const reasons: BuyNowBlockReason[] = [];

  // "доступность взята только из JSON-LD, schema.org, поискового сниппета
  // или кэша" — i.e. we have metadata but no live UI/cart observation.
  if (evidence.sourceType === "official" && !evidence.visibleUiStatus) {
    reasons.push({
      code: "METADATA_ONLY",
      message:
        "Availability derived only from metadata/snippet — no live UI observation.",
    });
  }

  if (evidence.ctaState === "absent" || evidence.ctaState === "disabled" || evidence.ctaState === null) {
    reasons.push({ code: "CTA_NOT_ACTIONABLE", message: "CTA is absent or disabled." });
  }

  const blockedUiStatuses = ["coming soon", "unavailable", "sold out", "currently unavailable"];
  if (
    evidence.visibleUiStatus &&
    blockedUiStatuses.some((s) => evidence.visibleUiStatus!.toLowerCase().includes(s))
  ) {
    reasons.push({
      code: "BLOCKED_UI_STATUS",
      message: `Visible UI status "${evidence.visibleUiStatus}" indicates unavailability.`,
    });
  }

  if (evidence.shippingState === "unavailable" && evidence.pickupState === "unavailable") {
    reasons.push({
      code: "NO_FULFILLMENT",
      message: "Neither shipping nor pickup is available for the checked region.",
    });
  }
  if (evidence.shippingState === "unknown" && evidence.pickupState === "unknown") {
    reasons.push({
      code: "FULFILLMENT_UNKNOWN",
      message: "Shipping/pickup availability for the region was never checked.",
    });
  }

  if (!evidence.sellerOfRecord || !allowedSellers.includes(evidence.sellerOfRecord)) {
    reasons.push({
      code: "SELLER_NOT_ALLOWED",
      message: `Seller of record "${evidence.sellerOfRecord ?? "unknown"}" is not on the allowed list for this product/category.`,
    });
  }

  if (evidence.variantAvailable === false || evidence.variantAvailable === null) {
    reasons.push({
      code: "VARIANT_NOT_CONFIRMED_AVAILABLE",
      message: "The specific variant's availability was not confirmed.",
    });
  }

  return reasons;
}

/**
 * Classifies a raw signal into an EvidenceLevel. This is intentionally
 * conservative: it only ever assigns the level the evidence unambiguously
 * supports, never upgrades on the strength of hype/social signals (spec §3.2:
 * "Пост знаменитости ... повышают приоритет проверки, но не доказывают
 * retail, наличие или цену продажи").
 */
export function classifyEvidenceLevel(evidence: AvailabilityEvidence): EvidenceLevel {
  if (evidence.checkoutState === "reached_checkout" || evidence.cartState === "add_to_cart_succeeded") {
    return EvidenceLevel.E4_CART_VERIFIED;
  }

  const hasLiveCta = evidence.ctaState === "enabled";
  const hasFulfillment =
    evidence.shippingState === "available" || evidence.pickupState === "available";
  if (hasLiveCta && hasFulfillment && evidence.sourceType === "official") {
    return EvidenceLevel.E3_ACTIONABLE;
  }

  if (evidence.sourceType === "official") {
    return EvidenceLevel.E2_OFFICIAL;
  }

  if (evidence.sourceType === "signal") {
    return EvidenceLevel.E1_SIGNAL;
  }

  return EvidenceLevel.E0_RUMOR;
}
