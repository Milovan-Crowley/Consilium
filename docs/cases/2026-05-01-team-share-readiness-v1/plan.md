# Team-Share Readiness V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:legion` (recommended) or `consilium:march` to implement this plan task-by-task.

**Goal:** Make the Consilium repo solid for internal team use by Gavin and Ivan: clone it, understand it, install Claude and Codex support, verify the installed runtime, and avoid stale inherited surfaces that make the repo look sloppy.

**Plan Scale:** Campaign

**Implementation Shape:** Root onboarding first, then runtime packaging, then active source cleanup, then generated runtime proof. Claude and Codex are the only supported V1 runtimes. Cursor, OpenCode, Gemini, Copilot, and inherited Superpowers packaging are retired rather than preserved. Existing case history remains visible, but it gets framed as internal working memory rather than cleaned into public docs.

**Parallel-safe wave:** After Task 0 passes, Tasks 1-4 may run under `consilium:phalanx`. Return to `consilium:legion` for Tasks 5-8.

Wave rationale: Tasks 1-4 have disjoint write sets and explicit `Read:` declarations. They cover root onboarding, docs/case presentation, Claude packaging, and Codex packaging. Do not include Task 5 or later in the wave because source cleanup, unsupported-surface retirement, generation, installed proof, and status recording depend on the combined result.

**Scope In:**
- Root `README.md`, `AGENTS.md`, and `CLAUDE.md` onboarding.
- Claude packaging, docs, and install path.
- Full removal of the active Claude `session-start` hook.
- Codex packaging, install docs, generated config portability, and fresh-config behavior.
- Retirement of unsupported inherited runtime surfaces.
- Cleanup of active source references that still point at Superpowers or Milovan-only absolute paths without teammate override guidance.
- Docs/case presentation for internal team readability.
- Final readiness gate that proves generated and installed Claude/Codex surfaces.

**Scope Out:**
- Public/open-source polish, changelogs, release notes, marketplace publishing, badges, or contributor docs.
- Cursor, OpenCode, Gemini, Copilot, or other inherited runtime support.
- Rewriting old case history or unrelated dirty case docs.
- Changing Consilium doctrine beyond what is required for team-share readiness.
- Creating new agents, roles, or skills beyond portability and packaging fixes.

**Verification:** The campaign is complete only when dispatch preflight, repo-local generation, runtime parity, Claude install proof, Codex install proof, fresh Codex config simulation, and active-surface stale reference review all pass from a clean worktree or a recorded dirty-worktree baseline. Final verification must be recorded in `docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md`.

---

## Task 0: Establish Dispatch Baseline

### Objective
Resolve `$CONSILIUM_DOCS`, record the current worktree baseline, and prevent unrelated dirty case files from polluting the implementation or final readiness gate.

### Files

Create:
- `docs/cases/2026-05-01-team-share-readiness-v1/dispatch-baseline.md`

Read:
- `docs/CONVENTIONS.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/spec.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md`

### Required Decisions
- Resolve `$CONSILIUM_DOCS` from the current repo root if it is unset:
  - `REPO_ROOT="$(git rev-parse --show-toplevel)"`
  - `export CONSILIUM_DOCS="${CONSILIUM_DOCS:-$REPO_ROOT/docs}"`
- Before writing `dispatch-baseline.md` or any other shared-doc artifact, run the full shared-docs guard:
  - `$CONSILIUM_DOCS/CONVENTIONS.md` exists
  - the first line contains `consilium-docs CONVENTIONS`
  - `$CONSILIUM_DOCS/.migration-in-progress` is absent
- Verify `$CONSILIUM_DOCS/cases/2026-05-01-team-share-readiness-v1/spec.md` exists after the guard passes.
- Choose one execution baseline:
  - clean worktree
  - isolated worktree
  - recorded dirty baseline in `dispatch-baseline.md`
