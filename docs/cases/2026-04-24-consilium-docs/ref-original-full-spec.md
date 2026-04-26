# Consilium Docs Repo — Spec (v3)

> **v3 supersedes v2 after round-2 verification.** Round 2 (Censor + Provocator on v2) returned 1 new MISUNDERSTANDING + 19 deduped GAPs + 5 CONCERNs + 5 SOUNDs. Per Codex §7 we hit max iterations — Imperator adjudicated: restore Medicus state names verbatim (`routed`/`closed` not `in-progress`/`shipped`), adopt marker-file forbidden-window enforcement, apply all GAP+CONCERN fixes silently, straight to edicts without round-3 verification ("we'll sort out any hiccups there"). v2 at SHA 6cab7b7; v1 at b5e6914.

> **Confidence summary:** High on architecture, case-folder conventions, 8-state machine (**now with verbatim Medicus names**), repo location, graphify excision scope (expanded), migration sequencing, forbidden-window marker enforcement. Medium on lifecycle-script behavior, cross-reference audit execution details, orphan-file classification rules, staleness script reframe (3 distinct decisions). Low on exact script argument shapes and STATUS.md frontmatter field names.

## Goal

Create `~/projects/consilium-docs` — a local git repo that becomes the shared home for all Consilium artifacts (specs, plans, debugging cases, reference docs, hand-off summaries, retros) and all shared doctrine (known-gaps, lane guides, diagnosis-packet template, fix thresholds, protocol references, voice/brand guidelines). Both Claude-Consilium and Codex-Consilium agents write to and read from this single repo via a `$CONSILIUM_DOCS` env var, with the **case folder** as the universal organizing unit.

Graphify is excised as part of this migration (Imperator decision after round-1 verification: *"graphify has never once worked right; I'm cutting it out completely. I'll come up with a way to replace it later."*). Agents read doctrine via direct file access from `$CONSILIUM_DOCS/doctrine/`. The architectural seam for a future semantic-query mechanism is preserved — agents look up doctrine at a single known location; the current implementation is file-read; a future replacement slots in at that same seam.

## Context — why this exists

> **Confidence: High** — directly from Imperator's account of pain.

**Pain points this resolves:**

1. **Target-repo docs are gitignored.** Specs, plans, and cases written from inside `divinipress-store` or `divinipress-backend` sessions vanish after work closes.
2. **Scatter across per-agent repos.** Claude-Consilium and Codex-Consilium each keep their own specs/plans/cases in forked `docs/consilium/` directories. Doctrine drifts between forks within weeks.
3. **Flat type-dirs get messy after 3-4 sessions.** The current `specs/` + `plans/` + `debugging-cases/` flat layout grows without the organizational unit that matches real multi-session features.
4. **Master specs disappear into the pile.** An 8-session feature (Imperator example: non-apparel products) had no canonical "big picture" doc the Consul could anchor every session to.
5. **Graphify never worked right.** Imperator has invested substantial effort in the graphify corpus + ingestion pipeline; the MCP has not been a reliable source of domain knowledge. Rather than migrate a broken tool, the tool is cut entirely.

**What round-1 Provocator caught that reshaped v2:** the initial state-machine collapse silently dropped the Medicus's `contained` state (Phase 1 scan target); the graphify re-ingestion paragraph treated `/graphify` as a config-driven service rather than a rebuild tool. Both halt-level findings. v2 addresses both — contained preserved, graphify removed.

## Architecture

> **Confidence: High** — Imperator confirmed three-layer model and case-as-unit in deliberation.

### Three layers, three homes

| Layer | What | Where | Shared across agents? |
|-|-|-|-|
| Agent-implementation | Skills, personas, hooks, plugin config, staleness/drift scripts, verification protocol + templates | `~/projects/Consilium/` + `~/projects/Consilium-codex/` | No — each agent's runtime differs; personas + protocol + templates stay per-fork because drift-check script syncs personas fork-locally |
| **Shared artifacts + doctrine** | **Specs, plans, cases, reference docs, hand-offs, retros, known-gaps, lane guides, packet template, fix thresholds, topic files, code maps, voice/brand guidelines** | **`~/projects/consilium-docs/` (new)** | **Yes** |
| Target-repo code | App code + target-repo CLAUDE.md | `~/projects/divinipress-store/`, `~/projects/divinipress-backend/` | Per-repo deploys |

**Round-1 clarification on personas + verification templates:** Censor flagged these as "unclassified." They stay agent-impl — here's why: `scripts/check-codex-drift.py` copy-syncs 5 canonical persona files into the 6 user-scope agents within each fork. The canonical source (`skills/references/personas/consilium-codex.md` etc.) must live fork-locally for drift sync to work without cross-repo dependencies. If they moved to `consilium-docs`, drift-check in each fork would need to reach into the shared repo — a coupling we don't want. Verification protocol + templates follow the same logic (they're agent-runtime instructions; each fork's Consul/Legatus/Medicus reads them during dispatch).

### The case as universal unit

Everything is a case. A case is a folder.

- **Bug** = case folder with 2-3 files (`diagnosis.md`, `fix-plan.md`, `retro.md` optional).
- **Feature** = case folder with many files across many sessions (`spec.md` master, many `session-NN-*.md`, `ref-*.md`, `handoff-NN-to-MM.md`, `retro.md` mandatory).
- **Infrastructure change** = case folder, same pattern as feature.
- **Idea-in-embryo** = case folder, `status: draft`, maybe only a `spec.md` stub. 7-day timeout → abandoned if no progress.

Bugs and features share structure. Only density differs.

### `$CONSILIUM_DOCS` — the single resolution point

