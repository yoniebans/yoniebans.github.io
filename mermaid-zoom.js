/* ================================================================
   Hermes Atlas — Mermaid Zoom & Pan Engine
   ----------------------------------------------------------------
   Classic script. Expects `window.mermaid` to already be loaded
   (via the Mermaid 11 UMD build included in each page's <head>).
   Renders every `.diagram-shell` on the page using Mermaid 11,
   then attaches a zoom/pan/expand controller per diagram.

   Loaded as a classic `<script defer>` so it executes after the
   DOM is parsed — matches the prior ES-module behaviour and also
   works on `file://` where Chrome blocks cross-origin ES modules.

   One canonical Mermaid theme (Blueprint, cool blue) is used for
   every page. Sequence-diagram-specific theme variables are
   included; they are harmless on flowcharts/ER/class diagrams.
   ================================================================ */

(function () {
'use strict';

const mermaid = window.mermaid;
if (!mermaid) {
  console.error('mermaid-zoom.js: window.mermaid is not defined. Did the Mermaid UMD script fail to load?');
  return;
}

const config = {
  fitPadding: 28,
  minHeight: 120,
  maxHeightPx: 720,
  maxHeightVh: 0.84,
  maxInitialZoom: 1.0,
  minZoom: 0.08,
  maxZoom: 6.5,
  zoomStep: 0.14,
  readabilityFloor: 0.58
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

let activeDrag = null;
addEventListener('mousemove', (e) => activeDrag?.onMove(e));
addEventListener('mouseup', () => {
  activeDrag?.onEnd();
  activeDrag = null;
});

const isDark = matchMedia('(prefers-color-scheme: dark)').matches;

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  look: 'classic',
  themeVariables: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '15px',
    /* Primary (sky/blueprint blue) */
    primaryColor: isDark ? '#1e3a5f' : '#dbeafe',
    primaryBorderColor: isDark ? '#38bdf8' : '#0284c7',
    primaryTextColor: isDark ? '#e2e8f0' : '#0f172a',
    /* Secondary (teal) */
    secondaryColor: isDark ? '#1a3332' : '#ccfbf1',
    secondaryBorderColor: isDark ? '#2dd4bf' : '#0d9488',
    secondaryTextColor: isDark ? '#e2e8f0' : '#0f172a',
    /* Tertiary (amber) */
    tertiaryColor: isDark ? '#2e2618' : '#fef3c7',
    tertiaryBorderColor: isDark ? '#fbbf24' : '#d97706',
    tertiaryTextColor: isDark ? '#e2e8f0' : '#0f172a',
    lineColor: isDark ? '#64748b' : '#94a3b8',
    noteBkgColor: isDark ? '#1e293b' : '#fefce8',
    noteTextColor: isDark ? '#e2e8f0' : '#0f172a',
    noteBorderColor: isDark ? '#fbbf24' : '#d97706',
    /* Sequence-diagram-specific (no-op for other diagram kinds) */
    actorBkg: isDark ? '#1a3332' : '#ccfbf1',
    actorBorder: isDark ? '#2dd4bf' : '#0d9488',
    actorTextColor: isDark ? '#e2e8f0' : '#0f172a',
    actorLineColor: isDark ? '#475569' : '#94a3b8',
    activationBkgColor: isDark ? '#1e2a40' : '#e0f2fe',
    activationBorderColor: isDark ? '#38bdf8' : '#0284c7',
    signalColor: isDark ? '#94a3b8' : '#475569',
    signalTextColor: isDark ? '#e2e8f0' : '#0f172a',
    labelBoxBkgColor: isDark ? '#151d2e' : '#f1f5f9',
    labelBoxBorderColor: isDark ? '#475569' : '#94a3b8',
    labelTextColor: isDark ? '#e2e8f0' : '#0f172a',
    loopTextColor: isDark ? '#94a3b8' : '#64748b',
    sequenceNumberColor: isDark ? '#0c1222' : '#ffffff',
  }
});

