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

**Subagent type:** Dispatch by role to a named user-scope Consilium agent. The persona identity and (for most agents) the Codex are baked into the agent's system prompt — do NOT paste them into the dispatch prompt.

| Role | Subagent type |
|-|-|
| Spec verification | `consilium-censor` |
| Plan verification | `consilium-praetor` |
| Adversarial stress-test (spec/plan) — Overconfidence Audit lane | `consilium-provocator-overconfidence` |
| Adversarial stress-test (spec/plan) — Assumption Extraction lane | `consilium-provocator-assumption` |
| Adversarial stress-test (spec/plan) — Failure Mode Analysis lane | `consilium-provocator-failure-mode` |
| Adversarial stress-test (spec/plan) — Edge Case Hunting lane | `consilium-provocator-edge-case` |
| Adversarial stress-test (spec/plan) — Negative Claim Attack lane | `consilium-provocator-negative-claim` |
| Adversarial stress-test (Campaign review) | `consilium-provocator` |
| Dispatch-readiness verification | `consilium-custos` |
| Per-task mini-checkit | `consilium-tribunus` |
| Implementation and GAP fix | `consilium-soldier` |
| Reconnaissance scout | `consilium-scout` |

**Model:** Set by the agent file (`model: opus`). Do not override in the dispatch call.

**Mode:** `auto`. Verification agents need to read files and search code.

**Domain knowledge loading:**
User-scope agents read doctrine directly from `$CONSILIUM_DOCS/doctrine/`. The dispatcher MAY pre-load excerpts into the dispatch prompt's `## Domain Knowledge` section if it already has relevant context from its own reconnaissance, but it is NOT required. When omitted, the agent reads the specific doctrine files named in the prompt or uses `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the index.

If `$CONSILIUM_DOCS` is unavailable, the agent should note the failure and proceed only if the artifact itself contains enough doctrine context. Otherwise, report a GAP.

**Run in background:** Set `run_in_background: true` when dispatching parallel agents (spec verification, plan verification, Campaign review). This allows the dispatching persona to monitor both agents simultaneously.

**Note:** The Legatus is NOT a named subagent. The Legatus persona is loaded by the `legion` or `march` skill into the main session. The main session dispatches soldiers and verifiers directly via Agent tool calls. No nested subagent dispatch is required.

---

## 3. Prompt Skeleton

Every verification dispatch uses this structure. The persona identity and Codex live in the agent's system prompt — the dispatch prompt contains only the task-specific inputs.

```
## The Artifact

{ARTIFACT CONTENT — spec, plan, or implementation output}
{Note: confidence annotations are inline within the artifact}

## Context Summary

{STRUCTURED CONTEXT SUMMARY — see format in section 4, passed as a separate section from the artifact per the Codex Independence Rule}

## Confidence Map

{Extracted from the artifact's inline confidence annotations into a single section for verifier scrutiny}

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

**Note:** Previous versions of this protocol included `## Your Identity` and `## The Law` sections containing the full persona file and the full Codex. These are REMOVED from the dispatch prompt — they live in the user-scope agent's system prompt at `~/.claude/agents/consilium-*.md`, loaded once per spawn.

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

## 5. Inline Confidence Annotations

Confidence is woven into the artifact, not a separate document. Each section of the spec or plan carries an annotation:

```markdown
## Product Display Logic
> **Confidence: High** — Imperator was explicit about display name derivation in conversation.

The saved product display name is derived from...
```

**Levels:**
- **High** — Imperator was explicit, $CONSILIUM_DOCS doctrine is unambiguous, or codebase exploration confirmed.
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

> **Aggregation Contract note.** Counts above are *role* counts, not *dispatch* counts. The Provocator role is operationally decomposed into five lanes (Overconfidence Audit, Assumption Extraction, Failure Mode Analysis, Edge Case Hunting, Negative Claim Attack) for spec and plan verification — each lane is its own parallel dispatch under the Provocator role. Campaign review continues to use a single Provocator dispatch (separate case scope). See §14 Merge Protocol for the role-vs-dispatch wording and §11 Finding Attribution for the lane-suffix presentation rule.

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
Agent tool:
  subagent_type: "consilium-soldier"
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

