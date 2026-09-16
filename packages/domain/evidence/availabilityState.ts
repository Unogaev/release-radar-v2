// packages/domain/evidence/availabilityState.ts
//
// Spec §8: "Любое изменение назад разрешено. Например, ACTIONABLE →
// UNAVAILABLE немедленно закрывает BUY_NOW."
//
// This module does not enforce a strict forward-only graph — backward
// transitions are always valid, mirroring reality (a product can go
// SOLD_OUT at any moment). What it DOES enforce is closing dependent state:
// any transition into a terminal-negative state must flag the caller to
// re-run the decision engine, which will naturally re-block BUY_NOW because
// the evidence no longer supports it.

import { AvailabilityState } from "./types";

const NEGATIVE_STATES = new Set<AvailabilityState>([
  AvailabilityState.SOLD_OUT,
  AvailabilityState.UNAVAILABLE,
]);

export interface AvailabilityTransition {
  from: AvailabilityState;
  to: AvailabilityState;
  requiresDecisionRecheck: boolean;
  closesBuyNow: boolean;
}

export function transitionAvailability(
  from: AvailabilityState,
  to: AvailabilityState
): AvailabilityTransition {
  const wasActionable =
    from === AvailabilityState.ACTIONABLE ||
    from === AvailabilityState.CART_VERIFIED;
  const closesBuyNow = wasActionable && NEGATIVE_STATES.has(to);

  return {
    from,
    to,
    // Any transition triggers a re-check — cheap and safe; the spec's
    // TTL/stale-invalidator rule (§17) means we never trust an old
    // ACTIONABLE state to still hold true anyway.
    requiresDecisionRecheck: true,
    closesBuyNow,
  };
}

/** Restock re-opens the pipeline at RESTOCK_CANDIDATE, not directly ACTIONABLE. */
export function markRestockCandidate(): AvailabilityState {
  return AvailabilityState.RESTOCK_CANDIDATE;
}
