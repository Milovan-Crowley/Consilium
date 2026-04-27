---
case: 2026-04-26-tribune-persistent-principales
session: 02
campaign: B-1.1
title: Persistent Tribunus Executor — Wire-Up Closure
author: Publius Auctor (Consul)
date: 2026-04-27
predecessor: B-1 (this case, session 1)
---

# B-1.1 — Persistent Tribunus Executor: Wire-Up Closure

## 1. Why This Campaign Exists

B-1 shipped the persistent Tribunus-executor pattern: `/legion` spawns one executor at campaign start, signals it via `SendMessage` per task, recycles after a 15-task lifetime, and preserves an ephemeral mini-checkit fallback. All 16 implementation tasks landed; per-task verification returned SOUND across the board; Campaign Review confirmed mental-model consistency end-to-end (decisions.md:73 — *"0 MISUNDERSTANDING"*).

But the pattern is **dormant**. Campaign Review surfaced six GAPs. Two were folded into B-1 before close (GAP-2 Sampled-flag wiring, GAP-6 docket-shape discriminator). Four were deferred to a follow-up because each is a design-fork: their resolution depends on architectural choices the Imperator had not yet made (decisions.md:86,89). Until those four are wired, the persistent pattern cannot safely activate on a real campaign.

B-1.1 closes those four gaps. Its completion lifts the gate.

## 2. Goals

1. **Unify** the verdict vocabulary across all Consilium verifiers onto Codex categories — `MISUNDERSTANDING / GAP / CONCERN / SOUND` — retiring `PASS / CONCERN / FAIL` from the persistent template (GAP-4).
2. **Wire** `plan_id` SHA mismatch detection from documented-only into an enforced `/legion` pre-spawn refusal (GAP-1).
3. **Specify** unambiguous diff semantics in the persistent template so the verifier reads the right work even after Soldiers commit between tasks (GAP-3).
4. **Resolve** the partial-protocol deadlock between `/edicts` and `/legion` by single-side correction on `/legion` — missing or empty protocol routes to mini-checkit fallback rather than halting (GAP-5).

## 3. Non-Goals

