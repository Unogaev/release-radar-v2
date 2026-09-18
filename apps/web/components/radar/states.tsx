"use client";

import { useLanguage } from "@/lib/i18n";

export function FeedSkeleton() {
  return (
    <div className="animate-pulse px-11">
      <div className="grid bg-[#f1efec]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 470px), 1fr))" }}>
        <div className="min-h-[540px] bg-rr-frame" />
        <div className="flex flex-col gap-6 px-10 pb-[30px] pt-[38px]">
          <div className="h-3 w-24 bg-rr-well" />
          <div className="h-10 w-4/5 bg-rr-well" />
          <div className="h-10 w-1/2 bg-rr-well" />
          <div className="grid grid-cols-3 gap-px bg-rr-hair">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[66px] bg-rr-surface" />
            ))}
          </div>
          <div className="h-20 bg-rr-well" />
          <div className="h-11 w-2/3 bg-rr-well" />
        </div>
      </div>

      <div
        className="mt-11 grid gap-[26px]"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 430px), 1fr))" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-rr-surface">
            <div className="h-[290px] bg-rr-frame" />
            <div className="flex flex-col gap-4 px-6 pb-6 pt-[22px]">
              <div className="h-2.5 w-20 bg-rr-well" />
              <div className="h-7 w-3/4 bg-rr-well" />
              <div className="h-7 w-1/3 bg-rr-well" />
              <div className="h-[52px] bg-rr-well" />
              <div className="h-10 w-3/5 bg-rr-well" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedEmpty({
  variant = "filter",
  filterLabel,
  nextScanLabel,
  onReset,
}: {
  variant?: "filter" | "all";
  filterLabel?: string;
  nextScanLabel?: string;
  onReset?: () => void;
}) {
  const { t } = useLanguage();
  const filtered = variant === "filter";
  return (
    <div className="mx-11 flex flex-col items-start gap-5 bg-rr-surface px-10 py-16">
      <div className="font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-faint">
        {filtered ? `${t("empty_category_prefix")}${filterLabel}${t("empty_category_suffix")}` : t("empty_scan_done")}
      </div>
      <h2 className="max-w-[26ch] text-pretty font-rr-display text-[32px] leading-[1.12]">
        {filtered ? t("empty_title_filtered") : t("empty_title_all")}
      </h2>
      <p className="max-w-[46ch] text-pretty text-[13px] leading-relaxed text-rr-text-dim">
        {filtered ? t("empty_desc_filtered") : t("empty_desc_all")}
        {nextScanLabel ? `${t("empty_next_scan_prefix")}${nextScanLabel}.` : ""}
      </p>
      {filtered && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="bg-rr-well px-5 py-3 text-[12.5px] text-rr-text transition-colors hover:bg-[rgba(22,21,20,0.09)]"
        >
          {t("empty_reset_button")}
        </button>
      )}
    </div>
  );
}

export function FeedError({
  reason,
  onRetry,
}: {
  reason?: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mx-11 flex flex-col items-start gap-5 bg-rr-surface px-10 py-16">
      <div className="font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-warn">
        {t("error_unavailable")}
      </div>
      <h2 className="max-w-[26ch] text-pretty font-rr-display text-[32px] leading-[1.12]">
        {t("error_title")}
      </h2>
      <p className="max-w-[46ch] text-pretty text-[13px] leading-relaxed text-rr-text-dim">
        {reason ?? t("error_default_reason")} {t("error_desc_suffix")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#faf9f7] transition-colors hover:bg-rr-accent-hi"
        >
          {t("error_retry")}
        </button>
      )}
    </div>
  );
}

export function StaleBanner({ at, onRefresh }: { at: string; onRefresh?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mx-11 mb-6 flex flex-wrap items-center gap-4 border border-[rgba(138,106,74,0.32)] bg-[rgba(138,106,74,0.06)] px-5 py-3.5">
      <span className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-warn">
        {t("stale_data_from_prefix")}{at}
      </span>
      <span className="text-[12.5px] text-rr-text-dim">
        {t("stale_desc")}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="ml-auto font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-accent transition-colors hover:text-rr-accent-hi"
        >
          {t("stale_refresh")}
        </button>
      )}
    </div>
  );
}
