# Consilium Minimality Contract Spec

**Status.** Ready for edict after runtime-unification reconciliation.
**Date.** 2026-04-29.
**Target.** Canonical runtime source surfaces: `source/doctrine/execution-law.md`, `source/doctrine/verifier-law.md`, `source/protocols/legatus-routing.md`, `source/skills/claude/legion/implementer-prompt.md`, and `source/skills/claude/references/verification/templates/mini-checkit.md`. Generated and compatibility surfaces are produced by `runtimes/scripts/generate.py`. No new agents. No plan-format changes. No model-routing changes. The diagnosis path (Medicus, Tribune, diagnosis packet, known-gaps, fix-thresholds) is out of scope.
**Purpose.** Codify "smallest correct change" as a doctrinal rule operating across implementer and verifier surfaces, with a closed list of named triggers for any extra structure and explicit verifier authority to flag unjustified additions — at both the per-task layer (Tribunus) and the end-of-campaign layer (Censor, Praetor, Provocator).

## Summary

A new doctrinal contract — the Minimality Contract — that:

- Makes "smallest correct change" the default for Centurio implementation across both Claude and Codex runtimes.
- Defines a closed list of allowed triggers for adding structure beyond that default.
- Names a non-exhaustive list of over-engineering smells.
- Gives implementation-reviewing verifiers explicit authority to flag unjustified additions: the Tribunus per task, and the Campaign-review triad (Censor, Praetor, Provocator) at end-of-campaign. Findings are `CONCERN` by default, `GAP` when the structure changed observable behavior or violated a domain invariant.
- Preserves the existing tactical-vs-strategic distinction, the existing finding-category semantics, the chain-of-evidence rule, and the deviation-as-improvement rule.

The Contract is enforced through edits at five canonical `source/` surfaces: two doctrine files, one Legatus protocol file, one Centurio dispatch template, and one Tribunus mini-checkit dispatch template. No new agent files. No new template files. No new lint scripts. The plan format protocol is left unchanged. The Tribunus and Legion shapes are unchanged in role and ranks; only the Tribunus's existing mission list gains a single Minimality clause to make the doctrinal authority operational at the per-task layer.

## Evidence Basis

Current state, verified directly in the repo at the time of writing:

