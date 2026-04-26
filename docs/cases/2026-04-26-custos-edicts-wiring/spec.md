# 2026-04-26-custos-edicts-wiring — Spec

## Goal

> **Confidence: High** — the Imperator approved this work explicitly, and the placement is named in Custos's own description and in the original mirror spec.

Wire the existing `consilium-custos` agent into his designed default lane: dispatched by the `edicts` skill after Praetor+Provocator plan verification has returned clean, before the Legion/March handoff. The agent is already registered and dispatchable; what is missing is the automatic invocation. This work installs that wiring.

The 2026-04-24-claude-custos-mirror case registered the agent and explicitly punted this wiring as a "separate change" (`docs/cases/2026-04-24-claude-custos-mirror/spec.md` line 71, "Out of Scope" section). This is that change.

This work also bundles a small CONVENTIONS amendment (new `decisions.md` audit artifact) because the wiring requires a programmatic recording substrate for overrides, and the Imperator has decided that adding a real audit log is overdue regardless. See "What's Needed in CONVENTIONS" below.

## Source

> **Confidence: High** — every cited path was verified during reconnaissance.

The Custos agent and its operational doctrine were forged in the 2026-04-24 mirror case:

- Agent file: `~/.claude/agents/consilium-custos.md` (Marcus Pernix; Rank: Custos; Six Walks — Shell, Env, Tests, Baseline, Blast Radius, Document; verdict format `BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`; Do Not Widen mandatory section).
- Canonical persona: `claude/skills/references/personas/custos.md`.
- Mirror spec (registration only, wiring out of scope): `docs/cases/2026-04-24-claude-custos-mirror/spec.md`.

Custos's recommended placement, per his agent file's `description` field: *"after Praetor/Provocator plan verification, before Legion/March dispatch."* This spec installs that placement.

## What's Needed in CONVENTIONS

> **Confidence: High** — Imperator stamped Q1 (option A: amend CONVENTIONS) after the audit log was identified as a load-bearing missing substrate.

Amend `docs/CONVENTIONS.md` to add a new audit artifact: `decisions.md`. Per-case, append-only. Recognized as a valid case-folder file alongside `STATUS.md`, `spec.md`, `plan.md`, etc.

**Schema:**

```markdown
---
case: <slug matching the case folder name>
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

## Entry: YYYY-MM-DD — <short title>

**Type:** [decision | override | verdict | revert | other]
**Actor:** [Imperator | Consul | Legatus | Custos | Praetor | Provocator | Censor | Tribunus | Medicus]
**Trigger:** <what surfaced this — e.g., "Custos returned BLOCKER on bash quoting at plan.md task 3 step 2">
**Decision:** <what was decided>
**Rationale:** <why; cite finding text or evidence verbatim where applicable>
```

Entries are appended in chronological order. Old entries are never edited or removed (append-only discipline). A redaction or correction is itself a new entry of type `revert` referencing the prior entry.

**CONVENTIONS.md edits required:**
- Add a new section "Audit Artifacts" between "Primary Artifacts" and "Phase 1 Case Scan."
- Define `decisions.md` as the canonical audit log file with the schema above.
- Note: optional for cases with no overrides or notable decisions; required when this spec's "recorded in case decisions.md" rule fires.

**This case demonstrates the format.** A `decisions.md` file is created in `docs/cases/2026-04-26-custos-edicts-wiring/` as part of this work, recording the Q1/Q2/Q3 dispositions from the deliberation.

## What's Needed on the Edicts Side

> **Confidence: Medium** — the surface map and line ranges are verified; operational substrate (skip syntax, parser contract, audit recording) was tightened in iteration 2 and again in iteration 3 against verifier findings; the Authoring Awareness mechanism is now anchored to a concrete reference.

The `edicts` skill currently dispatches Praetor+Provocator in parallel during the "Dispatching Verification" phase (`claude/skills/edicts/SKILL.md` lines 251–267) and proceeds directly to "The Legion Awaits" (lines 271+). This work inserts a new sequential dispatch between those two phases.

Three surfaces are touched in the skill+template+protocol layer (plus the CONVENTIONS amendment above, plus the `decisions.md` artifact for this case):

