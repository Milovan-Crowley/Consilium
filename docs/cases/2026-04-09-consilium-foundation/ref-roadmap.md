# Consilium — Master Roadmap

Forked from superpowers v5.0.7. This roadmap defines 8 sub-projects that reshape superpowers into Consilium — a domain-aware planning and verification system for Divinipress.

Each sub-project follows its own brainstorming → spec → plan → implementation cycle in a dedicated session. This document provides enough context for a fresh session to pick up any sub-project independently.

**Prerequisite for every session:** Read `docs/CONSILIUM-VISION.md` for strategic context, then this roadmap for the sub-project scope.

---

## Execution Waves

| Wave | Sub-projects                                              | Parallel? | Dependencies                                                           |
| ---- | --------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| 1    | Domain Bible + Roman Personas                             | Yes       | None                                                                   |
| 2    | Verification Engine                                       | Solo      | Personas (for agent identity), Domain Bible (for content)              |
| 3    | Brainstorming Reshape + Writing-Plans Reshape             | Yes       | Verification Engine, Domain Bible, Personas                            |
| 4    | Subagent-Driven-Dev Reshape + Systematic-Debugger Reshape | Yes       | Verification Engine, Personas, Writing-Plans (for debugger escalation) |
| 5    | Learning Loop & Knowledge Graph                          | Solo      | All Wave 1-4 complete, Graphify installed                              |

---

## Sub-project 1: Domain Bible

**Wave:** 1
**Dependencies:** None
**Output files:**

- `skills/references/domain-bible.md` — curated business/domain reference
- `skills/references/store-code-map.md` — entity map of the store repo
- `skills/references/backend-code-map.md` — entity map of the backend repo

### What

A single authoritative reference capturing Divinipress business and domain concepts that agents consistently get wrong. Not code patterns — business logic: what entities exist, how they relate, what the business rules are.

### Why

The display name incident (documented in CONSILIUM-VISION.md) proved that agents confidently misunderstand domain concepts and no amount of code-grepping catches it. The domain bible prevents this class of error by giving producing agents correct understanding from the start.

### Scope

1. **Code exploration:** Dispatch agents to both repos to map models, schemas, routes, services, and key abstractions:
   - Store: `/Users/milovan/projects/divinipress-store`
   - Backend: `/Users/milovan/projects/divinipress-backend`
2. **Code maps:** Produce a structural map of each repo — entities, relationships, service boundaries, data flow. These are reference documents, not exhaustive line-by-line indexes.
3. **CLAUDE.md cross-reference:** Read both repos' CLAUDE.md files and extract domain concepts already documented.
4. **Curation:** Merge code exploration + CLAUDE.md knowledge into a single domain bible organized by topic:
   - Entities and their relationships (catalog products, saved products, designs, orders, etc.)
   - Business flows (proofing, ordering, customization)
   - Roles and permissions (admin, designer, staff, customer)
   - Naming conventions (display name vs product title, etc.)
   - Common misunderstandings and corrections
5. **Validation:** Walk through the bible with the user to confirm accuracy.

### Session instructions

Start by dispatching parallel agents to explore both repos. Produce the code maps first, then curate the bible. The bible should be concise — a reference, not a textbook. Each entry should state what the concept IS, how it relates to other concepts, and what agents commonly get wrong about it.

---

## Sub-project 2: Roman Personas

**Wave:** 1 (parallel with Domain Bible)
**Dependencies:** None
**Output files:**

- `skills/references/personas.md` — persona definitions, activation contexts, behavioral expectations

### What

Define the persona hierarchy that all Consilium agents adopt. Named after Roman military/civic roles to match the Consilium theme ("the war council").

### Starting point

These personas were agreed on during initial brainstorming. Refine, don't reinvent:

| Persona              | Role                                                                                | When active                                                       |
| -------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Consul**     | Lead agent — runs brainstorming and planning, holds conversation context           | Brainstorming, writing-plans                                      |
| **Censor**     | Independent spec verifier — reviews specs cold against domain bible                | After spec is written                                             |
| **Praetor**    | Independent plan verifier — reviews plans against spec + domain bible              | After plan is written                                             |
| **Legatus**    | Executor — orchestrates subagent-driven implementation                             | Execution phase                                                   |
| **Tribunus**   | Code verifier — post-implementation and per-task verification                      | After execution (full checkit) and after each task (mini-checkit) |
| **Provocator** | Adversarial reviewer — tries to poke holes, find weaknesses, challenge assumptions | Dispatched alongside Censor/Praetor during verification           |

