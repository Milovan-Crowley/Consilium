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

---

## Entry: 2026-04-26 — Iteration count override (iteration 3 authorized)

**Type:** override
**Actor:** Imperator
**Trigger:** Iteration 2 of `spec.md` was re-reviewed by Censor and Provocator. Counts: 0 MISUNDERSTANDING, ~10 GAPs (after dedup and synergy), ~6 CONCERNs, 6 SOUNDs. Volume was similar to iteration 1 — iteration-2 contracts opened new attack surfaces, particularly around schema operational primitives (the dominant theme). The Codex auto-feed loop caps at 2 iterations; iteration 3 requires Imperator authorization.
**Decision:** Authorize iteration 3 of the spec revision under Imperator authority, exceeding the Codex 2-iteration cap. Do NOT re-dispatch verification after iteration 3 — present the final spec at the Imperator review gate without another Censor+Provocator round. The diminishing-returns threshold has been reached; further iteration would surface edges-of-edges rather than load-bearing fixes.
**Rationale:** The Imperator's response was a one-letter "A" selecting Option A (authorize iteration 3, no re-dispatch) from the Consul's two-option presentation. Eleven fixes are applied in iteration 3, addressing every load-bearing finding from both verifiers. The schema-without-primitive cluster (the dominant verifier theme across iterations 1 and 2) is closed by defining matching rules, intersection rules, and the iteration-1 sanity check rule explicitly. Other findings are addressed inline. The auto-feed loop continues to bind future iterations of plan verification and Campaign review at 2 iterations max; this override applies to spec verification of this case only.

---

## Entry: 2026-04-26 — Iteration 3 verifier-findings disposition

**Type:** decision
**Actor:** Consul
**Trigger:** Per the iteration-3 authorization above, eleven fixes were applied to address Censor and Provocator iteration-2 findings.
**Decision:** Apply all eleven fixes inline as iteration 3. Major changes:

