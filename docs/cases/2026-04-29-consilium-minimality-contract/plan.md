# Consilium Minimality Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:legion` (recommended) or `consilium:march` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codify the Minimality Contract so Centurios default to the smallest correct change and implementation verifiers can flag unjustified structure.

**Architecture:** Hand-edit only canonical `source/` files, then derive Claude and Codex runtime outputs with `python3 runtimes/scripts/generate.py`. Install generated Claude agents into `~/.claude/agents`, install the Codex runtime with `bash codex/scripts/install-codex.sh`, then prove repo and installed parity before calling the work complete.

**Tech Stack:** Markdown doctrine and prompt templates, Python runtime generator and parity checks, Bash runtime install wrapper, Claude Markdown agents/skills, Codex TOML agents/config.

**Spec:** `spec.md`

---

## Scope Guard

Execute from a dedicated worktree by default. The main checkout is allowed only when it is clean, upstream-synced, and explicitly chosen by the Imperator.

```bash
base_repo="/Users/milovan/projects/Consilium"
repo_root="${CONSILIUM_MINIMALITY_REPO:-$base_repo/.worktrees/feature/consilium-minimality-contract}"
base_status="$(git -C "$base_repo" status --short --untracked-files=all)"
base_counts="$(git -C "$base_repo" rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo "no-upstream")"
if [ -n "$base_status" ] || { [ "$base_counts" != "0 0" ] && [ "${CONSILIUM_ALLOW_LOCAL_MAIN:-0}" != "1" ]; }; then
  printf 'Base repo is not clean/upstream-synced.\nstatus:\n%s\nupstream-counts: %s\n' "$base_status" "$base_counts" >&2
  echo "Push/sync first, or set CONSILIUM_ALLOW_LOCAL_MAIN=1 only if the Imperator explicitly approved local-main execution." >&2
  exit 1
fi
if [ ! -d "$repo_root/.git" ] && [ ! -f "$repo_root/.git" ]; then
  git -C "$base_repo" worktree add -b feature/consilium-minimality-contract "$repo_root" main
fi
git -C "$repo_root" merge --ff-only main
cd "$repo_root"
git status --short --branch
git rev-list --left-right --count @{u}...HEAD 2>/dev/null || true
test -f docs/cases/2026-04-29-consilium-minimality-contract/spec.md
test -f docs/cases/2026-04-29-consilium-minimality-contract/plan.md
rg -n "## Implementer Report|Snapshot installed runtime state before install|install generated Claude agents" docs/cases/2026-04-29-consilium-minimality-contract/plan.md
```

This plan intentionally stays in one repo lane. It edits source doctrine and source prompt templates only. Do not hand-edit generated, compatibility, or installed runtime files.

Scope in:

- `source/doctrine/execution-law.md`
- `source/doctrine/verifier-law.md`
- `source/protocols/legatus-routing.md`
- `source/skills/claude/legion/implementer-prompt.md`
- `source/skills/claude/references/verification/templates/mini-checkit.md`
- Generated and compatibility outputs produced only by `python3 runtimes/scripts/generate.py`
- Installed Claude-agent update produced only by copying `generated/claude/agents/consilium-*.md` into `~/.claude/agents`
- Installed Codex runtime update produced only by `bash codex/scripts/install-codex.sh`

Scope out:

- model-routing changes
- new agents or light/heavy agent splits
- new verifier templates
- plan-format changes
- debugging or diagnosis-path changes
- `source/skills/claude/legion/SKILL.md`
- `claude/CLAUDE.md`
- `source/skills/claude/references/verification/templates/campaign-review.md`
- `source/skills/claude/references/verification/templates/spec-verification.md`
- `source/skills/claude/references/verification/templates/plan-verification.md`
- role files under `source/roles/`
- Principales MCP package, manifest, model config, or new lint scripts

If executing in the main checkout, halt when `git status --short --branch` shows dirt or when `git rev-list --left-right --count @{u}...HEAD` is not `0 0`, unless the Imperator explicitly approves local-main execution. Runtime prompt work should not silently land on a dirty or unpushed main checkout.

