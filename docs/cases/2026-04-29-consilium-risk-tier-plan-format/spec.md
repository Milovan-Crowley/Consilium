# Risk-Tiered Plan Metadata + Light Plan Topology

**Status:** Spec — revised after Censor + Provocator round 1; pending re-verification
**Author:** Publius Auctor (Consul) — for the Imperator
**Date:** 2026-04-29
**Slug:** 2026-04-29-consilium-risk-tier-plan-format

**Revision note (2026-04-29):** First-round verification raised two MISUNDERSTANDINGs (Centurion vocabulary as live, §3.3 cross-repo medium cell) and one structural GAP (T0 Campaign-review skip violating `legion/SKILL.md:315`). Imperator ruled: rebase `Owner` onto live agent set; keep Campaign review universal; amend Tribunus contract to receive diff + plan-header tier. This revision applies those rulings and auto-fixes the remaining GAPs and CONCERNs.

---

## 1. Goal

Introduce an **Action Tier** taxonomy and a small set of **required task-level metadata fields** for Consilium plan documents, so that *plan topology* scales to risk: a one-file mechanical change reads like a one-file mechanical change, and a cross-repo money-path migration carries the topology it deserves. **End-of-plan Campaign review is not relaxed by tier** — it always runs. Tier dials topology overhead, not verifier presence. The plan document remains the contract between the Consul (`edicts` skill) and the Legatus (`legion` / `march` skills); this spec sharpens that contract.

## 2. Why This Exists

Today every plan task carries the same shape: `### Task N`, `**Files:**` (Create/Modify/Test), step checkboxes, and an inline confidence annotation. The shape does not differentiate between *"write a one-line CSS fix"* and *"migrate the order workflow across repos."* As a result:

1. Trivial work is over-ceremonied — Consul authoring time and Legatus execution time absorb friction the work does not warrant. The friction lives in **topology overhead** (dependency graphs, parallel-safety maps, cross-repo coordination notes) — not in the per-task verification, which is fast.
2. Risky work is under-ceremonied — a money-path task and a CSS task arrive with the same metadata, asking the Tribunus and Campaign triad to invent risk awareness on the fly.
3. Future Legion wave execution (parallel soldier dispatch by independent units) cannot land safely without declared file ownership and dependency graphs — and there is nowhere on the current task shape to put them.

A risk-tiered plan format gives the Consul a topology dial, the Legatus an explicit policy to read, and the verifiers a contract to check.

> **Confidence: High** — derived from the Imperator's stated motivation. Existing plan-format protocol (`codex/source/protocols/plan-format.md`) already speaks of "one verification point when the output can poison later steps" — this spec generalizes that idea.

## 3. Action Tier Vocabulary

Every implementation task in a Consilium plan carries exactly one **Action Tier**. The tiers are ordered: a higher tier subsumes the topology overhead of every lower tier.

### 3.1 The four tiers

|Tier|Name|What it is|Examples|
|-|-|-|-|
|T0|Patrol|Mechanical or low-blast-radius edit. Single file or tiny local change. No public contract change, no data model change, no domain invariant touched, no UX behavior change. Easy revert.|Rename a CSS variable. Fix a typo in a label. Bump a constant inside a service file. Add a single non-exported helper that callers don't yet use.|
|T1|Caution|Bounded change with one identified risk knob. Small surface, but it touches something that could surprise a reader: a hook signature, a non-public type used in two files, a test fixture, a local default value. Reversible.|Change a hook's return shape used in two consumers. Tighten a Zod schema with one new required field. Edit a fixture file consumed by multiple tests.|
|T2|Action|Meaningful change. Multi-file, integration-shaped, or domain-logic-shaped. Touches a public contract within a repo, a shared helper, a workflow step, a cart/proof/order/admin lifecycle, an API route's response shape, or a Medusa module/workflow boundary.|Add a workflow step. Change an API route's response. Touch a service that mediates between modules. Add a new admin widget that reads/writes domain state.|
|T3|Trafalgar|High-risk: cross-repo contract change, money/checkout/payment path, data migration, schema change, breaking public contract, new subsystem, regulated/safety-sensitive work, or anything irreversible without an approved rollback procedure.|Migrate a database column. Change a wire shape consumed by both store and backend. Modify cart-total derivation. Add a new permission boundary.|

### 3.2 Decision rules

