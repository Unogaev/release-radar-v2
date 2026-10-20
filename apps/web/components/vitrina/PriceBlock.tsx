"use client";
import { tokens } from "./tokens";
export type Completeness = "FULL" | "PRICED" | "ASKS_ONLY" | "BARE";
export function PriceBlock({ level, retail, landed, profit, marginPct, askFrom }: {
  level: Completeness;
  retail?: number | null;
  landed?: number | null;
  profit?: number | null;
  marginPct?: number | null;
  askFrom?: number | null;
}) {
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (level === "FULL" && profit != null) {
    return (
      <div>
        <div className="tabular-nums text-[20px] font-bold" style={{ color: tokens.color.accent }}>+{fmt(profit)}</div>
        {marginPct != null && <div className="tabular-nums text-[12px]" style={{ color: tokens.color.textSecondary }}>{marginPct.toFixed(1)}% margin</div>}
      </div>
    );
  }
  if (level === "PRICED" && retail != null) {
    return (
      <div>
        <div className="tabular-nums text-[16px] font-semibold">{fmt(retail)}</div>
        <div className="text-[12px]" style={{ color: tokens.color.textSecondary }}>No sales yet — profit not calculated</div>
      </div>
    );
  }
  if (level === "ASKS_ONLY" && askFrom != null) {
    return <div className="tabular-nums text-[14px]" style={{ color: tokens.color.textTertiary }}>Asking from {fmt(askFrom)} — not sales</div>;
  }
  return null;
}