1. **`claude/skills/edicts/SKILL.md`** — insert a new "Dispatching the Custos" phase between the existing "Dispatching Verification" phase and "The Legion Awaits." The new phase must:
   - Trigger only after the Praetor+Provocator dispatch has returned clean (see "Returned Clean — Definition" below).
   - Announce: "Dispatching the Custos for dispatch-readiness verification."
   - Allow Imperator opt-out via "skip" — see "Skip Syntax" below for the exact recognition contract.
   - Direct the consul to read the protocol and the new template before dispatch.
   - Dispatch a single `consilium-custos` subagent (single-agent dispatch, not paired).
   - Handle Custos's three-verdict overlay per the verdict-integration rules below.
   - On `OK TO MARCH`, present the attributed summary to the Imperator and proceed to "The Legion Awaits."

   The same skill file also receives a small **Authoring Awareness** addition. **Placement:** insert a new "## Authoring for Custos" subsection after the existing "Are my symbols consistent?" paragraph (currently line 245) and before the `---` separator (currently line 249). Content:
   - One paragraph naming Custos's quoting/env discipline expectations (quote bracket-paths in bash blocks, classify env vars by source, name expected baseline test pass/fail status).
   - **A required-reading citation:** `~/.claude/agents/consilium-custos.md` lines 100–110 (the Six Walks). The consul reads this directly when authoring plans that touch shell, env, or baseline. Reasoning from memory is forbidden by the Codex; the citation gives the consul a concrete path to load.
   - Explicit acknowledgment that this raises the content bar without changing the plan template schema.

2. **`claude/skills/references/verification/templates/custos-verification.md`** — new template file. Format follows the precedent of `mini-checkit.md` (the only existing single-agent template) for structural shape, and the precedent of `plan-verification.md` for prompt-skeleton headings:
   - **When to Dispatch** — after Praetor+Provocator clear (per "Returned Clean — Definition"); Imperator skip default behavior.
   - **Agents** — Custos alone (no parallel partner).
   - **Dispatch: Custos** — fenced `Agent tool:` block with the literal call shape. Prompt skeleton:
     - `## The Artifact` — the plan content and the spec it implements (verbatim, with inline confidence annotations).
     - `## Domain Knowledge` — names the relevant `$CONSILIUM_DOCS/doctrine/` files Custos should read directly, with `known-gaps.md` named explicitly for Walk 4 (baseline check). Pre-loading excerpts is optional per the protocol; this template defaults to naming, not pre-loading.
     - `## Context Summary` — the structured context summary the consul wrote for the Praetor+Provocator dispatch, reused verbatim. The Independence Rule applies: no raw conversation, no Praetor or Provocator findings.
     - `## Re-walk Marker` (second-walk only) — present **only** in the second dispatch after `PATCH BEFORE DISPATCH`. See "Re-walk Marker — Schema" below for the exact content rules. The Independence Rule is preserved at the conversation level; revision metadata about the artifact is not conversation metadata about prior verifier findings, and Walk 6 (Document) is designed to act on it.
     - `## Your Mission` — instructs Custos to run his Six Walks per his agent file, produce the three-verdict format with Codex-tagged findings, and include the mandatory Do Not Widen section.
     - `## Output Format` — see "Verdict Parsing Contract" below for the required verdict line format. Findings (each tagged MISUNDERSTANDING / GAP / CONCERN / SOUND with chain of evidence) and Do Not Widen section follow.

   The dispatch prompt skeleton intentionally **omits** a `## Confidence Map` section. Custos's agent file (line 94) explicitly states *"I do not need the confidence map"* — his walks are operational, not assumption-driven. Inline confidence annotations remain present in the artifact verbatim and are available for any walk that benefits from them (Walk 6 in particular benefits from seeing where the consul felt certain, since those are stale-wording candidates).

3. **`claude/skills/references/verification/protocol.md`** — add one row to the dispatch table at section 2 (currently lines 43–50): `| Dispatch-readiness verification | consilium-custos |`. No other protocol changes — Custos's findings remain Codex-categorized, his auto-feed loop respects the 2-iteration cap, and the Independence Rule holds.

### Skip Syntax

The dispatcher recognizes the following Imperator replies as "skip" (case-insensitive, after the trim rule below):

- `skip`
- `skip custos`
- `no`
- `no custos`
- `no, skip`
- `nope`
- `cancel`
- `none`
- `don't`
- `stop`

