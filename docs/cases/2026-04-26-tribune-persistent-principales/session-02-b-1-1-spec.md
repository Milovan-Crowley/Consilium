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
- **Most of the 11 Campaign-Review CONCERNs.** Section 6 below triages each. Two fold in (both are about empty `lanes_triggered` and couple to GAP-5); nine remain advisory or out of scope.
- **CONVENTIONS-compliance cleanup.** The parent case lacks `STATUS.md`. This is a pre-existing CONVENTIONS gap, not a B-1.1 wire-up concern. Out of scope; flagged for a separate housekeeping pass.

## 4. Scope — The Four Wire-Ups

The campaign delivers four feature-level changes. Each is implementation-independent, but all four together unlock the persistent pattern.

### 4.1 Vocabulary Unification (GAP-4)

**WHAT.** The persistent Tribunus template emits Codex categories — `MISUNDERSTANDING / GAP / CONCERN / SOUND` — exclusively. The legacy `PASS / CONCERN / FAIL` vocabulary, including the `FAIL with MISUNDERSTANDING tag` convention, is retired from the persistent template and from the executor's reply contract. No translation layer is introduced.

**Wire shape — executor reply body (the SendMessage round-trip boundary).** The executor's reply to `/legion`'s DONE handler carries:

|Field|Type|Domain|
|-|-|-|
|`verdict`|enum|one of `SOUND`, `CONCERN`, `GAP`, `MISUNDERSTANDING`|
|`verdict_summary`|string|one-line synopsis tied to the verdict category|
|`findings`|free-form|Codex-tagged findings; chain-of-evidence per Codex rules|

**Vocabulary mapping (one-time migration reference, not a runtime layer):**

|Old|New|Semantics|
|-|-|-|
|`PASS`|`SOUND`|Task verified, no findings|
|`CONCERN`|`CONCERN`|Approach works; better alternative noted; advisory|
|`FAIL`|`GAP`|Requirement uncovered or task missing something — auto-feed back per Codex|
|`FAIL with MISUNDERSTANDING tag`|`MISUNDERSTANDING`|Soldier does not grasp a domain concept — halt, escalate, no auto-fix|

**Domain invariants respected.** The Codex's halt-on-MISUNDERSTANDING rule is preserved unchanged: `MISUNDERSTANDING` from a per-task verifier halts the campaign and escalates to the Imperator; `/legion` does not auto-feed. The 2-iteration cap on GAP/CONCERN auto-feed is preserved unchanged.

**Success criteria.**
- Every `PASS|CONCERN|FAIL` reference in the persistent Tribunus template is replaced with the Codex category.
- The executor reply contract uses Codex vocabulary; `/legion`'s DONE handler reads Codex categories without string-matching `PASS` / `FAIL`.
- A test campaign run produces verdicts in Codex vocabulary end-to-end.
- The Codex doctrine itself (categories, halt rules, auto-feed cap) is unchanged.

**Precedent reference.** The `2026-04-26-provocator-decompose` campaign chose unification over translation for the same class of vocabulary collision (provocator-decompose decisions.md:24); the substitution-contract pattern (one preamble, per-role mission overlay, identical output vocabulary) is the doctrinal anchor.

---

### 4.2 `plan_id` SHA Mismatch Wire-Up (GAP-1)

**WHAT.** `/legion` pre-spawn becomes the enforcement point for `plan_id` mismatch detection. The protocol schema already defines a `plan_id` field; B-1.1 pins its semantics, the comparison the pre-spawn performs, and the response on mismatch.

**Wire shape — `tribune-protocol.md` `plan_id` field.** The field carries two components:

|Component|Semantics|
|-|-|
|case-relative path to `plan.md`|the file the protocol was authored against|
|blob SHA at authoring time|`HEAD:<plan-path>` blob SHA at the moment Tribunus-design wrote the protocol|

The schema doc (`tribune-protocol-schema.md`) currently reads *"commit-or-hash"* (ambiguous). B-1.1 pins this to **blob SHA**, not commit SHA, matching the Custos precedent (`2026-04-26-custos-edicts-wiring` decisions.md:111). Rationale: blob SHA is stable across unrelated commits and detects only meaningful plan changes.

