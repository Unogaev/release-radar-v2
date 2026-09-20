import { prisma } from "@/lib/prisma";
import { formatNotification, type NotificationStage } from "./format";
import { sendPushToUser } from "./push";

interface CreateAlertInput {
  decisionId: string;
  productVariantId: string;
  brand: string;
  model: string;
  status: string;
  priceUsd: number | null;
  store: string | null;
  primaryUrl: string | null;
}

// Single-user product: notifications go to the one owner account seeded via seedOwner.ts.
async function getOwnerUserId(): Promise<string | null> {
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  return owner?.id ?? null;
}

async function createSignalAlert(input: CreateAlertInput, stage: NotificationStage, dedupeSuffix?: string): Promise<void> {
  const userId = await getOwnerUserId();
  if (!userId) {
    // Honest no-op: no owner account exists yet (seedOwner.ts not run), so there is
    // no one to notify. We do not fabricate a recipient.
    return;
  }

  const dedupeKey = input.productVariantId + ":" + stage + (dedupeSuffix ? ":" + dedupeSuffix : "");

  const existing = await prisma.alert.findFirst({
    where: { decisionId: input.decisionId, channel: "browser", dedupeKey },
  });
  if (existing) return;

  const { title, body } = formatNotification({
    stage,
    brand: input.brand,
    model: input.model,
    status: input.status,
    priceUsd: input.priceUsd,
    store: input.store,
    primaryUrl: input.primaryUrl,
  });

  const alert = await prisma.alert.create({
    data: {
      userId,
      decisionId: input.decisionId,
      channel: "browser",
      payload: JSON.stringify({ title, body }),
      dedupeKey,
    },
  });

  const delivery = await sendPushToUser(userId, {
    title,
    body,
    url: input.primaryUrl ?? "/now",
    tag: dedupeKey,
  });
  if (delivery.sent > 0) await prisma.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
}

export async function createFirstDetectionAlert(input: CreateAlertInput): Promise<void> {
  return createSignalAlert(input, "first_detection");
}

export async function createUnexpectedRestockAlert(input: CreateAlertInput): Promise<void> {
  return createSignalAlert(input, "unexpected_restock", input.decisionId);
}

export async function createPriceStatusChangeAlert(input: CreateAlertInput): Promise<void> {
  return createSignalAlert(input, "price_status_change", input.decisionId);
}

function reminderStage(hoursLeft: number): NotificationStage | null {
  if (hoursLeft <= 0 && hoursLeft >= -1) return "opening_hour";
  if (hoursLeft > 0 && hoursLeft <= 1.25) return "t_minus_1h";
  if (hoursLeft > 1.25 && hoursLeft <= 3.5) return "t_minus_3h";
  if (hoursLeft > 3.5 && hoursLeft <= 25) return "t_minus_24h";
  if (hoursLeft > 25 && hoursLeft <= 73) return "t_minus_72h";
  return null;
}

export async function createDueReleaseReminders(): Promise<number> {
  const userId = await getOwnerUserId();
  if (!userId) return 0;
  const now = new Date();
  const events = await prisma.releaseEvent.findMany({
    where: {
      startAtUtc: {
        gte: new Date(now.getTime() - 60 * 60_000),
        lte: new Date(now.getTime() + 73 * 60 * 60_000),
      },
      productVariant: { decisions: { some: { status: { in: ["BUY_NOW", "APPLY_NOW", "PREPARE"] } } } },
    },
    include: {
      productVariant: {
        include: {
          product: true,
          decisions: { orderBy: { createdAt: "desc" }, take: 1 },
          availabilityChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
          identifiers: { take: 1 },
          offers: { include: { seller: true }, take: 1 },
          signals: { orderBy: { observedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  let created = 0;
  for (const event of events) {
    if (!event.startAtUtc) continue;
    const stage = reminderStage((event.startAtUtc.getTime() - now.getTime()) / 3_600_000);
    if (!stage) continue;
    const key = `${userId}:${event.id}:${event.eventStartVersion}:${stage}`;
    const exists = await prisma.reminderEvent.findUnique({ where: { idempotencyKey: key } });
    if (exists) continue;
    const variant = event.productVariant;
    const decision = variant.decisions[0];
    if (!decision) continue;
    const availability = variant.availabilityChecks[0];
    const store = availability?.sellerOfRecord ?? variant.offers[0]?.seller.name ?? null;
    const url = availability?.url ?? variant.signals[0]?.url ?? "/now";
    const etTime = event.startAtUtc.toLocaleString("ru-RU", {
      timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const message = formatNotification({
      stage,
      brand: variant.product.brand,
      model: variant.product.normalizedModel,
      sku: variant.identifiers[0]?.value ?? null,
      status: decision.status,
      priceUsd: availability?.priceUsd ?? null,
      store,
      etTime,
      primaryUrl: url,
    });
    const alert = await prisma.alert.create({
      data: { userId, decisionId: decision.id, channel: "web_push", payload: JSON.stringify(message), dedupeKey: key },
    });
    const delivery = await sendPushToUser(userId, { ...message, url, tag: key });
    if (delivery.sent > 0) await prisma.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
    await prisma.reminderEvent.create({
      data: { userId, releaseEventId: event.id, stage, eventStartVersion: event.eventStartVersion, idempotencyKey: key, sentAt: delivery.sent > 0 ? new Date() : null },
    });
    created += 1;
  }
  return created;
}
