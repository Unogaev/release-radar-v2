"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "ru" | "ar";
export type Market = "us" | "ae" | "ru";

export const MARKET_META = {
  us: { label: "USA", currency: "USD", locale: "en-US", timeZone: "America/New_York" },
  ae: { label: "UAE", currency: "AED", locale: "en-AE", timeZone: "Asia/Dubai" },
  ru: { label: "Russia", currency: "RUB", locale: "ru-RU", timeZone: "Europe/Moscow" },
} as const;

const dict = {
  en: {
    search_placeholder: "Search by product, SKU, brand, store...",
    scan_never: "Scan not run yet",
    scan_at: "Scan: ",
    run_scan: "Run scan",
    sign_out: "Sign out",
    add_signal: "Add signal (manual)",
    nav_command_center: "Command Center",
    nav_live_signals: "Live Signals",
    nav_upcoming: "Upcoming",
    nav_calendar: "Calendar",
    nav_news: "News",
    nav_market: "Market",
    nav_sources: "Sources",
    nav_logs: "Collection Logs",
    nav_purchases: "Purchases",
    nav_clients: "Clients",
    nav_settings: "Settings",

    nav_menu: "← Menu",
    feed_profit: "Feed profit",
    active_signals_suffix: "active signals · updates every 60s",
    rest_of_feed: "rest of feed",
    signals_suffix: "signals",

    filter_now: "Now",
    filter_soon: "Soon",
    filter_restock: "Restock",
    filter_trend: "Trending",
    filter_clearance: "Clearance",
    filter_watches: "Watches",
    nav_earn: "Earn",
    earn_title: "Earn",
    earn_subtitle: "Open buyer requests. Accept a job, complete it, upload proof — get paid.",
    earn_empty_title: "No open requests yet",
    earn_empty_text: "When a buyer posts a request, it will show up here. Real jobs only — never faked.",
    earn_view: "View details",
    earn_budget: "Budget",
    earn_location: "Location",
    earn_deadline: "Deadline",
    earn_posted: "Posted",
    req_new_title: "Find a Runner",
    req_new_subtitle: "Describe what you need. A local runner sees your request and can accept it.",
    req_f_title: "What do you need?",
    req_f_title_ph: "e.g. Nike Air Force 1 '07 White, size 10",
    req_f_brand: "Brand",
    req_f_model: "Model",
    req_f_sku: "SKU / reference",
    req_f_budget: "Max price (USD)",
    req_f_qty: "Quantity",
    req_f_region: "Region",
    req_f_region_ph: "e.g. US-FL, Miami",
    req_f_zip: "ZIP",
    req_f_deadline: "Deadline",
    req_f_notes: "Notes",
    req_f_notes_ph: "Size, color, store preferences — anything the runner should know",
    req_f_name: "Your name",
    req_f_contact: "Contact (phone / telegram / email)",
    req_f_submit: "Post request",
    req_f_sending: "Posting…",
    req_f_error: "Could not post the request. Try again.",
    req_back: "← All requests",
    req_status: "Status",
    req_created: "Created",
    req_accept_title: "Accept this job",
    req_accept_btn: "Accept job",
    req_accepting: "Accepting…",
    req_runner_name: "Your name",
    req_runner_contact: "Contact",
    req_runner_fee: "Your fee (USD)",
    req_task: "Task",
    req_proof_title: "Proof of completion",
    req_receipt_url: "Receipt / photo URL",
    req_receipt_amount: "Amount paid (USD)",    
    req_save_proof: "Save proof",
    req_saving: "Saving…",
    req_advance_sourcing: "Mark: sourcing",
    req_advance_purchased: "Mark: purchased",
    req_advance_delivered: "Mark: delivered",
    req_cancel_task: "Cancel task",
    st_open: "Open",
    st_matched: "Runner found",
    st_in_progress: "In progress",
    st_fulfilled: "Fulfilled",
    st_cancelled: "Cancelled",
    ts_offered: "Offered",
    ts_accepted: "Accepted",
    ts_sourcing: "Sourcing",
    ts_purchased: "Purchased",
    ts_delivered: "Delivered",
    ts_failed: "Failed",
    ts_cancelled: "Cancelled",     home_kicker: "Global access marketplace",     home_headline: "You don't need to be there to buy there.",     home_sub: "Release Radar spots scarce releases — sneakers, tech, luxury, collectibles — and connects you with a local runner who can get them.",     ask_placeholder: "What are you looking for?",     ask_button: "Ask Radar",     ask_hint: "Paste a link or upload a photo on the next screen — we'll identify the product.",     home_signals_kicker: "Discover",     home_signals_title: "On the radar now",     home_signals_empty: "No active signals right now. The radar keeps watching.",     home_signals_all: "View all signals",     home_how_kicker: "How it works",     home_how_1t: "Find",     home_how_1d: "Radar tracks drops, restocks and price moves across sources — before the crowd.",     home_how_2t: "Decide",     home_how_2d: "Real data only: retail, secondary prices, demand, deadlines. No invented numbers.",     home_how_3t: "Get it",     home_how_3d: "Buy it yourself — or find a local runner who is already there.",     home_earn_kicker: "Earn",     home_earn_title: "No Pro? Earn with Radar.",     home_earn_open_label: "Buyer requests open right now:",     home_earn_empty: "No open requests yet. When a buyer posts one, it appears here — and on the Earn page.",     home_earn_cta: "See jobs",     home_proof_kicker: "Proof",     home_proof_title: "Proof, not promises",     home_proof_sub: "Recently completed through runners.",     ed_tab_discover: "Discover",     ed_tab_local: "Local",     ed_tab_earn: "Earn",     ed_edition: "Morning Edition",     ed_access_kicker: "01 / Access",     ed_tagline_a: "Find.",     ed_tagline_b: "Decide.",     ed_tagline_c: "Get it.",     ed_tagline_sub: "Global product intelligence connected to people on the ground.",     ed_ask_kicker: "Ask Radar",     ed_ask_headline: "What are you looking for?",     ed_ask_placeholder: "Product, link or screenshot…",     ed_find_it: "Find it",     ed_paste: "Paste link",     ed_upload: "Upload photo",     ed_describe: "Describe it",     ed_desk: "Access Desk",     ed_desk_market: "Market",     ed_desk_market_v: "Miami / South Florida",     ed_desk_network: "Network",     ed_desk_network_building: "Building real tasks",     ed_desk_network_open: "open requests",     ed_desk_rule: "Rule",     ed_desk_rule_v: "Verified or clearly marked",     ed_create_request: "Create a request",     ed_im_here: "I'm here — Earn",     ed_moving_kicker: "Intelligence → Local action",     ed_moving_title: "What is moving now",     ed_moving_empty: "Nothing moving right now. The desk keeps watching.",     ed_open: "Open",     ed_footer_tag: "Scarcity, documented.",
    ed_masthead_market: "Miami Market",
    
    
    
    
    filter_tech: "Tech",
    filter_sneakers: "Sneakers",
    filter_cars: "Cars",

    kind_now: "Now",
    kind_soon: "Soon",
    kind_verify: "Verify",
    kind_client: "Client",

    why_heading: "Why the radar flagged this",

    label_cost: "Cost",
    label_resale: "Resale",
    label_net_profit: "Net profit",
    label_margin: "Margin",
    label_time_to_launch: "Time to launch",
    label_launch_datetime: "Launch date",
    checked_recently: "checked recently",
    countdown_started: "STARTED",
    ref_sku_ref: "REF",
    ref_sku_sku: "SKU",
    photo_not_found: "Photo not found",

    action_buy: "Buy",
    action_source_full: "Open source",
    action_source_short: "Source",
    action_calendar: "Add to calendar",
    action_publish_full: "Create post",
    action_publish_short: "Post",

    empty_category_prefix: "Category “",
    empty_category_suffix: "”",
    empty_scan_done: "Scan cycle complete",
    empty_title_filtered: "No signals in this category right now",
    empty_title_all: "Radar found no signals in the last cycle",
    empty_desc_filtered:
      "Margin and availability conditions aren't met for any listing. Signals will appear after the next source sweep.",
    empty_desc_all:
      "All found listings were filtered out by margin, availability, or source reliability.",
    empty_next_scan_prefix: " Next scan at ",
    empty_reset_button: "Back to “Now”",

    error_unavailable: "Feed unavailable",
    error_title: "Couldn't load signals",
    error_default_reason: "Sources didn't respond in time.",
    error_desc_suffix:
      " Prices and availability may have changed — verify the source manually before buying.",
    error_retry: "Retry",

    stale_data_from_prefix: "Data from ",
    stale_desc: "Prices and availability may have changed since this snapshot.",
    stale_refresh: "Refresh",
  },
  ru: {
    search_placeholder: "Поиск по товару, SKU, бренду, магазину...",
    scan_never: "Скан ещё не запускался",
    scan_at: "Скан: ",
    run_scan: "Запустить скан",
    sign_out: "Выйти",
    add_signal: "Добавить сигнал (вручную)",
    nav_command_center: "Центр управления",
    nav_live_signals: "Живые сигналы",
    nav_upcoming: "Скоро",
    nav_calendar: "Календарь",
    nav_news: "Новости",
    nav_market: "Рынок",
    nav_earn: "Заработать",
    earn_title: "Заработок",
    earn_subtitle: "Открытые запросы покупателей. Примите задание, выполните, загрузите подтверждение — получите оплату.",
    earn_empty_title: "Пока нет открытых запросов",
    earn_empty_text: "Когда покупатель оставит запрос, он появится здесь. Только реальные задания — никаких выдуманных.",
    earn_view: "Подробнее",
    earn_budget: "Бюджет",
    earn_location: "Локация",
    earn_deadline: "Дедлайн",
    earn_posted: "Опубликован",
    req_new_title: "Найти runner'а",
    req_new_subtitle: "Опишите, что нужно. Локальный runner увидит запрос и сможет его принять.",
    req_f_title: "Что нужно найти?",
    req_f_title_ph: "напр. Nike Air Force 1 '07 White, размер 44",
    req_f_brand: "Бренд",
    req_f_model: "Модель",
    req_f_sku: "Артикул / SKU",
    req_f_budget: "Макс. цена (USD)",
    req_f_qty: "Количество",
    req_f_region: "Регион",
    req_f_region_ph: "напр. US-FL, Майами",
    req_f_zip: "Индекс",
    req_f_deadline: "Дедлайн",
    req_f_notes: "Заметки",
    req_f_notes_ph: "Размер, цвет, предпочтения по магазинам — всё, что должен знать runner",
    req_f_name: "Ваше имя",
    req_f_contact: "Контакт (телефон / telegram / email)",
    req_f_submit: "Опубликовать запрос",
    req_f_sending: "Публикация…",
    req_f_error: "Не удалось опубликовать. Попробуйте ещё раз.",
    req_back: "← Все запросы",
    req_status: "Статус",
    req_created: "Создан",
    req_accept_title: "Принять задание",
    req_accept_btn: "Принять",
    req_accepting: "Принимаю…",
    req_runner_name: "Ваше имя",
    req_runner_contact: "Контакт",
    req_runner_fee: "Ваша комиссия (USD)",
    req_task: "Задание",
    req_proof_title: "Подтверждение выполнения",
    req_receipt_url: "URL чека / фото",
    req_receipt_amount: "Потраченная сумма (USD)",
    req_save_proof: "Сохранить",
    req_saving: "Сохранение…",
    req_advance_sourcing: "Отметить: поиск",
    req_advance_purchased: "Отметить: куплен",
    req_advance_delivered: "Отметить: доставлен",
    req_cancel_task: "Отменить задание",
    st_open: "Открыт",
    st_matched: "Runner найден",
    st_in_progress: "В работе",
    st_fulfilled: "Выполнен",
    st_cancelled: "Отменён",
    ts_offered: "Предложен",
    ts_accepted: "Принят",
    ts_sourcing: "Поиск",
    ts_purchased: "Куплен",
    ts_delivered: "Доставлен",
    ts_failed: "Провален",
    ts_cancelled: "Отменён",     home_kicker: "Глобальный маркетплейс доступа",     home_headline: "Не обязательно быть там, чтобы купить там.",     home_sub: "Release Radar находит редкие релизы — кроссовки, технику, люкс, коллекционку — и соединяет вас с локальным runner'ом, который их достанет.",     ask_placeholder: "Что вы ищете?",     ask_button: "Спросить Radar",     ask_hint: "На следующем экране можно вставить ссылку или загрузить фото — мы опознаем товар.",     home_signals_kicker: "Discover",     home_signals_title: "Сейчас на радаре",     home_signals_empty: "Сейчас нет активных сигналов. Радар продолжает следить.",     home_signals_all: "Все сигналы",     home_how_kicker: "Как это работает",     home_how_1t: "Найди",     home_how_1d: "Радар отслеживает дропы, рестоки и цены по источникам — раньше толпы.",     home_how_2t: "Реши",     home_how_2d: "Только реальные данные: ритейл, вторичка, спрос, дедлайны. Без выдуманных цифр.",     home_how_3t: "Получи",     home_how_3d: "Купи сам — или найди локального runner'а, который уже там.",     home_earn_kicker: "Заработок",     home_earn_title: "Нет Pro? Зарабатывай с Radar.",     home_earn_open_label: "Сейчас открыто запросов покупателей:",     home_earn_empty: "Пока нет открытых запросов. Когда покупатель оставит запрос, он появится здесь — и на странице «Заработать».",     home_earn_cta: "Смотреть задания",     home_proof_kicker: "Доказательства",     home_proof_title: "Доказательства, а не обещания",     home_proof_sub: "Недавно выполнено через runner'ов.",     ed_tab_discover: "Discover",     ed_tab_local: "Local",     ed_tab_earn: "Заработать",     ed_edition: "Утренний выпуск",     ed_access_kicker: "01 / Access",     ed_tagline_a: "Найди.",     ed_tagline_b: "Реши.",     ed_tagline_c: "Получи.",     ed_tagline_sub: "Глобальная продуктовая аналитика, связанная с людьми на местах.",     ed_ask_kicker: "Спроси Radar",     ed_ask_headline: "Что вы ищете?",     ed_ask_placeholder: "Товар, ссылка или скриншот…",     ed_find_it: "Найти",     ed_paste: "Вставить ссылку",     ed_upload: "Загрузить фото",     ed_describe: "Описать",     ed_desk: "Access Desk",     ed_desk_market: "Рынок",     ed_desk_market_v: "Майами / Южная Флорида",     ed_desk_network: "Сеть",     ed_desk_network_building: "Строим реальные задачи",     ed_desk_network_open: "открытых запросов",     ed_desk_rule: "Правило",     ed_desk_rule_v: "Проверено или чётко помечено",     ed_create_request: "Создать запрос",     ed_im_here: "Я здесь — Заработать",     ed_moving_kicker: "Intelligence → Local action",     ed_moving_title: "Что движется сейчас",     ed_moving_empty: "Сейчас ничего не движется. Desk продолжает следить.",     ed_open: "Открыть",     ed_footer_tag: "Дефицит — задокументирован.",
    ed_masthead_market: "Майами Маркет",
    nav_sources: "Источники",
    nav_logs: "Логи сбора",
    nav_purchases: "Покупки",
    nav_clients: "Клиенты",
    nav_settings: "Настройки",

    nav_menu: "← Меню",
    feed_profit: "Прибыль в ленте",
    active_signals_suffix: "активных сигнала · апдейт каждые 60 с",
    rest_of_feed: "остальная лента",
    signals_suffix: "сигнала",

    filter_now: "Сейчас",
    filter_soon: "Скоро",
    filter_restock: "Рестоки",
    filter_trend: "Тренды",
    filter_clearance: "Clearance",
    filter_watches: "Watches",
    filter_tech: "Tech",
    filter_sneakers: "Sneakers",
    filter_cars: "Cars",

    kind_now: "Сейчас",
    kind_soon: "Скоро",
    kind_verify: "Проверка",
    kind_client: "Клиент",

    why_heading: "Почему радар это поднял",

    label_cost: "Закупка",
    label_resale: "Продажа",
    label_net_profit: "Чистая прибыль",
    label_margin: "Маржа",
    label_time_to_launch: "До запуска",
    label_launch_datetime: "Дата запуска",
    checked_recently: "проверено недавно",
    countdown_started: "СТАРТОВАЛО",
    ref_sku_ref: "REF",
    ref_sku_sku: "SKU",
    photo_not_found: "Фото не найдено",

    action_buy: "Купить",
    action_source_full: "Открыть источник",
    action_source_short: "Источник",
    action_calendar: "В календарь",
    action_publish_full: "Создать публикацию",
    action_publish_short: "Публикация",

    empty_category_prefix: "Категория «",
    empty_category_suffix: "»",
    empty_scan_done: "Цикл сканирования завершён",
    empty_title_filtered: "В этой категории сейчас нет сигналов",
    empty_title_all: "Радар не нашёл сигналов за последний цикл",
    empty_desc_filtered:
      "Условия по марже и наличию не выполнены ни по одной позиции. Сигналы появятся после следующего обхода источников.",
    empty_desc_all:
      "Все найденные позиции отсеяны по марже, наличию или достоверности источника.",
    empty_next_scan_prefix: " Следующее сканирование в ",
    empty_reset_button: "Вернуться к «Сейчас»",

    error_unavailable: "Лента недоступна",
    error_title: "Не удалось получить сигналы",
    error_default_reason: "Источники не ответили в отведённое время.",
    error_desc_suffix:
      " Данные о ценах и наличии могли измениться — перед покупкой проверьте источник вручную.",
    error_retry: "Повторить",

    stale_data_from_prefix: "Данные от ",
    stale_desc: "Цены и наличие могли измениться с момента снимка.",
    stale_refresh: "Обновить",
  },
  ar: {
    search_placeholder: "ابحث عن منتج أو SKU أو علامة أو متجر...",
    scan_never: "لم يبدأ الفحص بعد", scan_at: "الفحص: ", run_scan: "تشغيل الفحص", sign_out: "تسجيل الخروج", add_signal: "إضافة إشارة يدوياً",
    nav_command_center: "مركز التحكم", nav_live_signals: "الإشارات المباشرة", nav_upcoming: "القادم", nav_calendar: "التقويم", nav_news: "الأخبار", nav_market: "السوق", nav_sources: "المصادر", nav_logs: "سجل الجمع", nav_purchases: "المشتريات", nav_clients: "العملاء", nav_settings: "الإعدادات",
    nav_menu: "القائمة ←", feed_profit: "ربح الخلاصة", active_signals_suffix: "إشارات نشطة · تحديث كل 60 ثانية", rest_of_feed: "بقية الخلاصة", signals_suffix: "إشارات",
    filter_now: "الآن", filter_soon: "قريباً", filter_restock: "إعادة التوفر", filter_trend: "الرائج", filter_clearance: "التخفيضات", filter_watches: "الساعات", filter_tech: "التقنية", filter_sneakers: "الأحذية", filter_cars: "السيارات", nav_earn: "اربح", earn_title: "الربح", earn_subtitle: "طلبات المشترين المفتوحة. اقبل مهمة، أنجزها، ارفع إثباتاً — واحصل على أجرك.", earn_empty_title: "لا توجد طلبات مفتوحة بعد", earn_empty_text: "عندما ينشر مشترٍ طلباً سيظهر هنا. مهام حقيقية فقط — لا شيء مفتعل.", earn_view: "عرض التفاصيل", earn_budget: "الميزانية", earn_location: "الموقع", earn_deadline: "الموعد النهائي", earn_posted: "نُشر", req_new_title: "اعثر على رانر", req_new_subtitle: "صِف ما تحتاجه. سيرى الرانر المحلي طلبك ويمكنه قبوله.", req_f_title: "ما الذي تحتاجه؟", req_f_title_ph: "مثال: Nike Air Force 1 '07 أبيض، مقاس 44", req_f_brand: "العلامة", req_f_model: "الموديل", req_f_sku: "SKU / الرقم المرجعي", req_f_budget: "السعر الأقصى (دولار)", req_f_qty: "الكمية", req_f_region: "المنطقة", req_f_region_ph: "مثال: US-FL، ميامي", req_f_zip: "الرمز البريدي", req_f_deadline: "الموعد النهائي", req_f_notes: "ملاحظات", req_f_notes_ph: "المقاس، اللون، تفضيلات المتاجر — كل ما يجب أن يعرفه الرانر", req_f_name: "اسمك", req_f_contact: "جهة الاتصال (هاتف / تيليغرام / بريد)", req_f_submit: "نشر الطلب", req_f_sending: "جارٍ النشر…", req_f_error: "تعذّر نشر الطلب. حاول مجدداً.", req_back: "← كل الطلبات", req_status: "الحالة", req_created: "أُنشئ", req_accept_title: "اقبل هذه المهمة", req_accept_btn: "اقبل المهمة", req_accepting: "جارٍ القبول…", req_runner_name: "اسمك", req_runner_contact: "جهة الاتصال", req_runner_fee: "أجرك (دولار)", req_task: "المهمة", req_proof_title: "إثبات الإنجاز", req_receipt_url: "رابط الإيصال / الصورة", req_receipt_amount: "المبلغ المدفوع (دولار)", req_save_proof: "حفظ", req_saving: "جارٍ الحفظ…", req_advance_sourcing: "تعليم: جارٍ البحث", req_advance_purchased: "تعليم: تم الشراء", req_advance_delivered: "تعليم: تم التسليم", req_cancel_task: "إلغاء المهمة", st_open: "مفتوح", st_matched: "تم إيجاد رانر", st_in_progress: "قيد التنفيذ", st_fulfilled: "مُنجز", st_cancelled: "ملغى", ts_offered: "معروض", ts_accepted: "مقبول", ts_sourcing: "جارٍ البحث", ts_purchased: "تم الشراء", ts_delivered: "تم التسليم", ts_failed: "فشل", ts_cancelled: "ملغى",     home_kicker: "سوق عالمي للوصول",     home_headline: "لا حاجة أن تكون هناك لتشتري من هناك.",     home_sub: "رادار الإصدارات يرصد الإصدارات النادرة — أحذية، تقنية، فاخرة، مقتنيات — ويصلك برانر محلي يمكنه الحصول عليها.",     ask_placeholder: "ما الذي تبحث عنه؟",     ask_button: "اسأل الرادار",     ask_hint: "في الشاشة التالية يمكنك لصق رابط أو رفع صورة — سنتعرف على المنتج.",     home_signals_kicker: "اكتشف",     home_signals_title: "على الرادار الآن",     home_signals_empty: "لا توجد إشارات نشطة الآن. الرادار يواصل المراقبة.",     home_signals_all: "كل الإشارات",     home_how_kicker: "كيف يعمل",     home_how_1t: "اعثر",     home_how_1d: "يرصد الرادار الإصدارات وعودة التوفر وتحركات الأسعار عبر المصادر — قبل الجميع.",     home_how_2t: "قرر",     home_how_2d: "بيانات حقيقية فقط: التجزئة، السوق الثانوية، الطلب، المواعيد. بلا أرقام مفتعلة.",     home_how_3t: "احصل عليه",     home_how_3d: "اشترِ بنفسك — أو اعثر على رانر محلي موجود هناك.",     home_earn_kicker: "الربح",     home_earn_title: "لا Pro؟ اربح مع الرادار.",     home_earn_open_label: "طلبات المشترين المفتوحة الآن:",     home_earn_empty: "لا توجد طلبات مفتوحة بعد. عندما ينشر مشترٍ طلباً سيظهر هنا — وفي صفحة الربح.",     home_earn_cta: "عرض المهام",     home_proof_kicker: "إثبات",     home_proof_title: "إثبات لا وعود",     home_proof_sub: "أُنجز مؤخراً عبر الرانرز.",     ed_tab_discover: "اكتشف",     ed_tab_local: "محلي",     ed_tab_earn: "اربح",     ed_edition: "النشرة الصباحية",     ed_access_kicker: "01 / Access",     ed_tagline_a: "اعثر.",     ed_tagline_b: "قرر.",     ed_tagline_c: "احصل عليه.",     ed_tagline_sub: "ذكاء عالمي للمنتجات مرتبط بأشخاص على الأرض.",     ed_ask_kicker: "اسأل الرادار",     ed_ask_headline: "ما الذي تبحث عنه؟",     ed_ask_placeholder: "منتج أو رابط أو لقطة…",     ed_find_it: "اعثر عليه",     ed_paste: "لصق رابط",     ed_upload: "رفع صورة",     ed_describe: "صِفه",     ed_desk: "مكتب الوصول",     ed_desk_market: "السوق",     ed_desk_market_v: "ميامي / جنوب فلوريدا",     ed_desk_network: "الشبكة",     ed_desk_network_building: "نبني مهام حقيقية",     ed_desk_network_open: "طلبات مفتوحة",     ed_desk_rule: "القاعدة",     ed_desk_rule_v: "موثّق أو موسوم بوضوح",     ed_create_request: "إنشاء طلب",     ed_im_here: "أنا هنا — اربح",     ed_moving_kicker: "Intelligence → Local action",     ed_moving_title: "ما الذي يتحرك الآن",     ed_moving_empty: "لا شيء يتحرك الآن. المكتب يواصل المراقبة.",     ed_open: "فتح",     ed_footer_tag: "الندرة موثقة.",
    ed_masthead_market: "سوق ميامي",
    kind_now: "الآن", kind_soon: "قريباً", kind_verify: "تحقق", kind_client: "عميل", why_heading: "لماذا اختار الرادار هذا المنتج",
    label_cost: "التكلفة", label_resale: "إعادة البيع", label_net_profit: "صافي الربح", label_margin: "الهامش", label_time_to_launch: "حتى الإطلاق", label_launch_datetime: "موعد الإطلاق", checked_recently: "تم التحقق مؤخراً", countdown_started: "بدأ", ref_sku_ref: "REF", ref_sku_sku: "SKU", photo_not_found: "الصورة غير متوفرة",
    action_buy: "شراء", action_source_full: "فتح المصدر", action_source_short: "المصدر", action_calendar: "إضافة للتقويم", action_publish_full: "إنشاء منشور", action_publish_short: "نشر",
    empty_category_prefix: "الفئة «", empty_category_suffix: "»", empty_scan_done: "اكتملت دورة الفحص", empty_title_filtered: "لا توجد إشارات في هذه الفئة الآن", empty_title_all: "لم يجد الرادار إشارات في الدورة الأخيرة", empty_desc_filtered: "لا توجد قائمة تحقق شروط الهامش والتوفر حالياً. ستظهر الإشارات بعد جولة المصادر التالية.", empty_desc_all: "تم استبعاد النتائج بسبب الهامش أو التوفر أو موثوقية المصدر.", empty_next_scan_prefix: " الفحص التالي في ", empty_reset_button: "العودة إلى «الآن»",
    error_unavailable: "الخلاصة غير متاحة", error_title: "تعذر تحميل الإشارات", error_default_reason: "لم تستجب المصادر في الوقت المحدد.", error_desc_suffix: " ربما تغير السعر أو التوفر — تحقق من المصدر قبل الشراء.", error_retry: "إعادة المحاولة",
    stale_data_from_prefix: "البيانات من ", stale_desc: "قد تكون الأسعار والتوفر تغيرت منذ هذه اللقطة.", stale_refresh: "تحديث",
  },
} as const;

export type DictKey = keyof typeof dict["en"];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  market: Market;
  setMarket: (market: Market) => void;
  marketMeta: (typeof MARKET_META)[Market];
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [market, setMarketState] = useState<Market>("us");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rr_lang");
      if (saved === "en" || saved === "ru" || saved === "ar") setLangState(saved);
      const savedMarket = window.localStorage.getItem("rr_market");
      if (savedMarket === "us" || savedMarket === "ae" || savedMarket === "ru") setMarketState(savedMarket);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("rr_lang", l);
    } catch {}
  };

  const setMarket = (value: Market) => {
    setMarketState(value);
    try { window.localStorage.setItem("rr_market", value); } catch {}
  };

  const t = (key: DictKey) => dict[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, market, setMarket, marketMeta: MARKET_META[market], t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
