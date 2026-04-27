# Decisions Log — Consul Specialist Scouts

Audit trail of dispatch-readiness decisions per the Custos / edicts protocol. Entry types: `decision`, `verdict`, `override`, `revert`. Per the protocol, every `verdict` or `revert` entry carries the plan blob SHA at the moment of the entry.

---

## 2026-04-27 — Verdict: PATCH BEFORE DISPATCH (Custos walk 1)

**Type:** verdict
**Plan SHA:** `2c2f010319b2048802508599548d5ecaffe8f811`
**Walk:** Custos first walk on iteration-2 plan.

**Findings:**
- GAP (Walk 1 — Shell): seven commit blocks (T1, T7, T8, T9, T10, T11, T12) issued relative-path `git add` without `cd` prepend. Per Custos doctrine, agent threads have cwd reset between bash calls; only T6 had the correct `cd /Users/milovan/projects/Consilium` prepend. Failure mode: `fatal: not a git repository` at runtime.
- GAP (Walk 1 — Shell): T1 Step 2 used `ls -la` to verify the case-mining template; this asserts existence but not non-empty content.
- CONCERN (Walk 1 — Shell, advisory): T2 Step 3 `xargs grep -l` silently no-ops on empty file lists. Acceptable for MVP per Custos.
- 4 SOUND findings on spec/plan consistency and Plan-WHY citation form.

**Action:** patches applied via Edit (7 cwd-prepends + T1 Step 2 `[ -s ]` rewrite); committed as `6afe9be`.

---

## 2026-04-27 — Verdict: OK TO MARCH (Custos walk 2)

**Type:** verdict
**Plan SHA:** `97db3f0c2b9db80144844582914d3af9f8f67142`
**Walk:** Custos re-walk after patches, with `## Re-walk Marker` populated by unified diff hunks (per protocol).

**Findings:**
- 5 SOUND findings:
  - Walk 1: cwd discipline correctly applied to all patched commit blocks (13 `cd /Users/milovan/projects/Consilium` hits across plan.md, all targeted blocks now match T6's canonical pattern).
  - Walk 1: T1 Step 2 bracket-test guard parses clean in zsh.
  - Walk 6: patches surgical, no cross-reference drift.
  - Walk 5: no new negative claims introduced.
  - Walks 2, 3, 4: patches do not regress prior clean status.
- 0 GAP, 0 CONCERN, 0 MISUNDERSTANDING.
- Do Not Widen section preserved (Custos resisted §4.1.1 enforcement re-litigation, T13 placement critique, plan reordering, lane-carve re-evaluation, and `set -euo pipefail` aesthetic).

**Action:** verdict honored; proceed to Tribunus-Design dispatch per `/edicts` flow.

---

## 2026-04-27 — Decision: Tribunus-Design DESIGN_COMPLETE

**Type:** decision
**Plan SHA:** `97db3f0c2b9db80144844582914d3af9f8f67142`
**Protocol blob SHA (working tree, pre-commit):** `8481760f745b71dd6bef916d63c9afb3b45fa903`

After OK TO MARCH (walk 2), the Imperator authorized Tribunus-Design dispatch. The Tribunus subagent in design stance read the plan with fresh context and authored `tribune-protocol.md`.

**Output:**
- 13 task entries (T1–T13) with lane assignments per the four execution-family lanes.
- T13 (MANUAL refusal-contract verification by Imperator/Legatus) authored as `lanes_triggered: []` per design-template authorization for tasks with no soldier diff to Kimi-verify.
- All other tasks fire 3–4 lanes; counterfactual sampling on T3, T6, T9, T12 (every-3rd-task-by-plan-index).
- `plan_id` written as `plan.md 97db3f0c…` (case-relative path + space-separated blob SHA per schema).
- Doctrine paths under `$CONSILIUM_DOCS/doctrine/` cited only by T9 (`lane-classification.md`); other domain-correctness lanes cite this case's `spec.md` as meta-doctrine, per dispatch authorization recognizing the meta-Consilium nature of the plan (the spec itself encodes the architecture contracts the plan modifies).

**Action:** Imperator authorized `/consilium:legion`. Committing protocol + this entry; re-invoking legion (branch 4 — well-formed + SHA match → persistent executor + smoke check).
