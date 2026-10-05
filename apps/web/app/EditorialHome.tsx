"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { DerivedSignal } from "@/lib/radar/types";

type ProofItem = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  updatedAt: string;
};

const PAPER = "bg-[#f3eee4] text-[#1c1a15]";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-rr-mono text-[10px] uppercase tracking-[0.24em] text-[#6f6656]">
      {children}
    </div>
  );
}

export function EditorialHome({
  signals,
  tickerSignals,
  openCount,
  proof,
  today,
}: {
  signals: DerivedSignal[];
  tickerSignals: DerivedSignal[];
  openCount: number;
  proof: ProofItem[];
  today: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState("");

  const ask = () => {
    router.push(q.trim() ? `/now/add?q=${encodeURIComponent(q.trim())}` : "/now/add");
  };

  const runnerUrl = (s: DerivedSignal) => {
    const params = new URLSearchParams();
    if (s.brand && s.brand !== "—") params.set("brand", s.brand);
    if (s.model && s.model !== "—") params.set("model", s.model);
    const sku =
      s.sku && s.sku !== "—" ? s.sku : s.reference && s.reference !== "—" ? s.reference : "";
    if (sku) params.set("sku", sku);
    if (s.retail != null) params.set("price", String(s.retail));
    if (s.primaryUrl) params.set("url", s.primaryUrl);
    return `/requests/new?${params.toString()}`;
  };

  const dedupeName = (s: DerivedSignal) => { const brand = s.brand && s.brand !== "—" ? s.brand : ""; const model = s.model && s.model !== "—" ? s.model : ""; if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) return model; return [brand, model].filter(Boolean).join(" "); };
  const tickerItems = tickerSignals
    .map((s) => {
      
      const price = s.retail != null ? ` · $${s.retail}` : "";
      return `${dedupeName(s)}${price}`.trim();
    })
    .filter(Boolean);

  return (
    <div className={`${PAPER} min-h-screen`}>
      <style>{`
        @keyframes rr-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .rr-ticker-track { display: inline-flex; white-space: nowrap; animation: rr-ticker 45s linear infinite; }
        .rr-ticker-track:hover { animation-play-state: paused; }
      `}</style>

      {/* MASTHEAD */}
      <header className="border-b border-[#d8cfb9]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between py-5">
            <Link href="/" className="font-rr-display font-extrabold text-xl tracking-tight">
              RADAR<sup className="text-[10px] align-super">®</sup>
            </Link>
            <nav className="hidden sm:flex items-center gap-8 font-rr-mono text-[11px] uppercase tracking-[0.2em]">
              <Link href="/now" className="border-b-2 border-[#1c1a15] pb-1">
                {t("ed_tab_discover")}
              </Link>
              <span className="text-[#a89d88] cursor-default" title="Soon">
                {t("ed_tab_local")}
              </span>
              <Link href="/earn" className="text-[#6f6656] hover:text-[#1c1a15] pb-1">
                {t("ed_tab_earn")}
              </Link>
            </nav>
            <div className="flex items-center gap-2 font-rr-mono text-[11px] uppercase tracking-[0.18em]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#2e5b3e] animate-pulse" />
              {t("ed_masthead_market")}
            </div>
          </div>
          <div className="sm:hidden flex items-center gap-6 pb-4 font-rr-mono text-[11px] uppercase tracking-[0.2em]">
            <Link href="/now" className="border-b-2 border-[#1c1a15] pb-0.5">
              {t("ed_tab_discover")}
            </Link>
            <span className="text-[#a89d88]">{t("ed_tab_local")}</span>
            <Link href="/earn" className="text-[#6f6656]">
              {t("ed_tab_earn")}
            </Link>
          </div>
          <div className="border-t border-[#d8cfb9] py-2 flex items-center justify-between font-rr-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6656]">
            <span>{today}</span>
            <span>{t("ed_edition")}</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-12 md:pb-16">
        <div className="grid md:grid-cols-[1fr_1.6fr_1fr] gap-10 md:gap-8">
          <div>
            <Kicker>{t("ed_access_kicker")}</Kicker>
            <h2 className="font-rr-editorial text-4xl md:text-[44px] leading-[1.08] mt-5 font-semibold">
              {t("ed_tagline_a")}
              <br />
              {t("ed_tagline_b")}
              <br />
              {t("ed_tagline_c")}
            </h2>
            <p className="text-[13px] text-[#6f6656] mt-5 leading-relaxed max-w-[240px]">
              {t("ed_tagline_sub")}
            </p>
          </div>

          <div className="md:border-l md:border-r border-[#d8cfb9] md:px-8">
            <Kicker>{t("ed_ask_kicker")}</Kicker>
            <h1 className="font-rr-editorial text-[42px] md:text-[64px] leading-[1.02] mt-4 font-semibold">
              {t("ed_ask_headline")}
            </h1>
            <div className="mt-8 flex items-center gap-4 border-b-2 border-[#1c1a15] pb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder={t("ed_ask_placeholder")}
                className="flex-1 bg-transparent text-lg md:text-xl placeholder:text-[#a89d88] outline-none font-rr-sans"
              />
              <button
                onClick={ask}
                className="shrink-0 font-rr-mono text-[11px] uppercase tracking-[0.2em] text-[#2e5b3e] hover:text-[#1c1a15]"
              >
                {t("ed_find_it")} →
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-rr-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6656]">
              <button onClick={() => router.push("/now/add")} className="hover:text-[#1c1a15]">
                {t("ed_paste")}
              </button>
              <button onClick={() => router.push("/now/add")} className="hover:text-[#1c1a15]">
                {t("ed_upload")}
              </button>
              <button onClick={() => router.push("/now/add")} className="hover:text-[#1c1a15]">
                {t("ed_describe")}
              </button>
            </div>
          </div>

          <div>
            <div className="border border-[#d8cfb9] bg-[#ece5d3] p-6">
              <Kicker>{t("ed_desk")}</Kicker>
              <dl className="mt-5 space-y-4 text-[13px]">
                <div className="flex justify-between gap-4 border-b border-[#d8cfb9] pb-3">
                  <dt className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6656] pt-0.5">
                    {t("ed_desk_market")}
                  </dt>
                  <dd className="text-right font-medium">{t("ed_desk_market_v")}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#d8cfb9] pb-3">
                  <dt className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6656] pt-0.5">
                    {t("ed_desk_network")}
                  </dt>
                  <dd className="text-right font-medium">
                    {openCount > 0 ? `${openCount} ${t("ed_desk_network_open")}` : t("ed_desk_network_building")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6656] pt-0.5">
                    {t("ed_desk_rule")}
                  </dt>
                  <dd className="text-right font-medium">{t("ed_desk_rule_v")}</dd>
                </div>
              </dl>
              <div className="grid grid-cols-2 gap-2 mt-6">
                <Link
                  href="/requests/new"
                  className="bg-[#1c1a15] text-[#f3eee4] font-rr-mono text-[10px] uppercase tracking-[0.14em] text-center px-3 py-3.5 hover:bg-[#2e5b3e] transition-colors"
                >
                  + {t("ed_create_request")}
                </Link>
                <Link
                  href="/earn"
                  className="border border-[#1c1a15] font-rr-mono text-[10px] uppercase tracking-[0.14em] text-center px-3 py-3.5 hover:bg-[#1c1a15] hover:text-[#f3eee4] transition-colors"
                >
                  {t("ed_im_here")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      {tickerItems.length > 0 && (
        <div className="border-y border-[#d8cfb9] bg-[#ece5d3] overflow-hidden py-2.5">
          <div className="rr-ticker-track font-rr-mono text-[11px] uppercase tracking-[0.14em] text-[#6f6656]">
            {[0, 1].map((copy) => (
              <span key={copy} className="inline-flex">
                {tickerItems.map((item, i) => (
                  <span key={i} className="mx-6 inline-flex items-center gap-6">
                    <span>{item}</span>
                    <span className="text-[#2e5b3e]">◆</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* WHAT IS MOVING NOW */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between gap-4 mb-2">
          <h2 className="font-rr-editorial text-3xl md:text-[40px] font-semibold">
            {t("ed_moving_title")}
          </h2>
          <div className="hidden md:block font-rr-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6656] pb-2">
            {t("ed_moving_kicker")}
          </div>
        </div>
        <div className="border-t-2 border-[#1c1a15]">
          {signals.length === 0 ? (
            <p className="py-10 text-sm text-[#6f6656]">{t("ed_moving_empty")}</p>
          ) : (
            signals.map((s, i) => {
              const name = dedupeName(s);
              return (
                <article key={s.id} className="grid grid-cols-[auto_1fr] md:grid-cols-[56px_120px_1fr_auto] gap-4 md:gap-6 py-6 border-b border-[#d8cfb9] items-start">
                  <div className="font-rr-mono text-[11px] text-[#a89d88] pt-1">
                    {String(i + 1).padStart(3, "0")}
                  </div>
                  {s.imageUrl && (
                    <Link href={`/signals/${s.id}`} className="hidden md:block w-[120px] h-[120px] overflow-hidden bg-[#ece5d3]">
                      <img src={s.imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <div className="font-rr-mono text-[10px] uppercase tracking-[0.2em] text-[#2e5b3e]">
                      {(s.categories?.[0] ?? s.kindLabel ?? "").toString().replace(/_/g, " ")}
                    </div>
                    <h3 className="font-rr-editorial text-2xl md:text-[28px] font-semibold leading-tight mt-1.5">
                      <Link href={`/signals/${s.id}`} className="hover:underline">
                        {name || s.kindLabel}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[13px] text-[#6f6656]">
                      {s.retail != null && <span className="font-medium text-[#1c1a15]">${s.retail}</span>}
                      <span className="font-rr-mono text-[10px] uppercase tracking-[0.18em] border border-[#2e5b3e] text-[#2e5b3e] px-2 py-0.5">
                        {String(s.status).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Link
                        href={`/signals/${s.id}`}
                        className="font-rr-mono text-[10px] uppercase tracking-[0.18em] border border-[#1c1a15] px-4 py-2 hover:bg-[#1c1a15] hover:text-[#f3eee4] transition-colors"
                      >
                        {t("ed_open")} →
                      </Link>
                      <Link
                        href={runnerUrl(s)}
                        className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-[#2e5b3e] px-1 py-2 hover:underline"
                      >
                        {t("req_new_title")}
                      </Link>
                    </div>
                  </div>
                  <div className="hidden md:block" />
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* EARN */}
      <section className="border-t border-[#d8cfb9]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Kicker>{t("home_earn_kicker")}</Kicker>
            <h2 className="font-rr-editorial text-3xl md:text-[40px] font-semibold mt-3">
              {t("home_earn_title")}
            </h2>
            <p className="text-sm text-[#6f6656] mt-4 max-w-md leading-relaxed">
              {openCount > 0
                ? `${t("home_earn_open_label")} ${openCount}`
                : t("home_earn_empty")}
            </p>
          </div>
          <div className="md:text-right">
            <Link
              href="/earn"
              className="inline-block bg-[#1c1a15] text-[#f3eee4] font-rr-mono text-[11px] uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#2e5b3e] transition-colors"
            >
              {t("home_earn_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* PROOF */}
      {proof.length > 0 && (
        <section className="border-t border-[#d8cfb9]">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
            <Kicker>{t("home_proof_kicker")}</Kicker>
            <h2 className="font-rr-editorial text-3xl md:text-[40px] font-semibold mt-3">
              {t("home_proof_title")}
            </h2>
            <p className="text-sm text-[#6f6656] mt-2">{t("home_proof_sub")}</p>
            <div className="mt-6 space-y-3">
              {proof.map((p) => (
                <Link
                  key={p.id}
                  href={`/requests/${p.id}`}
                  className="block border border-[#d8cfb9] bg-[#ece5d3] p-5 hover:border-[#1c1a15] transition-colors"
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="font-rr-mono text-[10px] uppercase tracking-[0.16em] text-[#6f6656] mt-1.5">
                    {[p.brand, p.model].filter(Boolean).join(" · ")}
                    {[p.brand, p.model].filter(Boolean).length > 0 ? " · " : ""}
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t-2 border-[#1c1a15]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-rr-display font-extrabold text-lg tracking-tight">
            RADAR<sup className="text-[9px] align-super">®</sup>
          </div>
          <div className="font-rr-editorial italic text-[#6f6656]">{t("ed_footer_tag")}</div>
          <nav className="flex gap-6 font-rr-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6656]">
            <Link href="/now" className="hover:text-[#1c1a15]">
              {t("ed_tab_discover")}
            </Link>
            <Link href="/earn" className="hover:text-[#1c1a15]">
              {t("ed_tab_earn")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
