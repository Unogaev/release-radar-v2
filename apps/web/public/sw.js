self.addEventListener("push", (event) => {
  let payload = { title: "Release Radar", body: "Появился новый сигнал.", url: "/now", tag: "release-radar" };
  try { payload = { ...payload, ...event.data.json() }; } catch (_) {}
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag,
    renotify: true,
    data: { url: payload.url || "/now" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/now", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
