"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bell, Menu, Newspaper, Plus, Radar, RefreshCw, ShieldCheck } from "lucide-react";
import { useLanguage, type Lang, type Market } from "@/lib/i18n";
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
  { id: "now" as const, ru: "Сейчас", en: "Now", ar: "الآن" },
  { id: "soon" as const, ru: "Скоро", en: "Upcoming", ar: "قريباً" },
  { id: "restock" as const, ru: "Рестоки", en: "Restocks", ar: "إعادة التوفر" },
  { id: "trend" as const, ru: "Спрос", en: "Demand", ar: "الطلب" },
  { id: "clearance" as const, ru: "Clearance", en: "Clearance", ar: "التخفيضات" },
  { id: "watches" as const, ru: "Часы", en: "Watches", ar: "الساعات" },
  { id: "tech" as const, ru: "Tech & Gaming", en: "Tech & Gaming", ar: "التقنية والألعاب" },
  { id: "sneakers" as const, ru: "Sneakers", en: "Sneakers", ar: "الأحذية" },
  { id: "cars" as const, ru: "Авто", en: "Cars", ar: "السيارات" },
  { id: "lego" as const, ru: "LEGO / Mega", en: "LEGO / Mega", ar: "LEGO / Mega" },
  { id: "vintage" as const, ru: "Vintage", en: "Vintage", ar: "فينتج" },
  { id: "luxury" as const, ru: "Luxury", en: "Luxury", ar: "فاخر" },
  { id: "fragrance" as const, ru: "Духи", en: "Fragrance", ar: "العطور" },
  { id: "collectibles" as const, ru: "Коллекционное", en: "Collectibles", ar: "المقتنيات" },
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
    intelText: "Новые релизы, дефицит, индустрия перепродажи и реальные кейсы заработка. Новости дают контекст, но не подменяют подтверждённый BUY NOW.",
    allNews: "Все новости", submit: "Прислать", source: "Открыть источники", sourceHealth: "Состояние источников", sourcesOk: "работают", sourcesIssue: "требуют внимания", refresh: "Обновить", alerts: "Алерты", emptyNews: "Свежих новостей пока нет",
    emptySignals: "Нет активных сигналов", emptySignalsText: "Нет сигналов, прошедших все проверки.",
  },
  en: {
    eyebrow: "Opportunity intelligence · Miami / Moscow / Dubai", title: "Where the money is today",
    subtitle: "Not a release catalog: verified entry cost, completed sales, net spread, liquidity and one concrete action.",
    active: "Active actions", upcoming: "Upcoming events", verified: "BUY NOW gate", verifiedValue: "Strict", scan: "Last scan",
    noAction: "No deal passes every gate right now",
    noActionText: "This is not an empty feed: capital stays free until availability, entry price, completed sales and net margin line up together.",
    noActionCta: "Open upcoming opportunities", intel: "Market news and resale stories",
    intelText: "New releases, scarcity, resale industry moves and documented profit stories. Editorial context never replaces a confirmed BUY NOW.",
    allNews: "All news", submit: "Submit", source: "Open sources", sourceHealth: "Source health", sourcesOk: "healthy", sourcesIssue: "need attention", refresh: "Refresh", alerts: "Alerts", emptyNews: "No fresh news yet",
    emptySignals: "No active signals", emptySignalsText: "No signals passed every gate.",
  },
  ar: {
    eyebrow: "استخبارات الفرص · ميامي / موسكو / دبي", title: "أين توجد الفرصة اليوم",
    subtitle: "ليس كتالوج إصدارات: سعر دخول موثّق، ومبيعات مكتملة، وهامش صافٍ، وسيولة، وإجراء واحد محدد.",
    active: "إجراءات نشطة", upcoming: "أحداث قادمة", verified: "بوابة الشراء", verifiedValue: "صارمة", scan: "آخر مسح",
    noAction: "لا توجد صفقة تجتاز جميع الشروط الآن", noActionText: "يبقى رأس المال حراً حتى يتأكد التوفر وسعر الدخول والمبيعات المكتملة والهامش الصافي معاً.",
    noActionCta: "افتح أقرب الفرص", intel: "أخبار السوق وقصص إعادة البيع", intelText: "إصدارات جديدة وندرة وتحركات السوق وقصص ربح موثقة. السياق التحريري لا يغني عن تأكيد الشراء.",
    allNews: "كل الأخبار", submit: "إرسال", source: "فتح المصادر", sourceHealth: "حالة المصادر", sourcesOk: "تعمل", sourcesIssue: "تحتاج انتباهاً", refresh: "تحديث", alerts: "تنبيهات", emptyNews: "لا أخبار جديدة بعد",
    emptySignals: "لا إشارات نشطة", emptySignalsText: "لا توجد إشارات تجتاز جميع الشروط.",
  },
};