- `source/doctrine/execution-law.md` is short and defines `Ask before guessing`, work-status vocabulary, and the tactical-vs-strategic distinction. It does not codify "smallest correct change," does not define a trigger list, and does not name over-engineering smells. The closest existing language — "Tactical adaptation is allowed: moved file path, import syntax, small type mismatch" — addresses adaptation away from the plan, not unrequested structure inside the plan.
- `source/doctrine/verifier-law.md` is similarly short and defines findings (`MISUNDERSTANDING`, `GAP`, `CONCERN`, `SOUND`), chain-of-evidence, confidence discipline, and the deviation rule. The deviation rule covers deviations away from the plan ("If implementation deviates from the plan but is clearly better and justified, that is not drift"). It does not address additions beyond the plan that are unrequested but not clearly improvements.
- `source/protocols/legatus-routing.md` carries Centurio dispatch law, Fix Thresholds, Medusa Backend Execution, and a closing Execution Doctrine block. The closing block says to keep steps small enough that implementers can execute without inventing strategy and to avoid pairing discovery and build work. There is no minimality clause.
- `source/skills/claude/legion/implementer-prompt.md` is the Centurio dispatch template. The Self-Review section currently asks "Did I build only what was ordered? (YAGNI)" — advisory, not operational. There is no trigger-naming gate.
- `source/skills/claude/legion/SKILL.md` defines the Legatus march, Tribunus mini-checkit per task, Campaign review at end, and Debug Fix Intake. The Tribunus is referenced through a separate template; the Legion SKILL itself does not enumerate verifier finding axes. Out of scope for this spec.
- `source/skills/claude/references/verification/templates/mini-checkit.md` is the Tribunus dispatch template used after each task. It enumerates a five-item mission (`Plan step match`, `Domain check`, `Reality check`, `Integration check`, `Deviation assessment`) and closes with the disclaimer "No essays. No architectural opinions. No style suggestions." The deviation-assessment axis applies the deviation-as-improvement rule only to plan-divergent implementations; it is not currently scoped to unjustified additions of structure that are inside the plan-task envelope. Combined with the closing disclaimer, the Tribunus's per-task scope as currently written does not surface over-engineering even when verifier doctrine would grant the authority. This is the operational gap addressed by surface obligation §S5.
- `source/skills/claude/references/verification/templates/campaign-review.md` is the end-of-campaign triad dispatch. The Praetor's mission already includes a "Deviation assessment" axis that applies the deviation-as-improvement rule, naturally encompassing unjustified additions. The verifier-law amendment makes this explicit; no template edit is required at the campaign layer.
- `source/protocols/plan-format.md` is short and requires a planning standard with a `Goal:` heading (one sentence), explicit `Scope in:` and `Scope out:`, `Ordered tasks:` (concrete, named, verifiable), and `Verification:` (which rank checks what, and when). The per-task shape rules are: one clear owner rank, one repo lane unless explicitly cross-repo, one verification point when the output can poison later steps, no giant omnibus tasks. There are no trigger declarations, action tiers, risk classes, owner-policy fields, model-policy fields, waves, or dependency graphs. The Contract operates on existing acceptance-criteria fields and requires no new plan fields.
- Runtime unification made `source/` the canonical edit surface. `runtimes/scripts/generate.py` derives `codex/source`, `claude/skills`, `generated/*`, and Codex agent TOMLs. `claude/scripts/check-codex-drift.py` is now an installed-runtime parity wrapper, not a `--sync` mechanism.
- `claude/CLAUDE.md` (project architecture) describes Personas, Architecture, Commands, Codex drift check, Tribune staleness check, and machine-switch recovery. It is named here as a reconnaissance surface only — the Contract is not amended into this file. The Contract is discoverable through the canonical doctrine files that `claude/CLAUDE.md` already references.
- `/Volumes/Samsung SSD/Downloads/consilium-upgrades.md` is an Imperator-supplied idea dump for upgrades. It is not an approved plan. Branch commands, runtime examples, model-routing changes, light/heavy agent splits, plan-format expansions, verification-stack scripts, padded table separators, and the Action Tier 0/1/2/3 system are explicitly rejected by the Imperator's directive and inherit no spec status from being mentioned in the dump.

## Problem

Three observable failure modes inside Consilium implementations:

1. **Defensive scaffolding the plan never asked for.** Centurios ship `try/catch` blocks, retry harnesses, fallback branches, broad error handlers, and helpers that wrap a single call site — none traceable to a named requirement. The diff grows. Reviewers cannot tell what is load-bearing.
2. **Cleanup-by-stealth.** Implementers refactor adjacent code "while they are in there." The diff conflates intent with drift. The Imperator cannot trace the result back to the spec.
3. **Verifier authority gap.** The current verifier-law deviation rule addresses deviation away from the plan; it has no clause for additions beyond the plan that are correct-but-unrequested. Findings on unjustified additions land as `CONCERN` by convention rather than by codified rule, and are easy to wave off without trace-back. Even when the doctrine grants the authority, the Tribunus's dispatch-prompt mission list constrains what the per-task verifier actually checks; without an operational hook, the doctrinal authority is inert.

The cumulative effect is implementations larger than the spec required, harder to review, and easier to drift from the Imperator's approved intent.

## Goals

- Establish a single doctrinal source of truth for smallest-correct-change discipline.
- Make the rule operational at execution time — the implementer must name a trigger or remove the structure — not advisory.
- Give verifiers explicit authority to flag unjustified additions, anchored in the existing finding-category semantics, and operationalize that authority where the dispatch surface currently constrains it.
- Apply the rule symmetrically across Claude and Codex runtimes through canonical source, generated compatibility surfaces, and installed runtime parity.
- Preserve the existing tactical-vs-strategic distinction, the finding categories, the chain-of-evidence rule, and the deviation-as-improvement rule.

## Non-Goals (Hard Boundaries)

The Imperator's directive defines explicit non-goals. Restated here as binding spec constraints:

