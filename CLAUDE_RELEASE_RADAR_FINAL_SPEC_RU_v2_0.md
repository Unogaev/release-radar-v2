# RELEASE RADAR — FINAL BUILD SPEC ДЛЯ CLAUDE CODE

**Версия:** 2.0 Final  
**Дата фиксации:** 16 сентября 2026  
**Язык продукта:** русский по умолчанию, английский как второй язык  
**Основной рынок закупки:** США  
**Приоритетная география:** Florida, ZIP 33160; Miami-Dade, Broward, Palm Beach  
**Рынки использования:** США, Россия, Дубай — только законные маршруты оплаты, перевозки, экспорта и импорта

---

## 0. Инструкция Claude Code

Построй рабочий MVP Release Radar по этому документу. Считай его главным источником требований. Если старые прототипы, промпты или таблицы противоречат этой версии, действует версия 2.0.

Работай поэтапно:

1. Сначала создай архитектуру, схему данных, миграции, seed-данные и тесты на контрольных кейсах.
2. Затем реализуй интерфейс и API.
3. После этого подключай фоновые задания и источники.
4. Любой источник должен работать через адаптер и сохранять evidence trail.
5. Не выдавай `BUY NOW`, пока сигнал не прошёл обязательные hard gates.
6. Не автоматизируй покупку и не обходи лимиты/антибот-защиту.
7. Все важные решения должны быть объяснимыми и воспроизводимыми.

Если доступ к реальному источнику ещё не подключён, создай mock-адаптер с тем же интерфейсом. Не имитируй реальную доступность товара в production.

---

## 1. Продукт в одном предложении

**Release Radar — персональный action-first помощник, который находит значимые новые товары и короткие окна покупки, проверяет реальную возможность действия и говорит пользователю: подготовиться, купить, подать заявку, найти клиента, проверить или пропустить.**

Это не новостная лента, не витрина товаров и не автономный бот-покупатель.

### Главное обещание

> Пользователь не пропускает действительно важный релиз и не получает ложный сигнал «покупать сейчас», когда оформить заказ невозможно.

### Главная единица продукта

Не новость и не карточка товара, а **проверяемый сигнал с доказательствами, экономикой, точным временем и конкретным действием**.

---

## 2. Для кого продукт

### Обычный пользователь

- покупает интересные новинки для себя;
- следит за любимыми брендами;
- хочет знать точное время старта и получить прямую ссылку;
- не хочет разбираться в resale-терминах.

### Коллекционер

- gaming, sneakers, watches, fashion, luxury, tech, collectibles;
- ценит ограниченный тираж, редкий цвет, reference и provenance.

### PRO-пользователь / байер

- считает landed cost и чистую прибыль;
- работает под клиента;
- отслеживает completed sales, ликвидность, allocations и clearance;
- разделяет asking price и состоявшуюся продажу.

### Закрытый круг друзей

- делится карточками;
- отмечает «я беру»;
- оставляет запрос на размер/цвет/конфигурацию;
- помогает купить дополнительную разрешённую единицу без обхода retailer limits.

---

## 3. Главные уроки, встроенные в v2.0

### 3.1 Карточка товара не равна доступности

Best Buy может отдавать `Pre-order` в метаданных, но показывать пользователю `Coming Soon`. PlayStation Direct может кратко менять технический статус, оставаясь `Currently Unavailable`. Такие состояния не являются restock.

**Новое правило:** `BUY NOW` требует подтверждённого пользовательского действия — активного CTA и доступной доставки/pickup для нужного региона; предпочтительно успешного добавления в корзину или достижения checkout без совершения покупки.

### 3.2 Социальный пост — сигнал спроса, не доказательство сделки

Пост знаменитости, athlete debut, viral story, число лайков и buyer request повышают приоритет проверки, но не доказывают retail, наличие или цену продажи.

### 3.3 Пропущенный drop всё ещё может быть возможностью

Кейс Travis Scott × Nike Zoom Vapor 12 HC показал необходимость:

