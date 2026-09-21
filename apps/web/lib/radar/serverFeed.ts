import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";
import type { FeedPayload, RadarCategory, Signal, SignalStatus, SourceHealth } from "./types";
import { getPageImage, getProductImage } from "./fetchImage";
import type { NewsItem } from "./types";
import { decodeHtmlEntities } from "./text";

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
  lego: "lego",
  collectibles: "collectibles",
  vintage: "vintage",
  luxury: "luxury",
  jewelry: "luxury",
  "chrome-hearts": "luxury",
  fragrance: "fragrance",
};

const MIAMI_DADE_TAX_RATE = 0.07;
const MARKETPLACE_FEE_RATE = 0.13;
const OUTBOUND_SHIPPING_ESTIMATE = 20;

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values: number[], ratio: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))];
}

function saleForecast(salePrices: number[], askPrices: number[], liquidity: Signal["liquidity"]) {
  const days = liquidity === "hot" ? [3, 10] : liquidity === "active" ? [7, 21] : liquidity === "thin" ? [21, 60] : [null, null];
  if (salePrices.length >= 3) return {
    low: percentile(salePrices, 0.25), high: percentile(salePrices, 0.75),
    daysMin: days[0], daysMax: days[1], confidence: "high" as const, basis: "completed-sales" as const,
  };
  if (salePrices.length > 0) return {
    low: Math.min(...salePrices), high: Math.max(...salePrices),
    daysMin: days[0], daysMax: days[1], confidence: "medium" as const, basis: "completed-sales" as const,
  };
  if (askPrices.length >= 3) return {
    // Asking prices are not sales. The discount makes this a conservative planning range,
    // never a substitute for completed-sale evidence in BUY NOW decisions.
    low: Math.min(...askPrices) * 0.8, high: (median(askPrices) ?? Math.min(...askPrices)) * 0.9,
    daysMin: null, daysMax: null, confidence: "low" as const, basis: "ask-adjusted" as const,
  };
  return { low: null, high: null, daysMin: null, daysMax: null, confidence: "none" as const, basis: "none" as const };
}

function liquidityFor(sales: { observedAt: Date }[]): Signal["liquidity"] {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = sales.filter((sale) => sale.observedAt.getTime() >= cutoff).length;
  if (recent >= 10) return "hot";
  if (recent >= 3) return "active";
  if (sales.length > 0) return "thin";
  return "unverified";
}


function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The generic RSS adapter (editorial blogs like PlayStation Blog / Xbox
 * Wire) has no product-identification step at all: identify() just copies
 * the article headline into `model` (see collectors/genericAdapter.ts).
 * That headline still goes through the same pipeline as a real product and
 * can end up with a WATCH decision, which then shows up on /now looking
 * like an actionable product card even though it's just news.
 *
 * A row is a genuinely tracked product only if at least ONE independent
 * piece of real-world verification exists for it: a confirmed identifier
 * (SKU/reference), a confirmed seller of record, a confirmed price, or an
 * officially confirmed release event. Pure RSS guesses have none of these —
 * the raw article itself is still shown correctly on /news.
 */
function isTrackedProduct(pv: {
  identifiers: { kind: string; value: string }[];
  releaseEvents: { id: string }[];
}, check: { sellerOfRecord: string | null; priceUsd: number | null } | undefined): boolean {
  return (
    pv.identifiers.length > 0 ||
    Boolean(check?.sellerOfRecord) ||
    check?.priceUsd != null ||
    pv.releaseEvents.length > 0
  );
}

function pickIdentifier(
  identifiers: { kind: string; value: string }[],
  match: (kindLower: string) => boolean
): string | null {
  return identifiers.find((i) => match(i.kind.toLowerCase()))?.value ?? null;
}

const MISSING_LABEL: Record<string, { ru: string; en: string }> = {
  price: { ru: "цена", en: "price" },
  photo: { ru: "фото", en: "photo" },
  link: { ru: "ссылка на магазин", en: "store link" },
  cta: { ru: "подтверждённая кнопка покупки", en: "confirmed buy button" },
};

