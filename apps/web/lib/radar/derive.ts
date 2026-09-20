import type { DerivedSignal, Signal, SignalStatus } from "./types";

const PRIORITY: Record<SignalStatus, number> = { buy: 0, apply: 1, prepare: 2, watch: 3, client: 4 };

export function derive(signal: Signal): DerivedSignal {
  const hasNumbers = signal.cost !== null && signal.expectedResale !== null;
  const proceeds = hasNumbers
    ? (signal.expectedResale as number) * (1 - signal.marketplaceFeePct / 100) - signal.shippingEstimate
    : null;
  const profit = hasNumbers ? (proceeds as number) - (signal.cost as number) : null;
  const marginPct =
    hasNumbers && signal.cost
      ? ((profit as number) / (signal.cost as number)) * 100
      : null;
  return { ...signal, profit, marginPct };
}

export function sortSignals(signals: DerivedSignal[]): DerivedSignal[] {
  return [...signals].sort(
    (a, b) =>
      PRIORITY[a.status] - PRIORITY[b.status] ||
      new Date(a.launchAt).getTime() - new Date(b.launchAt).getTime()
  );
}

export function totalProfit(signals: DerivedSignal[]): number {
  return signals.reduce((sum, s) => sum + (s.profit ?? 0), 0);
}
