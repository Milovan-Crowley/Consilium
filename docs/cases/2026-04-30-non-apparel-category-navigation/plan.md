# Non-Apparel Category Navigation Implementation Plan

**Goal:** Replace apparel filter UI on Print, Display, and Promo category pages with a compact category header and route-navigation chips, while preserving apparel catalog behavior.

**Architecture:** This is a storefront-only change. Add one small category helper, one presentational header/chip component, a narrow tag-filter gate in the existing category filter hook, and page wiring in the current catalog category page. Do not change backend importer data, product cards, PDPs, saved products, or the top catalog nav.

**Tech Stack:** Next.js 16 App Router, React 19, React Query, existing Axios catalog hooks, shadcn/Base UI Button styling, Tailwind CSS, TypeScript.

---

## Ground Rules

- Execution cwd: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-87-non-apparel-catalog-landing`
- Spec: `/Users/milovan/projects/Consilium/docs/cases/2026-04-30-non-apparel-category-navigation/spec.md`
- Existing dirty files before this work include `src/components/catalog/catalog-nav.tsx`, `.serena/`, and `AGENTS.md`. Do not revert, delete, or stage them for this feature.
- Use repo-local Yarn in this shell: `node .yarn/releases/yarn-4.3.1.cjs ...`
- If browser data is stale or missing non-apparel categories, stop and report it. Do not repair seed data in this storefront plan.

## Do Not Widen

- No backend changes.
- No seed repair.
- No new tag taxonomy.
- No option-based browse filters.
- No product-count chips.
- No client-side filtering chips.
- No product-card redesign.
- No apparel filter redesign.
- No admin UI for category descriptions.

---

### Task 1: Add Non-Apparel Category Helpers
> **Confidence: High** - implements [spec §Description Copy](spec.md#description-copy), [spec §Category Navigation Chips](spec.md#category-navigation-chips), and [spec §Data Contract](spec.md#data-contract). Existing category data includes `handle`, `name`, `parent_category`, and `category_children`.

**File:** create `src/lib/catalog/non-apparel-categories.ts`

Build a small helper module that owns only non-apparel category navigation data and rules.

Required exports:

- `getNonApparelTopLevelCategory(category)` returns the top-level category only when its handle is `display`, `print`, or `promo`; otherwise `null`.
- `getNonApparelCategoryTitle(category)` returns the display name using the existing `categoryDisplayName`.
- `getNonApparelCategoryDescription(category)` returns mapped copy by `category.handle`, falling back to `Browse products in this category.`
- `getNonApparelCategoryChips(category)` returns route chips in this shape: `{ handle, href, label, isActive }`.

Use the exact handle-to-description copy from [spec §Description Copy](spec.md#description-copy). Fallback copy is `Browse products in this category.`

Chip rules:

- Root chip is always `All Display`, `All Print`, or `All Promo`.
- Child chips come from `topLevelCategory.category_children`, not tags, options, or hardcoded product data.
- Preferred child order is:
  - Display: `display_banners`, `display_signs`, `display_flags`, `display_table_covers`, `display_tents`
  - Print: `print_cards`, `print_marketing`, `print_stationary`
  - Promo: `promo_pens`
- Unknown future children sort after the preferred handles by display name.
- Active state is route-based: root active on root page; child active when the current category is that child or inside that child branch.
- Chips never include product counts.

---

### Task 2: Add The Non-Apparel Header Component
> **Confidence: High** - implements [spec §Page Header](spec.md#page-header) and [spec §Chip Visual Treatment](spec.md#chip-visual-treatment). The repo already exports `buttonVariants` from `src/components/ui/button.tsx`.

**File:** create `src/components/catalog/non-apparel-category-header.tsx`

Create a client component that accepts `category: StoreProductCategory`.

Render:

- Compact `h1` from `getNonApparelCategoryTitle(category)`.
- Short description from `getNonApparelCategoryDescription(category)`.
- A wrapping `nav` of `next/link` chips from `getNonApparelCategoryChips(category)`.

Visual requirements:

- Header is quiet, not a hero.
- Chips are medium density, roughly shadcn `Button` `size="sm"`.
- Inactive chips use neutral outline/soft styling.
- Active chip uses subtle primary/green tint and `aria-current="page"`.
- Active chip must not use full primary fill.
- No counts, badges, icons, or extra explanatory text.

Do not add defensive empty-state UI. The page should only render this component for approved non-apparel branches, and the helper always provides at least the root chip.

---

### Task 3: Gate Tag Filters Without Breaking Shared Catalog State
> **Confidence: High** - implements [spec §Filter Removal](spec.md#filter-removal). `useCategoryFilters` owns search, sort, view mode, pagination, and tag filter state; only the tag-filter portion should be disabled for approved non-apparel branches.

**Files:**

- Modify `src/app/_api/catalog/getProductTags.ts`
- Modify `src/app/(authenticated)/catalog/_hooks/useCategoryFilters.ts`

Changes:

- Let `useGetProductTags` accept an optional `enabled = true` argument and pass it to React Query.
- Add `enableTagFilters = true` to `useCategoryFilters`.
- When tag filters are disabled:
  - do not fetch product tags
  - return empty `filterGroups`
  - return empty `filterLabels`
  - return `hasActiveFilters: false`
  - return empty `activeTagIds`
  - prevent tag toggle/remove handlers from mutating filter state
- Preserve search, debounced search, sort, view mode, pagination, and their setters.
- Clear selected tag filters when category or `enableTagFilters` changes.

This must prevent hidden apparel tag IDs from still affecting non-apparel product queries.

---

### Task 4: Wire The Category Page
> **Confidence: High** - implements [spec §Applicability](spec.md#applicability), [spec §Product Toolbar](spec.md#product-toolbar), and [spec §Product Grid](spec.md#product-grid). `src/app/(authenticated)/catalog/[category]/page.tsx` already derives current category, renders `CatalogNav`, `CatalogToolbar`, mobile filter sheet, desktop filter rail, product grid, and pagination.

**File:** modify `src/app/(authenticated)/catalog/[category]/page.tsx`

Changes:

- Import `NonApparelCategoryHeader`.
- Import `getNonApparelTopLevelCategory`.
- Derive `nonApparelTopLevelCategory` from the current category.
- Treat only top-level branches `display`, `print`, and `promo` as the new non-apparel experience.
- Use `showFilterChrome = category ? !nonApparelTopLevelCategory : false`.
- Pass `enableTagFilters: showFilterChrome` into `useCategoryFilters`.
- Build `tagFilter` only when `showFilterChrome` is true.
- Render `NonApparelCategoryHeader` after `CatalogNav` only when `nonApparelTopLevelCategory` exists.
- Pass empty `selectedFilters` into `CatalogToolbar` when filter chrome is hidden, but keep product count, grid/list toggle, and sort unchanged.
- Render mobile filter sheet only when `showFilterChrome` is true.
- Render desktop filter rail only when `showFilterChrome` is true.
- Pass `hasActiveFilters={showFilterChrome && hasActiveFilters}` into `CatalogProductGrid`.

Must preserve:

- `CatalogNav` and search.
- Sort behavior.
- Grid/list view mode.
- Pagination.
- Favorites view behavior.
- Product card behavior.
- Apparel filter behavior.
- Existing behavior for category branches outside `display`, `print`, and `promo`.

---

### Task 5: Verify
> **Confidence: Medium** - implements [spec §Verification Expectations](spec.md#verification-expectations). Browser verification depends on local auth and seeded data, but this plan does not repair seed data.

Static checks:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit --pretty false
node .yarn/releases/yarn-4.3.1.cjs eslint -- src/lib/catalog/non-apparel-categories.ts src/components/catalog/non-apparel-category-header.tsx src/app/_api/catalog/getProductTags.ts 'src/app/(authenticated)/catalog/_hooks/useCategoryFilters.ts' 'src/app/(authenticated)/catalog/[category]/page.tsx'
```