- **No model-routing changes.** Opus stays the default for Claude verifiers; existing Centurio-grade rules in `source/skills/claude/legion/SKILL.md` are unchanged. No reasoning-effort downgrades, no Sonnet defaults, no Haiku light tier.
- **No light/heavy agent splits.** No `consilium-centurio-*-light`, no `consilium-tribunus-heavy`, no copy-and-rewrite generation scripts. The active agent set is unchanged.
- **No new verification machinery.** Same Tribunus, same Censor, same Praetor, same Provocator. No new templates under `claude/skills/references/verification/`. No new agent ranks. No lint scripts, no plan-conflict scanners, no verifier wrappers. The §S5 amendment to the existing `mini-checkit.md` template adds one Minimality reference inside the already-existing mission list and qualifies the existing closing disclaimer; that edit is not a new template, not a new agent, not a new tool, and stays within the named surface.
- **No plan-format changes.** `source/protocols/plan-format.md` is preserved unchanged. No Action Tier field, no Owner field, no Wave field, no Dependency Graph, no Review Policy field, no Rollback field. The Contract operates on existing acceptance-criteria fields.
- **No risk-tier system.** The dump's Action Tier 0/1/2/3 apparatus is rejected. The Contract leaves a forward-compatibility hook (one trigger that activates only if such tiers are introduced separately in a future case) but does not introduce them in this spec.
- **No debugging surface changes.** The Medicus, the diagnosis packet, the `/tribune` skill, the case-file flow, `known-gaps.md`, `known-gaps-protocol.md`, and `fix-thresholds.md` are out of scope. Debugging stays separate from Tribunus and Legion. The Centurio discipline reaches debug-fix execution only through inherited `execution-law.md`, not through any new dispatch-routing rejection clause.
- **No padded table separators.** Any tables introduced respect the project rule of `|-|-|` minimum separators.
- **Not implemented in the spec-writing pass.** This spec defines the contract and the surface obligations. It does not edit code in this pass.

## The Contract

### C1. Default

The smallest correct change that satisfies the task's acceptance criteria is the default. A one-line correct fix is preferred over a multi-line defensive structure that the orders did not request. A Centurio who adds unrequested architecture has drifted even when the code is clean.

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
- **`SOUND`** when the implementer added structure that, on inspection, is a clear improvement. The reasoning names the improvement and cites the existing deviation-as-improvement rule from `verifier-law.md`. No new finding category is introduced — this is the standard `SOUND` with chain-of-evidence as already required by Codex.

A bare "GAP: defensive scaffolding" without source-evidence-conclusion chain is noise, per the existing chain-of-evidence rule.

## Required Behavior — Surface Obligations

The Contract is enforced through edits at five surfaces. Per-surface prose, exact insertion points, and final wording are plan territory; the spec defines what each surface must convey.

### S1. Execution Doctrine — `source/doctrine/execution-law.md`

`execution-law.md` gains a Minimality clause that conveys C1, C2 (full trigger list with T2 marked dormant), and C3 (the eight smell names) in execution-law's terse style. This surface is read by `consilium-centurio-front`, `consilium-centurio-back`, `consilium-centurio-primus`, and the Legatus after generation/install.

### S2. Legatus Protocol — `source/protocols/legatus-routing.md`

`legatus-routing.md` gains a single Minimality block in the protocol body that:

- Restates the C1 default for Centurios executing approved work.
- Names the allowed-trigger list by cross-reference to `execution-law.md`.

No changes to debug-fix intake routing, fix-threshold rules, or dispatch rejection conditions. The Contract reaches debug-fix execution through the Centurio's inherited `execution-law.md`, not through any new dispatch-routing clause.

### S3. Verifier Doctrine — `source/doctrine/verifier-law.md`

`verifier-law.md` gains a clause that conveys C4 with explicit implementation-stage scoping. The clause text must:

- Scope the over-engineering authority to verifiers that review implementation output (the Tribunus during execution and the Campaign-review triad at end-of-campaign), and explicitly state it does not apply to verifiers reviewing specs or plans.
- State the `CONCERN` default and the `GAP` upgrade conditions (behavior change, contract break, documented-invariant violation).
- Preserve the existing deviation-as-improvement rule verbatim.
- Restate the chain-of-evidence rule as it applies to over-engineering findings (name the structure, name the missing trigger, name the category).

