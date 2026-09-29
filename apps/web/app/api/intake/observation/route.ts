import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { AvailabilityEvidence, EvidenceLevel } from "@domain/evidence/types";
import { buildDecision } from "../../../../collectors/decisionContext";
import {
  createFirstDetectionAlert,
  createUnexpectedRestockAlert,
} from "@/lib/notifications/alerts";

/**
 * POST /api/intake/observation
 *
 * Wave 2: the demo/honesty path. A human (the owner) verifies a product in a
 * live browser — price, stock, working CTA — and submits exactly what they
 * saw. The observation goes through the SAME buildDecision() as the hourly
 * collector, so a browser verification and an automated check are judged by
 * identical gates and economics.
 *
 * verificationDepth sets the evidence level honestly:
 *   "listing"  -> E3_ACTIONABLE   (live page, price + enabled CTA seen)
 *   "cart"     -> E4_CART_VERIFIED (item added to cart)
 *   "checkout" -> E4_CART_VERIFIED (reached checkout; strongest we claim)
 *
 * Auth: owner session (NextAuth) OR the owner's automation secret
 * (Authorization: Bearer <CRON_SECRET>, same as the collector cron).
 * This is a write path for real money decisions — never anonymous:
 * either a logged-in owner or a holder of the owner's secret.
 */
export async function POST(req: NextRequest) {
  try {
    // Owner session first; fall back to the owner's automation secret
    // (machine-to-machine, e.g. verified browser observations).
    let userId: string | null = null;
    try {
      userId = await requireUserId();
    } catch {
      userId = null;
    }
    if (!userId) {
      const cronSecret = process.env.CRON_SECRET;
      const authHeader = req.headers.get("authorization");
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
    // Parse defensively: a machine client sending malformed JSON gets a
    // diagnosable 400 (with a short body preview) instead of an opaque 500.
    const rawBody = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_json", preview: rawBody.slice(0, 160) },
        { status: 400 }
      );
    }

    const brand = String(body.brand ?? "").trim();
    const model = String(body.model ?? "").trim();
    const variantLabel = String(body.variant ?? "default").trim() || "default";
    const category = String(body.category ?? "other").trim() || "other";
    const url = String(body.url ?? "").trim();
    const seller = String(body.seller ?? "").trim() || null;
    const priceUsd =
      body.priceUsd === null || body.priceUsd === undefined
        ? null
        : Number(body.priceUsd);
    const inStock = body.inStock === true;
    const note = String(body.evidenceNote ?? "").trim();
    const depth = String(body.verificationDepth ?? "listing");
    // Optional: verifier actually saw a stated quantity limit on the page.
    const quantityLimitKnown = body.quantityLimitKnown === true;

    if (!brand || !model) {
      return NextResponse.json(
        { error: "brand and model are required" },
        { status: 400 }
      );
    }
    if (priceUsd !== null && (!isFinite(priceUsd) || priceUsd < 0)) {
      return NextResponse.json({ error: "priceUsd must be >= 0" }, { status: 400 });
    }

    const evidenceLevel =
      depth === "cart" || depth === "checkout"
        ? EvidenceLevel.E4_CART_VERIFIED
        : EvidenceLevel.E3_ACTIONABLE;

    // ---- Source row for human verification ----
    let source = await prisma.source.findFirst({
      where: { name: "browser-verification" },
    });
    if (!source) {
      source = await prisma.source.create({
        data: {
          name: "browser-verification",
          sourceClass: "A_truth",
          url: "",
          parseVersion: "intake-v1",
          category: "other",
          sourceType: "BROWSER_VERIFICATION",
          trustLevel: 5,
        },
      });
    }

    // ---- Product / variant ----
    const normalizedModel = model.toLowerCase().slice(0, 200);
    let product = await prisma.product.findFirst({
      where: { brand, normalizedModel, category },
    });
    if (!product) {
      product = await prisma.product.create({
        data: { brand, normalizedModel, category },
      });
    }
    let variant = await prisma.productVariant.findFirst({
      where: { productId: product.id, variantLabel },
    });
    if (!variant) {
      variant = await prisma.productVariant.create({
        data: { productId: product.id, variantLabel },
      });
    }

    // ---- Availability observation, exactly what the human saw ----
    const availability: AvailabilityEvidence = {
      metadataStatus: null, // human eyes, not parsed JSON-LD
      visibleUiStatus: inStock ? "in_stock" : "out_of_stock",
      ctaState: inStock ? "enabled" : "absent",
      variantAvailable: inStock,
      shippingState: "unknown",
      pickupState: "unknown",
      cartState:
        depth === "cart" || depth === "checkout"
          ? "add_to_cart_succeeded"
          : "not_attempted",
      checkoutState: depth === "checkout" ? "reached_checkout" : "not_attempted",
      sellerOfRecord: seller,
      checkedAt: new Date().toISOString(),
      zip: "33160",
      sessionRegion: "US-FL",
      evidenceBlobRef: note ? `human-note:${Date.now()}` : null,
      sourceType: "official",
    };

    await prisma.availabilityCheck.create({
      data: {
        productVariantId: variant.id,
        sourceId: source.id,
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
        url: url || null,
      },
    });

    await prisma.evidence.create({
      data: {
        productVariantId: variant.id,
        sourceId: source.id,
        level: evidenceLevel,
        rawSnapshotRef: `human:${userId}:${Date.now()}`,
        parseVersion: "intake-v1",
        url: url || null,
      },
    });

    const previousDecision = await prisma.decision.findFirst({
      where: { productVariantId: variant.id },
      orderBy: { createdAt: "desc" },
    });

    // ---- The same honest engine as the collector ----
    const built = await buildDecision(prisma, {
      productId: product.id,
      variantId: variant.id,
      brand: product.brand,
      model: product.normalizedModel,
      sourceId: source.id,
      sourceType: "BROWSER_VERIFICATION",
      sourceCategory: category,
      availability,
      evidenceLevel,
      priceUsd,
      rawUrl: url || null,
      zip: "33160",
      fallbackHint: inStock ? "restock_candidate" : "low_interest",
      quantityLimitKnown,
    });

    const decision = await prisma.decision.create({
      data: {
        productVariantId: variant.id,
        status: built.result.status,
        ruleVersion: built.result.ruleVersion,
        rationale: built.result.rationale,
        blockedReasons: built.result.blockedReasons,
        evidenceConfidence: built.result.evidenceConfidence,
        economicsJson: (built.economicsJson ?? undefined) as never,
      },
    });

    // Notify only on genuinely actionable outcomes.
    if (
      built.result.status === "BUY_NOW" ||
      built.result.status === "CLIENT_FIRST"
    ) {
      try {
        const alertInput = {
          decisionId: decision.id,
          productVariantId: variant.id,
          brand: product.brand,
          model: product.normalizedModel,
          status: built.result.status,
          priceUsd,
          store: seller,
          primaryUrl: url || null,
        };
        if (previousDecision && previousDecision.status !== built.result.status) {
          await createUnexpectedRestockAlert(alertInput);
        } else {
          await createFirstDetectionAlert(alertInput);
        }
      } catch (e) {
        console.error("intake alert failed:", e);
      }
    }

    return NextResponse.json({
      decisionId: decision.id,
      status: built.result.status,
      ruleVersion: built.result.ruleVersion,
      rationale: built.result.rationale,
      blockedReasons: built.result.blockedReasons,
      evidenceConfidence: built.result.evidenceConfidence,
      economics: built.economicsJson,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("auth") || msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
