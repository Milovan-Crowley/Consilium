# File Ownership Hook + Marker Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:march (recommended) or consilium:legion to implement this plan task-by-task.

**Goal:** Build the narrow Campaign 3b ownership guard that enforces active-task file ownership from the Campaign 3a `**Files:**` contract.

**Plan Scale:** Campaign

**Implementation Shape:** Implement one shared ownership engine, register it in the existing Claude hook surface, add durable Codex hook source with a separate bootstrap installer, then teach execution surfaces to activate and clear task markers. The first task is a hard runtime-signal gate: marker enforcement may proceed only after the implementation proves the actual writing context exposes a stable execution id or explicit marker path. This does not build a filesystem sandbox, does not redesign Edicts, and does not add a second writes schema.

**Scope In:**
- Runtime preflight ownership checks for direct file-write tools while an active task marker is present.
- Marker creation and cleanup for `/legion` and `/march`.
- Repo-managed Codex hook source, separate hook install sync, and installed-runtime parity checks.
- Tests for 3a Files-block parsing, marker resolution, allowed writes, blocked writes, malformed contracts, and protected marker paths.

**Scope Out:**
- Any raw `writes:` or `reads:` schema outside the Edicts `**Files:**` block.
- Broad Bash write enforcement or filesystem watching.
- Campaign 5 parallel-wave semantics or phalanx disjoint-set detection.
- Hand-editing generated runtime copies instead of using `python3 runtimes/scripts/generate.py`.

**Verification:** `python3 runtimes/hooks/tests/test_file_ownership.py`; `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-claude-wrapper`; `python3 codex/scripts/tests/test-sync-codex-hooks.py`; `python3 -m py_compile runtimes/hooks/file_ownership.py codex/scripts/sync-codex-hooks.py`; `for script in claude/hooks/file-ownership codex/hooks/consilium-file-ownership codex/scripts/install-codex-hooks.sh codex/scripts/install-codex.sh; do bash -n "$script" || exit 1; done`; `python3 runtimes/scripts/generate.py`; `python3 runtimes/scripts/check-runtime-parity.py`; `bash codex/scripts/install-codex.sh`; `repo_root="$(git rev-parse --show-toplevel)" && if [ -n "${CONSILIUM_ACTIVE_TASK_MARKER:-}" ]; then python3 /Users/milovan/projects/Consilium/runtimes/hooks/file_ownership.py clear --repo-root "$repo_root" --marker-path "$CONSILIUM_ACTIVE_TASK_MARKER"; elif [ -d "$repo_root/.consilium/active-tasks" ] && fd -H -t f . "$repo_root/.consilium/active-tasks" | rg .; then exit 1; fi`; `bash codex/scripts/install-codex-hooks.sh`; `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-codex-wrapper`; `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-subdir-check-clear`; `python3 runtimes/scripts/check-runtime-parity.py --installed`; `python3 claude/scripts/check-codex-drift.py`; `python3 claude/scripts/check-tribune-staleness.py`.

---

## Preconditions

Campaign 3a must already be present in the active implementation checkout before Task 2 begins. Current repo reconnaissance found the 3a contract in `source/protocols/plan-format.md`, `source/skills/claude/edicts/SKILL.md`, `source/skills/claude/references/verification/templates/plan-verification.md`, and `source/roles/praetor.md`; if that is no longer true in the implementation worktree, stop and land Campaign 3a first.

Do not hand-edit generated compatibility copies under `generated/`, `claude/skills/`, or `codex/source/`. Source skill edits go under `source/skills/claude/`; generated/runtime copies are updated by `python3 runtimes/scripts/generate.py`.

### Task 1: Runtime Signal And Tool Inventory

**Files:**
- Create: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Read: `claude/hooks/hooks.json`
- Read: `claude/hooks/hooks-cursor.json`
- Read: `claude/hooks/run-hook.cmd`
- Read: `claude/docs/windows/polyglot-hooks.md`
- Read: `codex/README.md`
- Read: `runtimes/scripts/generate.py`
- Read: `source/manifest.json`
- Read: `$HOME/.codex/hooks.json`
- Read: `$HOME/.codex/hooks/*.sh`

