# DIV-100 — Non-apparel saved product creation on approve-proof

**Status:** draft (iteration 3 — pending differential re-verification)
**Linear:** [DIV-100](https://linear.app/divinipress/issue/DIV-100/fix-non-apparel-approve-proof-saved-product-creation-on-import-script)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Stacked above:** PR 29 (`feature/div-82-importer-hierarchy`) → merged PR 33 (`feature/div-99-non-apparel-cart-contract`)
**Backend baseline (per Linear):** `origin/import-script-promo-print`

**Iteration 3 changes against iteration 2.** Four GAP closures: §10 enumerates all three apparel-shaped post-gate reads (selections-loop, FREETSHIRT block, email subscriber); §5/§11 add line-item required-key presence guard (closes silent-corruption on missing multiplier keys, missing locked-base keys, and missing `base_option_keys` on source product); §7c states saved-product immutability post-approval explicitly; §10/§13 acknowledge inherited deleted-source-product silent fallthrough. Eight CONCERN closures: §7c narrows `options_values.quantity` to retained variant subset (Imperator-decided); §7c preserves `options_styles` verbatim with reasoning (Imperator-decided); §7c softened lock-mechanism prose; §7c cites importer-pattern as evidence anchor for createProductsWorkflow shape; §6 documents importer's lowercase-`quantity` invariant; §8 clarifies the empty-prices boundary explicitly; §11 wording tightened on recoverability; §12 corrected line citation (state-machine guard at `transitionOrderStatus`, not the permission check at `:218`); §13 acknowledges corrupted-apparel-stamp residual; §14.3 notes the cart-add-validated assumption.

**Iteration 2 changes against iteration 1.** Corrected variant-retention model after Imperator clarification on multiplier semantics (single-variant lock → filter-by-locked-base-axes-minus-quantity). Three-class option taxonomy introduced. `custom-complete` reorder-gate widening added in scope. §4 cross-check softened. §8 aligned to apparel raw-amount pattern. §11 idempotency wording corrected. Iteration-1's §15 open question removed.

---

## 1. Summary

Branch `[EVENT.approveProof]` in `src/api/custom-order/order-flow.ts` so non-apparel proofs (Print & Promo per DIV-82's importer hierarchy, DIV-99's non-apparel cart contract) create saved products from the approved option configuration on the order line item, instead of the existing apparel-only `Size` / `Color` / `selectedColor` path. The saved non-apparel product locks the customer's approved choices to the configuration on the proof — except for `quantity`, which remains user-selectable on reorder so customers can re-order the same design at any quantity tier the source product supports. The saved product preserves the source product's metadata contract (notably `multipliers`, `multiplier_keys`, `base_option_keys`, `options_*` family, and `product_type`) so it remains readable by the storefront standard adapter and pricable by the promo-print pricing route.

In addition, this change widens the cart→order reorder gate at `src/api/store/carts/[id]/custom-complete/route.ts:248-252` so non-apparel saved products take the APPROVED + PROOF_DONE shortcut on reorder (no re-proofing of an already-approved design), matching apparel's existing reorder behavior. This is a one-line gate widening; the post-gate persist/link/upload pipeline is product-type-agnostic.

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
- **Backend enforcement of locked multiplier choices.** §7 narrows `metadata.options_values` for locked codes to single-value arrays — that's a frontend-rendering signal, not server-side validation. A buggy or malicious cart payload that submits a different value for a locked multiplier would be priced and produced as the submitted value, not the approved one. Server-side enforcement at `line-items-custom` (validate cart payload against saved-product `options_values`) is its own hardening ticket.
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
  stapling:   "Yes",          // multiplier choice (NOT a variant axis)
  hole_punching: "No",        // multiplier choice
  rounded_corners: "No"       // multiplier choice
}
```

The non-apparel arm MUST NOT read `selectionsMetadata.selections`, MUST NOT resolve a `selectedColor`, and MUST NOT consult source-product `Size` / `Color` Medusa options. Those are apparel-domain concepts with no non-apparel equivalent.

**Pre-conditions.**

1. The single-line-item invariant at `src/api/custom-order/order-flow.ts:232-236` (custom orders carry exactly one line item — hard-throw if not) is preserved. All references to "the line item" below assume it.

2. **Line-item options-map completeness.** The line-item `metadata.options` map MUST carry a value for every code in `sourceProduct.metadata.base_option_keys` and every code in `sourceProduct.metadata.multiplier_keys`. The DIV-99 cart pricing flow (`calculate-promo-print-price.ts:36-43`) enforces this at cart-add time by computing `allRequiredKeys = [...baseOptionKeys, ...multiplierKeys]` and rejecting any cart whose options map is incomplete. The non-apparel arm enforces it again at approval time as defense-in-depth — see §11 case 7. The reason for the double-check: a hand-edited line item, an admin-created order bypassing the cart workflow, or a future cart path could persist an incomplete options map; without the approval-time guard, a missing key would silently produce a `[undefined]` entry in the saved product's `options_values` (corrupt saved product, no diagnostic).

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

**The lowercase `"quantity"` invariant.** The string `"quantity"` is hardcoded across the importer (multiplier-CSV second-axis column, `parser.ts:201-203`), the pricing route (`options.quantity` read at `calculate-promo-print-price.ts:80`), the DIV-99 cart contract (`calculate-promo-print-prices.ts:50` `Number(item.metadata.options.quantity)`), and this spec's §7a filter. The importer's input-shape contract is "quantity is the literal lowercase string `quantity`" — uppercase or aliased option codes would silently break the system end-to-end (the saved product would lock the quantity axis, pricing would fail to find the multiplier-table row, etc.). This spec inherits the invariant and does not enforce it directly; any future importer change that admits other casings or aliases is an importer-side bug, not something the saved-product code accommodates.

> **Confidence: High** — code-grounded; verified against shipped `flyers_multiplier.csv` (3 multiplier codes: `stapling`, `hole_punching`, `rounded_corners`) and the test fixture at `integration-tests/http/non-apparel-cart.spec.ts:73-88`. The lowercase-`quantity` invariant is upheld by importer input shape (CSV format), not by code enforcement.

---

## 7. Variant retention and saved-product Medusa shape (boundary contract)

The saved non-apparel product locks the **base-locked** axes and the **multiplier-locked** choices to the approved configuration; quantity remains free. Concretely:

### 7a. Variant retention rule

Define `lockedBaseKeys = sourceProduct.metadata.base_option_keys.filter(k => k !== "quantity")`.

Retain the source-product variants whose `options` match the approved values for **every** `lockedBaseKey`. Quantity and multiplier choices are NOT consulted in the retention filter (multipliers aren't variant axes; quantity is allowed to vary).

For the canonical flyer example: `lockedBaseKeys = ["paper_type"]`, approved `paper_type = "matte"`. The source product has, say, 10 variants (2 papers × 5 quantity tiers); the saved product retains 5 (every quantity tier of paper=matte).

If `lockedBaseKeys` is empty (a source product with zero non-quantity base axes — a hypothetical "everything is multiplier" shape), the retained variant set is the source product's full variant list (vacuous-truth match). If the source product has a single variant in this case, retain it. If multiple, throw with diagnostic — this shape is not yet supported and indicates either a corrupted import or a product class outside the catalog as it stands today.

If zero variants match the lockedBaseKeys filter, throw with a diagnostic message identifying the product handle, the approved configuration, and the locked-base-key/value pairs that failed to resolve.

### 7b. Variant-identity matching (option title resolution)

For each `lockedBaseKey`, the source-variant's `options[].option.title` must equal `sourceProduct.metadata.options_labels[lockedBaseKey]`. The importer at `src/_custom/utils/promo-print-product/importer.ts:46-49` builds Medusa option titles from `opt.label`, and the importer's contract requires `options_labels[code]` to be present for every code in `options_order`. If `options_labels[lockedBaseKey]` is missing on a source product, throw with a clear diagnostic ("missing options_labels for code X on product Y") rather than falling back to the bare code (variants are keyed by labels, not codes — a code-only fallback would silently produce zero matches).

### 7c. Saved-product Medusa shape

Created via `createProductsWorkflow` (the same workflow apparel uses). Fields:

**Product-level fields copied from source:** `title` (overridden by `customOrder.product_name` if set, mirroring apparel), handle (must be unique across Medusa products — match apparel's existing uniqueness strategy), `description`, `subtitle`, `thumbnail`, `images`, `external_id`, `type_id`, `tag_ids`, `category_ids`.

**Product `options`** (the Medusa entity, not the metadata bag): one entry per code in `sourceProduct.metadata.base_option_keys`, in `metadata.options_order` order, each entry's `title` from `metadata.options_labels[code]`. `values` arrays:

- For each lockedBaseKey: single-element array `[approvedValue]`.
- For `quantity`: the value list derived from the **retained variant set's** quantity values (deduplicated, preserving source order). NOT the source product's full `options_values.quantity` list. Rationale: if the source product was imported with declared quantity tiers `["100","250","500","1000","2500"]` but its actual SKU rows for the locked base configuration only cover `["100","500","1000"]` (a degenerate import or a future product class with sparse SKU coverage), advertising tiers without matching variants would let the customer select a quantity for which no variant exists — pricing route then throws on variant-match. Narrowing to retained-variant tiers prevents this.

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

**The lock semantics.** The narrowed `options_values` is anticipatory metadata: it encodes the customer's approved configuration as structural data the future frontend retrofit will honor when rendering the saved-product PDP. Today, no backend code path treats `options_values: ["Yes"]` as a runtime lock — the pricing route reads what the cart sends, not what the saved product's `options_values` permits. The lock is a frontend rendering signal (storefront standard adapter at `getProductByHandle.ts:39-66` reads `options_values[code]` and uses it for picker rendering) plus future-frontend convention. Backend enforcement of the lock is explicitly out of scope per §3.

**Saved-product immutability post-approval.** Once the saved product is created, its retained variants and the spread of source metadata (including `multipliers`, `multiplier_keys`, `base_option_keys`, `options_*`) are frozen on the saved product. Subsequent source-product mutations (re-import via `importer.ts:333-369` `--force`, manual variant deletion via Medusa Admin, multiplier-table edits) do NOT propagate to the saved product. Repricing always reads the saved product's frozen metadata and its retained variants' `prices[].amount`. This decoupling is a strength of the design — it guarantees the customer's reorder pricing matches what they approved — and is enforced structurally by the create-time copy, with no runtime read of the source product.

**Variants:** the retained set from §7a. For each retained variant:

- `title` — same as source variant.
- `sku` / `upc` / `barcode` / `ean` — same as source variant.
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

2. **Product ↔ CompanyProduct link.** `link.create({ [Modules.PRODUCT]: { product_id }, [COMPANY_MODULE.linkable.companyProduct]: { company_product_id } })` — both ids equal to `savedProduct.id`.

3. **Product ↔ Webshop sales channel link.** Resolve the sales channel by name (`salesChannelService.listSalesChannels({ name: "Webshop" })`), then `link.create({ [Modules.PRODUCT]: { product_id }, [Modules.SALES_CHANNEL]: { sales_channel_id } })`.

**`price` value.** The `price` column is NOT NULL float (`src/modules/company/migrations/Migration20260104075004.ts:25`) and is currently a write-only display/sort cache. Recon confirmed: zero money-path consumers across both repos. The three storefront readers (`lib/catalog/types.ts:105`, `components/catalog/catalog-product-grid.tsx:79`, `components/catalog/catalog-product-card.tsx:89`) are all DISPLAY paths — `formatPrice(...)` for catalog cards. The write contract:

- Compute `lowestPrice = min(amount across retainedVariants.flatMap(v => v.prices))`. This mirrors apparel's reduce at `order-flow.ts:334-345` and the importer's `Math.min(...sku.cost)` at `importer.ts:419-422`.
- If `flat()` returns `[]` (every retained variant has empty `prices`, e.g. region/currency not configured for this product in this environment), the `lowestPrice` reduce returns `null` / `undefined`. **In that case, explicitly write `0` rather than `null`/`undefined`** — the migration declares the column NOT NULL, and writing `lowestPrice ?? undefined` (the apparel pattern) would violate the constraint. Apparel does not hit this boundary in practice because apparel variants always carry region prices; non-apparel imports may not, depending on environment configuration. The explicit `0` fallback is a non-apparel-arm-only correction to the apparel writer pattern.

**`Webshop` sales-channel resolution failure** preserves apparel's existing fail-mode: if the lookup returns an empty array, destructuring yields `undefined` and the subsequent property access throws `TypeError`. This is an inherited weakness, not introduced here. Documented but not addressed.

> **Confidence: High** — id-equality convention verified against apparel arm + importer; price-value pattern confirmed by full reader audit.

---

## 9. Image handling (boundary contract — no work required)

`hydrateImages()` at `src/modules/custom-order/service.ts:39-72` filters uploads by `type === PRODUCT_IMAGE || PRODUCT_THUMBNAIL`. `NonApparelMetadataSchema` carries only `upload_ids` (design files); no field for `product_thumbnail` or `product_image`. With no overrides at runtime, the existing fallback chain returns the source product's `thumbnail` and `images` — which the saved product copied at creation. No additional work is required.

> **Confidence: High** — confirmed by 4-lane recon convergence.

---

## 10. Reorder gate widening at `custom-complete` (boundary contract)

The cart `custom-complete` route decides "is this a saved-product reorder?" via the gate at `src/api/store/carts/[id]/custom-complete/route.ts:248-252`. The gate currently requires `items[0]?.metadata?.product_type === "apparel"` — DIV-99 hardening that explicitly bookmarked DIV-100 ("*Re-evaluate when DIV-100 introduces non-apparel saved-product creation.*"). After DIV-100 ships, non-apparel saved products will exist with `product.metadata.custom_order_id` set, but their cart line items carry `product_type: "promo"` or `"print"` — the gate fails, the reorder triggers a fresh proofing flow instead of the APPROVED + PROOF_DONE shortcut.

**The widening.** Drop the third clause:

```
isSavedProduct =
  proofType === ProofType.ORDER &&
  items[0]?.product?.metadata?.custom_order_id != null
