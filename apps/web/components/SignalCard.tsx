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
      className="group flex items-start gap-4 border border-rr-frame hover:border-rr-frame bg-rr-surface rounded-xl p-4 transition-colors"
    >
      <div className="w-12 h-12 shrink-0 rounded-lg bg-rr-surface-hi border border-rr-frame flex items-center justify-center text-rr-muted text-[10px] uppercase tracking-wide">
        {signal.category.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-rr-text font-medium truncate">
              {`${signal.brand} ${signal.model}`.replace(/^\[DEMO\]\s*/i, "")}
            </div>
            <div className="text-xs text-rr-text-dim mt-0.5">
              {signal.variantLabel}
              {signal.sku ? ` · SKU ${signal.sku}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {`${signal.brand} ${signal.model}`.toUpperCase().includes("[DEMO]") && (
              <span className="text-[9px] font-semibold tracking-wide text-rr-muted bg-rr-surface-hi border border-rr-frame rounded px-1.5 py-0.5">DEMO</span>
            )}
            <StatusBadge status={signal.status} />
          </div>
        </div>
        <p className="text-xs text-rr-text-dim mt-2 line-clamp-2">{signal.rationale}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-rr-muted tabular-nums">
          <span>Confidence: {signal.evidenceConfidence}%</span>
          <span>·</span>
          <span>{timeAgo(signal.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
