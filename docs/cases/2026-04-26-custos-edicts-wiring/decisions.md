---
case: 2026-04-26-custos-edicts-wiring
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

This file is the first instance of the `decisions.md` artifact proposed in this case's own spec. The CONVENTIONS amendment that formalizes the artifact will happen during implementation; this file uses the schema the spec proposes and serves as the format demonstration.

---

## Entry: 2026-04-26 — Q1: STATUS recording substrate

**Type:** decision
**Actor:** Imperator
**Trigger:** Iteration-2 Provocator GAP — `STATUS.md` schema (per `docs/CONVENTIONS.md`) has no fields for recording overrides, verdicts, or finding text. Four spec invariants and three smoke tests depend on a recording substrate that does not exist in current CONVENTIONS.
**Decision:** Adopt option A — amend `docs/CONVENTIONS.md` to add a new `decisions.md` per-case audit artifact. Bundle the amendment into this spec rather than splitting into a prerequisite case.
**Rationale:** The Imperator's words: *"I do think it is a kind of a stupid thing that we don't have some type of audit log or, for that matter, even a decision log that is separate from the spec itself. That being said I don't want to jump to make huge changes but if option A isn't too much extra work it could be worth it?"* Consul assessment: option A is genuinely small (~10 lines in CONVENTIONS.md + a minimal schema). The architectural payoff is meaningful — every case from this point forward gets a real audit substrate, not just this one. The Imperator's "if it isn't too much extra work" caveat clears.

---

## Entry: 2026-04-26 — Q2: Re-walk Marker schema

**Type:** decision
**Actor:** Imperator
**Trigger:** Iteration-1 Provocator GAP and iteration-2 Censor GAP — the spec asserted that adding a `## Re-walk Marker` to the second-walk dispatch preserves the Independence Rule, but the Marker's content was not specified. Two failure modes: (a) prose-style patch descriptions invert to prior verifier findings (Independence breach), (b) line-numbers-only marker leaves Walk 6 unable to act.
**Decision:** Marker contains **only** unified diff hunks. No prose, no attribution to verifiers, no rationale text, no reference to finding categories. Implementation must enforce the schema as hard, not advisory.
**Rationale:** The Imperator's words: *"I agree with your Q2."* Consul recommendation: diff hunks are revision metadata about the artifact, not framing about prior findings. They give Walk 6 exactly what it needs (changed regions + surrounding context) without leaking the Independence-protected layer (verifier findings, consul framing, conversation). The schema is documented in spec section "Re-walk Marker — Schema."

---

## Entry: 2026-04-26 — Q3: MISUNDERSTANDING-resolution traceability

**Type:** decision
**Actor:** Consul (Imperator silence interpreted as no objection)
**Trigger:** Iteration-2 Censor CONCERN — should the consul-revised plan after a MISUNDERSTANDING resolution require Praetor+Provocator re-dispatch before Custos? Current spec sends the revised plan directly to Custos.
**Decision:** Reject the Censor CONCERN. No forced re-dispatch on MISUNDERSTANDING resolution. The Imperator review gate at the end of the consul cycle handles the residual risk case-by-case.
**Rationale:** Forced re-dispatch on every MISUNDERSTANDING resolution adds significant latency for arguably small gain. Custos's walk is operational, not domain — he does not catch the same layer Praetor+Provocator do, so re-dispatching them after a MISUNDERSTANDING resolution is asking them to re-walk an already-resolved domain question rather than testing the Custos-relevant operational layer. The risk the Censor named (re-skinned misunderstanding) is real but rare enough to handle case-by-case at the existing review gate, not as default policy. Imperator response to Q3: silence on this specific question while explicitly stamping Q1 and Q2 — interpreted by the consul as "no objection to your recommendation, proceed."

---

## Entry: 2026-04-26 — Iteration count override

**Type:** decision
**Actor:** Imperator
**Trigger:** The Codex auto-feed loop caps iterations at 2. Iteration 2 returned 14 GAPs and 8 CONCERNs combined; addressing all of them required a third revision pass.
**Decision:** Authorize iteration 3 of the spec revision under Imperator authority, exceeding the Codex 2-iteration cap. Do NOT re-dispatch verification after iteration 3 — present the final spec at the Imperator review gate without another Censor+Provocator round. The diminishing-returns threshold has been reached; further iteration would add tightening but not architectural change.
**Rationale:** The Codex's 2-iteration cap exists to prevent endless verifier-consul loops. The Imperator may explicitly authorize additional iteration when the findings are tractable but volume requires another pass. Iteration 3 addresses 15 tractable fixes plus the three architectural questions (Q1/Q2/Q3) that came back from iteration 2. Re-dispatching after iteration 3 would likely surface new edge cases of similar character; the spec is at "good enough to march" and further verifier rounds buy precision at the cost of forward motion.
