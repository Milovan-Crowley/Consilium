# Consilium Model Tiering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task.

**Goal:** Tier the 17-rank Consilium manifest so routine verifier and translation ranks use Tier II while orchestrators, adversarial synthesis ranks, Arbiter, and Centurions remain Tier I.

**Plan Scale:** Feature

**Implementation Shape:** Edit only `source/manifest.json` by hand in the Castra worktree. Regenerate repo-local runtime artifacts through `python3 runtimes/scripts/generate.py` and prove repo parity. Installed runtime parity is deferred until after merge, because the active Claude plugin symlink is checkout-bound. Generated and compatibility outputs are derived artifacts; do not hand-edit them. No `checkit-*` surface, user-scope runtime file, or skill symlink is part of the repo-only march.

**Scope In:**
- Tier the current 17-entry Consilium manifest.
- Set Tier II for `consilium-speculator-front`, `consilium-speculator-back`, `consilium-speculator-primus`, `consilium-tribunus`, `consilium-praetor`, `consilium-custos`, `consilium-interpres-front`, `consilium-interpres-back`, and `consilium-tabularius`.
- Preserve Tier I for `consilium-consul`, `consilium-legatus`, `consilium-censor`, `consilium-provocator`, `consilium-arbiter`, `consilium-centurio-front`, `consilium-centurio-back`, and `consilium-centurio-primus`.
- Regenerate repo-local Claude and Codex outputs and prove repo parity.
- Defer user-scope Claude and Codex runtime install plus installed parity until after merge from the active plugin checkout.

**Scope Out:**
- No `checkit-*` tiering.
- No new agents, retired agents, manifest fields, schemas, lookup tables, tools, or MCP-profile changes.
- No changes to `runtimes/scripts/generate.py`, `runtimes/scripts/check-runtime-parity.py`, role files, protocol files, or skill text.
- No runtime task-type model selection.
- No 16-agent fallback implementation.

**Verification:** `jq` tier-map checks on `source/manifest.json`; `python3 runtimes/scripts/generate.py`; `python3 runtimes/scripts/check-runtime-parity.py`; final repo-only diff-scope checks below. Do not run installed-parity or user-scope install commands in this Castra march.

---

