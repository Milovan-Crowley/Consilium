> # STATUS: ABANDONED 2026-04-24
>
> Superseded by: `docs/consilium/specs/2026-04-24-consilium-docs-repo.md`
>
> **Reason for abandonment:** The path-resolution problem this plan addresses is a symptom of a broader architectural gap — specs, plans, cases, and doctrine are scattered across per-agent repos with no shared home. Praetor + Provocator verification (completed 2026-04-24) caught 7 GAPs including the Provocator finding that `/consul` and `/edicts` have the same bare-relative-write failure mode as `/tribune`. Rather than patch tribune/legion/march in isolation, the design pivoted to a shared `consilium-docs` repo resolved via `$CONSILIUM_DOCS`.
>
> **What survives conceptually:** The Phase 0 resolution pattern (env var + fallback + halt-on-miss + no-`cd` rule) survives as doctrine — applied to `$CONSILIUM_DOCS` instead of `$CONSILIUM_REPO`. The staleness-script tolerance finding, the PCRE2 escaping pattern, the Praetor's heading-level finding on tribune SKILL structure — all useful for the new spec.
>
> This file is kept as an audit artifact. Do not execute.

---

# Tribune — Consilium Repo Base Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Medicus resolves the Consilium repo location via `$CONSILIUM_REPO` (fallback `$HOME/projects/Consilium`) at Phase 0 without changing cwd, so case files and doctrine reads land in Consilium regardless of where `/tribune` is summoned from — while target-repo cwd is preserved so its `CLAUDE.md` loads and scouts read app code with natural relative paths.

**Architecture:** Two address spaces, one resolution point. Phase 0 resolves Consilium base; no `cd`. Consilium-owned artifacts (case files, known-gaps, lane guides, verification templates, fix-threshold / diagnosis-packet references) are addressed with `$CONSILIUM_REPO/…` prefix. Target-repo code stays relative. The same resolution is mirrored into Legion and March so Debug Fix Intake reads the case file from the right place regardless of Legatus cwd. Pre-existing hardcoded absolute paths in legion (`/Users/milovan/projects/Consilium/skills/…`) are left alone this edict — they are correct, just not portable, and normalization is out of scope.

**Tech Stack:** Bash parameter expansion + `-d` test; Markdown edits only. No code changes. No script changes — staleness script substring regex already tolerates the `$CONSILIUM_REPO/` prefix (verified pre-edict).

---

### Task 1: Tribune SKILL — add Phase 0 + rewrite Consilium-owned path refs

> **Confidence: High** — tribune SKILL body is known (T24 rewrite). Consilium-owned refs enumerated pre-edict: `skills/tribune/references/lane-classification.md` (×2), `docs/consilium/debugging-cases/` (×3+), `skills/references/domain/known-gaps.md` (×1), `skills/tribune/references/lane-guides/` (×1), `skills/tribune/references/diagnosis-packet.md` / `known-gaps-protocol.md` / `fix-thresholds.md` (×1 each), `skills/references/verification/templates/tribune-verification.md` (×1). Target-repo paths (`src/…`, `docs/domain/…`) stay relative. Staleness script uses substring regex — safe.

**Files:**
- Modify: `skills/tribune/SKILL.md`

- [ ] **Step 1: Enumerate current Consilium-owned path refs (baseline)**

Run:

```bash
rg -n "docs/consilium/debugging-cases|skills/references/domain|skills/references/verification|skills/tribune/references" skills/tribune/SKILL.md
```

Expected: the eight ref classes named in the Confidence annotation above. Record the output — every line listed must either gain a `$CONSILIUM_REPO/` prefix in Step 3, or (if target-repo-facing) be explicitly left alone.

- [ ] **Step 2: Insert Phase 0 block above Phase 1**

Use the Edit tool. Find the current "## Phase 1" heading (or the first numbered Phase heading). Insert, **immediately above it**, this block (leave a blank line after it before Phase 1):

````markdown
## Phase 0 — Resolve Consilium repo base

