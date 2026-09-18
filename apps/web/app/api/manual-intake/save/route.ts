import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand, model, sku, category, seller, url, comment, markAsClient, confidence } = body;

    if (!brand || !model) {
      return NextResponse.json({ error: "Бренд и модель обязательны" }, { status: 400 });
    }

    const normalizedModel = String(model).trim();
    const cat = category ? String(category).toLowerCase() : "other";

    let product = await prisma.product.findFirst({
      where: { brand, normalizedModel, category: cat },
    });
    if (!product) {
      product = await prisma.product.create({
        data: { brand, normalizedModel, category: cat },
      });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        variantLabel: sku || normalizedModel,
      },
    });

    if (sku) {
      await prisma.identifier.create({
        data: { productVariantId: variant.id, kind: "sku", value: String(sku) },
      });
    }

    let manualSource = await prisma.source.findFirst({ where: { sourceType: "MANUAL" } });
    if (!manualSource) {
      manualSource = await prisma.source.create({
        data: {
          name: "Ручной ввод",
          sourceClass: "C_signal",
          url: "manual://intake",
          parseVersion: "1",
          sourceType: "MANUAL",
          category: "other",
        },
      });
    }

    if (url || seller) {
      await prisma.availabilityCheck.create({
        data: {
          productVariantId: variant.id,
          sourceId: manualSource.id,
          url: url || null,
          sellerOfRecord: seller || null,
          shippingState: "unknown",
          pickupState: "unknown",
          cartState: "unknown",
          checkoutState: "unknown",
        },
      });
    }

    const status: string = markAsClient ? DecisionStatus.CLIENT_FIRST : DecisionStatus.VERIFY;
    const evidenceConfidence = Math.max(0, Math.min(100, Math.round(Number(confidence ?? 50))));

    const decision = await prisma.decision.create({
      data: {
        productVariantId: variant.id,
        status,
        ruleVersion: "manual-1",
        rationale: comment || "Добавлено вручную, требуется проверка радаром.",
        blockedReasons: [],
        evidenceConfidence,
      },
    });

    return NextResponse.json({ ok: true, decisionId: decision.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
