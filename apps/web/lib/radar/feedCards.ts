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
  /** The variant's latest availability check — the row the feed reads the
   *  retail price from (serverFeed takes availabilityChecks[0].priceUsd). */
  checkId: string | null;
  checkPriceUsd: number | null;
};

function titleCase(s: string): string {
  return decodeHtmlEntities(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRootUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    return new URL(u).pathname.split("/").filter(Boolean).length < 2;
  } catch {
    return false;
  }
}

function preferProductUrl(urls: Array<string | null | undefined>): string | null {
  const valid = urls.filter((u): u is string => Boolean(u));
  const deep = valid.find((u) => {
    try {
      return new URL(u).pathname.split("/").filter(Boolean).length >= 2;
    } catch {
      return false;
    }
  });
  return deep ?? valid[0] ?? null;
}

async function embeddedSignalImageFor(
  productVariantId: string,
): Promise<{ url: string; sourceUrl: string; provenance: "official-page" } | null> {
  const rows = await prisma.signal.findMany({
    where: { productVariantId, rawText: { contains: "[rr:image=" } },
    orderBy: { observedAt: "desc" },
    take: 3,
    select: { rawText: true, url: true },
  });
  for (const r of rows) {
    const encoded = r.rawText?.match(/\[rr:image=([^\]]+)\]/i)?.[1];
    if (!encoded) continue;
    try {
      return { url: decodeURIComponent(encoded), sourceUrl: r.url ?? "", provenance: "official-page" };
    } catch {
      // malformed encoding — try the next row
    }
  }
  return null;
}

async function resolveCandidate(c: CardCandidate): Promise<{ ok: boolean; img: boolean; priced: boolean }> {
  try {
    const existing = await prisma.feedCard.findUnique({
      where: { productVariantId: c.productVariantId },
    });
    // Images barely change: only re-resolve when missing. Link liveness is
    // re-checked every run so dead store links stop being offered as actions.
    const needImage =
      !existing?.imageUrl || existing?.imageProvenance === "official-search" || isRootUrl(existing?.imageSourceUrl);
    // A variant with no priced check yet also runs the resolver: a Shopify
    // catalog/product match returns the store's real price (variants[0].price)
    // alongside the image. A variant with no check at all counts too — the
    // price then lands on a freshly created check (below).
    const needPrice = c.checkPriceUsd == null;
    const [embedded, fetched, linkState] = await Promise.all([
      needImage ? embeddedSignalImageFor(c.productVariantId).catch(() => null) : Promise.resolve(null),
      needImage || needPrice ? getProductImage(c.brand, c.model, c.url).catch(() => null) : Promise.resolve(null),
      isLiveExternalUrl(c.url).catch(() => null),
    ]);
    const image = needImage ? embedded ?? fetched : null;
    // Persist the matched catalog price onto the availability check the feed
    // reads (the variant's latest) — but only into an empty priceUsd: an
    // observed price is never overwritten by a catalog match. When the
    // variant has no check at all, create one carrying the catalog price:
    // the feed reads the price from the latest check, so without a row the
    // price has nowhere to land. The created check uses the same neutral
    // states the Shopify adapter reports (nothing was cart- or checkout-
    // tested — only the catalog price was observed), so it cannot pass the
    // buy gates on its own; the store is credited via sellerOfRecord, the
    // same way the adapter credits it.
    let priced = false;
    const catalogPrice = fetched?.priceUsd ?? null;
    if (needPrice && catalogPrice != null) {
      if (c.checkId) {
        await prisma.availabilityCheck.update({
          where: { id: c.checkId },
          data: { priceUsd: catalogPrice },
        });
        priced = true;
      } else if (c.url) {
        let origin: string | null = null;
        try {
          origin = new URL(c.url).origin;
        } catch {
          origin = null;
        }
        const source = origin
          ? await prisma.source.findFirst({
              where: { url: { startsWith: origin } },
              select: { id: true },
            })
          : null;
        if (source) {
          await prisma.availabilityCheck.create({
            data: {
              productVariantId: c.productVariantId,
              sourceId: source.id,
              shippingState: "unknown",
              pickupState: "unknown",
              cartState: "not_attempted",
              checkoutState: "not_attempted",
              sellerOfRecord: origin,
              url: c.url,
              priceUsd: catalogPrice,
              currency: "USD",
            },
          });
          priced = true;
        }
      }
    }
    // linkState null = ambiguous (bot-protection 403): keep the previously
    // verified liveness. A browser-verified intake observation seeds
    // linkLive=true, which survives here until a definitive check says
    // otherwise.
    const linkLive = linkState ?? existing?.linkLive ?? false;
    const data = {
      imageUrl: image?.url ?? existing?.imageUrl ?? null,
      imageSourceUrl: image?.sourceUrl ?? existing?.imageSourceUrl ?? null,
      imageProvenance: image?.provenance ?? existing?.imageProvenance ?? null,
      primaryUrl: linkLive ? c.url : null,
      linkLive,
      checkedAt: new Date(),
    };
    await prisma.feedCard.upsert({
      where: { productVariantId: c.productVariantId },
      create: { productVariantId: c.productVariantId, ...data },
      update: data,
    });
    return { ok: true, img: Boolean(image), priced };
  } catch {
    return { ok: false, img: false, priced: false };
  }
}

