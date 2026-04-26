# Edict: Graphify Corpus Pass 3 Execution (v2 — post-verification)

**Date:** 2026-04-10
**Author:** Publius Auctor, Consul of the Consilium
**Status:** v2, verification-fixed, Imperator-approved, ready for Legatus execution
**Executor:** Legatus (general-purpose sub-agent, Opus, foreground)

## Verification trail

This edict was verified by Praetor (plan-vs-spec) and Provocator (stress test) in parallel on 2026-04-10. Both returned substantive findings. v2 incorporates:

- Store `.gitignore` blocks `docs/domain/` (Praetor Finding 1, blocker) — fixed in T2
- `backend/CLAUDE.md:108` references `docs/proofing-flow.md` (Provocator Finding 2, blocker) — fixed in T6 step 5
- Naming Trap 4 anchor is `### Trap 4 — Admin Hold is a half-baked placeholder` at line 186 not "Naming Trap 4" at line 157 (both, blocker) — fixed in T3.5 with stable string anchor
- `user-level-views.md` is untracked and was never Pass 2 audited (both, blocker) — Imperator resolution: use `audited_in: imperator-source` frontmatter, `rm` not `git rm` in Consilium
- `graphify-raw/` is not a git repo (Provocator Finding 5) — fixed with `/tmp` snapshot in T3
- `git add graphify-source/` would sweep Imperator's uncommitted state (Provocator Finding 7) — fixed with explicit file list in T9
- T7 ordering fragility (both) — fixed by renumbering to T3.5 before T4
- Store pre-commit hook only scans `.ts/.tsx` (both) — fix: collapse store commits to one

## Mission

Physically distribute the Pass 2 audited Consilium corpus from `/Users/milovan/projects/Consilium/graphify-source/` into three target directories (`divinipress-store/docs/domain/`, `divinipress-backend/docs/domain/`, `graphify-raw/domain-bible/`). Apply minimal YAML frontmatter to every migrated Consilium file. Handle the six collision pairs per Phase 3a resolutions. Leave all commits unpushed.

## Binding Decisions

1. Distribution map approved: 13 store / 8 backend / 3 cross-cutting. `custom-order.md` and `proof.md` to store.
2. Q3: repurpose `domain-bible/` (9 deletes + 3 adds).
3. Q4: minimal frontmatter IS in scope. Extended `references:` array deferred to Pass 4.
4. Pair 1 (`proofing-flow.md`): keep Consilium, delete existing backend version.
5. Pair 2 (`custom-order-domain-reference.md`): coexist with rename to `custom-order-domain-layer.md`.
6. Pair 3 (`admin-hold-state-fix.md`): delete outright — Admin Hold is pre-proofing internal approval (employee needs admin sign-off), Production Hold is post-approval material-shortage state. The existing doc conflated them.
7. Pair 4 (`collection-routes.md`): coexist, move into `backend/docs/domain/`, add cross-refs.
8. Pair 5 (`product-data-flow-cheatsheet.md`): coexist, move into `store/docs/domain/`, add cross-refs.
9. Pair 6 (`display-name-reference.md`): coexist, move into `store/docs/domain/`, add cross-refs.

## Minimal Frontmatter Schema

Pre-pended to every migrated Consilium file with a blank line between frontmatter and the first content line.

```yaml
---
source: consilium-domain-extraction
contributor: milovan
captured_at: 2026-04-10
domain: store            # or "backend" or "cross-cutting"
concept: <kebab-case>    # file stem without .md
audited_in: pass-2       # or "imperator-source" for user-level-views.md only
---
```

**Special case: `user-level-views.md`.** This file is currently untracked in Consilium git and was authored directly by the Imperator from a spreadsheet. It was referenced as canonical during Pass 2 but never went through the cluster audit mechanic. Use `audited_in: imperator-source` (NOT `pass-2`). This is an honest provenance tag introduced in v2.

**Coexisting existing repo docs** (cheatsheet, display-name-reference, custom-order-domain-layer, collection-routes) do NOT get frontmatter. Not Consilium audit artifacts.

