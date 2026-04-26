# Consilium Docs Repo Piece 2 Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:march` to implement this plan task-by-task. Do not use `consilium:legion` inside the migration marker window because fresh verifier or soldier sessions must halt once Phase 0 guards are installed. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the guarded cutover to `/Users/milovan/projects/consilium-docs`: migrate doctrine and historical artifacts, repoint Claude-Consilium runtime surfaces, remove graphify runtime dependencies, sync the plugin cache, and close the marker window.

**Architecture:** Piece 2 is one uninterrupted cutover session. Preflight is read-only and backup-only; the first runtime edit creates `.migration-in-progress`, installs Phase 0 marker guards into source and plugin cache, and proves those guards halt before any path repoint, deletion, purge, or user-scope agent surgery. The final Phase 0 pass check happens only after the cutover is complete and the marker is removed.

**Tech Stack:** Bash, Ruby stdlib YAML validation, Python 3 for the existing drift/staleness scripts, Markdown edits, git. Repos: `/Users/milovan/projects/Consilium` and `/Users/milovan/projects/consilium-docs`. User-scope agents: `/Users/milovan/.claude/agents/consilium-*.md`. Plugin cache: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/`.

---

## Critical Constraints

> **Confidence: High** - derived from the verified split spec and live Piece 1 state.

1. Do not start unless `/Users/milovan/projects/consilium-docs` is clean at commit `50fce07b5a41f7e4f01930bca88ef3948d856264` or a deliberate later commit Milovan has approved.
2. Do not start unless `/Users/milovan/projects/Consilium` has no changes except the split spec and Piece 1/Piece 2 edicts.
3. The first runtime edit is marker-and-guard bootstrap. No path repoint, doctrine deletion, plugin-cache purge, or user-agent edit may happen before the negative Phase 0 simulation proves the marker halts.
4. Do not pause, commit-and-stop, hand off, invoke a new Consilium session, or dispatch runtime Consilium agents while `.migration-in-progress` exists.
5. If interrupted before guard verification completes, remove `/Users/milovan/projects/consilium-docs/.migration-in-progress` and revert only the guard-only edits before stopping.
6. Treat PyYAML as unavailable. Frontmatter validation uses Ruby stdlib `YAML`.
7. Preserve the Medicus scan constraints: contained only, 90-day mtime cap unless `/tribune --scan-all`, and no later case whose `Resolves:` field references the contained case slug.
8. Runtime graphify excision covers body prose, frontmatter tools, `mcpServers`, dispatch templates, operational notes, source docs, cache docs, and user-scope agents.
9. Historical migrated case artifacts may mention graphify only inside `/Users/milovan/projects/consilium-docs/cases/`. Runtime source surfaces, user-scope agents, and plugin cache must not.

## Preflight Gate - outside the marker window

> **Confidence: High** - all commands are abort-only or backup-only.

**Files:**
- Read: `/Users/milovan/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256`
- Create ignored backup dir: `/Users/milovan/projects/consilium-docs/preflight/piece2-backups/`

- [ ] **Step 1: Verify current repo states**

```bash
test ! -e /Users/milovan/projects/consilium-docs/.migration-in-progress
git -C /Users/milovan/projects/consilium-docs status --short
git -C /Users/milovan/projects/consilium-docs rev-parse HEAD
git -C /Users/milovan/projects/Consilium status --short
```

Expected:
- No marker.
- Empty `consilium-docs` status.
- `consilium-docs` HEAD is `50fce07b5a41f7e4f01930bca88ef3948d856264`, unless Milovan explicitly approved a newer Piece 1 commit.
- Consilium status is either empty because the split docs were already committed, or contains only:

```text
?? docs/consilium/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md
?? docs/consilium/plans/2026-04-24-consilium-docs-piece-2-cutover.md
?? docs/consilium/specs/2026-04-24-consilium-docs-split-design.md
```

Use this acceptance check:

```bash
consilium_status=$(git -C /Users/milovan/projects/Consilium status --short)
expected_untracked='?? docs/consilium/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md
?? docs/consilium/plans/2026-04-24-consilium-docs-piece-2-cutover.md
?? docs/consilium/specs/2026-04-24-consilium-docs-split-design.md'
if [ -n "$consilium_status" ] && [ "$consilium_status" != "$expected_untracked" ]; then
  printf '%s\n' "$consilium_status" >&2
  echo "unexpected Consilium status before Piece 2" >&2
  exit 1
fi
```

- [ ] **Step 2: Verify Piece 1 runtime baseline before intentional edits**

```bash
shasum -a 256 -c /Users/milovan/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256
```

Expected: every listed runtime surface reports `OK`. If any hash fails before Task 1, halt.

- [ ] **Step 3: Add backup ignore rule**

Append the backup ignore rule with this exact command; do not rewrite the whole `.gitignore`.

```bash
grep -q '^preflight/piece2-backups/$' /Users/milovan/projects/consilium-docs/.gitignore || \
  printf '%s\n' 'preflight/piece2-backups/' >> /Users/milovan/projects/consilium-docs/.gitignore
```

Verify:

```bash
rg -n '^preflight/piece2-backups/$' /Users/milovan/projects/consilium-docs/.gitignore
```

- [ ] **Step 4: Snapshot user-scope agents and plugin cache**

```bash
backup_root="/Users/milovan/projects/consilium-docs/preflight/piece2-backups/2026-04-24-cutover"
mkdir -p "$backup_root"
cp -a /Users/milovan/.claude/agents "$backup_root/agents"
cp -a /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0 "$backup_root/plugin-cache-1.0.0"
mkdir -p "$backup_root/untracked-planning-docs/specs" "$backup_root/untracked-planning-docs/plans"
cp /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-24-consilium-docs-split-design.md \
  "$backup_root/untracked-planning-docs/specs/"
cp /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md \
  "$backup_root/untracked-planning-docs/plans/"
cp /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-piece-2-cutover.md \
  "$backup_root/untracked-planning-docs/plans/"
git -C /Users/milovan/projects/Consilium status --short > "$backup_root/consilium-status-before.txt"
git -C /Users/milovan/projects/consilium-docs status --short > "$backup_root/consilium-docs-status-before.txt"
```

Verify:

```bash
backup_root="/Users/milovan/projects/consilium-docs/preflight/piece2-backups/2026-04-24-cutover"
test -f "$backup_root/agents/consilium-censor.md"
test -d "$backup_root/plugin-cache-1.0.0/skills"
test -f "$backup_root/untracked-planning-docs/specs/2026-04-24-consilium-docs-split-design.md"
test -f "$backup_root/untracked-planning-docs/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md"
test -f "$backup_root/untracked-planning-docs/plans/2026-04-24-consilium-docs-piece-2-cutover.md"
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: only `.gitignore` may be modified in `consilium-docs`; the backup dir is ignored. These copies are the recovery path for the currently untracked split spec and Piece 1/Piece 2 edicts after Task 3 moves them out of the source tree.

---

### Task 1: Marker And Guard Bootstrap

> **Confidence: High** - split spec requires this before every destructive or repointing action; live SKILL paths verified by `rg --files`.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/.migration-in-progress`
- Modify: `/Users/milovan/projects/Consilium/skills/consul/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/edicts/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/tribune/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/legion/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/march/SKILL.md`
- Modify matching cache SKILL files under `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/`

- [ ] **Step 1: Create the migration marker**

```bash
touch /Users/milovan/projects/consilium-docs/.migration-in-progress
test -f /Users/milovan/projects/consilium-docs/.migration-in-progress
```

- [ ] **Step 2: Verify the marker remains untracked**

```bash
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: `.migration-in-progress` does not appear. If it appears, halt and fix `.gitignore` before continuing.

