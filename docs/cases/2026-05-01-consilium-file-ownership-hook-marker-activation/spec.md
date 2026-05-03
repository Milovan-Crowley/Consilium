# Campaign 3b Spec: File-Ownership Hook + Marker Activation

## Goal

Add a narrow preflight ownership guard that blocks direct file-write tool attempts outside the active task's declared Campaign 3a write set, and activate that guard only while a Consilium task marker is active.

This campaign exists to catch execution drift at the moment it happens: "while I was here, I cleaned up X" should fail before the file changes, not after a verifier notices the blast radius.

This spec is not an implementation plan. It defines the behavior and repo surfaces Campaign 3b owns.

**Confidence: High** - the campaign briefing defines the exact goal and non-goals at `.planning/2026-05-01-consilium-tightening-briefing.md:109-133`.

## Background

Campaign 3b depends on Campaign 3a, `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`. 3a makes the existing Edicts task `**Files:**` block the authoritative contract surface and explicitly leaves runtime hook mechanics to this campaign.

Repo truth matters here:

- Claude hook infrastructure exists under `claude/hooks/`. `claude/hooks/hooks.json:3-14` currently registers only `SessionStart`, and `claude/hooks/run-hook.cmd:1-46` is the existing cross-platform wrapper pattern for extensionless hook scripts.
- `claude/hooks/session-start:1-55` is still inherited session-context behavior, not file-ownership enforcement.
- Codex hooks are enabled on this machine in `~/.codex/config.toml:100-102`, and installed user hooks live in `~/.codex/hooks.json:3-61`. There is no repo-managed `codex/hooks/` tree in this checkout.
- Root `source/` is the canonical prompt source for runtime changes. `codex/README.md:5-11` says to edit root `source/`, not `codex/source`, and not to treat installed `~/.codex/agents` as source.
- Runtime generation and compatibility copies are managed by `runtimes/scripts/generate.py:13-22` and `runtimes/scripts/generate.py:176-190`.
- `runtimes/scripts/check-runtime-parity.py:14-27` knows generated Claude/Codex surfaces and installed agent/config surfaces, but it does not currently track repo-managed hook parity.
- The current Edicts template in `source/skills/claude/edicts/SKILL.md:181-204` shows `Create:`, `Modify:`, and `Test:` only; Campaign 3a has been specced but must land before this hook can rely on `Read:` and `(none)` at runtime.

The briefing mentions `hooks/`, `scripts/`, and `hooks.json` as likely surfaces. Live repo truth narrows that: the existing repo hook surface is `claude/hooks/`; Codex has installed hooks but no repo source tree for them yet.

**Confidence: High** - every surface above was verified against live files before writing this spec.

## Contract Consumed From 3a

Campaign 3b consumes the Campaign 3a contract by reference. It does not redefine or fork it.

The consumed contract is:

- Every Edicts task carries a `**Files:**` block.
- The write set is the union of paths under `Create:`, `Modify:`, and `Test:`.
- `Read:` is optional and read-only. `Read:` is not an allowed-write declaration.
- `(none)` is the explicit empty-write-set marker.
- Write paths are concrete files. A write path is one file. Directory-level write ownership is not recognized unless Campaign 3a is revised first.
- `Read:` entries may use broader path patterns when justified.
- Generator-run tasks may omit generator-derived outputs from `Modify:` when the generator command and known output set are covered by the 3a generator-run convention.

If Campaign 3a changes this contract before implementation, Campaign 3b must halt and be revised. The hook must not introduce raw `writes:` or `reads:` YAML/frontmatter, task owner metadata, dependency graphs, Action Tiers, or any parallel-wave schema.

**Confidence: High** - this mirrors 3a at `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md:70-125` and the sister-campaign interface at `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md:229-249`.

## Proposed Behavior

When no active-task signal exists and no marker state is present, the ownership hook exits successfully and does nothing.

When an active task marker exists, every direct file-write attempt is checked before the write proceeds. The hook resolves the active task from the marker, reads that task's `**Files:**` block from the Edicts artifact, computes the allowed write set from `Create:`, `Modify:`, and `Test:`, and blocks any attempted file outside that set.

The hook enforces direct file-writing tool attempts: `Write`, `Edit`, and any other direct file-write tool names the runtime exposes. It is not a filesystem watcher, not a Bash sandbox, and not a general policy engine. Direct hand edits to generated files still require an explicit `Create:`, `Modify:`, or `Test:` declaration for that file.

