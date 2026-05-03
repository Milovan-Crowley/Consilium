# DIV-100 Saved Products Catalog Visibility

## 1. Symptom

When a customer approves a catalog proof, the resulting saved Medusa product appears in My Products as intended, but products carrying `metadata.custom_order_id` can also surface through normal catalog browsing, category filtering, and search.

## 2. Reproduction

Current runtime/code reproduction path:

1. Approve a CATALOG proof so the approval side effect creates a saved `Product` with `metadata.custom_order_id`.
2. Confirm `GET /company/my-products` includes that product for the approving company.
3. Request `GET /store/custom-products`, `GET /store/custom-products?category_id=<source category id>`, or `GET /store/custom-products?q=<saved product title>`.
4. The current backend route admits the saved product because its allowlist is company-product membership plus published/sales-channel filters only; it never excludes `metadata.custom_order_id`.

Prior authenticated browser evidence in `2026-04-29-saved-print-product-pdp-standard-branch-discard` also showed a saved print product handle rendering through `/catalog/print/<handle>`, proving the same `/store/custom-products` surface can retrieve backend-created saved print products.

## 3. Affected lane

`cross-repo` — storefront catalog and saved-product consumers depend on backend product visibility contracts.

## 4. Files/routes inspected

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/route.ts` — catalog list/search/category backend route.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/[id]/route.ts` — product-id detail route used by saved-product image hydration.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/middleware.ts` — published, sales-channel, and category filters.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/company/my-products/route.ts` — My Products route.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/order-flow.ts` — apparel approval saved-product creation.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/_utils/non-apparel-saved-product.ts` — non-apparel approval saved-product creation helper.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/_utils/cache.ts` — custom-products allowlist cache implementation.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getCatalogProducts.ts` — storefront catalog landing/search consumer.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductsByCategory.ts` — storefront category/search consumer.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductsByTags.ts` — storefront tag/category consumer.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts` — saved/catalog detail by handle consumer.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts` — My Products consumer.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` — saved PDP hook.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx` — saved-product detail/reorder page.

## 5. Failing boundary

Backend API contract boundary at `GET /store/custom-products`: the route is used for catalog browse/list/category/search but has no saved-product exclusion, even though saved products have a distinct ownership/reorder surface through `GET /company/my-products` and saved-product detail/reorder flows.

## 6. Root-cause hypothesis

DIV-100 correctly creates saved products as real published Medusa products with company and Webshop links so My Products, saved detail, image hydration, and reorder can work. The catalog route then treats those company-linked products as normal catalog-visible products because its allowlist includes the current customer's company products and never removes products marked by `metadata.custom_order_id`. The global `divinipress-products` cache key compounds the bug by caching a company-specific product-id allowlist without `company.id`, so visibility can be stale or cross-company inconsistent.

## 7. Supporting evidence

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/_utils/non-apparel-saved-product.ts:348-367` — non-apparel saved-product payload copies source fields/categories, sets `status: "published"`, and adds `metadata.custom_order_id`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/_utils/non-apparel-saved-product.ts:103-121` — non-apparel saved product is linked to CompanyProduct and the Webshop sales channel.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/order-flow.ts:372-425` — apparel approval branch also creates a published product, copies categories, and adds `metadata.custom_order_id`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/custom-order/order-flow.ts:431-463` — apparel saved product is linked to CompanyProduct and Webshop.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/middleware.ts:40-53` — list route default filters require published status and category validity only.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/route.ts:35-58` — list route builds the product-id allowlist from Divinipress company products plus current company products.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/route.ts:146-160` — list route queries products using `req.filterableFields` plus the allowlisted ids, with no `metadata.custom_order_id` exclusion.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/route.ts:35-37` and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/_utils/cache.ts:31-41` — product-id allowlist is cached under `divinipress-products` with no company component despite depending on `company.id`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/company/my-products/route.ts:38-71` — My Products independently reads products linked to the current company.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getCatalogProducts.ts:17-28` — catalog landing/search calls `/store/custom-products` with optional `q` and `category_id`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductsByCategory.ts:16-28` — category browse/search calls `/store/custom-products`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductsByTags.ts:16-28` — tag/category browse calls `/store/custom-products`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/getProductByHandle.ts:103-110` — product detail and saved detail currently retrieve by handle through `/store/custom-products?handle=...`.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts:12-20` — My Products calls `/company/my-products`, not `/store/custom-products`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx:665-704` — saved non-apparel reorder path uses selected saved product data and cart APIs, not catalog browse lists.
- `git show --stat --oneline dfae909` — DIV-82 commit only changes two seed fixture JSON files.

