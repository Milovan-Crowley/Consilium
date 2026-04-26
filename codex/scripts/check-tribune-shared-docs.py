#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = ROOT / "skills" / "tribune"
SKILL = SKILL_DIR / "SKILL.md"
INSTALL_TARGET = Path.home() / ".agents" / "skills" / "tribune"
CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", "/Users/milovan/projects/Consilium/docs"))

SCAN_TARGETS = [
    SKILL_DIR,
    ROOT / "source" / "protocols" / "consul-routing.md",
    ROOT / "source" / "protocols" / "legatus-routing.md",
    ROOT / "source" / "roles" / "tribunus.md",
    ROOT / "evals" / "tasks" / "10-tribune-initial-diagnosis.md",
    ROOT / "evals" / "tasks" / "11-storefront-debugging.md",
    ROOT / "evals" / "tasks" / "12-admin-debugging.md",
    ROOT / "evals" / "tasks" / "13-medusa-backend-debugging.md",
    ROOT / "evals" / "tasks" / "14-known-gap-discipline.md",
    ROOT / "evals" / "tasks" / "15-admin-hold-debugging.md",
    ROOT / "evals" / "tasks" / "16-install-staleness.md",
    ROOT / "evals" / "tasks" / "17-debugger-routing.md",
    ROOT / "evals" / "tasks" / "18-feedback-loop.md",
]

TEXT_SUFFIXES = {".md", ".yaml", ".yml", ".sh", ".txt"}

def joined(*parts: str) -> str:
    return "/".join(parts)


BANNED_PATTERNS = [
    (re.compile(re.escape(joined("docs", "consilium", "debugging-cases"))), "legacy debugging case path"),
    (re.compile(re.escape(joined("source", "doctrine", "divinipress-known-gaps")) + r"\.md"), "local known-gaps doctrine path"),
    (re.compile(re.escape(joined("skills", "tribune", "references"))), "local Tribune references directory"),
    (re.compile(r"references/[A-Za-z0-9_-]+\.md"), "local Tribune reference file"),
    (re.compile(r"\$CONSILIUM_DOCS/cases/<slug>"), "undated placeholder case path"),
    (re.compile(r"\$CONSILIUM_DOCS/cases/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?"), "undated shell-variable case path"),
    (re.compile(r"\$CONSILIUM_DOCS/cases/(?!$|`|['\"]|\s|\*|<dated-slug>|\d{4}-\d{2}-\d{2}-)[A-Za-z][A-Za-z0-9_-]*(?:/diagnosis\.md)?"), "literal undated case path"),
    (re.compile(r"Fix size threshold"), "old 13-field packet wording"),
    (re.compile(r"consilium:gladius"), "old Consilium skill call"),
    (re.compile(r"consilium:sententia"), "old Consilium skill call"),
    (re.compile(r"skills/debugging/systematic-debugging"), "old copied debugger path"),
]

REQUIRED_SKILL_SNIPPETS = [
    "Phase 0 - Resolve `$CONSILIUM_DOCS`",
    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',
    "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md",
    "$CONSILIUM_DOCS/doctrine/fix-thresholds.md",
    "$CONSILIUM_DOCS/doctrine/lane-classification.md",
    "$CONSILIUM_DOCS/doctrine/known-gaps.md",
    "$CONSILIUM_DOCS/scripts/case-new",
    "--agent codex --type bug",
    "Contract compatibility evidence",
]

PACKET_FIELDS = [
    "Symptom",
    "Reproduction",
    "Affected lane",
    "Files/routes inspected",
    "Failing boundary",
    "Root-cause hypothesis",
    "Supporting evidence",
    "Contrary evidence",
    "Known gap considered",
    "Proposed fix site",
    "Fix threshold",
    "Verification plan",
    "Open uncertainty",
    "Contract compatibility evidence",
]


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


def check_shared_docs_root() -> list[str]:
    errors = []
    marker = CONSILIUM_DOCS / "CONVENTIONS.md"
    if not CONSILIUM_DOCS.is_dir():
        return [f"{CONSILIUM_DOCS}: consilium-docs checkout missing"]
    if not marker.is_file() or "consilium-docs CONVENTIONS" not in marker.read_text().splitlines()[0]:
        errors.append(f"{marker}: missing consilium-docs CONVENTIONS marker")
    if (CONSILIUM_DOCS / ".migration-in-progress").exists():
        errors.append(f"{CONSILIUM_DOCS}: migration lock exists")
    if not (CONSILIUM_DOCS / "scripts" / "case-new").is_file():
        errors.append(f"{CONSILIUM_DOCS / 'scripts' / 'case-new'}: missing case-new script")
    return errors


def check_banned() -> list[str]:
    errors = []
    for target in SCAN_TARGETS:
        for path in iter_files(target):
            text = path.read_text(errors="ignore")
            for line_no, line in enumerate(text.splitlines(), start=1):
                for pattern, label in BANNED_PATTERNS:
                    if pattern.search(line):
                        errors.append(f"{path}:{line_no}: banned {label}: {line.strip()}")
    return errors


