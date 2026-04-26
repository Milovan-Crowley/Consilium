# 2026-04-26-custos-edicts-wiring — Spec

## Goal

> **Confidence: High** — the Imperator approved this work explicitly, and the placement is named in Custos's own description and in the original mirror spec.

Wire the existing `consilium-custos` agent into his designed default lane: dispatched by the `edicts` skill after Praetor+Provocator plan verification has returned clean, before the Legion/March handoff. The agent is already registered and dispatchable; what is missing is the automatic invocation. This work installs that wiring.

The 2026-04-24-claude-custos-mirror case registered the agent and explicitly punted this wiring as a "separate change" (`docs/cases/2026-04-24-claude-custos-mirror/spec.md` line 71, "Out of Scope" section). This is that change.

## Source

> **Confidence: High** — every cited path was verified during reconnaissance.

The Custos agent and its operational doctrine were forged in the 2026-04-24 mirror case:

- Agent file: `~/.claude/agents/consilium-custos.md` (Marcus Pernix; Rank: Custos; Six Walks — Shell, Env, Tests, Baseline, Blast Radius, Document; verdict format `BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`; Do Not Widen mandatory section).
- Canonical persona: `claude/skills/references/personas/custos.md`.
- Mirror spec (registration only, wiring out of scope): `docs/cases/2026-04-24-claude-custos-mirror/spec.md`.

Custos's recommended placement, per his agent file's `description` field: *"after Praetor/Provocator plan verification, before Legion/March dispatch."* This spec installs that placement.

## What's Needed on the Edicts Side

> **Confidence: High** — surfaces, line ranges, and integration points were verified during reconnaissance against the current state of `claude/skills/edicts/SKILL.md`, `claude/skills/references/verification/protocol.md`, and the `templates/` directory.

The `edicts` skill currently dispatches Praetor+Provocator in parallel during the "Dispatching Verification" phase (`claude/skills/edicts/SKILL.md` lines 251–267) and proceeds directly to "The Legion Awaits" (lines 271+). This work inserts a new sequential dispatch between those two phases.

Three surfaces are touched:

1. **`claude/skills/edicts/SKILL.md`** — insert a new "Dispatching the Custos" phase between the existing "Dispatching Verification" phase and "The Legion Awaits." The new phase must:
   - Trigger only after the Praetor+Provocator dispatch has returned clean (their findings handled to completion via the existing auto-feed loop, with no MISUNDERSTANDING in escalation and no unresolved GAPs after 2 iterations).
   - Announce: "Dispatching the Custos for dispatch-readiness verification."
   - Allow Imperator opt-out via "skip" (matches the existing Praetor+Provocator pattern in this skill and the Censor+Provocator pattern in `consul`).
   - Direct the consul to read the protocol and the new template before dispatch.
   - Dispatch a single `consilium-custos` subagent (single-agent dispatch, not paired).
   - Handle Custos's three-verdict overlay per the verdict-integration rules below.
   - On `OK TO MARCH`, present the attributed summary to the Imperator and proceed to "The Legion Awaits."

2. **`claude/skills/references/verification/templates/custos-verification.md`** — new template file. Format follows the existing `tribune-verification.md` and `plan-verification.md` precedents:
   - **When to Dispatch** — after Praetor+Provocator clear; Imperator skip default behavior.
   - **Agents** — Custos alone (no parallel partner).
   - **Dispatch: Custos** — fenced `Agent tool:` block with the literal call shape. Prompt skeleton:
     - `## The Artifact` — the plan content and the spec it implements (verbatim, with inline confidence annotations).
     - `## Domain Knowledge` — names the relevant `$CONSILIUM_DOCS/doctrine/` files Custos should read directly, with `known-gaps.md` named explicitly for Walk 4 (baseline check). Pre-loading excerpts is optional per the protocol; this template defaults to naming, not pre-loading.
     - `## Context Summary` — the structured context summary the consul wrote for the Praetor+Provocator dispatch, reused verbatim. The Independence Rule still applies: no raw conversation, no Praetor or Provocator findings.
     - `## Your Mission` — instructs Custos to run his Six Walks per his agent file, produce the three-verdict format with Codex-tagged findings, and include the mandatory Do Not Widen section.
     - `## Output Format` — verdict (one of `BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`), findings (each tagged MISUNDERSTANDING / GAP / CONCERN / SOUND with chain of evidence), and Do Not Widen section listing magistrate-territory temptations resisted.
   - **After Custos Returns** — explains verdict-to-action mapping for the dispatcher (see "Verdict Integration Rules" below).

