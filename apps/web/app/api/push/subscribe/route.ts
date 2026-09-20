import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { removePushSubscription, savePushSubscription, type BrowserPushSubscription } from "@/lib/notifications/push";

function validSubscription(value: unknown): value is BrowserPushSubscription {
  if (!value || typeof value !== "object") return false;
  const subscription = value as BrowserPushSubscription;
  try {
    const endpoint = new URL(subscription.endpoint);
    return endpoint.protocol === "https:" && Boolean(subscription.keys?.p256dh && subscription.keys?.auth);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  const body = (await request.json()) as { subscription?: unknown };
  if (!validSubscription(body.subscription)) return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  await savePushSubscription(userId, body.subscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  const body = (await request.json()) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") return NextResponse.json({ error: "invalid_endpoint" }, { status: 400 });
  await removePushSubscription(userId, body.endpoint);
  return NextResponse.json({ ok: true });
}
