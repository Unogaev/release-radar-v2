import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60_000);
  const since2h = new Date(now.getTime() - 2 * 60 * 60_000);
  try {
    const [sourcesTotal, sourcesChecked2h, signals24h, decisions24h, latestSource] = await Promise.all([
      prisma.source.count({ where: { isEnabled: true } }),
      prisma.source.count({ where: { isEnabled: true, lastCheckedAt: { gte: since2h } } }),
      prisma.signal.count({ where: { observedAt: { gte: since24h } } }),
      prisma.decision.count({ where: { createdAt: { gte: since24h } } }),
      prisma.source.findFirst({ orderBy: { lastCheckedAt: "desc" }, select: { lastCheckedAt: true } }),
    ]);
    const lastScanAt = latestSource?.lastCheckedAt?.toISOString() ?? null;
    const stale = !latestSource?.lastCheckedAt || now.getTime() - latestSource.lastCheckedAt.getTime() > 2 * 60 * 60_000;
    return NextResponse.json({ ok: !stale, stale, lastScanAt, sourcesTotal, sourcesChecked2h, signals24h, decisions24h, checkedAt: now.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, stale: true, error: "radar_database_unavailable", checkedAt: now.toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
