---
name: brownfield-atlas-genesis
description: "Reverse-engineer an interactive HTML atlas for an existing project — C4 + UML helicopter-view diagrams rendered as a multi-page site. Per-page authoring with focused codebase reads, coherence review at the end. Use when entering an existing project for the first time, or re-orienting after >1 month away."
maturity: "stabilizing — per-page rewrite April 28 2026."
---

# Brownfield atlas genesis

**Trigger:** "Get up to speed with [existing project]", "help me work on my repo Y", "onboard to this codebase", or returning to a project after >1 month away with a stale/missing atlas.

**Source of truth (read these, don't re-derive):**
- `atlas/docs/abstract.md` — what an atlas is (HTML site, shared abstract layer)
- `atlas/docs/structure.md` — page types, directory layout, design system
- `atlas/docs/discipline.md` — rules that prevent drift
- `atlas/docs/lifecycle.md` — genesis procedure, authoring model, maintenance

These docs live in the `yoniebans.github.io` repo at `atlas/docs/`. This skill is the **how-to-execute**; the docs are the **what-and-why**. If they conflict, the docs win and this skill needs patching.

---

## Step 0 — Confirm mode with the user

Don't assume. Ask: "Is this brownfield (existing code, atlas needed) or greenfield (new project) or a single task?" The user may have an atlas already, may want a subset, or may be in a different mode entirely.

## Step 1 — Pre-flight reads (mandatory, in order)

```
1. atlas/docs/abstract.md       (≤1 min)
2. atlas/docs/structure.md      (≤1 min)
3. atlas/docs/discipline.md     (≤1 min)
4. atlas/docs/lifecycle.md      (≤2 min)
```

These live in the `yoniebans.github.io` repo at `atlas/docs/`. Clone or pull the repo to read them locally.

Do these in parallel reads if the tooling allows. Do NOT start static analysis before this — you'll miss the discipline rules and produce pages that drift into CONTEXT.md / decisions/ territory.

Also read the reference example to load the HTML patterns:
```
5. An existing atlas's index.html as exemplar        (skim structure, not content)
6. The design system's styles.css                     (component vocabulary)
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

1. **Proposed page list with essences** — which HTML pages you'll produce, what each covers, and crucially: **the essence of each page** (the specific slice of the system it owns, what a reader should walk away understanding). The essence becomes the quality bar for that page.
2. **Proposed authoring order** — concrete → abstract. Typically: system architecture → data model → sequences → diataxis. Justify the order — later pages can reference earlier ones.
3. **Candidate L3 components** — which containers have ≥3 meaningful internal parts with architectural relationships
4. **Candidate flows** — list 6–10, ask user to pick the 3–5 that "define how the system thinks"
5. **Explicit judgment calls as numbered questions with your inferred answers**

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

1. Create the atlas directory (standalone repo or `<project>/atlas/`)
2. Add the design system as a `base/` git submodule pointing at `yoniebans.github.io`:

```bash
git submodule add https://github.com/yoniebans/yoniebans.github.io.git base
```

HTML pages reference assets as `base/styles.css`, `base/mermaid-zoom.js`, etc.

3. Create a `refs.js` with the project's repo:

```js
window.ATLAS_REFS = {
  "repo": "Owner/repo-name",
  "branch": "main",
  "refs": {}
};
```

## Step 5 — Author HTML pages (per-page loop)

**Do NOT batch-author all pages at once.** Each page gets its own focused pass. The ordering goes concrete → abstract (as confirmed with the user in Step 3).

### For each page, in order:

#### 5a. Context load
- **Read already-built pages** (if any). These are context for the current page — know what's been covered, what terminology has been established, what the reader will have already seen if they read the atlas in order.
- **Re-read the page's declared essence** from the plan (Step 3). This is the quality bar.

#### 5b. Focused codebase read
- **Go deeper into the specific domain** this page covers. The discovery pass (Step 2) gave a broad scan; now read the actual source files, schemas, configs, or flows that this page needs to accurately represent.
- If the data model page needs to show entity relationships, read the actual model definitions. If the sequences page needs to trace a flow, trace it through the code.
- This is where per-page quality comes from — attention proportional to complexity, not a fixed budget spread across all pages.

#### 5c. Author the page
- Write the HTML following the authoring guidance below.
- Build on what earlier pages established — don't re-explain containers that are already on the architecture page, reference them.
- Update `refs.js` with any new concept → repo path mappings from this page.

#### 5d. Self-verify against essence
- Re-read the page you just wrote.
- Does it cover what the essence says it should? Does it stay within its lane (not drifting into another page's territory)?
- Does it pass the discipline rules? (No decisions, no gotchas, paragraphs ≤3 lines, prose supports diagrams.)
- Fix any issues before moving to the next page.

### HTML authoring guidance

- **Use a reference example as in-context learning.** Read the corresponding page from an existing atlas and follow the same structure: `.wrap` > `.toc` + `.main`, `.sec-head` labels, `.ve-card` cards, `.diagram-shell` wrappers, `.companion-grid` footer.
- **Semantic section IDs.** Every section gets a stable kebab-case `id` (e.g. `#containers`, `#agent-loop`). No opaque IDs.
- **Mermaid diagrams.** Use `graph TD` with `classDef` for C4 diagrams (NOT the experimental C4 syntax). Use `sequenceDiagram` for flows, `erDiagram` for entities, `classDiagram` for class/interface relationships. For `graph LR` with disconnected subgraphs, add `old ~~~ new` invisible link to force side-by-side layout.
- **No min-height on diagram containers.** mermaid-zoom.js sizes containers from SVG natural dimensions. Don't set `min-height` in CSS or inline styles on `.mermaid-wrap`.
- **Orienting prose.** Metaphors, reading-keys, key-insight callouts, 1-sentence framing paragraphs. No paragraph longer than 3 lines.
- **Companion-page footer.** Every page links to the other atlas pages via `.companion-grid` with `.companion-link` cards (title + description).
- **Code chips with `data-ref`.** For every inline `<code>` chip that references a specific file/class/function in the repo, add `data-ref="slug"` matching a key in `refs.js`.

### Populate refs.js

As you author pages, build up `refs.js` with concept → repo path mappings (file-level only — GitHub doesn't support in-file deep links reliably). Target the load-bearing mentions — ~20-50 refs for a typical project.

## Step 6 — Coherence review (agent-produced, human-read)

After all pages are authored, produce a coherence review document. This is NOT a self-congratulatory summary — it's an honest assessment for the human to read.

### Per-page assessment
For each page:
- **Essence adherence:** Does the page deliver on its declared essence? What's strong, what's thin?
- **Discipline compliance:** Any paragraphs > 3 lines? Prose that doesn't support a diagram? Decisions or gotchas that crept in?
- **Codebase accuracy:** Anything the page claims that you couldn't verify in the code? Anything simplified to the point of being misleading?

### Cross-page coherence
- **Overlap:** Are any concepts explained at the same depth on multiple pages? (Some cross-referencing is fine; duplicated explanations are not.)
- **Gaps:** Is there anything important in the codebase that no page covers?
- **Concept ownership:** Is it clear which page "owns" each major concept? If a reader wants to understand X, is there exactly one page they'd go to?
- **Mental model fluidity:** If someone reads all pages in order, does a coherent mental model build up? Or do the pages feel like four disconnected documents?
- **Terminology consistency:** Are the same things called the same names across pages?

### Output
Write the review to a markdown file in the atlas directory (e.g. `coherence-review.md`). This file is for the human reviewer — it doesn't ship with the atlas. The human reads it, decides what to fix, and directs the agent.

## Step 7 — User reviews in browser

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

Per `atlas/docs/discipline.md` — while drafting each page, apply the redirection table:

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

- **Use semi-transparent fills in Mermaid `classDef`, not opaque pastels.** `classDef fill:` colors are baked into the diagram source and don't change on theme toggle. Opaque light pastels (e.g. `fill:#dbeafe`) become invisible in dark mode (light text on light fill). Instead, use 8-digit hex with low alpha: `classDef user fill:#0284c711,stroke:#0284c744,stroke-width:2px`. The transparency lets the background show through, working in both themes. This matches the pattern used on the C4 page (index.html). Do NOT use `color:#0f172a` as a workaround — it forces dark text that breaks in light mode when Mermaid re-renders.
- **Sequence diagram `rect` backgrounds need light-mode alternatives.** Mermaid `rect rgb(60, 20, 20)` backgrounds are hardcoded in diagram source. Dark backgrounds + dark text (light mode) = unreadable. The design system's `mermaid-zoom.js` includes `swapRectColors()` which maps dark rect colors to lighter alternatives in light mode. If you add new rect colors, register them in the `rectColorMap` object in `mermaid-zoom.js`.
- **Don't use Mermaid's C4 syntax** (`C4Context`, `C4Container`, `C4Component`). It's experimental, renders poorly in most Mermaid versions (including v11). Use `graph TD` with `classDef` styling. Same information, reliable rendering.
- **Always set `darkMode` in Mermaid `themeVariables`.** When using `theme: 'base'`, Mermaid derives alternating row fills for ER diagrams from `primaryColor`. Without `darkMode: true`, it lightens the color — producing near-white stripes in dark mode. The design system's `mermaid-zoom.js` sets this via the `themeVars(dark)` helper. If you ever touch the Mermaid config, keep `darkMode` in sync with the theme.
- **Don't skip the atlas docs reads.** The discipline rules are the whole point. Without them you'll produce a dense-docs site by accident.
- **Don't ask open-ended interview questions.** Always include your inference. User confirms or corrects.
- **Don't start writing pages before the user confirms the plan.** Producing 4 HTML pages and then finding out the user wanted a different container split is a large redo.
- **Don't duplicate existing docs.** If a developer-guide or docs site already covers something at the right level, link to it.
- **Don't hardcode styles.** Use the shared `styles.css` — don't add inline `<style>` blocks. If you need a component that doesn't exist, add it to the shared sheet.
- **Don't add min-height to diagram containers.** No inline `style="min-height:..."` on `mermaid-wrap`. No `min-height` in CSS for `.mermaid-wrap` or `.mermaid-viewport`. The `mermaid-zoom.js` sizes the container from the SVG's natural height at 100% zoom. Forced min-heights cause small diagrams to sit in oversized boxes and trigger the zoom engine to blow them up.
- **Don't use `graph LR` with unlinked subgraphs.** Mermaid stacks subgraphs vertically even in LR mode unless they have a cross-link. Add `subgraphA ~~~ subgraphB` (invisible link) to force side-by-side layout.
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
7. Does the coherence review surface any issues the human should address?

---

## Re-orientation (returning after >1 month)

Per lifecycle.md: open the atlas in a browser, read it cold, spot-check against the code.

- Nothing surprises → proceed with work.
- Something surprises → **stop, fix the atlas, then proceed.**

---

## Follow-on: Architectural evaluation

After atlas is complete, the user may want to evaluate the architecture — assess quality attributes, identify tradeoffs, rate risks. This is a different activity from atlas genesis.

## Maturity log

- **v0.1:** Markdown atlas with one-diagram-per-file.
- **v0.2:** Docs-only variant validated.
- **v0.3:** HTML-first rewrite. Agent produces HTML directly using design system reference.
- **v0.4:** Per-page rewrite. Batch authoring replaced with per-page loop: focused codebase read per page, awareness of already-built pages, self-verification against declared essence. Agent-produced coherence review added as final quality gate.
