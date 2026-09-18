"use client";

import { useState } from "react";
import Link from "next/link";

type Extracted = {
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
  category?: string | null;
  seller?: string | null;
  url?: string | null;
  retailPrice?: number | null;
  currency?: string | null;
  availabilityStatus?: string | null;
  buyButtonText?: string | null;
  sizeOrColor?: string | null;
  purchaseLimit?: string | null;
  storeZip?: string | null;
  athleteName?: string | null;
  signalType?: string | null;
  dateTimeText?: string | null;
  confidence?: number | null;
};

const FIELD_LABELS: [keyof Extracted, string][] = [
  ["brand", "Бренд"],
  ["model", "Модель"],
  ["sku", "SKU / reference"],
  ["category", "Категория"],
  ["seller", "Продавец"],
  ["url", "URL"],
  ["retailPrice", "Цена"],
  ["currency", "Валюта"],
  ["availabilityStatus", "Статус наличия"],
  ["buyButtonText", "Текст кнопки покупки"],
  ["sizeOrColor", "Размер/цвет"],
  ["purchaseLimit", "Лимит покупки"],
  ["storeZip", "ZIP магазина"],
  ["athleteName", "Спортсмен/знаменитость"],
  ["signalType", "Тип (raffle/preorder/restock...)"],
  ["dateTimeText", "Дата/время"],
];

export default function AddSignalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleExtract() {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (file) form.append("image", file);
      if (url) form.append("url", url);
      if (text) form.append("text", text);
      if (comment) form.append("comment", comment);

      const res = await fetch("/api/manual-intake/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка распознавания");
      setExtracted(data.extracted);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: keyof Extracted, value: string) {
    setExtracted((prev) => ({ ...(prev ?? {}), [key]: value }));
  }

  async function handleSave(markAsClient: boolean) {
    if (!extracted) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/manual-intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extracted, comment, markAsClient }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      setSavedId(data.decisionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-rr-bg px-11 py-10 font-rr-sans text-rr-text">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-rr-display text-[28px]">Добавить сигнал вручную</h1>
        <Link href="/now" className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint hover:text-rr-text">
          ← Назад в ленту
        </Link>
      </div>

      {!extracted && (
        <div className="flex max-w-xl flex-col gap-4 bg-rr-surface p-6">
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              Скриншот / фото
            </label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
          </div>
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              Ссылка (магазин, статья, соцсеть)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[rgba(241,238,232,0.06)] px-3 py-2 text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              Текст (если нет фото)
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full bg-[rgba(241,238,232,0.06)] px-3 py-2 text-[13px] outline-none" />
          </div>
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              Комментарий (необязательно)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="радар это не увидел / запрос клиента / проверить restock..."
              className="w-full bg-[rgba(241,238,232,0.06)] px-3 py-2 text-[13px] outline-none"
            />
          </div>
          {error && <div className="text-[12.5px] text-rr-warn">{error}</div>}
          <button
            type="button"
            onClick={handleExtract}
            disabled={loading || (!file && !url && !text)}
            className="self-start bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi disabled:opacity-40"
          >
            {loading ? "Распознаю..." : "Распознать"}
          </button>
        </div>
      )}

      {extracted && !savedId && (
        <div className="flex max-w-xl flex-col gap-4 bg-rr-surface p-6">
          <div className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
            Результат анализа {extracted.confidence != null ? `· уверенность ${extracted.confidence}%` : ""}
          </div>
          {FIELD_LABELS.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">{label}</label>
              <input
                type="text"
                value={(extracted[key] as string) ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full bg-[rgba(241,238,232,0.06)] px-3 py-2 text-[13px] outline-none"
              />
            </div>
          ))}
          {error && <div className="text-[12.5px] text-rr-warn">{error}</div>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !extracted.brand || !extracted.model}
              className="bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi disabled:opacity-40"
            >
              {saving ? "Сохраняю..." : "Сохранить без проверки"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !extracted.brand || !extracted.model}
              className="border border-[rgba(241,238,232,0.18)] bg-[rgba(241,238,232,0.09)] px-5 py-3 text-[12.5px] text-[#e7e3db] transition-colors hover:bg-[rgba(241,238,232,0.16)] disabled:opacity-40"
            >
              Отметить как запрос клиента
            </button>
            <button
              type="button"
              onClick={() => setExtracted(null)}
              className="border border-[rgba(241,238,232,0.18)] px-5 py-3 text-[12.5px] text-rr-faint transition-colors hover:text-rr-text"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {savedId && (
        <div className="flex max-w-xl flex-col gap-4 bg-rr-surface p-6">
          <div className="font-rr-display text-[22px]">Сохранено</div>
          <p className="text-[13px] text-rr-text-dim">
            Сигнал добавлен в ленту (статус — требует проверки). Полная автоматическая проверка магазина и цены
            пока не подключена для вручных сигналов — при необходимости уточни данные сам перед покупкой.
          </p>
          <div className="flex gap-2">
            <Link href="/now" className="bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi">
              К ленте
            </Link>
            <button
              type="button"
              onClick={() => {
                setExtracted(null);
                setSavedId(null);
                setFile(null);
                setUrl("");
                setText("");
                setComment("");
              }}
              className="border border-[rgba(241,238,232,0.18)] px-5 py-3 text-[12.5px] text-rr-faint transition-colors hover:text-rr-text"
            >
              Добавить ещё один
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
