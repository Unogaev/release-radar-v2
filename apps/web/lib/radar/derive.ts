import type { DerivedSignal, Signal, SignalStatus } from "./types";

const PRIORITY: Record<SignalStatus, number> = { buy: 0, prepare: 1, client: 2 };

export function derive(signal: Signal): DerivedSignal {
  const profit = signal.expectedResale - signal.cost;
  return {
    ...signal,
    profit,
    marginPct: signal.expectedResale === 0 ? 0 : (profit / signal.expectedResale) * 100,
  };
}

export function sortSignals(signals: DerivedSignal[]): DerivedSignal[] {
  return [...signals].sort(
    (a, b) =>
      PRIORITY[a.status] - PRIORITY[b.status] ||
      new Date(a.launchAt).getTime() - new Date(b.launchAt).getTime()
  );
}

export function totalProfit(signals: DerivedSignal[]): number {
  return signals.reduce((sum, s) => sum + s.profit, 0);
}