**Wire shape — `/legion` pre-spawn comparison.** The SHA comparison runs only after §4.4's branches 1 and 2 are passed (file present and well-formed). It is the discriminator for §4.4's branches 3 vs 4:

1. Read `tribune-protocol.md`'s `plan_id` field.
2. Compute the current blob SHA of the plan file at HEAD.
3. If recorded ≠ current → §4.4 branch 3: refuse to spawn the persistent executor; surface the diff (or a pointer to it) to the Imperator. **Do not fall back to mini-checkit** — a stale protocol is a problem to surface, not a missing capability to substitute.
4. If recorded = current → §4.4 branch 4: spawn the persistent executor.

**Domain invariants respected.** The persistent executor runs only against the plan it was authored for. A protocol authored against an old plan version cannot be silently reused.

**Success criteria.**
- Schema doc specifies blob SHA explicitly.
- `tribune-protocol.md` files written by Tribunus-design carry blob SHA in the `plan_id` field.
- `/legion` pre-spawn computes the current blob SHA, compares, and refuses on mismatch.
- A deliberately edited plan triggers refusal with diff visibility.
- A clean (no-edit) campaign passes pre-spawn without friction.

---

### 4.3 Post-Soldier-Commit Diff Semantics (GAP-3)

**WHAT.** The persistent template's diff guidance specifies a base ref captured per-task. The base ref is the commit SHA at the moment `/legion` dispatches the task to its Soldier. The verifier's diff is bounded by `(base_ref, HEAD]` over the task's `change_set`, not bare working-tree-vs-HEAD.

**Wire shape — `SendMessage` body `/legion` → executor.** The body carries one new field alongside the existing four:

|Field|Type|Status|Semantics|
|-|-|-|-|
|`task_id`|string|existing|task identifier|
|`task_start_sha`|string|**new**|full commit SHA at task dispatch (HEAD at the moment `/legion` hands the task to its Soldier)|
|`change_set`|file list|existing|files the Soldier was directed to touch|
|`implementation_summary`|string|existing|Soldier's DONE summary|
|`sampled`|bool|existing|counterfactual sampling flag|

**Wire shape — `tribune-log.md` per-task entry.** The schema gains:

|Field|Type|Status|
|-|-|-|
|`task_start_sha`|string|**new**|

**Wire shape — diff semantics in the persistent template.** The diff instruction the executor follows is:

> *Diff slices over `change_set` are bounded by the commit range from `task_start_sha` (exclusive) through current HEAD (inclusive). The base ref is supplied per-task by `/legion` in the SendMessage body.*

The exact command is HOW (plan-territory). The semantics — base ref captured at dispatch, range extends through HEAD — are contract.

**Domain invariants respected.** The verifier sees the work the Soldier produced for *this* task, regardless of when the Soldier commits relative to verification. Bare working-tree-vs-HEAD (the current ambiguous instruction) is no longer permitted because it returns empty after a Soldier commit.

**Success criteria.**
- `/legion` captures `task_start_sha` at task dispatch.
- SendMessage body carries the field; executor reads it.
- Persistent template specifies the diff range against `task_start_sha`, not bare `git diff`.
- `tribune-log.md` per-task entries record the field for audit.
- A scenario where the Soldier commits mid-task produces a non-empty diff in the verifier's view.

---

### 4.4 Partial-Protocol Routing (GAP-5)

**WHAT.** `/legion` pre-spawn no longer halts on missing or empty `tribune-protocol.md`. Instead, it routes the campaign to **mini-checkit fallback** — the prior ephemeral Tribunus pattern preserved in B-1's commit `a4e6f17` ("preserve mini-checkit fallback") — the behavior `/edicts` already promises but `/legion` does not yet wire. `/edicts` semantics are unchanged.

**Wire shape — `/legion` pre-spawn routing decision (ordered evaluation).** Pre-spawn evaluates the protocol state in this order; the first matching condition determines the route:

