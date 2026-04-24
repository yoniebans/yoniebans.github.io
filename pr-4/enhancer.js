/* ================================================================
   Hermes Atlas — Repo Reference Enhancer
   ----------------------------------------------------------------
   Wraps elements with [data-ref="<slug>"] in an anchor pointing to
   the corresponding file in the GitHub repo defined in refs.js
   (loaded as window.ATLAS_REFS). Appends a small external-link icon
   so users know the link goes offsite. Idempotent — safe to run
   multiple times.

   Uses window.ATLAS_REFS (set by refs.js) instead of fetch() to
   avoid CORS failures on file:// origins.
   ================================================================ */
(function () {
  var ICON_SVG =
    '<svg class="ref-link__icon" viewBox="0 0 24 24" width="1em" height="1em" ' +
    'aria-hidden="true" focusable="false">' +
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" d="M14 4h6v6 M20 4l-9 9 M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>' +
    '</svg>';

  function buildUrl(repo, branch, entry) {
    return 'https://github.com/' + repo + '/blob/' + branch + '/' + entry.path;
  }

  function enhance(data) {
    if (!data || !data.refs) return;
    var repo = data.repo;
    var branch = data.branch || 'main';
    var nodes = document.querySelectorAll('[data-ref]');

    nodes.forEach(function (el) {
      if (el.parentElement && el.parentElement.classList &&
          el.parentElement.classList.contains('ref-link') &&
          el.parentElement.dataset.refEnhanced === '1') {
        return;
      }

      var slug = el.getAttribute('data-ref');
      var entry = data.refs[slug];
      if (!entry) {
        console.warn('[enhancer] unknown data-ref:', slug);
        return;
      }

      var url = buildUrl(repo, branch, entry);
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'ref-link';
      a.title = 'github: ' + repo + '/' + entry.path;
      a.dataset.refEnhanced = '1';

      var parent = el.parentNode;
      if (!parent) return;
      parent.insertBefore(a, el);
      a.appendChild(el);
      a.insertAdjacentHTML('beforeend', ICON_SVG);
    });
  }

  function init() {
    if (window.ATLAS_REFS) {
      enhance(window.ATLAS_REFS);
    } else {
      console.warn('[enhancer] window.ATLAS_REFS not found — is refs.js loaded?');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