3. **`claude/skills/references/verification/protocol.md`** — add one row to the dispatch table at section 2 (currently lines 43–50): `| Dispatch-readiness verification | consilium-custos |`. No other protocol changes — Custos's findings remain Codex-categorized, his auto-feed loop respects the 2-iteration cap, and the Independence Rule holds (he receives plan, spec, doctrine, context summary; not the raw conversation, not the Praetor or Provocator findings).

## Verdict Integration Rules

> **Confidence: High** — verdict-to-action mapping was explicitly stamped by the Imperator (Q1: skippable matches the pattern; Q2: re-walk once on PATCH BEFORE DISPATCH).

Custos returns one of three verdicts. The dispatcher (the consul-as-edicts in the main session) takes the following action based on verdict:

- **`BLOCKER`** — halt the workflow. Show the Imperator the finding(s) and chain of evidence. Do not proceed to the legion-awaits handoff. The Imperator decides next steps (which may include patching specific tasks, re-running plan verification, or escalating beyond the consul).

- **`PATCH BEFORE DISPATCH`** — apply the inline patches Custos named. Then re-dispatch Custos once for a second walk. **This is the only re-walk permitted** — it matches the Codex auto-feed loop's max-2-iterations cap. Outcomes:
  - Second walk returns `OK TO MARCH` → present the summary, proceed to "The Legion Awaits."
  - Second walk returns `BLOCKER` → halt and escalate to the Imperator.
  - Second walk returns `PATCH BEFORE DISPATCH` again → escalate to the Imperator (treated as exhausted iterations under the Codex cap).

- **`OK TO MARCH`** — present the attributed summary to the Imperator (verdict, findings list including SOUND findings, mandatory Do Not Widen section). Proceed to "The Legion Awaits."

The findings within Custos's report still flow through Codex categories per his agent file's verdict-mapping rules:

- Any MISUNDERSTANDING → `BLOCKER`
- GAP preventing dispatch (missing tool, wrong cwd, falsely-passing guard, broken regression gate, falsified negative claim) → `BLOCKER`
- GAP fixable inline (quoting, env classification, stale wording) → `PATCH BEFORE DISPATCH`
- Only CONCERN and SOUND findings → `OK TO MARCH`

A MISUNDERSTANDING in Custos's findings escalates to the Imperator immediately per the Codex (zero auto-fix attempts). The `BLOCKER` verdict reflects this — the dispatcher must not attempt to patch a MISUNDERSTANDING regardless of how mechanical the patch appears.

## Invariants the Implementation Must Preserve

> **Confidence: High** — every invariant either mirrors an explicit Imperator decision, an existing protocol rule, or Custos's own agent definition.

- **Sequential, not parallel.** Custos runs after Praetor+Provocator have completed and their findings are resolved. He is the LAST gate by design and must not be dispatched alongside earlier verifiers.
- **No bypass when plan verification is in escalation.** If the Praetor+Provocator dispatch escalated to the Imperator (MISUNDERSTANDING or unresolved GAP after 2 iterations), Custos does NOT run. The plan is already in human review; adding Custos noise during escalation is wasteful.
- **Skippable matches the pattern.** The Imperator can say "skip" to bypass Custos, consistent with the existing Praetor+Provocator and Censor+Provocator dispatches.
- **Re-walk once on `PATCH BEFORE DISPATCH`.** Maximum one re-dispatch after patches are applied. A second non-`OK TO MARCH` verdict escalates.
- **Independence Rule holds.** Custos receives plan, spec, doctrine excerpts (or pointers), and the structured context summary — not the raw conversation, not the Praetor's or Provocator's findings (which would compromise his fresh-eyes walk).
- **The plan template is unchanged.** This work edits the dispatch flow, not the plan format. Plans authored before this wiring still pass through cleanly; plans authored after still match the existing structure.
- **The Custos agent file is unchanged.** All edits happen in the dispatcher (`edicts` skill) and the verification reference layer (template + protocol). Custos's agent definition, his Six Walks, his verdict format, and his Do Not Widen discipline remain exactly as forged in the 2026-04-24 mirror case.
- **The Codex remains the source of truth for finding categories.** The three-verdict overlay (`BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`) is dispatcher-action mapping, not a replacement for the four Codex categories.

