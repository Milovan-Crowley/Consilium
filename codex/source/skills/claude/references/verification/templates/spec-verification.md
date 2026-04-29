# Spec Verification Template

Dispatches independent verification on a spec artifact. Used by the consul skill after the Consul writes and self-reviews a spec.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, dispatch mechanics).

---

## When to Dispatch

After the Consul:
1. Writes the spec with inline confidence annotations
2. Completes self-review (layer 1) including the Spec Discipline Rule scope check ("does any section contain HOW that belongs in the plan?")
3. Announces: "Dispatching the Censor and the Provocator for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Censor + Provocator**, dispatched in parallel — two Agent tool calls in one message, both with `run_in_background: true`.

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

    You are the Provocator. Attack the spec until it cracks or you cannot
    make it crack. Cover every adversarial surface in one pass:

    1. Overconfidence audit. Scan every High-confidence section for evidence
       thinner than the certainty. Certainty-language ("straightforward,"
       "obvious," "trivial") without justification is suspect.

    2. Assumption extraction. Find every unstated premise — narrative claims
       about behavior, ordering, the user's path, the API's response. For
       each: what happens when it's wrong?

    3. Failure mode analysis. For each major flow, list the steps and the
       failure modes per step (network errors, expired sessions, concurrent
       access, invalid input, missing permissions, empty states, timeouts).
       Does the spec address each, or explicitly exclude it?

    4. Edge case hunting. For each entity or quantity, list its bounds. Zero,
       one, the limit, negative, null. For each named field, verify
       nullability and optionality.

    5. Negative claim attack. Find every "no X", "does not Y", "never Z",
       "unaffected", "none". Verify each — by codebase grep, doctrine
       cross-reference, or MCP query. SOUND on a negative claim requires the
       verification command and its result in the chain of evidence.

    Plausibility threshold: raise a finding only if it is statable as a
    single user action, plausibly hit within the first ~100 real sessions,
    violates a spec- or doctrine-asserted invariant, or is in a class the
    codebase has historically failed at (per
    `$CONSILIUM_DOCS/doctrine/known-gaps.md`). Theatrical edge cases — five
    unlikely events all happening together — do not raise. Read
    `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting.

    Do NOT propose alternatives. Report what breaks.

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

The Consul reads both reports and applies the standard finding handling per `protocol.md` §6:

- **MISUNDERSTANDING** → halt, escalate to Imperator. No auto-fix.
- **GAP** → fix silently, note in summary. If the same GAP recurs after one fix attempt, escalate.
- **CONCERN** → consider on merit. Adopt if genuinely better; reject with reasoning if the verifier lacks context.
- **SOUND** → note in summary with attribution.

Apply the **verification scope firewall** per protocol §6: a finding blocks only when it identifies a violation of the approved goal, a contradiction with a frozen contract, a conflict with a domain invariant, missing coverage of a required acceptance criterion, or a realistic first-pass execution failure caused by the artifact as written. Speculative future features, alternate-architecture preferences, and invented edge cases outside the stated goal are non-blocking notes.

Conflicting findings between the Censor and the Provocator are resolved by the Consul on merit per protocol §6. Unresolvable contradictions escalate to the Imperator.

Present the attributed summary to the Imperator per protocol §11.

---

## Re-verification on Material Change

When the spec materially changes after verification cleared, rerun Censor and Provocator in full. Tiny copy or formatting changes that do not alter meaning may skip re-verification — the Consul states why no re-verification is needed.
