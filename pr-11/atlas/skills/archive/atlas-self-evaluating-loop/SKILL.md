---
name: atlas-self-evaluating-loop
description: "Run one iteration of the self-evaluating atlas loop (spec 003). Evaluates existing IR pipeline output against the agent's latent understanding of the codebase, scores gaps, proposes ranked changes, implements them, re-runs the pipeline, and produces a PR or abandons with full rationale. The loop refines IR schema, skill guidance, HTML components, and page structure until convergence."
maturity: "v0.2, April 2026. Iteration 001 completed — IR depth improved, rendering bottleneck identified."
metadata:
  hermes:
    tags: [atlas, ir, evaluation, loop, convergence]
    related_skills: [atlas-ir-system-modelling, atlas-ir-visual-translation]
---

# Atlas Self-Evaluating Loop

Run one iteration of the atlas self-improvement loop. The agent evaluates its own IR pipeline output against its latent understanding of the codebase, identifies gaps, proposes changes, implements them, and verifies improvement.

**Spec:** `yoniebans.github.io/atlas/specs/003-self-evaluating-atlas-loop.md`
**Ledger:** `yoniebans.github.io/atlas/loop/ledger.md`

## When to Use

- Manually triggered during initial convergence phase (the loop needs to earn trust)
- After convergence: triggered by drift detection, new codebase, or periodic re-evaluation
- NOT a cron job (yet)

## Prerequisites

