/* <head>-də ən birinci yüklənməlidir (defer/async olmadan): <script src="/theme-boot.js"></script> */
(function () {
  var h = document.documentElement, d = false;
  try {
    var s = localStorage.getItem('piksel-theme');
    d = s ? s === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {}

  /* açılışda keçid animasiyası olmasın; html fonu da modla birlikdə dəyişsin */
  var st = document.createElement('style');
  st.textContent = 'html{background:#9DC3FF}html.dk{background:#00072C}html:not(.dkdone) body{transition:none!important}';
  document.head.appendChild(st);
  if (d) h.classList.add('dk');

  /* html.dk və theme-color həmişə body.dark ilə sinxron qalır */
  function sync() {
    var dk = document.body.classList.contains('dark');
    h.classList.toggle('dk', dk);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dk ? '#00072C' : '#9DC3FF');
  }
  function init() {
    if (d) document.body.classList.add('dark'); /* body yaranan kimi, ilk çəkilişdən əvvəl */
    sync();
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.body) init();
  else {
    var mo = new MutationObserver(function () {
      if (document.body) { mo.disconnect(); init(); }
    });
    mo.observe(h, { childList: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { h.classList.add('dkdone'); });
    });
  });
})();
