# 2026-04-30-div-100-apparel-pricing-company-context - Diagnosis

## 1. Symptom

Saved apparel products and catalog apparel products can throw a storefront `AxiosError` with HTTP 400 when apparel pricing runs. The observed stack points at `src/app/_api/product/apperalProducts/getApparelProductPricing.ts:85`, where the storefront posts to `/pricing/apparel`.

## 2. Reproduction

Observed from the provided screenshot: an authenticated Next.js storefront page enters the apparel pricing flow, calls `POST /pricing/apparel`, and receives HTTP 400. Static repo trace reproduces the failing contract: the frontend calls `/pricing/apparel`; the backend route dereferences `req.context.company`; global backend middleware explicitly skips company auth/context setup for `/pricing*` routes.

## 3. Affected Lane

cross-repo

## 4. Files/Routes Inspected

- `/Users/milovan/projects/divinipress-store/src/app/_api/product/apperalProducts/getApparelProductPricing.ts` - storefront pricing request and React Query hook.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useApparelConfig.ts` - shared apparel pricing hook used by catalog and saved pages.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/page.tsx` - catalog apparel PDP consumer.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx` - saved apparel product detail consumer.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` - saved product detail lookup path.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/apparel/route.ts` - backend apparel pricing route.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/middlewares.ts` - global auth/company context middleware and pricing-route exclusion.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/helpers.ts` - company handle decoding from bearer/cookie token.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/route.ts` - exact legacy `/pricing` multipart CSV upload route.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/promo-print/route.ts` - contrary route: pricing route that does not require company context.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/store/carts/[id]/line-items-custom/route.ts` - authenticated cart route that successfully relies on `req.context.company`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product` `HEAD` - confirmed the pushed DIV-100 catalog-visibility fix did not touch pricing middleware or apparel pricing.

## 5. Failing Boundary

Backend API route contract for `POST /pricing/apparel`: the route is typed and written as an authenticated company-context route, but the global middleware treats all `/pricing*` routes as context-free and skips the setup that populates `req.context.company`.

## 6. Root-Cause Hypothesis

`/pricing/apparel` is incorrectly covered by the broad `/pricing` middleware skip in `src/api/middlewares.ts`. The storefront sends an authenticated request, but the backend does not run `decodeCompanyHandleFromRequest`, `authenticate(companyHandle, ["bearer", "session"])`, `validateHandle`, or context hydration for `/pricing/apparel`; the route then reads `company.pricing`, throws when `company` is undefined, and converts that runtime error into a Medusa `INVALID_DATA` response, which appears as HTTP 400 in the storefront.

## 7. Supporting Evidence

- `/Users/milovan/projects/divinipress-store/src/app/_api/product/apperalProducts/getApparelProductPricing.ts:85-87`
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useApparelConfig.ts:115-123`
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/[productHandle]/page.tsx:641-643`
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx:547-549`
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/products/[handle]/page.tsx:773-785`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/apparel/route.ts:24-34`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/apparel/route.ts:72-78`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/middlewares.ts:56-69`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/middlewares.ts:71-116`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/helpers.ts:5-33`
- `/Users/milovan/projects/divinipress-store/src/app/_lib/api/storeApi.ts:15-25`
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product` `git show --name-only --oneline HEAD`: only `integration-tests/http/approve-proof-non-apparel.spec.ts` and `src/api/store/custom-products/route.ts`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product` `git show 32a1fd5 -- src/api/middlewares.ts src/api/pricing/promo-print/route.ts`: branch commit added the broad `/pricing` auth bypass and `variants.options.option.*` for `/pricing/promo-print`.
- `/Users/milovan/projects/divinipress-backend/src/api/middlewares.ts:60-65`: current `develop` checkout does not have the broad `/pricing` skip, confirming the defect is branch drift in this worktree, not the just-pushed catalog visibility fix.

