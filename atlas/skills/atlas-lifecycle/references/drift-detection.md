---
name: atlas-drift-detection
description: "Detect architectural drift between a codebase and its atlas. Three-layer daily scan: structural (git diff), atlas linters (HTML parse), and claim verification (LLM). Config-driven via daemon.yaml for use on any repo."
---

# Atlas drift detection

**When:** Daily cron job, or manually via "check for atlas drift on [project]".

**Config:** Each tracked project has a `daemon.yaml` — see parent SKILL.md for schema.

---

## Architecture — three layers

The daily scan runs three layers, cheapest first:

### Layer 1 — Structural scan (no LLM, seconds)

Git-level file shape changes since `baseline_ref`:

| Bucket | What it catches |
|---|---|
| New/deleted top-level directories | Genuinely new containers or removed surfaces |
| Infrastructure file changes | docker-compose, Dockerfile, k8s, .sql, migration, .proto, CI workflows |
| File-count deltas per directory | Dirs with >50% growth or >20 new files |
| New/deleted root files | Top-level files added/removed |
| New entry points | package.json, pyproject.toml, go.mod, Cargo.toml etc. |

Script: `scripts/structural-scan.py <daemon.yaml>`

### Layer 2 — Atlas linters (no LLM, seconds)

HTML-level checks on the atlas pages themselves:

| Linter | What it catches |
|---|---|
| **Mermaid syntax** | Parse all `diagram-source` blocks, flag syntax errors |
| **Mermaid tag balance** | Unclosed `<small>`, `<b>`, `<i>` in node labels |
| **CSS class collisions** | Bare `.label`, `.node` etc. in inline `<style>` |
| **`data-ref` validity** | Check every `data-ref` chip → `refs.js` → filesystem |
| **Paragraph discipline** | Paragraphs > 3 lines |
| **Cross-page numbers** | Extract all numbers + labels from all pages, flag same concept with different numbers |
| **Version string** | Compare `version_source` in code repo against atlas footers |

Script: `scripts/atlas-linters.py <daemon.yaml>` (runs after structural scan)

### Layer 3 — Claim verification (LLM, ~4 calls)

The LLM reads each atlas page and the codebase, then:

1. **Extracts verifiable claims** — numbers, lists, module paths, constants, diagram labels
2. **Checks each against the codebase** — grep, ls, wc, read constants
3. **Reports mismatches** — "atlas says MAX_DEPTH=2, code says MAX_DEPTH=1"

This catches the 58% of drift that structural scans miss: content staleness where
a constant changed, a list grew, a module was renamed, but no files were added or
removed.

The LLM also applies the maintenance threshold:
- New/removed container → atlas-worthy
- New entity type or relationship → atlas-worthy
- New external actor → atlas-worthy
- Version string changed → atlas-worthy (footer bump across all pages)
- New column, new endpoint in existing container → NOT atlas-worthy

---

## Gate logic

- Layer 1 (structural) + Layer 2 (linters): run every time. If both clean, still
  run Layer 3 — claim verification catches drift invisible to file-level checks.
- Layer 3 (claim verification): runs every time regardless. This is the key
  difference from the pre-May-2026 design where the LLM only fired when structural
  changes were found.

---

## Procedure

### Step 1 — Load config

```bash
cat /mnt/hermes/projects/<project>/daemon.yaml
```

Extract: repo path, atlas path, baseline ref, branch, pages list, version_source.

### Step 2 — Pull latest (both repos)

```bash
# Code repo
cd <repo_path> && git fetch <remote> && git checkout <branch> && git pull <remote> <branch>

# Atlas repo (may have merged drift PRs since last run)
cd <atlas_path> && git fetch origin && git pull origin main
```

Check for previously merged drift PRs:
```bash
gh pr list --state merged --search "atlas: drift" --limit 3 2>&1 | cat
```

### Step 3 — Run Layer 1 (structural scan)

```bash
python3 scripts/structural-scan.py <daemon.yaml>
```

### Step 4 — Run Layer 2 (atlas linters)

```bash
python3 scripts/atlas-linters.py <daemon.yaml>
```

### Step 5 — Run Layer 3 (claim verification)

The LLM reads:
1. Structural scan summary
2. Linter findings
3. Each atlas HTML page (from `atlas.pages` in config)
4. Version string from code repo (`version_source`)
5. The codebase (targeted reads based on claims found)

For each page, the LLM:
- Lists every verifiable claim
- Checks each against the codebase (grep/ls/wc via terminal)
- Classifies mismatches: stale, misleading, wrong, coverage gap

### Step 6 — Act on findings

#### If no drift detected
- Send summary to user. Update `baseline_ref` to HEAD.

#### If drift detected

**6a. Check for existing open drift PR:**
```bash
gh pr list --state open --search "atlas: drift" --limit 1 --json number,headRefName 2>&1 | cat
```
If open: reuse it. If not: create new branch.

**6b. Per-page authoring loop** (same as genesis Step 5):
- Declare essence → focused codebase read → edit HTML → self-verify → next page

**6c. Coherence check (always, even for single-page edits):**
- Concept-ownership consistent?
- No contradictions across pages?
- Version footer consistent across all pages?
- Cross-references resolve?

Note findings in PR body under `## Coherence review`.

**6d. Commit, push, open/update PR:**
```bash
git add . && GIT_AUTHOR_NAME=morpheus GIT_COMMITTER_NAME=morpheus git commit -F /tmp/commit.txt 2>&1 | cat
git push -u origin HEAD 2>&1 | cat
gh pr create --title "atlas: drift $(date +%Y-%m-%d)" --body-file /tmp/pr_body.md 2>&1 | cat
```

**6e. Advance baseline_ref** in daemon.yaml to HEAD. Always, even if PR is pending.

**6f. Switch atlas repo back to main.**

---

## Cron wiring

### Script placement

Cron `script` only accepts filenames relative to `~/.hermes/scripts/`. A wrapper at
`~/.hermes/scripts/atlas-drift-scan.py` calls into the skill's scripts:

```python
SCAN_SCRIPT = Path(__file__).parent.parent / "skills" / ... / "scripts" / "structural-scan.py"
```

The wrapper must:
- Pre-flight check `SCAN_SCRIPT.exists()`
- Propagate subprocess exit codes (`sys.exit(worst_exit)`)
- Print stderr on failure

### Delivery

Set `deliver` to a specific telegram/discord target — NOT `local`.

### Output mode

Open PRs, not text reports. Chat message = short ping (2-3 lines) + PR link.

---

## Pitfalls

- **Cron silently green while broken.** After skill consolidation: verify skill
  names resolve, wrapper path exists, recent outputs non-empty, cross-check
  against known shipped changes.
- **Wrapper must propagate exit codes.** A wrapper that exits 0 regardless of
  scan success makes cron report `last_status: ok` on failures.
- **Don't re-detect already-fixed drift.** Pull atlas repo before reading pages.
- **Always advance baseline_ref after creating/updating a PR.**
- **Stack drift into open PRs.** Don't create new PRs when one is already open.
- **daemon.yaml corruption from read_file.** Use `cat` via terminal.
- **Git state hygiene.** Always checkout main after a drift run.
- **Drift detection is blind to string-level staleness at Layer 1.** That's why
  Layers 2 and 3 exist. Layer 2 catches cross-page number inconsistencies. Layer 3
  catches single-page claims that drifted from codebase constants.
