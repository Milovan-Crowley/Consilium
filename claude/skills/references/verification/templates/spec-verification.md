# Spec Verification Template

Dispatches independent verification on a spec artifact. Used by the consul skill after the Consul writes and self-reviews a spec.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, dispatch mechanics).

---

## When to Dispatch

After the Consul:
1. Writes the spec with inline confidence annotations
2. Completes self-review (layer 1)
3. Announces: "Dispatching Censor and Provocator for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Censor + Provocator**, dispatched in parallel (two Agent tool calls in one message, both with `run_in_background: true`).

---

## Dispatch: Censor

```
Agent tool:
  subagent_type: "consilium-censor"
  description: "Censor: verify spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    ## The Artifact

    The following spec requires verification. Note the inline confidence
    annotations (> **Confidence: High/Medium/Low**) throughout — use them
    to direct your scrutiny.

    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Context

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    You are the Censor. Your job is to verify CORRECTNESS — whether this
    spec is TRUE, not just whether it is coherent.

    1. Domain sweep: scan every entity, relationship, and workflow mentioned.
       Cross-reference each against the $CONSILIUM_DOCS doctrine. Any mismatch is an
       immediate finding.

    2. Requirement completeness: does the spec cover what it claims? Are there
       requirements stated but not elaborated? Edge cases the spec's own logic
       demands but doesn't address?

    3. Internal consistency: do sections contradict each other? Does the
       architecture support the features? Does the data model provide the
       fields later sections need?

    4. Confidence-directed scrutiny: High-confidence sections get your deepest
       examination — look for what the Consul assumed was obvious but isn't.
       Low-confidence sections get validated or corrected.

    Remember: coherent is not correct. A spec can read beautifully while
    describing a system that does not exist.

    ## Output Format

    Return findings per the Codex format:

    **[CATEGORY] — [brief title]**
    - Evidence: [exact quote from spec]
    - Source: [$CONSILIUM_DOCS doctrine entry or spec section]
    - Assessment: [what the spec should do or consider]

    Include SOUND findings with reasoning for sections you verified.
    Tag every finding clearly.
```

---

## Dispatch: Provocator

```
Agent tool:
  subagent_type: "consilium-provocator"
  description: "Provocator: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    ## The Artifact

    The following spec requires adversarial review. Note the inline confidence
    annotations (> **Confidence: High/Medium/Low**) throughout — High confidence
    is your PRIMARY TARGET.

    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {DOMAIN KNOWLEDGE — assembled from `$CONSILIUM_DOCS/doctrine/` file reads by the dispatcher}

    ## Context

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    You are the Provocator. Your job is to BREAK this spec — find what
    everyone else missed.

    1. Confidence sweep: read every inline confidence annotation. High-confidence
       sections are your primary targets. The Consul felt certain — investigate
       whether that certainty is justified by evidence or assumed from momentum.

    2. Assumption extraction: identify every unstated assumption. "The user will
       complete the flow." "The API will return data." "This component will
       receive valid props." For each: what happens when the assumption is wrong?

    3. Failure mode analysis: for each major flow, what are the failure modes?
       Network errors, empty states, expired sessions, concurrent access, invalid
       input, missing permissions. Does the spec address them?

    4. Edge case hunting: boundary conditions. Empty collections. Zero quantities.
       Special characters. The first user. The ten-thousandth user.

    5. Overconfidence audit: where does the spec assert something without evidence?
       "This is straightforward." "This is a simple change." Confidence without
       evidence is your signal to dig.

    Do NOT propose alternatives. Report what breaks, not how to fix it.
    That is the Consul's job.

    Be relentless but bounded. Attack every surface once. Do not spiral into
    hypothetical catastrophes five layers deep.

    ## Output Format

    Return findings per the Codex format:

    **[CATEGORY] — [brief title]**
    - Evidence: [exact quote from spec or unstated assumption]
    - Source: [what creates the vulnerability]
    - Assessment: [what breaks and under what conditions]

    Include SOUND findings for sections that survived your scrutiny.
    Your SOUND is the strongest validation in the Consilium.
    Tag every finding clearly.
```

---

## After Both Return

1. Read both reports.
2. Handle findings per protocol section 6:
   - MISUNDERSTANDING → halt, show Imperator
   - GAP → fix silently
   - CONCERN → consider, adopt or explain
   - SOUND → note
3. Resolve any conflicting findings on merit.
4. Present summary to Imperator with finding attribution per protocol section 11.
