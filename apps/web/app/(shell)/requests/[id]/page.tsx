"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type Task = {
  id: string;
  status: string;
  runnerName: string | null;
  runnerContact: string | null;
  agreedFeeUsd: number | null;
  receiptUrl: string | null;
  receiptAmountUsd: number | null;
};

type ClientRequest = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  identifier: string | null;
  maxPriceUsd: number | null;
  quantity: number | null;
  region: string | null;
  zip: string | null;
  deadlineAt: string | null;
  notes: string | null;
  clientName: string | null;
  clientContact: string | null;
  status: string;
  createdAt: string;
  tasks: Task[];
};

const STATUS_KEY: Record<string, string> = {
  open: "st_open",
  matched: "st_matched",
  in_progress: "st_in_progress",
  fulfilled: "st_fulfilled",
  cancelled: "st_cancelled",
};

const TASK_STATUS_KEY: Record<string, string> = {
  offered: "ts_offered",
  accepted: "ts_accepted",
  sourcing: "ts_sourcing",
  purchased: "ts_purchased",
  delivered: "ts_delivered",
  failed: "ts_failed",
  cancelled: "ts_cancelled",
};

const NEXT_STATUS: Record<string, { to: string; labelKey: string }> = {
  accepted: { to: "sourcing", labelKey: "req_advance_sourcing" },
  sourcing: { to: "purchased", labelKey: "req_advance_purchased" },
  purchased: { to: "delivered", labelKey: "req_advance_delivered" },
};

const inputCls =
  "w-full bg-rr-bg border border-rr-frame rounded-xl px-4 py-2.5 text-sm text-rr-text placeholder:text-rr-muted focus:border-rr-accent outline-none";
