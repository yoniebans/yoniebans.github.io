/* ================================================================
   Hermes Atlas — Scroll Spy
   ----------------------------------------------------------------
   Highlights the active TOC link as the user scrolls. Works with
   any element that has id="toc" containing in-page anchor links.
   On narrow viewports, scrolls the active link into the visible
   horizontal strip.
   ================================================================ */
(function () {
  const toc = document.getElementById('toc');
  if (!toc) return;

  const links = toc.querySelectorAll('a');
  const sections = [];

  links.forEach(link => {
    const id = link.getAttribute('href').slice(1);
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
          if (window.innerWidth <= 1000) {
            match.link.scrollIntoView({
              behavior: 'smooth', block: 'nearest', inline: 'center'
            });
          }
        }
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  sections.forEach(s => observer.observe(s.el));

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });
})();
