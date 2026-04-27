---
case: 2026-04-26-provocator-decompose
type: smoke-tests
---

# Provocator Decomposition — Smoke Tests

Manual session-level tests for the five-lane Provocator dispatch + spec discipline rule + differential re-verify + merge protocol. Each test requires a fresh `/consul` session driving the wiring through actual verification dispatches. The implementing soldier produces this checklist; the Imperator (or a fresh session under his direction) executes each test.

The tests exercise session-level dispatcher behavior across the consul + 5 Provocator lane + Censor (or Praetor) boundary that is only realizable in real sessions. Tests 8 and 9 in particular are documentation-review tests of the trigger-declaration schema and merge-protocol rules; the contracts ARE the test surface in this implementation, since the dispatcher is prose-driven, not code-driven.

---

## Test 1 — Five-Lane Spec Verification (Happy Path)

**Goal:** Confirm spec verification fires Censor + 5 Provocator lanes in parallel, all six return findings, the consul presents an attributed merge summary.

**Setup:**

1. Open `/consul` in a fresh session.
2. Brainstorm a small spec (one feature, ~3-5 sections, with a confidence map).
3. Approve the spec; trigger spec verification dispatch.

**Expected:**

- Six Agent tool calls dispatched in parallel: `consilium-censor`, `consilium-provocator-overconfidence`, `consilium-provocator-assumption`, `consilium-provocator-failure-mode`, `consilium-provocator-edge-case`, `consilium-provocator-negative-claim`.
- All six return findings (or SOUND).
- Each Provocator lane report ends with a YAML trigger declaration matching the §12 schema.
- Consul presents merged summary with role-tag-plus-lane-suffix attribution: *"GAP (Provocator / overconfidence-audit lane): X"*.

**Pass criteria:** Six dispatches fire; six reports return; merged summary visible with proper attribution.

---

## Test 2 — Five-Lane Plan Verification (Happy Path)

**Goal:** Confirm plan verification fires Praetor + 5 Provocator lanes in parallel.

**Setup:**

1. Open `/consul` in a fresh session.
2. Brainstorm and approve a small spec.
3. Issue edicts; trigger plan verification dispatch.

**Expected:**

- Six Agent tool calls dispatched in parallel: `consilium-praetor` plus the five Provocator lanes.
- All six return findings.
- Plan-mode lane prompts include the redistributed concerns (overconfidence on plan-WHY citation form; assumption on ordering and existing-code; failure-mode on execution friction and integration; edge-case on task-boundary and scope leaks; negative-claim on sequencing claims).

**Pass criteria:** Six dispatches; merged summary; lanes attack plan-mode concerns.

---

## Test 3 — Spec Discipline Rule Catches HOW in Spec

**Goal:** Confirm the consul Layer-1 self-review scope check catches HOW that belongs in the plan.

**Setup:**

1. Open `/consul`.
2. Brainstorm a spec; deliberately include a section with HOW content (e.g., "the hook is implemented at `src/app/_hooks/useProduct.ts` with this signature: `function useProduct(id: string): Product | null`").
3. Reach Phase 3 Codification self-review.

**Expected:**

- During Layer-1 self-review item 5 (Spec Discipline scope check), consul flags the HOW content.
- Consul applies the litmus test: "could two correct implementations differ?" — yes, the file path is implementation choice.
- Consul moves the file path + signature out of spec, leaves only the wire shape (function signature shape if it crosses a module boundary, or the boundary contract if it does).

**Pass criteria:** HOW content is moved out of spec at self-review, before dispatch.

---

## Test 4 — Plausibility Threshold Suppresses Edge-Case Theater

**Goal:** Confirm the edge-case-hunting and failure-mode-analysis lanes apply the 4-criterion plausibility threshold.

**Setup:**

1. Open `/consul`; draft a spec with normal scope.
2. After dispatch, inspect the edge-case-hunting and failure-mode-analysis lane reports.

**Expected:**

- Lane reports do NOT contain findings of the form "what if A AND B AND C all happen, all unlikely individually." Such findings would fail all 4 criteria of the plausibility threshold.
- Findings raised cite at least one of the 4 criteria explicitly OR the finding is statable as a single user action and is plausibly hit early in real usage.

**Pass criteria:** Reports show disciplined edge-case findings; theatrical multi-event chains are absent.

---

## Test 5 — Differential Re-Verify Fast-Paths Untouched Lanes

**Goal:** Confirm iteration 2 with a small edit fast-paths lanes whose surface did not change.

**Setup:**

1. Open `/consul`; complete iteration 1 of a spec (5 lane reports + Censor return).
2. Edit one paragraph of the spec — a section that matches only ONE lane's trigger declaration (e.g., add a "no migration required" claim that touches only the negative-claim lane's keyword surface).
3. Trigger iteration 2 verification.

**Expected:**

- Consul computes the artifact diff against iteration 1.
- For each lane, evaluates intersection with the lane's iteration-1 trigger declaration.
- Only the negative-claim lane re-fires. The other four Provocator lanes return *"No diff in trigger surface; iteration 1 verdict stands."* with no Agent tool dispatch.
- The Censor re-runs in full (no trigger declaration, no fast-path).

**Pass criteria:** Iteration 2 fires 2 dispatches (Censor + 1 Provocator lane), not 6. Wall-clock collapses accordingly.

---

## Test 6 — Differential Re-Verify Re-Fires Intersecting Lanes

**Goal:** Confirm iteration 2 with a multi-lane edit re-fires only the intersecting lanes.