### Task 1: Preflight the 17-Rank Terrain
> **Evidence:** Implements the Campaign 4 ordering gate in [spec §8 — Coordination With Concurrent Campaigns](spec.md#8-coordination-with-concurrent-campaigns). Live `main` after PR #6 has `source/manifest.json` with 17 entries and `consilium-tabularius` present.

**Files:**
- (none)
- Read: `source/manifest.json`
- Read: `docs/cases/2026-05-01-consilium-model-tiering/spec.md`
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`

**Objective:** Confirm the implementation starts from the merged Campaign 4 manifest and not the stale 16-agent fleet.

**Decisions already made:**
- If `consilium-tabularius` is absent, stop. Do not tier the 16-agent manifest.
- The valid implementation surface is the 17-entry manifest on current `main`.
- Repo parity must be green before the source edit so any later parity failure belongs to this campaign.

**Acceptance:**
- `source/manifest.json` has exactly 17 agents.
- `consilium-tabularius` exists.
- Repo-local runtime parity passes before the source edit.

**Verification:**
- Run: `git status --short --branch`
- Expected: branch is current with `origin/main`; unrelated dirty files may exist, but no dirty file under `docs/cases/2026-05-01-consilium-model-tiering/` except this plan.
- Run: `jq -e '.agents | length == 17 and any(.[]; .name == "consilium-tabularius")' source/manifest.json`
- Expected: prints `true`.
- Run: `python3 runtimes/scripts/check-runtime-parity.py`
- Expected: `Consilium repo runtime parity check passed.`

**Stop conditions:** Stop if the manifest is not the 17-entry shape. Stop if repo parity fails before any source edit.

### Task 2: Apply the Tier Bindings in the Manifest
> **Evidence:** Implements [spec §4 — Tier Definitions (Boundary Contract)](spec.md#4-tier-definitions-boundary-contract), [spec §5 — Per-Rank Tier Assignment](spec.md#5-per-rank-tier-assignment), and the Imperator's order that the source edit be `source/manifest.json` only.

**Files:**
- Modify: `source/manifest.json`

**Objective:** Set the rank-owned tier values in the canonical manifest without touching any derived runtime file by hand.

**Decisions already made:**
- Tier II entries must have `runtime_surfaces.claude.model: "sonnet"`, top-level `model: "gpt-5.5"`, and `reasoning_effort: "medium"`.
- Tier II ranks are exactly `consilium-speculator-front`, `consilium-speculator-back`, `consilium-speculator-primus`, `consilium-tribunus`, `consilium-praetor`, `consilium-custos`, `consilium-interpres-front`, `consilium-interpres-back`, and `consilium-tabularius`.
- Tier I preserved entries must have `runtime_surfaces.claude.model: "opus"`, top-level `model: "gpt-5.5"`, and `reasoning_effort: "xhigh"`.
- Tier I preserved entries are exactly `consilium-consul`, `consilium-legatus`, `consilium-censor`, `consilium-provocator`, `consilium-arbiter`, `consilium-centurio-front`, `consilium-centurio-back`, and `consilium-centurio-primus`.
- `consilium-tabularius` is already `sonnet` on the Claude side in the merged manifest; this task still verifies it and changes its Codex `reasoning_effort` to `medium`.
- Preserve manifest order, descriptions, nicknames, role files, include files, tool profiles, runtime surface enablement, and sandbox modes.
- Do not edit `codex/source/manifest.json`; it is a generated compatibility copy.

**Acceptance:**
- The only hand-edited source file is `source/manifest.json`.
- All nine Tier II entries carry `sonnet` plus `medium`.
- All eight Tier I preserved entries carry `opus` plus `xhigh`.
- No `checkit-*` file is touched.

**Verification:**
- Run:

```bash
jq -e '
  def by_name: .agents | map({key: .name, value: .}) | from_entries;
  by_name as $a |
  (["consilium-speculator-front", "consilium-speculator-back", "consilium-speculator-primus", "consilium-tribunus", "consilium-praetor", "consilium-custos", "consilium-interpres-front", "consilium-interpres-back", "consilium-tabularius"] | all(. as $n |
    ($a[$n].runtime_surfaces.claude.model == "sonnet") and
    ($a[$n].model == "gpt-5.5") and
    ($a[$n].reasoning_effort == "medium")
  )) and
  (["consilium-consul", "consilium-legatus", "consilium-censor", "consilium-provocator", "consilium-arbiter", "consilium-centurio-front", "consilium-centurio-back", "consilium-centurio-primus"] | all(. as $n |
    ($a[$n].runtime_surfaces.claude.model == "opus") and
    ($a[$n].model == "gpt-5.5") and
    ($a[$n].reasoning_effort == "xhigh")
  ))
' source/manifest.json
```

- Expected: prints `true`.
- Run: `git diff --name-only -- source`
- Expected: only `source/manifest.json`.

**Stop conditions:** Stop if a rank named above is missing, duplicated, or requires changing any file outside `source/manifest.json` to express the tier.

### Task 3: Regenerate and Prove Repo Parity
> **Evidence:** Implements [spec §6 — Acceptance Criteria](spec.md#6-acceptance-criteria). Live generator evidence: `runtimes/scripts/generate.py` reads `source/manifest.json`, renders Codex `model_reasoning_effort` from top-level `reasoning_effort`, renders Claude frontmatter from `runtime_surfaces.claude.model`, and syncs repo compatibility copies.

**Files:**
- Modify: `codex/source/manifest.json`
- Modify: `generated/codex/config/codex-config-snippet.toml`
- Modify: `codex/config/codex-config-snippet.toml`
- Modify: `generated/claude/agents/consilium-custos.md`
- Modify: `generated/claude/agents/consilium-interpres-back.md`
- Modify: `generated/claude/agents/consilium-interpres-front.md`
- Modify: `generated/claude/agents/consilium-praetor.md`
- Modify: `generated/claude/agents/consilium-speculator-back.md`
- Modify: `generated/claude/agents/consilium-speculator-front.md`
- Modify: `generated/claude/agents/consilium-speculator-primus.md`
- Modify: `generated/claude/agents/consilium-tabularius.md`
- Modify: `generated/claude/agents/consilium-tribunus.md`
- Modify: `generated/codex/agents/consilium-custos.toml`
- Modify: `generated/codex/agents/consilium-interpres-back.toml`
- Modify: `generated/codex/agents/consilium-interpres-front.toml`
- Modify: `generated/codex/agents/consilium-praetor.toml`
- Modify: `generated/codex/agents/consilium-speculator-back.toml`
- Modify: `generated/codex/agents/consilium-speculator-front.toml`
- Modify: `generated/codex/agents/consilium-speculator-primus.toml`
- Modify: `generated/codex/agents/consilium-tabularius.toml`
- Modify: `generated/codex/agents/consilium-tribunus.toml`
- Modify: `codex/agents/consilium-custos.toml`
- Modify: `codex/agents/consilium-interpres-back.toml`
- Modify: `codex/agents/consilium-interpres-front.toml`
- Modify: `codex/agents/consilium-praetor.toml`
- Modify: `codex/agents/consilium-speculator-back.toml`
- Modify: `codex/agents/consilium-speculator-front.toml`
- Modify: `codex/agents/consilium-speculator-primus.toml`
- Modify: `codex/agents/consilium-tabularius.toml`
- Modify: `codex/agents/consilium-tribunus.toml`
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Read: `generated/claude/agents/`
- Read: `generated/codex/agents/`
- Read: `codex/agents/`
- Read: `codex/source/`

**Objective:** Derive every repo-local runtime artifact from the manifest edit and prove source-to-generated-to-compatibility parity before installing anything user-scoped.

**Decisions already made:**
- Run `python3 runtimes/scripts/generate.py` directly. Do not substitute a Codex installer as the primary regeneration proof.
- Do not hand-edit generated or compatibility outputs; they are listed above because the generator rewrites them and the Legatus needs the collision surface.
- Repo parity proof comes before installed parity proof.
- Expected generated shape for this 17-entry manifest: 17 Codex agents and 15 Claude agents. Claude has 15 because `consilium-consul` and `consilium-legatus` are Claude skill surfaces, not Claude agent files.

**Acceptance:**
- Generator exits zero.
- Generated Tier II Claude agent frontmatter uses `model: sonnet`.
- Generated Tier II Codex TOMLs use `model_reasoning_effort = "medium"`.
- Repo parity checker exits zero.

**Verification:**
- Run: `python3 runtimes/scripts/generate.py`
- Expected: output includes `Generated 17 Codex agents`, `Generated 15 Claude agents`, and `Synced 4 compatibility paths`.
- Run:

```bash
for rank in consilium-speculator-front consilium-speculator-back consilium-speculator-primus consilium-tribunus consilium-praetor consilium-custos consilium-interpres-front consilium-interpres-back consilium-tabularius; do
  rg -n '^model: sonnet$' "generated/claude/agents/${rank}.md"
  rg -n '^model_reasoning_effort = "medium"$' "generated/codex/agents/${rank}.toml"
done
```

- Expected: each `rg` command prints exactly one matching line.
- Run: `python3 runtimes/scripts/check-runtime-parity.py`
- Expected: `Consilium repo runtime parity check passed.`

**Stop conditions:** Stop if generation changes a non-derived source file, if repo parity fails, or if a Tier II generated file remains `opus` or `xhigh`.

### Task 4: Defer Installed Runtime Parity Until After Merge
> **Risk:** Installed parity is checkout-bound because `$HOME/.claude/plugins/consilium` points at the active plugin checkout, not this Castra worktree.

**Files:**
- (none)

**Objective:** Keep this march repo-only. Do not mutate user-scope runtime files from Castra.

**Decisions already made:**
- Do not install generated Claude agents to `$HOME/.claude/agents` in this march.
- Do not run `bash codex/scripts/install-codex-agents.sh --prune` in this march.
- Do not run `python3 codex/scripts/sync-codex-config.py` in this march.
- Do not run `python3 runtimes/scripts/check-runtime-parity.py --installed` in this march.
- Do not run `python3 claude/scripts/check-codex-drift.py` in this march.
- After merge into the active plugin checkout, run the installed-parity task there as a separate approved step.

**Acceptance:**
- No file under `$HOME/.claude`, `$HOME/.codex`, or `$HOME/.agents` is intentionally modified by this repo-only march.
- Handoff explicitly says installed parity is deferred until after merge.

**Verification:**
- Run: `git status --short`
- Expected: only repo-local campaign files appear.

**Stop conditions:** Stop if a user-scope install or installed-parity command becomes necessary to prove repo-local correctness.

### Task 5: Final Scope Audit and Handoff
> **Evidence:** Implements the file-scope lock in [spec §6 — Acceptance Criteria](spec.md#6-acceptance-criteria) and the explicit campaign non-goal excluding `checkit-*` tiering.

**Files:**
- (none)
- Read: `source/manifest.json`
- Read: `codex/source/manifest.json`
- Read: `generated/claude/agents/`
- Read: `generated/codex/agents/`
- Read: `codex/agents/`
- Read: `codex/config/codex-config-snippet.toml`
- Read: `generated/codex/config/codex-config-snippet.toml`

**Objective:** Prove the campaign touched only the canonical manifest plus derived runtime artifacts, and prepare the branch for Imperator review.

**Decisions already made:**
- Source edit scope remains `source/manifest.json` only.
- Derived repo outputs may change only under generated runtime paths and Codex compatibility paths.
- No `checkit-*` path may appear in the diff.
- Do not stage unrelated dirty files from other campaigns.

**Acceptance:**
- `source/manifest.json` is the only changed file under `source/`.
- No `checkit` path is changed.
- No untracked file appears except this plan artifact when implementation happens in the same checkout.
- Diff is limited to this plan artifact, the source manifest, and derived generated/compatibility runtime outputs.
- The handoff states that installed parity remains deferred until after merge and that a fresh Codex thread/session is needed after the future runtime install before judging changed Codex agent routing.

**Verification:**
- Run: `git diff --name-only -- source | sort`
- Expected: exactly `source/manifest.json`.
- Run:

```bash
if git diff --name-only | rg '(^|/)checkit'; then
  echo "checkit surface changed; this is out of scope"
  exit 1
fi
```

- Expected: no output and exit zero.
- Run:

```bash
unexpected="$(git diff --name-only | rg -v '^(docs/cases/2026-05-01-consilium-model-tiering/plan\.md|source/manifest\.json|codex/source/manifest\.json|generated/claude/agents/consilium-[^/]+\.md|generated/codex/agents/consilium-[^/]+\.toml|codex/agents/consilium-[^/]+\.toml|generated/codex/config/codex-config-snippet\.toml|codex/config/codex-config-snippet\.toml)$' || true)"
test -z "$unexpected" || { printf '%s\n' "$unexpected"; exit 1; }
```

- Expected: exits zero.
- Run:

```bash
untracked="$(git ls-files --others --exclude-standard | rg -v '^docs/cases/2026-05-01-consilium-model-tiering/plan\.md$' || true)"
test -z "$untracked" || { printf '%s\n' "$untracked"; exit 1; }
```

- Expected: exits zero.
- Run: `git status --short`
- Expected: only this campaign's approved files plus any pre-existing unrelated dirty files that were deliberately left unstaged.

**Stop conditions:** Stop if the diff contains source files outside `source/manifest.json`, any `checkit` path, or generated output that cannot be traced to `python3 runtimes/scripts/generate.py`.

## Approval Gate

Imperator approved repo-only execution in Castra and deferral of installed parity until after merge. Execute this march from `/Users/milovan/projects/Consilium/.worktrees/consilium-model-tiering`. After merge into the active plugin checkout, run the user-scope install and installed-parity proof as a separate approved step.
