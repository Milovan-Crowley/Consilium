# Edicts Files-Block Write/Read Contract Spec

**Status.** Draft for Imperator review.
**Date.** 2026-05-01.
**Slug.** 2026-05-01-consilium-edicts-writes-contract.
**Target.** Canonical Edicts contract surfaces.
**Purpose.** Land a per-task Files-block write/read contract by hardening the existing `**Files:**` task block: name `Read:` as a recognized optional sub-category, canonicalize the union of `Create:` + `Modify:` + `Test:` as the writes set, forbid globs in writes sub-categories, and amend Praetor's plan-verification with a Files-block well-formedness check plus a dormant disjointness hook for sister-campaign consumption.

## Summary

A small, surgical amendment to the Edicts plan format that turns the existing `**Files:**` block into a stable contract surface usable by two concurrent sister campaigns:

- **Campaign 3b** — file-ownership hook + marker activation. Runtime enforcement of blast-radius discipline.
- **Campaign 5** — phalanx surfacing. Plan-time detection of parallel-safe task waves.

The amendment extends the existing `**Files:**` block with one new sub-category (`Read:`), tightens the existing sub-bullet convention from optional to mandatory, and introduces one new empty-marker token (`(none)`). It is a small grammar inside an existing block — not a new heading regime. Right-sized-edicts §6 mentioned `read` in spec prose but the live SKILL.md template never adopted it; this spec finishes that work — names the writes set, adopts `Read:` in the live template, defines glob grammar for writes paths, declares well-formedness rules, and gives Praetor one operational check.

## Evidence Basis

Current state of the relevant surfaces, verified directly:

- **`source/skills/claude/edicts/SKILL.md`** — the `### Task N` template lists `**Files:**` with `Create:`, `Modify:`, and `Test:` sub-bullets. Each sub-bullet expects exact paths. `Read:` is not shown in the template body.
- **`source/protocols/plan-format.md`** — the canonical task-shape protocol declares "Files, objective, decisions already made, acceptance, verification" as task contents. It does not enumerate sub-bullets, name the writes set, or forbid globs.
- **`source/skills/claude/references/verification/templates/plan-verification.md`** — the Praetor mission has eight items including #2 ("File collision check") which maps tasks to files for sequential-collision detection. There is no per-task writes well-formedness check.
- **`source/roles/praetor.md`** — terse role file. The "you own" list contains five items including "file collision checks." No reference to writes contract.
- **`docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md` §6** — the doctrine being amended already says: "Files: create/modify/test/read as needed." `read` is named at the spec level but absent from the live template and from plan-verification's mission.

The existing structure is a partially-articulated contract. This spec completes it.

## Problem

Two sister campaigns require a stable per-task contract:

1. **Campaign 3b — file-ownership hook.** Runtime enforcement of blast-radius discipline. The hook must answer: *"Is this centurio allowed to write this file under the current task?"* That requires a per-task write set named in the plan, machine-parseable, with no glob ambiguity.

2. **Campaign 5 — phalanx surfacing.** Plan-time detection of parallel-safe task groups. Phalanx must answer: *"Do tasks T1 and T2 share a write path or a read-write conflict?"* That requires per-task writes and (for read-write conflicts) per-task reads.

Both consumers need the same contract. Today's plan format almost provides it but doesn't:

- The `**Files:**` block lists Create/Modify/Test paths but is not declared as the writes set.
- Globs are not forbidden in writes paths, leaving room for ambiguity.
- `Read:` is named in spec doctrine but not in the live template.
- Praetor does not validate well-formedness.

## Goals

- Declare the per-task writes set as a stable contract surface usable by sister campaigns.
- Add `Read:` as a recognized optional sub-category of the existing Files block, with wildcard support.
- Forbid globs in writes sub-categories (Create/Modify/Test) so the contract is unambiguous for downstream consumers.
- Add a Praetor Files-block well-formedness check.
- Leave a one-line dormant hook for writes-disjointness validation that activates only when a sister campaign defines parallel-safe groups.
- Preserve every other Edicts contract — no new headings outside the Files block, no field renames, no Owner/wave/dependency-graph machinery.

