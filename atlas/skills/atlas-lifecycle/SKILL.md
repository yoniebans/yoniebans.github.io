---
name: atlas-lifecycle
description: >
  Full lifecycle for interactive HTML architecture atlases — genesis, audit,
  drift detection (daily + weekly coherence), planning commons, and evaluation.
  An atlas is the architectural category of a commons: a shared, maintained,
  navigable artifact that humans and agents coordinate around. This is the
  single skill for the entire workflow. Load it whenever you touch atlas pages,
  author new ones, or investigate architecture.
version: 2.0.0
metadata:
  hermes:
    tags: [atlas, commons, architecture, documentation, C4, diagrams, codebase-onboarding, drift-detection, audit]
    related_skills: [codebase-inspection, github-pr-workflow, visual-explainer]
maturity: >
  v2.0.0, May 2026. Consolidation of four sibling skills (atlas-brownfield-genesis v0.5,
  atlas-audit v0.4, atlas-drift-detection, adhoc-planning-commons v0.1) into one skill.
  Enhanced drift detection with atlas linters and claim verification.
  Genericised for use on any repo — config-driven via daemon.yaml.
---

# Atlas lifecycle

> **One skill, five phases.** This consolidates the former `atlas-brownfield-genesis`,
> `atlas-audit`, `atlas-drift-detection`, and `adhoc-planning-commons` skills.
> Those siblings are archived — this is the single source of truth.

**Trigger:** Any request involving architecture atlases — creating, auditing,
maintaining, evaluating, or planning changes to them. Also triggers on
"get up to speed with [project]", "onboard to this codebase", "check for drift",
"evaluate the architecture", or returning to a project after >1 month.

---

## Commons and atlas — the framing

**Commons** is the umbrella concept (adopted May 2026): a shared, living reference
artifact that humans and agents coordinate around. Not documentation (which dies),
not chat (which scrolls), not memory (which is private) — a navigable surface that
both parties read, point at, refine, and maintain together.

**Atlas** is one *category* of commons — specifically, the **architectural commons**
of a codebase. Other categories exist (Concept, System, Timeline, Decision, Snapshot,
Proposal) but this skill governs the atlas category.

The name `atlas` stays for the artifact. Low rename fatigue — paths, repos, skill
names, 69+ files unchanged. `Commons` sits *above* atlas, not beside it. If a future
session hits a naming loop ("rename atlas because it's over-used"), the answer is
already resolved here.

**Canonical docs** (read these — they define what a good commons/atlas looks like):

| Doc | Location in `yoniebans.github.io` | Purpose |
|---|---|---|
| `commons/docs/abstract.md` | What a commons is, categories, relationship to other artifacts |
| `commons/docs/messaging.md` | The pitch — why commons matter, who they matter to |
| `commons/docs/attribution.md` | Lineage — visual-explainer credit, .txt parallel convergence |
| `atlas/docs/structure.md` | Page types, directory layout, design system |
| `atlas/docs/discipline.md` | Rules that keep it a helicopter view |
| `atlas/docs/lifecycle.md` | Genesis, authoring model, maintenance, review |

These docs live in the `yoniebans/yoniebans.github.io` repo. This skill is the
**how-to-execute**; the docs are the **what-and-why**. If they conflict, the docs
win and this skill needs patching.

---

## Design system

Every atlas page uses a shared design system. The CSS, JS, and font stack are
canonically hosted at **`yoniebans.github.io`** (repo: `yoniebans/yoniebans.github.io`).

### Shared assets

| File | Purpose |
|---|---|
| `styles.css` | Blueprint-aesthetic theme. Graph-paper background, DM Sans + Fira Code, 7 accent colors with dim tints, full dark/light auto-theme. Card vocabulary: `.ve-card`, `.kpi-card`, `.callout`, `.pipeline-step`, `.schema-table`, `.companion-grid`. |
| `mermaid-zoom.js` | Renders all Mermaid diagram sources. Per-diagram zoom/pan toolbar. Classic (non-module) script for `file://` compat. |
| `scrollspy.js` | Highlights active section in sidebar TOC on scroll. |
| `enhancer.js` | Reads `window.ATLAS_REFS` from `refs.js`, wraps `<code data-ref="slug">` chips in GitHub links. |
| `theme.js` | Dark/light toggle with system preference detection. |
| `presentation.js` + `presentation.css` | Slide mode (press `P`). |
| `page-nav.js` | Multi-page navigation tabs. |

### How pages reference the design system

**Canonical atlas pages** (in their own repo, e.g. `hermes-architecture`):
- `base/` is a git submodule pointing at `yoniebans.github.io`
- Pages reference assets as `base/styles.css`, `base/mermaid-zoom.js`, etc.
- Setup: `git submodule add https://github.com/yoniebans/yoniebans.github.io.git base`
- Update: `git submodule update --remote`