1. **Default to the higher tier when uncertain.** If a task plausibly fits T1 or T2, it is T2 until the Consul writes a tier reason that justifies the lower tier. Cost of over-tiering is small ceremony; cost of under-tiering is a missed risk.
2. **Tier is per-task, not per-plan.** A multi-task plan can have a mix of tiers. The plan header records the *highest* tier present (see §6.1).
3. **Money, cart, checkout, proof, order, payment, permission, schema, migration, cross-repo contract** — these surfaces force at minimum T2; usually T3. They cannot be T0.
4. **Tier 0 is forbidden when the task carries a verification point that downstream tasks depend on.** If a later task can be poisoned by this task's incorrect output, the task is at least T1. (Cross-reference: §6.2 trigger 5 forces full topology on the plan whenever a downstream-poisoning task exists; §3.2 #4 forbids the per-task tier from underestimating the same risk. They layer at different enforcement points.)
5. **Tier is a Consul authoring decision, not a Legatus runtime decision.** The Legatus reads tier and applies the corresponding topology and review policy; the Legatus does not re-tier mid-march. **Recovery path:** if a soldier or Tribunus discovers under-tiering during execution, the soldier reports BLOCKED per `legion/SKILL.md` §"When the Soldier Reports" and the Legatus escalates to the Imperator for re-tiering at the spec/plan level — the same path as a "plan is wrong" BLOCK.

> **Confidence: High** — vocabulary names (Patrol/Caution/Action/Trafalgar) and the higher-tier-wins rule come from the Imperator's directive. Tier criteria align to existing Divinipress risk surfaces in `codex/source/protocols/legatus-routing.md` "Large fix" criteria and to canonical fix-thresholds doctrine (`docs/doctrine/fix-thresholds.md`). Recovery path traces to `legion/SKILL.md` BLOCKED handling.

### 3.3 Relationship to existing fix thresholds

The `legatus-routing.md` protocol defines `small | medium | large | contain` thresholds for **diagnosis-packet routing** (debug fix intake). Action Tiers are the orthogonal axis for **plan-task ceremony**. Both can coexist: a `medium` diagnosis packet can produce a plan whose tasks are a mix of T1 and T2.

|Diagnosis fix threshold|Typical plan-task tier|Notes|
|-|-|-|
|small|T0 or T1|A single-file <30-line fix is usually T0; if the file is in a money path, T1 minimum.|
|medium (single-repo)|T1 or T2|Multi-file or workflow touch is T2 by default.|
|medium (cross-repo)|T2|Cross-repo medium is `backward-compatible` by definition per `docs/doctrine/fix-thresholds.md`. Breaking cross-repo work escalates to `large` (next row), not to T3 within this row.|
|large|T2 or T3|Subsystem/migration/breaking-cross-repo is T3; refactor of internal-only seams may stay T2.|
|contain|T0 or T1 (containment scope only)|Containment is reversible by definition.|

This table is informational. The fix threshold is set in the diagnosis packet (field 11, per `legatus-routing.md`); the tier is set on each task by the Consul during edicts.

> **Confidence: High** — fix-threshold criteria read directly from `docs/doctrine/fix-thresholds.md`. The cross-repo-breaking-as-`large` rule fixes a category error caught by the Censor in round 1.

## 4. Required Task Metadata

Every task in a plan carries metadata fields. The fields required depend on tier — T0 carries a minimal set; T1+ carries the full set. The serialization is **inline markdown with bolded labels**, consistent with the existing `**Files:**` block style in `claude/skills/edicts/SKILL.md`. (Exact line-by-line format is plan-territory; the spec specifies which fields, with what semantics, in what circumstances.)

### 4.1 Field schema

