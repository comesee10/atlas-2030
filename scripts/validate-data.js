#!/usr/bin/env node
/* A4: валидация данных атласа. Парсит data-core.js, каркас data-framework.js
   и чанки вузов так же, как браузер (window.ATLAS), и проверяет структуру,
   согласованность и провенанс.
   Запуск: node scripts/validate-data.js — nonzero exit при любой ошибке. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['data-core.js', 'data-universities-1.js',
  'data-universities-2.js', 'data-universities-3.js', 'catalog-expansion.js', 'data-framework.js',
  'data-monitoring.js', 'data-organizations-1.js', 'data-organizations-2.js', 'data-merges.js'];

/* Источники, которыми можно подписывать числа. estimate — всегда «оценка атласа». */
const SOURCES = ['monitoring-2025', 'monitoring-spo-2025', 'vuz-site', 'kcp-2025', 'min-edu-min-2025', 'ege-list-2025', 'estimate'];
/* Ни один чанк не должен расти бесконтрольно: иначе первая страница раздела
   будет грузить сотни килобайт ради одного фильтра. */
const MAX_CHUNK_KB = 400;

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

const SPHERE_CODES = ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07', 'D-08', 'D-09', 'D-10'];
const DISTRICT_CODES = ['ЦФО', 'СЗФО', 'ЮФО', 'СКФО', 'ПФО', 'УФО', 'СФО', 'ДФО'];

/* карта городов из app.js — исторический источник region/district */
const appSrc = fs.existsSync(path.join(ROOT, 'app.js')) ? fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') : '';
const cityBlock = appSrc.match(/var CITY_GEO = \{([\s\S]*?)\n\};/);
const CITY_GEO = new Set();
if (!cityBlock) err('app.js: не найден CITY_GEO');
else for (const m of cityBlock[1].matchAll(/'([^']+)':/g)) CITY_GEO.add(m[1]);

/* ---- каркас: география и источники ---- */
const geo = A.geo;
if (!geo) {
  err('geo: нет ATLAS.geo (data-framework.js)');
} else {
  if (!geo.updated) warn('geo.updated отсутствует');
  const regions = geo.regions || {};
  const cities = geo.cities || {};
  const regionNames = Object.keys(regions);
  if (regionNames.length < 80) warn('geo.regions: подозрительно мало регионов — ' + regionNames.length);
  for (const [name, district] of Object.entries(regions)) {
    if (DISTRICT_CODES.indexOf(district) < 0) err('geo.regions[' + name + ']: неизвестный округ ' + district);
  }
  for (const [city, pair] of Object.entries(cities)) {
    if (!Array.isArray(pair) || pair.length !== 2) { err('geo.cities[' + city + ']: ожидается [регион, округ]'); continue; }
    if (!regions[pair[0]]) err('geo.cities[' + city + ']: регион «' + pair[0] + '» отсутствует в geo.regions');
    if (DISTRICT_CODES.indexOf(pair[1]) < 0) err('geo.cities[' + city + ']: неизвестный округ ' + pair[1]);
  }
  if (Object.keys(cities).length < 80) warn('geo.cities: подозрительно мало городов — ' + Object.keys(cities).length);
}

if (!Array.isArray(A.sources) || !A.sources.length) {
  warn('sources: реестр источников пуст');
} else {
  A.sources.forEach((s, i) => {
    const t = 'sources[' + i + ']';
    for (const k of ['id', 'name', 'url', 'asOf']) if (!s[k]) err(t + ': поле ' + k + ' пусто');
    if (s.id && SOURCES.indexOf(s.id) < 0) warn(t + ': неизвестный id ' + s.id);
    if (s.url && !/^https?:\/\//.test(s.url)) err(t + ': url не абсолютный — ' + s.url);
    if (s.asOf && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s.asOf)) err(t + ': asOf не дата — ' + s.asOf);
  });
}

/* провенанс записи: либо src+asOf есть, либо запись явно помечена как оценка */
function provenance(t, rec) {
  if (!rec.src) { warn(t + ': нет src — запись без источника'); return; }
  if (SOURCES.indexOf(rec.src) < 0) err(t + ': неизвестный src ' + rec.src);
  if (!rec.asOf) err(t + ': src есть, asOf нет');
}

/* ---- meta ---- */
if (!A.meta || !A.meta.updated) warn('meta.updated отсутствует');

