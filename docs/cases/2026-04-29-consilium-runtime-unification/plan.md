# Consilium Runtime Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut Consilium over to one runtime-neutral source tree and one canonical role vocabulary while still installing separate Claude and Codex runtime files.

**Architecture:** Treat `source/` as the canonical prompt and skill source, `generated/` as the build output, and `runtimes/` plus the existing `claude/` and `codex/` paths as runtime adapters. Generate Codex TOML agents/config, Claude Markdown agents, and Claude main-session skills from neutral source; sync compatibility copies into `claude/` and `codex/`; install both runtimes; then prune retired Claude names only after parity checks and fresh-session visibility smoke pass.

**Tech Stack:** Markdown prompt source, JSON manifest, Python generation/check scripts, Bash install wrappers, Claude Markdown agents/skills, Codex TOML agents/config.

**Spec:** `spec.md`

---

## Scope Guard

Execute this plan from a dedicated worktree. Do not implement this on the dirty `main` checkout.

All repo-editing commands must use this execution root after Task 0:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
```

If a later command still shows `/Users/milovan/projects/Consilium` for a repo file, treat that as the source checkout only for reading preflight facts. Edits must happen under `$repo_root`.

Do not change model strength. Claude generated agents keep `model: opus`. Codex generated agents keep `model = "gpt-5.5"` and `model_reasoning_effort = "xhigh"` unless the existing manifest says otherwise.

Do not continue risk-tier plan-format work in this lane.

Do not leave `consilium-soldier`, `consilium-scout`, `Medicus`, or the five lane-specific Provocator agents as active workflow names.

Do not delete the existing `claude/` or `codex/` directories. During this cutover they become adapter and compatibility paths because the live plugin/runtime configuration still references them.

Do not prune installed Claude agents until generated Claude agents, installed Claude agents, generated Codex agents, installed Codex agents, Codex config registration, Claude plugin source visibility, and fresh-session canonical-name smoke have all passed.

## Assumptions And Tradeoffs

- The first cutover may keep scripts in their existing `claude/scripts` and `codex/scripts` paths as adapters. This is faster and safer than moving every script path in the same pass.
- Claude skill bodies move under `source/skills/`; generated copies are synced back into `claude/skills/` because the Claude plugin loads that path.
- `consilium-speculator-primus` is new and fills the old generic Scout lane for Consilium source, runtime adapter, plugin/cache/config, unknown-lane, and cross-surface reconnaissance.
- Codex may expose Consul and Legatus as configured agents. Claude keeps Consul and Legatus as main-session skills.

## File Plan

**Create**

- `$repo_root/source/manifest.json`
- `$repo_root/source/doctrine/*.md`
- `$repo_root/source/protocols/*.md`
- `$repo_root/source/roles/*.md`
- `$repo_root/source/roles/speculator-primus.md`
- `$repo_root/source/skills/claude/**`
- `$repo_root/generated/claude/agents/consilium-*.md`
- `$repo_root/generated/claude/skills/*/SKILL.md`
- `$repo_root/generated/codex/agents/consilium-*.toml`
- `$repo_root/generated/codex/config/codex-config-snippet.toml`
- `$repo_root/runtimes/scripts/generate.py`
- `$repo_root/runtimes/scripts/check-runtime-parity.py`
- `$repo_root/runtimes/scripts/install-claude-agents.sh`
- `$repo_root/runtimes/scripts/install-codex.sh`
- `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/ref-preflight/`
- `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/ref-postinstall/`

**Modify**

- `$repo_root/claude/CLAUDE.md`
- `$repo_root/source/skills/claude/**`
- `$repo_root/claude/skills/**`
- `$repo_root/claude/scripts/check-codex-drift.py`
- `$repo_root/claude/scripts/check-tribune-staleness.py`
- `$repo_root/codex/scripts/generate_agents.py`
- `$repo_root/codex/scripts/install-codex-agents.sh`
- `$repo_root/codex/scripts/install-codex.sh`
- `$repo_root/codex/scripts/install-codex-skills.sh`
- `$repo_root/codex/scripts/sync-codex-config.py`
- `$repo_root/codex/scripts/check-shared-docs-adoption.py`
- `$repo_root/codex/scripts/check-tribune-shared-docs.py`
- `$repo_root/codex/README.md`
- `$repo_root/codex/RANK-MAPPING-AUDIT.md`
- `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/STATUS.md`

**Install Or Prune After Verification**

- `/Users/milovan/.claude/agents/consilium-*.md`
- `/Users/milovan/.codex/agents/consilium-*.toml`
- `/Users/milovan/.codex/config.toml`
- `/Users/milovan/.claude/agents/consilium-soldier.md`
- `/Users/milovan/.claude/agents/consilium-scout.md`
- `/Users/milovan/.claude/agents/consilium-provocator-overconfidence.md`
- `/Users/milovan/.claude/agents/consilium-provocator-assumption.md`
- `/Users/milovan/.claude/agents/consilium-provocator-failure-mode.md`
- `/Users/milovan/.claude/agents/consilium-provocator-edge-case.md`
- `/Users/milovan/.claude/agents/consilium-provocator-negative-claim.md`

## Task 0: Raise The Dedicated Worktree

> **Confidence: High** - implements [spec section 8 - Direct Cutover Rules](spec.md#8-direct-cutover-rules). Verifiers found the original plan contradicted itself by requiring a worktree while hard-coding the dirty main checkout.

**Files:**

- Create: `/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification`
- Read: `/Users/milovan/projects/Consilium/docs/cases/2026-04-29-consilium-runtime-unification/` as the source case artifact copied into the worktree

- [ ] **Step 1: Create or reuse the feature worktree**

Run:

```bash
base_repo="/Users/milovan/projects/Consilium"
repo_root="${CONSILIUM_RUNTIME_REPO:-$base_repo/.worktrees/feature/consilium-runtime-unification}"
if [ ! -d "$repo_root/.git" ] && [ ! -f "$repo_root/.git" ]; then
  git -C "$base_repo" worktree add -b feature/consilium-runtime-unification "$repo_root" main
fi
git -C "$repo_root" status --short
```

Expected: worktree exists at `$repo_root`. If `git status --short` reports anything except the copied runtime-unification case files after Step 2, halt and report the dirty worktree.

- [ ] **Step 2: Copy the verified case artifacts into the worktree**

Run:

```bash
base_repo="/Users/milovan/projects/Consilium"
repo_root="${CONSILIUM_RUNTIME_REPO:-$base_repo/.worktrees/feature/consilium-runtime-unification}"
case_rel="docs/cases/2026-04-29-consilium-runtime-unification"
mkdir -p "$repo_root/$case_rel"
rsync -a "$base_repo/$case_rel/" "$repo_root/$case_rel/"
```

Expected: `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/spec.md`, `plan.md`, and `STATUS.md` exist.

- [ ] **Step 3: Export the execution root for every later command**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
printf 'repo_root=%s\ncase_dir=%s\n' "$repo_root" "$case_dir" > "$case_dir/ref-execution-root.txt"
```

Expected: `$case_dir/ref-execution-root.txt` records the worktree and case directory.

## Task 1: Preflight Inventory And Backup

> **Confidence: High** - implements [spec section 8 - Direct Cutover Rules](spec.md#8-direct-cutover-rules), [spec section 10 - Affected Surfaces](spec.md#10-affected-surfaces), and [spec section 11 - Verification Requirements](spec.md#11-verification-requirements). Live checks confirmed Claude settings enable `consilium@consilium-local`, installed plugin metadata points at a missing cache path, and `/Users/milovan/.claude/plugins/consilium` currently points at a missing target instead of the repo plugin descriptor.

**Files:**

- Create: `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/ref-preflight/`
- Read: `/Users/milovan/.claude/settings.json`
- Read: `/Users/milovan/.claude/plugins/installed_plugins.json`
- Read: `/Users/milovan/.claude/plugins/consilium`
- Read: `/Users/milovan/.claude/plugins/cache`
- Read: `/Users/milovan/.claude/agents`
- Read: `/Users/milovan/.codex/agents`
- Read: `/Users/milovan/.codex/config.toml`

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

- [ ] **Step 2: Create preflight evidence and backup directories**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
mkdir -p "$case_dir/ref-preflight/claude-agents" "$case_dir/ref-preflight/codex-agents" "$case_dir/ref-preflight/config" "$case_dir/ref-postinstall"
```

Expected: all four directories exist under the case directory.

- [ ] **Step 3: Record worktree status before edits**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
cd "$repo_root"
git status --short > "$case_dir/ref-preflight/git-status-before.txt"
git branch --show-current > "$case_dir/ref-preflight/git-branch-before.txt"
git rev-parse HEAD > "$case_dir/ref-preflight/git-head-before.txt"
```

Expected: three evidence files are created.

- [ ] **Step 4: Backup installed runtime files**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
cp -p /Users/milovan/.claude/agents/consilium-*.md "$case_dir/ref-preflight/claude-agents/"
cp -p /Users/milovan/.codex/agents/consilium-*.toml "$case_dir/ref-preflight/codex-agents/"
cp -p /Users/milovan/.codex/config.toml "$case_dir/ref-preflight/config/codex-config.toml"
cp -p /Users/milovan/.claude/settings.json "$case_dir/ref-preflight/config/claude-settings.json"
cp -p /Users/milovan/.claude/plugins/installed_plugins.json "$case_dir/ref-preflight/config/claude-installed-plugins.json"
cp -p /Users/milovan/.claude/plugins/known_marketplaces.json "$case_dir/ref-preflight/config/claude-known-marketplaces.json"
readlink /Users/milovan/.claude/plugins/consilium > "$case_dir/ref-preflight/config/claude-consilium-plugin-symlink.txt" 2>/dev/null || true
find /Users/milovan/.claude/plugins/cache -maxdepth 3 -type d -name 'consilium*' -print > "$case_dir/ref-preflight/config/claude-consilium-cache-paths.txt" 2>/dev/null || true
mkdir -p "$case_dir/ref-preflight/codex-skills"
codex_tribune_skill="/Users/milovan/.agents/skills/tribune"
if [ -L "$codex_tribune_skill" ]; then
  readlink "$codex_tribune_skill" > "$case_dir/ref-preflight/codex-skills/tribune-symlink.txt"
elif [ -e "$codex_tribune_skill" ]; then
  rsync -a "$codex_tribune_skill/" "$case_dir/ref-preflight/codex-skills/tribune/"
fi
ls -la /Users/milovan/.agents/skills > "$case_dir/ref-preflight/codex-skills/skills-ls.txt" 2>&1 || true
```

Expected: backup files and plugin path records exist before any install, symlink repair, or prune step.

- [ ] **Step 5: Record plugin path truth**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
jq '.enabledPlugins | with_entries(select(.key | test("consilium|medusa|brave|typescript")))' /Users/milovan/.claude/settings.json > "$case_dir/ref-preflight/claude-enabled-plugins.json"
jq '.plugins | to_entries[] | select(.key | test("consilium|medusa"))' /Users/milovan/.claude/plugins/installed_plugins.json > "$case_dir/ref-preflight/claude-installed-plugin-paths.json"
ls -la /Users/milovan/.claude/plugins /Users/milovan/.claude/plugins/cache /Users/milovan/.claude/plugins/consilium > "$case_dir/ref-preflight/claude-plugin-ls.txt" 2>&1 || true
```

Expected: evidence records the actual symlink target and that installed metadata may still name `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0`.

- [ ] **Step 6: Repair and verify the Claude Consilium plugin package root**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
plugin_link="/Users/milovan/.claude/plugins/consilium"
expected_source="$repo_root/claude"
actual_target="$(readlink "$plugin_link" 2>/dev/null || true)"
printf 'before=%s\nexpected=%s\n' "$actual_target" "$expected_source" > "$case_dir/ref-preflight/config/claude-consilium-plugin-repair.txt"
[ -f "$expected_source/.claude-plugin/plugin.json" ] || { echo "Missing expected Claude plugin descriptor at $expected_source/.claude-plugin/plugin.json"; exit 1; }
[ -d "$expected_source/skills" ] || { echo "Missing expected Claude plugin skills dir at $expected_source/skills"; exit 1; }
if [ "$actual_target" != "$expected_source" ] || [ ! -e "$plugin_link" ]; then
  ln -sfn "$expected_source" "$plugin_link"
fi
readlink "$plugin_link" >> "$case_dir/ref-preflight/config/claude-consilium-plugin-repair.txt"
[ -f "$plugin_link/.claude-plugin/plugin.json" ] || { echo "Claude plugin symlink repair failed"; exit 1; }
[ -d "$plugin_link/skills" ] || { echo "Claude plugin symlink points at descriptor but not package root"; exit 1; }
tmp_settings="$(mktemp)"
jq --arg path "$expected_source" '.extraKnownMarketplaces["consilium-local"].source.path = $path' /Users/milovan/.claude/settings.json > "$tmp_settings"
mv "$tmp_settings" /Users/milovan/.claude/settings.json
tmp_marketplaces="$(mktemp)"
jq --arg path "$expected_source" '."consilium-local".source.path = $path | ."consilium-local".installLocation = $path' /Users/milovan/.claude/plugins/known_marketplaces.json > "$tmp_marketplaces"
mv "$tmp_marketplaces" /Users/milovan/.claude/plugins/known_marketplaces.json
jq '.extraKnownMarketplaces["consilium-local"]' /Users/milovan/.claude/settings.json >> "$case_dir/ref-preflight/config/claude-consilium-plugin-repair.txt"
jq '."consilium-local"' /Users/milovan/.claude/plugins/known_marketplaces.json >> "$case_dir/ref-preflight/config/claude-consilium-plugin-repair.txt"
```

Expected: `/Users/milovan/.claude/plugins/consilium` resolves to the worktree `claude/` package root, `.claude-plugin/plugin.json` exists under that root, `skills/` exists under that root, and both Claude settings and known marketplace metadata point at the same package root before any Claude runtime claim.

- [ ] **Step 7: Record installed runtime agent lists**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
find /Users/milovan/.claude/agents -maxdepth 1 -type f -name 'consilium-*.md' -exec basename {} \; | sort > "$case_dir/ref-preflight/installed-claude-agents.txt"
find /Users/milovan/.codex/agents -maxdepth 1 -type f -name 'consilium-*.toml' -exec basename {} \; | sort > "$case_dir/ref-preflight/installed-codex-agents.txt"
```

Expected: Claude list includes old `consilium-soldier.md`, `consilium-scout.md`, and five lane-specific Provocator agents. Codex list includes the current generated canonical Codex set.

## Task 2: Create Neutral Source Tree

> **Confidence: High** - implements [spec section 4 - Source Layout Contract](spec.md#4-source-layout-contract) and [spec section 5 - Manifest Contract](spec.md#5-manifest-contract). Live Codex source already contains the richest manifest-driven source tree, so this task promotes that tree rather than rebuilding from memory.

**Files:**

- Create: `$repo_root/source/`
- Create: `$repo_root/source/roles/speculator-primus.md`
- Create: `$repo_root/source/skills/claude/`
- Modify: `$repo_root/source/manifest.json`

- [ ] **Step 1: Copy current Codex source into neutral source**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
mkdir -p source
rsync -a --delete codex/source/ source/
```

Expected: `source/manifest.json`, `source/doctrine/`, `source/protocols/`, and `source/roles/` exist.

- [ ] **Step 2: Move Claude skill source into neutral source**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
mkdir -p source/skills/claude
rsync -a --delete claude/skills/ source/skills/claude/
```

Expected: `source/skills/claude/consul/SKILL.md`, `source/skills/claude/edicts/SKILL.md`, `source/skills/claude/legion/SKILL.md`, `source/skills/claude/march/SKILL.md`, and `source/skills/claude/tribune/SKILL.md` exist. From this step forward, edits to Claude skill bodies happen in `source/skills/claude`, not directly in `claude/skills`.

- [ ] **Step 3: Add `source/roles/speculator-primus.md`**

Create `$repo_root/source/roles/speculator-primus.md` with this content:

```markdown
# Consilium Speculator Primus

Rank: Speculator Primus - source and runtime reconnaissance

I verify Consilium source, runtime adapters, plugin/cache/config surfaces, unknown-lane triage, and cross-surface facts. I return concise evidence with file paths and line numbers. I do not edit files.

I replace the old generic Scout workflow name. I am read-only unless a later approved plan assigns implementation to a Centurio.

## Operating Law

- Answer the question asked.
- Prefer exact file and line evidence over broad summaries.
- Use `rg` or `fd` for text and file discovery unless a semantic tool is clearly better for the target.
- Inspect installed runtime truth when the question is about active Claude or Codex behavior.
- Distinguish repo source, generated output, installed runtime files, plugin registration, and cache paths.
- Report stale references plainly instead of treating missing paths as clean.
- Stop at reconnaissance. Do not patch, regenerate, install, prune, or commit.

## Output

Return:

- verdict
- evidence
- uncertainty
- next check if one is required
```

Expected: the role exists and contains no `consilium-scout` dispatch instruction.

- [ ] **Step 4: Add `consilium-speculator-primus` to `source/manifest.json`**

Insert this agent after `consilium-speculator-back`:

```json
{
  "name": "consilium-speculator-primus",
  "description": "Source and runtime tracer for Consilium. Confirms exact source, generated output, installed runtime, plugin/cache/config, and unknown-lane facts with tight citations.",
  "nickname_candidates": ["speculator primus", "primus speculator", "marcus speculator"],
  "model": "gpt-5.5",
  "reasoning_effort": "xhigh",
  "sandbox_mode": "read-only",
  "role_file": "roles/speculator-primus.md",
  "include_files": [
    "doctrine/common.md",
    "doctrine/retrieval-law.md",
    "doctrine/orchestration-law.md"
  ]
}
```

Expected: `jq -r '.agents[].name' source/manifest.json | grep -x 'consilium-speculator-primus'` exits 0.

- [ ] **Step 5: Add runtime surface metadata without breaking Codex fields**

For every agent in `source/manifest.json`, keep the existing top-level Codex fields and add a `runtime_surfaces` object:

```json
"runtime_surfaces": {
  "codex": {
    "surface": "agent",
    "enabled": true
  },
  "claude": {
    "surface": "agent",
    "enabled": true,
    "model": "opus",
    "tools_profile": "read"
  }
}
```

Use these Claude overrides:

- `consilium-consul`: `"surface": "skill"`, `"enabled": true`, `"skill_names": ["consul", "edicts"]`
- `consilium-legatus`: `"surface": "skill"`, `"enabled": true`, `"skill_names": ["legion", "march"]`
- `consilium-centurio-front`, `consilium-centurio-back`, `consilium-centurio-primus`: `"tools_profile": "write"`
- `consilium-provocator`, `consilium-tribunus`, `consilium-custos`, `consilium-speculator-front`, `consilium-speculator-back`, `consilium-speculator-primus`: `"tools_profile": "read_bash"`
- `consilium-tribunus`: add `"mcp_servers": ["serena", "medusa", "consilium-principales"]`
- all other Claude dispatchable agents: `"tools_profile": "read"`

Expected: this command exits 0:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
jq -e '.agents[] | select(.runtime_surfaces.codex.enabled != true or .runtime_surfaces.claude.enabled != true) | empty' source/manifest.json
```

## Task 3: Build The Shared Runtime Generator

> **Confidence: Medium** - implements [spec section 6 - Runtime Output Contracts](spec.md#6-runtime-output-contracts). The Codex generator is live and simple, but Claude agent generation is new in this repo, so the plan keeps the generator explicit and small.

**Files:**

- Create: `$repo_root/generated/`
- Create: `$repo_root/runtimes/scripts/generate.py`
- Modify: `$repo_root/codex/scripts/generate_agents.py`

- [ ] **Step 1: Create generated output directories**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
mkdir -p generated/claude/agents generated/claude/skills generated/codex/agents generated/codex/config runtimes/scripts
```

Expected: all generated and runtime script directories exist.

- [ ] **Step 2: Create `runtimes/scripts/generate.py`**

Create `$repo_root/runtimes/scripts/generate.py` with these responsibilities:

- read `$repo_root/source/manifest.json`
- copy `source/skills/claude` to `generated/claude/skills`
- compose each role from `source/<role_file>` plus each `source/<include_files>` entry
- write Codex TOML agents to `generated/codex/agents`
- write Codex config snippet to `generated/codex/config/codex-config-snippet.toml`
- write Claude dispatchable Markdown agents to `generated/claude/agents`
- copy `source` to `codex/source` as a generated compatibility copy
- copy `generated/codex/agents` to `codex/agents`
- copy `generated/codex/config/codex-config-snippet.toml` to `codex/config/codex-config-snippet.toml`
- copy `generated/claude/skills` to `claude/skills` as the Claude plugin runtime copy

The Claude frontmatter renderer must use these tool profiles:

```python
CLAUDE_TOOL_PROFILES = {
    "read": [
        "Read",
        "Grep",
        "Glob",
        "Skill",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__medusa__ask_medusa_question",
    ],
    "read_bash": [
        "Read",
        "Grep",
        "Glob",
        "Skill",
        "Bash",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__medusa__ask_medusa_question",
    ],
    "write": [
        "Read",
        "Write",
        "Edit",
        "Grep",
        "Glob",
        "Bash",
        "WebFetch",
        "Skill",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__replace_symbol_body",
        "mcp__serena__insert_after_symbol",
        "mcp__serena__insert_before_symbol",
        "mcp__serena__rename_symbol",
        "mcp__serena__safe_delete_symbol",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__serena__activate_project",
        "mcp__medusa__ask_medusa_question",
    ],
}
```

For Claude agents, skip manifest entries whose Claude surface is `skill`. Render every other Claude-enabled entry as:

```markdown
---
name: <agent name>
description: <description>
tools: <comma-separated tools>
mcpServers:
  - <server>
model: opus
---
<composed role and include body>
```

Default Claude `mcpServers` to `["serena", "medusa"]` unless an agent declares `mcp_servers`.

Expected: `python3 runtimes/scripts/generate.py` prints counts for Codex agents, Claude agents, Claude skills, and compatibility files. `codex/source` must byte-match `source` after generation.

- [ ] **Step 3: Replace `codex/scripts/generate_agents.py` with a wrapper**

Change `$repo_root/codex/scripts/generate_agents.py` so it imports and runs the shared generator from `$repo_root/runtimes/scripts/generate.py`.

The wrapper must keep this command working:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 codex/scripts/generate_agents.py
```

Expected: the command writes `generated/codex/agents`, `generated/claude/agents`, `generated/claude/skills`, `codex/source`, `codex/agents`, `codex/config`, and `claude/skills`.

## Task 4: Update Codex Adapter Scripts

> **Confidence: High** - implements [spec section 6.2 - Codex](spec.md#62-codex) and [spec section 11 - Verification Requirements](spec.md#11-verification-requirements). Live Codex scripts currently read `codex/source`, `codex/agents`, and `codex/config`, so this task points them at neutral source and generated output while preserving compatibility paths.

**Files:**

- Modify: `$repo_root/codex/scripts/install-codex-agents.sh`
- Modify: `$repo_root/codex/scripts/install-codex.sh`
- Modify: `$repo_root/codex/scripts/install-codex-skills.sh`
- Modify: `$repo_root/codex/scripts/sync-codex-config.py`
- Modify: `$repo_root/codex/scripts/check-shared-docs-adoption.py`
- Modify: `$repo_root/codex/scripts/check-tribune-shared-docs.py`

- [ ] **Step 1: Update `install-codex-agents.sh` to install from generated output**

Set:

```bash
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
src_dir="$repo_root/generated/codex/agents"
```

Update script calls to use `script_dir`, not `repo_root/scripts`:

```bash
python3 "$script_dir/generate_agents.py"
python3 "$script_dir/check-shared-docs-adoption.py"
python3 "$script_dir/check-shared-docs-adoption.py" --installed
```

Keep the existing TOML validation block, installed parity check, and `--prune` behavior.

Expected: `bash codex/scripts/install-codex-agents.sh` installs from `generated/codex/agents`.

- [ ] **Step 2: Make Codex config sync default in `install-codex.sh`**

Set `sync_config=1` by default. Keep `--sync-config` accepted as a no-op compatibility flag. Add a `--skip-config-sync` flag only for emergency rollback testing, and make the normal completion message say config was synced.

Expected: `bash codex/scripts/install-codex.sh --prune-agents` syncs `/Users/milovan/.codex/config.toml` without requiring a second flag.

- [ ] **Step 3: Point `sync-codex-config.py` at generated config**

Set:

```python
ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path.home() / ".codex" / "config.toml"
SNIPPET = ROOT / "generated" / "codex" / "config" / "codex-config-snippet.toml"
```

Keep the existing replacement behavior for `project_doc_fallback_filenames` and `[agents.consilium-*]` blocks.

Expected: `python3 codex/scripts/sync-codex-config.py` reads the generated snippet.

- [ ] **Step 4: Update `check-shared-docs-adoption.py` roots**

Set:

```python
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "source"
COMMON = SOURCE / "doctrine" / "common.md"
KNOWN_GAPS = SOURCE / "doctrine" / "divinipress-known-gaps.md"
GENERATED_CODEX_AGENTS = ROOT / "generated" / "codex" / "agents"
```

Set repo scan targets to include:

```python
REPO_SCAN_TARGETS = [
    ROOT / "source",
    ROOT / "generated" / "codex",
    ROOT / "generated" / "claude",
    ROOT / "runtimes",
    ROOT / "codex" / "scripts",
    ROOT / "codex" / "README.md",
    ROOT / "codex" / "evals" / "README.md",
]
```

Update generated agent discovery to use `GENERATED_CODEX_AGENTS.glob("consilium-*.toml")`.

Expected: `python3 codex/scripts/check-shared-docs-adoption.py` passes after generation.

- [ ] **Step 5: Update Codex skill install dependency checks**

Update `$repo_root/codex/scripts/check-tribune-shared-docs.py` so any source reads point at root `source/` instead of treating `codex/source` as canonical source. Keep `codex/source` only as a generated compatibility copy and add a check that it byte-matches root `source/`.

Update `$repo_root/codex/scripts/install-codex-skills.sh` only if path assumptions need to change after `check-tribune-shared-docs.py` moves to root `source/`.

Expected:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 codex/scripts/check-tribune-shared-docs.py
bash codex/scripts/install-codex-skills.sh
```

Both commands exit 0 without reading `codex/source` as canonical source.

## Task 5: Update Claude Runtime Adapters

> **Confidence: Medium** - implements [spec section 6.1 - Claude](spec.md#61-claude), [spec section 7 - Workflow Language Contract](spec.md#7-workflow-language-contract), and [spec section 10 - Affected Surfaces](spec.md#10-affected-surfaces). Claude skills are richer than current Codex role source, so this task edits canonical skill bodies under `source/skills/claude` and lets generation sync runtime copies back into `claude/skills`.

**Files:**

- Modify: `$repo_root/claude/CLAUDE.md`
- Modify: `$repo_root/source/skills/claude/**/*.md`
- Generate: `$repo_root/generated/claude/skills/**/*.md`
- Generate: `$repo_root/claude/skills/**/*.md`

- [ ] **Step 1: Rewrite `claude/CLAUDE.md` architecture notes**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
```

