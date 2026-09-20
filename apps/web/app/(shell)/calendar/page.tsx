import { requireUserId } from "@/lib/session";
import { getCalendarEvents } from "@/lib/data";
import { formatDateEt } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

const DECISION_RR: Record<string, { label: string; bg: string; text: string }> = {
  BUY_NOW: { label: "BUY NOW", bg: "bg-rr-buy", text: "text-white" },
  CONTACT_DEALER: { label: "BUY NOW", bg: "bg-rr-buy", text: "text-white" },
  SOURCE_NOW: { label: "BUY NOW", bg: "bg-rr-buy", text: "text-white" },
  APPLY_NOW: { label: "APPLY NOW", bg: "bg-rr-apply", text: "text-white" },
  APPLY_RESERVE: { label: "PREPARE", bg: "bg-rr-prepare", text: "text-white" },
  RESERVE_PICKUP: { label: "PREPARE", bg: "bg-rr-prepare", text: "text-white" },
  PREPARE: { label: "PREPARE", bg: "bg-rr-prepare", text: "text-white" },
  VERIFY: { label: "VERIFY", bg: "bg-rr-watch-bg", text: "text-rr-watch" },
  VERIFY_IN_STORE: { label: "VERIFY", bg: "bg-rr-watch-bg", text: "text-rr-watch" },
  WATCH: { label: "WATCH", bg: "bg-rr-watch-bg", text: "text-rr-watch" },
  WATCH_RESTOCK: { label: "WATCH", bg: "bg-rr-watch-bg", text: "text-rr-watch" },
  CLIENT_FIRST: { label: "CLIENT FIRST", bg: "bg-rr-client-bg", text: "text-rr-client" },
  SKIP: { label: "SKIP", bg: "bg-rr-frame", text: "text-rr-muted" },
};

function dayKeyEt(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(date);
}

function dayLabelEt(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "America/New_York",
    day: "numeric",
    month: "long",
    weekday: "short",
  }).format(date);
}

export default async function CalendarPage() {
  await requireUserId();
  const events = await getCalendarEvents("");

  const dated = events.filter((e) => e.timePrecision !== "tba" && e.startAtUtc);
  const undated = events.filter((e) => e.timePrecision === "tba");

  const groups = new Map<string, typeof dated>();
  for (const e of dated) {
    const key = dayKeyEt(e.startAtUtc as Date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const sortedKeys = [...groups.keys()].sort();

  function DecisionBadge({ decisionId, status }: { decisionId: string; status: string }) {
    const meta = DECISION_RR[status] ?? { label: status, bg: "bg-rr-frame", text: "text-rr-muted" };
    return (
      <Link
        href={`/signals/${decisionId}`}
        className={`status-badge shrink-0 px-2.5 py-1 rounded self-start ${meta.bg} ${meta.text}`}
      >
        {meta.label}
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-rr-display text-2xl text-rr-text">Календарь</h1>
        <p className="text-sm text-rr-text-dim mt-1">Только подтверждённые даты релизов из базы.</p>
      </header>

      {sortedKeys.length === 0 && undated.length === 0 ? (
        <EmptyState text="Нет подтверждённых дат релизов." />
      ) : (
        <div className="space-y-6">
          {sortedKeys.map((key) => {
            const dayEvents = groups.get(key)!;
            return (
              <div key={key} className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-rr-muted">
                  {dayLabelEt(dayEvents[0].startAtUtc as Date)}
                </div>
                <div className="space-y-3">
                  {dayEvents.map((e) => {
                    const decision = e.productVariant.decisions[0];
                    return (
                      <div key={e.id} className="border border-rr-hair rounded-2xl p-4 bg-rr-surface">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-rr-text font-medium">
                              {e.productVariant.product.brand} {e.productVariant.product.normalizedModel}
                            </div>
                            <div className="text-sm text-rr-text-dim mt-0.5">{e.productVariant.variantLabel}</div>
                            <div className="text-xs mt-2 text-rr-text-dim">{formatDateEt(e.startAtUtc)}</div>
                          </div>
                          {decision && <DecisionBadge decisionId={decision.id} status={decision.status} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {undated.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wide text-rr-muted">Дата уточняется</div>
              <div className="space-y-3">
                {undated.map((e) => {
                  const decision = e.productVariant.decisions[0];
                  return (
                    <div key={e.id} className="border border-rr-hair rounded-2xl p-4 bg-rr-surface">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-rr-text font-medium">
                            {e.productVariant.product.brand} {e.productVariant.product.normalizedModel}
                          </div>
                          <div className="text-sm text-rr-text-dim mt-0.5">{e.productVariant.variantLabel}</div>
                          <div className="text-xs mt-2">
                            <span className="status-badge bg-rr-prepare-bg text-rr-prepare px-2 py-0.5 rounded">TIME TBA</span>
                          </div>
                        </div>
                        {decision && <DecisionBadge decisionId={decision.id} status={decision.status} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
