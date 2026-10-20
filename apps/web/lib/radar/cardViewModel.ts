/**
 * Pure view-model builder for feed cards.
 * Input: a signal/news item. Output: exactly what the card renders.
 * Rule: never render emptiness — no dashes, no "no data".
 */
export type CardKind = "ALERT" | "SIGNAL" | "RELEASE" | "NEWS";
export type Completeness = "FULL" | "PRICED" | "ASKS_ONLY" | "BARE";
export type CtaKind = "buy" | "apply" | "prepare" | "client" | "watch" | "remind" | "read";

export interface CardInput {
  kind: CardKind;
  status?: string | null;
  retailUsd?: number | null;
  completedSalesCount?: number | null;
  expectedResaleUsd?: number | null;
  askFromUsd?: number | null;
  purchaseUrl?: string | null;
  sourceUrl?: string | null;
}

export interface CardViewModel {
  completeness: Completeness;
  cta: CtaKind;
  ctaLabel: string;
  showProfit: boolean;
  showPricedNote: boolean;
  showAsksNote: boolean;
}

const TAX_RATE = 0.07; // Miami-Dade

export function landedCost(retailUsd: number): number {
  return Math.round(retailUsd * (1 + TAX_RATE) * 100) / 100;
}

export function completenessOf(input: CardInput): Completeness {
  const hasRetail = input.retailUsd != null && input.retailUsd > 0;
  const hasSales = (input.completedSalesCount ?? 0) > 0 && input.expectedResaleUsd != null;
  if (hasRetail && hasSales) return "FULL";
  if (hasRetail) return "PRICED";
  if (input.askFromUsd != null && input.askFromUsd > 0) return "ASKS_ONLY";
  return "BARE";
}

export function ctaOf(input: CardInput): { cta: CtaKind; label: string } {
  const hasUrl = Boolean(input.purchaseUrl);
  switch (input.status) {
    case "buy":
      return hasUrl ? { cta: "buy", label: "Buy" } : { cta: "watch", label: "Watch" };
    case "apply":
      return { cta: "apply", label: "Apply" };
    case "prepare":
      return { cta: "prepare", label: "Prepare" };
    case "client":
      return { cta: "client", label: "Find a client" };
    default:
      break;
  }
  if (input.kind === "RELEASE") return { cta: "remind", label: "Remind me" };
  if (input.kind === "NEWS") return { cta: "read", label: "Read" };
  return { cta: "watch", label: "Watch" };
}

export function buildCardViewModel(input: CardInput): CardViewModel {
  const completeness = completenessOf(input);
  const { cta, label } = ctaOf(input);
  return {
    completeness,
    cta,
    ctaLabel: label,
    showProfit: completeness === "FULL",
    showPricedNote: completeness === "PRICED",
    showAsksNote: completeness === "ASKS_ONLY",
  };
}

export function netProfit(retailUsd: number, expectedResaleUsd: number, feeRate = 0.13): number {
  const landed = landedCost(retailUsd);
  const netSale = expectedResaleUsd * (1 - feeRate);
  return Math.round((netSale - landed) * 100) / 100;
}

export function marginPct(retailUsd: number, expectedResaleUsd: number, feeRate = 0.13): number {
  const landed = landedCost(retailUsd);
  if (landed <= 0) return 0;
  return Math.round(((netProfit(retailUsd, expectedResaleUsd, feeRate) / landed) * 100) * 10) / 10;
}
