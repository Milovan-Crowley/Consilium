# Consilium Simplification Spec

**Status.** Draft for Imperator review.
**Date.** 2026-04-28.
**Target.** Claude-side Consilium skills and shared verification doctrine in this repo.
**Purpose.** Remove the workflow machinery that made Consilium expensive, scope-expanding, brittle, and defensive. Restore a smaller officer model that catches real mistakes without turning every case into a verification campaign.

## Summary

Consilium should return to this active workflow:

- Spec verification: Censor + one Provocator.
- Plan verification: Praetor + one Provocator.
- Execution verification: fresh per-task Tribunus mini-checkit.
- Campaign review: Censor + Praetor + one Provocator when the work warrants final campaign review.

The active workflow must drop:

- five-lane Provocator decomposition
- differential re-verify
- confidence-map targeting
- lane merge protocol
- default Custos dispatch
- Tribunus-design
- `tribune-protocol.md`
- persistent Tribunus-executor
- Principales/Kimi dispatch from active skills
- `task_start_sha`, `sampled`, SendMessage, and protocol SHA machinery

This is a simplification spec, not a rewrite into another framework.

## Evidence Basis

This spec is grounded in the current repo state:

- `claude/skills/consul/SKILL.md` currently includes a Confidence Map, five Provocator lanes, merge protocol, and differential re-verify.
- `claude/skills/references/verification/protocol.md` currently defines differential re-verify, lane failure handling, and merge protocol.
- `claude/skills/references/verification/templates/spec-verification.md` currently dispatches Censor + five Provocator lanes.
- `claude/skills/references/verification/templates/plan-verification.md` currently dispatches Praetor + five Provocator lanes.
- `claude/skills/edicts/SKILL.md` currently dispatches Custos by default and then dispatches Tribunus-design to produce `tribune-protocol.md`.
- `claude/skills/legion/SKILL.md` currently routes through persistent Tribunus-executor, SendMessage, `task_start_sha`, `sampled`, protocol SHA checks, and mini-checkit fallback branches.
- `claude/skills/references/verification/templates/tribune-persistent.md` currently contains the persistent executor template and Principales lane dispatch.
- `docs/cases/2026-04-26-kimi-principales-integration/spec.md` is explicitly halted.
- `docs/cases/2026-04-26-kimi-principales-v1/spec.md` built a substrate only; its real Moonshot smoke was manual, not automated.
- The Principales MCP package builds and tests, but active workflow integration is the broken part.

## Problem

The current workflow has four failures.

1. Verification now creates work instead of only testing the work. Five lanes, merge rules, synergy promotion, and differential re-verify turn verifier output into a second authoring system.
2. Confidence maps became attack fuel. Passing confidence annotations to verifiers makes the verifier chase the author's certainty rather than the artifact's actual contract.
3. Legion now depends on fragile orchestration. Persistent named agents, SendMessage, protocol files, SHA matching, sampled counterfactuals, and restart branches are load-bearing, token-heavy, and not reliably supported.
4. Principales is not ready for the active path. The substrate requires structured claims, evidence bundles, and artifact slices. That is useful lab machinery, not a drop-in verifier for live Consilium workflows.

The common root is over-design. Each new defensive branch tried to protect an unproven layer instead of removing the layer.

## Goals

- Restore the default Consilium flow to a small number of first-class officers.
- Make verifier output narrower and less likely to widen spec or plan scope.
- Remove brittle runtime dependencies from `/legion`.
- Quarantine Principales from active workflows while preserving its code and historical cases for future experiments.
- Make the implementation easy to verify with text search and normal repo checks.
- Leave historical case docs intact unless a later plan explicitly archives them.

## Non-Goals

- Do not delete the Principales MCP package in this cleanup.
- Do not physically erase historical specs, plans, decisions, or case evidence.
- Do not invent a new verifier role to replace the removed machinery.
- Do not add feature flags that keep the complex path alive as an active default.
- Do not redesign Codex-side agents unless an active Claude-side reference forces it.
- Do not implement this spec in the spec-writing pass.

## Required Behavior

### 1. Spec Verification

`/consul` uses exactly two verification officers for normal spec verification:

- Censor for domain correctness and completeness.
- Provocator for adversarial review.

Remove from active spec verification:

- five Provocator lanes
- lane trigger declarations
- differential re-verify
- lane merge protocol
- synergy promotion
- thin-SOUND re-asks
- confidence map as verifier input

When a spec materially changes after verification, rerun Censor and Provocator in full. For tiny copy or formatting changes that do not alter meaning, the Consul may state that no re-verification is needed and why.

### 2. Plan Verification

`/edicts` uses exactly two verification officers for normal plan verification:

- Praetor for plan viability, ordering, dependencies, and collision risk.
- Provocator for adversarial review.

Remove from active plan verification:

- five Provocator lanes
- plan overconfidence lane
- plan-WHY citation machinery
- trigger declarations
- differential re-verify
- lane merge protocol
- confidence annotations passed to verifiers

When a plan materially changes after verification, rerun Praetor and Provocator in full. Do not fast-path unchanged sections by lane.

### 3. Edicts End State

`/edicts` ends at "The Legion Awaits" after the plan is verified and accepted.

Remove from the default path:

- Custos dispatch as a required post-plan gate
- plan modification gate tied to Custos
- Custos skip grammar
- Custos verdict parsing and re-walk machinery
- Tribunus-design dispatch
- plan + protocol approval bundle
- `tribune-protocol.md` generation

If Custos survives, it must be optional and explicitly invoked by the operator for shell/env/baseline readiness. It must not sit in the default plan path and must not reintroduce protocol authoring or multi-stage gates.

### 4. Legion Execution

