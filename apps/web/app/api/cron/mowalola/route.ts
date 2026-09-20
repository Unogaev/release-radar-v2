import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MowalolaAdapter, parseAnnouncedDate } from "@adapters/mowalola";
import { classifyEvidenceLevel } from "@domain/evidence/ladder";
import { decide, DecisionContext, requiresClientFirstOverride } from "@domain/decision/decisionEngine";
import { ScoreComponents } from "@domain/scoring/score";

const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h: do not spam-create decisions on every cron tick

// Independently-verified secondary sources for fields the official page does
// NOT show (SKU, retail price). Each is actually re-fetched and grepped
// below before being trusted - nothing here is written to the DB unless the
// live page really contains it at run time.
const ENRICHMENT_SOURCES = [
  {
    name: "Sneaker Bar Detroit \u2014 Mowalola AJ14 Collection",
    url: "https://sneakerbardetroit.com/mowalola-air-jordan-14-collection/",
    skuPattern: /IQ5708-001/,
    pricePattern: /\$\s?255\b/,
  },
  {
    name: "Nice Kicks \u2014 Mowalola AJ14 SP Burnt Red",
    url: "https://www.nicekicks.com/mowalola-air-jordan-14-sp-burnt-red-iq5708-001/",
    skuPattern: /IQ5708-001/,
    pricePattern: /\$\s?255\b/,
  },
];