const labelCls = "text-xs uppercase tracking-wider text-rr-muted";

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const [req, setReq] = useState<ClientRequest | null>(null);
  const [runnerName, setRunnerName] = useState("");
  const [runnerContact, setRunnerContact] = useState("");
  const [agreedFeeUsd, setAgreedFeeUsd] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofAmount, setProofAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/requests/${params.id}`);
    const data = await res.json();
    setReq(data.request ?? null);
  }, [params.id]);

  useEffect(() => {
    load().catch(() => setReq(null));
  }, [load]);

  async function accept() {
    setAccepting(true);
    try {
      await fetch(`/api/requests/${params.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runnerName,
          runnerContact,
          agreedFeeUsd: agreedFeeUsd ? Number(agreedFeeUsd) : null,
        }),
      });
      await load();
    } finally {
      setAccepting(false);
    }
  }

  async function patchTask(taskId: string, patch: Record<string, unknown>) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  async function saveProof(taskId: string) {
    setSaving(true);
    try {
      await patchTask(taskId, {
        receiptUrl: proofUrl || null,
        receiptAmountUsd: proofAmount ? Number(proofAmount) : null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!req) return <div className="text-sm text-rr-muted">…</div>;

  const activeTask = req.tasks.find((x) => ["accepted", "sourcing", "purchased"].includes(x.status));
  const next = activeTask ? NEXT_STATUS[activeTask.status] : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/earn" className="text-sm text-rr-accent">{t("req_back")}</Link>

      <header>
        <h1 className="font-display text-2xl text-rr-text">{req.title}</h1>
        <div className="mt-2 inline-block text-xs font-medium border border-rr-frame rounded-full px-3 py-1 text-rr-text-dim">
          {t(STATUS_KEY[req.status] ?? req.status)}
        </div>
      </header>

      <div className="border border-rr-frame rounded-2xl bg-rr-surface p-6 space-y-2 text-sm">
        <div className="text-xs uppercase tracking-wider text-rr-muted">{t("req_status")}: {t(STATUS_KEY[req.status] ?? req.status)}</div>
        {(req.brand || req.model) && (
          <div className="text-rr-text">{[req.brand, req.model].filter(Boolean).join(" · ")}</div>
        )}
        {req.identifier && <div className="text-rr-text-dim">SKU: {req.identifier}</div>}
        {req.maxPriceUsd != null && <div className="text-rr-text-dim">{t("earn_budget")}: ${req.maxPriceUsd}</div>}
        {req.quantity != null && <div className="text-rr-text-dim">{t("req_f_qty")}: {req.quantity}</div>}
        {(req.region || req.zip) && (
          <div className="text-rr-text-dim">{t("earn_location")}: {[req.region, req.zip].filter(Boolean).join(" ")}</div>
        )}
        {req.deadlineAt && (
          <div className="text-rr-text-dim">{t("earn_deadline")}: {new Date(req.deadlineAt).toLocaleDateString()}</div>
        )}
        {req.notes && <div className="text-rr-text-dim whitespace-pre-wrap">{req.notes}</div>}
        {req.clientContact && <div className="text-rr-text-dim">{t("req_f_contact")}: {req.clientContact}</div>}
        <div className="text-xs text-rr-muted">{t("req_created")}: {new Date(req.createdAt).toLocaleString()}</div>
      </div>

      {req.status === "open" && (
        <section className="border border-rr-frame rounded-2xl bg-rr-surface p-6 space-y-4">
          <h2 className="font-display text-lg text-rr-text">{t("req_accept_title")}</h2>
          <div>
            <label className={labelCls}>{t("req_runner_name")}</label>
            <input value={runnerName} onChange={(e) => setRunnerName(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_runner_contact")}</label>
            <input value={runnerContact} onChange={(e) => setRunnerContact(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <label className={labelCls}>{t("req_runner_fee")}</label>
            <input type="number" min="0" value={agreedFeeUsd} onChange={(e) => setAgreedFeeUsd(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <button onClick={accept} disabled={accepting} className="w-full bg-rr-accent text-white font-medium rounded-xl px-4 py-2.5 text-sm disabled:opacity-50">
            {accepting ? t("req_accepting") : t("req_accept_btn")}
          </button>
        </section>
      )}

      {req.tasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-rr-text">{t("req_task")}</h2>
          {req.tasks.map((task) => (
            <div key={task.id} className="border border-rr-frame rounded-2xl bg-rr-surface p-5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-rr-text font-medium">{task.runnerName ?? "—"}</span>
                <span className="text-xs text-rr-text-dim">{t(TASK_STATUS_KEY[task.status] ?? task.status)}</span>
              </div>
              {task.agreedFeeUsd != null && (
                <div className="text-rr-text-dim">{t("req_runner_fee")}: ${task.agreedFeeUsd}</div>
              )}
              {task.receiptUrl && (
                <div className="text-rr-text-dim break-all">{t("req_receipt_url")}:{" "}
                  <a href={task.receiptUrl} target="_blank" rel="noreferrer" className="text-rr-accent underline">{task.receiptUrl}</a>
                </div>
              )}
              {task.receiptAmountUsd != null && (
                <div className="text-rr-text-dim">{t("req_receipt_amount")}: ${task.receiptAmountUsd}</div>
              )}

              {task.id === activeTask?.id && (
                <div className="pt-2 space-y-3">
                  {next && (
                    <button onClick={() => patchTask(task.id, { status: next.to })} className="w-full border border-rr-frame rounded-xl px-4 py-2 text-sm text-rr-text hover:border-rr-accent/40">
                      {t(next.labelKey)}
                    </button>
                  )}
                  <button onClick={() => patchTask(task.id, { status: "cancelled" })} className="w-full border border-rr-frame rounded-xl px-4 py-2 text-sm text-red-400">
                    {t("req_cancel_task")}
                  </button>

                  <div className="border-t border-rr-frame pt-3 space-y-2">
                    <div className={labelCls}>{t("req_proof_title")}</div>
                    <input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder={t("req_receipt_url")} className={inputCls} />
                    <input type="number" min="0" value={proofAmount} onChange={(e) => setProofAmount(e.target.value)} placeholder={t("req_receipt_amount")} className={inputCls} />
                    <button onClick={() => saveProof(task.id)} disabled={saving} className="w-full bg-rr-surface-hi border border-rr-frame rounded-xl px-4 py-2 text-sm text-rr-text disabled:opacity-50">
                      {saving ? t("req_saving") : t("req_save_proof")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
