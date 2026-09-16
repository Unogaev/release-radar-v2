# Release Radar v2.0 — Phase 0

Реализация по `CLAUDE_RELEASE_RADAR_FINAL_SPEC_RU_v2_0.md` — единственному
актуальному ТЗ. Старые прототипы (v1, с 5 статусами BUY_NOW/PREPARE/
CLIENT_FIRST/WATCH/SKIP) не используются.

## Статус: Phase 0 — Definition of Done достигнут

```
npx tsx scripts/runAcceptanceTests.ts
```

Все 12 тестов (AT-01…AT-12) проходят. К интерфейсу не переходили — это
осознанное следование инструкции в начале документа.

## Что реализовано

- **`packages/domain/evidence/`** — Evidence Ladder E0–E5 (spec §6),
  availability state machine (spec §8), явный запрет ложного `BUY_NOW` по
  списку из спеки (metadata-only, CTA disabled/absent, blocked UI status,
  no fulfillment, unauthorized seller, unconfirmed variant).
- **`packages/domain/decision/`** — 13 статусов решения (spec §5), hard
  gates для `BUY_NOW`/`APPLY_NOW`/`PREPARE`/`CLIENT_FIRST`/`SOURCE_NOW`
  (spec §7), expensive-item override (spec §3.6, проверено AT-09: watch
  >$10k никогда не получает `BUY_NOW`, даже при идеальном score).
- **`packages/domain/economics/`** — landed cost / net proceeds / ROI по
  формулам spec §11, категорийные пороги (standard/clearance/liquid/watch).
- **`packages/domain/scoring/`** — weighted score (spec §12) +
  evidence_confidence как отдельное число, не компенсируемое hype.
- **`packages/domain/reminders/`** — idempotency key
  `user_id:event_id:stage:event_start_version` (spec §13), версионирование
  при смене времени (AT-11), защита от дублей (AT-12).
- **`packages/domain/identity/`** — product key / offer key dedup (spec §15).
- **`packages/db/schema.prisma`** — все 21 таблица из spec §15, с
  разделением `market_sales`/`market_asks`, immutable `Evidence`, `Decision`
  с `ruleVersion`.
- **`packages/adapters/SourceAdapter.ts`** — интерфейс из spec §9.
- **4 точки расширения** (только интерфейсы, без реализаций):
  `packages/notifications/` (Telegram → Web Push/email),
  `packages/storage/` (screenshot/DOM evidence blobs),
  `packages/jobs/` (Vercel Cron → BullMQ при росте нагрузки),
  `packages/classification/` (bulk triage → Claude для top-ranked сигналов).

## Зафиксированные решения на Phase 1 (UI + auth)

- **Auth: email + пароль**, без magic link и без Telegram-логина — по явному
  запросу. Схема `User.passwordHash` уже это предполагает.
- **Стиль**: сдержанный, приватный/клубный вид — не публичный SaaS-лендинг.
  Тёмная палитра, аккуратная типографика, ощущение закрытого инструмента, а
  не витрины. Детали (шрифты, конкретные цвета) фиксируются при старте
  Phase 1, когда буду проектировать конкретные экраны СЕЙЧАС/СКОРО/НА
  РАДАРЕ/МОИ ПОКУПКИ.

## Ограничение среды

Тесты выше — чистые TS-функции, прогнаны офлайн через `tsx` (в этой сессии
нет сети для `npm install`). `schema.prisma` — готовый файл миграций, реальный
`prisma migrate dev` против живой Postgres выполняется в среде с сетью (как
раньше — локально или на Vercel/Neon).

## Что дальше — Phase 1 (только после подтверждения)

Onboarding + auth, экраны СЕЙЧАС/СКОРО/НА РАДАРЕ/МОИ ПОКУПКИ, product/signal
pages, manual signal entry, calendar, Telegram-канал уведомлений (через уже
готовый `NotificationChannel` интерфейс), reminders с idempotency, mock +
3–5 официальных source-адаптеров.

---

## Phase 1 — статус: базовый каркас готов

- **Auth**: email + пароль (NextAuth Credentials provider), `bcryptjs` для
  хэширования. **Нет публичной страницы регистрации** — единственный способ
  создать аккаунт: `OWNER_EMAIL=... OWNER_PASSWORD=... npx tsx scripts/seedOwner.ts`.
  Это осознанная реализация «немного приватности и недоступности», не просто
  формулировка — приложение физически не имеет входной точки для чужого
  человека, кроме прямого доступа к базе.
- **4 экрана** (`СЕЙЧАС` / `СКОРО` / `НА РАДАРЕ` / `МОИ ПОКУПКИ`) — читают
  реальные `Decision`/`ReleaseEvent`/`Purchase` из БД через Prisma.
- **Форма нового сигнала** (`/signals/new`) — каждое поле формы напрямую
  соответствует входу конкретного hard gate из `packages/domain/decision/
  hardGates.ts`. Форма не решает сама, что показать пользователю — она
  просто собирает данные и передаёт в `decide()`, тот самый движок,
  который уже прошёл AT-01…AT-12.
- **Детальная карточка сигнала** — evidence trail, market sales/asks
  раздельно, blocked reasons (почему НЕ более высокий статус), подтверждение
  покупки создаёт `Purchase` только после явного E5-действия пользователя
  (спека §15).
- **Стиль**: тёмная сдержанная палитра (`ink`/`ember`), serif-заголовки
  (Fraunces) + Inter для текста — «закрытый клуб», не типовой SaaS.
- **Telegram-канал** реализован (`TelegramChannel.ts`) поверх интерфейса
  из Phase 0 — реальная отправка, не заглушка.

### Ограничение среды (то же, что раньше)

Нет сети для `npm install`/`prisma migrate dev` — деплой и первый `prisma db
push` делаются в среде с интернетом (как в прошлый раз — GitHub → Vercel →
Neon), см. инструкцию ниже.

### Развернуть

```bash
npm install
cp .env.example .env
# впиши DATABASE_URL (Neon), NEXTAUTH_SECRET (openssl rand -base64 32),
# NEXTAUTH_URL, TELEGRAM_BOT_TOKEN

npx prisma generate --schema=../../packages/db/schema.prisma
npx prisma db push --schema=../../packages/db/schema.prisma

OWNER_EMAIL="you@example.com" OWNER_PASSWORD="strong-password" npx tsx scripts/seedOwner.ts

npm run dev
```

### Ещё не сделано (следующая итерация Phase 1)

- Календарь как отдельный экран (сейчас `СКОРО` покрывает 7 дней, но без
  полноценной сетки календаря).
- Reminder scheduler (сама рассылка по этапам 72ч/24ч/3ч/1ч/opening) — домен-логика
  (`idempotency.ts`) готова и протестирована, но job/cron, который её
  вызывает, ещё не подключён (для этого нужен `JobScheduler` из Phase 0,
  реализация — следующий шаг).
- Привязка Telegram `chat_id` к пользователю (сейчас `TelegramChannel`
  принимает функцию `chatIdByUser`, но откуда её брать в UI — не собрано).
- Mock source-адаптеры под конкретные AT-кейсы (Best Buy, PlayStation
  Direct, SKYLRK) — домен уже их поддерживает логически, но адаптеров-файлов
  ещё нет.
