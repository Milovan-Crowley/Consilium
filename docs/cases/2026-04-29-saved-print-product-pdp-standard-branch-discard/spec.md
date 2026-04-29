# Saved Standard Product PDP Rendering And Carting Spec

## Status
> **Confidence: High** - The Imperator explicitly approved writing the spec after the verified Tribune packet and the DIV-100 recheck. The diagnosis packet is at `cases/2026-04-29-saved-print-product-pdp-standard-branch-discard/diagnosis.md`.

Draft for verification. This spec defines the storefront behavior required to make saved non-apparel products render and add to cart from the saved-product PDP without regressing saved apparel products.

## Estimate-lite
> **Confidence: High** - Based on the verified packet, storefront code inspection, and backend DIV-100 PR #36 evidence.

Intent: make saved print/promo/display products usable from `/products/[handle]` the same way saved apparel products are usable there: view the saved configuration, adjust valid reorder options where the saved product permits it, add the saved product to cart, and continue through the saved-product reorder path.

Effects: the saved PDP must stop treating standard products as "still loading"; it must render the existing standard product shape returned by the product fetcher; it must add saved standard variants with non-apparel metadata; apparel saved products must keep the current apparel behavior.

Terrain: single-repo storefront implementation in `divinipress-store`, stacked on `feature/div-74-non-apparel-proof-detail-rendering` / PR #137. Backend DIV-100 PR #36 defines the saved non-apparel contract and does not require a backend change for this fix.

Forces: storefront Medusa/React Query discipline applies. Backend DIV-100 matters as a current behavior contract, not as an endorsement of its internal route layering. `/store/custom-products`, `/store/carts/:id/line-items-custom`, and `/store/carts/:id/custom-complete` already support the needed shapes, so this storefront fix must rely on those contracts without refactoring backend architecture.

Coordination: no backend march is required unless implementation proves the DIV-100 contract wrong. The storefront branch must not use `integration/non-apparel-products` as its base and must not merge to `develop`.

Control: acceptance is visible in the logged-in browser and guarded by `npx tsc --noEmit`, `git diff --check`, saved standard PDP/cart smoke, and saved apparel PDP regression smoke.

## Problem
> **Confidence: High** - Diagnosis packet field 5 and storefront code both identify the same boundary failure.

The saved-product PDP fetches through the shared custom-product fetcher. That fetcher can return an apparel saved product or a standard non-apparel saved product. The saved PDP currently keeps only the apparel branch, so a valid saved print product returns from the API as `{ type: "standard" }`, gets discarded by the hook, and the page remains on its loading skeleton because `product` is empty.

The failed URL is the authenticated saved-product PDP, for example:

- `/products/brochures-8dd0f4c4`

The same handle already renders through the catalog standard PDP:

- `/catalog/print/brochures-8dd0f4c4`

That proves the product exists, the customer can see it, and the backend can return the standard product shape. The bug is the saved PDP consumer.

## Domain Understanding
> **Confidence: High** - `$CONSILIUM_DOCS/doctrine/domain/products.md` defines saved products as independent Medusa products created through proof approval. DIV-100 PR #36 extends that saved-product model to non-apparel products.

A saved product is a customer-owned Medusa product created from an approved proof. It is not a catalog blank, favorite, wishlist item, or cart item.

For apparel, the saved product is locked to a color and reorders by size. The existing saved apparel PDP skips new artwork upload and posts existing saved-product line items to the cart.

For non-apparel, DIV-100 creates a saved Medusa product with narrowed metadata/options from the approved proof. It remains a real saved product with `metadata.custom_order_id`. Its line-item metadata must use the non-apparel branch, not the apparel `selections` branch.

## Required User Behavior
> **Confidence: High** - Directly follows the Imperator's scope, the verified packet, and DIV-100 contract recheck.

The saved standard PDP must:

1. Render a saved print/promo/display product returned as `{ type: "standard" }`.
2. Show the saved product title/display name, media, configured options, pricing, and add-to-cart action.
3. Add the saved standard product to cart through the non-apparel metadata contract.
4. Preserve saved apparel PDP rendering and add-to-cart behavior.
5. Avoid catalog proof actions on the saved-product PDP.

The saved standard PDP must not:

1. Call the apparel saved-product cart helper for a standard product.
2. Ask the customer to create another saved product from an already saved product.
3. Require a fresh artwork upload to reorder a saved standard product.
4. Complete the cart as a catalog proof.
5. Depend on a backend schema or route change.

## Product Fetch Contract
> **Confidence: High** - Storefront `getProductByHandle` already returns a discriminated `ProductResult`; the diagnosis packet cites the standard branch.

