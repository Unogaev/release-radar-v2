"use client";

import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Countdown } from "./Countdown";
import { CTAButton } from "./CTAButton";
import { FeedCard, type FeedCardData } from "./FeedCard";
import { ImageWithFallback } from "./ImageWithFallback";
import { ListRow } from "./ListRow";
import { PriceBlock } from "./PriceBlock";
import { tokens } from "./tokens";
import { completenessOf, ctaOf, type CardInput } from "@/lib/radar/cardViewModel";

/**
 * Desktop-only "Today's board" composition for /now.
 * Rendered at lg+ breakpoints by VitrinaFeed when the "All" filter is active;
 * mobile (<lg) keeps the existing stacked section layout untouched.
 * Driven by the same section arrays as the stacked feed — no new data fetching.
 */
export interface BoardSections {
  earn: FeedCardData[];
  urgent: FeedCardData[];
  releases: FeedCardData[];
  sold: FeedCardData[];
  watching: FeedCardData[];
  news: FeedCardData[];
}

const ET = "America/New_York";

function cardInputOf(c: FeedCardData): CardInput {
  return {
    kind: c.kind,
    status: c.status,
    retailUsd: c.retailUsd,
    completedSalesCount: c.completedSalesCount,
    expectedResaleUsd: c.expectedResaleUsd,
    askFromUsd: c.askFromUsd,
    purchaseUrl: c.purchaseUrl,
    sourceUrl: c.sourceUrl,
  };
}

function completenessOfCard(c: FeedCardData) {
  return completenessOf(cardInputOf(c));
}

function isFull(c: FeedCardData): boolean {
  return completenessOfCard(c) === "FULL";
}

function isPriced(c: FeedCardData): boolean {
  return completenessOfCard(c) === "PRICED";
}

function detailHref(c: FeedCardData): string {
  return `/signals/${c.detailId ?? c.id}`;
}

/** Same CTA href logic as FeedCard. */
function ctaHrefOf(c: FeedCardData): string | undefined {
  const { cta } = ctaOf(cardInputOf(c));
  if (cta === "buy" || cta === "read") return c.purchaseUrl ?? c.sourceUrl ?? undefined;
  if (cta === "client") {
    const p = new URLSearchParams();
    if (c.brand) p.set("brand", c.brand);
    p.set("model", c.name);
    if (c.sku) p.set("sku", c.sku);
    if (c.retailUsd != null) p.set("price", String(c.retailUsd));
    const u = c.purchaseUrl ?? c.sourceUrl;
    if (u) p.set("url", u);
    return `/requests/new?${p.toString()}`;
  }
  if (cta === "remind") return "/calendar";
  return detailHref(c);
}

function ctaLabelOf(c: FeedCardData): string {
  return ctaOf(cardInputOf(c)).label;
}

type BadgeStatus = "buy" | "apply" | "prepare" | "client" | "watch" | "release" | "news";

function badgeStatusOf(c: FeedCardData): BadgeStatus {
  if (c.status === "buy") return "buy";
  if (c.status === "apply") return "apply";
  if (c.status === "prepare") return "prepare";
  if (c.status === "client") return "client";
  if (c.kind === "RELEASE") return "release";
  if (c.kind === "NEWS") return "news";
  return "watch";
}

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtUsd(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function etDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ET,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function etDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: ET,
  });
}

function etTimeLabel(iso: string): string {
  return (
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: ET,
    }) + " ET"
  );
}

function etDateTimeLabel(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: ET,
    }) + " ET"
  );
}

/** "Why this one" — built only from real card fields, no invented claims. */
function whyLineOf(c: FeedCardData): string | null {
  const full = isFull(c);
  const facts: string[] = [];
  if (full && c.profitUsd != null) {
    facts.push(
      `completed sales point to ${fmtUsd(c.profitUsd)} expected profit` +
        (c.marginPct != null ? ` (${c.marginPct.toFixed(1)}% margin)` : ""),
    );
  }
  if (c.kind === "ALERT") facts.push("flagged urgent");
  if (c.launchAt) facts.push(`drops ${etDateTimeLabel(c.launchAt)}`);
  if (!full && c.retailUsd != null) facts.push(`retail ${fmtUsd(c.retailUsd)}`);
  if (c.store) facts.push(`at ${c.store}`);
  const ago = timeAgo(c.checkedAt);
  if (ago) facts.push(`checked ${ago}`);
  return facts.length ? facts.join(" · ") : null;
}

