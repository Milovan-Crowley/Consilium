---
status: routed
opened: 2026-04-25
target: consilium
agent: claude
type: infra
sessions: 1
current_session: 1
---

## Current state

Routed. Swap complete (Stage 7) on 2026-04-25. Monorepo live at `/Users/milovan/projects/Consilium` with `claude/`, `codex/`, `docs/` subdirs. Old layouts at `/Users/milovan/projects/Consilium-old`, `/Users/milovan/projects/Consilium-codex`, `/Users/milovan/projects/consilium-docs` remain on disk for the 24–48h confidence period. Stage 8 cleanup is the Imperator's call once confidence is established.

## What's next

- Daily use validates that `/consul`, `/tribune`, `/legion`, `/checkit`, and Codex agents all behave correctly.
- Commit and push regularly during the confidence period — the monorepo's git history is the real rollback path.
- After 24–48h of confident daily use, the Imperator runs Stage 8 cleanup (commands documented in plan.md Task 11 Step 2). Status transitions to `closed` with `closed_at: <YYYY-MM-DD>`.

## Open questions

(none)
