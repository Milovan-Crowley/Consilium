# Non-Apparel Category Parent Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task.

**Goal:** Make non-apparel category browse pages suppress apparel filter chrome reliably by returning the current category with real parent ancestry.

**Plan Scale:** Patch

**Implementation Shape:** Keep the fix inside the storefront current-category resolver. Extract the pure resolver into `src/lib/catalog/current-category-resolution.ts` so the real implementation can be proofed without adding test infrastructure. Preserve the one-segment category route model and the existing category API query shape. Do not touch backend importer data, category handles, product URL generation, breadcrumbs, or filter UI components.

**Scope In:**
- Resolve `useCurrentCategory(categoryHandle)` from real rooted-tree ancestry when available.
- Reconstruct ancestry from loaded `parent_category_id` rows only when the actual parent rows are present.
- Preserve ancestor metadata and child lists needed by apparel filters and non-apparel chips.
- Verify Display, Print, Promo, and Apparel behavior before declaring the patch done.

**Scope Out:**
- Nested category routes such as `/catalog/display/banners`.
- Category handle renames.
- Backend importer, seed, or migration work.
- Shared category API/query shape changes, including roots-only category fetching.
- Filter UI, category chip, product card, or breadcrumb redesign.

**Verification:** `yarn tsc --noEmit`; patch-local ESLint on every touched source file; `yarn lint:changed` as an informational branch-wide stack gate; focused resolver proof against the real exported resolver; authenticated desktop and mobile browser checks for non-apparel and apparel routes.

---

## File Ownership Map

- `src/lib/catalog/current-category-resolution.ts` owns the pure current-category resolver and is the only planned new source file.
- `src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts` owns the React hook wrapper around current-category resolution and imports the pure resolver.
- `src/app/_api/catalog/getProductCategories.ts` owns the category API query and must remain unchanged.
- `src/app/(authenticated)/catalog/[category]/page.tsx` owns the page-level filter-chrome gate and must remain unchanged.
- `src/lib/catalog/non-apparel-categories.ts` owns non-apparel branch detection and chip generation and must remain unchanged.
- `src/lib/catalog/types.ts` owns recursive Medusa-to-catalog adapters and must remain unchanged; the resolver must avoid cyclic object graphs that would break these adapters.

## Evidence And Risk Notes

**Evidence:** Live storefront code gates filter chrome through `getNonApparelTopLevelCategory(toProductCategory(category))` inside `src/app/(authenticated)/catalog/[category]/page.tsx`, and that branch detector walks `parent_category` to `display`, `print`, or `promo`.

**Evidence:** `useCurrentCategory.ts` currently returns the first matching handle while walking the category list, so a flat `display_banners` row can win before the nested `display -> display_banners` row.

**Risk:** The authenticated live payload ordering was not captured during diagnosis. The patch must prove either the live payload shape or the resolver behavior against the failure shape before completion.

**Risk:** The storefront worktree is already dirty outside this patch. Capture `git status --short` before and after implementation, and report unrelated pre-existing changes separately from the resolver patch.

### Task 1: Replace First-Match Category Resolution

**Centurio sub-skill:** `medusa-dev:building-storefronts`

**Files:**
- Create: `src/lib/catalog/current-category-resolution.ts`
- Modify: `src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts`

**Objective:** Return the current category with real parent ancestry while keeping the public `useCurrentCategory(categoryHandle?: string)` hook contract unchanged.

**Decisions already made:**
- Keep `useCurrentCategory` returning `{ category, isLoading }`.
- Export the pure resolver as `resolveCurrentCategory(categories, handle)` from `src/lib/catalog/current-category-resolution.ts`.
- Replace the current private first-match resolver in `useCurrentCategory.ts` with an import of `resolveCurrentCategory`.
- Have `useCurrentCategory` call `resolveCurrentCategory(productCategories, categoryHandle)` inside the existing `useMemo`.
- Prefer a rooted-tree match over a flat/top-level duplicate for the same handle.
- If no rooted-tree match exists, reconstruct the parent chain from `parent_category_id` only when the actual parent rows are present somewhere in the loaded category collection.
- When reconstructing ancestry from flat `parent_category_id` rows, preserve usable `category_children` on reconstructed ancestors by linking actual loaded child rows by `parent_category_id`. Do not infer children from handles.
- Use actual loaded category rows for reconstructed ancestors. Do not infer parents from handles, labels, or fixed non-apparel allowlists.
- Do not mutate API category objects. Return enriched copies as needed.
- Preserve ancestor `metadata` and `category_children`; apparel filter scoping depends on parent metadata and non-apparel chips depend on top-level children.
- Avoid bidirectional object cycles. A child may point to an enriched parent, but parent child arrays must not be rewritten to point back to the same enriched child object.
- Leave `src/app/_api/catalog/getProductCategories.ts` untouched, including `{ include_descendants_tree: true }`.

