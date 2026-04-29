#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TRIBUNE_DIR = ROOT / "claude" / "skills" / "tribune"
CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", str(Path.home() / "projects" / "Consilium" / "docs")))
DOCTRINE_DIR = CONSILIUM_DOCS / "doctrine"

PLUGINS_DIR = Path.home() / ".claude" / "plugins"
INSTALLED_MANIFEST = PLUGINS_DIR / "installed_plugins.json"
CONSILIUM_PLUGIN_LINK = PLUGINS_DIR / "consilium"

MEDUSA_PLUGIN_KEY = "medusa-dev@medusa"
CONSILIUM_PLUGIN_KEY = "consilium@consilium-local"

ALLOWED_EXTERNAL_SKILLS = {
    "medusa-dev:building-with-medusa",
    "medusa-dev:building-storefronts",
    "medusa-dev:building-admin-dashboard-customizations",
}

BANNED_PATTERNS = [
    (r"\bJesse\b", "superpowers authorship reference"),
    (r"\bClaude\s+(wrote|authored|said)\b", "Claude-as-author reference"),
    (r"\bCLAUDE\.md\b", "CLAUDE.md referenced as if tribune owns it"),
    (r"superpowers[:-]", "superpowers provenance marker"),
    (r"\bconsilium:gladius\b", "external skill reference"),
    (r"\bconsilium:sententia\b", "external skill reference"),
    (r"\bconsilium:tribunal\b", "external skill reference"),
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

TEST_WRITING_SMELLS = [
    r"\bwrite\s+(a\s+)?failing\s+test\b",
    r"\bimplement.*test\s+first\b",
    r"\btdd\s+cycle\b",
]

DOCTRINE_REF_PATTERN = re.compile(r"\$CONSILIUM_DOCS/doctrine/([A-Za-z0-9._/-]+)")


def markdown_files(root: Path):
    if not root.is_dir():
        return
    yield from sorted(root.rglob("*.md"))


def format_location(path: Path, line_num: int, root_label: str) -> str:
    try:
        rel = path.relative_to(ROOT)
    except ValueError:
        try:
            rel = Path("~") / path.relative_to(Path.home())
        except ValueError:
            rel = path
    return f"[{root_label}] {rel}:{line_num}"


def load_installed_manifest() -> tuple[dict, str | None]:
    if not INSTALLED_MANIFEST.exists():
        return {}, f"MANIFEST_MISSING: {INSTALLED_MANIFEST}"
    try:
        return json.loads(INSTALLED_MANIFEST.read_text()), None
    except (json.JSONDecodeError, OSError) as error:
        return {}, f"MANIFEST_READ_FAILED: {INSTALLED_MANIFEST} - {error}"


def plugin_entries(manifest: dict, key: str) -> list[dict]:
    entries = manifest.get("plugins", {}).get(key) or []
    return entries if isinstance(entries, list) else []


def consilium_cache_paths(manifest: dict) -> list[Path]:
    paths = []
    for entry in plugin_entries(manifest, CONSILIUM_PLUGIN_KEY):
        install_path = entry.get("installPath")
        if install_path:
            paths.append(Path(install_path))
    return paths


def active_consilium_source() -> Path | None:
    if not CONSILIUM_PLUGIN_LINK.exists() and not CONSILIUM_PLUGIN_LINK.is_symlink():
        return None
    return CONSILIUM_PLUGIN_LINK.resolve(strict=False)


def scan_roots(manifest: dict) -> tuple[list[tuple[Path, str]], list[str]]:
    findings = []
    roots: list[tuple[Path, str]] = [(TRIBUNE_DIR, "src")]
    active_source = active_consilium_source()
    expected_source = ROOT / "claude"

    if active_source != expected_source:
        findings.append(f"CONSILIUM_PLUGIN_SOURCE_MISMATCH: {CONSILIUM_PLUGIN_LINK} -> {active_source}, expected {expected_source}")
    elif not (active_source / ".claude-plugin" / "plugin.json").is_file() or not (active_source / "skills").is_dir():
        findings.append(f"CONSILIUM_PLUGIN_SOURCE_INVALID: {active_source} missing descriptor or skills")
    else:
        roots.append((active_source / "skills" / "tribune", "active-plugin"))

    for cache_path in consilium_cache_paths(manifest):
        tribune_cache = cache_path / "skills" / "tribune"
        if cache_path.exists():
            roots.append((tribune_cache, "cache"))
        elif active_source == expected_source:
            print(f"MISSING_CONSILIUM_PLUGIN_CACHE tolerated because active source is {active_source}: {cache_path}")
        else:
            findings.append(f"MISSING_CONSILIUM_PLUGIN_CACHE: {cache_path}")

    return roots, findings


def check_banned_regex(roots: list[tuple[Path, str]]) -> list[str]:
    findings = []
    for root, label in roots:
        if not root.is_dir():
            findings.append(f"MISSING_SCAN_ROOT: {root}")
            continue
        for md in markdown_files(root):
            text = md.read_text()
            for pattern, description in BANNED_PATTERNS:
                flags = 0 if pattern.startswith("Status: ") else re.IGNORECASE
                for match in re.finditer(pattern, text, flags):
                    line_num = text[: match.start()].count("\n") + 1
                    findings.append(f"BANNED_REGEX: {format_location(md, line_num, label)} - {description} (matched: {match.group(0)!r})")
    return findings


def check_doctrine_references(roots: list[tuple[Path, str]]) -> list[str]:
    findings = []
    if not DOCTRINE_DIR.is_dir():
        return [f"MISSING_DOCTRINE_DIR: {DOCTRINE_DIR} does not exist"]

    for root, label in roots:
        for md in markdown_files(root):
            text = md.read_text()
            for match in DOCTRINE_REF_PATTERN.finditer(text):
                rel = match.group(1).rstrip(".,);:")
                target = DOCTRINE_DIR / rel
                exists = target.is_dir() if rel.endswith("/") else target.exists()
                if not exists:
                    line_num = text[: match.start()].count("\n") + 1
                    findings.append(f"MISSING_DOCTRINE_REFERENCE: {format_location(md, line_num, label)} - {target}")
    return findings


def resolve_medusa_install_path(manifest: dict) -> tuple[Path | None, str | None]:
    entries = plugin_entries(manifest, MEDUSA_PLUGIN_KEY)
    if not entries:
        return None, f"PLUGIN_NOT_INSTALLED: {MEDUSA_PLUGIN_KEY} not present in manifest"
    install_path = entries[0].get("installPath")
    if not install_path:
        return None, f"MANIFEST_MALFORMED: {MEDUSA_PLUGIN_KEY} entry has no installPath"
    return Path(install_path), None


def check_medusa_skills(roots: list[tuple[Path, str]], manifest: dict) -> list[str]:
    findings = []
    medusa_install_path, medusa_err = resolve_medusa_install_path(manifest)
    if medusa_err:
        findings.append(medusa_err)

    skill_ref_pattern = re.compile(r"medusa-dev:([a-z-]+)")
    for root, label in roots:
        for md in markdown_files(root):
            text = md.read_text()
            for match in skill_ref_pattern.finditer(text):
                skill_name = f"medusa-dev:{match.group(1)}"
                line_num = text[: match.start()].count("\n") + 1
                loc = format_location(md, line_num, label)
                if skill_name not in ALLOWED_EXTERNAL_SKILLS:
                    findings.append(f"UNKNOWN_EXTERNAL_SKILL: {loc} - {skill_name}")
                    continue
                if medusa_install_path is None:
                    continue
                skill_dir = medusa_install_path / "skills" / match.group(1)
                if not skill_dir.is_dir():
                    findings.append(f"UNRESOLVED_MEDUSA_SKILL: {loc} - {skill_name} expected at {skill_dir}")
    return findings


def check_test_writing_vacuum(roots: list[tuple[Path, str]]) -> list[str]:
    findings = []
    for root, label in roots:
        for md in markdown_files(root):
            text = md.read_text()
            for pattern in TEST_WRITING_SMELLS:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    line_num = text[: match.start()].count("\n") + 1
                    findings.append(f"TEST_WRITING_SMELL: {format_location(md, line_num, label)} - matched {match.group(0)!r}")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", action="store_true", help="accepted for compatibility")
    parser.parse_args()

    manifest, manifest_error = load_installed_manifest()
    all_findings = [manifest_error] if manifest_error else []
    roots, root_findings = scan_roots(manifest)
    all_findings.extend(root_findings)

    print("=== Tribune Staleness Check ===")
    print(f"Repo root: {ROOT}")
    print(f"Doctrine: {DOCTRINE_DIR}")
    print(f"Active Consilium plugin source: {active_consilium_source()}")
    print("Scanning:")
    for root, label in roots:
        print(f"  - {label}: {root}")
    print()

    checks = [
        ("Banned-regex scan", lambda: check_banned_regex(roots)),
        ("Doctrine reference existence", lambda: check_doctrine_references(roots)),
        ("Medusa Rig skill existence", lambda: check_medusa_skills(roots, manifest)),
        ("Test-writing vacuum", lambda: check_test_writing_vacuum(roots)),
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
        return 1

    print("=== Clean ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
