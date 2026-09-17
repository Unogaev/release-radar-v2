"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { EvidenceLevel } from "@domain/evidence/types";

// Spec §15: "purchase создаётся только после явного подтверждения
// пользователя или подтверждённого order event." This is the only code
// path in the app that creates a Purchase row.
export async function confirmPurchase(productVariantId: string, decisionId: string, formData: FormData) {
  const userId = await requireUserId();
  const actualCostMinor = Math.round(parseFloat(String(formData.get("actualCost") ?? "0")) * 100);

  let manualSource = await prisma.source.findFirst({ where: { name: "manual-entry" } });
  if (!manualSource) {
    manualSource = await prisma.source.create({
      data: { name: "manual-entry", sourceClass: "A_truth", url: "", parseVersion: "manual-v1" },
    });
  }

  await prisma.evidence.create({
    data: {
      productVariantId,
      sourceId: manualSource.id,
      level: EvidenceLevel.E5_USER_CONFIRMED,
      rawSnapshotRef: `user-confirmed:${Date.now()}`,
      parseVersion: "manual-v1",
    },
  });

  await prisma.purchase.create({
    data: {
      userId,
      productVariantId,
      actualCostMinor,
      status: "confirmed",
    },
  });

  revalidatePath(`/signals/${decisionId}`);
  revalidatePath("/purchases");
}