const tr = (lang: Lang, ru: string, en: string, ar: string) => lang === "ru" ? ru : lang === "ar" ? ar : en;

function NewsCard({ item, lang, featured = false }: { item: NewsItem; lang: Lang; featured?: boolean }) {
  const observed = new Date(item.observedAt);
  const headline = decodeHtmlEntities(item.headline);
  return (
    <article className={`group overflow-hidden rounded-[22px] border border-rr-frame bg-rr-surface transition hover:border-rr-ghost ${featured ? "grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`}>
      <div className={`relative overflow-hidden bg-rr-surface-hi ${featured ? "min-h-[220px]" : "aspect-[16/9]"}`}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-rr-muted"><Newspaper size={32} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-rr-frame bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-white">{item.category}</span>
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-end sm:p-7" : ""}`}>
        <h3 className={`line-clamp-3 font-semibold leading-tight text-rr-text ${featured ? "text-[22px] sm:text-[26px]" : "text-[17px]"}`}>{headline}</h3>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-rr-muted"><span className="truncate">{observed.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "long", day: "numeric" })} · {item.source}</span></div>
        {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-rr-accent">{tr(lang, "Открыть", "Open", "فتح")}<ArrowUpRight size={13} /></a>}
      </div>
    </article>
  );
}

function ReleaseCard({ item, lang, now }: { item: NewsItem; lang: Lang; now: number | null }) {
  const launchAt = item.launchAt ? new Date(item.launchAt) : null;
  const msLeft = launchAt !== null && now !== null ? launchAt.getTime() - now : null;
  const countdown = msLeft !== null && msLeft > 0 ? formatCountdown(msLeft) : null;
  const dateStr = launchAt ? launchAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "long", day: "numeric" }) : null;
  const timeStr = launchAt ? launchAt.toLocaleTimeString(lang === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : null;
  return (
    <article className="group overflow-hidden rounded-[20px] border border-rr-frame bg-rr-surface transition hover:border-rr-ghost">
      <div className="relative aspect-[16/10] overflow-hidden bg-rr-surface-hi">
        {item.imageUrl ? <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-rr-muted"><Newspaper size={32} /></div>}
        {countdown && <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">{countdown}</div>}
      </div>
      <div className="p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rr-accent">{item.category}</div>
        <h3 className="mt-2 text-[17px] font-semibold leading-tight text-rr-text">{decodeHtmlEntities(item.headline)}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-rr-muted">
          {dateStr && <span>{dateStr}{timeStr ? ` · ${timeStr}` : ""}</span>}
          {item.priceUsd != null && <span className="font-semibold text-rr-text">${item.priceUsd.toLocaleString()}</span>}
          {item.retailer && <span>{item.retailer}</span>}
        </div>
        {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-rr-accent">{tr(lang, "Открыть", "Open", "فتح")}<ArrowUpRight size={13} /></a>}
      </div>
    </article>
  );
}

function formatCountdown(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function MobileNewsRail({ items, lang }: { items: NewsItem[]; lang: Lang }) {
  const visualItems = items.filter((item) => item.imageUrl && item.sourceUrl).slice(0, 3);
  if (!visualItems.length) return null;
  return (
    <section className="mt-7 border-y border-rr-frame py-6 lg:hidden">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><div className="text-[9px] font-semibold uppercase tracking-[.2em] text-rr-accent">Market wire</div></div>
        <Link href="/news" className="mb-1 shrink-0 text-[11px] font-semibold text-rr-text-dim">{tr(lang, "Все новости", "All news", "كل الأخبار")}</Link>
      </div>
      <div className="grid gap-2.5">
        {visualItems.map((item) => (
          <a key={item.id} href={item.sourceUrl ?? "/news"} target={item.sourceUrl ? "_blank" : undefined} rel={item.sourceUrl ? "noreferrer" : undefined} className="grid grid-cols-[110px_minmax(0,1fr)] overflow-hidden rounded-[14px] border border-rr-frame bg-rr-surface">
            <div className="relative min-h-[96px] bg-rr-surface-hi">
              <img src={item.imageUrl} alt={decodeHtmlEntities(item.headline)} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[8px] font-bold tracking-[.14em] text-white">{item.category}</span>
            </div>
            <div className="flex min-w-0 flex-col justify-between p-3"><h3 className="line-clamp-3 break-words text-[13px] font-semibold leading-5 text-rr-text">{decodeHtmlEntities(item.headline)}</h3></div>
          </a>
        ))}
      </div>
      <Link href="/now/add" className="mt-4 flex items-center justify-between rounded-[16px] border border-rr-accent/30 bg-rr-accent-soft px-4 py-3 text-[13px] font-semibold text-rr-accent"><span>{tr(lang, "Прислать", "Submit", "إرسال")}</span><Plus size={16} /></Link>
    </section>
  );
}

function PremiumOpportunityHero({ item, lang }: { item: NewsItem; lang: Lang }) {
  return (
    <article className="relative isolate min-h-[470px] overflow-hidden rounded-[26px] border border-rr-frame bg-rr-surface">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(239,233,223,.98)_0%,rgba(239,233,223,.72)_46%,rgba(239,233,223,.1)_100%)]" />
      <div className="relative flex min-h-[470px] max-w-[720px] flex-col justify-center px-6 py-12 text-[#1b1916]">
        <div className="mb-6 inline-flex w-fit rounded-full border border-black/10 bg-white/60 px-4 py-2 text-[11px] font-bold uppercase tracking-[.16em]">{tr(lang, "Проверка BUY NOW", "BUY NOW gate", "بوابة الشراء")}</div>
        <h2 className="max-w-[610px] text-balance font-rr-editorial text-[42px] font-semibold leading-[.96] tracking-[-0.02em]">{decodeHtmlEntities(item.headline)}</h2>
        <p className="mt-6 max-w-[520px] text-[15px] leading-6 text-black/60">{lang === "ru" ? "Alertyy — проверяем каждую позицию перед публикацией." : "Alertyy — every position is verified before publishing."}</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href={item.sourceUrl ?? "/news"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#1b1916] px-5 py-2.5 text-sm font-semibold text-white">{tr(lang, "Открыть", "Open", "فتح")}<ArrowUpRight size={14} /></a></div>
      </div>
      <div className="absolute bottom-5 right-5 hidden w-[310px] rounded-[18px] border border-white/55 bg-white/80 p-4 text-[#1b1916] shadow-[0_18px_60px_rgba(0,0,0,.24)] backdrop-blur-xl md:block"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em] text-black/45"><span>Alertyy</span><span>{lang === "ru" ? "только что" : "just now"}</span></div><div className="mt-3 text-sm font-bold leading-5">{decodeHtmlEntities(item.headline)}</div><div className="mt-2 text-xs text-black/50">{item.source} · {item.category}</div></div>
    </article>
  );
}

export function RadarFeed({ payload, error, isStale = false, isPending = false, onRetry, onAction }: {
  payload: FeedPayload | null;
  error?: string | null;
  isStale?: boolean;
  isPending?: boolean;
  onRetry: () => void;
  onAction: (id: string, action: SignalAction) => void;
}) {
  const [filter, setFilter] = useState<RadarCategory>("now");
  const now = useNow();
  const { lang, setLang, market, setMarket } = useLanguage();
  const c = COPY[lang];
  const signals = payload?.signals ?? [];
  const visible = useMemo(() => sortSignals(signals.filter((s) => s.categories.includes(filter) && s.imageUrl && s.primaryUrl).map(derive)), [signals, filter]);
  const upcomingCount = signals.filter((s) => s.categories.includes("soon")).length + (payload?.upcomingReleases ?? 0);
  const healthySources = payload?.sources.filter((s) => s.state === "ok").length ?? 0;
  const manualSources = payload?.sources.filter((s) => s.state === "manual").length ?? 0;
  const troubledSources = payload?.sources.filter((s) => s.state === "down" || s.state === "throttled").length ?? 0;
  const news = payload?.newsItems.filter((item) => item.imageUrl && item.sourceUrl).slice(0, 6) ?? [];
  const filterCounts = useMemo(() => {
    const visualNews = payload?.newsItems.filter((item) => item.imageUrl && item.sourceUrl) ?? [];
    return Object.fromEntries(FILTER_IDS.map((item) => {
      const signalCount = signals.filter((signal) => signal.categories.includes(item.id) && signal.imageUrl && signal.primaryUrl).length;
      const newsCategories = NEWS_CATEGORIES[item.id];
      const newsCount = item.id === "now"
        ? visualNews.length
        : newsCategories
          ? visualNews.filter((newsItem) => newsItem.category && newsCategories.includes(newsItem.category)).length
          : 0;
      return [item.id, Math.max(signalCount, newsCount)];
    })) as Record<RadarCategory, number>;
  }, [payload?.newsItems, signals]);
  const availableFilters = useMemo(
    () => FILTER_IDS.filter((item) => item.id === "now" || filterCounts[item.id] > 0),
    [filterCounts],
  );
  const categoryNews = useMemo(() => {
    const all = payload?.newsItems.filter((item) => item.imageUrl && item.sourceUrl) ?? [];
    const categories = NEWS_CATEGORIES[filter];
    return (categories ? all.filter((item) => item.category && categories.includes(item.category)) : all).slice(0, 3);
  }, [payload?.newsItems, filter]);
  const [hero, ...rest] = visible;
  const releaseItems = useMemo(() => (payload?.newsItems ?? []).filter((item) => item.kind === "RELEASE" && item.launchAt && new Date(item.launchAt).getTime() > Date.now() - 86400000).slice(0, 6), [payload?.newsItems]);
  // The premium hero is a buying-desk spotlight: it only ever features a
  // product-linked item (a confirmed release or a computed signal). Pure
  // editorial news never masquerades as a live signal — when there is no
  // product news, the feed honestly says no deal passes the gates yet.
  const heroCandidate = categoryNews.find((item) => item.kind === "RELEASE" || item.kind === "SIGNAL") ?? null;
  const heroRest = heroCandidate ? categoryNews.filter((item) => item.id !== heroCandidate.id) : categoryNews;
const renderedIds = useMemo(()=>{
const ids=new Set<string>();
visible.forEach((s)=> ids.add("signal:"+ s.id));
if(heroCandidate)ids.add(heroCandidate.id);
return ids;
},[visible, heroCandidate]);
  const uniqueNews = useMemo(() => news.filter((item) => !renderedIds.has(item.id)), [news, renderedIds]);
  useEffect(() => {
    if (!availableFilters.some((item) => item.id === filter)) setFilter("now");
  }, [availableFilters, filter]);
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-rr-bg font-rr-sans text-rr-text">
      <header className="sticky top-0 z-40 border-b border-rr-frame bg-rr-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rr-accent/45 bg-rr-accent-soft text-rr-accent shadow-[0_6px_24px_rgba(180,120,60,.16)]"><Radar size={19} /></div>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/radar" aria-label={tr(lang, "Все разделы", "All sections", "كل الأقسام")} className="hidden h-9 w-9 items-center justify-center rounded-full border border-rr-frame text-rr-muted transition hover:border-rr-ghost hover:text-rr-text sm:inline-flex"><Menu size={16} /></Link></div></div>
        </div>
        <div className="hidden border-t border-rr-frame bg-rr-deep sm:block">
          <div className="mx-auto flex max-w-[1500px] items-center gap-4 overflow-hidden px-4 py-2.5 sm:px-8 lg:px-12">
            <Link href="/news" className="shrink-0 text-[9px] font-bold uppercase tracking-[.2em] text-rr-accent">{tr(lang, "Лента рынка", "Market wire", "شريط السوق")}</Link>
            <div className="h-3 w-px shrink-0 bg-rr-hair" />
            <div className="flex min-w-0 gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {news.slice(0, 4).map((item) => <a key={item.id} href={item.sourceUrl ?? "/news"} target={item.sourceUrl ? "_blank" : undefined} rel={item.sourceUrl ? "noreferrer" : undefined} className="flex shrink-0 items-center gap-2 text-[11px] text-rr-muted transition hover:text-rr-text"><span className="h-1 w-1 shrink-0 rounded-full bg-rr-accent" />{decodeHtmlEntities(item.headline)}</a>)}
              {news.length === 0 && <span className="text-[11px] text-rr-muted">{c.emptyNews}</span>}
            </div>
          </div>
        </div>
      </header>
      <main className={`mx-auto max-w-[1500px] px-4 pb-20 pt-6 transition-opacity sm:px-8 sm:pt-8 lg:px-12${isPending ? " opacity-50" : ""}`}>
        <section className="grid gap-6 border-b border-rr-frame pb-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end"><div><div className="mb-3 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-rr-prepare sm:block">{c.eyebrow}</div><h1 className="max-w-[760px] text-balance font-rr-editorial text-[28px] font-semibold leading-[.94] tracking-[-0.035em] sm:text-[40px] lg:text-[44px]">{c.title}</h1><p className="mt-4 max-w-[700px] text-[13px] leading-5 text-rr-muted sm:mt-5 sm:text-sm sm:leading-6">{c.subtitle}</p></div><div className="grid grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-rr-frame bg-rr-hair"><div className="min-w-0 bg-rr-surface p-3 sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-rr-muted sm:text-[9px] sm:tracking-[.15em]">{c.active}</div><div className="mt-2 text-xl font-semibold sm:text-2xl">{signals.filter((s) => s.status === "buy" || s.status === "apply").length}</div></div><div className="min-w-0 bg-rr-surface p-3 sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-rr-muted sm:text-[9px] sm:tracking-[.15em]">{c.upcoming}</div><div className="mt-2 text-xl font-semibold sm:text-2xl">{upcomingCount}</div></div><button onClick={onRetry} className="min-w-0 bg-rr-surface p-3 text-left transition hover:bg-rr-surface-hi sm:p-4"><div className="text-[8px] uppercase tracking-[.11em] text-rr-muted sm:text-[9px] sm:tracking-[.15em]">{c.scan}</div><div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold sm:text-sm"><RefreshCw size={12} />{payload ? clockLabel(payload.scannedAt) : "—"}</div></button></div></section>
        {isStale && payload && <StaleBanner at={clockLabel(payload.scannedAt)} onRefresh={onRetry} />}
        {error && !payload ? <FeedError reason={error} onRetry={onRetry} /> : <>
          <MobileNewsRail items={uniqueNews} lang={lang} />
          <div className="grid gap-2 py-4 sm:hidden"><div className="grid grid-cols-2 gap-2"><select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="rounded-[12px] border border-rr-frame bg-rr-surface px-3 py-2.5 text-[13px] font-semibold text-rr-text"><option value="ru">Русский</option><option value="en">English</option><option value="ar">العربية</option></select><select aria-label="Market" value={market} onChange={(event) => setMarket(event.target.value as Market)} className="rounded-[12px] border border-rr-frame bg-rr-surface px-3 py-2.5 text-[13px] font-semibold text-rr-text"><option value="all">All markets</option></select></div></div>
          <nav className="hidden gap-2 overflow-x-auto py-2 sm:flex">{availableFilters.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${filter === f.id ? "bg-rr-text text-rr-bg" : "border border-rr-frame text-rr-muted hover:border-rr-ghost hover:text-rr-text"}`}>{f[lang]}<span className="ml-1.5 text-[10px] opacity-60">{filterCounts[f.id]}</span></button>)}</nav>
          {releaseItems.length > 0 && <section className="mb-8"><div className="mb-4 flex items-baseline justify-between"><h2 className="font-rr-editorial text-[24px] font-semibold sm:text-[28px]">{tr(lang, "Ближайшие релизы", "Upcoming releases", "الإصدارات القادمة")}</h2><span className="text-[12px] text-rr-muted">{releaseItems.length}</span></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{releaseItems.map((item) => <ReleaseCard key={item.id} item={item} lang={lang} now={now} />)}</div></section>}
          <section className="mt-1 sm:mt-5">{visible.length ? <div><SignalHero signal={hero} now={now} onAction={(id, action) => onAction?.(id, action)} />{rest.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rest.map((s) => <SignalCard key={s.id} signal={s} now={now} onAction={(id, action) => onAction?.(id, action)} />)}</div>}</div> : <div>{heroCandidate ? <><PremiumOpportunityHero item={heroCandidate} lang={lang} /><div className="mb-5 mt-7 flex flex-col justify-between gap-3 rounded-[16px] border border-rr-prepare/20 bg-rr-prepare-bg p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-rr-prepare" /><div><div className="text-sm font-semibold">{lang === "ru" ? "Радар нашёл новые позиции — идёт проверка сделки" : "Radar found new items — deal verification is in progress"}</div><div className="mt-1 text-xs leading-5 text-rr-muted">{lang === "ru" ? "Фото и ссылки взяты из живых источников. Эти позиции ещё не BUY NOW: цена, checkout и реальные продажи проверяются отдельно." : "Images and links come from live sources. These are not BUY NOW yet: price, checkout and completed sales are verified separately."}</div></div></div><span className="shrink-0 rounded-full border border-rr-frame px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-rr-text-dim">{categoryNews.length} {lang === "ru" ? "сигналов" : "signals"}</span></div></> : <div className="rounded-[14px] border border-rr-frame bg-rr-surface px-5 py-4"><div className="flex items-center gap-3"><ShieldCheck size={16} className="shrink-0 text-rr-muted" /><p className="text-[13px] text-rr-muted">{c.noAction} — {c.noActionText}</p></div></div>}{heroRest.length > 0 && <div className={`grid gap-5 md:grid-cols-2 xl:grid-cols-3 ${heroCandidate ? "" : "mt-6"}`}>{heroRest.map((item) => <NewsCard key={item.id} item={item} lang={lang} />)}</div>}</div>}</section>
          <section className="mt-14 hidden border-t border-rr-frame pt-9 lg:block"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rr-accent">{c.intel}</div><p className="mt-2 max-w-[720px] text-[13px] leading-5 text-rr-muted">{c.intelText}</p></div><div className="flex shrink-0 items-center gap-2"><Link href="/news" className="rounded-full border border-rr-frame px-4 py-2 text-[12px] font-semibold text-rr-text transition hover:border-rr-ghost">{c.allNews}</Link><Link href="/now/add" className="inline-flex items-center gap-1.5 rounded-full bg-rr-accent px-4 py-2 text-[12px] font-semibold text-white transition hover:opacity-90"><Plus size={13} />{c.submit}</Link></div></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{news.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} lang={lang} />)}</div></section>
          <section className="mt-12 flex flex-col justify-between gap-4 rounded-[20px] border border-rr-frame bg-rr-well p-5 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">{c.sourceHealth}</div><div className="mt-1 text-xs text-rr-muted">{healthySources > 0 ? `${healthySources} ${c.sourcesOk}` : c.sourcesIssue}{manualSources > 0 ? ` · ${manualSources} manual` : ""}{troubledSources > 0 ? ` · ${troubledSources} ${c.sourcesIssue}` : ""}</div></div><div className="flex items-center gap-2"><button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full border border-rr-frame px-4 py-2 text-[12px] font-semibold text-rr-text transition hover:border-rr-ghost"><RefreshCw size={13} />{c.refresh}</button><button className="inline-flex items-center gap-1.5 rounded-full border border-rr-frame px-4 py-2 text-[12px] font-semibold text-rr-text transition hover:border-rr-ghost"><Bell size={13} />{c.alerts}</button><Link href="/news" className="inline-flex items-center gap-1.5 rounded-full bg-rr-text px-4 py-2 text-[12px] font-semibold text-rr-bg transition hover:opacity-90">{c.source}<ArrowUpRight size={13} /></Link></div></section>
        </>}
      </main>
    </div>
  );
}
