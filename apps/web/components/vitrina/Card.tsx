"use client";
import { tokens } from "./tokens";
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <article
      className={`overflow-hidden bg-white transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${className}`}
      style={{ borderRadius: tokens.radius.card, border: `1px solid ${tokens.color.border}` }}
    >
      {children}
    </article>
  );
}
