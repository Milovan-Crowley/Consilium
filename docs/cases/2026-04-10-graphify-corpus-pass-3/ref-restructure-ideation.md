# Graphify Source Corpus Restructure — Handoff

**Date:** 2026-04-10
**Status:** Research complete. Migration NOT yet executed. Mil will plan execution in a separate session.
**Purpose:** Capture the full investigation so the next agent can resume without re-deriving anything.

---

## TL;DR for the next agent

Mil's knowledge graph over his Divinipress corpus feels underwhelming. His working hypothesis was "I should split my docs into atomic single-concept files." **That hypothesis is wrong** — it would reduce edge density, not increase it. The real leverage is **folder structure**, because graphify chunks files by directory and edges are chunk-scoped. The corpus at `/Users/milovan/projects/Consilium/graphify-source/` (27 files, flat) is content-excellent but structurally wrong for graphify's chunking algorithm. Recommended fix: distribute the 27 files across three existing `docs/` directories (store repo, backend repo, cross-cutting) so each dir lands in its own 20-25-file LLM chunk AND sits alongside the real code it references. Mil agreed this is the right direction but has not committed to execution. Four open questions need resolution before migration — see "Open questions" section.

A different agent previously told Mil the opposite ("make docs more atomic"). That advice was wrong and has been ruled out — do not re-litigate unless you have new evidence from the code. The verdict here is grounded in file:line references from the actual graphify source.

---

## Environment state at end of session

| Thing | State |
|-|-|
| `graphifyy` in venv `~/.venvs/graphify/` (Python 3.12) | Upgraded 0.3.24 → 0.3.28. This is what the MCP server uses |
| `graphifyy` in `/opt/homebrew/.../python3.14/` | Upgraded 0.3.24 → 0.3.28. This is what the `/graphify` CLI uses |
| `~/.claude/skills/graphify/SKILL.md` | Still 0.3.24. Five lines behind (only adds `--directed` flag docs). Trivial sync, not yet done |
| `/Users/milovan/projects/Consilium/graphify-source/` | 27 .md files, flat structure. UNTOUCHED |
| `/Users/milovan/projects/graphify-raw/domain-bible/` | 9 old files (early draft of same corpus). UNTOUCHED |
| Mil's existing graphify runs | Already using `--mode deep`. This "biggest lever" is already pulled |

---

## Context

Mil runs graphify across `/Users/milovan/projects/graphify-raw/` which contains:

