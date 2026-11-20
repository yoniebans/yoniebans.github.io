# Recurring drift classes to scan for during atlas audit

Patterns observed across multiple audits (April 28 2026 and May 18 2026 runs against `hermes-architecture` / `hermes-agent`). When auditing any atlas, run these checks proactively — they're the failure modes most likely to surface, and most likely to be **inconsistent across pages** (the same fact stated differently on different pages).

Add new patterns here as future audits surface them. This file complements the canonical `atlas-audit/SKILL.md` Step 1.5 finding checklist — those are the *types* of findings; this is the *recurring instances* to actively probe.

---

## 1. The "same fact, wrong differently on each page" pattern

Most atlas drift isn't a single wrong statement — it's the same concept described slightly differently on 2–4 pages, with at least one stale. Examples from May 18 2026 hermes-agent audit:

- **Subagent max delegation depth** appeared on 4 pages with 3 different framings: index.html "Max depth 2", sequence-diagrams.html "limited to 2 levels", "Max delegation depth: 2 levels", diataxis.html "Max depth is 2". All four wrong (real value: `MAX_DEPTH = 1` in `tools/delegate_tool.py:133`). The KPI strip on sequence-diagrams.html also encoded "2 Delegation Depth". One PR could fix all four together but only by *finding* all four sites — a coherence-stage cross-grep is how you don't miss any.
- **Subagent blocked-tools list** — index.html and diataxis.html had different lengths (4 vs 5). diataxis was correct (`delegate, clarify, memory, send_message, execute_code`); index dropped `send_message`. Sequence-diagrams.html also dropped `send_message`.
- **Auxiliary task channels** — index.html callout, data-model.html task table, and `auxiliary_client.py:4412` docstring listed THREE different sets of 8/8/7 tasks. `approval` and `flush_memories` appeared on the atlas but not in `auxiliary_client.py`; `title_generation` was in the code but missing from both atlas pages.
- **Schema version** — index.html "Schema v10", data-model.html section subtitle + ER diagram "currently 10" + migration history v1–v10. Real: `SCHEMA_VERSION = 11`. Three sites, all stale.
- **Platform count** — index.html KPI "25+ Platform Adapters" vs index.html section heading "22 platforms, one session layer" vs diataxis.html mental-model callout "16 messaging integrations". Three numbers within one atlas.
- **Memory-provider count** — index.html KPI "8 Memory Providers" + indigo tag-list (8 entries) + diataxis.html Decision #9 "8 plugins" — consistent. BUT diataxis.html line 337 says "7 shipped providers as reference implementations" within the same paragraph block. Single-page self-contradiction.

**Procedure:** during Phase 2 (cross-page coherence), for every numeric fact and every enumerated list that appears on more than one page, grep all 4 atlas pages for the concept and tabulate the versions. The audit's action-items list should treat **inconsistencies between pages** as a finding class distinct from staleness — a coherence finding, not a staleness finding. Pages that disagree confuse the reader about which is authoritative.

## 2. KPI counts vs section enumerations on the same page

KPI strips claim "N", section content enumerates M ≠ N. Concrete examples (May 18 audit):

- index.html: KPI "25+ Platform Adapters", section heading "22 platforms". Same page.
- sequence-diagrams.html: KPI "8 Key Sequences", page contains 11 sequence diagrams. KPI "4 Entry Points", page documents 6 (CLI, Gateway, TUI, Web Dashboard, ACP, MCP).
- data-model.html: KPI "30+ Toolset groups", leaf-list shown enumerates 20 (with at least 10 toolsets missing from the list).
- data-model.html: KPI "8 Auxiliary tasks", auxiliary_client.py canonical list is 7.

**Procedure:** for every KPI on the page, locate the actual enumeration of that concept on the same page and verify the count matches. If the page enumerates `M` but the KPI claims `N+`, decide whether `M` is the true number or whether the enumeration is also stale and `N+` was right.

## 3. The "atlas references a code path that doesn't exist" pattern

Atlas claims a module exists at path X; grep finds it at a different path or not at all. Examples (May 18):

- diataxis.html module-map node `agent/smart_model_routing.py` — does not exist. Concept exists (`smart_model_routing` config key references it) but the implementation lives elsewhere.
- data-model.html plugin-system class diagram references `plugins/manager.py` via `data-ref="plugin-manager"`. Real plugin infrastructure: `hermes_cli/plugins.py` (with `kind`, `register_context_engine`, etc.). The class diagram may be invented rather than extracted.
- diataxis.html "Add a New Tool" how-to instructs the reader to add to `model_tools.py _modules` list. No `_modules` symbol exists in `model_tools.py`.

**Procedure:** for every `data-ref` entry in `refs.js` and every `<code>` chip naming a file/module path, verify the path exists. For class-diagram methods, verify the methods exist on the named class. Don't trust the diagram to be code-extracted; some diagrams are authored, not derived.

## 4. The "magnitude" pattern — round numbers that are wildly stale

Numeric file sizes / line counts / loose enumeration counts drift hardest because nobody notices. Examples:

- diataxis.html module-map: `run_agent.py<br/><small>8500 lines · AIAgent</small>`. Real: `wc -l run_agent.py` = 4104. Off by ~2×.
- AIAgent `__init__` "50+ parameters" claim — AGENTS.md says ~60.

**Procedure:** any `wc -l`-able claim should be re-checked. Atlas authors update prose; nobody re-runs `wc -l`.

## 5. The "old top-level surface no longer exists" pattern

