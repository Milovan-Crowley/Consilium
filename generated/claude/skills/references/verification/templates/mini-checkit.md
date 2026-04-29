# Mini-Checkit Template

Dispatches the Tribunus to verify a single completed task during execution. Used by the subagent-driven-dev skill after each implementing agent reports DONE or DONE_WITH_CONCERNS.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else.

---

## When to Dispatch

After each implementing agent reports DONE or DONE_WITH_CONCERNS. The Legatus dispatches immediately. **This is NOT opt-in.** Every task gets verified.

---

## Agent

**Tribunus alone.** Patrol depth. Single pass. Sequential — one task at a time, because the next task may depend on this one being verified clean.

Do NOT use `run_in_background`. The Legatus waits for the Tribunus to return before proceeding to the next task.

---

## Dispatch: Tribunus

```
Agent tool:
  subagent_type: "consilium-tribunus"
  description: "Tribunus: verify task N output"
  mode: "auto"
  prompt: |
    ## The Task Output

    The following files were created or modified by the implementing agent:

    {PASTE CHANGED FILE CONTENTS — current state, not diff}

    ## The Plan Step

    This task was supposed to implement:

    {PASTE THE SPECIFIC PLAN STEP — not the whole plan}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher, focused on what this task touches}

    ## Your Mission

    You are dispatched in the **patrol stance** — verify the implemented task against the plan. Diagnosis stance is dispatched separately via `tribune-verification.md`.

    You are the Tribunus. Patrol depth. Fast, focused, one pass.

    1. Plan step match: does the output deliver what the plan step specified?
       Files created/modified as expected? Code matches intent?

    2. Domain check: are domain concepts used correctly? Right models targeted?
       Right field names? Right relationships?

    3. Reality check: is the code real or stubbed? Look for: placeholder
       returns, placeholder marker comments, empty handlers, hardcoded mock data,
       `{} as Type` casts, `any` types hiding behind correct interfaces.

    4. Integration check: does this task's output break anything previous
       verified tasks built? If earlier tasks added props, hooks, or types
       that this task's files should consume — are they consumed?

    5. Deviation assessment: if the implementation differs from the plan step,
       is it an improvement or drift?
       - Improvement (cleaner approach, better performance, edge case handled):
         report SOUND with reasoning.
       - Drift (wrong approach, missed requirement, domain error):
         report GAP or MISUNDERSTANDING.

    Speed matters. The Legatus is waiting. Findings with evidence, verdict,
    move on. No essays. No architectural opinions. No style suggestions.

    ## Output Format

    Per Codex format with chain of evidence. Brief but complete.

    **[CATEGORY] — [brief title]**
    - Evidence: [file:line or code snippet]
    - Source: [plan step or $CONSILIUM_DOCS doctrine entry]
    - Assessment: [what needs to change, or why it's correct]
```

---

## After Tribunus Returns

Handle findings immediately:

- **SOUND** → Legatus moves to next task.
- **GAP** → Legatus dispatches a new fix agent (per protocol section 10) with the finding, original task, and current file state. After fix, dispatch Tribunus again for re-verification. One re-verification attempt. If GAP persists, escalate to Imperator.
- **CONCERN** → Legatus notes it. Concerns accumulate — the Campaign review evaluates them holistically.
- **MISUNDERSTANDING** → Halt execution entirely. Escalate to Imperator. Do not proceed to next task.
