---
name: atlas-ir-system-modelling
description: "IR YAML producer — second phase of the atlas IR pipeline. Takes the agent's loaded understanding (from atlas-source-ingest) and expresses it as structured, domain-specific IR YAML pages + Mermaid .mmd diagram files. Makes structural judgments (page types, decomposition depth, flow selection). Does NOT make rendering decisions. Runs in the same context window as atlas-source-ingest."
maturity: "new — v0.1, April 2026. No roundtrip test yet."
metadata:
  hermes:
    tags: [atlas, ir, architecture, modelling, c4, documentation]
    related_skills: [atlas-source-ingest, atlas-ir-visual-translation, atlas-drift-detection]
---

# Atlas IR — System Modelling (Skill 1)

Takes the agent's loaded understanding of a codebase (from `atlas-source-ingest`, running in the same context window) and produces structured IR YAML — C4 for architecture, entity-relationship for data, flow/sequence for behaviour, Diátaxis for conceptual orientation.

**This skill produces the model. It does NOT render anything.** No HTML, no CSS, no grid layouts, no card types. Visual translation is Skill 2's job (`atlas-ir-visual-translation`).

**Trigger:** Runs immediately after `atlas-source-ingest` has loaded codebase understanding into context. Same context window — no intermediate artifact between ingest and modelling. The pipeline is autonomous: ingest → model → render. The user reviews the final output.

---

## Pre-flight reads (mandatory)

### Reference IR templates

Load only the templates for confirmed page types. These are the CONTRACTS between Skill 1 and Skill 2 — nothing should be produced that doesn't align with them.

The reference IRs live inside this skill's `references/` directory. Load them with `skill_view`:

| Page type | Skill reference path |
|---|---|
| C4 Architecture | `references/c4-architecture.yaml` |
| Data Model | `references/data-model.yaml` |
| Sequences | `references/sequences.yaml` |
| Documentation Map | `references/documentation-map.yaml` |

```
skill_view(name="atlas-ir-system-modelling", file_path="references/c4-architecture.yaml")
```

The canonical copies also live in `atlas/specs/reference-ir/` in the yoniebans.github.io repo, but the skill-local copies are the portable contract.

### Protocol spec

Skim if not already familiar — the protocol spec lives in `atlas/specs/001-atlas-ir-layer.md` in the yoniebans.github.io repo.

### Discovery notes

Not needed — `atlas-source-ingest` runs in the same context window. The agent already has the codebase understanding loaded.

---

## Page type selection framework

Decide which pages the system warrants autonomously. Document the reasoning in `modelling_notes`.

| Page type | When to include | When to skip |
|---|---|---|
| **C4 Architecture** | Always — every project needs this | Never |
| **Data Model** | System has persistent state (DB, files, cache) with ≥3 entities | Stateless services, thin wrappers, CLI tools with no storage |
| **Sequences** | ≥3 non-trivial flows that define how the system thinks | Simple request-response where C4 dynamic views suffice |
| **Documentation Map** | System is complex enough that structure alone doesn't convey understanding — non-obvious design principles, extension points, mental models | When C4 + sequences already provide full orientation |

**Dynamic views vs sequences page:** C4 dynamic views (on the architecture page) show specific features at a chosen abstraction level. The sequences page is the definitive behavioural reference. If the system only warrants one treatment, put flows on the C4 page as dynamic views and skip the sequences page. If flows are rich enough to deserve their own dedicated analysis with patterns, use the sequences page.

---

## Output directory structure

The output directory is specified by the user at invocation. All IR artifacts go here:

```
<output-dir>/
├── atlas.yaml                    # root manifest — identity + page list
├── pages/
│   ├── c4-architecture.yaml      # always
│   ├── data-model.yaml           # when warranted
│   ├── sequences.yaml            # when warranted
│   └── documentation-map.yaml    # when warranted
├── diagrams/
│   ├── context.mmd               # L1 system context
│   ├── containers.mmd            # L2 container view
│   ├── <container-name>.mmd      # L3 per-container component diagrams
│   ├── entity-map.mmd            # entity overview
│   ├── <domain-name>.mmd         # per-domain ER
│   ├── <flow-name>.mmd           # sequence diagrams per flow
│   └── ...
└── refs.json                     # concept → source repo path mappings
```

