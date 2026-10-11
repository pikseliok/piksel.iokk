(function () {
  "use strict";
  var KEY = "piksel-ribbon-done";
  var root = document.documentElement;
  var force = /[?&]ribbon=1/.test(location.search);
  var done = false;
  try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (done && !force) return;

  /* Lent kəsilənə qədər blur + təsdiq paneli gizli qalır */
  root.classList.add("pk-hold");
  function release() { root.classList.remove("pk-hold"); }

  var css = document.createElement("style");
  css.textContent =
    "html.pk-hold .consent-overlay,html.pk-hold .consent-bar{display:none!important}" +
    ".pk-layer{position:fixed;inset:0;z-index:10000;overflow:hidden;touch-action:none}" +
    ".pk-ribbon,.pk-piece{position:fixed;left:0;height:48px;top:38vh;" +
    "background:linear-gradient(180deg,#ef4444 0%,#c81e1e 50%,#a51212 100%);" +
    "box-shadow:0 6px 16px rgba(0,0,0,.28),inset 0 2px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.2)}" +
    ".pk-ribbon{width:100%}" +
    ".pk-ribbon::after,.pk-piece::after{content:'';position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:rgba(255,215,130,.55)}" +
    ".pk-scissors{position:fixed;width:72px;height:108px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}" +
    ".pk-scissors:active{cursor:grabbing}" +
    ".pk-bA,.pk-bB{transform-origin:32px 50px}" +
    ".pk-bA{animation:pkA 1.1s ease-in-out infinite}" +
    ".pk-bB{animation:pkB 1.1s ease-in-out infinite}" +
    ".pk-snip .pk-bA{animation:none;transform:rotate(-1deg);transition:transform .12s}" +
    ".pk-snip .pk-bB{animation:none;transform:rotate(1deg);transition:transform .12s}" +
    "@keyframes pkA{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(-1deg)}}" +
    "@keyframes pkB{0%,100%{transform:rotate(16deg)}50%{transform:rotate(1deg)}}" +
    ".pk-hint{position:fixed;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:30px;background:rgba(0,10,50,.75);color:#fff;font:500 13px Poppins,sans-serif;white-space:nowrap;transition:opacity .3s;pointer-events:none}" +
    "@media (max-width:700px){.pk-ribbon{height:40px}}";
  document.head.appendChild(css);

  var SVG =
    '<svg viewBox="0 0 64 96" width="100%" height="100%">' +
    '<g class="pk-bA"><polygon points="28,52 32,3 36,52" fill="#eef1f6" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<line x1="32" y1="50" x2="36" y2="76" stroke="#374151" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="38" cy="85" r="8" fill="none" stroke="#b91c1c" stroke-width="5"/></g>' +
    '<g class="pk-bB"><polygon points="28,52 32,3 36,52" fill="#eef1f6" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<line x1="32" y1="50" x2="28" y2="76" stroke="#374151" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="26" cy="85" r="8" fill="none" stroke="#b91c1c" stroke-width="5"/></g>' +
    '<circle cx="32" cy="50" r="3.5" fill="#374151"/></svg>';

  function div(c) { var d = document.createElement("div"); d.className = c; return d; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function build() {
    var layer = div("pk-layer");
    var ribbon = div("pk-ribbon");
    var sc = div("pk-scissors");
    var hint = div("pk-hint");
    sc.innerHTML = SVG;
    hint.textContent = "Qayçını tutub lentin üstünə apar";
    layer.appendChild(ribbon); layer.appendChild(sc); layer.appendChild(hint);
    document.body.appendChild(layer);

    var rr = ribbon.getBoundingClientRect();
    var W = sc.offsetWidth, H = sc.offsetHeight;
    var x = (innerWidth - W) / 2;
    var y = Math.min(rr.bottom + 90, innerHeight - H - 40);
    var dx = 0, dy = 0, drag = false, cutting = false;

    function place() { sc.style.left = x + "px"; sc.style.top = y + "px"; }
    place();
    hint.style.top = (y + H + 10) + "px";

    sc.addEventListener("pointerdown", function (e) {
      if (cutting) return;
      drag = true; dx = e.clientX - x; dy = e.clientY - y;
      try { sc.setPointerCapture(e.pointerId); } catch (err) {}
      hint.style.opacity = 0;
      e.preventDefault();
    });
    sc.addEventListener("pointermove", function (e) {
      if (!drag || cutting) return;
      x = clamp(e.clientX - dx, 0, innerWidth - W);
      y = clamp(e.clientY - dy, 0, innerHeight - H);
      place();
      var r = ribbon.getBoundingClientRect();
      if (y + 4 <= r.bottom - 6) cut(x + W / 2, r);
    });
    function stop() { drag = false; }
    sc.addEventListener("pointerup", stop);
    sc.addEventListener("pointercancel", stop);

    function cut(cx, r) {
      cutting = true; drag = false;
      x = cx - W / 2; y = r.top + r.height / 2 - 4; place();
      sc.classList.add("pk-snip");

      setTimeout(function () {
        ribbon.style.display = "none";
        function piece(left, width, origin) {
          var p = div("pk-piece");
          p.style.cssText = "left:" + left + "px;top:" + r.top + "px;width:" + width + "px;height:" + r.height + "px;transform-origin:" + origin;
          layer.appendChild(p);
          return p;
        }
        var L = piece(0, cx, "0 50%");
        var R = piece(cx, innerWidth - cx, "100% 50%");
        var drop = innerHeight * 1.4;
        function fall(p, sign) {
          p.animate([
            { transform: "translateY(0) rotate(0deg)", easing: "cubic-bezier(.3,0,.6,1)" },
            { transform: "translateY(0) rotate(" + (sign * 60) + "deg)", offset: 0.45, easing: "ease-in" },
            { transform: "translateY(" + drop + "px) rotate(" + (sign * 100) + "deg)" }
          ], { duration: 1500, fill: "forwards" });
        }
        fall(L, 1); fall(R, -1);

        sc.style.transition = "transform 1s cubic-bezier(.5,0,.9,.6),opacity 1s";
        requestAnimationFrame(function () {
          sc.style.transform = "translateY(" + innerHeight + "px) rotate(25deg)";
          sc.style.opacity = 0;
        });

        try { localStorage.setItem(KEY, "1"); } catch (e) {}
        release(); /* blur və təsdiq paneli indi öz 2 saniyəsi ilə gəlir */
        setTimeout(function () { layer.remove(); }, 1700);
      }, 200);
    }
  }

  function start() { try { build(); } catch (e) { release(); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
