import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGenericRssAdapter, createStructuredDataAdapter } from "../../../../collectors/genericAdapter";
import { runSourcePipeline } from "../../../../collectors/pipeline";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = await prisma.source.findMany({ where: { isEnabled: true } });
  const results = [];

  const DEFAULT_BRAND_BY_SOURCE: Record<string, string> = {
    "PlayStation Blog": "PlayStation",
    "Xbox Wire": "Xbox",
  };

  for (const source of sources) {
    if (source.sourceType === "MANUAL") continue;

    const dueForCheck =
      !source.lastCheckedAt ||
      Date.now() - source.lastCheckedAt.getTime() > (source.checkIntervalMinutes ?? 60) * 60_000;
    if (!dueForCheck) continue;

    const adapter =
      source.sourceType === "PRODUCT_LISTING"
        ? createStructuredDataAdapter({ sourceId: source.id, productUrl: source.url })
        : createGenericRssAdapter({
            sourceId: source.id,
            feedUrl: source.url,
            category: source.category,
            defaultBrand: DEFAULT_BRAND_BY_SOURCE[source.name],
          });

    const runResult = await runSourcePipeline(
      prisma,
      { id: source.id, category: source.category },
      adapter,
      "33160"
    );

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

    results.push(runResult);
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), sources: results.length, results });
}
