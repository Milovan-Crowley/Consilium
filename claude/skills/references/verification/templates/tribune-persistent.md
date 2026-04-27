# Tribune Persistent-Executor Template

The Legatus invokes this template inside `/legion` to (a) spawn the persistent Tribunus-executor at Legion start, (b) signal task completions via `SendMessage`, (c) handle the 15-task lifetime restart, and (d) fall back to ephemeral Patrol stance per `templates/mini-checkit.md` when persistence degrades.

## Pre-spawn Conditions

- Plan exists at `<case>/plan.md`.
- `tribune-protocol.md` exists at `<case>/tribune-protocol.md` (written by `/edicts` Tribunus-design dispatch).
- Operator-side restart of the principales MCP has occurred since the last prompt-file change (verifiable by attempting a sample `verify_lane` call; if it returns "lane not found" for an execution-family lane, the MCP needs restart and the Legatus should halt and surface this).

## Spawn the Persistent Tribunus-Executor

Spawn at Legion start, BEFORE the first soldier dispatch. Naming convention: `tribune-w1` for the first window, `tribune-w2` for the second, etc.

The `Agent({...})` notation below is illustrative shorthand for the actual subagent-dispatch tool available in the runtime (e.g., `Task` or whichever primitive Claude Code exposes). The Legatus invokes the runtime's actual tool with the named parameters shown — particularly `name:` for `SendMessage` addressability. If the runtime's primitive uses different parameter names (e.g., `agent_name` instead of `name`), substitute accordingly; the load-bearing requirement is that the agent is named such that subsequent `SendMessage({to: <name>})` calls reach the same persistent process.

```
Agent({
  description: "Tribunus persistent-executor — window 1",
  subagent_type: "consilium-tribunus",
  name: "tribune-w1",  // makes addressable via SendMessage({to: "tribune-w1"})
  prompt: <see body below>
})
```

The `name` parameter is the harness primitive that makes the agent addressable while running. Documented in the Agent tool's `name` parameter. Confirmed via Imperator-demonstrated transcript: persistent named-agent dispatch, full context across turns, addressable by name or ID, occasional messages keep the agent warm.

**Pre-spawn smoke check.** Before the spawn, the Legatus performs a minimal smoke test: dispatch one ephemeral subagent with `name: "tribune-smoke"` and immediately `SendMessage({to: "tribune-smoke"})`. If the SendMessage succeeds and returns a reply within 30 seconds, persistence is confirmed at the harness level. If it fails (parameter rejected, agent not addressable, no reply within timeout), halt and surface the failure mode to the Imperator before proceeding — fall back to ephemeral Patrol per `templates/mini-checkit.md` for the entire legion. This protects against the load-bearing-primitive failure that B-1 specifically risks.

## Spawn Prompt Body

```
You are dispatched in PERSISTENT-EXECUTOR STANCE.

Read the Consilium Codex (your system prompt carries it). Read the Tribune Log Schema at:
  /Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md

Read the verified protocol at:
  <CASE DIR>/tribune-protocol.md

If <CASE DIR>/tribune-log.md exists (prior window's log), read it as digest — note the prior interface_summary entries, prior verdicts, and `token_budget_at_boundary` from the last window. If it does not exist (first window), prepare to author it fresh with `schema_version: 1`, `plan_id` from the protocol, and `window_id: w1`.

Your window covers tasks <START_INDEX> through <END_INDEX> of the plan (15-task default; ±2 ergonomic if the plan ends within the boundary). Hold the protocol and the log digest in context across the window.

Per task, the Legatus will SendMessage you with:
  - task_id: <plan task identifier>
  - change_set: <files touched>
  - implementation_summary: <one paragraph>
  - sampled: true | false  (every 3rd task by plan-index)

When sampled=true:
  1. Run Claude-side patrol on Kimi-covered surfaces FIRST — before dispatching lanes. Capture the counterfactual verdict (PASS/CONCERN/FAIL) and findings. This counterfactual is uncontaminated by docket exposure.

When sampled=false (skip the counterfactual step):

For all tasks (sampled or not):
  2. Read the protocol's `tasks[].lanes_triggered`, `claims_per_lane`, `evidence_sources_per_lane`, and `model_profile_per_lane` for this task_id.
  3. Preload the evidence bundle per lane:
     - Diff slices from `git diff` over the change_set.
     - File-content slices for full-file context where the protocol names them.
     - Doctrine excerpts from the paths in evidence_sources_per_lane (read directly).
     - Prior-task interface summaries from the appended tribune-log.md entries.
  4. Dispatch each lane via `mcp__consilium-principales__verify_lane` with the protocol's claims, the assembled evidence_bundle, the named profile, and thinking_allowed=false.
  5. Run Claude-side patrol on surfaces NOT covered by Kimi:
     - `{} as Type` cast laundering and `any`-types-hiding-behind-correct-interfaces via Serena symbol tools (every task — non-negotiable per spec §7.2).
     - Any deviations the Kimi lanes flagged that require Deviation-as-Improvement judgment.
  6. Apply the Codex's Deviation-as-Improvement Rule: when a lane flags a deviation, decide improvement (SOUND-with-note) or drift (FAIL-with-note).
  7. Compute the integrated verdict: PASS / CONCERN / FAIL.
  8. Append an entry to <CASE DIR>/tribune-log.md per the schema, including kimi_dockets, claude_side_findings, deviation_as_improvement_notes, final_chain_of_evidence, cost_usd_kimi (sum of fired-lane docket cost_usd), and interface_summary (added/modified/removed function signatures from the diff). On sampled tasks, also write the counterfactual block.
  9. Reply to the Legatus's SendMessage with: verdict (PASS/CONCERN/FAIL), brief findings summary, and one-line chain of evidence per major finding.

Substrate degradation handling:
  - If `verify_lane` returns `refused` (substrate session-budget breach), `transport_failure`, or any synthetic-failure docket: log the failure in claude_side_findings, fall back to Claude-side patrol on the affected lane's surface, and continue. Do not retry within this task.
  - If transport failures persist across multiple consecutive tasks: report to the Legatus with verdict CONCERN and recommend halt-and-escalate.

15-task boundary handling:
  - When the Legatus sends "WINDOW_COMPLETE" with the final task_id of your window:
    - Write the final task entry as normal.
    - Append `token_budget_at_boundary: <your observed input-token usage>` to the final entry.
    - Acknowledge with "WINDOW_CLOSED window_id=<your window_id>".
    - Terminate. The Legatus will spawn the next window's Tribunus.

Reply rules:
  - Always reply to a SendMessage with a structured response: verdict + findings.
  - Never volunteer architectural opinions. Patrol depth.
  - Never write to plan.md, spec.md, or any file outside <CASE DIR>/tribune-log.md and the case-relative protocol references.
```