1. **Trigger declaration schema operational primitives** — keyword matching (case-insensitive whole-word), section_pattern matching scope, intersection rule (disjunctive), iteration-1 sanity check rule (against finding's Evidence/Source fields). Closes the dominant "schema-without-primitive" cluster from both verifiers.
2. **§11 attribution clarification** — lane is suffix on role tag in Consul merge presentation; `protocol.md` §11 preserved verbatim. Closes the Provocator's GAP on Aggregation Contract vs. §11 (the iteration conflict resolved on merit).
3. **Lane Failure Handling tightened** — "any malformation, any kind, one re-dispatch total → escalate." Thin-SOUND cap restructured to one re-ask per merge round (prevents recursive thin-SOUND spawn).
4. **Drift coverage broadened** — Codex + persona body; plan extends script or documents persona-body gap.
5. **Criterion 3 broadened** — fires for spec-asserted invariants OR doctrine-asserted invariants binding for the artifact's domain.
6. **Sequencing audit completed** — `2026-04-26-kimi-principales-v1`'s in-flight `verification/lanes.md` added; terminology disambiguation extended.
7. **Plan-WHY citation form tightened** — markdown links required; section-name-only forbidden; revision behavior specified.
8. **§8 readability note** — plan SHOULD add §8 annotation cross-referencing Aggregation Contract.
9. **Success Criteria confidence split** — quantitative criteria (1–2) Low; qualitative criteria (3–6) Medium.
10. **"Covers entire artifact" sentinel** — `coverage: "specific" | "entire_artifact"` in schema.
11. **Template-drift rollback note** — future maintainers rolling back five-lane structure must restore legacy template's negative-claim attack pass.

**Rationale:** Standard finding-disposition per the auto-feed loop, applied to iteration-2 findings under iteration-3 authorization. SOUNDs from iteration 2 (litmus test, Custos sequencing, Aggregation §2/§8, criterion 3 disjunction, tribune-persistent overlap framing, template-drift acknowledgment) are preserved unchanged. The five-lane composition itself, the litmus test, and the Custos sequencing constraint have now survived two adversarial reviews each. The spec is fit for plan dispatch.

---

## Entry: 2026-04-26 — Plan iteration 1 verifier-findings disposition

**Type:** decision
**Actor:** Consul
**Trigger:** Plan iteration 1 (commit `e578b03`, 3546 lines, 16 tasks) was reviewed by the pre-decomposition single Praetor and Provocator in parallel per the Codex plan-verification protocol. Combined: 0 MISUNDERSTANDING, ~9 GAPs (after dedup across both verifiers — Praetor 1 load-bearing + 1 self-demoted; Provocator 7), ~9 CONCERNs, 14 SOUNDs. Imperator-authorized "fix how you think makes sense" + "Remove #1 entirely" (drop Pre-flight 8). The Provocator's most concrete finding was V-GAP-1 (Pre-flight 8 plugin-cache check verifies wrong path) — Consul investigated and confirmed: `~/.claude/plugins/consilium` is a dangling symlink to `/Users/milovan/projects/Consilium/.claude-plugin` which does not exist, AND the cache path the check named also does not exist, yet the plugin loads via an opaque mechanism. Pre-flight check was wrong on its face.

**Decision:** Apply seven GAP fixes and five adopted CONCERNs inline as iteration 2. Three CONCERNs explicitly rejected with reasoning. Iteration 2 changes:

1. **Pre-flight 8 dropped entirely** (Imperator-authorized "Remove #1 entirely"). The plugin-cache deployment story is the Imperator's environment concern, not the plan's; replaced with a one-line note acknowledging the removal and pointing at smoke Test 1 as post-execution deployment verification.
2. **Pre-flight 3 tightened** to verify the post-Custos §2 dispatch table state matches Task 1's anchor exactly (using `grep -A 1` shape check), not just landmark existence.
3. **Task 5 restructured** to use the same `Bash + awk + heredoc` pattern as Tasks 6-9, replacing the inline-Write approach. Eliminates construction-time drift class. Plan size dropped by ~280 lines.
4. **Task 10 exit-code logic fixed** — restructured `main()` end-of-file logic with unified priority (2 → missing/malformed; 1 → drift not resolved; 0 → clean). The previous logic returned 2 with a misleading "Synced" message on the path `args.sync + drift_count > 0 + persona_drift < 0`.
5. **Task 10 diagnostic path documented** — added explicit 5-step diagnosis procedure for "lane drift detected" failures (capture diff → inspect canonical anchors → check for unexpected `## Operational Doctrine` headings → check Codex anchors → escalate with diff).
6. **`{COMMON LANE PREAMBLE}` substitution contract documented** — added explicit substitution-contract paragraph to the Common Lane Preamble section in both spec-verification and plan-verification templates. Dispatcher MUST replace the placeholder with the literal preamble; an un-expanded placeholder is treated as §13 lane-malformation.
7. **Plan-WHY enforcement check added** to plan-verification template's Lane 1 (Overconfidence Audit) prompt — explicit 3-part audit: (a) markdown link required, prose forbidden; (b) link anchor must match an actual heading in the spec (broken anchor = GAP); (c) plan-acknowledged bootstrap deviations accepted as SOUND.
8. **CONCERNs adopted (5):** PERSONA_END `startswith` contract documented in `extract_persona_body` docstring; `campaign-verification.md` reference dropped from Hard Scope (replaced with behavior-bound constraint); Order of Operations gained interruption-recovery note for Tasks 1-3; Tasks 1-3 Step 1 commute claim wording relaxed; Self-review item 5 cross-references the Spec Discipline Rule subsection.
9. **CONCERNs rejected (3) with reasoning preserved in conversation:** Task 14 example replacement preserved (the new shape demonstrates the contract; dual-example would muddy); single-Provocator self-verification attribution accepted as unavoidable bootstrap (Notes for Legatus already documents); nested-fence rendering fragility treated as tool concern not plan concern.

**Rationale:** Standard auto-feed loop application per Codex `protocol.md` §6 finding handling. MISUNDERSTANDINGs absent — no halt. GAPs were tractable in-Consul. CONCERNs evaluated on merit. The Imperator's words on V-GAP-1 ("Remove #1 entirely") were taken as authorization to drop Pre-flight 8 outright. The Imperator's "fix how you think makes sense" delegated the three architectural calls (Task 5 restructure, plan-WHY enforcement option, COMMON LANE PREAMBLE option) to Consul judgment; Consul chose: restructure (mechanical homogeneity wins), plan-WHY check in lane prompt (Option A — lightweight, lives in natural enforcement surface), and explicit substitution contract in templates + SKILLs (Option Y, hybrid — keeps templates compact while making contract auditable). The auto-feed loop cap is 2 iterations; iteration 3 of plan verification, if needed, requires Imperator authorization. SOUNDs from iteration 1 (spec coverage complete; pre-flight ordering correct; anchors stable in consul/edicts/CLAUDE.md/protocol.md; spec discipline rule wording survives; plausibility threshold preserves disjunction; sequencing audit; persona-body extraction narrowly correct; documented bootstrap deviation acceptable; `known-gaps.md` exists) are preserved unchanged.

---

## Entry: 2026-04-26 — Custos verdict on plan iteration 2: OK TO MARCH

**Type:** verdict
**Actor:** Custos
**Trigger:** Imperator replied `proceed` on the plan-modification gate (per `edicts/SKILL.md` Dispatching the Custos phase, gate condition #4 — plan was modified between plan-verification clear at `e578b03` and now at iteration 2 commit `fe560c6`). Plan-modification gate decision logged: `proceed` to dispatch Custos rather than `redispatch` for plan-verification iteration 2. Imperator's full reply: *"Proceed but do not use legion yet."* Custos was dispatched on plan iteration 2 (commit `fe560c6`) per the Custos verification template.
**Decision:** Custos returned `Verdict: OK TO MARCH`. Six walks executed; plan dispatchable. 7 SOUND findings (one per walk plus a Walk-6-continued SOUND on no-other-stale-wording), 1 CONCERN finding from Walk 6 (stale Hard-Scope path reference: `claude/skills/references/personas/consilium-codex.md` — that file does not exist on disk; canonical Codex lives at `docs/codex.md`). The CONCERN is advisory; Custos explicitly noted "the rule 'do not touch X' is satisfied trivially when X does not exist, so dispatch is not blocked." CONCERN adopted inline in this commit: Hard Scope reminder reworded to name the actual canonical path (`docs/codex.md`) with an inline note acknowledging the pre-existing stale reference and pointing at Task 15 Step 3 as the in-flight repair.
**Rationale:** Verdict honored per the §14 Aggregation Contract / §11 attribution rules and the Custos's persona authority over the three-verdict overlay. CONCERN adopted on merit — the patch is a one-line wording tweak that improves operator clarity without affecting plan execution mechanics. Custos's "Do Not Widen" section confirms five magistrate-territory temptations resisted (architecture critique → Provocator; plan-level reordering → Praetor; spec re-litigation → Censor; product scope → Imperator; bootstrap-deviation philosophy → Provocator on spec deployment). No plan-verification-iter-2 re-dispatch is required by the Custos verdict; the Imperator's `proceed` selection (rather than `redispatch`) closed that branch.
**Plan SHA:** `8e9374852f891039106cd2d43fdec4a688148806` (commit `fe560c6` plan blob, the state Custos verified). The same commit's working tree also includes the Hard-Scope CONCERN-adoption patch applied between verdict and this audit-log entry; the post-patch plan SHA differs and is captured by the next git commit referenced by this entry.