- **The consul-commits-twice blindspot detection.** Custos deferred this in its own SHA-pattern campaign (decisions.md:115 of `2026-04-26-custos-edicts-wiring`); B-1.1 follows the same precedent. Working-tree-vs-HEAD detection is sufficient for first activation. Revisit if lived experience proves otherwise.
- **Restructuring `/edicts`.** The deadlock fix lives entirely on `/legion`'s side. `/edicts` semantics — including the Imperator's "accept the gap" path on Tribunus-design double-crash — remain unchanged.
- **Authoring `tribune-protocol.md` for any specific campaign.** Protocol authoring lives in the Tribunus-design phase, per-campaign. B-1.1 specifies the *contract* `tribune-protocol.md` must satisfy; it does not produce one.
- **Most of the 11 Campaign-Review CONCERNs.** Section 6 below triages each. Three fold in (CONCERN-Praetor-2 + CONCERN-Provocator-9 about empty `lanes_triggered`; CONCERN-Provocator-7 about smoke-check sequencing); eight remain advisory or out of scope.
- **CONVENTIONS-compliance cleanup.** The parent case lacks `STATUS.md`. Pre-existing CONVENTIONS gap, not a B-1.1 wire-up. Out of scope.
- **Soldier history-rewriting discipline.** Soldiers must not rebase, amend, or reset commits between task dispatch and verification — `task_start_sha` (§4.3) presumes commits accumulate forward. The plan codifies this discipline; this spec presumes it. Diagnosing or detecting violations is out of scope.
- **`/edicts` documentation refresh.** `/edicts:445` will remain factually correct (legion can march on partial/empty protocol) but causally outdated (the actual fall-back path is now `/legion`'s pre-spawn routing, not the runtime Patrol Stance fallback inside the executor). The prose stays as-is to honor the "`/edicts` unchanged" non-goal; future maintainers should consult `/legion`'s pre-spawn for the live mechanism.

## 4. Scope — The Four Wire-Ups

The campaign delivers four feature-level changes. Each is implementation-independent, but all four together unlock the persistent pattern.

### 4.1 Vocabulary Unification (GAP-4)

**WHAT.** Every surface in the persistent-pattern verification flow emits Codex categories — `MISUNDERSTANDING / GAP / CONCERN / SOUND` — exclusively. The legacy `PASS / CONCERN / FAIL` vocabulary is retired from every load-bearing surface listed below. No translation layer is introduced.

**Migration footprint (the full surface list).** Iteration 1 of this spec named two surfaces; iteration-1 verification surfaced three more. The complete list:

|#|Surface|Current state|Migration|
|-|-|-|-|
|1|`tribune-persistent.md` spawn-prompt body|Lines 52, 67, 68, 70 carry `PASS / CONCERN / FAIL` and `SOUND-with-note / FAIL-with-note` (Deviation rule)|Replace all references with Codex categories; Deviation rule reads `SOUND-with-note / GAP-with-note`|
|2|`tribune-persistent.md` per-task verdict-handling guidance|Line 111: `PASS → next task; CONCERN → note for Campaign review; FAIL → fix-soldier dispatch + re-verify; MISUNDERSTANDING-tagged FAIL → halt + escalate`|Rewrite as Codex routing: `SOUND → next task; CONCERN → note for Campaign review; GAP → fix-soldier dispatch + re-verify; MISUNDERSTANDING → halt + escalate`|
|3|Executor reply contract (SendMessage round-trip)|Reply body carries `verdict (PASS/CONCERN/FAIL)` per `tribune-persistent.md:70`|Reply body carries Codex categories (table below)|
|4|`tribune-log-schema.md`|Lines 14, 23, 38, 46 declare `verdict: PASS \| CONCERN \| FAIL` as the schema field domain (including counterfactual)|Field domain becomes `verdict: SOUND \| CONCERN \| GAP \| MISUNDERSTANDING`; line 38's mapping comment retired (no longer "PASS = SOUND" — direct Codex)|
|5|`/legion/SKILL.md` DONE handler prose|Line 175: *"The Tribunus replies with the integrated verdict (PASS/CONCERN/FAIL)"*|Prose updated to Codex categories; no `PASS`/`FAIL` string-match anywhere in `/legion`'s flow|

**Wire shape — executor reply body (the SendMessage round-trip boundary):**

|Field|Type|Domain|
|-|-|-|
|`verdict`|enum|one of `SOUND`, `CONCERN`, `GAP`, `MISUNDERSTANDING`|
|`verdict_summary`|string|one-line synopsis tied to the verdict category|
|`findings`|free-form|Codex-tagged findings; chain-of-evidence per Codex rules|

**Vocabulary mapping (one-time migration reference, not a runtime layer):**

|Legacy|Codex|Notes|
|-|-|-|
|`PASS`|`SOUND`|Direct rename across all surfaces|
|`CONCERN`|`CONCERN`|No change|
|`FAIL`|`GAP`|Direct rename across all surfaces|
|*n/a — no prior persistent-template convention*|`MISUNDERSTANDING`|**New category introduced into the persistent executor's vocabulary.** The legacy `MISUNDERSTANDING-tagged FAIL` convention exists in `/legion`'s mini-checkit prose (`/legion/SKILL.md:111`-style language) and on the doctrinal Codex side, but the persistent template never carried a tag-based MISUNDERSTANDING mechanism — its three categories were `PASS / CONCERN / FAIL` only. B-1.1's work here is *category extension* (introducing MISUNDERSTANDING as a first-class verdict the executor can emit), not *tag retirement*.|

**Domain invariants respected.** The Codex's halt-on-MISUNDERSTANDING rule is preserved unchanged: `MISUNDERSTANDING` from a per-task verifier halts the campaign and escalates to the Imperator; `/legion` does not auto-feed. The 2-iteration cap on GAP/CONCERN auto-feed is preserved unchanged.

**Success criteria.**
- All five surfaces in the migration-footprint table have Codex vocabulary; no `PASS|FAIL` token remains in any of them (counterfactual blocks included).
- `/legion`'s DONE handler reads Codex categories — verified by absence of `PASS`/`FAIL` string-matching in `/legion`'s code paths after migration.
- The executor reply contract uses Codex vocabulary end-to-end (executor emits, `/legion` reads, `tribune-log.md` records — all in the same vocabulary).
- A test campaign run produces verdicts in Codex vocabulary end-to-end with no translation step anywhere.
- The Codex doctrine itself (categories, halt rules, auto-feed cap) is unchanged.

**Precedent reference.** The `2026-04-26-provocator-decompose` campaign chose unification over translation for vocabulary collision in lane decomposition. The doctrinal anchor — the substitution-contract pattern that has every lane emit identical output vocabulary — is documented at `provocator-decompose/decisions.md:99` (the GAP-fix that formalized the pattern) and lives concretely in the lane templates at `claude/skills/references/verification/templates/spec-verification.md:96-117` (the Common Lane Preamble). The brief mention at `provocator-decompose/decisions.md:24` ("+ Aggregation Contract") names the mechanism but does not elaborate.

---

### 4.2 `plan_id` SHA Mismatch Wire-Up (GAP-1)

**WHAT.** `/legion` pre-spawn becomes the enforcement point for `plan_id` mismatch detection. The protocol schema already defines a `plan_id` field; B-1.1 pins its semantics, the comparison the pre-spawn performs, and the response on mismatch.

**Wire shape — `tribune-protocol.md` `plan_id` field.** The field carries two components:

|Component|Semantics|
|-|-|
|case-relative path to `plan.md`|the file the protocol was authored against|
|blob SHA at authoring time|`HEAD:<plan-path>` blob SHA at the moment Tribunus-design wrote the protocol|

The schema doc (`tribune-protocol-schema.md`) currently reads *"commit-or-hash"* (ambiguous). B-1.1 pins this to **blob SHA**, not commit SHA, matching the Custos precedent (`2026-04-26-custos-edicts-wiring` decisions.md:111). Rationale: blob SHA is stable across unrelated commits and detects only meaningful plan changes.

**Wire shape — `/legion` pre-spawn comparison.** The SHA comparison runs only after §4.4's branches 1 and 2 are passed (file present and well-formed per §4.4's definition). It is the discriminator for §4.4's branches 3 vs 4:

