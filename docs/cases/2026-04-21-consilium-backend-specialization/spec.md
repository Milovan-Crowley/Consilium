# Consilium Backend Specialization — Session 1 Specification (v3)

**Date:** 2026-04-21
**Author:** Publius Auctor (Consul of the Consilium)
**Status:** Draft v3, reframed after v2 verification
**Session of:** 2 (this is Session 1 — Verifier Knowledge + First Specialist)

---

## Revision Note (v2 → v3)

v2 passed the Censor but the Provocator flagged six GAPs including a structural one: Deliverable 4's acceptance-gate scout would be denied by Deliverable 2's newly-installed hook (both operate on the same Medusa symbols, one legitimately, one as prevention). Beyond that mechanical collision, v2 revealed a deeper misalignment surfaced by the Imperator in deliberation: **the whole point was to equip verifiers with Medusa knowledge, not to build prevention scaffolding around an empty center.** v2 shipped a manifest (documentation), a hook (prevention), a Consul rule (upstream prevention), and an acceptance gate (validation) — four pieces of machinery around a reference file, and not one verifier agent that actually *used* the knowledge. The Codex pattern the Imperator wanted to port was specialist verifiers carrying doctrine; v2 carried doctrine around without any specialist to read it.

v3 inverts. Ship the knowledge + ship one verifier that carries it. Everything else goes to Session 2 or gets dropped.

## Purpose

Equip one Consilium verifier with Medusa-aware intelligence so it can audit backend work — PR #28 immediately, future backend plan tasks on dispatch — and catch Medusa anti-patterns that a generic tribunus cannot: routes bypassing workflows, raw SQL outside step compensation, `query.graph()` + JS filtering where `query.index()` belongs, subscribers mutating business state directly, link.create outside workflow steps, split-invariant writes, missing idempotency on money-path endpoints.

Session 1 produces two artifacts: the knowledge base (a manifest of review rules) and a backend-specialized Tribunus who loads that manifest on every dispatch. First dispatch of the specialized Tribunus against the referral program backend PR serves as the acceptance test — if it returns the findings the Imperator's earlier Codex audit caught, plus the gaps scout reconnaissance identified, the pattern is proven. Session 2 replicates the pattern across the remaining verification ranks (Censor, Praetor, Provocator), adds the Soldier and Scout specializations, and wires dispatch lane detection.

## Context

Three inputs shaped this design (and the reframe to v3):

1. **The Codex (other harness) Consilium** has repo-specialized verifiers (`centurio-back`, `speculator-back`, `interpres-back`) with baked-in doctrine. Reconnaissance confirmed the pattern works because the *worker agents themselves* carry the domain law — not because a reference file exists somewhere. v2 ported the reference file and forgot to port the worker. v3 corrects.

2. **The referral backend reviewer checklist** at `/Users/milovan/projects/worktrees/divinipress-backend/feature/referral-program-v1/docs/consilium/followups/2026-04-21-referral-backend-reviewer-checklist-candidate.md` plus the six gaps scout reconnaissance identified. Twelve rules total — the manifest's v1 content.

3. **v2 verification outcomes.** Both verifiers confirmed the Medusa domain claims are accurate. The Provocator's attacks landed on execution mechanics (hook-scout collision, rule template inadequate for absence-rules, money-path severity soft, cwd ambiguity, degraded-mode circular). Everything that tripped v2 was prevention/validation machinery v3 does not carry.

## Inputs

| Artifact | Path | Role |
|-|-|-|
| Canonical tribunus persona | `~/.claude/agents/consilium-tribunus.md` | Base persona for the backend variant (Deliverable 2) |
| Canonical tribunus (alt source) | `skills/references/personas/tribunus.md` | Persona reference |
| Medusa dev skill | `medusa-dev:building-with-medusa` | The skill the backend tribunus requires on every dispatch |
| Medusa MCP | `mcp__medusa__ask_medusa_question` | Docs-grounded Q&A used when manifest rules raise questions |
| Referral checklist candidate | `divinipress-backend/feature/referral-program-v1/docs/consilium/followups/2026-04-21-referral-backend-reviewer-checklist-candidate.md` | Source material for the manifest |
| Target PR (acceptance case) | `/Users/milovan/projects/worktrees/divinipress-backend/feature/referral-program-v1/` | First dispatch target — serves as acceptance test |
| Codex verification templates | `skills/references/verification/templates/` | Reference for dispatch patterns (tribunus-back uses the same mini-checkit shape) |
| Verification protocol | `skills/references/verification/protocol.md` | Finding categories and Chain of Evidence discipline |

