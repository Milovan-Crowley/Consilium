# Diagnosis Packet: Non-Apparel Filter Parent Resolution

## Consul Handoff

The bug is not that the category handle is `display_banners`. That handle is the current safe category-page URL segment for the existing route shape.

Do not "fix" this by changing category pages to `/catalog/display/banners` without a separate routing spec. The app already uses `/catalog/[category]/[productHandle]`, so `/catalog/display/banners` is interpreted as category `display` plus product handle `banners`, not as a nested Banners category page. Changing that shape would affect product URL generation, breadcrumbs, favorites links, catalog cards, redirects, and likely SEO/history.

The likely fix belongs in the storefront category resolver: make `useCurrentCategory` resolve categories through the rooted tree so child categories reliably carry their parent chain before `getNonApparelTopLevelCategory()` decides whether to show filters.

## 14-Field Packet

1. **Symptom**

   On `/catalog/display_banners`, the filter sidebar/chrome still appears even though non-apparel display subcategories should not show tag filters. The behavior is inconsistent: top-level non-apparel categories work, `display_flags` reportedly works, but banners/signs/table covers/tents still show filters. Apparel should continue showing filters.

2. **Reproduction**

   Local storefront route observed in the in-app browser: `http://localhost:3000/catalog/display_banners`. Dev-server logs show the user navigated through `/catalog/display_banners`, `/catalog/display_flags`, `/catalog/display_signs`, `/catalog/display_table_covers`, `/catalog/display_tents`, `/catalog/display`, `/catalog/print`, and `/catalog/promo` while testing this exact behavior.

3. **Affected Lane**

   `storefront`, with backend DB/category data inspected as contract evidence. Current leading fix is single-repo storefront; no backend change is proposed in this packet.

4. **Files/Routes Inspected**

   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/page.tsx` — page-level filter chrome gate and category route behavior.
   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts` — category lookup and parent-chain enrichment.
   - `/Users/milovan/projects/divinipress-store/src/lib/catalog/non-apparel-categories.ts` — non-apparel top-level detection and child-handle list.
   - `/Users/milovan/projects/divinipress-store/src/app/_utils/product-routes.ts` — product URL construction, proving `/catalog/{category}/{handle}` is already product-page territory.
   - `/Users/milovan/projects/divinipress-store/src/app/_utils/constants/PRODUCT_BREADCRUMB_CONFIG.ts` — standard product breadcrumb URL construction.
   - `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/_custom/utils/promo-print-product/importer.ts` — backend importer category hierarchy logic.
   - Local backend DB `product_category` rows for `display`, `display_banners`, `display_flags`, `display_signs`, `display_table_covers`, `display_tents`, `print`, `promo`, and children.

5. **Failing Boundary**

   Storefront category resolution boundary: `useCurrentCategory()` returns the category object consumed by `CatalogBrowsingPage`. `CatalogBrowsingPage` then asks `getNonApparelTopLevelCategory(toProductCategory(category))` whether a category is inside `display`, `print`, or `promo`. If `category.parent_category` is missing or incomplete, the page treats a non-apparel child as filter-eligible apparel-style catalog chrome.

6. **Root-Cause Hypothesis**

   The filter gate depends on the current category object having a complete `parent_category` chain. `useCurrentCategory()` can return the first matching category from the API response before traversing through the rooted tree. If the Medusa categories response includes descendants in the top-level array, or returns child rows before their root parent is traversed, `findCategory()` returns a child category without the enriched parent chain. That makes `getNonApparelTopLevelCategory()` see `display_banners` as its own top-level category instead of a child of `display`, so `showFilterChrome` becomes `true` and filters remain visible.

