# Consilium Codex Evals

These are lightweight golden-task evals for prompt tuning.

Purpose:
- test the new ranks against recurring Divinipress reality
- compare prompt revisions without relying on vibes
- catch drift when personality expands and discipline collapses

Current model:
- manual evaluation
- fixed task prompts
- expected success criteria

Run these after material changes to:
- `source/roles/`
- `source/doctrine/`
- `source/doctrine/common.md`
- `$CONSILIUM_DOCS` behavior
- `source/protocols/`
- `source/manifest.json`

## Tasks

- `tasks/01-consul-routing.md`
- `tasks/02-frontend-interpretation.md`
- `tasks/03-backend-speculator-trace.md`
- `tasks/04-contract-arbiter.md`
- `tasks/05-centurio-front.md`
- `tasks/06-centurio-back.md`
- `tasks/07-backend-medusa-routing.md`
- `tasks/08-centurio-back-medusa.md`
- `tasks/09-backend-medusa-review.md`
- `tasks/10-tribune-initial-diagnosis.md`
- `tasks/11-storefront-debugging.md`
- `tasks/12-admin-debugging.md`
- `tasks/13-medusa-backend-debugging.md`
- `tasks/14-known-gap-discipline.md`
- `tasks/15-admin-hold-debugging.md`
- `tasks/16-install-staleness.md`
- `tasks/17-debugger-routing.md`
- `tasks/18-feedback-loop.md`

## What Good Looks Like

- `consilium-consul` routes to the right rank instead of reading broadly itself.
- `consilium-interpres-*` explains truth clearly without pretending to be a tracer.
- `consilium-speculator-*` stays narrow, cited, and fast.
- `consilium-arbiter` produces `MATCH`, `DRIFT`, or `UNRESOLVED` with evidence.
- `consilium-centurio-*` stays in lane and escalates cross-repo ambiguity instead of guessing.
- Medusa backend lanes preserve route-thin, workflow-first, module-isolated structure.
- Tribune diagnosis starts with evidence and routing, not fixes.
- Known gaps are rechecked before use and never treated as proof by memory.
- Shared-docs adoption resolves `$CONSILIUM_DOCS`, uses `$CONSILIUM_DOCS/doctrine/` for runtime shared doctrine, and keeps `source/doctrine/` as prompt-source law.
- Storefront, admin, and backend debugging split by surface, then converge through `consilium-arbiter` when payload contracts disagree.
- Install-staleness probes verify runtime symlinks and fresh-thread requirements before changing source.

## Scoring

Keep scoring simple:
- `PASS`
- `PASS_WITH_DRIFT`
- `FAIL`

Log:
- prompt version
- agent version
- what regressed
- what improved

Rollout threshold:
- no `FAIL`
- at most one `PASS_WITH_DRIFT`
- no drift on auth, tenant isolation, money, checkout, proof status, order lifecycle, install path, runtime path, or routing