## Scope Boundaries — Session 1 vs Session 2

### Session 1 (THIS spec) delivers

1. `skills/references/medusa-backend-gotchas.md` — the knowledge base (12 rules, compound-signal template, severity per Codex)
2. `~/.claude/agents/consilium-tribunus-back.md` — backend-specialized Tribunus carrying Medusa doctrine + manifest loader + required skill load

Plus: first dispatch of `consilium-tribunus-back` against referral PR #28 serves as the acceptance test. Not a separate deliverable — the artifact's first real use *is* the validation.

### Session 2 (explicitly NOT in this spec) will deliver

- `consilium-censor-back` — spec-phase backend verifier (same specialization pattern, different rank)
- `consilium-praetor-back` — plan-phase backend verifier
- `consilium-provocator-back` — adversarial backend verifier
- `consilium-soldier-back` — backend-specialized implementer + dispatch wiring
- `consilium-scout-back` on Sonnet + model downgrade of generic scout to Sonnet
- Full dispatch wiring in `consul/SKILL.md`, `edicts/SKILL.md`, `legion/SKILL.md`, `march/SKILL.md` for repo-lane auto-detection
- Consul HARD-GATE to load `medusa-dev:building-with-medusa` on backend topics (upstream prevention — deferred because specialized Censor catches spec-level Medusa issues downstream)
- Hook port (re-evaluated given tribunus-back proves what the actual failure surface is; hook may prove unnecessary once specialized verifiers exist)
- Update `docs/testing-agents.md`

