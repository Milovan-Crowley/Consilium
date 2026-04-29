# DIV-100 — Non-apparel saved product creation on approve-proof

**Status:** draft for cold verification
**Linear:** [DIV-100](https://linear.app/divinipress/issue/DIV-100/fix-non-apparel-approve-proof-saved-product-creation-on-import-script)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Backend baseline:** `origin/import-script-promo-print`

This artifact is intentionally standalone. Verify this spec on its own against doctrine and live repo truth. Do not use prior DIV-100 drafts as context unless the Imperator explicitly asks for historical comparison.

---

## 1. Summary

When a non-apparel **catalog proof** is approved, the backend must create a valid, company-owned saved product from the approved line-item configuration.

The saved product is a new Medusa product owned by the buying company. It is not a bookmark, not a cart item, and not a mutation of the original catalog product. It copies the source product's product-level presentation data, retains only the source variants matching the approved locked base choices, preserves quantity as the only customer-selectable base axis after approval, and records the original proof through `metadata.custom_order_id`.

This spec covers saved-product creation only. It does not make non-apparel saved products reorder through `custom-complete`, and it does not change promo-print pricing semantics.

> **Confidence: High** — Doctrine defines saved products as separate products created by catalog proof approval. Live approve-proof is apparel-shaped today and fails non-apparel proofs.

---

## 2. Motivation

The current approve-proof side effect is shaped around apparel. It resolves `Size`, `Color`, and `selectedColor`, filters variants by color, and writes apparel `selections` metadata to variants. Non-apparel products imported through the promo-print importer do not use that option model. Their selectable configuration is stored in line-item `metadata.options`, keyed by option code, and their source product metadata carries `base_option_keys`, `multiplier_keys`, `options_order`, `options_labels`, and `options_values`.

DIV-100 closes only this approval gap: after a customer approves a non-apparel catalog proof, the company should have a saved product representing that approved design/configuration.

> **Confidence: High** — Live code and doctrine agree that catalog proof approval is the saved-product creation point.

---

## 3. Scope

In scope:

- Detect the non-apparel branch during approve-proof.
- Validate the approved line-item option map against the source product.
- Create the saved Medusa product with a non-apparel shape.
- Link the saved product to the buying company.
- Link the saved product to the Webshop sales channel.
- Preserve the existing apparel branch behavior for apparel approvals.

Out of scope:

- `custom-complete` saved-product reorder shortcut.
- Cross-company lineage checks for saved-product reorders.
- Promo-print missing-multiplier-row pricing semantics.
- Backend cart-add enforcement of locked multiplier choices.
- Frontend saved-product PDP rendering changes.
- Refactoring approve-proof saved-product creation into a new workflow.
- Idempotency/race hardening for duplicate approve-proof calls.
- Cache invalidation or cache-key changes for catalog listing visibility.

> **Confidence: High** — This is the narrow creation-only slice requested after the prior artifact became too broad.

---

## 4. Branch Contract

At approve-proof, the source product determines the branch:

```text
sourceProduct.metadata.production_option_type === "apparel" -> existing apparel behavior
otherwise                                                   -> non-apparel saved-product creation
```

The line item may also carry `metadata.production_option_type` from the cart-add bridge, copied from the source product's `product_type` value (e.g. `"apparel"`, `"print"`, `"business_cards"`). The agreement rule between source and line item is **branch-class equality, not literal string equality**: both sides are first reduced to apparel-or-non-apparel, then compared.

```text
sourceBranch    = source.metadata.production_option_type === "apparel" ? "apparel" : "non-apparel"
lineBranch      = lineItem.metadata.production_option_type === "apparel" ? "apparel" : "non-apparel"
agreement       = (lineItem stamp absent) OR (sourceBranch === lineBranch)
```

If the line-item stamp is absent, the source product remains authoritative — older pending proofs or non-standard entry paths may not carry the bridge stamp.

Branch disagreement (after the reduction above) means corrupt state and must fail approval. The non-apparel branch must not fall through to the apparel branch.

> **Confidence: Medium** — Apparel importer stamps `production_option_type: "apparel"` on the source product. Promo-print importer does NOT write `production_option_type` on the source product (verified at `src/_custom/utils/promo-print-product/importer.ts:80-130`); the cart bridge stamps the raw `product_type` string on line items (verified at `src/workflows/pricing/steps/calculate-promo-print-prices.ts:155-158`). Branch-class reduction is required to make agreement well-defined for non-apparel; literal-string equality would reject every valid non-apparel proof whose line item carries the bridge stamp.

---

## 5. Approved Configuration

For non-apparel approvals, the approved configuration comes from the order line item's `metadata.options` map.

The map is keyed by option code, not display label. It must contain every code in the source product's `base_option_keys` and every code in `multiplier_keys`. Every required value must be a non-empty trimmed string.

Every submitted option value must also be declared by the source product:

- For each base option code, `metadata.options[code]` must be present in `sourceProduct.metadata.options_values[code]`.
- For each multiplier option code, `metadata.options[code]` must be present in `sourceProduct.metadata.options_values[code]`.

This approval-time membership check is required even though cart-add validates the normal storefront path. Other entry paths can bypass cart-add, and saved-product creation must not turn an undeclared submitted value into a declared saved-product value.

> **Confidence: High** — `NonApparelMetadataSchema` only proves the map is `Record<string, string>`; creation needs source-product membership validation before writing saved-product metadata.

---

## 6. Source Product Sanity

Before creating a non-apparel saved product, the source product must carry a coherent promo-print metadata contract.

Required fields:

- `base_option_keys`: array of strings.
- `multiplier_keys`: array of strings, possibly empty.
- `options_order`: array of strings.
- `options_labels`: object mapping option code to display label.
- `options_values`: object mapping option code to declared values.
- `multipliers`: object when `multiplier_keys` is non-empty.

Required consistency:

- Every `base_option_keys` code appears in `options_order`.
- Every `multiplier_keys` code appears in `options_order`.
- Every `options_order` code appears in `options_labels`.
- Every `options_order` code appears in `options_values`.
- `quantity` appears in `base_option_keys`.
- Every base option label in `options_labels` corresponds to actual source variant option titles.
- When `multiplier_keys` is non-empty, every multiplier key has a table object in `multipliers`.

If any check fails, approval must fail with a diagnostic. The saved product must not be created.

> **Confidence: High** — Medusa's `createProductVariantsStep` does NOT validate variant option titles against product option titles — it auto-creates a new option entry when a variant supplies an option title the parent product doesn't declare. Stale labels must therefore be caught at approval time, otherwise the saved product silently grows phantom options instead of failing.

---

## 7. Option Classes

Non-apparel option codes fall into three classes:

- **Locked base options:** codes in `base_option_keys` except `quantity`. These are Medusa variant axes and are locked to the approved value.
- **Quantity:** the `quantity` code. This is a Medusa variant axis and remains selectable on the saved product.
- **Locked multiplier options:** codes in `multiplier_keys`. These are metadata-only choices and are locked to the approved value.

The saved product's structure enforces the base-axis lock by retaining only matching variants. The saved product's metadata encodes multiplier locks by narrowing `options_values[multiplierKey]` to the approved value.

The approved `metadata.options.quantity` value is **intentionally not used to lock the saved product's quantity**. Quantity is the only base axis that remains selectable on the saved product — the customer can reorder the same approved design at any retained quantity tier. The original-proof quantity intent lives only on the source custom order; it is not carried onto the saved product as a lock.

This spec does not add backend cart-add rejection for a customer-submitted multiplier value that differs from the saved product's locked value. That enforcement belongs to a separate cart-add lock spec.

> **Confidence: High** — Promo-print importer makes non-multiplier options into Medusa variant axes and keeps multiplier options in metadata.

---

## 8. Variant Retention

Define:

```text
lockedBaseKeys = sourceProduct.metadata.base_option_keys excluding "quantity"
```

Retain source variants whose option values match the approved line-item value for every locked base key.

If `lockedBaseKeys` is empty, retain all source variants. Quantity-only base grids are valid: the saved product locks no base choice and keeps the source quantity tiers.

If no variants are retained, approval must fail with a diagnostic naming the product handle and the locked base values that failed to match.

Quantity values exposed on the saved product must be derived from retained variants only. The ordering should follow `sourceProduct.metadata.options_values.quantity`, filtered down to quantities that actually exist in retained variants. This avoids depending on query result order while still avoiding quantities with no retained variant.

> **Confidence: High** — This removes the previous query-order assumption and supports valid quantity-only source shapes.

---

## 9. Saved Product Shape

The saved product is created as a new Medusa product.

Product-level requirements:

- `title`: use `customOrder.product_name` when present; otherwise use the source product title.
- `handle`: derive a unique handle from the source product handle.
- `description`, `subtitle`, `thumbnail`, `images`, `external_id`, `type_id`, tags, and categories: preserve the source product's values.
- `status`: `published`.
- `metadata.custom_order_id`: the approved custom order id.

Medusa product options:

- Include one Medusa option for every code in `sourceProduct.metadata.base_option_keys`, in `options_order` order.
- Option titles come from `sourceProduct.metadata.options_labels[code]`.
- Locked base options have a single value: the approved value.
- `quantity` has the retained quantity values from Section 8.

Product metadata:

- Preserve source product metadata.
- Add `custom_order_id`.
- Narrow `options_values` as follows:
  - every locked base option becomes `[approvedValue]`;
  - `quantity` becomes the retained quantity values from Section 8;
  - every multiplier option becomes `[approvedValue]`.

All source metadata keys remain unchanged except for the documented `options_values` narrowing and the added `custom_order_id`.

> **Confidence: High** — Source product metadata fields (`options_order`, `options_labels`, `options_styles`, `options_values`, `multipliers`, `base_option_keys`, `multiplier_keys`) are written by the promo-print importer at `src/_custom/utils/promo-print-product/importer.ts:80-130`; preserving them on the saved product maintains contract integrity for downstream readers without leaking importer-only state.

---

## 10. Saved Variant Shape

For each retained source variant, the saved product variant must preserve:

- `title`.
- option value map.
- prices.
- source variant metadata.

Saved variant metadata must add:

- `original_variant_id`.
- `original_sku`.
- `original_upc`.
- `original_title`.
- `design_notes`, when present on the approved line item.

Saved variant creation must not copy source `sku`, `upc`, `barcode`, or `ean` into the saved variant's top-level identity fields. Those Medusa fields are nullable but uniquely indexed (partial unique index `WHERE deleted_at IS NULL`); copying them from the source variant would collide while the source variant remains active. Saved-variant top-level `sku`, `upc`, `barcode`, and `ean` are left unset (null).

Original `sku` and `original_upc` are recorded in saved-variant metadata (above). Source `barcode` and `ean` are intentionally **not** captured in metadata either — they are dropped, matching existing apparel-branch behavior.

Saved non-apparel variants must not carry apparel `selections` metadata.

> **Confidence: High** — Medusa marks `sku`, `upc`, `barcode`, and `ean` unique. Apparel saved-product creation already avoids copying them as top-level variant fields.

---

## 11. Company Ownership And Sales Channel

After creation, the saved product must be owned by the company that owns the approved proof's order.

Required links:

- A CompanyProduct row whose id equals the saved Medusa product id.
- Product to CompanyProduct link.
- Product to Webshop sales-channel link.

`CompanyProduct.price` is required because the column is not nullable. Use the lowest retained variant price after verifying every retained variant has at least one price. If any retained variant has no prices, approval must fail and the saved product must not be created.

`CompanyProduct.price` is a display/sort cache, not the customer-money pricing source for non-apparel cart-add. Money-path promo-print pricing is out of scope for this spec.

> **Confidence: High** — CompanyProduct has a non-null price column; storefront uses it for display/sort, while promo-print money pricing uses the pricing route.

---

## 12. Image Handling

No special non-apparel image behavior is required for saved-product creation.

The saved product copies source product `thumbnail` and `images`. Existing product-image hydration can override saved-product images at read time when product image uploads exist on the custom order. If no such uploads exist, the copied source images remain the response images.

> **Confidence: High** — Image hydration is keyed by `metadata.custom_order_id` and falls back to the product's own thumbnail/images.

---

## 13. Error Semantics

Approval must fail without creating a saved product when:

- Source product and line-item branch signals disagree.
- The line-item options map is absent or malformed.
- A required base or multiplier code is missing or empty.
- A submitted option value is not declared in source `options_values`.
- Required source metadata fields are absent or wrong type.
- Source metadata fields are internally inconsistent.
- Base option labels do not match actual source variant option titles.
- No retained variants match the locked base values.
- Any retained variant has no prices.
- The approved proof's order has no owning company.

Approval failure should leave the `custom_order` row in its prior state so the customer can retry after the underlying issue is corrected. This is row-level preservation, not a transactional rollback of the broader system — partial saved-product side effects are covered by the residual disclosure below.

Known residuals that stay out of this spec:

- Duplicate approve-proof race window.
- Partial orphan risk if product creation succeeds and later linking fails.
- Cache visibility delay in `/store/custom-products`.

> **Confidence: High** — These are creation-time validity checks. The residuals are pre-existing broader workflow concerns.

---

## 14. Success Criteria

1. Approving an apparel proof behaves as it did before this change.
2. Approving a non-apparel catalog proof with a valid source product and valid line-item options creates one published saved product.
3. The saved product is linked to the approving company through CompanyProduct.
4. The saved product is linked to the Webshop sales channel.
5. The saved product carries `metadata.custom_order_id` for the approved custom order.
6. The saved product preserves source product metadata except for the documented `options_values` narrowing.
7. Locked base options are narrowed to the approved value.
8. Multiplier options are narrowed to the approved value.
9. Quantity remains selectable and includes only quantity tiers with retained variants.
10. Saved variants are the retained source variants matching locked base values.
11. Saved variants preserve prices and source metadata.
12. Saved variants store original source identity values in metadata, not top-level `sku`, `upc`, `barcode`, or `ean`.
13. Invalid source metadata or invalid approved option values fail approval before saved-product creation.

> **Confidence: High** — Criteria are limited to saved-product creation and company ownership.

---

## 15. Verification Boundary

Cold verifiers should verify only this creation contract.

Do not treat these as DIV-100 gaps unless this artifact makes a claim about them:

- non-apparel saved-product reorder through `custom-complete`;
- cross-company lineage on reorder;
- promo-print missing multiplier row semantics;
- backend cart-add lock enforcement;
- frontend rendering of the saved product PDP;
- cache invalidation for immediate catalog listing visibility;
- workflow refactor/idempotency hardening.

> **Confidence: High** — This section exists to keep verification on the intended first slice.

---

## 16. Confidence Map

- Sections 1-2: High. Doctrine and live code identify the saved-product approval gap (verified against `src/api/custom-order/order-flow.ts:221-445`, which is apparel-shaped end-to-end and has no non-apparel branch).
- Sections 3 and 15: High. Scope is intentionally narrowed to creation only.
- Section 4: Medium. The branch-class agreement rule (and the fact that promo-print importer never writes `production_option_type` on the source product) is derived from importer + cart-bridge code reads, not from an explicit Imperator directive. Literal-string equality would have rejected every valid non-apparel proof.
- Section 5: High. `NonApparelMetadataSchema` only proves `Record<string, string>`; `options_values` membership at approval time is necessary because non-cart entry paths can bypass the schema.
- Section 6: High. Stale-label detection is required because Medusa's `createProductVariantsStep` auto-creates missing options instead of validating; without the check, a saved product silently grows phantom options.
- Sections 7-8: High. Quantity stays selectable by design; the lock contract is enforced through variant retention plus metadata narrowing.
- Section 9: High on Medusa product field shape and metadata narrowing rules. Confidence prose now grounds the metadata contract in the importer's writes (`src/_custom/utils/promo-print-product/importer.ts:80-130`) rather than the storefront adapter (which is out of scope per Section 15).
- Section 10: High. `sku`, `upc`, `barcode`, `ean` carry partial unique indexes (`WHERE deleted_at IS NULL`) on the Medusa product variant model. `barcode`/`ean` are intentionally dropped in metadata as well, matching apparel-branch behavior.
- Section 11: High. `CompanyProduct.price` column is non-null (`src/modules/company/models/product.ts:8`); the lowest-retained-variant-price policy matches apparel-branch precedent.
- Section 12: High. `hydrateImages` keys on `metadata.custom_order_id` and falls back to product-record images (verified at `src/modules/custom-order/service.ts:16-76`).
- Sections 13-14: High. Failure conditions and success criteria are observable creation outcomes.