## Non-Goals (Hard Boundaries)

The Imperator's directive defines these as binding:

- **No Owner field schema.**
- **No dependency graph metadata.**
- **No rollback field.**
- **No `wave:` field.**
- **No Action Tier system.**
- **No new task-level metadata headings outside the Files block.** All grammar additions (one new sub-category, one empty-marker token, one tightened sub-bullet convention) operate inside the existing `**Files:**` block. The spec acknowledges this is a small grammar; it is not a new metadata regime in the heading-proliferation sense the prior specs warned against.
- **No definition of parallel-safe-group declaration semantics.** That mechanism, if introduced, belongs to a sister campaign that owns parallel-safety. This spec leaves a forward-compatible hook only.
- **No runtime hook mechanics.** Campaign 3b owns runtime enforcement.
- **No phalanx surfacing logic.** Campaign 5 owns parallel-wave detection.
- **No new sub-categories beyond `Create:`, `Modify:`, `Test:`, `Read:`.**
- **Not implemented in the spec-writing pass.** This spec defines the contract and the surface obligations. It does not edit code in this pass.

## The Contract

### C1. The Files block is the canonical contract surface

Every task in an Edicts plan carries a `**Files:**` block. The block lists per-task file paths under named sub-bullets. The union of paths under `Create:`, `Modify:`, and `Test:` is the task's **writes set** — the canonical contract surface consumed by sister campaigns.

Sub-bullets are mandatory. A flat path list under `**Files:**` (without sub-categories) is malformed.

### C2. Recognized sub-categories

The Files block recognizes exactly four sub-categories:

- **`Create:`** — paths the task creates. Required when the task creates files.
- **`Modify:`** — paths the task changes. Covers any change to an existing file: edit, delete, move, or rename. For move or rename, the task declares both the old and the new path under `Modify:` (one bullet each). Required when the task changes files. Optional line-range suffix (e.g., `path/to/file.ts:120-145`) permitted for edits; line-range suffixes are not used for delete/move/rename.
- **`Test:`** — paths under test directories the task creates or modifies. Required when the task adds or updates tests.
- **`Read:`** — paths the task reads for context but does not write. Optional. Multiple entries permitted.

No other sub-categories are recognized. Authors who need to convey something outside this set use the existing `Decisions already made` heading or task-body prose.

### C3. Path explicitness

Paths under `Create:`, `Modify:`, and `Test:` are explicit. **Globs and wildcards are forbidden in writes sub-categories.** A path is one file. This is the no-globs-that-hide-drift rule.

**Glob grammar (precise).** A path entry is a glob if and only if, outside of bracketed dynamic-route segments, it contains any of:

- an asterisk: `*`, `**`;
- an extended-glob pattern: `?(...)`, `*(...)`, `+(...)`, `@(...)`, `!(...)`;
- brace expansion: `{a,b,c}`.

Bracketed segments matching Next.js dynamic-route conventions — `[id]`, `[...slug]`, `[[...slug]]` — are NOT globs; they are literal route-segment names and are permitted in writes paths. A literal `?` as a single trailing character is treated as a glob and forbidden in writes; a `?` inside a bracketed segment is permitted.

Paths under `Read:` may use wildcards (e.g., `src/components/**/*.tsx`, `docs/**/*.md`). Reads are scoping signals; coarse coverage is acceptable.

### C4. Empty Files convention

A task that writes no files (verification-only, reporting, generator-run) carries the `**Files:**` heading with the single literal entry `- (none)`:

```markdown
**Files:**
- (none)
```

The `(none)` marker is required so absence is unambiguous to downstream consumers — a missing `**Files:**` block is malformed; an empty one is explicitly empty.

