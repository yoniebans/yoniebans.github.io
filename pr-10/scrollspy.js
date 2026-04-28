/* ================================================================
   Hermes Atlas — Scroll Spy + Mobile Nav Toggle
   ----------------------------------------------------------------
   Highlights the active TOC link as the user scrolls. Works with
   any element that has id="toc" containing in-page anchor links.
   On narrow viewports, adds a hamburger toggle and closes the nav
   after link clicks.
   ================================================================ */
(function () {
  const toc = document.querySelector('.toc');
  if (!toc) return;

  // --- Mobile nav toggle ---
  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Toggle navigation');
  toggle.innerHTML = '<span class="bar"></span>';
  document.body.appendChild(toggle);

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  function openNav() {
    toc.classList.add('open');
    toggle.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeNav() {
    toc.classList.remove('open');
    toggle.classList.remove('open');
    backdrop.classList.remove('open');
  }

  toggle.addEventListener('click', function () {
    toc.classList.contains('open') ? closeNav() : openNav();
  });
  backdrop.addEventListener('click', closeNav);

  // --- Scrollspy ---
  const links = toc.querySelectorAll('a');
  const sections = [];

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = sections.find(s => s.el === entry.target);
        if (match) {
          match.link.classList.add('active');
        }
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  sections.forEach(s => observer.observe(s.el));

  links.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        closeNav();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });
})();
