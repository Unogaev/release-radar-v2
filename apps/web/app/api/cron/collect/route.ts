import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGenericRssAdapter, createStructuredDataAdapter } from "../../../../collectors/genericAdapter";
import { runSourcePipeline } from "../../../../collectors/pipeline";
import { createDueReleaseReminders } from "@/lib/notifications/alerts";
import { ensureRadarSourceRegistry } from "@/lib/sources/registry";
import { fetchRssItems } from "../../../../collectors/rss";
import { fetchPageDiscoveries } from "../../../../collectors/pageDiscovery";
import { appendEarlyDemandMetadata, classifyEarlyDemand } from "@/lib/radar/earlyDemand";
import { syncVerifiedReleases } from "@/lib/radar/verifiedReleases";
import { syncVerifiedVintageDemand } from "@/lib/radar/verifiedVintageDemand";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("user-agent") === "vercel-cron/1.0";
  // Vercel's scheduler is still allowed to run when a legacy deployment has
  // no CRON_SECRET configured. Ordinary browser requests remain blocked.
  if (cronSecret ? authHeader !== `Bearer ${cronSecret}` : !isVercelCron) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureRadarSourceRegistry(prisma);
  await syncVerifiedReleases();
  await syncVerifiedVintageDemand();
  const sources = await prisma.source.findMany({
    where: { isEnabled: true },
    orderBy: [{ lastCheckedAt: "asc" }, { trustLevel: "desc" }],
    // Rotate through the registry on every hourly run without risking the
    // platform timeout. Oldest sources are always selected first.
    take: 80,
  });
  const results = [];

  const DEFAULT_BRAND_BY_SOURCE: Record<string, string> = {
    "PlayStation Blog": "PlayStation",
    "Xbox Wire": "Xbox",
  };

  const dueSources = sources.filter((source) =>
      !source.lastCheckedAt ||
      Date.now() - source.lastCheckedAt.getTime() > (source.checkIntervalMinutes ?? 60) * 60_000
  );

  async function collectSource(source: (typeof sources)[number]) {

    let runResult;
    if (source.sourceType === "RSS" || source.sourceType === "NEWSROOM" || source.sourceType === "MANUAL") {
      try {
        const items = source.sourceType === "MANUAL"
          ? await fetchPageDiscoveries(source.url, 8)
          : await fetchRssItems(source.url, 25);
        const existingSignals = await prisma.signal.findMany({
          where: { sourceId: source.id, url: { in: items.map((item) => item.url) } },
          select: { url: true },
        });
        const existingUrls = new Set(existingSignals.map((signal) => signal.url).filter(Boolean));
        const freshItems = items.filter((item) => !existingUrls.has(item.url));
        const preparedItems = freshItems.flatMap((item) => {
          const early = classifyEarlyDemand(item.title);
          // Dedicated social-pulse searches are deliberately narrow. General
          // sources keep all product news, while pulse sources only store an
          // actionable early-demand pattern to avoid a noisy celebrity feed.
          if (source.category === "social-pulse" && !early) return [];
          return [{ ...item, early }];
        });
        if (preparedItems.length) {
          await prisma.signal.createMany({
            data: preparedItems.map((item) => ({
              sourceId: source.id,
              rawText: (() => {
                const base = item.imageUrl
                  ? `${item.title}\n[rr:image=${encodeURIComponent(item.imageUrl)}]`
                  : item.title;
                return item.early ? appendEarlyDemandMetadata(base, item.early) : base;
              })(),
              url: item.url,
              observedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
            })),
          });
        }
        const created = preparedItems.length;
        runResult = { sourceId: source.id, discovered: items.length, decisionsCreated: 0, newItems: created, error: null };
      } catch (error) {
        runResult = { sourceId: source.id, discovered: 0, decisionsCreated: 0, newItems: 0, error: error instanceof Error ? error.message : String(error) };
      }
    } else {
      const adapter = source.sourceType === "PRODUCT_LISTING"
        ? createStructuredDataAdapter({ sourceId: source.id, productUrl: source.url })
        : createGenericRssAdapter({
            sourceId: source.id,
            feedUrl: source.url,
            category: source.category,
            defaultBrand: DEFAULT_BRAND_BY_SOURCE[source.name],
          });
      runResult = await runSourcePipeline(prisma, { id: source.id, category: source.category }, adapter, "33160");
    }

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: new Date(),
        lastSuccessAt: runResult.error ? source.lastSuccessAt : new Date(),
        lastError: runResult.error,
        adapterStatus: runResult.error ? "error" : "active",
        itemsDiscovered: { increment: runResult.discovered },
      },
    });

    return runResult;
  }

  // A controlled fan-out lets every due official page participate in the
  // sweep while keeping request pressure reasonable for brands and retailers.
  for (let index = 0; index < dueSources.length; index += 16) {
    const batch = await Promise.all(dueSources.slice(index, index + 16).map(collectSource));
    results.push(...batch);
  }

  const remindersCreated = await createDueReleaseReminders();
  return NextResponse.json({ ranAt: new Date().toISOString(), sources: results.length, remindersCreated, results });
}