Then edit `claude/CLAUDE.md` directly as the Claude plugin architecture note. It is documentation for the plugin, not a generated skill body. Replace the current architecture section with these facts:

- canonical prompt source is `$repo_root/source`
- generated runtime outputs are under `$repo_root/generated`
- Claude dispatchable agents install to `/Users/milovan/.claude/agents`
- Claude Consul and Legatus remain main-session skills
- Codex may expose Consul and Legatus as configured agents
- `consilium-soldier`, `consilium-scout`, `Medicus`, and five lane-specific Provocator agents are retired active workflow names
- `$CONSILIUM_DOCS` remains `/Users/milovan/projects/Consilium/docs` and is not replaced by prompt source

Expected: after generation, `rg -n "consilium-soldier|consilium-scout|Medicus|five Provocator|soldier|scout" claude/CLAUDE.md` returns only retired-name notes.

- [ ] **Step 2: Replace Claude implementation owner language**

In `source/skills/claude/legion/SKILL.md`, `source/skills/claude/march/SKILL.md`, and `source/skills/claude/legion/implementer-prompt.md`, replace active implementation dispatch language:

- `consilium-soldier` becomes `consilium-centurio-primus` unless the task lane is explicitly frontend or backend
- generic Soldier wording becomes Centurio wording
- “ask rather than guess” remains as the ambiguity boundary, but local reversible implementation choices use the Centurio rule from the spec

