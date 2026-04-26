# 2026-04-26-kimi-principales-integration — Spec (Shadow-Mode v1)

## Goal

Wire the shipped Kimi Principales MCP substrate into the Consilium dispatch flow as a **shadow-mode observability layer**, so we accumulate real per-case data on Kimi's verification quality before committing to any architecture that lets Kimi shape officer judgment. Ship one face-value Consul-side helper (PRD Pre-Attack) at the same time, because PRD attack does not face the contamination problem and is high-value at low risk.

This case answers a measurement question, not an architectural one. The architectural question — *should Kimi feed officers, become officer-tools, or be promoted to a pre-officer pass* — is deferred to a sibling case after shadow data lands.

## Source

- Substrate spec: `docs/cases/2026-04-26-kimi-principales-v1/spec.md`. Substrate ships dormant; this case wires it.
- Substrate next-session-notes: `docs/cases/2026-04-26-kimi-principales-v1/next-session-notes.md`. The deferred MISUNDERSTANDING #1 (Independence Rule corruption) is **dissolved** by shadow mode — Kimi never reaches officers, no fifth input class exists. Other deferred concerns are addressed inline below or noted as deferred-still.
- Reference plan: `/Volumes/Samsung SSD/Downloads/consilium_kimi_principales_implementation_plan.md`. Sections 10 (officer prompt amendments) and 14 (lane routing matrix) are NOT adopted in v1 — they assume Kimi shapes officer judgment, which shadow mode rejects.
- Imperator brief and Consul/counter-Consul (Quintus Adversarius) brainstorm of 2026-04-26 — captured in this spec's Background and Architecture sections.

## Background

The Consilium today bills 3-5 verification revisions per spec or plan. The Imperator wants 1-and-done. The substrate ships a cheap Kimi MCP (`mcp__principales__verify_lane`) that returns validated `principalis_docket.v1` JSON; it costs roughly one-sixth of an Opus officer dispatch.

The temptation is to plug Kimi into officer judgment immediately — pre-officer passes, officer-as-centurion topology, docket-as-evidence framing. Each of those requires a Codex amendment to the Independence Rule and an officer-prompt amendment binding officers to validate-before-adopting. Both are doable. **Neither is justifiable until we know whether Kimi's verdicts are worth the doctrinal cost.**

The Imperator's instinct, surfaced late in deliberation: ship Kimi *strictly additive* to officers first. Run Kimi lanes in parallel to the existing officers. Keep a tally — did Kimi catch the same GAPs? Different ones? Faster? Cheaper? After enough cases, the data dictates the next move; until then, no architectural commitment.

This is shadow deployment, the same pattern engineering teams use for risky production changes. v1 is observation-only on the verifier surface. The Imperator gets the data before the bet.

PRD Pre-Attack is separable. It runs at L1 (Consul-dispatched, before deliberation), feeds Consul, never reaches officers, has no contamination surface. It addresses the highest-leverage source of revisions — PRD-level ambiguity that propagates into spec-level ambiguity that officers catch three rounds later. Worth shipping at face value alongside shadow mode.

## Architecture

### The Three Layers

> **Confidence: High** — Imperator's selection.

| Layer | Role | What changes in v1 |
|-|-|-|
| L1 | Consul / Legatus (main flow) | Pillar Alpha (PRD Pre-Attack) added. Shadow-mode dispatch of Kimi lanes alongside officer dispatch. |
| L2 | Officer-Centurions (Censor, Praetor, Provocator) | Untouched. No prompt amendment, no behavior change. They do not know Kimi ran. |
| L3 | Kimi Principales | Substrate already shipped. Lane prompts matured in this case. |

### The Two Pillars

> **Confidence: High** — both confirmed by Imperator.

#### Pillar Alpha — PRD Pre-Attack at L1 (face-value)

Before Consul deliberation begins (Phase 1 reconnaissance), Consul invokes a four-lane Kimi swarm against the Imperator's PRD. Output is a structured PRD critique that Consul reads, surfaces ambiguities to Imperator, and uses to open deliberation with sharper questions.

