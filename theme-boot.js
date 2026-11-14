/* Тема до первой отрисовки: иначе страница мигает тёмным, пока не дойдёт
   до отложенного app.js. Читает выбор пользователя и ставит класс на <html>. */
(function () {
  var saved = '';
  try { saved = localStorage.getItem('atlas:theme') || ''; } catch (e) { saved = ''; }
  var cl = document.documentElement.classList;
  if (saved === 'dark') {
    cl.remove('theme-light');
    cl.add('theme-dark');
  } else {
    cl.remove('theme-dark');
    cl.add('theme-light');
  }
}());
