---
name: atlas-ir-system-modelling
description: "Ingest a codebase and produce structured IR YAML — the first two phases of the atlas pipeline in a single skill. Loads structural understanding (three modes: cold start, IR delta, PR review), then expresses it as domain-specific IR YAML pages + Mermaid .mmd diagrams. Makes all structural judgments autonomously. Does NOT render — visual translation is a separate skill."
maturity: "v0.3, April 2026. Merged source-ingest into modelling — single skill covers ingest + IR production. Depth improvements from self-evaluating loop iteration 1."
metadata:
  hermes:
    tags: [atlas, ir, architecture, modelling, c4, documentation, codebase, analysis]
    related_skills: [atlas-ir-visual-translation, atlas-drift-detection]
---

# Atlas IR — System Modelling

Loads structural understanding of a codebase, then produces structured IR YAML — C4 for architecture, entity-relationship for data, flow/sequence for behaviour, Diátaxis for conceptual orientation. This skill covers the full path from source code to IR. Visual translation into HTML is `atlas-ir-visual-translation`'s job.

**This skill produces the IR model. It does NOT render anything.** No HTML, no CSS, no grid layouts, no card types.

**Pipeline:** ingest → model → render. This skill owns the first two phases. The user reviews the final HTML output (after visual translation), not the IR directly.

---

## Invocation

The user triggers the pipeline by loading this skill and `atlas-ir-visual-translation`, then providing a prompt. The agent needs three things to proceed:

1. **Source repo** — path to the codebase under investigation
2. **Output directory** — where the IR YAML and rendered HTML will be written
3. **Mode** — cold start, IR delta, or PR review (can often be inferred)

Example invocation:
```
hermes -s atlas-ir-system-modelling,atlas-ir-visual-translation
```
Then: "Build an atlas for /mnt/hermes/source/hermes-agent-data-pipeline, output to /mnt/hermes/workspace/hermes-agent-data-pipeline-atlas/"

**Before proceeding, confirm with the user:**

Present what the agent has inferred and get approval:

1. **Source repo:** path, name, what it appears to be
2. **Detected mode:** cold start / IR delta / PR review, and why
3. **Output directory:** where IR and HTML will be written
4. **Any ambiguities** — flag them, propose a default, ask

Only proceed after the user confirms. This is the one user checkpoint in the pipeline — everything after runs autonomously.

---

## Mode detection

Determine which mode to use before starting analysis:

1. Does an `atlas/` directory with IR YAML exist for this project?
   - No → **Cold start**
   - Yes → Is this a PR review or general update?
     - PR/branch → **PR review**
     - General → **IR delta**

If ambiguous, ask the user. Don't guess.

---

## Phase 1 — Source ingest

Load structural understanding of the codebase into context. The approach depends on the mode. **This phase produces no artifact** — its output is the agent's contextual understanding, consumed directly by phase 2.

### Cold start

Full codebase analysis. The agent knows nothing — build structural understanding from scratch.

**What to inspect (parallel where possible):**

**Filesystem shape:**
- `find <dir> -maxdepth 3 -type d` — container/module layout
- `search_files target=files pattern='*.md'` — existing docs
- Entry points: `main.py`, `index.ts`, `cmd/`, `bin/`, CLI entry, API routes
- Build/deploy config: `docker-compose.yml`, `Dockerfile`, k8s manifests, `Procfile`, CI configs, `fly.toml`, `render.yaml`

**Schema and data:**
- ORM models, `CREATE TABLE`, migration files
- Prisma, SQLAlchemy, Django models, protobuf/gRPC definitions
- Pydantic models, Zod schemas, JSON Schema files
- Config files with structured data (YAML, TOML, JSON)

**Surface area:**
- Public APIs, webhook receivers, CLI commands, event listeners
- `search_files pattern='^(class |def |export |interface |type )' file_glob='*.py'` (adapt glob per language)
- Route definitions, handler registrations