Before any other phase, I resolve where the Consilium repo lives on this machine. I do **not** change cwd — the target repo's `CLAUDE.md` must stay loaded and my scouts must read application code with natural relative paths. I only need to know where Consilium is so I can address case files and doctrine by absolute path.

```bash
CONSILIUM_REPO="${CONSILIUM_REPO:-$HOME/projects/Consilium}"
[ -d "$CONSILIUM_REPO" ] || { echo "Consilium repo not found at $CONSILIUM_REPO. Set CONSILIUM_REPO=<path> and re-invoke /tribune."; exit 1; }
```

**Two address spaces.** Target-repo code and its `CLAUDE.md` are relative-to-cwd. Consilium-owned artifacts — case files, known-gaps, lane guides, verification templates, the diagnosis-packet / fix-thresholds / known-gaps-protocol references — are addressed with `$CONSILIUM_REPO/…` prefix. If the env var is unset and `~/projects/Consilium` does not exist, I halt and instruct the Imperator to export `CONSILIUM_REPO` in their shell profile.
````

- [ ] **Step 3: Rewrite Consilium-owned path refs with `$CONSILIUM_REPO/` prefix**

For every occurrence surfaced in Step 1's enumeration, use Edit to replace the bare relative path with its prefixed form. Examples (apply the same pattern to all occurrences):

- `skills/tribune/references/lane-classification.md` → `$CONSILIUM_REPO/skills/tribune/references/lane-classification.md`
- `docs/consilium/debugging-cases/` → `$CONSILIUM_REPO/docs/consilium/debugging-cases/`
- `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` → `$CONSILIUM_REPO/docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md`
- `skills/references/domain/known-gaps.md` → `$CONSILIUM_REPO/skills/references/domain/known-gaps.md`
- `skills/tribune/references/lane-guides/` → `$CONSILIUM_REPO/skills/tribune/references/lane-guides/`
- `skills/tribune/references/diagnosis-packet.md` → `$CONSILIUM_REPO/skills/tribune/references/diagnosis-packet.md`
- `skills/tribune/references/known-gaps-protocol.md` → `$CONSILIUM_REPO/skills/tribune/references/known-gaps-protocol.md`
- `skills/tribune/references/fix-thresholds.md` → `$CONSILIUM_REPO/skills/tribune/references/fix-thresholds.md`
- `skills/references/verification/templates/tribune-verification.md` → `$CONSILIUM_REPO/skills/references/verification/templates/tribune-verification.md`

Apply uniformly. If a ref appears inside a code fence or quoted block, update it there too. **Do not** prefix target-repo paths (anything under `src/`, `docs/domain/` in the target repo, etc.).

- [ ] **Step 4: Verify the rewrite is complete**

Run:

```bash
# Every Consilium-owned reference in tribune SKILL should now carry the prefix.
# This command enumerates bare (unprefixed) occurrences — expected output: empty.
# -P enables PCRE2 for lookbehind (Rust regex engine does not support lookaround).
rg -P -n "(?<!\\\$CONSILIUM_REPO/)(docs/consilium/debugging-cases|skills/references/domain/known-gaps|skills/references/verification/templates/tribune-verification|skills/tribune/references/(lane-classification|diagnosis-packet|known-gaps-protocol|fix-thresholds|lane-guides))" skills/tribune/SKILL.md
```

Expected: empty (no matches). If any line appears, Edit that line and re-run.

Also verify Phase 0 landed:

```bash
rg -n "Phase 0 — Resolve Consilium repo base" skills/tribune/SKILL.md
```

Expected: exactly one match.

- [ ] **Step 5: Commit**

```bash
git add skills/tribune/SKILL.md
git commit -m "feat(tribune): add Phase 0 Consilium repo resolution + prefix Consilium-owned paths"
```

---

### Task 2: Legion SKILL — resolve Consilium base in Debug Fix Intake + prefix case-file refs