- rolling-аудита релизов последних семи дней;
- выявления surprise pop-up и celebrity/athlete debut;
- размера как отдельного рынка;
- статуса `CLIENT FIRST / SOURCE NOW`, если официальный drop закончился, но есть покупательский запрос и completed sales.

### 3.4 Живой checkout — сильнейшее доказательство

Кейс SKYLRK Glicky Chrome показал правильную цепочку: celebrity/social signal → точная модель и SKU → официальная страница → `Ready to ship` → активный `Add to Cart` → доступный вариант → покупка пользователя.

### 3.5 Не выдумывать стандартное время

Если бренд подтвердил дату, но не время, интерфейс показывает `TIME TBA`. Нельзя подставлять типичные 10:00 AM как факт. Можно хранить предположение отдельно с пометкой `unconfirmed`, но по нему нельзя ставить обязательный будильник.

### 3.6 Дорогие позиции — сначала клиент

Для часов дороже $10,000, автомобилей, дорогой техники без подтверждённого дефицита и сложных трансграничных сделок стандартный статус — `CLIENT FIRST`, `APPLY NOW` или `CONTACT DEALER`, а не `BUY NOW`.

---

## 4. Интерфейс

### 4.1 Главная навигация

#### СЕЙЧАС

Только действия, которые доступны сейчас и прошли нужный уровень проверки:

- купить;
- подать заявку/raffle;
- зарезервировать pickup;
- связаться с дилером;
- найти товар под подтверждённого клиента.

#### СКОРО

Важные события ближайших 7 дней:

- точная дата и время в локальной зоне пользователя;
- countdown;
- время входа за 10–15 минут;
- аккаунт, membership, карта, Apple Pay/Shop Pay;
- приоритетный размер/цвет/конфигурация;
- лимит и максимальная закупочная цена;
- этап следующего напоминания.

#### НА РАДАРЕ

- официальные анонсы без открытых продаж;
- первые поколения категорий;
- athlete/celebrity debuts;
- потенциальный post-release deficit;
- товары, ожидающие подтверждения времени, рынка или доступности.

#### МОИ ПОКУПКИ

- сохранённые заказы и заявки;
- закупочная цена;
- expected delivery;
- фактический результат;
- продано/оставлено себе/отменено;
- фактическая прибыль или экономия.

### 4.2 Два режима

**Simple:** что, когда, где, сколько и одно понятное действие.  
**PRO:** evidence trail, completed sales, экономика, ликвидность, buyer requests, allocations, logistics и риски.

### 4.3 Карточка сигнала

Обязательные поля:

- фото;
- бренд, модель, точный SKU/reference/UPC/DPCI;
- вариант: цвет, память, размер, trim;
- статус действия;
- retail и полная закупочная стоимость;
- продавец-of-record;
- availability badge с временем последней проверки;
- дата/время ET и локальное время пользователя;
- прямая официальная ссылка;
- одна главная кнопка;
- почему сигнал важен;
- max buy и допустимое количество;
- уровень доказательства;
- предупреждения.

---

## 5. Статусы решения

| Внутренний статус | Пользовательское действие |
|---|---|
| `BUY_NOW` | Купить сейчас по указанной максимальной цене. |
| `APPLY_NOW` | Подать заявку, raffle или waitlist сейчас. |
| `PREPARE` | Подготовиться к подтверждённому будущему старту. |
| `CLIENT_FIRST` | Сначала подтвердить клиента и его потолок. |
| `SOURCE_NOW` | Срочно найти товар под существующий запрос. |
| `CONTACT_DEALER` | Подтвердить allocation, ADM, депозит и delivery. |
| `APPLY_RESERVE` | Подать заявку или зарезервировать allocation. |
| `RESERVE_PICKUP` | Оформить локальный самовывоз. |
| `VERIFY_IN_STORE` | Локальная цена/остаток YMMV; требуется проверка. |
| `WATCH_RESTOCK` | Ждать официальный restock. |
| `WATCH` | Интересно, но действие не подтверждено. |
| `VERIFY` | Не хватает доказательств продавца, цены, подлинности или наличия. |
| `SKIP` | Не покупать. |

