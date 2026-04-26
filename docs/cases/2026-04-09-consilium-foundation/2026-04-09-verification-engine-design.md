# Verification Engine — Design Spec

Sub-project 3 of the Consilium roadmap. The core mechanism that replaces inline self-review with independent, persona-driven verification across all Consilium skills.

## What It Is

A shared verification protocol — not a standalone skill. Reference files that consuming skills (brainstorming, writing-plans, subagent-driven-dev) read and follow. The dispatching persona (Consul or Legatus) orchestrates verification using the templates and protocol defined here.

## What It Is Not

- Not a callable skill with its own SKILL.md
- Not a replacement for self-review (self-review stays as layer 1; independent verification is layer 2)
- Not a duplication of the Consilium Codex (the codex defines what verification means; the engine defines how to run it)

## Output

```
skills/references/verification/
├── protocol.md
├── templates/
│   ├── spec-verification.md
│   ├── plan-verification.md
│   ├── campaign-review.md
│   └── mini-checkit.md
```

## Two-Layer Verification Model

**Layer 1: Self-review (always runs).** The Consul checks its own work inline — placeholder scan, internal consistency, ambiguity, scope. Fast, no token cost, catches mechanical errors. This already exists in brainstorming and writing-plans skills and stays unchanged.

**Layer 2: Independent verification (default on, Imperator can skip).** Persona-driven agents dispatched to review the artifact with fresh eyes. Catches conceptual errors, domain misunderstandings, missing edge cases — the class of error self-review can't catch because the producing agent has the same blind spots as its output.

**The flow:**
1. Consul/Legatus finishes artifact
2. Self-review runs (layer 1)
3. If self-review catches a MISUNDERSTANDING → halt immediately, no need for layer 2
4. Consul presents self-review summary
5. Consul defaults to dispatching independent verification: "Dispatching Censor and Provocator for verification."
6. Imperator can say "skip" — but the default momentum is toward verification
7. If verification runs, findings are handled per the protocol
8. Consul presents summary: what was found, what was fixed, what was kept and why

**Mini-checkit and Campaign review are NOT opt-in.** They always run during execution. The Legatus does not ask — it dispatches.

## Protocol Doc (`protocol.md`)

The operational manual for running verification. References the Consilium Codex for underlying law but does not restate it.

### Contents

**1. Verification Flow**

Self-review → independent verification (default on) → finding handling → summary to Imperator.

Sequence:
- Self-review always runs first
- Independent verification defaults to dispatch; Imperator can skip
- MISUNDERSTANDINGs from self-review halt immediately (no need for independent verification if the Consul catches its own broken model)
- During execution: mini-checkit and Campaign review are mandatory, not opt-in

**2. Dispatch Mechanics**

How to construct the Agent tool call:
- **Model:** Opus. All Consilium agents run on Opus. No exceptions.
- **Persona inclusion:** Full persona file. The entire file — identity, creed, trauma, voice, philosophy, loyalty, operational doctrine, quality bar. The character drives behavior; diluting it defeats the purpose.
- **Codex inclusion:** Full `consilium-codex.md` alongside the persona file.
- **Domain bible:** Select relevant files via `domain/MANIFEST.md`. Loading budget: 1-3 topic files + 0-1 code maps. The dispatching persona selects based on what the artifact touches.
- **Mode:** `auto` for Agent tool calls. Verification agents need to read files and search code.

**3. Prompt Skeleton**

Every verification dispatch follows this structure:

```
You are {PERSONA_NAME}. Read your identity, then verify the artifact.

## Your Identity
{FULL_PERSONA_FILE}

## The Law
{FULL_CONSILIUM_CODEX}

## The Artifact
{ARTIFACT_CONTENT}

## Domain Knowledge
{SELECTED_DOMAIN_BIBLE_FILES}

## Context
{CONTEXT_SUMMARY — structured format, see Context Summary Format below}

## Confidence
Confidence annotations are inline within the artifact itself (see Inline Confidence Annotations below).
No separate confidence map section — the artifact is self-documenting about its own certainty.

## Your Mission
{CONTEXT_SPECIFIC_INSTRUCTIONS — from the template}

## Output Format
Return your findings using the categories defined in the Codex:
- MISUNDERSTANDING: [evidence, domain bible reference, what it should be]
- GAP: [evidence, source, what the artifact should include]
- CONCERN: [evidence, alternative, why it might be better]
- SOUND: [reasoning — not just "looks good"]

Every finding must include a chain of evidence per the Codex.
```

