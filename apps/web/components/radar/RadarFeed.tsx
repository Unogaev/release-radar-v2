"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { FeedPayload, RadarCategory } from "@/lib/radar/types";
import { derive, sortSignals, totalProfit } from "@/lib/radar/derive";
import { clockLabel, signedMoney } from "@/lib/radar/format";
import { useNow } from "./useCountdown";
import { SignalHero } from "./SignalHero";
import { SignalCard } from "./SignalCard";
import { ServiceDrawer } from "./ServiceDrawer";
import { FeedEmpty, FeedError, StaleBanner } from "./states";
import type { SignalAction } from "./parts";

const FILTER_IDS = [
  { id: "now" as const, key: "filter_now" as const },
  { id: "soon" as const, key: "filter_soon" as const },
  { id: "restock" as const, key: "filter_restock" as const },
  { id: "trend" as const, key: "filter_trend" as const },
  { id: "clearance" as const, key: "filter_clearance" as const },
  { id: "watches" as const, key: "filter_watches" as const },
  { id: "tech" as const, key: "filter_tech" as const },
  { id: "sneakers" as const, key: "filter_sneakers" as const },
  { id: "cars" as const, key: "filter_cars" as const },
];

export function RadarFeed({
  payload,
  error,
  isStale = false,
  isPending = false,
  onRetry,
  onAction,
}: {
  payload?: FeedPayload;
  error?: string;
  isStale?: boolean;
  isPending?: boolean;
  onRetry?: () => void;
  onAction?: (id: string, action: SignalAction) => void;
}) {
  const [filter, setFilter] = useState<RadarCategory>("now");
  const now = useNow();
  const { lang, setLang, t } = useLanguage();

  const signals = payload?.signals ?? [];

  const visible = useMemo(
    () => sortSignals(signals.filter((s) => s.categories.includes(filter)).map(derive)),
    [signals, filter]
  );

  const handleAction = (id: string, action: SignalAction) => onAction?.(id, action);

  const FILTERS = FILTER_IDS.map((f) => ({ id: f.id, label: t(f.key) }));
  const activeLabel = FILTERS.find((f) => f.id === filter)?.label ?? "";
  const [hero, ...rest] = visible;

  return (
    <div className="min-h-screen bg-rr-bg font-rr-sans text-rr-text">
      <header className="sticky top-0 z-40 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-5 bg-[linear-gradient(#f4f3f1_72%,rgba(244,243,241,0.86)_92%,rgba(244,243,241,0))] px-4 sm:px-11 pb-[18px] pt-6">
        <div className="flex items-baseline gap-5">
          <div className="font-rr-display text-[25px] tracking-[0.01em]">Release Radar</div>
          <div className="font-rr-mono text-[10.5px] uppercase tracking-[0.18em] text-rr-faint">
            {signals.length} {t("active_signals_suffix")}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint transition-colors hover:text-rr-text"
          >
            {t("nav_menu")}
          </Link>
          <Link
            href="/now/add"
            className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-accent transition-colors hover:text-rr-accent-hi"
          >
            + {t("add_signal")}
          </Link>
          <div className="flex items-center gap-1 rounded-full bg-[rgba(22,21,20,0.05)] p-0.5">
            <button
              type="button"
              onClick={() => setLang("ru")}
              className={`rounded-full px-2.5 py-1 font-rr-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                lang === "ru" ? "bg-rr-text text-[#faf9f7]" : "text-rr-faint hover:text-rr-text"
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 font-rr-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                lang === "en" ? "bg-rr-text text-[#faf9f7]" : "text-rr-faint hover:text-rr-text"
              }`}
            >
              EN
            </button>
          </div>
          <span className="font-rr-mono text-[10.5px] uppercase tracking-[0.16em] text-rr-faint">
            {t("feed_profit")}
          </span>
          <span className="font-rr-display text-xl text-rr-accent">
            {signedMoney(totalProfit(visible))}
          </span>
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#161514] font-rr-mono text-[10px] tracking-[0.08em] text-[#efece7]">
            AK
          </span>
        </div>
      </header>

      <nav className="flex items-center gap-2 overflow-x-auto px-4 sm:px-11 pb-[34px] pt-1.5">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`whitespace-nowrap rounded-full px-[17px] py-[9px] text-[12.5px] tracking-[0.02em] transition-colors ${
                active
                  ? "bg-rr-text text-[#faf9f7]"
                  : "bg-[rgba(22,21,20,0.04)] text-[#8f8c86] hover:bg-[rgba(22,21,20,0.08)] hover:text-rr-text"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </nav>

      {isStale && payload && <StaleBanner at={clockLabel(payload.scannedAt)} onRefresh={onRetry} />}

      {error && !payload ? (
        <FeedError reason={error} onRetry={onRetry} />
      ) : visible.length === 0 ? (
        <FeedEmpty
          variant={signals.length === 0 ? "all" : "filter"}
          filterLabel={activeLabel}
          nextScanLabel={payload?.nextScanAt ? clockLabel(payload.nextScanAt) : undefined}
          onReset={() => setFilter("now")}
        />
      ) : (
        <div className={isPending ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <div className="px-4 sm:px-11 pb-5">
            <SignalHero signal={hero} now={now} onAction={handleAction} />
          </div>

          <div className="flex items-baseline justify-between px-4 sm:px-11 pb-4 pt-[30px]">
            <div className="font-rr-mono text-[10px] uppercase tracking-[0.24em] text-rr-faint">
              {activeLabel} · {t("rest_of_feed")}
            </div>
            <div className="font-rr-mono text-[10px] uppercase tracking-[0.16em] text-[#b3b0aa]">
              {rest.length} {t("signals_suffix")}
            </div>
          </div>

          <div
            className="grid gap-[26px] px-4 sm:px-11"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 430px), 1fr))" }}
          >
            {rest.map((s) => (
              <SignalCard key={s.id} signal={s} now={now} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {payload && <ServiceDrawer sources={payload.sources} logs={payload.logs} />}
    </div>
  );
}
