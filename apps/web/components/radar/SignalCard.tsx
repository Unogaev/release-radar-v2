"use client";

import { useLanguage } from "@/lib/i18n";
import type { DerivedSignal } from "@/lib/radar/types";
import {
  checkedLabel,
  countdownLabel,
  marginLabel,
  money,
  secondsUntil,
  signedMoney,
} from "@/lib/radar/format";
import {
  ActionRow,
  Countdown,
  Figure,
  ImageFrame,
  Ledger,
  MarketSnapshot,
  SaleForecast,
  MetaRow,
  StatusBadge,
  WhyBlock,
  type SignalAction,
} from "./parts";

export function SignalCard({
  signal,
  now,
  showWhy = true,
  onAction,
}: {
  signal: DerivedSignal;
  now: number | null;
  showWhy?: boolean;
  onAction: (id: string, action: SignalAction) => void;
}) {
  const { t, lang } = useLanguage();
  const left = now === null ? null : secondsUntil(signal.launchAt, now);
  const hasRefOrSku = signal.reference !== "—" || signal.sku !== "—";
  const isLiveConfirmed = signal.status === "buy" && signal.ctaConfirmed;
  const rawCountdown = left === null ? "—" : countdownLabel(left);
  const countdown = rawCountdown === "LIVE" && !isLiveConfirmed ? t("countdown_started") : rawCountdown;
  const why = lang === "en" ? signal.whyEn : signal.why;
  const factors = lang === "en" ? signal.factorsEn : signal.factors;

  return (
    <article className="flex flex-col self-start overflow-hidden rounded-[24px] border border-white/10 bg-rr-surface shadow-[0_24px_70px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-rr-accent/25 hover:bg-rr-surface-hi">
      <ImageFrame hint={signal.imageHint} src={signal.imageUrl ?? null} className="h-[210px] sm:h-[290px]">
        <div className="absolute left-[18px] top-[18px]">
          <StatusBadge status={signal.status} />
        </div>
        <div className="absolute right-[18px] top-[18px] bg-[rgba(11,10,9,0.62)] px-2.5 py-[5px]">
          <Countdown secondsLeft={left} label={countdown} />
        </div>
        {signal.imageSourceUrl && <a href={signal.imageSourceUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 font-rr-mono text-[8px] uppercase tracking-[0.12em] text-white/65">official image ↗</a>}
      </ImageFrame>

      <div className="flex flex-1 flex-col gap-[18px] px-6 pb-6 pt-[22px]">
        <div>
          <div className="mb-[9px] font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-muted">
            {signal.brand}
          </div>
          <h2 className="text-pretty font-rr-editorial text-[27px] font-semibold sm:text-[34px] leading-[1] tracking-[-0.012em]">
            {signal.model}
          </h2>
          {hasRefOrSku && (
            <div className="mt-[9px] font-rr-mono text-[10.5px] text-rr-stencil">
              {signal.reference !== "—" && `${t("ref_sku_ref")} ${signal.reference}`}
              {signal.reference !== "—" && signal.sku !== "—" && " · "}
              {signal.sku !== "—" && `${t("ref_sku_sku")} ${signal.sku}`}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-rr-accent/20 bg-rr-accent-soft px-2.5 py-1 font-rr-mono text-[8.5px] uppercase tracking-[0.12em] text-rr-accent">
              {signal.store}
            </span>
            {signal.ctaConfirmed && (
              <span className="rounded-full border border-rr-accent/20 bg-rr-accent-soft px-2.5 py-1 font-rr-mono text-[8.5px] uppercase tracking-[0.12em] text-rr-accent">
                CTA verified
              </span>
            )}
            {signal.completedSalesCount > 0 && (
              <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 font-rr-mono text-[8.5px] uppercase tracking-[0.12em] text-rr-text-dim">
                {signal.completedSalesCount} completed
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-[26px] gap-y-4">
          <Figure label={t("label_net_profit")}>
            <div className="font-rr-display text-[28px] leading-none whitespace-nowrap text-rr-accent">
              {signedMoney(signal.profit)}
            </div>
          </Figure>
          <Figure label={t("label_margin")}>
            <div className="pb-[3px] text-[17px] font-medium whitespace-nowrap text-rr-text">
              {marginLabel(signal.marginPct)}
            </div>
          </Figure>
        </div>

        <Ledger
          items={[
            { label: "Retail", value: money(signal.retail) },
            { label: lang === "ru" ? "С налогом 7%" : "With 7% tax", value: money(signal.cost) },
            { label: lang === "ru" ? "Медиана продаж" : "Sold median", value: money(signal.expectedResale) },
          ]}
        />

        <MarketSnapshot signal={signal} compact />
        <SaleForecast signal={signal} />

        <MetaRow
          store={signal.store}
          stock={signal.stock}
          checked={now === null ? t("checked_recently") : checkedLabel(signal.checkedAt, now, lang)}
        />

        {showWhy && <WhyBlock why={why} factors={factors} />}

        <ActionRow
          onAction={(a) => onAction(signal.id, a)}
          primaryHref={signal.primaryUrl}
          status={signal.status}
          ctaConfirmed={signal.ctaConfirmed}
        />
      </div>
    </article>
  );
}
