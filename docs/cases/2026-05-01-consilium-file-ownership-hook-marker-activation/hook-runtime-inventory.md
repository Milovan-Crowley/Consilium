# Hook Runtime Inventory

Campaign 3b Task 1 inventory only. No hook logic or registration is written here.

Non-negotiable marker rule: do not select a marker because it is the only marker in a directory. A runtime is enforceable only when the hook can resolve one active marker from a stable execution/session id or from an explicit marker path channel visible to the hook.

First-pass covered runtimes: Codex, Claude Code.

Excluded from first-pass enforcement: Cursor. The local Cursor hook file only registers `sessionStart`, and no local probe or local documentation in this worktree proves a direct-write `preToolUse` payload and stable marker signal.

Evidence read:
- `claude/hooks/hooks.json`: local Claude plugin registers `SessionStart` through `run-hook.cmd`.
- `claude/hooks/hooks-cursor.json`: local Cursor plugin registers only `sessionStart`.
- `claude/hooks/run-hook.cmd` and `claude/docs/windows/polyglot-hooks.md`: wrapper path and hook command behavior only; no write-payload proof.
- `codex/README.md`: Codex runtime source/install shape and shared-docs default.
- `runtimes/scripts/generate.py`: `CLAUDE_TOOL_PROFILES` defines Claude write tools.
- `source/manifest.json`: only `consilium-centurio-front`, `consilium-centurio-back`, and `consilium-centurio-primus` use Claude `tools_profile: write`; Codex enables all agents through config files.
- `$HOME/.codex/hooks.json` and `$HOME/.codex/hooks/*.sh`: current Codex user hooks register `PreToolUse` only for `Bash`, plus lifecycle hooks; hook scripts parse `.tool_input.command`.
- Codex source documentation checked through `gh api` against `openai/codex`: `PreToolUse` command input requires `session_id`, `turn_id`, `tool_name`, `tool_input`, `tool_use_id`, and related fields; `apply_patch` serializes as `tool_name: apply_patch` with `tool_input.command`; MCP tools serialize as full model tool names such as `mcp__memory__create_entities`.
- Claude Code hook runtime docs checked at `https://docs.anthropic.com/en/docs/claude-code/hooks`: `PreToolUse` hook input includes `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `tool_name`, and `tool_input`.

## Codex

Runtime: Codex
Status: READY
Execution signal: `session_id` from Codex `PreToolUse` hook payload, backed by the same conversation id exposed to shell execution as `CODEX_THREAD_ID`.
Propagation proof: PASS

Proof notes:
- Local writing shell proof: `printenv CODEX_THREAD_ID` returned `019de668-0c85-7a03-9e22-a16b2f658648` in this worktree.
- Local hook activity proof: `bash -lc 'cat /dev/null'` was blocked by the installed Codex `PreToolUse` hook, proving Codex user hooks are active for `Bash`.
- Codex source proof: `hook_runtime.rs` builds `PreToolUseRequest { session_id: sess.conversation_id, turn_id, cwd, tool_name, tool_input, tool_use_id }`.
- Codex source proof: `process_manager.rs` inserts `CODEX_THREAD_ID = context.session.conversation_id.to_string()` into unified exec environment.
- Codex source proof: `apply_patch.rs` exposes `tool_name: apply_patch` and `tool_input: { "command": raw_patch }`; `hook_names.rs` also accepts matcher aliases `Write` and `Edit` for apply-patch selection.
- Codex source proof: `mcp.rs` exposes MCP hook tool names as full model names, for example `mcp__memory__create_entities`.

Direct write tools:
- `apply_patch` with compatibility matchers `Write|Edit`; hook input path extraction must parse `tool_input.command` as a patch.
- `Bash`; only exact recognized Campaign 3a generator commands may receive generator-command handling. Arbitrary Bash mutation remains out of scope.
- `mcp__serena__create_text_file`; exposed by active Serena config, covered as direct file write.
- `mcp__serena__replace_content`; exposed by active Serena config, covered as direct file mutation.
- `mcp__serena__replace_symbol_body`; exposed by active Serena config, covered as symbol mutation.
- `mcp__serena__insert_after_symbol`; exposed by active Serena config, covered as symbol mutation.
- `mcp__serena__insert_before_symbol`; exposed by active Serena config, covered as symbol mutation.
- `mcp__serena__rename_symbol`; exposed by active Serena config, covered as symbol mutation.
- `mcp__serena__safe_delete_symbol`; exposed by active Serena config, covered as symbol mutation.
- `mcp__serena__execute_shell_command`; exposed by active Serena config, covered only for exact recognized Campaign 3a generator commands. Arbitrary shell mutation through Serena remains out of scope.

Generator commands:
- Only exact recognized Campaign 3a Edicts Files-block generator commands.
- Campaign 3a is not present in this worktree, so Task 2 must import the finalized 3a command allowlist before registering generator handling.
- No `Bash`, `exec_command`, shell wrapper, or Serena shell command should be treated as generally mutation-safe.

Decision: Codex is ready for first-pass enforcement using `session_id`/`CODEX_THREAD_ID`, with direct file writes covered by `apply_patch` and Serena mutation matchers, and generator handling limited to exact 3a commands.

## Claude Code

Runtime: Claude Code
Status: READY
Execution signal: `session_id` from Claude Code hook JSON input.
Propagation proof: PASS

Proof notes:
- Official Claude Code hook docs define common hook input with `session_id`, `transcript_path`, and `cwd`.
- Official Claude Code `PreToolUse` docs show `hook_event_name: PreToolUse`, `tool_name`, and `tool_input` for a write tool in the same hook payload.
- Official Claude Code hook execution docs state hooks run in the current directory with Claude Code's environment and receive JSON via stdin.
- Local `runtimes/scripts/generate.py` `CLAUDE_TOOL_PROFILES.write` exposes direct write tools `Write`, `Edit`, `Bash`, and the Serena mutators listed below.
- Local `source/manifest.json` assigns Claude `tools_profile: write` only to `consilium-centurio-front`, `consilium-centurio-back`, and `consilium-centurio-primus`; other Claude agents do not receive `Write`/`Edit` through this generator profile.

Direct write tools:
- `Write`; hook input uses the Claude `tool_input` payload for file path extraction.
- `Edit`; hook input uses the Claude `tool_input` payload for file path extraction.
- `Bash`; only exact recognized Campaign 3a generator commands may receive generator-command handling. Arbitrary Bash mutation remains out of scope.
- `mcp__serena__replace_symbol_body`; exposed in `CLAUDE_TOOL_PROFILES.write`, covered as symbol mutation.
- `mcp__serena__insert_after_symbol`; exposed in `CLAUDE_TOOL_PROFILES.write`, covered as symbol mutation.
- `mcp__serena__insert_before_symbol`; exposed in `CLAUDE_TOOL_PROFILES.write`, covered as symbol mutation.
- `mcp__serena__rename_symbol`; exposed in `CLAUDE_TOOL_PROFILES.write`, covered as symbol mutation.
- `mcp__serena__safe_delete_symbol`; exposed in `CLAUDE_TOOL_PROFILES.write`, covered as symbol mutation.
- `mcp__serena__create_text_file`, `mcp__serena__replace_content`, and `mcp__serena__execute_shell_command` are not present in `CLAUDE_TOOL_PROFILES.write`; they are therefore not available to generated Claude write agents from this repo generator unless the profile changes.

Generator commands:
- Only exact recognized Campaign 3a Edicts Files-block generator commands.
- Campaign 3a is not present in this worktree, so Task 2 must import the finalized 3a command allowlist before registering generator handling.
- No arbitrary Bash mutation is covered by this campaign.

Decision: Claude Code is ready for first-pass enforcement once Task 2 registers `PreToolUse` matchers for `Write|Edit|Bash|mcp__serena__replace_symbol_body|mcp__serena__insert_after_symbol|mcp__serena__insert_before_symbol|mcp__serena__rename_symbol|mcp__serena__safe_delete_symbol`, with `Bash` narrowed to exact 3a generator commands.

## Cursor

Runtime: Cursor
Status: HALT
Execution signal: Unproved. Candidate signal is Cursor hook `conversation_id`, but this worktree has no local runtime documentation or non-mutating probe proving it for direct-write hooks.
Propagation proof: FAIL

Proof notes:
- Local `claude/hooks/hooks-cursor.json` registers only `sessionStart` with `./hooks/session-start`.
- Local `claude/RELEASE-NOTES.md` mentions Cursor `sessionStart` compatibility, not a direct-write hook contract.
- Search found public reports of Cursor hook payloads with `conversation_id`, `tool_name`, and `tool_input`, but no local probe or local documentation in this worktree proves that contract for first-pass enforcement.

Direct write tools:
- Not selected for first-pass enforcement.
- Direct-write and mutation-capable Cursor tool names remain unproved in this worktree.

Generator commands:
- None selected for Cursor until direct-write hook payload and marker propagation are proven.

Decision: Cursor is excluded from first-pass enforcement. Do not register Cursor file-ownership enforcement until a non-mutating Cursor hook probe or authoritative local Cursor docs prove direct-write hook payload fields, stable execution signal, and mutation-capable tool names.