**Existing documentation:**
- README.md — often the single best orientation source. Read first.
- docs/, wiki/, ARCHITECTURE.md, DESIGN.md, ADRs
- Inline doc comments on public interfaces
- Existing diagrams (Mermaid, PlantUML, images in docs/)

**Dependencies and external systems:**
- `requirements.txt`, `pyproject.toml`, `package.json`, `go.mod`, `Cargo.toml`
- External service integrations (API clients, SDKs, message queue consumers)
- IaC (Terraform, Pulumi, CDK) — reveals infrastructure dependencies

**Use parallel tool calls.** This is the biggest timesaver. File reads, search_files, and web_extract (for hosted docs) can all run in parallel. Don't serialise what can be parallelised.

**What to extract (mental model, not artifact):**

After inspection, the agent should be able to answer:

- **What does this system do?** One sentence.
- **What are the runtime boundaries?** What needs to be running?
- **What persists?** What data, where, what shape?
- **What are the entry points?** How does work arrive?
- **What are the external dependencies?** What does this system talk to?
- **What are the 3-5 flows that define how it works?** The interactions that make everything else predictable.
- **What's surprising?** Non-obvious mechanisms, unusual patterns, things that would catch someone off guard.

### IR delta

IR exists. Code has changed. Understand what's different.

**Step 1 — Load existing IR.** Read the current IR YAML files from `atlas/pages/`. This is the agent's baseline understanding. Read `atlas/atlas.yaml` for the manifest. Skim `.mmd` diagram files in `atlas/diagrams/` if the IR references them.

**Step 2 — Determine what changed.**

```bash
# What files changed since IR was last committed?
git log --oneline -1 atlas/  # when was IR last updated?
git diff <ir-commit>..HEAD --stat  # what changed since then?
git diff <ir-commit>..HEAD --name-only  # file list
```

If the IR isn't git-tracked, fall back to modification timestamps or ask the user what changed.

**Step 3 — Scoped analysis.** Only inspect the parts of the codebase that changed:

- **New files/directories** — new containers? new components? new schemas?
- **Modified schemas** — entities added/removed/changed?
- **Modified entry points** — new flows? Changed flow mechanics?
- **Modified config** — new containers, new external dependencies?
- **Deleted files** — containers removed? Components gone?

Map each change back to which IR page(s) it affects:
- New/changed containers → c4-architecture.yaml
- Schema changes → data-model.yaml
- Flow changes → sequences.yaml
- New extension points, design changes → documentation-map.yaml

### PR review

Scoped to a specific PR or branch. The goal isn't full system understanding — it's understanding what THIS change affects architecturally.

**Step 1 — Load existing IR.** Same as IR delta step 1.

**Step 2 — Read the PR.**

```bash
git diff main...<branch> --stat
git diff main...<branch> --name-only
git diff main...<branch>  # full diff if manageable
git log main...<branch> --oneline  # commit messages for intent
```

Also read: PR description, linked issues, commit messages. These carry intent that the diff alone doesn't.

**Step 3 — Assess architectural impact.** For each changed file, ask: does this change affect the system's architecture as captured in the IR?

Most PR changes are **IR-invisible** — bug fixes, refactors, test additions, dependency bumps.

Changes that ARE IR-visible:
- New container, removed container, container responsibility change
- New entity, schema change to architecturally significant fields
- New flow, changed flow mechanics (new participants, different steps)
- New extension point, changed design principle
- New external dependency, removed integration

If no architectural impact, note that in the output and skip phase 2. If IR-visible changes exist, proceed to phase 2.

---

## Phase 2 — IR production

The agent now has structural understanding loaded (from phase 1). Express it as IR YAML.

### Pre-flight reads (mandatory)

#### Reference IR templates

Load only the templates for confirmed page types. These are the CONTRACTS between this skill and `atlas-ir-visual-translation` — nothing should be produced that doesn't align with them.

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

#### Protocol spec

