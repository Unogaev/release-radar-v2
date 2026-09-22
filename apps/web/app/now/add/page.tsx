"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "recognizing" | "saving">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

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
    setSavedLabel([extracted?.brand, extracted?.model].filter(Boolean).join(" ") || null);
    setSavedId(saveData.decisionId || saveData.signalId || "saved");
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    setProgress("uploading");
    try {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      if (url) form.append("url", url);
      if (comment) form.append("comment", comment);

      try {
        setProgress("recognizing");
        const extractRes = await fetch("/api/manual-intake/extract", { method: "POST", body: form });
        const extractData = await readJson(extractRes);
        if (!extractRes.ok) throw new Error(extractData.error || "Ошибка распознавания");
        setProgress("saving");
        await saveForReview((extractData.extracted ?? {}) as Extracted);
      } catch (recognitionError) {
        // Recognition is enrichment, not the intake gate. On mobile Safari, a
        // large/odd image or a temporary vision API failure must never discard
        // what the user submitted. The filename, link and comment are retained
        // in the manual review queue and can be checked by a person.
        setProgress("saving");
        await saveForReview(
          null,
          recognitionError instanceof Error ? recognitionError.message : "неизвестная ошибка"
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setProgress("idle");
    }
  }

  function selectFiles(nextFiles: File[]) {
    const selected = nextFiles.slice(0, 5);
    const tooLarge = selected.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError(`${tooLarge.name}: файл больше 10 МБ`);
      return;
    }
    setError(null);
    setFiles(selected);
  }

  const progressLabel = progress === "uploading"
    ? "Загружаю скриншоты…"
    : progress === "recognizing"
      ? "Распознаю товар, цену и SKU…"
      : progress === "saving"
        ? "Сохраняю находку на проверку…"
        : "Отправить на проверку";

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#0b0b0c] px-4 py-5 font-rr-sans text-[#f3efe8] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-5 sm:mb-7">
        <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#c6a66b]">Добавить вручную</div><h1 className="font-rr-display text-[30px] leading-tight sm:text-[34px]">Добавить со скрина</h1><p className="mt-2 max-w-lg text-[13px] leading-5 text-white/45">Выбери до пяти скриншотов. Радар прочитает название, цену, SKU и наличие, затем сохранит находку на проверку.</p></div>
        <Link href="/now" className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint hover:text-rr-text">
          Закрыть ×
        </Link>
      </div>

      {!savedId && (
        <div className="flex flex-col gap-5 rounded-[22px] border border-white/10 bg-[#141414] p-4 sm:p-7">
          <div className="rounded-[18px] border border-dashed border-[#36d98a]/35 bg-[#36d98a]/[.05] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3"><label className="block text-[13px] font-semibold text-[#68efad]">1. Скриншоты / фото</label><span className="text-[10px] text-white/35">{files.length}/5</span></div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              multiple
              onChange={(e) => {
                selectFiles(Array.from(e.target.files ?? []));
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex max-w-full items-center rounded-full bg-[#36d98a] px-5 py-3 text-[13px] font-bold text-[#07130d] transition hover:bg-[#68efad]"
            >
              {files.length ? "Выбрать другие" : "Выбрать скриншоты"}
            </button>
            <p className="mt-3 text-[11px] leading-4 text-white/35">Лучше всего: общий вид товара, карточка с ценой, SKU и экран наличия.</p>
            {previews.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{previews.map(({ file, url: previewUrl }, index) => <div key={`${file.name}:${file.size}`} className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/30"><img src={previewUrl} alt={`Скриншот ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label={`Удалить ${file.name}`} onClick={() => { setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-sm text-white">×</button><div className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-[9px] text-white/70">{file.name}</div></div>)}</div>}
          </div>
          <div>
            <label className="mb-1 block font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-faint">
              2. Ссылка — необязательно
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
              3. Комментарий — необязательно
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
            {loading ? progressLabel : "Распознать и сохранить"}
          </button>
        </div>
      )}

      {savedId && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#36d98a]/15 text-xl text-[#68efad]">✓</div>
          <div className="font-rr-display text-[24px]">Отправлено на проверку</div>
          {savedLabel && <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[13px] font-semibold text-white/80">Распознано: {savedLabel}</div>}
          <p className="text-[13px] text-rr-text-dim">
            {savedWithoutRecognition
              ? "Находка сохранена в ручную очередь. Автораспознавание не завершилось, поэтому товар будет проверен вручную по ссылке, комментарию и списку приложенных файлов."
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
                setSavedLabel(null);
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
