"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, Menu, Newspaper, Plus, Radar, RefreshCw, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { FeedPayload, NewsItem, RadarCategory } from "@/lib/radar/types";
import { derive, sortSignals } from "@/lib/radar/derive";
import { clockLabel } from "@/lib/radar/format";
import { decodeHtmlEntities } from "@/lib/radar/text";
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
  { id: "lego" as const, ru: "LEGO / Mega", en: "LEGO / Mega" },
  { id: "vintage" as const, ru: "Vintage", en: "Vintage" },
  { id: "luxury" as const, ru: "Luxury", en: "Luxury" },
  { id: "fragrance" as const, ru: "Духи", en: "Fragrance" },
  { id: "collectibles" as const, ru: "Коллекционное", en: "Collectibles" },
];

const NEWS_CATEGORIES: Partial<Record<RadarCategory, string[]>> = {
  watches: ["watches"],
  tech: ["gaming", "technology", "tech", "gpu", "cameras"],
  sneakers: ["sneakers", "streetwear"],
  cars: ["cars", "automobiles"],
  lego: ["lego"],
  vintage: ["vintage"],
  luxury: ["luxury", "jewelry", "chrome-hearts"],
  fragrance: ["fragrance"],
  collectibles: ["collectibles", "sports"],
  clearance: ["clearance"],
};

const COPY = {
  ru: {
    eyebrow: "Opportunity intelligence · Miami / Moscow / Dubai",
    title: "Где сегодня есть деньги",
    subtitle: "Не каталог релизов: проверенная цена входа, фактические продажи, чистый спред, ликвидность и конкретное действие.",
    active: "Активных действий", upcoming: "Ближайших событий", verified: "Проверка BUY NOW", verifiedValue: "Строгая", scan: "Последний сбор",
    noAction: "Сейчас нет сделки, прошедшей все проверки",
    noActionText: "Это не пустая лента: капитал остаётся свободным, пока нет одновременно доступности, цены входа, доказанных продаж и чистой маржи.",
    noActionCta: "Открыть ближайшие возможности", intel: "Новости рынка и истории сделок",
    intelText: "Новые релизы, дефицит, индустрия перепродажи и реальные кейсы заработка. Новости дают контекст, но не маскируются под подтверждённый BUY NOW.",
    allNews: "Все новости", submit: "Прислать", source: "Открыть источники", sourceHealth: "Состояние источников", sourcesOk: "работают", sourcesIssue: "требуют внимания", refresh: "Обновить", alerts: "Алерты", emptyNews: "Свежих подтверждённых публикаций пока нет.",
  },
  en: {
    eyebrow: "Opportunity intelligence · Miami / Moscow / Dubai", title: "Where the money is today",
    subtitle: "Not a release catalog: verified entry cost, completed sales, net spread, liquidity and one clear action.",
    active: "Active actions", upcoming: "Upcoming events", verified: "BUY NOW gate", verifiedValue: "Strict", scan: "Last sweep",
    noAction: "No deal passes every gate right now",
    noActionText: "This is not an empty feed: capital stays free until availability, entry price, completed sales and net margin are confirmed together.",
    noActionCta: "Open upcoming opportunities", intel: "Market news and resale stories",
    intelText: "New releases, scarcity, resale industry moves and documented profit stories. Editorial context never masquerades as a verified BUY NOW.",
    allNews: "All news", submit: "Submit", source: "Open sources", sourceHealth: "Source health", sourcesOk: "healthy", sourcesIssue: "need attention", refresh: "Refresh", alerts: "Alerts", emptyNews: "No fresh verified publications yet.",
  },
};