**Objective:** Prove the active-task signal and direct-write tool inventory before any hook logic or registration is written.

**Decisions already made:**
- The marker must not be selected by "the only marker in the directory." A covered runtime must provide either a stable execution/session id visible to the hook and the execution surface, or an explicit marker path channel visible to the hook.
- Codex currently exposes `CODEX_THREAD_ID` in this local execution environment; treat that as a candidate signal, not proof for every runtime.
- Claude and Cursor payload fields are not guessed. Verify them from local docs, a non-mutating hook probe, or existing runtime documentation before declaring the Claude/Cursor side ready.
- Direct file-write and mutation-capable tool names are inventoried per runtime before registration. Do not assume Codex and Claude use the same names.
- The inventory must inspect generated-agent tool-profile source, including `CLAUDE_TOOL_PROFILES` in `runtimes/scripts/generate.py`, so mutation-capable MCP tools are not missed. Known write-profile examples include `Write`, `Edit`, `mcp__serena__replace_symbol_body`, `mcp__serena__insert_after_symbol`, `mcp__serena__insert_before_symbol`, `mcp__serena__rename_symbol`, and `mcp__serena__safe_delete_symbol`.
- If a runtime exposes a mutation-capable tool that the hook system cannot intercept, that runtime is `Status: HALT` until the Imperator explicitly narrows coverage or the implementation adds an interceptable registration path.
- The inventory file is the handoff contract for Tasks 2 through 5. It must name the chosen execution signal, direct-write matchers, generator-command handling, and any runtime excluded from first-pass enforcement.
- Each runtime section uses this exact field shape: `Runtime:`, `Status: READY|HALT`, `Execution signal:`, `Propagation proof: PASS|FAIL`, `Direct write tools:`, `Generator commands:`, and `Decision:`.
- Task 1 is a manual gate. The Legatus must read the completed inventory before starting Task 2 and may mark Task 1 complete only when every runtime left in scope is `Status: READY` with `Propagation proof: PASS`.

**Acceptance:**
- `hook-runtime-inventory.md` names each covered runtime as `READY` or `HALT`.
- For every `READY` runtime, the file names the exact hook payload field or explicit channel used to resolve one marker.
- For every `READY` runtime, `Propagation proof: PASS` is backed by a short proof note or command output showing the actual writing context receives the same execution id or exact marker path.
- For every `READY` runtime, the file lists the direct file-write and mutation-capable tool matchers the hook registration will cover.
- For every mutation-capable tool exposed by a `READY` runtime, the inventory either maps it to an enforcement matcher or states why it is provably not available in that runtime.
- If any runtime cannot prove marker propagation into the actual writing context, the inventory marks that runtime `HALT` and implementation stops before Task 2 unless the Imperator narrows scope.
- The inventory confirms that arbitrary Bash mutation remains out of scope; only exact recognized 3a generator commands may receive generator-command handling.

**Verification:**
- Run: `test -s docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md && rg -n "Runtime:|Status:|Execution signal:|Propagation proof:|Direct write tools:|Generator commands:|Decision:" docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Expected: The command prints entries for every runtime considered, and no `READY` entry lacks an execution signal, `Propagation proof: PASS`, or direct-write/mutation-capable tool list.
- Run: `if rg -n "Status: HALT|Propagation proof: FAIL" docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md; then exit 1; fi`
- Expected: Command exits 0 for runtimes remaining in scope. If output appears, stop before Task 2 unless the Imperator explicitly narrows the covered runtime list in the inventory.

**Stop conditions:** Stop if no covered runtime can prove marker propagation into the writing context, or if the only available marker strategy is directory singleton selection.

### Task 2: Shared Ownership Engine

**Files:**
- Create: `runtimes/hooks/file_ownership.py`
- Test: `runtimes/hooks/tests/test_file_ownership.py`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/spec.md`
- Read: `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`
- Read: `source/protocols/plan-format.md`

**Objective:** Add the canonical local engine that resolves active markers, parses the 3a Files block, checks attempted writes, and provides marker lifecycle commands.