## 8. Contrary evidence

- The Webshop link and published status are not by themselves proven wrong: both apparel and non-apparel saved-product creation deliberately set them, and saved-product detail currently depends on retrieving published/Webshop-linked products.
- A global exclusion inside every `/store/custom-products` path would break current saved-product detail by handle because the storefront saved PDP uses `/store/custom-products?handle=<handle>`.
- `/store/custom-products/:id` is a separate route and is used by saved-product image hydration; the catalog-list bug does not require changing that route.
- DIV-82 is not a plausible cause: `dfae909` only changed `products/display/5-popup-flex-tent/5-popup-flex-tent_definition.json` and `products/print/bookmarks/bookmarks_definition.json`.

## 9. Known gap considered

`KG-NON-APPAREL-OPTIONS` / Relevant because the visible product is non-apparel and saved-product metadata/options loss has caused adjacent UI failures / Live recheck performed: yes / Result: current saved-product creation and storefront adapter evidence show metadata exists; this bug is route visibility, not upstream metadata loss / Used as evidence: no.

## 10. Proposed fix site

Primary backend fix:

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/custom-products/route.ts:35-68` — make the product-id allowlist cache company-scoped and exclude `metadata.custom_order_id` for catalog browse/list/category/search requests.

Acceptance coverage:

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/integration-tests/http/approve-proof-non-apparel.spec.ts` — extend the existing non-apparel proof approval fixture to assert My Products inclusion, catalog list/category/search exclusion, saved detail by handle, and reorder preservation.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/integration-tests/http/proof-to-catalog.spec.ts` — add apparel parity if it can be done without widening the lane.

## 11. Fix threshold

`medium` — backend single-repo fix with route behavior plus integration coverage. No model, migration, package, or response-shape change is expected.

## 12. Verification plan

Add tests first, then run:

- `PATH=/Users/milovan/.nvm/versions/node/v22.22.2/bin:$PATH yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts -t "catalog visibility|auto-approves"`
- If apparel parity is added: `PATH=/Users/milovan/.nvm/versions/node/v22.22.2/bin:$PATH yarn test:integration:http integration-tests/http/proof-to-catalog.spec.ts -t "catalog visibility|proof to catalog"`
- `PATH=/Users/milovan/.nvm/versions/node/v22.22.2/bin:$PATH yarn build`

## 13. Open uncertainty

The exact implementation should verify Medusa query behavior before relying on JSON metadata negation in `remoteQuery`; the safer scoped route fix may be to query metadata for the already allowlisted product ids, remove ids with `metadata.custom_order_id` only for browse/list/category/search requests, and then let the existing product query handle pagination/count from the filtered id set. Also confirm whether handle-specific retrieval should remain allowed temporarily for saved PDP compatibility or move to a dedicated saved-product endpoint in a later lane.

## 14. Contract compatibility evidence

`backward-compatible` — the proposed backend fix does not change response shape or remove saved products from `/company/my-products`, `/store/custom-products?handle=<saved handle>` if preserved for saved PDP compatibility, `/store/custom-products/:id`, cart-add, or `custom-complete` reorder paths. It only narrows catalog browse/list/category/search membership to exclude products explicitly marked as saved by `metadata.custom_order_id`, which matches the My Products vs Catalog product contract.