В Simple UI сложные статусы можно свести к пяти ярлыкам: `КУПИТЬ`, `ПОДАТЬ ЗАЯВКУ`, `ГОТОВИТЬСЯ`, `СЛЕДИТЬ`, `ПРОПУСТИТЬ`.

---

## 6. Evidence Ladder

| Уровень | Содержание | Что разрешает |
|---|---|---|
| `E0_RUMOR` | слух, repost, неподтверждённый скриншот | только очередь проверки |
| `E1_SIGNAL` | профильное медиа, social/celebrity post, агрегатор | создать signal, не алерт покупки |
| `E2_OFFICIAL` | официальный анонс, newsroom, официальный product page | `WATCH` или `PREPARE`, если время подтверждено |
| `E3_ACTIONABLE` | живой CTA, raffle/application, shipping/pickup для региона | действие возможно, нужна экономика |
| `E4_CART_VERIFIED` | add-to-cart/checkout подтверждён без оплаты | разрешает `BUY_NOW` при остальных gates |
| `E5_USER_CONFIRMED` | пользователь подтвердил order/application | закрыть alert и создать purchase record |

### Запрет на ложный BUY NOW

`BUY_NOW` запрещён, если выполняется хотя бы одно условие:

- доступность взята только из JSON-LD, schema.org, поискового сниппета или кэша;
- CTA отсутствует или disabled;
- UI показывает `Coming Soon`, `Unavailable`, `Sold Out` или аналог;
- shipping/pickup не доступен для выбранного ZIP;
- seller-of-record не разрешён;
- цена/вариант изменились и не подтверждены;
- карточка marketplace принадлежит стороннему продавцу;
- нет max buy price;
- для resale-сценария нет достаточной экономики или клиента.

### Техническое правило доступности

Сохранять раздельно:

- `metadata_status`;
- `visible_ui_status`;
- `cta_state`;
- `variant_available`;
- `shipping_state`;
- `pickup_state`;
- `cart_state`;
- `checkout_state`;
- `seller_of_record`;
- timestamp, ZIP, session region и screenshot/DOM evidence.

При конфликте источников побеждает самый свежий пользовательский UI/checkout, а не метаданные.

---

## 7. Hard Gates для каждого решения

### BUY NOW

Все обязательны:

1. Точная идентификация продукта и варианта.
2. Разрешённый продавец-of-record.
3. `E3` или `E4`; для проблемных retailers — обязательно `E4`.
4. Checkout price и полная стоимость известны.
5. Max buy и quantity limit заданы.
6. Для перепродажи: completed sales или подтверждённый клиент; projected economics проходит порог.
7. Нет блокирующего legal/logistics risk.

### APPLY NOW

- официальный application/raffle/waitlist открыт;
- известны closing time, правила, auto-charge и eligibility;
- пользователь понимает, что произойдёт при выигрыше.

### PREPARE

- событие подтверждено источником `E2`;
- дата и время официальны;
- URL и механизм запуска известны;
- подготовительные действия сформированы.

Если время TBA — только `WATCH`, пока точное время не появится, кроме first-generation tech announcement, где разрешён ранний `PREPARE` без будильника.

### CLIENT FIRST / SOURCE NOW

- существует buyer request либо высокая цена позиции делает инвентарный риск неприемлемым;
- сохранены размер/цвет/configuration, deadline и customer ceiling;
- source cost должен быть ниже вычисленного `max_source_price`.

---

## 8. Жизненный цикл

```text
DISCOVERED
→ IDENTIFIED
→ SOURCE_VERIFIED
→ ACTION_CHECKED
→ MARKET_CHECKED
→ ECONOMICS_CHECKED
→ DECISIONED
→ ALERTED
→ USER_CONFIRMED / EXPIRED / SOLD_OUT / REJECTED
```