## Execution Tasks

### T1 — Pre-flight

1. Capture current HEAD SHAs in `/Users/milovan/projects/Consilium/`, `/Users/milovan/projects/divinipress-store/`, `/Users/milovan/projects/divinipress-backend/` (record for possible rollback). `/Users/milovan/projects/graphify-raw/` is NOT a git repo — skip.
2. Record the list of Imperator's uncommitted state in Consilium (`git status --porcelain graphify-source/`) for reference — these files are NOT touched by this edict:
   - ` M graphify-source/DISCREPANCY_REPORT.md`
   - ` D graphify-source/visual-tokens.md`
   - ` M graphify-source/voice-principles.md`
   - `?? graphify-source/user-level-views.md` (this ONE is migrated but via `rm`, not `git rm`)
3. Verify the 24 Consilium source files exist:
   - 23 tracked files in `graphify-source/` matching the distribution map
   - 1 untracked file: `user-level-views.md`
   - If any are missing, abort and report.

### T2 — Prepare store repo for `docs/domain/`

**Critical: store `.gitignore` blocks `docs/*` with a narrow whitelist. Must update before T4 or the migrated files will be silently ignored.**

1. Read `/Users/milovan/projects/divinipress-store/.gitignore` around lines 55-58 to find the `docs/*` block.
2. Add a whitelist entry immediately after the existing `docs/*` line:
   ```
   !docs/domain/
   !docs/domain/*
   !docs/domain/**/*.md
   ```
3. Verify by running `git check-ignore -v docs/domain/catalog-product.md` (with the file not yet existing) — if it still matches a rule, the whitelist ordering is wrong and must be adjusted.
4. Create the target directory: `mkdir -p /Users/milovan/projects/divinipress-store/docs/domain`

### T2-bis — Prepare backend repo for `docs/domain/`

1. Create: `mkdir -p /Users/milovan/projects/divinipress-backend/docs/domain`
2. Backend has no equivalent `.gitignore` rule blocking docs (verify by running `git check-ignore -v docs/domain/custom-order.md` — should return empty/non-match).

### T3 — Snapshot and clean `graphify-raw/domain-bible/`

**Critical: `graphify-raw/` is NOT a git repo. Deletions are irreversible. Snapshot first.**

1. Take backup: `cp -R /Users/milovan/projects/graphify-raw/domain-bible /tmp/graphify-raw-domain-bible-backup-$(date +%Y%m%d-%H%M%S)/`
2. Verify backup exists and contains all 9 stale files.
3. Delete the 9 stale files from `graphify-raw/domain-bible/`:
   - `MANIFEST.md`
   - `naming.md`
   - `orders.md`
   - `products.md`
   - `proofing.md`
   - `roles.md`
   - `teams-collections.md`
   - `backend-code-map.md`
   - `store-code-map.md`

Use `rm` (not `git rm`) — directory is not a git repo.

### T3.5 — Correct Naming Trap 4 in `_terminology.md` (must run BEFORE T4)

**Critical ordering: this edit applies to the file in its Consilium location (`graphify-source/_terminology.md`) BEFORE the T4 migration loop moves it. If T4 runs first, this task must edit the post-migration location instead.**

The section heading is `### Trap 4 — Admin Hold is a half-baked placeholder, not a live workflow` (NOT "Naming Trap 4"). Use this stable string anchor for the Edit tool — the `Scout rule` sentence at the end of the section:

**Anchor string (unique in the file):**
```
**Scout rule:** When a doc describes Admin Hold as a functioning workflow with triggering criteria, the doc is wrong. Mark it as "enum value exists, workflow pending, treat as placeholder."
```

