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

> **Confidence: Medium** — the surface map was verified against live files (line ranges confirmed), but verification surfaced operational details (skip syntax, parser contract, authoring awareness) that needed to be added in revision; the inferred Highs for those details did not survive scrutiny.

The `edicts` skill currently dispatches Praetor+Provocator in parallel during the "Dispatching Verification" phase (`claude/skills/edicts/SKILL.md` lines 251–267) and proceeds directly to "The Legion Awaits" (lines 271+). This work inserts a new sequential dispatch between those two phases.

Three surfaces are touched:

1. **`claude/skills/edicts/SKILL.md`** — insert a new "Dispatching the Custos" phase between the existing "Dispatching Verification" phase and "The Legion Awaits." The new phase must:
   - Trigger only after the Praetor+Provocator dispatch has returned clean (see "Returned Clean — Definition" below).
   - Announce: "Dispatching the Custos for dispatch-readiness verification."
   - Allow Imperator opt-out via "skip" — see "Skip Syntax" below for the exact recognition contract.
   - Direct the consul to read the protocol and the new template before dispatch.
   - Dispatch a single `consilium-custos` subagent (single-agent dispatch, not paired).
   - Handle Custos's three-verdict overlay per the verdict-integration rules below.
   - On `OK TO MARCH`, present the attributed summary to the Imperator and proceed to "The Legion Awaits."

   The same skill file also receives a small **Authoring Awareness** addition near the existing "What I Will Not Write" section: a one-paragraph note that plan authors should expect Custos's quoting/env discipline at authorship time (quote bracket-paths in bash blocks, classify env vars by source, name expected baseline test pass/fail status). This raises the content bar for plans without changing the plan template — it tells the consul-as-edicts what Custos will catch so the consul can pre-empt PATCH BEFORE DISPATCH cycles.

2. **`claude/skills/references/verification/templates/custos-verification.md`** — new template file. Format follows the precedent of `mini-checkit.md` (the only existing single-agent template) for structural shape, and the precedent of `plan-verification.md` for prompt-skeleton headings:
   - **When to Dispatch** — after Praetor+Praetor clear (per "Returned Clean — Definition"); Imperator skip default behavior.
   - **Agents** — Custos alone (no parallel partner).
   - **Dispatch: Custos** — fenced `Agent tool:` block with the literal call shape. Prompt skeleton:
     - `## The Artifact` — the plan content and the spec it implements (verbatim, with inline confidence annotations).
     - `## Domain Knowledge` — names the relevant `$CONSILIUM_DOCS/doctrine/` files Custos should read directly, with `known-gaps.md` named explicitly for Walk 4 (baseline check). Pre-loading excerpts is optional per the protocol; this template defaults to naming, not pre-loading.
     - `## Context Summary` — the structured context summary the consul wrote for the Praetor+Provocator dispatch, reused verbatim. The Independence Rule applies: no raw conversation, no Praetor or Provocator findings.
     - `## Re-walk Marker` (second-walk only) — present **only** in the second dispatch after `PATCH BEFORE DISPATCH`. Lists which patches were applied to the plan since the first walk. The Independence Rule is preserved (Custos still does not see prior verifier findings); revision metadata is artifact metadata, not conversation metadata, and Walk 6 (Document) is designed to act on it.
     - `## Your Mission` — instructs Custos to run his Six Walks per his agent file, produce the three-verdict format with Codex-tagged findings, and include the mandatory Do Not Widen section.
     - `## Output Format` — see "Verdict Parsing Contract" below for the required verdict line format. Findings (each tagged MISUNDERSTANDING / GAP / CONCERN / SOUND with chain of evidence) and Do Not Widen section follow.

   The dispatch prompt skeleton intentionally **omits** a `## Confidence Map` section. Custos's agent file (line 94) explicitly states *"I do not need the confidence map"* — his walks are operational, not assumption-driven. Inline confidence annotations remain present in the artifact verbatim and are available for any walk that benefits from them (Walk 6 in particular benefits from seeing where the consul felt certain, since those are stale-wording candidates).

