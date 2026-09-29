"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";

function numOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").trim());
  return isNaN(n) || n < 0 ? null : n;
}
function list(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Wave 2: the owner thresholds the decision engine actually reads.
 *  Every field maps 1:1 to what buildDecision() consumes:
 *  budget -> buyNow budget gate, goal -> resale path, minProfit/minRoi ->
 *  resale thresholds, allowedRetailers -> seller allow-list, zip -> future
 *  tax/shipping localization. */
export async function saveSettings(formData: FormData) {
  const userId = await requireUserId();

  const budgetDollars = numOrNull(formData.get("budget"));
  const minProfitDollars = numOrNull(formData.get("minProfit"));
  const minRoiPct = numOrNull(formData.get("minRoi"));

  await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      budgetMinor: budgetDollars !== null ? Math.round(budgetDollars * 100) : null,
      goal: String(formData.get("goal") ?? "self") === "resale" ? "resale" : "self",
      minProfitMinor:
        minProfitDollars !== null ? Math.round(minProfitDollars * 100) : null,
      minRoi: minRoiPct !== null ? minRoiPct / 100 : null,
      allowedRetailers: list(formData.get("allowedRetailers")),
      zip: String(formData.get("zip") ?? "").trim() || null,
      categories: list(formData.get("categories")),
      brands: list(formData.get("brands")),
    },
    create: {
      userId,
      budgetMinor: budgetDollars !== null ? Math.round(budgetDollars * 100) : null,
      goal: String(formData.get("goal") ?? "self") === "resale" ? "resale" : "self",
      minProfitMinor:
        minProfitDollars !== null ? Math.round(minProfitDollars * 100) : null,
      minRoi: minRoiPct !== null ? minRoiPct / 100 : null,
      allowedRetailers: list(formData.get("allowedRetailers")),
      zip: String(formData.get("zip") ?? "").trim() || null,
      categories: list(formData.get("categories")),
      brands: list(formData.get("brands")),
    },
  });

  redirect("/settings?saved=1");
}
