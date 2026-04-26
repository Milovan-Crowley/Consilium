# Tribune Persistent + Principales Adaptive Dispatch (B-1)

**Status:** spec draft 2 — pending verification (auto-feed iteration after Censor + Provocator findings on draft 1)
**Author:** Publius Auctor
**Date:** 2026-04-26
**Track:** Principales Integration Roadmap, B-1 of B-1 through B-5

## 1. Summary

Make the Tribunus-on-Legion role persistent across plan execution and adaptive in dispatching principales (Moonshot Kimi) lanes for per-task verification. Tribunus (not Legatus) owns verification design from cradle to grave: a pre-flight design phase produces a per-task verification protocol that leaves Consul's hand alongside the plan; a Legion-time persistent-executor runs the protocol with sticky cross-task context, with persistence bounded at 15 tasks per Tribunus-executor instance to prevent context degradation.

Each principales lane uses a model profile matched to its cognitive lift (cheap `principalis_light` for trivial text comparison; `principalis_adversarial` for doctrine-against-code reasoning). The Tribunus is the judge of deviation; principales return yes/no per claim. Deviation-as-Improvement assessment is Tribunus's Claude-side judgment over flagged dockets, not a separate lane.

This case generates the empirical dataset that B-2 (shadow Kimi for spec/plan verifiers) will be specified from. Two prior attempts at integration spec halted on iteration 2 because they tried to design integration without empirical grounding. This case satisfies the Imperator's `next-session-notes.md` mandate from the halted `kimi-principales-integration` case for a 5-case manual experiment, by *generating* that data while solving cost and drift problems in production.

## 2. Background

The Consilium currently spawns a fresh ephemeral Tribunus subagent for each task during Legion execution. The current Tribunus has an integration-check axis built into its persona, but it carries **no sticky cross-task context** — it relies on the Legatus to surface prior-task changes in the dispatch prompt. For long plans this is brittle: the Legatus may forget which prior tasks touched the same surface, leading to integration-check misses. For a 30-task plan, ephemeral Tribunus also produces 30 cold-start Opus calls — repeated context-load tax, all reasoning in expensive Opus.

Two opportunities:

- **Cost.** Moonshot Kimi (~1/6 Opus cost) is well-suited to lane-shaped verification — bounded scope, evidence-anchored claims, structured docket output. Per-lane model stratification matches profile cost to lane difficulty: trivial text-pattern lanes use `principalis_light` (k2.5 non-thinking); harder doctrine-against-code lanes use `principalis_adversarial` (k2.6 non-thinking). The principales MCP substrate is built and dormant. This case wires it into Tribunus.
- **Quality.** Persistent Tribunus carries plan-wide context within its 15-task lifetime window, surfacing inconsistencies the ephemeral model cannot see (e.g., task 14 silently breaking task 3's exposed interface). Cross-window drift detection is partial — preserved through `tribune-log.md` digest read at restart — but full intra-window drift detection is the load-bearing improvement.

## 3. Goals

- Move the Tribunus-on-Legion role to a persistent agent with sticky context across all tasks of a single 15-task lifetime window, restarting at the 15-task boundary (±2 ergonomic window for plan tail).
- Tribunus owns verification design cradle-to-grave: a pre-flight design phase produces `tribune-protocol.md`; a Legion-time executor runs it.
- Plan and verification protocol are produced and reviewed together, leaving Consul's hand as one artifact bundle through `/edicts`.
- Per-task verification dispatches a Tribunus-design-selected subset of execution-time principales lanes at Moonshot pricing, with model profile stratified by lane difficulty, and Tribunus-Claude-side judgment integrating dockets and applying Deviation-as-Improvement assessment.
- Generate empirical data answering: which lanes does Kimi reliably handle, which need Claude, which surface ensemble value, and which model profile (k2.5 vs k2.6) suffices per lane.
- Codex amendment formalizes "Persistent Orchestrator" as a recognized persona class scoped narrowly to in-plan execution-time verification only; all other verifier roles remain ephemeral and independent.

## 4. Non-goals

- Replacing Censor / Provocator / Praetor with Kimi (covered in the Provocator-decompose case and future B-2).
- Building a writing-Kimi MCP (B-4 / B-5 territory).
- Soldier replacement (B-5).
- Promoting any execution lane from shadow to active Kimi-only — that decision waits for the data this case produces.
- Applying persistence to spec-time or plan-time verifiers.
- **`/march` is explicitly excluded.** `/march` is the deliberate ceremony-skip escape hatch for trivial plans where Tribunus per-task verification would be over-engineering. No Tribune layer, no Kimi dispatch under `/march`. It retains its current solo-Legatus semantic.
- **Thinking-mode is explicitly excluded for B-1.** v1 substrate has `CONSILIUM_KIMI_DISABLE_THINKING=true` by default. B-1 lanes use `thinking_allowed=false` aligned with substrate default; per-lane thinking-mode promotion is revisited per B-2 data.
- Restructuring `/consul`, `/edicts`, `/legion` beyond the modifications named in this spec.

## 5. Constraints

- **Codex Independence Rule preservation for spec/plan verifiers.** Spec-time and plan-time verification remains absolutely independent. The doctrine amendment narrows persistent-orchestrator scope to execution-time only, and enumerates negative space exhaustively (see §8).
- **15-task lifetime bound.** Tribunus-executor restarts every 15 tasks. The boundary has a ±2 ergonomic window: if the plan ends within 2 tasks of the boundary, the existing Tribunus-executor carries to completion (a 16-task plan uses one Tribunus, not two).
- **`/march` excluded** (see §4).
- **Thinking-mode disabled** (see §4).
- **Existing Tribunus behavior preserved as fallback.** When principales is unavailable, a lane returns `transport_failure`, or the persistent-executor pattern is disabled by configuration, Tribunus-executor falls back to the same Claude-side patrol Tribunus does today. No new failure mode introduced.
- **Per-task cost cap.** Default $0.10/task average over the plan, $3 ceiling for 30-task plan. Tribunus tracks per-task spend from docket cost reports; soft-warns on per-task overrun and halts only on substrate session-budget breach (`CONSILIUM_KIMI_SESSION_BUDGET_USD`, default $5).
- **No protocol skip in v1.** Every Legion run produces `tribune-protocol.md`. Trivial-plan exemptions can be added later if data shows the design phase has negligible value for small plans.
- **Medicus track untouched.** Tribunus in diagnosis stance (Medicus invocation) is not modified by this case.

## 6. Architecture

Two phases for Tribunus.

### 6.1 Pre-flight Design Phase

After plan verification, the `/edicts` skill dispatches Tribunus in **design stance** as a step after the verification dispatch returns SOUND, before yielding to the legion-vs-march choice in "The Legion Awaits."

Tribunus-design reads the verified plan with a fresh context and writes `tribune-protocol.md` to the case directory. Per task in the plan, the protocol specifies which lanes are triggered (subset of the four execution-time lanes), what claims to verify per lane, what evidence sources Tribunus-executor will preload into each `evidence_bundle.sources`, what model profile per lane, and notes for the executor stance.

The Imperator reviews plan and protocol together as one artifact bundle. Approval applies to both. Iteration on the protocol does not require re-running the plan-authoring phase.

### 6.2 Legion Execution Phase

`/legion` spawns Tribunus in **persistent-executor stance** at Legion start, naming the agent so it is addressable via `SendMessage` (a harness primitive proven in prior multi-Consul Consilium work; cited in the protocol as the dispatch mechanism). Tribunus-executor receives the protocol at spawn and holds it in context across its 15-task lifetime window.

Per task completion, the Legatus signals Tribunus-executor with task identifier, change-set, files touched, and a brief implementation summary. The Legatus performs no verification construction.

Tribunus-executor responds by preloading per-lane evidence bundles (diff slices, file content slices, doctrine excerpts, prior-task interface summaries) and dispatching the protocol-selected lanes via `mcp__consilium-principales__verify_lane`. Each lane returns a docket with per-claim yes/no findings. Tribunus-executor integrates the dockets with its own Claude-side patrol findings (for surfaces no lane covers) and applies the Codex's **Deviation-as-Improvement Rule** as judgment over flagged findings: when a lane flags a deviation from the plan, Tribunus-executor decides whether the deviation is improvement (SOUND-with-note) or drift (FAIL-with-note). Deviation-as-Improvement is judgment work; principales are claim-verifiers, not judges.

Final per-task verdict is PASS / CONCERN / FAIL with chain-of-evidence citing whether each finding came from a Kimi docket or Claude-side analysis. During the experimental phase (defined in §9), Tribunus additionally runs Claude-side patrol on Kimi-covered surfaces for a sampled subset of tasks (every 3rd task) to enable counterfactual measurement without straining its context window.

At the 15-task boundary (or boundary + ≤2 if the plan ends within the ergonomic window), Legatus signals Tribunus-executor to terminate. Legatus then spawns a new Tribunus-executor with fresh context. The new instance reads `tribune-protocol.md` (input) and `tribune-log.md` (prior verdicts digest) at spawn, then resumes signaling. On a Tribunus-executor crash mid-window, Legatus respawns at the next task boundary using the same restart pattern. Cross-window drift detection is partial — full context is lost, but the verdict-digest in `tribune-log.md` carries forward.

## 7. Components

### 7.1 Tribunus Persona (`consilium-tribunus.md`)

Two new stances added; existing stances preserved.

- **design** — one-shot, pre-flight, writes `tribune-protocol.md` from a verified plan
- **persistent-executor** — Legion-time, sticky context, 15-task lifetime, runs the protocol, preloads evidence bundles, dispatches lanes, integrates dockets, applies Deviation-as-Improvement judgment

Existing stances unchanged:

- **patrol** — current ephemeral per-task verification (preserved as fallback when persistent path is unavailable)
- **diagnosis** — Medicus-track packet verification (untouched by this case)

Stance is declared by the dispatcher in the prompt, same convention as today.

**Frontmatter edits required:**
- `tools:` adds `mcp__consilium-principales__verify_lane`
- `mcpServers:` adds `principales`

**Persona body doctrine added:** explicit role separation — *"The Tribunus is the judge of deviation. The principales are claim-verifiers. The Tribunus reads dockets, applies Codex's Deviation-as-Improvement Rule, and renders verdict. The principales return yes/no per claim and never judge."*

After body changes, the Codex drift-check coupling per `claude/CLAUDE.md` Maintenance section must run (the Codex content is copy-pasted into 6 user-scope agent files).

### 7.2 Execution-Time Lane Family

A new lane family `execution` registered in the principales lane registry. Four lanes, each with distinct trigger surface, evidence-bundle shape, and model profile.

- **`task-plan-match`** — Trigger: presence of plan task entry. Evidence shape: plan task body + diff text. Profile: `principalis_light` (k2.5 non-thinking). Yes/no claim shape: *"does the diff implement the plan task as written? Are file list and action-clause honored?"*
- **`task-no-stubs`** — Trigger: new function bodies, return values, or handlers in diff. Evidence shape: diff text (text-pattern detection only — `{} as Type` cast laundering is NOT detected; that requires repo grounding deferred to v2 substrate). Profile: `principalis_light` (k2.5 non-thinking). Yes/no claim shape: *"are TODO comments, empty handlers, hardcoded mocks, placeholder returns present in this diff?"*
- **`task-domain-correctness`** — Trigger: presence of domain-doctrine-relevant code in diff (Medusa workflow boundary, `link.create` discipline, money-path idempotency, frontend hard rule). Evidence shape: diff slice + relevant doctrine excerpt + prior-pattern reference (preloaded by Tribunus-executor per protocol). Profile: `principalis_adversarial` (k2.6 non-thinking). Yes/no claim shape: *"does this implementation respect doctrine X for the surfaces it touches?"*
- **`task-integration-prior`** — Trigger: code interfacing with prior-task interfaces (imports, function calls, type references touching prior-task additions). Evidence shape: diff + prior-task interface summaries from `tribune-log.md` (preloaded). Profile: `principalis_adversarial` (k2.6 non-thinking). Yes/no claim shape: *"does this task break or conflict with task 1..N-1's exposed interfaces?"*

Each lane has a corresponding prompt file at `claude/mcps/principales/prompts/task-*.md`, shaped after the production-grade `upstream-coverage.md` template. Each lane registry entry sets `family: execution`, `evidence_required: artifact_and_doctrine`, `kimi_sound_final: false`, `thinking_allowed: false`.

**Deviation-as-Improvement is NOT a lane.** It is Tribunus-Claude-side judgment over docket findings flagged by any lane. Per Codex doctrine, this is verdict-integration work, not enumeration.

### 7.3 `tribune-protocol.md` Artifact

A new artifact in the case directory, alongside `spec.md` and `plan.md`. Structured markdown, parseable by Tribunus-executor at Legion start. Schema:

```
schema_version: 1
plan_id: <case>/plan.md commit-or-hash
tasks:
  - task_id: <plan task identifier>
    lanes_triggered: [task-plan-match, task-domain-correctness, ...]  # subset of 4
    claims_per_lane:
      task-plan-match: ["claim text 1", "claim text 2"]
      task-domain-correctness: [...]
    evidence_sources_per_lane:
      task-plan-match: [{type: "plan-task-body", path: "<plan.md>#task-N"}, {type: "diff", path: "<runtime>"}]
      task-domain-correctness: [{type: "doctrine", path: "<doctrine excerpt path>"}, ...]
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-domain-correctness: false
    executor_notes: "task touches money path; additional scrutiny on idempotency"
```

Tribunus-design writes the protocol; Tribunus-executor reads it. The `<runtime>` evidence sources are populated by Tribunus-executor at task time (the diff doesn't exist at design time).

### 7.4 `/edicts` Skill

Modified to dispatch Tribunus-design as a step **after** the existing verification-dispatch phase returns SOUND, **before** the existing "The Legion Awaits" yield. The plan and protocol are presented to the Imperator together as one approval bundle. Iteration on the protocol does not re-run plan authoring.

This is a structural addition to `/edicts`, not a restructure of existing phases — explicitly noted as in-scope (§4 non-goals exclude restructuring beyond this addition).

### 7.5 `/legion` Skill

Modified to spawn Tribunus-executor at Legion start, name the agent for `SendMessage` addressability, signal task completions with facts only (Legatus performs no verification construction), and orchestrate the 15-task lifetime restart.

`/march` is NOT modified (§4).

### 7.6 `/tribune` Skill (Medicus invocation)

Unchanged.

### 7.7 Campaign Review Interaction

After the last task's verdict, Tribunus-executor terminates. The Legion's existing Campaign review (Censor + Praetor + Provocator parallel dispatch) fires next, unchanged. Tribunus-executor's cross-task findings are written to `tribune-log.md` for audit, but **the Campaign-review verifiers do NOT receive `tribune-log.md`** — Independence Rule preserved at Campaign-review time. Campaign verifiers may surface findings that overlap with Tribunus-executor's verdicts; that overlap is independent confirmation, not duplication.

## 8. Doctrine Amendment — Codex

The Codex gains a new persona class:

> **Persistent Orchestrator.** A verifier holding cross-task context within a single in-plan execution-time window. Independence-per-task is explicitly traded for cross-task coherence detection. Persistent orchestrators apply *only* to the **Tribunus-on-Legion executor stance** during plan execution. Lifetime is bounded (default 15 tasks, ±2 ergonomic) to prevent context degradation. The Independence Rule remains absolute for all other verifier roles in all other contexts: Censor, Praetor, Provocator (in spec-time, plan-time, and Campaign-review contexts), Custos (field-readiness verification), and Tribunus-in-diagnosis-stance (Medicus track) all remain ephemeral and independent.

**Term definition added:** *"In-plan execution-time"* refers to verification of implemented tasks during Legion execution — after spec is verified, after plan is verified, after each task is implemented, before Campaign review. It is the only verification window in which a Persistent Orchestrator may operate.

The amendment is stated explicitly with positive scope (one role: Tribunus-on-Legion-executor) and negative scope (all other roles enumerated). No future Consul reading the Codex in isolation can reasonably infer broader applicability.

The vocabulary used is the canonical Codex term **Tribunus** (Latin singular). The conversational shorthand "Tribune" is not used in the Codex.

## 9. Empirical Experiment

The first 5 cases executed under B-1 constitute the experimental phase, satisfying the mandate from `next-session-notes.md` of the halted `kimi-principales-integration` case.

For each task during the experimental phase, Tribunus-executor logs to `<case>/tribune-log.md`:

- Lanes fired for the task
- Model profile used per lane (k2.5 light vs k2.6 adversarial)
- Kimi dockets received (full content)
- Tribunus's Claude-side patrol findings (for surfaces no lane covers)
- Deviation-as-Improvement judgment notes (where applicable)
- Final verdict
- **Counterfactual baseline (sampled subset).** On every 3rd task, Tribunus-executor additionally runs Claude-side patrol on Kimi-covered surfaces, ignoring the dockets, and logs the resulting verdict separately. Sampling every 3rd task keeps Tribunus-executor under context pressure (rather than double-work on every task) while still producing comparable data across 30-task plans (~10 sampled tasks per plan, ~50 across 5 cases).

After 5 cases, the structured diff between integrated verdicts and counterfactual verdicts identifies, per lane:

- Where Kimi reliably matches Claude-side judgment (graduate to Kimi-only — skip Claude-side for that surface). Threshold: ≥80% verdict-match across sampled tasks AND ≥90% finding-level-match. Exact thresholds revisitable after data; these are starting commitments.
- Where Kimi diverges from Claude-side judgment (keep Claude-side, deprecate Kimi for that lane). Threshold: <70% verdict-match.
- Where Kimi catches what Claude-side misses (ensemble value confirmed; both retained). Threshold: ≥1 Kimi-MISUNDERSTANDING-where-Claude-was-silent across sampled tasks.
- Per profile: was `principalis_light` (k2.5) sufficient for the lanes that used it, or did mismatches concentrate there? (Drives B-2 model-graduation decisions, not just lane-graduation.)

This dataset is the substrate from which the B-2 spec is written.

## 10. Cost

**Per-task cost cap, not per-plan.** Default $0.10 per task average; soft-warn on per-task overrun, halt only on substrate session-budget breach (`CONSILIUM_KIMI_SESSION_BUDGET_USD`, $5 default per session, where one Legion session equals one plan).

**Mixed-profile cost arithmetic** for a typical heavy task firing all 4 lanes:
- 2 light × ~$0.012 = $0.024
- 2 adversarial × ~$0.018 = $0.036
- Total: ~$0.06/task

For a 30-task plan with average 4 lanes/task: ~$1.80. Substantial headroom under the $5 session-budget hard limit. For lighter task profiles (1-2 lanes), per-task cost drops to ~$0.012-$0.024.

**Opus-side cost is bounded by the 15-task lifetime.** Tribunus-executor's context grows monotonically within a window; restart at 15 tasks resets context to near-baseline. Opus side per Legion is approximately: (1 design call) + (2 executor instances for 30-task plan) × (per-task signal-and-verdict work). Comparable to today's ephemeral 30 × Tribunus dispatches; small win on cold-start reduction within windows.

## 11. Failure Modes & Risks

- **Tribunus-design produces a bad protocol.** Imperator reviews protocol alongside plan; can request revision before approval. Iteration on protocol does not re-run plan authoring.
- **Tribunus-executor crashes mid-window.** Legatus respawns at next task boundary using the standard restart pattern; new instance reads `tribune-protocol.md` and `tribune-log.md`, resumes signaling. Loss is the in-window context — bounded and acceptable, equivalent to a window boundary.
- **Cross-task context contamination changes Tribunus's per-task verdicts in ways that mask real bugs.** Counterfactual baseline (Claude-side per-task without cross-task context) is logged on the sampled subset during experimental phase to surface this. Suspicious divergence escalates to the Imperator. Lifetime bound (15 tasks) limits worst-case contamination scope.
- **Counterfactual silently degrading under context pressure.** Sampled-subset (every 3rd task) approach plus 15-task lifetime bound mitigate. Worst case: data on 10/30 tasks per plan, 50 sampled tasks across 5 cases — small but defensible sample for B-2.
- **Per-task cost overrun.** Soft-warning per task; substrate session-budget hard limit halts only on egregious overrun. The cap is conservative-with-headroom; can tighten after data.
- **Kimi lane prompts produce false-positive GAPs.** The principales sterile-clerk wrapper validates evidence-quality; SOUND-without-strong-evidence auto-downgrades to CONCERN; transport failures auto-feed as `unverified`. Tribunus-executor's Claude-side fallback resolves false positives.
- **`SendMessage` substrate-level reliability across 15-task windows.** First Consilium use of the persistent-named-agent pattern at execution scale (despite prior Consul-to-Consul precedent in brainstorming). Mitigation: 15-task lifetime bound, restart pattern proven at every boundary, fallback to ephemeral patrol if pattern degrades.

## 12. Verification

This spec is dispatched to the Censor + Provocator pair per current Consilium verification protocol. Plan-level verification (Praetor + Provocator) follows once a plan is written. Execution will exercise the system this spec defines, producing the empirical data B-2 specs from.

## 13. Confidence Map

- §1 Summary: **High** — direct restatement of approved design.
- §2 Background: **High** — facts from recon and from Imperator-corrected framing of today's Tribunus coverage.
- §3 Goals: **High** — Imperator-confirmed across deliberation turns.
- §4 Non-goals: **High** — explicit scope boundaries; `/march` and thinking-mode exclusions are firm.
- §5 Constraints: **Medium-High** — derived from Codex doctrine and substrate properties; per-task cost cap is informed estimate not measurement.
- §6 Architecture: **Medium** — `SendMessage` is harness-primitive plus prior Consul-to-Consul precedent, but this is the first Consilium use at execution scale across 15-task windows. Pattern reliability at scale is yet to be observed.
- §7 Components: **Medium** — file paths and module boundaries sound; modification surface inside `/edicts`, `/legion`, and the Tribunus persona is plan-level work; Tribunus persona doctrine for "judge of deviation vs claim-verifier" is novel and needs Praetor reading.
- §8 Doctrine Amendment: **Low** — precise wording in the Codex needs Praetor reading and may require Imperator-Codex direct adjudication. The amendment shape is right; the amendment text may need iteration.
- §9 Empirical Experiment: **Medium** — 5-case threshold borrowed from `next-session-notes.md`; counterfactual subset and quantitative thresholds (≥80% match for graduation, etc.) are starting commitments that will need iteration as data arrives.
- §10 Cost: **Low** — mixed-profile arithmetic is informed estimate based on substrate documentation; not measured. The substrate session-budget hard limit ($5) is the safety net.
- §11 Risks: **Medium-High** — major failure modes named with mitigations; novel-architecture unknowns may surface during execution (particularly `SendMessage` reliability at scale).
- §12 Verification: **High** — standard Consilium verification flow.

## 14. Open Questions

None at this time. Iteration findings from Censor / Provocator will be addressed via the standard Codex auto-feed loop.
