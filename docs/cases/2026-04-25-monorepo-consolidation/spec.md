# Consilium Monorepo Consolidation — Spec

> **Purpose:** Consolidate three local repos (`Consilium`, `Consilium-codex`, `consilium-docs`) into a single private monorepo at `github.com/Milovan-Crowley/Consilium`, structured to support multiple AI runtimes, runtime-agnostic doctrine, and external collaboration without breaking the live system at any step.

> **Revision note (2026-04-25):** Spec updated after Censor + Provocator verification. GAPs addressed inline; CONCERNs evaluated and adopted where they tightened the migration. Provocator marked the core build-alongside/swap-last architecture SOUND; the verifier work was concentrated in execution detail.

## Goal

Produce a single repository whose layout cleanly separates runtime-tuned source from runtime-agnostic doctrine, eliminates the manual plugin-cache copy maintenance step, and is ready to absorb a third runtime (Kimi 2.6) by adding one subdirectory.

## Drivers

> **Confidence: High** — stated by the Imperator in the deliberation.

1. **Cognitive load.** Managing two runtime repos plus a docs repo creates "which config does what" friction the Imperator wants to eliminate.
2. **Kimi 2.6 onboarding.** A third runtime is being added soon for cost offload of grunt work; integrating it should not require a fourth repo.
3. **External collaboration.** Gavin will contribute cases that benefit both his agents and the Imperator's; doctrine must be in a single GitHub-tracked, push-accessible location.
4. **Plugin-cache copy chore.** The manual sync step (`cp skills/<skill>/SKILL.md ~/.claude/plugins/cache/...`) is a daily friction with a one-time fix.

## Final repository structure

> **Confidence: High** — recon by `consilium-scout` confirmed runtime-tuned source files differ substantively between Claude and Codex (Claude personas 78–212 lines vs Codex 22–125 lines, three Claude personas have no Codex equivalent, verification decomposed differently). Subdirs **support** the "do not share prompt source files" rule from `Consilium-codex/README.md` by separating runtime source into different directory trees. Subdirs do not enforce the rule structurally — they make accidental cross-runtime copies harder and easier to detect via git diff, but the rule remains a discipline-level convention. A pre-commit hook to fail commits touching both `claude/skills/` and `codex/skills/` is **out of scope** for this migration; if needed it ships as a follow-up case.

```
Consilium/
├── claude/                       # Claude Code-tuned source
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   ├── scripts/                  # Claude-specific (bump-version.sh)
│   └── .claude-plugin/
├── codex/                        # Codex-tuned source
│   ├── source/
│   │   ├── roles/
│   │   ├── doctrine/
│   │   ├── protocols/
│   │   └── manifest.json
│   ├── agents/                   # generated TOML output (per existing Codex install convention)
│   ├── skills/
│   ├── scripts/                  # Codex-specific install/regenerate scripts
│   ├── config/
│   └── evals/
└── docs/                         # was consilium-docs — runtime-agnostic
    ├── doctrine/
    ├── cases/
    ├── archive/
    ├── preflight/
    ├── codex.md                  # the jurisprudence Codex (moved per Imperator option A)
    └── CONVENTIONS.md
```

**Note on scripts placement (corrected during edicts):** `check-codex-drift.py` and `check-tribune-staleness.py` are Claude-specific (they validate Claude user-scope agents and the Claude tribune skill/plugin-cache respectively), not cross-runtime. They stay in `claude/scripts/` alongside `bump-version.sh`. Codex-specific scripts stay in `codex/scripts/`. A root `Consilium/scripts/` directory is NOT created in this migration — it can be added in a follow-up if true cross-runtime tooling emerges.

## Imperator decisions (baked in)

> **Confidence: High** — explicit Imperator answers during deliberation.