### Scope

1. **Define each persona:** Name, role description, when it activates, what it receives as input, what it produces as output, behavioral tone.
2. **Provocator design:** This is the adversarial/combative persona. Define how it differs from Censor/Praetor — they verify correctness, Provocator stress-tests resilience. What does it look for? Edge cases, unstated assumptions, "what if X fails", scope creep, overconfidence.
3. **Interaction rules:** How do personas hand off to each other? What does the Consul do with Provocator findings vs Censor findings?
4. **Persona document format:** Each persona gets a section with enough detail that a skill file can reference it and an agent knows how to behave.

### Session instructions

This is a design exercise, not a code exercise. The output is a single reference document. Keep it practical — these descriptions will be injected into agent prompts, so they need to be concrete behavioral instructions, not flavor text.

---

## Sub-project 3: Verification Engine

**Wave:** 2
**Dependencies:** Personas (sub-project 2), Domain Bible (sub-project 1)
**Output files:**

- `skills/references/verification-engine.md` — protocol spec
- Prompt templates for Censor, Praetor, and Provocator agents (location TBD during brainstorming — likely `skills/references/prompts/`)

### What

The core mechanism that replaces inline self-review across all Consilium skills. Not a standalone skill — a shared protocol that brainstorming, writing-plans, and subagent-driven-dev all call into.

### How it works

1. **Consul** (producing agent) finishes an artifact (spec or plan).
2. Consul writes a brief context summary — what was discussed, key decisions, constraints. This is NOT the raw conversation — it's a distilled briefing.
3. Consul dispatches verification agent(s) via the Agent tool:
   - **Censor** for specs, **Praetor** for plans
   - **Provocator** alongside either (adversarial review)
   - Agents receive: the artifact + domain bible + context summary
4. Verification agents return findings categorized as:

| Category         | Meaning                                           | Behavior                                                                     |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| MISUNDERSTANDING | Agent doesn't grasp a domain concept              | **Halt.** Report to user. Auto-feed won't fix a broken mental model.   |
| GAP              | Requirement not covered, or task misses something | **Auto-feed** back to Consul. Consul fixes and optionally re-verifies. |
| CONCERN          | Approach works but there's a better/simpler way   | **Auto-feed as suggestion.** Consul decides whether to adopt.          |
| SOUND            | Confirmed correct, with reasoning                 | Reported. No action.                                                         |

5. Every finding includes what the artifact **should** do or consider — not just what's wrong.

### Depth levels

