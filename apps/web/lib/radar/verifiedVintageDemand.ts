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

export async function syncVerifiedVintageDemand(): Promise<void> {
  const source = await prisma.source.findFirst({ where: { name: "Collector Square Handbags" } });
  if (!source) return;

  let variant = await prisma.productVariant.findFirst({
    where: { identifiers: { some: { kind: "collector-square-reference", value: SHOULDER_BIRKIN.reference } } },
  });
  if (!variant) {
    let product = await prisma.product.findFirst({
      where: { brand: "Hermès", normalizedModel: SHOULDER_BIRKIN.model.toLowerCase(), category: "vintage" },
    });
    if (!product) product = await prisma.product.create({ data: {
      brand: "Hermès", normalizedModel: SHOULDER_BIRKIN.model.toLowerCase(), category: "vintage",
    } });
    variant = await prisma.productVariant.create({ data: {
      productId: product.id, variantLabel: SHOULDER_BIRKIN.reference,
      identifiers: { create: { kind: "collector-square-reference", value: SHOULDER_BIRKIN.reference } },
    } });
  }

  const evidence = await prisma.evidence.findFirst({
    where: { productVariantId: variant.id, parseVersion: "vintage-buyer-lead-1" },
  });
  if (!evidence) await prisma.evidence.create({ data: {
    productVariantId: variant.id, sourceId: source.id, url: SHOULDER_BIRKIN.url,
    level: "E1_RETAILER", parseVersion: "vintage-buyer-lead-1",
    rawSnapshotRef: `Collector Square ref ${SHOULDER_BIRKIN.reference}: ${SHOULDER_BIRKIN.observedPrice}, very good condition, 2004, 42 cm, orange Clémence, palladium. Buyer WTB from user screenshot; buyer budget and commitment unconfirmed.`,
  } });

  const check = await prisma.availabilityCheck.findFirst({
    where: { productVariantId: variant.id, url: SHOULDER_BIRKIN.url },
  });
  if (!check) await prisma.availabilityCheck.create({ data: {
    productVariantId: variant.id, sourceId: source.id, url: SHOULDER_BIRKIN.url,
    sellerOfRecord: "Collector Square (Paris)", visibleUiStatus: "€12,500 asking price · checkout not verified",
    ctaState: "unverified", variantAvailable: null, currency: "EUR",
    shippingState: "unknown", pickupState: "unknown", cartState: "unknown", checkoutState: "unknown",
    sessionRegion: "FR", zip: null,
  } });

  const existing = await prisma.decision.findFirst({
    where: { productVariantId: variant.id }, orderBy: { createdAt: "desc" },
  });
  if (!existing) await prisma.decision.create({ data: {
    productVariantId: variant.id, status: "CLIENT_FIRST", ruleVersion: "vintage-buyer-lead-1",
    rationale: "Есть запрос на Shoulder Birkin 42 Orange Togo/Palladium. Найдена близкая, но не идентичная Clémence 2004 года: €12,500 — asking price. Подтвердить допуск Clémence вместо Togo, состояние, бюджет клиента, аутентичность и landed cost перед выкупом.",
    blockedReasons: ["material_mismatch_togo_vs_clemence", "buyer_budget_unconfirmed", "checkout_unverified", "completed_sales_unverified"],
    evidenceConfidence: 70,
  } });
}
