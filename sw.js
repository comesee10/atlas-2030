/* Профессии·2030 — офлайн-оболочка.
   Стратегия: навигация — сеть, затем кеш index.html, затем offline.html;
   статика — stale-while-revalidate. Все данные атласа хранятся локально. */
const VERSION = 'atlas-2030-v39';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './data-core.js',
  './data-universities-1.js',
  './data-universities-2.js',
  './data-universities-3.js',
  './catalog-expansion.js',
  './app.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/onest-cyrillic.woff2',
  './fonts/onest-latin.woff2',
  './fonts/lora-cyrillic.woff2',
  './fonts/lora-latin.woff2',
  './offline.html',
  './photos/sphere-d01-800.webp',
  './photos/sphere-d02-800.webp',
  './photos/sphere-d03-800.webp',
  './photos/sphere-d04-800.webp',
  './photos/sphere-d05-800.webp',
  './photos/sphere-d06-800.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      /* Если какого-то файла нет (обрыв, отсутствующий ресурс), добавляем
         по одному: отсутствующие пропускаем, чтобы установка не срывалась. */
      .catch(() => caches.open(VERSION).then((cache) =>
        Promise.all(SHELL.map((u) =>
          fetch(new Request(u, { cache: 'reload' }))
            .then((res) => (res && res.ok) ? cache.put(u, res) : null)
            .catch(() => null)
        ))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            /* квота кэша может быть исчерпана — не даём promise отклониться */
            caches.open(VERSION).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true })
          .then((hit) => hit || caches.match('./offline.html', { ignoreSearch: true })))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit || caches.match(req, { ignoreSearch: true }));
      return hit || network;
    })
  );
});
