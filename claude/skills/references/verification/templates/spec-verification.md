# Spec Verification Template (Five-Lane Provocator + Censor)

Dispatches independent verification on a spec artifact. Used by the consul skill after the Consul writes and self-reviews a spec.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, dispatch mechanics, §12 differential re-verify, §13 lane failure handling, §14 merge protocol).

---

## When to Dispatch

After the Consul:
1. Writes the spec with inline confidence annotations
2. Completes self-review (layer 1) including the Spec Discipline Rule scope check ("does any section contain HOW that belongs in the plan?")
3. Announces: "Dispatching the Censor and the Provocator's five lanes for verification."

The Imperator can say "skip" to bypass. Default: dispatch.

---

## Agents

**Censor + 5 Provocator lanes**, dispatched in parallel — six Agent tool calls in one message, all with `run_in_background: true`. The Provocator role decomposes into five lanes per protocol §14 Aggregation Contract:

- `consilium-provocator-overconfidence` — Overconfidence Audit lane
- `consilium-provocator-assumption` — Assumption Extraction lane
- `consilium-provocator-failure-mode` — Failure Mode Analysis lane (with plausibility threshold)
- `consilium-provocator-edge-case` — Edge Case Hunting lane (with plausibility threshold)
- `consilium-provocator-negative-claim` — Negative Claim Attack lane (Bash-armed)

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

## Common Lane Preamble (Provocator lanes)

All five Provocator lane prompts share this preamble. The lane-specific Mission section is appended to the preamble. This is the structure each lane's `prompt:` block follows.

> **Substitution contract for the dispatcher.** When the dispatching persona (Consul or Legatus-as-edicts) constructs each lane's Agent tool call, it MUST replace the `{COMMON LANE PREAMBLE}` token in the per-lane `prompt:` block (sections below) with the literal text of the preamble below — verbatim, no edits, including the trailing "## Trigger Declaration (REQUIRED)" sub-section. The lane-specific `## Your Mission (...)` text and `## Lane Discipline` text inside each per-lane block then follows the substituted preamble. This is plain string substitution at dispatch time; there is no template engine. If the dispatcher copies the per-lane block literally with the placeholder still present, the lane subagent receives an un-expanded prompt and the dispatch is malformed (treat as a §13 lane-malformation event).

```
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

{LANE-SPECIFIC MISSION — see per-lane sections below}

## Lane Discipline

You are ONE of five Provocator lanes. Your sister lanes attack other surfaces.
Stay in your lane — do not raise findings that belong to a sister lane's
surface. The dispatcher's merge protocol (per protocol §14) handles cross-lane
synergy. Surfaces:

- Overconfidence Audit — certainty language, confidence-map presence
- Assumption Extraction — narrative claims about behavior, ordering
- Failure Mode Analysis — flow descriptions, success paths, failure modes
- Edge Case Hunting — boundaries, state edges, data shapes
- Negative Claim Attack — negative assertions, "no X" claims

Do NOT propose alternatives. Report what breaks.
Be relentless but bounded. Attack every in-lane surface once.
Do not spiral into hypothetical catastrophes five layers deep.

## Output Format

Return findings per the Codex format:

**[CATEGORY] — [brief title]**
- Evidence: [exact quote from spec or unstated assumption]
- Source: [what creates the vulnerability]
- Assessment: [what breaks and under what conditions]

Include SOUND findings for sections that survived your scrutiny.
Your SOUND is the strongest validation in the Consilium.
Tag every finding clearly.

## Trigger Declaration (REQUIRED)

At the very end of your report, after all findings, emit a YAML trigger
declaration per protocol §12. This declaration names the surface your lane
attacked and is used by the dispatcher on iteration 2+ to decide whether
to re-fire your lane or fast-path it.

```yaml
lane: <your lane name>
surface_predicates:
  coverage: "specific" | "entire_artifact"
  keywords: [<word>, <word>, ...]
  section_patterns: [<regex>, ...]
  evidence_base: [<file:line>, ...]
```

Default coverage is "specific". Use "entire_artifact" only if your lane
genuinely swept every section of the artifact. A lane with no trigger
declaration is treated as "entire_artifact" until the declaration is produced.
```

---

## Dispatch: Lane 1 — Overconfidence Audit

