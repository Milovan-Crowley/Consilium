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
