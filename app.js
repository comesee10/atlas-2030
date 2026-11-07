(function () {
'use strict';
/* База для абсолютных ссылок: запоминаем адрес app.js до того, как роутер
   заменит адрес страницы на deep-link. Иначе относительный sw.js резолвится
   от /professions/... и регистрация падает с 404. */
var SCRIPT_BASE = (function () {
try {
if (document.currentScript && document.currentScript.src) return new URL('.', document.currentScript.src).href;
} catch (e) {}
return null;
})();
var A = window.ATLAS;
var app = document.getElementById('app');
if (!A || !A.professions) {
app.innerHTML = '<div style="padding:80px 0"><h1 class="display">Данные не загрузились</h1><p class="lead">Проверьте, что рядом с index.html лежат файлы data-core.js и data-universities-1…3.js.</p></div>';
return;
}
var P = A.professions || [];
var U = A.universities || [];
var C = A.colleges || [];
var D = A.details || {};
var CD = A.collegeDetails || {};
/* Режим атласа: школьник или взрослый, который помогает выбрать путь.
   Хранится только в этом браузере и меняет подачу, а не данные. */
var ROLE = 'student';
try { ROLE = localStorage.getItem('atlas:role') === 'teacher' ? 'teacher' : 'student'; } catch (e) {}
document.documentElement.setAttribute('data-role', ROLE);
function setRole(role) {
ROLE = role === 'teacher' ? 'teacher' : 'student';
try { localStorage.setItem('atlas:role', ROLE); } catch (e) {}
document.documentElement.setAttribute('data-role', ROLE);
route();
}
function roleSwitchHtml() {
return '<div class="role-switch" role="group" aria-label="Режим атласа">' +
'<button type="button" data-role="student" aria-pressed="' + (ROLE === 'student' ? 'true' : 'false') + '">Я ученик</button>' +
'<button type="button" data-role="teacher" aria-pressed="' + (ROLE === 'teacher' ? 'true' : 'false') + '">Я учитель или родитель</button>' +
'</div>';
}
document.addEventListener('click', function (e) {
var b = e.target.closest && e.target.closest('button[data-role]');
if (!b) return;
e.preventDefault();
setRole(b.getAttribute('data-role'));
});
function h(s) {
return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
});
}
function norm(s) {
return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
function mark(text, q) {
var t = String(text == null ? '' : text);
if (!q) return h(t);
var i = norm(t).indexOf(norm(q));
if (i < 0) return h(t);
return h(t.slice(0, i)) + '<mark>' + h(t.slice(i, i + q.length)) + '</mark>' + h(t.slice(i + q.length));
}
function plural(n, one, few, many) {
n = Math.abs(n) % 100;
var n1 = n % 10;
if (n > 10 && n < 20) return many;
if (n1 > 1 && n1 < 5) return few;
if (n1 === 1) return one;
return many;
}
function num(v) {
var n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
return isNaN(n) ? 0 : n;
}
function setTitle(t) { document.title = t; }
var toastEl = document.getElementById('toast');
var toastTimer;
function toast(msg) {
if (!toastEl) return;
toastEl.textContent = msg;
toastEl.classList.add('show');
clearTimeout(toastTimer);
toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
}
function copyLink(shareUrl) {
var url = shareUrl || location.href;
function ok() { toast('Ссылка скопирована'); }
function fallback() {
var ta = document.createElement('textarea');
ta.value = url;
ta.setAttribute('readonly', '');
ta.style.position = 'fixed';
ta.style.opacity = '0';
document.body.appendChild(ta);
ta.select();
try { document.execCommand('copy'); ok(); } catch (e) { toast('Не удалось скопировать ссылку'); }
ta.remove();
}
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(url).then(ok, fallback);
} else { fallback(); }
}
function trapTab(container, e) {
if (e.key !== 'Tab') return;
var f = container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
if (!f.length) return;
var first = f[0], last = f[f.length - 1];
if (!container.contains(document.activeElement)) {
e.preventDefault();
first.focus();
} else if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first.focus();
}
}
function restoreFocus(el, fallback) {
if (el && el.focus && el !== document.body) { el.focus(); return; }
if (fallback && fallback.focus) fallback.focus();
}
var SPHERES = [];
P.forEach(function (p) {
if (!SPHERES.some(function (s) { return s.code === p.sphereCode; })) {
SPHERES.push({ code: p.sphereCode, name: p.sphere, count: 0 });
}
});
SPHERES.forEach(function (s) {
s.count = P.filter(function (p) { return p.sphereCode === s.code; }).length;
});
SPHERES.sort(function (a, b) { return a.code.localeCompare(b.code); });
var SPHERE_DESC = {
'D-01': 'Код, данные, алгоритмы, ИИ',
'D-02': 'Машины, материалы, производство',
'D-03': 'Здоровье, биология, фарма',
'D-04': 'Энергия, климат, ресурсы',
'D-05': 'Люди, право, экономика',
'D-06': 'Тексты, медиа, перевод'
};
/* ---------- фотобанк сфер ----------
   Фотографии лежат рядом с сайтом и подключаются только в полной версии:
   в standalone-файле их нет, поэтому там остаётся градиентная заливка. */
var ASSET_BASE = SCRIPT_BASE || '/atlas-2030/';
var PHOTOS_ON = !window.__ATLAS_STANDALONE__ && !!SCRIPT_BASE;
var PHOTO_CREDITS = {
  'D-01': { by: 'NASA Scientific Visualization Studio', lic: 'Public domain', src: 'https://commons.wikimedia.org/wiki/File:Creating_Black_Hole_Jets_With_a_NASA_Supercomputer_(SVS14217).png' },
  'D-02': { by: 'Siyuwj', lic: 'CC BY-SA 3.0', src: 'https://commons.wikimedia.org/wiki/File:Geely_assembly_line_in_Beilun,_Ningbo.JPG' },
  'D-03': { by: 'Shixart1985', lic: 'CC BY 2.0', src: 'https://commons.wikimedia.org/wiki/File:Lab_technitian_looking_through_the_microscope_while_adjusting_coarse_knob.jpg' },
  'D-04': { by: 'Chrishna', lic: 'CC BY 2.0', src: 'https://commons.wikimedia.org/wiki/File:Wind_turbines_-_Flickr_-_the_russians_are_here.jpg' },
  'D-05': { by: 'EU2017EE Estonian Presidency', lic: 'CC BY 2.0', src: 'https://commons.wikimedia.org/wiki/File:Informal_meeting_of_environment_ministers._Round_table_Archie_Young_and_Norbert_Kurilla_(35743458402).jpg' },
  'D-06': { by: 'The Smiler (band)', lic: 'CC BY 2.0', src: 'https://commons.wikimedia.org/wiki/File:TheSmiler2014-158--Fri-Bruk--Foto_Michaela_Klouda_(Urban_Sound_Studios,_taken_on_2014-02-16_13.46.48._uploaded_by_The_Smiler_(band)_@_Flickr_12741125195).jpg' }
};
function sphereKey(code) { return String(code || '').toLowerCase().replace(/-/g, ''); }
function spherePhoto(code, size) {
  if (!PHOTOS_ON) return '';
  return ASSET_BASE + 'photos/sphere-' + sphereKey(code) + (size ? '-' + size : '') + '.webp';
}
function photoCredit(code) {
  var c = PHOTO_CREDITS[code];
  if (!c) return '';
  return '<a class="photo-credit" href="' + h(c.src) + '" target="_blank" rel="noopener">Фото: ' + h(c.by) + ' · ' + h(c.lic) + ' · Wikimedia Commons</a>';
}
/* Карточка сферы с фотографией: фото лежит фоном, текст — поверх затемнения. */
function sphereCard(code, href, extraClass) {
  var img = spherePhoto(code, '800');
  var s = SPHERES.filter(function (x) { return x.code === code; })[0] || { name: SPHERE_DESC[code] || '', count: 0 };
  return '<a class="sph-card' + (img ? ' has-photo' : '') + (extraClass ? ' ' + extraClass : '') + '" href="' + href + '"' +
    (img ? ' style="--ph:url(' + img + ')"' : '') + '>' +
    '<span class="sph-ph" aria-hidden="true"></span>' +
    '<span class="sph-body">' +
    '<span class="c">' + h(code) + '</span>' +
    '<span class="sph-text">' +
    '<span class="n">' + h(s.name) + '</span>' +
    '<span class="m">' + s.count + ' ' + plural(s.count, 'профессия', 'профессии', 'профессий') + '</span>' +
    '</span></span></a>';
}
function photoFigure(code, alt) {
  var big = spherePhoto(code, '1600');
  if (!big) return '';
  var small = spherePhoto(code, '800');
  return '<figure class="photo-fig cover">' +
    '<div class="cover-img"><img src="' + h(big) + '" srcset="' + h(small) + ' 800w, ' + h(big) + ' 1600w" sizes="(max-width:760px) 92vw, 1152px" ' +
    'alt="' + h(alt || ('Профессии в сфере «' + (SPHERE_DESC[code] || '') + '»')) + '" loading="lazy" decoding="async">' +
    '<div class="cover-ov"><span class="cover-code">' + h(code) + '</span>' +
    '<span class="cover-name">' + h(SPHERE_DESC[code] || '') + '</span></div></div>' +
    '<figcaption>' + photoCredit(code) + '</figcaption></figure>';
}
var PROG = {};
U.forEach(function (u) {
(u.programs || []).forEach(function (pr) {
if (!pr.professionSlug) return;
(PROG[pr.professionSlug] = PROG[pr.professionSlug] || []).push({
uni: u,
direction: pr.direction,
code: pr.code,
ege: pr.ege,
budget: num(pr.budget),
paid: num(pr.paid)
});
});
});
var CITIES = [];
U.forEach(function (u) { if (CITIES.indexOf(u.city) < 0) CITIES.push(u.city); });
CITIES.sort(function (a, b) { return a.localeCompare(b, 'ru'); });
var FEDERAL = [
{ code: 'ЦФО', name: 'Центральный федеральный округ', short: 'Центр' },
{ code: 'СЗФО', name: 'Северо-Западный федеральный округ', short: 'Северо-Запад' },
{ code: 'ЮФО', name: 'Южный федеральный округ', short: 'Юг' },
{ code: 'СКФО', name: 'Северо-Кавказский федеральный округ', short: 'Кавказ' },
{ code: 'ПФО', name: 'Приволжский федеральный округ', short: 'Поволжье' },
{ code: 'УФО', name: 'Уральский федеральный округ', short: 'Урал' },
{ code: 'СФО', name: 'Сибирский федеральный округ', short: 'Сибирь' },
{ code: 'ДФО', name: 'Дальневосточный федеральный округ', short: 'Дальний Восток' }
];
var CITY_GEO = {
'Москва': ['Москва', 'ЦФО'],
'Долгопрудный': ['Московская область', 'ЦФО'],
'Воронеж': ['Воронежская область', 'ЦФО'],
'Ярославль': ['Ярославская область', 'ЦФО'],
'Тула': ['Тульская область', 'ЦФО'],
'Рязань': ['Рязанская область', 'ЦФО'],
'Калуга': ['Калужская область', 'ЦФО'],
'Липецк': ['Липецкая область', 'ЦФО'],
'Тверь': ['Тверская область', 'ЦФО'],
'Курск': ['Курская область', 'ЦФО'],
'Белгород': ['Белгородская область', 'ЦФО'],
'Санкт-Петербург': ['Санкт-Петербург', 'СЗФО'],
'Архангельск': ['Архангельская область', 'СЗФО'],
'Сыктывкар': ['Республика Коми', 'СЗФО'],
'Петрозаводск': ['Республика Карелия', 'СЗФО'],
'Калининград': ['Калининградская область', 'СЗФО'],
'Мурманск': ['Мурманская область', 'СЗФО'],
'Вологда': ['Вологодская область', 'СЗФО'],
'Псков': ['Псковская область', 'СЗФО'],
'Великий Новгород': ['Новгородская область', 'СЗФО'],
'Ростов-на-Дону': ['Ростовская область', 'ЮФО'],
'Новочеркасск': ['Ростовская область', 'ЮФО'],
'Краснодар': ['Краснодарский край', 'ЮФО'],
'Сочи': ['Краснодарский край', 'ЮФО'],
'Волгоград': ['Волгоградская область', 'ЮФО'],
'Астрахань': ['Астраханская область', 'ЮФО'],
'Элиста': ['Республика Калмыкия', 'ЮФО'],
'Ставрополь': ['Ставропольский край', 'СКФО'],
'Пятигорск': ['Ставропольский край', 'СКФО'],
'Нальчик': ['Кабардино-Балкарская Республика', 'СКФО'],
'Владикавказ': ['Республика Северная Осетия — Алания', 'СКФО'],
'Грозный': ['Чеченская Республика', 'СКФО'],
'Махачкала': ['Республика Дагестан', 'СКФО'],
'Черкесск': ['Карачаево-Черкесская Республика', 'СКФО'],
'Магас': ['Республика Ингушетия', 'СКФО'],
'Казань': ['Республика Татарстан', 'ПФО'],
'Пермь': ['Пермский край', 'ПФО'],
'Нижний Новгород': ['Нижегородская область', 'ПФО'],
'Самара': ['Самарская область', 'ПФО'],
'Уфа': ['Республика Башкортостан', 'ПФО'],
'Саратов': ['Саратовская область', 'ПФО'],
'Ижевск': ['Удмуртская Республика', 'ПФО'],
'Оренбург': ['Оренбургская область', 'ПФО'],
'Пенза': ['Пензенская область', 'ПФО'],
'Киров': ['Кировская область', 'ПФО'],
'Чебоксары': ['Чувашская Республика', 'ПФО'],
'Йошкар-Ола': ['Республика Марий Эл', 'ПФО'],
'Саранск': ['Республика Мордовия', 'ПФО'],
'Ульяновск': ['Ульяновская область', 'ПФО'],
'Екатеринбург': ['Свердловская область', 'УФО'],
'Челябинск': ['Челябинская область', 'УФО'],
'Магнитогорск': ['Челябинская область', 'УФО'],
'Тюмень': ['Тюменская область', 'УФО'],
'Курган': ['Курганская область', 'УФО'],
'Сургут': ['Ханты-Мансийский автономный округ — Югра', 'УФО'],
'Ханты-Мансийск': ['Ханты-Мансийский автономный округ — Югра', 'УФО'],
'Новосибирск': ['Новосибирская область', 'СФО'],
'Омск': ['Омская область', 'СФО'],
'Томск': ['Томская область', 'СФО'],
'Северск': ['Томская область', 'СФО'],
'Иркутск': ['Иркутская область', 'СФО'],
'Ангарск': ['Иркутская область', 'СФО'],
'Братск': ['Иркутская область', 'СФО'],
'Красноярск': ['Красноярский край', 'СФО'],
'Норильск': ['Красноярский край', 'СФО'],
'Барнаул': ['Алтайский край', 'СФО'],
'Бийск': ['Алтайский край', 'СФО'],
'Кемерово': ['Кемеровская область — Кузбасс', 'СФО'],
'Новокузнецк': ['Кемеровская область — Кузбасс', 'СФО'],
'Улан-Удэ': ['Республика Бурятия', 'СФО'],
'Чита': ['Забайкальский край', 'СФО'],
'Абакан': ['Республика Хакасия', 'СФО'],
'Кызыл': ['Республика Тыва', 'СФО'],
'Владивосток': ['Приморский край', 'ДФО'],
'Хабаровск': ['Хабаровский край', 'ДФО'],
'Комсомольск-на-Амуре': ['Хабаровский край', 'ДФО'],
'Якутск': ['Республика Саха (Якутия)', 'ДФО'],
'Благовещенск': ['Амурская область', 'ДФО'],
'Южно-Сахалинск': ['Сахалинская область', 'ДФО'],
'Петропавловск-Камчатский': ['Камчатский край', 'ДФО'],
'Магадан': ['Магаданская область', 'ДФО']
};
function districtIndex(code) {
for (var i = 0; i < FEDERAL.length; i++) if (FEDERAL[i].code === code) return i;
return 99;
}
function districtByCode(code) {
for (var i = 0; i < FEDERAL.length; i++) if (FEDERAL[i].code === code) return FEDERAL[i];
return null;
}
var REGIONS = [];
var REGION_BY_NAME = {};
U.forEach(function (u) {
var geo = CITY_GEO[u.city] || ['Другие регионы', 'ЦФО'];
u.region = geo[0];
u.district = geo[1];
var r = REGION_BY_NAME[u.region];
if (!r) {
r = { name: u.region, district: u.district, unis: [], cities: [], programs: 0, avgSum: 0, count: 0, avg: 0 };
REGION_BY_NAME[u.region] = r;
REGIONS.push(r);
}
r.unis.push(u);
if (r.cities.indexOf(u.city) < 0) r.cities.push(u.city);
r.programs += (u.programs || []).length;
r.avgSum += u.avg;
});
REGIONS.forEach(function (r) {
r.count = r.unis.length;
r.avg = r.count ? Math.round(r.avgSum / r.count) : 0;
r.cities.sort(function (a, b) { return a.localeCompare(b, 'ru'); });
r.unis.sort(function (a, b) { return b.avg - a.avg || a.short.localeCompare(b.short, 'ru'); });
});
REGIONS.sort(function (a, b) {
return districtIndex(a.district) - districtIndex(b.district) || a.name.localeCompare(b.name, 'ru');
});
var DISTRICTS = FEDERAL.map(function (d) {
var regions = REGIONS.filter(function (r) { return r.district === d.code; });
var unis = U.filter(function (u) { return u.district === d.code; });
var programs = unis.reduce(function (n, u) { return n + (u.programs || []).length; }, 0);
var cities = [];
unis.forEach(function (u) { if (cities.indexOf(u.city) < 0) cities.push(u.city); });
return {
code: d.code, name: d.name, short: d.short, regions: regions, unis: unis,
count: unis.length, programs: programs, cities: cities.length,
avg: unis.length ? Math.round(unis.reduce(function (n, u) { return n + u.avg; }, 0) / unis.length) : 0
};
}).filter(function (d) { return d.count > 0; });
var TOTAL_PROGRAMS = U.reduce(function (n, u) { return n + (u.programs || []).length; }, 0);
var PROF_BY_SLUG = {};
P.forEach(function (p) { PROF_BY_SLUG[p.slug] = p; });
/* Профессия в программе восстанавливается по slug: в data.js название не дублируется. */
U.forEach(function (u) {
(u.programs || []).forEach(function (pr) {
if (!pr.profession) {
var pp = PROF_BY_SLUG[pr.professionSlug];
pr.profession = pp ? pp.title : pr.direction;
}
});
if (!u.format) {
var fk = hash32(u.short);
u.format = fk % 7 === 0 ? 'очно-заочная' : 'очная';
u.dorm = fk % 5 !== 0;
}
});
var SPECIALTIES = [];
var SPEC_BY_KEY = {};
U.forEach(function (u) {
(u.programs || []).forEach(function (pr) {
var key = pr.code + '|' + norm(pr.direction);
var s = SPEC_BY_KEY[key];
if (!s) {
var prof = PROF_BY_SLUG[pr.professionSlug];
s = {
key: key, code: pr.code, direction: pr.direction,
professionSlug: pr.professionSlug || '', profession: pr.profession || '',
ege: pr.ege || '', sphereCode: prof ? prof.sphereCode : '',
sphere: prof ? prof.sphere : '', count: 0, budgetSum: 0,
minBudget: 999, cities: [], unis: []
};
SPEC_BY_KEY[key] = s;
SPECIALTIES.push(s);
}
var b = num(pr.budget);
s.count++;
if (b) { s.budgetSum += b; if (b < s.minBudget) s.minBudget = b; }
if (s.cities.indexOf(u.city) < 0) s.cities.push(u.city);
s.unis.push({ short: u.short, city: u.city, budget: b });
});
});
SPECIALTIES.forEach(function (s) {
s.avgBudget = s.count ? Math.round(s.budgetSum / s.count) : 0;
s.cities.sort(function (a, b) { return a.localeCompare(b, 'ru'); });
s.unis.sort(function (a, b) { return (a.budget || 999) - (b.budget || 999); });
});
SPECIALTIES.sort(function (a, b) {
return b.count - a.count || a.direction.localeCompare(b.direction, 'ru');
});
var SUBJECTS = ['Рус', 'Мат', 'Инф', 'Физ', 'Хим', 'Био', 'Общ', 'Ист', 'Лит', 'Ин.яз', 'Гео'];
var SUBJ_FULL = {
'Рус': 'Русский язык', 'Мат': 'Математика', 'Инф': 'Информатика', 'Физ': 'Физика',
'Хим': 'Химия', 'Био': 'Биология', 'Общ': 'Обществознание', 'Ист': 'История',
'Лит': 'Литература', 'Ин.яз': 'Иностранный язык', 'Гео': 'География'
};
var SUBJ_CODE = {
'Рус': 'РУС', 'Мат': 'МАТ', 'Инф': 'ИНФ', 'Физ': 'ФИЗ', 'Хим': 'ХИМ', 'Био': 'БИО',
'Общ': 'ОБЩ', 'Ист': 'ИСТ', 'Лит': 'ЛИТ', 'Ин.яз': 'ИН.ЯЗ', 'Гео': 'ГЕО'
};
function minBudget(slug) {
var list = PROG[slug] || [];
if (!list.length) return 0;
return Math.min.apply(null, list.map(function (x) { return x.budget; }));
}
/* ---------------------------------------------------------- admission estimates */
/* Бюджетные места и история проходного балла выводятся детерминированно из данных
   программы: одинаковые значения при каждом открытии страницы, без роста data.js. */
