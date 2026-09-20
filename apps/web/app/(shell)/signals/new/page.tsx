import { createSignal } from "./actions";

function Field({ label, name, type = "text", step, defaultValue, placeholder }: {
  label: string; name: string; type?: string; step?: string; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-rr-text-dim mb-1">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-rr-surface border border-rr-hair rounded px-3 py-2 text-sm text-black placeholder:text-rr-muted focus:outline-none focus:border-rr-accent"
      />
    </div>
  );
}

function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-rr-text-dim">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-ember-500" />
      {label}
    </label>
  );
}

function Select({ label, name, options, defaultValue }: {
  label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-rr-text-dim mb-1">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-rr-surface border border-rr-hair rounded px-3 py-2 text-sm text-black placeholder:text-rr-muted focus:outline-none focus:border-rr-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-rr-hair rounded-lg p-4 space-y-3">
      <div className="text-xs uppercase tracking-widest text-rr-accent">{title}</div>
      {children}
    </div>
  );
}

export default function NewSignalPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white">Новый сигнал</h1>
        <p className="text-sm text-rr-text-dim mt-1">
          Каждое поле здесь — прямой вход в hard gate. Ничего не додумывается движком.
        </p>
      </header>

      <form action={createSignal} className="space-y-4">
        <Section title="Идентификация продукта">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Бренд" name="brand" />
            <Field label="Модель" name="model" />
            <Field label="Категория" name="category" placeholder="gaming / watch / sneakers..." />
            <Field label="Вариант (размер/цвет)" name="variantLabel" />
            <Field label="SKU / reference / UPC" name="identifier" />
            <Field label="ZIP" name="zip" placeholder="33160" defaultValue="33160" />
          </div>
        </Section>

        <Section title="Доступность (evidence)">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Тип источника"
              name="sourceType"
              defaultValue="official"
              options={[
                { value: "official", label: "official — прямой источник" },
                { value: "market", label: "market — маркетплейс/аукцион" },
                { value: "signal", label: "signal — соцсети/агрегатор" },
              ]}
            />
            <Field label="Metadata status" name="metadataStatus" placeholder="Pre-order / InStock..." />
            <Field label="Visible UI status" name="visibleUiStatus" placeholder="Coming Soon / Ready to ship..." />
            <Select
              label="CTA state"
              name="ctaState"
              defaultValue="disabled"
              options={[
                { value: "absent", label: "absent" },
                { value: "disabled", label: "disabled" },
                { value: "enabled", label: "enabled" },
              ]}
            />
            <Field label="Продавец (seller of record)" name="sellerOfRecord" />
            <Field label="Разрешённые продавцы (через запятую)" name="allowedSellers" />
            <Field label="Прямая ссылка (checkout/raffle/dealer)" name="evidenceUrl" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Check label="Вариант подтверждён доступным" name="variantAvailable" />
            <Check label="Доставка доступна" name="shippingAvailable" />
            <Check label="Самовывоз доступен" name="pickupAvailable" />
            <Check label="Add to Cart сработал" name="cartSucceeded" />
            <Check label="Дошёл до checkout" name="reachedCheckout" />
            <Check label="Проблемный retailer (требует E4)" name="isProblematicRetailer" />
          </div>
        </Section>

        <Section title="Экономика">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Retail price ($)" name="retailPrice" type="number" step="0.01" />
            <Field label="Max buy price ($)" name="maxBuyPrice" type="number" step="0.01" />
            <Field label="Quantity limit" name="quantityLimit" type="number" />
            <Select
              label="Категория цены (для override)"
              name="priceCategory"
              defaultValue="other"
              options={[
                { value: "other", label: "обычная" },
                { value: "watch", label: "часы" },
                { value: "automotive", label: "автомобиль" },
                { value: "expensive_tech", label: "дорогая техника" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Check label="Это resale-сценарий" name="isResaleScenario" />
            <Check label="Есть completed sales / подтверждённый клиент" name="hasCompletedSalesOrClient" />
            <Check label="Projected economics проходит порог" name="economicsPasses" />
            <Check label="Есть блокирующий legal/logistics risk" name="hasLegalRisk" />
            <Check label="Доказан дефицит (снимает override)" name="provenScarcity" />
            <Check label="Сложная трансграничная сделка" name="crossBorderComplexity" />
          </div>
        </Section>

        <details className="border border-rr-hair rounded-lg p-4">
          <summary className="text-xs uppercase tracking-widest text-rr-accent cursor-pointer">
            + Application / Raffle (если применимо)
          </summary>
          <div className="pt-3 space-y-2">
            <Check label="Это application/raffle сценарий" name="isApplicationScenario" />
            <div className="grid grid-cols-2 gap-2">
              <Check label="Application открыт" name="applicationOpen" />
              <Check label="Closing time известен" name="closingTimeKnown" />
              <Check label="Правила известны" name="rulesKnown" />
              <Check label="Auto-charge раскрыт" name="autoChargeDisclosed" />
              <Check label="Eligibility известна" name="eligibilityKnown" />
              <Check label="Пользователь понимает исход выигрыша" name="userUnderstandsWinOutcome" />
            </div>
          </div>
        </details>

        <details className="border border-rr-hair rounded-lg p-4">
          <summary className="text-xs uppercase tracking-widest text-rr-accent cursor-pointer">
            + Время события / Prepare
          </summary>
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Старт (если известен)" name="startAt" type="datetime-local" />
              <Select
                label="Точность времени"
                name="timePrecision"
                defaultValue="tba"
                options={[
                  { value: "exact", label: "exact — подтверждено официально" },
                  { value: "date_only", label: "date_only — только дата" },
                  { value: "tba", label: "tba — время не подтверждено" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Check label="Первое поколение категории (искл. для TBA)" name="isFirstGenTech" />
              <Check label="URL запуска известен" name="launchUrlKnown" />
              <Check label="Подготовительные действия сформированы" name="preparationActionsFormed" />
            </div>
          </div>
        </details>

        <details className="border border-rr-hair rounded-lg p-4">
          <summary className="text-xs uppercase tracking-widest text-rr-accent cursor-pointer">
            + Client First / Source Now
          </summary>
          <div className="pt-3 space-y-2">
            <Check label="Это client-сценарий (buyer request)" name="isClientScenario" />
            <div className="grid grid-cols-2 gap-2">
              <Check label="Есть buyer request" name="hasBuyerRequest" />
              <Check label="Вариант/размер/цвет сохранены" name="variantDetailsSaved" />
              <Check label="Deadline сохранён" name="deadlineSaved" />
              <Check label="Customer ceiling сохранён" name="customerCeilingSaved" />
            </div>
          </div>
        </details>

        <Section title="Score (0-100) и fallback">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Demand" name="scoreDemand" type="number" defaultValue="50" />
            <Field label="Scarcity" name="scoreScarcity" type="number" defaultValue="50" />
            <Field label="Margin" name="scoreMargin" type="number" defaultValue="50" />
            <Field label="Access" name="scoreAccess" type="number" defaultValue="50" />
            <Field label="Logistics" name="scoreLogistics" type="number" defaultValue="50" />
            <Field label="User fit" name="scoreUserFit" type="number" defaultValue="50" />
          </div>
          <Select
            label="Fallback hint (если ни один gate не пройден)"
            name="fallbackHint"
            defaultValue="low_interest"
            options={[
              { value: "restock_candidate", label: "restock_candidate → WATCH_RESTOCK" },
              { value: "local_clearance_unconfirmed", label: "local_clearance_unconfirmed → VERIFY_IN_STORE" },
              { value: "insufficient_evidence", label: "insufficient_evidence → VERIFY" },
              { value: "low_interest", label: "low_interest → WATCH / SKIP по score" },
            ]}
          />
        </Section>

        <button
          type="submit"
          className="w-full bg-rr-accent hover:bg-rr-accent-hi text-rr-bg font-medium rounded px-4 py-3 text-sm tracking-wide transition-colors"
        >
          Прогнать через decision engine
        </button>
      </form>
    </div>
  );
}
