# Codex Drift Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile Consilium Codex source, generated TOML agents, and installed user-scope agents so later runtime upgrades start from one trustworthy chain.

**Architecture:** Treat installed runtime as evidence, not source truth. Promote the currently observed installed-only execution behavior into `codex/source/*`, regenerate `codex/agents/*.toml`, install through the repo installer, and prove installed parity. This plan deliberately avoids minimality, risk-tier, model-routing, Claude-agent, and verifier-cadence changes.

**Tech Stack:** Markdown prompt source, JSON manifest, Python generator/checker scripts, Bash installer, generated TOML Codex agents.

**Spec:** `spec.md`

---

## Scope Guard

Do not modify Claude agents under `/Users/milovan/.claude/agents`.

Do not change `model`, `reasoning_effort`, `sandbox_mode`, agent names, nickname candidates, descriptions, or manifest routing.

Do not add new lint scripts, conflict scanners, light/heavy variants, risk tiers, Consul Brief behavior, minimality rules, or Legion wave execution.

The only accepted behavioral move in this plan is to promote the current installed-only hesitation-control language into source truth.

## File Plan

**Create**

- `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-installed-drift-classification.md`
- `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-before.txt`
- `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-after.txt`

**Modify**

- `/Users/milovan/projects/Consilium/codex/source/doctrine/execution-law.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/legatus.md`
- `/Users/milovan/projects/Consilium/codex/source/protocols/legatus-routing.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-front.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-back.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-primus.md`
- `/Users/milovan/projects/Consilium/codex/agents/consilium-*.toml`
- `/Users/milovan/.codex/agents/consilium-*.toml`
- `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/STATUS.md`

## Task 1: Preflight And Record Drift Classification

