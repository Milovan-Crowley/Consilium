# Campaign Review Template

Dispatches the full verification triad on a completed implementation. Used by the subagent-driven-dev skill after all tasks complete and pass mini-checkit.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else.

---

## When to Dispatch

After the Legatus:
1. All tasks are complete
2. All tasks have passed Tribunus mini-checkit
3. Legatus prepares implementation output (per protocol section 9)

**This is NOT opt-in.** Campaign review always runs after execution. The Legatus dispatches immediately.

---

## Agents

**Censor + Praetor + Provocator**, all three dispatched in parallel (three Agent tool calls in one message, all with `run_in_background: true`).

---

## Implementation Output Preparation

Before dispatching, the Legatus prepares the implementation output:

**Small implementations (< 5 tasks, < 10 files):**
```bash
git diff {BASE_SHA}...{HEAD_SHA}
```

**Large implementations:** Compile task-scoped diffs in order:
```
### Task 1: [name]
{diff for task 1}

### Task 2: [name]
{diff for task 2}
...
```

The Legatus makes the tactical call on format.

---

## Dispatch: Censor

```
Agent tool:
  subagent_type: "consilium-censor"
  description: "Censor: Campaign review — verify implementation against spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    This is a Campaign review — post-execution verification of the full implementation.

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Your Mission

    Campaign review. Your focus shifts from spec-as-document to
    implementation-as-code.

    1. Spec compliance: does the implementation deliver what the spec
       specified? Walk through each spec requirement and verify it exists
       in the implementation.

    2. Domain correctness in code: are domain concepts correctly implemented?
       Does the code reference the right models, use the right field names,
       implement the right relationships per the $CONSILIUM_DOCS doctrine?

    3. Existence vs correctness: a component that references the right model
       but implements the wrong logic is a finding. Don't stop at "the file
       exists."

    4. Confidence annotations: check whether High-confidence spec sections
       were implemented as confidently stated. Medium/Low sections — verify
       the implementation resolved the uncertainty correctly.

    ## Output Format

    Per Codex format with chain of evidence. Tag every finding.
```

---

## Dispatch: Praetor

```
Agent tool:
  subagent_type: "consilium-praetor"
  description: "Praetor: Campaign review — verify implementation against plan"
  mode: "auto"
  run_in_background: true
  prompt: |
    This is a Campaign review — post-execution verification of the full implementation.

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Your Mission

    Campaign review. Your focus shifts from plan-as-orders to
    implementation-as-execution.

    1. Plan adherence: were tasks executed as specified? Trace each plan
       task to its implementation. Were files created/modified as planned?

    2. Deviation assessment: where the implementation diverges from the plan,
       is the deviation justified? Apply the deviation-as-improvement rule —
       better outcomes are SOUND, unjustified drift is GAP.

    3. Dependency verification: the dependencies you traced in the plan —
       do they hold in actual code? Does the function created in task 2
       match the signature consumed in task 5?

    4. Integration: do the tasks, assembled, produce a coherent whole?
       Cross-task interactions that look fine individually but conflict
       when combined.

    ## Output Format

    Per Codex format with chain of evidence. Tag every finding.
```

---

## Dispatch: Provocator

```
Agent tool:
  subagent_type: "consilium-provocator"
  description: "Provocator: Campaign review — stress-test implementation"
  mode: "auto"
  run_in_background: true
  prompt: |
    This is a Campaign review — the implementation exists. The code is real. This is your last chance to find the cracks before the Imperator ships.

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Your Mission

    Campaign review. The code exists now. You are no longer asking
    "what if this fails in theory?" You are asking "what happens when
    a real user hits this code?"

    1. Edge cases in code: does the implementation handle empty arrays?
       Null values? Rejected promises? Network failures? Concurrent access?

    2. Assumptions that survived: what assumptions from the spec/plan made
       it into code unchallenged? Are they valid in the implementation?

    3. Error paths: does the code handle failures gracefully? Loading states,
       error boundaries, retry logic, user-facing error messages?

    4. Integration pressure: where multiple tasks touch related code,
       what breaks under unexpected combinations?

    Read the actual code. Do not trust summaries. If you can break it
    by reasoning about what a user would do, it's a finding.

    ## Output Format

    Per Codex format with chain of evidence. Tag every finding.
    Your SOUND findings carry the strongest weight — if you couldn't break
    it, the Imperator can trust it.
```

---

## After All Three Return

1. Legatus reads all three reports.
2. Handle findings per protocol section 6:
   - MISUNDERSTANDING → halt, escalate to Imperator
   - GAP → dispatch new fix agent (per protocol section 10)
   - CONCERN → consider
   - SOUND → note
3. Resolve conflicting findings on merit.
4. Present summary to Imperator with finding attribution per protocol section 11.