This surface is read by Tribunus, Censor, Praetor, and Provocator on both runtimes after generation and install. The implementation plan must run `python3 runtimes/scripts/generate.py`, install generated Claude agents into `~/.claude/agents`, run `bash codex/scripts/install-codex.sh` for the Codex runtime and skill/config sync, then prove installed parity with `python3 claude/scripts/check-codex-drift.py`.

### S4. Centurio Dispatch Template — `source/skills/claude/legion/implementer-prompt.md`

The Centurio dispatch template gains a Minimality Contract block, read by the Centurio before work begins. The block conveys C1, lists C2 triggers and C3 smells, and promotes the existing "Did I build only what was ordered? (YAGNI)" advisory question into an operational gate of the form: "For every helper, branch, abstraction, fallback, retry, or test in my diff, I can name the trigger from the allowed list; if I cannot name the trigger, I remove the structure before reporting." The exact wording is plan territory; the obligation is that the question becomes operational rather than advisory.

The Centurio's report format and status vocabulary (`DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT`) are unchanged.

### S5. Tribunus Mini-Checkit Dispatch — `source/skills/claude/references/verification/templates/mini-checkit.md`

The Tribunus mini-checkit dispatch prompt's mission list is amended to operationalize the verifier authority granted by §S3 at the per-task layer. The amendment:

- Extends the existing "Deviation assessment" axis (or adds a sibling axis) to name unjustified addition of structure as drift, with reference to the C2 trigger list. The implementer's report is expected to surface trigger names in self-review; the Tribunus checks whether each helper, branch, fallback, retry, or extra test in the diff has a named trigger and applies the C4 finding mapping.
- Qualifies the closing disclaimer "No essays. No architectural opinions. No style suggestions." so it excludes style and stylistic-architecture preferences but explicitly does not exclude Contract findings, which are doctrinal.
- Adds no new mission section beyond a single Contract clause; the dispatch prompt remains patrol-depth, single-pass.

The template file is not duplicated, replaced, or supplemented by a new template. No agent rank changes. The Campaign-review template (`templates/campaign-review.md`) is left byte-unchanged: the Praetor's existing "Deviation assessment" axis at the campaign layer already applies the deviation-as-improvement rule, which the verifier-law amendment now explicitly extends to unjustified additions.

### S6. What Stays Untouched

The implementation plan must not touch:

- `source/skills/claude/legion/SKILL.md` — Legatus dispatch flow is unchanged. The Tribunus's authority is wired through verifier-law generation/install (S3) and the mini-checkit mission amendment (S5); no SKILL-level instruction is added.
- `source/skills/claude/references/verification/templates/campaign-review.md` — Campaign-layer authority follows from the Praetor's existing deviation-assessment axis combined with the verifier-law amendment in §S3.
- `source/skills/claude/references/verification/templates/spec-verification.md`, `plan-verification.md` — spec- and plan-stage verifiers do not see implementation; the Contract has no surface there.
- `claude/CLAUDE.md` — named by the Imperator as a reconnaissance surface, not a touch surface. The Contract is discoverable via the canonical doctrine files.
- `source/protocols/plan-format.md` — no new fields, no new task-shape rules.
- Any role file under `source/roles/` — roles inherit doctrine; no per-role amendment is required.
- Diagnosis surfaces: `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`, `$CONSILIUM_DOCS/doctrine/known-gaps.md`, `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`, `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`, the `/tribune` skill, the case-file diagnosis flow, and the Debug Fix Intake section of `source/skills/claude/legion/SKILL.md`.
- The Principales MCP package, agent manifests, and any model-routing configuration.

## Expected Active File Surfaces

The implementation plan should inspect and amend exactly these files, in this order:

- `source/doctrine/execution-law.md` (S1)
- `source/doctrine/verifier-law.md` (S3)
- `source/protocols/legatus-routing.md` (S2)
- `source/skills/claude/legion/implementer-prompt.md` (S4)
- `source/skills/claude/references/verification/templates/mini-checkit.md` (S5)

After canonical source edits, the plan must run `python3 runtimes/scripts/generate.py`. Generated and compatibility changes are expected in the derived `codex/source`, `claude/skills`, `generated/*`, and affected Codex agent TOMLs only. The plan must then install generated Claude agents into `~/.claude/agents`, run `bash codex/scripts/install-codex.sh` for Codex agents, skills, and config sync, and prove installed runtime parity with `python3 claude/scripts/check-codex-drift.py`.

