#!/usr/bin/env node
/* A4: smoke-тест ссылок и ассетов. Проверяет, что
   1) все локальные src/href из index.html существуют в репозитории (или это маршрут SPA);
   2) precache-лист sw.js ссылается на существующие файлы;
   3) <loc> в sitemap.xml ведут на известные маршруты атласа (ROUTES в app.js);
   4) allow-list редиректа в 404.html покрывает все маршруты app.js;
   5) robots.txt указывает на sitemap.
   Запуск: node scripts/smoke-links.js */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = '/atlas-2030';
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

function read(f) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { err(f + ': файл отсутствует'); return ''; }
  return fs.readFileSync(p, 'utf8');
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

/* ---- маршруты из app.js (ROUTES) ---- */
const app = read('app.js');
const routesBlock = app.match(/var ROUTES = \[([\s\S]*?)\n\];/);
const knownPaths = new Set(['/']);
if (!routesBlock) err('app.js: не найден массив ROUTES');
else {
  for (const line of routesBlock[1].split('\n')) {
    const m = line.match(/\/\^\\\/([a-z-]+)/);
    if (m) knownPaths.add('/' + m[1]);
  }
}
console.log('app.js: маршруты: ' + [...knownPaths].join(', '));

/* ---- 1) index.html ---- */
const html = read('index.html');
{
  const refs = new Set();
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    let u = m[1];
    if (/^(https?:|mailto:|data:|#)/.test(u)) continue;
    u = u.split('?')[0].split('#')[0];
    if (!u || u === '/') continue;
    let rel = u.startsWith(BASE + '/') ? u.slice(BASE.length + 1) : (!u.startsWith('/') ? u : u.slice(1));
    if (knownPaths.has('/' + rel.split('/')[0])) continue; // маршрут SPA из <noscript>
    refs.add(rel);
  }
  for (const r of refs) if (!exists(r)) err('index.html: отсутствует ' + r);
  console.log('index.html: проверено ' + refs.size + ' локальных ссылок');
}

/* ---- 2) sw.js SHELL ---- */
const sw = read('sw.js');
{
  const block = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  if (!block) err('sw.js: не найден массив SHELL');
  else {
    const items = [...block[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).filter((x) => x !== './');
    let n = 0;
    for (const it of items) {
      const rel = it.replace(/^\.\//, '').split('?')[0];
      if (!rel || rel === '/') continue;
      n++;
      if (!exists(rel)) err('sw.js SHELL: отсутствует ' + rel);
    }
    console.log('sw.js: проверено ' + n + ' файлов офлайн-кеша');
  }
  if (!/VERSION = '[^']+/.test(sw)) err('sw.js: не найден VERSION');
}

/* ---- 3) sitemap.xml ---- */
const sm = read('sitemap.xml');
{
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  if (!locs.length) err('sitemap.xml: нет <loc>');
  for (const loc of locs) {
    if (!loc.startsWith('https://')) err('sitemap: не-https loc ' + loc);
    let p;
    try { p = new URL(loc).pathname; } catch (e) { err('sitemap: неразбираемый loc ' + loc); continue; }
    if (!p.startsWith(BASE)) { err('sitemap: loc вне базы: ' + loc); continue; }
    const seg = (p.replace(BASE, '').replace(/\/+$/, '') || '/');
    const first = seg === '/' ? '/' : '/' + seg.split('/')[0];
    if (!knownPaths.has(first)) err('sitemap: неизвестный маршрут ' + first + ' (' + loc + ')');
  }
  if (locs.length && !locs.some((l) => l === 'https://comesee10.github.io/atlas-2030/'))
    err('sitemap: нет корневой страницы');
  console.log('sitemap.xml: проверено ' + locs.length + ' URL');
}

/* ---- 4) 404.html allow-list ---- */
const nf = read('404.html');
{
  const line = (nf.match(/var allowed = [^;]+;/) || [''])[0];
  if (!line) err('404.html: не найден allow-list редиректа');
  else {
    for (const p of knownPaths) {
      if (p === '/') continue;
      const name = p.slice(1);
      const ok = new RegExp('(?:\\|\\s*|^|\\(\\?:)' + name.replace(/-/g, '-') + '(?:\\||\\(|\\))').test(line);
      if (!ok) err('404.html: маршрут ' + p + ' отсутствует в allow-list — прямые ссылки уйдут на главную');
    }
    console.log('404.html: allow-list сверен с ' + knownPaths.size + ' маршрутами');
  }
}

/* ---- 5) robots.txt ---- */
const rob = read('robots.txt');
if (rob && !/Sitemap:\s*https:\/\/comesee10\.github\.io\/atlas-2030\/sitemap\.xml/i.test(rob))
  err('robots.txt: нет (или некорректна) строка Sitemap:');

/* ---- 6) prerender: статические копии страниц ---- */
{
  const pageDirs = ['professions', 'universities', 'specialties', 'colleges'];
  const pages = [];
  for (const dir of pageDirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) { err('нет папки ' + dir + '/ — запустите npm run build'); continue; }
    for (const name of fs.readdirSync(abs)) {
      const file = path.join(abs, name, 'index.html');
      if (fs.existsSync(file)) pages.push({ route: '/' + dir + '/' + name, file });
    }
  }
  for (const s of ['professions', 'universities', 'specialties', 'colleges', 'regions', 'admission',
    'calendar', 'teacher', 'about', 'methodology']) {
    const file = path.join(ROOT, s, 'index.html');
    if (!fs.existsSync(file)) err('нет статической копии раздела /' + s + '/');
  }

  const SITE = 'https://comesee10.github.io';
  const existsRoute = (route) => fs.existsSync(path.join(ROOT, route.replace(/^\/|\/$/g, ''), 'index.html'))
    || (route === '/' && fs.existsSync(path.join(ROOT, 'index.html')));

  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    if (html.indexOf('<title>') < 0) err(page.route + '/: нет <title>');
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canonical !== SITE + BASE + page.route + '/') err(page.route + '/: canonical ' + canonical);
    const blocks = html.match(/<main id="app"[\s\S]*?<\/main>/) || [''];
    const body = blocks[0];
    if (body.length < 2000) err(page.route + '/: слишком мало разметки — страница не отрендерена');
    const re = /href="([^"]+)"/g;
    let m;
    while ((m = re.exec(body))) {
      const u = m[1];
      if (!u.startsWith(BASE + '/')) continue;
      const rel = u.slice(BASE.length).split('?')[0];
      if (!rel || rel === '/') continue;
      /* Интерактивные разделы живут на хеш-адресах: /atlas-2030/#/quiz-oge */
      if (rel.startsWith('/#')) continue;
      if (!existsRoute(rel.replace(/\/+$/, ''))) err(page.route + '/: ссылка на несуществующую страницу ' + u);
    }
  }
  if (!pages.length) err('prerender: не найдено ни одной статической карточки');
  console.log('prerender: проверено ' + pages.length + ' статических карточек');
}

console.log('---');


warns.forEach((w) => console.log('WARN  ' + w));
errors.forEach((e) => console.error('ERROR ' + e));
console.log('smoke-links: ' + (errors.length ? 'FAIL (' + errors.length + ')' : 'OK'));
process.exit(errors.length ? 1 : 0);
