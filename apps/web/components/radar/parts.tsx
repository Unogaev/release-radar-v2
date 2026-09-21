"use client";

import type { ReactNode } from "react";
import type { DerivedSignal, SignalStatus } from "@/lib/radar/types";
import { useLanguage } from "@/lib/i18n";
import { money } from "@/lib/radar/format";

export const STATUS_STYLE: Record<SignalStatus, { label: string; className: string }> = {
  buy: { label: "BUY NOW", className: "bg-rr-buy text-white" },
  apply: { label: "APPLY NOW", className: "bg-rr-apply text-white" },
  prepare: { label: "PREPARE", className: "bg-rr-prepare text-white" },
  watch: { label: "VERIFY / WATCH", className: "bg-[rgba(255,255,255,0.94)] text-rr-watch border border-rr-watch" },
  client: { label: "CLIENT FIRST", className: "bg-rr-client-bg text-rr-client" },
};

export const MONO_LABEL =
  "font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-rr-muted";

export function StatusBadge({ status }: { status: SignalStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`rounded-full px-3 py-[7px] font-rr-mono text-[9.5px] uppercase tracking-[0.2em] ${s.className}`}>
      {s.label}
    </span>
  );
}

export function KindBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[rgba(11,10,9,0.6)] px-3 py-[7px] font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-[#f1eee8]">
      {children}
    </span>
  );
}

export function Countdown({
  label,
  secondsLeft,
  size = "sm",
}: {
  label: string;
  secondsLeft: number | null;
  size?: "sm" | "lg";
}) {
  const tone =
    secondsLeft === null
      ? "text-[#e5e2dc]"
      : secondsLeft <= 0
        ? "text-rr-accent"
        : secondsLeft < 900
          ? "text-rr-warn"
          : "text-[#e5e2dc]";
  return (
    <span
      className={`font-rr-mono tabular-nums tracking-[0.04em] whitespace-nowrap ${tone} ${
        size === "lg" ? "text-2xl" : "text-[15px]"
      }`}
    >
      {label}
    </span>
  );
}

export function Figure({
  label,
  children,
  align = "left",
}: {
  label: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className={`${MONO_LABEL} mb-[7px] whitespace-nowrap`}>{label}</div>
      {children}
    </div>
  );
}

