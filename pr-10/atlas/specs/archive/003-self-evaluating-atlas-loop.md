---
id: 003
title: Self-Evaluating Atlas Loop — Latent-Space Driven Convergence
status: draft
created: 2026-04-25
author: morpheus
depends_on: 001
---

# Self-Evaluating Atlas Loop — Latent-Space Driven Convergence

## Problem

The IR pipeline (Spec 001) separates structural understanding from visual rendering. This adds rigour — the IR is diffable, auditable, and repeatable. But the serialisation step is lossy. When the agent writes IR YAML, it compresses its high-dimensional latent understanding of a codebase into explicit symbolic structure. The downstream rendering phase anchors on that YAML, not on the original understanding.

Empirical evidence (April 25, 2026 — hermes-agent comparison):

| Page | IR atlas (lines) | Hand-authored (lines) | Ratio |
|------|------------------:|----------------------:|------:|
| index.html | 877 | 936 | 0.94 |
| data-model.html | 434 | 1197 | 0.36 |
| sequences.html | 487 | 1158 | 0.42 |
| diataxis.html | 347 | 849 | 0.41 |

Three of four pages are ~40% the size of the hand-authored equivalent. The loss is not in structure — the IR correctly identifies what exists — but in substance: concrete examples, schema detail, actual JSON formats, error recovery paths, mental models. The IR captures the skeleton but not the muscle.

Additionally, 17 of 26 tracked concepts appear on 3+ pages. In the hand-authored version each page *owns* its concept and others *reference* it. In the IR version, pages re-describe the same concepts at the same surface depth. The page boundaries bleed.

The model knows all of this. It holds the codebase in its latent space and can feel the gap between what it knows and what the IR expresses. This spec exploits that: the model evaluates its own output against its own understanding, and iteratively improves the IR schema, skill guidance, visual components, and page structure until the gap converges to acceptable.

## Design Principle

Articulation is compression. The goal is not to eliminate compression loss — that's impossible. The goal is to make the IR expressive enough that the important things survive the bottleneck: depth of explanation, concrete examples, concept ownership, the right mix of diagram and prose, and a coherent helicopter view.

The model is its own oracle. No human needs to enumerate what's missing. The agent ingests the codebase, reads its own IR output, and identifies the delta. This is the evaluation signal that drives convergence.

## The Loop

One coupled loop. Depth, composition, and visual representation are evaluated together because changing one affects the others. Each iteration is one atomic unit.

### Iteration Workflow

```
┌─────────────────────────────────────────────────────────┐
│  0. Read ledger — what was tried, what was learned       │
│  1. Ingest codebase — full latent understanding          │
│  2. Read current IR + rendered HTML                      │
│  3. Evaluate per-section (depth, ownership, fitness)     │
│  4. Evaluate holistically (repetition, boundaries, ratio)│
│  5. Propose ranked changes                               │
│  6. Branch and implement                                 │
│  7. Re-run pipeline                                      │
│  8. Render verification — must pass before evaluation    │
│  9. Self-compare (screenshots, scoring, analysis)        │
│ 10. PR or abandon — with full rationale either way       │
│ 11. Update ledger                                        │
└─────────────────────────────────────────────────────────┘
```

### Step 0 — Read the Ledger

The ledger (`atlas/loop/ledger.md`) is institutional memory. Before every iteration the agent reads it in full. It records:

- Iteration number
- Hypothesis tested
- What changed (IR schema, skill guidance, HTML components, page structure)
- Scoring deltas (before → after)
- Outcome (merged / abandoned)
- Learnings (what to carry forward, what to avoid)

The ledger prevents the loop from retreading ground. An iteration that replicates a previously-abandoned approach without new evidence is a bug.

### Step 1 — Ingest Codebase

Full scan of the reference codebase. The agent builds its latent understanding — architecture, data flows, sequences, patterns, concrete details. This is the ground truth everything is measured against.

**Reference codebase (initial):** `hermes-agent` (`~/.hermes/hermes-agent/`). The hand-authored atlas at `/mnt/hermes/source/hermes-architecture/` serves as the gold-standard comparison. Future codebases are introduced after convergence on the reference.

### Step 2 — Read Current Output

Load the most recent pipeline output:
- IR YAML files (one per page)
- Rendered HTML files
- `diagrams.json` and any Mermaid sources

The agent holds both the codebase understanding (step 1) and the current output (step 2) simultaneously. The gap between them is the evaluation signal.

### Step 3 — Per-Section Evaluation

For each page, for each section/concept:

**Depth assessment:**
- What does the agent know about this concept that the IR doesn't capture?
- What concrete examples, schemas, code paths, or edge cases are missing?
- Rate: `shallow` / `adequate` / `rich` (relative to what the model knows)

**Ownership assessment:**
- Is this concept's primary home on this page?
- Or is it here as a reference to support another concept?
- Rate: `primary` / `reference` / `duplicate`
- Duplicates are the signal — same concept explained at the same depth on multiple pages

