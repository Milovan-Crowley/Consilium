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

Spec iteration 2 drafted. Iteration 1 was reviewed by Censor and Provocator in parallel; the Consul addressed 11 GAPs and 9 CONCERNs (after dedup and synergy promotion across 4 clusters) and adopted them as iteration 2. Awaiting Imperator review at the gate. Optional re-dispatch of verification per protocol (mandatory only on finding recurrence).

## What's next

After Imperator approves the iteration-2 spec: issue edicts (the implementation plan), then Praetor + Provocator plan verification, then Custos field-check (once the in-flight `2026-04-26-custos-edicts-wiring` lands), then Legion or March execution.

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision, but the Codex-amendment concept must be reconciled with this work's Aggregation Contract before either ships.

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline per `decisions.md`)
