const CACHE = 'joshan-pwa-v2';
const FILES = ['/', '/manifest.webmanifest', '/app-icon.png', '/joshan/index.html', '/joshan/styles.css', '/joshan/date.css', '/joshan/fonts.css', '/joshan/theme.css', '/joshan/translation.css', '/joshan/app-icon.png', '/joshan/dua-data.js', '/joshan/app.js'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
