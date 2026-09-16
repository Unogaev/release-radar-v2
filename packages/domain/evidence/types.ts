// packages/domain/evidence/types.ts
//
// Types for the Evidence Ladder (spec §6) and Availability State Machine (spec §8).
// This module has ZERO framework dependencies — no Prisma, no Next.js — so it can
// be tested in isolation and reused by both apps/web and apps/worker (Phase 2).

/** Evidence Ladder levels, spec §6. Ordered weakest → strongest. */
export enum EvidenceLevel {
  E0_RUMOR = "E0_RUMOR",
  E1_SIGNAL = "E1_SIGNAL",
  E2_OFFICIAL = "E2_OFFICIAL",
  E3_ACTIONABLE = "E3_ACTIONABLE",
  E4_CART_VERIFIED = "E4_CART_VERIFIED",
  E5_USER_CONFIRMED = "E5_USER_CONFIRMED",
}

/** Numeric rank for comparisons (higher = stronger evidence). */
export const EVIDENCE_LEVEL_RANK: Record<EvidenceLevel, number> = {
  [EvidenceLevel.E0_RUMOR]: 0,
  [EvidenceLevel.E1_SIGNAL]: 1,
  [EvidenceLevel.E2_OFFICIAL]: 2,
  [EvidenceLevel.E3_ACTIONABLE]: 3,
  [EvidenceLevel.E4_CART_VERIFIED]: 4,
  [EvidenceLevel.E5_USER_CONFIRMED]: 5,
};

export function evidenceAtLeast(level: EvidenceLevel, minimum: EvidenceLevel): boolean {
  return EVIDENCE_LEVEL_RANK[level] >= EVIDENCE_LEVEL_RANK[minimum];
}

/**
 * Availability State Machine, spec §8. Any backward transition is allowed —
 * e.g. ACTIONABLE → UNAVAILABLE must immediately close BUY_NOW.
 */
export enum AvailabilityState {
  UNKNOWN = "UNKNOWN",
  ANNOUNCED = "ANNOUNCED",
  SCHEDULED = "SCHEDULED",
  LIVE_UNVERIFIED = "LIVE_UNVERIFIED",
  ACTIONABLE = "ACTIONABLE",
  CART_VERIFIED = "CART_VERIFIED",
  USER_ORDERED = "USER_ORDERED",
  SOLD_OUT = "SOLD_OUT",
  UNAVAILABLE = "UNAVAILABLE",
  RESTOCK_CANDIDATE = "RESTOCK_CANDIDATE",
}

/**
 * "Технический regla доступности" (spec §6) — these fields are stored
 * SEPARATELY and never collapsed into one boolean. When sources conflict,
 * the freshest user-facing UI/checkout observation wins over metadata.
 */
export interface AvailabilityEvidence {
  metadataStatus: string | null; // raw JSON-LD / schema.org / API status, lowest trust
  visibleUiStatus: string | null; // what a human sees rendered on the page
  ctaState: "absent" | "disabled" | "enabled" | null;
  variantAvailable: boolean | null;
  shippingState: "unavailable" | "available" | "unknown";
  pickupState: "unavailable" | "available" | "unknown";
  cartState: "not_attempted" | "add_to_cart_succeeded" | "add_to_cart_failed" | "unknown";
  checkoutState: "not_attempted" | "reached_checkout" | "blocked" | "unknown";
  sellerOfRecord: string | null; // must match an allowed seller for the product/category
  checkedAt: string; // ISO timestamp
  zip: string | null; // region the check was performed for
  sessionRegion: string | null;
  evidenceBlobRef: string | null; // pointer into EvidenceBlobStore (screenshot/DOM hash)
  sourceType: "official" | "market" | "signal";
}

/**
 * A single immutable evidence observation. New checks create NEW rows —
 * never mutate an existing one (spec §15: "evidence immutable; новая
 * проверка создаёт новую запись").
 */
export interface EvidenceRecord {
  id: string;
  productVariantId: string;
  level: EvidenceLevel;
  availability: AvailabilityEvidence;
  rawSnapshotRef: string; // hash/pointer to raw payload for audit/replay
  sourceId: string;
  parseVersion: string;
  observedAt: string; // ISO timestamp
}