> **Confidence: High** — Imperator confirmed local-only, no GitHub remote.

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress — all Consilium agent invocations halted until Stage 5 completes. Resume after marker file is removed."
  exit 1
}
```

**Three-layer defense:**
1. Directory existence (catches missing env var or deleted path).
2. Marker-content grep on CONVENTIONS.md line 1 (catches stale env var pointing at a sibling directory that happens to have CONVENTIONS.md — round-2 Censor finding that v2's `test -f` was insufficient).
3. Migration-in-progress marker (catches agent invocation during Stage 2-5 forbidden window — round-2 Provocator/Censor finding that prose-only enforcement relies on Imperator memory; marker file enforces mechanically).

**Halt discipline in SKILL prose:** the SKILL body that invokes this snippet must state explicitly *"if this Bash call returns non-zero, halt the session and do not proceed"* — `exit 1` alone does not halt Claude.

All agent artifact writes (Consul spec, Edicts plan, Medicus case) and all doctrine reads (known-gaps, lane guides, packet template, fix thresholds, protocol references, voice/brand) resolve through `$CONSILIUM_DOCS/…`. Target-repo code paths stay relative-to-cwd (two-address-space contract preserved from abandoned tribune edict).

## Case Folder Conventions

### Layout

```
consilium-docs/
  cases/
    2026-03-15-non-apparel-products/         # feature case, multi-session
      STATUS.md                                # frontmatter + "what's live now" prose
      spec.md                                  # MASTER spec
      plan.md                                  # session-01's plan
      session-02-cart-integration-spec.md
      session-02-cart-integration-plan.md
      session-03-backend-adapter-spec.md
      session-03-backend-adapter-plan.md
      ...
      session-08-admin-ui-spec.md
      session-08-admin-ui-plan.md
      handoff-01-to-02.md
      handoff-07-to-08.md
      ref-cart-schema.md                       # reference docs emerged mid-case
      ref-pricing-cheatsheet.md
      retro.md                                 # MANDATORY (feature case)

    2026-04-24-checkout-slowdown/              # bug case, single session
      STATUS.md
      diagnosis.md                             # Medicus 14-field packet
      fix-plan.md
      retro.md                                 # OPTIONAL, prompted at case-close

  doctrine/                                    # shared across Claude + Codex Consiliums
    known-gaps.md                              # recurring-bug memory
    voice-principles.md                        # Divinipress voice (migrated from graphify-source/)
    brand-identity.md                          # Divinipress positioning (migrated from graphify-source/)
    lane-classification.md
    lane-guides/
      storefront-debugging.md
      storefront-super-admin-debugging.md
      admin-debugging.md
      medusa-backend-debugging.md
      cross-repo-debugging.md
    diagnosis-packet.md
    fix-thresholds.md
    known-gaps-protocol.md
    domain/                                    # existing modular topic files stay grouped
      MANIFEST.md
      <6 topic files: products, customers, company, orders, proofing, pricing>
      <2 code maps: backend, storefront>

  archive/                                     # closed + aged cases (manual move, no auto-archive)
    2026-Q1/
      ...

  scripts/
    case-new                                   # Stage 1 ship with collision-disambiguation
    case-session
    case-close

  INDEX.md                                     # Imperator-facing navigation + any pending-warnings
  CONVENTIONS.md                               # authoritative file-naming + frontmatter + state-machine rules
```

### Filename conventions (flat within case folders)

| File | When | Role |
|-|-|-|
| `STATUS.md` | Every case, always | Frontmatter + "what's live now" prose card |
| `spec.md` | Feature/infra cases | Master spec. Session 1's spec; later sessions reference |
| `plan.md` | Feature/infra cases | Session 1's plan |
| `session-NN-<topic>-spec.md` | Session N > 1 | Session-scoped spec |
| `session-NN-<topic>-plan.md` | Session N > 1 | Session-scoped plan |
| `handoff-NN-to-MM.md` | Session closes mid-case | What N left for N+1 |
| `ref-<topic>.md` | Emergent knowledge | Cheatsheets, schemas, flow diagrams |
| `diagnosis.md` | Bug cases | Medicus 14-field packet |
| `fix-plan.md` | Bug cases | Legion/march plan after diagnosis |
| `retro.md` | Feature: MANDATORY. Bug: optional-but-prompted | Post-shipping reflection |

**Flat, not nested.** `ls cases/<slug>/` shows everything. No per-case subdirectories.

### Session numbering

> **Confidence: High** — Imperator confirmed per-case. Session-1 convention firmed post-round-1.

Per-case, zero-padded two digits. **Session 1 is unprefixed by convention** (`spec.md` + `plan.md` = session 1). Session N ≥ 2 uses `session-NN-<topic>-*.md` prefix.

**`case-session` numbering logic** (resolved from round-1 GAP-9):

```
If no session-NN-*.md files exist in case folder:
    If spec.md OR plan.md exists → next session is 02
    Else → next session is 01 (no session 1 yet; new feature that starts with a session-01 spec)
Else:
    Next session is max(session-NN) + 1
```

Either case (spec.md-unprefixed OR session-01-<topic>-spec.md) is valid for session 1; the script adapts. Most cases use unprefixed session 1; cases opened mid-stream by a script invocation would use session-01.

### Cross-case references

> **Confidence: High** — Imperator confirmed.

Markdown relative links from case root: `[tribune-reshape](../2026-04-23-tribune-reshape/spec.md)`. No structured dependency model.

### Case naming

> **Confidence: High** — Imperator-declared, not Consul-inferred.

At case creation, Imperator supplies the slug. Consul does not guess.

### Session opening / closing

> **Confidence: High** — Imperator-declared.

Consul reconnaissance opener: *"Are we opening a new case or continuing an existing one? If continuing, which case and session number?"* Imperator answers deterministically.

### STATUS.md schema

> **Confidence: Medium** — exact field names firm during plan authorship.

```yaml
---
status: draft | rejected | approved | routed | contained | closed | referenced | abandoned
opened: 2026-03-15
target: divinipress-store | divinipress-backend | consilium | cross-repo
agent: claude | codex | both
sessions: 8
current_session: 6
last_handoff: handoff-06-to-07.md
closed_at: 2026-04-24        # only when status ∈ {closed, contained, referenced}
---

## Current state
<one paragraph of what's live right now>

## What's next
<bullet list, optional>

## Open questions
<bullet list, optional>
```

### Case lifecycle states — 8 states (verbatim Medicus 7 + `referenced`)

> **Confidence: High** — Imperator decision post-round-2: restore verbatim Medicus state names. Zero renames. `routed` and `closed` are live string values Legion + March SKILLs write to case files today; semantic-equivalence renaming would have created a state fork.

```
draft ──┬── approved ── routed ──┬── closed ──── referenced ──── archived
        │                         │
        ├── rejected* ── approved ├── contained* ── closed
        │                         │
        └── abandoned             └── abandoned

