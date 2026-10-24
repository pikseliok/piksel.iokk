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

  function fall() {
    active = true;
    var sy = window.scrollY || window.pageYOffset;
    var foot = document.querySelector('footer');
    var floorPage = foot ? foot.getBoundingClientRect().top + sy : document.documentElement.scrollHeight;
    var bodies = [];

    function add(el, parent, fixed) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      var bottom = fixed ? r.bottom : r.bottom + sy;
      var floor = fixed ? window.innerHeight : floorPage;
      var wide = r.width > 400;
      var b = {
        el: el, parent: parent || null,
        room: Math.max(0, floor - bottom),
        x: 0, y: 0, vy: 0,
        vx: (Math.random() - .5) * (wide ? 20 : 60),
        a: 0,
        va: (Math.random() - .5) * (wide ? 14 : 50),
        start: performance.now() + Math.random() * 700,
        done: false
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
        var b = add(el);
        if (b && el.id === 'dock') {
          b.va = 0; // çərçivə fırlanmasın, içindəkilər öz-özünə düşür
          el.style.overflow = 'visible';
          [].forEach.call(el.querySelectorAll('.tile'), function (t) { add(t, b); });
        }
      });
    }

    [].forEach.call(document.querySelectorAll('.quick-action'), function (q) { add(q, null, true); });

    var last = performance.now();
    function step(now) {
      var dt = Math.min((now - last) / 1000, .033);
      last = now;
      var running = false;
      bodies.forEach(function (b) {
        if (!b.done) {
          running = true;
          if (now >= b.start) {
            b.vy += 2200 * dt;
            b.y += b.vy * dt;
            b.x += b.vx * dt;
            b.a += b.va * dt;
            if (b.y >= b.room) {
              b.y = b.room;
              if (Math.abs(b.vy) < 90) {
                b.done = true;
                b.a = b.va === 0 ? 0 : (Math.random() - .5) * 6;
              } else {
                b.vy *= -.32;
                b.vx *= .7;
                b.va *= .6;
              }
            }
          }
        }
        var px = b.parent ? b.parent.x : 0;
        var py = b.parent ? b.parent.y : 0;
        b.el.style.translate = (b.x - px) + 'px ' + (b.y - py) + 'px';
        b.el.style.rotate = b.a + 'deg';
      });
      if (running) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
})();
