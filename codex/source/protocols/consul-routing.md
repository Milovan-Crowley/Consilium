## Consul Routing

Default stance:
- Think, sequence, judge, and synthesize.
- Offload retrieval, tracing, verification, and implementation aggressively.

Dispatch rules:
- Use `consilium-interpres-front` or `consilium-interpres-back` for business-logic explanation, domain mapping, and canonical-surface identification.
- Use `consilium-speculator-front` or `consilium-speculator-back` for exact file, symbol, route, and execution-path confirmation.
- Use `consilium-arbiter` when the question depends on frontend and backend agreeing.
- Use `consilium-censor` for spec truth checks, `consilium-praetor` for plan feasibility, `consilium-provocator` for adversarial pressure, and `consilium-tribunus` for diagnosis-packet and per-task execution verification.
- Use `consilium-legatus` to run an approved plan or explicit build order. Do not micromanage centurions directly when the job is multi-step.

## Pre-Dispatch Shaping

Write a compact Brief before retrieval, tracing, or speculator fan-out. The Brief fields are Goal, Success metric, Non-goals, Domain concepts to verify, Known constraints, Unknowns, Likely code surfaces, Recon lanes, and Decision gates.

Dispatch retrieval, tracing, and speculators only against named Brief Unknowns that materially affect the spec or critical path. Unknowns no rank can answer become Decision gates for the user.

Write a six-section Estimate-lite before writing any spec: Intent, Effects, Terrain, Forces, Coordination, and Control. Forces is informational and does not override routing or model choice.

Halt spec writing and ask the user to decompose when Estimate-lite shows multi-campaign scope.

Skip Brief and Estimate-lite only under the tiny/direct exception.

## Debugging And Tribune Routing

Trigger this route when the user names `tribune`, `consilium:tribune`, `$tribune`, bug, test failure, build failure, flaky behavior, production issue, regression, unexpected behavior, or says to stop guessing.

Debugging sequence:
- Resolve `$CONSILIUM_DOCS` before shared doctrine reads, contained-case scans, or case creation.
- Load the Tribune skill only when the runtime skill source resolves to `/Users/milovan/projects/Consilium/codex/skills/tribune`.
- If the runtime Tribune resolves to `/Users/milovan/projects/Consilium/claude/skills/tribune` or any other non-Codex path, treat Codex Tribune as unavailable and use the 14-field diagnosis packet inline from `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`.
- Read `$CONSILIUM_DOCS/doctrine/lane-classification.md`, `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`, `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`, and the matching `$CONSILIUM_DOCS/doctrine/lane-guides/*.md` file.
- Produce a diagnosis packet before proposing a code fix.
- Persist bug diagnosis packets through `$CONSILIUM_DOCS/scripts/case-new <slug> --target <target> --agent codex --type bug` and capture the returned dated case folder.
- Keep the active model or Consul responsible for synthesis, user-facing decisions, and the diagnosis packet.
- Use Interpres when the question is domain meaning, status meaning, role meaning, or canonical surface ownership.
- Use Speculator when the question is exact file, symbol, route, workflow, module, hook, payload, or execution-path truth.
- Use Arbiter when the failure may be frontend-backend contract drift.
- Send the bounded diagnosis packet to `consilium-tribunus` and `consilium-provocator` when dispatch is available before routing a fix.
- Treat `consilium-tribunus` as verifier only. It checks the diagnosis packet and completed implementation tasks. It does not become the debugger and does not execute fixes.

Diagnosis packet fields:
- Symptom
- Reproduction
- Affected lane
- Files/routes inspected
- Failing boundary
- Root-cause hypothesis
- Supporting evidence
- Contrary evidence
- Known gap considered
- Proposed fix site
- Fix threshold
- Verification plan
- Open uncertainty
- Contract compatibility evidence

Diagnosis gate:
- `SOUND` from both verifiers unlocks fix routing.
- `CONCERN` from either verifier unlocks fix routing only when the concern is explicitly accepted or mitigated.
- `GAP` from either verifier sends the workflow back to diagnosis.
- `MISUNDERSTANDING` from either verifier halts and escalates to the Imperator.
- If dispatch is unavailable, say the diagnosis is unverified and ask whether to proceed, dispatch, or keep diagnosing.

Emergency containment:
- Containment is allowed only for real business impact.
- Label containment as containment.
- Keep containment reversible and minimal.
- Follow containment with normal diagnosis.
- Do not call containment a root-cause fix.

Fix routing:
- Route approved fixes through `consilium-legatus` unless Milovan explicitly asks for inline execution and dispatch is unavailable.
- Use thresholds from `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`.
- `small` fixes may be one bounded Legatus task.
- `medium` fixes require a short implementation plan before Legatus execution; cross-repo medium requires field 14 = `backward-compatible`.
- `large` fixes require Consul planning and appropriate verifier review before execution.
- `contain` requires explicit emergency containment approval and leaves the case contained.

Medusa backend routing:
- For `divinipress-backend` questions about Medusa architecture or placement, route to `consilium-interpres-back` first.
- For `divinipress-backend` questions about exact route, service, workflow, or transition chains, route to `consilium-speculator-back`.
- For approved Medusa backend implementation, route through `consilium-legatus`, not directly to a Centurion.
- When dispatching Medusa backend work, explicitly attach `building-with-medusa` so the receiving rank loads Medusa doctrine before acting.

Runtime note:
- If the runtime requires explicit user authorization for subagent dispatch, ask for it immediately instead of falling back to self-search and pretending that behavior is doctrinal.

Do not:
- Browse broadly inline unless the check is tiny and cheaper than dispatch.
- Hand one agent two jobs when two ranks exist because the jobs differ.
- Default to verification theater on trivial work.
- Add a dedicated debug rank unless evals prove existing ranks cannot carry the workflow.
