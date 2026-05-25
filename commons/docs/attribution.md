What this work drew from, what converged with it, and who to credit. Written May 8, 2026.

---

## The UI substrate

The visual and interaction design of every commons page descends directly from **[visual-explainer](https://github.com/nicobailon/agentic-skills)** by **nicobailon** — a skill for generating self-contained HTML pages that visually explain systems. We've lifted, explicitly:

- The **`.ve-card` depth-tier system** (hero / elevated / default / recessed) for visual hierarchy without equal treatment
- The **Mermaid-wrap zoom/pan pattern** — `diagram-shell` container, zoom controls, click-to-expand, Ctrl+scroll, click-and-drag pan
- The **Blueprint aesthetic** (technical-drawing feel, grid background, deep slate/blue palette, monospace labels, precise borders)
- The **"typography is the diagram"** discipline — distinctive font pairings (DM Sans + Fira Code etc.), variation between pages, avoidance of generic defaults (Inter + violet = AI slop)
- The **anti-pattern catalogue** (no emoji section headers, no gradient text on headings, no indigo/violet Tailwind defaults, no neon dashboards, no pulsing glows)

The commons design system (`base/` submodule at `yoniebans.github.io`) is a specialization of these patterns for a specific use: pages that must feel like the same place, across projects, across categories, across months. Where visual-explainer generates one-offs, the commons design system is the stable substrate underneath many one-offs.

This may migrate toward **[DESIGN.md](https://github.com/google/DESIGN.md)** (Google) as a more formal token specification. If it does, attribution updates to credit both.

---

## Parallel convergence — "The Bottleneck Was Never the Code"

**[Will Kurt](https://www.thetypicalset.com/blog/thoughts-on-coding-agents)** (via .txt) published *"The Bottleneck Was Never the Code"* on April 29, 2026. Independently and from a different starting point, the essay lands on a thesis adjacent to ours:

> *"People treating coherence as a real artifact to maintain."*
>
> *"Context is the commodity an organization runs on."*
>
> *"Agents are underestimated as a way to make organizations externalize what they know."*

The commons is infrastructure for exactly that — coherence as a maintained artifact; externalized organizational knowledge; shared context that humans and agents read together. We reached it from a different direction (starting from atlas in April, framed initially as "the shape of a codebase"), but the convergence is real and worth acknowledging.

The essay is a reference, not a source. Our work predates it, from a different angle. The convergence signal is the point: serious people coming from different directions are landing on coherence as a maintained artifact. That's a signal the shape is real, not the shape's origin.

---

## Our own lineage

The commons evolved through a sequence of sessions, documented in vault:

- **April 17, 2026** — atlas named, C4+UML multi-file structure established, six discipline rules
- **April 18** — `abstract.md` written: "the shared abstract layer between human and machine understanding"
- **April 20** — *"the agent IS the build step"* — markdown→build→HTML pipeline killed; direct HTML authoring adopted
- **April 21** — philosophy crystallized: *"The agent does the work. You hold the shape."* Messaging rework.
- **April 24** — IR (intermediate-representation) pipeline attempted and scrapped — lossy compression
- **April 27–28** — per-page authoring loop adopted (concrete → abstract, one page at a time, coherence review at end)
- **April 28** — atlas-audit skill shipped; first reverse audit of hermes-architecture (10 action items, 3 tiers)
- **May 8, 2026** — atlas reframed as one category under the commons umbrella. This is the naming and framing we believe will hold.

The April 21 messaging doc included: *"'Atlas' is a working name. It's cartographic, not cognitive. If a better name emerges from the cognitive framing, swap it."* Commons is the answer to that line — a name that encodes maintenance (tragedy-of-the-commons), that scales across categories (atlas is one kind), and that's ownable in the AI-tooling space.

---

## What we're not claiming

- **Not claiming originality on "coherence as an artifact"** — see parallel convergence above. We believe we reached it independently; we don't claim we reached it first.
- **Not claiming originality on "the agent IS the build step"** — this is an emerging consensus across many direct-HTML authoring tools. We articulated it on April 20 after scrapping the markdown pipeline; others may have articulated it earlier.
- **Not claiming originality on C4 + UML** — Simon Brown's C4 model and UML are the established foundations. We specialize how an agent reads and produces them.
- **Not claiming the design system** — it descends from visual-explainer, credited above.

What we *are* claiming: the specific shape of the commons as a category-structured, agent-mediated, drift-aware, git-gated shared surface — the integration of these pieces into a single maintained medium — is our synthesis. The vision for living pages with per-page agents and PR-gated refinement (captured in `/mnt/hermes/vault/commons/vision.md`) is our direction.

---

## Forward-looking credits

Infrastructure dependencies that will be credited when integrated:

- **Git worktrees pattern** for parallel agent refinement — will credit whichever worktrees skill is adopted (candidates: `spillwavesolutions/parallel-worktrees`, or an internal author)
- **Subagent orchestrator pattern** — credited to the hermes-agent `delegate_task` system and the `subagent-driven-development` skill
- **DESIGN.md** (if adopted) — Google's design token specification format
