// packages/domain/economics/landedCost.ts
//
// Implements spec §11 formulas EXACTLY:
//
//   landed_cost = retail + sales_tax + inbound_shipping
//               + membership_or_entry_fee + insurance
//               + import_duties_if_applicable
//
//   net_proceeds = sale_price - platform_fee - payment_fee
//                - outbound_shipping - insurance - returns_risk_reserve
//
//   net_profit = net_proceeds - landed_cost
//   roi = net_profit / landed_cost
//
//   min_sale_price = (landed_cost * (1 + target_roi) + fixed_exit_costs)
//                     / (1 - total_variable_fee_rate)
//
// Money is minor units (cents) + ISO currency, matching the convention used
// throughout the rest of the domain layer.

export interface Money {
  amountMinor: number;
  currency: string;
}

export interface LandedCostInput {
  retail: Money;
  salesTax: Money;
  inboundShipping: Money;
  membershipOrEntryFee: Money;
  insurance: Money;
  importDuties: Money;
}

export interface NetProceedsInput {
  salePrice: Money;
  platformFee: Money;
  paymentFee: Money;
  outboundShipping: Money;
  insurance: Money;
  returnsRiskReserve: Money;
}

function assertSameCurrency(moneys: Money[], context: string): string {
  const currencies = new Set(moneys.map((m) => m.currency));
  if (currencies.size > 1) {
    throw new Error(`${context}: mixed currencies (${[...currencies].join(", ")}).`);
  }
  return moneys[0].currency;
}

export function calculateLandedCost(input: LandedCostInput): Money {
  const parts = [
    input.retail,
    input.salesTax,
    input.inboundShipping,
    input.membershipOrEntryFee,
    input.insurance,
    input.importDuties,
  ];
  const currency = assertSameCurrency(parts, "calculateLandedCost");
  return { amountMinor: parts.reduce((s, m) => s + m.amountMinor, 0), currency };
}

export function calculateNetProceeds(input: NetProceedsInput): Money {
  const parts = [
    input.salePrice,
    input.platformFee,
    input.paymentFee,
    input.outboundShipping,
    input.insurance,
    input.returnsRiskReserve,
  ];
  const currency = assertSameCurrency(parts, "calculateNetProceeds");
  const amountMinor =
    input.salePrice.amountMinor -
    input.platformFee.amountMinor -
    input.paymentFee.amountMinor -
    input.outboundShipping.amountMinor -
    input.insurance.amountMinor -
    input.returnsRiskReserve.amountMinor;
  return { amountMinor, currency };
}

export interface EconomicsResult {
  landedCost: Money;
  netProceeds: Money;
  netProfitMinor: number;
  roi: number; // fraction, e.g. 0.20 = 20%
  currency: string;
}

export function calculateEconomics(
  landedCostInput: LandedCostInput,
  netProceedsInput: NetProceedsInput
): EconomicsResult {
  const landedCost = calculateLandedCost(landedCostInput);
  const netProceeds = calculateNetProceeds(netProceedsInput);
  if (landedCost.currency !== netProceeds.currency) {
    throw new Error(
      `calculateEconomics: currency mismatch (${landedCost.currency} vs ${netProceeds.currency}).`
    );
  }
  const netProfitMinor = netProceeds.amountMinor - landedCost.amountMinor;
  const roi = landedCost.amountMinor === 0 ? 0 : netProfitMinor / landedCost.amountMinor;
  return { landedCost, netProceeds, netProfitMinor, roi, currency: landedCost.currency };
}

/** min_sale_price formula, spec §11. */
export function calculateMinSalePrice(input: {
  landedCostMinor: number;
  targetRoi: number; // fraction
  fixedExitCostsMinor: number;
  totalVariableFeeRate: number; // fraction, e.g. 0.15 for 15%
}): number {
  if (input.totalVariableFeeRate >= 1) {
    throw new Error("totalVariableFeeRate must be < 1.");
  }
  return (
    (input.landedCostMinor * (1 + input.targetRoi) + input.fixedExitCostsMinor) /
    (1 - input.totalVariableFeeRate)
  );
}

/**
 * ROI threshold check per spec §11 "Пороги" — category-aware, NOT a single
 * global number:
 *   - обычный resale alert: ROI >= 20%
 *   - clearance: >= $50 net profit ИЛИ >= 30% ROI
 *   - ликвидные категории (Apple/consoles/GPU/cameras/LEGO/luxury): >= $30 при быстром обороте
 *   - independent watches <=100 pieces: могут пройти без подтверждённой маржи
 *     при официальном ограниченном доступе и коллекционной значимости
 */
export type EconomicsCategory =
  | "standard_resale"
  | "clearance"
  | "liquid_fast_turn"
  | "limited_independent_watch";

export function economicsPassesThreshold(
  category: EconomicsCategory,
  economics: EconomicsResult,
  context?: { editionSizeAtMost100?: boolean; officialLimitedAccess?: boolean }
): boolean {
  switch (category) {
    case "standard_resale":
      return economics.roi >= 0.2;
    case "clearance":
      return economics.netProfitMinor >= 5000 || economics.roi >= 0.3; // $50 = 5000 cents
    case "liquid_fast_turn":
      return economics.netProfitMinor >= 3000; // $30
    case "limited_independent_watch":
      return Boolean(context?.editionSizeAtMost100 && context?.officialLimitedAccess);
    default:
      return false;
  }
}