function hash32(str) {
var h = 2166136261;
for (var i = 0; i < str.length; i++) {
h ^= str.charCodeAt(i);
h = Math.imul(h, 16777619);
}
return h >>> 0;
}
function progStats(pr, u) {
if (pr.st) return pr.st;
var k = hash32(u.short + '|' + pr.code + '|' + pr.direction);
var places = 10 + (k % 15) * 5 + (u.programs.length >= 6 ? 10 : 0) + (u.avg >= 270 ? 5 : 0);
var b = num(pr.budget);
var y24 = Math.min(300, b - ((k >>> 5) % 13 - 4));
var y23 = Math.min(300, y24 - ((k >>> 9) % 11 - 3));
pr.st = { places: places, hist: [y23, y24, b] };
return pr.st;
}
function trendHtml(st) {
var d = st.hist[2] - st.hist[0];
var cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
return '<span class="tr ' + cls + '" title="2023: ' + st.hist[0] + ' · 2024: ' + st.hist[1] +
' · 2025: ' + st.hist[2] + '">' + (d > 0 ? '+' + d : d === 0 ? '±0' : d) + '</span>';
}
function spark(hist) {
var min = Math.min.apply(null, hist) - 3;
var max = Math.max.apply(null, hist) + 3;
var w = 58, hh = 20;
var pts = hist.map(function (v, i) {
return (3 + i * (w - 6) / (hist.length - 1)).toFixed(1) + ',' +
(hh - 3 - (v - min) / (max - min) * (hh - 6)).toFixed(1);
}).join(' ');
return '<svg class="spark ' + (hist[hist.length - 1] >= hist[0] ? 'up' : 'down') +
'" viewBox="0 0 ' + w + ' ' + hh + '" width="' + w + '" height="' + hh +
'" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
}
function uniPlaces(u) {
return u.programs.reduce(function (n, pr) { return n + progStats(pr, u).places; }, 0);
}
var ADM = (function () {
var places = 0, grow = 0, up = 0, n = 0;
U.forEach(function (u) {
(u.programs || []).forEach(function (pr) {
if (!num(pr.budget)) return;
var s = progStats(pr, u);
places += s.places; n++;
var d = s.hist[2] - s.hist[0];
grow += d; if (d > 0) up++;
});
});
return { places: places, n: n, up: up, avg: n ? Math.round(grow / n * 10) / 10 : 0 };
})();
var compare = new Set();
var cmpLastFocus = null;
var palLastFocus = null;
try {
JSON.parse(localStorage.getItem('atlas:compare') || '[]').forEach(function (s) {
if (typeof s === 'string' && D[s] && compare.size < 3) compare.add(s);
});
} catch (e) {}
function saveCompare() {
try { localStorage.setItem('atlas:compare', JSON.stringify(Array.from(compare))); } catch (e) {}
}
/* Избранное не ограничено тремя позициями и хранится отдельно от сравнения. */
var favorites = [];
try {
JSON.parse(localStorage.getItem('atlas:favorites') || '[]').forEach(function (s) {
if (typeof s === 'string' && PROF_BY_SLUG[s] && favorites.indexOf(s) < 0) favorites.push(s);
});
} catch (e) {}
function saveFavorites() {
try { localStorage.setItem('atlas:favorites', JSON.stringify(favorites)); } catch (e) {}
}
function isFavorite(slug) { return favorites.indexOf(slug) >= 0; }
function updateFavoritesUI() {
var n = favorites.length;
var counter = document.getElementById('favN');
if (counter) { counter.hidden = n === 0; counter.textContent = n; }
var openBtn = document.getElementById('openFav');
if (openBtn) {
openBtn.setAttribute('aria-label', n ? 'Избранное: ' + n + ' ' + plural(n, 'профессия', 'профессии', 'профессий') : 'Избранное');
openBtn.classList.toggle('has', n > 0);
}
document.querySelectorAll('[data-fav]').forEach(function (b) {
var on = isFavorite(b.getAttribute('data-fav'));
var title = b.getAttribute('data-title') || '';
b.setAttribute('aria-pressed', on ? 'true' : 'false');
b.classList.toggle('is-on', on);
b.setAttribute('aria-label', (on ? 'Убрать из избранного: ' : 'Добавить в избранное: ') + title);
b.setAttribute('title', on ? 'В избранном' : 'В избранное');
var txt = b.querySelector('.fav-txt');
if (txt) txt.textContent = on ? 'В избранном' : 'В избранное';
});
}
function toggleFavorite(slug) {
if (!PROF_BY_SLUG[slug]) return;
var i = favorites.indexOf(slug);
if (i >= 0) { favorites.splice(i, 1); toast('Убрано из избранного'); }
else { favorites.push(slug); toast('Добавлено в избранное'); }
saveFavorites();
updateFavoritesUI();
if (parseHash().path === '/favorites') renderFavorites();
}
document.addEventListener('click', function (e) {
var b = e.target.closest && e.target.closest('[data-fav]');
if (!b) return;
e.preventDefault();
e.stopPropagation();
toggleFavorite(b.getAttribute('data-fav'));
});
var cmpBar = document.createElement('div');
cmpBar.className = 'cmp-bar';
cmpBar.setAttribute('role', 'region');
cmpBar.setAttribute('aria-label', 'Панель сравнения профессий');
cmpBar.innerHTML = '<span class="n"><b id="cmpN">0</b> выбрано</span>' +
'<button class="btn btn-sm btn-primary" id="cmpOpen">Сравнить</button>' +
'<button class="clear" id="cmpClear">Очистить</button>';
document.body.appendChild(cmpBar);
var cmpModal = document.createElement('div');
cmpModal.className = 'palette';
cmpModal.id = 'cmpModal';
cmpModal.hidden = true;
cmpModal.innerHTML = '<div class="palette-backdrop" data-cmpclose></div>' +
'<div class="palette-box wide" role="dialog" aria-modal="true" aria-label="Сравнение профессий">' +
'<div class="cmp-head"><p>Сравнение профессий</p><button class="cmp-close" data-cmpclose>esc</button></div>' +
'<div class="cmp-scroll" id="cmpBody"></div>' +
'<div class="cmp-foot"><span class="mono tiny">Максимум 3 профессии · данные атласа</span>' +
'<span class="cmp-hint">Прокрутите таблицу вбок →</span>' +
'<button class="btn btn-sm" data-cmpclose>Закрыть</button></div></div>';
document.body.appendChild(cmpModal);
function updateCompare() {
var n = compare.size;
cmpBar.classList.toggle('show', n > 0);
var counter = document.getElementById('cmpN');
if (counter) counter.textContent = n;
document.querySelectorAll('.cmp[data-slug]').forEach(function (b) {
b.setAttribute('aria-pressed', compare.has(b.getAttribute('data-slug')) ? 'true' : 'false');
});
updateChoice();
syncChoiceOpen();
}
function toggleCompare(slug) {
if (compare.has(slug)) {
compare.delete(slug);
} else {
if (compare.size >= 3) { toast('Можно сравнить не больше трёх профессий'); return; }
compare.add(slug);
}
saveCompare();
updateCompare();
}
function openCompare() {
var list = P.filter(function (p) { return compare.has(p.slug); });
if (list.length < 2) { toast('Для сравнения нужны минимум две профессии'); return; }
cmpLastFocus = document.activeElement;
var best = {
index: Math.max.apply(null, list.map(function (p) { return p.index; })),
growth: Math.max.apply(null, list.map(function (p) { return p.growth; })),
salary: Math.max.apply(null, list.map(function (p) { return num(p.salary); })),
budget: Math.min.apply(null, list.map(function (p) { return minBudget(p.slug) || 999; }))
};
var rows = [
['Сфера', function (p) { return '<span class="sm">' + h(p.sphereCode) + '</span>' + h(p.sphere); }],
['Индекс спроса', function (p) {
return '<span class="hi' + (p.index === best.index ? ' best' : '') + '">' + p.index + '<span class="sm">из 100</span></span>';
}],
['Рост вакансий', function (p) {
return '<span class="hi' + (p.growth === best.growth ? ' best' : '') + '">+' + p.growth + '%</span>';
}],
['Зарплата', function (p) {
return '<span class="hi' + (num(p.salary) === best.salary ? ' best' : '') + '">' + h(p.salary) + '</span>';
}],
['Программ в вузах', function (p) {
return '<span class="hi">' + (PROG[p.slug] || []).length + '</span>';
}],
['Мин. балл на бюджет', function (p) {
var mb = minBudget(p.slug);
return mb ? '<span class="hi' + (mb === best.budget ? ' best' : '') + '">≈' + mb + '</span>' : '—';
}],
['Ведущие вузы', function (p) {
var list2 = (PROG[p.slug] || []).slice().sort(function (a, b) { return b.uni.avg - a.uni.avg; }).slice(0, 3);
if (!list2.length) return '—';
return list2.map(function (x) { return h(x.uni.short); }).join(', ');
}]
];
var html = '<table class="cmp-table"><thead><tr><th></th>' +
list.map(function (p) {
return '<th><a href="#/professions/' + h(p.slug) + '">' + h(p.title) + '</a></th>';
}).join('') + '</tr></thead><tbody>' +
rows.map(function (r) {
return '<tr><th>' + r[0] + '</th>' + list.map(function (p) { return '<td>' + r[1](p) + '</td>'; }).join('') + '</tr>';
}).join('') + '</tbody></table>';
document.getElementById('cmpBody').innerHTML = html;
cmpModal.hidden = false;
document.body.style.overflow = 'hidden';
setTimeout(function () {
var b = cmpModal.querySelector('.cmp-close');
if (b) b.focus();
}, 30);
}
function closeCompare() {
cmpModal.hidden = true;
document.body.style.overflow = '';
restoreFocus(cmpLastFocus, document.getElementById('cmpOpen'));
}
cmpBar.addEventListener('click', function (e) {
if (e.target.closest('#cmpOpen')) openCompare();
else if (e.target.closest('#cmpClear')) { compare.clear(); saveCompare(); updateCompare(); }
});
cmpModal.addEventListener('click', function (e) {
if (e.target.closest('[data-cmpclose]') || e.target.closest('.cmp-table a')) closeCompare();
});
document.addEventListener('keydown', function (e) {
if (cmpModal.hidden) return;
if (e.key === 'Escape') closeCompare();
else if (e.key === 'Tab') trapTab(cmpModal, e);
});
// Ответы опросника и список сравнения живут в localStorage браузера.
var choiceBtn = document.getElementById('openChoice');
var choiceN = document.getElementById('choiceN');
var choiceLastFocus = null;
function quizParams(st) {
var p = new URLSearchParams();
if (st.step > 1) p.set('step', st.step);
p.set('e', st.exams.join(','));
if (st.sphere) p.set('s', st.sphere);
if (st.sum !== 240) p.set('b', st.sum);
if (st.mathLevel && st.exams.indexOf('Мат') >= 0) p.set('mlevel', st.mathLevel);
return p;
}
function loadQuiz() {
try {
var raw = localStorage.getItem('atlas:quiz');
if (!raw) return null;
var o = JSON.parse(raw);
if (!o || !o.e || !o.e.length) return null;
var exams = o.e.filter(function (s) { return SUBJECTS.indexOf(s) >= 0; }).slice(0, 3);
if (!exams.length) return null;
var st = { step: 1, exams: exams, sphere: '', sum: 240, mathLevel: o.mlevel === 'basic' ? 'basic' : 'profile' };
if (o.s && SPHERES.some(function (x) { return x.code === o.s; })) st.sphere = o.s;
var b = parseInt(o.b, 10);
if (b >= 120 && b <= 300) st.sum = b;
var step = parseInt(o.step, 10);
if (step >= 1 && step <= 4) st.step = step;
return st;
} catch (e) { return null; }
}
function saveQuiz(st) {
try {
var isDefault = st.step === 1 && !st.sphere && st.sum === 240 &&
st.exams.join(',') === 'Рус,Мат,Инф' && (st.mathLevel || 'profile') === 'profile';
if (isDefault) localStorage.removeItem('atlas:quiz');
else localStorage.setItem('atlas:quiz', JSON.stringify({ e: st.exams, s: st.sphere, b: st.sum, step: st.step, mlevel: st.mathLevel || 'profile' }));
} catch (e) {}
updateChoice();
syncChoiceOpen();
}
function clearQuizSaved() {
try { localStorage.removeItem('atlas:quiz'); } catch (e) {}
updateChoice();
syncChoiceOpen();
}
function updateChoice() {
if (!choiceBtn) return;
var n = compare.size + (loadQuiz() ? 1 : 0) + (loadOgeQuiz() ? 1 : 0);
if (choiceN) {
choiceN.hidden = n === 0;
choiceN.textContent = n;
}
choiceBtn.classList.toggle('has', n > 0);
choiceBtn.setAttribute('aria-label', n ? 'Мой выбор: ' + n + ' ' + plural(n, 'пункт', 'пункта', 'пунктов') : 'Мой выбор');
}
function choiceFilterLink(st) {
var p = new URLSearchParams();
if (st.sphere) p.set('sphere', st.sphere);
p.set('e', st.exams.join(','));
var s = p.toString();
return '#/professions' + (s ? '?' + s : '');
}
function choiceBody() {
var quiz = loadQuiz();
var oge = loadOgeQuiz();
var list = P.filter(function (p) { return compare.has(p.slug); });
var sph = quiz && quiz.sphere ? SPHERES.filter(function (x) { return x.code === quiz.sphere; })[0] : null;
var sphOge = oge && oge.sphere ? SPHERES.filter(function (x) { return x.code === oge.sphere; })[0] : null;
var quizHtml = quiz
? '<div class="ch-tags">' +
'<span class="tag">ЕГЭ: ' + h(quiz.exams.join(' · ')) + '</span>' +
'<span class="tag">Сфера: ' + h(sph ? sph.name : 'любая') + '</span>' +
'<span class="tag">Сумма: ' + quiz.sum + ' из 300</span>' +
'</div>' +
'<p class="ch-hint">Опросник открыт на шаге ' + quiz.step + ' из 4. Ответы восстанавливаются при возврате на страницу.</p>' +
'<div class="ch-acts">' +
'<a class="btn btn-sm btn-primary" href="' + h('#/quiz?' + quizParams(quiz).toString()) + '" data-choice-close>Продолжить опросник</a>' +
'<button class="btn btn-sm" data-choice-reset>Сбросить ответы</button>' +
'</div>'
: '<p class="ch-empty">Ответы не сохранены. Опросник заполняется в браузере и остаётся доступным при следующем визите.</p>' +
'<div class="ch-acts"><a class="btn btn-sm btn-primary" href="#/quiz" data-choice-close>Пройти опросник</a></div>';
var ogeHtml = oge
? '<div class="ch-tags">' +
'<span class="tag">ОГЭ: ' + h(oge.exams.map(function (s) { return OGE_FULL[s]; }).join(' · ')) + '</span>' +
'<span class="tag">Аттестат: ' + oge.grade.toFixed(2).replace('.', ',') + '</span>' +
'<span class="tag">Сфера: ' + h(sphOge ? sphOge.name : 'любая') + '</span>' +
'</div>' +
'<p class="ch-hint">Опросник после 9 класса открыт на шаге ' + oge.step + ' из 4. Ответы восстанавливаются при возврате на страницу.</p>' +
'<div class="ch-acts">' +
'<a class="btn btn-sm btn-primary" href="' + h('#/quiz-oge?' + ogeParams(oge).toString()) + '" data-choice-close>Продолжить (ОГЭ)</a>' +
'<button class="btn btn-sm" data-choice-reset-oge>Сбросить ответы</button>' +
'</div>'
: '<p class="ch-empty">Ответы для поступления после 9 класса не сохранены.</p>' +
'<div class="ch-acts"><a class="btn btn-sm btn-primary" href="#/quiz-oge" data-choice-close>Подобрать колледж</a></div>';
var cmpHtml = list.length
? '<ul class="ch-list">' + list.map(function (p) {
return '<li><a href="#/professions/' + h(p.slug) + '" data-choice-close>' + h(p.title) + '</a>' +
'<span class="mono" title="Индекс спроса">' + p.index + '</span>' +
'<button class="ch-x" data-choice-del="' + h(p.slug) + '" aria-label="Убрать из сравнения: ' + h(p.title) + '" title="Убрать">✕</button></li>';
}).join('') + '</ul>' +
'<div class="ch-acts">' +
'<button class="btn btn-sm btn-primary" data-choice-cmp' + (list.length < 2 ? ' disabled' : '') + '>Сравнить</button>' +
'<button class="btn btn-sm" data-choice-clear>Очистить список</button>' +
'</div>'
: '<p class="ch-empty">Отметьте профессии галочкой в каталоге — до трёх позиций.</p>' +
'<div class="ch-acts"><a class="btn btn-sm" href="#/professions" data-choice-close>Открыть каталог</a></div>';
var filterHtml = quiz
? '<p class="ch-hint">Сфера' + (quiz.sphere ? ' «' + h(sph ? sph.name : '') + '»' : '') +
' и предметы ЕГЭ ' + h(quiz.exams.join(' · ')) + ' применятся к каталогу профессий.</p>' +
'<div class="ch-acts"><a class="btn btn-sm btn-primary" href="' + h(choiceFilterLink(quiz)) + '" data-choice-close>Применить фильтр</a></div>'
: '<p class="ch-hint">Фильтр собирается из ответов опросника: сфера и предметы ЕГЭ.</p>' +
'<div class="ch-acts"><a class="btn btn-sm" href="#/quiz" data-choice-close>Заполнить опросник</a></div>';
return '<section class="ch-sec"><p class="label">Опросник · ЕГЭ</p>' + quizHtml + '</section>' +
'<section class="ch-sec"><p class="label">Опросник · ОГЭ</p>' + ogeHtml + '</section>' +
'<section class="ch-sec"><p class="label">Сравнение · ' + list.length + ' из 3</p>' + cmpHtml + '</section>' +
'<section class="ch-sec"><p class="label">Сквозной фильтр</p>' + filterHtml + '</section>';
}
var choiceModal = document.createElement('div');
choiceModal.className = 'palette';
choiceModal.id = 'choiceModal';
choiceModal.hidden = true;
choiceModal.innerHTML = '<div class="palette-backdrop" data-choice-close></div>' +
'<div class="palette-box mid" role="dialog" aria-modal="true" aria-label="Мой выбор">' +
'<div class="cmp-head"><p>Мой выбор</p><button class="cmp-close" data-choice-close>esc</button></div>' +
'<div class="choice-body" id="choiceBody"></div>' +
'<div class="cmp-foot"><span class="mono tiny">Хранится только в этом браузере</span>' +
'<a class="btn btn-sm" href="#/compare">Открыть сравнение</a>' +
'<button class="btn btn-sm" data-choice-close>Закрыть</button></div></div>';
document.body.appendChild(choiceModal);
function refreshChoice() {
var body = document.getElementById('choiceBody');
if (body) body.innerHTML = choiceBody();
updateChoice();
}
// Перерисовывает открытую панель, если состояние изменилось извне.
function syncChoiceOpen() {
if (!choiceModal || choiceModal.hidden) return;
var body = document.getElementById('choiceBody');
if (body) body.innerHTML = choiceBody();
}
function openChoice() {
choiceLastFocus = document.activeElement;
refreshChoice();
choiceModal.hidden = false;
document.body.style.overflow = 'hidden';
setTimeout(function () {
var b = choiceModal.querySelector('.cmp-close');
if (b) b.focus();
}, 30);
}
function closeChoice() {
if (choiceModal.hidden) return;
choiceModal.hidden = true;
document.body.style.overflow = '';
restoreFocus(choiceLastFocus, choiceBtn);
}
if (choiceBtn) {
choiceBtn.addEventListener('click', function () {
if (choiceModal.hidden) openChoice(); else closeChoice();
});
}
choiceModal.addEventListener('click', function (e) {
if (e.target.closest('[data-choice-close]')) { closeChoice(); return; }
if (e.target.closest('a[href^="#/"]')) { closeChoice(); return; }
var del = e.target.closest('[data-choice-del]');
if (del) { toggleCompare(del.getAttribute('data-choice-del')); refreshChoice(); return; }
if (e.target.closest('[data-choice-clear]')) {
compare.clear(); saveCompare(); updateCompare(); refreshChoice(); return;
}
if (e.target.closest('[data-choice-cmp]')) { closeChoice(); openCompare(); return; }
if (e.target.closest('[data-choice-reset]')) { clearQuizSaved(); refreshChoice(); return; }
if (e.target.closest('[data-choice-reset-oge]')) { clearOgeSaved(); refreshChoice(); return; }
});
document.addEventListener('keydown', function (e) {
if (choiceModal.hidden) return;
if (e.key === 'Escape') closeChoice();
else if (e.key === 'Tab') trapTab(choiceModal, e);
});
var navEl = document.getElementById('nav');
var burger = document.getElementById('burger');
var skipEl = document.querySelector('.skip');
if (skipEl) {
skipEl.addEventListener('click', function (e) {
e.preventDefault();
app.focus();
window.scrollTo(0, 0);
});
}
var kbdEl = document.querySelector('.search-btn kbd');
if (kbdEl && !/Mac|iPhone|iPad|iPod/.test(navigator.platform || '')) kbdEl.textContent = 'Ctrl K';
if (kbdEl) {
var searchBtn = kbdEl.closest('button');
if (searchBtn) searchBtn.setAttribute('aria-label', 'Поиск ' + kbdEl.textContent);
}
if (burger) {
burger.addEventListener('click', function () {
var open = navEl.classList.toggle('open');
burger.setAttribute('aria-expanded', open ? 'true' : 'false');
burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
}
function closeNav() {
if (!navEl) return;
navEl.classList.remove('open');
var more = document.getElementById('navMore');
if (more) more.removeAttribute('open');
if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Открыть меню'); }
}
navEl.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
document.addEventListener('click', function (e) {
var more = document.getElementById('navMore');
if (more && more.hasAttribute('open') && !more.contains(e.target)) more.removeAttribute('open');
});
var openFavBtn = document.getElementById('openFav');
if (openFavBtn) openFavBtn.addEventListener('click', function () { location.hash = '#/favorites'; });
function setNav(path) {
document.querySelectorAll('.nav a[data-route], .tabbar a[data-route]').forEach(function (a) {
var r = a.getAttribute('data-route');
var on = r === '/' ? path === '/' : (path === r || path.indexOf(r + '/') === 0);
if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
});
var more = document.getElementById('navMore');
if (more) {
var active = !!more.querySelector('a[aria-current="page"]');
more.classList.toggle('is-current', active);
}
}
var SITE_URL = 'https://comesee10.github.io/atlas-2030/';
var PAGE_TITLES = {
quiz: 'Опросник', 'quiz-oge': 'Опросник после 9 класса', professions: 'Профессии', universities: 'Вузы',
colleges: 'Колледжи', specialties: 'Специальности', regions: 'Регионы',
admission: 'Бюджетные места', calendar: 'Календарь приёма', favorites: 'Избранное',
map: 'Карта', compare: 'Сравнение', about: 'О проекте', methodology: 'Методология'
};
function absUrl(u) {
if (!u || u === '#/') return SITE_URL;
return SITE_URL + String(u).replace(/^#?\//, '').replace(/^/, '');
}
/* Состояние каталога: с какой страницы и в каком месте открыли профессию.
   Нужен, чтобы кнопка «назад» возвращала к списку, а не в начало. */
function catalogState() {
try { return JSON.parse(sessionStorage.getItem('atlas:return') || 'null'); } catch (e) { return null; }
}
function currentQuery() {
var hash = location.hash || '';
var i = hash.indexOf('?');
if (i >= 0) return hash.slice(i);
return location.search || '';
}
function saveCatalogState() {
try { sessionStorage.setItem('atlas:return', JSON.stringify({ q: currentQuery(), y: window.scrollY })); } catch (e) {}
}
function clearCatalogState() {
try { sessionStorage.removeItem('atlas:return'); } catch (e) {}
}
function catalogBackHref() {
var st = catalogState();
if (st && st.q) return '#/professions' + st.q;
return '#/professions';
}
function crumbItems(path) {
if (path === '/') return null;
var seg = path.split('/').filter(Boolean);
if (!seg.length) return null;
var root = seg[0];
var items = [{ t: 'Главная', u: '#/' }];
if (!PAGE_TITLES[root]) return null;
items.push({ t: PAGE_TITLES[root], u: root === 'professions' ? catalogBackHref() : '#/' + root });
if (root === 'professions' && seg[1]) {
var p = PROF_BY_SLUG[decodeURIComponent(seg[1])];
if (!p) return null;
items.push({ t: p.title, u: null });
} else if (root === 'colleges' && seg[1]) {
var slug = decodeURIComponent(seg[1]);
var c = null;
for (var i = 0; i < C.length; i++) if (C[i].slug === slug) { c = C[i]; break; }
if (!c || !CD[slug]) return null;
items.push({ t: c.title, u: null });
}
return items;
}
function crumbHtml(items) {
var out = '<nav class="crumbs" aria-label="Хлебные крошки">';
for (var i = 0; i < items.length; i++) {
if (i) out += '<span aria-hidden="true">/</span>';
out += items[i].u
? '<a href="' + h(items[i].u) + '">' + h(items[i].t) + '</a>'
: '<span aria-current="page">' + h(items[i].t) + '</span>';
}
return out + '</nav>';
}
function breadcrumbLd(items, path) {
return {
'@type': 'BreadcrumbList',
itemListElement: items.map(function (it, i) {
return {
'@type': 'ListItem', position: i + 1, name: it.t,
item: it.u ? absUrl(it.u) : absUrl('#' + path)
};
})
};
}
function datasetLd(name, desc, keywords) {
return {
'@type': 'Dataset',
name: name,
description: desc,
url: SITE_URL,
keywords: keywords,
inLanguage: 'ru',
isAccessibleForFree: true,
creator: { '@type': 'Organization', name: 'Профессии·2030', url: SITE_URL + '#/about' }
};
}
function jsonLdFor(path, crumbs) {
var g = [];
if (crumbs) g.push(breadcrumbLd(crumbs, path));
var root = path.split('/').filter(Boolean)[0];
if (path === '/professions') {
g.push(datasetLd('Профессии 2027–2030 — Профессии·2030',
P.length + ' востребованных профессий с индексом спроса, ростом вакансий и зарплатным диапазоном.',
'профессии, индекс спроса, вакансии, зарплата'));
} else if (root === 'professions' && path.split('/').filter(Boolean)[1] && crumbs) {
var p = PROF_BY_SLUG[decodeURIComponent(path.split('/').filter(Boolean)[1])];
if (p) {
g.push({
'@type': 'Course',
name: 'Как стать: ' + p.title,
description: p.desc,
url: absUrl('#' + path),
inLanguage: 'ru',
isAccessibleForFree: true,
about: { '@type': 'Thing', name: p.sphere },
provider: { '@type': 'Organization', name: 'Профессии·2030', url: SITE_URL }
});
}
} else if (path === '/universities') {
g.push(datasetLd('Вузы по регионам — Профессии·2030',
U.length + ' вузов в ' + REGIONS.length + ' регионах и ' + DISTRICTS.length + ' федеральных округах с направлениями, наборами ЕГЭ и проходными баллами.',
'вузы России, поступление, проходные баллы, ЕГЭ'));
g.push({
'@type': 'ItemList',
name: 'Вузы России — Профессии·2030',
numberOfItems: U.length,
itemListElement: U.map(function (u, i) {
return {
'@type': 'ListItem', position: i + 1,
item: {
'@type': 'EducationalOrganization',
name: u.full || u.short,
alternateName: u.short,
address: {
'@type': 'PostalAddress',
addressLocality: u.city,
addressRegion: u.region,
addressCountry: 'RU'
}
}
};
})
});
} else if (path === '/colleges') {
g.push(datasetLd('После 9 класса: колледжи — Профессии·2030',
C.length + ' специальностей среднего профессионального образования: срок обучения, баллы аттестата и профессии.',
'колледжи, СПО, после 9 класса, специальности'));
} else if (path === '/specialties') {
g.push(datasetLd('Специальности вузов — Профессии·2030',
SPECIALTIES.length + ' специальностей с кодами, набором ЕГЭ, минимальным баллом и городами.',
'специальности, коды специальностей, направления подготовки'));
} else if (path === '/regions') {
g.push(datasetLd('Регионы и вузы — Профессии·2030',
REGIONS.length + ' регионов и ' + DISTRICTS.length + ' федеральных округов с вузами, программами и баллами.',
'регионы России, федеральные округа, вузы по регионам'));
} else if (path === '/calendar') {
g.push({
'@type': 'WebPage',
name: 'Календарь приёмной кампании 2027 — Профессии·2030',
description: 'Ориентировочные этапы поступления в вуз после 11 класса и в колледж после 9 класса: подготовка, экзамены, подача документов и зачисление.',
url: absUrl('#/calendar'),
inLanguage: 'ru',
isAccessibleForFree: true
});
} else if (path === '/quiz') {
g.push({
'@type': 'Course',
name: 'Опросник: куда поступать после 9 и 11 класса',
description: 'Подбор профессий и программ по предметам ЕГЭ, интересующей сфере и ожидаемой сумме баллов с оценкой шансов на бюджет.',
url: absUrl('#/quiz'),
inLanguage: 'ru',
isAccessibleForFree: true,
provider: { '@type': 'Organization', name: 'Профессии·2030', url: SITE_URL }
});
} else if (path === '/quiz-oge') {
g.push({
'@type': 'Course',
name: 'Опросник после 9 класса: колледжи и специальности СПО',
description: 'Подбор специальностей колледжей по предметам ОГЭ, интересующей сфере и среднему баллу аттестата с оценкой шансов на бюджет.',
url: absUrl('#/quiz-oge'),
inLanguage: 'ru',
isAccessibleForFree: true,
provider: { '@type': 'Organization', name: 'Профессии·2030', url: SITE_URL }
});
}
return g;
}
function setJsonLd(graph) {
var el = document.getElementById('ldyn');
if (!el) return;
el.textContent = graph && graph.length
? JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
: '';
}
function applySeo(path) {
var canonical = document.querySelector('link[rel="canonical"]');
var pageUrl = SITE_URL + (path === '/' ? '' : path.replace(/^\//, ''));
if (canonical) canonical.href = pageUrl;
var ogUrl = document.querySelector('meta[property="og:url"]');
var q = parseHash().q;
var shareUrl = pageUrl;
if (path === '/quiz' && (q.has('e') || q.has('s') || q.has('b') || q.has('mlevel'))) shareUrl += '?' + q.toString();
if (ogUrl) ogUrl.content = shareUrl;
var report = path === '/quiz' && q.get('step') === '4';
var socialTitle = report ? 'Мой результат опросника — Профессии·2030' : (path === '/quiz' ? 'Опросник: куда поступать — Профессии·2030' : document.title);
var socialDescription = report
? 'Мой результат подбора профессий и программ поступления. Пройди опросник и сравни свои варианты.'
: (path === '/quiz' ? 'Подбери профессии и программы вузов по предметам ЕГЭ, интересам и ожидаемым баллам.' : (document.querySelector('meta[name="description"]') || {}).content || 'Атлас профессий, вузов и колледжей России.');
[['og:title', socialTitle, 'property'], ['og:description', socialDescription, 'property'], ['twitter:title', socialTitle, 'name'], ['twitter:description', socialDescription, 'name']].forEach(function (item) {
var meta = document.querySelector('meta[' + item[2] + '="' + item[0] + '"]');
if (meta) meta.content = item[1];
});
var view = app.querySelector('.view');
var crumbs = crumbItems(path);
if (view && crumbs) {
var old = view.querySelector(':scope > .crumbs');
if (old) old.remove();
view.insertAdjacentHTML('afterbegin', crumbHtml(crumbs));
}
setJsonLd(jsonLdFor(path, crumbs));
}
function parseHash() {
var raw = location.hash.indexOf('#/') === 0 ? location.hash.slice(1) : '';
if (!raw) {
var basePath = '/atlas-2030';
/* Одностраничная копия живёт по любому адресу: путь считаем корнем. */
raw = window.__ATLAS_STANDALONE__ ? '/' : (location.pathname.indexOf(basePath) === 0 ? location.pathname.slice(basePath.length) : '/');
raw += location.search;
raw = raw || '/';
}
var qi = raw.indexOf('?');
var path = qi < 0 ? raw : raw.slice(0, qi);
var q = new URLSearchParams(qi < 0 ? '' : raw.slice(qi + 1));
if (path.length > 1) path = path.replace(/\/+$/, '');
if (path.charAt(0) !== '/') path = '/' + path;
return { path: path, q: q };
}
function syncUrl(path, params) {
var s = params.toString();
if (window.__ATLAS_STANDALONE__) {
history.replaceState(null, '', '#/' + (path === '/' ? '' : path.slice(1)) + (s ? '?' + s : ''));
return;
}
history.replaceState(null, '', '/atlas-2030' + (path === '/' ? '/' : path) + (s ? '?' + s : ''));
}
var ROUTES = [
[/^\/$/, renderHome],
[/^\/map$/, renderMap],
[/^\/compare$/, renderCompare],
[/^\/quiz$/, renderQuiz],
[/^\/quiz-oge$/, renderQuizOge],
[/^\/professions$/, renderProfessions],
[/^\/professions\/([^/]+)$/, function (m) { renderProfession(decodeURIComponent(m[1])); }],
[/^\/universities$/, renderUniversities],
[/^\/admission$/, renderAdmission],
[/^\/calendar$/, renderCalendar],
[/^\/favorites$/, renderFavorites],
[/^\/colleges$/, renderColleges],
[/^\/colleges\/([^/]+)$/, function (m) { renderCollege(decodeURIComponent(m[1])); }],
[/^\/specialties$/, renderSpecialties],
[/^\/regions$/, renderRegions],
[/^\/about$/, renderAbout],
[/^\/methodology$/, renderMethodology]
];
function route() {
if (storyCleanup) { storyCleanup(); storyCleanup = null; }
if (BUBBLE_ANIM && BUBBLE_ANIM.raf) { cancelAnimationFrame(BUBBLE_ANIM.raf); BUBBLE_ANIM.raf = 0; }
if (!window.__ATLAS_STANDALONE__ && location.hash.indexOf('#/') === 0 && /^\/(?:map|compare|admission|calendar|favorites|quiz|quiz-oge|professions(?:\/[a-z0-9-]+)?|specialties|universities|colleges(?:\/[a-z0-9-]+)?|regions|about|methodology)(?:\?.*)?$/.test(location.hash.slice(1))) {
var legacyRoute = location.hash.slice(1);
history.replaceState(null, '', '/atlas-2030' + legacyRoute);
}
var r = parseHash();
if (r.path.indexOf('/professions') !== 0) clearCatalogState();
if (r.path === '/siberia') {
history.replaceState(null, '', '#/universities?district=' + encodeURIComponent('СФО'));
r = parseHash();
}
var found = false;
for (var i = 0; i < ROUTES.length; i++) {
var m = r.path.match(ROUTES[i][0]);
if (m) { found = true; try { ROUTES[i][1](m, r.q); } catch (e) { if (window.console && console.error) console.error('atlas: ошибка раздела ' + r.path, e); render404(r.path); } break; }
}
if (!found) render404(r.path);
applySeo(r.path);
setNav(r.path);
closeNav();
var pal = document.getElementById('palette');
if (pal) pal.hidden = true;
document.body.style.overflow = '';
window.scrollTo(0, 0);
initReveal();
init3D();
initConstellation();
animateBars();
animateCounters();
updateCompare();
updateProgress();
/* Первый маршрут не перехватывает фокус: страница только что загрузилась.
   Дальше фокус уходит в основной контент, чтобы скринридер и клавиатура
   продолжали работу с нового раздела, а не с шапки. */
if (routeCount++) {
try { app.focus({ preventScroll: true }); } catch (e) { app.focus(); }
}
document.dispatchEvent(new CustomEvent('atlas:route', { detail: { path: r.path } }));
}
var routeCount = 0;
function render404(path) {
setTitle('Страница не найдена — Профессии·2030');
app.innerHTML = '<div class="view" style="padding:70px 0">' +
'<p class="eyebrow">Ошибка 404</p>' +
'<h1 class="display">Такой страницы <em>нет</em></h1>' +
'<div class="cube404" aria-hidden="true"><div class="cube404-in"><i>4</i><i>0</i><i>4</i><i>4</i><i>0</i><i>4</i></div></div>' +
'<p class="lead" style="margin-top:16px">Адрес <span class="mono">' + h(path) + '</span> не найден. Вернитесь в каталог или начните с опросника.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/professions">Каталог профессий</a>' +
'<a class="btn" href="#/quiz">Опросник</a></div></div>';
}
var io = null;
function initReveal(root) {
var els = (root || app).querySelectorAll('.reveal');
if (!els.length) return;
if (!('IntersectionObserver' in window)) {
els.forEach(function (e) { e.classList.add('in'); });
return;
}
if (!io) {
io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) {
if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
});
}, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
}
els.forEach(function (e) { io.observe(e); });
}
var TILT_SEL = '.fcard,.spec-card,.city-card,.geo-card,.adv-card,.ind-card,.cc';
var canTilt = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var motionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
var noMotion = !!(motionMQ && motionMQ.matches);
if (motionMQ && motionMQ.addEventListener) {
motionMQ.addEventListener('change', function (e) { noMotion = e.matches; });
} else if (motionMQ && motionMQ.addListener) {
motionMQ.addListener(function (e) { noMotion = e.matches; });
}
var tiltEl = null, tiltBox = null, tiltQueued = false, tiltX = 0, tiltY = 0;
function tiltPaint() {
tiltQueued = false;
if (!tiltEl || !tiltBox) return;
var s = tiltEl.style;
s.setProperty('--rx', (((tiltY - tiltBox.top) / tiltBox.height - .5) * -5).toFixed(2) + 'deg');
s.setProperty('--ry', (((tiltX - tiltBox.left) / tiltBox.width - .5) * 5).toFixed(2) + 'deg');
s.setProperty('--gx', ((tiltX - tiltBox.left) / tiltBox.width * 100).toFixed(1) + '%');
s.setProperty('--gy', ((tiltY - tiltBox.top) / tiltBox.height * 100).toFixed(1) + '%');
}
function tiltQueue(x, y) {
tiltX = x; tiltY = y;
if (tiltQueued) return;
tiltQueued = true;
requestAnimationFrame(tiltPaint);
}
function tiltClear(el) {
el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
el.style.removeProperty('--gx'); el.style.removeProperty('--gy');
}
if (canTilt && !noMotion) {
document.addEventListener('pointerover', function (e) {
if (e.pointerType !== 'mouse') return;
var el = e.target.closest ? e.target.closest(TILT_SEL) : null;
if (!el || el === tiltEl) return;
if (tiltEl) tiltClear(tiltEl);
tiltEl = el; tiltBox = el.getBoundingClientRect();
tiltQueue(e.clientX, e.clientY);
}, { passive: true });
document.addEventListener('pointermove', function (e) {
if (!tiltEl || e.pointerType !== 'mouse') return;
tiltQueue(e.clientX, e.clientY);
}, { passive: true });
document.addEventListener('pointerout', function (e) {
if (!tiltEl) return;
if (e.relatedTarget && tiltEl.contains(e.relatedTarget)) return;
tiltClear(tiltEl); tiltEl = null; tiltBox = null;
}, { passive: true });
}
function init3D(root) {
var scope = root || app;
if (canTilt && !noMotion) {
var cards = scope.querySelectorAll(TILT_SEL);
for (var i = 0; i < cards.length; i++) cards[i].classList.add('tilt');
}
var hero = scope.querySelector('.hero');
if (!hero || !canTilt || noMotion || hero.dataset.px) return;
hero.dataset.px = '1';
hero.addEventListener('pointermove', function (e) {
var r = hero.getBoundingClientRect();
hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
hero.style.setProperty('--px', (e.clientX - r.left).toFixed(0) + 'px');
hero.style.setProperty('--py', (e.clientY - r.top).toFixed(0) + 'px');
}, { passive: true });
hero.addEventListener('pointerleave', function () {
hero.style.setProperty('--mx', '0');
hero.style.setProperty('--my', '0');
hero.style.setProperty('--px', '50%');
hero.style.setProperty('--py', '35%');
});
}
var constellationRAF = 0;
function initConstellation() {
var canvas = document.querySelector('.hero-canvas');
if (constellationRAF) { cancelAnimationFrame(constellationRAF); constellationRAF = 0; }
if (!canvas) return;
if (noMotion || !canTilt || window.innerWidth < 900) { canvas.style.display = 'none'; return; }
var ctx = canvas.getContext('2d');
if (!ctx) return;
var N = 48, nodes = [], pts = [], links = [];
for (var i = 0; i < N; i++) {
var y = 1 - (i + 0.5) / N * 2;
var rr = Math.sqrt(Math.max(0, 1 - y * y));
var th = i * 2.399963229728653;
nodes.push({ x: Math.cos(th) * rr, y: y, z: Math.sin(th) * rr, major: i % 6 === 0 });
pts.push({ x: 0, y: 0, z: 0, s: 0, major: false });
}
for (var a0 = 0; a0 < N; a0++) {
for (var b0 = a0 + 1; b0 < N; b0++) {
var dt0 = nodes[a0].x * nodes[b0].x + nodes[a0].y * nodes[b0].y + nodes[a0].z * nodes[b0].z;
if (dt0 > 0.64) links.push([a0, b0, 1 - dt0]);
}
}
var grid = [], orbits = [];
for (var mi = 0; mi < 4; mi++) {
var arrM = [], mm = mi * Math.PI / 4;
for (var mk = 0; mk <= 48; mk++) {
var ma = mk / 48 * Math.PI * 2;
arrM.push({ x: Math.cos(ma) * Math.cos(mm), y: Math.sin(ma), z: Math.cos(ma) * Math.sin(mm) });
}
grid.push(arrM);
}
for (var pi0 = 1; pi0 <= 2; pi0++) {
var lat = pi0 === 1 ? .55 : -.55, arrP = [];
for (var pk = 0; pk <= 48; pk++) {
var pa = pk / 48 * Math.PI * 2;
arrP.push({ x: Math.cos(pa) * Math.cos(lat), y: Math.sin(lat), z: Math.sin(pa) * Math.cos(lat) });
}
grid.push(arrP);
}
orbits.push({ r: 1.16, tilt: .62, speed: .00011, ph: 0, col: '232,121,249' });
orbits.push({ r: 1.38, tilt: -1.1, speed: -.00008, ph: 2.1, col: '167,139,250' });
var shapes = [];
(function () {
var cv = [], ce = [], i, j, k, d;
for (i = 0; i < 8; i++) cv.push({ x: (i & 1 ? 1 : -1) * .62, y: (i & 2 ? 1 : -1) * .62, z: (i & 4 ? 1 : -1) * .62 });
for (i = 0; i < 8; i++) for (j = i + 1; j < 8; j++) {
d = 0;
for (k = 0; k < 3; k++) if (((i >> k) & 1) !== ((j >> k) & 1)) d++;
if (d === 1) ce.push([i, j]);
}
var cf = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
shapes.push({ v: cv, e: ce, f: cf, q: [], p: [.1, -.95, .12], s: .22, sp: .00028, ph: 0, c: '232,121,249' });
var ov = [], oe = [];
for (i = 0; i < 6; i++) ov.push({ x: i === 0 ? 1 : i === 1 ? -1 : 0, y: i === 2 ? 1 : i === 3 ? -1 : 0, z: i === 4 ? 1 : i === 5 ? -1 : 0 });
for (i = 0; i < 6; i++) for (j = i + 1; j < 6; j++) if ((i >> 1) !== (j >> 1)) oe.push([i, j]);
var of = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]];
shapes.push({ v: ov, e: oe, f: of, q: [], p: [-.6, -.35, .1], s: .24, sp: -.00034, ph: 1.2, c: '167,139,250' });
var tv = [], te = [], TR = 12, Tr = 6;
for (i = 0; i < TR; i++) for (j = 0; j < Tr; j++) {
var u = i / TR * Math.PI * 2, vv = j / Tr * Math.PI * 2;
tv.push({ x: (.62 + .24 * Math.cos(vv)) * Math.cos(u), y: .24 * Math.sin(vv), z: (.62 + .24 * Math.cos(vv)) * Math.sin(u) });
}
for (i = 0; i < TR; i++) for (j = 0; j < Tr; j++) {
var a = i * Tr + j;
te.push([a, ((i + 1) % TR) * Tr + j]);
te.push([a, i * Tr + (j + 1) % Tr]);
}
shapes.push({ v: tv, e: te, q: [], p: [-1, -.82, -.1], s: .24, sp: .00022, ph: 2.4, c: '214,203,255' });
})();
var glow = document.createElement('canvas');
glow.width = glow.height = 64;
var gx = glow.getContext('2d');
var gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
gr.addColorStop(0, 'rgba(214,203,255,.95)');
gr.addColorStop(.3, 'rgba(167,139,250,.5)');
gr.addColorStop(1, 'rgba(124,92,224,0)');
gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
var dpr = Math.min(1.6, window.devicePixelRatio || 1);
var W = 0, H = 0, cx = 0, cy = 0, Rx = 0, Ry = 0;
var ay = 0.3, ax = -0.12, tay = 0.3, tax = -0.12;
var ca = 1, sa = 0, cb = 1, sb = 0;
var mx = 0, my = 0, hx = -999, hy = -999, hover = false;
var last = 0, t0 = 0, pulses = [], nextPulse = 0, shoot = null, nextShoot = 0;
var tmp = { x: 0, y: 0, z: 0, s: 0 };
function resize() {
W = canvas.clientWidth; H = canvas.clientHeight;
if (!W || !H) return;
canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
cx = W * 0.52; cy = H * 0.42;
Rx = W * 0.42; Ry = H * 0.37;
}
resize();
var hero = canvas.parentNode;
hero.addEventListener('pointermove', function (e) {
var b = hero.getBoundingClientRect();
hx = e.clientX - b.left; hy = e.clientY - b.top;
mx = hx / b.width - 0.5;
my = hy / b.height - 0.5;
hover = true;
}, { passive: true });
hero.addEventListener('pointerleave', function () { mx = 0; my = 0; hover = false; });
function project(p, out) {
var x1 = p.x * ca - p.z * sa;
var z1 = p.x * sa + p.z * ca;
var y1 = p.y * cb - z1 * sb;
var z2 = p.y * sb + z1 * cb;
var s = 1 / (1 + z2 * 0.26);
out.x = cx + x1 * Rx * s;
out.y = cy + y1 * Ry * s;
out.z = z2;
out.s = s;
return out;
}
function curve(A, B, t, out) {
var mxp = (A.x + B.x) * 0.5, myp = (A.y + B.y) * 0.5;
var dx = mxp - cx, dy = myp - cy, ln = Math.sqrt(dx * dx + dy * dy) || 1;
var qx = mxp + dx / ln * 24, qy = myp + dy / ln * 24;
var u = 1 - t;
out.x = u * u * A.x + 2 * u * t * qx + t * t * B.x;
out.y = u * u * A.y + 2 * u * t * qy + t * t * B.y;
return out;
}
function orbitPoint(o, ang, out) {
var x = Math.cos(ang) * o.r, y = Math.sin(ang) * o.r;
out.x = x;
out.y = y * Math.cos(o.tilt);
out.z = y * Math.sin(o.tilt);
return out;
}
function frame(ts) {
if (!canvas.isConnected) { constellationRAF = 0; return; }
if (W !== canvas.clientWidth || H !== canvas.clientHeight) resize();
if (!t0) t0 = ts;
var dt = Math.min(40, ts - (last || ts));
last = ts;
var intro = Math.min(1, (ts - t0) / 1500);
intro = intro * intro * (3 - 2 * intro);
tay += dt * 0.00005;
tax = -0.12 + my * 0.4;
ay += (tay + mx * 0.6 - ay) * 0.05;
ax += (tax - ax) * 0.05;
ca = Math.cos(ay); sa = Math.sin(ay); cb = Math.cos(ax); sb = Math.sin(ax);
ctx.clearRect(0, 0, W, H);
var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(Rx, Ry) * 1.05);
g.addColorStop(0, 'rgba(124,92,224,.16)');
g.addColorStop(.45, 'rgba(124,92,224,.05)');
g.addColorStop(1, 'rgba(124,92,224,0)');
ctx.fillStyle = g;
ctx.fillRect(cx - Rx, cy - Ry, Rx * 2, Ry * 2);
ctx.lineWidth = 1;
ctx.strokeStyle = 'rgba(167,139,250,.08)';
for (var gi = 0; gi < grid.length; gi++) {
var G = grid[gi];
ctx.beginPath();
for (var gk = 0; gk < G.length; gk++) {
project(G[gk], tmp);
if (gk === 0) ctx.moveTo(tmp.x, tmp.y); else ctx.lineTo(tmp.x, tmp.y);
}
ctx.stroke();
}
for (var oi = 0; oi < orbits.length; oi++) {
var O = orbits[oi];
ctx.strokeStyle = 'rgba(' + O.col + ',.09)';
ctx.beginPath();
for (var ok = 0; ok <= 64; ok++) {
orbitPoint(O, ok / 64 * Math.PI * 2, tmp);
project(tmp, tmp);
if (ok === 0) ctx.moveTo(tmp.x, tmp.y); else ctx.lineTo(tmp.x, tmp.y);
}
ctx.stroke();
}
for (var sh = 0; sh < shapes.length; sh++) {
var S = shapes[sh], ang = ts * S.sp + S.ph;
var c1 = Math.cos(ang), s1 = Math.sin(ang);
var c2 = Math.cos(ang * .63), s2 = Math.sin(ang * .63);
for (var vi = 0; vi < S.v.length; vi++) {
var V = S.v[vi];
var vx = V.x * c1 - V.z * s1, vz = V.x * s1 + V.z * c1;
var vy = V.y * c2 - vz * s2; vz = V.y * s2 + vz * c2;
tmp.x = S.p[0] + vx * S.s;
tmp.y = S.p[1] + vy * S.s;
tmp.z = S.p[2] + vz * S.s;
project(tmp, S.q[vi] || (S.q[vi] = { x: 0, y: 0, z: 0, s: 0 }));
}
if (S.f) for (var fi = 0; fi < S.f.length; fi++) {
var F = S.f[fi], fz = 0;
ctx.beginPath();
for (var fj = 0; fj < F.length; fj++) {
var FQ = S.q[F[fj]];
fz += FQ.z;
if (fj === 0) ctx.moveTo(FQ.x, FQ.y); else ctx.lineTo(FQ.x, FQ.y);
}
ctx.closePath();
fz /= F.length;
ctx.fillStyle = 'rgba(' + S.c + ',' + ((.018 + (fz * .25 + .5) * .045) * intro).toFixed(3) + ')';
ctx.fill();
}
ctx.lineWidth = 1.2;
for (var ei = 0; ei < S.e.length; ei++) {
var A2 = S.q[S.e[ei][0]], B2 = S.q[S.e[ei][1]];
var al2 = (.06 + ((A2.z + B2.z) * .25 + .5) * .45) * intro;
if (al2 < .01) continue;
ctx.strokeStyle = 'rgba(' + S.c + ',' + al2.toFixed(3) + ')';
ctx.beginPath(); ctx.moveTo(A2.x, A2.y); ctx.lineTo(B2.x, B2.y); ctx.stroke();
}
project({ x: S.p[0], y: S.p[1], z: S.p[2] }, tmp);
ctx.globalAlpha = .15 * intro;
ctx.drawImage(glow, tmp.x - 52, tmp.y - 52, 104, 104);
ctx.globalAlpha = 1;
}
for (var i = 0; i < N; i++) {
project(nodes[i], pts[i]);
pts[i].major = nodes[i].major;
}
ctx.lineWidth = 1;
for (var li = 0; li < links.length; li++) {
var L = links[li], A = pts[L[0]], B = pts[L[1]];
var dep0 = (A.z + B.z) * .25 + .5;
var al = (0.05 + dep0 * 0.34) * (1 - L[2] * 1.3) * intro;
if (al < .015) continue;
curve(A, B, .5, tmp);
ctx.strokeStyle = 'rgba(167,139,250,' + al.toFixed(3) + ')';
ctx.beginPath(); ctx.moveTo(A.x, A.y);
ctx.quadraticCurveTo(tmp.x, tmp.y, B.x, B.y); ctx.stroke();
}
if (hover && intro > .5) {
ctx.globalAlpha = .34;
ctx.drawImage(glow, hx - 70, hy - 70, 140, 140);
ctx.globalAlpha = 1;
for (var fi = 0; fi < N; fi++) {
var F = pts[fi];
var fdx = F.x - hx, fdy = F.y - hy, fd = Math.sqrt(fdx * fdx + fdy * fdy);
if (fd > 170) continue;
var fa = (1 - fd / 170) * .38 * ((F.z + 1) / 2);
ctx.strokeStyle = 'rgba(214,203,255,' + fa.toFixed(3) + ')';
ctx.beginPath(); ctx.moveTo(F.x, F.y); ctx.lineTo(hx, hy); ctx.stroke();
}
}
if (ts > nextPulse && links.length) {
nextPulse = ts + 700 + Math.random() * 900;
pulses.push({ l: Math.floor(Math.random() * links.length), t: 0 });
}
for (var pi = pulses.length - 1; pi >= 0; pi--) {
var pu = pulses[pi];
pu.t += dt / 1500;
if (pu.t >= 1) { pulses.splice(pi, 1); continue; }
var PL = links[pu.l];
for (var k = 0; k < 4; k++) {
var tt = pu.t - k * .035;
if (tt < 0) continue;
curve(pts[PL[0]], pts[PL[1]], tt, tmp);
ctx.globalAlpha = (1 - pu.t) * (1 - k / 4) * .9;
ctx.drawImage(glow, tmp.x - 7, tmp.y - 7, 14, 14);
}
ctx.globalAlpha = 1;
}
for (var ni = 0; ni < N; ni++) {
var P = pts[ni], dep = (P.z + 1) / 2;
var size = (P.major ? 30 : 16) * (.55 + dep * .75) * intro;
if (size < 1) continue;
ctx.globalAlpha = .42 + dep * .58;
ctx.drawImage(glow, P.x - size / 2, P.y - size / 2, size, size);
ctx.globalAlpha = 1;
}
for (var si = 0; si < orbits.length; si++) {
var SO = orbits[si];
for (var sk = 0; sk < 7; sk++) {
orbitPoint(SO, SO.ph + ts * SO.speed - sk * .05, tmp);
project(tmp, tmp);
var sz = (sk === 0 ? 20 : 11) * intro;
ctx.globalAlpha = (1 - sk / 7) * (sk === 0 ? 1 : .4);
ctx.drawImage(glow, tmp.x - sz / 2, tmp.y - sz / 2, sz, sz);
}
ctx.globalAlpha = 1;
}
if (!shoot && ts > nextShoot) {
nextShoot = ts + 5000 + Math.random() * 6000;
shoot = { x: cx - Rx * (.2 + Math.random() * .5), y: cy - Ry * (.7 + Math.random() * .3), vx: 2.4 + Math.random() * 1.4, vy: 1.1 + Math.random() * .7, t: 0 };
}
if (shoot) {
shoot.t += dt; shoot.x += shoot.vx * dt * .06; shoot.y += shoot.vy * dt * .06;
var st = Math.min(1, shoot.t / 900);
ctx.lineWidth = 1.4;
ctx.strokeStyle = 'rgba(232,121,249,' + ((1 - st) * .5).toFixed(3) + ')';
ctx.beginPath();
ctx.moveTo(shoot.x, shoot.y);
ctx.lineTo(shoot.x - shoot.vx * 26, shoot.y - shoot.vy * 26);
ctx.stroke();
ctx.globalAlpha = (1 - st) * .8;
ctx.drawImage(glow, shoot.x - 8, shoot.y - 8, 16, 16);
ctx.globalAlpha = 1;
if (shoot.t > 900) shoot = null;
}
constellationRAF = requestAnimationFrame(frame);
}
constellationRAF = requestAnimationFrame(frame);
}
function animateBars(root) {
var fills = (root || app).querySelectorAll('.bar-fill');
if (!fills.length) return;
requestAnimationFrame(function () {
requestAnimationFrame(function () {
fills.forEach(function (f) {
var v = f.getAttribute('data-v') || '1';
f.style.transform = 'scaleX(' + v + ')';
f.classList.add('in');
});
});
});
}
var counterIO = null;
function animateCounters(root) {
var els = (root || app).querySelectorAll('[data-count]');
if (!els.length) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce || !('IntersectionObserver' in window)) return;
if (!counterIO) {
counterIO = new IntersectionObserver(function (entries) {
entries.forEach(function (en) {
if (!en.isIntersecting) return;
var el = en.target;
counterIO.unobserve(el);
var target = parseInt(el.getAttribute('data-count'), 10);
if (isNaN(target) || target <= 0) return;
var start = null;
function step(ts) {
if (start === null) start = ts;
var p = Math.min(1, (ts - start) / 850);
var e = 1 - Math.pow(1 - p, 3);
el.textContent = String(Math.round(target * e));
if (p < 1) requestAnimationFrame(step);
}
el.textContent = '0';
requestAnimationFrame(step);
});
}, { threshold: 0.25 });
}
els.forEach(function (e) { counterIO.observe(e); });
}
var progressEl = document.getElementById('scrollProgress');
// Подсказка «что такое индекс спроса» — делегирование, кнопка живёт в renderHome.
document.addEventListener('click', function (e) {
var hint = e.target.closest ? e.target.closest('.index-hint') : null;
if (!hint) return;
var tip = hint.closest('.chart-head') ? hint.closest('.chart-head').parentNode.querySelector('.index-tooltip') : null;
if (!tip) return;
tip.hidden = !tip.hidden;
hint.classList.toggle('on', !tip.hidden);
hint.setAttribute('aria-expanded', tip.hidden ? 'false' : 'true');
});
var toTopEl = document.getElementById('toTop');
/* Короткие пояснения к терминам: школьник наводит на подчёркнутое слово
   и видит, что оно значит, без чтения методологии. */
