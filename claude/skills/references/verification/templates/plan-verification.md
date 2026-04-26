# Plan Verification Template

Dispatches independent verification on a plan artifact. Used by the edicts skill after the Consul writes and self-reviews a plan.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else.

---

## When to Dispatch

After the Consul:
1. Writes the plan with inline confidence annotations
2. Completes self-review (layer 1)
3. Announces: "Dispatching Praetor and Provocator for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Praetor + Provocator**, dispatched in parallel (two Agent tool calls in one message, both with `run_in_background: true`).

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

## Dispatch: Provocator

```
Agent tool:
  subagent_type: "consilium-provocator"
  description: "Provocator: stress-test plan"
  mode: "auto"
  run_in_background: true
  prompt: |
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

    You are the Provocator. Your job is to BREAK this plan.

    Same adversarial mandate as spec verification, plus:

    1. Execution friction: what happens when tasks hit unexpected code?
       What if file paths have changed? What if types don't match?

    2. Ordering assumptions: could a different execution order expose problems
       the plan doesn't anticipate?

    3. Integration gaps: do the tasks, when assembled, produce a coherent
       whole? Or are there seams where independently-correct tasks create
       emergent problems?

    4. Scope leaks: does any task require work the plan doesn't acknowledge?
       "Just update the component" that actually requires updating three
       consumers?

    Do NOT propose alternatives. Report what breaks.

    ## Output Format

    Return findings per the Codex format:

    **[CATEGORY] — [brief title]**
    - Evidence: [exact task reference and what it assumes]
    - Source: [what creates the vulnerability]
    - Assessment: [what breaks and under what conditions]

    Include SOUND findings for areas that survived scrutiny.
    Tag every finding clearly.
```

---

## After Both Return

Same as spec verification: handle findings per protocol section 6, resolve conflicts, present attributed summary to Imperator.
