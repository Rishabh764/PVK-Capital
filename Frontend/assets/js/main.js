/* ============================================================
   PVK CAPITAL — Site interactions
   Navigation • scroll reveal • counters • accordion • timeline
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Sticky nav + read progress + back-to-top ---------- */
  var nav = document.querySelector('.nav');
  var readbar = document.querySelector('.readbar');
  var toTop = document.querySelector('.totop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (nav) nav.classList.toggle('solid', y > 24);

    if (readbar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      readbar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    }

    if (toTop) toTop.classList.toggle('show', y > 620);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 2. Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var mobileMenu = document.querySelector('.mobile-menu');

  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && mobileMenu) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- 3. Scroll reveal ---------- */
  var revealables = document.querySelectorAll('[data-rv]');
  if (revealables.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      revealables.forEach(function (el) { el.classList.add('in'); });
    } else {
      var rvObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            rvObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealables.forEach(function (el) { rvObserver.observe(el); });
    }
  }

  /* ---------- 4. Animated number counters ---------- */
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;

    if (isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }

    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var v = target * easeOutQuart(p);
      el.textContent = prefix + v.toFixed(decimals) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var cObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cObserver.observe(el); });
    }
  }

  /* ---------- 5. Accordions ---------- */
  document.querySelectorAll('.acc').forEach(function (acc) {
    var single = acc.hasAttribute('data-single');

    acc.querySelectorAll('.acc-q').forEach(function (btn) {
      var item = btn.closest('.acc-item');
      var panel = item.querySelector('.acc-a');
      var inner = panel.querySelector('.acc-a-inner');

      btn.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
      if (item.classList.contains('open')) panel.style.height = 'auto';

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');

        if (single && !isOpen) {
          acc.querySelectorAll('.acc-item.open').forEach(function (other) {
            var op = other.querySelector('.acc-a');
            op.style.height = op.scrollHeight + 'px';
            requestAnimationFrame(function () { op.style.height = '0px'; });
            other.classList.remove('open');
            other.querySelector('.acc-q').setAttribute('aria-expanded', 'false');
          });
        }

        if (isOpen) {
          panel.style.height = panel.scrollHeight + 'px';
          requestAnimationFrame(function () { panel.style.height = '0px'; });
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.height = inner.offsetHeight + 'px';
          window.setTimeout(function () {
            if (item.classList.contains('open')) panel.style.height = 'auto';
          }, 520);
        }
      });
    });
  });

  /* ---------- 6. Timeline progress ---------- */
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var tlItems = Array.prototype.slice.call(timeline.querySelectorAll('.tl-item'));

    function updateTimeline() {
      var rect = timeline.getBoundingClientRect();
      var anchor = window.innerHeight * 0.55;
      var pct = ((anchor - rect.top) / rect.height) * 100;
      timeline.style.setProperty('--progress', Math.max(0, Math.min(100, pct)) + '%');

      tlItems.forEach(function (item) {
        item.classList.toggle('on', item.getBoundingClientRect().top < anchor);
      });
    }

    var tlTicking = false;
    window.addEventListener('scroll', function () {
      if (!tlTicking) { window.requestAnimationFrame(function () { updateTimeline(); tlTicking = false; }); tlTicking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateTimeline);
    updateTimeline();
  }

  /* ---------- 7. Marquee — duplicate content for a seamless loop ---------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    if (track.children.length === 1) {
      track.appendChild(track.firstElementChild.cloneNode(true));
    }
  });

  /* ---------- 8. Founder photo — reveal placeholder if the image is missing ---------- */
  document.querySelectorAll('.photo-slot img').forEach(function (img) {
    function fallback() {
      img.style.display = 'none';
      var ph = img.parentElement.querySelector('.photo-ph');
      if (ph) ph.style.display = 'flex';
    }
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });

  /* ---------- 9. Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 10. Highlight the current page in the nav ---------- */
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href && href === here) a.classList.add('active');
  });
})();