1. **Codex jurisprudence document** (`consilium-codex.md`) → moves to `docs/codex.md`. Both runtimes reference the canonical location. The drift check is updated to validate runtime mirrors against this canonical source.
2. **Gavin's GitHub access** → full collaborator. No CODEOWNERS, no branch protection. Imperator's stated trust: *"He can push he isn't an idiot and I'll always have my local copy as backup."*
3. **Historical hardcoded paths in case files** (~795 references in immutable case plans) → leave as-is. Treat case files as historical artifacts.
4. **Git history** → accept reset. Force-push a single fresh commit to the existing GitHub repo. Per-file pre-monorepo history is not preserved; original local repos remain available as offline reference.
5. **`target` enum in `docs/CONVENTIONS.md`** → defer. Existing `target: consilium` value remains valid for runtime-agnostic case work. New values (`consilium-claude`, `consilium-codex`) may be added later if a case needs the distinction. Out of scope for this migration.

## Migration sequence

> **Confidence: High** — sequenced to keep the live system running off a working repo at every step. Old layout serves until new layout is verified; swap is the only point of cutover.

### Stage 1 — De-risk the plugin cache symlink mechanism

> **Confidence: High** — Stage 1 validates only the symlink-following mechanism, not the post-migration deployment scenario. The post-migration deployment is validated in Stage 6.

Steps:
- Confirm `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` is a regular directory (verified: it is).
- `rm -rf` the cache directory.
- `ln -s /Users/milovan/projects/Consilium ~/.claude/plugins/cache/consilium-local/consilium/1.0.0`
- Open a fresh Claude Code session and invoke `/consul`. If the skill loads, the symlink-following mechanism is validated.
- If the skill fails to load, revert: `rm` the symlink, recreate the directory, `cp -R Consilium/* 1.0.0/`. Migration continues without the symlink win; the cp-to-cache maintenance step survives.

This stage runs against the **existing** repo layout and tests symlink-to-repo-root only. The post-migration scenario (symlink-to-subdirectory) is validated separately in Stage 6 before the swap commits.

### Stage 2 — Build new monorepo alongside the old

> **Confidence: High** — destructive operations are deferred until after verification (Stage 7). Use `cp -aR` (or `rsync -a`) to preserve dotfiles, mode bits, executable flags, and timestamps. Default `cp -R` with `*` glob excludes dotfiles on macOS and will silently drop `.gitignore`, `.gitattributes`, and similar.

Steps:
- `mkdir -p /Users/milovan/projects/Consilium-new/{claude,codex,docs,scripts}`
- `rsync -a --exclude='.serena/' --exclude='.git/' /Users/milovan/projects/Consilium/ /Users/milovan/projects/Consilium-new/claude/`
- `rsync -a --exclude='.serena/' --exclude='.git/' /Users/milovan/projects/Consilium-codex/ /Users/milovan/projects/Consilium-new/codex/`
- `rsync -a --exclude='.serena/' --exclude='.git/' /Users/milovan/projects/consilium-docs/ /Users/milovan/projects/Consilium-new/docs/`
- All scripts in `Consilium-new/claude/scripts/` stay where they are (no hoist). `check-codex-drift.py`, `check-tribune-staleness.py`, and `bump-version.sh` are all Claude-specific and remain under `claude/scripts/`.
- Old repos remain untouched until Stage 8.

### Stage 3 — Move Codex jurisprudence to `docs/codex.md`

> **Confidence: High** — explicit Imperator option A; aligns with the doctrine that the Codex defines the four finding categories used by both runtimes.

Steps:
- `mv Consilium-new/claude/skills/references/personas/consilium-codex.md Consilium-new/docs/codex.md`
- Update `Consilium-new/claude/scripts/check-codex-drift.py`:
  - Change `CANONICAL = Path.home() / "projects" / "Consilium" / "skills" / "references" / "personas" / "consilium-codex.md"` (current line 26) to `CANONICAL = Path.home() / "projects" / "Consilium" / "docs" / "codex.md"`.
  - Iteration loop over `AGENTS = ["censor", "praetor", "provocator", "tribunus", "soldier", "custos"]` continues unchanged — it validates Claude user-scope agents at `~/.claude/agents/consilium-{name}.md`.
