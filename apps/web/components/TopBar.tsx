"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell, RefreshCw, Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface CollectorStats {
  total: number;
  active: number;
  lastCheckedAt: string | null;
}

export function TopBar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [scanning, setScanning] = useState(false);
  const { lang, setLang, market, setMarket, marketMeta, t } = useLanguage();

  useEffect(() => {
    fetch("/api/stats/collectors")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (pathname === "/login") return null;

  const health: "LIVE" | "DEGRADED" | "OFFLINE" =
    !stats || stats.total === 0 ? "OFFLINE" : stats.active === stats.total ? "LIVE" : "DEGRADED";

  const healthColor =
    health === "LIVE"
      ? "text-rr-accent bg-rr-accent-soft border-rr-frame"
      : health === "DEGRADED"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-zinc-500 bg-zinc-700/10 border-zinc-600/30";

  async function runScan() {
    setScanning(true);
    try {
      await fetch("/api/cron/collect");
      const r = await fetch("/api/stats/collectors");
      setStats(await r.json());
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="border-b border-rr-frame bg-rr-bg/95 backdrop-blur px-4 md:px-6 py-3 flex items-center gap-4">
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-rr-surface border border-rr-frame rounded-lg px-3 py-1.5">
        <Search size={14} className="text-rr-muted" />
        <input
          type="text"
          placeholder={t("search_placeholder")}
          className="bg-transparent text-sm text-rr-text placeholder:text-rr-muted outline-none flex-1"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold tracking-wide ${healthColor}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {health}
        </span>
        <span className="hidden lg:inline text-[11px] text-rr-muted tabular-nums">
          {stats?.lastCheckedAt
            ? `${t("scan_at")}${new Date(stats.lastCheckedAt).toLocaleString(
                lang === "ar" ? "ar-AE" : lang === "ru" ? "ru-RU" : "en-US",
                { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", timeZone: marketMeta.timeZone }
              )}`
            : t("scan_never")}
        </span>
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rr-frame text-rr-text text-xs font-medium hover:border-rr-accent/40 hover:text-rr-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={scanning ? "animate-spin" : ""} />
          {t("run_scan")}
        </button>
        <button className="p-2 rounded-lg border border-rr-frame text-rr-text-dim hover:text-rr-text transition-colors">
          <Bell size={15} />
        </button>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-rr-frame px-2 py-1 text-xs text-rr-text-dim">
          <Languages size={13} />
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="bg-transparent font-semibold outline-none">
            <option value="en">EN</option><option value="ru">RU</option><option value="ar">العربية</option>
          </select>
        </label>
        <select aria-label="Market" value={market} onChange={(e) => setMarket(e.target.value as typeof market)} className="rounded-lg border border-rr-frame bg-rr-bg px-2 py-1.5 text-xs font-semibold text-rr-text-dim outline-none">
          <option value="us">USA · USD</option><option value="ae">UAE · AED</option><option value="ru">Russia · RUB</option>
        </select>
      </div>
    </div>
  );
}
