"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Eye, LayoutGrid, MoreHorizontal } from "lucide-react";

const TABS = [
  { href: "/now", label: "Feed", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/menu", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e7eb] bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.href || (t.href === "/now" && pathname === "/");
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${active ? "text-[#16a34a]" : "text-[#9ca3af]"}`}
            >
              <Icon size={20} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