Generator-run tasks use the 3a carve-out only for deterministic generator commands declared in the active task body. If the active task invokes one of 3a's canonical generator commands, the hook may allow that command's derived output by consulting the generator's known output set rather than requiring derived files in `Modify:`. This does not authorize direct `Write` or `Edit` calls to generated files. Arbitrary shell commands are not made safe by this hook and do not receive the generator-run carve-out.

The canonical `bash codex/scripts/install-codex.sh` command is the only 3a-recognized generator command with allowed outputs outside the repository root. Its external output set is limited to:

- `$HOME/.codex/agents/consilium-*.toml`;
- `$HOME/.agents/skills/tribune`;
- `$HOME/.codex/config.toml`.

Inside the Consilium repository root, `bash codex/scripts/install-codex.sh` may also produce the same deterministic generator-derived outputs as `python3 runtimes/scripts/generate.py` when it invokes that generator through the Codex install chain. That internal output allowance does not expand the outside-root set above.

Any other outside-root path remains blocked while the marker is active unless a future spec amends 3a's recognized generator command/output contract.

Each declared write entry authorizes only that normalized file path. A `Modify:` line-range suffix, such as `path/to/file.ts:120-145`, is stripped before comparison; the authorized write path is `path/to/file.ts`. Directory entries under `Create:`, `Modify:`, or `Test:` are malformed while 3a remains file-level. Directory detection must not infer from filename shape or missing extension; extensionless files such as `claude/hooks/file-ownership` are valid files. Treat a write entry as a directory only when it has a trailing slash or resolves to an existing directory at parse time. Attempted paths are normalized to the active repository root before comparison. Paths outside the repository root are blocked while the marker is active unless covered by the Codex install output set above or by a future 3a amendment.

Malformed active contracts fail closed. If a marker is active but the hook cannot read the plan, cannot find the task, cannot parse the task's `**Files:**` block, sees an unknown write sub-category, or sees glob syntax under `Create:`, `Modify:`, or `Test:`, the attempted write is blocked with a contract-resolution error.

**Confidence: Medium** - the enforcement target is explicit from the Imperator and 3a; exact runtime hook payload names are implementation territory and may differ between Claude and Codex.

## Marker Lifecycle

Active markers live under the repository or worktree root at:

```text
.consilium/active-tasks/<execution-id>.json
```

`<execution-id>` is the runtime session or invocation identifier used to associate one hook event stream with one active task. The implementation should prefer a stable hook payload session id when the runtime provides one. If a runtime cannot expose a stable id, the orchestrating skill must pass the exact active marker path to the hook through an explicit runtime-supported channel. The hook must never fall back to "the only marker in the directory"; that silently shares state with stale or unrelated work.

The marker is created by the execution surface that starts task work:

- `/legion` creates the marker before dispatching a centurio for a task.
- `/march` creates the marker before executing a task itself.
- If `/phalanx` becomes an execution surface through Campaign 5, it must either reuse the same marker lifecycle or call the same helper. Campaign 3b does not define Phalanx dispatch semantics.

Marker activation is not complete until the execution surface proves that the actual writing context receives either the same execution id or the exact marker path. For `/legion`, this proof must cover the dispatched centurio context, not only the Legatus/orchestrator context. For `/march`, it must cover the self-executing context. For `/phalanx`, if Campaign 5 lands it as an execution surface, it must cover every parallel task context. If this propagation cannot be proven, enforcement for that execution surface is not ready.

The marker is cleared when the active task ends cleanly. If task execution halts, the stale marker remains as a safety brake until the orchestrating skill clears it deliberately or the Imperator approves cleanup.

Minimum marker metadata:

```json
{
  "schema": "consilium.active-task.v1",
  "created_at": "ISO-8601 timestamp",
  "repo_root": "/absolute/path/to/worktree",
  "plan_path": "/absolute/path/to/plan.md or repo-relative/path/to/plan.md",
  "task_heading": "### Task N: Task Title",
  "execution_surface": "legion|march|phalanx",
  "execution_id": "runtime-session-or-invocation-id",
  "runtime": "claude|codex",
  "runtime_session_id": "runtime-session-id-when-available",
  "owner_pid": "process-id-when-available"
}
```

