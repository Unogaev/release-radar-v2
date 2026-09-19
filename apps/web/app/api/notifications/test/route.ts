import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!owner) {
    return NextResponse.json(
      { error: "No owner account exists yet. Run seed:owner first." },
      { status: 400 }
    );
  }

  const decision = await prisma.decision.findFirst({ orderBy: { createdAt: "desc" } });
  if (!decision) {
    return NextResponse.json(
      { error: "No decision exists yet in the database to attach a test notification to." },
      { status: 400 }
    );
  }

  const dedupeKey = "test:" + Date.now();
  const payload = JSON.stringify({
    title: "[TEST] Notification pipeline check",
    body: "This is a manually triggered test notification. If you see this, the browser Notification pipeline works.",
  });

  const alert = await prisma.alert.create({
    data: {
      userId: owner.id,
      decisionId: decision.id,
      channel: "browser",
      payload,
      dedupeKey,
    },
  });

  return NextResponse.json({ ok: true, alertId: alert.id });
}