/**
 * Build/refresh FeedCard rows for the variants the feed actually shows.
 * Budget-conscious: a bounded slice per run, missing cards first, then the
 * stalest. Called from the hourly collector cron.
 */
export async function refreshFeedCards(limit = 25): Promise<{ refreshed: number; failed: number; withImage: number; withPrice: number; attempts: Array<{ t: string; u: string | null; img: boolean; priced: boolean }> }> {
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
              select: { url: true, id: true, priceUsd: true },
            },
            evidence: {
              orderBy: { observedAt: "desc" },
              take: 1,
              select: { url: true, source: { select: { url: true } } },
            },
            signals: {
              orderBy: { observedAt: "desc" },
              take: 1,
              select: { url: true, source: { select: { url: true } } },
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
        availabilityChecks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { id: true, priceUsd: true },
        },
        evidence: {
          orderBy: { observedAt: "desc" },
          take: 1,
          select: { url: true, source: { select: { url: true } } },
        },
        feedCard: { select: { updatedAt: true, imageUrl: true } },
      },
    }),
  ]);

  const seen = new Set<string>();
  const candidates: CardCandidate[] = [];
  const rank = (updatedAt: Date | undefined, complete: boolean) =>
    // Missing card first (epoch), then stalest; variants that still need an
    // image or a price outrank ones that only need a link re-check.
    (updatedAt ? updatedAt.getTime() : 0) + (complete ? 1e15 : 0);

  const push = (
    id: string,
    brand: string,
    model: string,
    url: string | null,
    card?: { updatedAt: Date; imageUrl: string | null } | null,
    check?: { id: string; priceUsd: number | null } | null,
  ) => {
    if (seen.has(id)) return;
    seen.add(id);
    // Complete = has an image AND the latest check already carries a price
    // (or there is no check a catalog price could be written to).
    const complete = Boolean(card?.imageUrl) && (check == null || check.priceUsd != null);
    candidates.push({
      productVariantId: id,
      brand,
      model,
      url,
      rank: rank(card?.updatedAt, complete),
      checkId: check?.id ?? null,
      checkPriceUsd: check?.priceUsd ?? null,
    });
  };

  for (const d of decisions) {
    const pv = d.productVariant;
    push(d.productVariantId, pv.product.brand, titleCase(pv.product.normalizedModel), preferProductUrl([pv.availabilityChecks[0]?.url, pv.evidence[0]?.url, pv.signals[0]?.url]) ?? pv.evidence[0]?.source?.url ?? pv.signals[0]?.source?.url ?? null, pv.feedCard, pv.availabilityChecks[0] ?? null);
  }
  for (const v of releaseVariants) {
    push(v.id, v.product.brand, titleCase(v.product.normalizedModel), v.evidence[0]?.url ?? v.evidence[0]?.source?.url ?? null, v.feedCard, v.availabilityChecks[0] ?? null);
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
  const withImage = outcomes.filter((o) => o.img).length;
  const withPrice = outcomes.filter((o) => o.priced).length;
  const attempts = slice.map((c, i) => ({ t: `${c.brand} ${c.model}`.slice(0, 60), u: c.url, img: outcomes[i]?.img ?? false, priced: outcomes[i]?.priced ?? false }));
  return { refreshed, failed, withImage, withPrice, attempts };
}