The marker does not own the write set. It points to the Edicts artifact and active task. `plan_path` is absolute when the Edicts artifact lives outside the guarded repository or worktree; relative `plan_path` values are resolved relative to `repo_root` only when the plan artifact lives inside that repo. The `**Files:**` block remains authoritative so the hook cannot drift from the plan by caching stale allowed paths. Stale-marker cleanup is allowed only when the orchestrating skill can prove the recorded runtime/session/process is no longer active, or when the Imperator explicitly approves clearing that exact marker.

Marker files are protected runtime state. While a marker is active, task-context direct write tools may not create, modify, or delete files under `.consilium/active-tasks/`, even if a task tries to declare those files. Only the execution surface's marker lifecycle helper may mutate active-task marker files.

An active-task signal is any runtime-provided execution id, explicit marker path, or execution-surface assertion that the current write belongs to a Consilium task. If such a signal is present, missing, unreadable, or non-unique marker resolution blocks. It never degrades to no enforcement.

**Confidence: Medium** - the marker location follows the campaign briefing's `.consilium` direction and the Nelson marker precedent, but the exact runtime session-id availability must be confirmed during implementation.

## Hook Behavior

The hook resolves ownership in this order:

1. Read the hook payload and determine every attempted affected path from the runtime's direct write-tool input.
2. Resolve and canonicalize the repository or worktree root from the hook payload `cwd` or the current working directory. The canonical root is the git top-level, not an arbitrary subdirectory.
3. Determine whether an active-task signal is present: runtime execution id, explicit marker path, or execution-surface assertion.
4. If no active-task signal exists and `.consilium/active-tasks/` contains no marker files, exit successfully.
5. If no active-task signal exists but `.consilium/active-tasks/` contains marker files, block with an unresolved-marker error instead of guessing.
6. If an active-task signal exists, select exactly one readable marker for that signal under `.consilium/active-tasks/`.
7. If the signal cannot resolve to exactly one readable marker, block with an unresolved-marker error. Missing marker, unreadable marker, and non-unique marker resolution are blocking failures.
8. Read marker metadata and resolve `plan_path`. Absolute plan paths are used as-is; relative plan paths resolve relative to `repo_root`.
9. Locate `task_heading` in the Edicts artifact.
10. Parse that task's `**Files:**` block according to Campaign 3a.
11. Build the allowed write set from `Create:`, `Modify:`, and `Test:`.
12. Normalize every attempted affected path relative to `repo_root`.
13. Allow the write only if every affected path matches a declared file after 3a normalization, including stripping any permitted `Modify:` line-range suffix. Multi-path operations are all-or-nothing: moves, renames, deletes, and patch-style writes are blocked if any affected path is undeclared.

Hook registration belongs to the existing hook systems. Implementation must inventory the direct file-write and mutation-capable tool names exposed by each runtime before choosing matchers; a runtime is covered only when every direct file-write or mutation-capable tool it exposes is registered or explicitly proven absent.

- Claude: add a PreToolUse registration for direct write tools through `claude/hooks/hooks.json` and `claude/hooks/hooks-cursor.json`, reusing `claude/hooks/run-hook.cmd`.
- Codex: do not hand-edit `~/.codex/hooks.json` as the durable source. Because no repo-managed `codex/hooks/` source tree exists today, implementation must either add a repo-managed Codex hook source plus installer/sync support or explicitly declare Codex enforcement out of scope for the first pass. Silent machine-local hook edits are not acceptable as the finished campaign.

The hook must use only local files and standard runtime dependencies unless the implementation plan proves an existing repo dependency is already required. No network calls, MCP lookups, or LLM calls belong in the hook.

**Confidence: Medium** - Claude hook registration is live repo truth; Codex registration exists only as installed machine state, so durable Codex hook source remains a design gap for implementation to close.

## Error/Failure Behavior

A blocked write fails before the attempted write is applied.

The failure message must name:

- the active marker file;
- the active task heading;
- the attempted file path or paths;
- the allowed write set after line-range normalization;
- the source Edicts artifact path;
- the corrective action.

Required message shape:

```text
Consilium file ownership guard blocked this write.
Marker: .consilium/active-tasks/<execution-id>.json
Task: ### Task N: Task Title
Attempted:
- path/to/file
Allowed writes:
- path/declared/by/create-or-modify-or-test
Plan: docs/cases/YYYY-MM-DD-slug/plan.md

This file is outside the active task's declared Files-block write set.
Stop and ask to amend the task Files block, switch tasks, or leave this cleanup out of scope.
```

Runtime-specific rejection mechanics may differ:

- Claude hook rejection may use exit code 2 and stderr feedback, matching the hook precedent from the Nelson runtime fork.
- Codex hook rejection may need to emit the runtime's `permissionDecision: deny` JSON shape, matching the installed Codex hook style in `~/.codex/hooks/*.sh`.

Those runtime mechanics are implementation details. The observable contract is the same: the write is blocked and the agent sees the marker, task, attempted file, allowed set, and corrective action.

Malformed marker or malformed 3a contract errors use the same blocking behavior, but the message says the hook could not resolve the active task ownership contract and names the missing or malformed field.

**Confidence: High** - the campaign briefing requires a clear block message naming task marker, attempted file, and allowed write set; exit-code mechanics are runtime-specific.

## Escape Hatches

There is no broad bypass flag, no `ALLOW_ALL`, no per-task override field, and no silent environment-variable escape.

The allowed escapes are narrow:

- No active marker means no enforcement. This is activation behavior, not a bypass.
- The orchestrating skill may create, update, or clear files under `.consilium/active-tasks/` as part of marker lifecycle.
- If the task genuinely needs another file, the correct escape is to amend the Edicts task `**Files:**` block and restart or refresh the marker.
- If a stale marker blocks unrelated work, the orchestrating skill may clear that exact stale marker after proving the recorded runtime/session/process is no longer active, or after the Imperator explicitly approves that cleanup.
- The task being guarded may not edit `.consilium/active-tasks/` as an escape hatch. Marker lifecycle writes are reserved to the execution surface's helper outside the task write context.

The hook must not tell a centurio to edit outside the declared set and justify it later. The failure path is to stop, amend, or leave the edit out of scope.

**Confidence: High** - this follows existing Consilium discipline: surface ambiguity, amend the plan, and keep cleanup out of scope unless approved.

## Files Likely Touched

Likely implementation surfaces, grounded in live repo truth:

- `claude/hooks/file-ownership` or similarly named extensionless hook script - new narrow hook body.
- `claude/hooks/hooks.json` - PreToolUse registration for Claude direct write tools.
- `claude/hooks/hooks-cursor.json` - Cursor variant if this plugin surface is still supported.
- `claude/hooks/run-hook.cmd` - likely reused, not necessarily changed.
- `source/skills/claude/legion/SKILL.md` - marker creation and cleanup around centurio task execution.
- `source/skills/claude/march/SKILL.md` - marker creation and cleanup around self-executed tasks.
- `source/skills/claude/phalanx/SKILL.md` - required only if Campaign 5 lands `/phalanx` as an execution surface that starts task work; 3b must not widen Campaign 5's scope, but `/phalanx` must not bypass 3b once it exists.
- `runtimes/scripts/generate.py` - only if hook files or Codex hook source need generation or compatibility-copy support.
- `runtimes/scripts/check-runtime-parity.py` - only if hook parity becomes part of the repo/install proof chain.
- `codex/scripts/install-codex.sh` and related Codex install/sync scripts - only if Campaign 3b adds repo-managed Codex hook installation.
- `.gitignore` - marker state under `.consilium/active-tasks/` must not become tracked or appear as accidental runtime clutter.

Surfaces that do not currently exist and must not be claimed as live:

- No root `hooks/` directory exists in this checkout.
- No repo-managed `codex/hooks/` directory exists in this checkout.
- No `/Users/milovan/projects/Consilium/AGENTS.md` file exists in this checkout; the AGENTS rules for this session came from the prompt context.

**Confidence: High** - paths were verified with live file discovery and line reads.

## Acceptance Criteria

