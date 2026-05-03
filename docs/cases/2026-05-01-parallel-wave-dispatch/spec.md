# Parallel-Wave Dispatch

**Date:** 2026-05-01
**Status:** Draft, local verification pass complete; implementation not started
**Campaign:** Consilium tightening, campaign 5 of 6

**Lineage.** Originally named "phalanx surfacing" in `.planning/2026-05-01-consilium-tightening-briefing.md`. Renamed during Consul deliberation when reconnaissance revealed that the original brief's premise — "/phalanx is rarely invoked because Edicts plans are written sequentially by default" — understated the real failure mode. /phalanx today is debug fan-out framing that duplicates Tribunus's diagnosis stance, and the implementation pipeline never routes to it. Surfacing parallel waves upstream without a redefined consumer would be theater. This campaign therefore expanded scope to include rewriting /phalanx's body. The rename reflects the expanded scope: not just visibility, but a real parallel-dispatch path through the Consilium.

---

## 1. Goal

Make parallel-wave dispatch a real, used path in the Consilium toolchain. Two coupled halves:

1. **Visibility upstream.** Parallel-wave opportunities surface at deliberation (Consul Estimate-lite Coordination subsection) and at the plan stage (Edicts plan-header callout). Praetor's verification ensures the wave's safety claims are true.
2. **Executability.** /phalanx is rewritten from its current debug fan-out framing to implementation parallel dispatch. /phalanx becomes the dispatch skill for plans declaring a parallel-safe wave, sitting between /march (single-Legatus, sequential, small tasks) and /legion (centurio-per-task with Tribunus-between, big complex tasks).

The result: the Imperator can choose parallel implementation dispatch when tasks warrant it. The choice is informed by the plan's own declaration. Praetor's verification ensures the choice is safe.

**Confidence: High** — Imperator authorized both halves explicitly during deliberation.

---

## 2. Background and Motivation

### 2.1 Why /phalanx today is unused

The current `source/skills/claude/phalanx/SKILL.md` is debug fan-out framing. Its "Use when" block names test failures, broken subsystems, race conditions. The example is a debugging session. The skill duplicates Tribunus, which is the Consilium's diagnosis-stance role — `/tribune` is invoked for single-bug diagnosis, and the Imperator manually invokes /tribune in parallel sessions for multi-bug cases. /phalanx-as-debug occupies a slot that already has an owner.

The implementation pipeline never routes to /phalanx. The Consul's debug-routing protocol hands bug reports to /tribune, not /phalanx. /legion handles parallel implementation work via Legatus tactical judgment ("Parallel is permitted only when tasks are genuinely independent, by my judgment" — `legion/SKILL.md:326`). /march is pure-sequential and cannot dispatch parallel centurios at all. /phalanx therefore has no slot in either the diagnosis pipeline (Tribunus owns it) or the implementation pipeline (legion + march cover it).

### 2.2 Why the toolchain needs a parallel-dispatch slot for implementation

The toolchain has a real gap. /march works for small tasks where centurio-dispatch overhead is wasteful. /legion works for big complex tasks where centurios must be coordinated and verified between each step (Tribunus-after-each-task). Neither is right for plans where multiple non-trivial tasks are genuinely independent and parallel-safe — the case where /legion's between-task Tribunus discipline is overkill (no task builds on another's output), but /march's single-Legatus self-execution is too thin (each task is large enough to warrant a fresh centurio context).

This is the slot /phalanx redefined fills: parallel implementation dispatch for plans declaring a parallel-safe wave, with per-wave Tribunus verification post-execution.

### 2.3 Why the upstream-visibility half is necessary

A redefined /phalanx alone is not enough. Plans today are written sequentially by default. /legion's parallelism is Legatus tactical judgment, not plan-declared. The Imperator has no signal upstream that parallelism is a real option until a Legatus exercises judgment mid-execution. By that point the dispatch has already happened and the question is moot.

Surfacing the parallel-wave opportunity at deliberation (Consul Estimate-lite) and at the plan stage (Edicts plan header) gives the Imperator the choice consciously, before dispatch. Praetor's wave-callout verification ensures the choice is grounded in evidence (per-task `**Files:**` blocks per campaign 3a's contract), not Consul's optimism or the plan-writer's enthusiasm.

**Confidence: High** — failure-mode diagnosis confirmed via reconnaissance (Speculator Primus, 2026-05-01) of `phalanx/SKILL.md`, `legion/SKILL.md`, and `march/SKILL.md`.

---

## 3. Non-goals

This spec stays explicitly out of:

- **Per-task `wave:` field.** The wave callout is a single-line narrative observation in the plan header, not per-task metadata.
- **Action Tier system, Owner field schema, dependency graph metadata, rollback field, topology system.** All banned by `2026-04-30-consilium-right-sized-edicts` Section 12. This campaign is the "separately approved case" that section anticipated. Permitted shape: plain-language narrative observation in plan prose. The wave callout passes that test.
- **Multi-wave-in-one-plan.** Multi-wave campaigns decompose at spec stage via the existing Estimate-lite trigger #2 ("Coordination shows gated waves"). Each plan carries one wave callout, maximum. This keeps /phalanx's body single-wave and avoids stateful inter-wave orchestration logic.
- **Automatic /phalanx invocation.** /legion and /march surface the wave-callout to the Imperator as a one-line prompt. The Imperator dispatches.
- **Plan Writer agent.** Future option, deferred. Trigger criteria recorded in §13.
- **Multi-bug parallel diagnosis.** /phalanx drops the debug-fanout framing entirely. Multi-bug parallel diagnosis remains the Imperator manually invoking /tribune in parallel sessions, as today. If it becomes a recurring need, a separate Tribunus-fanout skill is the right shape — not /phalanx. That decision belongs to a different spec.
- **3a's Files-block contract definition.** This spec consumes 3a's merged contract by reference. Campaign 3a owns its contract definition.
- **New ranks, new agents, new verifier roles, new model-routing or diagnosis-routing changes.** None of these are needed. The existing roles (Consul, Speculator, Censor, Provocator, Praetor, Tribunus, Legatus, Centurio) cover this campaign with body amendments only.

