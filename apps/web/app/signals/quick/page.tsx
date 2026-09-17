"use client";
import { useState } from "react";
import { createQuickSignal } from "./actions";

export default function QuickSignalPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-graphite-100">Добавить сигнал (быстро)</h1>
        <p className="text-sm text-graphite-500 mt-1">
          Скриншот, фото, ссылка или просто текст — то, что радар мог пропустить.
        </p>
      </header>

      <form action={createQuickSignal} className="space-y-4" encType="multipart/form-data">
        <div className="border border-graphite-700 rounded-lg p-4 space-y-3">
          <label className="block text-xs text-graphite-500 mb-1">Скриншоты / фото (можно несколько)</label>
          <input
            type="file"
            name="screenshots"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-graphite-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-graphite-700 file:bg-graphite-900 file:text-graphite-200"
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {files.map((f, i) => (
                <span key={i} className="text-[11px] text-graphite-400 bg-graphite-800 border border-graphite-700 rounded px-2 py-1">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border border-graphite-700 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-graphite-500 mb-1">URL (магазин, статья, соцсеть)</label>
            <input
              name="url"
              type="text"
              placeholder="https://..."
              className="w-full bg-graphite-900 border border-graphite-700 rounded px-3 py-2 text-sm text-graphite-100 focus:outline-none focus:border-lime/50"
            />
          </div>
          <div>
            <label className="block text-xs text-graphite-500 mb-1">Текст (если нет ссылки)</label>
            <textarea
              name="rawText"
              rows={4}
              placeholder="Вставь текст со страницы, поста, описание..."
              className="w-full bg-graphite-900 border border-graphite-700 rounded px-3 py-2 text-sm text-graphite-100 focus:outline-none focus:border-lime/50"
            />
          </div>
          <div>
            <label className="block text-xs text-graphite-500 mb-1">Комментарий</label>
            <input
              name="comment"
              type="text"
              placeholder="радар это не увидел / запрос клиента / проверить restock..."
              className="w-full bg-graphite-900 border border-graphite-700 rounded px-3 py-2 text-sm text-graphite-100 focus:outline-none focus:border-lime/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-lime hover:bg-lime/90 text-graphite-950 font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors"
        >
          Сохранить сигнал
        </button>
      </form>
    </div>
  );
}