The saved-product hook/page must preserve the product result discriminator from the shared product fetcher:

- `type: "apparel"` means the saved apparel PDP branch owns rendering and cart behavior.
- `type: "standard"` means the saved standard PDP branch owns rendering and cart behavior.
- `type: "unknown"` means the page must show an error or unsupported-state fallback, not an infinite loading skeleton.

Missing `production_option_type` must remain backward-compatible only for products that the fetcher can safely classify as apparel. A saved standard product must have a valid non-apparel `metadata.product_type`. If a product adapts toward the standard branch but lacks a valid non-apparel `product_type`, the saved PDP must render an unsupported/error state and must not expose add-to-cart.

Saved standard products must also carry every required standard option key needed for pricing and carting. That required set includes `quantity` and any other saved base or multiplier option the backend pricing contract expects. If the product cannot provide a valid value or user choice for every required key, the saved PDP must render the product as unsupported for reorder rather than attempting pricing or cart add.

## Saved Apparel Contract
> **Confidence: High** - Current apparel saved-product behavior is live code and must be preserved.

Saved apparel products continue to use the existing apparel branch:

- They initialize the apparel form state only for apparel products.
- They match saved variants by size because color is already baked into the saved product.
- They skip new artwork upload for saved products.
- They post apparel metadata with `selections`, `design_notes`, `upload_ids`, and `group_id`.
- They keep the existing add-to-cart success/failure behavior.

No saved standard product may be passed into apparel-only hooks, apparel form state initialization, or apparel variant matching.

## Saved Standard Cart Contract
> **Confidence: High** - Backend DIV-100 PR #36 defines the discriminator and saved-product validation path. **Confidence: Medium** on saved-product source metadata completeness beyond the verified brochure fixture; the spec therefore requires unsupported/error fallback when required metadata is absent.

Saved standard products must add line items through `/store/carts/:id/line-items-custom` with the non-apparel metadata branch.

The line item must carry:

- `variant_id`: the selected/priced saved standard variant.
- `quantity`: the non-apparel line-item quantity expected by the backend pricing workflow. For existing standard cart behavior this remains `1`; the customer-facing count lives in `metadata.options.quantity`.
- `metadata.product_type`: a non-apparel discriminator such as `print`, `promo`, `display`, or `stickers`.
- `metadata.group_id`: a generated group id for this saved-product reorder group.
- `metadata.upload_ids`: an array. For saved standard reorder from the PDP this should be empty unless the UI explicitly introduces new artwork, which this spec does not.
- `metadata.options`: the complete selected saved standard option set required by pricing. This must include a valid `quantity` value and every other required saved base or multiplier option key.
- `metadata.options_labels`: the product's option labels when available.
- `metadata.product_name`: the saved product display/title when available.
- `metadata.design_notes`: optional notes if the saved standard UI exposes them.

The line item must not carry apparel-only `selections` metadata on the non-apparel branch.

The backend discriminator rejects non-apparel-shaped metadata with `options` or `options_labels` unless `product_type` is valid. The frontend must therefore send `product_type` with every saved standard cart add. The backend pricing workflow also requires the complete option set; missing or malformed quantity, base option, or multiplier option is a hard blocker, not a cosmetic display issue.

## Saved Standard Completion Contract
> **Confidence: High** - DIV-100 PR #36 validates this explicitly. `custom-complete` rejects saved products completed as catalog proofs and auto-approves saved-product reorders completed as order proofs.

The saved standard PDP add-to-cart action does not complete checkout. If the resulting cart is later completed as a saved-product reorder, every storefront completion path must use:

- `proof_type: ORDER`

It must not use:

- `proof_type: CATALOG`

DIV-100 makes this a backend invariant: saved products completed as `CATALOG` are invalid, while saved products completed as `ORDER` create an approved/proof-done custom order with `metadata.original_custom_order_id`.

This applies to both the normal client checkout path and redirect/capture completion paths such as payment flows that return through a local API route before calling backend `custom-complete`.

## Rendering Contract
> **Confidence: Medium** - The exact component composition belongs in the implementation plan, but the observable saved-product behavior is fixed by the product/domain contract.

The saved standard PDP may reuse standard catalog option, pricing, media, and tab display pieces when they preserve saved-product behavior. It must not reuse catalog-only actions, catalog proof dialogs, fresh-artwork validation, or catalog breadcrumbs as-is.

The saved standard PDP must present itself as a My Products detail page, not as a catalog product page. It must not expose `Save & Proof` for an already saved product.

Pricing must follow the existing standard pricing contract. Prices returned by Medusa/backend are displayed as-is, not divided by 100.

