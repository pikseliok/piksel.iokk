(function () {
  var SEQ = ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowRight'];
  var pos = 0, active = false;

  // Heç nə seçili olmayanda (fokus yox, mətn seçimi yox, pəncərə açıq deyil)
  function idle() {
    var a = document.activeElement;
    if (a && a !== document.body && a !== document.documentElement) return false;
    var s = window.getSelection && window.getSelection();
    if (s && !s.isCollapsed) return false;
    if (document.documentElement.classList.contains('need-consent')) return false;
    if (document.querySelector('.quick-overlay.open')) return false;
    return true;
  }

  document.addEventListener('keydown', function (e) {
    if (active || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (!idle()) { pos = 0; return; }
    if (e.key === SEQ[pos]) pos++;
    else pos = (e.key === SEQ[0]) ? 1 : 0;
    if (pos === SEQ.length) { pos = 0; fall(); }
  });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function fall() {
    active = true;
    var root = document.documentElement;
    root.classList.add('gravity-on');

    var st = document.createElement('style');
    st.textContent =
      '.gravity-on .card:hover,.gravity-on .card:active{transform:none!important;box-shadow:0 10px 25px rgba(0,20,110,.07)!important}' +
      '.gravity-on .quick-action:hover,.gravity-on .quick-action:active{transform:none!important;filter:none!important}' +
      '.gravity-on .tile:hover .ti,.gravity-on .tile:active .ti{transform:none!important}' +
      '.gravity-on .hero-qr:hover{filter:none!important}' +
      '.gravity-on .nav-link:hover{transform:none!important}' +
      '.gravity-on .theme-toggle:hover,.gravity-on .theme-toggle:active{transform:translateY(-50%)!important}' +
      '.g-body{cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}' +
      '.g-body img,.g-body svg{pointer-events:none}' +
      '.g-drag{cursor:grabbing!important}';
    document.head.appendChild(st);

    // başlıq tam enli görünməz şüa olmasın, yalnız yazı qədər yer tutsun
    var ttl = document.querySelector('.section-title');
    if (ttl) { ttl.style.width = 'fit-content'; ttl.style.marginLeft = 'auto'; ttl.style.marginRight = 'auto'; }

    var sy = window.scrollY || window.pageYOffset;
    var sx = window.scrollX || window.pageXOffset || 0;
    var vw = root.clientWidth;
    var foot = document.querySelector('footer');
    var floorPage = foot ? foot.getBoundingClientRect().top + sy : root.scrollHeight;
    var bodies = [];
    var topZ = 100;
    var G = 2200, REST = .15;

    // cismin görünən qutusu: 90° yaxınlığında en və hündürlük yer dəyişir
    function setBounds(b) {
      var vert = !b.noRot && Math.abs(Math.sin(b.a * Math.PI / 180)) > .7071;
      var ew = vert ? b.h : b.w, eh = vert ? b.w : b.h;
      b.ew = ew; b.eh = eh;
      b.dx = (b.w - ew) / 2; b.dy = (b.h - eh) / 2;
      var mnX = b.L - b.left0 - b.dx, mxX = b.R - ew - b.left0 - b.dx;
      var mnY = b.T - b.top0 - b.dy, mxY = b.B - eh - b.top0 - b.dy;
      if (b.parent) {
        if (!vert) {
          mnX = Math.min(0, mnX); mxX = Math.max(0, mxX);
          mnY = Math.min(0, mnY); mxY = Math.max(0, mxY);
        } else {
          mxX = Math.max(mnX, mxX); mxY = Math.max(mnY, mxY);
        }
      } else {
        mxX = Math.max(mnX, mxX);
        mxY = vert ? Math.max(mnY, mxY) : Math.max(0, mxY);
      }
      b.minX = mnX; b.maxX = mxX; b.minY = mnY; b.maxY = mxY;
    }

    // yerdə dayananda ən yaxın 90° qatına otursun (yatay və ya dik)
    function restAngle(b) {
      return b.noRot ? 0 : Math.round(b.a / 90) * 90 + b.tilt;
    }

    function add(el, parent, fixed, noRot) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      var left0 = fixed ? r.left : r.left + sx;
      var top0 = fixed ? r.top : r.top + sy;
      var floor = fixed ? window.innerHeight : floorPage;
      var wide = r.width > 400;
      if (getComputedStyle(el).position === 'static' && !fixed) el.style.position = 'relative';
      el.classList.add('g-body');
      var b = {
        el: el, parent: parent || null, fixed: !!fixed, noRot: !!noRot,
        w: r.width, h: r.height,
        inv: 1 / Math.sqrt(r.width * r.height),
        left0: left0, top0: top0,
        L: 0, R: vw, T: 0, B: floor,
        ew: r.width, eh: r.height, dx: 0, dy: 0,
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        ax: 0, ay: 0, pvx: 0, pvy: 0, px0: 0, py0: 0, isFrame: false,
        x: 0, y: 0, vx: (Math.random() - .5) * (wide ? 20 : 60), vy: 0,
        a: 0, va: noRot ? 0 : (Math.random() - .5) * (wide ? 14 : 50),
        tilt: noRot ? 0 : (Math.random() - .5) * 5,
        start: performance.now() + Math.random() * 700,
        contact: false, dragging: false
      };
      if (parent) {
        // ikon çərçivənin içində qalır: sərhədlər çərçivənin daxili qutusudur
        b.L = parent.left0 + 10;
        b.R = parent.left0 + parent.w - 10;
        b.T = parent.top0 + 8;
        b.B = parent.top0 + parent.h - 8;
        parent.isFrame = true;
      }
      setBounds(b);
      bodies.push(b);
      return b;
    }

    var nav = document.querySelector('.top-nav');
    if (nav) add(nav);

    var main = document.querySelector('main');
    if (main) {
      [].forEach.call(main.children, function (el) {
        if (/^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
        if (el.classList.contains('cards')) {
          [].forEach.call(el.children, function (c) { add(c); });
          return;
        }
        var b = add(el, null, false, el.id === 'dock');
        if (b && el.id === 'dock') {
          el.style.overflow = 'visible';
          var g = document.getElementById('dockGrid');
          if (g) g.style.zIndex = 'auto';
          // ikon düymələr (kvadrat + svg + yazı) bütöv bir cisimdir, öz kvadratından ayrılmır
          [].forEach.call(el.querySelectorAll('.tile'), function (t) { add(t, b); });
        }
      });
    }
    [].forEach.call(document.querySelectorAll('.quick-action'), function (q) { add(q, null, true); });

    var maxStart = 0;
    bodies.forEach(function (b) { if (b.start > maxStart) maxStart = b.start; });

    /* ---------- fizika ---------- */
    function norm(a) { return ((a + 180) % 360 + 360) % 360 - 180; }

    function integrate(b, h, now) {
      if (b.dragging || now < b.start) return;
      var was = b.contact;
      b.contact = false;
      var pa = b.parent;
      b.vx += (pa ? -pa.ax : 0) * h;
      b.vy += (G - (pa ? pa.ay : 0)) * h;
      b.x += b.vx * h;
      b.y += b.vy * h;
      if (!b.noRot) {
        b.a += b.va * h;
        if (was) {
          b.va *= Math.max(0, 1 - 10 * h);
          b.a = norm(b.a);
          b.a += (restAngle(b) - b.a) * Math.min(1, 8 * h);
        }
        setBounds(b);
      }
      if (b.x < b.minX) { b.x = b.minX; if (b.vx < 0) b.vx = -b.vx * .5; b.va *= -.5; }
      else if (b.x > b.maxX) { b.x = b.maxX; if (b.vx > 0) b.vx = -b.vx * .5; b.va *= -.5; }
      if (b.y < b.minY) { b.y = b.minY; if (b.vy < 0) b.vy = -b.vy * .4; }
      if (b.y >= b.maxY) {
        b.y = b.maxY; b.contact = true;
        if (b.vy > 90) { b.vy *= -.32; b.va *= .6; b.vx *= .9; }
        else { b.vy = 0; b.vx *= Math.max(0, 1 - 6 * h); }
      }
    }

    function clampB(b) {
      if (b.dragging) return;
      if (b.x < b.minX) { b.x = b.minX; if (b.vx < 0) b.vx = 0; }
      else if (b.x > b.maxX) { b.x = b.maxX; if (b.vx > 0) b.vx = 0; }
      if (b.y < b.minY) { b.y = b.minY; if (b.vy < 0) b.vy = 0; }
      if (b.y > b.maxY) { b.y = b.maxY; if (b.vy > 0) b.vy = 0; b.contact = true; }
    }

    function collide(h) {
      var n = bodies.length;
      for (var i = 0; i < n; i++) {
        var A = bodies[i];
        for (var j = i + 1; j < n; j++) {
          var B = bodies[j];
          if (A.fixed !== B.fixed) continue;
          if (A.parent !== B.parent) continue;
          if (A.dragging && B.dragging) continue;
          // görünən (fırlanmış) qutular
          var ax = A.left0 + A.x + A.dx, ay = A.top0 + A.y + A.dy;
          var bx = B.left0 + B.x + B.dx, by = B.top0 + B.y + B.dy;
          var ox = Math.min(ax + A.ew, bx + B.ew) - Math.max(ax, bx);
          if (ox <= 0) continue;
          var oy = Math.min(ay + A.eh, by + B.eh) - Math.max(ay, by);
          if (oy <= 0) continue;
          var iA = A.dragging ? 0 : A.inv, iB = B.dragging ? 0 : B.inv, tot = iA + iB;
          if (!tot) continue;
          var nn, jj, vn, vt, jt;
          if (ox < oy) {
            nn = (ax + A.ew / 2 < bx + B.ew / 2) ? 1 : -1;
            A.x -= nn * ox * iA / tot; B.x += nn * ox * iB / tot;
            vn = (B.vx - A.vx) * nn;
            if (vn < 0) { jj = -(1 + REST) * vn / tot; A.vx -= nn * jj * iA; B.vx += nn * jj * iB; }
            vt = B.vy - A.vy; jt = -vt * .1 / tot; A.vy -= jt * iA; B.vy += jt * iB;
          } else {
            nn = (ay + A.eh / 2 < by + B.eh / 2) ? 1 : -1; // 1: A üstdə
            A.y -= nn * oy * iA / tot; B.y += nn * oy * iB / tot;
            vn = (B.vy - A.vy) * nn;
            if (vn < 0) { jj = -(1 + REST) * vn / tot; A.vy -= nn * jj * iA; B.vy += nn * jj * iB; }
            vt = B.vx - A.vx; jt = -vt * .3 / tot; A.vx -= jt * iA; B.vx += jt * iB;
            if (nn === 1) A.contact = true; else B.contact = true;
          }
        }
      }
    }

    // tutulan cisim tutduğun nöqtədən asılmış kimi yelləncək olur: küncdən dartanda fırlanır
    function swing(dt) {
      var g = grab, b = g.b;
      if (b.noRot || dt < .001) return;
      var vx = (g.px - g.ppx) / dt, vy = (g.py - g.ppy) / dt;
      g.ppx = g.px; g.ppy = g.py;
      g.svx += (vx - g.svx) * .4; g.svy += (vy - g.svy) * .4;
      var ax = clamp((g.svx - g.pvx) / dt, -12000, 12000), ay = clamp((g.svy - g.pvy) / dt, -12000, 12000);
      g.pvx = g.svx; g.pvy = g.svy;
      g.sax += (ax - g.sax) * .3; g.say += (ay - g.say) * .3;
      var n = 4, h = dt / n, dx = 0, dy = 0;
      for (var i = 0; i < n; i++) {
        var th = b.a * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
        dx = -(g.rx * c - g.ry * s);
        dy = -(g.rx * s + g.ry * c);
        var Fx = -g.sax, Fy = 3000 - g.say;
        var al = (dx * Fy - dy * Fx) / (dx * dx + dy * dy + g.k2);
        g.om += al * h;
        g.om *= Math.max(0, 1 - 3 * h);
        g.om = clamp(g.om, -25, 25);
        b.a += g.om * h * 180 / Math.PI;
      }
      setBounds(b);
      var th2 = b.a * Math.PI / 180, c2 = Math.cos(th2), s2 = Math.sin(th2);
      dx = -(g.rx * c2 - g.ry * s2);
      dy = -(g.rx * s2 + g.ry * c2);
      var po = b.parent || { x: 0, y: 0 };
      b.x = clamp(g.px + dx - b.left0 - po.x - b.w / 2, b.minX, b.maxX);
      b.y = clamp(g.py + dy - b.top0 - po.y - b.h / 2, b.minY, b.maxY);
    }

    var running = false, last = 0, lowTime = 0;
    function kick() {
      lowTime = 0;
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    }
    function step(now) {
      var dt = Math.min((now - last) / 1000, .033);
      last = now;
      if (grab) swing(dt);
      var sub = 2, h = dt / sub;
      for (var s = 0; s < sub; s++) {
        bodies.forEach(function (b) { integrate(b, h, now); });
        for (var it = 0; it < 4; it++) { collide(h); bodies.forEach(clampB); }
      }
      var moving = false;
      bodies.forEach(function (b) {
        if (!b.dragging && (Math.abs(b.vx) > 8 || Math.abs(b.vy) > 40 ||
            (!b.noRot && b.contact && Math.abs(b.a - restAngle(b)) > .5))) moving = true;
        b.el.style.translate = b.x + 'px ' + b.y + 'px';
        b.el.style.rotate = b.a + 'deg';
      });
      bodies.forEach(function (b) {
        if (!b.isFrame || dt < .001) return;
        var vx = (b.x - b.px0) / dt, vy = (b.y - b.py0) / dt;
        var ax = clamp((vx - b.pvx) / dt, -6000, 6000), ay = clamp((vy - b.pvy) / dt, -6000, 6000);
        if (Math.abs(ax) < 300) ax = 0;
        if (Math.abs(ay) < 300) ay = 0;
        b.ax += (ax - b.ax) * .25; b.ay += (ay - b.ay) * .25;
        b.px0 = b.x; b.py0 = b.y; b.pvx = vx; b.pvy = vy;
      });
      if (grab || moving || now < maxStart + 100) lowTime = 0; else lowTime += dt;
      if (lowTime > .5) {
        bodies.forEach(function (b) {
          b.vx = 0; b.vy = 0; b.va = 0;
          if (!b.noRot) { b.a = restAngle(b); setBounds(b); }
          b.el.style.rotate = b.a + 'deg';
        });
        running = false;
        return;
      }
      requestAnimationFrame(step);
    }

    /* ---------- tutub savurmaq ---------- */
    var grab = null, suppress = false;

    function pagePt(e, b) {
      return {
        x: e.clientX + (b.fixed ? 0 : (window.scrollX || window.pageXOffset || 0)),
        y: e.clientY + (b.fixed ? 0 : (window.scrollY || window.pageYOffset || 0))
      };
    }
    function sampleVel(samples) {
      if (samples.length < 2) return null;
      var f = samples[0], l = samples[samples.length - 1], d = (l.t - f.t) / 1000;
      if (d <= .005) return null;
      return { vx: clamp((l.x - f.x) / d, -3000, 3000), vy: clamp((l.y - f.y) / d, -3000, 3000) };
    }

    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (grab) return;
      var b = null;
      for (var i = bodies.length - 1; i >= 0; i--) {
        if (bodies[i].el.contains(e.target)) { b = bodies[i]; break; }
      }
      if (!b) return;
      e.stopPropagation();
      e.preventDefault();
      var p = pagePt(e, b);
      b.dragging = true;
      b.vx = 0; b.vy = 0; b.va = 0;
      b.el.style.zIndex = ++topZ;
      b.el.classList.add('g-drag');
      grab = {
        b: b, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, samples: [],
        gx: p.x - (b.left0 + b.x), gy: p.y - (b.top0 + b.y),
        px: p.x, py: p.y, ppx: p.x, ppy: p.y,
        svx: 0, svy: 0, pvx: 0, pvy: 0, sax: 0, say: 0, om: 0,
        k2: (b.w * b.w + b.h * b.h) / 12
      };
      // tutulan nöqtənin cismin mərkəzinə nisbətən (fırlanmamış) mövqeyi
      var po = b.parent || { x: 0, y: 0 };
      var cx = b.left0 + po.x + b.x + b.w / 2, cy = b.top0 + po.y + b.y + b.h / 2;
      var wx = p.x - cx, wy = p.y - cy, th0 = b.a * Math.PI / 180;
      grab.rx = wx * Math.cos(th0) + wy * Math.sin(th0);
      grab.ry = -wx * Math.sin(th0) + wy * Math.cos(th0);
      kick();
    }, true);

    function release() {
      if (!grab) return;
      var b = grab.b, s = grab.samples, now = performance.now();
      var v = (s.length > 1 && now - s[s.length - 1].t < 80) ? sampleVel(s) : null;
      b.vx = v ? v.vx : 0;
      b.vy = v ? v.vy : 0;
      b.va = b.noRot ? 0 : clamp(grab.om * 180 / Math.PI, -600, 600);
      b.dragging = false;
      b.el.classList.remove('g-drag');
      if (grab.moved) { suppress = true; setTimeout(function () { suppress = false; }, 60); }
      grab = null;
      kick();
    }

    window.addEventListener('pointermove', function (e) {
      if (!grab || e.pointerId !== grab.id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { release(); return; }
      var b = grab.b, p = pagePt(e, b);
      grab.px = p.x; grab.py = p.y;
      if (b.noRot) {
        b.x = clamp(p.x - grab.gx - b.left0, b.minX, b.maxX);
        b.y = clamp(p.y - grab.gy - b.top0, b.minY, b.maxY);
      }
      if (Math.abs(e.clientX - grab.sx) + Math.abs(e.clientY - grab.sy) > 6) grab.moved = true;
      var t = performance.now();
      grab.samples.push({ t: t, x: p.x, y: p.y });
      while (grab.samples.length > 1 && t - grab.samples[0].t > 100) grab.samples.shift();
      var v = sampleVel(grab.samples);
      if (v) { b.vx = v.vx; b.vy = v.vy; } // tutulan cisim başqalarına zərbə ilə təsir etsin
      lowTime = 0;
    }, true);

    window.addEventListener('pointerup', function (e) { if (grab && e.pointerId === grab.id) release(); }, true);
    window.addEventListener('pointercancel', function (e) { if (grab && e.pointerId === grab.id) release(); }, true);

    // sürüşdürmədən sonra təsadüfən klik olmasın
    document.addEventListener('click', function (e) {
      if (suppress) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    document.addEventListener('dragstart', function (e) { e.preventDefault(); }, true);

    kick();
  }
})();