- [ ] **Step 3: Insert the guard-only Phase 0 block into the five source SKILLs**

Use this exact block. Do not change any legacy paths, graphify prose, case paths, or doctrine paths in this step.

````markdown
### Phase 0 - Resolve $CONSILIUM_DOCS

Before reading doctrine, reading or writing case files, dispatching agents, or continuing the workflow, run:

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
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

If this command returns non-zero, halt the session and do not proceed.
````

Insertion points:
- `skills/consul/SKILL.md`: insert the Phase 0 block after the paragraph under `## My Doctrine` and immediately before the exact heading `### Phase 1: Reconnaissance`.
- `skills/edicts/SKILL.md`: insert the Phase 0 block immediately before the exact heading `## Scope Check`.
- `skills/tribune/SKILL.md`: insert the Phase 0 block immediately after the exact heading `## The Eight-Step Workflow`; after the Phase 0 block and before `### Phase 1 — Summons`, add this exact sentence: `Phase 0 is a precondition; the eight-step diagnosis spine remains Phases 1-8.`
- `skills/legion/SKILL.md`: insert the Phase 0 block immediately before the exact heading `## When to Summon the Legion`.
- `skills/march/SKILL.md`: insert the Phase 0 block immediately before the exact heading `## The March`.

- [ ] **Step 4: Sync only those five guard-edited files into plugin cache**

```bash
for skill in consul edicts tribune legion march; do
  cp "/Users/milovan/projects/Consilium/skills/$skill/SKILL.md" \
    "/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/$skill/SKILL.md"
done
```

- [ ] **Step 5: Verify guard exists in source and cache**

```bash
for f in \
  /Users/milovan/projects/Consilium/skills/consul/SKILL.md \
  /Users/milovan/projects/Consilium/skills/edicts/SKILL.md \
  /Users/milovan/projects/Consilium/skills/tribune/SKILL.md \
  /Users/milovan/projects/Consilium/skills/legion/SKILL.md \
  /Users/milovan/projects/Consilium/skills/march/SKILL.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/consul/SKILL.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/edicts/SKILL.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/tribune/SKILL.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/legion/SKILL.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/march/SKILL.md
do
  rg -nF 'Phase 0 - Resolve $CONSILIUM_DOCS' "$f"
  rg -nF 'migration in progress - halt' "$f"
done
```

Expected: each file has both hits.

- [ ] **Step 6: Negative Phase 0 simulation must halt**

```bash
if CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs bash -c '
  [ -d "$CONSILIUM_DOCS" ] || exit 1
  [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || exit 1
  [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || exit 1
'; then
  echo "expected Phase 0 to halt while marker exists" >&2
  exit 1
else
  echo "Phase 0 blocked as expected while marker exists"
fi
```

Expected: `Phase 0 blocked as expected while marker exists`.

- [ ] **Step 7: Confirm guard-only discipline**

```bash
git -C /Users/milovan/projects/Consilium diff -- \
  skills/consul/SKILL.md \
  skills/edicts/SKILL.md \
  skills/tribune/SKILL.md \
  skills/legion/SKILL.md \
  skills/march/SKILL.md
```

Expected: the diff contains Phase 0 blocks only. If it contains path repoints, graphify edits, doctrine moves, or state-machine rewrites, revert those non-guard edits before continuing.

---

### Task 2: Migrate Doctrine Into consilium-docs

> **Confidence: High** - source paths were inventoried in Piece 1 and verified live.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/doctrine/`
- Read: `/Users/milovan/projects/Consilium/skills/references/domain/`
- Read: `/Users/milovan/projects/Consilium/skills/tribune/references/`
- Read: `/Users/milovan/projects/Consilium/graphify-source/voice-principles.md`
- Read: `/Users/milovan/projects/Consilium/graphify-source/brand-identity.md`

- [ ] **Step 1: Copy domain doctrine**

```bash
mkdir -p /Users/milovan/projects/consilium-docs/doctrine/domain
cp -R /Users/milovan/projects/Consilium/skills/references/domain/. \
  /Users/milovan/projects/consilium-docs/doctrine/domain/
mv /Users/milovan/projects/consilium-docs/doctrine/domain/known-gaps.md \
  /Users/milovan/projects/consilium-docs/doctrine/known-gaps.md
