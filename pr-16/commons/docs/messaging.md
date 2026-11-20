The messaging layer for commons — why it matters, who it matters to, and the language that lands. Written May 8, 2026. Supersedes the earlier atlas-specific messaging (April 21, 2026). See [abstract](abstract.md) for what a commons is.

---

## The problem

Every experienced collaborator — human or agent — carries tacit understanding of their context. The components, how they connect, where the boundaries are. The decisions that shaped the current state. The arc of how things unfolded. Not documentation. Not code. The understanding itself.

That understanding is invisible, trapped in grey matter, impossible to share at scale:

- **Yours is isolated.** Your mental model might be brilliant — ahead of the code, mid-refactor in your head — but teammates can't see it. The agent can't see it. Multiple people on the same project carry different versions and don't know it.
- **The agent has none.** It re-derives everything from sources each session. Full context doesn't fit in permanent memory. Without a compressed, loadable representation, every session starts cold.
- **Newcomers start cold too.** New humans, new agent instances, you after a month — no way to absorb the grey matter directly. Onboarding is archaeology.

This isn't a documentation problem. Documentation exists; it doesn't solve this. The problem is coordination: **there's no shared surface several parties can read, point at, refine, and trust together.**

---

## The thesis

Build the shared surface. Make it concrete, navigable, and maintained.

When humans and agents operate from the same external reference, the collaboration changes fundamentally:

- The human stops steering from memory and starts steering from a shared reference — reviewable, challengeable, versionable.
- The agent stops re-deriving and starts reasoning against a compressed understanding, precise and grounded, every session.
- Teammates stop guessing whose picture is right — the picture is in a URL, and disagreement resolves by pointing.
- Alignment isn't assumed — it's visible. When your picture and someone else's diverge, you can see it.

We call that shared surface a **commons**. A commons is how an organization externalizes what it tacitly knows, in a form that stays honest as the underlying reality changes.

---

## What the artifact is

A per-project directory of categorized HTML pages, served from a single consistent substrate. Diagrams, orienting prose, source-linked references. Every page is self-contained for one concern; together they form the navigable reference for the project.

Both the human and the agent read and write the same pages. No "human version" and "agent version." For the agent, it's context architecture — the understanding loaded into every session so reasoning is grounded, not reconstructed. For the human, it's the picture in your head, except now it's outside your head and someone else can see it.

---

## Why this beats what already exists

The closest comparables each fill part of the slot. None fill all of it.

| Medium | What it gives | What it can't do |
|---|---|---|
| Docs / wiki | Prose for humans | Dead on write; no drift detection; agents parse them badly |
| Chat / Slack | Fast sync negotiation | Ephemeral; unpointable after scroll |
| Session memory / search | Personal compressed past | Private; time-indexed, not spatial |
| Specs / RFCs | Point-in-time decision | Not living; superseded by reality |
| Code comments | Local, in-place | Don't compose into shape |
| Git history | Exact change log | Unreadable at a glance; expert-only |
| Figma / Miro | Shared visual canvas | No agent interface; no git-backed review |
| **Commons** | Shared reference + agent interface + git-backed change control + drift-aware maintenance | — |

The unique slot is the intersection: a navigable artifact that humans AND agents read, where refinement happens in dialogue, and where changes flow through normal human review. Nothing else in the table does all three.

---

## How it stays honest

An artifact that lies is worse than no artifact. The obvious failure: reality evolves, the commons doesn't, and now you're coordinating against stale reference.

The solution is automated drift detection — structural scans that catch when the subject has outgrown its page, agent evaluation of what's changed, and a PR for the human to approve or reject. The human stays in the loop. The commons stays honest.

This is category-agnostic. Atlas pages drift against the codebase. Timeline pages drift against new events. Decision pages drift when the decision gets revisited. Every category defines what "truth" it drifts against.

---

## Who it's for

**You and your agent, on any project.** Brownfield — the agent reverse-engineers pages from existing reality. Greenfield — they grow as the project does. Returning after a month — minutes to reload the grey matter.

**Your team.** The tacit knowledge that used to live in one person's head is visible, shared, and versionable. New people don't do archaeology — they absorb the compressed understanding directly. How fast they swim depends on their experience, not their tenure.

**Anyone thinking seriously about human-AI collaboration.** Most AI tooling gives you a faster typist. A commons gives you a collaborator that shares your understanding of the project — and keeps it honest when the project changes. The differentiator in the next decade won't be model quality; it'll be how well organizations externalize what they know.

---

## The language

Lead with **commons** — it's warm, human, old English, and encodes the maintenance thesis in its own metaphor (tragedy-of-the-commons = drift if unmaintained).

Use **shared reference** and **shared surface** for precision. **Tacit knowledge** (and **grey matter** for warmth) for the thing being externalized. **Coherence** for the property maintained — use sparingly, as essay-level vocabulary, not as an everyday noun.

Name the artifact by category when concrete: *"the hermes-agent atlas"*, *"the incident timeline"*, *"the Q2 proposal"*. Name it "commons" when speaking of the medium or the collection: *"I put it on the commons"*, *"the team commons is the source of truth"*.

The hook line: *"The agent writes the code. You hold the understanding — together, on the commons."*

Avoid: "documentation" (it isn't), "atlas" as umbrella (atlas is one category), "knowledge base" (passive framing — commons is active), "single source of truth" (overclaimed phrase — commons is shared reference, not the only one).
