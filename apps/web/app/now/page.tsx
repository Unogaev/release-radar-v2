import { requireUserId } from "@/lib/session";
import { getNowFeed } from "@/lib/data";
import { formatMoneyMinor, STATUS_COLOR, simpleLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export default async function NowPage() {
  const userId = await requireUserId();
  const decisions = await getNowFeed(userId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-espresso">Сейчас</h1>
        <p className="text-sm text-ink-600 mt-1">
          Только действия, доступные прямо сейчас и прошедшие проверку.
        </p>
      </header>

      {decisions.length === 0 ? (
        <EmptyState text="Пока нет действий, готовых к исполнению." />
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Link
              key={d.id}
              href={`/signals/${d.id}`}
              className="block border border-ink-800/40 rounded-xl p-5 shadow-soft hover:shadow-lg transition-shadow bg-white/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-espresso font-medium">
                    {d.productVariant.product.brand} {d.productVariant.product.normalizedModel}
                  </div>
                  <div className="text-sm text-ink-600 mt-0.5">{d.productVariant.variantLabel}</div>
                  <div className="text-xs text-ink-600 mt-2">{d.rationale}</div>
                </div>
                <span
                  className={`status-badge shrink-0 px-2.5 py-1 rounded-full text-ink-950 ${STATUS_COLOR[d.status]}`}
                >
                  {simpleLabel(d.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
