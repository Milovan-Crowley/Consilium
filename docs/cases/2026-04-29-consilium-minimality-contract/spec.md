# Consilium Minimality Contract Spec

**Status.** Draft for Imperator review.
**Date.** 2026-04-29.
**Target.** Codex execution doctrine, Codex verifier doctrine, Codex Legatus protocol, Claude Soldier dispatch template, and the project architecture doc. No verification-stack changes. No new agents. No plan-format changes. No model-routing changes. The diagnosis path (Medicus, Tribune, diagnosis packet, known-gaps, fix-thresholds) is out of scope.
**Purpose.** Codify "smallest correct change" as a doctrinal rule operating across implementer and verifier surfaces, with a closed list of named triggers for any extra structure and explicit verifier authority to flag unjustified additions.

## Summary

A new doctrinal contract — the Minimality Contract — that:

- Makes "smallest correct change" the default for Soldier and Centurion implementation across both Claude and Codex runtimes.
- Defines a closed list of allowed triggers for adding structure beyond that default.
- Names a non-exhaustive list of over-engineering smells.
- Gives verifiers (Tribunus per task; Censor at spec or campaign review) authority to flag unjustified additions as `CONCERN` by default and `GAP` when the structure changed observable behavior or violated a domain invariant.
- Preserves the existing tactical-vs-strategic distinction, the existing finding-category semantics, and the deviation-as-improvement rule.

The Contract is enforced through five surface amendments: two Codex doctrine files, one Codex protocol file, one Claude dispatch template, and one architectural pointer in `claude/CLAUDE.md`. No new agent files. No new template files. No new lint scripts. The plan format protocol is left unchanged. The Tribunus and Legion shapes are unchanged.

## Evidence Basis

Current state, verified directly in the repo at the time of writing:

- `codex/source/doctrine/execution-law.md` (19 lines) defines `Ask before guessing`, work-status vocabulary, and the tactical-vs-strategic distinction. It does not codify "smallest correct change," does not define a trigger list, and does not name over-engineering smells. The closest existing language — "Tactical adaptation is allowed: moved file path, import syntax, small type mismatch" — addresses adaptation away from the plan, not unrequested structure inside the plan.
- `codex/source/doctrine/verifier-law.md` (19 lines) defines findings (`MISUNDERSTANDING`, `GAP`, `CONCERN`, `SOUND`), chain-of-evidence, confidence discipline, and the deviation rule. The deviation rule covers deviations away from the plan ("If implementation deviates from the plan but is clearly better and justified, that is not drift"). It does not address additions beyond the plan that are unrequested but not clearly improvements.
- `codex/source/protocols/legatus-routing.md` (150 lines) carries Centurion Dispatch Law, Fix Thresholds, Medusa Backend Execution, and a closing Execution Doctrine block. The closing block reads: "Keep steps small enough that a Centurion can execute without inventing strategy. Do not ask Centurions to both discover and build if a Speculator or Interpres should answer first. Halt on real ambiguity instead of hoping verification catches it later." There is no minimality clause.
- `claude/skills/legion/implementer-prompt.md` (113 lines) is the Soldier dispatch template. The Self-Review section currently asks "Did I build only what was ordered? (YAGNI)" — advisory, not operational. There is no trigger-naming gate.
- `claude/skills/legion/SKILL.md` (393 lines) defines the Legatus march, Tribunus mini-checkit per task, Campaign review at end, and Debug Fix Intake. The Tribunus is referenced through a separate template; the Legion SKILL itself does not enumerate verifier finding axes. Out of scope for this spec.
- `claude/CLAUDE.md` (project architecture) describes Personas, Architecture, Commands, Codex drift check, Tribune staleness check, and machine-switch recovery. There is no entry that names cross-surface implementation disciplines.
- `codex/source/protocols/plan-format.md` (15 lines) requires `Goal / Scope in / Scope out / Ordered tasks / Verification` and a per-task shape (`one clear owner rank / one repo lane / one verification point / no giant omnibus tasks`). It does not carry trigger declarations, action tiers, risk classes, owner-policy fields, model-policy fields, waves, or dependency graphs. The Contract operates on existing acceptance-criteria fields and requires no new plan fields.
- The Codex drift mechanism is canonical at `docs/codex.md` and propagated to user-scope agents (`consilium-{censor,praetor,provocator,tribunus,soldier}.md`) by `claude/scripts/check-codex-drift.py`. Codex doctrine edits flow into the Claude-side dispatch agents through this sync, so a single doctrine amendment reaches both runtimes.
- `/Volumes/Samsung SSD/Downloads/consilium-upgrades.md` is an Imperator-supplied idea dump for upgrades. It is not an approved plan. Branch commands, runtime examples, model-routing changes, light/heavy agent splits, plan-format expansions, verification-stack scripts, padded table separators, and the Action Tier 0/1/2/3 system are explicitly rejected by the Imperator's directive and inherit no spec status from being mentioned in the dump.

