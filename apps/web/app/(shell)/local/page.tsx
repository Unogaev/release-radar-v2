import Link from "next/link";
import { MapPin, ShieldCheck, UserRoundSearch } from "lucide-react";
import { requireUserId } from "@/lib/session";

export default async function LocalPage({
  searchParams,
}: {
  searchParams?: { signal?: string; mode?: string };
}) {
  await requireUserId();
  const requestedSignal = searchParams?.signal;
  const wantsRunner = searchParams?.mode === "runner";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(54,217,138,.14),transparent_38%),#121416] p-6 sm:p-9">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-rr-accent">Radar Local · pilot</div>
        <h1 className="mt-3 max-w-3xl font-rr-editorial text-4xl font-semibold leading-none text-white sm:text-6xl">
          Достать товар там, где он есть.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          Локальный слой Radar соединяет конкретный товар, магазин, время и человека на месте.
          Miami / South Florida — первый пилотный рынок.
        </p>
      </header>

      {requestedSignal && (
        <section className="rounded-[22px] border border-rr-accent/25 bg-rr-accent-soft p-5">
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-rr-accent">
            {wantsRunner ? "Запрос исполнителя" : "Локальный маршрут"}
          </div>
          <div className="mt-2 text-sm text-white/80">
            Сигнал выбран из Radar. ID: <span className="font-mono text-white">{requestedSignal}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            На следующем шаге сюда подключатся город, конкретный магазин, стоимость задания,
            проверка исполнителя и подтверждение выкупа.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-rr-surface p-5">
          <MapPin className="text-rr-accent" size={22} />
          <h2 className="mt-4 text-lg font-semibold text-white">1. Где</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">Страна → город → торговый центр → конкретный магазин.</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-rr-surface p-5">
          <UserRoundSearch className="text-rr-accent" size={22} />
          <h2 className="mt-4 text-lg font-semibold text-white">2. Кто</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">Проверенный человек рядом может проверить очередь, наличие или выкупить товар.</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-rr-surface p-5">
          <ShieldCheck className="text-rr-accent" size={22} />
          <h2 className="mt-4 text-lg font-semibold text-white">3. Доказательство</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">Фото, timestamp, чек и история выполнения вместо слепого доверия.</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#111315] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Local jobs</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Живых заданий пока нет</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Мы не показываем выдуманные очереди или исполнителей. Здесь появятся только реальные локальные задания.
            </p>
          </div>
          <Link href="/earn" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-rr-accent px-5 py-3 text-sm font-bold text-black">
            Хочу зарабатывать
          </Link>
        </div>
      </section>
    </div>
  );
}