* bug-specific states
```

| State | Meaning | Who sets | Next states |
|-|-|-|-|
| `draft` | Scope shaping; spec not yet approved | Consul | `approved`, `rejected`, `abandoned` |
| `rejected` (bug) | Medicus diagnosis declined by Imperator | Medicus after Imperator Phase 7 rejection | `approved` (after rediagnosis) or `abandoned` |
| `approved` | Spec/diagnosis approved; plan written or awaiting execution | Consul/Medicus after Imperator approval | `routed`, `abandoned` |
| `routed` | Execution picked up by Legion/March; work underway | Legatus on march start (bug OR feature dispatch — live string Legion + March write today) | `closed`, `contained`, `routed` (next session of multi-session case), `abandoned` |
| `contained` (bug) | Fix shipped as containment; root cause pending | Legatus at contain-dispatch (per current Medicus protocol) | `closed` (when root cause resolved), `abandoned` |
| `closed` | All planned work complete + retro written (mandatory for features; optional-prompt for bugs). Live string Legion + March write at case-close today | Legatus/Consul at case-close | `referenced`, `archived` |
| `referenced` | Closed but still actively linked by open cases — keeps out of archive. **Implementation: manual transition for now; aspirational auto-detection is a future follow-up case.** | Imperator or case-close when cross-ref check is built | `archived` when references clear |
| `abandoned` | Killed pre-close. Automatic via 7-day draft timeout OR Imperator declaration | Automatic (STATUS.md mtime-based) or Imperator | `archived` |

**Draft timeout** (resolved from round-1 GAP-10 + round-2 draft-progress clarification): a draft case with no progress in 7 days is tagged `abandoned` automatically on the next session's Phase 1 scan. **"Progress" signal = STATUS.md mtime** — any edit to STATUS.md (including Imperator annotation, Consul state update, session-bump) resets the timer. Sibling file mtimes (spec.md, ref-*.md) do not reset the timer; only STATUS.md is the authoritative progress marker. This keeps automated scans cheap and semantically tight.

**Contained state** is Medicus-specific. The Phase 1 open-queue scan surfaces ONLY `status: contained` as active root-cause work to be resolved. Non-bug cases (features, infra) never enter `contained` — they go `routed → closed` directly.

**`referenced` state note:** Imperator accepted (round-2 CONCERN) that automatic detection of when references clear requires a cross-reference scan script not in this migration's scope. For now, `referenced` is a manual-transition state set when the Imperator declares a closed case still actively referenced by open cases. A future `case-scan-refs` script can land as its own case. This matches the Imperator's "sort out hiccups there" direction for post-spec refinement.

## Doctrine in the New Home

> **Confidence: High** — Imperator confirmed the migration direction ("shared library").

### Layout

```
consilium-docs/doctrine/
  known-gaps.md                   # was skills/references/domain/known-gaps.md
  voice-principles.md             # was graphify-source/voice-principles.md
  brand-identity.md               # was graphify-source/brand-identity.md
  lane-classification.md          # was skills/tribune/references/lane-classification.md
  lane-guides/                    # was skills/tribune/references/lane-guides/
    storefront-debugging.md
    storefront-super-admin-debugging.md
    admin-debugging.md
    medusa-backend-debugging.md
    cross-repo-debugging.md
  diagnosis-packet.md             # was skills/tribune/references/diagnosis-packet.md
  fix-thresholds.md               # was skills/tribune/references/fix-thresholds.md
  known-gaps-protocol.md          # was skills/tribune/references/known-gaps-protocol.md
  domain/                         # was skills/references/domain/ (minus known-gaps.md promoted up)
    MANIFEST.md
    <6 topic files>
    <2 code maps>
```

### How doctrine is consumed post-graphify

Agents read doctrine via **direct file access** from `$CONSILIUM_DOCS/doctrine/`. No MCP query, no indexed lookup.

- Consul reconnaissance (currently: `query_graph` / `get_neighbors`) → read relevant topic files from `$CONSILIUM_DOCS/doctrine/domain/` based on entity mentions in conversation.
- Medicus Phase 2 doctrine-load (currently: graphify OR file-read) → file-read only.
- Legion/March Debug Fix Intake (currently: graphify OR file-read) → file-read only.

**Architectural seam preserved.** Agents look up doctrine at a single known location. Today: filesystem. Future: if the Imperator builds a replacement, it slots at the same seam.

## Graphify Excision

> **Confidence: High** — Imperator decision post-round-1.

Stage 5 strips every graphify reference across the Consilium agent-impl surface. Inventory of affected files (round-2 additions in **bold**):

| File | What changes |
|-|-|
| `skills/consul/SKILL.md` | Reconnaissance section: remove `query_graph`/`get_neighbors` references. Replace with "read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/`." |
| `skills/tribune/SKILL.md` | Phase 2 doctrine-load: remove graphify branch. File-read only from `$CONSILIUM_DOCS/doctrine/`. |
| `skills/legion/SKILL.md` | Remove any graphify dispatch-prompt fragments. Doctrine reads from `$CONSILIUM_DOCS/doctrine/`. |
| `skills/march/SKILL.md` | Same as legion. |
| `skills/edicts/SKILL.md` | Remove graphify reconnaissance references. |
| **`skills/legion/implementer-prompt.md` line 42** | **Round-2 GAP: dispatch-prompt template carries `{DOMAIN_KNOWLEDGE — assembled from graphify MCP queries}`. Rewrite to `{DOMAIN_KNOWLEDGE — assembled from doctrine file reads at $CONSILIUM_DOCS/doctrine/}`.** |
| `skills/references/personas/consul.md`, `medicus.md` (canonical persona files) | Remove graphify references in body. |
| **`skills/references/personas/scout.md` line 63** | **Round-2 GAP: "Query graphify for domain concepts" → "Read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/`."** |
| **`skills/references/personas/soldier.md` lines 72, 78** | **Round-2 GAP: two graphify references in the soldier dispatch-prompt flow. Rewrite to doctrine-file-read semantics.** |
| `skills/references/personas/consilium-codex.md` | Canonical Codex — remove any graphify mentions. Drift-check re-syncs to user-scope agents. |
| `skills/references/verification/protocol.md` | Section on graphify MCP access — remove or rewrite as "agents read doctrine directly from `$CONSILIUM_DOCS/doctrine/`." |
| `skills/references/verification/templates/*.md` (all 4) | Remove "`graphify MCP access`" dispatch-prompt fragments. |
| 6 user-scope agents at `~/.claude/agents/consilium-*.md` | Strip `graphify` from MCP allowlist. Strip `mcp__graphify__*` tool names from `tools:` allowlist. Sync via drift-check after Codex file update. |
| **`skills/references/domain/known-gaps.md` line 3** (migrated to `$CONSILIUM_DOCS/doctrine/known-gaps.md` at Stage 2) | **Round-2 GAP: rewrite "available to any verifier via graphify" to "read by any verifier directly from `$CONSILIUM_DOCS/doctrine/known-gaps.md`." Applied at Stage 5 against the migrated file.** |
| **`scripts/refresh-graph.sh`** | **Round-2 GAP: script's `BIBLE="$HOME/projects/Consilium/skills/references/domain"` path breaks after Stage 2; script is dead code post-graphify-excision. DELETE in Stage 5.** |
| `CLAUDE.md` (Consilium) | Remove `# graphify` section. Remove "Post-plan graphify action" bullet. Remove references to `/graphify` skill in Maintenance. |
| `docs/CONSILIUM-VISION.md` | Remove graphify references if present (probably yes). |

