export type NotificationStage =
  | "first_detection"
  | "t_minus_72h"
  | "t_minus_24h"
  | "t_minus_3h"
  | "t_minus_1h"
  | "opening_hour"
  | "unexpected_restock"
  | "price_status_change";

const STAGE_HEADLINE: Record<NotificationStage, string> = {
  first_detection: "New signal detected",
  t_minus_72h: "Launch in 72 hours",
  t_minus_24h: "Launch in 24 hours",
  t_minus_3h: "Launch in 3 hours",
  t_minus_1h: "Launch in 1 hour",
  opening_hour: "Launch window is open",
  unexpected_restock: "Unexpected restock",
  price_status_change: "Price or status changed",
};

export interface NotificationContent {
  stage: NotificationStage;
  brand: string;
  model: string;
  sku?: string | null;
  status: string;
  priceUsd?: number | null;
  store?: string | null;
  etTime?: string | null;
  primaryUrl?: string | null;
}

export function formatNotification(input: NotificationContent): { title: string; body: string } {
  const headline = STAGE_HEADLINE[input.stage];
  const title = headline + ": " + input.brand + " " + input.model;

  const lines: string[] = [];
  lines.push("Status: " + input.status);
  if (input.sku) lines.push("SKU: " + input.sku);
  lines.push("Price: " + (input.priceUsd != null ? "$" + input.priceUsd.toFixed(2) : "unknown"));
  lines.push("Store: " + (input.store ?? "unknown"));
  if (input.etTime) lines.push("ET time: " + input.etTime);
  if (input.primaryUrl) lines.push("Link: " + input.primaryUrl);

  return { title, body: lines.join("\n") };
}
