# Diagnosis Packet — 14 Fields

The packet is the Medicus's core artifact. Written during Phase 4 (Packet construction), verified by the Tribunus (diagnosis stance) + Provocator in Phase 5, persisted to the case file in Phase 6 before the Imperator gate.

## Field enumeration

1. **Symptom** — external observable (customer-facing failure, test output, UI state). One or two sentences. No speculation.

2. **Reproduction** — exact steps, or explicit statement of inability with cause ("could not reproduce on staging; cause is a race on first login; observed twice in production logs").

3. **Affected lane** — one of `storefront` | `storefront-super-admin` | `admin-dashboard` | `medusa-backend` | `cross-repo` | `unknown` (see `lane-classification.md`).

4. **Files/routes inspected** — absolute paths the scouts hit, with short annotation of what was inspected.

5. **Failing boundary** — the layer where the expected contract broke: route handler, workflow step, subscriber, store, API surface, UI component boundary.

6. **Root-cause hypothesis** — the Medicus's single leading explanation. One paragraph. Not a menu of possibilities.

7. **Supporting evidence** — file:line citations, log excerpts, MCP answers supporting the hypothesis. No prose — this field is citations only.

8. **Contrary evidence** — observations that do NOT fit the hypothesis. REQUIRED field. `None observed — contrary evidence actively searched for` is a valid answer. Placeholder or empty is a GAP (Tribunus diagnosis stance catches this).

9. **Known gap considered** — structured sub-fields: `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`. `None applicable — checked against all <lane> entries` is valid when no known gap maps. Using a known gap as evidence without live recheck (`Live recheck performed: no`) is MISUNDERSTANDING.

10. **Proposed fix site** — absolute path + approximate line range where the fix belongs. Single location when possible; `<path-A:range>; <path-B:range>` when the fix is cross-boundary.

11. **Fix threshold** — `small` | `medium` | `large` | `contain` per `fix-thresholds.md`. The Medicus proposes; the Imperator overrides at invocation if needed.

12. **Verification plan** — exact command or test that confirms the fix after dispatch. If a new test must be written to verify, the plan names the test file + the assertion to add. The Legatus runs this after dispatch.

13. **Open uncertainty** — what the Medicus does NOT know but the fix depends on. Intentional honesty. Becomes the Provocator's target — not a weakness but a flag for adversarial review.

14. **Contract compatibility evidence** — REQUIRED when Affected lane = `cross-repo` OR Fix threshold = `medium` on cross-repo scope. States whether the proposed fix is backward-compatible. Format:
    - `backward-compatible — <evidence>` (e.g., `backend still returns old shape; only adds new optional field`)
    - `breaking — <which consumers error on old shape, requires synchronized deploy>`
    - `N/A — single-lane fix` (for non-cross-repo cases)

## Field 14 and the Medium/Large distinction

Legion's Debug Fix Intake gates Medium-cross-repo dispatches on field 14 reading `backward-compatible`. A `breaking` value means the threshold must be `large` (Consul escalation for synchronized deploy planning). Tribunus diagnosis stance verifies this evidence matches the declared threshold.

## What makes a field complete

- A field with prose that restates the field name is incomplete. "Symptom: the bug happens" is empty.
- A field with "N/A" is complete ONLY when the spec says N/A is valid (fields 9, 14).
- A field with placeholder syntax (`[TODO]`, `[TBD]`, `...`) is a GAP.
- Fields 5, 6, 10, 11 must each point at a concrete thing: layer, hypothesis, path, threshold. Not "somewhere in the backend" or "around line 200."
