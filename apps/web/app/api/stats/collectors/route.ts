import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  /* Manual-by-design sources (official pages checked by hand, disabled adapters)
     can never be "active" — they must not count against collector health.
     Mirrors the feed's own source-state mapping in lib/radar/serverFeed.ts. */
  const autoWhere = {
    isEnabled: true,
    NOT: [{ sourceType: "MANUAL" }, { adapterStatus: "manual" }, { adapterStatus: "disabled" }],
  };
  const [total, active, lastSource] = await Promise.all([
    prisma.source.count({ where: autoWhere }),
    prisma.source.count({ where: { ...autoWhere, adapterStatus: "active" } }),
    prisma.source.findFirst({
      where: { lastCheckedAt: { not: null } },
      orderBy: { lastCheckedAt: "desc" },
      select: { lastCheckedAt: true },
    }),
  ]);

  return NextResponse.json({
    total,
    active,
    lastCheckedAt: lastSource?.lastCheckedAt ?? null,
  });
}