1. Read `tribune-protocol.md`'s `plan_id` field (path + recorded blob SHA).
2. Resolve the recorded path against the current HEAD: compute the current blob SHA of the plan file at HEAD.
3. If the plan file does not exist at HEAD (path resolves to nothing — file deleted, renamed, or moved out of the case folder) → treat as **SHA mismatch** and route to §4.4 branch 3 (refuse + Imperator gate). The plan having vanished is a maximally stale state; the response is the same as a content-mismatch.
4. If recorded SHA ≠ current SHA → §4.4 branch 3: refuse spawn; surface the diff (or pointer) and the path-resolution result to the Imperator. **Do not fall back to mini-checkit** — a stale protocol is a problem to surface, not a missing capability to substitute.
5. If recorded SHA = current SHA → §4.4 branch 4: spawn the persistent executor.

**Wire shape — diff/refusal surface.** When `/legion` refuses to spawn on SHA mismatch, the diff (or pointer) lands inline in the `/legion` session output AND is appended as a `decisions.md` entry of type `verdict` per CONVENTIONS schema (the `Plan SHA:` field of that entry carries the *current* HEAD blob SHA, not the recorded one). This produces both an operator-friendly inline view and a durable audit trail.

**Wire shape — `tribune-protocol-schema.md` invalidation clause update.** The schema doc's invalidation flow currently reads *"the `plan_id` SHA mismatch is detected at Legion start; Tribunus-executor halts and signals re-design."* B-1.1 corrects this: detection happens at `/legion` pre-spawn (before any executor exists); the response is `/legion` refusing to spawn the executor (not the executor halting). The schema doc must reflect the actual actor and ordering.

**Domain invariants respected.** The persistent executor runs only against the plan it was authored for. A protocol authored against an old plan version — including a plan that has been deleted or renamed — cannot be silently reused.

