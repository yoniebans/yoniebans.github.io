/* ================================================================
   Hermes Atlas — Multi-Page TOC Navigation
   ----------------------------------------------------------------
   Implements collapsible page-level navigation in the sidebar TOC.
   Convention-driven: looks for .toc-page[data-page] elements.

   Behaviour:
   - Detects the current page from location.pathname
   - Expands current page's subsections, collapses others
   - Rewrites current-page hrefs from "page.html#sec" to "#sec"
     so scrollspy.js works unchanged
   - Clicking a collapsed page title navigates to that page
   - Clicking the active page title toggles its sections

   Load order: page-nav.js BEFORE scrollspy.js (it rewrites hrefs
   that scrollspy then binds to).
   ================================================================ */
(function () {
  const toc = document.querySelector('.toc');
  if (!toc) return;

  const pages = toc.querySelectorAll('.toc-page');
  if (!pages.length) return; // single-page site, nothing to do

  // Determine current page from pathname
  const path = location.pathname;
  const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  pages.forEach(page => {
    const pageFile = page.dataset.page;
    const titleLink = page.querySelector('.toc-page__title');
    const sections = page.querySelector('.toc-page__sections');
    const isActive = pageFile === currentFile;

    if (isActive) {
      page.classList.add('is-active');

      // Rewrite section hrefs: "index.html#overview" → "#overview"
      // so scrollspy.js can bind them with its existing # logic
      if (sections) {
        sections.querySelectorAll('a').forEach(a => {
          const href = a.getAttribute('href');
          if (!href) return;
          const hashIdx = href.indexOf('#');
          if (hashIdx !== -1) {
            a.setAttribute('href', href.substring(hashIdx));
          }
        });
      }

      // Clicking active page title toggles sections visibility
      if (titleLink && sections) {
        titleLink.addEventListener('click', e => {
          e.preventDefault();
          page.classList.toggle('is-collapsed');
        });
      }
    } else {
      // Non-active pages: sections stay collapsed
      // Title click navigates naturally (it's an <a> tag)
      page.classList.add('is-collapsed');
    }
  });
})();
