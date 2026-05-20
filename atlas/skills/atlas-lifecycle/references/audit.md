---
name: atlas-audit
description: "Audit an existing atlas by working in reverse: HTML → codebase verification. Per-page analysis followed by cross-page coherence review."
---

# Atlas audit

**When:** "Audit the atlas", "is the atlas accurate", or after a major release to
verify the atlas still reflects reality.

**Output:** A report at `/mnt/hermes/vault/atlas/audits/<project>/YYYYMMDD.md`.
**NOT in the atlas repo** — audit reports reference local paths and per-commit
metadata. No automated fixes. The report informs human judgment.

---

## Inputs

1. **Atlas directory** — the HTML pages to audit
2. **Codebase directory** — the source of truth to verify against

Ask the user for both if not obvious. Confirm before proceeding.

## Pre-flight

Read the atlas docs (`atlas/docs/structure.md`, `discipline.md`) so you know
what a good atlas looks like. Read the parent SKILL.md for shared conventions.

---

## Phase 1 — Per-page audit (run sequentially, one page at a time)

**Do NOT parallelise via `delegate_task`.** The cross-page coherence phase depends
on one agent holding all per-page findings. Sequential is the rule for both phases.

### For each page:

#### 1.1 Articulate essence
Before verifying anything, state what this page is supposed to communicate. One
sentence. This frames all subsequent checks — without it you'll verify claims but
miss the forest.

#### 1.2 Extract verifiable claims
Read the page and list every verifiable assertion: numbers, lists, module paths,
diagram labels, KPI values, version strings, constant values.

#### 1.3 Verify claims against codebase

For each claim, check the codebase. Multi-source verification is critical:

- **Config schema** (`config.py`, `DEFAULT_CONFIG`) — what executes in production
- **Runtime entry points** (function signatures, dispatch tables)
- **Docstrings/comments** — secondary, can be stale
- **Filesystem** (`ls plugins/`, `find . -name '*.py'`)

When sources disagree, the one closest to what *executes* wins. Note the
cross-check in findings so fixes don't have to redo the work.

Classify findings:
- **Stale** — was true, no longer is (constants changed, lists grew/shrank)
- **Misleading** — technically present but misrepresented
- **Wrong** — never true or fundamentally inverted

#### 1.4 Independent discovery

Explore the codebase within this page's domain. Look for things the atlas
*should* cover but doesn't — not just verifying existing claims, but finding
blind spots the original genesis missed.

#### 1.5 Assess coverage

- What's missing that should be here?
- What's here that doesn't belong? (Decisions, gotchas, essays → elsewhere)

#### 1.6 Structural quality

- Paragraph length (≤3 lines)
- Diagram type fitness
- KPI fitness
- `data-ref` coverage (sparse vs comprehensive)
- TOC/nav correctness

### Finding categories per page

Organize findings into: **Stale**, **Misleading**, **Wrong**, **Coverage gaps**,
**Doesn't belong**, **Structural quality**, **Discovery** (new things found).

---

## Phase 2 — Cross-page coherence (after all pages done)

Requires Phase 1 results in hand.

| Dimension | What to check |
|---|---|
| **Concept ownership** | Which page owns vs references each concept. Flag unintentional overlap. |
| **Gap analysis** | System concerns no page covers. Missing page types. |
| **Story consistency** | Do counts, lists, descriptions agree across pages? |
| **Cross-reference accuracy** | Do "see X" links land on correct content? |
| **Description agreement** | Same concept described consistently across pages? |
| **Detail level** | Even depth across pages? |

### Common coherence failures

- Same list/count on two pages with different values (e.g. "14 hooks" vs "12 hooks")
- Same concept explained at full depth on two pages (concept ownership violation)
- Page A references Page B's diagram but no link exists
- A top-tier concept on index.html is completely absent from diataxis.html

---

## Output format

```markdown
# Atlas Audit — <project> — YYYY-MM-DD

## Summary
<1 paragraph overview: N pages audited, M findings, top themes>

## Per-page findings

### index.html
<Findings by category>

### data-model.html
<Findings by category>

...

## Cross-page coherence
<Concept ownership matrix, consistency issues, gaps>

## Prioritized action items
1. Structural gaps (highest priority — missing surfaces)
2. Coherence issues (cross-page inconsistencies)
3. Staleness (outdated numbers, lists, paths)
4. Quality (discipline violations, sparse data-ref)
```

---

## Pitfalls

- **Multi-source verification.** A single grep or docstring is NOT canonical.
  Triangulate config schema, runtime code, and docs. The config schema usually wins.
- **Audit-then-fix tightens verification.** Re-verify at fix time, not just audit
  time. Note errata in commit messages.
- **Removed features hide.** Grep every module path the atlas references — `ls`/`find`
  to confirm files still exist. A diagram node pointing at a deleted file is structural.
- **Don't put the audit report in the atlas repo.** It references local paths.
  Canonical path: `/mnt/hermes/vault/atlas/audits/<project>/YYYYMMDD.md`.
