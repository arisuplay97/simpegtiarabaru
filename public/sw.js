// Service Worker for ASIK Mobile PWA
// - Caching face-api models for offline detection
// - Web Push Notifications & Attendance Reminders
// - Background Sync for offline attendance queue

const CACHE_NAME = "hris-face-models-v2";

const MODELS_TO_CACHE = [
  "/models/tiny_face_detector_model-weights_manifest.json",
  "/models/tiny_face_detector_model-shard1",
  "/models/face_landmark_68_model-weights_manifest.json",
  "/models/face_landmark_68_model-shard1",
  "/models/face_recognition_model-weights_manifest.json",
  "/models/face_recognition_model-shard1",
  "/models/face_recognition_model-shard2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        MODELS_TO_CACHE.map(url => cache.add(url))
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

// Fetch handler for cached AI models
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
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
    icon: "/logo-tar.png",
    badge: "/logo-tar.png",
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
