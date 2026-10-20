"use client";
import { useEffect, useState } from "react";
export function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return "Started";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) {
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  const hours = Math.floor(diff / 3600000);
  if (hours < 48) {
    const m = Math.floor((diff % 3600000) / 60000);
    return `in ${hours}h ${m}m`;
  }
  const days = Math.floor(diff / 86400000);
  const date = new Date(targetMs).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  const time = new Date(targetMs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: "America/New_York" });
  return `in ${days}d · ${date}, ${time}`;
}
export function Countdown({ targetAt }: { targetAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(targetAt).getTime();
  const urgent = target - now < 3600000 && target - now > 0;
  return (
    <span className="tabular-nums text-[12px] font-semibold" style={{ color: urgent ? "#dc2626" : "#1a1a1a" }}>
      {formatCountdown(target, now)}
    </span>
  );
}