Доступность имеет отдельную state machine:

```text
UNKNOWN → ANNOUNCED → SCHEDULED → LIVE_UNVERIFIED
→ ACTIONABLE → CART_VERIFIED → USER_ORDERED
                 ↘ SOLD_OUT / UNAVAILABLE
SOLD_OUT → RESTOCK_CANDIDATE → ACTIONABLE
```

Любое изменение назад разрешено. Например, `ACTIONABLE → UNAVAILABLE` немедленно закрывает `BUY_NOW`.

---

## 9. Источники и адаптеры

### A. Источник истины

- официальный newsroom/store/configurator;
- официальный event/release page;
- authorized retailer/dealer;
- официальный raffle/application/waitlist;
- живой checkout/pickup.

### B. Рыночное подтверждение

- StockX sales history/Last Sale;
- eBay completed/sold;
- auction results;
- GOAT или другая площадка только при наличии фактической сделки;
- dealer paperwork, allocation confirmation, buyer's order.

### C. Генераторы сигналов

- Instagram, TikTok, Reddit, Discord, Telegram;
- athlete/celebrity posts;
- release media;
- BrickSeek, Slickdeals и clearance-аккаунты;
- публичные buyer requests.

Источник C никогда не подтверждает наличие или completed price.

### Интерфейс адаптера

Каждый источник реализует:

```ts
interface SourceAdapter {
  discover(cursor?: string): Promise<RawSignal[]>;
  identify(raw: RawSignal): Promise<ProductCandidate[]>;
  checkAvailability(target: OfferTarget, context: CheckContext): Promise<AvailabilityEvidence>;
  normalize(raw: unknown): Promise<NormalizedEvidence>;
  healthCheck(): Promise<SourceHealth>;
}
```

Адаптер обязан сохранять raw snapshot/hash, URL, checked_at, source type и parse version.

---

## 10. Категории и специальные правила

### Gaming

GTA VI, официальные PlayStation/Xbox editions и bundles, Xbox Series X25, Nintendo limited hardware/controllers, collector's editions и merch.

Для Xbox X25 разрешены: Microsoft Store, Amazon только sold by Amazon, Best Buy, Walmart только sold by Walmart, Target, GameStop. Алерт только при checkout-able official stock не выше $1,050. В срочном алерте: **ПОКУПАТЬ СЕЙЧАС**.

### GPU

NVIDIA Founders Edition, partner cards, AMD Radeon, special colorways/collabs. Источники: manufacturer, Best Buy, B&H, Micro Center, Amazon sold by Amazon, Newegg sold by Newegg или подтверждённый authorized partner.

### Tech и камеры

Apple, Samsung, Sony, Nintendo, Microsoft, Google, Meta, Leica, DJI, Canon, Nikon, Fujifilm. First-generation category и радикально новый form factor получают alert в день анонса. Для дорогой техники считать Florida landed cost, цену продажи для 20% ROI, лучший цвет/память и необходимость клиента.

### Sneakers / streetwear / fashion / vintage

Рынок анализируется по размеру. Surprise drops, pop-ups и athlete debuts входят в hourly scan и ежедневный seven-day missed-signal audit.

### Watches

Отдельный модуль. Хранить brand/reference, edition size, retail ex/in tax, ordering country/method, buyer limits, completed sales, asks separately, expected exit, insured shipping, fees/duties, profit, liquidity, holding period, service and sanctions risk. Для >$10,000 без клиента запрещён `BUY_NOW`.

### Chrome Hearts

Проверять физический showroom/address, историю, независимые отзывы, специализацию, provenance, Instagram/site, return policy и red flags. Не называть продавца надёжным без доказательств. Для товара указывать метод аутентификации.

### Fragrance

Limited/collab/exclusive/discontinued/restock; учитывать counterfeit, leakage, temperature и air-shipping restrictions.

### Local clearance