- Do not dispatch the parallel-safe wave until this baseline is recorded and the shared-docs guard passes.
- If using the current dirty checkout, record the pre-dispatch `git status --short` output and treat unrelated pre-existing dirty files as baseline noise, not implementation output.
- Workers must not modify unrelated case folders already dirty before dispatch.

### Acceptance Criteria
- `$CONSILIUM_DOCS` points at the docs tree used by this case.
- `$CONSILIUM_DOCS` passes the `CONVENTIONS.md` marker guard and migration lock check before any baseline file is written.
- The chosen baseline is recorded before Task 1 begins.
- Final `git status --short` can be compared against the baseline instead of pretending the checkout started clean.
- The plan remains executable even when unrelated current case docs are already dirty.

### Verification
Run:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-$REPO_ROOT/docs}"
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a Consilium docs checkout" >&2
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "$CONSILIUM_DOCS migration in progress" >&2
  exit 1
}
test -f "$CONSILIUM_DOCS/cases/2026-05-01-team-share-readiness-v1/spec.md"
git status --short
```

Expected result:
- `$CONSILIUM_DOCS` resolves to the case docs.
- Shared-docs marker and migration-lock guard pass.
- Any pre-existing dirty files are recorded in `dispatch-baseline.md` before implementation edits begin.

---

## Task 1: Build The Root Onboarding Surface

### Objective
Give Gavin and Ivan a clean first-contact path from the repo root. The root should say what Consilium is, what V1 supports, how to install it, and where to find the real docs without pretending this is public-facing software.

### Files

Create:
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

Read:
- `docs/CONVENTIONS.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/spec.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/plan.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md`

### Required Decisions
- State clearly that V1 supports Claude and Codex only.
- State clearly that this is internal team tooling for Milovan, Gavin, and Ivan.
- Make `$CONSILIUM_DOCS` the first required environment variable for shared-doc workflows.
- During the parallel-safe wave, do not read sibling wave outputs from Tasks 2-4. Use the approved spec, plan, status, and conventions as the stable contract.
- Explain the supported setup path in short form:
  - clone repo
  - set `$CONSILIUM_DOCS`
  - install Claude support if using Claude
  - install Codex support if using Codex
  - run verification
- Do not include public contribution, release, marketplace, or open-source positioning.

### Acceptance Criteria
- A teammate can land on root `README.md` and know which runtime path applies to them.
- Root `AGENTS.md` gives repo-local agent behavior rules and points to the fuller runtime docs.
- Root `CLAUDE.md` gives Claude a minimal repo entry point without duplicating full skill doctrine.
- No root doc implies Cursor/OpenCode/Gemini/Copilot support.
- No root doc tells Gavin or Ivan to edit Milovan-only paths as the normal path.

### Verification
Run:

```bash
rg -n "Cursor|OpenCode|Gemini|Copilot|Superpowers|public|open-source|marketplace|release notes|changelog" README.md AGENTS.md CLAUDE.md || true
if rg -n "/Users/milovan" README.md AGENTS.md CLAUDE.md; then
  echo "Milovan-only path found in root onboarding" >&2
  exit 1
