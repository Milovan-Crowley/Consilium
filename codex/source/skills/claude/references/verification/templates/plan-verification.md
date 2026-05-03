# Plan Verification Template

Dispatches independent verification on a plan artifact. Used by the edicts skill after the Consul writes and self-reviews a plan.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, dispatch mechanics).

---

## When to Dispatch

After the Consul:
1. Writes the plan
2. Completes self-review (layer 1)
3. Announces: "Dispatching the Praetor and the Provocator for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Praetor + Provocator**, dispatched in parallel — two Agent tool calls in one message, both with `run_in_background: true`.

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
    below. Either artifact may carry evidence, risk, or confidence notes when
    useful, but the plan must be verifiable without a confidence map.

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

    3. Files-block well-formedness: every task must carry a `**Files:**`
       block. Recognized sub-bullets are exactly `Create:`, `Modify:`,
       `Test:`, and `Read:`. Unknown sub-bullets are findings. Write entries
       under `Create:`, `Modify:`, and `Test:` must be explicit paths with no
       globs or wildcards; `Read:` entries may be files or path patterns. A
       task with no writes must use the literal `(none)` marker directly under
       `**Files:**`; reads-only tasks keep `(none)` and add `Read:` entries
       after it. Malformed Files blocks are GAP findings because this block is
       a contract surface the Centurio cannot repair in the field. Dormant
       hook: if a plan declares parallel-safe task groups, paths under
       `Create:`, `Modify:`, and `Test:` must be disjoint within each
       declared group.

    4. Decision completeness: verify that each task gives the implementing
       rank the files, boundaries, interfaces, acceptance criteria,
       verification, and decisions already made. If the task leaves
       architecture, scope, policy, or public contract choices to the
       Centurio, report an under-specified plan GAP.

    5. Assumption audit: the plan makes claims about existing code — "this
       hook returns X," "this endpoint exists at Z." Flag every assumption.
       Evidence/risk notes may help locate claims, but do not depend on them.
       Inferred assumptions that control execution are findings.

    6. Spec coverage: do the plan's tasks, taken together, deliver everything
       the spec requires? A feasible but incomplete plan is a finding.

    7. Doctrine cross-check: the plan may introduce domain references not
       in the spec. Verify those against doctrine.

    8. Right-sizing: verify the plan is neither over-specified nor
       under-specified. Ordinary code pasted into the plan is a concern when
       decisions would be clearer; missing decisions are a GAP. Verification
       should be sufficient without being wasteful.

    9. Deviation-as-improvement: if the plan deviates from the spec and the
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
    included below. Evidence, risk, or confidence notes may be present, but
    your target is the artifact's actual execution contract.

    ### The Plan
    {PASTE FULL PLAN CONTENT}

    ### The Spec It Implements
    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Context

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    You are the Provocator. Attack the plan until it cracks or you cannot
    make it crack. Cover every adversarial surface in one pass:

    1. Overconfidence audit. Scan certainty-language ("trivial," "obvious,"
       "simple update," "no risk") for evidence thinner than the certainty.
       Notes marked High can be attacked, but High is not the only target.

    2. Right-sizing attack. Find both plan failures:
       - over-specified plans that paste ordinary code, defensive work, or
         ceremony instead of decisions;
       - under-specified plans that sound polished but force the Centurio to
         choose architecture, scope, interfaces, or edge-case policy.

    3. Assumption extraction. Every plan claim about existing code — file
       paths, function signatures, type shapes, return values, exported names —
       is an assumption. Claims without codebase verification are findings
       when they control execution. Every "task N requires X from task M" is
       an ordering assumption; verify M actually produces X in the form N
       expects.

    4. Failure mode analysis. For each task, what happens when it hits
       unexpected state — file paths changed, types mismatched, intermediate
       state invalidated? Does the plan distinguish "hard halt" from "retry
       once"? Do the tasks, when assembled, produce a coherent whole, or are
       there seams where independently-correct tasks create emergent failure?

    5. Scope discipline. Attack defensive work that is outside the approved
       spec. A finding may add work only when tied to the approved spec, an
       existing domain invariant, a frozen contract, or a realistic first
       execution failure caused by the plan as written.

    6. Edge case hunting. At each task transition, what state does the prior
       task leave behind? Does the next task assume that state? When multiple
       tasks touch the same file, the order of edits matters — is it
       sequenced safely? Every "just update X" should be audited for
       consumers, tests, types, callers.

    7. Negative claim attack. Find every "no migration", "no breaking changes",
       "task requires nothing new", "does not touch", "unaffected". Verify
       each — by codebase grep, doctrine cross-reference, or MCP query. SOUND
       on a negative claim requires the verification command and its result.

    Plausibility threshold: raise a finding only if it is statable as a
    single centurio action, plausibly hit within the first execution attempt,
    violates a spec- or doctrine-asserted invariant, or is in a class the
    codebase has historically failed at (per
    `$CONSILIUM_DOCS/doctrine/known-gaps.md`). Theatrical failures — five
    unlikely events all happening together — do not raise. Read
    `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting.

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

The Consul (in edicts stance) reads both reports and applies the standard finding handling per `protocol.md` §6:

- **MISUNDERSTANDING** → halt, escalate to Imperator.
- **GAP** → fix silently. If the same GAP recurs after one fix attempt, escalate.
- **CONCERN** → consider on merit. Adopt if genuinely better; reject with reasoning if the verifier lacks context.
- **SOUND** → note in summary with attribution.

Apply the **verification scope firewall** per protocol §6: a finding blocks only when it identifies a violation of the approved goal, a contradiction with a frozen contract, a conflict with a domain invariant, missing coverage of a required acceptance criterion, or a realistic first-pass execution failure caused by the artifact as written. Speculative future features, alternate-architecture preferences, and invented edge cases outside the stated goal are non-blocking notes.

Conflicting findings between the Praetor and the Provocator are resolved by the Consul on merit. Unresolvable contradictions escalate to the Imperator.

Present the attributed summary to the Imperator per protocol §11.

---

## Re-verification on Material Change

When the plan materially changes after verification cleared, rerun Praetor and Provocator in full. Do not fast-path unchanged sections.
