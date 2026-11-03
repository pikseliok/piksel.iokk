/* index.html-də </body>-dən əvvəl, ən axırıncı script kimi: <script src="/home.js"></script> */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  ['.quick-actions', '#quickFeedbackOverlay', '#quickNewsOverlay'].forEach(function (s) { var e = $(s); if (e) e.remove(); });

  var css = '\
@media (min-width:1024px){.page{width:min(94vw,1280px)}.hero{min-height:190px;padding:26px 48px 26px 56px}.hero-fixed{font-size:40px}.hero-changing-wrap{height:46px}.hero-changing{font-size:38px}.hero-brand{font-size:40px}.hero-qr{width:150px;height:150px}.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.section-title,.card-title{font-size:22px}.lb,.card-description,.consent-text,.consent-btn{font-size:15px}}\
@media (min-width:701px) and (max-width:1023px){.section-title,.card-title{font-size:21px}.lb,.card-description,.consent-text,.consent-btn{font-size:14px}}\
@media (max-width:700px){.lb{font-size:9px}.consent-text,.consent-btn{font-size:12px}}\
@media (max-width:420px){.lb{font-size:8px}.consent-text,.consent-btn{font-size:11px}}\
.dock{display:flex;align-items:flex-start;gap:16px}.dock-grid{flex:1;min-width:0}\
.pi{flex:none;display:flex;flex-direction:column;align-items:center;gap:9px;position:relative;z-index:1}\
.pi-f{width:calc(var(--s) * 2.3);height:var(--s);border-radius:26px;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;padding:0 14px;font:700 24px Poppins,sans-serif;font-variant-numeric:tabular-nums;color:var(--fg);background:color-mix(in srgb,var(--fg) 14%,transparent);border:2px solid color-mix(in srgb,var(--fg) 28%,transparent);cursor:pointer;-webkit-tap-highlight-color:transparent}\
.pi-f.ov{justify-content:flex-end}\
@media (max-width:700px){.dock{flex-direction:column;align-items:stretch}.pi{width:100%}.pi-f{width:100%;height:56px;font-size:20px}}\
.rz{margin-top:14px;display:grid;grid-template-columns:1fr 150px;gap:20px;padding:26px;border-radius:28px;background:var(--grad);color:var(--fg);box-shadow:0 10px 25px rgba(0,20,110,.07)}\
.rz-p{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:15px;margin-bottom:10px}.rz-p svg{width:20px;height:20px;flex:none}.rz-p:hover{opacity:.75}\
.rz-q{font-size:18px;line-height:1.5;font-weight:500;cursor:pointer}\
.rz-a{max-height:0;overflow:hidden;opacity:0;transition:max-height .45s ease,opacity .35s ease;font-size:15px;line-height:1.5}.rz-a.open{max-height:700px;opacity:1}\
.rz-a>div{margin-top:10px}.rz-a b{font-weight:700}\
.rz-cp{margin-top:12px;height:38px;padding:0 20px;border-radius:30px;border:2px solid var(--fg);background:none;color:var(--fg);font:500 14px Poppins,sans-serif;cursor:pointer}\
.rz-r{display:grid;gap:12px;align-content:center}\
.rz-b{height:52px;width:100%;border-radius:18px;border:2px solid var(--fg);background:transparent;color:var(--fg);font:500 15px Poppins,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .2s}\
.rz-b.on{background:var(--fg);color:var(--c1)}.rz-b:active{transform:scale(.96)}.rz-b:disabled{opacity:.6;cursor:default;transform:none}\
.rz-b svg{width:24px;height:24px}.rz-t{min-width:20px;text-align:right}\
@media (min-width:701px) and (max-width:1023px){.rz-q{font-size:16px}.rz-p{font-size:14px}.rz-a{font-size:14px}}\
@media (max-width:700px){.rz{grid-template-columns:1fr 104px;gap:12px;padding:16px;border-radius:22px}.rz-q{font-size:13px}.rz-p{font-size:12px}.rz-a{font-size:12px}.rz-b{height:44px;font-size:13px;border-radius:14px}.rz-b svg{width:20px;height:20px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- Dock: svg düzəlişləri (tək rəng, kəsik üsulu) və Turnir cədvəli ---- */
  var g = $('#dockGrid'), dock = $('#dock');
  var tm = $('[data-id=timer] .sq'), mn = $('[data-id=mini] .sq');
  if (tm) tm.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><mask id="tmm"><rect width="32" height="32" fill="#fff"/><path d="M16 18V12" stroke="#000" stroke-width="2.4" stroke-linecap="round"/></mask><circle cx="16" cy="18" r="11" fill="currentColor" mask="url(#tmm)"/><path d="M12 4h8M25 9l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  if (mn) mn.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><mask id="mnm"><rect width="32" height="32" fill="#fff"/><polygon points="16,6.5 16.71,8.53 18.85,8.57 17.14,9.87 17.76,11.93 16,10.7 14.24,11.93 14.86,9.87 13.15,8.57 15.29,8.53" fill="#000"/></mask><path d="M9 5h14v6a7 7 0 0 1-14 0z" fill="currentColor" mask="url(#mnm)"/><path d="M9 7.5H6v1.5a4 4 0 0 0 3.6 4M23 7.5h3v1.5a4 4 0 0 1-3.6 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="17.5" width="2" height="4.5" fill="currentColor"/><rect x="10" y="22" width="12" height="4.5" rx="1.5" fill="currentColor"/></svg>';

  if (g && !$('[data-id=turnir]')) {
    var rows = [9, 14, 19, 24], m = '';
    rows.forEach(function (y, i) { m += 'M10 ' + y + 'h7M20.5 ' + y + 'h3' + (i % 2 ? 'M22 ' + (y - 1.5) + 'v3' : ''); });
    var t = document.createElement('a');
    t.href = '/turnir_cedveli'; t.className = 'tile'; t.dataset.id = 'turnir'; t.draggable = false;
    t.innerHTML = '<span class="ti"><span class="sq"><svg viewBox="0 0 32 32" aria-hidden="true"><mask id="tcm"><rect width="32" height="32" fill="#fff"/><path d="' + m + '" stroke="#000" stroke-width="1.8" stroke-linecap="round" fill="none"/></mask><rect x="6" y="3" width="20" height="26" rx="3" fill="currentColor" mask="url(#tcm)"/></svg></span><span class="lb">Turnir cədvəli</span></span>';
    var p = $('[data-id=pusk]'); if (p && p.nextSibling) g.insertBefore(t, p.nextSibling); else g.appendChild(t);
  }

  /* ---- π çərçivəsi ---- */
  var DIG = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679', n = 2;
  var pi = document.createElement('div'); pi.className = 'pi';
  pi.innerHTML = '<button type="button" class="pi-f" aria-label="π rəqəmləri"></button><span class="lb"></span>';
  dock.insertBefore(pi, g);
  var pf = $('.pi-f', pi), pd = $('.lb', pi);
  function fmt() { return '3,' + DIG.slice(0, n).replace(/(.{5})(?=.)/g, '$1 '); }
  function draw() { pf.textContent = fmt(); pf.classList.toggle('ov', pf.scrollWidth > pf.clientWidth); }
  function date() { try { pd.textContent = new Date().toLocaleDateString('az', { day: 'numeric', month: 'long' }); } catch (e) { pd.textContent = new Date().toLocaleDateString(); } }
  pf.addEventListener('click', function () {
    n = n >= DIG.length ? 2 : n + 1; draw();
    pf.animate([{ transform: 'scale(1)' }, { transform: 'scale(.92)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,.3)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
  });
  date(); setInterval(date, 60000); draw();

  /* ---- İkon ölçüsü: ən uzun altyazıya görə, hamısı eyni ---- */
  function size() {
    var tiles = [].slice.call(g.children).filter(function (x) { return x.offsetParent !== null; });
    var w = 0; tiles.forEach(function (x) { w = Math.max(w, x.querySelector('.lb').scrollWidth); });
    var avail = g.clientWidth, s = Math.max(52, Math.min(w + 16, 120, Math.floor(avail / tiles.length) - 6));
    dock.style.setProperty('--n', tiles.length); dock.style.setProperty('--s', s + 'px'); draw();
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(size);
  addEventListener('resize', size); size();

  /* ---- Randomizator ---- */
  var main = $('main'), cards = $('.cards');
  var h = document.createElement('h2'); h.className = 'section-title'; h.textContent = 'Randomizator';
  var rz = document.createElement('section'); rz.className = 'rz'; rz.setAttribute('aria-label', 'Randomizator');
  rz.innerHTML = '<div><a class="rz-p" href="/paketler"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9.5C4 8.1 5.1 7 6.5 7H12l2.5 3h11c1.4 0 2.5 1.1 2.5 2.5v11c0 1.4-1.1 2.5-2.5 2.5h-19C5.1 26 4 24.9 4 23.5z" fill="currentColor"/></svg><span></span></a><div class="rz-q" role="button" tabindex="0"></div><div class="rz-a"><div class="rz-ans"></div><div class="rz-com"></div><button type="button" class="rz-cp">Kopyala</button></div></div>' +
    '<div class="rz-r"><button type="button" class="rz-b on" data-t="nhn">NHN</button><button type="button" class="rz-b" data-t="br">Breyn</button><button type="button" class="rz-b" id="rzS" aria-label="Qarışdır"><span class="rz-t"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3c4 0 6 10 11 10h4M3 17h3c1.7 0 3-1 4-2.5M14 8.5C15 7.5 16 7 17 7h4M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5"/></svg></button></div>';
  (cards || main).insertAdjacentElement('afterend', rz); rz.insertAdjacentElement('beforebegin', h);
  h.style.marginTop = '28px';

  var Q = ['sual', 'question', 'q', 'text', 'metn'], A = ['cavab', 'answer', 'a'], C = ['serh', 'şərh', 'comment', 'izah', 'explanation', 'qeyd'],
    PN = ['paket', 'paket_adi', 'package', 'packageName', 'pack', 'ad', 'name', 'title', 'adi'], TY = ['nov', 'tip', 'type', 'oyun', 'game', 'category', 'kateqoriya'], LK = ['link', 'url', 'paket_link', 'href'];
  function gv(o, ks) { for (var i = 0; i < ks.length; i++) { var v = o[ks[i]]; if (v != null && v !== '' && typeof v !== 'object') return String(v); } return ''; }
  var all = [], cur = null, sel = 'nhn';
  function collect() {
    var seen = [], names = ['SUALLAR', 'suallar', 'SUALLAR_DATA', 'suallarData', 'QUESTIONS', 'questions', 'DATA', 'data', 'PAKETLER', 'paketler', 'PACKS', 'packs'];
    function walk(v, ctx, d) {
      if (!v || d > 5 || typeof v !== 'object' || seen.indexOf(v) > -1) return; seen.push(v);
      if (Array.isArray(v)) { v.forEach(function (x) { walk(x, ctx, d + 1); }); return; }
      var q = gv(v, Q);
      if (q) { var pn = gv(v, PN.slice(0, 5)) || gv(ctx, PN), ty = (gv(v, TY) || gv(ctx, TY) || '') + ' ' + pn, tl = ty.toLowerCase();
        all.push({ q: q, a: gv(v, A), c: gv(v, C), p: pn, l: gv(v, LK) || gv(ctx, LK) || '/paketler', t: /breyn|brain|\bbr\b/.test(tl) ? 'br' : /nhn|nə|harada/.test(tl) ? 'nhn' : 'x' }); return; }
      var nc = (gv(v, PN) || gv(v, TY)) ? v : ctx;
      Object.keys(v).forEach(function (k) { walk(v[k], nc, d + 1); });
    }
    names.forEach(function (nm) { try { walk((0, eval)(nm), {}, 0); } catch (e) {} });
  }
  var elP = $('.rz-p span', rz), lnk = $('.rz-p', rz), elQ = $('.rz-q', rz), elA = $('.rz-a', rz);
  function pick() {
    var pool = all.filter(function (x) { return x.t === sel || x.t === 'x'; }); if (!pool.length) pool = all;
    if (!pool.length) { elP.textContent = 'Paket'; elQ.textContent = 'Suallar tapılmadı'; return; }
    var x; do { x = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && x === cur);
    cur = x; elA.classList.remove('open');
    elP.textContent = x.p || 'Paket'; lnk.href = x.l; elQ.textContent = x.q;
    $('.rz-ans', rz).innerHTML = x.a ? '<b>Cavab:</b> ' : ''; if (x.a) $('.rz-ans', rz).appendChild(document.createTextNode(x.a));
    var cm = $('.rz-com', rz); cm.innerHTML = x.c ? '<b>Şərh:</b> ' : ''; if (x.c) cm.appendChild(document.createTextNode(x.c));
  }
  var s = document.createElement('script'); s.src = '/suallar-data.js';
  s.onload = function () { collect(); pick(); };
  s.onerror = function () { elQ.textContent = 'suallar-data.js yüklənmədi'; };
  document.head.appendChild(s);

  elQ.addEventListener('click', function () { if (cur) elA.classList.toggle('open'); });
  rz.querySelectorAll('.rz-b[data-t]').forEach(function (b) { b.addEventListener('click', function () { sel = b.dataset.t; rz.querySelectorAll('.rz-b[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
  var sb = $('#rzS'), tt = $('.rz-t', sb);
  sb.addEventListener('click', function () {
    pick(); sb.disabled = true; var c = 15; tt.textContent = c;
    var iv = setInterval(function () { c--; if (c <= 0) { clearInterval(iv); sb.disabled = false; tt.textContent = ''; } else tt.textContent = c; }, 1000);
  });
  $('.rz-cp', rz).addEventListener('click', function (e) {
    if (!cur) return; var b = e.currentTarget, txt = cur.q + (cur.a ? '\nCavab: ' + cur.a : '') + (cur.c ? '\nŞərh: ' + cur.c : '');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.textContent = 'Kopyalandı ✓'; setTimeout(function () { b.textContent = 'Kopyala'; }, 1300); }, function () { });
  });
})();