- **Lanes (4):** `prd-ambiguity` (vague statements, undefined terms), `prd-edge-cases` (unhandled cases), `prd-unstated-assumptions` (preconditions and dependencies the PRD relies on without naming), `prd-doctrine-alignment` (PRD vs. Codex / `$CONSILIUM_DOCS/doctrine/` for conflicts).
- **PRD source:** Imperator passes a Linear identifier (project URL, issue URL, or issue ID) OR pastes the PRD body verbatim. v1 supports both; if Linear MCP is authenticated and reachable, Consul fetches the PRD via Linear MCP; otherwise Consul asks Imperator to paste.
- **Independence:** Pillar Alpha output is consumed by Consul (the producer), not by any officer-verifier. The Codex Independence Rule applies to officer dispatch, not to Consul deliberation inputs. No amendment required.
- **Opt-out:** Imperator can wave it off per case ("skip pre-attack"). Default is "fire" once `CONSILIUM_PRINCIPALES_PRD_ATTACK=on` (env var, defaults `on` after v1 ships).
- **Cost ceiling:** capped at the substrate's `CONSILIUM_KIMI_SESSION_BUDGET_USD` ($5 default).

#### Pillar Beta — Shadow Mode for Verifiers

When the Consul (or Edicts, or Legion's Campaign review) dispatches officers, the same dispatching skill ALSO fires the matching Kimi lanes in parallel.

- **Officer dispatch is unchanged.** Censor, Praetor, Provocator receive the same prompt skeleton, the same four input classes, the same instructions. They do not know Kimi ran.
- **Kimi lane dispatch fires concurrently** via `mcp__principales__verify_lane`, one call per matching lane.
- **Lane mapping** uses the substrate-shipped lane registry (see "Lane Mapping" below).
- **Officer verdicts are the only authoritative output.** Consul handles them per Codex (MISUNDERSTANDING escalates, GAP fixes, CONCERN considers, SOUND notes). The flow is unchanged.
- **Kimi dockets are written to a side-log JSON file**, never shown to officers, never used to modify the spec or plan. The side-log is named `principales-shadow.json` (see "Tally Storage" below).
- **No Codex amendment.** Kimi never feeds officer judgment, so no fifth input class enters the Independence Rule's domain.
- **No officer prompt amendment.** Officer agent files at `~/.claude/agents/consilium-{censor,praetor,provocator}.md` are unchanged; the drift-check parity is preserved.

### What This Defers to Future Cases

- **Promotion of any Kimi lane to officer-tool, pre-pass, or post-pass.** Decided per-lane after shadow data accumulates. Promotion is its own case with the data attached.
- **Codex amendment to Independence Rule.** Not needed in v1.
- **Officer prompt amendments.** Not needed in v1.
- **Adversarial self-play (flip-and-reseed).** Imperator's idea; deferred to a substrate v2 case as a lane profile, not baked into v1 lane prompts.
- **Kimi as Test Writer.** Legion/March integration; separate case.
- **Diagnosis lanes (Tribune side).** Out of scope per substrate deferral.
- **Mode B (host-side repo-grounded tools).** Out of scope per substrate deferral.
- **Best-of-N orchestration.** Out of scope per substrate deferral.

## What's Needed

### 1. Lane Prompt Maturation

The substrate shipped one fully-written reference lane prompt (`upstream-coverage.md`) and nine stubs. Shadow mode is only as informative as the lane prompts. v1 matures all of them and adds four new PRD pre-attack lanes.

**Existing lane prompts to mature** (`claude/mcps/principales/prompts/`):

The substrate shipped these 10 prompts. `upstream-coverage.md` is fully production-shaped. The other 9 are **partial stubs** — they have correct lane-specific Lane Definition sections (verdict guidance fits the lane) but inherited generic Forbidden Behavior text from `upstream-coverage` (notably "quote BOTH the artifact AND the evidence source," which is wrong for lanes whose `evidence_required` is `artifact`-only). v1 work: write lane-specific Forbidden Behavior text for each, leave Lane Definition and structural slots intact.

| Lane | Officer surface | Status today |
|-|-|-|
| `upstream-coverage.md` | Censor (spec) | Mature — keep |
| `ambiguity-audit.md` | Censor (spec) | Partial — fix Forbidden Behavior |
| `confidence-map-sanity.md` | Censor (spec) | Partial — fix Forbidden Behavior |
| `contradiction-hunt.md` | Provocator (spec) | Partial — fix Forbidden Behavior |
| `edge-case-attack.md` | Provocator (spec) | Partial — fix Forbidden Behavior |
| `task-ordering.md` | Praetor (plan) | Partial — fix Forbidden Behavior |
| `undefined-references.md` | Praetor (plan) | Partial — fix Forbidden Behavior |
| `test-command-plausibility.md` | Praetor (plan) | Partial — fix Forbidden Behavior |
| `literal-execution-failure.md` | Praetor (plan) | Partial — fix Forbidden Behavior |
| `migration-risk.md` | Provocator (plan) | Partial — fix Forbidden Behavior |

**New PRD pre-attack lane prompts** (`claude/mcps/principales/prompts/`):

| Lane | Purpose |
|-|-|
| `prd-ambiguity.md` | Identify vague statements, undefined terms, statements that can be read two ways |
| `prd-edge-cases.md` | Identify cases the PRD does not cover (empty input, error paths, concurrency, scale) |
| `prd-unstated-assumptions.md` | Identify preconditions and dependencies the PRD relies on without naming them |
| `prd-doctrine-alignment.md` | Cross-check PRD against Codex sections and `$CONSILIUM_DOCS/doctrine/` for conflicts |

**Each prompt follows the substrate's documented prompt format** (see `claude/mcps/principales/prompts/upstream-coverage.md` as the reference): lane definition + sterile-clerk reminder + forbidden behaviors specific to the lane + claim bundle slot + evidence packet slot + output schema reference + escalation rule + vocabulary-collision discipline.

**Lane registry update:** the substrate's `claude/skills/references/verification/lanes.md` (verified to live at this path) is amended to add the four new `prd-*` lane entries with appropriate metadata (`family: artifact-text`, `default_profile: principalis_light`, `evidence_required: artifact`, `tools: []`, `kimi_sound_final: false`, `enabled: true`). Existing lanes are already `enabled: true` per substrate.

### 2. Skill Modifications

#### `claude/skills/consul/SKILL.md`

Two amendments:

**Phase 1 (Reconnaissance) addition — Pillar Alpha.** After resolving `$CONSILIUM_DOCS` and reading domain doctrine, before dispatching codebase scouts:

```markdown
**PRD Pre-Attack (Pillar Alpha).** When the Imperator's request references a Linear PRD (project URL, issue URL, or issue ID), or attaches a pasted PRD body, dispatch a four-lane Kimi pre-attack via `mcp__principales__verify_lane`:
- `prd-ambiguity`, `prd-edge-cases`, `prd-unstated-assumptions`, `prd-doctrine-alignment`

Each lane receives the PRD body as `artifact_slice`, an empty `evidence_bundle.sources` array (the PRD is its own evidence), and the appropriate lane prompt. Dispatches run in parallel.

The dockets surface as a structured PRD critique. Read it; absorb the genuine concerns; open deliberation with the Imperator on the items the critique surfaced as ambiguous, unstated, or out of doctrine. Do NOT silently absorb — the critique is conversational fuel, not an answer.

Skip when: the Imperator says "skip pre-attack," the request has no PRD (purely conversational invocation), or `CONSILIUM_PRINCIPALES_PRD_ATTACK=off`.

The PRD critique is written to `docs/cases/<slug>/prd-attack.json` for audit.
```

**Phase 3 (Codification) addition — Shadow Mode dispatch.** In the existing "I dispatch verification" section, add:

```markdown
**Shadow Mode (Pillar Beta).** When dispatching Censor + Provocator for spec verification, ALSO fire the matching Kimi lanes in parallel via `mcp__principales__verify_lane`. The lanes are determined by the lane mapping table (see `claude/skills/references/verification/principales-shadow.md`).

Officer dispatches and Kimi dispatches fire in the same step, all `run_in_background: true`. Officer verdicts are the only authoritative output and are processed per the Codex auto-feed loop.

Kimi dockets are appended to `docs/cases/<slug>/principales-shadow.json` (see "Tally Storage" below). They are NOT shown to officers, NOT used to modify the spec, NOT presented to the Imperator inline. The Imperator reviews via `/principales-tally`.

Skip when: `CONSILIUM_PRINCIPALES_SHADOW=off`.
```

#### `claude/skills/edicts/SKILL.md`

One amendment, structurally identical to Consul's Phase 3 addition: when dispatching Praetor + Provocator for plan verification, also fire matching Kimi lanes (plan-side: `task-ordering`, `undefined-references`, `test-command-plausibility`, `literal-execution-failure`, `migration-risk`, plus Provocator's adversarial spec lanes if applicable). Side-log to the same case directory's `principales-shadow.json`.

