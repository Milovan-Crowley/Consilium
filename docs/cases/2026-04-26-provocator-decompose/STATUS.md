---
status: draft
opened: 2026-04-26
target: consilium
agent: claude
type: infra
sessions: 1
current_session: 1
---

## Current state

Spec iteration 3 drafted. Iteration 2 was re-reviewed by Censor and Provocator in parallel (0 MISUNDERSTANDING, ~10 GAP, ~6 CONCERN, 6 SOUND after dedup and synergy). Imperator authorized iteration 3 with no further re-dispatch. Eleven fixes applied. Awaiting Imperator review at the gate.

## What's next

After Imperator approves the iteration-3 spec: issue edicts (the implementation plan), then Praetor + Provocator plan verification, then Custos field-check (once the in-flight `2026-04-26-custos-edicts-wiring` lands), then Legion or March execution.

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-kimi-principales-v1` creates `claude/skills/references/verification/lanes.md` (Task 15). No file collision; terminology disambiguation lives in this spec.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision; concept-level overlap with Aggregation Contract resolved (tribune-persistent scopes to Tribunus only).

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline; iteration-3 verifier findings disposed of inline per `decisions.md`)
