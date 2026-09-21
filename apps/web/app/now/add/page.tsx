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
  const [files, setFiles] = useState<File[]>([]);
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
      files.forEach((file) => form.append("images", file));
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
    <div className="min-h-screen bg-[#0b0b0c] px-4 py-6 font-rr-sans text-[#f3efe8] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#c6a66b]">Manual intake</div><h1 className="font-rr-display text-[28px] leading-tight sm:text-[34px]">Прислать находку</h1><p className="mt-2 max-w-lg text-[13px] leading-5 text-white/45">Загрузи скрины новинки, рестока или поста из ленты. Радар распознает товар и сохранит его на проверку.</p></div>
        <Link href="/now" className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint hover:text-rr-text">
          Закрыть ×
        </Link>
      </div>

      {!extracted && (
        <div className="flex flex-col gap-5 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
          <div className="rounded-[18px] border border-dashed border-[#c6a66b]/35 bg-[#c6a66b]/[.05] p-5">
            <label className="mb-3 block text-[13px] font-semibold text-[#d7bb85]">Скриншоты / фото</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} className="block w-full text-[12px] text-white/55 file:mr-3 file:rounded-full file:border-0 file:bg-[#ece5d9] file:px-4 file:py-2.5 file:text-[12px] file:font-bold file:text-[#171513]" />
            <p className="mt-3 text-[11px] leading-4 text-white/35">Можно выбрать до 5 изображений: общий вид, цена, SKU и наличие.</p>
            {files.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{files.map((selected) => <span key={`${selected.name}:${selected.size}`} className="max-w-full truncate rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] text-white/55">{selected.name}</span>)}</div>}
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
              className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-[14px] outline-none focus:border-[#c6a66b]/50"
            />
          </div>
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              Текст (если нет фото)
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Скопируй подпись к посту или название товара" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-[14px] outline-none focus:border-[#c6a66b]/50" />
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
              className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-[14px] outline-none focus:border-[#c6a66b]/50"
            />
          </div>
          {error && <div className="text-[12.5px] text-rr-warn">{error}</div>}
          <button
            type="button"
            onClick={handleExtract}
            disabled={loading || (files.length === 0 && !url && !text)}
            className="w-full rounded-full bg-[#ece5d9] px-5 py-3.5 text-[13px] font-bold text-[#171513] transition hover:bg-white disabled:opacity-40"
          >
            {loading ? "Распознаю..." : "Распознать"}
          </button>
        </div>
      )}

      {extracted && !savedId && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
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
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
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
                setFiles([]);
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
    </div>
  );
}
