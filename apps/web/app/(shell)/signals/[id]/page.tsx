import { requireUserId } from "@/lib/session";
import { getDecisionDetail } from "@/lib/data";
import { formatMoneyMinor, formatDateEt, STATUS_COLOR, simpleLabel } from "@/lib/format";
import { notFound } from "next/navigation";
import { confirmPurchase } from "./actions";
import { getProductImage } from "@/lib/radar/fetchImage";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  await requireUserId();
  const decision = await getDecisionDetail(params.id);
  if (!decision) notFound();

  const pv = decision.productVariant;
  const releaseEvent = pv.releaseEvents[0];
  const modelLabel = titleCase(pv.product.normalizedModel);
  const imageUrl = await getProductImage(pv.product.brand, modelLabel);

  return (
    <div className="max-w-2xl space-y-6">
      {imageUrl && (
        <div
          className="h-[220px] sm:h-[280px] rounded-xl bg-rr-frame bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
          role="img"
          aria-label={`${pv.product.brand} ${modelLabel}`}
        />
      )}

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-rr-text-dim">{pv.product.category}</div>
          <h1 className="font-display text-2xl text-rr-text">
            {pv.product.brand} {modelLabel}
          </h1>
          <div className="text-sm text-rr-text-dim mt-0.5">{pv.variantLabel}</div>
        </div>
        <span
          className={`status-badge shrink-0 px-3 py-1.5 rounded ${STATUS_COLOR[decision.status]}`}
        >
          {simpleLabel(decision.status)}
        </span>
      </header>

      <Section title="Решение">
        <p className="text-sm text-rr-text-dim">{decision.rationale}</p>
        <div className="text-xs text-rr-text-dim mt-2">
          rule_version {decision.ruleVersion} · evidence_confidence {decision.evidenceConfidence}/100
        </div>
        {decision.blockedReasons.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-rr-text-dim mb-1">Почему не выше по статусу:</div>
            <ul className="space-y-1">
              {decision.blockedReasons.map((r, i) => (
                <li key={i} className="text-xs text-rr-muted">— {r}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {releaseEvent && (
        <Section title="Событие">
          {releaseEvent.timePrecision === "tba" ? (
            <span className="status-badge text-rr-prepare">TIME TBA</span>
          ) : (
            <div className="text-sm text-rr-accent">{formatDateEt(releaseEvent.startAtUtc)}</div>
          )}
        </Section>
      )}

      {(pv.marketSales.length > 0 || pv.marketAsks.length > 0) && (
        <Section title="Рынок">
          {pv.marketSales.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-rr-text-dim mb-1">Completed sales</div>
              {pv.marketSales.map((s) => (
                <div key={s.id} className="text-sm text-rr-text-dim flex justify-between">
                  <span>{s.platform}</span>
                  <span>{formatMoneyMinor(s.priceMinor, s.currency)}</span>
                </div>
              ))}
            </div>
          )}
          {pv.marketAsks.length > 0 && (
            <div>
              <div className="text-xs text-rr-text-dim mb-1">Asks (не sales)</div>
              {pv.marketAsks.map((a) => (
                <div key={a.id} className="text-sm text-rr-text-dim flex justify-between">
                  <span>{a.platform}</span>
                  <span>{formatMoneyMinor(a.priceMinor, a.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Evidence trail">
        {pv.evidence.length === 0 ? (
          <p className="text-sm text-rr-text-dim">Нет записей.</p>
        ) : (
          <ul className="space-y-2">
            {pv.evidence.map((e) => (
              <li key={e.id} className="text-sm border-l-2 border-rr-hair pl-3">
                <div className="text-rr-text-dim">{e.level}</div>
                <div className="text-xs text-rr-text-dim">
                  {formatDateEt(e.observedAt)} · {e.source.name}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {decision.status === "BUY_NOW" && (
        <form action={confirmPurchase.bind(null, pv.id, decision.id)}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-rr-text-dim mb-1">Фактическая стоимость ($)</label>
              <input
                name="actualCost"
                type="number"
                step="0.01"
                required
                className="w-full bg-rr-surface border border-rr-hair rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-rr-accent hover:bg-rr-accent-hi text-rr-bg font-medium rounded px-4 py-3 text-sm tracking-wide"
          >
            Подтвердить покупку (E5_USER_CONFIRMED)
          </button>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-rr-hair rounded-lg p-4">
      <div className="text-xs uppercase tracking-widest text-rr-accent mb-2">{title}</div>
      {children}
    </div>
  );
}