**Canonical placement.** The `(none)` marker is placed as the sole top-level bullet directly under `**Files:**` when the writes set is empty. `Read:` entries (when present) follow on subsequent top-level bullets at the same indent level — they do NOT appear nested under `(none)`, and `(none)` is NOT replaced by them.

A reads-only task — e.g., a verification-only task that reads several files and produces no edits — is shaped exactly as:

```markdown
**Files:**
- (none)
- Read: src/components/CategoryNavigation.tsx
- Read: src/lib/categoryHelpers.ts
```

The `(none)` is mandatory in this shape; it signals "writes set is explicitly empty" to downstream consumers. Omitting `(none)` and listing only `Read:` entries is malformed.

### C5. Generator-run task convention

The generator-run carve-out applies only to the canonical Consilium proof-chain commands listed below. Tasks invoking these specific commands do not enumerate generator-derived paths under `Modify:`; the contract for derived outputs is owned by the generator script and its known output set.

**Recognized canonical commands (carve-out applies):**

- `python3 runtimes/scripts/generate.py` — the runtime generator.
- `bash codex/scripts/install-codex.sh` — the Codex install/sync.

**Build-style commands (carve-out does NOT apply):** `npm run build`, `tsc`, `next build`, `pnpm install`, and similar build/install commands produce gitignored, transient, or downstream-tooling-owned artifacts. Tasks invoking these commands describe their direct file edits under `Modify:` normally (or carry `(none)` if the task has no direct edits). The build's output set is not the task's writes set.

A task that runs a recognized canonical command *and also* hand-edits a file lists the hand-edited file under `Modify:`. The carve-out applies only to the deterministic-output portion of the work.

Future sister specs may extend the recognized-commands list. Such extensions are out of scope for this spec; the list is closed at the two commands named above until amended.

### C6. Forward-compatible disjointness hook

The contract is silent on parallel-safe groups today. If a future sister campaign introduces an explicit parallel-safe-group declaration, the disjointness rule activates: write sets must be pairwise disjoint within each declared group. Praetor's mission carries a one-line dormant note for this hook.

This spec does not define parallel-safe-group syntax, semantics, or activation conditions. Campaign 5 (phalanx surfacing) is the named owner of parallel-safety semantics.

## Required Behavior — Surface Obligations

The contract is enforced through edits at four canonical source surfaces. Per-surface prose, exact insertion points, and final wording are plan territory; the spec defines what each surface must convey.

### S1. Plan-format protocol — `source/protocols/plan-format.md`

Gains a Files-block contract section conveying:

- C1 — the writes set is the union of `Create:` + `Modify:` + `Test:`; sub-bullets are mandatory.
- C2 — the four recognized sub-categories.
- C3 — no globs in writes sub-categories; wildcards permitted in `Read:`.
- C4 — empty Files convention with the `(none)` marker.
- C5 — generator-run carve-out.

This is the canonical protocol surface read by all runtimes. The contract section is plain prose under existing protocol style.

### S2. Edicts skill — `source/skills/claude/edicts/SKILL.md`

The `### Task N` template gains a `Read:` sub-bullet line in the example block. Authoring guidance gains:

- One paragraph naming the writes set as a contract surface (sister campaigns 3b and 5 cited as consumers, by name).
- One paragraph on when to use `Read:` — when reads are load-bearing for the task (files the task depends on for correctness or context that affects its decisions).
- The empty-Files convention (C4).
- The generator-run convention (C5).

### S3. Plan-verification template — `source/skills/claude/references/verification/templates/plan-verification.md`

The Praetor mission gains a **Files-block well-formedness check** with the following rules:

- Every task's `**Files:**` block is present.
- Sub-bullets are recognized (`Create:`, `Modify:`, `Test:`, `Read:`); unknown sub-bullets are findings.
- Writes paths (`Create:`, `Modify:`, `Test:`) are explicit — no globs, no wildcards.
- `Read:` entries (when present) parse as paths or path-patterns.
- The empty-Files convention (`(none)`) is respected when applicable.