**Trim rule:** before matching, strip surrounding `**` (markdown bold), `*` (italic), `` ` `` (code), leading `> ` (blockquote), leading `- ` and `* ` (list markers), trailing whitespace, and trailing punctuation (`.`, `,`, `;`, `:`, `!`, `?`). After trimming, lowercase and compare against the whitelist above.

Anything not matching the whitelist proceeds to dispatch, **except** the explicit vagueness list (`not now`, `maybe later`, `up to you`, `hmm`, `idk`, `unsure`) which triggers a one-line clarification: *"Skip Custos, or proceed?"*

A skip declaration is honored only if it arrives **before** the Agent tool call is made. Once the dispatch is in flight, the call runs to completion. The dispatcher acknowledges the late skip explicitly: *"Custos is mid-walk; verdict will land in 2–3 minutes. You can override the verdict on return."* When the verdict returns, the dispatcher presents it to the Imperator with a note: *"Custos returned <verdict>; you pre-skipped. Proceed past the verdict, or honor it?"*

**Precedent framing.** The existing Praetor+Provocator and Censor+Provocator dispatches accept "skip" loosely (no formal whitelist). This Custos wiring **tightens** the recognition contract — it does not merely match the existing pattern. The tightening is intentional: explicit grammar makes operator behavior auditable. A future change may apply the same whitelist retroactively to the other dispatches; that is out of scope here.

### Returned Clean — Definition

Praetor+Provocator are "returned clean" for Custos purposes when **all** of the following hold:

1. **No MISUNDERSTANDING currently in escalation.** A MISUNDERSTANDING that was escalated to the Imperator and resolved in conversation (Imperator clarified the concept, consul revised the plan accordingly, consul recorded the resolution in `decisions.md` with type `decision`) closes the escalation. The revised plan is eligible for Custos.

   *Note: the spec does NOT require Praetor+Provocator re-dispatch on every MISUNDERSTANDING resolution. (Censor iteration-2 CONCERN evaluated and rejected with reasoning: forced re-dispatch adds significant latency for arguably small gain — Custos's walk is operational, not domain, and does not catch the same layer Praetor+Provocator do; the residual risk of a re-skinned misunderstanding is real but rare enough to handle case-by-case at the Imperator review gate, not as default policy.)*

2. **No unresolved GAPs after 2 iterations.** GAPs that the consul addressed in the auto-feed loop count as resolved. GAPs that exhausted the 2-iteration cap are escalations and disqualify the plan from Custos until the Imperator resolves them and the resolution is logged in `decisions.md`.

3. **All CONCERNs explicitly handled.** The consul has either adopted the CONCERN (with the plan revised accordingly) or recorded the rejection with reasoning per protocol section 6. **Split-verifier sub-clause:** when Praetor returns CONCERN on a surface and Provocator returns SOUND on the same surface (or vice versa), the SOUND from one verifier does NOT auto-neutralize the CONCERN from the other. The consul must explicitly handle the CONCERN (adopt or reject with reasoning), recording the resolution in `decisions.md`. Conflicting CONCERN/SOUND counts as a CONCERN for handling purposes.

4. **No plan modifications since plan verification cleared without an Imperator gate.** If the consul or the Imperator modified the plan between Praetor+Provocator clearance and Custos dispatch, the consul announces the diff to the Imperator and gets an explicit decision: re-dispatch plan verification, or proceed to Custos. The Imperator's decision is recorded in `decisions.md` (type `decision`). Silent modification is forbidden.

   **Detection mechanism.** Before dispatching Custos, the consul runs `git diff <plan-path>` (or equivalent staged-vs-committed check) and compares against the SHA the plan-verification dispatch saw. If the diff is non-empty, the gate fires. This catches both consul-driven edits (which the consul should remember) and Imperator-driven external edits (which the consul has no in-conversation signal for).

5. **Imperator overrides are recorded.** If the Imperator overrode a Praetor or Provocator finding (instructing the consul to revert a fix, accept a finding without resolution, or proceed despite an unresolved finding), the override is recorded in `decisions.md` (type `override`). The Imperator's decision is the final authority.

   **Override vs implicit acceptance.** "Override" means the Imperator explicitly directed the consul against the verifier's recommendation (e.g., *"revert that fix"* or *"proceed despite this finding"*). "Implicit acceptance" means the Imperator read the consul's summary and approved the consul's handling without overriding (e.g., *"yes that's good"*). Implicit acceptance does NOT require a separate `decisions.md` entry — the consul's handling is already in the summary. Override DOES require an entry because it is an Imperator-against-verifier decision worth preserving for future audit.

## Verdict Integration Rules

> **Confidence: Medium** — verdict-to-action mapping was stamped by the Imperator at the architectural level; verification surfaced four operational gaps in iteration 2 (override path, patch disposition, parser contract, failure modes) and additional precision gaps in iteration 3 (override matcher tolerance, malformed-list completeness, plan-modification between walks). The Medium reflects the realistic state.

Custos returns one of three verdicts. The dispatcher (the consul-as-edicts in the main session) takes the following action based on verdict:

- **`BLOCKER`** — halt the workflow. Show the Imperator the finding(s) and chain of evidence. Do not proceed to the legion-awaits handoff. The Imperator decides next steps:
  - **Patch and re-dispatch plan verification.** The consul revises, then re-runs the full Praetor+Provocator+Custos cycle.
  - **Patch and re-dispatch Custos only.** The consul revises, then re-walks Custos (counted as the one allowed re-walk under PATCH BEFORE DISPATCH semantics; a second non-OK escalates).
  - **Override and proceed.** The Imperator instructs the dispatcher to proceed to legion-awaits despite the BLOCKER. The dispatcher requires explicit confirmation: *"BLOCKER override — proceed to legion-awaits with [finding title] unresolved? Confirm with 'override confirmed.'"* The override is recorded in `decisions.md` (type `override`) with the finding text and the Imperator's confirmation. **Override matcher tolerance:** case-insensitive; trim surrounding whitespace, punctuation, and quotes; accept `override` alone, `override confirmed`, `OVERRIDE CONFIRMED`, `"override confirmed"`. Reject confirmations that contain extra content beyond punctuation/whitespace/quotes (e.g., `override confirmed, but be careful` triggers a re-prompt: *"Confirmation must stand alone. Confirm with just 'override confirmed' or restate."*).
  - **Escalate beyond the consul.** The Imperator may invoke a different skill or pause the campaign entirely.

- **`PATCH BEFORE DISPATCH`** — apply the inline patches Custos named. Then re-dispatch Custos once for a second walk with a `## Re-walk Marker` section in the prompt naming the patches applied. **This is the only re-walk permitted.** Outcomes:
  - Second walk returns `OK TO MARCH` → present the summary, proceed to "The Legion Awaits."
  - Second walk returns `BLOCKER` → halt and escalate to the Imperator. Patches stay applied to the plan on disk (no automatic revert); `decisions.md` records both walks (type `verdict` for each) and the patches applied between them. Imperator decides whether to revert the patches before next steps. If Imperator says "revert," the consul reverts via Edit tool and logs a `revert` entry in `decisions.md` referencing the prior `verdict` entry.
  - Second walk returns `PATCH BEFORE DISPATCH` again → escalate to the Imperator (treated as exhausted iterations under the Codex 2-iteration cap). Same patch-disposition rule.

  **Plan modification between the first walk and the re-walk.** The patches Custos named are the only permitted modifications between walks. The consul may NOT bundle unrelated edits (typo fixes, post-CONCERN revisions, scope expansions) into the patch round. If the consul notices an unrelated issue mid-patch, he completes the patch, lets Custos re-walk, then handles the unrelated issue afterward through normal channels (Imperator gate per "Returned Clean" point 4 if needed). The Re-walk Marker is the audit trail: every patch listed in the Marker must be Custos-mandated; presence of non-Custos-mandated edits between walks is itself a `decisions.md` entry (type `decision`) that fires the plan-modification gate retroactively.

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
3. Logs a `decisions.md` entry (type `decision`) noting the contradiction and the dispatcher's resolution.

