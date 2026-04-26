# DIV-99 Custom-Complete Shipping Gate — Diagnosis

## 1. Symptom

`integration-tests/http/non-apparel-cart.spec.ts` fails on the downstream `custom-complete` scenarios. Tests 14, 15, and 16 return 500 from `POST /store/carts/:id/custom-complete` with `No shipping method selected but the cart contains items that require shipping.`

## 2. Reproduction

Run with Node 22 forced ahead of Homebrew Node:

```bash
env PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" yarn test:integration:http --testPathPattern=non-apparel-cart -t "orders list aggregates non-apparel quantity"
env PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" yarn test:integration:http --testPathPattern=non-apparel-cart -t "non-apparel CATALOG proof flow preserves metadata end-to-end"
```

Observed on 2026-04-24: both commands fail at `custom-complete` with the Medusa `validate-shipping` error. `proof-to-catalog` did not reproduce the same shipping error in this checkout; it reached past checkout and failed later at S3 `NoSuchKey`.

## 3. Affected Lane

`medusa-backend`

## 4. Files/Routes Inspected

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts` — non-apparel product fixture and Tests 14/15/16.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/proof-to-catalog.spec.ts` — existing apparel CATALOG regression gate.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/store/carts/[id]/custom-complete/route.ts` — CATALOG normalization, payment setup, and `completeCartWorkflow` boundary.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/scripts/seed-setup.ts` — shipping profiles and shipping option setup.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/core-flows/dist/cart/steps/validate-shipping.js` — exact Medusa validator branch.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/core-flows/dist/cart/workflows/complete-cart.js` — checkout workflow sequence.
- `/Users/milovan/projects/divinipress-store/docs/domain/product-data-flow-cheatsheet.md` — storefront/domain proof-vs-order contract.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardCartHelpers.ts` — standard non-apparel proof completion client path.

## 5. Failing Boundary

Route-to-core-workflow boundary: `POST /store/carts/:id/custom-complete` calls `completeCartWorkflow`, which invokes Medusa core `validateShippingStep` before order creation and before Divinipress custom-order linking.

## 6. Root-Cause Hypothesis

The failures are two related gaps, not one generic environment failure. For ORDER tests 14/15, the test creates a purchase cart and a payment session but never selects a shipping method, so Medusa correctly refuses checkout for a shippable line item. For CATALOG Test 16, the non-apparel proof line remains shippable even after `custom-complete` normalizes catalog proofs to quantity 1 and unit price 0; CATALOG proofs are design reviews, not purchases, so the backend should make the proof line non-shippable before invoking `completeCartWorkflow`. The normalization guard must include the shipping state (`item.requires_shipping !== false`), otherwise a line already at qty 1 and price 0 would skip the update and still fail Medusa shipping validation.

## 7. Supporting Evidence

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/store/carts/[id]/custom-complete/route.ts:164` — `custom-complete` calls `completeCartWorkflow`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/core-flows/dist/cart/workflows/complete-cart.js:314` — `completeCartWorkflow` invokes `validateShippingStep`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/core-flows/dist/cart/steps/validate-shipping.js:50` — exact error branch is `cartItemsWithShipping.length > 0 && cartShippingMethods.length === 0`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/core-flows/dist/cart/utils/prepare-line-item-data.js:23` — product shipping profile makes a line item require shipping unless explicitly overridden.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts:41` — non-apparel test product sets `shipping_profile_id`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/scripts/seed-setup.ts:182` — seed creates a shipping option for the returned shipping profile, so the issue is not missing shipping options.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts:453` — tests define payment setup helper only.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts:486` — Test 14 completes ORDER cart without selecting shipping.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts:580` — Test 16 completes CATALOG proof without selecting shipping.
- `/Users/milovan/projects/consilium-docs/doctrine/domain/orders.md:25` — CATALOG proof is design review, not purchase.
- `/Users/milovan/projects/consilium-docs/doctrine/domain/orders.md:26` — CATALOG proof creates qty 1, price 0.
- `/Users/milovan/projects/divinipress-store/docs/domain/product-data-flow-cheatsheet.md:106` — proof flow sends `POST /store/carts/{id}/custom-complete`.
- `/Users/milovan/projects/divinipress-store/docs/domain/product-data-flow-cheatsheet.md:112` — proof flow custom-complete payload contains only `proof_type: "catalog"`; backend reads everything else from cart.
- `/Users/milovan/projects/divinipress-store/docs/domain/product-data-flow-cheatsheet.md:237` — product-flow table separates Proof Flow from Catalog Order and Saved Product Reorder.
- `/Users/milovan/projects/divinipress-store/docs/domain/product-data-flow-cheatsheet.md:245` — proof flow requires backend-created system payment setup, not customer checkout payment setup.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardCartHelpers.ts:54` — standard non-apparel proof helper completes as proof with only `proof_type: "catalog"`.

## 8. Contrary Evidence

`proof-to-catalog` did not reproduce the reported shipping error under forced Node 22 in this checkout. It reached `moveUploadsToCustomOrder` and failed at S3 `NoSuchKey`, which means the broad claim "existing regression gate fails with the same exact shipping error" is not verified here.

## 9. Known Gap Considered

None applicable — checked all `medusa-backend` and `multi-lane` entries in `/Users/milovan/projects/consilium-docs/doctrine/known-gaps.md`; no known gap maps to selected cart shipping methods or proof-line `requires_shipping`.

## 10. Proposed Fix Site

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/store/carts/[id]/custom-complete/route.ts:112-120` — expand the existing CATALOG normalization guard to run when `item.requires_shipping !== false`, and include `requires_shipping: false` alongside `quantity: 1` and `unit_price: 0` in the workflow update.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts:449-461` — add a `selectShippingMethod(cartId)` helper near `setupPaymentSession`, then call it before `custom-complete` in ORDER Tests 14 and 15 only.

## 11. Fix Threshold

`medium` — single-repo backend, two files. The production change is small, but the correct verification also patches the integration spec to model checkout shipping for ORDER purchases.

## 12. Verification Plan

Run:

```bash
env PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" yarn test:integration:http --testPathPattern=non-apparel-cart --testNamePattern='orders list aggregates|orders list falls back|non-apparel CATALOG'
env PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" yarn test:integration:http --testPathPattern=non-apparel-cart
```

Then run the existing apparel regression gate, understanding the current contrary S3 failure:

```bash
env PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" yarn test:integration:http --testPathPattern=proof-to-catalog
```

If `proof-to-catalog` still fails at S3 `NoSuchKey`, record it as a separate environment/file-storage fixture defect, not as a shipping-method regression.

## 13. Open Uncertainty

None blocking for the shipping-gate fix. The Imperator confirmed CATALOG proofs are design reviews/invisible proof orders, and storefront/domain docs confirm the proof path posts only `proof_type: "catalog"` to `custom-complete`. The separate `proof-to-catalog` S3 `NoSuchKey` failure remains outside this packet.

## 14. Contract Compatibility Evidence

Backward-compatible — no API shape change is proposed. Existing storefront consumers continue posting the same `custom-complete` body. The backend aligns with the documented proof contract by making CATALOG proof completion not require customer shipping selection, while ORDER purchase completion still requires a selected shipping method.

## Scout Report

Backend scout Decimus Varro independently confirmed the failing boundary is `custom-complete -> completeCartWorkflow -> validateShippingStep`, shipping options are seeded, and selected cart shipping methods are absent. The scout recommended a shipping-selection helper for all three tests, but the Medicus narrows that recommendation: ORDER tests should select shipping; CATALOG proof should become non-shippable before completion.

Provocator Ferox then caught a GAP in the first fix-site wording: adding `requires_shipping: false` inside the existing update is insufficient unless the guard also includes `item.requires_shipping !== false`. The packet was revised accordingly.
