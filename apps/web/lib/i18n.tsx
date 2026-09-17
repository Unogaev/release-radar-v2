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