```

**Post-gate apparel-shaped surfaces — enumerated.** Recon confirmed the post-gate persist/link pipeline (the saved-product branch at `route.ts:268-281` writing `proof_type`, `product_name`, `job_status: APPROVED`, `order_status: PROOF_DONE`, and `metadata.original_custom_order_id`; the downstream `createCustomOrders` insert; the link.create calls at 295-316) is structurally product-type-agnostic. There are three apparel-shaped READS in the same route file post-gate, each enumerated explicitly so an implementer or future verifier can audit them:

1. **`metadata.selections` iteration at `route.ts:386-405`** (inside the upload-move loop, runs when `movedFiles.length > 0`). Reads `(metadata.selections as any[]) || []` — for non-apparel line items, `selections` is undefined, the `|| []` defaults to empty, and the loop runs zero iterations. The block then writes `selections: []` back onto the line-item metadata via `updateOrderLineItems` at lines 406-412 — apparel residue, non-throwing, no behavioral effect on non-apparel reorders. Cart `passthrough()` semantics on `NonApparelMetadataSchema` accept the empty-array write.

2. **FREETSHIRT promo-removal block at `route.ts:417-434`** (apparel-specific: the FREETSHIRT promotion is an apparel onboarding feature). Dormant for non-apparel reorders unless a customer somehow has the FREETSHIRT promo applied to a non-apparel cart. Per `cart.promotions` membership check, won't trigger for typical non-apparel reorders.

3. **Confirmation-email subscriber at `src/subscribers/custom-order-created.ts:83-108`** (fires on the `custom-order.created` event emitted at `route.ts:437-438`). Reads `variant.options` for `Color` and `Size` with optional-chaining + `?? ""` fallbacks. For non-apparel reorders, output is `"<productName>, Color: , Quantity ( - <qty>)"` — non-throwing cosmetic degradation. Tracked as a follow-up ticket per §3 non-goals.

None of these three surfaces blocks the widening or causes correctness breaks for non-apparel reorders. They are documented so future post-gate edits inside any of these blocks (e.g., adding logic that depends on a non-empty `selections` array, or adding a new subscriber on `custom-order.created` that reads variant.options unsafely) consider non-apparel input. The bookmark comment at `route.ts:248` MUST be updated to reflect post-DIV-100 status.

**Inherited deleted-source-product silent fallthrough.** If an admin deletes a saved product between cart-add and `custom-complete`, the gate's `items[0]?.product?.metadata?.custom_order_id` resolves to undefined; `undefined != null` is false; the gate evaluates false; the cart silently downgrades to fresh-proof flow. The customer paid for a fast-turn reorder but receives a job in PROOFING state. This is **inherited apparel behavior** — apparel reorders exhibit the same fallthrough on saved-product deletion. DIV-100 does not introduce or fix this; it is documented here so a future ticket can address it across both arms.

> **Confidence: High** — recon confirmed end-to-end product-type-agnosticity of the post-gate path; one-line widening verified safe.

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
8. **Source product missing `base_option_keys` metadata** (or `base_option_keys` not an array). The discriminator at §4 routes any non-apparel-shaped product into this arm; a non-apparel product created outside the promo-print importer (e.g., via Medusa Admin UI or a future importer variant) might lack `base_option_keys` entirely. `undefined.filter(...)` would TypeError without diagnostic. Hard-throw with a clear "missing base_option_keys metadata on product Y" message.

**Recovery posture.** Per the route handler at `src/api/custom-order/[id]/route.ts:297-353`, the order-status DB commit at lines 349-353 runs AFTER `sideEffects` at lines 322-329. A throw inside `sideEffects` skips the commit; the order remains in its prior state (PENDING/PROOF_READY) and the catch at lines 354-360 returns a 400 with the diagnostic message. The proof can be retried after the underlying issue is corrected. The committed-APPROVED-but-no-saved-product state cannot occur via this code path. (See the partial-failure orphan caveat below for a different failure mode that does NOT involve status commit.)

**Partial-failure orphan caveat.** Within `sideEffects`, the sequence `createProductsWorkflow → createCompanyProducts → link.create (CompanyProduct) → link.create (Webshop)` is non-atomic. A throw at step 2 or later leaves the saved Medusa product committed with no CompanyProduct row or no sales-channel link — orphaned. The order itself remains PENDING (status commit didn't run), so the customer can retry — but the prior attempt's saved Medusa product persists in the database as a dangling row. This matches apparel's existing behavior; compensation is out of scope per §3.

> **Confidence: High** — route ordering verified by recon; throw points trace to specific code lines.

---

## 12. Order-flow scope and event idempotency (boundary contract)

This change is scoped to two files: `src/api/custom-order/order-flow.ts` (new non-apparel arm in the `[EVENT.approveProof]` side-effect) and `src/api/store/carts/[id]/custom-complete/route.ts` (one-line gate widening at line 252). No other order-flow events change.

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
- **Backend enforcement of locked multiplier choices.** See §3.
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
3. `POST /api/pricing/promo-print` against the saved product's handle, using the locked base values + the locked multiplier choices + the customer's chosen quantity, returns a successful price computed against the saved product's preserved `multipliers` table. Repricing at any quantity tier in the saved product's `options_values.quantity` (i.e., any tier covered by the retained variant set) works. Implicit assumption: the approved configuration was cart-add-validated by `calculate-promo-print-price.ts:36-43`, so any combination of locked base + locked multiplier + supported quantity tier has a multiplier-table row; configurations that pass cart-add validation reprice cleanly.
4. The saved product's retained variant set is a snapshot of the source product's variants matching the locked base axes at approval time, frozen on the saved product. Customers reordering can pick any quantity tier in the retained set. Subsequent source-product mutations do not change the saved product's variant set or pricing data.
5. Approving an apparel proof produces functionally-identical product/variant/metadata output as before this change. The apparel arm's existing code body is unchanged; only a top-level discriminator is added before it. Plan-level constraint: no refactor of the apparel arm body.
6. Approving a non-apparel proof whose line-item `options` map references a value not present on any source variant for the locked base axes throws with a diagnostic message naming the offending option (does NOT silently produce a corrupt saved product).
7. The saved product's `metadata` round-trips every key present on `sourceProduct.metadata` and adds `custom_order_id`. `options_values` is narrowed: locked codes (lockedBaseKeys + multiplier_keys) become single-element `[approvedValue]` arrays; `quantity` becomes the deduplicated source-ordered list of quantity values appearing in the retained variant set (NOT the source's full options_values.quantity list). No other source-metadata keys are dropped or mutated; `options_styles`, `options_order`, `options_labels`, `multipliers`, `multiplier_keys`, `base_option_keys`, `tabs`, `production_time`, `short_description`, `shipping_profiles`, `notes`, and `product_type` round-trip verbatim.
8. Each retained variant carries `original_variant_id`, `original_sku`, `original_upc`, `original_title`, and (if present) `design_notes` in its metadata. No variant carries `selections`.
9. The saved product appears in the company's catalog (CompanyProduct row exists with `id === savedProduct.id`; product linked to the Webshop sales channel).
10. Reordering a non-apparel saved product takes the APPROVED + PROOF_DONE shortcut at `custom-complete` (the widened gate); no fresh proofing flow is triggered.
11. The widened gate does not change apparel reorder behavior.

---

## 15. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Imperator-confirmed iteration-3 design. |
| 2. Motivation | High | KG-NON-APPAREL-OPTIONS + Linear cite + Phase-18 doc + recon. |
| 3. Non-goals | High | Imperator-confirmed across three deliberation rounds. |
| 4. Branch discriminator | High | `seed-apparel.ts:1107-1116` + `getProductByHandle.ts:112` parity + soft cross-check verified against legacy/admin/fixture/apparel scenarios; corrupted-apparel-stamp residual documented in §13. |
| 5. Approved-config source + line-item completeness pre-condition | High | `NonApparelMetadataSchema` + DIV-99 cart-time enforcement at `calculate-promo-print-price.ts:36-43` + §11 case 7 approval-time defense-in-depth. |
| 6. Three-class taxonomy + lowercase-quantity invariant | High | Code-grounded at `importer.ts:41-43, 108-110`, `calculate-promo-print-price.ts:80-95`, shipped `flyers_multiplier.csv`; importer input-shape contract documented. |
| 7. Variant retention + saved shape | High | Imperator-confirmed three-class lock semantics; mixed-arity acceptance grounded at `importer.ts:46-49, 52-77`; quantity-narrowing to retained subset closes the divergence-from-source-tiers risk; `options_styles` preserved verbatim with reasoning; immutability post-approval explicit. |
| 8. CompanyProduct + link | High | Reader audit confirms display/sort cache (zero money-path consumers across both repos); id-equality verified; empty-prices NOT NULL boundary explicitly handled with `0` fallback. |
| 9. Image handling | High | 4-lane recon convergence on hydrateImages fallback. |
| 10. Reorder gate widening | High | One-line widening verified; three apparel-shaped post-gate reads enumerated explicitly (selections-loop, FREETSHIRT block, email subscriber); inherited deleted-source-product fallthrough acknowledged. |
| 11. Error semantics | High | Eight throw cases enumerated with code citations; recovery posture grounded against route ordering at `route.ts:297-353`; partial-failure orphan caveat documented. |
| 12. Idempotency posture | High | Corrected line citation: state guard is `validateEventTransition` via `transitionOrderStatus` at `route.ts:298`, not the permission check at `order-flow.ts:218`. Race window characterized. |
| 13. Adjacent out-of-scope | High | Imperator scope decisions; corrupted-apparel-stamp residual + immutability properties named. |
| 14. Success criteria | High | Direct consequences of §4–§12; cart-add-validated-config assumption noted. |

No Medium or Low confidence sections in iteration 3. All eight CONCERNs and four GAPs from iteration-2 verification have been addressed in this iteration.
