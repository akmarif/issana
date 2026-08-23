(function () {
  var TOTAL_SLIDES = 41;
  var slides = [];
  for (var i = 0; i < TOTAL_SLIDES; i++) {
    var num = i + 1;
    var padded = num < 10 ? '0' + num : '' + num;
    slides.push('slides/slide-' + padded + '.jpg');
  }

  var currentIndex = 0;

  var slideImage       = document.getElementById('slideImage');
  var currentIndexEl   = document.getElementById('currentIndex');
  var totalCountEl     = document.getElementById('totalCount');
  var thumbList        = document.getElementById('thumbList');
  var prevBtn          = document.getElementById('prevBtn');
  var nextBtn          = document.getElementById('nextBtn');
  var stagePrevBtn     = document.getElementById('stagePrevBtn');
  var stageNextBtn     = document.getElementById('stageNextBtn');
  var fullscreenBtn    = document.getElementById('fullscreenBtn');
  var toggleSidebarBtn = document.getElementById('toggleSidebar');
  var closeSidebarBtn  = document.getElementById('closeSidebar');
  var sidebar          = document.getElementById('sidebar');
  var backdrop         = document.getElementById('sidebarBackdrop');
  var fsIconExpand     = document.getElementById('fsIconExpand');
  var fsIconCollapse   = document.getElementById('fsIconCollapse');

  totalCountEl.textContent = TOTAL_SLIDES;

  // ── Passive event listener feature detection ─────────────
  var supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () { supportsPassive = true; }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}
  var passiveOpt = supportsPassive ? { passive: true } : false;

  // ── classList helpers (IE11 toggle-force not supported) ──
  function addClass(el, cls) {
    if (el.classList) { el.classList.add(cls); }
    else { el.className += ' ' + cls; }
  }
  function removeClass(el, cls) {
    if (el.classList) { el.classList.remove(cls); }
    else { el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g'), ' '); }
  }
  function hasClass(el, cls) {
    if (el.classList) return el.classList.contains(cls);
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
  function toggleClass(el, cls) {
    if (hasClass(el, cls)) { removeClass(el, cls); } else { addClass(el, cls); }
  }

  // ── Sidebar open/close ────────────────────────────────────
  function isDesktop() {
    return window.innerWidth >= 1100;
  }

  function openSidebar() {
    removeClass(sidebar, 'collapsed');
    if (!isDesktop()) {
      addClass(backdrop, 'visible');
    }
  }

  function closeSidebar() {
    addClass(sidebar, 'collapsed');
    removeClass(backdrop, 'visible');
  }

  function isSidebarOpen() {
    return !hasClass(sidebar, 'collapsed');
  }

  toggleSidebarBtn.addEventListener('click', function () {
    if (isSidebarOpen()) { closeSidebar(); } else { openSidebar(); }
  });

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', closeSidebar);
  }

  backdrop.addEventListener('click', closeSidebar);

  // ── Thumbnail rendering ───────────────────────────────────
  function renderThumbs() {
    thumbList.innerHTML = '';
    for (var j = 0; j < slides.length; j++) {
      (function (idx) {
        var item = document.createElement('div');
        item.className = 'thumb-item';
        item.setAttribute('data-index', idx);
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', 'Go to slide ' + (idx + 1));

        var numSpan = document.createElement('span');
        numSpan.className = 'thumb-num';
        numSpan.textContent = idx + 1;

        var img = document.createElement('img');
        img.alt = 'Slide ' + (idx + 1);
        img.setAttribute('loading', 'lazy');
        img.src = slides[idx];

        item.appendChild(numSpan);
        item.appendChild(img);

        item.addEventListener('click', function () {
          goTo(idx);
          // Auto-close sidebar on mobile after selection
          if (!isDesktop()) { closeSidebar(); }
        });
        // Keyboard activation for accessibility
        item.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.keyCode === 13 || e.key === ' ' || e.keyCode === 32) {
            goTo(idx);
            if (!isDesktop()) { closeSidebar(); }
          }
        });

        thumbList.appendChild(item);
      })(j);
    }
  }

  // ── scrollIntoView with options fallback ─────────────────
  function scrollThumbIntoView(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) {
      try { el.scrollIntoView(false); } catch (e2) {}
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function goTo(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return;
    currentIndex = index;
    slideImage.src = slides[currentIndex];
    slideImage.alt = 'Slide ' + (currentIndex + 1);
    currentIndexEl.textContent = currentIndex + 1;

    var items = thumbList.querySelectorAll('.thumb-item');
    var activeThumb = null;
    for (var k = 0; k < items.length; k++) {
      var el = items[k];
      var elIdx = parseInt(el.getAttribute('data-index'), 10);
      if (elIdx === currentIndex) {
        addClass(el, 'active');
        el.setAttribute('aria-current', 'true');
        activeThumb = el;
      } else {
        removeClass(el, 'active');
        el.removeAttribute('aria-current');
      }
    }
    scrollThumbIntoView(activeThumb);
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  if (stagePrevBtn) { stagePrevBtn.addEventListener('click', prev); }
  if (stageNextBtn) { stageNextBtn.addEventListener('click', next); }

  // ── Fullscreen API (vendor prefix fallback) ───────────────
  function getFullscreenElement() {
    return document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement
      || null;
  }
  function requestFullscreen(el) {
    if (el.requestFullscreen)       return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen)    return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)     return el.msRequestFullscreen();
  }
  function exitFullscreen() {
    if (document.exitFullscreen)        return document.exitFullscreen();
    if (document.webkitExitFullscreen)  return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)   return document.mozCancelFullScreen();
    if (document.msExitFullscreen)      return document.msExitFullscreen();
  }
  function updateFullscreenIcon() {
    var isFs = !!getFullscreenElement();
    if (fsIconExpand)   fsIconExpand.style.display   = isFs ? 'none'         : 'inline-block';
    if (fsIconCollapse) fsIconCollapse.style.display = isFs ? 'inline-block' : 'none';
  }
  fullscreenBtn.addEventListener('click', function () {
    if (!getFullscreenElement()) {
      var result = requestFullscreen(document.documentElement);
      if (result && result.catch) { result.catch(function () {}); }
    } else {
      exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange',       updateFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
  document.addEventListener('mozfullscreenchange',    updateFullscreenIcon);
  document.addEventListener('MSFullscreenChange',     updateFullscreenIcon);

  // ── Keyboard navigation (e.key + keyCode fallback) ────────
  document.addEventListener('keydown', function (e) {
    var key  = e.key;
    var code = e.keyCode || e.which;
    // Don't interfere when sidebar thumb list is focused
    if (document.activeElement && hasClass(document.activeElement, 'thumb-item')) return;

    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' ||
        code === 39 || code === 34 || code === 32) {
      if (e.preventDefault) { e.preventDefault(); }
      next();
    } else if (key === 'ArrowLeft' || key === 'PageUp' ||
               code === 37 || code === 33) {
      if (e.preventDefault) { e.preventDefault(); }
      prev();
    } else if (key === 'Home' || code === 36) {
      goTo(0);
    } else if (key === 'End' || code === 35) {
      goTo(TOTAL_SLIDES - 1);
    } else if (key === 'Escape' || code === 27) {
      if (isSidebarOpen() && !isDesktop()) { closeSidebar(); }
    }
  });

  // ── Touch / swipe (track Y delta to avoid scroll conflict) ─
  var touchStartX = null;
  var touchStartY = null;
  var stage = document.getElementById('stage');

  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, passiveOpt);

  stage.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    // Only trigger if horizontal movement dominates and is large enough
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) { next(); } else { prev(); }
    }
    touchStartX = null;
    touchStartY = null;
  }, passiveOpt);

  // ── Responsive: handle sidebar state on resize/orientation ─
  function onResize() {
    if (isDesktop()) {
      // Open sidebar on desktop; remove backdrop
      openSidebar();
      removeClass(backdrop, 'visible');
    } else {
      // Collapse sidebar on small screens unless user explicitly opened it
      // We only auto-close; if user reopened we respect that.
    }
  }

  // Debounce resize handler
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) { clearTimeout(resizeTimer); }
    resizeTimer = setTimeout(onResize, 150);
  });

  // orientationchange fires before resize on some browsers
  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', function () {
      setTimeout(onResize, 300);
    });
  }

  // ── Init ──────────────────────────────────────────────────
  renderThumbs();

  // Start with sidebar open on desktop, closed on mobile/tablet
  if (isDesktop()) {
    openSidebar();
  } else {
    closeSidebar();
  }

  goTo(0);
})();
