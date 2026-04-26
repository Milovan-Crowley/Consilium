# 2026-04-26-kimi-principales-integration — Spec (Shadow-Mode v1, iteration 2) — **HALTED**

> **HALT NOTICE (2026-04-26):** This spec is halted by Imperator decision after iteration 2 returned 4 unresolved MISUNDERSTANDINGs across two verifiers. **Do not execute this spec.** Read `next-session-notes.md` first for the architectural lessons, the unresolved findings catalog, and the recommended manual-experiment path forward. The spec body below is preserved as architectural reference only.

## Goal

Wire the shipped Kimi Principales MCP substrate into the Consilium dispatch flow as a **shadow-mode observability layer** for verifier dispatch, plus a **face-value PRD Pre-Attack** Consul-side helper, so we accumulate real per-case data on Kimi's verification quality before committing to any architecture that lets Kimi shape officer judgment.

This case answers a measurement question, not an architectural one. The architectural question — *should Kimi feed officers, become officer-tools, or be promoted to a pre-officer pass* — is deferred to a sibling case after shadow data lands.

## Iteration History

- **Iteration 1.** First-pass spec drafted from the Imperator–Consul–Quintus brainstorm. Verification surfaced two MISUNDERSTANDINGs (Pillar Alpha and Pillar Beta dispatch mechanics violated the substrate's `verify_lane` input contract — claims and evidence sources are mandatory), 14 GAPs across three verifiers, 5 CONCERNs.
- **Iteration 2 (this version).** Imperator re-established correct understanding of `verify_lane` requirements: claim extraction + lane-specific evidence-bundle assembly is the dispatcher's responsibility. Pillar Alpha and Pillar Beta rewritten to honor the substrate contract. All GAPs addressed inline; all CONCERNs evaluated and adopted unless reasoned otherwise.

## Source

- Substrate spec: `docs/cases/2026-04-26-kimi-principales-v1/spec.md`. Substrate ships dormant; this case wires it.
- Substrate next-session-notes: `docs/cases/2026-04-26-kimi-principales-v1/next-session-notes.md`. The deferred MISUNDERSTANDING #1 (Independence Rule corruption) is **partially dissolved** by shadow mode at the dispatch boundary. Indirect contamination paths via Consul cognition and the human channel are preserved consciously and named in Invariants.
- Reference plan: `/Volumes/Samsung SSD/Downloads/consilium_kimi_principales_implementation_plan.md`. Sections 10 (officer prompt amendments) and 14 (lane routing matrix) are NOT adopted in v1 — they assume Kimi shapes officer judgment, which shadow mode rejects.
- Imperator brief, Consul deliberation, counter-Consul (Quintus Adversarius) brainstorm of 2026-04-26.
- Iteration 1 verification reports from Censor (Aulus Scrutinus), Provocator, Custos.

## Background

The Consilium today bills 3-5 verification revisions per spec or plan. The Imperator wants 1-and-done. The substrate ships a cheap Kimi MCP (`mcp__principales__verify_lane`) that returns validated `principalis_docket.v1` JSON; it costs roughly one-sixth of an Opus officer dispatch.

The temptation is to plug Kimi into officer judgment immediately. Each path requires Codex amendments and officer-prompt amendments. Both are doable. **Neither is justifiable until we know whether Kimi's verdicts are worth the doctrinal cost.**

The Imperator's instinct: ship Kimi *strictly additive* to officers first. Run Kimi lanes in parallel with the existing officers. Keep a tally — did Kimi find the same GAPs? Different ones? Faster? Cheaper? After enough cases, the data dictates the next move; until then, no architectural commitment.

This is shadow deployment. v1 is observation-only on the verifier surface. The Imperator gets the data before the bet.

PRD Pre-Attack is separable. It runs at L1 (Consul-dispatched, before deliberation), feeds Consul deliberation directly. Indirect contamination of officer judgment via Consul cognition is real and named (see Invariants); the architecture accepts it because the alternative (shadowing PRD pre-attack too) is data-thin while we're still gathering Pillar Beta signal.

## Architecture

### The Three Layers

> **Confidence: High** — Imperator's selection.

| Layer | Role | What changes in v1 |
|-|-|-|
| L1 | Consul / Legatus (main flow) | Pillar Alpha (PRD Pre-Attack) added. Shadow-mode dispatch of Kimi lanes alongside officer dispatch. |
| L2 | Officer-Centurions (Censor, Praetor, Provocator) | Untouched. No prompt amendment, no behavior change. They do not know Kimi ran. |
| L3 | Kimi Principales | Substrate already shipped. Dispatcher (Consul/Edicts) constructs structured request per dispatch. |

### What "verify_lane" Requires of the Dispatcher

> **Confidence: High** — verified against substrate source `claude/mcps/principales/src/server.ts:31-44` and `pipeline/request-builder.ts:37-38`.

A Principalis is NOT fire-and-forget. Each `verify_lane` call requires the dispatcher to construct:

- `artifact_slice` — the relevant slice of artifact text (whole spec, section, PRD body)
- `claims` — array of strings, **at least one**; each claim is a discrete assertion the principalis verifies
- `evidence_bundle.sources` — array of evidence sources, **at least one**; each source is a piece of doctrine, code, or self-reference the principalis uses to judge claims
- Plus ID/sha fields: `run_id`, `artifact_id`, `artifact_sha`, `bundle_id`, `artifact_type`, `lane`, `profile`, `model`

Per the principales doctrine (`claude/skills/references/verification/principales.md:11-16`), a Principalis is one lane × one slice × one bounded evidence packet × one claim list. The dispatcher does the work to construct this structured request. The principalis does NOT auto-extract claims from the artifact text.

This was the iteration-1 MISUNDERSTANDING. The substrate is not "give it text, get back a critique." It is "give it claims and evidence about an artifact slice; get back per-claim verdicts."

### The Two Pillars

#### Pillar Alpha — PRD Pre-Attack at L1 (face-value)

> **Confidence: High** for architecture and dispatch mechanics; Medium for claim-extraction granularity (will iterate after first cases).

Before Consul deliberation begins (Phase 1 reconnaissance), Consul fires four lanes against the Imperator's PRD. Output is a structured PRD critique that Consul reads, surfaces ambiguities to Imperator, and uses to open deliberation with sharper questions.

##### Lanes

| Lane | What it judges | Evidence bundle composition |
|-|-|-|
| `prd-ambiguity` | Each substantive PRD statement: is it unambiguous (single reading)? | PRD body as self-reference source (`source_id: 'prd', source_type: 'artifact'`) |
| `prd-edge-cases` | Each PRD-described behavior: are edge cases covered or unstated? | PRD body as self-reference source |
| `prd-unstated-assumptions` | Each PRD assertion: what preconditions does it presume without naming? | PRD body + relevant doctrine excerpts (see Doctrine selection below) |
| `prd-doctrine-alignment` | Each PRD term that maps to a Codex/doctrine concept: does the term align? | PRD body + relevant doctrine excerpts |

##### Dispatch mechanics (Consul-side per lane)

1. Consul reads the PRD body (from Linear or pasted; see PRD source below).
2. Consul slices the PRD into substantive sentences/sections (prose-level claim extraction). One claim per substantive PRD assertion. Cap: ~20 claims per dispatch (4 dispatches × 20 = 80 claims max per case for Pillar Alpha).
3. Consul assembles the lane-specific evidence bundle per the table above. Doctrine excerpts loaded from `$CONSILIUM_DOCS/doctrine/` are scoped to the PRD's topic surface (prd-doctrine-alignment) or to standard precondition doctrine (prd-unstated-assumptions). PRD self-reference is encoded as a `source_type: 'artifact'` source whose content is the PRD body.
4. Consul invokes `mcp__principales__verify_lane` per lane with the structured request. All four dispatches run in parallel (`run_in_background: true`).
5. Dockets return per claim. Consul handles findings per Codex (see PRD docket finding handling below).
6. Consul writes `prd-attack.json` to case dir for audit.

##### PRD docket finding handling (Codex-compliant)

| Verdict | Handling | Source |
|-|-|-|
| **MISUNDERSTANDING** | **Halt deliberation. Surface to Imperator immediately with chain of evidence.** Substrate stamps `requires_officer_review=true`; in Pillar Alpha there is no officer-of-record, so the Imperator IS the reviewer. Do not auto-fix; do not absorb silently. | Codex lines 41-47, 124-130 |
| GAP | Surface to Imperator as a deliberation question. Imperator decides whether the PRD needs revision OR the spec should accommodate the missing piece. PRD GAPs auto-feed to the *Imperator* (the producer of the PRD), not the Consul. | Codex line 58, protocol line 181 |
| CONCERN | Absorb into deliberation as conversational fuel. Surface with reasoning if it changes Consul's framing materially. | Codex lines 65-74 |
| SOUND | Note in `prd-attack.json` audit; no inline action. | Codex lines 76-83 |

##### PRD source

Imperator passes a Linear identifier (project URL, issue URL, or issue ID) OR pastes the PRD body verbatim.

**Detection mechanism:** Sonnet-runtime try-and-catch on `mcp__linear-server__get_issue` against the Imperator-supplied identifier. The spec uses the `linear-server` namespace (verified `mcp__linear-server__*` is allowlisted in `~/.claude/settings.json:14`; the disabled `"linear"` entry at settings.json:22 is a different MCP and is not used). On any error (disabled, not authenticated, network, malformed identifier, issue not found), Consul transparently falls back to asking the Imperator to paste the PRD body. The error is not surfaced to the Imperator unless he asks for the reason.

##### Opt-out

`CONSILIUM_PRINCIPALES_PRD_ATTACK=off` disables Pillar Alpha at MCP spawn time. Imperator may also wave it off per case ("skip pre-attack"). Default is `on` once v1 ships.

##### Cost

Capped at the substrate's `CONSILIUM_KIMI_SESSION_BUDGET_USD` ($5 default), shared with Pillar Beta. See "Combined budget" below.

#### Pillar Beta — Shadow Mode for Verifiers

> **Confidence: High** for architecture and dispatch mechanics; Medium for section-level claim granularity (will iterate after first cases).

When the Consul (or Edicts, or Legion's Campaign review) dispatches officers, the dispatching skill ALSO fires the matching Kimi lanes in parallel. Officer verdicts are authoritative; Kimi dockets go to a side-log file, never reach officers.

##### Dispatch mechanics

1. Officer dispatch fires with the cold dispatch prompt (4 input classes per Codex Independence Rule — unchanged).
2. **CONCURRENTLY** (same Consul/Edicts step), for each matching Kimi lane per the lane mapping table:
   a. Slice the artifact: the whole spec.md or plan.md body is the slice; lane prompts examine the slice section-by-section.
   b. Extract section-level claims: one claim per substantive section heading. Format: `"Section '<heading>' asserts <one-line summary>"`. Cap: ~15 claims per dispatch.
   c. Assemble lane-specific evidence bundle (see lane-to-evidence table below).
   d. Invoke `mcp__principales__verify_lane` per lane (`run_in_background: true`).
3. Officer verdicts handled per Codex auto-feed loop (unchanged).
4. Kimi dockets written to per-dispatch sub-files (see Tally Storage).
5. End-of-dispatch: if any Kimi docket has `requires_officer_review=true` AND the corresponding officer did NOT flag the same finding, surface a "shadow alarm" sidebar to Imperator with chain of evidence. (Imperator decides whether to investigate; campaign continues per Imperator discretion. See Shadow MISUNDERSTANDING handling below.)

##### Lane-to-evidence table

| Lane | Evidence bundle composition |
|-|-|
| `upstream-coverage` | Doctrine excerpts (separately loaded — see contamination invariant) |
| `ambiguity-audit` | Spec self-reference (`source_type: 'artifact'`, content: spec body) |
| `confidence-map-sanity` | Spec self-reference + the inline confidence annotations extracted as a structured aside |
| `contradiction-hunt` | Spec self-reference (or plan self-reference for plan dispatches) |
| `edge-case-attack` | Spec/plan self-reference |
| `task-ordering` | Plan self-reference |
| `undefined-references` | Plan self-reference |
| `test-command-plausibility` | Plan self-reference |
| `literal-execution-failure` | Plan self-reference |
| `migration-risk` | Plan self-reference |

##### Shadow MISUNDERSTANDING handling

The substrate stamps `requires_officer_review=true` on every Kimi MISUNDERSTANDING. In shadow mode there is no officer consumer of the docket; the substrate's contract is honored by routing the flag to the **Imperator-facing shadow alarm sidebar** at end-of-dispatch.

Two sub-cases:

- **(a) Officer also flagged MISUNDERSTANDING** — Codex flow handles via Imperator escalation; Kimi corroborates in side-log; no separate alarm needed (the Imperator is already engaged).
- **(b) Officer did NOT flag, Kimi did** — surface the Kimi MISUNDERSTANDING to the Imperator at end-of-dispatch as a shadow alarm. The campaign continues; the Imperator decides whether to investigate. This is NOT silent absorption: the alarm is visible inline, not buried in `/principales-tally`.

The Codex's "halt and escalate" rule is honored in spirit — Kimi MISUNDERSTANDINGs are surfaced to the Imperator at the next reasonable boundary (end-of-dispatch). Full halt is not invoked because Kimi is not yet authoritative; if Kimi proves reliable, future cases may promote Kimi MISUNDERSTANDINGs to halting status.

##### Lane mapping table

| Officer + artifact | Matching Kimi lanes |
|-|-|
| Censor on spec | `upstream-coverage`, `ambiguity-audit`, `confidence-map-sanity` |
| Provocator on spec | `contradiction-hunt`, `edge-case-attack` |
| Praetor on plan | `task-ordering`, `undefined-references`, `test-command-plausibility`, `literal-execution-failure`, `migration-risk` |
| Provocator on plan | `migration-risk`, `literal-execution-failure` (plan-only). The substrate's `contradiction-hunt` and `edge-case-attack` are spec-lanes per `lanes.md` grouping; v1 does NOT cross-fire them on plan dispatches. Cross-fire is a future-case decision after data shows whether plan-side adversarial coverage is missing. |
| Campaign Review (legion-side, Censor) | All Censor spec lanes |
| Campaign Review (legion-side, Praetor) | All Praetor plan lanes |
| Campaign Review (legion-side, Provocator) | All Provocator lanes (spec lanes if reviewing spec compliance, plan lanes if reviewing plan compliance) |
| Tribunus (mini-checkit, per task) | None in v1 (see "What This Defers"). |

##### Opt-out

`CONSILIUM_PRINCIPALES_SHADOW=off` disables Pillar Beta at MCP spawn time. Default is `on` once v1 ships.

##### Combined budget

The substrate's `CONSILIUM_KIMI_SESSION_BUDGET_USD` ($5 default, per-session) is shared between Pillar Alpha and Pillar Beta. Worst case per case (auto-feed iteration 2):
- Pillar Alpha: 4 lanes × ~$0.02 = $0.08 (one fire per case)
- Pillar Beta spec verification × 2 iterations × 5 lanes × ~$0.015 = $0.15
- Pillar Beta plan verification × 2 iterations × 7 lanes × ~$0.015 = $0.21
- Pillar Beta Campaign review × 1 × 12 lanes × ~$0.015 = $0.18
- **Total worst case ~$0.62 per case** — well within budget.

If the budget breaker fires (substrate-level), the dispatching skill records `lane_status: 'budget_skipped'` for unfired lanes and surfaces a warning to Imperator at end-of-dispatch (not silently). The tally aggregator excludes budget-skipped lanes from agreement scoring to avoid corrupting promotion data.

### What This Defers to Future Cases

- **Promotion of any Kimi lane to officer-tool, pre-pass, or post-pass.** Decided per-lane after shadow data accumulates. Promotion is its own case with the data attached.
- **Codex amendment to Independence Rule.** Not needed in v1.
- **Officer prompt amendments.** Not needed in v1.
- **`tribune` (Medicus) Phase 6 dispatch shadow** — `tribune/SKILL.md:181` dispatches Provocator at Phase 6 of diagnosis. Diagnosis-family lanes are all `enabled: false` in the substrate. Shadow mode for tribune awaits substrate v2 (when diagnosis lanes are enabled). v1 explicitly excludes tribune from shadow dispatch.
- **`march/SKILL.md` Campaign Review shadow** — march does NOT invoke a Campaign Review triad; it hands off to `consilium:triumph` for completion (verified `march/SKILL.md` Section 3). Solo-march sessions therefore have no Campaign-Review shadow dispatch in v1; this gap is acknowledged. If shadow data eventually warrants triad-side coverage in solo-march sessions, a future case adds it.
- **Adversarial self-play (flip-and-reseed).** Imperator's idea; deferred to a substrate v2 case as a lane profile.
- **Kimi as Test Writer.** Legion/March integration; separate case.
- **Mode B (host-side repo-grounded tools).** Out of scope per substrate deferral.
- **Best-of-N orchestration.** Out of scope per substrate deferral.
- **Cross-fire of spec-lanes onto plan dispatches** (and vice versa). Currently v1 honors the lanes.md grouping; future case may cross-fire if data shows adversarial coverage is missing on plan side.

## What's Needed

### 1. Lane Prompt Maturation

The substrate shipped 10 prompts. `upstream-coverage.md` is fully production-shaped. The other 9 are **stubs** — direct copies of `upstream-coverage.md` with only the Lane Definition section swapped. Per Provocator finding in iteration 1, four classes of edits are needed per stub, not just Forbidden Behavior text:

1. **Lane-specific Forbidden Behavior text** — replacing the inherited upstream-coverage rules ("quote BOTH the artifact AND the evidence source") with rules that fit the lane's actual evidence requirement.
2. **Output Schema example field corrections** — the schema example block hardcodes `"artifact_type": "spec"`, `"lane": "upstream-coverage"`, `"profile": "principalis_light"`. For other lanes these are wrong on all three fields. Fix to either `"{{lane}}"` template substitution or actual lane name + correct profile.
3. **Lane Definition + Forbidden Behavior reconciliation** — e.g., `contradiction-hunt`'s "Quote BOTH sides of any contradiction" rule conflicts with the inherited "BOTH artifact AND evidence source" rule. Rewrite Forbidden Behavior to be consistent with lane semantics.
4. **Profile correction in template metadata** — adversarial lanes (`contradiction-hunt`, `edge-case-attack`, `literal-execution-failure`, `migration-risk`) are `principalis_adversarial` per lanes.md, but the example shows `principalis_light`. Correct.

**Estimate:** 2x the iteration-1 sizing. Each stub is materially heavier than "fix Forbidden Behavior text only."

| Lane | Officer surface | All four edits needed? |
|-|-|-|
| `upstream-coverage.md` | Censor (spec) | Production-ready — keep as reference |
| `ambiguity-audit.md` | Censor (spec) | Yes |
| `confidence-map-sanity.md` | Censor (spec) | Yes |
| `contradiction-hunt.md` | Provocator (spec) | Yes — special attention to Lane Def vs Forbidden Behavior reconciliation |
| `edge-case-attack.md` | Provocator (spec) | Yes |
| `task-ordering.md` | Praetor (plan) | Yes |
| `undefined-references.md` | Praetor (plan) | Yes |
| `test-command-plausibility.md` | Praetor (plan) | Yes |
| `literal-execution-failure.md` | Praetor (plan) | Yes |
| `migration-risk.md` | Provocator (plan) | Yes |

**New PRD pre-attack lane prompts** (`claude/mcps/principales/prompts/`):

| Lane | Purpose |
|-|-|
| `prd-ambiguity.md` | Identify vague statements, undefined terms, statements that can be read two ways |
| `prd-edge-cases.md` | Identify cases the PRD does not cover |
| `prd-unstated-assumptions.md` | Identify preconditions and dependencies the PRD relies on without naming |
| `prd-doctrine-alignment.md` | Cross-check PRD against Codex sections and `$CONSILIUM_DOCS/doctrine/` for conflicts |

Each prompt follows the substrate's documented prompt format (lane definition + sterile-clerk reminder + lane-specific forbidden behaviors + claim bundle slot + evidence packet slot + output schema reference + escalation rule + vocabulary-collision discipline). Output Schema example fields are correctly templated for the lane.

**Lane registry update:** `claude/skills/references/verification/lanes.md` is amended to add the four new `prd-*` lane entries (`family: artifact-text`, `default_profile: principalis_light` for ambiguity/edge-cases/unstated, `principalis_grounded` for doctrine-alignment, `evidence_required: artifact` for the first three and `artifact_and_doctrine` for the fourth, `tools: []`, `kimi_sound_final: false`, `enabled: true`).

### 2. Skill Modifications

#### `claude/skills/consul/SKILL.md`

Two amendments:

**Phase 1 (Reconnaissance) addition — Pillar Alpha.** After resolving `$CONSILIUM_DOCS` and reading domain doctrine, before dispatching codebase scouts:

```markdown
**PRD Pre-Attack (Pillar Alpha).** When the Imperator's request references a Linear PRD or attaches a pasted PRD body:

1. Resolve PRD source: try-and-catch on `mcp__linear-server__get_issue` if Linear identifier provided; fall back to asking Imperator to paste on any error.
2. Slice the PRD into substantive sentences/sections; extract one claim per substantive assertion (~20 claims max per lane).
3. Assemble per-lane evidence bundles per the spec's Pillar Alpha lane-to-evidence table.
4. Dispatch four lanes in parallel via `mcp__principales__verify_lane`: `prd-ambiguity`, `prd-edge-cases`, `prd-unstated-assumptions`, `prd-doctrine-alignment`.
5. Handle returned dockets per the PRD docket finding handling table:
   - MISUNDERSTANDING → halt deliberation, surface to Imperator immediately with chain of evidence
   - GAP → surface to Imperator as deliberation question
   - CONCERN → absorb into deliberation
   - SOUND → audit log only
6. Write merged dockets to `docs/cases/<slug>/prd-attack.json`.

Skip when: Imperator says "skip pre-attack," request has no PRD, or `CONSILIUM_PRINCIPALES_PRD_ATTACK=off`.
```

**Phase 3 (Codification) addition — Shadow Mode dispatch.** In the existing "I dispatch verification" section, add:

```markdown
**Shadow Mode (Pillar Beta).** When dispatching Censor + Provocator for spec verification:

1. Construct the cold officer dispatch prompts (per existing protocol).
2. CONCURRENTLY, for each matching Kimi lane per the lane mapping table:
   a. Slice the spec body; extract section-level claims (one per substantive section heading, ~15 max).
   b. Assemble lane-specific evidence bundle. Doctrine excerpts for `upstream-coverage` are loaded INDEPENDENTLY of the officer's domain knowledge selection (per the Domain-Knowledge Independence Invariant).
   c. Invoke `mcp__principales__verify_lane` per lane (`run_in_background: true`).
3. Officer dockets handled per Codex auto-feed loop (unchanged).
4. Kimi dockets written to per-dispatch sub-files at `docs/cases/<slug>/principales-shadow/<run_id>-<lane>.json`.
5. At end-of-dispatch, if any Kimi docket has `requires_officer_review=true` AND the corresponding officer did NOT flag the same finding, surface a "shadow alarm" sidebar to Imperator with chain of evidence.

Skip when: `CONSILIUM_PRINCIPALES_SHADOW=off`.
```

#### `claude/skills/edicts/SKILL.md`

Same shape as Consul Phase 3, plan-side: when dispatching Praetor + Provocator for plan verification, also fire matching Kimi lanes per lane mapping table (plan-side rows). Side-log to per-dispatch sub-files.

#### `claude/skills/legion/SKILL.md`

Campaign Review (Censor + Praetor + Provocator parallel dispatch at end of execution) is invoked at `legion/SKILL.md:248`. Add the same shadow-mode dispatch step at this site: when firing the triad, also fire matching Kimi lanes per the Campaign Review rows of the lane mapping table.

#### `claude/skills/march/SKILL.md`

**No Campaign Review shadow dispatch added.** Per Custos verification (iteration 1), march does NOT invoke a Campaign Review triad — it hands off to `consilium:triumph` for completion. Solo-march sessions have no Campaign-Review shadow dispatch in v1. This gap is acknowledged in "What This Defers."

#### `claude/skills/principales-tally/SKILL.md`

NEW skill (see Section 5).

#### Registration

Update `claude/CLAUDE.md` Commands section to include `/principales-tally`. Update plugin manifest at `~/.claude/plugins/installed_plugins.json` if applicable (verify during implementation; the existing skills `/consul` and `/tribune` are listed there as reference for the pattern).

### 3. New Doctrine File

**`claude/skills/references/verification/principales-shadow.md`** — sibling of `principales.md` (sterile-clerk doctrine). Defines:

- The lane mapping table (above) — load-bearing for the dispatching skills.
- The shadow-mode dispatch contract (officer + Kimi fire in parallel; Kimi never feeds officer; per-dispatch sub-files for race-free writes).
- The Pillar Alpha PRD docket finding handling table.
- The opt-out env vars.
- The Imperator review surface (`/principales-tally`).
- The Domain-Knowledge Independence Invariant (see Invariants).
- The shadow MISUNDERSTANDING handling rules.

### 4. Tally Storage

Per-dispatch sub-files. No central database. The aggregate `/principales-tally` skill walks all case directories and aggregates on demand.

**Layout:**

```
docs/cases/<slug>/
├── spec.md
├── plan.md
├── prd-attack.json                    # one file per case (Pillar Alpha)
└── principales-shadow/                # one DIRECTORY per case
    ├── <run_id>-upstream-coverage.json
    ├── <run_id>-ambiguity-audit.json
    ├── <run_id>-confidence-map-sanity.json
    ├── <run_id>-contradiction-hunt.json
    ├── <run_id>-edge-case-attack.json
    └── ...
```

**Why per-dispatch sub-files:** iteration-1 Provocator caught a write race — Censor + Provocator + 5 matching Kimi lanes converge on a single JSON file with concurrent appends. JSON is structurally edited (not byte-appended), so concurrent writers lose data. Per-dispatch sub-files eliminate writer-writer races (each lane writes its own file once) and reader-writer races (the tally reads files the dispatcher already finished writing).

**`<run_id>-<lane>.json` shape:**

```json
{
  "run_id": "...",
  "case_slug": "2026-04-26-example",
  "schema_version": 1,
  "dispatched_at": "2026-04-26T05:12:00Z",
  "artifact_type": "spec",
  "artifact_path": "docs/cases/2026-04-26-example/spec.md",
  "artifact_sha": "...",
  "lane": "upstream-coverage",
  "lane_status": "dispatched",
  "officer": {
    "role": "censor",
    "wall_ms": 42000,
    "verdict_summary": { "MISUNDERSTANDING": 0, "GAP": 2, "CONCERN": 1, "SOUND": 5 },
    "findings_digest": "..."
  },
  "kimi": {
    "wall_ms": 8200,
    "cost_usd": 0.014,
    "docket_overall": "GAP",
    "verdict_summary": { "MISUNDERSTANDING": 0, "GAP": 1, "CONCERN": 0, "SOUND": 4 },
    "findings_digest": "...",
    "requires_officer_review": false
  },
  "comparison": {
    "naive_overlap_score": 0.65,
    "officer_findings_matched_by_kimi": 1,
    "officer_findings_missed_by_kimi": 1,
    "kimi_findings_not_in_officer": 0,
    "requires_human_review_count": 1
  }
}
```

**`lane_status` values:** `dispatched`, `budget_skipped`, `mcp_unreachable`, `schema_error`, `transport_failure`. The tally aggregator excludes non-`dispatched` lanes from agreement scoring.

**`prd-attack.json` shape:**

```json
{
  "case_slug": "2026-04-26-example",
  "schema_version": 1,
  "prd_source": { "kind": "linear_url", "value": "https://linear.app/divinipress/issue/DIV-71" },
  "prd_sha": "...",
  "dispatched_at": "2026-04-26T05:00:00Z",
  "lanes": [
    {
      "lane": "prd-ambiguity",
      "lane_status": "dispatched",
      "wall_ms": 7100,
      "cost_usd": 0.012,
      "docket_overall": "CONCERN",
      "findings_digest": "...",
      "requires_officer_review": false
    }
  ],
  "consul_action": "surfaced 3 ambiguities to Imperator; resolved 2 in deliberation; 1 deferred"
}
```

**Imperator tagging file:** `docs/cases/<slug>/principales-shadow-tags.json` — separate file for Imperator's per-finding tags ("Kimi was right (officer missed)" / "Kimi was wrong (false positive)"). Separating tags from dispatch records eliminates writer-writer races between `/principales-tally` (writing tags) and the dispatching skill (writing dockets).

### 5. New Skill — `/principales-tally`

A new user-invocable skill at `claude/skills/principales-tally/SKILL.md`.

**Purpose:** present the shadow-mode comparison data to the Imperator. The Imperator runs `/principales-tally` periodically (he picks the cadence; no fixed N) to decide whether to promote any Kimi lane to a real role.

**Behavior:**

- Walks `docs/cases/*/principales-shadow/*.json` and `docs/cases/*/prd-attack.json`.
- Filters out non-`dispatched` lanes from agreement statistics; reports them as a separate "operational health" count (budget-skipped, mcp-unreachable, etc.).
- Aggregates by lane: total dispatches, total cost, mean wall time, mean naive overlap score, count of officer-only findings, count of Kimi-only findings, count of disagreements where Imperator tagged Kimi-right or Kimi-wrong.
- Surfaces both `naive_overlap_score` (algorithm's loose match) AND `requires_human_review_count` (matches the algorithm flags as non-trivial). The Imperator distinguishes algorithm-noise from real signal by looking at both numbers.
- Renders a summary table to the Imperator.
- Per-lane drill-down: Imperator can ask "show me Kimi-only findings for upstream-coverage" and the skill prints them with full chain of evidence.
- Imperator tagging: the skill writes tags to `docs/cases/<slug>/principales-shadow-tags.json`. No automated promotion logic in v1.

**Read-only with respect to dispatch records.** The skill never writes to `principales-shadow/*.json` or `prd-attack.json`. Tags live in the separate sidecar file.

### 6. Configuration

Two new env vars added to the eight-key `consilium-principales.env` object already shipped by the substrate at `~/.claude/settings.json` lines 257-274:

```json
{
  "CONSILIUM_PRINCIPALES_PRD_ATTACK": "on",
  "CONSILIUM_PRINCIPALES_SHADOW": "on"
}
```

Both default to `on` after v1 ships. Imperator can flip either to `off` independently. The substrate's `CONSILIUM_VERIFICATION_MODE` env var is left at `classic` in v1 — its semantics are reserved for the post-shadow promotion case.

### 7. Sanity Tests

Four tests gate v1. Test runner is **vitest** per substrate convention. Tests live at `claude/mcps/principales/test/integration/`.

1. **Per-dispatch sub-file shape (shadow path).** Mock the substrate to return a known docket. Trigger the Consul shadow-dispatch path against a fixture spec. Assert one `<run_id>-<lane>.json` is written per matching lane with the documented shape, officer findings are recorded, comparison fields are computed.
2. **PRD attack JSON shape.** Mock substrate; trigger Consul Pillar Alpha against a fixture PRD. Assert all four lanes dispatch in parallel, dockets are aggregated into `prd-attack.json`, file is written before deliberation continues. Assert that the dispatch request includes non-empty `claims` and non-empty `evidence_bundle.sources` per the substrate contract (regression-prevention for iteration-1 MISUNDERSTANDING #1).
3. **Officer cold-dispatch invariant — string match.** Assert the officer dispatch prompt does NOT contain the strings `"principales"`, `"Kimi"`, `"shadow"`, `"prd-attack"`, or any docket payload. Catches lexical contamination.
4. **Officer cold-dispatch invariant — semantic diff.** Run two sessions with the same fixture spec, one with `CONSILIUM_PRINCIPALES_SHADOW=on` and one with `=off`; capture the officer dispatch prompts from both runs; assert byte-identical. Catches Domain Knowledge selection drift, context summary drift, and any other indirect path where shadow mode's existence shapes officer input. (Per iteration-1 Provocator and Censor concerns about indirect contamination via doctrine reuse.)

(Tally skill behavior is exercised by an Imperator-driven smoke run after install, not automated.)

### 8. Drift-Check Sync

This case edits **zero** user-scope agent files. The drift-check (`python3 claude/scripts/check-codex-drift.py`) is **not triggered** by this case. The substrate spec recorded a path bug — `claude/CLAUDE.md` Maintenance section references `python3 scripts/check-codex-drift.py` (broken — should be `python3 claude/scripts/check-codex-drift.py`). The integration spec **explicitly does NOT fix that bug** — it is a separate doctrine-fix concern; addressing it here would mix two unrelated changes. Track it as a separate one-line edict.

## Invariants

- **No Kimi output reaches an officer.** Officer dispatch prompts are byte-identical to today's. The cold-dispatch tests (3 and 4) enforce this — string match catches lexical leaks; semantic diff catches indirect contamination via doctrine selection drift.
- **Domain-Knowledge Independence.** Domain-knowledge excerpts pre-loaded for officer dispatch are selected without knowledge of which Kimi lanes will fire. Shadow dispatch may use a superset of the officer's doctrine selection, never a subset; if shadow dispatch needs additional doctrine, it loads that doctrine independently — it does not back-propagate. Sanity test 4 enforces this via diff against a `CONSILIUM_PRINCIPALES_SHADOW=off` control run.
- **No silent Kimi MISUNDERSTANDING.** The substrate's `requires_officer_review=true` flag triggers the end-of-dispatch shadow alarm sidebar to the Imperator. The flag is honored; the consumer in v1 shadow mode is the Imperator-facing alarm, not the officer.
- **No Codex amendment.** The Independence Rule text remains untouched.
- **No officer prompt amendment.** All seven user-scope agent files at `~/.claude/agents/consilium-*.md` are byte-identical to today's. Drift-check runs clean.
- **Shadow data is isolated per case and per-dispatch.** Per-dispatch sub-files in `docs/cases/<slug>/principales-shadow/`. No global mutable state. No writer-writer races.
- **Tally is read-only with respect to dispatch records.** Imperator tags live in a separate sidecar (`principales-shadow-tags.json`), never touching the dispatch JSON files. Eliminates reader-writer races.
- **PRD pre-attack output feeds Consul, not officers.** Direct contamination of officer judgment via dispatch is impossible; indirect contamination via Consul cognition (Consul reading PRD critique, then writing the officer brief) is acknowledged and accepted in v1.
- **Indirect contamination acknowledged.** Pillar Alpha's PRD critique shapes the Consul's framing during deliberation, which then shapes the officer brief downstream. The Codex Independence Rule is preserved at the dispatch boundary; it is partially bypassed at the Consul-cognition boundary. Accepted because the alternative (shadowing Pillar Alpha too) would be data-thin while Pillar Beta gathers measurement signal. The promotion case will revisit if the indirection produces measurable harm.
- **No Imperator-mediated cross-case contamination.** The Imperator does NOT relay shadow Kimi findings into the Consul's deliberation on a sibling case. Shadow data informs the promotion-case decision only. The Consul writes specs in ignorance of which Kimi lanes "work." This is a behavioral discipline relying on the Imperator's vigilance; it cannot be enforced structurally.
- **Opt-out is per-pillar via env var.** Imperator can disable Pillar Alpha or Pillar Beta independently without uninstalling the MCP.
- **Substrate is unchanged.** This case modifies skills and adds doctrine; the MCP server code itself is not edited. Lane prompt maturation is a content edit to the prompt files.

## Hard Scope Constraints

- **No Codex amendment.** The Independence Rule stays as written.
- **No officer prompt amendments.** No "Using Principales" sections.
- **No automated promotion.** `/principales-tally` is read-only with Imperator tagging; no automation flips a lane from shadow to active.
- **No mid-case shadow-data review by Consul.** The Imperator sees Kimi's work via `/principales-tally` AND end-of-dispatch shadow alarms. The Consul does not consume shadow data from prior cases when writing a new spec. (Operational; relies on Consul's pre-spec discipline of NOT walking `principales-shadow/` directories during deliberation.)
- **No Tribunus shadow.** Mini-checkit per task is patrol-depth.
- **No tribune (Medicus) shadow.** Phase 6 dispatch deferred to substrate v2.
- **No march Campaign Review shadow.** march has no triad dispatch site.
- **No best-of-N within shadow.** One Kimi dispatch per matching lane.
- **No new MCP tools.** Substrate's existing `mcp__principales__verify_lane`, `health`, `mode` are sufficient.
- **No PRD-attack feeding officers directly.** Pillar Alpha output goes to Consul deliberation only; indirect contamination acknowledged in Invariants.
- **No cross-fire of spec-lanes onto plan dispatches** in v1. lanes.md grouping is honored.

## Open Architectural Decisions Resolved

> **Confidence: High** unless noted.

1. **v1 is shadow mode for verifiers + face-value PRD pre-attack.** Imperator confirmed.
2. **Pillar Alpha uses Principales properly.** Imperator confirmed iteration-2 — claim extraction + lane-specific evidence assembly is the dispatcher's responsibility per substrate contract.
3. **Pillar Beta uses section-level claims with lane-specific evidence.** Imperator confirmed iteration-2.
4. **Lane mapping is officer-by-artifact.** Censor spec lanes, Praetor plan lanes, Provocator both. Tribunus, tribune, march excluded.
5. **Side-log uses per-dispatch sub-files.** Per Provocator iteration-1 race finding.
6. **PRD source is Linear (URL or ID) or pasted body.** Try-and-catch on `mcp__linear-server__get_issue`; paste fallback otherwise.
7. **N for promotion is Imperator-judged.** No fixed threshold.
8. **Self-play deferred to substrate v2.**
9. **Test writing deferred to a sibling Legion case.**
10. **Comparison logic is intentionally loose v1, but tally exposes both `naive_overlap_score` and `requires_human_review_count`.** Per Provocator iteration-1 confirmation-bias concern.
11. **Imperator tagging in `/principales-tally` is the only manual signal in v1.**
12. **Drift-check NOT triggered.** No agent file edits.
13. **`CONSILIUM_VERIFICATION_MODE` left at `classic`.** Reserved for promotion case.
14. **PRD docket findings handled per Codex** (MISUNDERSTANDING halts; GAP surfaces to Imperator as deliberation question; CONCERN absorbs; SOUND audits). Per Censor iteration-1 GAP.
15. **Shadow Kimi MISUNDERSTANDINGs surface as end-of-dispatch alarm** (not silent JSON-only). Per Censor iteration-1 GAP.
16. **Domain-Knowledge Independence enforced by sanity test 4** (semantic diff vs control run). Per Provocator iteration-1 GAP.
17. **march excluded from Campaign Review shadow** — no triad dispatch site exists. Per Custos iteration-1 GAP.
18. **MCP server restart required** between lane prompt land and smoke test. Per Custos iteration-1 GAP — substrate reads `prompts/*.md` only at process spawn (`server.ts:77-88`).
19. **Lane prompt maturation has 4 edit classes per stub** (Forbidden Behavior, schema example fields, Lane-Def-vs-Forbidden-Behavior reconciliation, profile correction). Per Provocator iteration-1 GAP, sized at 2x iteration-1 estimate.

## Rollout

1. Land the implementation plan with all 13 lane prompts written and the four sanity tests passing.
2. Edit `consul/SKILL.md`, `edicts/SKILL.md`, and `legion/SKILL.md` for shadow-mode dispatch and Pillar Alpha invocation. (NOT march.)
3. Add the two new env vars to the existing `consilium-principales.env` block in `~/.claude/settings.json`.
4. Write `claude/skills/references/verification/principales-shadow.md` doctrine and `claude/skills/principales-tally/SKILL.md` skill. Update `claude/CLAUDE.md` Commands section to include `/principales-tally`. Update plugin manifest if applicable.
5. **Restart the principales MCP process** (kill running `consilium-principales`; new Claude Code session re-spawns with new lanes available). The substrate reads `prompts/*.md` only at process spawn.
6. Imperator runs the next real case end-to-end. Confirms `prd-attack.json` is written; confirms per-dispatch sub-files are written under `principales-shadow/`; confirms `/principales-tally` reads them; confirms officer dispatch prompts are byte-identical to a control run with shadow off (sanity test 4).
7. Shadow data accumulates per case. Imperator reviews via `/principales-tally` at his cadence.
8. After the Imperator has enough signal (his judgment, no fixed N), open a sibling case for the promotion architecture — informed by data rather than assumption.

## Verification Expectations

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions, Linear MCP fallback wiring, MCP-restart in ordering, per-dispatch sub-file write strategy, sanity test 4 fixture design) and `consilium-provocator` (failure modes — what happens if a Kimi lane returns a docket the comparison logic can't parse? what happens if the per-dispatch sub-file directory doesn't exist? what happens if the Imperator runs `/principales-tally` against a case with no shadow data?) in parallel before /march or /legion executes it.

The plan must include:
- Vitest configured for the four integration tests at `claude/mcps/principales/test/integration/`.
- A `consilium-custos` field-readiness walk on the plan to verify env var declarations, file paths, Linear MCP availability check wiring, MCP restart in ordering, sanity test 4 control-run fixture wiring, and per-dispatch sub-file directory creation.
- A clear ordering guarantee: lane prompts mature → MCP restart → skill modifications → env var changes → smoke test. Skill modifications must not ship pointing at unwritten lane prompts.

## Future Scope

Six follow-on cases anticipated, in rough order of likely sequencing:

1. **Promotion case (post-shadow data).** After Imperator has shadow data on a meaningful number of cases, write the spec for promoting one or more Kimi lanes from shadow to active. Choose architecture (Officer-as-Centurion via Codex amendment, Pre-Officer Pass with brief-before-docket sequencing, or hybrid) based on data. This case resolves the deferred MISUNDERSTANDING #1 from the substrate spec, with evidence in hand.
2. **Substrate v2: Adversarial Self-Play.** Lane profile that runs flip-and-reseed automatically. Imperator's idea.
3. **Kimi-Soldier for Test Writing.** Legion/March integration. Imperator's idea.
4. **Substrate Mode B (host-side tools).** Repo-grounded lanes.
5. **Diagnosis lanes (Tribune/Medicus side).** Substrate-deferred. Phase 6 shadow integration with diagnosis-family lanes enabled.
6. **Lane expansion + cross-fire decisions.** Codebase / types / api / quality / medusa-* lanes, plus deciding whether spec-lanes cross-fire onto plan dispatches.

## What This Spec Is NOT

It is not an architecture for using Kimi to reduce verification revisions. It is the *measurement infrastructure* for that architecture. The architecture comes after we know what Kimi can do.

The Imperator's "1-and-done" goal is not abandoned. It is acknowledged as currently unmeasurable. v1 makes it measurable. The architecture that hits the goal will be designed in the promotion case, with data, and by a Consul who will not have to argue from assumption.
