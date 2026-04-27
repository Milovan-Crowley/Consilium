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

Spec iteration 3 approved by Imperator. Custos case has landed (per Imperator). Plan written and committed at `e578b03` — 16 tasks covering protocol.md updates, canonical persona note, 5 lane agent files, drift script extension, two template restructures, consul + edicts SKILL updates, CLAUDE.md updates, smoke tests. Pre-flight 3 will verify Custos landmarks at execution time. Awaiting plan verification.

## What's next

Self-review complete (placeholder scan + symbol-consistency check). Next: dispatch Praetor + Provocator on the plan (using the still-existing pre-decomposition single-Provocator template — the new five-lane template ships with this case but doesn't apply to verifying this plan itself). Then Custos field-check, then Imperator review gate, then Legion or March execution.

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-kimi-principales-v1` creates `claude/skills/references/verification/lanes.md` (Task 15). No file collision; terminology disambiguation lives in this spec.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision; concept-level overlap with Aggregation Contract resolved (tribune-persistent scopes to Tribunus only).

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline; iteration-3 verifier findings disposed of inline per `decisions.md`)