Skim if not already familiar — the protocol spec lives in `atlas/specs/001-atlas-ir-layer.md` in the yoniebans.github.io repo.

### Decision-making

The agent makes all structural judgments autonomously:

- **Page selection:** Which IR pages the system warrants (C4 always, data model if persistent state, sequences if ≥3 flows, documentation map if complex enough)
- **L3 candidates:** Which containers have ≥3 meaningful internal parts with architectural relationships
- **Flow selection:** The 3-5 flows that define how the system thinks
- **Boundary calls:** What's a container vs component, what's external vs owned, where to decompose

Every judgment gets documented in `modelling_notes` in the IR. The user reviews the final output (IR + HTML), not the plan. If a call was wrong, the modelling notes explain the reasoning so it can be corrected.

---

### Page type selection framework

Decide which pages the system warrants autonomously. Document the reasoning in `modelling_notes`.

| Page type | When to include | When to skip |
|---|---|---|
| **C4 Architecture** | Always — every project needs this | Never |
| **Data Model** | System has persistent state (DB, files, cache) with ≥3 entities | Stateless services, thin wrappers, CLI tools with no storage |
| **Sequences** | ≥3 non-trivial flows that define how the system thinks | Simple request-response where C4 dynamic views suffice |
| **Documentation Map** | System is complex enough that structure alone doesn't convey understanding — non-obvious design principles, extension points, mental models | When C4 + sequences already provide full orientation |

**Dynamic views vs sequences page:** C4 dynamic views (on the architecture page) show specific features at a chosen abstraction level. The sequences page is the definitive behavioural reference. If the system only warrants one treatment, put flows on the C4 page as dynamic views and skip the sequences page. If flows are rich enough to deserve their own dedicated analysis with patterns, use the sequences page.

---

### Output directory structure

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

The HTML output from `atlas-ir-visual-translation` goes into the same output directory alongside the IR.

---

### Step 1 — Write atlas.yaml

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

Rendering decisions (scripts, styles, animation) belong in `atlas-ir-visual-translation` and the design system, NOT here.

---

### Step 2 — Model each page type

For each confirmed page type, produce a YAML file under `pages/` that conforms to its reference IR template. Work through the sections in zoom order — orientation first, then detail, then insight.

#### C4 Architecture

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
   - **Container descriptions must include architectural substance:** for each container, capture (a) the key architectural mechanism that makes it work, (b) one concrete detail that reveals how it actually operates, (c) what would surprise someone encountering it for the first time. "Manages messaging platform adapters" is skeleton — "Caches agent instances with LRU eviction and 1-hour idle TTL; normalises all 17 platform message formats to a common (text, media, metadata, chat_id) tuple before routing to the agent" is muscle.

3. **Components (L3)** — selective, one entry per container that warrants it
   - Only decompose containers where: ≥3 meaningful components exist AND they have architectural relationships worth diagramming
   - The sniff test: would a reader gain a sharper mental model than `ls` on the directory? If no, skip.

4. **Code (L4)** — almost never
   - Only when a specific design pattern is architecturally significant and can't be understood from L3

5. **Dynamic views** — the 3-5 flows that define the system
   - Can mix abstraction levels (systems, containers, components in one view)
   - Choose collaboration or sequence style per flow based on complexity
   - Include when the C4 page IS the primary behavioural reference (no separate sequences page)
   - **When a dedicated sequences page exists:** do NOT duplicate flows on the C4 page. The C4 page owns structure (context, containers, components, deployment). The sequences page owns behaviour. If you put dynamic views on C4 AND detailed sequences on the sequences page, you get duplication. Pick one home per flow.

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

#### Data Model

**Modelling procedure (zoom order):**

1. **Entity Map** — always present when this page exists
   - Names + relationships only. No fields, no types.
   - Show entities a human would name when describing the domain
   - Skip join tables, audit logs, migration tracking — infrastructure, not domain
   - **Entity descriptions MUST include concrete substance:** actual DDL columns for DB entities, actual JSON keys for file-based entities, actual directory structure for filesystem entities. "A conversation between a user and the agent" is skeleton — add the muscle: what fields exist, what makes this entity's shape architecturally interesting, what would surprise someone reading the schema for the first time.

