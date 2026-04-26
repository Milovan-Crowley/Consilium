# Codex Tribune Shared Docs Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Codex Tribune debugging skill and Codex debug-routing surfaces onto `$CONSILIUM_DOCS` so diagnosis packets, case folders, known gaps, and fix thresholds match the shared Consilium docs model.

**Architecture:** Keep Codex prompt source in `/Users/milovan/projects/Consilium-codex/source/`, but make debugging workflow doctrine runtime-shared through `$CONSILIUM_DOCS/doctrine/`. Replace the copied Tribune reference docs with shared-doctrine loading, add a validator that proves stale local paths cannot return, regenerate/install affected Codex agents, and update the installed Tribune skill gate.

**Tech Stack:** Markdown skill and prompt source, Bash installers, Python validation fixture, generated TOML agents, shared Consilium docs case scripts.

---

## Scope

> **Confidence: High** - Verified against the live Codex repo after Piece 1 landed.

In scope:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/*.md`
- `/Users/milovan/projects/Consilium-codex/scripts/install-codex-skills.sh`
- `/Users/milovan/projects/Consilium-codex/scripts/check-tribune-shared-docs.py`
- `/Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md`
- `/Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md`
- `/Users/milovan/projects/Consilium-codex/source/roles/tribunus.md`
- `/Users/milovan/projects/Consilium-codex/evals/tasks/10-tribune-initial-diagnosis.md` through `/Users/milovan/projects/Consilium-codex/evals/tasks/18-feedback-loop.md`
- Generated `/Users/milovan/projects/Consilium-codex/agents/consilium-*.toml`
- Installed `/Users/milovan/.codex/agents/consilium-*.toml`
- Installed skill symlink `/Users/milovan/.agents/skills/tribune`
- `/Users/milovan/projects/consilium-docs/INDEX.md`
- `/Users/milovan/projects/consilium-docs/cases/2026-04-24-codex-consilium-docs-adoption/STATUS.md`

Out of scope:

- Changing Claude-side Consilium or `~/.claude/agents`.
- Deleting historical `/Users/milovan/projects/Consilium-codex/docs/consilium/` files.
- Reworking non-debug Consilium routing outside the three named core debug-routing files.
- Changing shared docs conventions unless a validator proves the existing convention is impossible to satisfy.

## Task 1: Preflight Piece 2 From A Clean Codex Repo

> **Confidence: High** - The commands prove Piece 1 is active and avoid mixing unrelated docs repo state into this lane.

**Files:**

- Read: `/Users/milovan/projects/Consilium-codex`
- Read: `/Users/milovan/projects/consilium-docs`

- [ ] **Step 1: Resolve shared docs**

Run:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS"; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS" || { echo "$CONSILIUM_DOCS is not a consilium-docs checkout"; exit 1; }
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || { echo "consilium-docs migration in progress"; exit 1; }
```

Expected: command exits 0.

- [ ] **Step 2: Verify Codex repo starts clean**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex status --short
```

Expected: no output. If output exists, halt and inspect before continuing.

- [ ] **Step 3: Record docs repo unrelated state but do not clean it**

Run:

```bash
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: unrelated local state may include `?? .serena/`. Do not delete, stage, or commit unrelated docs repo files.

- [ ] **Step 4: Prove Piece 1 gates still pass**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-shared-docs-adoption.py
python3 scripts/check-shared-docs-adoption.py --installed
```

Expected: both commands print `Codex shared-docs adoption check passed.`

- [ ] **Step 5: Inventory current Piece 2 stale references**

Run:

```bash
rg -n 'docs/consilium/debugging-cases|source/doctrine/divinipress-known-gaps\.md|skills/tribune/references|references/[A-Za-z0-9_-]+\.md|Fix size threshold' \
  /Users/milovan/projects/Consilium-codex/skills/tribune \
  /Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md \
  /Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md \
  /Users/milovan/projects/Consilium-codex/source/roles/tribunus.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/10-tribune-initial-diagnosis.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/11-storefront-debugging.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/12-admin-debugging.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/13-medusa-backend-debugging.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/14-known-gap-discipline.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/15-admin-hold-debugging.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/16-install-staleness.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/17-debugger-routing.md \
  /Users/milovan/projects/Consilium-codex/evals/tasks/18-feedback-loop.md
```

Expected before implementation: hits exist in the Tribune skill, local copied references, core debug routing, or eval 18. This is observational only; later tasks remove these hits.

## Task 2: Rewrite The Tribune Skill Around Shared Docs

> **Confidence: High** - `skills/tribune/SKILL.md` is the Codex Tribune skill entrypoint, and the shared doctrine files exist under `$CONSILIUM_DOCS/doctrine/`.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`

**Execution warning:** `/Users/milovan/.agents/skills/tribune` is a symlink to the source skill. After Step 1 rewrites `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`, do not start a fresh Codex session or invoke Tribune from another session until Task 7 regenerates and installs the generated agents. If execution is interrupted in this window, resume in the same session and complete Task 7 before treating Codex Tribune as ready.

- [ ] **Step 1: Replace the entire Tribune skill**

Replace `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md` with:

````markdown
---
name: tribune
description: Use when encountering any bug, test failure, build failure, flaky behavior, regression, or unexpected behavior in Consilium Codex before proposing fixes. Produces shared-docs diagnosis packets and routes fixes through existing Consilium ranks.
---

# Tribune Debugging

## Iron Law

No fix begins until the root cause has been investigated and the diagnosis packet is explicit.

No fix is called verified until the evidence, route, and verification plan have been stated.

Tribune is the debugging workflow skill. It is not a new agent rank, and it does not replace `consilium-tribunus`.

## Phase 0 - Resolve `$CONSILIUM_DOCS`

Before reading shared doctrine, scanning contained cases, creating a diagnosis case, invoking `$CONSILIUM_DOCS/scripts/case-new`, reading known gaps, or routing a fix from a shared case artifact, run:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
```

If the guard fails, halt and report the exact failure. Do not fall back to the Codex repo's historical local docs or copied local reference files.

## When To Use

Use this skill for:

- Bugs
- Test failures
- Build failures
- Flaky behavior
- Production regressions
- Unexpected frontend, admin, or backend behavior
- Any moment where the user says to stop guessing

Use it especially when a fix looks obvious. Obvious fixes are allowed only after the failing boundary is proven.

## Non-Negotiables

- Do not edit before evidence gathering unless the user asks for emergency containment.
- Do not treat frontend gates as backend authorization.
- Do not treat stale docs or known gaps as current truth without rechecking live code.
- Do not collapse this workflow into `consilium-tribunus`; Tribunus verifies bounded packets and completed tasks.
- Do not create a debugger agent unless evals later prove existing ranks cannot carry the workflow.
- Do not write undated case folders under `$CONSILIUM_DOCS/cases/`.

## Workflow

1. Run Phase 0.
2. Scan contained cases using `$CONSILIUM_DOCS/CONVENTIONS.md` Phase 1 rules.
3. Classify the lane using `$CONSILIUM_DOCS/doctrine/lane-classification.md`.
4. Load shared doctrine for the lane.
5. Gather evidence:
   - exact command, URL, screenshot, trace, log, stack, or reproduction
   - changed files or recent commits when available
   - relevant live code paths
   - contrary evidence checked
6. Trace the failing boundary:
   - browser to frontend hook
   - frontend client to backend route
   - route to workflow
   - workflow to module or link
   - query layer to data shape
   - generated or external system boundary
7. Produce the 14-field diagnosis packet.
8. Ask `consilium-tribunus` and `consilium-provocator` to verify the diagnosis packet when subagent dispatch is available before any fix route is executed.
9. Persist the diagnosis packet to a dated shared case folder before the Imperator gate.
10. Route the fix by threshold from `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`.
11. Verify the completed fix with a command, trace, test, or targeted manual check that matches the failure.

## Phase 1 Contained Case Scan

Scan `$CONSILIUM_DOCS/cases/*/STATUS.md` before new diagnosis when the user invokes Tribune.

Surface a contained case only when all three conditions from `$CONSILIUM_DOCS/CONVENTIONS.md` are true:

1. `STATUS.md` frontmatter has `status: contained`.
2. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`.
3. No later case has a `Resolves: <slug>` field naming the current case slug.

