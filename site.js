/* IbhanAi Labs — shared interactions & animations */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero headline: staggered word reveal on load ---- */
  var title = document.getElementById("heroTitle");
  if (title) {
    if (reduce) { title.classList.add("in"); }
    else {
      var words = title.querySelectorAll(".word");
      words.forEach(function (w, i) { w.style.transitionDelay = (120 + i * 85) + "ms"; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add("in"); }); });
    }
  }

  /* ---- scroll progress + nav stuck + parallax orbs + atom scroll-scrub ---- */
  var prog = document.getElementById("progress");
  var nav = document.getElementById("nav");
  var orbs = Array.prototype.slice.call(document.querySelectorAll(".orb"));
  var atom = document.getElementById("atom");
  var ticking = false;
  function frame() {
    var h = document.documentElement, y = h.scrollTop;
    if (prog) { var pct = y / (h.scrollHeight - h.clientHeight || 1); prog.style.width = (pct * 100) + "%"; }
    if (nav) nav.classList.toggle("stuck", y > 20);
    if (!reduce) {
      orbs.forEach(function (o) { o.style.transform = "translateY(" + (y * (+o.dataset.depth || 0.15)) + "px)"; });
      if (atom) atom.style.setProperty("--rz", (y * 0.08) + "deg");
    }
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(frame); ticking = true; } }, { passive: true });
  frame();

  /* ---- scroll reveal (staggered, all variants) ---- */
  (function () {
    var sel = ".rv, .rv-l, .rv-r, .rv-s";
    var nodes = document.querySelectorAll(sel);
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          var sibs = Array.prototype.slice.call(en.target.parentNode.children).filter(function (c) { return /\brv/.test(c.className); });
          var i = Math.max(0, sibs.indexOf(en.target));
          setTimeout(function () { en.target.classList.add("in"); }, Math.min(i * 120, 420));
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (e) { io.observe(e); });
  })();

  /* ---- animated counters ---- */
  (function () {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function run(el) {
      var target = +el.dataset.count, suffix = el.dataset.suffix || "", dur = 1500, t0 = null;
      if (reduce) { el.textContent = target + suffix; return; }
      function step(ts) {
        if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (e) { io.observe(e); });
  })();

  if (reduce) return;

  /* ---- hero: mouse-parallax tilt on the 3D atom ---- */
  (function () {
    if (!atom) return;
    var hero = document.querySelector(".hero") || document.querySelector(".page-hero");
    if (!hero) return;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      atom.style.setProperty("--rx", (66 - py * 30) + "deg");
      atom.style.setProperty("--ry", (px * 46) + "deg");
    });
    hero.addEventListener("mouseleave", function () { atom.style.setProperty("--rx", "66deg"); atom.style.setProperty("--ry", "0deg"); });
  })();

  /* ---- magnetic buttons ---- */
  document.querySelectorAll(".magnetic").forEach(function (b) {
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.4, y = (e.clientY - r.top - r.height / 2) * 0.5;
      b.style.transform = "translate(" + x + "px," + y + "px)";
    });
    b.addEventListener("mouseleave", function () { b.style.transform = ""; });
  });

  /* ---- 3D cursor tilt + glow on cards ---- */
  document.querySelectorAll("[data-tilt]").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.transform = "rotateY(" + ((px - 0.5) * 14) + "deg) rotateX(" + ((0.5 - py) * 14) + "deg) translateY(-8px)";
      card.style.setProperty("--mx", (px * 100) + "%"); card.style.setProperty("--my", (py * 100) + "%");
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  });

  /* ---- cursor spotlight ---- */
  (function () {
    var sp = document.getElementById("spotlight");
    if (!sp) return;
    addEventListener("mousemove", function (e) { sp.style.opacity = "1"; sp.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; });
    addEventListener("mouseleave", function () { sp.style.opacity = "0"; });
  })();

  /* ---- hero canvas: connected particle field ---- */
  (function () {
    var cv = document.getElementById("hero-canvas");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(devicePixelRatio || 1, 2), W, H, pts = [];
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, W / 18)); pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d < 124) { ctx.strokeStyle = "rgba(15,82,87," + (0.07 * (1 - d / 124)) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.fillStyle = "rgba(15,82,87,0.22)"; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 6.28); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    addEventListener("resize", size); size(); tick();
  })();
})();
