# Right-Sized Edicts Plan Contract

**Status:** Draft for Imperator review
**Author:** Codex, in Consul stance
**Date:** 2026-04-30
**Slug:** 2026-04-30-consilium-right-sized-edicts
**Target:** Consilium workflow source

---

## 1. Goal

Make `/edicts` produce execution-grade implementation plans that are **decision-complete and code-selective**: detailed enough that a Centurio does not invent architecture, scope, file ownership, interfaces, verification, or edge-case policy, but lean enough that ordinary implementation code stays out of markdown.

This is a correction to plan authorship. It is not a reduction in implementation rigor.

## 2. Why This Exists

Recent Consilium planning produced an oversized plan for a small storefront UI change. The plan had the right implementation direction but inflated into defensive procedure: full code blocks, per-task verification ceremony, backend/data repair detours, repeated skill instructions, and micro-steps that made the plan harder to execute rather than safer.

Live source confirms the cause is not merely agent taste. The current Edicts prompt instructs the author to include "complete code," use "TDD," make "frequent commits," and make every step small enough for a Centurio to complete in "two to five minutes." It also says that if a step changes code, "the code is in the step." Those instructions make large plans the expected output.

The opposite failure would be just as bad: a vague plan that says "update the category page" and leaves the Centurio to decide file boundaries, helper shape, state flow, filter policy, and verification. This spec rejects both extremes.

The correct contract is:

> The plan decides everything that affects correctness, coordination, scope, and review. The Centurio decides ordinary implementation mechanics inside those boundaries.

## 3. Evidence Basis

The relevant live surfaces are:

- `source/skills/claude/edicts/SKILL.md`
- `source/protocols/plan-format.md`
- `source/protocols/legatus-routing.md`
- `source/skills/claude/references/verification/templates/plan-verification.md`
- `source/skills/claude/references/verification/protocol.md`
- `source/skills/claude/consul/SKILL.md`
- `source/protocols/consul-routing.md`
- `source/skills/claude/legion/SKILL.md`
- `source/skills/claude/legion/implementer-prompt.md`
- `source/skills/claude/march/SKILL.md`

Current source facts:

- `source/skills/claude/edicts/SKILL.md` requires exact file paths, complete code, TDD, frequent commits, and tasks broken into two-to-five-minute actions.
- `source/skills/claude/edicts/SKILL.md` makes full code in code-changing steps mandatory, which turns normal React/helper/component work into pasted implementation.
- `source/protocols/plan-format.md` is already compact and says plans should have Goal, Scope in/out, Ordered tasks, and Verification. It does not define code-in-plan policy or task-size boundaries.
- `source/protocols/legatus-routing.md` already carries the useful execution principle: keep steps small enough that a Centurio can execute without inventing strategy. That principle is good; the two-to-five-minute rule is the bad overcorrection.
- `source/skills/claude/references/verification/templates/plan-verification.md` still leans on confidence annotations and assumption hunting. It does not explicitly check whether the plan is over-specified, under-specified, or widening scope through defensive work.
- `source/skills/claude/references/verification/protocol.md` still defines inline confidence annotations as normal verifier input, so template-only edits would leave stale verification behavior alive.
- The Codex Consul agent includes `source/protocols/consul-routing.md`, so a fast lane added only to the Claude Consul skill would split Claude and Codex runtime doctrine.
- `source/skills/claude/legion/SKILL.md`, `source/skills/claude/legion/implementer-prompt.md`, and `source/skills/claude/march/SKILL.md` still contain execution-side TDD, commit, or bite-sized-step assumptions. Those consumers must not reintroduce the ceremony the new Edicts contract removes.

## 4. Core Contract

### 4.1 Decision-complete

A plan is decision-complete when it tells the Centurio:

- the exact repo lane and files expected to change;
- the responsibility of each created or modified file;
- the internal interfaces that coordinate tasks, such as helper names, exported function signatures, component props, hook return-shape changes, or API payload shapes when those choices affect more than one file or task;
- state and data-flow policy;
- which existing code patterns to follow;
- acceptance criteria expressed as observable outcomes;
- the narrow verification commands or smoke checks that prove the behavior;
- stop conditions for strategic ambiguity;
- non-goals and must-not-touch surfaces when the task is likely to wander.

Decision-complete does not mean code-complete. It means the Centurio receives the important decisions already made.

### 4.2 Code-selective

A plan includes exact code only when exact code protects correctness better than prose. Good reasons to include code are:

- wire contracts, schemas, request/response examples, migration shape, or idempotency keys;
- fragile conditional logic that implements a domain invariant;
- generated copy maps or other fixed literals where wording or keys are part of the contract;
- commands where quoting, env, or path behavior is itself dangerous;
- small snippets whose exact shape prevents a known failure mode.

A plan does not paste ordinary component bodies, helper bodies, hook internals, imports, class names, or test bodies when the file responsibility, interface, behavior, and acceptance checks are enough for a capable Centurio to implement correctly.

### 4.3 Coherent implementation units

A task is one coherent implementation unit, not one tiny action. It should be sized around a reviewable outcome:

- "Add the category presentation helper and tests."
- "Wire the category page to use branch-aware presentation and suppress apparel-only filters for non-apparel branches."
- "Update plan verification to reject code-pasted ordinary tasks and vague task orders."

A task may involve multiple edits and one narrow verification pass. It should usually be something a Centurio can complete in roughly 20 to 90 minutes, depending on risk and repo terrain. The time range is guidance, not a hard rule; the real boundary is whether the task can be implemented and verified without making architecture decisions.

Micro-steps like "create file," "add import," "run tsc," and "commit" are not standalone tasks. They can appear inside a task only when they matter to the task's proof.

### 4.4 Verification proportionality

Plans must still define verification. They must stop requiring verification after every tiny edit.

Per-task verification is required when a task's output can poison later tasks, changes shared contracts, touches risky domain behavior, or creates a boundary that later work consumes. Otherwise, a task can rely on narrow final checks plus local tests.

Patch and small feature plans should not require per-task commits. Campaign plans may still use milestone commits when the checkpoint protects later execution.

TDD is required only when the plan specifically needs test-first behavior to reproduce a bug, lock a contract, or protect a risky refactor. Existing-test updates and new tests remain normal plan content; mandatory TDD theater does not.

## 5. Plan Scale

The Edicts author chooses a plan scale to calibrate detail. This is a plain-language scale, not a new Action Tier system and not a metadata regime.

### 5.1 Patch plan

A Patch plan is a bounded change in one repo and one subsystem, usually one to five files, with no money/auth/permission/data-model/migration/wire-contract risk. It can still be multi-file.

Patch plans should be short, decision-dense, and code-light. They typically have two to five coherent tasks, final static verification, and one browser or smoke check when UI behavior changes.

### 5.2 Feature plan

A Feature plan is meaningful work in one subsystem: multiple components, route/hook/service coordination, or domain behavior inside one repo. It can carry more task detail, task-level checks, and explicit dependencies when later work consumes earlier output.

Feature plans should still avoid full-code markdown unless the code is contract-shaped or fragile.

### 5.3 Campaign plan

A Campaign plan covers cross-repo work, migrations, money/checkout/proof/order lifecycle, permissions, new subsystems, or any work where wrong intermediate state can poison later work. Big plans are allowed here.

Campaign plans may use milestone commits, stronger verifier gates, dependency maps, and more explicit handoff structure. They still must not paste routine implementation code as a substitute for clear decisions.

## 6. Required Plan Shape

Every plan produced by `/edicts` must contain:

- Goal: one sentence.
- Scope in: explicit.
- Scope out: explicit.
- Plan scale: Patch, Feature, or Campaign, with one sentence explaining why.
- Implementation shape: two to six sentences describing the chosen approach, file split, and coordination boundaries.
- Ordered tasks: coherent implementation units.
- Verification: narrow commands and smoke checks, with task-level checks only where needed.

Every task must contain:

- Files: create/modify/test/read as needed.
- Objective: what this task delivers.
- Decisions already made: file responsibilities, names, interfaces, state policy, data-flow policy, and non-goals relevant to this task.
- Acceptance: observable outcomes the Tribunus or reviewer can check.
- Verification: the narrowest relevant check for this task, or "covered by final verification" when appropriate.
- Stop conditions: only when a real strategic ambiguity is plausible.

The task may include exact code snippets only under the code-selective rule in section 4.2.

## 7. Anti-Slop Rules

The Edicts author must remove:

- repeated skill invocation boilerplate beyond the single required header;
- full ordinary component/helper/hook code blocks;
- per-task `tsc`, lint, browser, or commit steps unless that task has downstream-poisoning risk;
- backend seed repair, data cleanup, or operational detours in frontend/storefront plans unless the approved spec says they are in scope;
- defensive "just in case" work that does not map to a spec requirement, domain invariant, or known live failure;
- repeated confidence annotations that do not change verifier behavior;
- shell survival manuals unrelated to the plan's actual commands;
- coverage matrices for small Patch plans;
- "similar to Task N," "add appropriate error handling," "handle edge cases," and other vague orders.

