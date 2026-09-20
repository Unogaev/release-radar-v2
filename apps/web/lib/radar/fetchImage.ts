import { parse } from "node-html-parser";

export type ResolvedImage = {
  url: string;
  sourceUrl: string;
  provenance: "product-page" | "official-page" | "official-search";
};

const cache = new Map<string, ResolvedImage | null>();
const FETCH_TIMEOUT_MS = 7_000;

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" ||
      host === "127.0.0.1" || host === "::1" || /^10\./.test(host) ||
      /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return false;
    return true;
  } catch {
    return false;
  }
}

function absoluteUrl(candidate: string | undefined, pageUrl: string): string | null {
  if (!candidate) return null;
  try {
    const url = new URL(candidate.trim(), pageUrl).toString();
    return isPublicHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}

function jsonLdImages(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(jsonLdImages);
  const record = value as Record<string, unknown>;
  const direct = record.image;
  const found: string[] = [];
  if (typeof direct === "string") found.push(direct);
  if (Array.isArray(direct)) {
    for (const image of direct) {
      if (typeof image === "string") found.push(image);
      else if (image && typeof image === "object" && typeof (image as { url?: unknown }).url === "string") {
        found.push((image as { url: string }).url);
      }
    }
  }
  if (direct && typeof direct === "object" && typeof (direct as { url?: unknown }).url === "string") {
    found.push((direct as { url: string }).url);
  }
  if (record["@graph"]) found.push(...jsonLdImages(record["@graph"]));
  return found;
}

async function imageFromPage(pageUrl: string, provenance: ResolvedImage["provenance"]): Promise<ResolvedImage | null> {
  if (!isPublicHttpUrl(pageUrl)) return null;
  const key = `page:${pageUrl}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReleaseRadar/1.0; +https://release-radar-v2.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) {
      cache.set(key, null);
      return null;
    }
    const root = parse(await response.text());
    const candidates = [
      'meta[property="og:image:secure_url"]', 'meta[property="og:image"]',
      'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]',
    ].map((selector) => root.querySelector(selector)?.getAttribute("content"))
      .filter((value): value is string => Boolean(value));

    for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
      try { candidates.push(...jsonLdImages(JSON.parse(script.text))); } catch { /* ignore malformed blocks */ }
    }
    const url = candidates.map((candidate) => absoluteUrl(candidate, response.url)).find(Boolean) ?? null;
    const result = url ? { url, sourceUrl: response.url, provenance } : null;
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

async function imageFromOfficialSearch(brand: string, model: string, officialPageUrl?: string | null): Promise<ResolvedImage | null> {
  const apiKey = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx || !officialPageUrl) return null;
  let officialDomain: string;
  try { officialDomain = new URL(officialPageUrl).hostname.replace(/^www\./, ""); } catch { return null; }
  const key = `search:${officialDomain}:${brand}:${model}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const params = new URLSearchParams({ key: apiKey, cx, q: `${brand} ${model}`, searchType: "image", safe: "active", num: "5", siteSearch: officialDomain, siteSearchFilter: "i" });
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    const data = (await response.json()) as { items?: Array<{ link?: string; image?: { contextLink?: string } }> };
    const item = data.items?.find((entry) => entry.link && isPublicHttpUrl(entry.link));
    const result = item?.link ? { url: item.link, sourceUrl: item.image?.contextLink ?? officialPageUrl, provenance: "official-search" as const } : null;
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function getPageImage(pageUrl?: string | null): Promise<ResolvedImage | null> {
  return pageUrl ? imageFromPage(pageUrl, "official-page") : null;
}

export async function getProductImage(brand: string, model: string, officialPageUrl?: string | null): Promise<ResolvedImage | null> {
  const direct = officialPageUrl ? await imageFromPage(officialPageUrl, "product-page") : null;
  return direct ?? imageFromOfficialSearch(brand, model, officialPageUrl);
}