export function BoardDesktop({
  sections,
  checkedAt,
}: {
  sections: BoardSections;
  checkedAt?: string | null;
}) {
  const { earn, urgent, releases, sold, watching, news } = sections;
  const [watchingOpen, setWatchingOpen] = useState(false);

  const pool = useMemo(
    () => [...earn, ...urgent, ...releases, ...sold, ...watching, ...news],
    [earn, urgent, releases, sold, watching, news],
  );

  // Hero: first FULL card by profit desc; else first Urgent card with a photo;
  // else the soonest release with a photo; else the first Urgent card.
  const hero = useMemo<FeedCardData | null>(() => {
    const full = pool
      .filter(isFull)
      .sort(
        (a, b) =>
          (b.profitUsd ?? Number.NEGATIVE_INFINITY) -
          (a.profitUsd ?? Number.NEGATIVE_INFINITY),
      );
    if (full.length) return full[0];
    const urgentPhoto = urgent.find((c) => c.imageUrl);
    if (urgentPhoto) return urgentPhoto;
    const relPhoto = releases
      .filter((c) => c.imageUrl && c.launchAt)
      .sort((a, b) => new Date(a.launchAt!).getTime() - new Date(b.launchAt!).getTime())[0];
    if (relPhoto) return relPhoto;
    return urgent[0] ?? null;
  }, [pool, urgent, releases]);

  // Top opportunities: FULL by profit desc → Urgent by recency → PRICED by recency.
  const topOpportunities = useMemo(() => {
    const byRecency = (a: FeedCardData, b: FeedCardData) =>
      new Date(b.checkedAt ?? 0).getTime() - new Date(a.checkedAt ?? 0).getTime();
    const ordered = [
      ...pool
        .filter(isFull)
        .sort(
          (a, b) =>
            (b.profitUsd ?? Number.NEGATIVE_INFINITY) -
            (a.profitUsd ?? Number.NEGATIVE_INFINITY),
        ),
      ...pool.filter((c) => c.kind === "ALERT").sort(byRecency),
      ...pool.filter((c) => !isFull(c) && isPriced(c)).sort(byRecency),
    ];
    const out: FeedCardData[] = [];
    const seen = new Set<string>();
    if (hero) seen.add(hero.id);
    for (const c of ordered) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (out.length >= 6) break;
    }
    return out;
  }, [pool, hero]);

  // Board strip (b): the soonest upcoming release.
  const nextDrop = useMemo(() => {
    const now = Date.now();
    return (
      releases
        .filter((c) => c.launchAt && new Date(c.launchAt).getTime() > now)
        .sort((a, b) => new Date(a.launchAt!).getTime() - new Date(b.launchAt!).getTime())[0] ??
      null
    );
  }, [releases]);

  // Board strip (c): profit only when at least one FULL card exists.
  const fullCards = useMemo(() => pool.filter(isFull), [pool]);
  const pricedCount = useMemo(() => pool.filter((c) => c.retailUsd != null).length, [pool]);
  const profitSum = useMemo(
    () => fullCards.reduce((s, c) => s + (c.profitUsd ?? 0), 0),
    [fullCards],
  );

  const checkedLabel = checkedAt
    ? new Date(checkedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: ET,
      }) + " ET"
    : null;

  const urgentPhoto = useMemo(
    () => urgent.filter((c) => c.imageUrl).slice(0, 5),
    [urgent],
  );
  const urgentNoPhoto = useMemo(() => urgent.filter((c) => !c.imageUrl), [urgent]);

  // Releases timeline: group by ET calendar day for the next 14 days.
  const dayGroups = useMemo<Array<[string, FeedCardData[]]>>(() => {
    const now = Date.now();
    const keys: string[] = [];
    for (let i = 0; i < 14; i++) keys.push(etDayKey(new Date(now + i * 86400000).toISOString()));
    const map = new Map<string, FeedCardData[]>();
    for (const c of releases) {
      if (!c.launchAt) continue;
      if (new Date(c.launchAt).getTime() < now) continue;
      const key = etDayKey(c.launchAt);
      if (!keys.includes(key)) continue;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return keys
      .filter((k) => map.has(k))
      .map(
        (k) =>
          [
            k,
            map
              .get(k)!
              .sort((a, b) => new Date(a.launchAt!).getTime() - new Date(b.launchAt!).getTime()),
          ] as [string, FeedCardData[]],
      );
  }, [releases]);

  return (
    <div>
      {/* 1. Board strip */}
      <section className="mb-6 grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <div className="text-[28px] font-bold tabular-nums text-[#1a1a1a]">
            {urgent.length} urgent now
          </div>
          <div className="mt-1 text-[13px] text-[#6b7280]">
            Restocks and price moves that close today
            {checkedLabel ? ` — newest checked ${checkedLabel}` : ""}
          </div>
        </Card>
        {nextDrop && (
          <Card className="p-5">
            <div className="text-[13px] font-semibold text-[#1a1a1a]">Next big drop</div>
            <div className="mt-2 line-clamp-2 text-[16px] font-semibold leading-snug text-[#1a1a1a]">
              {nextDrop.name}
            </div>
            <div className="mt-1 text-[13px] text-[#6b7280]">
              {nextDrop.launchAt ? etDateTimeLabel(nextDrop.launchAt) : ""}
            </div>
            <div className="mt-2">
              {nextDrop.launchAt && <Countdown targetAt={nextDrop.launchAt} />}
            </div>
          </Card>
        )}
        <Card className="p-5">
          {fullCards.length > 0 ? (
            <>
              <div className="text-[13px] font-semibold text-[#1a1a1a]">
                Potential profit on the board
              </div>
              <div
                className="mt-2 text-[28px] font-bold tabular-nums"
                style={{ color: tokens.color.accent }}
              >
                {fmtUsd(profitSum)}
              </div>
              <div className="mt-1 text-[13px] text-[#6b7280]">
                across {fullCards.length} fully-priced opportunities
              </div>
            </>
          ) : (
            <>
              <div className="text-[28px] font-bold tabular-nums text-[#1a1a1a]">
                {pricedCount} priced opportunities
              </div>
              <div className="mt-1 text-[13px] text-[#6b7280]">
                Resale tracking is filling in — profit appears when completed sales land.
              </div>
            </>
          )}
        </Card>
      </section>

      {/* 2. Hero + top opportunities */}
      {hero && (
        <section className="mb-8 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <a href={detailHref(hero)} className="block">
                <div className="relative">
                  <ImageWithFallback
                    src={hero.imageUrl}
                    alt={hero.name}
                    className="aspect-[16/10] w-full"
                    eager
                  />
                  {(isFull(hero) || hero.kind === "ALERT") && (
                    <div className="absolute left-4 top-4 rounded-full bg-[#1a1a1a] px-3 py-1 text-[12px] font-semibold text-white">
                      #1 opportunity today
                    </div>
                  )}
                </div>
              </a>
              <div className="p-5">
                <a href={detailHref(hero)} className="block">
                  {hero.brand && (
                    <div className="text-[12px] text-[#6b7280]">{hero.brand}</div>
                  )}
                  <h2 className="mt-1 text-[20px] font-bold leading-snug text-[#1a1a1a]">
                    {hero.name}
                  </h2>
                </a>
                {(hero.store || hero.region) && (
                  <div className="mt-1 text-[13px] text-[#6b7280]">
                    {[hero.store, hero.region].filter(Boolean).join(" · ")}
                  </div>
                )}
                <div className="mt-3">
                  <PriceBlock
                    level={completenessOfCard(hero)}
                    retail={hero.retailUsd}
                    profit={hero.profitUsd}
                    marginPct={hero.marginPct}
                    askFrom={hero.askFromUsd}
                  />
                </div>
                {whyLineOf(hero) && (
                  <div className="mt-3 text-[13px] text-[#6b7280]">
                    <span className="font-semibold text-[#1a1a1a]">Why this one: </span>
                    {whyLineOf(hero)}
                  </div>
                )}
                <div className="mt-4 max-w-[280px]">
                  <CTAButton href={ctaHrefOf(hero)}>{ctaLabelOf(hero)}</CTAButton>
                </div>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Top opportunities</h2>
            <div className="flex flex-col gap-2">
              {topOpportunities.map((c, i) => (
                <a
                  key={c.id}
                  href={detailHref(c)}
                  className="flex items-center gap-3 rounded-[12px] border border-[#e5e7eb] bg-white p-2 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                >
                  <span className="w-6 shrink-0 text-center text-[14px] font-bold tabular-nums text-[#9ca3af]">
                    {i + 1}
                  </span>
                  <ImageWithFallback
                    src={c.imageUrl}
                    alt={c.name}
                    className="h-14 w-14 shrink-0 rounded-[8px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1a1a]">
                      {c.name}
                    </span>
                    <span className="block truncate text-[12px] text-[#6b7280]">
                      {[c.store, c.retailUsd != null ? fmtUsd(c.retailUsd) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {isFull(c) && c.marginPct != null && (
                      <span
                        className="block text-[12px] font-semibold tabular-nums"
                        style={{ color: tokens.color.accent }}
                      >
                        {c.marginPct.toFixed(1)}% margin
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Badge status={badgeStatusOf(c)} />
                    {c.launchAt && <Countdown targetAt={c.launchAt} />}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Urgent strip */}
      {urgent.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">
            Urgent · {urgent.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {urgentPhoto.map((c) => (
              <Card key={c.id}>
                <a href={detailHref(c)} className="block">
                  <ImageWithFallback
                    src={c.imageUrl}
                    alt={c.name}
                    className="aspect-[4/3] w-full"
                  />
                </a>
                <div className="p-3">
                  <a href={detailHref(c)} className="block">
                    <div className="line-clamp-2 min-h-[36px] text-[13px] font-semibold leading-snug text-[#1a1a1a]">
                      {c.name}
                    </div>
                  </a>
                  {c.retailUsd != null && (
                    <div className="mt-1 text-[13px] font-semibold tabular-nums text-[#1a1a1a]">
                      {fmtUsd(c.retailUsd)}
                    </div>
                  )}
                  <div className="mt-2">
                    <CTAButton href={ctaHrefOf(c)}>{ctaLabelOf(c)}</CTAButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {urgentNoPhoto.length > 0 && (
            <div className="mt-3 text-[13px] text-[#6b7280]">
              Also urgent, no photo yet:{" "}
              {urgentNoPhoto.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ", "}
                  {c.name}{" "}
                  <a
                    href={detailHref(c)}
                    className="font-medium text-[#1a1a1a] underline"
                  >
                    Watch
                  </a>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Releases timeline */}
      {dayGroups.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Upcoming releases</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dayGroups.map(([key, list]) => (
              <div
                key={key}
                className="w-[240px] shrink-0 rounded-[16px] border border-[#e5e7eb] bg-white p-4"
              >
                <div className="text-[13px] font-semibold text-[#1a1a1a]">
                  {etDayLabel(key)}
                </div>
                <div className="mt-3 flex flex-col gap-3">
                  {list.slice(0, 3).map((c) => (
                    <div key={c.id}>
                      <div className="text-[12px] font-semibold tabular-nums text-[#6b7280]">
                        {c.launchAt ? etTimeLabel(c.launchAt) : ""}
                      </div>
                      <a
                        href={detailHref(c)}
                        className="mt-0.5 block line-clamp-2 text-[13px] font-medium text-[#1a1a1a]"
                      >
                        {c.name}
                      </a>
                      <div className="mt-1.5">
                        <CTAButton href="/calendar">Remind</CTAButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Sold strip — renders only when Sold cards exist */}
      {sold.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">
            Sold — real flips · {sold.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
            {sold.map((c) => (
              <FeedCard key={c.id} data={c} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Watching — collapsed by default */}
      {watching.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between rounded-[16px] border border-[#e5e7eb] bg-white px-4 py-3">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">
              Watching · {watching.length} signals
            </h2>
            <button
              onClick={() => setWatchingOpen((v) => !v)}
              className="rounded-full border border-[#e5e7eb] bg-white px-4 py-1.5 text-[13px] font-medium text-[#1a1a1a]"
            >
              {watchingOpen ? "Hide" : "Show"}
            </button>
          </div>
          {watchingOpen && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
              {watching.map((c) => (
                <FeedCard key={c.id} data={c} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 7. News */}
      {news.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">News · {news.length}</h2>
          <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white">
            {news.map((c) => (
              <ListRow
                key={c.id}
                image={c.imageUrl}
                title={c.name}
                subtitle={c.store ?? c.brand ?? undefined}
                action={
                  c.sourceUrl ? (
                    <a
                      href={c.sourceUrl}
                      className="text-[13px] font-medium text-[#1a1a1a] underline"
                    >
                      Read
                    </a>
                  ) : undefined
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
