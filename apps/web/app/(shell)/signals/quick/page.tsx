"use client";
import { useState } from "react";
import { createQuickSignal } from "./actions";

export default function QuickSignalPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-rr-text">Добавить сигнал (быстро)</h1>
        <p className="text-sm text-rr-muted mt-1">
          Скриншот, фото, ссылка или просто текст — то, что радар мог пропустить.
        </p>
      </header>

      <form action={createQuickSignal} className="space-y-4" encType="multipart/form-data">
        <div className="border border-rr-frame rounded-lg p-4 space-y-3">
          <label className="block text-xs text-rr-muted mb-1">Скриншоты / фото (можно несколько)</label>
          <input
            type="file"
            name="screenshots"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-rr-text-dim file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-rr-frame file:bg-rr-surface file:text-rr-text"
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {files.map((f, i) => (
                <span key={i} className="text-[11px] text-rr-text-dim bg-rr-surface-hi border border-rr-frame rounded px-2 py-1">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border border-rr-frame rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-rr-muted mb-1">URL (магазин, статья, соцсеть)</label>
            <input
              name="url"
              type="text"
              placeholder="https://..."
              className="w-full bg-rr-surface border border-rr-frame rounded px-3 py-2 text-sm text-rr-text focus:outline-none focus:border-rr-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-rr-muted mb-1">Текст (если нет ссылки)</label>
            <textarea
              name="rawText"
              rows={4}
              placeholder="Вставь текст со страницы, поста, описание..."
              className="w-full bg-rr-surface border border-rr-frame rounded px-3 py-2 text-sm text-rr-text focus:outline-none focus:border-rr-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-rr-muted mb-1">Комментарий</label>
            <input
              name="comment"
              type="text"
              placeholder="радар это не увидел / запрос клиента / проверить restock..."
              className="w-full bg-rr-surface border border-rr-frame rounded px-3 py-2 text-sm text-rr-text focus:outline-none focus:border-rr-accent/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-rr-accent hover:bg-rr-accent/90 text-rr-bg font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors"
        >
          Сохранить сигнал
        </button>
      </form>
    </div>
  );
}