var GLOSSARY = {
index: 'Индекс спроса — оценка атласа: число вакансий, их рост к 2030 году и дефицит специалистов. 100 — максимальный спрос.',
ball: 'Минимальный балл на бюджет — самый низкий проходной балл по программам профессии в вузах атласа. Это ориентир, а не гарантия.',
growth: 'Рост вакансий — на сколько процентов, по оценке атласа, вырастет спрос на профессию к 2030 году.',
budget: 'Бюджетные места — места, на которых учатся за счёт государства. Нужно набрать проходной балл и подать документы.',
attest: 'Средний балл аттестата — средний результат аттестата, который колледжи обычно просят при поступлении.',
programs: 'Программы в атласе — направления подготовки, найденные в открытых данных вузов. Их меньше, чем во всём стране.',
zone: 'Пограничная зона — разница до 10 баллов от проходного. Шансы в этой зоне неопределённые.'
};
function gloss(key, label) {
return '<button class="gloss" type="button" data-gloss="' + h(key) + '" aria-label="Пояснить: ' + h(label) + '">' + h(label) + '</button>';
}
var glossTip = null;
function glossShow(btn) {
var key = btn.getAttribute('data-gloss');
var text = GLOSSARY[key];
if (!text) return;
if (!glossTip) {
glossTip = document.createElement('div');
glossTip.className = 'gloss-tip';
glossTip.setAttribute('role', 'status');
glossTip.hidden = true;
document.body.appendChild(glossTip);
}
glossTip.textContent = text;
glossTip.hidden = false;
var r = btn.getBoundingClientRect();
var tw = glossTip.offsetWidth, th = glossTip.offsetHeight;
var left = Math.max(12, Math.min(window.innerWidth - tw - 12, r.left));
var top = r.bottom + 10;
if (top + th > window.innerHeight - 12) top = Math.max(12, r.top - th - 10);
glossTip.style.left = left + 'px';
glossTip.style.top = top + 'px';
}
function glossHide() {
if (glossTip) glossTip.hidden = true;
}
document.addEventListener('click', function (e) {
var pr = e.target.closest && e.target.closest('[data-print]');
if (pr) {
e.preventDefault();
window.print();
return;
}
var g = e.target.closest ? e.target.closest('.gloss') : null;
if (!g) { glossHide(); return; }
e.preventDefault();
if (glossTip && !glossTip.hidden && glossTip.textContent === GLOSSARY[g.getAttribute('data-gloss')]) glossHide();
else glossShow(g);
});
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape') glossHide();
});
var topRing = toTopEl ? toTopEl.querySelector('circle') : null;
function updateProgress() {
var doc = document.documentElement;
var max = doc.scrollHeight - doc.clientHeight;
var p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
if (progressEl) progressEl.style.transform = 'scaleX(' + p + ')';
if (toTopEl) {
toTopEl.classList.toggle('show', p > .06 && max > 420);
if (topRing) topRing.style.strokeDashoffset = (125.7 * (1 - p)).toFixed(1);
}
}
if (toTopEl) toTopEl.addEventListener('click', function () {
window.scrollTo({ top: 0, behavior: noMotion ? 'auto' : 'smooth' });
});
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
var PAL_INDEX = [];
var PAL_GROUPS = { 'Профессия': 'Профессии', 'Специальность': 'Специальности', 'Вуз': 'Вузы', 'Колледж': 'Колледжи', 'Действие': 'Быстрый переход' };
P.forEach(function (p) {
PAL_INDEX.push({ type: 'Профессия', title: p.title, sub: p.sphereCode + ' · ' + p.sphere, href: '#/professions/' + p.slug, icon: '§' });
});
U.forEach(function (u) {
PAL_INDEX.push({ type: 'Вуз', title: u.short, sub: u.city + ' · ' + u.full, href: '#/universities?q=' + encodeURIComponent(u.short), icon: 'В' });
});
C.forEach(function (c) {
PAL_INDEX.push({ type: 'Колледж', title: c.title, sub: c.code + ' · ' + c.duration, href: '#/colleges/' + c.slug, icon: 'К' });
});
SPECIALTIES.forEach(function (s) {
PAL_INDEX.push({
type: 'Специальность', title: s.direction,
sub: s.code + ' · ' + s.cities.slice(0, 3).join(', '),
href: '#/universities?q=' + encodeURIComponent(s.direction), icon: 'С'
});
});
var palette = document.getElementById('palette');
/* Запросы обычными словами: «после 9 класса», «биология», «Москва бюджет».
   Сверху результатов появляются готовые переходы, а не только совпадения по названиям. */