**Representation fitness:**
- Is diagram the right medium, or would prose/table serve better?
- Can Mermaid express this, or does it need a different visual?
- Is the diagram:text ratio right for what's being conveyed?
- Rate: `diagram` / `prose` / `table` / `mixed` — with justification

### Step 4 — Holistic Evaluation

Zoom out from individual sections:

**Concept ownership map:** Matrix of concepts × pages, showing primary/reference/duplicate. High duplicate count = structural problem.

**Page boundary fitness:** Given everything the agent knows about this system, are the current page categories the right decomposition? Would different cuts reduce overlap and increase clarity? The page structure is a discovery, not a template — it should match the system's natural fault lines.

**Repetition index:** How many concepts appear substantively (not just as passing references) on multiple pages? Target: each concept has one primary home.

**Helicopter view test:** Read just the page titles and section headers in sequence. Does a coherent mental model emerge? Are there gaps? Redundancies?

**Diagram:text ratio:** Across the whole atlas, is the balance right? Are diagrams carrying architectural insight or just decorating prose?

### Step 5 — Propose Changes

Rank proposed changes by expected impact. Each proposal is one of:

| Change type | Example | Scope |
|-------------|---------|-------|
| IR schema | Add `concrete_example` field to data-model sections | Inner |
| Depth guidance | "data-model sections should include actual schema DDL" | Inner |
| Ownership rules | Add `ownership: primary \| reference` to IR section metadata | Inner |
| HTML component | New `schema-table` component for rendering DB schemas | Inner |
| Mermaid boundary | "Entity counts >12 should use prose table, not ER diagram" | Inner |
| Page structure | Merge sequences + data-model for small codebases | Outer |
| Page discovery | "This codebase warrants a 5th page: deployment topology" | Outer |

Inner changes refine within the current structure. Outer changes restructure. Both run through the same loop, but outer changes trigger full regeneration and need stronger evidence.

### Step 6 — Branch and Implement

**Branch strategy:**

```
atlas/loop/<iteration-number>-<short-hypothesis>
```

Example: `atlas/loop/004-depth-targets-data-model`

Branches are created on the appropriate repos:
- IR schema / skill changes → `yoniebans.github.io` (atlas skills + specs live here)
- HTML component changes → `yoniebans.github.io` (design system lives here)
- Page structure changes → affect both skills and output

The agent tracks which repos are touched and which branches are active. Each iteration touches the minimum necessary.

**What gets committed:**
- Modified skill files (SKILL.md, references, templates)
- Modified IR schema or reference templates
- New or modified HTML components in the design system
- Updated depth guidance, ownership rules, or page structure definitions

### Step 7 — Re-run Pipeline

Execute the full pipeline on the reference codebase using the modified skills:

```
source-ingest → system-modelling → visual-translation
```

Output goes to a dedicated directory:

```
/mnt/hermes/workspace/atlas-loop/<iteration-number>/
```

Previous iterations' outputs are preserved for comparison.

### Step 8 — Render Verification

**Before any evaluation, the output must render correctly.** This is a hard gate.

The expectation is that IR → HTML just works. The visual-translation skill, the design system, and the component vocabulary must produce valid, rendering HTML every time. If they don't, the loop's evaluation is meaningless because it's comparing against broken output.

**Verification checklist:**

1. **HTML validity** — no unclosed tags, no malformed attributes
2. **Mermaid rendering** — every `<script type="text/plain" data-type="mermaid">` block parses without error (validate with mermaid CLI or browser render check)
3. **Design system integrity** — `base/` submodule present and correct, `styles.css` loads, all referenced JS files exist
4. **No 404s** — all `src`, `href`, and asset references resolve
5. **Visual smoke test** — browser screenshot of each page, confirm: layout renders, diagrams appear, navigation works, no blank sections
6. **Cross-reference integrity** — if `refs.js` is generated, all referenced anchors exist in the HTML

**If verification fails:**
- Fix the rendering issue first — this is a skill/component bug, not an evaluation finding
- The fix is committed to the same iteration branch
- Re-run step 7 after fixing
- Track the rendering failure in the ledger as a separate concern ("Skill 2 emitted invalid Mermaid syntax for X pattern")
- These rendering fixes should propagate back to the skills as pitfalls/guidance, so the same class of error doesn't recur

**The key discipline:** rendering failures are not tolerated as "expected during iteration." Each one is a bug in the pipeline that gets fixed and prevented. The loop improves atlas *content and structure*, not rendering reliability — that must already work.

### Step 9 — Self-Compare

With verified, rendering output:

**Quantitative scoring:**

| Metric | Method | Target |
|--------|--------|--------|
| Coverage | % of concepts the model considers adequately represented per page | >85% |
| Depth | shallow/adequate/rich per section (weighted by concept importance) | <15% shallow |
| Ownership clarity | primary/reference/duplicate per concept per page | 0 duplicates |
| Repetition index | concepts appearing substantively on 3+ pages | <5 |
| Visual fitness | % of sections where diagram/prose/table choice is optimal | >80% |

**Qualitative analysis:**