export function Ledger({
  items,
  size = "sm",
}: {
  items: { label: string; value: string }[];
  size?: "sm" | "lg";
}) {
  return (
    <div className="grid grid-cols-1 gap-px bg-rr-hair sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={`bg-rr-surface ${size === "lg" ? "px-4 py-4" : "px-[13px] py-3"}`}>
          <div className="mb-[6px] font-rr-mono text-[9px] uppercase tracking-[0.16em] whitespace-nowrap text-rr-faint">
            {item.label}
          </div>
          <div className={`font-medium whitespace-nowrap ${size === "lg" ? "text-[17px]" : "text-sm"}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetaRow({
  store,
  stock,
  checked,
}: {
  store: string;
  stock: string;
  checked: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs text-rr-text-dim">
      <span className="font-medium text-rr-text">{store}</span>
      <span className="h-2.5 w-px bg-rr-hair" />
      <span>{stock}</span>
      <span className="h-2.5 w-px bg-rr-hair" />
      <span className="font-rr-mono text-[10.5px] text-rr-faint">{checked}</span>
    </div>
  );
}

const LIQUIDITY_LABEL = {
  ru: { hot: "высокая", active: "активная", thin: "низкая", unverified: "нет данных" },
  en: { hot: "high", active: "active", thin: "thin", unverified: "no data" },
};

export function MarketSnapshot({ signal, compact = false }: { signal: DerivedSignal; compact?: boolean }) {
  const { lang } = useLanguage();
  const copy = lang === "ru"
    ? { completed: "Продажи", asks: "Asks от", exit: "Выход для +20%", liquidity: "Ликвидность", samples: "сделок" }
    : { completed: "Completed", asks: "Asks from", exit: "Exit for +20%", liquidity: "Liquidity", samples: "sales" };
  const completedRange = signal.completedSalesCount
    ? `${money(signal.completedLow)}–${money(signal.completedHigh)}`
    : "—";

  return (
    <div className={`grid gap-px overflow-hidden border border-rr-hair bg-rr-hair ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      <div className="bg-rr-well px-3 py-3.5">
        <div className="font-rr-mono text-[8.5px] uppercase tracking-[0.16em] text-rr-faint">{copy.completed}</div>
        <div className="mt-1.5 text-sm font-semibold">{completedRange}</div>
        <div className="mt-1 text-[10px] text-rr-faint">{signal.completedSalesCount} {copy.samples}</div>
      </div>
      <div className="bg-rr-well px-3 py-3.5">
        <div className="font-rr-mono text-[8.5px] uppercase tracking-[0.16em] text-rr-faint">{copy.asks}</div>
        <div className="mt-1.5 text-sm font-semibold">{money(signal.askFloor)}</div>
        <div className="mt-1 text-[10px] text-rr-faint">{lang === "ru" ? "не продажа" : "not a sale"}</div>
      </div>
      {!compact && <>
        <div className="bg-rr-well px-3 py-3.5">
          <div className="font-rr-mono text-[8.5px] uppercase tracking-[0.16em] text-rr-faint">{copy.exit}</div>
          <div className="mt-1.5 text-sm font-semibold text-rr-accent">{money(signal.minExit20)}</div>
          <div className="mt-1 text-[10px] text-rr-faint">{signal.marketplaceFeePct}% fee + ${signal.shippingEstimate}</div>
        </div>
        <div className="bg-rr-well px-3 py-3.5">
          <div className="font-rr-mono text-[8.5px] uppercase tracking-[0.16em] text-rr-faint">{copy.liquidity}</div>
          <div className="mt-1.5 text-sm font-semibold">{LIQUIDITY_LABEL[lang][signal.liquidity]}</div>
          <div className="mt-1 text-[10px] text-rr-faint">30d completed</div>
        </div>
      </>}
    </div>
  );
}

export function WhyBlock({
  why,
  factors,
  variant = "card",
}: {
  why: string;
  factors: string[];
  variant?: "card" | "hero";
}) {
  const { t } = useLanguage();
  const hero = variant === "hero";
  return (
    <div
      className={
        hero
          ? "flex flex-col gap-[11px] bg-rr-accent-soft px-[18px] py-4"
          : "flex flex-col gap-[9px] border-t border-rr-hair pt-[15px]"
      }
    >
      {hero && (
        <div className="font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-rr-accent">
          {t("why_heading")}
        </div>
      )}
      <p className={`text-pretty leading-relaxed ${hero ? "text-[13px] text-rr-text-dim" : "text-[12.5px] text-rr-text-dim"}`}>
        {why}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {factors.map((f) => (
          <span
            key={f}
            className={`font-rr-mono tracking-[0.08em] ${
              hero
                ? "bg-rr-accent-chip px-[9px] py-[5px] text-[10px] text-rr-text"
                : "bg-rr-well px-2 py-[5px] text-[9.5px] text-rr-text-dim"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ImageFrame({
  hint,
  src,
  className,
  children,
}: {
  hint?: string;
  src?: string | null;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={`relative flex overflow-hidden bg-rr-frame p-[18px] self-start ${
        src ? "items-end" : "items-center justify-center"
      } ${className ?? ""}`}
      role={src ? "img" : undefined}
      aria-label={src ? hint : undefined}
      style={
        src
          ? {
              backgroundImage: `linear-gradient(to top, rgba(11,10,9,0.78), rgba(11,10,9,0.05) 55%), url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              backgroundImage:
                "repeating-linear-gradient(132deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 12px)",
            }
      }
    >
      {!src && (
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <span className="font-rr-mono text-[10px] uppercase tracking-[0.24em] text-rr-stencil">
            {t("photo_not_found")}
          </span>
          {hint && (
            <span className="max-w-[26ch] text-[11px] leading-snug text-rr-faint">{hint}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export type SignalAction = "buy" | "source" | "calendar" | "publish";

export function ActionRow({
  onAction,
  variant = "card",
  primaryHref,
  disabledActions = [],
  status,
  ctaConfirmed,
}: {
  onAction: (action: SignalAction) => void;
  variant?: "card" | "hero";
  /** Реальная ссылка для кнопки "Купить". Если нет — кнопка неактивна. */
  primaryHref?: string | null;
  disabledActions?: SignalAction[];
  status?: SignalStatus;
  /** Для status="buy": кнопка активна только если магазин подтвердил рабочий CTA. */
  ctaConfirmed?: boolean;
}) {
  const { t, lang } = useLanguage();
  const actionLabels: Record<SignalAction, { full: string; short: string }> = {
    buy: { full: t("action_buy"), short: t("action_buy") },
    source: { full: t("action_source_full"), short: t("action_source_short") },
    calendar: { full: t("action_calendar"), short: t("action_calendar") },
    publish: { full: t("action_publish_full"), short: t("action_publish_short") },
  };
  const hero = variant === "hero";
  // Publishing is intentionally hidden until a real destination and delivery
  // confirmation exist. Never render a control that only looks functional.
  const order: SignalAction[] = ["buy", "source", "calendar"];
  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-1">
      {order.map((action) => {
        const statusCta: Record<string, { ru: string; en: string }> = {
          buy: { ru: "Купить сейчас", en: "Buy now" },
          apply: { ru: "Подать заявку", en: "Apply now" },
          prepare: { ru: "Подготовиться", en: "Prepare" },
          watch: { ru: "Проверить", en: "Verify" },
          client: { ru: "Найти клиента", en: "Find client" },
        };
        const label =
          action === "buy" && status && statusCta[status]
            ? statusCta[status][lang === "en" ? "en" : "ru"]
            : hero
            ? actionLabels[action].full
            : actionLabels[action].short;
        const primary = action === "buy";
        const buyNotConfirmed = status === "buy" && ctaConfirmed === false;
        const disabled =
          disabledActions.includes(action) || (primary && (!primaryHref || buyNotConfirmed));
        const sizing = hero ? "px-[26px] py-[13px] text-[13px]" : "px-[22px] py-[11px] text-[12.5px]";
        const secondarySizing = hero ? "px-5 py-[13px] text-[13px]" : "px-[15px] py-[11px] text-[12.5px]";

        const className = primary
      ? `font-semibold transition-colors ${sizing} ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-transparent border border-rr-accent text-rr-accent"
            : "border border-rr-accent bg-rr-accent text-[#07130d] shadow-[0_0_34px_rgba(54,217,138,.14)] hover:bg-rr-accent-hi"
        }`
          : `border border-rr-hair transition-colors ${secondarySizing} ${
              disabled
                ? "opacity-40 cursor-not-allowed text-rr-faint"
                : "bg-rr-well text-rr-text hover:bg-[rgba(255,255,255,0.09)]"
            }`;

        if (primary && primaryHref && !disabled) {
          return (
            <a key={action} href={primaryHref} target="_blank" rel="noopener noreferrer" className={className}>
              {label}
            </a>
          );
        }

        return (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onAction(action)}
            className={className}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