function NewsCard({ item, lang, featured = false }: { item: NewsItem; lang: "ru" | "en"; featured?: boolean }) {
  const observed = new Date(item.observedAt);
  const headline = decodeHtmlEntities(item.headline);
  return (
    <article className={`group overflow-hidden rounded-[22px] border border-white/10 bg-[#14171c] transition hover:-translate-y-0.5 hover:border-white/20 ${featured ? "md:grid md:grid-cols-[1.25fr_.75fr] xl:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden bg-[#1b1f26] ${featured ? "min-h-[220px]" : "aspect-[16/10]"}`}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="absolute inset-0 flex items-end bg-[radial-gradient(circle_at_16%_0%,rgba(198,166,107,.18),transparent_42%),linear-gradient(135deg,#20201f,#111113)] p-5 text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">{item.source}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">{item.category ? `${item.kind} · ${item.category}` : item.kind}</span>
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-end sm:p-7" : ""}`}>
        <h3 className={`line-clamp-3 font-semibold leading-tight text-white ${featured ? "text-[22px] sm:text-[26px]" : "text-[17px]"}`}>{headline}</h3>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-white/45"><span className="truncate">{item.source}</span><span className="shrink-0">{observed.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric" })}</span></div>
        {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#36d98a]">{lang === "ru" ? "Открыть источник" : "Open source"}<ArrowUpRight size={13} /></a>}
      </div>
    </article>
  );
}

