# Pass 3: Graphify Corpus Migration — Specification

**Date:** 2026-04-10
**Author:** Publius Auctor (Consul of the Consilium)
**Status:** Draft, awaiting Imperator review
**Prerequisite:** Pass 0 (terminology rewrite) + Pass 2 (cluster audit integration) — both complete

---

## Purpose

Physically distribute the audited Consilium corpus from `/Users/milovan/projects/Consilium/graphify-source/` into three target directories so that graphify's directory-based chunking mechanics co-locate each domain doc with the code it describes. The expected effect: stronger EXTRACTED edges between concept nodes and code entities, higher edge density overall, and the graphify graph finally reflects the corrected domain knowledge from Pass 2.

The "why" is the same as the original handoff (`Consilium/docs/ideas/graphify-corpus-restructure.md`): graphify chunks files by directory with a soft target of 20-25 files per chunk, and edges are chunk-scoped — meaning concepts separated across chunks cannot connect. The fix is folder structure, not atomic files.

## Inputs

| Artifact | Path | Role |
|-|-|-|
| Audited corpus | `/Users/milovan/projects/Consilium/graphify-source/` | 23 content files + `_terminology.md` + `user-level-views.md` = 24 total, all Pass 2 corrected |
| Store repo | `/Users/milovan/projects/divinipress-store/` | Target A — customer-facing / frontend concepts |
| Backend repo | `/Users/milovan/projects/divinipress-backend/` | Target B — state machines / models / server logic |
| Graphify ingestion root | `/Users/milovan/projects/graphify-raw/` | Target C — cross-cutting bucket (`domain-bible/`) |
| Graphify package | `~/.venvs/graphify/lib/python3.12/site-packages/graphify/` (v0.3.28) | Chunking mechanics verification |
| Original handoff | `Consilium/docs/ideas/graphify-corpus-restructure.md` | Baseline plan (pre-Pass 2) |

## Files Already Cut (Not Migrating)

Per Pass 0 cut list, confirmed by the Imperator:

- `brand-identity.md` — marketing positioning
- `visual-tokens.md` — likely duplicates `store/docs/component-decisions.md`
- `voice-principles.md` — brand voice, marketing concern
- `DISCREPANCY_REPORT.md` — meta log, superseded by Pass 2 commits

The first three may still show as working-tree modifications in the Consilium repo until the Imperator finalizes the cut commits.

## Distribution Map

### Store (`divinipress-store/docs/domain/`) — 13 files

Customer-facing concepts, frontend pages, UI-driven workflows. These docs describe content most directly tied to store code.

| File | Center of gravity | Pass 2 status |
|-|-|-|
| `catalog-product.md` | Catalog browsing, product configuration (frontend) | Five categories corrected, legacy removed |
| `saved-product.md` | My Products, CompanyProduct link layer | display_name PR state documented |
| `collection.md` | Collection CRUD, backend permission gap flagged | Default Collection myth killed |
| `team.md` | Team management, privilege escalation warning added | Name uniqueness bug flagged |
| `reorder-flow.md` | Customer reorder flow (bypasses proofing) | PROOF_DONE path flagged unresolved |
| `role-admin.md` | Customer Admin role | Admin Hold corrected to placeholder |
| `role-designer.md` | Customer Designer role | URGENT gating warning added |
| `role-staff.md` | Customer Staff role | Dashboard fix merge confirmed |
| `invite-flow.md` | Customer invite flow + RESEND wiring | Resend framing corrected to product gap |
| `onboarding-flow.md` | In-app onboarding dialog | Marketing contamination stripped |
| `custom-order.md` | Custom-order entity + frontend domain layer | Admin Hold + timeline corrected |
| `proof.md` | Proof entity + customer proof review | ProofNoteType three-concept mapping applied |
| `user-level-views.md` | Role capability matrix (canonical reference) | Unchanged — canonical source |

### Backend (`divinipress-backend/docs/domain/`) — 8 files

State machines, models, server logic. These docs describe content most directly tied to backend code.