**Decisions already made:**
- `runtimes/hooks/file_ownership.py` is the shared implementation for Claude and Codex wrappers. Runtime wrappers stay thin and call this engine.
- The CLI exposes at least `check`, `activate`, and `clear` commands. `check` reads one hook payload from stdin and emits the runtime-specific allow or deny result. `activate` creates `.consilium/active-tasks/<execution-id>.json`. `clear` removes exactly the marker for the active task or exact marker path.
- The marker schema is `consilium.active-task.v1` and contains the minimum metadata from the spec: `schema`, `created_at`, `repo_root`, `plan_path`, `task_heading`, `execution_surface`, `execution_id`, `runtime`, `runtime_session_id`, and `owner_pid`.
- `activate` canonicalizes `repo_root` through `git -C <candidate> rev-parse --show-toplevel` before writing marker metadata. If the candidate path is not inside a git worktree, activation blocks with a clear error rather than recording a subdirectory as `repo_root`.
- `check` also canonicalizes the guarded repo root before marker lookup, using hook payload `cwd` when available and current working directory otherwise. It resolves that candidate through `git -C <candidate> rev-parse --show-toplevel`; marker lookup, active-marker ambiguity checks, attempted-path normalization, and git-exclude checks all use the canonical top-level root.
- `clear` canonicalizes `--repo-root` the same way before deleting an exact marker path. It never clears by directory singleton.
- `plan_path` in the marker is absolute when the Edicts artifact lives outside the guarded repo root. The hook resolves absolute `plan_path` values as-is; it resolves relative `plan_path` values relative to `repo_root` only when the plan artifact is inside the guarded repo. This preserves the spec's relative-path shape for Consilium-local work and prevents product-repo tasks from looking for Consilium docs under the product repo.
- The task parser accepts the Edicts task heading grammar `### Task N: ...`. To remain compatible with existing case plans, it may also accept `## Task N: ...`, but it must normalize the stored `task_heading` to the exact heading text found in the plan.
- The marker never caches the allowed write set. The plan's task `**Files:**` block remains the authority on every check.
- The write set is exactly `Create:` + `Modify:` + `Test:` from the active task. `Read:` never authorizes writes.
- `(none)` means empty write set. Reads-only tasks must still carry `(none)`.
- Write entries are concrete files only. Directory declarations are malformed when they have a trailing slash or resolve to an existing directory at parse time. Missing extensions are not evidence of a directory.
- `Modify:` line-range suffixes are stripped for comparison.
- Globs or wildcards under `Create:`, `Modify:`, or `Test:` fail closed. Next.js bracket route segments are literal path segments, per 3a.
- Missing marker, unreadable marker, non-unique marker resolution, missing task heading, missing Files block, unknown sub-category, and malformed write path all block while an active-task signal is present.
- No active-task signal and no marker files means allow. No active-task signal with marker files means block unresolved-marker.
- Direct writes to `.consilium/active-tasks/` are blocked by `check`, even if a task declares them. Only the `activate` and `clear` lifecycle commands may mutate marker files.
- Multi-path tool operations are all-or-nothing: moves, renames, deletes, and patch-style payloads are denied if any affected path is undeclared.
- Generator-command handling is narrow: exact `python3 runtimes/scripts/generate.py` and `bash codex/scripts/install-codex.sh` commands may be recognized only when declared in the active task body. Unknown shell commands are not blocked by this engine and are not described as protected.
- The recognized generator-output whitelist is explicit in the engine. `python3 runtimes/scripts/generate.py` may allow only its deterministic repo-root outputs under `generated/`, `claude/skills/`, `codex/source/`, `codex/agents/`, and `codex/config/codex-config-snippet.toml`. `bash codex/scripts/install-codex.sh` may allow the same internal repo-root generator outputs because the live script invokes `codex/scripts/generate_agents.py`, plus the 3b spec's external output set: `$HOME/.codex/agents/consilium-*.toml`, `$HOME/.agents/skills/tribune`, and `$HOME/.codex/config.toml`.
- Codex hook installation is not part of the `bash codex/scripts/install-codex.sh` generator carve-out. Hook installation writes `$HOME/.codex/hooks/*` and `$HOME/.codex/hooks.json`; it must run only outside active marker enforcement as a bootstrap install step after the exact active marker is cleared.
- Marker activation ensures `.consilium/active-tasks/` is ignored in the guarded git repository by updating the target repo's local git exclude, resolved with `git -C <repo_root> rev-parse --git-path info/exclude`. Do not rely only on the Consilium checkout's root `.gitignore`.

