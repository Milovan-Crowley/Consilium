# Verification Protocol

The operational manual for running independent verification in Consilium. This document defines HOW to verify. The Consilium Codex (`personas/consilium-codex.md`) defines WHAT verification means — finding categories, chain of evidence, auto-feed loop, independence rule, depth levels. This protocol references the Codex; it does not restate it.

Every consuming skill (consul, edicts, legion) reads this protocol plus its relevant template from `templates/`.

---

## 1. Two-Layer Verification

**Layer 1: Self-review.** The producing persona checks its own work inline — placeholder scan, internal consistency, ambiguity, scope. Always runs. No dispatch, no token cost. This layer already exists in consul and edicts skills.

**Layer 2: Independent verification.** Persona-driven agents dispatched to review the artifact with fresh eyes. Default ON for spec and plan verification — the Consul announces "Dispatching verification" and the Imperator can say "skip." Mandatory for mini-checkit and Campaign review during execution — the Legatus does not ask.

**The flow:**

```
Artifact complete
    ↓
Self-review (layer 1) — always
    ↓
MISUNDERSTANDING caught? → halt, report to Imperator
    ↓
"Dispatching Censor and Provocator for verification."   (spec)
"Dispatching Praetor and Provocator for verification."  (plan)
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

**Subagent type:** Dispatch by role to a named user-scope Consilium agent. The persona identity and (for most agents) the Codex are baked into the agent's system prompt — do NOT paste them into the dispatch prompt.

| Role | Subagent type |
|-|-|
| Spec verification | `consilium-censor` |
| Plan verification | `consilium-praetor` |
| Adversarial stress-test (spec, plan, Campaign) | `consilium-provocator` |
| Per-task mini-checkit | `consilium-tribunus` |
| Implementation and GAP fix | `consilium-centurio-primus` |
| Reconnaissance speculator | `consilium-speculator-primus` |

**Model:** Set by the agent file (`model: opus`). Do not override in the dispatch call.

**Mode:** `auto`. Verification agents need to read files and search code.

**Domain knowledge loading:**
User-scope agents read doctrine directly from `$CONSILIUM_DOCS/doctrine/`. The dispatcher MAY pre-load excerpts into the dispatch prompt's `## Domain Knowledge` section if it already has relevant context from its own reconnaissance, but it is NOT required. When omitted, the agent reads the specific doctrine files named in the prompt or uses `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the index.

If `$CONSILIUM_DOCS` is unavailable, the agent should note the failure and proceed only if the artifact itself contains enough doctrine context. Otherwise, report a GAP.

**Run in background:** Set `run_in_background: true` when dispatching parallel agents (spec verification, plan verification, Campaign review). This allows the dispatching persona to monitor both agents simultaneously.

**Note:** The Legatus is NOT a named subagent. The Legatus persona is loaded by the `legion` or `march` skill into the main session. The main session dispatches centurios and verifiers directly via Agent tool calls. No nested subagent dispatch is required.

---

## 3. Prompt Skeleton

Every verification dispatch uses this structure. The persona identity and Codex live in the agent's system prompt — the dispatch prompt contains only the task-specific inputs.

```
## The Artifact

{ARTIFACT CONTENT — spec, plan, or implementation output}
{Note: the artifact may carry evidence, risk, or confidence notes when useful; do not pass them as a separate verifier-input field.}

## Context Summary

{STRUCTURED CONTEXT SUMMARY — see format in section 4, passed as a separate section from the artifact per the Codex Independence Rule}

## Domain Knowledge (optional)

{DOMAIN KNOWLEDGE — pre-loaded by the dispatcher from `$CONSILIUM_DOCS/doctrine/` file reads. Omit only when the artifact itself already contains enough doctrine context.}

## Your Mission

{CONTEXT SPECIFIC INSTRUCTIONS — provided by the template}

## Output Format

Return your findings using the categories defined in the Codex. Every finding MUST include a chain of evidence.

### Findings

For each finding, use this format:

**[CATEGORY] — [brief title]**
- Evidence: [exact quote or reference from the artifact]
- Source: [$CONSILIUM_DOCS doctrine entry, spec section, or plan step that creates the expectation]
- Assessment: [what the artifact should do or consider]

Categories:
- MISUNDERSTANDING: broken mental model. Include $CONSILIUM_DOCS doctrine reference + what it should be.
- GAP: requirement not covered. Include what's missing + where it should appear.
- CONCERN: works but suboptimal. Include alternative + why it might be better.
- SOUND: confirmed correct. Include reasoning — not just "looks good."

Tag each finding clearly. The dispatching persona needs to process them programmatically.
```

The verifier reads any evidence, risk, or confidence notes off the artifact directly. The dispatcher does NOT extract them into a separate `## Confidence Map` section in the prompt — that practice biased verifiers toward chasing the author's certainty rather than the artifact's actual contract. Plan verification must work even when the plan has no confidence notes.

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
- [Constraint]: [Source — Imperator directive, $CONSILIUM_DOCS doctrine, or technical limitation]

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

## 5. Confidence And Evidence Notes

Confidence is woven into the artifact, not a separate document. Specs may use section-level confidence notes. Plans may use targeted evidence or risk notes only where uncertainty changes execution or verification behavior:

```markdown
## Product Display Logic
> **Confidence: High** — Imperator was explicit about display name derivation in conversation.

The saved product display name is derived from...
```

**Levels:**
- **High** — Imperator was explicit, $CONSILIUM_DOCS doctrine is unambiguous, or codebase exploration confirmed.
- **Medium** — Consul's synthesis of multiple inputs. The conclusion wasn't directly stated.
- **Low** — Best guess. Should be rare after ambiguity elimination.

**How verifiers use them:** Notes can guide scrutiny, but they do not define the verifier's mission. Censor, Praetor, and Provocator verify the artifact's actual contract: requirements, decisions, assumptions, dependencies, scope, and realistic failure modes. Low-confidence sections get validated or corrected. High-confidence sections can still hide blind spots, but they are not the Provocator's default primary surface. The notes live on the artifact; the verifier reads them inline. The dispatcher does NOT pass a separate confidence-map field.

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

**Verification scope firewall.** A verifier finding blocks only when it identifies one of: a violation of the approved goal, a contradiction with a frozen contract, a conflict with an existing domain invariant, missing coverage of a required acceptance criterion, or a realistic first-pass execution failure caused by the artifact as written. Findings that are speculative future features, nice-to-have hardening, alternate-architecture preferences, or invented edge cases outside the stated goal are recorded as non-blocking notes — they do not widen the spec, plan, or edict.

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
- When an artifact materially changes after verification cleared, rerun verification in full. Tiny copy or formatting changes that do not alter meaning may skip re-verification with explicit reasoning.

---

## 8. Depth Configuration

**Patrol:** Single agent, single pass. Used for mini-checkit (Tribunus per task).

**Campaign:** Full hierarchy, parallel dispatch. Used for:
- Spec verification: Censor + Provocator (2 agents)
- Plan verification: Praetor + Provocator (2 agents)
- Campaign review: Censor + Praetor + Provocator (3 agents)

Default: Campaign for spec and plan verification. The Imperator prefers overkill to underestimation.

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
Agent tool:
  subagent_type: "consilium-centurio-primus"
  description: "Fix GAP: {brief title}"
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
- "SOUND (Censor): Domain entities match doctrine exactly."
- "GAP (Provocator): No failure handling for expired sessions."
- "GAP (Praetor): Task 4 depends on function created in task 7 — forward dependency."

The Imperator intuitively understands that SOUND from the Provocator carries different weight than SOUND from the Censor. The adversarial reviewer couldn't break it.
