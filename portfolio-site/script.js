(function () {
  var TOTAL   = 41;
  var ANIM_MS = 650; // must match --anim-dur in CSS

  var slides = [];
  for (var i = 0; i < TOTAL; i++) {
    var n = i + 1;
    slides.push('slides/slide-' + (n < 10 ? '0' + n : '' + n) + '.jpg');
  }

  var current     = 0;
  var isAnimating = false;

  // ── DOM refs ──────────────────────────────────────────────
  var frontLayer   = document.getElementById('frontLayer');
  var backLayer    = document.getElementById('backLayer');
  var frontImage   = document.getElementById('frontImage');
  var backImage    = document.getElementById('backImage');
  var prevBtn      = document.getElementById('prevBtn');
  var nextBtn      = document.getElementById('nextBtn');
  var currentNumEl = document.getElementById('currentNum');
  var totalNumEl   = document.getElementById('totalNum');
  var progressFill = document.getElementById('progressFill');
  var fullscreenBtn   = document.getElementById('fullscreenBtn');
  var fsIconExpand    = document.getElementById('fsIconExpand');
  var fsIconCollapse  = document.getElementById('fsIconCollapse');
  var thumbToggle     = document.getElementById('thumbToggle');
  var thumbClose      = document.getElementById('thumbClose');
  var thumbPanel      = document.getElementById('thumbPanel');
  var thumbGrid       = document.getElementById('thumbGrid');
  var panelBackdrop   = document.getElementById('panelBackdrop');

  totalNumEl.textContent = TOTAL;

  // ── Passive listener detection ────────────────────────────
  var supportsPassive = false;
  try {
    var o = Object.defineProperty({}, 'passive', { get: function () { supportsPassive = true; } });
    window.addEventListener('_t', null, o);
    window.removeEventListener('_t', null, o);
  } catch (e) {}
  var passOpt = supportsPassive ? { passive: true } : false;

  // ── classList helpers ─────────────────────────────────────
  function add(el, c)    { if (el.classList) { el.classList.add(c); } else { el.className += ' ' + c; } }
  function rem(el, c)    { if (el.classList) { el.classList.remove(c); } else { el.className = el.className.replace(new RegExp('(^|\\s)' + c + '(\\s|$)', 'g'), ' '); } }
  function has(el, c)    { if (el.classList) return el.classList.contains(c); return (' ' + el.className + ' ').indexOf(' ' + c + ' ') > -1; }

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

    if (prevBtn.disabled !== undefined) {
      prevBtn.disabled = (current === 0);
      nextBtn.disabled = (current === TOTAL - 1);
    } else {
      prevBtn.style.opacity = current === 0          ? '0.15' : '';
      nextBtn.style.opacity = current === TOTAL - 1  ? '0.15' : '';
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

    // Load destination onto back layer
    backImage.src = slides[next];
    backImage.alt = 'Slide ' + (next + 1);

    var flipCls   = dir > 0 ? 'flip-fwd'    : 'flip-bwd';
    var revealCls = dir > 0 ? 'reveal-fwd'  : 'reveal-bwd';

    // Trigger both animations simultaneously
    add(frontLayer, flipCls);
    add(backLayer,  revealCls);

    setTimeout(function () {
      current = next;

      // Snap front layer to new slide (it's invisible at 180° so no flash)
      frontImage.src = slides[current];
      frontImage.alt = 'Slide ' + (current + 1);

      // Remove animation classes — front layer returns to 0° instantly
      rem(frontLayer, flipCls);
      rem(backLayer,  revealCls);

      isAnimating = false;
      updateHUD();
    }, ANIM_MS);
  }

  // Direct jump (thumbnail click, Home/End) — no animation
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
  function getFS() { return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null; }
  function reqFS(el) {
    if (el.requestFullscreen)          { el.requestFullscreen(); }
    else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    else if (el.mozRequestFullScreen)    { el.mozRequestFullScreen(); }
    else if (el.msRequestFullscreen)     { el.msRequestFullscreen(); }
  }
  function exitFS() {
    if (document.exitFullscreen)           { document.exitFullscreen(); }
    else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    else if (document.mozCancelFullScreen)  { document.mozCancelFullScreen(); }
    else if (document.msExitFullscreen)     { document.msExitFullscreen(); }
  }
  function syncFSIcon() {
    var fs = !!getFS();
    if (fsIconExpand)   { fsIconExpand.style.display   = fs ? 'none'         : 'inline-block'; }
    if (fsIconCollapse) { fsIconCollapse.style.display = fs ? 'inline-block' : 'none'; }
  }
  fullscreenBtn.addEventListener('click', function () { if (!getFS()) { reqFS(document.documentElement); } else { exitFS(); } });
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

        function go() {
          jumpTo(idx);
          closePanel();
        }
        cell.addEventListener('click', go);
        cell.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.keyCode === 13 || e.key === ' ' || e.keyCode === 32) { go(); }
        });

        thumbGrid.appendChild(cell);
      })(j);
    }
  }

  function openPanel() {
    add(thumbPanel,    'open');
    add(panelBackdrop, 'visible');
    thumbPanel.setAttribute('aria-hidden', 'false');
    clearTimeout(hideTimer); // keep UI visible while panel is open
    rem(document.body, 'ui-hidden');
    // Scroll active cell into view
    setTimeout(function () {
      var activeCell = thumbGrid.querySelector('.thumb-cell.active');
      if (activeCell) {
        try { activeCell.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        catch (e) { try { activeCell.scrollIntoView(); } catch (e2) {} }
      }
    }, 60);
  }

  function closePanel() {
    rem(thumbPanel,    'open');
    rem(panelBackdrop, 'visible');
    thumbPanel.setAttribute('aria-hidden', 'true');
    wakeUI(); // restart auto-hide timer
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

    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || code === 39 || code === 34 || code === 32) {
      if (e.preventDefault) { e.preventDefault(); }
      navigate(1);
    } else if (key === 'ArrowLeft' || key === 'PageUp' || code === 37 || code === 33) {
      if (e.preventDefault) { e.preventDefault(); }
      navigate(-1);
    } else if (key === 'Home' || code === 36) {
      jumpTo(0);
    } else if (key === 'End' || code === 35) {
      jumpTo(TOTAL - 1);
    }
  });

  // ── Swipe (tracks Y to avoid scroll conflicts) ────────────
  var tx = null, ty = null;
  var bookStage = document.getElementById('bookStage');

  bookStage.addEventListener('touchstart', function (e) {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, passOpt);

  bookStage.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) { navigate(1); } else { navigate(-1); }
    }
    tx = null; ty = null;
  }, passOpt);

  // ── Auto-hide UI ──────────────────────────────────────────
  var hideTimer = null;
  var HIDE_AFTER = 3500;

  function wakeUI() {
    rem(document.body, 'ui-hidden');
    clearTimeout(hideTimer);
    if (!has(thumbPanel, 'open')) {
      hideTimer = setTimeout(function () {
        add(document.body, 'ui-hidden');
      }, HIDE_AFTER);
    }
  }

  document.addEventListener('mousemove', wakeUI);
  document.addEventListener('mousedown', wakeUI);
  bookStage.addEventListener('touchstart', wakeUI, passOpt);

  // ── Init ──────────────────────────────────────────────────
  buildThumbs();

  frontImage.src = slides[0];
  frontImage.alt = 'Slide 1';
  backImage.src  = slides[0];
  backImage.alt  = 'Slide 1';

  updateHUD();
  wakeUI();

  // Preload first few slides immediately
  preload(1); preload(2); preload(3);
})();
