// apps/web/lib/format.ts
import { DecisionStatus, SIMPLE_LABEL_MAP } from "@domain/decision/types";

export function formatMoneyMinor(amountMinor: number, currency = "USD"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatDateEt(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    new Intl.DateTimeFormat("ru-RU", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d) + " ET"
  );
}

export const STATUS_COLOR: Record<string, string> = {
  BUY_NOW: "bg-rr-buy text-white",
  APPLY_NOW: "bg-rr-apply text-white",
  APPLY_RESERVE: "bg-rr-apply text-white",
  RESERVE_PICKUP: "bg-rr-apply text-white",
  PREPARE: "bg-rr-prepare text-white",
  CLIENT_FIRST: "bg-rr-watch-bg text-rr-watch",
  SOURCE_NOW: "bg-rr-watch-bg text-rr-watch",
  CONTACT_DEALER: "bg-rr-watch-bg text-rr-watch",
  VERIFY_IN_STORE: "bg-rr-watch-bg text-rr-watch",
  WATCH_RESTOCK: "bg-rr-watch-bg text-rr-watch",
  WATCH: "bg-rr-watch-bg text-rr-watch",
  VERIFY: "bg-rr-watch-bg text-rr-watch",
  SKIP: "bg-rr-frame text-rr-muted",
};

export function simpleLabel(status: string): string {
  return SIMPLE_LABEL_MAP[status as DecisionStatus] ?? status;
}
