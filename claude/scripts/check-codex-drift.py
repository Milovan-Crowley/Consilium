#!/usr/bin/env python3
"""
check-codex-drift.py — verify Codex copies in Consilium agent files match canonical.

Six user-scope agents (censor, praetor, provocator, tribunus, soldier, custos) each
carry a full copy of the Consilium Codex in their system prompt. The canonical source
lives at docs/codex.md. This script detects drift.

Usage:
    python3 check-codex-drift.py              # report-only
    python3 check-codex-drift.py --verbose    # report + unified diff for drift cases
    python3 check-codex-drift.py --sync       # rewrite agent Codex sections from canonical

Exit codes:
    0 — all agents in sync
    1 — drift detected
    2 — missing file or extraction failure
"""
from __future__ import annotations

import argparse
import difflib
import sys
from pathlib import Path

CANONICAL = Path.home() / "projects" / "Consilium" / "docs" / "codex.md"
AGENTS_DIR = Path.home() / ".claude" / "agents"
AGENTS = ["censor", "praetor", "provocator", "tribunus", "soldier", "custos"]

CODEX_HEADER = "# The Codex of the Consilium"
OPS_NOTES_HEADER = "## Operational Notes"


def extract_codex(agent_file: Path) -> str | None:
    """Extract the Codex section from an agent file.

    Returns the Codex block as a normalized string, or None if no Codex section
    is found. Normalization strips trailing blank lines and trailing ``---``
    separators so it can be diffed against the canonical source cleanly.
    """
    content = agent_file.read_text()
    lines = content.split("\n")

    start: int | None = None
    end: int | None = None
    for i, line in enumerate(lines):
        if line == CODEX_HEADER and start is None:
            start = i
        elif line == OPS_NOTES_HEADER and start is not None:
            end = i
            break

    if start is None:
        return None
    if end is None:
        end = len(lines)

    section = lines[start:end]
    while section and section[-1].strip() in ("", "---"):
        section.pop()
    return "\n".join(section).rstrip() + "\n"


def normalize(text: str) -> str:
    """Normalize trailing whitespace for a clean comparison."""
    return text.rstrip() + "\n"


def sync_agent(agent_file: Path, canonical: str) -> bool:
    """Rewrite the Codex section of an agent file from the canonical source.

    Preserves everything before ``# The Codex of the Consilium`` and everything
    from ``## Operational Notes`` onward. Returns True on success.
    """
    content = agent_file.read_text()
    lines = content.split("\n")

    start: int | None = None
    end: int | None = None
    for i, line in enumerate(lines):
        if line == CODEX_HEADER and start is None:
            start = i
        elif line == OPS_NOTES_HEADER and start is not None:
            end = i
            break

    if start is None or end is None:
        return False

    prefix = lines[:start]
    suffix = lines[end:]
    canonical_lines = canonical.rstrip().split("\n")

    # Rebuild: prefix + canonical Codex + blank + "---" + blank + suffix (from "## Operational Notes")
    new_lines = prefix + canonical_lines + ["", "---", ""] + suffix
    agent_file.write_text("\n".join(new_lines))
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Consilium Codex drift across agent files.")
    parser.add_argument("--verbose", action="store_true", help="Show unified diff for drift cases")
    parser.add_argument("--sync", action="store_true", help="Rewrite agent Codex sections from canonical")
    args = parser.parse_args()

    if not CANONICAL.exists():
        print(f"ERROR: canonical Codex not found at {CANONICAL}", file=sys.stderr)
        return 2

    canonical = normalize(CANONICAL.read_text())
    drift_count = 0
    missing_count = 0

    for name in AGENTS:
        agent_file = AGENTS_DIR / f"consilium-{name}.md"

        if not agent_file.exists():
            print(f"MISSING: {agent_file}")
            missing_count += 1
            continue

        extracted = extract_codex(agent_file)
        if extracted is None:
            print(f"NO CODEX: consilium-{name} (no '{CODEX_HEADER}' header found)")
            missing_count += 1
            continue

        if normalize(extracted) == canonical:
            print(f"OK:      consilium-{name}")
            continue

        drift_count += 1
        if args.sync:
            if sync_agent(agent_file, canonical):
                print(f"SYNCED:  consilium-{name}")
            else:
                print(f"SYNC FAILED: consilium-{name}")
        else:
            print(f"DRIFT:   consilium-{name}")
            if args.verbose:
                diff = difflib.unified_diff(
                    canonical.splitlines(keepends=True),
                    normalize(extracted).splitlines(keepends=True),
                    fromfile="canonical",
                    tofile=f"consilium-{name}",
                    lineterm="",
                )
                for line in diff:
                    sys.stdout.write(line)
                    if not line.endswith("\n"):
                        sys.stdout.write("\n")

    print()
    if missing_count:
        print(f"Missing or malformed: {missing_count}", file=sys.stderr)
    if args.sync and drift_count:
        print(f"Synced {drift_count} agent(s) from canonical.")
        return 0
    if drift_count:
        print(f"Drift detected in {drift_count} agent(s). Re-run with --verbose for diffs or --sync to fix.", file=sys.stderr)
        return 1
    if missing_count:
        return 2
    print(f"All {len(AGENTS)} agents in sync with canonical Codex.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