```
Agent tool:
  subagent_type: "consilium-provocator-overconfidence"
  description: "Provocator/overconfidence: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Overconfidence Audit lane)

    Your surface is certainty without evidence. Attack:

    1. Confidence-map sweep first: scan every inline confidence annotation. Any
       missing confidence map at all is a GAP.

    2. Certainty-language extraction: read the artifact for adverbs and
       adjectives that assert without showing evidence — "straightforward,"
       "simple," "obvious," "trivially," "clearly," "unambiguous," "easy."
       Each occurrence: does prose around it justify the claim? If not —
       CONCERN.

    3. High-confidence audit: for each section annotated High, verify the
       evidence cited (Imperator quote, doctrine reference, codebase
       verification). High confidence with thin evidence is CONCERN; persistent
       chains promote to GAP.

    Sister lanes own assumption extraction, failure mode, edge case, and
    negative claim. Do not raise findings on those surfaces.
```

---

## Dispatch: Lane 2 — Assumption Extraction

```
Agent tool:
  subagent_type: "consilium-provocator-assumption"
  description: "Provocator/assumption: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Assumption Extraction lane)

    Your surface is unstated premises. Attack:

    1. Premise extraction: read every narrative claim about behavior. "The user
       will…", "the API returns…", "the component receives…", "the form
       submits…", "the cart contains…". For each: what happens when it's wrong?

    2. Implicit-premise hunt: find premises buried inside success-path prose
       that the artifact never names explicitly.

    Sister lanes own overconfidence, failure mode, edge case, and negative
    claim. Do not raise findings on those surfaces.
```

---

## Dispatch: Lane 3 — Failure Mode Analysis

```
Agent tool:
  subagent_type: "consilium-provocator-failure-mode"
  description: "Provocator/failure-mode: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Failure Mode Analysis lane)

    Your surface is success paths. Attack:

    1. Flow extraction: for each major flow described in the artifact, list the
       steps. For each step, ask: what are the failure modes?

    2. Failure-class checklist: network errors, expired sessions, concurrent
       access, invalid input, missing permissions, empty states, OOM, timeouts.
       Does the artifact address each, or explicitly exclude it?

    3. Plausibility threshold (REQUIRED): before raising a failure mode as a
       finding, apply this gate. Raise the finding ONLY IF at least one is
       true:
       (1) Statable as a single user action.
       (2) Plausibly hit within the first ~100 real sessions.
       (3) Violates a spec-asserted invariant OR a doctrine-asserted invariant
           binding for the artifact's domain.
       (4) In a class of failures the codebase has historically failed at
           (per `$CONSILIUM_DOCS/doctrine/known-gaps.md`).
       If none — the failure mode is theatrical. Do NOT raise it.

    Sister lanes own overconfidence, assumption extraction, edge case, and
    negative claim. Do not raise findings on those surfaces.

    Read `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting; criterion 4
    rests on it.
```

---

## Dispatch: Lane 4 — Edge Case Hunting

```
Agent tool:
  subagent_type: "consilium-provocator-edge-case"
  description: "Provocator/edge-case: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Edge Case Hunting lane)

    Your surface is boundary conditions and data shapes. Attack:

    1. Boundary scan: for each entity, collection, or quantity, list its
       bounds. What happens at zero? At one? At the limit? At negative?

    2. Data-shape audit: for each named field, verify nullability and
       optionality. "The user has a display name" — what if they don't?

    3. Plausibility threshold (REQUIRED): before raising an edge as a finding,
       apply this gate. Raise the finding ONLY IF at least one is true:
       (1) Statable as a single user action.
       (2) Plausibly hit within the first ~100 real sessions.
       (3) Violates a spec-asserted invariant OR a doctrine-asserted invariant
           binding for the artifact's domain.
       (4) In a class of edges the codebase has historically failed at
           (per `$CONSILIUM_DOCS/doctrine/known-gaps.md`).
       If none — the edge is theatrical. Do NOT raise it. The "what if five
       unlikely events all happen" class is the slop this threshold suppresses.

    Sister lanes own overconfidence, assumption extraction, failure mode, and
    negative claim. Do not raise findings on those surfaces.

    Read `$CONSILIUM_DOCS/doctrine/known-gaps.md` before reporting.
