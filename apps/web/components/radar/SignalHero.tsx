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
  KindBadge,
  Ledger,
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

  return (
    <div
      className="grid bg-[linear-gradient(115deg,#ffffff_0%,#f8f7f5_55%,#f3f2ef_100%)]"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 470px), 1fr))" }}
    >
      <ImageFrame hint={signal.imageHint} src={signal.imageUrl ?? null} className="min-h-[300px] sm:min-h-[540px] p-6">
        <div className="absolute left-6 top-6 flex items-center gap-[7px]">
          <StatusBadge status={signal.status} />
          <KindBadge>{t(kindKey)}</KindBadge>
        </div>
      </ImageFrame>

      <div className="flex flex-col gap-6 px-5 sm:px-10 pb-[20px] sm:pb-[30px] pt-[24px] sm:pt-[38px]">
        <div>
          <div className="mb-3 font-rr-mono text-[10.5px] uppercase tracking-[0.24em] text-rr-muted">
            {signal.brand}
          </div>
          <h1 className="text-pretty font-rr-display text-[28px] sm:text-[44px] leading-[1.04] tracking-[-0.012em]">
            {signal.model}
          </h1>
          <div className="mt-[11px] font-rr-mono text-[11.5px] text-rr-stencil">
            REF {signal.reference} · SKU {signal.sku}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Figure label={t("label_net_profit")}>
            <div className="font-rr-display text-[28px] sm:text-[40px] leading-none whitespace-nowrap text-rr-accent">
              {signedMoney(signal.profit)}
            </div>
          </Figure>
          <Figure label={t("label_margin")}>
            <div className="pb-1.5 text-[22px] font-medium whitespace-nowrap text-rr-text">
              {marginLabel(signal.marginPct)}
            </div>
          </Figure>
          <div className="ml-auto pb-2">
            <Figure label={t("label_time_to_launch")} align="right">
              <Countdown
                size="lg"
                secondsLeft={left}
                label={left === null ? "—" : countdownLabel(left)}
              />
            </Figure>
          </div>
        </div>

        <Ledger
          size="lg"
          items={[
            { label: "Retail", value: money(signal.retail) },
            { label: t("label_cost"), value: money(signal.cost) },
            { label: t("label_resale"), value: money(signal.expectedResale) },
          ]}
        />

        <MetaRow
          store={signal.store}
          stock={signal.stock}
          checked={now === null ? t("checked_recently") : checkedLabel(signal.checkedAt, now, lang)}
        />

        <WhyBlock variant="hero" why={signal.why} factors={signal.factors} />

        <ActionRow variant="hero" onAction={(a) => onAction(signal.id, a)} primaryHref={signal.primaryUrl} />
      </div>
    </div>
  );
}