function buildWhy(
  bucket: SignalStatus,
  downgraded: boolean,
  missing: string[],
  store: string | null,
  confidence: number
): { ru: string; en: string } {
  if (downgraded) {
    const ru = missing.map((m) => MISSING_LABEL[m]?.ru ?? m).join(", ");
    const en = missing.map((m) => MISSING_LABEL[m]?.en ?? m).join(", ");
    return {
      ru: `Не хватает подтверждённых данных (${ru}) — сигнал переведён в режим наблюдения, чтобы не вводить в заблуждение.`,
      en: `Missing confirmed data (${en}) — shown as Watch instead of an action so it doesn't mislead you.`,
    };
  }
  const at = { ru: store ? ` у ${store}` : "", en: store ? ` at ${store}` : "" };
  switch (bucket) {
    case "buy":
      return {
        ru: `Товар подтверждён в наличии${at.ru}, цена и ссылка на оформление проверены.`,
        en: `Confirmed in stock${at.en} — price and checkout link verified.`,
      };
    case "apply":
      return {
        ru: `Заявка/лист ожидания открыты${at.ru} — можно податься прямо сейчас.`,
        en: `Application/waitlist is open${at.en} — you can apply right now.`,
      };
    case "prepare":
      return {
        ru: "Дата подтверждена официально, продажи ещё не начались — есть время подготовиться.",
        en: "Date is officially confirmed, sales haven't started yet — time to prepare.",
      };
    case "client":
      return {
        ru: "Высокая стоимость или риск по этому товару — сначала нужен подтверждённый клиент.",
        en: "High value or risk on this item — a confirmed client is needed before acting.",
      };
    case "watch":
    default:
      return {
        ru: `Пока недостаточно подтверждённых данных для действия (уверенность ${confidence}%) — сигнал в режиме наблюдения.`,
        en: `Not enough confirmed data yet to act (confidence ${confidence}%) — this signal is in watch mode.`,
      };
  }
}