A subsystem gets removed from the codebase; one page gets the cleanup but another keeps the reference. Concrete trace from May 18: `RL Training Framework` actor + `RL env` edge survived on `index.html` L1 diagram (lines 166, 184) even though `diataxis.html` had been scrubbed of all RL/atropos references back in April. The atlas-lifecycle skill already has a pitfall for this ("When a container surface is DELETED from the codebase, grep the entire atlas before editing"), but the *audit* should specifically check for the inverse — surfaces that *don't* exist in the codebase but still appear on the atlas. Run a verification sweep: every node in every L1/L2 diagram → does this concept have a current home in the codebase?

## 6. The "stale-by-construction" content classes

Per `discipline.md`, certain content belongs in CONTEXT.md or `decisions/`, not the atlas. When that content lives in the atlas, it ages badly. Recurring offenders observed May 18:

- Specific retry counts ("15 retries, 20–150ms jitter").
- Specific cooldown values ("HTTP 402 → 24-hour cooldown" — was already false by May 2026; the real value was 1 hour).
- Specific threshold tuning ("checks message length <160 chars, <28 words").
- Specific module size claims (the 8500-line `run_agent.py` example above).
- Explicit numbered procedure lists ("8-step recovery cascade") that bake an implementation ordering into the atlas.

**Procedure:** during the Discipline-quality pass (Step 1.5 "Structural quality"), flag every paragraph that introduces a magic number or numbered procedure. Either move to CONTEXT.md / decisions/, or replace with the conceptual claim ("application-level retry with jitter to avoid convoy") that doesn't go stale.

---

## Per-audit-cycle template

For each page, generate a recurring-drift checklist by grepping the page for these patterns:

```
# numeric facts to cross-check
grep -nE 'v[0-9]+\.[0-9]+\.[0-9]+|Schema v[0-9]+|version [0-9]+|[0-9]+ [a-z]+ [a-z]+|[0-9]+\+|Max [a-z]+ [0-9]+|[0-9]+ hours?|[0-9]+ seconds?|[0-9]+ minutes?|[0-9]+ retries?|[0-9]+%' <atlas-page.html>

# code paths claimed to exist
grep -nE 'data-ref=|<code>[a-z_]+/[a-z_.]+</code>|<code>[a-z_]+\.py</code>' <atlas-page.html>

# enumeration counts to cross-check vs KPI strip
grep -nE 'kpi-card__value|kpi-card__label' <atlas-page.html>
```

Cross-tabulate findings into the audit report's Coherence section before producing the action-items list. The output of running these patterns IS the structural-staleness portion of the audit — the SKILL.md per-page essence work uncovers the conceptual gaps, this checklist uncovers the mechanical ones.

---

## Actioning audit findings: the fix-time re-verification loop

When the user says "yes, action the audit", you're not just applying the report verbatim — the audit itself is a snapshot that can be wrong. Re-verification happens at fix time, not just audit time.

**Standard pattern per finding:**

1. **Re-grep the canonical source** before changing the atlas. The audit said "atlas says N, code says M" — verify M is still M. Lists drift between audit-time and fix-time too (the May 18 run found `plugins/model-providers/` went from 29 → 30 in the days between audit and PR).
2. **If the audit's claim about the code is wrong, note the errata.** The fix still ships (the atlas was wrong on something), but the *direction* of the fix may change. Concrete commit-message pattern: `Audit errata: report claimed canonical=7 based on stale auxiliary_client.py docstring; the real canonical list (config.py) has 11.`
3. **If the audit's claim about the atlas is wrong, skip that part of the fix and log it.** The May 18 audit said `index.html` was missing `send_message` from the subagent blocked-tools list. Re-reading line 590 showed it was already correct. The commit still went out (other sites needed the fix), but the body called out the index.html line as audit-errata so a future archaeologist sees the correction.

**Author preferences observed during the May 18 fix cycle:**

- **Bundled commits by theme**, not one-commit-per-finding. The audit report's 30 action items collapsed to 9 themed mechanical commits + 12 single-item bigger commits + a few skipped (kanban, deferred for maturity reasons). The skill should not produce 30 separate commits.
- **Per-commit sign-off** is the standing rule. Propose the diff, wait for "yes", apply + commit + push. Never batch without consent. (See user profile.)
- **PR is opened after commit A** so preview deploys spin up early; the ticklist in the PR body tracks remaining items.
- **`browser_vision` and live-render checks are deferred to user inspection** during the fix cycle. Mermaid label audit (`scripts/audit-mermaid-labels.py`) runs on every commit that touches a diagram source, but full visual QA waits for the user to look at the preview deploy.
- **Some "fix" items are content-additions, not edits.** Adding a missing sequence diagram, adding a missing card, adding a missing extension surface. These warrant a fresh check-in with the user before applying, because they commit to a design — vs. a pure update to a stale number, which is reversible. The May 18 run had a kanban-sequence-diagram item that we *skipped* mid-cycle when the user said "not sure I would consider the kanban a core feature yet" — the maturity check belongs in the discussion, not in the audit's priority list.
- **"Drop the LOC count, don't update it"** for items like `run_agent.py 8500 → 4104`. Numbers that churn are the wrong level of precision for an atlas. The fix removes the noise, doesn't refresh it.

**The class of decisions that warrant a fresh user check-in mid-PR:**

- Anything that adds a new section, card, or diagram (content addition).
- Anything that promotes a feature to "core" status when the user might consider it nascent (kanban example).
- Anything where the canonical source has changed direction since audit time (auxiliary task list grew from 7 → 11 between audit and fix).

If you find yourself drafting a third option ("Option A: …, Option B: …, lean B") the user wants you to actually pause and ask. Don't decide unilaterally on these.
