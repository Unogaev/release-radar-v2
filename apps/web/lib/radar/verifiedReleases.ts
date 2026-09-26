import { prisma } from "@/lib/prisma";
import { createFirstDetectionAlert } from "@/lib/notifications/alerts";

/**
 * Official releases verified by the desk. Chat reminders and the product feed
 * must point at the same product/release record. A listing is never treated as
 * purchasable merely because its release time has arrived.
 */
export const VERIFIED_RELEASES = [
  {
    brand: "Nike",
    model: "Kobe 3 Protro Black and White",
    sku: "IQ5340-001",
    category: "sneakers",
    retailer: "Nike SNKRS",
    url: "https://www.nike.com/launch/t/kobe-3-protro-black-and-white",
    retailUsd: 210,
    startsAtUtc: "2026-09-26T18:00:00.000Z", // 2:00 PM EDT, Miami
    sourceTimezone: "America/New_York",
    sourceNote: "Nike SNKRS official product page: $210, available September 26 at 2:00 PM, SKU IQ5340-001.",
  },
] as const;

export async function syncVerifiedReleases(now = new Date()): Promise<void> {
  for (const release of VERIFIED_RELEASES) {
    const start = new Date(release.startsAtUtc);
    // A past release stays visible briefly for review, then the ordinary
    // collector/availability evidence takes over. Never retain PREPARE past launch.
    if (now.getTime() > start.getTime() + 7 * 24 * 60 * 60_000) continue;

    let source = await prisma.source.findFirst({ where: { name: release.retailer } });
    if (!source) {
      source = await prisma.source.create({ data: {
        name: release.retailer, sourceClass: "A_truth", url: release.url,
        parseVersion: "verified-release-1", sourceType: "MANUAL",
        category: release.category, trustLevel: 5,
      } });
    }

    let variant = await prisma.productVariant.findFirst({
      where: { identifiers: { some: { kind: "sku", value: release.sku } } },
      include: { product: true },
    });
    if (!variant) {
      let product = await prisma.product.findFirst({
        where: { brand: release.brand, normalizedModel: release.model.toLowerCase(), category: release.category },
      });
      if (!product) product = await prisma.product.create({ data: {
        brand: release.brand, normalizedModel: release.model.toLowerCase(), category: release.category,
      } });
      variant = await prisma.productVariant.create({
        data: {
          productId: product.id, variantLabel: release.sku,
          identifiers: { create: { kind: "sku", value: release.sku } },
        },
        include: { product: true },
      });
    }

    const event = await prisma.releaseEvent.findFirst({ where: { productVariantId: variant.id } });
    if (!event) await prisma.releaseEvent.create({ data: {
      productVariantId: variant.id, startAtUtc: start,
      sourceTimezone: release.sourceTimezone, timePrecision: "exact",
    } });

    const evidence = await prisma.evidence.findFirst({
      where: { productVariantId: variant.id, parseVersion: "verified-release-1" },
    });
    if (!evidence) await prisma.evidence.create({ data: {
      productVariantId: variant.id, sourceId: source.id, url: release.url,
      level: "E2_OFFICIAL", rawSnapshotRef: release.sourceNote,
      parseVersion: "verified-release-1",
    } });

    const check = await prisma.availabilityCheck.findFirst({
      where: { productVariantId: variant.id, url: release.url },
    });
    if (!check) await prisma.availabilityCheck.create({ data: {
      productVariantId: variant.id, sourceId: source.id, url: release.url,
      sellerOfRecord: release.retailer, priceUsd: release.retailUsd, currency: "USD",
      visibleUiStatus: "Scheduled — checkout unverified", ctaState: "disabled",
      variantAvailable: null, shippingState: "unknown", pickupState: "unknown",
      cartState: "unknown", checkoutState: "unknown", zip: "33160", sessionRegion: "US-FL",
    } });

    const previous = await prisma.decision.findFirst({
      where: { productVariantId: variant.id }, orderBy: { createdAt: "desc" },
    });
    const desiredStatus = now < start ? "PREPARE" : "WATCH";
    const mayReplace = !previous || (
      previous.status !== desiredStatus && (
        previous.ruleVersion === "verified-release-1" ||
        (now < start && ["WATCH", "VERIFY", "SKIP"].includes(previous.status))
      )
    );
    if (mayReplace) {
      const decision = await prisma.decision.create({ data: {
        productVariantId: variant.id, status: desiredStatus, ruleVersion: "verified-release-1",
        rationale: now < start
          ? `Официальный релиз подтверждён: ${release.sourceNote} Наличие и перепродажная маржа не подтверждены.`
          : `Время старта прошло. Наличие и checkout требуют новой проверки. ${release.sourceNote}`,
        blockedReasons: ["checkout_unverified", "completed_sales_unverified"],
        evidenceConfidence: 85,
      } });
      if (!previous && desiredStatus === "PREPARE") {
        await createFirstDetectionAlert({
          decisionId: decision.id, productVariantId: variant.id,
          brand: release.brand, model: release.model, sku: release.sku, status: desiredStatus,
          priceUsd: release.retailUsd, store: release.retailer, primaryUrl: release.url,
        });
      }
    }
  }
}