|Field|Semantics|Required at|
|-|-|-|
|Action Tier|One of `T0 Patrol`, `T1 Caution`, `T2 Action`, `T3 Trafalgar`.|All tiers|
|Tier reason|One sentence — what makes this task this tier. For T0, may be a short standard phrase ("trivial single-file edit, no domain surface").|All tiers|
|Owner|`soldier` (the live `consilium-soldier` agent per `claude/CLAUDE.md` §"User-scope agents"). A `lane` discriminator may accompany: `lane: store \| backend \| consilium-source`. The Legatus uses lane to select Medusa Rig skills (per `legion/SKILL.md` §"Medusa Rig in Soldier dispatch") and to decide soldier grade. New rank vocabulary (e.g., Centurion ranks) is out of scope per §11.3 — if such ranks are introduced later, the spec is amended.|All tiers|
|Acceptance criteria|One to three sentences describing the **observable outcome** the Tribunus checks against. Phrased in domain or behavior terms, not implementation terms. Tribunus check semantics: an AC is verified when the implementation produces the named observable outcome AND the steps' run/expected blocks (when present) pass. If no test exercises the AC and the AC cannot be verified by inspection of the diff, the Tribunus returns CONCERN — not GAP — naming the AC and the inspection limitation.|All tiers|
|Confidence|Inline confidence annotation (`> **Confidence: High/Medium/Low** — rationale`) per the existing `edicts/SKILL.md` Plan-WHY citation form: when rationale traces to a spec section, cite via markdown link (`[spec §N — Section](../spec.md#N-section)`). This field is the existing edicts-SKILL contract; this spec preserves it as a required schema row to make the requirement explicit.|All tiers|
|Dependencies|List of earlier task IDs this task depends on, or `none`. Explicit declaration required (implicit ordering by task number does not satisfy).|T1 and above. Single-task T1+ plans declare `dependencies: none`. Optional on T0 single-task plans (T0 multi-task plans declare per-task explicitly).|
|Review policy|Which verifiers run, at what depth. Default by tier (see §4.3); explicit only when overriding the default. End-of-plan Campaign review always runs and is NOT a tier knob — see §4.3.|Optional on T0; required when overriding the tier default at any tier|
|Rollback / mitigation|How to back this out: `git revert`, `revert + redeploy`, named migration rollback, or `no-rollback — Imperator approval recorded`.|T1 and above; T0 may use the standard short phrase `git revert`|
|Files|See §5 — writes / reads / must-not-touch. `writes ∩ must-not-touch` must be empty.|All tiers; reads + must-not-touch optional on T0|

A task that is T0 carries: Tier, Tier reason, Owner, Acceptance criteria, Confidence, Files (writes). A task that is T1+ carries all of the above plus dependencies, rollback, optional review-policy override, and full file ownership (writes + reads + must-not-touch).

> **Confidence: High** — fields and per-tier minimums come from the Imperator's directive and round-1 verifier feedback. Owner field rebased to live `consilium-soldier` agent per Imperator ruling A on Centurion vocabulary. AC check semantics added per Provocator's CONCERN.

### 4.2 Why each field exists

|Field|What breaks without it|
|-|-|
|Action Tier|Verifier cannot scale topology to risk; legion cannot pick a sane review policy.|
|Tier reason|Tier becomes a guess; verifiers cannot challenge a wrong tier.|
|Owner|Legatus must invent dispatch; Medusa Rig skill selection has no anchor.|
|Acceptance criteria|Tribunus has only the steps to check against; cannot detect an implementation that runs the steps but misses the outcome.|
|Confidence|Praetor and Provocator cannot direct scrutiny without the author's certainty map; existing edicts contract relies on it.|
|Dependencies|Future wave execution cannot decide what is parallel-safe; current Legatus-judgment fails silently.|
|Review policy|Implicit policy means an explicit override (e.g., the T3 cross-repo case forcing extra coordination) cannot be recorded.|
|Rollback / mitigation|First-failure responder has no playbook; Imperator escalation path is unclear.|
|Files (writes)|Must-not-touch and parallel-safety claims have no anchor; verifier cannot detect scope creep.|

### 4.3 Default review policy by tier

The Legatus reads the tier and applies the default below unless a per-task `Review policy` override is present. **All verification agents run on Opus** per `claude/CLAUDE.md:22` ("All verification agents run on Opus"); `verification/protocol.md:53` enforces it via the agent file's `model: opus` directive. Tier affects the inputs Tribunus receives, not the verifier model.

|Tier|Per-task verification (mini-checkit)|End-of-plan Campaign review|Notes|
|-|-|-|-|
|T0 Patrol|Tribunus Patrol-depth, plan-step + diff + must-not-touch check|Always (Censor + Praetor + Provocator)|Same end-of-plan policy as T1–T3. The "light" relaxation in §6 is structural topology, not verification.|
|T1 Caution|Tribunus Patrol-depth, plus rollback awareness annotated|Always|Same as today.|
|T2 Action|Tribunus Patrol-depth|Always|Same as today.|
|T3 Trafalgar|Tribunus Patrol-depth, with cross-repo contract direction annotated when applicable|Always|Cross-repo T3 plans also declare contract direction in topology (§6.4). Field-14 backward-compat gating from `legatus-routing.md` Debug Fix Intake applies to fix-route plans only — feature plans declare contract direction at design time.|