---

## 12. Differential Re-Verify

When the Provocator role is decomposed into five lanes (spec verification and plan verification), each lane emits a structured **trigger declaration** on iteration 1 naming the surface it attacks. On iteration 2+, the dispatching persona (Consul or Legatus-as-edicts) computes the artifact diff against the prior iteration and decides per-lane whether to re-fire or fast-path.

Single-session scope (v1). Across sessions, all lanes re-fire from a clean baseline. Cross-session persistence of lane reports is out of scope for v1.

### Trigger Declaration Schema

Every lane MUST emit one trigger declaration at the end of its iteration-1 report. Format:

```yaml
lane: <lane name>
surface_predicates:
  coverage: "specific" | "entire_artifact"
  keywords: [<word>, <word>, ...]
  section_patterns: [<regex>, ...]
  evidence_base: [<file:line>, ...]
```

- `lane` — string. Matches the lane name in the dispatch table (`overconfidence-audit`, `assumption-extraction`, `failure-mode-analysis`, `edge-case-hunting`, `negative-claim-attack`).
- `coverage` — string sentinel. `"specific"` means surface_predicates narrow the lane's attack surface; `"entire_artifact"` means the lane sweeps the whole artifact every iteration and never fast-paths. Default: `"specific"`.
- `keywords` — list of strings. Words the lane attacked.
- `section_patterns` — list of regexes. Sections the lane attacked.
- `evidence_base` — list of `file:line` references. Codebase citations the lane's findings rest on (optional).

A lane that fails to emit a trigger declaration is treated as `coverage: "entire_artifact"` until the declaration is produced. The dispatching persona MUST NOT silently fast-path a lane with no declared surface.

### Matching Rules

- **Keywords** — case-insensitive whole-word match against artifact text. The keyword `failure` matches `Failure` and `FAILURE`, but does not match `failures` or `failed`. Multi-word keywords are matched as a whole phrase.
- **Section patterns** — regex against the markdown heading line text only (e.g., `^## Spec Discipline Rule`). A diff hunk falls "within" a section if it appears in lines after a heading whose text matches the regex and before the next heading at equal-or-shallower depth.
- **Evidence base** — literal `file:line` match. A diff line "touches" `file:line` when the diff modifies the file and the modified line range overlaps the cited line.

### Intersection Rule (iteration 2+)

The artifact diff intersects the lane's trigger surface if **any** of:

- Any diff hunk text contains any keyword (per matching rule above), OR
- Any diff hunk falls within a section whose heading matches any section_pattern, OR
- Any diff line touches any `file:line` in evidence_base.

A lane with `coverage: "entire_artifact"` always intersects — no fast-path is available. Default is `"specific"`.

**No intersection** → lane fast-paths. No dispatch. The lane's iteration-N report reads: *"No diff in trigger surface; iteration N-1 verdict stands."*

**Intersection** → lane re-fires, scoped to changed content. The lane receives the diff plus prior findings; it discards findings on now-deleted content and produces fresh findings on changed content.

### Iteration-1 Sanity Check

A finding is "within declared surface" if **any** of:

- The finding's Evidence quote contains any keyword (per matching rule), OR
- The finding's Evidence cites a section whose heading matches any section_pattern, OR
- The finding's Source cites a `file:line` in evidence_base.

A finding "outside declared surface" — none of the above. The lane's trigger declaration is flagged as suspect; iteration-2+ fast-path is disabled until the declaration is corrected; the finding itself is processed normally per merge protocol.

### Single-Session Scope (v1)

Differential re-verify operates within a single dispatching-persona session. The trigger declarations from iteration 1 live in the dispatcher's conversation context — no new persistence file, no cross-session retrieval. On a fresh session resuming an existing case, all lanes re-fire from clean.

---

## 13. Lane Failure Handling

Operational rules for when a lane misbehaves during multi-lane dispatch.