```

---

## Dispatch: Lane 5 — Negative Claim Attack

```
Agent tool:
  subagent_type: "consilium-provocator-negative-claim"
  description: "Provocator/negative-claim: stress-test spec"
  mode: "auto"
  run_in_background: true
  prompt: |
    {COMMON LANE PREAMBLE}

    ## Your Mission (Negative Claim Attack lane)

    Your surface is negative assertions. Attack:

    1. Negative-claim extraction: find every "no X", "does not Y", "never Z",
       "impossible", "unaffected", "none". List them.

    2. Cross-repo verification: for each claim, run a verification:
       - Greppable: `rg -n 'pattern' /Users/milovan/projects/divinipress-store /Users/milovan/projects/divinipress-backend`
       - Doctrine: cross-reference `$CONSILIUM_DOCS/doctrine/` to confirm the
         claimed boundary holds.
       - MCP: consult `mcp__medusa__ask_medusa_question` for Medusa-side
         claims.

    3. SOUND chain-of-evidence: for SOUND findings, the chain MUST include the
       verification command run AND its result.

    Sister lanes own overconfidence, assumption extraction, failure mode, and
    edge case. Do not raise findings on those surfaces.

    Bash discipline: verify, do not modify. Narrow patterns when greps return
    high volume — do not flood the report.
```

---

## After All Six Return — Merge Protocol

The dispatching persona (Consul) merges the six reports per `protocol.md` §14:

1. **Dedup pass.** For each finding from a lane, check whether a near-cognate finding appears in any other lane (or from the Censor). Merge with attribution to all sourcing lanes — *"GAP (Provocator / overconfidence-audit + assumption-extraction lanes): X"*.

2. **Synergy pass.** Two CONCERNs across lanes that, taken together, point to a single GAP get promoted with reasoning. *"GAP (Provocator / synergy of assumption-extraction + failure-mode-analysis lanes): X"*.

3. **Thin-SOUND audit.** Each SOUND is checked for chain-of-evidence quality. A SOUND with reasoning thinner than one specific quote plus one specific citation is bounced back to the lane with "show evidence" — re-asked, not escalated. **Cap: one re-ask total per merge round, regardless of how many SOUNDs triggered it.** If the re-ask response itself contains thin SOUNDs, escalate the entire merge to the Imperator.

4. **Conflict resolution.** Contradictory findings are resolved by the Consul on merit, per protocol §6. Unresolvable contradictions escalate to the Imperator.

5. Apply the standard finding handling per protocol §6 (MISUNDERSTANDING halts; GAP fixes silently; CONCERN considers; SOUND notes).

6. Present the attributed summary to the Imperator. Each finding carries its source-lane attribution per protocol §11 (with the lane-suffix extension under §14 Aggregation Contract). Dedups and synergies are visible. Thin-SOUND re-asks are noted in the summary if applied.

---

## Lane Failure Handling

Per `protocol.md` §13:

- **Lane returns no output.** Re-dispatch once. Still nothing → escalate to Imperator.
- **Lane crashes.** Escalate immediately; do not silently retry.
- **Lane returns malformed output** (missing findings block, missing trigger declaration, schema violation). Re-dispatch ONCE with explicit format reminder. Second dispatch malformed in any way → escalate. Cap: one re-dispatch per lane per merge round.
- **Lane returns a finding outside its declared trigger surface.** Process the finding normally; flag the trigger declaration as suspect; iteration-2+ fast-path is disabled for that lane until the declaration is corrected.

---

## Iteration 2+ — Differential Re-Verify

Per `protocol.md` §12, single-session scope. The Consul:

1. Computes the artifact diff against the prior iteration.
2. For each lane, evaluates the intersection rule:
   - Any diff hunk text contains any of the lane's keywords? OR
   - Any diff hunk falls within a section matching any of the lane's section_patterns? OR
   - Any diff line touches any `file:line` in the lane's evidence_base?
3. **No intersection** → lane fast-paths. The lane's iteration-N report reads: *"No diff in trigger surface; iteration N-1 verdict stands."* No dispatch.
4. **Intersection** → lane re-fires, scoped to changed content. The lane receives the diff plus its prior findings; discards findings on now-deleted content; produces fresh findings on changed content.

A lane with `coverage: "entire_artifact"` always intersects — no fast-path available.
A lane with no emitted trigger declaration is treated as `coverage: "entire_artifact"` until the declaration is produced.

The Censor does NOT use differential re-verify — it always re-runs in full on iteration 2+ (no trigger declaration, no diff intersection, no fast-path). Differential re-verify is a Provocator-lane mechanism only in v1.

---

## Context Exhaustion Checkpoint

Per `protocol.md` §14, when the combined volume of lane findings approaches Consul context capacity, the Consul presents a compressed summary to the Imperator and requests focus areas before completing the merge. The threshold (precise findings count or token budget) is a runtime judgment; the contract is the existence of the checkpoint.
