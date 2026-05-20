---
id: 001
title: Atlas IR — Intermediate Representation Protocol
status: draft
created: 2026-04-23
author: morpheus
---

# Atlas IR — Intermediate Representation Protocol

## Problem

The agent currently goes from codebase to HTML in one pass. The structural understanding of a system (what actors exist, what containers, how data flows) and the visual rendering (cards, grids, diagrams, labels) are entangled in a single leap. There is no observable checkpoint between "what I understood" and "what I rendered."

This causes:

- **Inconsistency across atlases.** Every atlas re-derives the design system from scratch. Component choices vary by session, model, and mood.
- **No traceability.** When the output looks wrong, there's no way to tell whether the agent misunderstood the system or rendered it poorly.
- **No reusability.** The structural understanding is trapped in HTML. It can't be repurposed for a tweet, a diff view, or a compressed agent context without re-deriving from code.

Previously the IR was implicit — somewhere in the LLM's latent space between reading the code and emitting HTML. We want to externalise it: coerce it down a faintly defined path with strong expectations about what's possible, without killing the expressive latitude that makes each atlas feel alive.

## Constituent Parts

Four distinct things, each with its own job:

```
Skill 1          →  IR           →  Skill 2          →  HTML
(how to model)      (the model)     (how to render)     (the output)
```

### Skill 1 — System Modelling

**Role:** Teach the agent how to look at a codebase and express what it finds in system terms. Domain language. Architectural concepts. Not a single CSS class name.

**Objectives:**
- Given a codebase, decide which page types are warranted (C4 architecture? data model? sequences? documentation map?)
- For each page type, apply the right modelling discipline — C4 layers for architecture, entity-relationship for data, actor-flow for sequences, Diátaxis quadrants for documentation map
- Make structural judgments: does this container warrant L3 decomposition? Should this diagram be split? Which 3-5 flows define how the system thinks? Which entities matter architecturally?
- Produce well-formed IR YAML that captures the system in domain-specific vocabulary
- Reference the appropriate reference IR template(s) for guidance on what to populate

**Does not decide:** How anything looks. No colours, no grid layouts, no card types. Those are Skill 2's job.

### IR — The System Model

**Role:** A structured, domain-specific representation of what was found and how it's categorised. Speaks in system terms — actors, containers, components, entities, flows, design principles — not in presentation terms.

**Properties:**
- **Type-bounded.** Each page type has a defined vocabulary of concepts it can express, codified in its reference IR template. A C4 page talks about context, containers, components. A data model page talks about entities, domains, schema detail. You can't put entity-relationship content on a C4 page.
- **Zoom-layered.** Every page type follows the same zoom principle — orientation first, then increasing detail, then insight. The agent decides how deep to go. (See "Zoom Principle" below.)
- **Flexible within bounds.** Within each concept, the agent decides what's worth including. A container might need extensive commentary or none. A component might need a sub-diagram or just a name and role. The IR doesn't prescribe depth — it defines what *kinds* of things can be said.
- **Extensible by design.** When a new concept emerges that doesn't fit existing vocabulary, the reference IR template expands. But expansion is deliberate — it happens in the reference IR files, not ad-hoc in a project's YAML.
- **Domain-specific, self-owned.** The IR vocabulary doesn't inherit from HTML, CSS, or any rendering technology. Each page type speaks its own domain language: C4 for architecture, entity-relationship for data, sequence/flow for behaviour, Diátaxis for conceptual orientation.

**Does not decide:** How anything looks. The IR says "Core Engine is a container with high significance that has 5 components." It does not say "render as a teal card in a 3-column grid."

### Skill 2 — Visual Translation

**Role:** Translate the domain model (IR) into HTML using the design system. This is where visual judgment lives. The agent reads the IR and decides how to render each concept — cards, bullets, diagrams, labels, tables, callouts, mini-flowcharts — whatever serves the content best.

**Objectives:**
- Map domain concepts to design system components: containers → cards, entities → schema tables, flows → sequence diagrams
- Exercise visual judgment: this container is complex enough for cards with detail, that one is simple enough for a bullet list. This section needs a callout for its key insight, that one doesn't.
- Reference the canonical HTML translation — the base git submodule with styles, components, JS. This is the rendering vocabulary.
- Reference the reference IR templates to know what to expect from the IR and how each concept type should typically render — while retaining latitude to adapt to context.
- Maintain page-level consistency. Within a single page, visual choices should be coherent.

**This is where expressiveness lives.** The IR funnels the system understanding into domain structure. Skill 2 fans it back out into visual richness. The agent brings the same creative latitude it always had — choosing when to use boxes vs bullets, labels vs prose, mini-diagrams vs description — but now it's working from a structured understanding, not from a raw codebase dump.

**Does not decide:** What the system is, what containers exist, which flows matter. That's Skill 1's job, embodied in the IR.

### HTML — The Rendered Output

