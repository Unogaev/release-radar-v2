import { prisma } from "@/lib/prisma";
import { formatNotification, type NotificationStage } from "./format";

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

export async function createFirstDetectionAlert(input: CreateAlertInput): Promise<void> {
  const userId = await getOwnerUserId();
  if (!userId) {
    // Honest no-op: no owner account exists yet (seedOwner.ts not run), so there is
    // no one to notify. We do not fabricate a recipient.
    return;
  }

  const stage: NotificationStage = "first_detection";
  const dedupeKey = input.productVariantId + ":" + stage;

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

  await prisma.alert.create({
    data: {
      userId,
      decisionId: input.decisionId,
      channel: "browser",
      payload: JSON.stringify({ title, body }),
      dedupeKey,
    },
  });
}
