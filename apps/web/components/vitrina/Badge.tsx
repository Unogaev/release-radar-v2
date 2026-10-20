"use client";
import { tokens } from "./tokens";
export function Badge({ status, children }: { status: keyof typeof tokens.status; children?: React.ReactNode }) {
  const s = tokens.status[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.text, borderRadius: tokens.radius.badge, letterSpacing: "0.04em" }}
    >
      {children ?? s.label}
    </span>
  );
}