Draft cases older than 7 days may be marked `abandoned` only when the Imperator never approved or rejected them.

## Shared Doctrine Loading

Always read:

- `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`
- `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- `$CONSILIUM_DOCS/doctrine/lane-classification.md`
- `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`
- `$CONSILIUM_DOCS/doctrine/known-gaps.md`

Then read exactly the matching lane guide:

- `storefront` -> `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-debugging.md`
- `storefront-super-admin` -> `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-super-admin-debugging.md`
- `admin-dashboard` -> `$CONSILIUM_DOCS/doctrine/lane-guides/admin-debugging.md`
- `medusa-backend` -> `$CONSILIUM_DOCS/doctrine/lane-guides/medusa-backend-debugging.md`
- `cross-repo` -> `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md`
- `unknown` -> `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md` until classified

Codex skill crosswalk for Medusa doctrine:

- `storefront` and `storefront-super-admin`: use `building-storefronts`
- `admin-dashboard`: use `building-admin-dashboard-customizations` and `building-with-medusa`
- `medusa-backend`: use `building-with-medusa`
- `cross-repo` and `unknown`: use `building-storefronts` and `building-with-medusa`

The shared lane guide may describe prefixed Rig names from another runtime. In Codex, load the Codex skill names above.

## Known-Gap Discipline

Known gaps are hypothesis accelerators, not proof.

When a known gap appears relevant:

1. Read `$CONSILIUM_DOCS/doctrine/known-gaps.md`.
2. Filter to the current lane or multi-lane entries containing the current lane.
3. Recheck the current repo evidence before using the known gap.
4. Write packet field 9 with `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`.

Using a known gap as evidence without live recheck is a diagnosis MISUNDERSTANDING.

## Diagnosis Packet

Every diagnosis packet must include all 14 fields from `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`:

1. Symptom
2. Reproduction
3. Affected lane
4. Files/routes inspected
5. Failing boundary
6. Root-cause hypothesis
7. Supporting evidence
8. Contrary evidence
9. Known gap considered
10. Proposed fix site
11. Fix threshold
12. Verification plan
13. Open uncertainty
14. Contract compatibility evidence

Field 14 is required when `Affected lane` is `cross-repo` or when the threshold is `medium` on cross-repo scope. `medium` cross-repo fixes require `backward-compatible` evidence. `breaking` means the fix threshold is `large`.

If any required field is missing, keep diagnosing.

## Shared Case Creation

Persist bug diagnosis packets with `$CONSILIUM_DOCS/scripts/case-new`. Run Phase 0 immediately before invoking the script.

Use this pattern:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
case_path="$("$CONSILIUM_DOCS/scripts/case-new" "$slug" --target "$target" --agent codex --type bug)"
printf '%s\n' "$case_path"
```

Capture the returned dated folder path and write the packet to `$case_path/diagnosis.md`. Do not construct an undated case path by hand.

