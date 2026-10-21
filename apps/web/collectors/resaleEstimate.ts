// apps/web/collectors/resaleEstimate.ts
//
// Сборщик оценок перепродажи (Phase 1 — только данные, без изменений UI).
//
// Рабочий маршрут: публичные страницы StockX (поиск + карточка товара) —
// last sale / lowest ask. eBay в Phase 1 недоступен: проданные листинги
// закрыты signin-wall'ом, а Finding API требует App ID (SECURITY-APPNAME),
// которого нет в env/config проекта — см. ebaySoldEstimateUnavailable().
//
// Мэтчинг консервативный: при неоднозначности НЕ пишем ничего.
//
// Уважение к rate limits: запросы строго последовательные, пауза между ними;
// browser-UA fallback — по паттерну collectors/structuredData.ts.

export type ResaleSource = "ebay_sold" | "stockx";

export interface ResaleEstimateInput {
  productVariantId: string;
  trackedName: string; // напр. "Nike Gs Dunk Low Lv8 - Blue Void / Fir / Sail / Strata Grey"
  brand: string;
  styleCode: string | null; // Identifier kind sku/style, если известен
  retailPriceUsd: number | null;
}

export interface StockXHit {
  urlKey: string; // "air-jordan-12-retro-fireside"
  title: string; // "Jordan 12 Retro Fireside"
  priceUsd: number | null; // цена с карточки поиска (lowest ask)
}

export interface StockXProductEvidence {
  urlKey: string;
  title: string;
  styleCode: string | null; // из <title>: "- IQ6535-401 -"
  lastSaleUsd: number | null; // "Last Sale"; null, если продаж ещё не было ("--")
  lowestAskUsd: number | null;
}

export interface ResaleEstimateComputed {
  valueUsd: number;
  source: ResaleSource;
  sampleSize: number;
  asOf: Date;
  matchScore: number; // 0..1
  note: string;
  evidenceUrl: string;
  raw: { lastSaleUsd: number | null; lowestAskUsd: number | null };
}

export type CollectOutcome =
  | { kind: "estimate"; estimate: ResaleEstimateComputed }
  | {
      kind: "skipped";
      reason:
        | "no_search_hits"
        | "no_match"
        | "ambiguous_match"
        | "no_last_sale"
        | "fetch_blocked"
        | "parse_failed"
        | "ebay_sold_unavailable";
      detail: string;
    }
  | { kind: "failed"; error: string };

// ---------------------------------------------------------------------------
// HTTP: паттерн из structuredData.ts — bot UA, при 403/429 повтор с
// браузерным UA. Cloudflare/бот-стена в HTML → считаем заблокированным.
// ---------------------------------------------------------------------------

const BOT_UA = "ReleaseRadarBot/1.0";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const BOT_WALL_RE = /just a moment|cf-chl|pardon our interruption|checking your browser/i;

async function fetchStockXHtml(url: string): Promise<string | null> {
  try {
    let res = await fetch(url, { headers: { "User-Agent": BOT_UA } });
    if (res.status === 403 || res.status === 429) {
      res = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      });
    }
    if (!res.ok) return null;
    const html = await res.text();
    if (BOT_WALL_RE.test(html.slice(0, 30000))) return null;
    return html;
  } catch {
    return null;
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Токенизация и консервативный мэтчинг
// ---------------------------------------------------------------------------

const FILLER_TOKENS = new Set([
  "retro", "se", "mens", "men's", "womens", "women's", "gs", "ps", "td",
  "youth", "kids", "kid", "kid's", "baby", "toddler", "infant",
  "new", "the", "a", "an", "x", "us", "grade", "school",
]);

export function significantTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !FILLER_TOKENS.has(t));
}

function normStyleCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function walkJson(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    for (const v of node) walkJson(v, visit);
    return;
  }
  if (node && typeof node === "object") {
    visit(node as Record<string, unknown>);
    for (const v of Object.values(node)) walkJson(v, visit);
  }
}