**Replacement string (append a new paragraph after the Scout rule, before the next heading):**
```
**Scout rule:** When a doc describes Admin Hold as a functioning workflow with triggering criteria, the doc is wrong. Mark it as "enum value exists, workflow pending, treat as placeholder."

**Intended placement:** Admin Hold is a **pre-proofing** gate — an employee order pending internal admin sign-off BEFORE proofing begins. This is distinct from Production Hold, which is a post-approval state where production cannot proceed due to material shortage, extended lead time, or similar external issues. The current `ADMIN_HOLD` wiring places the transition FROM `AWAITING_FULFILLMENT` (post-proofing) — which contradicts the intended pre-proofing placement and is part of why the wiring is incoherent.
```

Use the Edit tool with these exact strings. If the anchor string is not found exactly (e.g., quote character differences), STOP and report — do not guess.

### T4 — Migrate the 24 Consilium files

**Loop: for each file, copy content, prepend frontmatter, write to destination, remove source.**

**Store destination (`/Users/milovan/projects/divinipress-store/docs/domain/`) — 13 files:**

`catalog-product.md`, `saved-product.md`, `collection.md`, `team.md`, `reorder-flow.md`, `role-admin.md`, `role-designer.md`, `role-staff.md`, `invite-flow.md`, `onboarding-flow.md`, `custom-order.md`, `proof.md`, `user-level-views.md`

Frontmatter for each: `domain: store`, `concept: <file stem>`, `audited_in: pass-2` — EXCEPT `user-level-views.md` which uses `audited_in: imperator-source`.

**Backend destination (`/Users/milovan/projects/divinipress-backend/docs/domain/`) — 8 files:**

`order-lifecycle.md`, `order-status.md`, `job-status.md`, `proofing-flow.md`, `payment-status.md`, `complex-pricing.md`, `permission-system.md`, `role-super-admin.md`

Frontmatter: `domain: backend`, `concept: <file stem>`, `audited_in: pass-2`.

**Cross-cutting destination (`/Users/milovan/projects/graphify-raw/domain-bible/`) — 3 files:**

`_terminology.md`, `company.md`, `employee.md`

Frontmatter: `domain: cross-cutting`, `concept: <file stem>` — use `terminology` for `_terminology.md`, `company` for `company.md`, `employee` for `employee.md`. `audited_in: pass-2`.

**Per-file mechanics:**

1. Read source file content (already contains no existing frontmatter — verified by Provocator).
2. Construct frontmatter block with the file's computed values.
3. Concatenate: `<frontmatter>\n\n<original content>`.
4. Write to destination path.
5. Remove source:
   - For 23 tracked files: no action here; removal is handled in the T9 Consilium commit via explicit `git rm` with the precise file list.
   - For `user-level-views.md` (untracked): `rm /Users/milovan/projects/Consilium/graphify-source/user-level-views.md`. This file is NOT staged in the Consilium commit because it was never in the git index.

### T5 — Handle coexisting existing repo docs

**Store repo operations** (use `git mv` to preserve history within the repo):

1. `git -C /Users/milovan/projects/divinipress-store mv docs/custom-order-domain-reference.md docs/domain/custom-order-domain-layer.md`
2. `git -C /Users/milovan/projects/divinipress-store mv docs/product-data-flow-cheatsheet.md docs/domain/product-data-flow-cheatsheet.md`
3. `git -C /Users/milovan/projects/divinipress-store mv docs/display-name-reference.md docs/domain/display-name-reference.md`

**Backend repo operations:**

4. `git -C /Users/milovan/projects/divinipress-backend mv docs/collection-routes.md docs/domain/collection-routes.md`

5. **Update `backend/CLAUDE.md:108` reference BEFORE deleting `backend/docs/proofing-flow.md`.** The line references `docs/proofing-flow.md` — update to `docs/domain/proofing-flow.md`. Use Edit with a stable anchor (read the line first to capture exact text). The `.claude/worktrees/feat+display-name/CLAUDE.md` shadow copy at line 108 is NOT updated (worktree is a shadow, not the source of truth).

6. `git -C /Users/milovan/projects/divinipress-backend rm docs/proofing-flow.md` (after the CLAUDE.md reference update)

