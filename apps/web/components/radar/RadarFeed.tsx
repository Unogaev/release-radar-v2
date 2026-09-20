"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, Menu, Newspaper, Plus, Radar, RefreshCw, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { FeedPayload, NewsItem, RadarCategory } from "@/lib/radar/types";
import { derive, sortSignals } from "@/lib/radar/derive";
import { clockLabel } from "@/lib/radar/format";
import { useNow } from "./useCountdown";
import { SignalHero } from "./SignalHero";
import { SignalCard } from "./SignalCard";
import { FeedError, StaleBanner } from "./states";
import type { SignalAction } from "./parts";

const FILTER_IDS = [
  { id: "now" as const, ru: "Сейчас", en: "Now" },
  { id: "soon" as const, ru: "Скоро", en: "Upcoming" },
  { id: "restock" as const, ru: "Рестоки", en: "Restocks" },
  { id: "trend" as const, ru: "Спрос", en: "Demand" },
  { id: "clearance" as const, ru: "Clearance", en: "Clearance" },
  { id: "watches" as const, ru: "Часы", en: "Watches" },
  { id: "tech" as const, ru: "Tech & Gaming", en: "Tech & Gaming" },
  { id: "sneakers" as const, ru: "Sneakers", en: "Sneakers" },
  { id: "cars" as const, ru: "Авто", en: "Cars" },
];

const COPY = {
  ru: {
    eyebrow: "Opportunity intelligence · Miami / Moscow / Dubai",
    title: "Где сегодня есть деньги",
    subtitle: "Не каталог релизов: проверенная цена входа, фактические продажи, чистый спред, ликвидность и конкретное действие.",
    active: "Активных действий", upcoming: "Ближайших событий", verified: "Проверка BUY NOW", verifiedValue: "Строгая", scan: "Последний сбор",
    noAction: "Сейчас нет сделки, прошедшей все проверки",
    noActionText: "Это не пустая лента: капитал остаётся свободным, пока нет одновременно доступности, цены входа, доказанных продаж и чистой маржи.",
    noActionCta: "Открыть ближайшие возможности", intel: "Что может изменить решение",
    intelText: "Только входящие данные для следующей сделки: анонсы, рестоки, дефицит и ранний спрос. Это разведка, а не рекомендация покупать.",
    allNews: "Все новости", source: "Открыть источники", sourceHealth: "Состояние источников", sourcesOk: "работают", sourcesIssue: "требуют внимания", refresh: "Обновить", alerts: "Алерты", emptyNews: "Свежих подтверждённых публикаций пока нет.",
  },
  en: {
    eyebrow: "Opportunity intelligence · Miami / Moscow / Dubai", title: "Where the money is today",
    subtitle: "Not a release catalog: verified entry cost, completed sales, net spread, liquidity and one clear action.",
    active: "Active actions", upcoming: "Upcoming events", verified: "BUY NOW gate", verifiedValue: "Strict", scan: "Last sweep",
    noAction: "No deal passes every gate right now",
    noActionText: "This is not an empty feed: capital stays free until availability, entry price, completed sales and net margin are confirmed together.",
    noActionCta: "Open upcoming opportunities", intel: "What could change the decision",
    intelText: "Inputs for the next trade: announcements, restocks, scarcity and early demand. Intelligence, not a buy recommendation.",
    allNews: "All news", source: "Open sources", sourceHealth: "Source health", sourcesOk: "healthy", sourcesIssue: "need attention", refresh: "Refresh", alerts: "Alerts", emptyNews: "No fresh verified publications yet.",
  },
};