function parsePrice(text: string): number | null {
  const m = text.match(/\$([\d,]+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}

// --- Парсинг страницы поиска ------------------------------------------------

export function parseSearchHits(html: string): StockXHit[] {
  const hits: StockXHit[] = [];
  const seen = new Set<string>();
  const push = (urlKey: string, title: string, priceUsd: number | null) => {
    urlKey = urlKey.replace(/^\/+|\/+$/g, "");
    if (!urlKey || seen.has(urlKey) || !urlKey.includes("-")) return;
    if (/^(search|news|about|help|sell|trending)$/i.test(urlKey)) return;
    seen.add(urlKey);
    hits.push({ urlKey, title: title.trim().slice(0, 160), priceUsd });
  };

  // Проход 1: __NEXT_DATA__ — ищем объекты с urlKey/title.
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextData) {
    try {
      walkJson(JSON.parse(nextData[1]), (o) => {
        if (typeof o.urlKey === "string" && typeof o.title === "string") {
          const price =
            typeof o.lowestAsk === "number" ? o.lowestAsk
            : typeof o.price === "number" ? o.price
            : null;
          push(o.urlKey, o.title, price);
        }
      });
      if (hits.length > 0) return hits.slice(0, 12);
    } catch {
      // идём к запасному regex-проходу
    }
  }

  // Проход 2 (запасной): ссылки-карточки + цена неподалёку в тексте ссылки.
  const linkRe = /<a[^>]*href="(\/[a-z0-9][a-z0-9\-]{2,80})"[^>]*>([\s\S]{0,1200}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null && hits.length < 12) {
    const inner = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const title = inner.replace(/\$[\d,]+(?:\.\d{1,2})?/g, " ").replace(/\s+/g, " ").trim();
    if (title.length >= 4) push(m[1], title, parsePrice(inner));
  }
  return hits;
}

// --- Парсинг карточки товара -------------------------------------------------

export function parseProductPage(html: string, urlKey: string): StockXProductEvidence | null {
  const titleMatch = html.match(/<title>([^<]{4,200})<\/title>/i);
  if (!titleMatch) return null;
  const title = decodeEntities(titleMatch[1]).trim();
  const styleMatch = title.match(/-\s*([A-Z0-9]{2,10}-\d{3})\s*-/);
  const styleCode = styleMatch ? styleMatch[1] : null;

  // "Last Sale" + цена; "--" означает отсутствие продаж → null.
  let lastSaleUsd: number | null = null;
  const lastSaleMatch = html.match(/Last Sale[\s\S]{0,400}?\$([\d,]+(?:\.\d{1,2})?)/i);
  if (lastSaleMatch) {
    lastSaleUsd = parseFloat(lastSaleMatch[1].replace(/,/g, ""));
  } else {
    const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextData) {
      try {
        walkJson(JSON.parse(nextData[1]), (o) => {
          if (typeof o.lastSale === "number" && lastSaleUsd === null) lastSaleUsd = o.lastSale;
        });
      } catch {
        // ignore
      }
    }
  }

  let lowestAskUsd: number | null = null;
  const askMatch = html.match(/Buy Now for[\s\S]{0,400}?\$([\d,]+(?:\.\d{1,2})?)/i);
  if (askMatch) lowestAskUsd = parseFloat(askMatch[1].replace(/,/g, ""));

  return { urlKey, title, styleCode, lastSaleUsd, lowestAskUsd };
}

// --- Скоринг -----------------------------------------------------------------

export interface ScoredHit extends StockXHit {
  score: number; // доля значимых токенов трекаемого названия, найденных в заголовке
  matchedTokens: string[];
  missingTokens: string[];
}

const MIN_SCORE = 0.75;
const UNIQUENESS_GAP = 0.15;
const MIN_INTERSECT = 3;

