# Consilium Docs Repo Split — Spec

> **Purpose:** This spec supersedes the execution boundary in `docs/consilium/plans/2026-04-24-consilium-docs-repo.md`. It does not replace the full consilium-docs migration design; it defines how to split execution safely after verification found the original Stage 2 marker ordering unsound.

## Goal

Split the consilium-docs migration into two separately executable pieces:

1. **Piece 1 — Bootstrap and preflight:** create the new `~/projects/consilium-docs` repo, write its skeleton docs and lifecycle scripts, smoke-test those scripts, and record a precise preflight inventory for the later cutover.
2. **Piece 2 — Atomic cutover:** in one uninterrupted migration session, install Phase 0 guards before relying on the marker, migrate/delete legacy docs and doctrine, repoint Claude-Consilium runtime surfaces, excise graphify, repair cache/user-scope agents, validate, and close the marker window.

Piece 1 must leave Claude-Consilium fully usable. Piece 2 may enter a forbidden window, but only after the guard exists in source and cache.

## Why the split changed

> **Confidence: High** — verified against the current plan and live skill files.

The current edict opens the forbidden window in Stage 2 by dropping `$CONSILIUM_DOCS/.migration-in-progress`, but the skills that read that marker are not edited until Stage 5. A marker no skill checks is only a file, not a guard.

Therefore the old split boundary, "Stage 1 then Stages 2-5," is acceptable only after Piece 2 is rewritten so Phase 0 lands before the marker is relied on. Until then, destructive work must not begin.

## Piece 1 Scope

> **Confidence: High** — non-destructive operations can ship without changing current runtime behavior.

Piece 1 creates the shared repo and proves the basic case-folder tooling works.

Allowed:

- Create `~/projects/consilium-docs/`.
- Initialize git in `~/projects/consilium-docs/`.
- Create `cases/`, `doctrine/`, `archive/`, and `scripts/`.
- Write `INDEX.md`, `CONVENTIONS.md`, `README.md`, `.gitignore`, and `.gitkeep` files where needed.
- Write lifecycle scripts:
  - `scripts/case-new`
  - `scripts/case-session`
  - `scripts/case-close`
- Smoke-test lifecycle scripts with temporary cases and clean those temporary cases afterward.
- Commit the new repo skeleton.
- Record a preflight inventory in `~/projects/consilium-docs/preflight/2026-04-24-cutover-inventory.md`.
- Record a runtime-surface hash baseline in `~/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256`.
- Optionally copy doctrine/reference files into a `preflight/` or inventory-only section for counting, but do not delete source files or make runtime paths depend on the copy.

Forbidden:

- Do not delete `skills/references/domain/`.
- Do not delete `skills/tribune/references/`.
- Do not delete `graphify-source/`.
- Do not remove or purge plugin cache.
- Do not edit `~/.claude/agents/`.
- Do not edit Consilium runtime skills as part of Piece 1.
- Do not create `.migration-in-progress`.
- Do not repoint any agent to `$CONSILIUM_DOCS`.

## Piece 1 Script Decisions

> **Confidence: Medium** — fixes verified findings while keeping Piece 1 small.

`case-new` must support both feature/infra and bug cases without creating state ambiguity.

Required interface:

```bash
scripts/case-new <slug> --target <target> --agent <agent> --type <feature|bug|infra|idea>
```

Behavior:

- `--type feature`, `--type infra`, and `--type idea` create `spec.md`.
- `--type bug` creates `diagnosis.md` instead of `spec.md`.
- All cases create `STATUS.md`.
- `case-close` classifies cases by explicit file shape:
  - `spec.md` present and `diagnosis.md` absent = feature/infra/idea retro discipline.
  - `diagnosis.md` present and `spec.md` absent = bug retro discipline.
  - both present = halt with an ambiguous-case error.
  - neither present = halt with an unclassifiable-case error.

This fixes the prior bug where `case-new` always created `spec.md`, causing bug cases to close as feature cases.

## Piece 1 Preflight Inventory

> **Confidence: High** — Piece 2 needs a map before it cuts.

`preflight/2026-04-24-cutover-inventory.md` must contain:

- Current Consilium git SHA and `git status --short` output.
- Whether `~/projects/consilium-docs` existed before Piece 1 started.
- The exact source doctrine paths that Piece 2 will later migrate:
  - `skills/references/domain/`
  - `skills/tribune/references/`
  - `graphify-source/`
- Counts of markdown files under those source paths.
- A list of current `docs/consilium/specs/*.md`, `docs/consilium/plans/*.md`, `docs/ideas/*.md`, and `docs/consilium/debugging-cases/*.md`.
- A list of current `~/.claude/agents/consilium-*.md` files.
- A list of current plugin-cache runtime files that are relevant to Piece 2:
  - `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md`
  - `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md`
  - `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium/ROADMAP.md`
  - `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/`
