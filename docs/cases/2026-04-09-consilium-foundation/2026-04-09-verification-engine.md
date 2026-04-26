# Verification Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the verification protocol and dispatch templates that all Consilium skills use for independent, persona-driven verification.

**Architecture:** 5 markdown files in `skills/references/verification/`. One protocol doc (shared rules) + four context-specific templates (spec, plan, campaign, mini-checkit). Not a skill — reference files that consuming skills read and follow.

**Tech Stack:** Markdown reference documents. No code — pure design artifacts.

**Spec:** `docs/consilium/specs/2026-04-09-verification-engine-design.md`

---

## File Structure

All files created in `skills/references/verification/`:

| File | Responsibility |
|-|-|
| `protocol.md` | Shared dispatch rules, finding handling, prompt skeleton, auto-feed loop, depth config, context summary format, inline confidence protocol, implementation output guidance, GAP fix dispatch, finding attribution |
| `templates/spec-verification.md` | How to dispatch Censor + Provocator on a spec |
| `templates/plan-verification.md` | How to dispatch Praetor + Provocator on a plan |
| `templates/campaign-review.md` | How to dispatch the full triad on an implementation |
| `templates/mini-checkit.md` | How to dispatch Tribunus on a single task |

---

### Task 1: Create directory and write protocol.md

**Files:**
- Create: `skills/references/verification/protocol.md`
- Create: `skills/references/verification/templates/` (directory)

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p skills/references/verification/templates
```

- [ ] **Step 2: Write protocol.md**

```markdown
# Verification Protocol

The operational manual for running independent verification in Consilium. This document defines HOW to verify. The Consilium Codex (`personas/consilium-codex.md`) defines WHAT verification means — finding categories, chain of evidence, auto-feed loop, independence rule, depth levels. This protocol references the Codex; it does not restate it.

Every consuming skill (brainstorming, writing-plans, subagent-driven-dev) reads this protocol plus its relevant template from `templates/`.

---

## 1. Two-Layer Verification

**Layer 1: Self-review.** The producing persona checks its own work inline — placeholder scan, internal consistency, ambiguity, scope. Always runs. No dispatch, no token cost. This layer already exists in brainstorming and writing-plans skills.

**Layer 2: Independent verification.** Persona-driven agents dispatched to review the artifact with fresh eyes. Default ON for spec and plan verification — the Consul announces "Dispatching verification" and the Imperator can say "skip." Mandatory for mini-checkit and Campaign review during execution — the Legatus does not ask.

**The flow:**

```
Artifact complete
    ↓
Self-review (layer 1) — always
    ↓
MISUNDERSTANDING caught? → halt, report to Imperator
    ↓
"Dispatching Censor and Provocator for verification."
    ↓
Imperator says "skip"? → proceed without layer 2
    ↓
Dispatch verification agents (layer 2)
    ↓
Handle findings per this protocol
    ↓
Present summary to Imperator
```

During execution, the Legatus replaces "Dispatching..." with immediate dispatch. No opt-out.

---

## 2. Dispatch Mechanics

**Model:** Opus. All Consilium agents run on Opus. No exceptions. Use `model: "opus"` in the Agent tool call.

**Mode:** `auto`. Verification agents need to read files and search code.

**Persona inclusion:** The FULL persona file. Include the entire contents of the persona's markdown file — identity, creed, trauma, voice, philosophy, loyalty, operational doctrine, quality bar. The character drives behavior. Do not summarize or truncate.

**Codex inclusion:** The FULL `personas/consilium-codex.md`. Include alongside the persona file. Every verification agent operates under the Codex.

**Domain bible loading:**
1. Read `domain/MANIFEST.md`
2. Select 1-3 topic files + 0-1 code maps based on what entities, flows, and systems the artifact touches
3. Include the selected file contents in the dispatch prompt under `## Domain Knowledge`

**Run in background:** Set `run_in_background: true` when dispatching parallel agents (spec verification, plan verification, Campaign review). This allows the dispatching persona to monitor both agents simultaneously.

---

## 3. Prompt Skeleton