7. `git -C /Users/milovan/projects/divinipress-backend rm docs/admin-hold-state-fix.md` (Imperator: delete outright, the doc conflates Admin Hold with Production Hold)

### T6 — Add cross-references

Apply these content edits to the migrated files in their NEW locations (after T4 copy, before T8 commits):

**In `divinipress-store/docs/domain/custom-order.md`:** add a cross-reference note:

> See `custom-order-domain-layer.md` in this directory for the frontend hook API reference, adapter mappings, and page wiring details.

**In `divinipress-store/docs/domain/custom-order-domain-layer.md`:** add a cross-reference note near the top:

> See `custom-order.md` in this directory for the entity concept, state machine rationale, and the known broken Admin Hold wiring.

**In `divinipress-store/docs/domain/catalog-product.md`:** append to cross-references section:

> See `product-data-flow-cheatsheet.md` sections 1-2 for API payload shapes, Zod validation, and backend storage of configured products.

**In `divinipress-store/docs/domain/saved-product.md`:** append to cross-references section:

> See `product-data-flow-cheatsheet.md` section 5 for post-approval field derivation, `hydrateImages`, and the saved-product reorder code path.
> See `display-name-reference.md` for the complete consumer list, cross-reference pattern, and mutation hook API.

**In `divinipress-backend/docs/domain/collection.md`:** append to cross-references section:

> See `collection-routes.md` in this directory for the API reference on the update and delete endpoints.

**In `divinipress-backend/docs/domain/collection-routes.md`:** add a cross-reference note near the top:

> See `collection.md` in this directory for entity model, permission enforcement gap, default-Collection myth correction, and Team relationship.

### T7 — Pre-commit validation

Before committing, verify the state of each working tree:

1. **Store repo:** `git -C /Users/milovan/projects/divinipress-store status --porcelain` — expected: 13 new files in `docs/domain/`, 3 renamed files moved into `docs/domain/`, 1 modified `.gitignore`, possibly modified files in `docs/domain/` from T6 cross-refs. Nothing outside `docs/` should be staged. Report if unexpected.
2. **Backend repo:** `git -C /Users/milovan/projects/divinipress-backend status --porcelain` — expected: 8 new files in `docs/domain/`, 1 renamed file moved into `docs/domain/`, 2 deletions (`docs/proofing-flow.md`, `docs/admin-hold-state-fix.md`), 1 modified `CLAUDE.md`. Nothing outside `docs/` and `CLAUDE.md` should be staged.
3. **Consilium repo:** `git -C /Users/milovan/projects/Consilium status --porcelain graphify-source/` — expected: 23 deletions of the Consilium migration files (plus the Imperator's uncommitted state which we do NOT touch).

### T8 — Commit per repo

**Store commit — single commit.** The pre-commit hook at `scripts/pre-commit-validate.sh:32-33` only scans `.ts/.tsx` files and early-exits on markdown-only commits. The 8-file rule does not apply. One commit for all store operations.

Stage with explicit file list (no `git add -A`):

```bash
git -C /Users/milovan/projects/divinipress-store add \
  .gitignore \
  docs/domain/catalog-product.md \
  docs/domain/saved-product.md \
  docs/domain/collection.md \
  docs/domain/team.md \
  docs/domain/reorder-flow.md \
  docs/domain/role-admin.md \
  docs/domain/role-designer.md \
  docs/domain/role-staff.md \
  docs/domain/invite-flow.md \
  docs/domain/onboarding-flow.md \
  docs/domain/custom-order.md \
  docs/domain/proof.md \
  docs/domain/user-level-views.md \
  docs/domain/custom-order-domain-layer.md \
  docs/domain/product-data-flow-cheatsheet.md \
  docs/domain/display-name-reference.md
```

(The three renames are staged automatically by `git mv` in T5; re-adding them here is safe — `git add` on already-staged files is a no-op.)

Commit message:

```
docs(domain): migrate Consilium domain corpus (Pass 3)

Moves 13 Pass 2 audited domain docs from the Consilium graphify-source
staging directory into docs/domain/ as part of the graphify corpus
restructure for directory-based chunking. Relocates 3 existing store docs
(custom-order-domain-reference renamed to custom-order-domain-layer,
product-data-flow-cheatsheet, display-name-reference) into docs/domain/
to chunk alongside the Consilium corpus. Whitelists docs/domain/ in
.gitignore. Adds cross-references between Consilium and coexisting docs
per the Phase 3a overlap audit.

Consilium files carry minimal YAML frontmatter identifying source,
contributor, captured_at, domain, concept, and audit provenance. The
user-level-views.md file uses audited_in: imperator-source since it was
authored directly by the Imperator and never went through the cluster
audit mechanic.
```

**Backend commit — single commit.**

Stage with explicit file list:

```bash
git -C /Users/milovan/projects/divinipress-backend add \
  CLAUDE.md \
  docs/domain/order-lifecycle.md \
  docs/domain/order-status.md \
  docs/domain/job-status.md \
  docs/domain/proofing-flow.md \
  docs/domain/payment-status.md \
  docs/domain/complex-pricing.md \
  docs/domain/permission-system.md \
  docs/domain/role-super-admin.md \
  docs/domain/collection-routes.md
```

(`docs/proofing-flow.md` and `docs/admin-hold-state-fix.md` deletions are already staged by `git rm` in T5.)

Commit message:

```
docs(domain): migrate Consilium domain corpus (Pass 3)

Moves 8 Pass 2 audited backend domain docs into docs/domain/. Relocates
the existing collection-routes.md into docs/domain/ to chunk alongside
the Consilium corpus. Updates CLAUDE.md reference to the new
docs/domain/proofing-flow.md path. Deletes the stale docs/proofing-flow.md
(superseded by the Pass 2 audited version). Deletes admin-hold-state-fix.md
per Imperator decision — the doc conflated Admin Hold (pre-proofing
internal approval) with Production Hold (post-approval production
blocker) and proposed a fix based on the wrong premise.

Adds cross-references between Consilium and the coexisting collection-routes.md.
```

**Consilium commit — single commit with explicit file list.**

**NEVER use `git add -A` or `git add graphify-source/` — these would sweep Imperator's uncommitted state (`DISCREPANCY_REPORT.md`, `voice-principles.md`, `visual-tokens.md` deletion). Use the exact 23-file list below.**

```bash
git -C /Users/milovan/projects/Consilium rm \
  graphify-source/catalog-product.md \
  graphify-source/saved-product.md \
  graphify-source/collection.md \
  graphify-source/team.md \
  graphify-source/reorder-flow.md \
  graphify-source/role-admin.md \
  graphify-source/role-designer.md \
  graphify-source/role-staff.md \
  graphify-source/invite-flow.md \
  graphify-source/onboarding-flow.md \
  graphify-source/custom-order.md \
  graphify-source/proof.md \
  graphify-source/order-lifecycle.md \
  graphify-source/order-status.md \
  graphify-source/job-status.md \
  graphify-source/proofing-flow.md \
  graphify-source/payment-status.md \
  graphify-source/complex-pricing.md \
  graphify-source/permission-system.md \
  graphify-source/role-super-admin.md \
  graphify-source/_terminology.md \
  graphify-source/company.md \
  graphify-source/employee.md
```

That is **23 files** — `user-level-views.md` is not listed because it was untracked (handled via `rm` in T4, no git operation needed).

After `git rm`, run `git -C /Users/milovan/projects/Consilium diff --cached --name-only` and verify the output is exactly the 23 files. If anything else is staged, abort and report.

Commit message:

```
chore(graphify-source): remove migrated corpus (Pass 3 complete)

Deletes the 23 Pass 2 audited domain docs that have been migrated to
their target directories in divinipress-store/docs/domain/,
divinipress-backend/docs/domain/, and graphify-raw/domain-bible/ as
part of the Pass 3 corpus restructure. The 24th migrated file
(user-level-views.md) was untracked and removed via rm, so it does
not appear here.

The graphify-source/ directory served as the staging area for Pass 0
and Pass 2 audit work; its job is done.
```

**graphify-raw:** no git operations — not a repo. File state is already correct after T3 and T4.

### T9 — Post-migration verification

Run these checks and report each result:

1. `ls /Users/milovan/projects/divinipress-store/docs/domain/` — expect 16 files (13 Consilium + 3 coexisting)
2. `ls /Users/milovan/projects/divinipress-backend/docs/domain/` — expect 9 files (8 Consilium + 1 coexisting)
3. `ls /Users/milovan/projects/graphify-raw/domain-bible/` — expect 3 files (`_terminology.md`, `company.md`, `employee.md`)
4. Verify `divinipress-backend/docs/proofing-flow.md` does NOT exist (it was deleted)
5. Verify `divinipress-backend/docs/admin-hold-state-fix.md` does NOT exist
6. Verify `divinipress-store/docs/custom-order-domain-reference.md` does NOT exist (moved)
7. Verify `divinipress-store/docs/product-data-flow-cheatsheet.md` does NOT exist (moved)
8. Verify `divinipress-store/docs/display-name-reference.md` does NOT exist (moved)
9. Verify `divinipress-backend/docs/collection-routes.md` does NOT exist (moved)
10. Verify `/Users/milovan/projects/Consilium/graphify-source/user-level-views.md` does NOT exist (removed via `rm`)
11. `head -10 /Users/milovan/projects/divinipress-store/docs/domain/catalog-product.md` — verify frontmatter is present with `domain: store`, `concept: catalog-product`, `audited_in: pass-2`
12. `head -10 /Users/milovan/projects/divinipress-store/docs/domain/user-level-views.md` — verify frontmatter has `audited_in: imperator-source`
13. `head -10 /Users/milovan/projects/graphify-raw/domain-bible/_terminology.md` — verify frontmatter with `domain: cross-cutting`, `concept: terminology`
14. `grep -A 3 "Intended placement" /Users/milovan/projects/graphify-raw/domain-bible/_terminology.md` — verify the T3.5 Naming Trap 4 correction landed
15. `grep "docs/proofing-flow" /Users/milovan/projects/divinipress-backend/CLAUDE.md` — expect empty (reference was updated to `docs/domain/proofing-flow.md`)
16. `git -C /Users/milovan/projects/divinipress-store log --oneline -1` — confirm the commit landed
17. `git -C /Users/milovan/projects/divinipress-backend log --oneline -1` — confirm
18. `git -C /Users/milovan/projects/Consilium log --oneline -1` — confirm
19. **Do NOT push any commits.**

## Success Criteria

- 24 Consilium source files removed from `Consilium/graphify-source/` (23 via `git rm`, 1 via `rm`)
- 24 files present at target destinations with valid frontmatter
- 4 existing repo docs moved into `docs/domain/` (3 store, 1 backend)
- 2 existing backend docs deleted (`proofing-flow.md`, `admin-hold-state-fix.md`)
- 9 stale files removed from `domain-bible/` (with `/tmp` backup)
- `backend/CLAUDE.md` reference to `proofing-flow.md` updated
- Cross-references added per Phase 3a
- Naming Trap 4 correction present in the migrated `_terminology.md`
- 3 commits (1 store, 1 backend, 1 Consilium). All unpushed.
- Store commit uses explicit file list; Consilium commit uses explicit file list; no sweeping of Imperator's uncommitted state.

## Rollback

On mid-task failure: capture `git status` + `git log --oneline -3` in all three git repos and the file state of `graphify-raw/domain-bible/`. Report to Consul. Do NOT attempt unilateral `git reset --hard`, `git checkout --`, or similar destructive recovery. For graphify-raw the rollback snapshot is at `/tmp/graphify-raw-domain-bible-backup-<timestamp>/`. The Consul evaluates next steps.

## Report

Return a concise summary:
- Commits made (3 SHAs)
- Any T9 check that failed
- Any file that required non-standard handling beyond this edict's instructions
- Anything surprising
