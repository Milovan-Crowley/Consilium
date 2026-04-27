---
case: 2026-04-26-tribune-persistent-principales
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

---

## Entry: 2026-04-26 — Plan iteration 1 — Provocator MISUNDERSTANDING #4 (SendMessage substrate verification) escalated and resolved

**Type:** decision
**Actor:** Imperator
**Trigger:** Plan iteration 1 verification returned a sharpened recurrence of an earlier-overridden MISUNDERSTANDING. Provocator argued the Imperator-demonstrated transcript proves the persistent named-agent primitive works in *some* harness mode at conversation scale, but the plan extrapolates to four unverified claims: (i) `Agent({name: "tribune-w1"})` is a valid Agent-tool invocation in `/legion` SKILL.md context (executed via the implicit harness, not the conversation), (ii) `SendMessage({to: "tribune-w1"})` is callable from a SKILL.md body, (iii) the agent persists across 15+ task-cycles WITH code implementation between cycles (different from conversation-cycle scale), (iv) `name` is an acceptable Agent-tool parameter. The earlier verification round had flagged the same primitive's existence as MISUNDERSTANDING; the Imperator overrode with transcript evidence; Provocator now argues the override didn't address the harness-mode-vs-runtime distinction.
**Decision:** Accept mitigations. Plan iteration 2 adds a pre-spawn smoke check (Task 15) that dispatches one ephemeral `tribune-smoke` and immediately `SendMessage`s it; failure halts and falls back to ephemeral Patrol for the entire legion. This concretely verifies (i), (ii), (iv) at runtime. Concern (iii) — persistence across 15 code-execution cycles — is bounded by the lifetime cap, crash recovery (`tribune-w<N>-recover` naming), and ephemeral fallback. Together these mitigations are sufficient; B-1 proceeds without a separate substrate-verification spike.
**Rationale:** Imperator response: *"Accept mitigations."* Consul assessment: option 1 of the three offered (accept / spike-PR / override) is the right call. The pre-spawn smoke is concrete substrate verification; the bounds (15-task lifetime + crash recovery + ephemeral fallback) cap worst-case impact at "B-1 degrades to current ephemeral Tribunus" — the exact behavior the system has today. A failure of the load-bearing primitive does not silently corrupt verification; it surfaces immediately at Legion start and produces a known-good fallback path.
**Plan SHA:** 0be6b739e98dea11ec561d603d28b5a2d966c425