```

- [ ] **Step 2: Copy Medicus doctrine**

```bash
cp /Users/milovan/projects/Consilium/skills/tribune/references/*.md \
  /Users/milovan/projects/consilium-docs/doctrine/
cp -R /Users/milovan/projects/Consilium/skills/tribune/references/lane-guides \
  /Users/milovan/projects/consilium-docs/doctrine/
```

- [ ] **Step 3: Copy voice and brand doctrine**

```bash
cp /Users/milovan/projects/Consilium/graphify-source/voice-principles.md \
  /Users/milovan/projects/consilium-docs/doctrine/voice-principles.md
cp /Users/milovan/projects/Consilium/graphify-source/brand-identity.md \
  /Users/milovan/projects/consilium-docs/doctrine/brand-identity.md
```

- [ ] **Step 4: Rewrite doctrine-internal legacy references**

Edit files under `/Users/milovan/projects/consilium-docs/doctrine/` so references use the new paths:
- `skills/references/domain/known-gaps.md` -> `$CONSILIUM_DOCS/doctrine/known-gaps.md`
- `skills/tribune/references/lane-classification.md` -> `$CONSILIUM_DOCS/doctrine/lane-classification.md`
- `skills/tribune/references/diagnosis-packet.md` -> `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`
- `skills/tribune/references/fix-thresholds.md` -> `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- `skills/tribune/references/known-gaps-protocol.md` -> `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`
- `skills/tribune/references/lane-guides/` -> `$CONSILIUM_DOCS/doctrine/lane-guides/`

Also rewrite `known-gaps.md` line 3 so it says the file is read directly from `$CONSILIUM_DOCS/doctrine/known-gaps.md`; do not mention graphify.

Cross-reference audit requirements:
- In `/Users/milovan/projects/consilium-docs/doctrine/domain/MANIFEST.md`, rewrite any `known-gaps.md` row to `$CONSILIUM_DOCS/doctrine/known-gaps.md` because `known-gaps.md` was promoted out of `domain/`.
- In every file under `/Users/milovan/projects/consilium-docs/doctrine/lane-guides/`, rewrite bare cross-directory references such as `known-gaps.md` to `$CONSILIUM_DOCS/doctrine/known-gaps.md`.
- In doctrine files outside `lane-guides/`, rewrite references to lane guides as `$CONSILIUM_DOCS/doctrine/lane-guides/<file>.md`.

- [ ] **Step 5: Verify doctrine tree**

```bash
test -f /Users/milovan/projects/consilium-docs/doctrine/known-gaps.md
test -f /Users/milovan/projects/consilium-docs/doctrine/domain/MANIFEST.md
test -f /Users/milovan/projects/consilium-docs/doctrine/lane-classification.md
test -f /Users/milovan/projects/consilium-docs/doctrine/diagnosis-packet.md
test -f /Users/milovan/projects/consilium-docs/doctrine/fix-thresholds.md
test -f /Users/milovan/projects/consilium-docs/doctrine/known-gaps-protocol.md
test -f /Users/milovan/projects/consilium-docs/doctrine/lane-guides/storefront-debugging.md
test -f /Users/milovan/projects/consilium-docs/doctrine/voice-principles.md
test -f /Users/milovan/projects/consilium-docs/doctrine/brand-identity.md
if rg -n 'skills/references/domain|skills/tribune/references|graphify|query_graph|get_neighbors|mcp__graphify' \
  /Users/milovan/projects/consilium-docs/doctrine; then
  echo "stale doctrine references remain" >&2
  exit 1
fi
if rg -n '(^|[^/$])known-gaps\.md' \
  /Users/milovan/projects/consilium-docs/doctrine/domain/MANIFEST.md \
  /Users/milovan/projects/consilium-docs/doctrine/lane-guides; then
  echo "bare known-gaps.md reference remains after promotion" >&2
  exit 1
fi
ruby -e '
files = Dir["/Users/milovan/projects/consilium-docs/doctrine/*.md"] +
  Dir["/Users/milovan/projects/consilium-docs/doctrine/domain/*.md"] +
  Dir["/Users/milovan/projects/consilium-docs/doctrine/lane-guides/*.md"]
bad = []
files.each do |path|
  text = File.read(path)
  text.scan(/(?<!\$CONSILIUM_DOCS\/doctrine\/)lane-guides\/[a-z-]+\.md/) do |match|
    bad << "#{path}: #{match}"
  end
end
abort("bare lane-guide refs remain:\n#{bad.join("\n")}") unless bad.empty?
'
```

Expected: file tests pass; no stale doctrine references remain; no bare promoted `known-gaps.md` or lane-guide references remain.

- [ ] **Step 6: Commit doctrine copy in consilium-docs**

```bash
git -C /Users/milovan/projects/consilium-docs add -A
git -C /Users/milovan/projects/consilium-docs commit -m "migrate doctrine into consilium-docs"
```

---

### Task 3: Migrate Historical Artifacts Into Case Folders

> **Confidence: Medium** - the file inventory is live-verified, but case grouping is a Consul judgment based on the original plan plus the new split artifacts.

**Files:**
- Move from: `/Users/milovan/projects/Consilium/docs/consilium/specs/`
- Move from: `/Users/milovan/projects/Consilium/docs/consilium/plans/`
- Move from: `/Users/milovan/projects/Consilium/docs/ideas/`
- Move from: `/Users/milovan/projects/Consilium/graphify-source/DISCREPANCY_REPORT.md`
- Create under: `/Users/milovan/projects/consilium-docs/cases/`

- [ ] **Step 1: Verify the current artifact inventory before moving**

```bash
rg --files \
  /Users/milovan/projects/Consilium/docs/consilium/specs \
  /Users/milovan/projects/Consilium/docs/consilium/plans \
  /Users/milovan/projects/Consilium/docs/ideas \
  /Users/milovan/projects/Consilium/docs/consilium/debugging-cases \
  | sort
test -f /Users/milovan/projects/Consilium/docs/consilium/ROADMAP.md
test -d /Users/milovan/projects/Consilium/docs/consilium/pass-2 || {
  echo "docs/consilium/pass-2 directory missing before planned stale-dir removal" >&2
  exit 1
}
if rg --files /Users/milovan/projects/Consilium/docs/consilium/pass-2; then
  echo "docs/consilium/pass-2 is not empty" >&2
  exit 1
else
  echo "docs/consilium/pass-2 is empty"
fi
```

Expected: the `rg --files` output includes the split spec, Piece 1 edict, this Piece 2 edict, original consilium-docs spec/plan, the abandoned tribune-resolution plan, 2026-04-23 tribune reshape spec/plan, the 2026-04-21 backend-specialization spec, the 2026-04-10 graphify pass-3 spec/plan, the 2026-04-09 foundation cluster, two `docs/ideas` files, and `debugging-cases/README.md`. `ROADMAP.md` exists. `docs/consilium/pass-2 is empty` prints because `pass-2/` is an empty stale directory to remove in Task 4.

- [ ] **Step 2: Create case folders**

```bash
mkdir -p \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs \
  /Users/milovan/projects/consilium-docs/cases/2026-04-23-tribune-reshape \
  /Users/milovan/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization \
  /Users/milovan/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3 \
  /Users/milovan/projects/consilium-docs/cases/2026-04-09-consilium-foundation \
  /Users/milovan/projects/consilium-docs/cases/2026-04-09-consul-improvements
```

- [ ] **Step 3: Move the 2026-04-24 consilium-docs artifacts**

```bash
mv /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-24-consilium-docs-split-design.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/spec.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-piece-2-cutover.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/plan.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/ref-piece-1-bootstrap-plan.md
mv /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-24-consilium-docs-repo.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/ref-original-full-spec.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-repo.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/ref-original-full-plan.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-24-tribune-consilium-repo-resolution.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/ref-tribune-resolution-plan.md
```

Execution note: after this step, the live edict path is `/Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/plan.md`. If the marching worker must reopen instructions after this move, use that new path. If the session is interrupted before this move is committed, recover the untracked planning docs from `/Users/milovan/projects/consilium-docs/preflight/piece2-backups/2026-04-24-cutover/untracked-planning-docs/`.

Write `/Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/STATUS.md`:

```markdown
---
status: routed
opened: 2026-04-24
target: consilium
agent: claude
type: infra
sessions: 3
current_session: 3
---

## Current state

Piece 1 completed at consilium-docs commit 50fce07b5a41f7e4f01930bca88ef3948d856264. Piece 2 cutover is in progress.

## What's next

- Complete guarded cutover
- Remove migration marker
- Close the case after verification

## Open questions

(none)
```

- [ ] **Step 4: Move tribune reshape artifacts**

```bash
mv /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-23-tribune-reshape-and-medusa-rig.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-23-tribune-reshape/spec.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-23-tribune-reshape-and-medusa-rig-execution.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-23-tribune-reshape/plan.md
```

Write `STATUS.md` with `status: closed`, `opened: 2026-04-23`, `closed_at: 2026-04-24`, `target: consilium`, `agent: claude`, `type: infra`, `sessions: 1`, `current_session: 1`. Write a short `retro.md` stating that this case introduced Medicus, diagnosis packets, debugging cases, known-gaps doctrine, and Medusa Rig wiring.

- [ ] **Step 5: Move backend-specialization artifact**

```bash
mv /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-21-consilium-backend-specialization-session-1.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization/spec.md
```

Write `STATUS.md` with `status: routed`, `opened: 2026-04-21`, `target: consilium`, `agent: claude`, `type: infra`, `sessions: 1`, `current_session: 1`, and a current-state note that session 1 was routed but no later execution plan has shipped.

- [ ] **Step 6: Move graphify pass-3 artifacts**

```bash
mv /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-10-graphify-corpus-pass-3-migration.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/spec.md
mv /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-10-graphify-corpus-pass-3-execution.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/plan.md
mv /Users/milovan/projects/Consilium/graphify-source/DISCREPANCY_REPORT.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/ref-discrepancy-report.md
mv /Users/milovan/projects/Consilium/docs/ideas/graphify-corpus-restructure.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/ref-restructure-ideation.md
```

Write `STATUS.md` with `status: closed`, `opened: 2026-04-10`, `closed_at: 2026-04-15`, `target: consilium`, `agent: claude`, `type: infra`, `sessions: 1`, `current_session: 1`. Write a short `retro.md` preserving the lesson that the corpus build was useful but the runtime graph consumer was removed.

- [ ] **Step 7: Move the 2026-04-09 foundation cluster**

```bash
for f in /Users/milovan/projects/Consilium/docs/consilium/specs/2026-04-09-*.md; do
  mv "$f" /Users/milovan/projects/consilium-docs/cases/2026-04-09-consilium-foundation/
done
for f in /Users/milovan/projects/Consilium/docs/consilium/plans/2026-04-09-*.md; do
  mv "$f" /Users/milovan/projects/consilium-docs/cases/2026-04-09-consilium-foundation/
done
mv /Users/milovan/projects/Consilium/docs/consilium/ROADMAP.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-09-consilium-foundation/ref-roadmap.md
```

Write `STATUS.md` with `status: closed`, `opened: 2026-04-09`, `closed_at: 2026-04-10`, `target: consilium`, `agent: claude`, `type: infra`, `sessions: 11`, `current_session: 11`. Write a short `retro.md` noting the foundation work: brainstorming, domain bible, Roman personas, skill migration, subagent-driven development, verification engine, and learning-loop design.

- [ ] **Step 8: Move consul-improvements idea**

```bash
mv /Users/milovan/projects/Consilium/docs/ideas/consul-improvements.md \
  /Users/milovan/projects/consilium-docs/cases/2026-04-09-consul-improvements/spec.md
```

Write `STATUS.md` with `status: draft`, `opened: 2026-04-09`, `target: consilium`, `agent: claude`, `type: idea`, `sessions: 1`, `current_session: 1`.

- [ ] **Step 9: Verify source artifact dirs are drained except debugging README**

```bash
if rg --files /Users/milovan/projects/Consilium/docs/consilium/specs /Users/milovan/projects/Consilium/docs/consilium/plans /Users/milovan/projects/Consilium/docs/ideas 2>/dev/null; then
  echo "legacy artifact files remain" >&2
  exit 1
else
  echo "legacy artifact dirs drained"
fi
test -f /Users/milovan/projects/Consilium/docs/consilium/debugging-cases/README.md
```

Expected: `legacy artifact dirs drained`; second command exits 0.

---

### Task 4: Fold Debugging README Into CONVENTIONS And Remove Legacy Artifact Sources

> **Confidence: High** - preserves the legacy README semantics while converting the storage model to case folders plus `STATUS.md` frontmatter.

**Files:**
- Modify: `/Users/milovan/projects/consilium-docs/CONVENTIONS.md`
- Delete: `/Users/milovan/projects/Consilium/docs/consilium/debugging-cases/README.md`
- Delete: `/Users/milovan/projects/Consilium/docs/consilium/specs/`
- Delete: `/Users/milovan/projects/Consilium/docs/consilium/plans/`
- Delete: `/Users/milovan/projects/Consilium/docs/consilium/pass-2/`
- Delete: `/Users/milovan/projects/Consilium/docs/consilium/`
- Delete: `/Users/milovan/projects/Consilium/docs/ideas/`
- Delete: `/Users/milovan/projects/Consilium/skills/references/domain/`
- Delete: `/Users/milovan/projects/Consilium/skills/tribune/references/`
- Delete: `/Users/milovan/projects/Consilium/graphify-source/`, including `/Users/milovan/projects/Consilium/graphify-source/.serena/`

- [ ] **Step 1: Replace CONVENTIONS.md with full case-folder conventions**

Keep the existing marker line as line 1. The file must define:
- folder names: `YYYY-MM-DD-<slug>`
- `STATUS.md` YAML frontmatter as the state source
- feature/infra/idea primary artifact: `spec.md`
- bug primary artifact: `diagnosis.md`
- session files: `session-NN-<topic>-spec.md` and `session-NN-<topic>-plan.md`
- reference files: `ref-<topic>.md`
- handoff files: `handoff-NN-to-MM.md`
- state values: `draft`, `rejected`, `approved`, `routed`, `contained`, `closed`, `referenced`, `abandoned`
- Phase 1 scan semantics: `status: contained`, modified within 90 days unless `--scan-all`, and no later case with `Resolves: <slug>`
- known-gap promotion reads and writes `$CONSILIUM_DOCS/doctrine/known-gaps.md`

Use this exact Phase 1 scan wording in `CONVENTIONS.md`:

```markdown
Phase 1 surfaces a case only when all three conditions are true:

1. `STATUS.md` frontmatter has `status: contained`.
2. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`.
3. No later case has a `Resolves: <slug>` field naming the current case slug.
```

Do not include old single-file `Status:` body-field instructions.

- [ ] **Step 2: Delete legacy source directories**

`.DS_Store` files are macOS Finder metadata. They are safe to remove, and this step removes them so legacy directory deletion does not fail on hidden Finder files.

```bash
rm /Users/milovan/projects/Consilium/docs/consilium/debugging-cases/README.md
rm -f /Users/milovan/projects/Consilium/docs/.DS_Store
rm -rf /Users/milovan/projects/Consilium/docs/consilium/debugging-cases
rm -rf /Users/milovan/projects/Consilium/docs/consilium/specs
rm -rf /Users/milovan/projects/Consilium/docs/consilium/plans
rm -rf /Users/milovan/projects/Consilium/docs/consilium/pass-2
rm -rf /Users/milovan/projects/Consilium/docs/consilium
rm -rf /Users/milovan/projects/Consilium/docs/ideas
rm -rf /Users/milovan/projects/Consilium/skills/references/domain
rm -rf /Users/milovan/projects/Consilium/skills/tribune/references
if test -d /Users/milovan/projects/Consilium/graphify-source/.serena; then
  echo "deleting graphify-source/.serena by Milovan decision"
fi
rm -rf /Users/milovan/projects/Consilium/graphify-source
```

- [ ] **Step 3: Verify legacy source paths are gone**

```bash
test ! -e /Users/milovan/projects/Consilium/docs/consilium/debugging-cases
test ! -e /Users/milovan/projects/Consilium/docs/consilium/specs
test ! -e /Users/milovan/projects/Consilium/docs/consilium/plans
test ! -e /Users/milovan/projects/Consilium/docs/consilium/pass-2
test ! -e /Users/milovan/projects/Consilium/docs/consilium
test ! -e /Users/milovan/projects/Consilium/docs/ideas
test ! -e /Users/milovan/projects/Consilium/skills/references/domain
test ! -e /Users/milovan/projects/Consilium/skills/tribune/references
test ! -e /Users/milovan/projects/Consilium/graphify-source
```

- [ ] **Step 4: Commit artifact migration in consilium-docs**

```bash
git -C /Users/milovan/projects/consilium-docs add -A
git -C /Users/milovan/projects/consilium-docs commit -m "migrate historical Consilium artifacts into cases"
```

Do not commit Consilium yet. Source runtime edits still need to land before the marker can close.

---

### Task 5: Repoint Source Runtime Skills And State Writes

> **Confidence: Medium** - insertion points and current stale references were verified, but prose edits are semantic and must be checked by final grep gates.

**Files:**
- Modify: `/Users/milovan/projects/Consilium/skills/consul/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/edicts/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/tribune/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/legion/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/march/SKILL.md`
- Modify: `/Users/milovan/projects/Consilium/skills/legion/implementer-prompt.md`

- [ ] **Step 1: Repoint Consul and Edicts**

In `consul/SKILL.md` and `edicts/SKILL.md`:
- Replace domain knowledge loading by graph query with direct doctrine reads from `$CONSILIUM_DOCS/doctrine/`.
- Replace artifact output paths:
  - specs/plans now live under `$CONSILIUM_DOCS/cases/<slug>/spec.md`
  - implementation plans now live under `$CONSILIUM_DOCS/cases/<slug>/plan.md`
  - later sessions use `session-NN-<topic>-spec.md` and `session-NN-<topic>-plan.md`
- Replace `~/.codex/agents/consilium-scout.md` with `/Users/milovan/.claude/agents/consilium-scout.md`.
- Remove every `graphify`, `query_graph`, `get_neighbors`, `mcp__graphify`, and stale `knowledge graph` runtime instruction.

- [ ] **Step 2: Repoint Tribune**

In `tribune/SKILL.md`:
- Update Phase 1 scan from `docs/consilium/debugging-cases/` to `$CONSILIUM_DOCS/cases/*/STATUS.md`.
- Preserve these scan filters exactly: `status: contained`, mtime within 90 days unless `/tribune --scan-all`, and no later case with `Resolves: <slug>`.
- Update doctrine loads to:
  - `$CONSILIUM_DOCS/doctrine/known-gaps.md`
  - `$CONSILIUM_DOCS/doctrine/lane-classification.md`
  - `$CONSILIUM_DOCS/doctrine/lane-guides/<lane>.md`
  - `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`
  - `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`
  - `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- Update Phase 6 write target from one debugging-case markdown file to a case folder created through `$CONSILIUM_DOCS/scripts/case-new <slug> --target <target> --agent claude --type bug`.
