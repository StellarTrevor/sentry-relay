// Sentry Relay service worker: keeps the app itself available offline. Project data is cached by the app
// (IndexedDB), never here, and GitHub requests always go to the network.
const SHELL = "sentry-drone-shell-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Network first for the page (so a new version loads), cache first for hashed assets.
  if (e.request.mode === "navigate") { e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(SHELL).then((c) => c.put("./index.html", copy)); return r; }).catch(() => caches.match("./index.html"))); return; }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy)); } return r; })));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow("./")))); });