- A short "Piece 2 known hazards" section naming:
  - Phase 0 guard must be installed before marker reliance.
  - User-scope agent edits require a non-skippable frontmatter parse/validation gate.
  - Plugin cache sync must cover root docs if root docs are edited.

`preflight/2026-04-24-runtime-surface-baseline.sha256` must hash, at minimum:

- `/Users/milovan/projects/Consilium/skills/consul/SKILL.md`
- `/Users/milovan/projects/Consilium/skills/edicts/SKILL.md`
- `/Users/milovan/projects/Consilium/skills/tribune/SKILL.md`
- `/Users/milovan/projects/Consilium/skills/legion/SKILL.md`
- `/Users/milovan/projects/Consilium/skills/march/SKILL.md`
- `/Users/milovan/.claude/agents/consilium-*.md`
- `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md`
- `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md`
- `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium/ROADMAP.md`
- `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/*/SKILL.md`

Piece 1 must verify those hashes still match immediately before final summary. If any runtime-surface hash changes during Piece 1, halt and report the drift.

## Piece 1 Verification

> **Confidence: High** — local checks are sufficient because Piece 1 does not touch runtime paths.

Piece 1 is complete only when:

- `~/projects/consilium-docs` exists and is a git repo.
- `CONVENTIONS.md` line 1 contains `consilium-docs CONVENTIONS`.
- `.migration-in-progress` is absent.
- The three lifecycle scripts are executable.
- `preflight/2026-04-24-cutover-inventory.md` exists and contains all required inventory sections listed above.
- `preflight/2026-04-24-runtime-surface-baseline.sha256` exists and passes `shasum -a 256 -c`.
- Smoke tests prove:
  - feature case creation writes `STATUS.md` + `spec.md`.
  - bug case creation writes `STATUS.md` + `diagnosis.md` and no `spec.md`.
  - collision disambiguation appends `-2`.
  - `case-session` advances from implicit session 1 to `session-02-...`.
  - `case-close` blocks feature close until `retro.md` exists.
  - `case-close --skip-retro` works for bug cases only.
  - `case-close` halts when both `spec.md` and `diagnosis.md` exist.
  - `case-close` halts when neither `spec.md` nor `diagnosis.md` exists.
- Temporary smoke-test cases are removed before commit.
- Runtime surfaces are unchanged by hash verification:
  - Consilium runtime SKILLs.
  - `~/.claude/agents/consilium-*.md`.
  - relevant plugin-cache files.
- `git status --short` in `/Users/milovan/projects/Consilium` is unchanged except for this spec and the Piece 1 edict.
- `git status --short` in `~/projects/consilium-docs` is clean after its skeleton commit.

## Piece 2 Requirements

> **Confidence: High** — based on Censor/Provocator findings from the original edict review.

Piece 2 must be replanned before execution. Its edict must include these corrections:

- The first Piece 2 step must be a marker-and-guard bootstrap, not a path cutover.
- Create `.migration-in-progress` before installing any Phase 0 guard into source or cache. The marker is not relied on yet; it prevents newly installed guards from passing against the Piece 1 skeleton repo.
- Install Phase 0 marker checks into source and plugin cache immediately after marker creation, with no artifact-path repoints in the same edit.
- Do not commit, pause, or leave the session between marker creation and verified guard install. If interrupted before verification, remove the marker and revert guard-only edits before stopping.
- Before any path repoint, doctrine deletion, cache purge, or user-scope agent surgery, run a negative Phase 0 simulation from source/cache and expect it to halt because `.migration-in-progress` exists.
- The first Phase 0 pass check belongs only at the end of Piece 2 after the cutover is complete and the marker has been removed.
- Snapshot `~/.claude/agents/consilium-*.md` and the plugin cache before surgery.
- Treat PyYAML as unavailable unless a bundled or repo-local parser is installed during the plan; YAML/frontmatter validation must not be skippable.
- Preserve or explicitly replace the live Medicus scan constraints:
  - 90-day mtime cap.
  - no later case with `Resolves: <slug>`.
- Fix user-scope graphify excision instructions to cover every graphify hit, including Operational Doctrine/body prose, not only frontmatter, `mcpServers`, and Operational Notes.
- Sync plugin cache beyond `skills/` when source root docs are edited, or explicitly purge stale cached root docs.
- Add a final global `rg` gate over source runtime surfaces, user-scope agents, and plugin cache. Historical closed-case artifacts may be excluded only by explicit path allowlist.
- Do not split inside the marker window.

## Confidence Map

| Section | Confidence | Evidence |
|-|-|-|
| Split boundary | High | Original plan opens marker before Phase 0 exists; live skills have no marker guard |
| Piece 1 non-destructive scope | High | It creates only a new repo and new docs/scripts |
| Bug-case script correction | Medium | Required by spec's bug folder model; exact script body belongs in edict |
| Piece 2 correction list | High | Direct synthesis of Censor/Provocator findings and live repo checks |