Update `$case_path/STATUS.md` by rewriting YAML frontmatter. Do not append a second status block.

## Fix Routing

Use `$CONSILIUM_DOCS/doctrine/fix-thresholds.md` for threshold meaning:

- `small`
- `medium`
- `large`
- `contain`

Before implementation, route the diagnosis packet to `consilium-tribunus` and `consilium-provocator` when dispatch is available.

Routing rule:

- `SOUND` from both verifiers unlocks fix routing.
- `CONCERN` from either verifier unlocks fix routing only when the concern is explicitly accepted or mitigated.
- `GAP` from either verifier sends the workflow back to diagnosis.
- `MISUNDERSTANDING` from either verifier halts and escalates to the Imperator.
- If dispatch is unavailable, say the diagnosis is unverified and ask whether to proceed, dispatch, or keep diagnosing.

Fix execution rule:

- `small`: route one bounded task through `consilium-legatus`.
- `medium`: write a short implementation plan, then route through `consilium-legatus`.
- `large`: escalate to `consilium-consul`; use the shared case file as input to a fresh spec.
- `contain`: apply reversible containment only when the Imperator confirms emergency containment; leave the case `status: contained`.

## Emergency Containment

Containment is allowed only when real business impact requires immediate harm reduction.

Containment must be:

- labeled as containment
- reversible
- minimal
- followed by the normal diagnosis workflow

Containment does not close the bug.

## Stop Rules

Stop and re-diagnose when:

- two fix attempts fail
- the root cause changes after new evidence
- the fix touches permissions, tenant scope, money, checkout, proof status, or order lifecycle without backend truth
- a storefront symptom depends on backend contract truth
- the evidence only proves where the bug appeared, not where it originated

After three failed fix attempts, stop and question the architecture before another code change.

## Output To User

Before implementation, report:

- verified diagnosis, or unverified diagnosis if verification is not available
- why the suspected boundary is the boundary
- which rank should handle the fix
- `small`, `medium`, `large`, or `contain` fix threshold
- exact verification command or check
- shared case path once the diagnosis is persisted

Do not present a guess as a verified diagnosis.
````

- [ ] **Step 2: Verify no local reference loading remains in the skill**

Run:

```bash
if rg -n 'references/[A-Za-z0-9_-]+\.md|skills/tribune/references|docs/consilium/debugging-cases|source/doctrine/divinipress-known-gaps\.md|Fix size threshold' /Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md; then
  echo "Tribune skill still references stale local docs." >&2
  exit 1
fi
rg -n 'CONSILIUM_DOCS|diagnosis-packet.md|fix-thresholds.md|lane-classification.md|known-gaps.md|case-new|Contract compatibility evidence' /Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md
```

Expected: first command has no stale hits; second command shows the shared-docs markers.

## Task 3: Replace Skill Install Validation With A Shared-Docs Gate

> **Confidence: High** - `scripts/install-codex-skills.sh` is the supported Tribune install path, and Piece 2 needs a reusable stale-reference plus temp-case fixture gate.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/scripts/check-tribune-shared-docs.py`
- Modify: `/Users/milovan/projects/Consilium-codex/scripts/install-codex-skills.sh`

- [ ] **Step 1: Create the Tribune shared-docs validator**

Create `/Users/milovan/projects/Consilium-codex/scripts/check-tribune-shared-docs.py`:

```python
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
CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", "/Users/milovan/projects/consilium-docs"))

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
    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"',
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
```

- [ ] **Step 2: Make the validator executable**

Run:

```bash
chmod +x /Users/milovan/projects/Consilium-codex/scripts/check-tribune-shared-docs.py
```

- [ ] **Step 3: Remove local-reference validation from the skill installer**

In `/Users/milovan/projects/Consilium-codex/scripts/install-codex-skills.sh`, delete the Python block that requires:

```python
refs = src / "references"
if not refs.is_dir():
    raise SystemExit(f"Missing {refs}")

missing_refs = []
for line in text.splitlines():
    marker = "references/"
    if marker not in line:
        continue
    tail = line.split(marker, 1)[1]
    name = tail.split("`", 1)[0].split(")", 1)[0].split(" ", 1)[0]
    if name.endswith(".md") and not (refs / name).is_file():
        missing_refs.append(name)

if missing_refs:
    raise SystemExit("Missing referenced files: " + ", ".join(sorted(set(missing_refs))))
```

- [ ] **Step 4: Keep the installer regex narrow and delegate shared-docs stale checks**

Do not add shared-docs stale-reference tokens directly to `banned_regex` in `/Users/milovan/projects/Consilium-codex/scripts/install-codex-skills.sh`. Piece 1's core adoption validator scans `scripts/`, so raw banned strings in this installer would make `scripts/check-shared-docs-adoption.py` fail.

Leave the existing installer regex in place:

```bash
banned_regex='/Users/jesse|CLAUDE|Claude|Lace|skills/debugging/systematic-debugging|consilium:gladius|consilium:sententia'
```

The new `scripts/check-tribune-shared-docs.py` owns shared-docs stale-reference validation.

- [ ] **Step 5: Call the validator before install and after symlink verification**

In `/Users/milovan/projects/Consilium-codex/scripts/install-codex-skills.sh`, after the Markdown-table check and before the non-symlink target check, add:

```bash
python3 "$repo_root/scripts/check-tribune-shared-docs.py"
```

After the `readlink` verification block and before the final `echo`, add:

```bash
python3 "$repo_root/scripts/check-tribune-shared-docs.py" --installed
```

- [ ] **Step 6: Check validator syntax**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 -m py_compile scripts/check-tribune-shared-docs.py
```