> **Confidence: High** — implements [spec §2 — Current Evidence](spec.md#current-evidence), [spec §6 — Reconciliation Rules](spec.md#reconciliation-rules), and [spec §8 — Acceptance Criteria](spec.md#acceptance-criteria). Live reconnaissance found exactly four generated-vs-installed drifts: Legatus plus the three Centurions.

**Files:**

- Create: `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-installed-drift-classification.md`
- Create: `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-before.txt`
- Read: `/Users/milovan/projects/Consilium/codex/agents/consilium-legatus.toml`
- Read: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-front.toml`
- Read: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-back.toml`
- Read: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-primus.toml`
- Read: `/Users/milovan/.codex/agents/consilium-legatus.toml`
- Read: `/Users/milovan/.codex/agents/consilium-centurio-front.toml`
- Read: `/Users/milovan/.codex/agents/consilium-centurio-back.toml`
- Read: `/Users/milovan/.codex/agents/consilium-centurio-primus.toml`

- [ ] **Step 1: Resolve shared docs**

Run:

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
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

- [ ] **Step 2: Record current Claude agent mtimes before any install work**

Run:

```bash
find /Users/milovan/.claude/agents -maxdepth 1 -type f -name 'consilium-*.md' -exec stat -f '%m %N' {} \; | sort > /Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-before.txt
```

Expected: the file is created. Do not edit anything under `/Users/milovan/.claude/agents`.

- [ ] **Step 3: Confirm generated source parity still passes**

Run:

```bash
cd /Users/milovan/projects/Consilium
python3 codex/scripts/check-shared-docs-adoption.py
```

Expected: `Codex shared-docs adoption check passed.`

- [ ] **Step 4: Confirm installed parity exposes the known four-file drift**

Run:

```bash
cd /Users/milovan/projects/Consilium
python3 codex/scripts/check-shared-docs-adoption.py --installed
```

Expected: command exits non-zero and reports differences for exactly these four installed files:

```text
/Users/milovan/.codex/agents/consilium-legatus.toml
/Users/milovan/.codex/agents/consilium-centurio-front.toml
/Users/milovan/.codex/agents/consilium-centurio-back.toml
/Users/milovan/.codex/agents/consilium-centurio-primus.toml
```

Halt if any other installed agent differs, is missing, or is extra.

- [ ] **Step 5: Inspect the four installed diffs**

Run each command separately:

```bash
diff -u /Users/milovan/projects/Consilium/codex/agents/consilium-legatus.toml /Users/milovan/.codex/agents/consilium-legatus.toml
diff -u /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-front.toml /Users/milovan/.codex/agents/consilium-centurio-front.toml
diff -u /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-back.toml /Users/milovan/.codex/agents/consilium-centurio-back.toml
diff -u /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-primus.toml /Users/milovan/.codex/agents/consilium-centurio-primus.toml
```

Expected: each command exits 1 because the files differ. The only differences must be developer-instruction wording around bounded evidence, tactical friction, `DONE_WITH_CONCERNS`, and fix-versus-escalate classification. Halt if metadata keys differ.

- [ ] **Step 6: Create the pre-install classification record**

Write `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-installed-drift-classification.md` with:

```markdown
# Installed Drift Classification

## Decision

All currently observed installed-only deltas are classified as **Promote to source**.

No installed-only delta is classified as **Discard**.

No installed-only delta is classified as **Needs decision**.

## Reason

The installed-only language narrows hesitation without allowing strategic guessing. It keeps product, architecture, money, proof, order, permissions, workflow lifecycle, and cross-repo ownership decisions protected while telling execution agents to resolve local reversible implementation friction through bounded evidence.

## Promote To Shared Source

Target: `/Users/milovan/projects/Consilium/codex/source/doctrine/execution-law.md`

Promote:

- replace `Ask before guessing` with `Do not guess`
- require bounded evidence before asking when the ambiguity is strategic or product-level
- add `Classify before acting`
- define tactical friction, missing local fact, and strategic ambiguity
- prohibit both fixing and escalating the same issue
- restrict asking to product behavior, public contract, architecture, repo ownership, data model, permissions, money, proof, order, or workflow lifecycle
- define ordinary implementation friction as tactical
- require local, reversible, traceable, verifiable choices to keep moving
- narrow `DONE_WITH_CONCERNS` to concrete residual concerns after verification
- narrow `NEEDS_CONTEXT` to missing information after bounded evidence gathering
- add that careful execution is not hesitation

## Promote To Legatus Source

Targets:

- `/Users/milovan/projects/Consilium/codex/source/roles/legatus.md`
- `/Users/milovan/projects/Consilium/codex/source/protocols/legatus-routing.md`

Promote:

- Legatus owns preventing tactical uncertainty from becoming a hesitation loop
- Legatus does not let Centurions bounce between options when bounded evidence can settle the local choice
- Legatus forces classification before a Centurion both fixes and escalates the same issue
- Legatus does not halt on ordinary implementation friction

## Promote To Centurion Source

Targets:

- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-front.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-back.md`
- `/Users/milovan/projects/Consilium/codex/source/roles/centurio-primus.md`

Promote:

- Centurions verify before asking when the choice is local, reversible, traceable to the order, and verifiable
- Centurions classify tactical versus strategic before deciding whether to fix or stop
- Centurions reserve `DONE_WITH_CONCERNS` for concrete residual concerns after verification
- Centurio Primus stops reopening already-reduced ambiguity and executes the smallest on-plan move

## Discard

None.

## Needs Decision

None.
```

Expected: this record exists before any install command runs.

## Task 2: Promote Shared Execution Law

> **Confidence: High** — implements [spec §4 — Scope In](spec.md#scope-in) and [spec §6 — Reconciliation Rules](spec.md#reconciliation-rules). `codex/source/doctrine/execution-law.md` is included by Legatus and all three Centurions in `/Users/milovan/projects/Consilium/codex/source/manifest.json`.

**Files:**

- Modify: `/Users/milovan/projects/Consilium/codex/source/doctrine/execution-law.md`

- [ ] **Step 1: Replace the shared execution law**

Replace the entire contents of `/Users/milovan/projects/Consilium/codex/source/doctrine/execution-law.md` with:

```markdown
## Execution Law

Do not guess:
- If two strategic or product interpretations remain plausible after bounded evidence gathering, stop and ask.
- Guessing through real ambiguity is dereliction, not initiative.

Classify before acting:
- Tactical friction: fix it, verify it, and mention it in the final report.
- Missing local fact: run one bounded evidence pass, then reclassify as tactical or strategic.
- Strategic ambiguity: stop before fixing and report NEEDS_CONTEXT or BLOCKED.
- Do not both fix and escalate the same issue. If it is safe inside the task boundary, fix it. If it is not safe inside the task boundary, report it before changing code.
- Ask only when the answer changes product behavior, public contract, architecture, repo ownership, data model, permissions, money, proof, order, or workflow lifecycle.
- Ordinary implementation friction is not ambiguity: moved paths, import syntax, helper names, minor type mismatches, and test setup issues are tactical. Resolve them locally using live code, docs, and existing patterns.
- If the choice is local, reversible, traceable to the order, and verifiable, make the choice and report it.

Work status:
- `DONE`: implemented as ordered and verified.
- `DONE_WITH_CONCERNS`: implemented and verified, with a concrete residual concern worth surfacing. Do not use this for tactical friction already fixed.
- `NEEDS_CONTEXT`: blocked on missing information after bounded evidence gathering.
- `BLOCKED`: cannot proceed without changing the plan, contract, or strategy.

Tactical vs strategic:
- Tactical adaptation is allowed: moved file path, import syntax, small type mismatch, equivalent mechanical adjustment.
- Strategic deviation is not allowed: changing the architecture, inventing patterns, crossing repo lanes blindly, or rewriting the approach.
- Careful execution is not the same as hesitation. If the task remains inside the approved boundary, keep moving.

Validation:
- Run the narrowest relevant checks before reporting.
- Do not claim success on unverified work.
```

- [ ] **Step 2: Verify the source file contains the promoted shared anchor**

Run:

```bash
rg -n "Classify before acting|Do not both fix and escalate|Careful execution is not the same as hesitation" /Users/milovan/projects/Consilium/codex/source/doctrine/execution-law.md
```

Expected: all three phrases are reported from `execution-law.md`.

## Task 3: Promote Legatus-Specific Language

> **Confidence: High** — implements [spec §4 — Scope In](spec.md#scope-in) and [spec §6 — Reconciliation Rules](spec.md#reconciliation-rules). The Legatus installed drift is role/protocol behavior, not shared execution law.

**Files:**

- Modify: `/Users/milovan/projects/Consilium/codex/source/roles/legatus.md`
- Modify: `/Users/milovan/projects/Consilium/codex/source/protocols/legatus-routing.md`

- [ ] **Step 1: Add the Legatus ownership bullet**

In `/Users/milovan/projects/Consilium/codex/source/roles/legatus.md`, update the `You own:` block so it reads:

```markdown
You own:
- turning approved plans into executable steps
- choosing the correct Centurion
- deciding when a Tribunus check is worth the pause
- halting the march when assumptions break
- preventing tactical uncertainty from becoming a hesitation loop
- keeping execution traceable back to approved intent
```

- [ ] **Step 2: Add the Legatus quality bar bullets**

In the same file, update the `Quality bar:` block so it reads:

```markdown
Quality bar:
- I do not let a Centurion discover and redesign in the same breath.
- I do not accept vague status language when the real status is concern or blockage.
- I do not improvise strategy under the banner of efficiency.
- I do not let Centurions bounce between options when a bounded evidence pass can settle the local choice.
- I do not let a Centurion both fix and escalate the same issue. I force classification first.
```

- [ ] **Step 3: Add the Legatus routing execution doctrine bullets**

In `/Users/milovan/projects/Consilium/codex/source/protocols/legatus-routing.md`, update the final `## Execution Doctrine` list so it reads:

```markdown
## Execution Doctrine

- Keep steps small enough that a Centurion can execute without inventing strategy.
- Do not ask Centurions to both discover and build if a Speculator or Interpres should answer first.
- Halt on real ambiguity instead of hoping verification catches it later.
- Do not halt on ordinary implementation friction. If the issue is local, reversible, traceable to the order, and verifiable, dispatch or re-dispatch with a bounded check and execution order.
- If a Centurion asks whether to fix or report the same issue, force classification: tactical means fix then report; strategic means report before fixing.
```

- [ ] **Step 4: Verify the Legatus source anchors**

Run:

```bash
rg -n "preventing tactical uncertainty|bounded evidence pass|ordinary implementation friction|force classification" /Users/milovan/projects/Consilium/codex/source/roles/legatus.md /Users/milovan/projects/Consilium/codex/source/protocols/legatus-routing.md
```

Expected: each phrase appears in the named source files.

## Task 4: Promote Centurion-Specific Language

> **Confidence: High** — implements [spec §4 — Scope In](spec.md#scope-in) and [spec §6 — Reconciliation Rules](spec.md#reconciliation-rules). The installed Centurion deltas are role-specific summaries of the shared execution law.

**Files:**

- Modify: `/Users/milovan/projects/Consilium/codex/source/roles/centurio-front.md`
- Modify: `/Users/milovan/projects/Consilium/codex/source/roles/centurio-back.md`
- Modify: `/Users/milovan/projects/Consilium/codex/source/roles/centurio-primus.md`

- [ ] **Step 1: Replace the frontend Centurion operational doctrine**

In `/Users/milovan/projects/Consilium/codex/source/roles/centurio-front.md`, update the `Operational doctrine:` block so it reads:

```markdown
Operational doctrine:
- Verify before asking. If the choice is local, reversible, traceable to the order, and verifiable, make it and keep moving.
- Do not both fix and escalate the same issue. Tactical means fix then report; strategic means stop before changing code.
- Stay in the frontend lane unless explicitly ordered to read across the boundary.
- If the contract smells cross-repo, halt and raise it.
- Report `DONE_WITH_CONCERNS` only when a concrete residual concern remains after verification. Pride without honesty is dereliction; hesitation without evidence is not discipline.
```

- [ ] **Step 2: Replace the backend Centurion operational doctrine**

In `/Users/milovan/projects/Consilium/codex/source/roles/centurio-back.md`, update the `Operational doctrine:` block so it reads:

```markdown
Operational doctrine:
- Verify before asking. If the choice is local, reversible, traceable to the order, and verifiable, make it and keep moving.
- Do not both fix and escalate the same issue. Tactical means fix then report; strategic means stop before changing code.
- Protect tenant isolation and workflow truth first.
- If a route contract or status rule is unclear, halt instead of improvising.
- Report `DONE_WITH_CONCERNS` when the code works but a concrete verified concern remains.
- For Medusa backend work, load `building-with-medusa` and the relevant Medusa references before editing.
- If mutation placement is unclear, check Medusa docs or MCP before writing code.
- Do not place mutation business logic directly in routes or bypass workflows with route-to-module mutation calls.
```

- [ ] **Step 3: Add the Centurio Primus operational doctrine bullets**

In `/Users/milovan/projects/Consilium/codex/source/roles/centurio-primus.md`, update the `Operational doctrine:` block so it reads:

```markdown
Operational doctrine:
- Do not volunteer for first contact with unclear cross-repo work.
- Enter only after the Arbiter, Interpres, or Speculator has reduced ambiguity.
- Rescue does not mean freelancing architecture.
- Once ambiguity is reduced, do not keep reopening it. Resolve tactical friction through bounded evidence, execute the smallest on-plan move, and verify.
- Do not both fix and escalate the same issue. Tactical means fix then report; strategic means stop before changing code.
```

- [ ] **Step 4: Verify the Centurion source anchors**

Run:

```bash
rg -n "Verify before asking|Do not both fix and escalate|concrete residual concern|concrete verified concern|Once ambiguity is reduced" /Users/milovan/projects/Consilium/codex/source/roles/centurio-front.md /Users/milovan/projects/Consilium/codex/source/roles/centurio-back.md /Users/milovan/projects/Consilium/codex/source/roles/centurio-primus.md
```

Expected: the promoted phrases appear in the relevant role files.

## Task 5: Regenerate And Verify Generated Runtime

> **Confidence: High** — implements [spec §7 — Required Verification](spec.md#required-verification) and [spec §8 — Acceptance Criteria](spec.md#acceptance-criteria). `/Users/milovan/projects/Consilium/codex/scripts/generate_agents.py` renders `codex/source/*` into `codex/agents/*.toml`.

**Files:**

- Modify: `/Users/milovan/projects/Consilium/codex/agents/consilium-legatus.toml`
- Modify: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-front.toml`
- Modify: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-back.toml`
- Modify: `/Users/milovan/projects/Consilium/codex/agents/consilium-centurio-primus.toml`
- Modify: any other `/Users/milovan/projects/Consilium/codex/agents/consilium-*.toml` regenerated because they include the edited shared doctrine

- [ ] **Step 1: Regenerate generated agents**

Run:

```bash
cd /Users/milovan/projects/Consilium
python3 codex/scripts/generate_agents.py
```

Expected: `Generated 15 agent TOMLs`.

- [ ] **Step 2: Verify source adoption still passes**

Run:

```bash
cd /Users/milovan/projects/Consilium
python3 codex/scripts/check-shared-docs-adoption.py
```

Expected: `Codex shared-docs adoption check passed.`

- [ ] **Step 3: Verify generated files contain promoted language**

Run:

```bash
rg -n "Classify before acting|Verify before asking|preventing tactical uncertainty|ordinary implementation friction|Once ambiguity is reduced" /Users/milovan/projects/Consilium/codex/agents/consilium-legatus.toml /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-front.toml /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-back.toml /Users/milovan/projects/Consilium/codex/agents/consilium-centurio-primus.toml
```

Expected: all five phrase groups appear in the relevant generated TOML files.

- [ ] **Step 4: Verify metadata did not change**

Run:

```bash
git -C /Users/milovan/projects/Consilium diff -- codex/source/manifest.json codex/config/codex-config-snippet.toml
```

Expected: no diff.

## Task 6: Install And Prove Installed Parity

> **Confidence: High** — implements [spec §7 — Required Verification](spec.md#required-verification) and [spec §8 — Acceptance Criteria](spec.md#acceptance-criteria). `/Users/milovan/projects/Consilium/codex/scripts/install-codex-agents.sh` is the supported installer and runs the installed parity check at the end.

**Files:**

- Modify: `/Users/milovan/.codex/agents/consilium-*.toml`
- Create: `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-after.txt`

- [ ] **Step 1: Install regenerated Codex agents**

Run:

```bash
cd /Users/milovan/projects/Consilium
bash codex/scripts/install-codex-agents.sh
```

Expected:

```text
Codex shared-docs adoption check passed.
Validated 15 TOML files
No extra consilium agent files detected in ~/.codex/agents
Codex shared-docs adoption check passed.
Installed Consilium Codex agents to /Users/milovan/.codex/agents
Start a new Codex thread or session to pick up newly added agent types.
```

- [ ] **Step 2: Run installed parity directly**

Run:

```bash
cd /Users/milovan/projects/Consilium
python3 codex/scripts/check-shared-docs-adoption.py --installed
```

Expected: `Codex shared-docs adoption check passed.`

- [ ] **Step 3: Confirm generated and installed files are byte-identical for every Consilium Codex agent**

Run:

```bash
cd /Users/milovan/projects/Consilium
for src in codex/agents/consilium-*.toml; do
  name="$(basename "$src")"
  cmp -s "$src" "/Users/milovan/.codex/agents/$name" || {
    echo "Installed mismatch: $name"
    exit 1
  }
done
echo "All generated Consilium Codex agents match installed runtime."
```

Expected: `All generated Consilium Codex agents match installed runtime.`

- [ ] **Step 4: Prove Claude agents were not touched**

Run:

```bash
find /Users/milovan/.claude/agents -maxdepth 1 -type f -name 'consilium-*.md' -exec stat -f '%m %N' {} \; | sort > /Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-after.txt
diff -u /Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-before.txt /Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/ref-claude-agent-mtimes-after.txt
```

Expected: `diff` exits 0 with no output.

## Task 7: Update Case Status And Report The Runtime Boundary

> **Confidence: High** — implements [spec §8 — Acceptance Criteria](spec.md#acceptance-criteria). The install script itself prints the fresh-session boundary, and the case status should reflect that the edict has been executed.

**Files:**

- Modify: `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/STATUS.md`

- [ ] **Step 1: Update case status after successful install**

Replace `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-codex-drift-reconciliation/STATUS.md` with:

```markdown
---
status: draft
opened: 2026-04-29
target: consilium
agent: codex
type: infra
sessions: 1
current_session: 1
---

## Current state

Codex source/generated/installed drift reconciliation has been executed. Source adoption and installed parity checks pass.

## What's next

- [ ] Start a fresh Codex session/thread before relying on the reinstalled agent definitions.
- [ ] Continue with the parallel Consilium upgrade lanes only after confirming the fresh runtime is loaded.

## Open questions

(none)
```

- [ ] **Step 2: Inspect the final working-tree diff**

Run:

```bash
git -C /Users/milovan/projects/Consilium status --short -- docs/cases/2026-04-29-codex-drift-reconciliation codex/source codex/agents codex/config codex/scripts
```

Expected: changes are limited to the case files, the six source files named in this plan, and regenerated agent TOMLs. There must be no changes under `codex/config` or `codex/scripts`.

- [ ] **Step 3: Final report**

Report:

- source adoption check passed
- installed parity check passed
- byte-identity check passed
- Claude agent mtime diff was empty
- all observed installed-only deltas were promoted to source
- no deltas were discarded
- no deltas required Milovan decision
- a fresh Codex session/thread is required before relying on the reinstalled definitions
