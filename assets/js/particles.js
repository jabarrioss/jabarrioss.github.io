/* ==========================================================================
   particles.js — Sistema de partículas estacionales para el fondo.
   Canvas 2D, vanilla JS, sin dependencias. Expone window.FlashParticles.
   Las partículas y el tema de color cambian según la estación:
   Invierno / Primavera / Verano / Otoño (hemisferio norte, Colombia).
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'jbs.season';
  var TRANSITION_MS = 600;

  /* ---------- Detección de estación ---------- */
  // Meses 0-11 en orden cronológico: dic, ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov
  function seasonFromDate(date) {
    var m = date.getMonth(); // 0 = enero
    if (m === 11 || m === 0 || m === 1) return 'winter';
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    return 'autumn';
  }

  /* ---------- Configuración por estación ---------- */
  var CONFIG = {
    winter: {
      label: 'Invierno',
      icon: '❄',
      tint: '#8fd8ff',
      groups: [
        { type: 'snow', count: 110 },
        { type: 'sparkle', count: 10 }
      ]
    },
    spring: {
      label: 'Primavera',
      icon: '❀',
      tint: '#9df0b6',
      groups: [
        { type: 'rain', count: 90 },
        { type: 'petal', count: 18 }
      ]
    },
    summer: {
      label: 'Verano',
      icon: '☀',
      tint: '#ffd76a',
      groups: [
        { type: 'firefly', count: 30 },
        { type: 'pollen', count: 40 }
      ]
    },
    autumn: {
      label: 'Otoño',
      icon: '🍂',
      tint: '#ffb168',
      groups: [
        { type: 'leaf', count: 45 }
      ]
    }
  };

  var LEAF_COLORS = ['#e08a2c', '#c8561f', '#d9a441', '#a9451c', '#e5b25c'];
  var PETAL_COLORS = ['#ffd3e0', '#ffe9f1', '#ffc2d4', '#fff6f9'];
  var SNOW_COLORS = ['#ffffff', '#e8f4ff', '#d8ecff'];

  /* ---------- Estado ---------- */
  var canvas = null;
  var ctx = null;
  var W = 0;
  var H = 0;
  var dpr = 1;
  var rafId = 0;
  var lastTime = 0;
  var running = false;
  var items = [];          // capa actual
  var transition = null;   // { from: [], to: [], t: 0 }
  var season = 'winter';
  var mode = 'auto';
  var modeQuery = null;
  var reducedQuery = null;
  var subscribers = [];
  var warned = false;

  /* ---------- Utilidades ---------- */
  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* modo privado */ }
  }

  function prefersReducedMotion() {
    if (!reducedQuery) {
      try {
        reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      } catch (e) {
        return false;
      }
    }
    return !!reducedQuery.matches;
  }

  function areaFactor() {
    var area = W * H;
    var f = area / 1000000;
    if (f > 1) f = 1;
    if (f < 0.4) f = 0.4;
    return f;
  }

  /* ---------- Construcción de partículas ---------- */
  function makeSnow() {
    var r = rand(1, 3.2);
    return {
      type: 'snow',
      x: rand(0, W),
      y: rand(-H, H),
      r: r,
      speed: rand(18, 55) * (1 + r / 4),
      swayAmp: rand(8, 28),
      swayFreq: rand(0.4, 1.1),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.45, 0.95),
      color: pick(SNOW_COLORS)
    };
  }

  function makeSparkle() {
    return {
      type: 'sparkle',
      x: rand(0, W),
      y: rand(0, H),
      r: rand(3, 7),
      life: rand(0, 1),
      maxLife: rand(1.2, 2.6),
      speed: rand(8, 22),
      alpha: 0
    };
  }

  function makeRain() {
    return {
      type: 'rain',
      x: rand(-40, W),
      y: rand(-H, H),
      len: rand(9, 20),
      speed: rand(520, 900),
      alpha: rand(0.18, 0.5),
      color: 'rgba(190, 225, 255, 0.9)'
    };
  }

  function makePetal() {
    return {
      type: 'petal',
      x: rand(0, W),
      y: rand(-H, H),
      size: rand(3.5, 7.5),
      speed: rand(28, 62),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-1.6, 1.6),
      swayAmp: rand(12, 34),
      swayFreq: rand(0.3, 0.9),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.55, 0.9),
      color: pick(PETAL_COLORS)
    };
  }

  function makeFirefly() {
    return {
      type: 'firefly',
      x: rand(0, W),
      y: rand(0, H),
      r: rand(1.4, 2.8),
      vx: rand(-14, 14),
      vy: rand(-10, 10),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.9, 2.2),
      alpha: 0,
      color: '#fff2a8'
    };
  }

  function makePollen() {
    return {
      type: 'pollen',
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.8, 2.2),
      driftX: rand(-9, 9),
      driftY: rand(-6, -1),
      swayAmp: rand(5, 16),
      swayFreq: rand(0.3, 0.8),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.25, 0.6),
      color: '#ffe9a8'
    };
  }

  function makeLeaf() {
    return {
      type: 'leaf',
      x: rand(0, W),
      y: rand(-H, H),
      size: rand(6, 12),
      speed: rand(34, 78),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-2.2, 2.2),
      swayAmp: rand(18, 55),
      swayFreq: rand(0.35, 0.95),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.7, 1),
      color: pick(LEAF_COLORS)
    };
  }

  var MAKERS = {
    snow: makeSnow,
    sparkle: makeSparkle,
    rain: makeRain,
    petal: makePetal,
    firefly: makeFirefly,
    pollen: makePollen,
    leaf: makeLeaf
  };

  function buildItems(key) {
    var cfg = CONFIG[key];
    if (!cfg) return [];
    var factor = areaFactor();
    var list = [];
    for (var g = 0; g < cfg.groups.length; g++) {
      var group = cfg.groups[g];
      var maker = MAKERS[group.type];
      if (!maker) continue;
      var n = Math.max(1, Math.round(group.count * factor));
      for (var i = 0; i < n; i++) list.push(maker());
    }
    return list;
  }

  /* ---------- Actualización ---------- */
  function updateItem(p, dt, time) {
    switch (p.type) {
      case 'snow':
        p.y += p.speed * dt;
        p.x += Math.sin(time * p.swayFreq + p.phase) * p.swayAmp * dt;
        if (p.y > H + 10) { p.y = -10; p.x = rand(0, W); }
        if (p.x < -20) p.x = W + 10;
        if (p.x > W + 20) p.x = -10;
        break;

      case 'sparkle':
        p.life += dt;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.maxLife = rand(1.2, 2.6);
          p.x = rand(0, W);
          p.y = rand(0, H);
          p.r = rand(3, 7);
        }
        p.y -= p.speed * dt;
        p.alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.85;
        if (p.y < -10) p.y = H + 10;
        break;

      case 'rain':
        p.y += p.speed * dt;
        p.x += p.speed * 0.18 * dt;
        if (p.y > H + 20) { p.y = rand(-120, -10); p.x = rand(-40, W); }
        if (p.x > W + 20) p.x = -40;
        break;

      case 'petal':
        p.y += p.speed * dt;
        p.x += Math.sin(time * p.swayFreq + p.phase) * p.swayAmp * dt + 8 * dt;
        p.rot += p.rotSpeed * dt;
        if (p.y > H + 14) { p.y = -14; p.x = rand(0, W); }
        if (p.x > W + 20) p.x = -10;
        if (p.x < -20) p.x = W + 10;
        break;

      case 'firefly':
        p.vx += rand(-18, 18) * dt;
        p.vy += rand(-18, 18) * dt;
        p.vx = Math.max(-26, Math.min(26, p.vx));
        p.vy = Math.max(-22, Math.min(22, p.vy));
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.pulse += p.pulseSpeed * dt;
        p.alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(p.pulse));
        if (p.x < -20) { p.x = W + 10; p.vx = -Math.abs(p.vx); }
        if (p.x > W + 20) { p.x = -10; p.vx = Math.abs(p.vx); }
        if (p.y < -20) { p.y = H + 10; p.vy = -Math.abs(p.vy); }
        if (p.y > H + 20) { p.y = -10; p.vy = Math.abs(p.vy); }
        break;

      case 'pollen':
        p.x += (p.driftX + Math.sin(time * p.swayFreq + p.phase) * p.swayAmp) * dt;
        p.y += p.driftY * dt;
        if (p.y < -10) { p.y = H + 10; p.x = rand(0, W); }
        if (p.x > W + 10) p.x = -10;
        if (p.x < -10) p.x = W + 10;
        break;

      case 'leaf':
        p.y += p.speed * dt;
        p.x += Math.sin(time * p.swayFreq + p.phase) * p.swayAmp * dt + 14 * dt;
        p.rot += p.rotSpeed * dt;
        if (p.y > H + 18) { p.y = -18; p.x = rand(0, W); }
        if (p.x > W + 20) p.x = -10;
        if (p.x < -20) p.x = W + 10;
        break;
    }
  }

  /* ---------- Dibujo ---------- */
  var glowSprite = null;

  function buildGlowSprite() {
    var size = 64;
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var g = c.getContext('2d');
    if (!g) return null;
    var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 250, 200, 1)');
    grad.addColorStop(0.25, 'rgba(255, 240, 150, 0.7)');
    grad.addColorStop(1, 'rgba(255, 230, 120, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function drawItem(p, layerAlpha) {
    var a = layerAlpha * (p.alpha === undefined ? 1 : p.alpha);
    switch (p.type) {
      case 'snow':
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sparkle':
        if (a <= 0.01) break;
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#dff2ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - p.r, p.y);
        ctx.lineTo(p.x + p.r, p.y);
        ctx.moveTo(p.x, p.y - p.r);
        ctx.lineTo(p.x, p.y + p.r);
        ctx.stroke();
        break;

      case 'rain':
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.len * 0.18, p.y + p.len);
        ctx.stroke();
        break;

      case 'petal':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case 'firefly':
        if (glowSprite) {
          var size = p.r * 9;
          ctx.globalAlpha = a * 0.9;
          ctx.drawImage(glowSprite, p.x - size / 2, p.y - size / 2, size, size);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'pollen':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'leaf':
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.quadraticCurveTo(0, -p.size * 0.75, p.size, 0);
        ctx.quadraticCurveTo(0, p.size * 0.75, -p.size, 0);
        ctx.fill();
        ctx.restore();
        break;
    }
  }

  function drawLayer(list, alpha) {
    if (!list.length) return;
    for (var i = 0; i < list.length; i++) {
      drawItem(list[i], alpha);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Bucle ---------- */
  function frame(time) {
    if (!running) return;
    var dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
    lastTime = time;
    var t = time / 1000;

    ctx.clearRect(0, 0, W, H);

    if (transition) {
      transition.t += dt * 1000;
      var k = Math.min(1, transition.t / TRANSITION_MS);
      var eased = k * k * (3 - 2 * k);

      for (var i = 0; i < transition.from.length; i++) updateItem(transition.from[i], dt, t);
      for (var j = 0; j < transition.to.length; j++) updateItem(transition.to[j], dt, t);

      drawLayer(transition.from, 1 - eased);
      drawLayer(transition.to, eased);

      if (k >= 1) {
        items = transition.to;
        transition = null;
      }
    } else {
      for (var m = 0; m < items.length; m++) updateItem(items[m], dt, t);
      drawLayer(items, 1);
    }

    rafId = window.requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastTime = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (!running) return;
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ---------- Modo estático (reduced motion) ---------- */
  function drawStatic() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < items.length; i++) drawItem(items[i], 1);
    ctx.globalAlpha = 1;
  }

  /* ---------- Tema y estado ---------- */
  function applyTheme(key) {
    document.documentElement.setAttribute('data-season', key);
  }

  function notify() {
    var payload = { season: season, mode: mode, label: CONFIG[season].label, icon: CONFIG[season].icon };
    for (var i = 0; i < subscribers.length; i++) {
      try { subscribers[i](payload); } catch (e) { /* un suscriptor no debe romper el resto */ }
    }
    try {
      document.dispatchEvent(new CustomEvent('jbs:season', { detail: payload }));
    } catch (e) { /* CustomEvent no soportado */ }
  }

  function resolveMode() {
    var stored = safeStorageGet(STORAGE_KEY);
    if (stored && CONFIG[stored]) return stored;
    return 'auto';
  }

  function resolveSeason(currentMode) {
    if (currentMode && currentMode !== 'auto' && CONFIG[currentMode]) return currentMode;
    return seasonFromDate(new Date());
  }

  function applyMode(nextMode, animate) {
    var prevSeason = season;
    mode = (nextMode === 'auto' || CONFIG[nextMode]) ? nextMode : 'auto';
    season = resolveSeason(mode);

    safeStorageSet(STORAGE_KEY, mode);
    applyTheme(season);

    if (!ctx) {
      notify();
      return;
    }

    var next = buildItems(season);
    if (animate && !prefersReducedMotion() && prevSeason !== season && items.length) {
      transition = { from: items, to: next, t: 0 };
      items = next;
      startLoop();
    } else {
      transition = null;
      items = next;
      if (prefersReducedMotion()) {
        stopLoop();
        drawStatic();
      } else {
        startLoop();
      }
    }

    notify();
  }

  /* ---------- Canvas: tamaño y resize ---------- */
  function resize() {
    if (!canvas || !ctx) return;
    var newW = window.innerWidth;
    var newH = window.innerHeight;
    if (newW === W && newH === H) return;

    var ratioX = newW / (W || newW);
    var ratioY = newH / (H || newH);
    W = newW;
    H = newH;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    scaleList(items, ratioX, ratioY);
    if (transition) {
      scaleList(transition.from, ratioX, ratioY);
      scaleList(transition.to, ratioX, ratioY);
    }
  }

  function scaleList(list, rx, ry) {
    for (var i = 0; i < list.length; i++) {
      list[i].x *= rx;
      list[i].y *= ry;
    }
  }

  var resizeTimer = 0;
  function onResize() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resizeTimer = 0;
      resize();
      if (prefersReducedMotion()) drawStatic();
    }, 150);
  }

  /* ---------- Init ---------- */
  function init() {
    canvas = document.getElementById('bg-particles');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) {
      if (!warned) {
        warned = true;
        if (window.console && console.warn) {
          console.warn('FlashParticles: contexto 2D no disponible; el sitio sigue sin partículas.');
        }
      }
      mode = resolveMode();
      season = resolveSeason(mode);
      applyTheme(season);
      notify();
      return;
    }

    glowSprite = buildGlowSprite();

    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    mode = resolveMode();
    season = resolveSeason(mode);
    applyTheme(season);
    items = buildItems(season);

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopLoop();
      } else if (!prefersReducedMotion()) {
        startLoop();
      }
    });

    try {
      modeQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (modeQuery.addEventListener) {
        modeQuery.addEventListener('change', function () {
          if (prefersReducedMotion()) {
            stopLoop();
            drawStatic();
          } else {
            startLoop();
          }
        });
      }
    } catch (e) { /* sin soporte */ }

    if (prefersReducedMotion()) {
      drawStatic();
    } else {
      startLoop();
    }

    notify();
  }

  /* ---------- API pública ---------- */
  window.FlashParticles = {
    init: init,
    getSeason: function () { return season; },
    getMode: function () { return mode; },
    getConfig: function () { return CONFIG[season]; },
    setMode: function (nextMode, animate) { applyMode(nextMode, animate !== false); },
    subscribe: function (fn) {
      if (typeof fn === 'function') subscribers.push(fn);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
