import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!owner) {
    return NextResponse.json({ alerts: [] });
  }

  const rows = await prisma.alert.findMany({
    where: { userId: owner.id },
    orderBy: { id: "desc" },
    take: 50,
  });

  const alerts = rows.map((r) => {
    let title = "Notification";
    let body = "";
    try {
      const parsed = JSON.parse(r.payload);
      title = parsed.title ?? title;
      body = parsed.body ?? "";
    } catch {
      body = r.payload;
    }
    return {
      id: r.id,
      title,
      body,
      channel: r.channel,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    };
  });

  return NextResponse.json({ alerts });
}