function buildFactors(downgraded: boolean, missing: string[], confidence: number): { ru: string[]; en: string[] } {
  if (downgraded) {
    return {
      ru: [`Нет данных: ${missing.map((m) => MISSING_LABEL[m]?.ru ?? m).join(", ")}`],
      en: [`Missing: ${missing.map((m) => MISSING_LABEL[m]?.en ?? m).join(", ")}`],
    };
  }
  return { ru: [`Уверенность ${confidence}%`], en: [`Confidence ${confidence}%`] };
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
          marketSales: { orderBy: { observedAt: "desc" }, take: 30 },
          marketAsks: { orderBy: { observedAt: "desc" }, take: 20 },
        },
      },
    },
  });

  const signals: Signal[] = await Promise.all(
    decisions
      .filter((d) => STATUS_MAP[d.status])
      .filter((d) => isTrackedProduct(d.productVariant, d.productVariant.availabilityChecks[0]))
      .map(async (d) => {
        const map = STATUS_MAP[d.status];
        const pv = d.productVariant;
        const product = pv.product;
        const release = pv.releaseEvents[0];
        const check = pv.availabilityChecks[0];
        const sales = pv.marketSales;
        const asks = pv.marketAsks;

        const categories: RadarCategory[] = ["now"];
        if (map.extraCategory) categories.push(map.extraCategory);
        const mappedCat = CATEGORY_MAP[product.category];
        if (mappedCat) categories.push(mappedCat);

        const brand = product.brand;
        const model = titleCase(product.normalizedModel);

        // Acquisition cost includes the known Miami-Dade 7% sales tax. Marketplace
        // fees and outbound shipping are applied only on the exit side below.
        const retail = check?.priceUsd ?? null;
        const cost = retail === null ? null : retail * (1 + MIAMI_DADE_TAX_RATE);
        const ctaConfirmed = check?.ctaState === "enabled";
        const primaryUrl = check?.url ?? null;
        const image = await getProductImage(brand, model, primaryUrl);
        const salePrices = sales.map((sale) => sale.priceMinor / 100);
        const askPrices = asks.map((ask) => ask.priceMinor / 100);
        const completedMedian = median(salePrices);
        const expectedResale = completedMedian;
        const liquidity = liquidityFor(sales);
        const forecast = saleForecast(salePrices, askPrices, liquidity);
        const minExit20 = cost === null
          ? null
          : (cost * 1.2 + OUTBOUND_SHIPPING_ESTIMATE) / (1 - MARKETPLACE_FEE_RATE);

        const sku = pickIdentifier(pv.identifiers, (k) => k.includes("sku")) ?? "—";
        const reference =
          pickIdentifier(pv.identifiers, (k) => /ref|upc|mpn|model/.test(k)) ?? "—";

        // Honesty gate: an actionable (buy/apply) card without a confirmed price,
        // photo, working store link or (for "buy") a confirmed active CTA is not
        // a finished, trustworthy card — show it as WATCH instead of pretending
        // it's ready to act on.
        let bucket = map.bucket;
        let kindLabel = map.kindLabel;
        const missing: string[] = [];
        if (bucket === "buy" || bucket === "apply") {
          if (retail === null) missing.push("price");
          if (!image) missing.push("photo");
          if (!primaryUrl) missing.push("link");
          if (bucket === "buy" && !ctaConfirmed) missing.push("cta");
        }
        const downgraded = missing.length > 0;
        if (downgraded) {
          bucket = "watch";
          kindLabel = "watch";
        }

        const why = buildWhy(bucket, downgraded, missing, check?.sellerOfRecord ?? null, d.evidenceConfidence);
        const factors = buildFactors(downgraded, missing, d.evidenceConfidence);

        return {
          id: d.id,
          status: bucket,
          kindLabel,
          categories,
          brand,
          model,
          reference,
          sku,
          imageUrl: image?.url,
          imageHint: `${brand} ${model}`,
          imageSourceUrl: image?.sourceUrl,
          imageProvenance: image?.provenance,
          retail,
          cost,
          expectedResale,
          completedLow: salePrices.length ? Math.min(...salePrices) : null,
          completedMedian,
          completedHigh: salePrices.length ? Math.max(...salePrices) : null,
          completedSalesCount: salePrices.length,
          askFloor: askPrices.length ? Math.min(...askPrices) : null,
          forecastLow: forecast.low,
          forecastHigh: forecast.high,
          forecastDaysMin: forecast.daysMin,
          forecastDaysMax: forecast.daysMax,
          forecastConfidence: forecast.confidence,
          forecastBasis: forecast.basis,
          minExit20,
          marketplaceFeePct: MARKETPLACE_FEE_RATE * 100,
          shippingEstimate: OUTBOUND_SHIPPING_ESTIMATE,
          taxRatePct: MIAMI_DADE_TAX_RATE * 100,
          liquidity,
          store: check?.sellerOfRecord ?? "—",
          stock: check?.visibleUiStatus ?? check?.ctaState ?? "—",
          primaryUrl,
          checkedAt: (check?.checkedAt ?? d.createdAt).toISOString(),
          launchAt: (release?.startAtUtc ?? d.createdAt).toISOString(),
          ctaConfirmed,
          why: why.ru,
          whyEn: why.en,
          factors: factors.ru,
          factorsEn: factors.en,
        } satisfies Signal;
      })
  );

  const sourceRows = await prisma.source.findMany({
    orderBy: { lastCheckedAt: "desc" },
    take: 60,
  });

  const sources: SourceHealth[] = sourceRows.map((s) => {
    const state: SourceHealth["state"] =
      s.sourceType === "MANUAL" || s.adapterStatus === "manual" || s.adapterStatus === "disabled"
        ? "manual"
        : s.adapterStatus === "active" ? "ok" : "down";
    const detail = s.lastCheckedAt
      ? `${Math.max(0, Math.round((Date.now() - s.lastCheckedAt.getTime()) / 60000))} мин`
      : "—";
    return { name: s.name, category: s.category, state, detail };
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

  const rawNewsSignals = await prisma.signal.findMany({
    where: { productVariantId: null },
    orderBy: { observedAt: "desc" },
    take: 300,
    include: { source: true },
  });
  const PRODUCT_NEWS = /\b(release|drop|launch|collab|limited|exclusive|restock|pre-?order|auction|sold|resale|record|vintage|sneaker|watch|jordan|nike|adidas|chrome hearts|rolex|tudor|patek|cartier|omega|apple|iphone|playstation|xbox|nvidia|radeon|gpu|camera|leica|canon|nikon|fujifilm|dji|porsche|ferrari|lamborghini|electric|ev|vehicle|car|lego|brick|collectible|trading card|memorabilia|fragrance|perfume|jewelry|handbag|archive|clearance|deal|collection|capsule|new arrivals?)\b/i;
  const ENTERTAINMENT_ONLY = /\b(anime|netflix|season\s+\d|episode|trailer|film|movie|music video)\b/i;
  const COMMERCE_CONTEXT = /\b(merch|collectible|figure|shoe|sneaker|watch|jewelry|fashion|capsule|collab|limited|drop|auction|sold|resale)\b/i;
  const seenNews = new Set<string>();
  const perSource = new Map<string, number>();
  const perCategory = new Map<string, number>();
  const newsSignals = rawNewsSignals.filter((signal) => {
    const headline = decodeHtmlEntities(signal.rawText ?? "");
    if (!PRODUCT_NEWS.test(headline)) return false;
    if (ENTERTAINMENT_ONLY.test(headline) && !COMMERCE_CONTEXT.test(headline)) return false;
    const key = signal.url?.trim().toLowerCase() || headline.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || seenNews.has(key)) return false;
    const sourceCount = perSource.get(signal.sourceId) ?? 0;
    const categoryCount = perCategory.get(signal.source.category) ?? 0;
    if (sourceCount >= 4 || categoryCount >= 8) return false;
    seenNews.add(key);
    perSource.set(signal.sourceId, sourceCount + 1);
    perCategory.set(signal.source.category, categoryCount + 1);
    return true;
  }).slice(0, 36);

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
      evidence: { orderBy: { observedAt: "desc" }, take: 1 },
    },
  });

  const BUCKET_LABEL: Record<string, string> = { buy: "BUY NOW", apply: "APPLY NOW" };

  const signalNewsSource = signals.filter((s) => s.status === "buy" || s.status === "apply").slice(0, 10);

  const recentAlerts = await prisma.alert.findMany({
    where: { channel: "browser", NOT: { dedupeKey: { endsWith: ":first_detection" } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const [releaseVariantImages, newsSignalImages] = await Promise.all([
    Promise.all(releaseVariants.map((v) => getProductImage(
      v.product.brand,
      titleCase(v.product.normalizedModel),
      v.evidence[0]?.url ?? null
    ))),
    Promise.all(newsSignals.map((signal) => getPageImage(signal.url))),
  ]);

  const chronologicalNews: NewsItem[] = [
    ...releaseVariants.map((v, i) => ({
      id: "release:" + v.id,
      kind: "RELEASE" as const,
      headline: v.product.brand + " " + titleCase(v.product.normalizedModel),
      brand: v.product.brand,
      model: titleCase(v.product.normalizedModel),
      source: "confirmed release",
      category: v.product.category,
      sourceUrl: v.evidence[0]?.url ?? null,
      imageUrl: releaseVariantImages[i]?.url,
      imageSourceUrl: releaseVariantImages[i]?.sourceUrl,
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
      category: s.categories.find((category) => !["now", "soon"].includes(category)),
      sourceUrl: s.primaryUrl ?? null,
      imageUrl: s.imageUrl,
      imageSourceUrl: s.imageSourceUrl,
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
        category: "alerts",
        sourceUrl: null,
        observedAt: a.createdAt.toISOString(),
        launchAt: null,
      };
    }),
    ...newsSignals.map((s, i) => ({
      id: "news:" + s.id,
      kind: (/\b(auction|sold|sale|resale|record|profit|flipped|million|million-dollar|hammer price)\b/i.test(s.rawText ?? "") ? "MARKET" : "NEWS") as NewsItem["kind"],
      headline: decodeHtmlEntities(s.rawText ?? "New signal detected").slice(0, 140),
      source: s.source.name,
      category: s.source.category,
      sourceUrl: s.url ?? null,
      imageUrl: newsSignalImages[i]?.url,
      imageSourceUrl: newsSignalImages[i]?.sourceUrl,
      observedAt: s.observedAt.toISOString(),
      launchAt: null,
    })),
  ].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

  // Keep exceptional completed-sale stories visible instead of letting a single
  // high-volume release feed push them off the first screen.
  const marketStories = chronologicalNews.filter((item) => item.kind === "MARKET");
  const regularNews = chronologicalNews.filter((item) => item.kind !== "MARKET");
  const newsItems: NewsItem[] = [];
  let storyIndex = 0;
  for (const item of regularNews) {
    newsItems.push(item);
    if (newsItems.length % 3 === 0 && marketStories[storyIndex]) newsItems.push(marketStories[storyIndex++]);
  }
  newsItems.push(...marketStories.slice(storyIndex));

  return {
    signals,
    newsItems,
    sources,
    logs,
    scannedAt: (scannedAtSource ?? new Date()).toISOString(),
  };
}