- Write the diagnosis packet to `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`.
- Update all state writes from body prose `Status: <value>` to `STATUS.md` YAML frontmatter `status: <value>`.

Use this exact Phase 1 scan wording in the Tribune workflow:

```markdown
Phase 1 surfaces a case only when all three conditions are true:

1. `STATUS.md` frontmatter has `status: contained`.
2. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`.
3. No later case has a `Resolves: <slug>` field naming the current case slug.
```

Use this wording for state rewrites:

```markdown
For state transitions, update `$CONSILIUM_DOCS/cases/<slug>/STATUS.md` by rewriting the YAML frontmatter `status:` field. The state strings remain `draft`, `rejected`, `approved`, `routed`, `contained`, `closed`, `referenced`, and `abandoned`; only the storage location changes.
```

- [ ] **Step 3: Repoint Legion and March**

In `legion/SKILL.md` and `march/SKILL.md`:
- Replace debug-fix intake path `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` with `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`.
- Replace `skills/tribune/references/fix-thresholds.md` with `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`.
- Update `Status: routed`, `Status: closed`, and `Status: contained` instructions to `STATUS.md` frontmatter `status: routed`, `status: closed`, and `status: contained`.
- Preserve threshold meanings and cross-repo contract evidence wording.
- Remove graphify and stale knowledge-graph domain-preload instructions; soldiers and verifiers get relevant doctrine excerpts or read doctrine files directly.

- [ ] **Step 4: Repoint implementer prompt**

In `skills/legion/implementer-prompt.md`, replace the graphify domain-knowledge fragment with:

```markdown
{DOMAIN_KNOWLEDGE - relevant excerpts read from $CONSILIUM_DOCS/doctrine/ by the Legatus, or instructions for the Soldier to read specific doctrine files}
```

- [ ] **Step 5: Verify source skills**

```bash
if rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph|skills/references/domain|skills/tribune/references|docs/consilium/debugging-cases|docs/consilium/specs|docs/consilium/plans|docs/ideas|docs/consilium/ROADMAP|~/\.codex/agents' \
  /Users/milovan/projects/Consilium/skills/consul/SKILL.md \
  /Users/milovan/projects/Consilium/skills/edicts/SKILL.md \
  /Users/milovan/projects/Consilium/skills/tribune/SKILL.md \
  /Users/milovan/projects/Consilium/skills/legion/SKILL.md \
  /Users/milovan/projects/Consilium/skills/march/SKILL.md \
  /Users/milovan/projects/Consilium/skills/legion/implementer-prompt.md; then
  echo "stale source skill references remain" >&2
  exit 1
