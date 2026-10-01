const CACHE = 'internet-ojt-v3';
const SHELL = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/api') || u.pathname.startsWith('/uploads')) return;
  e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
});
