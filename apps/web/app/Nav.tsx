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
      <nav className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-ink-700 p-6 justify-between">
        <div>
          <div className="font-display text-lg tracking-wide text-ember-400 mb-10">
            Release Radar
          </div>
          <div className="space-y-1">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`block px-3 py-2 rounded text-sm tracking-wide transition-colors ${
                  pathname === s.href
                    ? "bg-ink-800 text-ember-400"
                    : "text-ink-600 hover:text-white hover:bg-ink-900"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
          <Link
            href="/signals/new"
            className="block mt-6 px-3 py-2 rounded text-xs tracking-wide border border-ember-500/40 text-ember-400 hover:bg-ember-500/10 transition-colors text-center"
          >
            + Новый сигнал
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-ink-600 hover:text-white text-left"
        >
          Выйти
        </button>
      </nav>

      {/* Mobile */}
      <nav className="md:hidden border-b border-ink-700 p-3 sticky top-0 bg-ink-950 z-10">
        <div className="font-display text-base text-ember-400 mb-2 px-1">Release Radar</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 px-3 py-1.5 rounded text-xs whitespace-nowrap ${
                pathname === s.href ? "bg-ink-800 text-ember-400" : "bg-ink-900 text-ink-600"
              }`}
            >
              {s.label}
            </Link>
          ))}
          <Link
            href="/signals/new"
            className="shrink-0 px-3 py-1.5 rounded text-xs whitespace-nowrap border border-ember-500/40 text-ember-400"
          >
            + Сигнал
          </Link>
        </div>
      </nav>
    </>
  );
}