- **Lane returns no output (timeout, OOM, dispatch error).** Re-dispatch once. If still no return, escalate to the Imperator with the attempts shown.
- **Lane crashes mid-execution.** Escalate to the Imperator immediately; do not silently retry a crashed lane.
- **Lane returns malformed output.** Malformed = missing findings block, missing trigger declaration, or schema violation. Re-dispatch ONCE with an explicit format reminder in the prompt. If the second dispatch is malformed in any way (same shape OR a different shape), escalate. The cap is one re-dispatch attempt total per lane per merge round, not one re-dispatch per malformation type.
- **Lane returns a finding outside its declared trigger surface.** See §12 Iteration-1 Sanity Check — finding processed normally; trigger declaration flagged for correction; iteration-2+ fast-path disabled for that lane until corrected.

The cap on re-dispatch is one per lane per merge round. A merge round is a single iteration of the verification loop (iteration 1, iteration 2, etc.). The thin-SOUND re-ask in the merge protocol (§14 step 3) is a separate cap (one re-ask total per merge round, regardless of how many SOUNDs triggered it).

---

## 14. Merge Protocol

When the Provocator role is decomposed into five lanes, the dispatching persona merges the five lane reports via a structured protocol before presenting findings to the Imperator. No second-pass adversarial agent in v1.

### Aggregation Contract

In **role-level** wording — §8 depth-configuration counts, the §2 Role column, the §11 finding-attribution example — "Provocator" refers to the role, not the agent count. The five lanes are operational decomposition within the Provocator role; the role count does not change.

§11's "tag every finding with its source agent" rule is preserved verbatim. Lane attribution is a **suffix** on the role tag in the dispatching persona's merge presentation:

- Single-source finding from one lane: `GAP (Provocator / overconfidence-audit lane): X`
- Dedup'd finding from multiple lanes: `GAP (Provocator / overconfidence-audit + assumption-extraction lanes): X`
- Synergy finding promoted from CONCERNs: `GAP (Provocator / synergy of assumption-extraction + failure-mode-analysis lanes): X`

The Provocator role tag stays as the source-agent label per the §11 rule. The lane is a sublabel; this extends the role-level pattern with operational decomposition; it does not amend §11.

### Four-Step Merge

1. **Dedup pass.** For each finding from a lane, check whether a near-cognate finding appears in any other lane. If yes, merge with attribution to all sourcing lanes — one consolidated finding, multiple source labels.
2. **Synergy pass.** Two CONCERN findings across lanes that, taken together, point to a single GAP get promoted with reasoning. Example: *"Lane 2 says 'assumption: payment succeeds' (CONCERN). Lane 3 says 'no failure handling for declined card' (CONCERN). Together: GAP — declined-card path is unstated and unhandled."*
3. **Thin-SOUND audit.** Each lane SOUND is checked for chain-of-evidence quality. A SOUND with reasoning thinner than one specific quote plus one specific citation is bounced back to the lane with "show evidence" — not escalated, just re-asked. **Cap: one re-ask total per merge round, regardless of how many SOUNDs triggered it.** If the re-ask response itself contains thin SOUNDs (whether the same one or new ones), escalate the entire merge to the Imperator rather than starting a new re-ask cycle.
4. **Conflict resolution.** Contradictory findings on the same surface are resolved by the dispatching persona on merit, per §6 "Conflicting findings between agents." Unresolvable contradictions escalate to the Imperator.

### Context Exhaustion Checkpoint

When the combined volume of lane findings approaches dispatcher context capacity, the dispatcher presents a compressed summary to the Imperator and requests focus areas before completing the merge. This is the explicit Imperator-checkpoint that replaces what a Gaius-style second-pass agent would otherwise offload. The threshold (precise findings count or token budget) is a runtime judgment; the contract is the existence of the checkpoint.

### Audit Visibility

When the dispatching persona presents the merged summary to the Imperator, each finding carries source-lane attribution per the Aggregation Contract above; dedups and synergies are visible. The merge is not opaque. Step-3 thin-SOUND re-asks are noted in the summary if the re-ask was applied (even when resolved), so the Imperator can see the lane's evidence quality was challenged.
