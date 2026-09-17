export type SignalStatus = "buy" | "prepare" | "client";

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

  /** null — данных о цене пока нет (не выдумываем цифры). */
  retail: number | null;
  cost: number | null;
  expectedResale: number | null;

  store: string;
  stock: string;
  checkedAt: string;
  launchAt: string;

  why: string;
  factors: string[];
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

export interface FeedPayload {
  signals: Signal[];
  sources: SourceHealth[];
  logs: string[];
  scannedAt: string;
  nextScanAt?: string;
}
