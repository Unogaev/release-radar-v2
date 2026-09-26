import { prisma } from "@/lib/prisma";

// Desk-verified leads from a specific buyer request. This is a one-off offer,
// not Hermès retail or a completed sale. A live checkout must be rechecked by
// the buyer before payment; the model must never promote it to BUY NOW itself.
const SHOULDER_BIRKIN = {
  url: "https://www.collectorsquare.com/en/bags/hermes/birkin/hermes-birkin-shoulder-bag-worn-on-the-shoulder-or-carried-in-the-hand-in-orange-leather-taurillon-clemence-429702.html",
  reference: "429702",
  model: "Birkin Shoulder 42 Orange Taurillon Clemence Palladium 2004",
  observedPrice: "€12,500",
};

const TOGO_MATCH = {
  url: "https://www.lesfoliesdeugenie.fr/en/products/hermes-birkin-shoulder-1",
  reference: "lesfoliesdeugenie-birkin-shoulder-orange-1",
  model: "Birkin Shoulder 42 Orange Togo Palladium 2006",
  observedPrice: "€6,990",
};

export async function syncVerifiedVintageDemand(): Promise<void> {
  for (const listing of [
    { ...SHOULDER_BIRKIN, sourceName: "Collector Square Handbags", confidence: 70, match: "Близкая замена: Clémence вместо Togo. €12,500 — asking price; checkout не проверен." },
    { ...TOGO_MATCH, sourceName: "Les Folies d'Eugénie Handbags", confidence: 65, match: "Точное совпадение по модели, размеру, цвету, Togo и PHW. Состояние B; €6,990 — asking price; checkout не проверен." },
  ]) {
  const source = await prisma.source.findFirst({ where: { name: listing.sourceName } });
  if (!source) continue;

  let variant = await prisma.productVariant.findFirst({
    where: { identifiers: { some: { kind: "vintage-listing-reference", value: listing.reference } } },
  });
  if (!variant) {
    let product = await prisma.product.findFirst({
      where: { brand: "Hermès", normalizedModel: listing.model.toLowerCase(), category: "vintage" },
    });
    if (!product) product = await prisma.product.create({ data: {
      brand: "Hermès", normalizedModel: listing.model.toLowerCase(), category: "vintage",
    } });
    variant = await prisma.productVariant.create({ data: {
      productId: product.id, variantLabel: listing.reference,
      identifiers: { create: { kind: "vintage-listing-reference", value: listing.reference } },
    } });
  }

  const evidence = await prisma.evidence.findFirst({
    where: { productVariantId: variant.id, parseVersion: "vintage-buyer-lead-1" },
  });
  if (!evidence) await prisma.evidence.create({ data: {
    productVariantId: variant.id, sourceId: source.id, url: listing.url,
    level: "E1_RETAILER", parseVersion: "vintage-buyer-lead-1",
    rawSnapshotRef: `${listing.sourceName} ref ${listing.reference}: ${listing.observedPrice}. ${listing.match} Buyer WTB from screenshot; buyer budget and commitment unconfirmed.`,
  } });

  const check = await prisma.availabilityCheck.findFirst({
    where: { productVariantId: variant.id, url: listing.url },
  });
  if (!check) await prisma.availabilityCheck.create({ data: {
    productVariantId: variant.id, sourceId: source.id, url: listing.url,
    sellerOfRecord: listing.sourceName, visibleUiStatus: `${listing.observedPrice} asking price · checkout not verified`,
    ctaState: "unverified", variantAvailable: null, currency: "EUR",
    shippingState: "unknown", pickupState: "unknown", cartState: "unknown", checkoutState: "unknown",
    sessionRegion: "FR", zip: null,
  } });

  const existing = await prisma.decision.findFirst({
    where: { productVariantId: variant.id }, orderBy: { createdAt: "desc" },
  });
  if (!existing) await prisma.decision.create({ data: {
    productVariantId: variant.id, status: "CLIENT_FIRST", ruleVersion: "vintage-buyer-lead-1",
    rationale: `Есть запрос на Shoulder Birkin 42 Orange Togo/Palladium. ${listing.match} Проверить состояние, бюджет клиента, независимую аутентификацию и landed cost до выкупа.`,
    blockedReasons: ["buyer_budget_unconfirmed", "checkout_unverified", "completed_sales_unverified"],
    evidenceConfidence: listing.confidence,
  } });
  }
}
