import { XMLParser } from "fast-xml-parser";
import { DiscoveredItem } from "./types";
import { decodeHtmlEntities } from "@/lib/radar/text";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export async function fetchRssItems(feedUrl: string, limit = 20): Promise<DiscoveredItem[]> {
  const res = await fetch(feedUrl, { headers: { "User-Agent": "ReleaseRadarBot/1.0" } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${feedUrl}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);

  const channelItems = parsed?.rss?.channel?.item;
  const atomEntries = parsed?.feed?.entry;

  const rawItems: any[] = Array.isArray(channelItems)
    ? channelItems
    : channelItems
    ? [channelItems]
    : Array.isArray(atomEntries)
    ? atomEntries
    : atomEntries
    ? [atomEntries]
    : [];

  return rawItems
    .slice(0, limit)
    .map((it) => {
      const link =
        typeof it.link === "string" ? it.link : it.link?.["@_href"] ?? it.link?.[0]?.["@_href"] ?? null;
      return {
        url: link ?? "",
        title: decodeHtmlEntities(String(it.title ?? "")),
        publishedAt: it.pubDate ?? it.published ?? it.updated ?? null,
        summary: it.description ?? it.summary ?? null,
      };
    })
    .filter((it) => it.url);
}
