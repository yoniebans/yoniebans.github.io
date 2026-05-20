#!/usr/bin/env python3
"""
Atlas linters — Layer 2 of drift detection.

HTML-level checks on atlas pages: mermaid syntax, tag balance, CSS collisions,
data-ref validity, paragraph discipline, cross-page number consistency, version string.

Reads config from daemon.yaml (same as structural-scan.py).

Usage:
    python atlas-linters.py /mnt/hermes/projects/<project>/daemon.yaml

Exit codes:
    0 — findings detected (summary on stdout)
    1 — error
    2 — all clear
"""

import re
import subprocess
import sys
import yaml
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path


# --- Mermaid tag balance (from audit-mermaid-labels.py) ---

DIAGRAM_RE = re.compile(
    r'<script\s+type="text/plain"\s+class="diagram-source">\s*\n?(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)

INLINE_TAGS = {"small", "b", "i", "em", "strong", "u", "sub", "sup", "span", "a", "code", "font"}

MERMAID_RESERVED_CLASSES = {
    "label", "nodeLabel", "edgeLabel", "cluster", "node", "edgePath",
    "flowchart-link", "statediagram-state", "actor", "messageText",
    "labelText", "loopText", "noteText",
}

STYLE_BLOCK_RE = re.compile(r"<style[^>]*>(.*?)</style>", re.DOTALL | re.IGNORECASE)
SELECTOR_RE = re.compile(r"([.#][\w-]+)\s*[{,]")


def check_mermaid_tags(html_content, page_name):
    """Check for unbalanced inline tags in mermaid diagram sources."""
    findings = []
    diagrams = DIAGRAM_RE.findall(html_content)
    for i, src in enumerate(diagrams):
        open_tags = defaultdict(int)
        for match in re.finditer(r"<(/?)(\w+)[^>]*>", src):
            closing, tag = match.group(1), match.group(2).lower()
            if tag in INLINE_TAGS:
                if closing:
                    open_tags[tag] -= 1
                else:
                    open_tags[tag] += 1
        unbalanced = {t: c for t, c in open_tags.items() if c != 0}
        if unbalanced:
            findings.append(f"  [{page_name}] diagram {i+1}: unbalanced tags {unbalanced}")
    return findings


def check_css_collisions(html_content, page_name):
    """Check for bare CSS selectors that collide with mermaid internals."""
    findings = []
    for style_block in STYLE_BLOCK_RE.findall(html_content):
        for match in SELECTOR_RE.finditer(style_block):
            selector = match.group(1)
            if selector.startswith("."):
                class_name = selector[1:]
                if class_name in MERMAID_RESERVED_CLASSES:
                    findings.append(
                        f"  [{page_name}] CSS collision: bare '.{class_name}' in <style> "
                        f"collides with mermaid internals"
                    )
    return findings


# --- data-ref validity ---

def check_data_refs(html_content, page_name, refs_js_path, repo_path):
    """Check that data-ref chips resolve via refs.js to real files."""
    findings = []
    data_refs = re.findall(r'data-ref="([^"]+)"', html_content)
    if not data_refs:
        return findings

    # Parse refs.js
    refs = {}
    if refs_js_path and refs_js_path.exists():
        content = refs_js_path.read_text()
        # Extract the refs object — it's JSON-like inside JS
        for match in re.finditer(r'"(\w[\w-]*)"\s*:\s*\{\s*"path"\s*:\s*"([^"]+)"', content):
            refs[match.group(1)] = match.group(2)

    for ref in data_refs:
        if ref not in refs:
            findings.append(f"  [{page_name}] data-ref '{ref}' not found in refs.js")
        elif repo_path:
            file_path = Path(repo_path) / refs[ref]
            if not file_path.exists():
                findings.append(
                    f"  [{page_name}] data-ref '{ref}' → {refs[ref]} — file not found on disk"
                )
    return findings


# --- Paragraph discipline ---

def check_paragraph_length(html_content, page_name):
    """Check for paragraphs longer than 3 lines (heuristic: >300 chars)."""
    findings = []
    # Extract text from <p> tags
    for match in re.finditer(r"<p[^>]*>(.*?)</p>", html_content, re.DOTALL):
        text = re.sub(r"<[^>]+>", "", match.group(1)).strip()
        lines = text.count("\n") + 1
        if lines > 3 or len(text) > 350:
            preview = text[:80].replace("\n", " ")
            findings.append(f"  [{page_name}] paragraph > 3 lines: '{preview}...'")
    return findings


# --- Cross-page number consistency ---

NUMBER_PATTERN = re.compile(r'(\d+)\+?\s*([\w\s-]{3,30}?)(?:\s*(?:tools|adapters|providers|platforms|tasks|channels|hooks|sequences|pages|entry|surfaces|plugins|categories|models))', re.IGNORECASE)


def extract_numbers(html_content, page_name):
    """Extract quantified claims: '25+ platform adapters', '8 Key Sequences' etc."""
    claims = []
    text = re.sub(r"<[^>]+>", " ", html_content)
    for match in NUMBER_PATTERN.finditer(text):
        num = int(match.group(1))
        label = match.group(0).strip()
        claims.append((page_name, num, label))
    return claims


def check_cross_page_numbers(all_claims):
    """Flag same concept with different numbers across pages."""
    findings = []
    # Group by normalised label
    by_concept = defaultdict(list)
    for page, num, label in all_claims:
        # Normalise: lowercase, strip leading number
        key = re.sub(r"^\d+\+?\s*", "", label.lower()).strip()
        by_concept[key].append((page, num, label))

    for concept, entries in by_concept.items():
        if len(entries) > 1:
            nums = set(e[1] for e in entries)
            if len(nums) > 1:
                details = ", ".join(f"{e[0]}={e[1]} ('{e[2]}')" for e in entries)
                findings.append(f"  Cross-page inconsistency for '{concept}': {details}")
    return findings


# --- Version string check ---

def check_version(atlas_path, pages, repo_path, version_source):
    """Compare version in code repo against atlas footers."""
    findings = []
    if not version_source:
        return findings

    # Get version from code repo
    version_file = Path(repo_path) / version_source
    if not version_file.exists():
        findings.append(f"  Version source '{version_source}' not found in code repo")
        return findings

    content = version_file.read_text()
    # Try common patterns
    version = None
    for pattern in [
        r'version\s*=\s*["\']([^"\']+)["\']',       # pyproject.toml, setup.py
        r'"version"\s*:\s*"([^"]+)"',                  # package.json
        r'version\s*=\s*"([^"]+)"',                    # Cargo.toml
    ]:
        m = re.search(pattern, content, re.IGNORECASE)
        if m:
            version = m.group(1)
            break

    if not version:
        findings.append(f"  Could not extract version from '{version_source}'")
        return findings

    # Check each atlas page footer
    for page_file in pages:
        page_path = Path(atlas_path) / page_file
        if not page_path.exists():
            continue
        page_content = page_path.read_text()
        # Look for version strings like v0.14.0 in footer area
        footer_versions = re.findall(r'v(\d+\.\d+\.\d+)', page_content[-2000:])
        if footer_versions:
            for fv in set(footer_versions):
                if fv != version:
                    findings.append(
                        f"  [{page_file}] footer version v{fv} ≠ code version v{version}"
                    )
    return findings


# --- Main ---

def main():
    if len(sys.argv) < 2:
        print("Usage: atlas-linters.py <daemon.yaml>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1]) as f:
        config = yaml.safe_load(f)

    atlas_path = config["atlas"]["path"]
    repo_path = config["repo"]["path"]
    pages = config["atlas"].get("pages", [])
    refs_js_name = config["atlas"].get("refs_js", "refs.js")
    version_source = config["repo"].get("version_source", "")

    refs_js_path = Path(atlas_path) / refs_js_name

    all_findings = []
    all_number_claims = []

    for page_file in pages:
        page_path = Path(atlas_path) / page_file
        if not page_path.exists():
            all_findings.append(f"  [{page_file}] page not found at {page_path}")
            continue

        html = page_path.read_text()

        all_findings.extend(check_mermaid_tags(html, page_file))
        all_findings.extend(check_css_collisions(html, page_file))
        all_findings.extend(check_data_refs(html, page_file, refs_js_path, repo_path))
        all_findings.extend(check_paragraph_length(html, page_file))
        all_number_claims.extend(extract_numbers(html, page_file))

    # Cross-page checks
    all_findings.extend(check_cross_page_numbers(all_number_claims))
    all_findings.extend(check_version(atlas_path, pages, repo_path, version_source))

    # Output
    print(f"ATLAS LINTER REPORT ({config['project']})")
    print(f"Pages scanned: {len(pages)}")
    print()

    if all_findings:
        print(f"FINDINGS ({len(all_findings)}):")
        for f in all_findings:
            print(f)
        print()
        print("RESULT: LINT FINDINGS DETECTED")
        sys.exit(0)
    else:
        print("RESULT: ALL CLEAR — no lint findings")
        sys.exit(2)


if __name__ == "__main__":
    main()
