import { NextRequest, NextResponse } from "next/server";
import { refreshResaleEstimates } from "@/lib/radar/resaleEstimates";

export const runtime = "nodejs";
export const maxDuration = 60;

// Лёгкий крон семейства /api/cron/*: обновление оценок перепродажи
// (Phase 1 — только данные, без изменений UI).
// Авторизация — как у /api/cron/collect и /api/cron/mowalola.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await refreshResaleEstimates();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