function initDiagram(shell) {
  const wrap = shell.querySelector('.mermaid-wrap');
  const viewport = shell.querySelector('.mermaid-viewport');
  const canvas = shell.querySelector('.mermaid-canvas');
  const source = shell.querySelector('.diagram-source');
  const label = shell.querySelector('.zoom-label');

  if (!wrap || !viewport || !canvas || !source || !label) {
    console.error('initDiagram: missing required elements in', shell);
    return;
  }

  let zoom = 1;
  let fitMode = 'contain';
  let panX = 0;
  let panY = 0;
  let svgW = 0;
  let svgH = 0;
  let sx = 0;
  let sy = 0;
  let spx = 0;
  let spy = 0;
  let touchDist = 0;
  let touchCx = 0;
  let touchCy = 0;

  function constrainPan() {
    const vpW = viewport.clientWidth;
    const vpH = viewport.clientHeight;
    const rW = svgW * zoom;
    const rH = svgH * zoom;
    const pad = config.fitPadding;

    panX = (rW + pad * 2 <= vpW)
      ? (vpW - rW) / 2
      : clamp(panX, vpW - rW - pad, pad);
    panY = (rH + pad * 2 <= vpH)
      ? (vpH - rH) / 2
      : clamp(panY, vpH - rH - pad, pad);
  }

  function applyTransform() {
    const svg = canvas.querySelector('svg');
    if (!svg || !svgW) return;

    constrainPan();
    svg.style.width = (svgW * zoom) + 'px';
    svg.style.height = (svgH * zoom) + 'px';
    canvas.style.transform = `translate(${panX}px, ${panY}px)`;
    label.textContent = Math.round(zoom * 100) + '% \u2014 ' + fitMode;
  }

  function canPan() {
    const rW = svgW * zoom;
    const rH = svgH * zoom;
    return rW + config.fitPadding * 2 > viewport.clientWidth
        || rH + config.fitPadding * 2 > viewport.clientHeight;
  }

  function computeSmartFit() {
    const vpW = viewport.clientWidth;
    const vpH = viewport.clientHeight;
    const aW = Math.max(80, vpW - config.fitPadding * 2);
    const aH = Math.max(80, vpH - config.fitPadding * 2);
    const contain = Math.min(aW / svgW, aH / svgH);

    let z = contain;
    let mode = 'contain';
    if (contain < config.readabilityFloor) {
      const chartR = svgH / svgW;
      const vpR = vpH / Math.max(vpW, 1);
      if (chartR >= vpR) {
        z = aW / svgW;
        mode = 'width-priority';
      } else {
        z = aH / svgH;
        mode = 'height-priority';
      }
    }
    return { zoom: clamp(z, config.minZoom, config.maxInitialZoom), mode };
  }

  function fitDiagram() {
    if (!svgW) return;
    // Default: 100% zoom, top-left aligned with padding
    zoom = 1.0;
    fitMode = '100%';
    panX = config.fitPadding;
    panY = config.fitPadding;
    applyTransform();
  }

  function setOneToOne() {
    zoom = clamp(1, config.minZoom, config.maxZoom);
    fitMode = '1:1';
    panX = (viewport.clientWidth - svgW * zoom) / 2;
    panY = (viewport.clientHeight - svgH * zoom) / 2;
    applyTransform();
  }

  function zoomAround(factor, cx, cy) {
    const next = clamp(zoom * factor, config.minZoom, config.maxZoom);
    const ratio = next / zoom;
    panX = cx - ratio * (cx - panX);
    panY = cy - ratio * (cy - panY);
    zoom = next;
    fitMode = 'custom';
    applyTransform();
  }

  function readSvgNaturalSize(svg) {
    let w = 0;
    let h = 0;
    if (svg.viewBox?.baseVal?.width > 0) {
      w = svg.viewBox.baseVal.width;
      h = svg.viewBox.baseVal.height;
    }
    if (!w) {
      w = parseFloat(svg.getAttribute('width')) || 0;
      h = parseFloat(svg.getAttribute('height')) || 0;
    }
    if (!w) {
      const b = svg.getBBox();
      w = b.width;
      h = b.height;
    }
    if (!w) {
      const r = svg.getBoundingClientRect();
      w = r.width || 1000;
      h = r.height || 700;
    }
    if (!svg.getAttribute('viewBox')) {
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    return { w, h };
  }

  function setAdaptiveHeight() {
    if (!svgW) return;
    const usableW = Math.max(280, wrap.getBoundingClientRect().width - 2);
    // Height = SVG aspect ratio at 100% zoom, capped at a sensible max
    const naturalH = (svgH / svgW) * usableW + config.fitPadding * 2;
    const maxVp = Math.floor(innerHeight * config.maxHeightVh);
    const hardMax = Math.min(config.maxHeightPx, maxVp);
    wrap.style.height = Math.round(Math.min(naturalH, hardMax)) + 'px';
  }

  function getDiagramTitle() {
    // Walk up to the outermost diagram-shell (may be nested)
    let top = shell;
    while (top.parentElement?.closest('.diagram-shell')) {
      top = top.parentElement.closest('.diagram-shell');
    }
    // Walk backwards through siblings to find nearest heading
    let el = top.previousElementSibling;
    while (el) {
      const h = el.tagName?.match(/^H[1-6]$/) ? el : el.querySelector('h1,h2,h3,h4,h5,h6');
      if (h) return h.textContent.trim();
      el = el.previousElementSibling;
    }
    return 'Diagram';
  }

  function openInNewTab() {
    const svg = canvas.querySelector('svg');
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.style.width = '';
    clone.style.height = '';
    const title = getDiagramTitle();
    const bg = isDark ? '#0c1222' : '#f1f5f9';
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title><style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:${bg};padding:40px;box-sizing:border-box}
    svg{max-width:100%;max-height:90vh;height:auto}
    </style></head><body>${clone.outerHTML}</body></html>`;
    open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
  }

  async function render() {
    try {
      const code = source.textContent.trim();
      if (!code) {
        label.textContent = 'Error: Empty source';
        return;
      }

      const id = 'diagram-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      const { svg } = await mermaid.render(id, code);
      canvas.innerHTML = svg;

      const svgNode = canvas.querySelector('svg');
      if (!svgNode) {
        label.textContent = 'Error: No SVG';
        return;
      }

      const size = readSvgNaturalSize(svgNode);
      svgW = size.w;
      svgH = size.h;

      svgNode.removeAttribute('width');
      svgNode.removeAttribute('height');
      svgNode.style.maxWidth = 'none';
      svgNode.style.display = 'block';

      setAdaptiveHeight();
      fitDiagram();
    } catch (err) {
      console.error('Mermaid render failed:', err);
      label.textContent = 'Error: ' + (err.message || 'Render failed');
    }
  }

  /* Action map. We accept both the canonical action names
     (zoom-fit / zoom-one / zoom-expand) and the shorter aliases
     used by the legacy data-model.html markup (fit / reset / expand)
     so existing button markup keeps working. */
  const actions = {
    'zoom-in':     () => zoomAround(1 + config.zoomStep, viewport.clientWidth / 2, viewport.clientHeight / 2),
    'zoom-out':    () => zoomAround(1 / (1 + config.zoomStep), viewport.clientWidth / 2, viewport.clientHeight / 2),
    'zoom-fit':    fitDiagram,
    'fit':         fitDiagram,
    'zoom-one':    setOneToOne,
    'reset':       setOneToOne,
    'zoom-expand': openInNewTab,
    'expand':      openInNewTab,
  };

  Object.entries(actions).forEach(([action, handler]) => {
    wrap.querySelector(`[data-action="${action}"]`)?.addEventListener('click', handler);
  });

  viewport.addEventListener('dblclick', fitDiagram);

  viewport.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1 + config.zoomStep : 1 / (1 + config.zoomStep);
      zoomAround(factor, e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    if (canPan()) {
      e.preventDefault();
      panX -= e.deltaX;
      panY -= e.deltaY;
      applyTransform();
    }
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.zoom-controls') || !canPan()) return;
    wrap.classList.add('is-panning');
    sx = e.clientX;
    sy = e.clientY;
    spx = panX;
    spy = panY;
    e.preventDefault();

    activeDrag = {
      onMove: (ev) => {
        panX = spx + (ev.clientX - sx);
        panY = spy + (ev.clientY - sy);
        applyTransform();
      },
      onEnd: () => {
        wrap.classList.remove('is-panning');
      }
    };
  });

  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      spx = panX;
      spy = panY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDist = Math.sqrt(dx * dx + dy * dy);
      const r = viewport.getBoundingClientRect();
      touchCx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      touchCy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && canPan()) {
      if (touchDist > 0) {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        spx = panX;
        spy = panY;
        touchDist = 0;
      }
      e.preventDefault();
      panX = spx + (e.touches[0].clientX - sx);
      panY = spy + (e.touches[0].clientY - sy);
      applyTransform();
    } else if (e.touches.length === 2 && touchDist > 0) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.sqrt(dx * dx + dy * dy);
      zoomAround(d / touchDist, touchCx, touchCy);
      touchDist = d;
    }
  }, { passive: false });

  new ResizeObserver(() => {
    if (svgW) {
      setAdaptiveHeight();
      fitDiagram();
    }
  }).observe(wrap);

  render();
}

document.querySelectorAll('.diagram-shell').forEach(initDiagram);

})();