Every verification dispatch uses this structure. The template fills in `{CONTEXT_SPECIFIC_INSTRUCTIONS}`.

```
You are {PERSONA_NAME}.

## Your Identity

{FULL PERSONA FILE CONTENTS}

## The Law

{FULL CONSILIUM CODEX CONTENTS}

## The Artifact

{ARTIFACT CONTENT — spec, plan, or implementation output}
{Note: confidence annotations are inline within the artifact}

## Domain Knowledge

{SELECTED DOMAIN BIBLE FILE CONTENTS}

## Context

{STRUCTURED CONTEXT SUMMARY — see format below}

## Your Mission

{CONTEXT SPECIFIC INSTRUCTIONS — provided by the template}

## Output Format

Return your findings using the categories defined in the Codex. Every finding MUST include a chain of evidence.

### Findings

For each finding, use this format:

**[CATEGORY] — [brief title]**
- Evidence: [exact quote or reference from the artifact]
- Source: [domain bible entry, spec section, or plan step that creates the expectation]
- Assessment: [what the artifact should do or consider]

Categories:
- MISUNDERSTANDING: broken mental model. Include domain bible reference + what it should be.
- GAP: requirement not covered. Include what's missing + where it should appear.
- CONCERN: works but suboptimal. Include alternative + why it might be better.
- SOUND: confirmed correct. Include reasoning — not just "looks good."

Tag each finding clearly. The dispatching persona needs to process them programmatically.
```

---

## 4. Context Summary Format

The Consul writes this for verification agents. The structured format prevents editorializing and bias.

```markdown
## Context Summary

### What's Being Built
[One sentence describing the feature/change.]

### Key Decisions Made
- [Decision]: [Who decided — Imperator or Consul] — [What alternative was rejected]

### Constraints Stated
- [Constraint]: [Source — Imperator directive, domain bible, or technical limitation]

### Ambiguities Resolved During Conversation
- [Question]: [Resolution] — [How resolved: Imperator answered / codebase verified / Consul judgment]
```

**Must NOT include:**
- The Consul's opinions on the artifact quality
- Emotional framing ("the Imperator was excited about...")
- Justifications for design choices
- Anything that would bias the verifier toward approval

The context summary is a factual briefing. The verifier judges the artifact, not the Consul's enthusiasm.

---

## 5. Inline Confidence Annotations

Confidence is woven into the artifact, not a separate document. Each section of the spec or plan carries an annotation:

```markdown
## Product Display Logic
> **Confidence: High** — Imperator was explicit about display name derivation in conversation.

The saved product display name is derived from...
```

**Levels:**
- **High** — Imperator was explicit, domain bible is unambiguous, or codebase exploration confirmed.
- **Medium** — Consul's synthesis of multiple inputs. The conclusion wasn't directly stated.
- **Low** — Best guess. Should be rare after ambiguity elimination (defined in brainstorming reshape, sub-project 4).

**How verifiers use them:**
- Censor/Praetor: High-confidence sections get deepest scrutiny — blind spots hide where the Consul felt safest.
- Provocator: High confidence is the primary attack target. "The Consul is certain. Why? What would have to be true for this to be wrong?"
- Low-confidence sections get validated or corrected.

Annotations travel with the artifact. No transport problem between sessions.

---

## 6. Finding Handling

How the dispatching persona (Consul or Legatus) processes findings returned by verification agents:

**MISUNDERSTANDING → Halt.**
Show the Imperator immediately with the finding and chain of evidence. Do not attempt to fix. A broken mental model cannot be auto-corrected. The Imperator re-establishes correct understanding.

**GAP → Fix silently.**
The dispatching persona understands the domain well enough to address the gap. Fix it, note it in the summary. If the same GAP recurs after one fix attempt, escalate to Imperator with both attempts shown.

**CONCERN → Consider.**
Adopt if the suggestion is genuinely better. Keep current approach if there's context the verifier doesn't have. Either way, include in the summary with reasoning.

**SOUND → Note.**
Include in summary as validated sections. Tag with source agent for attribution.