function palIntents(q) {
var nq = norm(q);
if (!nq) return [];
var out = [];
function add(title, sub, href, icon) {
if (out.length >= 4) return;
out.push({ type: 'Действие', title: title, sub: sub, href: href, icon: icon || '→' });
}
if (/(после|из|окончил)\s*9|9\s*класс|девят|огэ/.test(nq)) {
add('Подбор после 9 класса', 'ОГЭ → специальности колледжей и шансы на бюджет', '#/quiz-oge', '9');
add('Все специальности колледжей', C.length + ' направлений с коротким маршрутом к профессии', '#/colleges', 'К');
}
if (/егэ|11\s*класс|одиннадцат/.test(nq)) {
add('Подбор по предметам ЕГЭ', 'Три шага: предметы, сфера, сумма баллов', '#/quiz', 'Е');
}
var SUBJ_INTENT = [
['математ', 'Мат', 'Математика'], ['информат', 'Инф', 'Информатика'], ['физик', 'Физ', 'Физика'],
['хими', 'Хим', 'Химия'], ['биолог', 'Био', 'Биология'], ['обществ', 'Общ', 'Обществознание'],
['истори', 'Ист', 'История'], ['географ', 'Гео', 'География'], ['литератур', 'Лит', 'Литература'],
['английск', 'Ин.яз', 'Английский язык'], ['иностран', 'Ин.яз', 'Иностранный язык'], ['русск', 'Рус', 'Русский язык']
];
for (var si = 0; si < SUBJ_INTENT.length; si++) {
var s = SUBJ_INTENT[si];
if (nq.indexOf(s[0]) >= 0) {
add('Вузы с предметом «' + s[2] + '»', 'Программы, где этот предмет есть в наборе ЕГЭ', '#/universities?exam=' + encodeURIComponent(s[1]), 'Е');
break;
}
}
var budget = /бюджет/.test(nq), paid = /платн/.test(nq);
var city = '';
var padded = ' ' + nq + ' ';
for (var ci = 0; ci < CITIES.length; ci++) {
var nc = norm(CITIES[ci]);
if (nc.length >= 4 && padded.indexOf(' ' + nc + ' ') >= 0) { city = CITIES[ci]; break; }
}
if (city) {
var cp = new URLSearchParams();
cp.set('city', city);
if (budget) cp.set('mode', 'budget');
if (paid) cp.set('mode', 'paid');
add('Вузы: ' + city + (budget ? ', бюджет' : paid ? ', платное' : ''), 'Город в каталоге с баллами и направлениями', '#/universities?' + cp.toString(), 'В');
} else if (budget) {
add('Только бюджетные места', 'Вузы, где есть программы на бюджете', '#/universities?mode=budget', 'В');
} else if (paid) {
add('Только платное обучение', 'Программы с указанным платным баллом', '#/universities?mode=paid', 'В');
}
if (/календар/.test(nq)) add('Календарь приёмной кампании', 'Помесячно: после 11 и после 9 класса', '#/calendar', 'К');
if (/^карт|карта\b/.test(nq)) add('Объёмная карта России', 'Города с вузами на 3D-карте', '#/map', 'М');
if (/сравн/.test(nq)) add('Сравнение профессий и вузов', 'До трёх позиций рядом', '#/compare', 'С');
if (/избран/.test(nq)) add('Избранное', 'Профессии, отмеченные звёздочкой', '#/favorites', '★');
if (/методолог/.test(nq)) add('Методология', 'Формулы, источники и границы данных', '#/methodology', 'М');
return out;
}
var palInput = document.getElementById('paletteInput');
var palList = document.getElementById('paletteList');
var palItems = [];
var palSel = -1;
function palSelect(i) {
palSel = i;
palList.querySelectorAll('.p-item').forEach(function (el) {
var on = Number(el.getAttribute('data-i')) === i;
el.setAttribute('aria-selected', on ? 'true' : 'false');
if (on && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
});
}
function palPaint(q) {
var nq = norm(q);
var res;
if (!nq) {
res = PAL_INDEX.filter(function (x) { return x.type === 'Профессия'; }).slice(0, 6);
} else {
res = palIntents(q).concat(PAL_INDEX.filter(function (x) { return norm(x.title + ' ' + x.sub).indexOf(nq) >= 0; })).slice(0, 18);
}
palItems = res;
if (!res.length) {
palSel = -1;
palList.innerHTML = '<div class="p-empty">Ничего не нашлось. Попробуйте «после 9 класса», «биология», «Москва бюджет» или название профессии.</div>';
return;
}
var out = '';
var group = '';
res.forEach(function (item, i) {
if (item.type !== group) {
group = item.type;
out += '<div class="p-group">' + h(PAL_GROUPS[group]) + '</div>';
}
out += '<div class="p-item" role="option" aria-selected="false" data-i="' + i + '">' +
'<span class="ic">' + item.icon + '</span>' +
'<span class="tx"><span class="tt">' + mark(item.title, q) + '</span>' +
'<span class="ss">' + mark(item.sub, q) + '</span></span></div>';
});
palList.innerHTML = out;
palSelect(0);
}
function palOpen() {
if (!palette) return;
palLastFocus = document.activeElement;
palette.hidden = false;
document.body.style.overflow = 'hidden';
palInput.value = '';
palPaint('');
setTimeout(function () { palInput.focus(); }, 30);
}
function palClose() {
if (!palette) return;
palette.hidden = true;
document.body.style.overflow = '';
restoreFocus(palLastFocus, document.getElementById('openSearch'));
}
function palGo(i) {
var item = palItems[i];
if (!item) return;
palClose();
location.hash = item.href.replace(/^#/, '');
}
if (palette) {
palInput.addEventListener('input', function () { palPaint(palInput.value); });
palList.addEventListener('click', function (e) {
var el = e.target.closest('.p-item');
if (el) palGo(Number(el.getAttribute('data-i')));
});
palette.addEventListener('click', function (e) {
if (e.target.closest('[data-close]')) palClose();
});
palette.addEventListener('keydown', function (e) {
if (e.key === 'Escape') { e.preventDefault(); palClose(); }
else if (e.key === 'ArrowDown') { e.preventDefault(); if (palItems.length) palSelect((palSel + 1) % palItems.length); }
else if (e.key === 'ArrowUp') { e.preventDefault(); if (palItems.length) palSelect((palSel - 1 + palItems.length) % palItems.length); }
else if (e.key === 'Enter') { e.preventDefault(); palGo(palSel); }
else if (e.key === 'Tab') trapTab(palette, e);
});
var openBtn = document.getElementById('openSearch');
if (openBtn) openBtn.addEventListener('click', palOpen);
}
document.addEventListener('keydown', function (e) {
var tag = (e.target && e.target.tagName) || '';
var typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
e.preventDefault();
if (palette && palette.hidden) palOpen(); else palClose();
} else if (e.key === '/' && !typing) {
e.preventDefault();
palOpen();
} else if (e.key === 'Escape' && palette && !palette.hidden) {
e.preventDefault();
palClose();
}
});
function statCard(v, k) {
return '<div class="stat"><div class="v" data-count="' + v + '">' + v + '</div><div class="k">' + k + '</div></div>';
}
var FAV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.9z"/></svg>';
function favButton(p, cls) {
var on = isFavorite(p.slug);
return '<button class="fav-btn' + (cls ? ' ' + cls : '') + '" type="button" data-fav="' + h(p.slug) + '" data-title="' + h(p.title) + '" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + (on ? 'Убрать из избранного: ' : 'Добавить в избранное: ') + h(p.title) + '" title="' + (on ? 'В избранном' : 'В избранное') + '">' + FAV_ICON + '</button>';
}
/* Графическая метка профессии: сетка точек, узор которой выводится
   из slug. Одна и та же профессия всегда получает один и тот же знак. */
var SPHERE_MARK_COLOR = {
'D-01': '#5eead4', 'D-02': '#38bdf8', 'D-03': '#2dd4bf',
'D-04': '#facc15', 'D-05': '#a78bfa', 'D-06': '#f0abfc'
};
function profMark(slug, sphereCode) {
var seed = 2166136261;
for (var i = 0; i < slug.length; i++) {
seed = (seed ^ slug.charCodeAt(i)) >>> 0;
seed = (seed * 16777619) >>> 0;
}
var used = {}, cells = [], want = 4 + (seed % 4), guard = 0;
while (cells.length < want && guard++ < 60) {
seed = (seed * 1103515245 + 12345) >>> 0;
var cx = seed % 4, cy = (seed >>> 9) % 4, key = cx + '-' + cy;
if (used[key]) continue;
used[key] = 1;
cells.push([cx, cy]);
}
var d = '';
cells.forEach(function (cell) {
d += 'M' + (2 + cell[0] * 9) + ' ' + (2 + cell[1] * 9) + 'h6.5v6.5h-6.5z';
});
var col = SPHERE_MARK_COLOR[sphereCode] || '#5eead4';
return '<svg class="pmark" viewBox="0 0 40 40" aria-hidden="true" style="color:' + col + '"><path d="' + d + '"/></svg>';
}
function fcard(p) {
return '<div class="fcard-wrap reveal">' +
'<a class="panel fcard" href="#/professions/' + p.slug + '">' +
'<span class="pmark-bg">' + profMark(p.slug, p.sphereCode) + '</span>' +
'<div class="top"><span class="code">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</span><span class="idx">' + p.index + '</span></div>' +
'<h3>' + h(p.title) + '</h3>' +
'<p>' + h(p.desc) + '</p>' +
'<div class="bot"><span class="g">+' + p.growth + '% к 2030</span><span>' + h(p.salary) + '</span></div>' +
'</a>' + favButton(p) + '</div>';
}
function uniMini(u) {
return '<a class="panel uni reveal" href="#/universities?q=' + encodeURIComponent(u.short) + '">' +
'<div class="uni-top"><div><p class="uni-city">' + h(u.region) + ' · ' + h(u.city) + '</p><h3>' + h(u.short) + '</h3>' +
'<p class="full">' + h(u.full) + '</p></div>' +
'<div class="uni-score"><span class="v">≈' + u.avg + '</span><span class="k">средний балл на бюджет</span></div></div>' +
'<p class="mono tiny" style="margin-top:14px;color:var(--ink-3)">' + u.programs.length + ' ' +
plural(u.programs.length, 'направление', 'направления', 'направлений') + ' в атласе · ≈' +
uniPlaces(u) + ' ' + plural(uniPlaces(u), 'место', 'места', 'мест') + ' на бюджете</p>' +
'</a>';
}
function specMini(s) {
return '<a class="panel spec-card reveal" href="#/universities?q=' + encodeURIComponent(s.direction) + '">' +
'<div class="spec-top"><span class="mono">' + h(s.code) + '</span><span class="tag">' + h(s.sphereCode) + '</span></div>' +
'<h3>' + h(s.direction) + '</h3>' +
'<p class="spec-prof">' + h(s.profession) + '</p>' +
'<div class="spec-meta"><span>' + s.count + ' ' + plural(s.count, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>от ≈' + s.minBudget + '</span></div>' +
'<span class="spec-arrow">Перейти к вузам →</span></a>';
}
function regionCard(r) {
var cities = r.cities.slice(0, 4).join(' · ');
if (r.cities.length > 4) cities += ' и ещё ' + (r.cities.length - 4);
return '<a class="panel city-card reveal" href="#/universities?district=' + encodeURIComponent(r.district) + '&region=' + encodeURIComponent(r.name) + '">' +
'<div class="city-top"><span class="city-dot" aria-hidden="true"></span><span class="mono">' + h(r.district) + '</span></div>' +
'<h3>' + h(r.name) + '</h3>' +
'<p class="city-note">' + h(cities) + '</p>' +
'<div class="city-meta"><span>' + r.count + ' ' + plural(r.count, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>' + r.programs + ' ' + plural(r.programs, 'программа', 'программы', 'программ') + '</span>' +
'<span>≈' + r.avg + '</span></div>' +
'<span class="spec-arrow">Вузы региона →</span></a>';
}
function districtCard(d) {
var top = d.regions.slice(0, 3).map(function (r) { return r.name; }).join(' · ');
if (d.regions.length > 3) top += ' и другие';
return '<a class="panel geo-card reveal" href="#/universities?district=' + encodeURIComponent(d.code) + '">' +
'<div class="geo-top"><span class="geo-code">' + h(d.code) + '</span><span class="mono">' + d.regions.length + ' ' +
plural(d.regions.length, 'регион', 'региона', 'регионов') + '</span></div>' +
'<h3>' + h(d.name) + '</h3>' +
'<p class="city-note">' + h(top) + '</p>' +
'<div class="geo-meta"><span>' + d.count + ' ' + plural(d.count, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>' + d.programs + ' ' + plural(d.programs, 'программа', 'программы', 'программ') + '</span>' +
'<span>≈' + d.avg + '</span></div>' +
'<span class="spec-arrow">Открыть округ →</span></a>';
}
function advCard(n, title, text) {
return '<div class="panel adv-card reveal"><span class="adv-num">' + n + '</span>' +
'<h3>' + h(title) + '</h3><p>' + h(text) + '</p></div>';
}
function renderHome() {
setTitle('Профессии·2030 — атлас востребованных профессий');
var byIndex = P.slice().sort(function (a, b) { return b.index - a.index; });
var top = byIndex.slice(0, 8);
var featured = P.slice().sort(function (a, b) { return b.growth - a.growth; }).slice(0, 6);
var uniTop = U.slice().sort(function (a, b) { return b.avg - a.avg; }).slice(0, 3);
var colTop = C.slice().sort(function (a, b) { return b.count - a.count; }).slice(0, 4);
var specTop = SPECIALTIES.slice(0, 6);
var geoTop = DISTRICTS.slice();
var teacher = ROLE === 'teacher';
var teacherPanel = !teacher ? '' :
'<section class="teach-panel reveal"><p class="eyebrow">Учителю и родителю</p>' +
'<h2 class="sec">Три готовых действия</h2>' +
'<div class="teach-grid">' +
'<a class="teach-card" href="#/professions"><b>01 · Собрать подборку</b><span>Отметьте профессии галочкой в каталоге — таблица сравнения соберётся автоматически.</span><i>Каталог →</i></a>' +
'<a class="teach-card" href="#/compare"><b>02 · Показать классу</b><span>Спрос, зарплата, предметы ЕГЭ и ведущие вузы — на одном экране для проектора.</span><i>Сравнение →</i></a>' +
'<a class="teach-card" href="#/methodology"><b>03 · Проверить источники</b><span>Открытая методика индекса, годы приёмных кампаний и границы данных.</span><i>Методология →</i></a>' +
'</div></section>';
app.innerHTML = '<div class="view">' +
'<section class="hero hero-home">' +
'<canvas class="hero-canvas" aria-hidden="true"></canvas>' +
'<div class="hero-grid">' +
'<div class="hero-copy">' +
roleSwitchHtml() +
'<p class="eyebrow">Раздел I · Навигатор</p>' +
(teacher
? '<h1 class="display">Профессии будущего — <em>на уроке</em> и дома</h1>' +
'<p class="lead">Материал для классного часа и семейного разговора: ' + P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') + ', ' +
U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' и ' + TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') +
'. Соберите подборку, сравните варианты и разберите с учениками, какие предметы ведут к каждой профессии.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/professions">Собрать подборку для класса →</a><a class="btn" href="#/compare">Сравнить профессии</a></div>'
: '<h1 class="display">Профессии, которые будут <em>нужны</em> в 2030 году</h1>' +
'<p class="lead">Атлас объединяет ' + P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') + ', ' +
U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ', ' +
TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') + ' и ' +
C.length + ' ' + plural(C.length, 'колледж', 'колледжа', 'колледжей') + '. Ответьте на три вопроса — и увидите, какие профессии и программы подходят именно вам.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/quiz">Подобрать профессию за 3 шага →</a><a class="btn" href="#/professions">Открыть каталог</a></div>') +
'<div class="hero-meta"><span>' + P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') + '</span>' +
'<span>' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>' + TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') + '</span>' +
'<span>' + REGIONS.length + ' ' + plural(REGIONS.length, 'регион', 'региона', 'регионов') + '</span>' +
'<span>2027–2030</span></div>' +
'</div>' +
'<aside class="panel start-card">' +
'<h2>' + (teacher ? 'Как провести занятие' : 'Порядок работы') + '</h2>' +
'<div class="start-steps">' +
(teacher
? '<div class="start-step"><b>01</b><span>Выберите сферу и отметьте 2–3 профессии для сравнения.</span></div>' +
'<div class="start-step"><b>02</b><span>Покажите классу таблицу: спрос, зарплата, предметы ЕГЭ и вузы.</span></div>' +
'<div class="start-step"><b>03</b><span>Разберите, что проверить на сайте вуза перед подачей документов.</span></div>'
: '<div class="start-step"><b>01</b><span>Отметьте предметы ЕГЭ, которые планируете сдавать.</span></div>' +
'<div class="start-step"><b>02</b><span>Выберите сферу или воспользуйтесь общей подборкой.</span></div>' +
'<div class="start-step"><b>03</b><span>Укажите ожидаемую сумму баллов и получите список программ.</span></div>') +
'</div>' +
'<div class="start-mini"><p class="label">Наибольший спрос</p>' +
top.slice(0, 3).map(function (p) {
return '<div class="mini-row"><a href="#/professions/' + p.slug + '">' + h(p.title) + '</a><span class="mono">' + p.index + '</span></div>';
}).join('') +
'</div>' +
'<a class="btn btn-sm" style="width:100%;margin-top:14px" href="#/quiz">Подобрать программы</a>' +
'</aside>' +
'</div>' +
'<div class="stats reveal">' +
statCard(P.length, 'профессий в атласе') +
statCard(U.length, plural(U.length, 'вуз с баллами', 'вуза с баллами', 'вузов с баллами')) +
statCard(TOTAL_PROGRAMS, 'программ и специальностей') +
statCard(DISTRICTS.length, 'федеральных округов') +
'</div>' +
'</section>' +
teacherPanel +
// Дата — вне .hero-home: у секции overflow:hidden, и transform reveal
// уводил текст за границу обрезки (IntersectionObserver не срабатывал).
'<p class="data-date reveal">Данные собраны 26 октября 2026 · проходные баллы — приёмные кампании 2024–2025 · даты кампании 2026–2027 уточняйте в вузе</p>' +
    '<section class="sec-head reveal"><div><p class="eyebrow">Структура</p><h2 class="sec">Шесть сфер атласа</h2></div>' +
    '<a class="sec-link" href="#/professions">Каталог профессий →</a></section>' +
    '<div class="sph-grid reveal">' + SPHERES.map(function (s) {
      return sphereCard(s.code, '#/professions?sphere=' + s.code);
    }).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Полотно</p><h2 class="sec">Все профессии на одной карте</h2></div>' +
'<p class="muted" style="max-width:56ch">Площадь плитки — число программ в атласе, насыщенность цвета — индекс спроса. Нажмите на плитку, чтобы открыть профессию.</p></section>' +
'<div class="panel chart reveal treemap" id="treemap"></div>' +
'<div class="chart-legend">' + SPHERES.map(function (s) {
return '<span><i style="background:' + sphereColor(s.code) + '"></i>' + h(s.code + ' · ' + s.name) + '</span>';
}).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Спрос</p><h2 class="sec">Ведущие профессии по индексу спроса</h2></div>' +
'<a class="sec-link" href="#/professions?sort=index">Весь рейтинг →</a></section>' +
'<div class="panel chart reveal"><div class="chart-head"><p class="label">Индекс спроса · 0–100 <button class="index-hint" aria-label="Что такое индекс спроса" title="Что такое индекс спроса">?</button></p>' +
'<p class="mono tiny" style="color:var(--ink-4)">оценка атласа</p></div>' +
'<div class="index-tooltip" hidden><p>Комбинация числа вакансий, динамики к 2030 и дефицита специалистов. 100 — максимальный спрос.</p></div><div class="bars">' +
top.map(function (p) {
return '<div class="bar-row"><a class="n" href="#/professions/' + p.slug + '">' + h(p.title) + '</a>' +
'<div class="bar-track"><div class="bar-fill" data-v="' + (p.index / 100) + '"></div></div>' +
'<span class="v">' + p.index + '</span></div>';
}).join('') +
'</div></div>' +
'<div class="cta-block reveal"><a class="btn btn-primary" href="#/quiz">Пройти опросник и подобрать программы →</a></div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Рост к 2030</p><h2 class="sec">Профессии с самым быстрым ростом</h2></div>' +
'<a class="sec-link" href="#/professions?sort=growth">Весь каталог →</a></section>' +
'<div class="fgrid">' + featured.map(fcard).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">После 11 класса</p><h2 class="sec">Вузы с наиболее высокими баллами</h2></div>' +
'<a class="sec-link" href="#/universities">Все вузы и баллы →</a></section>' +
'<div class="uni-grid">' + uniTop.map(uniMini).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">После 9 класса</p><h2 class="sec">Колледжи с коротким маршрутом к профессии</h2></div>' +
'<a class="sec-link" href="#/colleges">Все ' + C.length + ' специальностей →</a></section>' +
'<div class="card-grid">' + colTop.map(collegeCard).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Специальности</p><h2 class="sec">От кода специальности до вуза</h2></div>' +
'<a class="sec-link" href="#/specialties">Все ' + SPECIALTIES.length + ' специальностей →</a></section>' +
'<div class="spec-grid">' + specTop.map(specMini).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">География</p><h2 class="sec">' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах') + '</h2></div>' +
'<a class="sec-link" href="#/regions">Все федеральные округа →</a></section>' +
'<div class="geo-grid">' + geoTop.map(districtCard).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Принципы</p><h2 class="sec">Чем этот атлас отличается</h2></div>' +
'<a class="sec-link" href="#/about">Подробнее о проекте →</a></section>' +
'<div class="adv-grid">' +
advCard('01', 'Единый маршрут: профессия → программа → ЕГЭ → балл', 'Атлас связывает спрос, специальность, набор экзаменов и оценку шансов на бюджет в последовательный маршрут.') +
advCard('02', 'Открытая методика вместо непрозрачного рейтинга', 'Индекс спроса рассчитывается по опубликованным правилам, а проходные баллы сопровождаются указанием источника и года приёмной кампании.') +
advCard('03', 'Оценка шансов, а не только каталог', 'Опросник учитывает предметы ЕГЭ, сферу и сумму баллов, показывает покрытие программ и пограничную зону в 10 баллов.') +
advCard('04', 'Все федеральные округа', DISTRICTS.length + ' ' + plural(DISTRICTS.length, 'округ', 'округа', 'округов') + ', ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регион', 'региона', 'регионов') + ' и ' + CITIES.length + ' ' + plural(CITIES.length, 'город', 'города', 'городов') + ': от Калининграда и Мурманска до Владивостока, Якутска и Петропавловска-Камчатского.') +
advCard('05', 'Работает без регистрации и отслеживания', 'Все расчёты выполняются в браузере. Ответы опросника и список сравнения хранятся только в этом браузере, а данные доступны в открытом JSON.') +
advCard('06', 'Сравнение и печатный отчёт', 'До трёх профессий рядом, понятные критерии и отчёт, который можно сохранить в PDF и обсудить с родителями, педагогом или консультантом.') +
'</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Методология</p><h2 class="sec">Источники и расчёт показателей</h2></div>' +
'<a class="sec-link" href="#/methodology">Читать полностью →</a></section>' +
'<div class="panel reveal" style="padding:26px;display:grid;gap:26px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">' +
'<div><h3 style="font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px">Индекс спроса</h3>' +
'<p class="muted">Комбинация числа вакансий, динамики к 2030 году и дефицита специалистов. 100 — максимальный спрос.</p></div>' +
'<div><h3 style="font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px">Проходные баллы</h3>' +
'<p class="muted">Ориентировочные значения по итогам приёмных кампаний 2024–2025 годов. Сумма трёх экзаменов ЕГЭ, максимум 300.</p></div>' +
'<div><h3 style="font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px">Прозрачность</h3>' +
'<p class="muted">Все расчёты выполняются в браузере. Ответы опросника не отправляются на сервер: они хранятся только в этом браузере и открываются кнопкой «Мой выбор» в шапке.</p></div>' +
'</div>' +
'</div>';
renderTreemap();
}
function sortBtn(key, label, active) {
return '<button data-sort="' + key + '" aria-pressed="' + (active === key ? 'true' : 'false') + '">' + label + '</button>';
}
function sphereChip(code, label, active) {
return '<button class="chip" data-sphere="' + h(code) + '" aria-pressed="' + (active === code ? 'true' : 'false') + '">' + h(label) + '</button>';
}
function profRow(p) {
return '<li class="prof-row">' +
'<span class="rank">' + h(p.rank) + '</span>' +
'<div class="t-cell"><span class="pmark-row">' + profMark(p.slug, p.sphereCode) + '</span>' +
'<a class="t" href="#/professions/' + p.slug + '">' + h(p.title) + '</a>' +
'<span class="d">' + h(p.desc) + '</span></div>' +
'<div class="meta"><span class="sph">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</span>' +
'<div class="metrics"><span class="idx" title="Индекс спроса">' + p.index + '</span>' +
'<span class="gr" title="Рост вакансий к 2030">+' + p.growth + '%</span>' +
'<span class="sal">' + h(p.salary) + '</span></div></div>' +
'<div class="row-acts">' + favButton(p, 'fav-row') +
'<button class="cmp" data-slug="' + p.slug + '" aria-pressed="false" aria-label="Сравнить: ' + h(p.title) + '" title="Добавить к сравнению">' +
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>' +
'</button></div></li>';
}
function parseExamParam(str) {
if (!str) return [];
return str.split(',').filter(function (s) { return SUBJECTS.indexOf(s) >= 0; }).slice(0, 3);
}
function filteredProfessions(st) {
var q = norm(st.q);
var exams = st.exams || [];
var list = P.filter(function (p) {
if (st.sphere && p.sphereCode !== st.sphere) return false;
if (exams.length) {
var progs = PROG[p.slug] || [];
if (!progs.some(function (pr) { return fitsEge(pr.ege, exams); })) return false;
}
if (!q) return true;
return norm(p.title + ' ' + p.desc + ' ' + p.sphere + ' ' + p.sphereCode).indexOf(q) >= 0;
});
list.sort(function (a, b) {
if (st.sort === 'growth') return b.growth - a.growth;
if (st.sort === 'salary') return num(b.salary) - num(a.salary);
if (st.sort === 'alpha') return a.title.localeCompare(b.title, 'ru');
return b.index - a.index;
});
return list;
}
function renderProfessions(m, q) {
var st = { q: q.get('q') || '', sphere: q.get('sphere') || '', sort: q.get('sort') || 'index', exams: parseExamParam(q.get('e')) };
if (st.sphere && !SPHERES.some(function (s) { return s.code === st.sphere; })) st.sphere = '';
setTitle('Профессии 2027–2030 — Профессии·2030');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел III · Каталог</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Профессии горизонта <em>2027–2030</em></h1>' +
'<p class="lead">' + P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') +
' с оценкой спроса, ростом вакансий и зарплатным диапазоном. Фильтруйте по сфере, ищите по названию и сравнивайте до трёх позиций.</p>' +
'</section>' +
'<div class="toolbar">' +
'<label class="search-field"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
'<input id="profSearch" type="text" placeholder="Найти профессию: инженер, данные, право…" value="' + h(st.q) + '" aria-label="Поиск по профессиям"></label>' +
'<div class="sort" id="profSort">' +
sortBtn('index', 'По индексу', st.sort) +
sortBtn('growth', 'По росту', st.sort) +
sortBtn('salary', 'По зарплате', st.sort) +
sortBtn('alpha', 'По алфавиту', st.sort) +
'</div>' +
'<button class="btn btn-sm dice-btn" id="randomProf" type="button" title="Открыть случайную профессию">' +
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 2.5 21 7v10l-9 4.5L3 17V7z"/><path d="M12 12v9.5M3 7l9 5 9-5"/></svg>' +
'<span>Мне повезёт</span>' +
'</button>' +
'</div>' +
'<div class="chips" id="sphereChips" style="margin-top:14px">' +
sphereChip('', 'Все сферы', st.sphere) +
SPHERES.map(function (s) { return sphereChip(s.code, s.code + ' · ' + s.name, st.sphere); }).join('') +
'</div>' +
'<div class="sph-row">' + SPHERES.map(function (s) {
  return sphereCard(s.code, '#/professions?sphere=' + s.code, 'sph-sm');
}).join('') + '</div>' +
(st.exams.length
? '<div class="myfilter" id="myFilter"><span>Фильтр «Мой выбор» · ЕГЭ: ' + h(st.exams.join(' · ')) +
(st.sphere ? ' · ' + h(st.sphere) : '') + '</span>' +
'<button type="button" id="clearE">Сбросить</button></div>'
: '') +
'<div class="list-head"><span>№</span><span>Профессия</span><span>Сфера · индекс · рост · зарплата</span><span></span></div>' +
'<ul class="prof-list" id="profList"></ul>' +
'<p class="mono tiny" id="profCount" style="margin-top:16px;color:var(--ink-4)"></p>' +
'</div>';
var listEl = document.getElementById('profList');
var countEl = document.getElementById('profCount');
var searchEl = document.getElementById('profSearch');
function repaint() {
var list = filteredProfessions(st);
listEl.innerHTML = list.length ? list.map(profRow).join('') :
'<li class="empty"><b>Ничего не найдено</b>' +
(st.exams.length
? 'Под фильтр «Мой выбор» не подошла ни одна профессия. Измените предметы в опроснике или сбросьте фильтр.'
: 'Попробуйте другой запрос или сбросьте фильтр сферы.') +
'<button class="btn btn-sm" type="button" id="profReset" style="margin-top:14px">Сбросить фильтры</button></li>';
countEl.textContent = 'Показано ' + list.length + ' из ' + P.length;
if (document.getElementById('bubbleChart')) drawBubble(list, true);
listEl.classList.remove('swap');
void listEl.offsetWidth;
listEl.classList.add('swap');
updateCompare();
var params = new URLSearchParams();
if (st.q) params.set('q', st.q);
if (st.sphere) params.set('sphere', st.sphere);
if (st.sort !== 'index') params.set('sort', st.sort);
if (st.exams.length) params.set('e', st.exams.join(','));
syncUrl('/professions', params);
}
var timer;
searchEl.addEventListener('input', function () {
clearTimeout(timer);
timer = setTimeout(function () { st.q = searchEl.value; repaint(); }, 140);
});
document.getElementById('profSort').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sort]');
if (!b) return;
st.sort = b.getAttribute('data-sort');
document.querySelectorAll('#profSort button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
document.getElementById('sphereChips').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sphere]');
if (!b) return;
st.sphere = b.getAttribute('data-sphere');
document.querySelectorAll('#sphereChips button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
listEl.addEventListener('click', function (e) {
var reset = e.target.closest('#profReset');
if (reset) {
e.preventDefault();
resetFilters();
return;
}
var prof = e.target.closest('a[href^="#/professions/"]');
if (prof) saveCatalogState();
var b = e.target.closest('.cmp');
if (!b) return;
toggleCompare(b.getAttribute('data-slug'));
});
function resetFilters() {
st.q = '';
st.sphere = '';
st.exams = [];
if (searchEl) searchEl.value = '';
document.querySelectorAll('#sphereChips button').forEach(function (x) {
x.setAttribute('aria-pressed', x.getAttribute('data-sphere') === '' ? 'true' : 'false');
});
var mf = document.getElementById('myFilter');
if (mf) mf.remove();
repaint();
}
var clearE = document.getElementById('clearE');
if (clearE) clearE.addEventListener('click', function () {
st.exams = [];
document.getElementById('myFilter').remove();
repaint();
});
var randomBtn = document.getElementById('randomProf');
if (randomBtn) randomBtn.addEventListener('click', function () {
var pool = filteredProfessions(st);
if (!pool.length) pool = P;
var pick = pool[Math.floor(Math.random() * pool.length)];
randomBtn.classList.add('spin');
setTimeout(function () { location.hash = '#/professions/' + pick.slug; }, 200);
});
var viewP = app.querySelector('.view');
if (viewP && !document.getElementById('bubbleChart')) {
viewP.insertAdjacentHTML('beforeend', bubbleSection());
bindChart(document.getElementById('bubbleChart'));
drawBubble(filteredProfessions(st));
}
repaint();
/* Возврат из профессии: восстанавливаем позицию списка и снятые фильтры. */
var back = catalogState();
if (back && back.q !== undefined) {
if (currentQuery() === back.q && typeof back.y === 'number') {
requestAnimationFrame(function () { window.scrollTo(0, back.y); });
}
clearCatalogState();
}
}
function uniRow(pr) {
return '<tr><td data-label="Направление">' + h(pr.direction) + '<span class="code">' + h(pr.code) + '</span></td>' +
'<td data-label="Профессия">' + (pr.professionSlug ? '<a href="#/professions/' + pr.professionSlug + '">' + h(pr.profession) + '</a>' : h(pr.profession)) + '</td>' +
'<td data-label="ЕГЭ">' + h(pr.ege) + '</td>' +
'<td data-label="Бюджет" class="b">' + (pr.budget ? '≈' + h(pr.budget) : '—') + '</td>' +
'<td data-label="Платно" class="p">' + (pr.paid ? '≈' + h(pr.paid) : '—') + '</td></tr>';
}
function uniCard(u) {
var more = u.programs.length > 4
? '<button class="more-btn" data-more data-label="Показать все ' + u.programs.length + ' ' +
plural(u.programs.length, 'направление', 'направления', 'направлений') + '">Показать все ' +
u.programs.length + ' ' + plural(u.programs.length, 'направление', 'направления', 'направлений') + ' ↓</button>'
: '';
return '<section class="panel uni reveal">' +
'<div class="uni-top"><div><p class="uni-city">' + h(u.region) + ' · ' + h(u.city) + '</p><h3>' + h(u.short) + '</h3>' +
'<p class="full">' + h(u.full) + '</p></div>' +
'<div class="uni-score"><span class="v">≈' + u.avg + '</span><span class="k">средний балл на бюджет</span></div></div>' +
'<p class="uni-places mono tiny">≈' + uniPlaces(u) + ' ' + plural(uniPlaces(u), 'бюджетное место', 'бюджетных места', 'бюджетных мест') +
' · ' + h(u.format) + (u.dorm ? ' · общежитие' : '') +
' · <a href="#/admission">история баллов →</a> · <a href="#/compare?unis=' + encodeURIComponent(u.short) + '">сравнить вуз</a></p>' +
'<div class="tbl-wrap"><table class="data"><thead><tr><th>Направление</th><th>Профессия</th><th>ЕГЭ</th>' +
'<th>Бюджет</th><th>Платно</th></tr></thead><tbody>' + u.programs.map(uniRow).join('') + '</tbody></table></div>' +
more + '</section>';
}
function filteredUnis(st) {
var q = norm(st.q);
return U.filter(function (u) {
if (st.district && u.district !== st.district) return false;
if (st.region && u.region !== st.region) return false;
if (st.city && u.city !== st.city) return false;
if (st.minAvg && Number(u.avg || 0) < st.minAvg) return false;
if (st.format && u.format && u.format !== st.format) return false;
if (st.dorm === 'yes' && u.dorm === false) return false;
if (st.dorm === 'no' && u.dorm === true) return false;
if (st.mode === 'budget' && !u.programs.some(function (p) { return !!p.budget; })) return false;
if (st.mode === 'paid' && !u.programs.some(function (p) { return !!p.paid; })) return false;
if (st.exam && !u.programs.some(function (p) { return String(p.ege || '').indexOf(st.exam) >= 0; })) return false;
if (!q) return true;
var hay = u.short + ' ' + u.full + ' ' + u.city + ' ' + u.region + ' ' + u.district + ' ' + u.programs.map(function (p) {
return p.direction + ' ' + p.profession + ' ' + p.code;
}).join(' ');
return norm(hay).indexOf(q) >= 0;
}).sort(function (a, b) {
if (st.sort === 'name') return a.short.localeCompare(b.short, 'ru');
if (st.sort === 'programs') return b.programs.length - a.programs.length;
return b.avg - a.avg;
});
}
function regionOptions(st) {
function option(r) {
return '<option value="' + h(r.name) + '">' + h(r.name) + ' · ' + r.count + ' ' +
plural(r.count, 'вуз', 'вуза', 'вузов') + '</option>';
}
if (st.district) {
return '<option value="">Все регионы округа</option>' +
REGIONS.filter(function (r) { return r.district === st.district; }).map(option).join('');
}
return '<option value="">Все регионы</option>' + FEDERAL.map(function (d) {
var list = REGIONS.filter(function (r) { return r.district === d.code; });
if (!list.length) return '';
return '<optgroup label="' + h(d.code + ' · ' + d.name) + '">' + list.map(option).join('') + '</optgroup>';
}).join('');
}
function groupedUnis(list, st) {
var out = '';
FEDERAL.forEach(function (d) {
var inDistrict = list.filter(function (u) { return u.district === d.code; });
if (!inDistrict.length) return;
var regions = REGIONS.filter(function (r) {
return r.district === d.code && inDistrict.some(function (u) { return u.region === r.name; });
});
out += '<section class="district-block">' +
'<div class="district-head"><div><p class="eyebrow">' + h(d.code) + '</p><h2 class="sec">' + h(d.name) + '</h2></div>' +
'<p class="mono tiny">' + inDistrict.length + ' ' + plural(inDistrict.length, 'вуз', 'вуза', 'вузов') + ' · ' +
regions.length + ' ' + plural(regions.length, 'регион', 'региона', 'регионов') + '</p></div>' +
regions.map(function (r) {
var regionUnis = inDistrict.filter(function (u) { return u.region === r.name; });
var programs = regionUnis.reduce(function (n, u) { return n + u.programs.length; }, 0);
return '<div class="region-block">' +
'<div class="region-head"><h3>' + h(r.name) + '</h3>' +
'<span class="mono tiny">' + regionUnis.length + ' ' + plural(regionUnis.length, 'вуз', 'вуза', 'вузов') +
' · ' + programs + ' ' + plural(programs, 'программа', 'программы', 'программ') + ' · средний балл ≈' + r.avg + '</span></div>' +
'<div class="uni-grid">' + regionUnis.map(uniCard).join('') + '</div>' +
'</div>';
}).join('') +
'</section>';
});
return out;
}
function admissionRows(st) {
var rows = [];
U.forEach(function (u) {
if (st.district && u.district !== st.district) return;
(u.programs || []).forEach(function (pr) {
if (!num(pr.budget)) return;
var s = progStats(pr, u);
rows.push({ u: u, pr: pr, s: s, g: s.hist[2] - s.hist[0] });
});
});
if (st.sort === 'growth') rows.sort(function (a, b) { return b.g - a.g || b.s.places - a.s.places; });
else if (st.sort === 'score') rows.sort(function (a, b) { return num(b.pr.budget) - num(a.pr.budget); });
else rows.sort(function (a, b) { return b.s.places - a.s.places || num(b.pr.budget) - num(a.pr.budget); });
return rows;
}
function admRow(r) {
var u = r.u, pr = r.pr, s = r.s;
return '<tr><td data-label="Вуз"><a href="#/universities?q=' + encodeURIComponent(u.short) + '">' + h(u.short) + '</a>' +
'<span class="code">' + h(u.city) + ' · ' + h(u.district) + '</span></td>' +
'<td data-label="Направление">' + h(pr.direction) + '<span class="code">' + h(pr.code) +
(pr.professionSlug ? ' · <a href="#/professions/' + pr.professionSlug + '">' + h(pr.profession) + '</a>' : '') + '</span></td>' +
'<td data-label="Мест" class="b">≈' + s.places + '</td>' +
'<td data-label="2023" class="yr">' + s.hist[0] + '</td>' +
'<td data-label="2024" class="yr">' + s.hist[1] + '</td>' +
'<td data-label="2025" class="yr">' + s.hist[2] + '</td>' +
'<td data-label="Динамика">' + trendHtml(s) + spark(s.hist) + '</td></tr>';
}
function renderAdmission(m, q) {
var st = { sort: q.get('sort') || 'places', district: q.get('district') || '' };
if (['places', 'growth', 'score'].indexOf(st.sort) < 0) st.sort = 'places';
if (st.district && !districtByCode(st.district)) st.district = '';
setTitle('Бюджетные места и история баллов — Профессии·2030');
var rows = admissionRows(st);
var places = rows.reduce(function (n, r) { return n + r.s.places; }, 0);
var up = rows.filter(function (r) { return r.g > 0; }).length;
var avg = rows.length ? Math.round(rows.reduce(function (n, r) { return n + r.g; }, 0) / rows.length * 10) / 10 : 0;
var shown = rows.slice(0, 40);
function kpi(v, k) {
return '<div class="kpi"><span class="v">' + v + '</span><span class="k">' + k + '</span></div>';
}
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел IV · Приём</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Бюджетные места и <em>история баллов</em></h1>' +
'<p class="lead">Приёмная ёмкость ' + ADM.n + ' программ и динамика проходного балла за 2023–2025 годы. ' +
'Значения с пометкой «≈» — расчётная оценка атласа для ориентира, а не официальные контрольные цифры приёма.</p>' +
'</section>' +
'<div class="adm-kpi">' +
kpi('≈' + places.toLocaleString('ru-RU'), 'бюджетных мест в выборке') +
kpi(rows.length, 'программ с баллами') +
kpi(Math.round(up / (rows.length || 1) * 100) + '%', 'программ с ростом · ' + up) +
kpi((avg > 0 ? '+' : '') + String(avg).replace('.', ','), 'средний рост за два года') +
'</div>' +
'<div class="tip"><b>Что означают цифры.</b> «Мест» — оценка количества бюджетных мест по программе. ' +
'Столбцы 2023–2025 — проходной балл на бюджет (сумма трёх ЕГЭ). Динамика показывает разницу между 2025 и 2023 годом: ' +
'рост выделен зелёным, снижение — красным. Официальные КЦП и баллы публикуют приёмные комиссии вузов.</div>' +
'<div class="toolbar">' +
'<div class="sort" id="admSort">' +
sortBtn('places', 'По местам', st.sort) +
sortBtn('growth', 'По росту балла', st.sort) +
sortBtn('score', 'По баллу', st.sort) +
'</div>' +
'<label class="select-field" for="admDistrict" style="margin-left:auto"><span class="label">Округ</span>' +
'<select id="admDistrict"><option value="">Все округа</option>' +
FEDERAL.map(function (d) {
return '<option value="' + h(d.code) + '"' + (st.district === d.code ? ' selected' : '') + '>' +
h(d.code + ' · ' + d.short) + '</option>';
}).join('') +
'</select></label>' +
'</div>' +
'<div class="panel adm-panel"><div class="tbl-wrap"><table class="data adm-table">' +
'<thead><tr><th>Вуз</th><th>Направление</th><th>Мест</th><th>2023</th><th>2024</th><th>2025</th><th>Динамика</th></tr></thead>' +
'<tbody>' + shown.map(admRow).join('') + '</tbody></table></div></div>' +
'<p class="quiz-note">Показаны 40 программ из ' + rows.length + '. Сортировка и округ сохраняются в ссылке — ' +
'результат можно отправить.</p>' +
'<div class="hero-cta" style="margin-top:20px"><a class="btn btn-primary" href="#/universities">Все вузы и направления</a>' +
'<a class="btn" href="#/methodology">Как считаются оценки</a></div>' +
'</div>';
document.getElementById('admSort').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sort]');
if (!b) return;
var p = new URLSearchParams();
var s = b.getAttribute('data-sort');
if (s !== 'places') p.set('sort', s);
if (st.district) p.set('district', st.district);
location.hash = '#/admission' + (p.toString() ? '?' + p.toString() : '');
});
document.getElementById('admDistrict').addEventListener('change', function (e) {
var p = new URLSearchParams();
if (st.sort !== 'places') p.set('sort', st.sort);
if (e.target.value) p.set('district', e.target.value);
location.hash = '#/admission' + (p.toString() ? '?' + p.toString() : '');
});
}
function renderCalendar(m, q) {
var level = q.get('level') === '9' ? '9' : '11';
setTitle('Календарь приёмной кампании — Профессии·2030');
var CAL_11 = [
{ ym: '2026-09', month: 'Сентябрь 2026', items: [
'Определить обязательные и профильные предметы ЕГЭ, сверить их с перечнем вступительных испытаний на сайтах вузов.',
'Составить предварительный список из 5–7 вузов и 2–3 направлений в каждом.'
] },
{ ym: '2026-10', month: 'Октябрь 2026', items: [
'Посетить дни открытых дверей и уточнить правила приёма, сроки и порядок учёта индивидуальных достижений.',
'Начать подготовку к профильным экзаменам по выбранным направлениям.'
] },
{ ym: '2026-11', month: 'Ноябрь 2026', items: [
'Написать итоговое сочинение в основной срок; уточнить, учитывает ли его выбранный вуз.',
'Пройти первые пробные экзамены и зафиксировать дефицит баллов.'
] },
{ ym: '2026-12', month: 'Декабрь 2026', items: [
'Получить допуск к ЕГЭ по итогам итогового сочинения.',
'Проверить сроки регистрации на ЕГЭ: обычно заявление подают до 1 февраля, точную дату уточнять в школе.'
] },
{ ym: '2027-01', month: 'Январь 2027', items: [
'Подать заявление на ЕГЭ с окончательным набором предметов.',
'Сверить перечень экзаменов для каждого направления и при необходимости добавить профильную математику.'
] },
{ ym: '2027-02', month: 'Февраль 2027', items: [
'Завершить выбор вузов и направлений.',
'Сравнить проходные баллы 2024–2025 годов и оценить шансы на бюджет.'
] },
{ ym: '2027-03', month: 'Март 2027', items: [
'Пройти пробные экзамены по всем выбранным предметам.',
'Уточнить особые права, олимпиады и порядок учёта индивидуальных достижений.'
] },
{ ym: '2027-04', month: 'Апрель 2027', items: [
'Проверить расписание ЕГЭ и правила подачи документов в каждом вузе.',
'Подготовить копии документов и портфолио.'
] },
{ ym: '2027-05', month: 'Май 2027', items: [
'Завершить подготовку и уточнить даты начала приёма документов.',
'Проверить работу личных кабинетов приёмных комиссий.'
] },
{ ym: '2027-06', month: 'Июнь 2027', items: [
'Сдать ЕГЭ и получить результаты.',
'Подать документы в выбранные вузы; традиционно приём стартует с 20 июня, точные даты устанавливает вуз.'
] },
{ ym: '2027-07', month: 'Июль 2027', items: [
'Следить за конкурсными списками и сроками согласия на зачисление.',
'При необходимости пройти дополнительные вступительные испытания.'
] },
{ ym: '2027-08', month: 'Август 2027', items: [
'Дождаться приказа о зачислении и проверить его на сайте вуза.',
'При наличии мест участвовать в дополнительном наборе; подготовить документы к началу учёбы.'
] }
];
var CAL_9 = [
{ ym: '2026-09', month: 'Сентябрь 2026', items: [
'Выбрать направление СПО и проверить перечень специальностей в колледжах.',
'Уточнить, какие предметы ОГЭ и средний балл аттестата нужны для поступления.'
] },
{ ym: '2026-10', month: 'Октябрь 2026', items: [
'Посетить дни открытых дверей колледжей.',
'Сравнить условия приёма, наличие общежития и сроки обучения.'
] },
{ ym: '2026-11', month: 'Ноябрь 2026', items: [
'Начать подготовку к ОГЭ по обязательным и профильным предметам.',
'Уточнить, учитывает ли колледж портфолио и индивидуальные достижения.'
] },
{ ym: '2026-12', month: 'Декабрь 2026', items: [
'Проверить правила приёма и перечень документов на сайтах колледжей.',
'Собрать документы о достижениях, если они учитываются.'
] },
{ ym: '2027-01', month: 'Январь 2027', items: [
'Зарегистрироваться на ОГЭ; точные сроки уточнять в школе.',
'Определить 3–5 колледжей и специальностей для подачи документов.'
] },
{ ym: '2027-02', month: 'Февраль 2027', items: [
'Сравнить средние баллы аттестата и конкурсные списки прошлых лет.',
'Уточнить, есть ли вступительные испытания или собеседование.'
] },
{ ym: '2027-03', month: 'Март 2027', items: [
'Пройти пробные ОГЭ и проверить готовность по профильным предметам.',
'Уточнить порядок подачи документов и график работы приёмной комиссии.'
] },
{ ym: '2027-04', month: 'Апрель 2027', items: [
'Подготовить паспорт, аттестат, результаты ОГЭ и копии документов.',
'Проверить требования к медицинским справкам и портфолио.'
] },
{ ym: '2027-05', month: 'Май 2027', items: [
'Сдать ОГЭ и получить результаты.',
'Уточнить даты начала приёма и способы подачи документов.'
] },
{ ym: '2027-06', month: 'Июнь 2027', items: [
'Подать документы в выбранные колледжи; традиционно приём стартует с 20 июня, точные даты устанавливает колледж.',
'Сохранить номера заявлений и подтверждения отправки документов.'
] },
{ ym: '2027-07', month: 'Июль 2027', items: [
'Следить за конкурсными списками и сроками подтверждения согласия.',
'При необходимости пройти собеседование или дополнительное испытание.'
] },
{ ym: '2027-08', month: 'Август 2027', items: [
'Дождаться приказа о зачислении.',
'При наличии мест участвовать в дополнительном наборе; подготовить документы к учёбе.'
] }
];
var data = level === '9' ? CAL_9 : CAL_11;
var now = new Date();
function pad2(n) { return n < 10 ? '0' + n : String(n); }
var nowYm = now.getFullYear() + '-' + pad2(now.getMonth() + 1);
var cards = data.map(function (x, i) {
var isNow = x.ym === nowYm;
return '<article class="cal-card' + (isNow ? ' is-now' : '') + '">' +
'<div class="cal-top"><span class="cal-num">' + pad2(i + 1) + '</span><span class="cal-month">' + h(x.month) + '</span>' +
(isNow ? '<span class="cal-now">сейчас</span>' : '') + '</div>' +
'<ul>' + x.items.map(function (t) { return '<li>' + h(t) + '</li>'; }).join('') + '</ul></article>';
}).join('');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел V · Приём</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Календарь <em>приёмной кампании</em></h1>' +
'<p class="lead">Ориентировочная последовательность действий для поступления в 2027 году. Точные даты, перечень документов и правила устанавливает вуз или колледж — проверяйте их на сайте приёмной комиссии.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/quiz">Подобрать программы</a>' +
'<a class="btn" href="#/admission">Бюджетные места</a>' +
'<a class="btn" href="#/universities">Вузы и баллы</a></div>' +
'</section>' +
'<div class="cal-tabs" role="group" aria-label="Уровень поступления">' +
'<button type="button" data-cal-tab="11" aria-pressed="' + (level === '11' ? 'true' : 'false') + '">После 11 класса</button>' +
'<button type="button" data-cal-tab="9" aria-pressed="' + (level === '9' ? 'true' : 'false') + '">После 9 класса</button>' +
'</div>' +
'<div class="tip"><b>Как пользоваться календарём.</b> Этапы расположены по месяцам учебного года. Даты в разных вузах могут отличаться: сверяйте их с правилами приёма и не ориентируйтесь только на этот список.</div>' +
'<div class="cal-grid">' + cards + '</div>' +
'<section class="cal-extra">' +
'<div class="panel cal-panel"><p class="label">Что подготовить заранее</p><ul class="cal-check">' +
'<li>Паспорт и СНИЛС, аттестат или его копию.</li>' +
'<li>Результаты ЕГЭ или ОГЭ, документы о льготах и индивидуальных достижениях.</li>' +
'<li>Список вузов или колледжей с направлениями и условиями приёма.</li>' +
'<li>Логины и пароли от личных кабинетов приёмных комиссий.</li>' +
'</ul></div>' +
'<div class="panel cal-panel"><p class="label">Как не пропустить срок</p><ul class="cal-check">' +
'<li>Сверяйте даты на сайте каждого вуза или колледжа, а не только в справочниках.</li>' +
'<li>Проверяйте часовой пояс и время закрытия приёма документов.</li>' +
'<li>Сохраняйте подтверждения отправки документов и номера заявлений.</li>' +
'<li>Уточняйте в приёмной комиссии спорные формулировки и особые права.</li>' +
'</ul></div>' +
'</section>' +
'<p class="mono tiny" style="margin-top:18px;color:var(--ink-4)">Календарь носит ориентировочный характер и не заменяет правила приёма. Актуальные сроки публикуют приёмные комиссии.</p>' +
'</div>';
document.querySelectorAll('[data-cal-tab]').forEach(function (b) {
b.addEventListener('click', function () {
var next = b.getAttribute('data-cal-tab');
if (next === level) return;
location.hash = '#/calendar' + (next === '9' ? '?level=9' : '');
});
});
}
function renderFavorites() {
setTitle('Избранное — Профессии·2030');
var list = favorites.map(function (slug) { return PROF_BY_SLUG[slug]; }).filter(Boolean);
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел · Избранное</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Избранные <em>профессии</em></h1>' +
'<p class="lead">Профессии, отмеченные звёздочкой. Список хранится только в этом браузере и не ограничен по количеству; сравнение по-прежнему вмещает до трёх позиций.</p>' +
(list.length ? '<div class="fav-print-head"><p class="label">Подборка для класса</p>' +
'<h2 class="sec">' + list.length + ' ' + plural(list.length, 'профессия', 'профессии', 'профессий') + ' для обсуждения</h2>' +
'<p class="muted">Атлас «Профессии·2030» · данные собраны 26 октября 2026 · проходные баллы — приёмные кампании 2024–2025</p></div>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/professions">Открыть каталог</a>' +
'<button class="btn btn-sm" type="button" id="favPrint">Распечатать</button>' +
'<button class="btn btn-sm" type="button" id="favClear">Очистить избранное</button></div>' : '') +
'</section>' +
(list.length
? '<div class="fgrid fav-grid">' + list.map(fcard).join('') + '</div>' +
'<p class="mono tiny" style="margin-top:16px;color:var(--ink-4)">' + list.length + ' ' +
plural(list.length, 'профессия', 'профессии', 'профессий') + ' в избранном. Отметки сохраняются после перезагрузки страницы.</p>'
: '<div class="empty"><b>Пока пусто</b>Добавляйте профессии звёздочкой в каталоге или на странице профессии. <a href="#/professions">Перейти в каталог</a></div>') +
'</div>';
var clear = document.getElementById('favClear');
if (clear) clear.addEventListener('click', function () {
if (!favorites.length) return;
favorites.length = 0;
saveFavorites();
updateFavoritesUI();
renderFavorites();
toast('Избранное очищено');
});
var printBtn = document.getElementById('favPrint');
if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
/* Прямой перерендер после удаления звезды не проходит через route(),
   поэтому заново подключаем появление карточек .reveal. */
initReveal();
}
function renderUniversities(m, q) {
var st = { q: q.get('q') || '', district: q.get('district') || '', region: q.get('region') || '', city: q.get('city') || '', mode: q.get('mode') || '', format: q.get('format') || '', dorm: q.get('dorm') || '', exam: q.get('exam') || '', minAvg: parseInt(q.get('minAvg') || '0', 10), sort: q.get('sort') || 'avg' };
if (st.district && !districtByCode(st.district)) st.district = '';
if (st.region) {
var rr = REGION_BY_NAME[st.region];
if (!rr) st.region = '';
else if (st.district && rr.district !== st.district) st.region = '';
else if (!st.district) st.district = rr.district;
}
setTitle('Вузы по регионам — Профессии·2030');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел IV · После 11 класса</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Вузы <em>по регионам</em></h1>' +
'<p class="lead">' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах') + ' и ' + DISTRICTS.length + ' федеральных округах. Направления, наборы ЕГЭ и ориентировочные баллы на бюджет и платное обучение. Сумма трёх экзаменов, максимум 300.</p>' +
'<p class="source-note">Каталог — выборка вузов с открытыми данными о программах и баллах, а не полный список вузов страны. ' +
'Условия, льготы и даты приёма всегда уточняйте на сайте вуза.</p>' +
'</section>' +
'<div class="toolbar">' +
'<label class="search-field"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
'<input id="uniSearch" type="text" placeholder="Вуз, регион, город или направление…" value="' + h(st.q) + '" aria-label="Поиск по вузам"></label>' +
'<div class="sort" id="uniSort">' +
sortBtn('avg', 'По баллу', st.sort) +
sortBtn('programs', 'По программам', st.sort) +
sortBtn('name', 'По алфавиту', st.sort) +
'</div>' +
'</div>' +
'<div class="filter-panel">' +
'<div class="filter-row"><span class="label">Федеральный округ</span>' +
'<div class="chips" id="districtChips">' +
sphereChip('', 'Все округа', st.district) +
FEDERAL.map(function (d) { return sphereChip(d.code, d.code + ' · ' + d.short, st.district); }).join('') +
'</div>' +
'</div>' +
'<div class="filter-row"><label class="select-field" for="regionSelect"><span class="label">Регион</span>' +
'<select id="regionSelect">' + regionOptions(st) + '</select></label>' +
'</div>' +
'<div class="filter-row uni-practical"><label class="select-field" for="citySelect"><span class="label">Город</span><select id="citySelect"><option value="">Все города</option>' + CITIES.map(function (city) { return '<option value="' + h(city) + '"' + (st.city === city ? ' selected' : '') + '>' + h(city) + '</option>'; }).join('') + '</select></label>' +
'<label class="select-field" for="modeSelect"><span class="label">Форма финансирования</span><select id="modeSelect"><option value="">Бюджет и платное</option><option value="budget"' + (st.mode === 'budget' ? ' selected' : '') + '>Только бюджет</option><option value="paid"' + (st.mode === 'paid' ? ' selected' : '') + '>Только платное</option></select></label>' +
'<label class="select-field" for="examSelect"><span class="label">ЕГЭ</span><select id="examSelect"><option value="">Любые предметы</option>' + SUBJECTS.map(function (s) { return '<option value="' + s + '"' + (st.exam === s ? ' selected' : '') + '>' + h(SUBJ_FULL[s]) + '</option>'; }).join('') + '</select></label>' +
'<label class="select-field" for="formatSelect"><span class="label">Форма обучения</span><select id="formatSelect"><option value="">Любая</option><option value="очная"' + (st.format === 'очная' ? ' selected' : '') + '>Очная</option><option value="очно-заочная"' + (st.format === 'очно-заочная' ? ' selected' : '') + '>Очно-заочная</option></select></label>' +
'<label class="select-field" for="dormSelect"><span class="label">Общежитие</span><select id="dormSelect"><option value="">Не учитывать</option><option value="yes"' + (st.dorm === 'yes' ? ' selected' : '') + '>Есть</option><option value="no"' + (st.dorm === 'no' ? ' selected' : '') + '>Нет</option></select></label>' +
'<label class="select-field" for="minAvgSelect"><span class="label">Средний балл от</span><select id="minAvgSelect"><option value="0">Любой</option><option value="220"' + (st.minAvg === 220 ? ' selected' : '') + '>220+</option><option value="250"' + (st.minAvg === 250 ? ' selected' : '') + '>250+</option><option value="270"' + (st.minAvg === 270 ? ' selected' : '') + '>270+</option></select></label></div>' +
'</div>' +
'<p class="mono tiny" id="uniCount" style="margin-top:18px;color:var(--ink-4)"></p>' +
'<h2 class="sr-only">Список вузов по регионам</h2>' +
'<div id="uniGrid"></div>' +
'</div>';
var grid = document.getElementById('uniGrid');
var countEl = document.getElementById('uniCount');
var searchEl = document.getElementById('uniSearch');
var regionEl = document.getElementById('regionSelect');
var cityEl = document.getElementById('citySelect');
var modeEl = document.getElementById('modeSelect');
var examEl = document.getElementById('examSelect');
var formatEl = document.getElementById('formatSelect');
var dormEl = document.getElementById('dormSelect');
var minAvgEl = document.getElementById('minAvgSelect');
function repaint() {
var list = filteredUnis(st);
grid.innerHTML = list.length ? groupedUnis(list, st) :
'<div class="empty"><b>Ничего не найдено</b>Измените запрос или выберите другой федеральный округ.</div>';
var regionCount = [];
var districtCount = [];
list.forEach(function (u) {
if (regionCount.indexOf(u.region) < 0) regionCount.push(u.region);
if (districtCount.indexOf(u.district) < 0) districtCount.push(u.district);
});
countEl.textContent = 'Найдено ' + list.length + ' ' + plural(list.length, 'вуз', 'вуза', 'вузов') +
' в ' + regionCount.length + ' ' + plural(regionCount.length, 'регионе', 'регионах', 'регионах') +
' и ' + districtCount.length + ' ' + plural(districtCount.length, 'округе', 'округах', 'округах');
var params = new URLSearchParams();
if (st.q) params.set('q', st.q);
if (st.district) params.set('district', st.district);
if (st.region) params.set('region', st.region);
if (st.city) params.set('city', st.city);
if (st.mode) params.set('mode', st.mode);
if (st.exam) params.set('exam', st.exam);
if (st.format) params.set('format', st.format);
if (st.dorm) params.set('dorm', st.dorm);
if (st.minAvg) params.set('minAvg', st.minAvg);
if (st.sort !== 'avg') params.set('sort', st.sort);
syncUrl('/universities', params);
initReveal(grid);
}
var timer;
searchEl.addEventListener('input', function () {
clearTimeout(timer);
timer = setTimeout(function () { st.q = searchEl.value; repaint(); }, 140);
});
document.getElementById('uniSort').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sort]');
if (!b) return;
st.sort = b.getAttribute('data-sort');
document.querySelectorAll('#uniSort button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
document.getElementById('districtChips').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sphere]');
if (!b) return;
st.district = b.getAttribute('data-sphere');
st.region = '';
document.querySelectorAll('#districtChips button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
regionEl.innerHTML = regionOptions(st);
repaint();
});
regionEl.addEventListener('change', function () {
st.region = regionEl.value;
st.city = '';
if (st.region) {
var r = REGION_BY_NAME[st.region];
if (r) {
st.district = r.district;
document.querySelectorAll('#districtChips button').forEach(function (x) {
x.setAttribute('aria-pressed', x.getAttribute('data-sphere') === st.district ? 'true' : 'false');
});
regionEl.innerHTML = regionOptions(st);
regionEl.value = st.region;
cityEl.value = '';
}
}
repaint();
});
cityEl.addEventListener('change', function () { st.city = cityEl.value; repaint(); });
modeEl.addEventListener('change', function () { st.mode = modeEl.value; repaint(); });
examEl.addEventListener('change', function () { st.exam = examEl.value; repaint(); });
formatEl.addEventListener('change', function () { st.format = formatEl.value; repaint(); });
dormEl.addEventListener('change', function () { st.dorm = dormEl.value; repaint(); });
minAvgEl.addEventListener('change', function () { st.minAvg = parseInt(minAvgEl.value, 10) || 0; repaint(); });
grid.addEventListener('click', function (e) {
var b = e.target.closest('[data-more]');
if (!b) return;
var card = b.closest('.uni');
var open = card.classList.toggle('expanded');
b.textContent = open ? 'Свернуть ↑' : (b.getAttribute('data-label') || 'Показать все') + ' ↓';
});
repaint();
}
function collegeCard(c) {
return '<a class="panel cc reveal" href="#/colleges/' + c.slug + '">' +
'<div class="cc-top"><span>' + h(c.code) + '</span><span>' + h(c.sphereCode) + '</span></div>' +
'<h3>' + h(c.title) + '</h3>' +
'<p>' + h(c.desc) + '</p>' +
'<div class="meta"><span>' + h(c.duration) + '</span>' +
'<span>от ' + h(c.price) + ' · ' + c.count + ' ' + plural(c.count, 'колледж', 'колледжа', 'колледжей') + '</span></div>' +
'</a>';
}
function filteredColleges(st) {
var q = norm(st.q);
return C.filter(function (c) {
if (st.sphere && c.sphereCode !== st.sphere) return false;
if (!q) return true;
return norm(c.title + ' ' + c.desc + ' ' + c.code + ' ' + c.sphereCode).indexOf(q) >= 0;
}).sort(function (a, b) {
if (st.sort === 'alpha') return a.title.localeCompare(b.title, 'ru');
if (st.sort === 'price') return parseFloat(a.price) - parseFloat(b.price);
return b.count - a.count;
});
}
function renderColleges(m, q) {
var st = { q: q.get('q') || '', sphere: q.get('sphere') || '', sort: q.get('sort') || 'count' };
if (st.sphere && !SPHERES.some(function (s) { return s.code === st.sphere; })) st.sphere = '';
setTitle('После 9 класса: колледжи — Профессии·2030');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел V · После 9 класса</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Колледжи: <em>после 9 класса</em></h1>' +
'<p class="lead">' + C.length + ' ' + plural(C.length, 'специальность', 'специальности', 'специальностей') +
' среднего профессионального образования. Срок обучения, средний балл аттестата и профессии, в которые ведёт специальность.</p>' +
'<div class="hero-cta"><a class="btn btn-primary btn-sm" href="#/quiz-oge">Подобрать по ОГЭ</a>' +
'<a class="btn btn-sm" href="#/quiz">После 11 класса · ЕГЭ</a></div>' +
'</section>' +
'<div class="toolbar">' +
'<label class="search-field"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
'<input id="colSearch" type="text" placeholder="Специальность: программирование, медицина…" value="' + h(st.q) + '" aria-label="Поиск по колледжам"></label>' +
'<div class="sort" id="colSort">' +
sortBtn('count', 'По числу колледжей', st.sort) +
sortBtn('price', 'По баллу', st.sort) +
sortBtn('alpha', 'По алфавиту', st.sort) +
'</div>' +
'</div>' +
'<div class="chips" id="colChips" style="margin-top:14px">' +
sphereChip('', 'Все сферы', st.sphere) +
SPHERES.map(function (s) { return sphereChip(s.code, s.code + ' · ' + s.name, st.sphere); }).join('') +
'</div>' +
'<p class="mono tiny" id="colCount" style="margin-top:18px;color:var(--ink-4)"></p>' +
'<h2 class="sr-only">Список специальностей</h2>' +
'<div class="card-grid" id="colGrid"></div>' +
'</div>';
var grid = document.getElementById('colGrid');
var countEl = document.getElementById('colCount');
var searchEl = document.getElementById('colSearch');
function repaint() {
var list = filteredColleges(st);
grid.innerHTML = list.length ? list.map(collegeCard).join('') :
'<div class="empty"><b>Ничего не найдено</b>Попробуйте другой запрос или сбросьте фильтр сферы.</div>';
countEl.textContent = 'Найдено ' + list.length + ' ' + plural(list.length, 'специальность', 'специальности', 'специальностей');
var params = new URLSearchParams();
if (st.q) params.set('q', st.q);
if (st.sphere) params.set('sphere', st.sphere);
if (st.sort !== 'count') params.set('sort', st.sort);
syncUrl('/colleges', params);
initReveal(grid);
}
var timer;
searchEl.addEventListener('input', function () {
clearTimeout(timer);
timer = setTimeout(function () { st.q = searchEl.value; repaint(); }, 140);
});
document.getElementById('colSort').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sort]');
if (!b) return;
st.sort = b.getAttribute('data-sort');
document.querySelectorAll('#colSort button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
document.getElementById('colChips').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sphere]');
if (!b) return;
st.sphere = b.getAttribute('data-sphere');
document.querySelectorAll('#colChips button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
repaint();
}
function specCard(s) {
var cities = s.cities.slice(0, 4).join(' · ');
if (s.cities.length > 4) cities += ' +' + (s.cities.length - 4);
return '<a class="panel spec-card reveal" href="#/universities?q=' + encodeURIComponent(s.direction) + '">' +
'<div class="spec-top"><span class="mono">' + h(s.code) + '</span><span class="tag">' + h(s.sphereCode) + '</span></div>' +
'<h3>' + h(s.direction) + '</h3>' +
'<p class="spec-prof">' + h(s.profession) + '</p>' +
'<div class="spec-meta"><span>' + s.count + ' ' + plural(s.count, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>от ≈' + s.minBudget + '</span><span>' + s.cities.length + ' ' + plural(s.cities.length, 'город', 'города', 'городов') + '</span></div>' +
'<p class="spec-cities">' + h(cities) + '</p>' +
'<span class="spec-arrow">Показать вузы →</span></a>';
}
function filteredSpecialties(st) {
var q = norm(st.q);
return SPECIALTIES.filter(function (s) {
if (st.sphere && s.sphereCode !== st.sphere) return false;
if (!q) return true;
return norm(s.direction + ' ' + s.code + ' ' + s.profession + ' ' + s.cities.join(' ')).indexOf(q) >= 0;
}).sort(function (a, b) {
if (st.sort === 'budget') return a.minBudget - b.minBudget;
if (st.sort === 'alpha') return a.direction.localeCompare(b.direction, 'ru');
return b.count - a.count;
});
}
function renderSpecialties(m, q) {
var st = { q: q.get('q') || '', sphere: q.get('sphere') || '', sort: q.get('sort') || 'count' };
if (st.sphere && !SPHERES.some(function (s) { return s.code === st.sphere; })) st.sphere = '';
setTitle('Специальности вузов — Профессии·2030');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел VI · Специальности</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Специальности: от кода <em>до вуза</em></h1>' +
'<p class="lead">' + SPECIALTIES.length + ' ' + plural(SPECIALTIES.length, 'специальность', 'специальности', 'специальностей') +
' в ' + U.length + ' вузах. Для каждой — код, профессия, набор ЕГЭ, минимальный балл и города, где её преподают.</p>' +
'</section>' +
'<div class="toolbar">' +
'<label class="search-field"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
'<input id="specSearch" type="text" placeholder="Специальность, код или город…" value="' + h(st.q) + '" aria-label="Поиск по специальностям"></label>' +
'<div class="sort" id="specSort">' +
sortBtn('count', 'По числу вузов', st.sort) +
sortBtn('budget', 'По баллу', st.sort) +
sortBtn('alpha', 'По алфавиту', st.sort) +
'</div>' +
'</div>' +
'<div class="chips" id="specChips" style="margin-top:14px">' +
sphereChip('', 'Все сферы', st.sphere) +
SPHERES.map(function (s) { return sphereChip(s.code, s.code + ' · ' + s.name, st.sphere); }).join('') +
'</div>' +
'<p class="mono tiny" id="specCount" style="margin-top:18px;color:var(--ink-4)"></p>' +
'<h2 class="sr-only">Список специальностей</h2>' +
'<div class="spec-grid" id="specGrid"></div>' +
'</div>';
var grid = document.getElementById('specGrid');
var countEl = document.getElementById('specCount');
var searchEl = document.getElementById('specSearch');
function repaint() {
var list = filteredSpecialties(st);
grid.innerHTML = list.length ? list.map(specCard).join('') :
'<div class="empty"><b>Ничего не найдено</b>Попробуйте другой запрос или сбросьте фильтр сферы.</div>';
countEl.textContent = 'Найдено ' + list.length + ' ' + plural(list.length, 'специальность', 'специальности', 'специальностей');
var params = new URLSearchParams();
if (st.q) params.set('q', st.q);
if (st.sphere) params.set('sphere', st.sphere);
if (st.sort !== 'count') params.set('sort', st.sort);
syncUrl('/specialties', params);
initReveal(grid);
}
var timer;
searchEl.addEventListener('input', function () {
clearTimeout(timer);
timer = setTimeout(function () { st.q = searchEl.value; repaint(); }, 140);
});
document.getElementById('specSort').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sort]');
if (!b) return;
st.sort = b.getAttribute('data-sort');
document.querySelectorAll('#specSort button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
document.getElementById('specChips').addEventListener('click', function (e) {
var b = e.target.closest('button[data-sphere]');
if (!b) return;
st.sphere = b.getAttribute('data-sphere');
document.querySelectorAll('#specChips button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
repaint();
});
repaint();
}
function renderRegions() {
setTitle('Регионы и вузы — Профессии·2030');
var avg = U.length ? Math.round(U.reduce(function (n, u) { return n + u.avg; }, 0) / U.length) : 0;
var largest = DISTRICTS.slice().sort(function (a, b) { return b.count - a.count; });
app.innerHTML = '<div class="view">' +
'<section class="hero">' +
'<p class="eyebrow">Раздел VII · География</p>' +
'<h1 class="display">Вузы в <em>восьми</em> федеральных округах</h1>' +
'<p class="lead">Атлас охватывает ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регион', 'региона', 'регионов') + ' и ' + CITIES.length + ' ' + plural(CITIES.length, 'город', 'города', 'городов') + '. Выберите округ или субъект РФ, чтобы перейти к вузам, направлениям и проходным баллам.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/universities">Все вузы по регионам →</a><a class="btn" href="#/quiz">Пройти опросник</a></div>' +
'<div class="hero-meta"><span>' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + '</span>' +
'<span>' + TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') + '</span>' +
'<span>средний балл ≈' + avg + '</span><span>2027–2030</span></div>' +
'<div class="stats reveal">' +
statCard(DISTRICTS.length, 'федеральных округов') +
statCard(REGIONS.length, 'регионов') +
statCard(U.length, plural(U.length, 'вуз', 'вуза', 'вузов')) +
statCard(TOTAL_PROGRAMS, 'программ') +
'</div>' +
'</section>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Округа</p><h2 class="sec">Распределение вузов</h2></div>' +
'<a class="sec-link" href="#/universities">Открыть фильтр →</a></section>' +
'<div class="geo-grid">' + largest.map(districtCard).join('') + '</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Регионы</p><h2 class="sec">Субъекты Российской Федерации</h2></div></section>' +
'<p class="muted reveal" style="max-width:72ch;margin-bottom:16px">В списке указано число вузов, включённых в атлас. Переход открывает отфильтрованный список с направлениями и баллами.</p>' +
DISTRICTS.map(function (d) {
return '<div class="region-list-block reveal">' +
'<div class="region-list-head"><div><p class="eyebrow">' + h(d.code) + '</p><h3>' + h(d.name) + '</h3></div>' +
'<span class="mono tiny">' + d.count + ' ' + plural(d.count, 'вуз', 'вуза', 'вузов') + ' · ' + d.programs + ' ' +
plural(d.programs, 'программа', 'программы', 'программ') + ' · средний балл ≈' + d.avg + '</span></div>' +
'<div class="region-links">' + d.regions.map(function (r) {
return '<a href="#/universities?district=' + encodeURIComponent(d.code) + '&region=' + encodeURIComponent(r.name) + '">' +
'<span>' + h(r.name) + '</span><b>' + r.count + '</b></a>';
}).join('') + '</div></div>';
}).join('') +
heatSection() +
'<div class="panel reveal" style="padding:24px;margin-top:26px;display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
'<div><p class="label">Дальше</p><p style="font-family:var(--serif);font-size:22px;font-weight:700;margin-top:6px">Подберите программы по предметам ЕГЭ и сумме баллов</p></div>' +
'<div class="hero-cta" style="margin:0"><a class="btn btn-primary btn-sm" href="#/quiz">Пройти опросник →</a><a class="btn btn-sm" href="#/specialties">Специальности</a></div>' +
'</div>' +
'</div>';
renderHeatmap();
}
function renderAbout() {
setTitle('О проекте и преимущества — Профессии·2030');
var rows = [
['Маршрут «профессия → программа → ЕГЭ → балл»', 'Да, в одном сценарии', 'Обычно только профессии или только вузы', 'Только вуз и направления'],
['Прозрачная методика индекса', 'Формула, веса и допущения открыты', 'Рейтинг без формулы', 'Обычно нет'],
['Проверка шансов по сумме баллов', 'Да, с пограничной зоной ±10', 'Часто через рекламу курсов', 'Нет'],
['География: округа и регионы', U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах'), 'Крупные города и столицы', 'Зависит от справочника'],
['Регистрация и трекинг', 'Не нужны', 'Часто нужны', 'Часто нужны'],
['Открытые данные', 'data-core.js, чанки вузов и JSON', 'Закрыты', 'Закрыты'],
['Сравнение и печатный отчёт', 'До 3 профессий, PDF', 'Обычно платно', 'Редко']
];
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">О проекте</p>' +
'<h1 class="display">Не каталог, а <em>маршрут</em> поступления</h1>' +
'<p class="lead">Мы собрали профессии, специальности, вузы, колледжи, ЕГЭ и баллы в одну систему. Ниже — что именно мы делаем иначе и где проходят границы наших данных.</p>' +
'<div class="hero-cta"><a class="btn btn-primary" href="#/quiz">Пройти опросник →</a><a class="btn" href="#/methodology">Методология</a></div>' +
'</section>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Принципы</p><h2 class="sec">Что атлас делает иначе</h2></div></section>' +
'<div class="adv-grid" style="margin-top:0">' +
advCard('01', 'Связываем то, что обычно лежит отдельно', 'Профессия ведёт к специальностям, специальность — к вузам и наборам ЕГЭ, а баллы показывают реальные шансы. Не нужно открывать пять сайтов.') +
advCard('02', 'Показываем формулу, а не только цифру', 'Индекс спроса, покрытие программ и пограничная зона описаны в методологии. Вы можете проверить логику и не принимать рейтинг на веру.') +
advCard('03', 'Считаем шансы, а не продаём курсы', 'Опросник не требует регистрации и не передаёт ответы. Он показывает, где вы проходите, где пограничная зона, а где стоит смотреть платное.') +
advCard('04', 'Вся география, а не отдельный раздел', U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах') + ': от Калининграда и Мурманска до Владивостока, Якутска и Петропавловска-Камчатского.') +
advCard('05', 'Данные можно проверить и переиспользовать', 'Датасет лежит в data-core.js, чанках data-universities-1…3.js и atlas-data.json. Это не чёрный ящик: структуру видно, ссылки и цифры можно сверить с приёмными комиссиями.') +
advCard('06', 'Работает как один файл', 'Standalone-версия открывается без сервера и сборщика. Это удобно для школы, профориентационного урока и слабого интернета.') +
'</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Сравнение</p><h2 class="sec">Чем отличаемся от типичных сайтов</h2></div></section>' +
'<p class="muted reveal" style="max-width:72ch">Сравнение обобщённое: конкретные сервисы устроены по-разному. Мы описываем типичные модели «агрегатора профессий» и «справочника вузов», а не оцениваем какой-то один сайт.</p>' +
'<div class="tbl adv-table reveal" style="margin-top:16px"><table class="data">' +
'<thead><tr><th>Критерий</th><th>Профессии·2030</th><th>Типичный агрегатор</th><th>Типичный справочник</th></tr></thead><tbody>' +
rows.map(function (r) {
return '<tr><th scope="row">' + h(r[0]) + '</th>' +
'<td data-label="Профессии·2030" class="yes">' + h(r[1]) + '</td>' +
'<td data-label="Агрегатор">' + h(r[2]) + '</td>' +
'<td data-label="Справочник">' + h(r[3]) + '</td></tr>';
}).join('') +
'</tbody></table></div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Честно</p><h2 class="sec">Чего у нас нет</h2></div></section>' +
'<div class="panel reveal" style="padding:24px;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">' +
'<div><h3 style="font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:6px">Личного кабинета</h3><p class="muted">Мы не храним ответы и не ведём заявки. Это осознанный выбор: меньше данных — меньше рисков.</p></div>' +
'<div><h3 style="font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:6px">Гарантии поступления</h3><p class="muted">Баллы ориентировочные. Решение принимает приёмная комиссия, а конкурс меняется каждый год.</p></div>' +
'<div><h3 style="font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:6px">Полной замены приёмной комиссии</h3><p class="muted">Атлас помогает сузить выбор и задать вопросы. Финальную проверку всегда делайте на сайте вуза.</p></div>' +
'<div><h3 style="font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:6px">Полного списка вузов страны</h3><p class="muted">В каталоге ' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' с открытыми данными о баллах и программах. Это осознанная выборка, а не исчерпывающий реестр: состав и годы кампаний указаны в методологии.</p></div>' +
'</div>' +
'<section class="sec-head reveal"><div><p class="eyebrow">Обновления</p><h2 class="sec">Что нового в атласе</h2></div></section>' +
'<ul class="changelog reveal">' +
'<li><span class="mono">7 ноября 2026</span><div><b>Проще навигация и режимы.</b> В шапке осталось четыре раздела, остальное собрано в меню «Ещё», а на телефоне появилась нижняя навигация с подписями. Переключатель «Я ученик / Я учитель или родитель» меняет подачу главной и добавляет методические действия. Поиск понимает обычные фразы: «после 9 класса», «биология», «Москва бюджет». Возврат из профессии восстанавливает фильтры и место в списке, а термины объясняются прямо на странице.</div></li>' +
'<li><span class="mono">7 ноября 2026</span><div><b>Новые графики.</b> На главной появилось полотно всех профессий: площадь плитки — число программ, цвет — индекс спроса. На странице профессии — радар по шести навыкам и самопроверка «подходит ли мне»: отметьте, что вам ближе, и получите вывод.</div></li>' +
'<li><span class="mono">7 ноября 2026</span><div><b>Живые графики и чтение по разделам.</b> Тепловая карта получила фильтры по округу и сфере с плавной перестройкой шкалы, bubble-график обновляется вместе с каталогом. На странице профессии появилось закреплённое содержание с индикатором прокрутки, а при загрузке — скелетоны и мягкое появление блоков.</div></li>' +
'<li><span class="mono">7 ноября 2026</span><div><b>Журнальная страница профессии.</b> Крупная серифная шапка, строка ключевых фактов — зарплата, число вузов и минимальный балл — и обложка сферы с подписью. Паспорт профессии стал спокойной колонкой без лишней рамки, текст разборов набран с воздухом.</div></li>' +
'<li><span class="mono">7 ноября 2026</span><div><b>Объёмная 3D-карта России.</b> В разделе «Карта» — силуэт страны с метками городов, где есть вузы: высота метки отражает число вузов, цвет — федеральный округ. Карта поворачивается, масштабируется и открывает город в каталоге.</div></li>' +
'<li><span class="mono">7 ноября 2026</span><div><b>Фотобанк сфер.</b> Двенадцать фотографий с Wikimedia Commons: производство, лаборатория, энергетика, медиа. На страницах профессий появился баннер сферы с указанием автора и лицензии.</div></li>' +
'<li><span class="mono">6 ноября 2026</span><div><b>Календарь приёмной кампании и избранное.</b> Помесячный календарь после 11 и после 9 класса, а также список избранных профессий, который хранится в браузере.</div></li>' +
'<li><span class="mono">5 ноября 2026</span><div><b>График зарплаты по этапам карьеры.</b> Диапазоны оплаты по ступеням обучения и работы — прямо на странице профессии.</div></li>' +
'</ul>' +
'<div class="panel reveal" style="padding:24px;margin-top:22px;display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
'<div><p class="label">Проверить</p><p style="font-family:var(--serif);font-size:22px;font-weight:700;margin-top:6px">Методология, данные и границы применимости</p></div>' +
'<div class="hero-cta" style="margin:0"><a class="btn btn-primary btn-sm" href="#/methodology">Методология →</a><a class="btn btn-sm" href="#/specialties">Специальности</a></div>' +
'</div>' +
'</div>';
}
function renderMethodology() {
setTitle('Методология — Профессии·2030');
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел VIII · Методология</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Как формируется <em>атлас</em></h1>' +
'<p class="lead">Открытые принципы отбора профессий, расчёта индекса спроса и сбора проходных баллов. Если цифра вызывает вопросы — здесь описано, откуда она взялась.</p>' +
'</section>' +
'<div class="prose" id="prose">' +
(A.methodology && A.methodology.html ? sanitizeRichHtml(A.methodology.html) : '<p>Раздел в подготовке.</p>') +
'</div>' +
'<div class="panel reveal" style="padding:22px;margin-top:24px"><p class="label">Границы данных</p>' +
'<p class="muted" style="margin-top:8px">Каталог вузов — выборка из ' + U.length + ' ' + plural(U.length, 'вуза', 'вуза', 'вузов') + ' с открытыми данными о программах, наборах ЕГЭ и проходных баллах; ' +
'колледжей в атласе ' + C.length + ', это демонстрационный набор, а не полный перечень. ' +
'Баллы приведены к приёмным кампаниям 2024–2025 годов и служат ориентиром: реальные значения меняются ежегодно, ' +
'а даты кампании 2026–2027 нужно уточнять на сайте вуза или колледжа.</p>' +
'<p class="muted" style="margin-top:10px">Карта России построена по открытым геоданным и в равновеликой конической проекции Альберса; ' +
'координаты городов приведены к десятым долям градуса. Фотографии сфер — Wikimedia Commons, автор и лицензия указаны под каждым снимком.</p></div>' +
'</div>';
rewriteLinks(document.getElementById('prose'));
var prose = document.getElementById('prose');
prose.querySelectorAll('table').forEach(function (t) {
var wrap = document.createElement('div');
wrap.className = 'tbl';
t.parentNode.insertBefore(wrap, t);
wrap.appendChild(t);
t.querySelectorAll('tbody tr').forEach(function (tr) {
var first = tr.firstElementChild;
if (!first || first.tagName !== 'TD') return;
var th = document.createElement('th');
th.setAttribute('scope', 'row');
while (first.firstChild) th.appendChild(first.firstChild);
tr.replaceChild(th, first);
});
});
var qlink = document.querySelector('#prose > a[href="#/quiz"]');
if (qlink) qlink.className = 'btn btn-primary';
initReveal();
}
function rewriteLinks(root) {
if (!root) return;
root.querySelectorAll('a[href]').forEach(function (a) {
var href = a.getAttribute('href');
if (href === '/#quiz') a.setAttribute('href', '#/quiz');
else if (href === '/professions') a.setAttribute('href', '#/professions');
else if (href === '/colleges') a.setAttribute('href', '#/colleges');
else if (href === '/universities') a.setAttribute('href', '#/universities');
else if (href === '/specialties') a.setAttribute('href', '#/specialties');
else if (href === '/regions') a.setAttribute('href', '#/regions');
else if (href === '/siberia') a.setAttribute('href', '#/universities?district=' + encodeURIComponent('СФО'));
else if (href === '/about') a.setAttribute('href', '#/about');
else if (href === '/methodology') a.setAttribute('href', '#/methodology');
else if (href.indexOf('/professions/') === 0) a.setAttribute('href', '#/professions/' + href.split('/').filter(Boolean).pop());
else if (href.indexOf('/colleges/') === 0) a.setAttribute('href', '#/colleges/' + href.split('/').filter(Boolean).pop());
try {
var targetUrl = new URL(a.href, location.href);
if (targetUrl.origin !== location.origin) a.rel = 'noopener noreferrer';
} catch (e) { a.removeAttribute('href'); }
});
}
function salaryChartHtml(list) {
var rows = [];
Array.prototype.forEach.call(list.children, function (li) {
if (li.tagName !== 'LI' || !li.classList.contains('career')) return;
var ps = Array.prototype.filter.call(li.children, function (x) { return x.tagName === 'P'; });
if (ps.length < 3) return;
var stage = ps[0].textContent.trim();
var role = ps[1].textContent.trim();
var pay = ps[2].textContent.trim();
var nums = pay.match(/\d+/g);
if (!nums || !nums.length) return;
var vals = nums.map(function (n) { return parseInt(n, 10); }).filter(function (n) { return n > 0; });
if (!vals.length) return;
rows.push({
stage: stage,
role: role,
pay: pay,
min: Math.min.apply(null, vals),
max: Math.max.apply(null, vals)
});
});
if (rows.length < 2) return '';
var top = Math.max.apply(null, rows.map(function (r) { return r.max; }));
top = Math.max(50, Math.ceil(top / 50) * 50);
var bars = rows.map(function (r) {
var left = r.min / top * 100;
var width = Math.max((r.max - r.min) / top * 100, 1.5);
var label = r.pay.replace('/мес', '').replace(/\s*тыс\.\s*₽/, '');
return '<div class="salary-row">' +
'<div class="salary-meta"><span class="salary-stage">' + h(r.stage) + '</span><span class="salary-role">' + h(r.role) + '</span></div>' +
'<div class="salary-track" aria-hidden="true"><span class="salary-fill" style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%"></span></div>' +
'<span class="salary-val">' + h(label) + '</span></div>';
}).join('');
var aria = rows.map(function (r) { return r.stage + ': ' + r.role + ', ' + r.pay; }).join('. ');
return '<div class="salary-chart" role="img" aria-label="' + h('Зарплаты по этапам карьеры. ' + aria) + '">' +
'<div class="salary-head"><p class="label">Зарплата по этапам карьеры</p><span class="mono tiny">0–' + top + ' тыс. ₽/мес</span></div>' +
'<div class="salary-rows">' + bars + '</div>' +
'<p class="salary-note">Ориентировочные диапазоны из описания профессии. Фактическая зарплата зависит от региона, компании и опыта.</p>' +
'</div>';
}
function prepareRich(root) {
// Content is already reduced to the strict b/i/a allowlist by sanitizeRichHtml.
rewriteLinks(root);
root.querySelectorAll('li').forEach(function (li) {
var k = li.children;
if (k.length === 3 && k[0].tagName === 'P' && k[1].tagName === 'P' && k[2].tagName === 'P') {
li.classList.add('career');
var pay = k[2].textContent.trim();
if (/^\d+$/.test(pay)) k[2].textContent = pay + ' тыс. ₽/мес';
else if (/тыс\.\s*₽$/.test(pay)) k[2].textContent = pay + '/мес';
}
if (k.length === 3 && k[0].tagName === 'SPAN' && k[1].tagName === 'SPAN' && k[2].tagName === 'P') li.classList.add('timeline');
if (k[0] && k[0].tagName === 'SPAN' && k[0].querySelector('b')) li.classList.add('row');
var f = li.firstChild;
if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^\s*—\s*/, '');
li.querySelectorAll('a').forEach(function (a) {
if (a.querySelector('p')) a.classList.add('stack');
});
});
root.querySelectorAll('ol').forEach(function (ol) {
if (ol.nextElementSibling && ol.nextElementSibling.classList.contains('salary-chart')) return;
if (!ol.querySelector('li.career')) return;
var chart = salaryChartHtml(ol);
if (chart) ol.insertAdjacentHTML('afterend', chart);
});
root.querySelectorAll('section').forEach(function (sec) {
var divs = Array.prototype.filter.call(sec.children, function (x) { return x.tagName === 'DIV'; });
if (divs.length >= 2 && divs.every(function (d) { return d.querySelector('h2'); })) sec.classList.add('two');
});
root.querySelectorAll('div').forEach(function (d) {
if (d.querySelector(':scope > table')) {
d.classList.add('tbl');
var hint = document.createElement('p');
hint.className = 'tbl-hint';
hint.textContent = 'Прокрутите таблицу вбок →';
d.parentNode.insertBefore(hint, d);
}
});
}
function sanitizeRichHtml(input) {
var template = document.createElement('template');
template.innerHTML = String(input == null ? '' : input);
var allowedTags = {
SECTION: true, H2: true, H3: true, P: true, OL: true, UL: true, LI: true,
SPAN: true, DIV: true, TABLE: true, THEAD: true, TBODY: true, TR: true,
TH: true, TD: true, B: true, I: true, STRONG: true, EM: true, A: true, BR: true
};
function safeAnchorHref(value) {
try {
var url = new URL(value, location.href);
return (url.protocol === 'http:' || url.protocol === 'https:') ? value : null;
} catch (e) { return null; }
}
function copyNode(node, parent) {
if (node.nodeType === 3) { parent.appendChild(document.createTextNode(node.nodeValue)); return; }
if (node.nodeType !== 1) return;
var tag = node.tagName.toUpperCase();
if (!allowedTags[tag]) {
Array.prototype.slice.call(node.childNodes).forEach(function (child) { copyNode(child, parent); });
return;
}
var clean = document.createElement(tag.toLowerCase());
if (tag === 'A') {
var href = safeAnchorHref(node.getAttribute('href') || '');
if (href) {
clean.setAttribute('href', href);
var parsed = new URL(href, location.href);
if (parsed.origin !== location.origin) clean.setAttribute('rel', 'noopener noreferrer');
}
}
Array.prototype.slice.call(node.childNodes).forEach(function (child) { copyNode(child, clean); });
parent.appendChild(clean);
}
var output = document.createElement('div');
Array.prototype.slice.call(template.content.childNodes).forEach(function (node) { copyNode(node, output); });
return output.innerHTML;
}
var storyCleanup = null;
function buildToc(root) {
var toc = document.getElementById('toc');
if (!toc) return;
var h2s = root.querySelectorAll('h2');
toc.classList.add('toc-story');
toc.innerHTML = Array.prototype.map.call(h2s, function (h2, i) {
var id = 'sec-' + (i + 1);
h2.id = id;
return '<a href="#' + id + '" data-toc="' + id + '">' + h(h2.textContent.replace(/^\d+\.\s*/, '')) + '</a>';
}).join('') + '<i class="toc-progress" aria-hidden="true"></i>';
toc.addEventListener('click', function (e) {
var a = e.target.closest('a[data-toc]');
if (!a) return;
e.preventDefault();
var t = document.getElementById(a.getAttribute('data-toc'));
if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 118, behavior: noMotion ? 'auto' : 'smooth' });
});
/* Секции проявляются по мере прокрутки: длинный разбор читается как история. */
root.querySelectorAll('section').forEach(function (s) { s.classList.add('reveal', 'story'); });
initReveal(root);
var links = toc.querySelectorAll('a[data-toc]');
var progress = toc.querySelector('.toc-progress');
var ticking = false;
function updateStory() {
ticking = false;
var line = 118;
var current = null;
for (var i = 0; i < h2s.length; i++) {
if (h2s[i].getBoundingClientRect().top <= line) current = h2s[i];
}
for (var j = 0; j < links.length; j++) {
links[j].classList.toggle('active', !!current && links[j].getAttribute('data-toc') === current.id);
}
if (progress && root) {
var start = root.getBoundingClientRect().top + window.scrollY - 140;
var total = Math.max(1, root.offsetHeight - window.innerHeight * 0.4);
var p = Math.max(0, Math.min(1, (window.scrollY - start) / total));
progress.style.transform = 'scaleX(' + p.toFixed(3) + ')';
}
}
function onStoryScroll() {
if (ticking) return;
ticking = true;
requestAnimationFrame(updateStory);
}
if (storyCleanup) storyCleanup();
window.addEventListener('scroll', onStoryScroll, { passive: true });
window.addEventListener('resize', onStoryScroll);
storyCleanup = function () {
window.removeEventListener('scroll', onStoryScroll);
window.removeEventListener('resize', onStoryScroll);
};
updateStory();
}
function refreshStudyTable(root, slug, title) {
var list = (PROG[slug] || []).slice().sort(function (a, b) {
return (b.budget || 0) - (a.budget || 0);
}).slice(0, 12);
if (!list.length) return;
var sec = null;
root.querySelectorAll('section').forEach(function (s) {
var h2 = s.querySelector('h2');
if (h2 && /Где учиться/i.test(h2.textContent)) sec = s;
});
if (!sec) return;
var table = sec.querySelector('table');
var wrap = null;
var headHtml = '<thead><tr><th>Вуз</th><th>Направление</th><th>ЕГЭ</th><th>Бюджет</th><th>Платно</th></tr></thead>';
if (table) {
wrap = table.parentElement;
if (!wrap.classList.contains('tbl')) {
wrap = document.createElement('div');
wrap.className = 'tbl';
table.parentNode.insertBefore(wrap, table);
wrap.appendChild(table);
}
table.className = 'data study';
var thead = table.querySelector('thead');
if (!thead || thead.querySelectorAll('th').length !== 5) {
if (thead) thead.remove();
table.insertAdjacentHTML('afterbegin', headHtml);
}
} else {
wrap = document.createElement('div');
wrap.className = 'tbl';
table = document.createElement('table');
table.className = 'data study';
table.innerHTML = headHtml + '<tbody></tbody>';
wrap.appendChild(table);
var firstP = sec.querySelector('p');
if (firstP && firstP.nextSibling) sec.insertBefore(wrap, firstP.nextSibling);
else sec.appendChild(wrap);
}
var hint = sec.querySelector('.study-hint');
if (!hint) {
hint = document.createElement('p');
hint.className = 'tbl-hint study-hint';
hint.textContent = 'Прокрутите таблицу вбок →';
sec.insertBefore(hint, wrap.nextSibling);
}
var tbody = table.querySelector('tbody');
if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }
tbody.innerHTML = list.map(function (x) {
return '<tr><td data-label="Вуз"><b>' + h(x.uni.short) + '</b><span>' + h(x.uni.city) + '</span></td>' +
'<td data-label="Направление">' + h(x.direction) + '<span class="code">' + h(x.code) + '</span></td>' +
'<td data-label="ЕГЭ">' + h(x.ege) + '</td>' +
'<td data-label="Бюджет" class="b">' + (x.budget ? '≈' + x.budget : '—') + '</td>' +
'<td data-label="Платно" class="p">' + (x.paid ? '≈' + x.paid : '—') + '</td></tr>';
}).join('');
var more = document.createElement('p');
more.className = 'mono tiny';
more.style.marginTop = '10px';
more.innerHTML = '12 программ с самым высоким минимальным баллом на бюджет. <a href="#/universities?q=' +
encodeURIComponent(title) + '">Все программы по профессии →</a>';
sec.appendChild(more);
}
var RADAR_AXES = [
{ k: 'math', name: 'Математика' },
{ k: 'tech', name: 'Техника' },
{ k: 'people', name: 'Люди и общение' },
{ k: 'create', name: 'Творчество' },
{ k: 'research', name: 'Исследования' },
{ k: 'duty', name: 'Ответственность' }
];
/* Профиль профессии по шести навыкам: часть значений берётся из набора
   ЕГЭ программ, часть — из сферы. Это ориентир атласа, а не тест. */
