import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateEt } from "@/lib/format";

function statusTone(status: string, enabled: boolean) {
  if (!enabled || status === "disabled") return "bg-white/5 text-rr-muted";
  if (status === "active") return "bg-rr-ok/10 text-rr-ok";
  return "bg-rr-risk/10 text-rr-risk";
}

export default async function SourcesPage() {
  await requireUserId();
  const sources = await prisma.source.findMany({
    orderBy: [{ adapterStatus: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      url: true,
      category: true,
      sourceType: true,
      trustLevel: true,
      adapterStatus: true,
      lastCheckedAt: true,
      lastSuccessAt: true,
      lastError: true,
      itemsDiscovered: true,
      isEnabled: true,
    },
  });
  const healthy = sources.filter((s) => s.isEnabled && s.adapterStatus === "active").length;
  const attention = sources.filter((s) => s.isEnabled && s.adapterStatus !== "active").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-rr-text">Источники</h1>
        <p className="mt-1 text-sm text-rr-text-dim">Реальное состояние подключённых сборщиков и время последней проверки.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-rr-hair bg-rr-surface p-4"><div className="text-xs text-rr-muted">Работают</div><div className="mt-1 text-2xl font-semibold text-rr-ok">{healthy}</div></div>
        <div className="rounded-2xl border border-rr-hair bg-rr-surface p-4"><div className="text-xs text-rr-muted">Требуют внимания</div><div className="mt-1 text-2xl font-semibold text-rr-risk">{attention}</div></div>
      </div>

      <div className="grid gap-3">
        {sources.map((source) => (
          <article key={source.id} className="rounded-2xl border border-rr-hair bg-rr-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-rr-text hover:text-rr-accent">{source.name}</a>
                <div className="mt-1 text-xs text-rr-muted">{source.category} · {source.sourceType} · trust {source.trustLevel}/5</div>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(source.adapterStatus, source.isEnabled)}`}>{source.isEnabled ? source.adapterStatus : "disabled"}</span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-rr-text-dim sm:grid-cols-3">
              <div><span className="text-rr-muted">Проверка:</span> {source.lastCheckedAt ? formatDateEt(source.lastCheckedAt) : "—"}</div>
              <div><span className="text-rr-muted">Успех:</span> {source.lastSuccessAt ? formatDateEt(source.lastSuccessAt) : "—"}</div>
              <div><span className="text-rr-muted">Найдено:</span> {source.itemsDiscovered}</div>
            </div>
            {source.lastError && <div className="mt-3 rounded-lg bg-rr-risk/5 px-3 py-2 text-xs text-rr-risk">{source.lastError}</div>}
          </article>
        ))}
        {sources.length === 0 && <div className="rounded-2xl border border-dashed border-rr-hair p-8 text-center text-sm text-rr-muted">Источники ещё не подключены.</div>}
      </div>
    </div>
  );
}
