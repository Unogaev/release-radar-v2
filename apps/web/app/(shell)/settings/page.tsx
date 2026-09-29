import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { saveSettings } from "./actions";

function field(cls: string) {
  return `w-full rounded-lg border border-rr-frame bg-rr-bg px-3 py-2 text-sm text-rr-text ${cls}`;
}
function label() {
  return "block text-xs font-medium text-rr-text-dim mb-1";
}
function hint() {
  return "text-xs text-rr-text-dim mt-1";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const userId = await requireUserId();
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

  const dollars = (minor: number | null | undefined) =>
    minor != null ? (minor / 100).toString() : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-2xl text-rr-text">Settings</h1>
        <p className="text-sm text-rr-text-dim mt-1">
          Пороги, которые реально читает движок решений. Пустое поле = порог не
          применяется (и движок честно пишет об этом в обосновании).
        </p>
      </header>

      {searchParams.saved === "1" && (
        <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">
          Сохранено. Новые решения будут учитывать эти пороги.
        </div>
      )}

      <form action={saveSettings} className="space-y-5">
        <section className="rounded-xl border border-rr-frame bg-rr-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-rr-text">Бюджет и цель</h2>

          <div>
            <label className={label()} htmlFor="budget">
              Максимальный бюджет на покупку, $
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="например 500"
              defaultValue={dollars(prefs?.budgetMinor)}
              className={field("")}
            />
            <p className={hint()}>
              BUY NOW блокируется, если полная стоимость (цена + налог + доставка)
              выше бюджета.
            </p>
          </div>

          <div>
            <label className={label()} htmlFor="goal">
              Цель
            </label>
            <select
              id="goal"
              name="goal"
              defaultValue={prefs?.goal ?? "self"}
              className={field("")}
            >
              <option value="self">Покупка себе</option>
              <option value="resale">Перепродажа</option>
            </select>
            <p className={hint()}>
              Для перепродажи движок требует реальные завершённые продажи или
              подтверждённый запрос клиента — одних объявлений недостаточно.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-rr-frame bg-rr-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-rr-text">
            Пороги перепродажи
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label()} htmlFor="minProfit">
                Мин. прибыль, $
              </label>
              <input
                id="minProfit"
                name="minProfit"
                type="number"
                min="0"
                step="0.01"
                placeholder="например 50"
                defaultValue={dollars(prefs?.minProfitMinor)}
                className={field("")}
              />
            </div>
            <div>
              <label className={label()} htmlFor="minRoi">
                Мин. ROI, %
              </label>
              <input
                id="minRoi"
                name="minRoi"
                type="number"
                min="0"
                step="0.1"
                placeholder="например 20"
                defaultValue={
                  prefs?.minRoi != null ? (prefs.minRoi * 100).toString() : ""
                }
                className={field("")}
              />
            </div>
          </div>
          <p className={hint()}>
            Если не заданы — действуют стандартные пороги категории (например,
            ROI ≥ 20% для обычной перепродажи).
          </p>
        </section>

        <section className="rounded-xl border border-rr-frame bg-rr-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-rr-text">
            Продавцы и интересы
          </h2>

          <div>
            <label className={label()} htmlFor="allowedRetailers">
              Доверенные продавцы (через запятую)
            </label>
            <input
              id="allowedRetailers"
              name="allowedRetailers"
              type="text"
              placeholder="nike.com, footlocker.com"
              defaultValue={(prefs?.allowedRetailers ?? []).join(", ")}
              className={field("")}
            />
            <p className={hint()}>
              BUY NOW возможен только у продавца из этого списка. Пусто = любой
              наблюдаемый продавец.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label()} htmlFor="zip">
                ZIP-код
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                inputMode="numeric"
                placeholder="33160"
                defaultValue={prefs?.zip ?? ""}
                className={field("")}
              />
            </div>
          </div>

          <div>
            <label className={label()} htmlFor="categories">
              Категории (через запятую)
            </label>
            <input
              id="categories"
              name="categories"
              type="text"
              placeholder="sneakers, gpu"
              defaultValue={(prefs?.categories ?? []).join(", ")}
              className={field("")}
            />
          </div>

          <div>
            <label className={label()} htmlFor="brands">
              Бренды (через запятую)
            </label>
            <input
              id="brands"
              name="brands"
              type="text"
              placeholder="Nike, LEGO"
              defaultValue={(prefs?.brands ?? []).join(", ")}
              className={field("")}
            />
          </div>
        </section>

        <button
          type="submit"
          className="rounded-lg bg-rr-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}
