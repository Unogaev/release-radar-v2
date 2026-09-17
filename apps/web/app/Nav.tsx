"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const SECTIONS = [
  { href: "/now", label: "СЕЙЧАС" },
  { href: "/soon", label: "СКОРО" },
  { href: "/radar", label: "НА РАДАРЕ" },
  { href: "/purchases", label: "МОИ ПОКУПКИ" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-ink-800/50 bg-ink-900/30 p-7 justify-between">
        <div>
          <div className="font-display text-xl tracking-[0.08em] text-ember-500 mb-12">
            Release Radar
          </div>
          <div className="space-y-1">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`block px-3 py-2.5 rounded-lg text-xs tracking-wider transition-colors ${
                  pathname === s.href
                    ? "bg-white text-ember-500 shadow-sm"
                    : "text-ink-600 hover:text-espresso hover:bg-white/60"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
          <Link
            href="/signals/new"
            className="block mt-8 px-3 py-2.5 rounded-lg text-xs tracking-wider border border-ember-500/50 text-ember-500 hover:bg-ember-500 hover:text-white hover:border-ember-500 transition-colors text-center"
          >
            + Новый сигнал
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-ink-700 hover:text-espresso text-left tracking-wide"
        >
          Выйти
        </button>
      </nav>

      {/* Mobile */}
      <nav className="md:hidden border-b border-ink-800/50 p-3 sticky top-0 bg-ink-950/95 backdrop-blur z-10">
        <div className="font-display text-base tracking-[0.06em] text-ember-500 mb-2 px-1">Release Radar</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                pathname === s.href ? "bg-white text-ember-500 shadow-sm" : "bg-ink-900/40 text-ink-600"
              }`}
            >
              {s.label}
            </Link>
          ))}
          <Link
            href="/signals/new"
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border border-ember-500/50 text-ember-500"
          >
            + Сигнал
          </Link>
        </div>
      </nav>
    </>
  );
}