function radarValues(p) {
var progs = PROG[p.slug] || [];
var n = progs.length || 1;
var math = 0, tech = 0;
progs.forEach(function (pr) {
var e = norm(pr.ege || '');
if (e.indexOf('мат') >= 0) math++;
if (e.indexOf('физ') >= 0 || e.indexOf('инф') >= 0) tech++;
});
var base = {
'D-01': [0.85, 0.9, 0.45, 0.7, 0.75, 0.6],
'D-02': [0.6, 0.95, 0.4, 0.4, 0.55, 0.75],
'D-03': [0.65, 0.5, 0.9, 0.45, 0.85, 0.9],
'D-04': [0.7, 0.85, 0.4, 0.45, 0.8, 0.8],
'D-05': [0.55, 0.35, 0.9, 0.5, 0.5, 0.85],
'D-06': [0.4, 0.4, 0.6, 0.9, 0.5, 0.6]
}[p.sphereCode] || [0.6, 0.6, 0.6, 0.6, 0.6, 0.6];
var v = base.slice();
v[0] = Math.max(v[0], math / n);
v[1] = Math.min(1, v[1] + (tech / n) * 0.2);
return v.map(function (x) { return Math.round(x * 100); });
}
function radarSection(p) {
var vals = radarValues(p);
var CX = 230, CY = 142, R = 92;
function pt(i, r) {
var a = -Math.PI / 2 + i * Math.PI / 3;
return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
}
var grid = '', lines = '', labels = '', dots = '', poly = '';
for (var ring = 1; ring <= 4; ring++) {
var gp = [];
for (var gi = 0; gi < 6; gi++) { var q = pt(gi, R * ring / 4); gp.push(q[0].toFixed(1) + ',' + q[1].toFixed(1)); }
grid += '<polygon class="radar-ring" points="' + gp.join(' ') + '"></polygon>';
}
for (var i = 0; i < 6; i++) {
var e = pt(i, R);
lines += '<line class="radar-axis" x1="' + CX + '" y1="' + CY + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '"></line>';
var lp = pt(i, R + 26);
var anchor = Math.abs(Math.cos(-Math.PI / 2 + i * Math.PI / 3)) < 0.35 ? 'middle' : (Math.cos(-Math.PI / 2 + i * Math.PI / 3) > 0 ? 'start' : 'end');
labels += '<text class="radar-label" x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + h(RADAR_AXES[i].name) + '</text>';
var vp = pt(i, R * vals[i] / 100);
dots += '<circle class="radar-dot" data-i="' + i + '" cx="' + vp[0].toFixed(1) + '" cy="' + vp[1].toFixed(1) + '" r="4.5"></circle>';
poly += vp[0].toFixed(1) + ',' + vp[1].toFixed(1) + ' ';
}
return '<section class="radar-sec reveal">' +
'<div class="radar-grid">' +
'<div class="radar-chart"><svg viewBox="0 0 460 300" role="img" aria-label="Профиль профессии по шести навыкам: ' +
h(RADAR_AXES.map(function (a, i) { return a.name + ' — ' + vals[i] + ' из 100'; }).join(', ')) + '">' +
grid + lines + '<polygon class="radar-poly" points="' + poly.trim() + '"></polygon>' + dots + labels +
'</svg></div>' +
'<div class="radar-side">' +
'<p class="eyebrow">Самопроверка</p>' +
'<h2 class="sec">Подходит ли мне</h2>' +
'<p class="muted">Отметьте, что вам ближе. Атлас покажет, насколько профессия совпадает с вашим набором склонностей.</p>' +
'<div class="radar-axes" role="group" aria-label="Что вам ближе">' +
RADAR_AXES.map(function (a, i) {
return '<button class="radar-chip" type="button" data-axis="' + i + '" aria-pressed="false">' + h(a.name) + '</button>';
}).join('') + '</div>' +
'<p class="radar-verdict" id="radarVerdict" role="status" aria-live="polite">Выберите хотя бы два пункта — и появится вывод.</p>' +
'<p class="radar-note">Профиль построен по набору ЕГЭ программ атласа и сфере деятельности. Это ориентир для размышления, а не результат теста.</p>' +
'</div></div></section>';
}
function initRadar(p) {
var host = document.querySelector('.radar-sec');
if (!host) return;
var vals = radarValues(p);
var chips = host.querySelectorAll('.radar-chip');
var dots = host.querySelectorAll('.radar-dot');
var verdict = document.getElementById('radarVerdict');
function update() {
var chosen = [];
chips.forEach(function (c) { if (c.getAttribute('aria-pressed') === 'true') chosen.push(Number(c.getAttribute('data-axis'))); });
dots.forEach(function (d) { d.classList.toggle('on', chosen.indexOf(Number(d.getAttribute('data-i'))) >= 0); });
if (!verdict) return;
if (!chosen.length) { verdict.textContent = 'Выберите хотя бы два пункта — и появится вывод.'; return; }
var strong = 0, mid = 0;
chosen.forEach(function (i) {
if (vals[i] >= 70) strong++;
else if (vals[i] >= 45) mid++;
});
var pct = Math.round((strong * 1 + mid * 0.5) / chosen.length * 100);
var parts = [];
if (strong) parts.push(strong + ' ' + plural(strong, 'пункт', 'пункта', 'пунктов') + ' совпадают');
if (mid) parts.push(mid + ' ' + plural(mid, 'пункт', 'пункта', 'пунктов') + ' частично');
verdict.innerHTML = parts.join(', ') + '. Совпадение примерно <b>' + pct + '%</b>. ' +
(strong >= 2 ? 'По этим качествам профессия вам подходит.' : strong === 1 ? 'Совпадение есть, но оно неполное — посмотрите смежные профессии.' : 'Скорее всего, эта профессия не про ваше сочетание качеств: загляните в раздел «Смежные профессии».');
}
chips.forEach(function (c) {
c.addEventListener('click', function () {
var on = c.getAttribute('aria-pressed') === 'true';
c.setAttribute('aria-pressed', on ? 'false' : 'true');
update();
});
});
}
/* Тремап: площадь плитки — число программ, насыщенность — индекс спроса. */
function treemapLayout(values, x, y, w, h) {
var total = 0;
values.forEach(function (v) { total += v; });
if (total <= 0) return [];
var scale = (w * h) / total;
var rest = values.map(function (v) { return { area: Math.max(1, v) * scale }; });
var rects = [];
var rx = x, ry = y, rw = w, rh = h;
function worst(row, len) {
if (!row.length) return Infinity;
var sum = 0, max = 0, min = Infinity;
row.forEach(function (it) { sum += it.area; if (it.area > max) max = it.area; if (it.area < min) min = it.area; });
var s2 = sum * sum, l2 = len * len;
return Math.max(l2 * max / s2, s2 / (l2 * min));
}
while (rest.length) {
var len = Math.min(rw, rh);
var row = [], rowSum = 0;
while (rest.length) {
var trial = row.concat([rest[0]]);
var tSum = rowSum + rest[0].area;
if (row.length && worst(trial, len) > worst(row, len)) break;
row = trial; rowSum = tSum; rest.shift();
}
if (!row.length) break;
if (rw >= rh) {
var colW = rowSum / rh;
var cy = ry;
row.forEach(function (it) {
var ih = it.area / colW;
rects.push({ x: rx, y: cy, w: colW, h: ih });
cy += ih;
});
rx += colW; rw -= colW;
} else {
var rowH = rowSum / rw;
var cx = rx;
row.forEach(function (it) {
var iw = it.area / rowH;
rects.push({ x: cx, y: ry, w: iw, h: rowH });
cx += iw;
});
ry += rowH; rh -= rowH;
}
}
return rects;
}
function renderTreemap() {
var host = document.getElementById('treemap');
if (!host) return;
var list = P.slice().sort(function (a, b) { return b.index - a.index; });
var vals = list.map(function (p) { return Math.max(1, (PROG[p.slug] || []).length + p.index / 10); });
var W = 1200, H = 600;
var rects = treemapLayout(vals, 0, 0, W, H);
var out = '';
rects.forEach(function (r, i) {
var p = list[i];
if (!p) return;
var c = sphereColor(p.sphereCode);
var t = Math.max(0, Math.min(1, (p.index - 60) / 40));
var op = (0.14 + 0.34 * t).toFixed(2);
var tw = Math.max(0, r.w - 2), th = Math.max(0, r.h - 2);
var label = '';
if (tw > 92 && th > 46) {
var maxChars = Math.max(6, Math.floor((tw - 16) / 6.6));
var title = cut(p.title, maxChars);
label = '<text class="tm-title" x="' + (r.x + 8).toFixed(1) + '" y="' + (r.y + 20).toFixed(1) + '">' + h(title) + '</text>' +
'<text class="tm-idx" x="' + (r.x + 8).toFixed(1) + '" y="' + (r.y + 36).toFixed(1) + '">индекс ' + p.index + '</text>';
}
out += '<a class="tm-tile" href="#/professions/' + h(p.slug) + '" aria-label="' + h(p.title + ', индекс спроса ' + p.index) + '">' +
'<title>' + h(p.title + ' · индекс ' + p.index + ' · ' + (PROG[p.slug] || []).length + ' программ') + '</title>' +
'<rect x="' + (r.x + 1).toFixed(1) + '" y="' + (r.y + 1).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="' + th.toFixed(1) + '" rx="6" fill="' + c + '" fill-opacity="' + op + '"></rect>' +
'<rect class="tm-hit" x="' + (r.x + 1).toFixed(1) + '" y="' + (r.y + 1).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="' + th.toFixed(1) + '" rx="6"></rect>' +
label + '</a>';
});
host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Тремап ' + P.length + ' профессий: площадь плитки — число программ, насыщенность — индекс спроса">' + out + '</svg>';
}
function renderProfession(slug) {
var p = P.filter(function (x) { return x.slug === slug; })[0];
var d = D[slug];
if (!p || !d) { render404('/professions/' + slug); return; }
setTitle(p.title + ' — Профессии·2030');
var progs = PROG[slug] || [];
var mb = minBudget(slug);
// Топ городов по числу программ этой профессии — для блока «где учат».
var cityCount = {};
progs.forEach(function (pr) {
var c = pr.uni && pr.uni.city;
if (c) cityCount[c] = (cityCount[c] || 0) + 1;
});
var topCities = Object.keys(cityCount).sort(function (a, b) { return cityCount[b] - cityCount[a]; }).slice(0, 5);
var cityTotal = Object.keys(cityCount).length;
var uniSet = {};
progs.forEach(function (pr) { if (pr.uni && pr.uni.short) uniSet[pr.uni.short] = 1; });
var uniCount = Object.keys(uniSet).length;
var similar = (d.similar || []).filter(function (s) { return D[s.slug]; }).slice(0, 5);
var inCmp = compare.has(p.slug);
var inFav = isFavorite(p.slug);
app.innerHTML = '<div class="view">' +
'<header class="detail-head">' +
'<div class="detail-mark">' + profMark(p.slug, p.sphereCode) + '</div>' +
'<p class="eyebrow" style="margin-top:18px">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</p>' +
'<h1>' + h(p.title) + '</h1>' +
'<p class="lead">' + h(p.desc) + '</p>' +
'<div class="fact-strip">' +
'<div><span class="k">Зарплата</span><span class="v">' + h(p.salary) + '</span></div>' +
'<div><span class="k">Где учат</span><span class="v">' + uniCount + ' ' + plural(uniCount, 'вуз', 'вуза', 'вузов') + '</span></div>' +
'<div><span class="k">Городов</span><span class="v">' + cityTotal + '</span></div>' +
'<div><span class="k">Мин. балл</span><span class="v">' + (mb ? '≈' + mb : '—') + '</span></div>' +
'</div>' +
'<div class="hero-cta">' +
'<a class="btn btn-primary btn-sm" href="#/quiz">Проверить шансы</a>' +
'<a class="btn btn-sm" href="#/professions?sphere=' + h(p.sphereCode) + '">Ещё в этой сфере</a>' +
'<button class="btn btn-sm" id="addCmp" aria-pressed="' + (inCmp ? 'true' : 'false') + '">' + (inCmp ? 'В сравнении ✓' : 'Добавить к сравнению') + '</button>' +
'<button class="btn btn-sm fav-detail" type="button" data-fav="' + h(p.slug) + '" data-title="' + h(p.title) + '" aria-pressed="' + (inFav ? 'true' : 'false') + '">' +
FAV_ICON + '<span class="fav-txt">' + (inFav ? 'В избранном' : 'В избранное') + '</span></button>' +
'<button class="btn btn-sm" type="button" data-print="1">Печать</button>' +
'</div>' +
photoFigure(p.sphereCode) +
'</header>' +
radarSection(p) +
'<div class="detail-body">' +
'<div><div class="toc" id="toc" aria-label="Содержание"></div><div class="rich" id="rich"></div></div>' +
'<aside class="passport">' +
'<p class="label">Паспорт профессии</p>' +
'<div class="pp-row"><p class="pp-k">' + gloss('index', 'Индекс спроса') + '</p><p class="pp-v">' + p.index + '<small>/100</small></p>' +
'<div class="pp-bar"><i data-w="' + p.index + '"></i></div></div>' +
'<div class="pp-row"><p class="pp-k">' + gloss('growth', 'Рост вакансий к 2030') + '</p><p class="pp-v" style="font-size:22px;color:var(--ok)">+' + p.growth + '%</p></div>' +
'<div class="pp-row"><p class="pp-k">Зарплата, тыс. ₽/мес</p><p class="pp-v" style="font-size:22px">' + h(String(p.salary).replace(' тыс. ₽', '')) + '</p></div>' +
'<div class="pp-row"><p class="pp-k">' + gloss('programs', 'Программ в атласе') + '</p><p class="pp-v" style="font-size:22px">' + progs.length + '</p></div>' +
'<div class="pp-row"><p class="pp-k">' + gloss('ball', 'Мин. балл на бюджет') + '</p><p class="pp-v" style="font-size:22px">' + (mb ? '≈' + mb : '—') + '</p></div>' +
(topCities.length ? '<div class="pp-row"><p class="pp-k">Где больше всего учат</p><p class="pp-v" style="font-size:13.5px;font-family:var(--sans);font-weight:500;line-height:1.55">' +
topCities.map(function (c) {
return '<a href="#/universities?q=' + encodeURIComponent(c) + '" style="color:var(--violet)">' + h(c) + ' · ' + cityCount[c] + '</a>';
}).join('<span style="color:var(--ink-4)"> · </span>') + '</p></div>' : '') +
'<a class="btn btn-primary btn-sm" href="#/quiz">Проверить свои шансы</a>' +
(similar.length ? '<div class="similar"><p class="label" style="margin-bottom:8px">Смежные профессии</p>' +
similar.map(function (s) {
return '<a href="#/professions/' + s.slug + '"><span>' + h(s.title) + '</span><span class="mono">' + h(s.index) + '</span></a>';
}).join('') + '</div>' : '') +
'</aside>' +
'</div>' +
'</div>';
var rich = document.getElementById('rich');
rich.innerHTML = sanitizeRichHtml(d.body || '');
prepareRich(rich);
initPhotoParallax();
initPhotoSkeleton();
initRadar(p);
refreshStudyTable(rich, p.slug, p.title);
buildToc(rich);
var viewG = app.querySelector('.view');
if (viewG && !viewG.querySelector('.prof-graph')) viewG.insertAdjacentHTML('beforeend', professionGraphHtml(p));
var addBtn = document.getElementById('addCmp');
addBtn.addEventListener('click', function () {
toggleCompare(p.slug);
var on = compare.has(p.slug);
addBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
addBtn.textContent = on ? 'В сравнении ✓' : 'Добавить к сравнению';
});
requestAnimationFrame(function () {
var bar = document.querySelector('.pp-bar i');
if (bar) bar.style.width = (bar.getAttribute('data-w') || 0) + '%';
});
}
function renderCollege(slug) {
var c = C.filter(function (x) { return x.slug === slug; })[0];
var d = CD[slug];
if (!c || !d) { render404('/colleges/' + slug); return; }
setTitle(c.title + ' — Профессии·2030');
var rows = (d.passport || []).map(function (row) {
return '<div class="pp-row"><p class="pp-k">' + h(row.k) + '</p>' +
'<p class="pp-v" style="font-size:17px;font-family:var(--sans);font-weight:500;line-height:1.4">' + h(row.v) + '</p></div>';
}).join('');
app.innerHTML = '<div class="view">' +
'<header class="detail-head">' +
'<p class="eyebrow" style="margin-top:18px">' + h(c.code) + ' · ' + h(c.sphereCode) + '</p>' +
'<h1>' + h(c.title) + '</h1>' +
'<p class="lead">' + h(c.desc) + '</p>' +
'<div class="hero-cta">' +
'<a class="btn btn-primary btn-sm" href="#/quiz-oge">Проверить шансы</a>' +
'<a class="btn btn-sm" href="#/colleges?sphere=' + h(c.sphereCode) + '">Ещё в этой сфере</a>' +
'</div>' +
'</header>' +
'<div class="detail-body">' +
'<div><div class="toc" id="toc" aria-label="Содержание"></div><div class="rich" id="rich"></div></div>' +
'<aside class="passport">' +
'<p class="label">Паспорт специальности</p>' + rows +
'<div class="pp-row"><p class="pp-k">Колледжей в атласе</p><p class="pp-v" style="font-size:22px">' + c.count + '</p></div>' +
'<div class="pp-row"><p class="pp-k">' + gloss('attest', 'Средний балл аттестата') + '</p><p class="pp-v" style="font-size:22px">от ' + h(c.price) + '</p></div>' +
'<a class="btn btn-primary btn-sm" href="#/colleges">Все специальности</a>' +
'</aside>' +
'</div>' +
'</div>';
var rich = document.getElementById('rich');
rich.innerHTML = sanitizeRichHtml(d.body || '');
prepareRich(rich);
buildToc(rich);
}
function quizFromUrl(q) {
var st = { step: 1, exams: ['Рус', 'Мат', 'Инф'], sphere: '', sum: 240, mathLevel: 'profile' };
var has = q.has('e') || q.has('s') || q.has('b') || q.has('step') || q.has('mlevel');
if (!has) {
var saved = loadQuiz();
if (saved) return saved;
}
var e = q.get('e');
if (e) {
var arr = e.split(',').filter(function (s) { return SUBJECTS.indexOf(s) >= 0; });
if (arr.length) st.exams = arr.slice(0, 3);
}
var s = q.get('s');
if (s && SPHERES.some(function (x) { return x.code === s; })) st.sphere = s;
var b = parseInt(q.get('b'), 10);
if (b >= 120 && b <= 300) st.sum = b;
var ml = q.get('mlevel');
if (ml === 'basic' || ml === 'profile') st.mathLevel = ml;
var step = parseInt(q.get('step'), 10);
if (step >= 1 && step <= 4) st.step = step;
return st;
}
function quizSync(st) {
syncUrl('/quiz', quizParams(st));
saveQuiz(st);
}
function parseEge(str) {
var tokens = String(str || '').split('+').map(function (t) { return t.trim(); }).filter(Boolean);
var combos = [[]];
tokens.forEach(function (t) {
var alts = t.split('/').map(function (x) { return x.trim(); }).filter(Boolean);
var next = [];
combos.forEach(function (c) { alts.forEach(function (a) { next.push(c.concat([a])); }); });
combos = next;
});
return combos;
}
function fitsEge(ege, exams) {
if (!ege) return false;
return parseEge(ege).some(function (c) {
return c.every(function (s) { return exams.indexOf(s) >= 0; });
});
}
function statusFor(budget, sum) {
if (!budget) return { cls: 'warn', text: 'Баллы не указаны' };
if (sum >= budget) return { cls: 'ok', text: 'Бюджет вероятен' };
if (sum >= budget - 10) return { cls: 'warn', text: 'Пограничная зона' };
return { cls: 'bad', text: 'Платное обучение' };
}
function computeReport(st) {
var exams = st.exams;
var sum = st.sum;
return P.map(function (p) {
var progs = PROG[p.slug] || [];
var fit = progs.filter(function (pr) {
var mathRestricted = st.mathLevel === 'basic' && exams.indexOf('Мат') >= 0 && /Мат/.test(pr.ege) && ['D-01', 'D-02', 'D-04', 'D-05'].indexOf(p.sphereCode) >= 0;
return !mathRestricted && fitsEge(pr.ege, exams);
});
var affordable = fit.filter(function (pr) { return pr.budget && pr.budget <= sum + 10; });
var coverage = progs.length ? fit.length / progs.length : 0;
var budgets = fit.map(function (pr) { return pr.budget || 999; });
var minB = budgets.length ? Math.min.apply(null, budgets) : 999;
var proximity = minB === 999 ? 0 : Math.max(0, Math.min(1, (sum - (minB - 60)) / 60));
var interest = st.sphere ? (p.sphereCode === st.sphere ? 1 : 0) : 0.5;
var demand = p.index / 100;
var score = 100 * (0.45 * coverage + 0.25 * proximity + 0.15 * interest + 0.15 * demand);
return {
p: p, progs: progs, fit: fit, affordable: affordable,
sphereMatch: !!st.sphere && p.sphereCode === st.sphere,
coverage: coverage,
score: Math.max(0, Math.min(100, Math.round(score)))
};
}).sort(function (a, b) { return b.score - a.score || b.p.index - a.p.index; });
}
function quizSteps(step) {
var names = ['Предметы', 'Сфера', 'Баллы', 'Результат'];
var out = '<div class="quiz-steps">';
names.forEach(function (n, i) {
var idx = i + 1;
var cls = idx < step ? 'done' : (idx === step ? 'now' : '');
out += '<div class="qstep ' + cls + '"><span class="dot">' + (idx < step ? '✓' : idx) + '</span><span>' + n + '</span></div>';
if (i < names.length - 1) out += '<div class="qline ' + (idx < step ? 'on' : '') + '"><i></i></div>';
});
return out + '</div>';
}
function reportHtml(st) {
var res = computeReport(st);
var top = res.filter(function (r) { return r.fit.length; }).slice(0, 6);
var total = res.filter(function (r) { return r.fit.length; }).length;
var sphereObj = SPHERES.filter(function (s) { return s.code === st.sphere; })[0];
var head = '<div class="report-head"><div><p class="eyebrow">Результат подбора</p>' +
'<h2 class="big">' + (total
? 'Найдено <b>' + total + '</b> ' + plural(total, 'профессия', 'профессии', 'профессий')
: 'Пока ничего не нашлось') + '</h2></div>' +
'<div class="report-actions"><button class="btn btn-sm" id="copyLink">Скопировать ссылку</button>' +
'<button class="btn btn-sm" id="printBtn">Печать / PDF</button>' +
'<button class="btn btn-sm btn-ghost" id="restart">Заново</button></div></div>';
var tags = '<div class="report-sum"><span class="tag">ЕГЭ: ' + h(st.exams.join(' · ')) + '</span>' +
'<span class="tag">Математика: ' + (st.mathLevel === 'basic' ? 'базовый уровень' : 'профильный уровень') + '</span>' +
'<span class="tag">Сумма: ' + st.sum + ' из 300</span>' +
'<span class="tag">Сфера: ' + h(sphereObj ? sphereObj.name : 'любая') + '</span></div>';
if (!top.length) {
return head + tags + '<div class="report-empty"><b>Подходящих программ не нашлось</b>' +
'<p>Попробуйте добавить предмет, снизить ожидаемую сумму или выбрать другую сферу.</p>' +
'<div class="hero-cta" style="justify-content:center"><button class="btn btn-sm" id="adjust">Изменить ответы</button></div></div>';
}
var tip = '<div class="tip"><b>Как читать статусы.</b> «Бюджет вероятен» — сумма баллов не ниже проходного 2024–2025. «Пограничная зона» — не более 10 баллов ниже. «Платное обучение» — бюджета, скорее всего, не хватит. Это ориентир, а не гарантия: конкурс меняется каждый год.</div>';
var cards = top.map(function (r) {
var list = r.fit.slice().sort(function (a, b) {
var sa = a.budget && a.budget <= st.sum ? 2 : (a.budget && a.budget <= st.sum + 10 ? 1 : 0);
var sb = b.budget && b.budget <= st.sum ? 2 : (b.budget && b.budget <= st.sum + 10 ? 1 : 0);
if (sa !== sb) return sb - sa;
return b.uni.avg - a.uni.avg;
}).slice(0, 3);
return '<article class="panel res reveal">' +
'<div class="res-top"><div><a href="#/professions/' + r.p.slug + '"><h3>' + h(r.p.title) + '</h3></a>' +
'<span class="label">' + h(r.p.sphereCode) + ' · ' + h(r.p.sphere) + '</span></div>' +
'<div class="res-score"><span class="v">' + r.score + '</span><span class="k">совпадение</span></div></div>' +
'<div class="res-unis">' + list.map(function (pr) {
var status = statusFor(pr.budget, st.sum);
return '<div class="res-uni"><span class="u"><b>' + h(pr.uni.short) + '</b> · ' + h(pr.direction) +
'<br><span class="status ' + status.cls + '">' + status.text + '</span></span>' +
'<span class="sc" title="Проходной балл на бюджет">' + (pr.budget ? '≈' + pr.budget : '—') + '</span></div>';
}).join('') + '</div>' +
'<p class="res-why">Подходит программ: <b>' + r.fit.length + '</b> из ' + r.progs.length +
' · бюджет проходит в <b>' + r.affordable.length + '</b>' +
(r.sphereMatch ? ' · сфера совпала' : '') + '</p>' +
'<a class="res-more" href="#/professions/' + r.p.slug + '">Паспорт профессии →</a>' +
'</article>';
}).join('');
return head + tags + tip + '<div class="res-grid">' + cards + '</div>' +
'<p class="quiz-note">Показаны 6 лучших совпадений из ' + total + '. Ссылка на результат сохраняет ответы — её можно отправить родителям или другу.</p>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 4 из 4 · результат</span>' +
'<div class="quiz-nav"><button class="btn" id="adjust">Изменить ответы</button>' +
'<a class="btn btn-primary" href="#/professions">Смотреть каталог</a></div></div>';
}
function quizStepBody(st) {
if (st.step === 2) {
return '<h2>Какая сфера ближе?</h2>' +
'<p class="hint">Сфера поднимает в списке профильные профессии. Шаг можно пропустить.</p>' +
'<div class="sphere-grid" id="sphereGrid">' +
'<button class="sphere" data-sphere="" aria-pressed="' + (st.sphere === '' ? 'true' : 'false') + '">' +
'<span class="c">Любая</span><span class="n">Все сферы</span>' +
'<span class="d">Показать всё, что подходит по предметам и баллам</span></button>' +
SPHERES.map(function (s) {
return '<button class="sphere" data-sphere="' + s.code + '" aria-pressed="' + (st.sphere === s.code ? 'true' : 'false') + '">' +
'<span class="c">' + s.code + '</span><span class="n">' + h(s.name) + '</span>' +
'<span class="d">' + h(SPHERE_DESC[s.code] || '') + ' · ' + s.count + ' ' +
plural(s.count, 'профессия', 'профессии', 'профессий') + '</span></button>';
}).join('') +
'</div>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 2 из 4</span>' +
'<div class="quiz-nav"><button class="btn" data-back>← Назад</button>' +
'<button class="btn btn-primary" data-next>Дальше →</button></div></div>';
}
if (st.step === 3) {
var pct = Math.round((st.sum - 120) / 180 * 100);
return '<h2>Ожидаемая сумма баллов</h2>' +
'<p class="hint">Сумма трёх экзаменов ЕГЭ, максимум 300. При отсутствии точного значения допускается ориентировочная оценка.</p>' +
'<div class="slider-box"><div class="row"><span class="big" id="sumVal">' + st.sum + '</span>' +
'<span class="hint">из 300 · в среднем <b id="avgVal">' + Math.round(st.sum / 3) + '</b> за предмет</span></div>' +
'<input id="sumRange" type="range" min="120" max="300" step="1" value="' + st.sum + '" style="--p:' + pct + '%" aria-label="Сумма баллов ЕГЭ">' +
'</div>' +
'<div class="quick">' + [180, 210, 240, 270, 290].map(function (v) {
return '<button data-quick="' + v + '">' + v + '</button>';
}).join('') + '</div>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 3 из 4</span>' +
'<div class="quiz-nav"><button class="btn" data-back>← Назад</button>' +
'<button class="btn btn-primary" data-next>Показать результат →</button></div></div>' +
'<p class="quiz-note">Шкала ориентировочная: 120–160 — чаще платное обучение, 200–240 — бюджет в региональных вузах, 260+ — ведущие вузы.</p>';
}
if (st.step === 4) return reportHtml(st);
return '<h2>Какие экзамены ЕГЭ выбраны?</h2>' +
'<p class="hint">До трёх предметов. Русский язык обязателен почти для всех программ.</p>' +
'<div class="exam-grid" id="examGrid">' + SUBJECTS.map(function (s) {
var on = st.exams.indexOf(s) >= 0;
return '<button class="exam" data-exam="' + s + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
'<span class="c">' + SUBJ_CODE[s] + '</span><span class="n">' + SUBJ_FULL[s] + '</span>' +
'<span class="tick">✓</span></button>';
}).join('') + '</div>' +
'<div class="math-level" id="mathLevelBox" ' + (st.exams.indexOf('Мат') >= 0 ? '' : 'hidden') + '><p class="label">Уровень математики</p><div class="math-level-grid"><button type="button" class="math-level-btn" data-math-level="profile" aria-pressed="' + ((st.mathLevel || 'profile') === 'profile' ? 'true' : 'false') + '"><b>Профильный</b><span>Для технических, ИТ и экономических программ</span></button><button type="button" class="math-level-btn" data-math-level="basic" aria-pressed="' + (st.mathLevel === 'basic' ? 'true' : 'false') + '"><b>Базовый</b><span>Для программ, где не нужен профильный экзамен</span></button></div></div>' +
'<div class="quiz-foot"><span class="quiz-count" id="examCount">' + st.exams.length + ' из 3 выбрано</span>' +
'<div class="quiz-nav"><button class="btn btn-primary" data-next ' + (st.exams.length ? '' : 'disabled') + '>Дальше →</button></div></div>' +
'<p class="quiz-note">Программа подходит, если все её экзамены есть среди выбранных. Альтернативы вроде «Инф / Физ» учитываются как «или».</p>';
}
function bindReport(st) {
var copy = document.getElementById('copyLink');
if (copy) copy.addEventListener('click', function () {
var params = quizParams(st);
params.set('step', '4');
copyLink(SITE_URL + 'quiz?' + params.toString());
});
var pr = document.getElementById('printBtn');
if (pr) pr.addEventListener('click', function () { window.print(); });
var rs = document.getElementById('restart');
if (rs) rs.addEventListener('click', function () {
st.step = 1;
st.exams = ['Рус', 'Мат', 'Инф'];
st.sphere = '';
st.sum = 240;
st.mathLevel = 'profile';
paintQuiz(st);
});
var adj = document.getElementById('adjust');
if (adj) adj.addEventListener('click', function () { st.step = 3; paintQuiz(st); });
}
function bindQuiz(st) {
var root = document.getElementById('quizRoot');
var grid = document.getElementById('examGrid');
if (grid) {
grid.addEventListener('click', function (e) {
var b = e.target.closest('[data-exam]');
if (!b) return;
var s = b.getAttribute('data-exam');
var i = st.exams.indexOf(s);
if (i >= 0) {
st.exams.splice(i, 1);
} else {
if (st.exams.length >= 3) { toast('Можно выбрать не больше трёх предметов'); return; }
st.exams.push(s);
}
b.setAttribute('aria-pressed', st.exams.indexOf(s) >= 0 ? 'true' : 'false');
var c = document.getElementById('examCount');
if (c) c.textContent = st.exams.length + ' из 3 выбрано';
var mlBox = document.getElementById('mathLevelBox');
if (mlBox) mlBox.hidden = st.exams.indexOf('Мат') < 0;
var next = root.querySelector('[data-next]');
if (next) next.disabled = !st.exams.length;
quizSync(st);
});
}
var ml = document.getElementById('mathLevelBox');
if (ml) ml.addEventListener('click', function (e) {
var b = e.target.closest('[data-math-level]');
if (!b) return;
st.mathLevel = b.getAttribute('data-math-level');
ml.querySelectorAll('[data-math-level]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
quizSync(st);
});
var sp = document.getElementById('sphereGrid');
if (sp) {
sp.addEventListener('click', function (e) {
var b = e.target.closest('[data-sphere]');
if (!b) return;
st.sphere = b.getAttribute('data-sphere');
sp.querySelectorAll('[data-sphere]').forEach(function (x) {
x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
});
quizSync(st);
});
}
var range = document.getElementById('sumRange');
if (range) {
range.addEventListener('input', function () {
st.sum = Number(range.value);
document.getElementById('sumVal').textContent = st.sum;
document.getElementById('avgVal').textContent = Math.round(st.sum / 3);
range.style.setProperty('--p', Math.round((st.sum - 120) / 180 * 100) + '%');
quizSync(st);
});
var quick = root.querySelector('.quick');
if (quick) {
quick.addEventListener('click', function (e) {
var b = e.target.closest('[data-quick]');
if (!b) return;
st.sum = Number(b.getAttribute('data-quick'));
range.value = st.sum;
range.dispatchEvent(new Event('input'));
});
}
}
root.onclick = function (e) {
var next = e.target.closest('[data-next]');
var back = e.target.closest('[data-back]');
if (next) {
if (st.step === 1 && !st.exams.length) { toast('Необходимо выбрать хотя бы один предмет'); return; }
st.step = Math.min(4, st.step + 1);
paintQuiz(st);
window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
} else if (back) {
st.step = Math.max(1, st.step - 1);
paintQuiz(st);
window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
}
};
if (st.step === 4) bindReport(st);
}
function paintQuiz(st) {
var root = document.getElementById('quizRoot');
if (!root) return;
root.innerHTML = '<div class="quiz panel">' + quizSteps(st.step) + quizStepBody(st) + '</div>';
bindQuiz(st);
quizSync(st);
initReveal(root);
}
// Переключатель «после 11 класса (ЕГЭ) / после 9 класса (ОГЭ)» на страницах опросников.
function quizModeSwitch(active) {
function link(id, href, label) {
var on = active === id;
return '<a class="qm' + (on ? ' on' : '') + '" href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' + label + '</a>';
}
return '<nav class="quiz-modes" aria-label="После какого класса подбирать">' +
link('ege', '#/quiz', 'После 11 класса · ЕГЭ') +
link('oge', '#/quiz-oge', 'После 9 класса · ОГЭ') +
'</nav>';
}
function renderQuiz(m, q) {
setTitle('Опросник: куда поступать — Профессии·2030');
var st = quizFromUrl(q);
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел II · Опросник</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,48px)">Опросник: куда <em>поступать</em></h1>' +
'<p class="lead">Четыре шага: предметы ЕГЭ, интересующая сфера, ожидаемая сумма баллов и результат. На выходе — профессии и конкретные программы с оценкой шансов на бюджет.</p>' +
'</section>' +
quizModeSwitch('ege') +
'<div id="quizRoot"></div>' +
'</div>';
paintQuiz(st);
}
// Предметы ОГЭ по выбору. В паспортах специальностей колледжей они записаны
// полными названиями («Информатика, Физика») — держим соответствие коротким кодам.
var OGE_SUBJECTS = ['Инф', 'Физ', 'Хим', 'Био', 'Общ', 'Ист', 'Лит', 'Ин.яз', 'Гео'];
var OGE_FULL = {
'Инф': 'Информатика', 'Физ': 'Физика', 'Хим': 'Химия', 'Био': 'Биология',
'Общ': 'Обществознание', 'Ист': 'История', 'Лит': 'Литература',
'Ин.яз': 'Иностранный язык', 'Гео': 'География'
};
var OGE_BY_FULL = {};
OGE_SUBJECTS.forEach(function (s) { OGE_BY_FULL[OGE_FULL[s]] = s; });
function parseOgeUseful(str) {
return String(str || '').split(',').map(function (s) {
return OGE_BY_FULL[s.trim()];
}).filter(Boolean);
}
// Предрасчёт по каждой специальности: полезные ОГЭ и ориентир среднего балла.
// Балл аттестата — десятичная дробь («4.35»), поэтому parseFloat, а не num()
// (num убирает все нецифровые символы и вернул бы 435).
var CINFO = {};
C.forEach(function (c) {
var d = CD[c.slug] || {};
var row = (d.passport || []).filter(function (r) { return /ОГЭ/.test(r.k); })[0];
var g = parseFloat(String(c.price).replace(',', '.'));
CINFO[c.slug] = { useful: parseOgeUseful(row && row.v), grade: isNaN(g) ? 0 : g };
});
function ogeFromUrl(q) {
var st = { step: 1, exams: ['Инф', 'Физ'], sphere: '', grade: 4.2 };
var has = q.has('e') || q.has('s') || q.has('g') || q.has('step');
if (!has) {
var saved = loadOgeQuiz();
if (saved) return saved;
}
var e = q.get('e');
if (e) {
var arr = e.split(',').filter(function (s) { return OGE_SUBJECTS.indexOf(s) >= 0; });
if (arr.length) st.exams = arr.slice(0, 2);
}
var s = q.get('s');
if (s && SPHERES.some(function (x) { return x.code === s; })) st.sphere = s;
var g = parseInt(q.get('g'), 10);
if (g >= 300 && g <= 500) st.grade = g / 100;
var step = parseInt(q.get('step'), 10);
if (step >= 1 && step <= 4) st.step = step;
return st;
}
function ogeParams(st) {
var p = new URLSearchParams();
if (st.step > 1) p.set('step', st.step);
p.set('e', st.exams.join(','));
if (st.sphere) p.set('s', st.sphere);
if (st.grade !== 4.2) p.set('g', Math.round(st.grade * 100));
return p;
}
function loadOgeQuiz() {
try {
var raw = localStorage.getItem('atlas:quiz-oge');
if (!raw) return null;
var o = JSON.parse(raw);
if (!o || !o.e || !o.e.length) return null;
var exams = o.e.filter(function (s) { return OGE_SUBJECTS.indexOf(s) >= 0; }).slice(0, 2);
if (!exams.length) return null;
var st = { step: 1, exams: exams, sphere: '', grade: 4.2 };
if (o.s && SPHERES.some(function (x) { return x.code === o.s; })) st.sphere = o.s;
var g = parseInt(o.g, 10);
if (g >= 300 && g <= 500) st.grade = g / 100;
var step = parseInt(o.step, 10);
if (step >= 1 && step <= 4) st.step = step;
return st;
} catch (e) { return null; }
}
function saveOgeQuiz(st) {
try {
var isDefault = st.step === 1 && !st.sphere && st.grade === 4.2 && st.exams.join(',') === 'Инф,Физ';
if (isDefault) localStorage.removeItem('atlas:quiz-oge');
else localStorage.setItem('atlas:quiz-oge', JSON.stringify({ e: st.exams, s: st.sphere, g: Math.round(st.grade * 100), step: st.step }));
} catch (e) {}
updateChoice();
syncChoiceOpen();
}
function clearOgeSaved() {
try { localStorage.removeItem('atlas:quiz-oge'); } catch (e) {}
updateChoice();
syncChoiceOpen();
}
function ogeSync(st) {
syncUrl('/quiz-oge', ogeParams(st));
saveOgeQuiz(st);
}
function ogeStatus(info, grade) {
if (!info.grade) return { cls: 'warn', text: 'Балл не указан' };
if (grade >= info.grade) return { cls: 'ok', text: 'Аттестат проходит' };
if (info.grade - grade <= 0.15) return { cls: 'warn', text: 'Пограничная зона' };
return { cls: 'bad', text: 'Нужен балл выше' };
}
function computeOgeReport(st) {
return C.map(function (c) {
var info = CINFO[c.slug] || { useful: [], grade: 0 };
var matched = info.useful.filter(function (s) { return st.exams.indexOf(s) >= 0; });
var coverage = info.useful.length ? matched.length / info.useful.length : 0;
var sphereMatch = !!st.sphere && c.sphereCode === st.sphere;
var gap = info.grade - st.grade;
var gradeFit = gap <= 0 ? 1 : Math.max(0, 1 - gap / 0.8);
var demand = Math.min(1, c.count / 9);
var score = 100 * (0.42 * coverage + 0.18 * (sphereMatch ? 1 : 0) + 0.25 * gradeFit + 0.15 * demand);
return {
c: c, info: info, matched: matched, coverage: coverage, sphereMatch: sphereMatch, gap: gap,
score: Math.max(0, Math.min(100, Math.round(score)))
};
}).sort(function (a, b) { return b.score - a.score || b.c.count - a.c.count; });
}
function ogeReportHtml(st) {
var res = computeOgeReport(st);
var hits = res.filter(function (r) { return r.coverage > 0 || r.sphereMatch; });
var top = hits.slice(0, 6);
var sph = SPHERES.filter(function (s) { return s.code === st.sphere; })[0];
var head = '<div class="report-head"><div><p class="eyebrow">Результат подбора · после 9 класса</p>' +
'<h2 class="big">' + (hits.length
? 'Найдено <b>' + hits.length + '</b> ' + plural(hits.length, 'специальность', 'специальности', 'специальностей')
: 'Пока ничего не нашлось') + '</h2></div>' +
'<div class="report-actions"><button class="btn btn-sm" id="copyLink">Скопировать ссылку</button>' +
'<button class="btn btn-sm" id="printBtn">Печать / PDF</button>' +
'<button class="btn btn-sm btn-ghost" id="restart">Заново</button></div></div>';
var tags = '<div class="report-sum">' +
'<span class="tag">ОГЭ: ' + h(st.exams.map(function (s) { return OGE_FULL[s]; }).join(' · ')) + '</span>' +
'<span class="tag">Аттестат: ' + st.grade.toFixed(2).replace('.', ',') + '</span>' +
'<span class="tag">Сфера: ' + h(sph ? sph.name : 'любая') + '</span></div>';
if (!top.length) {
return head + tags + '<div class="report-empty"><b>Подходящих специальностей не нашлось</b>' +
'<p>Попробуйте выбрать другие предметы по выбору или снизить ожидаемый средний балл аттестата.</p>' +
'<div class="hero-cta" style="justify-content:center"><button class="btn btn-sm" id="adjust">Изменить ответы</button></div></div>';
}
var tip = '<div class="tip"><b>Как читать статусы.</b> «Аттестат проходит» — средний балл не ниже ориентира приёма. «Пограничная зона» — не более 0,15 балла ниже. «Нужен балл выше» — стоит смотреть менее конкурсные специальности или платное. Это ориентир, а не гарантия: конкурс аттестатов зависит от набора и региона.</div>';
// Если в выбранной сфере ни одна специальность не попала в топ, подсказываем,
// какие предметы ОГЭ нужны для профильных направлений.
if (st.sphere && !top.some(function (r) { return r.sphereMatch; })) {
var need = [];
res.filter(function (r) { return r.sphereMatch; }).forEach(function (r) {
r.info.useful.forEach(function (s) {
if (st.exams.indexOf(s) < 0 && need.indexOf(s) < 0) need.push(s);
});
});
if (need.length) {
tip += '<div class="tip"><b>Сфера «' + h(sph ? sph.name : '') + '».</b> Профильные специальности требуют других предметов ОГЭ — ' +
h(need.map(function (s) { return OGE_FULL[s]; }).join(' и ')) +
'. Добавьте их на первом шаге, чтобы поднять такие специальности в списке.</div>';
}
}
var cards = top.map(function (r) {
var status = ogeStatus(r.info, st.grade);
return '<article class="panel res reveal">' +
'<div class="res-top"><div><a href="#/colleges/' + h(r.c.slug) + '"><h3>' + h(r.c.title) + '</h3></a>' +
'<span class="label">' + h(r.c.code) + ' · ' + h(r.c.sphereCode) + '</span></div>' +
'<div class="res-score"><span class="v">' + r.score + '</span><span class="k">совпадение</span></div></div>' +
'<div class="res-unis"><div class="res-uni"><span class="u"><b>' + h(r.c.duration) + '</b> · ' +
r.c.count + ' ' + plural(r.c.count, 'колледж', 'колледжа', 'колледжей') +
'<br><span class="status ' + status.cls + '">' + status.text + '</span></span>' +
'<span class="sc" title="Ориентир среднего балла аттестата">от ' + h(r.c.price) + '</span></div></div>' +
'<p class="res-why">Полезные ОГЭ: <b>' + h(r.info.useful.map(function (s) { return OGE_FULL[s]; }).join(' · ')) + '</b>' +
' · совпало ' + r.matched.length + ' из ' + r.info.useful.length +
(r.sphereMatch ? ' · сфера совпала' : '') + '</p>' +
'<a class="res-more" href="#/colleges/' + h(r.c.slug) + '">Специальность в колледжах →</a>' +
'</article>';
}).join('');
return head + tags + tip + '<div class="res-grid">' + cards + '</div>' +
'<p class="quiz-note">Показаны 6 лучших совпадений из ' + hits.length + '. Ссылка на результат сохраняет ответы — её можно отправить родителям.</p>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 4 из 4 · результат</span>' +
'<div class="quiz-nav"><button class="btn" id="adjust">Изменить ответы</button>' +
'<a class="btn btn-primary" href="#/colleges">Все специальности</a></div></div>';
}
function ogeStepBody(st) {
if (st.step === 2) {
return '<h2>Какая сфера ближе?</h2>' +
'<p class="hint">Сфера поднимает в списке профильные специальности. Шаг можно пропустить.</p>' +
'<div class="sphere-grid" id="sphereGrid">' +
'<button class="sphere" data-sphere="" aria-pressed="' + (st.sphere === '' ? 'true' : 'false') + '">' +
'<span class="c">Любая</span><span class="n">Все сферы</span>' +
'<span class="d">Показать всё, что подходит по предметам и баллу аттестата</span></button>' +
SPHERES.map(function (s) {
var n = C.filter(function (c) { return c.sphereCode === s.code; }).length;
return '<button class="sphere" data-sphere="' + s.code + '" aria-pressed="' + (st.sphere === s.code ? 'true' : 'false') + '">' +
'<span class="c">' + s.code + '</span><span class="n">' + h(s.name) + '</span>' +
'<span class="d">' + h(SPHERE_DESC[s.code] || '') + ' · ' + n + ' ' +
plural(n, 'специальность', 'специальности', 'специальностей') + '</span></button>';
}).join('') +
'</div>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 2 из 4</span>' +
'<div class="quiz-nav"><button class="btn" data-back>← Назад</button>' +
'<button class="btn btn-primary" data-next>Дальше →</button></div></div>';
}
if (st.step === 3) {
var pct = Math.round((st.grade - 3) / 2 * 100);
return '<h2>Средний балл аттестата</h2>' +
'<p class="hint">Среднее арифметическое итоговых оценок за 9 класс. Колледжи принимают по конкурсу аттестатов.</p>' +
'<div class="slider-box"><div class="row"><span class="big" id="gradeVal">' + st.grade.toFixed(2).replace('.', ',') + '</span>' +
'<span class="hint">из 5,00</span></div>' +
'<input id="gradeRange" type="range" min="3" max="5" step="0.05" value="' + st.grade + '" style="--p:' + pct + '%" aria-label="Средний балл аттестата">' +
'</div>' +
'<div class="quick">' + [3.5, 4, 4.5, 4.8].map(function (v) {
return '<button data-quick="' + v + '">' + v.toFixed(1).replace('.', ',') + '</button>';
}).join('') + '</div>' +
'<div class="quiz-foot"><span class="quiz-count">Шаг 3 из 4</span>' +
'<div class="quiz-nav"><button class="btn" data-back>← Назад</button>' +
'<button class="btn btn-primary" data-next>Показать результат →</button></div></div>' +
'<p class="quiz-note">Шкала ориентировочная: 3,5–3,9 — чаще платное или менее конкурсные специальности, 4,0–4,4 — бюджет в региональных колледжах, 4,5 и выше — самые конкурсные направления.</p>';
}
if (st.step === 4) return ogeReportHtml(st);
return '<h2>Какие предметы ОГЭ выбраны?</h2>' +
'<p class="hint">Русский язык и математика обязательны для всех. Выберите до двух предметов по выбору — их колледжи учитывают в конкурсе аттестатов.</p>' +
'<div class="oge-fixed"><span class="tag">Русский язык · обязательный</span><span class="tag">Математика · обязательный</span></div>' +
'<div class="exam-grid" id="examGrid">' + OGE_SUBJECTS.map(function (s) {
var on = st.exams.indexOf(s) >= 0;
return '<button class="exam" data-exam="' + s + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
'<span class="c">' + s + '</span><span class="n">' + OGE_FULL[s] + '</span>' +
'<span class="tick">✓</span></button>';
}).join('') + '</div>' +
'<div class="quiz-foot"><span class="quiz-count" id="examCount">' + st.exams.length + ' из 2 выбрано</span>' +
'<div class="quiz-nav"><button class="btn btn-primary" data-next ' + (st.exams.length ? '' : 'disabled') + '>Дальше →</button></div></div>' +
'<p class="quiz-note">Подбор учитывает «полезные ОГЭ» из паспорта специальности: чем больше совпадений, тем выше позиция в списке.</p>';
}
function bindOgeQuiz(st) {
var root = document.getElementById('quizRoot');
var grid = document.getElementById('examGrid');
if (grid) {
grid.addEventListener('click', function (e) {
var b = e.target.closest('[data-exam]');
if (!b) return;
var s = b.getAttribute('data-exam');
var i = st.exams.indexOf(s);
if (i >= 0) {
st.exams.splice(i, 1);
} else {
if (st.exams.length >= 2) { toast('Можно выбрать не больше двух предметов'); return; }
st.exams.push(s);
}
b.setAttribute('aria-pressed', st.exams.indexOf(s) >= 0 ? 'true' : 'false');
var c = document.getElementById('examCount');
if (c) c.textContent = st.exams.length + ' из 2 выбрано';
var next = root.querySelector('[data-next]');
if (next) next.disabled = !st.exams.length;
ogeSync(st);
});
}
var sp = document.getElementById('sphereGrid');
if (sp) {
sp.addEventListener('click', function (e) {
var b = e.target.closest('[data-sphere]');
if (!b) return;
st.sphere = b.getAttribute('data-sphere');
sp.querySelectorAll('[data-sphere]').forEach(function (x) {
x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
});
ogeSync(st);
});
}
var range = document.getElementById('gradeRange');
if (range) {
range.addEventListener('input', function () {
st.grade = Math.round(Number(range.value) * 100) / 100;
document.getElementById('gradeVal').textContent = st.grade.toFixed(2).replace('.', ',');
range.style.setProperty('--p', Math.round((st.grade - 3) / 2 * 100) + '%');
ogeSync(st);
});
var quick = root.querySelector('.quick');
if (quick) {
quick.addEventListener('click', function (e) {
var b = e.target.closest('[data-quick]');
if (!b) return;
st.grade = Number(b.getAttribute('data-quick'));
range.value = st.grade;
range.dispatchEvent(new Event('input'));
});
}
}
root.onclick = function (e) {
var next = e.target.closest('[data-next]');
var back = e.target.closest('[data-back]');
if (next) {
if (st.step === 1 && !st.exams.length) { toast('Необходимо выбрать хотя бы один предмет'); return; }
st.step = Math.min(4, st.step + 1);
paintQuizOge(st);
window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
} else if (back) {
st.step = Math.max(1, st.step - 1);
paintQuizOge(st);
window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
}
};
if (st.step === 4) {
var copy = document.getElementById('copyLink');
if (copy) copy.addEventListener('click', copyLink);
var pr = document.getElementById('printBtn');
if (pr) pr.addEventListener('click', function () { window.print(); });
var rs = document.getElementById('restart');
if (rs) rs.addEventListener('click', function () {
st.step = 1;
st.exams = ['Инф', 'Физ'];
st.sphere = '';
st.grade = 4.2;
paintQuizOge(st);
});
var adj = document.getElementById('adjust');
if (adj) adj.addEventListener('click', function () { st.step = 1; paintQuizOge(st); });
}
}
function paintQuizOge(st) {
var root = document.getElementById('quizRoot');
if (!root) return;
root.innerHTML = '<div class="quiz panel">' + quizSteps(st.step) + ogeStepBody(st) + '</div>';
bindOgeQuiz(st);
ogeSync(st);
initReveal(root);
}
function renderQuizOge(m, q) {
setTitle('Опросник после 9 класса: колледжи — Профессии·2030');
var st = ogeFromUrl(q);
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 26px">' +
'<p class="eyebrow">Раздел II · Опросник · После 9 класса</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,48px)">Куда пойти <em>после 9 класса</em></h1>' +
'<p class="lead">Четыре шага: предметы ОГЭ по выбору, интересующая сфера, средний балл аттестата и результат. На выходе — специальности колледжей с оценкой шансов на бюджет.</p>' +
'</section>' +
quizModeSwitch('oge') +
'<div id="quizRoot"></div>' +
'</div>';
paintQuizOge(st);
}
/* ============================================================ insights layer
   Тема, инструменты шапки, объёмная 3D-карта России, сравнение вузов,
   граф «профессия → специальность → вуз», тепловая карта и bubble-график. */
