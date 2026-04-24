---
name: brownfield-atlas-genesis
description: "Reverse-engineer an interactive HTML atlas for an existing project — C4 + UML helicopter-view diagrams rendered as a multi-page site. Covers discovery pass, batched interview, HTML authoring from the design system reference, and refs.js wiring. Use when entering an existing project for the first time, or re-orienting after >1 month away."
maturity: "stabilizing — 3 runs (April 2026: hermes-agent codebase, trex docs-only, hermes-architecture site). HTML-first rewrite April 20 2026."
---

# Brownfield atlas genesis

**Trigger:** "Get up to speed with [existing project]", "help me work on my repo Y", "onboard to this codebase", or returning to a project after >1 month away with a stale/missing atlas.

**Source of truth (read these, don't re-derive):**
- `/mnt/hermes/vault/atlas/abstract.md` — what an atlas is (HTML site, shared abstract layer)
- `/mnt/hermes/vault/atlas/structure.md` — page types, directory layout, design system
- `/mnt/hermes/vault/atlas/discipline.md` — rules that prevent drift
- `/mnt/hermes/vault/atlas/lifecycle.md` — genesis procedure, authoring model, maintenance

This skill is the **how-to-execute**; the vault is the **what-and-why**. If they conflict, the vault wins and this skill needs patching.

---

## Step 0 — Confirm mode with the user

Don't assume. Ask: "Is this brownfield (existing code, atlas needed) or greenfield (new project) or a single task?" The user may have an atlas already, may want a subset, or may be in a different mode entirely.

## Step 1 — Pre-flight reads (mandatory, in order)

```
1. vault/atlas/abstract.md      (≤1 min)
2. vault/atlas/structure.md     (≤1 min)
3. vault/atlas/discipline.md    (≤1 min)
4. vault/atlas/lifecycle.md     (≤2 min)
```

Do these in parallel reads if the tooling allows. Do NOT start static analysis before this — you'll miss the discipline rules and produce pages that drift into CONTEXT.md / decisions/ territory.

Also read the reference example to load the HTML patterns:
```
5. /mnt/hermes/source/hermes-architecture/index.html      (skim structure, not content)
6. /mnt/hermes/source/hermes-architecture/styles.css       (component vocabulary)
```

## Step 2 — Discovery pass (agent produces, before asking the user anything)

Two variants depending on what's available:

### 2a — Code available (static analysis)

Per lifecycle.md's three-way split, the agent produces these from inspection:

| Target page | Inspect |
|---|---|
| System architecture (L1 + L2) | Entry points, public APIs, webhook receivers, CLI surfaces, `docker-compose.yml`, k8s manifests, `Procfile`, monorepo boundaries, service configs |
| Data model | ORM models, `CREATE TABLE` statements, schema/migration files, Prisma/SQLAlchemy/Django, protobuf |
| Deployment section | IaC (Terraform, Pulumi, CDK), k8s manifests, CI configs, `fly.toml` / `render.yaml` |

**Commands that pay off:**
- `find <dir> -maxdepth 3 -type d` — container layout
- `search_files target=files pattern='*.md'` — existing docs
- `search_files pattern='^(CREATE TABLE|class |def )'` — schema + surface area
- Existing docs site / README → `web_extract` in parallel with the filesystem pass
- `ls` on the obvious containers (gateway/, tools/, plugins/, agent/)

Use parallel tool calls. This is the biggest timesaver.

### 2b — Documents only (no code access)

When the user has requirement docs, specs, or design documents but no codebase:

1. **Find and ingest all documents** — `search_files target=files` in the project dir, read everything
2. **Extract from DOCX** — `python-docx` (install via `uv pip install python-docx`): iterate `doc.paragraphs` AND `doc.tables`
3. **Extract from PDF** — `pymupdf` (install via `uv pip install pymupdf`): `page.get_text()` per page
4. **Synthesize the same atlas pages** from requirements rather than code — the structure is identical, you just derive it from described behavior instead of observed structure

Key differences from code-based flow:
- Deployment section — almost certainly skip (requirement docs rarely contain infra detail)
- Data model — infer entities from described workflows, mark fields as inferred vs explicit
- Flows — derive from described user workflows rather than traced call graphs
- Mark planned/unreleased features inline (e.g. "(planned)")

## Step 3 — Draft the atlas plan and propose to user (batched interview)

Before writing a single page, ship the user ONE message that contains:

1. **Proposed page list** — which HTML pages you'll produce, what each covers
2. **Candidate L3 components** — which containers have ≥3 meaningful internal parts with architectural relationships
3. **Candidate flows** — list 6–10, ask user to pick the 3–5 that "define how the system thinks"
4. **Explicit judgment calls as numbered questions with your inferred answers**

Example question format (critical — must include your inference):
> "I'm counting the docs site and GitHub as *related but out-of-scope* (not runtime traffic). Show only systems that exchange runtime traffic with the running agent. Agree?"

**Never ask an open-ended "what do you want?"** — always "here's what I'd do, confirm or correct."

Typical batched questions:
- Which pages are warranted? (Always system-architecture; data-model if persistent state; sequences if 3+ flows; documentation-map if complex enough)
- External actors: one user actor or split by entry-point?
- Container shape: peer containers or adapters-around-core?
- L3 candidates: which containers clear the ≥3-components bar meaningfully?
- Flows: which 3–5 define the system?
- Any planned/imminent architecture changes to reflect vs ignore?

## Step 4 — Set up the atlas directory

Before authoring pages:

1. Create `<project>/atlas/` directory
2. Copy design system assets from the canonical home (`yoniebans.github.io` repo):

```bash
cp /mnt/hermes/source/yoniebans.github.io/styles.css <project>/atlas/
cp /mnt/hermes/source/yoniebans.github.io/mermaid-zoom.js <project>/atlas/
cp /mnt/hermes/source/yoniebans.github.io/scrollspy.js <project>/atlas/
cp /mnt/hermes/source/yoniebans.github.io/enhancer.js <project>/atlas/
```

Note: The canonical design system lives at `yoniebans.github.io` root, NOT in hermes-architecture (which is a consumer, not the source). If deploying to GitHub Pages under the same domain, reference via absolute paths (`/styles.css`) instead of copying.

3. Create a `refs.js` with the project's repo:

```js
window.ATLAS_REFS = {
  "repo": "Owner/repo-name",
  "branch": "main",
  "refs": {}
};
```

## Step 5 — Author HTML pages (after user confirms plan)

Produce pages in this order — each builds on the previous:

1. **`index.html`** — system architecture (always). C4 L1 context + L2 containers + L3 components (stacked if the system is small, split into sections if large). Include KPI strip if meaningful stats exist. Tech stack summary.
2. **`data-model.html`** — when the project has persistent state. ER diagrams, schema tables, wire formats.
3. **`sequence-diagrams.html`** — when 3+ non-trivial flows define the system. One sequence diagram per flow, with participants + key-steps companion cards.
4. **`diataxis.html`** — when the project is complex enough. Mental model, extension points, design principles.

### HTML authoring guidance

- **Use the reference example as in-context learning.** Read the corresponding page from `/mnt/hermes/source/hermes-architecture/` and follow the same structure: `.wrap` > `.toc` + `.main`, `.sec-head` labels, `.ve-card` cards, `.diagram-shell` wrappers, `.companion-grid` footer.
- **Semantic section IDs.** Every section gets a stable kebab-case `id` (e.g. `#containers`, `#agent-loop`). No opaque IDs.
- **Mermaid diagrams.** Use `graph TD` with `classDef` for C4 diagrams (NOT the experimental C4 syntax). Use `sequenceDiagram` for flows, `erDiagram` for entities, `classDiagram` for class/interface relationships. For `graph LR` with disconnected subgraphs, add `old ~~~ new` invisible link to force side-by-side layout.
- **No min-height on diagram containers.** mermaid-zoom.js sizes containers from SVG natural dimensions. Don't set `min-height` in CSS or inline styles on `.mermaid-wrap`.
- **Orienting prose.** Metaphors, reading-keys, key-insight callouts, 1-sentence framing paragraphs. No paragraph longer than 3 lines.
- **Companion-page footer.** Every page links to the other atlas pages via `.companion-grid` with `.companion-link` cards (title + description).
- **Code chips with `data-ref`.** For every inline `<code>` chip that references a specific file/class/function in the repo, add `data-ref="slug"` matching a key in `refs.js`.

### Populate refs.js

As you author pages, build up `refs.js` with concept → repo path mappings (file-level only — GitHub doesn't support in-file deep links reliably). Target the load-bearing mentions — ~20-50 refs for a typical project.

## Step 6 — User reviews in browser

User opens each page via `file://` (or local server) and provides feedback. Agent patches based on feedback. Iterate until the user is satisfied.

Typical feedback patterns:
- "This section is a wall of text" → restructure into pipeline/cards/bullets
- "This diagram is too wide" → adjust Mermaid layout or wrap
- "Missing X" → add it
- "Too much detail on Y" → prune, move to CONTEXT.md if it's work-context

---

## The L3 skip rule

Structure.md says: "L3 only when container has ≥3 meaningful internal components."

Refinement: ≥3 components is *necessary but not sufficient*. Also required: the components have **architectural relationships** to diagram, not just a flat list. A service with 40 handler files is shallow — an L3 section would be a filename list in a box. Skip it.

Sniff test: *would a reader walk away with a sharper mental model than `ls` on the directory?* If no, skip.

---

## Discipline enforcement (the hardest part)

Per `vault/atlas/discipline.md` — while drafting each page, apply the redirection table:

| Tempted to add... | Actual home |
|---|---|
| "We chose X because Y" | `decisions/` |
| "Watch out — Z silently retries" | `CONTEXT.md` |
| "Build with `just build`" | `CONTEXT.md` |
| "Here's the full API surface" | Code / OpenAPI — not the atlas |
| Any paragraph > 3 lines | Trim it or move it |

**The test:** *does this help someone build a mental model of the shape, or does it help someone do day-to-day work?* Shape → atlas. Work → elsewhere.

---

## Pitfalls

- **Don't use Mermaid's C4 syntax** (`C4Context`, `C4Container`, `C4Component`). It's experimental, renders poorly in most Mermaid versions (including v11). Use `graph TD` with `classDef` styling. Same information, reliable rendering.
- **Don't skip the vault reads.** The discipline rules are the whole point. Without them you'll produce a dense-docs site by accident.
- **Don't ask open-ended interview questions.** Always include your inference. User confirms or corrects.
- **Don't start writing pages before the user confirms the plan.** Producing 4 HTML pages and then finding out the user wanted a different container split is a large redo.
- **Don't duplicate existing docs.** If a developer-guide or docs site already covers something at the right level, link to it.
- **Don't hardcode styles.** Use the shared `styles.css` — don't add inline `<style>` blocks. If you need a component that doesn't exist, add it to the shared sheet.
- **Don't add min-height to diagram containers.** No inline `style="min-height:..."` on `mermaid-wrap`. No `min-height` in CSS for `.mermaid-wrap` or `.mermaid-viewport`. The `mermaid-zoom.js` sizes the container from the SVG's natural height at 100% zoom. Forced min-heights cause small diagrams to sit in oversized boxes and trigger the zoom engine to blow them up.
- **Don't use `graph LR` with unlinked subgraphs.** Mermaid stacks subgraphs vertically even in LR mode unless they have a cross-link. Add `subgraphA ~~~ subgraphB` (invisible link) to force side-by-side layout.
- **Don't add min-height to mermaid-wrap.** `mermaid-zoom.js` sizes the container from the SVG's natural dimensions. Adding inline `style="min-height:400px"` forces oversized containers for simple diagrams. Leave it bare: `<div class="mermaid-wrap">`. Default zoom is 100%, top-left aligned. Zoom buttons and fullscreen are available for user control.
- **Don't use `<script type="module">` for local scripts.** Chrome blocks external ES modules on `file://` due to CORS. Use classic `<script src="..." defer>` for all local JS. The Mermaid UMD build from CDN is loaded via a classic script tag in `<head>`.
- **Don't use opaque section IDs** (`#s0`, `#s1`). Use semantic kebab-case IDs (`#tool-system`, `#agent-loop`). Other pages link to these.
- **Don't write CONTEXT.md first.** Atlas before CONTEXT — otherwise CONTEXT picks up structural content that belongs in the atlas.

---

## Verification

Before declaring done:

1. Can the user scan each page in ~2 minutes? (If not, prune.)
2. Can the user traverse the whole atlas in ~10 minutes? (If not, fewer pages or less content.)
3. Does each page pass the discipline rules? (No decisions, no gotchas, paragraphs ≤3 lines.)
4. Do diagrams render on `file://`? (If not, check the script loading — classic, not module.)
5. Do companion-page links work? (Each page links to the others.)
6. Do `data-ref` code chips link to the correct GitHub paths?
7. Ask the user: "Read it and tell me where it surprises you. Surprises = drift = atlas is lying."

---

## Re-orientation (returning after >1 month)

Per lifecycle.md: open the atlas in a browser, read it cold, spot-check against the code.

- Nothing surprises → proceed with work.
- Something surprises → **stop, fix the atlas, then proceed.**

---

## Follow-on: Architectural evaluation

After atlas is complete, the user may want to evaluate the architecture — assess quality attributes, identify tradeoffs, rate risks. This is a different activity from atlas genesis.



## Atlas IR Protocol (in progress — spec 001)

An intermediate representation protocol is being designed at `/mnt/hermes/projects/hermes-architecture/specs/001-atlas-ir-layer.md` with reference IR templates at `/mnt/hermes/projects/hermes-architecture/specs/reference-ir/`. When adopted, it will restructure atlas genesis into two explicit passes:

1. **Skill 1 (system modelling):** Codebase → IR YAML. Express the system in domain-specific vocabulary (C4 for architecture, entity-relationship for data, flow/sequence for behaviour, Diátaxis for conceptual orientation). No rendering decisions — no colours, grids, CSS.
2. **Skill 2 (visual translation):** IR YAML → HTML. Render the domain model using the design system. Visual judgment and expressiveness live here.

The IR is a **diagnostic seam** (not a human gate) — the agent runs both passes in one flow. Purpose: traceability (where did it break?) and quasi-idempotency (same structural intent, not same bytes).

Reference IR templates exist for all four page types: `c4-architecture.yaml`, `data-model.yaml`, `sequences.yaml`, `documentation-map.yaml`. Each defines the exhaustive domain vocabulary for that page type — the contract between Skill 1 and Skill 2.

**Do not switch to the IR flow until the spec is approved and Skill 1 + Skill 2 are written.** Until then, use the current direct-to-HTML flow.

## Maturity log

- **v0.1 (April 2026):** First execution on `hermes-agent`. Markdown atlas with one-diagram-per-file. Innovation: `.component-inventory.md` re-eval log.
- **v0.2 (April 2026):** Second execution on `trex` (docs-only variant). Validated docs-only flow.
- **v0.3 (April 2026):** HTML-first rewrite. Atlas is now an interactive HTML site, not a markdown directory. Agent produces HTML directly using design system reference. Vault notes rewritten to match. Old markdown atlas approach retired.
