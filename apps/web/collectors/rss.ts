import { XMLParser } from "fast-xml-parser";
import { DiscoveredItem } from "./types";
import { decodeHtmlEntities } from "@/lib/radar/text";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function absoluteImage(value: unknown, feedUrl: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const clean = decodeHtmlEntities(value.trim());
    const url = new URL(clean, feedUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function imageFromHtml(value: unknown, feedUrl: string): string | null {
  if (typeof value !== "string") return null;
  const match = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/i.exec(value);
  return absoluteImage(match?.[1], feedUrl);
}

function itemImage(item: any, feedUrl: string): string | null {
  const mediaContent = first(item?.["media:content"]);
  const mediaThumbnail = first(item?.["media:thumbnail"]);
  const enclosure = (Array.isArray(item?.enclosure) ? item.enclosure : [item?.enclosure])
    .find((entry: any) => entry?.["@_url"] && (!entry?.["@_type"] || String(entry["@_type"]).startsWith("image/")));
  const atomLinks = Array.isArray(item?.link) ? item.link : [item?.link];
  const atomImage = atomLinks.find((entry: any) =>
    entry?.["@_href"] && (entry?.["@_rel"] === "enclosure" || String(entry?.["@_type"] ?? "").startsWith("image/"))
  );
  return absoluteImage(mediaContent?.["@_url"], feedUrl)
    ?? absoluteImage(mediaThumbnail?.["@_url"], feedUrl)
    ?? absoluteImage(enclosure?.["@_url"], feedUrl)
    ?? absoluteImage(atomImage?.["@_href"], feedUrl)
    ?? imageFromHtml(item?.["content:encoded"], feedUrl)
    ?? imageFromHtml(item?.description, feedUrl)
    ?? imageFromHtml(item?.summary, feedUrl);
}

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
        imageUrl: itemImage(it, feedUrl),
      };
    })
    .filter((it) => it.url);
}
