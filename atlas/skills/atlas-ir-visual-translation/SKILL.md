---
name: atlas-ir-visual-translation
description: "IR YAML → HTML. Final phase of the atlas IR pipeline. Reads structured IR YAML (from atlas-ir-system-modelling) and renders it as interactive atlas HTML pages using the design system. Visual judgment lives here — component selection, layout, diagrams vs prose, cards vs bullets. Runs in the same context window as the preceding skills."
maturity: "new — v0.1, April 2026. Untested."
metadata:
  hermes:
    tags: [atlas, ir, html, rendering, design-system, mermaid]
    related_skills: [atlas-ir-system-modelling, atlas-source-ingest, atlas-drift-detection]
---

# Atlas IR — Visual Translation (Skill 2)

Reads the IR YAML produced by `atlas-ir-system-modelling` and renders it as interactive atlas HTML pages. This is where visual judgment lives — the agent decides how each domain concept becomes a visual component.

The IR funnels system understanding into domain structure. This skill fans it back out into visual richness. The agent brings creative latitude — choosing when to use boxes vs bullets, labels vs prose, mini-diagrams vs description — but works from structured understanding, not from raw code.

**Trigger:** Runs immediately after `atlas-ir-system-modelling` completes. Same context window. The IR YAML is on disk; the agent also has the codebase understanding still loaded from `atlas-source-ingest`. The pipeline is autonomous: the user reviews the final HTML output.

---

## Pre-flight reads (mandatory)

### IR YAML

Read all pages from `atlas/pages/` and the manifest `atlas/atlas.yaml`. This is the input — everything to render.

Read `atlas/diagrams/*.mmd` — the Mermaid sources are embedded into the HTML.

Read `atlas/refs.json` — wired into the HTML via enhancer.js.

### Reference IR templates

Load the reference IR templates for the page types being rendered — same references as Skill 1. These tell the agent what to expect from the IR and what each concept type typically maps to visually.

The reference IRs live in `atlas-ir-system-modelling/references/`. Load with `skill_view`:

```
skill_view(name="atlas-ir-system-modelling", file_path="references/c4-architecture.yaml")
```

### Design system reference

The canonical design system lives at `yoniebans.github.io` (repo: `yoniebans/yoniebans.github.io`). Root files: `styles.css`, `mermaid-zoom.js`, `scrollspy.js`, `page-nav.js`, `enhancer.js`, `presentation.js`, `presentation.css`, `theme.js`.

The hand-authored reference site at `/mnt/hermes/source/hermes-architecture/` is the exemplar — mine it for patterns, component vocabulary, and visual conventions. Read at least `index.html` (C4 page) and `styles.css` to load the component vocabulary.

**Consumer repos inherit via git submodule:**
```bash
git submodule add https://github.com/yoniebans/yoniebans.github.io.git base
```
Pages reference assets as `base/styles.css`, `base/mermaid-zoom.js`, etc.

---

## Output structure

One HTML file per IR page, plus design system assets:

```
<project>/atlas/
├── atlas.yaml                    # already exists from Skill 1
├── pages/                        # IR YAML — already exists
├── diagrams/                     # .mmd files — already exists
├── refs.json                     # already exists
├── html/                         # NEW — rendered output
│   ├── index.html                # C4 Architecture (always)
│   ├── data-model.html           # when IR page exists
│   ├── sequence-diagrams.html    # when IR page exists
│   ├── diataxis.html             # when IR page exists
│   └── refs.js                   # refs.json reformatted for enhancer.js
└── base/                         # git submodule → yoniebans.github.io
```

---

## HTML page structure

Every page follows the same skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Page Title} — {System Name} Atlas</title>
  <link rel="stylesheet" href="base/styles.css">
  <link rel="stylesheet" href="base/presentation.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { ... }});</script>
  <script src="base/theme.js"></script>
</head>
<body>
  <div class="wrap">
    <nav class="toc" id="toc">
      <!-- multi-page TOC — identical in every page -->
    </nav>
    <main class="main">
      <!-- page content as <section> elements -->
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

### Critical `<head>` order

1. CSS: `styles.css`, `presentation.css`
2. Mermaid CDN + `mermaid.initialize({ startOnLoad: false, ... })`
3. `theme.js`

### Critical body script order (all `defer`)

`mermaid-zoom.js` → `page-nav.js` → `scrollspy.js` → `presentation.js` → `enhancer.js` → `refs.js`

`page-nav.js` must load before `scrollspy.js` — it rewrites hrefs for the active page so scrollspy can bind them.

