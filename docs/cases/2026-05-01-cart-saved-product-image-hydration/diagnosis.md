# 2026-05-01-cart-saved-product-image-hydration - Diagnosis

## 1. Symptom

The cart page shows a saved printed product with the main/catalog product image instead of the product image uploaded during proofing. The same saved product image shows correctly on the saved PDP and in the My Products table.

## 2. Reproduction

User-observed flow: add a saved printed product, whose uploaded proof/product image displays correctly on the saved PDP and My Products table, to the cart; `/cart` renders the main product image instead.

Code-path reproduction from current checkout:

1. Saved PDP fetches `/store/custom-products?handle=...` and computes images from the hydrated saved product.
2. My Products fetches `/company/my-products` and renders `product.thumbnail` from that hydrated response.
3. Cart fetches `/company/cart`, groups cart line items, and computes `group.image` from `firstItem.thumbnail` / `firstItem.variant.metadata.images`.
4. `useHydratedProductImage` exists but is not called by the cart path.

No authenticated browser reproduction was run in this investigation; the diagnosis is code-trace based plus the user's live observation.

## 3. Affected Lane

`cross-repo`

The customer-visible symptom is in `divinipress-store`, but the image contract differs between backend endpoints: `/store/custom-products` and `/company/my-products` hydrate saved-product images, while `/company/cart` returns unhydrated cart line-item image fields.

## 4. Files/Routes Inspected

- `/Users/milovan/projects/divinipress-store/src/app/cart/_hooks/useCart.ts` - cart grouping and image source selection.
- `/Users/milovan/projects/divinipress-store/src/app/cart/page.tsx` - renders `group.image`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/cart/getCart.ts` - cart fetches `/company/cart`.
- `/Users/milovan/projects/divinipress-store/src/app/_hooks/useHydratedProductImage.ts` - existing saved-product image hydration hook.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` - saved PDP image path.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useProductMedia.ts` - saved mode thumbnail/image priority.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts` - saved PDP fetches `/store/custom-products`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts` - My Products fetches `/company/my-products`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/admin-products-view.tsx` - My Products table renders `product.thumbnail`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/staff-products-view.tsx` - My Products card renders `product.thumbnail`.
- `/Users/milovan/projects/divinipress-backend/src/modules/custom-order/service.ts` - `hydrateImages` overlays `product_thumbnail` and `product_image` uploads onto products.
- `/Users/milovan/projects/divinipress-backend/src/api/store/custom-products/route.ts` - custom product endpoint calls `hydrateImages`.
- `/Users/milovan/projects/divinipress-backend/src/api/company/my-products/route.ts` - My Products endpoint calls `hydrateImages`.
- `/Users/milovan/projects/divinipress-backend/src/api/company/cart/route.ts` - cart endpoint returns line item image fields without hydration.
- `/Users/milovan/projects/divinipress-backend/src/api/custom-order/order-flow.ts` - saved product creation copies the source product thumbnail/images and stores `custom_order_id`.
- `/Users/milovan/projects/divinipress-backend/src/api/custom-order/[id]/upload/route.ts` - proofing product images/thumbnails are stored as custom order uploads.
- `/Users/milovan/projects/divinipress-backend/src/api/store/carts/[id]/line-items-custom/route.ts` - custom add-to-cart path preserves line-item metadata.

## 5. Failing Boundary

The failing boundary is `/company/cart` -> `useCart` image display.

The uploaded proof/product image is not the raw Medusa cart line-item thumbnail. It is stored as a `custom_order_upload` and is overlaid onto saved products only by `customOrderModuleService.hydrateImages`. The cart endpoint does not perform that overlay, and the cart UI consumes only the unhydrated cart line-item/variant image fields.

## 6. Root-Cause Hypothesis

Saved product creation preserves the original/source product media on the Medusa product, while the uploaded proofing image lives as a custom-order upload (`product_thumbnail` / `product_image`). Saved PDP and My Products look correct because their backend endpoints call `hydrateImages`, replacing `product.thumbnail`/`product.images` with those uploads. The cart looks wrong because `/company/cart` returns `items.thumbnail` and `items.variant.metadata.images` without hydration, and `useCart` turns those fields directly into `group.image`. Therefore the cart falls back to the source product's catalog/main image.

## 7. Supporting Evidence

- `/Users/milovan/projects/divinipress-backend/src/modules/custom-order/service.ts:17-24` - `hydrateImages` identifies saved products by `product.metadata.custom_order_id`.
- `/Users/milovan/projects/divinipress-backend/src/modules/custom-order/service.ts:53-72` - `hydrateImages` replaces product `thumbnail` with the `PRODUCT_THUMBNAIL` upload and `images` with `PRODUCT_IMAGE` uploads.
- `/Users/milovan/projects/divinipress-backend/src/api/store/custom-products/route.ts:227-231` - `/store/custom-products` calls `hydrateImages` before returning products.
- `/Users/milovan/projects/divinipress-backend/src/api/company/my-products/route.ts:55-73` - `/company/my-products` queries product metadata and calls `hydrateImages`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts:107-109` - saved PDP fetches `/store/custom-products`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useProductMedia.ts:48-71` - saved mode prioritizes the hydrated product thumbnail/images before variant metadata images.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts:12-20` - My Products fetches `/company/my-products`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/admin-products-view.tsx:393-399` - My Products table renders `generateImageUrl(product.thumbnail, ...)`.
- `/Users/milovan/projects/divinipress-backend/src/api/company/cart/route.ts:56-191` - `/company/cart` fields include `items.thumbnail` and variant metadata, but do not call `hydrateImages` before `res.json`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/cart/getCart.ts:6-15` - cart fetches `/company/cart`.
- `/Users/milovan/projects/divinipress-store/src/app/cart/_hooks/useCart.ts:187-199` - cart image source is `firstItem.thumbnail` or `variantImages[0]`, then `generateImageUrl`.
- `/Users/milovan/projects/divinipress-store/src/app/cart/_hooks/useCart.ts:192-195` - inline note already states cart line items come from an endpoint that does not call `hydrateImages`.
- `/Users/milovan/projects/divinipress-store/src/app/_hooks/useHydratedProductImage.ts:10-16` - hook is intended for cart/order saved-product images.
- `rg -n "useHydratedProductImage" src` in `divinipress-store` - only references are the hook definition and comments; no cart component uses it.
- `/Users/milovan/projects/divinipress-backend/src/api/custom-order/order-flow.ts:361-371` - saved product creation copies `thumbnail: product.thumbnail` and `images: product.images` from the source product.
- `/Users/milovan/projects/divinipress-backend/src/api/custom-order/order-flow.ts:409-412` - saved product metadata receives `custom_order_id`.
- `/Users/milovan/projects/divinipress-backend/src/api/custom-order/[id]/upload/route.ts:61-80` - product thumbnails/images uploaded during proofing are stored as custom-order upload records.