The contradiction is a Custos report bug, not a dispatcher decision.

### Verdict Parsing Contract

The dispatcher reads the line beginning with `Verdict:` (literal prefix, case-sensitive on the prefix). The expected format in Custos's report:

```
Verdict: <BLOCKER | PATCH BEFORE DISPATCH | OK TO MARCH>
```

**Tolerance rules** (applied in order):
1. Strip leading and trailing whitespace from the entire line.
2. Strip surrounding `**` (markdown bold) from the verdict value.
3. Strip trailing punctuation (`.`, `,`, `;`, `:`, `!`, `?`) from the verdict value.
4. Whitespace between `Verdict:` and the value is optional and stripped (so `Verdict:BLOCKER`, `Verdict: BLOCKER`, and `Verdict:  BLOCKER` all parse the value as `BLOCKER`).
5. Match the resulting value against the three exact uppercase strings.

**Parser scope:** the parser scans Custos's report top-to-bottom. Lines inside fenced code blocks (between ` ``` ` markers) are **ignored** to avoid demonstration-line collisions. The first matching `Verdict:` line outside a code fence is authoritative.

**Malformed cases** (treated as `BLOCKER` + escalate, with note *"Custos verdict malformed — treated as BLOCKER, full report attached"*):
- Missing `Verdict:` line outside any code fence.
- Multiple `Verdict:` lines outside code fences (ambiguous).
- Lowercase or mixed-case verdict value (`blocker`, `Blocker`).
- Verdict value with extra content beyond strippable punctuation/whitespace/bold (`BLOCKER (with caveats)`, `BLOCKER for now`, `BLOCKER OK TO MARCH`).
- Markdown-bold around the prefix (`**Verdict:**`) — the prefix match is case-sensitive on `Verdict:` literal; bolded prefix does not match.
- Verdict line with a value that is none of the three accepted strings.

The template's `## Output Format` section enforces this contract by requiring the `Verdict:` line and naming the three exact values. The dispatcher's strictness protects the Imperator from silently misrouted dispatches.

### Failure / Abort Handling

The Custos dispatch can fail in operational ways that are not verdicts:

