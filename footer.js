
(function () {
  "use strict";

  var css = `
body{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  min-height:100dvh
}

footer.pk-footer{
  position:relative;
  width:calc(100% - 32px);
  max-width:1180px;
  margin:30px auto 16px;
  padding:28px 32px 22px;
  border-radius:30px;
  background:var(--c1);
  color:var(--fg);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  gap:18px;
  font-family:Montserrat,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
  isolation:isolate
}

footer.pk-footer::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  opacity:0;
  background:radial-gradient(
    ellipse 260px 180px at var(--mx,50%) var(--my,50%),
    rgba(255,255,255,.16),
    transparent 75%
  );
  transition:opacity .35s ease
}

@media(hover:hover){
  footer.pk-footer:hover::before{opacity:1}
}

footer.pk-footer>*{
  position:relative;
  z-index:1
}

footer.pk-footer a{
  color:inherit;
  text-decoration:none;
  -webkit-tap-highlight-color:transparent
}

/* Üst hissə */
.pk-footer-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px
}

.pk-footer-brand{
  font-size:21px;
  font-weight:700;
  letter-spacing:-.6px;
  line-height:1.3
}

.pk-footer-subtitle{
  margin-top:5px;
  font-size:13px;
  line-height:1.5;
  font-weight:500;
  opacity:.72
}

/* Sosial şəbəkələr */
.pk-footer-social{
  display:flex;
  align-items:center;
  gap:9px
}

.pk-footer-social a{
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:rgba(255,255,255,.14);
  transition:transform .25s ease,background .25s ease,opacity .25s ease
}

.pk-footer-social a svg{
  width:21px;
  height:21px;
  display:block
}

.pk-footer-social a:hover{
  transform:translateY(-3px);
  background:rgba(255,255,255,.24)
}

.pk-footer-social a:active{
  transform:scale(.9)
}

/* Xətt */
.pk-footer-line{
  width:100%;
  height:1px;
  background:currentColor;
  opacity:.17
}

/* Linklər */
.pk-footer-links{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:22px;
  flex-wrap:wrap
}

.pk-footer-link{
  font-size:13px;
  font-weight:600;
  line-height:1.5;
  transition:opacity .25s ease,transform .25s ease
}

.pk-footer-link:hover{
  opacity:.65;
  transform:translateY(-1px)
}

.pk-footer-link:active,
.pk-footer-link.go{
  transform:scale(.96);
  opacity:.6
}

/* Aşağı hissə */
.pk-footer-bottom{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px
}

.pk-footer-copy{
  font-size:12px;
  line-height:1.5;
  font-weight:500;
  opacity:.72
}

.pk-footer-author{
  font-size:12px;
  line-height:1.5;
  font-weight:600;
  transition:opacity .25s ease
}

.pk-footer-author:hover{opacity:.65}

.pk-footer-note{
  font-size:11px;
  font-weight:500;
  line-height:1.5;
  text-align:center;
  opacity:.48
}

.pk-footer a:focus-visible{
  outline:2px solid currentColor;
  outline-offset:4px;
  border-radius:6px
}

/* Telefon */
@media(max-width:700px){
  footer.pk-footer{
    width:calc(100% - 24px);
    margin:20px auto 12px;
    padding:20px 18px 17px;
    border-radius:24px;
    gap:14px
  }

  .pk-footer-top{
    flex-direction:column;
    text-align:center;
    gap:12px
  }

  .pk-footer-brand{
    font-size:17px
  }

  .pk-footer-subtitle{
    font-size:11px;
    margin-top:3px
  }

  .pk-footer-social{gap:8px}

  .pk-footer-social a{
    width:36px;
    height:36px
  }

  .pk-footer-social a svg{
    width:18px;
    height:18px
  }

  .pk-footer-links{gap:16px}

  .pk-footer-link{font-size:11px}

  .pk-footer-bottom{
    flex-direction:column;
    text-align:center;
    gap:4px
  }

  .pk-footer-copy,
  .pk-footer-author{font-size:10px}

  .pk-footer-note{font-size:9px}
}

@media(max-width:360px){
  footer.pk-footer{
    padding:18px 14px 15px;
    gap:12px
  }

  .pk-footer-brand{font-size:15px}
  .pk-footer-links{gap:12px}
  .pk-footer-link{font-size:10px}
}
`;

  var html = `
  <div class="pk-footer-top">
    <div class="pk-footer-heading">
      <div class="pk-footer-brand">Unikal İntellektual Oyunlar Platforması</div>
      <div class="pk-footer-subtitle">İntellektuallar üçün hər şey πksel-də</div>
    </div>

    <div class="pk-footer-social">
      <a href="https://www.instagram.com/peaksel.az/"
         target="_blank" rel="noopener noreferrer"
         aria-label="Instagram">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5.2"/>
          <circle cx="12" cy="12" r="4.2"/>
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>
        </svg>
      </a>

      <a href="https://www.facebook.com/profile.php?id=61595695732155"
         target="_blank" rel="noopener noreferrer"
         aria-label="Facebook">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 4.5h-2A3.5 3.5 0 0 0 10 8v2H8v3h2v7h3v-7h2.5l.5-3h-3V8.5c0-.8.4-1 1-1h1.5z"/>
        </svg>
      </a>

      <a href="https://chat.whatsapp.com/CggG0l29Hnu3oeMqI0pVSh"
         target="_blank" rel="noopener noreferrer"
         aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.2 20.8l1.5-4.6A8.7 8.7 0 1 1 8 19.5z"/>
          <path d="M9.2 8.2c-.4.5-.5 1.3 0 2.3.9 1.9 2.4 3.4 4.3 4.3 1 .5 1.8.4 2.3 0l.5-.8c.1-.2.1-.4-.1-.5l-1.4-.8c-.2-.1-.4-.1-.5.1l-.5.6c-.9-.4-1.7-1.1-2.1-2l.6-.5c.2-.1.2-.3.1-.5l-.8-1.4c-.1-.2-.3-.2-.5-.1z"
                fill="currentColor" stroke="none"/>
        </svg>
      </a>
    </div>
  </div>

  <div class="pk-footer-line"></div>

  <div class="pk-footer-links">
    <a class="pk-footer-link" href="/mexfilik_ve_istifade_sertleri">
      Məxfilik Siyasəti
    </a>

    <a class="pk-footer-link" href="/mexfilik_ve_istifade_sertleri">
      İstifadə Şərtləri
    </a>
  </div>

  <div class="pk-footer-line"></div>

  <div class="pk-footer-bottom">
    <div class="pk-footer-copy">©2026 πksel İntellektual Oyunlar Klubu</div>

    <a class="pk-footer-author"
       href="https://www.instagram.com/onurelzh"
       target="_blank" rel="noopener noreferrer">
      ©Onur Əlizadə
    </a>
  </div>

  <div class="pk-footer-note">
    Bu saytda layihələndirilmiş unikal funksiyaların hər biri müəllif hüquqları ilə qorunur.
  </div>
  `;

  function build() {
    document.querySelectorAll("footer").forEach(function (f) {
      f.remove();
    });

    if (!document.getElementById("pk-footer-css")) {
      var st = document.createElement("style");
      st.id = "pk-footer-css";
      st.textContent = css;
      document.head.appendChild(st);
    }

    var ft = document.createElement("footer");
    ft.className = "pk-footer";
    ft.innerHTML = html;
    document.body.appendChild(ft);

    ft.addEventListener("pointermove", function (e) {
      var r = ft.getBoundingClientRect();
      ft.style.setProperty("--mx", (e.clientX - r.left) + "px");
      ft.style.setProperty("--my", (e.clientY - r.top) + "px");
    });

    ft.querySelectorAll(".pk-footer-links a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        a.classList.add("go");
        setTimeout(function () {
          location.href = a.href;
        }, 220);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
