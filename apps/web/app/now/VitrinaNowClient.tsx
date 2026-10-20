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

function signalToCard(s: Signal): FeedCardData {
  const status = normStatus(s.status);
  const isAlert = status === "buy" || status === "apply" || status === "prepare" || status === "client";
  const hasFull = s.retail != null && s.completedSalesCount > 0 && s.expectedResale != null;
  return {
    id: s.id,
    kind: isAlert ? "ALERT" : s.launchAt ? "RELEASE" : "SIGNAL",
    status,
    brand: clean(s.brand),
    name: s.model,
    sku: clean(s.sku) ?? clean(s.reference),
    imageUrl: s.imageUrl ?? null,
    retailUsd: s.retail,
    completedSalesCount: s.completedSalesCount,
    expectedResaleUsd: s.expectedResale,
    askFromUsd: s.askFloor,
    launchAt: s.launchAt,
    store: clean(s.store),
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
    kind,
    status: null,
    brand: n.brand ?? null,
    name: n.headline,
    imageUrl: n.imageUrl ?? null,
    retailUsd: n.priceUsd ?? null,
    launchAt: n.launchAt ?? null,
    store: n.retailer ?? n.source ?? null,
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
