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
  first_detection: "Новый сильный сигнал",
  t_minus_72h: "До старта около 72 часов",
  t_minus_24h: "До старта около 24 часов",
  t_minus_3h: "До старта около 3 часов",
  t_minus_1h: "До старта около 1 часа",
  opening_hour: "Время старта — проверьте кнопку покупки",
  unexpected_restock: "Неожиданный ресток",
  price_status_change: "Изменилась цена или доступность",
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
  const title = headline + " · " + input.brand + " " + input.model;

  const lines: string[] = [];
  lines.push("Действие: " + input.status);
  if (input.sku) lines.push("SKU / Ref: " + input.sku);
  lines.push("Цена: " + (input.priceUsd != null ? "$" + input.priceUsd.toFixed(2) : "уточняется"));
  lines.push("Магазин: " + (input.store ?? "уточняется"));
  if (input.etTime) lines.push("Время по Майами: " + input.etTime);

  return { title, body: lines.join("\n") };
}
