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

Spec iteration 3 approved. Custos case landed. Plan iteration 1 committed at `e578b03`. Praetor + Provocator (pre-decomposition single) iter-1 verification: 0 MISUNDERSTANDING, 9 GAPs, 9 CONCERNs, 14 SOUNDs. Imperator authorized iteration 2 with "fix how you think makes sense" + "Remove #1 entirely" (drop Pre-flight 8). Plan iteration 2 committed at `fe560c6` with 7 GAP fixes + 5 adopted CONCERNs + 3 explicitly-rejected CONCERNs. **Custos field-check on iteration 2 returned `OK TO MARCH`** (6 walks; 7 SOUNDs; 1 CONCERN — stale Hard-Scope path reference, adopted inline). Halted at the legion-awaits gate per Imperator's "do not use legion yet" instruction.

## What's next

Awaiting Imperator's call at the legion-awaits gate. Options on the table: (a) the Legatus marches alone via `consilium:march`; (b) the Legion via `consilium:legion`; (c) deferred dispatch for any reason the Imperator names. Imperator pre-emptively excluded option (b) ("do not use legion yet").

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-kimi-principales-v1` creates `claude/skills/references/verification/lanes.md` (Task 15). No file collision; terminology disambiguation lives in this spec.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision; concept-level overlap with Aggregation Contract resolved (tribune-persistent scopes to Tribunus only).

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline; iteration-3 verifier findings disposed of inline per `decisions.md`)