1. **File absent OR empty** → route to mini-checkit fallback. Skip remaining checks.
2. **File present, malformed** (parseable but missing required fields, including `plan_id`) → route to mini-checkit fallback. (A malformed protocol cannot drive the persistent executor; treating it as present-but-uninstructive is the safe substitution.)
3. **File present, well-formed, `plan_id` SHA mismatch** → refuse spawn; surface diff + Imperator gate (per §4.2). **Do not fall back** — fall-back would silently mask plan drift.
4. **File present, well-formed, `plan_id` SHA match** → spawn persistent executor.

**State table (steady-state view):**

|Protocol state|Pre-B-1.1 behavior|B-1.1 behavior|
|-|-|-|
|File present, well-formed, SHA match|Spawn persistent executor|Spawn persistent executor|
|File present, well-formed, SHA mismatch|N/A (not wired)|Refuse spawn — Imperator gate (§4.2)|
|File present, malformed (missing required fields)|Spawn executor (likely fails)|Route to mini-checkit fallback|
|File present, empty|Spawn executor (likely fails)|Route to mini-checkit fallback|
|File absent|Halt — deadlock (Provocator GAP-5)|Route to mini-checkit fallback|

**Boundary clarification.** `plan_id` SHA mismatch (§4.2) and missing/empty/malformed protocol (§4.4) are **distinct signals with distinct responses**. A stale-but-well-formed protocol is a problem to surface — fall-back would silently mask plan drift. A missing, empty, or malformed protocol is a missing capability — fall-back substitutes ephemeral verification, the same pattern in use today. The two responses do not overlap.

**Wire shape — empty-protocol authorization.** `tribune-design.md` (the authoring guidance) explicitly authorizes `lanes_triggered: []` (empty) as a valid protocol state for tasks that genuinely have no per-task verification surface. The runbook path for empty-list `lanes_triggered` becomes explicit in the persistent template: empty list at protocol level → fall-back-patrol routing for that task slot (or campaign-wide if all tasks are empty).

This addresses Praetor CONCERN-2 and Provocator CONCERN-9 from B-1's Campaign Review (decisions.md:75) — both of which observed that empty `lanes_triggered` was schema-permitted but neither doctrine-authorized nor runbook-explicit. They couple cleanly to GAP-5 because empty-list semantics and missing-protocol semantics share the same fall-back path.

**Domain invariants respected.** `/edicts` and `/legion` agree on partial-protocol semantics. No deadlock condition exists where a campaign cannot start. The persistent executor is opt-in by virtue of a complete protocol existing; absence or emptiness defaults to the prior, well-understood ephemeral pattern.

**Success criteria.**
- A campaign with no `tribune-protocol.md` marches successfully via mini-checkit fallback.
- A campaign with an empty `tribune-protocol.md` marches successfully via mini-checkit fallback.
- A campaign with a malformed `tribune-protocol.md` (missing `plan_id` or other required fields) marches via mini-checkit fallback.
- A campaign with a well-formed `tribune-protocol.md` and matching `plan_id` SHA marches via the persistent executor (existing behavior preserved).
- A campaign with a well-formed `tribune-protocol.md` but mismatched `plan_id` SHA refuses spawn and surfaces the diff to the Imperator.
- `tribune-design.md` explicitly authorizes empty `lanes_triggered`.
- The persistent template documents the empty-list runbook path.

---

## 5. Out of Scope / Deferred

- **`/edicts` semantic changes.** All deadlock-related wiring is single-sided on `/legion`.
- **consul-commits-twice blindspot detection.** Custos deferred; B-1.1 follows.
- **Per-protocol completeness gates beyond presence/emptiness.** The pre-spawn check is binary (present+non-empty vs absent-or-empty). A "partially-filled, valid-for-some-tasks" mode would require deeper protocol parsing — out of scope.
- **Migration of historical `tribune-log.md` entries.** None exist; pattern was dormant.
- **The 11 Campaign-Review CONCERNs except CONCERN-Praetor-2 and CONCERN-Provocator-9.** Triaged in §6 below.

