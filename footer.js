
(function () {
  "use strict";

  /* Kart açıqlamalarının ölçüləri: kompüter/planşet 15px,
     telefon 9px, dar telefon (≤420px) 8px. */
  var css = `
body{display:flex;flex-direction:column;min-height:100vh;min-height:100dvh}
footer.pk-footer{
  --fc1:#001E6F;--fc2:#002E92;--ffg:#9DC3FF;--fglow:rgba(0,8,45,.30);
  position:relative;overflow:hidden;flex-shrink:0;margin:auto 0 0;width:100%;min-height:0;
  background:linear-gradient(135deg,var(--fc1) 0%,var(--fc2) 50%,var(--fc1) 100%);color:var(--ffg);
  padding:10px 14px calc(8px + env(safe-area-inset-bottom,0px));
  display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:5px;text-align:center;
  font-family:"Poppins",sans-serif;-webkit-font-smoothing:antialiased}
footer.pk-footer.pk-dark{--fc1:#9DC3FF;--fc2:#6FA5FC;--ffg:#00072C;--fglow:rgba(255,255,255,.40)}
footer.pk-footer::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;transition:opacity .4s ease;
  background:
    radial-gradient(ellipse 170px 120px at var(--mx,50%) var(--my,50%),var(--fglow),transparent 72%),
    radial-gradient(ellipse 100px 150px at calc(var(--mx,50%) + 16px) calc(var(--my,50%) - 12px),var(--fglow),transparent 72%)}
@media (hover:hover){footer.pk-footer:hover::before{opacity:1}}
footer.pk-footer>*{position:relative;z-index:1}
footer.pk-footer a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
.pk-title{font-size:18px;font-weight:700;letter-spacing:-.2px;line-height:1.45}
.pk-social{display:flex;align-items:center;justify-content:center;gap:12px}
.pk-social a{width:30px;height:30px;display:grid;place-items:center;transition:transform .2s ease,opacity .25s ease}
.pk-social a:hover{opacity:.75}
.pk-social a:active{transform:scale(.88)}
.pk-social svg{width:100%;height:100%;display:block}
.pk-legal{display:flex;align-items:center;justify-content:center;gap:16px}
.pk-link{font-size:15px;font-weight:500;line-height:1.45;white-space:nowrap;transition:transform .25s ease,opacity .25s ease}
.pk-link:hover{opacity:.72}
.pk-link:active,.pk-link.go{transform:scale(.94);opacity:.6}
.pk-line{width:100%;height:1px;border-radius:1px;background:currentColor;opacity:.2}
.pk-text{font-size:15px;font-weight:500;line-height:1.45}
.pk-note{font-size:15px;font-weight:700;line-height:1.45;opacity:.6}
@media (max-width:700px){
  footer.pk-footer{min-height:0;padding:10px 14px calc(8px + env(safe-area-inset-bottom,0px));gap:5px}
  .pk-social a{width:22px;height:22px}
  .pk-title{font-size:12px}
  .pk-link,.pk-text,.pk-note{font-size:9px}
  .pk-legal{gap:12px}
}
@media (max-width:420px){
  .pk-title{font-size:11px}
  .pk-link,.pk-text,.pk-note{font-size:8px}
}`;

  /* ---------- HTML ---------- */
  var html = `
<div class="pk-title">Unikal İntellektual Oyunlar Platforması</div>

<div class="pk-social">
  <a href="https://www.instagram.com/peaksel.az/?action=follow" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>
  </a>
  <a href="https://www.facebook.com/peaksel.az/" target="_blank" rel="noopener noreferrer" aria-label="Facebook-da Peaksel.az səhifəsini izlə">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 4.5h-2A3.5 3.5 0 0 0 10 8v2H8v3h2v7h3v-7h2.5l.5-3h-3V8.5c0-.8.4-1 1-1h1.5z"/></svg>
  </a>
  <a href="https://chat.whatsapp.com/CggG0l29Hnu3oeMqI0pVSh" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 20.8l1.5-4.6A8.7 8.7 0 1 1 8 19.5z"/><path d="M9.2 8.2c-.4.5-.5 1.3 0 2.3.9 1.9 2.4 3.4 4.3 4.3 1 .5 1.8.4 2.3 0l.5-.8c.1-.2.1-.4-.1-.5l-1.4-.8c-.2-.1-.4-.1-.5.1l-.5.6c-.9-.4-1.7-1.1-2.1-2l.6-.5c.2-.1.2-.3.1-.5l-.8-1.4c-.1-.2-.3-.2-.5-.1z" fill="currentColor" stroke="none"/></svg>
  </a>
</div>

<div class="pk-legal">
  <a class="pk-link" href="/mexfilik_ve_istifade_sertleri">Məxfilik Siyasəti</a>
  <a class="pk-link" href="/mexfilik_ve_istifade_sertleri">İstifadə Şərtləri</a>
</div>

<div class="pk-line"></div>
<div class="pk-text">©2026 πksel İntellektual Oyunlar Klubu</div>
<a class="pk-text pk-link" href="https://www.instagram.com/onurelzh" target="_blank" rel="noopener noreferrer">©Onur Əlizadə</a>

<div class="pk-line"></div>
<div class="pk-note">Bu saytda layihələndirilmiş unikal funksiyaların hər biri Müəllif hüquqları ilə qorunur.</div>`;

  /* ---------- Rejim (gündüz/gecə) ---------- */
  function isDark() {
    if (document.body && document.body.classList.contains("dark")) return true;
    try { return localStorage.getItem("piksel-theme") === "dark"; } catch (e) { return false; }
  }

  function syncTheme() {
    var d = isDark();
    document.querySelectorAll("footer.pk-footer").forEach(function (f) {
      f.classList.toggle("pk-dark", d);
    });
  }

  function build() {
    /* köhnə footer-ləri sil */
    document.querySelectorAll("footer").forEach(function (f) { f.remove(); });

    /* CSS (bir dəfə) */
    if (!document.getElementById("pk-footer-css")) {
      var st = document.createElement("style");
      st.id = "pk-footer-css";
      st.textContent = css;
      document.head.appendChild(st);
    }

    /* yeni footer — həmişə body-nin ən sonunda */
    var ft = document.createElement("footer");
    ft.className = "pk-footer";
    ft.innerHTML = html;
    document.body.appendChild(ft);

    /* rejimə uyğun rəng: indi və hər dəyişəndə */
    syncTheme();
    new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", syncTheme);

    /* maus işığı */
    ft.addEventListener("pointermove", function (e) {
      var r = ft.getBoundingClientRect();
      ft.style.setProperty("--mx", (e.clientX - r.left) + "px");
      ft.style.setProperty("--my", (e.clientY - r.top) + "px");
    });

    /* Məxfilik / İstifadə Şərtləri: kiçik animasiya ilə keçid */
    ft.querySelectorAll(".pk-legal a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        a.classList.add("go");
        setTimeout(function () { location.href = a.href; }, 250);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
