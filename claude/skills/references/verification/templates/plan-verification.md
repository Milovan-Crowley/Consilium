# Plan Verification Template (Five-Lane Provocator + Praetor)

Dispatches independent verification on a plan artifact. Used by the edicts skill after the Consul writes and self-reviews a plan.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, dispatch mechanics, §12 differential re-verify, §13 lane failure handling, §14 merge protocol).

---

## When to Dispatch

After the Consul:
1. Writes the plan with inline confidence annotations
2. Completes self-review (layer 1)
3. Announces: "Dispatching the Praetor and the Provocator's five lanes for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Praetor + 5 Provocator lanes**, dispatched in parallel — six Agent tool calls in one message, all with `run_in_background: true`. The Provocator role decomposes into five lanes per protocol §14 Aggregation Contract:

- `consilium-provocator-overconfidence` — Overconfidence Audit lane
- `consilium-provocator-assumption` — Assumption Extraction lane
- `consilium-provocator-failure-mode` — Failure Mode Analysis lane (with plausibility threshold)
- `consilium-provocator-edge-case` — Edge Case Hunting lane (with plausibility threshold)
- `consilium-provocator-negative-claim` — Negative Claim Attack lane (Bash-armed)

---

## Dispatch: Praetor

```
Agent tool:
  subagent_type: "consilium-praetor"
  description: "Praetor: verify plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    ## The Artifact

    The following plan requires verification. It implements the spec included
    below. Both carry inline confidence annotations.

    ### The Plan
    {PASTE FULL PLAN CONTENT}

    ### The Spec It Implements
    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Context

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    You are the Praetor. Your job is to verify FEASIBILITY — whether this
    plan will survive contact with reality.

    1. Dependency trace: for each task, identify its inputs. What files,
       functions, types, or state does it require? Verify those inputs exist
       either in the current codebase or in a preceding task. Forward
       dependencies (task N needs something from task N+M) are findings.

    2. File collision check: map which tasks touch which files. When multiple
       tasks modify the same file, verify that later tasks account for earlier
       tasks' changes.

    3. Assumption audit: the plan makes claims about existing code — "this
       hook returns X," "this endpoint exists at Z." Flag every assumption.
       Use confidence annotations to identify which were verified vs inferred.
       Inferred assumptions are findings.

    4. Spec coverage: do the plan's tasks, taken together, deliver everything
       the spec requires? A feasible but incomplete plan is a finding.

    5. Doctrine cross-check: the plan may introduce domain references not
       in the spec. Verify those against doctrine.

    6. Deviation-as-improvement: if the plan deviates from the spec and the
       deviation is better, report SOUND with reasoning.

    ## Output Format

    Return findings per the Codex format:

    **[CATEGORY] — [brief title]**
    - Evidence: [exact task reference and what it assumes/requires]
    - Source: [spec section, $CONSILIUM_DOCS doctrine entry, or codebase fact]
    - Assessment: [what needs to change for the plan to be executable]

    Include SOUND findings for task chains you verified as feasible.
    Tag every finding clearly.
```

---

## Common Lane Preamble (Provocator lanes)

All five Provocator lane prompts share this preamble. The lane-specific Mission section is appended.

```
## The Artifact

The following plan requires adversarial review. It implements the spec
included below. Both carry inline confidence annotations — High confidence
is your PRIMARY TARGET.

### The Plan
{PASTE FULL PLAN CONTENT}

### The Spec It Implements
{PASTE FULL SPEC CONTENT}

## Domain Knowledge

{DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

## Context

{PASTE STRUCTURED CONTEXT SUMMARY}

## Your Mission

{LANE-SPECIFIC MISSION — see per-lane sections below}

## Lane Discipline

You are ONE of five Provocator lanes verifying a plan. Your sister lanes
attack other surfaces. Stay in your lane — do not raise findings on a
sister lane's surface. The dispatcher's merge protocol (per protocol §14)
handles cross-lane synergy. Surfaces:

- Overconfidence Audit — claims-without-evidence in the plan, missing/null
  confidence map, certainty-shaped language ("trivially," "simple update").
- Assumption Extraction — narrative claims about existing code, ordering
  assumptions ("task N before task N+1 because…"), plan-claims about types
  and signatures.
- Failure Mode Analysis — execution friction (paths changed, types
  mismatched), integration gaps (independently-correct tasks producing
  emergent failures), step-level failure paths.
- Edge Case Hunting — boundary task interactions, file-collision edges,
  scope leaks ("just update the component" requiring three consumer
  updates).
- Negative Claim Attack — "no migration", "no breaking changes", "task N
  requires nothing new from existing code", "does not route through".

Do NOT propose alternatives. Report what breaks.
Be relentless but bounded. Attack every in-lane surface once.

## Output Format

Return findings per the Codex format:

**[CATEGORY] — [brief title]**
- Evidence: [exact task reference and what it assumes]
- Source: [what creates the vulnerability]
- Assessment: [what breaks and under what conditions]

Include SOUND findings for areas that survived scrutiny.
Tag every finding clearly.

## Trigger Declaration (REQUIRED)

At the very end of your report, after all findings, emit a YAML trigger
declaration per protocol §12:

```yaml
lane: <your lane name>
surface_predicates:
  coverage: "specific" | "entire_artifact"
  keywords: [<word>, <word>, ...]
  section_patterns: [<regex>, ...]
  evidence_base: [<file:line>, ...]
