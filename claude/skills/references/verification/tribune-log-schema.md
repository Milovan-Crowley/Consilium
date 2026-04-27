# Tribune Log Schema

The `tribune-log.md` artifact lives at `$CONSILIUM_DOCS/cases/<slug>/tribune-log.md`. It is written by Tribunus-executor as it processes tasks during Legion execution. Append-only. Schema-strict per-task entries.

## Schema (v1)

```yaml
schema_version: 1
plan_id: <plan_id from protocol>
window_id: w1, w2, ...  # which Tribunus-executor instance authored this slice
entries:
  - task_id: <id>
    window_id: w1
    verdict: PASS | CONCERN | FAIL
    lanes_fired: [task-plan-match, ...]
    model_profile_per_lane: {...}
    kimi_dockets: [...]  # full content per docket; or refs to docket files
    claude_side_findings: [...]  # findings from Claude-side patrol on uncovered surfaces
    deviation_as_improvement_notes: "..."  # judgment notes when applicable
    final_chain_of_evidence: "..."
    cost_usd_kimi: <number>
    counterfactual:  # populated only on sampled tasks
      verdict: PASS | CONCERN | FAIL
      findings: [...]
    interface_summary:  # for downstream task-integration-prior consumers
      added: ["function foo: (a: A) => B at file:line", ...]
      modified: [...]
      removed: [...]
    token_budget_at_boundary: <int or null>  # logged at the 15-task boundary
```

## Field Definitions

- **`schema_version`** — currently `1`.
- **`plan_id`** — copied from `tribune-protocol.md`; consistency check at append time.
- **`window_id`** — `w1`, `w2`, ... per Tribunus-executor instance. Restart at the 15-task boundary increments.
- **`entries[].task_id`** — plan task identifier; matches the protocol task_id.
- **`entries[].verdict`** — Tribunus-executor's integrated verdict. PASS = SOUND. CONCERN = soft finding for Campaign review. FAIL = GAP or MISUNDERSTANDING that halts the legion.
- **`entries[].lanes_fired`** — actual lanes dispatched (subset of protocol `lanes_triggered`; identical unless a transport failure dropped a lane).
- **`entries[].model_profile_per_lane`** — actual profiles used per lane.
- **`entries[].kimi_dockets`** — full docket content per fired lane, or filesystem refs.
- **`entries[].claude_side_findings`** — findings from Tribunus-executor's own patrol on surfaces not covered by Kimi (cast-laundering, `any`-types-hiding via Serena; deviation-as-improvement judgment integration).
- **`entries[].deviation_as_improvement_notes`** — when a lane flagged a deviation that Tribunus judged an improvement, the rationale lives here. Empty when not applicable.
- **`entries[].final_chain_of_evidence`** — the integrated chain naming whether each finding came from Kimi, Claude-side patrol, or judgment integration.
- **`entries[].cost_usd_kimi`** — sum of `cost_usd` from all fired-lane dockets.
- **`entries[].counterfactual`** — populated only on sampled tasks (every 3rd task by plan-index). Captures Claude-side patrol verdict rendered BEFORE lane dispatch on that task — uncontaminated by docket exposure. PASS/CONCERN/FAIL same vocabulary.
- **`entries[].interface_summary`** — producer side of the contract that `task-integration-prior` consumes. Tribunus-executor extracts added/modified/removed function signatures from the task diff and writes them here. Downstream tasks' `task-integration-prior` lane reads this from the appended log via the `tribune-protocol.md` evidence path.
- **`entries[].token_budget_at_boundary`** — Tribunus-executor's observed input-token usage at the 15-task boundary. Populated only on the boundary task. Used to revisit the 15-task threshold per spec §9.

## Authoring Discipline (Tribunus-executor)

- **Append-only.** No edits to prior entries. Concurrency-write is not addressed in v1 because only one Tribunus-executor instance is alive at any moment.
- **Atomic per task.** One full entry per task; no partial entries.
- **Counterfactual sequencing.** On a sampled task: Claude-side patrol runs FIRST (before lane dispatch). The counterfactual verdict is captured at that point. Then lanes dispatch. The integrated verdict is computed and logged separately.
- **Boundary atomicity.** The window-final entry includes `token_budget_at_boundary`. A new window starts a new entries section with the new `window_id`.

## Independence Rule (Campaign Review boundary)

`tribune-log.md` is written for audit and for Tribunus-executor cross-task continuity. The Legion's Campaign Review (Censor + Praetor + Provocator parallel dispatch after the last task) **MUST NOT** receive `tribune-log.md` as evidence. The Campaign Review verifiers are ephemeral and independent per the Codex; they read the implementation, the spec, the plan, and the doctrine — not Tribunus-executor's verdicts.

Overlap between Tribunus-executor's per-task findings and Campaign Review findings is independent confirmation, not duplication.