## Task 0: Preflight The Runtime Source

> **Confidence: High** - implements [spec §Evidence Basis](spec.md#evidence-basis), [spec §Required Behavior - Surface Obligations](spec.md#required-behavior--surface-obligations), and [spec §Expected Active File Surfaces](spec.md#expected-active-file-surfaces). Live reconnaissance confirmed the five target files exist and the runtime is generated from canonical `source/`.

**Files:**

- Read: `source/doctrine/execution-law.md`
- Read: `source/doctrine/verifier-law.md`
- Read: `source/protocols/legatus-routing.md`
- Read: `source/skills/claude/legion/implementer-prompt.md`
- Read: `source/skills/claude/references/verification/templates/mini-checkit.md`
- Read: `source/protocols/plan-format.md`

- [ ] **Step 1: Resolve shared docs**

Run:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
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

Expected: command exits 0.

- [ ] **Step 2: Confirm clean starting surface**

Run:

```bash
git status --short --branch
rg -n "Minimality Contract|smallest correct change|over-engineering|T1\\. Acceptance criterion|T2\\. Risk-tier" source/doctrine source/protocols source/skills/claude/legion/implementer-prompt.md source/skills/claude/references/verification/templates/mini-checkit.md
```

Expected: status is clean or only this case doc is dirty; the `rg` command returns no active Minimality Contract clauses in the target source files.

- [ ] **Step 3: Verify untouched boundaries before edits**

Run:

```bash
git diff -- source/protocols/plan-format.md
git diff -- source/skills/claude/legion/SKILL.md
git diff -- claude/CLAUDE.md
git diff -- source/skills/claude/references/verification/templates/campaign-review.md source/skills/claude/references/verification/templates/spec-verification.md source/skills/claude/references/verification/templates/plan-verification.md
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
git diff -- "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md" "$CONSILIUM_DOCS/doctrine/known-gaps.md" "$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md" "$CONSILIUM_DOCS/doctrine/fix-thresholds.md"
```

Expected: all commands print no diff.

## Task 1: Add Minimality To Execution Law

> **Confidence: High** - implements [spec §S1 - Execution Doctrine](spec.md#s1-execution-doctrine--sourcedoctrineexecution-lawmd), [spec §C1 - Default](spec.md#c1-default), [spec §C2 - Allowed Triggers](spec.md#c2-allowed-triggers), and [spec §C3 - Over-Engineering Smells](spec.md#c3-over-engineering-smells). Live source currently has tactical-vs-strategic law but no smallest-correct-change clause.

**Files:**

- Modify: `source/doctrine/execution-law.md`

- [ ] **Step 1: Insert the Minimality Contract section**

In `source/doctrine/execution-law.md`, insert this section between `Tactical vs strategic:` and `Validation:`.

```text
Minimality Contract:
- The smallest correct change that satisfies the task's acceptance criteria is the default.
- A one-line correct fix is better than defensive structure the orders did not request.
- Extra structure is allowed only when the implementer can name one trigger:
  - T1. Acceptance criterion: the task orders require it.
  - T2. Risk-tier or action-control invocation: only when the plan or dispatch envelope explicitly defines that control. The current plan format has no tiers, so T2 is dormant unless a future case introduces one.
  - T3. Existing codebase pattern: the structure mirrors an established pattern in the touched module, and the implementer cites the precedent.
  - T4. Failing test or observed runtime failure: a test or observed failure demonstrates the need.
  - T5. Cited domain invariant: documented doctrine requires the structure.
- If no trigger applies, remove the structure before reporting.
- Over-engineering smells without a trigger: new abstractions, defensive wrappers, retry systems, fallback branches, new helpers, broad error handling, unrelated cleanup, extra tests outside the acceptance surface.
```

- [ ] **Step 2: Verify the execution-law clause**

Run:

```bash
rg -n "Minimality Contract|smallest correct change|T1\\. Acceptance criterion|T2\\. Risk-tier|T3\\. Existing codebase pattern|T4\\. Failing test|T5\\. Cited domain invariant|new abstractions, defensive wrappers, retry systems, fallback branches, new helpers, broad error handling, unrelated cleanup, extra tests outside the acceptance surface" source/doctrine/execution-law.md
```

Expected: all phrases return hits in `source/doctrine/execution-law.md`.

## Task 2: Add Implementation-Stage Authority To Verifier Law

> **Confidence: High** - implements [spec §S3 - Verifier Doctrine](spec.md#s3-verifier-doctrine--sourcedoctrineverifier-lawmd) and [spec §C4 - Verifier Authority](spec.md#c4-verifier-authority). Live source has finding categories, chain of evidence, and the deviation rule, but no over-engineering authority scoped to implementation output.

**Files:**

- Modify: `source/doctrine/verifier-law.md`

- [ ] **Step 1: Preserve the existing deviation rule**

Before editing, confirm the current deviation rule still exists:

```bash
rg -n "If implementation deviates from the plan but is clearly better and justified|Call drift only when the deviation makes the work worse" source/doctrine/verifier-law.md
```

Expected: both lines return hits.

- [ ] **Step 2: Insert the over-engineering authority section**

In `source/doctrine/verifier-law.md`, insert this section after the existing `Deviation rule:` bullets. Do not rewrite the existing deviation rule.

```text
Implementation minimality:
- The Minimality Contract applies only when reviewing implementation output.
- Tribunus may apply it per task. The Campaign-review triad may apply it at end-of-campaign.
- Spec-stage and plan-stage verifiers do not have an over-engineering surface because they are not reviewing implementation output.
- Flag unjustified structure with chain of evidence: name the structure, name the missing trigger from execution-law, and name the finding category.
- Use `CONCERN` by default when the structure is unrequested but does not change behavior or violate an invariant.
- Upgrade to `GAP` when the unjustified structure changes observable behavior, breaks a contract, or violates a documented invariant.
- Return `SOUND` when the added structure is clearly justified or is a clear improvement under the deviation rule.
```

- [ ] **Step 3: Verify verifier-law scope and categories**

Run:

```bash
rg -n 'Implementation minimality|reviewing implementation output|Spec-stage and plan-stage verifiers|name the structure, name the missing trigger|Use `CONCERN` by default|Upgrade to `GAP`|Return `SOUND`' source/doctrine/verifier-law.md
rg -n "If implementation deviates from the plan but is clearly better and justified|Call drift only when the deviation makes the work worse" source/doctrine/verifier-law.md
```

Expected: all new authority phrases return hits, and the original deviation-rule lines still return hits unchanged.

## Task 3: Add Minimality To Legatus Routing

> **Confidence: High** - implements [spec §S2 - Legatus Protocol](spec.md#s2-legatus-protocol--sourceprotocolslegatus-routingmd). Live source has Centurion Dispatch Law and Execution Doctrine, but no Minimality block.

**Files:**

- Modify: `source/protocols/legatus-routing.md`
- Do not modify: `source/skills/claude/legion/SKILL.md`

- [ ] **Step 1: Insert the protocol block**

In `source/protocols/legatus-routing.md`, insert this section after the `Centurion Dispatch Law` `Do not:` list and before `## Fix Thresholds`.

```text
## Minimality Contract

- Centurios execute the smallest correct change that satisfies the task's acceptance criteria.
- Extra structure requires a named trigger from `source/doctrine/execution-law.md`.
- If no trigger applies, the Centurio removes the structure before reporting.
- This block does not change debug-fix intake, fix-threshold routing, or dispatch rejection rules.
```

- [ ] **Step 2: Verify routing block and no debug routing edits**

Run:

```bash
rg -n "## Minimality Contract|smallest correct change|source/doctrine/execution-law.md|does not change debug-fix intake" source/protocols/legatus-routing.md
git diff -- source/skills/claude/legion/SKILL.md
```

Expected: Minimality block returns hits in `legatus-routing.md`; `legion/SKILL.md` diff is empty.

## Task 4: Operationalize Minimality In The Centurio Dispatch Template

> **Confidence: High** - implements [spec §S4 - Centurio Dispatch Template](spec.md#s4-centurio-dispatch-template--sourceskillsclaudelegionimplementer-promptmd). Live source has the YAGNI self-review question, but it is advisory rather than a trigger-naming gate.

**Files:**

- Modify: `source/skills/claude/legion/implementer-prompt.md`

- [ ] **Step 1: Add the pre-work Minimality Contract block**

In `source/skills/claude/legion/implementer-prompt.md`, inside the prompt template, insert this block after the paragraph that begins `Do not ask about ordinary implementation friction.` and before `## Your Task`.

```text
    ## Minimality Contract

    The smallest correct change that satisfies the orders is the default.

    Extra structure is allowed only when I can name one trigger:
    - T1. Acceptance criterion: the task orders require it.
    - T2. Risk-tier or action-control invocation: only when the plan or dispatch envelope explicitly defines that control. The current plan format has no tiers, so T2 is dormant unless a future case introduces one.
    - T3. Existing codebase pattern: the structure mirrors an established pattern in the touched module, and I cite the precedent.
    - T4. Failing test or observed runtime failure: a test or observed failure demonstrates the need.
    - T5. Cited domain invariant: documented doctrine requires the structure.

    Over-engineering smells without a trigger: new abstractions, defensive wrappers, retry systems, fallback branches, new helpers, broad error handling, unrelated cleanup, extra tests outside the acceptance surface.

    Before reporting, for every helper, branch, abstraction, fallback, retry, or test in my diff, I can name the trigger from the allowed list and include that trigger in my self-review findings. If I cannot name the trigger, I remove the structure before reporting.
```

- [ ] **Step 2: Replace the advisory YAGNI self-review bullet**

In the `**Discipline:**` self-review list, replace:

```text
    - Did I build only what was ordered? (YAGNI)
```

with:

```text
    - For every helper, branch, abstraction, fallback, retry, or test in my diff, did I name the Minimality Contract trigger in my self-review findings? If not, did I remove it before reporting?
```

- [ ] **Step 3: Clarify the report-format self-review line**

In the `## Report Format` list, replace:

```text
    - Self-review findings (if any)
```

with:

```text
    - Self-review findings (including Minimality trigger names for any added structure)
```

This preserves the existing report-format field and makes the trigger evidence available to the Tribunus.

- [ ] **Step 4: Verify the implementer prompt gate**

Run:

```bash
rg -n "## Minimality Contract|smallest correct change|Extra structure is allowed only when I can name one trigger|Over-engineering smells without a trigger|for every helper, branch, abstraction, fallback, retry, or test in my diff|Minimality Contract trigger|Self-review findings \\(including Minimality trigger names" source/skills/claude/legion/implementer-prompt.md
```

Expected: all operational gate phrases return hits.

## Task 5: Add Minimality To The Tribunus Mini-Checkit Mission

> **Confidence: High** - implements [spec §S5 - Tribunus Mini-Checkit Dispatch](spec.md#s5-tribunus-mini-checkit-dispatch--sourceskillsclaudereferencesverificationtemplatesmini-checkitmd). Live source has a five-item mission list and a closing disclaimer that can suppress doctrinal Minimality findings unless qualified.

**Files:**

- Modify: `source/skills/claude/references/verification/templates/mini-checkit.md`
- Do not modify: `source/skills/claude/references/verification/templates/campaign-review.md`
- Do not modify: `source/skills/claude/references/verification/templates/spec-verification.md`
- Do not modify: `source/skills/claude/references/verification/templates/plan-verification.md`

- [ ] **Step 1: Add the implementer report to the dispatch payload**

In `source/skills/claude/references/verification/templates/mini-checkit.md`, insert this section after `## The Task Output` and before `## The Plan Step`.

```text
    ## Implementer Report

    The implementing agent reported:

    {PASTE IMPLEMENTER REPORT — status, tests, files changed, and self-review findings}
```

This gives the Tribunus the trigger-name evidence it is ordered to verify.

- [ ] **Step 2: Replace the current Deviation assessment item**

In `source/skills/claude/references/verification/templates/mini-checkit.md`, replace the current item `5. Deviation assessment` with this text.

```text
    5. Deviation assessment and Minimality Contract: if the implementation
       differs from the plan step, is it an improvement or drift? For each
       helper, branch, abstraction, fallback, retry, broad error handler,
       unrelated cleanup, or extra test beyond the acceptance surface, does
       the implementer's report name a trigger from execution-law, and does
       the file evidence support that trigger?
       - Improvement or justified structure:
         report SOUND with reasoning.
       - Unjustified added structure with no behavior change or invariant break:
         report CONCERN with evidence.
       - Drift, missed requirement, domain error, behavior change, contract
         break, or documented invariant violation:
         report GAP or MISUNDERSTANDING.
```

- [ ] **Step 3: Qualify the closing disclaimer**

In the mission close, replace:

```text
    move on. No essays. No architectural opinions. No style suggestions.
```

with:

```text
    move on. No essays. No style suggestions. No architectural opinions unless
    the issue is a Minimality Contract finding with chain-of-evidence.
```

- [ ] **Step 4: Verify mini-checkit mission scope**

Run:

```bash
rg -n "## Implementer Report|Deviation assessment and Minimality Contract|does the implementer's report name a trigger|file evidence support that trigger|Unjustified added structure|report CONCERN|Minimality Contract finding with chain-of-evidence" source/skills/claude/references/verification/templates/mini-checkit.md
git diff -- source/skills/claude/references/verification/templates/campaign-review.md source/skills/claude/references/verification/templates/spec-verification.md source/skills/claude/references/verification/templates/plan-verification.md
```

Expected: Minimality mission phrases return hits in `mini-checkit.md`; all three untouched template diffs are empty.

## Task 6: Generate Derived Runtime Surfaces

> **Confidence: High** - implements [spec §Expected Active File Surfaces](spec.md#expected-active-file-surfaces) and [spec §Acceptance Criteria](spec.md#acceptance-criteria). Runtime unification makes `source/` canonical; generated and compatibility paths must be derived, not hand-edited.

**Files:**

- Modify by generator only: `generated/**`
- Modify by generator only: `claude/skills/**`
- Modify by generator only: `codex/source/**`
- Modify by generator only: `codex/agents/consilium-*.toml`
- Modify by generator only: `codex/config/codex-config-snippet.toml` if the generator touches it

- [ ] **Step 1: Run the generator**

Run:

```bash
python3 runtimes/scripts/generate.py
```

Expected: generator exits 0 and reports generated Claude/Codex surfaces.

- [ ] **Step 2: Review changed paths**

Run:

```bash
git diff --name-only
git status --short --untracked-files=all
fd -a -H '^consilium-.*-(light|heavy)\.(md|toml)$' source generated claude codex
```

Expected changed paths are limited to:

- this case `plan.md`
- the five canonical source files from Tasks 1-5
- generated and compatibility outputs derived from those source files
- affected Codex agent TOMLs whose included doctrine, protocol, or skill text changed

Halt if the changed path set includes:

- `source/protocols/plan-format.md`
- `source/skills/claude/legion/SKILL.md`
- `claude/CLAUDE.md`
- `source/skills/claude/references/verification/templates/campaign-review.md`
- `source/skills/claude/references/verification/templates/spec-verification.md`
- `source/skills/claude/references/verification/templates/plan-verification.md`
- `source/manifest.json`
- `source/roles/**`
- diagnosis doctrine files
- Principales MCP package files
- new lint scripts
- new agent files
- any `consilium-*-light` or `consilium-*-heavy` file

Expected: `git status --short --untracked-files=all` has no untracked generated, agent, template, script, or config files. The `fd` light/heavy scan prints nothing.

## Task 7: Verify, Install, And Commit

> **Confidence: High** - implements [spec §Verification Checks](spec.md#verification-checks) and the runtime-unification proof chain. This is the gate that prevents a source-only change from masquerading as an active runtime change.

- [ ] **Step 1: Verify source acceptance**

Run:

```bash
rg -n "smallest correct change" source/doctrine source/protocols source/skills/claude/legion/implementer-prompt.md
rg -n "Minimality Contract" source/doctrine source/protocols source/skills/claude/legion/implementer-prompt.md source/skills/claude/references/verification/templates/mini-checkit.md
rg -n "new abstractions, defensive wrappers, retry systems, fallback branches, new helpers, broad error handling, unrelated cleanup, extra tests outside the acceptance surface" source/doctrine/execution-law.md
git diff -- source/protocols/plan-format.md
git diff -- source/skills/claude/legion/SKILL.md
git diff -- claude/CLAUDE.md
git diff -- source/skills/claude/references/verification/templates/campaign-review.md source/skills/claude/references/verification/templates/spec-verification.md source/skills/claude/references/verification/templates/plan-verification.md
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
git diff -- "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md" "$CONSILIUM_DOCS/doctrine/known-gaps.md" "$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md" "$CONSILIUM_DOCS/doctrine/fix-thresholds.md"
```

Expected:

- first `rg` returns hits in `execution-law.md`, `legatus-routing.md`, and `implementer-prompt.md`
- second `rg` returns hits in `execution-law.md`, `verifier-law.md`, `legatus-routing.md`, `implementer-prompt.md`, and `mini-checkit.md`
- smell-list `rg` returns one hit in `execution-law.md`
- all `git diff -- <untouched files>` commands print no diff

- [ ] **Step 2: Verify repo runtime parity**

Run:

```bash
python3 runtimes/scripts/check-runtime-parity.py
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
python3 codex/scripts/check-shared-docs-adoption.py
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Snapshot installed runtime state before install**

Run:

```bash
tmp_runtime="/tmp/consilium-minimality-runtime-install"
rm -rf "$tmp_runtime"
mkdir -p "$tmp_runtime"
cp -p "$HOME/.codex/config.toml" "$tmp_runtime/codex-config-before.toml"
fd -a -H '^consilium-.*\.(md|toml)$' "$HOME/.claude/agents" "$HOME/.codex/agents" | sort > "$tmp_runtime/agents-before.txt"
if [ -L "$HOME/.agents/skills/tribune" ]; then
  readlink "$HOME/.agents/skills/tribune" > "$tmp_runtime/tribune-skill-before.txt"
elif [ -e "$HOME/.agents/skills/tribune" ]; then
  fd -a -H . "$HOME/.agents/skills/tribune" | sort > "$tmp_runtime/tribune-skill-before.txt"
else
  echo "missing" > "$tmp_runtime/tribune-skill-before.txt"
fi
printf 'runtime snapshot: %s\n' "$tmp_runtime"
```

Expected: the config snapshot, installed-agent list, and `tribune` skill target snapshot are created under `/tmp/consilium-minimality-runtime-install`.

- [ ] **Step 4: Install Claude agents and Codex runtime**

Run:

```bash
mkdir -p "$HOME/.claude/agents"
install -m 0644 generated/claude/agents/consilium-*.md "$HOME/.claude/agents/"
bash codex/scripts/install-codex.sh
```

Expected: generated Claude agents are copied to `~/.claude/agents`, and the Codex install exits 0 while syncing Codex agents, the Codex `tribune` skill, and Codex config from generated surfaces.

- [ ] **Step 5: Verify installed runtime parity**

Run:

```bash
python3 claude/scripts/check-codex-drift.py
fd -a -H '^consilium-.*-(light|heavy)\.(md|toml)$' "$HOME/.claude/agents" "$HOME/.codex/agents"
rg -n "Minimality Contract|over-engineering|smallest correct change|Implementation minimality" ~/.claude/agents/consilium-tribunus.md ~/.codex/agents/consilium-tribunus.toml ~/.codex/agents/consilium-centurio-primus.toml
tmp_runtime="/tmp/consilium-minimality-runtime-install"
cp -p "$HOME/.codex/config.toml" "$tmp_runtime/codex-config-after.toml"
fd -a -H '^consilium-.*\.(md|toml)$' "$HOME/.claude/agents" "$HOME/.codex/agents" | sort > "$tmp_runtime/agents-after.txt"
if [ -L "$HOME/.agents/skills/tribune" ]; then
  readlink "$HOME/.agents/skills/tribune" > "$tmp_runtime/tribune-skill-after.txt"
elif [ -e "$HOME/.agents/skills/tribune" ]; then
  fd -a -H . "$HOME/.agents/skills/tribune" | sort > "$tmp_runtime/tribune-skill-after.txt"
else
  echo "missing" > "$tmp_runtime/tribune-skill-after.txt"
fi
diff -u "$tmp_runtime/agents-before.txt" "$tmp_runtime/agents-after.txt"
diff -u "$tmp_runtime/tribune-skill-before.txt" "$tmp_runtime/tribune-skill-after.txt"
```

Expected:

- drift check exits 0
- `fd` light/heavy scan prints nothing
- installed agent spot-read shows the Minimality and implementation-minimality clauses in installed runtime files
- installed agent-name list is unchanged unless the plan explicitly changed the agent set
- `tribune` skill target is unchanged unless the plan explicitly changed the skill install target

- [ ] **Step 6: Final changed-path review**

Run:

```bash
git diff --name-only
git status --short --branch --untracked-files=all
fd -a -H '^consilium-.*-(light|heavy)\.(md|toml)$' source generated claude codex "$HOME/.claude/agents" "$HOME/.codex/agents"
```

Expected: changed paths are limited to this plan, the five canonical source surfaces, and generator-derived runtime outputs. No unrelated dirty or untracked files are present. The light/heavy scan prints nothing.

- [ ] **Step 7: Commit**

Run:

```bash
git add docs/cases/2026-04-29-consilium-minimality-contract/plan.md source/doctrine/execution-law.md source/doctrine/verifier-law.md source/protocols/legatus-routing.md source/skills/claude/legion/implementer-prompt.md source/skills/claude/references/verification/templates/mini-checkit.md generated claude/skills codex/source codex/agents codex/config
git commit -m "consul: add minimality contract"
```

Expected: commit succeeds. Do not add `Co-authored-by` trailers.

## Verifier Brief

After implementation and before merge, dispatch verification against the implementation output, not the spec alone.

Ask `consilium-tribunus` or the march verifier to check:

- source edits match Tasks 1-5
- generated surfaces were produced by `python3 runtimes/scripts/generate.py`
- installed runtime parity is proven
- no out-of-scope files changed
- the Mini-Checkit template still remains patrol-depth and single-pass

Ask `consilium-provocator` if the changed diff is larger than the five canonical source edits plus generated outputs, or if the implementer claims a new helper/template/script was necessary.

## Acceptance Checklist

- [ ] Execution law has C1, C2 with dormant T2, and the C3 eight-smell list.
- [ ] Verifier law has implementation-stage over-engineering authority and preserves the deviation rule.
- [ ] Legatus routing cross-references `execution-law.md` without changing debug-fix intake or fix thresholds.
- [ ] Centurio dispatch template has a pre-work Minimality block and operational self-review gate.
- [ ] Mini-checkit mission checks unjustified added structure and qualifies the architectural-opinion disclaimer.
- [ ] No new agents, templates, scripts, model-routing config, or plan-format fields exist.
- [ ] Runtime generator, repo parity, install wrapper, installed parity, and diff check pass.
- [ ] Installed runtime spot-read confirms the Contract is visible to Tribunus and Centurio.
