# DIV-100 Phase 2 — Reference

**Branch:** `feature/div-100-non-apparel-saved-product` (Phase 1 + Phase 2)
**True parent in this worktree:** local `feature/div-82-importer-hierarchy` at `377a9d9`
**Do not target current `origin/develop` directly yet:** this branch shows 48 commits ahead of current `origin/develop`; the actual DIV-100 delta is the 12 commits after `377a9d9`.
**Status:** Implemented, verified, committed. Awaiting merge/PR.

## Commits

- `073913a` — Task 1: cart-add multiplier contract (`options_values` membership + factor 1.0 default)
- `54ab5f1` — Task 2: non-apparel saved-product reorder shortcut at custom-complete

## What Shipped

### Task 1 — Multiplier Contract
**File:** `src/workflows/pricing/utils/calculate-promo-print-price.ts`

- Reads `optionsValues` from metadata alongside multipliers.
- For each option, asserts `selectedValue ∈ optionsValues[code]` — throws `INVALID_DATA` if not.
- Missing multiplier row: factor defaults to `1.0` instead of throwing (replaces "Q-B FIX-LOUD").
- Net effect: cart-adds against a saved product whose `options_values` Phase 1 narrowed are structurally rejected when re-expanded.

### Task 2 — Reorder Gate Widening
**File:** `src/api/store/carts/[id]/custom-complete/route.ts:248-252`

- Dropped `items[0]?.metadata?.product_type === "apparel"` clause from saved-product gate.
- Predicate is now: `proofType === ORDER && items[0]?.product?.metadata?.custom_order_id != null`.
- Non-apparel saved products take the same APPROVED + PROOF_DONE shortcut on reorder.

## Test Coverage Added

- `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts`
  - Inverted Q-B FIX-LOUD → factor 1.0 default.
  - 3 new membership tests (undeclared throws, undefined throws, narrowed-saved-product rejects).
- `integration-tests/http/non-apparel-cart.spec.ts`
  - Test 12 inverted (missing row → 200).
  - Test 12c (catalog membership-violation → 400).
  - Test 12d (saved-product structural lock via `productModuleService.updateProducts`).
  - Test 15b deleted (apparel-only gate reversed).
- `integration-tests/http/approve-proof-non-apparel.spec.ts`
  - Reorder happy-path test added; uses `query.graph(order_line_item → custom_order)` traversal.
  - `disableAutoTeardown: true` runner flag added.

**Result:** 69/69 unit tests pass.
**Additional live check (2026-04-29):** targeted integration suite passed — `integration-tests/http/non-apparel-cart.spec.ts` and `integration-tests/http/approve-proof-non-apparel.spec.ts`, 27/27 tests.

---

## Legitimate Open Issues (§6.6 Residuals)

These were acknowledged in spec §6.6 and **deliberately not fixed in Phase 2**. Each is a real bug with a real surface, but each is out-of-scope for the reorder + multiplier contract.

| # | Issue | Where | Surface |
|-|-|-|-|
| 1 | If source metadata omits a real multiplier code from `multiplier_keys` entirely, the helper never classifies that submitted option as a multiplier, so no membership check runs for it. Undefined `options_values[code]` for a declared multiplier now throws. | `calculate-promo-print-price.ts` option classification before membership branch | Catalog import discipline; would need importer-side validation. |
| 2 | Deleted `custom_order` row on saved product → 500 `TypeError` on `customOrder.product_name` instead of clean error. | `custom-complete/route.ts` reorder shortcut path | Cross-company lineage hardening — slated for **DIV-101**. |
| 3 | CATALOG proofs that somehow carry `custom_order_id` metadata → fall through gate to $0 fulfillment path. | Same predicate as #2 | DIV-101. |
| 4 | Cart-add validates numeric positive `options.quantity` before pricing, but the standalone pricing preview route calls the helper directly. If malformed catalog data still produced a matching quantity variant and no multiplier row, the helper would default factor to 1.0. | `calculate-promo-print-price.ts` quantity lookup / `pricing/promo-print` route | Importer schema enforcement or preview-route parity. |
| 5 | Membership check uses strict-string `Array.includes`; numeric/string drift in catalog data (e.g. `["500"]` vs `[500]`) would falsely reject. | `calculate-promo-print-price.ts` `declared.includes(selectedValue)` | Importer schema enforcement. |

## Out-of-Scope Bug Found

**`integration-tests/http/proof-to-order.spec.ts`** — pre-existing Zod fixture bug on company creation (`admin: { ... }` passed where array expected). Unrelated to Phase 2; pre-dates this branch. Imperator authorized leaving it as a separate Phase 1 issue.

## Declined CONCERNs (Provocator)

Three CONCERNs were raised and declined on merit, recorded for transparency:

1. TS strict-null annotation in test fixture — declined as style-consistent with surrounding tests.
2. TS cast on `options_values` shape — declined as existing residual class (same shape used throughout `_custom/data/*`).
3. Test brittleness from hardcoded multiplier rows — declined as latent and bounded; fixture lives next to test.

---

## Verification Trail

- **Spec verification:** Censor MISUNDERSTANDING + Provocator GAP both addressed in spec revision `eb46e59`.
- **Plan verification:** Praetor MISUNDERSTANDING (reclassified as factual GAP) addressed in plan revision `fc72061`.
- **Per-task Tribunus:** SOUND on both tasks.
- **Campaign review:** Censor + Praetor + Provocator — all SOUND on shipped behavior; 3 declined CONCERNs above.
