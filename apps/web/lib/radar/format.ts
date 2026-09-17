export function money(value: number): string {
  return "€" + Math.round(value).toLocaleString("ru-RU").replace(/\u00a0/g, "\u2009");
}

export function signedMoney(value: number): string {
  return (value >= 0 ? "+" : "−") + money(Math.abs(value));
}

export function marginLabel(pct: number): string {
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

export function checkedLabel(checkedAt: string, now: number): string {
  const min = Math.max(0, Math.round((now - new Date(checkedAt).getTime()) / 60000));
  if (min < 1) return "проверено только что";
  return `проверено ${min} мин назад`;
}

export function clockLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function secondsUntil(iso: string, now: number): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
}
