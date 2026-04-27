# DIV-100 — Non-apparel saved product creation on approve-proof

**Status:** ready for plan (iteration 7 — scope decomposed)
**Linear:** [DIV-100](https://linear.app/divinipress/issue/DIV-100/fix-non-apparel-approve-proof-saved-product-creation-on-import-script)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Stacked above:** PR 29 (`feature/div-82-importer-hierarchy`) → merged PR 33 (`feature/div-99-non-apparel-cart-contract`)
**Backend baseline (per Linear):** `origin/import-script-promo-print`

**Sister tickets (split from iter-6):**
- **DIV-101** — Cross-company hijack defense. Pre-flight lineage validation, iterate-all-items, cart-fetch extension, isList:true traversal posture. Both apparel and non-apparel.
- **DIV-102** — Backend cart-add multiplier-lock for saved products. Discriminator strengthening, defensive guards, absence semantics, schema gate. Both arms.

**Iteration 7 changes against iteration 6.** Five-lane verification of iter-6 surfaced 12 GAPs. The merge revealed iter-6 had absorbed two legitimate concerns from adversarial review (cross-company hijack defense, backend cart-add lock) that pre-date DIV-100. The Imperator's call: decompose. DIV-100 returns to its tight scope; the absorbed concerns become focused tickets that benefit both apparel and non-apparel arms.

- **D1 — §10b (cart-add multiplier-lock) → DIV-102.** Four lanes converged on §10b's data-plane / discriminator / absence semantics / defensive shape, signaling it needs its own spec, not a section of DIV-100. Apparel saved-products ship today without backend cart-add lock; DIV-100 follows the same posture (frontend-only enforcement as baseline). DIV-102 hardens both arms.
- **D2 — §10 pre-flight + iterate-all + cart-fetch extension → DIV-101.** Pre-flight timing, items-array iteration, and cart-fetch extension are security hardenings that benefit both arms. Iter-7 keeps the iter-5 B3-equivalent lineage check (post-completeCart, items[0]-only) so DIV-100 does not widen the existing hijack hole; DIV-101 hardens end-to-end.
- **D3 — §10c value-membership check added (load-bearing fix).** The iter-6 Q-B FIX-LOUD inversion (`factor ?? 1.0`) created a money-path silent-acceptance: a request with `options.stapling = "Banana"` would price at base × 1.0 because no row exists for "Banana". Fix: the pricing route validates `selectedValue ∈ sourceProduct.metadata.options_values[code]` BEFORE applying the multiplier; throw `INVALID_DATA` on undeclared values. Row absence for a *declared* value still defaults to 1.0 (Imperator-confirmed multiplier semantic).
- **D4 — Iter-6 changelog C6 corrected.** C6 claimed the §5 example was rewritten; actually the §10c semantic change made the original example reachable as-is. No change to §5 example values.
- **D5 — Minor precision fixes from verification.** §6 cite at `parser.ts:117` noted as docstring (literal lowercase read at `:150`); §7c quantity-list source-order pinned to retainedVariants insertion order; §11 case 7 strengthened to "non-empty trimmed string"; §7c handle-collision retry posture documented (inherited 4-char suffix from apparel); §7c category shape pinned to apparel-style `category_ids: string[]`; minor §14.16 success-criterion wording fix to require declared value membership.

**Iteration 6 changes against iteration 5.** [§§ collapsed — see git history; iter-6 corrections C1, C2, C5, C6 are reabsorbed cleanly here, C3 and C4 retained, with the noted moves to DIV-101 / DIV-102.]

**Iteration 5 changes against iteration 4.** [§§ collapsed — see git history; B2, B4, B5, B6 retained here. B1 (multiplier-row narrowing) was undone by iter-6 C6 and stays undone. B3 (basic lineage check at gate) is retained here unchanged.]

**Iteration 4 changes against iteration 3.** [§§ collapsed — see git history.]

**Iteration 3 changes against iteration 2.** [§§ collapsed — see git history.]

**Iteration 2 changes against iteration 1.** [§§ collapsed — see git history.]

---

## 1. Summary

Branch `[EVENT.approveProof]` in `src/api/custom-order/order-flow.ts` so non-apparel proofs (Print & Promo per DIV-82's importer hierarchy, DIV-99's non-apparel cart contract) create saved products from the approved option configuration on the order line item, instead of the existing apparel-only `Size` / `Color` / `selectedColor` path. The saved non-apparel product locks the customer's approved choices to the configuration on the proof — except for `quantity`, which remains user-selectable on reorder so customers can re-order the same design at any quantity tier the source product supports. The saved product preserves the source product's metadata contract (notably `multipliers`, `multiplier_keys`, `base_option_keys`, `options_*` family, and `product_type`) so it remains readable by the storefront standard adapter and pricable by the promo-print pricing route.

In addition, this change updates the cart→order reorder gate at `src/api/store/carts/[id]/custom-complete/route.ts` so non-apparel saved products take the APPROVED + PROOF_DONE shortcut on reorder. Two coordinated changes at the gate: drop the `product_type === "apparel"` clause; add a basic company-lineage check at the gate (post-completeCart, items[0]-only) to prevent cross-company hijack via the widened path. Pre-flight timing and full iteration are deferred to DIV-101.

Plus a small but load-bearing correction at `src/workflows/pricing/utils/calculate-promo-print-price.ts`: invert the DIV-99 Q-B FIX-LOUD throw on missing multiplier rows to a default-1.0 fallback, AND add a value-membership check that rejects undeclared multiplier values BEFORE applying the multiplier. This fixes both the saved-product reorder semantic (rows declare surcharges; absence = 1.0) and closes the money-path silent-acceptance vector the inversion alone would create.

> **Confidence: High** — Imperator-confirmed scope decomposition; multiplier semantic Imperator-confirmed; value-membership check derived from Failure-mode lane GAP-1 finding.

---

## 2. Motivation

`[EVENT.approveProof]` is unconditionally apparel-shaped today: builds `sizeOptions` from `option.title === "Size"`, resolves `selectedColor` (throws if absent), filters variants by color, drops Color from the saved product's options, writes `selections` to variant metadata. Approving any non-apparel proof either throws on the `selectedColor` resolution or produces a saved product whose option/variant shape contradicts both the storefront standard adapter (`getProductByHandle.ts:112` discriminates on `metadata.production_option_type !== "apparel"`) and the promo-print pricing route (`calculate-promo-print-price.ts:36-95` reads `base_option_keys`, `multiplier_keys`, `multipliers` from product metadata).

DIV-99 closed the cart contract for non-apparel. DIV-100 closes the corresponding approve-proof contract — both the saved-product-creation half (the original Linear scope) and the reorder-gate half (necessary for the saved product to actually be reorderable as a saved product instead of triggering re-proofing).

> **Confidence: High** — symptom and code paths match KG-NON-APPAREL-OPTIONS in `$CONSILIUM_DOCS/doctrine/known-gaps.md` plus the Phase-18 integration handoff in `divinipress-store/docs/phase-18-integration-handoff.md` lines 47-70.

---

## 3. Non-goals

- **Frontend `useSavedProduct` hook** (`divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts:23`) hard-filters `data?.type === "apparel"`. Even after this backend change, `/products/[handle]` will not render non-apparel saved products until that hook learns the standard-product shape. Frontend retrofit is its own ticket.
- **Confirmation email subscriber** (`src/subscribers/custom-order-created.ts:83-108`) builds line-item descriptions by reading `variant.options` for `Color` and `Size`. For non-apparel reorders this degrades to cosmetically empty fields (`"Color: , Quantity ( - 100)"`) — non-throwing but ugly. Cosmetic-only; tracked as a follow-up ticket separate from DIV-100.
- **Backend enforcement of locked multiplier choices at cart-add.** Moved to **DIV-102**. Apparel saved-products ship without this enforcement today; DIV-100 follows the same posture. The structural lock for base axes (variant retention) is honored unconditionally; the multiplier-portion of the lock is enforced by frontend rendering of `options_values` (single-element arrays render as locked) until DIV-102 adds the server-side check for both arms.
- **Pre-flight timing, iterate-all-items, cart-fetch extension, isList traversal posture for the lineage check.** Moved to **DIV-101**. DIV-100 keeps a basic lineage check at the gate (post-completeCart, items[0]-only — equivalent to iter-5 B3) so the widening does not expand the hijack vector beyond what apparel currently exhibits. DIV-101 hardens for both arms.
- **Workflow refactor of `[EVENT.approveProof]`.** The existing apparel side-effect calls `companyModuleService.createCompanyProducts` directly and runs two `link.create` calls outside any workflow boundary. That pre-existing pattern is preserved here for symmetry; lifting saved-product creation into a workflow with compensation steps is a separate ticket.
- **Idempotency hardening of `[EVENT.approveProof]`.** §11 documents the existing state-machine guard and its known race window. Closing the race is its own ticket and applies to both apparel and non-apparel.
- **`production_option_type` enum extension** at `src/_custom/config/product_options.ts`. Keep the enum apparel-only. The discriminator at the cut point is "is the source product apparel?" — non-apparel products do not need a positive enum value at this layer.
- **Apparel saved-product behavior.** Untouched. This change adds a non-apparel branch and widens one downstream gate; it does not modify the apparel arm body.

> **Confidence: High** — Imperator-confirmed scope decomposition.

---

## 4. Branch discriminator (boundary contract)

At the top of the `[EVENT.approveProof]` side-effect, after the source product is fetched, branch on:

```
sourceProduct.metadata.production_option_type === "apparel"  → existing apparel arm (unchanged)
otherwise                                                    → new non-apparel arm
```

Apparel imports stamp `production_option_type: "apparel"` (`src/scripts/seed-apparel.ts:1107-1116`); the promo-print importer (`src/_custom/utils/promo-print-product/importer.ts:79-128`) does not stamp this field. Absence is the non-apparel signal — the same predicate the storefront standard adapter uses at `getProductByHandle.ts:112`.

**Cross-check (defense in depth — soft-fail when line-item data predates the bridge).** When the order line item carries `metadata.production_option_type` (bridged at line-item creation by DIV-99 at `src/workflows/pricing/steps/calculate-promo-print-prices.ts:154-158`), it MUST agree with the source-product signal:

- Set and disagrees with source-product signal → throw. Corrupt state.
- Absent → skip the cross-check; source-product signal is authoritative.

Absent covers (a) any non-apparel proof submitted before DIV-99 deployed and still pending at DIV-100 deploy, (b) admin-created or test-fixture orders that bypass `addPromoPrintPriceToCartWorkflow`, (c) apparel line items, which never carry the bridge stamp.

> **Confidence: High** — apparel importer evidence + storefront predicate parity + DIV-99 bridge inspection.

---

## 5. Approved-configuration source of truth (boundary contract)

For non-apparel approvals, the source of truth for "what was approved" is the **order line item's `metadata.options` map** — `Record<string, string>` keyed by option code. Per `NonApparelMetadataSchema` at `src/modules/custom-order/non-apparel-type.ts:23` (`z.record(z.string(), z.string())`), this map carries every code the customer chose at proof submission, mixing all three classes: base options, `quantity`, multiplier choices.

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

The multiplier-table semantic: the table declares ONLY surcharge-bearing rows. Any `(code, quantity, declaredValue)` tuple not in the table is factor 1.0 by definition — *only when `declaredValue ∈ options_values[code]`*. An *undeclared* value (one not in `options_values[code]`) is corrupt input and rejected. See §10c.

The non-apparel arm MUST NOT read `selectionsMetadata.selections`, MUST NOT resolve a `selectedColor`, and MUST NOT consult source-product `Size` / `Color` Medusa options. Those are apparel-domain concepts with no non-apparel equivalent.

**Pre-conditions.**

1. The single-line-item invariant at `src/api/custom-order/order-flow.ts:232-236` (custom orders carry exactly one line item — hard-throw if not) is preserved. All references to "the line item" below assume it.

2. **Line-item options-map completeness.** The line-item `metadata.options` map MUST carry a value for every code in `sourceProduct.metadata.base_option_keys` and every code in `sourceProduct.metadata.multiplier_keys`. The DIV-99 cart pricing flow (`calculate-promo-print-price.ts:36-43`) enforces this at the storefront cart-add entry point only. Other entry paths — admin order creation, draft conversion, future B2B import, hand-crafted `updateOrderLineItems` writes — bypass this validation. The non-apparel arm enforces it again at approval time (§11 case 7) as the load-bearing protection.

3. **Source-product metadata sanity (presence + cross-field consistency).** A non-apparel-shaped product (per §4 discriminator) created outside the promo-print importer (Medusa Admin UI, future importer variant, partial migration) might lack one or more required metadata fields OR carry a self-inconsistent set. Two-part guard at the top of the non-apparel arm.

   **3a — Presence and primitive types.** Source product carries: `base_option_keys` (array), `multiplier_keys` (array, possibly empty), `options_order` (array), `options_labels` (object), `options_values` (object), and — when `multiplier_keys.length > 0` — `multipliers` (object). Each present, correctly typed.

   **3b — Cross-field consistency.**
   - `options_order` codes ⊆ `Object.keys(options_labels)`.
   - `options_order` codes ⊆ `Object.keys(options_values)`.
   - `base_option_keys` ⊆ `options_order`.
   - `multiplier_keys` ⊆ `options_order`.
   - `"quantity"` ∈ `base_option_keys`.
   - When `multiplier_keys.length > 0`: for every `k ∈ multiplier_keys`, `multipliers[k]` exists and is an object.

   See §11 case 8 for throw semantics.

> **Confidence: High** — `NonApparelMetadataSchema` + DIV-99 cart contract + `flyers_multiplier.csv` shipped catalog + `calculate-promo-print-price.ts:36-43` cart-time enforcement.

---

## 6. The three-option-class taxonomy (boundary contract)

Non-apparel options live in three classes:

| Class | Identified by | Drives Medusa variants? | Locked at approval? |
|-|-|-|-|
| **Base-locked** | code in `base_option_keys` AND code !== `"quantity"` | yes — variant axis | **yes** |
| **Quantity** | code === `"quantity"` (always in `base_option_keys`) | yes — variant axis | **no — free on reorder** |
| **Multiplier-locked** | code in `multiplier_keys` | no — metadata-only | **yes** |

Two structural facts:

**(a) `quantity` is a real Medusa variant axis.** Recon confirmed at `src/_custom/utils/promo-print-product/importer.ts:41-43`: variants are built from `orderedOptions = allOrderedOptions.filter(o => !multiplierCodeSet.has(o.option_code))`. Quantity is not a multiplier code, so it remains in the base set and becomes a variant axis. A flyer source product has a `(paper_type × quantity)` variant grid.

**(b) `quantity` doubles as the multiplier-table second-index axis.** The pricing route at `src/workflows/pricing/utils/calculate-promo-print-price.ts:80-95` reads `quantityValue = options.quantity` and indexes `multipliers[code][quantityValue][choice]` for each multiplier code. Price = matched-variant `calculated_amount` × ∏ over multiplier_keys.

The customer's approved quantity choice (250) determines BOTH which variant they bought AND which row of the multiplier table applies. On reorder, the customer is free to pick a different quantity — different variant from the retained subset (§7) AND different multiplier-table row (price recalculates).

**The lowercase `"quantity"` invariant.** The string `"quantity"` is hardcoded across the importer (multiplier-CSV column docstring at `parser.ts:117`; literal lowercase read at `parser.ts:150`), the pricing route (`options.quantity` at `calculate-promo-print-price.ts:80`), the DIV-99 cart contract (`calculate-promo-print-prices.ts:50`), and this spec's §7a filter. The importer's input-shape contract requires lowercase. Any future importer change admitting other casings is an importer-side bug.

> **Confidence: High** — code-grounded; verified against `flyers_multiplier.csv` and test fixture at `non-apparel-cart.spec.ts:73-88`.

---

## 7. Variant retention and saved-product Medusa shape (boundary contract)

The saved non-apparel product locks the **base-locked** axes and the **multiplier-locked** choices to the approved configuration; quantity remains free.

### 7a. Variant retention rule

Define `lockedBaseKeys = sourceProduct.metadata.base_option_keys.filter(k => k !== "quantity")`.

Retain the source-product variants whose `options` match the approved values for **every** `lockedBaseKey`. Quantity and multiplier choices are NOT consulted in the retention filter. Call the result `retainedVariants`.

For the canonical flyer example: `lockedBaseKeys = ["paper_type"]`, approved `paper_type = "matte"`. The source product has 24 variants (2 papers × 12 quantity tiers); the saved product retains 12.

If `lockedBaseKeys` is empty (a hypothetical "everything is multiplier" shape), `retainedVariants` is the source product's full variant list (vacuous-truth match). If the source product has a single variant in this case, retain it. If multiple, throw — this shape is not yet supported.

If `retainedVariants` is empty, throw with a diagnostic identifying the product handle, approved configuration, locked-base-key/value pairs that failed to resolve.

**Why no multiplier-row coverage filter.** The multiplier table semantic is "missing row = factor 1.0" — not "missing row = config gap to throw on." A flyer's `multipliers.stapling = { "100": { "Yes": 1.51 } }` means stapling=Yes at qty 100 multiplies the base price by 1.51; stapling=No at qty 100 (no row, but "No" is a *declared* value) multiplies by 1.0. The whole point of multipliers is to compress the SKU grid. See §10c for the pricing-route alignment this requires.

### 7b. Variant-identity matching (option title resolution)

For each `lockedBaseKey`, the source-variant's `options[].option.title` must equal `sourceProduct.metadata.options_labels[lockedBaseKey]`. The importer at `src/_custom/utils/promo-print-product/importer.ts:46-49` builds Medusa option titles from `opt.label`, and the importer's contract requires `options_labels[code]` to be present for every code in `options_order`. If `options_labels[lockedBaseKey]` is missing on a source product, throw — variants are keyed by labels, not codes; a code-only fallback would silently produce zero matches.

### 7c. Saved-product Medusa shape

Created via `createProductsWorkflow` (the same workflow apparel uses). Fields:

**Product-level fields copied from source:** `title` (overridden by `customOrder.product_name` if set, mirroring apparel), handle (must be unique across Medusa products — match apparel's existing strategy: `${product.handle}-${randomUUID().slice(0, 4)}`; the inherited 4-char suffix is acknowledged as ~1/65,536 collision probability per retry, sufficient for current scale), `description`, `subtitle`, `thumbnail`, `images`, `external_id`, `type_id`, `tag_ids`, `category_ids: string[]` (the apparel-style id list at `order-flow.ts:364-367`, NOT the importer's `categories: [{id}]` relation array). Plus `status: "published"` — apparel sets this explicitly at `order-flow.ts:357`; without it, Medusa creates a draft product that storefront list defaults filter out (visible via Medusa's product list framework default, not enforced at `custom-products/route.ts` directly).

**Product `options`** (the Medusa entity): one entry per code in `sourceProduct.metadata.base_option_keys`, in `metadata.options_order` order, each entry's `title` from `metadata.options_labels[code]`. `values` arrays:

- For each lockedBaseKey: single-element array `[approvedValue]`.
- For `quantity`: the deduplicated quantity values appearing in `retainedVariants`, in **`retainedVariants` insertion order** (the source product's variant-table order from import-time, NOT the source product's `metadata.options_values.quantity` order, which may have been admin-edited post-import). Rationale: every quantity tier in this set has a variant matching the locked base axes. Advertising any quantity outside the set would let the customer pick a tier for which no variant matches.

The acceptance of mixed-arity `values` arrays by `createProductsWorkflow` is established by the importer at `importer.ts:46-49, 52-77`, which calls the same workflow with multi-element-per-option arrays at initial import.

**Product `metadata`:** spread of `sourceProduct.metadata` plus `custom_order_id: customOrder.id`. Two intentional NARROWINGS within `options_values` to encode the lock, plus a quantity narrowing that mirrors the Medusa `options` array:

```
saved.metadata = {
  ...sourceProduct.metadata,
  custom_order_id: customOrder.id,
  options_values: {
    ...sourceProduct.metadata.options_values,
    [lockedBaseKey]: [approvedValue],
    quantity: <quantity values from retainedVariants insertion order>,
    [multiplierKey]: [approvedValue],
  },
}
```

All other source-metadata keys (`product_type`, `options_order`, `options_labels`, `options_styles`, `base_option_keys`, `multiplier_keys`, `multipliers`, `tabs`, `production_time`, `short_description`, `shipping_profiles`, `notes`, plus any future keys) round-trip via the spread. `options_styles` is preserved verbatim — the saved product carries the source product's intent for how each option renders. Success criterion §14.7 enforces no source-metadata key is dropped (with the `options_values` narrowings as the documented exception).

**The lock semantics.**

- **Structural (base axes):** the variant retention in §7a means the retained-variant set's `options` only spans the locked base configuration. The customer cannot pick a different paper_type at reorder because the variant for `paper_type=glossy` is not on the saved product. Enforced by Medusa.
- **Frontend-rendered (multiplier choices):** the saved product's `options_values[multiplierKey] = [approvedValue]` (single-element array) signals the storefront PDP picker to render as locked. **Backend cart-add enforcement is DIV-102 scope.** Until DIV-102 ships, the multiplier portion of the lock is frontend-only — the same posture apparel ships today.

The narrowed `options_values` on the saved product remains the structural source of truth for picker rendering at `getProductByHandle.ts:39-66`.

**Saved-product immutability post-approval.** Once the saved product is created, its retained variants and the spread of source metadata are frozen on the saved product. Subsequent source-product mutations (re-import via `importer.ts:333-369` `--force`, manual variant deletion, multiplier-table edits) do NOT propagate. Repricing always reads the saved product's frozen metadata and its retained variants' `prices[].amount`. This decoupling is enforced structurally by the create-time copy. NOTE: "immutability" is asserted as a design property; it is not enforced by a write-path guard. A Medusa Admin user editing the saved product's metadata after creation would bypass the assertion. Closing this seam is its own ticket.

**Variants:** the `retainedVariants` set from §7a. For each retained variant:

- `title` — same as source variant.
- **No `sku` / `upc` / `barcode` / `ean` field on the create input.** Medusa's `product_variant` schema (`@medusajs/product/dist/models/product-variant.js:65-87`) declares unique indexes on each with `WHERE deleted_at IS NULL`; source variants are not deleted, copying would collide. Each field is `text().nullable()` — omission leaves NULL on the saved variant; Medusa does NOT auto-generate. Match apparel at `order-flow.ts:368-396` (omits these fields). Storefront inventory lookups read `variant.metadata.original_sku` per `custom-products/route.ts:197-204`.
- `options` — same `{title: value}` map as source variant.
- `prices` — same as source variant (preserves the variant's `calculated_price` shape so the pricing route can read `calculated_amount`).
- `metadata` — spread of source variant `metadata` plus:
    - `original_variant_id`: source variant id
    - `original_sku`: source variant `sku`
    - `original_upc`: source variant `upc`
    - `original_title`: source product title
    - `design_notes`: line-item `metadata.design_notes` (if present)

The non-apparel variant metadata MUST NOT include `selections` (apparel-only). The approved configuration is encoded structurally via the variant set + the `options_values` narrowing.

> **Confidence: High** — code-grounded against importer + pricing route + standard adapter; flyer canonical example traced end to end.

---

## 8. CompanyProduct + sales-channel linking (boundary contract)

Same shape as apparel. After `createProductsWorkflow` returns the saved Medusa product:

1. **CompanyProduct row.** Call `companyModuleService.createCompanyProducts({ id: savedProduct.id, company_id: companyId, price: <number> })`. The `id` argument forces the CompanyProduct primary key to match the saved-product id (apparel and importer convention). Subsequent `link.create` calls use the same id as both `product_id` and `company_product_id`. Implementers must NOT allocate a separate CompanyProduct id.

2. **Product ↔ CompanyProduct link.** `link.create({ [Modules.PRODUCT]: { product_id }, [COMPANY_MODULE]: { company_product_id } })` — both ids equal to `savedProduct.id`. Note `[COMPANY_MODULE]` (the module name string) NOT `[COMPANY_MODULE.linkable.companyProduct]`. Live evidence: `order-flow.ts:420` (apparel) and `importer.ts:439` (importer) both use `[COMPANY_MODULE]` directly.

3. **Product ↔ Webshop sales channel link.** Resolve the sales channel by name (`salesChannelService.listSalesChannels({ name: "Webshop" })`), then `link.create({ [Modules.PRODUCT]: { product_id }, [Modules.SALES_CHANNEL]: { sales_channel_id } })`.

**`price` value.** The `price` column is NOT NULL float (`src/modules/company/migrations/Migration20260104075004.ts:25`) and is currently a write-only display/sort cache. Recon confirmed: zero money-path consumers across both repos. The three storefront readers (`lib/catalog/types.ts:105`, `components/catalog/catalog-product-grid.tsx:79`, `components/catalog/catalog-product-card.tsx:89`) are all DISPLAY paths.

The write contract:

- **First, per-variant validation.** For every retained variant `v`, `v.prices` MUST be a non-empty array. If ANY retained variant has empty `prices`, **throw at approval time** with a diagnostic naming the product handle and the offending variant. See §11 case 9. The check is per-variant, not aggregate, because each retained variant corresponds to a specific quantity tier the customer can pick. NOTE: the per-variant check examines `v.prices` (the price array on the variant entity), not region-scoped `calculated_amount`. A variant with prices in `region: us` and a customer cart in `region: ca` will pass this check at approval time, then throw at cart-add with "Price not found for matching variant" (`calculate-promo-print-price.ts:73-78`). Region-scoped per-variant validation is a known incomplete guard; addressing it requires resolving the customer's region at approval time, which is not always defined for admin-driven approvals. Documented as a residual; tracked separately.
- After per-variant validation passes, compute `lowestPrice = min(amount across retainedVariants.flatMap(v => v.prices))`. Mirror apparel's reduce at `order-flow.ts:334-345`. Per-variant validation guarantees `flat()` is non-empty; `lowestPrice` is finite. Write directly to CompanyProduct.price.

Apparel's existing `lowestPrice ?? undefined` writer pattern is a latent bug masked in production by apparel always carrying region prices. The non-apparel arm does NOT inherit it.

**`Webshop` sales-channel resolution failure** preserves apparel's existing fail-mode (TypeError on undefined access if lookup returns empty). Inherited weakness, not introduced here.

> **Confidence: High** — id-equality convention verified; price-value pattern confirmed by full reader audit; region-naive caveat documented.

---

## 9. Image handling (boundary contract — no work required)

`hydrateImages()` at `src/modules/custom-order/service.ts:39-72` filters uploads by `type === PRODUCT_IMAGE || PRODUCT_THUMBNAIL`. `NonApparelMetadataSchema` carries only `upload_ids` (design files); no field for `product_thumbnail` or `product_image`. With no overrides at runtime, the existing fallback chain returns the source product's `thumbnail` and `images` — which the saved product copied at creation. No additional work is required.

> **Confidence: High** — confirmed by 4-lane recon convergence.

---

## 10. Reorder gate widening at `custom-complete` (boundary contract)

The cart `custom-complete` route decides "is this a saved-product reorder?" via the gate at `src/api/store/carts/[id]/custom-complete/route.ts:248-252`. The gate currently requires `items[0]?.metadata?.product_type === "apparel"` — DIV-99 hardening that bookmarked DIV-100. After DIV-100 ships, non-apparel saved products will exist with `product.metadata.custom_order_id` set, but their cart line items carry `product_type: "promo"` or `"print"` — the gate fails, the reorder triggers a fresh proofing flow instead of the APPROVED + PROOF_DONE shortcut.

**The widening — two coordinated changes.**

1. **Drop the apparel-only clause.** Identity gate becomes:
   ```
   isSavedProduct =
     proofType === ProofType.ORDER &&
     items[0]?.product?.metadata?.custom_order_id != null
   ```

2. **Basic lineage check at the gate.** When the gate evaluates true, resolve the `custom_order` referenced by `items[0].product.metadata.custom_order_id` and validate its owning company matches the buying company. The lineage path: `custom_order → order` (link `src/links/order-custom-order.ts`) → `company` (link `src/links/company-order.ts`). Verified against `src/modules/custom-order/models/custom-order.ts` — no `company_id` field on custom_order; traversal is via the link service or `query.graph` from order entity.
   - If `custom_order_id` does not resolve (deleted custom_order, malformed metadata): throw 400 with diagnostic.
   - If resolved custom_order's owning company !== buying company: throw 403 with diagnostic.
   - The check runs inside the existing per-group loop at `route.ts:247-282`, after the gate evaluates true and before the saved-product persist/link/upload pipeline.

This is the iter-5 B3-equivalent shape: post-completeCart timing, items[0]-only iteration. Pre-flight timing and full-iteration hardening are DIV-101 scope. The basic check is sufficient to NOT widen the existing apparel hijack vector via the dropped clause; DIV-101 closes the hole for both arms.

The bookmark comment at `route.ts:248` MUST be updated to reflect post-DIV-100 status.

**Post-gate apparel-shaped surfaces — enumerated.** The post-gate persist/link pipeline at `route.ts:268-281` (writing `proof_type`, `product_name`, `job_status: APPROVED`, `order_status: PROOF_DONE`, `metadata.original_custom_order_id`) is product-type-agnostic. Three apparel-shaped READS post-gate, each non-throwing for non-apparel:

1. **`metadata.selections` iteration at `route.ts:386-405`** — reads `(metadata.selections as any[]) || []`; non-apparel sees empty array, loop runs zero iterations. The block writes `selections: []` back via `updateOrderLineItems` at lines 406-412 (non-throwing apparel residue).
2. **FREETSHIRT promo-removal block at `route.ts:417-434`** — apparel-specific FREETSHIRT promotion. Dormant for non-apparel reorders.
3. **Confirmation-email subscriber at `src/subscribers/custom-order-created.ts:83-108`** — reads `variant.options` for `Color`/`Size` with optional-chaining + `?? ""` fallbacks. For non-apparel reorders: `"<productName>, Color: , Quantity ( - <qty>)"` — cosmetic degradation. Tracked separately per §3.

None of these surfaces blocks the widening or causes correctness breaks for non-apparel reorders.

**Inherited deleted-source-product silent fallthrough.** If an admin deletes a saved product between cart-add and `custom-complete`, the gate's `items[0]?.product?.metadata?.custom_order_id` resolves to undefined; gate evaluates false; cart silently downgrades to fresh-proof flow. Customer paid for a fast-turn reorder but receives a job in PROOFING. Inherited apparel behavior — DIV-100 does not introduce or fix this.

> **Confidence: High** — gate change verified against route flow at `route.ts:172-282`; lineage traversal path verified against custom_order model + link definitions; iter-5 B3 shape preserved unchanged.

---

## 10c. Pricing-route correction — multiplier missing rows default to factor 1.0 + value-membership check (boundary contract)

The DIV-99 design at `calculate-promo-print-price.ts:88-94` ("Q-B FIX-LOUD") throws `INVALID_DATA` whenever `multipliers[code]?.[quantity]?.[value]` is undefined for a submitted multiplier. This contradicts the multiplier table's design intent: rows declare surcharges; absence means no surcharge (factor 1.0). The Q-B FIX-LOUD over-corrected against silent misprice when the design was "no row = factor 1.0 by definition for declared values."

**The change — two parts.**

**Part 1: invert the throw to a default.**

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

**Part 2: value-membership check.** BEFORE the table lookup, validate `selectedValue ∈ sourceProduct.metadata.options_values[code]`. If the value is undeclared, throw `INVALID_DATA` with a diagnostic naming the code, the submitted value, and the declared value list. This closes the money-path silent-acceptance vector that Part 1 alone would create: without Part 2, `options.stapling = "Banana"` would price at base × 1.0 because no row exists for "Banana" — the customer pays base price for a configuration that's not even valid.

The membership check is asymmetric to the row-existence check: row absence for a *declared* value is design intent (factor 1.0); value absence from the declared list is corrupt input (throw). Both rules are documented in §11 case 12.

**Why this is in DIV-100 scope.** Part 1 is load-bearing for DIV-100: customers approving saved products with `stapling: "No"` (or any locked multiplier value with no row) cannot price their saved product on reorder under Q-B FIX-LOUD. Part 2 is load-bearing for Part 1: without the membership check, the inversion silently accepts garbage values on the money path. Shipping Part 1 alone would create a customer-money correctness bug.

**Test impact.** The existing unit test at `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97` ("throws INVALID_DATA when the multiplier row for a code/quantity is missing (Q-B fix-loud)") flips. Same fixture (`var_999_matte`, no row at qty=999), but the test must declare `var_999_matte`'s `options_values` as having "glossy" so the membership check passes; reversed expected outcome (price = 100 × 1.0 = 100). Plus a NEW unit test covering the membership-check throw (an undeclared value submitted; assert `INVALID_DATA`).

The integration test at `integration-tests/http/non-apparel-cart.spec.ts:397-417` (Test 12, "throws on missing multiplier row at price computation") also flips. Same fixture deliberately omits the multiplier row at qty=999; expected outcome reverses from `400` to successful pricing at base × 1.0. Plus a NEW integration test asserting cart-add with `stapling: "Banana"` (value not in `options_values.stapling`) returns 400 with a diagnostic.

> **Confidence: High** — Imperator-confirmed multiplier semantic; value-membership check derived from Failure-mode lane GAP-1; change scope is two surgical edits in `calculate-promo-print-price.ts:80-95` plus two test flips and two test additions.

---

## 11. Error semantics (boundary contract)

The non-apparel arm throws — does NOT silently fall back to the apparel arm — when:

1. **Discriminator disagreement** (set vs set, mismatched). See §4. Source product says non-apparel but line-item has the bridge stamp set to `"apparel"`, or vice versa. Hard-throw — corrupt state.
2. **Missing options map.** Line-item `metadata.options` is absent or not a `Record<string, string>`. Hard-throw — corrupt state.
3. **Missing `options_labels[lockedBaseKey]`** on the source product. See §7b. Hard-throw with diagnostic.
4. **Variant retention failure.** Zero source-product variants match the locked base axes (§7a). Hard-throw with diagnostic.
5. **Multi-variant retention with empty `lockedBaseKeys` and multiple source variants.** See §7a — unsupported shape. Hard-throw.
6. **Missing Webshop sales channel.** Same fail-mode as apparel (TypeError on undefined access). Inherited; not introduced here.
7. **Line-item options-map missing a required code.** For each code in `sourceProduct.metadata.base_option_keys` AND each code in `sourceProduct.metadata.multiplier_keys`: the line-item `metadata.options[code]` MUST be a non-empty trimmed string. If absent or empty (after trim), hard-throw with a diagnostic naming the missing code, source product handle, line-item id.
8. **Source-product metadata sanity — presence + cross-field consistency (§5 pre-condition 3).** Two-part guard. **Presence (3a):** every required field present and correctly typed. **Cross-field consistency (3b):** `options_order ⊆ Object.keys(options_labels)`; `options_order ⊆ Object.keys(options_values)`; `base_option_keys ⊆ options_order`; `multiplier_keys ⊆ options_order`; `"quantity" ∈ base_option_keys`; for every `k ∈ multiplier_keys`, `multipliers[k]` is an object. Each violation throws with a diagnostic naming the product handle and the specific invariant.
9. **Empty retained-variant prices (per-variant check).** For every variant in `retainedVariants`, `v.prices` MUST be a non-empty array. If ANY retained variant has empty `prices`, hard-throw with a diagnostic naming the product handle, offending variant id, approved configuration. Per-variant rather than aggregate; region-scoped check is residual (§8).
10. **Saved-product reorder gate — company-lineage mismatch (`custom-complete`).** Per §10. Throws 403 when `custom_order_id` resolves to a custom_order owned by a different company. 400 when `custom_order_id` does not resolve. Both run at the gate (post-completeCart, items[0]-only — DIV-101 hardens to pre-flight + iterate-all).
11. *(Reserved for DIV-102 — backend cart-add multiplier-lock mismatch.)*
12. **Pricing route — undeclared multiplier value (`calculate-promo-print-price.ts`).** Per §10c Part 2. Throws `INVALID_DATA` when the submitted multiplier value for any code is not in `sourceProduct.metadata.options_values[code]`. Asymmetric to row-existence: row absence for a declared value is factor 1.0 (no throw); value absence from declared list is corrupt input (throw).

**Recovery posture.** Per the route handler at `src/api/custom-order/[id]/route.ts:297-353`, the order-status DB commit at lines 349-353 runs AFTER `sideEffects` at lines 322-329. A throw inside `sideEffects` skips the commit; the order remains in its prior state and the catch at lines 354-360 returns a 400 with the diagnostic. The proof can be retried after the underlying issue is corrected.

**Partial-failure orphan caveat.** Within `sideEffects`, the sequence `createProductsWorkflow → createCompanyProducts → link.create (CompanyProduct) → link.create (Webshop)` is non-atomic. A throw at step 2 or later leaves the saved Medusa product committed without a CompanyProduct row or a sales-channel link — orphaned. Customer can retry; on retry, a fresh `randomUUID().slice(0, 4)` suffix produces a new handle with ~1/65,536 collision probability. Apparel exhibits the same posture; compensation is out of scope per §3.

> **Confidence: High** — route ordering verified by recon; throw points trace to specific code lines.

---

## 12. Order-flow scope, integration tests, and event idempotency

**Source-file scope.** Three files:
- `src/api/custom-order/order-flow.ts` — new non-apparel arm in `[EVENT.approveProof]` side-effect.
- `src/api/store/carts/[id]/custom-complete/route.ts` — gate widening (drop apparel clause + basic lineage check at gate). NOT pre-flight; NOT iterate-all (those are DIV-101).
- `src/workflows/pricing/utils/calculate-promo-print-price.ts` — Q-B FIX-LOUD inversion + value-membership check (§10c).

(Excluded from DIV-100 scope: `src/api/store/carts/[id]/line-items-custom/route.ts` — that is DIV-102.)

**Unit test scope.** Two changes:
- `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97` — the existing "throws INVALID_DATA when the multiplier row for a code/quantity is missing" test flips. Reversed expected outcome (price = 100 × 1.0 = 100). Test description updated.
- NEW unit test in the same file — value-membership-check throw (submit value not in `options_values[code]`; assert `INVALID_DATA`).

**Integration test scope.** Five changes to `integration-tests/http/non-apparel-cart.spec.ts`:

1. **Replace Test 15b's apparel-only assertion** (current lines 595-663). After widening, the apparel-only assertion fails. Rewrite the safety property: a non-apparel order **without** a backing custom_order does NOT auto-approve.

2. **Add a positive saved-product reorder-shortcut test.** Approve a non-apparel proof, verify the saved product was created with `status: "published"` and a CompanyProduct row exists, then add the saved variant to a fresh cart and complete the cart. Assert resulting custom_order has `jobStatus = APPROVED`, `orderStatus = PROOF_DONE`, `metadata.original_custom_order_id` set.

3. **Flip Test 12** (current lines 397-417, "throws on missing multiplier row at price computation"). Same fixture (`var_999_matte`, no row at qty=999); reversed expected outcome from 400-throw to successful pricing at base × 1.0. **NOTE:** the fixture's `options_values` for the multiplier code must include the submitted value so the new membership check passes; this is a fixture data shape change.

4. **Add an undeclared-multiplier-value negative test.** Cart-add with `metadata.options.stapling = "Banana"` (or any value not in `options_values.stapling`). Assert 400 with diagnostic naming the code and submitted value.

5. **Cross-company hijack negative test moved to DIV-101.** Not in DIV-100 scope.

(Cart-add locked-multiplier-mismatch test moved to DIV-102.)

**Idempotency posture.** The state-machine guard is `validateEventTransition` in `order-flow.ts` (called by `transitionOrderStatus` at `src/api/custom-order/[id]/route.ts:298`), which enforces `from: PENDING → to: APPROVED` for `approveProof`. The state guard runs against `currentCustomOrder` (an in-memory snapshot fetched at the top of the route handler):

- After the first call's status commit lands (lines 349-353), a subsequent `approveProof` reads APPROVED state, fails the state guard, never reaches `sideEffects`.
- Between `sideEffects` succeeding and the status commit, a concurrent second `approveProof` whose route handler started reading `currentCustomOrder` BEFORE the first call's commit landed will see PENDING, pass the state guard, run `sideEffects` again, create a duplicate saved product. Race window remains.

DIV-100 preserves apparel's posture exactly. Idempotency hardening is its own ticket per §3.

> **Confidence: High** — route ordering and state guard verified; test scope reflects DIV-101 / DIV-102 split.

---

## 13. Out-of-scope but adjacent (acknowledged)

- **`production_option_type` is not stamped on imported promo-print products today.** Discriminator works because apparel-presence is positive and non-apparel-absence is implicit.
- **Frontend `useSavedProduct.ts:23` apparel filter.** After this backend change, a non-apparel saved product exists, is pricable, owned by the company — but `/products/[handle]` will not render it until the hook learns the standard-product shape.
- **Confirmation-email subscriber cosmetic degradation** for non-apparel reorders. See §3.
- **Backend cart-add multiplier-lock enforcement.** Moved to **DIV-102**.
- **Pre-flight lineage timing + iterate-all-items + cart-fetch extension + isList traversal.** Moved to **DIV-101**.
- **Workflow refactor of `[EVENT.approveProof]`** (apparel + non-apparel) with proper compensation steps. Out of scope.
- **Idempotency hardening** for both arms. Out of scope.
- **Inherited deleted-source-product silent fallthrough at `custom-complete`** (§10). Both arms; out of scope.
- **Corrupted-apparel-stamp residual blind spot.** A stripped/migrated apparel stamp routes the product to the non-apparel arm; eventual throw at §11 case 7 or 8 with a non-apparel diagnostic. Acceptable residual.
- **Saved-product immutability post-approval.** Asserted as a design property (§7c), not enforced by a write-path guard. A Medusa Admin user editing the saved product's metadata after creation would bypass the assertion. Closing this seam is its own ticket; a sufficiently-stable mitigation is "validate the saved-product cart-add lock against the original custom_order's frozen approval data instead of the live saved-product metadata," which is part of DIV-102's design surface.
- **Per-variant prices region-naive check (§8).** A variant priced in `region: us` only would pass the empty-prices check at approval but throw at cart-add for a `region: ca` customer. Documented residual.

> **Confidence: High** — Imperator scope decisions; absorbed concerns extracted to focused tickets.

---

## 14. Success criteria (observable outcomes)

1. Approving a non-apparel proof (any product imported by the promo-print importer) succeeds end-to-end: a saved Medusa product is created and linked to the company.
2. The saved product is read by the storefront standard adapter (`adaptToStandardProduct`) without falling back to apparel and without returning null.
3. `POST /api/pricing/promo-print` against the saved product's handle, using the locked base values + the locked multiplier choices + the customer's chosen quantity, returns a successful price. Repricing at every quantity tier in the saved product's `options_values.quantity` works: pricing reads `multipliers[k]?.[qty]?.[lockedValue] ?? 1.0` after value-membership pass per §10c.
4. The saved product's retained variant set is a snapshot of the source product's variants matching the locked base axes at approval time, frozen on the saved product. Customers can pick any quantity tier in the retained set; every tier prices cleanly. Subsequent source mutations do NOT propagate.
5. Approving an apparel proof produces functionally-identical product/variant/metadata output as before this change. The apparel arm body is unchanged; only a top-level discriminator is added.
6. Approving a non-apparel proof whose line-item `options` map references a value not present on any source variant for the locked base axes throws with a diagnostic.
7. The saved product's `metadata` round-trips every key on `sourceProduct.metadata` and adds `custom_order_id`. `options_values` is narrowed: locked codes (lockedBaseKeys + multiplier_keys) become single-element `[approvedValue]`; `quantity` becomes the deduplicated retainedVariants insertion-order list. No other source-metadata keys are dropped or mutated.
8. Each retained variant carries `original_variant_id`, `original_sku`, `original_upc`, `original_title`, and (if present) `design_notes` in its metadata. No variant carries `selections`. The variant input passed to `createProductsWorkflow` does NOT carry `sku` / `upc` / `barcode` / `ean`. The product itself is created with `status: "published"`.
9. The saved product appears in the company's catalog (CompanyProduct row with `id === savedProduct.id`; product linked to Webshop sales channel).
10. Reordering a non-apparel saved product belonging to the buying company takes the APPROVED + PROOF_DONE shortcut at `custom-complete`.
11. The widened gate does not change apparel reorder behavior.
12. A saved-product reorder whose `product.metadata.custom_order_id` resolves to a custom_order owned by a different company is rejected with 403 at the gate (post-completeCart, items[0] basis). A `custom_order_id` that does not resolve returns 400. (DIV-101 hardens this to pre-flight + iterate-all.)
13. Approving a non-apparel proof whose source product violates either presence (any of `base_option_keys` / `multiplier_keys` / `options_order` / `options_labels` / `options_values` / `multipliers`) OR cross-field consistency throws with a diagnostic at approval time. The saved product is NOT created.
14. Approving a non-apparel proof where ANY retained variant has an empty `prices[]` array throws with a diagnostic at approval time. The saved product is NOT created.
15. Pricing a configuration whose multiplier table has no row for `(code, quantity, declaredValue)` — where `declaredValue ∈ sourceProduct.metadata.options_values[code]` — returns the base price multiplied by 1.0 for that code (no surcharge), not a 400 error.
16. Pricing a configuration with a multiplier value NOT in `sourceProduct.metadata.options_values[code]` throws `INVALID_DATA` with a diagnostic naming the code, the submitted value, and the declared value list.

---

## 15. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Imperator-confirmed scope decomposition; multiplier semantic confirmed; value-membership check from Failure-mode lane finding. |
| 2. Motivation | High | KG-NON-APPAREL-OPTIONS + Linear cite + Phase-18 doc + recon. |
| 3. Non-goals | High | Imperator-confirmed; backend cart-add lock + lineage hardening explicitly extracted to DIV-101 / DIV-102. |
| 4. Branch discriminator | High | `seed-apparel.ts:1107-1116` + `getProductByHandle.ts:112` parity verified; soft cross-check. |
| 5. Approved-config + pre-conditions | High | `NonApparelMetadataSchema` + DIV-99 cart-time enforcement + §11 cases 7, 8; standard-adapter null-on-missing-options_order at `getProductByHandle.ts:33-37`. |
| 6. Three-class taxonomy + lowercase-quantity invariant | High | Code-grounded at `importer.ts:41-43, 108-110`, `calculate-promo-print-price.ts:80-95`, shipped `flyers_multiplier.csv`; `parser.ts:117` (docstring) + `:150` (literal read). |
| 7. Variant retention + saved shape | High | Single-stage filter on `lockedBaseKeys`. Mixed-arity acceptance grounded at `importer.ts:46-49, 52-77`. SKU/UPC/barcode/EAN omission grounded at Medusa schema + apparel reference. `status: "published"` at `order-flow.ts:357`. category_ids shape pinned to apparel-style. Handle-collision retry posture documented (4-char inheritance). Immutability documented as asserted-not-enforced. |
| 8. CompanyProduct + link | High | Reader audit confirms display/sort cache; id-equality verified; per-variant empty-prices throw; link.create syntax `[COMPANY_MODULE]` verified; region-naive caveat documented. |
| 9. Image handling | High | 4-lane recon convergence on hydrateImages fallback. |
| 10. Reorder gate widening + basic lineage check at gate | High | Two coordinated changes (drop apparel clause, basic lineage at gate). Custom_order ↔ company traversal path verified against `models/custom-order.ts` (no company_id field) + link defs. Iter-5 B3 shape preserved unchanged. |
| 10c. Pricing-route correction | High | Imperator-confirmed multiplier semantic; value-membership check from Failure-mode GAP-1; change scope is one ternary inversion + membership guard at `calculate-promo-print-price.ts:80-95`. |
| 11. Error semantics | High | Eleven throw cases enumerated (case 11 reserved for DIV-102; case 12 added for value-membership). Recovery posture + partial-failure orphan caveat documented. |
| 12. Order-flow scope + tests + idempotency | High | Three-file source scope (DIV-101 / DIV-102 split honored). Unit-test scope: Q-B test flip + new membership test. Integration-test scope: 15b replacement, positive shortcut test, Test 12 flip, undeclared-value test. State guard cited at `validateEventTransition` via `transitionOrderStatus`. |
| 13. Adjacent out-of-scope | High | Imperator scope decisions; immutability + region-naive residuals named. |
| 14. Success criteria | High | Sixteen criteria covering: saved-product creation (1-9), reorder shortcut + lineage (10-12), source-metadata + per-variant prices (13-14), pricing semantics (15-16). |

No Medium or Low confidence sections in iteration 7. Twelve verification GAPs from iter-6 cold pass either resolved here (D3 value-membership; D4 changelog; D5 precision fixes) or extracted to DIV-101 / DIV-102 (lineage hardening; cart-add lock; defensive guards; schema gate; etc.).
