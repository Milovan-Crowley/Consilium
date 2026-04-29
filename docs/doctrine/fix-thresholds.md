# Fix Thresholds — Four Values

The Tribunus diagnosis stance proposes a threshold in packet field 11. The Imperator overrides at `/tribune` invocation if needed. The Legatus honors the Imperator's confirmed threshold, not the Tribunus diagnosis stance's.

## Thresholds

- **`small`** — single file, ≤30 lines of change, single repo. Additionally: no data model change, no visible UX change, **no schema change** (Zod, TypeScript types, OpenAPI, DB migration), **no new external dependency** (no `package.json` delta), **no change to the TYPE SIGNATURE of any exported symbol** (parameters added/removed/renamed, return type changed, type of an exported constant changed, generic constraints changed, API route handler signature changed, workflow input/output type changed). Fixes that change only the BODY of an exported function while preserving its signature ARE eligible for `small`. Legion dispatches one Centurio with the case file as orders; runs the verification plan as the acceptance test. If ANY of these exclusions are violated, the threshold is `medium` — the Tribunus diagnosis stance re-proposes.

- **`medium`** — 2+ files, model or workflow touch, visible to Legion discipline. Two sub-cases:
  - **Single-repo medium:** all changes in `divinipress-store` OR all in `divinipress-backend`. One full `/march`.
  - **Cross-repo medium:** changes in BOTH repos. GATED ON FIELD 14 = `backward-compatible`. If field 14 = `backward-compatible`, Legion runs TWO coordinated marches sequenced by contract direction (backend first if frontend depends on new API shape; frontend first only if backend supports both shapes). If field 14 = `breaking`, the threshold is wrong — this is `large`, not `medium`.

- **`large`** — new subsystem, policy change, breaking cross-repo contract (field 14 = `breaking`), or any fix requiring a data migration. Legion does NOT execute. Escalates to the Consul; the case file becomes an input to a fresh spec.

- **`contain`** — Emergency Containment. Reversible, minimal, labeled. Legion dispatches one Centurio with the case file as orders; annotates the case file `Status: contained; root cause pending` after fix lands. The case does NOT close — it surfaces at the Imperator's next `/tribune` session via Phase 1 scan of the cases directory.

## Tribunus diagnosis stance discipline

- Do not inflate (Imperator loses trust in the Tribunus diagnosis stance's calibration).
- Do not deflate (a large fix dispatched as small skips the ceremony it needed).
- When the call is genuinely ambiguous, propose the higher threshold and flag the ambiguity in field 13 (Open uncertainty).

## Tribunus verification

The Tribunus (diagnosis stance) verifies:

- Threshold matches the scope of `Proposed fix site` (field 10). A 4-file fix proposed as `small` is a MISUNDERSTANDING.
- Field 14 matches the threshold: `medium` on cross-repo requires `backward-compatible`; `large` should read `breaking` or reference a migration/policy concern.
- `contain` carries a labeled reversibility plan in field 12 (Verification plan) — how to roll back if the containment regresses.

## Legatus rejection conditions

Legion rejects the case file at intake if:

- Threshold does not match scope (e.g., `small` on a four-file change).
- Tribunus returned MISUNDERSTANDING that the Tribunus diagnosis stance did not escalate.
- Imperator's approval annotation is absent from the case file.
- Field 14 is empty or placeholder on cross-repo.