- "Codex-side equivalents" clarification: the Codex runtime does not have user-scope agent files mirroring a single jurisprudence doc; instead, the jurisprudence concepts are baked into Codex source files at `Consilium-new/codex/source/doctrine/` (compiled into the 15 generated TOMLs by `generate_agents.py`). The drift check is **not** extended to validate Codex source against `docs/codex.md` in this migration — Codex source has its own structure (`source/doctrine/{verifier,execution,retrieval,arbitration,orchestration}-law.md`) that is intentionally tuned, not mirrored. If a future case decides Codex source must mirror canonical jurisprudence, it ships as a follow-up.

### Stage 4 — Rewrite active hardcoded paths

> **Confidence: High** — rewrite scope expanded after Censor/Provocator verification surfaced 4× more references than the initial enumeration. Counts below are verified by ripgrep against the source repos.

#### Stage 4a — Claude-side rewrites (in `Consilium-new/claude/`)

Each `/Users/milovan/projects/Consilium` reference is rewritten to `/Users/milovan/projects/Consilium/claude` where the reference targets a runtime-specific path under the old `Consilium/`, or to `/Users/milovan/projects/Consilium` where the reference targets the repo root post-monorepo.

- `skills/legion/SKILL.md` — 7 refs
- `skills/edicts/SKILL.md` — 2 refs
- `skills/consul/SKILL.md` — 2 refs
- `skills/tribune/SKILL.md` — 1 ref
- `docs/claude-subagents-mcp-findings.md` — 1 ref
- `CLAUDE.md` Maintenance section — repoint Repos subsection to monorepo paths; remove "Plugin cache sync" subsection (replaced by symlink); add note that `docs/codex.md` is the canonical jurisprudence source.

#### Stage 4b — Codex-side rewrites (in `Consilium-new/codex/`)

Each `/Users/milovan/projects/Consilium-codex` reference is rewritten to `/Users/milovan/projects/Consilium/codex`. References to `/Users/milovan/projects/Consilium/skills/...` (used as a "Claude-side, not Codex-side" discriminator in routing protocols) are rewritten to `/Users/milovan/projects/Consilium/claude/skills/...`.

- `source/doctrine/common.md` — **1 ref, critical**: contains the `${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}` Phase 0 fallback that propagates into ALL 15 generated agent TOMLs. Rewrite to `${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}`. Stage 6 install regenerates TOMLs and propagates the new fallback to `~/.codex/agents/consilium-*.toml`.
- `source/protocols/consul-routing.md` — 2 refs (lines 20–21): the Codex Tribune discriminator. Rewrite both:
  - `Consilium-codex/skills/tribune` → `Consilium/codex/skills/tribune`
  - `Consilium/skills/tribune` → `Consilium/claude/skills/tribune`
- `agents/consilium-consul.toml` — generated artifact; will regenerate from updated source via Stage 6 install. No manual edit needed if `generate_agents.py` runs cleanly. Document the regen step.
- `scripts/check-shared-docs-adoption.py` — 1 ref to `/Users/milovan/projects/Consilium-codex/docs/consilium`. This is a **safety guard** banning a stale local-docs path. Rewrite the regex target from `Consilium-codex/docs/consilium` to `Consilium/codex/docs/consilium` so the guard continues to ban stale local-docs paths in the new layout. Do **not** delete the regex; it still serves a purpose.
- `scripts/check-tribune-shared-docs.py` — review for analogous patterns; rewrite stale-path bans similarly.
- `evals/tasks/16-install-staleness.md` — 1 ref
- `README.md` — 2 refs; also update the line 43 hardcoded `$CONSILIUM_DOCS` default to point at `~/projects/Consilium/docs`.
- `RANK-MAPPING-AUDIT.md` — **leave as-is** (per Censor finding). This document is a historical audit specifically about the two repos being separate; rewriting paths in place erodes its provenance. Add to historical-artifact exclusions, same treatment as case files.

