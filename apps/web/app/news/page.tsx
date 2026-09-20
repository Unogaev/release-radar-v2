import { getRealFeed } from "@/lib/radar/serverFeed";
import { requireUserId } from "@/lib/session";
import { NewsFeedClient } from "./NewsFeedClient";

export const revalidate = 60;

export default async function NewsPage() {
  await requireUserId();
  const payload = await getRealFeed();
  return <NewsFeedClient items={payload.newsItems} />;
}
