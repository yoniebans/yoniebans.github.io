/* Presentation mode — converts atlas sections into navigable slides.
   Toggle with the 🎬 button or press 'p'. Arrow keys / space to navigate. */
(function () {
  'use strict';

  let active = false;
  let slides = [];
  let current = 0;

  // Build slide list from <section> elements or elements with .slide markers
  function buildSlides() {
    // Use <section> tags, or fall back to direct children of .main with an id
    slides = Array.from(document.querySelectorAll('section[id], .main > [id]'));
    if (slides.length === 0) {
      // Last resort: split on <hr> — each segment between HRs is a slide
      const main = document.querySelector('.main');
      if (!main) return;
      slides = Array.from(main.children).filter(el => el.tagName !== 'SCRIPT');
    }
  }

  function showSlide(index) {
    if (index < 0 || index >= slides.length) return;
    current = index;

    slides.forEach((s, i) => {
      s.classList.toggle('slide-active', i === current);
    });

    updateCounter();
    window.scrollTo(0, 0);
  }

  function updateCounter() {
    const counter = document.getElementById('pres-counter');
    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  }

  function enter() {
    if (active) return;
    active = true;
    buildSlides();
    if (slides.length === 0) return;

    // Find which slide is currently in view BEFORE hiding
    const scrollY = window.scrollY + window.innerHeight / 3;
    let closest = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].getBoundingClientRect().top + window.scrollY <= scrollY) {
        closest = i;
      }
    }

    document.body.classList.add('presentation-mode');
    showSlide(closest);

    // Show controls
    const bar = document.getElementById('pres-bar');
    if (bar) bar.style.display = 'flex';
  }

  function exit() {
    if (!active) return;
    active = false;
    document.body.classList.remove('presentation-mode');
    slides.forEach(s => { s.classList.remove('slide-active'); });

    const bar = document.getElementById('pres-bar');
    if (bar) bar.style.display = 'none';
  }

  function toggle() { active ? exit() : enter(); }
  function next() { if (active && current < slides.length - 1) showSlide(current + 1); }
  function prev() { if (active && current > 0) showSlide(current - 1); }

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'p' && !e.ctrlKey && !e.metaKey) { toggle(); e.preventDefault(); }
    if (!active) return;

    if (e.key === 'ArrowRight' || e.key === ' ') { next(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
    if (e.key === 'Escape') { exit(); e.preventDefault(); }
  });

  // Touch swipe (presentation mode only)
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', function (e) {
    if (!active) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!active) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();  // swipe left → next
      else prev();          // swipe right → prev
    }
  }, { passive: true });

  // Inject control bar on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    // Toggle button in the page (top-right area)
    const btn = document.createElement('button');
    btn.className = 'pres-toggle';
    btn.setAttribute('aria-label', 'Toggle presentation mode');
    btn.title = 'Presentation mode (P)';
    btn.innerHTML = '🎬';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);

    // Bottom bar with prev/next/counter
    const bar = document.createElement('div');
    bar.id = 'pres-bar';
    bar.style.display = 'none';
    bar.innerHTML = `
      <button id="pres-prev" aria-label="Previous slide">◀</button>
      <span id="pres-counter">1 / 1</span>
      <button id="pres-next" aria-label="Next slide">▶</button>
      <button id="pres-exit" aria-label="Exit presentation">✕</button>
    `;
    document.body.appendChild(bar);

    document.getElementById('pres-prev').addEventListener('click', prev);
    document.getElementById('pres-next').addEventListener('click', next);
    document.getElementById('pres-exit').addEventListener('click', exit);
  });
})();