**Disposable workspace pages** (planning commons, spike pages):
- Load assets live from `https://yoniebans.github.io/styles.css` etc.
- No submodule needed — these are throwaway. Trade-off: needs internet to render.

### refs.js (concept → repo mapping)

Machine-readable file at the atlas root mapping concept slugs to source paths:

```js
window.ATLAS_REFS = {
  "repo": "Owner/repo-name",
  "branch": "main",
  "refs": {
    "some-component": { "path": "src/component.py" }
  }
};
```

`enhancer.js` reads this and wraps `<code data-ref="some-component">` chips in
GitHub links. Load order matters: `refs.js` BEFORE `enhancer.js` (both `defer`,
execute in document order).

### Component decision framework

| Content type | Component | Why |
|---|---|---|
| System shape with connections | Mermaid `graph TD` + `classDef` | Automatic edge routing |
| Entity relationships | Mermaid `erDiagram` + `.schema-table` | ER for shape, table for detail |
| Linear processing flow (3–6 steps) | `.pipeline` | Simpler than Mermaid |
| Request/response flow with timing | Mermaid `sequenceDiagram` | Lifelines and activation |
| Two things compared | `.grid-2` with `.ve-card` | Side-by-side |
| Three peer components | `.grid-3` with `.ve-card` | Equal visual weight |
| Many small items | `.card-grid` or `.grid-4` | Auto-flowing responsive |
| Component internals | `.inner-grid` + `.inner-card` inside `.ve-card` | Nested without noise |
| Key insight | `.callout` | Draws attention without being a card |
| System statistics | `.kpi-row` + `.kpi-card` | Hero numbers at a glance |

**Default to cards.** When unsure, `.ve-card` with `.node-list` or `.prose` inside
is almost always right. See `references/design-system.md` for the full catalogue,
anti-patterns, and quality checks.

### Mermaid conventions

- `graph TD` with `classDef` for C4-style diagrams. NOT `C4Context`/`C4Container` (experimental, breaks).
- `sequenceDiagram` for flows, `erDiagram` only for actual DB schema.
- Default zoom = 100%, container height from SVG natural size. No `min-height` on `.mermaid-wrap`.
- **Inline HTML in node labels MUST be balanced.** `<small>text</small>` not `<small>text`.
- **Don't define unscoped CSS classes that collide with Mermaid internals.** Never use bare `.label`, `.nodeLabel`, `.edgeLabel`, `.cluster`, `.node` — prefix with the page purpose (`.mode-label`, `.spike-label`).
- Run `scripts/audit-mermaid-labels.py <page>` to check both tag balance and CSS collisions.

### Grid wrapper rule

Standalone `.ve-card` elements have no `margin-bottom`. Spacing comes from grid
wrappers (`.grid-2`, `.grid-3`, `.grid-4`, `.card-grid`). Always wrap cards in a
grid container, even for a single card. Ad-hoc `style="margin-top:16px"` on
individual cards is a smell — the fix is structural (wrap in `.card-grid`).

---

## Phase routing — pick the right workflow

| User intent | Phase | Reference file |
|---|---|---|
| "Create an atlas", "onboard to codebase", "get up to speed" | **Genesis** | `references/genesis.md` |
| "Audit the atlas", "is the atlas accurate" | **Audit** | `references/audit.md` |
| "Check for drift", daily cron, "is the atlas stale" | **Drift detection** | `references/drift-detection.md` |
| "Run the coherence review", weekly cron | **Coherence review** | `references/coherence-review.md` |
| "Visualise this change", "before/after", "what are we touching" | **Planning commons** | `references/planning-commons.md` |
| "Evaluate the architecture", "list design decisions" | **Evaluation** | `references/evaluation.md` |

Load the appropriate reference file for the detailed procedure. This SKILL.md
covers the shared foundations and cross-phase knowledge.

---

## Discipline rules (all phases)

| Tempted to add... | Actual home |
|---|---|
| "We chose X because Y" | `decisions/` |
| "Watch out — Z silently retries" | `CONTEXT.md` |
| "Build with `just build`" | `CONTEXT.md` |
| Full API surface | Code / OpenAPI |
| Any paragraph > 3 lines | Trim it or move it |
| Before-after diagram for a proposed change | Disposable planning commons page, not the atlas |

**The test:** does this help someone build a mental model of the *shape*, or does
it help someone do *day-to-day work*? Shape → atlas. Work → elsewhere.

### Time budgets

- Each page: scannable in ~2 minutes
- Whole atlas: traversable in ~10 minutes
- Returning after >1 month: re-orientation in ~15 minutes

### L3 skip rule

≥3 meaningful internal components is necessary but not sufficient. Also required:
the components have **architectural relationships** to diagram, not just a flat list.
Sniff test: would a reader walk away with a sharper mental model than `ls` on the
directory? If no, skip.

---

## Git conventions

