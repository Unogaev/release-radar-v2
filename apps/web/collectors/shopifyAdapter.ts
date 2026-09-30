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

// Adapter for Shopify/Shopify Plus storefronts via the public products.json
// catalog endpoint. Unlike homepage HTML scraping (which returns almost
// nothing on JS-rendered stores), this gives real product titles, prices,
// images and per-variant availability — honest, structured, cheap.
// Verified live 2026-09-30: kith.com, shop.doverstreetmarket.com,
// rhodeskin.com.

interface ShopifyVariant {
  title?: string;
  price?: string;
  available?: boolean;
  sku?: string;
}

interface ShopifyProduct {
  title?: string;
  handle?: string;
  created_at?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  images?: Array<{ src?: string }>;
  variants?: ShopifyVariant[];
}

// Encoded into RawSignal.rawText so identify()/checkAvailability() can
// reuse the already-fetched catalog data without a second HTTP call.
interface ShopifySignalPayload {
  title: string;
  handle: string;
  vendor: string | null;
  productType: string | null;
  priceMin: number | null;
  priceMax: number | null;
  availableVariants: number;
  totalVariants: number;
  imageUrl: string | null;
  createdAt: string | null;
}

async function fetchCatalog(storeUrl: string, limit: number): Promise<ShopifyProduct[]> {
  const origin = storeUrl.replace(/\/+$/, "");
  const endpoint = `${origin}/products.json?limit=${Math.min(Math.max(limit, 1), 250)}`;
  const res = await fetch(endpoint, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "ReleaseRadarBot/1.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Shopify catalog fetch failed: ${res.status} ${endpoint}`);
  const data = (await res.json()) as { products?: ShopifyProduct[] };
  return Array.isArray(data.products) ? data.products : [];
}

function toPayload(origin: string, p: ShopifyProduct): ShopifySignalPayload | null {
  const title = String(p.title ?? "").trim();
  const handle = String(p.handle ?? "").trim();
  if (!title || !handle) return null;
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const prices = variants
    .map((v) => parseFloat(v.price ?? ""))
    .filter((n) => Number.isFinite(n));
  return {
    title,
    handle,
    vendor: p.vendor ? String(p.vendor) : null,
    productType: p.product_type ? String(p.product_type) : null,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    availableVariants: variants.filter((v) => v.available).length,
    totalVariants: variants.length,
    imageUrl: p.images?.[0]?.src ?? null,
    createdAt: p.created_at ?? null,
  };
}

function parsePayload(rawText: string): ShopifySignalPayload | null {
  try {
    const p = JSON.parse(rawText) as ShopifySignalPayload;
    return p && p.title && p.handle ? p : null;
  } catch {
    return null;
  }
}

export function createShopifyAdapter(config: {
  sourceId: string;
  storeUrl: string;
}): SourceAdapter {
  const origin = config.storeUrl.replace(/\/+$/, "");
  let lastStatus: SourceHealth = { status: "ok", lastSuccessAt: null };
  // The pipeline calls identify(raw) then checkAvailability(target, ctx)
  // sequentially per signal; identify() stashes the payload here so
  // checkAvailability() can build honest evidence without a second fetch.
  let currentPayload: ShopifySignalPayload | null = null;

  function evidenceFromPayload(
    payload: ShopifySignalPayload | null,
    context: CheckContext
  ): AvailabilityEvidence {
    const inStock = payload ? payload.availableVariants > 0 : null;
    const availabilityLabel = !payload
      ? null
      : payload.totalVariants === 0
      ? "availability unknown"
      : payload.availableVariants === payload.totalVariants
      ? "in stock"
      : payload.availableVariants === 0
      ? "sold out"
      : `${payload.availableVariants}/${payload.totalVariants} variants in stock`;
    return {
      metadataStatus: availabilityLabel,
      visibleUiStatus: null,
      ctaState: inStock === null ? null : inStock ? "enabled" : "disabled",
      variantAvailable: inStock,
      shippingState: "unknown",
      pickupState: "unknown",
      cartState: "not_attempted",
      checkoutState: "not_attempted",
      sellerOfRecord: origin,
      checkedAt: new Date().toISOString(),
      zip: context.zip,
      sessionRegion: context.sessionRegion,
      evidenceBlobRef: null,
      sourceType: "official",
      // The pipeline reads priceUsd off the evidence object (pipeline.ts).
      priceUsd: payload?.priceMin ?? null,
    } as unknown as AvailabilityEvidence;
  }

  return {
    async discover(): Promise<RawSignal[]> {
      const products = await fetchCatalog(origin, 25);
      lastStatus = { status: "ok", lastSuccessAt: new Date().toISOString() };
      // products.json returns newest first — the top of the list is the
      // new-arrivals feed for these stores.
      return products.flatMap((p) => {
        const payload = toPayload(origin, p);
        if (!payload) return [];
        return [
          {
            sourceId: config.sourceId,
            rawText: JSON.stringify(payload),
            url: `${origin}/products/${payload.handle}`,
            observedAt: payload.createdAt ?? new Date().toISOString(),
          },
        ];
      });
    },

    async identify(raw: RawSignal): Promise<ProductCandidate[]> {
      const payload = parsePayload(raw.rawText);
      currentPayload = payload;
      if (!payload) return [];
      return [
        {
          brand: payload.vendor ?? payload.title.split(/\s+/)[0] ?? "Unknown",
          model: payload.title,
          exactIdentifier: null,
          variant: null,
          confidence: 0.85,
        },
      ];
    },

    async checkAvailability(
      _target: OfferTarget,
      context: CheckContext
    ): Promise<AvailabilityEvidence> {
      const evidence = evidenceFromPayload(currentPayload, context);
      currentPayload = null;
      return evidence;
    },

    async normalize(raw: unknown): Promise<NormalizedEvidence> {
      return { productVariantId: null, availability: raw as AvailabilityEvidence };
    },

    async healthCheck(): Promise<SourceHealth> {
      return lastStatus;
    },
  };
}