fi
```

Expected result:
- Unsupported runtimes appear only if explicitly framed as unsupported.
- `/Users/milovan` does not appear in root onboarding.

---

## Task 2: Frame Docs And Case History For Internal Use

### Objective
Make the docs tree readable as working memory. Keep case history visible, but prevent old case artifacts from looking like current instructions or public documentation.

### Files

Create:
- `docs/cases/README.md`

Modify:
- `docs/README.md`
- `docs/INDEX.md`

Read:
- `docs/CONVENTIONS.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/spec.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md`

### Required Decisions
- Present `docs/cases/` as case memory: useful, retained, not a polished public guide.
- Point teammates to the current case status files before treating a case plan as live.
- Keep unrelated current dirty/current case docs out of this implementation.
- Keep docs language internal and practical.

### Acceptance Criteria
- A teammate can tell where canonical docs live and where historical cases live.
- Old case folders are not hidden or rewritten.
- The docs index does not imply every case plan is still active.
- No public-project polish is added.

### Verification
Run:

```bash
rg -n "public|open-source|contributor|release|marketplace" docs/README.md docs/INDEX.md docs/cases/README.md || true
rg -n "current|active|historical|case" docs/README.md docs/INDEX.md docs/cases/README.md
```

Expected result:
- Internal case framing is explicit.
- Public-facing language is absent unless used to say it is out of scope.

---

## Task 3: Rebuild Claude Packaging And Remove Session Start Hook

### Objective
Make Claude support feel like Consilium, not inherited Superpowers packaging. Remove the `session-start` hook entirely from active registration and source packaging.

### Files

Create:
- `claude/scripts/install-claude.sh`
- `claude/scripts/check-claude-install.py`

Modify:
- `claude/README.md`
- `claude/AGENTS.md`
- `claude/CLAUDE.md`
- `claude/hooks/hooks.json`
- `claude/hooks/hooks-cursor.json`
- `claude/hooks/run-hook.cmd`
- `claude/hooks/session-start`

Read:
- `claude/.claude-plugin/plugin.json`
- `claude/.claude-plugin/marketplace.json`
- `generated/claude/agents/`
- `source/roles/`

### Required Decisions
- The Claude `session-start` hook is removed, not rewritten.
- If hook files remain for technical compatibility, they must be inert and unregistered. Prefer deleting the active `session-start` hook file if no runtime packaging requires it.
- `claude/scripts/install-claude.sh` must:
  - install generated `consilium-*.md` agents into `$HOME/.claude/agents`
  - link `$HOME/.claude/plugins/consilium` to the repo `claude/` directory
  - register `extraKnownMarketplaces.consilium-local.source.path` in `$HOME/.claude/settings.json` to the current checkout's `claude/` directory
  - enable `enabledPlugins["consilium@consilium-local"]`
  - preserve unrelated Claude settings
  - support an explicit `--home PATH` fixture mode for no-risk install tests
  - stop before replacing a non-symlink plugin path
  - avoid `/Users/milovan` hard-coding
- `claude/scripts/check-claude-install.py` must support `--home PATH` and `--settings PATH` so plugin registration can be verified without editing Milovan's real settings during tests.
- Claude docs must describe refresh/install in teammate-safe terms.
- Keep `claude/.claude-plugin/plugin.json` and `claude/.claude-plugin/marketplace.json` only if they already represent Consilium correctly.

### Acceptance Criteria
- A teammate can run one Claude install command from the repo root.
- The install command makes Claude aware of the local Consilium marketplace and enables the Consilium plugin.
- Claude packaging does not inject a full skill body at session start.
- There is no disclaimer language such as "this is not Superpowers."
- Claude docs present Consilium directly.
- Cursor hook packaging is removed or clearly inert because Cursor is unsupported in V1.

### Verification
Run:

```bash
bash -n claude/scripts/install-claude.sh
tmp_home="$(mktemp -d)"
bash claude/scripts/install-claude.sh --home "$tmp_home"
python3 claude/scripts/check-claude-install.py --repo "$(pwd)" --home "$tmp_home" --settings "$tmp_home/.claude/settings.json"
rm -rf "$tmp_home"
if rg -n "session-start|SessionStart" claude/hooks claude/.claude-plugin; then
  echo "active Claude session-start hook reference remains" >&2
  exit 1
fi
rg -n "Superpowers|superpowers|Cursor|OpenCode|Gemini|Copilot" claude || true
if rg -n "/Users/milovan" claude/README.md claude/AGENTS.md claude/CLAUDE.md claude/scripts/install-claude.sh claude/scripts/check-claude-install.py claude/hooks; then
  echo "Milovan-only path found in active Claude install surface" >&2
  exit 1