The HTML output from Skill 2 (`atlas-ir-visual-translation`) goes into the same output directory alongside the IR.

---

## Step 1 — Write atlas.yaml

Root manifest. Deliberately minimal — identity and page list only.

```yaml
site:
  name: ""                        # system / project name
  org: ""                         # organisation
  repo: ""                        # owner/repo
  branch: main

pages:                            # only list confirmed pages
  - c4-architecture.yaml
  # - data-model.yaml
  # - sequences.yaml
  # - documentation-map.yaml
```

Rendering decisions (scripts, styles, animation) belong in Skill 2 and the design system, NOT here.

---

## Step 2 — Model each page type

For each confirmed page type, produce a YAML file under `pages/` that conforms to its reference IR template. Work through the sections in zoom order — orientation first, then detail, then insight.

### C4 Architecture

**Modelling procedure (zoom order):**

1. **System Context (L1)** — always present
   - Identify the system boundary, actors (people/roles), external systems
   - Label relationships with INTENT, not technology — "views account balances", not "JSON/HTTPS"
   - No protocols at this level (C4 rule)

2. **Containers (L2)** — almost always present
   - Identify runtime boundaries — things that must be running for the system to work
   - State technology for each container
   - Include protocol in inter-container relationships
   - Decide: does each thing need to be running, or is it code within a container?

3. **Components (L3)** — selective, one entry per container that warrants it
   - Only decompose containers where: ≥3 meaningful components exist AND they have architectural relationships worth diagramming
   - The sniff test: would a reader gain a sharper mental model than `ls` on the directory? If no, skip.

4. **Code (L4)** — almost never
   - Only when a specific design pattern is architecturally significant and can't be understood from L3

5. **Dynamic views** — the 3-5 flows that define the system
   - Can mix abstraction levels (systems, containers, components in one view)
   - Choose collaboration or sequence style per flow based on complexity
   - Include when the C4 page IS the primary behavioural reference (no separate sequences page)

6. **Deployment** — recommended
   - At minimum production. Include dev/staging if they differ meaningfully.
   - Nodes are nested: physical → VM → Docker → JVM → app

7. **Supplementary** — architectural-level content that isn't a C4 diagram type
   - Tech inventory, cross-cutting summaries, key metrics, decision headlines
   - If a supplementary item grows into its own section, it belongs on a different page type

**Key judgment calls (document in modelling_notes):**

| Decision | Guidance |
|---|---|
| Container vs part-of-container? | JARs/DLLs are NOT containers — they organise code within one. A container needs to be running. |
| Web app: one or two containers? | Server-side only = one. Significant client-side JS (SPA) = two separate process spaces. |
| Cloud data services (S3, RDS)? | Containers you own. Not external systems. |
| Microservices? | Single-team: each is a group of containers within one system. Multi-team: each is promoted to its own software system. |
| Split container diagram? | Split when >8-10 containers, or natural groupings exist. State split rationale. |

### Data Model

**Modelling procedure (zoom order):**

1. **Entity Map** — always present when this page exists
   - Names + relationships only. No fields, no types.
   - Show entities a human would name when describing the domain
   - Skip join tables, audit logs, migration tracking — infrastructure, not domain

2. **Domains** — when >~8 entities
   - Partition by bounded context / business capability, not by database schema
   - 2-6 domains typical. 1 = skip this section. 10+ = system might be multiple systems.
   - Cross-domain references as stubs, not full entities

3. **Schema Detail** — selective, per domain
   - Full field-level for domains where the schema IS the architecture
   - Annotate architecturally significant fields: PKs, FKs, enums, JSON blobs, computed fields
   - Skip for trivial CRUD entities

4. **Wire Formats** — when containers exchange structured data
   - API payloads, event schemas, webhook bodies — data in flight, not at rest
   - Name producers and consumers

5. **Config Structures** — when config structure IS the architecture
   - Include hierarchy/override order when it exists
   - Skip when config is a straightforward .env file

