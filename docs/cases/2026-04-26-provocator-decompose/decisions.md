---
case: 2026-04-26-provocator-decompose
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

---

## Entry: 2026-04-26 — Spec iteration 1 verifier-findings disposition

**Type:** decision
**Actor:** Consul
**Trigger:** Censor and Provocator returned independently on iteration-1 verification of `spec.md`. Combined: 0 MISUNDERSTANDING, 11 GAP (after dedup and synergy promotion across 4 clusters), 9 CONCERN (after dedup), 9 SOUND. Both verifiers turned the spec's own discipline rule (litmus test) against it: many GAPs identified mechanism-described-but-not-contract-specified surfaces that two correct implementations could differ on without changing observable behavior — i.e., spec-level boundary contracts the spec did not carry.
**Decision:** Address every GAP and adopt every CONCERN inline as iteration 2. No findings escalated to Imperator at this stage; auto-feed loop applied within the Codex 2-iteration cap. Major changes:

- Added Deployment-Model Contract and Aggregation Contract under The Five-Lane Shape (resolves: deployment-model GAP, drift-script-coverage GAP, "no Codex changes" tension GAP, orphaned Quality-Bar finding GAP, lane-vs-doctrine-Lane terminology GAP, plan-verification-portability CONCERN, five-dispatch-vs-one-fighter CONCERN).
- Added trigger-declaration schema, iteration-1 sanity check, and single-session scope under Differential Re-Verify; removed cross-session "evidence-base diff" framing (resolves: trigger-surface-schema GAP, trigger-declaration-validation GAP, first-iteration-baseline GAP, cross-session-persistence GAP, Success Criterion #5 observability GAP, HOW-drift-parentheticals CONCERN).
- Added Lane Failure Handling and Context Exhaustion Checkpoint under Merge Protocol; thin-SOUND re-ask capped at one attempt (resolves: lane-failure-modes GAP, per-lane-context-exhaustion GAP, thin-SOUND-termination GAP).
- Spelled out plan-WHY inheritance contract under Spec Discipline Rule (resolves: plan-WHY-inheritance GAP).
- Annotated criterion 3 no-op behavior under Plausibility Threshold (resolves: criterion-3-load-bearing CONCERN).
- Extended Sequencing Constraint to verification templates (no collision; documented) and surfaced `2026-04-26-tribune-persistent-principales` sibling-case Codex-amendment overlap (resolves: incomplete-sequencing-audit CONCERN, tribune-persistent-overlap CONCERN).
- Narrowed Out of Scope: "no Codex changes" → "no Codex vocabulary changes" + Aggregation Contract; Praetor portability claim removed (resolves: Codex-stance GAP, Praetor-portability CONCERN).
- Re-rated confidence on Goal, Five-Lane Shape, Differential Re-Verify, and Merge Protocol from High to Medium where contracts have gaps to address (resolves: 9-of-10-High-confidence CONCERN).
- Softened "multiplicatively" to "compound" throughout (resolves: multiplicative-overstatement CONCERN merged across both verifiers).
- Added pre-existing template-drift acknowledgment under Source (resolves: template-5-of-6-passes-drift GAP).

**Rationale:** Standard auto-feed loop application per the Codex (`protocol.md` §6 finding handling). MISUNDERSTANDINGs were absent — no halt condition. GAPs were tractable in-Consul. CONCERNs were either adopted on merit (most) or noted as in-doc clarifications. Iteration-1 SOUNDs were preserved. The iteration-2 spec is significantly larger than iteration 1 (~50%) but each addition is a contract one of the verifiers explicitly demanded.

---

## Entry: 2026-04-26 — Cross-session scope dropped from Differential Re-Verify

**Type:** decision
**Actor:** Imperator
**Trigger:** Provocator iteration-1 finding flagged cross-session preservation of prior lane reports as unspecified. The iteration-1 spec asserted "evidence-base diff is the cross-session safety net" without specifying where prior lane reports persist, in what format, or how a fresh Consul session would retrieve them. The Consul recommended scoping to single-session in v1 and surfacing cross-session persistence as a separate future case if data demands it.
**Decision:** Drop the evidence-base diff entirely. Differential Re-Verify is scoped to a single Consul session in v1. Across sessions, all lanes re-fire from a clean baseline.
**Rationale:** The Imperator's words: *"Cross session drop the evidence base diff."* Cleaner v1 — no new persistence artifact concept, no new file path under `docs/cases/<slug>/`, no new schema. Within a single Consul session, the codebase doesn't change anyway, so the evidence-base diff was over-engineering for a non-existent within-session need; across sessions it was load-bearing on unspecified persistence. Single-session scope removes both problems. Cross-session persistence is added explicitly to Out of Scope.

---

## Entry: 2026-04-26 — Praetor portability claim removed

**Type:** decision
**Actor:** Imperator
**Trigger:** Provocator iteration-1 finding observed that the iteration-1 spec asserted "the five-lane template is portable when [Praetor decomposition] is made," but the Provocator's adversarial five-lane shape (overconfidence, assumption, failure-mode, edge-case, negative-claim) does not translate to Praetor's forensic role (dependency tracing, file-collision checks, spec-coverage audits, deviation-as-improvement). The Consul recommended removing the portability claim outright.
**Decision:** Remove the "five-lane template is portable" claim from the Out of Scope section. Replace with explicit non-portability: "If Praetor decomposition is ever undertaken, it requires its own forensic-lens decomposition designed from scratch; the Provocator template does not carry over."
**Rationale:** The Imperator's words: *"praeto protability remove it."* The portability claim was overconfident — it projected an adversarial-lens template onto a forensic role without showing the mapping. Removing it does not foreclose Praetor decomposition; it just stops the spec from selling future work as easier than it is.
