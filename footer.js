
(function () {
  "use strict";

  var css = `
body{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  min-height:100dvh;
}

footer.pk-footer{
  position:relative;
  width:100%;
  max-width:none;
  margin:30px 0 0;
  padding:42px 24px 125px;
  border-radius:0;
  background:var(--c1);
  color:var(--fg);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:24px;
  font-family:Montserrat,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
  isolation:isolate;
}

footer.pk-footer::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  opacity:0;
  background:radial-gradient(
    ellipse 300px 200px at var(--mx,50%) var(--my,50%),
    rgba(255,255,255,.13),
    transparent 75%
  );
  transition:opacity .35s ease;
}

@media(hover:hover){
  footer.pk-footer:hover::before{opacity:1}
}

footer.pk-footer>*{
  position:relative;
  z-index:1;
}

footer.pk-footer a{
  color:inherit;
  text-decoration:none;
  -webkit-tap-highlight-color:transparent;
}

/* BRAND */
.pk-footer-brand{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap:7px;
}

.pk-footer-brand-name{
  font-size:24px;
  font-weight:800;
  letter-spacing:-.8px;
  line-height:1.3;
}

.pk-footer-subtitle{
  font-size:13px;
  font-weight:500;
  opacity:.7;
  line-height:1.5;
}

/* SOCIAL ICONS */
.pk-footer-social{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:14px;
}

.pk-footer-social a{
  width:44px;
  height:44px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:rgba(255,255,255,.13);
  transition:transform .25s ease,background .25s ease;
}

.pk-footer-social a svg{
  width:21px;
  height:21px;
  display:block;
}

.pk-footer-social a:hover{
  transform:translateY(-3px);
  background:rgba(255,255,255,.25);
}

.pk-footer-social a:active{
  transform:scale(.92);
}

/* DIVIDER */
.pk-footer-line{
  width:min(100%,1180px);
  height:1px;
  background:currentColor;
  opacity:.15;
}

/* LINKS */
.pk-footer-links{
  display:flex;
  justify-content:center;
  align-items:center;
  flex-wrap:wrap;
  gap:26px;
}

.pk-footer-link{
  font-size:13px;
  font-weight:600;
  line-height:1.5;
  transition:opacity .2s ease,transform .2s ease;
}

.pk-footer-link:hover{
  opacity:.65;
  transform:translateY(-1px);
}

.pk-footer-link:active,
.pk-footer-link.go{
  transform:scale(.96);
  opacity:.6;
}

/* BOTTOM */
.pk-footer-bottom{
  width:min(100%,1180px);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}

.pk-footer-copy{
  font-size:12px;
  font-weight:500;
  line-height:1.5;
  opacity:.7;
}

.pk-footer-author{
  font-size:12px;
  font-weight:600;
  line-height:1.5;
  transition:opacity .2s ease;
}

.pk-footer-author:hover{
  opacity:.65;
}

.pk-footer-note{
  font-size:11px;
  font-weight:500;
  line-height:1.5;
  text-align:center;
  opacity:.45;
}

.pk-footer a:focus-visible{
  outline:2px solid currentColor;
  outline-offset:4px;
  border-radius:6px;
}

/* MOBILE */
@media(max-width:700px){
  footer.pk-footer{
    margin:20px 0 0;
    padding:30px 18px 120px;
    gap:20px;
  }

  .pk-footer-brand-name{
    font-size:21px;
  }

  .pk-footer-subtitle{
    font-size:11px;
  }

  .pk-footer-social{
    gap:12px;
  }

  .pk-footer-social a{
    width:40px;
    height:40px;
  }

  .pk-footer-social a svg{
    width:19px;
    height:19px;
  }

  .pk-footer-links{
    gap:18px;
  }

  .pk-footer-link{
    font-size:11px;
  }

  .pk-footer-bottom{
    flex-direction:column;
    text-align:center;
    gap:5px;
  }

  .pk-footer-copy,
  .pk-footer-author{
    font-size:10px;
  }

  .pk-footer-note{
    font-size:9px;
  }
}

@media(max-width:360px){
  footer.pk-footer{
    padding-left:14px;
    padding-right:14px;
    gap:18px;
  }

  .pk-footer-brand-name{
    font-size:19px;
  }

  .pk-footer-links{
    gap:13px;
  }
}
`;

  var html = `
    <div class="pk-footer-brand">
      <div class="pk-footer-brand-name">πksel</div>
      <div class="pk-footer-subtitle">İntellektual Oyunlar Platforması</div>
    </div>

    <div class="pk-footer-social">
      <a href="https://instagram.com/peaksel.az" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>
        </svg>
      </a>

      <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.2 1.6-4.2 4.5V10H7.5v3h2.5v8h3.5z"/>
        </svg>
      </a>

      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 3.5A11.7 11.7 0 0 0 2.2 17.6L.8 23l5.6-1.4A11.7 11.7 0 0 0 22 11.7a11.6 11.6 0 0 0-1.5-8.2zM12 20.1a8.3 8.3 0 0 1-4.2-1.1l-.3-.2-3.3.8.9-3.2-.2-.3A8.3 8.3 0 1 1 12 20.1zm4.6-6.2c-.3-.2-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.2s-.7.9-.9 1.1c-.1.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.3 1 2.5c.1.2 1.8 2.7 4.3 3.7.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.5-.3z"/>
        </svg>
      </a>
    </div>

    <div class="pk-footer-line"></div>

    <div class="pk-footer-links">
      <a class="pk-footer-link" href="/privacy">Məxfilik siyasəti</a>
      <a class="pk-footer-link" href="/terms">İstifadə şərtləri</a>
    </div>

    <div class="pk-footer-line"></div>

    <div class="pk-footer-bottom">
      <div class="pk-footer-copy">© πksel — Bütün hüquqlar qorunur</div>
      <a class="pk-footer-author" href="https://instagram.com/onurelzh" target="_blank" rel="noopener noreferrer">
        Müəllif: Onur Əlizadə
      </a>
    </div>

    <div class="pk-footer-note">
      İntellektual oyunlar sevənlər üçün yaradılıb.
    </div>
  `;

  function build() {
    document.querySelectorAll("footer").forEach(function(f) {
      f.remove();
    });

    if (!document.getElementById("pk-footer-css")) {
      var style = document.createElement("style");
      style.id = "pk-footer-css";
      style.textContent = css;
      document.head.appendChild(style);
    }

    var ft = document.createElement("footer");
    ft.className = "pk-footer";
    ft.innerHTML = html;
    document.body.appendChild(ft);

    ft.addEventListener("pointermove", function(e) {
      var rect = ft.getBoundingClientRect();
      ft.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      ft.style.setProperty("--my", (e.clientY - rect.top) + "px");
    });

    ft.querySelectorAll(".pk-footer-links a").forEach(function(a) {
      a.addEventListener("click", function(e) {
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) !== "/") return;
        e.preventDefault();
        a.classList.add("go");
        setTimeout(function() {
          window.location.href = href;
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