- Always pipe git/gh commands through `| cat` (prevents terminal from blocking).
- Use env vars for git author: `GIT_AUTHOR_NAME=morpheus GIT_COMMITTER_NAME=morpheus`.
- PR body via temp file (`--body-file /tmp/pr_body.md`) to avoid shell quoting issues.
- Never push to main directly. Branch + PR for all atlas changes.

---

## Configuration — daemon.yaml

Each tracked project has a config at `/mnt/hermes/projects/<project>/daemon.yaml`:

```yaml
project: <name>
repo:
  path: /path/to/source/repo
  remote: origin
  branch: main
  version_source: pyproject.toml    # file to grep for version string
atlas:
  path: /path/to/atlas/repo         # may differ from code repo
  pages:                             # which HTML pages exist
    - index.html
    - data-model.html
    - sequence-diagrams.html
    - diataxis.html
  refs_js: refs.js                   # relative to atlas path
detection:
  baseline_ref: "<commit-sha>"       # last known-good commit in code repo
  strategy: static-diff
```

A template lives at `templates/daemon.yaml` in this skill.

---

## Cross-phase pitfalls

### Editing pitfalls

- **V4A patch mode mangles Mermaid diagrams, pipeline HTML, and near-identical
  structures.** Use `patch(mode='replace')` with long unique anchors for atlas
  page surgery. Verify with `git diff` before committing. Run
  `scripts/audit-mermaid-labels.py` on any page whose diagram source was touched.

- **`base/styles.css` has page-level globals that collide with page-local classes.**
  `.main`, `.label`, `.header`, `.title`, `.content`, `.footer`, `.row`, `.col`,
  `.item`, `.active` — all claimed globally. Prefix page-local modifiers with the
  component name: `.costbar-seg.main-cost` not `.costbar-seg.main`.

- **Pseudo-tag placeholders break HTML structure.** Use `[placeholder]` not
  `<placeholder>` when sanitising identifiers. Browsers parse angle brackets as
  malformed tags.

- **Validate HTML balance after edits.** Count `<div>` opens vs closes.

### Process pitfalls

- **Audit Phase 1 is sequential — do NOT parallelise via `delegate_task`.** The
  cross-page coherence phase relies on one agent holding all per-page findings.

- **Don't put audit reports in the atlas repo.** They reference local paths. Store
  at `/mnt/hermes/vault/atlas/audits/<project>/YYYYMMDD.md`.

- **Don't trust cached session memory for PR/branch state.** Always `git fetch
  --prune` and `gh pr list` before reporting PR status.

- **daemon.yaml corruption from read_file dedup cache.** Use `cat` via terminal,
  not `read_file`.

- **Cron jobs can report `ok` while running empty.** After skill consolidation or
  script moves, verify: (1) skill names in cron resolve, (2) wrapper SCAN_SCRIPT
  path exists, (3) recent outputs are non-empty, (4) cross-check against known
  shipped changes.

- **Always switch atlas repo back to main after a drift run.**

- **Removed features hide better than added ones.** Grep every atlas module
  reference before trusting the page — `ls`/`find` to confirm files still exist.

- **New top-level directory ≠ automatic new L2 card.** Ask: does it create a new
  architectural surface, or extend an existing one? Default to extending.

- **New `plugins/<category>/` directory: check the Plugin Categories table first.**
  The drift home is usually an enumeration row, not a new diagram node.

### Rendering pitfalls

- **Headless Firefox fires before Mermaid renders.** Don't fight it. Serve via
  tailnet (`python3 -m http.server <port> --bind 0.0.0.0` + tailscale IP) and
  let the user capture in their real browser.

- **`browser_vision` fails on tall pages.** Scroll to section or use
  `browser_console` for measurements. Vision API caps at 8000px.

- **Diff against working pages BEFORE hypothesising about CSS/JS/fonts/Mermaid.**
  When one page has a bug others don't, the cause is in that page's markup.

---

## Verification (all phases)

1. Can each atlas page be scanned in ~2 minutes? The whole atlas in ~10?
2. Do diagrams render with zoom controls?
3. Do `data-ref` code chips link to correct GitHub paths?
4. Does the TOC sidebar highlight correctly on scroll?
5. Do discipline rules hold? (No decisions, no gotchas, paragraphs ≤3 lines)
6. Run `scripts/audit-mermaid-labels.py` — 0 findings.

---

## Maturity log

- **v1.0.0** (April 2026): Consolidated from 4 individual skills (brownfield-atlas-genesis, atlas-audit, atlas-drift-detection, atlas-evaluation). Proven through multiple runs on hermes-agent and hermes-architecture.
- **v2.0.0** (May 2026): Re-consolidated from the 4 canonical sibling skills in `yoniebans.github.io/atlas/skills/`. Enhanced drift detection with atlas linters (mermaid parse, data-ref validity, paragraph discipline, cross-page number consistency) and claim verification. Weekly coherence review added. Genericised for any repo via daemon.yaml config. Commons/atlas framing documented. Design system conventions made explicit.
