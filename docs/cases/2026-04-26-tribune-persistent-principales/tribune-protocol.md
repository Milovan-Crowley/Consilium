# Tribune Protocol — B-1.1 Wire-Up Closure

```yaml
schema_version: 1
plan_id: session-02-b-1-1-plan.md 3a2db174b42d55e5fba7f80c0947de09d5244f79
sampling_mode: every-3rd-task-by-plan-index
tasks:
  # ---- Task 1 ---------------------------------------------------------------
  - task_id: task-1
    lanes_triggered: [task-plan-match, task-no-stubs]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly three files: claude/skills/references/verification/templates/tribune-persistent.md, claude/skills/references/verification/tribune-log-schema.md, claude/skills/legion/SKILL.md."
        - "All twelve `new_string` blocks specified by Steps 2-12 of the plan-task body appear verbatim in the diff at the lines named in the Files: section (tribune-persistent.md lines 52, 67, 68, 70, 111; tribune-log-schema.md lines 14, 23, 38, 46, 53; legion/SKILL.md line 175)."
        - "Verdict-vocabulary tokens PASS and FAIL no longer appear as standalone words (regex \\bPASS\\b|\\bFAIL\\b returns empty stdout) in the three modified files (Step 13 post-condition)."
        - "Each of the three modified files contains at least one occurrence of one of the four Codex categories SOUND/CONCERN/GAP/MISUNDERSTANDING (Step 14 post-condition)."
        - "The change lands as a single commit covering all three files (atomic-migration discipline mandated by spec §4.1; Step 15 commit and Notes-for-the-Legatus Atomic-migration paragraph)."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers were introduced in the new_string text (the substitution is a pure vocabulary swap and a single discipline-relaxation rewrite — no scaffolding)."
        - "The relaxed Atomic-per-task discipline rewrite at tribune-log-schema.md line 53 forward-references `task_start_sha` deliberately (per the inline note authorizing the transient inconsistency until Task 4 lands); this is documented intent, not a stub."
        - "The 'most-severe-wins' aggregation prose inserted at tribune-persistent.md line 68 is fully spelled out (MISUNDERSTANDING > GAP > CONCERN > SOUND with concrete fall-through prose), not gestured at."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-1"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
    executor_notes: "domain-surface: codex-vocabulary. atomic-migration: single commit covers 3 files; Step 13 grep returns empty stdout; Step 14 grep returns non-zero per file. transient-inconsistency: line 53 forward-references task_start_sha (added in Task 4); spec §4.1 row 4 authorizes."

  # ---- Task 2 ---------------------------------------------------------------
  - task_id: task-2
    lanes_triggered: [task-plan-match, task-no-stubs]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly two files: claude/skills/references/verification/tribune-protocol-schema.md and claude/skills/references/verification/templates/tribune-design.md."
        - "tribune-protocol-schema.md line 11 YAML example becomes `plan_id: <case>/plan.md <40-hex-blob-sha>  # space-separated path + blob SHA from `git rev-parse HEAD:<plan-path>`` (Step 2 new_string verbatim)."
        - "tribune-protocol-schema.md line 38 plan_id field definition replaces 'commit-or-hash' with the explicit blob-SHA contract naming `git rev-parse HEAD:<plan-path>`, the `<path> <40-hex-blob-sha>` format, and the precedent `2026-04-26-custos-edicts-wiring/decisions.md:111` (Step 3 new_string verbatim)."
        - "tribune-protocol-schema.md line 66 invalidation clause names `/legion` pre-spawn as the detection point and the response as `/legion` refusing to spawn (not Tribunus-executor halting); the prior 'Tribunus-executor halts and signals re-design' phrase is retired (Step 4 new_string verbatim; Step 6 grep returns empty stdout for both retired phrases)."
        - "tribune-design.md dispatch-prompt body now instructs blob SHA on `plan_id` authoring with the `git rev-parse HEAD:<plan-path>` formula and case-relative path discipline (Step 5 new_string verbatim; Step 7 grep matches on `blob SHA|git rev-parse HEAD:`)."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers introduced in the new_string text."
        - "The path-format prose `<path> <40-hex-blob-sha>` and command formula `git rev-parse HEAD:<plan-path>` are fully concrete (specific token format, specific git invocation), not hand-waved."
        - "The precedent citation `2026-04-26-custos-edicts-wiring/decisions.md:111` is cited verbatim — a load-bearing reference, not a placeholder."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-2"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
    executor_notes: "domain-surface: sha-discipline-contract. Verify blob-SHA-not-commit-SHA discipline preserved; verify invalidation-actor correction (legion-refuses, not executor-halts)."

  # ---- Task 3 ---------------------------------------------------------------
  - task_id: task-3
    lanes_triggered: [task-plan-match, task-no-stubs]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly two files: claude/skills/references/verification/templates/tribune-design.md and claude/skills/references/verification/templates/tribune-persistent.md."
        - "tribune-design.md gains the explicit-authorization paragraph that begins 'Empty `lanes_triggered: []` is explicitly authorized' verbatim per Step 2 new_string, with the 'Do NOT default to empty' guidance and the cross-reference to per-task scope in templates/tribune-persistent.md (Step 4 grep matches once)."
        - "tribune-persistent.md gains the 'Per-task scope: empty `lanes_triggered: []`' clause verbatim per Step 3 new_string, instructing skip of steps 3-4 and direct proceed to step 5 (Claude-side patrol) for that single task; explicitly distinguishes per-task fall-back from `/legion` pre-spawn protocol-level fall-back (Step 5 grep matches once)."
        - "Both new_string blocks preserve the surrounding context (the 'Default subset…' paragraph in tribune-design.md and the 'For all tasks (sampled or not)…' header in tribune-persistent.md) — the inserts append to existing prose, not replace it."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers introduced in the new_string text."
        - "The per-task vs protocol-level distinction is concretely articulated (which template authors what scope; which fall-back applies when), not gestured at."
        - "No new markdown headings, examples, or tables left blank or with TBD content."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-3"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
    executor_notes: "domain-surface: per-task-scope-authorization. Verify the per-task-vs-protocol-level distinction is preserved across both templates."

  # ---- Task 4 ---------------------------------------------------------------
  - task_id: task-4
    lanes_triggered: [task-plan-match, task-no-stubs, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly two files: claude/skills/references/verification/tribune-log-schema.md and claude/skills/references/verification/templates/tribune-persistent.md."
        - "tribune-log-schema.md YAML schema gains a `task_start_sha: <40-hex-commit-sha>` field positioned after `window_id` and before `verdict`, with the inline comment naming the diff range `(task_start_sha, HEAD]` (Step 2 new_string verbatim)."
        - "tribune-log-schema.md Field Definitions gains the `entries[].task_start_sha` definition immediately after `entries[].task_id`, declaring it Required, naming `git rev-parse HEAD` at SendMessage emission as the capture point, and specifying the fix-soldier-re-dispatch second-entry semantics (Step 3 new_string verbatim; Step 7 grep returns at least 2 matches)."
        - "tribune-persistent.md diff-slice instruction in step 3 of the executor's Per Task algorithm replaces bare `git diff` with the pseudo-command `git diff <task_start_sha>..HEAD -- <change_set>`, declares bare git diff 'not permitted', and specifies the `change_set: []` no-op short-circuit (Step 4 new_string verbatim)."
        - "tribune-persistent.md interface_summary instruction (step 8) now uses the same `(task_start_sha, HEAD]` over `change_set` convention, never bare git diff (Step 5 new_string verbatim; Step 8 grep returns empty stdout for both retired bare-diff phrases)."
        - "tribune-persistent.md SendMessage Body block adds `Task start SHA:` line, expands `Change set:` with empty-list-permitted/absent-malformed semantics, and follows the YAML fence with three discipline blocks: Required field discipline, Fix-soldier re-dispatch, Fix-soldier failure modes (Step 6 new_string verbatim)."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers introduced in the new_string text."
        - "The pseudo-command `git diff <task_start_sha>..HEAD -- <change_set>` is fully formed (placeholders match field names; not a hand-wave)."
        - "The two specified failure modes (mid-dispatch crash, zero-commit DONE) each carry a concrete handler verdict_summary string, not 'TBD' or 'see future spec'."
      task-integration-prior:
        - "Task 4 Step 2's `old_string` block contains the Codex-vocabulary `verdict: SOUND | CONCERN | GAP | MISUNDERSTANDING` line — a contract introduced by Task 1 Step 7. The diff's pre-Edit state must show this line existing at tribune-log-schema.md line 14 (post-Task-1) for Step 2 to apply cleanly."
        - "Task 4's SendMessage Body discipline aligns with Task 1's verdict-vocabulary contract: malformed-body responses use `verdict: GAP` (a Codex category) and the no-op short-circuit uses `verdict: SOUND` — both consistent with the four-category aggregation Task 1 Step 4 introduced."
        - "The schema's 'One entry per Soldier-dispatch' discipline (Task 1 Step 11) is the contract Task 4 Step 3's `task_start_sha` field-definition refers to when describing fix-soldier re-dispatch second-entry semantics; the cross-reference is internally consistent."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-4"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface-summary", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-integration-prior: false
    executor_notes: "domain-surface: sendmessage-body-contract + diff-range-semantics. integration-prior: depends on Task 1 Step 7 vocabulary (Codex categories in `verdict:` line) and Task 1 Step 11 'One entry per Soldier-dispatch' discipline. Sequencing: Task 1 must commit before Task 4 runs (per plan Notes-for-the-Legatus)."

  # ---- Task 5 ---------------------------------------------------------------
  - task_id: task-5
    lanes_triggered: [task-plan-match, task-no-stubs, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly one file: claude/skills/legion/SKILL.md."
        - "DONE handler paragraph is rewritten per Step 2 new_string: adds `task_start_sha` capture (`git rev-parse HEAD` at this exact moment), adds `change_set` capture (with empty-list permitted), and lists all five required SendMessage body fields (`task_id`, `task_start_sha`, `change_set`, `implementation_summary`, `sampled`) with the malformed-body verdict GAP semantics."
        - "A new 'Capture-at-emission property' paragraph immediately follows the DONE handler, declaring the property covers primary dispatch AND fix-soldier re-dispatch and forbidding cached-SHA reuse (Step 2 new_string paragraph 2 verbatim)."
        - "Fix-soldier prose ('When the Tribunus finds a GAP') is rewritten per Step 3 new_string: `git rev-parse HEAD` at fix dispatch emission, fresh `task_start_sha` (NOT the original task's), fix-as-unit verification, two log entries per fix-cycle, iteration-2-cap escalation."
        - "A new 'Fix-soldier crash and zero-commit failure modes' paragraph immediately follows the fix-soldier prose with the crash-retry semantics and the zero-commit verdict GAP semantics (Step 3 new_string paragraph 2 verbatim)."
        - "After the edits, `task_start_sha` appears on at least 4 distinct lines in legion/SKILL.md per the line-not-occurrence accounting in Step 4 (the four paragraphs the plan enumerates)."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers introduced in the new_string text."
        - "The `git rev-parse HEAD` invocation is the concrete capture command, not 'compute the SHA somehow'."
        - "The crash-retry and zero-commit failure modes carry concrete handler prose (retry per existing crash-recovery; verdict GAP with the specific verdict_summary string), not 'see future spec' or 'TBD'."
      task-integration-prior:
        - "Task 5 Step 2's `old_string` includes the Codex-vocabulary parenthetical `(SOUND/CONCERN/GAP/MISUNDERSTANDING)` introduced by Task 1 Step 12; the diff's pre-Edit state must show that parenthetical existing at legion/SKILL.md line 175 (post-Task-1) for Step 2 to apply cleanly."
        - "Task 5's SendMessage body fields list (`task_id`, `task_start_sha`, `change_set`, `implementation_summary`, `sampled`) matches Task 4's Required-field discipline block in tribune-persistent.md verbatim — same field names, same required semantics, same malformed-body verdict GAP response."
        - "Task 5's fix-soldier dispatch flow uses the same `(fix_task_start_sha, HEAD]` diff-range convention Task 4 Step 4 specified for diff slices and Task 4 Step 5 specified for interface_summary — the convention is cited consistently across both surfaces."
        - "Task 5's fix-soldier paragraph references 'two log entries land for the same task_id' — the same discipline Task 1 Step 11 introduced ('One entry per Soldier-dispatch') and Task 4 Step 3's field-definition referenced for the second-entry semantics."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-5"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface-summary", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-integration-prior: false
    executor_notes: "domain-surface: codex-auto-feed-loop + sendmessage-body-contract. integration-prior: depends on Task 1 Step 12 (Codex-vocabulary parenthetical) AND Task 4 Steps 3-6 (SendMessage body schema + diff-range convention + One-entry-per-Soldier-dispatch). Sequencing: Tasks 1 and 4 must commit before Task 5 runs."

  # ---- Task 6 ---------------------------------------------------------------
  - task_id: task-6
    lanes_triggered: [task-plan-match, task-no-stubs, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "Diff modifies exactly one file: claude/skills/legion/SKILL.md."
        - "Pre-spawn check section is rewritten per Step 2 new_string: replaces the 'If absent, halt' paragraph with the 'Pre-spawn ordered routing' section that declares the single-snapshot read-once contract (the concrete shell pattern `proto=$(cat <case>/tribune-protocol.md 2>/dev/null || echo \"\")` is named) and disclaims cross-invocation reconciliation as out-of-scope per spec §3."
        - "Four branches are spelled out in order with **bold** headers Branch 1 / Branch 2 / Branch 3 / Branch 4, each ending with a campaign-report preamble note string (Step 3 grep returns at least 5 matches for `Branch 1|Branch 2|Branch 3|Branch 4|Pre-spawn ordered routing`)."
        - "Branch 3 references SHA comparison via `git rev-parse HEAD:<recorded-path>` and explicitly enumerates the path-resolution failure classes (deletion, rename, unborn HEAD, corrupt object database, IO error, unreadable git state) that all route to refuse-to-spawn with the failure class named in the diagnostic (Step 5 grep matches on `git rev-parse HEAD:`)."
        - "A 'Smoke-check sequencing' paragraph follows Branch 4, declaring smoke runs only on branch 4 and is skipped on 1, 2, 3 (Step 6 grep matches once)."
        - "A 'Crash-recovery respawn' paragraph follows Smoke-check sequencing, clarifying that respawn does NOT re-fire pre-spawn routing — drift detection on respawn is the executor's responsibility."
        - "The prior halt-on-absent prose ('If absent, halt — the protocol must come from') is retired (Step 4 grep returns empty stdout)."
      task-no-stubs:
        - "No TODO, FIXME, XXX, or `<placeholder>` markers introduced in the new_string text."
        - "The well-formed definition (schema_version, plan_id, sampling_mode, tasks; supported schema_version values; non-empty plan_id path + 40-hex SHA; lanes_triggered list-typed) is fully enumerated, not 'see schema for full list'."
        - "The path-resolution failure-class enumeration (deletion, rename, unborn HEAD, corrupt object database, IO error, unreadable git state) is concrete and complete, not 'or other failures'."
        - "The campaign-report preamble note strings are spelled out verbatim per branch (Branch 1: 'Persistence routing: mini-checkit fallback (branch 1 — absent/empty/unparseable/non-actionable)'; Branch 2 / Branch 4 follow the same pattern), not 'note the routing decision' in the abstract."
      task-integration-prior:
        - "Task 6's Branch 3 SHA-comparison logic is the runtime implementation of the blob-SHA contract Task 2 Step 3 introduced into tribune-protocol-schema.md — it computes `git rev-parse HEAD:<recorded-path>` against the recorded blob SHA in `plan_id`, matching the exact format Task 2 specified (`<path> <40-hex-blob-sha>`)."
        - "Task 6's Branch 3 invalidation-response prose ('refuse to spawn the persistent executor; surface the diff (or pointer to it)... append a `decisions.md` entry of type `verdict`') aligns with Task 2 Step 4's invalidation-clause correction (the response is `/legion` refusing to spawn, not Tribunus-executor halting)."
        - "Task 6's Branch 1 `tasks: []` route is the protocol-level cousin of Task 3's per-task `lanes_triggered: []` authorization — they are distinct decision points (one fires per task on the executor; one fires once at pre-spawn for the whole campaign), and Task 6's Branch 1 prose explicitly notes this distinction by routing the entire legion to mini-checkit when `tasks: []` is observed."
        - "The 4-branch routing's all-or-nothing partition for malformed protocols (Branch 2's 'any single tasks entry missing task_id or lanes_triggered… makes the entire protocol malformed') is consistent with Task 3's per-task scope authorization — the per-task scope clause permits empty `lanes_triggered: []` (well-formed null-set) but not absent `lanes_triggered` (malformed); Task 6 enforces that contract at the legion level."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "session-02-b-1-1-plan.md#task-6"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface-summary", path: "<runtime>"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-integration-prior: false
    executor_notes: "domain-surface: pre-spawn-routing-contract + sha-discipline-runtime. integration-prior: depends on Task 2 (blob-SHA contract + invalidation-actor correction) AND Task 3 (lanes_triggered: [] authorization at per-task scope, mirrored at protocol-level by Branch 1 tasks: [] route). Sequencing: Tasks 2 and 3 must commit before Task 6 runs."
```

## Authoring Notes

**Domain-correctness lane absence — by design.** No task fires `task-domain-correctness`. The schema's path discipline (load-bearing) requires doctrine evidence paths to start with the literal token `$CONSILIUM_DOCS/doctrine/` followed by an existing filename. The plan operates on the verification system itself, whose canonical contract (the Codex categories, the SHA discipline, the wire-shape) lives at `$CONSILIUM_DOCS/codex.md` — NOT under `$CONSILIUM_DOCS/doctrine/`. The `doctrine/` tree carries Medusa/Divinipress-store domain content, none of which cross-checks vocabulary unification or wire-shape contract revisions. Firing `task-domain-correctness` with a fabricated doctrine path would violate the schema's path discipline; firing it with a non-doctrine-tree path (e.g., `$CONSILIUM_DOCS/codex.md`) would also violate the discipline. The correct decision per schema is to skip the lane on every task in this plan. The cross-task consistency that would otherwise have been a domain-correctness check is folded into `task-integration-prior` for tasks 4-6, which evaluates whether each task's contract matches the prior tasks' contracts (Task 1's vocabulary, Task 2's SHA contract, Task 3's per-task scope, Task 4's wire-shape).

**Integration-prior preload semantics.** `task-integration-prior` evidence is sourced from the appended `tribune-log.md` `interface_summary` entries at runtime — `<runtime>` markers in `evidence_sources_per_lane`. Tasks 4, 5, and 6 each depend on prior tasks' surfaces, so the persistent executor will preload the prior-task interface summaries before dispatching. Task 1, Task 2, and Task 3 do not fire `task-integration-prior` because they introduce contracts; they do not depend on prior contracts.

**Profile assignment.** All `task-plan-match` and `task-no-stubs` lanes use `principalis_light` (the registry default); all `task-integration-prior` lanes use `principalis_adversarial` (the registry default). No deviation. `thinking_allowed_per_lane: false` on every lane (B-1 substrate ships `CONSILIUM_KIMI_DISABLE_THINKING=true`).

**Sampling.** `every-3rd-task-by-plan-index` makes Task 3 and Task 6 the sampled tasks (3 mod 3 = 0; 6 mod 3 = 0). On those tasks, the persistent executor runs Claude-side patrol FIRST (uncontaminated by docket exposure) and logs the counterfactual verdict separately per the schema.

**Plan-id format.** `session-02-b-1-1-plan.md 3a2db174b42d55e5fba7f80c0947de09d5244f79` — case-relative path + blob SHA from `git rev-parse HEAD:docs/cases/2026-04-26-tribune-persistent-principales/session-02-b-1-1-plan.md` at protocol-write time. Blob SHA per the established Custos precedent at `2026-04-26-custos-edicts-wiring/decisions.md:111`. (Note: B-1.1 Task 2 will pin the schema doc itself to mandate blob SHA; this protocol authoring uses blob SHA per precedent in advance of Task 2's commit.)