- Existing IR pipeline output (pages/*.yaml + rendered HTML) for the reference codebase
- Gold standard (hand-authored atlas) for comparison: `/mnt/hermes/source/hermes-architecture/`
- Reference codebase: `~/.hermes/hermes-agent/`
- Workspace: `/mnt/hermes/workspace/atlas-loop/<iteration-number>/`

## Iteration Workflow

### Step 0 — Read the Ledger

Read `atlas/loop/ledger.md` in full before starting. It records every past iteration's hypothesis, changes, scoring deltas, outcome, and learnings. An iteration that replicates a previously-abandoned approach without new evidence is a bug.

### Step 1 — Ingest Codebase

Use `atlas-ir-system-modelling` skill in cold-start mode. Build full latent understanding — this is the ground truth everything is measured against.

**Key files for hermes-agent:**
- AGENTS.md (best structural overview — read first, it's comprehensive)
- Directory tree (find -maxdepth 3, exclude __pycache__/.git/.venv)
- Root Python files (run_agent.py, model_tools.py, toolsets.py, cli.py, hermes_state.py, etc.)
- tools/registry.py (tool architecture)
- gateway/ (async platform adapters)
- agent/ subdirectory (transports, memory, compression, prompt building)

**Parallel reads are essential.** The ingest touches dozens of files — batch independent reads in the same tool call block.

### Step 2 — Read Current IR + Rendered HTML

Load all IR YAML from `pages/` directory and rendered HTML files. Also read `atlas.yaml` manifest and `diagrams.json` if present.

Hold both codebase understanding (step 1) and current output (step 2) simultaneously. The gap between them is the evaluation signal.

### Step 3 — Per-Section Evaluation

For each page, for each section/concept, assess three dimensions:

**Depth assessment** (shallow / adequate / rich):
- What does the agent know about this concept that the IR doesn't capture?
- What concrete examples, schemas, code paths, or edge cases are missing?
- Shallow = surface-level description that doesn't help someone understand the system
- Adequate = correct and useful but missing some specifics
- Rich = includes concrete details, non-obvious mechanisms, actual formats

**Ownership assessment** (primary / reference / duplicate):
- Is this concept's primary home on this page?
- Or is it here as a reference to support another concept?
- Duplicates = same concept explained at similar depth on multiple pages
- Track all duplicates — they are the structural signal for page boundary problems

**Representation fitness** (diagram / prose / table / mixed):
- Is diagram the right medium, or would prose/table serve better?
- Entity details → prose tables with actual fields (not ER diagrams)
- Config hierarchies → prose tables
- Sequence flows → sequence diagrams (almost always correct)
- Component relationships → diagrams

### Step 4 — Holistic Evaluation

Zoom out from individual sections:

1. **Concept ownership map** — matrix of concepts × pages showing primary/reference/duplicate. Count duplicates.

2. **Repetition index** — concepts appearing substantively on 3+ pages. Target: each concept has one primary home.

3. **Helicopter view test** — read page titles and section headers in sequence. Does a coherent mental model emerge? Gaps? Redundancies?

4. **Diagram:text ratio** — is the balance right across the whole atlas?

5. **Page boundary fitness** — given the codebase's natural fault lines, are the current page categories the right decomposition?

### Step 5 — Propose Ranked Changes

Rank proposals by expected impact. Each is one of:
- **IR schema** — add fields, change structure
- **Depth guidance** — skill instruction updates for richer output
- **Ownership rules** — metadata for primary/reference rendering
- **HTML component** — new visual component in the design system
- **Mermaid boundary** — when to use diagram vs prose
- **Page structure** — merge, split, or redraw page boundaries

**Keep iteration scope tight.** Implement ALL proposed changes in one iteration — don't artificially ration work across iterations. The ranking is priority for conflict resolution, not a rationing mechanism. The user explicitly rejected deferred changes in iteration 001.

### Step 5b — Establish Scoring Baseline

Score the CURRENT output before making changes:

| Metric | Method | Target |
|--------|--------|--------|
| Coverage | % of concepts adequately represented per page | >85% |
| Depth | % of sections rated shallow (weighted by importance) | <15% |
| Ownership clarity | count of duplicate concepts across pages | 0 |
| Repetition index | concepts on 3+ pages substantively | <5 |
| Visual fitness | % of sections with optimal diagram/prose/table choice | >80% |

Score per-page AND overall. Include rationale for each score — future iterations need to understand what the numbers mean, not just the numbers.

### Steps 6-11 — Implementation and Verification

6. **Branch:** `atlas/loop/<NNN>-<short-hypothesis>` on affected repos
7. **Re-run pipeline:** system-modelling (ingest + IR) → visual-translation, output to `/mnt/hermes/workspace/atlas-loop/<NNN>/`
8. **Render verification:** HTML validity, Mermaid rendering, design system integrity, no 404s, visual smoke test. Hard gate — fix rendering bugs before evaluating content.
9. **Self-compare:** Re-score with same rubric. Delta scoring (before → after). Side-by-side screenshots against previous iteration AND gold standard.
10. **PR or abandon:** positive deltas → PR with scoring table + screenshots. Dead end → close branch, document fully in ledger.
11. **Update ledger:** append iteration record with hypothesis, changes, scoring, screenshots, learnings.

## Evaluation Document Structure

Write evaluation to `/mnt/hermes/workspace/atlas-loop/<NNN>/evaluation.md`:

```
# Iteration NNN — Evaluation

## Step 1: Codebase Understanding Summary
(one paragraph — confirms latent understanding is loaded)

## Step 3: Per-Section Evaluation
### Page: <page-name>.yaml (→ <rendered>.html)
#### <Section Name>
- Depth: shallow/adequate/rich — rationale
- Missing: concrete specifics the IR doesn't capture
- Ownership: primary/reference/duplicate
- Representation: diagram/prose/table/mixed — fitness assessment

## Step 4: Holistic Evaluation
### Concept Ownership Map (table)
### Repetition Index
### Helicopter View Test
### Diagram:Text Ratio

## Step 5: Proposed Changes (ranked)
### N. [HIGH/MEDIUM/LOW] Title
- Type, hypothesis, specific change, expected impact

## Scoring Baseline
(table: metric × page × overall, with rationale)

## Iteration NNN Hypothesis
(what this iteration will test, what's deferred)
```

## Pitfalls

- **NEVER hand-write IR YAML or HTML.** The loop exists to test whether skill/schema changes improve the PIPELINE's output. If you hand-craft IR or render HTML via execute_code, you've proven nothing about the pipeline. Every piece of output must come from running the actual skills end-to-end: system-modelling → visual-translation. Iteration 001 was invalidated because the agent hand-wrote both IR and HTML, bypassing the skills entirely. The scores were meaningless.
- **Latent understanding must flow through the pipeline.** System-modelling ingests the codebase and serialises understanding to IR; visual-translation renders it. These run in the same context window for a reason — the latent activations from reading the codebase ARE the input to IR modelling. If you break this chain (e.g. by delegating to subagents, using execute_code for rendering, or splitting across sessions), you lose the very thing the pipeline is supposed to capture. The user identified this as a fundamental architectural concern — now resolved by merging source-ingest into system-modelling.
- **Don't skip the ledger read.** The whole point of the ledger is preventing re-treading. Read it FIRST.
- **Don't boil the ocean.** Pick 1-2 changes per iteration. Measure them cleanly. Kitchen-sink iterations produce unmeasurable results.
- **Don't conflate rendering bugs with content evaluation.** If HTML doesn't render, fix the pipeline first (that's a skill/component bug). Content evaluation only makes sense on working output.
- **Don't trust scores without rationale.** "Coverage 73%" is meaningless without knowing what's counted and why. Every score needs a sentence of justification.
- **Don't forget the gold standard comparison.** The hand-authored atlas at `/mnt/hermes/source/hermes-architecture/` is the ceiling. Line count ratio (IR/gold) is a quick health check per page.
- **AGENTS.md is gold for ingest.** For hermes-agent specifically, AGENTS.md contains a comprehensive structural overview that makes cold-start ingest much faster than scanning source files blind. Check for similar files in other codebases.
- **Data model is the weakest page.** The IR consistently captures entity structure but compresses away substance — actual DDL columns, actual JSON formats, actual file structures. Depth guidance for concrete schema detail is the highest-leverage improvement (discovered in iteration 001 evaluation).
- **Ownership duplication is structural, not cosmetic.** When Skills/Config/Agent Loop appear at similar depth on 3+ pages, the root cause is that the IR has no mechanism to distinguish "this is my concept" from "I'm referencing someone else's concept." Solving this requires IR schema changes, not just rewording.
- **The bottleneck shifts.** Iteration 001 proved: IR depth guidance works — data-model YAML grew 82%. But the HTML didn't proportionally expand because the rendering compressed it back down. After fixing IR quality, the next bottleneck is rendering fidelity. Expect this pattern: fix one bottleneck, the next one reveals itself.
- **Score the IR YAML separately from the HTML.** The IR can be rich while the HTML is thin — they're different bottlenecks. Track IR line counts AND HTML character counts AND gold standard ratios. The IR/gold ratio measures modelling quality; the HTML/gold ratio measures end-to-end pipeline quality.