Session 2 is deferred so the specialization pattern can be proven once (with tribunus-back on PR #28) before being replicated.

## Deliverable 1 — `skills/references/medusa-backend-gotchas.md`

**Purpose:** The manifest. Read by `consilium-tribunus-back` on every dispatch. In Session 2 it will be read by the other back-specialized verifiers. A reference file, not a skill — lives at the canonical path and is loaded by agents via Read, not via the Skill tool.

**File location:** `skills/references/medusa-backend-gotchas.md`

**Structure:**

```markdown
# Medusa Backend Gotcha Manifest (v1)

[Intake-Pass Doctrine — one paragraph on pre-action discipline for agents loading this file]

## Severity vocabulary (per Codex)

- GAP — a framework-contract violation or correctness requirement not met. Auto-fixed by the producing agent.
- CONCERN — works, but a better path exists. Advisory; reviewer may accept or push back with reasoning. Verifiers should upgrade to GAP at runtime when the finding lands on money-path or production-hot code paths (see R10, R11).
- MISUNDERSTANDING — reserved for runtime application. A reviewer applies this when the code reflects confusion about what a Medusa construct IS, not merely absence of one. Halts. Escalates.

## The Rules

### R1 — Route-Owned Multi-Step Mutation Saga [MEDUSA-IDIOM]

- **Grep signal:** <rg pattern matching the candidate surface (e.g. POST/PATCH handlers coordinating multiple writes)>
- **Absence check:** <rg pattern confirming the correlate is missing — e.g. no `createWorkflow` call reachable from the route, or no new file under `src/workflows/` in the same change set>
- **Suggested MCP question:** "When should a Medusa route coordinate multi-step writes directly vs invoke a workflow? What is the rollback contract?"
- **Severity:** GAP
- **Why:** Medusa docs explicitly require workflows for multi-step sagas (`docs.medusajs.com/learn/fundamentals/workflows/compensation-function`). Routes cannot implement step compensation; workflows can.

### R2 — Workflow Bypass Across Mutation Surfaces [MEDUSA-IDIOM]
...

(continues for each rule — compound signal, MCP question, severity, citation)

## Rules covered in v1

1. R1 — Route-owned multi-step mutation saga → GAP
2. R2 — Workflow bypass across mutation surfaces → GAP
3. R3 — Split invariant writes → GAP
4. R4 — Preview recomputed at commit time → GAP
5. R5 — query.graph + JS filter where query.index belongs → CONCERN
6. R6 — Raw SQL business mutation outside workflow → GAP
7. R7 — link.create outside workflow step → GAP
8. R8 — Subscriber doing business mutation directly → GAP
9. R9 — Transaction atomicity across module boundaries → GAP
10. R10 — Missing idempotency on money-path mutation endpoint → GAP
11. R11 — query.graph N+1 via nested graph reads → CONCERN (upgrade to GAP on production-hot paths)
12. R12 — Event payload contract drift → CONCERN

## Expected growth

v1 is provisional. First dispatch of tribunus-back against PR #28 is the validation run — any rule whose signal fails to catch a genuine anti-pattern in that PR gets refined. New rules added as they are validated.
```

**Rule template — compound signal rationale:** Six of the 12 rules test for the *absence* of something (missing workflow, missing compensation, missing idempotency handling). A single positive-hit grep cannot validate an absence. Each rule carries two patterns: one to find the candidate surface, one to confirm the correlate is absent. For rules where the signal is inherently question-based (R10's idempotency check requires understanding what handler implements), the `Suggested MCP question` field becomes the primary validator and the grep patterns are scaffolding.

**Severity changes from v2:**
- **R10 → GAP** (was CONCERN). Provocator correctly flagged that missing idempotency on a `payouts/mark-paid` endpoint is double-disbursement risk, not an advisory optimization.
- **R11 stays CONCERN** but carries an explicit runtime-upgrade note for production-hot paths.
- **R3 rationale clarified** to cover generic-backend correctness rules, not just Medusa idioms.
- **MISUNDERSTANDING reserved for runtime** (unchanged from v2) — no rule is classified MISUNDERSTANDING by default.

## Deliverable 2 — `consilium-tribunus-back` agent

**Purpose:** The backend-specialized Tribunus. Receives dispatch from the Legatus (mid-plan) or from the Imperator directly (standalone audit). Loads the manifest + Medusa skill on every dispatch. Produces Codex-format findings (MISUNDERSTANDING / GAP / CONCERN / SOUND) with Chain of Evidence.

**File:** `~/.claude/agents/consilium-tribunus-back.md`

**Frontmatter:**

```yaml
---
name: consilium-tribunus-back
description: Backend-specialized mini-checkit. Dispatched by the Legatus after backend-lane tasks or by the Imperator directly for backend PR audits. Loads Medusa gotcha manifest + `medusa-dev:building-with-medusa` skill on every dispatch. Verifies framework contract (workflow layering, step compensation, query API usage, subscriber discipline) plus standard Consilium mini-checkit concerns (plan step match, domain correctness, reality, integration). Read-only with Bash.
tools: Read, Grep, Glob, Skill, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__serena__find_file, mcp__serena__list_dir, mcp__graphify__query_graph, mcp__graphify__get_node, mcp__graphify__get_neighbors, mcp__graphify__get_community, mcp__graphify__god_nodes, mcp__graphify__graph_stats, mcp__graphify__shortest_path, mcp__medusa__ask_medusa_question, Bash
mcpServers:
  - serena
  - graphify
  - medusa
model: opus
---
```

Identical tool list to `consilium-tribunus`. The only frontmatter differences are name, description, and the explicit Medusa emphasis in the description.

**Body structure:**

1. **Identity line + creed + trauma.** Inherited from `consilium-tribunus` verbatim (Tiberius Vigil, patrol discipline, the twelve-task trauma). The backend variant doesn't replace the base persona — it extends it. The tribunus identity remains.

2. **Backend Doctrine section** (new, ~30-40 lines). Contains:
   - **Canonical truth surfaces for divinipress-backend:** `src/modules/` (data + service), `src/workflows/` (orchestration + compensation), `src/api/` (HTTP routes), `src/subscribers/` (event reactions). Every backend review starts with "which of these directories does this change touch."
   - **Layering law (baked in, six rules):** routes call workflows; multi-step mutations live in workflow steps with compensation; raw SQL (`db.raw`) is forbidden outside workflow steps; `query.graph()` for graph reads, `query.index()` for filtered link reads; subscribers delegate business mutations to workflows; `link.create()` inside workflow steps only.
   - **Required first actions on every dispatch:** (a) invoke `Skill(skill: "medusa-dev:building-with-medusa")`, (b) Read `skills/references/medusa-backend-gotchas.md` to load the manifest, (c) write the intake-pass paragraph (one paragraph: which Medusa layers this task touches, which `building-with-medusa` sections apply, which MCP questions need answering before acting).
   - **Failure behavior:** if the skill load errors or the manifest is unreachable, halt and surface the failure to the dispatcher. Do NOT proceed Medusa-blind — a tribunus-back that cannot load its knowledge is worse than no tribunus-back at all. (This is the hard-halt the Consul's v2 degraded-mode clause should have been.)

3. **Manifest execution section** (new, ~15-20 lines). Describes how tribunus-back uses the manifest:
   - For each rule relevant to the files under review (keyed off directory touched), execute the grep signal + absence check via Bash.
   - When the signal hits but the absence check confirms the anti-pattern, record a finding in Codex format with the rule's severity.
   - When the signal hits and the absence check does not confirm (the correlate is present), record SOUND for that rule.
   - When the rule's signal is inherently MCP-question-based (R10 idempotency check), ask the MCP question and incorporate the answer into the finding's Chain of Evidence.
   - Severity upgrade rule: money-path endpoints (payouts, refunds, commissions, anything moving money) upgrade CONCERNs to GAPs per the manifest's runtime-upgrade note.

4. **Reporting format section.** Codex format per `skills/references/verification/protocol.md`. MISUNDERSTANDING halts escalation. GAP auto-feeds back. CONCERN advisory. SOUND confirmed with reasoning.

5. **Dispatch modes** (brief note, ~10 lines):
   - **Mid-plan (Legatus-dispatched):** receives an implementer-prompt-style brief naming the task just completed. Scopes manifest execution to the diff of that task.
   - **Standalone (Imperator-dispatched via Agent tool):** receives a target path (PR directory, branch, commit range). Scopes manifest execution to that target. Outputs a full audit report.

**Important:** This spec does NOT wire Legion/March to auto-dispatch tribunus-back on backend mini-checkit. That wiring is Session 2 (along with the full specialization suite). For Session 1, dispatch is explicit: the Imperator or Consul names `subagent_type: "consilium-tribunus-back"` when invoking the Agent tool. Session 2 adds the auto-routing.

## First Use — Acceptance Test (not a deliverable, an outcome)

After Deliverables 1 and 2 land, the Imperator (or the Consul on the Imperator's behalf) dispatches `consilium-tribunus-back` against `/Users/milovan/projects/worktrees/divinipress-backend/feature/referral-program-v1/`.

**Success criteria:**

1. Tribunus-back successfully loads the manifest and the Medusa skill (no halt).
2. The returned findings include at least the six anti-patterns from the original Codex audit (the referral checklist candidate at `divinipress-backend/.../followups/...checklist-candidate.md`).
3. The returned findings include at least three of the six scout-identified gaps (subscribers mutating directly, `link.create` outside steps, missing idempotency on money-ops, event payload drift, tx atomicity, `query.graph` N+1) — a conservative bar since some may not be present in this specific PR.
4. Zero false MISUNDERSTANDINGs (per Codex, that classification is reserved for genuine domain-mental-model failures and misfires are expensive).
5. Findings carry proper Chain of Evidence citations (file:line references, Medusa doc or MCP citations in the Why field).

**If any criterion fails:** refine the relevant rule in the manifest or the doctrine section in tribunus-back, re-dispatch, iterate. This is expected — v1 of both artifacts is provisional. Session 1 closes when tribunus-back successfully audits PR #28.

**Output artifact of the acceptance test:** a findings report at `divinipress-backend/feature/referral-program-v1/docs/consilium/followups/2026-04-21-tribunus-back-audit-v1.md`, committed to the backend worktree (explicit `git -C <worktree-path> add <specific-file> && git commit`), not pushed. Colocated with the original Codex checklist for easy comparison.

## Dependencies and Sequencing

| Deliverable | Depends on | Parallelizable with |
|-|-|-|
| 1. Manifest | Nothing | 2 (partially — tribunus-back's Manifest Execution section references the rule template, so Deliverable 1's template must be drafted first, but both agent body and manifest content can be written in parallel after that) |
| 2. Tribunus-back agent | 1 (references the manifest) | — |
| Acceptance test | 1 and 2 | — |

One march pass. Pass order: draft Deliverable 1 template → draft Deliverable 2 body → fill Deliverable 1 rule content → dispatch for acceptance test.

## Open Decisions the Imperator Must Make Before Execution

1. **Acceptance-test acceptance criteria calibration.** The spec requires tribunus-back to catch at least six Codex-audit findings and three scout-identified gaps. Alternative: stricter (catch all six Codex + all six scout), lenient (catch four Codex + any one scout). Consul recommendation: the six+three bar is a conservative floor that proves the pattern without requiring perfection v1 doesn't deserve.

2. **Acceptance-test dispatch mechanism.** Spec assumes the Imperator (or the Consul on his behalf, via Agent tool from the main Consilium session) dispatches tribunus-back with `subagent_type: "consilium-tribunus-back"`. No other wiring. Alternative: write a small dispatch helper to shell out of the main session into a fresh tribunus-back Agent invocation with a templated prompt. Consul recommendation: direct Agent-tool dispatch in Session 1; templatize in Session 2 when the full suite exists.

## Prerequisites to Start

- Imperator review of this v3 spec — approve, or direct revisions
- Answers to Decisions #1 and #2 above

## Expected Artifacts After Session 1

- 1 new reference file at `skills/references/medusa-backend-gotchas.md` (12 rules, compound-signal template, severity per Codex)
- 1 new agent file at `~/.claude/agents/consilium-tribunus-back.md` (extends generic tribunus persona + backend doctrine + manifest execution + required skill load)
- 1 findings report at `divinipress-backend/feature/referral-program-v1/docs/consilium/followups/2026-04-21-tribunus-back-audit-v1.md` (the acceptance test output)
- Consilium-repo commit: manifest added + (Consilium's own `docs/consilium/specs/` and `docs/consilium/plans/` updated with this spec + the plan that edicts produces). Unpushed.
- Backend-worktree commit: findings report added. Unpushed.
- No plugin cache sync needed (new reference file, not an edited skill; new agent file is user-scope)

## What Session 1 Does NOT Do

- Does not create any other specialist verifier (censor-back, praetor-back, provocator-back) — Session 2
- Does not create soldier-back, scout-back, or any implementer — Session 2
- Does not update Consul / Edicts / Legion / March for auto-dispatch — Session 2
- Does not add a hook — deferred to Session 2 for re-evaluation; may not be necessary once specialized verifiers exist
- Does not add a Consul HARD-GATE for upstream skill loading — Session 2's specialized Censor catches spec-phase Medusa issues where the HARD-GATE would have caught them
- Does not modify any existing generic verifier (censor, praetor, provocator, tribunus) — they remain unchanged
- Does not modify `skills/audit/SKILL.md` — that skill is orthogonal to the Consilium verification engine (v1 error, v2 correction)
- Does not push any commits

## Review Instructions for the Imperator

Read the Revision Note first to confirm the scope reframe reads correctly. Then read the two deliverable sections. Flag:
- Any deliverable whose scope you want tightened or expanded
- Disagreement on the compound-signal template for the manifest (grep + absence check + MCP question)
- Disagreement on the severity changes (R10 → GAP)
- Disagreement on the tribunus-back required first actions (skill load + manifest read + intake-pass paragraph)
- Disagreement on the failure behavior (hard halt if skill load fails, no degraded mode)
- Disagreement on the acceptance-test criteria (6 Codex + 3 scout as the floor)

Once approved, the v3 spec dispatches Censor + Provocator a third time for verification on the narrowed scope, then `/edicts` produces the plan, then `/march` executes.