A malformed Files block is reported as **GAP** (must fix before march), not CONCERN. The reasoning is that the Files block is a contract surface — malformed contract is missing decision the Centurio cannot fix in the field.

The check may be folded into the existing file-collision check (mission item #2) or stand as a sibling axis. Plan decides placement.

The mission gains one trailing sentence as the **dormant disjointness hook** (C6): *if a plan declares parallel-safe task groups (a future capability owned by sister campaigns), `Create:`/`Modify:`/`Test:` paths must be disjoint within each declared group.* The note is non-firing today.

The existing eight-item mission (dependency trace, file collision, decision completeness, assumption audit, spec coverage, doctrine cross-check, right-sizing, deviation-as-improvement) is preserved. The new check is additive.

### S4. Praetor role — `source/roles/praetor.md`

The "You own" list gains one line: **"Files-block well-formedness check (write/read contract)."** No other changes to the role file.

## Sequencing With Sister Campaigns

Three sister campaigns share contract surfaces with this one and must serialize:

- **Right-sized edicts (`docs/cases/2026-04-30-consilium-right-sized-edicts/`)** — the doctrine being amended. Touches the same plan-format, Edicts SKILL.md, and plan-verification surfaces. Must land first; this spec assumes its contract is in place.

- **Minimality contract (`docs/cases/2026-04-29-consilium-minimality-contract/`)** — asserts `source/protocols/plan-format.md` byte-unchanged in *its* acceptance criteria. That assertion is read here as scoped to minimality's own implementation pass: minimality's Non-Goals section frames byte-unchanged as part of *its* implementation discipline, and the Consilium operates on a sequence-of-amendments model rather than frozen surfaces. Verifiers reading minimality's acceptance text literally (and observing it lacks an explicit "during implementation" qualifier) should consult this section as the authoritative cross-spec interpretation. Minimality must land first; this spec amends plan-format.md after.

- **Sister campaigns 3b (file-ownership hook) and 5 (phalanx surfacing)** — consume this contract. They cite this spec by slug. They do not edit the four source surfaces this spec touches; they read the contract at runtime / plan-time. They may proceed in parallel with this campaign's implementation, provided this spec lands first.

The implementation plan for this spec includes a sequencing precondition: confirm right-sized-edicts and minimality have landed (or explicit Imperator override) before editing the shared surfaces.

## Source Surfaces

The implementation plan inspects and amends exactly these surfaces:

- `source/protocols/plan-format.md` (S1)
- `source/skills/claude/edicts/SKILL.md` (S2)
- `source/skills/claude/references/verification/templates/plan-verification.md` (S3)
- `source/roles/praetor.md` (S4)

After canonical source edits, the plan must run `python3 runtimes/scripts/generate.py`, install generated Claude agents into `~/.claude/agents`, run `bash codex/scripts/install-codex.sh` for Codex agents/skills/config sync, then prove installed runtime parity with `python3 claude/scripts/check-codex-drift.py`.

The plan must not introduce:

- new sub-categories beyond Create/Modify/Test/Read;
- new task-block headings outside the Files block;
- per-task metadata fields outside the Files block;
- new agents, templates, verifier ranks, or lint scripts;
- wave/owner/dependency-graph/rollback/Action-Tier machinery;
- changes to other Praetor mission items;
- changes to the Edicts authoring instructions outside the Files-block contract;
- changes to historical case docs except this case's own artifacts.

## Sister-Campaign Interface

This spec stabilizes the following interface for concurrent campaigns. These are the contract guarantees campaigns 3b and 5 cite:

**For campaign 3b (file-ownership hook):**

- Per-task writes set = union of paths under `Create:`, `Modify:`, `Test:` in the task's `**Files:**` block.
- Writes paths are explicit (no globs).
- A task with no writes carries the `(none)` marker.
- Generator-run tasks delegate derived-output enforcement to the generator script's known output set; the hook should detect generator commands declared in task bodies and consult generator manifests rather than the Files block for derived paths.

**For campaign 5 (phalanx surfacing):**

- Per-task writes set: as above.
- Per-task reads set: union of paths and patterns under `Read:` (optional; absent means no reads were declared).
- Write-write conflict: any path overlap between two tasks' write sets.
- Read-write conflict: any overlap between one task's reads and another task's writes set. Read-side wildcards match against concrete write paths via glob-matches-path semantics: `*` matches any character sequence within a single path segment; `**` crosses directory boundaries (globstar). For example, `Read: src/**/*.tsx` overlaps any concrete write path matching that globstar pattern; `Read: src/components/*.tsx` overlaps only single-segment `.tsx` matches under `src/components/`.
- Read declarations are best-effort, not exhaustive. Authors declare reads that are load-bearing for the task — files the task depends on for correctness or context that affects its decisions. Authors are NOT required to enumerate every file the task incidentally opens. Phalanx (campaign 5) treats absent or incomplete `Read:` entries as conservative read-anywhere for parallel-safety analysis: when in doubt, sequence rather than parallelize. This is the deliberate trade-off — light authoring burden, conservative parallelism.
- Parallel-safe-group declaration semantics are not defined by this spec; campaign 5 owns that.

Fallback policy for plans authored before this contract lands is **consumer-defined**, not prescribed here. Campaign 3b's spec defines the file-ownership hook's fallback for legacy plans (no `Read:` entries, no `(none)` markers, possibly no Files block at all). Campaign 5's spec defines phalanx's fallback. This spec stabilizes the forward contract — for plans authored under it — and explicitly delegates legacy-plan handling to the consuming campaigns.

## Acceptance Criteria

1. `source/protocols/plan-format.md` contains the Files-block contract section conveying C1, C2, C3, C4, C5.
2. `source/skills/claude/edicts/SKILL.md` task template includes a `Read:` sub-bullet, and authoring guidance covers the writes-set contract (with sister campaigns 3b and 5 named as consumers), when to use `Read:`, the empty-Files convention, and the generator-run convention.
3. `source/skills/claude/references/verification/templates/plan-verification.md` Praetor mission contains a Files-block well-formedness check that flags missing block, unknown sub-bullets, globs in writes sub-categories (per the C3 grammar), malformed `(none)` marker placement, and reports findings as GAP. The mission also contains a one-line dormant disjointness note (C6). The existing eight items remain present; placement of the new check (folded into item #2 or as a sibling axis making the count nine) is plan territory.
4. `source/roles/praetor.md` "You own" list contains the Files-block well-formedness item.
5. No new sub-categories beyond Create/Modify/Test/Read appear anywhere in the four amended surfaces.
6. No new task-block headings, metadata fields, or per-task regimes appear.
7. No Owner/wave/dependency-graph/rollback/Action-Tier additions.
8. No new agents, templates, verifier ranks, lint scripts, or MCP tools exist after the change.
9. `python3 runtimes/scripts/check-runtime-parity.py` exits 0 after generation.
10. Generated Claude agents are installed into `~/.claude/agents`.
11. `bash codex/scripts/install-codex.sh` exits 0.
12. `python3 claude/scripts/check-codex-drift.py` exits 0.
13. The right-sized-edicts and minimality-contract specs have landed before this spec's implementation plan amends shared surfaces, OR the Imperator has explicitly approved concurrent landing with a merge-resolution note in the plan.
14. The diff is concentrated within the four named canonical surfaces plus generated/compatibility outputs derived from `runtimes/scripts/generate.py`. No hand edits land outside the named source surfaces.

## Verification Checks

Required after implementation.

**Baseline.** All `git diff` checks below are computed against the **implementation-start baseline** of this campaign — that is, against the state of `main` after right-sized-edicts and minimality have landed and immediately before this spec's implementation plan begins editing. They are NOT against the project's `main` at the time this spec was written; doctrine and skill files (`execution-law.md`, `verifier-law.md`, etc.) will have changed under the sister campaigns' edits before this campaign starts. Any `is empty` check is therefore "no further changes by this campaign," not "byte-identical to the project's historical main."

- `rg -n "writes set" source/protocols/plan-format.md source/skills/claude/edicts/SKILL.md` returns hits naming the Create+Modify+Test union as the writes set.
- `rg -n "Read:" source/skills/claude/edicts/SKILL.md` returns at least one hit in the task template body.
- `rg -n "Read:" source/protocols/plan-format.md` returns a hit in the sub-category list.
- `rg -n "no globs" source/protocols/plan-format.md` (or equivalent phrasing of C3) returns a hit.
- `rg -n "\\(none\\)" source/protocols/plan-format.md source/skills/claude/edicts/SKILL.md` returns hits conveying the empty-Files convention.
- `rg -n "Files-block" source/skills/claude/references/verification/templates/plan-verification.md` returns a hit on the Praetor well-formedness check.
- `rg -n "Files-block" source/roles/praetor.md` returns a hit on the "You own" extension.
- `git diff -- source/skills/claude/legion/SKILL.md` is empty (legion execution doctrine untouched).
- `git diff -- source/skills/claude/legion/implementer-prompt.md` is empty (centurio dispatch untouched).
- `git diff -- source/doctrine/execution-law.md source/doctrine/verifier-law.md` is empty (doctrine surfaces untouched).
- A spot-read of one installed runtime agent body (e.g. `~/.claude/agents/consilium-praetor.md`) confirms the role-file extension was installed.
- A sample Edicts plan written under the new contract — the implementation plan for THIS spec — is the proof artifact: it carries `Read:` entries where reads are load-bearing and `(none)` markers where applicable.

## Confidence Notes

**High:**

- The reframe away from separate top-level write/read fields toward extending the existing `**Files:**` block. The reframe is sound on the merits — it reuses the existing schema and adds one new sub-category (`Read:`) plus one empty-marker token (`(none)`) plus a tightened sub-bullet convention. The framing is now honest: this is grammar inside an existing block, not a new heading regime, but it IS a small grammar (not "no new metadata regime" as earlier drafts overclaimed). Right-sized-edicts §6 mentioned `read` in spec prose; the live template did not adopt it. This spec adopts it.
- The four-surface obligation set. Plan-format protocol carries the contract; Edicts SKILL.md carries authoring; plan-verification template carries Praetor's check; praetor.md carries the role extension. These are the canonical surfaces; nothing else needs to change.
- The hard non-goals. Imperator stated each; this spec honors them by keeping all grammar additions inside the existing Files block — no new headings, no new task-level metadata regime in the heading-proliferation sense.
- Sequencing with right-sized-edicts and minimality. plan-format.md, Edicts SKILL.md, and plan-verification.md are touched by all three campaigns; serial landing is the conservative discipline. The minimality byte-unchanged claim is read as scoped to minimality's implementation pass per the Sequencing section's cross-spec interpretation.
- The interface guarantees for sister campaigns 3b and 5. The contract surface (Files-block sub-categories with declared semantics, glob grammar, `(none)` placement, best-effort reads with conservative-default policy, consumer-defined legacy fallback) is sufficient for runtime hook enforcement and parallel-safety detection without further pre-emption of campaign 3b's or campaign 5's design space.

**Medium:**

- The Praetor check's mission placement (folded into existing item #2 vs. sibling axis) remains plan territory. Acceptance #3 explicitly allows either; both are doctrine-compliant.
- The forward extensibility of the C5 recognized-commands list. The list is closed at two commands (generate.py, install-codex.sh) until amended by a sister spec. If a future workflow introduces a third deterministic-output command, that spec extends the list explicitly — this spec does not pre-authorize.

**Low:**

- The exact dormant-disjointness note phrasing in Praetor's mission. The note is conditional on parallel-safe-group declarations that don't exist yet. Phrasing is plan territory; the spec asserts only that the note exists.
