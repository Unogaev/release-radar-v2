import { parse } from "node-html-parser";
import type { DiscoveredItem } from "./types";
import { decodeHtmlEntities } from "@/lib/radar/text";

const INTERESTING = /\b(new|launch|release|drop|limited|exclusive|edition|collab|pre-?order|restock|collection|arrivals?|available|anniversary|auction|sold)\b/i;
const REJECT = /\b(login|sign in|privacy|terms|cookie|customer service|contact|newsletter|store locator|accessibility)\b/i;

function publicUrl(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return /^https?:$/.test(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

function jsonLdProducts(value: unknown, baseUrl: string): DiscoveredItem[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((entry) => jsonLdProducts(entry, baseUrl));
  const node = value as Record<string, any>;
  const nested = node["@graph"] ? jsonLdProducts(node["@graph"], baseUrl) : [];
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  if (!types.some((type) => /Product|NewsArticle|Article/i.test(String(type ?? "")))) return nested;
  const title = decodeHtmlEntities(String(node.name ?? node.headline ?? "")).trim();
  const url = publicUrl(typeof node.url === "string" ? node.url : undefined, baseUrl) ?? baseUrl;
  const rawImage = typeof node.image === "string" ? node.image : Array.isArray(node.image)
    ? (typeof node.image[0] === "string" ? node.image[0] : node.image[0]?.url)
    : node.image?.url;
  return title.length >= 8 ? [{ url, title, publishedAt: node.datePublished ?? null, summary: null, imageUrl: publicUrl(rawImage, baseUrl) }] : nested;
}

export async function fetchPageDiscoveries(pageUrl: string, limit = 8): Promise<DiscoveredItem[]> {
  const response = await fetch(pageUrl, {
    signal: AbortSignal.timeout(5_000), redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126 Safari/537.36", Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!response.ok) throw new Error(`Page fetch failed: ${response.status} ${pageUrl}`);
  const root = parse(await response.text());
  const found: DiscoveredItem[] = [];
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try { found.push(...jsonLdProducts(JSON.parse(script.text), response.url)); } catch { /* malformed JSON-LD */ }
  }
  const pageImage = publicUrl(root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? root.querySelector('meta[name="twitter:image"]')?.getAttribute("content"), response.url);
  for (const anchor of root.querySelectorAll("main a, article a, [role=main] a")) {
    const title = decodeHtmlEntities(anchor.text.replace(/\s+/g, " ").trim());
    if (title.length < 12 || title.length > 180 || !INTERESTING.test(title) || REJECT.test(title)) continue;
    const url = publicUrl(anchor.getAttribute("href"), response.url);
    if (!url) continue;
    const image = anchor.querySelector("img");
    const imageUrl = publicUrl(image?.getAttribute("src") ?? image?.getAttribute("data-src") ?? image?.getAttribute("data-lazy-src"), response.url) ?? pageImage;
    found.push({ url, title, publishedAt: null, summary: null, imageUrl });
  }
  const seen = new Set<string>();
  return found.filter((item) => !seen.has(item.url.toLowerCase()) && Boolean(seen.add(item.url.toLowerCase()))).slice(0, limit);
}
