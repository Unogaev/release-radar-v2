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

function dedupeById(list: FeedCardData[]): FeedCardData[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export function VitrinaFeed({ cards }: VitrinaFeedInput) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const sections = useMemo(() => {
    const seen = new Set<string>();
    const take = (list: FeedCardData[]): FeedCardData[] => {
      const out: FeedCardData[] = [];
      for (const c of list) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
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
        return dedupeById(cards.filter((c) => c.kind === "ALERT"));
      case "releases":
        return dedupeById(cards.filter((c) => c.kind === "RELEASE"));
      case "restocks":
        return dedupeById(
          cards.filter(
            (c) => c.kind === "SIGNAL" || (c.name ?? "").toLowerCase().includes("restock"),
          ),
        );
      case "news":
        return dedupeById(cards.filter((c) => c.kind === "NEWS"));
      default:
        return dedupeById(cards);
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
