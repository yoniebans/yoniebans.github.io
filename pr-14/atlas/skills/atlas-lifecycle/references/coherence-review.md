<!--
Reference for atlas-lifecycle skill — NOT a standalone skill.
name: atlas-coherence-review
description: Weekly cross-page coherence review of an atlas. Runs on a separate cadence from daily drift detection. Catches concept-ownership violations, inconsistent counts, coverage gaps, and cross-reference drift.
-->


# Atlas coherence review (weekly)

**When:** Weekly cron job, or manually via "run the coherence review on [project]".

**Why separate from daily drift?** Daily drift catches structural changes and
claim verification per-page. Coherence catches *cross-page* issues that only
surface when reading all pages together: two pages disagreeing on a count, a
concept explained at full depth on two pages, a top-tier concept missing from
the docs map.

The May 2026 audit found 20 coherence findings (21% of total) — none catchable
by the daily scan. Examples:
- Platform adapter count: 4 different numbers across 4 pages (25+, 22, 25+, 16)
- Plugin lifecycle hooks: 14 on one page, 12 on another
- Subagent constraints: 3 pages, 3 different stories
- Kanban absent from diataxis entirely despite being top-tier on index + data-model

---

## Procedure

### Step 1 — Load config and pull

```bash
cat /mnt/hermes/projects/<project>/daemon.yaml
cd <atlas_path> && git pull origin main 2>&1 | cat
```

### Step 2 — Read all pages

Read every HTML page listed in `atlas.pages`. Build a mental model of the whole
atlas before checking anything.

### Step 3 — Concept ownership matrix

For each major concept in the atlas, determine:
- Which page **owns** it (explains at depth)?
- Which pages **reference** it (mention briefly)?
- Is there unintentional overlap (two pages explaining the same thing at depth)?

Flag ownership violations.

### Step 4 — Cross-page number consistency

Extract every quantified claim from every page. Compare:
- Same concept, different numbers → flag
- KPI on one page contradicts prose on another → flag
- Version strings inconsistent across pages → flag

This overlaps with Layer 2 linters (which do this mechanically). The LLM adds
judgment: "these two numbers look different but actually refer to different things"
vs "these are the same thing with different values."

### Step 5 — Coverage gap analysis

For each L1/L2 concept on the architecture page:
- Does it appear on at least one other page (data-model, sequences, diataxis)?
- If it's absent everywhere else, is that intentional or an oversight?

For each page's declared scope:
- Does the page actually cover everything it claims to?
- Does it cover things outside its scope that belong elsewhere?

### Step 6 — Cross-reference audit

- When Page A references Page B's content, does a link exist?
- Do `data-ref` chips resolve to valid `refs.js` entries → valid files?
- Are there dead anchors (links to `#section-id` that doesn't exist)?

### Step 7 — Report

Output a coherence report. If clean:

```
## Coherence review — <project> — YYYY-MM-DD

✓ No inconsistencies found across N pages.

Checked: concept ownership, cross-page numbers, coverage gaps, cross-references.
```

If findings exist, format per the audit report structure (see `references/audit.md`
Phase 2 section).

### Step 8 — Action

If findings are minor (number disagreements, missing cross-refs): fix directly,
commit to existing drift branch or new branch, open/update PR.

If findings are major (concept ownership violations, missing coverage): flag for
a full audit rather than patching.

---

## Cron wiring

Separate cron job from daily drift. Weekly schedule (e.g. `0 9 * * 1` — Monday 09:00).

```
cronjob action='create'
  name: atlas-coherence-review
  schedule: '0 9 * * 1'
  skills: ['atlas-lifecycle']
  prompt: 'Run the weekly coherence review...'
  deliver: telegram:<chat_id>:<thread_id>
```

No `script` needed — this is pure LLM work (read pages, compare, report).
