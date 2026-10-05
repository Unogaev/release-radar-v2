import Link from "next/link";
import { BadgeDollarSign, Camera, MapPinned, ShieldCheck } from "lucide-react";
import { requireUserId } from "@/lib/session";

export default async function EarnPage() {
  await requireUserId();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(54,217,138,.16),transparent_36%),#121416] p-6 sm:p-9">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-rr-accent">Earn with Radar</div>
        <h1 className="mt-3 max-w-3xl font-rr-editorial text-4xl font-semibold leading-none text-white sm:text-6xl">
          Нет подписки? Заработай через Radar.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          Помогай людям получать товары, которые доступны рядом с тобой: проверь очередь,
          наличие, сделай live-фото или выполни подтверждённый выкуп.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [MapPinned, "Будь рядом", "Задания привязаны к реальному городу и магазину."],
          [Camera, "Подтверди", "Фото очереди и наличия создают собственные данные Radar."],
          [ShieldCheck, "Расти в рейтинге", "Новые пользователи начинают с простых проверок."],
          [BadgeDollarSign, "Получай оплату", "Сложность и доверие открывают более дорогие задания."],
        ].map(([Icon, title, body]) => {
          const C = Icon as typeof MapPinned;
          return (
            <div key={String(title)} className="rounded-[22px] border border-white/10 bg-rr-surface p-5">
              <C size={21} className="text-rr-accent" />
              <h2 className="mt-4 font-semibold text-white">{String(title)}</h2>
              <p className="mt-2 text-xs leading-5 text-white/45">{String(body)}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#111315] p-6 sm:p-8">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Miami / South Florida pilot</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Открытых заданий пока нет</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          Следующий backend-шаг — профиль исполнителя, город, verification level, заявки заказчиков,
          назначение runner и история выполнения. Demo-задания в production добавлять не будем.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/local" className="rounded-xl bg-rr-accent px-5 py-3 text-sm font-bold text-black">Открыть Local</Link>
          <Link href="/now" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white">Вернуться к сигналам</Link>
        </div>
      </section>
    </div>
  );
}
