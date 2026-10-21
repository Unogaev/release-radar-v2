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

// Presentation-only English mapping for engine strings (this page only;
// the engine and stored data stay untouched). Bracketed status codes and
// E-level codes are preserved. Strings matching no pattern render unchanged.
function enBlockedReason(reason: string): string {
  let out = reason;
  out = out.replace(
    /Evidence level (E\d+_[A-Z0-9_]+) ниже требуемого (E\d+_[A-Z0-9_]+)/g,
    "Evidence level $1 is below the required $2"
  );
  out = out.replace(/Deadline не сохранён\./g, "Deadline not saved.");
  out = out.replace(
    /Время TBA\s*[—–-]\s*допустим только WATCH, пока время не подтверждено\./g,
    "Time TBA — only WATCH applies until the time is confirmed."
  );
  out = out.replace(
    /Checkout price или полная стоимость неизвестны\./g,
    "Checkout price or full cost unknown."
  );
  out = out.replace(/^checkout_unverified$/, "Checkout unverified");
  out = out.replace(/^completed_sales_unverified$/, "Completed sales unverified");
  return out;
}

function enSummary(summary: string | null): string | null {
  if (!summary) return summary;
  let out = summary;
  out = out.replace(
    /Интересно, но действие ещё не подтверждено\./g,
    "Interesting, but the action is not yet confirmed."
  );
  out = out.replace(/Интересно, но/g, "Interesting, but");
  return out;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

const PLAYBOOK_PREP: string[] = [
  "Account signed in and email + phone verified",
  "Shipping address saved as default",
  "Payment card saved as default — check its daily limit",
  "Be online 10 minutes before the drop",
  "Know your exit: where you will resell and what the fees take",
];

const RETAILER_NOTES: { match: string[]; note: string }[] = [
  {
    match: ["snkrs", "nike"],
    note: "Nike / SNKRS: limited launches run as a Draw in the SNKRS app — enter once per account, and the account must have a verified phone number. A win charges your saved card automatically, so the card and default address have to be right before you enter.",
  },
  {
    match: ["adidas", "confirmed"],
    note: "adidas Confirmed: launches run as draws in the Confirmed app — enter before the window closes, keep notifications on, and confirm the win in the app when it lands; the saved card is charged on a win.",
  },
  {
    match: ["kith"],
    note: "Kith: limited launches usually run as draws on kith.com or in the Kith app — enter once with the exact size you want; for in-store draws, bring the ID that matches the entry.",
  },
  {
    match: ["dover street market", "dsm"],
    note: "Dover Street Market: launches sell online on the DSM store (DSMNY is the New York store) — be signed in before the time and move fast; there is no draw, sizes simply sell through.",
  },
  {
    match: ["target"],
    note: "Target: hot drops sell online — join the queue from the product page and stay on it; choose store pickup when it is offered, it skips shipping delays and holds the item at your store.",
  },
  {
    match: ["walmart"],
    note: "Walmart: hot drops sell online with a queue — join early, stay on the product page, and pick store pickup when offered; keep the saved card ready, popular items clear in minutes.",
  },
  {
    match: ["bobs watches", "bobswatches", "watches"],
    note: "Watch sellers (BobsWatches and similar): this is a pre-owned watch — before you pay, verify the authenticity paperwork, box and service history and check the return window. The papers are part of the resale value.",
  },
];

function retailerNoteFor(store: string | null): string {
  if (store) {
    const key = store.toLowerCase();
    const hit = RETAILER_NOTES.find((r) => r.match.some((m) => key.includes(m)));
    if (hit) return hit.note;
  }
  return "Prepare on the retailer's own site: one account in your own name, verified email and phone, a saved default address and card — and read the launch rules on the product page before the window opens.";
}

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  await requireUserId();
  const decision = await getDecisionDetail(params.id);
  if (!decision) notFound();

  const pv = decision.productVariant;
  const releaseEvent = pv.releaseEvents[0];
  const modelLabel = titleCase(pv.product.normalizedModel);
  const resolvedImage = await getProductImage(pv.product.brand, modelLabel);
  const searchImageUrl =
    typeof resolvedImage === "string"
      ? resolvedImage
      : ((resolvedImage as unknown as { url?: string } | null)?.url ?? null);
  const imageUrl = pv.feedCard?.imageUrl ?? searchImageUrl;
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

  const playbookStore =
    pv.availabilityChecks.find((c) => c.sellerOfRecord)?.sellerOfRecord ?? null;
  const statusUpper = decision.status.toUpperCase();
  const releaseStart = releaseEvent?.startAtUtc ?? null;
  const isFutureRelease = releaseStart ? releaseStart.getTime() > Date.now() : false;
  const releaseLine = statusUpper.includes("BUY")
    ? "First come, first served — this can sell out in under a minute."
    : statusUpper.includes("APPLY")
      ? "Raffle / draw — enter once, correctly, before the window closes."
      : statusKey(decision.status) === "prepare" && isFutureRelease
        ? "Scheduled drop — preparation beats speed."
        : "No fixed window is set for this one yet — the preparation below is the play either way.";
  const retailerNote = retailerNoteFor(playbookStore);
  const latestSale = pv.marketSales[0] ?? null;
  const exitLine = latestSale
    ? `Exit plan: completed sales are the reference — the most recent one on this page is ${formatMoneyMinor(latestSale.priceMinor, latestSale.currency)} on ${latestSale.platform}. Sell where those sales happen, and subtract that marketplace's fees and shipping before you count profit.`
    : "Exit plan: check completed sales before you buy — never buy without a sold-price reference.";
  const pricedCheck = pv.availabilityChecks.find((c) => c.priceUsd != null) ?? null;
  const retailUsd = pricedCheck?.priceUsd ?? null;
  const listedCurrency = pricedCheck?.currency?.trim()
    ? pricedCheck.currency.trim().toUpperCase()
    : null;
  const showListedCurrency = listedCurrency !== null && listedCurrency !== "USD";

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
      <Link href="/now" className="inline-flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#1a1a1a]">
        <ArrowLeft size={14} /> Back to feed
      </Link>

      <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white">
        <ImageWithFallback src={imageUrl} alt={`${brand} ${modelLabel}`} className="aspect-[16/10] w-full" eager />
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
            <p className="mt-3 text-[14px] leading-relaxed text-[#374151]">{enSummary(decision.rationale)}</p>
          )}
          <div className="mt-2 text-[12px] tabular-nums text-[#9ca3af]">
            Evidence confidence {decision.evidenceConfidence}/100
          </div>
        </div>
      </div>

      {retailUsd != null && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <h2 className="mb-2 text-[14px] font-semibold text-[#1a1a1a]">Price</h2>
          <div className="flex justify-between py-1 text-[14px]">
            <span className="text-[#6b7280]">Retail price</span>
            <span className="tabular-nums font-medium text-[#1a1a1a]">{formatUsd(retailUsd)}</span>
          </div>
          {showListedCurrency && (
            <div className="flex justify-between py-1 text-[14px]">
              <span className="text-[#6b7280]">Listed currency</span>
              <span className="font-medium text-[#1a1a1a]">{listedCurrency}</span>
            </div>
          )}
          {pricedCheck?.sellerOfRecord && (
            <div className="flex justify-between py-1 text-[14px]">
              <span className="text-[#6b7280]">Seller</span>
              <span className="text-[#1a1a1a]">{pricedCheck.sellerOfRecord}</span>
            </div>
          )}
        </section>
      )}

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
        <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a]">
          <CalendarDays size={16} /> When
        </h2>
        {releaseEvent?.startAtUtc ? (
          releaseEvent.timePrecision === "tba" ? (
            <span className="text-[14px] text-[#6b7280]">Time to be announced</span>
          ) : (
            <div className="text-[15px] font-medium tabular-nums text-[#1a1a1a]">{formatDateEt(releaseEvent.startAtUtc)}</div>
          )
        ) : (
          <p className="text-[14px] leading-relaxed text-[#6b7280]">No fixed window is set for this one yet — this is a live opportunity; watch for changes.</p>
        )}
      </section>

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

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#16a34a]">
          {"Speculator's Playbook"}
        </div>
        <h2 className="mb-2 mt-1 text-[14px] font-semibold text-[#1a1a1a]">
          How an experienced reseller plays this drop
        </h2>
        <p className="text-[14px] font-medium leading-relaxed text-[#1a1a1a]">{releaseLine}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{retailerNote}</p>
        {playbookStore && (
          <p className="mt-2 text-[12px] text-[#6b7280]">Retailer: {playbookStore}</p>
        )}
        <div className="mt-3 text-[12px] font-semibold text-[#1a1a1a]">Prep checklist</div>
        <ul className="mt-1.5 space-y-1.5">
          {PLAYBOOK_PREP.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] text-[#374151]">
              <span aria-hidden="true" className="mt-[1px] text-[#9ca3af]">☐</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-[#374151]">{exitLine}</p>
        <Link href="/playbook" className="mt-3 inline-flex text-[13px] font-semibold text-[#16a34a] hover:underline">
          Full playbook →
        </Link>
      </section>

      {decision.blockedReasons.length > 0 && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
          <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a]">
            <AlertTriangle size={16} className="text-[#d97706]" /> Why not a stronger status
          </h2>
          <ul className="space-y-1">
            {decision.blockedReasons.map((r, i) => (
              <li key={i} className="text-[13px] text-[#6b7280]">{enBlockedReason(r)}</li>
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
