# 2026-04-29-products-company-collections-contract-drift - Diagnosis

## 1. Symptom

Opening `/products` in the storefront on `integration/non-apparel-products` throws `Cannot read properties of undefined (reading 'length')` in `AdminProductsView.renderRow` when reading `product.company_collections.length`.

## 2. Reproduction

1. Run storefront branch `integration/non-apparel-products` with `.env.local` pointing `NEXT_PUBLIC_API_URL` to `http://localhost:9000`.
2. Run backend branch `integration/non-apparel-backend` from `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean`.
3. Log in as a customer admin and open `http://localhost:3000/products`.
4. Browser throws at `src/app/(authenticated)/products/_components/admin-products-view.tsx:421`.

## 3. Affected Lane

cross-repo

## 4. Files/Routes Inspected

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/admin-products-view.tsx` - `/products` table render path and collection display assumptions.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts` - frontend API wrapper calling `/company/my-products`.
- `/Users/milovan/projects/divinipress-store/src/app/_interfaces/product.interface.ts` - `HydratedProduct` contract requiring `company_collections` and `company_collection_ids`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/my-products/route.ts` - running backend route producing the response consumed by `/products`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/my-products/query-config.ts` - default product fields for `/company/my-products`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/middlewares.ts` - middleware wiring for `/company/my-products`.

## 5. Failing Boundary

Backend `/company/my-products` response contract to storefront `useGetMyProducts`: the frontend expects every returned product to include `company_collections`, but the running backend integration branch returns plain Medusa products without that hydrated company collection field.

## 6. Root-Cause Hypothesis

The frontend non-apparel integration branch did not introduce this `/products` failure. It is assembled from current `origin/develop`, which already contains the frontend collection UI contract. The running backend integration branch is based on `origin/import-script-promo-print` plus non-apparel branches and is missing the backend collection contract repair from `develop` / `feature/add-to-collection-contract-repair`, specifically the `/company/my-products` hydration that adds `company_collections`, `company_collection_ids`, and `display_name` to each product.

## 7. Supporting Evidence

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/admin-products-view.tsx:421` - reads `product.company_collections.length`.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/_components/admin-products-view.tsx:236-238` - same component defensively treats missing `company_collections` as possible in the remove action, proving the table render path is the brittle read.
- `/Users/milovan/projects/divinipress-store/src/app/_api/products/getMyProducts.ts:12-20` - `useGetMyProducts` returns `response.data.products` from `/company/my-products` without normalizing the DTO.
- `/Users/milovan/projects/divinipress-store/src/app/_interfaces/product.interface.ts:113-117` - `HydratedProduct` documents and types `company_collections` as hydrated by `GET /company/my-products`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/my-products/route.ts:38-44` - running backend only queries `["product.id", "collections.id"]` from `company_product`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/my-products/route.ts:55-75` - running backend hydrates product images and returns `{ products }` without mapping collection data onto each product.
- `feature/add-to-collection-contract-repair:src/api/company/my-products/route.ts:38-109` - repaired branch queries `collections.name` and `display_name`, then maps `company_collections`, `company_collection_ids`, and `display_name` onto products before `res.json`.
- Backend process evidence - port `9000` is served by `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/node_modules/@medusajs/cli/cli.js start --types`.
- Backend branch evidence - running backend worktree is `integration/non-apparel-backend`, ahead of `origin/import-script-promo-print`, and `git merge-base --is-ancestor feature/add-to-collection-contract-repair HEAD` returns non-zero.
- Frontend branch evidence - `git diff --name-status origin/develop...HEAD -- src/app/(authenticated)/products src/app/_api/products/getMyProducts.ts src/app/_interfaces/product.interface.ts` returns no files, so the non-apparel frontend merges did not change the failing `/products` surface.

## 8. Contrary Evidence

- The frontend table code is brittle because several reads use `product.company_collections.length` without a fallback. That could be patched locally, but it would not satisfy the documented `HydratedProduct` contract or restore collection actions correctly.
- The error appears in frontend rendering, but the inspected frontend integration branch has no diff from `origin/develop` in the failing `/products` files.
- `KG-TEAM-PERMISSIONS` mentions `/company/my-products`, but its symptom is team/permission scope, not missing `company_collections` on the product DTO.

## 9. Known Gap Considered

KG-TEAM-PERMISSIONS / Relevant only because it mentions `/company/my-products`; symptom is permission or team scope mismatch, not missing collection DTO fields / Live recheck performed: yes / Result: current failure is a DTO hydration gap in backend route output, not a permission gate or team scope issue / Used as evidence: no.

## 10. Proposed Fix Site

Primary route: merge or cherry-pick the backend collection contract repair into the running backend integration branch, especially `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/my-products/route.ts:38-109`.

Full prior repair also touches `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/collections/route.ts` and `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product-clean/src/api/company/middlewares.ts`; use the existing repaired branch rather than hand-rolling a new shape if possible.

## 11. Fix Threshold

medium

## 12. Verification Plan

1. On backend integration branch, verify the contract repair is present: `git merge-base --is-ancestor feature/add-to-collection-contract-repair HEAD` or equivalent commit/PR inclusion.
2. Restart backend on `9000`.
3. Keep storefront on `integration/non-apparel-products`, open `http://localhost:3000/products`, and confirm no browser `TypeError`.
4. Inspect `/company/my-products` in the browser network response and confirm each product has `company_collections` as an array, including `[]` for no memberships.
5. Run backend route/type checks appropriate to the merged backend change, then rerun storefront `npx tsc --noEmit`.

## 13. Open Uncertainty

The exact backend integration ship order needs confirmation: either merge the whole backend `develop` base into the non-apparel integration branch, or cherry-pick the minimal add-to-collection contract repair commits. The root cause does not depend on that choice, but the safest integration route does.

## 14. Contract Compatibility Evidence

backward-compatible - the repaired backend response adds optional frontend-consumed fields (`company_collections`, `company_collection_ids`, `display_name`) onto product objects while preserving the existing product fields. Products with no collection membership should return `company_collections: []`, which is safe for old and new frontend consumers.