- **Non-return** (subagent crash, OOM, network timeout, infinite loop): the dispatcher detects non-return via the Agent tool's completion signal. **Distinguish completion vs partial-result-with-failure:** if the Agent tool returns `failed` with a partial body, the dispatcher first attempts to parse a verdict from the partial body per the Verdict Parsing Contract. If a valid verdict parses, it is honored with a note (*"Custos failed mid-report; verdict parsed from partial output"*). If no valid verdict parses, treat as non-return: `BLOCKER` + escalate with note (*"Custos dispatch did not return — treated as BLOCKER, no verdict available"*). The Imperator decides whether to retry or override.
- **Mid-dispatch skip**: see "Skip Syntax" above. Skip is honored only before the Agent tool call fires. Once in flight, the dispatcher acknowledges explicitly (*"Custos is mid-walk; verdict will land in 2–3 minutes"*) and on Custos return presents the verdict with a note (*"You pre-skipped. Proceed past the verdict, or honor it?"*). The Imperator decides — the dispatcher does not auto-discard.
- **Re-walk inheritance**: the second walk after `PATCH BEFORE DISPATCH` inherits the same failure semantics — non-return on the second walk treats as `BLOCKER` + escalate. There is no re-re-walk.
- **Session termination**: if the main session terminates during a Custos dispatch (Imperator closes the conversation, host process killed, network drops), the in-flight Agent tool call is orphaned. On session resumption, the consul checks `decisions.md` for a `verdict` entry matching the current case and plan SHA. If absent, the consul announces the missing record to the Imperator and asks: *"Custos dispatch from prior session has no recorded verdict. Re-dispatch, or proceed without?"* The Imperator decides; either choice is logged in `decisions.md`.

### Re-walk Marker — Schema

The `## Re-walk Marker` section in the second-walk dispatch prompt contains **only** unified diff hunks. No prose, no attribution, no rationale.

**Format:**

```
## Re-walk Marker

@@ -<orig-line>,<orig-len> +<new-line>,<new-len> @@
 <unchanged context line>
-<removed line>
+<added line>
 <unchanged context line>

@@ -<orig-line>,<orig-len> +<new-line>,<new-len> @@
...
```

(Standard `git diff` unified-hunk format. Multiple hunks separated by blank lines.)

**Allowed content:** diff hunks showing the patches applied between the first and second walk. Line numbers reference the plan file. Context lines (unchanged) provide enough surrounding context for Walk 6 to detect cross-references that became stale.

**Forbidden content:**
- No attribution to verifiers (no "Custos finding 1," no "addresses prior issue").
- No rationale text (no "this fixes the unquoted bracket-path issue").
- No reference to finding categories (no MISUNDERSTANDING/GAP/CONCERN/SOUND tags).
- No commentary on intent.

The diff is the marker. Walk 6 reads the diffs to detect stale wording in the unmodified surrounding sections; the diffs themselves are revision metadata, not framing about prior findings. An implementing soldier who adds prose to the marker has violated the schema, and the spec's Independence claim collapses — so the schema is hard, not advisory.

**Independence framing.** The Codex's Independence Rule prohibits passing the verifier "the raw conversation," "the consul's framing," or "prior verifier findings." The Re-walk Marker passes none of these — it passes diff hunks of the artifact itself. This is a **Custos-specific carve-out** of the Independence Rule, not a Codex amendment. The carve-out is justified by Custos's Walk 6 design (which requires revision metadata to operate); a future Codex update may formalize the carve-out as an Independence sub-rule, but that is out of scope here. The carve-out applies only to the second-walk dispatch and only to diff-hunk content; no other Custos input expands the Independence-allowed list.

## Invariants the Implementation Must Preserve

> **Confidence: High** — every invariant either mirrors an explicit Imperator decision, an existing protocol rule, or Custos's own agent definition.

- **Sequential, not parallel.** Custos runs after Praetor+Provocator have completed and their findings are resolved. He is the LAST gate by design and must not be dispatched alongside earlier verifiers.
- **No bypass when plan verification is in escalation.** If the Praetor+Provocator dispatch escalated to the Imperator (currently-active MISUNDERSTANDING or unresolved GAP after 2 iterations), Custos does NOT run. "Currently-active" means not yet resolved by Imperator conversation + consul revision + `decisions.md` recording; resolved-and-recorded escalations clear the gate per "Returned Clean — Definition."
- **Skippable matches the existing pattern (tightened).** The Imperator can say "skip" (per "Skip Syntax") to bypass Custos. The recognition contract is stricter than the existing Praetor+Provocator pattern, but the spirit (operator can opt out) is the same.
- **Re-walk once on `PATCH BEFORE DISPATCH`.** Maximum one re-dispatch after patches are applied. A second non-`OK TO MARCH` verdict escalates.
- **Plan modification triggers an Imperator gate at every window.** Silent modification between plan-verification clear and Custos dispatch is forbidden (point 4 of "Returned Clean"). Modification between the first Custos walk and the re-walk is restricted to Custos-mandated patches only (no consul-bundled extras). Modification after BLOCKER halt or override is logged in `decisions.md`.
- **Imperator overrides are recorded** in `decisions.md` (type `override`). Implicit acceptance (Imperator agreed with consul handling) does not require a separate entry.
- **Independence Rule holds.** Custos receives plan, spec, doctrine excerpts (or pointers), the structured context summary, and (on re-walk only) a `## Re-walk Marker` containing diff hunks per the schema above. He does not receive: the raw conversation, the Praetor's or Provocator's findings, or the consul's framing of the plan-verification cycle.
- **Verdict line is authoritative.** On verdict-vs-finding-tag contradiction, the dispatcher honors the verdict and flags the contradiction in `decisions.md` (type `decision`).
- **The plan template is unchanged.** This work edits the dispatch flow, not the plan format. Plans authored before this wiring still pass through cleanly; plans authored after still match the existing structure. The "Authoring Awareness" addition raises the content bar (zsh-quoting, env classification) but does not modify the template schema.
- **The Custos agent file is unchanged.** All edits happen in the dispatcher (`edicts` skill), the verification reference layer (template + protocol), and the case-file convention (CONVENTIONS amendment). Custos's agent definition, his Six Walks, his verdict format, and his Do Not Widen discipline remain exactly as forged in the 2026-04-24 mirror case.
- **The Codex remains the source of truth for finding categories.** The three-verdict overlay (`BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`) is dispatcher-action mapping, not a replacement for the four Codex categories. The Re-walk Marker carve-out is Custos-specific and does not amend the Codex.
- **`decisions.md` is append-only.** Entries are never edited or removed once written. Corrections are new entries of type `revert` referencing the prior entry.

