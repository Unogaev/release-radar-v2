"use client";

import { useMemo, useState } from "react";
import { FeedCard, type FeedCardData } from "./FeedCard";
import { CardSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { ListRow } from "./ListRow";
import { completenessOf } from "@/lib/radar/cardViewModel";
import { LayoutGrid, List, SearchX } from "lucide-react";

export interface VitrinaFeedInput {
  cards: FeedCardData[];
  urgentCount: number;
  checkedAt?: string | null;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "earn", label: "Earn" },
  { key: "urgent", label: "Urgent" },
  { key: "releases", label: "Releases" },
  { key: "restocks", label: "Restocks" },
  { key: "news", label: "News" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";
const URGENT_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const DEFAULT_REGION = "USA";

function isFull(c: FeedCardData): boolean {
  return (
    completenessOf({
      kind: c.kind,
      status: c.status,
      retailUsd: c.retailUsd,
      completedSalesCount: c.completedSalesCount,
      expectedResaleUsd: c.expectedResaleUsd,
      askFromUsd: c.askFromUsd,
      purchaseUrl: c.purchaseUrl,
      sourceUrl: c.sourceUrl,
    }) === "FULL"
  );
}

function normalizeProductKeyText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Cross-section dedupe key: normalized brand + model, lowercased and
 * punctuation-stripped. The same product reaches the feed as cards with
 * different ids (an ALERT from the alert payload, a SIGNAL from the
 * decision pipeline), so id dedupe alone cannot catch it. Alert cards
 * carry their headline as "<alert label> · <brand> <model>", so for
 * ALERT cards the model part is what follows the "·". The brand field
 * is prepended only when the name does not already start with it, and
 * consecutive repeated tokens collapse — an alert headline embeds the
 * brand twice ("Vaquera vaquera - women's…") while the same product's
 * Watching card carries it once as the brand field and once at the
 * start of the model, so both forms must land on the same key. Distinct
 * models of one brand (e.g. two different Prada items) keep distinct
 * keys. Returns "" when the key would be too weak (fewer than 2 tokens).
 */
function productKeyOf(c: FeedCardData): string {
  let model = c.name ?? "";
  if (c.kind === "ALERT") {
    const sep = model.indexOf("·");
    if (sep > 0) model = model.slice(sep + 1);
  }
  const brand = normalizeProductKeyText(c.brand);
  const modelKey = normalizeProductKeyText(model);
  const combined =
    brand && modelKey && modelKey !== brand && !modelKey.startsWith(`${brand} `)
      ? `${brand} ${modelKey}`
      : modelKey || brand;
  const tokens: string[] = [];
  for (const token of combined.split(" ")) {
    if (!token) continue;
    if (tokens[tokens.length - 1] !== token) tokens.push(token);
  }
  return tokens.length >= 2 ? tokens.join(" ") : "";
}

const KIND_PRIORITY: Record<string, number> = { ALERT: 0, RELEASE: 1, SIGNAL: 2, NEWS: 3 };

function dedupeByIdOrProduct(list: FeedCardData[]): FeedCardData[] {
  const seenIds = new Set<string>();
  const seenProducts = new Set<string>();
  const keep = new Set<FeedCardData>();
  // Decide keepers in section-priority order (an Urgent alert wins over
  // the same product's Watching signal), then restore the input order.
  const byPriority = [...list].sort(
    (a, b) => (KIND_PRIORITY[a.kind] ?? 9) - (KIND_PRIORITY[b.kind] ?? 9),
  );
  for (const c of byPriority) {
    if (seenIds.has(c.id)) continue;
    const key = productKeyOf(c);
    if (key && seenProducts.has(key)) continue;
    seenIds.add(c.id);
    if (key) seenProducts.add(key);
    keep.add(c);
  }
  return list.filter((c) => keep.has(c));
}

export function VitrinaFeed({ cards }: VitrinaFeedInput) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const sections = useMemo(() => {
    const seen = new Set<string>();
    const seenProducts = new Set<string>();
    const take = (list: FeedCardData[]): FeedCardData[] => {
      const out: FeedCardData[] = [];
      for (const c of list) {
        if (seen.has(c.id)) continue;
        const key = productKeyOf(c);
        if (key && seenProducts.has(key)) continue;
        seen.add(c.id);
        if (key) seenProducts.add(key);
        out.push(c);
      }
      return out;
    };
    const earn = take(
      cards
        .filter(isFull)
        .sort((a, b) => {
          const ar = a.region === DEFAULT_REGION ? 0 : 1;
          const br = b.region === DEFAULT_REGION ? 0 : 1;
          if (ar !== br) return ar - br;
          return (b.profitUsd ?? Number.NEGATIVE_INFINITY) - (a.profitUsd ?? Number.NEGATIVE_INFINITY);
        }),
    );
    const urgent = take(cards.filter((c) => c.kind === "ALERT"));
    const releases = take(cards.filter((c) => c.kind === "RELEASE"));
    const sold = take(cards.filter((c) => c.isMarketStory));
    const watching = take(cards.filter((c) => c.kind === "SIGNAL"));
    const news = take(cards.filter((c) => c.kind === "NEWS" && !c.isMarketStory));
    return { earn, urgent, releases, sold, watching, news };
  }, [cards]);

  const visible = useMemo(() => {
    switch (filter) {
      case "urgent":
        return dedupeByIdOrProduct(cards.filter((c) => c.kind === "ALERT"));
      case "releases":
        return dedupeByIdOrProduct(cards.filter((c) => c.kind === "RELEASE"));
      case "restocks":
        return dedupeByIdOrProduct(
          cards.filter(
            (c) => c.kind === "SIGNAL" || (c.name ?? "").toLowerCase().includes("restock"),
          ),
        );
      case "news":
        return dedupeByIdOrProduct(cards.filter((c) => c.kind === "NEWS"));
      default:
        return dedupeByIdOrProduct(cards);
    }
  }, [cards, filter]);

  const isFiltered = filter !== "all";

  const emptyFiltered = (
    <EmptyState
      icon={<SearchX size={32} />}
      title="Nothing in this category yet."
      action={
        <button
          onClick={() => setFilter("all")}
          className="rounded-full bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white"
        >
          Show all
        </button>
      }
    />
  );

  const renderCardSection = (title: string, list: FeedCardData[], gridClassName: string = GRID) =>
    list.length === 0 ? null : (
      <section className="mb-8" key={title}>
        <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">
          {title} · {list.length}
        </h2>
        <div className={gridClassName}>
          {list.map((c) => (
            <FeedCard key={c.id} data={c} />
          ))}
        </div>
      </section>
    );

  const renderNewsSection = (list: FeedCardData[]) =>
    list.length === 0 ? null : (
      <section className="mb-8" key="News">
        <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">News · {list.length}</h2>
        <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white">
          {list.map((c) => (
            <ListRow
              key={c.id}
              image={c.imageUrl}
              title={c.name}
              subtitle={c.store ?? c.brand ?? undefined}
              action={
                c.sourceUrl ? (
                  <a href={c.sourceUrl} className="text-[13px] font-medium text-[#1a1a1a] underline">
                    Read
                  </a>
                ) : undefined
              }
            />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${
              filter === f.key
                ? "bg-[#1a1a1a] text-white"
                : "border border-[#e5e7eb] bg-white text-[#6b7280]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setView(view === "grid" ? "list" : "grid")}
          aria-label="Toggle view"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280]"
        >
          {view === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={<SearchX size={32} />}
          title="No signals right now. New drops appear here as sources update."
        />
      ) : filter === "earn" ? (
        sections.earn.length === 0 ? (
          emptyFiltered
        ) : (
          renderCardSection("Earn now", sections.earn)
        )
      ) : filter === "news" ? (
        sections.sold.length === 0 && sections.news.length === 0 ? (
          emptyFiltered
        ) : (
          <>
            {renderCardSection("Sold — real flips", sections.sold)}
            {renderNewsSection(sections.news)}
          </>
        )
      ) : isFiltered ? (
        visible.length === 0 ? (
          emptyFiltered
        ) : (
          <div className={GRID}>
            {visible.map((c) => (
              <FeedCard key={c.id} data={c} />
            ))}
          </div>
        )
      ) : (
        <>
          {renderCardSection("Earn now", sections.earn)}
          {renderCardSection("Urgent", sections.urgent, URGENT_GRID)}
          {renderCardSection("Upcoming releases", sections.releases)}
          {renderCardSection("Sold — real flips", sections.sold)}
          {renderCardSection("Watching", sections.watching)}
          {renderNewsSection(sections.news)}
        </>
      )}
    </div>
  );
}

export function VitrinaFeedLoading() {
  return (
    <div className={GRID}>
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
