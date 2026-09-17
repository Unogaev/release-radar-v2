import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

export interface SignalCardData {
  id: string;
  brand: string;
  model: string;
  category: string;
  variantLabel: string;
  sku: string | null;
  status: string;
  rationale: string;
  evidenceConfidence: number;
  createdAt: Date;
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.round(hours / 24)} дн назад`;
}

export function SignalCard({ signal }: { signal: SignalCardData }) {
  return (
    <Link
      href={`/signals/${signal.id}`}
      className="group flex items-start gap-4 border border-graphite-700 hover:border-graphite-600 bg-graphite-900 rounded-xl p-4 transition-colors"
    >
      <div className="w-12 h-12 shrink-0 rounded-lg bg-graphite-800 border border-graphite-700 flex items-center justify-center text-graphite-500 text-[10px] uppercase tracking-wide">
        {signal.category.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-graphite-100 font-medium truncate">
              {signal.brand} {signal.model}
            </div>
            <div className="text-xs text-graphite-400 mt-0.5">
              {signal.variantLabel}
              {signal.sku ? ` · SKU ${signal.sku}` : ""}
            </div>
          </div>
          <StatusBadge status={signal.status} />
        </div>
        <p className="text-xs text-graphite-400 mt-2 line-clamp-2">{signal.rationale}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-graphite-500 tabular-nums">
          <span>Confidence: {signal.evidenceConfidence}%</span>
          <span>·</span>
          <span>{timeAgo(signal.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
