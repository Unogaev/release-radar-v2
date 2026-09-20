"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";
import {
  LayoutDashboard,
  Radio,
  Clock,
  Calendar,
  RadioTower,
  ShoppingBag,
  Plus,
  LogOut,
  Newspaper,
} from "lucide-react";

const SECTIONS = [
  { href: "/now", key: "nav_command_center", icon: LayoutDashboard },
  { href: "/radar", key: "nav_live_signals", icon: Radio },
  { href: "/soon", key: "nav_upcoming", icon: Clock },
  { href: "/news", key: "nav_news", icon: Newspaper },
  { href: "/calendar", key: "nav_calendar", icon: Calendar },
  { href: "/sources", key: "nav_sources", icon: RadioTower },
  { href: "/purchases", key: "nav_purchases", icon: ShoppingBag },
] as const;

export function Nav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      <nav className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-rr-frame bg-rr-bg p-4 justify-between">
        <div>
          <div className="text-rr-accent font-bold text-sm tracking-[0.15em] mb-8 px-2">
            RELEASE RADAR
          </div>
          <div className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = pathname === s.href;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-rr-surface-hi text-rr-text"
                      : "text-rr-text-dim hover:text-rr-text hover:bg-rr-surface"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-rr-accent" : ""} />
                  {t(s.key)}
                </Link>
              );
            })}
          </div>
          <Link
            href="/signals/quick"
            className="flex items-center gap-2 mt-6 px-2.5 py-2 rounded-lg text-[12px] text-rr-muted hover:text-rr-text-dim transition-colors"
          >
            <Plus size={14} />
            {t("add_signal")}
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-2.5 py-2 text-[12px] text-rr-muted hover:text-rr-text text-left"
        >
          <LogOut size={14} />
          {t("sign_out")}
        </button>
      </nav>

      <nav className="md:hidden border-b border-rr-frame bg-rr-bg p-3 sticky top-0 z-20">
        <div className="text-rr-accent font-bold text-xs tracking-[0.12em] mb-2 px-1">RELEASE RADAR</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap ${
                  isActive ? "bg-rr-surface-hi text-rr-text" : "bg-rr-surface text-rr-text-dim"
                }`}
              >
                <Icon size={13} className={isActive ? "text-rr-accent" : ""} />
                {t(s.key)}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-rr-surface px-3 py-1.5 text-[11px] text-rr-text-dim"
          >
            <LogOut size={13} />
            {t("sign_out")}
          </button>
        </div>
      </nav>
    </>
  );
}
