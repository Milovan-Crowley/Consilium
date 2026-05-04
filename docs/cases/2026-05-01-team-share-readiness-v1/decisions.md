---
case: 2026-05-01-team-share-readiness-v1
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

## Entry: 2026-05-03 - Verifier Blockers Patched Into Edict

**Type:** verdict
**Actor:** Custos, Praetor, Provocator
**Trigger:** Verifier pass over `plan.md` after Milovan asked to get verifiers on the edict.
**Decision:** Patch the edict before dispatch. The plan now includes a Task 0 dispatch baseline and `$CONSILIUM_DOCS` guard, corrected Claude plugin paths, Claude settings/plugin proof, Codex fresh-config and dry-run preflight proof, missed active source ownership, unsupported metadata cleanup, explicit `rg` exit handling, and scoped final active-surface review.
**Rationale:** The first verifier pass found dispatch blockers: dirty checkout proof would be noisy, `codex/scripts/validate_agents.py` did not exist, `.claude-plugin` paths were wrong, `$CONSILIUM_DOCS` guard was incomplete, `rg` checks could false-fail, Codex could partially install before config sync failed, active source missed `.superpowers` and Milovan-only paths, and final stale scans were overbroad.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Second-Pass Blockers Patched

**Type:** verdict
**Actor:** Custos, Praetor
**Trigger:** Second-pass verification over the revised `plan.md`.
**Decision:** Patch the remaining dispatch blockers before calling the edict ready. Task 0 now includes the full `CONVENTIONS.md` marker and `.migration-in-progress` guard. Task 5 now owns `source/doctrine/backend.md` and `source/doctrine/frontend.md`. Task 4 makes `install-codex.sh --dry-run` explicit. The final active-surface scan now includes `runtimes/scripts`.
**Rationale:** Second-pass verifiers found that active doctrine files still had no owner for Milovan-only path cleanup, the shared-docs guard checked only for `spec.md`, `--dry-run` needed to be explicit on the Codex installer, and `runtimes/scripts` was missing from the final active-surface scan.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Bounded Phalanx Wave Declared

**Type:** decision
**Actor:** Imperator
**Trigger:** Milovan challenged the no-wave assumption after reviewing the edict execution mode.
**Decision:** Declare a bounded `consilium:phalanx` wave for Tasks 1-4 only, after Task 0 dispatch baseline and shared-docs guard pass. Resume `consilium:legion` for Tasks 5-8.
**Rationale:** Tasks 1-4 have disjoint write sets and explicit `Read:` declarations. Later tasks depend on the combined runtime/source state and must remain sequential: active source cleanup, unsupported-surface retirement, generation, installed proof, and status recording.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Wave Read Overlap Patched

**Type:** verdict
**Actor:** Praetor
**Trigger:** Narrow wave-callout verification after the bounded Phalanx wave was added.
**Decision:** Keep the Tasks 1-4 wave, but narrow Task 1 reads to stable contract files only: `spec.md`, `plan.md`, `STATUS.md`, and `docs/CONVENTIONS.md`.
**Rationale:** Praetor found Task 1 was reading files modified by sibling wave tasks: `docs/README.md`, `codex/README.md`, `claude/AGENTS.md`, and `claude/CLAUDE.md`. That made the original wave unsafe even though write sets were disjoint.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Praetor Validated Phalanx Wave

**Type:** verdict
**Actor:** Praetor
**Trigger:** Re-check after Task 1 reads were narrowed to stable contract files.
**Decision:** Treat the bounded Tasks 1-4 wave as phalanx-safe after Task 0 passes.
**Rationale:** Praetor returned SOUND: Tasks 1-4 have disjoint write sets, explicit `Read:` declarations, no read/write overlap after the Task 1 patch, no hidden sequential dependency inside the wave, and the plan returns to `consilium:legion` for Tasks 5-8.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Task 4 Wave Verification Narrowed

**Type:** decision
**Actor:** Consul
**Trigger:** Pre-dispatch review before launching the Tasks 1-4 Phalanx wave.
**Decision:** Narrow Task 4 verification during the parallel wave to no-write syntax, fixture, and dry-run checks. Leave real generation to Task 7 and installed user-home proof to Task 8.
**Rationale:** The Task 4 implementation owns Codex packaging scripts, but running real generation or installed proof inside the parallel wave would create shared side effects outside the wave task's write set. The final readiness proof remains covered by Tasks 7-8.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Codex Agent Validation Command Aligned

