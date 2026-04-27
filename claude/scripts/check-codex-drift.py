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
AGENTS = [
    "censor",
    "praetor",
    "provocator",
    "tribunus",
    "soldier",
    "custos",
    "provocator-overconfidence",
    "provocator-assumption",
    "provocator-failure-mode",
    "provocator-edge-case",
    "provocator-negative-claim",
]

# Lane agents share a canonical persona file. Persona-body drift detection
# is scoped to these agents only; the 6 original agents above keep Codex-only
# coverage (their per-persona drift is a documented gap — see CLAUDE.md).
LANE_AGENTS = [
    "provocator-overconfidence",
    "provocator-assumption",
    "provocator-failure-mode",
    "provocator-edge-case",
    "provocator-negative-claim",
]
CANONICAL_PERSONA = (
    Path.home() / "projects" / "Consilium" / "claude" / "skills"
    / "references" / "personas" / "provocator.md"
)
PERSONA_START = "## Creed"
PERSONA_END = "## Operational Doctrine"

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


def extract_persona_body(file: Path) -> str | None:
    """Extract the shared persona body from a file.

    The body lives between ``## Creed`` (inclusive) and ``## Operational Doctrine``
    (exclusive). This is the section all 5 Provocator lane agents share verbatim
    with the canonical persona at ``personas/provocator.md``.

    **Anchor contract.** The end anchor matches via ``startswith(PERSONA_END)``
    so that lane agents (whose section is ``## Operational Doctrine — <Lane>``)
    terminate at the same boundary as the canonical (whose section is exactly
    ``## Operational Doctrine``). The contract this rests on: **the canonical
    persona body MUST NOT contain ``## Operational Doctrine`` as a heading
    prefix anywhere except at the terminating boundary.** A future revision
    that adds e.g. ``## Operational Doctrine for Campaign Notes`` inside the
    persona body would silently truncate extraction. If such a structural
    change is ever needed, this function must move to ``==`` matching against
    an exact terminator string at the same time.

    Returns the body block as a normalized string, or None if either anchor
    is missing.
    """
    content = file.read_text()
    lines = content.split("\n")

    start: int | None = None
    end: int | None = None
    for i, line in enumerate(lines):
        if line.strip() == PERSONA_START and start is None:
            start = i
        elif line.strip().startswith(PERSONA_END) and start is not None:
            end = i
            break

    if start is None or end is None:
        return None

    section = lines[start:end]
    while section and section[-1].strip() in ("", "---"):
        section.pop()
    return "\n".join(section).rstrip() + "\n"


def check_lane_persona_drift(verbose: bool) -> int:
    """Check persona-body drift across the 5 Provocator lane agents.

    Returns the number of lane agents with persona-body drift detected.
    Returns -1 if the canonical persona cannot be extracted at all.
    Prints a per-agent status line for each lane agent. Does NOT support
    ``--sync`` for the persona body in v1; report-only.
    """
    if not CANONICAL_PERSONA.exists():
        print(f"ERROR: canonical persona not found at {CANONICAL_PERSONA}", file=sys.stderr)
        return -1

    canonical = extract_persona_body(CANONICAL_PERSONA)
    if canonical is None:
        print(
            f"ERROR: could not extract persona body from {CANONICAL_PERSONA} "
            f"(missing '{PERSONA_START}' or '{PERSONA_END}' anchor)",
            file=sys.stderr,
        )
        return -1

    drift_count = 0
    for name in LANE_AGENTS:
        agent_file = AGENTS_DIR / f"consilium-{name}.md"
        if not agent_file.exists():
            print(f"PERSONA MISSING: {agent_file}")
            continue

        extracted = extract_persona_body(agent_file)
        if extracted is None:
            print(f"PERSONA NO BODY: consilium-{name}")
            continue

        if normalize(extracted) == normalize(canonical):
            print(f"PERSONA OK:    consilium-{name}")
            continue

        drift_count += 1
        print(f"PERSONA DRIFT: consilium-{name}")
        if verbose:
            diff = difflib.unified_diff(
                normalize(canonical).splitlines(keepends=True),
                normalize(extracted).splitlines(keepends=True),
                fromfile="canonical-persona",
                tofile=f"consilium-{name}-persona",
                lineterm="",
            )
            for line in diff:
                sys.stdout.write(line)
                if not line.endswith("\n"):
                    sys.stdout.write("\n")

    return drift_count


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

    # Lane persona-body drift check (5 Provocator lane agents only)
    print("--- Lane persona-body drift check ---")
    persona_drift = check_lane_persona_drift(args.verbose)
    print()

    # Codex sync path: if --sync requested and there is Codex drift, sync first.
    # Persona body is never auto-synced in v1; report persona drift (or check failure)
    # separately and let the unified exit logic below decide the code.
    if args.sync and drift_count:
        print(f"Synced {drift_count} agent(s) from canonical Codex.")
        drift_count = 0  # Sync resolved the Codex drift; treat as clean for exit code.
        if persona_drift > 0:
            print(f"NOTE: --sync only addresses Codex drift; persona-body drift in {persona_drift} lane agent(s) remains and requires manual re-construction (re-run the matching plan task's Step 3 Bash construction).", file=sys.stderr)

    # Unified exit-code priority:
    #   2 — any file missing/malformed (Codex side OR persona-body anchor failure)
    #   1 — drift detected (Codex side OR persona-body) and not fully resolved
    #   0 — clean (no drift, no missing files)

    if missing_count:
        print(f"Codex missing or malformed: {missing_count}", file=sys.stderr)
    if persona_drift > 0:
        print(f"Persona-body drift detected in {persona_drift} lane agent(s). Re-run with --verbose for diffs.", file=sys.stderr)
    if persona_drift < 0:
        print("Persona-body check failed (canonical persona missing or anchors malformed).", file=sys.stderr)

    if missing_count or persona_drift < 0:
        return 2
    if drift_count or persona_drift > 0:
        if drift_count:
            print(f"Codex drift detected in {drift_count} agent(s). Re-run with --verbose for diffs or --sync to fix.", file=sys.stderr)
        return 1
    print(f"All {len(AGENTS)} agents in sync with canonical Codex; all {len(LANE_AGENTS)} lane agents in sync with canonical persona body.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