**4. Finding Handling**

How the dispatching persona processes returned findings:

- **MISUNDERSTANDING:** Halt. Show Imperator immediately with the finding and evidence. Do not attempt to fix. The Imperator re-establishes correct understanding.
- **GAP:** Fix silently. The Consul/Legatus understands the domain — it can address the gap. If the same GAP recurs after one fix attempt, escalate to Imperator.
- **CONCERN:** Consider. Adopt if the suggestion is genuinely better. Keep current approach if there's context the verifier doesn't have. Either way, include in the summary to Imperator.
- **SOUND:** Note. Include in summary as validated sections.
- **Conflicting findings between agents:** Dispatching persona evaluates both arguments on merit. Neither agent auto-wins. Unresolvable conflicts escalate to Imperator.

**Summary presentation to Imperator:** After handling all findings, present:
- What verification found (counts by category)
- What was fixed (GAPs addressed)
- What was kept and why (CONCERNs not adopted, with reasoning)
- What passed (SOUND sections, briefly)

The Imperator sees the outcome, not the back-and-forth.

**5. Auto-Feed Loop**

- GAP/CONCERN findings auto-feed to the producing agent
- Max 2 iterations before escalating to Imperator
- MISUNDERSTANDINGs always escalate immediately — zero auto-fix attempts
- Re-verification after fixes is optional on first round, mandatory if the same finding recurs

**6. Depth Configuration**

- **Patrol:** Single agent, single pass. Used for mini-checkit (Tribunus per task).
- **Campaign:** Full hierarchy, parallel dispatch. Used for spec verification (Censor + Provocator), plan verification (Praetor + Provocator), and Campaign review (Censor + Praetor + Provocator).
- Default: Campaign. The Imperator prefers overkill.

**7. Context Summary Format**

The context summary is a structured document the Consul writes for verification agents. Fixed format prevents editorializing and bias.

```
## Context Summary

### What's Being Built
[One sentence.]

### Key Decisions Made
- [Decision]: [Who decided — Imperator or Consul] — [What alternative was rejected]

### Constraints Stated
- [Constraint]: [Source — Imperator directive, domain bible, or technical limitation]

### Ambiguities Resolved During Conversation
- [Question]: [Resolution] — [How resolved: Imperator answered / codebase verified / Consul judgment]
```

Must NOT include: the Consul's opinions on the artifact, emotional framing, justifications for design choices, or anything that would bias the verifier toward approval.

**8. Inline Confidence Annotations**

Confidence is not a separate map — it's woven into the artifact itself. Each section of the spec/plan carries an inline annotation:

```markdown
## Product Display Logic
> **Confidence: High** — Imperator was explicit about display name derivation in conversation.

The saved product display name is derived from...
```

Levels:
- **High** — Imperator was explicit, or domain bible is unambiguous, or codebase exploration confirmed.
- **Medium** — Consul's synthesis of multiple inputs. The conclusion wasn't directly stated.
- **Low** — Best guess. Should be rare after the ambiguity elimination phase (defined in brainstorming reshape, sub-project 4).

Inline annotations mean:
- Verifiers see confidence at the point of reading — no cross-referencing
- The Provocator spots High targets as it reads through
- The confidence travels with the artifact automatically — no transport problem between sessions
- The Consul thinks about confidence per section as it writes, not as an afterthought

The ambiguity elimination phase (sub-project 4) actively drives most sections to High before the spec is written. The verification engine consumes the annotations; it does not define how ambiguity elimination works.

**9. Implementation Output for Campaign Review**

The Legatus decides the format based on implementation size:
- **Small implementations (< 5 tasks, < 10 files):** Full git diff from plan start to completion.
- **Large implementations:** Task-scoped diffs presented in order, matching the plan structure. Each diff is manageable; the triad sees the implementation as a sequence of changes.

The protocol provides guidance, but the Legatus makes the tactical call. The goal: give the triad enough to verify without drowning them in noise.

**10. GAP Fix Dispatch During Mini-Checkit**

When the Tribunus finds a GAP on a completed task, the original implementing agent has already returned. The Legatus dispatches a **new fix agent** with:
- The GAP finding (with chain of evidence)
- The original task from the plan
- The current state of affected files
- Instructions to fix the specific issue

Fresh agent, focused scope. The original agent's context is stale. A new agent with a clear mandate ("fix this GAP") will be cleaner. After the fix agent completes, the Tribunus re-verifies once.

**11. Finding Attribution in Summaries**