## Problem

Three observable failure modes inside Consilium implementations:

1. **Defensive scaffolding the plan never asked for.** Soldiers and Centurions ship `try/catch` blocks, retry harnesses, fallback branches, broad error handlers, and helpers that wrap a single call site — none traceable to a named requirement. The diff grows. Reviewers cannot tell what is load-bearing.
2. **Cleanup-by-stealth.** Implementers refactor adjacent code "while they are in there." The diff conflates intent with drift. The Imperator cannot trace the result back to the spec.
3. **Verifier authority gap.** The current verifier-law deviation rule addresses deviation away from the plan; it has no clause for additions beyond the plan that are correct-but-unrequested. Findings on unjustified additions land as `CONCERN` by convention rather than by codified rule, and are easy to wave off without trace-back.

The cumulative effect is implementations larger than the spec required, harder to review, and easier to drift from the Imperator's approved intent.

## Goals

- Establish a single doctrinal source of truth for smallest-correct-change discipline.
- Make the rule operational at execution time — the implementer must name a trigger or remove the structure — not advisory.
- Give verifiers explicit authority to flag unjustified additions, anchored in the existing finding-category semantics.
- Apply the rule symmetrically across Claude (Soldier and Legion) and Codex (Centurion and Legatus) runtimes through doctrine inheritance.
- Preserve the existing tactical-vs-strategic distinction, the finding categories, the chain-of-evidence rule, and the deviation-as-improvement rule.

## Non-Goals (Hard Boundaries)

The Imperator's directive defines explicit non-goals. Restated here as binding spec constraints:

- **No model-routing changes.** Opus stays the default for verifiers; existing soldier-grade rules in `claude/skills/legion/SKILL.md` are unchanged. No reasoning-effort downgrades, no Sonnet defaults, no Haiku light tier.
- **No light/heavy agent splits.** No `consilium-soldier-light`, no `consilium-tribunus-heavy`, no copy-and-rewrite generation scripts. The active agent set is unchanged.
- **No expansion of the verification stack.** Same Tribunus, same Censor, same Praetor, same Provocator. No new templates under `claude/skills/references/verification/`. No lint scripts, no plan-conflict scanners, no verifier wrappers.
- **No plan-format changes.** `codex/source/protocols/plan-format.md` is preserved unchanged. No Action Tier field, no Owner field, no Wave field, no Dependency Graph, no Review Policy field, no Rollback field. The Contract operates on existing acceptance-criteria fields.
- **No risk-tier system.** The dump's Action Tier 0/1/2/3 apparatus is rejected. The Contract leaves a forward-compatibility hook (one trigger that activates only if such tiers are introduced separately in a future case) but does not introduce them in this spec.
- **No debugging surface changes.** The Medicus, the diagnosis packet, the `/tribune` skill, the case-file flow, `known-gaps.md`, `known-gaps-protocol.md`, and `fix-thresholds.md` are out of scope. Debugging stays separate from Tribunus and Legion. The Centurion's discipline reaches debug-fix execution only through inherited `execution-law.md`, not through any new dispatch-routing rejection clause.
- **No padded table separators.** Any tables introduced respect the project rule of `|-|-|` minimum separators.
- **Not implemented in the spec-writing pass.** This spec defines the contract and the surface obligations. It does not edit code in this pass.

