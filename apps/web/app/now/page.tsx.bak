import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SignalCard, SignalCardData } from "@/components/SignalCard";
import { KpiTile } from "@/components/KpiTile";
import Link from "next/link";
import { Zap, TrendingUp, Clock, Radio, RadioTower, ScanLine } from "lucide-react";

export default async function NowPage() {
  await requireUserId();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const in72h = new Date(Date.now() + 72 * 3600 * 1000);

  const [
    decisions,
    activeOpportunities,
    buyNowCount,
    releases72h,
    signalsToday,
    sourcesTotal,
    sourcesOnline,
    lastScanSource,
    sourcesCheckedToday,
    skippedTodayRaw,
  ] = await Promise.all([
    prisma.decision.findMany({
      where: { status: { not: "SKIP" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { productVariant: { include: { product: true, identifiers: true } } },
    }),
    prisma.decision.count({ where: { status: { not: "SKIP" } } }),
    prisma.decision.count({ where: { status: { in: ["BUY_NOW", "SOURCE_NOW"] } } }),
    prisma.releaseEvent.count({ where: { startAtUtc: { gte: new Date(), lte: in72h } } }),
    prisma.signal.count({ where: { observedAt: { gte: startOfToday } } }),
    prisma.source.count({ where: { isEnabled: true } }),
    prisma.source.count({ where: { isEnabled: true, adapterStatus: "active" } }),
    prisma.source.findFirst({
      where: { lastCheckedAt: { not: null } },
      orderBy: { lastCheckedAt: "desc" },
      select: { lastCheckedAt: true },
    }),
    prisma.source.count({ where: { lastCheckedAt: { gte: startOfToday } } }),
    prisma.decision.findMany({
      where: { status: "SKIP", createdAt: { gte: startOfToday } },
      select: { blockedReasons: true },
    }),
  ]);

  const reasonCounts: Record<string, number> = {};
  for (const d of skippedTodayRaw) {
    for (const r of d.blockedReasons) reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const cardData: SignalCardData[] = decisions.map((d) => ({
    id: d.id,
    brand: d.productVariant.product.brand,
    model: d.productVariant.product.normalizedModel,
    category: d.productVariant.product.category,
    variantLabel: d.productVariant.variantLabel,
    sku: d.productVariant.identifiers[0]?.value ?? null,
    status: d.status,
    rationale: d.rationale,
    evidenceConfidence: d.evidenceConfidence,
    createdAt: d.createdAt,
  }));

  const buyNowCards = cardData.filter((c) => c.status === "BUY_NOW" || c.status === "SOURCE_NOW");
  const otherCards = cardData.filter((c) => c.status !== "BUY_NOW" && c.status !== "SOURCE_NOW");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-graphite-100">Command Center</h1>
        <p className="text-sm text-graphite-400 mt-1">
          Автоматический мониторинг дефицитных релизов — статус на текущий момент.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile icon={Zap} label="Active opportunities" value={activeOpportunities} />
        <KpiTile icon={TrendingUp} label="BUY NOW" value={buyNowCount} accent="text-red-400" />
        <KpiTile icon={Clock} label="Releases in 72h" value={releases72h} />
        <KpiTile icon={Radio} label="Signals today" value={signalsToday} />
        <KpiTile icon={RadioTower} label="Sources online" value={`${sourcesOnline}/${sourcesTotal}`} />
        <KpiTile
          icon={ScanLine}
          label="Last scan"
          value={
            lastScanSource?.lastCheckedAt
              ? new Date(lastScanSource.lastCheckedAt).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
              : "—"
          }
          small
        />
      </div>

      {buyNowCards.length === 0 ? (
        <div className="border border-graphite-700 rounded-xl p-6 bg-graphite-900">
          <div className="text-graphite-100 font-medium">No verified BUY NOW opportunities</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-graphite-400 tabular-nums">
            <span>{sourcesCheckedToday} sources checked today</span>
            <span>{signalsToday} candidates detected</span>
            <span>{skippedTodayRaw.length} filtered out</span>
          </div>
          {topReasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-graphite-500">
              {topReasons.map(([reason, count]) => (
                <li key={reason}>· {reason} ({count})</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">Critical actions</h2>
          <div className="space-y-3">
            {buyNowCards.map((c) => (
              <SignalCard key={c.id} signal={c} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">Live feed</h2>
          <Link href="/radar" className="text-xs text-graphite-500 hover:text-lime transition-colors">
            Все сигналы →
          </Link>
        </div>
        {otherCards.length === 0 ? (
          <div className="border border-dashed border-graphite-700 rounded-xl p-8 text-center text-sm text-graphite-500 bg-graphite-900">
            Пока нет дополнительных сигналов, прошедших проверку.
          </div>
        ) : (
          <div className="space-y-3">
            {otherCards.slice(0, 10).map((c) => (
              <SignalCard key={c.id} signal={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
