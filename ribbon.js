(function () {
  "use strict";
  var KEY = "piksel-ribbon-done";
  var root = document.documentElement;
  var force = /[?&]ribbon=1/.test(location.search);
  var done = false;
  try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (done && !force) return;

  root.classList.add("pk-hold");
  function release() { root.classList.remove("pk-hold"); }

  var css = document.createElement("style");
  css.textContent =
    "html.pk-hold .consent-overlay,html.pk-hold .consent-bar{display:none!important}" +
    ".pk-layer{position:fixed;inset:0;z-index:10000;overflow:hidden;touch-action:none}" +
    ".pk-ribbon{position:fixed;left:0;height:48px;top:38vh;width:100%;" +
    "background:linear-gradient(180deg,#f21b22 0%,#e60000 48%,#b90008 100%);" +
    "box-shadow:0 7px 18px rgba(0,0,0,.3),inset 0 -4px 5px rgba(100,0,0,.18)}" +
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
    ".pk-fabric{position:fixed;z-index:1;pointer-events:none;overflow:visible}" +
    "@media (max-width:700px){.pk-ribbon{height:40px}}";
  document.head.appendChild(css);

  var SVG = '<svg viewBox="0 0 64 96" width="100%" height="100%">' +
    '<g class="pk-bA"><polygon points="28,52 32,3 36,52" fill="#eef1f6" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/><line x1="32" y1="50" x2="36" y2="76" stroke="#374151" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="85" r="8" fill="none" stroke="#b91c1c" stroke-width="5"/></g>' +
    '<g class="pk-bB"><polygon points="28,52 32,3 36,52" fill="#eef1f6" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/><line x1="32" y1="50" x2="28" y2="76" stroke="#374151" stroke-width="4" stroke-linecap="round"/><circle cx="26" cy="85" r="8" fill="none" stroke="#b91c1c" stroke-width="5"/></g><circle cx="32" cy="50" r="3.5" fill="#374151"/></svg>';

  function div(c) { var d = document.createElement("div"); d.className = c; return d; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function build() {
    var layer = div("pk-layer"), ribbon = div("pk-ribbon"), sc = div("pk-scissors"), hint = div("pk-hint");
    sc.innerHTML = SVG;
    hint.textContent = "Qayçını tutub lentin üstünə apar";
    layer.appendChild(ribbon); layer.appendChild(sc); layer.appendChild(hint); document.body.appendChild(layer);
    var rr = ribbon.getBoundingClientRect(), W = sc.offsetWidth, H = sc.offsetHeight;
    var x = (innerWidth - W) / 2, y = Math.min(rr.bottom + 90, innerHeight - H - 40);
    var dx = 0, dy = 0, drag = false, cutting = false;
    function place() { sc.style.left = x + "px"; sc.style.top = y + "px"; }
    place(); hint.style.top = (y + H + 10) + "px";
    sc.addEventListener("pointerdown", function (e) {
      if (cutting) return; drag = true; dx = e.clientX - x; dy = e.clientY - y;
      try { sc.setPointerCapture(e.pointerId); } catch (err) {}
      hint.style.opacity = 0; e.preventDefault();
    });
    sc.addEventListener("pointermove", function (e) {
      if (!drag || cutting) return;
      x = clamp(e.clientX - dx, 0, innerWidth - W); y = clamp(e.clientY - dy, 0, innerHeight - H); place();
      var r = ribbon.getBoundingClientRect(); if (y + 4 <= r.bottom - 6) cut(x + W / 2, r);
    });
    function stop() { drag = false; }
    sc.addEventListener("pointerup", stop); sc.addEventListener("pointercancel", stop);

    function cut(cx, r) {
      cutting = true; drag = false; x = cx - W / 2; y = r.top + r.height / 2 - 4; place(); sc.classList.add("pk-snip");
      setTimeout(function () {
        // Canvas fabric pieces overlap slightly at the cut so the anchored edges never expose a gap.
        var L = makeFabric(-1, cx + 2, r, 1), R = makeFabric(cx - 1, innerWidth - cx + 2, r, -1);
        var drop = innerHeight * 1.4, start = performance.now();
        function frame(now) {
          var t = Math.min(1, (now - start) / 1900);
          drawFabric(L, t, drop); drawFabric(R, t, drop);
          if (t < 1) requestAnimationFrame(frame);
          else { L.canvas.remove(); R.canvas.remove(); }
        }
        requestAnimationFrame(frame);
        sc.style.transition = "transform 1s cubic-bezier(.5,0,.9,.6),opacity 1s";
        requestAnimationFrame(function () { sc.style.transform = "translateY(" + innerHeight + "px) rotate(25deg)"; sc.style.opacity = 0; });
        try { localStorage.setItem(KEY, "1"); } catch (e) {}
        release(); setTimeout(function () { layer.remove(); }, 2100);
      }, 200);
    }
  }

  function makeFabric(left, width, rect, side) {
    var canvas = document.createElement("canvas"), dpr = Math.min(devicePixelRatio || 1, 2);
    var w = Math.max(1, width), h = rect.height;
    canvas.className = "pk-fabric"; canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil((h + innerHeight * 1.5) * dpr);
    canvas.style.left = left + "px"; canvas.style.top = rect.top + "px"; canvas.style.width = w + "px"; canvas.style.height = (h + innerHeight * 1.5) + "px";
    document.querySelector(".pk-layer").appendChild(canvas);
    return { canvas: canvas, ctx: canvas.getContext("2d"), dpr: dpr, w: w, h: h, left: left, side: side };
  }

  function drawFabric(f, t, drop) {
    var ctx = f.ctx, d = f.dpr, w = f.w, h = f.h, side = f.side;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, f.canvas.width / d, f.canvas.height / d);
    var ease = 1 - Math.pow(1 - t, 2.2), fall = ease * drop;
    // A tessellated sheet bends along its length and width, with a traveling curl and crease.
    var cols = 28, rows = 22, points = [];
    for (var j = 0; j <= rows; j++) {
      var v = j / rows, row = [];
      for (var i = 0; i <= cols; i++) {
        var u = i / cols, wave = Math.sin(v * 13 - t * 10 + u * 5 + side) * (2 + 13 * t);
        var fold = Math.sin(v * 21 - t * 14 + u * 7) * (1 + 7 * t);
        row.push({ x: u * w + wave + fold, y: v * h + fall * v + Math.sin(v * 8 - t * 9 + u * 3) * 4 * t });
      }
      points.push(row);
    }
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var a = points[y][x], b = points[y][x + 1], c = points[y + 1][x + 1], e = points[y + 1][x];
      var shade = Math.sin((x / cols) * 9 + (y / rows) * 22 - t * 14) * .14;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath();
      ctx.fillStyle = shade > 0 ? "rgba(255,75,70," + (.82 + shade) + ")" : "rgba(150,0,8," + (.82 - shade) + ")"; ctx.fill();
      if (x % 4 === 0) { ctx.strokeStyle = "rgba(75,0,0," + (Math.abs(shade) * .7) + ")"; ctx.lineWidth = 1; ctx.stroke(); }
    }
    // Shaded rolled edge and a soft cast shadow give the thin sheet depth without a white inset highlight.
    ctx.save(); ctx.globalAlpha = .24 * t; ctx.filter = "blur(5px)"; ctx.fillStyle = "#260000";
    ctx.fillRect(side > 0 ? w - 4 : 0, fall * .15, 5, h + fall * .85); ctx.restore();
    ctx.globalAlpha = .22 * t; ctx.strokeStyle = "#5c0000"; ctx.lineWidth = 2;
    ctx.beginPath(); for (var k = 0; k <= rows; k++) { var p = points[k][side > 0 ? cols : 0]; if (!k) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); } ctx.stroke(); ctx.globalAlpha = 1;
  }

  function start() { try { build(); } catch (e) { release(); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
