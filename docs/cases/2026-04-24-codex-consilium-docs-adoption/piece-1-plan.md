# Codex Core Shared Docs Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoint Codex core agents to the shared `$CONSILIUM_DOCS` repo for runtime docs, cases, and known gaps without changing the separate Tribune skill.

**Architecture:** Keep `/Users/milovan/projects/Consilium-codex/source/` as the Codex prompt-source tree. Add shared-docs runtime law through `source/doctrine/common.md`, convert local known gaps into pointer doctrine, regenerate generated agents, and add a repo/install validation gate so stale paths cannot quietly return.

**Tech Stack:** Python 3 generator/validator scripts, Bash install scripts, TOML generated agents, Markdown prompt sources.

---

## Scope

> **Confidence: High** - Matches the checked split spec and live Codex repo ownership.

In scope:

- `/Users/milovan/projects/Consilium-codex/source/doctrine/common.md`
- `/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md`
- `/Users/milovan/projects/Consilium-codex/scripts/check-shared-docs-adoption.py`
- `/Users/milovan/projects/Consilium-codex/README.md`
- `/Users/milovan/projects/Consilium-codex/evals/README.md`
- Generated `/Users/milovan/projects/Consilium-codex/agents/consilium-*.toml`
- Installed `/Users/milovan/.codex/agents/consilium-*.toml`
- `/Users/milovan/projects/consilium-docs/INDEX.md`

Out of scope:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/`
- Tribune/debugging eval task rewrites under `/Users/milovan/projects/Consilium-codex/evals/tasks/10-18`
- Claude-side Consilium or `~/.claude/agents`
- Deleting `/Users/milovan/projects/Consilium-codex/docs/consilium/`

## Task 1: Preflight The Core Adoption Lane

> **Confidence: High** - These commands verify the repos and current generated-agent baseline before source changes.

**Files:**

- Read: `/Users/milovan/projects/Consilium-codex`
- Read: `/Users/milovan/projects/consilium-docs`

- [ ] **Step 1: Verify shared docs identity**

Run:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS"; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS" || { echo "$CONSILIUM_DOCS is not a consilium-docs checkout"; exit 1; }
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || { echo "consilium-docs migration in progress"; exit 1; }
```

Expected: command exits 0.

- [ ] **Step 2: Verify both repos are clean before implementation**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex status --short
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: no output except already-approved spec/plan artifacts in `consilium-docs` if this plan has not yet been committed.

- [ ] **Step 3: Regenerate current agents and confirm no baseline drift**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/generate_agents.py
git diff -- agents config/codex-config-snippet.toml
```

Expected: generator prints `Generated 14 agent TOMLs`; `git diff` is empty. If diff is non-empty, stop and inspect before continuing.

## Task 2: Add Shared Docs Runtime Law To Core Agents

> **Confidence: High** - `source/doctrine/common.md` is included by all 14 agents in `source/manifest.json`, so one source edit propagates through generation.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/source/doctrine/common.md`

- [ ] **Step 1: Remove the stale Graphify runtime reference**

In `/Users/milovan/projects/Consilium-codex/source/doctrine/common.md`, replace:

```markdown
- Do not guess when the answer can be verified with Serena, Graphify, or exact search.
```

with:

```markdown
- Do not guess when the answer can be verified with Serena, exact search, or the relevant live repo/docs.
```

- [ ] **Step 2: Add shared-docs runtime law after the Shared Law bullets**

Append this section to `/Users/milovan/projects/Consilium-codex/source/doctrine/common.md`:

````markdown

## Shared Docs Runtime Law

`source/doctrine/` is baked Codex prompt law. `$CONSILIUM_DOCS/doctrine/` is runtime shared doctrine.

Before reading shared doctrine, reading or writing case files, dispatching verification from a shared artifact, routing work through a shared artifact, or invoking a shared docs script, resolve `$CONSILIUM_DOCS`:

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

If the guard fails, halt and report the exact failure. Do not fall back to local `docs/consilium` paths. Keep `CONSILIUM_DOCS` exported so shared scripts write to the same checkout the guard verified.

Planning and diagnosis artifacts live in dated case folders under `$CONSILIUM_DOCS/cases/`. Use an existing dated case folder or create one with `$CONSILIUM_DOCS/scripts/case-new`; do not write flat files directly under `$CONSILIUM_DOCS/cases/`.
````

- [ ] **Step 3: Verify the source law contains the three guard checks**

Run:

```bash
rg -n 'export CONSILIUM_DOCS|CONVENTIONS.md|migration-in-progress|case-new|routing work through a shared artifact|do not write flat files' /Users/milovan/projects/Consilium-codex/source/doctrine/common.md
```

Expected: all six phrases are present.

## Task 3: Convert Codex Known Gaps To Pointer Doctrine

