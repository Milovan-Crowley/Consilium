---
status: draft
opened: 2026-05-01
target: consilium
agent: codex
type: infra
sessions: 1
current_session: 1
---

## Current state

Light draft opened to preserve the team-share readiness reconnaissance before runtime hook/output changes land.

This case is intentionally not implementation-ready yet. Milovan plans real runtime changes first; the final readiness spec should be hardened after those changes are in place.

## What's next

- [ ] Land the separate runtime hook/output-type changes.
- [ ] Re-run readiness reconnaissance against the updated Claude/Codex surfaces.
- [ ] Harden this spec into a phalanx-friendly master cleanup scope.
- [ ] Issue edicts only after the runtime target is stable.

## Open questions

- Which inherited Superpowers files are useful enough to rewrite versus remove?
- What exact Claude install command should Gavin and Ivan use after runtime changes land?
- What exact Codex install command should Gavin and Ivan use after runtime changes land?