6. **Storage Topology** — when data spans multiple storage technologies
   - Physical reality behind the logical model
   - Skip for single-database systems

### Sequences

**Modelling procedure (zoom order):**

1. **Flow Map** — always present when this page exists
   - List 3-7 flows. Order from most fundamental to most specialised.
   - Group if natural clusters exist (entry paths vs internal mechanisms)
   - For each: name, description, trigger, why_included

2. **Sequence Detail** — one per flow
   - Participants: name, element type, optional technology + flow-specific role
   - Steps: 5-15 typical. Mark 2-3 key moments per flow.
   - Fragments (loops, alt, opt): only when the fragment IS the architectural insight
   - Notes: constraints, timing, side effects not captured by step labels
   - State protocol for every interaction crossing a container boundary

3. **Patterns** — 2-5 recurring shapes across flows
   - Name them concisely. Cross-reference which flows exhibit each.
   - A pattern is NOT another sequence — it's a named regularity

4. **Participant Glossary** — when ≥3 sequences share ≥3 participants

**Flow selection criteria:** "If you understand these, you understand how the system works."
- Exercises the main path (happy path)
- Reveals architectural boundaries (where containers talk)
- Shows a non-obvious mechanism (compression, retry, delegation)
- Represents a category of interaction (one CRUD flow stands for all CRUD)

### Documentation Map

**Modelling procedure (zoom order):**

1. **Landscape** — always present when this page exists
   - One-sentence framing mental model — the single idea that makes everything click
   - Summarize each quadrant in one sentence
   - Note intentional gaps with reasons

2. **Tutorials quadrant** — learning-oriented
   - Learning path: stages in order, what the learner acquires at each stage
   - 3-5 foundational concepts that make everything else tractable

3. **How-to quadrant** — goal-oriented
   - Extension points: mechanism (plugin/config/subclass/adapter), contract, complexity
   - Operational surfaces: common tasks a competent operator performs

4. **Reference quadrant** — information-oriented
   - Surfaces: APIs, CLIs, config schemas, file conventions, protocols
   - Optional module map: logical code organisation, partitioning principle

5. **Explanation quadrant** — understanding-oriented
   - Design principles: name, description, implication, trade-off
   - Key decisions: context, alternatives considered, rationale
   - Constraints: external forces that shaped the design

6. **Cross-cutting concerns** — 3-5 that span containers
   - Name what they touch, describe the invariant/pattern

---

## Step 3 — Author Mermaid diagrams

Every `diagram:` path referenced in the IR gets a standalone `.mmd` file in `diagrams/`.

### Diagram type conventions

| Content | Mermaid type | Notes |
|---|---|---|
| C4 context, containers, components | `graph TD` with `classDef` | NOT experimental C4 syntax (`C4Context`, etc.) — renders poorly |
| Sequence flows | `sequenceDiagram` | Mark key moments with `Note` |
| Entity relationships | `erDiagram` | Entity map: names only. Schema detail: include fields. |
| Class/interface relationships | `classDiagram` | For L4 code views |

### C4 classDef palette

```mermaid
classDef actor fill:#d9770611,stroke:#d9770644,stroke-width:1.5px
classDef sys fill:#0d948822,stroke:#0d9488,stroke-width:2px
classDef ext fill:#0284c711,stroke:#0284c744,stroke-width:1.5px
classDef store fill:#8b5cf611,stroke:#8b5cf644,stroke-width:1.5px
```

Use `stroke-dasharray: 5 5` for planned/future components.

### Diagram hygiene

- **Naming:** Kebab-case, descriptive. `context.mmd`, `containers.mmd`, `core-engine.mmd`, `entity-map.mmd`, `cli-message-flow.mmd`.
- **Edge labels:** Append `&ensp;` to prevent clipping (Mermaid v11 bug).
- **Disconnected subgraphs in LR mode:** Add invisible link `subA ~~~ subB` to force side-by-side.
- **Node labels:** Use `["Label<br/><small>Description</small>"]` for C4 nodes.
- **Keep diagrams readable.** If a diagram exceeds ~15 nodes, split it and document the split rationale in the IR.

---

## Step 4 — Populate refs.json

