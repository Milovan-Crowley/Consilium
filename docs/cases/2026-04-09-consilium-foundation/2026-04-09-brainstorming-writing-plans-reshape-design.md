# Brainstorming + Writing-Plans Reshape — Design Spec

Sub-projects 4 and 5 of the Consilium roadmap. Combined spec — both skills follow the same reshape pattern with skill-specific additions.

## Approach

Injection, not rewrite. The existing SKILL.md files work. We add Consilium capabilities at specific injection points. Existing content stays verbatim. A language/voice refinement pass can come later.

## Dependencies

- Personas: `skills/references/personas/` (sub-project 2 — complete)
- Domain Bible: `skills/references/domain/` (sub-project 1 — complete)
- Verification Engine: `skills/references/verification/` (sub-project 3 — complete)

## Files Modified

| File | Nature of change |
|-|-|
| `skills/brainstorming/SKILL.md` | Inject persona, domain bible, ambiguity elimination, confidence annotations, verification dispatch. Update checklist, paths. |
| `skills/writing-plans/SKILL.md` | Inject persona, domain bible, domain-informed exploration, confidence annotations on tasks, verification dispatch. Update paths. |

## What Stays Unchanged

**Brainstorming:**
- HARD-GATE on no implementation before design approval
- One-question-at-a-time principle
- Multiple choice preferred
- Visual companion system
- Design-for-isolation principles
- Working-in-existing-codebases guidance
- Propose 2-3 approaches with trade-offs
- Present design sections with incremental validation
- YAGNI ruthlessly

**Writing-Plans:**
- Bite-sized task granularity (2-5 minutes per step)
- No-placeholder rules
- Exact file paths, complete code in every step
- TDD, DRY, YAGNI, frequent commits
- Plan document header format
- Task structure format
- Scope check
- File structure mapping
- Execution handoff options (subagent-driven vs inline)

---

## Shared Changes (Both Skills)

### 1. Persona Activation

Injected at top of each SKILL.md, after frontmatter:

```markdown
## Consilium Identity

You are the Consul — Publius Auctor. Read your full identity before proceeding:
`skills/references/personas/consul.md`

You also operate under the Consilium Codex:
`skills/references/personas/consilium-codex.md`
```

Points at files. The agent reads them and becomes the Consul. No inline persona content — the persona files are the source of truth. The skill activates the persona; the persona defines the identity. The Consul's behavioral stance (brainstorming vs planning) is determined by which skill activates it.

### 2. Domain Bible Loading

Injected into the "Explore project context" step (brainstorming) and the file structure mapping step (writing-plans):

```markdown
Load domain knowledge: read `skills/references/domain/MANIFEST.md` and select 1-3 
domain files relevant to the topic. When domain concepts appear in conversation, 
confirm your understanding against the loaded files before proceeding.
```