**Acceptance:**
- The engine can parse the current Edicts task shape from a markdown plan and compute the allowed write set for one task heading.
- The engine allows an attempted direct write to a declared `Create:`, `Modify:`, or `Test:` path.
- The engine blocks an attempted direct write outside the declared write set before modification.
- The engine blocks writes for `(none)` tasks.
- The engine blocks `Read:`-only authorization attempts.
- The engine blocks malformed active contracts with a message naming the marker, task, attempted path, plan path, and contract problem.
- The engine's deny message also names the allowed write set after normalization and gives the corrective action: amend the task Files block, switch tasks, or leave the cleanup out of scope.
- The engine accepts extensionless file paths such as `claude/hooks/file-ownership`.
- The engine blocks direct write attempts to `.consilium/active-tasks/`.
- The engine records the git-exclude ignore rule for `.consilium/active-tasks/` in the guarded repo during marker activation.
- The test file covers allowed write, blocked write, deny output allowed-set/corrective-action content, `(none)`, `Read:` not write, line-range normalization, directory declaration rejection, extensionless file acceptance, unresolved marker failures, malformed Files block, multi-path denial, protected marker path denial, generator-output whitelist allowance/denial, guarded-repo git-exclude creation, activation/check/clear from a repo subdirectory, absolute plan paths outside the guarded repo, and `### Task N` plus `## Task N` heading parsing.

**Verification:**
- Run: `python3 -m py_compile runtimes/hooks/file_ownership.py && python3 runtimes/hooks/tests/test_file_ownership.py`
- Expected: Python compilation succeeds and the test script exits 0 with all cases passing.

**Stop conditions:** Stop if the 3a source contract in the active checkout differs from the 3a spec in a way that changes Files-block parsing or generator-run behavior.

### Task 3: Claude Hook Registration

**Files:**
- Create: `claude/hooks/file-ownership`
- Modify: `claude/hooks/hooks.json`
- Modify: `claude/hooks/hooks-cursor.json`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Read: `claude/hooks/run-hook.cmd`
- Read: `runtimes/hooks/file_ownership.py`

**Objective:** Register the ownership guard in the repo-managed Claude hook surface without changing existing SessionStart behavior.

**Decisions already made:**
- `claude/hooks/file-ownership` is an extensionless shell wrapper, matching the existing hook pattern. It locates the repo root from `claude/hooks/` and calls `python3 runtimes/hooks/file_ownership.py check --runtime claude`.
- `claude/hooks/run-hook.cmd` is reused. Do not replace it unless Task 3 proves it cannot invoke the new hook.
- `claude/hooks/hooks.json` keeps the existing `SessionStart` registration and adds `PreToolUse` entries only for the Claude direct-write tools inventoried in Task 1.
- `claude/hooks/hooks-cursor.json` is updated only to the extent Task 1 proves Cursor supports an equivalent pre-tool hook registration. If Task 1 cannot prove that, Task 3 must stop instead of guessing Cursor schema.
- Generator-command handling, if Task 1 proves the relevant shell matcher exists, is limited to exact recognized 3a generator commands. Do not attach broad Bash ownership enforcement.
- The wrapper emits no user-facing output on allow. Deny output is produced by the shared engine.

**Acceptance:**
- Existing `SessionStart` hook behavior remains registered.
- Claude direct-write tool attempts invoke `claude/hooks/file-ownership`.
- Claude mutation-capable MCP tool attempts inventoried in Task 1 also invoke `claude/hooks/file-ownership`, or Task 3 stops because the runtime cannot intercept them.
- The wrapper works from a worktree checkout and from the Claude plugin symlink path.
- With an active test marker, the wrapper denies an attempted write outside the active task's write set and emits the required ownership message before the write.
- Cursor registration is either verified and updated, or Task 3 stops with the exact missing schema evidence.
- No root `hooks/` directory is introduced.

