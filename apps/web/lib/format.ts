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
  BUY_NOW: "bg-status-buy",
  APPLY_NOW: "bg-status-apply",
  APPLY_RESERVE: "bg-status-apply",
  RESERVE_PICKUP: "bg-status-apply",
  PREPARE: "bg-status-prepare",
  CLIENT_FIRST: "bg-status-watch",
  SOURCE_NOW: "bg-status-watch",
  CONTACT_DEALER: "bg-status-watch",
  VERIFY_IN_STORE: "bg-status-verify",
  WATCH_RESTOCK: "bg-status-watch",
  WATCH: "bg-status-watch",
  VERIFY: "bg-status-verify",
  SKIP: "bg-status-skip",
};

export function simpleLabel(status: string): string {
  return SIMPLE_LABEL_MAP[status as DecisionStatus] ?? status;
}
