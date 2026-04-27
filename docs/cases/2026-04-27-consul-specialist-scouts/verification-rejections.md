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

## Closing note (Iteration 1 — spec verification)

The Provocator lanes earned their keep on iteration 1 — eighteen findings produced concrete, addressable improvements that are now in the iteration-2 spec. These nine rejections are the magistrate's judgment, made on merit, with reasoning recorded so future verification rounds do not re-litigate them.

---

# Verification Rejections — Iteration 2 (Plan)

After plan iteration 1 was written, the Praetor + five Provocator lanes verified the plan. The merge produced ~14 GAPs and ~9 CONCERNs. Substantive findings were applied as iteration-2 plan revisions (T2 hardening, T6/T7/T8 serialization markers, T9 extended edit window, new T12 for `testing-agents.md`, T13 manual-task discipline, T3-T5 commit ritual simplification, wording cleanup, admin-surface spec patch). Five CONCERNs are rejected here on merit per the Codex (CONCERN may be politely rejected with reasoning when the magistrate has context the verifier lacked).

---

## 10. "T11 whitespace-normalization defense"

**Source:** Provocator / failure-mode-analysis lane.

**Finding (paraphrased):** T11's Edit `old_string` for the verification protocol §2 table row has no whitespace-normalization defense. If the actual line in protocol.md has trailing whitespace, leading spaces, or alternative space-runs around pipe characters that the plan's `old_string` does not reproduce, Edit fails.

**Rejection reasoning.** The Edit tool's failure mode is loud (the tool errors with a clear "old_string not found" message). The soldier reads the actual line via `sed -n` in Step 1 and corrects the `old_string` if needed. Defensive paranoia at the spec layer when the runtime catches the issue with a clear error message is over-engineering.

---

## 11. "T1 single-Write fragility (90 lines)"

**Source:** Provocator / failure-mode-analysis lane.

**Finding (paraphrased):** T1 Step 1 writes ~90 lines of markdown content as a single Write call. Markdown content includes nested code fences and escape sequences in regex examples. If the Write tool's content has any escape-issue, the Write fails or produces malformed content. There is no incremental write strategy.

**Rejection reasoning.** Single Write calls of 90 lines are routine in the Consilium plan-execution flow. Failures are loud (file structurally malformed when the next task reads it via `cat`). Mitigation already exists: T2 Step 1 reads the template before using it; if the template is malformed, T2 halts. Adding incremental-write machinery for a routine operation is over-engineering.

---

## 12. "T6 grep verification expectation fragility re future references"

**Source:** Provocator / overconfidence-audit lane.

**Finding (paraphrased):** T6 Step 3 verifies `grep -cF '\`consilium-scout-' SKILL.md` returns 4. If a future reference to `consilium-scout-` is added to consul SKILL.md outside the dispatch list, this verification breaks.

**Rejection reasoning.** Speculative future-edit risk. The verification tests the iteration-1 / iteration-2 implementation state, not all possible future states. Plans are not robust to all future edits; they verify the current intent. If a future edit changes the count, the verification step is updated then.

---

## 13. "T8 hidden-character drift"

**Source:** Provocator / failure-mode-analysis lane.

**Finding (paraphrased):** T8's `old_string` is a single-line heading. If the file has a hidden character difference (CRLF vs LF, BOM, invisible Unicode) on that heading line, the Edit fails.

**Rejection reasoning.** The Consilium repo uses LF-encoded plain markdown by convention (verified across all skill files). Hidden-character drift would surface in many other places before T8. Defensive paranoia for a non-existent failure mode.

---

## 14. "Phase 1.5 numbering convention break"

**Source:** Provocator / edge-case-hunting lane (CONCERN).

**Finding (paraphrased):** T8 inserts `### Phase 1.5: Compendium Refresh Ritual` between Phase 1 and Phase 2. The Consul skill's Phase numbering convention is currently 0, 1, 2, 3 (linear integers). Introducing Phase 1.5 breaks the convention.

**Rejection reasoning.** Aesthetic concern, not functional. The "Phase 1.5" naming reflects the section's logical placement (refresh is a Phase 1 sub-topic, not a new full phase). Renaming to a non-numbered subsection title is fine if the Imperator prefers, but functional behavior is identical either way. Magistrate's call: keep "Phase 1.5" as the working name.

---

## Closing note (Iteration 2 — plan verification)

The Praetor + Provocator's five lanes earned their keep on iteration-1 plan verification — fourteen GAPs and four CONCERNs produced concrete improvements that are now in the iteration-2 plan. Most notably: the Praetor caught a load-bearing factual error in the spec (admin UI lives at `divinipress-backend/src/admin/`, not `divinipress-store/src/admin/`) that propagated into T3, T4, T9 — exactly the class of mistake the whole specialist-scout architecture is built to prevent. The verifiers worked.

These five rejections are the magistrate's judgment on merit, recorded so future verification rounds do not re-litigate them.