- Side-by-side screenshots (previous iteration vs current)
- Side-by-side against hand-authored gold standard
- Specific callouts: "this section now includes the SQLite schema DDL that was previously missing"
- Regression callouts: "removing the diataxis page reduced helicopter-view coherence"

**Delta scoring:** every metric is tracked as a delta from the previous iteration. Positive deltas justify merging. Negative deltas on any metric require explicit justification for why the tradeoff is worth it.

### Step 10 — PR or Abandon

**If the iteration improved things:**

Open PR on each affected repo with:
- Summary of hypothesis and what changed
- Scoring table (before → after)
- Side-by-side screenshots
- Specific improvements called out
- Any regressions acknowledged with rationale

**If the iteration was a dead end:**

- Close the branch (don't merge)
- Document fully in the ledger: what was tried, why it didn't work, what was learned
- These learnings are as valuable as successful iterations — they constrain the search space

**Branch cleanup:**

Abandoned branches are deleted after ledger documentation. Merged branches follow normal PR flow. At no point should stale iteration branches accumulate.

### Step 11 — Update Ledger

Append the iteration record:

```markdown
## Iteration N — <short title>

**Hypothesis:** <what we thought would improve>
**Changes:** <IR schema | skill guidance | HTML component | page structure>
**Repos touched:** <which repos, which branches>
**Outcome:** merged | abandoned

### Scoring

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Coverage (index) | 78% | 82% | +4 |
| ... | ... | ... | ... |

### Screenshots

[before] vs [after] — stored in atlas/loop/screenshots/<iteration>/

### Learnings

- <what worked>
- <what didn't>
- <what to try next>
- <what to never try again>
```

## Convergence

**The loop converges when:**

1. Coverage scores are above target across all pages
2. Depth scores show <15% shallow sections
3. Zero duplicate concept ownership
4. Repetition index is below threshold
5. The model's self-evaluation in step 3-4 produces no high-impact findings
6. Two consecutive iterations produce only marginal improvements (diminishing returns)

Convergence doesn't mean perfection. It means the compression loss through the IR bottleneck is below the threshold where it materially degrades the atlas's usefulness to a reader.

**After convergence on hermes-agent:**

The refined IR schema, skill guidance, and component vocabulary become the new baseline. Test against a second codebase (e.g. `hermes-agent-data-pipeline`). If the loop needs fewer iterations to converge on the new codebase, the approach is generalising. If it needs just as many, the refinements were overfitted to hermes-agent.

## Frequency and Triggering

**During initial convergence:** manually triggered. Each iteration produces a PR for human review. This is exploration — you want eyes on it.

**After convergence:** can be triggered by:
- A new codebase being atlased for the first time (run evaluation pass to check fitness)
- A significant codebase change (major refactor, new subsystem) that the drift detection cron flags
- Periodic re-evaluation (monthly?) to check for schema/skill drift

**Not a cron. Not yet.** The loop needs to earn trust through transparent, reviewable iterations before it runs autonomously.

## Artefact Layout

```
yoniebans.github.io/atlas/
├── specs/
│   ├── 001-atlas-ir-layer.md
│   ├── 002-design-md-integration.md
│   └── 003-self-evaluating-atlas-loop.md    ← this spec
├── loop/
│   ├── ledger.md                            ← iteration history
│   └── screenshots/
│       ├── 001/                             ← per-iteration screenshots
│       ├── 002/
│       └── ...
├── skills/
│   ├── atlas-source-ingest/
│   ├── atlas-ir-system-modelling/
│   └── atlas-ir-visual-translation/
└── ...
```

Pipeline output per iteration:

```
/mnt/hermes/workspace/atlas-loop/
├── 001/                                     ← full pipeline output
│   ├── ir/                                  ← IR YAML
│   ├── html/                                ← rendered pages
│   └── evaluation.md                        ← self-evaluation results
├── 002/
└── ...
```

## Relationship to Other Specs

**Spec 001 (IR Protocol):** defines the IR schema that this loop refines. Changes proposed by the loop that affect IR structure are changes to Spec 001. The loop is the mechanism by which the IR schema evolves.

**Spec 002 (DESIGN.md Integration):** defines swappable visual identity. Orthogonal to this loop — the loop evaluates content and structure, not aesthetics. A DESIGN.md change (different palette, different typography) would not trigger a loop iteration. But a new HTML *component type* (e.g. `schema-table`) that the loop discovers is needed would be built using the DESIGN.md token system.

## Open Questions

1. **Scoring calibration.** The coverage/depth scores are self-assessed by the model. How do we calibrate against the hand-authored gold standard? One approach: run the scoring on the hand-authored atlas too, use those scores as the ceiling.

2. **Multi-model evaluation.** Should the evaluation pass use a different model than the generation pass? A second opinion avoids self-reinforcing blind spots. But it adds complexity and cost.

3. **Partial convergence.** What if the index page converges quickly but data-model never reaches target? Should the loop focus on lagging pages, or is uneven convergence acceptable?

4. **Codebase-specific page discovery.** The current pipeline assumes 4 page types. The loop may discover that some codebases need different pages. How does this propagate back to Skill 1's guidance without overfitting?
