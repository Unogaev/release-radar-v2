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
  const { t } = useLanguage();
  const left = now === null ? null : secondsUntil(signal.launchAt, now);

  return (
    <article className="flex flex-col bg-rr-surface transition-colors hover:bg-rr-surface-hi">
      <ImageFrame hint={signal.imageHint} src={signal.imageUrl ?? null} className="h-[290px]">
        <div className="absolute left-[18px] top-[18px]">
          <StatusBadge status={signal.status} />
        </div>
        <div className="absolute right-[18px] top-[18px] bg-[rgba(11,10,9,0.62)] px-2.5 py-[5px]">
          <Countdown secondsLeft={left} label={left === null ? "—" : countdownLabel(left)} />
        </div>
      </ImageFrame>

      <div className="flex flex-1 flex-col gap-[18px] px-6 pb-6 pt-[22px]">
        <div>
          <div className="mb-[9px] font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-muted">
            {signal.brand}
          </div>
          <h2 className="text-pretty font-rr-display text-[27px] leading-[1.1] tracking-[-0.008em]">
            {signal.model}
          </h2>
          <div className="mt-[9px] font-rr-mono text-[10.5px] text-rr-stencil">
            REF {signal.reference} · SKU {signal.sku}
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
            { label: t("label_cost"), value: money(signal.cost) },
            { label: t("label_resale"), value: money(signal.expectedResale) },
          ]}
        />

        <MetaRow
          store={signal.store}
          stock={signal.stock}
          checked={now === null ? t("checked_recently") : checkedLabel(signal.checkedAt, now)}
        />

        {showWhy && <WhyBlock why={signal.why} factors={signal.factors} />}

        <ActionRow onAction={(a) => onAction(signal.id, a)} primaryHref={signal.primaryUrl} />
      </div>
    </article>
  );
}
