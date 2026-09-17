"use client";

export function FeedSkeleton() {
  return (
    <div className="animate-pulse px-11">
      <div className="grid bg-[#110f0d]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 470px), 1fr))" }}>
        <div className="min-h-[540px] bg-rr-frame" />
        <div className="flex flex-col gap-6 px-10 pb-[30px] pt-[38px]">
          <div className="h-3 w-24 bg-rr-well" />
          <div className="h-10 w-4/5 bg-rr-well" />
          <div className="h-10 w-1/2 bg-rr-well" />
          <div className="grid grid-cols-3 gap-px bg-rr-hair">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[66px] bg-rr-surface" />
            ))}
          </div>
          <div className="h-20 bg-rr-well" />
          <div className="h-11 w-2/3 bg-rr-well" />
        </div>
      </div>

      <div
        className="mt-11 grid gap-[26px]"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 430px), 1fr))" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-rr-surface">
            <div className="h-[290px] bg-rr-frame" />
            <div className="flex flex-col gap-4 px-6 pb-6 pt-[22px]">
              <div className="h-2.5 w-20 bg-rr-well" />
              <div className="h-7 w-3/4 bg-rr-well" />
              <div className="h-7 w-1/3 bg-rr-well" />
              <div className="h-[52px] bg-rr-well" />
              <div className="h-10 w-3/5 bg-rr-well" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedEmpty({
  variant = "filter",
  filterLabel,
  nextScanLabel,
  onReset,
}: {
  variant?: "filter" | "all";
  filterLabel?: string;
  nextScanLabel?: string;
  onReset?: () => void;
}) {
  const filtered = variant === "filter";
  return (
    <div className="mx-11 flex flex-col items-start gap-5 bg-rr-surface px-10 py-16">
      <div className="font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-faint">
        {filtered ? `Категория «${filterLabel}»` : "Цикл сканирования завершён"}
      </div>
      <h2 className="max-w-[26ch] text-pretty font-rr-display text-[32px] leading-[1.12]">
        {filtered
          ? "В этой категории сейчас нет сигналов"
          : "Радар не нашёл сигналов за последний цикл"}
      </h2>
      <p className="max-w-[46ch] text-pretty text-[13px] leading-relaxed text-rr-text-dim">
        {filtered
          ? "Условия по марже и наличию не выполнены ни по одной позиции. Сигналы появятся после следующего обхода источников."
          : "Все найденные позиции отсеяны по марже, наличию или достоверности источника."}
        {nextScanLabel ? ` Следующее сканирование в ${nextScanLabel}.` : ""}
      </p>
      {filtered && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="bg-rr-well px-5 py-3 text-[12.5px] text-[#e7e3db] transition-colors hover:bg-[rgba(241,238,232,0.13)]"
        >
          Вернуться к «Сейчас»
        </button>
      )}
    </div>
  );
}

export function FeedError({
  reason,
  onRetry,
}: {
  reason?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-11 flex flex-col items-start gap-5 bg-rr-surface px-10 py-16">
      <div className="font-rr-mono text-[10px] uppercase tracking-[0.22em] text-rr-warn">
        Лента недоступна
      </div>
      <h2 className="max-w-[26ch] text-pretty font-rr-display text-[32px] leading-[1.12]">
        Не удалось получить сигналы
      </h2>
      <p className="max-w-[46ch] text-pretty text-[13px] leading-relaxed text-rr-text-dim">
        {reason ?? "Источники не ответили в отведённое время."} Данные о ценах и наличии могли
        измениться — перед покупкой проверьте источник вручную.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-rr-accent px-5 py-3 text-[12.5px] font-semibold text-[#100e0c] transition-colors hover:bg-rr-accent-hi"
        >
          Повторить
        </button>
      )}
    </div>
  );
}

export function StaleBanner({ at, onRefresh }: { at: string; onRefresh?: () => void }) {
  return (
    <div className="mx-11 mb-6 flex flex-wrap items-center gap-4 border border-[rgba(232,160,106,0.28)] bg-[rgba(232,160,106,0.07)] px-5 py-3.5">
      <span className="font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-warn">
        Данные от {at}
      </span>
      <span className="text-[12.5px] text-rr-text-dim">
        Последний обход источников не завершился, цены могли измениться.
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="ml-auto font-rr-mono text-[10px] uppercase tracking-[0.18em] text-rr-accent transition-colors hover:text-rr-accent-hi"
        >
          Обновить
        </button>
      )}
    </div>
  );
}
