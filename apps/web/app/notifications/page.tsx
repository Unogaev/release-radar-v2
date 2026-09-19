"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AlertItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  sentAt: string | null;
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const deliveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
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
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const sendTest = async () => {
    setLoading(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTestMessage(data.error ?? "Failed to send test notification.");
      } else {
        setTestMessage("Test notification created. It will appear below and fire in your browser if permission is granted.");
        const items = await fetchAlerts();
        if (items) deliverNew(items);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Notifications</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
        Browser notifications (Notification API). These fire while this page/app is open or
        backgrounded on desktop. Full push delivery to a closed browser is not implemented yet.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {permission === "unsupported" && (
          <span style={{ fontSize: 14, color: "#999" }}>Notifications are not supported in this browser.</span>
        )}
        {permission !== "unsupported" && permission !== "granted" && (
          <button onClick={requestPermission} style={btnStyle}>
            {permission === "denied" ? "Notifications blocked (check browser settings)" : "Enable notifications"}
          </button>
        )}
        {permission === "granted" && (
          <span style={{ fontSize: 14, color: "#16a34a", alignSelf: "center" }}>Notifications enabled</span>
        )}
        <button onClick={sendTest} disabled={loading} style={btnStyle}>
          {loading ? "Sending..." : "Send test notification"}
        </button>
      </div>

      {testMessage && (
        <div style={{ fontSize: 13, color: "#444", marginBottom: 16, padding: 10, background: "#f5f5f5", borderRadius: 8 }}>
          {testMessage}
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>History</h2>
      {alerts.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>No notifications yet.</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((a) => (
          <li key={a.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
            <div style={{ fontSize: 13, color: "#555", whiteSpace: "pre-line", marginTop: 4 }}>{a.body}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              {a.sentAt ? "Delivered" : "Pending delivery"} · channel: {a.channel}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};
