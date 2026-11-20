Rules that keep an atlas a helicopter view and prevent drift into dense-docs territory. See [abstract](abstract.md) for context.

---

## The rules

1. **Orienting prose, not essays.** Metaphors, reading-key principles, key-insight callouts, 1-sentence framing paragraphs are encouraged. No paragraph longer than 3 lines.
2. **If it's not on a diagram or supporting a diagram, it doesn't belong.** Prose annotates or orients; it never substitutes.
3. **Decisions stay in `decisions/`.** A short list of design *principles* (reading keys that change how you parse the diagrams) belongs on the documentation-map page. Full rationale goes in `decisions/NNN-*.md`.
4. **Gotchas stay elsewhere.** Build commands, conventions, "watch out for X" → `CONTEXT.md` or project docs. Not in the atlas.
5. **One page per concern.** Multiple diagrams per page is fine — they're organized by what they explain together, not one-diagram-per-file.
6. **Section IDs are semantic.** Every section gets a stable kebab-case `id` (e.g. `#tool-system`, `#agent-loop`) so other pages can deep-link to it. No opaque IDs like `#s0`.

---

## Time budgets

Design targets for the artifact. If these can't be hit, the atlas needs pruning:

- **Each page:** scannable in ~2 minutes
- **Whole atlas:** traversable in ~10 minutes
- **Returning after >1 month:** re-orientation complete in ~15 minutes

---

## Redirection table

When tempted to add something to the atlas, check this first:

| Tempted to add... | Actual home |
|---|---|
| "We chose Postgres because..." | `decisions/NNN-*.md` |
| "Watch out — this service silently retries" | `CONTEXT.md` |
| "Build with `just build`, test with `just test`" | `CONTEXT.md` |
| "Here's the migration history" | `decisions/` if notable; otherwise just the code |
| "Here's the full API surface" | The code / OpenAPI spec — not the atlas |
| "Here's the naming convention" | `CONTEXT.md` |
| "Here's what we're working on next" | `specs/NNN-*.md` |
| Any paragraph longer than 3 lines | Trim it or move it |

The test: *does this help someone build a mental model of the shape, or does it help someone do day-to-day work?* Shape → atlas. Work → elsewhere.

---

## What orienting prose looks like (examples from hermes-architecture)

Good — builds a mental model fast:
> "Think of Hermes as a switchboard operator."

Good — corrects a likely wrong assumption:
> "Hermes is NOT a monolith with 16 messaging integrations. It's a single agent loop with a pluggable front door and a pluggable toolkit."

Good — reading key that changes how you parse every diagram afterward:
> "Prompt cache preservation is a first-class architectural concern."

Bad — this is a decision log entry, not an orienting statement:
> "We evaluated Redis, Memcached, and SQLite. SQLite won because it avoids an external dependency and WAL mode handles our concurrency needs."

Bad — this is a gotcha:
> "The cron scheduler uses BEGIN IMMEDIATE transactions with jitter retry (15 retries, 20–150ms random sleep) to avoid write contention."
