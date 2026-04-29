# Non-Apparel Catalog Browse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Storefront implementation tasks also require `building-storefronts` (the Codex-visible storefront rig for the spec's `medusa-dev:building-storefronts` requirement).

**Goal:** Align catalog nav, browse cards, browse queries, and browse-to-PDP URLs with the imported Print/Promo/Display category tree while preserving apparel behavior.

**Architecture:** This is a frontend-only catalog browse patch in `/Users/milovan/projects/worktrees/divinipress-store/feature/div-87-non-apparel-catalog-landing`. The implementation carries `subtitle` and `type` through the existing catalog product adapter, uses that data in the existing route helper and card surfaces, adds hook-safe shallow product previews inside `CatalogNav`, and narrows preferred query splitting to deep top-level branches. No backend routes, saved-product paths, PDP rendering, landing-popularity logic, or category-image fallback code are in scope.

**Tech Stack:** Next.js 16 App Router, React 19, React Query, Axios-backed existing catalog hooks via `@lib/api/storeApi`, shadcn/Base UI navigation components, TypeScript.

---

## Verified Ground

- Spec: `/Users/milovan/projects/Consilium/docs/cases/2026-04-27-non-apparel-catalog-browse/spec.md`
- Execution cwd: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-87-non-apparel-catalog-landing`
- Frontend branch: `feature/div-87-non-apparel-catalog-landing`
- Backend precondition: backend running from `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/` with non-apparel sample data seeded.
- Existing catalog fetchers are Axios-backed hooks under `src/app/_api/catalog/`; this plan preserves that local pattern instead of migrating catalog browse to the Medusa SDK.
- Current dirty storefront state before implementation: untracked `.serena/` and `AGENTS.md`. They are not part of this implementation.
- Current Consilium docs state before this plan: two unrelated untracked case folders exist under `docs/cases/2026-04-28-*`. They are not part of this plan.
- Current static baseline: `npx tsc --noEmit --pretty false` exits 0 and `yarn lint:changed` exits 0. Full `yarn lint --quiet` is known-bad before this implementation with 23 React/Next lint errors outside this bundle, including `src/app/(authenticated)/admin/orders/_hooks/useAdminOrdersTable.ts`, `src/app/(authenticated)/catalog/_hooks/useCategoryFilters.ts`, `src/app/(authenticated)/products/layout.tsx`, `src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx`, `src/app/(authenticated)/profile/_hooks/useProfileForm.ts`, `src/app/(authenticated)/team/layout.tsx`, `src/app/_domain/custom-order/hooks/useProofNotes.ts`, `src/app/_hooks/useIsMounted.ts`, `src/app/_hooks/useMediaQuery.ts`, `src/app/log-in/page.tsx`, `src/components/app-sidebar.tsx`, `src/components/ui/first-time-hint.tsx`, `src/hooks/useMediaQuery.ts`, and `src/hooks/useMounted.ts`.
- Saved products are not part of this case. Do not add saved-product filters, tests, or route branches. If a future local dataset exposes saved products through `/store/custom-products`, that is a separate product/data cleanup lane; this plan verifies imported catalog-product samples only.

## File Map

- `src/app/_api/catalog/getCatalogProducts.ts` - add `subtitle` and `type.*` to the fields string used by landing/search and new nav previews.
- `src/app/_api/catalog/getProductsByCategory.ts` - add `subtitle` and `type.*` to the fields string used by category browse grids.
- `src/lib/catalog/types.ts` - extend the internal `Product` contract and `toProduct()` adapter to carry `subtitle` and `type.value`.
- `src/app/_utils/product-routes.ts` - route imported non-apparel catalog products through top-level `print`, `promo`, or `display` segments before falling back to leaf category handles.
- `src/components/catalog/catalog-product-card.tsx` - render non-apparel `product.subtitle` in card mode.
- `src/components/catalog/catalog-product-grid.tsx` - render non-apparel `product.subtitle` in browse list mode.
- `src/components/catalog/catalog-nav.tsx` - preserve deep branch rendering and add shallow branch product text previews through a hook-safe child component.
- `src/app/(authenticated)/catalog/[category]/page.tsx` - keep preferred product query splitting only when the top-level branch has depth-2 category children.

## Do Not Widen

- Do not touch saved products, `/products/*`, proofing, cart, order detail, or PDP rendering.
- Do not modify backend importer code or backend routes.
- Do not add a browse-page category rail, tabs, section picker, or new category UI.
- Do not change `/catalog` Popular Right Now logic.
- Do not add image fallback code for `public/category_images/<handle>.webp`.
- Do not introduce new dependencies or a new data-fetching abstraction.
- Do not run project-wide formatting.

---

### Task 0: Establish Baseline Before Editing
> **Confidence: High** — supports [spec §10 — Sample verification (DIV-86)](spec.md#10-sample-verification-div-86) and [spec §12 — Success criteria](spec.md#12-success-criteria); verified `npx tsc --noEmit --pretty false` exits 0 and `yarn lint:changed` exits 0 before source edits in this worktree.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Verify only. No source edits.

- [ ] **Step 1: Confirm pre-edit working tree state**

Run:

```bash
git status --short
```

Expected: no tracked source edits. Untracked `.serena/` and `AGENTS.md` may appear and must remain uncommitted unless the Imperator says otherwise.

- [ ] **Step 2: Run pre-edit type baseline**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: exits 0.

- [ ] **Step 3: Run pre-edit scoped lint baseline**

Run:

```bash
yarn lint:changed
```

Expected: exits 0. Current verified output before implementation was `lint:changed: no changed TS/JS files vs origin/develop.`

- [ ] **Step 4: Do not use full lint as a regression gate**

Do not run `yarn lint` or `yarn lint --quiet` as the dispatch gate for this bundle. Full lint is known-bad before implementation with 23 unrelated errors. The regression gate for this plan is `npx tsc --noEmit --pretty false` plus `yarn lint:changed`.

---

### Task 1: Carry Non-Apparel Browse Fields And Route Segments
> **Confidence: High** — implements [spec §8 — Browse-to-PDP routing harmonization (DIV-88 + DIV-86)](spec.md#8-browse-to-pdp-routing-harmonization-div-88--div-86) and [spec §9 — Product card (DIV-89)](spec.md#9-product-card-div-89); verified both catalog fetchers currently omit `subtitle` and `type.*`, `Product`/`toProduct()` strip them, and `getCatalogProductUrl()` falls back to leaf category handles before `type.value`.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Modify: `src/app/_api/catalog/getCatalogProducts.ts`
- Modify: `src/app/_api/catalog/getProductsByCategory.ts`
- Modify: `src/lib/catalog/types.ts`
- Modify: `src/app/_utils/product-routes.ts`

- [ ] **Step 1: Update the popular/custom-products fields parameter**

In `src/app/_api/catalog/getCatalogProducts.ts`, replace the fields string with:

```typescript
fields:
  "title,subtitle,metadata,images,thumbnail,handle,type.*,options.*,company_product.*,categories.*",
```

- [ ] **Step 2: Update the category/custom-products fields parameter**

In `src/app/_api/catalog/getProductsByCategory.ts`, replace the fields string with:

```typescript
fields:
  "title,subtitle,description,metadata,images,thumbnail,handle,type.*,options.*,company_product.*,categories.*",
```

- [ ] **Step 3: Extend the internal catalog product type**

In `src/lib/catalog/types.ts`, add this interface after `ProductCategory` and before `Product`:

```typescript
export interface ProductType {
  value?: string | null
}
```

Then replace the `Product` interface with:

```typescript
export interface Product {
  id: string
  title: string
  subtitle?: string | null
  handle: string
  thumbnail: string
  metadata: StoreProductMetadata
  company_product: CompanyProduct
  options: ProductOption[]
  images: ProductImage[]
  categories: ProductCategory[]
  type?: ProductType | null
}
```

- [ ] **Step 4: Extend the `toProduct()` adapter**

In `src/lib/catalog/types.ts`, replace `toProduct()` with:

```typescript
export function toProduct(p: StoreProduct): Product {
  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle ?? null,
    handle: p.handle,
    thumbnail: p.thumbnail ?? "",
    metadata: (p.metadata ?? {}) as unknown as StoreProductMetadata,
    company_product: p.company_product
      ? {
          id: p.company_product.id,
          price: p.company_product.price,
          company_id: p.company_product.company_id,
        }
      : { id: "", price: 0, company_id: "" },
    options: (p.options ?? []).map((o) => ({
      id: o.id,
      title: o.title ?? "",
      values: (o.values ?? []).map((v) => ({
        id: v.id,
        value: v.value,
        option_id: v.option_id ?? o.id,
      })),
    })),
    images: (p.images ?? []).map((img) => ({ id: img.id, url: img.url })),
    categories: (p.categories ?? []).map(toProductCategory),
    type: p.type ? { value: p.type.value ?? null } : null,
  }
}
```

- [ ] **Step 5: Reorder catalog URL fallback narrowly for Print/Promo/Display**

In `src/app/_utils/product-routes.ts`, replace the `CatalogProduct` interface, old fallback-chain comment, and `getCatalogProductUrl()` block with:

```typescript
interface CatalogProduct {
  handle?: string | null;
  metadata?: { production_option_type?: string | null } | null;
  categories?: { handle: string }[] | null;
  type?: { value?: string | null } | null;
}

const PRODUCT_TYPE_ROUTE_SEGMENTS: Record<string, string> = {
  Print: "print",
  Promo: "promo",
  Display: "display",
};

function getProductTypeRouteSegment(value?: string | null): string | undefined {
  if (!value) return undefined;
  return PRODUCT_TYPE_ROUTE_SEGMENTS[value];
}

/**
 * Build catalog product URL: /catalog/{category}/{handle}
 * Category fallback chain:
 *   product.metadata?.production_option_type
 *   ?? top-level segment from product.type.value for imported non-apparel
 *   ?? product.categories?.[0]?.handle
 *   ?? 'products'
 */