Обязательны конкретный магазин/ZIP, SKU/UPC/DPCI, состояние, фактическая локальная цена, реальный pickup/checkout, quantity/membership, seller-of-record, tax, completed sales и net profit. Неподтверждённый один магазин: `VERIFY_IN_STORE`, не `BUY_NOW`.

### Automotive

Официальные announcements/configurators/order books, dealer allocations, canceled orders, no-ADM inventory. Porsche Code не является allocation. Без конечного клиента — `CLIENT_FIRST` или `CONTACT_DEALER`.

---

## 11. Экономика

### Базовые формулы

```text
landed_cost = retail
            + sales_tax
            + inbound_shipping
            + membership_or_entry_fee
            + insurance
            + import_duties_if_applicable

net_proceeds = sale_price
             - platform_fee
             - payment_fee
             - outbound_shipping
             - insurance
             - returns_risk_reserve

net_profit = net_proceeds - landed_cost
roi = net_profit / landed_cost
```

Минимальная цена продажи для target ROI:

```text
min_sale_price = (landed_cost × (1 + target_roi) + fixed_exit_costs)
                 / (1 - total_variable_fee_rate)
```

### Пороги

- обычный resale alert: ожидаемый ROI ≥ 20% после расходов;
- clearance: ≥ $50 net profit или ≥ 30% ROI;
- ликвидные Apple/consoles/GPU/cameras/LEGO/luxury: допускается ≥ $30 при быстром обороте;
- independent watches ≤100 pieces могут пройти без подтверждённой маржи при официальном ограниченном доступе и коллекционной значимости;
- дорогая техника и luxury без клиента — `CLIENT_FIRST`.

Показывать диапазон и confidence, а не ложную точность.

---

## 12. Scoring

Scoring ранжирует очередь, но не отменяет hard gates.

```text
score = demand × 0.25
      + scarcity × 0.20
      + margin × 0.20
      + access × 0.15
      + logistics × 0.10
      + user_fit × 0.10
```

Каждая компонента 0–100.

- 80–100: срочная проверка и действие при прохождении gates;
- 65–79: `WATCH/VERIFY`;
- <65: `SKIP`, кроме подтверждённого buyer request.

Добавить отдельный `evidence_confidence`, который нельзя компенсировать высоким hype score.

---

## 13. Напоминания и календарь

Для `BUY_NOW`, `APPLY_NOW`, `PREPARE`:

- первое обнаружение;
- примерно за 72 часа;
- примерно за 24 часа;
- примерно за 3 часа;
- примерно за 1 час;
- в первый час после открытия.

Каждый этап один раз. Idempotency key:

```text
user_id:event_id:stage:event_start_version
```

Если время изменилось, увеличить `event_start_version`, отменить будущие старые reminders и отправить `TIME_CHANGED`. Если продажа открылась раньше — `OPENED_EARLY` независимо от предыдущих этапов.

Каждый предрелизный алерт содержит:

- «КОГДА БЫТЬ У КОМПЬЮТЕРА» в локальном времени;
- вход за 10–15 минут;
- аккаунт, адрес, карта, wallet, membership;
- приоритетный вариант;
- допустимое количество;
- max buy;
- прямую ссылку.

Хранить исходный timezone и UTC. ET вычислять с DST через IANA zone `America/New_York`, не фиксированный offset.

---

## 14. Персонализация и buyer requests

Профиль:

- категории и бренды;
- размеры обуви/одежды;
- бюджет;
- ZIP/город;
- страны покупки;
- цель: для себя / resale / под клиента;
- минимальная прибыль/ROI;
- каналы уведомлений;
- quiet hours;
- разрешённые retailers.

Buyer request:

- exact product/SKU/reference;
- variant/size/color/configuration;
- customer ceiling;
- deadline;
- destination;
- deposit/commitment state;
- provenance requirements;
- contact owner;
- legal/logistics flags.

`max_source_price` рассчитывается назад от customer ceiling с учётом всех расходов и требуемой прибыли.

---

## 15. Модель данных

Минимальные таблицы:

