"use client";

import type { ReactNode } from "react";
import type { SignalStatus } from "@/lib/radar/types";
import { useLanguage } from "@/lib/i18n";

export const STATUS_STYLE: Record<SignalStatus, { label: string; className: string }> = {
  buy: { label: "BUY NOW", className: "bg-rr-accent text-[#faf9f7]" },
  prepare: { label: "PREPARE", className: "bg-[rgba(22,21,20,0.06)] text-rr-text" },
  client: { label: "CLIENT FIRST", className: "bg-rr-client-bg text-rr-client" },
};

export const MONO_LABEL =
  "font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-rr-muted";

export function StatusBadge({ status }: { status: SignalStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`px-3 py-[7px] font-rr-mono text-[9.5px] uppercase tracking-[0.2em] ${s.className}`}>
      {s.label}
    </span>
  );
}

export function KindBadge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-[rgba(11,10,9,0.6)] px-3 py-[7px] font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-[#f1eee8]">
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
    <div className="grid grid-cols-3 gap-px bg-rr-hair">
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
      <span className="h-2.5 w-px bg-[rgba(22,21,20,0.14)]" />
      <span>{stock}</span>
      <span className="h-2.5 w-px bg-[rgba(22,21,20,0.14)]" />
      <span className="font-rr-mono text-[10.5px] text-rr-faint">{checked}</span>
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
                : "bg-[rgba(22,21,20,0.05)] px-2 py-[5px] text-[9.5px] text-rr-text-dim"
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
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-rr-frame p-[18px] ${className ?? ""}`}
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
                "repeating-linear-gradient(132deg, rgba(22,21,20,0.06) 0 1px, transparent 1px 12px)",
            }
      }
    >
      {!src && hint && (
        <span className="font-rr-mono text-[9.5px] uppercase tracking-[0.18em] text-rr-stencil">
          {hint}
        </span>
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
}: {
  onAction: (action: SignalAction) => void;
  variant?: "card" | "hero";
  /** Реальная ссылка для кнопки "Купить". Если нет — кнопка неактивна. */
  primaryHref?: string | null;
  disabledActions?: SignalAction[];
}) {
  const { t } = useLanguage();
  const actionLabels: Record<SignalAction, { full: string; short: string }> = {
    buy: { full: t("action_buy"), short: t("action_buy") },
    source: { full: t("action_source_full"), short: t("action_source_short") },
    calendar: { full: t("action_calendar"), short: t("action_calendar") },
    publish: { full: t("action_publish_full"), short: t("action_publish_short") },
  };
  const hero = variant === "hero";
  const order: SignalAction[] = ["buy", "source", "calendar", "publish"];
  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-1">
      {order.map((action) => {
        const label = hero ? actionLabels[action].full : actionLabels[action].short;
        const primary = action === "buy";
        const disabled = disabledActions.includes(action) || (primary && !primaryHref);
        const sizing = hero ? "px-[26px] py-[13px] text-[13px]" : "px-[22px] py-[11px] text-[12.5px]";
        const secondarySizing = hero ? "px-5 py-[13px] text-[13px]" : "px-[15px] py-[11px] text-[12.5px]";

        const className = primary
      ? `font-semibold transition-colors ${sizing} ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-transparent border border-rr-accent text-rr-accent"
            : "border border-rr-accent text-rr-accent hover:bg-rr-accent hover:text-[#faf9f7]"
        }`
          : `border border-[rgba(22,21,20,0.14)] transition-colors ${secondarySizing} ${
              disabled
                ? "opacity-40 cursor-not-allowed text-rr-faint"
                : "bg-[rgba(22,21,20,0.03)] text-rr-text hover:bg-[rgba(22,21,20,0.07)]"
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