export function scoreHits(trackedName: string, hits: StockXHit[]): ScoredHit[] {
  const tracked = significantTokens(trackedName);
  const trackedSet = new Set(tracked);
  return hits
    .map((h) => {
      const candSet = new Set(significantTokens(h.title));
      const matched = Array.from(trackedSet).filter((t) => candSet.has(t));
      return {
        ...h,
        score: tracked.length > 0 ? matched.length / tracked.length : 0,
        matchedTokens: matched,
        missingTokens: Array.from(trackedSet).filter((t) => !candSet.has(t)),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function pickBest(scored: ScoredHit[]): { best: ScoredHit } | { ambiguous: string } | { none: string } {
  if (scored.length === 0) return { none: "поиск не вернул карточек" };
  const best = scored[0];
  const second = scored[1];
  if (best.score < MIN_SCORE) return { none: `лучшее совпадение ${best.score.toFixed(2)} < ${MIN_SCORE}` };
  if (best.matchedTokens.length < MIN_INTERSECT) return { none: "слишком мало общих значимых токенов" };
  if (second && second.urlKey !== best.urlKey && second.score >= best.score - UNIQUENESS_GAP) {
    return { ambiguous: `неоднозначно: «${best.title}» vs «${second.title}»` };
  }
  return { best };
}

function buildSearchQuery(trackedName: string): string {
  return significantTokens(trackedName).slice(0, 10).join(" ").slice(0, 120);
}

// --- Главная функция сборщика ------------------------------------------------

export async function collectStockXEstimate(input: ResaleEstimateInput): Promise<CollectOutcome> {
  try {
    const query = buildSearchQuery(input.trackedName);
    const searchHtml = await fetchStockXHtml(`https://stockx.com/search?s=${encodeURIComponent(query)}`);
    if (!searchHtml) {
      return { kind: "skipped", reason: "fetch_blocked", detail: "страница поиска StockX недоступна (блок/проверка)" };
    }
    const hits = parseSearchHits(searchHtml);
    if (hits.length === 0) {
      return { kind: "skipped", reason: "no_search_hits", detail: `по запросу «${query}» карточек не распарсено` };
    }
    const pick = pickBest(scoreHits(input.trackedName, hits));
    if ("ambiguous" in pick) return { kind: "skipped", reason: "ambiguous_match", detail: pick.ambiguous };
    if ("none" in pick) return { kind: "skipped", reason: "no_match", detail: pick.none };
    const best = pick.best;

    await sleep(1200);
    const pageHtml = await fetchStockXHtml(`https://stockx.com/${best.urlKey}`);
    if (!pageHtml) {
      return { kind: "skipped", reason: "fetch_blocked", detail: `карточка ${best.urlKey}: блок/проверка` };
    }
    const ev = parseProductPage(pageHtml, best.urlKey);
    if (!ev) {
      return { kind: "skipped", reason: "parse_failed", detail: `карточка ${best.urlKey} не распарсилась` };
    }
    // Style-code — сильный сигнал: несовпадение = другой товар → ничего не пишем.
    if (input.styleCode && ev.styleCode && normStyleCode(input.styleCode) !== normStyleCode(ev.styleCode)) {
      return { kind: "skipped", reason: "no_match", detail: `style-code не сошёлся: ${input.styleCode} vs ${ev.styleCode}` };
    }
    if (ev.lastSaleUsd === null) {
      return { kind: "skipped", reason: "no_last_sale", detail: `«${ev.title}»: завершённых продаж пока нет (Last Sale --)` };
    }
    let score = best.score;
    let note = `StockX: «${ev.title}»`;
    if (input.styleCode && ev.styleCode && normStyleCode(input.styleCode) === normStyleCode(ev.styleCode)) {
      score = 1;
      note += "; style-code совпал";
    } else if (best.missingTokens.length > 0) {
      note += `; в заголовке StockX нет токенов: ${best.missingTokens.join(", ")}`;
    }
    return {
      kind: "estimate",
      estimate: {
        valueUsd: ev.lastSaleUsd,
        source: "stockx",
        sampleSize: 1, // last-sale — одно наблюдение завершённой продажи
        asOf: new Date(),
        matchScore: Math.round(score * 100) / 100,
        note,
        evidenceUrl: `https://stockx.com/${best.urlKey}`,
        raw: { lastSaleUsd: ev.lastSaleUsd, lowestAskUsd: ev.lowestAskUsd },
      },
    };
  } catch (e) {
    return { kind: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

// --- eBay: маршрут недоступен в Phase 1 ----------------------------------------
// Проданные/завершённые листинги eBay закрыты signin-wall'ом
// (https://www.ebay.com/sch/...&LH_Sold=1 перенаправляет на signin.ebay.com),
// а Finding API findCompletedItems требует App ID (SECURITY-APPNAME) —
// без ключа отвечает отказом. Ключа нет в env/config проекта
// (см. apps/web/.env.example), поэтому опираемся на рабочий маршрут StockX.
// Когда появится EBAY_APP_ID — реализовать здесь findCompletedItems и
// медиану ≥3 завершённых продаж.
export function ebaySoldEstimateUnavailable(): Extract<CollectOutcome, { kind: "skipped" }> {
  return {
    kind: "skipped",
    reason: "ebay_sold_unavailable",
    detail: "eBay: нужен App ID (Finding API) или вход; ключа нет в проекте",
  };
}
