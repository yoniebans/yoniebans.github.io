# Atlas Design System — Usage Guide

Read this before authoring any HTML page. This is the component vocabulary, assembly patterns, and quality standards for the atlas design system.

**Ground truth:**
- `base/styles.css` (via the `base/` git submodule pointing at `yoniebans.github.io`) — the canonical CSS. If this guide and the CSS disagree, the CSS wins and this guide needs updating.
- The [hermes-architecture](https://github.com/yoniebans/hermes-architecture) atlas — the reference exemplar showing these components assembled on real pages. Clone it and read the HTML after this guide to see the patterns in context.

This guide is a pre-digested teaching document — it explains *which* component to use *when* and *how* they compose. The CSS and exemplar are the raw material it's derived from.

---

## Page skeleton

Every atlas page follows this exact structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — Project Atlas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="base/styles.css">
  <link rel="stylesheet" href="base/presentation.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:false});</script>
  <script src="base/theme.js"></script>
</head>
<body>
  <div class="wrap">
    <nav class="toc" id="toc">
      <!-- shared multi-page TOC — identical across all pages -->
    </nav>
    <main class="main">
      <!-- section blocks -->
    </main>
  </div>
  <script src="base/mermaid-zoom.js" defer></script>
  <script src="base/page-nav.js" defer></script>
  <script src="base/scrollspy.js" defer></script>
  <script src="base/presentation.js" defer></script>
  <script src="base/enhancer.js" defer></script>
  <script src="refs.js" defer></script>
</body>
</html>
```

**Rules:**
- Fonts: DM Sans (body) + Fira Code (mono). No others. No Google Fonts experimentation.
- All JS loaded as classic `<script defer>`, never `<script type="module">` (breaks `file://`).
- The `base/` prefix comes from the git submodule. Never inline styles from `styles.css`.
- Script order matters — `mermaid-zoom.js` must come before `scrollspy.js`.

---

## Multi-page TOC

The sidebar nav is **identical HTML across all pages**. It lists every page and their sections:

```html
<nav class="toc" id="toc">
  <a class="toc-back" href="..">← back</a>
  <div class="toc-page" data-page="index.html">
    <a class="toc-page__title" href="index.html">C4 Architecture</a>
    <div class="toc-page__sections">
      <a href="index.html#context">System Context</a>
      <a href="index.html#containers">Containers</a>
    </div>
  </div>
  <!-- one toc-page per atlas page -->
</nav>
```

`page-nav.js` and `scrollspy.js` handle the active states and collapsing. The `data-page` attribute must match the filename exactly.

---

## Section anatomy

Every content section follows this pattern:

```html
<section id="semantic-kebab-id">
  <div class="sec-head anim" style="--i:0; color:var(--teal)">
    <span class="dot" style="background:var(--teal)"></span> SECTION LABEL
  </div>
  <h2 class="anim" style="--i:1">Section Title</h2>
  <p class="section-desc anim" style="--i:2">One-line orienting description.</p>

  <!-- content blocks here -->
</section>
```

**Rules:**
- Every section gets a semantic `id` (`#containers`, `#data-model`, `#preprocessing-flow`). No opaque IDs.
- The `.sec-head` uses a named color variable (`--teal`, `--amber`, `--accent`, etc.) with a matching `.dot`.
- The label is uppercase mono text — a short categorical name, not the section title.
- `--i` values control staggered fade-in animation. Increment sequentially within each section.

### Hero section (first section, always `id="overview"`)

```html
<section id="overview">
  <h1 class="anim" style="--i:0">Project Name Atlas</h1>
  <p class="subtitle anim" style="--i:1">description — version — org</p>
  <p class="lead anim" style="--i:2">Orienting paragraph that frames the system.</p>
  <div class="kpi-row anim" style="--i:3">
    <!-- kpi-card elements -->
  </div>
</section>
```

---

## Component catalogue

### Cards — `.ve-card`

The primary building block. A bordered surface card with a colored left accent.

```html
<div class="ve-card c-teal anim" style="--i:4">
  <div class="ve-card__label">Card Title</div>
  <!-- content: node-list, prose, pipeline, inner-grid, schema-table, etc. -->
</div>
```

**Color modifiers:** `c-accent`, `c-teal`, `c-sky`, `c-amber`, `c-rose`, `c-emerald`, `c-indigo`, `c-slate`. Also semantic: `c-tutorial`, `c-howto`, `c-reference`, `c-explanation`.

**Depth variants:**
- Default — standard surface, subtle hover lift
- `.ve-card--hero` — accent-tinted background + border. Use for the most important card in a section.
- `.ve-card--recessed` — subdued background, inset shadow. Use for secondary/supporting content.

**When to use:** Any self-contained piece of information — a container description, a component breakdown, a concept explanation. Cards are the atoms of atlas pages.

### KPI cards — `.kpi-row` + `.kpi-card`

Headline statistics in a responsive grid.

```html
<div class="kpi-row anim" style="--i:3">
  <div class="kpi-card">
    <div class="kpi-card__value" style="color:var(--teal)">42</div>
    <div class="kpi-card__label">Endpoints</div>
  </div>
</div>
```

**When to use:** Overview sections only. 4–8 cards showing the system's vital stats (container count, LOC, integration count, etc.). Each value gets a distinct color.

### Grids — `.grid-2`, `.grid-3`, `.grid-4`

Column layouts for organizing cards side by side.

```html
<div class="grid-2 gap-24 anim" style="--i:5">
  <div class="ve-card c-teal">...</div>
  <div class="ve-card c-amber">...</div>
</div>
```

**Always pair with `gap-24`.** Grids collapse to single column on mobile automatically.

**When to use:**
- `.grid-2` — comparing two things (before/after, client/server, preprocessing/postprocessing)
- `.grid-3` — three peer components at the same level
- `.grid-4` — many small items (extension points, config options)

### Auto-fit card grid — `.card-grid`

When you don't know how many cards there are or want them to flow responsively:

```html
<div class="card-grid anim" style="--i:6">
  <div class="ve-card c-teal">...</div>
  <div class="ve-card c-amber">...</div>
  <div class="ve-card c-emerald">...</div>
  <div class="ve-card c-rose">...</div>
</div>
```

Uses `auto-fit` with `minmax(280px, 1fr)`. Cards fill the available space.

### Inner cards — `.inner-grid` + `.inner-card`

Nested sub-cards within a `ve-card`. For component breakdowns within a container card.

```html
<div class="ve-card c-teal anim" style="--i:5">
  <div class="ve-card__label">Container Name</div>
  <div class="inner-grid">
    <div class="inner-card">
      <div class="title">Component A</div>
      <div class="desc">What it does.</div>
    </div>
    <div class="inner-card">
      <div class="title">Component B</div>
      <div class="desc">What it does.</div>
    </div>
  </div>
</div>
```

**When to use:** L3 component details inside an L2 container card.

### Pipeline — `.pipeline`

Horizontal step flow with arrows.

```html
<div class="pipeline">
  <div class="pipeline-step" style="border-color:var(--teal-dim)">
    <div class="step-name">Step One</div>
    <div class="step-detail">What happens here.</div>
  </div>
  <div class="pipeline-arrow">→</div>
  <div class="pipeline-step" style="border-color:var(--amber-dim)">
    <div class="step-name">Step Two</div>
    <div class="step-detail">What happens here.</div>
  </div>
</div>
```

**Variant:** `.pipeline--gradient` — progressive color intensification across steps. Good for showing data transformation stages.

**When to use:** Linear processing flows with 3–6 steps. Use inside a `ve-card` or standalone. For flows with branching or loops, use a Mermaid diagram instead.

### Lists — `.node-list` / `.step-list`

Compact lists with `›` markers. Always inside a `ve-card`.

```html
<ul class="node-list">
  <li><code data-ref="slug">component_name</code> — brief description</li>
  <li><code>another_thing</code> — brief description</li>
</ul>
```

**When to use:** Listing tools, handlers, modules, or components that don't warrant their own cards. Sequential operations use `.step-list` (same styling, different semantic name).

### Tags — `.tag`

Inline category pills.

```html
<span class="tag tag--teal">Python</span>
<span class="tag tag--amber">AWS Lambda</span>
```

**When to use:** Tech stack labels, category markers, version badges. Group in a `.flex-row` when showing multiple tags.

### Callouts — `.callout`

Accent-bordered info boxes for key insights or reading keys.

```html
<div class="callout anim" style="--i:7">
  <strong>Key insight.</strong> The thing that changes how you read the next diagram.
</div>
```

**Semantic variants:** `.callout--tutorial`, `.callout--howto`, `.callout--reference`, `.callout--explanation`. Use on diataxis pages.

**When to use:** One or two per section maximum. For reading keys, mental model corrections ("this is NOT a monolith"), or key insights that frame the diagrams that follow.

### Schema tables — `.schema-table`

Database/model field listings.

```html
<table class="schema-table">
  <thead><tr><th>Field</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr>
      <td><span class="col-name">id</span></td>
      <td><span class="col-type">UUID</span></td>
      <td><span class="col-pk">PK</span></td>
    </tr>
  </tbody>
</table>
```

**Badge classes:** `.col-pk` (primary key, amber), `.col-fk` (foreign key, sky), `.col-idx` (index, teal), `.col-version` (version, slate).

**When to use:** Data model pages. Show entity fields, their types, and key constraints. Pair with an ER diagram above.

### Tree — `.tree`

File/directory structure display.

```html
<div class="tree">
  <ul>
    <li><span class="dir">src/</span>
      <ul>
        <li><span class="required">models.py</span> — entity definitions</li>
        <li><span class="optional">utils/</span> — helpers</li>
      </ul>
    </li>
  </ul>
</div>
```

**When to use:** Showing repository layout, config file structure, or nested data shapes. The CSS handles connector lines via `::before`/`::after` pseudo-elements on `<li>` elements.

### Config layers — `.config-layers`

Stacked layer visualization for configuration precedence or system layers.

```html
<div class="config-layers">
  <div class="config-layer layer-runtime">
    <div class="layer-label">① Runtime</div>
    <div class="layer-desc">CLI flags, environment overrides</div>
  </div>
  <div class="layer-arrow">▼ overrides ▼</div>
  <div class="config-layer layer-default">
    <div class="layer-label">④ Defaults</div>
    <div class="layer-desc">Hardcoded fallbacks</div>
  </div>
</div>
```

**Layer types:** `.layer-runtime` (amber), `.layer-env` (teal), `.layer-user` (sky), `.layer-default` (slate).

**When to use:** Configuration precedence, network stack layers, permission hierarchies — anything where order matters and higher layers override lower ones.

### Collapsible — `details.collapsible`

Expandable sections for secondary content.

```html
<details class="collapsible anim" style="--i:8">
  <summary>Extended detail (click to expand)</summary>
  <div class="collapsible__body">
    <!-- grids, lists, text — any content -->
  </div>
</details>
```

**When to use:** Content that a reader might want but shouldn't dominate the page — full file listings, exhaustive config options, deep-dive details that aren't needed on first scan. If you're putting content in a collapsible, ask whether it belongs in the atlas at all.

### Legend — `.legend`

Diagram color key.

```html
<div class="legend anim" style="--i:9">
  <div class="legend-item">
    <div class="legend-swatch" style="background:var(--teal-dim);border:1px solid var(--teal)"></div>
    Internal container
  </div>
</div>
```

**When to use:** After any Mermaid diagram that uses color-coded nodes. Skip for diagrams where the colors are obvious from context.

### Pullquote — `.pullquote`

Emphasized quote with attribution.

```html
<div class="pullquote anim" style="--i:10">
  <p>"Think of the system as a switchboard operator."</p>
  <cite>— framing metaphor</cite>
</div>
```

**When to use:** Diataxis page only. One per section maximum. For mental model framing or design philosophy quotes.

### Quadrant grid — `.quadrant-grid`

2×2 framework visualization (Diátaxis-specific).

```html
<div class="quadrant-grid anim" style="--i:5">
  <div class="quadrant q-tutorial">
    <div class="quadrant__corner">Learning-oriented</div>
    <div class="quadrant__title">Tutorials</div>
    <div class="quadrant__desc">Step-by-step learning.</div>
  </div>
  <!-- q-howto, q-explanation, q-reference -->
</div>
```

**When to use:** Diataxis page only.

### Principle — `.principle`

Numbered design principles.

```html
<div class="principle">
  <div class="principle__num">1</div>
  <div class="principle__body">
    <div class="principle__title">Principle Name</div>
    <div class="principle__desc">What it means and why it matters.</div>
  </div>
</div>
```

**When to use:** Diataxis page — design principles section.

---

## Diagram authoring

### Mermaid diagram shell

The full pattern for every Mermaid diagram:

```html
<section class="diagram-shell anim" style="--i:N">
  <p class="diagram-shell__hint">
    Ctrl / Cmd + wheel to zoom · drag to pan · double-click to fit
  </p>
  <div class="mermaid-wrap">
    <div class="zoom-controls">
      <button data-action="zoom-in" title="Zoom in">+</button>
      <button data-action="zoom-out" title="Zoom out">&minus;</button>
      <button data-action="zoom-fit" title="Smart fit">&#8634;</button>
      <button data-action="zoom-one" title="1:1 zoom">1:1</button>
      <button data-action="zoom-expand" title="Open full size">&#x26F6;</button>
      <span class="zoom-label">Loading…</span>
    </div>
    <div class="mermaid-viewport">
      <div class="mermaid mermaid-canvas"></div>
    </div>
  </div>
  <script type="text/plain" class="diagram-source">
    graph TD
      A --> B
  </script>
</section>
```

**Rules:**
- Source lives in `<script type="text/plain" class="diagram-source">`, not in the `.mermaid` div.
- `mermaid-zoom.js` handles rendering, zoom, pan, fullscreen. Don't add custom Mermaid init.
- One `.diagram-shell` per diagram. Multiple diagrams per page work fine.
- No `min-height` on `.mermaid-wrap` — zoom engine sizes from SVG natural dimensions.

### Mermaid syntax rules

- **C4 diagrams:** Use `graph TD` with `classDef`. Never use `C4Context`/`C4Container`/`C4Component` — experimental syntax, renders poorly.
- **Colors:** Semi-transparent fills only. Use 8-digit hex with low alpha: `classDef svc fill:#0d948811,stroke:#0d948844,stroke-width:2px`. Opaque pastels break in dark mode.
- **Sequence diagrams:** Use `sequenceDiagram`. `rect` backgrounds need light-mode alternatives — register new colors in `mermaid-zoom.js`'s `rectColorMap`.
- **ER diagrams:** Use `erDiagram`. Set `darkMode: true` in `themeVariables` to prevent washed-out row stripes.
- **Line breaks:** Use `<br/>` in quoted labels, never `\n`.
- **Disconnected subgraphs in LR mode:** Add `A ~~~ B` invisible link to force side-by-side layout.

---

## Animation

Every visible element uses `class="anim"` with `style="--i:N"` for staggered fade-in. Increment `N` sequentially within each section, restarting at 0 for each new `<section>`.

```html
<div class="sec-head anim" style="--i:0">...</div>
<h2 class="anim" style="--i:1">...</h2>
<p class="section-desc anim" style="--i:2">...</p>
<div class="grid-2 gap-24 anim" style="--i:3">...</div>
<section class="diagram-shell anim" style="--i:4">...</section>
```

**Don't skip values.** Don't animate child elements separately from their parent grid/card — animate the container and let children appear with it.

---

## Code references

Inline code that refers to a codebase artifact gets a `data-ref` attribute:

```html
<code data-ref="preprocessing-batch">preprocessing/batch_job.py</code>
```

`enhancer.js` reads `refs.js` and wraps these in GitHub links. The ref slug must match a key in `refs.js`:

```js
window.ATLAS_REFS = {
  "repo": "Owner/repo-name",
  "branch": "main",
  "refs": {
    "preprocessing-batch": { "path": "preprocessing/batch_job.py" }
  }
};
```

**Target 20–50 refs** for a typical project. File-level only — GitHub doesn't support in-file deep links reliably.

---

## Decision framework

When deciding which component to use for a piece of content:

| Content type | Component | Why |
|---|---|---|
| System shape with connections | Mermaid `graph TD` + `classDef` | Needs automatic edge routing |
| Entity relationships | Mermaid `erDiagram` + `.schema-table` below | ER for shape, table for detail |
| Linear processing flow (3–6 steps) | `.pipeline` | Simpler than Mermaid, shows step detail |
| Linear flow with branching/loops | Mermaid `graph TD` or `sequenceDiagram` | CSS can't do branches |
| Request/response flow with timing | Mermaid `sequenceDiagram` | Lifelines and activation boxes |
| Two things compared | `.grid-2` with `.ve-card` | Side-by-side reading |
| Three peer components | `.grid-3` with `.ve-card` | Equal visual weight |
| Many small items | `.card-grid` or `.grid-4` | Auto-flowing responsive |
| Component internals | `.inner-grid` + `.inner-card` inside a `.ve-card` | Nested without visual noise |
| Field/column listing | `.schema-table` | Tabular data with type badges |
| File/directory structure | `.tree` | Preserves hierarchy alignment |
| Configuration layers | `.config-layers` | Shows precedence/override order |
| Key insight or reading key | `.callout` | Draws attention without being a card |
| Supporting detail | `details.collapsible` | Present but not dominant |
| Design principles | `.principle` | Numbered with title/description |
| Framework overview | `.quadrant-grid` | 2×2 with distinct quadrant styling |
| System statistics | `.kpi-row` + `.kpi-card` | Hero numbers at a glance |

**Default to cards.** When unsure, a `.ve-card` with a `.node-list` or `.prose` inside is almost always appropriate. Reach for specialized components only when the content demands it.

---

## Anti-patterns

### Layout and structure
- **Wall of text.** No paragraph longer than 3 lines. If you're writing prose that isn't supporting a diagram, it probably doesn't belong in the atlas.
- **Flat page.** If a page is just a sequence of diagrams with no cards, KPIs, or structured content around them, it reads as a Mermaid dump. Diagrams need orienting prose and companion cards.
- **Uniform cards.** If every card in a section looks identical (same color, same structure, same depth), there's no visual hierarchy. Use `.ve-card--hero` for the most important one, vary colors, use different inner content patterns.
- **Orphaned diagrams.** A diagram without a legend, without cards explaining key participants, or without a callout framing what to look for.

### Content
- **Re-explaining across pages.** If the architecture page explains the preprocessing pipeline, the sequences page should reference it, not re-explain it. Each concept has one owning page.
- **Decision rationale.** "We chose X because Y" belongs in `decisions/`, not the atlas.
- **Operational gotchas.** "Watch out for X", "Build with Y" → `CONTEXT.md`.
- **Full API surfaces.** The atlas shows shape, not surface. A list of every endpoint is too detailed.
- **Paragraphs as content.** If you're writing paragraphs that don't frame or annotate a diagram/card, you're probably writing docs, not an atlas.

### Diagrams
- **Opaque pastel fills in Mermaid.** `fill:#dbeafe` is invisible in dark mode. Always use semi-transparent: `fill:#0284c711`.
- **C4 experimental syntax.** `C4Context`, `C4Container` → renders poorly, ignores themes. Use `graph TD` with `classDef`.
- **`min-height` on `.mermaid-wrap`.** The zoom engine sizes from SVG dimensions. Forced heights cause small diagrams to float in oversized containers.
- **`<script type="module">` for local JS.** Chrome blocks ES modules on `file://`. Use classic `<script defer>`.
- **Missing zoom controls.** Every diagram must have the full zoom-controls HTML. No bare `.mermaid` divs.

### Styling
- **Inline `<style>` blocks.** Use the shared `styles.css` via `base/`. If a component doesn't exist, it should be added to the design system, not hacked inline.
- **Custom fonts.** DM Sans + Fira Code only. The atlas is a consistent system, not a design playground.
- **Opaque section IDs.** `#s0`, `#s1` → use semantic kebab-case (`#preprocessing`, `#data-model`).
- **Missing animations.** Every visible element should have `class="anim"` with a `--i` value. Pages without entrance animations feel static and unfinished.

---

## Quality checks

Before delivering a page:

1. **2-minute scan test.** Can a reader scan the page and build a mental model in ~2 minutes? If not, prune.
2. **Discipline test.** For every paragraph: does this help someone understand the shape, or does it help someone do work? Shape → keep. Work → move elsewhere.
3. **3-line rule.** No paragraph longer than 3 lines. Read every paragraph and trim.
4. **Diagram rendering.** Open on `file://`. Do all Mermaid diagrams render? Do zoom controls work? Do dark/light themes both look correct?
5. **Code refs.** Do `data-ref` chips link to correct repo paths? Does `refs.js` have all the slugs?
6. **Color variety.** Are sections using different accent colors, or is everything the same color?
7. **Visual hierarchy.** Is there a clear hero/primary section? Are secondary sections visually subordinate?
8. **Cross-page consistency.** Does this page use the same terminology as sibling pages? Does the TOC navigation work across pages?
9. **The honesty test.** Read the page cold and ask: where does it surprise me? Surprises mean the atlas is lying about the codebase.