**Success criteria.**
- Schema doc specifies blob SHA explicitly and names `/legion` (not the executor) as the actor that refuses on mismatch.
- `tribune-protocol.md` files written by Tribunus-design carry blob SHA in the `plan_id` field.
- `/legion` pre-spawn computes the current blob SHA, handles path-not-resolvable as mismatch, compares, and refuses on mismatch.
- A deliberately edited plan triggers refusal with diff visibility (inline + `decisions.md` entry).
- A deliberately deleted/renamed plan triggers refusal with path-resolution failure surfaced.
- A clean (no-edit) campaign passes pre-spawn without friction.

---

### 4.3 Post-Soldier-Commit Diff Semantics (GAP-3)

**WHAT.** The persistent template's diff guidance specifies a base ref captured per-task. The base ref is the commit SHA at the moment `/legion` dispatches the task to its Soldier. The verifier's diff is bounded by `(task_start_sha, HEAD]` over the task's `change_set`, not bare working-tree-vs-HEAD. The same diff convention applies wherever a per-task diff is read — including `interface_summary` extraction, not only verification.

**Wire shape — `SendMessage` body `/legion` → executor.** The body carries one new field alongside the existing four:

|Field|Type|Status|Semantics|
|-|-|-|-|
|`task_id`|string|existing|task identifier|
|`task_start_sha`|string|**new, required**|full commit SHA at task dispatch (HEAD at the moment `/legion` hands the task to its Soldier). A SendMessage body received without `task_start_sha` is malformed and the executor responds with `verdict: GAP` naming the missing-field error|
|`change_set`|file list|existing|files the Soldier was directed to touch. An empty list (`change_set: []`) is permitted and means the task produced no file changes; the verifier emits `verdict: SOUND` with a `no-op task` note and skips diff extraction|
|`implementation_summary`|string|existing|Soldier's DONE summary|
|`sampled`|bool|existing|counterfactual sampling flag|

**Wire shape — `tribune-log.md` per-task entry.** The schema gains:

|Field|Type|Status|
|-|-|-|
|`task_start_sha`|string|**new, required for every per-task entry**|

`tribune-log.md`'s log entries are per-task and per-window. Across a 15-task window restart, each task captures its own fresh `task_start_sha` at its own dispatch — no cross-window persistence is required at runtime; the appended log entries persist as audit only. The new window's first task captures HEAD at its dispatch (which is HEAD post-recycle, after the window-1 work landed on the branch).

