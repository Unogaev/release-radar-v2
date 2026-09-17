"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell, RefreshCw } from "lucide-react";

interface CollectorStats {
  total: number;
  active: number;
  lastCheckedAt: string | null;
}

export function TopBar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [scanning, setScanning] = useState(false);

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
    health === "LIVE" ? "text-lime bg-lime/10 border-lime/30" : health === "DEGRADED" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-zinc-500 bg-zinc-700/10 border-zinc-600/30";

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
    <div className="border-b border-graphite-700 bg-graphite-950/95 backdrop-blur px-4 md:px-6 py-3 flex items-center gap-4">
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-graphite-900 border border-graphite-700 rounded-lg px-3 py-1.5">
        <Search size={14} className="text-graphite-500" />
        <input
          type="text"
          placeholder="Поиск по товару, SKU, бренду, магазину..."
          className="bg-transparent text-sm text-graphite-200 placeholder:text-graphite-500 outline-none flex-1"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold tracking-wide ${healthColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {health}
        </span>
        <span className="hidden lg:inline text-[11px] text-graphite-500 tabular-nums">
          {stats?.lastCheckedAt
            ? `Скан: ${new Date(stats.lastCheckedAt).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`
            : "Скан ещё не запускался"}
        </span>
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-graphite-700 text-graphite-200 text-xs font-medium hover:border-lime/40 hover:text-lime transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={scanning ? "animate-spin" : ""} />
          Run scan
        </button>
        <button className="p-2 rounded-lg border border-graphite-700 text-graphite-400 hover:text-graphite-100 transition-colors">
          <Bell size={15} />
        </button>
      </div>
    </div>
  );
}
