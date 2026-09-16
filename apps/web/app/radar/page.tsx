import { requireUserId } from "@/lib/session";
import { getRadarSignals } from "@/lib/data";
import { STATUS_COLOR, simpleLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export default async function RadarPage() {
  await requireUserId();
  const decisions = await getRadarSignals();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">На радаре</h1>
        <p className="text-sm text-ink-600 mt-1">
          Официальные анонсы без открытых продаж, ранние сигналы, требующие наблюдения.
        </p>
      </header>

      {decisions.length === 0 ? (
        <EmptyState text="Радар пуст." />
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Link
              key={d.id}
              href={`/signals/${d.id}`}
              className="block border border-ink-700 rounded-lg p-4 hover:border-ember-500/40 transition-colors bg-ink-900/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white font-medium">
                    {d.productVariant.product.brand} {d.productVariant.product.normalizedModel}
                  </div>
                  <div className="text-xs text-ink-600 mt-2">{d.rationale}</div>
                </div>
                <span
                  className={`status-badge shrink-0 px-2.5 py-1 rounded text-ink-950 ${STATUS_COLOR[d.status]}`}
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
