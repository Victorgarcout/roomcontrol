// somnOO Quality Service Worker — Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: "/badge-72.png",
      tag: data.tag || "somnoo-quality",
      data: { url: data.url || "/quality/hub" },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open", title: "Ouvrir" },
        { action: "dismiss", title: "Ignorer" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "somnOO Quality", options)
    );
  } catch (err) {
    console.error("[SW] Push parse error:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/quality/hub";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