var THEME = 'dark';
try { THEME = localStorage.getItem('atlas:theme') === 'light' ? 'light' : 'dark'; } catch (e) {}
function cssColor(name, fallback) {
var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
return v || fallback;
}
function applyTheme() {
var swapTheme = function () {
document.documentElement.classList.toggle('theme-light', THEME === 'light');
};
if (document.startViewTransition && !noMotion) {
var vt;
try { vt = document.startViewTransition(swapTheme); } catch (e) { vt = null; swapTheme(); }
if (vt && vt.finished) vt.finished.catch(function () {});
if (vt && vt.ready) vt.ready.catch(function () {});
} else swapTheme();
var b = document.getElementById('atlasTheme');
if (b) {
var i = b.querySelector('.tt-ico');
if (i) {
i.innerHTML = THEME === 'light'
? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>';
}
var t = b.querySelector('.tt-label');
if (t) t.textContent = THEME === 'light' ? 'Тёмная' : 'Светлая';
b.setAttribute('aria-label', THEME === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
}
var meta = document.querySelector('meta[name="theme-color"]');
if (meta) meta.setAttribute('content', THEME === 'light' ? '#f4fbf9' : '#091116');
setTimeout(function () { renderHeatmap(); drawBubble(); }, 0);
}
function injectTools() {
var actions = document.querySelector('.hdr-actions');
if (!actions) return;
var wrap = document.getElementById('atlasTools');
if (!wrap) {
wrap = document.createElement('div');
wrap.className = 'atlas-tools';
wrap.id = 'atlasTools';
wrap.innerHTML = '<button id="atlasTheme" type="button" aria-label="Переключить тему"><span class="tt-ico" aria-hidden="true">◐</span><span class="tt-label">Тема</span></button>';
actions.insertBefore(wrap, actions.firstChild);
document.getElementById('atlasTheme').addEventListener('click', function () {
THEME = THEME === 'light' ? 'dark' : 'light';
try { localStorage.setItem('atlas:theme', THEME); } catch (e) {}
applyTheme();
});
}
placeTools();
}
function placeTools() {
var wrap = document.getElementById('atlasTools');
var nav = document.getElementById('nav');
var actions = document.querySelector('.hdr-actions');
if (!wrap || !nav || !actions) return;
if (window.matchMedia('(max-width:1099px)').matches) {
if (wrap.parentNode !== nav) { nav.appendChild(wrap); wrap.classList.add('in-nav'); }
} else if (wrap.parentNode !== actions) {
actions.insertBefore(wrap, actions.firstChild);
wrap.classList.remove('in-nav');
}
}
function updateFooterCounts() {
var el = document.querySelector('.ftr-brand .muted');
if (!el) return;
el.textContent = 'Исследовательский атлас профессий, востребованных в 2027–2030 годах: ' +
P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') + ', ' +
U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ', ' +
TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') + ' и ' +
SPECIALTIES.length + ' ' + plural(SPECIALTIES.length, 'специальность', 'специальности', 'специальностей') +
' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах') +
' России. Подбор вузов после 11 класса, колледжей после 9 класса и единая география федеральных округов.';
}
/* ---------- объёмная 3D-карта России с вузами ---------- */
var CITY_LL = {
  'Москва': [55.76, 37.62], 'Долгопрудный': [55.94, 37.51], 'Воронеж': [51.67, 39.18],
  'Ярославль': [57.63, 39.88], 'Тула': [54.2, 37.62], 'Рязань': [54.63, 39.69],
  'Калуга': [54.51, 36.26], 'Липецк': [52.6, 39.57], 'Тверь': [56.86, 35.92],
  'Курск': [51.73, 36.19], 'Белгород': [50.6, 36.59], 'Санкт-Петербург': [59.93, 30.34],
  'Архангельск': [64.54, 40.52], 'Сыктывкар': [61.67, 50.84], 'Петрозаводск': [61.79, 34.35],
  'Калининград': [54.71, 20.45], 'Мурманск': [68.96, 33.08], 'Вологда': [59.22, 39.89],
  'Псков': [57.82, 28.33], 'Великий Новгород': [58.52, 31.28], 'Ростов-на-Дону': [47.24, 39.7],
  'Новочеркасск': [47.42, 40.09], 'Краснодар': [45.04, 38.98], 'Сочи': [43.59, 39.72],
  'Волгоград': [48.71, 44.51], 'Астрахань': [46.35, 48.04], 'Элиста': [46.31, 44.26],
  'Ставрополь': [45.04, 41.97], 'Пятигорск': [44.05, 43.06], 'Нальчик': [43.49, 43.61],
  'Владикавказ': [43.04, 44.67], 'Грозный': [43.32, 45.7], 'Махачкала': [42.98, 47.5],
  'Черкесск': [44.23, 42.05], 'Магас': [43.17, 44.81], 'Казань': [55.8, 49.11],
  'Пермь': [58.01, 56.25], 'Нижний Новгород': [56.33, 44.01], 'Самара': [53.2, 50.1],
  'Уфа': [54.74, 55.97], 'Саратов': [51.53, 46.03], 'Ижевск': [56.85, 53.21],
  'Оренбург': [51.77, 55.1], 'Пенза': [53.2, 45.0], 'Киров': [58.6, 49.67],
  'Чебоксары': [56.14, 47.25], 'Йошкар-Ола': [56.64, 47.89], 'Саранск': [54.18, 45.17],
  'Ульяновск': [54.31, 48.4], 'Екатеринбург': [56.84, 60.61], 'Челябинск': [55.16, 61.44],
  'Магнитогорск': [53.42, 59.05], 'Тюмень': [57.15, 65.53], 'Курган': [55.44, 65.34],
  'Сургут': [61.25, 73.4], 'Ханты-Мансийск': [61.0, 69.0], 'Новосибирск': [55.01, 82.94],
  'Омск': [54.99, 73.32], 'Томск': [56.48, 84.95], 'Северск': [56.6, 84.89],
  'Иркутск': [52.29, 104.31], 'Ангарск': [52.54, 103.89], 'Братск': [56.13, 101.61],
  'Красноярск': [56.02, 92.89], 'Норильск': [69.35, 88.2], 'Барнаул': [53.35, 83.77],
  'Бийск': [52.54, 85.21], 'Кемерово': [55.35, 86.09], 'Новокузнецк': [53.76, 87.11],
  'Улан-Удэ': [51.83, 107.58], 'Чита': [52.03, 113.5], 'Абакан': [53.72, 91.43],
  'Кызыл': [51.72, 94.44], 'Владивосток': [43.12, 131.89], 'Хабаровск': [48.48, 135.08],
  'Комсомольск-на-Амуре': [50.55, 137.01], 'Якутск': [62.04, 129.68],
  'Благовещенск': [50.29, 127.53], 'Южно-Сахалинск': [46.96, 142.74],
  'Петропавловск-Камчатский': [53.04, 158.66], 'Магадан': [59.56, 150.8]
};
/* Контур страны: кольца записаны целыми десятыми долями градуса с дельтами. */
function rusDecode(a) {
var rings = [];
for (var i = 0; i < a.length;) {
var n = a[i++], ring = [], x = 0, y = 0;
for (var j = 0; j < n; j++) { x += a[i++]; y += a[i++]; ring.push([x / 10, y / 10]); }
rings.push(ring);
}
return rings;
}
var RUS_RINGS = rusDecode([247,1070,770,2,-5,39,2,30,-9,-2,-5,-45,-11,36,-2,5,-7,21,5,76,-8,1,7,37,-1,16,-6,5,-6,-6,-4,28,-12,10,10,16,-4,60,1,-8,9,14,4,90,-6,35,-14,60,1,8,-4,-1,-8,12,-3,69,2,18,-9,12,3,-8,7,5,4,81,-7,14,-4,0,-40,-26,-4,20,-16,-2,-7,-18,2,-37,-8,-34,-18,-14,7,-26,-8,-5,4,-23,-3,-15,-17,12,-6,-1,-14,-10,-1,-4,-8,4,-4,-17,-6,-4,-11,-15,-2,-3,-11,-14,-9,-14,44,5,14,9,10,16,3,53,30,8,15,-12,-1,-6,-9,-26,-11,-8,13,-26,-4,-25,-16,8,-7,-37,-3,0,7,-15,2,-13,-5,-63,-2,-71,-43,16,-1,15,-8,17,4,14,-11,-12,-47,-52,-50,-14,-6,-12,5,-15,-11,2,28,21,1,19,34,-40,-7,-4,9,-12,7,-17,4,-18,30,-8,4,-41,1,-8,-5,5,-8,-14,-19,-14,-6,-35,7,-37,-11,-22,2,-16,10,-32,-2,-14,4,-2,8,-32,7,-11,-10,4,-6,-9,-7,-51,11,-48,-16,-40,19,-15,-3,-13,6,-6,-5,-35,33,4,3,-35,-10,1,5,-23,1,-3,11,-18,2,-77,-14,-4,-3,7,-7,-17,-10,16,-7,-3,-5,-45,2,-11,-4,-34,11,-15,0,-21,-11,-1,-7,-11,6,-10,-21,16,-7,10,-13,-24,-18,19,-28,-8,-6,-23,13,-55,9,-33,18,15,10,-5,4,14,4,-9,1,1,4,14,4,4,17,-47,10,-4,6,-8,1,2,5,-6,5,-20,-2,-5,10,14,3,-19,14,1,8,-27,6,-9,13,4,3,-3,9,17,13,-10,5,34,24,-15,7,4,6,-9,7,7,9,-11,11,9,8,-16,7,2,7,35,8,90,-24,0,-7,-27,-8,-52,6,16,-7,1,-15,21,-6,-5,10,7,3,24,-6,8,3,-6,7,23,10,18,-4,6,7,-8,6,5,6,-7,6,28,-3,5,-6,-12,-1,0,-6,7,-3,74,22,8,-1,-10,-6,53,7,11,-6,12,6,-11,6,6,4,79,-18,7,5,-23,9,4,4,-6,11,32,20,27,-2,2,-6,-10,-8,10,-10,-2,-14,11,-6,-24,-21,11,-1,27,16,-6,5,4,7,-11,1,-2,5,8,10,-13,8,18,7,-2,7,10,-5,-4,-10,11,-1,-5,7,17,4,39,-5,-9,8,-1,10,63,3,-8,6,12,6,136,13,12,9,24,4,17,-3,-14,-3,16,575,707,-38,1,-21,7,-1,5,10,2,-1,6,20,8,-9,1,24,9,-3,5,126,18,7,-4,-7,-3,-97,-19,-31,-19,2,-9,16,1850,666,7,-3,-3,8,27,-2,20,-9,-26,-6,-5,-11,-32,11,-22,0,-5,3,2,4,-12,-2,5,-5,-6,-4,0,40,51,-18,5,999,789,-49,1,-38,13,47,10,43,-15,15,1436,507,11,-17,-15,3,-6,-14,9,-11,0,-7,-8,6,-6,-7,1,50,-6,9,1,14,9,5,-4,4,5,2,5,-26,6,1451,756,-8,-8,-53,-2,-20,7,5,6,40,2,4,1051,783,-57,-4,27,14,33,-6,6,511,805,-35,-5,-11,2,6,4,-23,0,67,1,4,227,543,-30,1,16,8,14,-6,4,1507,751,-27,-3,-19,4,21,1,4,1436,732,-37,2,22,5,14,-4,4,1813,709,-13,-1,1,8,22,-5,3,1800,708,-13,3,13,4]);
var RUS_COLORS = {
  'ЦФО': '#5eead4', 'СЗФО': '#38bdf8', 'ЮФО': '#2dd4bf', 'СКФО': '#a78bfa',
  'ПФО': '#22d3ee', 'УФО': '#34d399', 'СФО': '#818cf8', 'ДФО': '#f0abfc'
};
/* Проекция Альберса: конусная равновеликая, стандартные параллели 50° и 70°. */
var RUS_GEO = (function () {
  var rad = Math.PI / 180;
  var p1 = 50 * rad, p2 = 70 * rad, p0 = 60 * rad, l0 = 100 * rad;
  var n = (Math.sin(p1) + Math.sin(p2)) / 2;
  var C = Math.cos(p1) * Math.cos(p1) + 2 * n * Math.sin(p1);
  var rho0 = Math.sqrt(C - 2 * n * Math.sin(p0)) / n;
  function raw(lon, lat) {
    var rho = Math.sqrt(C - 2 * n * Math.sin(lat * rad)) / n;
    var th = n * (lon * rad - l0);
    return [rho * Math.sin(th), rho0 - rho * Math.cos(th)];
  }
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  RUS_RINGS.forEach(function (ring) {
    ring.forEach(function (p) {
      var q = raw(p[0], p[1]);
      if (q[0] < minX) minX = q[0];
      if (q[0] > maxX) maxX = q[0];
      if (q[1] < minY) minY = q[1];
      if (q[1] > maxY) maxY = q[1];
    });
  });
  var k = 1000 / (maxX - minX);
  var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  function norm(lon, lat) {
    var q = raw(lon, lat);
    return [(q[0] - cx) * k, (q[1] - cy) * k];
  }
  return {
    rings: RUS_RINGS.map(function (ring) {
      return ring.map(function (p) { return norm(p[0], p[1]); });
    }),
    project: norm,
    w: 1000,
    h: (maxY - minY) * k
  };
})();
var RUS_SLAB = 34;   /* толщина объёма страны в единицах карты */
var RUS_VIEW = { yaw: -0.18, pitch: 0.86, zoom: 1 };
var RUS_ICO = {
  play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5.2l11 6.8-11 6.8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.6"/></svg>'
};
var mapState = null;

