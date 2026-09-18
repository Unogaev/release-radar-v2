const cache = new Map<string, string | null>();

async function fetchImageUrl(query: string): Promise<string | null> {
  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      query
    )}&page_size=1&license_type=all`;
    const res = await fetch(url, {
      headers: { "User-Agent": "release-radar (contact: eunogaev@gmail.com)" },
    });
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await res.json()) as { results?: { url?: string; thumbnail?: string }[] };
    const found = data.results?.[0]?.url ?? data.results?.[0]?.thumbnail ?? null;
    cache.set(query, found);
    return found;
  } catch {
    cache.set(query, null);
    return null;
  }
}

export async function getProductImage(brand: string, model: string): Promise<string | null> {
  return fetchImageUrl(`${brand} ${model}`);
}
