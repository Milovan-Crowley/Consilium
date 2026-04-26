#!/usr/bin/env python3
"""
Check Tribune runtime surfaces for stale references.

Checks:
1. Source and plugin-cache Tribune markdown contain no legacy paths, graph
   runtime tokens, authorship/provenance leaks, or case-body status writes.
2. Doctrine references under $CONSILIUM_DOCS/doctrine/ resolve in the docs repo.
3. Medusa Rig skill references are allowed and resolve through the installed
   plugin cache.
4. Tribune still does not carry Legatus/Soldier test-writing guidance.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parent.parent
TRIBUNE_DIR = REPO_ROOT / "skills" / "tribune"
CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", str(Path.home() / "projects" / "Consilium" / "docs")))
DOCTRINE_DIR = CONSILIUM_DOCS / "doctrine"

PLUGINS_DIR = Path.home() / ".claude" / "plugins"
CACHE_DIR = PLUGINS_DIR / "cache"
INSTALLED_MANIFEST = PLUGINS_DIR / "installed_plugins.json"
TRIBUNE_CACHE_DIR = CACHE_DIR / "consilium-local" / "consilium" / "1.0.0" / "skills" / "tribune"

SCAN_ROOTS: list[tuple[Path, str]] = [
    (TRIBUNE_DIR, "src"),
    (TRIBUNE_CACHE_DIR, "cache"),
]

BANNED_PATTERNS = [
    (r"\bJesse\b", "superpowers authorship reference"),
    (r"\bClaude\s+(wrote|authored|said)\b", "Claude-as-author reference"),
    (r"\bCLAUDE\.md\b", "CLAUDE.md referenced as if tribune owns it"),
    (r"superpowers[:-]", "superpowers provenance marker"),
    (r"\bconsilium:gladius\b", "external skill reference (should not appear in tribune)"),
    (r"\bconsilium:sententia\b", "external skill reference (should not appear in tribune)"),
    (r"\bconsilium:tribunal\b", "external skill reference (should not appear in tribune)"),
    (r"skills/references/domain", "legacy doctrine path"),
    (r"skills/tribune/references", "legacy Tribune reference path"),
    (r"docs/consilium/debugging-cases", "legacy debugging-case path"),
    (r"docs/consilium/specs", "legacy spec path"),
    (r"docs/consilium/plans", "legacy plan path"),
    (r"docs/ideas", "legacy idea path"),
    (r"\$CONSILIUM_DOCS/cases/<slug>/", "undated case-folder write path"),
    (r"graphify", "graph runtime reference"),
    (r"query_graph", "graph runtime tool reference"),
    (r"get_neighbors", "graph runtime tool reference"),
    (r"mcp__graphify", "graph runtime MCP reference"),
    (r"knowledge graph", "graph runtime knowledge-source claim"),
    (
        r"Status: (draft|rejected|approved|routed|contained|closed|referenced|abandoned)",
        "legacy case-body status write",
    ),
]

ALLOWED_EXTERNAL_SKILLS = {
    "medusa-dev:building-with-medusa",
    "medusa-dev:building-storefronts",
    "medusa-dev:building-admin-dashboard-customizations",
}

MEDUSA_PLUGIN_KEY = "medusa-dev@medusa"

TEST_WRITING_SMELLS = [
    r"\bwrite\s+(a\s+)?failing\s+test\b",
    r"\bimplement.*test\s+first\b",
    r"\btdd\s+cycle\b",
]

DOCTRINE_REF_PATTERN = re.compile(r"\$CONSILIUM_DOCS/doctrine/([A-Za-z0-9._/-]+)")


def find_markdown_files(root: Path):
    if not root.is_dir():
        return
    for path in root.rglob("*.md"):
        yield path


def format_location(path: Path, line_num: int, root_label: str) -> str:
    try:
        rel = path.relative_to(REPO_ROOT)
    except ValueError:
        try:
            rel = Path("~") / path.relative_to(Path.home())
        except ValueError:
            rel = path
    return f"[{root_label}] {rel}:{line_num}"


def resolve_medusa_install_path():
    if not INSTALLED_MANIFEST.exists():
        return None, f"MANIFEST_MISSING: {INSTALLED_MANIFEST}"
    try:
        manifest = json.loads(INSTALLED_MANIFEST.read_text())
    except (json.JSONDecodeError, OSError) as error:
        return None, f"MANIFEST_READ_FAILED: {INSTALLED_MANIFEST} - {error}"

    entries = manifest.get("plugins", {}).get(MEDUSA_PLUGIN_KEY)
    if not entries:
        return None, f"PLUGIN_NOT_INSTALLED: {MEDUSA_PLUGIN_KEY} not present in manifest"
    install_path = entries[0].get("installPath")
    if not install_path:
        return None, f"MANIFEST_MALFORMED: {MEDUSA_PLUGIN_KEY} entry has no installPath"
    return Path(install_path), None


def check_banned_regex():
    findings = []
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for pattern, description in BANNED_PATTERNS:
                flags = 0 if pattern.startswith("Status: ") else re.IGNORECASE
                for match in re.finditer(pattern, text, flags):
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, line_num, label)
                    findings.append(
                        f"BANNED_REGEX: {loc} - {description} (matched: {match.group(0)!r})"
                    )
    return findings


def check_doctrine_references():
    findings = []
    if not DOCTRINE_DIR.is_dir():
        return [f"MISSING_DOCTRINE_DIR: {DOCTRINE_DIR} does not exist"]

    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for match in DOCTRINE_REF_PATTERN.finditer(text):
                rel = match.group(1).rstrip(".,);:")
                target = DOCTRINE_DIR / rel
                if rel.endswith("/"):
                    exists = target.is_dir()
                else:
                    exists = target.exists()
                if not exists:
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, line_num, label)
                    findings.append(f"MISSING_DOCTRINE_REFERENCE: {loc} - {target}")
    return findings


def check_medusa_skills():
    findings = []
    medusa_install_path, medusa_err = resolve_medusa_install_path()
    if medusa_err:
        findings.append(medusa_err)

    skill_ref_pattern = re.compile(r"medusa-dev:([a-z-]+)")
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for match in skill_ref_pattern.finditer(text):
                skill_name = f"medusa-dev:{match.group(1)}"
                line_num = text[: match.start()].count("\n") + 1
                loc = format_location(md, line_num, label)
                if skill_name not in ALLOWED_EXTERNAL_SKILLS:
                    findings.append(
                        f"UNKNOWN_EXTERNAL_SKILL: {loc} - {skill_name} not in allowlist "
                        f"{sorted(ALLOWED_EXTERNAL_SKILLS)}"
                    )
                    continue
                if medusa_install_path is None:
                    continue
                skill_dir = medusa_install_path / "skills" / match.group(1)
                if not skill_dir.is_dir():
                    findings.append(
                        f"UNRESOLVED_MEDUSA_SKILL: {loc} - {skill_name} expected at {skill_dir}"
                    )
    return findings


def check_test_writing_vacuum():
    findings = []
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for pattern in TEST_WRITING_SMELLS:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, line_num, label)
                    findings.append(
                        f"TEST_WRITING_SMELL: {loc} - test-writing guidance does not "
                        f"belong in tribune (matched: {match.group(0)!r})"
                    )
    return findings


def main():
    all_findings = []

    print("=== Tribune Staleness Check ===")
    print(f"Repo root: {REPO_ROOT}")
    print(f"Doctrine: {DOCTRINE_DIR}")
    print(f"Scanning: {TRIBUNE_DIR} (src) + {TRIBUNE_CACHE_DIR} (cache)")
    print()

    checks = [
        ("Banned-regex scan", check_banned_regex),
        ("Doctrine reference existence", check_doctrine_references),
        ("Medusa Rig skill existence", check_medusa_skills),
        ("Test-writing vacuum", check_test_writing_vacuum),
    ]

    for label, check in checks:
        findings = check()
        all_findings.extend(findings)
        print(f"{label}: {len(findings)} finding(s)")

    print()
    if all_findings:
        print(f"=== {len(all_findings)} finding(s) ===")
        for finding in all_findings:
            print(f"  - {finding}")
        sys.exit(1)

    print("=== Clean ===")
    sys.exit(0)


if __name__ == "__main__":
    main()