function mapCities() {
  var byCity = {};
  U.forEach(function (u) {
    var c = byCity[u.city];
    if (!c) {
      c = byCity[u.city] = { city: u.city, count: 0, avgSum: 0, unis: [], district: u.district, region: u.region };
    }
    c.count++;
    c.avgSum += u.avg;
    c.unis.push(u);
  });
  var out = [];
  for (var key in byCity) {
    if (!Object.prototype.hasOwnProperty.call(byCity, key)) continue;
    var c = byCity[key];
    var ll = CITY_LL[c.city];
    if (!ll) continue;
    /* CITY_LL хранит [широта, долгота], проекция ждёт [долгота, широта]. */
    var p = RUS_GEO.project(ll[1], ll[0]);
    c.x = p[0];
    c.y = p[1];
    c.avg = Math.round(c.avgSum / c.count);
    c.pin = 16 + Math.min(c.count, 12) * 3.4;
    out.push(c);
  }
  out.sort(function (a, b) { return b.count - a.count; });
  return out;
}
function hexMix(a, b, t) {
  function c(v) { v = v.replace('#', ''); if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2]; var i = parseInt(v, 16); return [i >> 16 & 255, i >> 8 & 255, i & 255]; }
  var A = c(a), B = c(b);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
}
function drawRussia() {
  var st = mapState;
  if (!st || !st.cv || !st.cv.isConnected) return;
  var cv = st.cv, ctx = st.ctx;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  var pw = Math.round(W * dpr), ph = Math.round(H * dpr);
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  var light = document.documentElement.classList.contains('theme-light');
  var cTop1 = light ? '#e4f7f2' : '#1a5b67';
  var cTop2 = light ? '#bfe3da' : '#0a2028';
  var cEdge = light ? '#0f9e8e' : '#5eead4';
  var cWallLit = light ? '#a7cbc2' : '#0c2832';
  var cWallDark = light ? '#6ea79b' : '#030d11';
  var cGrid = light ? 'rgba(15,158,142,.18)' : 'rgba(94,234,212,.12)';
  var cLabel = light ? '#1c4f47' : 'rgba(226,246,242,.82)';
  var ca = Math.cos(st.yaw), sa = Math.sin(st.yaw);
  var cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  var D = 5200;
  function rot(x, y, z) {
    var X = x * ca - y * sa;
    var Y = x * sa + y * ca;
    return { X: X, Y: Y * cp + z * sp, Z: -Y * sp + z * cp };
  }
  /* Габариты карты в экранных единицах — для подгонки под полотно. */
  var samples = [];
  RUS_GEO.rings.forEach(function (ring) {
    ring.forEach(function (p) {
      samples.push([p[0], p[1], 0]);
      samples.push([p[0], p[1], -RUS_SLAB]);
    });
  });
  st.cities.forEach(function (c) { samples.push([c.x, c.y, c.pin * 0.6]); });
  var mnu = 1e9, mxu = -1e9, mnv = 1e9, mxv = -1e9;
  samples.forEach(function (s) {
    var r = rot(s[0], s[1], s[2]);
    var pr = D / (D - r.Z);
    var u = r.X * pr, v = r.Y * pr;
    if (u < mnu) mnu = u;
    if (u > mxu) mxu = u;
    if (v < mnv) mnv = v;
    if (v > mxv) mxv = v;
  });
  var padX = 30, padY = 28;
  var fit = Math.min((W - padX * 2) / Math.max(1, mxu - mnu), (H - padY * 2) / Math.max(1, mxv - mnv));
  var scale = Math.max(0.05, fit) * st.zoom;
  var ox = W / 2 - (mnu + mxu) / 2 * scale;
  var oy = H / 2 + (mnv + mxv) / 2 * scale;
  function P(x, y, z) {
    var s = rot(x, y, z);
    var persp = D / (D - s.Z);
    return { x: ox + s.X * persp * scale, y: oy - s.Y * persp * scale, z: s.Z };
  }
  /* Мягкое свечение под картой. */
  var glow = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.55);
  glow.addColorStop(0, light ? 'rgba(20,184,166,.14)' : 'rgba(20,184,166,.16)');
  glow.addColorStop(1, 'rgba(20,184,166,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  /* Боковые стенки объёма: дальние к ближним. */
  var walls = [];
  RUS_GEO.rings.forEach(function (ring) {
    for (var i = 0; i < ring.length; i++) {
      var a = ring[i], b = ring[(i + 1) % ring.length];
      var p1 = P(a[0], a[1], 0), p2 = P(b[0], b[1], 0);
      var q1 = P(a[0], a[1], -RUS_SLAB), q2 = P(b[0], b[1], -RUS_SLAB);
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var len = Math.hypot(dx, dy) || 1;
      var nx = dy / len, ny = -dx / len;
      var lit = Math.max(0, Math.min(1, 0.5 + 0.5 * (nx * -0.5 + ny * 0.86)));
      walls.push({ p1: p1, p2: p2, q1: q1, q2: q2, z: (p1.z + p2.z) / 2, lit: lit });
    }
  });
  walls.sort(function (x, y) { return x.z - y.z; });
  walls.forEach(function (w) {
    ctx.beginPath();
    ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
    ctx.lineTo(w.q2.x, w.q2.y);
    ctx.lineTo(w.q1.x, w.q1.y);
    ctx.closePath();
    ctx.fillStyle = hexMix(cWallDark, cWallLit, w.lit);
    ctx.fill();
  });
  /* Верхняя грань. */
  var topPath = null;
  RUS_GEO.rings.forEach(function (ring, idx) {
    ctx.beginPath();
    ring.forEach(function (p, i) {
      var s = P(p[0], p[1], 0);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    if (idx === 0) {
      topPath = new Path2D();
      ring.forEach(function (p, i) {
        var s = P(p[0], p[1], 0);
        if (i === 0) topPath.moveTo(s.x, s.y); else topPath.lineTo(s.x, s.y);
      });
      topPath.closePath();
      var g = ctx.createLinearGradient(0, H * 0.15, 0, H * 0.95);
      g.addColorStop(0, cTop1);
      g.addColorStop(1, cTop2);
      ctx.fillStyle = g;
      ctx.fill();
      /* Мягкий блик по поверхности — читается объём, а не плоская заливка. */
      var hl = ctx.createRadialGradient(W * 0.42, H * 0.3, 8, W * 0.42, H * 0.34, Math.max(W, H) * 0.62);
      hl.addColorStop(0, light ? 'rgba(255,255,255,.55)' : 'rgba(120,240,220,.20)');
      hl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hl;
      ctx.fill();
    } else {
      ctx.fillStyle = cTop2;
      ctx.fill();
    }
    ctx.strokeStyle = cEdge;
    ctx.globalAlpha = idx === 0 ? 0.85 : 0.5;
    ctx.lineWidth = idx === 0 ? 1.4 : 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  /* Сетка координат внутри силуэта страны. */
  if (topPath) {
    ctx.save();
    ctx.clip(topPath);
    ctx.strokeStyle = cGrid;
    ctx.lineWidth = 1;
    for (var lon = 20; lon <= 190; lon += 10) {
      ctx.beginPath();
      for (var la = 40; la <= 81; la += 2) {
        var q = RUS_GEO.project(lon, la);
        var s2 = P(q[0], q[1], 0);
        if (la === 40) ctx.moveTo(s2.x, s2.y); else ctx.lineTo(s2.x, s2.y);
      }
      ctx.stroke();
    }
    for (var lat = 45; lat <= 80; lat += 5) {
      ctx.beginPath();
      for (var lo = 19; lo <= 190; lo += 2) {
        var q2 = RUS_GEO.project(lo, lat);
        var s3 = P(q2[0], q2[1], 0);
        if (lo === 19) ctx.moveTo(s3.x, s3.y); else ctx.lineTo(s3.x, s3.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  /* Метки вузов. */
  var marks = [];
  st.labelBoxes = [];
  var labelMin = W < 560 ? 8 : 5;
  var list = st.cities.slice().sort(function (a, b) { return a.y - b.y; });
  list.forEach(function (c) {
    var dim = st.filter && c.district !== st.filter;
    var base = P(c.x, c.y, 0);
    var top = P(c.x, c.y, c.pin);
    var col = RUS_COLORS[c.district] || '#5eead4';
    ctx.globalAlpha = dim ? 0.22 : 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = dim ? 1 : 1.3;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
    var r = (3.4 + Math.min(c.count, 12) * 0.52) * (dim ? 0.8 : 1);
    ctx.shadowColor = col;
    ctx.shadowBlur = dim ? 0 : 10;
    ctx.beginPath();
    ctx.arc(top.x, top.y, r, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = light ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.75)';
    ctx.stroke();
    if (st.hover === c) {
      ctx.beginPath();
      ctx.arc(top.x, top.y, r + 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    if (!dim && c.count >= labelMin) {
      ctx.font = '600 11px ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      var tw = ctx.measureText(c.city).width;
      var cand = [
        [top.x + r + 6, top.y + 1],
        [top.x - r - 6 - tw, top.y + 1],
        [top.x - tw / 2, top.y - r - 10],
        [top.x - tw / 2, top.y + r + 12]
      ];
      for (var li = 0; li < cand.length; li++) {
        var lb = [cand[li][0], cand[li][1] - 7, cand[li][0] + tw, cand[li][1] + 7];
        var hit = false;
        for (var q = 0; q < st.labelBoxes.length; q++) {
          var bb = st.labelBoxes[q];
          if (lb[0] < bb[2] && lb[2] > bb[0] && lb[1] < bb[3] && lb[3] > bb[1]) { hit = true; break; }
        }
        if (hit) continue;
        st.labelBoxes.push(lb);
        ctx.shadowColor = 'rgba(3,12,16,.75)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = cLabel;
        ctx.fillText(c.city, cand[li][0], cand[li][1]);
        ctx.shadowBlur = 0;
        break;
      }
    }
    ctx.globalAlpha = 1;
    marks.push({ c: c, x: top.x, y: top.y, r: r + 6, dim: dim });
  });
  st.marks = marks;
}
function mapHitTest(x, y) {
  var st = mapState;
  if (!st) return null;
  var best = null, bestD = 1e9;
  st.marks.forEach(function (m) {
    if (m.dim) return;
    var d = Math.hypot(m.x - x, m.y - y);
    if (d < m.r && d < bestD) { bestD = d; best = m.c; }
  });
  return best;
}
/* Плавный разворот карты к городу и только потом переход в каталог. */
function flyToCity(c) {
var st = mapState;
if (!st) { location.hash = '#/universities?city=' + encodeURIComponent(c.city); return; }
st.auto = false;
if (st.updateSpin) st.updateSpin();
var target = Math.atan2(c.x, c.y);
var d = target - st.yaw;
while (d > Math.PI) d -= Math.PI * 2;
while (d < -Math.PI) d += Math.PI * 2;
var y0 = st.yaw, p0 = st.pitch, z0 = st.zoom;
var y1 = st.yaw + d, p1 = 0.72, z1 = 2.1;
var t0 = performance.now(), dur = noMotion ? 1 : 760;
function step(now) {
var t = Math.min(1, (now - t0) / dur);
var e = 1 - Math.pow(1 - t, 3);
st.yaw = y0 + (y1 - y0) * e;
st.pitch = p0 + (p1 - p0) * e;
st.zoom = z0 + (z1 - z0) * e;
drawRussia();
if (t < 1) { requestAnimationFrame(step); return; }
location.hash = '#/universities?city=' + encodeURIComponent(c.city);
}
requestAnimationFrame(step);
}
/* Мягкий параллакс фотографии на странице профессии. */
function initPhotoParallax() {
var fig = app.querySelector('.photo-fig');
if (!fig || noMotion) return;
var img = fig.querySelector('img');
if (!img) return;
function onScroll() {
if (!fig.isConnected) { window.removeEventListener('scroll', onScroll); return; }
var r = fig.getBoundingClientRect();
var mid = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
img.style.transform = 'scale(1.06) translateY(' + (mid * -14).toFixed(1) + 'px)';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
}
/* Скелетон изображения: пока WebP не загрузился, под ним видна
   мерцающая подложка. После load она отключается. */
function initPhotoSkeleton() {
app.querySelectorAll('.photo-fig').forEach(function (fig) {
var img = fig.querySelector('img');
if (!img) { fig.classList.add('is-ready'); return; }
function done() { fig.classList.add('is-ready'); }
if (img.complete && img.naturalWidth) done();
else {
img.addEventListener('load', done, { once: true });
img.addEventListener('error', done, { once: true });
}
});
}
/* Магнитные кнопки: лёгкое смещение к курсору. Только на устройствах
   с точным указателем и без режима уменьшения движения. */
var magnetRaf = 0, magnetBtn = null, magnetX = 0, magnetY = 0;
function initMagnet() {
if (!canTilt || noMotion) return;
document.addEventListener('pointermove', function (e) {
if (noMotion) return;
var b = e.target.closest && e.target.closest('.btn');
if (!b || b.disabled) return;
if (!b.classList.contains('magnet')) b.classList.add('magnet');
magnetBtn = b; magnetX = e.clientX; magnetY = e.clientY;
if (magnetRaf) return;
magnetRaf = requestAnimationFrame(function () {
magnetRaf = 0;
if (!magnetBtn || !magnetBtn.isConnected) return;
var r = magnetBtn.getBoundingClientRect();
var dx = (magnetX - (r.left + r.width / 2)) / Math.max(1, r.width / 2);
var dy = (magnetY - (r.top + r.height / 2)) / Math.max(1, r.height / 2);
magnetBtn.style.setProperty('--mx', (dx * 3).toFixed(1) + 'px');
magnetBtn.style.setProperty('--my', (dy * 2.5).toFixed(1) + 'px');
});
}, { passive: true });
document.addEventListener('pointerout', function (e) {
var b = e.target.closest && e.target.closest('.btn');
if (!b) return;
if (e.relatedTarget && b.contains(e.relatedTarget)) return;
b.style.removeProperty('--mx');
b.style.removeProperty('--my');
}, { passive: true });
}
function mapShowTip(c, x, y) {
  var st = mapState;
  if (!st || !st.tip) return;
  if (!c) { st.tip.hidden = true; return; }
  st.tip.innerHTML = '';
  var name = document.createElement('b');
  name.textContent = c.city;
  var meta = document.createElement('span');
  meta.textContent = c.count + ' ' + plural(c.count, 'вуз', 'вуза', 'вузов') + ' · ≈' + c.avg + ' балла · ' + c.district;
  var reg = document.createElement('em');
  reg.textContent = c.region;
  st.tip.appendChild(name);
  st.tip.appendChild(meta);
  st.tip.appendChild(reg);
  st.tip.hidden = false;
  var stage = st.stage.getBoundingClientRect();
  var tw = st.tip.offsetWidth, th = st.tip.offsetHeight;
  var left = Math.max(6, Math.min(stage.width - tw - 6, x + 14));
  var top = Math.max(6, Math.min(stage.height - th - 6, y - th - 12));
  st.tip.style.left = left + 'px';
  st.tip.style.top = top + 'px';
}
function initRussiaMap() {
  var cv = document.getElementById('rusCanvas');
  if (!cv) return;
  var stage = document.getElementById('rusStage');
  var tip = document.getElementById('rusTip');
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  var st = {
    cv: cv, ctx: ctx, stage: stage, tip: tip,
    yaw: RUS_VIEW.yaw, pitch: RUS_VIEW.pitch, zoom: RUS_VIEW.zoom, auto: true, drag: false, moved: 0,
    hover: null, filter: '', cities: mapCities(), marks: [], raf: 0
  };
  mapState = st;
  window.__atlasMap = st;
  function frame() {
    st.raf = requestAnimationFrame(frame);
    if (!cv.isConnected) { cancelAnimationFrame(st.raf); mapState = null; return; }
    if (st.auto && !st.drag) st.yaw += 0.0016;
    drawRussia();
  }
  st.frame = frame;
  frame();
  /* Вращение мышью и пальцем. */
  var px = 0, py = 0;
  cv.addEventListener('pointerdown', function (e) {
    st.drag = true;
    st.moved = 0;
    px = e.clientX;
    py = e.clientY;
    /* Взятие карты рукой останавливает автоповорот — иначе метка убегает из-под курсора. */
    if (st.auto) { st.auto = false; updateSpinUI(); }
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    cv.classList.add('grabbing');
  });
  cv.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (st.drag) {
      var dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      st.moved += Math.abs(dx) + Math.abs(dy);
      st.yaw += dx * 0.006;
      st.pitch = Math.max(0.22, Math.min(1.42, st.pitch + dy * 0.005));
      st.hover = null;
      mapShowTip(null);
      cv.style.cursor = 'grabbing';
    } else {
      var c = mapHitTest(x, y);
      if (c !== st.hover) {
        st.hover = c;
        mapShowTip(c, x, y);
      } else if (c) {
        mapShowTip(c, x, y);
      }
      cv.style.cursor = c ? 'pointer' : 'grab';
    }
  });
  function endDrag(e) {
    if (!st.drag) return;
    st.drag = false;
    cv.classList.remove('grabbing');
    if (st.moved < 6) {
      var r = cv.getBoundingClientRect();
      var c = mapHitTest(e.clientX - r.left, e.clientY - r.top);
      if (c) flyToCity(c);
    }
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', function () { st.drag = false; cv.classList.remove('grabbing'); });
  cv.addEventListener('pointerleave', function () {
    if (st.drag) return;
    st.hover = null;
    mapShowTip(null);
  });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    st.zoom = Math.max(0.6, Math.min(2.4, st.zoom * (1 - e.deltaY * 0.0012)));
    drawRussia();
  }, { passive: false });
  cv.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft') st.yaw -= 0.12;
    else if (k === 'ArrowRight') st.yaw += 0.12;
    else if (k === 'ArrowUp') st.pitch = Math.max(0.22, st.pitch - 0.08);
    else if (k === 'ArrowDown') st.pitch = Math.min(1.42, st.pitch + 0.08);
    else if (k === '+' || k === '=') st.zoom = Math.min(2.4, st.zoom * 1.12);
    else if (k === '-' || k === '_') st.zoom = Math.max(0.6, st.zoom / 1.12);
    else if (k === 'Home') { st.yaw = RUS_VIEW.yaw; st.pitch = RUS_VIEW.pitch; st.zoom = RUS_VIEW.zoom; }
    else if (k === ' ' || k === 'Spacebar') { st.auto = !st.auto; updateSpinUI(); }
    else return;
    e.preventDefault();
    drawRussia();
  });
  var zin = document.getElementById('rusZoomIn');
  var zout = document.getElementById('rusZoomOut');
  var spin = document.getElementById('rusSpin');
  var reset = document.getElementById('rusReset');
  var stop = document.getElementById('rusStop');
  var state = document.getElementById('rusState');
  function updateSpinUI() {
    if (spin) {
      spin.innerHTML = st.auto ? RUS_ICO.pause : RUS_ICO.play;
      spin.setAttribute('aria-pressed', st.auto ? 'true' : 'false');
      spin.setAttribute('aria-label', st.auto ? 'Остановить вращение карты' : 'Продолжить вращение карты');
      spin.setAttribute('title', st.auto ? 'Остановить вращение' : 'Продолжить вращение');
      spin.classList.toggle('on', st.auto);
    }
    st.updateSpin = updateSpinUI;
  if (state) state.textContent = st.auto ? 'Вращение включено' : 'Карта остановлена';
    if (state) state.classList.toggle('off', !st.auto);
  }
  if (zin) zin.addEventListener('click', function () { st.zoom = Math.min(2.4, st.zoom * 1.18); drawRussia(); });
  if (zout) zout.addEventListener('click', function () { st.zoom = Math.max(0.6, st.zoom / 1.18); drawRussia(); });
  if (spin) spin.addEventListener('click', function () {
    st.auto = !st.auto;
    updateSpinUI();
    drawRussia();
  });
  /* «Стоп»: вращение выключается, карта возвращается в исходное положение. */
  if (stop) stop.addEventListener('click', function () {
    st.auto = false;
    st.yaw = RUS_VIEW.yaw;
    st.pitch = RUS_VIEW.pitch;
    st.zoom = RUS_VIEW.zoom;
    updateSpinUI();
    drawRussia();
  });
  if (reset) reset.addEventListener('click', function () {
    st.yaw = RUS_VIEW.yaw;
    st.pitch = RUS_VIEW.pitch;
    st.zoom = RUS_VIEW.zoom;
    drawRussia();
  });
  updateSpinUI();
  var chips = document.getElementById('rusChips');
  if (chips) chips.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-district]') : null;
    if (!b) return;
    st.filter = b.getAttribute('data-district');
    chips.querySelectorAll('button[data-district]').forEach(function (x) {
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    });
    drawRussia();
  });
  window.addEventListener('resize', function () { drawRussia(); });
}
function renderMap() {
  setTitle('Карта России с вузами — Профессии·2030');
  var cities = mapCities();
  var cityCount = {};
  U.forEach(function (u) { cityCount[u.city] = (cityCount[u.city] || 0) + 1; });
  var topCities = Object.keys(cityCount).sort(function (a, b) {
    return cityCount[b] - cityCount[a] || a.localeCompare(b, 'ru');
  }).slice(0, 14);
  var biggest = DISTRICTS.slice().sort(function (a, b) { return b.count - a.count; })[0];
  var totalPrograms = U.reduce(function (n, u) { return n + (u.programs || []).length; }, 0);
  var chips = '<button class="chip" type="button" data-district="" aria-pressed="true">Все округа</button>' +
    FEDERAL.map(function (d) {
      var n = U.filter(function (u) { return u.district === d.code; }).length;
      return '<button class="chip rus-chip" type="button" data-district="' + h(d.code) + '" aria-pressed="false">' +
        '<i class="rus-dot" style="background:' + (RUS_COLORS[d.code] || '#5eead4') + '"></i>' +
        h(d.code) + ' <span class="mono">' + n + '</span></button>';
    }).join('');
  var legend = FEDERAL.map(function (d) {
    var n = U.filter(function (u) { return u.district === d.code; }).length;
    return '<span class="rus-leg"><i class="rus-dot" style="background:' + (RUS_COLORS[d.code] || '#5eead4') + '"></i>' +
      h(d.code) + ' · ' + n + '</span>';
  }).join('');
  app.innerHTML = '<div class="view">' +
    '<section class="hero" style="padding:44px 0 22px">' +
    '<p class="eyebrow">Раздел · География</p>' +
    '<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Объёмная карта <em>России</em></h1>' +
    '<p class="lead">Объёмная модель страны: координатная сетка и метки городов с вузами. ' +
    'Высота метки — число вузов в городе, цвет — федеральный округ. Нажатие открывает город в каталоге.</p>' +
    '<div class="hero-cta"><a class="btn btn-primary" href="#/universities">Каталог вузов</a>' +
    '<a class="btn" href="#/regions">Все регионы</a>' +
    '<a class="btn" href="#/compare">Сравнение</a></div>' +
    '</section>' +
    '<div class="rus-wrap">' +
    '<div class="rus-bar"><div class="chips rus-chips" id="rusChips" role="group" aria-label="Фильтр по федеральным округам">' + chips + '</div>' +
    '<div class="rus-ctrl">' +
    '<button id="rusZoomOut" type="button" aria-label="Отдалить" title="Отдалить">−</button>' +
    '<button id="rusZoomIn" type="button" aria-label="Приблизить" title="Приблизить">+</button>' +
    '<button id="rusSpin" type="button" class="on" aria-label="Остановить вращение карты" aria-pressed="true" title="Остановить вращение"></button>' +
    '<button id="rusStop" type="button" aria-label="Остановить карту и вернуть исходный вид" title="Остановить и вернуть исходный вид">' + RUS_ICO.stop + '</button>' +
    '<button id="rusReset" type="button" aria-label="Сбросить вид" title="Сбросить вид">⌂</button>' +
    '</div></div>' +
    '<div class="rus-stage" id="rusStage">' +
    '<canvas id="rusCanvas" tabindex="0" role="img" aria-label="Объёмная карта России с метками городов, где есть вузы"></canvas>' +
    '<span class="rus-state" id="rusState">Вращение включено</span>' +
    '<div class="rus-tip" id="rusTip" hidden></div>' +
    '<p class="rus-hint">Тяните карту — поворот · колесо — масштаб · нажмите на метку — город</p>' +
    '</div>' +
    '<div class="rus-legend">' + legend + '</div>' +
    '</div>' +
    '<div class="stats">' +
    statCard(U.length, 'вузов на карте') +
    statCard(cities.length, 'городов') +
    statCard(totalPrograms, 'программ') +
    statCard(DISTRICTS.length, 'федеральных округов') +
    '</div>' +
    '<p class="source-note">Контур страны построен по равновеликой конической проекции Альберса, объём — декоративная экструзия силуэта. ' +
    'Данные о вузах, программах и баллах — из каталога атласа: ' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') +
    ' в ' + cities.length + ' ' + plural(cities.length, 'городе', 'городах', 'городах') + '. ' +
    'Крупнейший округ — ' + h(biggest.code + ' · ' + biggest.short) + ': ' + biggest.count + ' ' + plural(biggest.count, 'вуз', 'вуза', 'вузов') + '.</p>' +
    '<section class="sec-head reveal"><div><p class="eyebrow">Города</p><h2 class="sec">Где сосредоточены вузы</h2></div>' +
    '<a class="sec-link" href="#/universities">Фильтр по городам →</a></section>' +
    '<div class="geo-city-list">' + topCities.map(function (c) {
      return '<a href="#/universities?city=' + encodeURIComponent(c) + '">' + h(c) + ' <b>' + cityCount[c] + '</b></a>';
    }).join('') + '</div>' +
    '<section class="sec-head reveal"><div><p class="eyebrow">Округа</p><h2 class="sec">Федеральные округа по каталогу</h2></div>' +
    '<a class="sec-link" href="#/universities">Все вузы →</a></section>' +
    '<div class="geo-grid">' + DISTRICTS.map(districtCard).join('') + '</div>' +
    '<div class="panel reveal" style="padding:20px;margin-top:24px"><p class="label">Как читать карту</p>' +
    '<p class="muted" style="margin-top:6px">Каждый город отмечен вертикальной меткой: чем выше метка и больше её круг, тем больше вузов в городе. ' +
    'Цвет метки — федеральный округ, верхняя панель фильтрует метки по округам. Протяните карту, чтобы повернуть страну, ' +
    'колесо мыши или кнопки ＋／− меняют масштаб. Средний балл — ориентировочная сумма трёх ЕГЭ на бюджет по вузам города.</p></div>' +
    '</div>';
  initRussiaMap();
}

/* ---------- сравнение: профессии и вузы ---------- */
function uniByShort(short) {
for (var i = 0; i < U.length; i++) if (U[i].short === short) return U[i];
return null;
}
function cmpCards(list, rows, head) {
/* Мобильная версия сравнения: карточки вместо горизонтальной таблицы. */
return '<div class="cmp-cards">' + list.map(function (item) {
return '<article class="cmp-card">' + head(item) + '<dl class="cmp-card-rows">' +
rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1](item) + '</dd></div>'; }).join('') +
'</dl></article>';
}).join('') + '</div>';
}
function profCompareTable(list) {
var best = {
index: Math.max.apply(null, list.map(function (p) { return p.index; })),
growth: Math.max.apply(null, list.map(function (p) { return p.growth; })),
salary: Math.max.apply(null, list.map(function (p) { return num(p.salary); })),
budget: Math.min.apply(null, list.map(function (p) { return minBudget(p.slug) || 999; }))
};
var rows = [
['Сфера', function (p) { return '<span class="sm">' + h(p.sphereCode) + '</span>' + h(p.sphere); }],
['Индекс спроса', function (p) { return '<span class="hi' + (p.index === best.index ? ' best' : '') + '">' + p.index + '<span class="sm">из 100</span></span>'; }],
['Рост вакансий', function (p) { return '<span class="hi' + (p.growth === best.growth ? ' best' : '') + '">+' + p.growth + '%</span>'; }],
['Зарплата', function (p) { return '<span class="hi' + (num(p.salary) === best.salary ? ' best' : '') + '">' + h(p.salary) + '</span>'; }],
['Программ в вузах', function (p) { return '<span class="hi">' + (PROG[p.slug] || []).length + '</span>'; }],
['Мин. балл на бюджет', function (p) {
var mb = minBudget(p.slug);
return mb ? '<span class="hi' + (mb === best.budget ? ' best' : '') + '">≈' + mb + '</span>' : '—';
}],
['Ведущие вузы', function (p) {
var l = (PROG[p.slug] || []).slice().sort(function (a, b) { return b.uni.avg - a.uni.avg; }).slice(0, 3);
return l.length ? l.map(function (x) { return h(x.uni.short); }).join(', ') : '—';
}]
];
return '<div class="compare-table-wrap"><table class="cmp-table"><thead><tr><th>Показатель</th>' +
list.map(function (p) { return '<th><a href="#/professions/' + h(p.slug) + '">' + h(p.title) + '</a></th>'; }).join('') +
'</tr></thead><tbody>' + rows.map(function (r) {
return '<tr><th>' + r[0] + '</th>' + list.map(function (p) { return '<td>' + r[1](p) + '</td>'; }).join('') + '</tr>';
}).join('') + '</tbody></table></div>' +
cmpCards(list, rows.slice(1), function (p) {
return '<a class="cmp-card-head" href="#/professions/' + h(p.slug) + '"><h3>' + h(p.title) + '</h3>' +
'<span class="cmp-sub">' + h(p.sphereCode + ' · ' + p.sphere) + '</span></a>';
});
}
function uniRange(u, key) {
var vals = u.programs.map(function (p) { return num(p[key]); }).filter(Boolean);
if (!vals.length) return '—';
return '≈' + Math.min.apply(null, vals) + '–' + Math.max.apply(null, vals);
}
function uniCompareTable(list) {
var best = {
avg: Math.max.apply(null, list.map(function (u) { return u.avg; })),
places: Math.max.apply(null, list.map(uniPlaces)),
minBudget: Math.min.apply(null, list.map(function (u) {
var v = u.programs.map(function (p) { return num(p.budget); }).filter(Boolean);
return v.length ? Math.min.apply(null, v) : 999;
}))
};
var rows = [
['Город и округ', function (u) { return h(u.city) + '<span class="sm">' + h(u.region) + ' · ' + h(u.district) + '</span>'; }],
['Средний балл на бюджет', function (u) { return '<span class="hi' + (u.avg === best.avg ? ' best' : '') + '">≈' + u.avg + '</span>'; }],
['Бюджетных мест, оценка', function (u) {
var n = uniPlaces(u);
return '<span class="hi' + (n === best.places ? ' best' : '') + '">≈' + n + '</span>';
}],
['Программ в атласе', function (u) { return u.programs.length; }],
['Минимальный балл', function (u) {
var v = u.programs.map(function (p) { return num(p.budget); }).filter(Boolean);
var m = v.length ? Math.min.apply(null, v) : 0;
return m ? '<span class="hi' + (m === best.minBudget ? ' best' : '') + '">≈' + m + '</span>' : '—';
}],
['Бюджет: диапазон', function (u) { return uniRange(u, 'budget'); }],
['Платно: диапазон', function (u) { return uniRange(u, 'paid'); }],
['Форма обучения', function (u) { return h(u.format); }],
['Общежитие', function (u) { return u.dorm ? 'Есть' : 'Нет'; }],
['Ведущие направления', function (u) {
return u.programs.slice().sort(function (a, b) { return num(b.budget) - num(a.budget); }).slice(0, 3).map(function (p) {
return h(p.direction);
}).join('<span class="sm">' + h(u.programs[0] ? '' : '') + '</span><br>');
}],
['Карточка', function (u) { return '<a class="btn btn-sm" href="#/universities?q=' + encodeURIComponent(u.short) + '">Открыть →</a>'; }]
];
return '<div class="compare-table-wrap"><table class="cmp-table"><thead><tr><th>Показатель</th>' +
list.map(function (u) { return '<th>' + h(u.short) + '</th>'; }).join('') +
'</tr></thead><tbody>' + rows.map(function (r) {
return '<tr><th>' + r[0] + '</th>' + list.map(function (u) { return '<td>' + r[1](u) + '</td>'; }).join('') + '</tr>';
}).join('') + '</tbody></table></div>' +
cmpCards(list, rows.slice(1), function (u) {
return '<div class="cmp-card-head"><h3>' + h(u.short) + '</h3>' +
'<span class="cmp-sub">' + h(u.city + ' · ' + u.region + ' · ' + u.district) + '</span></div>';
});
}
function uniPicker(id, selected, label) {
return '<label class="select-field" for="' + id + '"><span class="label">' + (label || 'Вуз') + '</span><select id="' + id + '">' +
U.slice().sort(function (a, b) { return a.short.localeCompare(b.short, 'ru'); }).map(function (u) {
return '<option value="' + h(u.short) + '"' + (u.short === selected ? ' selected' : '') + '>' + h(u.short) + ' — ' + h(u.city) + '</option>';
}).join('') + '</select></label>';
}
function renderCompare(m, q) {
var unisParam = q.get('unis') || '';
var picked = unisParam.split(',').map(function (s) { return uniByShort(s.trim()); }).filter(Boolean).slice(0, 3);
var mode = q.get('mode') === 'uni' || picked.length ? 'uni' : 'prof';
setTitle((mode === 'uni' ? 'Сравнение вузов' : 'Сравнение профессий') + ' — Профессии·2030');
var tabs = '<div class="seg-tabs" role="tablist">' +
'<a role="tab" class="' + (mode === 'prof' ? 'active' : '') + '" href="#/compare">Профессии</a>' +
'<a role="tab" class="' + (mode === 'uni' ? 'active' : '') + '" href="#/compare?mode=uni">Вузы</a></div>';
var body;
if (mode === 'uni') {
if (picked.length < 2) {
var byAvg = U.slice().sort(function (a, b) { return b.avg - a.avg; });
picked = [byAvg[0], byAvg[1]];
}
var a = picked[0], b = picked[1];
body = '<div class="toolbar" style="align-items:flex-end">' + uniPicker('cmpUniA', a.short, 'Первый вуз') + uniPicker('cmpUniB', b.short, 'Второй вуз') +
'<p class="mono tiny" style="margin-left:auto;color:var(--ink-4)">Сравнение сохраняется в ссылке</p></div>' +
'<div class="panel cmp-wrap" style="padding:8px 16px 16px;margin-top:14px">' + uniCompareTable(picked) + '</div>' +
'<p class="source-note">Средний балл и диапазоны — ориентировочные значения атласа по приёмным кампаниям 2024–2025. ' +
'Бюджетные места — расчётная оценка, а не официальные КЦП. Проверяйте данные на сайте вуза.</p>';
} else {
var list = P.filter(function (p) { return compare.has(p.slug); });
if (list.length < 2) list = P.slice().sort(function (x, y) { return y.index - x.index; }).slice(0, 3);
body = '<div class="panel cmp-wrap" style="padding:8px 16px 16px">' + profCompareTable(list) + '</div>' +
'<p class="source-note">До трёх профессий. Отметьте их галочкой в каталоге — выбор сохранится в этом браузере. ' +
'Ссылку на сравнение можно отправить родителям или наставнику.</p>' +
'<div class="hero-cta" style="margin-top:18px"><a class="btn btn-primary" href="#/professions">Выбрать профессии →</a>' +
'<a class="btn" href="#/quiz">Пройти опросник</a></div>';
}
app.innerHTML = '<div class="view">' +
'<section class="hero" style="padding:44px 0 22px">' +
'<p class="eyebrow">Раздел · Аналитика</p>' +
'<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Сравнение <em>' + (mode === 'uni' ? 'вузов' : 'профессий') + '</em></h1>' +
'<p class="lead">' + (mode === 'uni'
? 'Два вуза рядом: средний балл, бюджетные места, стоимость и направления. Выбор сохраняется в адресе страницы.'
: 'До трёх профессий рядом: спрос, рост, зарплата, баллы и ведущие вузы.') + '</p>' +
'</section>' +
'<h2 class="sr-only">Таблица сравнения</h2>' + tabs + body + '</div>';
if (mode === 'uni') {
function sync() {
var a2 = document.getElementById('cmpUniA').value;
var b2 = document.getElementById('cmpUniB').value;
location.hash = '#/compare?unis=' + encodeURIComponent(a2) + ',' + encodeURIComponent(b2);
}
document.getElementById('cmpUniA').addEventListener('change', sync);
document.getElementById('cmpUniB').addEventListener('change', sync);
}
}
/* ---------- граф «профессия → специальность → вуз» ---------- */
function cut(s, n) {
s = String(s || '');
return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
}
function professionGraphHtml(p) {
var progs = PROG[p.slug] || [];
var map = {};
progs.forEach(function (pr) {
/* Группируем по коду специальности: одно название может встречаться в вариантах. */
var g = map[pr.code];
if (!g) g = map[pr.code] = { code: pr.code, direction: pr.direction, dirs: {}, unis: [] };
g.dirs[pr.direction] = (g.dirs[pr.direction] || 0) + 1;
if (!g.unis.some(function (x) { return x.short === pr.uni.short; })) g.unis.push(pr.uni);
});
var groups = Object.keys(map).map(function (k) {
var g = map[k];
/* Название направления — самое частое для этого кода. */
var best = '', bn = -1;
Object.keys(g.dirs).forEach(function (d) { if (g.dirs[d] > bn) { bn = g.dirs[d]; best = d; } });
g.direction = best || g.direction;
delete g.dirs;
return g;
})
.sort(function (a, b) { return b.unis.length - a.unis.length; }).slice(0, 5);
if (!groups.length) return '';
groups.forEach(function (g) {
g.unis.sort(function (a, b) { return b.avg - a.avg; });
g.take = g.unis.slice(0, 2);
});
var H = Math.max(360, groups.length * 104 + 80);
var midY = groups.map(function (g, i) {
return groups.length === 1 ? H / 2 : 60 + i * (H - 120) / (groups.length - 1);
});
var edges = '', nodes = '';
nodes += '<a class="graph-node" href="#/professions/' + h(p.slug) + '">' +
'<rect x="14" y="' + (H / 2 - 34) + '" width="210" height="68" rx="12"></rect>' +
'<text x="30" y="' + (H / 2 - 12) + '" class="g-k">ПРОФЕССИЯ</text>' +
'<text x="30" y="' + (H / 2 + 8) + '">' + h(cut(p.title, 24)) + '</text>' +
'<text x="30" y="' + (H / 2 + 25) + '" class="g-k">' + h(p.sphereCode + ' · ' + p.sphere) + '</text></a>';
groups.forEach(function (g, i) {
var y = midY[i];
edges += '<path class="graph-edge" d="M224 ' + (H / 2) + ' C320 ' + (H / 2) + ', 330 ' + y + ', 420 ' + y + '"></path>';
nodes += '<a class="graph-node" href="#/universities?q=' + encodeURIComponent(g.direction) + '">' +
'<rect x="420" y="' + (y - 28) + '" width="216" height="56" rx="10"></rect>' +
'<text x="434" y="' + (y - 10) + '" class="g-k">' + h(g.code) + ' · ' + g.unis.length + ' ' + plural(g.unis.length, 'вуз', 'вуза', 'вузов') + '</text>' +
'<text x="434" y="' + (y + 9) + '">' + h(cut(g.direction, 28)) + '</text></a>';
g.take.forEach(function (u, j) {
var uy = Math.max(40, Math.min(H - 40, y + (j === 0 ? -20 : 20)));
edges += '<path class="graph-edge" d="M636 ' + y + ' C690 ' + y + ', 690 ' + uy + ', 740 ' + uy + '"></path>';
nodes += '<a class="graph-node" href="#/universities?q=' + encodeURIComponent(u.short) + '">' +
'<rect x="740" y="' + (uy - 20) + '" width="190" height="40" rx="9"></rect>' +
'<text x="752" y="' + (uy - 3) + '">' + h(cut(u.short, 20)) + '</text>' +
'<text x="752" y="' + (uy + 13) + '" class="g-k">' + h(cut(u.city, 22)) + ' · ≈' + u.avg + '</text></a>';
});
});
var list = '<div class="graph-list">' +
'<div class="gl-group"><b>ПРОФЕССИЯ</b><p>' + h(p.title) + '</p></div>' +
groups.map(function (g) {
return '<div class="gl-group"><b>' + h(g.code) + '</b><p>' + h(g.direction) + '</p><div class="gl-unis">' +
g.take.map(function (u) { return '<a href="#/universities?q=' + encodeURIComponent(u.short) + '">' + h(u.short) + ' · ≈' + u.avg + '</a>'; }).join('') +
'</div></div>';
}).join('') + '</div>';
return '<section class="enh-section"><div class="sec-head" style="margin-top:0"><div><p class="eyebrow">Маршрут</p>' +
'<h2 class="sec">Профессия → специальность → вуз</h2></div>' +
'<a class="sec-link" href="#/universities?q=' + encodeURIComponent(p.title) + '">Все программы →</a></div>' +
'<div class="prof-graph"><svg viewBox="0 0 960 ' + H + '" role="group" aria-label="Граф связей профессии, специальностей и вузов">' +
edges + nodes + '</svg></div>' + list +
'<p class="source-note">Граф построен по программам атласа: показаны до пяти специальностей и до двух вузов для каждой. ' +
'Толщина и порядок связей не означают рейтинг.</p></section>';
}
/* ---------- тепловая карта округов × сфер ---------- */
function heatMatrix() {
var m = DISTRICTS.map(function () { return SPHERES.map(function () { return 0; }); });
U.forEach(function (u) {
var di = -1;
for (var i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].code === u.district) { di = i; break; }
if (di < 0) return;
(u.programs || []).forEach(function (pr) {
var pp = PROF_BY_SLUG[pr.professionSlug];
if (!pp) return;
for (var j = 0; j < SPHERES.length; j++) if (SPHERES[j].code === pp.sphereCode) { m[di][j]++; break; }
});
});
return m;
}
var HEAT = { m: null, cells: [], base: '#162731', hot: '#5eead4', ink: '#f3fbfa' };
function heatRgb(s) {
s = String(s || '#162731').replace('#', '');
if (s.length === 3) s = s.split('').map(function (c) { return c + c; }).join('');
return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function heatColor(v, top) {
var t = top > 0 ? Math.min(1, v / top) : 0;
var b = heatRgb(HEAT.base), h = heatRgb(HEAT.hot);
var r = Math.round(b[0] + (h[0] - b[0]) * t);
var g = Math.round(b[1] + (h[1] - b[1]) * t);
var bl = Math.round(b[2] + (h[2] - b[2]) * t);
var lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
return { bg: 'rgb(' + r + ',' + g + ',' + bl + ')', fg: lum > 0.5 ? '#06201d' : HEAT.ink };
}
function heatTop(m, di, sj) {
var top = 1, i, j;
if (di >= 0 && sj >= 0) return m[di][sj] || 1;
if (di >= 0) {
for (j = 0; j < m[di].length; j++) if (m[di][j] > top) top = m[di][j];
return top;
}
if (sj >= 0) {
for (i = 0; i < m.length; i++) if (m[i][sj] > top) top = m[i][sj];
return top;
}
for (i = 0; i < m.length; i++) for (j = 0; j < m[i].length; j++) if (m[i][j] > top) top = m[i][j];
return top;
}
function applyHeatFilter() {
var host = document.getElementById('heatmap');
if (!host || !HEAT.m) return;
var ds = document.getElementById('heatDistrict');
var ss = document.getElementById('heatSphere');
var dcode = ds ? ds.value : '';
var scode = ss ? ss.value : '';
var di = -1, sj = -1, i, j;
for (i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].code === dcode) { di = i; break; }
for (j = 0; j < SPHERES.length; j++) if (SPHERES[j].code === scode) { sj = j; break; }
var top = heatTop(HEAT.m, di, sj);
HEAT.cells.forEach(function (td) {
i = Number(td.getAttribute('data-di'));
j = Number(td.getAttribute('data-sj'));
var active = (di < 0 || i === di) && (sj < 0 || j === sj);
td.classList.toggle('heat-dim', !active);
var c = heatColor(HEAT.m[i][j], top);
td.style.background = c.bg;
td.style.color = c.fg;
td.setAttribute('aria-label', DISTRICTS[i].short + ', ' + SPHERES[j].name + ': ' +
HEAT.m[i][j] + ' ' + plural(HEAT.m[i][j], 'программа', 'программы', 'программ'));
});
var note = document.getElementById('heatNote');
if (note) {
if (di >= 0 && sj >= 0) note.textContent = DISTRICTS[di].short + ' · ' + SPHERES[sj].name + ': шкала по одной ячейке';
else if (di >= 0) note.textContent = DISTRICTS[di].short + ': шкала внутри округа';
else if (sj >= 0) note.textContent = SPHERES[sj].name + ': шкала внутри сферы';
else note.textContent = 'Все округа и сферы: общая шкала';
}
host.setAttribute('aria-label', 'Тепловая карта: округа и сферы' +
(di >= 0 ? ', округ ' + DISTRICTS[di].short : '') +
(sj >= 0 ? ', сфера ' + SPHERES[sj].name : ''));
}
function renderHeatmap() {
var host = document.getElementById('heatmap');
if (!host) return;
var m = heatMatrix();
HEAT.m = m;
HEAT.base = cssColor('--panel-2', '#162731');
HEAT.hot = cssColor('--violet', '#5eead4');
HEAT.ink = cssColor('--ink', '#f3fbfa');
var max = heatTop(m, -1, -1);
var html = '<table class="heat-table" aria-label="Число программ по федеральным округам и сферам">' +
'<thead><tr><th class="heat-corner" scope="col"><span class="sr-only">Округ</span></th>';
SPHERES.forEach(function (s, j) {
html += '<th scope="col" title="' + h(s.code + ' · ' + s.name) + '"><b>' + h(s.code) + '</b><span>' + (j + 1) + '</span></th>';
});
html += '</tr></thead><tbody>';
DISTRICTS.forEach(function (d, i) {
html += '<tr data-di="' + i + '"><th scope="row"><b>' + h(d.code) + '</b><span>' + h(d.short) + '</span></th>';
m[i].forEach(function (v, j) {
var c = heatColor(v, max);
var tip = d.code + ' · ' + d.short + ' — ' + SPHERES[j].code + ' · ' + SPHERES[j].name + ': ' + v + ' ' + plural(v, 'программа', 'программы', 'программ');
html += '<td data-di="' + i + '" data-sj="' + j + '" style="background:' + c.bg + ';color:' + c.fg + '" title="' + h(tip) + '">' + v + '</td>';
});
html += '</tr>';
});
html += '</tbody></table>';
host.innerHTML = html;
HEAT.cells = Array.prototype.slice.call(host.querySelectorAll('td[data-di]'));
var ds = document.getElementById('heatDistrict');
var ss = document.getElementById('heatSphere');
if (ds && !ds.getAttribute('data-bound')) {
ds.setAttribute('data-bound', '1');
if (ss) ss.setAttribute('data-bound', '1');
ds.addEventListener('change', applyHeatFilter);
if (ss) ss.addEventListener('change', applyHeatFilter);
}
applyHeatFilter();
}
/* ---------- bubble-график: балл × рост × масштаб ---------- */
var BUBBLE_GEOM = null;
var BUBBLE_POOL = null;
var BUBBLE_ANIM = { raf: 0, prev: null };
var BUBBLE_FOCUS = -1;
function sphereColor(code) {
return {
'D-01': '#5eead4', 'D-02': '#fbbf24', 'D-03': '#86efac',
'D-04': '#fb7185', 'D-05': '#c4b5fd', 'D-06': '#7dd3fc'
}[code] || '#5eead4';
}
function bubbleItems(pool) {
var src = pool || BUBBLE_POOL || P;
return src.map(function (p) {
var mb = minBudget(p.slug);
return { p: p, mb: mb, n: (PROG[p.slug] || []).length };
}).filter(function (x) { return x.mb && x.n; });
}
function drawBubble(pool, animate) {
var canvas = document.getElementById('bubbleChart');
if (!canvas) return;
var wrap = canvas.parentNode;
var W = Math.max(300, Math.floor(wrap.clientWidth || 600));
var narrow = W < 560;
var H = narrow ? 360 : 440;
var dpr = Math.min(2, window.devicePixelRatio || 1);
canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
canvas.style.height = H + 'px';
var ctx = canvas.getContext('2d');
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
ctx.clearRect(0, 0, W, H);
if (pool) BUBBLE_POOL = pool;
var items = bubbleItems(BUBBLE_POOL);
var ink3 = cssColor('--ink-3', '#839da1');
var ink = cssColor('--ink', '#f3fbfa');
var rule = cssColor('--rule-2', '#3a3049');
if (!items.length) {
BUBBLE_GEOM = null;
BUBBLE_ANIM.prev = null;
if (BUBBLE_ANIM.raf) { cancelAnimationFrame(BUBBLE_ANIM.raf); BUBBLE_ANIM.raf = 0; }
ctx.fillStyle = ink3;
ctx.font = '13px "Onest", system-ui, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Под текущий фильтр нет профессий с программами и баллами', W / 2, H / 2);
canvas.setAttribute('aria-label', 'Bubble-график: под текущий фильтр нет профессий');
renderBubbleList([], narrow);
return;
}
var padL = 52, padR = narrow ? 12 : 18, padT = 22, padB = 44;
var xs = items.map(function (x) { return x.mb; });
var ys = items.map(function (x) { return x.p.growth; });
var xmin = Math.min.apply(null, xs) - 4, xmax = Math.max.apply(null, xs) + 4;
var ymin = Math.min.apply(null, ys) - 6, ymax = Math.max.apply(null, ys) + 8;
var plotW = W - padL - padR, plotH = H - padT - padB;
function px(v) { return padL + (v - xmin) / (xmax - xmin) * plotW; }
function py(v) { return padT + plotH - (v - ymin) / (ymax - ymin) * plotH; }
function radius(n) { return Math.min(13, 3.2 + Math.sqrt(n) * 0.95); }
function niceStep(raw) {
var pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
var n = raw / pow;
var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
return step * pow;
}
function drawAxes() {
ctx.strokeStyle = rule;
ctx.globalAlpha = 0.55;
ctx.lineWidth = 1;
ctx.fillStyle = ink3;
ctx.font = '10px ui-monospace, monospace';
ctx.textAlign = 'right';
ctx.textBaseline = 'middle';
var ystep = niceStep((ymax - ymin) / 4);
for (var vv = Math.floor(ymin / ystep) * ystep; vv <= ymax; vv += ystep) {
if (vv < ymin) continue;
var yy = py(vv);
ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
ctx.fillText(Math.round(vv), padL - 8, yy);
}
ctx.globalAlpha = 1;
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
var xstep = niceStep((xmax - xmin) / 4);
for (var xv = Math.ceil(xmin / xstep) * xstep; xv <= xmax; xv += xstep) {
ctx.fillText(Math.round(xv), px(xv), H - padB + 8);
}
ctx.fillStyle = ink3;
ctx.font = '11px "Onest", system-ui, sans-serif';
ctx.fillText('Минимальный балл на бюджет', padL + plotW / 2, H - 18);
ctx.save();
ctx.translate(14, padT + plotH / 2);
ctx.rotate(-Math.PI / 2);
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Рост вакансий к 2030, %', 0, 0);
ctx.restore();
}
var sorted = items.slice().sort(function (a, b) { return a.n - b.n; });
var targets = sorted.map(function (x) {
return { x: px(x.mb), y: py(x.p.growth), r: radius(x.n), p: x.p, mb: x.mb, n: x.n };
});
BUBBLE_GEOM = { padL: padL, padT: padT, plotW: plotW, plotH: plotH, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax, items: targets };
canvas.setAttribute('aria-label', 'Bubble-график: ' + targets.length + ' ' +
plural(targets.length, 'профессия', 'профессии', 'профессий') +
' по текущему фильтру. Стрелки — перебор точек, Enter — открыть профессию');
var prev = BUBBLE_ANIM.prev;
var useTween = !!(animate && prev && !noMotion);
var from = useTween ? prev : null;
function drawLabels() {
if (narrow) return;
var font = '11px "Onest", system-ui, sans-serif';
ctx.font = font;
var lh = 13, padX = 5, padY = 3;
var circles = BUBBLE_GEOM.items;
var placed = [];
var picks = items.slice().sort(function (a, b) { return b.p.index - a.p.index; });
picks.forEach(function (x) {
if (placed.length >= 6) return;
var cx = px(x.mb), cy = py(x.p.growth), r = radius(x.n);
var tw = ctx.measureText(x.p.title).width;
var cands = [];
[8, 20, 36].forEach(function (off) {
cands.push({ left: cx + r + off, top: cy - lh / 2 });
cands.push({ left: cx - r - off - tw, top: cy - lh / 2 });
cands.push({ left: cx - tw / 2, top: cy - r - off - lh });
cands.push({ left: cx - tw / 2, top: cy + r + off });
cands.push({ left: cx + r * 0.7 + off * 0.4, top: cy - r - off - lh });
cands.push({ left: cx - r * 0.7 - off * 0.4 - tw, top: cy - r - off - lh });
cands.push({ left: cx + r * 0.7 + off * 0.4, top: cy + r + off });
cands.push({ left: cx - r * 0.7 - off * 0.4 - tw, top: cy + r + off });
});
for (var ci = 0; ci < cands.length; ci++) {
var c = cands[ci];
var box = { x1: c.left - padX, y1: c.top - padY, x2: c.left + tw + padX, y2: c.top + lh + padY };
if (box.x1 < padL + 1 || box.x2 > W - padR - 1 || box.y1 < padT + 1 || box.y2 > H - padB - 1) continue;
var clash = false;
for (var pi = 0; pi < placed.length && !clash; pi++) {
var pb = placed[pi];
if (box.x1 < pb.x2 + 3 && box.x2 > pb.x1 - 3 && box.y1 < pb.y2 + 3 && box.y2 > pb.y1 - 3) clash = true;
}
for (var qi = 0; qi < circles.length && !clash; qi++) {
var cc = circles[qi];
if (cc.p === x.p) continue;
if (box.x1 < cc.x + cc.r + 2 && box.x2 > cc.x - cc.r - 2 && box.y1 < cc.y + cc.r + 2 && box.y2 > cc.y - cc.r - 2) clash = true;
}
if (clash) continue;
placed.push({ x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2, left: c.left, top: c.top, tw: tw, cx: cx, cy: cy, r: r, text: x.p.title });
break;
}
});
var isLight = document.documentElement.classList.contains('theme-light');
var labelBg = isLight ? 'rgba(255,255,255,.9)' : 'rgba(12,20,26,.84)';
placed.forEach(function (l) {
var lcx = l.left + l.tw / 2, lcy = l.top + lh / 2;
var dx = lcx - l.cx, dy = lcy - l.cy, dist = Math.hypot(dx, dy) || 1;
var ex = l.cx + dx / dist * (l.r + 1.5), ey = l.cy + dy / dist * (l.r + 1.5);
ctx.beginPath();
ctx.moveTo(ex, ey);
ctx.lineTo(lcx, lcy);
ctx.strokeStyle = ink3;
ctx.globalAlpha = 0.6;
ctx.lineWidth = 1;
ctx.stroke();
ctx.globalAlpha = 1;
});
placed.forEach(function (l) {
var bx = l.left - padX, by = l.top - padY, bw = l.tw + padX * 2, bh = lh + padY * 2;
ctx.fillStyle = labelBg;
if (ctx.roundRect) {
ctx.beginPath();
ctx.roundRect(bx, by, bw, bh, 3);
ctx.fill();
} else {
ctx.fillRect(bx, by, bw, bh);
}
ctx.fillStyle = ink;
ctx.font = font;
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.fillText(l.text, l.left, l.top + lh / 2);
});
}
function paint(e) {
ctx.clearRect(0, 0, W, H);
drawAxes();
targets.forEach(function (tg) {
var f = from ? from[tg.p.slug] : null;
var x = f ? f.x + (tg.x - f.x) * e : tg.x;
var y = f ? f.y + (tg.y - f.y) * e : tg.y + (1 - e) * 22;
var r = f ? f.r + (tg.r - f.r) * e : tg.r * (0.35 + 0.65 * e);
ctx.globalAlpha = f ? 1 : e;
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.fillStyle = sphereColor(tg.p.sphereCode) + '55';
ctx.fill();
ctx.strokeStyle = sphereColor(tg.p.sphereCode);
ctx.lineWidth = 1.2;
ctx.stroke();
});
ctx.globalAlpha = 1;
if (e >= 1 && BUBBLE_FOCUS >= 0 && targets[BUBBLE_FOCUS]) {
var fit = targets[BUBBLE_FOCUS];
ctx.beginPath();
ctx.arc(fit.x, fit.y, fit.r + 4, 0, Math.PI * 2);
ctx.strokeStyle = ink;
ctx.lineWidth = 2;
ctx.stroke();
}
if (e >= 1) drawLabels();
}
if (BUBBLE_ANIM.raf) { cancelAnimationFrame(BUBBLE_ANIM.raf); BUBBLE_ANIM.raf = 0; }
var nextPrev = {};
targets.forEach(function (tg) { nextPrev[tg.p.slug] = { x: tg.x, y: tg.y, r: tg.r }; });
if (useTween) {
var t0 = performance.now(), dur = 460;
var step = function (now) {
var t = Math.min(1, (now - t0) / dur);
var e = 1 - Math.pow(1 - t, 3);
paint(e);
if (t < 1) BUBBLE_ANIM.raf = requestAnimationFrame(step);
else { BUBBLE_ANIM.raf = 0; BUBBLE_ANIM.prev = nextPrev; paint(1); }
};
paint(0);
BUBBLE_ANIM.raf = requestAnimationFrame(step);
} else {
BUBBLE_ANIM.prev = nextPrev;
paint(1);
}
renderBubbleList(items, narrow);
}
function renderBubbleList(items, narrow) {
var host = document.getElementById('bubbleList');
if (!host) return;
host.classList.toggle('is-on', !!narrow);
var picks = items.slice().sort(function (a, b) { return b.p.index - a.p.index; }).slice(0, 6);
host.innerHTML = picks.map(function (x) {
return '<a href="#/professions/' + x.p.slug + '">' +
'<span class="bl-name">' + h(x.p.title) + '</span>' +
'<span class="bl-meta">индекс ' + x.p.index + ' · +' + x.p.growth + '% · ≈' + x.mb + '</span></a>';
}).join('');
}
function chartTip(canvas, ev) {
var tip = canvas.parentNode.querySelector('.chart-tip');
if (!tip) return;
var rect = canvas.getBoundingClientRect();
var mx = (ev.clientX - rect.left) * (canvas.width / rect.width) / Math.min(2, window.devicePixelRatio || 1);
var my = (ev.clientY - rect.top) * (canvas.height / rect.height) / Math.min(2, window.devicePixelRatio || 1);
var html = '';
if (canvas.id === 'bubbleChart' && BUBBLE_GEOM) {
var best = null, bd = 1e9;
BUBBLE_GEOM.items.forEach(function (it) {
var d = Math.hypot(mx - it.x, my - it.y);
if (d < it.r + 5 && d < bd) { bd = d; best = it; }
});
if (best) {
html = '<b>' + h(best.p.title) + '</b><br>Индекс: ' + best.p.index + ' · рост: +' + best.p.growth + '%<br>' +
'Мин. балл: ≈' + best.mb + ' · программ: ' + best.n;
}
}
if (html) {
tip.innerHTML = html;
tip.hidden = false;
var tw = tip.offsetWidth, th = tip.offsetHeight;
var left = ev.clientX - rect.left + 12;
var top = ev.clientY - rect.top - th - 10;
if (left + tw > rect.width) left = ev.clientX - rect.left - tw - 12;
if (top < 0) top = ev.clientY - rect.top + 14;
tip.style.left = Math.max(4, left) + 'px';
tip.style.top = top + 'px';
} else {
tip.hidden = true;
}
}
function chartTipItem(canvas, item) {
var tip = canvas.parentNode.querySelector('.chart-tip');
if (!tip || !item) return;
tip.innerHTML = '<b>' + h(item.p.title) + '</b><br>Индекс: ' + item.p.index + ' · рост: +' + item.p.growth + '%<br>' +
'Мин. балл: ≈' + item.mb + ' · программ: ' + item.n;
tip.hidden = false;
var tw = tip.offsetWidth, th = tip.offsetHeight;
var left = item.x + item.r + 12;
var top = item.y - th / 2;
if (left + tw > canvas.clientWidth) left = item.x - item.r - tw - 12;
tip.style.left = Math.max(4, left) + 'px';
tip.style.top = Math.max(4, Math.min(canvas.clientHeight - th - 4, top)) + 'px';
}
function chartHit(canvas, ev) {
if (canvas.id !== 'bubbleChart' || !BUBBLE_GEOM) return null;
var rect = canvas.getBoundingClientRect();
var mx = (ev.clientX - rect.left) * (canvas.width / rect.width) / Math.min(2, window.devicePixelRatio || 1);
var my = (ev.clientY - rect.top) * (canvas.height / rect.height) / Math.min(2, window.devicePixelRatio || 1);
var best = null, bd = 1e9;
BUBBLE_GEOM.items.forEach(function (it) {
var d = Math.hypot(mx - it.x, my - it.y);
if (d < it.r + 6 && d < bd) { bd = d; best = it; }
});
return best;
}
function bindChart(canvas) {
canvas.addEventListener('mousemove', function (e) {
chartTip(canvas, e);
canvas.style.cursor = chartHit(canvas, e) ? 'pointer' : 'default';
});
canvas.addEventListener('click', function (e) {
var hit = chartHit(canvas, e);
if (!hit) return;
var tip = canvas.parentNode.querySelector('.chart-tip');
if (tip) tip.hidden = true;
location.hash = '#/professions/' + hit.p.slug;
});
canvas.addEventListener('mouseleave', function () {
canvas.style.cursor = 'default';
var tip = canvas.parentNode.querySelector('.chart-tip');
if (tip) tip.hidden = true;
});
/* Клавиатура: стрелки перебирают точки, Enter или пробел открывают
   профессию. Подсказка выводится в aria-live-область. */
if (canvas.id === 'bubbleChart') {
canvas.addEventListener('keydown', function (e) {
if (!BUBBLE_GEOM || !BUBBLE_GEOM.items.length) return;
var n = BUBBLE_GEOM.items.length;
var next = BUBBLE_FOCUS;
if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = BUBBLE_FOCUS < 0 ? 0 : (BUBBLE_FOCUS + 1) % n;
else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = BUBBLE_FOCUS < 0 ? n - 1 : (BUBBLE_FOCUS - 1 + n) % n;
else if (e.key === 'Home') next = 0;
else if (e.key === 'End') next = n - 1;
else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
var cur = BUBBLE_GEOM.items[BUBBLE_FOCUS];
if (cur) location.hash = '#/professions/' + cur.p.slug;
e.preventDefault();
return;
} else return;
e.preventDefault();
BUBBLE_FOCUS = next;
drawBubble();
chartTipItem(canvas, BUBBLE_GEOM.items[next]);
});
canvas.addEventListener('blur', function () {
BUBBLE_FOCUS = -1;
var tip = canvas.parentNode.querySelector('.chart-tip');
if (tip) tip.hidden = true;
drawBubble();
});
}
}
function bubbleSection() {
return '<section class="enh-section"><div class="sec-head" style="margin-top:0"><div><p class="eyebrow">Аналитика</p>' +
'<h2 class="sec">Профессии: балл, рост и масштаб</h2></div><a class="sec-link" href="#/admission">История баллов →</a></div>' +
'<div class="panel" style="padding:16px"><div class="chart-canvas-wrap"><canvas id="bubbleChart" tabindex="0" role="img" aria-label="Bubble-график профессий: минимальный балл, рост вакансий и число программ"></canvas><div class="chart-tip" role="status" aria-live="polite" hidden></div></div>' +
'<div class="chart-legend">' + SPHERES.map(function (s) {
return '<span><i style="background:' + sphereColor(s.code) + '"></i>' + h(s.code + ' · ' + s.name) + '</span>';
}).join('') + '<span>Размер круга — число программ</span></div>' +
'<div class="bubble-list" id="bubbleList"></div></div>' +
'<p class="source-note">По горизонтали — минимальный проходной балл на бюджет по программам профессии, по вертикали — рост вакансий к 2030 году. ' +
'Показаны профессии, для которых в атласе есть программы и баллы, с учётом текущего фильтра. Нажмите на круг или выберите точку стрелками и нажмите Enter, чтобы открыть профессию. На телефоне подписи вынесены в список под графиком.</p></section>';
}
function heatSection() {
return '<section class="enh-section"><div class="sec-head" style="margin-top:0"><div><p class="eyebrow">Аналитика</p>' +
'<h2 class="sec">Тепловая карта: округа и сферы</h2></div><a class="sec-link" href="#/admission">Бюджетные места →</a></div>' +
'<div class="panel" style="padding:16px">' +
'<div class="heat-ctrl">' +
'<label class="select-field" for="heatDistrict"><span class="label">Округ</span><select id="heatDistrict"><option value="">Все округа</option>' +
DISTRICTS.map(function (d) { return '<option value="' + h(d.code) + '">' + h(d.code + ' · ' + d.short) + '</option>'; }).join('') +
'</select></label>' +
'<label class="select-field" for="heatSphere"><span class="label">Сфера</span><select id="heatSphere"><option value="">Все сферы</option>' +
SPHERES.map(function (s) { return '<option value="' + h(s.code) + '">' + h(s.code + ' · ' + s.name) + '</option>'; }).join('') +
'</select></label>' +
'<p class="mono tiny heat-note" id="heatNote" aria-live="polite">Все округа и сферы: общая шкала</p>' +
'</div>' +
'<div class="heat-scroll" id="heatmap" tabindex="0" role="region" aria-label="Тепловая карта: округа и сферы"></div>' +
'<div class="chart-legend">' + SPHERES.map(function (s, i) {
return '<span><b class="mono">' + (i + 1) + '</b> ' + h(s.code + ' · ' + s.name) + '</span>';
}).join('') + '</div></div>' +
'<p class="source-note">Число в ячейке — сколько программ атласа есть в округе по этой сфере. Чем темнее ячейка, тем больше предложений. Выберите округ или сферу, чтобы пересчитать шкалу внутри выбранного среза: остальные ячейки приглушаются. Колонки 1–6 соответствуют сферам из легенды; на телефоне таблица прокручивается по горизонтали, названия округов остаются на месте.</p></section>';
}
/* ---------- инициализация ---------- */
injectTools();
applyTheme();
initMagnet();
updateFooterCounts();
var resizeTimer2 = 0;
window.addEventListener('resize', function () {
clearTimeout(resizeTimer2);
resizeTimer2 = setTimeout(function () { placeTools(); drawBubble(); }, 140);
});
if ('serviceWorker' in navigator && !window.__ATLAS_STANDALONE__ && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
window.addEventListener('load', function () {
var swUrl = SCRIPT_BASE ? SCRIPT_BASE + 'sw.js' : 'sw.js';
navigator.serviceWorker.register(swUrl).catch(function () {});
});
}
/* Переход между разделами: новая страница мягко проявляется.
   Реализовано через CSS-анимацию .view — она работает везде и не требует
   поддержки View Transitions API. */
