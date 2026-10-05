"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { DerivedSignal } from "@/lib/radar/types";
import { SignalCard } from "@/components/radar/SignalCard";
import type { SignalAction } from "@/components/radar/parts";

type ProofItem = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  updatedAt: string;
};

export function HomePageClient({
  signals,
  openCount,
  proof,
}: {
  signals: DerivedSignal[];
  openCount: number;
  proof: ProofItem[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState("");
  const now = Date.now();

  const handleAction = (id: string, action: SignalAction) => {
    const signal = signals.find((s) => s.id === id);
    switch (action) {
      case "buy":
      case "source":
        router.push(`/signals/${id}`);
        break;
      case "calendar":
        router.push(`/calendar?signal=${encodeURIComponent(id)}`);
        break;
      case "runner": {
        const params = new URLSearchParams();
        if (signal) {
          if (signal.brand && signal.brand !== "—") params.set("brand", signal.brand);
          if (signal.model && signal.model !== "—") params.set("model", signal.model);
          const sku =
            signal.sku && signal.sku !== "—"
              ? signal.sku
              : signal.reference && signal.reference !== "—"
                ? signal.reference
                : "";
          if (sku) params.set("sku", sku);
          if (signal.retail != null) params.set("price", String(signal.retail));
          if (signal.primaryUrl) params.set("url", signal.primaryUrl);
        }
        router.push(`/requests/new?${params.toString()}`);
        break;
      }
      case "publish":
        break;
    }
  };

  const ask = () => {
    router.push(q.trim() ? `/now/add?q=${encodeURIComponent(q.trim())}` : "/now/add");
  };

  const steps = [
    { n: "01", title: t("home_how_1t"), desc: t("home_how_1d") },
    { n: "02", title: t("home_how_2t"), desc: t("home_how_2d") },
    { n: "03", title: t("home_how_3t"), desc: t("home_how_3d") },
  ];

  return (
    <div className="space-y-16 md:space-y-24 pb-10">
      <section className="pt-4 md:pt-10">
        <div className="font-rr-mono text-[11px] uppercase tracking-[0.22em] text-rr-muted">
          {t("home_kicker")}
        </div>
        <h1 className="font-display text-[38px] md:text-6xl leading-[1.04] text-rr-text mt-4 max-w-3xl">
          {t("home_headline")}
        </h1>
        <p className="text-rr-text-dim text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
          {t("home_sub")}
        </p>
        <div className="mt-8 max-w-2xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-rr-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder={t("ask_placeholder")}
                className="w-full bg-rr-surface border border-rr-frame rounded-2xl pl-11 pr-4 py-4 text-[15px] text-rr-text placeholder:text-rr-muted focus:border-rr-accent outline-none"
              />
            </div>
            <button
              onClick={ask}
              className="shrink-0 bg-rr-accent text-[#07130d] font-semibold rounded-2xl px-5 md:px-7 py-4 text-[15px] hover:bg-rr-accent-hi transition-colors"
            >
              {t("ask_button")}
            </button>
          </div>
          <p className="text-xs text-rr-muted mt-3">{t("ask_hint")}</p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="font-rr-mono text-[11px] uppercase tracking-[0.22em] text-rr-muted">
              {t("home_signals_kicker")}
            </div>
            <h2 className="font-display text-2xl md:text-[32px] text-rr-text mt-2">
              {t("home_signals_title")}
            </h2>
          </div>
          <Link href="/now" className="text-sm text-rr-accent flex items-center gap-1.5 shrink-0 pb-1">
            {t("home_signals_all")} <ArrowRight size={14} />
          </Link>
        </div>
        {signals.length === 0 ? (
          <div className="border border-rr-frame rounded-2xl bg-rr-surface p-8 text-sm text-rr-text-dim">
            {t("home_signals_empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {signals.map((s) => (
              <SignalCard key={s.id} signal={s} now={now} onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="font-rr-mono text-[11px] uppercase tracking-[0.22em] text-rr-muted">
          {t("home_how_kicker")}
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-6">
          {steps.map((s) => (
            <div key={s.n} className="border-t border-rr-frame pt-5">
              <div className="font-rr-mono text-xs text-rr-accent">{s.n}</div>
              <h3 className="font-display text-xl text-rr-text mt-2">{s.title}</h3>
              <p className="text-sm text-rr-text-dim mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-rr-frame rounded-3xl bg-rr-surface p-8 md:p-12">
        <div className="font-rr-mono text-[11px] uppercase tracking-[0.22em] text-rr-muted">
          {t("home_earn_kicker")}
        </div>
        <h2 className="font-display text-2xl md:text-[32px] text-rr-text mt-3">
          {t("home_earn_title")}
        </h2>
        {openCount > 0 ? (
          <p className="text-rr-text-dim mt-4 text-[15px]">
            {t("home_earn_open_label")}{" "}
            <span className="text-rr-text font-semibold text-lg">{openCount}</span>
          </p>
        ) : (
          <p className="text-sm text-rr-text-dim mt-4 max-w-xl leading-relaxed">
            {t("home_earn_empty")}
          </p>
        )}
        <Link
          href="/earn"
          className="inline-flex items-center gap-2 mt-7 border border-rr-accent text-rr-accent rounded-2xl px-6 py-3 text-sm font-medium hover:bg-rr-accent-soft transition-colors"
        >
          {t("home_earn_cta")} <ArrowRight size={15} />
        </Link>
      </section>

      {proof.length > 0 && (
        <section>
          <div className="font-rr-mono text-[11px] uppercase tracking-[0.22em] text-rr-muted">
            {t("home_proof_kicker")}
          </div>
          <h2 className="font-display text-2xl md:text-[32px] text-rr-text mt-2">
            {t("home_proof_title")}
          </h2>
          <p className="text-sm text-rr-text-dim mt-2">{t("home_proof_sub")}</p>
          <div className="mt-6 space-y-3">
            {proof.map((p) => (
              <Link
                key={p.id}
                href={`/requests/${p.id}`}
                className="block border border-rr-frame rounded-2xl bg-rr-surface p-5 hover:border-rr-accent/40 transition-colors"
              >
                <div className="font-medium text-rr-text">{p.title}</div>
                <div className="text-xs text-rr-muted mt-1.5">
                  {[p.brand, p.model].filter(Boolean).join(" · ")}
                  {[p.brand, p.model].filter(Boolean).length > 0 ? " · " : ""}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