**Wire shape — `task_start_sha` capture surface.** `/legion` captures `task_start_sha` at the **primary task dispatch step** in `/legion`'s flow (the step that hands the task body + domain knowledge to the Soldier). For **fix-soldier re-dispatches** (the path triggered when an earlier task's verifier returned GAP and `/legion` dispatches a fix), `/legion` captures a **fresh** `task_start_sha` at the fix-soldier dispatch — each Soldier dispatch is its own verification unit, and the fix's diff range is bounded by the fix dispatch SHA, not the original task's. (Two consecutive log entries for the same `task_id` may exist: the original verification and the fix's re-verification, each carrying its own `task_start_sha`.)

**Wire shape — diff semantics in the persistent template.** The diff instruction the executor follows reads:

> *Diff slices over `change_set` are bounded by the commit range from `task_start_sha` (exclusive) through current HEAD (inclusive). The base ref is supplied per-task by `/legion` in the SendMessage body. This convention applies to verification slices AND `interface_summary` extraction — both use `(task_start_sha, HEAD]` over `change_set`, never bare `git diff`.*

The exact command is HOW (plan-territory). The semantics — base ref captured at dispatch, range extends through HEAD, single convention across verification and interface extraction — are contract.

**Domain invariants respected.** The verifier sees the work the Soldier produced for *this* task, regardless of when the Soldier commits relative to verification. Bare working-tree-vs-HEAD (the current ambiguous instruction) is no longer permitted because it returns empty after a Soldier commit. `interface_summary` extraction uses the same convention — verifier evidence and downstream-task interface signatures derive from one diff range, not two.

**Soldier discipline (presumed, codified by plan).** Soldiers must not rebase, amend, or reset commits between task dispatch and verification — `task_start_sha` presumes commits accumulate forward. History rewriting between dispatch and verification produces an undefined diff range; this discipline lives in the implementer-prompt template (plan-territory) and is named in §3 Non-Goals as out-of-scope for B-1.1's wire-up work (detection/recovery is a separate hardening pass).

**Success criteria.**
- `/legion` captures `task_start_sha` at primary dispatch and at every fix-soldier re-dispatch.
- SendMessage body carries `task_start_sha` as a required field; executor returns GAP if missing.
- Persistent template specifies the diff range against `task_start_sha`, not bare `git diff`, for both verification and `interface_summary` extraction.
- `tribune-log.md` per-task entries record `task_start_sha`; the field is required.
- Empty `change_set: []` produces SOUND with `no-op task` note (no diff attempted).
- Across a 15-task window restart, each task in the new window captures fresh `task_start_sha`; cross-window state is audit-only.
- A scenario where the Soldier commits mid-task produces a non-empty diff in the verifier's view, bounded correctly by `(task_start_sha, HEAD]`.

---

### 4.4 Partial-Protocol Routing (GAP-5)

**WHAT.** `/legion` pre-spawn no longer halts on missing, empty, unparseable, or malformed `tribune-protocol.md`. Instead, it routes the campaign to **mini-checkit fallback** — the prior ephemeral Tribunus pattern preserved in B-1's commit `a4e6f17` ("preserve mini-checkit fallback"). This brings `/legion` into agreement with the behavior `/edicts:445` already names. `/edicts` semantics are unchanged at the prose/runtime level (see §3 Non-Goals).

**Definition of "well-formed."** A `tribune-protocol.md` is **well-formed** if and only if all four conditions hold:

1. The file parses without error (valid markdown + YAML body).
2. All required top-level fields are present: `schema_version`, `plan_id`, `sampling_mode`, `tasks`. (`tasks` may itself be `[]` — that is a separate empty-protocol case handled at branch 1, not a malformed case.)
3. `plan_id` parses to two non-empty components — a case-relative path and a 40-character lowercase hex SHA. An empty-string path, an empty-string SHA, or an SHA that does not match the hex pattern are malformed.
4. Every entry in `tasks` (when non-empty) has `task_id` and `lanes_triggered` (where `lanes_triggered: []` is permitted per the empty-protocol authorization below).

Anything failing these is **malformed**. Anything passing them is **well-formed** and proceeds to SHA comparison (§4.2).

**Wire shape — `/legion` pre-spawn routing decision (ordered evaluation).** Pre-spawn reads `tribune-protocol.md` **once, atomically**, and evaluates the snapshot in this order; the first matching condition determines the route:

1. **File absent OR empty (zero bytes / whitespace-only / no YAML body) OR unparseable (parse error) OR `tasks: []`** → route to mini-checkit fallback. Skip remaining checks.
2. **File parsed, malformed per the definition above** (missing required fields, empty-string `plan_id` components, invalid SHA format, missing per-task fields) → route to mini-checkit fallback.
3. **Well-formed, `plan_id` SHA mismatch (or plan-file path resolves to nothing at HEAD, per §4.2 step 3)** → refuse spawn; surface diff + path-resolution result + Imperator gate. **Do not fall back** — fall-back would silently mask plan drift.
4. **Well-formed, `plan_id` SHA match** → spawn persistent executor.

The single atomic read protects against race conditions where the protocol file is edited between branch evaluations. If an Imperator (or Tribunus-design re-dispatch) writes the protocol mid-spawn, the next `/legion` invocation observes the new content; this invocation completes against the snapshot it read.

**Sequencing with the pre-spawn smoke check (CONCERN-Provocator-7 fold-in).** The pre-spawn smoke check (Task 15 of B-1's plan, the `tribune-smoke` ephemeral dispatch that exercises the load-bearing primitive) runs **only on branch 4** — the path that actually intends to spawn the persistent executor. On branches 1–3, the smoke check is skipped: branches 1 and 2 route to mini-checkit fallback (no executor to smoke-test); branch 3 refuses spawn entirely. This sequencing closes the "name collision" surface that CONCERN-7 named (smoke names `tribune-smoke` cannot collide with executor names `tribune-w<N>` because they only co-exist when an executor is actually being spawned).

**State table (steady-state view, including prior-failure-mode characterization):**

|Protocol state|Pre-B-1.1 prior behavior|Prior failure mode|B-1.1 behavior|
|-|-|-|-|
|Well-formed, SHA match|Spawn persistent executor|—|Spawn persistent executor (smoke check fires)|
|Well-formed, SHA mismatch|N/A (not wired)|—|Refuse spawn — Imperator gate (§4.2)|
|Malformed (parses but invalid)|Spawn executor|Silent spawn-then-fail|Route to mini-checkit fallback|
|Empty / whitespace / no-body|Spawn executor|Silent spawn-then-fail|Route to mini-checkit fallback|
|Unparseable (YAML/markdown error)|Spawn executor|Silent spawn-then-fail|Route to mini-checkit fallback|
|Absent|Halt|**Deadlock (Provocator GAP-5)**|Route to mini-checkit fallback|

The prior-failure-mode column corrects an earlier framing (iteration-1 §4.4 lumped all five non-spawn states as "deadlock"). Only the absent case was the actual GAP-5 deadlock; the other four were silent spawn-then-fail. The B-1.1 fix unifies the response (route to fallback) but the as-was characterization is more precise here.

**Boundary clarification.** `plan_id` SHA mismatch (§4.2) and absent/empty/unparseable/malformed protocol (§4.4 branches 1–2) are **distinct signals with distinct responses**. A stale-but-well-formed protocol is a problem to surface — fall-back would silently mask plan drift. An absent, empty, unparseable, or malformed protocol is a missing capability — fall-back substitutes ephemeral verification, the same pattern in use today. The two responses do not overlap.

**Wire shape — empty `lanes_triggered` (per-task-level scope).** `tribune-design.md` (the authoring guidance) explicitly authorizes `lanes_triggered: []` (empty list) as a valid per-task state for tasks that genuinely have no per-task verification surface. **This is per-task scope, distinct from §4.4's protocol-level routing.**

The two scopes differ:

|Scope|Decision point|Routing|
|-|-|-|
|**Protocol-level** (§4.4 above)|`/legion` pre-spawn, once per campaign|Branches 1–4 above|
|**Per-task** (this paragraph)|Persistent executor, per `SendMessage`|If `lanes_triggered: []` for the current task → patrol-mode (Claude-side mini-checkit) for that task only; subsequent tasks may still have non-empty `lanes_triggered` and use Kimi dispatch|

The persistent template documents both decision points: protocol-level routing happens at spawn (or non-spawn); per-task routing happens inside the executor's per-SendMessage loop. They do not share a code path.

This wire shape addresses CONCERN-Praetor-2 (`tribune-design.md` doesn't authorize empty `lanes_triggered`) and CONCERN-Provocator-9 (empty-list runbook not explicit). Both fold into B-1.1 as wire-shape clarifications. CONCERN-Provocator-7 (smoke-check name collision) is folded as the sequencing rule above.

**Domain invariants respected.** `/edicts` line 445 ("legion can march on partial-or-empty `tribune-protocol.md`") becomes factually true at the runtime mechanism level for the first time. The persistent executor is opt-in by virtue of a *well-formed and SHA-matching* protocol existing; absence, emptiness, unparseability, malformation all default to the prior, well-understood ephemeral pattern.

**Scope-narrowed deadlock invariant.** No deadlock condition exists where a campaign cannot start due to **missing, empty, unparseable, or malformed** `tribune-protocol.md`. SHA mismatch (branch 3) is not a deadlock — it is an **Imperator-gated halt** that surfaces drift for human decision. The two are distinct: a deadlock is unresolvable without code change; an Imperator-gated halt resolves with a re-dispatch of `/edicts` (regenerate protocol against the new plan) or an Imperator override.

**Success criteria.**
- A campaign with no `tribune-protocol.md` marches via mini-checkit fallback (no halt, no deadlock).
- A campaign with an empty / whitespace-only / no-YAML-body `tribune-protocol.md` marches via mini-checkit fallback.
- A campaign with an unparseable `tribune-protocol.md` marches via mini-checkit fallback.
- A campaign with a malformed `tribune-protocol.md` (missing required fields per the definition above, or invalid `plan_id` shape) marches via mini-checkit fallback.
- A campaign with a well-formed `tribune-protocol.md` and matching `plan_id` SHA spawns the persistent executor (smoke check fires; existing behavior preserved).
- A campaign with a well-formed `tribune-protocol.md` but mismatched `plan_id` SHA OR missing-plan-at-HEAD refuses spawn and surfaces diff + path-resolution + Imperator gate.
- The pre-spawn smoke check fires only on the spawn-branch (branch 4), not on fallback branches.
- `tribune-design.md` explicitly authorizes `lanes_triggered: []` as a per-task state.
- The persistent template documents protocol-level routing AND per-task `lanes_triggered: []` runbook as distinct decision points.
- The atomic-read property holds: protocol-file edits during pre-spawn don't produce inconsistent branch evaluation within a single `/legion` invocation.

---

## 5. Out of Scope / Deferred

- **`/edicts` semantic changes.** All deadlock-related wiring is single-sided on `/legion`.
- **consul-commits-twice blindspot detection.** Custos deferred; B-1.1 follows.
- **Per-protocol completeness gates beyond presence/emptiness.** The pre-spawn check is binary (present+non-empty vs absent-or-empty). A "partially-filled, valid-for-some-tasks" mode would require deeper protocol parsing — out of scope.
- **Migration of historical `tribune-log.md` entries.** None exist; pattern was dormant.
- **The 11 Campaign-Review CONCERNs except CONCERN-Praetor-2, CONCERN-Provocator-7, and CONCERN-Provocator-9.** Triaged in §6 below.

## 6. CONCERN Triage

|#|Source|Concern|Disposition|
|-|-|-|-|
|1|Censor|Stale "two-stance" reference in `claude/CLAUDE.md` Maintenance section (Tribunus has 4 stances)|**Out** — doc drift, not wire-up. Separate housekeeping|
|2|Censor|Same observation through doctrine-vocabulary lens|**Out** — duplicate of #1|
|3|Censor|`tribune-persistent.md` counterfactual numbering non-sequential|**Out** — cosmetic|
|4|Praetor|Stale Codex location in `claude/CLAUDE.md:31` (pre-B-1 drift)|**Out** — already declared out-of-scope by Imperator (decisions.md:27)|
|5|Praetor|`tribune-design.md` doesn't explicitly authorize empty `lanes_triggered`|**IN** — folded into §4.4 per-task scope wire-shape|
|6|Provocator|`kimi_dockets` full-content inlining may explode `tribune-log.md` size|**Out** — log-size concern, orthogonal to the four GAPs. Revisit if observed|
|7|Provocator|Smoke-check name collision risk|**IN** — folded into §4.4 sequencing rule (smoke runs only on branch 4). The integration surface lives in the pre-spawn flow §4.4 reshapes; iteration-1 verification re-triaged this from "Out" to "IN"|
|8|Provocator|Crash recovery doesn't distinguish transient vs terminated SendMessage errors|**Out — with note** — disposition not airtight per iteration-1 verification (crash-recovery respawn vs §4.4 pre-spawn check sequencing is unspecified). Deferred as a separate hardening pass; B-1.1 does not address. The plan should note that crash-recovery respawn re-runs §4.4 pre-spawn evaluation against the current snapshot (consistent with the atomic-read property)|
|9|Provocator|Empty-list `lanes_triggered` runbook path not explicit|**IN** — folded into §4.4 per-task scope wire-shape|
|10|Provocator|`/edicts` BLOCKER-override prompt phrasing references "legion-awaits"|**Out** — prompt drift; doc fix|
|11|Provocator|Cosmetic deviations (duplicate line + literal `\n`) at `edicts/SKILL.md:432-434`, `legion/SKILL.md:229,246`|**Out** — cosmetic|

Three CONCERNs fold into B-1.1 — CONCERN-5 and CONCERN-9 into the per-task scope wire-shape; CONCERN-7 into the smoke-check sequencing rule. CONCERN-8 is out-of-scope-with-note (recovery interaction with §4.4 pre-spawn). The remaining seven are out of scope and noted here for traceability.

## 7. Observable Outcomes (campaign-level success)

A clean B-1.1 delivery means:

1. The next campaign that authors a `tribune-protocol.md` can do so against the locked schema, with `plan_id` blob SHA, and run end-to-end against a persistent executor whose verdicts speak Codex across every surface (template, executor reply, log schema, `/legion` DONE handler).
2. A stale protocol — content-mismatched OR plan-file-deleted — is *visibly refused* at `/legion` start, with the diff and path-resolution result surfaced inline AND in `decisions.md`. Drift never silently corrupts verification.
3. A campaign without a protocol, or with empty / unparseable / malformed protocol — by design or by Tribunus-design crash — marches cleanly via mini-checkit fallback. No deadlock from those cases. SHA mismatch is a separate Imperator-gated halt, not a deadlock.
4. A campaign with a full protocol — but where Soldiers commit between tasks — produces non-empty, correctly-bounded diffs in every per-task verifier view AND in `interface_summary` extraction. One diff convention end-to-end.
5. Across all four wire-ups: no second vocabulary survives in any of the five named surfaces (§4.1 migration footprint table), no second SHA semantic, no second diff convention. The Codex remains the single source of verifier discipline.

## 8. Confidence Map

|Section|Confidence|Evidence|
|-|-|-|
|§1 Why this exists|High|Direct quote from parent case decisions.md:73 ("0 MISUNDERSTANDING") + decisions.md:81-91 (Imperator routing decision)|
|§2 Goals|High|Each goal traces to a specific Provocator GAP at parent decisions.md:74|
|§3 Non-goals|High|Each deferral has a named precedent (Custos blindspot at `custos-edicts-wiring/decisions.md:115`; `/edicts` runtime mechanism untouched) or explicit Imperator scoping; Soldier history-rewrite discipline named explicitly|
|§4.1 Vocabulary unification|Medium|Iteration-1 verification expanded the migration footprint from 2 surfaces to 5 (persistent template spawn body, persistent template per-task guidance, executor reply, log schema, `/legion` DONE handler prose); the unification itself is the right doctrinal move (per `provocator-decompose/decisions.md:99` + lane templates) but the integration surface is broader than originally scoped, and the new MISUNDERSTANDING category is an *extension* not a *migration*|
|§4.2 `plan_id` SHA wire-up|High|Schema field already specified (`tribune-protocol-schema.md:11,38,64-66`); Custos precedent for blob SHA at `custos-edicts-wiring/decisions.md:111`; iteration-2 added plan-file-absent-at-HEAD case (treated as mismatch) and schema doc actor-correction (`/legion` not the executor)|
|§4.3 Diff semantics|Medium|Single diff convention applied to verification + `interface_summary` extraction (one wire shape, two call sites); `task_start_sha` lifecycle codified across primary dispatch, fix-soldier re-dispatch, 15-task window restart, and required-field migration semantics; Soldier history-rewrite discipline presumed and named in §3|
|§4.4 Partial-protocol routing|Medium|`/edicts:445` already names this behavior; iteration-2 added (a) precise "well-formed" definition with required-fields enumeration, (b) atomic-read property to close read-then-act race, (c) smoke-check sequencing on branch 4 only (folds CONCERN-7), (d) per-task-vs-protocol-level scope distinction (folds CONCERN-5+9), (e) scope-narrowed deadlock invariant. Integration surface remains the highest in the spec|
|§5 Out of scope|High|Each item has a documented reason for deferral; iteration-2 added Soldier history-rewrite discipline + `/edicts` documentation refresh as named non-goals|
|§6 CONCERN triage|High|Each disposition cites the coupling rationale (or lack thereof); iteration-2 re-triaged CONCERN-7 from "Out" to "IN" (smoke-check sequencing) and added "Out-with-note" status to CONCERN-8 (crash-recovery interaction)|
|§7 Observable outcomes|High|Each outcome maps directly to a §4 sub-section; iteration-2 sharpened outcome 3 (deadlock invariant scope-narrowed) and outcome 5 (vocabulary-footprint enumeration)|