**Critically, no tier permits skipping the end-of-plan Campaign review.** This preserves `legion/SKILL.md` §"What Fails the Campaign" — *"I never skip Campaign review. It always runs after execution, never opt-in."* — and `verification/protocol.md` §2 — *"Mandatory for mini-checkit and Campaign review during execution — the Legatus does not ask. No opt-out."* The first revision permitted T0 single-task plans to skip Campaign review; that was Consul over-reach reversing a load-bearing oath, caught by the Provocator in round 1 and reverted by Imperator ruling A.

> **Confidence: High** — preserves the legion oath verbatim. Tier dials per-task Tribunus inputs and topology, not Campaign review presence.

### 4.4 Dual purpose of the dependencies field

`Dependencies` does double work:

1. **Authoring discipline.** Forces the Consul to think about ordering and write it down. Implicit ordering by task number is fragile when the plan is edited.
2. **Forward-compat for wave execution.** Once every T1+ task carries explicit dependencies, the future Legion wave-execution mode can compute waves from the graph without changing the plan format. (Wave execution itself is **not** in this spec — see §7.)

> **Confidence: High** — dependencies-as-forward-compat is an explicit Imperator goal.

## 5. File Ownership

Every task declares its file footprint in three buckets. The `Files:` block on a task is the contract between Consul, Legatus, soldier, and verifier.

|Bucket|Meaning|Tribunus check|
|-|-|-|
|writes|Files this task creates or modifies. Includes both production source and tests.|The task's commit diff is contained in the writes set. New files outside the writes set fail verification.|
|reads|Files the soldier is expected to read for context — surfaces the task depends on but must not modify.|Advisory; the Tribunus does not fail a task for reading a file outside this set, but a write to a "reads" file is a fail.|
|must-not-touch|Explicit names of files or surfaces the soldier must leave alone. Used when the soldier might wander.|The task's commit diff must not modify or create files in this set. Any touch is a Tribunus GAP.|

For T0 tasks, only `writes` is required. For T1 and above, all three are required when meaningful (a task may declare `must-not-touch: none` if no exclusion applies). The `reads` bucket replaces the implicit "the soldier figures out what to read" behavior and reduces context drift in soldier dispatch.

The existing `**Files:** Create / Modify / Test` block in `claude/skills/edicts/SKILL.md` collapses into the unified `writes` bucket. The plan-task in this format does not require Create/Modify/Test as separate sub-fields — those distinctions were never enforced by the Tribunus.

**Invariant: `writes ∩ must-not-touch` must be empty.** Plan-verification (Praetor) raises a GAP if a file appears in both buckets on the same task.

### 5.1 Parallelism invariant

Two tasks are **parallel-safe** only if both declare `writes`, their `writes` sets are disjoint, and neither lists the other in `dependencies`. The Legatus may not dispatch parallel soldiers on tasks whose `writes` overlap, regardless of intent. A future explicit isolated-worktree mechanism can override this; that is out of scope here.

**Pre-spec plan handling:** Plans authored before this spec lands lack `writes` declarations. The Legatus reverts to the existing judgment-based parallel-safety check per `legion/SKILL.md` §"What Fails the Campaign" — *"I never dispatch parallel soldiers on files that overlap. Parallel is permitted only when tasks are genuinely independent, by my judgment — and I judge strictly."* Post-spec plans missing `writes` on any task are GAP-level malformations caught at plan-verification.

### 5.2 Tribunus contract amendment (acknowledged contract change)

Enforcing `writes` set conformance and `must-not-touch` requires inputs the current Tribunus dispatch does not carry. Per `claude/skills/references/verification/templates/mini-checkit.md`, the Tribunus today receives the specific plan step plus current state of changed files — not the diff, not the plan-header `Highest tier`, not the task metadata block. **The follow-on plan amends the Tribunus dispatch contract to receive: `git diff <BASE>...<HEAD>` for the task's commit range, the plan-header `Highest tier`, and the full task metadata block.** The Tribunus's persona, finding semantics (SOUND/CONCERN/GAP/MISUNDERSTANDING), and Patrol-depth speed remain unchanged. The check list grows by two: writes-set conformance and must-not-touch enforcement.

> **Confidence: High** — Tribunus contract amendment per Imperator ruling A on Question 3. This is a real contract change to `mini-checkit.md` and the Legatus's dispatch logic; §10 names the surface.

## 6. Execution Topology Gate (the Light-Plan Escape Hatch)