fi
if rg -n 'Status: (draft|rejected|approved|routed|contained|closed|referenced|abandoned)' \
  /Users/milovan/projects/Consilium/skills/tribune/SKILL.md \
  /Users/milovan/projects/Consilium/skills/legion/SKILL.md \
  /Users/milovan/projects/Consilium/skills/march/SKILL.md; then
  echo "capital Status body writes remain" >&2
  exit 1
fi
```

Expected: both negative gates print no matches and exit successfully.

---

### Task 6: Repoint Personas, Verification Protocol, Top-Level Docs, And Staleness Check

> **Confidence: Medium** - source files are verified, but several files carry prose that must be rewritten without leaving runtime graphify claims.

**Files:**
- Modify: `/Users/milovan/projects/Consilium/skills/references/personas/consul.md`
- Modify: `/Users/milovan/projects/Consilium/skills/references/personas/medicus.md`
- Modify: `/Users/milovan/projects/Consilium/skills/references/personas/scout.md`
- Modify: `/Users/milovan/projects/Consilium/skills/references/personas/soldier.md`
- Modify: `/Users/milovan/projects/Consilium/skills/references/personas/consilium-codex.md`
- Modify: `/Users/milovan/projects/Consilium/skills/references/verification/protocol.md`
- Modify: all files in `/Users/milovan/projects/Consilium/skills/references/verification/templates/`
- Modify: `/Users/milovan/projects/Consilium/CLAUDE.md`
- Modify: `/Users/milovan/projects/Consilium/AGENTS.md` (symlink to `CLAUDE.md`; verify it resolves cleanly)
- Modify: `/Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md`
- Modify: `/Users/milovan/projects/Consilium/docs/testing-agents.md`
- Modify: `/Users/milovan/projects/Consilium/scripts/check-tribune-staleness.py`
- Delete: `/Users/milovan/projects/Consilium/scripts/refresh-graph.sh`

- [ ] **Step 1: Repoint canonical personas**

In the five listed persona files:
- Replace graph-query doctrine rules with direct reads from `$CONSILIUM_DOCS/doctrine/`.
- Remove any claim that graphify is the source of Consilium knowledge.
- Remove any runtime claim that a "knowledge graph" is the source of Consilium truth.
- In `medicus.md`, replace `skills/tribune/references/...` paths with `$CONSILIUM_DOCS/doctrine/...`.
- In `scout.md` and `soldier.md`, replace "query graphify" instructions with "read the specific doctrine files named in the dispatch prompt or use `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the index."
- In `consilium-codex.md`, rewrite the shared knowledge law so every persona reads doctrine files directly and halts if `$CONSILIUM_DOCS` cannot be resolved.
- In `consilium-codex.md`, explicitly remove or rewrite the current runtime phrases that mention `knowledge graph`, `graphify MCP server`, `query_graph`, and `get_neighbors`; these must be gone before drift sync copies the Codex block into user-scope agents.

- [ ] **Step 2: Repoint verification protocol and templates**

In `protocol.md` and every file under `skills/references/verification/templates/`:
- Replace "assembled from graphify MCP queries" fragments with "assembled from `$CONSILIUM_DOCS/doctrine/` file reads".
- Remove text saying agents can query graphify themselves.
- Replace degraded-mode instructions with: if `$CONSILIUM_DOCS` is unavailable, note the failure and proceed only if the artifact itself contains enough doctrine context; otherwise report a GAP.

- [ ] **Step 3: Update repo docs**

In `CLAUDE.md`:
- Replace Domain Bible location with `$CONSILIUM_DOCS/doctrine/`.
- Replace Debugging cases location with `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`.
- Replace the tribune reshape plan recovery path with `$CONSILIUM_DOCS/cases/2026-04-23-tribune-reshape/plan.md`.
- Replace user-scope agent customization recovery instructions that point to old `docs/consilium/plans/...` files with the new case path.
- Remove the post-plan graph rebuild action.
- Remove the `/graphify` maintenance block.
- Remove any graphify MCP server mention and any stale `known-gaps.md` path that points into `skills/references/domain/`.

Verify `AGENTS.md` is still a symlink to `CLAUDE.md`:

```bash
test "$(readlink /Users/milovan/projects/Consilium/AGENTS.md)" = "CLAUDE.md"
```

In `docs/CONSILIUM-VISION.md`:
- Replace all old domain/debugging paths with `$CONSILIUM_DOCS/doctrine/` and `$CONSILIUM_DOCS/cases/`.
- Add a short Case Folder Model section that points to `$CONSILIUM_DOCS/CONVENTIONS.md`.
- Do not mention graphify.

In `docs/testing-agents.md`:
- Replace old domain path references with `$CONSILIUM_DOCS/doctrine/`.
- Replace graphify availability/degraded-mode references with direct doctrine-file-read expectations.
- Keep Serena references where they still apply.

