"use client";
import { tokens } from "./tokens";
export function CTAButton({ children, onClick, href, variant = "primary" }: { children: React.ReactNode; onClick?: () => void; href?: string; variant?: "primary" | "secondary" }) {
  const style = variant === "primary"
    ? { backgroundColor: tokens.color.accent, color: "#fff" }
    : { backgroundColor: tokens.color.surface, color: tokens.color.text, border: `1px solid ${tokens.color.border}` };
  const cls = "flex w-full items-center justify-center rounded-[12px] px-4 py-3 text-[14px] font-semibold transition hover:opacity-90";
  if (href) return <a href={href} className={cls} style={style}>{children}</a>;
  return <button onClick={onClick} className={cls} style={style}>{children}</button>;
}