## 8. Contrary Evidence

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/promo-print/route.ts:21-75` proves not every pricing route needs company context; a blanket statement that "all pricing routes must be authenticated company routes" would be too broad.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/pricing/route.ts:63-83` is an exact `/pricing` CSV-upload route with separate multipart middleware at `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/middlewares.ts:163-172`; changing the exact `/pricing` route without care could affect importer/admin behavior.
- `/Users/milovan/projects/divinipress-store/src/app/_api/catalog/standardPricing.ts:24-27` uses `/pricing/promo-print`, so any broad middleware change must account for standard print/promo pricing too.
- The latest DIV-100 catalog-visibility commit did not change pricing or global middleware, so this evidence does not support "the catalog exclusion patch introduced the middleware drift."

## 9. Known Gap Considered

KG-MEDUSA-MONEY-AND-QUERY / Relevant because it names pricing-route risk, but its symptom is price-unit semantics or query.graph filtering rather than missing company context / Live recheck performed: yes / Result: current route failure is `req.context.company` skipped by middleware, not cents/dollars or linked-query filtering / Used as evidence: no.

No cross-repo known gap directly maps to a `/pricing/apparel` company-context middleware mismatch; checked the current cross-repo and multi-lane known-gap entries.

## 10. Proposed Fix Site

`/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/src/api/middlewares.ts:60-66` - replace the broad `req.baseUrl.startsWith("/pricing")` skip with explicit exclusions for only the context-free pricing routes: exact `/pricing` and `/pricing/promo-print`. That makes `/pricing/apparel` run the same company auth/context setup used by other authenticated storefront routes while preserving the current public behavior of the exact CSV upload route and promo-print pricing route.

Secondary verification-only site: add `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/integration-tests/http/apparel-pricing.spec.ts`, proving authenticated `POST /pricing/apparel` returns 200, unauthenticated `POST /pricing/apparel` is rejected, exact `POST /pricing` still reaches its route without company auth, and `POST /pricing/promo-print` remains public.

## 11. Fix Threshold

medium

Reason: the code fix is probably one backend line, but the route is a cross-repo storefront/backend contract and the safe acceptance test should exercise the HTTP boundary. The exact `/pricing` CSV-upload carveout and `/pricing/promo-print` consumer make this broader than a blind small fix.

## 12. Verification Plan

Add or update a backend HTTP integration test that:

Create `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product/integration-tests/http/apparel-pricing.spec.ts` with these assertions:

1. Authenticated company user posts valid apparel pricing input to `/pricing/apparel` and receives HTTP 200 with `totalPrice`, `totalQuantity`, and `averageUnitPrice`.
2. Unauthenticated `POST /pricing/apparel` is rejected before route business logic, proving the endpoint is no longer context-free.
3. Unauthenticated exact `POST /pricing` with no files returns the route's existing validation error (`No files were uploaded`) rather than an auth error, proving the legacy upload route remains outside company auth.
4. Unauthenticated `POST /pricing/promo-print` with a missing product id returns the route's existing product lookup error (`Product not found`) rather than an auth error, proving standard print/promo pricing remains intentionally outside company auth without depending on fragile product-index fixture timing.

Run:

```bash
PATH=/Users/milovan/.nvm/versions/node/v22.22.2/bin:$PATH yarn test:integration:http integration-tests/http/apparel-pricing.spec.ts
PATH=/Users/milovan/.nvm/versions/node/v22.22.2/bin:$PATH yarn build
```

## 13. Open Uncertainty

None blocking after the updated blast-radius decision. The route-level contract choice is explicit: `/pricing/apparel` is company-scoped because it reads `company.pricing`; exact `/pricing` and `/pricing/promo-print` remain context-free because their route code does not read `req.context.company` and current branch history made them public in `32a1fd5`.

## 14. Contract Compatibility Evidence

backward-compatible - The storefront already sends bearer auth and the publishable API key through `storeApi` for `/pricing/apparel`; the backend route already typed itself as `MedusaRequestWithCompany` and reads company pricing. The proposed backend fix supplies the context the route already expects and does not change request or response JSON shape. Exact `/pricing` and `/pricing/promo-print` keep their current public/no-company-context behavior through explicit exclusions, so this does not intentionally break standard print/promo pricing or the legacy CSV upload route.