export function getCatalogProductUrl(product: CatalogProduct): string {
  const category =
    product.metadata?.production_option_type ??
    getProductTypeRouteSegment(product.type?.value) ??
    product.categories?.[0]?.handle ??
    "products";
  return `/catalog/${category}/${product.handle ?? ""}`;
}
```

- [ ] **Step 6: Run type verification for the contract plumbing**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: exits 0. If it fails on these touched files, fix the named type error without widening scope.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/app/_api/catalog/getCatalogProducts.ts src/app/_api/catalog/getProductsByCategory.ts src/lib/catalog/types.ts src/app/_utils/product-routes.ts
git commit -m "feat: carry non-apparel catalog route fields"
```

---

### Task 2: Render Non-Apparel Subtitles In Cards And List Rows
> **Confidence: High** — implements [spec §9 — Product card (DIV-89)](spec.md#9-product-card-div-89); verified card mode currently reads non-apparel `metadata.styleName`, list mode currently reads `metadata.brandName`, and the adapter from Task 1 supplies `product.subtitle`.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Modify: `src/components/catalog/catalog-product-card.tsx`
- Modify: `src/components/catalog/catalog-product-grid.tsx`

- [ ] **Step 1: Add the non-apparel subtitle value in card mode**

In `src/components/catalog/catalog-product-card.tsx`, add this line after `const colorCount = colorOption?.values?.length ?? 0`:

```typescript
const standardSubtitle = product.subtitle?.trim()
```

- [ ] **Step 2: Replace the card subtitle render block**

In `src/components/catalog/catalog-product-card.tsx`, replace the current apparel and standard subtitle blocks with:

```tsx
{isApparel && product.metadata.brandName && (
  <p className="text-xs text-muted-foreground truncate mb-1.5">
    {product.metadata.brandName} &middot; {product.metadata.styleName}
  </p>
)}

{!isApparel && standardSubtitle && (
  <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
    {standardSubtitle}
  </p>
)}
```

- [ ] **Step 3: Add the non-apparel subtitle value in list mode**

In `src/components/catalog/catalog-product-grid.tsx`, inside `products.map((product) => {`, replace the single `colorCount` declaration with:

```typescript
const colorCount = product.options?.find((o) => o.title === "Color")?.values?.length ?? 0
const isApparel = variant === "apparel"
const standardSubtitle = product.subtitle?.trim()
```

- [ ] **Step 4: Replace the list subtitle render block**

In `src/components/catalog/catalog-product-grid.tsx`, replace:

```tsx
{product.metadata.brandName && (
  <p className="text-xs text-muted-foreground">{product.metadata.brandName}</p>
)}
```

with:

```tsx
{isApparel && product.metadata.brandName && (
  <p className="text-xs text-muted-foreground">{product.metadata.brandName}</p>
)}
{!isApparel && standardSubtitle && (
  <p className="text-xs text-muted-foreground truncate">{standardSubtitle}</p>
)}
```

- [ ] **Step 5: Run scoped verification**

Run:

```bash
npx tsc --noEmit --pretty false
yarn lint:changed
```

Expected: both commands exit 0. If lint reports pre-existing unrelated files, keep this task fixed and record the exact unrelated path in the task handoff.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/components/catalog/catalog-product-card.tsx src/components/catalog/catalog-product-grid.tsx
git commit -m "feat: show non-apparel catalog subtitles"
```

---

### Task 3: Add Shallow Branch Product Previews To CatalogNav
> **Confidence: Medium** — implements [spec §5 — Catalog mega-menu (DIV-87 nav)](spec.md#5-catalog-mega-menu-div-87-nav); verified `CatalogNav` currently renders only category links and hook calls must live in a child component. The preview component intentionally renders nothing before product data resolves; that keeps the menu from adding temporary loading rows, but it means loading, error, and true zero-product states look the same until manual verification confirms seeded products.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Modify: `src/components/catalog/catalog-nav.tsx`

- [ ] **Step 0: Accept the current eager-preview tradeoff**

Do not add open-state plumbing or request-budget machinery. Mounting one preview child per shallow leaf means preview queries fire when `CatalogNav` renders, not when a menu opens. This is accepted for the current small Print/Promo/Display tree to keep the implementation simple; Task 5 verifies the visible behavior against seeded data.

- [ ] **Step 1: Update imports**

In `src/components/catalog/catalog-nav.tsx`, add `useMemo`, `useGetPopularProducts`, `getCatalogProductUrl`, and `toProduct`:

```typescript
import { useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Heart, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { toProduct, type ProductCategory } from "@/lib/catalog/types"
import { categoryDisplayName } from "@/lib/catalog/format"
import { useGetPopularProducts } from "@api/catalog/getCatalogProducts"
import { getCatalogProductUrl } from "@utils/product-routes"
```

- [ ] **Step 2: Add structural branch helpers and the hook-safe preview component**

Add these functions after `CatalogNavProps`:

```tsx
function hasDepthTwoCategories(category: ProductCategory): boolean {
  return (
    category.category_children?.some(
      (child) => (child.category_children?.length ?? 0) > 0
    ) ?? false
  )
}

function ShallowCategoryPreview({ category }: { category: ProductCategory }) {
  const { data } = useGetPopularProducts({
    categoryId: category.id,
    limit: 4,
  })

  const products = useMemo(
    () => (data?.pages.flat() ?? []).map(toProduct),
    [data]
  )

  if (products.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-1">
      {products.map((product) => (
        <NavigationMenuLink
          key={product.id}
          render={<Link href={getCatalogProductUrl(product)} />}
          className="text-sm py-0.5"
        >
          {product.title}
        </NavigationMenuLink>
      ))}
      <NavigationMenuLink
        render={<Link href={`/catalog/${category.handle}`} />}
        className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        View All &rarr;
      </NavigationMenuLink>
    </div>
  )
}
```

- [ ] **Step 3: Replace the category map render with deep-vs-shallow branching**

In `CatalogNav`, replace the current `categories.map((category) => (` block with:

```tsx
{categories.map((category) => {
  const isDeepBranch = hasDepthTwoCategories(category)

  return (
    <NavigationMenuItem key={category.handle}>
      <NavigationMenuTrigger
        className={cn(
          activeCategory === category.handle &&
            "bg-muted/50"
        )}
      >
        {category.name}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="p-6">
        <div className="flex flex-wrap gap-8 min-w-[500px]">
          {category.category_children?.map((sub) => (
            <div key={sub.handle}>
              <NavigationMenuLink
                render={
                  <Link
                    href={`/catalog/${sub.handle}`}
                  />
                }
                className="block text-xs font-semibold uppercase text-muted-foreground mb-2 hover:text-foreground"
              >
                {categoryDisplayName(sub.name)}
              </NavigationMenuLink>
              {isDeepBranch && sub.category_children && sub.category_children.length > 0 && (
                <div className="flex flex-col">
                  {sub.category_children.map((child) => (
                    <NavigationMenuLink
                      key={child.handle}
                      render={
                        <Link
                          href={`/catalog/${child.handle}`}
                        />
                      }
                      className="text-sm py-0.5"
                    >
                      {categoryDisplayName(child.name)}
                    </NavigationMenuLink>
                  ))}
                </div>
              )}
              {!isDeepBranch && <ShallowCategoryPreview category={sub} />}
            </div>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
})}
```

- [ ] **Step 4: Run scoped verification**

Run:

```bash
npx tsc --noEmit --pretty false
yarn lint:changed
```

Expected: both commands exit 0. If React reports a hook-order problem, the preview fetch is not in the child boundary correctly; keep hooks inside `ShallowCategoryPreview`.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add src/components/catalog/catalog-nav.tsx
git commit -m "feat: add shallow catalog nav previews"
```

---

### Task 4: Keep Preferred Browse Query Split Apparel-Only By Structure
> **Confidence: High** — implements [spec §7 — Category browse page (DIV-88)](spec.md#7-category-browse-page-div-88); verified current browse page always runs `collectPreferredIds(category, PREFERRED_HANDLES)` against the current category, while the spec requires the deep-vs-shallow decision to come from the top-level ancestor.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Modify: `src/app/(authenticated)/catalog/[category]/page.tsx`

- [ ] **Step 1: Add top-level structural helpers**

In `src/app/(authenticated)/catalog/[category]/page.tsx`, add these helpers after `collectPreferredIds` and before `PREFERRED_HANDLES`:

```typescript
function getTopLevelCategory(cat: StoreProductCategory): StoreProductCategory {
  let current = cat
  while (current.parent_category) {
    current = current.parent_category
  }
  return current
}

function hasDepthTwoCategories(cat: StoreProductCategory): boolean {
  return (
    cat.category_children?.some(
      (child) => (child.category_children?.length ?? 0) > 0
    ) ?? false
  )
}
```

- [ ] **Step 2: Compute the branch shape from the top-level ancestor**

Add this memo after the existing `variant` memo:

```typescript
const isDeepBranch = useMemo(() => {
  if (!category) return false
  return hasDepthTwoCategories(getTopLevelCategory(category))
}, [category])
```

- [ ] **Step 3: Gate preferred IDs by branch shape**

In the existing preferred/other IDs memo, replace:

```typescript
const preferred = collectPreferredIds(category, PREFERRED_HANDLES)
```

with:

```typescript
const preferred = isDeepBranch
  ? collectPreferredIds(category, PREFERRED_HANDLES)
  : []
```

Then update that memo dependency array from:

```typescript
}, [category])
```

to:

```typescript
}, [category, isDeepBranch])
```

- [ ] **Step 4: Run scoped verification**

Run:

```bash
npx tsc --noEmit --pretty false
yarn lint:changed
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add 'src/app/(authenticated)/catalog/[category]/page.tsx'
git commit -m "feat: keep catalog preferred query split structural"
```

---

### Task 5: Verify The Bundle Against Named Catalog Samples
> **Confidence: Medium** — implements [spec §10 — Sample verification (DIV-86)](spec.md#10-sample-verification-div-86) and [spec §12 — Success criteria](spec.md#12-success-criteria); the checks are derivative of the prior tasks and require a running storefront plus seeded backend to observe all UI behavior.

**Soldier sub-skill:** Invoke `Skill(skill: "building-storefronts")` on arrival.

**Files:**
- Verify only. No source edits unless a preceding task failed verification.

- [ ] **Step 1: Confirm working tree only contains intended implementation changes**

Run:

```bash
git status --short
```

Expected: no unstaged tracked source changes from Tasks 1-4. Untracked `.serena/` and `AGENTS.md` may still appear and must remain uncommitted unless the Imperator says otherwise.

- [ ] **Step 2: Run final static verification**

Run:

```bash
npx tsc --noEmit --pretty false
yarn lint:changed
```

Expected: both commands exit 0. Do not use full `yarn lint` as this bundle's regression gate; the full lint baseline is known-bad before implementation.

- [ ] **Step 3: Start the storefront for manual verification**

Run:

```bash
yarn dev
```

Expected: Next.js serves the storefront locally. If the default port is occupied, use the next port Next.js offers and record it.

- [ ] **Step 4: Establish an authenticated storefront session**

Use an existing seeded customer/company login for the backend running at `NEXT_PUBLIC_API_URL`. Log in through `/log-in`, then open `/catalog`.

Expected:
- `/catalog` does not redirect back to `/log-in`.
- The browser Network panel shows `GET /store/product-categories?include_descendants_tree=true` returning 200.
- The browser Network panel shows at least one `GET /store/custom-products` request returning 200.

If no valid seeded login is available in the local environment, stop manual UI verification and report it as blocked by missing auth credentials. Do not add auth bypasses.

- [ ] **Step 5: Verify landing category cards**

With the post-DIV-82 backend running and seeded, open `/catalog`.

Expected:
- `Apparel`, `Print`, `Promo`, and `Display` cards render.
- `public/category_images/apparel.webp` renders for Apparel.
- Missing `print.webp`, `promo.webp`, or `display.webp` does not block the page.

- [ ] **Step 6: Verify browse pages and route shape**

Open these routes:

```text
/catalog/print
/catalog/promo
/catalog/display
/catalog/apparel
/catalog/print_cards
/catalog/promo_pens
/catalog/display_banners
```

Expected:
- Each existing route renders the catalog browse view.
- Non-apparel browse grids load products from current category plus descendants.
- Apparel browse still renders as apparel.

- [ ] **Step 7: Verify mega-menu branch rendering**

Use the catalog nav on `/catalog` or any browse page.

Expected:
- `Apparel` shows the existing depth-3 category list.
- `Print`, `Promo`, and `Display` show depth-1 section headers with up to four product title links and a `View All ->` affordance for seeded leaves that have products.
- For a seeded leaf that has products, missing product links are a failure, not an acceptable empty state. Check the Network panel for the corresponding `GET /store/custom-products?category_id=<id>&limit=4` request returning 200.
- A shallow leaf with no products still shows its section header and does not show product links or `View All ->`.

- [ ] **Step 8: Verify browse-to-PDP URLs from both fetchers**

Click a non-apparel product from `/catalog/print_cards`, then click a non-apparel product from the `Print` mega-menu preview.

Expected:
- Browse grid click resolves to `/catalog/print/<product_handle>`.
- Mega-menu click resolves to `/catalog/print/<product_handle>`.
- Apparel browse click from `/catalog/apparel_t_shirts` resolves to `/catalog/apparel/<product_handle>`.

- [ ] **Step 9: Verify landing search uses the same route and subtitle contract**

On `/catalog`, search for a seeded non-apparel product such as `Business Cards`.

Expected:
- The search result card displays its non-apparel subtitle when `subtitle` is present.
- Clicking the search result resolves to `/catalog/print/<product_handle>`.

- [ ] **Step 10: Verify favorites uses the shared card and route helper**

On a non-apparel browse page, favorite a seeded non-apparel product, then open Favorites from the catalog nav.

Expected:
- The favorite card displays its non-apparel subtitle when `subtitle` is present.
- Clicking the favorite card resolves to `/catalog/<top_type>/<product_handle>`, for example `/catalog/print/<product_handle>`.

- [ ] **Step 11: Verify subtitles**

Check both grid view and list view on a non-apparel browse page.

Expected:
- Products with `subtitle` display that subtitle.
- Products with null or empty `subtitle` omit the subtitle row.
- Apparel product cards still display the existing apparel subtitle behavior.

- [ ] **Step 12: Close the verification task**

Stop the `yarn dev` process from Step 3 with `Ctrl-C`, then run:

```bash
git status --short
```

Expected: no tracked source changes remain after Tasks 1-4. If Task 5 uncovered a defect, stop here and return to the owning task before committing another source change.
