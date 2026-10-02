import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStructuredDataAdapter } from "../../../../collectors/genericAdapter";

export const runtime = "nodejs";
export const maxDuration = 60;

// Decision statuses whose cards the 48h honesty gate in serverFeed.ts can
// demote: they need a fresh availability check to stay actionable.
const ACTIONABLE_STATUSES = [
  "BUY_NOW",
  "CONTACT_DEALER",
  "SOURCE_NOW",
  "APPLY_NOW",
  "APPLY_RESERVE",
  "RESERVE_PICKUP",
  "PREPARE",
];
// Re-verify before the 48h gate kicks in, with a 12h safety buffer.
const STALE_AFTER_MS = 36 * 60 * 60 * 1000;
const MAX_VARIANTS = 12;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Newest decision per variant; keep variants whose newest decision is actionable.
  const recent = await prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { productVariantId: true, status: true },
  });
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const d of recent) {
    if (seen.has(d.productVariantId)) continue;
    seen.add(d.productVariantId);
    if (ACTIONABLE_STATUSES.includes(d.status)) candidates.push(d.productVariantId);
    if (candidates.length >= MAX_VARIANTS * 2) break;
  }

  const reverified: string[] = [];
  let skippedFresh = 0;
  let skippedNoUrl = 0;
  const errors: string[] = [];

  for (const variantId of candidates) {
    if (reverified.length >= MAX_VARIANTS) break;
    try {
      const check = await prisma.availabilityCheck.findFirst({
        where: { productVariantId: variantId },
        orderBy: { checkedAt: "desc" },
      });
      if (check && Date.now() - check.checkedAt.getTime() < STALE_AFTER_MS) {
        skippedFresh += 1;
        continue;
      }
      let productUrl = check?.url ?? null;
      if (!productUrl) {
        const card = await prisma.feedCard.findFirst({
          where: { productVariantId: variantId, linkLive: true },
          select: { primaryUrl: true },
        });
        productUrl = card?.primaryUrl ?? null;
      }
      const sourceId = check?.sourceId ?? null;
      if (!productUrl || !/^https?:\/\//.test(productUrl) || !sourceId) {
        skippedNoUrl += 1;
        continue;
      }
      // Reuse the proven structured-data verification: fetch the product page
      // and read schema.org availability + price. Same semantics as the
      // collector's PRODUCT_LISTING adapter (InStock -> cta enabled). Throws
      // on fetch failure -> caught below, nothing fake is written.
      const adapter = createStructuredDataAdapter({ sourceId, productUrl });
      const availability = await adapter.checkAvailability(
        { productVariantId: variantId, sellerId: "unknown" },
        { zip: "33160", sessionRegion: "US-FL" },
      );
      const priceUsd = (availability as unknown as { priceUsd?: number | null }).priceUsd ?? null;
      await prisma.availabilityCheck.create({
        data: {
          productVariantId: variantId,
          sourceId,
          url: productUrl,
          metadataStatus: availability.metadataStatus,
          visibleUiStatus: availability.visibleUiStatus,
          ctaState: availability.ctaState,
          variantAvailable: availability.variantAvailable,
          shippingState: availability.shippingState,
          pickupState: availability.pickupState,
          cartState: availability.cartState,
          checkoutState: availability.checkoutState,
          sellerOfRecord: availability.sellerOfRecord,
          zip: availability.zip,
          sessionRegion: availability.sessionRegion,
          evidenceBlobRef: availability.evidenceBlobRef,
          priceUsd,
          currency: "USD",
        },
      });
      reverified.push(variantId);
    } catch (e) {
      errors.push(`${variantId}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    reverified: reverified.length,
    skippedFresh,
    skippedNoUrl,
    errors,
    checkedAt: new Date().toISOString(),
  });
}
