import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateSource(name: string, sourceClass: string) {
  let s = await prisma.source.findFirst({ where: { name } });
  if (!s) {
    s = await prisma.source.create({
      data: { name, sourceClass, url: "", parseVersion: "demo-v1" },
    });
  }
  return s;
}

async function findVariant(brand: string, model: string, variantLabel = "default") {
  const product = await prisma.product.findFirst({
    where: { brand, normalizedModel: model.toLowerCase() },
  });
  if (!product) return null;
  return prisma.productVariant.findFirst({
    where: { productId: product.id, variantLabel },
  });
}

async function addEvidence(
  variantId: string,
  sourceId: string,
  level: string,
  url: string | null
) {
  const existing = await prisma.evidence.findFirst({
    where: { productVariantId: variantId, level, sourceId },
  });
  if (existing) {
    console.log(`  evidence ${level} already exists, skip`);
    return;
  }
  await prisma.evidence.create({
    data: {
      productVariantId: variantId,
      sourceId,
      level,
      rawSnapshotRef: `demo:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      parseVersion: "demo-v1",
      url,
    },
  });
  console.log(`  + evidence ${level}${url ? " (with url)" : " (no url)"}`);
}

async function addAvailabilityCheck(
  variantId: string,
  sourceId: string,
  opts: {
    url: string | null;
    ctaState: string;
    checkoutState: string;
    cartState?: string;
    shippingState?: string;
    pickupState?: string;
    sellerOfRecord?: string;
    variantAvailable?: boolean;
  }
) {
  const existing = await prisma.availabilityCheck.findFirst({
    where: { productVariantId: variantId, sourceId },
  });
  if (existing) {
    console.log("  availabilityCheck already exists, skip");
    return;
  }
  await prisma.availabilityCheck.create({
    data: {
      productVariantId: variantId,
      sourceId,
      ctaState: opts.ctaState,
      checkoutState: opts.checkoutState,
      cartState: opts.cartState ?? "not_attempted",
      shippingState: opts.shippingState ?? "unknown",
      pickupState: opts.pickupState ?? "unknown",
      sellerOfRecord: opts.sellerOfRecord ?? null,
      variantAvailable: opts.variantAvailable ?? null,
      url: opts.url,
    },
  });
  console.log(`  + availabilityCheck${opts.url ? " (with url)" : " (no url)"}`);
}

async function main() {
  const official = await getOrCreateSource("Official Brand Site (demo)", "A_truth");
  const social = await getOrCreateSource("Social Signal (demo)", "C_signal");
  const market = await getOrCreateSource("Market/Resale (demo)", "B_market");

  const ENRICH: Array<{
    brand: string;
    model: string;
    variantLabel?: string;
    evidences: Array<{ src: "official" | "social" | "market"; level: string; url: string | null }>;
    availability?: Parameters<typeof addAvailabilityCheck>[2];
  }> = [
    {
      brand: "[DEMO] Sony",
      model: "GTA VI DualSense Controller — Black",
      evidences: [{ src: "social", level: "E1_SIGNAL", url: null }],
    },
    {
      brand: "[DEMO] Nintendo",
      model: "Zelda Pro Controller",
      evidences: [
        { src: "official", level: "E2_OFFICIAL", url: "https://www.nintendo.com/us/store/products/zelda-pro-controller/" },
      ],
    },
    {
      brand: "[DEMO] Microsoft",
      model: "Xbox Series X25",
      evidences: [
        { src: "social", level: "E1_SIGNAL", url: "https://twitter.com/xboxleaks/status/1234567890" },
      ],
    },
    {
      brand: "[DEMO] Jordan Brand",
      model: "Mowalola × Air Jordan 14",
      variantLabel: "US 10",
      evidences: [
        { src: "official", level: "E2_OFFICIAL", url: "https://www.nike.com/jordan/launch/mowalola-air-jordan-14" },
      ],
    },
    {
      brand: "[DEMO] ColdSins",
      model: "Slashers Collection",
      evidences: [
        { src: "official", level: "E2_OFFICIAL", url: "https://coldsins.com/collections/slashers" },
      ],
    },
    {
      brand: "[DEMO] Rolex",
      model: "Perpetual Padellone",
      evidences: [
        { src: "official", level: "E2_OFFICIAL", url: "https://www.rolex.com/watches/perpetual-1908" },
      ],
      availability: {
        url: "https://www.rolex.com/find-a-retailer",
        ctaState: "enabled",
        checkoutState: "blocked",
        sellerOfRecord: "Authorized Rolex Dealer",
      },
    },
    {
      brand: "[DEMO] Apple",
      model: "iPhone Duo",
      evidences: [
        { src: "official", level: "E2_OFFICIAL", url: "https://www.apple.com/apple-events/" },
      ],
    },
    {
      brand: "[DEMO] Target",
      model: "Verified Clearance — Lego Icons Set",
      evidences: [
        { src: "official", level: "E3_ACTIONABLE", url: "https://www.target.com/p/lego-icons-demo/-/A-00000000" },
      ],
      availability: {
        url: "https://www.target.com/p/lego-icons-demo/-/A-00000000",
        ctaState: "enabled",
        checkoutState: "not_attempted",
        sellerOfRecord: "target.com",
      },
    },
    {
      brand: "[DEMO] Best Buy",
      model: "Rejected Candidate — PS5 Pro Bundle",
      evidences: [{ src: "official", level: "E2_OFFICIAL", url: null }],
    },
  ];

  for (const item of ENRICH) {
    const variant = await findVariant(item.brand, item.model, item.variantLabel ?? "default");
    if (!variant) {
      console.log(`SKIP (not found): ${item.brand} ${item.model}`);
      continue;
    }
    console.log(`${item.brand} ${item.model}`);
    for (const ev of item.evidences) {
      const src = ev.src === "official" ? official : ev.src === "social" ? social : market;
      try {
        await addEvidence(variant.id, src.id, ev.level, ev.url);
      } catch (e) {
        console.error("  evidence error:", (e as Error).message);
      }
    }
    if (item.availability) {
      try {
        await addAvailabilityCheck(variant.id, official.id, item.availability);
      } catch (e) {
        console.error("  availability error:", (e as Error).message);
      }
    }
  }

  // ---- Full BUY_NOW example with official + direct link + checkout + market sale + social signal ----
  const buyNowBrand = "[DEMO] Nike";
  const buyNowModel = "Air Max Pulse 2 — Verified Restock";
  let product = await prisma.product.findFirst({
    where: { brand: buyNowBrand, normalizedModel: buyNowModel.toLowerCase() },
  });
  if (!product) {
    product = await prisma.product.create({
      data: { brand: buyNowBrand, normalizedModel: buyNowModel.toLowerCase(), category: "sneakers" },
    });
  }
  let variant = await prisma.productVariant.findFirst({
    where: { productId: product.id, variantLabel: "US 10" },
  });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: { productId: product.id, variantLabel: "US 10" },
    });
  }
  const existingDecision = await prisma.decision.findFirst({ where: { productVariantId: variant.id } });
  if (!existingDecision) {
    await prisma.decision.create({
      data: {
        productVariantId: variant.id,
        status: "BUY_NOW",
        ruleVersion: "demo-2.0.0",
        rationale: "Подтверждён живой чекаут у официального продавца. Есть completed sale для сверки экономики.",
        blockedReasons: [],
        evidenceConfidence: 92,
      },
    });
    console.log("Created full BUY_NOW demo: Nike Air Max Pulse 2");
  } else {
    console.log("BUY_NOW demo already exists, skip decision");
  }

  try {
    await addEvidence(variant.id, official.id, "E2_OFFICIAL", "https://www.nike.com/launch/t/air-max-pulse-2");
    await addEvidence(variant.id, official.id, "E4_CART_VERIFIED", "https://www.nike.com/t/air-max-pulse-2/DEMO123-001");
    await addEvidence(variant.id, social.id, "E1_SIGNAL", "https://www.instagram.com/p/demo-athlete-post/");
    await addAvailabilityCheck(variant.id, official.id, {
      url: "https://www.nike.com/t/air-max-pulse-2/DEMO123-001",
      ctaState: "enabled",
      checkoutState: "reached_checkout",
      cartState: "add_to_cart_succeeded",
      shippingState: "available",
      pickupState: "unavailable",
      sellerOfRecord: "nike.com",
      variantAvailable: true,
    });
  } catch (e) {
    console.error("BUY_NOW evidence error:", (e as Error).message);
  }

  try {
    const existingSale = await prisma.marketSale.findFirst({ where: { productVariantId: variant.id } });
    if (!existingSale) {
      await prisma.marketSale.create({
        data: { productVariantId: variant.id, platform: "StockX", priceMinor: 24999, currency: "USD", observedAt: new Date() },
      });
      console.log("  + marketSale (StockX)");
    }
  } catch (e) {
    console.error("marketSale error:", (e as Error).message);
  }

  try {
    const existingAsk = await prisma.marketAsk.findFirst({ where: { productVariantId: variant.id } });
    if (!existingAsk) {
      await prisma.marketAsk.create({
        data: { productVariantId: variant.id, platform: "GOAT", priceMinor: 27999, currency: "USD", observedAt: new Date() },
      });
      console.log("  + marketAsk (GOAT)");
    }
  } catch (e) {
    console.error("marketAsk error:", (e as Error).message);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