Expected after generation: `rg -n "consilium-soldier|soldier" claude/skills/legion claude/skills/march` returns only retired-name notes or historical examples clearly marked as retired.

- [ ] **Step 3: Replace Claude reconnaissance language**

In `source/skills/claude/consul/SKILL.md`, `source/skills/claude/edicts/SKILL.md`, and `source/skills/claude/tribune/SKILL.md`, replace active reconnaissance dispatch language:

- `consilium-scout` becomes `consilium-speculator-primus` for Consilium source/runtime/plugin/cache/config/unknown-lane reconnaissance
- frontend code tracing uses `consilium-speculator-front`
- backend code tracing uses `consilium-speculator-back`
- generic Scout wording becomes Speculator wording

Expected after generation: `rg -n "consilium-scout|scout" claude/skills/consul claude/skills/edicts claude/skills/tribune` returns only retired-name notes or historical examples clearly marked as retired.

- [ ] **Step 4: Retire Medicus wording in Tribune surfaces**

In `claude/CLAUDE.md`, `source/skills/claude/tribune/SKILL.md`, `source/skills/claude/references/personas/medicus.md`, and verification templates under `source/skills/claude/references/verification`, replace active `Medicus` wording with `Tribunus diagnosis stance` or `/tribune`. If `medicus.md` remains for historical reference, its first heading must say it is retired and not an active rank.

