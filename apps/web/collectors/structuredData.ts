
export interface StructuredProductData {
  name: string | null;
  brand: string | null;
  sku: string | null;
  priceUsd: number | null;
  availability: "InStock" | "OutOfStock" | "PreOrder" | "Discontinued" | "LimitedAvailability" | null;
  url: string;
}

export async function fetchStructuredProductData(url: string): Promise<StructuredProductData | null> {
  const res = await fetch(url, { headers: { "User-Agent": "ReleaseRadarBot/1.0" } });
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status} ${url}`);
  const html = await res.text();

  // MVP fix: full-DOM parsing of an entire storefront homepage (heavy,
  // deeply-nested client-rendered markup) was tripping node-html-parser's
  // "Maximum nested tags exceeded" safety guard, so this source never
  // produced data. We only need the <script type="application/ld+json">
  // payloads, so extract them directly from the raw HTML with a regex
  // instead of building a full DOM tree.
  const scriptMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const match of scriptMatches) {
    try {
      const json = JSON.parse(match[1]);
      const candidates = Array.isArray(json) ? json : [json];
      for (const candidate of candidates) {
        const node = candidate["@graph"]
          ? candidate["@graph"].find((n: any) => n["@type"] === "Product")
          : candidate;
        if (node && (node["@type"] === "Product" || node["@type"]?.includes?.("Product"))) {
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          const rawAvailability: string = offers?.availability ?? "";
          const availability = rawAvailability.includes("InStock")
            ? "InStock"
            : rawAvailability.includes("OutOfStock")
            ? "OutOfStock"
            : rawAvailability.includes("PreOrder")
            ? "PreOrder"
            : rawAvailability.includes("Discontinued")
            ? "Discontinued"
            : rawAvailability.includes("LimitedAvailability")
            ? "LimitedAvailability"
            : null;
          return {
            name: node.name ?? null,
            brand: typeof node.brand === "string" ? node.brand : node.brand?.name ?? null,
            sku: node.sku ?? node.mpn ?? null,
            priceUsd: offers?.price ? parseFloat(offers.price) : null,
            availability,
            url,
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}