### Core

- `users`
- `user_preferences`
- `products`
- `product_variants`
- `identifiers`
- `sources`
- `sellers`
- `offers`
- `release_events`
- `availability_checks`
- `evidence`
- `signals`
- `decisions`
- `alerts`
- `reminder_events`
- `market_sales`
- `market_asks`
- `buyer_requests`
- `purchases`
- `circles`
- `circle_members`
- `source_health`
- `audit_log`

### Ключевые ограничения

- `market_sales` и `market_asks` — разные таблицы;
- каждый price имеет currency, source, observed_at и variant;
- availability check привязан к ZIP/region и seller-of-record;
- release event хранит `start_at_utc`, `source_timezone`, `time_precision` (`exact`, `date_only`, `tba`);
- evidence immutable; новая проверка создаёт новую запись;
- decision хранит rule version и объяснение;
- purchase создаётся только после явного подтверждения пользователя или подтверждённого order event.

### Deduplication

Основной product key:

```text
brand + normalized_model + exact_identifier + variant
```

Offer key:

```text
product_variant_id + seller_id + seller_sku + region
```

Не объединять разные размеры, память, цвет или seller-of-record.

---

## 16. Архитектура

### Рекомендуемый стек

- Frontend: Next.js + TypeScript, responsive PWA;
- UI: Tailwind + shadcn/ui;
- Backend/API: Next.js server routes или отдельный TypeScript service;
- DB/Auth/Storage: PostgreSQL, допустим Supabase;
- Jobs/queues: Redis + BullMQ или эквивалент;
- Browser verification: Playwright в изолированных workers;
- Classification: локальная/дешёвая модель или Ollama для массового triage;
- Deep analysis: Claude только для top-ranked неоднозначных сигналов;
- Notifications: Telegram первым, затем Web Push/email;
- Observability: structured logs, source health, alert audit.

### Pipeline

```text
Sources
→ adapters
→ normalization/identity resolution
→ deduplication
→ evidence classification
→ availability verification
→ market/economics
→ hard gates + scoring
→ decision
→ alert/reminder dispatcher
→ user confirmation and outcome feedback
```

AI не определяет live inventory без инструментального evidence. Rule engine имеет последнее слово для опасных статусов.

---

## 17. Фоновые задания

- priority inventory monitor: каждый час;
- upcoming 72h events: каждый час;
- reminder dispatcher: каждый час;
- newsroom/event monitor: каждый час;
- athlete/celebrity/surprise-drop scan: каждый час;
- seven-day missed-signal audit: ежедневно;
- active completed-sales refresh: чаще для живых signals;
- local clearance by ZIP/store: каждый час;
- evening 7-day calendar: вечером ET;
- source health check: ежедневно;
- stale availability invalidator: закрывать live state после TTL, зависящего от retailer.

Для restock использовать короткий TTL. Устаревший успешный check не поддерживает `BUY_NOW` бесконечно.

---

## 18. Уведомления

### BUY NOW

```text
🚨 ПОКУПАТЬ СЕЙЧАС

[Товар · вариант]
[Retail] → [полная стоимость]
[Продавец] · [shipping/pickup] · лимит [N]

Проверено: [время ET], CTA/корзина доступны для [ZIP]
Максимальная цена: [max buy]
Почему: [одна строка]
Риск: [одна строка]

[КУПИТЬ]
```

Если корзина не подтверждена, нельзя писать «ПОКУПАТЬ СЕЙЧАС».

### PREPARE

```text
⚡ ЗА [ЭТАП] ДО СТАРТА

КОГДА БЫТЬ У КОМПЬЮТЕРА: [локальное время]
СТАРТ: [локальное время]

Подготовить: [аккаунт, адрес, карта, membership]
Приоритет: [вариант]
Лимит: [N] · max buy: [сумма]

[ОТКРЫТЬ ОФИЦИАЛЬНУЮ СТРАНИЦУ]
```

### CLIENT FIRST