- [ ] **Step 4: Replace the staleness check**

Rewrite `/Users/milovan/projects/Consilium/scripts/check-tribune-staleness.py` so it:
- scans source `skills/tribune/` and cache `skills/tribune/`
- bans legacy paths and graph tokens
- resolves doctrine references under `/Users/milovan/projects/consilium-docs/doctrine/`
- keeps the Medusa Rig skill existence checks
- exits 0 only when clean

The script may contain graph tokens only inside the banned-regex definitions and finding messages. Do not include it in final runtime `rg` gates.

- [ ] **Step 5: Delete the graph refresh helper**

```bash
rm /Users/milovan/projects/Consilium/scripts/refresh-graph.sh
```

- [ ] **Step 6: Verify source docs and verification surfaces**

```bash
matches=$(mktemp)
rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph|skills/references/domain|skills/tribune/references|docs/consilium/debugging-cases|docs/consilium/specs|docs/consilium/plans|docs/ideas|docs/consilium/ROADMAP|~/\.codex/agents' \
  /Users/milovan/projects/Consilium/CLAUDE.md \
  /Users/milovan/projects/Consilium/AGENTS.md \
  /Users/milovan/projects/Consilium/docs \
  /Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md \
  /Users/milovan/projects/Consilium/skills/references/personas \
  /Users/milovan/projects/Consilium/skills/references/verification > "$matches" || true
if [ -s "$matches" ]; then
  cat "$matches"
  rm -f "$matches"
  echo "stale source docs/persona/verification references remain" >&2
  exit 1
fi
rm -f "$matches"
test ! -e /Users/milovan/projects/Consilium/scripts/refresh-graph.sh
```

Expected: the negative gate prints no matches; deleted script test exits 0.

---

### Task 7: Repoint User-Scope Agents

> **Confidence: High** - all six user-scope agent paths were verified live; Ruby YAML is available and PyYAML is not.

**Files:**
- Modify: `/Users/milovan/.claude/agents/consilium-censor.md`
- Modify: `/Users/milovan/.claude/agents/consilium-praetor.md`
- Modify: `/Users/milovan/.claude/agents/consilium-provocator.md`
- Modify: `/Users/milovan/.claude/agents/consilium-scout.md`
- Modify: `/Users/milovan/.claude/agents/consilium-soldier.md`
- Modify: `/Users/milovan/.claude/agents/consilium-tribunus.md`

- [ ] **Step 1: Strip graphify tools and mcpServers**

For each file:
- Remove every comma-separated `tools:` entry beginning with `mcp__graphify__`.
- Remove the YAML list item `- graphify` under `mcpServers:`.
- Keep `serena` and `medusa` entries intact.

Use this command to do the frontmatter surgery; it tokenizes `tools:` before rewriting so dangling commas cannot survive:

```bash
ruby -e '
ARGV.each do |path|
  text = File.read(path)
  abort("missing frontmatter: #{path}") unless text.start_with?("---\n")
  parts = text.split(/^---\s*$/, 3)
  abort("malformed frontmatter: #{path}") unless parts.length >= 3
  yaml = parts[1]
  body = parts[2]
  yaml = yaml.lines.map do |line|
    if line =~ /^tools:\s*(.*)$/
      tokens = Regexp.last_match(1).split(",").map(&:strip)
      tokens = tokens.reject { |token| token.empty? || token.start_with?("mcp__graphify__") }
      "tools: #{tokens.join(", ")}\n"
    else
      line
    end
  end.join
  yaml = yaml.gsub(/^\s*-\s*graphify\s*\n/, "")
  yaml = yaml.sub(/\A\n?/, "\n").sub(/\n?\z/, "\n")
  body = body.sub(/\A\n?/, "\n")
  File.write(path, "---#{yaml}---#{body}")
end
' /Users/milovan/.claude/agents/consilium-*.md
```

- [ ] **Step 2: Rewrite body prose**

For each file, remove every runtime graphify reference in body prose. Replace the operational note with:

```markdown
- **Domain knowledge**: Read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/`. Use `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the topic index when the dispatch prompt does not name a file.
- **Resolution failure**: If `$CONSILIUM_DOCS` is missing, malformed, or marked `.migration-in-progress`, halt and report the condition to the dispatching persona.
```

This task covers all body hits, not only `## Operational Notes`.

- [ ] **Step 3: Sync canonical Codex block to five user-scope agents**

```bash
test -s /Users/milovan/projects/Consilium/skills/references/personas/consilium-codex.md
if rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph' \
  /Users/milovan/projects/Consilium/skills/references/personas/consilium-codex.md; then
  echo "canonical Codex still has runtime graph references; do not sync drift" >&2
  exit 1
fi
python3 /Users/milovan/projects/Consilium/scripts/check-codex-drift.py --sync
python3 /Users/milovan/projects/Consilium/scripts/check-codex-drift.py
```

Expected: final command reports all five Codex-carrying agents in sync. `consilium-scout.md` is not part of drift sync and must remain manually edited.

- [ ] **Step 4: Validate YAML frontmatter with Ruby**

```bash
ruby -ryaml -rdate -e '
ARGV.each do |path|
  text = File.read(path)
  abort("missing frontmatter: #{path}") unless text.start_with?("---\n")
  parts = text.split(/^---\s*$/, 3)
  abort("malformed frontmatter: #{path}") unless parts.length >= 3
  data = YAML.safe_load(parts[1], permitted_classes: [], aliases: false)
  tools = data["tools"]
  if tools.is_a?(String)
    tokens = tools.split(",").map(&:strip)
    abort("empty tools token: #{path}") if tokens.any?(&:empty?)
    abort("graphify tool survived: #{path}") if tokens.any? { |token| token.include?("graphify") }
  end
  puts "OK: #{path}"
end
' /Users/milovan/.claude/agents/consilium-*.md
```

Expected: `OK:` for all six files.

- [ ] **Step 5: Verify user-scope graphify removal**

```bash
if rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph' /Users/milovan/.claude/agents/consilium-*.md; then
  echo "stale user-scope agent graph references remain" >&2
  exit 1
fi
```

Expected: the negative gate prints no matches and exits successfully.

---

### Task 8: Sync Plugin Cache And Purge Stale Cache Docs

> **Confidence: High** - uses full `skills/` rsync plus explicit root-doc cache sync/purge to avoid the stale-cache gap found in verification.

**Files:**
- Modify: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/`
- Modify: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md`
- Modify: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md`
- Delete: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium/`

- [ ] **Step 1: Full skills rsync**

```bash
mkdir -p /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
rsync -a --delete /Users/milovan/projects/Consilium/skills/ \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/
```

- [ ] **Step 2: Sync edited root docs**

```bash
cp /Users/milovan/projects/Consilium/CLAUDE.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md
mkdir -p /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs
cp /Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md
```

- [ ] **Step 3: Purge stale cached historical docs**

```bash
rm -rf /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium
```

- [ ] **Step 4: Verify cache mirrors source runtime**

```bash
diff -rq /Users/milovan/projects/Consilium/skills \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
diff -q /Users/milovan/projects/Consilium/CLAUDE.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md
diff -q /Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md
test ! -e /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium
```

Expected: no diffs; stale cached `docs/consilium` absent.

---

### Task 9: Bootstrap Codex Adoption Tracker And INDEX Banner

> **Confidence: Medium** - tracker need is explicit in the original design; exact Codex-side work remains out of scope for this Claude-side cutover.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/cases/<date>-codex-consilium-docs-adoption/`
- Modify: `/Users/milovan/projects/consilium-docs/INDEX.md`

- [ ] **Step 1: Create the tracker case**

```bash
tracker_path=$(/Users/milovan/projects/consilium-docs/scripts/case-new codex-consilium-docs-adoption \
  --target consilium \
  --agent codex \
  --type infra)
