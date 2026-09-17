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
  TrendingUp,
  RadioTower,
  ScrollText,
  ShoppingBag,
  Users,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";

const SECTIONS = [
  { href: "/now", key: "nav_command_center", icon: LayoutDashboard },
  { href: "/radar", key: "nav_live_signals", icon: Radio },
  { href: "/soon", key: "nav_upcoming", icon: Clock },
  { href: "/calendar", key: "nav_calendar", icon: Calendar },
  { href: "/market", key: "nav_market", icon: TrendingUp },
  { href: "/sources", key: "nav_sources", icon: RadioTower },
  { href: "/logs", key: "nav_logs", icon: ScrollText },
  { href: "/purchases", key: "nav_purchases", icon: ShoppingBag },
  { href: "/clients", key: "nav_clients", icon: Users },
  { href: "/settings", key: "nav_settings", icon: Settings },
] as const;

export function Nav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      <nav className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-graphite-700 bg-graphite-950 p-4 justify-between">
        <div>
          <div className="text-lime font-bold text-sm tracking-[0.15em] mb-8 px-2">
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
                      ? "bg-graphite-800 text-graphite-100"
                      : "text-graphite-400 hover:text-graphite-100 hover:bg-graphite-900"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-lime" : ""} />
                  {t(s.key)}
                </Link>
              );
            })}
          </div>
          <Link
            href="/signals/new"
            className="flex items-center gap-2 mt-6 px-2.5 py-2 rounded-lg text-[12px] text-graphite-500 hover:text-graphite-300 transition-colors"
          >
            <Plus size={14} />
            {t("add_signal")}
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-2.5 py-2 text-[12px] text-graphite-500 hover:text-graphite-200 text-left"
        >
          <LogOut size={14} />
          {t("sign_out")}
        </button>
      </nav>

      <nav className="md:hidden border-b border-graphite-700 bg-graphite-950 p-3 sticky top-0 z-20">
        <div className="text-lime font-bold text-xs tracking-[0.12em] mb-2 px-1">RELEASE RADAR</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap ${
                  isActive ? "bg-graphite-800 text-graphite-100" : "bg-graphite-900 text-graphite-400"
                }`}
              >
                <Icon size={13} className={isActive ? "text-lime" : ""} />
                {t(s.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
