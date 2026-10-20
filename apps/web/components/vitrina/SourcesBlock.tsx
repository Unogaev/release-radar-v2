"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";

export interface EvidenceItem {
  type: string;
  site: string;
  url?: string | null;
  confirms: string;
  level: string;
  at?: string | null;
}

export function SourcesBlock({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
      <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Sources & evidence</h2>
      <div className="space-y-3">
        {items.map((e, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f4f6] text-[#6b7280]">
              <ShieldCheck size={16} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{e.site}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#374151]">{e.level}</span>
              </div>
              <div className="mt-0.5 text-[13px] text-[#6b7280]">{e.confirms}</div>
              {e.url && (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-[#16a34a] hover:underline">
                  Open source <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
