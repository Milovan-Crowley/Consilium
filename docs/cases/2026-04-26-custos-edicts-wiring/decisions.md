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

---

## Entry: 2026-04-26 — Plan iteration 1 — Praetor CONCERN P1 (line-citation brittleness) rejected

**Type:** decision
**Actor:** Consul
**Trigger:** Praetor verification of plan iteration 1 returned CONCERN: "Required-reading citation may go stale if the user-scope agent file is reorganized." The citation `~/.claude/agents/consilium-custos.md` lines 100–110 in the Authoring Awareness subsection (Task 4) hardcodes line numbers, which can drift when the canonical Codex (which sits below the persona at line 141+) grows or shrinks and the file is rebuilt via `check-codex-drift.py --sync`. Praetor noted the canonical persona at `claude/skills/references/personas/custos.md` already has different line numbers (87–101) for the same section.
**Decision:** Reject the CONCERN. Keep the dual line-range + section-name anchor as currently worded.
**Rationale:** The plan's Authoring Awareness wording already includes BOTH the line range (`lines 100–110`) AND the section name (`the "How I Work — The Six Walks" section`) as redundant anchors. Stale line numbers degrade precision but do not break the citation — the section name still works as a lookup anchor. Praetor's suggested fix (switch to section-name-only) would lose the precision the line range provides when accurate. The current wording is the dual-anchor solution Praetor would recommend; the CONCERN is observing fragility that is already mitigated. CONCERN handled by acknowledging the line range may degrade over time without the citation breaking.
**Plan SHA:** b557a43

---

## Entry: 2026-04-26 — Plan iteration 1 — Provocator CONCERN V1 (decisions.md voluntariness) rejected

**Type:** decision
**Actor:** Consul
**Trigger:** Provocator verification of plan iteration 1 returned CONCERN: "Recording in `decisions.md` is voluntary unless something checks." The new CONVENTIONS Audit Artifacts section names "log in `decisions.md`" at multiple callsites in the dispatching phase (gate decisions, overrides, verdicts, contradictions, session-resumption choices) but no script enforces that entries were actually written. Provocator suggested a final-gate Python script that walks `decisions.md` against the conversation transcript would catch missing entries.
**Decision:** Reject the CONCERN. Recording remains voluntary at the discipline layer; programmatic enforcement is out of scope per spec.
**Rationale:** Programmatic enforcement of `decisions.md` entries would require either (a) a transcript-walking script that knows when an entry should have been written — which is brittle and adds tooling debt for marginal gain — or (b) a runtime hook that refuses to advance the dispatcher state until the entry is written, which is invasive and fragile to prose-driven dispatcher behavior. The Roman discipline model the Codex codifies treats audit recording as a soldier-discipline obligation, not a gate. The Imperator review gate at the end of the consul cycle is the human enforcement: the consul presents the summary; if a `decisions.md` entry is missing, the Imperator notices and asks. If practice shows recurring recording-discipline failures across cases, a post-hoc walking script can be added later; the current case has no evidence of the failure mode. CONCERN observed honestly and handled by leaving enforcement to discipline + Imperator review. (Recursive irony noted: this rejection of a CONCERN about voluntary recording is itself recorded voluntarily.)
**Plan SHA:** b557a43

---

## Entry: 2026-04-26 — Plan iteration 1 — fixes applied for accepted findings (VG1 / VG2 / VG3 / PG1 / P2 / V2)

**Type:** decision
**Actor:** Consul
**Trigger:** Praetor and Provocator returned 1 GAP each (Praetor PG1; Provocator VG1, VG2, VG3) and 2 CONCERNs each (Praetor P1, P2; Provocator V1, V2) on plan iteration 1.
**Decision:** Accept and fix inline (per Codex auto-feed loop) for VG1, VG2, VG3, PG1, P2, V2. Reject with reasoning logged separately for P1 and V1 (see two prior entries).
**Rationale:**
- **VG1 (Authoring Awareness placement drift):** Provocator caught two deviations — placement (after Fixes paragraph instead of after Symbols paragraph) and heading level (H3 instead of spec-literal H2). Plan revised: placement restored to spec-literal "after Symbols paragraph, before Fixes paragraph" so "Fixes are made inline..." remains Review Before Dispatch's closing sentinel; H3 retained with separate decisions.md entry to be appended at Task 4 execution time (see Task 4 Step 4 in the plan) for the H3-vs-H2 deviation. Imperator may override at legion-awaits review.
- **VG2 (final-gate scripts framing):** Provocator caught that drift+staleness scripts only scan their own scopes (6 user-scope agent files; tribune skill dir) and do NOT scan files this work modifies. Plan revised: Task 6 framing rewritten to label these as "collateral-safety gates" that verify "no collateral damage" rather than "this work is clean." Actual verification of this work is per-task Read-after-Edit + smoke tests + CONVENTIONS lint.
- **VG3 (plan-modification gate has no SHA-recording mechanism):** Provocator caught that "the SHA the plan-verification dispatch saw" had no recording surface. Plan revised in three places: (1) CONVENTIONS schema gains a `**Plan SHA:**` conditional field (required for `verdict` and `revert` entries); (2) Task 5 gate #4 wording switches to `git diff <plan-path>` (working tree vs HEAD; assumes standard flow of commit-before-verification, which is documented in the existing edicts skill); (3) Task 5 session-resumption clause uses `git rev-parse HEAD:<plan-path>` against the latest verdict entry's recorded `**Plan SHA:**` field. Plus a Verdict Action subsection intro sentence requiring all verdict/revert entries to populate Plan SHA.
- **PG1 (Task 5 step 3 should verify whitelist phrase strings):** Praetor caught that "exactly 10 entries" count check would pass even with typos. Plan revised: Step 3 verification gains explicit verbatim phrase enumeration with character-level checks (apostrophe codepoint, comma-space spacing).
- **P2 (skip whitelist `no` collision risk with adjacent gate-decision prompt):** Praetor caught that bare `no` in the Custos-skip whitelist could be mis-interpreted if the Imperator answers `no` to the immediately-preceding plan-modification gate prompt. Plan revised: gate #4 prompt switches to explicit reply tokens (`redispatch` / `proceed`) with a clarification trigger for any other reply (including bare `no`). Skip whitelist remains as-stamped by Imperator.
- **V2 (skip syntax Unicode/quote bypass gaps):** Provocator caught that macOS smart-quote substitution (`don't` → `don't`) breaks the whitelist match, and that the trim rule strips bold/italic/code/blockquote/list markers but NOT surrounding quotes — inconsistent with the override matcher's quote handling. Plan revised: trim rule extended to strip straight quotes (`"`, `'`) and curly quotes (`"`, `"`, `'`, `'`), then normalize remaining curly quotes to ASCII before whitelist match.

All inline fixes landed on plan iteration 2.
**Plan SHA:** <iteration 2 commit SHA, populated when iteration 2 commit lands>
