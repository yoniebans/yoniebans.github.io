---
name: atlas-audit
description: "Audit an existing atlas by working in reverse: HTML → codebase verification. Per-page analysis followed by cross-page coherence review. Produces a report for human review — no automated fixes."
maturity: "v0.4, April 2026. Tested against hermes-architecture (4 pages, hermes-agent codebase). 14 findings actioned across 14 commits. Skill hardened from test run learnings."
tags: [atlas, audit, quality, review]
related_skills: [brownfield-atlas-genesis, atlas-drift-detection]
---

# Atlas audit

**Trigger:** "Audit the atlas", "review atlas quality", "is the atlas accurate", or any request to verify an existing atlas against its codebase.

**Direction:** This skill works in *reverse* from brownfield-atlas-genesis. Genesis goes codebase → HTML. This skill goes HTML → codebase verification.

**Output:** A report at `<atlas-dir>/audit/<project>/YYYYMMDD.md` for the user to read. No PRs, no automated fixes. The report informs human judgment about what to update.

---

## Inputs

The skill needs two things:

1. **Atlas directory** — the HTML pages to audit (e.g. `<project>/atlas/` or a standalone atlas repo)
2. **Codebase directory** — the source of truth to verify against (e.g. the project's source repo root)

Ask the user for both if not obvious from context. Confirm before proceeding.

---

## Pre-flight reads (mandatory)

Before auditing, load the atlas philosophy so you know what a good atlas looks like.

These docs live in the same repo at `atlas/docs/`:

```
1. atlas/docs/abstract.md       (what an atlas is)
2. atlas/docs/structure.md      (page types, design system, page anatomy)
3. atlas/docs/discipline.md     (rules: orienting prose, no essays, redirection table)
```

These define the evaluation criteria. Without them you'll judge pages by generic documentation standards instead of atlas-specific ones.

---

## Phase 1 — Per-page audit (run sequentially, one page at a time)

For each HTML page in the atlas directory (skip `base/`, skip design system assets):

### Step 1.1 — Read the page

Read the full HTML source. Don't skim — you need every section, every diagram source, every code chip, every `data-ref`.

### Step 1.2 — Articulate the page's essence

Before touching the codebase, answer these questions from the HTML alone:

- **What system slice does this page represent?** (e.g. "container decomposition and their relationships", "entity schema and data flows", "runtime interaction sequences")
- **What is this page's job within the atlas?** Map it to the page types from `structure.md` — is it system-architecture, data-model, sequences, documentation-map, or something else?
- **What mental model should a reader walk away with?** One sentence. This is the page's thesis.
- **What concepts does this page claim to own?** List every named component, entity, flow, or abstraction that this page treats as primary content (not just a passing mention or cross-reference).

### Step 1.3 — Verify claims against the codebase

From the page's content, derive a verification plan — which parts of the codebase need reading to confirm or refute the page's claims. Be specific: file paths, directories, patterns to search for.

Sources of verification targets:
- `data-ref` attributes on code chips → check `refs.js` for path mappings
- Named components/containers → find their implementations
- Diagram participants → trace their actual location
- Schema tables → find the real schema definitions
- Sequence flows → trace the actual call paths

Execute the plan. Read the relevant files. Use `search_files` for discovery when you don't know exact paths. Be thorough — the audit's value comes from actually checking, not inferring.

### Step 1.4 — Independent discovery: what did the atlas miss?

This is the step that makes the audit more than a fact-check. Don't just verify what the page claims — explore the codebase areas within this page's remit and look for things the original codebase → HTML pass failed to surface.

For the page's domain (architecture, data model, sequences, etc.), do a fresh scan:
- **Directory walk** — what's in the relevant source directories that the page doesn't mention?
- **Pattern search** — are there components, entities, flows, or interfaces that fit this page's concern but aren't represented?
- **Scale check** — does the page's level of detail match the actual complexity? (e.g. a container with 12 internal modules represented as a single box)

This is where the audit finds blind spots, not just staleness.

### Step 1.5 — Produce per-page findings

For each page, produce a structured finding set:

**Accuracy**
- What the page claims that is **confirmed** by the codebase (brief — just note it's correct)
- What the page claims that is **stale** (was true, no longer is — cite what changed)
- What the page claims that is **misleading** (technically present but misrepresented — explain how)
- What the page claims that is **wrong** (never true, or inverted)

**Coverage**
- What the codebase contains that this page **should cover but doesn't** — given its page type and the concepts it claims to own
- What the page covers that **doesn't belong** — per the discipline rules (decisions content, gotchas, essays, content that belongs on a different page)

**Structural quality**
- Discipline violations: paragraphs > 3 lines, content that belongs in `CONTEXT.md` or `decisions/`, prose that doesn't support a diagram
- Diagram type fitness: is the diagram type appropriate for the content? An `erDiagram` implies relational database entities — using it for filesystem configs, runtime singletons, or Python dicts is misleading. Use `graph TD` with subgraphs for heterogeneous storage, `classDiagram` for interfaces, `erDiagram` only for actual database schema.
- Diagram health: do Mermaid sources parse? Do they reflect reality? Are labels accurate?
- KPI fitness: do the KPI cards help orientation? A number that's technically correct but doesn't tell a reader anything about the system's shape is filler. Flag KPIs that count the wrong thing or that confuse when seen alongside the page content.
- `data-ref` accuracy: do the refs point to files/paths that still exist? Also flag **sparse coverage** — a page with 30+ code chips and only 3 `data-ref` attributes is under-linked. The load-bearing code references (files, classes, functions) should have refs.
- Navigation: do companion-page links work? Does the TOC match the sections?
- **TOC cross-page sync:** the sidebar TOC is duplicated on every page. Check that all copies have the same entries in the same order. Drift between pages (missing entries, different labels) is common after adding new sections to one page.

Rate the page: **accurate / mostly accurate / needs update / significantly stale**.

---

## Phase 2 — Cross-page coherence (run once, after all per-page audits)

With all per-page findings in hand, analyse the atlas as a whole:

### Concept ownership

Build a concept × page matrix. For every named concept that appears on more than one page:
- Which page **owns** it (treats it as primary, with depth)?
- Which pages **reference** it (mentions in passing, cross-links)?
- Where is there **overlap** — the same concept described at similar depth on multiple pages?

Overlap should be intentional and navigable. When a concept appears on multiple pages:
- The **owning page** treats it with depth — this is the canonical description.
- **Referencing pages** should mention it briefly and cross-link to the owning page/section (e.g. "see Data Model → Entity Map for schema detail").
- Flag cases where two pages describe the same concept at similar depth without cross-referencing each other — this confuses the reader about which page is authoritative.

### Gap analysis

- Are there system concerns that **no page covers**? (A container with no home, a major flow with no sequence, an entity with no schema representation)
- Are there page types from `structure.md` that are **warranted but missing**?

### Coherence

- Do pages **tell a consistent story**? If the architecture page says there are 5 containers, do the other pages agree?
- Do cross-references land correctly? (Page A mentions "see the data model" — does page B actually cover that thing?)
- Is the **level of detail consistent** across pages, or does one page go much deeper than the others?
- When concepts appear on multiple pages, do the descriptions **agree**? (Same container described differently on two pages = reader confusion)
- Are cross-references **bidirectional where needed**? (If page A references page B's concept, does page B acknowledge the relationship?)
- Is the **page ordering** concrete→abstract? Architecture (structure) → Data Model (entities) → Sequences (behaviour) → Documentation Map (orientation/explanation). If the TOC puts abstract pages before concrete ones, the reader builds a mental model in the wrong order.

### Overall assessment

Rate the atlas: **trustworthy / mostly trustworthy / needs attention / unreliable as a mental model**.

Summarise: what's the single biggest problem? What would you fix first?

---

## Report format

Write the report to `<atlas-dir>/audit/<project>/YYYYMMDD.md`:

```markdown
# Atlas audit: <project name>

**Date:** YYYY-MM-DD
**Atlas:** <path>
**Codebase:** <path>
**Codebase commit:** <short sha + date>

---

## Per-page findings

### <page filename>
**Essence:** <one sentence>
**Concepts owned:** <list>
**Rating:** accurate / mostly accurate / needs update / significantly stale

#### Accuracy
...

#### Coverage
...

#### Discovery (what the atlas missed)
...

#### Structural quality
...

---
(repeat for each page)

## Cross-page coherence

### Concept ownership matrix
| Concept | index.html | data-model.html | sequence-diagrams.html | diataxis.html |
|---------|-----------|----------------|----------------------|--------------|
| ...     | owns      | refs (→ index#section) | —              | —            |

### Gaps
...

### Coherence
- Story consistency: ...
- Cross-reference accuracy: ...
- Description agreement (same concept, multiple pages): ...
- Bidirectional cross-refs: ...
- Detail level consistency: ...

### Overall assessment
**Rating:** trustworthy / mostly trustworthy / needs attention / unreliable
**Biggest problem:** ...
**Fix first:** ...

## Action items (priority order)

### Structural gaps — the atlas lies by omission
1. ...

### Coherence — the atlas confuses
N. ...

### Staleness — the atlas is wrong on facts
N. ...
```

The action items section is the most important output. Prioritise by impact on the atlas as a mental model — structural gaps first (the atlas doesn't show something real), coherence issues second (the atlas confuses), staleness third (the atlas states wrong facts). Don't bury structural findings under a "just update the numbers" conclusion.

---

## Acting on findings

The report produces an action items list. When the user wants to execute fixes:

- **One commit per action item.** The user reviews each fix individually before moving to the next. Don't batch.
- **Use a git worktree** if the atlas repo already has an active branch for other work. Avoids collisions. `git worktree add -b fix/audit-findings <path> origin/main`.
- **Start with the smallest structural fix** to establish the pattern (styling, HTML structure), then escalate to larger content additions. This builds review confidence early.
- **Push to a PR with preview deploys** so the user can check rendering after each commit.

---

## Pitfalls

- **Don't let the overall assessment bury the findings.** The action items section is the deliverable, not the rating. If you found 3 structural gaps, 4 coherence issues, and 3 stale numbers, saying "mostly trustworthy, fix the numbers" is wrong — the structural gaps are the real problem. The user will call this out.
- **Don't audit without reading the atlas docs first.** You'll apply generic documentation standards instead of atlas-specific ones. The discipline rules and page type definitions are the evaluation criteria.
- **Don't skip the essence step.** Jumping straight to "is this accurate?" without first understanding what the page is *trying to do* leads to shallow findings. The essence frames everything.
- **Don't conflate stale with wrong.** Stale means it was correct at some point. Wrong means it was never correct or is fundamentally misleading. The distinction matters for prioritising fixes.
- **Don't hunt for structural HTML issues, but note violations that affect content.** This skill audits *content*, not markup. Don't go looking for wrong CSS classes. But if you spot design system violations that affect how content renders (e.g. `min-height` on diagram containers forcing oversized boxes, wrong diagram type misrepresenting data), flag them — they're content problems wearing structural clothing.
- **Don't propose fixes.** The output is a report. Resist the urge to rewrite sections inline. If a finding is clear enough, the fix will be obvious to whoever reads the report.
- **Read actual code, not just file names.** Verifying a component exists isn't enough — verify the atlas's description of what it *does* and how it *relates* to other components. That's where drift hides.
- **Cross-page coherence requires all per-page audits first.** Don't try to assess coherence while doing individual pages — you'll miss overlap patterns that only emerge from the full set.

---

## Verification

Before delivering the report:

1. Every per-page finding cites specific evidence (file path, line, code snippet, or diagram source)
2. The concept ownership matrix accounts for every concept that appears on 2+ pages
3. The overall rating is justified by the findings, not impressionistic
4. The report is self-contained — someone who hasn't read the atlas can understand the findings