The catalog URL for a saved standard handle, such as `/catalog/print/brochures-8dd0f4c4`, is a known residual risk outside this spec. This spec fixes the saved-product PDP at `/products/[handle]`; it does not redesign catalog route access or remove catalog proof actions from catalog pages.

## Branching And Repository Constraints
> **Confidence: High** - These were explicit Imperator constraints.

Implementation must create a new storefront branch stacked on:

- `feature/div-74-non-apparel-proof-detail-rendering`

Implementation must not:

- Base the fix on `integration/non-apparel-products`.
- Merge into `develop`.
- Push or open a PR unless the Imperator explicitly asks.
- Change backend code unless live implementation proves the DIV-100 contract wrong.

The currently observed storefront worktree has an untracked `AGENTS.md`; that file is unrelated and must be left alone.

## Non-goals
> **Confidence: High** - Scope was explicitly constrained to a medium single-repo storefront fix.

This spec does not include:

- Backend route, workflow, or schema changes.
- A catalog PDP redesign.
- Catalog-route saved-product guards for `/catalog/[category]/[productHandle]`.
- A saved-product naming redesign.
- A new proofing flow.
- A broader cart/checkout refactor.
- Support for creating a new saved product from an existing saved product.

## Acceptance Criteria
> **Confidence: High** - Based on the packet verification plan, corrected by live package-script and DIV-100 evidence.

Static checks:

- `npx tsc --noEmit` passes.
- `git diff --check` passes.

Manual browser checks:

- Logged-in `/products/brochures-8dd0f4c4` renders the saved print product instead of staying on skeleton/blank content.
- The saved print product shows its required saved standard options, including `Size`, `Paper`, and `Quantity` for the known brochure fixture.
- Adding the saved print product to cart succeeds.
- `/cart` shows non-apparel metadata/options, not apparel Color/Size assumptions.
- A saved standard product that cannot provide a valid non-apparel `product_type` or complete required option set does not skeleton forever and does not expose add-to-cart; it shows an unsupported/error state.
- Saved apparel product `/products/triblend-tee-77c1-b523` still renders.
- Saved apparel add-to-cart still succeeds.

Checkout smoke when local payment/shipping setup is available:

- Completing a cart that contains the saved standard product uses the saved-product reorder path, `proof_type: ORDER`, through the normal checkout path.
- Redirect/capture completion for a cart that contains the saved standard product also sends `proof_type: ORDER`.
- The resulting custom order is approved/proof-done and references the original custom order.

## Evidence Anchors
> **Confidence: High** - These anchors were checked against current storefront code and backend DIV-100 PR #36.

Storefront:

- `src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` currently preserves only `data.type === "apparel"`.
- `src/app/_api/catalog/getProductByHandle.ts` already returns `{ type: "standard", product }` for non-apparel metadata.
- `src/app/(authenticated)/products/[handle]/page.tsx` currently gates on `!product`, which creates the blank/skeleton saved standard PDP.
- `src/app/_api/catalog/saveAndAddToCart.ts` is apparel-shaped, but already has the saved-apparel precedent of skipping upload and sending `upload_ids: []`.
- `src/app/_api/catalog/standardCartHelpers.ts` owns the non-apparel metadata shape for standard line items.
- `src/app/_api/catalog/standardPricing.ts` rejects missing `options.quantity`; DIV-100 backend pricing also requires the complete standard option set.
- `src/app/_api/cart/placeOrder.ts` sends `proof_type: "order"` on the normal checkout path.
- `src/app/api/capture-payment/[cartId]/route.ts` is a redirect/capture completion path that must also honor the saved-product `ORDER` completion contract.

Backend DIV-100 PR #36:

- `origin/feature/div-100-non-apparel-saved-product-clean` resolves to commit `52472c0`; that is the stable backend DIV-100 evidence anchor.
- `src/api/store/carts/type.ts` routes valid non-apparel metadata by `product_type` and rejects non-apparel-shaped metadata without a valid discriminator.
- `src/api/store/carts/middleware.ts` explicitly skips upload lookup when `upload_ids` is empty.
- `src/api/store/carts/[id]/line-items-custom/route.ts` routes non-apparel line items to the promo/print pricing workflow and validates saved-product cart add ownership.
- `src/api/store/carts/[id]/custom-complete/route.ts` validates saved-product completion, rejects catalog completion for saved products, and stamps saved reorder custom orders as approved/proof-done.
- `integration-tests/http/approve-proof-non-apparel.spec.ts` covers non-apparel saved-product reorder via `proof_type: ORDER`.
