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
      const words = text.split(/\s+/).filter(Boolean);
      const brand = words[0] ?? "Unknown";
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

      return {
        metadataStatus: data?.availability ?? null,
        visibleUiStatus: data?.availability ?? null,
        ctaState: data?.availability === "InStock" ? "enabled" : data?.availability ? "disabled" : null,
        variantAvailable: data?.availability === "InStock" ? true : data?.availability ? false : null,
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
