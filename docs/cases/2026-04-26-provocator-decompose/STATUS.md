---
status: march-complete
opened: 2026-04-26
target: consilium
agent: claude
type: infra
sessions: 1
current_session: 1
---

## Current state

**March complete on castra branch `case/2026-04-26-provocator-decompose`** (worktree at `.worktrees/provocator-decompose/`). All 16 plan tasks executed across 11 commits (`e7de307` through `ed7e27c`). Both final gates pass: drift script reports 11 agents in sync with canonical Codex + 5 lane agents in sync with canonical persona body; tribune-staleness check is clean. Five user-scope lane agents created at `~/.claude/agents/consilium-provocator-{overconfidence,assumption,failure-mode,edge-case,negative-claim}.md` (verified by drift script; not committed to repo per design — outside Consilium repo).

**Note on main concurrency.** Main advanced 4 commits during the march (Imperator's concurrent work): `1219b31` (principales prompt), `dd1ae4b` (principales test), `2fdfa7e` (tribune-protocol-schema), `388c1e0` (tribune-log-schema + Campaign Review boundary). No file collisions with this case's edits — Imperator added 4 new files in `claude/mcps/principales/` and `claude/skills/references/verification/`; this case modified `protocol.md` and `templates/*.md` in the same `verification/` directory but did not touch the new schema files. Triumph will need to fold main's commits into the castra (rebase or merge) before merging back.

## What's next

Triumph: present options to Imperator for closing the campaign. The session-level smoke tests (Tests 1-9 in `smoke-tests.md`) require fresh `/consul` sessions to execute and are NOT runnable from this implementing session — the Imperator runs them post-merge.

## Sequencing dependencies

- Edits to `claude/skills/references/verification/protocol.md` apply on top of the post-Custos state of that file. The Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) lands first.
- Sibling case `2026-04-26-kimi-principales-v1` creates `claude/skills/references/verification/lanes.md` (Task 15). No file collision; terminology disambiguation lives in this spec.
- Sibling case `2026-04-26-tribune-persistent-principales` proposes a Codex amendment for "Persistent Orchestrator." No file collision; concept-level overlap with Aggregation Contract resolved (tribune-persistent scopes to Tribunus only).

## Open questions

(none — all three brief questions resolved in iteration 1 deliberation; iteration-2 verifier findings disposed of inline; iteration-3 verifier findings disposed of inline per `decisions.md`)