## 6. CONCERN Triage

|#|Source|Concern|Disposition|
|-|-|-|-|
|1|Censor|Stale "two-stance" reference in `claude/CLAUDE.md` Maintenance section (Tribunus has 4 stances)|**Out** — doc drift, not wire-up. Separate housekeeping|
|2|Censor|Same observation through doctrine-vocabulary lens|**Out** — duplicate of #1|
|3|Censor|`tribune-persistent.md` counterfactual numbering non-sequential|**Out** — cosmetic|
|4|Praetor|Stale Codex location in `claude/CLAUDE.md:31` (pre-B-1 drift)|**Out** — already declared out-of-scope by Imperator (decisions.md:27)|
|5|Praetor|`tribune-design.md` doesn't explicitly authorize empty `lanes_triggered`|**IN** — folded into §4.4. Couples to GAP-5|
|6|Provocator|`kimi_dockets` full-content inlining may explode `tribune-log.md` size|**Out** — log-size concern, orthogonal to the four GAPs. Revisit if observed|
|7|Provocator|Smoke-check name collision risk|**Out** — orthogonal to wire-up; a separate hardening pass|
|8|Provocator|Crash recovery doesn't distinguish transient vs terminated SendMessage errors|**Out** — orthogonal hardening|
|9|Provocator|Empty-list `lanes_triggered` runbook path not explicit|**IN** — folded into §4.4. Couples to GAP-5|
|10|Provocator|`/edicts` BLOCKER-override prompt phrasing references "legion-awaits"|**Out** — prompt drift; doc fix|
|11|Provocator|Cosmetic deviations (duplicate line + literal `\n`) at `edicts/SKILL.md:432-434`, `legion/SKILL.md:229,246`|**Out** — cosmetic|

Two CONCERNs fold into B-1.1 — both into §4.4. The remaining nine are out of scope and noted here for traceability.

## 7. Observable Outcomes (campaign-level success)

A clean B-1.1 delivery means:

1. The next campaign that authors a `tribune-protocol.md` can do so against the locked schema, with `plan_id` blob SHA, and run end-to-end against a persistent executor whose verdicts speak Codex.
2. A stale protocol is *visibly refused* at `/legion` start, with the diff surfaced — drift never silently corrupts verification.
3. A campaign without a protocol — by design or by Tribunus-design crash — marches cleanly via mini-checkit fallback. No deadlock.
4. A campaign with full protocol — but where Soldiers commit between tasks — produces non-empty, correctly-bounded diffs in every per-task verifier view.
5. Across all four wire-ups, no second vocabulary, no second SHA semantic, no second diff convention — the Codex remains the single source of verifier discipline.

## 8. Confidence Map

|Section|Confidence|Evidence|
|-|-|-|
|§1 Why this exists|High|Direct quote from parent case decisions.md:81-91|
|§2 Goals|High|Each goal traces to a specific Provocator GAP (decisions.md:74)|
|§3 Non-goals|High|Each deferral has a named precedent (Custos blindspot, `/edicts` untouched) or explicit Imperator scoping|
|§4.1 Vocabulary unification|High|Provocator-decompose precedent (decisions.md:24); existing partial Codex mapping at `/legion/SKILL.md:124`; bounded surface|
|§4.2 `plan_id` SHA wire-up|High|Schema field already specified (`tribune-protocol-schema.md:11,38,64-66`); Custos precedent for blob SHA|
|§4.3 Diff semantics|High|Single-line template fix; SendMessage body extension is mechanical; one new docket field|
|§4.4 Partial-protocol routing|Medium|`/edicts` already promises this behavior, but routing-branch wiring (missing → fallback vs absent → halt) is new and must integrate with the mini-checkit fallback path preserved in B-1's commit `a4e6f17`. Two CONCERNs fold here cleanly, raising integration surface|
|§5 Out of scope|High|Each item has a documented reason for deferral|
|§6 CONCERN triage|High|Each disposition cites the coupling rationale (or lack thereof)|
|§7 Observable outcomes|High|Each outcome maps directly to one of the four §4 sections|
