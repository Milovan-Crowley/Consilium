# Tribune-Design Dispatch Template

The Consul invokes this template inside `/edicts` after the Custos walk returns OK TO MARCH (or after Imperator override of BLOCKER). It dispatches one Tribunus subagent in **design stance** to author `tribune-protocol.md` from the verified, Custos-blessed plan.

## Pre-dispatch Conditions

All five conditions from the Custos dispatch contract must hold (no MISUNDERSTANDING in escalation, no unresolved GAPs, all CONCERNs explicitly handled, no silent plan modifications since plan verification, Imperator overrides recorded). The plan is committed.

## Dispatch Shape

The `Agent({...})` notation below is illustrative shorthand for the actual subagent-dispatch tool available in the runtime (e.g., `Task` or whichever primitive Claude Code exposes for subagent spawning at execution time). The dispatching consul invokes the runtime's actual tool with the named parameters shown — particularly `subagent_type` for persona selection.

```
Agent({
  description: "Tribunus design — author tribune-protocol.md",
  subagent_type: "consilium-tribunus",
  prompt: <below>
})
```

## Dispatch Prompt Body

Stance: **design** (declared in prompt, per persona Stance Selection block).

```
You are dispatched in DESIGN STANCE.

Read the Consilium Codex (your system prompt carries it). Read the Tribune Protocol Schema at:
  /Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md

You will read a verified, Custos-blessed plan at:
  <PLAN PATH — substituted by /edicts at dispatch time>

You will write tribune-protocol.md at:
  <CASE DIR>/tribune-protocol.md

Your task:

1. Read the plan with fresh context. You do NOT inherit the Consul's deliberation context. The plan and the doctrine are your inputs.

2. For each task in the plan, decide which execution-family lanes should fire. The four available lanes:
   - task-plan-match (principalis_light, evidence: plan-task-body + diff)
   - task-no-stubs (principalis_light, evidence: diff)
   - task-domain-correctness (principalis_adversarial, evidence: diff + doctrine)
   - task-integration-prior (principalis_adversarial, evidence: diff + prior interfaces)

   Default subset for any task: [task-plan-match, task-no-stubs]. Add task-domain-correctness when the task touches a domain-doctrine surface (Medusa workflow boundary, link.create, money path, frontend hard rule). Add task-integration-prior when the task interfaces with prior-task interfaces.

3. For each lane fired on a task:
   - Write 2-6 specific claims (under the lane's `max_claims_per_bundle`).
   - List evidence sources by type and path (e.g., `{type: "plan-task-body", path: "<plan.md>#task-N"}`, `{type: "doctrine", path: "$CONSILIUM_DOCS/doctrine/medusa-workflow.md"}`).
   - Set model_profile_per_lane to the registry default (principalis_light or principalis_adversarial). Do NOT deviate.
   - Set thinking_allowed_per_lane to false (B-1 substrate default).

4. Set sampling_mode to "every-3rd-task-by-plan-index" (B-1 default).

5. Add executor_notes per task when the task has a domain-surface flag (e.g., "task touches money path; additional scrutiny on idempotency").

6. Write the protocol to <CASE DIR>/tribune-protocol.md per the schema. The `plan_id` field MUST be authored as `<case-relative-path-to-plan.md> <40-hex-blob-sha>` (space-separated). Compute the blob SHA via `git rev-parse HEAD:<plan-path>` at the moment of authoring. Blob SHA, not commit SHA — blob SHA is stable across unrelated commits and detects only meaningful plan changes (precedent: `2026-04-26-custos-edicts-wiring/decisions.md:111`). The path must be case-relative (e.g., `plan.md` if authoring inside the case folder, or `<case-slug>/plan.md` if authored from the repo root context — match how `/legion` will resolve the path against the case folder at pre-spawn).

7. Report back to the Consul one of:
   - DESIGN_COMPLETE — protocol written; brief summary of lane assignments.
   - DESIGN_BLOCKED — plan has a gap that prevents protocol authoring (e.g., a task body too vague to claim-extract); name the gap.

Do not modify the plan. Do not modify the spec. Do not dispatch verify_lane. You are an authoring stance, not an executing stance.
```

## Re-dispatch Triggers

Tribunus-design re-runs in two cases:
- Custos returns PATCH BEFORE DISPATCH on a structural patch (task additions, removals, reordering). The first run's `tribune-protocol.md` is invalidated and re-written.
- The Imperator edits the plan after Tribunus-design ran but before Legion start. Detected at Legion start via `plan_id` SHA mismatch — the Legion announces the mismatch and returns the case to `/edicts` for re-design.

## Failure Handling

- **DESIGN_BLOCKED return:** the Consul surfaces the blocker to the Imperator and routes back to plan revision (treated as exhausted CONCERN at the Custos boundary; counts toward the auto-feed cap).
- **Subagent crash / non-return:** announce the failure to the Imperator. Re-dispatch once. If the second dispatch also fails, escalate.