> **Confidence: High** — legion Debug Fix Intake was added in T28. The relative `docs/consilium/debugging-cases/…` occurrence is at line 342 (verified pre-edict). Pre-existing absolute `/Users/milovan/projects/Consilium/…` paths elsewhere in legion are left alone this edict (scope discipline).

**Files:**
- Modify: `skills/legion/SKILL.md`

- [ ] **Step 1: Locate the Debug Fix Intake opening**

Run:

```bash
rg -n "Debug Fix Intake|debugging-cases" skills/legion/SKILL.md
```

Record the opening-line number of Debug Fix Intake and the line(s) referencing `docs/consilium/debugging-cases/`.

- [ ] **Step 2: Insert resolution preamble at the start of Debug Fix Intake**

Use Edit. At the **very beginning** of the Debug Fix Intake section body (immediately after its heading), insert:

````markdown
**Consilium base resolution.** Before reading the case file, I resolve the Consilium repo base — same rule as the Medicus's Phase 0:

```bash
CONSILIUM_REPO="${CONSILIUM_REPO:-$HOME/projects/Consilium}"
[ -d "$CONSILIUM_REPO" ] || { echo "Consilium repo not found at $CONSILIUM_REPO. Set CONSILIUM_REPO=<path> and retry."; exit 1; }
```

I do **not** change cwd. The legion operates from the target repo where the fix will land; the case file at `$CONSILIUM_REPO/docs/consilium/debugging-cases/…` is read by absolute path.
````

- [ ] **Step 3: Prefix the case-file ref in Debug Fix Intake**

Use Edit to replace the one bare `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` occurrence in Debug Fix Intake with `$CONSILIUM_REPO/docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md`.

- [ ] **Step 4: Verify**

```bash
# Bare occurrence in Debug Fix Intake region should be gone.
# -P enables PCRE2 for lookbehind.
rg -P -n "(?<!\\\$CONSILIUM_REPO/)docs/consilium/debugging-cases" skills/legion/SKILL.md
```

Expected: empty. Also:

```bash
rg -n "Consilium base resolution" skills/legion/SKILL.md
```

Expected: exactly one match.

- [ ] **Step 5: Commit**

```bash
git add skills/legion/SKILL.md
git commit -m "feat(legion): resolve Consilium base for case-file reads in Debug Fix Intake"
```

---

### Task 3: March SKILL — same resolution for solo-execution variant

> **Confidence: High** — march Debug Fix Intake was added in T29. The relative `docs/consilium/debugging-cases/…` occurrence is at line 99 (verified pre-edict).

**Files:**
- Modify: `skills/march/SKILL.md`

- [ ] **Step 1: Locate the Debug Fix Intake opening**

```bash
rg -n "Debug Fix Intake|debugging-cases" skills/march/SKILL.md
```

- [ ] **Step 2: Insert resolution preamble at the start of Debug Fix Intake**

Use Edit. At the very beginning of the Debug Fix Intake section body, insert:

````markdown
**Consilium base resolution.** Before reading the case file, I resolve the Consilium repo base — same rule as the Medicus's Phase 0:

```bash
CONSILIUM_REPO="${CONSILIUM_REPO:-$HOME/projects/Consilium}"
[ -d "$CONSILIUM_REPO" ] || { echo "Consilium repo not found at $CONSILIUM_REPO. Set CONSILIUM_REPO=<path> and retry."; exit 1; }
```

I do **not** change cwd. In march mode I execute the fix from the target repo's cwd; the case file at `$CONSILIUM_REPO/docs/consilium/debugging-cases/…` is read by absolute path.
````

- [ ] **Step 3: Prefix the case-file ref**

Replace the one bare `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` in Debug Fix Intake with `$CONSILIUM_REPO/docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md`.

- [ ] **Step 4: Verify**

```bash
# -P enables PCRE2 for lookbehind.
rg -P -n "(?<!\\\$CONSILIUM_REPO/)docs/consilium/debugging-cases" skills/march/SKILL.md
```

Expected: empty.

```bash
rg -n "Consilium base resolution" skills/march/SKILL.md
```

Expected: exactly one match.

- [ ] **Step 5: Commit**

