---
name: atlas-drift-detection
description: "Detect architectural drift between a project's codebase and its atlas. Two-stage: cheap structural scan (git diff → coarse buckets) gates an agent evaluation that decides which atlas pages are stale. Designed to run as a daily cron job via the active-projects-daemon."
maturity: "production — 2 cron runs (April 20-21, 2026). PR #2: TUI+Web Dashboard containers. PR #3: TUI sequence flow + plugin system data model. Both on hermes-architecture."
---

# Atlas drift detection

**Trigger:** Called by the active-projects-daemon cron job, or manually via "check for atlas drift on [project]".

**Config:** Each tracked project has a `/mnt/hermes/projects/<project>/daemon.yaml`:

```yaml
project: <name>
repo:
  path: /mnt/hermes/source/<project>
  remote: origin
  branch: main
atlas:
  path: /path/to/atlas  # where the HTML pages live
detection:
  baseline_ref: "<commit-sha>"  # last known-good commit
  strategy: static-diff
```

**Source of truth:**
- `/mnt/hermes/vault/workflows/drift-daemon.md` — design notes
- `/mnt/hermes/vault/atlas/lifecycle.md` — what counts as structural change
- `/mnt/hermes/vault/atlas/structure.md` — atlas page types

---

## Step 1 — Load config

```bash
cat /mnt/hermes/projects/<project>/daemon.yaml
```

Extract: repo path, atlas path, baseline ref, branch.

## Step 2 — Pull latest (both repos)

