// packages/domain/economics/costModel.ts
//
// Wave 2: the HONEST INPUT layer for the spec §11 formulas in landedCost.ts.
// The formulas were already correct — what was missing was a disciplined way
// to build their inputs from real observations. Every money line carries its
// basis:
//
//   observed  — read from a live source (retailer page, market API, buyer request)
//   estimated — a documented default (tax rate, platform fee); always flagged
//   user_set  — the owner's own threshold from Settings
//
// Nothing is invented: estimated lines use documented defaults and are always
// labeled as estimates in the UI. A total that contains estimates is flagged
// via `hasEstimates` so callers can say "≈" instead of stating it as fact.

export type LineBasis = "observed" | "estimated" | "user_set";

export interface CostLine {
  label: string;
  amountMinor: number; // integer minor units (cents for USD)
  currency: string;
  basis: LineBasis;
  note?: string;
}

export interface CostModel {
  lines: CostLine[];
  totalMinor: number;
  currency: string;
  hasEstimates: boolean;
}

export interface ProceedsModel {
  salePriceMinor: number;
  saleLabel: string;
  saleBasis: LineBasis;
  saleNote?: string;
  deductions: CostLine[];
  netMinor: number;
  currency: string;
  hasEstimates: boolean;
}

// ---------------------------------------------------------------------------
// Documented estimate defaults. These are the same values the /now feed
// already used for display; centralized here so every consumer labels them
// identically as estimates, never as observed facts.
// ---------------------------------------------------------------------------

/** Miami-Dade, FL: 6% state + 1% surtax. Used until the owner sets a ZIP. */
export const ESTIMATED_MIAMI_DADE_TAX_RATE = 0.07;
/** Typical marketplace take rate (eBay/StockX/GOAT blended). */
export const ESTIMATED_MARKETPLACE_FEE_RATE = 0.13;
/** Typical insured outbound shipping for a single item (USD cents). */
export const ESTIMATED_OUTBOUND_SHIPPING_MINOR = 2000;

/** "$1,599.00" — short, no currency code; callers add the code when needed. */
export function formatMoneyMinor(amountMinor: number, currency = "USD"): string {
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amountMinor));
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  const grouped = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${sign}${symbol}${grouped}.${minor.toString().padStart(2, "0")}`;
}

function basisTag(basis: LineBasis): string {
  return basis === "observed" ? "observed" : basis === "user_set" ? "your setting" : "estimate";
}

/**
 * Direct-purchase landed cost: price (observed) + tax (estimated) +
 * inbound shipping (estimated when unknown).
 */
export function buildDirectPurchaseModel(input: {
  priceMinor: number;
  currency: string;
  /** e.g. 0.07 — null means "unknown, use the documented default". */
  taxRate: number | null;
  /** null/undefined = not observed; estimated as $0 with an explicit note. */
  inboundShippingMinor?: number | null;
}): CostModel {
  const lines: CostLine[] = [
    {
      label: "Price",
      amountMinor: Math.round(input.priceMinor),
      currency: input.currency,
      basis: "observed",
      note: "Observed checkout price",
    },
  ];

  const taxRate = input.taxRate ?? ESTIMATED_MIAMI_DADE_TAX_RATE;
  lines.push({
    label: "Sales tax",
    amountMinor: Math.round(input.priceMinor * taxRate),
    currency: input.currency,
    basis: "estimated",
    note:
      input.taxRate !== null
        ? `Estimated at ${(taxRate * 100).toFixed(1)}%`
        : "Estimated 7% Miami-Dade — set your ZIP in Settings for exact tax",
  });

  const inbound = input.inboundShippingMinor ?? null;
  lines.push({
    label: "Inbound shipping",
    amountMinor: inbound === null ? 0 : Math.round(inbound),
    currency: input.currency,
    basis: inbound === null ? "estimated" : "observed",
    note:
      inbound === null
        ? "Not observed — assumed $0, verify at checkout"
        : "Observed shipping cost",
  });

  const totalMinor = lines.reduce((s, l) => s + l.amountMinor, 0);
  return {
    lines,
    totalMinor,
    currency: input.currency,
    hasEstimates: lines.some((l) => l.basis === "estimated"),
  };
}

/**
 * Resale proceeds: sale price (observed from completed sales or a confirmed
 * buyer request) minus platform fee and outbound shipping (both estimated).
 */
export function buildResaleProceedsModel(input: {
  salePriceMinor: number;
  currency: string;
  saleLabel: string;
  saleBasis: Exclude<LineBasis, "estimated">;
  saleNote?: string;
}): ProceedsModel {
  const deductions: CostLine[] = [
    {
      label: "Marketplace fee",
      amountMinor: Math.round(input.salePriceMinor * ESTIMATED_MARKETPLACE_FEE_RATE),
      currency: input.currency,
      basis: "estimated",
      note: `Estimated ${(ESTIMATED_MARKETPLACE_FEE_RATE * 100).toFixed(0)}% platform take rate`,
    },
    {
      label: "Outbound shipping",
      amountMinor: ESTIMATED_OUTBOUND_SHIPPING_MINOR,
      currency: input.currency,
      basis: "estimated",
      note: "Estimated insured shipping for one item",
    },
  ];
  const deductionsTotal = deductions.reduce((s, l) => s + l.amountMinor, 0);
  return {
    salePriceMinor: Math.round(input.salePriceMinor),
    saleLabel: input.saleLabel,
    saleBasis: input.saleBasis,
    saleNote: input.saleNote,
    deductions,
    netMinor: Math.round(input.salePriceMinor) - deductionsTotal,
    currency: input.currency,
    hasEstimates: true, // deductions are always estimated in v2
  };
}

/** Human-readable lines for rationale / UI: "Price $1,599.00 (observed)". */
export function summarizeCostModel(model: CostModel): string[] {
  return model.lines.map(
    (l) =>
      `${l.label}: ${model.hasEstimates && l.basis === "estimated" ? "≈" : ""}${formatMoneyMinor(
        l.amountMinor,
        model.currency
      )} (${basisTag(l.basis)}${l.note ? ` — ${l.note}` : ""})`
  );
}

export function summarizeProceedsModel(model: ProceedsModel): string[] {
  const head = `Expected sale: ${formatMoneyMinor(model.salePriceMinor, model.currency)} (${
    model.saleBasis === "observed" ? "observed" : "your setting"
  } — ${model.saleLabel})`;
  const tail = model.deductions.map(
    (d) =>
      `${d.label}: ≈${formatMoneyMinor(d.amountMinor, model.currency)} (estimate${d.note ? ` — ${d.note}` : ""})`
  );
  return [head, ...tail, `Net proceeds: ≈${formatMoneyMinor(model.netMinor, model.currency)}`];
}
