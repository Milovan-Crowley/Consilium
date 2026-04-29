# DIV-74 Non-Apparel Proof Detail Rendering Plan

**Goal:** Show the submitted non-apparel proof detail metadata on customer and admin proof pages.

**Architecture:** Keep this inside the existing proof-detail path: raw proof response type, custom-order domain type, `adaptLineItems()`, and the two proof-detail pages. Reuse the PR #133 helpers already on this stacked branch. Do not add a shared renderer, sanitizer, backend change, or proof workflow change.

**Review Base:** `origin/feature/div-72-non-apparel-order-detail-rendering`

## Non-Goals

- No backend edits.
- No cart edits.
- No customer/admin order-detail edits.
- No proof lifecycle, approval, saved-product, or upload mutation edits.
- No new abstraction for option rendering.
- No generic defensive sanitizer for `options` or `options_labels`.
- No fallback from `production_option_type` to `product_type`.

## Files

- `src/app/_types/admin/proofs/proofBySubId.ts`
- `src/app/_domain/custom-order/types.ts`
- `src/app/_domain/custom-order/adapter.ts`
- `src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx`
- `src/app/(authenticated)/admin/proofs/[id]/page.tsx`

## Task 1: Preserve The Metadata

Add only the missing non-apparel metadata fields.

In `src/app/_types/admin/proofs/proofBySubId.ts`:
- Keep the existing proof metadata shape.
- Add optional `product_type?: string`, `options?: Record<string, string>`, and `options_labels?: Record<string, string>` to the top-level `metadata` shape and `order_line_items[].metadata` shape.
- Keep existing `group_id`, `upload_ids`, `selections`, `design_notes`, and `product_name` fields intact.

In `src/app/_domain/custom-order/types.ts`, extend `LineItem.metadata` with:

```ts
productType?: string
groupId?: string
productOptions?: Record<string, string>
productOptionsLabels?: Record<string, string>
```

In `src/app/_domain/custom-order/adapter.ts`, pass the fields through in `adaptLineItems()`:

```ts
productType: metadata.product_type as string | undefined,
groupId: metadata.group_id as string | undefined,
productOptions: metadata.options as Record<string, string> | undefined,
productOptionsLabels: metadata.options_labels as Record<string, string> | undefined,
```

Do not add an `adaptStringRecord()` helper. The backend contract for this path is already `Record<string, string>`; this plan is not input validation work.

## Task 2: Render Customer Non-Apparel Details

Modify `src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx`.

Import the existing helpers:

```ts
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
```

Use `productType` as the discriminator:

```ts
const productType = lineItem?.metadata?.productType ?? "apparel";
const isNonApparel = productType !== "apparel";
const productOptions = lineItem?.metadata?.productOptions;
const productOptionsLabels = lineItem?.metadata?.productOptionsLabels;
const nonQuantityOptions = isNonApparel
  ? Object.entries(productOptions ?? {})
      .filter(([key]) => key !== "quantity")
      .sort(([a], [b]) => a.localeCompare(b, "en-US"))
  : [];
```

In the Product Details section:
- For non-apparel, render `Quantity` from `productOptions?.quantity` using `formatQuantity()`.
- If non-apparel quantity is missing, show `Quantity unavailable`.
- Render remaining `productOptions` in alphabetical key order.
- Use `formatOptionLabel(key, productOptionsLabels)` for labels.
- Do not render the old summed line-item quantity for non-apparel.
- Leave apparel color, decoration, quantity, design notes, original artwork, and proof file rendering otherwise unchanged.

## Task 3: Render Admin Non-Apparel Specs

Modify `src/app/(authenticated)/admin/proofs/[id]/page.tsx`.

Import the same helpers:

```ts
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
```

At the top of the existing `productSpecs` memo:
- Read `productType` from `lineItem?.metadata?.productType ?? "apparel"`.
- If `productType !== "apparel"`, build specs from `lineItem.metadata.productOptions`.
- Add `Quantity` first, using `formatQuantity(productOptions.quantity)` when present or `Quantity unavailable` when absent.
- Add all non-quantity options after that, sorted by key and labeled with `formatOptionLabel(key, productOptionsLabels)`.
- Return from this non-apparel branch.

Leave the existing apparel extraction path intact. Do not rewrite the apparel branch unless TypeScript forces the smallest local adjustment.

Keep the existing Product Specs record shape. Use formatted labels as record keys in the non-apparel branch. Only make the smallest local renderer adjustment if TypeScript requires it.

## Verification

Run:

```bash
npx tsc --noEmit
```

Review the final changed files:

```bash
git diff --name-only origin/feature/div-72-non-apparel-order-detail-rendering...HEAD
```

Expected changed files are the five files listed above.

If a usable non-apparel proof detail record or fixture exists, check both:

```text
/orders/[id]/[subOrderId]
/admin/proofs/[id]
```

Confirm:
- quantity comes from `options.quantity`
- non-quantity options come from `options`
- labels use `options_labels` or readable fallback
- original artwork and proof file sections still render
- missing `options.quantity` shows `Quantity unavailable`, not normalized quantity `1`

If no usable record or fixture exists, report `Manual proof-detail smoke: NOT RUN - no local non-apparel proof detail fixture available`. Do not claim UI verification was completed.

Commit once if committing this lane:

```bash
git add "src/app/_types/admin/proofs/proofBySubId.ts" \
  "src/app/_domain/custom-order/types.ts" \
  "src/app/_domain/custom-order/adapter.ts" \
  "src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx" \
  "src/app/(authenticated)/admin/proofs/[id]/page.tsx"
git commit -m "feat(proofs): render non-apparel proof metadata"
```
