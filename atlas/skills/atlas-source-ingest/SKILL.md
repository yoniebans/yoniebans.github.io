---
name: atlas-source-ingest
description: "Load structural understanding of a codebase into agent context. Three modes: cold start (full analysis), IR delta (existing IR + code changes), and PR review (scoped diff). Runs in the same context window as downstream skills (atlas-ir-system-modelling, atlas-drift-detection). No intermediate artifact — the output is the agent's loaded understanding."
maturity: "new — v0.1, April 2026. Untested."
metadata:
  hermes:
    tags: [atlas, ir, discovery, codebase, analysis]
    related_skills: [atlas-ir-system-modelling, atlas-ir-visual-translation, atlas-drift-detection]
---

# Atlas Source Ingest

Load structural understanding of a project into agent context. This skill is the first phase of any atlas workflow — it ensures the agent has enough grey matter loaded to do whatever comes next (produce IR, update IR, review a PR).

**This skill produces no artifact.** Its output is the agent's contextual understanding. Downstream skills (loaded in the same context window) consume that understanding directly.

**Three modes.** The source and strategy change based on what already exists:

| Mode | When | Source | Strategy |
|---|---|---|---|
| **Cold start** | No prior IR, first encounter with codebase | Full codebase | Heavy static analysis pass |
| **IR delta** | IR exists, code has changed since IR was produced | IR YAML + git diff | Read IR first, focus analysis on what changed |
| **PR review** | Reviewing a specific PR or branch | IR YAML + PR diff | Scoped — only what the change touches |

---

## Invocation

The user triggers the pipeline by loading the three atlas skills and providing a prompt. The agent needs three things to proceed:

1. **Source repo** — path to the codebase under investigation
2. **Output directory** — where the IR YAML and rendered HTML will be written
3. **Mode** — cold start, IR delta, or PR review (can often be inferred)

Example invocation:
```
hermes -s atlas-source-ingest,atlas-ir-system-modelling,atlas-ir-visual-translation
```
Then: "Build an atlas for /mnt/hermes/source/hermes-agent-data-pipeline, output to /mnt/hermes/workspace/hermes-agent-data-pipeline-atlas/"

**Before proceeding, confirm with the user:**

Present what the agent has inferred and get approval:

1. **Source repo:** path, name, what it appears to be
2. **Detected mode:** cold start / IR delta / PR review, and why
3. **Output directory:** where IR and HTML will be written
4. **Any ambiguities** — flag them, propose a default, ask

Only proceed after the user confirms. This is the one user checkpoint in the pipeline — everything after runs autonomously.

---

## Mode detection

Determine which mode to use before starting analysis:

1. Does an `atlas/` directory with IR YAML exist for this project?
   - No → **Cold start**
   - Yes → Is this a PR review or general update?
     - PR/branch → **PR review**
     - General → **IR delta**

If ambiguous, ask the user. Don't guess.

---

## Cold Start

Full codebase analysis. The agent knows nothing — build structural understanding from scratch.

### What to inspect (parallel where possible)

**Filesystem shape:**
- `find <dir> -maxdepth 3 -type d` — container/module layout
- `search_files target=files pattern='*.md'` — existing docs
- Entry points: `main.py`, `index.ts`, `cmd/`, `bin/`, CLI entry, API routes
- Build/deploy config: `docker-compose.yml`, `Dockerfile`, k8s manifests, `Procfile`, CI configs, `fly.toml`, `render.yaml`

**Schema and data:**
- ORM models, `CREATE TABLE`, migration files
- Prisma, SQLAlchemy, Django models, protobuf/gRPC definitions
- Pydantic models, Zod schemas, JSON Schema files
- Config files with structured data (YAML, TOML, JSON)

**Surface area:**
- Public APIs, webhook receivers, CLI commands, event listeners
- `search_files pattern='^(class |def |export |interface |type )' file_glob='*.py'` (adapt glob per language)
- Route definitions, handler registrations

**Existing documentation:**
- README.md — often the single best orientation source. Read first.
- docs/, wiki/, ARCHITECTURE.md, DESIGN.md, ADRs
- Inline doc comments on public interfaces
- Existing diagrams (Mermaid, PlantUML, images in docs/)

**Dependencies and external systems:**
- `requirements.txt`, `pyproject.toml`, `package.json`, `go.mod`, `Cargo.toml`
- External service integrations (API clients, SDKs, message queue consumers)
- IaC (Terraform, Pulumi, CDK) — reveals infrastructure dependencies

### Use parallel tool calls

This is the biggest timesaver. File reads, search_files, and web_extract (for hosted docs) can all run in parallel. Don't serialise what can be parallelised.

### What to extract (mental model, not artifact)

After inspection, the agent should be able to answer:

- **What does this system do?** One sentence.
- **What are the runtime boundaries?** What needs to be running?
- **What persists?** What data, where, what shape?
- **What are the entry points?** How does work arrive?
- **What are the external dependencies?** What does this system talk to?
- **What are the 3-5 flows that define how it works?** The interactions that make everything else predictable.
- **What's surprising?** Non-obvious mechanisms, unusual patterns, things that would catch someone off guard.

### Decision-making

The agent makes all structural judgments autonomously:

- **Page selection:** Which IR pages the system warrants (C4 always, data model if persistent state, sequences if ≥3 flows, documentation map if complex enough)
- **L3 candidates:** Which containers have ≥3 meaningful internal parts with architectural relationships
- **Flow selection:** The 3-5 flows that define how the system thinks
- **Boundary calls:** What's a container vs component, what's external vs owned, where to decompose

Every judgment gets documented in `modelling_notes` in the IR. The user reviews the final output (IR + HTML), not the plan. If a call was wrong, the modelling notes explain the reasoning so it can be corrected.

---

## IR Delta

IR exists. Code has changed. Understand what's different.

### Step 1 — Load existing IR

Read the current IR YAML files from `atlas/pages/`. This is the agent's baseline understanding — what the system looked like when the IR was last produced.

Read `atlas/atlas.yaml` for the manifest — which pages exist, project identity.

Skim `.mmd` diagram files in `atlas/diagrams/` if the IR references them — they carry structural information (participant names, relationships) that complements the YAML.

### Step 2 — Determine what changed

```bash
# What files changed since IR was last committed?
git log --oneline -1 atlas/  # when was IR last updated?
git diff <ir-commit>..HEAD --stat  # what changed since then?
git diff <ir-commit>..HEAD --name-only  # file list
```

If the IR isn't git-tracked, fall back to modification timestamps or ask the user what changed.

### Step 3 — Scoped analysis

Only inspect the parts of the codebase that changed:

- **New files/directories** — new containers? new components? new schemas?
- **Modified schemas** — entities added/removed/changed? New fields that are architecturally significant?
- **Modified entry points** — new flows? Changed flow mechanics?
- **Modified config** — new containers, new external dependencies?
- **Deleted files** — containers removed? Components gone?

Map each change back to which IR page(s) it affects:
- New/changed containers → c4-architecture.yaml
- Schema changes → data-model.yaml
- Flow changes → sequences.yaml
- New extension points, design changes → documentation-map.yaml

### Step 4 — Proceed to modelling

The agent now has baseline IR + understanding of what changed. Proceed directly to IR updates via `atlas-ir-system-modelling`. Document in `modelling_notes` what changed and why the IR was updated the way it was.

---

## PR Review

Scoped to a specific PR or branch. The goal isn't full system understanding — it's understanding what THIS change affects architecturally.

### Step 1 — Load existing IR

Same as IR Delta Step 1. The IR is the baseline.

### Step 2 — Read the PR

```bash
git diff main...<branch> --stat
git diff main...<branch> --name-only
git diff main...<branch>  # full diff if manageable
git log main...<branch> --oneline  # commit messages for intent
```

Also read: PR description, linked issues, commit messages. These carry intent that the diff alone doesn't.

### Step 4 — Assess and proceed

For each changed file, ask: does this change affect the system's architecture as captured in the IR?

Most PR changes are **IR-invisible** — bug fixes, refactors, test additions, dependency bumps. These don't affect containers, entities, flows, or design principles.

Changes that ARE IR-visible:
- New container, removed container, container responsibility change
- New entity, schema change to architecturally significant fields
- New flow, changed flow mechanics (new participants, different steps)
- New extension point, changed design principle
- New external dependency, removed integration

If IR-visible changes exist, proceed to IR updates via `atlas-ir-system-modelling`. If no architectural impact, note that in the output and skip modelling.

---

## Pitfalls

- **Don't serialise parallel reads.** The cold start pass touches dozens of files — batch them. This is the single biggest efficiency win.
- **Don't read every file.** The goal is structural understanding, not line-by-line familiarity. Read entry points, schemas, configs, and READMEs. Skim directory structure. Skip test files, generated code, vendored dependencies.
- **Don't produce an artifact.** This skill loads context for downstream skills running in the same window. If you find yourself writing a "discovery report" to disk, stop — that's the old approach.
- **Don't stop to ask mid-pipeline.** The only user checkpoint is the invocation confirmation at the start. After that, the pipeline runs autonomously: ingest → model IR → render HTML. Structural judgments go in `modelling_notes`, not in messages asking "agree?"
- **Don't re-derive what the IR already knows (delta/PR modes).** Read the IR first. It's the baseline. Only analyse what changed.
- **Don't treat every code change as architecturally significant (PR mode).** Most changes are IR-invisible. The skill's value in PR mode is triage — quickly identifying whether the architecture is affected.
- **Don't guess the mode.** If it's unclear whether IR exists or what state it's in, check the filesystem. If it's ambiguous whether this is a general update or PR review, ask.