function NewsCard({ item, lang, featured = false }: { item: NewsItem; lang: "ru" | "en"; featured?: boolean }) {
  const observed = new Date(item.observedAt);
  return (
    <article className={`group overflow-hidden rounded-[22px] border border-white/10 bg-[#14171c] transition hover:-translate-y-0.5 hover:border-white/20 ${featured ? "md:grid md:grid-cols-[1.25fr_.75fr] xl:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden bg-[#1b1f26] ${featured ? "min-h-[220px]" : "aspect-[16/10]"}`}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(201,255,83,.16),transparent_42%),linear-gradient(135deg,#20252d,#111318)]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">{item.kind}</span>
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-end sm:p-7" : ""}`}>
        <h3 className={`line-clamp-3 font-semibold leading-tight text-white ${featured ? "text-[22px] sm:text-[26px]" : "text-[17px]"}`}>{item.headline}</h3>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-white/45"><span className="truncate">{item.source}</span><span className="shrink-0">{observed.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric" })}</span></div>
        {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9ff53]">{lang === "ru" ? "Открыть источник" : "Open source"}<ArrowUpRight size={13} /></a>}
      </div>
    </article>
  );
}

export function RadarFeed({ payload, error, isStale = false, isPending = false, onRetry, onAction }: { payload?: FeedPayload; error?: string; isStale?: boolean; isPending?: boolean; onRetry?: () => void; onAction?: (id: string, action: SignalAction) => void; }) {
  const [filter, setFilter] = useState<RadarCategory>("now");
  const now = useNow();
  const { lang, setLang } = useLanguage();
  const c = COPY[lang];
  const signals = payload?.signals ?? [];
  const visible = useMemo(() => sortSignals(signals.filter((s) => s.categories.includes(filter)).map(derive)), [signals, filter]);
  const upcomingCount = signals.filter((s) => s.categories.includes("soon")).length;
  const healthySources = payload?.sources.filter((s) => s.state === "ok").length ?? 0;
  const troubledSources = (payload?.sources.length ?? 0) - healthySources;
  const news = payload?.newsItems.slice(0, 6) ?? [];
  const [hero, ...rest] = visible;

  return (
    <div className="min-h-screen bg-[#0a0c0f] font-rr-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9ff53] text-[#0a0c0f]"><Radar size={19} strokeWidth={2.4} /></div><div className="min-w-0"><div className="whitespace-nowrap text-[15px] font-extrabold tracking-[-0.02em]">Release Radar</div><div className="hidden text-[10px] uppercase tracking-[0.18em] text-white/35 sm:block">Miami · ET · ZIP 33160</div></div></div>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/radar" aria-label={lang === "ru" ? "Все разделы" : "All sections"} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/25 hover:text-white"><Menu size={16} /></Link><Link href="/now/add" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#c9ff53] px-3.5 text-xs font-bold text-black"><Plus size={14} /><span className="hidden sm:inline">{lang === "ru" ? "Добавить сигнал" : "Add signal"}</span></Link><Link href="/news" className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white lg:inline-flex"><Newspaper className="mr-2" size={14} />{c.allNews}</Link><Link href="/notifications" aria-label={c.alerts} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65"><Bell size={16} /></Link><div className="hidden rounded-full border border-white/10 p-1 text-[10px] font-bold sm:flex">{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={`rounded-full px-2.5 py-1 ${lang === l ? "bg-white text-black" : "text-white/40"}`}>{l.toUpperCase()}</button>)}</div></div>
        </div>
      </header>

      <main className={`mx-auto max-w-[1500px] px-4 pb-20 pt-8 transition-opacity sm:px-8 lg:px-12 ${isPending ? "opacity-50" : ""}`}>
        <section className="grid gap-7 border-b border-white/10 pb-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end"><div><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9ff53]">{c.eyebrow}</div><h1 className="max-w-[760px] text-balance text-[38px] font-extrabold leading-[.98] tracking-[-0.05em] sm:text-[52px] lg:text-[60px]">{c.title}</h1><p className="mt-4 max-w-[700px] text-sm leading-6 text-white/48">{c.subtitle}</p></div><div className="grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10"><div className="bg-[#111419] p-4"><div className="text-[9px] uppercase tracking-[.15em] text-white/35">{c.active}</div><div className="mt-2 text-2xl font-bold">{signals.filter((s) => s.status === "buy" || s.status === "apply").length}</div></div><div className="bg-[#111419] p-4"><div className="text-[9px] uppercase tracking-[.15em] text-white/35">{c.upcoming}</div><div className="mt-2 text-2xl font-bold">{upcomingCount}</div></div><button onClick={onRetry} className="bg-[#111419] p-4 text-left transition hover:bg-[#171b21]"><div className="text-[9px] uppercase tracking-[.15em] text-white/35">{c.scan}</div><div className="mt-2 flex items-center gap-2 text-sm font-bold"><RefreshCw size={13} />{payload ? clockLabel(payload.scannedAt) : "—"}</div></button></div></section>

        {isStale && payload && <StaleBanner at={clockLabel(payload.scannedAt)} onRefresh={onRetry} />}
        {error && !payload ? <FeedError reason={error} onRetry={onRetry} /> : <>
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">{FILTER_IDS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${filter === f.id ? "bg-[#c9ff53] text-black" : "border border-white/10 bg-white/[.025] text-white/48 hover:text-white"}`}>{f[lang]}</button>)}</nav>
          <section className="mt-5">{visible.length ? <div><SignalHero signal={hero} now={now} onAction={(id, action) => onAction?.(id, action)} />{rest.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rest.map((s) => <SignalCard key={s.id} signal={s} now={now} onAction={(id, action) => onAction?.(id, action)} />)}</div>}</div> : <div className="grid overflow-hidden rounded-[24px] border border-white/10 bg-[#12151a] lg:grid-cols-[1.25fr_.75fr]"><div className="relative p-7 sm:p-9"><div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#c9ff53]/[.06] blur-3xl" /><div className="relative max-w-[650px]"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c9ff53]/10 text-[#c9ff53]"><ShieldCheck size={21} /></div><h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{c.noAction}</h2><p className="mt-3 text-sm leading-6 text-white/48">{c.noActionText}</p><button onClick={() => setFilter("soon")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-black">{c.noActionCta}<ArrowUpRight size={14} /></button></div></div><div className="border-t border-white/10 bg-black/20 p-7 lg:border-l lg:border-t-0"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">{lang === "ru" ? "Жёсткие условия сделки" : "Hard deal gates"}</div><div className="mt-5 space-y-4 text-sm">{(lang === "ru" ? ["Продавец и checkout подтверждены", "Закупка с налогом рассчитана", "Completed sales отделены от asks", "Чистая маржа проходит порог"] : ["Seller and checkout verified", "Taxed acquisition cost calculated", "Completed sales separated from asks", "Net margin clears the threshold"]).map((gate) => <div key={gate} className="flex items-start gap-3 text-white/62"><span className="mt-1 h-2 w-2 shrink-0 rounded-full border border-[#c9ff53]/60" />{gate}</div>)}</div></div></div>}</section>
          <section className="mt-14 border-t border-white/10 pt-9"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9ff53]">Intelligence → opportunity</div><h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">{c.intel}</h2><p className="mt-2 max-w-[700px] text-sm leading-6 text-white/45">{c.intelText}</p></div><Link href="/news" className="inline-flex items-center gap-2 text-xs font-bold text-white/70">{c.allNews}<ArrowUpRight size={14} /></Link></div>{news.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{news.map((item, index) => <NewsCard key={item.id} item={item} lang={lang} featured={index === 0} />)}</div> : <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-sm text-white/40">{c.emptyNews}</div>}</section>
          <section className="mt-12 flex flex-col justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">{c.sourceHealth}</div><div className="mt-1 text-xs text-white/40"><span className="text-[#8fe0aa]">{healthySources} {c.sourcesOk}</span>{troubledSources > 0 && <span> · {troubledSources} {c.sourcesIssue}</span>}</div></div><Link href="/sources" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">{c.source}<ArrowUpRight size={13} /></Link></section>
        </>}
      </main>
    </div>
  );
}