> **Confidence: High** - The shared known-gap doctrine exists at `$CONSILIUM_DOCS/doctrine/known-gaps.md`, and generated agents currently bake the duplicated local entries.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md`

- [ ] **Step 1: Replace local entry payload with pointer/guard doctrine**

Replace the entire file with:

```markdown
# Divinipress Known Gaps Pointer

Known-gap entries are not maintained in Codex prompt source.

Resolve `$CONSILIUM_DOCS` using Shared Docs Runtime Law, then read:

- `$CONSILIUM_DOCS/doctrine/known-gaps.md`
- `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`

Known gaps are hypothesis accelerators, not proof. Before using one in a diagnosis, recheck the current repo or domain doc and cite the live file path. If evidence is stale, missing, or contradicted, drop the hypothesis.

Promote reusable debugging lessons only through `$CONSILIUM_DOCS/doctrine/known-gaps.md`; do not add known-gap entries to this file.
```

- [ ] **Step 2: Verify local known-gap entries are gone**

Run:

```bash
if rg -n '^## KG-' /Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md; then
  echo "Local known-gap entries remain; remove them." >&2
  exit 1
fi
rg -n '\\$CONSILIUM_DOCS/doctrine/known-gaps.md' /Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md
```

Expected: no `## KG-` hits; shared known-gaps path is present.

## Task 4: Add The Core Shared-Docs Validation Gate

> **Confidence: High** - There is no existing Codex-side validator for this adoption boundary; installer validation currently checks TOML shape, not shared-docs drift.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/scripts/check-shared-docs-adoption.py`
- Modify: `/Users/milovan/projects/Consilium-codex/scripts/install-codex-agents.sh`

- [ ] **Step 1: Create the validator script**

Create `/Users/milovan/projects/Consilium-codex/scripts/check-shared-docs-adoption.py`:

```python
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
COMMON = ROOT / "source" / "doctrine" / "common.md"
KNOWN_GAPS = ROOT / "source" / "doctrine" / "divinipress-known-gaps.md"
INSTALLED_AGENTS = Path.home() / ".codex" / "agents"

REPO_SCAN_TARGETS = [
    ROOT / "source",
    ROOT / "agents",
    ROOT / "scripts",
    ROOT / "config",
    ROOT / "README.md",
    ROOT / "evals" / "README.md",
]

TEXT_SUFFIXES = {".md", ".py", ".sh", ".toml", ".json", ".yaml", ".yml", ".txt"}

BANNED_PATTERNS = [
    (re.compile(r"/Users/milovan/projects/Consilium-codex/docs/consilium"), "local Codex docs/consilium path"),
    (re.compile(r"docs/consilium/debugging-cases"), "legacy debugging case path"),
    (re.compile(r"source/doctrine/divinipress-known-gaps\\.md"), "local known-gaps doctrine path"),
    (re.compile(r"^## KG-", re.MULTILINE), "duplicated known-gap payload"),
    (re.compile(r"graphify", re.IGNORECASE), "graphify runtime reference"),
    (re.compile(r"mcp__graphify", re.IGNORECASE), "graphify MCP reference"),
    (re.compile(r"knowledge graph", re.IGNORECASE), "knowledge graph runtime reference"),
    (re.compile(r"query_graph", re.IGNORECASE), "graphify query_graph reference"),
    (re.compile(r"get_neighbors", re.IGNORECASE), "graphify get_neighbors reference"),
]

REQUIRED_COMMON_PATTERNS = [
    (re.compile(r'export CONSILIUM_DOCS="\\$\\{CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs\\}"'), "exported default CONSILIUM_DOCS"),
    (re.compile(r'\\[ -d "\\$CONSILIUM_DOCS" \\] \\|\\| \\{ echo "consilium-docs not found at \\$CONSILIUM_DOCS\\. Set CONSILIUM_DOCS=<path>\\."; exit 1; \\}'), "directory existence guard"),
    (re.compile(r'head -1 "\\$CONSILIUM_DOCS/CONVENTIONS\\.md".*grep -q "consilium-docs CONVENTIONS"', re.DOTALL), "CONVENTIONS marker guard"),
    (re.compile(r'\\[ ! -f "\\$CONSILIUM_DOCS/\\.migration-in-progress" \\] \\|\\|', re.DOTALL), "migration lock guard"),
    (re.compile(r'routing work through a shared artifact'), "routing-through-shared-artifact trigger"),
    (re.compile(r'\\$CONSILIUM_DOCS/scripts/case-new'), "case-new instruction"),
]

AGENT_REQUIRED_SNIPPETS = [
    "Shared Docs Runtime Law",
    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"',
    "$CONSILIUM_DOCS/scripts/case-new",
]