**Role:** The final visual artifact. Derived from IR via Skill 2. Consumers see this — humans in browsers, the agent when re-reading.

**Properties:**
- Never hand-edited (once the IR flow is adopted)
- Persists alongside the IR — both are source-controlled
- Uses the shared design system (base submodule: styles.css, mermaid-zoom.js, etc.)

## Traceability

When the output looks wrong, the IR tells you where the process broke:

| Blame target | Symptom | Fix |
|---|---|---|
| Skill 1 | IR misrepresents the system — wrong layers, missing containers, bad decomposition choices | Improve Skill 1 guidance |
| IR schema | A concept exists in the system that the IR vocabulary can't express | Extend the reference IR template |
| Skill 2 | IR is accurate but the HTML doesn't serve it well — wrong component choices, poor layout, missing visual aids | Improve Skill 2 guidance |
| Design system | Both IR and HTML are correct but the CSS/JS doesn't render it well | Update base styles/components |

## Design Goals

1. **Quasi-idempotency.** Same IR → same visual character, same structural intent. Not the same bytes. The LLM is the translation layer — output will vary in phrasing, minor markup, annotation style. The IR constrains *what* is expressed; Skill 2 has latitude on *how* it's visually expressed. This latitude is the point — it keeps each atlas alive rather than stamped.
2. **Traceability.** Observable checkpoint between understanding and rendering. Four distinct blame targets.
3. **Consistency of look and feel.** A bounded vocabulary of domain concepts (IR) combined with a bounded vocabulary of visual components (design system) ensures atlases share a recognisable language without being monotone.
4. **Reusability.** The same IR feeds multiple output adapters — full HTML atlas, tweet excerpt, diff view, agent context window.

## The Zoom Principle

Every page type follows the same zoom pattern, mirroring C4's own philosophy of hierarchical abstraction:

| Page Type | Orientation (big picture) | Detail (zoom in) | Insight (patterns/principles) |
|---|---|---|---|
| **C4 Architecture** | System Context (L1) → Containers (L2) → Components (L3) | Code (L4), Dynamic views, Deployment | Supplementary (inventories, constraints) |
| **Data Model** | Entity Map (names + relationships only) | Domain Partitions → Schema Detail (fields, types, constraints) | Wire Formats, Storage Topology |
| **Sequences** | Flow Map (which flows, why) | Sequence Detail (participants, steps, fragments) | Patterns (recurring interaction shapes) |
| **Documentation Map** | Landscape (four quadrants, framing) | Quadrant detail (learning path, extension points, surfaces, principles) | Cross-cutting concerns |

The agent (Skill 1) decides how deep to go at each level. Not every data model needs domain partitioning. Not every C4 page needs L3 decomposition. The zoom levels exist as options, not mandates.

## Page Types and Reference IR Templates

Each page type has its own reference IR template — an exhaustive, annotated YAML file that defines every concept the page can express. These are the contracts.

| Page Type | Reference IR | Domain Vocabulary | When to Include |
|---|---|---|---|
| **C4 Architecture** | `reference-ir/c4-architecture.yaml` | C4 model: context, containers, components, code, dynamic, deployment | Always — every project needs this |
| **Data Model** | `reference-ir/data-model.yaml` | Entity-relationship: entities, domains, schema, wire formats, config, storage topology | When the system has persistent state |
| **Sequences** | `reference-ir/sequences.yaml` | Behavioural: flows, participants, steps, fragments, patterns | When 3+ non-trivial flows define the system |
| **Documentation Map** | `reference-ir/documentation-map.yaml` | Diátaxis: tutorials, how-to, reference, explanation, cross-cutting | When the system is complex enough that structure alone doesn't convey understanding |

The reference IR templates are the source of truth for what each page type can express. The spec (this document) describes the protocol — the constituent parts, design goals, and how they fit together. The reference IRs define the vocabulary.

**The contract:** nothing should be produced that doesn't align with the reference IR. If a concept isn't in the reference IR for its page type, it either doesn't belong or the reference IR needs extending.

The agent loads only the reference IR templates relevant to the page types it's producing. A simple project might only need `c4-architecture.yaml`. A complex one loads all four.

### Modelling Notes

Every reference IR template includes a `modelling_notes` section — the agent's reasoning about structural decisions. These are NOT rendered into the atlas. They're the diagnostic trail for Skill 1: why containers were decomposed or not, why certain flows were selected, why a domain partition was chosen. When something looks wrong in the output, these notes explain the agent's reasoning.

## Root Manifest (`atlas.yaml`)

Global identity inherited by all pages:

```yaml
site:
  name: ""                            # system / project name
  org: ""                             # organisation
  repo: ""                            # owner/repo
  branch: main

pages:
  - c4-architecture.yaml
  - data-model.yaml
  - sequences.yaml
  - documentation-map.yaml
```

Deliberately minimal. Identity and page list only. Rendering decisions (scripts, styles, animation, dividers) belong in Skill 2 and the design system, not the IR.

