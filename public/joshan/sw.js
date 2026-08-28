const CACHE='joshan-v11';
const FILES=['./','./index.html','./styles.css','./date.css','./fonts.css','./theme.css','./translation.css','./app-icon.png','./dua-data.js','./app.js','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
