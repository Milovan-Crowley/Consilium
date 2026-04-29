# Consul Brief + Estimate-lite — Recon Discipline Before Scouts and Spec

**Status.** Draft for Imperator review.
**Date.** 2026-04-29.
**Target.** Consul role. Primary surface: `claude/skills/consul/SKILL.md`. Codex-side parity in `codex/source/protocols/consul-routing.md` is plan-level.
**Purpose.** Add two compact discipline checkpoints inside the Consul's existing flow: a Brief before scout dispatch, and an Estimate-lite before spec writing. The Brief prevents reconnaissance from becoming token theater. The Estimate-lite prevents the Consul from rushing into a spec when the request is actually multiple campaigns.

## Summary

Two checkpoints. No new agents. No new stages. No change to model routing, `/edicts`, `/legion`, `/march`, or visual companion.

- The **Consul Brief** is a compact framing the Consul writes before dispatching any scout. Scouts dispatch only against named unknowns from the Brief. Skippable for tiny / direct work.
- The **Estimate-lite** is a six-section synthesis the Consul writes after deliberation, before writing the spec. If it shows the request is more than one campaign, the Consul halts and asks the Imperator to decompose.

Both are inline working artifacts — presented in the Consul's message thread so the Imperator can see the framing and intervene. Persistence to a case file is plan-level.

## Evidence Basis

This spec is grounded in the current repo state:

- `claude/skills/consul/SKILL.md` Phase 1 currently flows: Domain knowledge → Codebase exploration (scouts) → Scope assessment → Medusa Rig. There is no checkpoint that gates scout dispatch on a stated unknown.
- `claude/skills/consul/SKILL.md` Phase 3 currently flows: Spec Discipline Rule → Ambiguity elimination → present design → write spec → self-review → dispatch verification. There is no synthesis step between deliberation and spec writing that would surface multi-campaign scope.
- `codex/source/protocols/consul-routing.md` describes the Codex-side Consul's default stance and dispatch rules but currently has no shaping checkpoint before retrieval/tracing fan-out.
- The source idea dump at `/Volumes/Samsung SSD/Downloads/consilium-upgrades.md` Phase 6 sketches both checkpoints. This spec does not inherit its branch commands, manifest patches, or runtime-generation assumptions — those are out of scope.

## Problem

The Consul's current Phase 1 lets scouts dispatch on vague intent. A scout asked "what does the saved-product reorder flow look like?" without a stated unknown returns a broad survey. The Consul absorbs the survey, the Imperator's context window absorbs the Consul's absorption, and the spec ends up shaped by reconnaissance volume rather than reconnaissance precision.

The Consul's current Phase 3 lets a single-spec assumption ride from deliberation straight into codification. Multi-campaign requests (e.g., "let customers rename and reorder saved products") look superficially like one feature. Without a synthesis checkpoint, the Consul writes one spec that compounds two independent campaigns. The Censor catches this late, sometimes; the Provocator catches it adversarially, sometimes; both cost a verification round and sometimes a re-spec.

Both failures are upstream of writing — process drift, not artifact drift. They cannot be fixed by tightening the Censor or the Provocator. They are fixed by adding two narrow checkpoints inside the Consul's own discipline.

## Goals

- The Consul writes a compact Brief before any scout dispatch and uses the Brief's named unknowns as the dispatch trigger.
- Scouts dispatch only against unknowns that materially affect the spec or shorten the critical path.
- The Consul writes an Estimate-lite synthesis after deliberation and before the spec, and uses it to detect multi-campaign scope.
- Multi-campaign detection halts spec writing and asks the Imperator to decompose.
- Tiny / direct tasks have an explicit skip path so the discipline does not become bureaucratic overhead.

## Non-Goals

- Do not change `/edicts`, `/legion`, `/march`, the verification engine, or the Spec Discipline Rule.
- Do not add new agents, new verifier ranks, or new dispatch lanes.
- Do not change model routing, reasoning policy, or any Action Tier behavior.
- Do not require the Imperator to consent to the Brief or Estimate-lite as a gate. The Consul writes them; the Imperator may interject.
- Do not require visual companion for either artifact.
- Do not persist Brief or Estimate-lite as required case-file deliverables. Persistence is plan-level.
- Do not inherit any branch commands, manifest patches, codex-routing patches, or runtime-generation assumptions from the source idea dump.
- Do not implement the discipline in this spec-writing pass.

## Required Behavior

### 1. The Consul Brief

