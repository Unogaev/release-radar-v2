export type SignalStatus = "buy" | "apply" | "prepare" | "watch" | "client";

export type RadarCategory =
  | "now" | "soon" | "restock" | "trend" | "clearance"
  | "watches" | "tech" | "sneakers" | "cars";

export interface Signal {
  id: string;
  status: SignalStatus;
  kindLabel: string;
  categories: RadarCategory[];

  brand: string;
  model: string;
  reference: string;
  sku: string;

  imageUrl?: string;
  imageHint?: string;
  imageSourceUrl?: string;
  imageProvenance?: "product-page" | "official-page" | "official-search";

  /** null — данных о цене пока нет (не выдумываем цифры). */
  retail: number | null;
  cost: number | null;
  expectedResale: number | null;
  /** Lowest and median completed sales. Asking prices never populate these fields. */
  completedLow: number | null;
  completedMedian: number | null;
  completedHigh: number | null;
  completedSalesCount: number;
  askFloor: number | null;
  /** Estimated exit required to retain 20% net return after marketplace fee and shipping. */
  minExit20: number | null;
  marketplaceFeePct: number;
  shippingEstimate: number;
  taxRatePct: number;
  liquidity: "hot" | "active" | "thin" | "unverified";

  store: string;
  stock: string;
  primaryUrl?: string | null;
  checkedAt: string;
  launchAt: string;

  /** true only when the store's own buy button is confirmed active (ctaState "enabled"). */
  ctaConfirmed: boolean;

  /** Russian explanation (default UI language). */
  why: string;
  /** English explanation, shown when the UI language is switched to EN. */
  whyEn: string;
  factors: string[];
  factorsEn: string[];
}

export interface DerivedSignal extends Signal {
  profit: number | null;
  marginPct: number | null;
}

export interface SourceHealth {
  name: string;
  state: "ok" | "throttled" | "manual" | "down";
  detail: string;
}

export interface NewsItem {
  id: string;
  kind: "NEWS" | "RELEASE" | "SIGNAL" | "ALERT";
  headline: string;
  brand?: string;
  model?: string;
  source: string;
  sourceUrl?: string | null;
  imageUrl?: string;
  imageSourceUrl?: string;
  observedAt: string;
  launchAt?: string | null;
}

export interface FeedPayload {
  signals: Signal[];
  newsItems: NewsItem[];
  sources: SourceHealth[];
  logs: string[];
  scannedAt: string;
  nextScanAt?: string;
}
