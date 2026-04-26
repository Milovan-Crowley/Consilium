# Tribune Persistent + Principales Adaptive Dispatch (B-1)

**Status:** spec draft 1 — pending verification
**Author:** Publius Auctor
**Date:** 2026-04-26
**Track:** Principales Integration Roadmap, B-1 of B-1 through B-5

## 1. Summary

Make the Tribune-on-Legion role persistent across plan execution and adaptive in dispatching principales (Moonshot Kimi) lanes for per-task verification. Tribune (not Legatus) owns verification design from cradle to grave: a pre-flight design phase produces a per-task verification protocol that leaves Consul's hand alongside the plan; a Legion-time persistent executor runs the protocol with sticky cross-task context.

This case generates the empirical dataset that B-2 (shadow Kimi for spec/plan verifiers) will be specified from. Two prior attempts at integration spec halted on iteration 2 because they tried to design integration without empirical grounding. This case satisfies the Imperator's `next-session-notes.md` mandate from the halted `kimi-principales-integration` case for a 5-case manual experiment, by *generating* that data while solving cost and drift problems in production.

## 2. Background

The Consilium currently spawns a fresh ephemeral Tribune subagent for each task during Legion execution. For a 30-task plan this produces 30 cold-start Tribune calls — repeated context-load tax, no cross-task drift detection, all reasoning in expensive Opus. Per-task verification work is constructed by the Legatus, which is typically a context-drained Consul session running in its third or fourth phase.

Two opportunities:

- **Cost.** Moonshot Kimi (~1/6 Opus cost) is well-suited to lane-shaped verification — bounded scope, evidence-anchored claims, structured docket output. The principales MCP substrate is built and dormant. This case wires it into Tribune.
- **Quality.** Tribune today operates per-task with no cross-task memory. Drift between earlier-task assumptions and later-task implementations goes undetected. A persistent Tribune carries plan-wide context and can flag inconsistencies the ephemeral model cannot see.

## 3. Goals

- Move the Tribune-on-Legion role to a persistent agent with sticky context across all tasks of a single plan.
- Tribune owns verification design cradle-to-grave: a pre-flight design phase produces `tribune-protocol.md`; a Legion-time executor runs it.
- Plan and verification protocol are produced and reviewed together, leaving Consul's hand as one artifact bundle through `/edicts`.
- Per-task verification dispatches a Tribune-selected subset of execution-time principales lanes at Moonshot pricing, with Tribune integrating dockets alongside its own Claude-side findings.
- Generate empirical data answering: which lanes does Kimi reliably handle, which need Claude, which surface ensemble value (Kimi catches what Claude misses).
- Codex amendment formalizes "persistent orchestrator" as a recognized persona class scoped to in-plan execution-time verification only.

## 4. Non-goals

- Replacing Censor / Provocator / Praetor with Kimi (covered in the Provocator-decompose case and future B-2).
- Building a writing-Kimi MCP (B-4 / B-5 territory).
- Soldier replacement (B-5).
- Promoting any execution lane from shadow to active Kimi-only — that decision waits for the data this case produces.
- Applying persistence to spec-time or plan-time verifiers.
- Restructuring `/consul`, `/edicts`, `/legion` beyond the modifications named in this spec.

## 5. Constraints

- **Codex Independence Rule preservation for spec/plan verifiers.** Spec-time and plan-time verification remains absolutely independent. The doctrine amendment narrows persistent-orchestrator scope to execution-time only.
- **Existing Tribune behavior preserved as fallback.** When principales is unavailable or a lane returns transport-failure, Tribune-executor falls back to the same Claude-side patrol Tribune does today. No new failure mode introduced.
- **Per-plan cost cap.** Default $2 per-plan principales budget, separate from per-session budget. Tribune halts and escalates if exceeded.
- **No protocol skip in v1.** Every Legion run produces `tribune-protocol.md`. Trivial-plan exemptions can be added later if data shows the design phase has negligible value for small plans.
- **Medicus track untouched.** Tribune in diagnosis stance (Medicus invocation) is not modified by this case.

## 6. Architecture

Two phases for Tribune.

