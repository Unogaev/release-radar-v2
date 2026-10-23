"use client";

import { useMemo } from "react";
import type { FeedPayload, NewsItem, Signal } from "@/lib/radar/types";
import { FeedHeader } from "@/components/vitrina/FeedHeader";
import { BottomNav } from "@/components/vitrina/BottomNav";
import { VitrinaFeed } from "@/components/vitrina/VitrinaFeed";
import type { FeedCardData } from "@/components/vitrina/FeedCard";
import { netProfit, marginPct } from "@/lib/radar/cardViewModel";

function normStatus(s: string): string {
  const v = s.toLowerCase();
  if (v.includes("buy")) return "buy";
  if (v.includes("apply")) return "apply";
  if (v.includes("client")) return "client";
  if (v.includes("prepare") || v.includes("source")) return "prepare";
  return "watch";
}

function clean(v: string | null | undefined): string | null {
  if (!v || v === "—" || v.trim() === "") return null;
  return v;
}

/**
 * Ячейка бренда иногда хранит слово бренда слитно несколько раз
 * ("Ceaseceasecease"), а заголовок карточки уже начинается с него
 * ("Cease - Men's …"). Схлопываем лейбл до одного слова бренда, чтобы
 * карточка читалась как все остальные. Остальные бренды не меняются.
 */
function dedupeBrandLabel(brand: string | null | undefined, title: string): string | null {
  const b = clean(brand);
  if (!b) return null;
  const lower = b.toLowerCase();
  for (let len = 2; len <= lower.length / 2; len++) {
    if (lower.length % len !== 0) continue;
    const word = lower.slice(0, len);
    if (word.repeat(lower.length / len) !== lower) continue;
    if (title.toLowerCase().startsWith(word)) return b.slice(0, len);
    break;
  }
  return b;
}

const STORE_REGION: Record<string, string> = {
  kith: "USA",
  "bobs watches": "USA",
  stockx: "USA",
  goat: "USA",
  nike: "USA",
  snkrs: "USA",
  target: "USA",
  "best buy": "USA",
  walmart: "USA",
  gamestop: "USA",
  newegg: "USA",
  "micro center": "USA",
  "b&h": "USA",
  rhode: "USA",
  skims: "USA",
  supreme: "USA",
  adidas: "USA",
  "new balance": "USA",
  "dover street market": "UK",
  palace: "UK",
  "end.": "UK",
  ssense: "Canada",
};

function regionOfStore(store: string | null | undefined): string | null {
  if (!store) return null;
  const v = store.toLowerCase().trim();
  if (STORE_REGION[v]) return STORE_REGION[v];
  const compact = v.replace(/[^a-z0-9]/g, "");
  if (compact === "end" || compact.startsWith("endclothing")) return "UK";
  for (const [key, region] of Object.entries(STORE_REGION)) {
    if (key === "end.") continue;
    if (v.includes(key)) return region;
    const compactKey = key.replace(/[^a-z0-9]/g, "");
    if (compactKey.length >= 3 && compact.includes(compactKey)) return region;
  }
  return null;
}

const HEADLINE_PREFIX: Record<string, string> = {
  "Неожиданный ресток": "Unexpected restock",
  "Изменилась цена или доступность": "Price or availability changed",
  "Ресток": "Restock",
  "Снижение цены": "Price drop",
  "Новая цена": "New price",
};

function translateHeadline(h: string): string {
  const idx = h.indexOf(" · ");
  if (idx > 0) {
    const first = h.slice(0, idx);
    const en = HEADLINE_PREFIX[first];
    if (en) return en + h.slice(idx);
  }
  return h;
}

/**
 * Релиз считается «предстоящим» до конца своих ET-суток запуска:
 * вышедший сегодня утром дроп остаётся в таймлайне весь день,
 * а не исчезает в минуту запуска.
 */
function etDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function signalToCard(s: Signal): FeedCardData {
  const status = normStatus(s.status);
  const isAlert = status === "buy" || status === "apply" || status === "prepare" || status === "client";
  const todayKey = etDayKey(new Date().toISOString());
  const futureLaunch = s.launchAt ? etDayKey(s.launchAt) >= todayKey : false;
  const hasFull = s.retail != null && s.completedSalesCount > 0 && s.expectedResale != null;
  const name = translateHeadline(s.model);
  return {
    id: s.id,
    kind: futureLaunch ? "RELEASE" : isAlert ? "ALERT" : "SIGNAL",
    status,
    brand: dedupeBrandLabel(s.brand, name),
    name,
    sku: clean(s.sku) ?? clean(s.reference),
    imageUrl: s.imageUrl ?? null,
    retailUsd: s.retail,
    completedSalesCount: s.completedSalesCount,
    expectedResaleUsd: s.expectedResale,
    askFromUsd: s.askFloor,
    launchAt: s.launchAt,
    store: clean(s.store),
    region: regionOfStore(s.store),
    checkedAt: s.checkedAt,
    purchaseUrl: s.ctaConfirmed ? (s.primaryUrl ?? null) : null,
    sourceUrl: s.primaryUrl ?? null,
    profitUsd: hasFull ? netProfit(s.retail!, s.expectedResale!) : null,
    marginPct: hasFull ? marginPct(s.retail!, s.expectedResale!) : null,
  };
}

function newsToCard(n: NewsItem): FeedCardData {
  const kind = n.kind === "RELEASE" ? "RELEASE" : n.kind === "ALERT" ? "ALERT" : n.kind === "SIGNAL" ? "SIGNAL" : "NEWS";
  const name = translateHeadline(n.headline);
  return {
    id: n.id,
    detailId: n.decisionId ?? null,
    kind,
    status: null,
    brand: dedupeBrandLabel(n.brand, name),
    name,
    imageUrl: n.imageUrl ?? null,
    retailUsd: n.priceUsd ?? null,
    launchAt: n.launchAt ?? null,
    store: n.retailer ?? n.source ?? null,
    region: regionOfStore(n.retailer ?? n.source ?? null),
    isMarketStory: n.kind === "MARKET" && n.priceUsd != null,
    checkedAt: n.observedAt,
    sourceUrl: n.sourceUrl ?? null,
  };
}

export function VitrinaNowClient({ payload }: { payload: FeedPayload; isStale?: boolean }) {
  const cards = useMemo<FeedCardData[]>(
    () => [...payload.signals.map(signalToCard), ...payload.newsItems.map(newsToCard)],
    [payload],
  );
  const urgentCount = cards.filter((c) => c.kind === "ALERT").length;
  const checkedLabel =
    new Date(payload.scannedAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }) + " ET";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FeedHeader urgentCount={urgentCount} checkedAt={checkedLabel} />
      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-4 sm:px-6 sm:pb-10">
        <VitrinaFeed cards={cards} urgentCount={urgentCount} checkedAt={payload.scannedAt} />
      </main>
      <BottomNav />
    </div>
  );
}
