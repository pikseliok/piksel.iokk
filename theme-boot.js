/* <head>-də ən birinci yüklənməlidir (defer/async olmadan): <script src="/theme-boot.js"></script> */
(function () {
  var h = document.documentElement, d = false;
  try { var s = localStorage.getItem('piksel-theme'); d = s ? s === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
  var st = document.createElement('style');
  st.textContent = 'html{background:
#9DC3FF}html.dk{background:
#00072C}html:not(.dkdone) body{transition:none!important}html.dk:not(.dkdone) body{--page:
#00072C;--c1:
#9DC3FF;--c2:
#6FA5FC;--fg:
#00072C;--accent:
#9DC3FF;--glow:rgba(255,255,255,.4)}';
  document.head.appendChild(st);
  if (d) h.classList.add('dk');
  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('dkdone'); h.classList.remove('dk'); }); });
  });
})();
