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
  const ms = Math.max(0, now - new Date(checkedAt).getTime());
  const min = Math.round(ms / 60000);
  const hours = Math.floor(min / 60);
  const days = Math.floor(hours / 24);
  const date = new Date(checkedAt);

  if (lang === "en") {
    if (min < 1) return "checked just now";
    if (min < 60) return `checked ${min} min ago`;
    if (hours < 24) return `checked ${hours}h ago`;
    if (days < 7) return `checked ${days}d ago`;
    return `checked ${date.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
  }
  if (min < 1) return "проверено только что";
  if (min < 60) return `проверено ${min} мин назад`;
  if (hours < 24) return `проверено ${hours} ч назад`;
  if (days < 7) return `проверено ${days} дн назад`;
  return `проверено ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
}

export function isStaleCheck(checkedAt: string, now: number, thresholdMinutes = 15): boolean {
  return now - new Date(checkedAt).getTime() > thresholdMinutes * 60000;
}

export function clockLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function secondsUntil(iso: string, now: number): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
}
