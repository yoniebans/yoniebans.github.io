A **commons** is a shared, living reference artifact that humans and agents coordinate around. Not documentation, not a wiki, not chat — a navigable surface that both parties read, point at, refine, and maintain together.

Every non-trivial project gets one. How it comes into being differs by category and mode; what it *is* does not. The first concrete category is atlas — the architectural commons of a codebase — and its lifecycle is documented in `../atlas/docs/lifecycle.md`. Other categories will follow as they materialise.

Written May 8, 2026. Supersedes the earlier "atlas" framing from April 17–28 — atlas is preserved as the first concrete category of commons but the umbrella concept is now commons. See [messaging](messaging.md), [attribution](attribution.md), and (atlas-specific until other categories materialise) `../atlas/docs/structure.md` and `../atlas/docs/discipline.md`.

---

## Why

When code gets cheap, **coherence becomes scarce**. The bottleneck shifts from writing code to agreeing — on what should exist, at what shape, for what purpose. Shared understanding was always the real substrate of engineering work; it used to be hidden behind typing cost. Now the typing cost is falling, and the coordination cost is exposed.

Existing media don't fill the gap:

- **Docs and wikis** are dead on write. Drift is invisible until the next onboarding fails.
- **Chat and Slack** are ephemeral. You can't point at a conversation three months later.
- **Session memory and search** are private, time-indexed, and personal. One person's, one agent's, not shared.
- **Specs and RFCs** capture a point in time. They don't live past the merge.
- **Figma, Miro, and shared canvases** give spatial reference but have no git-backed change review and no agent interface.

A commons occupies the slot none of these fill: **shared spatial reference + agent-mediated refinement + human-gated change control**. A single artifact several parties (human, agent, future joiner, background job) can all navigate, trust, and update.

---

## What

A per-project directory of HTML pages, organized by category, served from the project's commons repo. Each page is a self-contained reference for one concern — a system, a decision, a timeline, a concept, a snapshot.

- [messaging](messaging.md) — why it matters, who it matters to, the language that lands
- [attribution](attribution.md) — what we drew from, what converged with us
- `../atlas/docs/structure.md` — page types, directory layout, design system (atlas-specific until other categories materialise)
- `../atlas/docs/discipline.md` — rules that keep it a shared reference, not a dump (atlas-specific until other categories materialise)
- `../atlas/docs/lifecycle.md` — how pages come into being, how they're maintained, when reviewed (atlas-specific until other categories materialise)

---

## Categories

A commons holds different kinds of pages. What unites them is the substrate — same design system, same interaction patterns, same drift-aware lifecycle. What differs is purpose:

| Category | What the page carries | Example |
|---|---|---|
| **Atlas** | Architectural shape of a codebase (C4 + UML) | `hermes-architecture` |
| **Concept** | A single idea, externalized for shared reference | A written-out metaphor, a principle page |
| **System** | A subsystem or integration, broader than one codebase | How three services interact across teams |
| **Timeline** | Temporal reference — how something unfolded, when | Incident retros, project arcs |
| **Decision** | A choice, its context, its trade-offs | ADR-style but presented as reference |
| **Snapshot** | A point-in-time view captured for durability | State of a workstream at quarter-end |
| **Proposal** | A shape under consideration, not yet committed | Early-stage design, open for refinement |

These are starting categories. The taxonomy will evolve as commons pages get built. The rule: each category answers a different "what is this reader looking for" — no category overlap, no "misc" bucket.

---

## Relationship to other per-project artifacts

The commons carries shared reference; everything else carries the work:

| Artifact | Purpose | Audience / trigger |
|---|---|---|
| `commons/` | Shared reference — shape, concepts, decisions, timelines | Orientation; collaboration; shared pointing |
| `CONTEXT.md` | Build/test/deploy commands, conventions, gotchas | Day-to-day work |
| `decisions/NNN-*.md` | Full rationale for choices (ADR) | When revisiting a choice in depth |
| `specs/NNN-*.md` | What's being built next | Active work |

A commons page is read many times by many people. The others are touched continuously by whoever's doing the work.

---

## Both audiences, one substrate

- **A human** opens a commons page in a browser, scans it in minutes, navigates via sidebar TOC and cross-page links. Diagrams are zoomable. Code chips link to source. Every page feels like the same place.
- **An agent** reads the HTML source, parses diagram definitions deterministically, reasons about components by name, proposes updates when reality changes, uses the commons as the entry point when asked "what does this project look like?"

Same files serve both. No separate "agent version" and "human version." The HTML *is* the source of truth.

---

## The agent IS the build step

There is no intermediate format (markdown → build → HTML). The agent produces HTML directly, using the design system assets and existing commons pages as in-context learning. This keeps the authoring loop tight: the agent writes, the user reviews in their browser, the agent patches.

Reference example: [hermes-architecture](https://github.com/yoniebans/hermes-architecture) — an atlas-category commons for the hermes-agent codebase. First one ever produced, canonical reference for all future commons pages (of any category) until more references accumulate.