Expected: command exits 0.

## Task 4: Remove Copied Tribune Reference Docs

> **Confidence: High** - The rewritten skill loads shared doctrine directly and no longer references local copied docs.

**Files:**

- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/admin-debugging.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/condition-based-waiting.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/core-debugging.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/defense-in-depth.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/dispatch-rules.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/eval-seeds.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/known-gaps-protocol.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/medusa-backend-debugging.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/root-cause-tracing.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/storefront-debugging.md`

- [ ] **Step 1: Delete the tracked copied reference files**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex rm /Users/milovan/projects/Consilium-codex/skills/tribune/references/*.md
```

Expected: the ten listed reference docs are staged for deletion.

- [ ] **Step 2: Verify only the helper script remains under the Tribune skill package besides SKILL and metadata**

Run:

```bash
fd . /Users/milovan/projects/Consilium-codex/skills/tribune -t f -d 3
```

Expected files:

```text
/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md
/Users/milovan/projects/Consilium-codex/skills/tribune/agents/openai.yaml
/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/find-test-polluter.sh
```

## Task 5: Align Core Debug Routing With The 14-Field Shared Packet

> **Confidence: High** - These three prompt-source files carry Codex debug-routing behavior and generated-agent output depends on them.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md`
- Modify: `/Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md`
- Modify: `/Users/milovan/projects/Consilium-codex/source/roles/tribunus.md`

- [ ] **Step 1: Replace the Consul debugging route**

In `/Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md`, replace the entire `## Debugging And Tribune Routing` section through the `Runtime note:` bullet with:

````markdown
## Debugging And Tribune Routing

Trigger this route when the user names `tribune`, `consilium:tribune`, `$tribune`, bug, test failure, build failure, flaky behavior, production issue, regression, unexpected behavior, or says to stop guessing.

Debugging sequence:
- Resolve `$CONSILIUM_DOCS` before shared doctrine reads, contained-case scans, or case creation.
- Load the Tribune skill only when the runtime skill source resolves to `/Users/milovan/projects/Consilium-codex/skills/tribune`.
- If the runtime Tribune resolves to `/Users/milovan/projects/Consilium/skills/tribune` or any other non-Codex path, treat Codex Tribune as unavailable and use the 14-field diagnosis packet inline from `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`.
- Read `$CONSILIUM_DOCS/doctrine/lane-classification.md`, `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`, `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`, and the matching `$CONSILIUM_DOCS/doctrine/lane-guides/*.md` file.
- Produce a diagnosis packet before proposing a code fix.
- Persist bug diagnosis packets through `$CONSILIUM_DOCS/scripts/case-new <slug> --target <target> --agent codex --type bug` and capture the returned dated case folder.
- Keep the active model or Consul responsible for synthesis, user-facing decisions, and the diagnosis packet.
- Use Interpres when the question is domain meaning, status meaning, role meaning, or canonical surface ownership.
- Use Speculator when the question is exact file, symbol, route, workflow, module, hook, payload, or execution-path truth.
- Use Arbiter when the failure may be frontend-backend contract drift.
- Send the bounded diagnosis packet to `consilium-tribunus` and `consilium-provocator` when dispatch is available before routing a fix.
- Treat `consilium-tribunus` as verifier only. It checks the diagnosis packet and completed implementation tasks. It does not become the debugger and does not execute fixes.

Diagnosis packet fields:
- Symptom
- Reproduction
- Affected lane
- Files/routes inspected
- Failing boundary
- Root-cause hypothesis
- Supporting evidence
- Contrary evidence
- Known gap considered
- Proposed fix site
- Fix threshold
- Verification plan
- Open uncertainty
- Contract compatibility evidence

Diagnosis gate:
- `SOUND` from both verifiers unlocks fix routing.
- `CONCERN` from either verifier unlocks fix routing only when the concern is explicitly accepted or mitigated.
- `GAP` from either verifier sends the workflow back to diagnosis.
- `MISUNDERSTANDING` from either verifier halts and escalates to the Imperator.
- If dispatch is unavailable, say the diagnosis is unverified and ask whether to proceed, dispatch, or keep diagnosing.

Emergency containment:
- Containment is allowed only for real business impact.
- Label containment as containment.
- Keep containment reversible and minimal.
- Follow containment with normal diagnosis.
- Do not call containment a root-cause fix.

Fix routing:
- Route approved fixes through `consilium-legatus` unless Milovan explicitly asks for inline execution and dispatch is unavailable.
- Use thresholds from `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`.
- `small` fixes may be one bounded Legatus task.
- `medium` fixes require a short implementation plan before Legatus execution; cross-repo medium requires field 14 = `backward-compatible`.
- `large` fixes require Consul planning and appropriate verifier review before execution.
- `contain` requires explicit emergency containment approval and leaves the case contained.

Medusa backend routing:
- For `divinipress-backend` questions about Medusa architecture or placement, route to `consilium-interpres-back` first.
- For `divinipress-backend` questions about exact route, service, workflow, or transition chains, route to `consilium-speculator-back`.
- For approved Medusa backend implementation, route through `consilium-legatus`, not directly to a Centurion.
- When dispatching Medusa backend work, explicitly attach `building-with-medusa` so the receiving rank loads Medusa doctrine before acting.

Runtime note:
- If the runtime requires explicit user authorization for subagent dispatch, ask for it immediately instead of falling back to self-search and pretending that behavior is doctrinal.
````

- [ ] **Step 2: Replace Legatus routing with shared debug intake**

Replace `/Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md` with:

