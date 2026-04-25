# Atlas Loop Ledger

Reference codebase: hermes-agent (~/.hermes/hermes-agent/)
Gold standard: /mnt/hermes/source/hermes-architecture/ (hand-authored)
Pipeline output baseline: /mnt/hermes/workspace/hermes-agent-atlas/

## Iteration 0 — Baseline

**Date:** 2026-04-25
**Status:** baseline (no changes — captures current IR pipeline output as-is)

### Line Count Comparison

| Page | IR atlas | Hand-authored | Ratio |
|------|----------|---------------|-------|
| index.html | 877 | 936 | 0.94 |
| data-model.html | 434 | 1197 | 0.36 |
| sequences.html | 487 | 1158 | 0.42 |
| diataxis.html | 347 | 849 | 0.41 |

### Known Issues (from spec 003 analysis)

- 3 of 4 pages at ~40% of gold standard size
- Loss is in substance, not structure: missing concrete examples, schema detail, actual JSON formats, error recovery paths, mental models
- 17 of 26 tracked concepts appear on 3+ pages (duplication)
- Pages re-describe concepts at same surface depth rather than owning/referencing
- IR captures skeleton but not muscle

### Scoring (to be evaluated in iteration 001)

Scores will be established during iteration 001's evaluation pass and retroactively recorded here as the "before" baseline.

### Learnings

- IR pipeline correctly identifies structural elements but compresses away substance
- The gap is between what the model knows and what survives the IR serialisation bottleneck

---

## Iteration 1 — Depth, Ownership, and Plugin System

**Date:** 2026-04-25
**Hypothesis:** Enriching IR entity descriptions with concrete schema detail, adding ownership semantics to reduce duplication, moving dynamic views to sequences page, and adding Plugin System as a concept would close the gap with the gold standard.
**Changes:** Skill guidance (system-modelling + visual-translation), page structure (dynamic views → sequences), content (Plugin System across all pages)
**Repos touched:** yoniebans.github.io (atlas/loop/001-depth-and-ownership branch)
**Outcome:** merged (pending PR review)

### Scoring

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Coverage | 73% | 80% | +7 |
| Depth (% shallow) | 31% | 22% | -9 |
| Ownership duplicates | 6 | 2 | -4 |
| Repetition index | 4 | 2 | -2 |
| Visual fitness | 79% | 82% | +3 |

### IR Line Counts

| Page | Before | After | Delta |
|------|--------|-------|-------|
| c4-architecture | 561 | 453 | -108 (removed dynamic views) |
| data-model | 287 | 522 | +235 (+82%) |
| sequences | 429 | 561 | +132 (+31%) |
| documentation-map | 231 | 258 | +27 |

### Learnings

- **What worked:** IR depth guidance produced measurably richer entity descriptions. Moving dynamic views cleaned up page boundaries. Plugin System filled the one missing concept.
- **What didn't work:** HTML rendering didn't proportionally expand with the richer IR. The execute_code rendering approach produces compact ve-cards rather than the verbose prose+table+example style of the gold standard. The bottleneck has shifted from IR quality to rendering fidelity.
- **What to try next (iteration 002):** Focus on rendering — the IR now carries enough depth, but the HTML needs to surface it as full schema-tables, narrative paragraphs, and worked examples. The visual-translation skill's rendering procedure should specify minimum prose depth per entity/container.
- **What to never try again:** Compact ve-card rendering for entities that deserve full schema-table treatment. The gold standard's 3x size advantage is in detailed tables and prose, not structural overhead.