**Verification:**
- Run: `bash -n claude/hooks/file-ownership && jq . claude/hooks/hooks.json >/dev/null && jq . claude/hooks/hooks-cursor.json >/dev/null`
- Expected: Shell syntax and both JSON files validate.
- Run: `printf '{"tool_name":"Write","tool_input":{"file_path":"noop.txt"}}\n' | CLAUDE_PLUGIN_ROOT="/Users/milovan/projects/Consilium/claude" bash claude/hooks/file-ownership`
- Expected: No active marker exists, so the wrapper exits 0 without user-facing output.
- Run: `printf '{"tool_name":"Write","tool_input":{"file_path":"noop.txt"}}\n' | CLAUDE_PLUGIN_ROOT="$HOME/.claude/plugins/consilium" "$HOME/.claude/plugins/consilium/hooks/run-hook.cmd" file-ownership`
- Expected: When the Consilium Claude plugin symlink exists, the symlink path also exits 0 without user-facing output.
- Run: `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-claude-wrapper`
- Expected: The smoke creates a temporary git repo plus an absolute plan path outside that repo, activates a test marker, sends an undeclared write payload through `claude/hooks/file-ownership`, and observes a denial containing the marker, attempted path, allowed writes, plan path, and corrective action.

**Stop conditions:** Stop if the direct-write matcher names from Task 1 cannot be represented in Claude hook registration without broadening to unrelated tools.

### Task 4: Codex Hook Source, Install, And Parity

**Files:**
- Create: `codex/hooks/consilium-file-ownership`
- Create: `codex/scripts/install-codex-hooks.sh`
- Create: `codex/scripts/sync-codex-hooks.py`
- Test: `codex/scripts/tests/test-sync-codex-hooks.py`
- Modify: `codex/README.md`
- Modify: `runtimes/scripts/check-runtime-parity.py`
- Read: `codex/scripts/install-codex.sh`
- Read: `codex/scripts/generate_agents.py`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Read: `$HOME/.codex/hooks.json`
- Read: `runtimes/hooks/file_ownership.py`

**Objective:** Make Codex ownership enforcement durable from repo source instead of machine-local hand edits.

**Decisions already made:**
- Do not hand-edit `$HOME/.codex/hooks.json` as source. The source of Codex hook registration is `codex/scripts/sync-codex-hooks.py` plus repo-managed hook files.
- `codex/hooks/consilium-file-ownership` is the installed wrapper source. It invokes an adjacent installed `consilium-file-ownership.py`.
- `codex/scripts/install-codex-hooks.sh` copies `codex/hooks/consilium-file-ownership` to `$HOME/.codex/hooks/consilium-file-ownership`, copies `runtimes/hooks/file_ownership.py` to `$HOME/.codex/hooks/consilium-file-ownership.py`, sets executable mode on the wrapper, then runs the hook-registration sync.
- `codex/scripts/sync-codex-hooks.py` reads and rewrites `$HOME/.codex/hooks.json` idempotently. It preserves existing hooks, including `bash-discipline.sh`, `medusa-backend-guard.sh`, `stop-phrase-guard.sh`, and notification hooks.
- `codex/scripts/sync-codex-hooks.py` supports testable input and output paths so `codex/scripts/tests/test-sync-codex-hooks.py` can run against temporary hook config without touching `$HOME/.codex`.
- Codex PreToolUse registrations cover only the direct-write tools inventoried in Task 1 and the exact generator-command matcher if Task 1 proves the runtime exposes one.
- Codex mutation-capable tools inventoried in Task 1 are either registered for enforcement or make Codex `Status: HALT` in the inventory.
- `codex/scripts/install-codex.sh` remains the canonical 3a-recognized Codex install generator and is not modified to install hooks. Adding hook writes to that command would expand the spec's external output set and violate the 3b contract.
- Codex hook installation is a separate bootstrap command: `bash codex/scripts/install-codex-hooks.sh`. It must run only when no active marker is enforcing ownership.
- `runtimes/scripts/check-runtime-parity.py --installed` checks that the installed Codex wrapper, installed Python hook copy, and `$HOME/.codex/hooks.json` registration match repo expectations.
- `codex/README.md` documents the separate hook install step and states that the normal `bash codex/scripts/install-codex.sh` output set remains agents, Tribune skill, and config.

