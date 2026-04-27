# DIV-100 — Non-apparel saved product creation on approve-proof

**Status:** draft (pending verification)
**Linear:** [DIV-100](https://linear.app/divinipress/issue/DIV-100/fix-non-apparel-approve-proof-saved-product-creation-on-import-script)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Stacked above:** PR 29 (`feature/div-82-importer-hierarchy`) → merged PR 33 (`feature/div-99-non-apparel-cart-contract`)
**Backend baseline (per Linear):** `origin/import-script-promo-print`

---

## 1. Summary

Branch `[EVENT.approveProof]` in `src/api/custom-order/order-flow.ts` so non-apparel proofs create saved products keyed off the approved option configuration (the line-item `metadata.options` map) instead of the apparel-only `Size` / `Color` / `selectedColor` path. The non-apparel saved product retains exactly one variant — the variant matching the approved configuration — and preserves the source product's metadata contract (`product_type`, `options_order`, `options_labels`, `options_styles`, `options_values`, `base_option_keys`, `multiplier_keys`, `multipliers`, `tabs`, `production_time`, `short_description`) so it remains readable by the storefront standard adapter and pricable by the promo-print pricing route.

> **Confidence: High** — Imperator confirmed the variant-retention model in deliberation; the rest derives from confirmed codebase facts (importer metadata writes, pricing-route variant-identity contract, standard-adapter discriminator).

---

## 2. Motivation

Today, `[EVENT.approveProof]` is unconditionally apparel-shaped:

- builds `sizeOptions` from `option.title === "Size"` only
- resolves `selectedColor` from `selectionsMetadata.selections[].key === "color"` (or a fallback variant Color value), throwing if absent
- `query.graph`-filters variants by `options.value: selectedColor`
- creates the saved product with `options: sizeOptions` (Color dropped)
- writes `selections` and `design_notes` into variant metadata

Approving any non-apparel proof (Print & Promo per DIV-82's importer hierarchy, DIV-99's non-apparel cart contract) currently throws on the `selectedColor` resolution or, if it gets past that, produces a saved product whose option/variant shape contradicts the storefront standard adapter (`getProductByHandle.ts` discriminates on `metadata.production_option_type !== "apparel"` and reads `options_order` / `options_labels` / `options_values`) and the promo-print pricing route (`pricing/promo-print/route.ts` matches variants by `optionsLabels[code]` × line-item `options[code]` and re-prices via `metadata.multipliers`).

DIV-99 closed the cart contract for non-apparel; DIV-100 closes the corresponding approve-proof contract.

> **Confidence: High** — symptom and code paths match KG-NON-APPAREL-OPTIONS (`$CONSILIUM_DOCS/doctrine/known-gaps.md`), the Linear ticket's cited line numbers, and the Phase-18 integration handoff doc (`divinipress-store/docs/phase-18-integration-handoff.md` lines 47-70).

---

## 3. Non-goals

- **Frontend `useSavedProduct` hook** (`divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts:23`): hard-filters `data?.type === "apparel"`, so even after this fix `/products/[handle]` will not render non-apparel saved products. Frontend retrofit is its own ticket.
- **Workflow refactor of `[EVENT.approveProof]`**: the existing apparel side-effect calls `companyModuleService.createCompanyProducts` directly and runs two `link.create` calls outside any workflow boundary. That pre-existing pattern is preserved here for symmetry; lifting saved-product creation into a workflow with proper compensation is a separate ticket.
- **Multipliers display retrofit on the saved product PDP**: out of scope.
- **`production_option_type` enum extension** (`src/_custom/config/product_options.ts`): keep the enum apparel-only. The discriminator at the cut point is "is the source product apparel?" — non-apparel products do not need a positive enum value at this layer.
- **Apparel saved-product behavior**: untouched. This change adds a branch; it does not modify the apparel arm.

> **Confidence: High** — Imperator confirmed scope in deliberation.

---

## 4. Branch discriminator (boundary contract)

At the top of the `[EVENT.approveProof]` side-effect, after the source product is fetched, branch on:

```
sourceProduct.metadata.production_option_type === "apparel"  → existing apparel arm (unchanged)
otherwise                                                    → new non-apparel arm
```

Rationale and equivalence with the storefront predicate (`getProductByHandle.ts:112`): apparel imports stamp `production_option_type: "apparel"` (`src/scripts/seed-apparel.ts:1107-1116`); the promo-print importer (`src/_custom/utils/promo-print-product/importer.ts:79-128`) does not stamp this field. Absence is the non-apparel signal.

**Cross-check (must be performed and must hard-fail on disagreement):** the order line item carries `metadata.production_option_type` (bridged at line-item creation by DIV-99: `src/workflows/pricing/steps/calculate-promo-print-prices.ts:154-158` writes `production_option_type: item.metadata.product_type`). The non-apparel arm reads the line item's metadata and asserts:

- line-item `metadata.production_option_type !== "apparel"` (must agree with source-product signal)
- line-item `metadata.product_type` is a non-empty string

If the source product says non-apparel but the line item says apparel (or vice versa), throw — this is corrupt state, not a recoverable condition.

> **Confidence: High** — discriminator confirmed reliable by reconnaissance (apparel importer evidence + storefront predicate parity).

---

## 5. Approved-configuration source of truth (boundary contract)

For non-apparel approvals, the source of truth for "what was approved" is the **order line item's `metadata.options` map** — `Record<string, string>` keyed by option code (e.g. `{size: "4x6", paper: "14 Pt Gloss", sides: "Single"}`). This is what `NonApparelMetadataSchema` defines (`src/modules/custom-order/non-apparel-type.ts:14-28`) and what DIV-99's cart contract validates and persists.

The non-apparel arm MUST NOT read `selectionsMetadata.selections`, MUST NOT resolve a `selectedColor`, and MUST NOT consult the source-product's `Size` / `Color` Medusa options. Those are apparel-domain concepts and have no non-apparel equivalent.

> **Confidence: High** — confirmed against `NonApparelMetadataSchema` and DIV-99's `calculate-promo-print-prices.ts`.

---

## 6. Variant retention (boundary contract)

The saved non-apparel product retains exactly **one variant**: the source-product variant whose `options[].option.title` and `options[].value` match the line-item's `options` map under the source product's `metadata.options_labels` mapping.

**Variant identity (matching contract):**

For each entry `(code, value)` in line-item `metadata.options`:

1. Resolve the option's title via `sourceProduct.metadata.options_labels[code]`. If absent, fall back to `code` itself.
2. Find the source variant whose `options` array contains an entry with `option.title === resolvedTitle` and `value === value`.
3. The matching variant must satisfy this for **every** entry in `metadata.options`.

If exactly one variant matches → use it. If zero or more-than-one match → throw with a diagnostic message identifying the product handle, the approved options map, and the option/value pairs that failed to resolve. (More-than-one indicates duplicate variants in the source product, which is itself a corrupt state.)

This matching contract is the same one the promo-print pricing route uses (`src/workflows/pricing/utils/calculate-promo-print-price.ts:55-62`), so identifying the right variant for the saved product cannot drift from identifying the right variant for pricing.

> **Confidence: High** — Imperator confirmed locked-down variant retention; matching contract derives directly from the pricing-route code.

---

## 7. Saved-product Medusa shape (boundary contract)

The saved non-apparel product is created via `createProductsWorkflow` (same workflow apparel uses) with:

**Product-level fields (copied from source):** `title` (overridden by `customOrder.product_name` if set, mirroring apparel), handle (must be unique across Medusa products — match apparel's existing uniqueness strategy), `description`, `subtitle`, `thumbnail`, `images`, `external_id`, `type_id`, `tag_ids`, `category_ids`. Same as apparel.

**Product `options`:** rebuilt from the **retained variant's option values**, one option per entry in line-item `metadata.options`, each with a single-value `values` array — e.g. `[{title: "Size", values: ["4x6"]}, {title: "Paper", values: ["14 Pt Gloss"]}, {title: "Sides", values: ["Single"]}]`. Option titles are resolved via the same `options_labels[code] ?? code` mapping used in §6. Order of options follows `sourceProduct.metadata.options_order`.

**Product `metadata`:** spread of source `product.metadata` plus `custom_order_id: customOrder.id`. This must round-trip: `product_type`, `options_order`, `options_labels`, `options_styles`, `options_values`, `base_option_keys`, `multiplier_keys`, `multipliers`, `short_description`, `tabs`, `production_time`, plus any other keys the importer writes. The non-apparel arm MUST NOT mutate or strip these keys; they are the standard adapter's and pricing route's input contract.

**Variants:** exactly one variant, derived from the matched source variant. Carries:

- `title` — same as source variant.
- `sku` / `upc` / `barcode` / `ean` — same as source variant.
- `options` — the same `{title: value}` map the matched source variant exposes (single value per option, matching the rebuilt product `options` above).
- `prices` — same as source variant (preserves the variant's `calculated_price` shape so the pricing route can read `calculated_amount`).
- `metadata` — spread of source variant `metadata` plus:
    - `original_variant_id`: source variant id
    - `original_sku`: source variant `sku`
    - `original_upc`: source variant `upc`
    - `original_title`: source product title
    - `design_notes`: line-item `metadata.design_notes` (if present)

The non-apparel variant metadata MUST NOT include `selections` (apparel-only). The approved configuration is already encoded in the variant's actual `options` and is unambiguous.

> **Confidence: High** — derived from the apparel reference at `order-flow.ts:280-410`, the standard adapter contract at `getProductByHandle.ts:32-110`, and the pricing-route variant-match contract at `calculate-promo-print-price.ts:55-95`. The inclusion-list mirrors apparel's variant-metadata stamps, with `selections` removed and `design_notes` made conditional.

---

## 8. CompanyProduct + sales-channel linking (boundary contract)

Same as apparel. After `createProductsWorkflow` returns:

1. `companyModuleService.createCompanyProducts({ id: savedProduct.id, company_id: companyId, price: <number> })`. The `price` field is a NOT NULL float column (`src/modules/company/migrations/Migration20260104075004.ts:25`) used today only as a write-only display/sort cache (no money-path consumer reads it). For non-apparel: write the retained variant's `calculated_price.calculated_amount` if available; otherwise write `0`. Real money on non-apparel comes from `pricing/promo-print/route.ts`; this field is not authoritative.
2. `link.create({ [Modules.PRODUCT]: { product_id }, [COMPANY_MODULE.linkable.companyProduct]: { company_product_id } })`.
3. `link.create({ [Modules.PRODUCT]: { product_id }, [Modules.SALES_CHANNEL]: { sales_channel_id: <Webshop> } })`.

> **Confidence: High** — display/sort-cache semantics confirmed by reconnaissance (no reader treats `CompanyProduct.price` as money authority).

---

## 9. Image handling (boundary contract — no work required)

`hydrateImages()` in `src/modules/custom-order/service.ts:39-72` filters uploads by `type === PRODUCT_IMAGE || PRODUCT_THUMBNAIL`. Non-apparel proofs do not capture `product_thumbnail` / `product_image` uploads (`NonApparelMetadataSchema` carries only `upload_ids` for design files). With no overrides, the existing fallback chain returns the source product's `thumbnail` and `images`, which the saved non-apparel product copied at creation. No additional work is required.

> **Confidence: High** — confirmed by reconnaissance.

---

## 10. Error semantics (boundary contract)

The non-apparel arm throws — does NOT silently fall back to the apparel arm — when:

1. **Discriminator disagreement.** Source product says non-apparel but line-item says apparel, or vice versa. (See §4.)
2. **Missing options map.** Line-item `metadata.options` is absent, empty, or not a `Record<string, string>`. (Schema-level guarantee from DIV-99, but defense in depth.)
3. **Variant match failure.** Zero or multiple source-product variants match the approved options map under the §6 matching contract.
4. **Missing Webshop sales channel.** Same fail-mode as apparel — preserved.

Throws are loud (regular `Error` with diagnostic message including custom_order id, product handle, and the offending field/value). They are NOT swallowed by the side-effect; the existing event-handler error-propagation behavior is preserved.

> **Confidence: Medium** — error semantics for the non-apparel arm derive by analogy with the apparel arm's existing throws (e.g. apparel currently throws on missing `selectedColor`). The Imperator may want a softer fallback for case 2 (e.g. log + skip instead of throw); flagging.

---

## 11. Order-flow scope and event idempotency

This change is scoped strictly to the `[EVENT.approveProof]` side-effect. No other order-flow events change. The non-apparel arm preserves the apparel arm's idempotency posture: if `[EVENT.approveProof]` fires twice for the same custom order, the second invocation will create a second saved product (matching apparel's existing behavior). Idempotency hardening is out of scope.

> **Confidence: High** — Imperator confirmed scope; the deviation-as-improvement rule does not apply here because adding idempotency would change apparel behavior too.

---

## 12. Out-of-scope but adjacent (acknowledged)

- `production_option_type` is not stamped on imported promo-print products today. The discriminator works because apparel-presence is positive and non-apparel-absence is the implicit case. If a future ticket needs a positive non-apparel signal at the source-product level, that's a separate change in the importer.
- `useSavedProduct.ts:23` is the frontend gate. After this backend change, a non-apparel saved product exists, is pricable, and is owned by the company — but `/products/[handle]` will not render it. Tracked as the Phase-18 "saved mode for non-apparel deferred" line.
- A workflow refactor of `[EVENT.approveProof]` (apparel + non-apparel) with proper compensation steps would address the existing orphan-on-partial-failure risk. Out of scope here; tracked separately.

> **Confidence: High** — explicit Imperator scope decision.

---

## 13. Success criteria (observable outcomes)

1. Approving a non-apparel proof (any product imported by the promo-print importer) succeeds end-to-end: a saved Medusa product is created and linked to the company.
2. The saved product is read by the storefront standard adapter (`adaptToStandardProduct`) without falling back to apparel and without returning null.
3. `POST /api/pricing/promo-print` against the saved product's handle, with the original approved options + a multiplier (quantity), returns a successful price using the same multiplier-table the source product carried.
4. Approving an apparel proof produces byte-identical product/variant/metadata output as before this change (regression check on apparel arm).
5. Approving a non-apparel proof whose line-item `options` map references options not present on the source product throws with a diagnostic message naming the offending option (does NOT silently produce a corrupt saved product).
6. The saved product's `metadata` round-trips every key present on `sourceProduct.metadata` and adds `custom_order_id`. No source-metadata keys are dropped.
7. The saved product's single variant carries `original_variant_id`, `original_sku`, `original_upc`, `original_title`, and (if present) `design_notes` in its metadata.
8. The saved product appears in the company's catalog (CompanyProduct row exists; product linked to the Webshop sales channel).

> **Confidence: High** — these are direct observable consequences of §4–§9.

---

## 14. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Imperator-confirmed variant retention; rest from recon. |
| 2. Motivation | High | KG-NON-APPAREL-OPTIONS + Linear cite + Phase-18 doc. |
| 3. Non-goals | High | Imperator-confirmed scope. |
| 4. Branch discriminator | High | `seed-apparel.ts:1107-1116` + `getProductByHandle.ts:112` parity. |
| 5. Approved-config source | High | `NonApparelMetadataSchema` + DIV-99 stamp at `calculate-promo-print-prices.ts:154-158`. |
| 6. Variant retention | High | Imperator-confirmed; matches `calculate-promo-print-price.ts:55-62`. |
| 7. Saved-product shape | High | Apparel reference + adapter contract + pricing-route contract. |
| 8. CompanyProduct + link | High | `Migration20260104075004.ts:25` + display-cache reader audit. |
| 9. Image handling | High | `hydrateImages` fallback chain. |
| 10. Error semantics | **Medium** | Apparel-by-analogy; case 2 (missing options) softness is open. |
| 11. Idempotency posture | High | Imperator scope decision; preserves apparel parity. |
| 12. Adjacent out-of-scope | High | Imperator scope decision. |
| 13. Success criteria | High | Direct consequence of §4–§9. |

---

## 15. Open question for the Imperator

**§10, case 2** (missing/empty `options` map on a non-apparel line item): hard throw, or log + skip the saved-product creation? Default in this spec is **hard throw** — symmetric with apparel's existing throws — but the case is recoverable (the proof is approved; only the saved-product side effect fails). If the Imperator prefers a softer log-and-skip, this is the one place to flag it before the plan codifies behavior.