## Diagram Source Files (`diagrams/*.mmd`)

Mermaid source extracted to standalone files, referenced by path from the IR:

```
atlas/
├── atlas.yaml
├── pages/
│   ├── c4-architecture.yaml
│   ├── data-model.yaml
│   ├── sequences.yaml
│   └── documentation-map.yaml
├── diagrams/
│   ├── context.mmd
│   ├── containers.mmd
│   ├── core-engine.mmd
│   ├── entity-map.mmd
│   ├── cli-flow.mmd
│   └── ...
└── refs.json
```

Benefits:
- Diagrams are independently viewable in any Mermaid tool
- Drift detection can diff `.mmd` files directly
- Multiple output adapters can reference the same diagram source

## The Expressiveness Contract

The IR is a funnel, not a mould. It constrains the domain (what kinds of things can be said) but not the depth or richness within those bounds. Skill 2 fans it back out into visual expression.

```
Codebase                    IR (structured, domain-bound)         Skill 2 (visually expressive)
├── source files       →    ├── containers: [A, B, C, D]    →    ├── A: complex → rich card + sub-diagram
├── schemas            →    ├── components: {A: [x,y,z]}    →    ├── B: significant → card with bullets
├── configs            →    ├── supplementary: [tech stack]  →    ├── C: peripheral → line in a list
└── docs               →    └── flows: [login, agent-loop]   →    ├── D: peripheral → line in a list
                                                                   ├── tech stack → compact table
                                                                   └── login flow → sequence + key-step cards
```

The IR ensures **type compatibility** — you can't put entity content on a C4 page. Skill 2 ensures **visual quality** — the rendering serves the content, not the other way around.

If the IR is so prescriptive that the agent produces rigid, monotone output, the IR has overstepped. If the IR is so loose that the agent produces inconsistent, structurally incoherent output, the IR has understepped. The right balance: strong expectations about what's possible, creative latitude in how it's expressed.

## Output Adapters

The same IR feeds different rendering targets. Each adapter has its own Skill 2 variant.

### Atlas HTML (primary)
Full multi-page site with zoomable diagrams, design system components, TOC, presentation mode.

### Tweet Excerpt
Take a section of atlas IR, squash into a mini-IR (one diagram, one key insight, punchy text), render to screenshot-ready HTML via a tweet-specific Skill 2.

### Diff View
Compare two IR snapshots (different commits, PR vs main). Structural YAML diff — "container X was added, entity Y gained a field, flow Z changed participants."

### Agent Context Window
The IR itself, or a compressed derivative. Token-efficient structured representation for agent re-reads.

## Relationship to Existing Tools

### atlas-site build tool
Generates atlas HTML from markdown (one diagram per file). The IR is richer — structured domain vocabulary per page type, multiple rendering styles. They share the design system and may converge.

### brownfield-atlas-genesis skill
Currently: codebase → HTML. Becomes: Skill 1 (codebase → IR) + Skill 2 (IR → HTML). The interview/planning steps remain as a precursor to Skill 1.

### atlas-drift-detection
Currently diffs HTML. With IR, diffs YAML — cleaner, structural. The daemon updates IR + `.mmd` files, then triggers a Skill 2 re-render.

## Migration Path

1. ~~**Write the reference IR templates.**~~ ✅ Done. Four templates in `reference-ir/`.
2. **Extract IR from hermes-architecture.** Reverse-engineer IR YAML from the 4 existing HTML pages using the reference IR templates. Validates the schema covers real content.
3. **Write Skill 1 and Skill 2 as agent skills.** Skill 1 references the reference IR templates. Skill 2 references the reference IR templates + the design system.
4. **Roundtrip test.** Agent reads IR, renders HTML via Skill 2. Compare visual character against current pages. Delta should be improved consistency, not lost expressiveness.
5. **Adopt for new atlases.** Next brownfield-atlas-genesis run uses the IR flow.
6. **Retire direct-to-HTML.** IR is the source of truth. HTML is derived.

## Open Questions

1. **IR evolution governance.** When a new concept is needed (e.g. a new zoom level, a new supplementary type), how is the reference IR updated? Spec-level change → PR → adopted? Or more organic — the agent proposes, we review?

2. **Multi-project consistency.** Should all projects share one set of reference IR templates, or can projects extend the vocabulary locally? One set = consistency. Local extensions = flexibility. Current leaning: one canonical set, extend centrally.

3. **Convergence with atlas-site.** Could the markdown-based atlas-site eventually consume IR YAML? This would unify both pipelines under one domain vocabulary. Depends on whether the IR schema proves stable.

4. **Skill 2 per-page-type guidance.** Should Skill 2 have per-page-type sub-guidance (how to render C4 concepts vs how to render data model concepts), or one unified rendering skill? The reference IRs are per-page-type; the rendering guidance may need to be too.