## 8. Contrary Evidence

- The uploaded image is not missing globally: user observed it on saved PDP and My Products, and those paths are backed by endpoints that hydrate custom-order uploads.
- `/company/cart` includes `items.variant.metadata`, so catalog products can still show a variant/main image. This explains why the cart has an image instead of a blank placeholder, but it is the wrong source for saved proof images.
- `useHydratedProductImage` exists and claims cart as a use case, but live search shows it is not wired into cart. This is contrary to the comment's stated intent, not contrary to the root cause.

## 9. Known Gap Considered

`KG-NON-APPAREL-OPTIONS` / Relevant because it flags non-apparel cart adapter and saved-mode contract gaps / Live recheck performed: yes / Result: current evidence localizes this bug to saved-product image hydration, not option-label metadata loss / Used as evidence: no.

Other cross-repo known gaps in `known-gaps.md` did not match the image-hydration symptom.

## 10. Proposed Fix Site

Recommended first fix site:

`/Users/milovan/projects/divinipress-backend/src/api/company/cart/route.ts:56-191`

Hydrate saved-product image data in `/company/cart` before returning the cart, so the existing cart UI receives the corrected saved-product thumbnail through the `items.thumbnail` path it already renders.

If the team chooses the existing frontend hook route instead, the fix becomes cross-repo: add `items.product.metadata` to `/company/cart`, return product id/custom order id/fallback image from `/Users/milovan/projects/divinipress-store/src/app/cart/_hooks/useCart.ts:187-199`, and render a small cart item image component from `/Users/milovan/projects/divinipress-store/src/app/cart/page.tsx:444-498` that calls `useHydratedProductImage`.

## 11. Fix Threshold

`medium`

Reason: the visible cart image behavior changes on an order/checkout-adjacent path. Backend-only can likely keep the code small, but the blast radius is customer-facing cart display, so this should not be treated as a casual small patch.

## 12. Verification Plan

Backend-first verification:

1. Add or extend an HTTP integration test under `/Users/milovan/projects/divinipress-backend/integration-tests/http/` that creates a saved product with `metadata.custom_order_id`, associates a `product_thumbnail` upload URL with that custom order, adds the saved product variant to a cart, calls `GET /company/cart`, and asserts `cart.items[0].thumbnail` equals the uploaded product thumbnail URL rather than the source product thumbnail or variant metadata image.
2. Run `yarn test:integration:http --runTestsByPath integration-tests/http/<chosen-spec>.spec.ts` if Jest accepts the narrowed path in this repo; otherwise run `yarn test:integration:http`.
3. Run `yarn build` in `/Users/milovan/projects/divinipress-backend`.

Storefront verification if any frontend files change:

1. Run `yarn typecheck` if available in the active storefront branch; current `package.json` scripts in this checkout do not list it.
2. Run `yarn lint`.
3. Manual check: add the same saved printed product to cart and confirm `/cart` shows the uploaded product thumbnail while catalog products still show their variant/main image.

No exact existing cart image regression test was found during this investigation.

## 13. Open Uncertainty

- I did not capture a live `/company/cart` JSON response from the affected account, so the diagnosis is not independently reproduced against the user's exact cart row.
- The cleanest implementation choice is still a product decision: backend-normalize cart item thumbnails once, or use the existing frontend hydration hook and accept a small extra fetch per saved cart group.
- Order detail and admin order detail have similar comments about saved-product image hydration, so the same underlying gap may exist after checkout even though the user only reported `/cart`.

## 14. Contract Compatibility Evidence

`backward-compatible` - the recommended backend fix can preserve the existing `/company/cart` response shape and only correct the value of an existing optional field (`items.thumbnail`) for saved products. If adding `items.product.metadata` is needed internally or exposed in the response, that is additive. Existing consumers that already read `items.thumbnail` continue to work; they receive a better saved-product image.
