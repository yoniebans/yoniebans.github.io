---
name: atlas-audit
description: "Audit an existing atlas by working in reverse: HTML → understanding → codebase verification. Per-page analysis followed by cross-page coherence review. Produces a report for human review — no automated fixes."
maturity: "v0.1, April 2026. Untested."
tags: [atlas, audit, quality, review]
related_skills: [brownfield-atlas-genesis, atlas-drift-detection]
---

# Atlas audit

**Trigger:** "Audit the atlas", "review atlas quality", "is the atlas accurate", or any request to verify an existing atlas against its codebase.

**Direction:** This skill works in *reverse* from brownfield-atlas-genesis. Genesis goes codebase → HTML. This skill goes HTML → understanding → codebase verification.

**Output:** A report at `<workspace>/atlas-audit-<project>/report.md` for the user to read. No PRs, no automated fixes. The report informs human judgment about what to update.

---

## Inputs

The skill needs two things:

1. **Atlas directory** — the HTML pages to audit (e.g. `/mnt/hermes/source/hermes-architecture/`)
2. **Codebase directory** — the source of truth to verify against (e.g. `~/.hermes/hermes-agent/`)

Ask the user for both if not obvious from context. Confirm before proceeding.

---

## Pre-flight reads (mandatory)

Before auditing, load the atlas philosophy so you know what a good atlas looks like:

```
1. /mnt/hermes/vault/atlas/abstract.md       (what an atlas is)
2. /mnt/hermes/vault/atlas/structure.md      (page types, design system, page anatomy)
3. /mnt/hermes/vault/atlas/discipline.md     (rules: orienting prose, no essays, redirection table)
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

### Step 1.3 — Identify codebase areas to verify

From the page's content, derive a verification plan — which parts of the codebase need reading to confirm or refute the page's claims. Be specific: file paths, directories, patterns to search for.

Sources of verification targets:
- `data-ref` attributes on code chips → check `refs.js` for path mappings
- Named components/containers → find their implementations
- Diagram participants → trace their actual location
- Schema tables → find the real schema definitions
- Sequence flows → trace the actual call paths

### Step 1.4 — Read the codebase

Execute the verification plan. Read the relevant files. Use `search_files` for discovery when you don't know exact paths. Be thorough — the audit's value comes from actually checking, not inferring.

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
- Diagram health: do Mermaid sources parse? Do they reflect reality? Are labels accurate?
- `data-ref` accuracy: do the refs point to files/paths that still exist?
- Navigation: do companion-page links work? Does the TOC match the sections?

Rate the page: **accurate / mostly accurate / needs update / significantly stale**.

---

## Phase 2 — Cross-page coherence (run once, after all per-page audits)

With all per-page findings in hand, analyse the atlas as a whole:

### Concept ownership

Build a concept × page matrix. For every named concept that appears on more than one page:
- Which page **owns** it (treats it as primary, with depth)?
- Which pages **reference** it (mentions in passing, cross-links)?
- Where is there **overlap** — the same concept described at similar depth on multiple pages?

Overlap isn't always bad. A container mentioned on the architecture page and as a sequence participant is fine. The same container's internal structure described in detail on *both* the architecture page and the data-model page is redundant.

### Gap analysis

- Are there system concerns that **no page covers**? (A container with no home, a major flow with no sequence, an entity with no schema representation)
- Are there page types from `structure.md` that are **warranted but missing**?

### Coherence

- Do pages **tell a consistent story**? If the architecture page says there are 5 containers, do the other pages agree?
- Do cross-references land correctly? (Page A mentions "see the data model" — does page B actually cover that thing?)
- Is the **level of detail consistent** across pages, or does one page go much deeper than the others?

### Overall assessment

Rate the atlas: **trustworthy / mostly trustworthy / needs attention / unreliable as a mental model**.

Summarise: what's the single biggest problem? What would you fix first?

---

## Report format

Write the report to `<workspace>/atlas-audit-<project>/report.md`:

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

#### Structural quality
...

---
(repeat for each page)

## Cross-page coherence

### Concept ownership matrix
| Concept | index.html | data-model.html | sequence-diagrams.html | diataxis.html |
|---------|-----------|----------------|----------------------|--------------|
| ...     | owns      | references     | —                    | —            |

### Gaps
...

### Coherence
...

### Overall assessment
**Rating:** trustworthy / mostly trustworthy / needs attention / unreliable
**Biggest problem:** ...
**Fix first:** ...
```

---

## Pitfalls

- **Don't audit without reading the vault notes first.** You'll apply generic documentation standards instead of atlas-specific ones. The discipline rules and page type definitions are the evaluation criteria.
- **Don't skip the essence step.** Jumping straight to "is this accurate?" without first understanding what the page is *trying to do* leads to shallow findings. The essence frames everything.
- **Don't conflate stale with wrong.** Stale means it was correct at some point. Wrong means it was never correct or is fundamentally misleading. The distinction matters for prioritising fixes.
- **Don't audit design system / structural HTML.** This skill audits *content* — does the atlas accurately represent the system? Structural HTML issues (wrong CSS classes, broken markup) are a different concern. Note them if you spot them, but don't go looking.
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
