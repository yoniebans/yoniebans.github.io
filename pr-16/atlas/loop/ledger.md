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

### Pipeline run (2026-04-27)

Session `20260427_110652_ecf622`. 44 API calls, 119 messages, peak context ~135k/200k (67%).

#### IR Line Counts

| Page | Iter 0 | Iter 1 | Delta |
|------|--------|--------|-------|
| c4-architecture | 561 | 385 | -31% |
| data-model | 287 | 272 | -5% |
| sequences | 429 | 279 | -35% |
| documentation-map | 231 | 214 | -7% |
| **Total** | **1508** | **1150** | **-24%** |

#### HTML Character Counts

| Page | Iter 0 | Iter 1 | Gold Std | Iter1/Gold |
|------|--------|--------|----------|-----------|
| index.html | 43,824 | 28,903 | 45,474 | 0.64 |
| data-model.html | 21,326 | 18,829 | 56,043 | 0.34 |
| sequences.html | 22,641 | 19,631 | 47,414 | 0.41 |
| diataxis.html | 21,663 | 16,826 | 44,005 | 0.38 |
| **Total** | **109,454** | **84,189** | **192,936** | **0.44** |

#### Scoring

| Metric | Iter 0 | Iter 1 | Delta | Target |
|--------|--------|--------|-------|--------|
| Coverage | 73% | 74% | +1 | >85% |
| Depth (% shallow) | 31% | 19% | **-12** | <15% |
| Ownership duplicates | 6 | 0 | **-6** | 0 ✓ |
| Repetition index | 4 | 0-1 | **-3** | <5 ✓ |
| Visual fitness | 79% | 74% | -5 | >80% |

### Learnings

- **What worked:** Depth guidance produced richer per-section descriptions (container substance, entity schema detail, memory format specifics). Ownership semantics eliminated all cross-page duplication. Dynamic views correctly omitted from C4 page. Schema detail provided for 3 of 4 domains.
- **What didn't work:** Overall output volume regressed 23%. The agent included fewer containers (11 vs 16), shorter sequences, sparser diagrams. The skill told it HOW to describe things but not WHAT to include — it chose quality over quantity.
- **Root cause:** NOT context pressure (33% headroom). Two problems: (1) The agent used `execute_code` to batch-write YAML/HTML instead of direct `write_file` authoring — the extra serialisation layer compresses detail. (2) The skill lacks minimum-coverage guidance — the agent can omit subsystems without justification.
- **Fixes applied (same branch):** Added direct authoring rule to both skills — `write_file` for every artifact, no `execute_code`. Added pitfall with iteration 1 evidence.
- **What iteration 2 should target:** Coverage enforcement (completeness check step), rendering fidelity (HTML tables for schema detail), RL/Training content gap.
