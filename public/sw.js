const STATIC_CACHE = "kendali-static-v1";
const STATIC_ASSETS = ["/offline.html", "/kendali-mark.svg", "/kendali-maskable.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || request.mode === "navigate") {
    if (request.mode === "navigate") event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }
  if (!STATIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(self.registration.showNotification(data.title || "Kendali", {
    body: data.body,
    icon: "/kendali-mark.svg",
    badge: "/kendali-mark.svg",
    tag: data.tag,
    data: { url: data.url || "/notifikasi" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/notifikasi"));
});