The plan-format protocol (`codex/source/protocols/plan-format.md`) today asks for: Goal, Scope in/out, Ordered tasks, Verification. Existing edicts SKILL adds plan header (Goal, Architecture, Tech Stack) and the `### Task N` block. **None of that is removed.**

This spec adds a single decision: **when does a plan need Full Execution Topology, and when does it not?** Topology means structural plan content — dependency graphs, parallel-safety maps, cross-repo coordination notes — not end-of-plan verification. End-of-plan Campaign review runs on every plan regardless of topology choice (§4.3).

### 6.1 Plan header — minimum, always

Every plan, regardless of tier, declares:

- **Goal** — one sentence (existing).
- **Architecture** — 2-3 sentences (existing).
- **Tech Stack** — key libraries (existing).
- **Highest tier** — the maximum task tier in this plan (`T0`, `T1`, `T2`, or `T3`).
- **Topology** — `light` or `full`. The decision rule is in §6.2.

That is the minimum. A single-task T0 plan adds two metadata lines to its header and nothing else.

**A plan must declare at least one implementation task.** Research, spike, or documentation case files that produce no code are not plans under this contract — they are case files of a different kind and do not enter the Legatus's execution flow.

### 6.2 When `full` topology is required

A plan needs `full` topology if **any one** of these is true:

1. The plan has **2+ tasks** that share dependencies or might be parallelized.
2. The plan declares parallel workers (any task that the Legatus would consider dispatching in parallel with another).
3. **Any task is T1 or higher.** Single-task T1 may declare `topology: light` if no other trigger applies; multi-task T1+ always escalates to `full`.
4. **Any task is cross-repo** (touches `divinipress-store` and `divinipress-backend`, or modifies a wire shape consumed by both).
5. Any task creates **downstream poisoning risk** — its incorrect output can corrupt later tasks. This is the existing plan-format protocol's "one verification point when the output can poison later steps" criterion, surfaced as a topology trigger. (Cross-reference: §3.2 #4 forbids T0 on a downstream-poisoning task at the per-task tier level; trigger 5 here forces full topology at the plan level. Both must hold.)

Otherwise the plan uses `light` topology.

> **Confidence: High** — triggers come from the Imperator's directive. Downstream-poisoning rule traces to `codex/source/protocols/plan-format.md`.

### 6.3 What `light` topology contains

A `light` plan adds, beyond §6.1's minimum header:

- The single task block (or, for T0 multi-task plans within trigger-1's "no shared dependencies" interpretation, the task blocks), written in the task-metadata schema (§4) at the appropriate per-tier minimum.

That is the entire plan structurally. No dependency graph, no wave declaration, no parallel-safety map. The Legatus marches, the Tribunus runs mini-checkit per task, and the Campaign review runs at the end (§4.3).

**A single-task T1 light plan retains its tier's review policy.** The relaxation is structural — no dep graph, no parallel-safety map, no cross-repo coordination — not review-policy. T0 light, T1 light, T2 light, T3 light all get Tribunus mini-checkit per task and Campaign review at the end.

### 6.4 What `full` topology adds

A `full` plan adds:

- **Dependency graph** — explicit per-task `dependencies` fields (already in §4).
- **Parallel-safety map** — for each pair of tasks not in dependency relation, whether they are parallel-safe (derives from §5.1: disjoint writes + no dependency = parallel-safe). How it is rendered is plan-territory.
- **Cross-repo coordination** — when any task is cross-repo, the plan declares the contract direction (which side changes first). For feature plans, the Consul declares contract direction at design time as part of the plan. For diagnosis-fix plans, this also satisfies `legatus-routing.md`'s `medium — cross-repo` discipline (gate on field-14 backward-compat). Feature plans do not have a "field 14"; the gate language applies only to fix routes.
- **Wave assignment (advisory, optional)** — see §7.

`full` topology produces what the Legatus needs to execute safely with parallel soldiers; it produces what the future wave-execution mode needs without further plan changes.

> **Confidence: High** — full topology is what today's heavier multi-task plans already approximate informally. Cross-repo phrasing separates feature-plan and fix-route paths cleanly per Censor's CONCERN.

## 7. Wave Metadata (Forward-Compat, Not Implemented)

The Legion's current `legion` skill states: *"Parallel-safe when tasks are independent — soldiers do not interfere with each other's ground."* The judgment of "independent" sits with the Legatus. This spec does **not** change Legatus runtime behavior.

It does allow the Consul to optionally annotate each T1+ task with a `wave: <id>` field (numeric; `wave: 1`, `wave: 2`). Two tasks share a wave only if they are pairwise parallel-safe per §5.1. A future Legion wave-execution mode can dispatch all tasks in a wave in parallel; current Legion behavior reads `wave` as advisory.

The Wave field is **optional**. The plan format admits it; nothing requires it; nothing today reads it. This is forward-compat done explicitly.

**When `wave` is present on multiple tasks, plan-verification confirms pairwise `writes` disjointness and dependency precedence per §5.1.** Mismatch (e.g., two tasks at `wave: 1` with overlapping writes) is a Praetor GAP at plan-verification time — caught before bad wave assignments rot silently before wave-mode lands.

> **Confidence: Medium** — wave-mode dispatch is a non-goal. Numeric token form is my counsel; final format is plan-territory. The plan-verification check on wave overlap is added per Provocator's GAP on wave malformation accumulation.

## 8. Backward Compatibility

Plans authored **before** this spec lands continue to execute. The Legatus and Tribunus must read plans in two formats:

|Plan format|Behavior|
|-|-|
|Pre-spec (no tier metadata, no topology field)|Treat the plan as `topology: full` (current default behavior — Tribunus per task + Campaign review at end). Tier defaults to T2 for review-policy purposes (no relaxation, no escalation). Parallel-safety reverts to legacy Legatus judgment per §5.1.|
|Post-spec, `topology: light`|Per §6.3 — minimal header, task block(s) in tier-appropriate metadata, full Campaign review at end.|
|Post-spec, `topology: full`|Per §6.4 — dependency graph, parallel-safety, cross-repo coordination, optional wave.|

Plans authored **after** this spec lands must declare both `Highest tier` and `Topology` in the plan header.

**Partial-tag handling.** When a post-spec plan declares the header fields but a per-task field is missing:

- Missing per-task `Action Tier` defaults conservatively to the plan's `Highest tier`. The Legatus marks this as a degraded read; Tribunus dispatch carries the conservative default.
- Missing `Acceptance criteria` is a Praetor GAP at plan-verification time — not a runtime fail. The plan does not march until the GAP is fixed.
- Missing `writes` on any post-spec task is a Praetor GAP per §5.1.
- Missing `Confidence` is a Praetor GAP per the existing `edicts/SKILL.md` Plan-WHY citation contract.

**Pre-spec plan + post-spec Tribunus.** When the post-spec Tribunus dispatches against a pre-spec plan task, it falls back to the existing plan-step-match check; missing `Acceptance criteria` is treated as "no AC declared, verify by plan-step-match alone" and is **not** a GAP. This preserves "pre-spec plans continue to execute."

> **Confidence: High** — backward compat is non-negotiable; conservative-default rule applied at both plan and task level per Censor's GAP. Pre-spec Tribunus fallback added per Provocator's GAP.

## 9. Domain Invariants Preserved

This spec does **not** change the following:

1. **Verifier model.** All verification agents (Censor, Praetor, Provocator, Tribunus) remain on Opus. `claude/CLAUDE.md:22`: *"All verification agents run on Opus."* `verification/protocol.md:53`: *"Set by the agent file (`model: opus`). Do not override in the dispatch call."* Tier dials per-task Tribunus inputs and topology overhead, not the model.
2. **Five-lane Provocator.** The dormant five-lane Provocator workflow is **not** reintroduced. Provocator dispatch remains the single `consilium-provocator` agent.
3. **Implementation dispatch.** Implementation tasks dispatch to `consilium-soldier` per `legion/SKILL.md` §"Prompt Templates and Verification" (`legion/implementer-prompt.md` carries the template; `subagent_type: "consilium-soldier"`). The `lane` discriminator on `Owner` informs Medusa Rig selection per existing `legion` doctrine; it does not introduce new agents.
4. **Workflow ownership and money-path doctrine.** Medusa workflow ownership, link.create boundaries, query.graph filtering rules, and money-path idempotency are unchanged. T2 and T3 tier criteria invoke these surfaces; they do not redefine them.
5. **Diagnosis packet contract.** The 14-field diagnosis packet (`legatus-routing.md`) is unchanged. Action Tier is plan-side metadata; fix threshold (field 11) is diagnosis-side metadata. They appear on adjacent artifacts without conflict.
6. **End-of-plan Campaign review.** Every plan, every tier, every topology — Campaign review runs at the end. `legion/SKILL.md` §"What Fails the Campaign" and `verification/protocol.md` §2's "no opt-out" rule are preserved verbatim.

### 9.1 What this spec changes (acknowledged amendments)

The spec is honest about what it does change in the active contract:

- **Tribunus mini-checkit dispatch** (§5.2). New inputs (`git diff`, plan-header `Highest tier`, task metadata block) and two new checks (writes-set conformance, must-not-touch enforcement). Persona, finding semantics, Patrol-depth speed unchanged.
- **Praetor plan-verification** (§10). New per-task fields to validate (`Action Tier`, `Acceptance criteria`, `Confidence`, `writes`/`reads`/`must-not-touch`, `dependencies` on T1+, `Highest tier` ≥ `max(per-task tier)`, `writes ∩ must-not-touch = ∅`, wave-overlap check). The Praetor's persona and the plan-verification template's role are unchanged; the input checklist grows.
- **Plan format protocol** (`codex/source/protocols/plan-format.md`). Compact protocol grows to admit the new metadata fields and the topology gate.

> **Confidence: High** — acknowledging the contract amendments in §9.1 fixes the Censor's GAP that §9 understated the changes.

## 10. Affected Surfaces (Informational — Plan-Territory)

The plan that follows this spec will determine exact edits. Naming surfaces here helps the verifiers scope their review.

- `claude/skills/edicts/SKILL.md` — author-side: plan header schema, `### Task N` block schema, tier-appropriate metadata minimum.
- `claude/skills/legion/SKILL.md` — execute-side: how the Legatus reads tier, applies default review policy, enforces file ownership during soldier dispatch, dispatches Tribunus with the new inputs (§5.2).
- `claude/skills/references/verification/templates/mini-checkit.md` — Tribunus dispatch contract amendment per §5.2: new inputs (diff, Highest tier, task metadata block), new checks (writes-set conformance, must-not-touch enforcement), AC-driven plan-step-match.
- `claude/skills/references/verification/templates/plan-verification.md` — Praetor checks the new fields (§9.1). The template grows by the input checklist; the persona is unchanged.
- `claude/skills/references/verification/templates/campaign-review.md` — Campaign review reads `Highest tier` from the plan header; review focus scaled by tier.
- `claude/skills/references/verification/protocol.md` — Depth-configuration table cross-referenced by tier. Existing rule "Mandatory for mini-checkit and Campaign review during execution — the Legatus does not ask. No opt-out." preserved verbatim.
- `codex/source/protocols/plan-format.md` — canonical protocol: minimum task fields, light vs full topology, parallelism invariant.
- `codex/source/protocols/legatus-routing.md` — referenced (not edited as a contract change here): tier interacts with fix thresholds informationally per §3.3; Centurion Dispatch Law remains as written but is not invoked by this spec since `Owner` rebases onto `soldier` + lane.

> **Confidence: Medium** — surfaces named based on live read. Final list is a plan-authoring decision.

## 11. Non-Goals

1. **No lint script or validator** in this spec. A future follow-up case may introduce one. The Tribunus and Praetor enforce the contract by reading the plan and the diff per §9.1.
2. **No model-routing changes.** Soldier-grade selection remains a Legatus judgment per existing `legion` doctrine. Verifiers stay on Opus.
3. **No new agents — light or heavy.** No new Centurion ranks created here. `Owner: soldier` rebases onto the live `consilium-soldier` agent; the `lane` discriminator is metadata, not a new agent.
4. **No verifier-model lowering.** Tier affects topology and per-task inputs; not the model.
5. **No five-lane Provocator review.** Single Provocator dispatch remains the rule.
6. **No retroactive plan rewrite.** Pre-spec plans run under conservative defaults (§8); they do not need to be re-authored.
7. **No wave-execution implementation.** Wave metadata is forward-compat only.
8. **No change to diagnosis-packet 14 fields or the small/medium/large/contain fix thresholds.**
9. **No skip of end-of-plan Campaign review at any tier.** Tier dials topology, not verifier presence.

> **Confidence: High** — direct Imperator hard boundaries. #3 and #9 are tightened from round 1.

## 12. Success Criteria (Observable)

The spec succeeds if, after the follow-on plan and march:

1. A plan whose only task is a single-file mechanical edit can be authored with **a plan header (5 lines) plus a task block carrying ≤6 metadata lines plus the existing inline confidence annotation plus the steps.** No dependency graph, no parallel-safety map, no wave field, no cross-repo coordination.
2. A plan with 2+ tasks where any task is T1+ carries a dependency graph and a parallel-safety map. The Legatus does not infer parallelism at runtime.
3. A plan with a cross-repo task is `topology: full` and declares contract direction.
4. The Tribunus mini-checkit fails a task whose commit diff modifies a file in `must-not-touch` or whose diff includes a write outside the declared `writes` set. (Requires the §5.2 contract amendment to land.)
5. The Praetor plan-verification raises GAP on: (a) `Highest tier` < max per-task tier, (b) `writes ∩ must-not-touch ≠ ∅`, (c) wave-overlap on multi-task wave declarations, (d) post-spec plan with missing required field on any task.
6. **Every plan — including T0 single-task plans — runs the end-of-plan Campaign review.** No tier and no topology choice skips Campaign review.
7. The Campaign review on a pre-spec plan still runs (defaults: full topology, T2-equivalent review).
8. No verifier agent runs on a non-Opus model.

> **Confidence: High** — criteria are observable. Round-1 success criterion 6 (T0 Campaign-skip) is reversed per Imperator ruling A.

## 13. Open Questions

These are spots where the spec admits uncertainty rather than annotating it Low. Each is a call for the Imperator's verdict before plan-authoring.

1. **Should `topology: light` permit two T0 tasks** if they are clearly disjoint and neither is in a domain risk surface? The current spec says no — multi-task triggers `full`. The Imperator may want a relaxed rule: ≤2 T0 tasks, declared parallel-safe, may stay light. Conservative position is in the spec; relaxation is one line away. (My counsel: keep it strict for the first revision; relax later if friction proves the rule wrong.)
2. **Acceptance criteria as test assertion vs domain assertion.** The spec asks for observable outcome in domain or behavior terms ("the cart total reflects the new tax rate"). Stricter reading: require AC verifiable by a named test or command. Strictness raises tribunus rigor at the cost of authoring friction. (My counsel: keep "observable outcome" loose; Tribunus returns CONCERN — not GAP — when the AC cannot be verified by inspection.)

> **Confidence: Medium** — deliberation residue. The round-1 Owner-fallback question is resolved by Imperator ruling A on Centurion vocabulary.

## 14. Confidence Map (Per-Section Summary)

|Section|Confidence|Anchor|
|-|-|-|
|§1 Goal|High|Imperator directive + round-1 ruling|
|§2 Why|High|Existing plan friction + Imperator stated motivation|
|§3 Action Tier vocabulary|High|Imperator directive + alignment to risk surfaces; recovery-path added per round-1|
|§3.3 Fix-threshold mapping|High|Direct read of `fix-thresholds.md`; cross-repo-breaking-as-large fix per Censor MISUNDERSTANDING|
|§4 Required task metadata|High|Imperator directive; Owner rebased to live `consilium-soldier` per Imperator ruling A|
|§4.1 Confidence row|High|Existing edicts contract preserved as explicit schema row per Censor GAP|
|§4.3 Default review policy|High|Preserves legion oath verbatim; T0 Campaign-skip reversed per Imperator ruling A|
|§5 File ownership|High|Imperator directive + writes∩must-not-touch invariant per Provocator GAP|
|§5.1 Parallelism invariant|High|Encodes legion doctrine; pre-spec fallback per Provocator GAP|
|§5.2 Tribunus contract amendment|High|Acknowledged contract change per Imperator ruling A on Question 3|
|§6 Topology gate|High|Central design; cross-references for §3.2#4↔§6.2#5 per CONCERN|
|§7 Wave metadata|Medium|Forward-compat; numeric token is counsel; wave-overlap GAP rule added|
|§8 Backward compatibility|High|Non-negotiable; partial-tag handling + pre-spec Tribunus fallback added|
|§9 Domain invariants + §9.1 acknowledged amendments|High|Direct Imperator boundaries; honest about contract changes|
|§10 Affected surfaces|Medium|`mini-checkit.md` + `plan-verification.md` added per round-1|
|§11 Non-goals|High|Hard boundaries; #9 added per Imperator ruling A|
|§12 Success criteria|High|Observable; criterion 6 reversed per round-1|
|§13 Open questions|Medium|Deliberation residue; round-1 question resolved|

The High count remains real. The amendments §5.2 and §9.1 are the load-bearing additions. Provocator should re-attack §4.3 (Campaign-review universality), §5.2 (Tribunus contract amendment scope), and §8 (partial-tag handling) — those are the round-2 surfaces.

---

**End of spec.** Pending Censor + Provocator round 2.
