import { requireUserId } from "@/lib/session";
import { getSoonEvents } from "@/lib/data";
import { formatDateEt, STATUS_COLOR, simpleLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export default async function SoonPage() {
  await requireUserId();
  const events = await getSoonEvents("");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">Скоро</h1>
        <p className="text-sm text-rr-text-dim mt-1">Важные события ближайших 7 дней.</p>
      </header>

      {events.length === 0 ? (
        <EmptyState text="Нет подтверждённых событий на ближайшую неделю." />
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const decision = e.productVariant.decisions[0];
            const isTba = e.timePrecision === "tba";
            return (
              <div key={e.id} className="border border-rr-hair rounded-lg p-4 bg-rr-surface/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-medium">
                      {e.productVariant.product.brand} {e.productVariant.product.normalizedModel}
                    </div>
                    <div className="text-sm text-rr-text-dim mt-0.5">{e.productVariant.variantLabel}</div>
                    <div className="text-xs mt-2">
                      {isTba ? (
                        <span className="text-rr-prepare status-badge">TIME TBA</span>
                      ) : (
                        <span className="text-rr-accent">{formatDateEt(e.startAtUtc)}</span>
                      )}
                    </div>
                  </div>
                  {decision && (
                    <Link
                      href={`/signals/${decision.id}`}
                      className={`status-badge shrink-0 px-2.5 py-1 rounded text-rr-bg self-start ${STATUS_COLOR[decision.status]}`}
                    >
                      {simpleLabel(decision.status)}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