- `divinipress-backend/` — full backend repo
- `divinipress-store/` — full frontend repo
- `domain-bible/` — 9 rough domain docs (earlier draft of what's now in Consilium)
- `graphify-out/` — generated graph

He built a richer, normalized, QA'd version of the domain docs at `Consilium/graphify-source/` (27 files) intending to import them into graphify but paused to investigate why the current graph feels underwhelming. This session researched the extraction mechanics, audited the new corpus against those mechanics, and landed on a distribution strategy.

---

## Research findings — how graphify actually extracts

A research agent read `ingest.py`, `extract.py`, `build.py`, `cluster.py`, and `skill.md` in the v0.3.28 Python package at `/Users/milovan/.venvs/graphify/lib/python3.12/site-packages/graphify/`. Citations use `file:line` format.

### The critical mechanics

1. **Unit of extraction is NOT per-file — it's per-chunk-of-20-25-files, grouped by directory.** From `skill.md:186`:

   > "Split into chunks of 20-25 files each... group files from the same directory together so related artifacts land in the same chunk and cross-file relationships are more likely to be extracted."

2. **Each chunk → single LLM call returning nodes AND edges together.** Each subagent gets a `FILE_LIST` (`skill.md:206-207`), reads the files itself, and returns one structured JSON response containing nodes, edges, hyperedges, and tokens in a single-shot schema. From `skill.md:252`:

   > `{"nodes":[...],"edges":[{"source","target","relation":"calls|implements|references|cites|conceptually_related_to|shares_data_with|semantically_similar_to|rationale_for","confidence":"EXTRACTED|INFERRED|AMBIGUOUS","confidence_score":1.0,...}],"hyperedges":[...]}`

   Relation vocabulary is FIXED. Output is "ONLY valid JSON... no explanation, no markdown fences" (`skill.md:204`).

3. **Edges are chunk-scoped ONLY.** Edges come out of the same LLM call as the nodes they connect. There is:
   - NO second pass
   - NO embedding similarity computation
   - NO cross-chunk edge inference

   Even `semantically_similar_to` edges are emitted by the same subagent only between concepts already in the same chunk (`skill.md:228`: "if two concepts **in this chunk**..."). `build.py:44-53` just accepts whatever edges the extractions give it. `build.py:60-78` merges multiple extraction dicts with NO cross-chunk edge inference.

   The ONLY post-hoc edge creation is AST-side INFERRED `uses` edges from cross-file Python imports (`extract.py:2045-2159`) — this is irrelevant to markdown docs, only matters for code files.

4. **Consequence:** edges only exist between concepts the LLM saw together in one chunk. If two related concepts land in different chunks, they cannot connect — full stop. This is the single most important fact about graphify's architecture.

5. **EXTRACTED / INFERRED / AMBIGUOUS tags** assigned by the LLM per rules at `skill.md:210-212`:
   - **EXTRACTED** — relationship explicit in source (import, citation, "see §3.2"). Confidence 1.0 (`skill.md:244`).
   - **INFERRED** — reasonable inference (shared data structure, implied dependency). Confidence 0.4-0.9 (`skill.md:245-248`).
   - **AMBIGUOUS** — uncertain. Confidence 0.1-0.3 (`skill.md:249`). Never omitted.

### Verdict on Mil's original "atomic files" hypothesis

**FALSE.** Splitting generalized docs into atomic single-concept files would *reduce* edge density, not increase it.

**Walk the code both ways:**

- **1 five-concept doc:** subagent sees all five concepts in one prompt context → can propose pairwise edges between all 10 pairs and a hyperedge binding them (`skill.md:234-238`).
- **5 single-concept docs:** same subagent still gets all 5 files in its 20-25 file chunk (dir-grouped per `skill.md:186`) → it *can* still propose the same 10 edges, but each concept lives in its own file with no in-file cohabitation to anchor "shared data structure" or "shared protocol" inferences (`skill.md:211, 246`). Leiden clustering (`cluster.py:21-52`) then operates on the resulting edges only — it has no notion of file boundaries.

**Net effect:** the multi-concept doc gives the LLM stronger intra-document co-occurrence signal to justify INFERRED edges and hyperedges. Splitting usually reduces edge density. The only win from splitting is that `rationale_for` edges (`skill.md:216`) stay cleanly attached to one concept — a minor benefit that does not offset the loss.

Doc shape most affects **INFERRED** edges. Multi-concept docs create explicit in-document co-occurrence that the LLM reads as "shared data structure / implied dependency", earning INFERRED edges at confidence 0.6-0.9. Atomic files strip that context and push borderline inferences toward AMBIGUOUS or omission.

### Where the real leverage is (in order of impact)

1. **`--mode deep`** (`skill.md:225-226`) — aggressive INFERRED edges. **ALREADY IN USE** per Mil's confirmation. This means the "just pull the obvious flag" answer does not apply here. The gap is corpus-shape + chunk composition, not command-line flags.

2. **Folder structure / chunk composition** (`skill.md:186`) — because files are chunked by directory, **folder structure matters more than file granularity.** Put semantically related docs in the same subfolder so they land in the same 20-25-file chunk.

3. **YAML frontmatter** (`skill.md:240-241`) — every node inherits `source_url`, `author`, `contributor`, `captured_at` from frontmatter. Currently MISSING on 25 of 27 Consilium docs.

4. **Doc shape** — ~1-5k words per doc with clear H1/H2 headings and named entities. Consilium corpus is already in this sweet spot (3-16KB range, avg ~7KB) — no action needed here.

---

## Audit of /Users/milovan/projects/Consilium/graphify-source/

### Inventory

27 `.md` files, flat structure (no subfolders), plus `.gitkeep`. Sizes 3.4KB - 15.8KB, avg ~7KB. Files:

```
_terminology.md              (6KB)   glossary / canonical names
brand-identity.md            (10KB)  what Divinipress is/isn't
catalog-product.md           (9KB)
collection.md                (5KB)
company.md                   (6KB)
complex-pricing.md           (8KB)
custom-order.md              (7KB)
DISCREPANCY_REPORT.md        (16KB)  META — cleanup log, NOT domain content
employee.md                  (9KB)
invite-flow.md               (5KB)
job-status.md                (6KB)
onboarding-flow.md           (5KB)
order-lifecycle.md           (10KB)
order-status.md              (6KB)
payment-status.md            (6KB)
permission-system.md         (9KB)
proof.md                     (6KB)
proofing-flow.md             (12KB)
reorder-flow.md              (5KB)
role-admin.md                (8KB)
role-designer.md             (7KB)
role-staff.md                (3KB)   smallest
role-super-admin.md          (8KB)
saved-product.md             (8KB)
team.md                      (6KB)
visual-tokens.md             (10KB)  has some ^--- matches, may have frontmatter
voice-principles.md          (7KB)
```

### What's excellent about it

| Thing | Why it matters |
|-|-|
| 27 files, 3-16KB each (~1-3k words) | Dead center of the sweet spot for extraction |
| One coherent concept per file with clear naming | Each file produces a strong anchor node |
| Enum tables (OrderStatus × 10, JobStatus × 11) | Each enum value becomes its own extracted node with a clear relation back to its parent |
| Explicit cross-refs in backticks (`` `order-status.md` ``) | Graphify will tag these **EXTRACTED** at confidence 1.0 — highest quality edges possible |
| `Source: divinipress-backend/src/modules/custom-order/type.ts` refs | Hard references to real code. When ingested alongside backend/store, these become cross-corpus EXTRACTED edges — the rarest and most valuable kind |
| `_terminology.md` with "extraction agents MUST use these exact names" | **The single most important file in the corpus.** Normalizes concept names and prevents the #1 cause of graph fragmentation (same concept, two names, two nodes). Whoever built this knew what they were doing |
| `DISCREPANCY_REPORT.md` showing a cross-ref normalization pass already happened | Evidence of QA work — "User groups" replaced with "Teams" per `_terminology.md`, inline cross-refs reformatted to backtick style, etc. |

### Problems

1. **27 files in one flat folder.** Exceeds the 20-25 chunk ceiling (see Q2 below for exact-threshold uncertainty), forcing graphify to split them into 2 chunks of ~13-14 files each. Split order is likely alphabetical or mtime, NOT semantic. Worst case: `order-lifecycle.md` in chunk 1, `proofing-flow.md` in chunk 2, severing the most important relationship in the domain.

2. **Frontmatter missing on 25 of 27 files.** Only `visual-tokens.md` and possibly `role-designer.md` have any `^---` lines (and `role-designer.md`'s match may be a horizontal rule, not frontmatter). Every node ends up without `source_url / author / contributor / captured_at` metadata.

3. **`DISCREPANCY_REPORT.md` will pollute the graph.** It's a meta cleanup log listing corrections made to other docs — not domain knowledge. If ingested, it creates a meta-node with edges to every other doc labeled "references / corrected / unverifiable", polluting clustering with meta-relationships that aren't part of the actual domain. MUST be excluded from ingestion.

4. **`_terminology.md` will become a mega-hub node** connected to most concepts (because every concept references a canonical term). Probably intentional as a semantic backbone, but worth being aware of — may need to be excluded if it creates a noisy hub that hurts clustering.

---

## The three-way distribution strategy (recommended)

Rather than keep the corpus in `Consilium/graphify-source/` or dump it all in one `graphify-raw/` subfolder, **distribute the files into the repos' existing `docs/` folders based on which repo the concept actually lives in.** This solves the chunking problem for free AND co-locates docs with the code they reference.

### Existing doc locations (already ingested by graphify via graphify-raw)

| Location | Currently contains |
|-|-|
| `divinipress-store/docs/` | `component-decisions.md`, `custom-order-domain-reference.md`, `display-name-reference.md`, `phase-18-integration-handoff.md`, `product-data-flow-cheatsheet.md`, `planning/`, `specs/`, `superpowers/` |
| `divinipress-backend/docs/` | `admin-hold-state-fix.md`, `api-definitions.ts`, `api-types.ts`, `collection-routes.md`, `proofing-flow.md`, `specs/` |
| `graphify-raw/domain-bible/` | `MANIFEST.md`, `naming.md`, `orders.md`, `products.md`, `proofing.md`, `roles.md`, `teams-collections.md`, `backend-code-map.md`, `store-code-map.md` |
| `divinipress-store/src/**/*.md` | **NONE** — zero convention of inline docs next to code in src/ |

### Proposed distribution

| Bucket | Target directory | Rough count | Files |
|-|-|-|-|
| Store-side concepts (UI, user-facing flows, product presentation) | `divinipress-store/docs/domain/` (create folder) | 13-15 | brand-identity, visual-tokens, voice-principles, catalog-product, collection, saved-product, custom-order (UI view), proof, reorder-flow, role-admin, role-designer, role-staff, team, invite-flow, onboarding-flow |
| Backend concepts (state machines, models, server logic) | `divinipress-backend/docs/domain/` (create folder) | 8-10 | order-lifecycle, order-status, job-status, payment-status, proofing-flow, complex-pricing, permission-system, role-super-admin, (custom-order backend view if split) |
| Cross-cutting / platform-wide | `graphify-raw/domain-bible/` (reuse or rename) | 4-5 | `_terminology`, company, employee, (brand-identity if not in store), MANIFEST |
| DELETE / exclude | — | 2 | `DISCREPANCY_REPORT.md`, `.gitkeep` |

Each target folder sits comfortably under the 20-25 chunk limit and produces semantically tight chunks. The three folders are already ingested by graphify-raw — no changes to the ingestion path needed.

### Why co-location matters (the deeper rationale)

1. **EXTRACTED edges from doc→code become native.** When graphify's tree-sitter AST extraction processes `src/app/_domain/custom-order/state-machine.ts`, and the LLM in the same chunk sees `docs/domain/custom-order.md` saying "the state machine is event-driven, 15 events..." — the resulting EXTRACTED edges between concept and code are the **highest-quality edge type graphify produces.** Confidence 1.0, zero inference, directly traceable.

2. **Intra-chunk coherence is automatic.** The folder structure that already exists for code architecture doubles as graphify's chunking structure. Free optimization — no folder design work needed.

3. **Docs stop rotting.** Editing `state-machine.ts` means being in a folder near `docs/domain/custom-order.md`. Much easier to remember to update.

4. **Extends existing convention.** Both repos already have `docs/` folders with domain content. Not introducing a new pattern.

### What co-location does NOT mean

**Do NOT put .md files directly in `src/**/` page folders.** There is zero existing convention for this in the codebase, it would pollute the src tree, and many domain concepts span both repos — putting a file in one repo's src tree orphans the other. Use `docs/domain/` at the repo root.

---

## Open questions to resolve BEFORE migration

These MUST be answered before any files get moved. Each is solvable with a focused research pass.

### Q1: Overlap with existing repo docs

Multiple Consilium files collide with or overlap existing repo docs. Must audit each before deciding keep / merge / delete:

| Consilium file | Existing repo doc | Action needed |
|-|-|-|
| `proofing-flow.md` | `divinipress-backend/docs/proofing-flow.md` | **DIRECT NAME COLLISION.** Diff and decide which is canonical |
| `custom-order.md` | `divinipress-store/docs/custom-order-domain-reference.md` | Topical overlap — same domain, possibly different framing. Decide merge or coexist |
| All Consilium domain docs | `graphify-raw/domain-bible/orders.md`, `products.md`, `proofing.md`, `roles.md`, `teams-collections.md`, `naming.md` | The whole `domain-bible/` folder is an earlier rough draft of the same corpus. After migration, decide whether to delete or repurpose (see Q3) |

**Recommended next step:** dispatch a single overlap-audit agent. Brief: read each collision pair, report which is more accurate/complete, recommend keep/merge/delete per file. Output a table Mil can approve.

### Q2: Exact chunk threshold in ingest.py

The research agent quoted "20-25 files per chunk" from `skill.md:186` but did NOT verify the exact algorithm. Before committing to the three-way split sizes, need to know:

- Is 25 a hard ceiling or soft target?
- What sort order determines splitting when a directory exceeds the limit? (Alphabetical? mtime? Random?)
- Does graphify respect `_` prefixed files or ignore them?
- Does it honor a `.graphifyignore` file? Is there a built-in ignore mechanism for excluding `DISCREPANCY_REPORT.md`?
- How does graphify handle subfolders inside a target directory? Does each subfolder become its own chunk, or are all files in the tree merged?

**Recommended next step:** 30-second peek at `/Users/milovan/.venvs/graphify/lib/python3.12/site-packages/graphify/ingest.py` (post-upgrade, v0.3.28). Answer all five questions above. Confirm the three-way split sizes are safe.

### Q3: What happens to the current `domain-bible/` folder?

Two options:
- **DELETE entirely** — the Consilium corpus supersedes it, no reason to keep rough drafts
- **REPURPOSE as cross-cutting bucket** — move `_terminology.md`, `company.md`, `employee.md`, and any other genuinely cross-cutting docs here; delete the 9 old rough drafts

Recommendation leans toward **repurpose** — it's already in graphify-raw and already ingested, so reusing it for cross-cutting content is zero friction. But the old 9 files (MANIFEST, naming, orders, products, proofing, roles, teams-collections, backend-code-map, store-code-map) should go — they're stale drafts of the same content.

### Q4: Frontmatter schema

Every moved file should get YAML frontmatter, but need to decide the schema. Proposal:

```yaml
---
source: consilium-domain-extraction
contributor: milovan
captured_at: 2026-04-09
domain: store  # or "backend" or "cross-cutting"
concept: custom-order  # kebab-case matching _terminology.md canonical name
---
```

The `source`, `contributor`, `captured_at` fields produce graphify node metadata automatically (`skill.md:240-241`). The `domain` and `concept` fields produce clean EXTRACTED edges from every node to its domain and canonical concept name.

Alternative: richer schema with `references:` array listing which repo files the doc describes. This would give the LLM explicit hints to extract doc→code edges. Worth considering but more work to populate.

**Recommendation:** start with the minimal proposal above, upgrade to the richer schema if the first graph re-run is still underwhelming.

---

## Proposed execution sequence (for when Mil picks this back up)

1. **Resolve the 4 open questions** in one short research session:
   - Dispatch overlap-audit agent (Q1)
   - Peek at `ingest.py` (Q2)
   - Decide domain-bible fate (Q3)
   - Lock frontmatter schema (Q4)

2. **Sync SKILL.md** — copy `/Users/milovan/.venvs/graphify/lib/python3.12/site-packages/graphify/skill.md` over `~/.claude/skills/graphify/SKILL.md`. Five-line trivial update (adds `--directed` flag docs and one build.py note). Or diff first if paranoid about user customizations.

3. **Execute migration** — scripted move per the approved overlap-audit table. Create `divinipress-store/docs/domain/` and `divinipress-backend/docs/domain/` folders, move files per the distribution table.

4. **Add frontmatter** — one script applies the approved schema to every moved file. Something like:
   ```bash
   for f in <moved files>; do
     <prepend YAML frontmatter with computed domain + concept>
   done
   ```

5. **Clean up:**
   - Delete `/Users/milovan/projects/Consilium/graphify-source/` (it was staging, its job is done)
   - Delete `DISCREPANCY_REPORT.md` (it never migrates)
   - Handle `domain-bible/` per Q3 decision

6. **Re-run** `/graphify /Users/milovan/projects/graphify-raw --mode deep --update` — compare new graph against current one.

7. **Evaluate:**
   - If graph is meaningfully better → done. Mil's "underwhelming" problem was corpus structure.
   - If still underwhelming → the gap is elsewhere. Next investigation targets: extraction prompt tuning, model choice for subagents, clustering parameters (Leiden resolution), or node deduplication logic. All are separate deeper dives.

---

## What this investigation ruled out

For the next agent's benefit — these were considered and rejected. Do not re-litigate unless you have NEW evidence from the code:

- **Split docs into atomic single-concept files.** Would REDUCE edge density per the research agent's walk-through. Rejected based on evidence at `skill.md:211, 246, 234-238`.
- **Just run with `--mode deep`.** Already in use per Mil's direct confirmation.
- **Subfolder the Consilium corpus into thematic subfolders inside Consilium** (roles/, orders/, brand/, etc.). Would sever cross-domain edges that are exactly the "surprise" connections Mil wants. Rejected.
- **Place .md files directly in `src/**/` page folders.** Zero existing convention, would pollute src tree, orphans cross-repo concepts. Rejected.
- **Keep the corpus flat at 27 files in `Consilium/graphify-source/`.** Exceeds the 20-25 chunk ceiling, produces arbitrary alphabetical split. Rejected.
- **Install a new MCP server or change the ingestion path.** Current graphify-raw layout is already serving both MCP (venv) and CLI (homebrew). No reason to touch this.

---

## Key references for the next agent

| Need | Path |
|-|-|
| Upgraded graphify source (read-only reference) | `/Users/milovan/.venvs/graphify/lib/python3.12/site-packages/graphify/` (v0.3.28) |
| Current local SKILL.md (stale at .24) | `~/.claude/skills/graphify/SKILL.md` |
| Fresh package skill.md (canonical .28) | `/Users/milovan/.venvs/graphify/lib/python3.12/site-packages/graphify/skill.md` |
| Staging corpus to migrate FROM | `/Users/milovan/projects/Consilium/graphify-source/` |
| Old draft corpus (to delete or repurpose) | `/Users/milovan/projects/graphify-raw/domain-bible/` |
| Target store docs (create `domain/` subfolder) | `/Users/milovan/projects/divinipress-store/docs/` |
| Target backend docs (create `domain/` subfolder) | `/Users/milovan/projects/divinipress-backend/docs/` |
| Graphify upstream (only if needed for issues/history) | `github.com/safishamsi/graphify` by Safi Shamsi, MIT |
| Current graph output (to compare before/after) | `/Users/milovan/projects/graphify-raw/graphify-out/graph.json` |

## Files the research agent cited by file:line

If you need to verify any claim in this doc, these are the load-bearing lines:

- `skill.md:186` — chunking by directory, 20-25 files per chunk
- `skill.md:204` — JSON-only output constraint
- `skill.md:206-207` — FILE_LIST passed to subagents
- `skill.md:210-212` — EXTRACTED/INFERRED/AMBIGUOUS rules
- `skill.md:211, 246` — INFERRED edges need intra-doc cohabitation signal
- `skill.md:216` — `rationale_for` edge type
- `skill.md:225-226` — `--mode deep` behavior
- `skill.md:228` — `semantically_similar_to` is chunk-scoped
- `skill.md:234-238` — hyperedge creation rules
- `skill.md:240-241` — YAML frontmatter propagates to node metadata
- `skill.md:244-249` — confidence score ranges per tag
- `skill.md:252` — full JSON schema for extraction output
- `build.py:44-53` — accepts whatever edges extractions give
- `build.py:60-78` — merges extraction dicts with no cross-chunk inference
- `cluster.py:21-52` — Leiden clustering on edges only, no file boundary awareness
- `extract.py:2045-2159` — cross-file Python import inference (irrelevant to markdown corpus)

Note: these line numbers are from the v0.3.28 source in the venv. If the package is upgraded further, re-verify before citing.