fi
```

Expected result:
- `session-start` has no active registration.
- Superpowers hits are gone from active Claude packaging, except explicitly retained historical docs if any are documented as historical.
- `/Users/milovan` does not appear in Claude install docs/scripts.

### Stop Conditions
- Stop if the install script would overwrite a real directory at `$HOME/.claude/plugins/consilium`.
- Stop if removing hook files breaks a known Claude plugin manifest expectation; document the exact manifest constraint before choosing an inert-file fallback.

---

## Task 4: Make Codex Packaging Portable And Fresh-Config Safe

### Objective
Make Codex setup work for Gavin and Ivan without Milovan-specific config paths and without assuming `~/.codex/config.toml` already has a `[features]` section.

### Files

Create:
- `codex/scripts/check-codex-config-portability.py`

Modify:
- `runtimes/scripts/generate.py`
- `runtimes/scripts/check-runtime-parity.py`
- `codex/scripts/sync-codex-config.py`
- `codex/scripts/install-codex.sh`
- `codex/scripts/install-codex-agents.sh`
- `codex/README.md`

Read:
- `codex/scripts/install-codex-agents.sh`
- `codex/scripts/install-codex-skills.sh`
- `codex/scripts/check-shared-docs-adoption.py`
- `codex/scripts/check-tribune-shared-docs.py`
- `codex/config/codex-config-snippet.toml`
- `generated/codex/config/codex-config-snippet.toml`

### Required Decisions
- Generated Codex config snippets must not contain `/Users/milovan`.
- `sync-codex-config.py` must accept explicit `--config PATH`, `--snippet PATH`, and `--agent-dir PATH` options for fixture checks.
- Installed `config_file` paths must render from `$HOME/.codex/agents` by default or the explicit `--agent-dir` fixture, not from a hard-coded Milovan path.
- `sync-codex-config.py` must support a fresh config file:
  - missing config file
  - config without `[features]`
  - config with existing non-Consilium settings
- `codex/scripts/check-codex-config-portability.py` must simulate missing config and missing `[features]` with temp files or temp home paths, without touching Milovan's real config.
- `codex/scripts/install-codex.sh` must support `--dry-run` and run config preflight before any writes to `$HOME/.codex/agents`, `$HOME/.agents/skills`, or `$HOME/.codex/config.toml`.
- `codex/scripts/install-codex-agents.sh` must support a no-write validation mode used by the installer preflight.
- `check-runtime-parity.py` or the new portability checker must fail on hard-coded Milovan paths in generated or installed Codex runtime config, except documented allow-list cases outside active Codex config.

### Acceptance Criteria
- `python3 runtimes/scripts/generate.py` creates Codex config snippets that are repo-portable.
- Codex install preflight validates config, agents, and skills before any write step.
- `bash codex/scripts/install-codex.sh --dry-run` performs validation only and writes nothing.
- Fresh-config and missing-`[features]` simulations succeed without touching Milovan's real config.
- `codex/README.md` explains the supported install and refresh path without stale Claude/Superpowers language.
- During the parallel-safe wave, Task 4 does not run real generation or installed-user-home proof. Task 7 owns generation; Task 8 owns installed proof.

### Verification
Run:

```bash
python3 -m py_compile runtimes/scripts/generate.py runtimes/scripts/check-runtime-parity.py codex/scripts/sync-codex-config.py codex/scripts/check-codex-config-portability.py
bash -n codex/scripts/install-codex.sh
bash -n codex/scripts/install-codex-agents.sh
bash -n codex/scripts/install-codex-skills.sh
python3 codex/scripts/check-codex-config-portability.py
python3 codex/scripts/check-codex-config-portability.py --simulate-fresh-config
bash codex/scripts/install-codex.sh --dry-run
```

Expected result:
- All commands pass.
- No Codex generated or compatibility config path contains `/Users/milovan`.
- No installed user-home state is changed by Task 4 verification.

### Stop Conditions
- Stop if changing Codex config rendering would break current installed Codex agent discovery.
- Stop if `install-codex.sh` mutates agents, skills, or the real config before a validation step that can still fail. Add a dry-run/preflight first.

---

## Task 5: Remove Active Superpowers And Milovan-Only References From Supported Source

### Objective
Clean active canonical source so generated Claude and Codex runtime artifacts no longer carry stale Superpowers framing or Milovan-only absolute paths unless the text is explicitly a local default with teammate override guidance.

### Files

Modify:
- `source/manifest.json`
- `source/doctrine/backend.md`
- `source/protocols/consul-routing.md`
- `source/doctrine/frontend.md`
- `source/skills/claude/edicts/SKILL.md`
- `source/skills/claude/legion/SKILL.md`
- `source/skills/claude/castra/SKILL.md`
- `source/skills/claude/audit/SKILL.md`
- `source/skills/claude/consul/SKILL.md`
- `source/skills/claude/consul/visual-companion.md`
- `source/skills/claude/consul/scripts/frame-template.html`
- `source/skills/claude/consul/scripts/start-server.sh`
- `source/skills/claude/consul/scripts/stop-server.sh`

Read:
- `source/doctrine/common.md`
- `source/skills/claude/tribune/SKILL.md`
- `docs/cases/2026-05-01-team-share-readiness-v1/spec.md`

### Required Decisions
- Replace active Superpowers names with Consilium names.
- Replace active `.superpowers/brainstorm` runtime paths with a Consilium-owned path, expected default `.consilium/brainstorm`.
- Replace `.superpowers` runtime paths only where they are active Consilium-owned paths, not if they are intentionally describing old history.
- Replace Milovan-only absolute paths with `$CONSILIUM_DOCS`, `$HOME`, repo-root relative paths, or explicit "Milovan local default" language.
- If a Milovan path remains because it is doctrine default or historical evidence, document why the remaining hit is allowed.
- Remove Gemini/OpenCode/Cursor instructions from supported active source.

### Acceptance Criteria
- Generated Claude and Codex skill bodies no longer instruct teammates to use Superpowers runtime paths.
- Active Consilium skill bodies no longer assume `/Users/milovan/projects/Consilium` as the only valid repo location.
- Active Consilium routing docs do not point to Milovan's private plugin cache as the normal path.
- Visual companion text no longer advertises unsupported Gemini/OpenCode surfaces for V1.

### Verification
Run:

```bash
rg -n "Superpowers|superpowers|\\.superpowers|OpenCode|Cursor|Gemini|Copilot|/Users/milovan" source || true
python3 runtimes/scripts/generate.py
rg -n "Superpowers|superpowers|\\.superpowers|OpenCode|Cursor|Gemini|Copilot|/Users/milovan" generated/claude generated/codex claude/skills codex/source codex/agents || true
```

Expected result:
- Every remaining hit is either removed or explicitly recorded as allowed historical/default context.
- No generated active runtime instruction tells Gavin or Ivan to use unsupported runtimes.

---

## Task 6: Retire Unsupported Inherited Runtime Surfaces

### Objective
Remove or clearly deactivate inherited packaging that would make the repo appear to support runtimes outside Claude and Codex.

### Files

Modify:
- `claude/.codex/INSTALL.md`
- `claude/.opencode/INSTALL.md`
- `claude/.opencode/plugins/superpowers.js`
- `claude/.cursor-plugin/plugin.json`
- `claude/.version-bump.json`
- `claude/scripts/bump-version.sh`
- `claude/scripts/check-codex-drift.py`
- `claude/docs/README.codex.md`
- `claude/docs/README.opencode.md`
- `claude/docs/testing.md`
- `claude/docs/windows/polyglot-hooks.md`
- `claude/docs/CONSILIUM-VISION.md`
- `claude/docs/testing-agents.md`
- `claude/docs/claude-subagents-mcp-findings.md`
- `claude/mcps/principales/`
- `claude/CHANGELOG.md`
- `claude/RELEASE-NOTES.md`
- `claude/commands/brainstorm.md`
- `claude/commands/write-plan.md`
- `claude/commands/execute-plan.md`

Read:
- `claude/README.md`
- `claude/CLAUDE.md`

### Required Decisions
- Prefer deletion for unsupported runtime packaging and command shims.
- Keep historical Consilium docs only if they are useful and framed as history or internal notes.
- Do not ship historical notes or experimental MCP substrates inside the installed Claude plugin if they read like active runtime guidance.
- Do not create replacement Cursor/OpenCode docs.
- Do not keep Superpowers command aliases alive for convenience.

### Acceptance Criteria
- First-party packaging no longer exposes Cursor/OpenCode install paths.
- First-party commands no longer redirect to `superpowers:*`.
- Changelog/release-note files from inherited public packaging are removed or reduced to an internal note only if truly needed.
- Retained historical docs do not look like install instructions.
- The installed Claude plugin symlink no longer exposes `claude/mcps/principales/` or stale `claude/docs/` guidance.

### Verification
Run:

```bash
fd -H -a "INSTALL|README|CHANGELOG|RELEASE|commands|hooks|cursor|opencode|codex|version-bump|bump-version" claude
test ! -e claude/mcps/principales
test ! -e claude/docs
test ! -e claude/scripts/check-codex-drift.py
rg --sort path -n "Superpowers|superpowers|OpenCode|Cursor|Gemini|Copilot|marketplace|release notes|changelog|consilium-principales|MOONSHOT|Moonshot|Kimi|check-codex-drift|All 5 agents" claude || true
```

Expected result:
- Remaining hits are either supported Claude docs or checker regexes that intentionally detect stale Tribune references.

---

## Task 7: Regenerate Runtime Artifacts And Prove Repo-Local Parity

### Objective
Refresh generated and compatibility runtime outputs from canonical `source/` and prove the repo-local generated surfaces are consistent.

### Files

Modify:
- `generated/`
- `claude/skills/`
- `codex/source/`
- `codex/agents/`
- `codex/config/`

Read:
- `source/manifest.json`
- `source/roles/`
- `source/skills/claude/`
- `source/doctrine/`
- `runtimes/scripts/generate.py`
- `runtimes/scripts/check-runtime-parity.py`
- `codex/scripts/install-codex-agents.sh`
- `codex/scripts/install-codex-skills.sh`
- `codex/scripts/check-shared-docs-adoption.py`
- `codex/scripts/check-tribune-shared-docs.py`

### Required Decisions
- Do not hand-edit generated runtime outputs.
- If generated output exposes a stale reference, fix canonical `source/` or generator code and regenerate.
- Treat generator output diffs as expected implementation output, not separate feature edits.
- Task 7 owns generated directories only as generator output. Any hand edit needed to affect generated output belongs in the earlier source or script task that owns the canonical file.

### Acceptance Criteria
- Generated Claude agents and Codex agents reflect the same canonical manifest/source.
- Compatibility directories match generated runtime output.
- Shared-doc adoption checks still pass after source cleanup.
- Runtime parity fails if expected generated files are missing or stale.

### Verification
Run:

```bash
python3 runtimes/scripts/generate.py
python3 runtimes/scripts/check-runtime-parity.py
bash codex/scripts/install-codex-agents.sh --validate-only
bash codex/scripts/install-codex-skills.sh --dry-run
python3 codex/scripts/check-shared-docs-adoption.py
python3 codex/scripts/check-tribune-shared-docs.py
git diff --check
```

Expected result:
- All commands pass.
- Generated artifacts are in sync with source.
- No whitespace or patch hygiene issues.

---

## Task 8: Run Installed Readiness Gate And Update Case Status

### Objective
Prove the teammate-facing install path end-to-end, then record exact results in the case status file.

### Files

Modify:
- `docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md`

Read:
- `README.md`
- `claude/scripts/install-claude.sh`
- `claude/scripts/check-claude-install.py`
- `codex/scripts/install-codex.sh`
- `runtimes/scripts/check-runtime-parity.py`
- `codex/scripts/check-codex-config-portability.py`
- `docs/cases/2026-05-01-team-share-readiness-v1/dispatch-baseline.md`

### Required Decisions
- Installed verification must run after all generator output is current.
- Claude install proof must not replace a non-symlink plugin path.
- Claude install proof must verify both installed agents/plugin symlink and Claude settings registration for `consilium@consilium-local`.
- Codex install proof must include generated config portability and installed config checks.
- Active stale-reference review must target active onboarding, install, source, generated, and config surfaces only. Do not scan all `docs/` or all `docs/cases/` as a pass/fail gate.
- `STATUS.md` must record the exact commands run and any remaining allowed stale references.

### Acceptance Criteria
- Claude install command succeeds or stops with a clear guard message for a real non-symlink conflict.
- Claude settings point `extraKnownMarketplaces.consilium-local.source.path` at the current checkout's `claude/` directory and enable `consilium@consilium-local`.
- Codex install command succeeds on the current machine.
- Installed runtime checks pass.
- `STATUS.md` says implementation is complete only after proof is recorded.
- If any stale reference remains, `STATUS.md` records why it is allowed.

### Verification
Run:

```bash
bash claude/scripts/install-claude.sh
python3 claude/scripts/check-claude-install.py --repo "$(pwd)" --home "$HOME" --settings "$HOME/.claude/settings.json" --installed
bash codex/scripts/install-codex.sh --prune-agents
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-codex-config-portability.py --installed
python3 codex/scripts/check-shared-docs-adoption.py --installed
python3 codex/scripts/check-tribune-shared-docs.py --installed
ACTIVE_SURFACES=(
  README.md AGENTS.md CLAUDE.md
  docs/README.md docs/INDEX.md docs/cases/README.md
  claude claude/.claude-plugin
  codex/README.md codex/scripts codex/config
  runtimes/scripts
  source generated codex/source codex/agents
)
rg --sort path -n "Superpowers|superpowers|\\.superpowers|OpenCode|Cursor|Gemini|Copilot|/Users/milovan" "${ACTIVE_SURFACES[@]}" || true
rg --sort path -n "consilium-principales|MOONSHOT|Moonshot|Kimi|check-codex-drift|All 5 agents" claude source/manifest.json generated/claude/agents codex/agents codex/README.md codex/scripts || true
rg --sort path -n "bash scripts/|python3 scripts/" codex/README.md || true
test ! -e claude/mcps/principales
test ! -e claude/docs
test ! -e claude/scripts/check-codex-drift.py
git status --short
```

Expected result:
- All installed runtime checks pass.
- Active-surface stale reference review has no unrecorded unsupported-runtime hits.
- Active Claude/Codex install docs, generated agents, and the installed Claude plugin tree have no unrecorded `consilium-principales`, Moonshot/Kimi, or stale drift-check dependency for V1.
- `codex/README.md` contains no repo-root-invalid `scripts/...` install commands.
- The installed Claude plugin tree does not expose `claude/mcps/principales/`, stale `claude/docs/`, or `claude/scripts/check-codex-drift.py`.
- Remaining `/Users/milovan` hits, if any, are documented as explicit local defaults or historical evidence.
- `git status --short` matches the Task 0 baseline plus intended files for this case.

---

## Final Self-Review Checklist

Before telling Milovan this plan is ready for execution, verify:

- Every task has exact Files blocks.
- No task implements unsupported runtimes.
- No task asks workers to clean unrelated cases.
- The Claude `session-start` hook is removed, not softened into a reminder.
- Codex portability includes fresh-config behavior, not only existing config behavior.
- Generated artifacts are updated only through the generator.
- Final proof includes both repo-local and installed runtime checks.
- `STATUS.md` remains the living case status record.
