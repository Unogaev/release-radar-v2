import { requireUserId } from "@/lib/session";
import { getDecisionDetail } from "@/lib/data";
import { formatMoneyMinor, formatDateEt } from "@/lib/format";
import { notFound } from "next/navigation";
import { confirmPurchase } from "./actions";
import { getProductImage } from "@/lib/radar/fetchImage";
import { Badge } from "@/components/vitrina/Badge";
import { SourcesBlock, type EvidenceItem } from "@/components/vitrina/SourcesBlock";
import { ImageWithFallback } from "@/components/vitrina/ImageWithFallback";
import { AlertTriangle, ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusKey(status: string): "buy" | "apply" | "prepare" | "client" | "watch" | "skip" {
  const v = status.toLowerCase();
  if (v.includes("buy")) return "buy";
  if (v.includes("apply")) return "apply";
  if (v.includes("client")) return "client";
  if (v.includes("prepare") || v.includes("source")) return "prepare";
  if (v.includes("skip")) return "skip";
  return "watch";
}

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  await requireUserId();
  const decision = await getDecisionDetail(params.id);
  if (!decision) notFound();

  const pv = decision.productVariant;
  const releaseEvent = pv.releaseEvents[0];
  const modelLabel = titleCase(pv.product.normalizedModel);
  const imageUrl = await getProductImage(pv.product.brand, modelLabel);
  const brand = pv.product.brand;

  const evidenceItems: EvidenceItem[] = pv.evidence.map((e) => ({
    type: "evidence",
    site: e.source.name,
    url:
      (e.source as unknown as { url?: string | null }).url ??
      (e as unknown as { url?: string | null }).url ??
      null,
    confirms: `Observed ${formatDateEt(e.observedAt)}`,
    level: String(e.level),
    at: null,
  }));

  const runnerParams = new URLSearchParams();
  runnerParams.set("brand", brand);
  runnerParams.set("model", modelLabel);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
      <Link href="/now" className="inline-flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#1a1a1a]">
        <ArrowLeft size={14} /> Back to feed
      </Link>

      <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white">
        <ImageWithFallback src={imageUrl} alt={`${brand} ${modelLabel}`} className="aspect-[16/10] w-full" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] text-[#6b7280]">{brand}</div>
              <h1 className="mt-0.5 text-[24px] font-bold leading-tight text-[#1a1a1a]">{modelLabel}</h1>
              <div className="mt-0.5 text-[13px] text-[#6b7280]">{pv.variantLabel}</div>
            </div>
            <Badge status={statusKey(decision.status)} />
          </div>
          {decision.rationale && (
            <p className="mt-3 text-[14px] leading-relaxed text-[#374151]">{decision.rationale}</p>
          )}
          <div className="mt-2 text-[12px] tabular-nums text-[#9ca3af]">
            Evidence confidence {decision.evidenceConfidence}/100
          </div>
        </div>
      </div>

      {releaseEvent && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a]">
            <CalendarDays size={16} /> When
          </h2>
          {releaseEvent.timePrecision === "tba" ? (
            <span className="text-[14px] text-[#6b7280]">Time to be announced</span>
          ) : (
            <div className="text-[15px] font-medium tabular-nums text-[#1a1a1a]">{formatDateEt(releaseEvent.startAtUtc)}</div>
          )}
        </section>
      )}

      {(pv.marketSales.length > 0 || pv.marketAsks.length > 0) && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <h2 className="mb-2 text-[14px] font-semibold text-[#1a1a1a]">Market</h2>
          {pv.marketSales.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-[12px] text-[#6b7280]">Completed sales</div>
              {pv.marketSales.map((s) => (
                <div key={s.id} className="flex justify-between py-1 text-[14px]">
                  <span className="text-[#6b7280]">{s.platform}</span>
                  <span className="tabular-nums font-medium text-[#1a1a1a]">{formatMoneyMinor(s.priceMinor, s.currency)}</span>
                </div>
              ))}
            </div>
          )}
          {pv.marketAsks.length > 0 && (
            <div>
              <div className="mb-1 text-[12px] text-[#6b7280]">Asks — not sales</div>
              {pv.marketAsks.map((a) => (
                <div key={a.id} className="flex justify-between py-1 text-[14px]">
                  <span className="text-[#6b7280]">{a.platform}</span>
                  <span className="tabular-nums text-[#9ca3af]">{formatMoneyMinor(a.priceMinor, a.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {decision.blockedReasons.length > 0 && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a]">
            <AlertTriangle size={16} className="text-[#d97706]" /> Why not a stronger status
          </h2>
          <ul className="space-y-1">
            {decision.blockedReasons.map((r, i) => (
              <li key={i} className="text-[13px] text-[#6b7280]">{r}</li>
            ))}
          </ul>
        </section>
      )}

      <SourcesBlock items={evidenceItems} />

      <Link
        href={`/requests/new?${runnerParams.toString()}`}
        className="flex w-full items-center justify-center rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-3 text-[14px] font-semibold text-[#1a1a1a]"
      >
        Find a runner
      </Link>

      {decision.status === "BUY_NOW" && (
        <form action={confirmPurchase.bind(null, pv.id, decision.id)} className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <label className="mb-1 block text-[12px] text-[#6b7280]">Actual cost ($)</label>
          <input name="actualCost" type="number" step="0.01" required className="mb-3 w-full rounded-[12px] border border-[#e5e7eb] px-3 py-2 text-[14px]" />
          <button type="submit" className="w-full rounded-[12px] bg-[#16a34a] px-4 py-3 text-[14px] font-semibold text-white">
            Confirm purchase
          </button>
        </form>
      )}
    </div>
  );
}
