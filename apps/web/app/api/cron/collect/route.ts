import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGenericRssAdapter, createStructuredDataAdapter } from "../../../../collectors/genericAdapter";
import { runSourcePipeline } from "../../../../collectors/pipeline";
import { createDueReleaseReminders } from "@/lib/notifications/alerts";
import { ensureRadarSourceRegistry } from "@/lib/sources/registry";
import { fetchRssItems } from "../../../../collectors/rss";
import { fetchPageDiscoveries } from "../../../../collectors/pageDiscovery";import { createShopifyAdapter } from "../../../../collectors/shopifyAdapter";
import { syncVerifiedReleases } from "@/lib/radar/verifiedReleases";
import { syncVerifiedVintageDemand } from "@/lib/radar/verifiedVintageDemand";
import { refreshFeedCards } from "@/lib/radar/feedCards";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // The cron runs on a hard execution budget (60s on the current plan), so
  // the clock starts here — every step below, including the upfront syncs,
  // spends from the same budget.
  const startedAt = Date.now();

  await ensureRadarSourceRegistry(prisma);
  await syncVerifiedReleases();
  await syncVerifiedVintageDemand();
  const sources = await prisma.source.findMany({
    where: { isEnabled: true },
        orderBy: [{ lastCheckedAt: { sort: "asc", nulls: "first" } }, { trustLevel: "desc" }],
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
        /* BROWSER_VERIFICATION is a human-verification channel, not a fetchable feed — skip gracefully instead of erroring on its empty URL. */
    if (source.sourceType === "BROWSER_VERIFICATION") {
      await prisma.source.update({
        where: { id: source.id },
        data: { lastCheckedAt: new Date(), lastError: null, adapterStatus: "manual" },
      });
      return { sourceId: source.id, discovered: 0, decisionsCreated: 0, newItems: 0, error: null, skipped: true };
    }

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
        if (freshItems.length) {
          await prisma.signal.createMany({
            data: freshItems.map((item) => ({
              sourceId: source.id,
              rawText: item.imageUrl
                ? `${item.title}\n[rr:image=${encodeURIComponent(item.imageUrl)}]`
                : item.title,
              url: item.url,
              observedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
            })),
          });
        }
        const created = freshItems.length;
        runResult = { sourceId: source.id, discovered: items.length, decisionsCreated: 0, newItems: created, error: null };
      } catch (error) {
        runResult = { sourceId: source.id, discovered: 0, decisionsCreated: 0, newItems: 0, error: error instanceof Error ? error.message : String(error) };
      }
    } else {
      const adapter = source.sourceType === "PRODUCT_LISTING"
        ? createStructuredDataAdapter({ sourceId: source.id, productUrl: source.url }) : source.sourceType === "SHOPIFY" ? createShopifyAdapter({ sourceId: source.id, storeUrl: source.url })
        : createGenericRssAdapter({
            sourceId: source.id,
            feedUrl: source.url,
            category: source.category,
            defaultBrand: DEFAULT_BRAND_BY_SOURCE[source.name],
          });
      runResult = await runSourcePipeline(prisma, { id: source.id, category: source.category, sourceType: source.sourceType }, adapter, "33160");
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
  // Stop launching new batches once the execution budget is nearly spent so
  // the run always finishes honestly: card materialization and the report
  // still happen, and skipped sources are reported instead of silently
  // dropped. They are picked up first on the next run (oldest lastCheckedAt
  // first), so nothing starves.
  const SOURCE_BUDGET_MS = 38_000;
  for (let index = 0; index < dueSources.length; index += 16) {
    if (Date.now() - startedAt > SOURCE_BUDGET_MS) break;
    const batch = await Promise.all(dueSources.slice(index, index + 16).map(collectSource));
    results.push(...batch);
  }
  const skippedSources = dueSources.length - results.length;

  const remindersCreated = await createDueReleaseReminders();
  // Materialize card images and verified store links in the background so the
  // /now render path stays a pure database read. Bounded per run to protect
  // the cron's execution budget; failures never break the collection report.
  const feedCards = await refreshFeedCards().catch((error) => ({
    refreshed: 0,
    failed: 0,
    error: error instanceof Error ? error.message : String(error),
  }));
  return NextResponse.json({ ranAt: new Date().toISOString(), sources: results.length, skippedSources, remindersCreated, feedCards, results });
}
