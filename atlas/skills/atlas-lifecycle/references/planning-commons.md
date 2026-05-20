---
name: atlas-planning-commons
description: "Author a single, disposable, dated planning commons page for a specific question or proposed change. Same design system as the atlas, but the artifact is a per-topic page, not canonical documentation."
---

# Planning commons

**When:** "Make me a planning commons for X", "visualise the scope of this change",
"before/after for this proposal", or any time a single visual page would compress
an hour of discussion into a glance.

**Output:** One HTML file at `/mnt/hermes/workspace/<repo>/YYYYMMDD-<topic>.html`.

**Not canonical.** This is disposable. When the work ships, insights graduate to
the atlas via drift detection or manual update. The forward-links section on the
page lists which atlas pages would update.

---

## Two modes

**Overview** — single-state diagram of the system in scope. "What are we touching?"
Template: `templates/overview.html`

**Before/after** — proposed change shown as two diagrams. "What changes?"
Template: `templates/before-after.html`

---

## Procedure

### Step 0 — Confirm scope

1. **Repo/topic** — which `<repo>` directory?
2. **Mode** — overview or before-after?
3. **The one question this page answers** — one sentence. If the user can't state
   it in one sentence, the question isn't tight enough. Push back.

### Step 1 — Pre-flight reads

```
1. atlas/docs/discipline.md                                 (≤1 min)
2. atlas/docs/structure.md (skim, page anatomy)             (≤1 min)
3. references/design-system.md                              (≤3 min)
4. The matching template in templates/                      (≤1 min)
```

### Step 2 — Articulate page essence

- The one question (becomes the page subtitle)
- The mental model the reader walks away with (quality bar)
- Concepts this page owns (flat list)
- What's intentionally out of scope

### Step 3 — Author the page

Read the template once, then write the full page via `write_file`. One write.

**Design system loading:** Workspace pages load assets live from
`https://yoniebans.github.io/styles.css` etc. No `base/` submodule needed.

**No `data-ref`/`refs.js`/`enhancer.js`.** This is throwaway. Use plain
`<a href="https://github.com/...">` for code links.

#### Before/after highlight pattern

In the "After" diagram, use `classDef` conventions:
```
classDef new fill:#10b98122,stroke:#10b981,stroke-width:2px
classDef removed fill:#ef444411,stroke:#ef444466,stroke-width:1.5px,stroke-dasharray:5 5
classDef modified fill:#f59e0b22,stroke:#f59e0b,stroke-width:2px
classDef stable fill:#0284c711,stroke:#0284c744,stroke-width:1.5px
```

### Step 4 — Self-verify

1. Does the lead paragraph state the one question?
2. Does the diagram carry the load? (Prose supports, doesn't replace.)
3. Discipline: ≤3-line paragraphs? No decisions? No how-to?
4. Forward-links section lists atlas pages that would update?

### Step 5 — Review with user

Open in browser. Iterate via `patch`.

---

## After the work ships

1. Graduate insights to the atlas (drift detection or manual update)
2. Update forward-links to point at actual atlas updates
3. Archive or delete — don't promote to a canonical location

---

## Pitfalls

- Don't make it multi-page — that's an atlas. Use genesis instead.
- Don't skip the essence step — without it, the page becomes a dump.
- Don't duplicate atlas content — link to it via forward-links.
- Don't put implementation detail in diagrams — shape only.
- `base/` loaded live from yoniebans.github.io — no internet = no styling.