**Acceptance:**
- Codex hook source exists in the repo.
- Running the separate Codex hook install path installs the ownership hook without deleting existing local hooks.
- Running the hook sync twice is idempotent and does not duplicate ownership hook entries.
- The sync test proves existing Bash, Stop, SessionStart, UserPromptSubmit, and notification hook blocks survive unchanged.
- `check-runtime-parity.py --installed` reports missing or drifted installed Codex hook files and missing registration.
- The installed Codex hook registration uses the matchers from Task 1, not guessed Claude matcher names.
- The sync test proves a Codex active-marker deny payload shape can be produced by the wrapper without touching real installed hook state.
- `bash codex/scripts/install-codex.sh` is not modified by this task and its external output set is not widened.
- No repo-managed `codex/hooks/` claim remains false after this task; the directory now exists because this task creates it.

**Verification:**
- Run: `for script in codex/hooks/consilium-file-ownership codex/scripts/install-codex-hooks.sh codex/scripts/install-codex.sh; do bash -n "$script" || exit 1; done && python3 -m py_compile codex/scripts/sync-codex-hooks.py runtimes/hooks/file_ownership.py && python3 codex/scripts/tests/test-sync-codex-hooks.py`
- Expected: Shell syntax and Python compilation succeed.

**Stop conditions:** Stop if Codex hook registration cannot preserve existing user hooks idempotently.

### Task 5: Marker Lifecycle In Execution Surfaces

