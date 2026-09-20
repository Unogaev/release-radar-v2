import { createHash } from "crypto";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type BrowserPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

type PushPayload = { title: string; body: string; url?: string; tag?: string };

export function pushConfigured(): boolean {
  return Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY);
}

export function pushPublicKey(): string | null {
  return process.env.WEB_PUSH_PUBLIC_KEY ?? null;
}

export function subscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

function configureWebPush(): boolean {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? "mailto:eunogaev@gmail.com",
    process.env.WEB_PUSH_PUBLIC_KEY as string,
    process.env.WEB_PUSH_PRIVATE_KEY as string
  );
  return true;
}

export async function savePushSubscription(userId: string, subscription: BrowserPushSubscription): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "push_subscription.upsert",
      entityType: "PushSubscription",
      entityId: subscriptionId(subscription.endpoint),
      after: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? null,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
    },
  });
}

export async function removePushSubscription(userId: string, endpoint: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "push_subscription.remove",
      entityType: "PushSubscription",
      entityId: subscriptionId(endpoint),
      after: { endpoint },
    },
  });
}

async function activeSubscriptions(userId: string): Promise<BrowserPushSubscription[]> {
  const events = await prisma.auditLog.findMany({
    where: { actorId: userId, entityType: "PushSubscription" },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  const latest = new Map<string, (typeof events)[number]>();
  for (const event of events) if (!latest.has(event.entityId)) latest.set(event.entityId, event);
  return [...latest.values()]
    .filter((event) => event.action === "push_subscription.upsert")
    .map((event) => event.after as BrowserPushSubscription)
    .filter((subscription) => Boolean(subscription?.endpoint && subscription?.keys?.p256dh && subscription?.keys?.auth));
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number; configured: boolean }> {
  if (!configureWebPush()) return { sent: 0, failed: 0, configured: false };
  const subscriptions = await activeSubscriptions(userId);
  let sent = 0;
  let failed = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60, urgency: "high" });
      sent += 1;
    } catch (error) {
      failed += 1;
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await removePushSubscription(userId, subscription.endpoint);
      }
    }
  }));
  return { sent, failed, configured: true };
}
