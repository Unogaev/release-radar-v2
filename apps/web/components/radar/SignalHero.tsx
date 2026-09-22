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
import { formatDateEt } from "@/lib/format";
import {
  ActionRow,
  Countdown,
  Figure,
  ImageFrame,
  KindBadge,
  Ledger,
  MarketSnapshot,
  SaleForecast,
  MetaRow,
  StatusBadge,
  WhyBlock,
  type SignalAction,
} from "./parts";

const KIND_LABEL_KEYS: Record<string, "kind_now" | "kind_soon" | "kind_verify" | "kind_client"> = {
  now: "kind_now",
  soon: "kind_soon",
  verify: "kind_verify",
  client: "kind_client",
};

export function SignalHero({
  signal,
  now,
  onAction,
}: {
  signal: DerivedSignal;
  now: number | null;
  onAction: (id: string, action: SignalAction) => void;
}) {
  const { t, lang } = useLanguage();
  const left = now === null ? null : secondsUntil(signal.launchAt, now);
  const kindKey = KIND_LABEL_KEYS[signal.kindLabel] ?? "kind_now";
  const hasRefOrSku = signal.reference !== "—" || signal.sku !== "—";
  const isLiveConfirmed = signal.status === "buy" && signal.ctaConfirmed;
  const rawCountdown = left === null ? "—" : countdownLabel(left);
  const countdown = rawCountdown === "LIVE" && !isLiveConfirmed ? t("countdown_started") : rawCountdown;
  const why = lang === "en" ? signal.whyEn : signal.why;
  const factors = lang === "en" ? signal.factorsEn : signal.factors;

  return (
    <div
      className="grid overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_82%_8%,rgba(54,217,138,.11),transparent_34%),linear-gradient(115deg,#151918_0%,#101312_55%,#090b0a_100%)] shadow-[0_30px_100px_rgba(0,0,0,.32)]"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 470px), 1fr))" }}
    >
      <ImageFrame hint={signal.imageHint} src={signal.imageUrl ?? null} href={signal.primaryUrl ?? signal.imageSourceUrl ?? null} className="min-h-[280px] sm:min-h-[420px] p-6">
        <div className="absolute left-6 top-6 flex items-center gap-[7px]">
          <StatusBadge status={signal.status} />
          <KindBadge>{t(kindKey)}</KindBadge>
        </div>
        {signal.imageSourceUrl && <a href={signal.imageSourceUrl} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-black/60 px-2.5 py-1.5 font-rr-mono text-[8px] uppercase tracking-[0.14em] text-white/65">official image ↗</a>}
      </ImageFrame>

      <div className="flex flex-col gap-5 px-5 sm:px-10 pb-[18px] sm:pb-[26px] pt-[22px] sm:pt-[30px]">
        <div>
          <div className="mb-3 font-rr-mono text-[10.5px] uppercase tracking-[0.24em] text-rr-muted">
            {signal.brand}
          </div>
          <h1 className="text-pretty font-rr-editorial text-[36px] font-semibold sm:text-[52px] leading-[0.96] tracking-[-0.02em]">
            {signal.model}
          </h1>
          {hasRefOrSku && (
            <div className="mt-[11px] font-rr-mono text-[11.5px] text-rr-stencil">
              {signal.reference !== "—" && `${t("ref_sku_ref")} ${signal.reference}`}
              {signal.reference !== "—" && signal.sku !== "—" && " · "}
              {signal.sku !== "—" && `${t("ref_sku_sku")} ${signal.sku}`}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-rr-accent/25 bg-rr-accent-soft px-3 py-1.5 font-rr-mono text-[9px] uppercase tracking-[0.13em] text-rr-accent">
              {signal.store}
            </span>
            {signal.ctaConfirmed && (
              <span className="rounded-full border border-rr-accent/25 bg-rr-accent-soft px-3 py-1.5 font-rr-mono text-[9px] uppercase tracking-[0.13em] text-rr-accent">
                CTA verified
              </span>
            )}
            {signal.completedSalesCount > 0 && (
              <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-rr-mono text-[9px] uppercase tracking-[0.13em] text-rr-text-dim">
                {signal.completedSalesCount} completed sales
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Figure label={t("label_net_profit")}>
            <div className="font-rr-display text-[28px] sm:text-[36px] leading-none whitespace-nowrap text-rr-accent">
              {signedMoney(signal.profit)}
            </div>
          </Figure>
          <Figure label={t("label_margin")}>
            <div className="pb-1.5 text-[22px] font-medium whitespace-nowrap text-rr-text">
              {marginLabel(signal.marginPct)}
            </div>
          </Figure>
          <div className="ml-auto pb-2 text-right">
            <Figure label={t("label_time_to_launch")} align="right">
              <Countdown size="lg" secondsLeft={left} label={countdown} />
            </Figure>
            <div className="mt-1 font-rr-mono text-[10px] text-rr-faint whitespace-nowrap">
              {formatDateEt(signal.launchAt)}
            </div>
          </div>
        </div>

        <Ledger
          size="lg"
          items={[
            { label: "Retail", value: money(signal.retail) },
            { label: lang === "ru" ? "С налогом Miami" : "Miami taxed", value: money(signal.cost) },
            { label: lang === "ru" ? "Медиана продаж" : "Sold median", value: money(signal.expectedResale) },
          ]}
        />

        <MarketSnapshot signal={signal} />
        <SaleForecast signal={signal} />

        <MetaRow
          store={signal.store}
          stock={signal.stock}
          checked={now === null ? t("checked_recently") : checkedLabel(signal.checkedAt, now, lang)}
        />

        <WhyBlock variant="hero" why={why} factors={factors} />

        <ActionRow
          variant="hero"
          status={signal.status}
          ctaConfirmed={signal.ctaConfirmed}
          onAction={(a) => onAction(signal.id, a)}
          primaryHref={signal.primaryUrl}
        />
      </div>
    </div>
  );
}