#### Stage 4c — User-scope agent rewrites

> Verified false: spec's prior assumption that `~/.claude/agents/consilium-*.md` files contain no repo paths. The soldier agent does.

- `~/.claude/agents/consilium-soldier.md` line 329:
  - `/Users/milovan/projects/Consilium/skills/gladius/SKILL.md` → `/Users/milovan/projects/Consilium/claude/skills/gladius/SKILL.md`
  - `/Users/milovan/projects/Consilium/skills/tribune/SKILL.md` → `/Users/milovan/projects/Consilium/claude/skills/tribune/SKILL.md`
- Audit all seven user-scope agents (`consilium-{tribunus,scout,censor,praetor,provocator,soldier,custos}.md`) for any other `/Users/milovan/projects/Consilium` references. Rewrite each to `/Users/milovan/projects/Consilium/claude/...`.

#### Stage 4d — Claude-side maintenance script rewrites (in `Consilium-new/claude/scripts/`)

- `check-codex-drift.py` — already updated in Stage 3 (CANONICAL repointed to `docs/codex.md`).
- `check-tribune-staleness.py` — line 24: `CONSILIUM_DOCS = Path("/Users/milovan/projects/consilium-docs")` is hardcoded. Refactor to read from the env var: `CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", str(Path.home() / "projects" / "Consilium" / "docs")))`. Add `import os` at the top if not already present. This matches the runtime resolution pattern used everywhere else and is portable across machines. Note: `TRIBUNE_DIR = REPO_ROOT / "skills" / "tribune"` continues to resolve correctly since `REPO_ROOT = Path(__file__).resolve().parent.parent` becomes `Consilium/claude/` post-migration (script lives at `claude/scripts/check-tribune-staleness.py`).

#### Stage 4e — Historical-artifact exclusions

The following are NOT rewritten (per Imperator decision 3 + new additions from Censor):

- `Consilium-new/codex/docs/consilium/plans/2026-04-23-tribune-phase-{1,2}-*.md` — historical edict files.
- `Consilium-new/codex/RANK-MAPPING-AUDIT.md` — historical audit document (Censor finding).
- All case files under `Consilium-new/docs/cases/*/` — historical case artifacts.

### Stage 5 — `git init` and force-push to GitHub

> **Confidence: High** — Imperator explicitly accepted history reset. **Acknowledged consequences:** GitHub-side state beyond commits (issues, releases, GitHub Actions history, PR refs to old commit SHAs, webhook deliveries) is overwritten. Old `Consilium` repo had 163 commits visible to anyone with collaborator access; force-push replaces them with one fresh commit. **First-time GitHub exposure of consilium-docs content** is also a consequence: doctrine + cases have never been pushed to a remote before. Imperator accepted this implicitly via decision 2 (Gavin = full collaborator).

Steps:
- `cd Consilium-new`
- `.gitignore` audit: ensure `.serena/`, `node_modules/`, `__pycache__/`, `*.pyc`, `.DS_Store` are ignored. Merge `.gitignore` content from the three source repos.
- `git init -b main` (force the local branch name to `main`; protects against systems with `master` default).
- `git remote add origin https://github.com/Milovan-Crowley/Consilium.git`
- `git add -A`
- `git commit -m "feat: consolidate into monorepo with claude/, codex/, docs/, scripts/ subdirs"`
- `git push -u --force origin main` (`-u` sets upstream tracking for future plain `git push`; `--force` overwrites the existing remote `main`).

If the push fails mid-network, the GitHub repo may be in an inconsistent state. Recovery: `git push -u --force origin main` again from the same local commit. The commit SHA is stable in `Consilium-new/.git/`; retry is idempotent.

### Stage 6 — Verify the new repo in isolation

> **Confidence: High** — every runtime surface, maintenance check, and content-fidelity validator is exercised before the swap. File-count assertion alone is insufficient; this stage now adds content-hash validation and a real subagent dispatch.

