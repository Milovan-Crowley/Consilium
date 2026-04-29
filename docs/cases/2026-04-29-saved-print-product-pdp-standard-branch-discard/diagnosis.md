# Saved Print Product PDP Standard Branch Discard

## 1. Symptom

Authenticated storefront saved-product detail page `/products/brochures-8dd0f4c4` does not load for a print saved product. The Next dev server records the route request as HTTP 200, so the observable failure is client rendering/loading behavior, not a server-render 500.

## 2. Reproduction

1. Open `http://localhost:3000/products/brochures-8dd0f4c4` in the logged-in browser.
2. The page keeps the authenticated shell visible but never renders the product title/options.
3. Frontend dev server logged `GET /products/brochures-8dd0f4c4 200`.
4. In the same logged-in browser tab, `http://localhost:3000/catalog/print/brochures-8dd0f4c4` renders `New brochure`, standard options, pricing, `Add to Cart`, and `Save & Proof`.
5. Returning to `http://localhost:3000/products/brochures-8dd0f4c4` leaves the saved PDP blank/skeleton; `New brochure` is not visible after a targeted wait.

Direct unauthenticated `/store/custom-products` probing returned 401, as expected for the protected local route, so the runtime proof uses the authenticated browser and DB/source evidence rather than scraped auth tokens.

## 3. Affected Lane

`cross-repo` — the storefront saved-product page consumes a backend-created saved Medusa product.

## 4. Files And Routes Inspected

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx` — saved-product PDP hook consumption, loading gate, apparel/non-apparel branch, and saved non-apparel cart handler.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` — saved PDP adapter hook.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts` — custom-products fetch and `apparel` vs `standard` classification.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/page.tsx` — catalog PDP dispatcher that already renders `standard` products.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/saveAndAddToCart.ts` — apparel-shaped cart helper used by saved PDP.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardCartHelpers.ts` — standard non-apparel cart helper used by catalog PDP.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/store/custom-products/route.ts` — product allowlist and custom product retrieval path.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/store/custom-products/middleware.ts` — status and sales-channel filters.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/_utils/cache.ts` — custom-products allowlist cache TTL.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/_custom/utils/promo-print-product/importer.ts` — promo-print source product metadata shape.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/custom-order/_utils/non-apparel-saved-product.ts` — saved-product payload builder.
- Local backend DB for product handle `brochures-8dd0f4c4`, logged-in customer company mapping, company-product link, and sales-channel link.

## 5. Failing Boundary

Frontend saved-product detail hook/component boundary. `getProductByHandle` can classify the saved print product as `{ type: "standard", product }`, but `useSavedProduct` keeps only `data.type === "apparel"`. The saved PDP then gates on `!product` and never reaches its render branch.

## 6. Root-Cause Hypothesis

The backend non-apparel saved-product branch is now producing real published print saved products, but the storefront saved-product PDP is still apparel-shaped. It reuses the catalog product fetcher that supports `standard` non-apparel products, then discards that branch and continues through apparel-only state/cart assumptions. This matches the prior DIV-100 phase boundary where frontend saved-product PDP work was explicitly deferred.

## 7. Supporting Evidence

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts:21-24` — fetches `ProductResult`, then sets `product` only when `data.type === "apparel"`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx:613-615` — returns the loading skeleton when `!product`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts:110-116` — non-apparel metadata adapts to `IStandardProduct` and returns `{ type: "standard", product }`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/page.tsx:984-999` — catalog PDP dispatches `data.type === "standard"` to `StandardPDP`.
- Authenticated browser proof — same logged-in customer tab renders `/catalog/print/brochures-8dd0f4c4` with `Divini Church`, `milovan+customer@divinipress.com`, breadcrumb `Catalog > Print > New brochure`, heading `New brochure`, `Size`, `Paper`, `Quantity`, `$143.01`, `Add to Cart`, and `Save & Proof`.
- Authenticated browser proof — returning to `/products/brochures-8dd0f4c4`, `New brochure` is not visible after a targeted wait; authenticated shell remains visible.
- Local DB product proof — `prod_01KQDFYXHDFE4T4733EHJTB4PN`, title `New brochure`, handle `brochures-8dd0f4c4`, status `published`, metadata includes `product_type: "print"`, `options_order`, `options_values`, and no `production_option_type: "apparel"`.
- Local DB visibility proof — logged-in browser email `milovan+customer@divinipress.com` maps to company `Divini Church`; target product has a company-product link to that company.
- Local DB sales-channel proof — target product sales channel and publishable key sales channel both include `sc_01KEBQ1W52R8XGW695ECT4B6QQ`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/_custom/utils/promo-print-product/importer.ts:80-110` — importer writes non-apparel `product_type`, `options_order`, `options_labels`, `options_values`, `base_option_keys`, and `multiplier_keys`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/custom-order/_utils/non-apparel-saved-product.ts:317-368` — saved-product builder copies source metadata, narrows `options_values`, adds `custom_order_id`, and publishes the product.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/saveAndAddToCart.ts:73-108` — saved PDP cart helper is apparel-shaped around size/color matching.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardCartHelpers.ts:31-88` — standard non-apparel cart path uses direct variant id and non-apparel metadata.

## 8. Contrary Evidence

- No server-side page error was observed; Next dev server returns 200 for `/products/brochures-8dd0f4c4`.
- `/products` list now loads, so this is not the earlier `/company/my-products` collection DTO crash.
- Authenticated catalog PDP for the same handle renders successfully, contradicting backend-missing-product, wrong-company, missing-sales-channel, or stale custom-products cache as the primary cause.
- Direct unauthenticated API probe returned 401, but that is expected for the protected local route and is not evidence of product absence.
- The inspected saved-PDP files have no diff versus `origin/develop...HEAD`; the frontend integration merge did not introduce this file-level behavior. The backend branch now exposes the deferred frontend gap by creating real print saved products.

## 9. Known Gap Considered

`KG-NON-APPAREL-OPTIONS` / relevant because the symptom is non-apparel product UI failure after saved-product creation / Live recheck performed: yes / Result: backend metadata is present and the catalog PDP renders the standard product from the same handle; this is consumer discard, not upstream metadata loss / Used as evidence: no.

## 10. Proposed Fix Site

Primary storefront sites:

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx`, around saved-product branch/render/action logic.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts`, around result typing and `standard` product handling.

Likely adjacent storefront sites if preserving saved-product add-to-cart behavior:

- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardCartHelpers.ts`
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardAddToCart.ts`
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_components/standardProduct/*`