Показывать customer ceiling, max source price, дедлайн и требуемую аутентификацию. Не использовать `BUY_NOW` до подтверждения клиента.

---

## 19. Безопасность и юридические ограничения

- никогда не вводить оплату и не завершать заказ без явного действия пользователя;
- не обходить CAPTCHA, очередь, purchase limits или anti-bot;
- не использовать несколько аккаунтов для обхода лимита;
- не рекомендовать нарушение санкций, экспортного контроля или таможенных правил;
- не хранить полные card credentials;
- не публиковать персональные данные buyer requests в Circles;
- authenticity по фото всегда вероятностная; для дорогих товаров требовать provenance/экспертизу;
- Porsche Code/configurator не считать order или allocation;
- asking price никогда не отображать как sale.

---

## 20. Контрольные acceptance tests

### AT-01 — Best Buy false positive

Дано: metadata содержит `Pre-order`, UI показывает `Coming Soon`, CTA disabled.  
Ожидание: `WATCH_RESTOCK`; `BUY_NOW` и push запрещены.

### AT-02 — PlayStation Direct transient status

Дано: индексируемый статус изменился, но live UI показывает `Currently Unavailable`.  
Ожидание: `WATCH_RESTOCK`; evidence conflict записан.

### AT-03 — SKYLRK successful path

Дано: официальный product page, SKU `SLE003-1011`, $190, `Ready to ship`, вариант доступен, Add to Cart работает.  
Ожидание: после market/purpose gate разрешён actionable signal; после подтверждения пользователя создаётся purchase и alert закрывается.

### AT-04 — Travis missed drop

Дано: athlete debut, pop-up и online drop в последние 7 дней; sold out; buyer request US 6.5/7/10/12; completed sales выше retail.  
Ожидание: `CLIENT_FIRST / SOURCE_NOW`; при официальном retail restock и достаточной экономике — `BUY_NOW`.

### AT-05 — Time TBA

Дано: дата подтверждена, время только предполагается медиа.  
Ожидание: показать `TIME TBA`, не создавать 1h/open reminders и не выдавать предположение за факт.

### AT-06 — Auto-charge raffle

Дано: raffle автоматически списывает деньги при выигрыше.  
Ожидание: обязательное предупреждение и включение суммы потенциального auto-charge; пользователь выбирает заявки отдельно.

### AT-07 — Marketplace seller

Дано: Amazon/Walmart listing доступен, seller сторонний.  
Ожидание: не считать официальным stock для retailer-restricted watchlist.

### AT-08 — Asking vs completed

Дано: asks $1,500, completed sales $650–800.  
Ожидание: экономика строится по completed range; asks показываются отдельно.

### AT-09 — Expensive watch

Дано: limited watch $50,000, application открыт, клиента нет.  
Ожидание: `APPLY_NOW` или `CLIENT_FIRST`, не `BUY_NOW`.

### AT-10 — Local clearance

Дано: viral screenshot без store-level checkout.  
Ожидание: `VERIFY_IN_STORE`, пока не подтверждены конкретный магазин, цена и остаток.

### AT-11 — Changed release time

Дано: официальный start изменился после отправленного 24h reminder.  
Ожидание: старые будущие reminders отменены, отправлен `TIME_CHANGED`, новые stages имеют новую version key.

### AT-12 — Duplicate alert

Дано: один адаптер вернул то же событие несколько раз.  
Ожидание: один alert на stage; evidence обновляется без повторного push.

---

## 21. Метрики

Главная:

**Доля значимых релизов, по которым пользователь успел выполнить правильное действие до закрытия окна.**

Guardrail-метрика:

**False actionable alert rate** — доля `BUY_NOW/APPLY_NOW`, по которым действие фактически было невозможно. Цель MVP: <2%; для `BUY_NOW` стремиться к <1%.

Дополнительные:

- successful checkout/application rate;
- missed strong signals;
- alert-to-click;
- user-confirmed purchases;
- confirmed savings vs resale;
- actual PRO net profit;
- irrelevant notification rate;
- time from official availability to alert;
- source health and stale-check rate;
- percentage of decisions with complete evidence trail.