const DEFAULT_SCORE: ScoreComponents = {
  demand: 65,
  scarcity: 60,
  margin: 50,
  access: 50,
  logistics: 50,
  userFit: 50,
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const log: Record<string, unknown> = {};

  try {
    // ---- 1. Source Registry: real official source ----
    let source = await prisma.source.findFirst({ where: { url: "https://www.mowalola.com/" } });
    if (!source) {
      source = await prisma.source.create({
        data: {
          name: "Mowalola Official",
          sourceClass: "A_truth",
          url: "https://www.mowalola.com/",
          parseVersion: "mowalola-v1",
          category: "sneakers",
          officialDomain: "mowalola.com",
          sourceType: "NEWSROOM",
          trustLevel: 5,
          checkIntervalMinutes: 15,
        },
      });
      log.sourceCreated = true;
    } else {
      log.sourceCreated = false;
    }
    log.source = source;

    // ---- 2. Discover (real HTTP fetch, real regex match) ----
    const adapter = new MowalolaAdapter(source.id);
    const rawSignals = await adapter.discover();
    log.rawDiscoverResult = rawSignals;

    await prisma.source.update({
      where: { id: source.id },
      data: { lastCheckedAt: new Date(), lastSuccessAt: new Date() },
    });

    if (rawSignals.length === 0) {
      log.result = "Banner not found on page at this check - no signal created.";
      return NextResponse.json(log);
    }

    const raw = rawSignals[0];

    await prisma.signal.create({
      data: { sourceId: source.id, rawText: raw.rawText, url: raw.url, observedAt: new Date(raw.observedAt) },
    });

    // ---- 3. Identify (generic, no invented SKU) ----
    const candidates = await adapter.identify(raw);
    const best = candidates[0];
    if (!best) {
      log.result = "Banner found but identify() rejected it - no signal created.";
      return NextResponse.json(log);
    }

    let product = await prisma.product.findFirst({
      where: { brand: best.brand, normalizedModel: best.model, category: "sneakers" },
    });
    if (!product) {
      product = await prisma.product.create({
        data: { brand: best.brand, normalizedModel: best.model, category: "sneakers" },
      });
    }

    let variant = await prisma.productVariant.findFirst({
      where: { productId: product.id, variantLabel: "default" },
    });
    if (!variant) {
      variant = await prisma.productVariant.create({
        data: { productId: product.id, variantLabel: "default" },
      });
    }
    log.productVariantId = variant.id;

    // ---- 4. Dedup: skip if a Decision was already created recently for this variant ----
    const recentDecision = await prisma.decision.findFirst({
      where: { productVariantId: variant.id, createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
    });
    if (recentDecision) {
      log.dedup = `Decision ${recentDecision.id} already created ${Math.round(
        (Date.now() - recentDecision.createdAt.getTime()) / 60000
      )} min ago - skipping to avoid duplicate.`;
      return NextResponse.json(log);
    }
    log.dedup = "No recent decision found - proceeding.";

    // ---- 5. Official evidence (E2_OFFICIAL ceiling, honest) ----
    const availability = await adapter.checkAvailability(
      { productVariantId: variant.id, sellerId: "mowalola.com" },
      { zip: "33101", sessionRegion: "US-FL" }
    );
    const evidenceLevel = classifyEvidenceLevel(availability);

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
        url: raw.url,
      },
    });

    const officialEvidence = await prisma.evidence.create({
      data: {
        productVariantId: variant.id,
        sourceId: source.id,
        level: evidenceLevel,
        rawSnapshotRef: `text:${raw.rawText.slice(0, 300)}`,
        parseVersion: "mowalola-v1",
        url: raw.url,
      },
    });
    log.officialEvidence = officialEvidence;

    // ---- 6. Enrichment: re-fetch each secondary source, only trust what is
    // still actually present in its live HTML right now ----
    const enrichmentEvidence: unknown[] = [];
    let confirmedSku: string | null = null;
    for (const es of ENRICHMENT_SOURCES) {
      try {
        const r = await fetch(es.url, { headers: { "User-Agent": "Mozilla/5.0 (ReleaseRadarBot/1.0)" } });
        if (!r.ok) continue;
        const text = stripTags(await r.text());
        const skuMatch = es.skuPattern.exec(text);
        const priceMatch = es.pricePattern.exec(text);
        if (!skuMatch && !priceMatch) continue;

        let enrichSource = await prisma.source.findFirst({ where: { url: es.url } });
        if (!enrichSource) {
          enrichSource = await prisma.source.create({
            data: {
              name: es.name,
              sourceClass: "C_signal",
              url: es.url,
              parseVersion: "mowalola-enrichment-v1",
              category: "sneakers",
              sourceType: "NEWSROOM",
              trustLevel: 3,
            },
          });
        }

        if (skuMatch) {
          confirmedSku = skuMatch[0];
          const ev = await prisma.evidence.create({
            data: {
              productVariantId: variant.id,
              sourceId: enrichSource.id,
              level: "E1_SIGNAL",
              rawSnapshotRef: `text:SKU "${skuMatch[0]}" confirmed at ${es.url}`,
              parseVersion: "mowalola-enrichment-v1",
              url: es.url,
            },
          });
          enrichmentEvidence.push({ field: "sku", value: skuMatch[0], source: es.name, evidenceId: ev.id });
        }
        if (priceMatch) {
          const ev = await prisma.evidence.create({
            data: {
              productVariantId: variant.id,
              sourceId: enrichSource.id,
              level: "E1_SIGNAL",
              rawSnapshotRef: `text:retail price "${priceMatch[0]}" confirmed at ${es.url}`,
              parseVersion: "mowalola-enrichment-v1",
              url: es.url,
            },
          });
          enrichmentEvidence.push({ field: "retailPrice", value: priceMatch[0], source: es.name, evidenceId: ev.id });
        }
      } catch (e) {
        enrichmentEvidence.push({ error: String(e), source: es.name });
      }
    }
    log.enrichmentEvidence = enrichmentEvidence;

    if (confirmedSku) {
      const existingIdentifier = await prisma.identifier.findFirst({
        where: { productVariantId: variant.id, kind: "sku", value: confirmedSku },
      });
      if (!existingIdentifier) {
        await prisma.identifier.create({
          data: { productVariantId: variant.id, kind: "sku", value: confirmedSku },
        });
      }
    }

    // ---- 7. Release event: date parsed from the OFFICIAL banner text only ----
    const dateMatch = /(\d{1,2})\.(\d{1,2})/.exec(raw.rawText);
    let releaseDate: Date | null = null;
    if (dateMatch) {
      releaseDate = parseAnnouncedDate(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10));
      await prisma.releaseEvent.create({
        data: {
          productVariantId: variant.id,
          startAtUtc: releaseDate,
          sourceTimezone: "America/New_York",
          timePrecision: "date_only",
        },
      });
    }
    log.releaseDate = releaseDate;

    // ---- 8. Real DecisionContext -> real decide() ----
    const expensiveOverrideApplies = requiresClientFirstOverride({
      priceUsd: 255,
      category: "other",
      provenScarcity: false,
      crossBorderComplexity: false,
    });

    const ctx: DecisionContext = {
      expensiveItemOverride: { applies: expensiveOverrideApplies },
      buyNow: {
        productIdentified: true,
        sellerOfRecord: availability.sellerOfRecord,
        allowedSellers: ["mowalola.com"],
        evidenceLevel,
        isProblematicRetailer: false,
        availability,
        checkoutPriceKnown: false,
        fullCostKnown: false,
        maxBuyPriceSet: false,
        quantityLimitSet: false,
        isResaleScenario: false,
        hasCompletedSalesOrConfirmedClient: false,
        projectedEconomicsPasses: false,
        hasBlockingLegalOrLogisticsRisk: false,
      },
      applyNow: null,
      prepare: {
        confirmedBySourceE2: evidenceLevel !== "E0_RUMOR" && evidenceLevel !== "E1_SIGNAL",
        dateAndTimeOfficial: Boolean(releaseDate),
        timePrecision: releaseDate ? "date_only" : "tba",
        isFirstGenerationTechAnnouncement: false,
        launchUrlKnown: Boolean(raw.url),
        preparationActionsFormed: true, // signing up for early access IS the prep action
      },
      clientFirst: null,
      fallbackHint: "insufficient_evidence",
      score: DEFAULT_SCORE,
      evidenceLevel,
      sourceCount: 1 + enrichmentEvidence.filter((e: any) => !e.error).length,
      hasConflictingEvidence: false,
    };

    const result = decide(ctx);
    log.decisionContext = ctx;
    log.decisionResult = result;

    const decision = await prisma.decision.create({
      data: {
        productVariantId: variant.id,
        status: result.status,
        ruleVersion: result.ruleVersion,
        rationale: result.rationale,
        blockedReasons: result.blockedReasons,
        evidenceConfidence: result.evidenceConfidence,
      },
    });
    log.decision = decision;
    log.result = `Card created: Decision ${decision.id}, status ${result.status}.`;

    return NextResponse.json(log);
  } catch (e) {
    return NextResponse.json({ error: String(e), log }, { status: 500 });
  }
}
