An **atlas** is the shared abstract layer between human and machine understanding of a project. Not docs, not a README — the mental model itself, materialized as an interactive HTML site that both the human and the agent produce, read, and share.

Every project (greenfield or brownfield) gets one. How it comes into being differs by mode; what it *is* does not. See [lifecycle](lifecycle.md) for when each mode produces it.

Written April 18, 2026. Revised April 20, 2026 (HTML-first rewrite). See also: [structure](structure.md), [discipline](discipline.md), [lifecycle](lifecycle.md).

---

## Why

Dense LLM-written READMEs and Docusaurus sites optimize for *lookup* — you already know what you're searching for. They fail at *orientation* — building the mental model on first contact.

An atlas is optimized for orientation. Mastery comes afterward, through the code itself and through the other per-project artifacts (CONTEXT.md, decisions/, specs/).

It sits between:

- **Human prose** (README, docs site) — high-level but lossy, often stale, prone to becoming essays
- **Machine detail** (code, schemas, configs) — precise but no viewpoint, no helicopter view

An atlas occupies the middle ground: structural and behavioral diagrams with just enough orienting prose that a human can build a mental model in 10 minutes and the agent can parse deterministically. Same pages, both audiences.

---

## What

A per-project directory of HTML pages — one page per concern, multiple diagrams per page. Structural and behavioral, mixing C4 (levels 1–3) with UML (sequence, class/ER, deployment).

- [structure](structure.md) — page types, directory layout, design system
- [discipline](discipline.md) — rules that keep it a helicopter view
- [lifecycle](lifecycle.md) — how it comes into being (per mode), how it's maintained, when reviewed
- [messaging](messaging.md) — why it matters, who it matters to, messaging angles by audience

---

## Relationship to other per-project artifacts

Each artifact has one job. The atlas carries the shape; everything else carries the work:

| Artifact | Purpose | Audience / trigger |
|---|---|---|
| `atlas/` | Structural + behavioral shape | First contact; re-orienting after time away; agent entry point |
| `CONTEXT.md` | Build/test/deploy commands, conventions, gotchas | Day-to-day work |
| `decisions/NNN-*.md` | Why choices were made (ADR-lite) | When revisiting a choice |
| `specs/NNN-*.md` | What's being built next | Active work |

The atlas is read once on onboarding and rarely re-read. The others are touched continuously during work.

---

## Both audiences, one substrate

- **A human** opens the atlas in a browser, scans the pages in ~10 minutes, navigates via sidebar TOC and companion-page cards. Diagrams are zoomable/pannable. Code chips link to the source repo.
- **The agent** reads the HTML source, parses Mermaid diagram definitions deterministically, reasons about components by name, proposes updates when structure changes, uses the atlas as the entry point when asked "what does this project do?"

Same files serve both. No separate "agent version" and "human version." The HTML *is* the source of truth.

---

## The agent IS the build step

There is no intermediate format (markdown → build → HTML). The agent produces HTML directly, using the design system assets and the reference example as in-context learning. This keeps the authoring loop tight: the agent writes, the user reviews in their browser, the agent patches.

Reference example: [hermes-architecture](https://github.com/yoniebans/hermes-architecture) — the atlas of hermes-agent. First one ever produced, canonical reference for all future atlases.
