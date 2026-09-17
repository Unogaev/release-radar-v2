"use client";

import type { ReactNode } from "react";
import type { SignalStatus } from "@/lib/radar/types";

export const STATUS_STYLE: Record<SignalStatus, { label: string; className: string }> = {
  buy: { label: "BUY NOW", className: "bg-rr-accent text-[#100e0c]" },
  prepare: { label: "PREPARE", className: "bg-[rgba(241,238,232,0.13)] text-rr-text" },
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
    <span className="bg-[rgba(11,10,9,0.6)] px-3 py-[7px] font-rr-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cec7bb]">
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
      ? "text-[#cec7bb]"
      : secondsLeft <= 0
        ? "text-rr-accent"
        : secondsLeft < 900
          ? "text-rr-warn"
          : "text-[#cec7bb]";
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
      <span className="h-2.5 w-px bg-[rgba(241,238,232,0.18)]" />
      <span>{stock}</span>
      <span className="h-2.5 w-px bg-[rgba(241,238,232,0.18)]" />
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
          Почему радар это поднял
        </div>
      )}
      <p className={`text-pretty leading-relaxed ${hero ? "text-[13px] text-[#cec7bb]" : "text-[12.5px] text-rr-text-dim"}`}>
        {why}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {factors.map((f) => (
          <span
            key={f}
            className={`font-rr-mono tracking-[0.08em] ${
              hero
                ? "bg-rr-accent-chip px-[9px] py-[5px] text-[10px] text-[#e3d6bc]"
                : "bg-[rgba(216,184,120,0.09)] px-2 py-[5px] text-[9.5px] text-[#cbbfa6]"
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
  className,
  children,
}: {
  hint?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative flex items-end bg-rr-frame p-[18px] ${className ?? ""}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(132deg, rgba(216,184,120,0.07) 0 1px, transparent 1px 12px)",
      }}
    >
      {hint && (
        <span className="font-rr-mono text-[9.5px] uppercase tracking-[0.18em] text-rr-stencil">
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

export type SignalAction = "buy" | "source" | "calendar" | "publish";

const ACTION_LABELS: Record<SignalAction, { full: string; short: string }> = {
  buy: { full: "Купить", short: "Купить" },
  source: { full: "Открыть источник", short: "Источник" },
  calendar: { full: "В календарь", short: "В календарь" },
  publish: { full: "Создать публикацию", short: "Публикация" },
};

export function ActionRow({
  onAction,
  variant = "card",
}: {
  onAction: (action: SignalAction) => void;
  variant?: "card" | "hero";
}) {
  const hero = variant === "hero";
  const order: SignalAction[] = ["buy", "source", "calendar", "publish"];
  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-1">
      {order.map((action) => {
        const label = hero ? ACTION_LABELS[action].full : ACTION_LABELS[action].short;
        const primary = action === "buy";
        return (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            className={
              primary
                ? `bg-rr-accent font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi ${
                    hero ? "px-[26px] py-[13px] text-[13px]" : "px-[22px] py-[11px] text-[12.5px]"
                  }`
                : `bg-rr-well text-[#e7e3db] transition-colors hover:bg-[rgba(241,238,232,0.13)] ${
                    hero ? "px-5 py-[13px] text-[13px]" : "px-[15px] py-[11px] text-[12.5px]"
                  }`
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
