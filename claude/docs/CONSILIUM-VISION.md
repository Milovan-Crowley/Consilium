# Consilium — Vision & Decisions

Forked from superpowers. This doc captures decisions made during the initial brainstorming session (2026-04-09) to guide the reshaping of this skill set.

## Core Insight

The problem isn't bad plans — it's bad planning process. Building a post-hoc verification skill (plancheck) treats symptoms. The real fix: reshape the planning skills themselves so specs and plans come out right the first time, with independent verification built into the flow rather than bolted on after.

## What Consilium Replaces

Superpowers brainstorming + writing-plans, with three key upgrades:
1. Domain knowledge baked into the producing agents (not just verifiers)
2. Self-review replaced with independent verification agents
3. All agents run on Opus (superpowers used Sonnet subagents, which was a known pain point)

## Architecture: Six Verification Points

```
Brainstorming → SPEC written
                  ↓
            Censor + Provocator verify spec (independent, parallel)
                  ↓
            Writing plans → PLAN written
                  ↓
            Praetor + Provocator verify plan (independent, parallel)
                  ↓
            Execution (Legatus dispatches tasks)
                  ↓
            Tribunus verifies each task (mini-checkit, Patrol depth)
                  ↓
            All tasks complete
                  ↓
            Censor + Praetor + Provocator Campaign review (full implementation vs spec)
                  ↓
            Checkit (separate tool — post-implementation code-level verification)
```

**Point 6 (added for the debugging subsystem):** Diagnosis verification (Tribunus + Provocator on the packet). When the Medicus writes a 14-field diagnosis packet in `/tribune`, Tribunus (diagnosis stance) and Provocator verify it in parallel per `skills/references/verification/templates/tribune-verification.md`. The Imperator gate comes after verification. This point is out-of-pipeline — it runs on `/tribune` invocation, not the spec→plan→execute flow — so it lives as a supplemental annotation rather than a new diagram node.

The producing agent has irreplaceable context — the user's corrections, decisions made in conversation, back-and-forth clarifications. An external verifier reading cold will never have that. So:
- The **producing agent** keeps full conversational context
- The **verification agent** is independent (no confirmation bias) and dispatched by the producing agent
- Verification happens INSIDE the Consilium flow, not as a separate skill

## Finding Categories

Replace checkit's WRONG/VERIFIED/UNCERTAIN with categories that teach rather than condemn:

| Category | Meaning | Behavior |
|-|-|-|
| MISUNDERSTANDING | Agent doesn't grasp a domain concept. Includes $CONSILIUM_DOCS doctrine reference + what it should be. | **Halts.** Reports to user. Auto-feed won't fix a broken mental model. |
| GAP | Spec requirement not covered, or plan task misses something. | **Auto-feeds.** Agent understands the problem, just missed something. |
| CONCERN | Approach works but there's a better/simpler way. | **Auto-feeds as suggestion**, not mandate. |
| SOUND | Confirmed correct, with reasoning. | Reported. |

Key principle: every finding includes what the plan **should** do or consider, not just what's wrong. The producing agent gets a correction it can act on.

## Doctrine

A modular knowledge system at `$CONSILIUM_DOCS/doctrine/` capturing business/domain concepts agents keep getting wrong. Not code patterns (that's checkit's armory), but business logic. Six topic files + two code maps + a manifest:

- **products.md** — catalog vs saved products, creation on approval, image hydration, reorder flow
- **proofing.md** — proof lifecycle, job status vs order status, state machine, file uploads
- **roles.md** — super admin vs admin vs designer vs staff, permissions, company-scoped tenancy
- **orders.md** — order lifecycle, two ordering paths, cart flows, sub-orders, fulfillment
- **teams-collections.md** — teams, collections, staff product assignment, access boundaries
- **naming.md** — display name vs product title, terminology traps, field naming, enum conventions
- **store-code-map.md / backend-code-map.md** — structural maps of both repos

`MANIFEST.md` is the only file every agent path loads. Dispatching agent scans it, picks 1-3 domain files + 0-1 code maps based on task context. See Wave 1 Decisions for full architecture.

## Case Folder Model

Durable Consilium artifacts live under `$CONSILIUM_DOCS/cases/` as folders named `YYYY-MM-DD-<slug>`. Each folder carries `STATUS.md` frontmatter as the state source, plus primary artifacts such as `spec.md`, `plan.md`, or `diagnosis.md`. The detailed file conventions and scan rules live in `$CONSILIUM_DOCS/CONVENTIONS.md`.

## Learning Loop (Post-Run Memory Writer)