#### `claude/skills/legion/SKILL.md` and `claude/skills/march/SKILL.md`

Campaign Review (Censor + Praetor + Provocator parallel dispatch at end of execution) is invoked by both skills (verified at `legion/SKILL.md:248`; march delegates a similar pattern). Add the same shadow-mode dispatch step at the Campaign Review dispatch site: when firing the triad, also fire the corresponding Kimi lanes per the lane mapping table (Censor lanes + Praetor lanes + Provocator lanes — the union for a Campaign sweep). Side-log to `principales-shadow.json` in the same case directory.

The per-task Tribunus mini-checkit dispatch is **excluded** from shadow mode (see Lane mapping table — Tribunus row).

### 3. New Doctrine File

**`claude/skills/references/verification/principales-shadow.md`** — sibling of `principales.md` (sterile-clerk doctrine). Defines:

- The lane-to-officer mapping (table below).
- The shadow-mode dispatch contract (officer + Kimi fire in parallel, Kimi never feeds officer).
- The side-log JSON shape (see "Tally Storage" below).
- The opt-out env vars.
- The Imperator review surface (`/principales-tally`).

**Lane mapping table** (lives in `principales-shadow.md`):

| Officer + artifact | Matching Kimi lanes |
|-|-|
| Censor on spec | `upstream-coverage`, `ambiguity-audit`, `confidence-map-sanity` |
| Provocator on spec | `contradiction-hunt`, `edge-case-attack` |
| Praetor on plan | `task-ordering`, `undefined-references`, `test-command-plausibility`, `literal-execution-failure`, `migration-risk` |
| Provocator on plan | `contradiction-hunt`, `edge-case-attack`, `migration-risk` |
| Campaign review (Censor) | All Censor spec lanes |
| Campaign review (Praetor) | All Praetor plan lanes |
| Campaign review (Provocator) | All Provocator lanes |
| Tribunus (mini-checkit, per task) | None in v1 — Tribunus is patrol-depth and per-task; shadow mode here would 30x dispatch volume. Defer to a sibling case if data warrants. |

