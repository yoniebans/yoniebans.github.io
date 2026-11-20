---
id: 002
title: DESIGN.md Integration — Swappable Visual Contracts for Skill 2
status: draft
created: 2026-04-24
author: morpheus
depends_on: 001
---

# DESIGN.md Integration — Swappable Visual Contracts for Skill 2

## Problem

Skill 2 (IR → HTML) currently has one implicit visual vocabulary: the `yoniebans.github.io` design system (`styles.css`, component patterns from `hermes-architecture`). Every atlas looks the same. The visual identity is hardcoded into the rendering skill rather than being an input to it.

This means:
- **No aesthetic flexibility.** A dark technical atlas and a client-facing atlas share the same palette, typography, and feel.
- **No project identity.** Each atlas could have its own visual personality, but there's no mechanism to express one.
- **Tight coupling.** Skill 2 guidance intermixes structural patterns (how to lay out a C4 page) with visual tokens (which colors, which fonts). Changing the look requires changing the skill.

Google's DESIGN.md specification (v0.1.0 alpha, April 2026) provides a standardised, agent-readable format for expressing a complete visual identity as a single markdown file. It's the missing input to Skill 2.

## The DESIGN.md Specification

Source: `google-labs-code/design.md` on GitHub. Apache-2.0. Tooling: `@google/design.md` npm package (lint, diff, export to Tailwind/DTCG/CSS custom properties). Generator: `stitch.withgoogle.com`.

### Structure

Two parts:
1. **YAML frontmatter** — machine-readable design tokens (normative)
2. **Markdown body** — human-readable design rationale with `##` sections (contextual)

### Token Schema

```yaml
version: "alpha"
name: "Project Name"
description: "Optional"

colors:
  primary: "#1A1C1E"
  secondary: "#4A4458"
  tertiary: "#B8422E"
  neutral: "#767680"
  surface: "#FFFBFF"
  onPrimary: "#FFFFFF"
  # extensible — unknown token names accepted if values are valid

typography:
  display:
    fontFamily: "Fraunces"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: "Fraunces"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Public Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.04em

rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px

components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  # actively evolving — not yet stable
```

### Value Types

| Type | Format | Example |
|---|---|---|
| Color | `#` + hex (sRGB) | `"#1A1C1E"` |
| Dimension | number + unit | `48px`, `-0.02em`, `1rem` |
| Token reference | `{path.to.token}` | `{colors.primary}` |
| Typography | composite object | fontFamily, fontSize, fontWeight, lineHeight, letterSpacing |

### Agent Consumption Rules

- Tokens are **normative** — use exact values from YAML frontmatter.
- Prose provides **context** — when tokens don't cover a case, agents use the markdown body for intent/reasoning.
- Unknown token names are accepted if values are valid. Unknown component properties accepted with warning. Duplicate section headings are an error.

### Markdown Body Sections (all optional, order preserved)

1. **Overview** — brand personality, emotional tone
2. **Colors** — palette rationale
3. **Typography** — type scale rationale
4. **Layout** — grid, margins, spacing strategy
5. **Elevation & Depth** — shadows, layers
6. **Shapes** — corner radii, shape language
7. **Components** — component-level guidance (evolving)
8. **Do's and Don'ts** — guardrails (e.g. WCAG AA)

## Where DESIGN.md Fits in the Pipeline

Spec 001 defines four constituent parts:

```
Skill 1 → IR → Skill 2 → HTML
```

DESIGN.md becomes an **input to Skill 2**, alongside the IR:

```
                     ┌─────────────┐
Skill 1 → IR YAML ──┤             │
                     │   Skill 2   ├──→ HTML
DESIGN.md ───────────┤             │
                     └─────────────┘
```

The IR provides **what to say** (domain concepts, structural relationships, significance). The DESIGN.md provides **how it should feel** (palette, typography, spacing, shape language, brand rationale).

Skill 2 maps domain concepts to visual components, styling those components with DESIGN.md tokens.

## The Two-Layer Model

The current design system conflates two concerns:

1. **Structural patterns** — how atlas content is laid out (diagram shells, zoom controls, TOC, page navigation, card grids, section headers, KPI rows, pipelines)
2. **Visual tokens** — how it looks (colors, fonts, spacing, border radii, shadows)

These must be separated:

### Layer 1: Atlas Component Library (structural)