3. **`claude/skills/references/verification/protocol.md`** — add one row to the dispatch table at section 2 (currently lines 43–50): `| Dispatch-readiness verification | consilium-custos |`. No other protocol changes — Custos's findings remain Codex-categorized, his auto-feed loop respects the 2-iteration cap, and the Independence Rule holds.

### Skip Syntax

The dispatcher recognizes the following Imperator replies as "skip" (case-insensitive, after trimming whitespace and markdown):
- `skip`
- `skip custos`
- `no custos`
- `no, skip`

Anything else proceeds to dispatch. Vague replies (`not now`, `maybe later`, `up to you`) trigger a one-line clarification: *"Skip Custos, or proceed?"* The dispatcher does not infer skip intent from non-matching replies.

A skip declaration is honored only if it arrives **before** the Agent tool call is made. Once the dispatch is in flight, the call runs to completion; a late "skip" is acknowledged but not enforceable (the cost is one wasted Custos walk, not a workflow break).

### Returned Clean — Definition

Praetor+Provocator are "returned clean" for Custos purposes when **all** of the following hold:

1. **No MISUNDERSTANDING currently in escalation.** A MISUNDERSTANDING that was escalated to the Imperator and resolved in conversation (Imperator clarified the concept, consul revised the plan accordingly, consul recorded the resolution in case STATUS) closes the escalation. The revised plan is eligible for Custos.
2. **No unresolved GAPs after 2 iterations.** GAPs that the consul addressed in the auto-feed loop count as resolved. GAPs that exhausted the 2-iteration cap are escalations and disqualify the plan from Custos until the Imperator resolves them.
3. **All CONCERNs explicitly handled.** The consul has either adopted the CONCERN (with the plan revised accordingly) or recorded the rejection with reasoning per protocol section 6. Unhandled CONCERNs disqualify the plan from Custos.
4. **No plan modifications since plan verification cleared without an Imperator gate.** If the consul or the Imperator modified the plan between Praetor+Provocator clearance and Custos dispatch, the consul announces the diff to the Imperator and gets an explicit decision: re-dispatch plan verification, or proceed to Custos. The Imperator's decision is recorded in case STATUS. Silent modification is forbidden.
5. **Imperator overrides are recorded.** If the Imperator overrode a Praetor or Provocator finding (instructing the consul to revert a fix, accept a finding without resolution, or proceed despite an unresolved CONCERN), the override is recorded in case STATUS. The Imperator's decision is the final authority.

## Verdict Integration Rules

> **Confidence: Medium** — verdict-to-action mapping was stamped by the Imperator at the architectural level, but verification surfaced four operational gaps (override path, patch disposition, parser contract, failure modes) that the original High rating did not earn.

Custos returns one of three verdicts. The dispatcher (the consul-as-edicts in the main session) takes the following action based on verdict:

- **`BLOCKER`** — halt the workflow. Show the Imperator the finding(s) and chain of evidence. Do not proceed to the legion-awaits handoff. The Imperator decides next steps:
  - **Patch and re-dispatch plan verification.** The consul revises, then re-runs the full Praetor+Provocator+Custos cycle.
  - **Patch and re-dispatch Custos only.** The consul revises, then re-walks Custos (counted as the one allowed re-walk under PATCH BEFORE DISPATCH semantics; a second non-OK escalates).
  - **Override and proceed.** The Imperator instructs the dispatcher to proceed to legion-awaits despite the BLOCKER. The dispatcher requires explicit confirmation: *"BLOCKER override — proceed to legion-awaits with [finding title] unresolved? Confirm with 'override confirmed.'"* The override is recorded in case STATUS with the finding text and the Imperator's confirmation. No silent override.
  - **Escalate beyond the consul.** The Imperator may invoke a different skill or pause the campaign entirely.

