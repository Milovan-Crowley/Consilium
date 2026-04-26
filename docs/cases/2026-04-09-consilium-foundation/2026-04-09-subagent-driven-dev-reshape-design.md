# Subagent-Driven-Dev Reshape — Design Spec

Sub-project 6 of the Consilium roadmap. Reshapes the execution skill to use the Legatus persona, Tribunus mini-checkit, and Campaign review triad.

## Approach

Hybrid — inject identity/domain (additive), replace review system (structural). The review system fundamentally changes from two-stage generic reviewers to persona-driven verification. Injecting that would create a mess; replacing is cleaner.

## Dependencies

- Personas: `skills/references/personas/` (complete)
- Domain Bible: `skills/references/domain/` (complete)
- Verification Engine: `skills/references/verification/` (complete)

## Files Modified

| File | Change type |
|-|-|
| `skills/subagent-driven-development/SKILL.md` | Inject persona + domain. Replace review system, process flow, model selection, prompt references, red flags. |
| `skills/subagent-driven-development/implementer-prompt.md` | Upgrade — add domain bible, verification awareness, domain confirmation. |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | Delete — replaced by Tribunus mini-checkit. |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | Delete — replaced by Tribunus mini-checkit + Campaign review. |

## What Stays Unchanged

- Fresh subagent per task (core principle)
- Implementer status vocabulary (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED)
- Handling Implementer Status section (mostly — DONE now routes to Tribunus instead of spec reviewer)
- "Why subagents" rationale
- "When to Use" decision tree
- Advantages section (updated references but same structure)
- Integration with finishing-a-development-branch
- TDD for subagents
- "Don't make subagent read plan file" rule
- Scene-setting context requirement
- Question handling (answer before letting them proceed)

---

## Injections (Additive)

### 1. Legatus Persona Activation

Injected at top of SKILL.md, after frontmatter:

```markdown
## Consilium Identity

You are the Legatus — Gnaeus Imperius, legion commander. Read your full identity before proceeding:

- **Your persona:** Read `skills/references/personas/legatus.md`
- **The Codex:** Read `skills/references/personas/consilium-codex.md`

You execute the verified plan. You dispatch implementing agents, verify each task via the Tribunus, and trigger Campaign review when all tasks complete. You make tactical decisions. You do not make strategic decisions — when the plan is wrong, you stop and report.
```

### 2. Domain Bible Loading

Added to the plan-reading step. When the Legatus reads the plan and extracts tasks:

```markdown
Read `skills/references/domain/MANIFEST.md` and select domain files relevant 
to the plan's entities and flows. These will be provided to implementing agents 
and the Tribunus alongside task context.
```

### 3. Upgraded Implementer Prompt

The existing `implementer-prompt.md` gets three additions (injected, not rewritten):

**Domain bible context:** The Legatus includes 1-2 relevant domain files in the implementer's prompt, under a `## Domain Knowledge` section. The implementer starts with correct domain understanding.

**Verification awareness:** Added to the "Your Job" section:
```markdown
Your work will be independently verified by the Tribunus after completion. 
The Tribunus checks: plan step match, domain correctness, stub detection, 
integration with previous tasks. Write code that will pass this verification.
```

**Domain confirmation:** Added to the "Before You Begin" section:
```markdown
If the task references domain entities (saved products, catalog products, 
proofs, orders, teams, collections), verify your understanding against the 
domain knowledge provided before writing code.
```

---

## Replacements (Review System Overhaul)

### 4. Per-Task Review: Two-Stage → Tribunus Mini-Checkit

**Current:**
```
Implement → Spec compliance reviewer → Code quality reviewer → Mark complete
```

**Becomes:**
```
Implement → Tribunus mini-checkit → Mark complete
         ↘ (if GAP) → Fix agent → Tribunus re-verify
         ↘ (if MISUNDERSTANDING) → Halt, escalate to Imperator
```

The Tribunus replaces both reviewers in a single Patrol-depth pass. Dispatched per `verification/templates/mini-checkit.md` and `verification/protocol.md`.

Finding handling:
- **SOUND** → Legatus moves to next task
- **GAP** → Legatus dispatches new fix agent (per protocol section 10), Tribunus re-verifies once. If GAP persists, escalate.
- **CONCERN** → Legatus notes it. Concerns accumulate for Campaign review.
- **MISUNDERSTANDING** → Halt execution. Escalate to Imperator.

### 5. End-of-Execution Review: Final Code Reviewer → Campaign Review

**Current:**
```
All tasks done → Final code reviewer → finishing-a-development-branch
```

**Becomes:**
```
All tasks done → Campaign review (Censor + Praetor + Provocator) → Handle findings → finishing-a-development-branch
```

Full triad dispatched in parallel per `verification/templates/campaign-review.md`. Not opt-in — always runs. Finding handling per protocol:
- GAPs dispatch fix agents
- MISUNDERSTANDINGs escalate to Imperator
- CONCERNs considered
- Summary with finding attribution presented to Imperator

### 6. Process Flow Diagram

Replace the entire `digraph process` with updated flow reflecting Legatus orchestration, Tribunus verification, fix agent dispatch, and Campaign review.

### 7. Model Selection

**Current:** "Use the least powerful model that can handle each role."

**Becomes:**
- **Verification agents (Tribunus, Campaign triad):** Opus. Always. No exceptions.
- **Implementing agents:** Legatus judgment. Default Opus. Lighter models permitted for mechanical tasks with complete plan steps (1-2 files, exact code provided). Downgrading is a tactical decision the Legatus justifies.

### 8. Prompt Templates

**Current:**
```
- ./implementer-prompt.md
- ./spec-reviewer-prompt.md
- ./code-quality-reviewer-prompt.md
```

**Becomes:**
```
- ./implementer-prompt.md (upgraded with domain bible + verification awareness)
- skills/references/verification/templates/mini-checkit.md (per-task verification)
- skills/references/verification/templates/campaign-review.md (end-of-execution verification)
- skills/references/verification/protocol.md (shared dispatch rules)
```

Old `spec-reviewer-prompt.md` and `code-quality-reviewer-prompt.md` are deleted.

### 9. Red Flags Update

**Remove:**
- References to two-stage review (spec compliance → code quality)
- "Start code quality review before spec compliance is ✅"
- "Skip reviews (spec compliance OR code quality)"

**Add:**
- Never skip Tribunus verification — every task gets verified, no exceptions
- Never skip Campaign review — it always runs after execution
- Never let the Legatus review its own execution — Campaign review is independent
- Never dispatch parallel implementers on overlapping files — but parallel dispatch is permitted when tasks are independent (Legatus judgment)

**Keep:**
- Never start implementation on main/master without user consent
- Never proceed with unfixed issues
- Never make subagent read plan file
- Never skip scene-setting context
- Never ignore subagent questions or escalations

### 10. Parallel Dispatch

**Current:** "Don't dispatch multiple implementation subagents in parallel (conflicts)."

**Becomes:** The Legatus may dispatch independent tasks in parallel when they don't touch the same files. This is a tactical decision — the Legatus assesses file overlap and dependencies. Each parallel task still gets individual Tribunus verification. Sequential dispatch remains the default when tasks share files.

---

## What This Spec Does NOT Cover

- **Systematic-debugger reshape** (sub-project 7) — separate spec
- **Learning loop** — deferred to post-Wave 4
- **Language/voice refinement** — deferred
