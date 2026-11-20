# Results / value-prop companion page

A pattern for projects that have been through a long investigation: author a **second page** next to the investigation `index.html` whose job is *value-prop*, not *record*. Same design system, very different reading contract.

**When to use this pattern:**

- The investigation page (`index.html`) has grown past ~10 sections.
- A new reader landing on the investigation has to read 30+ minutes of prose before understanding why they should care.
- The user has asked for "something to present" or "the conclusion as a separate doc".
- The work has produced measurable results (a test, a benchmark, a comparison) that deserve to be the front door, not section §6.5 of a deeper page.

**The contract is different:**

| | Investigation page | Results page |
|---|---|---|
| Audience | Future-you, technical reviewer, "I need depth" | Someone who's never used the thing |
| Reading time | 10-30 min, depth-first | 60 seconds for the gist, 5 min for the full pass |
| Tone | Honest record of what was tried, what failed, what landed | Sparse, matter-of-fact, value-first |
| Visuals | In service of the argument | Carry the whole argument; prose is annotation |
| Structure | Chronological / investigative | Inverted-pyramid: takeaway first, evidence behind |

The two pages co-exist in the same `spikes/<topic>/` (or atlas) directory. They cross-reference each other through the shared TOC — results goes first, investigation second, with a "Read the deep-dive →" footer link on the results page.

---

## Page structure that worked (6 sections + 5 visuals)

This is the shape that landed in May 2026 for `spikes/session-search-modes/results.html`, refined through three vision-audit cycles + a user-flagged structural gap. Treat it as the default scaffolding; deviate only with reason.

```
0. OPENER          One-sentence value-prop + 3-4 KPI cards.
                   This is the 5-second read for a skimmer.

1. INTRODUCTION    *** Don't skip this — first draft did, user caught. ***
                   The "what was wrong before" + "what the new thing is"
                   framing. Two side-by-side cards:
                   - LEFT: the problem (2-3 short paragraphs, one bold
                     punchline sentence).
                   - RIGHT: the new concepts defined (e.g. 3 mode rows
                     with name+role+one-line behaviour), then the
                     MECHANISM DIAGRAM (per-mode pipeline columns
                     showing what each mode actually DOES — see "§1
                     Mechanism diagram" subsection below), then the
                     interplay diagram showing how they connect.

                   Without this, the analytical sections that follow
                   parade facts about unnamed terms — readers learn
                   what fast/summary/guided ARE only by inference from
                   the cost charts. New readers will not have built the
                   model before the charts start.

                   Not numbered (it's preamble), but takes a sec-head
                   like "THE PROBLEM, AND WHAT WE BUILT".

2. MECHANISM       The single visual that makes the thing click.
                   Usually a comparison: old-way vs new-way, or
                   side-by-side timeline of modes/configurations.
                   This visual is what someone will screenshot
                   when they advocate for the work in chat.

3. USE-CASE MENU   Comparison table — what kind of question/input
                   pulls which behaviour. Reads like a menu, not
                   a documentation table. 3 rows is ideal.

4. DATA RETURNED   What comes back from each mode/configuration.
                   Often missed in the first draft (the user will ask
                   for it explicitly). Three side-by-side payload cards
                   showing concrete response anatomy + a breadth-vs-depth
                   axis + a tunable-parameters reference grid.

                   See "§4 Data returned" subsection below for the
                   detailed authoring pattern — this section
                   consistently lands as the most concrete "I get it
                   now" moment for new readers because it shows the
                   ACTUAL bytes returned, not abstract claims about them.

5. QUALITATIVE     Search/quality/honesty improvements that don't
                   show up in cost numbers. A 2x2 or before/after
                   pair works well. Real abstracted example,
                   not synthetic.

6. QUANTITATIVE    The cost picture. Stacked bar chart by
                   pattern/mode/configuration. Numbers from the
                   actual test run, presented as ranges or medians
                   (not specific scenario IDs).

7. BOTTOM LINE     Three bullets + one config line for "how to try
                   it" + deep-dive footer link.
```

### The interplay diagram inside §1

The introduction section's secondary visual is an "interplay diagram" — a small grouped flow showing how the new concepts connect. Two failure modes the May 2026 trace hit:

