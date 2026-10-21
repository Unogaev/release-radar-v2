// apps/web/lib/radar/resaleEstimates.ts
//
// Материализация оценок перепродажи: фоновый refresh для крона
// /api/cron/resale-estimates. Паттерн — как lib/radar/feedCards.ts:
// идемпотентное создание таблицы + bounded batch + честный отчёт.
// В MarketSale НЕ пишем (там только верифицированные продажи).

import { prisma } from "@/lib/prisma";
import {
  collectStockXEstimate,
  sleep,
  type ResaleEstimateInput,
} from "../../collectors/resaleEstimate";

// Приоритетный watch-item: Apple iPhone Duo — запуск 23.10.2026, от $1,999,
// предзаказы распроданы за минуты. Первый кандидат на оценку, как только
// появятся листинги (до 23.10 совпадений не будет — matcher честно ничего
// не запишет).
const PRIORITY_WATCH: Array<{ brand: string; nameTokens: string[] }> = [
  { brand: "apple", nameTokens: ["iphone", "duo"] },
];

// «Полный потенциал»: решения, при которых карточка несёт действие, а не
// наблюдение. WATCH / WATCH_RESTOCK / VERIFY / SKIP сюда не входят.
const ACTIONABLE_STATUSES = [
  "BUY_NOW",
  "APPLY_NOW",
  "SOURCE_NOW",
  "PREPARE",
  "APPLY_RESERVE",
  "RESERVE_PICKUP",
  "CLIENT_FIRST",
  "CONTACT_DEALER",
  "VERIFY_IN_STORE",
];

const ESTIMATE_STALE_MS = 24 * 60 * 60 * 1000; // ротация: не чаще раза в сутки на вариант
const BATCH_SIZE = 24;
const RUN_BUDGET_MS = 45_000; // жёсткий бюджет внутри maxDuration=60s
const POLITENESS_MS = 1200; // пауза между товарами (уважение к rate limits)

