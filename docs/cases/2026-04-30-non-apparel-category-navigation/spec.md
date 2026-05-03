# Non-Apparel Category Navigation Spec

Date: 2026-04-30
Status: Draft for Imperator review
Surface: Divinipress Store catalog category pages
Primary repo: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-87-non-apparel-catalog-landing`
Backend evidence repo: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy`

## Intent

Replace apparel-only filter controls on non-apparel catalog category pages with understated category navigation chips.

The current page shows apparel tag filters such as age/gender, finish/treatment, and style on non-apparel pages like Display > Banners. That is misleading because the DIV-82 importer does not seed non-apparel tags or clean faceted browse attributes. It does seed a reliable product-type/category hierarchy for Print, Display, and Promo.

The new experience should help customers pivot within a product type without pretending that category navigation is fast client-side filtering.

Confidence: High - user explicitly approved subcategory chips over apparel filters, and importer reconnaissance confirmed tags are empty while category hierarchy is real.

## Estimate-Lite

### Intent

Make non-apparel category pages feel deliberate and truthful: clear page heading, short category description, full-width product grid, and local product-type navigation.

### Effects

Customers on Print, Display, or Promo category pages no longer see apparel filters. They see a category page header plus navigation chips such as `All Display`, `Banners`, `Signs`, `Flags`, `Table Covers`, and `Tents`.

### Terrain

The storefront category page currently determines apparel-vs-standard rendering, fetches tag-based filter state, renders `CatalogNav`, renders `CatalogToolbar`, renders a mobile filter sheet, and renders a desktop filter sidebar beside `CatalogProductGrid`.

The backend importer creates product types and category hierarchy for non-apparel products, but definitions have empty tag arrays. Options exist, but they are product configuration dimensions, not browse facets.

### Forces

This is a storefront UI change with backend data-shape constraints. It must preserve existing apparel behavior while giving non-apparel pages their own browse treatment.

### Coordination

No backend change is required for this pass. Browser verification may require a clean or repaired seed state because prior DIV-87 work showed non-force seeding can preserve stale category trees.

### Control

Success is visible on category pages:

- Apparel pages still show existing apparel filters.
- Print, Display, and Promo pages never show apparel filter rails or filter sheets.
- Non-apparel pages always show category navigation chips, including leaf pages and thin branches like Promo > Pens.
- Chip labels have no product counts.
- Product count remains only in the normal product toolbar.

## User-Facing Contract

### Applicability

This treatment applies to every catalog category page whose top-level category is one of:

- `print`
- `display`
- `promo`

This includes top-level category pages, child category pages, and leaf category pages. For example, Promo > Pens still renders the chip row even if Promo currently has only one child category.

Apparel category pages keep the existing apparel filter experience.

Confidence: High - user explicitly said not to hide chips on leaf pages, including Pens.

### Page Header

Non-apparel category pages get a compact page header above the product grid:

- `h1`: current category display name, for example `Banners`
- description: short category-specific copy
- product toolbar: product count, grid/list toggle, and sort control stay on the right side of the product-control area

The header should be quiet and operational, not a hero section.

The existing top catalog navigation and search input remain above this header. The new category chip row is category-local navigation; it does not replace `CatalogNav` or remove search.

Confidence: High - user explicitly liked the title + description from the Claude Design handoff.

### Description Copy

The storefront should own the first version of category descriptions through a small local copy map keyed by backend `category.handle`, with a generic fallback for unknown future categories.

Copy keys and chip routes must use real backend handles, not display labels. For imported non-apparel child categories, handles are prefixed by product type, such as `display_banners`, `print_stationary`, and `promo_pens`.

Initial copy direction:

| Handle | Display label | Description |
|-|-|-|
| `display` | Display | Banners, signs, flags, table covers, tents, and event display pieces. |
| `display_banners` | Banners | Retractable stands, backdrops, and pole banners for events and venues. |
| `display_signs` | Signs | Signage for wayfinding, promotion, events, and everyday ministry spaces. |
| `display_flags` | Flags | Portable flags for entrances, campaigns, and outdoor visibility. |
| `display_table_covers` | Table Covers | Branded table covers for booths, lobbies, welcome areas, and events. |
| `display_tents` | Tents | Canopies and tent displays for outdoor events and ministry gatherings. |
| `print` | Print | Printed materials for events, outreach, mailings, and everyday communication. |
| `print_cards` | Cards | Cards for invitations, announcements, events, and follow-up. |
| `print_marketing` | Marketing | Flyers, postcards, and printed outreach pieces for campaigns and events. |
| `print_stationary` | Stationary | Branded paper goods for notes, letters, and daily communication. |
| `promo` | Promo | Promotional products for giveaways, events, and ministry visibility. |
| `promo_pens` | Pens | Custom pens for events, welcome teams, gifts, and everyday use. |

If a category has no mapped description, fallback copy should be neutral:

`Browse products in this category.`

Confidence: Medium - user approved the page description idea, but exact wording has not been individually approved.

### Category Navigation Chips

Non-apparel pages render a horizontal chip row directly under the page header and before the product grid.

The row is route navigation, not filtering:

- Each chip navigates to a category route using the backend category handle.
- The active chip marks the current category route.
- Clicking a chip should not mutate selected filter state.
- Chips must not show product counts.
- Chips should not display `0`, `7`, or any other inventory number.

Each non-apparel row includes:

- an `All <Product Type>` chip linking to the top-level product-type category
- one chip for each child category under that top-level product type

Expected labels from current importer shape:

| Product Type | Chips |
|-|-|
| Display | All Display, Banners, Signs, Flags, Table Covers, Tents |
| Print | All Print, Cards, Marketing, Stationary |
| Promo | All Promo, Pens |