Steps:
- Repoint plugin cache symlink: `rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0` then `ln -s /Users/milovan/projects/Consilium-new/claude /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0`. **This validates the symlink-to-subdirectory deployment scenario** (which Stage 1 did not).
- Update shell config: `export CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs` (in `~/.zshrc` or equivalent). Source the config in a fresh shell.
- **Unique-marker check** (catches stale `$CONSILIUM_DOCS` resolution): write a temporary unique marker into `Consilium-new/docs/CONVENTIONS.md` (e.g., a comment like `<!-- migration-marker-2026-04-25 -->` near the top, AFTER the canonical marker line). In a fresh Consul/Tribune session, verify Phase 0 reads the file containing the temporary marker. Remove the marker after verification.
- Open a fresh Claude Code session in `Consilium-new/`. Run:
  - `/consul` — must load and clear Phase 0.
  - `/tribune` — must load and clear Phase 0.
  - **Real subagent dispatch:** `/checkit` (or any spec-verifier dispatch) against a tiny throwaway artifact. This exercises the user-scope agent files at `~/.claude/agents/consilium-*.md` end-to-end, not just skill loading. A `/consul` skill load alone does not validate that the user-scope agents work post-migration.
- Run Codex install: `cd Consilium-new/codex && bash scripts/install-codex.sh`. Verify `~/.codex/agents/consilium-*.toml` files repopulate. Spot-check 3 of the 15 TOMLs to confirm the `${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}` fallback is now present (not the old `/Users/milovan/projects/consilium-docs`).
- Run cross-runtime maintenance:
  - `python3 Consilium-new/claude/scripts/check-codex-drift.py` — passes against `docs/codex.md` as canonical.
  - `python3 Consilium-new/claude/scripts/check-tribune-staleness.py` — passes (now reads from env var).
- **Content-fidelity validation:** beyond file count, run `find Consilium-new -type f -not -path '*.git*' -not -path '*.serena*' | sort | xargs sha256sum > /tmp/new-hashes.txt` and an equivalent rooted at the source repos, then `diff` the file lists (paths normalized) and verify hashes match for files that were copied unchanged. Files modified in Stages 3–4 will diff; that is expected and the diff itself is the audit log.
- Verify `consilium-marketplace/consilium` symlink target. It currently points at `/Users/milovan/projects/Consilium`; after Stage 7 swap that path will contain the new monorepo, so the symlink will follow correctly. No retarget needed at Stage 6.

If any check fails, fix in `Consilium-new/`, re-run. Old `Consilium/`, `Consilium-codex/`, and `consilium-docs/` remain available as the live working copy until Stage 7.

### Stage 7 — Swap

> **Confidence: High** — single atomic-as-possible rename sequence with explicit pre-swap and post-swap discipline. Acknowledged: between the two `mv` operations there is a brief window (sub-second) where `Consilium/` does not exist. Any Claude Code or Codex session running during the swap may have stale path resolutions. Mitigation: close all Claude Code and Codex sessions before swap.

Pre-swap:
- Close all Claude Code sessions and Codex agent sessions.
- Confirm Stage 6 verification all passed.

Steps:
- `mv /Users/milovan/projects/Consilium /Users/milovan/projects/Consilium-old`
- `mv /Users/milovan/projects/Consilium-new /Users/milovan/projects/Consilium`
- Update plugin cache symlink target: `rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0` then `ln -s /Users/milovan/projects/Consilium/claude /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0`.
- Update shell config: `CONSILIUM_DOCS=/Users/milovan/projects/Consilium/docs`. Re-source.
- Re-run Codex install from new location: `bash /Users/milovan/projects/Consilium/codex/scripts/install-codex.sh`. This retargets the `~/.agents/skills/tribune` symlink (currently → `Consilium-codex/skills/tribune`) to point at `Consilium/codex/skills/tribune` via `ln -sfn` in `install-codex-skills.sh`.
- `consilium-marketplace/consilium` symlink: target is `/Users/milovan/projects/Consilium`, which now contains the new monorepo — symlink follows correctly. **Verify** by `ls -la /Users/milovan/projects/consilium-marketplace/consilium/` resolves to the new monorepo content.
- Final smoke test: fresh Claude Code session in `Consilium/`, run `/consul`, confirm Phase 0 clears and skill loads. Run `/checkit` against a tiny throwaway artifact — confirm a Censor dispatch returns successfully.