When presenting findings to the Imperator, tag each finding with its source agent:
- "SOUND (Provocator): Attacked session handling from four angles — it holds."
- "SOUND (Censor): Domain entities match bible exactly."
- "GAP (Provocator): No failure handling for expired sessions."

The Imperator intuitively understands that SOUND from the Provocator carries different weight than SOUND from the Censor — the adversarial reviewer couldn't break it.

## Spec Verification Template (`templates/spec-verification.md`)

**Used by:** Brainstorming skill (Consul, brainstorming stance)
**When:** After self-review passes. Default dispatch. Imperator can skip.
**Agents:** Censor + Provocator, parallel (two Agent tool calls in one message)

**Inputs per agent:**

| Input | Censor | Provocator |
|-|-|-|
| Persona file | `personas/censor.md` (full) | `personas/provocator.md` (full) |
| Codex | `personas/consilium-codex.md` | `personas/consilium-codex.md` |
| Artifact | The spec (with inline confidence annotations) | The spec (with inline confidence annotations) |
| Domain bible | Selected per MANIFEST.md | Selected per MANIFEST.md |
| Context summary | Structured format (per protocol section 7) | Structured format (per protocol section 7) |

**Context-specific instructions for Censor:**
- Verify domain accuracy: cross-reference every entity, relationship, and workflow against the domain bible
- Verify requirement completeness: does the spec cover what it claims?
- Verify internal consistency: do sections contradict each other?
- Use inline confidence annotations to prioritize: high-confidence sections get deepest scrutiny (blind spot hunting)

**Context-specific instructions for Provocator:**
- Use inline confidence annotations offensively: High confidence is the primary target — investigate whether certainty is justified
- Extract unstated assumptions and challenge each
- Identify missing failure modes and edge cases
- Do not propose alternatives — report failures only

**Finding handling:** Per protocol — GAPs fixed silently, CONCERNs considered, MISUNDERSTANDINGs halt. Summary with finding attribution presented to Imperator.

**The template contains** the exact Agent tool call with slots: `{SPEC_CONTENT}`, `{DOMAIN_FILES}`, `{CONTEXT_SUMMARY}`. Not pseudocode — copy-paste-ready prompt construction. Confidence annotations are inline in `{SPEC_CONTENT}`, not a separate slot.

## Plan Verification Template (`templates/plan-verification.md`)

**Used by:** Writing-plans skill (Consul, planning stance)
**When:** After self-review passes. Default dispatch. Imperator can skip.
**Agents:** Praetor + Provocator, parallel

**Same structure as spec verification with these differences:**

- Praetor replaces Censor (different persona, different focus)
- Both agents receive the **spec in addition to the plan** — Praetor verifies plan delivers what spec requires AND checks feasibility; Provocator stress-tests coverage and executability
- Both the plan and spec carry inline confidence annotations — the Praetor sees which plan decisions were High vs Medium confidence

**Context-specific instructions for Praetor:**
- Trace task dependencies: does task N depend on something from task N+M?
- Check file collisions: multiple tasks touching the same file, do later tasks account for earlier changes?
- Audit assumptions about existing code: does the plan assume functions/types/endpoints that may not exist?
- Verify spec coverage: do the tasks together deliver everything the spec requires?
- Cross-check domain bible: plan may introduce new domain references not in the spec

**Context-specific instructions for Provocator:**
- Same adversarial mandate as spec verification
- Additional focus: what happens when tasks hit friction? What assumptions about execution order could break?

## Campaign Review Template (`templates/campaign-review.md`)

**Used by:** Subagent-driven-dev skill (Legatus)
**When:** After all tasks complete and pass mini-checkit. Always runs — not opt-in.
**Agents:** Censor + Praetor + Provocator, all three in parallel

**Key differences from spec/plan verification:**

1. **Three agents, not two.** Full triad. Three Agent tool calls in one message.

2. **Different inputs:**

| Input | All three agents |
|-|-|
| Persona file | Their respective persona (full) |
| Codex | `personas/consilium-codex.md` |
| Artifact | Implementation output (format per protocol section 9 — Legatus decides based on size) |
| Spec | The original spec (with inline confidence annotations) |
| Plan | The original plan (with inline confidence annotations) |
| Domain bible | Selected per MANIFEST.md |
| Context summary | None — the implementation speaks for itself |

3. **Focus per agent** (as defined in their Campaign Review Context sections):
   - Censor: does the implementation match the spec? Are domain concepts correctly implemented in code?
   - Praetor: were the plan's orders followed? Were deviations justified? Do dependencies hold in the actual code?
   - Provocator: what breaks under pressure? What edge cases weren't handled? What assumptions survived into code?

