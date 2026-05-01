# Non-Apparel Category Parent Resolution Spec

Date: 2026-05-01
Status: Draft for review
Surface: Divinipress Store catalog category browse
Primary repo: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-87-non-apparel-catalog-landing`
Related diagnosis: `/Users/milovan/projects/Consilium/docs/cases/2026-05-01-non-apparel-filter-parent-resolution/diagnosis.md`

## Intent

Fix non-apparel catalog category pages so they reliably suppress apparel filter chrome when the current category belongs to the `display`, `print`, or `promo` branches.

The issue is not the public category URL. Handles such as `display_banners`, `print_cards`, and `promo_pens` are valid one-segment category handles, matching the existing apparel pattern (`apparel_t_shirts`, `apparel_t_shirts_short_sleeves`). The issue is that the storefront current-category resolver can return a category object without reliable parent ancestry, causing the page to misclassify a non-apparel child category as an ordinary filter-eligible category.

Confidence: High - live source confirms filter chrome is gated by `getNonApparelTopLevelCategory(...)`, which depends on `parent_category` ancestry from `useCurrentCategory`.

## User-Facing Contract

Non-apparel category browse pages under `display`, `print`, and `promo` must not show apparel tag-filter UI.

Required visible behavior:

- `/catalog/display`, `/catalog/print`, and `/catalog/promo` do not show the desktop filter sidebar or mobile filter button.
- Child category pages such as `/catalog/display_banners`, `/catalog/print_cards`, and `/catalog/promo_pens` also do not show the desktop filter sidebar or mobile filter button.
- Non-apparel category header and chip navigation remain visible for non-apparel root and child pages.
- Search, sort, grid/list view, favorites, product cards, pagination, and product counts keep their existing behavior.
- Apparel category pages keep the existing filter experience.

Confidence: High - this is the exact requested outcome; prior category-navigation spec already established that non-apparel pages replace apparel filters with category navigation.

## URL Contract

The fix must preserve the current route model:

- `/catalog/[category]` is the category browse route.
- `/catalog/[category]/[productHandle]` is the product-detail route.

The fix must preserve current category browse URLs, including:

- `/catalog/display_banners`
- `/catalog/display_flags`
- `/catalog/display_signs`
- `/catalog/display_table_covers`
- `/catalog/display_tents`
- `/catalog/print_cards`
- `/catalog/print_marketing`
- `/catalog/print_stationary`
- `/catalog/promo_pens`
- `/catalog/apparel_t_shirts`

The fix must not introduce `/catalog/display/banners` or any other nested category browse URL. In the current app, `/catalog/display/banners` is product-detail territory: category `display`, product handle `banners`.

Confidence: High - live route files confirm browse and product detail are separate one- and two-segment routes.

## Resolver Contract

`useCurrentCategory(categoryHandle)` is the boundary that must return the current category object in a form suitable for page-level branch decisions.

For any category that exists inside the loaded category tree, the returned object must carry the canonical parent chain from the rooted tree. If the API response includes the same category both as a flat/top-level item and nested under its parent, the nested rooted-tree version must win for category resolution.

For example, resolving `display_banners` must return a category whose ancestry reaches `display`, not a bare `display_banners` object with no parent. Resolving `apparel_t_shirts_short_sleeves` must preserve ancestry through `apparel_t_shirts` to `apparel`.

Fallback behavior must stay conservative. If no rooted-tree match exists for a category handle, the resolver may return the flat match instead of turning an existing category into `Category not found`; however, that flat fallback must not be used to fake non-apparel ancestry. A non-apparel child page only qualifies for filter suppression when the returned category's real ancestry reaches `display`, `print`, or `promo`.

The returned shape must also preserve the data needed by category chips. Ancestors used by `getNonApparelTopLevelCategory` must remain compatible with chip navigation, including the top-level category's usable `category_children`. A resolver change that suppresses filters by attaching a minimal parent stub while breaking non-apparel chips does not satisfy this spec.

The returned category graph must remain safe for existing adapters. In particular, it must not create a cyclic object graph that makes recursive category adapters or render helpers loop indefinitely.

The resolver must remain data-driven. It must not special-case `display_banners`, `print_cards`, `promo_pens`, or any fixed list of non-apparel child handles to fake ancestry.

Confidence: Medium - this is the smallest route that fits the diagnosed failure without changing routes, handles, or backend data, but implementation must still prove the live payload shape or reproduce the duplicate flat-plus-nested case.

## Branch Detection Contract

`getNonApparelTopLevelCategory(category)` remains the source of truth for deciding whether a category is inside a non-apparel branch. It should continue to identify non-apparel by walking the category's parent chain to the top-level category and accepting only these roots:

- `display`
- `print`
- `promo`

Apparel detection should continue to work from the same ancestry model. A category under `apparel` should remain eligible for apparel card rendering and apparel filters.

Confidence: High - live source already uses top-level ancestor detection; the gap is resolver reliability, not the branch rule.

## Non-Goals

This spec does not authorize:

- nested category routing
- category handle renames
- backend importer changes
- seed-data rewrites
- product URL generation changes
- PDP breadcrumb model changes
- migration from Axios catalog hooks to the Medusa SDK
- redesign of filter UI, category chips, product cards, or catalog navigation
- hard-coded non-apparel handle allowlists as a substitute for category ancestry

Confidence: High - these are the surfaces that would widen a filter-chrome bug into a routing/data-model project.

## Verification Requirements

Before calling the fix done, verify static correctness:

- `yarn tsc --noEmit`

Verify browser behavior against an authenticated storefront session and a backend dataset containing Display, Print, Promo, and Apparel categories.

Non-apparel pages must not show filter chrome and must show the non-apparel header/chips:

- `/catalog/display`
- `/catalog/display_banners`
- `/catalog/display_flags`
- `/catalog/display_signs`
- `/catalog/display_table_covers`
- `/catalog/display_tents`
- `/catalog/print`
- `/catalog/print_cards`
- `/catalog/print_marketing`
- `/catalog/print_stationary`
- `/catalog/promo`
- `/catalog/promo_pens`

Browser verification must include both desktop and mobile viewport checks. At minimum, verify one non-apparel root route and one non-apparel child route in a mobile viewport to prove the mobile filter button is absent, not only the desktop sidebar.

Apparel pages must still show filters:

- `/catalog/apparel`
- `/catalog/apparel_t_shirts`
- `/catalog/apparel_t_shirts_short_sleeves`

Product-detail routing must remain valid:

- From a non-apparel category page, clicking a product card still reaches `/catalog/<top-level-product-type>/<productHandle>` or the existing product URL produced by `getCatalogProductUrl`.
- A direct product-detail route such as `/catalog/display/<known-display-product-handle>` still renders the product detail page.
- The product-detail category breadcrumb still links to the route category segment and does not imply nested category browse semantics.

Either capture the authenticated category API payload used by the browser session or add a focused resolver regression test. Browser-only visual smoke is not enough by itself unless the captured payload proves the same ancestry shape the fix relies on.

If using a focused automated test, cover this fixture shape:

- API response contains a bare `display_banners` object before a rooted `display -> display_banners` object.
- Resolving `display_banners` returns the rooted version with parent `display`.
- The returned top-level `display` ancestor still exposes its child categories for chip navigation.
- Resolving an apparel descendant returns ancestry through `apparel`.

Confidence: Medium - static and browser checks are required; the exact available automated test harness for this hook should be chosen during implementation.

## Open Risk

The exact authenticated payload ordering from `GET /store/product-categories?include_descendants_tree=true` was not captured during diagnosis because the running backend was unavailable from this session. Implementation should either capture that payload from the authenticated browser/backend pair or reproduce the duplicate flat-plus-nested shape in a focused resolver test before declaring the issue fixed.

Confidence: Medium - source-level failure mode is proven, but live payload ordering remains the main empirical gap.