/**
 * Backfill pass for FeedCard rows that still lack an image.
 *
 * The regular refresh is bounded by its candidate sourcing (latest decisions /
 * release variants), so image-less rows for priced or urgent variants can sit
 * unmatched for many runs. This pass queries those rows directly — priced or
 * urgent first, oldest first — and re-runs them through the same resolver.
 * Bounded per run (default 40) to protect the cron's execution budget.
 */
export async function backfillMissingCardImages(limit = 40): Promise<{ backfilled: number; failed: number; withImage: number; attempts: Array<{ t: string; u: string | null; img: boolean }> }> {
  await ensureFeedCardTable();

  const URGENT_STATUSES = [
    DecisionStatus.BUY_NOW,
    DecisionStatus.APPLY_NOW,
    DecisionStatus.SOURCE_NOW,
    DecisionStatus.CONTACT_DEALER,
    DecisionStatus.WATCH_RESTOCK,
    DecisionStatus.CLIENT_FIRST,
  ];

  const rows = await prisma.feedCard.findMany({
    where: { imageUrl: null },
    select: {
      productVariantId: true,
      updatedAt: true,
      productVariant: {
        select: {
          product: { select: { brand: true, normalizedModel: true } },
          decisions: {
            where: { status: { in: FEED_STATUSES } },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { status: true },
          },
          availabilityChecks: {
            orderBy: { checkedAt: "desc" },
            take: 1,
            select: { id: true, url: true, priceUsd: true },
          },
          evidence: {
            orderBy: { observedAt: "desc" },
            take: 1,
            select: { url: true, source: { select: { url: true } } },
          },
          signals: {
            orderBy: { observedAt: "desc" },
            take: 1,
            select: { url: true, source: { select: { url: true } } },
          },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: 200,
  });

  type BackfillRow = (typeof rows)[number];
  const isUrgent = (r: BackfillRow) =>
    r.productVariant.decisions.some((d) => (URGENT_STATUSES as readonly string[]).includes(d.status));
  const isPriced = (r: BackfillRow) => r.productVariant.availabilityChecks[0]?.priceUsd != null;

  const ranked = rows
    .filter((r) => isUrgent(r) || isPriced(r))
    .sort(
      (a, b) =>
        Number(isUrgent(b)) - Number(isUrgent(a)) ||
        Number(isPriced(b)) - Number(isPriced(a)) ||
        a.updatedAt.getTime() - b.updatedAt.getTime(),
    )
    .slice(0, Math.max(1, limit));

  const candidates: CardCandidate[] = ranked.map((r) => {
    const pv = r.productVariant;
    const check = pv.availabilityChecks[0] ?? null;
    return {
      productVariantId: r.productVariantId,
      brand: pv.product.brand,
      model: titleCase(pv.product.normalizedModel),
      url:
        preferProductUrl([check?.url, pv.evidence[0]?.url, pv.signals[0]?.url]) ??
        pv.evidence[0]?.source?.url ?? pv.signals[0]?.source?.url ?? null,
      rank: 0,
      checkId: check?.id ?? null,
      checkPriceUsd: check?.priceUsd ?? null,
    };
  });

  let backfilled = 0;
  let failed = 0;
  const outcomes = await Promise.all(candidates.map(resolveCandidate));
  for (const o of outcomes) {
    if (o.ok) backfilled += 1;
    else failed += 1;
  }
  const withImage = outcomes.filter((o) => o.img).length;
  const attempts = candidates.map((c, i) => ({ t: `${c.brand} ${c.model}`.slice(0, 60), u: c.url, img: outcomes[i]?.img ?? false }));
  return { backfilled, failed, withImage, attempts };
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