// Проект применяет схему через `prisma db push` при сборке (см. build-скрипт
// apps/web), а этот ensure — страховка по паттерну ensureFeedCardTable():
// первый прогон крона сам долечивает схему вместо падения.
export async function ensureResaleEstimateTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ResaleEstimate" (
      "id" TEXT PRIMARY KEY,
      "productVariantId" TEXT NOT NULL,
      "valueUsd" DOUBLE PRECISION NOT NULL,
      "source" TEXT NOT NULL,
      "sampleSize" INTEGER NOT NULL,
      "asOf" TIMESTAMPTZ NOT NULL,
      "matchScore" DOUBLE PRECISION NOT NULL,
      "detailJson" JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ResaleEstimate_productVariantId_fkey') THEN
        ALTER TABLE "ResaleEstimate"
          ADD CONSTRAINT "ResaleEstimate_productVariantId_fkey"
          FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ResaleEstimate_variant_asOf_idx"
      ON "ResaleEstimate" ("productVariantId", "asOf")
  `);
}

export interface BatchItem extends ResaleEstimateInput {
  decisionStatus: string | null;
  category: string;
}

// Приоритет батча:
// P0 — watch-item (iPhone Duo);
// P1 — варианты с розничной ценой и «полным потенциалом» (actionable-решения);
// P2 — sneakers/streetwear с ценой;
// P3 — остальные варианты с ценой.
// Уже оценённые за последние 24ч — пропускаем (ротация).
export async function selectEstimateBatch(limit: number = BATCH_SIZE): Promise<BatchItem[]> {
  const freshSince = new Date(Date.now() - ESTIMATE_STALE_MS);
  const candidates = await prisma.productVariant.findMany({
    where: {
      availabilityChecks: { some: { priceUsd: { not: null } } },
      resaleEstimates: { none: { asOf: { gte: freshSince } } },
    },
    include: {
      product: true,
      identifiers: true,
      availabilityChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 300,
  });

  const items: BatchItem[] = candidates.map((v) => {
    const styleId = v.identifiers.find((i) =>
      ["sku", "style", "style_code", "stylecode", "mpn"].includes(i.kind.toLowerCase())
    );
    const label = v.variantLabel && v.variantLabel !== "default" ? ` ${v.variantLabel}` : "";
    return {
      productVariantId: v.id,
      trackedName: `${v.product.brand} ${v.product.normalizedModel}${label}`.replace(/\s+/g, " ").trim(),
      brand: v.product.brand,
      styleCode: styleId ? styleId.value : null,
      retailPriceUsd: v.availabilityChecks[0]?.priceUsd ?? null,
      decisionStatus: v.decisions[0]?.status ?? null,
      category: v.product.category,
    };
  });

  const isWatch = (it: BatchItem) =>
    PRIORITY_WATCH.some(
      (w) =>
        it.brand.toLowerCase() === w.brand &&
        w.nameTokens.every((t) => it.trackedName.toLowerCase().includes(t))
    );
  const rank = (it: BatchItem) => {
    if (isWatch(it)) return 0;
    if (it.decisionStatus && ACTIONABLE_STATUSES.includes(it.decisionStatus)) return 1;
    if (["sneakers", "streetwear"].includes(it.category.toLowerCase())) return 2;
    return 3;
  };
  return items.sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

export interface RefreshResaleSummary {
  ranAt: string;
  attempted: number;
  estimated: number;
  stoppedEarly: boolean;
  stored: Array<{
    productVariantId: string;
    trackedName: string;
    valueUsd: number;
    source: string;
    sampleSize: number;
    matchScore: number;
    asOf: string;
  }>;
  skipped: Array<{ productVariantId: string; trackedName: string; reason: string; detail: string }>;
  failed: Array<{ productVariantId: string; trackedName: string; error: string }>;
  coverage: { pricedCards: number; variantsWithFreshEstimate: number; pct: number | null };
}

export async function refreshResaleEstimates(): Promise<RefreshResaleSummary> {
  await ensureResaleEstimateTable();
  const batch = await selectEstimateBatch();
  const summary: RefreshResaleSummary = {
    ranAt: new Date().toISOString(),
    attempted: 0,
    estimated: 0,
    stoppedEarly: false,
    stored: [],
    skipped: [],
    failed: [],
    coverage: { pricedCards: 0, variantsWithFreshEstimate: 0, pct: null },
  };
  const started = Date.now();

  for (const item of batch) {
    if (Date.now() - started > RUN_BUDGET_MS) {
      summary.stoppedEarly = true;
      break;
    }
    summary.attempted += 1;
    const outcome = await collectStockXEstimate(item);
    if (outcome.kind === "estimate") {
      const e = outcome.estimate;
      await prisma.resaleEstimate.create({
        data: {
          productVariantId: item.productVariantId,
          valueUsd: e.valueUsd,
          source: e.source,
          sampleSize: e.sampleSize,
          asOf: e.asOf,
          matchScore: e.matchScore,
          detailJson: {
            note: e.note,
            evidenceUrl: e.evidenceUrl,
            raw: e.raw,
            retailPriceUsd: item.retailPriceUsd,
            trackedName: item.trackedName,
          },
        },
      });
      summary.estimated += 1;
      summary.stored.push({
        productVariantId: item.productVariantId,
        trackedName: item.trackedName,
        valueUsd: e.valueUsd,
        source: e.source,
        sampleSize: e.sampleSize,
        matchScore: e.matchScore,
        asOf: e.asOf.toISOString(),
      });
    } else if (outcome.kind === "skipped") {
      summary.skipped.push({
        productVariantId: item.productVariantId,
        trackedName: item.trackedName,
        reason: outcome.reason,
        detail: outcome.detail,
      });
    } else {
      summary.failed.push({
        productVariantId: item.productVariantId,
        trackedName: item.trackedName,
        error: outcome.error,
      });
    }
    await sleep(POLITENESS_MS);
  }

  // Покрытие: доля прайс-карточек (FeedCard у вариантов с розничной ценой),
  // для которых есть актуальная (<48ч) оценка.
  const pricedCards = await prisma.feedCard.count({
    where: { productVariant: { availabilityChecks: { some: { priceUsd: { not: null } } } } },
  });
  const freshSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const freshGroups = await prisma.resaleEstimate.groupBy({
    by: ["productVariantId"],
    where: { asOf: { gte: freshSince } },
  });
  summary.coverage = {
    pricedCards,
    variantsWithFreshEstimate: freshGroups.length,
    pct: pricedCards > 0 ? Math.round((freshGroups.length / pricedCards) * 1000) / 10 : null,
  };
  return summary;
}
