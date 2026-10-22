/* πksel · Günün sualı. Bu fayl ayrı GitHub repoda durur, index.html-də yalnız bir sətir var:
   <script src=https://pikseliok.github.io/REPO-ADI/dq.js></script>   ("Keçidlər" başlığının qabağında)
   Sualları əlavə etmək üçün yalnız aşağıdakı AYARLAR hissəsini dəyiş.

   VACİB QAYDALAR (istifadəçilərin seriyası və səsləri qorunsun deyə):
   1) Yeni sualları həmişə siyahının SONUNA əlavə et. Köhnə sualları silmə, yerini dəyişmə.
   2) Hər suala unikal "id" ver və onu heç vaxt dəyişmə (like/dislike bu id ilə saxlanır).
   3) Bu gün çıxmış sualı dəyişmə.
   Seriya, ad və səslər Google Sheets-dədir, dq.js-i dəyişmək onlara təsir etmir. */
(function () {
  // ===================== AYARLAR =====================
  var API = "https://script.google.com/macros/s/AKfycbwQz8bWarz8pudNlJaFCPmD3Pzkon3ZAJ2G1LXG4e5wwwf-twULEDZgSwqbFxuoUQxQCQ/exec"; // Apps Script "Web app" ünvanı
  var START = "2026-10-19"; // birinci sualın çıxdığı gün (hər gün növbəti sual, sıra ilə, Bakı vaxtı 00:00-da)
  var QUESTIONS = [
    { id: "s1", author: "Sual Müəllifi", authorGen: "", question: "Sual mətni buraya", answer: "Düzgün cavab buraya", criteria: "Sayılma meyarı buraya", comment: "Şərh buraya", source: "" }, 
    { id: "s2", author: "Sizdən gələn suallar / Adayeva Nübar", authorGen: "ın", question: "XVI əsrdə İtaliyada fəaliyyət göstərən kapusin adlı rahiblər geyindikləri uzun bej rəngli cübbələr və başlarına örtdükləri ağ başlıqlar İKS-ə bənzədiyi üçün , İKS-ə rahiblərin ümumi adı verilir. İKS-i xarici mənşəli bir sözlə yazın ", answer: "Kapuçino", criteria: "Cappuccino", comment: "Kapusinlərin geyimləri  qəhvəyə süd tökülərkən yaranan rəngə bənzəyirdi. Buna görə də həmin kofe növünə \"Kiçik kapusin\" yəni kapuçino adı verilir", source: "" },
    { id: "s3", author: "Hüseynli Muhamməd", authorGen: "", question: "Bədənlərindən nəfəs aldıqları üçün tarakanlar bir həftəyə qədər BUNU EDƏ bilərlər. Mayk adlı xoruz isə 18 ay boyunca BUNU EDİB rekordlar kitabına düşmüşdü. BUNU ETMƏKLƏ əvəz etdiyimizi bir neçə sözlə yazın.", answer: "Başsız yaşamaq", criteria: "Mənaya uyğun digər cavablar", comment: "Bədənlərindən nəfəs aldıqları üçün tarakanlar başları olmadan bir neçə müddət yaşaya bilir, lakin susuzluğa görə ölürlər.", source: " 1. https://en.wikipedia.org/wiki/Mike_the_Headless_Chicken 2. https://share.google/CKKvnCZkpsH35b3ln" },
    { id: "s4", author: "Sizdən gələn suallar / Məmmədov Aydın", authorGen: "", handout: "₺", question: "Paylama materialında verilmiş simvolun yaradıcısı Tülay Lalə bu simvolu yaradarkən kiçik \"L\" hərfinin üstündəki 2 paralel xəttin hər birinə məna yükləmişdi. Birincisi Türk Lirəsi ifadəsinin baş hərfləri. Bəs ikincisi?", answer: "Tülay Lalənin adı və soyadının baş hərfləri", criteria: "", comment: "Dizayner Tülay Lalə simvolu elə hazırlamışdı ki, oradakı T və L hərfləri həm \"Türk Lirəsi\" ifadəsini, həm də öz adının və soyadının baş hərflərini (Tülay Lale) təcəssüm etdirirdi.", source: "" },
    { id: "s3", author: "Yuniszadə Ema", authorGen: "", question: "Su samurları həyatlarının böyük hissəsini suda keçirir və suyun üzərində üzərək yatırlar. Maraqlıdır ki, onlar yatarkən axının təsiri ilə ayrılmamaq üçün BUNU EDİRLƏR. Alimlərin fikrincə, insanlar BUNU EDƏRKƏN tərəflərin beyin dalğaları müəyyən dərəcədə sinxronlaşır. BUNU ETMƏK ifadəsi ilə əvəz olunmuş anlayışı iki sözlə yazın.", answer: "Əl-ələ tutmaq", criteria: "Mənaya uyğun digər cavablar", comment: " Su samurları suda yatarkən axıntının onları fərqli istiqamətlərə aparmasının və bir-birlərini itirmələrinin qarşısını almaq üçün çox sevimli bir instinktə sahibdirlər. Onlar əl-ələ tutuşaraq yatırlar. Digər tərəfdən, nevroloji araşdırmalar göstərir ki, insanlar bir-birlərinin əlindən tutdușduqda tərəfdaşların beyin fəaliyyətləri və dalğaları arasında sinxronizasiya yaranır, bu da empatiyanı artırır və ağrını azaldır.", source: "https://www.facebook.com/YolveMacera/videos/1910814592410728/?mibextid=rS40aB7S9Ucbxw6v",
    // { id: "s2", author: "...", authorGen: "", question: "...", answer: "...", criteria: "", comment: "", source: "https://..." },
  ];
  // author nə yazsan, olduğu kimi görünür (məs. "Müəllif Əli Məmmədov" → "Müəllif Əli Məmmədovun sualı").
  // authorGen adətən BOŞ qalmalıdır (şəkilçi avtomatik qoyulur). Səhv çıxsa: ya qısa şəkilçi yaz ("un" → ad+un), ya da tam forma ("Əli Məmmədovun").
  // handout (ixtiyari): paylama materialı. Doldurulsa, müəllifin altında qalın "Paylama materialı" başlığı və onun altında materialın özü göstərilir.
  var SHARE_PHONE = "994508377942";   // WhatsApp nömrəsi (050 837 7942)
  var SHARE_TEXT = "Günlük sual bölməsi üçün öz sualımı sizinlə bölüşmək istəyirəm";
  // ================== AYARLAR BİTDİ ==================
  var host = document.currentScript;
  var DBG = /dqdebug/.test(location.search);

  var css = `
.dq{--bar:50px;--side:96px;--divh:28px;--flame-off:#aab3c9;margin-top:14px;height:var(--bar);border-radius:40px;overflow:hidden;position:relative;background:var(--grad);color:var(--fg);box-shadow:0 10px 28px rgba(0,20,100,.08);transition:height .65s cubic-bezier(.4,0,.2,1),border-radius .65s ease;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.dq *{-webkit-tap-highlight-color:transparent}
.dq input{-webkit-user-select:text;user-select:text}
.dq.closing{transition:height .3s cubic-bezier(.4,0,.2,1),border-radius .3s ease}
.dq.closing .dq-div{transition:height .3s ease,opacity .3s ease}
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
.dq-hl{display:none;margin-top:8px;font-size:15px;line-height:1.5;font-weight:700}
.dq-hm{display:none;margin-top:2px;font-size:17px;line-height:1.5;font-weight:500;white-space:pre-line;overflow-wrap:anywhere}
.dq-text{margin-top:8px;font-size:15px;line-height:1.5;font-weight:500;white-space:pre-line;overflow-wrap:anywhere}
.dq-form{display:flex;align-items:center;gap:8px;margin-top:18px}
.dq-field{height:42px;min-width:0;display:flex;border-radius:40px;border:2px solid rgba(128,128,128,.4);background:rgba(128,128,128,.12);border:2px solid color-mix(in srgb,var(--fg) 30%,transparent);background:color-mix(in srgb,var(--fg) 10%,transparent);transition:border-color .3s ease}
.dq-field.n{flex:0 1 34%}
.dq-field.a{flex:1 1 0}
.dq-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:0 14px;font:500 16px Poppins,sans-serif;color:var(--fg);border-radius:40px;transition:opacity .3s ease}
.dq-field input::placeholder{color:rgba(128,128,128,.85);color:color-mix(in srgb,var(--fg) 55%,transparent)}
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
.dq-act{position:relative;display:flex;justify-content:center;align-items:flex-start;gap:26px;margin-top:18px}
.dq-ab{display:flex;flex-direction:column;align-items:center;gap:5px}
.dq-ic{width:40px;height:40px;padding:0;border-radius:50%;border:2px solid rgba(128,128,128,.45);border:2px solid color-mix(in srgb,var(--fg) 35%,transparent);background:transparent;color:var(--fg);display:grid;place-items:center;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:transform .25s ease,border-color .25s ease}
.dq-ic:active{transform:scale(.92)}
.dq-ic svg{width:19px;height:19px;display:block;transition:fill .25s ease}
.dq-ic.on{border-color:currentColor}
.dq-ic.on svg{fill:currentColor}
.dq-ic .ck{display:none}
.dq-ic.ok .cp{display:none}
.dq-ic.ok .ck{display:block}
.dq-cnt{font-size:12px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;opacity:.85}
.dq-wa{position:absolute;right:0;top:0}
.dq-ic.pop svg{animation:dqPop .35s}
@keyframes dqPop{0%{transform:scale(.7)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
.dq-cta:focus,.dq-send:focus,.dq-ic:focus{outline:none}
.dq-cta:focus-visible,.dq-send:focus-visible,.dq-ic:focus-visible{outline:3px solid currentColor;outline-offset:3px}
@media (max-width:700px){
.dq{--bar:46px;--side:48px;--divh:26px}
.dq-grid{padding:0 4px}
.dq-mid{padding:0 4px}
.dq-cta{font-size:13px;gap:6px}
.dq-cta svg{width:18px;height:18px;flex-basis:18px}
.fl{width:20px;height:20px}
.dq-side{gap:0}
.dq-timer b{font-size:12px}
.dq-timer small{font-size:7px}
.dq-field.n{flex-basis:32%}
.dq-author{font-size:13px}
.dq-text,.dq-line{font-size:12px}
.dq-hl{font-size:12px}
.dq-hm{font-size:14px}
.dq-field input{font-size:13px}
.dq-act{gap:18px}
.dq-ic{width:36px;height:36px}
.dq-ic svg{width:17px;height:17px}
.dq-cnt{font-size:11px}
}
@media (max-width:420px){.dq{--bar:42px;--side:46px}.dq-cta{font-size:12px}}
`;

  var FL_OUT = "M12 2C12.8 6.2 18 8.6 18 15a6 6 0 0 1-12 0c0-2.6 1.1-4.4 2.5-5.8.2 1.8.9 2.9 2 3.4C10.2 9 10.4 5 12 2Z";
  var FL_IN = "M12 20.6a2.8 2.8 0 0 1-2.8-2.8c0-1.6 1.2-2.5 2.8-4.4 1.6 1.9 2.8 2.8 2.8 4.4A2.8 2.8 0 0 1 12 20.6Z";
  var WA_URL = "https://wa.me/" + SHARE_PHONE + "?text=" + encodeURIComponent(SHARE_TEXT);
  var SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var html = `
<div class="rise dq-grid">
 <div class="dq-side">
  <div class="dq-flame"><div class="fl" id="dqFl">
   <svg class="off" viewBox="0 0 24 24" aria-hidden="true"><path d="${FL_OUT}"/></svg>
   <svg class="on" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="dqg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3b1f"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient></defs><path d="${FL_OUT}" fill="url(#dqg)"/><path d="${FL_IN}" fill="#ffd23f"/></svg>
  </div><div class="dq-num"><b id="dqNum">0</b></div></div>
 </div>
 <i class="dq-div"></i>
 <div class="dq-mid">
  <div class="dq-cta" id="dqCta" role="button" tabindex="0">
   <svg id="dqIq" ${SV}><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.4a2.9 2.9 0 0 1 5.6.9c0 1.9-2.8 2.4-2.8 4"/><circle cx="12" cy="17.3" r=".5" fill="currentColor"/></svg>
   <svg id="dqIo" ${SV} style="display:none"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.4l2.7 2.7 5.3-5.6"/></svg>
   <span id="dqCtaT">Günün sualını oyna</span>
  </div>
  <div class="dq-body" id="dqBody">
   <div class="dq-author" id="dqAuthor"></div>
   <div class="dq-hl" id="dqHL">Paylama materialı</div>
   <div class="dq-hm" id="dqHM"></div>
   <div class="dq-text" id="dqText"></div>
   <div class="dq-form" id="dqForm">
    <div class="dq-field n" id="dqNF"><input id="dqName" maxlength="40" placeholder="Adınız" autocomplete="off" autocapitalize="words" enterkeyhint="next"></div>
    <div class="dq-field a" id="dqAF"><input id="dqAns" maxlength="300" placeholder="Cavabınız" autocomplete="off" enterkeyhint="send"></div>
    <button class="dq-send" id="dqSend" type="button" aria-label="Göndər"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 3.5 3.5 10.8l6.2 2.4 2.4 6.3z"/><path d="M9.7 13.2 20.5 3.5"/></svg></button>
   </div>
   <div class="dq-res" id="dqRes"><div id="dqResIn"></div>
    <div class="dq-act">
     <div class="dq-ab"><button class="dq-ic like" id="dqLike" type="button" aria-label="Bəyən" aria-pressed="false"><svg ${SV}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button><span class="dq-cnt" id="dqLikeN">0</span></div>
     <div class="dq-ab"><button class="dq-ic" id="dqCopy" type="button" aria-label="Kopyala"><svg class="cp" ${SV}><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="ck" ${SV}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button><span class="dq-cnt" style="visibility:hidden">0</span></div>
     <div class="dq-ab"><button class="dq-ic" id="dqDis" type="button" aria-label="Bəyənmə" aria-pressed="false"><svg ${SV}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg></button><span class="dq-cnt" id="dqDisN">0</span></div>
     <a class="dq-ic dq-wa" href="${WA_URL}" target="_blank" rel="noopener noreferrer" aria-label="Sual göndər"><svg ${SV}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></a>
    </div>
   </div>
  </div>
 </div>
 <i class="dq-div"></i>
 <div class="dq-side">
  <div class="dq-timer"><small>Qalan vaxt</small><b id="dqTime">--:--</b></div>
 </div>
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
    nameIn = $("dqName"), ansIn = $("dqAns"), nameF = $("dqNF"), ansF = $("dqAF"), mid = root.querySelector(".dq-mid"),
    likeB = $("dqLike"), disB = $("dqDis"), likeN = $("dqLikeN"), disN = $("dqDisN");
  var S = null, open = false, review = false, busy = false, locked = false, held = false, ver = 0, lastTry = 0, vtimer = 0;

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var A = function (el, kf, ms, o) {
    var a = el.animate(kf, Object.assign({ duration: ms, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }, o || {}));
    return a.finished.then(function () { Object.assign(el.style, kf[kf.length - 1]); a.cancel(); });
  };

  // ---- yaddaş: localStorage + cookie (biri bloklansa digəri işləyir)
  var store = {
    get: function (k) {
      try { var v = localStorage.getItem(k); if (v) return v; } catch (e) {}
      var m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)"));
      if (m) { try { return decodeURIComponent(m[1]); } catch (e) {} }
      return "";
    },
    set: function (k, v) {
      try { localStorage.setItem(k, v); } catch (e) {}
      try { document.cookie = k + "=" + encodeURIComponent(v) + ";max-age=31536000;path=/;SameSite=Lax"; } catch (e) {}
    },
    del: function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
      try { document.cookie = k + "=;max-age=0;path=/"; } catch (e) {}
    }
  };
  // DİQQƏT: bu açar adlarını heç vaxt dəyişmə, yoxsa istifadəçilər tanınmaz.
  var UID_RE = /^[\w-]{8,64}$/, CK = "piksel-dq", PK = "piksel-dq-pend", VK = "piksel-dq-v", VPK = "piksel-dq-vp";

  // ---- istifadəçi kimliyi
  var uid = store.get("piksel-uid");
  if (!UID_RE.test(uid)) {
    uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  store.set("piksel-uid", uid);

  // ---- yerli vəziyyət (server cavabını gözləmədən dərhal göstərmək üçün)
  var D = { name: "", streak: 0, last: 0 }, skew = 0;
  try {
    var c = JSON.parse(store.get(CK));
    if (c && typeof c.last === "number") { D = { name: String(c.name || ""), streak: Number(c.streak) || 0, last: c.last }; skew = Number(c.skew) || 0; }
  } catch (e) {}
  function saveD() { store.set(CK, JSON.stringify({ name: D.name, streak: D.streak, last: D.last, skew: skew })); }
  function readPend() { try { var p = JSON.parse(store.get(PK)); return p && p.ans ? p : null; } catch (e) { return null; } }
  function hasPend() { return !!readPend(); }

  // ---- like / dislike yaddaşı: V = {sualId: {m: mənim səsim (1/-1/0), l: like sayı, d: dislike sayı}}, VP = serverə hələ getməyənlər
  function loadJ(k) { try { var o = JSON.parse(store.get(k)); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  var V = loadJ(VK), VP = loadJ(VPK);
  function saveV() { var ks = Object.keys(V); while (ks.length > 20) delete V[ks.shift()]; store.set(VK, JSON.stringify(V)); }
  function saveVP() { if (Object.keys(VP).length) store.set(VPK, JSON.stringify(VP)); else store.del(VPK); }
  function fmt(n) { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "K" : String(n); }
  function renderVotes() {
    if (!S) return;
    var v = V[S.id] || { m: 0, l: 0, d: 0 };
    likeN.textContent = fmt(v.l); disN.textContent = fmt(v.d);
    likeB.classList.toggle("on", v.m === 1); disB.classList.toggle("on", v.m === -1);
    likeB.setAttribute("aria-pressed", v.m === 1); disB.setAttribute("aria-pressed", v.m === -1);
  }
  function mergeVotes(d) {
    var vt = d && d.votes;
    if (!vt || !vt.q || VP[vt.q] !== undefined) return;       // göndərilməmiş öz səsim varsa, serverin köhnə rəqəmi üstünə yazmasın
    V[vt.q] = { m: Number(vt.mine) || 0, l: Number(vt.likes) || 0, d: Number(vt.dislikes) || 0 };
    saveV();
    if (S && S.id === vt.q) renderVotes();
  }
  function sendVote(q, v, tries) {
    fetch(API + "?action=vote&uid=" + encodeURIComponent(uid) + "&q=" + encodeURIComponent(q) + "&v=" + v + "&t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.error || Number(d.mine) !== v) throw new Error("yazılmadı");
        if (VP[q] !== v) return;                                 // arada yeni qərar verilib, onu ayrıca göndərəcək
        delete VP[q]; saveVP();
        var o = V[q] || (V[q] = { m: v, l: 0, d: 0 });
        o.m = v; o.l = Number(d.likes) || 0; o.d = Number(d.dislikes) || 0; saveV();
        if (S && S.id === q) renderVotes();
      })
      .catch(function () {
        if (tries < 8) setTimeout(function () { if (VP[q] === v) sendVote(q, v, tries + 1); }, Math.min(30000, 3000 * (tries + 1)));
      });
  }
  function flushVotes() { Object.keys(VP).forEach(function (q) { sendVote(q, VP[q], 0); }); }
  function castVote(x) {
    if (!S || !S.answered) return;
    var q = S.id, v = V[q] || (V[q] = { m: 0, l: 0, d: 0 }), nv = v.m === x ? 0 : x;   // eyni düyməyə yenidən basmaq səsi geri götürür
    if (v.m === 1) v.l = Math.max(0, v.l - 1);
    if (v.m === -1) v.d = Math.max(0, v.d - 1);
    if (nv === 1) v.l++;
    if (nv === -1) v.d++;
    v.m = nv; saveV(); renderVotes();
    if (nv) { var pb = x === 1 ? likeB : disB; pb.classList.remove("pop"); void pb.offsetWidth; pb.classList.add("pop"); setTimeout(function () { pb.classList.remove("pop"); }, 400); }
    VP[q] = nv; saveVP();
    clearTimeout(vtimer); vtimer = setTimeout(flushVotes, 500);
  }
  likeB.addEventListener("click", function () { castVote(1); });
  disB.addEventListener("click", function () { castVote(-1); });

  // ---- Azərbaycan dilində yiyəlik hal: Əli → Əlinin, Məmmədov → Məmmədovun
  function gen(n) {
    n = n.trim();
    var low = n.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase(), v = "aıoueəiöü", last = "", ends = false;
    for (var i = low.length - 1; i >= 0; i--) if (v.indexOf(low[i]) > -1) { last = low[i]; ends = i === low.length - 1; break; }
    var s = { a: "ı", "ı": "ı", e: "i", "ə": "i", i: "i", o: "u", u: "u", "ö": "ü", "ü": "ü" }[last] || "ı";
    return n + (ends ? "n" + s + "n" : s + "n");
  }
  function hid(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "h" + (h >>> 0).toString(36); }

  // ---- vəziyyət: sual yerli siyahıdan, ad/seriya/cavablama yerli yaddaşdan (server ilə arxa planda sinxron)
  var OFF = 4 * 36e5, DAY = 864e5, dnum = function (t) { return Math.floor((t + OFF) / DAY); };
  function build(d) {
    var today = dnum(d.now), n = QUESTIONS.length,
      idx = Math.max(0, today - Date.parse(START + "T00:00:00Z") / DAY) % n, q = QUESTIONS[idx],
      lit = d.streak > 0 && (d.last === today || d.last === today - 1), done = d.last === today;
    return { now: d.now, next: (today + 1) * DAY - OFF, qn: idx + 1, id: String(q.id || hid(q.question || "")), author: q.author, authorGen: q.authorGen || "",
      question: q.question, handout: q.handout || "", name: d.name || "", streak: lit ? d.streak : 0, lit: lit, answered: done, reveal: done ? q : null };
  }
  function cur() { return build({ now: Date.now() + skew, name: D.name, streak: D.streak, last: D.last }); }

  function fetchState() {
    return fetch(API + "?action=state&uid=" + encodeURIComponent(uid) + "&q=" + encodeURIComponent(S.id) + "&t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.error || typeof d.now !== "number") throw new Error("server: " + ((d && d.error) || "naməlum cavab"));
        return d;
      });
  }
  function apply(d) {
    mergeVotes(d);
    var nd = { name: String(d.name || ""), streak: Number(d.streak) || 0, last: Number(d.last) || 0 };
    if (hasPend() && nd.last < D.last) return;          // göndərilməmiş cavab var: köhnə server vəziyyəti üstünə yazmasın
    D = nd; skew = d.now - Date.now(); saveD();
    if (open || busy) { held = true; return; }
    S = cur(); render();
  }
  function refresh(n) {
    var v = ver;
    return fetchState().then(function (d) { if (v === ver) apply(d); }).catch(function (e) {
      if (n > 0) setTimeout(function () { refresh(n - 1); }, 3000);
      else if (DBG) { console.error(e); ctaT.textContent = "Xəta: " + (e && e.message); }
    });
  }

  function render() {
    numEl.textContent = S.streak;
    fl.classList.toggle("lit", !!S.lit);
    ctaT.textContent = S.answered ? "Günün sualını oynadınız." : "Günün sualını oyna";
    $("dqIq").style.display = S.answered ? "none" : "";
    $("dqIo").style.display = S.answered ? "" : "none";
    tick();
  }
  function tick() {
    if (!S) return;
    var rem = S.next - (Date.now() + skew);
    if (rem <= 0) {
      if (!open && !busy) {
        S = cur(); render();                              // yeni gün: dərhal yerli hesabla
        if (Date.now() - lastTry > 15000 && !hasPend()) { lastTry = Date.now(); refresh(1); }
      }
      return;
    }
    var h = Math.floor(rem / 36e5), m = Math.floor((rem % 36e5) / 6e4);
    timeEl.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  setInterval(tick, 1000);

  // ---- cavabı serverə göndər (uğursuz olsa təkrar cəhd edir, səhifə bağlansa belə növbəti açılışda davam edir)
  function send(p, tries) {
    fetch(API + "?action=answer&uid=" + encodeURIComponent(uid) + "&name=" + encodeURIComponent(p.name) + "&answer=" + encodeURIComponent(p.ans) + "&qn=" + p.qn + "&t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.error === "invalid") { store.del(PK); return; }
        if (!d || d.error || !build(d).answered) throw new Error("yazılmadı");
        store.del(PK);
        D = { name: String(d.name || ""), streak: Number(d.streak) || 0, last: Number(d.last) || 0 };
        skew = d.now - Date.now(); saveD();
        var nd = build(d);
        if (S && S.answered) {
          S.streak = nd.streak; S.lit = nd.lit; S.name = nd.name;
          if (!busy && !open) render();
          else if (!busy && numEl.textContent !== String(nd.streak)) numEl.textContent = nd.streak;
        }
      })
      .catch(function () {
        if (tries < 8) setTimeout(function () { send(p, tries + 1); }, Math.min(30000, 3000 * (tries + 1)));
      });
  }

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
    renderVotes();
  }
  function title() {
    var a = (S.author || "").trim();
    if (!a) return "Günün sualı";
    var g = (S.authorGen || "").trim();
    return (!g ? gen(a) : g.length <= 4 ? a + g : g) + " sualı";   // boş → avtomatik; qısa → şəkilçi; uzun → tam forma
  }
  function copyText() {
    var r = S.reveal || {}, t = title() + "\n" + (S.handout ? "Paylama materialı: " + S.handout + "\n" : "") + S.question + "\n";
    if (r.answer) t += "\nCavab: " + r.answer;
    if (r.criteria) t += "\nSayılma Meyarı: " + r.criteria;
    if (r.comment) t += "\nŞərh: " + r.comment;
    if (r.source) t += "\nMənbə: " + r.source;
    return t + "\n\nπksel — peaksel.az";
  }
  $("dqCopy").addEventListener("click", function () {
    var t = copyText(), btn = this;
    var done = function () { btn.classList.add("ok"); setTimeout(function () { btn.classList.remove("ok"); }, 1600); };
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
  window.addEventListener("resize", function () { if (open && !busy) fit(); });

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
    $("dqHL").style.display = S.handout ? "block" : "none";
    $("dqHM").style.display = S.handout ? "block" : "none";
    $("dqHM").textContent = S.handout || "";
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
      if (S.name || !nameIn.value) nameIn.value = S.name || "";
      nameIn.readOnly = locked;
      nameF.classList.toggle("locked", locked);
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

  async function closeDQ() {                      // bağlanma həmişə 0,3 saniyə (toxunma, sürüşdürmə, Esc)
    if (!open || busy) return;
    busy = true; disarm();
    root.classList.add("closing");
    root.classList.remove("open");
    root.style.height = barPx() + "px";
    A(body, [{ opacity: 1 }, { opacity: 0 }], 140);
    await sleep(150);
    body.style.display = "none";
    root.classList.remove("rv");
    open = false;
    if (held) { held = false; S = cur(); }
    render();
    cta.style.opacity = 0;
    cta.classList.remove("gone");
    A(cta, [{ opacity: 0 }, { opacity: 1 }], 150);
    await sleep(150);
    root.style.height = "";
    root.classList.remove("closing");
    busy = false;
  }

  // ---- açıq çərçivənin yuxarı hissəsinə (müəllif + sual) toxunanda da bağlansın
  root.addEventListener("click", function (e) {
    if (!open || busy) return;
    if (e.target.closest && e.target.closest("a,button,input")) return;
    if (e.clientY <= $("dqText").getBoundingClientRect().bottom + 8) closeDQ();
  });

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

  // ---- göndər (gözləmədən: nəticə dərhal göstərilir, server arxa planda yazılır)
  function bad(el) { el.classList.remove("bad"); void el.offsetWidth; el.classList.add("bad"); setTimeout(function () { el.classList.remove("bad"); }, 700); }
  async function submit() {
    if (busy || !open || review) return;
    var name = nameIn.value.trim().replace(/\s+/g, " "), ans = ansIn.value.trim();
    var okN = name.replace(/[^A-Za-z\u00C0-\u024F\u0400-\u04FF]/g, "").length >= 3, okA = ans.length > 0;
    if (!okN || !okA) { if (!okN) bad(nameF); if (!okA) bad(ansF); return; }
    busy = true; ver++;
    ansIn.blur(); nameIn.blur();
    form.style.pointerEvents = "none";

    var today = dnum(Date.now() + skew), newStreak = S.lit ? S.streak + 1 : 1, p = { name: name, ans: ans, qn: S.qn };
    D = { name: name, streak: newStreak, last: today }; saveD();
    store.set(PK, JSON.stringify(p));
    send(p, 0);

    await A(form, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }], 220);
    S = cur();
    ansIn.value = "";
    form.style.display = "none";
    buildRes();
    res.style.display = "block"; res.style.transform = "translateY(130%)";
    ignite(S.streak);
    fit();                        // çərçivə genişlənir, nəticə dərhal aşağıdan yuxarı gəlir (gözləmə yoxdur)
    await A(res, [{ transform: "translateY(130%)" }, { transform: "translateY(0)" }], 550);
    busy = false;
    review = true;
    arm();
  }
  $("dqSend").addEventListener("click", submit);
  ansIn.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  nameIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ansIn.focus(); } });

  cta.addEventListener("click", openDQ);
  cta.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDQ(); } });

  // ---- start: dərhal göstər, serverlə arxa planda sinxronlaş
  if (DBG) console.log("dq.js yükləndi");
  if (/XXXX/.test(API) || !QUESTIONS.length) {
    if (DBG) ctaT.textContent = "Xəta: API və ya suallar boşdur"; else root.remove();
  } else {
    S = cur();
    render();
    var pend = readPend();
    if (pend) send(pend, 0); else refresh(3);
    flushVotes();
  }
})();
