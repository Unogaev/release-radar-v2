"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "ru";

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
    filter_tech: "Tech",
    filter_sneakers: "Sneakers",
    filter_cars: "Cars",

    why_heading: "Why the radar flagged this",

    label_cost: "Cost",
    label_resale: "Resale",
    label_net_profit: "Net profit",
    label_margin: "Margin",
    label_time_to_launch: "Time to launch",
    checked_recently: "checked recently",

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
    stale_desc: "The last source sweep didn't finish, prices may have changed.",
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
    nav_market: "Рынок",
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

    why_heading: "Почему радар это поднял",

    label_cost: "Закупка",
    label_resale: "Продажа",
    label_net_profit: "Чистая прибыль",
    label_margin: "Маржа",
    label_time_to_launch: "До запуска",
    checked_recently: "проверено недавно",

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
    stale_desc: "Последний обход источников не завершился, цены могли измениться.",
    stale_refresh: "Обновить",
  },
} as const;

type DictKey = keyof typeof dict["en"];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rr_lang");
      if (saved === "en" || saved === "ru") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("rr_lang", l);
    } catch {}
  };

  const t = (key: DictKey) => dict[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
