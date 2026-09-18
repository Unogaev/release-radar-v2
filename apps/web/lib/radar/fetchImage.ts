const cache = new Map<string, string | null>();

async function fetchImageUrl(query: string): Promise<string | null> {
  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      query
    )}&page_size=5&license_type=all&mature=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": "release-radar (contact: eunogaev@gmail.com)" },
    });
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await res.json()) as {
      results?: { url?: string; thumbnail?: string; width?: number; height?: number }[];
    };
    const results = data.results ?? [];

    // Prefer a roughly square-ish, reasonably sized photo — closer to a real product shot
    // than a random wide/tall lifestyle photo.
    const scored = results
      .filter((r) => r.url || r.thumbnail)
      .map((r) => {
        const w = r.width ?? 0;
        const h = r.height ?? 0;
        const ratio = w && h ? w / h : 1;
        const squareness = Math.abs(1 - ratio);
        return { r, squareness, size: w * h };
      })
      .sort((a, b) => a.squareness - b.squareness || b.size - a.size);

    const best = scored[0]?.r ?? results[0];
    const found = best?.url ?? best?.thumbnail ?? null;
    cache.set(query, found);
    return found;
  } catch {
    cache.set(query, null);
    return null;
  }
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  sneakers: "sneaker shoe product photo",
  watches: "wristwatch product photo",
  tech: "gadget device product photo",
  cars: "car vehicle photo",
};

export async function getProductImage(
  brand: string,
  model: string,
  category?: string
): Promise<string | null> {
  const keyword = (category && CATEGORY_KEYWORDS[category]) || "product photo";
  return fetchImageUrl(`${brand} ${model} ${keyword}`);
}
