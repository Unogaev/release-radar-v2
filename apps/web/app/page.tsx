import { getRealFeed } from "@/lib/radar/serverFeed";
import { derive } from "@/lib/radar/derive";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { EditorialHome } from "./EditorialHome";

export const revalidate = 60;

export default async function EditorialHomePage() {
  await requireUserId();
  const [payload, openCount, proof] = await Promise.all([
    getRealFeed(),
    prisma.clientRequest.count({ where: { status: "open" } }),
    prisma.clientRequest
      .findMany({
        where: { status: "fulfilled" },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, title: true, brand: true, model: true, updatedAt: true },
      })
      .then((rows) => rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))),
  ]);
  const withMedia = payload.signals.filter((s) => s.imageUrl && s.primaryUrl);
  const signals = withMedia.slice(0, 5).map(derive);
  const tickerSignals = payload.signals.slice(0, 10).map(derive);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <EditorialHome
      signals={signals}
      tickerSignals={tickerSignals}
      openCount={openCount}
      proof={proof}
      today={today}
    />
  );
}