After every Consilium run, the Legatus-equivalent:
1. Reviews what the verification agents found
2. Updates the $CONSILIUM_DOCS doctrine with new concepts discovered
3. Catalogs common misunderstandings for future runs
4. Enriches armory/reference files

The skill gets sharper with every use. This is the compounding advantage over a static skill.

## Depth Levels

Two levels (not three like checkit):
- **Patrol** — 1-2 agents, single-pass. Quick sanity check for small specs.
- **Campaign** — Full hierarchy with specialized agents in parallel. Default when unsure. Mil's preference: default to larger than probably required, because agents constantly underestimate and are overconfident.

## Relationship to Checkit

Consilium and checkit are complementary, not overlapping:
- **Consilium** verifies forward: "Will this work when built?"
- **Checkit** verifies backward: "Does this match what exists?"

Consilium runs before execution. Checkit runs after. The $CONSILIUM_DOCS doctrine may be shared between them.

## Roman Theme

The skill is named Consilium — the Roman war council where strategy was debated before battle. Generals gathered, debated, verified the plan, then deployed. "The Consilium produced the plan, the Legion verified the code."

The Roman theme is not cosmetic — the actual Roman roles map functionally to what the agents do. The Consul presides, the Censor judges standards, the Praetor commands in the field, the Legatus executes orders, the Tribunus walks among the troops, the Provocator challenges in the arena. Each persona serves the Imperator with undying loyalty, expressed differently through their role.

## Reference: The Display Name Problem

The case that motivated this skill. An agent was tasked with implementing a `display_name` feature for saved products. The agent:
- Confused catalog products (blanks like "Bella Canvas 3001") with saved products (customer-owned copies from proofing)
- Targeted the wrong entities entirely
- Was confident it understood the problem
- Required extensive manual correction in conversation

This is the class of error Consilium is designed to prevent — conceptual misunderstanding that no amount of code-grepping catches. The spec is at `divinipress-store/docs/specs/frontend-display-name.md` and the plan at `divinipress-store/docs/superpowers/plans/2026-04-08-frontend-display-name.md` for reference.

## Wave 1 Decisions (2026-04-09)

### Doctrine Architecture

The $CONSILIUM_DOCS doctrine is not a single file — it's a modular knowledge system organized by topic, composed at dispatch time.

**Three-layer separation:**
- **Doctrine** — business truth about what things ARE. Lives at `$CONSILIUM_DOCS/doctrine/`. Six topic files + two code maps + manifest.
- **Armory** — weapons against mistakes (testable assertions, anti-patterns). Will live with the verification engine (sub-project 3).
- **Persona trauma** — lane-specific scars baked into agent prompts. Lives at `skills/references/personas/`.

Flow: Bible informs Armory. Armory arms Personas.

**Domain files:** proofing.md, products.md, roles.md, orders.md, teams-collections.md, naming.md. Each follows a template: frontmatter (sources, verified date), Concepts (Is/Is not format), Rules, Code Pointers, Related (cross-loading hints).

**Code maps:** store-code-map.md, backend-code-map.md. Organized by repo (not by topic) because code structures cross domain boundaries. Structure inspired by GSD codebase mapping templates.

**Dispatch:** MANIFEST.md is the only file every agent path loads. Dispatching agent scans it, picks 1-3 domain files + 0-1 code maps based on task context. Judgment-based selection, not rule-based mapping.

**Learning loop:** Files carry `sources:` (file paths) and `verified:` (date) in frontmatter. Session-end review captures confirmed learnings. Staleness detection flags files whose source code changed since verification date. The structure supports the loop from day one — mechanisms get built in later sub-projects.

### Persona Hierarchy (Resolved)

| Persona | Name | Role |
|-|-|-|
| **Consul** | Publius Auctor | Lead agent — brainstorming, planning, holds conversation with Imperator |
| **Censor** | Aulus Scrutinus | Independent spec verifier — reviews specs cold against $CONSILIUM_DOCS doctrine |
| **Praetor** | Sextus Pragmaticus | Independent plan verifier — checks executability, dependencies, file collisions |
| **Legatus** | Gnaeus Imperius | Executor — dispatches implementing agents, tactical vs strategic decisions |
| **Tribunus** | Tiberius Vigil | Per-task code verifier — Patrol depth, catches drift before it compounds |
| **Provocator** | Spurius Ferox | Adversarial reviewer — stress-tests assumptions, edge cases, overconfidence |
| **Imperator** | (Milovan) | Not a persona agents adopt — defines who the Consilium serves |

Each persona carries a specific trauma tied to their lane's failure mode. The consilium-codex.md defines shared law (finding categories, auto-feed loop, depth levels, interaction protocols).

### Codex / Verification Engine Overlap

