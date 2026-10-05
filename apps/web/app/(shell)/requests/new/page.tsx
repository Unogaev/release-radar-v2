"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const inputCls =
  "w-full bg-rr-bg border border-rr-frame rounded-xl px-4 py-2.5 text-sm text-rr-text placeholder:text-rr-muted focus:border-rr-accent outline-none";
const labelCls = "text-xs uppercase tracking-wider text-rr-muted";

function NewRequestForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const sp = useSearchParams();

  const brandParam = sp.get("brand") ?? "";
  const modelParam = sp.get("model") ?? "";
  const skuParam = sp.get("sku") ?? "";
  const priceParam = sp.get("price") ?? "";
  const urlParam = sp.get("url") ?? "";

  const [title, setTitle] = useState(
    brandParam && modelParam ? `${brandParam} ${modelParam}` : brandParam || modelParam
  );
  const [brand, setBrand] = useState(brandParam);
  const [model, setModel] = useState(modelParam);
  const [identifier, setIdentifier] = useState(skuParam);
  const [maxPriceUsd, setMaxPriceUsd] = useState(priceParam);
  const [quantity, setQuantity] = useState("1");
  const [region, setRegion] = useState("");
  const [zip, setZip] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [notes, setNotes] = useState(urlParam ? `Source: ${urlParam}` : "");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brand: brand || null,
          model: model || null,
          identifier: identifier || null,
          maxPriceUsd: maxPriceUsd ? Number(maxPriceUsd) : null,
          quantity: quantity ? Number(quantity) : 1,
          region: region || null,
          zip: zip || null,
          deadlineAt: deadlineAt || null,
          notes: notes || null,
          clientName: clientName || null,
          clientContact: clientContact || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.request?.id) throw new Error("post failed");
      router.push(`/requests/${data.request.id}`);
    } catch {
      setError(true);
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-2xl text-rr-text">{t("req_new_title")}</h1>
        <p className="text-sm text-rr-text-dim mt-1">{t("req_new_subtitle")}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 border border-rr-frame rounded-2xl bg-rr-surface p-6">
        <div>
          <label className={labelCls}>{t("req_f_title")}</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("req_f_title_ph")} className={`${inputCls} mt-1.5`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("req_f_brand")}</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_f_model")}</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("req_f_sku")}</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_f_qty")}</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("req_f_budget")}</label>
          <input type="number" min="0" value={maxPriceUsd} onChange={(e) => setMaxPriceUsd(e.target.value)} className={`${inputCls} mt-1.5`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("req_f_region")}</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t("req_f_region_ph")} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_f_zip")}</label>
            <input value={zip} onChange={(e) => setZip(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("req_f_deadline")}</label>
          <input type="date" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className={`${inputCls} mt-1.5`} />
        </div>

        <div>
          <label className={labelCls}>{t("req_f_notes")}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("req_f_notes_ph")} rows={3} className={`${inputCls} mt-1.5`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("req_f_name")}</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_f_contact")}</label>
            <input value={clientContact} onChange={(e) => setClientContact(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
        </div>

        {error && <div className="text-sm text-red-400">{t("req_f_error")}</div>}

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-rr-accent text-white font-medium rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {sending ? t("req_f_sending") : t("req_f_submit")}
        </button>
      </form>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense>
      <NewRequestForm />
    </Suspense>
  );
}
