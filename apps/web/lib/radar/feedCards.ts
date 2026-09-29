import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";
import { getProductImage, isLiveExternalUrl } from "./fetchImage";
import { decodeHtmlEntities } from "./text";

/**
 * Materialized card assets.
 *
 * Resolving a product image and checking link liveness needs live network
 * calls (a full page fetch plus a HEAD request, up to 7s each). Running those
 * inside the /now render path meant every page view fired ~80 outbound
 * requests — slow on mobile and one dead retailer away from a broken feed.
 *
 * Instead, the collector cron builds FeedCard rows in the background and the
 * render path only reads them. Until a row exists for a variant, the card
 * degrades gracefully to WATCH through the existing honesty gate instead of
 * showing an unverified buy action.
 */

const FEED_STATUSES = [
  DecisionStatus.BUY_NOW,
  DecisionStatus.CONTACT_DEALER,
  DecisionStatus.SOURCE_NOW,
  DecisionStatus.APPLY_NOW,
  DecisionStatus.APPLY_RESERVE,
  DecisionStatus.RESERVE_PICKUP,
  DecisionStatus.PREPARE,
  DecisionStatus.VERIFY,
  DecisionStatus.VERIFY_IN_STORE,
  DecisionStatus.WATCH,
  DecisionStatus.WATCH_RESTOCK,
  DecisionStatus.CLIENT_FIRST,
];

/**
 * The project applies schema changes with `prisma db push` run manually, so a
 * fresh production database may not have the FeedCard table yet when this code
 * first deploys. Create it idempotently — matching what `db push` would
 * generate — so the first cron run heals the schema on its own instead of
 * throwing. Later `db push` runs converge any remainder (FK, index) as a
 * no-op diff.
 */