/* ---- professions ---- */
const profs = A.professions || [];
if (!profs.length) err('professions пустой');
const slugs = new Set();
const allSlugs = new Set();
const ranks = new Set();
profs.forEach((p, i) => {
  const t = 'profession[' + i + '] ' + (p.slug || '?');
  for (const k of ['slug', 'title', 'desc', 'sphereCode', 'sphere', 'salary'])
    if (!p[k]) err(t + ': поле ' + k + ' пусто');
  if (!/^[a-z0-9-]+$/.test(p.slug || '')) err(t + ': slug не snake-case: ' + p.slug);
  if (slugs.has(p.slug)) err(t + ': дубликат slug');
  slugs.add(p.slug);
  if (allSlugs.has(p.slug)) err(t + ': slug пересекается с другой сущностью: ' + p.slug);
  allSlugs.add(p.slug);
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
  /* card:'org' — карточка организации с официальными показателями, но без
     разобранных программ: такие записи добавляет data-monitoring.js. */
  const orgCard = u.card === 'org';
  if (u.card !== undefined && !orgCard) err(t + ': неизвестный card ' + u.card);
  for (const k of ['short', 'full', 'city'])
    if (u[k] === undefined || u[k] === '') err(t + ': поле ' + k + ' пусто');
  if (uniShorts.has(u.short)) err(t + ': дубликат short');
  uniShorts.add(u.short);
  if (u.avg === undefined) {
    if (!(orgCard && (u.avgEge || u.students))) err(t + ': поле avg пусто');
  } else if (!(Number(u.avg) >= 100 && Number(u.avg) <= 300)) {
    err(t + ': avg вне 100..300: ' + u.avg);
  }
  const known = (geo && geo.cities && geo.cities[u.city]) || CITY_GEO.has(u.city);
  if (!known) err(t + ': город «' + u.city + '» отсутствует в geo.cities и CITY_GEO (география сломается)');
  /* новый официальный показатель: средний балл в расчёте на один предмет */
  if (u.avgEge !== undefined) {
    if (!(Number(u.avgEge) >= 40 && Number(u.avgEge) <= 100)) err(t + ': avgEge вне 40..100: ' + u.avgEge);
    if (u.avgEge && u.avgEgeSrc !== 'monitoring-2025' && u.src !== 'monitoring-2025')
      warn(t + ': avgEge без src monitoring-2025');
  }
  if (u.avgEgeSrc !== undefined && u.avgEgeSrc !== 'monitoring-2025')
    err(t + ': avgEgeSrc ожидается monitoring-2025 — ' + u.avgEgeSrc);
  if (u.students !== undefined && !(Number(u.students) > 0)) err(t + ': students вне >0: ' + u.students);
  if (u.monitoringId !== undefined && !/^\d+$/.test(String(u.monitoringId)))
    err(t + ': monitoringId не число — ' + u.monitoringId);
  if (orgCard && !u.monitoringId) err(t + ': card org без monitoringId');
  if (u.passEstimate !== undefined && !(Number(u.passEstimate) >= 100 && Number(u.passEstimate) <= 400))
    err(t + ': passEstimate вне 100..400: ' + u.passEstimate);
  provenance(t, u);
  if (!Array.isArray(u.programs)) { err(t + ': programs не массив'); return; }
  if (!u.programs.length) {
    if (!orgCard) err(t + ': нет программ');
    else if (!u.avgEge && !u.students) err(t + ': карточка организации без показателей');
    return;
  }
  u.programs.forEach((pr, j) => {
    const pt = t + '.program[' + j + ']';
    for (const k of ['direction', 'code', 'ege']) if (!pr[k]) err(pt + ': поле ' + k + ' пусто');
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(pr.code || '')) err(pt + ': код не в формате 00.00.00 — ' + pr.code);
    if (pr.professionSlug && !slugs.has(pr.professionSlug)) err(pt + ': битая ссылка на профессию ' + pr.professionSlug);
    if (pr.budget && isNaN(Number(String(pr.budget).replace(/[^\d.]/g, '')))) warn(pt + ': budget не число: ' + pr.budget);
    if ((pr.budget || pr.paid) && pr.src && SOURCES.indexOf(pr.src) < 0) err(pt + ': неизвестный src ' + pr.src);
  });
});

/* ---- СПО-специальности (историческое имя colleges) ---- */
const cols = A.colleges || [];
const colDetails = A.collegeDetails || {};
const colSlugs = new Set();
cols.forEach((c) => {
  const t = 'college ' + (c.slug || '?');
  for (const k of ['slug', 'code', 'sphereCode', 'title', 'desc', 'duration', 'price'])
    if (!c[k]) err(t + ': поле ' + k + ' пусто');
  if (colSlugs.has(c.slug)) err(t + ': дубликат slug');
  colSlugs.add(c.slug);
  if (allSlugs.has(c.slug)) err(t + ': slug пересекается с другой сущностью: ' + c.slug);
  allSlugs.add(c.slug);
  if (SPHERE_CODES.indexOf(c.sphereCode) < 0) err(t + ': неизвестная sphereCode ' + c.sphereCode);
  if (!/^\d{2}\.\d{2}\.\d{2}$/.test(c.code || '')) err(t + ': код не в формате 00.00.00 — ' + c.code);
  if (!colDetails[c.slug]) warn(t + ': нет collegeDetails');
});
for (const k of Object.keys(colDetails)) if (!colSlugs.has(k)) err('collegeDetails: лишний ключ ' + k);

