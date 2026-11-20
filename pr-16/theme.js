/* Theme toggle — sun/moon button, persists to localStorage, re-renders Mermaid */
(function () {
  'use strict';

  function getTheme() {
    return localStorage.getItem('theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Apply immediately (before DOMContentLoaded) to avoid flash
  apply(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.title = 'Toggle dark/light mode';
    btn.textContent = getTheme() === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', function () {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      apply(next);
      // Re-render Mermaid diagrams — they bake colors at render time
      if (typeof window.__reRenderDiagrams === 'function') {
        window.__reRenderDiagrams();
      }
    });
    document.body.appendChild(btn);
  });
})();
