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
    var dock = document.getElementById('dock');
    if (dock) dock.style.overflow = 'visible';

    var sel = '.top-nav,.hero,.section-title,.dock .tile,.cards .card,.quick-action';
    var bodies = [];
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      var fixed = !!el.closest('.quick-actions');
      var bottom = fixed ? r.bottom : r.bottom + sy;
      var floor = fixed ? window.innerHeight : floorPage;
      bodies.push({
        el: el,
        room: Math.max(0, floor - bottom),
        x: 0, y: 0, vy: 0,
        vx: (Math.random() - .5) * 60,
        a: 0,
        va: (Math.random() - .5) * 50,
        start: performance.now() + Math.random() * 700,
        done: false
      });
    });

    var last = performance.now();
    function step(now) {
      var dt = Math.min((now - last) / 1000, .033);
      last = now;
      var running = false;
      bodies.forEach(function (b) {
        if (b.done) return;
        running = true;
        if (now < b.start) return;
        b.vy += 2200 * dt;
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        b.a += b.va * dt;
        if (b.y >= b.room) {
          b.y = b.room;
          if (Math.abs(b.vy) < 90) {
            b.done = true;
            b.a = (Math.random() - .5) * 6;
          } else {
            b.vy *= -.32;
            b.vx *= .7;
            b.va *= .6;
          }
        }
        b.el.style.translate = b.x + 'px ' + b.y + 'px';
        b.el.style.rotate = b.a + 'deg';
      });
      if (running) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
})();