```markdown
## Legatus Routing

You execute approved work, not open-ended ideation.

## Dispatch Rules

- `consilium-centurio-front` for bounded frontend tasks in `divinipress-store`.
- `consilium-centurio-back` for bounded backend tasks in `divinipress-backend`.
- `consilium-centurio-primus` for bounded source, protocol, skill-package, cross-surface, or rescue tasks after ambiguity is reduced.
- `consilium-tribunus` after meaningful task completion when later steps depend on it.
- `consilium-arbiter` before execution when the plan assumes frontend and backend agree but evidence is missing.

## Debug Fix Intake

Accept a debug fix only from a shared case artifact at `$CONSILIUM_DOCS/cases/<dated-slug>/diagnosis.md` or from a diagnosis packet that matches `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`.

Accept a debug fix only when one of these is true:

- A diagnosis packet has `SOUND` from both `consilium-tribunus` and `consilium-provocator`.
- A diagnosis packet has `CONCERN` from either `consilium-tribunus` or `consilium-provocator`, and the concern has been explicitly accepted or mitigated.
- The Imperator explicitly orders emergency containment.

Reject the fix route and return to diagnosis when:

- The diagnosis packet is missing.
- Any of the 14 fields from `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` are missing.
- The failing boundary is not named.
- The proposed fix site does not match the failing boundary.
- Either `consilium-tribunus` or `consilium-provocator` returned `GAP`.
- Either `consilium-tribunus` or `consilium-provocator` returned `MISUNDERSTANDING`.
- A known gap is being used as proof without live recheck.
- Field 14 is empty or placeholder on cross-repo scope.
- Field 14 says `breaking` while the threshold is `medium`.

Required diagnosis packet fields:

- Symptom
- Reproduction
- Affected lane
- Files/routes inspected
- Failing boundary
- Root-cause hypothesis
- Supporting evidence
- Contrary evidence
- Known gap considered
- Proposed fix site
- Fix threshold
- Verification plan
- Open uncertainty
- Contract compatibility evidence

Emergency containment:

- Execute only the minimal reversible containment.
- Keep containment labeled as containment in status reports.
- Do not mark the bug fixed.
- Return the workflow to diagnosis after containment.

## Centurion Dispatch Law

Implementation tasks go to Centurions, not generic workers or unranked implementers.

Use:

- `consilium-centurio-front` for frontend implementation in `divinipress-store`.
- `consilium-centurio-back` for backend implementation in `divinipress-backend`.
- `consilium-centurio-primus` for Consilium source, protocol, skill-package, installer, generated-agent, or cross-surface implementation once the task is bounded.

Do not:

- Dispatch a generic worker when a Centurion rank fits.
- Treat `consilium-soldier` as the Codex implementation default unless that agent exists in the current Codex manifest and the plan explicitly calls for it.
- Let a Centurion discover and redesign in the same task.
- Ask a Centurion to fix before Interpres, Speculator, Arbiter, or Tribunus has reduced the ambiguity that belongs to them.

## Fix Thresholds

Use `$CONSILIUM_DOCS/doctrine/fix-thresholds.md` as canonical.

Small fix:

- single file
- at most 30 lines of change
- single repo
- no data model change
- no visible UX change
- no schema change
- no new external dependency
- no exported type signature change
- narrow verification exists

Small route:

- one bounded Legatus task, followed by Tribunus when later work depends on it

Medium fix:

- two or more files
- model or workflow touch
- single-repo medium OR cross-repo medium with field 14 = `backward-compatible`
- no breaking cross-repo contract

Medium route:

- short implementation plan
- Praetor if ordering or dependency risk exists
- Legatus executes through the right Centurion
- Tribunus verifies after each meaningful task

Large fix:

- new subsystem
- policy change
- breaking cross-repo contract where field 14 = `breaking`
- data migration
- permission or tenant boundary
- money, cart, checkout, proof, order, or production lifecycle
- repeated failed fixes
- unclear product truth

Large route:

- Consul plan
- Arbiter for cross-repo contract
- Censor, Praetor, or Provocator as needed
- Legatus execution after approval

Contain:

- emergency containment only
- reversible, minimal, labeled
- case remains `status: contained`

## Medusa Backend Execution

- For `divinipress-backend` Medusa implementation, dispatch `consilium-centurio-back` with `building-with-medusa`.
- For backend Medusa per-task verification, dispatch `consilium-tribunus` with Medusa backend doctrine available.
- For backend Medusa spec or plan review, dispatch `consilium-censor`, `consilium-praetor`, and `consilium-provocator` with Medusa backend doctrine available when the artifact concerns `divinipress-backend`.
- If the question is Medusa framework placement rather than bounded implementation, do not send it straight to `consilium-centurio-back`; route through `consilium-interpres-back` or `consilium-speculator-back` first.
- If a route mutation bypasses workflow ownership, stop and route the question through Medusa backend interpretation before implementation.
- If filtering linked module data is involved, confirm whether `query.graph` or `query.index` is the correct source before implementation.

## Runtime Note

- If the runtime requires explicit user authorization for subagent dispatch, ask for it immediately instead of absorbing Centurion or Tribunus work into the Legatus context.

## Execution Doctrine

- Keep steps small enough that a Centurion can execute without inventing strategy.
- Do not ask Centurions to both discover and build if a Speculator or Interpres should answer first.
- Halt on real ambiguity instead of hoping verification catches it later.
```

- [ ] **Step 3: Replace Tribunus diagnosis verification role**

Replace `/Users/milovan/projects/Consilium-codex/source/roles/tribunus.md` with:

```markdown
# Tiberius Vigil

Rank: Tribunus
Function: per-task verifier during execution and diagnosis-packet verifier before debug fixes route into implementation.

Creed:
"I catch the poison at task two so it does not infect task seven."

You own:
- plan-step match
- domain correctness for the delivered task
- diagnosis-packet evidence checks before debug fix routing
- reality checks against stubs, placeholders, or false completion
- local integration with earlier verified work
- catching Medusa layer drift in completed backend tasks before later tasks build on it

You refuse:
- debugging from scratch
- executing fixes
- acting as the implementation Centurion
- becoming the Tribune workflow itself
- accepting a diagnosis when the evidence only proves where the bug appeared
- accepting stale known gaps as proof

## Diagnosis Packet Verification

Use `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` and `$CONSILIUM_DOCS/doctrine/fix-thresholds.md` as canonical.

When verifying a diagnosis packet, check all 14 fields are present:

- Symptom
- Reproduction
- Affected lane
- Files/routes inspected
- Failing boundary
- Root-cause hypothesis
- Supporting evidence
- Contrary evidence
- Known gap considered
- Proposed fix site
- Fix threshold
- Verification plan
- Open uncertainty
- Contract compatibility evidence

Then verify:

- the symptom is stated
- reproduction or evidence is concrete
- the affected lane is named
- inspected files or routes are named
- the failing boundary is named
- the root-cause hypothesis follows from evidence
- supporting evidence is citations, logs, commands, traces, or MCP answers
- contrary evidence was actively checked
- known gaps are treated as hypotheses, not proof
- known gaps used as evidence have live recheck results
- the proposed fix site matches the failing boundary
- the fix threshold matches `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- the verification plan matches the failure
- open uncertainty is explicit
- field 14 is `backward-compatible`, `breaking`, or `N/A — single-lane fix` as appropriate

Cross-repo rule:

- `medium` cross-repo fixes require field 14 = `backward-compatible`.
- field 14 = `breaking` means the threshold must be `large`.
- empty or placeholder field 14 on cross-repo scope is a GAP.

Return:

- `SOUND` when the packet is coherent enough to route a fix
- `CONCERN` when the packet can route only if the concern is accepted or mitigated
- `GAP` when evidence, boundary, fix site, field 14, or verification plan is missing
- `MISUNDERSTANDING` when the packet shows a broken domain model or uses a known gap as proof without live recheck

Tribunus verifies diagnosis packets and completed implementation tasks. Tribunus does not debug the issue and does not execute the fix.

Voice:
- fast
- disciplined
- specific

Output:
- only `MISUNDERSTANDING`, `GAP`, `CONCERN`, or `SOUND`
- every finding cites evidence
```

- [ ] **Step 4: Verify core prompt sources contain the shared packet**

Run:

```bash
rg -n 'diagnosis-packet.md|fix-thresholds.md|Contract compatibility evidence|backward-compatible|breaking|N/A — single-lane fix' \
  /Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md \
  /Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md \
  /Users/milovan/projects/Consilium-codex/source/roles/tribunus.md
```

Expected: all three files have shared packet and threshold references.

## Task 6: Update Debugging Evals For Shared Docs Parity

> **Confidence: High** - Evals 10-18 are the Tribune/debugging eval slice called out by the spec.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/10-tribune-initial-diagnosis.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/11-storefront-debugging.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/12-admin-debugging.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/13-medusa-backend-debugging.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/14-known-gap-discipline.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/15-admin-hold-debugging.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/16-install-staleness.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/17-debugger-routing.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/tasks/18-feedback-loop.md`

- [ ] **Step 1: Add shared-docs packet criteria to evals 10-17**

For evals 10 through 17, keep the existing prompt text and existing domain-specific pass criteria, and add these pass criteria to each file:

```markdown
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
```

- [ ] **Step 2: Replace eval 18 with shared feedback-loop criteria**

Replace `/Users/milovan/projects/Consilium-codex/evals/tasks/18-feedback-loop.md` with:

````markdown
# Eval 18: Feedback Loop

Prompt:

```text
We diagnosed a recurring invite resend gap for the second time. What should happen after the fix is verified?
```

Pass criteria:
- recommends a shared debugging case log under `$CONSILIUM_DOCS/cases/`
- creates or references a dated case folder through `$CONSILIUM_DOCS/scripts/case-new`
- uses `agent: codex` for Codex-origin diagnosis artifacts
- applies the promotion rule for auth, tenant isolation, money, checkout, proof status, order lifecycle, or cross-repo contracts
- names `$CONSILIUM_DOCS/doctrine/known-gaps.md` as the doctrine home
- requires live evidence anchors and last-verified date before promotion
- refuses to add known-gap entries to the Codex prompt-source known-gaps pointer file
````

- [ ] **Step 3: Verify no eval points to stale local docs**

Run:

```bash
if rg -n 'docs/consilium/debugging-cases|source/doctrine/divinipress-known-gaps\.md|skills/tribune/references|references/[A-Za-z0-9_-]+\.md|Fix size threshold' /Users/milovan/projects/Consilium-codex/evals/tasks/10-tribune-initial-diagnosis.md /Users/milovan/projects/Consilium-codex/evals/tasks/11-storefront-debugging.md /Users/milovan/projects/Consilium-codex/evals/tasks/12-admin-debugging.md /Users/milovan/projects/Consilium-codex/evals/tasks/13-medusa-backend-debugging.md /Users/milovan/projects/Consilium-codex/evals/tasks/14-known-gap-discipline.md /Users/milovan/projects/Consilium-codex/evals/tasks/15-admin-hold-debugging.md /Users/milovan/projects/Consilium-codex/evals/tasks/16-install-staleness.md /Users/milovan/projects/Consilium-codex/evals/tasks/17-debugger-routing.md /Users/milovan/projects/Consilium-codex/evals/tasks/18-feedback-loop.md; then
  echo "Debug evals still contain stale local docs references." >&2
  exit 1
fi
```

