Page types, directory layout, and design system for an atlas. See [abstract](abstract.md) for what this artifact is and why.

---

## Page types (guidance, not mandate)

Which pages a project needs depends on its complexity. The agent proposes which are warranted; the user confirms.

| Page type | Filename (conventional) | When to include | What it covers |
|---|---|---|---|
| **System architecture** | `index.html` | Always — every project needs this | C4 L1 context + L2 containers + L3 components (stacked or split depending on system size). KPI strip. Tech stack summary. |
| **Data model** | `data-model.html` | When the project has persistent state | ER diagrams, schema tables, wire formats, provider interfaces |
| **Interaction sequences** | `sequence-diagrams.html` | When 3+ non-trivial flows define the system | One sequence diagram per flow, with participants + key-steps cards |
| **Documentation map** | `diataxis.html` | When the project is complex enough to need orientation beyond structure | Diátaxis lens: mental model / tutorial, extension points / how-to, design principles / explanation |

A small project might only need system architecture + data model. A large one might need all four. The filenames are conventional — consistency across projects makes the agent's job easier and makes atlases feel familiar.

---

## Directory layout

```
<project>/atlas/
├── styles.css              ← shared design system
├── mermaid-zoom.js         ← zoom/pan engine for diagrams
├── scrollspy.js            ← TOC active-section highlighting
├── enhancer.js             ← refs.js → repo link enrichment
├── refs.js                 ← concept → repo path mapping (classic script, sets window.ATLAS_REFS)
│
├── index.html              ← system architecture (always present)
├── data-model.html         ← data model (when relevant)
├── sequence-diagrams.html  ← interaction sequences (when relevant)
└── diataxis.html           ← documentation map (when relevant)
```

The shared assets (CSS/JS) are copied from the reference example. The HTML pages are the authored content.

---

## Design system

The atlas uses a shared design system that gives every project's atlas a consistent look and feel. Assets are carried in the atlas directory, not linked from a CDN.

### Shared assets (copy from reference)

- **`styles.css`** — blueprint-aesthetic theme. Graph-paper background, DM Sans + Fira Code, 7 named accent colors with dim tints, full dark/light auto-theme. Card vocabulary: `.ve-card`, `.kpi-card`, `.callout`, `.pipeline-step`, `.schema-table`, `.companion-grid`.
- **`mermaid-zoom.js`** — renders all Mermaid diagram sources on the page. Per-diagram zoom/pan toolbar with smart-fit, 1:1, drag-pan, Ctrl-wheel zoom, "open standalone" action. Classic (non-module) script for file:// compatibility.
- **`scrollspy.js`** — highlights the active section in the sidebar TOC as the user scrolls.
- **`enhancer.js`** — reads `window.ATLAS_REFS` (set by `refs.js`), wraps `<code data-ref="slug">` chips in GitHub links with external-link icons.

### refs.json (concept → repo mapping)

Machine-readable file mapping abstract concepts to source paths:

```json
{
  "repo": "Owner/repo-name",
  "branch": "main",
  "refs": {
    "some-component": { "path": "src/component.py" },
    "some-module":    { "path": "src/module.py" }
  }
}
```

Links resolve to file-level on GitHub (e.g. `github.com/.../blob/main/src/component.py`). The enhancer degrades gracefully — if `refs.js` fails to load, code chips stay as-is.

### Page anatomy

Every HTML page follows this structure:

1. `<head>` — Google Fonts preconnect, `<link>` to `styles.css`, `<script src>` for Mermaid UMD
2. `<body>` — `.wrap` > `.toc` (sticky sidebar) + `.main` (content)
3. Content sections — each has a semantic `id`, a `.sec-head` label, and an `<h2>` title
4. Diagrams — wrapped in `.diagram-shell` > `.mermaid-wrap` > `.mermaid-viewport` > `.mermaid-canvas`, with source in `<script type="text/plain" class="diagram-source">`
5. Companion-page footer — `.companion-grid` with `.companion-link` cards (title + description) linking to the other atlas pages
6. Tail scripts — `mermaid-zoom.js` (defer), `scrollspy.js`, `enhancer.js`

### Mermaid conventions

- Use `graph TD` with `classDef` styling for C4 diagrams. Do NOT use Mermaid's experimental C4 syntax (`C4Context`, `C4Container`) — it renders poorly.
- Use `sequenceDiagram` for flows, `erDiagram` for entity relationships, `classDiagram` for class/interface diagrams.
- Theme is set in `mermaid-zoom.js` — one canonical "blueprint blue" palette for all pages.

---

## Design system canonical home

The shared design system assets (CSS, JS) are canonically hosted at **yoniebans.github.io** (repo: `yoniebans/yoniebans.github.io`). Files at root: `styles.css`, `mermaid-zoom.js`, `scrollspy.js`, `enhancer.js`, `presentation.js`, `presentation.css`.

All atlas pages and posts reference these via absolute paths (`/styles.css`). Per-project atlases (hermes-architecture, trex-atlas, etc.) should migrate to referencing the canonical home rather than carrying their own copies — eliminates style drift across repos.

## Reference example

`/mnt/hermes/source/hermes-architecture/` — the atlas of hermes-agent. 4 pages, full design system. This is the canonical in-context learning source for the agent when producing new atlases.
