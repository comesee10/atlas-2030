/* Загрузчик помощника. Проверяет устройство и сеть до того, как скачивать
   React, Three.js и стили. На слабых устройствах помощник не показывается
   и его файлы не запрашиваются. */
(function () {
  'use strict';

  var STORAGE = 'atlas:mascot';
  var script = document.currentScript;
  var src = script && script.src;
  var base;
  try {
    base = src ? new URL('.', src) : new URL('/atlas-2030/pet/', location.href);
  } catch (e) {
    base = new URL('/atlas-2030/pet/', location.href);
  }
  var version = '';
  try { version = src ? new URL(src).search : ''; } catch (e) { version = ''; }
  var cssUrl = new URL('dist/pet.css' + version, base).href;
  var jsUrl = new URL('dist/pet.js' + version, base).href;
  var button = document.getElementById('mascotHide');
  var loaded = false;
  var loading = false;
  var hidden = false;

  function readHidden() {
    try { return localStorage.getItem(STORAGE) === 'off'; } catch (e) { return false; }
  }
  hidden = readHidden();

  function setLabel(hidden) {
    if (button) button.textContent = hidden ? 'Показать помощника' : 'Скрыть помощника';
  }

  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  function isWeak() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches) return true;
    } catch (e) { /* старый браузер */ }
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      if (connection.saveData) return true;
      if (/(^|-)2g$|^3g$/.test(connection.effectiveType || '')) return true;
      /* downlink/rtt — грубые оценки, поэтому пороги консервативные:
         реальный 3G уже отсекается по effectiveType. */
      if (typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 0.7) return true;
      if (typeof connection.rtt === 'number' && connection.rtt > 800) return true;
    }
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) return true;
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) return true;
    return false;
  }

  function fail() {
    loading = false;
    document.documentElement.classList.remove('pet-ready');
  }

  function loadPet() {
    if (loaded || loading || hidden) return;
    loading = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    var cssReady = new Promise(function (resolve) {
      link.onload = resolve;
      link.onerror = resolve;
      setTimeout(resolve, 1500);
    });
    document.head.appendChild(link);
    cssReady.then(function () {
      return import(jsUrl);
    }).then(function () {
      loaded = true;
      loading = false;
    }).catch(fail);
  }

  function schedule() {
    if (hidden) return;
    var idle = window.requestIdleCallback;
    if (idle) idle(loadPet, { timeout: 2000 });
    else window.setTimeout(loadPet, 1000);
  }

  if (isWeak() || !hasWebGL()) return;

  document.documentElement.classList.add('pet-ready');
  setLabel(hidden);

  if (button) {
    button.addEventListener('click', function () {
      hidden = !hidden;
      try { localStorage.setItem(STORAGE, hidden ? 'off' : 'on'); } catch (e) { /* ignore */ }
      setLabel(hidden);
      window.dispatchEvent(new CustomEvent('atlas:pet-pref', { detail: { hidden: hidden } }));
      if (!hidden) loadPet();
    });
  }

  if (hidden) return;
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}());