2. **Domains** — when >~8 entities
   - Partition by bounded context / business capability, not by database schema
   - 2-6 domains typical. 1 = skip this section. 10+ = system might be multiple systems.
   - Cross-domain references as stubs, not full entities

3. **Schema Detail** — provide for ALL domains, not just the primary one
   - Full field-level for domains where the schema IS the architecture
   - Annotate architecturally significant fields: PKs, FKs, enums, JSON blobs, computed fields
   - Skip for trivial CRUD entities
   - **Depth target:** if the gold-standard description of an entity would include actual field names, DDL, JSON structure, or file format — the IR must too. The IR captures the muscle (concrete detail) not just the skeleton (abstract description).
   - For file-based entities: describe the actual file format, directory conventions, and key fields/sections.
   - For in-memory entities: describe the class/struct shape, key attributes, lifecycle.

4. **Wire Formats** — when containers exchange structured data
   - API payloads, event schemas, webhook bodies — data in flight, not at rest
   - Name producers and consumers
   - Include the normalised internal message format if the system has one (the canonical representation all adapters convert to/from)

5. **Config Structures** — when config structure IS the architecture
   - Include hierarchy/override order when it exists
   - List actual config sections and key fields, not just "YAML config"
   - Skip when config is a straightforward .env file

6. **Storage Topology** — when data spans multiple storage technologies
   - Physical reality behind the logical model
   - Skip for single-database systems

#### Sequences

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

#### Documentation Map

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

### Step 3 — Author Mermaid diagrams

Every `diagram:` path referenced in the IR gets a standalone `.mmd` file in `diagrams/`.

#### Diagram type conventions

| Content | Mermaid type | Notes |
|---|---|---|
| C4 context, containers, components | `graph TD` with `classDef` | NOT experimental C4 syntax (`C4Context`, etc.) — renders poorly |
| Sequence flows | `sequenceDiagram` | Mark key moments with `Note` |
| Entity relationships | `erDiagram` | Entity map: names only. Schema detail: include fields. |
| Class/interface relationships | `classDiagram` | For L4 code views |

#### C4 classDef palette

```mermaid
classDef actor fill:#d9770611,stroke:#d9770644,stroke-width:1.5px
classDef sys fill:#0d948822,stroke:#0d9488,stroke-width:2px
classDef ext fill:#0284c711,stroke:#0284c744,stroke-width:1.5px
classDef store fill:#8b5cf611,stroke:#8b5cf644,stroke-width:1.5px
```

Use `stroke-dasharray: 5 5` for planned/future components.

#### Diagram hygiene

- **Naming:** Kebab-case, descriptive. `context.mmd`, `containers.mmd`, `core-engine.mmd`, `entity-map.mmd`, `cli-message-flow.mmd`.
- **Edge labels (`graph TD` only):** Append `&ensp;` to prevent clipping (Mermaid v11 bug). Do NOT use `&ensp;` in `sequenceDiagram` — `<script type="text/plain">` blocks don't parse HTML entities, so `&ensp;` is sent literally to Mermaid and causes parse errors. The clipping hack is only for `graph TD` edge labels.
- **Disconnected subgraphs in LR mode:** Add invisible link `subA ~~~ subB` to force side-by-side.
- **Node labels:** Use `["Label<br/><small>Description</small>"]` for `graph TD` nodes only.
- **No `<br/>` in sequenceDiagram.** `<br/>` is valid in `graph TD` node labels (HTML-like formatting) but causes parse errors in `sequenceDiagram` arrow labels and notes. Mermaid sequence diagrams use `\n` for line breaks inside labels, not HTML. First test failure: all 5 sequence diagrams had `<br/>` in arrow labels and failed to render.
- **Keep diagrams readable.** If a diagram exceeds ~15 nodes, split it and document the split rationale in the IR.