During brainstorming, the Consul confirms domain understanding inline as concepts arise — "I understand saved products are created through proofing, distinct from catalog products. Correct?" This is not a formal phase; it's the Consul's natural behavior per its persona (trauma: didn't verify domain understanding).

### 3. Verification Engine Dispatch

Injected as a new step after self-review in both skills:

```markdown
After self-review passes, dispatch independent verification per the protocol:
Read `skills/references/verification/protocol.md` and the relevant template.

Default: dispatch. Announce "Dispatching [agents] for verification." 
The Imperator can say "skip."

Handle findings per the protocol. Present summary with finding attribution 
to the Imperator.
```

Brainstorming reads `templates/spec-verification.md` (Censor + Provocator).
Writing-plans reads `templates/plan-verification.md` (Praetor + Provocator).

### 4. Path Changes

- Brainstorming default spec path: `docs/superpowers/specs/` → `docs/consilium/specs/`
- Writing-plans default plan path: `docs/superpowers/plans/` → `docs/consilium/plans/`
- Override clause stays: "User preferences for spec/plan location override this default"

---

## Brainstorming-Specific Changes

### 5. Ambiguity Elimination Phase

New checklist step injected between "Propose 2-3 approaches" (step 4) and "Present design" (step 6). This runs AFTER the Imperator selects an approach, BEFORE the Consul presents the design.

```markdown
## Ambiguity Elimination

After the Imperator selects an approach, before presenting the design:

1. List every assumption you're about to bake into the spec.
2. Classify each:
   - **Idea ambiguity** — only the Imperator can resolve. Ask directly, 
     one at a time.
   - **Codebase ambiguity** — answerable by reading code. Dispatch 
     exploration agent(s) to verify.
   - **Domain ambiguity** — answerable from the domain bible. Check the 
     loaded files.
3. Resolve all three types before proceeding.
4. Any assumption that cannot be resolved gets marked Low confidence in 
   the spec with an explicit note about what remains uncertain and why.

The goal: by the time you write the spec, almost everything is High 
confidence because ambiguity was eliminated, not annotated.
```

**Why after approach selection:** The approach choice introduces new assumptions that weren't present during initial questioning. "We'll use a Zustand store" implies assumptions about state management patterns. "We'll add a new API endpoint" implies assumptions about backend routing. These can't be identified until the approach is locked.

**Why before presenting design:** The design should be built on resolved assumptions, not on guesses. Presenting a design riddled with Medium/Low confidence wastes the Imperator's review time on sections that might change.

### 6. Inline Confidence Annotations

Addition to the "Present design" step:

```markdown
Each section of the design carries an inline confidence annotation:

> **Confidence: High/Medium/Low** — [evidence for this rating]

Write these as you present each section. They become part of the written 
spec and direct verification agents' scrutiny.

Levels:
- **High** — Imperator was explicit, domain bible is unambiguous, or 
  codebase exploration confirmed.
- **Medium** — Your synthesis of multiple inputs. The conclusion wasn't 
  directly stated.
- **Low** — Best guess. Should be rare after ambiguity elimination.
```

### 7. Updated Brainstorming Checklist

From 9 steps to 12:

1. Explore project context + **load domain bible via MANIFEST.md**
2. Offer visual companion
3. Ask clarifying questions **(confirm domain concepts inline as they arise)**
4. Propose 2-3 approaches
5. **Ambiguity elimination sweep**
6. Present design **(with inline confidence annotations)**
7. Write design doc **(default path: `docs/consilium/specs/`)**
8. Spec self-review (layer 1 — unchanged)
9. **Dispatch verification — Censor + Provocator (layer 2, default on)**
10. **Handle findings, present summary to Imperator**
11. User reviews written spec
12. Transition to implementation (invoke writing-plans)

Steps 5, 9, 10 are new. Steps 1, 3, 6, 7 are modified. Steps 2, 4, 8, 11, 12 are unchanged.

### 8. Updated Brainstorming Process Flow

```
Explore context + load domain bible
    ↓
Visual companion offer (if applicable)
    ↓
Clarifying questions (Consul confirms domain concepts inline)
    ↓
Propose 2-3 approaches → Imperator picks
    ↓
Ambiguity elimination sweep (list assumptions, resolve all three types)
    ↓
Present design with inline confidence annotations → Imperator approves per section
    ↓
Write spec to docs/consilium/specs/
    ↓
Self-review (layer 1 — placeholders, contradictions, ambiguity, scope)
    ↓
Dispatch Censor + Provocator (layer 2 — default on, Imperator can skip)
    ↓
Handle findings, present summary
    ↓
User reviews spec
    ↓
Invoke writing-plans
```

---

## Writing-Plans-Specific Changes

### 9. Domain-Informed Codebase Exploration

Addition to the existing "File Structure" step. The Consul (planning stance) explores the codebase with domain bible loaded before writing tasks:

```markdown
Before writing tasks, explore the codebase with domain bible loaded. The 
domain bible tells you which entities, models, and services exist. Use 
this to:
- Verify file paths before referencing them in tasks
- Confirm hook return types, component props, API shapes
- Identify the right models/services to target

This is due diligence, not a formal sweep. The Praetor will catch what 
you miss.
```

### 10. Inline Confidence Annotations on Plan Tasks

Each task in the plan carries a confidence annotation:

```markdown
### Task 3: Add display name hook
> **Confidence: High** — verified `useProduct` exists at 
> `src/app/_hooks/useProduct.ts`, returns `product` with `metadata` field.

- [ ] Step 1: ...
```

This gives the Praetor and Provocator targets when they verify the plan. Tasks with Medium/Low confidence get extra scrutiny.

### 11. Updated Writing-Plans Flow

No new checklist steps — the additions are injections into existing steps:

- File Structure step: + domain-informed codebase exploration
- Task writing: + inline confidence annotations per task
- Self-review: unchanged (layer 1)
- **New: Dispatch Praetor + Provocator (layer 2, default on)**
- **New: Handle findings, present summary to Imperator**
- Execution handoff: unchanged

---

## Relationship to Existing Reviewer Templates

Both skills currently have reviewer prompt templates:
- `brainstorming/spec-document-reviewer-prompt.md`
- `writing-plans/plan-document-reviewer-prompt.md`

These are **replaced** by the verification engine templates. The old files can be deleted or left in place (they won't be referenced after the reshape). The skill's self-review section stays as layer 1; the verification engine dispatch replaces the old reviewer dispatch as layer 2.

## What This Spec Does NOT Cover

- **Subagent-driven-development reshape** (sub-project 6) — Legatus persona, mini-checkit, Campaign review. That's Wave 4.
- **Systematic-debugger reshape** (sub-project 7) — also Wave 4.
- **Language/voice refinement** — making the entire SKILL.md read with Consilium voice. Deferred to a future pass.
- **Learning loop** — post-run domain bible updates. Deferred to post-Wave 4.
