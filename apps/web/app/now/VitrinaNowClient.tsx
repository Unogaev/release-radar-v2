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

function signalToCard(s: Signal): FeedCardData {
  const status = normStatus(s.status);
  const isAlert = status === "buy" || status === "apply" || status === "prepare" || status === "client";
  const futureLaunch = s.launchAt ? new Date(s.launchAt).getTime() > Date.now() : false;
  const hasFull = s.retail != null && s.completedSalesCount > 0 && s.expectedResale != null;
  return {
    id: s.id,
    kind: futureLaunch ? "RELEASE" : isAlert ? "ALERT" : "SIGNAL",
    status,
    brand: clean(s.brand),
    name: translateHeadline(s.model),
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
  return {
    id: n.id,
    detailId: n.decisionId ?? null,
    kind,
    status: null,
    brand: n.brand ?? null,
    name: translateHeadline(n.headline),
    imageUrl: n.imageUrl ?? null,
    retailUsd: n.priceUsd ?? null,
    launchAt: n.launchAt ?? null,
    store: n.retailer ?? n.source ?? null,
    region: regionOfStore(n.retailer ?? n.source ?? null),
    isMarketStory: n.kind === "MARKET",
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
