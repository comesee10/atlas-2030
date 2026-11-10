#!/usr/bin/env node
/* Пререндер статических URL атласа.
   Каждый контентный маршрут превращается в настоящую папку с index.html:
     /atlas-2030/professions/ml-engineer/   ← вместо /#/professions/ml-engineer
   Разметку генерирует тот же app.js, что работает в браузере (jsdom), поэтому
   статическая копия и клиентский рендер не расходятся. Ссылки в готовых
   страницах переписаны на настоящие URL, а скрипты подключаются по абсолютным
   путям — страницы открываются и без JavaScript.

   Запуск:  node scripts/prerender.js          — пересобрать страницы и sitemap
            node scripts/prerender.js --check  — только сравнить с диском
   Требует devDependency jsdom (npm ci). */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://comesee10.github.io';
const BASE = '/atlas-2030';
const CHECK = process.argv.includes('--check');

const DATA_FILES = ['data-core.js', 'data-universities-1.js', 'data-universities-2.js',
  'data-universities-3.js', 'catalog-expansion.js'];

/* Разделы с собственной статической копией. Должно совпадать с STATIC_ROUTE
   в app.js; совпадение проверяет scripts/smoke-links.js. */
const SECTIONS = [
  { route: '/professions', priority: '0.9', changefreq: 'monthly' },
  { route: '/universities', priority: '0.8', changefreq: 'monthly' },
  { route: '/specialties', priority: '0.7', changefreq: 'monthly' },
  { route: '/colleges', priority: '0.8', changefreq: 'monthly' },
  { route: '/admission', priority: '0.8', changefreq: 'monthly' },
  { route: '/calendar', priority: '0.8', changefreq: 'monthly' },
  { route: '/regions', priority: '0.7', changefreq: 'monthly' },
  { route: '/teacher', priority: '0.7', changefreq: 'monthly' },
  { route: '/methodology', priority: '0.5', changefreq: 'yearly' },
  { route: '/about', priority: '0.4', changefreq: 'yearly' }
];

const quiet = new VirtualConsole();
quiet.on('jsdomError', (e) => {
  if (!/Not implemented/.test(e.message)) console.error('jsdom: ' + e.message);
});

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/* Данные атласа считаем один раз и клонируем на каждую страницу. */
function loadAtlas() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: SITE + BASE + '/', runScripts: 'outside-only', virtualConsole: quiet
  });
  for (const f of DATA_FILES) dom.window.eval(read(f));
  const data = dom.window.ATLAS;
  dom.window.close();
  if (!data) throw new Error('данные атласа не загрузились');
  return data;
}

/* Адреса карточек берём у самого app.js: он выводит их из данных. */
function loadRoutes(atlas) {
  const dom = new JSDOM(read('index.html'), {
    url: SITE + BASE + '/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: quiet
  });
  prepare(dom.window, atlas);
  dom.window.eval(read('app.js'));
  const routes = dom.window.ATLAS_ROUTES;
  dom.window.close();
  if (!routes) throw new Error('app.js не отдал window.ATLAS_ROUTES');
  return routes;
}

function prepare(win, atlas) {
  win.ATLAS = atlas;
  win.__ATLAS_PRERENDER__ = true;
  win.matchMedia = win.matchMedia || ((query) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }
  }));
  win.scrollTo = () => {};
}

function renderPage(route, atlas) {
  const url = SITE + BASE + (route === '/' ? '/' : route.replace(/\/+$/, '') + '/');
  const dom = new JSDOM(read('index.html'), {
    url, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: quiet
  });
  const win = dom.window;
  prepare(win, structuredClone(atlas));
  win.eval(read('app.js'));
  const doc = win.document;
  const view = doc.querySelector('#app .view');
  if (!view) throw new Error(route + ': app.js не отрисовал страницу');
  /* Ошибка рендера превращается в 404-экран: такую страницу нельзя публиковать. */
  if (view.querySelector('.cube404') || /Страница не найдена/.test(doc.title)) {
    throw new Error(route + ': страница отрисовалась как 404');
  }
  doc.querySelectorAll('#app .boot-skel').forEach((el) => el.remove());
  /* Статическая копия уже содержит разметку: подсказка «нужен JavaScript» лишняя. */
  doc.querySelectorAll('noscript').forEach((el) => el.remove());
  const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
  win.close();
  return html;
}