**Conflicting findings between agents:**
The dispatching persona evaluates both arguments on their merits. Neither agent auto-wins. If the dispatching persona cannot resolve the conflict, escalate to Imperator.

**Summary presentation to Imperator:**
After handling all findings, present:
- Finding counts by category with source attribution: "GAP (Provocator): ...", "SOUND (Censor): ..."
- What was fixed (GAPs addressed)
- What was kept and why (CONCERNs not adopted, with reasoning)
- What passed scrutiny (SOUND sections, briefly — highlight Provocator SOUNDs)

The Imperator sees the outcome, not the back-and-forth.

---

## 7. Auto-Feed Loop

- GAP and CONCERN findings auto-feed to the producing agent
- Producing agent revises and can optionally re-dispatch verification
- **Max 2 iterations** before escalating to Imperator
- MISUNDERSTANDINGs always escalate immediately — zero auto-fix attempts
- Re-verification after fixes is optional on first round, mandatory if the same finding recurs

---

## 8. Depth Configuration

**Patrol:** Single agent, single pass. Used for mini-checkit (Tribunus per task).

**Campaign:** Full hierarchy, parallel dispatch. Used for:
- Spec verification: Censor + Provocator (2 agents)
- Plan verification: Praetor + Provocator (2 agents)
- Campaign review: Censor + Praetor + Provocator (3 agents)

Default: Campaign. The Imperator prefers overkill to underestimation.

---

## 9. Implementation Output for Campaign Review

The Legatus decides the format based on implementation size:

**Small implementations (< 5 tasks, < 10 files):** Full git diff from plan start to completion.

```bash
git diff {BASE_SHA}...{HEAD_SHA}
```

**Large implementations:** Task-scoped diffs presented in order, matching the plan structure. Each diff is manageable; the triad sees the implementation as a sequence of changes.

The Legatus makes the tactical call. The goal: give the triad enough to verify without drowning them in noise.

---

## 10. GAP Fix Dispatch

When a verifier finds a GAP on completed work and the original agent has returned, the dispatching persona sends a **new fix agent**:

```
Agent tool (general-purpose):
  description: "Fix GAP: {brief title}"
  model: "opus"
  mode: "auto"
  prompt: |
    A verification agent found a GAP in recently completed work. Fix it.

    ## The Finding
    {FULL GAP FINDING WITH CHAIN OF EVIDENCE}

    ## The Original Task
    {TASK DESCRIPTION FROM THE PLAN}

    ## Current State of Affected Files
    {FILE CONTENTS — read before dispatching}

    ## Your Job
    Fix the specific issue identified in the finding.
    Do not change anything else.
    Commit when done.
    Report: what you changed, files affected.
```

After the fix agent completes, the verification agent (Tribunus for mini-checkit, triad member for Campaign) re-verifies once. If the GAP persists, escalate to Imperator.

---

## 11. Finding Attribution

Tag every finding with its source agent when presenting to the Imperator:

- "SOUND (Provocator): Attacked session handling from four angles — it holds."
- "SOUND (Censor): Domain entities match bible exactly."
- "GAP (Provocator): No failure handling for expired sessions."
- "GAP (Praetor): Task 4 depends on function created in task 7 — forward dependency."

The Imperator intuitively understands that SOUND from the Provocator carries different weight than SOUND from the Censor. The adversarial reviewer couldn't break it.
```

- [ ] **Step 3: Commit**

```bash
git add skills/references/verification/protocol.md
git commit -m "feat(verification): add verification protocol — dispatch rules and finding handling"
```

---

### Task 2: Write spec-verification.md

**Files:**
- Create: `skills/references/verification/templates/spec-verification.md`

- [ ] **Step 1: Write spec-verification.md**

```markdown
# Spec Verification Template

Dispatches independent verification on a spec artifact. Used by the brainstorming skill after the Consul writes and self-reviews a spec.

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
  description: "Censor: verify spec"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Aulus Scrutinus, Censor of the Consilium.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/censor.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Artifact

    The following spec requires verification. Note the inline confidence
    annotations (> **Confidence: High/Medium/Low**) throughout — use them
    to direct your scrutiny.

    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

    ## Context

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    You are the Censor. Your job is to verify CORRECTNESS — whether this
    spec is TRUE, not just whether it is coherent.

    1. Domain sweep: scan every entity, relationship, and workflow mentioned.
       Cross-reference each against the domain bible. Any mismatch is an
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
    - Source: [domain bible entry or spec section]
    - Assessment: [what the spec should do or consider]

    Include SOUND findings with reasoning for sections you verified.
    Tag every finding clearly.
