/* πksel ortaq navbar. İstifadə: köhnə <nav class="top-nav">...</nav> əvəzinə həmin yerə <script src="/navbar.js"></script> qoyun */
(function () {
  if (document.querySelector('.nb-wrap')) return;
  var cs = document.currentScript;
  var path = location.pathname.replace(/\/+$/, '').replace(/\.html$/, '') || '/';
  var D = [
    { t: 'Düymələr', s: [['Breyn düyməsi', '/breyn_duyme'], ['Xəmsə düyməsi', '/xemse_duyme']] },
    { t: 'Səsli otaqlar', s: [['NHN səsli otağı', '/nhn'], ['Breyn səsli otağı', '/sesli-breyn-rinq']] },
    { t: 'Minioyunlar', s: [['XOXO', '/piksel_xoxo'], ['Rulet', '/piksel_ruleti']] }
  ];
  var SEARCH = '/sual_axtarisi', CONTACT = '/elaqe';

  var css = '\
@font-face{font-family:"Object Sans";font-style:normal;font-weight:300 400;font-display:swap;src:local("Object Sans Regular"),local("ObjectSans-Regular"),url(/fonts/ObjectSans-Regular.woff2) format("woff2"),url(/fonts/ObjectSans-Regular.otf) format("opentype")}\
@font-face{font-family:"Object Sans";font-style:normal;font-weight:500;font-display:swap;src:local("Object Sans Medium"),local("ObjectSans-Medium"),url(/fonts/ObjectSans-Medium.woff2) format("woff2"),url(/fonts/ObjectSans-Medium.otf) format("opentype")}\
@font-face{font-family:"Object Sans";font-style:normal;font-weight:600 800;font-display:swap;src:local("Object Sans Bold"),local("ObjectSans-Bold"),url(/fonts/ObjectSans-Bold.woff2) format("woff2"),url(/fonts/ObjectSans-Bold.otf) format("opentype")}\
@font-face{font-family:"Object Sans";font-style:italic;font-weight:300 500;font-display:swap;src:local("Object Sans Slanted"),local("ObjectSans-Slanted"),url(/fonts/ObjectSans-Slanted.woff2) format("woff2"),url(/fonts/ObjectSans-Slanted.otf) format("opentype")}\
.nb-wrap{position:relative;z-index:60;width:100%;font-family:"Object Sans",Poppins,sans-serif;--k:0}\
.nb{position:relative;z-index:2;height:52px;border-radius:40px;background:var(--grad);color:var(--fg);box-shadow:0 10px 28px rgba(0,20,100,.08);display:flex;align-items:center;justify-content:center}\
.nb-links{display:flex;align-items:center;gap:8px}\
.nb-i{width:150px;height:40px;border-radius:30px;border:2px solid transparent;display:flex;align-items:center;justify-content:center;gap:7px;font:500 15px "Object Sans",Poppins,sans-serif;color:inherit;background:none;cursor:pointer;text-decoration:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;transition:background .25s,border-color .25s,transform .25s}\
.nb-i.on,.nb-i.sel{background:color-mix(in srgb,var(--fg) 16%,transparent);border-color:color-mix(in srgb,var(--fg) 34%,transparent)}\
.nb-i:active{transform:scale(.96)}\
.nb-i:focus-visible,.nb-c:focus-visible{outline:3px solid currentColor;outline-offset:3px}\
.nb-i svg{width:17px;height:17px;flex:none}\
.nb-g svg{transition:transform .3s}.nb-g.sel svg{transform:rotate(180deg)}\
@keyframes nbSw{35%{transform:scale(.8) rotate(-18deg)}70%{transform:scale(1.15) rotate(8deg)}}\
.nb-c{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--accent);background:var(--page);text-decoration:none;-webkit-tap-highlight-color:transparent;transition:transform .3s,background .65s,color .65s}\
.nb-c:active{transform:translateY(-50%) scale(.95)}\
.nb-l0{left:8px}.nb-r{right:8px}.nb-m{display:none}\
.nb-m i{position:absolute;left:9px;right:9px;height:2px;border-radius:2px;background:currentColor;transition:transform .4s cubic-bezier(.5,0,.2,1),opacity .25s}\
.nb-m i:nth-child(1){top:12px}.nb-m i:nth-child(2){top:18px}.nb-m i:nth-child(3){top:24px}\
.nb-m.x{transform:translateY(-50%) rotate(180deg)}\
.nb-m.x i:nth-child(1){transform:translateY(6px) rotate(45deg)}.nb-m.x i:nth-child(2){opacity:0;transform:scaleX(0)}.nb-m.x i:nth-child(3){transform:translateY(-6px) rotate(-45deg)}\
@media (hover:hover){.nb-i:hover{background:color-mix(in srgb,var(--fg) 16%,transparent);border-color:color-mix(in srgb,var(--fg) 34%,transparent)}.nb-i:hover .nb-s{animation:nbSw .6s cubic-bezier(.4,0,.2,1)}.nb-c:hover{transform:translateY(-50%) scale(1.12)}.nb-m.x:hover{transform:translateY(-50%) rotate(180deg) scale(1.12)}}\
.nb-p{position:absolute;left:0;right:0;top:26px;z-index:1;padding:40px 18px 20px;border-radius:0 0 28px 28px;background:var(--grad);color:var(--fg);clip-path:inset(0 0 100% 0);visibility:hidden;transition:clip-path .45s cubic-bezier(.2,.8,.2,1),visibility 0s .45s}\
.nb-p.open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .45s cubic-bezier(.2,.8,.2,1),visibility 0s}\
.nb-ls{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}\
.nb-ls .nb-i{width:220px;height:46px;animation:nbIn .4s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--k) * .06s)}\
@keyframes nbIn{from{opacity:0;transform:translateY(-14px)}}\
@keyframes nbTop{from{opacity:0;transform:translateY(-44px)}}\
.ray{stroke:currentColor;stroke-width:2;stroke-linecap:round}\
.rays{transform-origin:16px 16px}\
body.dark .rays{opacity:0;transform:rotate(45deg) scale(.6)}\
body.ready .rays{transition:opacity .5s ease,transform .6s cubic-bezier(.4,0,.2,1)}\
.core{transform:scale(.68);transform-origin:16px 16px}.bite{transform:translate(14px,-14px)}body.dark .core{transform:scale(1)}body.dark .bite{transform:translate(0,0)}\
body.ready .bite,body.ready .core{transition:transform .6s cubic-bezier(.4,0,.2,1)}\
@media (min-width:701px) and (max-width:1023px){.nb-links{gap:2px}.nb-i{width:108px;font-size:13px;gap:5px}.nb-ls .nb-i{width:200px;font-size:14px}}\
@media (max-width:700px){.nb-wrap.frame{animation-name:nbTop}.nb{height:44px}.nb-c{width:34px;height:34px}.nb-l0{left:6px}.nb-r{right:6px}.nb-links .nb-i:not(.nb-h){display:none}.nb-links .nb-h,.nb-links .nb-h.on,.nb-links .nb-h:hover{width:auto;padding:0 18px;background:none;border-color:transparent;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}.nb-ct{display:none}.nb-m{display:grid}.nb-m i{left:8px;right:8px}.nb-m i:nth-child(1){top:10px}.nb-m i:nth-child(2){top:16px}.nb-m i:nth-child(3){top:22px}.nb-m.x i:nth-child(1){transform:translateY(6px) rotate(45deg)}.nb-m.x i:nth-child(3){transform:translateY(-6px) rotate(-45deg)}.nb-p{top:22px;padding:36px 14px 16px}.nb-ls{flex-direction:column;gap:8px}.nb-ls .nb-i{width:100%;height:44px;font-size:15px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var rays = ''; for (var a = 0; a < 360; a += 45) rays += '<line class="ray" x1="16" x2="16" y1="3.5" y2="6.5" transform="rotate(' + a + ' 16 16)"/>';
  var THEME = '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" id="themeIcon"><defs><mask id="biteMask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><rect width="32" height="32" fill="#fff"/><circle cx="21" cy="11" r="7.5" fill="#000" class="bite"/></mask></defs><g class="rays">' + rays + '</g><g mask="url(#biteMask)"><circle cx="16" cy="16" r="9" fill="currentColor" class="core"/></g></svg>';
  var HEAD = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19v1a2 2 0 0 1-2 2h-3"/><circle cx="12.5" cy="22" r=".8" fill="currentColor"/></svg>';
  var SRCH = '<svg class="nb-s" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2.2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function on(h) { return h === '/' ? path === '/' || path === '/index' : path === h; }
  function A(h, t, c) { return '<a class="nb-i ' + (c || '') + (on(h) ? ' on' : '') + '" href="' + h + '">' + t + '</a>'; }

  var wrap = document.createElement('div');
  wrap.className = 'nb-wrap frame'; wrap.style.setProperty('--i', 0);
  wrap.innerHTML = '<nav class="nb" aria-label="Əsas naviqasiya">' +
    '<button class="nb-c nb-l0" id="themeToggle" type="button" aria-label="Gecə rejiminə keç">' + THEME + '</button>' +
    '<div class="nb-links">' + A('/', 'Əsas Səhifə', 'nb-h') +
    D.map(function (g, i) { return '<button type="button" class="nb-i nb-g" data-g="' + i + '">' + g.t + CHEV + '</button>'; }).join('') +
    '<a class="nb-i" id="searchBtn" href="' + SEARCH + '">' + SRCH + 'Axtarış</a></div>' +
    '<a class="nb-c nb-r nb-ct" href="' + CONTACT + '" aria-label="Bizimlə Əlaqə" title="Bizimlə Əlaqə">' + HEAD + '</a>' +
    '<button class="nb-c nb-r nb-m" type="button" aria-label="Menyu" aria-expanded="false"><i></i><i></i><i></i></button></nav>' +
    '<div class="nb-p" id="nbP"></div>';
  if (cs && cs.parentNode) cs.parentNode.insertBefore(wrap, cs); else document.body.insertBefore(wrap, document.body.firstChild);

  var P = wrap.querySelector('#nbP'), M = wrap.querySelector('.nb-m'), T = wrap.querySelector('#themeToggle'), S = wrap.querySelector('#searchBtn');
  var cur = null;
  function show(html) {
    P.innerHTML = '<div class="nb-ls">' + html + '</div>';
    [].forEach.call(P.querySelectorAll('.nb-i'), function (e, k) { e.style.setProperty('--k', k); });
  }
  function subs(i, back) {
    return (back ? '<button type="button" class="nb-i" data-back="1">‹ Geri</button>' : '') + D[i].s.map(function (x) { return A(x[1], x[0]); }).join('');
  }
  function root() {
    return D.map(function (g, i) { return '<button type="button" class="nb-i" data-g="' + i + '">' + g.t + '</button>'; }).join('') +
      A(SEARCH, 'Axtarış') + A(CONTACT, 'Bizimlə Əlaqə');
  }
  function mark() { [].forEach.call(wrap.querySelectorAll('.nb-links .nb-g'), function (b) { b.classList.toggle('sel', +b.dataset.g === cur); }); }
  function open() { P.classList.add('open'); M.classList.add('x'); M.setAttribute('aria-expanded', 'true'); }
  function close() { P.classList.remove('open'); M.classList.remove('x'); M.setAttribute('aria-expanded', 'false'); cur = null; mark(); }
  var isOpen = function () { return P.classList.contains('open'); };

  wrap.addEventListener('click', function (e) {
    var g = e.target.closest('[data-g]'), b = e.target.closest('[data-back]');
    if (b) { show(root()); return; }
    if (!g) return;
    var i = +g.dataset.g;
    if (g.closest('.nb-p')) { cur = i; show(subs(i, true)); return; }
    if (cur === i && isOpen()) { close(); return; }
    cur = i; show(subs(i)); open(); mark();
  });
  M.addEventListener('click', function () { if (isOpen()) close(); else { show(root()); open(); } });
  document.addEventListener('click', function (e) { if (isOpen() && !wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  matchMedia('(max-width:700px)').addEventListener('change', close);

  S.addEventListener('click', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var a = S.querySelector('svg').animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(.8) rotate(-18deg)', offset: .35 }, { transform: 'scale(1.15) rotate(8deg)', offset: .7 }, { transform: 'scale(1) rotate(0)' }], { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)' });
    a.onfinish = function () { location.href = S.href; };
  });

  function applyTheme(d) {
    document.body.classList.toggle('dark', d);
    try { localStorage.setItem('piksel-theme', d ? 'dark' : 'light'); } catch (x) {}
    T.setAttribute('aria-label', d ? 'Gündüz rejiminə keç' : 'Gecə rejiminə keç');
  }
  T.addEventListener('click', function (e) {
    var d = !document.body.classList.contains('dark');
    if (window.setTheme) { e.stopImmediatePropagation(); window.setTheme(d, true); } else applyTheme(d);
  });
  if (!window.setTheme) { try { if (localStorage.getItem('piksel-theme') === 'dark') document.body.classList.add('dark'); } catch (x) {} }
})();