Layout patterns that are specific to atlas pages. These don't change when you swap a DESIGN.md — they define _what components exist_ and _how they're arranged_.

| Component | Role |
|---|---|
| `.diagram-shell` | Mermaid diagram container with zoom/pan/fullscreen |
| `.mermaid-wrap` / `.mermaid-viewport` | Diagram rendering viewport |
| `.zoom-controls` | Zoom in/out/fit/1:1/expand buttons |
| `.wrap` / `.main` / `.toc` | Page grid: sidebar + content |
| `.toc-page` | Multi-page navigation with collapse |
| `.sec-head` | Section header with colored dot |
| `.ve-card` | Primary content card (hero, recessed variants) |
| `.kpi-row` / `.kpi-card` | Numeric stats display |
| `.grid-2` / `.grid-3` / `.grid-4` / `.card-grid` | Responsive grid layouts |
| `.pipeline` / `.pipeline-step` | Sequential flow visualization |
| `.schema-table` | Data model table with typed column badges |
| `.callout` | Key insight highlight |
| `.principle` | Numbered design principle |
| `.quadrant-grid` | Diátaxis 2×2 layout |
| `.companion-grid` | Cross-page navigation footer |
| `.ref-link` | Source code deep links |
| `.collapsible` | Expandable detail sections |

These components consume tokens but don't define them. A `.ve-card` has a background color, border radius, and font — but _which_ background color, _which_ radius, _which_ font comes from the DESIGN.md.

### Layer 2: DESIGN.md (visual identity)

The token layer that gives each atlas its personality. Swapping the DESIGN.md changes:

- Color palette — primary, secondary, tertiary, neutral, surface
- Typography — display, heading, body, label font families + scales
- Spacing — component gaps, section margins, card padding
- Shape language — border radii, whether the aesthetic is sharp or soft
- Elevation — shadow depth, layering strategy
- Brand rationale — the _why_ behind visual choices, used by the agent when making judgment calls Skill 2 doesn't explicitly cover

### How Tokens Flow Into Components

The atlas component library defines CSS custom properties as its interface. The DESIGN.md tokens are mapped onto these properties. Skill 2 does the mapping.

```
DESIGN.md tokens          CSS custom properties          Components
─────────────────         ────────────────────           ──────────
colors.primary       →    --accent                  →    .sec-head .dot
colors.tertiary      →    --accent-alt              →    .ve-card hover
colors.surface       →    --bg                      →    body, .ve-card
colors.neutral       →    --text-dim                →    .subtitle, .label
typography.display   →    --font-display            →    h1
typography.body      →    --font-body               →    p, .lead, cards
typography.label     →    --font-mono               →    .ve-card__label
rounded.md           →    --radius                  →    .ve-card, .tag
spacing.md           →    --gap                     →    .grid-*, .pipeline
```

This is not a 1:1 mechanical mapping. Skill 2 exercises judgment:

- A DESIGN.md with 6 color tokens maps onto a system that uses 8+ semantic colors. Skill 2 derives the missing ones (dim variants, status colors, Diátaxis quadrant colors) from the provided palette, guided by the prose rationale.
- A DESIGN.md with "warm editorial" personality might lead Skill 2 to use serif fonts in diagram annotations where the default would use monospace.
- A "brutalist" DESIGN.md with high-contrast tokens might lead Skill 2 to eliminate subtle shadows and use hard borders instead.

The prose sections (Overview, Do's and Don'ts) inform these judgment calls.

## Token Mapping: IR Domain Concepts → Visual Treatment

The IR defines domain values that carry visual rendering implications. Skill 2 maps these to treatments styled by DESIGN.md tokens.

### Semantic Color Assignments

The current system uses 8 fixed semantic colors. With DESIGN.md, these derive from the palette:

| IR Concept | Current Fixed Color | DESIGN.md Derivation |
|---|---|---|
| Internal systems/containers | `--accent` (teal) | `colors.primary` |
| External systems | `--c-slate` | `colors.neutral` at reduced opacity |
| Datastores | `--c-indigo` | `colors.secondary` |
| Problems / danger | `--c-rose` | Derived warm complement of `colors.primary` |
| Success / positive | `--c-emerald` | Derived cool complement or `colors.tertiary` |
| Warnings / caution | `--c-amber` | Derived mid-tone from palette |
| Key moments (sequences) | `--accent` | `colors.tertiary` |
| Significance: high | Full opacity | Token color at full weight |
| Significance: low | Dim variant | Token color at reduced opacity or neutral |

