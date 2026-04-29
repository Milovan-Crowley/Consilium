# DIV-74 Evidence Packet - Non-Apparel Proof Detail Rendering

Opened: 2026-04-28

## Verdict

FRONTEND-ONLY - rendering-only.

Backend detail truth is good enough for proof detail. `GET /custom-order/:id` already exposes line-item metadata, product metadata, variant option values, product type, uploads, and flattened metadata. The storefront proof-detail adapter and renderers drop the non-apparel contract before it reaches customer/admin proof detail.

Do not widen this into backend approval or saved-product creation. Non-apparel catalog proof approval is still a separate backend path and remains apparel-shaped.

## Source Surfaces

Backend inspected:

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product`

Storefront inspected per Imperator:

- `/Users/milovan/projects/divinipress-store`

DIV-74 implementation worktree:

- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering`

## Already Handled

Backend PR #33 is real and merged. Live `gh` verification on 2026-04-28 returned:

- PR #33: `MERGED`
- Title: `DIV-99: non-apparel cart-to-order transactional contract`
- Head: `feature/div-99-non-apparel-cart-contract`
- Base: `feature/div-82-importer-hierarchy`
- Merge commit: `f6196b5461af1d0e262f2cd39085ad31a00a799e`

The backend non-apparel metadata contract is explicit: `product_type`, `group_id`, `upload_ids`, `options`, optional `options_labels`, optional `product_name`, and optional `design_notes`. Evidence: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/modules/custom-order/non-apparel-type.ts:14`.

`GET /custom-order/:id` projects the raw material proof detail needs: `order_line_items.product.metadata`, `order_line_items.variant_id`, `order_line_items.variant_option_values`, `order_line_items.variant_title`, `order_line_items.product_type`, and `order_line_items.metadata`. Evidence: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/[id]/route.ts:78`.

The detail endpoint also fetches uploads separately and returns them on the flattened response. Evidence: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/[id]/route.ts:117` and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/[id]/route.ts:217`.

`custom-complete` creates invisible catalog proof `custom_order` rows by grouping line items by `metadata.group_id`, creating custom orders, linking line items, and associating uploads. Evidence: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/custom-complete/route.ts:225`, `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/custom-complete/route.ts:268`, `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/custom-complete/route.ts:294`, and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/custom-complete/route.ts:318`.

Proof files and artwork uploads are already distinct upload types. The frontend proof pages already separate proof files from original artwork. Do not treat missing artwork placements as missing artwork.

Storefront PR #132 is cart-only. Live `gh` verification on 2026-04-28 returned:

- PR #132: `OPEN`
- Base: `develop`
- Head: `feature/div-71-non-apparel-cart-rendering`
- Files: `src/app/cart/_hooks/useCart.ts`, `src/app/cart/page.tsx`

Storefront PR #133 is order-detail only and stacked on #132. Live `gh` verification on 2026-04-28 returned:

- PR #133: `OPEN`
- Base: `feature/div-71-non-apparel-cart-rendering`
- Head: `feature/div-72-non-apparel-order-detail-rendering`
- Files include `src/app/_utils/formatOptionLabel.ts`, `src/app/_utils/formatQuantity.ts`, `src/components/orders/line-item-row.tsx`, and admin order-detail components

PR #133 does not edit proof detail routes, `useCustomOrder`, `getAdminProofBySubId`, the custom-order adapter, or custom-order domain types.

## Definitely Not Handled

Proof detail still flows through `useCustomOrder` -> `useGetAdminProofBySubId` -> `adaptCustomOrder`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/hooks/useCustomOrder.ts:8` and `/Users/milovan/projects/divinipress-store/src/app/_api/custom-order/getAdminProofBySubId.ts:11`.

The proof API type is apparel-shaped. Top-level metadata declares only `selections`, `design_notes`, `upload_ids`, `group_id`, and `product_name`. Line-item metadata lacks `product_type`, `options`, and `options_labels`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_types/admin/proofs/proofBySubId.ts:31` and `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_types/admin/proofs/proofBySubId.ts:63`.

The domain `LineItem` type only preserves `variantOptions` and metadata fields for `brandName`, `styleName`, `productionOptionType`, `selections`, and `designNotes`. It has no `productType`, `productOptions`, or `productOptionsLabels`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/types.ts:104`.

The shared proof adapter still assumes apparel-ish metadata. It maps `metadata.production_option_type`, `metadata.selections`, and `metadata.design_notes`; it does not map `metadata.product_type`, `metadata.options`, or `metadata.options_labels`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/adapter.ts:191` and `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/adapter.ts:223`.

