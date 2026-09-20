import { createECDH, createHash, createHmac } from "crypto";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type BrowserPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

type PushPayload = { title: string; body: string; url?: string; tag?: string };

type VapidKeys = { publicKey: string; privateKey: string };

function base64Url(value: Buffer): string {
  return value.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function vapidKeys(): VapidKeys | null {
  if (process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY) {
    return { publicKey: process.env.WEB_PUSH_PUBLIC_KEY, privateKey: process.env.WEB_PUSH_PRIVATE_KEY };
  }
  const serverSecret = process.env.NEXTAUTH_SECRET
    ?? process.env.AUTH_SECRET
    ?? process.env.MOWALOLA_CRON_SECRET
    ?? process.env.CRON_SECRET;
  if (!serverSecret) return null;

  // Domain-separated derivation keeps the VAPID identity stable without storing
  // another production secret. Only the public point is ever sent to a browser.
  const privateKey = createHmac("sha256", serverSecret)
    .update("release-radar:web-push:v1")
    .digest();
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(privateKey);
  return { publicKey: base64Url(ecdh.getPublicKey(undefined, "uncompressed")), privateKey: base64Url(privateKey) };
}

export function pushConfigured(): boolean {
  return vapidKeys() !== null;
}

export function pushPublicKey(): string | null {
  return vapidKeys()?.publicKey ?? null;
}

export function subscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

function configureWebPush(): boolean {
  const keys = vapidKeys();
  if (!keys) return false;
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? "mailto:eunogaev@gmail.com",
    keys.publicKey,
    keys.privateKey
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