## The Contract

### C1. Default

The smallest correct change that satisfies the task's acceptance criteria is the default. A one-line correct fix is preferred over a multi-line defensive structure that the orders did not request. A Centurion or Soldier who adds unrequested architecture has drifted even when the code is clean.

### C2. Allowed Triggers

Extra structure beyond the default — new abstractions, helpers, branches, fallbacks, retries, error-handling layers, or extra tests — is permitted only when at least one named trigger applies. The implementer cites the trigger in the report. The list is closed:

- **T1. Acceptance criterion.** A specific criterion in the task's orders requires the structure.
- **T2. Risk-tier or action-control invocation** — only when the plan or dispatch envelope explicitly defines such controls. The current plan format does not carry tiers; T2 is therefore dormant in the present system. The Contract is forward-compatible with a future tiering layer introduced in a separate case, but introduces no such layer here.
- **T3. Existing codebase pattern.** The structure mirrors a pattern already established in the touched module. The implementer cites the precedent.
- **T4. Failing test or observed runtime failure.** A test the implementer ran, or one cited in the orders, demonstrates the failure the structure addresses.
- **T5. Cited domain invariant.** A documented invariant from `$CONSILIUM_DOCS/doctrine/` requires the structure (examples: money-path idempotency, tenant boundary, workflow ownership, link.create discipline).

If no trigger applies, the structure is removed before the implementer reports.

### C3. Over-Engineering Smells

The following additions, when not justified by an allowed trigger, count as over-engineering:

- new abstractions
- defensive wrappers
- retry systems
- fallback branches
- new helpers
- broad error handling
- unrelated cleanup
- extra tests outside the acceptance surface

The list is the named smell set; verifiers may cite other unjustified structure under the same rule. The eight names anchor the discussion.

### C4. Verifier Authority

Verifiers that see implementation output — the Tribunus per task, and the Campaign review triad (Censor, Praetor, Provocator) at end-of-campaign — may flag over-engineering with chain-of-evidence. Spec-stage and plan-stage verifiers see no implementation and have no over-engineering surface. The verifier names the structure, names the missing trigger, and names the finding category:

- **`CONCERN`** by default — the structure is unrequested but does not change observable behavior or violate a domain invariant.
- **`GAP`** when the unjustified structure changed observable behavior, broke a contract, or violated a documented invariant. The verifier cites the invariant.
- **`SOUND` with note** when the implementer added structure that, on inspection, is a clear improvement. The deviation-as-improvement rule from `verifier-law.md` is preserved without modification.

A bare "GAP: defensive scaffolding" without source-evidence-conclusion chain is noise, per the existing chain-of-evidence rule.

## Required Behavior — Surface Obligations

The Contract is enforced through edits at five surfaces. Per-surface prose, exact insertion points, and final wording are plan territory; the spec defines what each surface must convey.

### S1. Codex Execution Doctrine — `codex/source/doctrine/execution-law.md`

`execution-law.md` gains a Minimality clause that conveys C1, C2 (full trigger list with T2 marked dormant), and C3 (the eight smell names) in execution-law's terse style. This surface is read by Centurion-front, Centurion-back, Centurion-primus, and the Legatus through their system-prompted Codex.

### S2. Codex Legatus Protocol — `codex/source/protocols/legatus-routing.md`

`legatus-routing.md` gains a single Minimality block in the protocol body that:

- Restates the C1 default for Centurions executing approved work.
- Names the allowed-trigger list by cross-reference to `execution-law.md`.

No changes to debug-fix intake routing, fix-threshold rules, or dispatch rejection conditions. The Contract reaches debug-fix execution through the Centurion's inherited `execution-law.md`, not through any new dispatch-routing clause.

### S3. Codex Verifier Doctrine — `codex/source/doctrine/verifier-law.md`

