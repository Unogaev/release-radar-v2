import { parse } from "node-html-parser";

export type ResolvedImage = {
  url: string;
  sourceUrl: string;
  provenance: "product-page" | "official-page" | "official-search";
};

const cache = new Map<string, ResolvedImage | null>();
const livePageCache = new Map<string, boolean>();
const FETCH_TIMEOUT_MS = 7_000;
const REJECTED_IMAGE = /(?:logo|avatar|author|icon|emoji|badge|spinner|loader|placeholder|tracking|pixel|advert|doubleclick|gravatar)/i;

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
    const normalized = candidate.trim().replace(/&amp;/g, "&");
    if (!normalized || normalized.startsWith("data:") || normalized.startsWith("blob:")) return null;
    const url = new URL(normalized, pageUrl).toString();
    return isPublicHttpUrl(url) && !REJECTED_IMAGE.test(url) ? url : null;
  } catch {
    return null;
  }
}

function largestSrcset(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.split(",").map((entry) => {
    const [url, descriptor = "0"] = entry.trim().split(/\s+/);
    return { url, size: Number.parseFloat(descriptor) || 0 };
  }).filter((entry) => entry.url).sort((a, b) => b.size - a.size)[0]?.url;
}

function contentImageCandidates(root: ReturnType<typeof parse>): string[] {
  const selectors = [
    "article img", ".entry-content img", ".post-content img", ".article-content img",
    "main img", "img.wp-post-image", "img",
  ];
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const selector of selectors) {
    for (const image of root.querySelectorAll(selector)) {
      const descriptor = [image.getAttribute("class"), image.getAttribute("id"), image.getAttribute("alt")].filter(Boolean).join(" ");
      if (REJECTED_IMAGE.test(descriptor)) continue;
      const width = Number.parseInt(image.getAttribute("width") ?? "0", 10);
      const height = Number.parseInt(image.getAttribute("height") ?? "0", 10);
      if ((width && width < 280) || (height && height < 180)) continue;
      const candidate = largestSrcset(image.getAttribute("srcset") ?? image.getAttribute("data-srcset"))
        ?? image.getAttribute("data-lazy-src")
        ?? image.getAttribute("data-original")
        ?? image.getAttribute("data-src")
        ?? image.getAttribute("src");
      if (candidate && !seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
    }
    if (candidates.length >= 8) break;
  }
  return candidates;
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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      livePageCache.set(pageUrl, false);
      cache.set(key, null);
      return null;
    }
    livePageCache.set(pageUrl, true);
    livePageCache.set(response.url, true);
    const html = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      cache.set(key, null);
      return null;
    }
    const root = parse(html);
    const candidates = [
      'meta[property="og:image:secure_url"]', 'meta[property="og:image"]',
      'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]',
    ].map((selector) => root.querySelector(selector)?.getAttribute("content"))
      .filter((value): value is string => Boolean(value));

    const imageSrc = root.querySelector('link[rel="image_src"]')?.getAttribute("href");
    if (imageSrc) candidates.push(imageSrc);

    for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
      try { candidates.push(...jsonLdImages(JSON.parse(script.text))); } catch { /* ignore malformed blocks */ }
    }
    candidates.push(...contentImageCandidates(root));
    const url = candidates.map((candidate) => absoluteUrl(candidate, response.url)).find(Boolean) ?? null;
    const result = url ? { url, sourceUrl: response.url, provenance } : null;
    cache.set(key, result);
    return result;
  } catch {
    livePageCache.set(pageUrl, false);
    cache.set(key, null);
    return null;
  }
}

export async function isLiveExternalUrl(pageUrl?: string | null): Promise<boolean> {
  if (!pageUrl || !isPublicHttpUrl(pageUrl)) return false;
  if (livePageCache.has(pageUrl)) return livePageCache.get(pageUrl) ?? false;
  try {
    const response = await fetch(pageUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 ReleaseRadar/1.0" },
    });
    const live = response.ok && response.status < 400;
    livePageCache.set(pageUrl, live);
    if (response.url) livePageCache.set(response.url, live);
    return live;
  } catch {
    livePageCache.set(pageUrl, false);
    return false;
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
