/* Официальные показатели мониторинга ВО: средний балл ЕГЭ на один предмет,
   численность студентов, карточки организаций без разобранных программ.
   Источник: monitoring.miccedu.ru, срез 2025 года, снято 2026-02-03. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.monitoring = {
  "source": "monitoring-2025",
  "asOf": "2026-02-03",
  "url": "https://monitoring.miccedu.ru/",
  "note": "Средний балл ЕГЭ — в расчёте на один предмет, по очной форме, за счёт бюджетных средств и с оплатой обучения."
 };
(function () {
  var A = window.ATLAS;
  var M = {
   "МФТИ": {
    "id": "161",
    "avgEge": 98.67,
    "students": 8559
   },
   "МГИМО": {
    "id": "1758",
    "avgEge": 97.23,
    "students": 9282
   },
   "МГУ": {
    "id": "1725",
    "avgEge": 90.32,
    "students": 44348
   },
   "НИУ ВШЭ": {
    "id": "1766",
    "avgEge": 97.66,
    "students": 45313
   },
   "МГЮА": {
    "id": "130",
    "avgEge": 94.89,
    "students": 13155
   },
   "ИТМО": {
    "id": "234",
    "avgEge": 94.2,
    "students": 17681
   },
   "СПбГУ": {
    "id": "1771",
    "avgEge": 90.48,
    "students": 25331
   },
   "ПСПбГМУ им. Павлова": {
    "id": "1572",
    "avgEge": 88.21,
    "students": 5656
   },
   "Сеченовский ун-т": {
    "id": "1792",
    "avgEge": 88.92,
    "students": 20987
   },
   "Финуниверситет": {
    "id": "1767",
    "avgEge": 89.81,
    "students": 26479
   },
   "РАНХиГС": {
    "id": "1783",
    "avgEge": 96.82,
    "students": 31574
   },
   "РНИМУ им. Пирогова": {
    "id": "1595",
    "avgEge": 89.46,
    "students": 11419
   },
   "МГТУ им. Баумана": {
    "id": "147",
    "avgEge": 87.68,
    "students": 24775
   },
   "РТУ МИРЭА": {
    "id": "134",
    "avgEge": 83.59,
    "students": 31671
   },
   "НИЯУ МИФИ": {
    "id": "165",
    "avgEge": 95.66,
    "students": 8575
   },
   "МИЭТ": {
    "id": "140",
    "avgEge": 79.02,
    "students": 5747
   },
   "РЭУ им. Плеханова": {
    "id": "209",
    "avgEge": 92.9,
    "students": 21118
   },
   "НГУ": {
    "id": "178",
    "avgEge": 86.04,
    "students": 8276
   },
   "МПГУ": {
    "id": "160",
    "avgEge": 77.75,
    "students": 20909
   },
   "Казанский ГМУ": {
    "id": "1562",
    "avgEge": 78.94,
    "students": 6452
   },
   "СПбГЭТУ «ЛЭТИ»": {
    "id": "247",
    "avgEge": 81.33,
    "students": 10911
   },
   "РГУ им. Губкина": {
    "id": "219",
    "avgEge": 79.06,
    "students": 11754
   },
   "ВГМУ им. Бурденко": {
    "id": "1594",
    "avgEge": 87.39,
    "students": 6405
   },
   "КубГМУ": {
    "id": "1728",
    "avgEge": 81.96,
    "students": 6686
   },
   "РГПУ им. Герцена": {
    "id": "213",
    "avgEge": 80.31,
    "students": 22613
   },
   "НГМУ": {
    "id": "1619",
    "avgEge": 82.93,
    "students": 5190
   },
   "НИТУ МИСИС": {
    "id": "59",
    "avgEge": 90.7,
    "students": 10355
   },
   "РязГМУ им. Павлова": {
    "id": "1765",
    "avgEge": 85.89,
    "students": 6235
   },
   "КФУ": {
    "id": "1519",
    "avgEge": 79.23,
    "students": 39860
   },
   "СтГМУ": {
    "id": "1606",
    "students": 6079
   },
   "БГМУ": {
    "id": "1731",
    "avgEge": 77.97,
    "students": 10831
   },
   "СГМУ им. Разумовского": {
    "id": "1711",
    "avgEge": 72.01,
    "students": 8201
   },
   "ВолгГМУ": {
    "id": "1597",
    "avgEge": 78.08,
    "students": 8474
   },
   "МАИ": {
    "id": "131",
    "avgEge": 81.81,
    "students": 17244
   },
   "СибГМУ": {
    "id": "1618",
    "avgEge": 79.85,
    "students": 7490
   },
   "НИУ МГСУ": {
    "id": "144",
    "avgEge": 76.92,
    "students": 14444
   },
   "УрГМУ": {
    "id": "1607",
    "avgEge": 76.67,
    "students": 8585
   },
   "ННГУ": {
    "id": "170",
    "avgEge": 77.86,
    "students": 20533
   },
   "НГТУ": {
    "id": "177",
    "avgEge": 70.7,
    "students": 16997
   },
   "РУДН": {
    "id": "222",
    "avgEge": 86.14,
    "students": 35626
   },
   "ВГУ": {
    "id": "45",
    "avgEge": 72.97,
    "students": 17585
   },
   "КрасГМУ": {
    "id": "1589",
    "avgEge": 81.81,
    "students": 5167
   },
   "ИГМУ": {
    "id": "1596",
    "avgEge": 65.25,
    "students": 4466
   },
   "ТюмГМУ": {
    "id": "1588",
    "avgEge": 81.01,
    "students": 6544
   },
   "СПХФУ": {
    "id": "1590",
    "avgEge": 78.21,
    "students": 2211
   },
   "ЮУГМУ": {
    "id": "1591",
    "avgEge": 76.61,
    "students": 4770
   },
   "КубГУ": {
    "id": "109",
    "avgEge": 76.09,
    "students": 24459
   },
   "ЮФУ": {
    "id": "337",
    "avgEge": 74.53,
    "students": 24737
   },
   "СПбПУ": {
    "id": "240",
    "avgEge": 82.62,
    "students": 30870
   },
   "ЯрГУ им. Демидова": {
    "id": "342",
    "avgEge": 71.29,
    "students": 6233
   },
   "ДВГМУ": {
    "id": "1626",
    "avgEge": 73.28,
    "students": 2960
   },
   "ОГМУ": {
    "id": "1624",
    "avgEge": 65.86,
    "students": 8540
   },
   "СПбГАСУ": {
    "id": "236",
    "avgEge": 79.15,
    "students": 12696
   },
   "ОмГМУ": {
    "id": "1576",
    "avgEge": 78.52,
    "students": 3942
   },
   "ТюмГУ": {
    "id": "302",
    "avgEge": 79.53,
    "students": 16322
   },
   "НИУ МЭИ": {
    "id": "162",
    "avgEge": 75.86,
    "students": 20167
   },
   "ТУСУР": {
    "id": "295",
    "avgEge": 66.46,
    "students": 16513
   },
   "БелГУ": {
    "id": "17",
    "avgEge": 69.4,
    "students": 20205
   },
   "ТГУ": {
    "id": "294",
    "avgEge": 76.68,
    "students": 15746
   },
   "УрФУ": {
    "id": "313",
    "avgEge": 76.12,
    "students": 44885
   },
   "ПМФИ": {
    "id": "10006531",
    "avgEge": 54.66,
    "students": 2850
   },
   "СГУ им. Чернышевского": {
    "id": "258",
    "avgEge": 68.68,
    "students": 15942
   },
   "БФУ им. Канта": {
    "id": "217",
    "avgEge": 73.39,
    "students": 10376
   },
   "НГУЭУ": {
    "id": "179",
    "avgEge": 74.58,
    "students": 7991
   },
   "ИГУ": {
    "id": "83",
    "avgEge": 64.78,
    "students": 14296
   },
   "АлтГМУ": {
    "id": "1612",
    "avgEge": 67.74,
    "students": 6212
   },
   "КемГМУ": {
    "id": "1608",
    "avgEge": 73.27,
    "students": 4717
   },
   "Самарский ун-т": {
    "id": "251",
    "avgEge": 74.85,
    "students": 17953
   },
   "ЮУрГУ": {
    "id": "336",
    "avgEge": 70.6,
    "students": 21356
   },
   "УрГЭУ": {
    "id": "315",
    "avgEge": 74.53,
    "students": 11267
   },
   "ОмГУ": {
    "id": "184",
    "avgEge": 66.27,
    "students": 6540
   },
   "ВолГУ": {
    "id": "36",
    "avgEge": 68.08,
    "students": 8586
   },
   "ТвГУ": {
    "id": "287",
    "avgEge": 68.72,
    "students": 7863
   },
   "ТулГУ": {
    "id": "298",
    "avgEge": 70.03,
    "students": 18663
   },
   "ОмГТУ": {
    "id": "183",
    "avgEge": 65.5,
    "students": 14404
   },
   "СибГУТИ": {
    "id": "1719",
    "avgEge": 62.9,
    "students": 7180
   },
   "КНИТУ": {
    "id": "88",
    "avgEge": 67.29,
    "students": 15022
   },
   "СибГУ им. Решетнёва": {
    "id": "271",
    "avgEge": 62.03,
    "students": 12580
   },
   "Читинская ГМА": {
    "id": "1622",
    "avgEge": 59.44,
    "students": 2896
   },
   "АлтГУ": {
    "id": "4",
    "avgEge": 70.33,
    "students": 14787
   },
   "КНИТУ-КАИ": {
    "id": "87",
    "avgEge": 73.24,
    "students": 11707
   },
   "РГГМУ": {
    "id": "211",
    "avgEge": 75.18,
    "students": 3585
   },
   "ТИУ": {
    "id": "301",
    "avgEge": 66.58,
    "students": 18457
   },
   "УГНТУ": {
    "id": "319",
    "avgEge": 73.55,
    "students": 17677
   },
   "СКФУ": {
    "id": "266",
    "avgEge": 75.97,
    "students": 17680
   },
   "ПетрГУ": {
    "id": "199",
    "avgEge": 67.33,
    "students": 8826
   },
   "Тимирязевка": {
    "id": "1640",
    "avgEge": 73.52,
    "students": 13458
   },
   "ЮЗГУ": {
    "id": "113",
    "avgEge": 67.67,
    "students": 11207
   },
   "ТПУ": {
    "id": "296",
    "avgEge": 74.31,
    "students": 12685
   },
   "ДВФУ": {
    "id": "1520",
    "avgEge": 74.87,
    "students": 21191
   },
   "РГУ им. Есенина": {
    "id": "231",
    "avgEge": 65.19,
    "students": 7848
   },
   "ВГТУ": {
    "id": "44",
    "avgEge": 66.16,
    "students": 15706
   },
   "ТГАСУ": {
    "id": "292",
    "avgEge": 72.99,
    "students": 6765
   },
   "ИРНИТУ": {
    "id": "82",
    "avgEge": 65.64,
    "students": 14815
   },
   "ЧелГУ": {
    "id": "324",
    "avgEge": 67.82,
    "students": 12425
   },
   "САФУ": {
    "id": "1544",
    "avgEge": 65.89,
    "students": 10986
   },
   "ДГТУ": {
    "id": "70",
    "avgEge": 67.52,
    "students": 33344
   },
   "НГАСУ": {
    "id": "175",
    "avgEge": 65.54,
    "students": 4662
   },
   "ПНИПУ": {
    "id": "197",
    "avgEge": 70.38,
    "students": 14350
   },
   "НГПУ": {
    "id": "176",
    "avgEge": 67.06,
    "students": 12995
   },
   "КубГТУ": {
    "id": "108",
    "avgEge": 68.92,
    "students": 10768
   },
   "ВолгГТУ": {
    "id": "35",
    "avgEge": 64.94,
    "students": 14160
   },
   "УдГУ": {
    "id": "303",
    "avgEge": 66.36,
    "students": 13857
   },
   "НовГУ": {
    "id": "173",
    "avgEge": 67.81,
    "students": 10383
   },
   "ТОГУ": {
    "id": "288",
    "avgEge": 65.31,
    "students": 12525
   },
   "ПГУ": {
    "id": "194",
    "avgEge": 71.19,
    "students": 17648
   },
   "УрГУПС": {
    "id": "1759",
    "avgEge": 54.66,
    "students": 7200
   },
   "СурГУ": {
    "id": "110410",
    "avgEge": 67.02,
    "students": 6248
   },
   "КГУ им. Циолковского": {
    "id": "93",
    "avgEge": 72.74,
    "students": 6913
   },
   "ТГПУ": {
    "id": "293",
    "avgEge": 61.95,
    "students": 6333
   },
   "СТИ НИЯУ МИФИ": {
    "id": "10003308",
    "avgEge": 61.8,
    "students": 481
   },
   "КемГУ": {
    "id": "99",
    "avgEge": 67.88,
    "students": 12876
   },
   "СФУ": {
    "id": "1507",
    "avgEge": 70.29,
    "students": 26854
   },
   "СГУ (Сочи)": {
    "id": "278",
    "avgEge": 64.65,
    "students": 3610
   },
   "СГТУ им. Гагарина": {
    "id": "257",
    "avgEge": 67.92,
    "students": 12296
   },
   "ОмГПУ": {
    "id": "182",
    "avgEge": 64.22,
    "students": 6773
   },
   "АлтГТУ": {
    "id": "3",
    "avgEge": 62.02,
    "students": 6761
   },
   "СОГУ": {
    "id": "267",
    "avgEge": 67.02,
    "students": 7006
   },
   "СВФУ": {
    "id": "1527",
    "avgEge": 62.07,
    "students": 15355
   },
   "КГПУ им. Астафьева": {
    "id": "106",
    "avgEge": 64.22,
    "students": 6460
   },
   "ЮРГПУ (НПИ)": {
    "id": "334",
    "avgEge": 62.15,
    "students": 8579
   },
   "ВоГУ": {
    "id": "39",
    "avgEge": 65.36,
    "students": 6170
   },
   "УлГУ": {
    "id": "306",
    "avgEge": 65.44,
    "students": 10321
   },
   "ЧГУ им. Ульянова": {
    "id": "330",
    "avgEge": 71.99,
    "students": 18868
   },
   "МГУ им. Огарёва": {
    "id": "127",
    "avgEge": 68.12,
    "students": 15750
   },
   "ОГУ": {
    "id": "187",
    "avgEge": 67.99,
    "students": 12249
   },
   "ЛГТУ": {
    "id": "117",
    "avgEge": 64.23,
    "students": 5448
   },
   "ОмГУПС": {
    "id": "1599",
    "avgEge": 53.21,
    "students": 7200
   },
   "ИжГТУ им. Калашникова": {
    "id": "79",
    "avgEge": 68.21,
    "students": 8780
   },
   "МГТУ им. Носова": {
    "id": "120",
    "avgEge": 64.16,
    "students": 10849
   },
   "ЮГУ": {
    "id": "333",
    "avgEge": 64.85,
    "students": 4451
   },
   "ВятГУ": {
    "id": "50",
    "avgEge": 67.96,
    "students": 14470
   },
   "ДВГУПС": {
    "id": "1691",
    "avgEge": 63.14,
    "students": 11600
   },
   "СГУ им. Сорокина": {
    "id": "281",
    "avgEge": 64.98,
    "students": 6148
   },
   "АлтГПУ": {
    "id": "2",
    "avgEge": 62.21,
    "students": 6993
   },
   "АГУ им. Татищева": {
    "id": "11",
    "avgEge": 63.08,
    "students": 11457
   },
   "СГУГиТ": {
    "id": "270",
    "avgEge": 62.36,
    "students": 4863
   },
   "КузГТУ": {
    "id": "111",
    "avgEge": 60.66,
    "students": 6186
   },
   "ИрГУПС": {
    "id": "1757",
    "avgEge": 55.7,
    "students": 5175
   },
   "БГУ": {
    "id": "27",
    "avgEge": 64.78,
    "students": 6547
   },
   "КБГУ": {
    "id": "85",
    "avgEge": 69.11,
    "students": 12950
   },
   "ДГУ": {
    "id": "64",
    "avgEge": 65.99,
    "students": 11136
   },
   "ВГУЭС": {
    "id": "28",
    "avgEge": 65.96,
    "students": 7692
   },
   "СибАДИ": {
    "id": "269",
    "avgEge": 59.52,
    "students": 6289
   },
   "НГАУ": {
    "id": "1649",
    "avgEge": 67.34,
    "students": 6675
   },
   "МГТУ (Мурманск)": {
    "id": "1602",
    "avgEge": 62.32,
    "students": 5438
   },
   "СахГУ": {
    "id": "260",
    "avgEge": 61.85,
    "students": 3365
   },
   "ПсковГУ": {
    "id": "1530",
    "avgEge": 66.26,
    "students": 7923
   },
   "ЗабГУ": {
    "id": "328",
    "avgEge": 61.9,
    "students": 11996
   },
   "ХГУ им. Катанова": {
    "id": "322",
    "avgEge": 62.9,
    "students": 6106
   },
   "ВСГУТУ": {
    "id": "46",
    "avgEge": 60.84,
    "students": 6791
   },
   "ГАУ Северного Зауралья": {
    "id": "1713",
    "avgEge": 58.59,
    "students": 3937
   },
   "УрГАУ": {
    "id": "1724",
    "avgEge": 57.52,
    "students": 4537
   },
   "СибГИУ": {
    "id": "272",
    "avgEge": 60.97,
    "students": 8081
   },
   "АмГУ": {
    "id": "5",
    "avgEge": 62.79,
    "students": 4984
   },
   "ЧГУ им. Кадырова": {
    "id": "327",
    "avgEge": 67.12,
    "students": 16314
   },
   "ДГТУ (Махачкала)": {
    "id": "63",
    "avgEge": 63.03,
    "students": 3985
   },
   "КнАГУ": {
    "id": "103",
    "avgEge": 62.64,
    "students": 4902
   },
   "КГУ (Курган)": {
    "id": "112",
    "avgEge": 61.15,
    "students": 6120
   },
   "МарГУ": {
    "id": "124",
    "avgEge": 65.16,
    "students": 9106
   },
   "КрасГАУ": {
    "id": "1641",
    "avgEge": 51.32,
    "students": 7749
   },
   "АнГТУ": {
    "id": "7",
    "avgEge": 61.61,
    "students": 1865
   },
   "КамГУ им. Беринга": {
    "id": "95",
    "avgEge": 61.1,
    "students": 1667
   },
   "КалмГУ": {
    "id": "92",
    "avgEge": 67.18,
    "students": 7671
   },
   "ОмГАУ": {
    "id": "1638",
    "avgEge": 57.69,
    "students": 7256
   },
   "Иркутский ГАУ": {
    "id": "1690",
    "avgEge": 48.97,
    "students": 6288
   },
   "Алтайский ГАУ": {
    "id": "1682",
    "avgEge": 53.38,
    "students": 4272
   },
   "ИнгГУ": {
    "id": "80",
    "avgEge": 65.03,
    "students": 7531
   },
   "СКГА": {
    "id": "96",
    "avgEge": 61.87,
    "students": 4807
   },
   "СВГУ": {
    "id": "261",
    "avgEge": 59.69,
    "students": 2358
   },
   "ТувГУ": {
    "id": "299",
    "avgEge": 59.31,
    "students": 6893
   },
   "БТИ (филиал АлтГТУ)": {
    "id": "10000009",
    "avgEge": 64.69,
    "students": 991
   },
   "БрГУ": {
    "id": "23",
    "avgEge": 59.65,
    "students": 3333
   },
   "Бурятская ГСХА": {
    "id": "1686",
    "avgEge": 59.37,
    "students": 4851
   },
   "Университет Иннополис": {
    "id": "113409",
    "avgEge": 98.47,
    "students": 1431
   },
   "СевГУ": {
    "id": "113437",
    "avgEge": 67.43,
    "students": 12994
   }
  };
  (A.universities || []).forEach(function (u) {
    var m = M[u.short];
    if (!m) return;
    if (m.avgEge) { u.avgEge = m.avgEge; u.avgEgeSrc = 'monitoring-2025'; u.avgEgeAsOf = '2026-02-03'; }
    if (m.students) u.students = m.students;
    u.monitoringId = String(m.id);
  });
  var extra = [
   {
    "short": "Университет «Синергия»",
    "full": "Московский университет «Синергия»",
    "city": "Москва",
    "card": "org",
    "avg": 172,
    "avgEge": 57.27,
    "students": 76803,
    "monitoringId": "1834",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "РУТ (МИИТ)",
    "full": "Российский университет транспорта",
    "city": "Москва",
    "card": "org",
    "avg": 196,
    "avgEge": 65.17,
    "students": 28472,
    "monitoringId": "1566",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "Тольяттинский ГУ",
    "full": "Тольяттинский государственный университет",
    "city": "Тольятти",
    "card": "org",
    "avg": 199,
    "avgEge": 66.33,
    "students": 21072,
    "monitoringId": "291",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "КФУ им. Вернадского",
    "full": "Крымский федеральный университет имени В.И.Вернадского",
    "city": "Симферополь",
    "card": "org",
    "avg": 206,
    "avgEge": 68.61,
    "students": 18758,
    "monitoringId": "113416",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "РГГУ",
    "full": "Российский государственный гуманитарный университет",
    "city": "Москва",
    "card": "org",
    "avg": 249,
    "avgEge": 82.94,
    "students": 18450,
    "monitoringId": "212",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "СПбГУПТД",
    "full": "Санкт-Петербургский государственный университет промышленных технологий и дизайна",
    "city": "Санкт-Петербург",
    "card": "org",
    "avg": 250,
    "avgEge": 83.49,
    "students": 18365,
    "monitoringId": "245",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "СамГТУ",
    "full": "Самарский государственный технический университет",
    "city": "Самара",
    "card": "org",
    "avg": 203,
    "avgEge": 67.69,
    "students": 18345,
    "monitoringId": "252",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "Московский политех",
    "full": "Московский политехнический университет",
    "city": "Москва",
    "card": "org",
    "avg": 227,
    "avgEge": 75.5,
    "students": 15926,
    "monitoringId": "120111",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "КубГАУ",
    "full": "Кубанский государственный аграрный университет имени И.Т. Трубилина",
    "city": "Краснодар",
    "card": "org",
    "avg": 208,
    "avgEge": 69.34,
    "students": 15925,
    "monitoringId": "1782",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "Университет им. С. Ю. Витте",
    "full": "Московский университет им. С.Ю. Витте",
    "city": "Москва",
    "card": "org",
    "avg": 196,
    "avgEge": 65.4,
    "students": 15716,
    "monitoringId": "1943",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": []
   },
   {
    "short": "ОГУ им. Тургенева",
    "full": "Орловский государственный университет имени И.С. Тургенева",
    "city": "Орёл",
    "card": "org",
    "avg": 203,
    "avgEge": 67.74,
    "students": 14558,
    "monitoringId": "191",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "РГСУ",
    "full": "Российский государственный социальный университет",
    "city": "Москва",
    "card": "org",
    "avg": 213,
    "avgEge": 71.06,
    "students": 14160,
    "monitoringId": "215",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "МГПУ",
    "full": "Московский городской педагогический университет",
    "city": "Москва",
    "card": "org",
    "avg": 255,
    "avgEge": 85.16,
    "students": 14128,
    "monitoringId": "2183",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": []
   },
   {
    "short": "ВлГУ",
    "full": "Владимирский государственный университет имени Александра Григорьевича и Николая Григорьевича Столетовых",
    "city": "Владимир",
    "card": "org",
    "avg": 195,
    "avgEge": 65.04,
    "students": 13606,
    "monitoringId": "30",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "ГГНТУ",
    "full": "Грозненский государственный нефтяной технический университет имени академика М.Д. Миллионщикова",
    "city": "Грозный",
    "card": "org",
    "avg": 207,
    "avgEge": 69.01,
    "students": 13553,
    "monitoringId": "61",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "ПГНИУ",
    "full": "Пермский государственный национальный исследовательский университет",
    "city": "Пермь",
    "card": "org",
    "avg": 207,
    "avgEge": 69.08,
    "students": 13266,
    "monitoringId": "198",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "Воронежский ГАУ",
    "full": "Воронежский государственный аграрный университет имени императора Петра I",
    "city": "Воронеж",
    "card": "org",
    "avg": 169,
    "avgEge": 56.23,
    "students": 12971,
    "monitoringId": "1650",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "ГУАП",
    "full": "Санкт-Петербургский государственный университет аэрокосмического приборостроения",
    "city": "Санкт-Петербург",
    "card": "org",
    "avg": 226,
    "avgEge": 75.43,
    "students": 12383,
    "monitoringId": "243",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   },
   {
    "short": "Тамбовский ГУ",
    "full": "Тамбовский государственный университет имени Г.Р. Державина",
    "city": "Тамбов",
    "card": "org",
    "avg": 209,
    "avgEge": 69.54,
    "students": 12208,
    "monitoringId": "284",
    "src": "monitoring-2025",
    "asOf": "2026-02-03",
    "programs": [],
    "dorm": true
   }
  ];
  A.universities.push.apply(A.universities, extra);
})();