The Brief is a compact framing of the work before any scout is dispatched.

**Required contents.** Nine fields, each present, none larger than necessary:

|Field|Contract|
|-|-|
|Goal|One sentence. The work this case is about.|
|Success metric|Observable outcome. What the Imperator would be able to see, run, or measure when done.|
|Non-goals|What this must not become or expand into.|
|Domain concepts to verify|Concepts whose misunderstanding would poison the spec. Empty if all concepts are already verified in this session.|
|Known constraints|Imperator-stated, doctrine-derived, or technical constraints that bound the design space.|
|Unknowns|Facts the Consul does not yet know that materially affect the spec or critical path. The list that gates scout dispatch.|
|Likely code surfaces|Repos, modules, components, routes, or workflows the work is likely to touch. Best-effort, revisable.|
|Scout lanes|Which scout flavors are needed (none / domain / codebase / docs / hybrid). Empty if no scouts will dispatch.|
|Decision gates|Questions that require Imperator or Consul judgment, not scout retrieval.|

**When required.** The Brief is required by default before the Consul dispatches any scout, and required before the Consul writes a spec when the work touches more than one module, more than one repo, or names a domain concept the Consul has not just verified in this session.

**When skippable.** The Brief may be skipped only when **all** of the following hold:

- No scout dispatch is anticipated.
- The work is single-file or single-module scope.
- Doctrine reads in this session already cover every named domain concept.
- The success metric is observable in one sentence without further deliberation.

If any one of these fails, the Brief is required.

The four skip conditions are continuously-evaluated invariants, not a one-time judgment. If any condition ceases to hold mid-spec — scope grows to a second module, a domain concept surfaces that needs verification, or the success metric becomes compound — the Consul halts spec writing, writes the Brief retroactively, and resumes the discipline from the appropriate point.

**Ordering.** The Brief precedes scout dispatch. It must be visible in the Consul's message thread before the message that dispatches scouts. It does not have to precede Phase 2 deliberation — when the Imperator's initial framing is too vague to articulate a Goal, the Consul may open deliberation first, extract enough clarity, and then write the Brief before scouting.

**Presentation contract.** The Brief is presented inline in the Consul's message thread. The Imperator may interject. The Consul does not pause for explicit confirmation — the discipline is transparency, not approval gating. The Consul may amend the Brief mid-session as new facts surface; an amended Brief is presented again before any further scout dispatch. Scouts already in flight are re-judged against the amended Brief: if the unknown a scout was dispatched against has been removed or reframed as a Decision gate, the Consul evaluates the scout's return on relevance and may discard it as no longer load-bearing on the spec.

**Empty fields are valid.** A Brief with zero Unknowns, zero Domain concepts, or zero Scout lanes is acceptable. The Brief's value is the framing exercise as a whole, not the gating-on-unknowns mechanic alone — Goal, Non-goals, Known constraints, Likely code surfaces, and Decision gates discipline the spec even when retrieval is not needed.

### 2. Scout Dispatch Gating

A scout dispatch must reference a named unknown from the current Brief. The dispatch prompt must state the unknown and how its resolution materially affects the spec or the critical path.

If the unknown cannot be resolved by any available scout (no rank can answer the question), the unknown is escalated to the Imperator as a decision gate, not dispatched.

More scouts is not automatically better. A scout that resolves no Brief unknown is not dispatched.

### 3. The Estimate-lite

The Estimate-lite is a six-section synthesis written after deliberation and before the spec.

**Required contents.** Six sections, each present:

|Section|Contract|
|-|-|
|Intent|What the Consul understands the Imperator is really trying to achieve, and why. One paragraph.|
|Effects|What must change to achieve the Intent, independent of implementation. Behavior, contracts, data shapes at boundaries — not file paths or function names.|
|Terrain|Where the work lands. Repos, modules, existing contracts that constrain the design.|
|Forces|Which dispatch ranks the Consul anticipates the work will need (scouts, verifier ranks, implementer ranks), with reasoning. Informational only — does not override existing routing rules and does not pick models.|
|Coordination|What can run in parallel. What must sequence. What requires an Imperator gate.|
|Control|Review checkpoints, risk tier as the Consul reads it, and any human gates the work needs.|

**When required.** The Estimate-lite is required by default before the Consul writes any spec.

**When skippable.** The Estimate-lite may be skipped only when the Brief was skipped under the tiny / direct exception **and** the work is a single task with no cross-module Coordination question. If the Brief was written, the Estimate-lite is written.