KNOWN_GAPS_AGENT_FILES = {"consilium-consul.toml", "consilium-tribunus.toml"}


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
    errors.extend(check_agent_snippets(sorted((ROOT / "agents").glob("consilium-*.toml"))))

    if args.installed:
        installed = sorted(INSTALLED_AGENTS.glob("consilium-*.toml"))
        if not installed:
            errors.append(f"{INSTALLED_AGENTS}: no installed consilium agent TOMLs found")
        else:
            generated_names = {p.name for p in (ROOT / "agents").glob("consilium-*.toml")}
            installed_names = {p.name for p in installed}
            missing = sorted(generated_names - installed_names)
            extra = sorted(installed_names - generated_names)
            if missing:
                errors.append(f"{INSTALLED_AGENTS}: missing installed generated agents: {', '.join(missing)}")
            if extra:
                errors.append(f"{INSTALLED_AGENTS}: extra installed Consilium agents: {', '.join(extra)}")
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
```

- [ ] **Step 2: Make the script executable**

Run:

```bash
chmod +x /Users/milovan/projects/Consilium-codex/scripts/check-shared-docs-adoption.py
```

- [ ] **Step 3: Call the validator from the agent installer after generation**

In `/Users/milovan/projects/Consilium-codex/scripts/install-codex-agents.sh`, after:

```bash
python3 "$repo_root/scripts/generate_agents.py"
```

add:

```bash
python3 "$repo_root/scripts/check-shared-docs-adoption.py"
```

- [ ] **Step 4: Check validator syntax**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 -m py_compile scripts/check-shared-docs-adoption.py
```

Expected: command exits 0. Do not run the full validator until after generated agents are rebuilt.

## Task 5: Update Repo Docs For The Shared-Docs Dependency

> **Confidence: High** - README and eval docs are runtime guidance, not generated output.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/README.md`
- Modify: `/Users/milovan/projects/Consilium-codex/evals/README.md`

- [ ] **Step 1: Update README source-of-truth language**

In `/Users/milovan/projects/Consilium-codex/README.md`, keep the existing separation from Claude source, but change the Source Of Truth section so it distinguishes prompt source from runtime shared docs:

```markdown
## Source Of Truth

- `source/roles/` contains compact Codex persona source files
- `source/doctrine/` contains Codex prompt-source law baked into generated agents
- Runtime shared doctrine and Consilium artifacts live in `$CONSILIUM_DOCS`, defaulting to `/Users/milovan/projects/consilium-docs`
- `source/protocols/` contains routing and planning rules
- `source/manifest.json` defines the installed agent pack
- `scripts/generate_agents.py` renders installable TOMLs into `agents/`
- `config/codex-config-snippet.toml` is generated from the manifest
```

- [ ] **Step 2: Add install prerequisite language**

In `/Users/milovan/projects/Consilium-codex/README.md`, before `## Install`, add:

```markdown
## Shared Docs Requirement

Codex Consilium agents expect `$CONSILIUM_DOCS` to resolve to a valid `consilium-docs` checkout. The default is `/Users/milovan/projects/consilium-docs`.

The checkout is valid only when:

- `$CONSILIUM_DOCS/CONVENTIONS.md` starts with the `consilium-docs CONVENTIONS` marker line
- `$CONSILIUM_DOCS/.migration-in-progress` is absent

Start a fresh Codex thread after installing agents. Existing threads may keep old generated-agent instructions.
```

- [ ] **Step 3: Update agent install verification docs**

In `/Users/milovan/projects/Consilium-codex/README.md`, add this command to the Agent Install verification block:

```bash
python3 scripts/check-shared-docs-adoption.py --installed
```

- [ ] **Step 4: Update eval README**

In `/Users/milovan/projects/Consilium-codex/evals/README.md`, add `source/doctrine/common.md` and `$CONSILIUM_DOCS` behavior to the material-change list, and add this success criterion under What Good Looks Like:

```markdown
- Shared-docs adoption resolves `$CONSILIUM_DOCS`, uses `$CONSILIUM_DOCS/doctrine/` for runtime shared doctrine, and keeps `source/doctrine/` as prompt-source law.
```

Do not update `evals/tasks/10-18` in Piece 1.

## Task 6: Regenerate And Validate Core Agents

> **Confidence: High** - Generated TOMLs are derived from `source/` by `scripts/generate_agents.py`; direct edits to `agents/` would be overwritten.

**Files:**

- Modify generated: `/Users/milovan/projects/Consilium-codex/agents/consilium-*.toml`

- [ ] **Step 1: Regenerate generated agents**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/generate_agents.py
```

Expected: `Generated 14 agent TOMLs`.

- [ ] **Step 2: Validate source and generated repo surfaces**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-shared-docs-adoption.py
```

Expected: `Codex shared-docs adoption check passed.`

