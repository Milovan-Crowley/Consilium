# Tribune Persistent + Principales Adaptive Dispatch (B-1)

**Status:** spec draft 3 — pending verification
**Author:** Publius Auctor
**Date:** 2026-04-26
**Track:** Principales Integration Roadmap, B-1 of B-1 through B-5

## 1. Summary

Make the Tribunus-on-Legion role persistent across plan execution and adaptive in dispatching principales (Moonshot Kimi) lanes for per-task verification. Tribunus (not Legatus) owns verification design from cradle to grave: a pre-flight design phase produces a per-task verification protocol that leaves Consul's hand alongside the plan; a Legion-time persistent-executor runs the protocol with sticky cross-task context, with persistence bounded at 15 tasks per Tribunus-executor instance to prevent context degradation.

Each principales lane uses a model profile matched to its cognitive lift (`principalis_light` k2.5 non-thinking for trivial text comparison; `principalis_adversarial` k2.6 non-thinking for doctrine-against-code reasoning). The Tribunus is the judge of deviation; principales return yes/no per claim. Deviation-as-Improvement assessment is Tribunus-Claude-side judgment over flagged dockets, not a separate lane.

This case generates the empirical dataset that B-2 (shadow Kimi for spec/plan verifiers) will be specified from. Two prior `kimi-principales-integration` attempts halted on iteration 2 because they tried to design integration without empirical grounding. This case satisfies the Imperator's `next-session-notes.md` mandate by *generating* that data while solving cost and drift problems in production.

## 2. Background

The Consilium currently spawns a fresh ephemeral Tribunus subagent for each task during Legion execution. The current Tribunus has an integration-check axis built into its persona, but it carries **no sticky cross-task context** — it relies on the Legatus to surface prior-task changes in the dispatch prompt. For long plans this is brittle: the Legatus may forget which prior tasks touched the same surface, leading to integration-check misses. For a 30-task plan, ephemeral Tribunus also produces 30 cold-start Opus calls — repeated context-load tax, all reasoning in expensive Opus.

Two opportunities:

- **Cost.** Moonshot Kimi (~1/6 Opus cost) is well-suited to lane-shaped verification — bounded scope, evidence-anchored claims, structured docket output. Per-lane model stratification matches profile cost to lane difficulty: trivial text-pattern lanes use `principalis_light` (k2.5 non-thinking); harder doctrine-against-code lanes use `principalis_adversarial` (k2.6 non-thinking). The principales MCP substrate is built and dormant.
- **Quality.** Persistent Tribunus carries plan-wide context within its 15-task lifetime window, surfacing inconsistencies the ephemeral model cannot see (e.g., task 14 silently breaking task 3's exposed interface). Cross-window drift detection is partial — preserved through `tribune-log.md` digest read at restart — but full intra-window drift detection is the load-bearing improvement.

## 3. Goals

- Move the Tribunus-on-Legion role to a persistent agent with sticky context across all tasks of a single 15-task lifetime window, restarting at the boundary (±2 ergonomic).
- Tribunus owns verification design cradle-to-grave: a pre-flight design phase produces `tribune-protocol.md`; a Legion-time persistent-executor runs it.
- Plan and verification protocol leave Consul's hand together as one artifact bundle through `/edicts`.
- Per-task verification dispatches a Tribunus-design-selected subset of execution-time principales lanes at Moonshot pricing, with model profile stratified by lane difficulty, and Tribunus-Claude-side judgment integrating dockets and applying Deviation-as-Improvement assessment.
- Generate empirical data answering: which lanes does Kimi reliably handle, which need Claude, which surface ensemble value, which model profile (k2.5 vs k2.6) suffices per lane.
- Codex amendment formalizes "Persistent Orchestrator" as a recognized persona class scoped narrowly to in-plan execution-time verification only.
- **Substrate amendment in scope.** Extend `claude/skills/references/verification/lanes.md` family enum to add `execution`. Author four new prompt files in `claude/mcps/principales/prompts/task-*.md`. Restart the principales MCP after prompt files land so the substrate's startup-time prompt-directory scan picks them up.

## 4. Non-goals

- Replacing Censor / Provocator / Praetor with Kimi (Provocator-decompose case and future B-2).
- Building a writing-Kimi MCP (B-4 / B-5).
- Soldier replacement (B-5).
- Promoting any execution lane from shadow to active Kimi-only — that decision waits for the data this case produces.
- Applying persistence to spec-time or plan-time verifiers.
- **`/march` is explicitly excluded.** It is the deliberate ceremony-skip escape hatch for trivial plans where Tribunus per-task verification would be over-engineering. No Tribune layer, no Kimi dispatch under `/march`. It retains its current solo-Legatus semantic.
- **Thinking-mode is explicitly excluded for B-1.** v1 substrate has `CONSILIUM_KIMI_DISABLE_THINKING=true` by default. B-1 lanes use `thinking_allowed=false` aligned with substrate default; per-lane thinking-mode promotion is revisited per B-2 data.

## 5. Constraints

- **Codex Independence Rule preservation for spec/plan verifiers.** Spec-time and plan-time verification remains absolutely independent. The doctrine amendment narrows persistent-orchestrator scope to execution-time only, anchored to architectural property (cross-task context within in-plan execution-time window), not just role-name.
- **15-task lifetime bound.** Tribunus-executor restarts every 15 tasks. The boundary has a ±2 ergonomic window: if the plan ends within 2 tasks of the boundary, the existing Tribunus-executor carries to completion (a 16-task plan uses one Tribunus, not two).
- **`/march` excluded.** Thinking-mode disabled.
- **Tribunus-design dispatches after Custos returns OK TO MARCH** (or after Imperator override of BLOCKER). If Custos returns PATCH BEFORE DISPATCH and the patches modify task structure (additions, removals, reordering), the existing `tribune-protocol.md` is invalidated and Tribunus-design re-runs after the second Custos walk.
- **Existing Tribunus behavior preserved as fallback.** When principales is unavailable, a lane returns `transport_failure`, or the persistent-executor pattern is disabled by configuration, Tribunus-executor falls back to the same Claude-side patrol Tribunus does today.
- **Per-task cost cap (Kimi-side).** Default $0.10/task average over the plan. Tribunus tracks per-task spend from docket cost reports; soft-warns on per-task overrun. Halts only on substrate session-budget breach. Note: `CONSILIUM_KIMI_SESSION_BUDGET_USD` is per-MCP-process, shared across all dispatchers in the same Claude Code session — not strictly per-Legion.
- **No protocol skip in v1.** Every Legion run produces `tribune-protocol.md`.
- **Medicus track untouched.** Tribunus in diagnosis stance is not modified by this case.

## 6. Architecture

Two phases for Tribunus.

### 6.1 Pre-flight Design Phase

After plan verification (Praetor + Provocator) and the Custos walk return OK TO MARCH (or Imperator override of BLOCKER), `/edicts` dispatches Tribunus in **design stance** as the final step before yielding to "The Legion Awaits."

Tribunus-design reads the verified, Custos-blessed plan with a fresh context and writes `tribune-protocol.md` to the case directory. Per task, the protocol specifies which lanes are triggered (subset of the four execution-time lanes), what claims to verify per lane, what evidence sources Tribunus-executor will preload into each `evidence_bundle.sources`, what model profile per lane, and notes for the executor stance.

If Custos returns PATCH BEFORE DISPATCH and the patches modify task structure (additions, removals, reordering), `tribune-protocol.md` is invalidated; Tribunus-design re-runs after the second Custos walk completes.

The Imperator reviews plan and protocol together as one artifact bundle. Approval applies to both. Iteration on the protocol does not require re-running plan authoring.

### 6.2 Legion Execution Phase

`/legion` spawns Tribunus in **persistent-executor stance** at Legion start, naming the agent (e.g., `tribune-w1`) so it is addressable via `SendMessage`. The harness primitive is documented in the Agent tool's `name` parameter — *"Makes it addressable via SendMessage({to: name}) while running"* — and confirmed via direct Imperator demonstration in 2026-04-26 transcript: persistent named-agent dispatch, full context across turns, same agent process not fresh spawn, addressable by name or ID, occasional messages keep the agent warm.

Tribunus-executor receives the protocol and `tribune-log.md` digest at spawn and holds them in context across its 15-task lifetime window.

Per task completion, the Legatus signals Tribunus-executor with task identifier, change-set, files touched, and a brief implementation summary. The Legatus performs no verification construction.

Tribunus-executor responds by preloading per-lane evidence bundles (diff slices, file-content slices, doctrine excerpts where applicable, prior-task interface summaries from `tribune-log.md`) and dispatching the protocol-selected lanes via `mcp__consilium-principales__verify_lane`. Each lane returns a docket with per-claim yes/no findings. Tribunus-executor then:

- Integrates the dockets with its own Claude-side patrol findings — including the cast-laundering / `any`-types-hiding reality checks the Kimi `task-no-stubs` lane does NOT cover (these require Serena symbol tools and remain Claude-side regardless of Kimi lane).
- Applies the Codex's **Deviation-as-Improvement Rule** as judgment over flagged findings: when a lane flags a deviation, Tribunus decides improvement (SOUND-with-note) or drift (FAIL-with-note). Deviation-as-Improvement is judgment work; principales are claim-verifiers, not judges.
- Returns a per-task verdict (PASS / CONCERN / FAIL) with chain-of-evidence citing whether each finding came from a Kimi docket, Claude-side patrol, or judgment integration.

During the experimental phase (§9), Tribunus runs Claude-side patrol on Kimi-covered surfaces for sampled tasks (every 3rd task by plan-index, deterministic across window boundaries). On a sampled task, **Claude-side patrol runs first, before dispatching lanes**, to keep the counterfactual uncontaminated by docket exposure; the integrated verdict and counterfactual verdict are logged separately.

**15-task lifetime mechanics.** At the 15-task boundary (or boundary + ≤2 if the plan ends within the ergonomic window), Legatus sends Tribunus-executor a final "window-complete" SendMessage; Tribunus acknowledges and terminates (going "cold" per the transcript's stays-warm semantic). Legatus then spawns a new Tribunus-executor with fresh context and a new name (`tribune-w2`, etc.). The new instance reads `tribune-protocol.md` and the appended `tribune-log.md` at spawn. On a Tribunus-executor crash mid-window, Legatus respawns at the next task boundary using the same restart pattern. Cross-window context is carried via `tribune-log.md` digest, not in-memory state.

## 7. Components

### 7.1 Tribunus Persona (`consilium-tribunus.md`)

Two new stances added; existing stances preserved.

- **design** — one-shot, pre-flight, writes `tribune-protocol.md` from a verified, Custos-blessed plan
- **persistent-executor** — Legion-time, sticky context, 15-task lifetime, runs the protocol, preloads evidence bundles, dispatches lanes, integrates dockets, applies Deviation-as-Improvement judgment, writes `tribune-log.md`

Existing stances unchanged: **patrol** (current ephemeral, preserved as fallback), **diagnosis** (Medicus track, untouched).

Stance is declared by the dispatcher in the prompt.

**Frontmatter edits required:**
- `tools:` adds `mcp__consilium-principales__verify_lane`, **`Write`** (the design and persistent-executor stances both author artifacts; existing patrol/diagnosis stances are read-only and remain so behaviorally even though the tool is now available).
- `mcpServers:` adds `consilium-principales` (the registered MCP server key in `~/.claude.json`; the bare token `principales` does NOT match any registered server).
- `description:` line edited from *"Read-only with Bash"* to *"Read-only with Bash in patrol/diagnosis stances; writes `tribune-protocol.md` and `tribune-log.md` in design and persistent-executor stances."*

**Persona body doctrine added:** explicit role separation — *"The Tribunus is the judge of deviation. The principales are claim-verifiers. The Tribunus reads dockets, applies the Codex's Deviation-as-Improvement Rule, and renders verdict. Principales return yes/no per claim and never judge."*

**Drift-check coupling.** Per `claude/CLAUDE.md` Maintenance section, the Codex content is copy-pasted into 6 user-scope agent files. After body modifications, the Codex drift-check must run.

### 7.2 Execution-Time Lane Family

Four lanes in a new `family: execution` (registered via §7.5 substrate amendment). Each has distinct trigger surface, evidence-bundle shape, and model profile.

- **`task-plan-match`** — Trigger: plan task entry presence. Evidence shape: plan task body + diff text. `evidence_required: artifact_and_diff`. Profile: `principalis_light` (k2.5 non-thinking). Yes/no claim shape: *"does the diff implement the plan task as written? Are file list and action-clause honored?"*
- **`task-no-stubs`** — Trigger: new function bodies, return values, or handlers in diff. Evidence shape: diff text only (text-pattern detection: TODO, empty handlers, hardcoded mocks, placeholder returns). `evidence_required: diff`. Profile: `principalis_light` (k2.5 non-thinking). Claim shape: *"are TODO comments, empty handlers, hardcoded mocks, placeholder returns present?"* **Claude-side coverage commitment:** Tribunus-executor's Claude-side patrol still runs Serena-anchored detection for `{} as Type` cast laundering and `any`-types-hiding-behind-correct-interfaces on every task — those repo-grounded checks are NOT delegated to Kimi and NOT dropped.
- **`task-domain-correctness`** — Trigger: domain-doctrine-relevant code in diff (Medusa workflow boundary, `link.create` discipline, money-path idempotency, frontend hard rule). Evidence shape: diff slice + relevant doctrine excerpt + prior-pattern reference (preloaded by Tribunus-executor per protocol). `evidence_required: diff_and_doctrine`. Profile: `principalis_adversarial` (k2.6 non-thinking). Claim shape: *"does this implementation respect doctrine X for the surfaces it touches?"*
- **`task-integration-prior`** — Trigger: code interfacing with prior-task interfaces. Evidence shape: diff + prior-task interface summaries from `tribune-log.md` (preloaded). `evidence_required: diff_and_artifact`. Profile: `principalis_adversarial` (k2.6 non-thinking). Claim shape: *"does this task break or conflict with task 1..N-1's exposed interfaces?"*

Each lane's prompt file lives at `claude/mcps/principales/prompts/task-<lane>.md`, shaped after the production-grade `upstream-coverage.md` template, with the four edit classes from `kimi-principales-integration` halt-notes applied (Forbidden Behavior, Output Schema example fields, Lane-Definition vs Forbidden-Behavior reconciliation, profile correction in template metadata).

Each lane registry entry sets `family: execution`, `kimi_sound_final: false`, `thinking_allowed: false`. The `evidence_required` value differs per lane as named above.

**Deviation-as-Improvement is NOT a lane.** It is Tribunus-Claude-side judgment over docket findings flagged by any lane.

### 7.3 `tribune-protocol.md` Artifact

A new artifact in the case directory, alongside `spec.md` and `plan.md`. Structured markdown, parseable by Tribunus-executor at Legion start. Schema:

```
schema_version: 1
plan_id: <case>/plan.md commit-or-hash
sampling_mode: every-3rd-task-by-plan-index  # determines counterfactual cadence
tasks:
  - task_id: <plan task identifier>
    lanes_triggered: [task-plan-match, task-domain-correctness, ...]  # subset of 4
    claims_per_lane:
      task-plan-match: ["claim text 1", "claim text 2"]
      task-domain-correctness: [...]
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "<plan.md>#task-N"}
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "doctrine", path: "<doctrine excerpt path>"}
        - ...
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-domain-correctness: false
    executor_notes: "task touches money path; additional scrutiny on idempotency"
```

Tribunus-design writes the protocol; Tribunus-executor reads it. The `<runtime>` evidence sources are populated by Tribunus-executor at task time. `executor_notes` is free-text in v1 but Tribunus-design SHOULD write structured-discriminator-style notes (e.g., domain-surface flags, additional-scrutiny tags) when applicable to enable later schema-discipline upgrade.

### 7.4 `tribune-log.md` Artifact

A new artifact in the case directory, written by Tribunus-executor as it processes tasks. Append-only; concurrent-write semantics are not addressed in v1 (only one Tribunus-executor instance is alive at any moment per the lifetime model). Schema:

```
schema_version: 1
plan_id: <plan_id from protocol>
window_id: w1, w2, ...  # which Tribunus-executor instance authored this slice
entries:
  - task_id: <id>
    window_id: w1
    verdict: PASS | CONCERN | FAIL
    lanes_fired: [task-plan-match, ...]
    model_profile_per_lane: {...}
    kimi_dockets: [...]  # full content per docket; or refs to docket files
    claude_side_findings: [...]  # findings from Claude-side patrol on uncovered surfaces
    deviation_as_improvement_notes: "..."  # judgment notes when applicable
    final_chain_of_evidence: "..."
    cost_usd_kimi: <number>
    counterfactual:  # populated only on sampled tasks
      verdict: PASS | CONCERN | FAIL
      findings: [...]
    interface_summary:  # for downstream task-integration-prior consumers
      added: ["function foo: (a: A) => B at file:line", ...]
      modified: [...]
      removed: [...]
    token_budget_at_boundary: <int or null>  # logged at the 15-task boundary
```

The `interface_summary` field is the producer side of the contract that `task-integration-prior` consumes (per §7.2). Tribunus-executor writes interface summaries at task time. At the 15-task boundary, the outgoing instance writes `token_budget_at_boundary` (its observed input-token usage) so we can revisit the 15-task threshold with data after the empirical phase.

### 7.5 Substrate Amendment (in scope)

The lane registry and prompt directory require amendment as part of B-1:

- `claude/skills/references/verification/lanes.md` family enum extended to include `execution` — currently `artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`. Update the enum line and any related docs.
- Four new prompt files authored at `claude/mcps/principales/prompts/`: `task-plan-match.md`, `task-no-stubs.md`, `task-domain-correctness.md`, `task-integration-prior.md`. Each shaped after `upstream-coverage.md` with the four-edit-class discipline from halt-notes.
- Four new lane registry entries in `lanes.md` matching §7.2 specifications.
- The principales MCP must be **restarted** after prompt files land. The substrate reads `prompts/*.md` only at process spawn (per `claude/mcps/principales/src/server.ts:91-97`); without restart, new lanes are refused with synthetic-failure dockets.

### 7.6 `/edicts` Skill

Modified to dispatch Tribunus-design as a step **after** the existing verification-dispatch phase (Praetor + Provocator) returns SOUND **AND** the Custos walk returns OK TO MARCH (or after Imperator override of BLOCKER), **before** the existing "The Legion Awaits" yield. If Custos returns PATCH BEFORE DISPATCH on a structural patch (task additions, removals, reordering), Tribunus-design's prior output is invalidated and re-runs after the second Custos walk.

The plan and protocol are presented to the Imperator together as one approval bundle.

### 7.7 `/legion` Skill

Modified to spawn Tribunus-executor at Legion start, name the agent for `SendMessage` addressability, signal task completions with facts only, and orchestrate the 15-task lifetime restart pattern. `/march` is NOT modified.

### 7.8 `/tribune` Skill (Medicus invocation)

Unchanged.

### 7.9 Campaign Review Interaction

After the last task's verdict, Tribunus-executor terminates. The Legion's existing Campaign review (Censor + Praetor + Provocator parallel dispatch) fires next, unchanged. Tribunus-executor's cross-task findings are written to `tribune-log.md` for audit, but **the Campaign-review verifiers do NOT receive `tribune-log.md`** — Independence Rule preserved at Campaign-review time. Campaign verifiers may surface findings that overlap with Tribunus-executor's verdicts; the overlap is independent confirmation, not duplication.

## 8. Doctrine Amendment — Codex

The Codex gains a new persona class:

> **Persistent Orchestrator.** A verifier holding cross-task context within a single in-plan execution-time window. Per-task independence is explicitly traded for cross-task coherence detection. Lifetime is bounded (default 15 tasks, ±2 ergonomic) to prevent context degradation. Persistent Orchestrator is a class with exactly one member: the Tribunus-on-Legion executor stance. **Any future role exhibiting the architectural property — cross-task context within an in-plan execution-time window — MUST be added to this enumeration through a new Codex amendment specifically. The privilege does NOT generalize from the property.** A future role with similar architecture but a different name is bound by the Independence Rule until the Codex names it as a Persistent Orchestrator.
>
> The Independence Rule remains absolute for all other verifier roles in all other contexts: Censor, Praetor, Provocator (in spec-time, plan-time, and Campaign-review contexts), Custos (field-readiness verification), and Tribunus-in-diagnosis-stance (Medicus track) all remain ephemeral and independent.

**Term definition added.** *"In-plan execution-time"* refers to verification of implemented tasks during Legion execution — after spec is verified, after plan is verified, after each task is implemented, before Campaign review.

**Per-Task Verification protocol sub-amendment.** The Codex's existing Per-Task Verification entry (*"After each soldier completes a task, the Legatus dispatches the Tribunus"*) is amended for the Legion executor stance only:

> *In the Legion executor stance, the Legatus does NOT dispatch the Tribunus per task. At Legion start, Legatus spawns Tribunus-executor with the verified protocol and signals task completions across its 15-task lifetime window via `SendMessage`. Restart-with-fresh-context occurs at the 15-task boundary (±2 ergonomic). Per-task independence is replaced by intra-window cross-task coherence; cross-window independence is preserved through `tribune-log.md`-driven restart. All other Per-Task Verification semantics are unchanged. The Medicus diagnosis stance retains the original per-dispatch shape.*

The vocabulary used is the canonical Codex term **Tribunus**.

## 9. Empirical Experiment

The first 5 cases executed under B-1 constitute the experimental phase, satisfying the mandate from `kimi-principales-integration/next-session-notes.md`.

For each task during the experimental phase, Tribunus-executor logs to `tribune-log.md` per the schema in §7.4: lanes fired, model profile per lane, Kimi dockets, Claude-side findings, Deviation-as-Improvement notes, final verdict, cost actuals, counterfactual baseline (sampled tasks only), interface summary, token-budget-at-boundary.

**Counterfactual sampling rules:**

- **Determinism.** Tasks are sampled by plan-index: tasks 3, 6, 9, 12, ..., regardless of which Tribunus-executor window the task falls in. The `(plan_index) mod 3 == 0` rule is computed against plan position, not window position. A 30-task plan produces ~10 sampled tasks; 5 cases produce ~50 sampled tasks total — small but defensible sample.
- **Boundary continuity.** When Tribunus-executor restarts at the 15-task boundary, sampling continues uninterrupted by plan-index. Task 16 is not auto-sampled; task 18 is.
- **Sequencing — Claude-side runs first.** On a sampled task, Tribunus-executor runs Claude-side patrol on the surfaces Kimi lanes will cover **before** dispatching lanes. The counterfactual verdict is captured at that point, uncontaminated by docket exposure. Then lanes dispatch as normal, dockets are read, and the integrated verdict is computed and logged separately. The counterfactual is "ignoring the dockets" because the dockets did not yet exist when it was rendered.

After 5 cases, the structured diff between integrated verdicts and counterfactual verdicts identifies, per lane:

- Where Kimi reliably matches Claude-side judgment (graduate to Kimi-only). Threshold: ≥80% verdict-match across sampled tasks AND ≥90% finding-level-match. Starting commitments; revisitable per data.
- Where Kimi diverges (keep Claude-side, deprecate Kimi for that lane). Threshold: <70% verdict-match.
- Where Kimi catches what Claude-side misses (ensemble retained). Threshold: ≥1 Kimi-MISUNDERSTANDING-where-Claude-was-silent across sampled tasks.
- Per profile: was `principalis_light` (k2.5) sufficient where used, or did mismatches concentrate there? Drives B-2 model-graduation decisions.

**Token-budget review.** The 15-task lifetime threshold is asserted; the empirical phase verifies it via `token_budget_at_boundary` logged at every window. After 5 cases, review whether 15 was too many or too few. Adjust in B-2.

## 10. Cost

**Per-task Kimi-side cost cap.** Default $0.10/task average over the plan. Tribunus tracks per-task spend from docket cost reports; soft-warns on per-task overrun.

**Mixed-profile arithmetic for a typical heavy task firing all 4 lanes:**
- 2 light × ~$0.012 = $0.024
- 2 adversarial × ~$0.018 = $0.036
- Total: ~$0.06/task
For a 30-task plan averaging 4 lanes/task: ~$1.80 Kimi-side.

**Tribunus-design Kimi cost.** Tribunus-design fires once per Legion at protocol-write time. It does not dispatch lanes (it WRITES the protocol that says which lanes will fire). Kimi-side cost: $0. Opus cost: one fresh-context Tribunus call against the verified plan — single-digit dollars on Opus at typical plan size.

**Counterfactual sampling overhead.** Sampled tasks (10/30) carry an additional Claude-side patrol pass on Kimi-covered surfaces. This is Opus-side, not Kimi-side. Estimated overhead: ~33% additional Opus reasoning over the same diff and doctrine on sampled tasks. For a 30-task plan, ~10 tasks each carry double Claude-side scrutiny.

**Opus-side total for a 30-task plan with B-1:**
- Tribunus-design: 1 fresh-context call
- Tribunus-executor: 2 instances × 15 tasks each (per-task signal-and-verdict work; sticky context within window reduces cold-start tax compared to today's 30 ephemeral)
- Counterfactual surcharge: ~10 sampled tasks × additional Claude-side patrol pass

Net Opus comparison to today's 30 × ephemeral Tribunus baseline: roughly comparable on cold-start tax, ~10-15% higher overall due to counterfactual overhead during the experimental phase. Honest framing: this case is **NOT primarily an Opus-cost-reduction case**; it is a Kimi-cost-addition case that captures cross-task drift detection as a quality benefit. Opus stays roughly even.

**`SessionBudget` reality.** `CONSILIUM_KIMI_SESSION_BUDGET_USD` (default $5) is per-MCP-process, not per-Legion. It is shared across every dispatcher in the same Claude Code session that calls `verify_lane`. If the Imperator runs `/consul` to write a new case's spec while a Legion is executing, both consume the same $5. The hard halt is the substrate's auto-refusal once the budget is exceeded — at that point `verify_lane` returns `refused` synthetic-failure dockets and Tribunus-executor falls back to Claude-side patrol per §5. **Recommended practice:** raise `CONSILIUM_KIMI_SESSION_BUDGET_USD` to ≥$10 for Legion-execution sessions to leave headroom for concurrent dispatchers.

## 11. Failure Modes & Risks

- **Tribunus-design produces a bad protocol.** Imperator reviews protocol alongside plan; can request revision before approval.
- **Custos returns PATCH BEFORE DISPATCH after Tribunus-design ran.** Protocol is invalidated and re-runs after the second Custos walk. Spec §6.1 mandates this.
- **Tribunus-executor crashes mid-window.** Legatus respawns at next task boundary; new instance reads protocol + log, resumes signaling. Loss is in-window context; bounded and acceptable.
- **Cross-task context contamination changes Tribunus's per-task verdicts in ways that mask real bugs.** Counterfactual baseline (sampled subset) surfaces this. Suspicious divergence escalates to the Imperator. Lifetime bound limits worst-case scope.
- **Counterfactual silently degrading under context pressure.** Sampled-subset (every 3rd task by plan-index) plus 15-task lifetime bound mitigate. Worst case: data on ~10/30 tasks per plan, ~50 across 5 cases — small but defensible sample.
- **Per-task cost overrun.** Soft-warn on overrun; substrate session-budget hard limit halts only on egregious overrun. Per-task cap is conservative; can tighten after data.
- **Kimi lane prompts produce false-positive GAPs.** Sterile-clerk wrapper validates evidence-quality; SOUND-without-strong-evidence auto-downgrades to CONCERN; transport failures auto-feed as `unverified`. Tribunus-executor's Claude-side fallback resolves false positives.
- **`SessionBudget` shared with concurrent dispatchers.** Mitigation: raise default to ≥$10 for Legion-execution sessions; Tribunus-executor falls back to Claude-side patrol on substrate refusal.
- **`SendMessage` reliability across 15-task windows.** First Consilium use of the persistent-named-agent pattern at execution scale. Imperator-demonstrated precedent confirms the primitive's persistence semantics; the unknown is operational reliability across 30 task-cycles with code implementation between cycles. Mitigation: 15-task lifetime bound limits exposure; restart pattern proven at every boundary; fallback to ephemeral patrol if pattern degrades.

## 12. Verification

This spec is dispatched to the Censor + Provocator pair per current Consilium verification protocol. Plan-level verification (Praetor + Provocator) follows once a plan is written; Custos walk follows. Execution will exercise the system this spec defines, producing the empirical data B-2 specs from.

## 13. Confidence Map

- §1 Summary: **High** — direct restatement of approved design.
- §2 Background: **High** — facts from recon and from Imperator-corrected framing of today's Tribunus coverage.
- §3 Goals: **High** — Imperator-confirmed across deliberation turns; substrate amendment scope explicit.
- §4 Non-goals: **High** — explicit scope boundaries; `/march` and thinking-mode exclusions firm.
- §5 Constraints: **High** — derived from Codex doctrine, substrate properties, and Custos ordering verified against `/edicts` skill body.
- §6 Architecture: **High** — `SendMessage` semantics confirmed via Imperator-demonstrated transcript (2026-04-26): persistent named agent, full context across turns, addressable by name or ID, occasional messages keep warm. Pattern reliability across 15-task windows at execution scale is the residual unknown (named in §11).
- §7 Components: **Medium-High** — file paths, schemas, and modification surface are sound; modifications inside `/edicts`, `/legion`, and the Tribunus persona are plan-level work; substrate amendment is explicitly named as scope.
- §8 Doctrine Amendment: **Medium** — amendment shape, vocabulary, architectural-property anchor, and Per-Task Verification sub-amendment are addressed; precise wording in the Codex still needs Praetor reading.
- §9 Empirical Experiment: **High** — 5-case threshold from `next-session-notes.md`; counterfactual rules, sampling determinism, boundary continuity, and sequencing all specified. Quantitative thresholds (≥80% match for graduation, etc.) are starting commitments revisitable per data.
- §10 Cost: **Medium** — mixed-profile arithmetic informed estimate; counterfactual overhead and SessionBudget reality acknowledged honestly. Not measured until empirical phase.
- §11 Risks: **Medium-High** — major failure modes named with mitigations; novel-architecture unknowns (SendMessage at 15-task scale) named explicitly.
- §12 Verification: **High** — standard Consilium verification flow.

## 14. Open Questions

None at this time. Iteration findings from Censor / Provocator will be addressed via the standard Codex auto-feed loop.
