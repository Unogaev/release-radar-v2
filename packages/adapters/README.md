# Адаптеры — заметки на будущее (Phase 2/3)

Каждый источник реализует `SourceAdapter.ts`. Ниже — не код, а зафиксированные
решения по конкретным источникам, чтобы не изобретать заново в Phase 3.

## Market data (`market_sales` / `market_asks`, spec §15)

- **eBay** — официальный Finding/Browse API существует и покрывает completed
  listings. Реалистичный путь для `market_sales`.
- **StockX** — публичного API нет. Варианты: партнёрский доступ (если
  появится) или осторожный парсинг через тот же `SourceAdapter`-интерфейс,
  что и retailers — с тем же evidence trail (raw snapshot, parse version).
  Не начинать без подтверждённой легальности доступа.
- **GOAT** — используется по спеке §9 "только при наличии фактической
  сделки" — то есть как источник `market_sales`, никогда `market_asks`.

## Проблемные retailers (требуют E4, не E3 — spec §7)

Best Buy, PlayStation Direct — подтверждено кейсами AT-01/AT-02. Список
пополняется по мере появления новых false-positive кейсов.

## Категории с отдельными правилами (spec §10)

Watches, Automotive, Chrome Hearts, Local clearance — у каждой свои
обязательные evidence-поля (раздел 10 спеки). Адаптеры под эти категории
пишутся отдельно от generic retail-адаптеров, не переиспользуют один класс.