All scripts MUST have `defer`. Inconsistent `defer` causes race conditions.

---

## Component vocabulary

The design system provides specific components for specific content types. Using the wrong one looks random even if the data is correct.

### Domain concept → HTML component mapping

| IR concept | HTML component | When to use |
|---|---|---|
| System metrics, counts | `.kpi-row` > `.kpi-card` (`.kpi-card__value` + `.kpi-card__label`) | Numeric stats only — "30+ Tools", "16 Adapters" |
| Containers, components, entities, features | `.grid-2` or `.grid-3` > `.ve-card` with `.ve-card__label` + content | Conceptual items with title + description |
| Sequential steps, pipelines | `.pipeline` > `.pipeline-step` (`.step-name` + `.step-detail`) + `.pipeline-arrow` | 3-5 step processes |
| Key insight, single callout | `.callout` | One important sentence the reader should remember |
| Tabular data, comparisons | `.ve-card` > `table.schema-table` | Field listings, comparison matrices |
| Design principles | `.principle` (`.principle__num` + `.principle__body` > `__title` + `__desc`) | Numbered principles from documentation map |
| C4 diagrams, ER diagrams, sequences | `.diagram-shell` > `.mermaid-wrap` | All Mermaid diagrams |
| Orienting prose | `<p>` with metaphors, reading-keys, framing | 1-sentence paragraphs before/after visual components |

### KPI cards — numeric only

`.kpi-card` is strictly for numeric stats. When listing conceptual items (failure modes, properties, features), use `.ve-card` in a `.grid-N`. The visual mismatch is immediately obvious — KPI cards have centered layout optimized for a bold number, not descriptive text.

### ve-card colour classes

Every `.ve-card` needs a `c-*` class for the left border accent:
- `c-rose` — problems, danger
- `c-amber` — warnings, caution
- `c-emerald` — positive, success
- `c-teal` / `c-accent` — neutral informational
- `c-slate` — structural, passive
- `c-indigo` — internal, abstract

### Pipeline component

For 3-5 step visual flows. Better than prose for orientation.

```css
.pipeline { display: flex; flex-wrap: wrap; gap: 0; align-items: stretch; }
```

Gradient progression via nth-child — quiet start → emphatic end. Arrows appear only when steps fit one row. Never horizontal-scroll.

### Wall-of-text fix

When 4+ back-to-back `<p>` blocks describe a sequence, convert to a structured visual (pipeline cards, grid). The prose was describing a structure — show the structure. Keep a 1-sentence framing `<p>` before and after.

---

## Canonical diagram-shell markup

The exact contract that `mermaid-zoom.js` expects. Deviating causes failures.

```html
<section class="diagram-shell anim" style="--i:N" id="diagram-name">
  <p class="diagram-shell__hint">
    Ctrl/Cmd + wheel to zoom &middot; Scroll to pan &middot; Drag when zoomed &middot; Double-click to fit
  </p>
  <div class="mermaid-wrap">
    <div class="zoom-controls">
      <button type="button" data-action="zoom-in" title="Zoom in">+</button>
      <button type="button" data-action="zoom-out" title="Zoom out">&minus;</button>
      <button type="button" data-action="zoom-fit" title="Smart fit">&#8634;</button>
      <button type="button" data-action="zoom-one" title="1:1 zoom">1:1</button>
      <button type="button" data-action="zoom-expand" title="Open full size">&#x26F6;</button>
      <span class="zoom-label">Loading...</span>
    </div>
    <div class="mermaid-viewport">
      <div class="mermaid mermaid-canvas"></div>
    </div>
  </div>
  <script type="text/plain" class="diagram-source">
    {mermaid source from .mmd file}
  </script>
</section>
```

**Critical details:**
- Container MUST be `<section>`, not `<div>` (presentation mode targets `section[id]`)
- `mermaid-canvas` div MUST also have the `mermaid` class
- Zoom controls MUST be before viewport in DOM order
- Do NOT set `min-height` on `.mermaid-wrap` — `mermaid-zoom.js` sizes from SVG natural dimensions
- `<script class="diagram-source">` MUST be a sibling of `.mermaid-wrap`, not inside it
- Do NOT HTML-escape Mermaid source — it's inside `<script type="text/plain">` which is not parsed as HTML

---

## Multi-page TOC

Identical markup in every page. `page-nav.js` handles expand/collapse.

