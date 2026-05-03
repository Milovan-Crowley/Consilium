---
status: routed
opened: 2026-05-01
target: consilium
agent: codex
type: infra
sessions:
  - 2026-05-01-spec
  - 2026-05-01-plan
current_session: 2026-05-01-plan
---

# Consul Spec Contract Inventory

Spec and implementation plan for adding a Contract Inventory requirement to Consul-authored specs and introducing the Tabularius verifier rank for mechanical Inventory coverage checks.

Primary artifact: `spec.md`
Implementation artifact: `plan.md`

## Current State

Spec revised after verifier findings, then routed to implementation planning. Implementation completed in the `feature/consul-spec-contract-inventory` castra worktree. During that implementation pass, repo-local generation, user-scope install, repo parity, installed parity, and legacy drift checks passed.

This publish refresh has been merged with current `main` and repo parity has been rerun. Current installed-runtime parity is not treated as publish proof here because the installed runtime points at `main` until Campaign 4 lands and is reinstalled.

Main has since merged the 3b hook runtime inventory and Edicts Files-block contract campaigns. This case remains limited to the Campaign 4 Spec Contract Inventory and Tabularius work.

## What's Next

- [x] Spec revised after Censor and Provocator findings.
- [x] Implementation plan drafted.
- [x] Task 0 preflight baseline captured.
- [x] Plan verification cleared.
- [x] Implementation executed.
- [x] Generated and installed runtime parity proved during Campaign 4 implementation pass.
- [x] Publish-refresh repo parity rerun.
- [x] Campaign review closed.
- [ ] Post-merge installed parity proved from main runtime after reinstall and fresh session.

## Open Questions

(none yet)
