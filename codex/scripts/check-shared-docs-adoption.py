#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "source"
COMMON = SOURCE / "doctrine" / "common.md"
KNOWN_GAPS = SOURCE / "doctrine" / "divinipress-known-gaps.md"
GENERATED_CODEX_AGENTS = ROOT / "generated" / "codex" / "agents"
INSTALLED_AGENTS = Path.home() / ".codex" / "agents"

REPO_SCAN_TARGETS = [
    ROOT / "source",
    ROOT / "generated" / "codex",
    ROOT / "generated" / "claude",
    ROOT / "runtimes",
    ROOT / "codex" / "scripts",
    ROOT / "codex" / "README.md",
    ROOT / "codex" / "evals" / "README.md",
]

TEXT_SUFFIXES = {".md", ".py", ".sh", ".toml", ".json", ".yaml", ".yml", ".txt"}

BANNED_PATTERNS = [
    (re.compile(r"/Users/milovan/projects/Consilium/codex/docs/consilium"), "local Codex docs/consilium path"),
    (re.compile(r"docs/consilium/debugging-cases"), "legacy debugging case path"),
    (re.compile(r"source/doctrine/divinipress-known-gaps\.md"), "local known-gaps doctrine path"),
    (re.compile(r"^## KG-", re.MULTILINE), "duplicated known-gap payload"),
    (re.compile(r"graphify", re.IGNORECASE), "graphify runtime reference"),
    (re.compile(r"mcp__graphify", re.IGNORECASE), "graphify MCP reference"),
    (re.compile(r"knowledge graph", re.IGNORECASE), "knowledge graph runtime reference"),
    (re.compile(r"query_graph", re.IGNORECASE), "graphify query_graph reference"),
    (re.compile(r"get_neighbors", re.IGNORECASE), "graphify get_neighbors reference"),
]

REQUIRED_COMMON_PATTERNS = [
    (re.compile(r'export CONSILIUM_DOCS="\$\{CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs\}"'), "exported default CONSILIUM_DOCS"),
    (re.compile(r'\[ -d "\$CONSILIUM_DOCS" \] \|\| \{ echo "consilium-docs not found at \$CONSILIUM_DOCS\. Set CONSILIUM_DOCS=<path>\."; exit 1; \}'), "directory existence guard"),
    (re.compile(r'head -1 "\$CONSILIUM_DOCS/CONVENTIONS\.md".*grep -q "consilium-docs CONVENTIONS"', re.DOTALL), "CONVENTIONS marker guard"),
    (re.compile(r'\[ ! -f "\$CONSILIUM_DOCS/\.migration-in-progress" \] \|\|', re.DOTALL), "migration lock guard"),
    (re.compile(r'routing work through a shared artifact'), "routing-through-shared-artifact trigger"),
    (re.compile(r'\$CONSILIUM_DOCS/scripts/case-new'), "case-new instruction"),
]

AGENT_REQUIRED_SNIPPETS = [
    "Shared Docs Runtime Law",
    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',
    "$CONSILIUM_DOCS/scripts/case-new",
]

KNOWN_GAPS_AGENT_FILES = {"consilium-consul.toml", "consilium-tribunus.toml"}


def generated_agent_files() -> list[Path]:
    return sorted(GENERATED_CODEX_AGENTS.glob("consilium-*.toml"))


def iter_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path]
    return sorted(
        p
        for p in path.rglob("*")
        if p.is_file()
        and "__pycache__" not in p.parts
        and p.suffix in TEXT_SUFFIXES
    )


def check_common() -> list[str]:
    text = COMMON.read_text()
    missing = [label for pattern, label in REQUIRED_COMMON_PATTERNS if pattern.search(text) is None]
    return [f"{COMMON}: missing required shared-docs guard clause: {label}" for label in missing]


def check_known_gaps() -> list[str]:
    text = KNOWN_GAPS.read_text()
    errors = []
    if "$CONSILIUM_DOCS/doctrine/known-gaps.md" not in text:
        errors.append(f"{KNOWN_GAPS}: missing shared known-gaps pointer")
    if re.search(r"^## KG-", text, flags=re.MULTILINE):
        errors.append(f"{KNOWN_GAPS}: contains duplicated known-gap entries")
    return errors


def check_agent_snippets(agent_files: list[Path]) -> list[str]:
    errors = []
    for path in agent_files:
        text = path.read_text(errors="ignore")
        for snippet in AGENT_REQUIRED_SNIPPETS:
            if snippet not in text:
                errors.append(f"{path}: missing generated shared-docs snippet: {snippet}")
        if path.name in KNOWN_GAPS_AGENT_FILES and "$CONSILIUM_DOCS/doctrine/known-gaps.md" not in text:
            errors.append(f"{path}: missing generated shared known-gaps pointer")
    return errors


def check_installed_parity(installed: list[Path]) -> list[str]:
    errors = []
    generated_by_name = {p.name: p for p in generated_agent_files()}
    installed_by_name = {p.name: p for p in installed}
    for name in sorted(generated_by_name.keys() & installed_by_name.keys()):
        generated_path = generated_by_name[name]
        installed_path = installed_by_name[name]
        if generated_path.read_bytes() != installed_path.read_bytes():
            errors.append(f"{installed_path}: differs from generated agent {generated_path}")
    return errors


def check_banned(paths: list[Path]) -> list[str]:
    errors = []
    self_path = Path(__file__).resolve()
    for target in paths:
        for path in iter_files(target):
            if path.resolve() == self_path:
                continue
            try:
                text = path.read_text(errors="ignore")
            except UnicodeDecodeError:
                continue
            for line_no, line in enumerate(text.splitlines(), start=1):
                for pattern, label in BANNED_PATTERNS:
                    if pattern.search(line):
                        errors.append(f"{path}:{line_no}: banned {label}: {line.strip()}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--installed", action="store_true", help="also scan installed ~/.codex/agents/consilium-*.toml")
    args = parser.parse_args()

    errors = []
    errors.extend(check_common())
    errors.extend(check_known_gaps())
    errors.extend(check_banned(REPO_SCAN_TARGETS))
    errors.extend(check_agent_snippets(generated_agent_files()))

    if args.installed:
        installed = sorted(INSTALLED_AGENTS.glob("consilium-*.toml"))
        if not installed:
            errors.append(f"{INSTALLED_AGENTS}: no installed consilium agent TOMLs found")
        else:
            generated_names = {p.name for p in generated_agent_files()}
            installed_names = {p.name for p in installed}
            missing = sorted(generated_names - installed_names)
            extra = sorted(installed_names - generated_names)
            if missing:
                errors.append(f"{INSTALLED_AGENTS}: missing installed generated agents: {', '.join(missing)}")
            if extra:
                errors.append(f"{INSTALLED_AGENTS}: extra installed Consilium agents: {', '.join(extra)}")
            errors.extend(check_installed_parity(installed))
            errors.extend(check_banned(installed))
            errors.extend(check_agent_snippets(installed))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Codex shared-docs adoption check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
