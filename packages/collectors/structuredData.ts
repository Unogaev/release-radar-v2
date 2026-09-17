import { parse as parseHtml } from "node-html-parser";

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
  const root = parseHtml(html);

  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.text);
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