---

## 22. План реализации

### Phase 0 — Foundation

- monorepo и environments;
- DB schema/migrations;
- seed с контрольными кейсами;
- rule engine и evidence ladder;
- unit/integration tests AT-01…AT-12;
- audit log.

**Definition of Done:** все acceptance tests проходят без UI.

### Phase 1 — Useful MVP

- onboarding/preferences;
- СЕЙЧАС / СКОРО / НА РАДАРЕ;
- product/signal pages;
- manual signal entry;
- release calendar;
- Telegram/Web Push;
- reminders и idempotency;
- mock + 3–5 official source adapters.

**Definition of Done:** пользователь получает точный reminder, открывает официальную страницу и подтверждает результат.

### Phase 2 — Live Verification

- browser workers;
- CTA/variant/shipping/cart checks;
- retailer-specific status parsers;
- ZIP-aware availability;
- screenshots/DOM hashes;
- TTL and stale invalidation.

**Definition of Done:** Best Buy/PlayStation false-positive cases не создают `BUY_NOW`.

### Phase 3 — PRO Economics

- completed sales import;
- asks separated;
- fee profiles;
- landed cost/min sale price;
- buyer requests and reverse max-source calculation;
- size-level sneaker market;
- watches/luxury evidence fields.

### Phase 4 — Expansion

- Circles;
- dealer/allocation CRM;
- local clearance stores;
- automotive module;
- outcome learning and threshold tuning.

---

## 23. Что не строить в первой версии

- собственный marketplace;
- автоматическую оплату;
- антибот/limit bypass;
- большую социальную сеть;
- AI-chat как главный экран;
- поддержку всех категорий и retailers одновременно;
- predictive hype score без evidence gates;
- красивые графики, не ведущие к действию.

---

## 24. Первый engineering backlog

### P0

1. Schema и migrations.
2. Identity resolver для SKU/reference/variant.
3. Evidence model и immutable snapshots.
4. Availability state machine.
5. Hard-gate decision engine.
6. Reminder scheduler с versioned idempotency.
7. Economics engine.
8. Seller-of-record validation.
9. Acceptance test fixtures.
10. Audit/replay endpoint для каждого решения.

### P1

1. User onboarding.
2. Три главных feed-блока.
3. Signal detail/evidence trail.
4. Calendar 7 days.
5. Telegram/Web Push.
6. Manual buyer request.
7. Manual user purchase confirmation.
8. Source health dashboard.

### P2

1. Browser verification workers.
2. Market data and liquidity.
3. Social/celebrity detection.
4. Seven-day missed-signal audit.
5. Local clearance.
6. Watches and automotive PRO modules.

---

## 25. Готовый стартовый промпт для Claude Code

> Открой `CLAUDE_RELEASE_RADAR_FINAL_SPEC_RU_v2.0.md` и реализуй Phase 0, затем Phase 1. Сначала предложи краткий architecture decision record и структуру репозитория. После подтверждения создай схему PostgreSQL, миграции, seed fixtures и автоматические тесты AT-01…AT-12. Только когда тесты rule engine проходят, переходи к Next.js PWA с экранами СЕЙЧАС, СКОРО, НА РАДАРЕ и МОИ ПОКУПКИ. Не выдавай `BUY_NOW` на основании metadata/search snippet: статус требует live actionable evidence по правилам спецификации. Все внешние источники подключай через адаптеры; если credentials отсутствуют, используй явно обозначенные mocks. Не автоматизируй оплату.

---

## 26. Главный принцип

Release Radar должен отвечать не «что вышло?», а:

> **Какое полезное действие доступно пользователю сейчас, какими доказательствами оно подтверждено, сколько оно реально стоит и что может пойти не так?**

Если система не может доказать возможность действия, она должна честно сказать `WATCH` или `VERIFY`, а не создавать ложную срочность.
