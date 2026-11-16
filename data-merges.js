/* Слияние переименованных вузов: программы переходят преемнику,
   старые адреса редиректят на новую карточку. */
window.ATLAS = window.ATLAS || {};
(function () {
  var A = window.ATLAS;
  var M = [
   {
    "target": "УФИМСКИЙ УНИВЕРСИТЕТ НАУКИ И ТЕХНОЛОГИЙ",
    "old": [
     "УГАТУ",
     "БашГУ"
    ],
    "short": "Уфимский университет науки и технологий",
    "full": "Уфимский университет науки и технологий",
    "programs": 13,
    "avg": 226,
    "from": [
     "Уфимский государственный авиационный технический университет",
     "Башкирский государственный университет"
    ]
   },
   {
    "target": "Заполярный государственный университет",
    "old": [
     "НГИИ"
    ],
    "short": "Заполярный государственный университет",
    "full": "Заполярный государственный университет им. Н.М. Федоровского",
    "programs": 12,
    "avg": 184,
    "from": [
     "Норильский государственный индустриальный институт"
    ]
   },
   {
    "target": "Кузбасский государственный аграрный университет",
    "old": [
     "Кузбасская ГСХА"
    ],
    "short": "Кузбасский государственный аграрный университет",
    "full": "Кузбасский государственный аграрный университет имени В.Н. Полецкова",
    "programs": 10,
    "avg": 176,
    "from": [
     "Кузбасская государственная сельскохозяйственная академия"
    ]
   }
  ];
  var R = {
   "ugatu-ufa": "ufimskiy-universitet-nauki-i-tehnologiy-ufa",
   "bashgu-ufa": "ufimskiy-universitet-nauki-i-tehnologiy-ufa",
   "ngii-norilsk": "zapolyarnyy-gosudarstvennyy-universitet-norilsk",
   "kuzbasskaya-gsha-kemerovo": "kuzbasskiy-gosudarstvennyy-agrarnyy-universitet-kemerovo"
  };
  M.forEach(function (m) {
    var target = null, olds = [];
    A.universities.forEach(function (u) { if (u.short === m.target) target = u; });
    A.universities = A.universities.filter(function (u) {
      if (m.old.indexOf(u.short) < 0) return true;
      olds.push(u); return false;
    });
    if (!target) return;
    var seen = {}, programs = [];
    olds.forEach(function (u) {
      (u.programs || []).forEach(function (pr) {
        var key = pr.code + "|" + pr.direction;
        if (seen[key]) return;
        seen[key] = 1; programs.push(pr);
      });
    });
    target.programs = programs;
    delete target.card;
    target.mergedFrom = m.from;
    if (m.short) target.short = m.short;
    if (m.full) target.full = m.full;
    if (m.avg) target.avg = m.avg;
  });
  A.redirects = Object.assign(A.redirects || {}, R);
})();