```

---

## Dispatch: Provocator

```
Agent tool:
  description: "Provocator: stress-test spec"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Spurius Ferox, Provocator of the Consilium.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/provocator.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Artifact

    The following spec requires adversarial review. Note the inline confidence
    annotations (> **Confidence: High/Medium/Low**) throughout — High confidence
    is your PRIMARY TARGET.

    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

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
```

- [ ] **Step 2: Commit**

```bash
git add skills/references/verification/templates/spec-verification.md
git commit -m "feat(verification): add spec verification template — Censor + Provocator dispatch"
```

---

### Task 3: Write plan-verification.md

**Files:**
- Create: `skills/references/verification/templates/plan-verification.md`

- [ ] **Step 1: Write plan-verification.md**

```markdown
# Plan Verification Template

Dispatches independent verification on a plan artifact. Used by the writing-plans skill after the Consul writes and self-reviews a plan.

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
  description: "Praetor: verify plan"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Sextus Pragmaticus, Praetor of the Consilium.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/praetor.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Artifact

    The following plan requires verification. It implements the spec included
    below. Both carry inline confidence annotations.

    ### The Plan
    {PASTE FULL PLAN CONTENT}

    ### The Spec It Implements
    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

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

    5. Domain bible cross-check: the plan may introduce domain references not
       in the spec. Verify those against the bible.

    6. Deviation-as-improvement: if the plan deviates from the spec and the
       deviation is better, report SOUND with reasoning.

    ## Output Format

    Return findings per the Codex format:

    **[CATEGORY] — [brief title]**
    - Evidence: [exact task reference and what it assumes/requires]
    - Source: [spec section, domain bible entry, or codebase fact]
    - Assessment: [what needs to change for the plan to be executable]

    Include SOUND findings for task chains you verified as feasible.
    Tag every finding clearly.
