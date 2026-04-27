---
case: 2026-04-26-tribune-persistent-principales
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

---

## Entry: 2026-04-26 — Custos walk 1 BLOCKER — bash-discipline hook + MCP server name + digraph count

**Type:** verdict
**Actor:** Custos (Marcus Pernix)
**Trigger:** First Custos walk on plan iteration 2 (commit `379a670`).
**Verdict:** BLOCKER
**Findings:** Two MISUNDERSTANDINGs (Walk 1: 57+ verification commands blocked by `~/.claude/hooks/bash-discipline.sh`; Walk 2: `mcpServers: - principales` does not match registered MCP key `consilium-principales`); two GAPs (Walk 6: Task 15 Step 4 digraph occurrence count 2 vs actual 5; Walk 1: Task 13 Step 1b for-loop wrapper note); one CONCERN (Walk 6: stale Codex path in `claude/CLAUDE.md` line 32, out-of-scope by Imperator directive); three SOUND (baseline, exclusions, prompt-discovery test).
**Plan SHA:** 0be6b739e98dea11ec561d603d28b5a2d966c425

---

## Entry: 2026-04-26 — Imperator action on Custos walk 1 BLOCKER

**Type:** decision
**Actor:** Imperator
**Trigger:** Custos returned BLOCKER on three substantive findings (bash-discipline hook collision, MCP server name mismatch, digraph occurrence count). Three options offered: (1) patch + full Praetor+Provocator+Custos cycle, (2) patch + Custos-only re-walk, (3) override and proceed.
**Decision:** Imperator directed: *"oy fuckin hell, just remove the fucking hook. DO not expand to fixing claude md right now."* Operator-level removal of the bash-discipline hook from `~/.claude/settings.json` (the `Bash`-matcher PreToolUse entry that pointed to `~/.claude/hooks/bash-discipline.sh`); plan-level patches for MCP server name (Task 10 frontmatter, Task 10 Step 3 verification, Task 16 Step 2a expectation) and digraph occurrence count (Task 15 Step 4 expanded to cover all 5 occurrences). The pre-existing CLAUDE.md doc drift (Walk 6 CONCERN) is explicitly out of scope. Re-dispatch Custos only (option 2 of the BLOCKER decision tree).
**Rationale:** The bash-discipline hook is operator-level configuration; removing it is faster and structurally cleaner than rewriting 57+ verification recipes across the plan. The MCP server name and digraph count fixes are surgical. The CLAUDE.md doc drift is unrelated to B-1's load-bearing surfaces.
**Plan SHA:** 0be6b739e98dea11ec561d603d28b5a2d966c425

---

## Entry: 2026-04-26 — Custos walk 2 PATCH BEFORE DISPATCH — spec §7.1 line 103 stale `principales` token

