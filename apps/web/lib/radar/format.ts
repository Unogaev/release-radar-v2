export function money(value: number | null): string {
  if (value === null) return "—";
  return "€" + Math.round(value).toLocaleString("ru-RU").replace(/ /g, " ");
}

export function signedMoney(value: number | null): string {
  if (value === null) return "—";
  return (value >= 0 ? "+" : "−") + money(Math.abs(value));
}

export function marginLabel(pct: number | null): string {
  if (pct === null) return "—";
  return pct.toFixed(1).replace(".", ",") + "%";
}

export function countdownLabel(secondsLeft: number): string {
  if (secondsLeft <= 0) return "LIVE";
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function checkedLabel(checkedAt: string, now: number, lang: "en" | "ru" = "ru"): string {
  const min = Math.max(0, Math.round((now - new Date(checkedAt).getTime()) / 60000));
  if (lang === "en") {
    if (min < 1) return "checked just now";
    return `checked ${min} min ago`;
  }
  if (min < 1) return "проверено только что";
  return `проверено ${min} мин назад`;
}

export function clockLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function secondsUntil(iso: string, now: number): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
}