**Acceptance:**
- Resolving `display_banners` returns a category whose parent chain reaches `display` when the loaded collection contains `display -> display_banners`, even if a bare `display_banners` row appears earlier.
- Resolving a flat child with `parent_category_id` reconstructs ancestry only when the corresponding parent rows are present in the loaded collection.
- Resolving flat non-apparel children with present parent rows preserves top-level child lists from actual loaded child rows so non-apparel chip navigation remains usable.
- Resolving a flat child with missing parent rows returns the flat category and does not fake non-apparel ancestry.
- Resolving `apparel_t_shirts_short_sleeves` preserves ancestry through `apparel_t_shirts` to `apparel`, including parent metadata needed by `useCategoryFilters`.
- No route files, breadcrumb utilities, backend files, or category API query files are changed.

**Verification:**
- Run: `yarn tsc --noEmit`
- Expected: exits 0 with no new TypeScript errors from the resolver or hook.
- Run: `yarn eslint "src/lib/catalog/current-category-resolution.ts" "src/app/(authenticated)/catalog/_hooks/useCurrentCategory.ts"`
- Expected: exits 0 for the patch-local source files.
- Run: `yarn lint:changed`
- Expected: reports the branch-wide stack state. This command is not patch-local proof because it is HEAD-based; if it fails on files outside this patch, report the failure and do not fix unrelated files.

**Stop conditions:** If the Medusa `StoreProductCategory` type does not expose `parent_category_id` in this checkout, verify the installed type before casting. A narrow local type extension for `parent_category_id?: string | null` is acceptable; broad `any` is not. If the implementation appears to require editing `src/app/(authenticated)/catalog/[category]/page.tsx` or any other source file, stop and revise the plan before widening.

### Task 2: Prove The Resolver Contract Against Real Fixtures

**Centurio sub-skill:** `medusa-dev:building-storefronts`

**Files:**
- Modify: none
- Temporary local artifact: `/tmp/divinipress-current-category-resolution-proof.ts`
- Temporary local artifact: `/tmp/divinipress-category-payload.json`

**Objective:** Prove the real exported resolver handles the failure shapes before relying on browser behavior.

**Decisions already made:**
- Write a temporary proof script at `/tmp/divinipress-current-category-resolution-proof.ts`.
- The proof script must import the real exported `resolveCurrentCategory` from `src/lib/catalog/current-category-resolution.ts`. It must not copy resolver logic.
- Run the temporary proof with Yarn tooling: `yarn dlx tsx /tmp/divinipress-current-category-resolution-proof.ts`.
- Do not commit the temporary proof script and do not add a unit-test runner or package dependency for this patch.
- If an authenticated storefront/backend pair is available, also capture the browser's `GET /store/product-categories?include_descendants_tree=true` response and save the raw store API response as `/tmp/divinipress-category-payload.json`. Do not commit this file.

**Acceptance:**
- The focused resolver proof covers a bare `display_banners` row before a rooted `display -> display_banners` row and confirms the rooted version wins.
- The focused resolver proof covers a flat child with `parent_category_id` and present parent rows and confirms ancestry reconstructs from loaded rows.
- The focused resolver proof covers flat non-apparel child rows plus parent rows whose `category_children` are initially empty, and confirms reconstructed top-level ancestors expose actual loaded child rows for chip navigation.
- The focused resolver proof covers a flat child with missing parent rows and confirms the resolver returns the flat category without fake ancestry.
- The focused resolver proof covers `apparel_t_shirts_short_sleeves` and confirms ancestry through `apparel_t_shirts` to `apparel`, with parent `metadata.filterTypes` preserved.
- The focused resolver proof confirms the returned top-level `display` ancestor still exposes child categories for chip navigation.
- The focused resolver proof confirms `toProductCategory(resolved)` and `getNonApparelCategoryChips(toProductCategory(resolved))` terminate for a reconstructed non-apparel child.
- If a live payload is captured, the implementation report states whether the payload contains rooted non-apparel children, flat duplicate rows, `parent_category_id` links, or some combination.
- Browser-only screenshots or visual route checks are not accepted as the only proof for this task.