- **`PATCH BEFORE DISPATCH`** — apply the inline patches Custos named. Then re-dispatch Custos once for a second walk with a `## Re-walk Marker` section in the prompt naming the patches applied. **This is the only re-walk permitted.** Outcomes:
  - Second walk returns `OK TO MARCH` → present the summary, proceed to "The Legion Awaits."
  - Second walk returns `BLOCKER` → halt and escalate to the Imperator. Patches stay applied to the plan on disk (no automatic revert); case STATUS records both the patches and the second-walk verdict. Imperator decides whether to revert the patches before next steps.
  - Second walk returns `PATCH BEFORE DISPATCH` again → escalate to the Imperator (treated as exhausted iterations). Same patch-disposition rule: applied patches stay, case STATUS records both walks, Imperator decides revert.

- **`OK TO MARCH`** — present the attributed summary to the Imperator (verdict, findings list including SOUND findings, mandatory Do Not Widen section). Proceed to "The Legion Awaits."

### Verdict-to-Finding Mapping

The findings within Custos's report flow through Codex categories per his agent file's verdict-mapping rules:

- Any MISUNDERSTANDING → `BLOCKER`
- GAP preventing dispatch (missing tool, wrong cwd, falsely-passing guard, broken regression gate, falsified negative claim) → `BLOCKER`
- GAP fixable inline (quoting, env classification, stale wording) → `PATCH BEFORE DISPATCH`
- Only CONCERN and SOUND findings → `OK TO MARCH`

A MISUNDERSTANDING in Custos's findings escalates to the Imperator immediately per the Codex (zero auto-fix attempts). The `BLOCKER` verdict reflects this — the dispatcher must not attempt to patch a MISUNDERSTANDING regardless of how mechanical the patch appears.

### Verdict Authority on Inconsistency

The verdict line is the dispatcher's contract. If Custos's report contains contradictory finding tags (e.g., verdict `OK TO MARCH` with a finding tagged MISUNDERSTANDING, or verdict `BLOCKER` with no MISUNDERSTANDING or dispatch-preventing-GAP findings), the dispatcher:

1. Honors the verdict (per Custos's persona authority over the three-verdict overlay).
2. Flags the contradiction to the Imperator with the full Custos report attached and a one-line note: *"Custos's verdict and finding tags contradict — verdict honored, contradiction surfaced for review."*

The contradiction is a Custos report bug, not a dispatcher decision.

### Verdict Parsing Contract

The dispatcher reads the line beginning with `Verdict:` (literal prefix, case-sensitive on the prefix). The expected format in Custos's report:

```
Verdict: <BLOCKER | PATCH BEFORE DISPATCH | OK TO MARCH>
```

The dispatcher trims markdown bold (`**`), trailing whitespace, and trailing punctuation, then matches the remainder against the three exact uppercase values. Any of the following is **malformed** and treated as if Custos returned `BLOCKER` (with the report escalated to the Imperator unchanged, plus a one-line note: *"Custos verdict malformed — treated as BLOCKER, full report attached."*):

- Missing `Verdict:` line.
- Multiple `Verdict:` lines (ambiguous which is authoritative).
- Lowercase or mixed-case verdict value (`blocker`, `Blocker`).
- Verdict value with extra content other than markdown bold or trailing whitespace/punctuation (`BLOCKER (with caveats)`, `BLOCKER for now`).

The template's `## Output Format` section enforces this contract by requiring the `Verdict:` line and naming the three exact values. The dispatcher's strictness protects the Imperator from silently misrouted dispatches.

### Failure / Abort Handling

The Custos dispatch can fail in operational ways that are not verdicts:

- **Non-return** (subagent crash, OOM, network timeout, infinite loop): the dispatcher detects non-return via the Agent tool's completion signal. Treat as `BLOCKER` and escalate to the Imperator with a one-line note: *"Custos dispatch did not return — treated as BLOCKER, no report available."* The Imperator decides whether to retry the dispatch or proceed via override.
- **Mid-dispatch skip**: see "Skip Syntax" above. Skip is honored only before the Agent tool call fires. Once in flight, skip is acknowledged but not enforceable.
- **Re-walk inheritance**: the second walk after `PATCH BEFORE DISPATCH` inherits the same failure semantics — non-return on the second walk treats as `BLOCKER` + escalate. There is no re-re-walk.

## Invariants the Implementation Must Preserve

> **Confidence: High** — every invariant either mirrors an explicit Imperator decision, an existing protocol rule, or Custos's own agent definition.

- **Sequential, not parallel.** Custos runs after Praetor+Provocator have completed and their findings are resolved. He is the LAST gate by design and must not be dispatched alongside earlier verifiers.
- **No bypass when plan verification is in escalation.** If the Praetor+Provocator dispatch escalated to the Imperator (currently-active MISUNDERSTANDING or unresolved GAP after 2 iterations), Custos does NOT run. "Currently-active" means not yet resolved by Imperator conversation; resolved-and-recorded escalations clear the gate per "Returned Clean — Definition."
- **Skippable matches the pattern.** The Imperator can say "skip" (per "Skip Syntax") to bypass Custos, consistent with the existing Praetor+Provocator and Censor+Provocator dispatches.
- **Re-walk once on `PATCH BEFORE DISPATCH`.** Maximum one re-dispatch after patches are applied. A second non-`OK TO MARCH` verdict escalates.
- **Plan modification after plan-verification clearance triggers an Imperator gate.** Silent modification between plan-verification clear and Custos dispatch is forbidden. The consul announces the diff; the Imperator decides re-dispatch vs proceed.
- **Imperator overrides are recorded.** Any Imperator decision that overrides a verifier finding (Praetor, Provocator, or Custos) is recorded in case STATUS with the finding text and the override confirmation.
- **Independence Rule holds.** Custos receives plan, spec, doctrine excerpts (or pointers), the structured context summary, and (on re-walk only) a `## Re-walk Marker` listing applied patches. He does not receive: the raw conversation, the Praetor's or Provocator's findings, or the consul's framing of the plan-verification cycle.
- **Verdict line is authoritative.** On verdict-vs-finding-tag contradiction, the dispatcher honors the verdict and flags the contradiction.
- **The plan template is unchanged.** This work edits the dispatch flow, not the plan format. Plans authored before this wiring still pass through cleanly; plans authored after still match the existing structure. The "Authoring Awareness" addition raises the content bar (zsh-quoting, env classification) but does not modify the template schema.
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

> **Confidence: Medium** — five of nine decisions held under verification (1, 2, 3, 4, 5, 6, 7, 8). Decision #9 was rewritten in revision after the Provocator caught a load-bearing collision between the original "Independence Rule preserved" framing and Custos's Walk 6 design. The all-High rating in the original draft was momentum-rated; the revision earns a more honest Medium for the section as a whole.

1. **Single-agent template, not paired.** Custos goes alone. The structural precedent is `templates/mini-checkit.md` (single-agent dispatch of the Tribunus during execution) — this is the only existing single-agent template. The four other templates (`spec-verification.md`, `plan-verification.md`, `tribune-verification.md`, `campaign-review.md`) all pair a focused verifier with the Provocator; they are format precedents (When to Dispatch / Agents / Dispatch / After) but not structural precedents for single-agent dispatch. Custos is structurally different from the parallel-pair templates — operational, not adversarial — and pairing him would either duplicate his walks or pollute his fresh-eyes discipline.

2. **Default-on with Imperator skip.** Imperator confirmed: *"skippable, match the pattern."* See "Skip Syntax" for the exact recognition contract. The escape hatch is consistent with every other verification dispatch in the system.

3. **Re-walk once on `PATCH BEFORE DISPATCH`.** Imperator confirmed: *"re-walk once."* Patches can introduce new shell/env issues — Custos's whole purpose is catching those — so the re-walk is not theatrical. This is **deliberately conservative** — the Codex's auto-feed loop permits up to 2 iterations; Custos uses one because his domain (operational verification of patch artifacts) does not benefit from additional rounds. The framing is a Custos-specific choice, not a mechanical derivation from the Codex cap.

4. **Sequential after Praetor+Provocator.** Custos's own description names this placement. The verdict integration depends on plan verification having completed cleanly (per "Returned Clean — Definition"); otherwise the workflow is in escalation and Custos's walk is moot.

5. **No bypass when plan verification is in escalation.** Implicit in sequential design. Made explicit in the spec to prevent the implementation from queueing a Custos dispatch that the Imperator is mid-resolving. "Returned Clean — Definition" specifies what counts as resolved.

6. **Protocol dispatch table row added, not the entire protocol restructured.** Section 2 of `protocol.md` is a flat lookup table; one new row is the minimum-impact change.

7. **Template lives at `templates/custos-verification.md`.** Naming follows the existing convention (`spec-verification.md`, `plan-verification.md`, `tribune-verification.md`, `campaign-review.md`, `mini-checkit.md`).

8. **Domain Knowledge passed by reference, not pre-loaded.** Custos has Read and Bash access; he reads `$CONSILIUM_DOCS/doctrine/known-gaps.md` directly during Walk 4 (baseline). The dispatch prompt names the file rather than pasting its contents. Pre-loading is permitted by the protocol but adds dispatch-time tokens with no quality gain — Custos's whole role is targeted reads, not bulk consumption. If `$CONSILIUM_DOCS` is missing or malformed at dispatch time, Custos halts per his own Operational Notes; the halt is the correct fail-safe (pre-loading would mask the problem rather than surface it).

9. **Re-walk includes a `## Re-walk Marker`; the Independence Rule is preserved at the conversation level, not the artifact-metadata level.** The first dispatch sends the original plan with no marker. The second dispatch (after `PATCH BEFORE DISPATCH`) sends the patched plan with a `## Re-walk Marker` section listing the patches applied. The Independence Rule prohibits Custos from seeing the prior verifier's findings, the raw consul-Imperator conversation, or the consul's framing of the plan-verification cycle — none of which a `## Re-walk Marker` reveals. Walk 6 (Document) is specifically designed to detect stale wording on revised artifacts and **needs** revision metadata to do its job; the marker provides exactly that signal without crossing the Independence boundary. The original draft of this spec asserted "preserves the Independence Rule for the second walk" while hiding the marker — that framing was caught by verification and corrected.

## Verification Expectations

> **Confidence: High** — these are mechanical applications of the existing verification protocol to this work, with smoke tests sized to cover the failure modes verification surfaced.

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions) and `consilium-provocator` (failure modes, brittle assumptions, overconfidence) in parallel before `/march` or `/legion` executes it. Findings handled per the Codex auto-feed loop. The plan must include:

- **Manual smoke test 1 — happy path.** Author a trivial single-task plan, dispatch Praetor+Provocator (should clear), confirm Custos dispatch fires automatically, confirm `OK TO MARCH` verdict is presented to the Imperator with attribution and proceeds to "The Legion Awaits."
- **Manual smoke test 2 — skip flag.** Author a trivial plan, Imperator says "skip Custos," confirm dispatch is bypassed cleanly without errors and the workflow advances to "The Legion Awaits." Re-run with each accepted skip phrase (`skip`, `skip custos`, `no custos`, `no, skip`) and one rejected phrase (`maybe later`) — confirm the rejected phrase triggers the clarification line, not a silent skip.
- **Manual smoke test 3 — `BLOCKER` path with override.** Author a plan with a deliberately broken bash block (e.g., unquoted `[id]` glob), confirm Custos returns `BLOCKER` with chain of evidence, confirm the workflow halts and presents the finding to the Imperator. Test override: Imperator says "override confirmed," confirm the dispatcher proceeds to legion-awaits and records the override in case STATUS with the finding text.
- **Manual smoke test 4 — `PATCH BEFORE DISPATCH` re-walk happy path.** Author a plan with a fixable issue (e.g., stale wording from a revised section), confirm first walk returns `PATCH BEFORE DISPATCH`, confirm patch is applied, confirm re-walk fires once with `## Re-walk Marker` listing the patch, confirm second walk returns `OK TO MARCH`.
- **Manual smoke test 5 — `PATCH BEFORE DISPATCH` re-walk failure.** Author a plan that triggers `PATCH BEFORE DISPATCH` on first walk but a different issue on the patched plan (e.g., the patch introduces a new env-classification bug). Confirm second walk returns `BLOCKER`, confirm escalation to Imperator, confirm patches stay applied on disk, confirm case STATUS records both walks.
- **Manual smoke test 6 — plan modification gate.** Author a plan, complete Praetor+Provocator clearance, then modify the plan (substantive edit, not typo). Confirm the dispatcher announces the diff to the Imperator and waits for the gate decision before dispatching Custos.
- **Manual smoke test 7 — malformed verdict.** Manually craft a Custos response with a malformed verdict line (`**BLOCKER**`, `Verdict: blocker`, missing `Verdict:` line). Confirm the dispatcher treats each as `BLOCKER` + escalate per the parser contract.
- **Tribune staleness check pass as a final gate.** Run `python3 scripts/check-tribune-staleness.py` and confirm clean (the change does not introduce banned-regex matches, broken doctrine references, or test-writing-discipline leaks in tribune surfaces).
- **Codex drift check pass as a final gate.** Run `python3 scripts/check-codex-drift.py` and confirm clean. This change does not modify the canonical Codex or any agent's Codex section; the check confirms no incidental drift.

