(function () {
  var TOTAL   = 45;
  var ANIM_MS = 650;

  var slides = [];
  for (var i = 0; i < TOTAL; i++) {
    var n = i + 1;
    slides.push('slides/slide-' + (n < 10 ? '0' + n : '' + n) + '.jpg');
  }

  var current     = 0;
  var isAnimating = false;

  // Detect touch device once
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

  // ── DOM refs ──────────────────────────────────────────────
  var frontLayer    = document.getElementById('frontLayer');
  var backLayer     = document.getElementById('backLayer');
  var frontImage    = document.getElementById('frontImage');
  var backImage     = document.getElementById('backImage');
  var prevBtn       = document.getElementById('prevBtn');
  var nextBtn       = document.getElementById('nextBtn');
  var currentNumEl  = document.getElementById('currentNum');
  var totalNumEl    = document.getElementById('totalNum');
  var progressFill  = document.getElementById('progressFill');
  var fullscreenBtn  = document.getElementById('fullscreenBtn');
  var fsIconExpand   = document.getElementById('fsIconExpand');
  var fsIconCollapse = document.getElementById('fsIconCollapse');
  var thumbToggle    = document.getElementById('thumbToggle');
  var thumbClose     = document.getElementById('thumbClose');
  var thumbPanel     = document.getElementById('thumbPanel');
  var thumbGrid      = document.getElementById('thumbGrid');
  var panelBackdrop  = document.getElementById('panelBackdrop');
  var bookStage      = document.getElementById('bookStage');

  totalNumEl.textContent = TOTAL;

  // ── Passive listener detection ────────────────────────────
  var supportsPassive = false;
  try {
    var _o = Object.defineProperty({}, 'passive', { get: function () { supportsPassive = true; } });
    window.addEventListener('_tp', null, _o);
    window.removeEventListener('_tp', null, _o);
  } catch (e) {}
  var passOpt = supportsPassive ? { passive: true } : false;

  // ── classList helpers ─────────────────────────────────────
  function add(el, c) { if (el.classList) { el.classList.add(c); } else { el.className += ' ' + c; } }
  function rem(el, c) { if (el.classList) { el.classList.remove(c); } else { el.className = el.className.replace(new RegExp('(^|\\s)' + c + '(\\s|$)', 'g'), ' '); } }
  function has(el, c) { if (el.classList) return el.classList.contains(c); return (' ' + el.className + ' ').indexOf(' ' + c + ' ') > -1; }

  // ── Preloading ────────────────────────────────────────────
  var preloaded = {};
  function preload(idx) {
    if (idx < 0 || idx >= TOTAL || preloaded[idx]) return;
    preloaded[idx] = true;
    var img = new Image();
    img.src = slides[idx];
  }

  // ── Update HUD ────────────────────────────────────────────
  function updateHUD() {
    currentNumEl.textContent = current + 1;
    progressFill.style.width = (current / (TOTAL - 1) * 100) + '%';

    // Arrow disabled states
    try {
      prevBtn.disabled = (current === 0);
      nextBtn.disabled = (current === TOTAL - 1);
    } catch (e) {
      prevBtn.style.opacity = (current === 0) ? '0.15' : '';
      nextBtn.style.opacity = (current === TOTAL - 1) ? '0.15' : '';
    }

    // Sync active thumbnail
    var cells = thumbGrid.querySelectorAll('.thumb-cell');
    for (var k = 0; k < cells.length; k++) {
      var cell = cells[k];
      var ci = parseInt(cell.getAttribute('data-idx'), 10);
      if (ci === current) { add(cell, 'active'); cell.setAttribute('aria-current', 'true'); }
      else                { rem(cell, 'active'); cell.removeAttribute('aria-current'); }
    }

    preload(current + 1);
    preload(current + 2);
    preload(current - 1);
  }

  // ── Page-flip navigation ──────────────────────────────────
  function navigate(dir) {
    if (isAnimating) return;
    var next = current + dir;
    if (next < 0 || next >= TOTAL) return;

    isAnimating = true;
    wakeUI();

    backImage.src = slides[next];
    backImage.alt = 'Slide ' + (next + 1);

    var flipCls   = dir > 0 ? 'flip-fwd'   : 'flip-bwd';
    var revealCls = dir > 0 ? 'reveal-fwd' : 'reveal-bwd';

    add(frontLayer, flipCls);
    add(backLayer,  revealCls);

    setTimeout(function () {
      current = next;
      frontImage.src = slides[current];
      frontImage.alt = 'Slide ' + (current + 1);
      rem(frontLayer, flipCls);
      rem(backLayer,  revealCls);
      isAnimating = false;
      updateHUD();
    }, ANIM_MS);
  }

  // Direct jump — no animation (thumbnail / Home / End)
  function jumpTo(idx) {
    if (idx < 0 || idx >= TOTAL || idx === current) return;
    isAnimating = false;
    current = idx;
    frontImage.src = slides[current];
    frontImage.alt = 'Slide ' + (current + 1);
    backImage.src  = slides[current];
    updateHUD();
  }

  prevBtn.addEventListener('click', function () { navigate(-1); });
  nextBtn.addEventListener('click', function () { navigate(1); });

  // ── Fullscreen ────────────────────────────────────────────
  // Feature-detect: iPhone Safari and some Android browsers
  // expose the methods but silently do nothing — detect first.
  var fsSupported = !!(
    document.fullscreenEnabled       ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled    ||
    document.msFullscreenEnabled
  );

  // iPhone Safari never supports the real Fullscreen API for arbitrary
  // elements, so the button would otherwise vanish there. Instead of
  // hiding it, fall back to a "pseudo-fullscreen" immersive mode that
  // hides the chrome (nav arrows + bottom bar) to maximize the slide.
  var pseudoFS = false;

  function getFS() {
    return document.fullscreenElement       ||
           document.webkitFullscreenElement ||
           document.mozFullScreenElement    ||
           document.msFullscreenElement     || null;
  }

  function reqFS(el) {
    try {
      var p;
      if (el.requestFullscreen)            { p = el.requestFullscreen(); }
      else if (el.webkitRequestFullscreen) { p = el.webkitRequestFullscreen(); }
      else if (el.mozRequestFullScreen)    { p = el.mozRequestFullScreen(); }
      else if (el.msRequestFullscreen)     { p = el.msRequestFullscreen(); }
      // requestFullscreen returns a Promise in modern browsers;
      // catch rejection so it never surfaces as an unhandled error
      // (iOS Safari may reject even when fsSupported is true)
      if (p && typeof p['catch'] === 'function') {
        p['catch'](function () { /* silently ignore — e.g. user denied */ });
      }
    } catch (e) { /* older browsers may throw synchronously */ }
  }

  function exitFS() {
    try {
      if (document.exitFullscreen)            { document.exitFullscreen(); }
      else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
      else if (document.mozCancelFullScreen)  { document.mozCancelFullScreen(); }
      else if (document.msExitFullscreen)     { document.msExitFullscreen(); }
    } catch (e) {}
  }

  function setPseudoFS(on) {
    pseudoFS = on;
    if (on) { add(document.body, 'pseudo-fs'); }
    else    { rem(document.body, 'pseudo-fs'); }
    syncFSIcon();
  }

  function syncFSIcon() {
    var fs = fsSupported ? !!getFS() : pseudoFS;
    if (fsIconExpand)   { fsIconExpand.style.display   = fs ? 'none'         : 'inline-block'; }
    if (fsIconCollapse) { fsIconCollapse.style.display = fs ? 'inline-block' : 'none'; }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function () {
      if (fsSupported) {
        if (!getFS()) { reqFS(document.documentElement); } else { exitFS(); }
      } else {
        setPseudoFS(!pseudoFS);
      }
    });
  }

  // Tapping/clicking the slide itself exits pseudo-fullscreen (since the
  // chrome, including this same button, is hidden while it's active).
  bookStage.addEventListener('click', function () {
    if (!fsSupported && pseudoFS) { setPseudoFS(false); }
  });

  document.addEventListener('fullscreenchange',       syncFSIcon);
  document.addEventListener('webkitfullscreenchange', syncFSIcon);
  document.addEventListener('mozfullscreenchange',    syncFSIcon);
  document.addEventListener('MSFullscreenChange',     syncFSIcon);


  // ── Thumbnail panel ───────────────────────────────────────
  function buildThumbs() {
    for (var j = 0; j < TOTAL; j++) {
      (function (idx) {
        var cell = document.createElement('div');
        cell.className = 'thumb-cell';
        cell.setAttribute('data-idx', idx);
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', 'Slide ' + (idx + 1));

        var img = document.createElement('img');
        img.src = slides[idx];
        img.alt = 'Slide ' + (idx + 1);
        img.setAttribute('loading', 'lazy');

        var badge = document.createElement('span');
        badge.className = 'thumb-badge';
        badge.textContent = idx + 1;

        cell.appendChild(img);
        cell.appendChild(badge);

        function go() { jumpTo(idx); closePanel(); }
        cell.addEventListener('click', go);
        cell.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.keyCode === 13 || e.key === ' ' || e.keyCode === 32) { go(); }
        });
        thumbGrid.appendChild(cell);
      })(j);
    }
  }

  function openPanel() {
    add(thumbPanel, 'open');
    add(panelBackdrop, 'visible');
    thumbPanel.setAttribute('aria-hidden', 'false');
    clearTimeout(hideTimer);
    rem(document.body, 'ui-hidden');
    setTimeout(function () {
      var active = thumbGrid.querySelector('.thumb-cell.active');
      if (active) {
        try { active.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        catch (e) { try { active.scrollIntoView(); } catch (e2) {} }
      }
    }, 60);
  }

  function closePanel() {
    rem(thumbPanel, 'open');
    rem(panelBackdrop, 'visible');
    thumbPanel.setAttribute('aria-hidden', 'true');
    wakeUI();
  }

  thumbToggle.addEventListener('click', function () { if (has(thumbPanel, 'open')) { closePanel(); } else { openPanel(); } });
  thumbClose.addEventListener('click', closePanel);
  panelBackdrop.addEventListener('click', closePanel);

  // ── Keyboard ──────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var key  = e.key;
    var code = e.keyCode || e.which;
    if (has(thumbPanel, 'open')) {
      if (key === 'Escape' || code === 27) { closePanel(); }
      return;
    }
    if ((key === 'Escape' || code === 27) && !fsSupported && pseudoFS) { setPseudoFS(false); return; }
    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || code === 39 || code === 34 || code === 32) {
      if (e.preventDefault) { e.preventDefault(); }
      navigate(1);
    } else if (key === 'ArrowLeft' || key === 'PageUp' || code === 37 || code === 33) {
      if (e.preventDefault) { e.preventDefault(); }
      navigate(-1);
    } else if (key === 'Home' || code === 36) { jumpTo(0); }
    else if (key === 'End'  || code === 35)  { jumpTo(TOTAL - 1); }
  });

  // ── Touch / swipe ─────────────────────────────────────────
  var tx = null, ty = null;

  bookStage.addEventListener('touchstart', function (e) {
    // Don't start tracking if panel is open (backdrop should handle close)
    if (has(thumbPanel, 'open')) return;
    if (e.touches.length !== 1) return; // ignore multi-touch (pinch)
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
    wakeUI();
  }, passOpt);

  bookStage.addEventListener('touchend', function (e) {
    if (tx === null) return;
    if (has(thumbPanel, 'open')) { tx = null; ty = null; return; }

    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;

    // Only navigate if horizontal swipe dominates and threshold met
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      dismissSwipeHint();
      if (dx < 0) { navigate(1); } else { navigate(-1); }
    }
    tx = null; ty = null;
  }, passOpt);

  // Cancel tracking on multi-touch
  bookStage.addEventListener('touchcancel', function () {
    tx = null; ty = null;
  }, passOpt);

  // ── Auto-hide UI (desktop/mouse only — CSS overrides for touch) ──
  var hideTimer = null;
  var HIDE_AFTER = 3500;

  function wakeUI() {
    rem(document.body, 'ui-hidden');
    clearTimeout(hideTimer);
    // Only schedule auto-hide on non-touch devices
    if (!isTouch && !has(thumbPanel, 'open')) {
      hideTimer = setTimeout(function () {
        add(document.body, 'ui-hidden');
      }, HIDE_AFTER);
    }
  }

  document.addEventListener('mousemove', wakeUI);
  document.addEventListener('mousedown', wakeUI);

  // ── Swipe hint (one-time, touch devices only) ─────────────
  var swipeHintShown = false;
  function showSwipeHint() {
    if (swipeHintShown || !isTouch) return;
    swipeHintShown = true;
    var hint = document.createElement('div');
    hint.className = 'swipe-hint';
    hint.textContent = 'Swipe to turn pages';
    document.body.appendChild(hint);
    setTimeout(function () {
      if (hint.parentNode) { hint.parentNode.removeChild(hint); }
    }, 3200);
  }

  function dismissSwipeHint() {
    swipeHintShown = true; // prevent showing again
  }

  // ── Portrait hint (touch + portrait mode) ─────────────────
  function maybeShowPortraitHint() {
    if (!isTouch) return;
    if (window.innerWidth < window.innerHeight && window.innerWidth < 768) {
      var hint = document.createElement('div');
      hint.className = 'portrait-hint';
      hint.textContent = '↻  Rotate for best view';
      document.body.appendChild(hint);
      setTimeout(function () {
        if (hint.parentNode) { hint.parentNode.removeChild(hint); }
      }, 4200);
    }
  }

  // ── Init ──────────────────────────────────────────────────
  buildThumbs();

  frontImage.src = slides[0];
  frontImage.alt = 'Slide 1';
  backImage.src  = slides[0];
  backImage.alt  = 'Slide 1';

  updateHUD();
  wakeUI();

  // Preload first few slides
  preload(1); preload(2); preload(3);

  // Show hints after a short delay on first load
  setTimeout(function () {
    showSwipeHint();
    maybeShowPortraitHint();
  }, 1200);

  // Re-evaluate portrait hint on orientation change
  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', function () {
      setTimeout(maybeShowPortraitHint, 400);
    });
  }
})();
