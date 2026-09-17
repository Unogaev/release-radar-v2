const cache = new Map<string, string | null>();

async function fetchImageUrl(query: string): Promise<string | null> {
  if (cache.has(query)) return cache.get(query) ?? null;
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const html = await tokenRes.text();
    const match = html.match(/vqd=['"]?([\d-]+)['"]?/);
    const vqd = match?.[1];
    if (!vqd) {
      cache.set(query, null);
      return null;
    }

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://duckduckgo.com/" } }
    );
    if (!imgRes.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await imgRes.json()) as { results?: { image?: string }[] };
    const url = data.results?.[0]?.image ?? null;
    cache.set(query, url);
    return url;
  } catch {
    cache.set(query, null);
    return null;
  }
}

export async function getProductImage(brand: string, model: string): Promise<string | null> {
  return fetchImageUrl(`${brand} ${model}`);
}