Do not fix this by only widening `product` in `useSavedProduct`; that would unblock rendering while leaving saved non-apparel add-to-cart on the apparel helper.

## 11. Fix Threshold

`medium` — single-repo storefront.

The render boundary is frontend-only, but the real saved print PDP fix is visible behavior and likely touches 2+ files/types/actions. A one-line hook change is too small because saved non-apparel add-to-cart currently routes through apparel-shaped logic.

## 12. Verification Plan

After fix:

1. Run `yarn typecheck`.
2. Run `git diff --check`.
3. Manual browser check: logged-in `/products/brochures-8dd0f4c4` renders `New brochure`, `Size`, `Paper`, `Quantity`, and no longer sticks on skeleton/blank content.
4. Manual cart smoke: from `/products/brochures-8dd0f4c4`, add the saved print product to cart; `/cart` shows non-apparel metadata rather than apparel Color/Size assumptions.
5. Regression check: apparel saved product `/products/triblend-tee-77c1-b523` still renders and can add to cart.

If test harness support is present, add a focused saved-PDP test proving a `{ type: "standard" }` result does not hit the saved page loading branch.

## 13. Open Uncertainty

Implementation needs a product decision: should saved standard PDP reuse the catalog `StandardPDP` with saved-mode action adjustments, or should it get a saved-only standard config card? Diagnosis does not depend on that choice, but implementation does.

## 14. Contract Compatibility Evidence

`backward-compatible` — backend already returns the existing standard product shape consumed by the catalog PDP. The proposed fix teaches the saved PDP to consume the already-supported `{ type: "standard" }` branch. No backend schema change or synchronized breaking deploy is required.

## Verifier Verdicts

- `consilium-tribunus`: `SOUND`.
- `consilium-provocator`: first pass `GAP` for missing authenticated detail/visibility proof; amended packet added authenticated catalog render proof plus DB company/sales-channel proof; second pass `SOUND`.
