# Verification Rejections — Iteration 1

Magistrate's record of Provocator findings rejected on merit per the Codex (CONCERN may be politely rejected with reasoning when the magistrate has context the verifier lacked; the Deviation-as-Improvement Rule applies in reverse to verifier findings — a finding is worth keeping only if addressing it makes the spec genuinely better).

These nine findings were produced by the Provocator's five-lane sweep on iteration 1. The magistrate rejects them with the reasoning below. They are recorded here so future verifiers do not re-fire the same surfaces, and so the Imperator can see the calls that were made.

---

## 1. "Specialty vs prompt-tightness conflated; no isolation test"

**Source:** Provocator / assumption-extraction lane.

**Finding (paraphrased):** The architecture credits *specialty* for sharpening intel, but the per-agent payload includes four other tightening mechanisms (scope contract, tool allowlist, compendium, stance declaration) that would tighten any generalist if applied. Without an isolation test (generalist + same tightening blocks vs three lane specialists), the spec cannot distinguish "specialty helps" from "any tightening helps."

**Rejection reasoning.** Re-litigates a decision the Imperator made during deliberation. The Provocator's role is attacking the spec's claims and unstated premises, not the Imperator's choices. The Imperator's choice between specialty and tightening-on-generalist was deliberated explicitly; the verifier reopening it without new evidence is out of scope.

---

## 2. "Compendium-use during dispatch is asserted, not enforced — no audit trail"

**Source:** Provocator / assumption-extraction lane.

**Finding (paraphrased):** The architecture provides no mechanism to verify that the agent consulted its Pitfalls Compendium during a given dispatch. There is no "cite the compendium entry that informed this answer" requirement, no audit trail.

**Rejection reasoning.** Consilium does not audit-trail any agent's prompt-use behavior. Adding observability for "did the agent read its own system prompt" is over-engineering at spec stage. The Codex relies on prompt-engineered discipline across every persona (Censor's finding categories, Provocator's lane scoping, Soldier's TDD); none of them carry compendium-use audit trails. Holding specialists to a unique observability standard is unjustified.

---

## 3. "All-three-lanes brainstorm compounds to 9x cost"

**Source:** Provocator / edge-case-hunting lane.

**Finding (paraphrased):** When a brainstorm touches all three lanes, three specialists fire in parallel; §9's "3x reconnaissance" multiplier compounds to 9x.

**Rejection reasoning.** The math is wrong. §9's "3x" is a comparison vs single generalist baseline (3 specialists firing = 3x cost vs 1 generalist firing). It is not "3x per lane × 3 lanes." Three specialists in parallel is 3x, not 9x. Beyond the math: the cost is just dispatch cost in any case, not an architectural failure. The magistrate decides per case whether to dispatch all three, drop one, or dispatch the generalist instead.

---

## 4. "Multiplicity surface-split has no contract for split symmetry"

**Source:** Provocator / failure-mode-analysis lane (CONCERN).

**Finding (paraphrased):** When the Imperator says "send 2 backend scouts," the spec does not define rules for whether the surface-split must be disjoint, exhaustive, or how to merge conflicting reports.

**Rejection reasoning.** Magistrate territory. The Consul exercises judgment on splits per case. Codifying split-rules as a spec contract is over-prescription — the same way the Codex doesn't codify how the Consul phrases questions during deliberation. SKILL prose may guide the Consul's judgment; it does not belong as a binding spec contract.

---

## 5. "Citation format characters could break markdown rendering"

**Source:** Provocator / edge-case-hunting lane (CONCERN).

**Finding (paraphrased):** Case slugs or finding-class strings containing `*`, `_`, or backticks could break the `*(case: ..., role: class)*` italics formatting in the Pitfalls Compendium.

**Rejection reasoning.** Theatrical. The Consilium has been writing markdown for many cases; rendering breaks have not been the bottleneck and the citation strings are author-controlled. If a citation ever does break rendering, it is a one-line fix at compendium-author time. Not a spec contract concern.

---

## 6. "§9 mitigations stated without demonstrated efficacy"

**Source:** Provocator / overconfidence-audit lane (CONCERN).

**Finding (paraphrased):** §9's mitigations are stated as if they work, but none are tested. "Lane-driven dispatch (only matching specialists fire)" assumes correct lane reading; "refresh triggered explicitly" assumes the Imperator remembers; "refusal contract" assumes refusal works.

**Rejection reasoning.** Mitigations describe *what we plan to do*; they are not claims of demonstrated efficacy. Demanding empirical proof at spec stage is premature — empirical efficacy is what the verification iteration after implementation measures (and §5 #6 probation review explicitly preserves room for the integration scout's mitigation to prove or disprove its keep). The §9 mitigations as written are honest plan-statements, not overconfident assertions.

---

## 7. "Retrieval stance vs verifier-derived Pitfalls Compendium has philosophical tension"

**Source:** Provocator / overconfidence-audit lane (CONCERN).

**Finding (paraphrased):** A scout in retrieval-stance receives a compendium of verifier-derived lessons. This is internally tense — the scout "knows to look for X because verifier-Y found a GAP at Z" is implicitly running a verification-derived checklist while producing retrieval-shaped output.

**Rejection reasoning.** Not actionable. The §5 #5 cross-surface dispatch test catches any actual drift in stance behavior. The philosophical concern doesn't change observable behavior — the scout still returns retrieval-shaped output (file:line evidence, no Codex-category findings). A compendium that primes the scout's lookup priors is not the same as the scout grading its output. No spec change is responsive to this finding.

---

## 8. "Refresh during active session — no read-during-write contract"

**Source:** Provocator / failure-mode-analysis lane.

**Finding (paraphrased):** If the Imperator triggers a compendium refresh while a Consul session has dispatched (or is about to dispatch) a specialist, the agent file is overwritten mid-flight.

**Rejection reasoning.** The Imperator triggers refresh manually. He can simply not-trigger during active recon. Worst case: the next dispatch reads the freshly updated file (which is the correct intent of refresh). Building a read-during-write serialization mechanism for a hand-crafted, magistrate-controlled non-issue is unjustified machinery. Acknowledged as a known operational consideration; no spec change.

---

## 9. "Refusal mechanism reliability beyond §5 #5 single test"

**Source:** Provocator / assumption-extraction + negative-claim-attack lanes.

**Finding (paraphrased):** §5 #5 verifies the refusal contract with one cross-surface dispatch test. One positive test does not establish reliability; LLM agents trained on helpfulness routinely soften scope contracts. If refusal degrades in even 5% of dispatches, "wrong dispatch is one wasted call" is false.

**Rejection reasoning.** Every Consilium agent's discipline is LLM behavioral commitment, not structural enforcement: Censor's grading discipline, Provocator's lane scoping, Soldier's TDD adherence, Tribunus's stance selection — all rely on prompt-engineered behavior. Holding specialists to a unique reliability standard (statistical reliability proof at spec stage) is unjustified.

The §4.1.1 filesystem-access constraint added in iteration 2 *does* address the strongest version of this concern: even if prose-refusal degrades, the specialist cannot read cross-surface files, which structurally bounds the cost of a wrong dispatch. Beyond that, the §5 #5 single test is sufficient for MVP; if reliability drifts in operation, we will see it and revise.

---

## Closing note

The Provocator lanes earned their keep on iteration 1 — eighteen findings produced concrete, addressable improvements that are now in the iteration-2 spec. These nine rejections are the magistrate's judgment, made on merit, with reasoning recorded so future verification rounds do not re-litigate them.