- [ ] **Step 3: Install generated agents through the validated installer**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
bash scripts/install-codex-agents.sh --prune
```

Expected:

- generated TOMLs validate
- agents install to `/Users/milovan/.codex/agents`
- stale installed Consilium agent TOMLs not generated by this repo are pruned
- no stale shared-docs check failure

- [ ] **Step 4: Validate installed runtime agents**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-shared-docs-adoption.py --installed
```

Expected: `Codex shared-docs adoption check passed.`

## Task 7: Update Shared Docs Index And Finalize

> **Confidence: High** - These gates prove Piece 1 without touching Tribune skill parity, and keep the shared docs index honest after core adoption.

**Files:**

- Verify: `/Users/milovan/projects/Consilium-codex`
- Modify: `/Users/milovan/projects/consilium-docs/INDEX.md`

- [ ] **Step 1: Rewrite the Codex adoption banner to Tribune parity pending**

In `/Users/milovan/projects/consilium-docs/INDEX.md`, replace the current Codex adoption banner block with:

```markdown
<!-- banner:codex-adoption-pending -->
## Codex Tribune parity pending

Codex core agents have been repointed to this docs repo. Codex Tribune skill parity is still pending in `cases/2026-04-24-codex-consilium-docs-adoption/`.
<!-- /banner:codex-adoption-pending -->
```

Also replace the Active work sentence:

```markdown
Codex-side Consilium adoption is pending.
```

with:

```markdown
Codex Tribune parity is pending.
```

- Replace the Banners summary line:

```markdown
Codex adoption pending.
```

with:

```markdown
Codex core adopted; Tribune parity pending.
```

- [ ] **Step 2: Confirm Tribune skill was not touched**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex diff --name-only -- skills/tribune
```

Expected: no output.

- [ ] **Step 3: Confirm Piece 2 eval tasks remain outside Piece 1**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex diff --name-only -- evals/tasks
```

Expected: no output.

- [ ] **Step 4: Run final core stale gate**

Run:

```bash
cd /Users/milovan/projects/Consilium-codex
python3 scripts/check-shared-docs-adoption.py
python3 scripts/check-shared-docs-adoption.py --installed
```

Expected: both commands pass.

- [ ] **Step 5: Confirm Codex repo status is scoped**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex status --short
```

Expected changed files:

```text
 M README.md
 M agents/consilium-arbiter.toml
 M agents/consilium-censor.toml
 M agents/consilium-centurio-back.toml
 M agents/consilium-centurio-front.toml
 M agents/consilium-centurio-primus.toml
 M agents/consilium-consul.toml
 M agents/consilium-interpres-back.toml
 M agents/consilium-interpres-front.toml
 M agents/consilium-legatus.toml
 M agents/consilium-praetor.toml
 M agents/consilium-provocator.toml
 M agents/consilium-speculator-back.toml
 M agents/consilium-speculator-front.toml
 M agents/consilium-tribunus.toml
 M evals/README.md
 M scripts/install-codex-agents.sh
 M source/doctrine/common.md
 M source/doctrine/divinipress-known-gaps.md
?? scripts/check-shared-docs-adoption.py
```

If `config/codex-config-snippet.toml` changes only because the generator changed formatting unexpectedly, inspect it before including it.

- [ ] **Step 6: Confirm docs repo diff is scoped**

Run:

```bash
git -C /Users/milovan/projects/consilium-docs diff --name-only
```

Expected changed files:

```text
INDEX.md
```

If this spec and plan are still uncommitted, they may also appear. Commit or stage them separately before executing Piece 1.

- [ ] **Step 7: Commit Codex repo changes**

Run:

```bash
git -C /Users/milovan/projects/Consilium-codex add README.md agents evals/README.md scripts/check-shared-docs-adoption.py scripts/install-codex-agents.sh source/doctrine/common.md source/doctrine/divinipress-known-gaps.md
git -C /Users/milovan/projects/Consilium-codex commit -m "Repoint Codex core agents to shared Consilium docs"
```

Expected: one commit in `/Users/milovan/projects/Consilium-codex`.

- [ ] **Step 8: Commit shared docs index update**

Run:

```bash
git -C /Users/milovan/projects/consilium-docs add INDEX.md
git -C /Users/milovan/projects/consilium-docs commit -m "Mark Codex core adoption complete"
```

Expected: one commit in `/Users/milovan/projects/consilium-docs`.

## Handoff To Piece 2

> **Confidence: High** - The checked spec assigns Tribune skill parity and deeper debug-routing packet alignment to Piece 2.

After Piece 1 lands, Piece 2 must still handle:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/`
- `source/protocols/consul-routing.md`, `source/protocols/legatus-routing.md`, and `source/roles/tribunus.md` 14-field diagnosis parity
- `evals/tasks/10-18`
- controlled temp-root case creation fixture for `agent: codex`
- final removal or rewrite of the Codex adoption banner in `/Users/milovan/projects/consilium-docs/INDEX.md`
