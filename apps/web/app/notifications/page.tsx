"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface AlertItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  sentAt: string | null;
}

function vapidKeyToBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [pushActive, setPushActive] = useState(false);
  const [pushConfigured, setPushConfigured] = useState<boolean | null>(null);
  const deliveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    fetch("/api/push/public-key", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setPushConfigured(Boolean(data.configured)))
      .catch(() => setPushConfigured(false));
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration("/")
        .then((registration) => registration?.pushManager.getSubscription())
        .then((subscription) => setPushActive(Boolean(subscription)))
        .catch(() => setPushActive(false));
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    setAlerts(data.alerts ?? []);
    return data.alerts as AlertItem[] | undefined;
  }, []);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  }, []);

  const deliverNew = useCallback(
    (items: AlertItem[]) => {
      if (permission !== "granted") return;
      for (const item of items) {
        if (item.sentAt) continue;
        if (deliveredRef.current.has(item.id)) continue;
        deliveredRef.current.add(item.id);
        try {
          new Notification(item.title, { body: item.body });
        } catch {
          // Notification constructor can throw in some contexts (e.g. no permission); ignore.
        }
        markRead(item.id);
      }
    },
    [permission, markRead]
  );

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const items = await fetchAlerts();
      if (active && items) deliverNew(items);
    };
    tick();
    const interval = setInterval(tick, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchAlerts, deliverNew]);

  const requestPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setTestMessage("Этот браузер не поддерживает Web Push.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;
    setLoading(true);
    setTestMessage(null);
    try {
      const keyResponse = await fetch("/api/push/public-key", { cache: "no-store" });
      const keyData = await keyResponse.json();
      if (!keyData.configured || !keyData.publicKey) {
        setPushConfigured(false);
        setTestMessage("Серверный ключ Push ещё не настроен. Интерфейс готов, но доставка при закрытом сайте пока не активируется.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToBuffer(keyData.publicKey),
      });
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!save.ok) throw new Error("subscription_save_failed");
      setPushConfigured(true);
      setPushActive(true);
      setTestMessage("Push включён. Уведомления смогут приходить даже при закрытом сайте.");
    } catch {
      setPushActive(false);
      setTestMessage("Не удалось активировать Push на этом устройстве.");
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTestMessage(data.error ?? "Не удалось отправить тестовое уведомление.");
      } else {
        setTestMessage("Тестовый Push отправлен на подписанные устройства.");
        const items = await fetchAlerts();
        if (items) deliverNew(items);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/now" className="mb-4 inline-flex text-xs font-semibold text-rr-accent">← Вернуться в центр действий</Link>
        <h1 className="font-rr-display text-2xl text-rr-text">Уведомления</h1>
        <p className="text-sm text-rr-text-dim mt-1">
          Настоящий Web Push для BUY NOW, APPLY NOW, неожиданных рестоков и контрольных напоминаний. Работает при закрытом сайте; на iPhone Release Radar нужно добавить на главный экран.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 border border-rr-hair rounded-2xl bg-rr-surface p-4">
        {permission === "unsupported" && (
          <span className="text-sm text-rr-muted">Уведомления не поддерживаются в этом браузере.</span>
        )}
        {permission !== "unsupported" && (!pushActive || permission !== "granted") && (
          <button
            onClick={requestPermission}
            disabled={loading}
            className="rounded-lg border border-rr-hair bg-rr-surface px-3.5 py-2 text-sm text-rr-text hover:bg-rr-surface-hi"
          >
            {loading ? "Подключение..." : permission === "denied" ? "Заблокировано (проверьте настройки браузера)" : "Включить Push"}
          </button>
        )}
        {permission === "granted" && pushActive && (
          <span className="text-sm text-rr-ok self-center">Push активен на этом устройстве</span>
        )}
        <button
          onClick={sendTest}
          disabled={loading || !pushActive || pushConfigured === false}
          className="rounded-lg border border-rr-hair bg-rr-surface px-3.5 py-2 text-sm text-rr-text hover:bg-rr-surface-hi disabled:opacity-50"
        >
          {loading ? "Отправка..." : "Отправить тестовое уведомление"}
        </button>
      </div>

      {testMessage && (
        <div className="rounded-xl bg-rr-well px-4 py-3 text-sm text-rr-text-dim">{testMessage}</div>
      )}

      <div>
        <h2 className="text-base font-medium text-rr-text mb-3">История</h2>
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-rr-hair bg-rr-surface px-6 py-10 text-center">
            <div className="font-rr-display text-[15px] text-rr-text">Пока нет уведомлений</div>
            <div className="mt-1 text-[12.5px] text-rr-text-dim">
              Здесь появится история, как только сработает первый сигнал.
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 list-none p-0">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-2xl border border-rr-hair bg-rr-surface p-4">
                <div className="text-sm font-medium text-rr-text">{a.title}</div>
                <div className="text-sm text-rr-text-dim mt-1 whitespace-pre-line">{a.body}</div>
                <div className="text-xs text-rr-muted mt-2">
                  {a.sentAt ? "Доставлено" : "Ожидает доставки"} · канал: {a.channel}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
