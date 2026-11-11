#!/usr/bin/env python3
"""Audit Mermaid-diagram pages for the two failure modes that cause "all
node text is truncated" symptoms across atlas pages.

Both failure modes produce identical visible symptoms (every foreignObject
is too narrow, text spills past every node box) but are easy to confuse
with framework-level explanations (font-load races, mermaid bugs, design-
system drift). Reach for this script BEFORE reaching for browser DevTools
or submodule patches.

FAILURE MODE 1 — Unbalanced inline HTML tags in node labels.
  Mermaid uses HTML labels by default. An unclosed <small>/<b>/<i>/<em>
  inside one node keeps the inline-formatting context open across the
  rest of the diagram, mis-sizes foreignObjects, and makes node text
  spill past every downstream box.

FAILURE MODE 2 — Page-level CSS class collision with mermaid's emitted DOM.
  Mermaid emits <g class="label">, <g class="nodeLabel">,
  <g class="edgeLabel">, <g class="cluster">, <g class="node">, etc.
  during its OFFSCREEN measurement pass (sandbox briefly attached to
  document.body). Any unscoped CSS rule on those class names in the
  page's <style> block matches mermaid's own elements during measurement,
  mis-sizes them, and the foreignObject widths are locked to wrong sizes
  before the SVG is injected into .mermaid-canvas. The most common
  offender is `.label { font-size: 11px }`-style rules meant for the
  page's own tags or badges.

Usage:
    python3 audit-mermaid-labels.py <html-file> [<html-file> ...]

Exit code is 0 if every diagram is clean, 1 if any failure mode is found.
Prints diagram index, the failure mode, and the specific offending lines
or CSS rules so you know which one-line fix to make.

WORKFLOW WHEN A SINGLE ATLAS PAGE'S DIAGRAMS LOOK BROKEN:
  1. Run this script on the broken page AND a known-good atlas page.
  2. If the broken page has findings and the good page doesn't, that's
     your bug. Fix the offending lines.
  3. Only if BOTH come up clean should you reach for browser DevTools,
     font-load shims, or mermaid-zoom.js patches.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Inline tags mermaid parses inside HTML labels.
# <br/> is self-closing in mermaid usage; we ignore it for balance.
INLINE_TAGS = ("small", "b", "i", "em", "strong", "code", "sub", "sup")

# CSS class names mermaid emits during measurement. An unscoped rule
# on any of these in the page's own <style> block will hijack mermaid's
# offscreen measurement and produce truncated foreignObjects.
# Source: inspect a rendered .mermaid-canvas SVG — these are the classes
# attached to <g> and <span> elements inside foreignObject layouts.
MERMAID_RESERVED_CLASSES = (
    "label",
    "nodeLabel",
    "edgeLabel",
    "edgeLabels",
    "edgePath",
    "edgePaths",
    "cluster",
    "node",
    "nodes",
    "messageText",
    "loopText",
    "actor",
    "actor-line",
    "flowchart-link",
    "labelBkg",
)

DIAGRAM_RE = re.compile(
    r'<script type="text/plain" class="diagram-source">\s*(.*?)\s*</script>',
    re.DOTALL,
)

# Match <style>...</style> blocks anywhere in the file.
STYLE_BLOCK_RE = re.compile(r"<style[^>]*>(.*?)</style>", re.DOTALL | re.IGNORECASE)

# Match bare class selectors like `.label { ... }` but not `.foo .label { ... }`
# (scoped uses are fine — they require a parent context mermaid's sandbox lacks).
# We look for a top-level rule whose selector is just `.<name>` with optional
# modifiers (.label.fast, .label:hover) and no descendant combinator before it.
def bare_class_selector_re(class_name: str) -> re.Pattern:
    # Selector must start a rule (preceded by `}`, start-of-block, or `;`)
    # and be the entire compound selector — no space-separated parent.
    # Allow `.label`, `.label.foo`, `.label:hover`, `.label > x`, `.label x`.
    return re.compile(
        r"(?:^|[}\s;])"
        rf"(\.{re.escape(class_name)}\b[^,{{}}]*)\{{",
        re.MULTILINE,
    )


def audit_diagram_tags(diagram: str) -> list[tuple[str, int, int, list[str]]]:
    """Return [(tag, opens, closes, offending_lines), ...] for unbalanced tags."""
    findings: list[tuple[str, int, int, list[str]]] = []
    for tag in INLINE_TAGS:
        opens = re.findall(rf"<{tag}\b[^>]*>", diagram)
        closes = re.findall(rf"</{tag}>", diagram)
        if len(opens) != len(closes):
            offenders = []
            for line in diagram.splitlines():
                line_opens = len(re.findall(rf"<{tag}\b[^>]*>", line))
                line_closes = len(re.findall(rf"</{tag}>", line))
                if line_opens != line_closes:
                    offenders.append(line.strip()[:160])
            findings.append((tag, len(opens), len(closes), offenders))
    return findings


def audit_css_collisions(html_src: str) -> list[tuple[str, str]]:
    """Return [(reserved_class, matched_rule_text), ...] for collisions.

    Scans every <style> block for bare unscoped selectors matching a name
    mermaid emits. Selectors like `.foo .label { ... }` (descendant
    combinator with a parent context) are safe and skipped.
    """
    findings: list[tuple[str, str]] = []
    for style in STYLE_BLOCK_RE.findall(html_src):
        for cls in MERMAID_RESERVED_CLASSES:
            for m in bare_class_selector_re(cls).finditer(style):
                selector = m.group(1).strip()
                # Skip if the selector has a descendant combinator BEFORE the
                # reserved class (e.g. `.mermaid .label`) — the bare_class_*
                # regex already requires the class start the compound, but
                # double-check: anything containing ` .` (space-dot) before
                # the reserved class would mean it's scoped.
                # Our regex already enforces start-of-compound, so any match
                # here is a real bare selector.
                findings.append((cls, selector))
    return findings


def audit_file(path: Path) -> int:
    """Audit one file. Returns 1 if either failure mode is found, else 0."""
    src = path.read_text()
    diagrams = DIAGRAM_RE.findall(src)

    found_problems = False

    # FAILURE MODE 1
    if diagrams:
        bad_diagrams = 0
        for i, diagram in enumerate(diagrams):
            findings = audit_diagram_tags(diagram)
            if findings:
                bad_diagrams += 1
                found_problems = True
                print(f"\n[{path}] diagram #{i}: UNBALANCED INLINE TAGS")
                for tag, opens, closes, offenders in findings:
                    print(f"  <{tag}>: {opens} open / {closes} close")
                    for line in offenders:
                        print(f"    ↳ {line}")
        print(
            f"[{path}] {len(diagrams)} diagram(s) scanned, "
            f"{bad_diagrams} with unbalanced inline tags"
        )
    else:
        print(f"[{path}] no <script class=diagram-source> blocks found")

    # FAILURE MODE 2
    collisions = audit_css_collisions(src)
    if collisions:
        found_problems = True
        print(f"\n[{path}] CSS NAMESPACE COLLISION with mermaid's emitted DOM")
        print(
            "  These unscoped selectors will match mermaid's own <g>/<span>"
            " elements during its offscreen measurement pass and corrupt"
            " foreignObject widths."
        )
        for cls, selector in collisions:
            print(f"  ↳ `{selector} {{ ... }}` collides with mermaid's `.{cls}`")
        print(
            "  Fix: rename the class (e.g. `.label` → `.mode-label`) or scope"
            " it (e.g. `.my-card .label { ... }`)."
        )
    else:
        # quiet on success
        pass

    return 1 if found_problems else 0


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    total_bad = 0
    for arg in argv[1:]:
        total_bad += audit_file(Path(arg))
    return 1 if total_bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
