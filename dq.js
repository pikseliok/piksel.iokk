/* πksel · Günün sualı. Bu fayl ayrı GitHub repoda durur, index.html-də yalnız bir sətir var:
   <script src=https://pikseliok.github.io/REPO-ADI/dq.js></script>   ("Keçidlər" başlığının qabağında)
   Sualları əlavə etmək üçün yalnız aşağıdakı AYARLAR hissəsini dəyiş. */
(function () {
  // ===================== AYARLAR =====================
  var API = "https://script.google.com/macros/s/AKfycbwSKLXaTgehKRwqbID2ik3FPSxCCSPmTHje00xtn6FR4i-Fakx4ku8Jk98B3EFkDc8H_w/exec"; // Apps Script "Web app" ünvanı
  var START = "2026-10-19"; // birinci sualın çıxdığı gün (hər gün növbəti sual, sıra ilə, Bakı vaxtı 00:00-da)
  var QUESTIONS = [
    { author: "Əlizadə Onur", authorGen: "un", question: "Sual mətni burada olacaq", answer: "Düzgün cavab burada olacaq", criteria: "Sayılma meyarı burada olacaq", comment: "Şərh burada olacaq", source: "Mənbə varsa burda olacaq" },
    // { author: "...", authorGen: "", question: "...", answer: "...", criteria: "", comment: "", source: "https://..." },
  ];
  // authorGen boş qalsa "Əli Məmmədovun" avtomatik düzəlir; səhv çıxsa özün yaz.
  // ================== AYARLAR BİTDİ ==================
  var host = document.currentScript;

  var css = `
.dq{--bar:50px;--side:96px;--divh:28px;--flame-off:#aab3c9;margin-top:14px;height:var(--bar);border-radius:40px;overflow:hidden;position:relative;background:var(--grad);color:var(--fg);box-shadow:0 10px 28px rgba(0,20,100,.08);transition:height .65s cubic-bezier(.4,0,.2,1),border-radius .65s ease}
body.dark .dq{--flame-off:#4b546e}
.dq.open{--divh:64px;border-radius:30px}
.dq.rv{--side:0px}
.dq-grid{display:grid;grid-template-columns:var(--side) 2px minmax(0,1fr) 2px var(--side);align-items:center;height:100%;padding:0 8px}
.dq-div{width:2px;height:var(--divh);background:currentColor;opacity:.14;border-radius:2px;justify-self:center;transition:height .65s ease,opacity .3s ease}
.dq-side{min-width:0;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .3s ease}
.dq.rv .dq-side,.dq.rv .dq-div{opacity:0;overflow:hidden;pointer-events:none}
.dq-flame{display:flex;flex-direction:column;align-items:center;line-height:1}
.fl{position:relative;width:24px;height:24px}
.fl svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.fl .off path{fill:var(--flame-off);transition:fill .65s ease}
.fl .on{clip-path:inset(100% 0 0 0)}
.fl.lit .on{clip-path:inset(0 0 0 0)}
.fl.lit .off{opacity:0}
.dq-num{height:11px;overflow:hidden;margin-top:2px;font-size:10px;line-height:11px;font-weight:700;min-width:10px;text-align:center}
.dq-num b{display:block}
.dq-timer{display:flex;flex-direction:column;align-items:center;line-height:1.15}
.dq-timer small{font-size:8px;font-weight:500;opacity:.78;white-space:nowrap}
.dq-timer b{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.dq-mid{min-width:0;text-align:center;padding:0 6px}
.dq-cta{display:flex;align-items:center;justify-content:center;gap:8px;height:var(--bar);cursor:pointer;font-size:15px;font-weight:700;letter-spacing:-.2px;line-height:1.2;user-select:none;-webkit-user-select:none}
.dq-cta.gone{display:none}
.dq-cta svg{width:20px;height:20px;flex:0 0 20px;display:block}
.dq-body{display:none;padding:20px 4px 22px}
.dq-author{font-size:16px;font-weight:700;letter-spacing:-.3px}
.dq-text{margin-top:8px;font-size:15px;line-height:1.5;font-weight:500;white-space:pre-line;overflow-wrap:anywhere}
.dq-form{display:flex;align-items:center;gap:8px;margin-top:18px}
.dq-field{height:42px;min-width:0;display:flex;border-radius:40px;border:2px solid color-mix(in srgb,var(--fg) 30%,transparent);background:color-mix(in srgb,var(--fg) 10%,transparent);transition:border-color .3s ease}
.dq-field.n{flex:0 1 34%}
.dq-field.a{flex:1 1 0}
.dq-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:0 14px;font:500 16px Poppins,sans-serif;color:var(--fg);border-radius:40px;transition:opacity .3s ease}
.dq-field input::placeholder{color:color-mix(in srgb,var(--fg) 55%,transparent)}
.dq-field.locked input{opacity:.55;cursor:default;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.dq-field.bad{border-color:#ff5a4f;animation:dqShake .45s}
@keyframes dqShake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.dq-send{flex:0 0 42px;width:42px;height:42px;border:0;border-radius:50%;background:var(--fg);color:var(--c1);display:grid;place-items:center;cursor:pointer;transition:transform .25s ease}
.dq-send:hover{transform:scale(1.07)}
.dq-send:active{transform:scale(.93)}
.dq-send svg{width:22px;height:22px;display:block}
.dq-res{display:none;margin-top:18px}
.dq-line{font-size:15px;line-height:1.5;font-weight:500;overflow-wrap:anywhere}
.dq-line+.dq-line{margin-top:8px}
.dq-line b{font-weight:700}
.dq-line a{text-decoration:underline;text-underline-offset:3px}
.dq-copy{margin-top:16px;display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 18px;border-radius:30px;border:2px solid color-mix(in srgb,var(--fg) 35%,transparent);background:transparent;color:var(--fg);font-size:14px;font-weight:500;cursor:pointer;transition:transform .25s ease}
.dq-copy:active{transform:scale(.95)}
.dq-copy svg{width:16px;height:16px}
.dq-cta:focus-visible,.dq-send:focus-visible,.dq-copy:focus-visible{outline:3px solid currentColor;outline-offset:3px}
@media (max-width:700px){.dq{--bar:46px;--side:80px;--divh:26px}.dq-cta{font-size:13px;gap:6px}.dq-cta svg{width:18px;height:18px;flex-basis:18px}.fl{width:20px;height:20px}.dq-side{gap:7px}.dq-timer b{font-size:13px}.dq-timer small{font-size:7px}.dq-field.n{flex-basis:32%}}
@media (max-width:420px){.dq{--bar:42px;--side:74px}.dq-cta{font-size:12px}}
`;

  var FL_OUT = "M12 2C12.8 6.2 18 8.6 18 15a6 6 0 0 1-12 0c0-2.6 1.1-4.4 2.5-5.8.2 1.8.9 2.9 2 3.4C10.2 9 10.4 5 12 2Z";
  var FL_IN = "M12 20.6a2.8 2.8 0 0 1-2.8-2.8c0-1.6 1.2-2.5 2.8-4.4 1.6 1.9 2.8 2.8 2.8 4.4A2.8 2.8 0 0 1 12 20.6Z";
  var html = `
<div class="rise dq-grid">
 <div class="dq-side">
  <div class="dq-flame"><div class="fl" id="dqFl">
   <svg class="off" viewBox="0 0 24 24" aria-hidden="true"><path d="${FL_OUT}"/></svg>
   <svg class="on" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="dqg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3b1f"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient></defs><path d="${FL_OUT}" fill="url(#dqg)"/><path d="${FL_IN}" fill="#ffd23f"/></svg>
  </div><div class="dq-num"><b id="dqNum">0</b></div></div>
  <div class="dq-timer"><small>Qalan vaxt</small><b id="dqTime">--:--</b></div>
 </div>
 <i class="dq-div"></i>
 <div class="dq-mid">
  <div class="dq-cta" id="dqCta" role="button" tabindex="0">
   <svg id="dqIq" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.4a2.9 2.9 0 0 1 5.6.9c0 1.9-2.8 2.4-2.8 4"/><circle cx="12" cy="17.3" r=".5" fill="currentColor"/></svg>
   <svg id="dqIo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.4l2.7 2.7 5.3-5.6"/></svg>
   <span id="dqCtaT">Günün sualını oyna</span>
  </div>
  <div class="dq-body" id="dqBody">
   <div class="dq-author" id="dqAuthor"></div>
   <div class="dq-text" id="dqText"></div>
   <div class="dq-form" id="dqForm">
    <div class="dq-field n" id="dqNF"><input id="dqName" maxlength="40" placeholder="Adınız" autocomplete="off" autocapitalize="words" enterkeyhint="next"></div>
    <div class="dq-field a" id="dqAF"><input id="dqAns" maxlength="300" placeholder="Cavabınız" autocomplete="off" enterkeyhint="send"></div>
    <button class="dq-send" id="dqSend" type="button" aria-label="Göndər"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 3.5 3.5 10.8l6.2 2.4 2.4 6.3z"/><path d="M9.7 13.2 20.5 3.5"/></svg></button>
   </div>
   <div class="dq-res" id="dqRes"><div id="dqResIn"></div>
    <button class="dq-copy" id="dqCopy" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><span>Kopyala</span></button>
   </div>
  </div>
 </div>
 <i class="dq-div"></i>
 <div class="dq-side"></div>
</div>`;

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var root = document.createElement("section");
  root.className = "frame dq";
  root.style.setProperty("--i", "2");
  root.setAttribute("aria-label", "Günün sualı");
  root.innerHTML = html;
  host.parentNode.insertBefore(root, host);

  var $ = function (id) { return document.getElementById(id); };
  var fl = $("dqFl"), numEl = $("dqNum"), timeEl = $("dqTime"), cta = $("dqCta"), ctaT = $("dqCtaT"),
    body = $("dqBody"), form = $("dqForm"), res = $("dqRes"), resIn = $("dqResIn"),
    nameIn = $("dqName"), ansIn = $("dqAns"), nameF = $("dqNF"), ansF = $("dqAF"), mid = root.querySelector(".dq-mid");
  var S = null, skew = 0, open = false, review = false, busy = false, locked = false, refreshing = false;

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var A = function (el, kf, ms, o) {
    var a = el.animate(kf, Object.assign({ duration: ms, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }, o || {}));
    return a.finished.then(function () { Object.assign(el.style, kf[kf.length - 1]); a.cancel(); });
  };

  // ---- istifadəçi kimliyi (cihazda)
  var uid = "";
  try { uid = localStorage.getItem("piksel-uid") || ""; } catch (e) {}
  if (!/^[\w-]{8,64}$/.test(uid)) {
    uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem("piksel-uid", uid); } catch (e) {}
  }

  // ---- Azərbaycan dilində yiyəlik hal: Əli → Əlinin, Məmmədov → Məmmədovun
  function gen(n) {
    n = n.trim();
    var low = n.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase(), v = "aıoueəiöü", last = "", ends = false;
    for (var i = low.length - 1; i >= 0; i--) if (v.indexOf(low[i]) > -1) { last = low[i]; ends = i === low.length - 1; break; }
    var s = { a: "ı", "ı": "ı", e: "i", "ə": "i", i: "i", o: "u", u: "u", "ö": "ü", "ü": "ü" }[last] || "ı";
    return n + (ends ? "n" + s + "n" : s + "n");
  }

  // ---- vəziyyət: sual yerli siyahıdan, ad/seriya/cavablama Google Sheets-dən
  var OFF = 4 * 36e5, DAY = 864e5, dnum = function (t) { return Math.floor((t + OFF) / DAY); };
  function build(d) {
    var today = dnum(d.now), n = QUESTIONS.length,
      idx = Math.max(0, today - Date.parse(START + "T00:00:00Z") / DAY) % n, q = QUESTIONS[idx],
      lit = d.streak > 0 && (d.last === today || d.last === today - 1), done = d.last === today;
    return { now: d.now, next: (today + 1) * DAY - OFF, qn: idx + 1, author: q.author, authorGen: q.authorGen || "",
      question: q.question, name: d.name || "", streak: lit ? d.streak : 0, lit: lit, answered: done, reveal: done ? q : null };
  }
  function load() {
    return fetch(API + "?action=state&uid=" + encodeURIComponent(uid))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) throw new Error("server: " + d.error);
        if (!QUESTIONS.length) throw new Error("sual siyahısı boşdur");
        S = build(d);
        skew = d.now - Date.now();
      });
  }
  function render() {
    numEl.textContent = S.streak;
    fl.classList.toggle("lit", !!S.lit);
    ctaT.textContent = S.answered ? "Günün sualını oynadız." : "Günün sualını oyna";
    $("dqIq").style.display = S.answered ? "none" : "";
    $("dqIo").style.display = S.answered ? "" : "none";
    tick();
  }
  function tick() {
    if (!S) return;
    var rem = S.next - (Date.now() + skew);
    if (rem <= 0) {
      if (!open && !busy && !refreshing) { refreshing = true; load().then(render).catch(function () {}).then(function () { refreshing = false; }); }
      return;
    }
    var h = Math.floor(rem / 36e5), m = Math.floor((rem % 36e5) / 6e4);
    timeEl.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  setInterval(tick, 1000);

  // ---- nəticə bloku
  function buildRes() {
    resIn.textContent = "";
    var r = S.reveal || {}, rows = [["Cavab:", r.answer], ["Sayılma Meyarı:", r.criteria], ["Şərh:", r.comment], ["Mənbə:", r.source]];
    rows.forEach(function (x) {
      var v = (x[1] || "").trim();
      if (!v) return;
      var d = document.createElement("div"), b = document.createElement("b");
      d.className = "dq-line";
      b.textContent = x[0];
      d.appendChild(b);
      d.appendChild(document.createTextNode(" "));
      if (x[0] === "Mənbə:" && /^https?:\/\//i.test(v)) {
        var a = document.createElement("a");
        a.href = v; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = v;
        d.appendChild(a);
      } else d.appendChild(document.createTextNode(v));
      resIn.appendChild(d);
    });
  }
  function title() { return S.author ? (S.authorGen || gen(S.author)) + " sualı" : "Günün sualı"; }
  function copyText() {
    var r = S.reveal || {}, t = title() + "\n" + S.question + "\n";
    if (r.answer) t += "\nCavab: " + r.answer;
    if (r.criteria) t += "\nSayılma Meyarı: " + r.criteria;
    if (r.comment) t += "\nŞərh: " + r.comment;
    if (r.source) t += "\nMənbə: " + r.source;
    return t + "\n\nπksel — peaksel.az";
  }
  $("dqCopy").addEventListener("click", function () {
    var t = copyText(), lab = this.querySelector("span");
    var done = function () { lab.textContent = "Kopyalandı"; setTimeout(function () { lab.textContent = "Kopyala"; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fb);
    else fb();
    function fb() {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      ta.remove();
    }
  });

  // ---- yüksəklik
  function barPx() { return parseFloat(getComputedStyle(root).getPropertyValue("--bar")) || 50; }
  function fit() { root.style.height = Math.max(barPx(), mid.offsetHeight) + "px"; }
  window.addEventListener("resize", function () { if (open) fit(); });

  // ---- alov
  async function setNum(n) {
    if (numEl.textContent === String(n)) return;
    await A(numEl, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }], 220);
    numEl.textContent = n;
    await A(numEl, [{ transform: "translateY(100%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], 260);
  }
  async function ignite(n) {
    var on = fl.querySelector(".on"), was = fl.classList.contains("lit");
    fl.animate([{ transform: "scale(1)" }, { transform: "scale(1.6)", offset: .5 }, { transform: "scale(1)" }], { duration: 1100, easing: "ease-in-out" });
    var p = setNum(n);
    if (!was) {
      fl.classList.remove("lit");
      var a = on.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 850, easing: "ease-out", fill: "forwards" });
      await a.finished;
      fl.classList.add("lit");
      a.cancel();
    }
    await p;
  }

  // ---- aç / bağla
  async function openDQ() {
    if (busy || open || !S) return;
    busy = true;
    review = !!S.answered;
    $("dqAuthor").textContent = title();
    $("dqText").textContent = S.question;
    await A(cta, [{ opacity: 1 }, { opacity: 0 }], 220);
    cta.classList.add("gone");
    root.classList.add("open");
    if (review) {
      root.classList.add("rv");
      form.style.display = "none";
      buildRes();
      res.style.display = "block"; res.style.transform = "none";
    } else {
      locked = !!S.name;
      nameIn.value = S.name || ""; nameIn.readOnly = locked;
      nameF.classList.toggle("locked", locked);
      ansIn.value = "";
      form.style.cssText = "display:flex;opacity:1;transform:none";
      res.style.display = "none";
    }
    body.style.opacity = 0; body.style.display = "block";
    open = true;
    fit();
    await sleep(260);
    await A(body, [{ opacity: 0 }, { opacity: 1 }], 400);
    await sleep(300);
    busy = false;
    if (review) arm();
  }

  async function closeDQ() {
    if (!open || busy) return;
    busy = true; disarm();
    await A(body, [{ opacity: 1 }, { opacity: 0 }], 300);
    body.style.display = "none";
    root.classList.remove("open");
    root.style.height = "";
    await sleep(700);
    root.classList.remove("rv");
    open = false;
    render();
    cta.classList.remove("gone");
    await A(cta, [{ opacity: 0 }, { opacity: 1 }], 350);
    busy = false;
  }

  // ---- ekranı hərəkət etdirəndə gizlət
  var armed = false, y0 = 0, armT = 0;
  var onMove = function () { closeDQ(); };
  var onScroll = function () { if (Math.abs(scrollY - y0) > 12) closeDQ(); };
  var onKey = function (e) { if (e.key === "Escape") closeDQ(); };
  function arm() {
    clearTimeout(armT);
    armT = setTimeout(function () {
      if (!open) return;
      y0 = scrollY; armed = true;
      addEventListener("wheel", onMove, { passive: true });
      addEventListener("touchmove", onMove, { passive: true });
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("keydown", onKey);
    }, 900);
  }
  function disarm() {
    clearTimeout(armT);
    if (!armed) return;
    armed = false;
    removeEventListener("wheel", onMove);
    removeEventListener("touchmove", onMove);
    removeEventListener("scroll", onScroll);
    removeEventListener("keydown", onKey);
  }

  // ---- ad: 2 saniyə basılı saxlayanda dəyişir (heç bir işarə yoxdur)
  var lp = 0;
  nameF.addEventListener("pointerdown", function () {
    if (!locked) return;
    lp = setTimeout(function () {
      locked = false; nameIn.readOnly = false; nameF.classList.remove("locked");
      nameIn.focus(); nameIn.select();
    }, 2000);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (e) { nameF.addEventListener(e, function () { clearTimeout(lp); }); });
  nameF.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  // ---- göndər
  function bad(el) { el.classList.remove("bad"); void el.offsetWidth; el.classList.add("bad"); setTimeout(function () { el.classList.remove("bad"); }, 700); }
  async function submit() {
    if (busy || !open || review) return;
    var name = nameIn.value.trim().replace(/\s+/g, " "), ans = ansIn.value.trim();
    var okN = (name.match(/\p{L}/gu) || []).length >= 3, okA = ans.length > 0;
    if (!okN || !okA) { if (!okN) bad(nameF); if (!okA) bad(ansF); return; }
    busy = true;
    ansIn.blur(); nameIn.blur();
    form.style.pointerEvents = "none";
    var req = fetch(API + "?action=answer&uid=" + encodeURIComponent(uid) + "&name=" + encodeURIComponent(name) + "&answer=" + encodeURIComponent(ans) + "&qn=" + S.qn)
      .then(function (r) { return r.json(); });
    var fade = A(form, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }], 350);
    var d;
    try {
      d = (await Promise.all([req, fade]))[0];
      if (!d || d.error) throw 0;
    } catch (e) {
      form.style.pointerEvents = "";
      await A(form, [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "scale(1)" }], 250);
      bad(nameF); bad(ansF);
      busy = false;
      return;
    }
    S = build(d); skew = d.now - Date.now();
    form.style.display = "none";
    buildRes();
    res.style.display = "block"; res.style.transform = "translateY(130%)";
    ignite(S.streak);
    fit();                        // çərçivə genişlənir
    await sleep(700);
    await A(res, [{ transform: "translateY(130%)" }, { transform: "translateY(0)" }], 650);   // aşağıdan yuxarı gəlir
    busy = false;
    review = true;
    arm();
  }
  $("dqSend").addEventListener("click", submit);
  ansIn.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  nameIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ansIn.focus(); } });

  cta.addEventListener("click", openDQ);
  cta.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDQ(); } });

  // ---- start
  var DBG = /dqdebug/.test(location.search);
  if (DBG) console.log("dq.js yükləndi");
  var fail = function (e) {
    if (DBG) { ctaT.textContent = "Xəta: " + ((e && e.message) || "server cavab vermir"); console.error(e); }
    else root.remove();
  };
  if (/XXXX/.test(API)) fail(new Error("API ünvanı yazılmayıb"));
  else load().then(render).catch(fail);
})();
