"use server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";

export async function createQuickSignal(formData: FormData) {
  await requireUserId();

  const url = String(formData.get("url") ?? "").trim();
  const rawTextInput = String(formData.get("rawText") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  const screenshots = formData.getAll("screenshots") as File[];
  const screenshotNames = screenshots
    .filter((f) => f && typeof f === "object" && "size" in f && f.size > 0)
    .map((f) => f.name);

  let manualSource = await prisma.source.findFirst({ where: { name: "manual-entry" } });
  if (!manualSource) {
    manualSource = await prisma.source.create({
      data: { name: "manual-entry", sourceClass: "A_truth", url: "", parseVersion: "manual-v1" },
    });
  }

  const rawTextParts = [
    comment && `Комментарий: ${comment}`,
    rawTextInput,
    screenshotNames.length > 0 && `Файлы: ${screenshotNames.join(", ")}`,
  ].filter(Boolean) as string[];

  const signal = await prisma.signal.create({
    data: {
      sourceId: manualSource.id,
      rawText: rawTextParts.join("\n\n") || null,
      url: url || null,
    },
  });

  redirect(`/signals/quick/${signal.id}`);
}