- **Patrol:** 1-2 agents, single pass. For small/simple artifacts.
- **Campaign:** Full hierarchy with specialized agents in parallel. Default when scope is uncertain. (Mil's preference: default to Campaign — agents underestimate and are overconfident.)

### Auto-feed loop

- GAP/CONCERN findings go back to Consul automatically.
- Consul revises the artifact and can re-dispatch verification.
- Max iterations before escalating to user: define during brainstorming (probably 2-3).
- MISUNDERSTANDINGs always escalate immediately — no auto-fix attempts.

### Key design constraint

The verification agent must NOT receive the full conversation. The whole point is independent eyes. It receives:

- The artifact (spec or plan)
- The domain bible
- A brief context summary written by the Consul
- The Provocator's specific mandate to stress-test

### Scope

1. Define the verification protocol (dispatch, input, output format, finding schema).
2. Define the auto-feed loop (how findings route back, iteration limits, escalation).
3. Define depth levels and when to use each.
4. Write prompt templates for Censor, Praetor, and Provocator agents.
5. Define how consuming skills integrate (what the Consul does at the "dispatch verification" step).

### Session instructions

This is the most architecturally significant sub-project. The protocol must be concrete enough that each consuming skill (brainstorming, writing-plans, subagent-driven-dev) can implement it consistently. Think of this as defining an interface — the consuming skills are implementations.

---

## Sub-project 4: Brainstorming Reshape

**Wave:** 3 (parallel with Writing-Plans Reshape)
**Dependencies:** Domain Bible, Personas, Verification Engine
**Output files:**

- Modified `skills/brainstorming/SKILL.md`
- Modified or new prompt templates in `skills/brainstorming/`

### What

Reshape the existing brainstorming skill for Consilium. The conversational flow mostly stays — the upgrades are domain awareness and independent verification replacing self-review.

### Changes from current

1. **Consul persona** runs the conversation (replaces generic assistant voice).
2. **Domain bible loaded at start** — Consul begins with correct domain understanding of Divinipress entities.
3. **Domain-aware probing** — when the user describes something touching Divinipress entities, Consul confirms its understanding against the bible before proceeding. Not interrogation — just "I understand X means Y in your system, correct?"
4. **Independent spec verification** replaces inline self-review:
   - After spec is written, Consul dispatches Censor + Provocator via verification engine.
   - Auto-feed loop for GAPs/CONCERNs.
   - Halt on MISUNDERSTANDINGs.
5. **Spec path** changes from `docs/superpowers/specs/` to `docs/consilium/specs/`.
6. **Everything else stays:** Visual companion, one-question-at-a-time, approach proposals, user review gate.

### What stays unchanged

- The brainstorming checklist and flow (explore → questions → approaches → design → write → review)
- Visual companion system
- Design-for-isolation principles
- Working-in-existing-codebases guidance
- HARD-GATE on no implementation before design approval

### Session instructions

Read the current `skills/brainstorming/SKILL.md` first. The reshape is surgical — inject domain awareness and swap self-review for verification engine dispatch. Don't rewrite what works.

---

## Sub-project 5: Writing-Plans Reshape

**Wave:** 3 (parallel with Brainstorming Reshape)
**Dependencies:** Domain Bible, Personas, Verification Engine
**Output files:**

- Modified `skills/writing-plans/SKILL.md`
- Modified or new prompt templates in `skills/writing-plans/`

### What

Same treatment as brainstorming — inject domain awareness and replace self-review with independent plan verification.

### Changes from current

1. **Consul persona** writes the plan.
2. **Domain bible informs task breakdown** — Consul knows which models, services, and entities to target without exploring from scratch.
3. **Independent plan verification** replaces inline self-review:
   - After plan is written, Consul dispatches Praetor + Provocator via verification engine.
   - Praetor verifies plan against spec + domain bible.
   - Provocator stress-tests: missing edge cases, unstated assumptions, scope gaps.
   - Auto-feed loop for GAPs/CONCERNs, halt on MISUNDERSTANDINGs.
4. **Plan path** changes from `docs/superpowers/plans/` to `docs/consilium/plans/`.

### What stays unchanged

- Task format (one action, 2-5 minutes, exact paths, complete code)
- No-placeholder rules
- Concreteness requirements
- Execution handoff options

### Session instructions

Read the current `skills/writing-plans/SKILL.md` first. Same principle as brainstorming reshape — surgical, not a rewrite.

---

## Sub-project 6: Subagent-Driven-Dev Reshape

**Wave:** 4 (parallel with Systematic-Debugger Reshape)
**Dependencies:** Verification Engine, Personas
**Output files:**

- Modified `skills/subagent-driven-development/SKILL.md`
- Modified prompt templates in `skills/subagent-driven-development/`

### What

Reshape execution to use Opus agents, add per-task verification (mini-checkit), and full verification after all tasks complete.

### Changes from current

1. **All subagents run on Opus** (not Sonnet).
2. **Legatus persona** orchestrates execution.
3. **Mini-checkit after each task:**
   - Tribunus agent verifies just that task's output against the plan step + domain bible.
   - Patrol depth (quick, focused, single-pass).
   - Catches drift early before it compounds across tasks.
   - GAP findings auto-feed back to the implementing agent for that task.
   - MISUNDERSTANDING findings halt and escalate to user.
4. **Full checkit after all tasks complete:**
   - Campaign-depth Tribunus review of the entire implementation against the spec.
   - "Does the whole thing hold together?" check.
   - Same finding categories and behavior.
5. **Same finding categories** (MISUNDERSTANDING/GAP/CONCERN/SOUND) at both mini and full levels.

### Current two-stage review (replaced)

The current skill has spec-compliance review + code-quality review as separate stages. These get replaced by the Tribunus verification using the standardized finding categories. The Tribunus prompt should cover both spec compliance and code quality.

### Session instructions

Read the current `skills/subagent-driven-development/SKILL.md` and its prompt templates first. The reshape adds verification at two points (per-task and end) and upgrades agent quality (Opus). The dispatch/execution flow stays similar.

---

## Sub-project 7: Systematic-Debugger Reshape

**Wave:** 4 (parallel with Subagent-Driven-Dev Reshape)
**Dependencies:** Verification Engine, Personas, Writing-Plans (for escalation path)
**Output files:**

- Modified `skills/systematic-debugging/SKILL.md`
- Modified reference files in `skills/systematic-debugging/`

### What

Fix the current debugger's tendency to go straight to editing. Add verification-first diagnosis and threshold-based routing for fixes.

### Current pain point

The debugger identifies a potential fix and edits immediately. The user doesn't want speculative edits — they want confirmed diagnoses brought to them, with the fix approach validated before code is touched.

### New flow

1. **Diagnosis phase** (stays mostly the same): Systematic root-cause analysis, hypothesis testing, evidence gathering.
2. **Verification before fix** (NEW): Dispatch a Tribunus agent to independently confirm the diagnosis. "Is this actually the root cause?" The user sees a verified diagnosis, not a guess.
3. **Threshold-based routing** (NEW):

| Scope        | Criteria (refine during brainstorming)            | Route                                                                           |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Small        | Few lines changed, 1-2 files touched              | Fix inline, mini-checkit after                                                  |
| Medium/Large | Many lines, multiple files, architectural changes | Write an implementation plan via writing-plans, hand off to subagent-driven-dev |

4. **Findings presented to user** only after verification — what the user sees is confirmed, not speculative.

### Threshold definition

The exact thresholds (line count, file count, complexity measure) get worked out during this sub-project's brainstorming session. The principle is: simple, isolated fixes happen inline; anything that could introduce secondary breakage gets a plan.

### Session instructions

Read the current `skills/systematic-debugging/SKILL.md` and all its reference files first. The reshape adds a verification gate between diagnosis and fix, plus scope-based routing. The diagnostic methodology (4-phase root cause) stays.

---

## Sub-project 8: Learning Loop & Knowledge Graph

**Wave:** 5
**Dependencies:** All Wave 1-4 sub-projects complete (skills generating findings), Graphify installed
**Spec:** `docs/consilium/specs/2026-04-09-learning-loop-design.md`
**Output:**
- Separate repo: MCP server exposing knowledge graph queries
- `skills/references/personas/pontifex.md` — new persona
- Consilium Codex updated with Pontifex
- Skill modifications to query MCP server instead of loading bible files

### What

A self-improving knowledge system. Graphify extracts code structure + domain bible into a unified graph. A custom MCP server exposes it via relationship traversal queries (replacing bible file loading for agents). A new persona — Pontifex (keeper of sacred knowledge) — writes resolved verification findings back to the graph at three checkpoints: spec approved, plan approved, implementation complete.

### Key decisions (from brainstorming)

- **Graphify used as-is** — black box, don't fork, let upstream improve
- **MCP server in separate repo** — different lifecycle than skill files
- **Domain bible gets ingested, not deprecated** — graphify processes bible files alongside code, they become nodes/edges in the graph. Manual edits → re-run graphify → graph absorbs.
- **Pontifex fires at checkpoints** — not after every verification dispatch (too noisy) and not only at end (too late). Three natural pauses where findings are already resolved.
- **Interface:** `query(concept)`, `traverse(from, to)`, `pitfalls(concept)`, `write_finding(finding)` — intentionally small
- **Graph schema intentionally rough** — let shape emerge from real findings

### Open problems (deferred to after initial setup)

- **Active briefing:** Pre-load relevant findings at start of each phase so Consul gets a briefing, not a library card
- **Pattern detection:** Surface recurring misunderstandings across multiple runs ("agents confuse X and Y in 4/5 runs")

### Implementation sequence

1. Run graphify against both repos + bible files
2. Build MCP server (load graph.json, expose 4 endpoints)
3. Define Pontifex persona
4. Wire Pontifex into Consilium flow (Consul dispatches at checkpoints)
5. Shift skills to query MCP server (gradual, fallback to bible files)
6. Observe — let real runs produce findings, iterate

### Session instructions

Read the full spec at `docs/consilium/specs/2026-04-09-learning-loop-design.md`. Steps 1-2 (graphify + MCP server) can be a session. Steps 3-5 (Pontifex + integration) can be another. Step 6 is ongoing.

---

## Plugin Identity (Deferred)

Renaming from "superpowers" to "consilium" in plugin.json, package.json, etc. Deferred until the skill reshaping is complete — no point renaming before the content is reshaped. Can be done as a quick cleanup after wave 4.

---

## How To Use This Roadmap

1. Open a new session.
2. Tell the session: "Read `docs/CONSILIUM-VISION.md` and `docs/consilium/ROADMAP.md`. I'm working on Sub-project N: [name]. Let's brainstorm."
3. The session runs the full brainstorming → spec → plan → implementation cycle for that sub-project.
4. After completion, start the next wave.

Sub-projects within the same wave can run in parallel sessions. Sub-projects in later waves depend on earlier waves being complete.
