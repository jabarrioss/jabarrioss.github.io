/* ==========================================================================
   site.js — Interfaz del portafolio retro.
   Menú móvil, marquee, contador de visitas, typewriter, año/años de
   experiencia y sincronización del selector de estación con FlashParticles.
   ========================================================================== */
(function () {
  'use strict';

  var VISITS_KEY = 'jbs.visits';
  var START_YEAR = 2017;

  var SEASON_LABELS = {
    winter: 'Invierno',
    spring: 'Primavera',
    summer: 'Verano',
    autumn: 'Otoño'
  };
  var SEASON_ICONS = {
    winter: '❄',
    spring: '❀',
    summer: '☀',
    autumn: '🍂'
  };

  function prefersReducedMotion() {
    try {
      return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* modo privado */ }
  }

  /* ---------- 1. Menú móvil ---------- */
  function initMenu() {
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var icon = btn.querySelector('i');
      if (icon) icon.className = open ? 'fas fa-times' : 'fas fa-bars';
    }

    btn.addEventListener('click', function () {
      setOpen(!menu.classList.contains('open'));
    });

    var links = menu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () { setOpen(false); });
    }

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  /* ---------- 2. Marquee / ticker ---------- */
  function initTicker() {
    var track = document.getElementById('ticker-track');
    if (!track) return;

    var offset = 0;
    var segment = 0;
    var rafId = 0;
    var last = 0;

    function measure() {
      var first = track.querySelector('span');
      segment = first ? first.offsetWidth : 0;
    }

    function step(time) {
      if (!last) last = time;
      var dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      offset -= 42 * dt;
      if (segment > 0 && offset <= -segment) offset += segment;
      track.style.transform = 'translate3d(' + offset + 'px, 0, 0)';
      rafId = window.requestAnimationFrame(step);
    }

    if (prefersReducedMotion()) {
      track.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    measure();
    window.addEventListener('resize', function () {
      measure();
      if (offset > 0) offset = 0;
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else {
        last = 0;
        if (!rafId) rafId = window.requestAnimationFrame(step);
      }
    });
    rafId = window.requestAnimationFrame(step);
  }

  /* ---------- 3. Contador de visitas (odómetro) ---------- */
  // Contador COSMÉTICO: vive en localStorage, no hay backend ni métricas reales.
  function initCounter() {
    var box = document.getElementById('visit-counter');
    if (!box) return;

    var visits = parseInt(safeStorageGet(VISITS_KEY) || '0', 10);
    if (isNaN(visits) || visits < 0) visits = 0;
    visits += 1;
    safeStorageSet(VISITS_KEY, String(visits));

    var base = 12047; // base ficticia de estilo "sitio de los 90"
    var target = String(base + visits);
    var padded = ('000000' + target).slice(-6);

    var label = document.getElementById('visit-count-label');
    if (label) label.textContent = String(visits);

    box.innerHTML = '';
    var digitEls = [];

    for (var i = 0; i < padded.length; i++) {
      if (i > 0 && (padded.length - i) % 3 === 0) {
        var sep = document.createElement('span');
        sep.className = 'digit sep';
        sep.textContent = '.';
        box.appendChild(sep);
      }
      var d = document.createElement('span');
      d.className = 'digit';
      // Valor final desde el principio: si los timers están bloqueados
      // (pestaña en segundo plano), el contador sigue siendo correcto.
      d.textContent = padded.charAt(i);
      box.appendChild(d);
      digitEls.push({ el: d, target: padded.charAt(i) });
    }

    if (prefersReducedMotion() || document.hidden) {
      digitEls.forEach(function (item) { item.el.textContent = item.target; });
      return;
    }

    digitEls.forEach(function (item, index) {
      var steps = 8 + index * 2;
      var tick = 0;
      var timer = window.setInterval(function () {
        tick++;
        if (tick >= steps) {
          window.clearInterval(timer);
          item.el.textContent = item.target;
        } else {
          item.el.textContent = String(Math.floor(Math.random() * 10));
        }
      }, 55 + index * 18);
    });
  }

  /* ---------- 4. Typewriter ---------- */
  function initTypewriter() {
    var el = document.getElementById('typed-text');
    if (!el) return;

    var text = el.getAttribute('data-text') || '';
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '█';

    if (prefersReducedMotion() || document.hidden) {
      el.textContent = text;
      el.appendChild(caret);
      return;
    }

    // El texto ya viene en el HTML (fallback si los timers están bloqueados);
    // la animación lo reescribe desde cero cuando puede correr.
    var i = 0;

    function type() {
      if (i < text.length) {
        // Al arrancar la animación se borra el texto ya visible (fallback sin timers).
        if (i === 0) el.textContent = '';
        el.textContent = text.slice(0, i + 1);
        i++;
        window.setTimeout(type, 38);
      } else {
        el.appendChild(caret);
      }
    }

    window.setTimeout(type, 350);
  }

  /* ---------- 5. Año y años de experiencia ---------- */
  function initDates() {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var yearsEl = document.getElementById('years');
    if (yearsEl) yearsEl.textContent = String(new Date().getFullYear() - START_YEAR);

    var updated = document.getElementById('last-updated');
    if (updated) {
      var now = new Date();
      var months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      updated.textContent = months[now.getMonth()] + ' de ' + now.getFullYear();
    }
  }

  /* ---------- 6. Estación: selector, badge y tema ---------- */
  function seasonFromDate(date) {
    var m = date.getMonth();
    if (m === 11 || m === 0 || m === 1) return 'winter';
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    return 'autumn';
  }

  function initSeason() {
    var select = document.getElementById('season-select');
    var badgeIcon = document.getElementById('season-icon');
    var badgeName = document.getElementById('season-name');
    var badgeMode = document.getElementById('season-mode');
    var particles = window.FlashParticles;

    function render(season, mode) {
      var label = SEASON_LABELS[season] || season;
      if (badgeIcon) badgeIcon.textContent = SEASON_ICONS[season] || '✦';
      if (badgeName) badgeName.textContent = label;
      if (badgeMode) {
        badgeMode.textContent = mode === 'auto'
          ? 'Automática según la fecha'
          : 'Forzada por ti';
      }
      if (select && select.value !== mode) select.value = mode;
    }

    if (!particles) {
      // Fallback: el módulo de partículas no cargó; se aplica el tema por fecha.
      var fallback = seasonFromDate(new Date());
      document.documentElement.setAttribute('data-season', fallback);
      render(fallback, 'auto');
      if (select) select.disabled = true;
      return;
    }

    render(particles.getSeason(), particles.getMode());

    if (particles.subscribe) {
      particles.subscribe(function (payload) {
        render(payload.season, payload.mode);
      });
    }

    if (select) {
      select.addEventListener('change', function () {
        particles.setMode(select.value, true);
      });
    }
  }

  /* ---------- Init ---------- */
  function init() {
    initMenu();
    initTicker();
    initCounter();
    initTypewriter();
    initDates();
    initSeason();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
