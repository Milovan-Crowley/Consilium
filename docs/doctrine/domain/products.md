---
domain: products
description: Catalog vs saved products, product creation on approval, image hydration, variant metadata, reorder flow
sources:
  - src/api/custom-order/order-flow.ts
  - src/modules/custom-order/service.ts
verified: 2026-04-09
---

# Products

How products exist in the system — from vendor blanks to customer-owned saved products.

## Concepts

### Catalog Product
**Is:** A blank product from a vendor (e.g., "Bella Canvas 3001"). Has multiple colors and sizes as variants. Needs configuration (color selection, artwork placement, decoration type) and proofing before it becomes orderable for staff.
**Is not:** Ready to order as-is. A customer cannot buy a catalog product directly — it must go through the proofing flow to become a saved product, or be ordered via Save & Add to Cart (which still creates a custom order).

### Saved Product
**Is:** A new Medusa product entity created when a catalog proof is approved. It's a separate product record — not a reference or bookmark pointing at the original catalog product. Locked to one color (variants filtered to the selected color during creation). Skips proofing on reorder.
**Is not:** A favorited or bookmarked catalog product. Not a cart item. Not a wishlist entry. It's a fully independent product entity with its own ID, variants, and metadata.

### How Saved Products Are Created
When `approveProof` fires on a `catalog` proof type, `order-flow.ts` creates a new product:
- Copies title, description, images, tags, categories from original catalog product
- Filters variants to only the selected color
- Removes the Color option — saved product variants have Size only
- Sets `metadata: { ...original.metadata, custom_order_id: <co_id> }` — this links it back
- Creates CompanyProduct record linking it to the company
- Links to "Webshop" sales channel

### Variant Metadata Inheritance
Saved product variants inherit ALL metadata from the original catalog variant (images, colorName, colorCode, colorSwatchImage, etc.) plus fields added by approveProof:
- `original_variant_id` — UUID of the original catalog variant
- `original_sku`, `original_upc` — for inventory lookup
- `original_title` — original catalog product title
- `selections` — artwork placements, decoration type from the proof
- `design_notes` — from the proof

### Image Hydration
**Is:** A runtime overlay. When super admins upload `product_thumbnail` and `product_image` files during proofing, those uploads live on the custom_order record, NOT on the saved product itself. The saved product's `thumbnail` and `images` fields still point to the original catalog product images. At serve time, `hydrateImages()` overrides them with the custom order uploads.
**Is not:** Writing upload URLs to the product record. The product record always has the original catalog images — hydration happens at the API response level.

Called by: `GET /api/company/my-products` and `GET /api/store/custom-products`.

### Reorder Flow
When a saved product is purchased via `custom-complete` with `proof_type: "order"`:
1. Backend detects `product.metadata.custom_order_id` is set
2. Fetches `product_name` from the original custom order
3. Creates new custom_order with `job_status: "approved"`, `order_status: "proof_done"` — skips proofing entirely
4. Sets `metadata: { original_custom_order_id: <original_co_id> }` on the new custom order

### Product Metadata Fields
Live on `product.metadata`, seeded during apparel import:
- `brandName` — "Port Authority", "Bella Canvas", etc.
- `styleName` — "J317", "3001", etc.
- `vendor` — "ss" (S&S Activewear)
- `production_option_type` — "apparel"
- `custom_order_id` — present only on saved products, links back to original proof

### Product Categories
Apparel (screen printing, DTG, embroidery), Printed Materials, Promotional Products, Display Items. Custom sourcing available for products not in catalog.

## Rules

- Catalog products MUST go through proofing to become saved products.
- Saved products are locked to one color — variants are filtered during creation.
- Saved product images come from custom order uploads via runtime hydration, not the product record.
- `product.metadata.custom_order_id` is the link from saved product to original proof.
- Saved product reorders skip proofing entirely — they start at approved/proof_done.

## Code Pointers

- Saved product creation: `src/api/custom-order/order-flow.ts` (approveProof side effects)
- Image hydration: `src/modules/custom-order/service.ts` (hydrateImages)
- Saved product PDP: `src/app/_api/store/getProductByHandle.ts`
- Saved product hook: `src/app/_hooks/useSavedProduct.ts`

## Related

- How proofs lead to saved products → also load **proofing.md**
- Staff access to saved products via collections → also load **teams-collections.md**
- Product name vs product title naming trap → also load **naming.md**
