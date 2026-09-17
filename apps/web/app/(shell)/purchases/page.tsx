import { requireUserId } from "@/lib/session";
import { getMyPurchases } from "@/lib/data";
import { formatMoneyMinor } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export default async function PurchasesPage() {
  const userId = await requireUserId();
  const purchases = await getMyPurchases(userId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">Мои покупки</h1>
        <p className="text-sm text-ink-600 mt-1">
          Сохранённые заказы, закупочная цена, фактический результат.
        </p>
      </header>

      {purchases.length === 0 ? (
        <EmptyState text="Пока нет подтверждённых покупок." />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-ink-600 border-b border-ink-700">
            <tr>
              <th className="py-2 font-normal">Товар</th>
              <th className="font-normal">Стоимость</th>
              <th className="font-normal">Статус</th>
              <th className="font-normal">Результат</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-ink-800">
                <td className="py-3">
                  {p.productVariant.product.brand} {p.productVariant.product.normalizedModel}
                </td>
                <td>{formatMoneyMinor(p.actualCostMinor, p.currency)}</td>
                <td className="text-ink-600">{p.status}</td>
                <td>
                  {p.outcome === "sold" && p.actualProfitMinor != null
                    ? formatMoneyMinor(p.actualProfitMinor, p.currency)
                    : p.outcome ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