The Edicts author must not remove:

- concrete file ownership;
- interface decisions needed for task coordination;
- real acceptance criteria;
- real stop conditions;
- domain invariants;
- narrow verification commands;
- code snippets that protect fragile contracts.

## 8. Verifier Behavior

Plan verification must check right-sizing in both directions.

Praetor checks feasibility:

- Are required decisions present before implementation begins?
- Are task boundaries coherent and reviewable?
- Do later tasks depend on outputs that earlier tasks do not produce?
- Are file collisions or shared state accounted for?
- Are verification commands sufficient and not wasteful?

Provocator stress-tests plan quality:

- Does the plan paste ordinary code instead of making decisions?
- Does it add defensive work outside the approved spec?
- Does it hide vague orders behind confident language?
- Does it swing too far toward abstraction, leaving the Centurio to choose architecture, scope, or policy?
- Does a verifier finding add scope without tying to an approved requirement, domain invariant, frozen contract, or realistic first-pass execution failure?

Verifier findings may add work only when the added work traces to the approved spec, a domain invariant, a contract, or a realistic first execution failure caused by the plan as written. Adjacent facts can be notes. They do not become tasks by gravity.

The plan-verification template and the shared verification protocol must agree. Confidence annotations can remain allowed as evidence/risk notes, but plan verification must not require them or make High confidence the primary adversarial target.

## 9. Fast-Lane Consul Behavior

The current Consul Brief and Estimate-lite rules are useful for real ambiguity but too narrow for small multi-file implementation work. A small Patch plan can involve several files without deserving Campaign ceremony.

`/consul` should allow a compact fast lane when all of these are true:

- the work is one repo and one subsystem;
- no new domain concept needs doctrine interpretation;
- no money/auth/permission/data-model/migration/wire-contract surface is touched;
- likely implementation is one to five files;
- success can be described in one or two observable outcomes;
- no speculator dispatch is needed after a bounded source read.

The fast lane still produces a design/spec artifact when asked. It simply skips the full Brief + Estimate-lite ceremony and records the fast-lane basis in one short paragraph.

If any condition fails, normal Consul discipline applies.

The fast lane must be present in both the Claude Consul skill and the shared Consul routing protocol consumed by the generated Codex Consul agent.

## 10. Execution Consumer Behavior

Right-sized plans must not be immediately converted back into micro-step ceremony by the execution skills.

`consilium:legion` and `consilium:march` should still enforce the strategic boundary: Centurios execute the plan and stop on architecture, product, contract, repo ownership, money, permission, data model, proof/order lifecycle, or workflow ambiguity.

They should not require default TDD, commit-per-task, or bite-sized step execution when the approved plan uses coherent task units. Tests, commits, and task-level verification remain required when the plan orders them or when they protect a real downstream boundary.

## 11. Source Surfaces

The implementation plan should inspect and amend these canonical source surfaces:

- `source/skills/claude/edicts/SKILL.md`
- `source/protocols/plan-format.md`
- `source/skills/claude/references/verification/templates/plan-verification.md`
- `source/skills/claude/references/verification/protocol.md`
- `source/skills/claude/consul/SKILL.md`
- `source/protocols/consul-routing.md`
- `source/protocols/legatus-routing.md`
- `source/skills/claude/legion/SKILL.md`
- `source/skills/claude/legion/implementer-prompt.md`
- `source/skills/claude/march/SKILL.md`

The plan should not introduce:

- new agents;
- new verifier roles;
- new risk-tier/action-tier metadata systems;
- dependency graph or wave-execution machinery;
- new lint scripts;
- new model-routing policy;
- changes to diagnosis routing;
- changes to Medusa domain doctrine;
- edits to historical case docs except this case's own artifacts.

Generated and compatibility surfaces are derived outputs. The plan must use the repo's generation/install parity flow rather than hand-editing generated files directly.

## 12. Relationship to Existing Cases

This spec is a follow-on to the Consilium simplification and minimality work. It does not replace those cases.

It also rejects the heavier direction represented by the existing `2026-04-29-consilium-risk-tier-plan-format` draft for this specific problem. Action Tiers, Owner fields, dependency graphs, rollback fields, and wave metadata may become useful later for parallel execution, but they are too much machinery for the current failure mode. The current failure mode is not "plans lack enough metadata." It is "Edicts confuses precision with pre-written implementation."