1. **Parallel rows read as parallel options.** First draft showed three rows: `question → fast`, `question → summary`, `question → fast → guided`. All starting with the same `question →` cell, the eye reads them as three equal alternatives — not as "two entry points, one of which has a continuation".

2. **The caption did the work the diagram should have.** The tail text said "two ways to start, one way to follow up" but the diagram itself didn't visually encode that distinction.

**The pattern that worked:** two visually grouped blocks with their own labels — "TWO STARTING MOVES" (containing `question → fast` and `question → summary`) and "ONE FOLLOW-UP MOVE" (containing `fast → guided` and `summary → guided`, with a left-accent border in the follow-up mode's color). The grouping carries the structural argument; the caption only adds nuance.

---

## What to deliberately leave OUT

These all live in the investigation page; including them on the results page makes it feel like the report-of-record, which is the wrong contract.

- Test methodology, scenario IDs, sample sizes
- Pair-resolution regression / branch-merge concerns (engineering-internal)
- Edge cases, footguns, retrieval quirks (live in the investigation's §9 followups)
- Spec-author bugs caught at gates during the dry-run
- Prompt scaffolding details that are interesting to power users but not core
- Anything that opens with "we considered X but rejected Y"

If you're tempted to add one, ask: "is this part of the value-prop, or part of the evidence behind the value-prop?" Evidence → investigation page.

---

## Page-local CSS budget

The results page typically needs 6 page-local visualisations the base design system doesn't ship:

1. **Stacked timeline tracks** — multiple modes/configurations on one clock, with segments for tool calls, thinking, aux LLM work
2. **Comparison menu** — grid-template-columns with question shape / mode / time / cost columns
3. **Quadrant grid (2x2)** — for confidence × evidence or speed × quality failure-mode diagrams
4. **Stacked horizontal bar chart** — for cost-by-mode showing main + aux
5. **Mechanism diagram** — per-mode pipeline columns showing step-by-step what each mode DOES (FTS5 / FETCH / AUX LLM / RETURN). Live steps are full-height bordered boxes; skipped steps are thin grey single-line rows. Column height visually encodes "work done" — but ONLY if the grid is configured to allow it (see pitfall below).
6. **Payload anatomy + breadth/depth axis + parameter reference** — three sub-visuals for the "what comes back per mode" section (see "§4 Data returned" subsection below for detail).

All six are page-local CSS — they don't belong in `base/styles.css` because they're shape-specific to the results-page pattern. **CRITICAL:** any custom class names MUST be prefixed (`timeline-row`, `costbar-track`, `shapes-q`, `fid-cell`, `mechanism-col`, `payload-card`, `bd-axis`) — never use bare names that collide with mermaid's emitted DOM (`.label`, `.nodeLabel`, etc.). The SKILL.md "Don't define unscoped CSS classes" rule applies here even though the results page typically has no mermaid diagrams — forward-compat matters.

### Avoid 2-col grids when one side is structurally short

A different gotcha than the `align-items: start` one (covered below). This is about **section-level layout**, not row heights inside a column.

First-draft instinct for the §1 introduction: put the problem statement on the left and the modes card on the right in a 2-column grid (`0.9fr 1.1fr` or similar). Looks balanced when sketched. Falls apart in practice because the modes card is structurally heavy (3 mode-definition rows + mechanism diagram + interplay diagram = ~700px) and the problem statement is structurally light (2-3 short paragraphs ≈ 120px). The grid forces them to share a row, so the problem card stretches to ~700px tall with ~580px of empty space below the text.

Symptom from May 2026 trace: user flagged *"the problem well is super tall and empty for the most part"*. Vision audit had also been ambivalent about that section's pacing earlier in the iteration but didn't name the empty-space issue clearly.

**The fix that worked: single-column vertical layout for the intro section.**

```html
<section id="intro">
  <div class="sec-head">THE PROBLEM</div>
  <h2>…</h2>

  <!-- Problem statement: one paragraph, full width, no card -->
  <p class="section-desc" style="max-width:880px">
    Short, dense, with a bold punchline. No empty space because there's no card.
  </p>

  <!-- Each card below stands on its own row -->
  <div class="ve-card">The three modes</div>
  <div class="ve-card">What each mode actually does (mechanism diagram)</div>
  <div class="ve-card">How they connect (interplay diagram)</div>
</section>
```

**The general rule:** in a 2-col layout, BOTH columns must have roughly proportional content. If one side is intrinsically short (a problem statement, a single insight, a config snippet), don't pair it with a structurally heavy card in a grid. Drop to single-column vertical and let each piece be its own row.

A 2-col layout is right when you're genuinely comparing two parallel things at similar depth: old-vs-new, fast-vs-summary, before-vs-after. It is wrong when one column is "framing" and the other is "content".

### CSS grid pitfall: `align-items: start` is mandatory when column height encodes meaning

**This is a non-obvious gotcha that defeated a real fix and took multiple iterations to debug.**

CSS grid auto-stretches columns to equal heights by default. So if you have a 3-column mechanism diagram where you've deliberately made some rows thin (skipped steps) so that "summary's column = tallest = most work" is visible at a glance, the grid will **silently fill the bottom of the shorter columns with empty space and make them all the same height.**

Symptom from the May 2026 trace (`results.html` mechanism diagram):
- Skipped rows were correctly styled: 4px padding, single-line, dashed border, dimmed grey.
- Live rows were correctly styled: 8px padding, two-line, coloured accent border.
- JS `offsetHeight` measurement of individual rows confirmed: live = 48–64px, skipped = 21px. The styling worked.
- BUT: `offsetHeight` of the entire columns showed `fast=348px, summary=348px, guided=348px`. **Equal.** The grid was padding out the shorter columns.
- Vision audit reported (correctly): "columns look roughly equal in height, no clear visual contrast between modes."

**Fix:** one line of CSS on the grid container:

```css
.mechanism-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  align-items: start;   /* <-- mandatory when column height encodes meaning */
}
```

After: `fast=263px, summary=348px, guided=304px`. The "summary does the most work" pattern is now visible at a glance.

**General rule:** any time you're using row-height contrast inside grid columns to communicate "this column has more content / more work / longer process", you MUST set `align-items: start` on the grid. Without it, the visual argument is silently defeated by the grid's default stretch behaviour, and you'll waste cycles re-styling rows that are already correctly styled.

### Skipped-step de-emphasis: structural change beats styling

A related lesson from the same trace: making skipped rows "look different" via opacity / line-through / dashed borders / strikethrough was **too subtle to land on a vision audit**. The vision model couldn't see the contrast. The styling-only patches went through three rounds of refinement (opacity → opacity+italic → strikethrough → ✗ marker prefix → dashed border + colour shift) and none of them made the count-of-steps obvious at a glance.

**What worked: structural change.** Collapse skipped rows from full-height bordered boxes (matching live rows' shape) to thin single-line inline rows:

```html
<!-- Live step (full height) -->
<div class="mech-step fts">
  <strong>STEP 1 · FTS5</strong>
  Query the full-text index for matches
</div>

<!-- Skipped step (thin row) -->
<div class="mech-step skip">
  <strong>skipped</strong>
  <span class="skip-divider">·</span>
  <span>no message fetching</span>
</div>
```

```css
.mech-step.skip {
  padding: 4px 10px;          /* was 8px on live */
  font-size: 10px;            /* was 11px on live */
  line-height: 1.3;           /* was 1.45 */
  display: flex;              /* horizontal layout */
  align-items: center;
  gap: 8px;
  font-style: italic;
  color: rgba(148,163,184, 0.55);
  border-left: 2px dashed rgba(148,163,184, 0.25);
  background: transparent;
}
.mech-step.skip strong { display: inline; font-size: 9px; }
```

A skipped row is now ~21px (a thin line); a live row is ~64px. Combined with `align-items: start` on the grid, the column heights now genuinely encode the work done.

**Generalisation:** when you want visual de-emphasis to communicate "this is a placeholder / not the main thing", change the **structure** (shorter, inline) not just the **decoration** (faded, italic, line-through). Decoration is too subtle for a quick scan — and crucially, too subtle for the vision audit to flag as different. Structure forces the eye to see it.

---

## §1 Mechanism diagram — what each mode/configuration DOES, not just returns

User flag from May 2026: "what's not clear enough about the modes is what each one does." The introduction's three-row mode definition card (name + role + one-line behaviour) tells the reader what comes BACK from each mode, but skips the load-bearing distinction: **what work happens to produce that output.** That's the cost driver. Without it, the cost numbers in §5 read as arbitrary; with it, the costs are obvious and earned.

### The pattern: 3-column per-mode pipeline diagram

Inside the §1 introduction card (right column, between the three mode-definition rows and the interplay diagram), add a "What each mode actually does" diagram. Three columns, one per mode. Each column lists the steps that mode runs:

```
FAST                          SUMMARY                       GUIDED
[STEP 1 · FTS5: index read]   [STEP 1 · FTS5: index read]   skipped · no FTS5 query
skipped · no message fetch    [STEP 2 · FETCH: all msgs     [STEP 1 · FETCH: ±N msgs
skipped · no LLM                from every match]             around each anchor]
[RETURN: snippets]            [STEP 3 · AUX LLM: per-       skipped · no LLM rewriting
cost: index read only           session summarisation]      [RETURN: raw window]
                              [RETURN: LLM recap per match] cost: targeted DB read
                              cost: 1 aux LLM call per match
```

**Step types and their visual weight:**
- **Live steps** are full-height bordered cards with coloured accent borders (green for FTS5, amber for FETCH, red for AUX LLM, slate for RETURN).
- **Skipped steps** are thin grey single-line inline rows: `skipped · no message fetching`. See "Skipped-step de-emphasis: structural change beats styling" earlier for the why and the CSS.
- **Cost footer** under each column states the cost driver in one phrase.

**The closing punchline callout** (amber-tinted, bordered, immediately under the 3-column grid) names the lesson:

> **The cost gap isn't about the search.** Fast and summary run the same FTS5 query. The gap is what happens *after*: summary fetches every message from every match and runs an aux LLM over each one. Fast skips both. Guided skips the search entirely and just reads a window around a known point.

This callout converts the diagram from "here are three pipelines" into "here is why summary costs 6× more". Without it, readers will see different shapes but not necessarily extract the lesson.

**Critical CSS gotcha — `align-items: start` on the grid.** See the dedicated pitfall section above. Without this, the columns all stretch to equal height and the "summary does the most work" pattern is invisible.

**Source for the step list:** read the actual tool/function code, don't write from memory. For each mode, walk through the function body and list what it ACTUALLY does (DB queries, LLM calls, post-processing). The May 2026 trace got the per-mode pipelines right only after grepping `tools/session_search_tool.py` for `def _fast_search`, `def _summarize_session`, `def _guided_drill_down` and reading the actual flow.

---

## §4 Data returned — payload anatomy + breadth/depth axis + parameters

User flag from May 2026: "the difference in the amount of data retrieved for each mode... what each one does. summary gets the results for fts5 and pull all messages... that's not clear enough." The §1 mechanism diagram covers "what work each mode does"; §4 covers "what artefact lands in the calling agent's context window".

Three sub-visuals, all under one section card:

### 4a. Per-call response anatomy (three payload cards, side-by-side)

Three colour-coded cards, one per mode. Each shows a mock-up of the actual JSON response shape so the reader can see the BYTES that come back, not just an abstract claim about them.

```
fast (~4 KB · 3 sessions)            summary (~12 KB · 3 sessions)         guided (~12-130 KB · 1 anchor)
─────────────────────────            ─────────────────────────────         ──────────────────────────────
session_id, title, timestamp         session_id, title, timestamp          session_id, anchor_message_id
"…matched snippet text…"             "The {topic} fix involved              [user] "…earlier message…"
match_message_id, source               patching {file}, adding a            [assistant] tool_call: ...
─────────────────────────              regression test, and merging         [tool] output: ...
session_id, title, timestamp           via PR #N. Key decisions: …"        ⚓ [user] "…anchor message…"
"…matched snippet text…"             ─────────────────────────────         [assistant] "…reply…"
match_message_id, source             session_id, title, timestamp          [user] "…next message…"
+ 1 more match                       "…second prose recap…"                ±N messages on each side
                                     + 1 more, all LLM-generated

SNIPPETS                             NARRATIVE PROSE                       RAW CONVERSATION
FTS5 lifts a few sentences           Aux LLM reads each matched session    Verbatim messages around a
around each match.                   top-to-bottom and writes a recap.     chosen anchor. No LLM rewriting.
```

**Critical:** the row content inside each card should LOOK LIKE the mode's output:
- Fast card: pseudo-JSON metadata rows + a snippet row styled differently (italicised green tint for highlight markers).
- Summary card: pseudo-JSON metadata + a multi-line italic prose row styled differently (italicised red tint).
- Guided card: chat-log-styled rows `[user] "…"`, `[assistant] "…"`, `[tool] ...`, with the anchor message highlighted (⚓ marker, brighter background).

The visual texture of each card reinforces the content type. Reader sees "fast looks like records, summary looks like writing, guided looks like a transcript" at a glance.

### 4b. Breadth ↔ depth axis (horizontal positioning)

A single horizontal axis with three dots, placed by their character:

```
BREADTH                                                              DEPTH
many sessions, shallow              ●─────────●─────────●           one anchor, full
context per session                FAST    SUMMARY    GUIDED        surrounding context
```

Each dot is colour-matched to the cards above (green / red / blue), with a small detail line under each:
- Fast: "N sessions × snippet, ~1 KB per session"
- Summary: "N sessions × LLM recap, ~4 KB per session"
- Guided: "1 anchor × full window, up to ~130 KB"

The closing caption ties it together: "Fast and summary are *horizontal* — they scan across sessions. Guided is *vertical* — it dives into one. The typical flow is fast (find candidates) → guided (read what was actually said). Summary collapses both into an LLM-narrated middle, at LLM-narrated cost."

### 4c. Tunable parameters reference grid

Six knobs in a 2-column grid (`query / limit / anchors / window / role_filter / mode`). Each row: param name (mono, amber) + mode applicability (mono, muted: `fast, summary` or `guided` or `all`) + one-line behaviour description.

Closing line frames the user-control story: "The agent composes these knobs without you having to think about them. The shape of your question drives `mode`; the breadth of the topic drives `limit`; the depth of the drill drives `anchors` and `window`. Power users can pin any of them — the agent honours explicit overrides."

This grid is the only "reference" content on a results page — it's permitted because it's compact (2 columns × 3 rows) and it answers the "how do I control this?" question that naturally arises after seeing the three modes. If you find yourself authoring a longer reference table, it belongs on the investigation page (or in the tool's docstring), not here.

---

## Visual density — the recurring failure mode

**This is the single biggest correction that comes up when authoring results pages.** I default to over-prosing visuals — too many words connecting them, redundant cards saying the same thing in different words, captions that re-explain what the visual already shows.

Concrete symptoms the user calls out:
- "too much information"
- "we need more visuals"
- "carry too much information"
- "the messaging is very polluted"
- "non over-whelming, factual way"

**The discipline:**

1. **Visuals carry the argument; prose is annotation.** Every visual should be readable without the surrounding paragraph. The paragraph exists to add nuance, not to explain the visual.

2. **No paragraph longer than 3 lines.** Same rule as the rest of the design system but more aggressively enforced here. If you wrote 3 lines, cut to 2.

3. **One card per idea.** If two cards are saying the same thing from different angles, merge or cut. The May 2026 first draft had a "tool priority" card that repeated the search-fidelity point; cutting it was the right call.

4. **Captions earn their place.** Under each visual, one sentence that names the takeaway. Not a recap of what the chart already shows.

5. **The 2x2 must highlight the diagonal.** A generic quadrant grid reads as a matrix. Visual emphasis (background tint, corner badges like "OLD DEFAULT" / "NEW DEFAULT") makes the spatial argument land. Without it, the visual is a table.

6. **Timeline segments must be wide enough to label.** When sizing bars in a percentage-of-track layout, size them so the *longest* row reaches ~75-80% of the track. Shorter rows then keep readable segment labels instead of cramped 1-character abbreviations.

7. **Every timeline row must include a closing "agent replies" segment after the last tool call.** Physical accuracy matters — the agent always thinks AFTER its final tool call to write the user-facing reply; without that segment, the diagram implies the agent dumps raw tool output. Caught by user in May 2026: "we're missing 'agent thinks' at the end of some entries. it has to have a closing think otherwise it would just dump the search results raw." Also: name intermediate think segments by their actual role — `sharpen` between successive fast calls (the agent refining its query), `picks anchor(s)` when transitioning fast→guided (the agent deciding which result to drill into). Generic `think think think` segments hide the work the agent is actually doing.

8. **Verify config paths, env vars, and API symbols against the source code, not from memory.** When a results page references how to enable/configure the new thing, the snippet's path or symbol gets read literally by users. Wrong paths waste their time and erode trust in the doc. The May 2026 trace shipped `tools.session_search.default_mode: fast` for several iterations when the real resolver lives at `auxiliary.session_search.default_mode` — a sibling agent caught it but only after multiple browser-vision passes and user reviews showed the wrong path. Before committing any config snippet on a results page, grep the resolver function in the code: `grep -n "default_mode" path/to/tool.py` and look at where `config.get(...)` chains land. Same rule for env vars (verify against `os.environ.get` / `getenv` calls), tool schemas (verify against the registered tool's actual parameter names), and slash commands (verify against the command registry).

9. **TOC hygiene — terse and unnumbered.** First-draft TOC titles tend to mirror the section headers verbatim with their full descriptive subtitle attached (e.g. `4. Search fidelity — what "honest" means now`). The TOC is for **navigation**, not narrative — readers don't want to read a sentence to click a link. Strip:
   - **Section numbers from TOC entries.** Numbers belong on the page itself (and even there, only if they aid orientation — see below). The TOC ordering already carries sequence.
   - **Descriptive subtitles from TOC entries.** `Search fidelity — what "honest" means now` → `Search fidelity`. `What question pulls which mode` → `Question → mode`.
   - **Numbers from section headers if the page reads cleanly without them.** Numbered sections feel formal/academic; a value-prop page reads better as a sequence of named ideas. Concrete from May 2026: dropping "1./2./3./4./5./6." from `THE THREE MODES, ON ONE CLOCK` etc. — the page lost nothing and got cleaner. Use numbers only if the reader needs to track "I'm in section 3 of 6" while scrolling; usually they don't.

   The litmus test: can each TOC entry be read in <1 second? If you have to scan a phrase, it's too long.

---

## The vision-check loop (mandatory before declaring done)

Page rendering at `file://` or in a static-site preview tells you about HTML and base CSS. It does NOT tell you whether the visualisations actually communicate. Use `browser_vision` after deploy to audit:

```
1. Deploy the page (push branch, wait for atlas-deploy action).
2. browser_navigate to the live URL.
3. browser_vision with a SPECIFIC question per visual:
   - "Are the timeline segments readable, with visible labels?"
   - "Does the 2x2 visually highlight the dangerous diagonal?"
   - "Do the stacked bars in the cost chart show main vs aux clearly?"
   - "Overall: sparse and scannable, or cluttered?"
```

The vision model will tell you what an actual reader experiences — squeezed bars, missing emphasis, cluttered density — that wouldn't surface from reading the source. Concrete trace (May 13, 2026):

- First vision audit on `results.html` returned: timeline segments squished, 2x2 reads as a matrix not quadrant, page leans cluttered.
- All three were real and the user would have called them out.
- Three targeted patches landed: rescaled timeline reference clock (90s → 80s, longest mode at 75% width), added background tint + corner labels to "OLD DEFAULT" / "NEW DEFAULT" cells in the 2x2, cut a redundant third card from section 3.
- Second vision audit confirmed all three fixes landed.

**Do not skip this step.** A page that renders structurally fine can still fail its job as a value-prop document. The vision check is the user-experience proxy.

### Vision-audit screenshot size limit — scroll, don't full-page

`browser_vision` against a long results page can blow up at submission time:

```
Error: ... messages.N.content.M.image.source.base64.data:
At least one of the image dimensions exceed max allowed size: 8000 pixels
```

The browser tool captures the entire scrolling page by default. For a results page with 6 sections × ~600px each, that's a ~3600px tall screenshot — fine. But once the page grows to 7+ sections with rich visuals (~8000-12000px tall), the screenshot exceeds the API's 8000-pixel ceiling and the vision call dies before reaching the model. Annoying because nothing in the error message tells you "scroll first".

**The fix:** before any `browser_vision` audit on a non-trivial page, scroll to the specific section first:

```python
# Don't:
browser_vision(question="Look at the whole page...")          # 12000px → fails

# Do:
browser_navigate(url="...#data-returned")                     # anchor scroll
browser_vision(question="Look at the 'What comes back' section...")
```

The hash-fragment scroll narrows the viewport; the screenshot capture is bounded by it.

For measurements you don't need vision for (column heights, computed CSS, segment widths), use `browser_console` with a JS expression — much faster, no size cap, and you get the actual numbers instead of an interpreted description.

Concrete trace (May 14, 2026): tried to vision-audit the whole `results.html` page after the §3 "What comes back" section landed (now ~10 visuals across 6 sections). Two consecutive `browser_vision` calls failed with the 8000px error before remembering that scrolling fixes it. Switched to anchor-targeted vision calls + `browser_console.offsetHeight` for the column-height measurement; rest of the audit completed cleanly.

### CDN cache lag — verify deployment before assuming a fix failed

The `browser_navigate` + `browser_vision` flow has a quiet failure mode: GitHub Pages' CDN caches aggressively, and after `gh workflow` reports the deploy succeeded, the browser tool can still hit the previous version for 30–60 seconds. Symptom: you push a fix, vision audit shows the same problem you just patched, you assume the patch didn't land and start re-debugging.

**Verify deployment landed BEFORE re-touching source:**

```bash
# After gh run reports "completed success":
curl -s "https://yoniebans.github.io/<path>/page.html?nocache=$(git rev-parse --short HEAD)" \
  | grep -oE '<some-string-only-in-the-new-version>'
```

If grep finds the new string, the CDN has the new content — any stale render is browser cache. Append a cache-buster query string to the URL (`?v=<commit-sha>` or `?nocache=<timestamp>`) and re-navigate. If grep doesn't find it, the deploy is still propagating — wait 30s and re-check the curl, don't touch source.

Concrete trace (May 13, 2026 — same session as the worked trace above): after pushing the timeline + 2x2 fixes, browser_navigate showed the OLD version twice in a row. Almost re-edited the source. `curl | grep "browse<"` showed the new content was live; the next navigate with `?nocache=<sha>` returned the new render. Total wasted cycles avoidable: 2.

---

## TOC integration

When adding a results page alongside an existing investigation page, update the TOC on BOTH pages so the shared sidebar nav lists results first:

```html
<nav class="toc" id="toc">
  <a class="toc-back" href="../../">← back</a>
  <div class="toc-page" data-page="results.html">
    <a class="toc-page__title" href="results.html#opener">results & value-prop</a>
    <div class="toc-page__sections">
      <a href="results.html#opener">Start here →</a>
    </div>
  </div>
  <div class="toc-page" data-page="index.html">
    <a class="toc-page__title" href="index.html#overview">investigation record</a>
    ... existing sections ...
  </div>
</nav>
```

Results page top, investigation page below. The "Start here →" label is the explicit signal to new readers.

---

## Authoring sequence

1. **Decide the audience.** Nous-internal vs public read changes what real examples you can use.
2. **Pick the worked example.** Real-looking lands harder than abstract; check with user whether public sensitivities allow it.
3. **Pick the deep-dive link target.** Usually `index.html#overview`; confirm with user before writing.
4. **Draft the 7-section structure.** Don't write copy yet — sketch the visuals first. Confirm with user that the §1 introduction (problem + new-concepts definition + interplay diagram) is in scope; don't skip it just because the modes feel "obvious" to you.
5. **Verify any config paths / env vars / API symbols** in the snippets against the source code (grep the resolver function). Wrong paths erode the page's credibility — see discipline rule 8.
6. **Author page-local CSS.** Timeline / quadrant / cost-bar / shapes-menu / payload-card / breadth-depth-axis classes with PREFIXED names. Run `scripts/audit-mermaid-labels.py` even though there's typically no mermaid.
7. **Write copy second.** Keep paragraphs ≤3 lines. Prefer one sentence under each visual to a full caption. Every timeline row must include an "agent replies" closer — see rule 7.
8. **Add the results-page entry to the shared TOC on BOTH pages.** Include the §1 introduction in the TOC unnumbered (it's preamble) and the analysis sections numbered 1–6 below it.
9. **HTML balance check** (count tag open/close per `section`, `div`, `p`, etc.).
10. **Commit, push, wait for atlas-deploy.**
11. **Vision-check loop** — `browser_vision` with specific questions per visual. **First verify deploy landed via `curl | grep <new-string>`** before assuming a fix didn't work — CDN cache can serve stale renders for 30-60s.
12. **Iterate on visual density** — almost always there's one trim to make. The first vision pass rarely lands clean.
13. **Final commit with the trims.**

Total: ~1.5 hours for a clean pass (7 sections + 5 visuals + verifications), ~2 hours if vision-check or user review surfaces a real structural gap.