### 4. Tally Storage

Per-case JSON files. No central database. The aggregate `/principales-tally` skill walks all case directories and aggregates on demand.

**Location:** `docs/cases/<slug>/principales-shadow.json` (per case) and `docs/cases/<slug>/prd-attack.json` (per case, only when Pillar Alpha fires).

**`principales-shadow.json` shape:**

```json
{
  "case_slug": "2026-04-26-example",
  "schema_version": 1,
  "entries": [
    {
      "dispatched_at": "2026-04-26T05:12:00Z",
      "artifact_type": "spec",
      "artifact_path": "docs/cases/2026-04-26-example/spec.md",
      "artifact_sha": "a1b2c3...",
      "officer": {
        "role": "censor",
        "wall_ms": 42000,
        "verdict_summary": {
          "MISUNDERSTANDING": 0,
          "GAP": 2,
          "CONCERN": 1,
          "SOUND": 5
        },
        "findings": [
          { "category": "GAP", "title": "...", "evidence": "..." }
        ]
      },
      "kimi_lanes": [
        {
          "lane": "upstream-coverage",
          "wall_ms": 8200,
          "cost_usd": 0.014,
          "docket_overall": "GAP",
          "verdict_summary": {
            "MISUNDERSTANDING": 0,
            "GAP": 1,
            "CONCERN": 0,
            "SOUND": 4
          },
          "findings": [
            { "status": "GAP", "claim_id": "...", "title": "...", "evidence_locator": "..." }
          ]
        }
      ],
      "comparison": {
        "lane_to_officer_overlap": {
          "upstream-coverage": {
            "officer_findings_matched": 1,
            "officer_findings_missed_by_kimi": 1,
            "kimi_findings_not_in_officer": 0
          }
        }
      }
    }
  ]
}
```

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
      "wall_ms": 7100,
      "cost_usd": 0.012,
      "docket_overall": "CONCERN",
      "findings": [
        { "status": "CONCERN", "title": "...", "evidence_locator": "..." }
      ]
    }
  ],
  "consul_action": "surfaced 3 ambiguities to Imperator; resolved 2 in deliberation; 1 deferred"
}
```

**Comparison computation:** the dispatching skill (Consul / Edicts) computes `lane_to_officer_overlap` after both dispatches return. Algorithm: a Kimi finding "matches" an officer finding if they touch the same artifact section and have the same finding category — match logic is intentionally loose in v1 (string overlap on title or section reference is enough). The intent is rough signal, not precise IR. Refinement is its own future case if v1 is too noisy.

### 5. New Skill — `/principales-tally`

A new user-invocable skill at `claude/skills/principales-tally/SKILL.md`.

**Purpose:** present the shadow-mode comparison data to the Imperator. The Imperator runs `/principales-tally` periodically (he picks the cadence; no fixed N) to decide whether to promote any Kimi lane to a real role.

**Behavior:**

- Walks `docs/cases/*/principales-shadow.json` and `docs/cases/*/prd-attack.json`.
- Aggregates by lane: total dispatches, total cost, mean wall time, mean officer-overlap %, count of officer-only findings, count of Kimi-only findings, count of disagreements where Kimi caught a real issue officers missed (Imperator-tagged), count of disagreements where Kimi was wrong (Imperator-tagged).
- Renders a summary table to the Imperator.
- Offers per-lane drill-down: the Imperator can ask "show me the Kimi-only findings for upstream-coverage" and the skill prints them with full chain of evidence.
- Offers Imperator tagging: the Imperator can mark individual Kimi findings as "Kimi was right (officer missed)" or "Kimi was wrong (false positive)" — the tag persists in the per-case JSON.

**No automated promotion logic in v1.** The skill is read-only with optional Imperator-tagging. Promotion decisions are spec-level work in a sibling case.

### 6. Configuration

Two new env vars in the principales MCP env block (additive to substrate's existing block in `~/.claude/settings.json`):

```json
{
  "CONSILIUM_PRINCIPALES_PRD_ATTACK": "on",
  "CONSILIUM_PRINCIPALES_SHADOW": "on"
}
```

Both default to `on` after v1 ships. Imperator can flip either to `off` to disable that pillar without uninstalling the MCP. The substrate's `CONSILIUM_VERIFICATION_MODE` env var is **left at `classic`** in v1 — its semantics are reserved for the post-shadow promotion case.

### 7. Sanity Tests

Three tests gate v1. Test runner is **vitest** per substrate convention. Tests live at `claude/mcps/principales/test/integration/`.

1. **Shadow JSON shape.** Mock the substrate to return a known docket. Trigger the Consul shadow-dispatch path against a fixture spec. Assert `principales-shadow.json` is written with the documented shape, the entry is appended (not overwritten on second dispatch), and officer findings are recorded.
2. **PRD attack JSON shape.** Same pattern for `prd-attack.json`. Assert all four lanes are dispatched in parallel, dockets are aggregated into the file, and the file is written before deliberation continues.
3. **Officer cold-dispatch invariant.** Assert that the officer dispatch prompt does NOT contain the phrase "principales", "Kimi", "shadow", or any docket payload. Officer prompts must be byte-identical to today's prompts when shadow mode fires. This is the contamination-prevention invariant; if it ever fails, contamination has been re-introduced silently.

(Tally skill behavior is exercised by an Imperator-driven smoke run after install, not automated.)

### 8. Drift-Check Sync

This case edits **zero** user-scope agent files. The drift-check (`python3 claude/scripts/check-codex-drift.py`) is **not triggered** by this case. The substrate spec recorded a path bug — the `claude/CLAUDE.md` Maintenance section references `python3 scripts/check-codex-drift.py` (broken — should be `python3 claude/scripts/check-codex-drift.py`). The integration spec **explicitly does NOT fix that bug** — it is a separate doctrine-fix concern surfaced by the substrate's verification round; addressing it here would mix two unrelated changes. Track it as a separate one-line edict.

## Invariants

- **No Kimi output reaches an officer.** Officer dispatch prompts are byte-identical to today's. The cold-dispatch test enforces this.
- **No Codex amendment.** The Independence Rule text remains untouched.
- **No officer prompt amendment.** All seven user-scope agent files at `~/.claude/agents/consilium-*.md` are byte-identical to today's. Drift-check runs clean.
- **Shadow data is isolated per case.** Per-case JSON in the case dir; no global mutable state.
- **PRD pre-attack output feeds Consul, not officers.** Consul absorbs the critique into deliberation; officers receive the spec cold per current protocol.
- **Opt-out is per-pillar via env var.** Imperator can disable Pillar Alpha or Pillar Beta independently without uninstalling the MCP.
- **Substrate is unchanged.** This case modifies skills and adds doctrine; the MCP server code itself is not edited. Lane prompt maturation is a content edit to the prompt files, not a code change.

## Hard Scope Constraints

- **No Codex amendment.** The Independence Rule stays as written.
- **No officer prompt amendments.** No "Using Principales" sections, no validate-before-adopting clauses, no docket consumption discipline.
- **No automated promotion.** `/principales-tally` is read-only with Imperator tagging; no automation flips a lane from shadow to active.
- **No mid-case shadow review.** The Imperator sees Kimi's work via `/principales-tally`, not inline during dispatch. The dispatching skill writes the side-log silently.
- **No Tribunus shadow.** Mini-checkit per task is patrol-depth; shadow mode there would inflate dispatch volume by ~30x with low signal.
- **No best-of-N within shadow.** One Kimi dispatch per matching lane. Substrate does not support best-of-N anyway.
- **No new MCP tools.** The substrate's existing `mcp__principales__verify_lane`, `health`, `mode` are sufficient. No new server-side endpoints.
- **No PRD-attack feeding officers.** Pillar Alpha output goes to Consul deliberation only. Officers do not see the PRD critique.

## Open Architectural Decisions Resolved

> **Confidence: High** unless noted.

1. **v1 is shadow mode for verifiers + face-value PRD pre-attack.** Imperator confirmed.
2. **Lane mapping is officer-by-artifact.** Censor spec lanes, Praetor plan lanes, Provocator both, Campaign review the union. Tribunus excluded.
3. **Side-log lives in the case directory.** Per-case JSON; aggregate via `/principales-tally` walking `docs/cases/*/principales-shadow.json`.
4. **PRD source is Linear (URL or ID) or pasted body.** Linear MCP fetched if reachable; paste fallback otherwise.
5. **N for promotion is Imperator-judged.** No fixed threshold.
6. **Self-play is deferred to substrate v2.** Not in v1 lane prompts.
7. **Test writing is deferred to a sibling Legion case.** Not in this scope.
8. **Comparison logic in v1 is intentionally loose.** Title / section overlap is enough; precise matching is a future case if v1 is too noisy.
9. **Imperator tagging in `/principales-tally` is the only manual signal in v1.** No automated agreement scoring beyond the rough overlap.
10. **Drift-check NOT triggered.** No agent file edits in v1.
11. **`CONSILIUM_VERIFICATION_MODE` left at `classic`.** Reserved for the post-shadow promotion case.

## Rollout

1. Land the implementation plan with all 13 lane prompts written and the three sanity tests passing.
2. Edit `consul/SKILL.md`, `edicts/SKILL.md`, and (verified per implementation) the legion/march skills for shadow-mode dispatch and Pillar Alpha invocation.
3. Add the two new env vars to `~/.claude/settings.json`'s principales MCP block.
4. Write `claude/skills/principales-shadow.md` doctrine and `claude/skills/principales-tally/SKILL.md`.
5. Imperator runs the next real case end-to-end. Confirms `principales-shadow.json` and `prd-attack.json` are written. Confirms `/principales-tally` reads them. Confirms officer dispatch prompts are unchanged (cold-dispatch invariant test).
6. Shadow data accumulates per case. Imperator reviews via `/principales-tally` at his cadence.
7. After the Imperator has enough signal (his judgment, no fixed N), open a sibling case for the promotion architecture — likely a variant of the cut Pillar Beta (Officer-Centurion) or Pillar D (Pre-Officer Pass) from the brainstorm, but informed by data rather than assumption.

## Verification Expectations

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions, Linear MCP availability fallback) and `consilium-provocator` (failure modes — what happens if Kimi MCP is down? if the case dir is missing? if two parallel dispatches race on the same JSON file?) in parallel before /march or /legion executes it.

The plan must include:
- Vitest configured for the three integration tests at `claude/mcps/principales/test/integration/`.
- A `consilium-custos` field-readiness walk on the plan to verify env var declarations, file paths, Linear MCP availability check, and the cold-dispatch invariant test wiring.
- A clear ordering guarantee: lane prompts mature BEFORE skill modifications BEFORE env var changes BEFORE smoke test. Skill modifications must not ship pointing at unwritten lane prompts.

The spec itself should be verified by `consilium-censor` (truth against Codex/doctrine — especially the Independence Rule preservation claim), `consilium-provocator` (adversarial — what's the worst contamination-leak we haven't named?), and `consilium-custos` (dispatch-readiness — env vars, file paths, cross-references) in parallel.

## Future Scope

Six follow-on cases are anticipated, in rough order of likely sequencing:

1. **Promotion case (post-shadow data).** After the Imperator has shadow data on a meaningful number of cases, write the spec for promoting one or more Kimi lanes from shadow to active. Choose the architecture (Officer-as-Centurion via Codex amendment, Pre-Officer Pass with brief-before-docket sequencing, or some hybrid) based on the data. This is the case that resolves the deferred MISUNDERSTANDING #1 from the substrate spec, with evidence in hand.
2. **Substrate v2: Adversarial Self-Play.** Lane profile that runs flip-and-reseed automatically. Imperator's idea, surfaced during this brainstorm.
3. **Kimi-Soldier for Test Writing.** Legion/March integration. Bounded subtask (test writing) routed to Kimi at execution time. Imperator's idea.
4. **Substrate Mode B (host-side tools).** Substrate-deferred. Repo-grounded lanes.
5. **Diagnosis lanes (Tribune side).** Substrate-deferred. Medicus integration.
6. **Lane expansion.** Codebase / types / api / quality / medusa-* lanes for /checkit-style coverage. Likely sequenced after promotion case so we know what works.

## What This Spec Is NOT

It is not an architecture for using Kimi to reduce verification revisions. It is the *measurement infrastructure* for that architecture. The architecture comes after we know what Kimi can do.

The Imperator's "1-and-done" goal is not abandoned. It is acknowledged as currently unmeasurable. v1 makes it measurable. The architecture that hits the goal will be designed in the promotion case, with data, and by a Consul who will not have to argue from assumption.
