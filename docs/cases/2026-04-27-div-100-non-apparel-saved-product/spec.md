# DIV-100 — Non-apparel saved product creation on approve-proof

**Status:** ready for plan (iteration 6 — second-Consul second pass surfaced six more blockers: backend enforcement of locked multiplier choices brought into scope, lineage-check timing/path/iteration corrected, source-metadata cross-field consistency expanded, per-variant empty-price throw, status:"published" / link.create syntax / SKU-nullable text fixes, flyer example corrected against live multiplier coverage)
**Linear:** [DIV-100](https://linear.app/divinipress/issue/DIV-100/fix-non-apparel-approve-proof-saved-product-creation-on-import-script)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Stacked above:** PR 29 (`feature/div-82-importer-hierarchy`) → merged PR 33 (`feature/div-99-non-apparel-cart-contract`)
**Backend baseline (per Linear):** `origin/import-script-promo-print`

**Iteration 6 changes against iteration 5.** Second-Consul cold re-read of iter-5 surfaced six more blockers; all sustained against live evidence:

- **C1 — Backend enforcement of locked multiplier choices (§3 promoted to in-scope; new §10b at cart-add; §11 case 11; §14.15).** The iter-5 "lock" was structural for base axes (variant retention) but advisory-only for multipliers (frontend rendering signal in `options_values`). Combined with §10's reorder shortcut, a customer reordering a saved product could submit different multiplier choices and still skip proofing — the lock semantic is broken. Now in scope: cart-add validation in the non-apparel branch of `line-items-custom/route.ts` enforces that submitted multiplier values match the saved product's locked configuration.
- **C2 — Lineage check timing, traversal path, and full-iteration (§10).** Three corrections: (a) `custom_order` has no `company_id` field — verified against live model at `src/modules/custom-order/models/custom-order.ts`. The lineage path is `custom_order → order` (link `order-custom-order.ts`) → `company` (link `company-order.ts`). (b) The current gate reads `items[0]` only — fix to iterate ALL items in each `groupedOrderLineItems` group. (c) The lineage check ran AFTER `completeCartWorkflow` at `route.ts:172` — order is already created when rejection fires. Fix: hoist the lineage validation to a pre-flight section before line 172 so failed validation does not produce a partially-created order.
- **C3 — Source-metadata cross-field consistency (§5 pre-condition 3 expanded; §11 case 8 expanded).** The iter-5 guard checked "field exists, correct primitive type" only. Cross-field invariants the importer establishes structurally — but a non-importer-created product can violate — are now explicit: `options_order` codes ⊆ `options_labels` keys ∩ `options_values` keys; `base_option_keys ⊆ options_order`; `multiplier_keys ⊆ options_order`; `"quantity" ∈ base_option_keys`; `multipliers[k]` exists and is an object for every `k ∈ multiplier_keys`.
- **C4 — Per-variant empty-prices throw (§8, §11 case 9, §14.14).** The iter-5 throw fired only when `flat()` returned `[]` (every retained variant has empty prices). If qty=100 has prices but qty=500 doesn't, flat() is non-empty and the throw doesn't fire — saved product is created, customer reorders at qty=500, pricing throws. Fix: throw when ANY retained variant has empty `prices[]`.
- **C5 — Three text precision fixes (§7c).** (a) Apparel reference at `order-flow.ts:357` sets `status: "published"`; iter-5 spec omitted this from the saved-product create input. Without it, Medusa creates draft products that storefront `custom-products/route.ts` filters out. Now explicit. (b) `link.create` syntax in §8 used `[COMPANY_MODULE.linkable.companyProduct]` — wrong; live apparel/importer code (`order-flow.ts:420`, `importer.ts:439`) uses `[COMPANY_MODULE]` directly. (c) "Medusa auto-generates SKU" is wrong — the schema declares `sku: text().nullable()`, omission leaves NULL. Storefront inventory lookups read `variant.metadata.original_sku` per `custom-products/route.ts:197-204`.
- **C6 — Flyer example correction (§5).** The iter-5 example used `hole_punching: "No"` and `rounded_corners: "No"`. Live flyer multiplier CSV (`products/print/flyers/flyers_multiplier.csv`) defines rows ONLY for "Yes" — the example is unreachable today (cart-add throws on missing multiplier row before reaching approve-proof). Fix: example now uses values that have row coverage. The semantic is unchanged; the documentation is now accurate.

**Iteration 5 changes against iteration 4.** Six blockers from first second-Consul review, all resolved against live evidence:

- **B1 — Multiplier-row narrowing (§7a stage 2, §11 case 10, §14.3).** Retained-variant quantity tiers narrowed to those with multiplier rows for ALL locked multiplier values. Live evidence: `flyers_multiplier.csv` carries only "Yes" rows; `calculate-promo-print-price.ts:88-94` throws hard on missing rows; the existing unit test at `__tests__/.../calculate-promo-print-price.unit.spec.ts:88-97` already exercises this fail mode. The §14.3 implicit assumption ("cart-add validation guarantees row exists") was wrong — cart-add validates only the proof-time tuple, not every retained-variant quantity tier.
- **B2 — Drop SKU/UPC/barcode/EAN copy (§7c).** Medusa schema (`@medusajs/product/dist/models/product-variant.js:65-87`) declares unique indexes on these fields with `WHERE deleted_at IS NULL`. Source variants are not deleted, so copies collide. Apparel reference at `order-flow.ts:368-396` does NOT copy them — saved variants get auto-generated SKUs; originals preserved only via `metadata.original_sku`/`original_upc`. Spec now matches the apparel pattern.
- **B3 — Company-lineage check on reorder gate (§10, §11 case 11).** The gate at `route.ts:248-252` blindly trusts `items[0]?.product?.metadata?.custom_order_id`. After widening, a non-apparel product with a `custom_order_id` pointing to a different company's custom_order would auto-approve and bypass proofing. New approval-time check verifies the resolved custom_order belongs to the buying company; throw on mismatch.
- **B4 — Throw on empty retained-variant prices (§8, §11 case 9, §14).** Replaced the `0` fallback. Pricing path (`calculate-promo-print-price.ts:73-78`) throws on missing `calculated_amount` regardless of CompanyProduct.price; CompanyProduct.price=0 also pollutes catalog display (storefront reads at `lib/catalog/types.ts:105`, `catalog-product-grid.tsx:79`, `catalog-product-card.tsx:89`). Treating empty prices as a critical config gap surfaces the issue at approval time.
- **B5 — Source-metadata sanity guard (§5 pre-condition 3, §11 case 8).** Replaced the narrow `base_option_keys`-only guard with a comprehensive check: `base_option_keys`, `multiplier_keys`, `options_order`, `options_labels`, `options_values`, and (when `multiplier_keys.length > 0`) `multipliers`. Standard adapter at `getProductByHandle.ts:33-37` returns `null` if `options_order` is missing — saved product becomes invisible without diagnostic.
- **B6 — Integration test scope (§12).** The "two files only" scope was wrong. `non-apparel-cart.spec.ts:595-663` (Test 15b) explicitly asserts the apparel-only gate; will fail after widening. Test author anticipated this ("DIV-100 will eventually create non-apparel saved-products deliberately"). Scope now includes: replace 15b's apparel-only assertion with a non-apparel-without-custom_order_id negative test, add a cross-company hijack negative test (B3), add a positive saved-product reorder-shortcut test.

**Iteration 4 changes against iteration 3.** Three text-precision fixes after critical-read pass; no design changes. §5 pre-condition 2 narrowed DIV-99 enforcement to "storefront cart-add entry point only"; §6 corrected cite from `parser.ts:201-203` to `parser.ts:117, 150`; §10 case 1 replaced `.passthrough()` claim with bypass mechanism explanation (`NonApparelMetadataSchema` is `.strict()`; the post-cart `updateOrderLineItems` write path bypasses the cart-time Zod gate).

**Iteration 3 changes against iteration 2.** Four GAP closures: §10 enumerates all three apparel-shaped post-gate reads (selections-loop, FREETSHIRT block, email subscriber); §5/§11 add line-item required-key presence guard (closes silent-corruption on missing multiplier keys, missing locked-base keys, and missing `base_option_keys` on source product); §7c states saved-product immutability post-approval explicitly; §10/§13 acknowledge inherited deleted-source-product silent fallthrough. Eight CONCERN closures: §7c narrows `options_values.quantity` to retained variant subset (Imperator-decided); §7c preserves `options_styles` verbatim with reasoning (Imperator-decided); §7c softened lock-mechanism prose; §7c cites importer-pattern as evidence anchor for createProductsWorkflow shape; §6 documents importer's lowercase-`quantity` invariant; §8 clarifies the empty-prices boundary explicitly; §11 wording tightened on recoverability; §12 corrected line citation (state-machine guard at `transitionOrderStatus`, not the permission check at `:218`); §13 acknowledges corrupted-apparel-stamp residual; §14.3 notes the cart-add-validated assumption.

**Iteration 2 changes against iteration 1.** Corrected variant-retention model after Imperator clarification on multiplier semantics (single-variant lock → filter-by-locked-base-axes-minus-quantity). Three-class option taxonomy introduced. `custom-complete` reorder-gate widening added in scope. §4 cross-check softened. §8 aligned to apparel raw-amount pattern. §11 idempotency wording corrected. Iteration-1's §15 open question removed.

---

## 1. Summary

Branch `[EVENT.approveProof]` in `src/api/custom-order/order-flow.ts` so non-apparel proofs (Print & Promo per DIV-82's importer hierarchy, DIV-99's non-apparel cart contract) create saved products from the approved option configuration on the order line item, instead of the existing apparel-only `Size` / `Color` / `selectedColor` path. The saved non-apparel product locks the customer's approved choices to the configuration on the proof — except for `quantity`, which remains user-selectable on reorder so customers can re-order the same design at any quantity tier the source product supports. The saved product preserves the source product's metadata contract (notably `multipliers`, `multiplier_keys`, `base_option_keys`, `options_*` family, and `product_type`) so it remains readable by the storefront standard adapter and pricable by the promo-print pricing route.

In addition, this change updates the cart→order reorder gate at `src/api/store/carts/[id]/custom-complete/route.ts` so non-apparel saved products take the APPROVED + PROOF_DONE shortcut on reorder (no re-proofing of an already-approved design), matching apparel's existing reorder behavior. The gate change has three coordinated parts: drop the `product_type === "apparel"` clause; add a pre-flight company-lineage validation that runs before `completeCartWorkflow` so rejection happens before order creation; iterate every line-item per group rather than reading `items[0]` only. The post-gate persist/link/upload pipeline is product-type-agnostic; details in §10. Plus a separate validation at the cart-add path enforces the saved-product multiplier-lock semantic (see §10b).

> **Confidence: High** — Imperator-confirmed scope and design after iteration-1 verification cycle.

---

## 2. Motivation

`[EVENT.approveProof]` is unconditionally apparel-shaped today: builds `sizeOptions` from `option.title === "Size"`, resolves `selectedColor` (throws if absent), filters variants by color, drops Color from the saved product's options, writes `selections` to variant metadata. Approving any non-apparel proof either throws on the `selectedColor` resolution or produces a saved product whose option/variant shape contradicts both the storefront standard adapter (`getProductByHandle.ts:112` discriminates on `metadata.production_option_type !== "apparel"`) and the promo-print pricing route (`calculate-promo-print-price.ts:36-95` reads `base_option_keys`, `multiplier_keys`, `multipliers` from product metadata).

DIV-99 closed the cart contract for non-apparel. DIV-100 closes the corresponding approve-proof contract — both the saved-product-creation half (the original Linear scope) and the reorder-gate half (necessary for the saved product to actually be reorderable as a saved product instead of triggering re-proofing).

> **Confidence: High** — symptom and code paths match KG-NON-APPAREL-OPTIONS in `$CONSILIUM_DOCS/doctrine/known-gaps.md` plus the Phase-18 integration handoff in `divinipress-store/docs/phase-18-integration-handoff.md` lines 47-70.

---

## 3. Non-goals

- **Frontend `useSavedProduct` hook** (`divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts:23`) hard-filters `data?.type === "apparel"`. Even after this backend change, `/products/[handle]` will not render non-apparel saved products until that hook learns the standard-product shape. Frontend retrofit is its own ticket.
- **Confirmation email subscriber** (`src/subscribers/custom-order-created.ts:83-108`) builds line-item descriptions by reading `variant.options` for `Color` and `Size`. For non-apparel reorders this degrades to cosmetically empty fields (`"Color: , Quantity ( - 100)"`) — non-throwing but ugly. Cosmetic-only; tracked as a follow-up ticket separate from DIV-100.
- **(Promoted to in-scope per iter-6 C1; see §10b.)** Backend enforcement of locked multiplier choices is now part of DIV-100. The structural lock for base axes (variant retention) is honored — but multipliers aren't variant axes, so without a server-side check, a customer could reorder a saved product with different multiplier choices and still take the auto-approval shortcut. That breaks the saved-product semantic. The new §10b adds the validation at the non-apparel cart-add path.
- **Workflow refactor of `[EVENT.approveProof]`.** The existing apparel side-effect calls `companyModuleService.createCompanyProducts` directly and runs two `link.create` calls outside any workflow boundary. That pre-existing pattern is preserved here for symmetry; lifting saved-product creation into a workflow with compensation steps is a separate ticket.
- **Idempotency hardening of `[EVENT.approveProof]`.** §11 documents the existing state-machine guard and its known race window. Closing the race is its own ticket and applies to both apparel and non-apparel.
- **`production_option_type` enum extension** at `src/_custom/config/product_options.ts`. Keep the enum apparel-only. The discriminator at the cut point is "is the source product apparel?" — non-apparel products do not need a positive enum value at this layer.
- **Apparel saved-product behavior.** Untouched. This change adds a non-apparel branch and widens one downstream gate; it does not modify the apparel arm body.

> **Confidence: High** — Imperator-confirmed scope across two deliberation rounds.

---

## 4. Branch discriminator (boundary contract)

At the top of the `[EVENT.approveProof]` side-effect, after the source product is fetched, branch on:

```
sourceProduct.metadata.production_option_type === "apparel"  → existing apparel arm (unchanged)
otherwise                                                    → new non-apparel arm
```

Apparel imports stamp `production_option_type: "apparel"` (`src/scripts/seed-apparel.ts:1107-1116`); the promo-print importer (`src/_custom/utils/promo-print-product/importer.ts:79-128`) does not stamp this field. Absence is the non-apparel signal — the same predicate the storefront standard adapter uses at `getProductByHandle.ts:112`.

**Cross-check (defense in depth — soft-fail when line-item data predates the bridge).** When the order line item carries `metadata.production_option_type` (bridged at line-item creation by DIV-99 at `src/workflows/pricing/steps/calculate-promo-print-prices.ts:154-158`), it MUST agree with the source-product signal. Specifically:

- If line-item `metadata.production_option_type` is **set** and disagrees with the source-product signal (one says apparel, the other says non-apparel) → throw. This is corrupt state.
- If line-item `metadata.production_option_type` is **absent** → skip the cross-check; the source-product signal is authoritative.

The "absent" case covers (a) any non-apparel proof submitted before DIV-99 deployed and still pending at DIV-100 deploy, (b) admin-created or test-fixture orders that bypass `addPromoPrintPriceToCartWorkflow`, (c) apparel line items, which never carry the bridge stamp. In all three, the source-product signal alone is sufficient and reliable.

> **Confidence: High** — discriminator + soft-cross-check confirmed by recon (apparel importer evidence, storefront predicate parity, DIV-99 bridge inspection).

---

## 5. Approved-configuration source of truth (boundary contract)

For non-apparel approvals, the source of truth for "what was approved" is the **order line item's `metadata.options` map** — `Record<string, string>` keyed by option code. Per the `NonApparelMetadataSchema` at `src/modules/custom-order/non-apparel-type.ts:23` (`z.record(z.string(), z.string())`), this map carries every code the customer chose at proof submission, mixing all three classes: base options, the `quantity` axis, and multiplier choices.

A canonical flyer payload, drawn from `integration-tests/http/non-apparel-cart.spec.ts` shape:

```
{
  paper_type: "matte",        // base option (variant axis)
  quantity:   "250",          // base option AND multiplier-table second-index axis
  stapling:   "Yes",          // multiplier choice (NOT a variant axis) — surcharge applies
  hole_punching: "No",        // multiplier choice — no surcharge (factor 1.0 by default)
  rounded_corners: "No"       // multiplier choice — no surcharge (factor 1.0 by default)
}
```

The multiplier-table semantic: the table declares ONLY surcharge-bearing rows. Any `(code, quantity, value)` tuple not in the table is factor 1.0 by definition. The flyer fixture declares rows for "Yes" only because "No" never adds a surcharge — declaring "No" rows would be redundant. See §10c for the pricing-route alignment this requires.

The non-apparel arm MUST NOT read `selectionsMetadata.selections`, MUST NOT resolve a `selectedColor`, and MUST NOT consult source-product `Size` / `Color` Medusa options. Those are apparel-domain concepts with no non-apparel equivalent.

**Pre-conditions.**

1. The single-line-item invariant at `src/api/custom-order/order-flow.ts:232-236` (custom orders carry exactly one line item — hard-throw if not) is preserved. All references to "the line item" below assume it.

2. **Line-item options-map completeness.** The line-item `metadata.options` map MUST carry a value for every code in `sourceProduct.metadata.base_option_keys` and every code in `sourceProduct.metadata.multiplier_keys`. The DIV-99 cart pricing flow (`calculate-promo-print-price.ts:36-43`) enforces this at the storefront cart-add entry point only (`POST /api/store/carts/[id]/line-items-custom` → `addPromoPrintPriceToCartWorkflow`). Other entry paths — admin order creation, draft conversion, future B2B import, hand-crafted `updateOrderLineItems` writes — bypass this validation. The non-apparel arm enforces it again at approval time as the load-bearing protection — see §11 case 7. Without the approval-time guard, a missing key would silently produce a `[undefined]` entry in the saved product's `options_values` (corrupt saved product, no diagnostic).

3. **Source-product metadata sanity (presence + cross-field consistency).** A non-apparel-shaped product (per §4 discriminator) created outside the promo-print importer (e.g., via Medusa Admin UI, a future importer variant, or partial migration) might lack one or more required metadata fields OR carry a self-inconsistent set. The non-apparel arm enforces both at the top of the side-effect.

   **3a — Presence and primitive types.** The source product carries all of: `base_option_keys` (array), `multiplier_keys` (array, possibly empty), `options_order` (array), `options_labels` (object), `options_values` (object), and — when `multiplier_keys.length > 0` — `multipliers` (object). Each must be present and the correct type. The comprehensive guard is necessary because (a) the standard adapter at `getProductByHandle.ts:33-37` returns `null` when `options_order` is missing — the saved product would be invisible in the storefront PDP with no diagnostic; (b) the pricing route reads `multiplier_keys` and `multipliers` with `?? []` / `?? {}` fallbacks that mask missing-data bugs as silent no-multiplier surcharges; (c) downstream `[lockedKey]: [approvedValue]` writes assume `options_values` is an object — `undefined` spreads to noop and silently strips other codes' value lists.

   **3b — Cross-field consistency.** Beyond presence, the metadata fields must agree with each other. The importer establishes these invariants structurally; a non-importer-created product must satisfy them too.

   - `options_order` codes are a subset of `Object.keys(options_labels)` — every code in the order list has a human label.
   - `options_order` codes are a subset of `Object.keys(options_values)` — every code in the order list has a value list.
   - `base_option_keys` is a subset of `options_order` — every base axis is part of the declared order.
   - `multiplier_keys` is a subset of `options_order` — every multiplier code is part of the declared order.
   - `"quantity"` ∈ `base_option_keys` — quantity must be a base axis (per §6 lowercase-quantity invariant).
   - When `multiplier_keys.length > 0`: for every `k ∈ multiplier_keys`, `multipliers[k]` exists and is an object.

   See §11 case 8 for throw semantics. Each violation throws with a diagnostic naming the source product handle and the specific invariant violated.

> **Confidence: High** — `NonApparelMetadataSchema` + DIV-99 cart contract + `flyers_multiplier.csv` shipped catalog + `calculate-promo-print-price.ts:36-43` cart-time enforcement.

---

## 6. The three-option-class taxonomy (boundary contract)

Non-apparel options live in three classes, distinguished by source-product metadata:

| Class | Identified by | Drives Medusa variants? | Locked at approval? |
|-|-|-|-|
| **Base-locked** | code in `base_option_keys` AND code !== `"quantity"` | yes — variant axis | **yes** |
| **Quantity** | code === `"quantity"` (always in `base_option_keys`) | yes — variant axis | **no — free on reorder** |
| **Multiplier-locked** | code in `multiplier_keys` | no — metadata-only | **yes** |

Two structural facts that drive the rest of this spec:

**(a) `quantity` is a real Medusa variant axis.** Recon confirmed at `src/_custom/utils/promo-print-product/importer.ts:41-43`: variants are built from `orderedOptions = allOrderedOptions.filter(o => !multiplierCodeSet.has(o.option_code))`. Quantity is not a multiplier code (multipliers are non-quantity codes like `stapling`), so it remains in the base set and becomes a variant axis. A flyer source product has a `(paper_type × quantity)` variant grid.

**(b) `quantity` doubles as the multiplier-table second-index axis.** The pricing route at `src/workflows/pricing/utils/calculate-promo-print-price.ts:80-95` reads `quantityValue = options.quantity` and indexes `multipliers[code][quantityValue][choice]` for each multiplier code. The price = matched-variant `calculated_amount` × ∏ over multiplier_keys.

This means the customer's approved quantity choice (250) determines BOTH which variant they bought AND which row of the multiplier table applies. On reorder, the customer is free to pick a different quantity — that means a different variant from the retained subset (see §7) AND a different multiplier-table row (price recalculates accordingly).

**The lowercase `"quantity"` invariant.** The string `"quantity"` is hardcoded across the importer (multiplier-CSV column docstring + literal lowercase read at `parser.ts:117, 150`), the pricing route (`options.quantity` read at `calculate-promo-print-price.ts:80`), the DIV-99 cart contract (`calculate-promo-print-prices.ts:50` `Number(item.metadata.options.quantity)`), and this spec's §7a filter. The importer's input-shape contract is "quantity is the literal lowercase string `quantity`" — uppercase or aliased option codes would silently break the system end-to-end (the saved product would lock the quantity axis, pricing would fail to find the multiplier-table row, etc.). This spec inherits the invariant and does not enforce it directly; any future importer change that admits other casings or aliases is an importer-side bug, not something the saved-product code accommodates.

> **Confidence: High** — code-grounded; verified against shipped `flyers_multiplier.csv` (3 multiplier codes: `stapling`, `hole_punching`, `rounded_corners`) and the test fixture at `integration-tests/http/non-apparel-cart.spec.ts:73-88`. The lowercase-`quantity` invariant is upheld by importer input shape (CSV format), not by code enforcement.

---

## 7. Variant retention and saved-product Medusa shape (boundary contract)

The saved non-apparel product locks the **base-locked** axes and the **multiplier-locked** choices to the approved configuration; quantity remains free. Concretely:

### 7a. Variant retention rule

Define `lockedBaseKeys = sourceProduct.metadata.base_option_keys.filter(k => k !== "quantity")`.

Retain the source-product variants whose `options` match the approved values for **every** `lockedBaseKey`. Quantity and multiplier choices are NOT consulted in the retention filter — multipliers aren't variant axes; quantity is allowed to vary. Call the result `retainedVariants`.

For the canonical flyer example: `lockedBaseKeys = ["paper_type"]`, approved `paper_type = "matte"`. The source product has, say, 24 variants (2 papers × 12 quantity tiers); the saved product retains 12 (every quantity tier of paper=matte).

If `lockedBaseKeys` is empty (a source product with zero non-quantity base axes — a hypothetical "everything is multiplier" shape), `retainedVariants` is the source product's full variant list (vacuous-truth match). If the source product has a single variant in this case, retain it. If multiple, throw with diagnostic — this shape is not yet supported and indicates either a corrupted import or a product class outside the catalog as it stands today.

If `retainedVariants` is empty (zero variants match the lockedBaseKeys filter), throw with a diagnostic message identifying the product handle, the approved configuration, and the locked-base-key/value pairs that failed to resolve.

**Why no multiplier-row coverage filter is needed.** The multiplier table semantic is "missing row = factor 1.0" — not "missing row = config gap to throw on." A flyer's `multipliers.stapling = { "100": { "Yes": 1.51 } }` means stapling=Yes at qty 100 multiplies the base price by 1.51; stapling=No at qty 100 (no row) multiplies by 1.0 (no surcharge). The whole point of multipliers is to compress the SKU grid: instead of `paper_type × quantity × stapling × hole_punching × rounded_corners` (thousands of variants), the flyer has `paper_type × quantity` (24 variants) and applies multipliers only for the surcharge-bearing values. Declaring "No" rows would be redundant — they all map to factor 1.0 by definition. See §10c for the pricing-route correction this implies.

### 7b. Variant-identity matching (option title resolution)

For each `lockedBaseKey`, the source-variant's `options[].option.title` must equal `sourceProduct.metadata.options_labels[lockedBaseKey]`. The importer at `src/_custom/utils/promo-print-product/importer.ts:46-49` builds Medusa option titles from `opt.label`, and the importer's contract requires `options_labels[code]` to be present for every code in `options_order`. If `options_labels[lockedBaseKey]` is missing on a source product, throw with a clear diagnostic ("missing options_labels for code X on product Y") rather than falling back to the bare code (variants are keyed by labels, not codes — a code-only fallback would silently produce zero matches).

### 7c. Saved-product Medusa shape

Created via `createProductsWorkflow` (the same workflow apparel uses). Fields:

**Product-level fields copied from source:** `title` (overridden by `customOrder.product_name` if set, mirroring apparel), handle (must be unique across Medusa products — match apparel's existing uniqueness strategy), `description`, `subtitle`, `thumbnail`, `images`, `external_id`, `type_id`, `tag_ids`, `category_ids`. Plus `status: "published"` — apparel sets this explicitly at `order-flow.ts:357`; without it, Medusa creates a draft product and `custom-products/route.ts` (the storefront list endpoint) filters it out, so the customer cannot see their own saved product. The importer at `importer.ts:149` follows the same convention.

**Product `options`** (the Medusa entity, not the metadata bag): one entry per code in `sourceProduct.metadata.base_option_keys`, in `metadata.options_order` order, each entry's `title` from `metadata.options_labels[code]`. `values` arrays:

- For each lockedBaseKey: single-element array `[approvedValue]`.
- For `quantity`: the value list derived from the **retainedVariants set's** quantity values (deduplicated, preserving source order). NOT the source product's full `options_values.quantity` list. Rationale: the retainedVariants set is the output of §7a's filter on lockedBaseKeys — every quantity tier in this set has a variant matching the locked base axes. Advertising any quantity outside this set would let the customer pick a tier for which no variant matches (pricing throws on variant-match). Narrowing to retained-variant tiers ensures every tier the customer can pick is reorderable. (Multiplier-row coverage is handled by the §10c default-1.0 semantic — every (code, qty, value) tuple prices, with absence treated as factor 1.0.)

The acceptance of mixed-arity `values` arrays (single-element for locked codes, multi-element for quantity) by `createProductsWorkflow` is established by the importer at `src/_custom/utils/promo-print-product/importer.ts:46-49` and `:52-77`, which calls the same workflow (or its underlying step) with multi-element-per-option arrays at initial import. The shape is not novel for this code path.

**Product `metadata`:** spread of `sourceProduct.metadata` plus `custom_order_id: customOrder.id`. Two intentional NARROWINGS within `options_values` to encode the lock, plus a quantity narrowing that mirrors the Medusa `options` array:

```
saved.metadata = {
  ...sourceProduct.metadata,
  custom_order_id: customOrder.id,
  options_values: {
    ...sourceProduct.metadata.options_values,
    // For each lockedBaseKey, narrow to single-element [approvedValue]
    [lockedBaseKey]: [approvedValue],
    // For quantity, narrow to retained-variant tiers (deduplicated, source-ordered)
    quantity: <quantity values from retained variant set>,
    // For each multiplier code, narrow to single-element [approvedValue]
    [multiplierKey]: [approvedValue],
  },
}
```

All other source-metadata keys (`product_type`, `options_order`, `options_labels`, `options_styles`, `base_option_keys`, `multiplier_keys`, `multipliers`, `tabs`, `production_time`, `short_description`, `shipping_profiles`, `notes`, plus any future keys) round-trip via the spread. Note that `options_styles` is preserved verbatim — the saved product carries the source product's intent for how each option renders (including locked codes which become single-value styled pickers, e.g., a single-item dropdown for a locked base code). The frontend retrofit (out of scope per §3) decides whether to render single-value codes as plain labels regardless of style; preserving the source's `options_styles` keeps that information available for the retrofit's UX choices. Success criterion §14.7 enforces no source-metadata key is dropped (with the `options_values` narrowings as the documented exception).

**The lock semantics.** Two layers protect the lock:

- **Structural (base axes):** the variant retention in §7a means the retained-variant set's `options` only spans the locked base configuration. The customer literally cannot pick a different paper_type at reorder because the variant for `paper_type=glossy` is not on the saved product. This is enforced by Medusa — cart-add requires `variant_id`, the variant's options are fixed.
- **Server-side validated (multiplier choices):** §10b adds the cart-add-time enforcement. When a customer's cart-add hits a saved product (line-item's `product.metadata.custom_order_id` is set), the non-apparel cart-add path validates that submitted `metadata.options[k]` matches the saved product's `options_values[k][0]` for every `k ∈ multiplier_keys`. Mismatch returns 400. This makes the multiplier portion of the lock load-bearing rather than advisory.

The narrowed `options_values` on the saved product remains the structural source of truth. The standard adapter at `getProductByHandle.ts:39-66` reads it for picker rendering (single-element arrays render as locked); the cart-add enforcement reads it for validation. The two enforcement points share one source of truth.

**Saved-product immutability post-approval.** Once the saved product is created, its retained variants and the spread of source metadata (including `multipliers`, `multiplier_keys`, `base_option_keys`, `options_*`) are frozen on the saved product. Subsequent source-product mutations (re-import via `importer.ts:333-369` `--force`, manual variant deletion via Medusa Admin, multiplier-table edits) do NOT propagate to the saved product. Repricing always reads the saved product's frozen metadata and its retained variants' `prices[].amount`. This decoupling is a strength of the design — it guarantees the customer's reorder pricing matches what they approved — and is enforced structurally by the create-time copy, with no runtime read of the source product.

**Variants:** the `retainedVariants` set from §7a. For each retained variant:

- `title` — same as source variant.
- **No `sku` / `upc` / `barcode` / `ean` field on the create input.** Medusa's `product_variant` schema (`@medusajs/product/dist/models/product-variant.js:65-87`) declares unique indexes on each of these with `WHERE deleted_at IS NULL`; the source variants are not deleted, so copying the values would collide and the create would fail. The schema also declares each field as `text().nullable()` — omission leaves the column NULL on the saved variant; Medusa does NOT auto-generate a value. Match the apparel reference at `order-flow.ts:368-396`, which OMITS these fields entirely. Storefront inventory lookups read `variant.metadata.original_sku` per `custom-products/route.ts:197-204` (with `variant.sku` as fallback and `"unknown"` as last-resort), so the NULL `sku` column is fine — the metadata copy below carries the meaningful identifier.
- `options` — same `{title: value}` map as source variant (variants in the retained set differ only in their quantity axis, all sharing the locked base values).
- `prices` — same as source variant (preserves the variant's `calculated_price` shape so the pricing route can read `calculated_amount`).
- `metadata` — spread of source variant `metadata` plus:
    - `original_variant_id`: source variant id
    - `original_sku`: source variant `sku`
    - `original_upc`: source variant `upc`
    - `original_title`: source product title
    - `design_notes`: line-item `metadata.design_notes` (if present)

The non-apparel variant metadata MUST NOT include `selections` (apparel-only). The approved configuration is encoded structurally via the variant set + the `options_values` narrowing — no additional `approved_options` or `approved_multipliers` field is needed.

> **Confidence: High** — code-grounded against importer + pricing route + standard adapter contracts; design verified against the flyer canonical example end to end.

---

## 8. CompanyProduct + sales-channel linking (boundary contract)

Same shape as apparel. After `createProductsWorkflow` returns the saved Medusa product:

1. **CompanyProduct row.** Call `companyModuleService.createCompanyProducts({ id: savedProduct.id, company_id: companyId, price: <number> })`. The `id` argument is set to the Medusa product id; this forces the CompanyProduct primary key to match the saved-product id (apparel and importer convention). Subsequent `link.create` calls (steps 2–3) use the same id as both `product_id` and `company_product_id`. Implementers must NOT allocate a separate CompanyProduct id.

2. **Product ↔ CompanyProduct link.** `link.create({ [Modules.PRODUCT]: { product_id }, [COMPANY_MODULE]: { company_product_id } })` — both ids equal to `savedProduct.id`. Note `[COMPANY_MODULE]` (the module name string) NOT `[COMPANY_MODULE.linkable.companyProduct]`. Live evidence: `order-flow.ts:420` (apparel) and `importer.ts:439` (importer) both use `[COMPANY_MODULE]` directly.

3. **Product ↔ Webshop sales channel link.** Resolve the sales channel by name (`salesChannelService.listSalesChannels({ name: "Webshop" })`), then `link.create({ [Modules.PRODUCT]: { product_id }, [Modules.SALES_CHANNEL]: { sales_channel_id } })`.

**`price` value.** The `price` column is NOT NULL float (`src/modules/company/migrations/Migration20260104075004.ts:25`) and is currently a write-only display/sort cache. Recon confirmed: zero money-path consumers across both repos. The three storefront readers (`lib/catalog/types.ts:105`, `components/catalog/catalog-product-grid.tsx:79`, `components/catalog/catalog-product-card.tsx:89`) are all DISPLAY paths — `formatPrice(...)` for catalog cards. The write contract:

- **First, per-variant validation.** For every retained variant `v`, `v.prices` MUST be a non-empty array. If ANY retained variant has empty `prices`, **throw at approval time** with a diagnostic naming the product handle and the offending variant. See §11 case 9. The check is per-variant, not aggregate (`flat()` non-empty), because each retained variant corresponds to a specific quantity tier the customer can pick at reorder. If qty=100 has prices but qty=500 doesn't, an aggregate `flat()` is non-empty — the saved product gets created — and then the customer who reorders at qty=500 hits a 400 with no recourse. The pricing route at `calculate-promo-print-price.ts:73-78` throws `INVALID_DATA` whenever a variant's `calculated_amount` is null/missing, so any retained variant with empty `prices` produces a non-functional reorder tier. Reject at approval, surface the gap to the admin.
- After per-variant validation passes, compute `lowestPrice = min(amount across retainedVariants.flatMap(v => v.prices))`. This mirrors apparel's reduce at `order-flow.ts:334-345` and the importer's `Math.min(...sku.cost)` at `importer.ts:419-422`. Per-variant validation guarantees `flat()` is non-empty, so `lowestPrice` is a finite number. Write it directly to CompanyProduct.price.

Apparel's existing `lowestPrice ?? undefined` writer pattern is a latent bug masked in production by apparel always carrying region prices. The non-apparel arm does NOT inherit it; per-variant validation upstream removes the pathological case.

**`Webshop` sales-channel resolution failure** preserves apparel's existing fail-mode: if the lookup returns an empty array, destructuring yields `undefined` and the subsequent property access throws `TypeError`. This is an inherited weakness, not introduced here. Documented but not addressed.

> **Confidence: High** — id-equality convention verified against apparel arm + importer; price-value pattern confirmed by full reader audit.

---

## 9. Image handling (boundary contract — no work required)

`hydrateImages()` at `src/modules/custom-order/service.ts:39-72` filters uploads by `type === PRODUCT_IMAGE || PRODUCT_THUMBNAIL`. `NonApparelMetadataSchema` carries only `upload_ids` (design files); no field for `product_thumbnail` or `product_image`. With no overrides at runtime, the existing fallback chain returns the source product's `thumbnail` and `images` — which the saved product copied at creation. No additional work is required.

> **Confidence: High** — confirmed by 4-lane recon convergence.

---

## 10. Reorder gate widening at `custom-complete` (boundary contract)

The cart `custom-complete` route decides "is this a saved-product reorder?" via the gate at `src/api/store/carts/[id]/custom-complete/route.ts:248-252`. The gate currently requires `items[0]?.metadata?.product_type === "apparel"` — DIV-99 hardening that explicitly bookmarked DIV-100 ("*Re-evaluate when DIV-100 introduces non-apparel saved-product creation.*"). After DIV-100 ships, non-apparel saved products will exist with `product.metadata.custom_order_id` set, but their cart line items carry `product_type: "promo"` or `"print"` — the gate fails, the reorder triggers a fresh proofing flow instead of the APPROVED + PROOF_DONE shortcut.

**The widening — three coordinated changes.** The current gate at `route.ts:248-252` runs after `completeCartWorkflow` (line 172) — an order is created before the gate evaluates. Three coordinated changes:

1. **Drop the apparel-only clause.** Identity gate becomes:
   ```
   isSavedProduct =
     proofType === ProofType.ORDER &&
     item?.product?.metadata?.custom_order_id != null
   ```
   Evaluated per-item, not just `items[0]`.

2. **Pre-flight lineage validation, before `completeCartWorkflow`.** Before line 172 in the route, iterate every line-item across every group. For each line-item with `product.metadata.custom_order_id` set, resolve the referenced `custom_order` and validate its owning company matches the buying company.

   The traversal path: `custom_order` does not carry a `company_id` field directly (verified against `src/modules/custom-order/models/custom-order.ts` — only `proof_type`, `job_status`, `order_status`, `metadata`, `selections`, `product_name`, `timeline`, `version`). The lineage path is `custom_order → order` (link defined in `src/links/order-custom-order.ts`) → `company` (link defined in `src/links/company-order.ts`). The plan picks the cleanest implementation — `query.graph` traversal of `custom_order.order.company.id` is the natural shape, but the plan may resolve via the link service if that's simpler.

   Behaviors:
   - If any `custom_order_id` does not resolve to an existing `custom_order`, throw 400 with diagnostic.
   - If any resolved `custom_order` has an owning company different from the buying company (`companyId` resolved at `route.ts:91`), throw 403 with diagnostic.
   - Both run BEFORE `completeCartWorkflow`, so failed validation does NOT produce a partially-created order.

3. **Iterate all items per group at the gate.** The existing per-group loop at `route.ts:247-282` reads `items[0]` for both `isSavedProduct` evaluation and `productName` resolution. After widening: a group with mixed line-items (some saved-product, some not) is rejected at pre-flight (group homogeneity), OR the saved-product gate evaluates per-item. Plan picks the cleaner path; the spec mandates that group homogeneity is enforced — partial saved-product groups are rejected. (This rejection-on-mixed-groups is consistent with the DIV-99 "mixed apparel/non-apparel cart" rejection at `line-items-custom/route.ts:42-47`.)

**Why the changes are necessary.** With the apparel-only clause removed, a non-apparel product carrying `metadata.custom_order_id` that points to a different company's custom_order would auto-approve (jobStatus=APPROVED, orderStatus=PROOF_DONE) and bypass proofing. The current code at `route.ts:248-264` reads `custom_order_id` blindly and fetches `customOrder.product_name` without a company-ownership check. The same seam exists for apparel today (it's an inherited weakness, not introduced by DIV-100); the lineage check closes the cross-company hijack vector for both arms going forward. Pre-flight timing ensures rejection happens before order creation; iterating all items closes the items[0]-only hole; group homogeneity prevents mixed groups from sneaking past via items[0]-passes-but-items[1]-fails.

The bookmark comment at `route.ts:248` MUST be updated to reflect post-DIV-100 status (no longer "apparel-only saved-product gate" — now the gate plus pre-flight lineage validation).

**Post-gate apparel-shaped surfaces — enumerated.** Recon confirmed the post-gate persist/link pipeline (the saved-product branch at `route.ts:268-281` writing `proof_type`, `product_name`, `job_status: APPROVED`, `order_status: PROOF_DONE`, and `metadata.original_custom_order_id`; the downstream `createCustomOrders` insert; the link.create calls at 295-316) is structurally product-type-agnostic. There are three apparel-shaped READS in the same route file post-gate, each enumerated explicitly so an implementer or future verifier can audit them:

1. **`metadata.selections` iteration at `route.ts:386-405`** (inside the upload-move loop, runs when `movedFiles.length > 0`). Reads `(metadata.selections as any[]) || []` — for non-apparel line items, `selections` is undefined, the `|| []` defaults to empty, and the loop runs zero iterations. The block then writes `selections: []` back onto the line-item metadata via `updateOrderLineItems` at lines 406-412 — apparel residue, non-throwing, no behavioral effect on non-apparel reorders. The post-cart `updateOrderLineItems` write path bypasses the cart-time Zod gate (`NonApparelMetadataSchema` is `.strict()` and only runs on inbound cart-add bodies); the order_line_item.metadata jsonb column accepts the empty-array shape directly.

2. **FREETSHIRT promo-removal block at `route.ts:417-434`** (apparel-specific: the FREETSHIRT promotion is an apparel onboarding feature). Dormant for non-apparel reorders unless a customer somehow has the FREETSHIRT promo applied to a non-apparel cart. Per `cart.promotions` membership check, won't trigger for typical non-apparel reorders.

3. **Confirmation-email subscriber at `src/subscribers/custom-order-created.ts:83-108`** (fires on the `custom-order.created` event emitted at `route.ts:437-438`). Reads `variant.options` for `Color` and `Size` with optional-chaining + `?? ""` fallbacks. For non-apparel reorders, output is `"<productName>, Color: , Quantity ( - <qty>)"` — non-throwing cosmetic degradation. Tracked as a follow-up ticket per §3 non-goals.

None of these three surfaces blocks the widening or causes correctness breaks for non-apparel reorders. They are documented so future post-gate edits inside any of these blocks (e.g., adding logic that depends on a non-empty `selections` array, or adding a new subscriber on `custom-order.created` that reads variant.options unsafely) consider non-apparel input. The bookmark comment at `route.ts:248` MUST be updated to reflect post-DIV-100 status.

**Inherited deleted-source-product silent fallthrough.** If an admin deletes a saved product between cart-add and `custom-complete`, the gate's `items[0]?.product?.metadata?.custom_order_id` resolves to undefined; `undefined != null` is false; the gate evaluates false; the cart silently downgrades to fresh-proof flow. The customer paid for a fast-turn reorder but receives a job in PROOFING state. This is **inherited apparel behavior** — apparel reorders exhibit the same fallthrough on saved-product deletion. DIV-100 does not introduce or fix this; it is documented here so a future ticket can address it across both arms.

> **Confidence: High** — recon confirmed end-to-end product-type-agnosticity of the post-gate path; gate change (drop apparel clause + pre-flight lineage + iterate all items) verified against route flow at `route.ts:172-282`; lineage traversal path verified against custom_order model and link definitions.

---

## 10b. Cart-add enforcement of locked multiplier choices (boundary contract)

The saved-product lock is structural for base axes (variant retention — customer can't pick `paper_type=glossy` because the variant doesn't exist on the saved product). Multipliers aren't variant axes; they're metadata read from `line-item.metadata.options[k]`. Without a server-side check, a customer reordering a saved product can submit a different multiplier value than the locked one and have the cart accept it. Combined with §10's reorder shortcut, that means the order auto-approves (jobStatus=APPROVED, orderStatus=PROOF_DONE) under a multiplier configuration the customer never approved. The lock semantic is broken.

**The validation.** The non-apparel branch of `src/api/store/carts/[id]/line-items-custom/route.ts:50-65` (the `nonApparelCount > 0` block that dispatches `addPromoPrintPriceToCartWorkflow`) gains a saved-product check. For each non-apparel cart-add line-item:

1. Resolve the variant's product (`product_id` lookup, then product fetch with metadata).
2. If `product.metadata.custom_order_id` is set (i.e., this is a saved-product reorder cart-add):
   - For each `k ∈ product.metadata.multiplier_keys`:
     - Compare `lineItem.metadata.options[k]` to `product.metadata.options_values[k][0]`.
     - If mismatch, throw 400 with diagnostic naming the locked code, expected value, submitted value, and saved-product handle.
3. If `product.metadata.custom_order_id` is NOT set, no enforcement — the source-product (catalog) cart-add path is unaffected.

The check is non-apparel-arm-only. Apparel saved products do not have a multiplier-table semantic; their lock is structural-only (variant retention covers the full configuration). No equivalent enforcement is needed on the apparel branch.

**Why this lives at cart-add and not at custom-complete.** The custom-complete gate already auto-approves saved-product reorders. Catching the mismatch at custom-complete would happen AFTER the customer paid (Stripe session created in §0 setup). Catching at cart-add prevents adding the line-item in the first place, before any payment. The customer sees the error at the same step where they tried to override the locked value.

> **Confidence: High** — design grounded against existing line-items-custom branching pattern + saved-product `options_values` narrowing structure from §7c; no architectural novelty (single new validation in an existing branch).

---

## 10c. Pricing-route correction — multiplier missing rows default to factor 1.0 (boundary contract)

The DIV-99 design at `calculate-promo-print-price.ts:88-94` ("Q-B FIX-LOUD") throws `INVALID_DATA` whenever `multipliers[code]?.[quantity]?.[value]` is undefined for a submitted multiplier. This contradicts the multiplier table's design intent: rows declare surcharges; absence means no surcharge (factor 1.0). The Q-B FIX-LOUD over-corrected against silent misprice when the design was "no row = factor 1.0 by definition."

**The change.** Lines 88-94 invert from throw to default:

```
// Before (DIV-99 Q-B FIX-LOUD):
if (factor == null) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `No multiplier row for ${code} at quantity tier ${quantityValue}; product configuration is incomplete`,
  );
}
finalPrice *= factor;

// After (DIV-100 alignment to design intent):
finalPrice *= factor ?? 1.0;
```

Plus the comment at line 88 (`Q-B FIX-LOUD: missing row is a 400, never a silent 1.0`) is replaced with one that reflects the actual design: `Missing row = factor 1.0 (no surcharge). The multiplier table declares only surcharge-bearing rows; absence is by design, not config gap.`

**Why this is in DIV-100 scope.** Without this fix, the saved-product reorder path is broken in two distinct ways:

- The Imperator-confirmed design intent (multipliers compress the SKU grid by encoding surcharges only) is unenforceable end-to-end. Customers approving saved products with `stapling: "No"` cannot price their saved product on reorder, defeating the entire saved-product reorder flow.
- The current DIV-99 behavior also breaks catalog-flow non-apparel cart-add for any customer who picks "No" for any multiplier on the shipped flyer. The flyer option CSV declares `No;Yes` (No first), so storefront pickers defaulting to first-value send `stapling: "No"` to cart-add, which throws under Q-B FIX-LOUD. This is a live production bug that DIV-100 fixes incidentally — the fix is pivotal to DIV-100's saved-product semantic and corrects the catalog regression at the same time.

**Test impact.** The existing unit test at `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97` ("throws INVALID_DATA when the multiplier row for a code/quantity is missing (Q-B fix-loud)") asserts the wrong behavior. It must be replaced with a test that asserts default-1.0 — the same fixture (`var_999_matte` with no row at qty=999) reverses its expected outcome from throw to factor 1.0 (price = 100 × 1.0 = 100).

> **Confidence: High** — Imperator-confirmed design intent ("the whole point of the multiplier was to reduce SKU count by deleting yes/no to a factor"); change scope is one ternary inversion at lines 88-94 plus comment update; existing unit test maps cleanly to the new behavior.

---

## 11. Error semantics (boundary contract)

The non-apparel arm throws — does NOT silently fall back to the apparel arm — when:

1. **Discriminator disagreement** (set vs set, mismatched). See §4. Source product says non-apparel but line-item has the bridge stamp set to `"apparel"`, or vice versa. Hard-throw — corrupt state.
2. **Missing options map.** Line-item `metadata.options` is absent or not a `Record<string, string>`. Schema-level rejection from DIV-99 prevents most cases, but Zod `z.record(z.string(), z.string())` allows `{}` (empty record), so an empty map is plausible via hand-edited line items or future schema drift. Hard-throw — corrupt state.
3. **Missing `options_labels[lockedBaseKey]`** on the source product. See §7b. Hard-throw with diagnostic.
4. **Variant retention failure.** Zero source-product variants match the locked base axes (§7a). Hard-throw with diagnostic.
5. **Multi-variant retention with empty `lockedBaseKeys` and multiple source variants.** See §7a — unsupported shape. Hard-throw.
6. **Missing Webshop sales channel.** Same fail-mode as apparel (TypeError on undefined access). Inherited; not introduced here.
7. **Line-item options-map missing a required code** (per the §5 pre-condition 2). For each code in `sourceProduct.metadata.base_option_keys` AND each code in `sourceProduct.metadata.multiplier_keys`: the line-item `metadata.options[code]` MUST be a non-empty string. If absent or empty, hard-throw with a diagnostic naming the missing code, the source product handle, and the line-item id. This catches admin/fixture/hand-edited orders where the cart-time enforcement at `calculate-promo-print-price.ts:36-43` was bypassed. Without this guard, a missing key would silently produce `[undefined]` in the saved product's `options_values` (corrupt saved product, no diagnostic).
8. **Source-product metadata sanity — presence + cross-field consistency (§5 pre-condition 3).** Two-part guard at the top of the non-apparel arm. **Presence (3a):** every required field present and correctly typed — `base_option_keys` (array), `multiplier_keys` (array, possibly empty), `options_order` (array), `options_labels` (object), `options_values` (object), and (when `multiplier_keys.length > 0`) `multipliers` (object). **Cross-field consistency (3b):** `options_order ⊆ Object.keys(options_labels)`; `options_order ⊆ Object.keys(options_values)`; `base_option_keys ⊆ options_order`; `multiplier_keys ⊆ options_order`; `"quantity" ∈ base_option_keys`; for every `k ∈ multiplier_keys`, `multipliers[k]` is an object. Each violation throws with a diagnostic naming the product handle and the specific invariant. Without this guard, downstream code would silently produce broken saved products: `undefined.filter(...)` on `base_option_keys` TypeErrors; missing `options_order` makes the standard adapter return null (invisible PDP); `?? []` / `?? {}` fallbacks on `multiplier_keys` / `multipliers` / `options_labels` mask shape bugs; `options_order` codes that lack labels render as bare codes; `multiplier_keys` codes outside `options_order` are unreachable from the picker.

9. **Empty retained-variant prices (per-variant check).** For every variant in `retainedVariants`, `v.prices` MUST be a non-empty array. If ANY retained variant has empty `prices`, hard-throw with a diagnostic naming the product handle, the offending variant id, and the approved configuration. Per-variant rather than aggregate: pricing throws when an individual variant's `calculated_amount` is null/missing (`calculate-promo-print-price.ts:73-78`), so any single retained variant with empty prices produces a non-functional reorder tier. Surface the gap at approval time rather than at first-reorder failure.

10. **Saved-product reorder gate — company-lineage mismatch (`custom-complete`).** Per §10 widening, the gate's lineage check throws 403 when the `custom_order_id` on any line-item's product metadata resolves to a custom_order owned by a company other than the buying company. The same path throws 400 when the `custom_order_id` does not resolve at all (replacing the current implicit `undefined.product_name` crash with a clear diagnostic). Lineage validation runs in pre-flight before `completeCartWorkflow` so failed validation does not produce a partially-created order.

11. **Saved-product reorder cart-add — locked multiplier mismatch (`line-items-custom`).** Per §10b, when a non-apparel cart-add line-item resolves to a saved-product source (the variant's product carries `metadata.custom_order_id`), the cart-add path validates `metadata.options[k] === product.metadata.options_values[k][0]` for every `k ∈ multiplier_keys`. Mismatch throws 400 with a diagnostic naming the locked code, the expected value, and the submitted value. This makes the multiplier portion of the saved-product lock load-bearing, not advisory.

**Recovery posture.** Per the route handler at `src/api/custom-order/[id]/route.ts:297-353`, the order-status DB commit at lines 349-353 runs AFTER `sideEffects` at lines 322-329. A throw inside `sideEffects` skips the commit; the order remains in its prior state (PENDING/PROOF_READY) and the catch at lines 354-360 returns a 400 with the diagnostic message. The proof can be retried after the underlying issue is corrected. The committed-APPROVED-but-no-saved-product state cannot occur via this code path. (See the partial-failure orphan caveat below for a different failure mode that does NOT involve status commit.)

**Partial-failure orphan caveat.** Within `sideEffects`, the sequence `createProductsWorkflow → createCompanyProducts → link.create (CompanyProduct) → link.create (Webshop)` is non-atomic. A throw at step 2 or later leaves the saved Medusa product committed with no CompanyProduct row or no sales-channel link — orphaned. The order itself remains PENDING (status commit didn't run), so the customer can retry — but the prior attempt's saved Medusa product persists in the database as a dangling row. This matches apparel's existing behavior; compensation is out of scope per §3.

> **Confidence: High** — route ordering verified by recon; throw points trace to specific code lines.

---

## 12. Order-flow scope, integration tests, and event idempotency (boundary contract)

**Source-file scope.** Three files:
- `src/api/custom-order/order-flow.ts` — new non-apparel arm in the `[EVENT.approveProof]` side-effect.
- `src/api/store/carts/[id]/custom-complete/route.ts` — gate widening, pre-flight lineage validation, all-items iteration (§10).
- `src/api/store/carts/[id]/line-items-custom/route.ts` — saved-product cart-add lock enforcement on the non-apparel branch (§10b).
- `src/workflows/pricing/utils/calculate-promo-print-price.ts` — invert Q-B FIX-LOUD lines 88-94 to factor-default-1.0 (§10c).

**Unit test scope.** One change:

- `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97` — the existing "throws INVALID_DATA when the multiplier row for a code/quantity is missing" test flips. Same fixture (`var_999_matte`, no multiplier row at qty=999), reversed expected outcome: result is `unit_price === 100` (base × factor 1.0), not a throw. The test description and message change accordingly. This locks in the §10c design.

**Integration test scope.** Four changes to `integration-tests/http/non-apparel-cart.spec.ts`:

1. **Replace Test 15b's apparel-only assertion** (current lines 595-663). The existing test injects `custom_order_id` on a non-apparel product's metadata and asserts the resulting custom_order is NOT auto-approved (relying on the apparel-only gate). After widening, that assertion will FAIL — the gate widens precisely so non-apparel saved products auto-approve. The test's safety property must shift: the new negative test asserts a non-apparel ORDER **without** `custom_order_id` (or without a real backing custom_order) does NOT auto-approve. The test author anticipated this rewrite — see current lines 599-602.

2. **Add a cross-company hijack negative test.** Inject `custom_order_id` on a non-apparel product's metadata pointing to a custom_order owned by **a different company**. Drive the cart-completion flow as the buying company. Assert the request is rejected with 403 BEFORE order creation (no order should exist after the failed call). This locks in §10's lineage check + pre-flight timing.

3. **Add a positive saved-product reorder-shortcut test.** Drive the full DIV-100 path: approve a non-apparel proof, verify the saved product was created with `status: "published"` and a CompanyProduct row exists, then add the saved variant to a fresh cart and complete the cart. Assert the resulting custom_order has `jobStatus = APPROVED` and `orderStatus = PROOF_DONE` AND `metadata.original_custom_order_id` is set. This is the load-bearing positive coverage for both the saved-product creation half and the reorder-gate widening half. Today no UI path drives non-apparel reorder (per §3 non-goals); the test must construct the saved-product cart line item directly.

4. **Add a saved-product locked-multiplier-mismatch test.** Approve a non-apparel proof with `stapling: "Yes"` (locked). Attempt cart-add of the saved variant with `stapling: "No"` in `metadata.options`. Assert 400 from `line-items-custom` per §10b / §11 case 11. This locks in the cart-add lock enforcement.

Test additions are in scope for DIV-100. Plus a fifth implicit change: any existing test that depends on Q-B FIX-LOUD throwing on missing rows (whether unit or integration) must be audited and updated to the default-1.0 behavior.

**Idempotency posture.** The state-machine guard is `validateEventTransition` in `order-flow.ts` (called by `transitionOrderStatus` at `src/api/custom-order/[id]/route.ts:298`), which enforces `from: PENDING → to: APPROVED` for `approveProof`. NOTE: `order-flow.ts:218` is the per-event permission check (`canAcceptRejectProof`), NOT the state guard — earlier iterations of this spec conflated the two. The actual state guard runs against `currentCustomOrder` (an in-memory snapshot fetched at the top of the route handler), so the practical idempotency picture is:

- After the first call's status commit lands (`updateCustomOrders` at route lines 349-353), a subsequent `approveProof` reads APPROVED state, fails the state guard, and never reaches `sideEffects`. Simple double-fire prevented.
- Between `sideEffects` succeeding (route lines 322-329) and the status commit at lines 349-353, a concurrent second `approveProof` whose route handler started reading `currentCustomOrder` BEFORE the first call's commit landed will see PENDING, pass the state guard, run `sideEffects` again, and create a duplicate saved product. Race window remains.

This non-apparel arm preserves apparel's posture exactly. Idempotency hardening (e.g., look up an existing saved product by `custom_order_id` before creating) applies equally to apparel and is its own ticket per §3.

> **Confidence: High** — route ordering and validate-guard logic verified by recon.

---

## 13. Out-of-scope but adjacent (acknowledged)

- **`production_option_type` is not stamped on imported promo-print products today.** The discriminator works because apparel-presence is positive and non-apparel-absence is the implicit case. If a future ticket needs a positive non-apparel signal at the source-product level, that's a separate change in the importer.
- **Frontend `useSavedProduct.ts:23` apparel filter.** After this backend change, a non-apparel saved product exists, is pricable, and is owned by the company — but `/products/[handle]` will not render it. Tracked as the Phase-18 "saved mode for non-apparel deferred" line.
- **Confirmation-email subscriber cosmetic degradation** for non-apparel reorders. See §3.
- **(Promoted to in-scope per iter-6 C1 — see §10b.)** Backend enforcement of locked multiplier choices is now part of DIV-100 at the cart-add path.
- **Workflow refactor of `[EVENT.approveProof]`** (apparel + non-apparel) with proper compensation steps. Addresses the existing orphan-on-partial-failure risk. Out of scope here; tracked separately.
- **Idempotency hardening** for both apparel and non-apparel arms. Out of scope here.
- **Inherited deleted-source-product silent fallthrough at `custom-complete`** (see §10). Affects both apparel and non-apparel reorders; documented but not addressed here.
- **Corrupted-apparel-stamp residual blind spot.** The discriminator at §4 routes products to the apparel arm based on `metadata.production_option_type === "apparel"`. An apparel product whose stamp was stripped or migrated (e.g., manual admin edit, partial migration, future metadata mutation bug) would route to the non-apparel arm. The non-apparel arm would eventually throw at §11 case 7 or case 8 (missing required keys / missing `base_option_keys`), but the diagnostic would point at non-apparel data shape rather than the actual root cause (stripped apparel stamp). Acceptable residual surface — defending against it would require a positive non-apparel signal at the source-product level, which is out of scope per the first bullet above. Documented so future debug sessions know to check `production_option_type` integrity on apparel data before chasing non-apparel-arm diagnostics.
- **Saved-product immutability post-approval.** Documented in §7c. Not a TODO; a design property worth naming so future readers don't try to "refresh" a saved product against its (mutated) source.

> **Confidence: High** — explicit Imperator scope decisions across three deliberation rounds.

---

## 14. Success criteria (observable outcomes)

1. Approving a non-apparel proof (any product imported by the promo-print importer, including products with non-quantity multipliers like flyers) succeeds end-to-end: a saved Medusa product is created and linked to the company.
2. The saved product is read by the storefront standard adapter (`adaptToStandardProduct`) without falling back to apparel and without returning null.
3. `POST /api/pricing/promo-print` against the saved product's handle, using the locked base values + the locked multiplier choices + the customer's chosen quantity, returns a successful price. Repricing at **every** quantity tier in the saved product's `options_values.quantity` works — pricing reads `multipliers[k]?.[qty]?.[lockedValue] ?? 1.0` per §10c, so every tier prices cleanly regardless of the source multiplier table's row coverage. Surcharge values that are NOT in the source table contribute factor 1.0 (no surcharge), matching the multiplier table's design intent.
4. The saved product's retained variant set is a snapshot of the source product's variants matching the locked base axes at approval time, frozen on the saved product. Customers reordering can pick any quantity tier in the retained set; every tier prices cleanly under §10c default-1.0 semantics. Subsequent source-product mutations (re-import, manual variant deletion, multiplier-table edits) do NOT change the saved product's variant set or pricing data.
5. Approving an apparel proof produces functionally-identical product/variant/metadata output as before this change. The apparel arm's existing code body is unchanged; only a top-level discriminator is added before it. Plan-level constraint: no refactor of the apparel arm body.
6. Approving a non-apparel proof whose line-item `options` map references a value not present on any source variant for the locked base axes throws with a diagnostic message naming the offending option (does NOT silently produce a corrupt saved product).
7. The saved product's `metadata` round-trips every key present on `sourceProduct.metadata` and adds `custom_order_id`. `options_values` is narrowed: locked codes (lockedBaseKeys + multiplier_keys) become single-element `[approvedValue]` arrays; `quantity` becomes the deduplicated source-ordered list of quantity values appearing in the retained variant set (NOT the source's full options_values.quantity list). No other source-metadata keys are dropped or mutated; `options_styles`, `options_order`, `options_labels`, `multipliers`, `multiplier_keys`, `base_option_keys`, `tabs`, `production_time`, `short_description`, `shipping_profiles`, `notes`, and `product_type` round-trip verbatim.
8. Each retained variant carries `original_variant_id`, `original_sku`, `original_upc`, `original_title`, and (if present) `design_notes` in its metadata. No variant carries `selections`. The variant input passed to `createProductsWorkflow` does NOT carry `sku` / `upc` / `barcode` / `ean` columns — those columns end up NULL on the saved variant (Medusa's `product_variant` schema declares each field as `nullable()`; omission leaves NULL, no auto-generation). Storefront inventory lookups read `variant.metadata.original_sku` per `custom-products/route.ts:197-204`. The product itself is created with `status: "published"` (matching apparel at `order-flow.ts:357` and the importer at `importer.ts:149`); without it, `custom-products/route.ts` filters the saved product out of the storefront list.
9. The saved product appears in the company's catalog (CompanyProduct row exists with `id === savedProduct.id`; product linked to the Webshop sales channel).
10. Reordering a non-apparel saved product belonging to the buying company takes the APPROVED + PROOF_DONE shortcut at `custom-complete` (the widened gate); no fresh proofing flow is triggered.
11. The widened gate does not change apparel reorder behavior.
12. The lineage check applies product-type-agnostically. Any saved-product reorder (apparel or non-apparel) whose `product.metadata.custom_order_id` resolves to a custom_order owned by a **different company** is rejected with a 403 at `custom-complete`. A `custom_order_id` that does not resolve at all returns a 400 with a clear diagnostic. Both replace the prior implicit `undefined.product_name` crash. Legitimate apparel reorders (lineage matches) take the same shortcut as before — the lineage check is a strengthening, not a regression.
13. Approving a non-apparel proof whose source product violates either presence (any of `base_option_keys` / `multiplier_keys` / `options_order` / `options_labels` / `options_values` / `multipliers`) OR cross-field consistency (`options_order` codes must be subset of `options_labels` keys ∩ `options_values` keys; `base_option_keys` ⊆ `options_order`; `multiplier_keys` ⊆ `options_order`; `"quantity"` ∈ `base_option_keys`; `multipliers[k]` is an object for every `k ∈ multiplier_keys`) throws with a diagnostic at approval time naming the product handle and the specific invariant. The saved product is NOT created.
14. Approving a non-apparel proof where ANY retained variant has an empty `prices[]` array throws with a diagnostic at approval time (per-variant check, not aggregate). The saved product is NOT created. Prevents publishing a saved product whose pricing path throws at first reorder, and prevents $0.00 catalog-display rot.
15. Cart-adding a non-apparel saved product (line-item's `product.metadata.custom_order_id` set) with a `metadata.options[k]` value different from the saved product's `options_values[k][0]` for any `k ∈ multiplier_keys` returns 400 from `line-items-custom`. This makes the multiplier-portion of the saved-product lock load-bearing: customers cannot swap locked multiplier values at reorder.
16. Pricing a configuration whose multiplier table has no row for `(code, quantity, value)` returns the base price multiplied by 1.0 for that code (no surcharge), not a 400 error. This matches the multiplier table's design intent: rows declare surcharges; absence is no-surcharge. Applies uniformly to catalog non-apparel pricing, saved-product non-apparel pricing, and the existing `/pricing/promo-print` endpoint.

---

## 15. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Imperator-confirmed iter-6 corrected design (multiplier semantic = "row declares surcharge; absence = 1.0"). |
| 2. Motivation | High | KG-NON-APPAREL-OPTIONS + Linear cite + Phase-18 doc + recon. |
| 3. Non-goals | High | Imperator-confirmed across deliberation rounds; backend enforcement of multiplier locks promoted to in-scope (§10b). |
| 4. Branch discriminator | High | `seed-apparel.ts:1107-1116` + `getProductByHandle.ts:112` parity verified; soft cross-check + corrupted-apparel-stamp residual documented in §13. |
| 5. Approved-config source + pre-conditions (line-item completeness + source-metadata presence + cross-field consistency) | High | `NonApparelMetadataSchema` + DIV-99 cart-time enforcement + §11 case 7 (line-item) + §11 case 8 (source-metadata two-part guard, C3) + standard-adapter null-on-missing-options_order verified at `getProductByHandle.ts:33-37`. Cross-field invariants from importer structure. |
| 6. Three-class taxonomy + lowercase-quantity invariant | High | Code-grounded at `importer.ts:41-43, 108-110`, `calculate-promo-print-price.ts:80-95`, shipped `flyers_multiplier.csv`; importer input-shape contract documented. |
| 7. Variant retention + saved shape | High | Single-stage filter on `lockedBaseKeys` (Imperator-confirmed; stage 2 from iter-5 dropped — see §10c). Mixed-arity acceptance grounded at `importer.ts:46-49, 52-77`. SKU/UPC/barcode/EAN omission (B2) grounded at Medusa schema (`product-variant.js:65-87`) + apparel reference at `order-flow.ts:368-396`. `status: "published"` (C5a) grounded at `order-flow.ts:357` + `importer.ts:149`. Immutability post-approval explicit. |
| 8. CompanyProduct + link | High | Reader audit confirms display/sort cache; id-equality verified; per-variant empty-prices throw (C4); link.create syntax `[COMPANY_MODULE]` corrected (C5c) against `order-flow.ts:420` + `importer.ts:439`. |
| 9. Image handling | High | 4-lane recon convergence on hydrateImages fallback. |
| 10. Reorder gate widening + pre-flight lineage validation + all-items iteration | High | Three coordinated changes (drop apparel clause, pre-flight lineage before `completeCartWorkflow`, iterate all items across groups + group homogeneity). Custom_order ↔ company traversal path verified against `models/custom-order.ts` (no company_id field) + link defs `order-custom-order.ts` + `company-order.ts`. Three apparel-shaped post-gate reads enumerated. |
| 10b. Cart-add lock enforcement | High | Design grounded against existing `line-items-custom/route.ts:50-65` non-apparel branch + saved-product `options_values` narrowing structure (§7c). Single new validation in existing branch — no architectural novelty. |
| 10c. Pricing-route correction (Q-B FIX-LOUD inversion) | High | Imperator-confirmed multiplier semantic ("the whole point was to reduce SKU count by deleting yes/no to a factor"); change scope is one ternary inversion at `calculate-promo-print-price.ts:88-94` + comment update; existing unit test maps cleanly to flipped behavior. Side benefit: fixes likely live catalog regression (flyer first-value `No` triggers Q-B FIX-LOUD throw on default cart-add). |
| 11. Error semantics | High | Eleven throw cases enumerated with code citations (cases 1-7 unchanged; case 8 expanded for C3 cross-field consistency; case 9 per-variant prices C4; case 10 lineage mismatch C2; case 11 cart-add lock mismatch C1). Recovery posture + partial-failure orphan caveat documented. |
| 12. Order-flow scope + tests + idempotency | High | Source-file scope: four files (added `line-items-custom/route.ts` for §10b + `calculate-promo-print-price.ts` for §10c). Unit-test scope: Q-B test flip. Integration-test scope: 15b replacement, cross-company hijack, positive saved-product reorder-shortcut, locked-multiplier-mismatch (C1+C2+C5+C6). Idempotency state guard cited at `validateEventTransition` via `transitionOrderStatus` at `route.ts:298`. |
| 13. Adjacent out-of-scope | High | Imperator scope decisions; corrupted-apparel-stamp residual + immutability properties named; backend multiplier lock enforcement promoted to in-scope. |
| 14. Success criteria | High | Sixteen criteria covering: saved-product creation (1-9), reorder shortcut (10-12), source-metadata guard (13), per-variant prices (14), cart-add lock (15), pricing default-1.0 (16). |

No Medium or Low confidence sections in iteration 6. All six second-Consul second-pass blockers (C1–C6) addressed against live evidence.
