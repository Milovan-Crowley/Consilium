# Tribune Protocol Schema

The `tribune-protocol.md` artifact lives at `$CONSILIUM_DOCS/cases/<slug>/tribune-protocol.md`. It is written by Tribunus-design after the plan is verified and Custos-blessed; it is consumed by Tribunus-executor at Legion start.

The protocol is structured markdown, parseable by Tribunus-executor. Per task, the protocol specifies which lanes fire, what claims to verify per lane, what evidence sources to preload, what model profile to use per lane, and free-text executor notes.

## Schema (v1)

```yaml
schema_version: 1
plan_id: <case>/plan.md commit-or-hash
sampling_mode: every-3rd-task-by-plan-index  # determines counterfactual cadence
tasks:
  - task_id: <plan task identifier>
    lanes_triggered: [task-plan-match, task-domain-correctness, ...]  # subset of the four execution lanes
    claims_per_lane:
      task-plan-match: ["claim text 1", "claim text 2"]
      task-domain-correctness: [...]
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "<plan.md>#task-N"}
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "doctrine", path: "<doctrine excerpt path>"}
        - ...
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-domain-correctness: false
    executor_notes: "task touches money path; additional scrutiny on idempotency"
```

## Field Definitions

- **`schema_version`** — currently `1`. Bumps on incompatible changes.
- **`plan_id`** — case-relative path to `plan.md` plus the git SHA at which the protocol was authored. Detects post-protocol plan drift.
- **`sampling_mode`** — counterfactual cadence. v1 supports `every-3rd-task-by-plan-index`; future modes may expand. Sampling computed against plan position, not window position. Boundary continuity: a 15-task window restart does not shift the sampling sequence.
- **`tasks[].task_id`** — plan task identifier (e.g., `task-3`).
- **`tasks[].lanes_triggered`** — subset of `[task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]`. Tribunus-design selects per-task; the empty list means no Kimi dispatch (Tribunus-executor falls back to Claude-side patrol only).
- **`tasks[].claims_per_lane`** — per-lane claim list. Empty for any lane not in `lanes_triggered`.
- **`tasks[].evidence_sources_per_lane`** — per-lane evidence type list. `<runtime>` markers indicate sources Tribunus-executor populates at task time (the diff is generated from `git diff` at task completion).
- **`tasks[].model_profile_per_lane`** — `principalis_light` or `principalis_adversarial` per lane. Must match the `default_profile` in `claude/skills/references/verification/lanes.md` for that lane unless the spec authorizes deviation.
- **`tasks[].thinking_allowed_per_lane`** — `true` or `false` per lane. B-1 substrate ships `CONSILIUM_KIMI_DISABLE_THINKING=true` by default, so this is `false` for all execution lanes in B-1.
- **`tasks[].executor_notes`** — free-text guidance from Tribunus-design to Tribunus-executor. v1 is unstructured; Tribunus-design SHOULD use structured-discriminator-style notes (e.g., `domain-surface: money_path`, `additional-scrutiny: idempotency`) when applicable to enable later schema upgrade.

## Authoring Discipline (Tribunus-design)

- **Read the plan with fresh context.** Tribunus-design does NOT inherit the Consul's deliberation context. The plan and the doctrine are the inputs.
- **Subset selection.** Not every task fires every lane. A task that touches no domain doctrine surface skips `task-domain-correctness`. A task that does not interface with prior tasks skips `task-integration-prior`. Default subset for any task: `[task-plan-match, task-no-stubs]`. Tribunus-design adds the adversarial lanes per evidence.
- **Evidence preload paths.** When `task-domain-correctness` is selected, name the doctrine file path explicitly. **Path discipline (load-bearing):** doctrine paths MUST start with the literal token `$CONSILIUM_DOCS/doctrine/` followed by a filename that exists on disk at protocol-write time. Tribunus-design MUST verify path existence (e.g., via `Read` tool against the absolute resolved path) before committing the path to the protocol. A path that fails to resolve is a Tribunus-design BLOCKER, not a runtime fall-through. Common failures to avoid: relative paths (`medusa-workflow.md`), `~/projects/...` paths (doctrine does not live in the repo root; it lives at `$CONSILIUM_DOCS`), made-up filenames (verify the file exists). Plan task 1 of any window has no prior interface evidence; if `task-integration-prior` is selected for plan-task-1, document this as the empty-log case in `evidence_sources_per_lane` so the executor knows to expect zero entries and route the lane finding to `unverified_claims`.
- **Profile match.** Profile assignment in the protocol MUST match the registry default unless the spec explicitly authorized deviation.

## Consumption Discipline (Tribunus-executor)

- **Read at spawn.** Tribunus-executor reads the protocol once at Legion start and holds it in context across the 15-task lifetime window.
- **Lane subset enforcement.** Dispatch only the lanes named in `lanes_triggered` for that task. Do not improvise additional lanes.
- **Evidence bundle assembly.** For each lane, assemble the evidence bundle from the `evidence_sources_per_lane` paths. `<runtime>` sources (the diff) are populated from `git diff` at task time.
- **Profile honored.** Send the lane to `verify_lane` with `profile_override` matching `model_profile_per_lane`.

## Invalidation

`tribune-protocol.md` is invalidated when:
- Custos returns `PATCH BEFORE DISPATCH` and the patches modify task structure (additions, removals, reordering). `/edicts` re-dispatches Tribunus-design after the second Custos walk.
- The Imperator edits the plan after Tribunus-design ran but before Legion start. The `plan_id` SHA mismatch is detected at Legion start; Tribunus-executor halts and signals re-design.