```bash
git add skills/march/SKILL.md
git commit -m "feat(march): resolve Consilium base for case-file reads in solo-execution variant"
```

---

### Task 4: Debugging-cases README — document the two-address-space contract

> **Confidence: High** — README was written in T31; contract is a short prose addition + a small table.

**Files:**
- Modify: `docs/consilium/debugging-cases/README.md`

- [ ] **Step 1: Read the current README to pick an insertion point**

The insertion should go near the top — after the opening paragraph and before the collision-disambiguation block, so the path-resolution contract is the first thing a reader learns.

- [ ] **Step 2: Insert the resolution-contract block**

Use Edit. Insert (after the opening paragraph, blank-line-separated):

````markdown
## Path resolution contract

The Medicus may be summoned from any cwd — typically from inside a target repo (`divinipress-store`, `divinipress-backend`, etc.) so its `CLAUDE.md` loads and scouts read application code with natural relative paths. Case files, however, always land in the Consilium repo.

At Phase 0, the Medicus resolves Consilium's location without changing cwd:

```bash
CONSILIUM_REPO="${CONSILIUM_REPO:-$HOME/projects/Consilium}"
```

**Two address spaces.**

| What | Where | How addressed |
|-|-|-|
| Target-repo code + its `CLAUDE.md` | cwd (target repo) | Relative |
| Case files (this directory) | Consilium repo | `$CONSILIUM_REPO/docs/consilium/debugging-cases/` |
| Known-gaps, lane guides, verification templates, packet refs | Consilium repo | `$CONSILIUM_REPO/skills/…` |

**Machine-switch.** If Consilium does not live at `~/projects/Consilium`, export `CONSILIUM_REPO=<absolute-path>` in your shell profile (`~/.zshrc` / `~/.bashrc`). The Medicus halts with a clear error if neither the env var nor the fallback resolves to a real directory — this is deliberate. A silent fallback that writes cases into the wrong repo is worse than a halt.
````

- [ ] **Step 3: Verify**

```bash
rg -n "Path resolution contract|Two address spaces|Machine-switch" docs/consilium/debugging-cases/README.md
```

Expected: three matches (one per heading/phrase).

- [ ] **Step 4: Commit**

```bash
git add docs/consilium/debugging-cases/README.md
git commit -m "docs(debugging-cases): document two-address-space resolution contract"
```

---

### Task 5: CLAUDE.md — one-line maintenance note for machine switch

> **Confidence: High** — CLAUDE.md was last updated in T34; the Maintenance section already has a "User-scope agent customizations (machine-switch recovery)" bullet as a natural sibling.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Locate the Maintenance section**

```bash
rg -n "^## Maintenance|machine-switch" CLAUDE.md
```

- [ ] **Step 2: Insert the `$CONSILIUM_REPO` bullet**

Use Edit. After the last bullet in the Maintenance section (before the "## Remaining Work" section or whatever follows), insert:

````markdown
**Consilium repo location (`$CONSILIUM_REPO`).** The Medicus and the Legion/March Debug Fix Intake resolve Consilium's location via `$CONSILIUM_REPO` (fallback `$HOME/projects/Consilium`) so `/tribune` can be summoned from any cwd — typically the target repo being debugged — and case files still land here. If the repo lives anywhere other than `~/projects/Consilium`, export the env var in your shell profile:

```bash
export CONSILIUM_REPO=/absolute/path/to/Consilium
```

A missing env var with no fallback match halts `/tribune` with a clear error; this is by design.
````

- [ ] **Step 3: Verify**

```bash
rg -n "CONSILIUM_REPO" CLAUDE.md
```