Expected: no output.

## Task 7: Regenerate, Install, And Validate Codex Runtime Surfaces

> **Confidence: High** - Protocol and role changes must flow through generated and installed agent TOMLs; skill changes must pass the skill installer.

**Files:**

- Modify generated: `/Users/milovan/projects/Consilium-codex/agents/consilium-*.toml`
- Verify installed: `/Users/milovan/.codex/agents/consilium-*.toml`
- Verify installed: `/Users/milovan/.agents/skills/tribune`

- [ ] **Step 1: Run the Tribune shared-docs validator**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-tribune-shared-docs.py
```

Expected: `Codex Tribune shared-docs check passed.`

- [ ] **Step 2: Validate the skill installer dry run**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
bash scripts/install-codex-skills.sh --dry-run
```

Expected: validates the source and says it would link `~/.agents/skills/tribune` to `/Users/milovan/projects/Consilium-codex/skills/tribune`.

- [ ] **Step 3: Install the Tribune skill symlink**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
bash scripts/install-codex-skills.sh
```

Expected: installer prints `Codex Tribune shared-docs check passed.` and confirms the symlink target.

- [ ] **Step 4: Validate installed Tribune skill**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-tribune-shared-docs.py --installed
```

Expected: `Codex Tribune shared-docs check passed.`

- [ ] **Step 5: Regenerate core agents**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/generate_agents.py
```

Expected: `Generated 14 agent TOMLs`.

- [ ] **Step 6: Validate and install generated agents**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-shared-docs-adoption.py
bash scripts/install-codex-agents.sh --prune
python3 scripts/check-shared-docs-adoption.py --installed
```

Expected: all shared-docs adoption checks pass and installed agents are byte-identical to generated agents.

- [ ] **Step 7: Run the final stale-reference gate**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-tribune-shared-docs.py --installed
if rg -n 'docs/consilium/debugging-cases|source/doctrine/divinipress-known-gaps\.md|skills/tribune/references|references/[A-Za-z0-9_-]+\.md|Fix size threshold' skills/tribune source/protocols/consul-routing.md source/protocols/legatus-routing.md source/roles/tribunus.md evals/tasks/10-tribune-initial-diagnosis.md evals/tasks/11-storefront-debugging.md evals/tasks/12-admin-debugging.md evals/tasks/13-medusa-backend-debugging.md evals/tasks/14-known-gap-discipline.md evals/tasks/15-admin-hold-debugging.md evals/tasks/16-install-staleness.md evals/tasks/17-debugger-routing.md evals/tasks/18-feedback-loop.md; then
  echo "Stale Tribune shared-docs references remain." >&2
  exit 1
fi
```

Expected: validator passes and `rg` finds no stale local-reference leftovers. The validator is the canonical gate for undated case path construction.

## Task 8: Update Shared Docs Index And Close The Campaign Case

> **Confidence: Medium** - Closing the case is correct only after all Codex-side validators pass.

**Files:**

- Modify: `/Users/milovan/projects/consilium-docs/INDEX.md`
- Modify: `/Users/milovan/projects/consilium-docs/cases/2026-04-24-codex-consilium-docs-adoption/STATUS.md`

- [ ] **Step 1: Remove the Codex adoption banner from the index**

In `/Users/milovan/projects/consilium-docs/INDEX.md`, delete this whole block:

```markdown
<!-- banner:codex-adoption-pending -->
## Codex Tribune parity pending

Codex core agents have been repointed to this docs repo. Codex Tribune skill parity is still pending in `cases/2026-04-24-codex-consilium-docs-adoption/`.
<!-- /banner:codex-adoption-pending -->
```

- [ ] **Step 2: Update the active work and recently closed sections**

In `/Users/milovan/projects/consilium-docs/INDEX.md`, replace:

```markdown
Codex Tribune parity is pending.
```

with:

```markdown
No active Consilium docs migration banners.
```

Add this line under `## Recently closed`, above the Claude-side cutover line:

```markdown
`cases/2026-04-24-codex-consilium-docs-adoption/` - Codex shared-docs adoption completed.
```

Replace:

```markdown
Codex core adopted; Tribune parity pending.
```

with:

```markdown
No active banners.
```

- [ ] **Step 3: Close the case status frontmatter**

Run:

```bash
python3 - <<'PY'
from datetime import date
from pathlib import Path

path = Path("/Users/milovan/projects/consilium-docs/cases/2026-04-24-codex-consilium-docs-adoption/STATUS.md")
text = path.read_text()
frontmatter, body = text.split("---\n", 2)[1:]
lines = []
seen_closed_at = False
for line in frontmatter.splitlines():
    if line.startswith("status:"):
        lines.append("status: closed")
    elif line.startswith("sessions:"):
        lines.append("sessions: 2")
    elif line.startswith("current_session:"):
        lines.append("current_session: 2")
    elif line.startswith("closed_at:"):
        lines.append(f"closed_at: {date.today().isoformat()}")
        seen_closed_at = True
    else:
        lines.append(line)
if not seen_closed_at:
    lines.append(f"closed_at: {date.today().isoformat()}")
new_body = """## Current state

Codex core agents and Codex Tribune now use shared Consilium docs for runtime doctrine, case folders, diagnosis packets, known gaps, and fix thresholds.

## What's next

- [x] Piece 1 core agent adoption
- [x] Piece 2 Tribune/debugging parity

## Open questions

(none)
"""
path.write_text("---\n" + "\n".join(lines) + "\n---\n\n" + new_body)
PY
```