### Stage 8 — Cleanup (deferred 24–48 hours)

> **Confidence: Medium** — confidence period gives the Imperator time to surface any breakage before destructive cleanup. **Soft-rollback caveat:** if Mil edits files in the new monorepo between Stage 7 and Stage 8, those edits are NOT in `Consilium-old/`. Rollback to `Consilium-old/` discards post-swap work. **Mitigation:** commit the new monorepo to git regularly during the confidence period — `git push origin main` from the monorepo is the real rollback path (you can `git reset --hard <pre-Stage-5-commit>` and restore old layout, then re-push the work-in-progress).

After 24–48 hours of confident daily use:
- Optionally `git bundle create consilium-old.bundle --all` from each old repo for offline backup.
- `rm -rf /Users/milovan/projects/Consilium-old`
- `rm -rf /Users/milovan/projects/Consilium-codex`
- `rm -rf /Users/milovan/projects/consilium-docs`

If anything breaks during the confidence period that can't be fixed forward, revert by:
- `mv Consilium Consilium-broken-monorepo`
- `mv Consilium-old Consilium`
- Restore the other two original directories from local copies (still present until Stage 8 cleanup).
- Repoint plugin cache symlink and `$CONSILIUM_DOCS` env var to old paths.
- Re-run Codex install from `Consilium-codex/scripts/install-codex.sh` to retarget agent + skill symlinks.
- Investigate and re-attempt migration after fix.

## Out of scope

> **Confidence: High** — explicit Imperator decisions or deferral.

- Rewriting hardcoded path references in historical case files, historical edict files, and `RANK-MAPPING-AUDIT.md` (~795+ references). These are immutable historical artifacts.
- Splitting the `target` enum in `docs/CONVENTIONS.md` into runtime-specific values.
- CODEOWNERS and branch protection setup (Gavin gets full push access by Imperator decision).
- Per-file git-history preservation across the three pre-monorepo repos.
- Kimi 2.6 source addition (this spec produces the structure that supports it; actual Kimi onboarding is a separate case).
- Refactoring the runtime-tuned files themselves (personas, skills) — they migrate as-is, only relocated.
- Pre-commit hook to fail commits touching both `claude/skills/` and `codex/skills/` simultaneously (the "structural enforcement" of the no-shared-source rule). May ship as a follow-up case.
- Extending `check-codex-drift.py` to validate Codex source files against `docs/codex.md`. Codex source has its own intentionally-tuned doctrine structure; mirror validation is a future decision, not this migration.

## Risks and mitigations

> **Confidence: High** — expanded after verification.