The chip row always renders for non-apparel, including leaf pages.

Confidence: High - user explicitly approved these labels and explicitly rejected chip counts.

### Chip Visual Treatment

The chips should be medium-density navigation controls, not primary CTA buttons.

Observable requirements:

- medium height, roughly matching small-to-medium shadcn button density
- compact horizontal padding
- 13-14px text
- inactive chips use neutral soft or outline treatment
- active chip uses understated state, preferably soft green background with deep green text
- active chip must not use full primary green fill
- no giant buttons
- no counts

The row should look like the Claude Design "soft chip" direction: quiet, scan-friendly, and subordinate to the page title and product grid.

Confidence: High - user rejected giant buttons and primary green; user liked the understated Claude Design structure.

### Product Toolbar

The existing product count, grid/list toggle, and sort control remain product-grid controls. They must not be merged into the chip row.

Product count remains visible as normal toolbar text, for example `7 products`.

Confidence: High - user explicitly said chip counts make the chips feel like filters; keeping count in the toolbar preserves the correct meaning.

### Filter Removal

For non-apparel category pages:

- do not render the desktop apparel filter rail
- do not render the mobile filter sheet trigger
- do not render selected filter chips
- do not apply tag filters from apparel filter state

Search and sort remain available. The existing search input remains visible in the top catalog navigation and continues to affect the product query.

For apparel category pages:

- keep existing filter rail, mobile filter sheet, selected filter chips, search, sort, and view-mode behavior

Confidence: High - the whole feature exists to remove apparel filters from print/display/promo pages.

### Product Grid

When the non-apparel filter rail is absent, the product grid should use the available width. It should preserve existing product-card behavior, favorite behavior if present, loading state, empty state, pagination, view mode, and sort behavior.

No product-card redesign is required in this spec.

Confidence: High - user approved navigation/header treatment, not a card redesign.

## Data Contract

### Backend Data Shape

The implementation must treat backend categories as the navigation source of truth. The importer evidence establishes:

- non-apparel product types are created from definitions as Print, Display, and Promo
- child categories are created under the product type
- tags are present in the importer path but empty in all scanned definitions
- options are configurator dimensions, not browse facets

Therefore, this feature must use category hierarchy for chips and must not derive non-apparel chips from tags, options, variant metadata, or invented display-only classifications.

Confidence: High - importer reconnaissance scanned 46 definitions and confirmed all `tags` arrays are empty.

### Active State

The active chip is determined by the current category route:

- if current category is the top-level product type, `All <Product Type>` is active
- if current category is a child or leaf under the product type, the matching child-category chip is active

For deeper future category trees, the active chip should represent the top-level child branch under the product type, not a synthetic facet.

Confidence: Medium - current importer shape is two levels for this lane, but this keeps the rule stable if children gain descendants later.

### Copy Source

Category descriptions are storefront-owned for this pass. Backend category metadata is not required.

Future work may move category descriptions into backend category metadata if merchandising copy becomes admin-managed.

Confidence: Medium - local copy is the simplest route now, but backend metadata is a plausible later improvement.

## Non-Goals

- No backend importer changes.
- No seed repair.
- No new non-apparel tag taxonomy.
- No option-based browse filters.
- No product-count chips.
- No client-side filtering chips for non-apparel.
- No product-card redesign.
- No changes to apparel filters.
- No new admin UI for editing category descriptions.

Confidence: High - these were either explicitly rejected or outside the approved path.

## Acceptance Criteria

1. On `/catalog/display` and Display child pages, the page shows `All Display`, `Banners`, `Signs`, `Flags`, `Table Covers`, and `Tents` chips with no counts.
2. On `/catalog/print` and Print child pages, the page shows `All Print`, `Cards`, `Marketing`, and `Stationary` chips with no counts.
3. On `/catalog/promo` and Promo child pages, the page shows `All Promo` and `Pens` chips with no counts.
4. On a leaf page such as Pens, the chip row still renders and `Pens` is active.
5. Non-apparel pages do not show apparel filter rail groups such as Age / Gender, Finish & Treatment, or Style.
6. Non-apparel pages do not show a mobile Filters sheet trigger.
7. Non-apparel chips navigate to category pages and do not toggle product filter state.
8. The active chip uses a subtle state, not a full primary green CTA fill.
9. Product count remains in the toolbar only.
10. Search remains visible and functional on non-apparel category pages.
11. Apparel category pages retain existing filter behavior.

## Verification Expectations

Minimum verification for implementation:

- TypeScript check for touched storefront files.
- Changed-file lint check.
- Browser smoke on one Apparel page and at least one page under each non-apparel product type: Display, Print, and Promo.
- Browser smoke must specifically check that chip counts are absent.

Operational caveat: if local browser data still shows stale categories, verify against source category tree or use a clean/approved seed repair path before judging the UI behavior.

## Confidence Map

| Section | Confidence | Reason |
|-|-|-|
| Remove apparel filters for non-apparel | High | User goal and importer evidence align. |
| Always show chips on non-apparel pages | High | User explicitly confirmed leaf pages and Pens. |
| No chip counts | High | User explicitly added this requirement. |
| Soft chip visual treatment | High | User rejected giant buttons and liked Claude Design's understated look. |
| Local description copy | Medium | User liked title + description, but exact text still needs taste review. |
| Active branch rule for deeper future trees | Medium | Current data is shallow enough; future deeper category trees are inferred. |

## Open Review Items

1. Copy taste pass: the descriptions above are implementation-ready but should be treated as editable product copy.
2. Category label spelling: source shape says `stationary`; if the actual category is meant to be office paper goods, a later content cleanup may choose `Stationery`. This spec does not require that cleanup.