## Hard Scope Constraints

> **Confidence: High** — every constraint was either explicitly stated by the Imperator or follows directly from the agreed scope.

- Do not wire Custos into the `consul` skill (spec-side dispatch). The Imperator confirmed plan-side wiring only.
- Do not wire Custos into the `legion` or `march` skills. The dispatch happens in `edicts`, before the Legatus takes the plan.
- Do not modify the existing Praetor+Provocator dispatch in `edicts` beyond inserting the new phase after it. The existing flow stays intact.
- Do not modify Custos's agent file at `~/.claude/agents/consilium-custos.md` or his canonical persona at `claude/skills/references/personas/custos.md`. The dispatcher conforms to him, not him to the dispatcher.
- Do not change the Codex auto-feed loop, the Independence Rule, or the four finding categories. Custos's verdict overlay is additive, not a replacement.
- Do not introduce a new finding category. The three Custos verdicts are dispatcher hints, not Codex finding categories.
- Do not propagate the verdict overlay (`BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`) into other skills or agents as a system-wide vocabulary. The verdict is local to the Custos dispatch and its dispatcher action.
- Do not edit `claude/CLAUDE.md` for this work unless the implementation discovers that a maintenance section claim is now inaccurate (e.g., a count of dispatching skills). If found, name the discrepancy in the plan and patch it; otherwise leave `CLAUDE.md` alone.

## Open Architectural Decisions Resolved (with confidence)

> **Confidence: High** — these decisions were stamped by the Imperator before this spec was drafted, or are mechanical mirrors of existing patterns in `plan-verification.md`, `tribune-verification.md`, and `protocol.md`.

1. **Single-agent template, not paired.** Custos goes alone. Existing two-agent templates (`spec-verification.md`, `plan-verification.md`, `campaign-review.md`, `tribune-verification.md`) all pair a focused verifier with the Provocator. Custos is structurally different — operational, not adversarial — and pairing him would either duplicate his walks or pollute his fresh-eyes discipline.

2. **Default-on with Imperator skip.** Imperator confirmed: *"skippable, match the pattern."* The escape hatch is consistent with every other verification dispatch in the system.

3. **Re-walk once on `PATCH BEFORE DISPATCH`.** Imperator confirmed: *"re-walk once."* Matches the Codex auto-feed loop's 2-iteration cap. Patches can introduce new shell/env issues — Custos's whole purpose is catching those — so the re-walk is not theatrical.

4. **Sequential after Praetor+Provocator.** Custos's own description names this placement. The verdict integration depends on plan verification having completed cleanly; otherwise the workflow is in escalation and Custos's walk is moot.

5. **No bypass when plan verification is in escalation.** Implicit in sequential design. Made explicit in the spec to prevent the implementation from queueing a Custos dispatch that the Imperator is mid-resolving.

6. **Protocol dispatch table row added, not the entire protocol restructured.** Section 2 of `protocol.md` is a flat lookup table; one new row is the minimum-impact change.

7. **Template lives at `templates/custos-verification.md`.** Naming follows the existing convention (`spec-verification.md`, `plan-verification.md`, `tribune-verification.md`, `campaign-review.md`).