## Hard Scope Constraints

> **Confidence: High** — every constraint was either explicitly stated by the Imperator or follows directly from the agreed scope.

- Do not wire Custos into the `consul` skill (spec-side dispatch). The Imperator confirmed plan-side wiring only.
- Do not wire Custos into the `legion` or `march` skills. The dispatch happens in `edicts`, before the Legatus takes the plan.
- Do not modify the existing Praetor+Provocator dispatch in `edicts` beyond inserting the new phase after it. The existing flow stays intact.
- Do not modify Custos's agent file at `~/.claude/agents/consilium-custos.md` or his canonical persona at `claude/skills/references/personas/custos.md`. The dispatcher conforms to him, not him to the dispatcher.
- Do not change the Codex auto-feed loop, the Independence Rule, or the four finding categories. Custos's verdict overlay is additive; the Re-walk Marker is a Custos-specific carve-out, not a Codex amendment.
- Do not introduce a new finding category. The three Custos verdicts are dispatcher hints, not Codex finding categories.
- Do not propagate the verdict overlay (`BLOCKER` / `PATCH BEFORE DISPATCH` / `OK TO MARCH`) into other skills or agents as a system-wide vocabulary. The verdict is local to the Custos dispatch and its dispatcher action.
- Do not retroactively apply the `decisions.md` artifact to all existing case folders. The CONVENTIONS amendment makes it available going forward; backfilling is a separate change.
- Do not retroactively tighten the skip-syntax whitelist on existing Praetor+Provocator and Censor+Provocator dispatches. The tightening applies only to the Custos dispatch in this work; broader application is a separate change.
- Do not edit `claude/CLAUDE.md` for this work unless the implementation discovers that a maintenance section claim is now inaccurate (e.g., a count of dispatching skills). If found, name the discrepancy in the plan and patch it; otherwise leave `CLAUDE.md` alone.

## Open Architectural Decisions Resolved (with confidence)

> **Confidence: Medium** — most decisions held under verification (1–8); Decision #9 was rewritten in iteration 2 after the Provocator caught a load-bearing collision, then again in iteration 3 with an explicit schema for the Re-walk Marker. The Q1/Q2/Q3 dispositions are recorded in `decisions.md` for this case.

1. **Single-agent template, not paired.** Custos goes alone. The structural precedent is `templates/mini-checkit.md` (single-agent dispatch of the Tribunus during execution) — this is the only existing single-agent template. The four other templates (`spec-verification.md`, `plan-verification.md`, `tribune-verification.md`, `campaign-review.md`) all pair a focused verifier with the Provocator; they are format precedents (When to Dispatch / Agents / Dispatch / After) but not structural precedents for single-agent dispatch. Custos is structurally different from the parallel-pair templates — operational, not adversarial — and pairing him would either duplicate his walks or pollute his fresh-eyes discipline.

2. **Default-on with Imperator skip, recognized via tightened whitelist.** Imperator confirmed: *"skippable, match the pattern."* The recognition contract is stricter than the existing pattern — explicit grammar makes operator behavior auditable. See "Skip Syntax."

3. **Re-walk once on `PATCH BEFORE DISPATCH`.** Imperator confirmed: *"re-walk once."* Patches can introduce new shell/env issues — Custos's whole purpose is catching those — so the re-walk is not theatrical. This is **deliberately conservative** — the Codex's auto-feed loop permits up to 2 iterations; Custos uses one because his domain (operational verification of patch artifacts) does not benefit from additional rounds.

4. **Sequential after Praetor+Provocator.** Custos's own description names this placement. The verdict integration depends on plan verification having completed cleanly (per "Returned Clean — Definition").

