"use client";

import { useMemo, useState } from "react";
import { FeedCard, type FeedCardData } from "./FeedCard";
import { CardSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { LayoutGrid, List, SearchX } from "lucide-react";

export interface VitrinaFeedInput {
  cards: FeedCardData[];
  urgentCount: number;
  checkedAt?: string | null;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "releases", label: "Releases" },
  { key: "restocks", label: "Restocks" },
  { key: "news", label: "News" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";

export function VitrinaFeed({ cards }: VitrinaFeedInput) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const visible = useMemo(() => {
    switch (filter) {
      case "urgent":
        return cards.filter((c) => c.kind === "ALERT");
      case "releases":
        return cards.filter((c) => c.kind === "RELEASE");
      case "restocks":
        return cards.filter(
          (c) => c.kind === "SIGNAL" || (c.name ?? "").toLowerCase().includes("restock"),
        );
      case "news":
        return cards.filter((c) => c.kind === "NEWS");
      default:
        return cards;
    }
  }, [cards, filter]);

  const urgent = useMemo(() => cards.filter((c) => c.kind === "ALERT"), [cards]);
  const releases = useMemo(() => cards.filter((c) => c.kind === "RELEASE"), [cards]);
  const rest = useMemo(
    () => cards.filter((c) => c.kind !== "ALERT" && c.kind !== "RELEASE"),
    [cards],
  );

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
          {urgent.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Urgent · {urgent.length}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {urgent.map((c) => (
                  <FeedCard key={c.id} data={c} />
                ))}
              </div>
            </section>
          )}
          {releases.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Upcoming releases · {releases.length}</h2>
              <div className={GRID}>
                {releases.map((c) => (
                  <FeedCard key={c.id} data={c} />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Market news</h2>
              <div className={GRID}>
                {rest.map((c) => (
                  <FeedCard key={c.id} data={c} />
                ))}
              </div>
            </section>
          )}
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
