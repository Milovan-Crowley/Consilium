# DIV-87 + DIV-88 + DIV-89 + DIV-86 — Non-apparel catalog browse alignment

**Status:** ready for plan (iteration 4 — scope tightened against defensive spec inserts)

**Iteration 4 changes against iteration 3.** Four scope-tightening corrections after Imperator review:
1. **Browse-page hierarchy wording corrected.** §7/§10/§12 no longer imply new visible browse-page subcategory UI. Apparel's customer-facing 3-level hierarchy remains product type → category → subcategory-like bucket; implementation only preserves/removes the existing preferred product-query split.
2. **Saved-product detour removed.** This bundle stays on catalog browse. It does not add saved-product filtering, special cases, or defensive route behavior for a case not currently in scope.
3. **Nav fetch shape pinned only as far as React requires.** §5 keeps `CatalogNav` as the preview owner but requires hook calls to live in a hook-legal child component or equivalent stable boundary. No generic request-budget machinery.
4. **URL safety kept narrow.** §8 targets the current imported branch set (`print`, `promo`, `display`) and permits a simple map or normalize-equivalent. No taxonomy engine.

**Iteration 3 changes against iteration 2.** Three corrections surfaced by the second-consul review and verified against live code:
1. **PDP non-goal corrected.** §3 said standard PDP rendering for non-apparel was a follow-up ticket. Live code at `getProductByHandle.ts:110-118` + `[productHandle]/page.tsx:998-1000` shows the `StandardPDP` dispatcher already routes products through `adaptToStandardProduct` whenever `metadata.production_option_type !== "apparel"`. The non-apparel importer at `_custom/utils/promo-print-product/importer.ts:80-99` stamps `options_order`/`options_labels`/`options_styles`/`options_values` — the exact metadata `adaptToStandardProduct` requires (`:37`, `:39`). PDP rendering for non-apparel catalog products is therefore already wired; this bundle does not touch it.
2. **`type.value` URL safety pinned to backend handle convention.** §8 fallback chain step 2 now expresses the contract as "URL segment must equal the top-level `product_category.handle` for the product's branch" rather than raw `type.value.toLowerCase()`. Backend parent handles use `normalizeValue` (`_custom/utils/helper.ts:10-26`). For this bundle, implementation may use a simple `Print|Promo|Display` map or apply `normalizeValue`-equivalent transformation; HOW is plan-territory.
3. **Backend worktree path corrected.** Line 22 had the parent directory. Now points at the actual worktree path: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/`.

**Iteration 2 changes against iteration 1.** Six structural fixes from the §14 verification merge:
1. **Two fetchers, both patched.** §8 now names `getProductsByCategory.ts:24-25` alongside `getCatalogProducts.ts:21` — both must carry `type.*` and `subtitle` in their fields parameter or browse-grid → PDP regresses to leaf-handle URLs.
2. **`Product` adapter plumbing.** §9 enumerates the three coupled changes (extend `Product` interface, extend `toProduct()`, then card consumes `product.subtitle`/`product.type`). Same plumbing applies to `type` for the routing chain.
3. **Mega-menu render primitive locked.** §5 specifies text-link list (title only — no thumbnail, no price, no subtitle in the mega-menu preview).
4. **Nav becomes data-aware.** §5 commits: `CatalogNav` owns shallow-branch product previews; hook calls must live in a hook-legal child component or equivalent stable boundary. Component prop shape unchanged for callers.
5. **Branch discriminator pinned.** §7 clarifies the discriminator runs against the top-level ancestor of the current view, not the current view itself.
6. **List-mode coverage.** §9 covers `catalog-product-grid.tsx:74-78`'s list-view subtitle path.

Plus removals: price contract removed from §1.4 and §9 (no code change exists — `formatPrice` already unifies the `+` suffix). §10 step 9 removed. Reference fixes: `companyApi` → `storeApi`; "entire `_api/` layer" → "catalog browse `_api/` hooks." Confidence downgrades on §5, §10, §12 (deferred sub-decisions and derivative confidence).

**Linear (lead):** [DIV-87 — Align catalog landing and nav to imported non-apparel category tree](https://linear.app/divinipress/issue/DIV-87/align-catalog-landing-and-nav-to-imported-non-apparel-category-tree)
**Linear (bundled):**
- [DIV-88 — Align category browse and browse-to-PDP links for imported non-apparel](https://linear.app/divinipress/issue/DIV-88/align-category-browse-and-browse-to-pdp-links-for-imported-non-apparel)
- [DIV-89 — Use imported non-apparel metadata intentionally in browse cards and list rows](https://linear.app/divinipress/issue/DIV-89/use-imported-non-apparel-metadata-intentionally-in-browse-cards-and)
- [DIV-86 — Verify named non-apparel browse samples and finalize route/category fallback rule](https://linear.app/divinipress/issue/DIV-86/verify-named-non-apparel-browse-samples-and-finalize-routecategory)

**Worktree branch:** `feature/div-87-non-apparel-catalog-landing` (currently 3 tooling commits ahead of develop — ESLint 9 flat config, lint-changed.sh, .nvmrc pin)
**Backend baseline:** `feature/div-82-importer-hierarchy` worktree at `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/` (commit `377a9d9`). Includes the DIV-82 importer hierarchy fix and Yuning's DIV-99 non-apparel cart contract series merged into this worktree. No backend modifications required for this bundle. (Note: backend `develop` does not yet carry these changes; the bundle's verification flows assume the seeded state produced by this worktree's importer.)

---

## 1. Summary

Align the storefront catalog browse pipeline with the imported non-apparel category tree produced by the post-DIV-82 importer. Apparel browse, mega-menu, card, and routing behavior are preserved exactly; non-apparel branches gain intentional treatment across five contract surfaces:

1. **Catalog mega-menu** (`CatalogNav`) renders Option C 3-level structure for non-apparel branches: top-level category → sub-category section header → top-4 products + "View All →" link. Apparel branches keep depth-3 categories.
2. **Catalog landing** renders top-level category cards for all top-level categories the backend tree returns (apparel + non-apparel). Image assets supplied out-of-band at `public/category_images/<handle>.webp`. The "Popular Right Now" section is untouched.
3. **Category browse page** (`/catalog/<handle>`) drops the apparel-only preferred product-query split for non-apparel branches; apparel branches keep `apparel_t_shirts` preferred-first.
4. **Product cards** render `product.subtitle` (when non-empty) for non-apparel subtitle in both grid and list view modes. Apparel subtitle (`brandName · styleName`) preserved. The `Product` interface and `toProduct()` adapter are extended to carry `subtitle` and `type` through to the card; the API fields parameter alone is not sufficient.
5. **Browse-to-PDP routing** harmonized so non-apparel URLs use the top-level category segment matching apparel's pattern (`/catalog/print/<handle>` instead of `/catalog/print_cards/<handle>`). Achieved via fallback-chain reorder in `getCatalogProductUrl` plus including `type.*` and `subtitle` in **both** `/store/custom-products` fields parameters (`getCatalogProducts.ts:21` AND `getProductsByCategory.ts:24-25` — the browse-grid fetcher is separate from the popular fetcher).

This bundle covers DIV-87 (landing + nav), DIV-88 (browse page + browse-to-PDP), DIV-89 (cards), and DIV-86 (sample verification + finalized routing rule). Frontend-only.

> **Confidence: High** — Imperator-confirmed scope across four deliberation rounds; backend recon evidence cited inline.

---

## 2. Motivation

Catalog browse today encodes apparel-specific assumptions in five places:

1. **Mega-menu shallow branches.** For non-apparel (Print/Promo/Display), `CatalogNav` walks `category_children` two levels deep (`catalog-nav.tsx:42-88`) but the backend produces only a 2-level non-apparel tree (`importer.ts:204-269`). Section headers (Cards, Pens, Banners) render with no content underneath; users see empty submenus.
2. **Browse page preferred ordering.** `[category]/page.tsx:63: PREFERRED_HANDLES = ["apparel_t_shirts"]` exists to make apparel T Shirts appear first in product results. Non-apparel branches do not need that apparel-only preferred query split.
3. **Card subtitle.** `catalog-product-card.tsx:76-90` renders `brandName · styleName` from product metadata — apparel-meaningful only. Non-apparel products carry a `product.subtitle` field (`importer.ts:141`, e.g., `"Professional, personal, and memorable."` for Business Cards) that is currently unused.
4. **Browse-to-PDP routing asymmetry.** Apparel produces `/catalog/apparel/<handle>` (via `metadata.production_option_type === "apparel"`); non-apparel falls through to `/catalog/<leaf_handle>/<handle>` because the importer does not stamp `production_option_type`. Different URL shapes for the same kind of traversal.
5. **Landing category card images.** `catalog/page.tsx:175-200` loads `public/category_images/<handle>.webp` per top-level category. Only `apparel.webp` exists today; non-apparel cards 404 their image and render the gradient overlay alone.

Backend has produced a stable non-apparel tree (top: `Print/Promo/Display` at `importer.ts:209-243`; child: `Cards/Pens/Banners/...` at `:246-268`) plus a stable Medusa `product_type` mirror entity (`:171-192`). DIV-99 has merged the cart contract for non-apparel transactional metadata. The browse pipeline is the next surface to align.

> **Confidence: High** — backend shape verified at cited importer line numbers; frontend hard-filters verified at cited storefront line numbers.

---

## 3. Non-goals

- **Landing "Popular Right Now" section.** Hardcoded to `apparel_t_shirts` filter at `useCatalogLanding.ts:38-51`. Imperator-decided: out of scope for this bundle. Section stays apparel-pinned until a future ticket replaces it with a real popularity signal.
- **Category card images for non-apparel.** Image assets at `public/category_images/<handle>.webp` are supplied by the Imperator out-of-band (`print.webp`, `promo.webp`, `display.webp`). No code change. Missing image: gradient overlay still renders (current behavior at `catalog/page.tsx:175-200`).
- **Apparel mega-menu, browse, or card behavior.** Untouched. The bundle branches on category-tree shape (or top-level branch type) to preserve apparel rendering exactly.
- **Backend hierarchy work.** Backend produces 2-level non-apparel category tree. Frontend does not synthesize a third *category* level. The mega-menu's third visual level surfaces *products*, not categories.
- **Apparel mega-menu product preview.** Apparel branches keep depth-3 categories; no 4-product preview added (apparel has thousands of products per leaf, no useful curation signal at nav depth).
- **PDP rendering for imported non-apparel products.** PDP routing is verified by this bundle (DIV-86 line); PDP *rendering* is not. PDP rendering for non-apparel catalog products is handled by the existing `StandardPDP` dispatcher (`[productHandle]/page.tsx:998-1000`), which `getProductByHandle.ts:110-118` routes any product satisfying `adaptToStandardProduct`'s preconditions through. The non-apparel importer (`_custom/utils/promo-print-product/importer.ts:80-99`) stamps the `options_order`/`options_labels`/`options_styles`/`options_values` metadata `adaptToStandardProduct` requires (`getProductByHandle.ts:37, 39`), so non-apparel imports route to `StandardPDP` automatically. This bundle does not modify the PDP layer.
- **Search behavior.** Catalog search bar untouched.
- **Free Tee Promo.** Apparel-themed marketing surface untouched; gated on existing `promoEligible` signal.
- **Backend modifications.** No importer change, no backend route change. Bundle is frontend-only.
- **`production_option_type` stamping on imported non-apparel products.** Backend importer does not stamp this field; bundle does not request it. Routing harmonization uses Medusa `product_type.value` instead (§8).
- **Storefront SDK migration.** Catalog browse `_api/` hooks use Axios via `@lib/api/storeApi` (`storeApi`) for `/store/*` routes. The `_api/` layer is mixed: cart paths and `saveAndAddToCart` already use the Medusa JS SDK. The medusa-dev:building-storefronts skill recommends Medusa JS SDK exclusively. The bundle reuses existing Axios hooks for catalog browse; migrating catalog hooks to SDK is a separate ticket.

> **Confidence: High** — Imperator-confirmed in deliberation; project conventions cited from AGENTS.md.

---

## 4. Backend tree shape (boundary contract)

The mega-menu, landing cards, and browse page consume the response from `GET /store/product-categories?include_descendants_tree=true`. Non-apparel branches have a known shape established by the post-DIV-82 importer; nothing in this bundle modifies it.

**Top-level (depth 0) category nodes for non-apparel.** `Print` (handle `print`), `Promo` (handle `promo`), `Display` (handle `display`). All `parent_category_id: null`. Source: `importer.ts:209` (parent name = title-cased `definition.product_type`), `:215` (parent handle = `normalizeValue(productType.toLowerCase())`), `:221-243` (parent upsert with `parent_category_id` unset).

**Depth-1 category nodes.** `Cards` (handle `print_cards` under Print), `Pens` (handle `promo_pens` under Promo), `Banners` (handle `display_banners` under Display), and any other `definition.category` value present in the seed data (e.g., `Flags`, `Marketing`, `Signs`, `Stationary`, `Table Covers`, `Tents`). Source: `importer.ts:210, 216-218, 246-268`.

**Depth-2.** None for non-apparel. Products are linked to the depth-1 leaf category only (`importer.ts:154-156`).

**Apparel branch (separate seeder, contrast).** `Apparel` (handle `apparel`) at depth 0 → `Apparel:T Shirts` (handle `apparel_t_shirts`) at depth 1 → `Apparel:T Shirts:Short Sleeves` (handle `apparel_t_shirts_short_sleeves`) at depth 2. Names use `:`-delimited convention per `CATEGORY_NAVIGATION_CONFIG` at `src/scripts/helpers/get-apparel-categories.ts:94-180`. `categoryDisplayName` (`src/lib/catalog/format.ts:6-9`) strips before the last colon for display.

**Branch discriminator (load-bearing).** A top-level branch is "deep" if any of its depth-1 children carries a non-empty `category_children` array; otherwise "shallow." Apparel is deep; non-apparel is shallow. The discriminator is structural — it does not hard-code handles or names — so a future apparel-shape addition automatically gets deep rendering and a future non-apparel addition gets shallow rendering.

**Product-side contract (response from `GET /store/custom-products`):**

- `title: string`
- `subtitle: string | null` — Medusa core Product field. Importer maps `definition.subtitle → product.subtitle` (`importer.ts:141`). Sample value: `"Professional, personal, and memorable."` (`business_cards_definition.json:6`). **The bundle requires `subtitle` to be present in the response — included via fields parameter (§8) — AND surfaced through the storefront's internal `Product` adapter (§9). Wire-shape availability alone is insufficient; the adapter at `src/lib/catalog/types.ts:95-121` strips fields not enumerated.**
- `description: string | null` — Medusa core. Importer maps `definition.description_md → product.description` (`importer.ts:142`). Long-form, not used by browse cards.
- `handle: string` — URL slug (e.g., `business-cards`).
- `thumbnail: string | null`
- `images: { url: string }[]`
- `categories: { id, handle, name, parent_category_id }[]` — links from product to category. Non-apparel: depth-1 leaf only per `importer.ts:154-156`. Apparel: per apparel seeder.
- `type: { id, value, metadata } | null` — Medusa `product_type` relation. Value carries title-cased product type (`"Print" | "Promo" | "Display"` for non-apparel per `importer.ts:171-192`; apparel has its own value). **The bundle requires `type.*` to be present in the response — included via fields parameter (§8) — AND surfaced through the storefront's internal `Product` adapter (§9), same coupling as `subtitle`.**
- `metadata: Record<string, any>` — apparel-only fields include `production_option_type: "apparel"`. Non-apparel-only fields include `product_type` (string), `short_description`, `multipliers`, `multiplier_keys`, `base_option_keys` (per DIV-99 contract, importer-stamped).
- `company_product.price: number` — per-customer-company pricing. **Stored in dollars, NOT cents** (Medusa convention; consume directly without dividing by 100).
- `options[]`, `variants[]` — present on response but not consumed by browse surfaces in this bundle.

> **Confidence: High** — fields verified at importer line numbers; Medusa price-display convention confirmed via medusa-dev:building-storefronts skill (`display-price-format` rule). Sample subtitle value verified at `business_cards_definition.json:6`.

---

## 5. Catalog mega-menu (DIV-87 nav)

`CatalogNav` (`src/components/catalog/catalog-nav.tsx`) renders catalog browse navigation in both landing (`catalog/page.tsx:63-68`) and browse (`[category]/page.tsx:253-260`) routes. Per-top-level-branch rendering depends on the branch type from §4.

**Deep branch rendering (apparel) — preserved.** Top-level menu trigger; submenu shows depth-1 categories as section headers, depth-2 categories as flat link list under each section header. Each section header navigates to `/catalog/<depth_1_handle>`. Each depth-2 link navigates to `/catalog/<depth_2_handle>`. No change.

**Shallow branch rendering (non-apparel) — new:**

- Top-level menu trigger labeled with the top category name (`Print | Promo | Display`).
- Submenu shows depth-1 categories as section headers; each section header navigates to `/catalog/<depth_1_handle>`.
- Under each section header, render top-N=4 products from `GET /store/custom-products?category_id=<depth_1_id>&limit=4` as a **text-link list**. Each entry is a single `<Link>` displaying `product.title` only — no thumbnail, no price, no subtitle inside the mega-menu preview. Each product link navigates to its PDP via `getCatalogProductUrl(product)` (§8).
- Below the product list, render "View All →" link navigating to `/catalog/<depth_1_handle>` (same target as the section header link, distinct affordance).

**Click semantics:**
- Section header (depth-1 category in either branch type) → `/catalog/<depth_1_handle>` browse page.
- Depth-2 category link (deep branches only) → `/catalog/<depth_2_handle>` browse page.
- Product link (shallow branches only) → PDP URL via `getCatalogProductUrl(product)`.
- "View All →" link (shallow branches only) → `/catalog/<depth_1_handle>` (same as section header).

**Empty / partial states (shallow branches):**
- Depth-1 leaf with 0 products: section header still renders and is navigable; product list and "View All →" are omitted.
- Depth-1 leaf with 1-3 products: render what exists; no padding placeholders. "View All →" still rendered.
- Top-level shallow branch with 0 depth-1 children: trigger renders; submenu opens empty (matches current behavior for any empty branch).

**Fetch ownership and caching.** `CatalogNav` owns shallow-branch product previews. The hook calls for leaf previews must live in a hook-legal child component or equivalent stable boundary, using `useGetPopularProducts({ categoryId: <depth_1_id>, limit: 4 })` per shallow leaf. Component prop shape unchanged for callers (still accepts `categories: ProductCategory[]`). React Query cache keys are inherited from the existing hook; subsequent menu opens render from cached data when available. Section headers render synchronously from the already-loaded category tree; product previews populate when their per-leaf fetch resolves. Pre-resolution rendering treatment is plan-decided.

> **Confidence: Medium** — render primitive (text-link list), nav ownership, and hook-safe boundary requirement are pinned; pre-resolution loading treatment remains plan-decided.

---

## 6. Catalog landing (DIV-87 landing)

The landing page (`/catalog`, `src/app/(authenticated)/catalog/page.tsx`) renders top-level category cards plus the popular-products section.

**Top-level category cards.** One card per top-level category returned by `GET /store/product-categories?include_descendants_tree=true`, filtered to `parent_category_id === null` (`useCatalogLanding.ts:32-36`). Existing rendering at `catalog/page.tsx:175-200`. Card displays category name and image at `public/category_images/<handle>.webp`; click navigates to `/catalog/<handle>`. **The bundle does not modify the rendering code.** New non-apparel categories (Print/Promo/Display) appear automatically as the backend tree returns them.

**Image asset placement (out-of-band).**
- Apparel: `apparel.webp` exists at `public/category_images/apparel.webp` (no change).
- Non-apparel: `print.webp`, `promo.webp`, `display.webp` (filenames match `importer.ts:215`'s `normalizeValue(productType.toLowerCase())` output) supplied by Imperator. Place at `public/category_images/<top_handle>.webp`.
- Missing image: gradient overlay at `catalog/page.tsx:175-200` still renders (current behavior). No code-side fallback added in this bundle.

**Popular Right Now section — untouched.** `useCatalogLanding.ts:38-51`'s `apparel_t_shirts` hardcoded filter is preserved per non-goal §3. Section continues to render apparel popular products only.

**Search bar — untouched.**

> **Confidence: High** — landing recon at `catalog/page.tsx:175-200`, `useCatalogLanding.ts:31-51`; image directory contents verified.

---

## 7. Category browse page (DIV-88)

`/catalog/<handle>` (`src/app/(authenticated)/catalog/[category]/page.tsx`) renders the browse view. Two contract changes:

**Preferred product-query split.** Current browse logic uses `PREFERRED_HANDLES = ["apparel_t_shirts"]` to split descendant category IDs into a preferred query and an "everything else" query so apparel T Shirts appear first. The bundle:
- For apparel branches: retain the existing `apparel_t_shirts` preferred-first query behavior.
- For non-apparel branches: do not apply any preferred split; use the existing current-category-plus-descendants query flow without special ordering.

No new browse-page subcategory list, tabs, rail, or category-picker UI is part of this bundle.

**Branch discriminator — applied at the top-level ancestor.** The deep-vs-shallow discriminator from §4 runs against the **top-level ancestor** of the current view, not the current view itself. From any browse view, walk `parent_category` to the root (`parent_category_id === null`) and apply the structural check there. This preserves apparel preferred-ordering at all depths within the apparel branch (including deep-leaf views like `/catalog/apparel_t_shirts_short_sleeves` where the current node has no `category_children`).

**Variant detection — preserved.** `[category]/page.tsx:71-78`'s ancestor-walk variant detection (`apparel` vs `standard`) is unchanged; the binary already supports non-apparel as `standard`. No regression.

> **Confidence: High** — preferred-query logic confirmed at `[category]/page.tsx:63`; variant detection confirmed at `:71-78`; Imperator clarified that the customer-facing hierarchy matters, but no new browse-page subcategory UI is intended.

---

## 8. Browse-to-PDP routing harmonization (DIV-88 + DIV-86)

`getCatalogProductUrl` (`src/app/_utils/product-routes.ts:26-33`) constructs the PDP URL from a product. The current fallback chain:

```
metadata.production_option_type
  ?? categories[0].handle
  ?? type.value.toLowerCase()
  ?? "products"
```

For apparel imports (which stamp `metadata.production_option_type === "apparel"`), step 1 hits → `/catalog/apparel/<handle>`. **Top-level segment.**
For non-apparel imports (which do not stamp `production_option_type`), step 1 misses → step 2 hits → `categories[0].handle` is the depth-1 leaf (e.g., `print_cards`) → `/catalog/print_cards/<handle>`. **Leaf segment.** Asymmetric.

**Harmonization (DIV-86 finalized rule, observable contract):**

The fallback chain is reordered so non-apparel imports resolve to top-level segments matching the product's top-level `product_category.handle`:

```
metadata.production_option_type
  ?? <handle-safe top-level branch segment derived from type.value>
  ?? categories[0].handle
  ?? "products"
```

- **Apparel:** step 1 still hits → `/catalog/apparel/<handle>`. Unchanged.
- **Non-apparel:** step 1 misses → step 2 hits → segment derived from `type.value` (`"Print" | "Promo" | "Display"` per `importer.ts:171-192`). URL: `/catalog/print/<handle>`. **Symmetric with apparel.**

**URL-segment safety contract (step 2).** For this bundle, supported non-apparel branch segments are `print`, `promo`, and `display`. Step 2 must produce one of those top-level handles for imported non-apparel products. Implementation may use a simple explicit map from current `type.value` values (`Print`, `Promo`, `Display`) or apply `normalizeValue`-equivalent transformation to `type.value`. No broader taxonomy engine is required.

**Fields parameter requirement (TWO fetchers).** Two separate `/store/custom-products` fetcher hooks consume the contract; both must include `type.*` and `subtitle` in their fields parameter:

- `getCatalogProducts.ts:21` (`useGetPopularProducts`) — currently `"title,metadata,images,thumbnail,handle,options.*,company_product.*,categories.*"`. Used by landing popular section, landing search, and the new mega-menu shallow product preview (§5).
- `getProductsByCategory.ts:24-25` (`useGetProductsByCategory`) — currently `"title,description,metadata,images,thumbnail,handle,options.*,company_product.*,categories.*"`. Used by the category browse-page grid.

Without **both** fetchers updated: browse-grid → PDP routing falls through to step 3 (`categories[0].handle`, leaf segment) → URL becomes `/catalog/print_cards/<handle>` instead of the harmonized `/catalog/print/<handle>`. This breaks the load-bearing DIV-86 contract on the highest-traffic surface. Non-apparel browse-grid cards also render no subtitle (the field never populates).

**Edge-case fallback behavior:**
- Product with no `type` and no `production_option_type`: step 3 fires → `categories[0].handle` (current step-2 result). Non-regressing for any product with at least one category link.
- Product with no `type`, no `production_option_type`, no categories: step 4 fires → `"products"`. URL: `/catalog/products/<handle>`. Defensive default unchanged.

> **Confidence: High** — chain quoted from `product-routes.ts:26-33`; type-value source confirmed at `importer.ts:171-192`. Reorder is a contract-level rule; HOW (which lines to edit) is plan-territory.

---

## 9. Product card (DIV-89)

`CatalogProductCard` (`src/components/catalog/catalog-product-card.tsx`) renders cards on two surfaces: landing popular section and category browse grid. The mega-menu shallow product preview (§5) uses a text-link list, not the card component. The card's variant fork (`variant === "apparel" | "standard"`) at `:33` is preserved.

**Subtitle (card mode — grid view on browse page, popular section on landing).**
- **Apparel:** preserved — `brandName · styleName` from product metadata (current behavior at `:76-90`).
- **Non-apparel:** `product.subtitle` if present and non-empty, otherwise omit the subtitle row entirely. Source: importer maps `definition.subtitle → product.subtitle` (`importer.ts:141`). Sample: `"Professional, personal, and memorable."` (`business_cards_definition.json:6`).

**Subtitle (browse list mode).** `catalog-product-grid.tsx:74-78` renders the browse page's list-view path inline, bypassing `CatalogProductCard` and reading `metadata.brandName` directly. Apply the same non-apparel rule at the list-mode subtitle render: `product.subtitle` if non-empty (non-apparel branch), else omit the subtitle row.

**Field plumbing — three coupled changes.** Wire-shape availability via the fields parameter (§8) is necessary but not sufficient. The storefront's internal `Product` model and `toProduct()` adapter strip fields they don't enumerate. The bundle requires:

1. **`Product` interface extension** at `src/lib/catalog/types.ts:44-54`. Add:
   - `subtitle?: string | null`
   - `type?: { value?: string | null } | null`
2. **`toProduct(p: StoreProduct)` adapter extension** at `:95-121`. Copy:
   - `subtitle: p.subtitle ?? null`
   - `type: p.type ?? null`
3. **Consumer reads** in card and routing — read `product.subtitle` and `product.type` directly (not `metadata.subtitle`, not bypassing the adapter to raw `StoreProduct`).

Apparel cards continue reading their existing metadata fields; the adapter changes are additive.

> **Confidence: High** — subtitle field source verified at importer line; adapter coupling identified during iteration-1 verification (Edge-case + Assumption + Censor lanes, three-lane synergy). Price section removed in iteration 2 — `formatPrice` already unifies the `+` suffix; no code change exists.

---

## 10. Sample verification (DIV-86)

End-to-end manual checks confirming the bundle renders correctly against the post-DIV-82 backend dataset.

**Precondition:** Backend running against `feature/div-82-importer-hierarchy` worktree state with non-apparel sample data seeded (Print, Promo, Display top-level categories present; sample products imported into their leaf categories with `subtitle` populated and `type` relation set).

1. **Landing renders all top-level categories.** `/catalog` shows cards for `Print`, `Promo`, `Display`, and `Apparel`. Each card clickable to top-level browse.
2. **Top-level browse pages.** `/catalog/print`, `/catalog/promo`, `/catalog/display`, `/catalog/apparel` render the existing category browse view and load products through the current category-plus-descendants query flow.
3. **Sub-category browse pages.** `/catalog/print_cards`, `/catalog/promo_pens`, `/catalog/display_banners` (and equivalents present in seed) render product grids.
4. **Mega-menu shallow rendering (non-apparel).** Hovering or clicking `Print` in the mega-menu opens a submenu with `Cards` (and any other Print sub-categories) as section headers, each with the top 4 products displayed below + "View All →" link. Same for `Promo` and `Display`.
5. **Mega-menu deep rendering (apparel) — unchanged.** Hovering or clicking `Apparel` shows the existing depth-3 structure (`T Shirts → Short Sleeves`, etc.).
6. **Browse-to-PDP harmonized via both fetchers.** From `/catalog/print_cards` (browse-grid uses `getProductsByCategory`), click a product card. URL resolves to `/catalog/print/<product_handle>`. From the mega-menu Print branch (text-link list uses `getCatalogProducts`), click a product link. URL also resolves to `/catalog/print/<product_handle>`. From `/catalog/apparel_t_shirts`, click a product card. URL resolves to `/catalog/apparel/<product_handle>`. All three entry surfaces produce symmetric top-level URLs.
7. **Card subtitle (non-apparel) — both view modes.** Browse-grid mode: Print/Promo/Display product cards display `product.subtitle` (e.g., `"Professional, personal, and memorable."` for Business Cards). Browse list mode (`catalog-product-grid.tsx:74-78`): same rule. Cards/rows with empty/null subtitle omit the subtitle row entirely.
8. **Card subtitle (apparel) — unchanged.** Apparel cards display `brandName · styleName`.
9. **Browse preferred query behavior, applied at top-level ancestor.** `/catalog/apparel` keeps `T Shirts` preferred-first product ordering. `/catalog/apparel_t_shirts_short_sleeves` (deep-leaf within apparel) — discriminator walks ancestors to `apparel` root, returns "deep," and preserves apparel preferred-query behavior. `/catalog/print` uses the default current-category-plus-descendants query flow with no preferred override.
10. **Apparel parity.** All apparel browse, mega-menu, card, and routing surfaces visually and behaviorally identical to pre-bundle baseline.
11. **Lint and types clean.** `yarn lint` passes on touched files; `npx tsc --noEmit` exits 0.

> **Confidence: Medium** — verification flows derived from §5-§9 contracts (derivative confidence per iteration-1 audit).

---

## 11. Constraints

- **Frontend-only.** No backend modifications, no importer changes, no new routes.
- **Apparel must not regress.** Apparel mega-menu, browse, card, and routing behavior identical to pre-bundle baseline.
- **Bundle scope is fixed.** Catalog mega-menu shallow-branch rendering, browse page non-apparel preferred-query removal, product card + list-mode non-apparel subtitle, `Product` adapter extension for `subtitle`/`type`, browse-to-PDP routing harmonization (fallback-chain reorder + both fields parameters), sample verification. No expansion into PDP rendering, cart, or proofing surfaces.
- **Project conventions per AGENTS.md.** No Radix imports; no `!important`; no `asChild` (Base UI uses the `render` prop); shadcn-first, Base UI primitive when shadcn doesn't cover. Catalog browse `_api/` hooks use Axios via `@lib/api/storeApi` (`storeApi`) for `/store/*` routes; the `_api/` layer is mixed (cart paths and `saveAndAddToCart` already use the Medusa JS SDK). Bundle reuses existing Axios catalog hooks; SDK migration of catalog hooks is its own ticket.
- **Max 8 files changed outside primary edit dir per commit** (per AGENTS.md hard rule).
- **No project-wide formatting passes** (per AGENTS.md hard rule).
- **No new external dependencies.** Bundle reuses existing React Query hooks, existing routing helper, existing card component. New work scope: text-link list rendering inside `CatalogNav`, `Product` interface + `toProduct()` adapter extension, two fields-parameter strings updated, list-mode subtitle render path updated, `getCatalogProductUrl` fallback chain reordered.

> **Confidence: High** — constraints cited from AGENTS.md and Imperator-confirmed scope.

---

## 12. Success criteria

Observable outcomes that mark this bundle complete:

1. Catalog mega-menu non-apparel branches (Print/Promo/Display) each render `[depth-1 section header → top-4 product text-links → View All →]` shallow structure when the top-level branch has no depth-2 grandchildren.
2. Catalog mega-menu apparel branch renders unchanged depth-3 categories.
3. Click any non-apparel mega-menu product link → PDP at `/catalog/<top_handle>/<product_handle>`.
4. Click any non-apparel "View All →" link → category browse at `/catalog/<depth_1_handle>`.
5. `/catalog` landing renders Print/Promo/Display cards alongside Apparel; cards display image when supplied at `public/category_images/<handle>.webp`, gradient when not.
6. `/catalog/<top_handle>` (Print/Promo/Display) renders the existing browse view with no apparel-only preferred query split.
7. `/catalog/apparel` browse retains `apparel_t_shirts` preferred-first ordering at all depths within the apparel branch (discriminator applied at top-level ancestor).
8. Non-apparel product cards (browse-grid mode) and list rows (browse-list mode) display `product.subtitle` when non-empty; omit when null/empty. Apparel card subtitle (`brandName · styleName`) unchanged.
9. Browse-to-PDP URLs symmetric across all entry surfaces (browse-grid via `getProductsByCategory`, mega-menu via `getCatalogProducts`, landing popular via `getCatalogProducts`): apparel `/catalog/apparel/<handle>`, non-apparel `/catalog/<top_type>/<handle>` (`<top_type>` ∈ `{print, promo, display}`).
10. `Product` interface (`src/lib/catalog/types.ts:44-54`) carries `subtitle` and `type`; `toProduct()` adapter (`:95-121`) copies them from `StoreProduct`.
11. `yarn lint` clean on touched files; `npx tsc --noEmit` exits 0.
12. Sample verification flows §10 all pass against post-DIV-82 backend data.

> **Confidence: Medium** — success criteria derive from §5-§9 contracts (derivative confidence per iteration-1 audit). Direct verifiable observation requires running the bundle against seeded backend.