export async function ensureFeedCardTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FeedCard" (
      "id" TEXT PRIMARY KEY,
      "productVariantId" TEXT UNIQUE NOT NULL,
      "imageUrl" TEXT,
      "imageSourceUrl" TEXT,
      "imageProvenance" TEXT,
      "primaryUrl" TEXT,
      "linkLive" BOOLEAN NOT NULL DEFAULT false,
      "checkedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FeedCard_productVariantId_fkey'
      ) THEN
        ALTER TABLE "FeedCard"
          ADD CONSTRAINT "FeedCard_productVariantId_fkey"
          FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FeedCard_updatedAt_idx" ON "FeedCard"("updatedAt")
  `);
}

type CardCandidate = {
  productVariantId: string;
  brand: string;
  model: string;
  url: string | null;
  rank: number;
};

function titleCase(s: string): string {
  return decodeHtmlEntities(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

async function resolveCandidate(c: CardCandidate): Promise<{ ok: boolean }> {
  try {
    const existing = await prisma.feedCard.findUnique({
      where: { productVariantId: c.productVariantId },
    });
    // Images barely change: only re-resolve when missing. Link liveness is
    // re-checked every run so dead store links stop being offered as actions.
    const needImage = !existing?.imageUrl;
    const [image, linkLive] = await Promise.all([
      needImage ? getProductImage(c.brand, c.model, c.url).catch(() => null) : Promise.resolve(null),
      isLiveExternalUrl(c.url).catch(() => false),
    ]);
    const data = {
      imageUrl: needImage ? image?.url ?? null : existing?.imageUrl ?? null,
      imageSourceUrl: needImage ? image?.sourceUrl ?? null : existing?.imageSourceUrl ?? null,
      imageProvenance: needImage ? image?.provenance ?? null : existing?.imageProvenance ?? null,
      primaryUrl: linkLive ? c.url : null,
      linkLive,
      checkedAt: new Date(),
    };
    await prisma.feedCard.upsert({
      where: { productVariantId: c.productVariantId },
      create: { productVariantId: c.productVariantId, ...data },
      update: data,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Build/refresh FeedCard rows for the variants the feed actually shows.
 * Budget-conscious: a bounded slice per run, missing cards first, then the
 * stalest. Called from the hourly collector cron.
 */
export async function refreshFeedCards(limit = 12): Promise<{ refreshed: number; failed: number }> {
  await ensureFeedCardTable();

  const [decisions, releaseVariants] = await Promise.all([
    prisma.decision.findMany({
      where: { status: { in: FEED_STATUSES } },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        productVariantId: true,
        productVariant: {
          select: {
            product: { select: { brand: true, normalizedModel: true } },
            availabilityChecks: {
              orderBy: { checkedAt: "desc" },
              take: 1,
              select: { url: true },
            },
            feedCard: { select: { updatedAt: true, imageUrl: true } },
          },
        },
      },
    }),
    prisma.productVariant.findMany({
      where: {
        decisions: { none: {} },
        evidence: { some: { level: { in: ["E2_OFFICIAL", "E3_ACTIONABLE", "E4_CART_VERIFIED"] } } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        product: { select: { brand: true, normalizedModel: true } },
        evidence: {
          orderBy: { observedAt: "desc" },
          take: 1,
          select: { url: true },
        },
        feedCard: { select: { updatedAt: true, imageUrl: true } },
      },
    }),
  ]);

  const seen = new Set<string>();
  const candidates: CardCandidate[] = [];
  const rank = (updatedAt: Date | undefined, hasImage: boolean) =>
    // Missing card first (epoch), then stalest; variants that still need an
    // image outrank ones that only need a link re-check.
    (updatedAt ? updatedAt.getTime() : 0) + (hasImage ? 1e15 : 0);

  const push = (
    id: string,
    brand: string,
    model: string,
    url: string | null,
    card?: { updatedAt: Date; imageUrl: string | null } | null,
  ) => {
    if (seen.has(id)) return;
    seen.add(id);
    candidates.push({ productVariantId: id, brand, model, url, rank: rank(card?.updatedAt, Boolean(card?.imageUrl)) });
  };

  for (const d of decisions) {
    const pv = d.productVariant;
    push(d.productVariantId, pv.product.brand, titleCase(pv.product.normalizedModel), pv.availabilityChecks[0]?.url ?? null, pv.feedCard);
  }
  for (const v of releaseVariants) {
    push(v.id, v.product.brand, titleCase(v.product.normalizedModel), v.evidence[0]?.url ?? null, v.feedCard);
  }

  candidates.sort((a, b) => a.rank - b.rank);

  let refreshed = 0;
  let failed = 0;
  // Small fan-out: every candidate is independently fallible and internally
  // time-bounded (7s), so the batch degrades, never hangs the cron.
  const slice = candidates.slice(0, Math.max(1, limit));
  const outcomes = await Promise.all(slice.map(resolveCandidate));
  for (const o of outcomes) {
    if (o.ok) refreshed += 1;
    else failed += 1;
  }
  return { refreshed, failed };
}

export type FeedCardRow = {
  productVariantId: string;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  imageProvenance: string | null;
  primaryUrl: string | null;
  linkLive: boolean;
  checkedAt: Date;
};

/**
 * Read-only accessor for the render path. If the table does not exist yet
 * (first deploy before the cron's first run), return an empty map instead of
 * throwing — cards then degrade to WATCH via the honesty gate.
 */
export async function readFeedCards(productVariantIds: string[]): Promise<Map<string, FeedCardRow>> {
  const map = new Map<string, FeedCardRow>();
  if (!productVariantIds.length) return map;
  try {
    const rows = await prisma.feedCard.findMany({
      where: { productVariantId: { in: productVariantIds } },
      select: {
        productVariantId: true,
        imageUrl: true,
        imageSourceUrl: true,
        imageProvenance: true,
        primaryUrl: true,
        linkLive: true,
        checkedAt: true,
      },
    });
    for (const row of rows) map.set(row.productVariantId, row);
  } catch {
    // Table not built yet — the caller degrades gracefully.
  }
  return map;
}
