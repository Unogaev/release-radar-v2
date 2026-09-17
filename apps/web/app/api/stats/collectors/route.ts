import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [total, active, lastSource] = await Promise.all([
    prisma.source.count({ where: { isEnabled: true } }),
    prisma.source.count({ where: { isEnabled: true, adapterStatus: "active" } }),
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
