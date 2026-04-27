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

Spec iteration 3 approved. Custos case landed. Plan iteration 1 committed at `e578b03` (16 tasks). Praetor + Provocator (pre-decomposition single-Provocator) verified iteration 1 in parallel: 0 MISUNDERSTANDING, 9 GAPs (after dedup), 9 CONCERNs, 14 SOUNDs. Imperator authorized iteration 2 with "fix how you think makes sense" + "Remove #1 entirely" (drop Pre-flight 8). Iteration 2 applied: 7 GAP fixes + 5 adopted CONCERNs + 3 explicitly-rejected CONCERNs. Major structural change: Task 5 restructured to mechanical Bash+heredoc pattern (matches Tasks 6-9). See `decisions.md` for full disposition log.

## What's next

Plan iteration 2 awaiting commit, then optional re-dispatch (auto-feed loop cap is 2 iterations; iteration 2 is the final auto-fix round; iteration 3 of plan verification, if needed, requires Imperator authorization). Then Custos field-check, then Imperator review gate, then Legion or March execution.

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-kimi-principales-v1` creates `claude/skills/references/verification/lanes.md` (Task 15). No file collision; terminology disambiguation lives in this spec.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision; concept-level overlap with Aggregation Contract resolved (tribune-persistent scopes to Tribunus only).

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline; iteration-3 verifier findings disposed of inline per `decisions.md`)
