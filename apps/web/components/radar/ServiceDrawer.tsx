"use client";

import { useState } from "react";
import type { SourceHealth } from "@/lib/radar/types";

const STATE_TONE: Record<SourceHealth["state"], string> = {
  ok: "text-rr-ok",
  throttled: "text-rr-warn",
  manual: "text-rr-faint",
  down: "text-rr-warn",
};

export function ServiceDrawer({
  sources,
  logs,
}: {
  sources: SourceHealth[];
  logs: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-16 border-t border-rr-hair bg-rr-deep px-11 pb-11 pt-[26px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-ghost transition-colors hover:text-[#9a948a]"
      >
        <span>Служебное · Sources и логи</span>
        <span aria-hidden="true">{open ? "—" : "+"}</span>
      </button>

      {open && (
        <div
          className="mt-6 grid gap-x-11 gap-y-8"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}
        >
          <div className="flex flex-col gap-2.5">
            {sources.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between gap-4 border-b border-[rgba(241,238,232,0.05)] pb-[9px] font-rr-mono text-[11px]"
              >
                <span className="text-rr-text-dim">{s.name}</span>
                <span className={STATE_TONE[s.state]}>
                  {s.state} · {s.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {logs.map((line) => (
              <div key={line} className="font-rr-mono text-[11px] text-rr-ghost">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
