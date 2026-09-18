// packages/adapters/mowalola.ts
//
// Real SourceAdapter implementation for mowalola.com official site.
// Discovers the "MOWALOLA X JORDAN" / "SIGN UP FOR EARLY ACCESS" banner
// that is live on the homepage as of 2026-09-18. Only ever reports what is
// literally present in the fetched HTML - no SKU, no price, no photo. Those
// come from a separate enrichment step against independently-verified
// secondary sources (see the enrichment section of the cron route).

import type {
  SourceAdapter,
  RawSignal,
  ProductCandidate,
  OfferTarget,
  CheckContext,
  NormalizedEvidence,
  SourceHealth,
} from "./SourceAdapter";
import type { AvailabilityEvidence } from "../domain/evidence/types";

const OFFICIAL_URL = "https://www.mowalola.com/";
const BANNER_PATTERN = /SIGN\s*UP\s*FOR\s*EARLY\s*ACCESS(?:\s*ON\s*(\d{1,2})\.(\d{1,2}))?/i;
const BRAND_PATTERN = /MOWALOLA\s*X\s*JORDAN/i;

function extractFragment(html: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(html.length, matchIndex + matchLength + 120);
  return html
    .slice(start, end)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class MowalolaAdapter implements SourceAdapter {
  private sourceId: string;

  constructor(sourceId: string) {
    this.sourceId = sourceId;
  }

  async discover(): Promise<RawSignal[]> {
    const res = await fetch(OFFICIAL_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (ReleaseRadarBot/1.0)" },
    });
    if (!res.ok) {
      throw new Error(`mowalola.com fetch failed: HTTP ${res.status}`);
    }
    const html = await res.text();

    const bannerMatch = BANNER_PATTERN.exec(html);
    const brandMatch = BRAND_PATTERN.exec(html);

    if (!bannerMatch || !brandMatch) {
      // Honest empty result: the banner is not on the page right now.
      return [];
    }

    const fragment = extractFragment(html, bannerMatch.index, bannerMatch[0].length);

    return [
      {
        sourceId: this.sourceId,
        rawText: fragment,
        url: OFFICIAL_URL,
        observedAt: new Date().toISOString(),
      },
    ];
  }

  async identify(raw: RawSignal): Promise<ProductCandidate[]> {
    // Deliberately generic: the page does not name a specific SKU/model, so
    // we do not invent one here. Enrichment (separate, cited sources) may
    // later attach a specific Identifier to this same ProductVariant.
    if (!BRAND_PATTERN.test(raw.rawText)) return [];
    return [
      {
        brand: "Mowalola",
        model: "x jordan early access",
        exactIdentifier: null,
        variant: null,
        confidence: 0.9,
      },
    ];
  }

  async checkAvailability(_target: OfferTarget, context: CheckContext): Promise<AvailabilityEvidence> {
    // Re-fetch fresh rather than reuse discover()'s snapshot, so checkedAt
    // and the observed state are always current at call time.
    const res = await fetch(OFFICIAL_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (ReleaseRadarBot/1.0)" },
    });
    const html = res.ok ? await res.text() : "";
    const hasBanner = BANNER_PATTERN.test(html);

    return {
      metadataStatus: null,
      // Exactly what a human sees rendered - the literal banner text, or
      // null if it is gone (product may have moved past early access).
      visibleUiStatus: hasBanner ? "sign up for early access" : null,
      // The signup button is a real, working CTA, but it is an email-capture
      // form, not a purchase/add-to-cart action - so it does NOT count as an
      // actionable purchase CTA per the evidence ladder's semantics.
      ctaState: null,
      variantAvailable: null,
      shippingState: "unknown",
      pickupState: "unknown",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: hasBanner ? "mowalola.com" : null,
      checkedAt: new Date().toISOString(),
      zip: context.zip,
      sessionRegion: context.sessionRegion,
      evidenceBlobRef: null,
      sourceType: "official",
    };
  }

  async normalize(raw: unknown): Promise<NormalizedEvidence> {
    return { productVariantId: null, availability: raw as AvailabilityEvidence };
  }

  async healthCheck(): Promise<SourceHealth> {
    try {
      const res = await fetch(OFFICIAL_URL, { method: "HEAD" });
      return {
        status: res.ok ? "ok" : "degraded",
        lastSuccessAt: res.ok ? new Date().toISOString() : null,
      };
    } catch {
      return { status: "down", lastSuccessAt: null };
    }
  }
}

/** Parses "19.09" into a real Date, assuming the announced month/day is
 * upcoming relative to now; rolls to next year only if that date has
 * already passed by more than a week (handles year-boundary announcements). */
export function parseAnnouncedDate(day: number, month: number, now: Date = new Date()): Date {
  const year = now.getFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  if (candidate.getTime() < now.getTime() - oneWeekMs) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day, 12, 0, 0));
  }
  return candidate;
}