```

For plan-mode: section_patterns commonly include `^### Task ` or `^## Task `
to scope to a specific task; evidence_base may include `file:line` citations
the plan rests on (e.g., `src/app/_hooks/useProduct.ts:1` if the plan claims
that hook exists).
```

---

## Dispatch: Lane 1 — Overconfidence Audit

```
Agent tool:
  subagent_type: "consilium-provocator-overconfidence"
  description: "Provocator/overconfidence: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Overconfidence Audit lane — plan mode)

    Your surface is certainty without evidence in the plan. Attack:

    1. Confidence-map sweep first: scan every per-task confidence annotation.
       Missing or null confidence map at all is a GAP.

    2. Certainty-language extraction in plan tasks: "straightforward,"
       "trivial," "obvious," "simple update," "no risk." Each occurrence
       without justification is CONCERN.

    3. High-confidence task audit: for each task annotated High, verify the
       evidence cited (codebase verification, spec markdown link, prior-task
       output). High confidence with thin evidence is CONCERN; persistent
       chains promote to GAP.

    4. Plan-WHY citation form (REQUIRED enforcement check): per the Spec
       Discipline Rule, plan WHY cites spec sections via markdown links of
       the form `[spec §N — Section Name](../spec.md#N-section-name)`.
       Audit every per-task confidence annotation in the plan:
       (a) If the annotation references a spec section, it MUST be a
       markdown link. Prose section-name citations (e.g., "per the
       Differential Re-Verify section") are a GAP — section-name prose goes
       stale silently under spec revision.
       (b) For each markdown link found, verify the link's anchor matches
       an actual heading in the spec file. Broken anchor (no matching
       heading) is a GAP. Use the Read tool on the spec to confirm.
       (c) If the plan's "Notes for the Legatus" section explicitly
       acknowledges a documented bootstrap deviation (e.g., the plan that
       introduces the citation contract itself), accept the deviation as
       SOUND with a note — the deviation is plan-acknowledged, not silent
       drift.
       This lane is the enforcement surface for the Plan-WHY citation
       contract; if this check is skipped, the contract decays.

    Sister lanes own assumption extraction, failure mode, edge case, and
    negative claim. Do not raise findings on those surfaces.
```

---

## Dispatch: Lane 2 — Assumption Extraction

```
Agent tool:
  subagent_type: "consilium-provocator-assumption"
  description: "Provocator/assumption: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Assumption Extraction lane — plan mode)

    Your surface is unstated premises in the plan. Attack:

    1. Ordering audit: every "task N requires X from task M" claim is an
       assumption. Verify M actually produces X in the form N expects.
       Forward references and implicit dependencies are findings.

    2. Existing-code audit: every plan claim about existing code (file paths,
       function signatures, type shapes, return values, exported names) is
       an assumption. Inferred (Medium-confidence) claims without codebase
       verification are findings.

    3. Plan-mode premise extraction: read every "this task is small,"
       "trivial change," "just update X" — these are premises about the
       blast radius. Each unexamined premise is a candidate GAP.

    Sister lanes own overconfidence, failure mode, edge case, and negative
    claim. Do not raise findings on those surfaces.
```

---

## Dispatch: Lane 3 — Failure Mode Analysis

```
Agent tool:
  subagent_type: "consilium-provocator-failure-mode"
  description: "Provocator/failure-mode: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Failure Mode Analysis lane — plan mode)

    Your surface is execution friction and integration gaps. Attack:

    1. Execution friction: for each task, what happens when it hits unexpected
       state? File paths changed? Types mismatched? Intermediate state
       invalidated by parallel work?

    2. Integration gaps: do the tasks, when assembled, produce a coherent
       whole? Or are there seams where independently-correct tasks create
       emergent failure?

    3. Step-level failure paths: every step that runs a command or applies an
       edit can fail. Does the plan say what to do on failure? Does it
       distinguish "hard halt" from "retry once"?

    4. Plausibility threshold (REQUIRED): before raising a failure mode,
       apply this gate. Raise the finding ONLY IF at least one is true:
       (1) Statable as a single soldier action.
       (2) Plausibly hit within the first execution attempt.
       (3) Violates a spec-asserted invariant OR a doctrine-asserted invariant
           binding for the artifact's domain.
       (4) In a class of failures the codebase has historically failed at
           (per `$CONSILIUM_DOCS/doctrine/known-gaps.md`).
       If none — theatrical. Do NOT raise.

    Sister lanes own overconfidence, assumption extraction, edge case, and
    negative claim. Do not raise findings on those surfaces.

    Read `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting.
```

---

## Dispatch: Lane 4 — Edge Case Hunting

```
Agent tool:
  subagent_type: "consilium-provocator-edge-case"
  description: "Provocator/edge-case: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Edge Case Hunting lane — plan mode)

    Your surface is task-boundary edges and scope leaks. Attack:

    1. Task-boundary edges: at each task transition, what state does the
       prior task leave behind? Does the next task assume that state? What
       happens at task N=1 (no prior task) and task N=last (no next task)?

    2. File-collision edges: when multiple tasks touch the same file, the
       order of edits matters. The plan should sequence them safely. Any
       ambiguity in commit-order is an edge.

    3. Scope leaks: every task that says "just update X" should be audited.
       Does X have consumers the plan doesn't acknowledge? Does updating X
       require updating its tests, types, or callers?

    4. Plausibility threshold (REQUIRED): apply the same gate as the
       failure-mode lane:
       (1) Statable as a single soldier action.
       (2) Plausibly hit within the first execution attempt.
       (3) Violates a spec-asserted invariant OR a doctrine-asserted
           invariant binding for the artifact's domain.
       (4) In a class of edges the codebase has historically failed at.
       If none — theatrical. Do NOT raise.

    Sister lanes own overconfidence, assumption extraction, failure mode, and
    negative claim. Do not raise findings on those surfaces.

    Read `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting.
```

---

## Dispatch: Lane 5 — Negative Claim Attack

```
Agent tool:
  subagent_type: "consilium-provocator-negative-claim"
  description: "Provocator/negative-claim: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Negative Claim Attack lane — plan mode)

    Your surface is negative assertions in the plan. Attack:

    1. Negative-claim extraction: find every "no migration", "no breaking
       changes", "task requires nothing new", "does not touch", "unaffected".
       List them.

    2. Cross-repo verification: for each claim, run a verification:
       - Greppable: `rg -n 'pattern' /Users/milovan/projects/divinipress-store /Users/milovan/projects/divinipress-backend`
       - Doctrine: cross-reference `$CONSILIUM_DOCS/doctrine/`.
       - MCP: consult `mcp__medusa__ask_medusa_question`.

    3. Sequencing-claim verification: if the plan claims another in-flight
       case has landed (or hasn't), verify against `git log` and the cited
       commits.

    4. SOUND chain-of-evidence: for SOUND findings, the chain MUST include
       the verification command run AND its result.

    Sister lanes own overconfidence, assumption extraction, failure mode, and
    edge case. Do not raise findings on those surfaces.

    Bash discipline: verify, do not modify. Narrow patterns when greps return
    high volume.
```

---

## After All Six Return — Merge Protocol

The dispatching persona (Consul-as-edicts in main session) merges the six reports per `protocol.md` §14:

1. **Dedup pass.** Near-cognate findings across lanes (or with the Praetor) merge with attribution to all sources — *"GAP (Provocator / overconfidence-audit + assumption-extraction lanes): X"* or *"GAP (Praetor + Provocator / overconfidence-audit lane): X"*.

2. **Synergy pass.** Two CONCERNs across lanes pointing to a single GAP get promoted with reasoning.

3. **Thin-SOUND audit.** Each SOUND checked for chain-of-evidence quality. Re-asked once per merge round, capped. Re-ask response with thin SOUND → escalate the merge.

4. **Conflict resolution.** Per protocol §6.

5. Standard finding handling per protocol §6.

6. Present attributed summary to Imperator with source-lane attribution per protocol §11 + §14 lane suffix. Dedups, synergies, and re-asks visible.

---

## Lane Failure Handling

Per `protocol.md` §13. Same handling as spec-mode:

- No output → re-dispatch once → escalate.
- Crash → escalate immediately.
- Malformed → re-dispatch ONCE with format reminder → escalate.
- Out-of-surface finding → process; flag declaration; disable iteration-2+ fast-path until corrected.

---

## Iteration 2+ — Differential Re-Verify

Per `protocol.md` §12, single-session scope. Same flow as spec-mode:

1. Compute artifact diff (the plan, not the spec — though if the spec was revised mid-session and the plan must update citations, that triggers a re-verify of plan tasks whose WHY links the changed spec section).
2. Per lane, evaluate intersection rule against the lane's trigger declaration.
3. No intersection → fast-path. Intersection → re-fire scoped to changed content.

The Praetor does NOT use differential re-verify — it always re-runs in full on iteration 2+.

---

## Context Exhaustion Checkpoint

Per `protocol.md` §14, when the combined volume of lane findings approaches Consul context capacity, the Consul presents a compressed summary to the Imperator and requests focus areas before completing the merge.