```

---

## Dispatch: Provocator

```
Agent tool:
  description: "Provocator: stress-test plan"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Spurius Ferox, Provocator of the Consilium.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/provocator.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Artifact

    The following plan requires adversarial review. It implements the spec
    included below. Both carry inline confidence annotations — High confidence
    is your PRIMARY TARGET.

    ### The Plan
    {PASTE FULL PLAN CONTENT}

    ### The Spec It Implements
    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

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
```

- [ ] **Step 2: Commit**

```bash
git add skills/references/verification/templates/plan-verification.md
git commit -m "feat(verification): add plan verification template — Praetor + Provocator dispatch"
```

---

### Task 4: Write campaign-review.md

**Files:**
- Create: `skills/references/verification/templates/campaign-review.md`

- [ ] **Step 1: Write campaign-review.md**

```markdown
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
  description: "Censor: Campaign review — verify implementation against spec"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Aulus Scrutinus, Censor of the Consilium. This is a Campaign
    review — post-execution verification of the full implementation.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/censor.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

    ## Your Mission

    Campaign review. Your focus shifts from spec-as-document to
    implementation-as-code.

    1. Spec compliance: does the implementation deliver what the spec
       specified? Walk through each spec requirement and verify it exists
       in the implementation.

    2. Domain correctness in code: are domain concepts correctly implemented?
       Does the code reference the right models, use the right field names,
       implement the right relationships per the domain bible?

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
  description: "Praetor: Campaign review — verify implementation against plan"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Sextus Pragmaticus, Praetor of the Consilium. This is a Campaign
    review — post-execution verification of the full implementation.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/praetor.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

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
  description: "Provocator: Campaign review — stress-test implementation"
  model: "opus"
  mode: "auto"
  run_in_background: true
  prompt: |
    You are Spurius Ferox, Provocator of the Consilium. This is a Campaign
    review — the implementation exists. The code is real. This is your last
    chance to find the cracks before the Imperator ships.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/provocator.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Implementation

    {PASTE IMPLEMENTATION OUTPUT}

    ## The Spec

    {PASTE FULL SPEC WITH INLINE CONFIDENCE ANNOTATIONS}

    ## The Plan

    {PASTE FULL PLAN WITH INLINE CONFIDENCE ANNOTATIONS}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES}

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
```

- [ ] **Step 2: Commit**

```bash
git add skills/references/verification/templates/campaign-review.md
git commit -m "feat(verification): add Campaign review template — full triad dispatch"
```

---

### Task 5: Write mini-checkit.md

**Files:**
- Create: `skills/references/verification/templates/mini-checkit.md`

- [ ] **Step 1: Write mini-checkit.md**

```markdown
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
  description: "Tribunus: verify task N output"
  model: "opus"
  mode: "auto"
  prompt: |
    You are Tiberius Vigil, Tribunus of the Consilium.

    ## Your Identity

    {PASTE FULL CONTENTS OF personas/tribunus.md}

    ## The Law

    {PASTE FULL CONTENTS OF personas/consilium-codex.md}

    ## The Task Output

    The following files were created or modified by the implementing agent:

    {PASTE CHANGED FILE CONTENTS — current state, not diff}

    ## The Plan Step

    This task was supposed to implement:

    {PASTE THE SPECIFIC PLAN STEP — not the whole plan}

    ## Domain Knowledge

    {PASTE SELECTED DOMAIN BIBLE FILES — usually 1-2, focused on what this task touches}

    ## Your Mission

    You are the Tribunus. Patrol depth. Fast, focused, one pass.

    1. Plan step match: does the output deliver what the plan step specified?
       Files created/modified as expected? Code matches intent?

    2. Domain check: are domain concepts used correctly? Right models targeted?
       Right field names? Right relationships?

    3. Reality check: is the code real or stubbed? Look for: placeholder
       returns, TODO comments, empty handlers, hardcoded mock data,
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
    - Source: [plan step or domain bible entry]
    - Assessment: [what needs to change, or why it's correct]
```

---

## After Tribunus Returns

Handle findings immediately:

- **SOUND** → Legatus moves to next task.
- **GAP** → Legatus dispatches a new fix agent (per protocol section 10) with the finding, original task, and current file state. After fix, dispatch Tribunus again for re-verification. One re-verification attempt. If GAP persists, escalate to Imperator.
- **CONCERN** → Legatus notes it. Concerns accumulate — the Campaign review evaluates them holistically.
- **MISUNDERSTANDING** → Halt execution entirely. Escalate to Imperator. Do not proceed to next task.
```

- [ ] **Step 2: Commit**

```bash
git add skills/references/verification/templates/mini-checkit.md
git commit -m "feat(verification): add mini-checkit template — Tribunus per-task dispatch"
```

---

### Task 6: Final verification

- [ ] **Step 1: Verify all files exist**

```bash
ls -la skills/references/verification/
ls -la skills/references/verification/templates/
```

Expected: `protocol.md` + 4 templates (`spec-verification.md`, `plan-verification.md`, `campaign-review.md`, `mini-checkit.md`)

- [ ] **Step 2: Verify cross-references**

Confirm:
- All templates reference `protocol.md` for shared rules
- All templates use the same prompt skeleton from the protocol
- All templates use the same finding output format
- Finding categories consistent (MISUNDERSTANDING/GAP/CONCERN/SOUND)
- Persona file paths consistent (`personas/censor.md`, `personas/praetor.md`, etc.)
- Context summary format referenced correctly
- Inline confidence annotations referenced (not a separate confidence map)
- GAP fix dispatch references protocol section 10
- Finding attribution references protocol section 11

- [ ] **Step 3: Verify spec coverage**

Check each spec section against plan tasks:
- Protocol doc contents (sections 1-11): Task 1
- Spec verification template: Task 2
- Plan verification template: Task 3
- Campaign review template: Task 4
- Mini-checkit template: Task 5
- All five output files accounted for
