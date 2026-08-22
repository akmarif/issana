(function () {
  const TOTAL_SLIDES = 41;
  const slides = Array.from({ length: TOTAL_SLIDES }, (_, i) =>
    `slides/slide-${String(i + 1).padStart(2, "0")}.jpg`
  );

  let currentIndex = 0;

  const slideImage = document.getElementById("slideImage");
  const currentIndexEl = document.getElementById("currentIndex");
  const totalCountEl = document.getElementById("totalCount");
  const thumbList = document.getElementById("thumbList");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");

  totalCountEl.textContent = TOTAL_SLIDES;

  function renderThumbs() {
    thumbList.innerHTML = "";
    slides.forEach((src, i) => {
      const item = document.createElement("div");
      item.className = "thumb-item";
      item.dataset.index = i;
      item.innerHTML = `<span class="thumb-num">${i + 1}</span><img loading="lazy" src="${src}" alt="Slide ${i + 1}">`;
      item.addEventListener("click", () => goTo(i));
      thumbList.appendChild(item);
    });
  }

  function goTo(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return;
    currentIndex = index;
    slideImage.src = slides[currentIndex];
    currentIndexEl.textContent = currentIndex + 1;

    document.querySelectorAll(".thumb-item").forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.index) === currentIndex);
    });
    const activeThumb = thumbList.querySelector(".thumb-item.active");
    if (activeThumb) {
      activeThumb.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      goTo(0);
    } else if (e.key === "End") {
      goTo(TOTAL_SLIDES - 1);
    }
  });

  let touchStartX = null;
  const stage = document.getElementById("stage");
  stage.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      diff < 0 ? next() : prev();
    }
    touchStartX = null;
  }, { passive: true });

  renderThumbs();
  goTo(0);
})();