The skip linkage is asymmetric by design. The Estimate-lite serves two functions: decomposition detection AND framing rigor (forcing the Consul to articulate Intent, Effects, Terrain, Forces, Coordination, Control before spec writing). Brief-skipped under tiny / direct implies the work is small enough that framing rigor is not load-bearing. Brief-required for any reason — domain concept, cross-module scope, scout dispatch — implies the framing rigor is, even when decomposition risk is low.

**Ordering.** The Estimate-lite is written after deliberation produces a coherent design — including any scout returns integrated into the Consul's understanding of Effects, Terrain, and Forces — and before the spec is written. It is presented inline before the spec write.

**Forces field — non-routing clause.** The Forces field documents which ranks the Consul anticipates the work will need. It is informational synthesis. It does not override the existing dispatch rules in `claude/skills/consul/SKILL.md`, `codex/source/protocols/consul-routing.md`, or any verification-template dispatch contract. It does not select a model or a reasoning policy. If Forces appears to require a rank that does not exist or a routing change, the Consul names that as a Decision gate, not a routing override.

### 4. Decomposition Trigger

The Estimate-lite must trigger decomposition when the synthesis shows the request is more than one campaign. A decomposition signal is present when **any** of the following hold:

- Two or more independent Effects sets share no Terrain.
- Coordination shows two waves where the second cannot start without an independent Imperator approval gate.
- Forces names two non-overlapping rank sets that operate on disjoint repos with no contract between them.
- The Goal cannot be written in one sentence without compounding *independent* outcomes — outcomes that share no domain invariant, module, or anchor. A coupled compound Goal (e.g., "add idempotency to cart-complete and order-create through the same anchor") does not trigger this criterion. The test is semantic, not syntactic.

When a decomposition signal is present, the Consul halts spec writing, announces the signal in the message thread, and asks the Imperator to decompose into separate campaigns or to confirm a single combined campaign with explicit reasoning. The Consul does not unilaterally decompose; the Imperator decides.

When the Imperator confirms a single combined campaign despite the trigger, the Consul records the trigger and the override as an explicit accepted-risk note in the spec — placed in the Confidence Map, the Non-goals section, or as a callout in the spec body, at the Consul's judgment. The trail is preserved so downstream verifiers and future readers can see that the trigger was raised and the Imperator overrode it deliberately. The Consul then proceeds to spec writing.

### 5. Negative Scope (Preservation Contract)

The following are explicitly out of scope and must be unchanged by any plan that implements this spec:

|Surface|Status|
|-|-|
|`/edicts` skill flow|Unchanged.|
|`/legion` skill flow|Unchanged.|
|`/march` skill flow|Unchanged. Must not become heavier.|
|Verification protocol (`claude/skills/references/verification/protocol.md`)|Unchanged.|
|All five verification templates (`spec-verification.md`, `plan-verification.md`, `campaign-review.md`, `mini-checkit.md`, `tribune-verification.md`)|Unchanged.|
|Spec Discipline Rule|Unchanged.|
|Ambiguity elimination subsection|Unchanged.|
|Phase 0, Phase 2, Phase 3 ordering otherwise|Unchanged.|
|Visual companion|Unchanged. Brief and Estimate-lite are text artifacts and must not require visual rendering.|
|Model routing / reasoning policy|Unchanged.|
|Active dispatch agents (`consilium-{censor,praetor,provocator,tribunus,soldier,scout}`)|Unchanged. No new agent files.|
|Codex active dispatch ranks (Interpres, Speculator, Arbiter, Tribunus)|Unchanged.|
|Doctrine files (`$CONSILIUM_DOCS/doctrine/`)|Unchanged.|

The plan implementing this spec edits the Consul's discipline prose. It does not edit machinery elsewhere unless a Codex-side parity insertion is judged necessary by the plan author — and even that insertion may not change Codex dispatch rules.

## Confidence Map