---

### Step 4 — Populate refs.json

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

### Step 5 — Write modelling notes

Every page YAML MUST include a non-empty `modelling_notes` section. This is the diagnostic trail — NOT rendered into the atlas.

Document:
- Why pages were included or excluded
- Why containers were decomposed or skipped for L3
- Why specific flows were selected over others
- Why domains were partitioned a certain way
- Any close-call structural judgments

**These notes answer "why does the IR look like this?"** When `atlas-ir-visual-translation` produces wrong output, modelling notes help isolate whether the IR was wrong or the rendering was wrong.

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

### Source ingest
- **Don't serialise parallel reads.** The cold start pass touches dozens of files — batch them. This is the single biggest efficiency win.
- **Don't read every file.** The goal is structural understanding, not line-by-line familiarity. Read entry points, schemas, configs, and READMEs. Skim directory structure. Skip test files, generated code, vendored dependencies.
- **Don't produce an intermediate artifact.** Phase 1 loads context for phase 2 in the same window. If you find yourself writing a "discovery report" to disk, stop.
- **Don't re-derive what the IR already knows (delta/PR modes).** Read the IR first. It's the baseline. Only analyse what changed.
- **Don't treat every code change as architecturally significant (PR mode).** Most changes are IR-invisible. The skill's value in PR mode is triage — quickly identifying whether the architecture is affected.
- **Don't guess the mode.** If it's unclear whether IR exists or what state it's in, check the filesystem. If it's ambiguous whether this is a general update or PR review, ask.

### IR production
- **Don't include rendering hints in the IR.** No "render as card", no "use 3-column grid", no colour preferences. Domain language only. If you're typing a CSS class name or HTML element, stop.
- **Don't duplicate content across pages.** Dynamic views (C4 page) and sequences (sequences page) serve different purposes. If the system only warrants one treatment, choose one home and skip the other.
- **Enforce concept ownership.** Each concept should have ONE primary home across all pages. Other pages reference it with a one-line description and a cross-reference, not a full re-description at equal depth. Track this mentally: "which page OWNS this concept?"
- **Don't model everything.** The IR captures what's architecturally significant, not a comprehensive dump. Every section has a "when to skip" — use it.
- **Don't skip modelling notes.** They're the diagnostic seam between understanding and rendering.
- **Don't invent IR vocabulary.** If a concept isn't in the reference IR for its page type, it doesn't belong or the reference IR needs extending (deliberately, not ad-hoc).
- **Don't forget technology at L2.** Context (L1) = intent only. Containers (L2) = technology + protocol. This is C4's rule.
- **Don't treat every entity as architecturally significant.** Entity map shows what a human would name when describing the domain. Infrastructure entities → skip.
- **Don't confuse containers with components.** A container is a runtime boundary (separately deployable). A component is a grouping within a container (same process). When in doubt: "does this need to be running?"
- **Don't over-decompose.** L3 is selective. L4 is almost never. The atlas is for orientation, not code-level detail. IDEs do L4 better.
- **Don't forget cross-page name consistency.** If the C4 page calls it "Core Engine", every other page must use the same name. Build a glossary mentally and stick to it.
- **Don't use `<br/>` or `&ensp;` in sequence diagrams.** `<br/>` and `&ensp;` are valid in `graph TD` node/edge labels but cause parse errors in `sequenceDiagram`. Sequence diagram labels are plain text — no HTML. This broke all 5 sequence diagrams in the first test.

### Pipeline discipline
- **Don't stop to ask mid-pipeline.** The only user checkpoint is the invocation confirmation at the start. After that, the pipeline runs autonomously: ingest → model → render. Structural judgments go in `modelling_notes`, not in messages asking "agree?"

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
- [ ] **Proceed to visual translation:** IR is complete — pass control to `atlas-ir-visual-translation` in the same context window.