| File | Center of gravity | Pass 2 status |
|-|-|-|
| `order-lifecycle.md` | 15-event state machine, OrderStatus transitions | Admin Hold placeholder + reorder unresolved added |
| `order-status.md` | OrderStatus enum, transition table | OrderStatus ≠ JobStatus hardened |
| `job-status.md` | JobStatus enum, Super Admin proofs table lifecycle | OrderStatus ≠ JobStatus hardened |
| `proofing-flow.md` | Proof workflow, holdOrder guard bug call-out | holdOrder bug verified and surfaced |
| `payment-status.md` | PaymentStatus display map, no-enum reality | Zero subscribers + Pay Now disabled confirmed |
| `complex-pricing.md` | Complex pricing module + apparel pricing workflow | Pantone dead code, tier half-wired documented |
| `permission-system.md` | Permission constants, backend enforcement state | URGENT Designer gating warning added |
| `role-super-admin.md` | Super Admin role, company.handle check, impersonation | Org CRUD status corrected, impersonation bar verified |

### Cross-cutting (`graphify-raw/domain-bible/`) — 3 files

Content that spans both repos or defines shared vocabulary. Lives in the graphify-raw ingestion root so it chunks alongside both code trees.

| File | Role | Pass 2 status |
|-|-|-|
| `_terminology.md` | Pass 0 canonical oath — naming traps, entity lifecycles, live/planned/legacy discipline | Pass 0 primary artifact |
| `company.md` | Company model, creation flow, pricing tier half-wired | Company creation corrected to LIVE |
| `employee.md` | Employee model, soft-delete accepted gap | Auth cleanup gap documented |

**Total: 13 + 8 + 3 = 24 files.**

## The Four Open Questions — Status and Plan

### Q1 — Overlap with Existing Repo Docs

**Pre-existing files in target directories that may collide or overlap:**

| Existing file | Consilium counterpart | Action needed |
|-|-|-|
| `divinipress-backend/docs/proofing-flow.md` | `proofing-flow.md` | **DIRECT NAME COLLISION.** Diff the two; decide which is canonical. The Consilium version is Pass 2 audited — likely wins, but the existing file may have backend-specific content worth preserving. |
| `divinipress-store/docs/custom-order-domain-reference.md` | `custom-order.md` | Topical overlap. Decide: merge into one, keep both with cross-refs, or rename the Consilium version to avoid confusion. |
| `divinipress-backend/docs/admin-hold-state-fix.md` | Admin Hold content in `order-lifecycle.md`, `custom-order.md` | Possibly obsolete now that Pass 2 verified Admin Hold wiring is incoherent. Review and either delete or update to reference the Pass 2 findings. |
| `divinipress-backend/docs/collection-routes.md` | `collection.md` | Different scope (routes vs entity). Probably coexist; verify no content duplication. |
| `divinipress-store/docs/product-data-flow-cheatsheet.md` | `catalog-product.md`, `saved-product.md` | Topical overlap. Verify no stale info in the cheatsheet post Pass 2. |
| `divinipress-store/docs/display-name-reference.md` | `saved-product.md` display_name section | Display-name-specific reference; should remain authoritative for that feature. |
| `graphify-raw/domain-bible/*` (9 old files: MANIFEST, naming, orders, products, proofing, roles, teams-collections, backend-code-map, store-code-map) | All superseded by Pass 2 corpus | See Q3 — delete or repurpose. |

**Plan:** dispatch **one overlap-audit scout** to diff each collision pair, read both versions, and produce a resolution table: keep / merge / delete / rename, with reasoning per file. Blocks Phase 3e.

### Q2 — Exact Chunk Threshold in `ingest.py`

The original research agent quoted "20-25 files per chunk" from `skill.md:186` without verifying the algorithm. Before committing to the three-way split sizes, we need to know:

- Is 25 a hard ceiling or soft target?
- What sort order determines splitting when a directory exceeds the limit? (Alphabetical? mtime? Random?)
- Does graphify respect `_` prefixed files (like `_terminology.md`) or ignore them? (Matters because `_terminology.md` is cross-cutting.)
- Is there a `.graphifyignore` file or built-in ignore mechanism? (Matters for excluding `DISCREPANCY_REPORT.md` and any other docs we don't want ingested.)
- How does graphify handle subfolders inside a target directory? Does each subfolder become its own chunk, or are files in the tree merged?

**Plan:** 30-second direct read of `~/.venvs/graphify/lib/python3.12/site-packages/graphify/ingest.py`. Answer all five questions. Confirm the three-way split sizes are safe. Non-blocking — can happen in parallel with Phase 3a.

### Q3 — Fate of `graphify-raw/domain-bible/`

The folder currently holds 9 rough draft files from a pre-Pass-0 era: `MANIFEST.md`, `naming.md`, `orders.md`, `products.md`, `proofing.md`, `roles.md`, `teams-collections.md`, `backend-code-map.md`, `store-code-map.md`. These are stale drafts of content the Pass 2 corpus now covers correctly.

**Two options:**

1. **Delete entirely.** The Consilium corpus supersedes it. Domain bible becomes empty or is removed.
2. **Repurpose as the cross-cutting bucket.** Delete the 9 old files; move `_terminology.md`, `company.md`, `employee.md` (the cross-cutting files from the distribution map above) into this folder. The folder already lives in graphify-raw and is already ingested by graphify — zero friction for ingestion path changes.

**Consul recommendation:** **Option 2 (repurpose).** Zero ingestion path changes, preserves the dir name graphify already reads, provides a natural home for cross-cutting docs. The 9 old files get deleted as part of the move.

**Plan:** Await Imperator approval. Then delete the 9 stale files and move the 3 cross-cutting files in. Done.

### Q4 — Frontmatter Schema

Every moved file should get YAML frontmatter so graphify extracts node metadata (`source_url`, `author`, `contributor`, `captured_at`) automatically per `skill.md:240-241`.

**Minimal schema (Consul recommendation):**

```yaml
---
source: consilium-domain-extraction
contributor: milovan
captured_at: 2026-04-10
domain: store        # or "backend" or "cross-cutting"
concept: custom-order   # kebab-case matching the canonical term from _terminology.md
audited_in: pass-2      # audit provenance
---
```

**Extended schema (alternative, more work):**

Add a `references:` array listing which repo files the doc describes, e.g.:

```yaml
references:
  - divinipress-backend/src/api/custom-order/order-flow.ts
  - divinipress-store/src/app/_domain/custom-order/state-machine.ts
```

This gives the extraction LLM explicit hints for doc→code edges and can meaningfully increase EXTRACTED edge density. Worth considering if the re-run post Pass 3 is still underwhelming.

**Plan:** Start with the minimal schema (fast to apply via script). Upgrade to extended if the first post-migration graphify run is still weak.

## Phase Structure

### Phase 3a — Resolve Overlaps (Q1)

**Owner:** overlap-audit scout (to be dispatched)
**Blocks:** Phase 3e execution
**Output:** resolution table per collision pair — keep / merge / delete / rename

Dispatch a scout to diff each collision pair and propose resolutions. Scout reads both versions, identifies unique content, recommends the canonical winner or a merged result. Scout does NOT perform the merge — it produces a table for Imperator approval.

### Phase 3b — Verify Chunk Mechanics (Q2)

**Owner:** Consul, direct read
**Blocks:** Nothing (parallel with Phase 3a)
**Output:** answers to the five Q2 questions, committed to this spec's "Resolved Q2" section

Read `~/.venvs/graphify/lib/python3.12/site-packages/graphify/ingest.py` directly. Answer the five questions inline.

### Phase 3c — Decide `domain-bible/` Fate (Q3)

**Owner:** Imperator decision
**Blocks:** Phase 3e execution (cross-cutting bucket destination)
**Default:** Repurpose (Consul recommendation)

### Phase 3d — Lock Frontmatter Schema (Q4)

**Owner:** Imperator decision
**Blocks:** Phase 3e frontmatter script
**Default:** Minimal schema (Consul recommendation)

### Phase 3e — Execute Migration

**Owner:** migration scribe (to be dispatched, general-purpose agent)
**Blocks:** Phase 3f cleanup
**Prerequisite:** Phases 3a, 3b, 3c, 3d resolved
**Output:** 24 files moved, frontmatter applied, per-repo commits

Steps:

1. Create target directories:
   - `divinipress-store/docs/domain/`
   - `divinipress-backend/docs/domain/`
   - (`graphify-raw/domain-bible/` already exists; delete old contents per Phase 3c)
2. Move files per the distribution map. Use `git mv` to preserve history.
3. Apply the approved frontmatter schema via script:
   ```bash
   for f in <moved files>; do
     prepend_frontmatter "$f" "<computed domain + concept>"
   done
   ```
4. Handle the collision pairs per the Phase 3a resolution table (merge into existing, replace existing, rename, etc.)
5. Commit per destination repo:
   - Commit in `divinipress-store/`: "docs(domain): migrate Consilium domain corpus (Pass 3)"
   - Commit in `divinipress-backend/`: same title, store-repo variant
   - Commit in `graphify-raw/` (if separate repo): same
   - Commit in `Consilium/`: "chore(graphify-source): remove staging corpus (migrated to target repos)"
6. Leave commits unpushed.

### Phase 3f — Cleanup

**Owner:** migration scribe (continued from 3e)
**Output:** clean working trees in all four repos

Steps:

1. Delete `/Users/milovan/projects/Consilium/graphify-source/` (staging dir, job done).
2. Confirm `graphify-raw/domain-bible/` holds exactly the 3 cross-cutting files + nothing else.
3. Finalize the cut files in Consilium: `brand-identity.md`, `visual-tokens.md`, `voice-principles.md` should be deleted (some may already be deleted in the working tree).
4. Verify the 8-file-per-commit pre-commit rule in the store repo is respected for the migration commit.

### Phase 3g — Re-run Graphify & Compare

**Owner:** Consul + Imperator (observation)
**Output:** new graph + before/after comparison

Steps:

1. Capture the current graph as a baseline: `cp graphify-raw/graphify-out/graph.json /tmp/graph-baseline.json`
2. Run: `/graphify /Users/milovan/projects/graphify-raw --mode deep --update`
3. Compare metrics:
   - Total nodes before/after
   - Total edges before/after
   - EXTRACTED edge count specifically (these are the highest-value edges)
   - Edge confidence distribution
   - Cluster count and sizes (Leiden output)
4. Qualitative check: query graphify for the concepts the Imperator cares about most (saved products flow, Super Admin vs Admin, Order Status vs Job Status). Do the answers look meaningfully better?

### Phase 3h — Evaluate

**Owner:** Imperator
**Output:** decision — Pass 3 done, or next investigation

- **If meaningfully better:** Pass 3 complete. Close out. The "underwhelming graph" problem was corpus structure + content accuracy, now resolved.
- **If still underwhelming:** the gap is elsewhere. Next investigation targets (in priority order):
  1. Frontmatter schema upgrade to extended (with explicit `references:` array)
  2. Extraction prompt tuning
  3. Model choice for extraction subagents
  4. Leiden clustering resolution parameter
  5. Node deduplication logic

## Open Decisions the Imperator Must Make Before Execution

1. **Approve the distribution map** (24 files across 3 destinations), or propose changes. Specifically, the placement of `custom-order.md` and `proof.md` in the store bucket (they describe cross-repo concepts) is debatable — I chose store because the frontend has a substantial domain layer at `src/app/_domain/custom-order/`.
2. **Approve the Phase 3a overlap-audit scout dispatch.** I will brief it with the collision pair list above; it returns a resolution table for your approval.
3. **Approve Q3 resolution: repurpose `domain-bible/`** (Consul default) vs delete entirely. Repurpose is my strong recommendation.
4. **Approve Q4 frontmatter schema: minimal** (Consul default) vs extended-with-references. Minimal is my recommendation for the first run.
5. **Authorize the migration scribe dispatch for Phase 3e.** This is the actual file-moving work; I will use one general-purpose agent with explicit per-repo commit instructions.

## Expected Artifacts After Pass 3

- 24 files migrated with frontmatter, distributed across three target directories
- `graphify-source/` staging directory deleted
- `domain-bible/` holds exactly the 3 cross-cutting files (per Q3 repurpose decision)
- Per-repo migration commits (unpushed)
- New graphify graph generated and compared against baseline
- Qualitative validation via test queries
- Either Pass 3 marked complete, or next investigation queued

## What Pass 3 Does NOT Do

- Does not push any commits anywhere
- Does not modify backend or store code (only docs)
- Does not create Linear tickets (those are tracked separately in `divinipress-store/docs/planning/tech-debt.md` as of 2026-04-10)
- Does not change graphify's ingestion pipeline or SKILL.md
- Does not touch the marketing site

## Prerequisites to Start

- Imperator review of this spec — approve or direct revisions
- Answer to Decisions #1-5 above

## Review Instructions for the Imperator

Read top to bottom. Flag:

- Any file in the distribution map you want moved to a different bucket
- Any overlap pair you want handled differently than "dispatch a scout to audit"
- Any phase you want skipped, reordered, or extended
- The frontmatter schema preference (minimal vs extended)
- The domain-bible fate preference (repurpose vs delete)

Once approved, I dispatch Phase 3a (overlap scout) and Phase 3b (my direct ingest.py read) in parallel.