**Setup:**

1. After iteration 1 of a spec, edit two sections — one matching the assumption-extraction lane's keywords, one matching the failure-mode-analysis lane's section_patterns.
2. Trigger iteration 2.

**Expected:**

- Consul evaluates per-lane intersection; assumption-extraction and failure-mode-analysis lanes re-fire; overconfidence-audit, edge-case-hunting, and negative-claim-attack lanes fast-path.
- Re-fired lanes receive the diff plus prior findings; report findings only on changed content; carry forward (or invalidate) prior findings as appropriate.

**Pass criteria:** Iteration 2 fires Censor + 2 lanes, not 6.

---

## Test 7 — Merge Protocol — Dedup, Synergy, Thin-SOUND, Conflict

**Goal:** Confirm the four-step merge protocol operates as specified.

**Setup:** Inspect a real merge round's behavior in any session that exercises the full 6-dispatch flow. (Tests 1, 2, 5, 6 all produce mergeable inputs.)

**Expected behaviors:**

| Behavior | Expected |
|-|-|
| Dedup pass | Two lanes raising the same GAP merge into one finding with both lane labels: `GAP (Provocator / lane-A + lane-B lanes): X` |
| Synergy pass | Two CONCERNs across lanes pointing to the same GAP get promoted to a single GAP with synergy attribution: `GAP (Provocator / synergy of lane-A + lane-B lanes): X` |
| Thin-SOUND audit | A SOUND with reasoning thinner than "one specific quote + one specific citation" is bounced back to the lane with "show evidence" once. Cap: one re-ask total per merge round. |
| Conflict resolution | Contradictory findings on same surface (e.g., one lane SOUND, another GAP) resolved by Consul on merit per protocol §6. Unresolvable → Imperator escalation. |

**Pass criteria:** Each behavior is observable in at least one session under realistic findings load.

---

## Test 8 — Trigger Declaration Schema (Documentation Review)

**Goal:** Confirm protocol §12 trigger-declaration schema is unambiguous on all matching primitives.

**Setup:** Read `claude/skills/references/verification/protocol.md` §12. For each primitive below, confirm the section specifies the exact behavior:

| Primitive | Contract |
|-|-|
| `keywords` matching | Case-insensitive whole-word; multi-word phrases match as a whole |
| `section_patterns` matching | Regex against heading-line text only; section body falls within if hunk lies between matching heading and next equal-or-shallower heading |
| `evidence_base` matching | Literal `file:line`; touch when diff overlaps the cited line |
| Intersection rule (iter 2+) | Disjunctive — any one of keywords/section_patterns/evidence_base matches |
| Coverage sentinel | `"specific"` (default) vs `"entire_artifact"` (always intersects, no fast-path) |
| Iteration-1 sanity check | Finding outside declared surface flags trigger declaration; fast-path disabled until corrected |

**Pass criteria:** Each primitive is unambiguously addressed in §12; no primitive is described loosely.

---

## Test 9 — Lane Failure Handling (Documentation Review)

**Goal:** Confirm protocol §13 covers all lane failure modes correctly.

**Setup:** Read `claude/skills/references/verification/protocol.md` §13. For each scenario below, confirm specified behavior:

| Scenario | Specified behavior |
|-|-|
| Lane returns no output | Re-dispatch once; still nothing → escalate |
| Lane crashes mid-execution | Escalate immediately; no silent retry |
| Lane returns malformed output | Re-dispatch ONCE with format reminder; second malformed of any kind → escalate |
| Lane returns finding outside declared trigger surface | Process finding normally; flag declaration; disable fast-path until corrected |
| Re-dispatch cap | One per lane per merge round (not one per malformation type) |

**Pass criteria:** Each scenario is unambiguously addressed; no scenario slips through.

---

## Test 10 — Drift Script Coverage (Automated)

**Goal:** Confirm the extended drift script catches Codex drift on lane agents AND persona-body drift on lane agents.

**Setup:**

1. Run baseline:

```bash
python3 /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py
```

Expected: `All 11 agents in sync with canonical Codex; all 5 lane agents in sync with canonical persona body.`

2. Manually edit `~/.claude/agents/consilium-provocator-overconfidence.md`, change one word in the Codex section. Re-run; expected: `DRIFT: consilium-provocator-overconfidence`. Restore the file.

3. Manually edit the same file's persona body (e.g., add a word to the `## Creed` section). Re-run; expected: `PERSONA DRIFT: consilium-provocator-overconfidence`. Restore.

4. Run with `--sync`; expected: Codex section auto-synced from canonical. Persona body NOT auto-synced (script does not support it in v1; `--sync` only addresses Codex drift).

**Pass criteria:** Drift detected on both surfaces; auto-sync addresses Codex only; persona-body sync requires manual editing or a future script extension.

---

## Final Gates (Automated, Run From Implementing Session)

- [ ] `python3 /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py` — clean exit 0 with all-in-sync message.
- [ ] `python3 /Users/milovan/projects/Consilium/claude/scripts/check-tribune-staleness.py` — clean exit 0 (this work does not touch tribune surfaces; pass means no collateral damage).

---

## Closure

The case is closed when:

1. All file edits committed (Tasks 1-15 of `plan.md`).
2. Final gates pass.
3. Tests 1-10 pass on the wired dispatcher (or the Imperator overrides specific failures with rationale logged in `decisions.md`).
4. STATUS.md updated to `closed` with `closed_at` set.
