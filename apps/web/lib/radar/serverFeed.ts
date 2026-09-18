import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";
import type { FeedPayload, RadarCategory, Signal, SignalStatus, SourceHealth } from "./types";
import { getProductImage } from "./fetchImage";

const STATUS_MAP: Record<string, { bucket: SignalStatus; kindLabel: string; extraCategory?: RadarCategory }> = {
  [DecisionStatus.BUY_NOW]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.APPLY_NOW]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.CONTACT_DEALER]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.SOURCE_NOW]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.APPLY_RESERVE]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.RESERVE_PICKUP]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.PREPARE]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.VERIFY]: { bucket: "prepare", kindLabel: "verify", extraCategory: "soon" },
  [DecisionStatus.VERIFY_IN_STORE]: { bucket: "prepare", kindLabel: "verify", extraCategory: "soon" },
  [DecisionStatus.CLIENT_FIRST]: { bucket: "client", kindLabel: "client" },
};

const CATEGORY_MAP: Record<string, RadarCategory> = {
  gaming: "tech",
  technology: "tech",
  tech: "tech",
  watches: "watches",
  sneakers: "sneakers",
  cars: "cars",
  automobiles: "cars",
};

function stripDemo(s: string): string {
  return s.replace(/^\[DEMO\]\s*/i, "");
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getRealFeed(): Promise<FeedPayload> {
  const statuses = Object.keys(STATUS_MAP);

  const decisions = await prisma.decision.findMany({
    where: { status: { in: statuses } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      productVariant: {
        include: {
          product: true,
          identifiers: true,
          releaseEvents: { orderBy: { startAtUtc: "desc" }, take: 1 },
          availabilityChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
          marketSales: { orderBy: { observedAt: "desc" }, take: 1 },
          marketAsks: { orderBy: { observedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const signals: Signal[] = await Promise.all(
    decisions
      .filter((d) => STATUS_MAP[d.status])
      .map(async (d) => {
        const map = STATUS_MAP[d.status];
        const pv = d.productVariant;
        const product = pv.product;
        const release = pv.releaseEvents[0];
        const check = pv.availabilityChecks[0];
        const sale = pv.marketSales[0];
        const ask = pv.marketAsks[0];

        const categories: RadarCategory[] = ["now"];
        if (map.extraCategory) categories.push(map.extraCategory);
        const mappedCat = CATEGORY_MAP[product.category];
        if (mappedCat) categories.push(mappedCat);

        const expectedResale = sale ? sale.priceMinor / 100 : ask ? ask.priceMinor / 100 : null;
        const brand = stripDemo(product.brand);
        const model = titleCase(product.normalizedModel);
        const imageUrl = (await getProductImage(brand, model)) ?? undefined;

        return {
          id: d.id,
          status: map.bucket,
          kindLabel: map.kindLabel,
          categories,
          brand,
          model,
          reference: pv.identifiers[0]?.value ?? "—",
          sku: pv.identifiers[1]?.value ?? pv.identifiers[0]?.value ?? "—",
          imageUrl,
          imageHint: `${brand} ${model}`,
          retail: null,
          cost: null,
          expectedResale,
          store: check?.sellerOfRecord ?? "—",
          stock: check?.visibleUiStatus ?? check?.ctaState ?? "—",
          primaryUrl: check?.url ?? null,
          checkedAt: (check?.checkedAt ?? d.createdAt).toISOString(),
          launchAt: (release?.startAtUtc ?? d.createdAt).toISOString(),
          why: d.rationale,
          factors: d.blockedReasons.length ? d.blockedReasons : [`Confidence ${d.evidenceConfidence}%`],
        } satisfies Signal;
      })
  );

  const sourceRows = await prisma.source.findMany({
    orderBy: { lastCheckedAt: "desc" },
    take: 8,
  });

  const sources: SourceHealth[] = sourceRows.map((s) => {
    const state: SourceHealth["state"] =
      s.adapterStatus === "active" ? "ok" : s.adapterStatus === "disabled" ? "manual" : "down";
    const detail = s.lastCheckedAt
      ? `${Math.max(0, Math.round((Date.now() - s.lastCheckedAt.getTime()) / 60000))} мин`
      : "—";
    return { name: s.name, state, detail };
  });

  const recentDecisions = await prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { productVariant: { include: { product: true } } },
  });

  const logs = recentDecisions.map((d) => {
    const t = d.createdAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const brand = stripDemo(d.productVariant.product.brand);
    const model = titleCase(d.productVariant.product.normalizedModel);
    return `${t}  ${d.status} · ${brand} ${model} · confidence ${d.evidenceConfidence}%`;
  });

  const scannedAtSource = sourceRows.find((s) => s.lastCheckedAt)?.lastCheckedAt;

  return {
    signals,
    sources,
    logs,
    scannedAt: (scannedAtSource ?? new Date()).toISOString(),
  };
}