**Verification:**
- Run: `yarn dlx tsx /tmp/divinipress-current-category-resolution-proof.ts`
- Expected: prints/pass-confirms duplicate rooted precedence, parent-id reconstruction, child-list reconstruction from actual loaded rows, missing-parent fallback, apparel ancestor metadata preservation, display chip children preservation, and adapter/chip termination.
- Run: `jq '.product_categories | map({handle, id, parent_category_id, child_count: ((.category_children // []) | length), children: ((.category_children // []) | map({handle, id, parent_category_id, child_count: ((.category_children // []) | length)}))}) | map(select(.handle | test("^(display|print|promo|apparel)")))' /tmp/divinipress-category-payload.json`
- Expected: if the payload file exists, output includes the loaded `display`, `print`, `promo`, and `apparel` category rows, with enough child or parent-id data to explain why the resolver should classify child routes correctly.

**Stop conditions:** If the focused resolver proof cannot import the real exported resolver, stop and fix Task 1 before proceeding. If no authenticated storefront/backend pair is available, report that live payload capture and route verification are blocked, but do not replace the focused resolver proof with copied logic.

### Task 3: Verify Catalog Routes And Preserve Product Routing

**Centurio sub-skill:** `medusa-dev:building-storefronts`

**Files:**
- Modify: none

**Objective:** Prove the user-facing route contract after the resolver change.

**Decisions already made:**
- Preserve `/catalog/[category]` for category browse.
- Preserve `/catalog/[category]/[productHandle]` for product detail.
- Do not introduce `/catalog/display/banners`, `/catalog/print/cards`, or `/catalog/promo/pens`.
- Use authenticated browser verification against a backend dataset containing Display, Print, Promo, and Apparel categories.

**Acceptance:**
- Desktop and mobile non-apparel category pages hide apparel filter chrome and still show non-apparel header/chip navigation.
- Apparel category pages still show filter chrome, and `/catalog/apparel_t_shirts_short_sleeves` remains ancestry-scoped rather than falling back to every available tag group.
- Search, sort, grid/list view, favorites, product cards, pagination, and product counts keep existing behavior during the checked routes.
- Clicking a product card from a non-apparel category still reaches the existing `getCatalogProductUrl` product-detail URL.
- Product-detail breadcrumbs still link to the route category segment and do not imply nested category browse semantics.

**Verification:**
- Run: `yarn tsc --noEmit`
- Expected: exits 0.
- Run: `yarn dev`
- Expected: storefront starts successfully for authenticated browser checks.
- Check desktop routes: `/catalog/display`, `/catalog/display_banners`, `/catalog/display_flags`, `/catalog/display_signs`, `/catalog/display_table_covers`, `/catalog/display_tents`, `/catalog/print`, `/catalog/print_cards`, `/catalog/print_marketing`, `/catalog/print_stationary`, `/catalog/promo`, `/catalog/promo_pens`.
- Expected: no desktop filter sidebar on those non-apparel routes; non-apparel header/chips remain visible.
- Check mobile routes: at minimum `/catalog/display` and `/catalog/display_banners`.
- Expected: no mobile filter button on those non-apparel routes.
- Check apparel routes: `/catalog/apparel`, `/catalog/apparel_t_shirts`, `/catalog/apparel_t_shirts_short_sleeves`.
- Expected: apparel filter chrome remains visible.
- On `/catalog/apparel_t_shirts_short_sleeves`, inspect the visible filter groups.
- Expected: filter groups are scoped through apparel ancestry, including `apparel_t_shirts` parent metadata, rather than showing every available tag group as a fallback.
- Check product detail: click one product card from a non-apparel category and directly load one known route matching `/catalog/display/<known-display-product-handle>`.
- Expected: product detail still renders, and the breadcrumb category link points to the route category segment, not `/catalog/display/banners`.

**Stop conditions:** If local auth or backend data prevents route verification, stop and report the exact blocker. Do not substitute unauthenticated redirects or an empty backend dataset for route proof.