1. The hook allows direct write-tool calls only when no active-task signal exists and `.consilium/active-tasks/` contains no marker files.
2. `/legion` and `/march` create an active marker before task execution and clear it on clean task completion.
3. The marker contains the minimum metadata defined in this spec and does not cache the write set as authority.
4. With an active marker, a direct write inside the active task's `Create:`, `Modify:`, or `Test:` set is allowed.
5. With an active marker, a direct write outside that set is blocked before modification.
6. A task with `**Files:** - (none)` has an empty write set; any direct file-write attempt is blocked unless it is marker lifecycle cleanup.
7. `Read:` entries do not authorize writes.
8. Glob or wildcard syntax under `Create:`, `Modify:`, or `Test:` causes a blocking malformed-contract error while the marker is active.
9. `Modify:` line-range suffixes are stripped before comparison, so `path/to/file.ts:120-145` authorizes writes to `path/to/file.ts`.
10. The block message names the marker, task heading, attempted file, allowed write set, and plan path.
11. Directory write declarations are treated as malformed unless Campaign 3a is revised first.
12. Unresolved marker selection blocks instead of guessing, including missing, unreadable, or non-unique marker resolution when an active-task signal is present.
13. Direct hand edits to generated files require explicit `Create:`, `Modify:`, or `Test:` declarations.
14. Directory detection treats trailing-slash entries and existing directories as directories; it does not reject extensionless files just because they lack a suffix.
15. Declared 3a generator commands can use the 3a generator-run carve-out for deterministic generated outputs, but arbitrary shell commands and direct `Write`/`Edit` calls cannot use that carve-out.
16. The Codex install generator carve-out allows only `$HOME/.codex/agents/consilium-*.toml`, `$HOME/.agents/skills/tribune`, and `$HOME/.codex/config.toml` outside the repository root.
17. Multi-path operations are denied unless every affected path is declared in the active task write set.
18. Marker path or execution-id propagation is proven for `/legion`, `/march`, and `/phalanx` if `/phalanx` lands as an execution surface; a marker created only in the orchestrator context is not enough.
19. Task-context direct write tools cannot create, modify, or delete `.consilium/active-tasks/` marker files.
20. Marker state under `.consilium/active-tasks/` is ignored by git and cannot contaminate commits.
21. If Campaign 5 lands `/phalanx` as an execution surface, `/phalanx` uses the same marker lifecycle before it dispatches task work.
22. Each covered runtime inventories its direct file-write tools and registers every one for ownership enforcement, or documents that no additional direct file-write tools exist.
23. Runtime generation/parity checks cover any new generated or installed hook surfaces introduced by the implementation.
24. Campaign 5 can still consume Campaign 3a's same write set for disjoint-set detection; 3b introduces no alternate schema or parallel metadata.

**Confidence: High** - these criteria are direct behavioral consequences of the requested scope and 3a contract.

## Risks

- **3a timing risk:** Campaign 3a is specced, but live Edicts source has not yet adopted the full contract. 3b implementation must wait for 3a or include an explicit blocked-until-3a task order.
- **Codex durability risk:** Codex hooks are live only in `~/.codex` on this machine today. A finished campaign that edits only installed hooks would be non-portable and would drift from repo truth.
- **Marker ambiguity risk:** Parallel work can create multiple active tasks in one checkout. The marker design must use execution ids or fail closed when ambiguous.
- **Shell mutation risk:** Direct write tools are enforceable. Arbitrary shell commands that mutate files are not fully covered by this campaign and must not be described as protected by the ownership hook. The first pass must not pretend to be a filesystem sandbox.
- **Generated-output risk:** Generator-run tasks intentionally omit derived outputs from task `Modify:` entries. 3b must lean on 3a's generator-run convention and parity proof rather than inventing a second generated-file schema.
- **Stale marker risk:** A crashed task may leave a marker that blocks future writes. The cleanup path must be explicit and narrow.

**Confidence: High** - each risk follows from current repo shape or explicit concurrent-campaign dependencies.

## Coordination Notes With Campaigns 3a And 5

Campaign 3a must land before Campaign 3b enforcement becomes active. 3b consumes the `**Files:**` contract exactly as 3a defines it. If 3a changes the write-set definition, empty marker convention, glob rule, or generator-run convention, this spec must be updated before implementation.

Campaign 5 consumes the same 3a write set for Phalanx disjoint-set detection. 3b must not add a separate schema, task metadata, ownership field, or wave marker that Campaign 5 would need to reconcile. The shared contract is only the Edicts `**Files:**` block.

Campaign 3b owns runtime enforcement and marker activation. Campaign 5 owns surfacing parallel-wave opportunities and disjoint-set analysis. If Campaign 5 makes `/phalanx` an execution surface, it should call the marker lifecycle defined by 3b rather than redefining active-task state.

Campaign 4's Contract Inventory and Tabularius may later require specs to enumerate contract surfaces. This spec's contract surfaces are the active marker metadata shape, the hook allow/block behavior, and the consumed 3a `**Files:**` contract. Campaign 3b should not wait on Campaign 4 unless the implementation branch includes Tabularius in the workflow.

**Confidence: High** - 3a and Campaign 5 both explicitly reference the same `**Files:**` write-set contract; Campaign 4 is present as a concurrent spec but not required to write this artifact.