def check_skill_contract() -> list[str]:
    text = SKILL.read_text()
    errors = []
    for snippet in REQUIRED_SKILL_SNIPPETS:
        if snippet not in text:
            errors.append(f"{SKILL}: missing required snippet: {snippet}")
    for field in PACKET_FIELDS:
        if field not in text:
            errors.append(f"{SKILL}: missing packet field: {field}")
    if (SKILL_DIR / "references").exists():
        errors.append(f"{SKILL_DIR / 'references'}: local reference directory must be removed")
    return errors


def check_core_debug_contract() -> list[str]:
    errors = []
    core_paths = [
        ROOT / "source" / "protocols" / "consul-routing.md",
        ROOT / "source" / "protocols" / "legatus-routing.md",
        ROOT / "source" / "roles" / "tribunus.md",
    ]
    for path in core_paths:
        text = path.read_text()
        for field in PACKET_FIELDS:
            if field not in text:
                errors.append(f"{path}: missing packet field: {field}")
        if "$CONSILIUM_DOCS/doctrine/fix-thresholds.md" not in text:
            errors.append(f"{path}: missing shared fix-thresholds reference")
        if "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md" not in text:
            errors.append(f"{path}: missing shared diagnosis-packet reference")
    return errors


def check_eval_contract() -> list[str]:
    errors = []
    shared_eval_snippets = [
        "resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case",
        "uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet",
        "Contract compatibility evidence",
        "$CONSILIUM_DOCS/scripts/case-new",
        "--agent codex --type bug",
    ]
    eval_paths = [
        ROOT / "evals" / "tasks" / "10-tribune-initial-diagnosis.md",
        ROOT / "evals" / "tasks" / "11-storefront-debugging.md",
        ROOT / "evals" / "tasks" / "12-admin-debugging.md",
        ROOT / "evals" / "tasks" / "13-medusa-backend-debugging.md",
        ROOT / "evals" / "tasks" / "14-known-gap-discipline.md",
        ROOT / "evals" / "tasks" / "15-admin-hold-debugging.md",
        ROOT / "evals" / "tasks" / "16-install-staleness.md",
        ROOT / "evals" / "tasks" / "17-debugger-routing.md",
    ]
    for path in eval_paths:
        text = path.read_text()
        for snippet in shared_eval_snippets:
            if snippet not in text:
                errors.append(f"{path}: missing shared-docs eval snippet: {snippet}")

    eval_18 = ROOT / "evals" / "tasks" / "18-feedback-loop.md"
    text = eval_18.read_text()
    required = [
        "$CONSILIUM_DOCS/cases/",
        "$CONSILIUM_DOCS/doctrine/known-gaps.md",
        "case-new",
        "agent: codex",
    ]
    for snippet in required:
        if snippet not in text:
            errors.append(f"{eval_18}: missing shared feedback-loop snippet: {snippet}")
    return errors


def check_case_fixture() -> list[str]:
    errors = []
    source_script = CONSILIUM_DOCS / "scripts" / "case-new"
    with tempfile.TemporaryDirectory(prefix="tribune-case-fixture-") as tmp:
        root = Path(tmp)
        (root / "scripts").mkdir()
        (root / "CONVENTIONS.md").write_text("<!-- consilium-docs CONVENTIONS — fixture marker -->\n")
        shutil.copy2(source_script, root / "scripts" / "case-new")
        env = os.environ.copy()
        env["CONSILIUM_DOCS"] = str(root)
        result = subprocess.run(
            [str(root / "scripts" / "case-new"), "tribune-fixture", "--target", "consilium", "--agent", "codex", "--type", "bug"],
            cwd=str(root),
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            return [f"case fixture failed: {result.stderr.strip() or result.stdout.strip()}"]
        case_path = Path(result.stdout.strip())
        if not str(case_path).startswith(str(root / "cases")):
            errors.append(f"case fixture wrote outside temp cases dir: {case_path}")
        if not re.match(r"\d{4}-\d{2}-\d{2}-tribune-fixture", case_path.name):
            errors.append(f"case fixture did not create a dated folder: {case_path.name}")
        status = case_path / "STATUS.md"
        diagnosis = case_path / "diagnosis.md"
        if not status.is_file():
            errors.append(f"case fixture missing {status}")
        else:
            status_text = status.read_text()
            for snippet in ("target: consilium", "agent: codex", "type: bug", "status: draft"):
                if snippet not in status_text:
                    errors.append(f"{status}: missing {snippet}")
        if not diagnosis.is_file():
            errors.append(f"case fixture missing {diagnosis}")
    return errors


def check_installed() -> list[str]:
    if not INSTALL_TARGET.is_symlink():
        return [f"{INSTALL_TARGET}: expected symlink to Tribune skill source"]
    resolved = INSTALL_TARGET.resolve()
    if resolved != SKILL_DIR.resolve():
        return [f"{INSTALL_TARGET}: points to {resolved}, expected {SKILL_DIR}"]
    return []


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--installed", action="store_true", help="also verify installed Tribune skill symlink")
    args = parser.parse_args()

    errors = []
    errors.extend(check_shared_docs_root())
    errors.extend(check_banned())
    errors.extend(check_skill_contract())
    errors.extend(check_core_debug_contract())
    errors.extend(check_eval_contract())
    errors.extend(check_case_fixture())
    if args.installed:
        errors.extend(check_installed())

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Codex Tribune shared-docs check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())