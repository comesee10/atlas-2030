/* Pathway — офлайн-оболочка.
   Стратегия: навигация — сеть, затем кеш index.html, затем offline.html;
   статика — stale-while-revalidate. Все данные атласа хранятся локально. */
const VERSION = 'atlas-2030-v91';
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
  './data-monitoring.js',
  './data-organizations-1.js',
  './data-organizations-2.js',
  './data-merges.js',
  './data-universities-1.js',
  './data-universities-2.js',
  './data-universities-3.js',
  './catalog-expansion.js',
  './app.js',
  './pet/dist/pet.css',
  './pet/dist/pet.js',
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
  './photos/prof-cybersecurity-800.webp',
  './photos/prof-clinician-800.webp',
  './photos/prof-microelectronics-800.webp',
  './photos/prof-power-engineer-800.webp',
  './photos/prof-fullstack-developer-800.webp',
  './photos/prof-construction-engineer-800.webp',
  './photos/prof-data-analyst-800.webp',
  './photos/prof-mining-engineer-800.webp',
  './photos/prof-quantum-800.webp',
  './photos/prof-materials-800.webp',
  './photos/prof-space-systems-800.webp',
  './photos/prof-biomedical-engineer-800.webp',
  './photos/prof-nuclear-engineer-800.webp',
  './photos/prof-climate-specialist-800.webp',
  './photos/prof-psychologist-800.webp',
  './photos/prof-veterinarian-800.webp',
  './photos/prof-agrotech-800.webp',
  './photos/prof-tourism-manager-800.webp',
  './photos/prof-digital-marketer-800.webp',
  './photos/prof-mechanical-engineer-800.webp',
  './photos/prof-bim-engineer-800.webp',
  './photos/spec-21-3-800.webp',
  './photos/spec-10-3-800.webp',
  './photos/spec-44-2-800.webp',
  './photos/spec-35-2-800.webp',
  './photos/spec-01-2-800.webp',
  './photos/spec-09-2-800.webp',
  './photos/uni-yursu-800.webp',
  './photos/uni-yursu-1600.webp',
  './photos/uni-timir-800.webp',
  './photos/uni-timir-1600.webp',
  './photos/uni-mai-800.webp',
  './photos/uni-mai-1600.webp',
  './photos/uni-mirea-800.webp',
  './photos/uni-mirea-1600.webp',
  './photos/uni-tyumgu-800.webp',
  './photos/uni-tyumgu-1600.webp',
  './photos/uni-volggtu-800.webp',
  './photos/uni-volggtu-1600.webp',
  './photos/uni-pengu-800.webp',
  './photos/uni-pengu-1600.webp',
  './photos/uni-yargu-800.webp',
  './photos/uni-yargu-1600.webp',
  './photos/uni-tvgu-800.webp',
  './photos/uni-tvgu-1600.webp',
  './photos/uni-spbpu-800.webp',
  './photos/uni-spbpu-1600.webp',
  './photos/uni-mephi-800.webp',
  './photos/uni-mephi-1600.webp',
  './photos/uni-rudn-800.webp',
  './photos/uni-rudn-1600.webp',
  './photos/uni-yufu-800.webp',
  './photos/uni-yufu-1600.webp',
  './photos/uni-tsu-800.webp',
  './photos/uni-tsu-1600.webp',
  './photos/uni-tpu-800.webp',
  './photos/uni-tpu-1600.webp',
  './photos/uni-tusur-800.webp',
  './photos/uni-tusur-1600.webp',
  './photos/uni-sfu-800.webp',
  './photos/uni-sfu-1600.webp',
  './photos/uni-unngu-800.webp',
  './photos/uni-unngu-1600.webp',
  './photos/uni-leti-800.webp',
  './photos/uni-leti-1600.webp',
  './photos/uni-mgsu-800.webp',
  './photos/uni-mgsu-1600.webp',
  './photos/uni-plekhanov-800.webp',
  './photos/uni-plekhanov-1600.webp',
  './photos/uni-pnipu-800.webp',
  './photos/uni-pnipu-1600.webp',
  './photos/spec-54-1-800.webp',
  './photos/spec-45-1-800.webp',
  './photos/spec-41-1-800.webp',
  './photos/spec-39-1-800.webp',
  './photos/spec-37-1-800.webp',
  './photos/spec-51-1-800.webp',
  './photos/spec-47-1-800.webp',
  './photos/spec-46-2-800.webp',
  './photos/spec-46-1-800.webp',
  './photos/spec-44-1-800.webp',
  './photos/spec-43-1-800.webp',
  './photos/spec-42-2-800.webp',
  './photos/spec-42-1-800.webp',
  './photos/spec-40-2-800.webp',
  './photos/spec-40-1-800.webp',
  './photos/spec-38-1-800.webp',
  './photos/spec-36-2-800.webp',
  './photos/spec-36-1-800.webp',
  './photos/spec-35-1-800.webp',
  './photos/spec-34-1-800.webp',
  './photos/spec-33-1-800.webp',
  './photos/spec-32-1-800.webp',
  './photos/spec-31-1-800.webp',
  './photos/spec-30-2-800.webp',
  './photos/spec-30-1-800.webp',
  './photos/spec-28-1-800.webp',
  './photos/spec-27-1-800.webp',
  './photos/spec-26-1-800.webp',
  './photos/spec-25-1-800.webp',
  './photos/spec-24-2-800.webp',
  './photos/spec-24-1-800.webp',
  './photos/spec-23-1-800.webp',
  './photos/spec-22-1-800.webp',
  './photos/spec-21-2-800.webp',
  './photos/spec-21-1-800.webp',
  './photos/spec-20-1-800.webp',
  './photos/spec-19-1-800.webp',
  './photos/spec-15-1-800.webp',
  './photos/spec-14-1-800.webp',
  './photos/spec-13-1-800.webp',
  './photos/spec-12-1-800.webp',
  './photos/spec-11-1-800.webp',
  './photos/spec-10-2-800.webp',
  './photos/spec-10-1-800.webp',
  './photos/spec-09-1-800.webp',
  './photos/spec-08-2-800.webp',
  './photos/spec-08-1-800.webp',
  './photos/spec-07-2-800.webp',
  './photos/spec-07-1-800.webp',
  './photos/spec-06-2-800.webp',
  './photos/spec-06-1-800.webp',
  './photos/spec-05-1-800.webp',
  './photos/spec-04-2-800.webp',
  './photos/spec-04-1-800.webp',
  './photos/spec-03-2-800.webp',
  './photos/spec-03-1-800.webp',
  './photos/spec-02-1-800.webp',
  './photos/spec-01-1-800.webp',
  './photos/prof-land-surveyor-800.webp',
  './photos/prof-metallurgist-800.webp',
  './photos/prof-supply-chain-800.webp',
  './photos/prof-transport-engineer-800.webp',
  './photos/prof-edtech-methodologist-800.webp',
  './photos/prof-translator-800.webp',
  './photos/prof-neuropsychologist-800.webp',
  './photos/prof-fintech-analyst-800.webp',
  './photos/prof-pharmacist-800.webp',
  './photos/prof-ux-researcher-800.webp',
  './photos/prof-railway-engineer-800.webp',
  './photos/prof-gene-engineer-800.webp',
  './photos/prof-renewable-energy-800.webp',
  './photos/prof-teacher-800.webp',
  './photos/prof-product-manager-800.webp',
  './photos/prof-oil-gas-engineer-800.webp',
  './photos/prof-bioinformatics-800.webp',
  './photos/prof-robotics-800.webp',
  './photos/prof-personalized-medicine-800.webp',
  './photos/prof-uav-engineer-800.webp',
  './photos/prof-ml-engineer-800.webp',
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