Expected: `STATUS.md` has `status: closed`, `sessions: 2`, `current_session: 2`, and `closed_at` set to the execution date.

- [ ] **Step 4: Confirm docs repo status is scoped**

Run:

```bash
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected changed files:

```text
?? .serena/
 M INDEX.md
 M cases/2026-04-24-codex-consilium-docs-adoption/STATUS.md
?? cases/2026-04-24-codex-consilium-docs-adoption/piece-2-plan.md
```

If `piece-2-plan.md` was already committed before execution, it may not appear here. If `.serena/` is absent, do not create it. If `.serena/` exists, it must remain uncommitted.

## Task 9: Final Scope Check And Commits

> **Confidence: High** - The final gates prove Piece 2 while preserving unrelated local docs state.

**Files:**

- Verify: `/Users/milovan/projects/Consilium-codex`
- Verify: `/Users/milovan/projects/consilium-docs`

- [ ] **Step 1: Confirm Codex repo changed files are scoped**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex status --short
```

Expected changed files:

```text
 M agents/consilium-consul.toml
 M agents/consilium-legatus.toml
 M agents/consilium-tribunus.toml
 M evals/tasks/10-tribune-initial-diagnosis.md
 M evals/tasks/11-storefront-debugging.md
 M evals/tasks/12-admin-debugging.md
 M evals/tasks/13-medusa-backend-debugging.md
 M evals/tasks/14-known-gap-discipline.md
 M evals/tasks/15-admin-hold-debugging.md
 M evals/tasks/16-install-staleness.md
 M evals/tasks/17-debugger-routing.md
 M evals/tasks/18-feedback-loop.md
 M scripts/install-codex-skills.sh
 M skills/tribune/SKILL.md
 D skills/tribune/references/admin-debugging.md
 D skills/tribune/references/condition-based-waiting.md
 D skills/tribune/references/core-debugging.md
 D skills/tribune/references/defense-in-depth.md
 D skills/tribune/references/dispatch-rules.md
 D skills/tribune/references/eval-seeds.md
 D skills/tribune/references/known-gaps-protocol.md
 D skills/tribune/references/medusa-backend-debugging.md
 D skills/tribune/references/root-cause-tracing.md
 D skills/tribune/references/storefront-debugging.md
 M source/protocols/consul-routing.md
 M source/protocols/legatus-routing.md
 M source/roles/tribunus.md
?? scripts/check-tribune-shared-docs.py
```

If additional generated agents change because `source/doctrine/common.md` or manifest generation changed since the plan was written, inspect before including.

- [ ] **Step 2: Run final verification commands**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 -m py_compile scripts/check-tribune-shared-docs.py
python3 scripts/check-tribune-shared-docs.py
python3 scripts/check-tribune-shared-docs.py --installed
python3 scripts/check-shared-docs-adoption.py
python3 scripts/check-shared-docs-adoption.py --installed
bash scripts/install-codex-skills.sh --dry-run
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit Codex repo changes**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex add agents evals/tasks scripts/check-tribune-shared-docs.py scripts/install-codex-skills.sh skills/tribune source/protocols/consul-routing.md source/protocols/legatus-routing.md source/roles/tribunus.md
git -C /Users/milovan/projects/Consilium-codex commit -m "Bring Codex Tribune onto shared Consilium docs"
```

Expected: one Codex repo commit.

- [ ] **Step 4: Commit shared docs closeout**

Run:

```bash
git -C /Users/milovan/projects/consilium-docs add INDEX.md cases/2026-04-24-codex-consilium-docs-adoption/STATUS.md cases/2026-04-24-codex-consilium-docs-adoption/piece-2-plan.md
git -C /Users/milovan/projects/consilium-docs commit -m "Close Codex shared docs adoption"
```

Expected: one docs repo commit including the Piece 2 plan artifact and closeout files. Untracked `.serena/` remains untouched.

- [ ] **Step 5: Verify final heads and fresh-session note**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex status --short
git -C /Users/milovan/projects/consilium-docs status --short
git -C /Users/milovan/projects/Consilium-codex log -1 --oneline
git -C /Users/milovan/projects/consilium-docs log -1 --oneline
```

Expected: Codex repo clean. Docs repo may still show unrelated `?? .serena/`. Report that a fresh Codex thread/session is required to pick up updated generated agents and skill instructions.

## Acceptance Checklist

> **Confidence: High** - These map directly to the checked spec.

Piece 2 is complete when:

- Tribune skill resolves `$CONSILIUM_DOCS` before shared reads and case creation.
- Tribune reads shared doctrine from `$CONSILIUM_DOCS/doctrine/`, not local copied references.
- Local copied `skills/tribune/references/*.md` files are deleted.
- Diagnosis packets use all 14 fields, including `Contract compatibility evidence`.
- New diagnosis cases are created through `$CONSILIUM_DOCS/scripts/case-new ... --agent codex --type bug`.
- Temp-root fixture proves dated shared case creation without polluting real docs.
- Core debug-routing prompts and `consilium-tribunus` generated agent output use the shared 14-field packet and threshold doctrine.
- Evals 10-18 enforce shared-docs behavior.
- Installed Tribune skill symlink points to `/Users/milovan/projects/Consilium-codex/skills/tribune`.
- Installed Codex agents and installed Tribune skill pass validators.
- Shared docs `INDEX.md` no longer says Codex adoption is pending.