function pageFile(route) {
  const rel = route.replace(/^\/+|\/+$/g, '');
  return path.join(ROOT, rel, 'index.html');
}

function eachRoute(routes) {
  const list = [];
  for (const s of SECTIONS) list.push({ route: s.route, priority: s.priority, changefreq: s.changefreq });
  const detail = [
    ['/professions/', routes.professions, '0.7'],
    ['/universities/', routes.universities, '0.6'],
    ['/specialties/', routes.specialties, '0.6'],
    ['/colleges/', routes.colleges, '0.6']
  ];
  for (const [prefix, items, priority] of detail) {
    for (const slug of items) list.push({ route: prefix + slug, priority, changefreq: 'monthly' });
  }
  return list;
}

function sitemap(routes, lastmod) {
  const url = (loc, changefreq, priority) =>
    '  <url><loc>' + SITE + BASE + loc + '</loc><lastmod>' + lastmod + '</lastmod>' +
    '<changefreq>' + changefreq + '</changefreq><priority>' + priority + '</priority></url>';
  const out = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Сгенерировано scripts/prerender.js. Правки вручную перезапишутся. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url('/', 'monthly', '1.0')];
  for (const r of eachRoute(routes)) out.push(url(r.route + '/', r.changefreq, r.priority));
  out.push('</urlset>', '');
  return out.join('\n');
}

function dataLastmod() {
  const stamps = DATA_FILES.concat(['app.js', 'index.html'])
    .map((f) => fs.statSync(path.join(ROOT, f)).mtime)
    .map((d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  return stamps.sort().pop();
}

function main() {
  const atlas = loadAtlas();
  const routes = loadRoutes(atlas);
  const pages = eachRoute(routes);
  const stale = [];
  const missing = [];

  for (const page of pages) {
    const html = renderPage(page.route, atlas);
    const file = pageFile(page.route);
    if (CHECK) {
      if (!fs.existsSync(file)) missing.push(page.route);
      else if (fs.readFileSync(file, 'utf8') !== html) stale.push(page.route);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
    }
  }

  const map = sitemap(routes, dataLastmod());
  const mapFile = path.join(ROOT, 'sitemap.xml');
  const mapDiff = !fs.existsSync(mapFile) || fs.readFileSync(mapFile, 'utf8') !== map;
  if (!CHECK && mapDiff) fs.writeFileSync(mapFile, map);

  /* Убираем страницы, которых больше нет (удалили профессию или вуз). */
  const known = new Set(pages.map((p) => pageFile(p.route)));
  const orphans = [];
  for (const prefix of ['professions', 'universities', 'specialties', 'colleges']) {
    const dir = path.join(ROOT, prefix);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name, 'index.html');
      if (fs.existsSync(file) && !known.has(file)) {
        orphans.push(prefix + '/' + name);
        if (!CHECK) fs.rmSync(path.join(dir, name), { recursive: true, force: true });
      }
    }
  }

  const total = pages.length + 1;
  if (CHECK) {
    const problems = stale.length + missing.length + (mapDiff ? 1 : 0) + orphans.length;
    for (const r of missing) console.error('MISSING ' + r + '/');
    for (const r of stale) console.error('STALE   ' + r + '/');
    if (mapDiff) console.error('STALE   sitemap.xml');
    for (const r of orphans) console.error('ORPHAN  ' + r + '/');
    console.log('prerender --check: ' + (problems ? 'FAIL (' + problems + ')' : 'OK') + ', страниц: ' + total);
    process.exit(problems ? 1 : 0);
  }
  console.log('prerender: собрано ' + total + ' страниц, sitemap.xml ' + (mapDiff ? 'обновлён' : 'без изменений') +
    (orphans.length ? ', удалено устаревших: ' + orphans.length : ''));
}

main();
