// packages/adapters/SourceAdapter.ts
//
// Spec §9 interface, verbatim contract (types filled in from domain models
// rather than left as `unknown`, but the four methods and healthCheck match
// exactly). Every real adapter (Phase 2) and every mock adapter (Phase 0/1)
// implements this same interface.

import { AvailabilityEvidence } from "../domain/evidence/types";

export interface RawSignal {
  sourceId: string;
  rawText: string;
  url: string | null;
  observedAt: string;
}

export interface ProductCandidate {
  brand: string;
  model: string;
  exactIdentifier: string | null;
  variant: string | null;
  confidence: number;
}

export interface OfferTarget {
  productVariantId: string;
  sellerId: string;
}

export interface CheckContext {
  zip: string;
  sessionRegion: string;
}

export interface NormalizedEvidence {
  productVariantId: string | null;
  availability: AvailabilityEvidence;
}

export interface SourceHealth {
  status: "ok" | "degraded" | "down";
  lastSuccessAt: string | null;
}

export interface SourceAdapter {
  discover(cursor?: string): Promise<RawSignal[]>;
  identify(raw: RawSignal): Promise<ProductCandidate[]>;
  checkAvailability(target: OfferTarget, context: CheckContext): Promise<AvailabilityEvidence>;
  normalize(raw: unknown): Promise<NormalizedEvidence>;
  healthCheck(): Promise<SourceHealth>;
}
