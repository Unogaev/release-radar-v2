import { describe, it, expect } from "vitest";
import { buildCardViewModel, completenessOf, ctaOf, landedCost, netProfit } from "./cardViewModel";

describe("completeness", () => {
  it("FULL when retail + completed sales", () => {
    expect(completenessOf({ kind: "ALERT", retailUsd: 130, completedSalesCount: 12, expectedResaleUsd: 215 })).toBe("FULL");
  });
  it("PRICED when retail only", () => {
    expect(completenessOf({ kind: "RELEASE", retailUsd: 800 })).toBe("PRICED");
  });
  it("ASKS_ONLY when only asks", () => {
    expect(completenessOf({ kind: "SIGNAL", askFromUsd: 512 })).toBe("ASKS_ONLY");
  });
  it("BARE when nothing", () => {
    expect(completenessOf({ kind: "NEWS" })).toBe("BARE");
  });
  it("PRICED not FULL when sales count is 0", () => {
    expect(completenessOf({ kind: "ALERT", retailUsd: 100, completedSalesCount: 0, expectedResaleUsd: 150 })).toBe("PRICED");
  });
});

describe("cta", () => {
  it("buy with url, watch without", () => {
    expect(ctaOf({ kind: "ALERT", status: "buy", purchaseUrl: "https://x" }).cta).toBe("buy");
    expect(ctaOf({ kind: "ALERT", status: "buy" }).cta).toBe("watch");
  });
  it("release → remind, news → read", () => {
    expect(ctaOf({ kind: "RELEASE" }).cta).toBe("remind");
    expect(ctaOf({ kind: "NEWS" }).cta).toBe("read");
  });
  it("client first", () => {
    expect(ctaOf({ kind: "ALERT", status: "client" }).cta).toBe("client");
  });
});

describe("money", () => {
  it("landed adds 7% tax", () => {
    expect(landedCost(100)).toBe(107);
  });
  it("profit subtracts landed and fee", () => {
    // retail 100 → landed 107; resale 200 → net 174; profit 67
    expect(netProfit(100, 200)).toBe(67);
  });
});

describe("view model", () => {
  it("FULL shows profit, no notes", () => {
    const vm = buildCardViewModel({ kind: "ALERT", retailUsd: 130, completedSalesCount: 5, expectedResaleUsd: 215 });
    expect(vm.showProfit).toBe(true);
    expect(vm.showPricedNote).toBe(false);
    expect(vm.showAsksNote).toBe(false);
  });
  it("ASKS_ONLY shows asks note only", () => {
    const vm = buildCardViewModel({ kind: "SIGNAL", askFromUsd: 300 });
    expect(vm.showAsksNote).toBe(true);
    expect(vm.showProfit).toBe(false);
  });
});
