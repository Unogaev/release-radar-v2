// packages/testing/acceptance/AT-08.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { calculateEconomics, Money } from "../../domain/economics/landedCost";

// A tiny selection helper mirroring what the real market-data layer (Phase 3)
// must do: build the sale-price basis ONLY from completed sales, and never
// fall back to asks even when completed data is present but lower than asks.
function pickSalePriceBasis(completedSalesMinor: number[], asksMinor: number[]): number {
  if (completedSalesMinor.length === 0) {
    throw new Error("No completed sales — asks alone can never establish a sale price basis.");
  }
  const sorted = [...completedSalesMinor].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]; // median of completed sales
}

export const AT08: AcceptanceTest = {
  id: "AT-08",
  title: "Asking ($1,500) vs completed sales ($650–800) — economics built from completed range only",
  run: () => {
    const t = new TestContext();

    const completedSalesMinor = [65000, 70000, 72000, 80000]; // $650-$800
    const asksMinor = [150000, 155000]; // $1,500 asks — must never drive economics

    const salePriceBasisMinor = pickSalePriceBasis(completedSalesMinor, asksMinor);

    t.assertTrue(
      salePriceBasisMinor >= 65000 && salePriceBasisMinor <= 80000,
      "AT-08 sale price basis falls within completed sales range"
    );
    t.assertTrue(
      !asksMinor.includes(salePriceBasisMinor),
      "AT-08 sale price basis must never equal an ask value"
    );

    const zero: Money = { amountMinor: 0, currency: "USD" };
    const economics = calculateEconomics(
      {
        retail: { amountMinor: 19999, currency: "USD" },
        salesTax: { amountMinor: 1400, currency: "USD" },
        inboundShipping: zero,
        membershipOrEntryFee: zero,
        insurance: zero,
        importDuties: zero,
      },
      {
        salePrice: { amountMinor: salePriceBasisMinor, currency: "USD" },
        platformFee: { amountMinor: Math.round(salePriceBasisMinor * 0.13), currency: "USD" },
        paymentFee: { amountMinor: Math.round(salePriceBasisMinor * 0.03), currency: "USD" },
        outboundShipping: { amountMinor: 1500, currency: "USD" },
        insurance: zero,
        returnsRiskReserve: zero,
      }
    );

    // Sanity: computed off asks ($1,500) the "profit" would look dramatically
    // higher — confirm our result is NOT anywhere near that inflated figure.
    const inflatedIfUsingAsks = 150000 - economics.landedCost.amountMinor;
    t.assertTrue(
      economics.netProfitMinor < inflatedIfUsingAsks,
      "AT-08 net profit must be far lower than an asks-based figure would show"
    );

    return t.failures;
  },
};
