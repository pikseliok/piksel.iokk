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

    var sy = window.scrollY || window.pageYOffset;
    var sx = window.scrollX || window.pageXOffset || 0;
    var vw = root.clientWidth;
    var foot = document.querySelector('footer');
    var floorPage = foot ? foot.getBoundingClientRect().top + sy : root.scrollHeight;
    var bodies = [];
    var topZ = 100;

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
        left0: left0, top0: top0,
        minX: -left0, maxX: Math.max(-left0, vw - r.width - left0),
        minY: -top0, maxY: Math.max(0, floor - (top0 + r.height)),
        x: 0, y: 0, vx: (Math.random() - .5) * (wide ? 20 : 60), vy: 0,
        a: 0, va: noRot ? 0 : (Math.random() - .5) * (wide ? 14 : 50),
        tilt: noRot ? 0 : (Math.random() - .5) * 5,
        start: performance.now() + Math.random() * 700,
        rest: false, dragging: false
      };
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
        var wide = el.getBoundingClientRect().width > 400;
        var b = add(el, null, false, el.id === 'dock');
        if (b && el.id === 'dock') {
          el.style.overflow = 'visible';
          var g = document.getElementById('dockGrid');
          if (g) g.style.zIndex = 'auto';
          [].forEach.call(el.querySelectorAll('.tile'), function (t) { add(t, b); });
        }
      });
    }
    [].forEach.call(document.querySelectorAll('.quick-action'), function (q) { add(q, null, true); });

    /* ---------- fizika dövrü ---------- */
    var running = false, last = 0;
    function kick() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    }
    function step(now) {
      var dt = Math.min((now - last) / 1000, .033);
      last = now;
      var any = false;
      bodies.forEach(function (b) {
        if (!b.dragging && !b.rest && now >= b.start) {
          b.vy += 2200 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (!b.noRot) b.a += b.va * dt;
          if (b.x < b.minX) { b.x = b.minX; b.vx = Math.abs(b.vx) * .5; b.va *= -.5; }
          else if (b.x > b.maxX) { b.x = b.maxX; b.vx = -Math.abs(b.vx) * .5; b.va *= -.5; }
          if (b.y < b.minY) { b.y = b.minY; b.vy = Math.abs(b.vy) * .4; }
          if (b.y >= b.maxY) {
            b.y = b.maxY;
            if (Math.abs(b.vy) > 90) {
              b.vy *= -.32; b.va *= .6; b.vx *= .9;
            } else {
              b.vy = 0;
              b.vx *= Math.max(0, 1 - 6 * dt);
              if (!b.noRot) {
                b.va = 0;
                b.a = ((b.a + 180) % 360 + 360) % 360 - 180;
                b.a += (b.tilt - b.a) * Math.min(1, 8 * dt);
              }
              if (Math.abs(b.vx) < 6 && (b.noRot || Math.abs(b.a - b.tilt) < .3)) {
                b.vx = 0; b.rest = true;
                if (!b.noRot) b.a = b.tilt;
              }
            }
          }
        }
        if (b.dragging || !b.rest) any = true;
        var px = b.parent ? b.parent.x : 0, py = b.parent ? b.parent.y : 0;
        b.el.style.translate = (b.x - px) + 'px ' + (b.y - py) + 'px';
        b.el.style.rotate = b.a + 'deg';
      });
      if (any) requestAnimationFrame(step); else running = false;
    }
    kick();

    /* ---------- tutub savurmaq ---------- */
    var grab = null, suppress = false;

    function pagePt(e, b) {
      return {
        x: e.clientX + (b.fixed ? 0 : (window.scrollX || window.pageXOffset || 0)),
        y: e.clientY + (b.fixed ? 0 : (window.scrollY || window.pageYOffset || 0))
      };
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
      b.dragging = true; b.rest = false;
      b.vx = 0; b.vy = 0; b.va = 0;
      b.el.style.zIndex = ++topZ;
      b.el.classList.add('g-drag');
      grab = {
        b: b, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, samples: [],
        gx: p.x - (b.left0 + b.x), gy: p.y - (b.top0 + b.y)
      };
      kick();
    }, true);

    function release() {
      if (!grab) return;
      var b = grab.b, s = grab.samples, now = performance.now();
      var vx = 0, vy = 0;
      if (s.length > 1 && now - s[s.length - 1].t < 80) {
        var f = s[0], l = s[s.length - 1], d = (l.t - f.t) / 1000;
        if (d > .005) { vx = (l.x - f.x) / d; vy = (l.y - f.y) / d; }
      }
      vx = clamp(vx, -3000, 3000);
      vy = clamp(vy, -3000, 3000);
      b.vx = vx; b.vy = vy;
      b.va = b.noRot ? 0 : clamp(vx * .04, -240, 240);
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
      b.x = clamp(p.x - grab.gx - b.left0, b.minX, b.maxX);
      b.y = clamp(p.y - grab.gy - b.top0, b.minY, b.maxY);
      if (Math.abs(e.clientX - grab.sx) + Math.abs(e.clientY - grab.sy) > 6) grab.moved = true;
      var t = performance.now();
      grab.samples.push({ t: t, x: p.x, y: p.y });
      while (grab.samples.length > 1 && t - grab.samples[0].t > 100) grab.samples.shift();
      if (!b.noRot) b.a += (clamp((e.movementX || 0) * 1.2, -18, 18) - b.a) * .25;
    }, true);

    window.addEventListener('pointerup', function (e) { if (grab && e.pointerId === grab.id) release(); }, true);
    window.addEventListener('pointercancel', function (e) { if (grab && e.pointerId === grab.id) release(); }, true);

    // sürüşdürmədən sonra təsadüfən klik olmasın
    document.addEventListener('click', function (e) {
      if (suppress) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    document.addEventListener('dragstart', function (e) { e.preventDefault(); }, true);
  }
})();
