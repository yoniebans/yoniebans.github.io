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