`verifier-law.md` gains a clause that conveys C4: a verifier may flag over-engineering as `CONCERN` by default, and as `GAP` when the unjustified structure changed observable behavior or violated a documented invariant. The deviation-as-improvement rule is preserved verbatim. The chain-of-evidence rule is restated as it applies to over-engineering findings (name the structure, name the missing trigger, name the category).

This surface is read by Tribunus, Censor, Praetor, and Provocator on both runtimes. After the edit, the Codex drift mechanism (`python3 claude/scripts/check-codex-drift.py --sync`) propagates the clause into the user-scope agent files at `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier}.md`. The drift sync is part of plan execution, not new infrastructure.

### S4. Claude Soldier Template — `claude/skills/legion/implementer-prompt.md`

The Soldier dispatch template gains a Minimality Contract block, read by the Soldier before he begins work. The block conveys C1, lists C2 triggers and C3 smells, and promotes the existing "Did I build only what was ordered? (YAGNI)" advisory question into an operational gate of the form: "For every helper, branch, abstraction, fallback, retry, or test in my diff, I can name the trigger from the allowed list; if I cannot name the trigger, I remove the structure before reporting." The exact wording is plan territory; the obligation is that the question becomes operational rather than advisory.

The Soldier's report format and status vocabulary (`DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT`) are unchanged. The Tribunus inherits authority through the verifier-law amendment in S3; no instruction is added at the Legion SKILL level.

### S5. Project Architecture Note — `claude/CLAUDE.md`

A single line under Architecture (or a short one-line "Disciplines" entry) names the Minimality Contract and points to `codex/source/doctrine/execution-law.md` and `codex/source/doctrine/verifier-law.md` as canonical. No body changes elsewhere in `claude/CLAUDE.md`. This entry exists only for fresh-session discoverability; it is not load-bearing for enforcement and may be dropped at the Imperator's discretion without affecting any other obligation.

### S6. What Stays Untouched

The implementation plan must not touch:

- `claude/skills/legion/SKILL.md` — Legatus dispatch flow is unchanged. The Tribunus inherits over-engineering authority through verifier-law sync; no SKILL-level instruction is added.
- Any verification template under `claude/skills/references/verification/templates/` — the Contract's authority lives in doctrine, not in template axes.
- `codex/source/protocols/plan-format.md` — no new fields, no new task-shape rules.
- Any role file under `codex/source/roles/` — roles inherit doctrine; no per-role amendment is required.
- Diagnosis surfaces: `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`, `$CONSILIUM_DOCS/doctrine/known-gaps.md`, `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`, `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`, the `/tribune` skill, the case-file diagnosis flow, and the Debug Fix Intake section of `claude/skills/legion/SKILL.md`.
- The Principales MCP package, agent manifests, and any model-routing configuration.

## Expected Active File Surfaces

The implementation plan should inspect and amend exactly these files, in this order:

- `codex/source/doctrine/execution-law.md` (S1)
- `codex/source/doctrine/verifier-law.md` (S3)
- `codex/source/protocols/legatus-routing.md` (S2)
- `claude/skills/legion/implementer-prompt.md` (S4)
- `claude/CLAUDE.md` (S5)

After Codex-side edits, the plan must run the Codex drift sync (`python3 claude/scripts/check-codex-drift.py --sync`) so the user-scope agent files at `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier}.md` inherit the new clauses, then run the drift-check verifier (`python3 claude/scripts/check-codex-drift.py`) and confirm clean.

## Acceptance Criteria