printf '%s\n' "$tracker_path"
printf '%s\n' "$tracker_path" > /Users/milovan/projects/consilium-docs/preflight/piece2-codex-tracker-path.txt
```

If the script creates a suffixed folder because the case already exists, use the printed path in the next steps and do not create a second folder manually.

- [ ] **Step 2: Replace tracker spec with concrete scope**

Read the persisted path and write the tracker spec:

```bash
tracker_path=$(cat /Users/milovan/projects/consilium-docs/preflight/piece2-codex-tracker-path.txt)
test -d "$tracker_path"
```

Write `$tracker_path/spec.md`:

```markdown
# codex-consilium-docs-adoption - Spec

Codex-Consilium still needs its own `$CONSILIUM_DOCS` adoption pass.

## Scope

- Add Phase 0 `$CONSILIUM_DOCS` resolution guards to Codex-side Consilium skills.
- Repoint Codex-side doctrine and case paths to `/Users/milovan/projects/consilium-docs`.
- Remove runtime graph-query assumptions from Codex-side Consilium surfaces.
- Keep Claude-side user-scope agents and plugin cache out of scope; Piece 2 owns those.

## Acceptance

- Codex-side Consilium can read `$CONSILIUM_DOCS/CONVENTIONS.md`.
- Codex-side Consilium reads doctrine from `$CONSILIUM_DOCS/doctrine/`.
- Codex-side Consilium writes cases under `$CONSILIUM_DOCS/cases/`.
```

- [ ] **Step 3: Add INDEX banner**

Read the persisted path again, derive the folder name, and add this near the top of `/Users/milovan/projects/consilium-docs/INDEX.md`:

```bash
tracker_path=$(cat /Users/milovan/projects/consilium-docs/preflight/piece2-codex-tracker-path.txt)
tracker_folder=$(basename "$tracker_path")
printf '%s\n' "$tracker_folder"
```

```markdown
<!-- banner:codex-adoption-pending -->
## Codex adoption pending

Codex-Consilium has not yet been repointed to this docs repo. Track it in `cases/${tracker_folder}/`.
<!-- /banner:codex-adoption-pending -->
```

Expand `${tracker_folder}` to the exact value printed by the preceding command; do not leave the shell expression in `INDEX.md`.

- [ ] **Step 4: Verify tracker**

```bash
tracker_path=$(cat /Users/milovan/projects/consilium-docs/preflight/piece2-codex-tracker-path.txt)
test -f "$tracker_path/STATUS.md"
test -f "$tracker_path/spec.md"
rg -n "banner:codex-adoption-pending|$(basename "$tracker_path")" /Users/milovan/projects/consilium-docs/INDEX.md
```

---

### Task 10: Final Validation Before Closing Marker

> **Confidence: High** - these gates directly check every corrected risk from split-spec verification.

**Files:**
- Read/verify runtime source, user-scope agents, plugin cache, and consilium-docs.

- [ ] **Step 1: Validate staleness and drift**

```bash
python3 /Users/milovan/projects/Consilium/scripts/check-codex-drift.py
python3 /Users/milovan/projects/Consilium/scripts/check-tribune-staleness.py
```

Expected: both exit 0.

- [ ] **Step 2: Validate user-agent frontmatter**

```bash
ruby -ryaml -e '
ARGV.each do |path|
  text = File.read(path)
  abort("missing frontmatter: #{path}") unless text.start_with?("---\n")
  parts = text.split(/^---\s*$/, 3)
  abort("malformed frontmatter: #{path}") unless parts.length >= 3
  data = YAML.safe_load(parts[1], permitted_classes: [], aliases: false)
  tools = data["tools"]
  if tools.is_a?(String)
    tokens = tools.split(",").map(&:strip)
    abort("empty tools token: #{path}") if tokens.any?(&:empty?)
    abort("graphify tool survived: #{path}") if tokens.any? { |token| token.include?("graphify") }
  end
  puts "OK: #{path}"
end
' /Users/milovan/.claude/agents/consilium-*.md
```

Expected: `OK:` for all six files.

- [ ] **Step 3: Validate runtime graph and legacy path excision**

```bash
matches=$(mktemp)
rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph|skills/references/domain|skills/tribune/references|docs/consilium/debugging-cases|docs/consilium/specs|docs/consilium/plans|docs/ideas|docs/consilium/ROADMAP|~/\.codex/agents' \
  /Users/milovan/projects/Consilium/CLAUDE.md \
  /Users/milovan/projects/Consilium/AGENTS.md \
  /Users/milovan/projects/Consilium/docs \
  /Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md \
  /Users/milovan/projects/Consilium/skills \
  /Users/milovan/.claude/agents/consilium-*.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills > "$matches" || true
if [ -s "$matches" ]; then
  cat "$matches"
  rm -f "$matches"
  echo "stale runtime references remain" >&2
  exit 1
fi
rm -f "$matches"
```

Expected: the negative gate prints no matches and exits successfully.

- [ ] **Step 4: Validate migrated cases**

```bash
ruby -ryaml -rdate -e '
allowed = %w[draft rejected approved routed contained closed referenced abandoned]
allowed_targets = %w[divinipress-store divinipress-backend consilium cross-repo]
allowed_agents = %w[claude codex both]
allowed_types = %w[feature bug infra idea]
required = %w[status opened target agent type sessions current_session]
ARGV.each do |path|
  text = File.read(path)
  abort("missing frontmatter: #{path}") unless text.start_with?("---\n")
  parts = text.split(/^---\s*$/, 3)
  abort("malformed frontmatter: #{path}") unless parts.length >= 3
  data = YAML.safe_load(parts[1], permitted_classes: [Date], aliases: false)
  missing = required.reject { |key| data.key?(key) }
  abort("missing #{missing.join(", ")} in #{path}") unless missing.empty?
  abort("invalid status #{data["status"].inspect} in #{path}") unless allowed.include?(data["status"])
  abort("invalid target #{data["target"].inspect} in #{path}") unless allowed_targets.include?(data["target"])
  abort("invalid agent #{data["agent"].inspect} in #{path}") unless allowed_agents.include?(data["agent"])
  abort("invalid type #{data["type"].inspect} in #{path}") unless allowed_types.include?(data["type"])
  abort("sessions not integer in #{path}") unless data["sessions"].is_a?(Integer) && data["sessions"] >= 1
  abort("current_session not integer in #{path}") unless data["current_session"].is_a?(Integer) && data["current_session"] >= 1
  abort("current_session exceeds sessions in #{path}") if data["current_session"] > data["sessions"]
  [data["opened"], data["closed_at"]].compact.each do |value|
    begin
      value.is_a?(Date) ? value : Date.iso8601(value.to_s)
    rescue ArgumentError
      abort("malformed date #{value.inspect} in #{path}")
    end
  end
  abort("closed case missing closed_at in #{path}") if data["status"] == "closed" && !data.key?("closed_at")
  puts "OK: #{path} status=#{data["status"]}"
