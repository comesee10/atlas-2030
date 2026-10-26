/* ============================================================
   Профессии·2030 — приложение
   Hash-роутер, поиск, каталог, сравнение, подбор по ЕГЭ
   ============================================================ */
(function () {
  'use strict';

  var A = window.ATLAS;
  var app = document.getElementById('app');

  if (!A || !A.professions) {
    app.innerHTML = '<div style="padding:80px 0"><h1 class="display">Данные не загрузились</h1><p class="lead">Проверьте, что рядом с index.html лежит файл data.js.</p></div>';
    return;
  }

  var P = A.professions || [];
  var U = A.universities || [];
  var C = A.colleges || [];
  var D = A.details || {};
  var CD = A.collegeDetails || {};

  /* ---------------------------------------------------------- helpers */
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

  function copyLink() {
    var url = location.href;
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

  /* ---------------------------------------------------------- derived data */
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

  /* ---------------------------------------------------------- geography */
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

  /* Специальности собираются из программ вузов: код + название. */
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

  /* ---------------------------------------------------------- compare state */
  var compare = new Set();
  var cmpLastFocus = null;
  var palLastFocus = null;
  try {
    JSON.parse(localStorage.getItem('atlas:compare') || '[]').forEach(function (s) {
      if (D[s]) compare.add(s);
    });
  } catch (e) {}

  function saveCompare() {
    try { localStorage.setItem('atlas:compare', JSON.stringify(Array.from(compare))); } catch (e) {}
  }

  var cmpBar = document.createElement('div');
  cmpBar.className = 'cmp-bar';
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

  /* ---------------------------------------------------------- nav / shell */
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
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Открыть меню'); }
  }
  navEl.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });

  function setNav(path) {
    document.querySelectorAll('.nav a[data-route]').forEach(function (a) {
      var r = a.getAttribute('data-route');
      var on = r === '/' ? path === '/' : (path === r || path.indexOf(r + '/') === 0);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------------------- router */
  function parseHash() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qi = raw.indexOf('?');
    var path = qi < 0 ? raw : raw.slice(0, qi);
    var q = new URLSearchParams(qi < 0 ? '' : raw.slice(qi + 1));
    if (path.length > 1) path = path.replace(/\/+$/, '');
    if (path.charAt(0) !== '/') path = '/' + path;
    return { path: path, q: q };
  }

  function syncUrl(path, params) {
    var s = params.toString();
    history.replaceState(null, '', '#' + path + (s ? '?' + s : ''));
  }

  var ROUTES = [
    [/^\/$/, renderHome],
    [/^\/quiz$/, renderQuiz],
    [/^\/professions$/, renderProfessions],
    [/^\/professions\/([^/]+)$/, function (m) { renderProfession(decodeURIComponent(m[1])); }],
    [/^\/universities$/, renderUniversities],
    [/^\/colleges$/, renderColleges],
    [/^\/colleges\/([^/]+)$/, function (m) { renderCollege(decodeURIComponent(m[1])); }],
    [/^\/specialties$/, renderSpecialties],
    [/^\/regions$/, renderRegions],
    [/^\/about$/, renderAbout],
    [/^\/methodology$/, renderMethodology]
  ];

  function route() {
    var r = parseHash();
    if (r.path === '/siberia') {
      history.replaceState(null, '', '#/universities?district=' + encodeURIComponent('СФО'));
      r = parseHash();
    }
    var found = false;
    for (var i = 0; i < ROUTES.length; i++) {
      var m = r.path.match(ROUTES[i][0]);
      if (m) { found = true; ROUTES[i][1](m, r.q); break; }
    }
    if (!found) render404(r.path);
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
  }

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

  /* ---------------------------------------------------------- reveal / bars */
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

  /* ---------------------------------------------------------- 3D: tilt + parallax */
  var TILT_SEL = '.fcard,.spec-card,.city-card,.geo-card,.adv-card,.ind-card,.cc';
  var canTilt = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var noMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* ---------------------------------------------------------- hero constellation */
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
  var toTopEl = document.getElementById('toTop');
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

  /* ---------------------------------------------------------- search palette */
  var PAL_INDEX = [];
  var PAL_GROUPS = { 'Профессия': 'Профессии', 'Специальность': 'Специальности', 'Вуз': 'Вузы', 'Колледж': 'Колледжи' };
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
      res = PAL_INDEX.filter(function (x) { return norm(x.title + ' ' + x.sub).indexOf(nq) >= 0; }).slice(0, 16);
    }
    palItems = res;
    if (!res.length) {
      palSel = -1;
      palList.innerHTML = '<div class="p-empty">Ничего не нашлось. Попробуйте «инженер», «МФТИ» или «Москва».</div>';
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

  /* ---------------------------------------------------------- home */
  function statCard(v, k) {
    return '<div class="stat"><div class="v" data-count="' + v + '">' + v + '</div><div class="k">' + k + '</div></div>';
  }

  function fcard(p) {
    return '<a class="panel fcard reveal" href="#/professions/' + p.slug + '">' +
      '<div class="top"><span class="code">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</span><span class="idx">' + p.index + '</span></div>' +
      '<h3>' + h(p.title) + '</h3>' +
      '<p>' + h(p.desc) + '</p>' +
      '<div class="bot"><span class="g">+' + p.growth + '% к 2030</span><span>' + h(p.salary) + '</span></div>' +
      '</a>';
  }

  function uniMini(u) {
    return '<a class="panel uni reveal" href="#/universities?q=' + encodeURIComponent(u.short) + '">' +
      '<div class="uni-top"><div><p class="uni-city">' + h(u.region) + ' · ' + h(u.city) + '</p><h3>' + h(u.short) + '</h3>' +
      '<p class="full">' + h(u.full) + '</p></div>' +
      '<div class="uni-score"><span class="v">≈' + u.avg + '</span><span class="k">средний балл на бюджет</span></div></div>' +
      '<p class="mono tiny" style="margin-top:14px;color:var(--ink-3)">' + u.programs.length + ' ' +
      plural(u.programs.length, 'направление', 'направления', 'направлений') + ' в атласе</p>' +
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
    var featured = P.slice(0, 6);
    var uniTop = U.slice().sort(function (a, b) { return b.avg - a.avg; }).slice(0, 3);
    var colTop = C.slice().sort(function (a, b) { return b.count - a.count; }).slice(0, 4);
    var specTop = SPECIALTIES.slice(0, 6);
    var geoTop = DISTRICTS.slice();
    var codes = [];
    SPECIALTIES.forEach(function (s) { if (codes.indexOf(s.code) < 0) codes.push(s.code); });
    var ribbon = codes.slice(0, 14).map(function (c) { return '<span>' + h(c) + '</span>'; }).join('');

    app.innerHTML = '<div class="view">' +
      '<section class="hero hero-home">' +
        '<canvas class="hero-canvas" aria-hidden="true"></canvas>' +
        '<div class="hero-grid">' +
          '<div class="hero-copy">' +
            '<p class="eyebrow">Раздел I · Навигатор</p>' +
            '<h1 class="display">Профессии, которые будут <em>нужны</em> в 2030 году</h1>' +
            '<p class="lead">Атлас объединяет ' + P.length + ' профессий, ' + U.length + ' вузов, ' + TOTAL_PROGRAMS + ' программ и ' + C.length + ' колледжей. Он позволяет последовательно перейти от профессии к специальности, вузу и набору ЕГЭ.</p>' +
            '<div class="hero-cta"><a class="btn btn-primary" href="#/quiz">Пройти опросник →</a><a class="btn" href="#/professions">Открыть каталог</a></div>' +
            '<div class="hero-meta"><span>' + P.length + ' ' + plural(P.length, 'профессия', 'профессии', 'профессий') + '</span>' +
            '<span>' + U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + '</span>' +
            '<span>' + TOTAL_PROGRAMS + ' ' + plural(TOTAL_PROGRAMS, 'программа', 'программы', 'программ') + '</span>' +
            '<span>' + REGIONS.length + ' ' + plural(REGIONS.length, 'регион', 'региона', 'регионов') + '</span>' +
            '<span>2027–2030</span></div>' +
          '</div>' +
          '<aside class="panel start-card">' +
            '<h2>Порядок работы</h2>' +
            '<div class="start-steps">' +
              '<div class="start-step"><b>01</b><span>Отметьте предметы ЕГЭ, которые планируете сдавать.</span></div>' +
              '<div class="start-step"><b>02</b><span>Выберите сферу или воспользуйтесь общей подборкой.</span></div>' +
              '<div class="start-step"><b>03</b><span>Укажите ожидаемую сумму баллов и получите список программ.</span></div>' +
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
          statCard(U.length, 'вузов с баллами') +
          statCard(TOTAL_PROGRAMS, 'программ и специальностей') +
          statCard(DISTRICTS.length, 'федеральных округов') +
        '</div>' +
        '<div class="ribbon" aria-hidden="true"><div class="ribbon-track">' + ribbon + ribbon + '</div></div>' +
      '</section>' +

      '<section class="sec-head reveal"><div><p class="eyebrow">Спрос</p><h2 class="sec">Ведущие профессии по индексу спроса</h2></div>' +
      '<a class="sec-link" href="#/professions?sort=index">Весь рейтинг →</a></section>' +
      '<div class="panel chart reveal"><div class="chart-head"><p class="label">Индекс спроса · 0–100</p>' +
      '<p class="mono tiny" style="color:var(--ink-4)">оценка атласа</p></div><div class="bars">' +
        top.map(function (p) {
          return '<div class="bar-row"><a class="n" href="#/professions/' + p.slug + '">' + h(p.title) + '</a>' +
            '<div class="bar-track"><div class="bar-fill" data-v="' + (p.index / 100) + '"></div></div>' +
            '<span class="v">' + p.index + '</span></div>';
        }).join('') +
      '</div></div>' +

      '<section class="sec-head reveal"><div><p class="eyebrow">Каталог</p><h2 class="sec">Приоритетные направления</h2></div>' +
      '<a class="sec-link" href="#/professions">Все ' + P.length + ' профессий →</a></section>' +
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
        advCard('05', 'Работает без регистрации и отслеживания', 'Все расчёты выполняются в браузере. Ответы опросника не передаются на сервер, а данные доступны в открытом JSON.') +
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
        '<p class="muted">Все расчёты выполняются в браузере. Ответы опросника не отправляются на сервер и не сохраняются.</p></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- professions list */
  function sortBtn(key, label, active) {
    return '<button data-sort="' + key + '" aria-pressed="' + (active === key ? 'true' : 'false') + '">' + label + '</button>';
  }
  function sphereChip(code, label, active) {
    return '<button class="chip" data-sphere="' + h(code) + '" aria-pressed="' + (active === code ? 'true' : 'false') + '">' + h(label) + '</button>';
  }

  function profRow(p) {
    return '<li class="prof-row">' +
      '<span class="rank">' + h(p.rank) + '</span>' +
      '<div class="t-cell"><a class="t" href="#/professions/' + p.slug + '">' + h(p.title) + '</a>' +
      '<span class="d">' + h(p.desc) + '</span></div>' +
      '<div class="meta"><span class="sph">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</span>' +
        '<div class="metrics"><span class="idx" title="Индекс спроса">' + p.index + '</span>' +
        '<span class="gr" title="Рост вакансий к 2030">+' + p.growth + '%</span>' +
        '<span class="sal">' + h(p.salary) + '</span></div></div>' +
      '<button class="cmp" data-slug="' + p.slug + '" aria-pressed="false" aria-label="Сравнить: ' + h(p.title) + '" title="Добавить к сравнению">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>' +
      '</button></li>';
  }

  function filteredProfessions(st) {
    var q = norm(st.q);
    var list = P.filter(function (p) {
      if (st.sphere && p.sphereCode !== st.sphere) return false;
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
    var st = { q: q.get('q') || '', sphere: q.get('sphere') || '', sort: q.get('sort') || 'index' };
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
        '<li class="empty"><b>Ничего не найдено</b>Попробуйте другой запрос или сбросьте фильтр сферы.</li>';
      countEl.textContent = 'Показано ' + list.length + ' из ' + P.length;
      listEl.classList.remove('swap');
      void listEl.offsetWidth;
      listEl.classList.add('swap');
      updateCompare();
      var params = new URLSearchParams();
      if (st.q) params.set('q', st.q);
      if (st.sphere) params.set('sphere', st.sphere);
      if (st.sort !== 'index') params.set('sort', st.sort);
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
      var b = e.target.closest('.cmp');
      if (!b) return;
      toggleCompare(b.getAttribute('data-slug'));
    });

    var randomBtn = document.getElementById('randomProf');
    if (randomBtn) randomBtn.addEventListener('click', function () {
      var pool = filteredProfessions(st);
      if (!pool.length) pool = P;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      randomBtn.classList.add('spin');
      setTimeout(function () { location.hash = '#/professions/' + pick.slug; }, 200);
    });

    repaint();
  }

  /* ---------------------------------------------------------- universities */
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
      '<div class="tbl-wrap"><table class="data"><thead><tr><th>Направление</th><th>Профессия</th><th>ЕГЭ</th>' +
      '<th>Бюджет</th><th>Платно</th></tr></thead><tbody>' + u.programs.map(uniRow).join('') + '</tbody></table></div>' +
      more + '</section>';
  }

  function filteredUnis(st) {
    var q = norm(st.q);
    return U.filter(function (u) {
      if (st.district && u.district !== st.district) return false;
      if (st.region && u.region !== st.region) return false;
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

  function renderUniversities(m, q) {
    var st = { q: q.get('q') || '', district: q.get('district') || '', region: q.get('region') || '', sort: q.get('sort') || 'avg' };
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
      '</div>' +
      '<p class="mono tiny" id="uniCount" style="margin-top:18px;color:var(--ink-4)"></p>' +
      '<h2 class="sr-only">Список вузов по регионам</h2>' +
      '<div id="uniGrid"></div>' +
    '</div>';

    var grid = document.getElementById('uniGrid');
    var countEl = document.getElementById('uniCount');
    var searchEl = document.getElementById('uniSearch');
    var regionEl = document.getElementById('regionSelect');

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
      if (st.region) {
        var r = REGION_BY_NAME[st.region];
        if (r) {
          st.district = r.district;
          document.querySelectorAll('#districtChips button').forEach(function (x) {
            x.setAttribute('aria-pressed', x.getAttribute('data-sphere') === st.district ? 'true' : 'false');
          });
          regionEl.innerHTML = regionOptions(st);
          regionEl.value = st.region;
        }
      }
      repaint();
    });

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-more]');
      if (!b) return;
      var card = b.closest('.uni');
      var open = card.classList.toggle('expanded');
      b.textContent = open ? 'Свернуть ↑' : (b.getAttribute('data-label') || 'Показать все') + ' ↓';
    });

    repaint();
  }

  /* ---------------------------------------------------------- colleges */
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

  /* ---------------------------------------------------------- specialties */
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

  /* ---------------------------------------------------------- regions */
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
          statCard(U.length, 'вузов') +
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
      '<div class="panel reveal" style="padding:24px;margin-top:26px;display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
        '<div><p class="label">Дальше</p><p style="font-family:var(--serif);font-size:22px;font-weight:700;margin-top:6px">Подберите программы по предметам ЕГЭ и сумме баллов</p></div>' +
        '<div class="hero-cta" style="margin:0"><a class="btn btn-primary btn-sm" href="#/quiz">Пройти опросник →</a><a class="btn btn-sm" href="#/specialties">Специальности</a></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- about / advantages */
  function renderAbout() {
    setTitle('О проекте и преимущества — Профессии·2030');
    var rows = [
      ['Маршрут «профессия → программа → ЕГЭ → балл»', 'Да, в одном сценарии', 'Обычно только профессии или только вузы', 'Только вуз и направления'],
      ['Прозрачная методика индекса', 'Формула, веса и допущения открыты', 'Рейтинг без формулы', 'Обычно нет'],
      ['Проверка шансов по сумме баллов', 'Да, с пограничной зоной ±10', 'Часто через рекламу курсов', 'Нет'],
      ['География: округа и регионы', U.length + ' ' + plural(U.length, 'вуз', 'вуза', 'вузов') + ' в ' + REGIONS.length + ' ' + plural(REGIONS.length, 'регионе', 'регионах', 'регионах'), 'Крупные города и столицы', 'Зависит от справочника'],
      ['Регистрация и трекинг', 'Не нужны', 'Часто нужны', 'Часто нужны'],
      ['Открытые данные', 'data.js и JSON', 'Закрыты', 'Закрыты'],
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
        advCard('05', 'Данные можно проверить и переиспользовать', 'Датасет лежит в data.js и atlas-data.json. Это не чёрный ящик: структуру видно, ссылки и цифры можно сверить с приёмными комиссиями.') +
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
      '</div>' +
      '<div class="panel reveal" style="padding:24px;margin-top:22px;display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
        '<div><p class="label">Проверить</p><p style="font-family:var(--serif);font-size:22px;font-weight:700;margin-top:6px">Методология, данные и границы применимости</p></div>' +
        '<div class="hero-cta" style="margin:0"><a class="btn btn-primary btn-sm" href="#/methodology">Методология →</a><a class="btn btn-sm" href="#/specialties">Специальности</a></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- methodology */
  function renderMethodology() {
    setTitle('Методология — Профессии·2030');
    app.innerHTML = '<div class="view">' +
      '<section class="hero" style="padding:44px 0 26px">' +
        '<p class="eyebrow">Раздел VIII · Методология</p>' +
        '<h1 class="display" style="font-size:clamp(30px,4.6vw,50px)">Как формируется <em>атлас</em></h1>' +
        '<p class="lead">Открытые принципы отбора профессий, расчёта индекса спроса и сбора проходных баллов. Если цифра вызывает вопросы — здесь описано, откуда она взялась.</p>' +
      '</section>' +
      '<div class="prose" id="prose">' +
        (A.methodology && A.methodology.html ? A.methodology.html : '<p>Раздел в подготовке.</p>') +
      '</div>' +
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

  /* ---------------------------------------------------------- detail pages */
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
    });
  }

  function prepareRich(root) {
    rewriteLinks(root);
    root.querySelectorAll('li').forEach(function (li) {
      var k = li.children;
      if (k.length === 3 && k[0].tagName === 'P' && k[1].tagName === 'P' && k[2].tagName === 'P') li.classList.add('career');
      if (k.length === 3 && k[0].tagName === 'SPAN' && k[1].tagName === 'SPAN' && k[2].tagName === 'P') li.classList.add('timeline');
      if (k[0] && k[0].tagName === 'SPAN' && k[0].querySelector('b')) li.classList.add('row');
      var f = li.firstChild;
      if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^\s*—\s*/, '');
      li.querySelectorAll('a').forEach(function (a) {
        if (a.querySelector('p')) a.classList.add('stack');
      });
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

  function buildToc(root) {
    var toc = document.getElementById('toc');
    if (!toc) return;
    var h2s = root.querySelectorAll('h2');
    toc.innerHTML = Array.prototype.map.call(h2s, function (h2, i) {
      var id = 'sec-' + (i + 1);
      h2.id = id;
      return '<a href="#' + id + '" data-toc="' + id + '">' + h(h2.textContent.replace(/^\d+\.\s*/, '')) + '</a>';
    }).join('');
    toc.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-toc]');
      if (!a) return;
      e.preventDefault();
      var t = document.getElementById(a.getAttribute('data-toc'));
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
    });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          toc.querySelectorAll('a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-toc') === en.target.id);
          });
        });
      }, { rootMargin: '-88px 0px -62% 0px' });
      h2s.forEach(function (h2) { spy.observe(h2); });
    }
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

  function renderProfession(slug) {
    var p = P.filter(function (x) { return x.slug === slug; })[0];
    var d = D[slug];
    if (!p || !d) { render404('/professions/' + slug); return; }
    setTitle(p.title + ' — Профессии·2030');
    var progs = PROG[slug] || [];
    var mb = minBudget(slug);
    var similar = (d.similar || []).filter(function (s) { return D[s.slug]; }).slice(0, 5);
    var inCmp = compare.has(p.slug);

    app.innerHTML = '<div class="view">' +
      '<nav class="crumbs" aria-label="Хлебные крошки"><a href="#/professions">Каталог профессий</a><span>/</span>' +
      '<span>' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</span></nav>' +
      '<header class="detail-head">' +
        '<p class="eyebrow" style="margin-top:18px">' + h(p.sphereCode) + ' · ' + h(p.sphere) + '</p>' +
        '<h1>' + h(p.title) + '</h1>' +
        '<p class="lead">' + h(p.desc) + '</p>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary btn-sm" href="#/quiz">Проверить шансы</a>' +
          '<a class="btn btn-sm" href="#/professions?sphere=' + h(p.sphereCode) + '">Ещё в этой сфере</a>' +
          '<button class="btn btn-sm" id="addCmp" aria-pressed="' + (inCmp ? 'true' : 'false') + '">' + (inCmp ? 'В сравнении ✓' : 'Добавить к сравнению') + '</button>' +
        '</div>' +
      '</header>' +
      '<div class="detail-body">' +
        '<div><div class="toc" id="toc" aria-label="Содержание"></div><div class="rich" id="rich"></div></div>' +
        '<aside class="passport panel">' +
          '<p class="label">Паспорт профессии</p>' +
          '<div class="pp-row"><p class="pp-k">Индекс спроса</p><p class="pp-v">' + p.index + '<small>/100</small></p>' +
          '<div class="pp-bar"><i data-w="' + p.index + '"></i></div></div>' +
          '<div class="pp-row"><p class="pp-k">Рост вакансий к 2030</p><p class="pp-v" style="font-size:22px;color:var(--ok)">+' + p.growth + '%</p></div>' +
          '<div class="pp-row"><p class="pp-k">Зарплата, тыс. ₽/мес</p><p class="pp-v" style="font-size:22px">' + h(String(p.salary).replace(' тыс. ₽', '')) + '</p></div>' +
          '<div class="pp-row"><p class="pp-k">Программ в атласе</p><p class="pp-v" style="font-size:22px">' + progs.length + '</p></div>' +
          '<div class="pp-row"><p class="pp-k">Мин. балл на бюджет</p><p class="pp-v" style="font-size:22px">' + (mb ? '≈' + mb : '—') + '</p></div>' +
          '<a class="btn btn-primary btn-sm" href="#/quiz">Проверить свои шансы</a>' +
          (similar.length ? '<div class="similar"><p class="label" style="margin-bottom:8px">Смежные профессии</p>' +
            similar.map(function (s) {
              return '<a href="#/professions/' + s.slug + '"><span>' + h(s.title) + '</span><span class="mono">' + h(s.index) + '</span></a>';
            }).join('') + '</div>' : '') +
        '</aside>' +
      '</div>' +
    '</div>';

    var rich = document.getElementById('rich');
    rich.innerHTML = (d.body || '').replace(/<!--[\s\S]*?-->/g, '');
    prepareRich(rich);
    refreshStudyTable(rich, p.slug, p.title);
    buildToc(rich);

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
      '<nav class="crumbs" aria-label="Хлебные крошки"><a href="#/colleges">После 9 класса</a><span>/</span>' +
      '<span>' + h(c.code) + ' · ' + h(c.sphereCode) + '</span></nav>' +
      '<header class="detail-head">' +
        '<p class="eyebrow" style="margin-top:18px">' + h(c.code) + ' · ' + h(c.sphereCode) + '</p>' +
        '<h1>' + h(c.title) + '</h1>' +
        '<p class="lead">' + h(c.desc) + '</p>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary btn-sm" href="#/quiz">Проверить шансы</a>' +
          '<a class="btn btn-sm" href="#/colleges?sphere=' + h(c.sphereCode) + '">Ещё в этой сфере</a>' +
        '</div>' +
      '</header>' +
      '<div class="detail-body">' +
        '<div><div class="toc" id="toc" aria-label="Содержание"></div><div class="rich" id="rich"></div></div>' +
        '<aside class="passport panel">' +
          '<p class="label">Паспорт специальности</p>' + rows +
          '<div class="pp-row"><p class="pp-k">Колледжей в атласе</p><p class="pp-v" style="font-size:22px">' + c.count + '</p></div>' +
          '<div class="pp-row"><p class="pp-k">Средний балл аттестата</p><p class="pp-v" style="font-size:22px">от ' + h(c.price) + '</p></div>' +
          '<a class="btn btn-primary btn-sm" href="#/colleges">Все специальности</a>' +
        '</aside>' +
      '</div>' +
    '</div>';

    var rich = document.getElementById('rich');
    rich.innerHTML = (d.body || '').replace(/<!--[\s\S]*?-->/g, '');
    prepareRich(rich);
    buildToc(rich);
  }

  /* ---------------------------------------------------------- quiz */
  function quizFromUrl(q) {
    var st = { step: 1, exams: ['Рус', 'Мат', 'Инф'], sphere: '', sum: 240 };
    var e = q.get('e');
    if (e) {
      var arr = e.split(',').filter(function (s) { return SUBJECTS.indexOf(s) >= 0; });
      if (arr.length) st.exams = arr.slice(0, 3);
    }
    var s = q.get('s');
    if (s && SPHERES.some(function (x) { return x.code === s; })) st.sphere = s;
    var b = parseInt(q.get('b'), 10);
    if (b >= 120 && b <= 300) st.sum = b;
    var step = parseInt(q.get('step'), 10);
    if (step >= 1 && step <= 4) st.step = step;
    return st;
  }

  function quizSync(st) {
    var p = new URLSearchParams();
    if (st.step > 1) p.set('step', st.step);
    p.set('e', st.exams.join(','));
    if (st.sphere) p.set('s', st.sphere);
    if (st.sum !== 240) p.set('b', st.sum);
    syncUrl('/quiz', p);
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
      var fit = progs.filter(function (pr) { return fitsEge(pr.ege, exams); });
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
      '<div class="quiz-foot"><span class="quiz-count" id="examCount">' + st.exams.length + ' из 3 выбрано</span>' +
      '<div class="quiz-nav"><button class="btn btn-primary" data-next ' + (st.exams.length ? '' : 'disabled') + '>Дальше →</button></div></div>' +
      '<p class="quiz-note">Программа подходит, если все её экзамены есть среди выбранных. Альтернативы вроде «Инф / Физ» учитываются как «или».</p>';
  }

  function bindReport(st) {
    var copy = document.getElementById('copyLink');
    if (copy) copy.addEventListener('click', copyLink);
    var pr = document.getElementById('printBtn');
    if (pr) pr.addEventListener('click', function () { window.print(); });
    var rs = document.getElementById('restart');
    if (rs) rs.addEventListener('click', function () {
      st.step = 1;
      st.exams = ['Рус', 'Мат', 'Инф'];
      st.sphere = '';
      st.sum = 240;
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
        var next = root.querySelector('[data-next]');
        if (next) next.disabled = !st.exams.length;
        quizSync(st);
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

  function renderQuiz(m, q) {
    setTitle('Опросник: куда поступать — Профессии·2030');
    var st = quizFromUrl(q);
    app.innerHTML = '<div class="view">' +
      '<section class="hero" style="padding:44px 0 26px">' +
        '<p class="eyebrow">Раздел II · Опросник</p>' +
        '<h1 class="display" style="font-size:clamp(30px,4.6vw,48px)">Опросник: куда <em>поступать</em></h1>' +
        '<p class="lead">Четыре шага: предметы ЕГЭ, интересующая сфера, ожидаемая сумма баллов и результат. На выходе — профессии и конкретные программы с оценкой шансов на бюджет.</p>' +
      '</section>' +
      '<div id="quizRoot"></div>' +
    '</div>';
    paintQuiz(st);
  }

  /* ---------------------------------------------------------- start */
  window.addEventListener('hashchange', route);
  if (!location.hash || location.hash === '#') {
    history.replaceState(null, '', '#/');
  }
  route();
})();