### 6.1 Pre-flight Design Phase

After plan verification and approval, the `/edicts` skill dispatches Tribune in **design stance** as the final step before yielding to the Imperator review gate.

Tribune-design reads the verified plan with a fresh context and writes `tribune-protocol.md` to the case directory. Per task in the plan, the protocol specifies:

- Lanes selected (subset of the execution-time lane family; allocation by Tribune's LLM judgment based on task shape — trivial tasks may select one lane, heavy tasks may select all four)
- Claims to verify per lane
- Evidence sources expected per lane
- Notes for the executor stance (e.g., "task touches money path; additional scrutiny on idempotency")

The Imperator reviews plan and protocol together as one artifact bundle. Approval applies to both.

### 6.2 Legion Execution Phase

`/legion` and `/march` spawn Tribune in **persistent-executor stance** at Legion start, naming the agent so it is addressable via `SendMessage`. Tribune-executor receives the protocol at spawn and holds it in context throughout the plan.

Per task completion, the Legatus signals Tribune-executor with task identifier, change-set, files touched, and a brief implementation summary. The Legatus performs no verification construction.

Tribune-executor responds by dispatching the protocol-selected lanes via `verify_lane`, integrating the resulting dockets with its own Claude-side patrol findings, and returning a per-task verdict (PASS / CONCERN / FAIL) with chain-of-evidence citing whether each finding came from a Kimi docket or Claude-side analysis. During the experimental phase (defined in section 9), Tribune additionally runs Claude-side patrol on Kimi-covered surfaces to enable counterfactual measurement.

## 7. Components

### 7.1 Tribune Persona

`consilium-tribunus.md` gains two new stances; existing stances preserved.

- **design** — one-shot, pre-flight, writes `tribune-protocol.md` from a verified plan
- **persistent-executor** — Legion-time, sticky context, runs the protocol, dispatches lanes, integrates dockets

Existing stances unchanged:

- **patrol** — current ephemeral per-task verification (preserved as fallback when persistent path is unavailable)
- **diagnosis** — Medicus-track packet verification (untouched by this case)

Stance is declared by the dispatcher in the prompt, same convention as today.

### 7.2 Execution-Time Lane Family

A new lane family `execution` registered in the principales lane registry. Four lanes:

- `task-plan-match` — implementation aligns with plan-task description, file list, action-clause
- `task-domain-correctness` — domain doctrine respected (Medusa workflow boundaries, link.create discipline, money-path idempotency, frontend hard rules)
- `task-no-stubs` — real implementation; no placeholders, no half-finished functions, no unwired feature flags
- `task-integration-prior` — task N integrates correctly with task 1..N-1's exposed interfaces (the cross-task lens that ephemeral Tribune cannot see)

Each lane has a corresponding prompt file shaped after the production-grade `upstream-coverage.md` template.

### 7.3 `tribune-protocol.md` Artifact

A new artifact in the case directory, alongside `spec.md` and `plan.md`. Structured markdown, parseable by Tribune-executor at Legion start. Contents are specified in section 6.1; precise schema is a plan-level decision.

### 7.4 `/edicts` Skill

Modified to dispatch Tribune-design as the final step after plan production and verification. Plan and protocol are presented to the Imperator together as one approval gate.

### 7.5 `/legion` and `/march` Skills

Modified to spawn Tribune-executor at start, name the agent for `SendMessage` addressability, and signal task completions with facts only. Verification design is not constructed at runtime.

### 7.6 `/tribune` Skill (Medicus invocation)

Unchanged.

## 8. Doctrine Amendment — Codex

The Codex gains a new persona class:

> **Persistent Orchestrator.** A verifier holding cross-task context within a single plan execution. Independence-per-task is explicitly traded for cross-task coherence detection. Persistent orchestrators apply only to in-plan execution-time verification (Tribune-on-Legion). The Independence Rule remains absolute for spec-time and plan-time verifiers (Censor, Provocator, Praetor) — those remain ephemeral and independent.

The amendment is stated explicitly, not buried. The trade-off is named: gain cross-task drift detection; lose per-task independence within the plan.

## 9. Empirical Experiment

The first 5 cases executed under B-1 constitute the experimental phase, satisfying the mandate from `next-session-notes.md` of the halted `kimi-principales-integration` case.

For each task during the experimental phase, Tribune-executor logs to `<case>/tribune-log.md`:

- Lanes fired
- Kimi dockets received (full content)
- Tribune's Claude-side patrol findings
- Final verdict
- **Counterfactual baseline** — what verdict Tribune would have reached running Claude-side patrol passes on every surface, ignoring Kimi dockets

The counterfactual is the experimental cost. After 5 cases, the structured diff between integrated verdicts and counterfactual verdicts identifies:

- Lanes where Kimi reliably matches Claude-side judgment (graduate to Kimi-only — skip Claude-side for that surface)
- Lanes where Kimi diverges from Claude-side judgment (keep Claude-side, deprecate Kimi for that lane)
- Lanes where Kimi catches what Claude-side misses (ensemble value confirmed; both retained)

This dataset is the substrate from which the B-2 spec is written, replacing the integration-spec attempts that halted twice on instinct.

## 10. Cost

Per-plan principales budget cap, default $2 per plan. Separate from the existing per-session budget. Tribune halts and escalates if exceeded.

No upfront declaration of expected lane count in v1. Actuals tracked per case; cap revisited after the experimental phase produces lane-count distribution data.

## 11. Failure Modes & Risks

- **Tribune-design produces a bad protocol.** Imperator reviews protocol alongside plan; can request revision before approval.
- **Tribune-executor agent crashes mid-plan.** Protocol on disk; Legion can respawn Tribune-executor and resume from the last completed task. Loss is the cross-task context built up — equivalent to a restart, acceptable.
- **Cross-task context contamination changes Tribune's per-task verdicts in ways that mask real bugs.** Counterfactual baseline (Claude-side per-task without cross-task context) is logged during the experimental phase precisely to surface this. Suspicious divergence escalates to the Imperator.
- **Cost overrun before per-plan cap triggers.** Cap is conservative; can tighten after data.
- **Kimi lane prompts produce false-positive GAPs.** The principales sterile-clerk wrapper already validates evidence-quality; SOUND-without-strong-evidence auto-downgrades to CONCERN; transport failures auto-feed as `unverified`. Tribune-executor's Claude-side fallback resolves false positives.

## 12. Verification

This spec is dispatched to the Censor + Provocator pair per current Consilium verification protocol. Plan-level verification (Praetor) follows once a plan is written. Execution will exercise the system this spec defines, producing the empirical data B-2 specs from.

## 13. Confidence Map

- Section 1 (Summary): **High** — direct restatement of approved design.
- Section 2 (Background): **High** — facts from recon (`docs/cases/2026-04-26-kimi-principales-v1/spec.md`, `next-session-notes.md`, current Tribune behavior).
- Section 3 (Goals): **High** — Imperator-confirmed across multiple deliberation turns.
- Section 4 (Non-goals): **High** — explicit scope boundaries set during deliberation.
- Section 5 (Constraints): **High** — derived from Codex doctrine and current substrate properties.
- Section 6 (Architecture): **High** — two-phase shape Imperator-approved; correction from Imperator on Legatus job-construction integrated.
- Section 7 (Components): **Medium-High** — file paths and module boundaries are sound; precise modification surface inside `/edicts`, `/legion`, `/march` is plan-level work.
- Section 8 (Doctrine Amendment): **Medium** — persona-class amendment is right in shape; precise wording in the Codex is plan-level.
- Section 9 (Empirical Experiment): **High** — 5-case threshold borrowed from `next-session-notes.md`; counterfactual baseline approach is direct.
- Section 10 (Cost): **Medium** — $2 default cap is informed estimate, not measured; revisit after data.
- Section 11 (Risks): **Medium-High** — major failure modes named with mitigations; novel-architecture unknowns may surface during execution.
- Section 12 (Verification): **High** — standard Consilium verification flow.

## 14. Open Questions

None at this time. Iteration findings from Censor / Provocator will be addressed via the standard Codex auto-feed loop.