**Type:** decision
**Actor:** Consul
**Trigger:** Execution-time review before Task 7.
**Decision:** Update Task 7 verification to call `bash codex/scripts/install-codex-agents.sh --validate-only` instead of `--dry-run`.
**Rationale:** Task 4 implemented the Codex agent installer no-write mode as `--validate-only`, while the plan still referenced `--dry-run` for that specific script. The top-level Codex installer still uses `--dry-run`.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Orphan Release Tool Retired

**Type:** verdict
**Actor:** Tribunus
**Trigger:** Task 6 verification after `.version-bump.json` was deleted.
**Decision:** Add `claude/scripts/bump-version.sh` to Task 6 and retire it with the inherited release metadata.
**Rationale:** Tribunus returned CONCERN because deleting `.version-bump.json` left `claude/scripts/bump-version.sh` as a broken active-looking release tool. This repo does not need inherited release tooling for internal team-share readiness.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Installed Checker Flags Patched

**Type:** decision
**Actor:** Consul
**Trigger:** Task 8 installed proof initially exposed checker CLI mismatches.
**Decision:** Add `--installed` compatibility support to `claude/scripts/check-claude-install.py` and `codex/scripts/check-codex-config-portability.py`, then rerun the installed gate under `set -euo pipefail`.
**Rationale:** The edict's installed proof called both checkers with `--installed`. The first installed run showed both flags were missing even though the underlying installs were otherwise progressing. Supporting the installed mode keeps the plan commands accurate and makes future readiness proof fail-fast.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Campaign Review Gaps Patched

**Type:** verdict
**Actor:** Censor, Provocator, Praetor
**Trigger:** Final campaign review returned gaps after implementation proof.
**Decision:** Patch the remaining readiness gaps before closing: make `codex/README.md` commands valid from repo root, remove `consilium-principales` from the active Claude Tribunus MCP list for V1, preflight Claude settings JSON before install writes, and record exact Task 8 scan/status output in `STATUS.md`.
**Rationale:** Censor found stale `codex/README.md` `scripts/...` commands. Provocator found an active Claude Tribunus MCP dependency that the V1 install path did not install/build/register and a partial-mutation risk in the Claude installer. Praetor found that `STATUS.md` summarized final scan/status proof instead of recording exact command/output.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Shipped Claude Trap Surfaces Removed

**Type:** verdict
**Actor:** Censor, Praetor, Provocator
**Trigger:** Final campaign review after the first patch round.
**Decision:** Remove the stale Claude docs directory, remove the `claude/mcps/principales/` MCP substrate from the shipped Claude plugin tree, remove the old `claude/scripts/check-codex-drift.py` alias, fix `codex/scripts/install-codex-skills.sh --help`, and make the Claude install checker fail if the retired plugin paths reappear.
**Rationale:** The Claude installer symlinks the whole `claude/` directory into the user plugin path, so old docs and MCP substrate files were still shipped to Gavin or Ivan even if the active manifest did not reference them. Keeping them visible made V1 look broader and sloppier than the approved Claude + Codex internal-team scope.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Dirty Baseline Limitation Recorded

**Type:** decision
**Actor:** Consul
**Trigger:** Provocator challenged whether the Task 0 dirty baseline could prove unrelated dirty files were untouched.
**Decision:** Record the baseline limitation explicitly instead of claiming stronger proof than exists.
**Rationale:** `dispatch-baseline.md` captured `git status --short`, not content hashes. That is sufficient to classify unrelated paths as out-of-scope baseline noise, but it cannot prove byte-for-byte preservation for files that were already dirty before dispatch.
**Plan SHA:** unavailable-pre-commit-new-file

## Entry: 2026-05-03 - Final Campaign Review SOUND

**Type:** verdict
**Actor:** Censor, Praetor, Provocator
**Trigger:** Narrow final re-check after shipped Claude trap surfaces were removed.
**Decision:** Close the Team-Share Readiness V1 implementation as SOUND.
**Rationale:** Praetor verified exact status proof and installed/repo-local gates. Provocator verified the shipped Claude plugin no longer exposes `mcps/principales`, stale docs, or the old drift-check alias. Censor verified the implemented state matches the internal-team Claude + Codex V1 contract.
**Plan SHA:** unavailable-pre-commit-new-file
