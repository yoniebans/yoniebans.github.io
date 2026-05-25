<!--
Reference for atlas-lifecycle skill — NOT a standalone skill.
name: atlas-genesis
description: Reverse-engineer an interactive HTML atlas for an existing project. Per-page authoring with focused codebase reads, coherence review at the end.
-->


# Atlas genesis

**When:** "Get up to speed with [existing project]", "help me work on my repo",
"onboard to this codebase", or returning to a project after >1 month with a
stale/missing atlas.

**Pre-requisite:** Read the parent SKILL.md first — it covers the commons/atlas
framing, design system, discipline rules, and git conventions that this procedure
depends on.

---

## Step 0 — Confirm mode

Ask: "Is this brownfield (existing code, atlas needed) or greenfield (new project)
or a single task?" Don't assume.

## Step 1 — Pre-flight reads (mandatory, in order)

```
1. commons/docs/abstract.md              (≤1 min)
2. atlas/docs/structure.md               (≤1 min)
3. atlas/docs/discipline.md              (≤1 min)
4. atlas/docs/lifecycle.md               (≤2 min)
5. references/design-system.md           (component catalogue, decision framework, anti-patterns)
6. An existing atlas's index.html        (exemplar — see components assembled in practice)
```

These live in the `yoniebans.github.io` repo at `atlas/docs/` and `commons/docs/`.
Do NOT start static analysis before this — you'll miss the discipline rules.

## Step 2 — Discovery pass (agent produces, before asking the user)

### 2a — Code available (static analysis)

| Target page | Inspect |
|---|---|
| System architecture (L1 + L2) | Entry points, public APIs, `docker-compose.yml`, k8s manifests, CLI surfaces, service configs |
| Data model | ORM models, `CREATE TABLE`, schema/migration files, Prisma/SQLAlchemy/Django, protobuf |
| Deployment | IaC (Terraform, Pulumi, CDK), k8s, CI configs, `fly.toml`/`render.yaml` |

Use parallel tool calls. This is the biggest timesaver.

### 2b — Documents only (no code access)

When the user has requirement docs/specs but no codebase:
- Skip static analysis
- Ingest all documents, synthesize the system shape
- Mark planned features inline ("(planned)")
- Skip deployment section if no infra info

## Step 3 — Draft atlas plan (batched interview)

Ship the user ONE message containing:

1. **Proposed page list with essences** — which pages, what each covers, the essence
   of each (the quality bar)
2. **Proposed authoring order** — concrete → abstract. Typically: system architecture
   → data model → sequences → diataxis
3. **Candidate L3 components** — which containers have ≥3 meaningful internal parts
   with architectural relationships
4. **Candidate flows** — list 6–10, ask user to pick 3–5 that "define how the system
   thinks"
5. **Judgment calls as numbered questions with your inferred answers**

**Never ask open-ended "what do you want?"** — always "here's what I'd do, confirm
or correct."

## Step 4 — Set up the atlas directory

1. Create the atlas directory (standalone repo or `<project>/atlas/`)
2. Add the design system as a `base/` git submodule:
   ```bash
   git submodule add https://github.com/yoniebans/yoniebans.github.io.git base
   ```
3. Create `refs.js`:
   ```js
   window.ATLAS_REFS = {
     "repo": "Owner/repo-name",
     "branch": "main",
     "refs": {}
   };
   ```

## Step 5 — Author HTML pages (per-page loop)

**Do NOT batch-author all pages at once.** Each page gets its own focused pass.

### For each page, in order:

#### 5a. Context load
- Read already-built pages (context for current page)
- Re-read the page's declared essence from the plan

#### 5b. Focused codebase read
- Go deeper into the specific domain this page covers
- Attention proportional to complexity, not a fixed budget

#### 5c. Author the page
- Write HTML following the design system (see parent SKILL.md + `references/design-system.md`)
- Build on earlier pages — don't re-explain containers already covered
- Update `refs.js` with new concept → repo path mappings
- Load order in footer: `refs.js` BEFORE `enhancer.js` (both `defer`, execute in order)

#### 5d. Self-verify against essence
- Does it cover what the essence says?
- Does it stay in its lane?
- Discipline check: ≤3-line paragraphs? No decisions? No gotchas? Prose supports diagrams?
- Run `scripts/audit-mermaid-labels.py <page>`

## Step 6 — Coherence review (agent-produced, human-read)

After all pages, produce a review at `reviews/YYYY-MM-DD-coherence.md`:

### Per-page assessment
- **Essence adherence** — does the page deliver?
- **Discipline compliance** — paragraphs > 3 lines? Decisions crept in?
- **Codebase accuracy** — anything unverifiable or misleadingly simplified?

### Cross-page coherence
- **Overlap** — concepts explained at same depth on multiple pages?
- **Gaps** — important codebase areas no page covers?
- **Concept ownership** — clear which page "owns" each concept?
- **Mental model fluidity** — coherent story reading in order?
- **Cross-page links** — when a detail page references another's diagram, is there a link?
- **Terminology consistency** — same things called same names?

## Step 7 — User reviews in browser

User opens each page and provides feedback. Iterate via `patch`.

---

## Re-orientation (returning after >1 month)

Open the atlas in a browser, read it cold, spot-check against the code.
- Nothing surprises → proceed with work.
- Something surprises → stop, fix the atlas, then proceed.

---

## Pitfalls

- Don't skip the atlas docs reads — discipline rules are the whole point.
- Don't ask open-ended interview questions — always include your inference.
- Don't start writing before the user confirms the plan.
- Don't put `refs.js` after `enhancer.js` in the script footer.
- Don't duplicate existing docs — link to them.