## Per-Task Signaling (after each soldier completes)

After each soldier reports DONE or DONE_WITH_CONCERNS, the Legatus signals the active Tribunus-executor:

```
SendMessage({
  to: "tribune-w<N>",  // current window
  message: <see body below>
})
```

### SendMessage Body

```
Task complete: <task_id>
Change set: <list of files touched>
Implementation summary: <one paragraph from soldier's DONE report>
Sampled: <true if (plan_index of this task) mod 3 == 0, else false>

Verify and reply.
```

The Tribunus-executor responds with the integrated verdict. The Legatus handles findings per the Codex (PASS → next task; CONCERN → note for Campaign review; FAIL → fix-soldier dispatch + re-verify; MISUNDERSTANDING-tagged FAIL → halt + escalate).

## 15-Task Boundary Restart

When the current window's task count reaches 15 (or 16-17 if within the ±2 ergonomic window AND the plan ends within those tasks):

1. Send the final-task signal as usual.
2. After the verdict, send "WINDOW_COMPLETE" to close the window:
   ```
   SendMessage({
     to: "tribune-w<N>",
     message: "WINDOW_COMPLETE — final task was <task_id>. Write token_budget_at_boundary and terminate."
   })
   ```
3. Wait for "WINDOW_CLOSED window_id=w<N>" acknowledgment.
4. Spawn the next window's Tribunus-executor with name `tribune-w<N+1>` using the same spawn template (the new instance reads the appended tribune-log.md at startup to get prior interface summaries).

## Crash Recovery

If a SendMessage to `tribune-w<N>` returns an error indicating the agent has terminated unexpectedly mid-window:

1. Do NOT attempt a second SendMessage to the same name.
2. Spawn a fresh Tribunus-executor with name `tribune-w<N>-recover` (preserve the window number; suffix denotes recovery).
3. The new instance reads the protocol and the appended tribune-log.md (including prior entries from the crashed window).
4. Re-send the most recent task signal that did NOT receive a verdict.
5. Continue normally. Loss is the in-window context the crashed instance held; bounded and acceptable.

## Persistence-Disabled Fallback (operator config)

If the operator has disabled persistence for any reason (B-1 does not specify a config flag — when added in B-2, this section will be amended), or if the spawn itself fails repeatedly, the Legatus falls back to ephemeral Patrol stance per `templates/mini-checkit.md` for the remainder of the legion. The fallback is logged in the campaign report's preamble.

## Independence Boundary at Campaign Review

The post-execution Campaign Review (Censor + Praetor + Provocator) does NOT receive `tribune-log.md`. Construct the Campaign Review dispatch prompts WITHOUT referencing the persistent-executor's per-task verdicts. The Campaign verifiers read the implementation, the spec, the plan, and the doctrine. Per Codex Independence Rule.