**Confidence: High** — all non-goals stated explicitly by the Imperator or derived directly from the right-sized-edicts ban.

---

## 4. The Wave Callout — Contract

### 4.1 Format

A single-line declarative observation in the plan header:

```
**Parallel-safe wave:** tasks <comma-separated task numbers> — Files-block write sets are disjoint, `Read:` entries declared and non-overlapping with sibling writes.
```

**Position.** In the plan header, immediately after the `**Implementation Shape:**` block and before `**Scope In:**`. The existing `**Scope In:**`, `**Scope Out:**`, and `**Verification:**` fields remain in their normal positions before the `---` separator that introduces the task list.

**Optionality.** Present only when **all** of the following hold per campaign 3a's `**Files:**`-block contract:

1. 2+ tasks have disjoint **Files-block write sets** — the union of paths under `Create:` + `Modify:` + `Test:`, file-path level (any line-range suffix on `Modify:` is ignored for disjointness; two tasks editing different ranges of the same file still conflict).
2. Each candidate wave-task carries an **explicit `Read:` sub-bullet** in its `**Files:**` block. Per 3a's interface, absent `Read:` declarations are treated as **conservative read-anywhere** for parallel-safety analysis — a wave-task with no `Read:` entries is presumed to read every other wave-task's writes and is therefore NOT parallel-safe.
3. No wave-task's `Read:` patterns overlap any sibling wave-task's writes set under glob-matches-path semantics (per 3a: `*` within segment, `**` crosses dirs).
4. No two wave-tasks invoke the same recognized canonical generator command (per 3a's C5 list — currently `python3 runtimes/scripts/generate.py` and `bash codex/scripts/install-codex.sh`). Two wave-tasks running the same generator race on derived outputs even when their declared write sets are disjoint.

When any condition fails, the callout is omitted. Single-task plans, fully sequential plans, and plans with marginal disjointness do not carry the callout.

**Cardinality.** **One wave callout per plan, maximum.** Multi-wave campaigns decompose at spec stage (Estimate-lite trigger #2). Plans with multiple wave structures are not allowed; Edicts halts and refers to spec-stage decomposition.

### 4.2 Why narrative, not metadata

The right-sized-edicts spec banned wave metadata — per-task `wave:` fields, topology systems, structured wave-execution machinery. The callout in this spec passes the ban because:

- It is plain prose, not a structured field schema.
- It is at the plan level, not per-task. The per-task contract substrate (Files-block write set, `Read:` entries, generator-run carve-out) is 3a's `**Files:**`-block contract, not this spec's.
- It is informational for the Imperator and an evidentiary anchor for Praetor — not a runtime data structure consumed by tooling.
- Praetor reads the callout in human-readable form and cross-references against per-task `**Files:**` blocks (3a's contract surface).

The format anchors at one line for two reasons. First, scannability — /legion, /march, and the Imperator all read the plan header; the callout must be unmissable without dominating. Second, ban-compliance — anything more elaborate (multi-line YAML-like structures, indented sub-fields) crosses into the "metadata regime" territory the right-sized-edicts spec explicitly forbade.

### 4.3 Example

A plan whose tasks 1, 2, and 3 touch disjoint files and explicitly declare their read entries:

```markdown
**Implementation Shape:** Three independent surface amendments — Consul Estimate-lite, Edicts plan template, Praetor verification. No surface reads another's output.

**Parallel-safe wave:** tasks 1, 2, 3 — Files-block write sets are disjoint, `Read:` entries declared and non-overlapping with sibling writes.

**Scope In:** [...]
```

Each of tasks 1, 2, 3 carries a `**Files:**` block with explicit `Create:`/`Modify:`/`Test:` paths and an explicit `Read:` sub-bullet — the wave callout is grounded in those task-level declarations.

**Confidence: High** — format aligned with 3a's actual `**Files:**`-block contract and Imperator's option-B placement.

---

## 5. Estimate-lite Coordination Amendment

The Estimate-lite section of `source/skills/claude/consul/SKILL.md` Phase 3 (Codification) has six bullets: Intent, Effects, Terrain, Forces, Coordination, Control. The Coordination bullet today is described in `2026-04-29-consul-brief-estimate-lite/spec.md` as "What can run in parallel. What must sequence. What requires an Imperator gate." but the live SKILL.md gives the Consul no prose guidance for what to write inside it.

This spec expands Coordination with a **Parallel waves** clause. Consul names anticipated parallel-safe groupings during synthesis, before Edicts produces the plan and before per-task `**Files:**` write sets exist.

### 5.1 What Consul writes

In Coordination, Consul names one of three states:

- **No parallel structure.** "Parallel waves: none — single-task work" or "Parallel waves: none — fully sequential dependency chain" with a brief reasoning line.
- **Anticipated parallel-safe wave.** When Consul's reading of the spec's Effects and Terrain reveals 2+ tasks that touch disjoint surfaces and have no anticipated read-of-other. Format: "Anticipated parallel-safe wave: <task descriptions> — Effects on disjoint surfaces; no read-of-other anticipated."
- **Multi-wave structure with sequential gate.** When Consul identifies Wave 1 → Wave 2 with a hard gate between them, this is the existing Estimate-lite **decomposition trigger #2** ("Coordination shows gated waves"). Consul halts spec-writing and proposes decomposition into separate specs (one per wave-set), per existing doctrine.

### 5.2 Why anticipatory, not evidentiary

At Estimate-lite stage, Consul has the spec's Effects and Terrain only. Edicts has not run; per-task `**Files:**` write sets do not yet exist. Consul's wave naming is **anticipatory** — judgment based on disjoint Effects surfaces. The Edicts plan-header callout is **evidentiary** — confirmed against 3a's Files-block write sets per task.

The two stages can disagree. Consul anticipates a parallel-safe wave of A, B, C; Edicts produces a plan where B reads A's output. Praetor catches the divergence; the plan-writer omits the callout. The Estimate-lite anticipation was wrong; that is acceptable — anticipation is judgment, not promise. The spec is not invalidated by an anticipation that didn't survive plan-stage evidence.

The Consul SKILL.md text must name this stage distinction explicitly so the Consul does not pretend to evidentiary certainty during Estimate-lite synthesis.

**Confidence: High** — the anticipatory/evidentiary distinction was surfaced and confirmed during deliberation; the decomposition fallback uses existing trigger #2.

---

## 6. Edicts Plan-Template Amendment

The plan template in `source/skills/claude/edicts/SKILL.md` (lines 148-178 per recon) defines the plan header: Goal, Plan Scale, Implementation Shape, Scope In, Scope Out, Verification, then `---` separator. This spec adds the wave-callout slot and one-wave-per-plan enforcement.

### 6.1 Header amendment

The plan template gains an **optional** wave-callout line, positioned after `**Implementation Shape:**` and before the `---` separator. Format per §4.1.

The plan-writer's guidance (Edicts skill body) names the four conditions for declaring the callout (per §4.1, derived from 3a's `**Files:**`-block contract):

1. 2+ tasks have disjoint Files-block write sets (`Create:` + `Modify:` + `Test:` union; file-path level).
2. Each candidate wave-task carries an explicit `Read:` sub-bullet — absent reads default to conservative read-anywhere per 3a, which disqualifies the wave.
3. No wave-task's `Read:` patterns overlap any sibling's writes under glob-matches-path semantics.
4. No two wave-tasks invoke the same recognized canonical generator command (per 3a's C5).

The plan-writer's guidance also makes explicit: **the wave callout is opt-in via Reads declaration.** A plan whose tasks happen to have disjoint writes but no `Read:` declarations does not declare a wave — that is correct safety discipline, not an oversight. If the plan-writer wants /phalanx, the plan-writer declares per-task `Read:` sub-bullets so Praetor can verify parallel-safety. The conservative-read-anywhere fallback is the safety floor; the wave callout is what the plan-writer earns by declaring reads.

When all four conditions hold, the plan-writer declares the callout. Otherwise, the plan-writer omits it. The plan-writer does not declare aspirational callouts — Praetor will catch overlapping writes, reads-of-other, missing Read declarations, or generator-run conflicts and report GAP.

### 6.2 One-wave-per-plan enforcement

Edicts enforces a hard rule: **at most one wave callout per plan.** If during plan-writing the Edicts author identifies a multi-wave structure (Wave 1 → Wave 2 with sequential gate), Edicts halts and refers to spec-stage decomposition.

The expectation is that this check rarely fires at plan-stage, because Estimate-lite trigger #2 should have caught multi-wave structure during synthesis and decomposed into separate specs. Plan-stage detection is the fallback for cases the Consul missed during anticipation.

### 6.3 Plan-writer guidance prose

The Edicts skill body adds a short paragraph adjacent to the existing plan-header instructions, describing when to declare the callout, the format, the writes-disjointness condition, and the one-wave-per-plan rule. The paragraph is prose, not a checklist or schema.

**Confidence: High** — direct application of the Imperator's stated preference.

---

## 7. Praetor Verification Amendment

Praetor today verifies sequential feasibility — dependency chains, file collisions, decision completeness, spec coverage (per `source/roles/praetor.md` and `source/skills/claude/references/verification/templates/plan-verification.md`). Praetor has no parallel-safety check today.

Campaign 3a amends Praetor's mission with a **Files-block well-formedness check** (3a's S3) plus a **dormant disjointness hook** (3a's C6) — *if a plan declares parallel-safe task groups (a future capability owned by sister campaigns), `Create:`/`Modify:`/`Test:` paths must be disjoint within each declared group.* This spec is the sister campaign that activates that hook by defining the wave-callout syntax, and extends Praetor's mission with the additional checks below.

### 7.1 The wave-callout validation check

When the plan header contains a **Parallel-safe wave** callout, Praetor performs the following checks against each wave-task's `**Files:**` block (3a's contract surface):

1. **Wave-callout syntax recognition.** Praetor parses the callout line, extracts the task list, and confirms each named task exists in the plan body. A malformed callout (parse failure, unknown task number) → **GAP**.
2. **Writes-set disjointness.** For each pair of tasks (M, N) in the wave, Praetor computes the writes set as the union of paths under `Create:` + `Modify:` + `Test:` and intersects pairwise at file-path level (any line-range suffix on `Modify:` is ignored). Non-empty intersection → **GAP**. (This is 3a's dormant C6 hook activated by the wave callout.)
3. **Reads declaration presence.** Each named wave-task must carry an explicit `Read:` sub-bullet in its `**Files:**` block. A wave-task with no `Read:` triggers 3a's conservative read-anywhere fallback, which disqualifies the wave. → **GAP**.
4. **Read-write overlap (sequential dep within the wave).** For each pair (M, N) in the wave, Praetor checks whether Task M's `Read:` patterns overlap Task N's writes set under glob-matches-path semantics (per 3a: `*` matches within a single segment; `**` crosses directory boundaries). Any overlap → **GAP** (Task M reads what Task N writes; wave is not parallel-safe).
5. **Generator-run conflict.** For each pair (M, N) in the wave, Praetor checks whether both tasks invoke the same recognized canonical generator command per 3a's C5 list (currently `python3 runtimes/scripts/generate.py` and `bash codex/scripts/install-codex.sh`). Two wave-tasks running the same generator race on derived outputs even when their declared writes sets are disjoint. → **GAP**.

Checks 2 and 4 presume each wave-task's `**Files:**` block is well-formed per 3a's S3 check. If 3a's well-formedness check has already reported GAPs against the block (missing block, unknown sub-bullet, glob in writes, malformed `(none)` marker), those findings dominate — this spec's checks operate on well-formed `**Files:**` blocks only.

### 7.2 Findings handling

Findings follow the standard four-category protocol (per `Codex` doctrine):

- **GAP** — any of checks 1–5 fails. Reported with evidence and the specific check that failed; the Edicts plan-writer revises (correct the wave callout, declare missing reads, split conflicting tasks, etc.).
- **CONCERN** — Praetor sees a plausible parallel-safe structure in a plan that did not declare a wave callout. Advisory; non-blocking. Praetor does not author wave callouts; the plan-writer does. CONCERN is the suggestion that the plan-writer reconsider.
- **SOUND** — wave callout's claims hold against the `**Files:**`-block evidence under all five checks. Reasoning required.
- **MISUNDERSTANDING** — Edicts plan-writer demonstrably does not understand the wave-callout contract (e.g., declared a wave for tasks without `Read:` blocks, or for tasks with overlapping writes). Halt; escalate to Imperator.

### 7.3 Surface

This spec extends 3a's already-amended Praetor mission. 3a lands the well-formedness check and the dormant-disjointness note in `source/skills/claude/references/verification/templates/plan-verification.md`; this spec lands the wave-callout-validation mission item that activates the hook and adds checks 1, 3, 4, 5. The role file `source/roles/praetor.md` (already amended by 3a with the well-formedness item) gets one further bullet added to "You own": "wave-callout validation when plan declares a parallel-safe wave."

**Confidence: High** — checks derived from 3a's actual `**Files:**`-block contract, including its conservative-read-anywhere fallback and generator-run carve-out.

---

## 8. /phalanx Redefinition — Behavioral Contract

The `source/skills/claude/phalanx/SKILL.md` body is fully rewritten. The current debug fan-out framing is dropped. The new body defines /phalanx as implementation parallel dispatch.

### 8.1 Identity

/phalanx is parallel implementation dispatch for plans declaring a parallel-safe wave callout. The Roman phalanx is the shield-wall formation: many soldiers advancing in lockstep, each holding their own ground. Each centurio holds one task; the line advances together; each soldier independent in their writes but coordinated in their advance.

### 8.2 Slot in the toolchain

| Skill | Task scale | Dispatch | Verification | Default mode |
|-|-|-|-|-|
| /march | small tasks | Legatus self-executes | self-verifies inline | sequential |
| /legion | big complex tasks, tasks build on each other | Legatus dispatches one centurio per task | Tribunus between each task | sequential by default; Legatus-judged parallel exception |
| /phalanx | big-easier-to-medium tasks declared parallel-safe | Legatus dispatches centurios in parallel — single message, multiple Agent calls | per-wave Tribunus post-execution | parallel by definition |

### 8.3 Triggers — when to summon

- An approved plan with a Praetor-verified parallel-safe wave callout.
- The wave's tasks are non-trivial enough that /march (Legatus self-execution) is wasteful.
- The wave's tasks are independent — the Praetor-verified writes-disjointness guarantee holds.

### 8.4 Don't summon

- Plan has no wave callout → /legion or /march.
- Wave callout exists but Praetor flagged disjointness GAPs → return to Edicts; do not dispatch /phalanx until the plan is corrected.
- Tasks are gnarly, ambiguous, or have non-obvious cross-dependencies the Files-block contract did not catch → /legion (Legatus tactical judgment with Tribunus-between).
- Single task, regardless of size → /march or /legion.
- Multi-bug parallel diagnosis → manually invoke /tribune in parallel sessions (existing pattern). Not /phalanx.

### 8.5 Dispatch model

When /phalanx is invoked with a plan path:

1. Read the plan path from invocation arguments.
2. Locate the wave callout in the plan header. If absent → exit with: *"No parallel-safe wave callout in plan. Use /legion (sequential dispatch) or /march (single Legatus) instead."*
3. Parse the wave's task list from the callout.
4. Confirm each named wave-task has a `**Files:**` block per 3a's contract — explicit `Create:`/`Modify:`/`Test:` paths (or the `(none)` marker) AND an explicit `Read:` sub-bullet. If any wave-task lacks the `**Files:**` block entirely (legacy plan, pre-3a) → exit with: *"Plan does not declare per-task `**Files:**` blocks (campaign 3a's contract). /phalanx requires the Files-block contract for parallel-safety verification. Use /legion."* If any wave-task is missing only the `Read:` sub-bullet → exit with: *"Wave-task <N> has no `Read:` declaration. Per 3a's conservative read-anywhere fallback, wave is not parallel-safe. Either add `Read:` declarations to all wave-tasks, or use /legion."* /phalanx trusts that Praetor's wave-callout-validation has already passed for this plan (otherwise the wave callout would not survive verification), but performs these defensive checks before dispatch as belt-and-suspenders.
5. Dispatch one centurio per wave-task. **Single message with multiple Agent calls** — the parallel dispatch pattern. Each Agent call carries the centurio's task body, decisions, acceptance, and verification per the plan.
6. Each centurio executes its task body, runs the plan's per-task verification commands (the centurio's self-check, identical to /legion's per-task verification step).
7. /phalanx waits for all centurios to return.

### 8.6 Verification — per-wave Tribunus

After all centurios return:

- **If any centurio reports per-task verification failure**: /phalanx halts before per-wave Tribunus. Reports per-task status (pass/fail per centurio) to the Imperator. The Imperator handles failed tasks individually — re-dispatch via /march or /legion, or rerun the failed centurio. Tribunus does not run on a partial wave; wave-level reasoning on incomplete output is premature.
- **If all centurios self-verify**: /phalanx dispatches Tribunus once for per-wave verification. Tribunus operates in plan-execution-verifier stance (the same stance /legion uses for its between-task Tribunus, not the diagnosis stance). Tribunus sees the wave's combined output — each task's deliverable — and reasons about whether the wave's collective contribution is correct.
- Tribunus findings: SOUND, GAP, CONCERN, MISUNDERSTANDING. Same Codex protocol as /legion's between-task Tribunus.
- /phalanx reports the wave outcome to the Imperator with Tribunus's findings attached.

### 8.7 Why per-wave Tribunus is the right model (not per-task)

Per-task Tribunus would miss the contract-drift case: Tasks A and B have disjoint writes (file foo.ts and file bar.ts) but their outputs do not compose at the boundary — foo.ts exports a type that bar.ts imports incorrectly. Per-task Tribunus would pass each task individually and miss the integration issue. Per-wave Tribunus sees the joined output and catches it.

The disjointness guarantee gives per-task root-cause attribution post-finding (writes are disjoint, so broken behavior maps to specific writes), so per-wave Tribunus does not lose granularity. It buys integration-aware verification at the cost of running once instead of N times. For a parallel-dispatched wave, that is the correct trade.

### 8.8 Failure handling

- Per-task isolation. The wave is not atomic. Centurio A's failure does not roll back Centurio B's writes. Each centurio's writes are committed (or not) independently per the plan's per-task verification.
- The Imperator gets a per-task report on failures.
- Failed tasks re-dispatch via /march, /legion, or rerun individually. /phalanx does not loop or auto-retry.
- Per-wave Tribunus findings can name specific tasks (because writes are disjoint, broken behavior maps to a specific task's Files-block write set); the Imperator addresses per-task.

### 8.9 Voice and discipline

The skill body's voice carries the shield-wall metaphor and names the discipline trade-off explicitly: parallelism is earned by the Praetor-verified writes-disjointness, not granted by default. /phalanx does not adjudicate — it dispatches, gates on per-wave Tribunus, and reports. The Legatus persona is preserved (the centurio's commander); /phalanx is the formation the Legatus orders.

The skill body retires the entire current debug fan-out framing — "3+ test files failing," "multiple subsystems broken," the debug session example. None of it carries forward.

**Confidence: High** — design confirmed during deliberation; per-wave Tribunus model approved by Imperator.

---

## 9. /legion and /march Light Recognition

Both `source/skills/claude/legion/SKILL.md` and `source/skills/claude/march/SKILL.md` receive a small addition: when invoked on a plan that contains a wave callout in the header, the skill surfaces a one-line prompt to the Imperator before mainline dispatch.

### 9.1 The prompt — contract

Both skills surface a **one-line informational prompt** to the Imperator before mainline dispatch when the plan header carries a wave callout. The prompt:

- names the wave callout's task list (so the Imperator knows what wave is being offered);
- offers a binary choice — dispatch via /phalanx (parallel) or continue with the current skill (sequential);
- blocks mainline dispatch until the Imperator answers.

The exact wording is plan-territory. The contract is the three properties above. If the Imperator says continue, the skill's mainline dispatch proceeds (legion's centurio-by-centurio with Tribunus-between, or march's Legatus self-execution). If the Imperator picks /phalanx, the current skill exits cleanly and the Imperator invokes /phalanx with the plan path in a fresh invocation.

### 9.2 Why the prompt matters

Without the prompt, the Imperator has no signal at dispatch-time that parallelism is an option. Even with a clear plan-header callout, if /legion is invoked and immediately starts mainline sequential dispatch, the wave is wasted. The prompt is the moment the dispatch decision becomes conscious.

The /march case is interesting because /march has no Legatus-dispatched centurios — /march is self-executing. The prompt still applies because the Imperator may have invoked /march by reflex on a plan that warrants /phalanx. The prompt is the chance to course-correct.

### 9.3 What does not change

- /legion's existing Legatus-judged parallelism (the "Parallel is permitted only when tasks are genuinely independent, by my judgment" clause) is not removed. /legion can still dispatch parallel centurios on plans without wave callouts when the Legatus deems it safe. The wave callout is not the only path to parallel work in /legion — it is the explicit, plan-declared, Praetor-verified path.
- /march's pure-sequential body is not changed. The prompt is the only addition.

**Confidence: High** — prompt text and behavior derived from Imperator's scope.

---

## 10. External Dependency: Campaign 3a

This spec consumes campaign 3a's Files-block write/read contract by reference. Campaign 3a is merged on fetched `origin/main` as PR #5 (`[codex] Add Edicts Files-block contract`, merged 2026-05-03). The contract substrate is named here at the dependency level, not redefined.

### 10.1 What this spec assumes about 3a's contract

Per the actual 3a spec (`docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`):

- Every task carries a `**Files:**` block.
- The concrete writes set is the union of paths under `Create:` + `Modify:` + `Test:`. Sub-bullets are mandatory.
- `Read:` entries are optional, best-effort, and may use paths or wildcard patterns.
- `(none)` marks an explicit empty writes set; a missing `**Files:**` block is malformed.
- Write categories use explicit paths only — no globs or wildcards that hide drift (3a's C3 grammar).
- Praetor validates Files-block presence and well-formedness (3a's S3) and carries a dormant disjointness hook (3a's C6) that this campaign activates.

This spec also relies on 3a's explicit **sister-campaign interface** for campaign 5:

- **Conservative read-anywhere fallback.** A wave-task with no `Read:` declaration is presumed to read every other wave-task's writes. Wave callouts therefore require explicit `Read:` declarations on each wave-task; absent reads disqualify the wave. This is opt-in parallelism by Reads declaration, which is the correct safety posture for parallel dispatch.
- **Glob-matches-path semantics.** `Read:` patterns match concrete write paths via `*` within a single segment, `**` across directory boundaries (globstar). Praetor's read-write overlap check uses these semantics.
- **Generator-run carve-out (3a's C5).** Two recognized canonical commands (`python3 runtimes/scripts/generate.py`, `bash codex/scripts/install-codex.sh`) delegate derived-output enforcement to the generator's manifest. /phalanx and Praetor must additionally treat two wave-tasks invoking the same canonical command as a generator-run conflict — they race on derived outputs even when their declared writes sets are disjoint.
- **Legacy plan fallback delegated to this spec.** 3a explicitly delegates pre-3a plan handling to its consumers: my §8.5 step 4 defines /phalanx's exit behavior; my §7.1 check 3 defines Praetor's GAP behavior.

**This spec does not redefine 3a's contract. If the merged 3a contract later changes in a way that affects this spec's consumers (Praetor's wave-validation, /phalanx's safety check), this spec halts at implementation and re-deliberates. That is the Decision gate.**

### 10.2 Coordination and sequencing

3a has landed on fetched `origin/main`. The implementation chain is therefore satisfied up to this campaign:

```
right-sized-edicts -> minimality-contract -> 3a (Files-block contract) -> this campaign (parallel-wave dispatch)
```

Plan-stage implementation of this campaign still orders tasks so consumers of 3a's contract are explicit about the merged contract they rely on:

- The Praetor wave-callout-validation amendment and /phalanx body rewrite consume the merged 3a Files-block contract directly.
- The Estimate-lite Coordination amendment (consul/), the Edicts wave-callout slot (edicts/), and the /legion + /march light additions introduce or surface the wave-callout syntax; they do not change 3a's contract surface.

### 10.3 Degradation when 3a is absent at runtime

If a plan reaches /phalanx without per-task `**Files:**` blocks (legacy plan, or plan author omitted them):

- /phalanx exits per §8.5 step 4 with a clear message naming 3a as the missing contract.
- Praetor reports GAP via 3a's S3 well-formedness check (which fires before this spec's wave-callout validation can run) — the missing block is detected upstream of my §7.1 checks, so the failure mode is "3a's well-formedness GAP" rather than a wave-specific finding.

If a plan carries a `**Files:**` block but it is malformed (unknown sub-bullet, globbed write path, missing `(none)` for empty writes, or unreadable `Read:` pattern), 3a's S3 check reports GAP and /phalanx refuses the wave until the plan is corrected.

If a plan carries a well-formed `**Files:**` block but lacks `Read:` declarations on wave-tasks, my §7.1 check 3 fires (conservative read-anywhere disqualifies the wave). This is the most common failure mode for plans that adopt 3a's contract but don't opt into wave declarations: well-formed Files blocks, missing Reads — Praetor reports GAP, plan-writer either adds the Reads or accepts /legion sequential dispatch.

The campaign degrades gracefully — the absence or incompleteness of the contract is always a verifiable error, never a silent failure.

**Confidence: High** — aligned to 3a's actual `**Files:**` contract rather than the earlier briefing sketch. The Decision gate exists for future contract changes.

---

## 11. Concurrent Campaign Coordination

The 2026-05-01 Consilium tightening briefing names six campaigns. This spec coordinates with them as follows:

### 11.1 Campaign 4 (Spec Contract Inventory + Tabularius)

Campaign 4 is merged on fetched `origin/main` as PR #6 (`[codex] Add Tabularius contract inventory verification`, merged 2026-05-03). `source/manifest.json` on fetched `origin/main` includes `consilium-tabularius`. Campaign 4 amends `source/skills/claude/consul/SKILL.md` Phase 3 Spec Discipline and pre-verification dispatch, and adds `source/roles/tabularius.md`, `source/manifest.json`, and `source/skills/claude/references/verification/templates/contract-inventory-verification.md`. This spec amends Phase 3 Estimate-lite Coordination (lines 200-220 per recon). Same Consul source file, different Phase 3 subsections. **No file-line collision** confirmed during Consul reconnaissance.

Because Campaign 4 has landed before this campaign's implementation plan, this spec now carries a Contract Inventory section before plan-stage work proceeds.

### 11.2 Campaign 3a (Files-block write/read contract)

Consumed by reference per §10. Hard external dependency.

### 11.3 Campaign 3b (file-ownership hook)

Independent consumer of 3a's contract. No coordination with this campaign required beyond the shared 3a dep. The hook operates at runtime; this spec operates at deliberation, plan, and dispatch stages. Different surfaces, different consumers.

### 11.4 Campaigns 1, 2, 6

- **1 (minimality contract)** — already specced; no interaction.
- **2 (model tiering)** — manifest.json work; no interaction.
- **6 (sitrep)** — new script; no interaction.

**Confidence: High** — collisions audited during Consul reconnaissance.

---

## 12. Source Surfaces

This spec amends:

- `source/skills/claude/consul/SKILL.md` and `source/protocols/consul-routing.md` — Phase 3 Codification / Codex-consumed routing, Estimate-lite section. Coordination subsection expansion (§5).
- `source/skills/claude/edicts/SKILL.md` and `source/protocols/plan-format.md` — Plan template / Codex-consumed plan format (wave-callout slot per §4, §6); plan-writer guidance for declaring the callout; one-wave-per-plan enforcement.
- `source/roles/praetor.md` — One bullet addition to "You own": "wave-callout validation when plan declares a parallel-safe wave."
- `source/skills/claude/references/verification/templates/plan-verification.md` — New mission item for Praetor: wave-callout validation per §7.
- `source/skills/claude/phalanx/SKILL.md` — Full body rewrite per §8. Current debug fan-out framing dropped entirely.
- `source/skills/claude/legion/SKILL.md` and `source/skills/claude/march/SKILL.md` — Pre-mainline addition per §9.
- `source/protocols/legatus-routing.md` — Codex Legatus recognition equivalent for plans that carry a wave callout.

### 12.1 The plan should not introduce

- new agents
- new verifier roles
- new metadata regimes (per-task wave fields, Action Tier, Owner field schema, dependency graph, rollback field, topology system)
- new lint scripts
- new model-routing policy
- changes to Tribunus diagnosis routing (the Tribunus diagnosis stance is distinct from Tribunus's plan-execution-verifier stance; this campaign uses the latter, untouched)
- changes to Medusa domain doctrine
- edits to historical case docs except this case's own artifacts

**Confidence: High** — surfaces enumerated during Consul reconnaissance.

---

## Contract Inventory

This is a Consilium-runtime spec. It defines no Divinipress product canonical-six surfaces (wire shape on a module boundary, API contract at a module boundary, idempotency anchor, link.create boundary, workflow ownership claim, subscriber boundary). It does define Consilium dispatch and verification contracts that the Tabularius can locate:

- **Estimate-lite Coordination contract:** §5.1 defines the three Coordination states Consul may write for parallel waves: no parallel structure, anticipated parallel-safe wave, or multi-wave structure with sequential gate. The implementation covers both Claude Consul skill text and Codex Consul routing protocol text.
- **Plan-header wave-callout contract:** §4.1 and §6 define the `**Parallel-safe wave:**` format, placement, optionality, one-wave maximum, and Edicts authoring conditions. The implementation covers both Claude Edicts skill text and Codex-consumed plan-format protocol text.
- **Praetor wave-validation contract:** §7.1 and §7.2 define the wave-callout validation checks and finding severities.
- **/phalanx dispatch and verification contract:** §8.5 and §8.6 define /phalanx invocation checks, refusal messages, parallel centurio dispatch, and per-wave Tribunus verification.
- **/legion and /march recognition prompt contract:** §9.1 defines the dispatch-time prompt properties and blocking behavior when a plan header carries a wave callout. The implementation covers Claude `/legion` and `/march`, plus the Codex Legatus routing equivalent.

Consumed external contract, not redefined here: Campaign 3a's Files-block contract (§10.1), where writes are `Create:` + `Modify:` + `Test:`, `Read:` is optional, and `(none)` marks an empty writes set.

**Confidence: High** — Campaign 4 is merged and `consilium-tabularius` exists in `source/manifest.json` on fetched `origin/main`; these entries point to the contract definitions already present in this spec.

---

## 13. Future Option: Plan Writer Agent (Deferred)

A Plan Writer agent — a dedicated subagent that takes a spec and produces a plan, freeing the Consul from holding plan-writing context — is a known architectural option. Deferred from this campaign.

### 13.1 Rationale for deferral

- Adding a new agent role is a coupling change that warrants its own spec, Censor + Provocator verification, and Imperator review. The Imperator's standing discipline ("Consilium infra work goes formal") is incompatible with folding agent machinery into a campaign as a side effect.
- Plan-writing today is bounded; the Edicts skill body covers it. The wave-callout addition adds one header field and one disjointness check (consumed via 3a). None of this individually justifies an agent role.
- This campaign already expands scope by rewriting /phalanx. Folding in agent machinery is scope creep.

### 13.2 Measurable trigger to reopen

The Plan Writer agent gets its own spec when any of the following holds:

- Edicts skill body grows past ~500 lines. (The right-sized-edicts spec aimed to keep Edicts lean; this is a rough threshold for "Edicts has accreted enough plan-writing logic to warrant offloading.")
- Plan-writing context regularly exceeds ~10–15% of a Consul session's budget — measurably eroding the Consul's deliberation context.
- 3a's Files-block contract turns out more elaborate than the current spec (e.g., sub-file granularity, complex glob semantics) and accumulates plan-side machinery beyond Edicts's comfortable absorption.

### 13.3 Pattern when triggered

The Plan Writer would follow the existing artifact-producing-subagent pattern (Centurio under Legatus dispatch). Inputs: spec path, doctrine references. Output: plan.md. Verification: Praetor (unchanged). The Plan Writer is a producer, not a verifier, so the right-sized-edicts ban on new verifier roles does not apply directly — but the spirit of the ban (don't expand the Consilium without strong reason) is honored by deferring until the trigger fires.

**Confidence: Medium** — deferral approved by Imperator; trigger criteria are this Consul's judgment, calibrated to existing doctrine boundaries.

---

## 14. Risks and Guardrails

**Risk: a legacy plan without 3a Files blocks reaches /phalanx.** /phalanx body and Praetor amendments require the merged 3a contract substrate. **Guardrail:** spec declares the dependency explicitly; plan-stage tasks consume the merged 3a contract directly; degradation behavior (§10.3) is exit-with-message, not silent failure.

**Risk: per-wave Tribunus context cost is heavier than expected.** Tribunus reasoning over a multi-task wave's combined output may strain context on large waves. **Guardrail:** Tribunus's existing plan-execution-verifier stance handles multi-file outputs today; per-wave verification is comparable to verifying a /legion-completed plan in one pass. If context cost becomes prohibitive in practice, the fallback is per-task parallel Tribunus (the model originally proposed during deliberation, before the Imperator selected per-wave); revisit if observed empirically. This is a tuning question, not a structural one.

**Risk: Edicts authors over-declare wave callouts.** Plans with marginally disjoint writes get aspirational callouts that Praetor then catches. **Guardrail:** Edicts plan-writer guidance specifies the callout is for "tasks with truly disjoint writes and no read-of-other"; Praetor's validation is the safety net; Imperator review of the plan is the final gate. Over-declaration is a recoverable error, not a safety failure.

**Risk: /phalanx becomes the default dispatch and waters down /legion's between-task rigor.** The Imperator picks /phalanx whenever a wave is declared, skipping /legion's Tribunus-between-each-task discipline even when tasks aren't actually that simple. **Guardrail:** /phalanx's Don't-summon section (§8.4) names "tasks gnarly, ambiguous, or with non-obvious cross-dependencies" as an explicit kick-back to /legion. /phalanx's voice section emphasizes the discipline trade-off — easier work, parallel speed, but disjointness-guaranteed only. The /legion + /march light prompt is informational, not directive.

**Risk: 3a's contract granularity mismatches what /phalanx safety needs.** Too coarse (directories) misses real conflicts; too granular (sub-file ranges) makes disjointness harder to verify. **Guardrail:** the current 3a spec uses explicit Files-block write paths with no globs in write categories. Decision gate per §10.1: if 3a's actual spec changes, this spec halts and re-deliberates.

**Risk: 3a's conservative read-anywhere fallback makes wave declarations rare in practice.** Plan-writers who don't bother declaring per-task `Read:` sub-bullets get no wave callout — Praetor's check 3 fails on absent `Read:` entries. The "make /phalanx more invokable" goal is partially defeated if plan-writers rarely opt in. **Guardrail:** this is a feature, not a bug. Conservative-by-default with explicit-opt-in via Reads declaration is the correct safety posture for parallel dispatch — plan-writers who care about parallelism declare reads; default behavior is sequential. The Edicts plan-writer guidance (§6.1) names this trade-off explicitly so plan-writers understand wave callouts are earned by Reads declaration. The /legion + /march prompt (§9) provides the Imperator a chance to redirect to /phalanx when a plan does opt in.

**Risk: 3a's merged contract later changes.** This spec's terminology and check semantics (writes set as Create+Modify+Test union, glob-matches-path for reads-vs-writes, generator-run carve-out, conservative read-anywhere) are anchored to the merged 3a contract on fetched `origin/main`. **Guardrail:** §10.1 names the Decision gate explicitly. If 3a changes later (new sub-categories, changed glob semantics, removed conservative fallback), this spec halts and re-deliberates against the changed substrate before /phalanx body or Praetor amendments are executed.

**Risk: rename creates cross-reference drift.** The briefing calls this "campaign 5 (phalanx surfacing)." Concurrent specs (3a, 3b, 4, 6) being written today by other Consul sessions may cite this campaign by its briefing label. **Guardrail:** Lineage section (preamble) records the rename; cross-spec citations in Consilium prose are typically by description ("campaign 3a's Files-block contract") rather than directory path, limiting drift impact; briefing reference can be updated post-merge.

**Risk: this campaign resurrects wave-machinery under a different name.** The right-sized-edicts ban explicitly forbade wave metadata, topology systems, Action Tier, Owner fields, dependency graphs, rollback fields. **Guardrail:** §3 (Non-goals) explicitly stays out of all banned shapes. The wave callout is single-line narrative observation in plan prose, not a structured field. §4.2 names the ban-compliance reasoning. This spec is the "separately approved case" that the right-sized-edicts spec Section 12 anticipated; the Imperator's authorization of this campaign is on record in the briefing and in deliberation.

**Risk: Tribunus debug stance and plan-execution-verifier stance get conflated.** The current /phalanx-as-debug invokes the diagnosis-stance side of Tribunus. The redefined /phalanx invokes the plan-execution-verifier side. **Guardrail:** §8.6 names the stance distinction explicitly. Tribunus's diagnosis routing (`/tribune` for bug reports) is not changed by this campaign.

**Confidence: High** — risks enumerated from deliberation and reconnaissance; guardrails map to specific spec sections.

---

## 15. Success Criteria

The campaign succeeds when the end-to-end flow operates on a real spec:

1. Consul writes a spec with multiple disjoint-effects tasks.
2. Estimate-lite Coordination names the **Anticipated parallel-safe wave**.
3. Edicts produces a plan whose header carries the **Parallel-safe wave** callout, evidenced by per-task Files-block write sets (per 3a).
4. Praetor verifies the wave callout against the Files-block write sets and `Read:` entries; reports SOUND.
5. Imperator dispatches /phalanx with the plan path.
6. /phalanx parses the wave, dispatches centurios in parallel (single message, multiple Agent calls).
7. Each centurio executes its task, runs per-task verification.
8. /phalanx waits for all centurios; if all self-verify, dispatches per-wave Tribunus.
9. Tribunus reports findings (SOUND for the success path).
10. /phalanx reports wave outcome to the Imperator.

### 15.1 Self-application

The implementation plan for this campaign itself is anticipated to be a five-task wave (Consul Estimate-lite expansion, Edicts plan template + enforcement, Praetor amendments, /phalanx body rewrite, /legion + /march light additions). All five touch disjoint files and read no outputs from each other. **The campaign is expected to use its own pattern for its own implementation** — and to qualify, each of the five tasks declares an explicit `Read:` sub-bullet in its `**Files:**` block per 3a's contract (typically reading the relevant doctrine and adjacent skill files for context). The wave callout is earned by those Reads declarations, not granted by aspirational disjointness. That self-application is the first end-to-end success criterion.

### 15.2 Field validation

After self-application, a second campaign — any subsequent multi-task spec where parallelism is genuine — successfully uses /phalanx. The Imperator confirms the dispatch saved time relative to what /legion's sequential pattern would have taken. This is the field validation that the toolchain gap was real.

**Confidence: High** — observable outcomes derived from the contract surfaces this spec amends.

---

## 16. Relationship to Existing Cases

- **Direct predecessor (deliberation surface):** `docs/cases/2026-04-29-consul-brief-estimate-lite/spec.md`. The Estimate-lite Coordination subsection this campaign expands was introduced by that spec.
- **Direct predecessor (contract surface):** `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md` (campaign 3a). Hardens the existing `**Files:**` block into the writes/reads contract that this spec consumes for Praetor's wave-callout validation and /phalanx's safety check. Sister-campaign-interface section (§"Sister-Campaign Interface" of 3a) explicitly delegates parallel-safe-group declaration semantics and legacy-plan fallback to this spec.
- **Approved-future-case lineage:** `docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md` Section 12 — *"Action Tiers, Owner fields, dependency graphs, rollback fields, and wave metadata may become useful later for parallel execution, but they are too much machinery for the current failure mode... If the Imperator later wants a formal topology system, that should be a separate approved case."* This campaign is that separately approved case. It stays on the right side of the ban: narrative observation in plan prose, not metadata regime.
- **Briefing entry:** `.planning/2026-05-01-consilium-tightening-briefing.md` — campaign 5 (originally labeled "phalanx surfacing"; renamed during deliberation per Lineage section).
- **Concurrent siblings:** Campaigns 1, 2, 3a, 3b, 4, 6 in the same briefing. Coordination notes in §11.

**Confidence: High** — lineage verified during reconnaissance.

---

## Confidence Map Summary

| Section | Confidence | Note |
|-|-|-|
| 1 Goal | High | Both halves explicitly authorized. |
| 2 Background | High | Failure mode confirmed via reconnaissance. |
| 3 Non-goals | High | All stated explicitly or derived from ban. |
| 4 Wave callout contract | High | Format from Imperator's option-B pick. |
| 5 Estimate-lite amendment | High | Anticipatory/evidentiary distinction approved. |
| 6 Edicts amendment | High | Direct application. |
| 7 Praetor amendment | High | Checks derived from wave semantics. |
| 8 /phalanx redefinition | High | Per-wave Tribunus model approved. |
| 9 /legion + /march | High | Prompt scope explicit. |
| 10 Campaign 3a dependency | High | Patched against 3a's merged actual spec (`docs/cases/2026-05-01-consilium-edicts-writes-contract/`). |
| 11 Concurrent campaign coordination | High | Campaign 4 and 3a merge state refreshed from fetched main. |
| 12 Source surfaces | High | Enumerated during reconnaissance. |
| Contract Inventory | High | Added after Campaign 4 merged and Tabularius appeared in manifest. |
| 13 Plan Writer deferral | Medium | Trigger criteria are this Consul's judgment. |
| 14 Risks and guardrails | High | Mapped to spec sections. |
| 15 Success criteria | High | Observable outcomes. |
| 16 Existing cases | High | Lineage verified. |
