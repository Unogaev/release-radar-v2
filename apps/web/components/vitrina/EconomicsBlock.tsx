"use client";

import { landedCost, netProfit, marginPct } from "@/lib/radar/cardViewModel";

function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[14px] text-[#6b7280]">{label}</span>
      <span
        className={`tabular-nums text-[14px] ${bold ? "font-bold" : "font-medium"} ${green ? "text-[#16a34a]" : "text-[#1a1a1a]"}`}
      >
        {value}
      </span>
    </div>
  );
}

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function EconomicsBlock({ retailUsd, expectedResaleUsd }: { retailUsd?: number | null; expectedResaleUsd?: number | null }) {
  if (retailUsd == null || retailUsd <= 0) return null;
  const landed = landedCost(retailUsd);
  const hasSale = expectedResaleUsd != null && expectedResaleUsd > 0;
  const profit = hasSale ? netProfit(retailUsd, expectedResaleUsd!) : null;
  const margin = hasSale ? marginPct(retailUsd, expectedResaleUsd!) : null;
  return (
    <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
      <h2 className="mb-2 text-[14px] font-semibold text-[#1a1a1a]">Economics</h2>
      <Row label="Retail" value={fmt(retailUsd)} />
      <Row label="Tax (Miami-Dade 7%)" value={fmt(Math.round((landed - retailUsd) * 100) / 100)} />
      <Row label="Landed cost" value={fmt(landed)} bold />
      {hasSale ? (
        <>
          <Row label="Expected sale (after 13% fee)" value={fmt(Math.round(expectedResaleUsd! * 0.87))} />
          <div className="my-2 border-t border-[#e5e7eb]" />
          <Row label="Net profit" value={`+${fmt(profit!)}`} bold green />
          <Row label="Margin" value={`${margin!.toFixed(1)}%`} green />
        </>
      ) : (
        <p className="mt-2 text-[13px] text-[#6b7280]">No completed sales yet — profit not calculated.</p>
      )}
    </section>
  );
}