**Out of scope:** deleting the `/graphify` skill itself at `~/.claude/skills/graphify/` — that's user-scope skill cleanup; not part of Consilium-repo changes. Imperator may clean it up separately.

**`graphify-source/` directory cleanup:**
- `voice-principles.md` → `$CONSILIUM_DOCS/doctrine/voice-principles.md` (doctrine migration, Stage 2).
- `brand-identity.md` → `$CONSILIUM_DOCS/doctrine/brand-identity.md` (doctrine migration, Stage 2).
- `DISCREPANCY_REPORT.md` → `$CONSILIUM_DOCS/cases/2026-04-10-graphify-corpus-pass-3/ref-discrepancy-report.md` (historical artifact, migrated in Stage 3).
- `.gitkeep`, `.serena/` → delete with directory.
- Final act of Stage 3: `rm -rf graphify-source/` (matches original pass-3 intent that left it partially cleaned).

## Lifecycle Scripts

> **Confidence: Medium** — signatures are Consul proposal; verifiers may attack.

Three scripts live in `$CONSILIUM_DOCS/scripts/` and handle common case-folder operations.

### `case-new <slug> [--target <target>] [--agent claude|codex]`

- Collision-disambiguation (resolved from round-1 GAP-8): checks `ls cases/ | rg -x "^YYYY-MM-DD-<slug>(-[0-9]+)?$"`. If collision, appends `-2`, `-3`, etc. to the slug portion (not the date). **Ships in Stage 1** — not deferred to Stage 4.
- Creates `cases/<date>-<final-slug>/`.
- Drops `STATUS.md` with frontmatter template (status=draft, opened=today, target=supplied or prompted, agent=supplied or default=claude).
- Drops empty `spec.md` stub with header `# <slug> — Spec`.
- Prints the resulting case path.

### `case-session <slug> <topic>`

- Inspects existing `session-NN-*.md` in the case folder. Applies the session-1-convention logic documented above.
- Drops `session-NN-<topic>-spec.md` stub.
- Updates STATUS.md `current_session` + `sessions` fields.
- Prints the session-spec path.

### `case-close <slug>`

- Reads STATUS.md.
- **Differentiated retro behavior** (resolved from round-1 CONCERN-1):
  - If case has `spec.md` (feature/infra) → retro.md must exist. Block case-close if missing; emit a template and exit non-zero.
  - If case has only `diagnosis.md` (bug) → prompt *"Write retro? [y/N]"* with a one-question template focused on *"Should this become a known-gap doctrine entry?"* Accept skip.
- Sets `status: closed` + `closed_at: <today>` in STATUS frontmatter.
- Does NOT archive (manual only).

### No auto-archive

> **Confidence: High** — survived Provocator attack (grep blindness, surprise deletion, premature optimization — all addressed).

Manual archive only. A future `case-archive <slug>` script when volume demands.

## Agent Integration — Claude-Consilium changes only

> **Confidence: High** — Imperator confirmed scope. Codex-side handled separately by Imperator (see Codex Coordination below).

### Files that change in Stage 5

| File | What changes |
|-|-|
| `skills/consul/SKILL.md` | Spec-write path → `$CONSILIUM_DOCS/cases/<slug>/[spec.md \| session-NN-<topic>-spec.md]`. Phase 0 resolution block (with marker grep + migration-marker check) + halt-discipline prose. Session-opening recon prompt. **Remove graphify references. Fix `~/.codex/agents/` paths → `~/.claude/agents/` (pre-existing cruft; round-2 GAP).** |
| `skills/edicts/SKILL.md` | Plan-write path → `$CONSILIUM_DOCS/cases/<slug>/[plan.md \| session-NN-<topic>-plan.md]`. Same Phase 0 pattern. **Remove graphify references. Fix `~/.codex/agents/` paths → `~/.claude/agents/` (round-2 GAP).** |
| `skills/tribune/SKILL.md` | Case-file path → `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`. Doctrine reads → `$CONSILIUM_DOCS/doctrine/…`. Phase 0 resolution. **Remove graphify branch in Phase 2. Rewrite Phase 1 open-queue scan (round-2 GAP): change from flat-file `ls docs/consilium/debugging-cases/` + frontmatter parse to subdir-walk `find $CONSILIUM_DOCS/cases -maxdepth 2 -name STATUS.md` + filter by `status: contained` (or `status: draft` with `mtime` older than 7 days for the timeout scan).** |
| `skills/legion/SKILL.md` | Debug Fix Intake case-file reads → `$CONSILIUM_DOCS/…`. Doctrine reads via same prefix. Phase 0 resolution. **Remove graphify references.** |
| `skills/march/SKILL.md` | Same as legion, solo-execution variant. |
| `skills/legion/implementer-prompt.md` | **Round-2 GAP: rewrite `{DOMAIN_KNOWLEDGE — assembled from graphify MCP queries}` dispatch-prompt template fragment to file-read semantics.** |
| `skills/references/personas/consul.md`, `medicus.md`, **`scout.md`, `soldier.md`** (canonical persona files) | Remove graphify body references. **Round-2 added scout.md (line 63) + soldier.md (lines 72, 78) — both carry graphify calls in their dispatch-time guidance.** |
| `skills/references/personas/consilium-codex.md` | Canonical Codex — remove graphify mentions. `check-codex-drift.py` re-syncs to user-scope agents. |
| `skills/references/verification/protocol.md` + 4 templates | Remove graphify MCP access section + dispatch-prompt fragments. |
| 6 user-scope agents at `~/.claude/agents/consilium-*.md` | Strip graphify MCP + tool names. Sync via drift-check after canonical persona edits. |
| **Cross-reference audit (expanded from round-1 GAP-2 + round-2 findings):** `skills/references/personas/*.md` + `skills/references/verification/**/*.md` + all doctrine files in new home at `$CONSILIUM_DOCS/doctrine/` | Scan scope: **(a)** bare-filename refs (`known-gaps.md`, `lane-classification.md`, etc. without path prefix); **(b)** legacy-path refs (`skills/tribune/references/...`, `skills/references/domain/...`); **(c)** pre-existing misrouted refs (`~/.codex/agents/` in Claude-fork files). Resolution: bare-filename refs that resolve by co-location (same directory) stay unchanged; refs that cross directory boundaries get the `$CONSILIUM_DOCS/doctrine/<path>` prefix; misrouted agent paths get the correct fork prefix. |
| `scripts/check-tribune-staleness.py` | **Reframe with 3 explicit decisions (round-2 GAP):** (a) **banned-regex scope**: scan `skills/tribune/SKILL.md` (stays in Consilium) + its plugin cache mirror, NOT doctrine files (doctrine is authored free-form); (b) **reference-existence**: resolve any `$CONSILIUM_DOCS/doctrine/<file>` refs found in tribune SKILL against the new doctrine tree; (c) **test-writing smell scan**: applies to tribune SKILL only (doctrine files are reference material, not code). Remove the `TRIBUNE_DIR` abstraction; introduce `DOCTRINE_ROOT = Path(os.environ.get("CONSILIUM_DOCS", Path.home() / "projects" / "consilium-docs")) / "doctrine"`. |
| **`scripts/refresh-graph.sh`** | **Round-2 GAP: DELETE entirely. Dead script post-graphify-excision.** |
| `scripts/check-codex-drift.py` | No change (compares in-fork personas vs user-scope agents, both fork-local). |
| `CLAUDE.md` (Consilium) | `$CONSILIUM_DOCS` env var bullet. Remove graphify section + graphify-action bullet. Update Maintenance. Remove `refresh-graph.sh` mention if any. |
| `docs/CONSILIUM-VISION.md` | Case-folder model section. Remove graphify references. Link to `$CONSILIUM_DOCS/CONVENTIONS.md` for concrete rules. |

