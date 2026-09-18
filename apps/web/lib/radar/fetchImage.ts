const cache = new Map<string, string | null>();

async function fetchImageUrl(query: string): Promise<string | null> {
  if (cache.has(query)) return cache.get(query) ?? null;

  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) {
    cache.set(query, null);
    return null;
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(
      query
    )}&searchType=image&num=1&safe=active`;
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await res.json()) as { items?: { link?: string }[] };
    const found = data.items?.[0]?.link ?? null;
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