Artwork placement extraction is explicitly apparel-shaped because it parses `metadata.selections[key="artwork"]`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/adapter.ts:287`.

Customer proof detail branches on `lineItem.metadata.productionOptionType !== "apparel"` and renders non-apparel details from `lineItem.variantOptions`, not `metadata.options` or `options_labels`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx:259` and `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx:569`.

Customer proof detail quantity is wrong for catalog proofs. It sums line-item quantity, while backend catalog proof completion normalizes line items to quantity `1`; customer-facing standard print quantity lives in `metadata.options.quantity`. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx:268` and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/custom-complete/route.ts:106`.

Admin proof detail has the same non-apparel rendering problem. It builds `productSpecs` from `variantOptions` and does not use preserved standard metadata options or labels. Evidence: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/admin/proofs/[id]/page.tsx:353` and `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/admin/proofs/[id]/page.tsx:1331`.

Multiplier-only options can disappear because they live in `metadata.options`, not necessarily `variant_option_values`. Any proof-detail fix that renders only variant options is incomplete.

## Backend Changes Needed

No backend change is needed for proof detail rendering if the frontend continues using `GET /custom-order/:id`.

Do not patch `GET /custom-order/proofs` for DIV-74. That route is a thin list projection for proof tables, returning company/requester/order ids, product name, proof type, statuses, and category. It does not return detail metadata, uploads, proof files, product metadata, or variant options, and the current gap is not in that list endpoint. Evidence: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/proofs/route.ts:26` and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/proofs/route.ts:81`.

Caveat: if a future list/table UI asks to show standard print options in the proof list, that is a separate backend projection decision.

## Exact Files For Smallest Slice

Required storefront files in the DIV-74 worktree:

- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_types/admin/proofs/proofBySubId.ts`
- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/types.ts`
- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/_domain/custom-order/adapter.ts`
- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx`
- `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering/src/app/(authenticated)/admin/proofs/[id]/page.tsx`

Conditional if DIV-74 stacks on PR #133:

- Reuse `src/app/_utils/formatOptionLabel.ts`
- Reuse `src/app/_utils/formatQuantity.ts`

Do not independently recreate those helpers on `develop` if the branch is meant to stack on #133; that will create predictable PR collision.

## Smallest Implementation Slice

1. Extend proof API/domain types to preserve non-apparel metadata:

- `product_type`
- `options`
- `options_labels`

2. Extend `adaptLineItems` to map the preserved fields from line-item metadata, with fallback to `order_line_items.product_type` where useful.

3. Render customer proof detail from preserved standard metadata:

- Branch on `productType`, not only `productionOptionType`.
- Display quantity from `productOptions.quantity` for non-apparel catalog proofs.
- Render remaining `productOptions` with `productOptionsLabels` for labels.
- Keep original artwork and proof-file sections unchanged.

4. Render admin proof detail from the same preserved standard metadata:

- Stop building non-apparel specs from `variantOptions` as the primary source.
- Keep the existing admin note, upload, proof-file, production-file, product image, and thumbnail behavior unchanged.

5. Verification:

- Run `npx tsc --noEmit` from the storefront worktree.
- Add or exercise one proof-detail fixture/payload that has `product_type !== "apparel"`, `options.quantity`, `options_labels`, artwork uploads, and proof uploads.

## Non-Goals

- No backend approval or saved-product creation changes.
- No cart submission changes.
- No upload mutation changes.
- No proof-list projection expansion.
- No attempt to close non-apparel saved-product approval under DIV-74.

## Known Trap

Saved-product approval is not solved by proof-detail rendering. The frontend state machine allows `approveProof` for catalog proofs, but backend catalog approval still proceeds into product creation that expects apparel-style selections and color. DIV-74 can make proof detail truthful; it cannot honestly claim non-apparel catalog approval or saved-product creation.

## Confidence Map

High - backend detail endpoint projection is sufficient for proof detail. Evidence: backend route field projection, metadata fallback, and upload fetch cited above.

High - frontend custom-order adapter/domain types drop the non-apparel metadata contract. Evidence: type and adapter lines cited above.

High - both customer and admin proof detail need rendering changes. Evidence: separate page renderers cited above.

High - backend changes are not needed for proof detail. Evidence: Arbiter and Backend Speculator converged on `GET /custom-order/:id` as sufficient.

Medium - option ordering should prefer product metadata when available. The agents flagged this, but the exact current product metadata shape for order-specific display ordering was not fully codified in this packet.

Medium - final implementation branch should probably stack on PR #133 to reuse `formatOptionLabel` and `formatQuantity`; this is based on live PR file lists and collision risk, not a hard functional requirement.