5. **No bypass when plan verification is in escalation.** Implicit in sequential design. Made explicit in the spec to prevent the implementation from queueing a Custos dispatch that the Imperator is mid-resolving.

6. **Protocol dispatch table row added, not the entire protocol restructured.** Section 2 of `protocol.md` is a flat lookup table; one new row is the minimum-impact change.

7. **Template lives at `templates/custos-verification.md`.** Naming follows the existing convention.

8. **Domain Knowledge passed by reference, not pre-loaded.** Custos has Read and Bash access; he reads `$CONSILIUM_DOCS/doctrine/known-gaps.md` directly during Walk 4. Pre-loading is permitted by the protocol but adds dispatch-time tokens with no quality gain. If `$CONSILIUM_DOCS` is missing or malformed at dispatch time, Custos halts per his own Operational Notes; the halt is the correct fail-safe (pre-loading would mask the problem rather than surface it).

9. **Re-walk includes a `## Re-walk Marker` containing only diff hunks; the Independence Rule is preserved at the conversation level via a Custos-specific carve-out.** Imperator stamped Q2 (diff hunks only). The carve-out is justified by Walk 6's design requirement for revision metadata; a future Codex update may formalize the carve-out as an Independence sub-rule, but that is out of scope here. The carve-out applies only to the second-walk dispatch and only to diff-hunk content per the schema in "Re-walk Marker — Schema."

10. **`decisions.md` is the audit substrate.** Imperator stamped Q1 (option A — amend CONVENTIONS to add the artifact). The amendment is small (~10 lines), the schema is minimal, and the pattern serves all future cases, not just this one. The architectural payoff is meaningful: every override, verdict, and consequential decision now has a programmatic recording surface separate from the spec.

11. **MISUNDERSTANDING resolution does not require Praetor+Provocator re-dispatch.** Imperator silence on Q3 = no objection to consul recommendation. The Censor's iteration-2 CONCERN is rejected with reasoning: forced re-dispatch on every MISUNDERSTANDING resolution adds significant latency for arguably small gain; Custos's walk is operational, not domain; the residual risk of re-skinned misunderstanding is real but rare enough to handle case-by-case at the Imperator review gate.

## Verification Expectations

> **Confidence: High** — these are mechanical applications of the existing verification protocol to this work, with smoke tests sized to cover the failure modes verification surfaced across iterations 1–3.

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions) and `consilium-provocator` (failure modes, brittle assumptions, overconfidence) in parallel before `/march` or `/legion` executes it. Findings handled per the Codex auto-feed loop. The plan must include:

- **Manual smoke test 1 — happy path.** Author a trivial single-task plan, dispatch Praetor+Provocator (should clear), confirm Custos dispatch fires automatically, confirm `OK TO MARCH` verdict is presented to the Imperator with attribution and proceeds to "The Legion Awaits."
- **Manual smoke test 2 — skip flag, full whitelist.** Author a trivial plan; for each accepted skip phrase (`skip`, `skip custos`, `no`, `no custos`, `no, skip`, `nope`, `cancel`, `none`, `don't`, `stop`), confirm bypass; for each vague phrase (`not now`, `maybe later`, `up to you`), confirm the clarification line fires; for an unrecognized non-vague reply (`go ahead`, `proceed`), confirm dispatch fires.
- **Manual smoke test 3 — `BLOCKER` path with override.** Author a plan with a deliberately broken bash block (e.g., unquoted `[id]` glob), confirm Custos returns `BLOCKER` with chain of evidence, confirm the workflow halts and presents the finding. Test override across the matcher tolerance: `override confirmed`, `OVERRIDE CONFIRMED`, `override`, `"override confirmed"`. Confirm each is accepted, the dispatcher proceeds to legion-awaits, and `decisions.md` records the override (type `override`) with the finding text.
- **Manual smoke test 4 — `PATCH BEFORE DISPATCH` re-walk happy path.** Author a plan with a fixable issue (e.g., stale wording from a revised section), confirm first walk returns `PATCH BEFORE DISPATCH`, confirm patch is applied, confirm re-walk fires once with `## Re-walk Marker` containing only diff hunks (no prose, no attribution), confirm second walk returns `OK TO MARCH`. Verify the Marker conforms to the schema by inspection.
- **Manual smoke test 5 — `PATCH BEFORE DISPATCH` re-walk failure with revert.** Author a plan that triggers `PATCH BEFORE DISPATCH` on first walk but a different issue on the patched plan. Confirm second walk returns `BLOCKER`, confirm escalation to Imperator, confirm patches stay applied on disk, confirm `decisions.md` records both walks (type `verdict`). Imperator says "revert" — confirm consul reverts via Edit and logs a `revert` entry referencing the prior `verdict` entry.
- **Manual smoke test 6 — plan modification gate.** Author a plan, complete Praetor+Provocator clearance, then modify the plan via `git diff`-detectable edit. Confirm the dispatcher detects the diff, announces it to the Imperator, and waits for the gate decision before dispatching Custos. Confirm `decisions.md` records the gate decision (type `decision`).
- **Manual smoke test 7 — verdict parser, all enumerated cases.** Manually craft Custos responses with each malformed verdict from the contract: missing `Verdict:` line; multiple `Verdict:` lines (outside code fences); lowercase value (`Verdict: blocker`); extra content (`Verdict: BLOCKER (with caveats)`); `**Verdict:**` (bold prefix); verdict line inside a code fence (parser must ignore). Confirm each is treated as `BLOCKER` + escalate per the contract. Also test well-formed cases the contract accepts: `**BLOCKER**` (bold value), `BLOCKER.` (trailing punctuation), `Verdict:BLOCKER` (no space after colon). Confirm each parses correctly.
- **Manual smoke test 8 — non-return / partial-result.** Simulate a Custos dispatch that returns `failed` with no body; confirm `BLOCKER` + escalate. Simulate a partial body containing a valid `Verdict:` line; confirm the verdict parses with the failure note. Simulate a partial body with no parseable verdict; confirm `BLOCKER` + escalate.
- **Manual smoke test 9 — session termination resumption.** Start a Custos dispatch, terminate the session before completion. On next session, confirm the consul detects the missing `decisions.md` verdict entry, prompts the Imperator, and logs the resolution.
- **Tribune staleness check pass as a final gate.** Run `python3 scripts/check-tribune-staleness.py` and confirm clean.
- **Codex drift check pass as a final gate.** Run `python3 scripts/check-codex-drift.py` and confirm clean. This change does not modify the canonical Codex or any agent's Codex section.
- **CONVENTIONS lint** (if a check exists; if not, manual review): confirm the new "Audit Artifacts" section parses cleanly and the `decisions.md` schema example is valid Markdown.

