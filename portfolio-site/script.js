(function () {
  var TOTAL_SLIDES = 41;
  var slides = [];
  for (var i = 0; i < TOTAL_SLIDES; i++) {
    var num = i + 1;
    var padded = num < 10 ? '0' + num : '' + num;
    slides.push('slides/slide-' + padded + '.jpg');
  }

  var currentIndex = 0;

  var slideImage      = document.getElementById('slideImage');
  var currentIndexEl  = document.getElementById('currentIndex');
  var totalCountEl    = document.getElementById('totalCount');
  var thumbList       = document.getElementById('thumbList');
  var prevBtn         = document.getElementById('prevBtn');
  var nextBtn         = document.getElementById('nextBtn');
  var fullscreenBtn   = document.getElementById('fullscreenBtn');
  var toggleSidebarBtn = document.getElementById('toggleSidebar');
  var sidebar         = document.getElementById('sidebar');
  var fsIconExpand    = document.getElementById('fsIconExpand');
  var fsIconCollapse  = document.getElementById('fsIconCollapse');

  totalCountEl.textContent = TOTAL_SLIDES;

  // --- Passive event listener feature detection ---
  var supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () { supportsPassive = true; }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}
  var passiveOpt = supportsPassive ? { passive: true } : false;

  // --- classList helpers for IE11 (toggle with force arg not supported) ---
  function addClass(el, cls) {
    if (el.classList) {
      el.classList.add(cls);
    } else {
      el.className += ' ' + cls;
    }
  }
  function removeClass(el, cls) {
    if (el.classList) {
      el.classList.remove(cls);
    } else {
      el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g'), ' ').trim();
    }
  }
  function hasClass(el, cls) {
    if (el.classList) return el.classList.contains(cls);
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
  function toggleClass(el, cls) {
    if (hasClass(el, cls)) { removeClass(el, cls); } else { addClass(el, cls); }
  }

  // --- Thumbnail rendering ---
  function renderThumbs() {
    thumbList.innerHTML = '';
    for (var j = 0; j < slides.length; j++) {
      (function (idx) {
        var item = document.createElement('div');
        item.className = 'thumb-item';
        item.setAttribute('data-index', idx);

        var numSpan = document.createElement('span');
        numSpan.className = 'thumb-num';
        numSpan.textContent = idx + 1;

        var img = document.createElement('img');
        img.alt = 'Slide ' + (idx + 1);
        img.setAttribute('loading', 'lazy');
        img.src = slides[idx];

        item.appendChild(numSpan);
        item.appendChild(img);

        item.addEventListener('click', function () { goTo(idx); });
        thumbList.appendChild(item);
      })(j);
    }
  }

  // --- scrollIntoView with smooth behavior (graceful fallback for older Safari) ---
  function scrollThumbIntoView(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) {
      el.scrollIntoView(false);
    }
  }

  // --- Navigation ---
  function goTo(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return;
    currentIndex = index;
    slideImage.src = slides[currentIndex];
    currentIndexEl.textContent = currentIndex + 1;

    var items = thumbList.querySelectorAll('.thumb-item');
    var activeThumb = null;
    for (var k = 0; k < items.length; k++) {
      var el = items[k];
      var elIdx = parseInt(el.getAttribute('data-index'), 10);
      if (elIdx === currentIndex) {
        addClass(el, 'active');
        activeThumb = el;
      } else {
        removeClass(el, 'active');
      }
    }
    scrollThumbIntoView(activeThumb);
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  toggleSidebarBtn.addEventListener('click', function () {
    toggleClass(sidebar, 'collapsed');
  });

  // --- Fullscreen API with vendor prefix fallback ---
  function getFullscreenElement() {
    return document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement
      || null;
  }

  function requestFullscreen(el) {
    if (el.requestFullscreen)            return el.requestFullscreen();
    if (el.webkitRequestFullscreen)      return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen)         return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)          return el.msRequestFullscreen();
  }

  function exitFullscreen() {
    if (document.exitFullscreen)             return document.exitFullscreen();
    if (document.webkitExitFullscreen)       return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)        return document.mozCancelFullScreen();
    if (document.msExitFullscreen)           return document.msExitFullscreen();
  }

  function updateFullscreenIcon() {
    var isFs = !!getFullscreenElement();
    if (fsIconExpand)   fsIconExpand.style.display   = isFs ? 'none'         : 'inline-block';
    if (fsIconCollapse) fsIconCollapse.style.display = isFs ? 'inline-block' : 'none';
  }

  fullscreenBtn.addEventListener('click', function () {
    if (!getFullscreenElement()) {
      var result = requestFullscreen(document.documentElement);
      if (result && result.catch) result.catch(function () {});
    } else {
      exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange',       updateFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
  document.addEventListener('mozfullscreenchange',    updateFullscreenIcon);
  document.addEventListener('MSFullscreenChange',     updateFullscreenIcon);

  // --- Keyboard navigation (e.key with keyCode fallback for IE) ---
  document.addEventListener('keydown', function (e) {
    var key = e.key;
    var code = e.keyCode || e.which;

    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || code === 39 || code === 34 || code === 32) {
      if (e.preventDefault) e.preventDefault();
      next();
    } else if (key === 'ArrowLeft' || key === 'PageUp' || code === 37 || code === 33) {
      if (e.preventDefault) e.preventDefault();
      prev();
    } else if (key === 'Home' || code === 36) {
      goTo(0);
    } else if (key === 'End' || code === 35) {
      goTo(TOTAL_SLIDES - 1);
    }
  });

  // --- Touch / swipe support ---
  var touchStartX = null;
  var stage = document.getElementById('stage');

  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, passiveOpt);

  stage.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) { next(); } else { prev(); }
    }
    touchStartX = null;
  }, passiveOpt);

  renderThumbs();
  goTo(0);
})();