**Latency note:** This wiring inserts a sequential dispatch between Praetor+Provocator and the legion-awaits handoff. For trivial plans where Praetor+Provocator clear in seconds, the additional Custos dispatch adds visible wait time before the Imperator sees the legion prompt. The smoke tests will reveal whether the cumulative latency is acceptable in practice. If not, the Imperator may invoke "skip Custos" as a per-session override; the long-term answer (if needed) is a separate change to make the dispatch parallel-with-presentation rather than blocking, which is out of scope here.

## Out of Scope (named explicitly so the verifiers do not flag them as gaps)

> **Confidence: High** — every out-of-scope item was either explicitly excluded by the Imperator during deliberation or is a known follow-on that does not belong in this work.

- Wiring Custos into `consul` (spec-side dispatch). Imperator confirmed plan-side only. Future work if the Imperator wants Custos on specs.
- Wiring Custos into `legion` or `march`. Dispatch happens in `edicts`, before the Legatus.
- Adding a `field-check-this` slash command for standalone Custos dispatch. Custos remains standalone-callable via the Agent tool today; a dedicated command is a separate change.
- **Standalone "field check this" interaction with the auto-dispatch path.** Custos's standalone callability via the Agent tool is unaffected by this wiring. The agent file is unchanged; ad-hoc dispatch via Task continues to work. The auto-dispatch added by this work is the default-on path; the standalone path is the on-demand alternative. If the Imperator says "field check this plan" during a consul session between Praetor+Provocator clear and the auto-Custos dispatch, the dispatcher's behavior is undefined here and falls back to whatever the consul judges appropriate in the moment — formalizing this interaction is a separate change.
- Modifying Custos's agent file or his canonical persona. The dispatcher conforms to him.
- Adding Custos to the Campaign Review template (`templates/campaign-review.md`). Campaign Review runs after implementation; it has its own triad (Censor + Praetor + Provocator). Custos's lane is dispatch-readiness, not post-execution review.
- Pre-loading `$CONSILIUM_DOCS` doctrine excerpts into the Custos dispatch prompt beyond naming the relevant files. Custos can read them directly. Optional pre-loading is permitted by the protocol but not required for this wiring.
- Changing the four Codex finding categories or adding a fifth. Custos's three-verdict overlay is dispatcher-action mapping, not a finding category.
- Cross-skill propagation of the verdict overlay (introducing `BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH` as terms outside the Custos dispatch). The verdict is local.
- Re-running Praetor+Provocator after a Custos `BLOCKER` or escalated `PATCH BEFORE DISPATCH`. The escalation goes to the Imperator, who decides whether re-running plan verification is warranted. The full-cycle re-dispatch is one of the Imperator's options under the BLOCKER path (see "Verdict Integration Rules"), not a default behavior.
- Latency optimization (parallel-with-presentation dispatch, predictive pre-walking, etc.). The "Latency note" in Verification Expectations acknowledges the workflow change but does not propose a latency-engineering fix.
- Automatic patch revert on second-walk `BLOCKER`. The spec leaves applied patches in place and records both walks; the Imperator decides revert. Automatic revert is a safety vs. predictability tradeoff that is out of scope.
