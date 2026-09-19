import {
  SourceAdapter,
  RawSignal,
  ProductCandidate,
  OfferTarget,
  CheckContext,
  NormalizedEvidence,
  SourceHealth,
} from "@adapters/SourceAdapter";
import { AvailabilityEvidence } from "@domain/evidence/types";
import { fetchRssItems } from "./rss";
import { fetchStructuredProductData } from "./structuredData";

export interface GenericSourceConfig {
  sourceId: string;
  feedUrl: string;
  category: string;
  defaultBrand?: string;
}

export function createGenericRssAdapter(config: GenericSourceConfig): SourceAdapter {
  let lastStatus: SourceHealth = { status: "ok", lastSuccessAt: null };

  return {
    async discover(): Promise<RawSignal[]> {
      const items = await fetchRssItems(config.feedUrl);
      lastStatus = { status: "ok", lastSuccessAt: new Date().toISOString() };
      return items.map((it) => ({
        sourceId: config.sourceId,
        rawText: it.title,
        url: it.url || null,
        observedAt: it.publishedAt ?? new Date().toISOString(),
      }));
    },

    async identify(raw: RawSignal): Promise<ProductCandidate[]> {
      const text = raw.rawText;
      const RELEASE_PATTERNS: { regex: RegExp; confidence: number }[] = [
        { regex: /^(.+?)\s+launches\s+today(?:\s+on\s+(\w+))?/i, confidence: 0.85 },
        { regex: /^(.+?)\s+(?:is\s+)?available\s+now(?:\s+on\s+(\w+))?/i, confidence: 0.8 },
        { regex: /^(.+?)\s+out\s+now(?:\s+on\s+(\w+))?/i, confidence: 0.8 },
        { regex: /^(.+?)\s+launches\s+on\s+([A-Z][a-z]+ \d{1,2})/i, confidence: 0.75 },
        { regex: /^(.+?)\s+(?:releases|drops)\s+on\s+([A-Z][a-z]+ \d{1,2})/i, confidence: 0.75 },
      ];
      for (const { regex, confidence } of RELEASE_PATTERNS) {
        const match = regex.exec(text);
        if (match && match[1]) {
          return [
            {
              brand: config.defaultBrand ?? "Unknown",
              model: match[1].trim(),
              exactIdentifier: null,
              variant: match[2] ?? null,
              confidence,
            },
          ];
        }
      }
      const words = text.split(/\s+/).filter(Boolean);
      const brand = config.defaultBrand ?? (words[0] ?? "Unknown");
      return [
        {
          brand,
          model: text,
          exactIdentifier: null,
          variant: null,
          confidence: 0.3,
        },
      ];
    },

    async checkAvailability(_target: OfferTarget, context: CheckContext): Promise<AvailabilityEvidence> {
      return {
        metadataStatus: null,
        visibleUiStatus: null,
        ctaState: null,
        variantAvailable: null,
        shippingState: "unknown",
        pickupState: "unknown",
        cartState: "not_attempted",
        checkoutState: "not_attempted",
        sellerOfRecord: null,
        checkedAt: new Date().toISOString(),
        zip: context.zip,
        sessionRegion: context.sessionRegion,
        evidenceBlobRef: null,
        sourceType: "official",
      } as unknown as AvailabilityEvidence;
    },

    async normalize(raw: unknown): Promise<NormalizedEvidence> {
      return { productVariantId: null, availability: raw as AvailabilityEvidence };
    },

    async healthCheck(): Promise<SourceHealth> {
      return lastStatus;
    },
  };
}

export function createStructuredDataAdapter(config: { sourceId: string; productUrl: string }): SourceAdapter {
  let lastStatus: SourceHealth = { status: "ok", lastSuccessAt: null };

  return {
    async discover(): Promise<RawSignal[]> {
      return [
        {
          sourceId: config.sourceId,
          rawText: config.productUrl,
          url: config.productUrl,
          observedAt: new Date().toISOString(),
        },
      ];
    },

    async identify(raw: RawSignal): Promise<ProductCandidate[]> {
      const data = await fetchStructuredProductData(raw.url ?? config.productUrl);
      if (!data || !data.name) return [];
      return [
        {
          brand: data.brand ?? "Unknown",
          model: data.name,
          exactIdentifier: data.sku,
          variant: null,
          confidence: 0.8,
        },
      ];
    },

    async checkAvailability(_target: OfferTarget, context: CheckContext): Promise<AvailabilityEvidence> {
      const data = await fetchStructuredProductData(config.productUrl);
      lastStatus = {
        status: data ? "ok" : "degraded",
        lastSuccessAt: data ? new Date().toISOString() : lastStatus.lastSuccessAt,
      };

      const isInStock = data?.availability === "InStock";
      const hasData = data !== null;
      let sellerOfRecord: string | null = null;
      try {
        sellerOfRecord = new URL(config.productUrl).hostname.replace(/^www\./, "");
      } catch {
        sellerOfRecord = null;
      }

      return {
        metadataStatus: hasData ? "found" : null,
        visibleUiStatus: data?.availability ?? null,
        ctaState: isInStock ? "enabled" : hasData ? "disabled" : null,
        variantAvailable: isInStock ? true : hasData ? false : null,
        // Real signal from schema.org "InStock": the retailer itself reports the item as
        // purchasable/shippable. We cannot confirm in-store pickup from generic JSON-LD,
        // so pickupState stays "unknown" rather than guessed.
        shippingState: isInStock ? "available" : hasData ? "unavailable" : "unknown",
        pickupState: "unknown",
        cartState: "not_attempted",
        checkoutState: "not_attempted",
        // Honest inference: for a direct listing on the retailer's own domain, that domain
        // IS the seller of record. We do not fabricate this for marketplace/aggregator URLs.
        sellerOfRecord,
        checkedAt: new Date().toISOString(),
        zip: context.zip,
        sessionRegion: context.sessionRegion,
        evidenceBlobRef: null,
        sourceType: "official",
        priceUsd: data?.priceUsd ?? null,
      } as unknown as AvailabilityEvidence;
    },

    async normalize(raw: unknown): Promise<NormalizedEvidence> {
      return { productVariantId: null, availability: raw as AvailabilityEvidence };
    },

    async healthCheck(): Promise<SourceHealth> {
      return lastStatus;
    },
  };
}