Expected after generation: `rg -n "Medicus" claude/CLAUDE.md claude/skills/tribune claude/skills/references/verification claude/skills/references/personas` returns only retired-name notes.

- [ ] **Step 5: Remove active retired vocabulary from all Claude skill source**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
cd "$repo_root"
rg -n "consilium-soldier|consilium-scout|Medicus|consilium-provocator-(overconfidence|assumption|failure-mode|edge-case|negative-claim)" source/skills/claude > "$case_dir/ref-preflight/source-skill-retired-name-search.txt" || true
```

Expected: any hits are retired-name notes, historical notes, or negative checks. Active dispatch instructions are blockers.

- [ ] **Step 6: Generate Claude skill runtime copies**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/generate.py
```

Expected: `generated/claude/skills/consul/SKILL.md`, `generated/claude/skills/edicts/SKILL.md`, `generated/claude/skills/legion/SKILL.md`, `generated/claude/skills/march/SKILL.md`, `generated/claude/skills/tribune/SKILL.md`, and matching `claude/skills/*` runtime copies exist.

## Task 6: Update Claude Checks And Plugin Path Validation

> **Confidence: High** - implements [spec section 6.1 - Claude](spec.md#61-claude) and [spec section 11 - Verification Requirements](spec.md#11-verification-requirements). Verifier evidence showed the current Tribune staleness check silently skips missing cache roots, so this task makes missing expected roots visible.

**Files:**

- Modify: `$repo_root/claude/scripts/check-codex-drift.py`
- Modify: `$repo_root/claude/scripts/check-tribune-staleness.py`
- Create: `$repo_root/runtimes/scripts/check-runtime-parity.py`

- [ ] **Step 1: Create `runtimes/scripts/check-runtime-parity.py`**

Create a Python checker that performs these checks:

- manifest names in `source/manifest.json` are unique
- `source/manifest.json` contains `consilium-speculator-primus`
- `generated/claude/agents` contains every Claude-enabled dispatchable agent and excludes Claude skill surfaces
- `generated/codex/agents` contains every Codex-enabled agent
- `generated/claude/skills` byte-matches `source/skills/claude`
- `claude/skills` byte-matches `generated/claude/skills`
- `codex/source` byte-matches root `source`
- `codex/agents` byte-matches `generated/codex/agents`
- `codex/config/codex-config-snippet.toml` byte-matches `generated/codex/config/codex-config-snippet.toml`
- installed Claude agents byte-match generated Claude agents for every generated Claude agent
- installed Codex agents byte-match generated Codex agents for every generated Codex agent
- `/Users/milovan/.codex/config.toml` contains a block for every generated Codex agent
- installed Claude user-scope agents do not contain active retired names after prune
- `/Users/milovan/.claude/plugins/consilium` resolves to the intended plugin descriptor path and is not a broken symlink

The checker must support:

```bash
python3 runtimes/scripts/check-runtime-parity.py
python3 runtimes/scripts/check-runtime-parity.py --installed
```

Expected: without `--installed`, it checks repo source/generated compatibility. With `--installed`, it also checks installed runtime files and config.

- [ ] **Step 2: Convert `check-codex-drift.py` into a runtime parity wrapper**

Update `$repo_root/claude/scripts/check-codex-drift.py` so it computes the repo root from its own file path, prints a retirement message for the old copy-pasted Codex drift model, and delegates to:

```bash
python3 <computed-repo-root>/runtimes/scripts/check-runtime-parity.py --installed
```

Expected: `python3 claude/scripts/check-codex-drift.py` no longer references `docs/codex.md` or the old Soldier/Scout agent list.

- [ ] **Step 3: Make `check-tribune-staleness.py` fail on missing expected plugin roots**

Change the Tribune staleness script so it resolves the Consilium plugin paths from:

- `/Users/milovan/.claude/plugins/consilium`
- `/Users/milovan/.claude/plugins/installed_plugins.json`

If installed plugin metadata names a Consilium cache path that does not exist, report it as `MISSING_CONSILIUM_PLUGIN_CACHE` unless `/Users/milovan/.claude/plugins/consilium` points to the repo plugin path and the script records that repo path as the active source.

Expected: the script does not silently skip missing cache paths.

## Task 7: Update Codex Documentation And Source References

> **Confidence: High** - implements [spec section 7 - Workflow Language Contract](spec.md#7-workflow-language-contract), [spec section 10 - Affected Surfaces](spec.md#10-affected-surfaces), and [spec section 12 - Success Criteria](spec.md#12-success-criteria).

**Files:**

- Modify: `$repo_root/source/roles/*`
- Modify: `$repo_root/source/protocols/*`
- Modify: `$repo_root/source/skills/claude/**/*`
- Modify: `$repo_root/docs/doctrine/**/*`
- Modify: `$repo_root/docs/CONVENTIONS.md`
- Modify: `$repo_root/codex/README.md`
- Modify: `$repo_root/codex/RANK-MAPPING-AUDIT.md`

- [ ] **Step 1: Update neutral source references**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
rg -n "consilium-soldier|consilium-scout|Medicus|soldier|scout" source
```

For every active workflow reference:

- map `consilium-soldier` to `consilium-centurio-primus`, `consilium-centurio-front`, or `consilium-centurio-back`
- map `consilium-scout` to `consilium-speculator-primus`, `consilium-speculator-front`, or `consilium-speculator-back`
- map `Medicus` to `Tribunus diagnosis stance`
- keep retired-name mentions only inside explicit retired-name notes or negative checks

Expected: `rg -n "consilium-soldier|consilium-scout|Medicus" source` returns only retired-name notes or negative checks.

- [ ] **Step 2: Update shared docs doctrine references**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
rg -n "consilium-soldier|consilium-scout|Medicus|soldier|scout" docs/doctrine docs/CONVENTIONS.md
```

For every active runtime doctrine reference:

- map `Medicus` diagnosis language to `Tribunus diagnosis stance`
- map `Soldier` execution language to `Centurio`
- map `Scout` reconnaissance language to `Speculator`
- keep retired-name mentions only inside explicit retired-name or migration notes

Expected: `rg -n "consilium-soldier|consilium-scout|Medicus" docs/doctrine docs/CONVENTIONS.md` returns only retired-name notes or negative checks.

- [ ] **Step 3: Update Codex docs**

Update `codex/README.md` and `codex/RANK-MAPPING-AUDIT.md` to state:

- canonical source is root `source/`
- generated Codex output is root `generated/codex`
- `codex/source` is a generated compatibility copy of root `source/`, not canonical source
- `codex/agents` and `codex/config` are compatibility copies generated from root `generated`
- fresh Codex sessions are required after install

Expected: `rg -n "codex/source.*canonical|source kingdom|consilium-soldier|consilium-scout" codex/README.md codex/RANK-MAPPING-AUDIT.md` returns only migration notes or negative checks.

- [ ] **Step 4: Verify `codex/source` is compatibility only**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
diff -qr source codex/source
```

Expected: command exits 0. Any drift means `codex/source` has become a second source tree again.

## Task 8: Generate, Validate, Install, Then Prune

> **Confidence: High** - implements [spec section 8 - Direct Cutover Rules](spec.md#8-direct-cutover-rules) and [spec section 11 - Verification Requirements](spec.md#11-verification-requirements). The task order deliberately installs and verifies before pruning retired Claude agents.

**Files:**

- Create: `$repo_root/generated/claude/agents/consilium-*.md`
- Create: `$repo_root/generated/codex/agents/consilium-*.toml`
- Modify: `/Users/milovan/.claude/agents/consilium-*.md`
- Modify: `/Users/milovan/.codex/agents/consilium-*.toml`
- Modify: `/Users/milovan/.codex/config.toml`

- [ ] **Step 1: Generate all runtime outputs**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/generate.py
```

Expected: output includes generated Codex agent count, generated Claude agent count, and compatibility copy count.

- [ ] **Step 2: Validate repo-generated parity**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/check-runtime-parity.py
python3 codex/scripts/check-shared-docs-adoption.py
```

Expected: both commands exit 0.

- [ ] **Step 3: Install Claude generated agents without pruning**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
mkdir -p /Users/milovan/.claude/agents
for src in generated/claude/agents/consilium-*.md; do
  install -m 0644 "$src" "/Users/milovan/.claude/agents/$(basename "$src")"
done
```

Expected: every generated Claude dispatchable agent exists under `/Users/milovan/.claude/agents`.

- [ ] **Step 4: Install Codex generated agents and sync config**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
bash codex/scripts/install-codex.sh --prune-agents
```

Expected: Codex agents install to `/Users/milovan/.codex/agents`, stale Codex agent TOMLs are pruned, and `/Users/milovan/.codex/config.toml` is synced.

- [ ] **Step 5: Verify installed parity before Claude prune**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-shared-docs-adoption.py --installed
```

Expected: both commands exit 0 or fail only because old Claude retired-name files still exist. Halt for any generated-to-installed byte mismatch, broken Claude plugin symlink, missing plugin descriptor, or missing config block.

- [ ] **Step 6: Fresh-session visibility smoke before prune**

Before deleting old Claude agents, prove the new canonical names are visible in fresh runtimes. If this smoke cannot be performed in the current environment, halt here and leave old Claude files in place.

Run this setup block before recording smoke results:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
mkdir -p "$case_dir/ref-postinstall"
smoke_file="$case_dir/ref-postinstall/runtime-visibility-smoke.md"
printf '# Runtime Visibility Smoke\n\n' > "$smoke_file"
printf 'Active Claude plugin source path: ' >> "$smoke_file"
jq -r '.extraKnownMarketplaces["consilium-local"].source.path' /Users/milovan/.claude/settings.json >> "$smoke_file"
```

Then fill `$smoke_file` with these required results:

```markdown
# Runtime Visibility Smoke

## Claude

- Fresh Claude session started: yes/no
- `/consul` resolves from the Consilium plugin: yes/no
- `/tribune` resolves from the Consilium plugin: yes/no
- active Claude plugin source path is `$repo_root/claude`: yes/no
- `consilium-centurio-primus` is visible as a user-scope agent: yes/no
- `consilium-speculator-primus` is visible as a user-scope agent: yes/no
- `consilium-soldier` is no longer needed for active dispatch: yes/no
- `consilium-scout` is no longer needed for active dispatch: yes/no

## Codex

- Fresh Codex thread started: yes/no
- `consilium-centurio-primus` is registered: yes/no
- `consilium-speculator-primus` is registered: yes/no
- `consilium-consul` is registered if Codex supports configured orchestration agents: yes/no
- `consilium-legatus` is registered if Codex supports configured orchestration agents: yes/no
```

After filling the file, run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
smoke_file="$case_dir/ref-postinstall/runtime-visibility-smoke.md"
[ -f "$smoke_file" ] || { echo "Missing runtime visibility smoke file"; exit 1; }
! grep -n 'yes/no' "$smoke_file"
! grep -n ': no' "$smoke_file"
grep -n 'Fresh Claude session started: yes$' "$smoke_file"
grep -n '/consul resolves from the Consilium plugin: yes$' "$smoke_file"
grep -n '/tribune resolves from the Consilium plugin: yes$' "$smoke_file"
grep -n 'active Claude plugin source path is .*: yes$' "$smoke_file"
grep -n 'consilium-centurio-primus` is visible as a user-scope agent: yes$' "$smoke_file"
grep -n 'consilium-speculator-primus` is visible as a user-scope agent: yes$' "$smoke_file"
grep -n 'consilium-soldier` is no longer needed for active dispatch: yes$' "$smoke_file"
grep -n 'consilium-scout` is no longer needed for active dispatch: yes$' "$smoke_file"
grep -n 'Fresh Codex thread started: yes$' "$smoke_file"
grep -n 'consilium-centurio-primus` is registered: yes$' "$smoke_file"
grep -n 'consilium-speculator-primus` is registered: yes$' "$smoke_file"
```

Expected: every required Claude and Codex canonical name is visible, the active Claude plugin source path is `$repo_root/claude`, and the smoke assertion block exits 0. If any required answer is `no`, stop and rollback or patch before pruning.

- [ ] **Step 7: Prune retired Claude user-scope agents**

Run:

```bash
rm -f /Users/milovan/.claude/agents/consilium-soldier.md
rm -f /Users/milovan/.claude/agents/consilium-scout.md
rm -f /Users/milovan/.claude/agents/consilium-provocator-overconfidence.md
rm -f /Users/milovan/.claude/agents/consilium-provocator-assumption.md
rm -f /Users/milovan/.claude/agents/consilium-provocator-failure-mode.md
rm -f /Users/milovan/.claude/agents/consilium-provocator-edge-case.md
rm -f /Users/milovan/.claude/agents/consilium-provocator-negative-claim.md
```

Expected: retired files are absent from `/Users/milovan/.claude/agents`.

- [ ] **Step 8: Verify installed parity after prune**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-shared-docs-adoption.py --installed
python3 claude/scripts/check-codex-drift.py
python3 claude/scripts/check-tribune-staleness.py
```

Expected: all commands exit 0.

## Task 9: Negative Search And Smoke Registration Evidence

> **Confidence: High** - implements [spec section 11 - Verification Requirements](spec.md#11-verification-requirements) and [spec section 12 - Success Criteria](spec.md#12-success-criteria).

**Files:**

- Create: `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/ref-postinstall/`
- Modify: `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/STATUS.md`

- [ ] **Step 1: Record post-install agent lists**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
find /Users/milovan/.claude/agents -maxdepth 1 -type f -name 'consilium-*.md' -exec basename {} \; | sort > "$case_dir/ref-postinstall/installed-claude-agents.txt"
find /Users/milovan/.codex/agents -maxdepth 1 -type f -name 'consilium-*.toml' -exec basename {} \; | sort > "$case_dir/ref-postinstall/installed-codex-agents.txt"
grep -n '^\[agents\.consilium-' /Users/milovan/.codex/config.toml > "$case_dir/ref-postinstall/codex-config-agent-blocks.txt"
```

Expected: Claude list contains no `consilium-soldier.md`, no `consilium-scout.md`, and no five lane-specific Provocator files. Codex config block list contains every generated Codex agent.

- [ ] **Step 2: Run active-workflow retired-name search**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
rg -n "consilium-soldier|consilium-scout|Medicus|consilium-provocator-(overconfidence|assumption|failure-mode|edge-case|negative-claim)" \
  source generated runtimes claude/CLAUDE.md claude/skills codex/README.md codex/RANK-MAPPING-AUDIT.md codex/source docs/doctrine docs/CONVENTIONS.md \
  > docs/cases/2026-04-29-consilium-runtime-unification/ref-postinstall/retired-name-search.txt || true
```

Expected: any hits are retired-name notes, historical/migration notes, or negative checks. Active dispatch instructions are blockers.

- [ ] **Step 3: Run generated metadata spot checks**

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
grep -n '^model: opus$' generated/claude/agents/consilium-censor.md
grep -n '^model = "gpt-5.5"$' generated/codex/agents/consilium-censor.toml
grep -n '^model_reasoning_effort = "xhigh"$' generated/codex/agents/consilium-censor.toml
grep -n '^\[agents\.consilium-speculator-primus\]$' generated/codex/config/codex-config-snippet.toml
grep -n '^\[agents\.consilium-speculator-primus\]$' /Users/milovan/.codex/config.toml
```

Expected: each command prints at least one matching line.

- [ ] **Step 4: Update STATUS**

Update `$repo_root/docs/cases/2026-04-29-consilium-runtime-unification/STATUS.md`:

```markdown
## Current state

Runtime unification cutover implemented and installed. Claude and Codex require fresh sessions before relying on new runtime definitions.

## What's next

- [x] Verify the spec against live Claude and Codex runtime surfaces.
- [x] Write the implementation edict.
- [x] Execute the cutover today before resuming risk-tier plan-format work.
- [ ] Resume risk-tier plan-format work against the unified vocabulary.
```

Expected: STATUS records the fresh-session requirement.

## Rollback Procedure

Use this only if installed runtime registration fails before a clean final verification.

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
case_dir="$repo_root/docs/cases/2026-04-29-consilium-runtime-unification"
rm -f /Users/milovan/.claude/agents/consilium-*.md
cp -p "$case_dir"/ref-preflight/claude-agents/consilium-*.md /Users/milovan/.claude/agents/
rm -f /Users/milovan/.codex/agents/consilium-*.toml
cp -p "$case_dir"/ref-preflight/codex-agents/consilium-*.toml /Users/milovan/.codex/agents/
cp -p "$case_dir/ref-preflight/config/codex-config.toml" /Users/milovan/.codex/config.toml
cp -p "$case_dir/ref-preflight/config/claude-settings.json" /Users/milovan/.claude/settings.json
cp -p "$case_dir/ref-preflight/config/claude-installed-plugins.json" /Users/milovan/.claude/plugins/installed_plugins.json
cp -p "$case_dir/ref-preflight/config/claude-known-marketplaces.json" /Users/milovan/.claude/plugins/known_marketplaces.json
old_target="$(cat "$case_dir/ref-preflight/config/claude-consilium-plugin-symlink.txt" 2>/dev/null || true)"
if [ -n "$old_target" ]; then
  ln -sfn "$old_target" /Users/milovan/.claude/plugins/consilium
fi
codex_tribune_skill="/Users/milovan/.agents/skills/tribune"
rm -rf "$codex_tribune_skill"
old_skill_target="$(cat "$case_dir/ref-preflight/codex-skills/tribune-symlink.txt" 2>/dev/null || true)"
if [ -n "$old_skill_target" ]; then
  mkdir -p /Users/milovan/.agents/skills
  ln -sfn "$old_skill_target" "$codex_tribune_skill"
elif [ -d "$case_dir/ref-preflight/codex-skills/tribune" ]; then
  mkdir -p "$codex_tribune_skill"
  rsync -a "$case_dir/ref-preflight/codex-skills/tribune/" "$codex_tribune_skill/"
fi
```

Expected: installed Claude agents, installed Codex agents, Codex config, Claude settings, Claude plugin metadata, Claude marketplace metadata, the Consilium plugin symlink, and the Codex Tribune skill install return to preflight state.

## Final Verification Commands

Run:

```bash
repo_root="${CONSILIUM_RUNTIME_REPO:-/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification}"
cd "$repo_root"
python3 runtimes/scripts/generate.py
python3 runtimes/scripts/check-runtime-parity.py
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-shared-docs-adoption.py
python3 codex/scripts/check-shared-docs-adoption.py --installed
python3 claude/scripts/check-codex-drift.py
python3 claude/scripts/check-tribune-staleness.py
smoke_file="docs/cases/2026-04-29-consilium-runtime-unification/ref-postinstall/runtime-visibility-smoke.md"
[ -f "$smoke_file" ] || { echo "Missing runtime visibility smoke file"; exit 1; }
! grep -n 'yes/no' "$smoke_file"
! grep -n ': no' "$smoke_file"
grep -n 'Fresh Claude session started: yes$' "$smoke_file"
grep -n '/consul resolves from the Consilium plugin: yes$' "$smoke_file"
grep -n '/tribune resolves from the Consilium plugin: yes$' "$smoke_file"
grep -n 'active Claude plugin source path is .*: yes$' "$smoke_file"
grep -n 'consilium-centurio-primus` is visible as a user-scope agent: yes$' "$smoke_file"
grep -n 'consilium-speculator-primus` is visible as a user-scope agent: yes$' "$smoke_file"
grep -n 'consilium-soldier` is no longer needed for active dispatch: yes$' "$smoke_file"
grep -n 'consilium-scout` is no longer needed for active dispatch: yes$' "$smoke_file"
grep -n 'Fresh Codex thread started: yes$' "$smoke_file"
grep -n 'consilium-centurio-primus` is registered: yes$' "$smoke_file"
grep -n 'consilium-speculator-primus` is registered: yes$' "$smoke_file"
python3 - <<'PY'
from pathlib import Path
import re
roots = [
    Path("docs/cases/2026-04-29-consilium-runtime-unification"),
    Path("source"),
    Path("generated"),
    Path("runtimes"),
    Path("claude/CLAUDE.md"),
    Path("claude/skills"),
    Path("claude/scripts"),
    Path("codex/scripts"),
    Path("codex/README.md"),
    Path("codex/RANK-MAPPING-AUDIT.md"),
    Path("docs/doctrine"),
    Path("docs/CONVENTIONS.md"),
]
patterns = [
    "T" + "BD",
    "TO" + "DO",
    "Implement " + "later",
    r"Draft\. Consul",
    re.escape("|" + "---"),
    r"\| ?-{3,} ?\|",
    r"[\u250c\u252c\u2500\u2502\u2514\u2518\u251c\u2524\u253c]",
]
hits = []
def iter_files(root):
    if root.is_file():
        yield root
    elif root.is_dir():
        yield from (p for p in root.rglob("*") if p.is_file())
for path in [p for root in roots for p in iter_files(root)]:
    text = path.read_text(errors="ignore")
    for line_no, line in enumerate(text.splitlines(), start=1):
        if any(re.search(pattern, line) for pattern in patterns):
            hits.append(f"{path}:{line_no}: {line}")
if hits:
    print("\n".join(hits))
    raise SystemExit(1)
print("Case hygiene check passed.")
PY
```

Expected:

- generation exits 0
- runtime parity exits 0
- installed runtime parity exits 0
- Codex shared-docs checks exit 0
- Claude runtime checks exit 0
- runtime visibility smoke file exists and has no required `no` answers
- hygiene check exits 0 with `Case hygiene check passed`; it exits 1 only when matches are printed

Final report must tell the Imperator:

- Claude needs a fresh Claude session before testing new skills or agents.
- Codex needs a fresh Codex thread before testing new agent registration.
- Risk-tier plan-format work can resume only after fresh-session smoke confirms canonical names are visible.
