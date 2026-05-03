# Team-Share Readiness V1 — Light Draft

## Status

Draft only. Do not issue edicts from this version.

Milovan is about to make runtime-level changes around hooks, output types, and active surfaces. This spec preserves the current reconnaissance and decisions so the later cleanup campaign starts from the right intent, not from stale context.

## Intent

Make the Consilium repo solid enough for Gavin and Ivan to use internally without Milovan needing to narrate the repo history.

The bar is not public/open-source polish. The bar is internal production quality: clear first-clone orientation, coherent Claude and Codex setup, no active docs pointing to the wrong upstream project, and a clean explanation of what is source, what is generated, and what is install output.

## Audience

- Milovan
- Gavin
- Ivan

This is never a public-share campaign. Public packaging, public docs, public security scrub, and broad open-source contributor polish are out of scope.

## Current Recon Verdict

The runtime core is real. The first-clone surface is not ready.

Things that looked strong in reconnaissance:

- Root `source/` is the canonical prompt and role source.
- Root `generated/` carries generated runtime outputs.
- `codex/README.md` already explains much of the Codex source/generated/install model.
- `docs/CONVENTIONS.md` gives the case-folder model, status schema, and `$CONSILIUM_DOCS` identity marker.
- Runtime parity checks passed locally during reconnaissance.

Things that would make a teammate think the repo is mid-transition:

- No root `README.md`, root `AGENTS.md`, or root `CLAUDE.md` exists.
- `claude/README.md` still presents the project as Superpowers and points at upstream Superpowers install flows.
- `claude/.codex/INSTALL.md`, `claude/.opencode/INSTALL.md`, and `claude/docs/README.codex.md` still point at Superpowers-era setup.
- `claude/hooks/session-start` still injects `using-superpowers` and currently reads a missing skill path.
- `docs/README.md` still says the docs are local-only with no GitHub remote.
- Local `main` is ahead of `origin/main`, with unrelated current case work present; current case cleanup is explicitly out of scope for this campaign.

## Decisions Already Made

1. Internal team only. The repo should feel solid, but it does not need public/open-source packaging.
2. Claude and Codex are the only supported runtimes for V1.
3. Cursor, OpenCode, and other inherited runtime surfaces should not be kept alive by default.
4. Existing case history is useful and should stay visible as planning/spec history.
5. Current dirty or untracked case docs are out of scope for this cleanup.
6. This draft stays high-level. Edicts should produce the implementation plan after runtime changes land.

## Runtime Prerequisite

Milovan intends to make runtime changes first. The final spec must be written against that updated reality.

Known prerequisite category:

- hooks
- output types
- active Claude/Codex runtime shape
- install-facing behavior if those changes alter setup

The later hardened spec must re-check active runtime truth before ordering any cleanup. Do not preserve stale hook or install behavior just because this draft named it.

## Phalanx-Oriented Cleanup Lanes

These lanes are intended to become independent implementation tracks after runtime changes land.

### Lane 1: Root Orientation

Outcome: a teammate can open the repo root and understand the project.

Likely scope:

- root `README.md`
- root `AGENTS.md`
- optional root `CLAUDE.md` if Claude should load repo-level rules from the root
- source/generated/install-output map
- "what to edit" and "what not to edit" guidance

### Lane 2: Claude Runtime Packaging

Outcome: Claude-facing files describe Consilium, not Superpowers.

Likely scope:

- `claude/README.md`
- Claude plugin metadata where active
- active Claude install/reload docs
- inherited hook behavior after Milovan's runtime changes land

Open point: identify exactly which Superpowers-derived Claude files are useful and which are trash before deleting or rewriting.

### Lane 3: Codex Runtime Packaging

Outcome: Codex setup works for Gavin and Ivan without relying on Milovan-only assumptions.

Likely scope:

- `codex/README.md`
- `codex/scripts/install-codex.sh`
- `codex/scripts/install-codex-agents.sh`
- `codex/scripts/install-codex-skills.sh`
- `codex/scripts/sync-codex-config.py`
- generated Codex config behavior, if runtime changes touch it

### Lane 4: Inherited Surface Triage

Outcome: leftover Superpowers surfaces are either useful and rewritten, or removed.

Likely scope:

- `.codex` and `.opencode` install docs under `claude/`
- Cursor/OpenCode metadata if no longer supported
- release notes and docs that only describe upstream Superpowers
- visual companion assets that still say Superpowers, if the visual companion remains active

Rule: no quarantine by default. Keep useful files by making them Consilium-correct. Remove unused files.

### Lane 5: Docs And Case Presentation

Outcome: case history remains useful without confusing first-time readers.

Likely scope:

- `docs/README.md`
- `docs/INDEX.md`
- possibly a short note explaining that `docs/cases/` is planning/spec history, not onboarding
- status convention drift only if it affects current team use

Current case cleanup remains out of scope unless Milovan explicitly widens the lane.

### Lane 6: Final Readiness Gate

Outcome: one command/checklist proves the repo is ready for Gavin and Ivan.

Likely scope:

- runtime parity checks
- Codex shared-docs checks
- Claude hook/install smoke check after runtime changes
- root docs smoke read
- `git status` expectation for the share branch

This lane should verify the campaign, not invent new cleanup.

## Reference Evidence For Final Spec

Re-check these before hardening the spec:

- `claude/README.md` - currently stale Superpowers-facing docs.
- `claude/.codex/INSTALL.md` - currently stale Superpowers Codex install instructions.
- `claude/.opencode/INSTALL.md` - likely unsupported if Claude/Codex only remains the V1 decision.
- `claude/docs/README.codex.md` - currently stale Superpowers Codex guide.
- `claude/hooks/session-start` - currently injects missing `using-superpowers` content.
- `codex/README.md` - mostly solid, but command paths and teammate portability need a fresh check.
- `codex/scripts/sync-codex-config.py` - needs fresh-user behavior checked if Codex install remains in scope.
- `generated/codex/config/codex-config-snippet.toml` - check whether generated paths should be user-portable after runtime changes.
- `docs/README.md` - currently says local-only/no GitHub remote.
- `docs/CONVENTIONS.md` - keep as the source for case history expectations.

Relevant prior case references:

- `docs/cases/2026-04-29-codex-drift-reconciliation/`
- `docs/cases/2026-04-29-consilium-runtime-unification/`
- `docs/cases/2026-04-30-consilium-right-sized-edicts/`
- `docs/cases/2026-04-29-consilium-minimality-contract/`
- `docs/cases/2026-04-28-consilium-simplification/`

## Non-Goals

- Public release readiness.
- Publishing or reconciling current unrelated case docs.
- Removing useful case history.
- Keeping Cursor/OpenCode alive unless Milovan reverses the V1 runtime decision.
- Implementing runtime hook/output changes inside this cleanup campaign before Milovan finishes the separate runtime work.

## Success Criteria

- Gavin or Ivan can read the root entrypoint and understand the repo in five minutes.
- Claude and Codex are the only presented V1 runtimes.
- No active first-party install doc tells them to install upstream Superpowers.
- Active hooks do not inject stale or missing Superpowers content.
- Source, generated output, compatibility copies, and installed runtime files are clearly distinguished.
- Case history remains available and intentionally framed.
- The final share branch passes the agreed readiness gate after runtime changes land.