The consilium-codex.md (produced in Wave 1 with personas) defines the "what" of verification — finding categories, auto-feed loop, independence rule, depth levels. Sub-project 3 (verification engine) defines the "how" — prompt templates, dispatch mechanics, iteration limits, agent wiring. The codex is the spec that sub-project 3 implements.

### Key Design Decisions (Persona Session)

**Provocator is a separate agent.** We considered folding adversarial thinking into Censor/Praetor prompts but rejected it. Agents are less adversarial when also trying to be fair/balanced — the adversarial lens gets diluted. Separate agent, parallel dispatch, independent findings.

**Confidence map.** The Consul produces a confidence map alongside every artifact (spec or plan). Per section/decision: High (Imperator was explicit), Medium (inferred), Low (best guess). Verification agents use it to prioritize — high-confidence areas get extra scrutiny because that's where blind spots hide. The Provocator uses it offensively as its primary hunting tool.

**Chain of evidence.** Every finding must trace reasoning from source to conclusion. Not "GAP: error handling missing" but a full chain citing spec section, $CONSILIUM_DOCS doctrine entry, and what's absent. A finding without evidence is rejected by the receiving persona.

**Deviation-as-improvement.** When implementation deviates from plan/spec but is demonstrably better, that's SOUND with reasoning — not GAP. Verifiers don't enforce conformance for conformance's sake. Surprises during implementation that improve the outcome should not be squashed.

**Campaign review = verification triad, not Legatus.** The Legatus orchestrated execution — having it review its own work is self-review, which Consilium is designed to eliminate. Post-execution Campaign review is dispatched BY the Legatus but performed by Censor + Praetor + Provocator independently. Same principle as Consul dispatching verification on its own spec.

**Consul two stances.** Brainstorming stance (collaborative, exploratory) and planning stance (directive, precise). One persona, two behavioral modes. The stance is determined by which skill activates the Consul, not by the Consul itself.

**Skill-agnostic personas.** Persona files define identity and operational doctrine but NOT the skill's process flow. The persona is an identity the skill activates; the skill is a mission the persona executes. This means the Consul persona works across brainstorming, writing-plans, and any future skill without modification.

**Work status vs finding categories.** Two separate vocabularies: finding categories (MISUNDERSTANDING/GAP/CONCERN/SOUND) for verification outputs, work status (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED) for implementing agent state. They don't overlap.

## The Debugging Subsystem

`/tribune` summons the **Medicus** (Gaius Salvius Medicus, field surgeon of the Consilium) — a main-session persona symmetric with the Consul and Legatus. The Medicus owns the debug session from summons to fix dispatch.

The Medicus's artifact is a **14-field diagnosis packet**. Thirteen fields are ported verbatim from the Codex-fork debugging reform (symptom, reproduction, affected lane, files inspected, failing boundary, root-cause hypothesis, supporting evidence, contrary evidence, known gap considered, proposed fix site, fix threshold, verification plan, open uncertainty). The fourteenth is Divinipress-specific: **contract compatibility evidence** — required on cross-repo cases, distinguishes Medium-backward-compatible from Large-breaking.

The Medicus's bias is **cross-repo as default**. Most Divinipress bugs span storefront and backend; symptoms spanning UI and data default to cross-repo until evidence proves single-lane.

The **Tribunus** verifies the packet in a diagnosis stance alongside its existing Legion patrol stance. One persona, two stances; the dispatch prompt declares which.

The **known-gaps doctrine** at `$CONSILIUM_DOCS/doctrine/known-gaps.md` holds product-specific recurring-bug memory. Entries are hypothesis accelerators, never proof — every use of a known gap in a diagnosis requires a live recheck against current repo state.

The **debugging-cases pipeline** at `$CONSILIUM_DOCS/cases/` is the cross-session transport layer. The Medicus writes the verified packet to a case file before the Imperator gate; the Legion reads it as orders; contained cases surface at the next `/tribune` session via Phase 1 directory scan.

The **Medusa Rig** is a triad of companion skills (`medusa-dev:building-storefronts`, `medusa-dev:building-admin-dashboard-customizations`, `medusa-dev:building-with-medusa`) wired across Consul, Edicts, Legion, March, and Tribune by lane. Main-session personas invoke the matching skill for their own reasoning; dispatchers name the skill in subordinate prompts for the subordinate to invoke. The Medusa MCP (`mcp__medusa__ask_medusa_question`) is frontmatter-bound on all user-scope agents for per-turn question-answering.

## Remaining Open Questions

- How to handle the brainstorming flow changes (questioning style, domain-aware probing) — sub-project 4
- Skill registration / plugin structure for Consilium — deferred until wave 4 complete
- Armory initial contents — what testable assertions to seed from known incidents — future work
