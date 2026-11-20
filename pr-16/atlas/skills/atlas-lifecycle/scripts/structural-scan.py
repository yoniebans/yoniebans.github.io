#!/usr/bin/env python3
"""
Structural scan for atlas drift detection.

Reads a project's daemon.yaml, pulls latest code, and classifies
git changes into coarse structural buckets. Outputs a summary to
stdout that the cron job's agent evaluates.

Usage:
    python structural-scan.py /mnt/hermes/projects/<project>/daemon.yaml

Exit codes:
    0 — structural changes detected (summary on stdout)
    1 — error (message on stderr)
    2 — all clear, no structural changes (brief message on stdout)
"""

import subprocess
import sys
import yaml
from collections import defaultdict
from pathlib import Path

INFRA_PATTERNS = [
    "docker-compose", "dockerfile", ".dockerfile",
    "k8s/", "kubernetes/", "helm/",
    ".sql", "migration", "prisma", ".proto",
    "fly.toml", "render.yaml",
    "terraform", "pulumi", "cdk",
    ".github/workflows",
]

ENTRY_POINT_PATTERNS = [
    "package.json", "setup.py", "pyproject.toml",
    "go.mod", "cargo.toml", "makefile", "justfile",
]

# Directories to exclude from structural analysis (noise, not architecture).
# This is the fallback when daemon.yaml omits `detection.exclude_dirs`. Keep it
# conservative — anything project-specific (e.g. "website", "skills") belongs
# in daemon.yaml.
DEFAULT_EXCLUDE_DIRS = {"tests", "test", "__pycache__", "node_modules", ".git"}


def run(cmd, cwd=None):
    """Run a shell command and return stdout lines."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    if result.returncode != 0 and "unknown revision" in result.stderr:
        print(f"ERROR: baseline ref not found. stderr: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return [line.strip() for line in result.stdout.strip().split("\n") if line.strip()]


def load_config(path):
    with open(path) as f:
        return yaml.safe_load(f)


def top_level_dir(filepath):
    """Extract the top-level directory from a path, or None if root-level file."""
    parts = Path(filepath).parts
    if len(parts) > 1:
        return parts[0]
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: structural-scan.py <daemon.yaml>", file=sys.stderr)
        sys.exit(1)

    config = load_config(sys.argv[1])
    repo_path = config["repo"]["path"]
    remote = config["repo"].get("remote", "origin")
    branch = config["repo"].get("branch", "main")
    baseline = config["detection"]["baseline_ref"]
    exclude_dirs = set(config["detection"].get("exclude_dirs", DEFAULT_EXCLUDE_DIRS))

    # Pull latest
    run(f"git fetch {remote}", cwd=repo_path)
    run(f"git checkout {branch}", cwd=repo_path)
    run(f"git pull {remote} {branch}", cwd=repo_path)

    # Check if there are any commits since baseline
    commit_count_lines = run(f"git rev-list --count {baseline}..HEAD", cwd=repo_path)
    commit_count = int(commit_count_lines[0]) if commit_count_lines else 0

    if commit_count == 0:
        print(f"ALL CLEAR — no new commits since baseline {baseline[:8]}")
        sys.exit(2)

    # Get all changed files
    all_changes = run(f"git diff --name-only {baseline}..HEAD", cwd=repo_path)
    added_files = run(f"git diff --name-only --diff-filter=A {baseline}..HEAD", cwd=repo_path)
    deleted_files = run(f"git diff --name-only --diff-filter=D {baseline}..HEAD", cwd=repo_path)

    # --- Bucket 1: New / deleted top-level directories ---
    added_dirs = set()
    for f in added_files:
        d = top_level_dir(f)
        if d and d not in exclude_dirs:
            added_dirs.add(d)

    deleted_dirs = set()
    for f in deleted_files:
        d = top_level_dir(f)
        if d and d not in exclude_dirs:
            deleted_dirs.add(d)

    # Filter to genuinely new dirs (didn't exist at baseline)
    baseline_dirs = set()
    for line in run(f"git ls-tree --name-only {baseline}", cwd=repo_path):
        baseline_dirs.add(line)

    new_dirs = sorted(added_dirs - baseline_dirs)

    # Filter to genuinely deleted dirs (don't exist at HEAD)
    head_dirs = set()
    for line in run("git ls-tree --name-only HEAD", cwd=repo_path):
        head_dirs.add(line)

    gone_dirs = sorted(deleted_dirs - head_dirs)

    # --- Bucket 2: Infrastructure file changes ---
    infra_changes = []
    for f in all_changes:
        f_lower = f.lower()
        if any(pat in f_lower for pat in INFRA_PATTERNS):
            infra_changes.append(f)

    # --- Bucket 3: File-count deltas per directory ---
    def count_per_dir(ref):
        counts = defaultdict(int)
        for line in run(f"git ls-tree -r --name-only {ref}", cwd=repo_path):
            d = top_level_dir(line)
            if d and d not in exclude_dirs:
                counts[d] += 1
        return counts

    baseline_counts = count_per_dir(baseline)
    head_counts = count_per_dir("HEAD")

    significant_growth = []
    for d in sorted(set(list(baseline_counts.keys()) + list(head_counts.keys()))):
        old = baseline_counts.get(d, 0)
        new = head_counts.get(d, 0)
        if old == 0:
            continue  # already captured in new_dirs
        delta = new - old
        pct = (delta / old * 100) if old > 0 else 0
        if delta > 20 or pct > 50:
            significant_growth.append(f"{d}/: {old} → {new} files ({delta:+d}, {pct:+.0f}%)")

    # --- Bucket 4: New / deleted root-level files ---
    root_added = sorted(f for f in added_files if "/" not in f)
    root_deleted = sorted(f for f in deleted_files if "/" not in f)

    # --- Bucket 5: New entry points ---
    new_entry_points = []
    for f in added_files:
        f_lower = Path(f).name.lower()
        if any(f_lower == pat for pat in ENTRY_POINT_PATTERNS):
            new_entry_points.append(f)

    # --- Compile summary ---
    buckets = {
        "New top-level directories": new_dirs,
        "Deleted top-level directories": gone_dirs,
        "Infrastructure changes": infra_changes[:20],  # cap at 20
        "Significant directory growth": significant_growth,
        "New/deleted root files": root_added + root_deleted,
        "New entry points": new_entry_points,
    }

    any_hits = any(bool(v) for v in buckets.values())

    print(f"STRUCTURAL SCAN SUMMARY ({config['project']})")
    print(f"Baseline: {baseline[:8]}..HEAD ({commit_count} commits)")
    print()

    for label, items in buckets.items():
        if items:
            print(f"{label}:")
            for item in items:
                print(f"  - {item}")
        else:
            print(f"{label}: none")
        print()

    if not any_hits:
        print("RESULT: ALL CLEAR — no structural changes detected")
        sys.exit(2)
    else:
        print("RESULT: STRUCTURAL CHANGES DETECTED — agent evaluation recommended")
        sys.exit(0)


if __name__ == "__main__":
    main()