## Acceptance Criteria

1. `source/doctrine/execution-law.md` contains a Minimality clause with the C1 default, the C2 trigger list (T1 through T5, with T2 marked dormant in the present plan format), and the C3 eight-smell list.
2. `source/doctrine/verifier-law.md` contains an over-engineering authority clause matching C4: explicitly scoped to verifiers reviewing implementation output (Tribunus per task, Campaign-review triad at end-of-campaign), `CONCERN` default, `GAP` when behavior or invariant affected, deviation-as-improvement preserved, chain-of-evidence enforced. The clause states explicitly that spec-stage and plan-stage verifiers do not have over-engineering authority.
3. `source/protocols/legatus-routing.md` contains a Minimality block that restates C1 and cross-references `execution-law.md` for the trigger list. No changes to fix-threshold sections, no changes to debug-fix intake rejection rules.
4. `source/skills/claude/legion/implementer-prompt.md` contains a Minimality Contract block before the work begins, and the YAGNI self-review question is replaced or supplemented with the operational trigger-naming gate.
5. `source/skills/claude/references/verification/templates/mini-checkit.md` contains a Minimality reference inside the Tribunus mission list (either extending "Deviation assessment" or as a sibling axis), and the closing disclaimer is qualified so it does not exclude Contract findings. The template is not duplicated or replaced.
6. No new agent files exist after the change. No new template files exist. No new lint scripts exist. No new MCP tools exist.
7. `source/protocols/plan-format.md` is byte-unchanged.
8. `source/skills/claude/legion/SKILL.md` is byte-unchanged.
9. `claude/CLAUDE.md` is byte-unchanged.
10. `source/skills/claude/references/verification/templates/campaign-review.md`, `spec-verification.md`, and `plan-verification.md` are byte-unchanged.
11. No diagnosis-path file is amended: `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`, `known-gaps.md`, `known-gaps-protocol.md`, `fix-thresholds.md`, and the Debug Fix Intake section of `source/skills/claude/legion/SKILL.md` remain byte-unchanged.
12. `python3 runtimes/scripts/check-runtime-parity.py` reports clean after generation.
13. `python3 claude/scripts/check-codex-drift.py` reports clean after install.
14. The diff is concentrated within the named canonical surfaces above plus generated/compatibility outputs derived from `runtimes/scripts/generate.py`. Specific line counts per surface are plan territory; the spec asserts only that no hand edits land outside the named canonical source surfaces.

## Verification Checks

Required after implementation:

- `rg -n "smallest correct change" source/doctrine source/protocols source/skills/claude/legion/implementer-prompt.md` returns hits in `execution-law.md`, `legatus-routing.md`, and `implementer-prompt.md`.
- `rg -n "Minimality Contract" source/doctrine source/protocols source/skills/claude/legion/implementer-prompt.md source/skills/claude/references/verification/templates/mini-checkit.md` returns hits in `execution-law.md`, `verifier-law.md`, `legatus-routing.md`, `implementer-prompt.md`, and `mini-checkit.md`.
- The eight C3 smell names appear as a contiguous list in `execution-law.md`.
- `git diff -- source/protocols/plan-format.md` is empty.
- `git diff -- source/skills/claude/legion/SKILL.md` is empty.
- `git diff -- claude/CLAUDE.md` is empty.
- `git diff -- source/skills/claude/references/verification/templates/campaign-review.md source/skills/claude/references/verification/templates/spec-verification.md source/skills/claude/references/verification/templates/plan-verification.md` is empty.
- `git diff -- "$CONSILIUM_DOCS/doctrine/diagnosis-packet.md" "$CONSILIUM_DOCS/doctrine/known-gaps.md" "$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md" "$CONSILIUM_DOCS/doctrine/fix-thresholds.md"` is empty.
- `fd -a -H '^consilium-.*-(light|heavy)\.(md|toml)$' "$HOME/.claude/agents" "$HOME/.codex/agents"` returns nothing.
- `python3 runtimes/scripts/check-runtime-parity.py` exits 0.
- Generated Claude agents are installed into `~/.claude/agents`.
- `bash codex/scripts/install-codex.sh` exits 0.
- `python3 claude/scripts/check-codex-drift.py` exits 0.
- A spot-read of one installed runtime agent body (e.g. `~/.claude/agents/consilium-tribunus.md` or `~/.codex/agents/consilium-tribunus.toml`) confirms the verifier-law over-engineering clause was installed.