Build as you model. Map named concepts to source file paths.

```json
{
  "repo": "Owner/repo",
  "branch": "main",
  "refs": {
    "concept-slug": { "path": "path/to/file.py", "symbol": "ClassName" }
  }
}
```

Target 20-50 load-bearing references. Only concepts where a reader would naturally want to jump to source. Skip generic mentions (`JSON`, `~/.config/`).

---

## Step 5 — Write modelling notes

Every page YAML MUST include a non-empty `modelling_notes` section. This is the diagnostic trail — NOT rendered into the atlas.

Document:
- Why pages were included or excluded
- Why containers were decomposed or skipped for L3
- Why specific flows were selected over others
- Why domains were partitioned a certain way
- Any close-call structural judgments

**These notes answer "why does the IR look like this?"** When Skill 2 produces wrong output, modelling notes help isolate whether the IR was wrong (Skill 1 fault) or the rendering was wrong (Skill 2 fault).

---

## The expressiveness contract

The IR is a FUNNEL, not a MOULD.

- **Type-bounded.** Each page type has a defined vocabulary. C4 talks C4. Data model talks entities. You can't put entity-relationship content on a C4 page.
- **Flexible within bounds.** Within each concept, the agent decides what's worth including. A container might need extensive commentary or none.
- **The reference IR defines what CAN be said.** The agent decides what SHOULD be said for this specific system.
- **Extensible by design.** When a concept doesn't fit the vocabulary, the reference IR template expands — deliberately, via a PR to the specs directory. Not ad-hoc in project YAML.

If the IR is so prescriptive that every project looks the same → IR has overstepped.
If the IR is so loose that projects are structurally incoherent → IR has understepped.

---

## Pitfalls

- **Don't include rendering hints in the IR.** No "render as card", no "use 3-column grid", no colour preferences. Domain language only. If you're typing a CSS class name or HTML element, stop.
- **Don't duplicate content across pages.** Dynamic views (C4 page) and sequences (sequences page) serve different purposes. If the system only warrants one treatment, choose one home and skip the other.
- **Don't model everything.** The IR captures what's architecturally significant, not a comprehensive dump. Every section has a "when to skip" — use it.
- **Don't skip modelling notes.** They're the diagnostic seam between understanding and rendering.
- **Don't invent IR vocabulary.** If a concept isn't in the reference IR for its page type, it doesn't belong or the reference IR needs extending (deliberately, not ad-hoc).
- **Don't forget technology at L2.** Context (L1) = intent only. Containers (L2) = technology + protocol. This is C4's rule.
- **Don't treat every entity as architecturally significant.** Entity map shows what a human would name when describing the domain. Infrastructure entities → skip.
- **Don't confuse containers with components.** A container is a runtime boundary (separately deployable). A component is a grouping within a container (same process). When in doubt: "does this need to be running?"
- **Don't over-decompose.** L3 is selective. L4 is almost never. The atlas is for orientation, not code-level detail. IDEs do L4 better.
- **Don't forget cross-page name consistency.** If the C4 page calls it "Core Engine", every other page must use the same name. Build a glossary mentally and stick to it.

---

## Verification checklist

Before declaring the IR complete:

- [ ] **Schema compliance:** Every page YAML conforms to its reference IR template — no invented fields, no missing required sections.
- [ ] **Diagram parity:** Every `diagram:` path in the IR has a corresponding `.mmd` file that exists and contains valid Mermaid syntax.
- [ ] **Cross-page consistency:** Entity names, container names, participant names are consistent across all pages. Spot-check: grep a key name across all YAML files.
- [ ] **Modelling notes present:** Every page has non-empty `modelling_notes` explaining structural decisions.
- [ ] **Refs coverage:** `refs.json` exists with 20-50 load-bearing references.
- [ ] **Atlas manifest:** `atlas.yaml` lists exactly the pages that exist in `pages/`.
- [ ] **No rendering hints:** Grep for CSS, HTML, colour, grid, card — zero hits in IR YAML.
- [ ] **Proceed to Skill 2:** IR is complete — pass control to `atlas-ir-visual-translation` in the same context window.
