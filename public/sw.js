// Service Worker for ASIK Mobile PWA
// - Full Offline Navigation Fallback Shell (/offline.html)
// - Web Push Notifications & Attendance Reminders
// - Background Sync for offline attendance queue

const CACHE_NAME = "hris-pwa-v8";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/favicon.PNG",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-512x512.png",
  "/apple-touch-icon.png",
  "/putih.png",
  "/manifest.json",
  "/m/dashboard",
  "/m/fingerprint"
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

// Fetch handler with full offline navigation fallback & asset caching
self.addEventListener("fetch", (event) => {
  // 1. Navigation requests (HTML pages): Network-first, cache fallback, then /offline.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          
          // Cek jika halaman spesifik ini (/m/fingerprint, dsb) tersimpan di cache
          const matched = await cache.match(event.request);
          if (matched) {
            return matched;
          }

          // Fallback ke shell offline interaktif mandiri
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

  // 1.5. Offline Auth Session & Profile Cache (Network-first with fallback to cached session)
  if (url.pathname === "/api/auth/session" || url.pathname === "/api/pegawai/me") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(event.request);
          if (cached) {
            return cached;
          }
          return new Response(JSON.stringify({}), {
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // 2. Next.js Static JS/CSS Chunks & Fonts Caching (Stale-While-Revalidate)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // 3. Static offline shell assets cache
  if (
    url.pathname === "/offline.html" ||
    url.pathname === "/favicon.PNG" ||
    url.pathname === "/icon-192x192.png" ||
    url.pathname === "/icon-512x512.png" ||
    url.pathname === "/icon-maskable-512x512.png" ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/putih.png" ||
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

  let targetUrl = event.notification.data?.url || "/m/notifikasi";
  if (!targetUrl.startsWith("/m/")) {
    if (targetUrl === "/cuti") targetUrl = "/m/cuti";
    else if (targetUrl === "/absensi") targetUrl = "/m/absensi";
    else if (targetUrl === "/lembur") targetUrl = "/m/lembur";
    else targetUrl = "/m/notifikasi";
  }

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