### Plugin cache invalidation

> **Confidence: High** — resolved from round-1 GAP-3 + round-2 partial-coverage finding.

The plugin cache at `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` mirrors skills + references + personas. Cache is not self-invalidating on filesystem-side deletions. Round-2 surfaced that v2's two-path invalidation (tribune/references + references/domain) left the cached SKILL.md bodies AND the cached personas subtree stale.

**Stage 2 performs a full consilium-local cache purge:**

```bash
rm -rf ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
```

This nukes every cached SKILL body, every cached reference doc, and the cached personas subtree in one operation. Stage 5 re-populates the cache as it edits each SKILL (standard `cp skills/<name>/SKILL.md cache/...` discipline per `CLAUDE.md` Maintenance section). **Stage 5 also re-syncs cached personas** — a procedure that currently doesn't exist; the spec introduces it: after editing any file under `skills/references/personas/`, copy the whole directory tree to cache:

```bash
rsync -a --delete skills/references/personas/ \
  ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/references/personas/
```

Same for `skills/references/verification/`. CLAUDE.md Maintenance section gets a new bullet documenting this broader cache-sync scope.

### Two documentation surfaces — partition rule

> **Confidence: Medium** — refined from round-1 CONCERN-2.

- **`CONSILIUM_REPO/CLAUDE.md` + `docs/CONSILIUM-VISION.md`** — *how the system works*: agent hierarchy, skill/persona architecture, maintenance procedures for drift+staleness scripts, env var setup.
- **`$CONSILIUM_DOCS/CONVENTIONS.md`** — *how artifacts are written*: file-naming, frontmatter schema, state machine, collision rules, case-lifecycle transitions, script usage.

**Partition rule:** if an operation touches a skill or agent runtime, it's in Consilium CLAUDE.md. If it touches artifact storage format, it's in CONVENTIONS.md. Overlap points (e.g., `$CONSILIUM_DOCS` env var setup) — CLAUDE.md is the operational how-to; CONVENTIONS.md links to it.

## Migration Strategy — Five Stages

> **Confidence: High** — Imperator confirmed staged.

### Stage 2-5 invocation-forbidden window

> **Confidence: High** — resolved from round-1 GAP-6 + round-2 enforcement mechanism (both agents flagged prose-only as insufficient).

Between Stage 2 commit and Stage 5 commit, no Consul/Medicus/Edicts/Legion/March agent may be invoked from a new session. The intermediate state is deliberately broken:
- Tribune SKILL references doctrine at paths that no longer exist.
- Staleness script crashes on missing `TRIBUNE_DIR` (before reframe).
- Plugin cache fully purged (per Stage 2 step) but SKILLs not yet re-synced.

**Mechanical enforcement (round-2 upgrade):** Stage 2 drops `$CONSILIUM_DOCS/.migration-in-progress` marker file. Every SKILL's Phase 0 resolution block checks for this marker (see `$CONSILIUM_DOCS` resolution block) and halts with a clear error if present. Stage 5 removes the marker as its last pre-commit step. The marker is the guardrail — Imperator memory is no longer the only defense.

**Session continuity:** the Legatus executing this migration runs all five stages in one session without exiting. The Legatus's plan is already in context; no Phase 0 re-check is needed mid-migration. The marker file blocks OTHER sessions (Imperator reflexively typing `/tribune` from any cwd), not the migration session itself.

**If migration must pause:** session stops AT A STAGE BOUNDARY (after Stage 1 or after Stage 5 — never mid-way through 2/3/4/5). Rollback procedure documented in Stage 3.

### Stage 1 — Create the repo skeleton

- `mkdir -p ~/projects/consilium-docs/{cases,doctrine,archive,scripts}`
- `git init`
- Write `INDEX.md`, `README.md`, `CONVENTIONS.md` (with minimum stub content per resolved GAP-7):

  ```markdown
  <!-- consilium-docs CONVENTIONS — do not remove this marker line -->
  # Consilium Docs — Conventions

  This file is the identity marker for `$CONSILIUM_DOCS` resolution AND the authoritative rule doc for case-folder conventions, STATUS.md schema, state machine, and collision rules.

  Stage 1 stub. Complete content folded in at Stage 4 from the legacy debugging-cases README.
  ```

  The marker comment on line 1 is grep-detectable and survives content edits — stable identity signal.