## Confidence Notes

- **C1, C2 (T1, T3, T4, T5), C3, C4 default categorization** — High. The Imperator's directive defines these explicitly and the source dump's wording aligns with the directive.
- **T2 (dormant trigger)** — Medium. The Imperator wrote "risk tier/action controls if present" and the present plan format has no such controls. T2 is phrased as forward-compatible-but-dormant. If the Imperator wants T2 dropped entirely from the trigger list, the list collapses to four (T1, T3, T4, T5) and nothing else in the spec changes.
- **C4 implementation-stage scoping (S3 clause text)** — High after the Censor's first-round finding. The verifier-law clause must explicitly carve over-engineering authority to verifiers that see implementation output; spec- and plan-stage verifiers must not be granted the authority by inference from system-prompted doctrine. The acceptance criterion enforces this.
- **S5 (mini-checkit template edit)** — High after the Censor's first-round finding. The original draft assumed Tribunus authority would follow from doctrine sync alone; the Censor showed the Tribunus's dispatch prompt currently constrains its mission to a closed five-item list with a "no architectural opinions" disclaimer, so doctrinal authority alone is operationally inert at the per-task layer. S5 is the smallest possible operationalization — one Minimality reference inside the existing mission list and a qualified disclaimer — and explicitly does not create a new template or change agent ranks. **Imperator note:** if the Imperator considers this an unacceptable surface expansion, the alternative is to drop S5 and accept that per-task drift is not surfaced until the end-of-campaign Praetor's deviation-assessment axis catches it. That alternative is honest but degrades the Contract's per-task enforcement.
- **CLAUDE.md untouched** — High after the Censor's first-round finding. The original draft included a discretionary single-line architectural pointer; the revised spec drops it entirely. The Contract is discoverable via the canonical doctrine files (which `claude/CLAUDE.md` already names through the Codex drift-check section).
- **Generation and installed parity as plan-execution step** — High after runtime unification and second-pass plan verification. The durable proof chain is canonical `source/` edits → `runtimes/scripts/generate.py` → generated/compatibility outputs → install generated Claude agents into `~/.claude/agents` → `bash codex/scripts/install-codex.sh` for Codex agents/skills/config → `python3 claude/scripts/check-codex-drift.py` installed parity.

## Revision Notes

This spec was revised after the Censor's first-pass review. Substantive changes from the v1 draft:

1. **Surface swap.** S5 (single-line pointer in `claude/CLAUDE.md`) was dropped. A new S5 (one Minimality clause inside `source/skills/claude/references/verification/templates/mini-checkit.md`) was added. Net: same surface count (five), different surface set. The Imperator named CLAUDE.md as a reconnaissance surface; the Censor showed mini-checkit was the surface that actually gates Tribunus enforcement.
2. **C4 cleanup.** The phrase "SOUND with note" was replaced with standard `SOUND`-with-chain-of-evidence to avoid implying a fifth finding category.
3. **S3 strengthened.** The verifier-law clause is now required to carry explicit implementation-stage scoping in its text, not by reference to the spec.
4. **Evidence Basis.** Exact line counts were softened to "under twenty-five lines" descriptions to avoid count-method drift between `wc -l` and the Read tool. The plan-format paraphrase was replaced with a faithful description of the file's current shape.
5. **Acceptance Criterion 13 widened.** Specific line counts per surface are now plan territory; the spec only asserts no edits land outside the named surfaces.
6. **Non-Goal clarification.** "No expansion of the verification stack" now explicitly carves out the §S5 amendment as not constituting expansion (no new template, no new agent, single clause inside an existing mission list).
7. **Runtime-unification reconciliation.** Direct-edit targets were rebased from `codex/source` and `claude/skills` compatibility copies onto canonical `source/` files. The old Codex drift sync instruction was replaced with the current generator/install/parity proof chain.
