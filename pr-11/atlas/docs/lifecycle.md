How an atlas comes into being, gets maintained, and when it's reviewed. See [abstract](abstract.md) for context.

---

## Genesis — how it's first produced

Differs by mode, because the starting material differs. In both cases, the agent produces HTML directly — no intermediate markdown. The design system assets (CSS/JS) are carried via a `base/` git submodule pointing at `yoniebans.github.io`; the HTML pages are authored from scratch using the reference as in-context learning.

### Greenfield

The atlas grows alongside the system, not before or after.

1. **Brain dump → spec** produces the first version of the system-architecture page — external actors and system boundary are usually clear from the spec.
2. **First spec execution** adds the container view — once you commit to services/deployables, diagram them.
3. **Data-model, flows, documentation-map pages** get added as those shapes stabilize. Drawing them too early is premature — you'll redraw them repeatedly.
4. **By the time the first release lands,** the atlas should be complete. If it isn't, the system probably has undeclared structure that no one has named yet.

The agent drafts pages as structure emerges, shows them to the user for browser review, and updates them as specs land.

### Brownfield

The atlas is reverse-engineered before any other work happens.

Three-way split of where content comes from:

**Agent produces from static analysis:**

- System-architecture page (L1 + L2) — from entry points, public APIs, `docker-compose.yml`, k8s manifests, monorepo boundaries, service configs
- Data-model page — from ORM models, schema files, migrations, Prisma/SQLAlchemy/Django, protobuf definitions
- Deployment section — from IaC (Terraform, Pulumi, CDK), k8s manifests, CI/CD configs

**Agent drafts, user confirms:**

- L3 components — agent proposes the internal component split, user confirms which ones matter at helicopter view vs which are noise
- Interaction sequences — agent enumerates endpoints and traces call graphs, but "which flows *define* this system" is a judgment call. Agent proposes candidates, user picks the short list, agent traces each
- Documentation-map page — agent proposes which design principles and extension points are worth surfacing, user confirms

**Agent asks, user supplies:**

- External actors the code doesn't reveal (humans, third-party systems that send webhooks, scheduled jobs whose source isn't in this repo)
- Which container is "primary" vs auxiliary (affects L2 layout)
- Planned/imminent architecture changes that should be reflected vs ignored

### The interview pattern (brownfield)

Questions asked in batches, not one-at-a-time. Each includes what the agent already inferred so the user confirms or corrects — not originates:

> "I see three containers in docker-compose: `api`, `worker`, `redis`. Is `redis` worth showing on the system-architecture page, or is it infrastructure-level and belongs only in deployment?"
>
> "I traced these flows from the handler files: signup, login, password-reset, checkout, webhook-in, webhook-out, admin-impersonate. Which 3–5 of these define how the system thinks?"

User answers in plain language. Agent writes the pages. User reviews in browser. Iterate.

### Docs-only variant (no code access)

When the project has requirement docs, specs, or design documents but no codebase:

- Skip static analysis — there's nothing to inspect
- The interview becomes the primary work: ingest all documents, synthesize the system shape, then propose the atlas plan with batched questions
- Mark planned/unreleased features inline (e.g. "(planned)")
- `deployment.md` section can be skipped when no infra info exists

---

## Authoring model

The agent produces HTML directly. No markdown intermediate, no build step.

**Inputs the agent uses:**
1. The atlas docs (this file + [structure](structure.md) + [discipline](discipline.md)) — what to produce, rules
2. The design system assets via the `base/` submodule — CSS/JS referenced as `base/styles.css`, etc.
3. The reference example's HTML pages — in-context learning for structure, voice, component patterns
4. Static analysis / documents / user interview answers — the actual content

**Process:**
1. Agent adds a `base/` git submodule pointing at `yoniebans.github.io` (or updates it if it exists)
2. Agent produces each HTML page, referencing `base/styles.css`, `base/mermaid-zoom.js`, etc.
3. Agent populates `refs.js` with concept → repo path mappings
4. Agent adds `data-ref` attributes to code chips that reference repo concepts
5. User reviews each page in browser, agent patches based on feedback

---

## Maintenance

Touched **only when structure changes**:

- A new container added or an existing one removed
- A new major flow that defines the system
- A schema migration that changes the *relational shape* (new entity type, new relationship — not a new column)
- A deployment topology change (moved to a new platform, added a new region, etc.)

Routine feature work does **not** touch the atlas. A new endpoint inside an existing container doesn't rate; a new integration that adds an external actor does.

The agent is responsible for proposing atlas updates whenever a spec lands that changes structure. The user approves or rejects the proposed diff.

---

## Review

On returning to a project after >1 month away: open the atlas in a browser, read it cold, then spot-check against the code.

- Pages still feel accurate → re-orientation complete, proceed with work.
- Something surprises you → the atlas drifted. Stop, fix it, *then* proceed.

An honest snapshot is worth more than a precise but stale one. The goal isn't real-time accuracy; it's trustworthiness as a mental model.

---

## Open questions

### Multi-repo projects

An atlas for a system that spans multiple repos — does it live in one of them, in a meta-repo, or independently? Leaning toward a standalone repo per atlas. Confirm when the case arises.