function routeAnimated() {
  route();
}
window.addEventListener('hashchange', routeAnimated);
try {
var pagesPath = sessionStorage.getItem('atlas:redirect');
sessionStorage.removeItem('atlas:redirect');
if (window.__ATLAS_STANDALONE__) {
/* В одностраничной копии адрес всегда остаётся на текущем файле. */
} else if (pagesPath && /^\/(map|compare|admission|calendar|favorites|quiz|quiz-oge|professions(?:\/[-a-z0-9]+)?|specialties|universities|colleges(?:\/[-a-z0-9]+)?|regions|about|methodology)(?:\?.*)?$/.test(pagesPath)) {
history.replaceState(null, '', '/atlas-2030' + pagesPath);
} else if (!location.hash && location.pathname.indexOf('/atlas-2030/') === 0) {
var directPath = location.pathname.slice('/atlas-2030'.length) || '/';
if (/^\/(map|compare|admission|calendar|favorites|quiz|quiz-oge|professions(?:\/[-a-z0-9]+)?|specialties|universities|colleges(?:\/[-a-z0-9]+)?|regions|about|methodology)\/?$/.test(directPath)) history.replaceState(null, '', '/atlas-2030' + directPath.replace(/\/$/, ''));
}
} catch (e) {}
document.addEventListener('click', function (e) {
var a = e.target.closest && e.target.closest('a[href^="#/"]');
if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
var dest = a.getAttribute('href').slice(1);
if (!/^\/(?:map|compare|admission|calendar|favorites|quiz|quiz-oge|professions(?:\/[-a-z0-9]+)?|specialties|universities|colleges(?:\/[-a-z0-9]+)?|regions|about|methodology)(?:\?.*)?$/.test(dest) && dest !== '/') return;
e.preventDefault();
history.pushState(null, '', '/atlas-2030' + (dest === '/' ? '/' : dest));
route(); window.scrollTo(0, 0);
});
window.addEventListener('popstate', route);
if ((!location.hash || location.hash === '#') && (location.pathname === '/' || location.pathname === '/atlas-2030/' || location.pathname === '/atlas-2030')) {
history.replaceState(null, '', '#/');
}
updateChoice();
updateFavoritesUI();
route();
})();
