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

## Iteration 1 — Depth, Ownership, Skill Merge

**Date:** 2026-04-25 (analysis), 2026-04-27 (skill changes + cleanup)
**Hypothesis:** Enriching IR entity descriptions with concrete schema detail, adding ownership semantics to reduce duplication, moving dynamic views to sequences page, and merging source-ingest into system-modelling would close the gap with the gold standard.
**Branch:** atlas/loop/001-depth-and-ownership (PR #6)

### Changes made (skill-level, not output-level)

1. **Depth guidance in system-modelling skill:** Container descriptions must include architectural substance (mechanism, concrete detail, surprise). Entity descriptions must include concrete schema detail (DDL, JSON keys, file formats). Schema detail required for ALL domains, not just primary.
2. **Ownership semantics:** Concept ownership pitfall added — each concept has ONE primary home, other pages cross-reference. Dynamic views moved off C4 page when dedicated sequences page exists.
3. **Merged source-ingest into system-modelling:** Pipeline is now 2 skills (system-modelling + visual-translation) instead of 3. Phase 1 (ingest) and Phase 2 (IR production) in a single skill. Eliminates the latent-space handoff gap.
4. **Updated downstream skills:** visual-translation, self-evaluating-loop, brownfield-atlas-genesis references all updated.

### Evaluation (from iteration 0 output)

Per-section analysis in `/mnt/hermes/workspace/atlas-loop/001/evaluation.md`. Key findings:
- Data model at 36% of gold standard size — entities lack concrete schema detail
- 6 ownership duplicates, repetition index of 4
- Plugin System entirely absent
- C4 dynamic views overlap with sequences page

### Scoring

**Not yet scored.** Previous iteration 1 scoring was invalid — the agent hand-wrote IR and HTML instead of running the pipeline, so those metrics were meaningless. Scoring will be established by running the actual pipeline with the updated skills and comparing against iteration 0 baseline.

### Outcome

**Pending pipeline run.** Skill changes committed. Next step: run the pipeline end-to-end with the merged skill against hermes-agent, then score the real output.
