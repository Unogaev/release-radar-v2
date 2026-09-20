import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { sendPushToUser } from "@/lib/notifications/push";

export async function POST() {
  const userId = await requireUserId();
  const result = await sendPushToUser(userId, {
    title: "Release Radar · push работает",
    body: "Критические BUY NOW, APPLY NOW и напоминания смогут приходить при закрытом сайте.",
    url: "/now",
    tag: "release-radar-test",
  });
  if (!result.configured) return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
  return NextResponse.json({ ok: result.sent > 0, ...result }, { status: result.sent > 0 ? 200 : 409 });
}
