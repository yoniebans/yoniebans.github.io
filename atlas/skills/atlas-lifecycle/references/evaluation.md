---
name: architectural-evaluation
description: Extract and evaluate architecturally significant decisions from an existing codebase. Produces a risk-rated decision register for quality attribute analysis (Larman-style). Use after an atlas exists, when the goal is to understand whether the right tradeoffs were made — not to document structure (that's atlas-genesis).
version: 1.0.0
metadata:
  hermes:
    tags: [architecture, evaluation, decisions, quality-attributes]
    related_skills: [brownfield-atlas-genesis, codebase-inspection]
maturity: "initial — 1 run (April 2026: hermes-agent). Output format validated."
---

# Architectural Evaluation

**Trigger:** "evaluate the architecture", "list design decisions", "what are the tradeoffs", "are the right choices being made", or any request to assess architectural quality attributes rather than document structure.

**Prerequisite:** An atlas (or equivalent structural documentation) should exist. If it doesn't, run `brownfield-atlas-genesis` first. Evaluation without a structural map is guessing.

**Output:** A decision register at `/mnt/hermes/workspace/<project>-architectural-decisions.md` — NOT in the atlas directory. This is analysis, not structural documentation.

---

## Step 1 — Three-source parallel analysis

Delegate three subagents in parallel:

### Source A: Atlas / documentation files
- Read ALL atlas files (01-context, 02-containers, 03-components/*, data-model, flows/*, deployment, .component-inventory)
- Also read any CONTEXT.md, README, or existing decision docs
- Extract decisions that are stated explicitly OR implied by structural choices
- For each: what was decided, alternatives, quality attributes impacted

### Source B: Source code
- Focus on architecturally significant code, not every file. Key targets:
  - Entry points and the core loop (how requests flow)
  - Plugin/extension discovery mechanisms
  - State management and persistence
  - Error handling and recovery strategy
  - Concurrency model (sync/async, threading, process boundaries)
  - Caching decisions
  - Security boundaries and trust models
- Look for patterns: singleton vs DI, sync vs async, monolith vs modular, convention vs configuration
- Identify decisions the atlas doesn't document (implementation-level choices with architectural impact)

### Source C: Human-authored architecture notes
- Vault notes, design documents, ADRs, or any prose that explains *why* choices were made
- These often contain rejected alternatives and explicit rationale that code and atlas lack

**Subagent instructions:** For each decision found, note: (1) what was decided, (2) what alternatives existed, (3) what quality attributes it favors, (4) what it trades away.

## Step 2 — Synthesize into decision register

Merge all three sources. De-duplicate (atlas and code often surface the same decision from different angles — combine them, don't list twice). The code-level findings add implementation detail; the vault findings add rationale.

### Decision register format

Each decision gets:

| Field | Purpose |
|---|---|
| **ID** | D01, D02, ... — sequential, grouped by theme |
| **Decision** | What was actually built (factual, not evaluative) |
| **Alternatives rejected** | What wasn't chosen — be specific |
| **Favors** | Quality attributes this serves (use standard terms: modifiability, reliability, performance, security, simplicity, portability, etc.) |
| **Trades away** | Quality attributes sacrificed |
| **Confidence** | How deliberate: *explicit* (documented), *structural* (implied by architecture), *emergent* (grew organically) |
| **Risk** | How likely the tradeoff creates real problems: 🟢 low, 🟡 moderate, 🔴 high |
| **Evaluation notes** | What to monitor, what would trigger revisiting |

### Required summary sections

1. **Risk heat map** — table grouping decisions by risk level
2. **Cross-cutting themes** — 3–6 recurring patterns across decisions (e.g., "simplicity over sophistication", "zero-ops philosophy")
3. **Where to focus evaluation** — identify 2–3 clusters of 🟡/🔴 decisions that share a root cause or theme. These are the architectural pressure points.

## Step 3 — Present to user

Don't just hand over the file. Summarize:
- Total decisions found
- Risk distribution (how many 🟢/🟡/🔴)
- The 2–3 pressure-point themes
- Whether any decisions are at genuine risk of architectural failure vs. manageable tradeoffs

---

## Pitfalls

- **Don't put the output in the atlas directory.** This is analysis/evaluation, not structural documentation. It goes in `/mnt/hermes/workspace/`.
- **Don't confuse structural decisions with implementation details.** "We use SQLite" is architectural. "We use f-strings for logging" is not. The test: does this decision constrain future evolution?
- **Don't rate everything 🟢.** If there are no 🟡 or 🔴, you haven't looked hard enough. Every architecture has tension points.
- **Don't forget emergent decisions.** The most important decisions are sometimes the ones nobody made explicitly — they grew from early code and were never revisited. Flag these with confidence: *emergent*.
- **Don't list alternatives you can't justify.** "Could have used Kubernetes" isn't useful unless there's a realistic path where that would have been chosen.
- **Subagent output placement.** If subagents create files, ensure they write to workspace, not the atlas or project source. The atlas subagent in the first run wrote to the atlas directory and had to be cleaned up.

---

## Maturity log

- **v1.0 (April 2026):** First execution on hermes-agent. 28 decisions extracted from 3 sources. Format validated. Key finding: decisions cluster around "monolith pressure" and "trust/isolation boundaries" themes. No 🔴 items — system is coherent in its tradeoffs.