The agent derives a full semantic palette from the DESIGN.md's typically 6 color tokens. The prose section ("Colors") provides guidance on which roles different colors were intended to fill.

### Typography Mapping

| IR Context | Design System Role | DESIGN.md Token |
|---|---|---|
| Page title | `h1` | `typography.display` |
| Section headers | `h2`, `.sec-head` | `typography.h1` |
| Card labels | `.ve-card__label` | `typography.label` |
| Body text, annotations | `p`, `.lead` | `typography.body` |
| Code chips, refs | `code`, `.ref-link` | Monospace (agent selects; DESIGN.md may specify via label or component tokens) |
| Diagram node labels | Mermaid `classDef` | `typography.label` font at appropriate size |
| KPI values | `.kpi-card__value` | `typography.display` at large size |

### Shape and Elevation

| Component | DESIGN.md Influence |
|---|---|
| `.ve-card` border radius | `rounded.md` or `rounded.lg` depending on brand language |
| `.tag` border radius | `rounded.full` for pill tags, `rounded.sm` for sharp tags |
| Card shadows | Elevation section defines depth; "flat" designs eliminate shadows |
| `.diagram-shell` | Inherits surface color + border radius from tokens |

## Mermaid Diagram Theming

DESIGN.md tokens should propagate into Mermaid `themeVariables` for visual consistency:

```javascript
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '/* from colors.primary */',
    primaryTextColor: '/* from colors.onPrimary */',
    primaryBorderColor: '/* derived from primary */',
    secondaryColor: '/* from colors.secondary */',
    tertiaryColor: '/* from colors.tertiary */',
    lineColor: '/* from colors.neutral */',
    textColor: '/* from colors.primary or surface contrast */',
    fontFamily: '/* from typography.body.fontFamily */',
    fontSize: '/* from typography.label.fontSize */',
  }
});
```

Plus `classDef` overrides in each diagram for domain-specific node styling (actors, systems, datastores) derived from the semantic color assignments.

## Dark Mode

The DESIGN.md spec (v0.1.0 alpha) does not yet support dark/light theme switching. Our atlas component library already does (`prefers-color-scheme` + `data-theme` toggle).

Pragmatic approach:
- A DESIGN.md is either light or dark (determined by surface vs. primary contrast).
- Skill 2 detects the mode from token values and generates the appropriate `themeVariables`.
- If the user wants both modes, they provide two DESIGN.md files (e.g. `DESIGN.md` and `DESIGN-dark.md`), or a single file with a convention we define for dual palettes.
- The atlas component library's theme toggle wires up the alternate palette at runtime.

This is an area where the Google spec will likely evolve. Design for single-mode now, extend later.

## File Layout

```
atlas/
├── atlas.yaml              # root manifest (from spec 001)
├── DESIGN.md               # visual identity (this spec)
├── pages/
│   ├── c4-architecture.yaml
│   ├── data-model.yaml
│   ├── sequences.yaml
│   └── documentation-map.yaml
├── diagrams/
│   └── *.mmd
└── refs.json
```

The DESIGN.md sits alongside `atlas.yaml` as a peer input. It's versioned with the atlas. Different branches or forks can carry different DESIGN.md files for variant renderings of the same structural truth.

## Skill 2 Implications

Skill 2 guidance must be restructured into:

### 2a — Structural Rendering (page-type specific)

How to map IR domain concepts to atlas components. Per-page-type guidance:
- C4 page: containers → `.ve-card`, context → diagram, components → inner cards or grid
- Data model: entities → `.schema-table`, domains → section grouping, topology → diagram
- Sequences: flows → diagrams, participants → cards, key moments → highlights
- Documentation map: quadrants → `.quadrant-grid`, principles → `.principle` cards

This guidance is **DESIGN.md-agnostic** — it's about _what_ components to use, not _how_ they look.

### 2b — Visual Application (DESIGN.md-driven)

How to translate DESIGN.md tokens into the CSS custom property layer:
1. Parse YAML frontmatter → extract token values
2. Derive semantic palette from color tokens + prose rationale
3. Map typography tokens to font stacks
4. Generate CSS custom properties block
5. Configure Mermaid `themeVariables`
6. Apply shape/elevation tokens to component variants