|Section|Confidence|Evidence|
|-|-|-|
|Brief contents (9 fields)|High|Imperator named all nine fields directly in the request; consistent with source idea dump phrasing.|
|Brief required-by-default vs skippable|Medium|Imperator stated "may be skipped for tiny/direct tasks" but did not enumerate the boundary. The four-condition all-of test is the Consul's synthesis.|
|Brief precedes scout dispatch|High|Imperator: "must happen before Scout dispatch, not after existing Scout language."|
|Scout-dispatch gating on named Brief unknowns|High|Imperator: "scouts only dispatch for named unknowns that materially affect the spec or critical path."|
|Estimate-lite six sections|High|Imperator named Intent, Effects, Terrain, Forces, Coordination, Control directly.|
|Estimate-lite required by default|Medium|Imperator stated it must precede spec writing; did not explicitly forbid skipping. The Consul's synthesis ties the skip rule to the Brief's tiny/direct path.|
|Decomposition trigger criteria|Medium|Imperator: "Estimate-lite triggers decomposition when one request is really multiple campaigns." The four-criterion test is the Consul's synthesis to make the trigger non-vague. Criterion #4 is explicitly semantic (independent outcomes), not syntactic (presence of "and"), to prevent false positives on coupled compound Goals.|
|Forces non-routing clause|High|Imperator hard boundary: "Do not change model routing." The Forces field's informational role is the only reading consistent with that boundary.|
|Persistence is plan-level (not required)|Medium|Imperator did not address persistence. Default is "no required persistence" because mandatory case-file deliverables would conflict with the boundary "Do not make /march heavier" by analogy and would slip into ceremony.|
|Negative scope list|High|Imperator hard boundaries listed in the request; surface list cross-checked against the live repo.|

## Success Criteria

- The Consul's Phase 1 has a named Brief checkpoint between Scope assessment and any scout dispatch.
- The Consul's Phase 3 has a named Estimate-lite checkpoint between deliberation and spec writing.
- A scout dispatch prompt that does not reference a Brief unknown is recognizable as a discipline violation by reading the Consul's own message thread.
- An Estimate-lite that detects multi-campaign scope produces a decomposition announcement in the Consul's message thread before any spec is written.
- The tiny / direct skip path is articulable in one sentence by the Consul: the four conditions all hold.
- After implementation, no file outside the Consul prose surface — and possibly the Codex consul-routing parity insertion — has changed.

## Acceptance Test Scenarios

Three scenarios the implementation must satisfy. These are observable in a Consul session transcript, not unit tests.

**Scenario A — tiny / direct task.**
Imperator: "Add a `--dry-run` flag to the existing `case-new` script." All four skip conditions hold (single file, no scout dispatch, no domain concept, success metric is one sentence). The Consul skips the Brief, skips the Estimate-lite, proceeds to the spec. The transcript names the skip and the four conditions in one line.

**Scenario B — normal task with one unknown.**
Imperator: "Let customers rename their saved products." Scope assessment shows one campaign but the saved-product domain concept must be re-verified and the cart line-item display surface is unknown. The Consul writes the Brief naming both unknowns. A single scout dispatches against the cart line-item unknown. The doctrine read covers the saved-product concept. After deliberation, the Consul writes the Estimate-lite with all six sections. No decomposition signal. The Consul writes the spec.

**Scenario C — multi-campaign request disguised as one.**
Imperator: "Let customers rename and reorder saved products." Scope assessment surfaces two distinct outcomes. The Consul writes the Brief. Two scouts dispatch against two distinct unknowns. The Estimate-lite shows two independent Effects sets sharing only the saved-product Terrain — rename and reorder share no domain invariant, no anchor, no module beyond the saved-product table itself. Decomposition signal triggers (criterion #1 and the semantic reading of criterion #4). The Consul halts, announces the signal, asks the Imperator to decompose or confirm. The Consul does not write a spec until the Imperator decides. If the Imperator confirms a single combined campaign, the Consul records the trigger and the override in the spec before proceeding.

## Open Decisions Deferred to Plan

These are HOW questions and belong to the plan author, not this spec:

- Exact insertion point and prose wording inside `claude/skills/consul/SKILL.md`.
- Whether to mirror the discipline into `codex/source/protocols/consul-routing.md`. The discipline applies to the Consul role; whether the Codex runtime gets an explicit prose insertion is a plan judgment, bounded by the negative-scope contract above.
- Whether to add a one-line reference to the discipline in `claude/CLAUDE.md`'s Architecture section.
- Whether to add an example Brief or Estimate-lite block to the SKILL.md prose, or to keep the SKILL.md prose abstract and put examples in a referenced doc.
- Section heading naming inside SKILL.md (e.g., "Consul Brief" vs "Brief" vs "Reconnaissance Brief"). The contract is the discipline, not the heading.
- Whether the implementation also adjusts the Phase 1 prose order so that Scope assessment visibly precedes Codebase exploration (the live SKILL.md describes them in the reverse order; that prose ordering is a plan-level fix).