- Write the three lifecycle scripts (`case-new` with collision-disambiguation, `case-session`, `case-close`) with `chmod +x`.
- First commit: *"initial skeleton"*.

**Outcome:** Repo exists. No artifacts moved yet. Claude-Consilium still reads/writes its current paths.

### Stage 2 — Migrate doctrine + drop marker files + purge plugin cache

- `cp -r Consilium/skills/references/domain/* consilium-docs/doctrine/domain/` (preserving topic files).
- `mv consilium-docs/doctrine/domain/known-gaps.md consilium-docs/doctrine/known-gaps.md` (promote out of domain/ since it's top-level, not a topic file).
- `cp Consilium/skills/tribune/references/*.md consilium-docs/doctrine/` (flatten into doctrine/ root).
- `cp -r Consilium/skills/tribune/references/lane-guides/ consilium-docs/doctrine/lane-guides/`.
- `cp Consilium/graphify-source/voice-principles.md consilium-docs/doctrine/`.
- `cp Consilium/graphify-source/brand-identity.md consilium-docs/doctrine/`.
- Commit in consilium-docs: *"doctrine migration"*.
- **Drop migration-in-progress marker:** `touch "$CONSILIUM_DOCS/.migration-in-progress"`. This is the mechanical forbidden-window enforcement — any SKILL Phase 0 snippet invoked during Stages 3-5 will halt on this file (see `$CONSILIUM_DOCS` resolution block above).
- **Full plugin cache purge:** `rm -rf ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills`. Broader than v2's two-subdir purge (round-2 finding) because cached SKILL.md bodies AND cached personas subtree would also go stale.
- In Consilium: `rm -rf skills/references/domain skills/tribune/references` + commit *"remove migrated doctrine — now at consilium-docs/doctrine/"*.

**Outcome:** Doctrine in new home. Consilium is in forbidden-window state. Marker file blocks all Consul/Medicus/Edicts/Legion/March Phase 0 checks. Stages 3-5 proceed within the same Legatus session (which already has the plan in context and doesn't need to re-Phase-0).

### Stage 3 — Migrate existing specs/plans + ideation + graphify-source cleanup

**Retro-migration slug rule** (round-2 CONCERN clarification): Stage 3 slugs are Consul-declared (this spec's author picks them based on the artifact content + git-created date). This is a deliberate scope carve-out from the "Imperator declares case identity" rule — retro-migration is history-preservation, not case creation. Forward case creation still requires Imperator declaration.

**Commit ordering discipline** (round-2 reversibility finding): Stage 3 does ALL file moves first (mv operations stage changes for commit but leave files accessible on disk until the commit actually lands). **Destructive `rm -rf` operations run LAST, just before the single commit.** If any step crashes between a mv and the final rm, `git reset --hard HEAD` in Consilium restores the pre-Stage-3 state and consilium-docs's staged changes can be discarded with `git reset --hard <pre-stage-2-sha>`. The plan-file self-migration is explicitly ordered first so the Legatus's instruction source-of-truth is safely at its new path before any deletes execute.

**Rollback procedure if Stage 3 crashes mid-way:**

```bash
# In Consilium:
cd ~/projects/Consilium && git reset --hard HEAD
# In consilium-docs (assumes Stage 1 + Stage 2 committed):
cd ~/projects/consilium-docs && git reset --hard <stage-2-sha>
# Restore plugin cache by re-running Stage 5's cp-from-source commands against the
# restored source tree. Migration-in-progress marker stays until Stage 5 finishes
# or is manually removed.
```

**Orphan-file classification rules** (resolved from round-1 GAP-1 Provocator):

| File pattern | Destination | Rule |
|-|-|-|
| `docs/consilium/specs/YYYY-MM-DD-<topic>-*.md` + matching `plans/YYYY-MM-DD-<topic>-*.md` | `cases/<date>-<slug>/{spec.md,plan.md}` | Paired spec+plan → new case folder |
| Unpaired spec or plan | `cases/<date>-<slug>/{spec.md,plan.md}` | Standalone → case folder; missing sibling not synthesized |
| `docs/consilium/ROADMAP.md` | `cases/2026-04-09-consilium-foundation/ref-roadmap.md` | Foundational doc from 2026-04-09 cluster; becomes a ref in the foundation case |
| `docs/ideas/*.md` | `cases/<date>-<slug>/spec.md` with `status: draft` | Each idea opens its own draft case |
| `docs/consilium/debugging-cases/*.md` (not README) | `cases/<date>-<slug>/diagnosis.md` + STATUS reflecting end state | (Currently empty; rule applies when data lands) |
| `docs/consilium/pass-2/` (empty dir) | delete | No content to migrate |
| `docs/CONSILIUM-VISION.md` | Stays in Consilium | Agent-impl (system architecture) |
| `docs/testing.md`, `docs/testing-agents.md`, `docs/claude-subagents-mcp-findings.md`, `docs/windows/polyglot-hooks.md`, `docs/README.codex.md`, `docs/README.opencode.md` | Stays in Consilium | Agent-impl (research + testing procedures + environment notes) |
| `docs/consilium/debugging-cases/README.md` | Fold into `consilium-docs/CONVENTIONS.md` at Stage 4 | State machine rules belong in CONVENTIONS |

**Named migration targets (examples; exhaustive list in edicts plan):**
- `2026-04-23-tribune-reshape-and-medusa-rig.md` + `-execution.md` → `cases/2026-04-23-tribune-reshape/` (`status: closed`, `retro.md` synthesized as "case closed before mandatory-retro rule; no retro at time of closure")
- `2026-04-24-tribune-consilium-repo-resolution.md` (abandoned) + **this spec + its eventual plan** → `cases/2026-04-24-consilium-docs/` (single case folder — same problem domain, two sessions). Resolved from round-1 GAP-11 (self-migration silence) + round-2 Censor naming CONCERN.
  - `ref-tribune-resolution-plan.md` ← abandoned plan (content intact including abandonment header). **Renamed from v2's `session-01-tribune-resolution-plan.md` per round-2 Censor CONCERN** — the abandoned plan is prior-attempt reference material, not session-1 work. `ref-` prefix matches the spec's own conventions for reference docs.
  - `spec.md` ← this spec (v3)
  - `plan.md` ← the forthcoming implementation plan for this spec
  - `STATUS.md` with `status: routed` while Stage 5 is executing, transitioning to `status: closed` at Stage 5 commit
- `2026-04-21-consilium-backend-specialization-session-1.md` → `cases/2026-04-21-consilium-backend-specialization/` with `status: routed` (open case, session 1 artifact)
- `2026-04-10-graphify-corpus-pass-3-*.md` → `cases/2026-04-10-graphify-corpus-pass-3/`. DISCREPANCY_REPORT.md joins as `ref-discrepancy-report.md`.
- `docs/ideas/graphify-corpus-restructure.md` → `cases/2026-04-10-graphify-corpus-pass-3/ref-restructure-ideation.md` (it's ideation that fed pass-3; belongs in that case)
- `docs/ideas/consul-improvements.md` → `cases/2026-04-09-consul-improvements/spec.md` as draft case (opens its own case). **Date: git-created (2026-04-09)** per round-2 CONCERN — retro-migration cases use the artifact's origin date for consistency with other foundation-era migrations.
- Nine 2026-04-09 foundation specs (brainstorming-writing-plans-reshape, consul-skill-rewrite, domain-bible, graphify-foundation, knowledge-extraction, learning-loop + writeback, roman-personas, skill-migration, subagent-driven-dev-reshape, verification-engine) + matching plans → `cases/2026-04-09-consilium-foundation/` as a single large multi-session case (all closed; the foundation work that built Consilium itself)

**Destructive operations (run LAST per commit ordering discipline above):**
- `rm -rf Consilium/graphify-source/` (directory deleted after its three content files migrate in Stage 2 + Stage 3).
- `rm -rf Consilium/docs/consilium/specs/ Consilium/docs/consilium/plans/ Consilium/docs/ideas/ Consilium/docs/consilium/debugging-cases/ Consilium/docs/consilium/pass-2/ Consilium/docs/consilium/ROADMAP.md`.
- Commit: *"migrate all historical artifacts into consilium-docs/cases/; delete empty dirs from Consilium"* — single atomic commit so rollback is clean.

### Stage 4 — Fold debugging-cases README into CONVENTIONS

- Read `Consilium/docs/consilium/debugging-cases/README.md` (state machine + collision rule + Phase 1 scan semantics + promotion triggers + case-file template).
- Fold into `$CONSILIUM_DOCS/CONVENTIONS.md` — combining with Stage 1 stub to produce the authoritative artifact rule doc.
- Delete `Consilium/docs/consilium/debugging-cases/README.md` (content now lives at consilium-docs).
- Commit: *"fold debugging-cases README into CONVENTIONS.md"*.

### Stage 5 — Repoint Claude-Consilium + graphify excision + cross-ref audit + close forbidden window

**Single stage because agent-surface changes interlock** — partial repointing leaves the session split across two path regimes.

**Agent-surface edits:**
- Update all files in the Agent Integration table (SKILLs + personas + implementer-prompt + verification + user-scope agents + scripts + CLAUDE.md + VISION.md).
- Strip graphify references per the expanded Graphify Excision inventory (16 surfaces).
- Fix pre-existing `~/.codex/agents/` cruft in consul + edicts SKILLs → `~/.claude/agents/`.
- Rewrite tribune SKILL Phase 1 scan to walk `find $CONSILIUM_DOCS/cases -maxdepth 2 -name STATUS.md` with status filter (see Agent Integration table entry for tribune SKILL).
- Cross-reference audit: scan `skills/references/personas/*.md` + `skills/references/verification/**/*.md` + doctrine files in new home. Apply the three-category resolution rule from the Agent Integration table cross-ref row.
- Reframe `scripts/check-tribune-staleness.py` per the three explicit decisions in the Agent Integration table.
- **Delete `scripts/refresh-graph.sh`** (dead code post-graphify-excision).

**Cache re-population:**
- `cp` each edited SKILL.md back to `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/<name>/SKILL.md`.
- `rsync -a --delete skills/references/personas/ ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/references/personas/`.
- `rsync -a --delete skills/references/verification/ ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/references/verification/`.

**Codex adoption case bootstrap** (round-2 GAP — explicit agent + commit boundary):
- Legatus runs `$CONSILIUM_DOCS/scripts/case-new codex-consilium-docs-adoption --target consilium --agent codex`. Creates `cases/<today>-codex-consilium-docs-adoption/` with `status: draft`, `spec.md` stub carrying "Imperator: update Codex-Consilium agent surfaces to match consilium-docs conventions. Mirror Claude-side Stage 5 edits on the Codex fork."
- Legatus adds INDEX.md banner with comment-delimited markers for programmatic removal:

  ```markdown
  <!-- banner:codex-adoption-pending -->
  > ⚠ **Codex-side adoption pending.** Codex-Consilium still writes to old paths. Artifacts from Codex sessions may land in `Consilium-codex/docs/consilium/...` — migrate them manually until the adoption case ships. Tracked at `cases/<today>-codex-consilium-docs-adoption/`.
  <!-- /banner:codex-adoption-pending -->
  ```

  Comment markers enable later automated removal: `sed -i '/<!-- banner:codex-adoption-pending -->/,/<!-- \/banner:codex-adoption-pending -->/d' INDEX.md` run from the Codex-adoption case at its own close.

**Validation:**
- Run `scripts/check-codex-drift.py --sync` to propagate persona edits to 6 user-scope agents.
- Run `scripts/check-tribune-staleness.py` against the new doctrine home → expect clean.

**Close the forbidden window:**
- `rm "$CONSILIUM_DOCS/.migration-in-progress"` as the last pre-commit step. Any Consul/Medicus/Edicts/Legion/March Phase 0 check now passes.

**Commit** (single atomic commit covering: Claude-Consilium edits + graphify excision + cross-ref audit + staleness reframe + refresh-graph.sh delete + cache re-population + Codex-adoption case + INDEX banner + marker removal): *"repoint agent surfaces to consilium-docs; excise graphify; open Codex-adoption tracker case; close forbidden window"*.

**Outcome:** System is whole. Agents write to `consilium-docs` on next invocation. Forbidden window closed. Codex-adoption tracker case visible in INDEX until Imperator completes that work.

## Codex Coordination

> **Confidence: High** — round-1 CONCERN + round-2 bootstrap specifics (who opens, what commit, banner marker).

Between Claude-side ship (end of Stage 5) and Codex-side catch-up, artifacts from Codex sessions would scatter back into old paths. Two mechanisms defend the transition window — both bootstrapped atomically inside the Stage 5 commit:

1. **Follow-up case opened by Legatus at Stage 5.** The Legatus runs `$CONSILIUM_DOCS/scripts/case-new codex-consilium-docs-adoption --target consilium --agent codex` during the Stage 5 agent-surface sequence. This produces `cases/<today>-codex-consilium-docs-adoption/` with `status: draft`. Files land inside the single Stage 5 commit — not a separate commit (round-2 bootstrap-ambiguity fix). Imperator runs Codex-side updates as subsequent sessions of this case; case closes when Codex is repointed and the Imperator runs `case-close`.

2. **INDEX.md warning banner with comment markers** (round-2 grep-identifiability fix):

   ```markdown
   <!-- banner:codex-adoption-pending -->
   > ⚠ **Codex-side adoption pending.** Codex-Consilium still writes to old paths. Artifacts from Codex sessions may land in `Consilium-codex/docs/consilium/...` — migrate them manually until the adoption case ships. Tracked at `cases/<today>-codex-consilium-docs-adoption/`.
   <!-- /banner:codex-adoption-pending -->
   ```

   The Codex-adoption case's own `case-close` flow includes a step to strip this banner: `sed -i '/<!-- banner:codex-adoption-pending -->/,/<!-- \/banner:codex-adoption-pending -->/d' "$CONSILIUM_DOCS/INDEX.md"`. Comment delimiters survive Imperator edits to adjacent INDEX content.

Imperator retains ownership of Codex-side execution. Claude-side ships independently, with the pending gap visible at INDEX top until the adoption case ships.

## Out of Scope

> **Confidence: High**.

- **Codex-Consilium agent-surface changes.** Imperator-executed separately (tracked via adoption case).
- **GitHub remote / push cadence.** Local-only. Future upgrade is `git remote add`.
- **Renaming or restructuring agent-impl files beyond path + graphify-excision updates.**
- **Auto-archive script.** Manual archive only for now.
- **Promotion logic for reference docs** (`ref-<topic>.md` → doctrine). Case-by-case Imperator decision.
- **Cross-case dependency machinery** beyond markdown links.
- **Per-agent lockfiles or concurrent-write protection.** Local-only single-user repo.
- **Deleting the `/graphify` skill itself** at `~/.claude/skills/graphify/`. User-scope skill cleanup, separate from this Consilium-repo migration.
- **Building a replacement for graphify.** TBD per Imperator.

## Open Questions (for plan authorship, not spec)

1. Exact STATUS.md frontmatter field names.
2. Exact script CLI arg formats + error behaviors (already Medium confidence; plan phase decides positional vs flag details).
3. Which session-1 form is idiomatic — unprefixed (`spec.md`) or prefixed (`session-01-<topic>-spec.md`)? Scripts accept both; authors choose convention per case.
4. Handoff content template fields.
5. `rejected` state fire frequency — is it common enough in practice to need script support, or only manual STATUS edits?

## Confidence Map Summary

| Section | Confidence | Evidence |
|-|-|-|
| Three-layer architecture | High | Imperator confirmed in deliberation |
| Personas + verification stay agent-impl | High | Drift-check requires fork-local |
| Case-as-universal-unit | High | Imperator confirmed |
| `$CONSILIUM_DOCS` env var + local-only | High | Imperator decision |
| Repo name `consilium-docs` | High | Imperator confirmed |
| Graphify excision (all surfaces) | High | Imperator decision post-round-1 |
| Staged 5-stage migration | High | Imperator confirmed |
| 8-state case lifecycle (verbatim Medicus 7 + `referenced`; NO renames) | High | Imperator decision post-round-2 — restore exact names; zero renames |
| Forbidden-window marker file enforcement (`$CONSILIUM_DOCS/.migration-in-progress`) | High | Imperator decision post-round-2 — mechanical guardrail, removes Imperator-memory reliance |
| Graphify excision inventory (16 surfaces including scout/soldier personas, implementer-prompt, known-gaps.md:3, refresh-graph.sh) | High | Round-2 Censor + Provocator completeness verified |
| Abandoned edict preserved as part of this case | High | Imperator decision |
| Per-case session numbering | High | Imperator confirmed |
| Markdown-link cross-case refs | High | Imperator confirmed |
| Imperator-declared case identity | High | Imperator confirmed |
| Draft-status ideation cases | High | Imperator confirmed |
| Differentiated retro discipline (mandatory features / optional bugs) | High | Imperator decision post-round-1 |
| Draft→abandoned 7-day timeout | High | Preserves Medicus behavior |
| Codex-adoption follow-up case + INDEX banner | High | Imperator decision post-round-1 |
| Claude-only agent-surface scope | High | Imperator confirmed |
| Stage 2-5 invocation-forbidden window | High | Derived from verification findings + architectural constraints |
| Plugin cache invalidation in Stage 2 | High | Provocator finding applied |
| Cross-reference audit in Stage 5 | High | Provocator finding applied |
| Staleness script reframe | High | Census finding applied |
| graphify-source/ classification (voice+brand → doctrine; discrepancy → pass-3 ref) | High | Consul investigation + Imperator direction |
| `case-new` collision-disambiguation ships in Stage 1 | High | Provocator finding applied |
| Flat filename conventions | Medium | Consul proposal; no pushback |
| STATUS.md schema exact fields | Medium | Plan-time decision |
| Lifecycle scripts signatures | Medium | Consul proposal — relabeled from Low after round-1 CONCERN-3 |
| Doctrine sub-layout (flatten tribune-refs + keep domain subgroup) | Medium | Consul proposal |
| Identity-check marker file (CONVENTIONS.md with fixed signature line) | Medium | Consul lift from Provocator finding |
| Halt-discipline prose requirement | Medium | Consul lift from Provocator finding |
| Orphan-file classification rules (Stage 3) | Medium | Consul proposal after round-1 GAP audit |
| Two-documentation-surfaces partition rule | Medium | Consul refined after round-1 CONCERN-2 |
| No auto-archive | Medium | Consul position, survived Provocator |
| Exact script CLI arg shapes + error behaviors | Low | Detail-level; plan-time decision |
| Exact frontmatter field names | Low | Detail-level |
| Session-1 prefixed-vs-unprefixed convention-per-case | Low | Script accepts both; authors choose |