`/legion` returns to the pre-persistent execution model:

- dispatch a fresh soldier per task
- after each task, dispatch ephemeral Tribunus mini-checkit
- if Tribunus finds a GAP, dispatch a bounded fix soldier and re-check
- after all tasks, run the existing final campaign review when warranted

Remove from active `/legion`:

- persistent Tribunus-executor
- named-agent SendMessage flow
- `tribune-protocol.md`
- `tribune-log.md` as required runtime substrate
- 15-task lifetime window
- smoke-check branch tree
- protocol absent/empty/malformed/SHA-mismatch routing
- `task_start_sha`
- `sampled`
- counterfactual cadence
- Principales/Kimi lane dispatch

Fallback behavior should be simple because the default path is already the fallback: fresh ephemeral Tribunus per task.

### 5. Principales Quarantine

Keep `claude/mcps/principales/` as a dormant lab artifact. Do not delete it in this cleanup.

Remove Principales from active workflows:

- no active `SKILL.md` should require `mcp__consilium-principales__verify_lane`
- no active verification template should dispatch Kimi lanes
- no active Tribune or Legion path should require Principales availability
- no active workflow should require an operator-side MCP restart

Allowed remaining references:

- the MCP package itself
- historical case docs
- README or lab notes that clearly mark Principales as dormant
- this simplification case

Future Principales integration requires a new spec based on manual empirical results, not this cleanup.

### 6. Verification Scope Firewall

Verifier findings may block only when they identify one of these:

- violation of the approved goal
- contradiction with an explicit frozen contract
- conflict with an existing domain invariant
- missing coverage of required acceptance criteria
- realistic first-pass execution failure caused by the artifact as written

Verifier findings must not become blockers when they are only:

- speculative future features
- nice-to-have hardening
- alternate architecture preferences
- invented edge cases outside the stated goal
- defensive handling for harness behavior the workflow no longer depends on

Those can be recorded as non-blocking notes, but they do not widen the spec, plan, or edict.

### 7. Defensive Coding Rule

The cleanup must remove defensive branches that exist only because the workflow depends on unproven machinery.

New rule: if a workflow primitive is uncertain or unsupported, do not build a branch tree around it. Either remove the dependency or halt and surface the uncertainty.

Acceptable defensive handling is narrow:

- input missing where the active workflow actually requires input
- tool command fails and the failure blocks the stated task
- verifier does not return and the user must decide whether to retry or proceed

Unacceptable defensive handling:

- multi-branch protocol parsing for artifacts the simplified workflow no longer produces
- synthetic fallback routes for optional lab tools
- SHA policing for a generated protocol artifact
- restart choreography for long-running verification agents

## Expected Active File Surfaces

The implementation plan should inspect and likely touch only these active workflow surfaces:

- `claude/skills/consul/SKILL.md`
- `claude/skills/edicts/SKILL.md`
- `claude/skills/legion/SKILL.md`
- `claude/skills/references/verification/protocol.md`
- `claude/skills/references/verification/templates/spec-verification.md`
- `claude/skills/references/verification/templates/plan-verification.md`
- `claude/skills/references/verification/templates/mini-checkit.md`
- `claude/skills/references/verification/templates/tribune-persistent.md`
- `claude/skills/references/verification/templates/tribune-design.md`
- `claude/skills/references/verification/lanes.md`
- active doctrine or README files only if they advertise the removed default path

Historical docs under `docs/cases/` are read-only for this cleanup unless the implementation plan proposes a specific status note or archive step.

## Rollback Anchors

The implementation does not need to use literal `git revert`, but it should use the earlier simpler behavior as the target:

- `/consul` before the five-lane Provocator dispatch.
- verification protocol before differential re-verify and merge protocol.
- spec and plan templates before five-lane decomposition.
- `/edicts` before default Custos dispatch and before Tribunus-design.
- `/legion` before persistent Tribunus-executor.

Manual surgical edits are preferred over blind revert if later unrelated changes exist in the same files.

## Acceptance Criteria

1. `/consul` spec verification dispatches only Censor + Provocator by default.
2. `/edicts` plan verification dispatches only Praetor + Provocator by default.
3. No active workflow sends a confidence map to verifiers.
4. No active workflow uses differential re-verify, trigger declarations, lane merge protocol, or five-lane Provocator dispatch.
5. `/edicts` no longer requires Custos before yielding to "The Legion Awaits".
6. `/edicts` no longer dispatches Tribunus-design or produces `tribune-protocol.md`.
7. `/legion` no longer depends on persistent Tribunus, SendMessage, `task_start_sha`, `sampled`, protocol SHA matching, or Principales.
8. Per-task verification in `/legion` is the ephemeral mini-checkit path.
9. Principales remains present as dormant code/docs but is absent from active skill dispatch paths.
10. Historical case docs remain intact.
11. The final diff is smaller than the removed machinery would suggest: deletion and simplification are the point.

## Verification Checks

Required after implementation:

- Search active skills and verification templates for removed active terms: `Five-Lane`, `five lanes`, `Differential Re-Verify`, `trigger declaration`, `Merge Protocol`, `Confidence Map`, `SendMessage`, `task_start_sha`, `sampled`, `tribune-protocol`, `persistent Tribunus`, and `mcp__consilium-principales`.
- Confirm any remaining hits are either historical docs, dormant Principales package docs, or this cleanup case.
- Run markdown/text validation already used by the repo, if present.
- If the Principales package is untouched, do not spend time proving its runtime behavior. A quick `npm test` / `npm run build` is optional only if implementation touches `claude/mcps/principales/`.

## Custos Decision

Custos default removal is included in this spec. If the Imperator wants a reduced optional Custos later, that should be a separate small spec after the simplification lands.
