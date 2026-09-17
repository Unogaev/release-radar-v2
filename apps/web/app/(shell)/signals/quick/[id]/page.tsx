import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function QuickSignalResultPage({ params }: { params: { id: string } }) {
  const signal = await prisma.signal.findUnique({ where: { id: params.id } });
  if (!signal) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-graphite-100">Сигнал сохранён</h1>
        <p className="text-sm text-graphite-500 mt-1">
          Пока без автоматического распознавания — данные ниже сохранены как есть.
        </p>
      </header>

      <div className="border border-graphite-700 rounded-lg p-4 space-y-3 text-sm">
        <div>
          <div className="text-xs text-graphite-500 mb-1">URL</div>
          <div className="text-graphite-200">{signal.url || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-graphite-500 mb-1">Текст / комментарий</div>
          <div className="text-graphite-200 whitespace-pre-wrap">{signal.rawText || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-graphite-500 mb-1">Сохранено</div>
          <div className="text-graphite-200">{new Date(signal.observedAt).toLocaleString("ru-RU")}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/signals/new"
          className="flex-1 text-center bg-lime hover:bg-lime/90 text-graphite-950 font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors"
        >
          Заполнить полную карточку →
        </Link>
        <Link
          href="/signals/quick"
          className="flex-1 text-center border border-graphite-700 hover:border-graphite-600 text-graphite-200 rounded px-4 py-3 text-sm tracking-wide transition-colors"
        >
          Добавить ещё один
        </Link>
      </div>
    </div>
  );
}
