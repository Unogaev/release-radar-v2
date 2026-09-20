import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";
import type { FeedPayload, RadarCategory, Signal, SignalStatus, SourceHealth } from "./types";
import { getProductImage } from "./fetchImage";
import type { NewsItem } from "./types";

const STATUS_MAP: Record<string, { bucket: SignalStatus; kindLabel: string; extraCategory?: RadarCategory }> = {
  [DecisionStatus.BUY_NOW]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.CONTACT_DEALER]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.SOURCE_NOW]: { bucket: "buy", kindLabel: "now" },
  [DecisionStatus.APPLY_NOW]: { bucket: "apply", kindLabel: "now" },
  [DecisionStatus.APPLY_RESERVE]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.RESERVE_PICKUP]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.PREPARE]: { bucket: "prepare", kindLabel: "soon", extraCategory: "soon" },
  [DecisionStatus.VERIFY]: { bucket: "watch", kindLabel: "verify", extraCategory: "soon" },
  [DecisionStatus.VERIFY_IN_STORE]: { bucket: "watch", kindLabel: "verify", extraCategory: "soon" },
  [DecisionStatus.WATCH]: { bucket: "watch", kindLabel: "watch" },
  [DecisionStatus.WATCH_RESTOCK]: { bucket: "watch", kindLabel: "watch" },
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
        const brand = product.brand;
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
    const brand = d.productVariant.product.brand;
    const model = titleCase(d.productVariant.product.normalizedModel);
    return `${t}  ${d.status} · ${brand} ${model} · confidence ${d.evidenceConfidence}%`;
  });

  const scannedAtSource = sourceRows.find((s) => s.lastCheckedAt)?.lastCheckedAt;

  const newsSignals = await prisma.signal.findMany({
    where: { productVariantId: null },
    orderBy: { observedAt: "desc" },
    take: 15,
    include: { source: true },
  });

  const releaseVariants = await prisma.productVariant.findMany({
    where: {
      decisions: { none: {} },
      evidence: { some: { level: { in: ["E2_OFFICIAL", "E3_ACTIONABLE", "E4_CART_VERIFIED"] } } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      product: true,
      releaseEvents: { orderBy: { startAtUtc: "desc" }, take: 1 },
    },
  });

  const BUCKET_LABEL: Record<string, string> = { buy: "BUY NOW", apply: "APPLY NOW" };

  const signalNewsSource = signals.filter((s) => s.status === "buy" || s.status === "apply").slice(0, 10);

  const recentAlerts = await prisma.alert.findMany({
    where: { channel: "browser", NOT: { dedupeKey: { endsWith: ":first_detection" } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const newsItems: NewsItem[] = [
    ...releaseVariants.map((v) => ({
      id: "release:" + v.id,
      kind: "RELEASE" as const,
      headline: v.product.brand + " " + titleCase(v.product.normalizedModel),
      brand: v.product.brand,
      model: titleCase(v.product.normalizedModel),
      source: "confirmed release",
      sourceUrl: null,
      observedAt: v.createdAt.toISOString(),
      launchAt: v.releaseEvents[0]?.startAtUtc?.toISOString() ?? null,
    })),
    ...signalNewsSource.map((s) => ({
      id: "signal:" + s.id,
      kind: "SIGNAL" as const,
      headline: s.brand + " " + s.model + " \u2014 " + (BUCKET_LABEL[s.status] ?? s.status.toUpperCase()),
      brand: s.brand,
      model: s.model,
      source: s.store,
      sourceUrl: s.primaryUrl ?? null,
      observedAt: s.checkedAt,
      launchAt: s.launchAt,
    })),
    ...recentAlerts.map((a) => {
      let headline = "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043f\u043e \u0441\u0438\u0433\u043d\u0430\u043b\u0443";
      try {
        const parsed = JSON.parse(a.payload) as { title?: string };
        if (parsed.title) headline = parsed.title;
      } catch {
        /* keep honest fallback text */
      }
      return {
        id: "alert:" + a.id,
        kind: "ALERT" as const,
        headline,
        source: "Release Radar",
        sourceUrl: null,
        observedAt: a.createdAt.toISOString(),
        launchAt: null,
      };
    }),
    ...newsSignals.map((s) => ({
      id: "news:" + s.id,
      kind: "NEWS" as const,
      headline: (s.rawText ?? "New signal detected").slice(0, 140),
      source: s.source.name,
      sourceUrl: s.url ?? null,
      observedAt: s.observedAt.toISOString(),
      launchAt: null,
    })),
  ].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

  return {
    signals,
    newsItems,
    sources,
    logs,
    scannedAt: (scannedAtSource ?? new Date()).toISOString(),
  };
}
