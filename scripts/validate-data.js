#!/usr/bin/env node
/* A4: валидация данных атласа. Парсит data-core.js и чанки вузов так же,
   как браузер (window.ATLAS), и проверяет структуру и согласованность.
   Запуск: node scripts/validate-data.js — nonzero exit при любой ошибке. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['data-core.js', 'data-universities-1.js', 'data-universities-2.js',
  'data-universities-3.js', 'catalog-expansion.js'];

const errors = [];
const warns = [];
function err(m) { errors.push(m); }
function warn(m) { warns.push(m); }

let win = {};
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { err(f + ': файл отсутствует'); continue; }
  try {
    vm.runInNewContext(fs.readFileSync(p, 'utf8'), { window: win, console: { log() {} } }, { filename: f, timeout: 10000 });
  } catch (e) {
    err(f + ': не исполняется — ' + e.message);
  }
}
const A = win.ATLAS;
if (!A) { report(); process.exit(1); }

const SPHERE_CODES = ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06'];

/* карта городов из app.js — источник region/district (в данных их нет) */
const appSrc = fs.existsSync(path.join(ROOT, 'app.js')) ? fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') : '';
const cityBlock = appSrc.match(/var CITY_GEO = \{([\s\S]*?)\n\};/);
const CITY_GEO = new Set();
if (!cityBlock) err('app.js: не найден CITY_GEO');
else for (const m of cityBlock[1].matchAll(/'([^']+)':/g)) CITY_GEO.add(m[1]);

/* ---- meta ---- */
if (!A.meta || !A.meta.updated) warn('meta.updated отсутствует');

/* ---- professions ---- */
const profs = A.professions || [];
if (!profs.length) err('professions пустой');
const slugs = new Set();
const ranks = new Set();
profs.forEach((p, i) => {
  const t = 'profession[' + i + '] ' + (p.slug || '?');
  for (const k of ['slug', 'title', 'desc', 'sphereCode', 'sphere', 'salary'])
    if (!p[k]) err(t + ': поле ' + k + ' пусто');
  if (!/^[a-z0-9-]+$/.test(p.slug || '')) err(t + ': slug не snake-case: ' + p.slug);
  if (slugs.has(p.slug)) err(t + ': дубликат slug');
  slugs.add(p.slug);
  if (ranks.has(p.rank)) warn(t + ': дубликат rank ' + p.rank);
  ranks.add(p.rank);
  if (!(Number(p.index) >= 0 && Number(p.index) <= 100)) err(t + ': index вне 0..100: ' + p.index);
  if (!(Number(p.growth) >= 0 && Number(p.growth) <= 100)) err(t + ': growth вне 0..100: ' + p.growth);
  if (SPHERE_CODES.indexOf(p.sphereCode) < 0) err(t + ': неизвестная sphereCode ' + p.sphereCode);
});

/* ---- universities ---- */
const unis = A.universities || [];
if (!unis.length) err('universities пустой');
const uniShorts = new Set();
unis.forEach((u, i) => {
  const t = 'university[' + i + '] ' + (u.short || '?');
  for (const k of ['short', 'full', 'city', 'avg'])
    if (u[k] === undefined || u[k] === '') err(t + ': поле ' + k + ' пусто');
  if (uniShorts.has(u.short)) err(t + ': дубликат short');
  uniShorts.add(u.short);
  if (!(Number(u.avg) >= 100 && Number(u.avg) <= 300)) err(t + ': avg вне 100..300: ' + u.avg);
  if (CITY_GEO.size && !CITY_GEO.has(u.city)) err(t + ': город «' + u.city + '» отсутствует в CITY_GEO (география сломается)');
  if (!Array.isArray(u.programs) || !u.programs.length) { err(t + ': нет программ'); return; }
  u.programs.forEach((pr, j) => {
    const pt = t + '.program[' + j + ']';
    for (const k of ['direction', 'code', 'ege']) if (!pr[k]) err(pt + ': поле ' + k + ' пусто');
    if (pr.professionSlug && !slugs.has(pr.professionSlug)) err(pt + ': битая ссылка на профессию ' + pr.professionSlug);
    if (pr.budget && isNaN(Number(String(pr.budget).replace(/[^\d.]/g, '')))) warn(pt + ': budget не число: ' + pr.budget);
  });
});

/* ---- colleges ---- */
const cols = A.colleges || [];
const colDetails = A.collegeDetails || {};
const colSlugs = new Set();
cols.forEach((c) => {
  const t = 'college ' + (c.slug || '?');
  for (const k of ['slug', 'code', 'sphereCode', 'title', 'desc', 'duration', 'price'])
    if (!c[k]) err(t + ': поле ' + k + ' пусто');
  if (colSlugs.has(c.slug)) err(t + ': дубликат slug');
  colSlugs.add(c.slug);
  if (SPHERE_CODES.indexOf(c.sphereCode) < 0) err(t + ': неизвестная sphereCode ' + c.sphereCode);
  if (!colDetails[c.slug]) warn(t + ': нет collegeDetails');
});
for (const k of Object.keys(colDetails)) if (!colSlugs.has(k)) err('collegeDetails: лишний ключ ' + k);

/* ---- details ---- */
const details = A.details || {};
for (const s of slugs) if (!details[s] || !details[s].body) err('details: нет body для профессии ' + s);
for (const k of Object.keys(details)) {
  if (!slugs.has(k)) err('details: лишний ключ ' + k);
  for (const f of ['sphere', 'title', 'lead', 'passport', 'body'])
    if (!details[k][f]) warn('details[' + k + ']: пусто ' + f);
  (details[k].similar || []).forEach((sim) => {
    if (!slugs.has(sim.slug)) err('details[' + k + ']: similar ссылается на несуществующий ' + sim.slug);
  });
}

/* ---- methodology ---- */
if (!A.methodology) warn('methodology отсутствует');

/* ---- фото-банки сфер: файлы должны быть в репозитории ---- */
if (fs.existsSync(path.join(ROOT, 'photos'))) {
  for (const code of SPHERE_CODES) {
    const key = code.toLowerCase().replace(/-/g, '');
    for (const size of ['800', '1600']) {
      for (const base of ['sphere-' + key + '-' + size, 'sphere-' + key + '-alt-' + size]) {
        if (!fs.existsSync(path.join(ROOT, 'photos', base + '.webp'))) err('photos: нет ' + base + '.webp');
      }
    }
  }
} else {
  warn('папка photos не найдена (в CI она есть из checkout)');
}

report();
function report() {
  warns.forEach((w) => console.log('WARN  ' + w));
  errors.forEach((e) => console.error('ERROR ' + e));
  console.log('validate-data: ' + (errors.length ? 'FAIL (' + errors.length + ' ошибок)' : 'OK') +
    ' | ' + (A ? profs.length + ' профессий, ' + unis.length + ' вузов, ' + cols.length + ' специальностей' : 'данные не загрузились'));
  process.exit(errors.length ? 1 : 0);
}
