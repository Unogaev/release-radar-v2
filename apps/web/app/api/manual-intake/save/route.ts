import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DecisionStatus } from "@domain/decision/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brand, model, sku, category, seller, url, comment, markAsClient, confidence, attachmentNames,
      retailPrice, currency, availabilityStatus, buyButtonText, sizeOrColor, purchaseLimit, storeZip,
      athleteName, signalType, dateTimeText,
    } = body;

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

    // A screenshot can be valuable even when vision cannot name the exact product.
    // Keep it in the review queue instead of forcing the user to complete a long form.
    if (!brand || !model) {
      const details = [
        comment && `Комментарий: ${comment}`,
        category && `Категория: ${category}`,
        Array.isArray(attachmentNames) && attachmentNames.length > 0 && `Файлы: ${attachmentNames.join(", ")}`,
        "Товар распознан не полностью — требуется ручная проверка.",
      ].filter(Boolean).join("\n");
      const signal = await prisma.signal.create({
        data: {
          sourceId: manualSource.id,
          rawText: details,
          url: url || null,
        },
      });
      return NextResponse.json({ ok: true, signalId: signal.id, queuedForReview: true });
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

    if (url || seller || retailPrice) {
      await prisma.availabilityCheck.create({
        data: {
          productVariantId: variant.id,
          sourceId: manualSource.id,
          url: url || null,
          sellerOfRecord: seller || null,
          priceUsd: Number.isFinite(Number(retailPrice)) ? Number(retailPrice) : null,
          currency: currency || null,
          zip: storeZip || null,
          shippingState: "unknown",
          pickupState: "unknown",
          cartState: "unknown",
          checkoutState: "unknown",
        },
      });
    }

    const extractedDetails = [
      `Распознано со скриншота: ${brand} ${normalizedModel}`,
      sku && `SKU/reference: ${sku}`,
      seller && `Продавец: ${seller}`,
      retailPrice && `Цена: ${retailPrice} ${currency || "USD"}`,
      availabilityStatus && `Наличие: ${availabilityStatus}`,
      buyButtonText && `Кнопка покупки: ${buyButtonText}`,
      sizeOrColor && `Размер/цвет: ${sizeOrColor}`,
      purchaseLimit && `Лимит: ${purchaseLimit}`,
      storeZip && `ZIP: ${storeZip}`,
      athleteName && `Athlete/celebrity: ${athleteName}`,
      signalType && `Тип сигнала: ${signalType}`,
      dateTimeText && `Дата/время на скриншоте: ${dateTimeText}`,
      Array.isArray(attachmentNames) && attachmentNames.length > 0 && `Файлы: ${attachmentNames.join(", ")}`,
      comment && `Комментарий: ${comment}`,
    ].filter(Boolean).join("\n");

    await prisma.signal.create({
      data: {
        productVariantId: variant.id,
        sourceId: manualSource.id,
        rawText: extractedDetails,
        url: url || null,
      },
    });

    await prisma.evidence.create({
      data: {
        productVariantId: variant.id,
        sourceId: manualSource.id,
        url: url || null,
        level: "C_signal",
        rawSnapshotRef: extractedDetails.slice(0, 1800),
        parseVersion: "manual-vision-2",
      },
    });

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