This guidance is **page-type-agnostic** — it's about _how_ things look, not _what_ things are shown.

### 2c — Judgment Calls (where both layers meet)

The intersection where Skill 2 exercises creative latitude:
- A "minimal" DESIGN.md might lead to simpler card layouts (fewer nested inner-cards)
- A "bold" DESIGN.md might lead to more aggressive use of KPI-style large numbers
- A "warm editorial" DESIGN.md might favor `.lead` prose intros over jump-to-diagram layouts
- The Do's and Don'ts section constrains choices (e.g. "never use more than 3 colors in a single view")

## Default Behavior

When no DESIGN.md is provided, Skill 2 falls back to the current `yoniebans.github.io` design system tokens — effectively an implicit DESIGN.md that matches the existing look. This maintains backward compatibility. No atlas breaks.

We should extract the current design system's tokens into an explicit `DESIGN.md` as the canonical default. This also serves as documentation of the existing visual identity.

## Relationship to Existing Specs and Tools

| Thing | Relationship |
|---|---|
| **Spec 001 (IR Protocol)** | 002 adds a second input to Skill 2. The IR flow is unchanged. |
| **atlas-site build tool** | Currently generates HTML from markdown with hardcoded styles. Could consume DESIGN.md to generate themed output. Convergence candidate. |
| **brownfield-atlas-genesis** | Interview step could ask "do you have a DESIGN.md or want to pick one?" before Skill 2 runs. |
| **atlas-drift-detection** | DESIGN.md changes don't constitute structural drift — they're visual, not architectural. Drift detection operates on IR, not tokens. |
| **Output adapters** (tweet, diff, agent context) | Each adapter can consume the same DESIGN.md for visual consistency across formats. |
| **Google DESIGN.md CLI** | `@google/design.md` provides lint, diff, and export to CSS custom properties. Export to CSS is directly useful — could feed the token mapping step. |

## Migration Path

1. **Extract current tokens.** Write an explicit `DESIGN.md` that captures the existing `yoniebans.github.io` design system. This becomes the default.
2. **Write Skill 2 with DESIGN.md awareness.** Skill 2 guidance includes both structural rendering (2a) and visual application (2b). When a DESIGN.md is present, use it. When absent, use the default.
3. **Refactor `styles.css`.** Separate structural patterns (component layout) from visual tokens (colors, fonts, spacing) using CSS custom properties as the interface layer. Structural styles reference properties; a generated `:root` block provides the values.
4. **Test with contrasting designs.** Render the same IR through 2-3 very different DESIGN.md files (e.g. "Vercel Ink" dark minimal, "Heritage" warm editorial, "Brutalist Office" high-contrast). Visual character should change dramatically; structural quality should not.
5. **Integrate into brownfield-atlas-genesis.** Add DESIGN.md selection to the interview step.

## Open Questions

1. **DESIGN.md per-project or per-atlas?** A project could have one visual identity across all its atlases, or each atlas could have its own. Current leaning: per-atlas (it sits in the atlas directory), with a project-level default that can be overridden.

2. **Deriving a full semantic palette from 6 tokens.** The DESIGN.md spec provides ~6 color tokens. Our system uses 8+ semantic colors plus dim variants, status colors, and Diátaxis quadrant colors. The derivation logic needs to be robust — possibly using `color-mix()` in CSS or explicit agent reasoning. Should this be deterministic (algorithm) or agentic (Skill 2 judgment)?

3. **Component tokens.** The DESIGN.md components section is "actively evolving." Our atlas components (diagram shells, schema tables, KPI rows) are far more specialized than the spec's generic button/input/card tokens. Do we extend the components section with atlas-specific tokens, or keep the DESIGN.md pure (standard tokens only) and let Skill 2 derive component styling from primitives?

4. **CSS custom properties as the interface.** Refactoring `styles.css` to use custom properties everywhere is a prerequisite. How invasive is this? The current stylesheet uses hardcoded values. This is a meaningful refactor — scope it before committing.

5. **Google spec evolution.** The spec is alpha. Dark mode, responsive tokens, animation tokens are likely coming. How tightly do we couple? Current leaning: consume what exists, don't depend on what's promised.