4. **Finding handling by the Legatus.** Same rules — GAPs dispatched to new fix agents (per protocol section 10), MISUNDERSTANDINGs escalate to Imperator, CONCERNs considered. The Legatus presents the summary with finding attribution (per protocol section 11), not the Consul.

5. **Not opt-in.** Campaign review always runs. The Imperator's preference for overkill applies unconditionally during execution.

## Mini-Checkit Template (`templates/mini-checkit.md`)

**Used by:** Subagent-driven-dev skill (Legatus)
**When:** After each implementing agent reports DONE or DONE_WITH_CONCERNS. Always runs — not opt-in.
**Agent:** Tribunus alone. Patrol depth. Sequential — one task at a time.

**Inputs:**

| Input | Tribunus |
|-|-|
| Persona file | `personas/tribunus.md` (full) |
| Codex | `personas/consilium-codex.md` |
| Artifact | Completed task output (changed files, new files) |
| Plan step | The specific plan step this task implements (not the whole plan) |
| Domain bible | Selected per MANIFEST.md (usually fewer files than spec/plan verification) |

No context summary. No confidence map. The Tribunus reads the code and the plan step — that's enough for Patrol depth.

**Context-specific instructions for Tribunus:**
- Does the task output match the plan step?
- Are domain concepts used correctly?
- Is the code real or stubbed? (placeholder returns, TODO comments, empty handlers, hardcoded mock data)
- Does this task break anything previous verified tasks built?
- If the implementation deviates from the plan step but is better: SOUND with reasoning. Don't flag improvements as drift.

**Finding handling is immediate:**
- SOUND → Legatus moves to next task
- GAP → Legatus dispatches a **new fix agent** (per protocol section 10) with the GAP finding, original task, and current file state. After fix, Tribunus re-verifies once. If GAP persists, escalate to Imperator.
- CONCERN → Legatus notes it. Concerns accumulate for the Campaign review to evaluate holistically.
- MISUNDERSTANDING → Halt execution entirely. Escalate to Imperator. Do not proceed to next task.

**Not opt-in.** Every task gets verified. No exceptions. The Legatus does not skip "because the task was simple."

## How Consuming Skills Integrate

Each consuming skill reads the protocol + its relevant template(s) and follows the instructions:

| Skill | Reads | Verification points |
|-|-|-|
| `brainstorming/SKILL.md` | protocol.md + spec-verification.md | After spec written: self-review → Censor + Provocator (default on, skippable) |
| `writing-plans/SKILL.md` | protocol.md + plan-verification.md | After plan written: self-review → Praetor + Provocator (default on, skippable) |
| `subagent-driven-development/SKILL.md` | protocol.md + mini-checkit.md + campaign-review.md | After each task: Tribunus (mandatory). After all tasks: Censor + Praetor + Provocator (mandatory). |

The existing self-review in brainstorming and writing-plans stays as layer 1. The verification engine adds layer 2.

## Relationship to Existing Prompt Templates

The current superpowers has four reviewer templates:
- `brainstorming/spec-document-reviewer-prompt.md`
- `writing-plans/plan-document-reviewer-prompt.md`
- `subagent-driven-development/spec-reviewer-prompt.md`
- `subagent-driven-development/code-quality-reviewer-prompt.md`

These are **replaced** by the verification engine templates when the skills are reshaped in sub-projects 4-6. Until then, they continue to function. The verification engine templates are designed to be drop-in replacements — the consuming skill swaps "dispatch generic reviewer" for "dispatch persona-driven verification per protocol."

## Relationship to Consilium Codex

The codex defines the **law** — finding categories, chain of evidence, confidence map protocol, deviation-as-improvement, auto-feed loop, independence rule, interaction protocols, depth levels.

The verification engine defines the **operations** — how to dispatch agents, how to construct prompts, how to handle findings in practice, how to present summaries to the Imperator.

The engine references the codex. It does not restate it. If the codex changes (e.g., max iterations goes from 2 to 3), the engine inherits the change without modification.

## Depth Calibration

Each template should be concrete enough that a consuming skill can follow it without interpretation. The prompt skeleton in the protocol doc plus the context-specific instructions in each template should produce a complete, ready-to-dispatch Agent tool call. No ambiguity about what to include, what slots to fill, or how to handle the response.

The protocol doc should be ~150-200 lines. Each template should be ~80-120 lines. Total: ~500-700 lines across all files.
