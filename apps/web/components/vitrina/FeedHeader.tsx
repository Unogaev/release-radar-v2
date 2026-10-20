"use client";

import Link from "next/link";
import { Bell, Menu, Radar, Search } from "lucide-react";

export function FeedHeader({ urgentCount, checkedAt, onSearch }: {
  urgentCount: number;
  checkedAt?: string | null;
  onSearch?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/now" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#16a34a] text-white">
            <Radar size={18} />
          </span>
          <span className="text-[15px] font-bold text-[#1a1a1a]">Release Radar</span>
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
            checked {checkedAt}
          </span>
        )}
        <button onClick={onSearch} aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]">
          <Search size={18} />
        </button>
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
