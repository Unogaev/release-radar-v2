import { requireUserId } from "@/lib/session";
import { getCalendarEvents } from "@/lib/data";
import { formatDateEt, STATUS_COLOR, simpleLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">Календарь</h1>
        <p className="text-sm text-ink-600 mt-1">Только подтверждённые даты релизов из базы.</p>
      </header>

      {sortedKeys.length === 0 && undated.length === 0 ? (
        <EmptyState text="Нет подтверждённых дат релизов." />
      ) : (
        <div className="space-y-6">
          {sortedKeys.map((key) => {
            const dayEvents = groups.get(key)!;
            return (
              <div key={key} className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-ink-500">
                  {dayLabelEt(dayEvents[0].startAtUtc as Date)}
                </div>
                <div className="space-y-3">
                  {dayEvents.map((e) => {
                    const decision = e.productVariant.decisions[0];
                    return (
                      <div key={e.id} className="border border-ink-700 rounded-lg p-4 bg-ink-900/40">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-white font-medium">
                              {e.productVariant.product.brand} {e.productVariant.product.normalizedModel}
                            </div>
                            <div className="text-sm text-ink-600 mt-0.5">{e.productVariant.variantLabel}</div>
                            <div className="text-xs mt-2">
                              <span className="text-ember-400">{formatDateEt(e.startAtUtc)}</span>
                            </div>
                          </div>
                          {decision && (
                            <Link
                              href={`/signals/${decision.id}`}
                              className={`status-badge shrink-0 px-2.5 py-1 rounded text-ink-950 self-start ${STATUS_COLOR[decision.status]}`}
                            >
                              {simpleLabel(decision.status)}
                            </Link>
                          )}
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
              <div className="text-xs uppercase tracking-wide text-ink-500">Дата уточняется</div>
              <div className="space-y-3">
                {undated.map((e) => {
                  const decision = e.productVariant.decisions[0];
                  return (
                    <div key={e.id} className="border border-ink-700 rounded-lg p-4 bg-ink-900/40">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-white font-medium">
                            {e.productVariant.product.brand} {e.productVariant.product.normalizedModel}
                          </div>
                          <div className="text-sm text-ink-600 mt-0.5">{e.productVariant.variantLabel}</div>
                          <div className="text-xs mt-2">
                            <span className="text-status-prepare status-badge">TIME TBA</span>
                          </div>
                        </div>
                        {decision && (
                          <Link
                            href={`/signals/${decision.id}`}
                            className={`status-badge shrink-0 px-2.5 py-1 rounded text-ink-950 self-start ${STATUS_COLOR[decision.status]}`}
                          >
                            {simpleLabel(decision.status)}
                          </Link>
                        )}
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
