"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, CalendarDays, CheckCircle2, Menu, Newspaper, Radar, RefreshCw, ShieldCheck } from "lucide-react";
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
    eyebrow: "Персональная разведка релизов",
    title: "Что требует действия сегодня",
    subtitle: "Только проверенные возможности. Новости и ранние сигналы находятся ниже и не маскируются под доступный товар.",
    active: "Активных действий", upcoming: "Ближайших событий", verified: "Проверка BUY NOW", verifiedValue: "Строгая", scan: "Последний сбор",
    noAction: "Сейчас нет подтверждённой покупки",
    noActionText: "Это нормальный результат проверки: радар не нашёл товар с одновременно активной кнопкой, разрешённым продавцом, подтверждённой ценой и доставкой.",
    noActionCta: "Посмотреть, что готовится", intel: "Свежая разведка",
    intelText: "Анонсы, официальные публикации и ранние признаки спроса. Они требуют проверки и ещё не являются командой покупать.",
    allNews: "Все новости", source: "Открыть источники", sourceHealth: "Состояние источников", sourcesOk: "работают", sourcesIssue: "требуют внимания", refresh: "Обновить", alerts: "Алерты", emptyNews: "Свежих подтверждённых публикаций пока нет.",
  },
  en: {
    eyebrow: "Personal release intelligence", title: "What needs action today",
    subtitle: "Verified opportunities only. News and early signals stay below and never pretend to be purchasable products.",
    active: "Active actions", upcoming: "Upcoming events", verified: "BUY NOW gate", verifiedValue: "Strict", scan: "Last sweep",
    noAction: "No confirmed purchase right now",
    noActionText: "That is a valid radar result: nothing currently has an active CTA, approved seller, confirmed price and regional delivery at the same time.",
    noActionCta: "See what is coming", intel: "Latest intelligence",
    intelText: "Announcements, official posts and early demand. These require verification and are not buy commands yet.",
    allNews: "All news", source: "Open sources", sourceHealth: "Source health", sourcesOk: "healthy", sourcesIssue: "need attention", refresh: "Refresh", alerts: "Alerts", emptyNews: "No fresh verified publications yet.",
  },
};

function NewsCard({ item, lang }: { item: NewsItem; lang: "ru" | "en" }) {
  const observed = new Date(item.observedAt);
  const hasImage = Boolean(item.imageUrl);
  return (
    <article className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#14171c] transition hover:-translate-y-0.5 hover:border-white/20">
      <div className={`relative overflow-hidden bg-[#1b1f26] ${hasImage ? "aspect-[16/9]" : "h-20"}`}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(201,255,83,.16),transparent_42%),linear-gradient(135deg,#20252d,#111318)]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">{item.kind}</span>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-[17px] font-semibold leading-6 text-white">{item.headline}</h3>
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
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/radar" aria-label={lang === "ru" ? "Все разделы" : "All sections"} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/25 hover:text-white"><Menu size={16} /></Link><Link href="/news" className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white sm:inline-flex"><Newspaper className="mr-2" size={14} />{c.allNews}</Link><Link href="/notifications" aria-label={c.alerts} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65"><Bell size={16} /></Link><div className="flex rounded-full border border-white/10 p-1 text-[10px] font-bold">{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={`rounded-full px-2.5 py-1 ${lang === l ? "bg-white text-black" : "text-white/40"}`}>{l.toUpperCase()}</button>)}</div></div>
        </div>
      </header>

      <main className={`mx-auto max-w-[1500px] px-4 pb-20 pt-8 transition-opacity sm:px-8 lg:px-12 ${isPending ? "opacity-50" : ""}`}>
        <section className="grid gap-8 border-b border-white/10 pb-9 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9ff53]">{c.eyebrow}</div><h1 className="max-w-[820px] text-balance text-[36px] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[54px] lg:text-[68px]">{c.title}</h1><p className="mt-5 max-w-[720px] text-sm leading-6 text-white/48 sm:text-[15px]">{c.subtitle}</p></div><button onClick={onRetry} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/65 transition hover:border-white/25 hover:text-white"><RefreshCw size={14} />{c.refresh}</button></section>

        <section className="my-7 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 lg:grid-cols-4">
          {[[c.active, signals.filter((s) => s.status === "buy" || s.status === "apply").length, CheckCircle2], [c.upcoming, upcomingCount, CalendarDays], [c.verified, c.verifiedValue, ShieldCheck], [c.scan, payload ? clockLabel(payload.scannedAt) : "—", RefreshCw]].map(([label, value, Icon]) => { const StatIcon = Icon as typeof CheckCircle2; return <div key={String(label)} className="bg-[#111419] p-4 sm:p-5"><StatIcon size={15} className="mb-5 text-[#c9ff53]" /><div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{String(label)}</div><div className="mt-1.5 text-xl font-bold tracking-[-0.03em]">{String(value)}</div></div>; })}
        </section>

        {isStale && payload && <StaleBanner at={clockLabel(payload.scannedAt)} onRefresh={onRetry} />}
        {error && !payload ? <FeedError reason={error} onRetry={onRetry} /> : <>
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">{FILTER_IDS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${filter === f.id ? "bg-[#c9ff53] text-black" : "border border-white/10 bg-white/[.025] text-white/48 hover:text-white"}`}>{f[lang]}</button>)}</nav>
          <section className="mt-5">{visible.length ? <div><SignalHero signal={hero} now={now} onAction={(id, action) => onAction?.(id, action)} />{rest.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rest.map((s) => <SignalCard key={s.id} signal={s} now={now} onAction={(id, action) => onAction?.(id, action)} />)}</div>}</div> : <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#12151a] p-7 sm:p-10"><div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#c9ff53]/[.06] blur-3xl" /><div className="relative max-w-[680px]"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c9ff53]/10 text-[#c9ff53]"><ShieldCheck size={23} /></div><h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{c.noAction}</h2><p className="mt-3 text-sm leading-6 text-white/48">{c.noActionText}</p><button onClick={() => setFilter("soon")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-black">{c.noActionCta}<ArrowUpRight size={14} /></button></div></div>}</section>
          <section className="mt-14 border-t border-white/10 pt-9"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9ff53]">Intelligence feed</div><h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">{c.intel}</h2><p className="mt-2 max-w-[700px] text-sm leading-6 text-white/45">{c.intelText}</p></div><Link href="/news" className="inline-flex items-center gap-2 text-xs font-bold text-white/70">{c.allNews}<ArrowUpRight size={14} /></Link></div>{news.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{news.map((item) => <NewsCard key={item.id} item={item} lang={lang} />)}</div> : <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-sm text-white/40">{c.emptyNews}</div>}</section>
          <section className="mt-12 flex flex-col justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">{c.sourceHealth}</div><div className="mt-1 text-xs text-white/40"><span className="text-[#8fe0aa]">{healthySources} {c.sourcesOk}</span>{troubledSources > 0 && <span> · {troubledSources} {c.sourcesIssue}</span>}</div></div><Link href="/sources" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">{c.source}<ArrowUpRight size={13} /></Link></section>
        </>}
      </main>
    </div>
  );
}
