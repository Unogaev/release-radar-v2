"use client";

import Link from "next/link";
import { Bell, Menu, Radar } from "lucide-react";

export function FeedHeader({ urgentCount, checkedAt }: {
  urgentCount: number;
  checkedAt?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/now" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#16a34a] text-white">
            <Radar size={18} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-[#1a1a1a]">Alert<span className="text-[#16a34a]">yy</span></span>
            <span className="mt-1 hidden text-[10px] font-medium tracking-wide text-[#9ca3af] sm:block">We watch. You buy first.</span>
          </span>
        </Link>
        <Link
          href="/now?filter=urgent"
          className="ml-1 flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-3 py-1.5 text-[12px] font-semibold text-[#dc2626]"
        >
          <span className="tabular-nums">{urgentCount}</span>
          <span>urgent</span>
        </Link>
        <div className="flex-1" />
        {checkedAt && (
          <span className="hidden text-[12px] tabular-nums text-[#9ca3af] sm:block">
            Alertyy checked {checkedAt}
          </span>
        )}
        <Link href="/notifications" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]">
          <Bell size={18} />
        </Link>
        <Link href="/menu" aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]">
          <Menu size={18} />
        </Link>
      </div>
    </header>
  );
}