```html
<nav class="toc" id="toc">
  <a class="toc-back" href="https://yoniebans.github.io">← all posts</a>
  <div class="toc-page" data-page="index.html">
    <a class="toc-page__title" href="index.html">C4 Architecture</a>
    <div class="toc-page__sections">
      <a href="index.html#overview">Overview</a>
      <a href="index.html#containers">Containers</a>
      <!-- ... -->
    </div>
  </div>
  <!-- more .toc-page entries for each HTML page -->
</nav>
```

The TOC sections come from the `<section id="...">` elements in each page. Build the TOC after authoring all pages so section IDs are final.

---

## Rendering procedure per page type

### C4 Architecture → index.html

Read `pages/c4-architecture.yaml`. Map IR sections to HTML sections:

| IR section | HTML treatment |
|---|---|
| `context` | Orienting prose + diagram-shell with context.mmd |
| `containers` | Diagram-shell with containers.mmd + ve-cards per container (name, technology, description) |
| `components[]` | One diagram-shell per decomposed container + ve-cards for components |
| `dynamic[]` | One diagram-shell per flow. Companion cards for key moments if needed. |
| `deployment[]` | Diagram-shell per environment |
| `supplementary[]` | KPI row for metrics, schema-table for inventories, callout for decision headlines |
| `refs` | Populate refs.js |

**Visual judgment lives here.** The IR says "Container X has 5 components." The agent decides: are these complex enough for individual ve-cards with detail? Or compact enough for a bullet list inside one card? The IR constrains *what*; this skill decides *how*.

### Data Model → data-model.html

Read `pages/data-model.yaml`:

| IR section | HTML treatment |
|---|---|
| `entity_map` | Orienting prose + erDiagram diagram-shell |
| `domains[]` | One section per domain, diagram-shell with domain-specific ER |
| `schema_detail[]` | Schema tables (`.schema-table`) per entity — fields, types, constraints |
| `wire_formats[]` | ve-cards or schema-tables depending on complexity |
| `config[]` | ve-cards with key fields listed |
| `storage_topology` | Diagram if present, otherwise ve-cards for stores |

### Sequences → sequence-diagrams.html

Read `pages/sequences.yaml`:

| IR section | HTML treatment |
|---|---|
| `flow_map` | Orienting prose + pipeline or grid showing flow names + descriptions |
| `sequences[]` | One diagram-shell per flow (sequenceDiagram from .mmd). Companion cards for participants and key moments. |
| `patterns[]` | Callouts or ve-cards — named patterns with cross-references to flows |
| `participant_glossary[]` | Schema-table if present |

### Documentation Map → diataxis.html

Read `pages/documentation-map.yaml`:

| IR section | HTML treatment |
|---|---|
| `landscape` | Framing prose + quadrant summary (grid-2 with four ve-cards) |
| `tutorials` | Learning path as pipeline steps + ve-cards for foundational concepts |
| `how_to` | ve-cards for extension points (with mechanism, contract, complexity) + operational surfaces |
| `reference` | ve-cards for surfaces + optional module map as schema-table |
| `explanation` | Numbered `.principle` components for design principles + ve-cards for decisions + constraints |
| `cross_cutting[]` | ve-cards spanning full width |

---

## refs.js

Convert `atlas/refs.json` to the format enhancer.js expects:

```js
window.ATLAS_REFS = {
  "repo": "Owner/repo",
  "branch": "main",
  "refs": {
    "concept-slug": { "path": "path/to/file.py", "symbol": "ClassName" }
  }
};
```

In the HTML, add `data-ref="concept-slug"` to `<code>` chips that reference source concepts. Enhancer.js wraps them in GitHub links automatically.

---

## Section IDs

Every `<section>` gets a semantic kebab-case `id` — never opaque (`#s0`, `#s1`). Derived from the IR content:

- Container name "Core Engine" → `id="core-engine"`
- Flow name "CLI Message Flow" → `id="cli-message-flow"`
- Domain name "Identity" → `id="identity"`

These IDs are used by the TOC, scrollspy, cross-page links, and presentation mode. They must be stable and meaningful.

---

## Presentation mode

Every content block must be wrapped in `<section id="...">`. `presentation.js` detects slides via `section[id]` selectors. Pages using flat `<div>` markers without `<section>` wrappers will fail silently — the 🎬 button appears but no slides are detected.

Intro content (h1, subtitle, lead text, KPI rows) must live inside the first `<section id="overview">`, not outside any section.

---

## Style rules