end
' /Users/milovan/projects/consilium-docs/cases/*/STATUS.md
if rg -n '^Status:' /Users/milovan/projects/consilium-docs/cases/*/STATUS.md; then
  echo "capital Status body field remains in STATUS.md" >&2
  exit 1
fi
```

Expected: Ruby prints `OK:` for every case. The negative `rg` gate prints no matches and exits successfully.

- [ ] **Step 5: Validate Medicus scan semantics survived**

```bash
for f in \
  /Users/milovan/projects/Consilium/skills/tribune/SKILL.md \
  /Users/milovan/projects/consilium-docs/CONVENTIONS.md
do
  rg -n '^Phase 1 surfaces a case only when all three conditions are true:$' "$f"
  rg -n '^1\. `STATUS\.md` frontmatter has `status: contained`\.$' "$f"
  rg -n '^2\. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`\.$' "$f"
  rg -n '^3\. No later case has a `Resolves: <slug>` field naming the current case slug\.$' "$f"
done
```

Expected: both files contain the exact conjunctive scan rule. If any line is missing from either file, halt and repair the Tribune/CONVENTIONS rewrite.

- [ ] **Step 6: Validate legacy source deletion**

```bash
test ! -e /Users/milovan/projects/Consilium/docs/consilium/specs
test ! -e /Users/milovan/projects/Consilium/docs/consilium/plans
test ! -e /Users/milovan/projects/Consilium/docs/ideas
test ! -e /Users/milovan/projects/Consilium/docs/consilium/debugging-cases
test ! -e /Users/milovan/projects/Consilium/docs/consilium/pass-2
test ! -e /Users/milovan/projects/Consilium/docs/consilium
test ! -e /Users/milovan/projects/Consilium/skills/references/domain
test ! -e /Users/milovan/projects/Consilium/skills/tribune/references
test ! -e /Users/milovan/projects/Consilium/graphify-source
test ! -e /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium
```

- [ ] **Step 7: Validate marker is still blocking before final removal**

```bash
test -f /Users/milovan/projects/consilium-docs/.migration-in-progress
if CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs bash -c '
  [ -d "$CONSILIUM_DOCS" ] || exit 1
  [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || exit 1
  [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || exit 1
'; then
  echo "expected marker to block before removal" >&2
  exit 1
else
  echo "marker still blocks before final removal"
fi
```

Expected: marker blocks.

---

### Task 11: Commit, Remove Marker, And Prove Phase 0 Passes

> **Confidence: High** - commits happen while the marker still blocks fresh sessions; the marker is removed only after both repos have durable cutover commits.

**Files:**
- Delete: `/Users/milovan/projects/consilium-docs/.migration-in-progress`
- Commit: `/Users/milovan/projects/Consilium`
- Commit: `/Users/milovan/projects/consilium-docs`

- [ ] **Step 1: Close the main migration case while marker still blocks**

```bash
test -f /Users/milovan/projects/consilium-docs/.migration-in-progress
status=/Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/STATUS.md
ruby -e '
path = ARGV[0]
today = "2026-04-24"
text = File.read(path)
text.sub!(/^status: .*$/, "status: closed")
unless text.match?(/^closed_at:/)
  text.sub!(/^opened: .*$/, "\\0\nclosed_at: #{today}")
end
File.write(path, text)
' "$status"
cat > /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/retro.md <<'EOF'
# consilium-docs - Retrospective

## What we built

Split the original consilium-docs migration into Piece 1 bootstrap/preflight and Piece 2 guarded cutover, then moved Claude-Consilium runtime doctrine and case transport to `/Users/milovan/projects/consilium-docs`.

## What we learned

The migration marker only matters after Phase 0 guards exist in source and plugin cache. The safe shape is marker creation, guard-only install, negative halt simulation, then cutover.

## What would we do differently

Keep future migration plans from moving their own untracked source artifact without an explicit backup/recovery path.

## Patterns to promote

For runtime-surface migrations, require source/cache/user-agent snapshots, guard-first ordering, negative guard simulation, and a final global stale-reference gate.
EOF
rg -n '^status: closed$|^closed_at: 2026-04-24$' "$status"
test -f /Users/milovan/projects/consilium-docs/cases/2026-04-24-consilium-docs/retro.md
```

Expected: the main migration case is closed and has a retro before the final commits.

- [ ] **Step 2: Commit Consilium source cutover while marker still blocks**

```bash
test -f /Users/milovan/projects/consilium-docs/.migration-in-progress
git -C /Users/milovan/projects/Consilium add -A
git -C /Users/milovan/projects/Consilium commit -m "repoint Consilium runtime surfaces to consilium-docs"
git -C /Users/milovan/projects/Consilium status --short
```

Expected: commit succeeds; status is empty.

- [ ] **Step 3: Commit consilium-docs final state while marker still blocks**

```bash
test -f /Users/milovan/projects/consilium-docs/.migration-in-progress
git -C /Users/milovan/projects/consilium-docs add -A
git -C /Users/milovan/projects/consilium-docs commit -m "complete guarded Consilium docs cutover"
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: commit succeeds; status is empty. The ignored `.migration-in-progress` marker must not appear.

- [ ] **Step 4: Remove marker**

```bash
rm /Users/milovan/projects/consilium-docs/.migration-in-progress
test ! -e /Users/milovan/projects/consilium-docs/.migration-in-progress
```

- [ ] **Step 5: Positive Phase 0 simulation must pass**

```bash
CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs bash -c '
  [ -d "$CONSILIUM_DOCS" ] || exit 1
  [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || exit 1
  [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || exit 1
'
```

Expected: exit 0.

- [ ] **Step 6: Final runtime validation after marker removal**

```bash
python3 /Users/milovan/projects/Consilium/scripts/check-codex-drift.py
python3 /Users/milovan/projects/Consilium/scripts/check-tribune-staleness.py
matches=$(mktemp)
rg -n 'graphify|query_graph|get_neighbors|mcp__graphify|knowledge graph|skills/references/domain|skills/tribune/references|docs/consilium/debugging-cases|docs/consilium/specs|docs/consilium/plans|docs/ideas|docs/consilium/ROADMAP|~/\.codex/agents' \
  /Users/milovan/projects/Consilium/CLAUDE.md \
  /Users/milovan/projects/Consilium/AGENTS.md \
  /Users/milovan/projects/Consilium/docs \
  /Users/milovan/projects/Consilium/docs/CONSILIUM-VISION.md \
  /Users/milovan/projects/Consilium/skills \
  /Users/milovan/.claude/agents/consilium-*.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills > "$matches" || true
if [ -s "$matches" ]; then
  cat "$matches"
  rm -f "$matches"
  echo "stale runtime references remain after marker removal" >&2
  exit 1
fi
rm -f "$matches"
```

Expected: the two scripts exit 0 and the negative `rg` gate prints no matches.

- [ ] **Step 7: Verify final repo cleanliness**

```bash
git -C /Users/milovan/projects/consilium-docs status --short
git -C /Users/milovan/projects/Consilium status --short
```

Expected: both statuses are empty.

- [ ] **Step 8: Final report**

Report:
- Consilium commit SHA.
- consilium-docs commit SHA.
- Confirmation that `.migration-in-progress` is absent.
- Confirmation that Phase 0 positive simulation passed after marker removal.
- Confirmation that user-scope agent frontmatter parsed with Ruby.
- Confirmation that plugin cache mirrors source skills and root docs.
- Confirmation that runtime graph and legacy path `rg` gate returned no hits.
- Confirmation that `cases/2026-04-24-consilium-docs/STATUS.md` is `status: closed`.

## Confidence Map

- **High - Marker/guard ordering:** Split spec explicitly required marker creation, immediate guard install, negative halt simulation, and no path repoints before that check.
- **High - Piece 1 baseline:** `/Users/milovan/projects/consilium-docs` exists, is committed at `50fce07b5a41f7e4f01930bca88ef3948d856264`, and its runtime baseline file exists.
- **Medium - Historical case grouping:** Live file inventory is verified, but the case grouping is a planning judgment for old design artifacts.
- **Medium - Runtime prose rewrites:** Current hit lists are verified; final correctness depends on exhaustive edits plus zero-hit gates.
- **High - Frontmatter validation:** Ruby stdlib YAML is available and PyYAML is unavailable, so the validation path is concrete.