/* ---- организации СПО (новый слой, заполняется батчем 3) ---- */
const orgs = A.collegeOrgs || [];
if (!Array.isArray(orgs)) err('collegeOrgs: ожидается массив');
const orgSlugs = new Set();
orgs.forEach((o, i) => {
  const t = 'collegeOrg[' + i + '] ' + (o.slug || '?');
  for (const k of ['slug', 'name', 'city']) if (!o[k]) err(t + ': поле ' + k + ' пусто');
  if (!/^[a-z0-9-]+$/.test(o.slug || '')) err(t + ': slug не snake-case');
  if (orgSlugs.has(o.slug)) err(t + ': дубликат slug');
  orgSlugs.add(o.slug);
  if (allSlugs.has(o.slug)) err(t + ': slug пересекается с другой сущностью: ' + o.slug);
  allSlugs.add(o.slug);
  const known = (geo && geo.cities && geo.cities[o.city]) || CITY_GEO.has(o.city);
  if (!known) err(t + ': город «' + o.city + '» отсутствует в geo.cities');
  if (o.ugs && !Array.isArray(o.ugs)) err(t + ': ugs должен быть массивом');
  (o.ugs || []).forEach((g, j) => {
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(g.code || '')) err(t + '.ugs[' + j + ']: код не в формате 00.00.00 — ' + g.code);
    if (!g.title) err(t + '.ugs[' + j + ']: пустое название');
  });
  provenance(t, o);
});

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

/* ---- размеры чанков ---- */
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const kb = Math.round(fs.statSync(p).size / 1024);
  if (kb > MAX_CHUNK_KB) err(f + ': ' + kb + ' КБ, лимит ' + MAX_CHUNK_KB + ' КБ — делить по округам');
}

/* ---- фото-банки сфер: файлы должны быть в репозитории ---- */
if (fs.existsSync(path.join(ROOT, 'photos'))) {
/* Отдельный фотобанк есть только у первых шести сфер; новые используют
   нейтральные учебные сцены, их наличие проверяет smoke-links. */
  for (const code of SPHERE_CODES.slice(0, 6)) {
    const key = code.toLowerCase().replace(/-/g, '');
    for (const size of ['800', '1600']) {
      for (const base of ['sphere-' + key + '-' + size, 'sphere-' + key + '-alt-' + size]) {
        if (!fs.existsSync(path.join(ROOT, 'photos', base + '.webp'))) err('photos: нет ' + base + '.webp');
      }
    }
  }
  /* Фотобанк профессий: у каждого снимка есть автор, лицензия, источник
     и подпись, а файл лежит в репозитории. Агрегаторы и «стоки» не годятся. */
  const creditsFile = path.join(ROOT, 'photos', 'credits.json');
  if (fs.existsSync(creditsFile)) {
    let credits = {};
    try { credits = JSON.parse(fs.readFileSync(creditsFile, 'utf8')); } catch (e) { err('photos/credits.json: ' + e.message); }
    const prof = credits.professions || {};
    const keys = Object.keys(prof);
    if (!keys.length) warn('photos/credits.json: нет раздела профессий');
    const ALLOWED = /^(CC BY(?!-NC|-ND)|CC0|Public domain)/i;
    for (const key of keys) {
      const p = prof[key];
      if (!p.file || !fs.existsSync(path.join(ROOT, p.file))) err('photos: нет файла ' + key);
      if (!p.author) err('photos: нет автора ' + key);
      if (!ALLOWED.test(p.license || '')) err('photos: лицензия ' + key + ' — ' + p.license);
      if (!/^https:\/\/commons\.wikimedia\.org\//.test(p.source || '')) err('photos: источник ' + key + ' не Commons');
      if (!p.caption) err('photos: нет подписи ' + key);
    }
  } else {
    warn('photos/credits.json не найден');
  }
} else {
  warn('папка photos не найдена (в CI она есть из checkout)');
}

report();
function report() {
  warns.forEach((w) => console.log('WARN  ' + w));
  errors.forEach((e) => console.error('ERROR ' + e));
  console.log('validate-data: ' + (errors.length ? 'FAIL (' + errors.length + ' ошибок)' : 'OK') +
    ' | ' + (A ? profs.length + ' профессий, ' + unis.length + ' вузов, ' + cols.length + ' специальностей, ' +
      (A.collegeOrgs || []).length + ' организаций СПО' : 'данные не загрузились') +
    (A && A.geo ? ', ' + Object.keys(A.geo.cities || {}).length + ' городов' : ''));
  process.exit(errors.length ? 1 : 0);
}