**Files:**
- Modify: `source/skills/claude/legion/SKILL.md`
- Modify: `source/skills/claude/legion/implementer-prompt.md`
- Modify: `source/skills/claude/march/SKILL.md`
- Modify: `source/roles/legatus.md`
- Modify: `source/protocols/legatus-routing.md`
- Read: `source/manifest.json`
- Read: `source/skills/claude/phalanx/SKILL.md`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md`
- Read: `runtimes/hooks/file_ownership.py`

**Objective:** Activate and clear markers around task execution for the execution surfaces Campaign 3b owns now.

**Decisions already made:**
- Marker state lives at `.consilium/active-tasks/<execution-id>.json`.
- `/march` activates a marker before each task and clears that exact marker only after the task's verification passes.
- `/legion` must ensure the dispatched centurio's actual writing context activates the marker before the first write. The dispatch prompt must include the marker lifecycle command and must treat inability to activate the marker as `BLOCKED`.
- Codex Legatus execution uses `source/roles/legatus.md` plus `source/protocols/legatus-routing.md`, not the Claude-only `legion`/`march` skill bodies. Those Codex Legatus surfaces must receive the same marker activation/clear discipline before dispatching a Centurion or executing a task.
- The lifecycle command uses the installed or absolute Consilium runtime helper, not a path relative to the guarded repository. On this machine the source-helper form is `repo_root="$(git rev-parse --show-toplevel)" && python3 /Users/milovan/projects/Consilium/runtimes/hooks/file_ownership.py activate --repo-root "$repo_root" --plan-path "$CONSILIUM_PLAN_PATH" ...`; clearing uses the same absolute helper with `clear --repo-root "$repo_root" --marker-path "$CONSILIUM_ACTIVE_TASK_MARKER"`. If Task 1 chooses a runtime-installed helper path instead, use that explicit path and still pass a proved top-level `--repo-root`.
- The execution surface records the exact marker path returned by activation and makes it available as `CONSILIUM_ACTIVE_TASK_MARKER` or the equivalent explicit marker path channel chosen in Task 1. Clearing uses that exact path; it never infers from directory contents.
- The execution surface passes the Edicts artifact path as an absolute `--plan-path` whenever the plan lives outside the guarded repository root. It does not assume `docs/cases/.../plan.md` exists inside product repos.
- Clean completion clears the marker. Halted or failed task execution leaves the marker as a safety brake until the execution surface clears it deliberately after proof that the recorded runtime/session/process is inactive, or after explicit Imperator approval.
- Task-context direct write tools may not edit marker files. Marker lifecycle writes happen through the lifecycle helper command, not through `Write` or `Edit`.
- Do not modify `source/skills/claude/phalanx/SKILL.md` in this task unless Campaign 5 source changes have already made `/phalanx` a Consilium implementation execution surface in the active branch. If that has happened, stop and amend this plan so phalanx marker propagation is explicit instead of sneaking it into 3b.

**Acceptance:**
- `/march` instructions create the marker before a task's first file write and clear it after the task's verification passes.
- `/legion` instructions and `implementer-prompt.md` make marker activation part of each centurio's dispatch contract.
- Codex Legatus role/protocol instructions create or require marker activation before Centurion dispatch or self-execution and clear by exact marker path after task verification.
- Marker cleanup instructions distinguish clean completion, failed task, stale marker, and Imperator-approved cleanup.
- Marker ignore behavior is owned by the lifecycle helper's target-repo local git exclude update from Task 2, so the instructions do not rely on every target repo carrying a matching `.gitignore`.
- Phalanx is not widened by this task; the plan either leaves it read-only or stops for a plan amendment if Campaign 5 has changed its source role.

**Verification:**
- Run: `rg -n "active-tasks|/Users/milovan/projects/Consilium/runtimes/hooks/file_ownership.py activate|/Users/milovan/projects/Consilium/runtimes/hooks/file_ownership.py clear|git rev-parse --show-toplevel|--repo-root|--plan-path|CONSILIUM_ACTIVE_TASK_MARKER|BLOCKED" source/skills/claude/legion/SKILL.md source/skills/claude/legion/implementer-prompt.md source/skills/claude/march/SKILL.md source/roles/legatus.md source/protocols/legatus-routing.md`
- Expected: The lifecycle instructions are present in legion, the centurio prompt, march, and Codex Legatus source surfaces; lifecycle commands are absolute or installed-helper commands, pass a proved top-level `--repo-root`, pass `--plan-path`, and clear by exact marker path.

**Stop conditions:** Stop if Task 1 did not prove a signal that the execution surface can pass into the actual writing context.

### Task 6: Generation And Final Runtime Proof

**Files:**
- (none)
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Read: `claude/scripts/check-codex-drift.py`
- Read: `claude/scripts/check-tribune-staleness.py`
- Read: `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/spec.md`
- Read: `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`

**Objective:** Regenerate runtime copies, install Codex hook support, and prove the campaign is consistent across repo and installed surfaces.

**Decisions already made:**
- This task intentionally has no direct hand edits. Generated and installed outputs come from the canonical generator and install scripts.
- `python3 runtimes/scripts/generate.py` is the only way source skill edits reach `generated/`, `claude/skills/`, and `codex/source/`.
- `bash codex/scripts/install-codex.sh` remains the normal Codex agent/skill/config install command. `bash codex/scripts/install-codex-hooks.sh` is the separate hook bootstrap command and must run only after one of two proofs: if `CONSILIUM_ACTIVE_TASK_MARKER` is set, clear that exact marker path; if it is unset, prove `.consilium/active-tasks/` has no marker files under the current git top-level.
- If installed parity fails because of unrelated pre-existing installed drift, report the exact drift instead of overwriting unrelated state outside the install path.

**Acceptance:**
- The shared hook tests pass.
- Python and shell syntax checks pass.
- Generated runtime copies are updated by the generator, not by hand.
- Repo parity passes.
- Codex install sync completes.
- Codex hook bootstrap install runs outside active marker enforcement and completes. No direct source or repo writes happen after the marker is cleared; only hook bootstrap installation and parity checks run in that unguarded window.
- Claude and Codex active-marker smoke tests prove deny behavior through the runtime wrappers, not only through the shared engine.
- Installed parity passes or reports only pre-existing unrelated drift with exact paths.
- No raw `writes:` or `reads:` schema appears in Campaign 3b runtime code or skill text.
- No broad bypass flag such as `ALLOW_ALL` is introduced.

**Verification:**
- Run: `python3 runtimes/hooks/tests/test_file_ownership.py`
- Expected: Test script exits 0.
- Run: `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-claude-wrapper`
- Expected: Claude wrapper denies an undeclared write while an active test marker is present.
- Run: `python3 -m py_compile runtimes/hooks/file_ownership.py codex/scripts/sync-codex-hooks.py`
- Expected: Python compilation exits 0.
- Run: `for script in claude/hooks/file-ownership codex/hooks/consilium-file-ownership codex/scripts/install-codex-hooks.sh codex/scripts/install-codex.sh; do bash -n "$script" || exit 1; done`
- Expected: Shell syntax exits 0.
- Run: `python3 runtimes/scripts/generate.py`
- Expected: Generation reports Codex agents, Claude agents, Claude skills, and compatibility paths.
- Run: `python3 runtimes/scripts/check-runtime-parity.py`
- Expected: `Consilium repo runtime parity check passed.`
- Run: `bash codex/scripts/install-codex.sh`
- Expected: Codex agents, skills, and config install; hook files are not installed by this command.
- Run: `repo_root="$(git rev-parse --show-toplevel)" && if [ -n "${CONSILIUM_ACTIVE_TASK_MARKER:-}" ]; then python3 /Users/milovan/projects/Consilium/runtimes/hooks/file_ownership.py clear --repo-root "$repo_root" --marker-path "$CONSILIUM_ACTIVE_TASK_MARKER"; elif [ -d "$repo_root/.consilium/active-tasks" ] && fd -H -t f . "$repo_root/.consilium/active-tasks" | rg .; then exit 1; fi`
- Expected: The exact active marker for this task is cleared when present; when no marker variable exists, there are no active marker files under the current git top-level. Do not infer a marker from directory contents.
- Run: `bash codex/scripts/install-codex-hooks.sh`
- Expected: Codex hook files and hook registration install without deleting existing non-Consilium hooks.
- Run: `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-codex-wrapper`
- Expected: Installed Codex wrapper denies an undeclared write while an active test marker is present and emits the runtime deny shape.
- Run: `python3 runtimes/hooks/tests/test_file_ownership.py --smoke-subdir-check-clear`
- Expected: Hook check and marker clear both resolve the canonical git top-level when invoked from a repo subdirectory.
- Run: `python3 runtimes/scripts/check-runtime-parity.py --installed`
- Expected: `Consilium repo and installed runtime parity check passed.`
- Run: `python3 claude/scripts/check-codex-drift.py`
- Expected: Legacy drift wrapper reports runtime parity success.
- Run: `python3 claude/scripts/check-tribune-staleness.py`
- Expected: Tribune staleness check exits 0.
- Run: `if rg -n "writes:|reads:|ALLOW_ALL|bypass" runtimes/hooks claude/hooks codex/hooks source/skills/claude/legion source/skills/claude/march codex/scripts runtimes/scripts; then exit 1; fi`
- Expected: No raw schema or broad bypass appears. Matches to explanatory text must be reviewed and rejected unless they are explicit bans.

**Stop conditions:** Stop if generator or installed parity reports hook drift that the plan does not account for.

## Coverage Map

- Goal and proposed behavior: Tasks 2, 3, and 4 implement direct file-write preflight enforcement.
- Contract consumed from 3a: Task 2 parses only the 3a `**Files:**` block and Task 6 rejects alternate schema drift.
- Marker lifecycle: Tasks 2 and 5 define helper behavior and execution-surface activation/cleanup.
- Hook behavior: Tasks 2, 3, and 4 cover marker resolution, file matching, runtime wrappers, and registration.
- Error/failure behavior: Task 2 owns deny messages and fail-closed malformed-contract behavior.
- Escape hatches: Tasks 2 and 5 keep marker lifecycle narrow and prevent task-context marker edits.
- Campaign 5 coordination: Task 5 reads phalanx but does not modify it unless Campaign 5 has already made it an execution surface, in which case this plan stops for amendment.