Pull the **code repo** AND the **atlas repo** (they're often separate):

```bash
# Code repo
cd <repo_path>
git fetch <remote>
git checkout <branch>
git pull <remote> <branch>

# Atlas repo (may have merged drift PRs since last run)
cd <atlas_path>
git fetch origin
git pull origin main
```

Then check for **previously merged drift PRs** that haven't had their baseline advanced:

```bash
cd <atlas_path>
gh pr list --state merged --search "atlas: drift" --limit 3 2>&1 | cat
```

If a prior drift PR was merged since the last baseline update, the atlas already reflects those changes. **Read the atlas AFTER pulling** to avoid re-detecting already-fixed drift.

## Step 3 — Structural scan (no LLM)

Run these git commands against `baseline_ref..HEAD`. If baseline_ref..HEAD has zero commits, stop here — "all clear, no new commits".

### 3a — New / deleted top-level directories

```bash
# New directories (at least one file added in a previously non-existent top-level dir)
git diff --name-only --diff-filter=A <baseline>..HEAD | grep -oP '^[^/]+/' | sort -u > /tmp/new_dirs.txt

# Deleted directories (all files in a top-level dir were removed)
git diff --name-only --diff-filter=D <baseline>..HEAD | grep -oP '^[^/]+/' | sort -u > /tmp/del_dirs.txt

# Filter to genuinely new (didn't exist at baseline)
for d in $(cat /tmp/new_dirs.txt); do
  git ls-tree --name-only <baseline> "$d" 2>/dev/null | head -1 || echo "$d"
done
```

### 3b — Infrastructure file changes

```bash
git diff --name-only <baseline>..HEAD | grep -iE \
  '(docker-compose|dockerfile|\.dockerfile|k8s/|kubernetes/|helm/|\.sql$|migration|prisma|\.proto$|fly\.toml|render\.yaml|terraform|pulumi|cdk|\.github/workflows)' \
  > /tmp/infra_changes.txt
```

### 3c — File-count deltas per directory

```bash
# Files per top-level dir at baseline
git ls-tree -r --name-only <baseline> | grep -oP '^[^/]+/' | sort | uniq -c | sort -rn > /tmp/baseline_counts.txt

# Files per top-level dir at HEAD
git ls-tree -r --name-only HEAD | grep -oP '^[^/]+/' | sort | uniq -c | sort -rn > /tmp/head_counts.txt

# Diff them — flag directories with >50% growth or >20 new files
```

### 3d — New / deleted entry points

```bash
# Top-level files added/deleted (not in subdirs)
git diff --name-only --diff-filter=AD <baseline>..HEAD | grep -v '/' > /tmp/root_file_changes.txt

# New package.json, setup.py, pyproject.toml, go.mod, Cargo.toml etc.
git diff --name-only --diff-filter=A <baseline>..HEAD | grep -iE \
  '(package\.json|setup\.py|pyproject\.toml|go\.mod|Cargo\.toml|Makefile|justfile)$' \
  > /tmp/new_entry_points.txt
```

### 3e — Classify and gate

Compile the outputs into a structured summary:

```
STRUCTURAL SCAN SUMMARY (<project>)
Baseline: <baseline_ref> → HEAD (<N> commits)

New top-level directories: <list or "none">
Deleted top-level directories: <list or "none">
Infrastructure changes: <list or "none">
Significant directory growth: <list or "none">
New/deleted root files: <list or "none">
New entry points: <list or "none">
```

**Gate rule:** If ALL buckets are empty → send "all clear" summary, stop. Otherwise → proceed to stage 2.

## Step 4 — Agent evaluation (LLM)

Hand the agent:

1. The structural scan summary from step 3
2. The current atlas HTML (read each `.html` file in the atlas path)
3. The maintenance threshold from [[atlas/lifecycle]]:
   - New/removed container → atlas-worthy
   - New entity type or relationship → atlas-worthy
   - New external actor or integration → atlas-worthy
   - New column, new endpoint in existing container → NOT atlas-worthy

The agent decides:

- **Which pages are stale** and why
- **What the drift is** — concrete description of what the atlas says vs what the code now does
- **Severity** — cosmetic (labels/names changed), structural (new/removed component), or major (new container/external actor)

### Output format

```
DRIFT REPORT (<project>)

Status: DRIFT DETECTED | NO DRIFT | ALL CLEAR (no structural changes)

Pages affected:
  - index.html: <what changed, why it matters>
  - data-model.html: <what changed>

Recommended actions:
  - Update system-architecture diagram to add <X> container
  - Add <Y> to data-model ER diagram
  - etc.
```

## Step 5 — Act on drift

### If no drift detected

Send summary to user. Update `baseline_ref` in `daemon.yaml` to HEAD.

### If drift detected

#### 5a — Check for an existing open drift PR

Before creating anything new, check if there's already an open drift PR:

```bash
cd <atlas_path>
gh pr list --state open --search "atlas: drift" --limit 1 --json number,headRefName 2>&1 | cat
```

**If an open PR exists:** reuse it. Check out the existing branch, apply your changes on top, amend/add commits, force-push, and update the PR body. This stacks new drift into the same review unit.

```bash
git checkout <existing_branch>
git pull origin <existing_branch>  # in case of remote changes
# ... make atlas updates ...
git add .
git commit -m "atlas: additional drift detected since <baseline_ref>"
git push origin <existing_branch> 2>&1 | cat
# Update the PR body to include the new drift report appended to the existing one
gh pr edit <pr_number> --body-file /tmp/pr_body.md 2>&1 | cat
```

**If no open PR exists:** create a new branch and PR as below.

#### 5b — Create a branch (only if no existing open PR)

```bash
cd <atlas_path>
git checkout -b atlas/drift-$(date +%Y%m%d)
```

#### 5c — Update atlas pages

Invoke the `brownfield-atlas-genesis` skill in update mode:
- Read the existing atlas pages
- Read the reference design system
- Apply the specific changes identified in the drift report
- Write updated HTML
- Update `refs.js` if new components/files are referenced

#### 5d — Commit and push

```bash
git add .
git commit -m "atlas: update for drift detected since <baseline_ref>

<drift report summary>"
git push -u origin HEAD 2>&1 | cat
```

#### 5e — Open a PR (only if no existing open PR)

Per `github-pr-workflow` skill:
```bash
gh pr create \
  --title "atlas: drift update $(date +%Y-%m-%d)" \
  --body-file /tmp/pr_body.md
```

#### 5f — Advance baseline_ref

**Always update `baseline_ref` in `daemon.yaml` to HEAD after creating or updating a PR.** This is critical — it prevents subsequent runs from re-analyzing the same commits and wasting inference costs.

```python
# In daemon.yaml, update baseline_ref to current HEAD
import subprocess, yaml
head = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True,
                      cwd="<repo_path>").stdout.strip()
# Update daemon.yaml with new baseline_ref
```

The PR diff preserves the record of what was analyzed. If the PR is rejected, the user can manually re-trigger a scan from an older baseline — but the default should be to move forward, not to re-scan.

#### 5g — Notify user

Send a short summary + PR link. Keep Telegram messages to 2-3 lines max.

---

## Pitfalls

- **Don't use per-page file watches in config.** An earlier design mapped atlas pages → file glob patterns (e.g. `index.html` watches `docker-compose*.yml`, `run_agent.py`, etc.). This is rigid — renames break it, unknown-unknowns escape it, and the watch list itself drifts and needs maintaining (the exact problem the daemon solves, one layer up). The two-stage scan+agent approach is rename-proof because it reasons about shape (new dirs, file-count deltas, infra patterns), not specific filenames.
- **Always advance baseline_ref after creating or updating a drift PR.** The PR preserves the full record of what was analyzed. Re-scanning the same commits on subsequent runs wastes inference costs and produces duplicate analysis. If a PR is rejected, the user can manually reset the baseline to re-trigger a scan.
- **Stack drift into open PRs.** Don't create a new PR when one is already open — push additional changes to the existing branch and update the PR body. Multiple open drift PRs create review fatigue and merge conflicts.
- **Don't trigger atlas updates on non-structural changes.** A new endpoint, a renamed variable, a new test file — none of these touch the atlas. The structural scan + agent judgment is the filter.
- **Don't run the full brownfield-atlas-genesis.** The daemon updates *existing* pages, it doesn't re-derive the entire atlas. The genesis skill's interview pattern doesn't apply here — the atlas already exists, we're patching it.
- **Cron delivery target matters.** `deliver: local` saves output but sends no notification — useless for a daemon. `deliver: origin` sends to whatever chat created the job (ephemeral). Set an explicit target like `telegram:chat_id:thread_id` for a dedicated channel.
- **Git state hygiene.** The daemon operates on the repo clone. Always ensure clean state before pulling (stash or reset if needed). Don't leave the clone on a drift branch after a run.
- **Atlas path vs repo path.** The atlas HTML may live in a different repo than the code (e.g. hermes-architecture is separate from hermes-agent). The config tracks both independently.
- **Git commit/push in terminal: pipe to cat.** The Hermes terminal tool misidentifies `git commit` and `gh pr create` as long-running processes and blocks them. Always pipe these commands through `| cat` to force foreground completion (e.g. `git commit -m 'msg' 2>&1 | cat`, `git push -u origin HEAD 2>&1 | cat`). Also use env vars for git author instead of `-c` flags: `GIT_AUTHOR_NAME=morpheus GIT_COMMITTER_NAME=morpheus git commit ...`.
- **PR body via temp file.** Long `--body` strings with special characters break shell quoting. Use `execute_code` to write the body to a temp file, then pass `--body-file /tmp/pr_body.md` to `gh pr create`.
- **Delegate atlas reads to subagents.** The atlas HTML pages are large (40-50KB each). Use `delegate_task` with parallel tasks to read atlas pages, investigate new directories, and read config files simultaneously. This avoids flooding the main context with raw HTML.
- **Switch atlas repo back to main after run.** Always `git checkout main` at the end so the next daemon run starts from a clean state and can pull. Leaving the repo on a drift branch causes the next run's `git pull` to fail.
- **Pull the atlas repo before reading pages.** The atlas repo may have merged prior drift PRs since the last run. If you read the atlas pages before pulling, you'll detect drift that was already fixed in a merged PR, waste a full subagent round, and then have to re-read. Always `git pull` the atlas repo in Step 2.
- **Validate HTML balance after edits.** After updating atlas HTML, count `<div>` opens vs closes to catch unclosed tags. Use `execute_code` to count: `content.count('<div')` vs `content.count('</div')`. Also count `diagram-source` occurrences to confirm the expected number of Mermaid diagrams.

---

## Cron wiring

The daemon runs as a hermes cron job with the structural scan as a pre-script.

### Script placement constraint

Cron `script` parameter only accepts filenames relative to `~/.hermes/scripts/` — no absolute paths, no arguments. The actual scan logic lives in this skill's `scripts/structural-scan.py`, so a **wrapper script** at `~/.hermes/scripts/atlas-drift-scan.py` imports and calls it with hardcoded config paths.

To add more projects, edit the `PROJECTS` list in the wrapper. The wrapper iterates all configs and concatenates output.

### Delivery

Set `deliver` to a specific telegram/discord target — NOT `local`. `local` saves output silently with no notification, which defeats the purpose of a monitoring daemon.

### Output mode: PRs, not text reports

The cron agent should open PRs when drift is detected, not dump a detailed text report into chat. PR diffs are far more reviewable than a Telegram wall of text. The chat message should be a short ping (2-3 lines max) with a link to the PR. The PR body carries the full drift report.

This means the cron prompt should instruct the agent to:
- Create a branch, update atlas HTML, open a PR
- Keep the delivery message to a summary + PR link
- Never send a multi-paragraph drift analysis as a chat message

---

## Cron setup

- Cron script: `~/.hermes/scripts/atlas-drift-scan.py` — wrapper that hardcodes project config paths and calls the structural scan. Add new projects by appending to the `PROJECTS` list.
- The structural scan script lives in this skill's `scripts/structural-scan.py` — the cron wrapper calls it.
- Cron delivery should go to a dedicated Telegram topic (or similar), not `local` — the output is most useful as a notification.
- The cron prompt should instruct the agent to keep Telegram output SHORT (summary + PR link). The PR body carries the detail.
- hermes-architecture is a SEPARATE repo from hermes-agent. The daemon commits/pushes to hermes-architecture only.

## Dependencies

- `brownfield-atlas-genesis` — for atlas update authoring
- `atlas-site-build` — for design system reference
- `github-pr-workflow` — for PR creation
- Project-specific `daemon.yaml` config
- Wrapper script at `~/.hermes/scripts/atlas-drift-scan.py`

---

## Verification

After a daemon run:

1. If "all clear" — spot-check: does the structural scan genuinely show no changes? (Sanity check the baseline_ref is correct.)
2. If "no drift" — does the agent's reasoning make sense? Did it correctly classify changes as non-structural?
3. If drift PR opened — do the atlas page updates match the drift report? Do diagrams render? Do new refs.js entries point to real files?
