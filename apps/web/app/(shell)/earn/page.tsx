"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Briefcase } from "lucide-react";

type Task = { id: string; status: string };
type ClientRequest = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  maxPriceUsd: number | null;
  region: string | null;
  deadlineAt: string | null;
  createdAt: string;
  tasks: Task[];
};

export default function EarnPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ClientRequest[] | null>(null);

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d.requests) ? d.requests : []))
      .catch(() => setRequests([]));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-rr-text">{t("earn_title")}</h1>
        <p className="text-sm text-rr-text-dim mt-1 max-w-xl">{t("earn_subtitle")}</p>
      </header>

      {requests === null && (
        <div className="text-sm text-rr-muted">…</div>
      )}

      {requests !== null && requests.length === 0 && (
        <div className="border border-rr-frame rounded-2xl bg-rr-surface p-10 text-center">
          <Briefcase size={28} className="mx-auto text-rr-muted mb-4" />
          <div className="font-display text-lg text-rr-text">{t("earn_empty_title")}</div>
          <p className="text-sm text-rr-text-dim mt-2 max-w-md mx-auto">{t("earn_empty_text")}</p>
        </div>
      )}

      {requests !== null && requests.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/requests/${r.id}`}
              className="block border border-rr-frame rounded-2xl bg-rr-surface p-5 hover:border-rr-accent/40 transition-colors"
            >
              <div className="font-medium text-rr-text leading-snug">{r.title}</div>
              {(r.brand || r.model) && (
                <div className="text-xs text-rr-muted mt-1">{[r.brand, r.model].filter(Boolean).join(" · ")}</div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-rr-text-dim">
                {r.maxPriceUsd != null && (
                  <span><span className="text-rr-muted">{t("earn_budget")}: </span>${r.maxPriceUsd}</span>
                )}
                {r.region && (
                  <span><span className="text-rr-muted">{t("earn_location")}: </span>{r.region}</span>
                )}
                {r.deadlineAt && (
                  <span><span className="text-rr-muted">{t("earn_deadline")}: </span>{new Date(r.deadlineAt).toLocaleDateString()}</span>
                )}
              </div>
              <div className="mt-3 text-xs font-medium text-rr-accent">{t("earn_view")} →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