**Latency note.** This wiring inserts a sequential dispatch between Praetor+Provocator and the legion-awaits handoff. For trivial plans where Praetor+Provocator clear in seconds, the additional Custos dispatch adds visible wait time. The smoke tests will reveal whether the cumulative latency is acceptable. If not, the Imperator may invoke "skip Custos" as a per-session override; the long-term answer (parallel-with-presentation dispatch) is out of scope here.

**Steady-state note.** The Authoring Awareness addition aims to reduce Custos's catch rate over time as plan authors internalize his quoting/env discipline. **A Custos that stops firing is the system working, not failing** — the long-term success metric is "Custos's catch rate decreases as Authoring Awareness internalizes," not "Custos catches issues every time." The Imperator should expect (and welcome) declining intervention rates over weeks of use. If the rate stays at zero for an extended period, that is a signal to revisit whether the dispatch is still earning its latency cost — a separate evaluation, out of scope for this spec.

## Out of Scope (named explicitly so the verifiers do not flag them as gaps)

> **Confidence: High** — every out-of-scope item was either explicitly excluded by the Imperator during deliberation or is a known follow-on that does not belong in this work.

- Wiring Custos into `consul` (spec-side dispatch). Imperator confirmed plan-side only.
- Wiring Custos into `legion` or `march`. Dispatch happens in `edicts`, before the Legatus.
- Adding a `field-check-this` slash command for standalone Custos dispatch.
- Standalone "field check this" interaction with the auto-dispatch path. Custos's standalone callability via the Agent tool is unaffected by this wiring.
- Modifying Custos's agent file or his canonical persona.
- Adding Custos to the Campaign Review template.
- Pre-loading `$CONSILIUM_DOCS` doctrine excerpts into the Custos dispatch prompt beyond naming the relevant files.
- Changing the four Codex finding categories.
- Cross-skill propagation of the verdict overlay.
- Re-running Praetor+Provocator after a Custos `BLOCKER` or escalated `PATCH BEFORE DISPATCH` automatically.
- Latency optimization (parallel-with-presentation dispatch, predictive pre-walking).
- Automatic patch revert on second-walk `BLOCKER`.
- Backfilling `decisions.md` for existing case folders. The CONVENTIONS amendment makes the artifact available going forward; populating historical cases is a separate change.
- Tightening the skip-syntax whitelist on the existing Praetor+Provocator and Censor+Provocator dispatches. The tightening is Custos-only in this work.
- Formalizing the Re-walk Marker carve-out as an Independence sub-rule in the Codex. The carve-out is documented and Custos-scoped; Codex amendment is a separate deliberation.
- Forcing Praetor+Provocator re-dispatch on MISUNDERSTANDING resolution. Censor iteration-2 CONCERN was evaluated and rejected; case-by-case Imperator review at the existing gate is the chosen policy.
- Long-term re-evaluation of Custos's dispatch when the catch rate stays at zero. The "Steady-state note" surfaces the question; the policy is a separate evaluation.
