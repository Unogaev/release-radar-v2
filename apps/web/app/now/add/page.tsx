"use client";

import { useRef, useState } from "react";
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

export default function AddSignalPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedWithoutRecognition, setSavedWithoutRecognition] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function readJson(response: Response): Promise<Record<string, any>> {
    const body = await response.text();
    if (!body) return {};
    try {
      return JSON.parse(body) as Record<string, any>;
    } catch {
      throw new Error(response.ok ? "Сервер вернул некорректный ответ" : `Ошибка сервера (${response.status})`);
    }
  }

  async function saveForReview(extracted: Extracted | null, recognitionError?: string) {
    const saveRes = await fetch("/api/manual-intake/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(extracted ?? {}),
        url: extracted?.url || url.trim() || null,
        comment: [comment.trim(), recognitionError ? `Автораспознавание не завершилось: ${recognitionError}` : ""]
          .filter(Boolean)
          .join("\n"),
        attachmentNames: files.map((file) => file.name),
        markAsClient: false,
      }),
    });
    const saveData = await readJson(saveRes);
    if (!saveRes.ok) throw new Error(saveData.error || "Ошибка сохранения");
    setSavedWithoutRecognition(!extracted);
    setSavedId(saveData.decisionId || saveData.signalId || "saved");
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      if (url) form.append("url", url);
      if (comment) form.append("comment", comment);

      try {
        const extractRes = await fetch("/api/manual-intake/extract", { method: "POST", body: form });
        const extractData = await readJson(extractRes);
        if (!extractRes.ok) throw new Error(extractData.error || "Ошибка распознавания");
        await saveForReview((extractData.extracted ?? {}) as Extracted);
      } catch (recognitionError) {
        // Recognition is enrichment, not the intake gate. On mobile Safari, a
        // large/odd image or a temporary vision API failure must never discard
        // what the user submitted. The filename, link and comment are retained
        // in the manual review queue and can be checked by a person.
        await saveForReview(
          null,
          recognitionError instanceof Error ? recognitionError.message : "неизвестная ошибка"
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
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

      {!savedId && (
        <div className="flex flex-col gap-5 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
          <div className="rounded-[18px] border border-dashed border-[#36d98a]/35 bg-[#36d98a]/[.05] p-5">
            <label className="mb-3 block text-[13px] font-semibold text-[#68efad]">Скриншоты / фото</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                setError(null);
                setFiles(Array.from(e.target.files ?? []).slice(0, 5));
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex max-w-full items-center rounded-full bg-[#36d98a] px-5 py-3 text-[13px] font-bold text-[#07130d] transition hover:bg-[#68efad]"
            >
              {files.length ? "Изменить фото" : "Выбрать фото"}
            </button>
            <p className="mt-3 text-[11px] leading-4 text-white/35">Можно выбрать до 5 изображений: общий вид, цена, SKU и наличие.</p>
            {files.length > 0 && <div className="mt-3 grid min-w-0 gap-2">{files.map((selected) => <div key={`${selected.name}:${selected.size}`} className="min-w-0 truncate rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] text-white/55">{selected.name}</div>)}</div>}
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
              className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-[14px] outline-none focus:border-[#36d98a]/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-white/70">
              Ваш комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Например: увидел в Instagram, проверить цену и возможность перепродажи"
              className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-[14px] outline-none focus:border-[#36d98a]/50"
            />
          </div>
          {error && <div className="text-[12.5px] text-rr-warn">{error}</div>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (files.length === 0 && !url)}
            className="w-full rounded-full bg-[#36d98a] px-5 py-3.5 text-[13px] font-bold text-[#07130d] shadow-[0_0_30px_rgba(54,217,138,.12)] transition hover:bg-[#68efad] disabled:opacity-40"
          >
            {loading ? "Распознаю и сохраняю..." : "Отправить на проверку"}
          </button>
        </div>
      )}

      {savedId && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
          <div className="font-rr-display text-[22px]">Отправлено на проверку</div>
          <p className="text-[13px] text-rr-text-dim">
            {savedWithoutRecognition
              ? "Находка сохранена в ручную очередь. Автораспознавание не завершилось, но ссылка, комментарий и данные о выбранных файлах не потеряны."
              : "Фото распознано, ссылка и комментарий приняты. Находка сохранена и не потеряется."}
          </p>
          <div className="flex gap-2">
            <Link href="/now" className="bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi">
              К ленте
            </Link>
            <button
              type="button"
              onClick={() => {
                setSavedId(null);
                setFiles([]);
                setUrl("");
                setComment("");
                setSavedWithoutRecognition(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
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