**Type:** verdict
**Actor:** Custos (Marcus Pernix)
**Trigger:** Re-walk of plan iteration 3 (commit `3c3329c`) after walk 1 BLOCKER was patched. Custos verified bash-discipline hook removal (Walk 1 SOUND), MCP server name correction (Walk 2 SOUND), digraph occurrence count fix (Walk 6 verified 5 matches), prompt-discovery test design (Walk 3 SOUND), baseline regression gates clean (Walk 4 SOUND), `/march` and `/tribune` exclusions hold (Walk 5 SOUND).
**Verdict:** PATCH BEFORE DISPATCH
**Findings:** One GAP (Walk 6: spec §7.1 line 103 still reads ``mcpServers:` adds `principales`.`` — the bare token, not the registered key `consilium-principales`. Plan iteration 3 corrected the implementation surface but the spec lagged). Six SOUND (Walks 1-6 all otherwise cleared). Per protocol: second-walk PATCH BEFORE DISPATCH = exhausted under the Codex 2-iteration cap; default action = escalate to Imperator.
**Plan SHA:** d201f5ed6bdd23164a695f994c8303f3da560df8

---

## Entry: 2026-04-26 — Imperator override on Custos 2-iteration-cap exhaustion

**Type:** override
**Actor:** Imperator
**Trigger:** Custos walk 2 returned PATCH BEFORE DISPATCH with one trivial spec-line GAP. Per protocol, this triggers the 2-iteration-cap escalation. Imperator authorized the patch + proceed instead.
**Decision:** Imperator directed: *"Applt the fix. Do not proceed with legion tho yet."* Apply the one-line spec fix at §7.1 line 103 (`principales` → `consilium-principales` (the registered MCP server key in `~/.claude.json`; the bare token `principales` does NOT match any registered server).) and treat the campaign as Custos-cleared. Hold at the Imperator review gate; do NOT yield to "The Legion Awaits" until the Imperator explicitly authorizes the legion.
**Rationale:** The Custos 2-iteration-cap exists to prevent endless verifier loops on architectural disagreement. This second-walk finding is a single-line documentation drift correction, not architectural disagreement; the patch itself was the Custos's own recommendation. Overriding the cap to apply a trivial scoped fix is a defensible exercise of Imperator authority, distinct from "ignore the verifier's finding and march." The Imperator's instruction to NOT yield to Legion Awaits preserves the plan-and-protocol-bundle Imperator review step from spec §6.1 — even though this is the existing flow (plan-only review before /edicts B-1 modifications take effect), the Imperator may have downstream campaign decisions to make before authorizing the legion.
**Plan SHA:** d201f5ed6bdd23164a695f994c8303f3da560df8

---

## Entry: 2026-04-26 — Plan iteration 1 — Provocator MISUNDERSTANDING #4 (SendMessage substrate verification) escalated and resolved

**Type:** decision
**Actor:** Imperator
**Trigger:** Plan iteration 1 verification returned a sharpened recurrence of an earlier-overridden MISUNDERSTANDING. Provocator argued the Imperator-demonstrated transcript proves the persistent named-agent primitive works in *some* harness mode at conversation scale, but the plan extrapolates to four unverified claims: (i) `Agent({name: "tribune-w1"})` is a valid Agent-tool invocation in `/legion` SKILL.md context (executed via the implicit harness, not the conversation), (ii) `SendMessage({to: "tribune-w1"})` is callable from a SKILL.md body, (iii) the agent persists across 15+ task-cycles WITH code implementation between cycles (different from conversation-cycle scale), (iv) `name` is an acceptable Agent-tool parameter. The earlier verification round had flagged the same primitive's existence as MISUNDERSTANDING; the Imperator overrode with transcript evidence; Provocator now argues the override didn't address the harness-mode-vs-runtime distinction.
**Decision:** Accept mitigations. Plan iteration 2 adds a pre-spawn smoke check (Task 15) that dispatches one ephemeral `tribune-smoke` and immediately `SendMessage`s it; failure halts and falls back to ephemeral Patrol for the entire legion. This concretely verifies (i), (ii), (iv) at runtime. Concern (iii) — persistence across 15 code-execution cycles — is bounded by the lifetime cap, crash recovery (`tribune-w<N>-recover` naming), and ephemeral fallback. Together these mitigations are sufficient; B-1 proceeds without a separate substrate-verification spike.
**Rationale:** Imperator response: *"Accept mitigations."* Consul assessment: option 1 of the three offered (accept / spike-PR / override) is the right call. The pre-spawn smoke is concrete substrate verification; the bounds (15-task lifetime + crash recovery + ephemeral fallback) cap worst-case impact at "B-1 degrades to current ephemeral Tribunus" — the exact behavior the system has today. A failure of the load-bearing primitive does not silently corrupt verification; it surfaces immediately at Legion start and produces a known-good fallback path.
**Plan SHA:** 0be6b739e98dea11ec561d603d28b5a2d966c425

---

## Entry: 2026-04-27 — Campaign Review verdict (Censor + Praetor + Provocator triad)

**Type:** verdict
**Actor:** Censor + Praetor + Provocator (parallel dispatch, post-execution Campaign Review)
**Trigger:** Legion completed all 16 plan tasks; per-task Tribunus mini-checkit returned SOUND on every task. Legatus dispatched the Campaign Review triad per `/legion` skill protocol after the soldier returned DONE on Task 16.
**Verdict:** SOUND for execution; 6 GAPs catalogued in the persistent-pattern wiring (none affect B-1's own execution since B-1 used the OLD ephemeral pattern; all 6 surface only on the next campaign that exercises the new persistent pattern end-to-end).
**Findings (cumulative across triad):**
- 0 MISUNDERSTANDING — mental model is consistent across spec, plan, codex, and implementation.
- 6 GAP (all from Provocator). GAP-1: `plan_id` SHA mismatch detection documented in tribune-design.md and tribune-protocol-schema.md but never wired to `/legion` pre-spawn check. GAP-2: Sampled-flag computation documented in tribune-persistent.md SendMessage Body example but never wired into `/legion`'s Legatus DONE handler. GAP-3: `git diff` semantics ambiguous in tribune-persistent.md (bare `git diff` after Soldier-commits returns empty). GAP-4: Verdict vocabulary collision between Codex categories (MISUNDERSTANDING/GAP/CONCERN/SOUND) and persistent-template verdicts (PASS/CONCERN/FAIL with MISUNDERSTANDING-tagged FAIL convention). GAP-5: `/edicts` says "legion can march on partial-or-empty `tribune-protocol.md`" but `/legion`'s pre-spawn refuses to march without the protocol — deadlock if Tribunus-design crashes twice and Imperator chooses "accept the gap." GAP-6: pre-spawn `verify_lane` "lane not found" string-match doesn't appear in substrate output (substrate returns synthetic-failure docket via `mapFailureToDocket('refused', ...)`).
- 11 CONCERN (3 Censor, 2 Praetor, 6 Provocator). Censor: stale "two-stance" reference in `claude/CLAUDE.md` Maintenance section (Tribunus now has 4 stances); same observation through doctrine-vocabulary lens; tribune-persistent.md counterfactual numbering non-sequential. Praetor: stale Codex location reference in `claude/CLAUDE.md:31` (pre-B-1 drift, out-of-scope); `tribune-design.md` doesn't explicitly authorize empty `lanes_triggered` despite schema allowing it. Provocator: kimi_dockets full-content inlining may explode tribune-log.md size; smoke-check name collision risk; crash recovery doesn't distinguish transient from terminated SendMessage errors; empty-list `lanes_triggered` runbook path not explicit; `/edicts` BLOCKER-override prompt phrasing references "legion-awaits" but flow now routes through Tribunus-Design first; cosmetic deviations (duplicate "After approval, proceed to The Legion Awaits" line at edicts/SKILL.md:432-434; literal `\n` in 2 prose Example March annotations at legion/SKILL.md:229,246 — both pre-disclosed in plan source).
- 26 SOUND (6 Censor, 14 Praetor, 6 Provocator). Provocator SOUNDs: Codex sync to all 6 user-scope agents holds (drift checker confirms); pre-spawn smoke check actually exercises the load-bearing primitive (Agent({name}) + SendMessage round-trip + 30s timeout); counterfactual sampling formula is mathematically correct and boundary-stable; Independence Boundary at Campaign Review enforced consistently across 3 artifacts; the 4 prompt files satisfy all 4 discipline rules from plan Task 2; Persistent Orchestrator class scope-narrowing language is airtight ("the privilege does NOT generalize from the property" closes the future-role drift loophole).
**Plan SHA:** 3c3329cfdcfdb263f4c3d4db14f4a20008d09801

---

## Entry: 2026-04-27 — Imperator decision on GAP fix routing (Option A → mechanical fixes now; design GAPs deferred to B-1.1)

**Type:** decision
**Actor:** Imperator
**Trigger:** Provocator returned 6 substantive GAPs in the Campaign Review. Legatus presented three fix-routing options: (1) auto-feed fix all 6, (2) defer all 6 to B-1.1 follow-up, (3) selectively fix some. The Imperator first asked: *"How auto fix are the fixes? I wanna know room for interpretation, and I want to make sure you won't bust the entire thing on them"* — Legatus categorized the 6 GAPs by interpretation level (mechanical vs design-fork) and risk-to-build (text-only vs new-bug-creating). Imperator then directed: *"A"* (Option A — fix mechanical GAPs now, defer design GAPs).
**Decision:** Dispatch 2 fix soldiers for GAP-2 (mechanical: Sampled flag formula) and GAP-6 (substrate-grounded: docket-shape discriminator). Defer GAP-1 (plan_id SHA parsing strategy depends on tribune-protocol.md format we haven't written yet), GAP-3 (git diff command depends on soldier-commit-pattern decisions), GAP-4 (verdict vocabulary unification vs translation is architectural), GAP-5 (deadlock resolution is a real design fork) to a follow-up campaign B-1.1 with its own spec.
**GAP-2 fix landed:** commit `62dbbfe` — `/legion/SKILL.md` DONE handler now explicitly computes Sampled flag (formula `(plan_index of this task) mod 3 == 0`, deterministic across 15-task window restarts). Tribunus mini-checkit: SOUND.
**GAP-6 fix landed:** commit `cb29fbd` — `tribune-persistent.md` Pre-spawn check replaced with substrate-grounded two-call discrimination strategy. Soldier discovered THREE refused-docket paths in `verify-lane.ts` (vs Provocator's anticipated two — added FS-error catch path at lines 248-252) and wrote a discriminator robust to all three: dispatch a known pre-B-1 lane (`upstream-coverage`) first to detect breaker/degradation; if it succeeds, dispatch `task-plan-match` to detect stale `allowedLanes`. Tribunus mini-checkit: SOUND, flagged as Deviation-as-Improvement (the soldier's expansion to 3 paths is more accurate than the Provocator's 2-path discriminator).
**Rationale:** The 4 deferred GAPs are real but cannot surface during B-1's own execution because B-1 used the OLD ephemeral Tribunus pattern. They surface only on the next campaign that uses the persistent pattern end-to-end. The persistent pattern gates itself behind `tribune-protocol.md` existence (per Task 14's `/edicts` Tribunus-design dispatch and Task 15's `/legion` pre-spawn check), so it cannot accidentally activate before B-1.1 lands. Imperator chose Option B over Option A — declining to declare B-1 complete with deferred GAPs as plain notes, instead opening a follow-up campaign B-1.1 with a tight spec covering the 4 deferred GAPs.
**Next action:** Imperator to invoke `/consul` to brainstorm/spec B-1.1. The Consul should treat this `decisions.md` entry + the Provocator GAP-1/3/4/5 finding evidence as input. B-1.1's scope: address GAP-1, GAP-3, GAP-4, GAP-5 before the persistent pattern is exercised in earnest. The 11 CONCERNs from Campaign Review (advisory) may or may not be in scope for B-1.1 — Consul's call after deliberation.
**Plan SHA:** 3c3329cfdcfdb263f4c3d4db14f4a20008d09801