Expected: at least two matches (the heading/mention + the export example).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document CONSILIUM_REPO env var for machine portability"
```

---

### Task 6: Plugin cache sync + staleness + drift checks + final commit

> **Confidence: High** — sync procedure and check invocations are documented in CLAUDE.md Maintenance section.

**Files:** None created or modified by this task beyond the plugin cache mirror. Final commit is a housekeeping marker (may be empty if no cache diff — expected non-empty because three skills changed).

- [ ] **Step 1: Sync the three modified skills to plugin cache**

```bash
cp skills/tribune/SKILL.md ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/tribune/SKILL.md
cp skills/legion/SKILL.md  ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/legion/SKILL.md
cp skills/march/SKILL.md   ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/march/SKILL.md
```

- [ ] **Step 2: Run tribune staleness check**

```bash
python3 scripts/check-tribune-staleness.py
```

Expected: `=== Clean ===` (the banned-regex, reference-existence, and test-writing-vacuum passes). If any finding appears, halt and report to Legatus — the staleness script's substring regex should tolerate `$CONSILIUM_REPO/` prefix; any breakage is a surprise to diagnose before proceeding.

- [ ] **Step 3: Run codex drift check**

```bash
python3 scripts/check-codex-drift.py
```

Expected: clean. This task did not modify user-scope agents or the Codex itself, so drift is not expected.

- [ ] **Step 4: Commit cache sync (if diff exists)**

Cache is ignored by git (see `.gitignore` — it's under `~/.claude/` which is outside the repo anyway). No commit needed for the cache files themselves. If the staleness or drift runs surfaced anything requiring an in-repo fix, commit that fix:

```bash
# Only if fixes were made:
git add -A
git commit -m "chore: address staleness/drift findings from CONSILIUM_REPO edict"
```

If both checks were clean, no commit — skip to Step 5.

- [ ] **Step 5: Final verification — grep for residual bare Consilium-owned paths across the three skills**

```bash
# -P enables PCRE2 for lookbehind across all three skills.
rg -P -n "(?<!\\\$CONSILIUM_REPO/)(docs/consilium/debugging-cases|skills/references/domain/known-gaps|skills/references/verification/templates/tribune-verification|skills/tribune/references/(lane-classification|diagnosis-packet|known-gaps-protocol|fix-thresholds|lane-guides))" skills/tribune/SKILL.md skills/legion/SKILL.md skills/march/SKILL.md
```

Expected: empty across all three files.

- [ ] **Step 6: Report complete to Legatus**

```
CONSILIUM_REPO edict complete.
- Phase 0 added to tribune SKILL.
- Debug Fix Intake preambles added to legion + march.
- README documents the two-address-space contract.
- CLAUDE.md documents the env var + machine-switch instruction.
- Plugin cache synced.
- Staleness: clean. Drift: clean. Bare-path residual grep: empty.
```

---

## Dependencies and Sequencing

| Task | Depends on | Parallelizable |
|-|-|-|
| T1 (tribune SKILL) | None | Yes — with T2, T3, T4, T5 |
| T2 (legion SKILL) | None | Yes — with T1, T3, T4, T5 |
| T3 (march SKILL) | None | Yes — with T1, T2, T4, T5 |
| T4 (README) | None | Yes — with T1, T2, T3, T5 |
| T5 (CLAUDE.md) | None | Yes — with T1, T2, T3, T4 |
| T6 (cache sync + checks) | T1, T2, T3 complete (cache sync requires new skill content) | No — serial final task |

All edits are to different files with no cross-file content coupling, so T1–T5 can run in parallel. T6 runs serially last. If using Legion mode, the Legatus can dispatch T1–T5 as a parallel wave and T6 after the wave lands.

## Out of scope (explicit)

- **Normalizing pre-existing absolute paths in legion** (`/Users/milovan/projects/Consilium/skills/references/verification/…` at legion SKILL lines 139, 161–166) to `$CONSILIUM_REPO/`. Those are correct-but-brittle-on-machine-switch; can be cleaned in a separate follow-up when a second machine is actually in play.
- **Touching the staleness script.** Substring regex already handles `$CONSILIUM_REPO/` prefix transparently; no script change needed.
- **Touching user-scope agents** (`~/.claude/agents/consilium-*.md`). They do not reference case-file paths or read from `skills/references/domain/` directly — the Medicus + Legatus do that work and pass paths down.
