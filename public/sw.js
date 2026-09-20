// Service Worker for ASIK Mobile PWA
// - Full Offline Navigation Fallback Shell (/offline.html)
// - Web Push Notifications & Attendance Reminders
// - Background Sync for offline attendance queue

const CACHE_NAME = "hris-pwa-v3";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/putih.png",
  "/slip.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch handler with full offline navigation fallback
self.addEventListener("fetch", (event) => {
  // 1. Navigation requests: Network-first, fallback to /offline.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match("/offline.html");
        if (cachedOffline) {
          return cachedOffline;
        }
        return new Response("Mode Offline ASIK Mobile - Koneksi terputus.", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
    );
    return;
  }

  const url = new URL(event.request.url);

  // 2. Static offline shell assets cache
  if (
    url.pathname === "/offline.html" ||
    url.pathname === "/putih.png" ||
    url.pathname === "/slip.png" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Cached AI models if accessed
  if (url.pathname.startsWith("/models/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        });
      })
    );
    return;
  }
});

// ================================================================
// WEB PUSH NOTIFICATION & PENGINGAT ABSENSI
// ================================================================
self.addEventListener("push", (event) => {
  let data = {
    title: "Pengingat Presensi ASIK",
    body: "Waktunya melakukan presensi hari ini!",
    url: "/m/fingerprint",
    tag: "presensi-reminder"
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/slip.png",
    badge: "/slip.png",
    tag: data.tag || "asik-notification",
    renotify: true,
    vibrate: [120, 80, 120],
    data: {
      url: data.url || "/m/fingerprint"
    },
    actions: [
      { action: "open_absen", title: "Presensi Sekarang" },
      { action: "close", title: "Tutup" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/m/fingerprint";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes("/m/") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ================================================================
// BACKGROUND SYNC (OFFLINE QUEUE FLUSH)
// ================================================================
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-absensi") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_OFFLINE_SYNC" });
        });
      })
    );
  }
});