| Risk | Mitigation |
|-|-|
| Plugin-cache symlink mechanism rejected | Stage 1 tests the mechanism in isolation; revert in 10 sec if broken |
| Plugin-cache symlink-to-subdirectory rejected | Stage 6 explicitly validates the post-migration scenario before swap |
| Codex install script breaks against new path | Stage 6 dry-runs the install before swap |
| `$CONSILIUM_DOCS` resolution silently reads stale location | Stage 6 unique-marker check confirms reads from new location specifically |
| Files lost during copy (count drift) | Stage 6 file-count assertion |
| Files corrupted during copy (content drift, line endings, mode bits) | Stage 6 sha256 content-hash validation; `rsync -a` preserves attributes |
| Drift-check or staleness-check breaks on relocated paths | Stage 6 runs both checks before swap; both refactored in Stage 4d |
| Force-push to GitHub destroys recoverable state | Imperator explicitly accepted history reset; old repos remain on disk until Stage 8 |
| GitHub state beyond commits (issues/releases/PR refs) lost | Acknowledged consequence; Imperator accepted via history-reset decision |
| First-time consilium-docs exposure to GitHub | Acknowledged; Gavin is the only collaborator and Imperator decision 2 covers this |
| Codex agent TOMLs retain stale `$CONSILIUM_DOCS` fallback | Stage 4b updates `source/doctrine/common.md`; Stage 6 install regenerates all 15 TOMLs |
| `~/.agents/skills/tribune` symlink dangles after Stage 8 | Stage 7 re-runs Codex install; `install-codex-skills.sh` retargets via `ln -sfn` |
| `consilium-marketplace/consilium` symlink dangles | Symlink target is `/Users/milovan/projects/Consilium`, which receives new content via Stage 7 mv; symlink follows correctly. Stage 6 + Stage 7 verify. |
| User-scope agent files contain hardcoded Consilium paths | Stage 4c rewrites `consilium-soldier.md` and audits the other six |
| `consul-routing.md` discriminator logic broken by single-repo paths | Stage 4b rewrites both discriminator paths (Codex-side and Claude-side) |
| Sessions running during swap have stale path cache | Stage 7 pre-swap requires closing all Claude/Codex sessions |
| Soft rollback during Stage 8 window discards post-swap work | Stage 8 mitigation: commit and push the monorepo regularly during confidence period |

## Verification gates

> **Confidence: High** — explicit gates each stage must pass before the next begins.

- **Stage 1 → 2:** Plugin-cache symlink mechanism test passes (or revert applied; migration continues without symlink win).
- **Stage 2 → 3:** All three source repos copied via `rsync -a`; nested `.serena/` and `.git/` excluded; file count matches expectation; dotfiles preserved.
- **Stage 3 → 4:** Codex jurisprudence located at `Consilium-new/docs/codex.md`; `check-codex-drift.py` updated with new CANONICAL path.
- **Stage 4 → 5:** All active hardcoded paths rewritten across Stage 4a–4d; `CLAUDE.md` maintenance section updated; user-scope agent audit complete; no `/Users/milovan/projects/Consilium-codex` or `/Users/milovan/projects/consilium-docs` references remain in non-historical files; `Consilium-codex/source/doctrine/common.md` `$CONSILIUM_DOCS` fallback updated.
- **Stage 5 → 6:** `git init -b main`, single commit, `git push -u --force origin main` succeeds; GitHub shows fresh history.
- **Stage 6 → 7:** All eight verification checks pass:
  1. Symlink-to-subdirectory `/consul` load
  2. `/tribune` load
  3. Real subagent dispatch via `/checkit`
  4. Codex install repopulates `~/.codex/agents/consilium-*.toml` with new fallback
  5. `check-codex-drift.py` passes
  6. `check-tribune-staleness.py` passes
  7. Unique-marker $CONSILIUM_DOCS resolution check passes
  8. sha256 content-fidelity validation passes for unchanged files
- **Stage 7 → 8:** All sessions closed pre-swap; final smoke test (`/consul` load + `/checkit` dispatch) passes in renamed `Consilium/`; `~/.agents/skills/tribune` symlink retargeted via Codex install; `consilium-marketplace/consilium` symlink resolves to new monorepo content.
- **Stage 8:** 24–48 hour confidence period elapsed without unrecoverable breakage; monorepo committed and pushed regularly during the window.

## Post-migration cleanup of CLAUDE.md

> **Confidence: High** — content edits scoped explicitly per Stage 4a.

- Remove the "Plugin cache sync" subsection entirely (symlink eliminates the chore).
- Replace the "Repos" subsection with the monorepo paths plus a one-line note that runtime-tuned source lives in the per-runtime subdirs.
- Add a one-line note that `docs/codex.md` is the canonical jurisprudence source.
- Update the "User-scope agent customizations" section to reference the new canonical persona content path (whichever subdir holds them post-migration).
- Update the Codex-drift-check command path (`python3 claude/scripts/check-codex-drift.py` from monorepo root, since the script lives at `claude/scripts/`).