If the Imperator later wants a formal topology system, that should be a separate approved case. It must not slip into this cleanup as a side effect.

## 13. Acceptance Criteria

This case is complete when:

1. `source/skills/claude/edicts/SKILL.md` no longer requires complete code for every code-changing step.
2. `source/skills/claude/edicts/SKILL.md` no longer defines tasks as two-to-five-minute micro-actions.
3. `source/skills/claude/edicts/SKILL.md` defines decision-complete, code-selective, coherent implementation units.
4. `source/protocols/plan-format.md` includes plan scale, task sizing, and code-in-plan policy without adding a heavy metadata schema.
5. `source/skills/claude/references/verification/templates/plan-verification.md` checks both over-specified slop and under-specified pseudo-spec plans.
6. `source/skills/claude/references/verification/protocol.md` no longer makes plan confidence annotations mandatory or makes High confidence the primary Provocator target.
7. `source/skills/claude/consul/SKILL.md` and `source/protocols/consul-routing.md` both have the compact fast-lane allowance for small multi-file Patch work, without weakening normal Consul routing for ambiguous or high-risk work.
8. `source/protocols/legatus-routing.md` preserves the principle that Centurios execute without inventing strategy, while allowing coherent larger tasks and tactical implementation mechanics.
9. `source/skills/claude/legion/SKILL.md`, `source/skills/claude/legion/implementer-prompt.md`, and `source/skills/claude/march/SKILL.md` no longer force default TDD, per-task commits, or bite-sized step execution against right-sized plans.
10. No new agents, risk-tier metadata, wave machinery, verifier roles, or diagnosis-routing changes are introduced.
11. Generated Claude/Codex compatibility outputs are regenerated from canonical source, not hand-edited.
12. Installed/runtime parity is proven using the repo's existing parity or drift-check command.
13. A sample Patch-plan excerpt in the implementation evidence demonstrates the new balance: exact files, decisions, interfaces, acceptance, and verification, but no full ordinary component/helper code.

## 14. Verification Plan

The implementation plan should include proof commands that establish:

- forbidden Edicts phrases are removed or materially rewritten: "complete code," "two to five minutes," mandatory "frequent commits," and "if a step changes code, the code is in the step";
- the plan-format protocol contains decision-complete/code-selective/coherent-task language;
- plan verification template and protocol include both anti-overbuild and anti-underbuild checks without requiring confidence annotations;
- Consul fast-lane text exists in both the Claude skill and shared routing protocol, and is bounded by risk conditions;
- Legion and March execution text no longer reintroduces default TDD, commit-per-task, or bite-sized-step ceremony;
- generated outputs match canonical source after generation;
- installed runtime is not drifting from generated source after install.

Exact commands are plan territory because the runtime install path can drift. The proof must prefer existing repo scripts over ad hoc inspection.

## 15. Risks And Guardrails

**Risk: plans become too vague.** Guardrail: decision-complete is mandatory, and plan verification explicitly checks under-specification.

**Risk: agents use "code-selective" as an excuse to omit important snippets.** Guardrail: exact code is still required for schemas, contracts, fragile logic, fixed copy maps, dangerous commands, and known failure modes.

**Risk: Patch fast lane bypasses important domain thinking.** Guardrail: fast lane is forbidden when a domain concept needs interpretation or when money/auth/permission/data-model/migration/wire-contract surfaces are touched.

**Risk: verifier findings keep widening scope.** Guardrail: findings may add work only when tied to approved spec requirements, domain invariants, contracts, or realistic first execution failures.

**Risk: this resurrects a metadata expansion under a different name.** Guardrail: no new Action Tier system, Owner field schema, dependency graph, rollback field, or wave machinery is allowed in this case.

## 16. Confidence

High:

- The user explicitly wants plans that are detailed enough for Centurios to execute without architecture decisions.
- The user explicitly does not want a swing toward vague specs pretending to be plans.
- The user explicitly supports larger task units than the current micro-step doctrine.
- Live Edicts source contains the instructions that create bloated plans.

Medium:

- The fast-lane Consul change belongs in this same case. It is included because the same failure mode starts before Edicts: small multi-file work gets routed through too much ceremony. If the Imperator wants this narrower, the implementation plan can drop the Consul surface and keep only Edicts + plan verification.

Low:

- The exact runtime parity command. Prior Consilium cases use generation/install parity flows, but the implementation plan must re-check the current scripts before writing commands.