function MobileNewsRail({ items, lang }: { items: NewsItem[]; lang: "ru" | "en" }) {
  const visualItems = items.filter((item) => item.imageUrl && item.sourceUrl).slice(0, 3);
  if (!visualItems.length) return null;
  return (
    <section className="mt-7 border-y border-white/10 py-6 lg:hidden">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><div className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#36d98a]">Market wire</div><h2 className="mt-1 font-rr-editorial text-[28px] font-semibold">{lang === "ru" ? "Новости рынка" : "Market news"}</h2></div>
        <Link href="/news" className="mb-1 shrink-0 text-[11px] font-semibold text-white/60">{lang === "ru" ? "Все" : "All"} ↗</Link>
      </div>
      <div className="grid gap-2.5">
        {visualItems.map((item) => (
          <a key={item.id} href={item.sourceUrl ?? "/news"} target={item.sourceUrl ? "_blank" : undefined} rel={item.sourceUrl ? "noreferrer" : undefined} className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] overflow-hidden rounded-[16px] border border-white/10 bg-[#14171c]">
            <div className="relative min-h-[96px] bg-[#1b1f26]">
              <img src={item.imageUrl} alt={decodeHtmlEntities(item.headline)} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[8px] font-bold tracking-[.12em] text-white/75">{item.category ? `${item.kind} · ${item.category}` : item.kind}</span>
            </div>
            <div className="flex min-w-0 flex-col justify-between p-3"><h3 className="line-clamp-3 break-words text-[13px] font-semibold leading-[1.35] text-white">{decodeHtmlEntities(item.headline)}</h3><div className="mt-2 truncate text-[10px] text-white/38">{item.source}</div></div>
          </a>
        ))}
      </div>
      <Link href="/now/add" className="mt-4 flex items-center justify-between rounded-[16px] border border-[#36d98a]/25 bg-[#36d98a]/[.07] px-4 py-3.5 text-[12px] font-semibold text-[#68efad]"><span>{lang === "ru" ? "Добавить товар со скриншота" : "Add an item from a screenshot"}</span><ArrowUpRight size={14} /></Link>
    </section>
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
  const manualSources = payload?.sources.filter((s) => s.state === "manual").length ?? 0;
  const troubledSources = payload?.sources.filter((s) => s.state === "down" || s.state === "throttled").length ?? 0;
  const news = payload?.newsItems.filter((item) => item.imageUrl && item.sourceUrl).slice(0, 6) ?? [];
  const categoryNews = useMemo(() => {
    const all = payload?.newsItems.filter((item) => item.imageUrl && item.sourceUrl) ?? [];
    const categories = NEWS_CATEGORIES[filter];
    return (categories ? all.filter((item) => item.category && categories.includes(item.category)) : all).slice(0, 9);
  }, [payload?.newsItems, filter]);
  const [hero, ...rest] = visible;

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#0b0b0c] font-rr-sans text-[#f3efe8]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#36d98a]/45 bg-[#36d98a]/10 text-[#68efad] shadow-[0_0_28px_rgba(54,217,138,.12)]"><Radar size={19} strokeWidth={2} /></div><div className="min-w-0"><div className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em]">Release Radar</div><div className="hidden text-[10px] uppercase tracking-[0.18em] text-white/35 sm:block">Private buying desk · Miami</div></div></div>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/radar" aria-label={lang === "ru" ? "Все разделы" : "All sections"} className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/25 hover:text-white sm:flex"><Menu size={16} /></Link><Link href="/now/add" aria-label={lang === "ru" ? "Добавить сигнал" : "Add signal"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ece5d9] px-3 text-xs font-bold text-[#171513] sm:gap-2 sm:px-3.5"><Plus size={14} /><span>{c.submit}</span></Link><Link href="/news" aria-label={c.allNews} className="hidden h-9 items-center gap-2 rounded-full border border-white/10 px-2.5 text-xs text-white/65 transition hover:border-white/25 hover:text-white sm:inline-flex lg:px-4"><Newspaper size={14} /><span className="hidden lg:inline">{c.allNews}</span></Link><Link href="/notifications" aria-label={c.alerts} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/65"><Bell size={16} /></Link><div className="hidden rounded-full border border-white/10 p-1 text-[10px] font-bold sm:flex">{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={`rounded-full px-2.5 py-1 ${lang === l ? "bg-[#ece5d9] text-[#171513]" : "text-white/40"}`}>{l.toUpperCase()}</button>)}</div></div>
        </div>
        <div className="hidden border-t border-white/[.055] bg-[#0e0e0f] sm:block">
          <div className="mx-auto flex max-w-[1500px] items-center gap-4 overflow-hidden px-4 py-2.5 sm:px-8 lg:px-12">
            <Link href="/news" className="shrink-0 text-[9px] font-bold uppercase tracking-[.2em] text-[#36d98a]">{lang === "ru" ? "Лента рынка" : "Market wire"}</Link>
            <div className="h-3 w-px shrink-0 bg-white/10" />
            <div className="flex min-w-0 gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {news.slice(0, 4).map((item) => <a key={item.id} href={item.sourceUrl ?? "/news"} target={item.sourceUrl ? "_blank" : undefined} rel={item.sourceUrl ? "noreferrer" : undefined} className="flex shrink-0 items-center gap-2 text-[11px] text-white/58 transition hover:text-white"><span className="max-w-[280px] truncate sm:max-w-[420px]">{decodeHtmlEntities(item.headline)}</span><ArrowUpRight size={11} className="text-[#36d98a]" /></a>)}
              {news.length === 0 && <span className="text-[11px] text-white/35">{c.emptyNews}</span>}
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-[1500px] px-4 pb-20 pt-6 transition-opacity sm:px-8 sm:pt-8 lg:px-12 ${isPending ? "opacity-50" : ""}`}>
        <section className="grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end"><div><div className="mb-3 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c6a66b] sm:block">{c.eyebrow}</div><h1 className="max-w-[760px] text-balance font-rr-editorial text-[38px] font-semibold leading-[.94] tracking-[-0.035em] sm:text-[64px] lg:text-[74px]">{c.title}</h1><p className="mt-4 max-w-[700px] text-[13px] leading-5 text-white/48 sm:mt-5 sm:text-sm sm:leading-6">{c.subtitle}</p></div><div className="grid grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-white/10 bg-white/10"><div className="min-w-0 bg-[#121212] p-3 sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-white/35 sm:text-[9px] sm:tracking-[.15em]">{c.active}</div><div className="mt-2 text-xl font-semibold sm:text-2xl">{signals.filter((s) => s.status === "buy" || s.status === "apply").length}</div></div><div className="min-w-0 bg-[#121212] p-3 sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-white/35 sm:text-[9px] sm:tracking-[.15em]">{c.upcoming}</div><div className="mt-2 text-xl font-semibold sm:text-2xl">{upcomingCount}</div></div><button onClick={onRetry} className="min-w-0 bg-[#121212] p-3 text-left transition hover:bg-[#181716] sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-white/35 sm:text-[9px] sm:tracking-[.15em]">{c.scan}</div><div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold sm:text-sm"><RefreshCw size={12} />{payload ? clockLabel(payload.scannedAt) : "—"}</div></button></div></section>

        {isStale && payload && <StaleBanner at={clockLabel(payload.scannedAt)} onRefresh={onRetry} />}
        {error && !payload ? <FeedError reason={error} onRetry={onRetry} /> : <>
          <MobileNewsRail items={news} lang={lang} />
          <div className="py-4 sm:hidden"><label htmlFor="radar-filter" className="mb-2 block text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">{lang === "ru" ? "Раздел радара" : "Radar section"}</label><select id="radar-filter" value={filter} onChange={(event) => setFilter(event.target.value as RadarCategory)} className="w-full appearance-none rounded-[14px] border border-white/12 bg-[#151515] px-4 py-3 text-[13px] font-semibold text-white outline-none">{FILTER_IDS.map((f) => <option key={f.id} value={f.id}>{f[lang]}</option>)}</select></div>
          <nav className="hidden gap-2 overflow-x-auto py-2 sm:flex">{FILTER_IDS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${filter === f.id ? "bg-[#ece5d9] text-[#171513]" : "border border-white/10 bg-white/[.025] text-white/48 hover:text-white"}`}>{f[lang]}</button>)}</nav>
          <section className="mt-1 sm:mt-5">{visible.length ? <div><SignalHero signal={hero} now={now} onAction={(id, action) => onAction?.(id, action)} />{rest.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rest.map((s) => <SignalCard key={s.id} signal={s} now={now} onAction={(id, action) => onAction?.(id, action)} />)}</div>}</div> : categoryNews.length ? <div><div className="mb-5 flex flex-col justify-between gap-3 rounded-[16px] border border-[#c6a66b]/20 bg-[#c6a66b]/[.055] p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#c6a66b]" /><div><div className="text-sm font-semibold">{lang === "ru" ? "Радар нашёл новые позиции — идёт проверка сделки" : "Radar found new items — deal verification is in progress"}</div><div className="mt-1 text-xs leading-5 text-white/45">{lang === "ru" ? "Фото и ссылки взяты из живых источников. Эти позиции ещё не BUY NOW: цена, checkout и реальные продажи проверяются отдельно." : "Images and links come from live sources. These are not BUY NOW yet: price, checkout and completed sales are verified separately."}</div></div></div><span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{categoryNews.length} {lang === "ru" ? "сигналов" : "signals"}</span></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{categoryNews.map((item, index) => <NewsCard key={item.id} item={item} lang={lang} featured={index === 0 && categoryNews.length > 2} />)}</div></div> : <div className="rounded-[18px] border border-white/10 bg-[#121212] p-5 sm:p-7"><div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#c6a66b]" /><div><h2 className="text-base font-semibold">{c.noAction}</h2><p className="mt-1 max-w-[760px] text-[13px] leading-5 text-white/45">{c.noActionText}</p></div></div></div>}</section>
          <section className="mt-14 hidden border-t border-white/10 pt-9 lg:block"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6a66b]">Intelligence → opportunity</div><h2 className="mt-2 font-rr-editorial text-4xl font-semibold tracking-[-0.025em]">{c.intel}</h2><p className="mt-2 max-w-[700px] text-sm leading-6 text-white/45">{c.intelText}</p></div><Link href="/news" className="inline-flex items-center gap-2 text-xs font-bold text-white/70">{c.allNews}<ArrowUpRight size={14} /></Link></div>{news.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{news.map((item, index) => <NewsCard key={item.id} item={item} lang={lang} featured={index === 0} />)}</div> : <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-sm text-white/40">{c.emptyNews}</div>}</section>
          <section className="mt-12 flex flex-col justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">{c.sourceHealth}</div><div className="mt-1 text-xs text-white/40"><span className="text-[#8fe0aa]">{healthySources} {lang === "ru" ? "автоматически проверены" : "checked automatically"}</span><span> · {manualSources} {lang === "ru" ? "ожидают первого автоматического обхода" : "awaiting first automated sweep"}</span><span> · {payload?.sources.length ?? 0} {lang === "ru" ? "всего" : "total"}</span>{troubledSources > 0 && <span> · {troubledSources} {c.sourcesIssue}</span>}</div></div><Link href="/sources" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">{c.source}<ArrowUpRight size={13} /></Link></section>
        </>}
      </main>
    </div>
  );
}
