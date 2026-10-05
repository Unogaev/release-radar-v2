import { getRealFeed } from "@/lib/radar/serverFeed";
import { derive } from "@/lib/radar/derive";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { HomePageClient } from "./HomePageClient";

export const revalidate = 60;

export default async function HomePage() {
  await requireUserId();
  const [payload, openCount, proof] = await Promise.all([
    getRealFeed(),
    prisma.clientRequest.count({ where: { status: "open" } }),
    prisma.clientRequest.findMany({
      where: { status: "fulfilled" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, brand: true, model: true, updatedAt: true },
    }),
  ]);
  const signals = payload.signals
    .filter((s) => s.imageUrl && s.primaryUrl)
    .slice(0, 3)
    .map(derive);
  return <HomePageClient signals={signals} openCount={openCount} proof={proof} />;
}
