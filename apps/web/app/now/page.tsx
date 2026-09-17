import type { FeedPayload } from "@/lib/radar/types";
import { MOCK_FEED } from "@/lib/radar/mock";
import { RadarFeedClient } from "./RadarFeedClient";

export const revalidate = 60;

async function getFeed(): Promise<FeedPayload> {
  return MOCK_FEED;
}

export default async function NowPage() {
  const payload = await getFeed();
  const isStale = Date.now() - new Date(payload.scannedAt).getTime() > 5 * 60_000;

  return <RadarFeedClient payload={payload} isStale={isStale} />;
}