7. **Supporting Evidence**

   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/page.tsx:87-93` — `showFilterChrome` is `!nonApparelTopLevelCategory`.
   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/page.tsx:149-153` — `showFilterChrome` is passed to `useCategoryFilters({ enableTagFilters })`.
   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/[category]/page.tsx:299-349` — non-apparel header and both mobile/desktop filter chrome are gated by `nonApparelTopLevelCategory` / `showFilterChrome`.
   - `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts:14-20` — `findCategory()` returns immediately when `cat.handle === handle`; parent enrichment only happens when reached recursively from a supplied `parent`.
   - `/Users/milovan/projects/divinipress-store/src/lib/catalog/non-apparel-categories.ts:74-85` — non-apparel detection walks `parent_category` to the top, then only accepts root handles `display`, `print`, or `promo`.
   - `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/_custom/utils/promo-print-product/importer.ts:204-268` — importer creates/uses root parent category from `product_type` and child category from `category`, with handles like `display` and `display_banners`.
   - Live DB recheck: `display`, `display_banners`, `display_flags`, `display_signs`, `display_table_covers`, and `display_tents` were all created/updated at `2026-04-29 22:47:02.465965+00`; each display child has parent handle `display`.
   - `/Users/milovan/projects/divinipress-store/src/app/_utils/product-routes.ts:37-43` — product URLs are built as `/catalog/${category}/${product.handle}`.
   - `/Users/milovan/projects/divinipress-store/src/app/_utils/constants/PRODUCT_BREADCRUMB_CONFIG.ts:45-55` — standard product breadcrumbs also treat `/catalog/${category}/${product.handle}` as the product detail URL.

8. **Contrary Evidence**

   - Live DB rows are not obviously wrong anymore: `display_banners`, `display_flags`, `display_signs`, `display_table_covers`, and `display_tents` all have parent `display`.
   - The user reports `display_flags` works. That suggests the issue may depend on response ordering, cached category objects, or how a particular category object is reached, rather than a universal missing-backend-parent condition.
   - Direct unauthenticated `xh` against `/store/product-categories` returned 401, so this packet does not include the exact authenticated React Query response payload from the browser session.

9. **Known Gap Considered**

   None applicable as direct evidence — checked shared known gaps for storefront and multi-lane entries. `KG-NON-APPAREL-OPTIONS` is adjacent but not the same symptom: it concerns non-apparel line-item option metadata loss, not catalog category ancestry or filter chrome. Live recheck performed: yes. Result: no known gap used as evidence.

10. **Proposed Fix Site**

   Primary: `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts:8-22`.

   Likely correction: resolve from root categories first, or otherwise ensure the returned category is enriched through its actual parent chain before returning. Do not change public route shape as part of this fix.

11. **Fix Threshold**

   `small`, if confined to resolver behavior in `useCurrentCategory.ts` without changing exported hook signature or route structure.

   If the Consul chooses to introduce nested category URLs like `/catalog/display/banners`, threshold becomes `large` because route semantics collide with existing product-detail URLs and need a separate routing spec.

12. **Verification Plan**

   - Run `yarn tsc --noEmit`.
   - In the authenticated browser, verify these routes do not show filter sidebar/mobile filter button and do show non-apparel category header/chips: `/catalog/display`, `/catalog/display_banners`, `/catalog/display_flags`, `/catalog/display_signs`, `/catalog/display_table_covers`, `/catalog/display_tents`, `/catalog/print`, `/catalog/print_cards`, `/catalog/promo`, `/catalog/promo_pens`.
   - Verify apparel still shows filters: `/catalog/apparel` and `/catalog/apparel_t_shirts`.
   - Verify product route still works: `/catalog/display/<known-display-product-handle>`.
   - Optional focused test: unit-test `findCategory` behavior with an API array containing both a child category at top-level and the same child nested under `display`; assert the resolved category has parent `display`.

13. **Open Uncertainty**

   The exact authenticated `/store/product-categories?include_descendants_tree=true` payload ordering was not captured in this session because terminal API inspection returned 401 without the browser auth session. The Consul should confirm whether the response includes descendant rows at top-level, whether React Query is holding stale category objects, or both. The DB hierarchy itself is now correct as of the live recheck.

14. **Contract Compatibility Evidence**

   N/A — single-lane storefront fix if kept to resolver behavior. It is backward-compatible with the current backend category rows and current URL convention. A nested URL redesign is not backward-compatible with current route semantics and should not be smuggled into this fix.

## Route Decision Note

Keep category browse URLs as `/catalog/display_banners` for this fix.

The current category/product route model is:

- `/catalog/[category]` for category browse pages.
- `/catalog/[category]/[productHandle]` for product detail pages.

Therefore `/catalog/display/banners` is currently interpreted as product handle `banners` inside category `display`, not as category `display > banners`. A nested category URL scheme would require changing the route model, product URL builder, breadcrumbs, and navigation semantics together.