1. `codex/source/doctrine/execution-law.md` contains a Minimality clause with the C1 default, the C2 trigger list (T1 through T5, with T2 marked dormant in the present plan format), and the C3 eight-smell list.
2. `codex/source/doctrine/verifier-law.md` contains an over-engineering authority clause matching C4: `CONCERN` default, `GAP` when behavior or invariant affected, deviation-as-improvement preserved, chain-of-evidence enforced.
3. `codex/source/protocols/legatus-routing.md` contains a Minimality block that restates C1 and cross-references `execution-law.md` for the trigger list. No changes to fix-threshold sections, no changes to debug-fix intake rejection rules.
4. `claude/skills/legion/implementer-prompt.md` contains a Minimality Contract block before the work begins, and the YAGNI self-review question is replaced or supplemented with the operational trigger-naming gate.
5. `claude/CLAUDE.md` references the Minimality Contract once with a pointer to canonical doctrine files, or — at the Imperator's discretion — is left unchanged.
6. No new agent files exist after the change. No new template files exist. No new lint scripts exist. No new MCP tools exist.
7. `codex/source/protocols/plan-format.md` is byte-unchanged.
8. `claude/skills/legion/SKILL.md` is byte-unchanged.
9. No diagnosis-path file is amended: `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`, `known-gaps.md`, `known-gaps-protocol.md`, `fix-thresholds.md`, and the Debug Fix Intake section of `claude/skills/legion/SKILL.md` remain byte-unchanged.
10. `python3 claude/scripts/check-codex-drift.py` reports clean after the Codex-side edits and the sync run.
11. The diff is small and concentrated. Doctrine files gain on the order of five to ten lines each; `legatus-routing.md` gains a short cross-reference block; `implementer-prompt.md` gains one block plus an edited self-review item; `claude/CLAUDE.md` gains at most a single line.

## Verification Checks

Required after implementation:

- `grep -rn "smallest correct change"` over `codex/source/` and `claude/skills/legion/` returns hits in `execution-law.md`, `legatus-routing.md`, and `implementer-prompt.md`.
- `grep -rn "Minimality Contract"` returns hits in `execution-law.md`, `verifier-law.md`, `legatus-routing.md`, and `implementer-prompt.md` — and in `claude/CLAUDE.md` if S5 was kept.
- The eight C3 smell names appear as a contiguous list in `execution-law.md`.
- `git diff -- codex/source/protocols/plan-format.md` is empty.
- `git diff -- claude/skills/legion/SKILL.md` is empty.
- `git diff -- "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md" "$CONSILIUM_DOCS/doctrine/known-gaps.md" "$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md" "$CONSILIUM_DOCS/doctrine/fix-thresholds.md"` is empty.
- `find ~/.claude/agents -name "consilium-*-light.md" -o -name "consilium-*-heavy.md"` returns nothing.
- `python3 claude/scripts/check-codex-drift.py` exits 0.
- A spot-read of one user-scope agent body (e.g. `~/.claude/agents/consilium-tribunus.md`) confirms the verifier-law over-engineering clause was synced.

## Confidence Notes

- **C1, C2 (T1, T3, T4, T5), C3, C4** — High. The Imperator's directive defines these explicitly and the source dump's wording aligns with the directive.
- **T2 (dormant trigger)** — Medium. The Imperator wrote "risk tier/action controls if present" and the present plan format has no such controls. T2 is phrased as forward-compatible-but-dormant. If the Imperator wants T2 dropped entirely from the trigger list, the list collapses to four (T1, T3, T4, T5) and nothing else in the spec changes.
- **S5 (CLAUDE.md touch)** — Medium. The Imperator named `claude/CLAUDE.md` as a verify surface, not necessarily a touch surface. A single-line architectural pointer aids future-session discoverability but is not load-bearing for enforcement. The spec stands without S5; the plan may drop it on Imperator instruction.
- **Tribunus operational use of verifier-law authority** — Medium. The Tribunus inherits authority through `verifier-law.md` sync. Whether the Tribunus actively checks for over-engineering on every per-task pass depends on the existing mini-checkit template's axes, which are out of scope per the Imperator's surface boundaries. If the template's axes are interpreted as a closed list, a follow-up case may surface the gap. This spec does not bundle that change.
- **Codex drift sync as plan-execution step** — High. The sync mechanism is canonical (documented in `claude/CLAUDE.md`, automated by `check-codex-drift.py`); running it after Codex-side edits is normal maintenance, not new infrastructure.
