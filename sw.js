/* Профессии·2030 — офлайн-оболочка.
   Стратегия: навигация — сеть, затем кеш index.html, затем offline.html;
   статика — stale-while-revalidate. Все данные атласа хранятся локально. */
const VERSION = 'atlas-2030-v61';
const SHELL = [
  './',
  './index.html',
  './professions/',
  './simulator/',
  './universities/',
  './specialties/',
  './colleges/',
  './regions/',
  './admission/',
  './calendar/',
  './teacher/',
  './about/',
  './methodology/',
  './styles.css',
  './data-core.js',
  './data-framework.js',
  './data-universities-1.js',
  './data-universities-2.js',
  './data-universities-3.js',
  './catalog-expansion.js',
  './app.js',
  './theme-boot.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/onest-cyrillic.woff2',
  './fonts/onest-latin.woff2',
  './offline.html',
  './photos/sphere-d01-800.webp',
  './photos/sphere-d02-800.webp',
  './photos/sphere-d03-800.webp',
  './photos/sphere-d04-800.webp',
  './photos/sphere-d05-800.webp',
  './photos/sphere-d06-800.webp',
  './photos/sphere-d01-alt-800.webp',
  './photos/sphere-d02-alt-800.webp',
  './photos/sphere-d03-alt-800.webp',
  './photos/sphere-d04-alt-800.webp',
  './photos/sphere-d05-alt-800.webp',
  './photos/sphere-d06-alt-800.webp',
  './photos/sphere-d01-2-800.webp',
  './photos/sphere-d01-3-800.webp',
  './photos/sphere-d01-4-800.webp',
  './photos/sphere-d02-2-800.webp',
  './photos/sphere-d02-3-800.webp',
  './photos/sphere-d02-4-800.webp',
  './photos/sphere-d03-2-800.webp',
  './photos/sphere-d03-3-800.webp',
  './photos/sphere-d03-4-800.webp',
  './photos/sphere-d04-2-800.webp',
  './photos/sphere-d04-3-800.webp',
  './photos/sphere-d04-4-800.webp',
  './photos/sphere-d05-2-800.webp',
  './photos/sphere-d05-3-800.webp',
  './photos/sphere-d05-4-800.webp',
  './photos/sphere-d06-2-800.webp',
  './photos/sphere-d06-3-800.webp',
  './photos/sphere-d06-4-800.webp',
  './photos/life-library-800.webp',
  './photos/life-reading-800.webp',
  './photos/life-class-800.webp',
  './photos/life-theatre-800.webp',
  './photos/life-campus-800.webp',
  './photos/life-lab-800.webp',
  './photos/life-lawn-800.webp',
  './photos/life-walk-800.webp',
  './photos/uni-mgu-800.webp',
  './photos/uni-spbgu-800.webp',
  './photos/uni-itmo-800.webp',
  './photos/uni-hse-800.webp',
  './photos/uni-bauman-800.webp',
  './photos/uni-mipt-800.webp',
  './photos/uni-urfu-800.webp',
  './photos/uni-nsu-800.webp',
  './photos/uni-dsfu-800.webp',
  './photos/uni-kfu-800.webp',
  './photos/dist-cfo-800.webp',
  './photos/dist-nw-800.webp',
  './photos/dist-south-800.webp',
  './photos/dist-caucasus-800.webp',
  './photos/dist-volga-800.webp',
  './photos/dist-ural-800.webp',
  './photos/dist-siberia-800.webp',
  './photos/dist-feast-800.webp'
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
      /* Страница просит стили и скрипты с ?v=… — кэшируем ровно те версии,
         которые объявлены в index.html, иначе офлайн отдаст старый CSS. */
      .then(() => caches.open(VERSION))
      .then((cache) => cache.match('./index.html', { ignoreSearch: true })
        .then((res) => (res ? res.text() : ''))
        .then((html) => {
          const urls = String(html).match(/[\w.-]+\.(?:css|js)\?v=[\w.-]+/g) || [];
          return Promise.all([...new Set(urls)].map((u) =>
            cache.match(u).then((hit) => hit ? null :
              fetch(new Request('./' + u, { cache: 'reload' }))
                .then((res) => (res && res.ok) ? cache.put(u, res) : null)
                .catch(() => null))));
        })
        .catch(() => null))
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

/* Офлайн-подмена: запрос без версии матчится по пути, запрос с ?v= — только
   той же версии. Иначе после деплоя офлайн отдавал бы старый styles.css. */
function offlineFallback(req) {
  const url = new URL(req.url);
  if (!url.search) return caches.match(req, { ignoreSearch: true });
  return caches.match(req, { ignoreSearch: true }).then((hit) => {
    if (!hit) return null;
    let have = '';
    try { have = new URL(hit.url).search; } catch (e) { have = ''; }
    return have === url.search ? hit : null;
  });
}

/* Каталог проекта: всё в SHELL задано относительными путями. При отдаче
   кэшированной страницы на глубокий адрес (/professions/…) браузер иначе
   ищет стили в /professions/. Подставляем <base>. */
const SCOPE_BASE = self.location.pathname.replace(/[^/]*$/, '');
function isDeepPath(pathname) {
  const p = pathname.replace(/index\.html$/i, '').replace(/\/+$/, '') + '/';
  return p !== SCOPE_BASE;
}
async function cachedHtml(req) {
  let hit = await caches.match('./index.html', { ignoreSearch: true });
  if (!hit) hit = await caches.match('./offline.html', { ignoreSearch: true });
  if (!hit) return null;
  if (!isDeepPath(new URL(req.url).pathname)) return hit;
  const html = await hit.text();
  if (!/<head[^>]*>/i.test(html) || /<base/i.test(html)) return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const patched = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + SCOPE_BASE + '">');
  return new Response(patched, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    const fromCache = () => cachedHtml(req);
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            /* квота кэша может быть исчерпана — не даём promise отклониться */
            caches.open(VERSION).then((cache) => cache.put('./index.html', copy)).catch(() => {});
            return res;
          }
          /* 5xx/404 от CDN или прокси: лучше показать кэш, чем битую страницу. */
          return fromCache().then((hit) => hit || res);
        })
        .catch(fromCache)
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
      }).catch(() => hit || offlineFallback(req));
      return hit || network;
    })
  );
});