- **Units:** Always `px`, never `rem`. The design system uses `px` throughout.
- **No inline `<style>` blocks.** All styling via `styles.css`. If a component doesn't exist, add it to the shared stylesheet.
- **No `min-height` on `.mermaid-wrap`.** `mermaid-zoom.js` sizes from SVG natural dimensions.
- **Font sizes:** `13px` or `12px` for secondary text, not `0.85rem`.
- **`--i` stagger values:** subtitle uses `--i:1`, first content uses `--i:2`, increment from there.
- **`.anim` class:** Apply `class="anim" style="--i:N"` to sections for fadeUp animation. Presentation mode disables these automatically.

---

## The expressiveness contract (Skill 2 side)

The IR constrains what is expressed. This skill has latitude on how it's visually expressed. This latitude is the point — it keeps each atlas alive rather than stamped.

**Same IR, same visual character** — not the same bytes. The LLM is the translation layer. Output will vary in phrasing, minor markup, annotation style. The goal is quasi-idempotency of intent, not deterministic rendering.

**When to use rich treatment:**
- Container has ≥3 components with relationships → individual ve-cards + diagram
- Flow has ≥8 steps with key moments → diagram + companion cards for key steps
- Entity has architecturally significant fields → full schema-table

**When to use compact treatment:**
- Container has a simple description, no sub-structure → line in a bullet list
- Flow is straightforward → diagram only, no companion cards
- Entity is simple CRUD → name + one-line description in entity map, no schema detail

The agent reads the IR's depth and significance signals and adapts visual weight accordingly.

---

## Pitfalls

- **Don't use Mermaid C4 syntax** (`C4Context`, `C4Container`, `C4Component`). Experimental, renders poorly. Use `graph TD` with `classDef`. The .mmd files from Skill 1 should already follow this — verify.
- **Don't set `min-height` on diagram containers.** `mermaid-zoom.js` handles sizing. Forced min-heights cause oversized containers for small diagrams.
- **Don't use `<script type="module">` for local scripts.** Chrome blocks external ES modules on `file://` due to CORS. Use classic `<script src="..." defer>`.
- **Don't use opaque section IDs.** `#s0`, `#section-4` → bad. `#containers`, `#agent-loop` → good.
- **Don't add inline styles for component-level styling.** Use the design system classes. If a visual pattern recurs, it belongs in `styles.css`.
- **Don't forget `mermaid.initialize({ startOnLoad: false })`.** Without it, Mermaid auto-renders on DOMContentLoaded, racing with `mermaid-zoom.js`. Symptom: diagrams flash, render twice.
- **Don't forget `defer` on ALL body scripts.** Inconsistent `defer` causes race conditions between page-nav, scrollspy, and mermaid-zoom.
- **Don't use `graph LR` with unlinked subgraphs.** Mermaid stacks them vertically. Add invisible link `subA ~~~ subB` for side-by-side.
- **Edge label clipping.** Mermaid v11 clips the last 1-2 chars of edge labels. Append `&ensp;` to the label text.
- **Don't put content outside `<section>` elements.** Presentation mode won't see it and it'll persist visually during slides, breaking the experience.
- **Don't duplicate diagram source.** The `.mmd` files are the source of truth. Embed their content into `<script type="text/plain" class="diagram-source">` — don't rewrite or hand-modify the Mermaid in HTML.
- **Don't hardcode GitHub links.** Use `data-ref` attributes and let `enhancer.js` + `refs.js` handle link generation.
- **Paragraph length.** No paragraph longer than 3 lines. The atlas is for scanning, not reading. If it's longer, restructure into a visual component.

---

## Verification checklist

Before declaring the HTML complete:

- [ ] **Every IR page rendered.** One HTML file per IR page, matching `atlas.yaml` manifest.
- [ ] **Diagrams render.** Open each page in browser, verify Mermaid diagrams appear. Test with `python3 -m http.server 8765`.
- [ ] **TOC works.** Multi-page TOC present in every page, section links scroll correctly.
- [ ] **Presentation mode works.** Press P key, verify slides cycle through all sections.
- [ ] **refs.js wired.** `data-ref` chips become GitHub links when enhancer.js loads.
- [ ] **No inline styles for layout.** Grep for `style=` — only allowed for `--i` stagger values and KPI card value colours.
- [ ] **Section IDs semantic.** Grep for `id="s[0-9]` — zero hits.
- [ ] **Script order correct.** Verify `<head>` and body script order matches the skeleton above.
- [ ] **Scan time.** Each page scannable in ~2 minutes. Full atlas traversable in ~10 minutes. If not, prune.
- [ ] **Discipline check.** No decisions, no gotchas, no "how to build" content. Shape only. Work-context → CONTEXT.md.