Do not treat `lint:changed` as the only lint gate before committing. It diffs committed branch files against the base ref and can miss unstaged implementation edits. After the implementation is committed or staged intentionally, `node .yarn/releases/yarn-4.3.1.cjs lint:changed` may be run as an additional branch-level check.

Browser smoke:

- `/catalog/display_banners`
  - title `Banners`
  - Display chips with no counts; `Banners` active
  - no desktop filter rail or mobile `Filters` trigger
  - search still visible in `CatalogNav`
- `/catalog/print`
  - `All Print`, `Cards`, `Marketing`, `Stationary`
  - no chip counts; product count only in toolbar
- `/catalog/promo_pens`
  - `All Promo` and `Pens`
  - `Pens` active; chip row renders on the leaf page
- one apparel category page
  - filter rail/sheet and selected filter chips still work
  - search, sort, grid/list, and product count remain available

If the browser redirects to login, pause and ask the Imperator to log in manually. Do not ask for credentials in chat.

If non-apparel categories are missing or stale in local data, stop and report the data issue. Do not run backend seed repair as part of this plan.

## Final Gate

The work is complete only when:

- TypeScript exits 0.
- Direct ESLint on the touched implementation files exits 0.
- Browser smoke covers Display, Print, Promo, and Apparel.
- No unrelated dirty files are staged.