8. **Domain Knowledge passed by reference, not pre-loaded.** Custos has Read and Bash access; he reads `$CONSILIUM_DOCS/doctrine/known-gaps.md` directly during Walk 4 (baseline). The dispatch prompt names the file rather than pasting its contents. Pre-loading is permitted by the protocol but adds dispatch-time tokens with no quality gain — Custos's whole role is targeted reads, not bulk consumption.

9. **Re-walk re-uses the original dispatch prompt.** When re-dispatching after `PATCH BEFORE DISPATCH`, the prompt is the same shape with the patched plan substituted for the original. No new context is added. This preserves the Independence Rule for the second walk.

## Verification Expectations

> **Confidence: High** — these are mechanical applications of the existing verification protocol to this work, with smoke tests sized to the surface area.

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions) and `consilium-provocator` (failure modes, brittle assumptions, overconfidence) in parallel before `/march` or `/legion` executes it. Findings handled per the Codex auto-feed loop. The plan must include:

- **Manual smoke test 1 — happy path.** Author a trivial single-task plan, dispatch Praetor+Provocator (should clear), confirm Custos dispatch fires automatically, confirm `OK TO MARCH` verdict is presented to the Imperator with attribution and proceeds to "The Legion Awaits."
- **Manual smoke test 2 — skip flag.** Author a trivial plan, Imperator says "skip Custos," confirm dispatch is bypassed cleanly without errors and the workflow advances to "The Legion Awaits."
- **Manual smoke test 3 — `BLOCKER` path.** Author a plan with a deliberately broken bash block (e.g., unquoted `[id]` glob), confirm Custos returns `BLOCKER` with chain of evidence, confirm the workflow halts and presents the finding to the Imperator without proceeding.
- **Manual smoke test 4 — `PATCH BEFORE DISPATCH` re-walk.** Author a plan with a fixable issue (e.g., stale wording from a revised section), confirm first walk returns `PATCH BEFORE DISPATCH`, confirm patch is applied, confirm re-walk fires once, confirm second walk returns `OK TO MARCH`.
- **Tribune staleness check pass as a final gate.** Run `python3 scripts/check-tribune-staleness.py` and confirm clean (the change does not introduce banned-regex matches, broken doctrine references, or test-writing-discipline leaks in tribune surfaces).
- **Codex drift check pass as a final gate.** Run `python3 scripts/check-codex-drift.py` and confirm clean. This change does not modify the canonical Codex or any agent's Codex section; the check confirms no incidental drift.

## Out of Scope (named explicitly so the verifiers do not flag them as gaps)

> **Confidence: High** — every out-of-scope item was either explicitly excluded by the Imperator during deliberation or is a known follow-on that does not belong in this work.

- Wiring Custos into `consul` (spec-side dispatch). Imperator confirmed plan-side only. Future work if the Imperator wants Custos on specs.
- Wiring Custos into `legion` or `march`. Dispatch happens in `edicts`, before the Legatus.
- Adding a `field-check-this` slash command for standalone Custos dispatch. Custos remains standalone-callable via the Agent tool today; a dedicated command is a separate change.
- Modifying Custos's agent file or his canonical persona. The dispatcher conforms to him.
- Adding Custos to the Campaign Review template (`templates/campaign-review.md`). Campaign Review runs after implementation; it has its own triad (Censor + Praetor + Provocator). Custos's lane is dispatch-readiness, not post-execution review.
- Pre-loading `$CONSILIUM_DOCS` doctrine excerpts into the Custos dispatch prompt beyond naming the relevant files. Custos can read them directly. Optional pre-loading is permitted by the protocol but not required for this wiring.
- Changing the four Codex finding categories or adding a fifth. Custos's three-verdict overlay is dispatcher-action mapping, not a finding category.
- Cross-skill propagation of the verdict overlay (introducing `BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH` as terms outside the Custos dispatch). The verdict is local.
- Re-running Praetor+Provocator after a Custos `BLOCKER` or escalated `PATCH BEFORE DISPATCH`. The escalation goes to the Imperator, who decides whether re-running plan verification is warranted.
