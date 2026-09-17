import type { FeedPayload } from "@/lib/radar/types";
import { getRealFeed } from "@/lib/radar/serverFeed";
import { requireUserId } from "@/lib/session";
import { RadarFeedClient } from "./RadarFeedClient";

export const revalidate = 60;

async function getFeed(): Promise<FeedPayload> {
  return getRealFeed();
}

export default async function NowPage() {
  await requireUserId();
  const payload = await getFeed();
  const isStale = Date.now() - new Date(payload.scannedAt).getTime() > 5 * 60_000;

  return <RadarFeedClient payload={payload} isStale={isStale} />;
}
