# DIV-72 Task 1 — Extract Cart Format Helpers and Apply to Order Detail

**Type.** Storefront refactor + non-apparel rendering parity (no new features, no contract change).
**Repo.** `divinipress-store`.
**Worktree.** `/Users/milovan/projects/worktrees/divinipress-store/feature/div-72-non-apparel-order-detail-rendering`.
**Branch.** `feature/div-72-non-apparel-order-detail-rendering`.
**Base.** `feature/div-71-non-apparel-cart-rendering` @ `940657a5`.
**PR base on open.** `feature/div-71-non-apparel-cart-rendering` (DIV-71 not yet merged to develop).
**Backend dependency.** None new. The DIV-99 line-item metadata contract is already in place; this spec consumes data already plumbed by `useOrderDetail` and `useAdminOrderDetail`.

## Revision history

- **r1** — initial draft. Verifiers caught 2 GAPs (Censor) + 1 MISUNDERSTANDING / 4 GAPs / 3 CONCERNs (Provocator). Imperator notified that classification of the `toTitleCase` parity divergence differed across verifiers; the Consul resolved on merits as a fixable GAP (logical error in parity table, not a broken mental model of `toTitleCase`).
- **r2 — current.** Step 1 reverted to true verbatim from cart inline (no DRY against `toTitleCase`) so that "extract" stays an extract and not a behavior widening. Frozen contract table corrected to describe each surface's actual quantity-derivation. Visual deltas on order detail elevated to a dedicated paragraph in Context and an explicit acceptance criterion. Step 4c expanded to cover BOTH `item.quantity` occurrences on the customer surface (apparel-side `Quantity:` row at line 90 AND desktop price-block quantity at line 125). Tech-debt note added for the customer/admin guard asymmetry on empty-string `productType`. `formatQuantity` docstring acknowledges the inherited `undefined` → `"undefined"` failure mode.

## Context

DIV-71 introduced two private formatting helpers inside `src/app/cart/page.tsx`:

- `formatOptionLabel(key, labels?)` — title-cases an option label, falling back to the snake-cased key when no curated label is available.
- `formatQuantity(value)` — renders a numeric quantity with `en-US` thousands separators, falling back to the raw string for non-numeric values.

The same `productOptions` / `productOptionsLabels` data is already plumbed into the customer order-detail line component (`src/components/orders/line-item-row.tsx`) and the admin order-detail card (`src/app/(authenticated)/admin/orders/[orderId]/_components.tsx`), but those surfaces still render non-apparel options with **CSS `capitalize` + raw `key.replace(/_/g, " ")` fallback**, no `quantity` filter, no dedicated Quantity row, and no thousands-separator on apparel quantity. The result is that DIV-71's improvements stop at the cart and never reach order detail.

DIV-72 task 1 elevates the two helpers to a neutral shared utility, points cart at them, and applies them — together with the cart's non-apparel rendering shape — to both order-detail surfaces.

**Visual deltas this spec adds to order detail (NOT pre-existing):**
- Non-apparel: dedicated `Quantity: <thousands-separated>` row above the option list (today: nothing dedicated, the `quantity` key is buried inside the option iteration as `Quantity: 1500` raw alongside `Color`, `Material`, etc.).
- Non-apparel: option keys sorted alphabetically with `localeCompare("en-US")` (today: insertion order from the metadata bag).
- Non-apparel: italic muted `"Custom configuration"` placeholder when `productOptions === {}` (today: empty `<div>`, nothing visible).
- Apparel: thousands-separator on the apparel-side `Quantity:` row and on the desktop price-block `... x N ...` count (today: raw integer, e.g., `1500` instead of `1,500`).

These behaviors all shipped in DIV-71 cart and are being replicated to order detail. They are NEW for both order-detail surfaces, even though they are PARITY relative to cart.

**Out of scope for task 1 (Imperator directive):**
- No `productType` discriminator extraction or refactor. The existing `productType !== "apparel"` branch in each consumer is unchanged.
- No shared options component. Rendering remains inline JSX in each consumer, exactly as cart does today.
- DIV-72 task 1 stays focused on the order-detail rendering surface. Anything beyond extraction + parity is a separate task.

## Frozen data contract — already plumbed

For every non-apparel line on every surface (cart, customer order detail, admin order detail):

| Field on the consumer's view-model | Type | Source |
|-|-|-|
| `productOptions` | `Record<string, string>` | `metadata.options` (lifted unchanged) |
| `productOptionsLabels` | `Record<string, string>` | `metadata.options_labels` (lifted unchanged) |
| `productOptions.quantity` (string key) | `string` | `metadata.options.quantity` — customer-facing tier as a string |

The "other" numeric quantity field on each view-model is **derived per surface, not a plain top-level Medusa line-item quantity**:

| Surface | Field | Non-apparel derivation | Apparel derivation |
|-|-|-|-|
| Cart | `group.itemQuantity` | `parseInt(productOptions?.quantity ?? "1", 10)` | sum of per-size line items |
| Customer order detail | `item.quantity` | hardcoded `1` (`isNonApparel ? 1 : ...`) | sum of `sizeBreakdown[].qty` |
| Admin order detail | `product.itemQuantity` | `parseInt(productOptions?.quantity ?? "1", 10)` | sum of `quantities[]` |

Behavioral consequence for this spec's `productOptions.quantity ?? <derived>` fallback expressions: when DIV-99 honors the contract (every non-apparel line carries `metadata.options.quantity`), the fallback is unreachable. When the contract is violated, all three surfaces fall back to `1` by coincidence (cart and admin via `parseInt(... ?? "1")`, customer via hardcoded `1`). The fallback is therefore defensive-only and renders `"Quantity: 1"` for any non-apparel line missing `metadata.options.quantity` — same degraded state as DIV-71 cart.

For apparel lines, `productOptions` is absent; the apparel quantity comes from the per-surface derived field above.

Verified by scout report: `useCart.ts:35-36, 84-89, 184`, `useOrderDetail.ts:149-154, 241-243, 320, 329-330`, `useAdminOrderDetail.ts:54-57, 127-129, 184-185`, `src/components/orders/types.ts:49-50, 93-94`.

## Files touched

```
NEW    src/app/_utils/formatOptionLabel.ts
NEW    src/app/_utils/formatQuantity.ts
EDIT   src/app/cart/page.tsx
EDIT   src/components/orders/line-item-row.tsx
EDIT   src/app/(authenticated)/admin/orders/[orderId]/_components.tsx
```

Five files, none of which collide with the pre-commit "max 8 files outside primary page dir" gate (the change is intentionally a multi-consumer refactor).

## Step 1 — Create `src/app/_utils/formatOptionLabel.ts`

**True verbatim move from cart inline.** Matches the existing `_utils/` one-helper-per-file convention.

The helper is moved as-is, byte-equivalent to the cart's inline declaration at `cart/page.tsx:80-93`. It is **not** DRYed against the pre-existing `toTitleCase` util, despite their similarity: `toTitleCase` splits on `[_\s]+` (underscores AND whitespace), while this helper splits on `\s+` (whitespace only) AFTER a conditional underscore→space replacement that is applied **only on the key-fallback path**. The two diverge for any curated label that contains an underscore — e.g., `labels.material = "Eco_Friendly Vinyl"` produces `"Eco_friendly Vinyl"` here vs `"Eco Friendly Vinyl"` from `toTitleCase`. Preserving the cart's exact behavior keeps "extract" an extract; whether to widen to `toTitleCase` is a separate, deliberate decision out of scope for DIV-72 task 1.

```ts
/**
 * Format a non-apparel option label for display.
 *
 * Prefers the curated `labels[key]` (set by the backend contract). On the
 * key-fallback path, replaces underscores with spaces. The result (label or
 * fallback) is split on whitespace and word-by-word title-cased.
 *
 * NOTE: A curated `labels[key]` value containing an underscore (e.g.,
 * "Eco_Friendly") is preserved as-is on the underscore character; only the
 * first character of the underscore-containing token is uppercased. This
 * matches the inline cart behavior shipped in DIV-71. If broader
 * underscore-splitting in labels is desired in the future, swap this helper
 * for `toTitleCase(labels?.[key] ?? key)` — that is a deliberate behavior
 * widening, not in scope for DIV-72 task 1.
 */
export function formatOptionLabel(
  key: string,
  labels?: Record<string, string>
): string {
  const raw = labels?.[key] ?? key.replace(/_/g, " ");
  return raw
    .split(/\s+/)
    .map((word) =>
      word.length > 0
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : word
    )
    .join(" ");
}
```

Behavior parity check against the cart's inline version (`cart/page.tsx:80-93`):

| Input | Inline cart version | This helper | Match |
|-|-|-|-|
| `key="color_choice"`, no labels | `"Color Choice"` | `"Color Choice"` | ✓ |
| `key="color_choice"`, `labels.color_choice="Color Choice"` | `"Color Choice"` | `"Color Choice"` | ✓ |
| `key="size"`, no labels | `"Size"` | `"Size"` | ✓ |
| `key=""`, no labels | `""` | `""` | ✓ |
| `key="MATERIAL"`, no labels | `"Material"` | `"Material"` | ✓ |
| `key="material"`, `labels.material="Eco_Friendly Vinyl"` | `"Eco_friendly Vinyl"` | `"Eco_friendly Vinyl"` | ✓ |
| `key="finish"`, no labels (via fallback) | `"Finish"` | `"Finish"` | ✓ |
| `key="x_y_z"`, no labels (via fallback) | `"X Y Z"` | `"X Y Z"` | ✓ (fallback path replaces underscores before split) |

Byte-for-byte equivalence: the function body is character-identical to `cart/page.tsx:80-93` modulo docstring.

## Step 2 — Create `src/app/_utils/formatQuantity.ts`

Verbatim move from the cart's inline version (`cart/page.tsx:95-98`). No behavior change.

```ts
/**
 * Format a quantity scalar for display with en-US thousands separators.
 *
 * Accepts `string | number | undefined` because non-apparel quantities arrive
 * as a string inside `metadata.options.quantity`, while apparel and order
 * line-item quantities arrive as `number`. Falls back to `String(value)` when
 * the input is not finite.
 *
 * NOTE: `formatQuantity(undefined)` returns the literal string `"undefined"`,
 * inherited from the DIV-71 cart helper. All call sites added by this spec
 * pass type-checked `number` or `string` values from view-models that
 * guarantee defined quantities; the `undefined` fallback is unreachable in
 * practice. If a future caller passes an undefined quantity, the visible
 * "undefined" output will surface the missing-data condition.
 */
export function formatQuantity(value: string | number | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : String(value);
}
```

## Step 3 — Update `src/app/cart/page.tsx`

**Delete** the inline declarations at lines `80-98` (both `formatOptionLabel` and `formatQuantity`).

**Add** to the import block at the top of the file (alphabetize alongside existing `@utils/*` imports if any; otherwise place near other `@utils/*`-style imports):

```ts
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
```

**No render-shape change in cart.** Call sites at lines `537`, `547`, `560` continue to call the helpers by the same name and signature — they now resolve to the imported version.

## Step 4 — Update `src/components/orders/line-item-row.tsx` (customer order detail)

Four edits (imports, non-apparel block, apparel-side `Quantity:` row, desktop price-block quantity) inside the existing `LineItemRow` component. The `productType !== "apparel"` branch boundary is unchanged.

### 4a — Imports

Add to the import block:

```ts
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
```

### 4b — Non-apparel options block (`line-item-row.tsx:62-74`)

**Replace the existing block:**

```tsx
{item.productType && item.productType !== "apparel" && item.productOptions && (
  <div className="space-y-0.5">
    {Object.entries(item.productOptions).map(([key, value]) => {
      const label = item.productOptionsLabels?.[key]
        ?? key.replace(/_/g, " ");
      return (
        <span key={key} className="text-sm text-muted-foreground block">
          <span className="capitalize">{label}</span>: {value}
        </span>
      );
    })}
  </div>
)}
```

**With** (matches cart's non-apparel rendering shape exactly):

```tsx
{item.productType && item.productType !== "apparel" && item.productOptions && (
  Object.keys(item.productOptions).length === 0 ? (
    <span className="text-sm text-muted-foreground italic block">
      Custom configuration
    </span>
  ) : (
    <div className="space-y-0.5">
      <span className="text-sm text-muted-foreground block">
        Quantity:{" "}
        {formatQuantity(item.productOptions.quantity ?? item.quantity)}
      </span>
      {Object.entries(item.productOptions)
        .filter(([k]) => k !== "quantity")
        .sort(([a], [b]) => a.localeCompare(b, "en-US"))
        .map(([key, value]) => (
          <span key={key} className="text-sm text-muted-foreground block">
            <span>{formatOptionLabel(key, item.productOptionsLabels)}</span>: {value}
          </span>
        ))}
    </div>
  )
)}
```

**Notes for the implementer:**
- The existing component renders option lines as inline `<span ... block>` elements rather than `<p>` (cart uses `<p>`). Keep `<span>` here to match the surrounding component's style — the visual result is the same because of the `block` class. **Do not switch the customer order-detail block to `<p>` to match cart**; that would introduce churn outside the spec's scope.
- The branch condition (`item.productType && item.productType !== "apparel" && item.productOptions`) is preserved verbatim. We are not extracting or refactoring the discriminator.

### 4c — Apparel-side quantity (`line-item-row.tsx:90`)

The current line renders `Quantity: {item.quantity}` raw inside the `sizeBreakdown` block. Apply `formatQuantity` for thousands-separator parity with cart and with the non-apparel branch.

**Replace:**

```tsx
Quantity: {item.quantity}
```

**With:**

```tsx
Quantity: {formatQuantity(item.quantity)}
```

The exact JSX surrounding this token is unchanged; only the expression for the rendered value changes.

### 4d — Desktop price-block quantity (`line-item-row.tsx:125`)

The desktop price block (visible at `md:` and up) renders the `unitPrice × quantity = total` row, which currently shows `<span>{item.quantity}</span>` with no formatting. This block renders for **both** apparel and non-apparel lines (no branch guard above the price block). For apparel lines with quantity ≥ 1000, the row reads `$X.XX × 1500 $Y.YY` while step 4c's new Quantity row reads `Quantity: 1,500` — visually inconsistent. Apply `formatQuantity` here too for one source of truth on apparel quantity formatting.

For non-apparel customer lines, `item.quantity` is hardcoded `1` per adapter contract, so `formatQuantity(1)` → `"1"` — no visible change.

**Replace:**

```tsx
<span>{item.quantity}</span>
```

**With:**

```tsx
<span>{formatQuantity(item.quantity)}</span>
```

The mobile price block at line 130 (`md:hidden`) renders `formatCurrency(item.total)` only — no `item.quantity` reference, no edit needed.

## Step 5 — Update `src/app/(authenticated)/admin/orders/[orderId]/_components.tsx` (admin order detail)

Three edits (imports, non-apparel block, apparel-side `Quantity:` row) inside the existing `ProductCard` component. The `productType !== "apparel"` branch boundary is unchanged.

### 5a — Imports

Add to the import block:

```ts
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
```

### 5b — Non-apparel options block (`_components.tsx:258-270`)

**Replace the existing block:**

```tsx
{product.productType !== "apparel" && product.productOptions ? (
  <div className="space-y-1">
    {Object.entries(product.productOptions).map(([key, value]) => {
      const label =
        product.productOptionsLabels?.[key] ??
        key.replace(/_/g, " ");
      return (
        <p key={key} className="text-sm text-muted-foreground">
          <span className="capitalize">{label}</span>: {value}
        </p>
      );
    })}
  </div>
) : (
```

**With** (matches cart's non-apparel rendering shape exactly):

```tsx
{product.productType !== "apparel" && product.productOptions ? (
  Object.keys(product.productOptions).length === 0 ? (
    <p className="text-sm text-muted-foreground italic">
      Custom configuration
    </p>
  ) : (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        Quantity:{" "}
        {formatQuantity(
          product.productOptions.quantity ?? product.itemQuantity
        )}
      </p>
      {Object.entries(product.productOptions)
        .filter(([k]) => k !== "quantity")
        .sort(([a], [b]) => a.localeCompare(b, "en-US"))
        .map(([key, value]) => (
          <p key={key} className="text-sm text-muted-foreground">
            <span>{formatOptionLabel(key, product.productOptionsLabels)}</span>: {value}
          </p>
        ))}
    </div>
  )
) : (
```

**Notes for the implementer:**
- This component already uses `<p>` (matching cart). Keep `<p>` here.
- The trailing `) : (` is preserved — the apparel-side `else` branch that follows is untouched in step 5b. (Step 5c covers the apparel-side change.)
- The branch condition is preserved verbatim. No discriminator extraction.

### 5c — Apparel-side quantity (`_components.tsx:281`)

The current line renders raw `Quantity: {product.itemQuantity}`. Apply `formatQuantity`.

**Replace:**

```tsx
Quantity: {product.itemQuantity}
```

**With:**

```tsx
Quantity: {formatQuantity(product.itemQuantity)}
```

## Acceptance criteria

1. `src/app/_utils/formatOptionLabel.ts` and `src/app/_utils/formatQuantity.ts` exist, each exports a single named function with the bodies in steps 1 and 2. Function bodies are byte-equivalent to DIV-71 cart inline (modulo docstring).
2. `src/app/cart/page.tsx` no longer contains inline declarations of `formatOptionLabel` or `formatQuantity`. Both are imported from `@utils/*`. All three call sites (lines `537`, `547`, `560` pre-edit) still resolve and render identically to DIV-71's `940657a5`.
3. Customer order-detail (`line-item-row.tsx`) — non-apparel:
   - Non-empty `productOptions` renders a dedicated `Quantity: <formatted>` row first, then the remaining options sorted alphabetically with `formatOptionLabel`-titled keys; the `quantity` key is filtered from the iteration.
   - Empty `productOptions` (`{}`) renders italic muted `"Custom configuration"`.
4. Customer order-detail (`line-item-row.tsx`) — apparel and price block:
   - Apparel-side `Quantity:` row at line 90 uses `formatQuantity(item.quantity)`.
   - Desktop price-block quantity at line 125 uses `formatQuantity(item.quantity)`.
5. Admin order-detail (`_components.tsx`) — non-apparel:
   - Same two behaviors as (3), bound to the admin view-model field names (`product.productOptions`, `product.productOptionsLabels`, `product.itemQuantity`).
6. Admin order-detail (`_components.tsx`) — apparel:
   - Apparel-side `Quantity:` row at line 281 uses `formatQuantity(product.itemQuantity)`.
7. **Visual deltas on order detail (intended user-visible changes):**
   - Non-apparel: a new `Quantity:` row appears above the option list; option keys appear in alphabetic order; for any non-apparel quantity ≥ 1000 the row uses thousands separators.
   - Non-apparel + empty `productOptions`: a new `"Custom configuration"` italic muted line appears where today an empty `<div>` rendered nothing.
   - Apparel + quantity ≥ 1000: the `Quantity:` row and the desktop price-block `× N` count both use thousands separators (today: raw integer).
8. `npx tsc --noEmit` is clean.
9. `yarn lint` is clean (no new warnings on touched files).
10. No render-shape changes to **apparel** beyond the `formatQuantity` swap. Color, sizeBreakdown, Decoration, brandStyle, artworkPlacements blocks are untouched on both order-detail surfaces.
11. No edits to adapters (`useOrderDetail.ts`, `useAdminOrderDetail.ts`, `useCart.ts`), types (`src/components/orders/types.ts`), or any file not listed in "Files touched."

## Verification steps

1. **Type-check.** `npx tsc --noEmit` from worktree root.
2. **Lint.** `yarn lint` (project policy is to scope to touched files; warnings on unrelated files are not blocking but should be noted).
3. **Cart smoke.** `yarn dev`, log in (test account from `reference_app_login.md`), add a non-apparel product to cart with backend serving `metadata.options` including `quantity` (string) plus other keys (e.g., `material`, `size`). Confirm the non-apparel branch renders Quantity row first (formatted, e.g., `1,500` not `1500`), remaining keys sorted, no `quantity` row in the iteration. Verify an apparel line still renders correctly.
4. **Customer order detail smoke.** Navigate to `/orders/<existing-non-apparel-order-id>`. Confirm the same three behaviors as cart (Quantity-first, formatted, alphabetized, no quantity-in-iteration). Confirm an apparel order's `Quantity:` row shows thousands-separator on a quantity ≥ 1000.
5. **Admin order detail smoke.** As an admin user, navigate to `/admin/orders/<existing-non-apparel-order-id>`. Confirm the same. Confirm apparel admin view shows `formatQuantity` output.
6. **Empty-options edge case.** If a non-apparel line is rendered with `productOptions === {}` (rare but possible), confirm the italic `"Custom configuration"` placeholder appears on both order-detail surfaces.

## Out of scope (explicit, carried from Imperator directive)

- ❌ No `productType` discriminator helper, hook, or component.
- ❌ No `<NonApparelOptions>` (or similar) shared options component.
- ❌ No tests for the helpers (DIV-71 shipped them untested; testing is a separate decision).
- ❌ No changes to `useCart.ts`, `useOrderDetail.ts`, `useAdminOrderDetail.ts`, or any backend.
- ❌ No re-shape of apparel rendering beyond the `formatQuantity` thousands-separator swap.
- ❌ No edits to `src/components/orders/types.ts`.
- ❌ No `<dl>` or `<table>` semantic upgrade. Render shape stays as today (cart uses `<p>`, customer detail uses `<span ... block>`, admin uses `<p>`).
- ❌ No widening of `formatOptionLabel` to split underscores within curated labels (would change visible output for `labels[key]` values containing underscores).
- ❌ No tightening of `formatQuantity`'s `undefined` failure mode (preserved as-is from DIV-71).

## Latent issues flagged but NOT fixed in this spec

- **Customer/admin guard asymmetry on empty-string `productType`.** Customer guard at `line-item-row.tsx:62` is `item.productType && item.productType !== "apparel" && item.productOptions` (three checks). Admin guard at `_components.tsx:258` is `product.productType !== "apparel" && product.productOptions` (two checks, no truthiness). For a contract-conforming non-apparel line (`productType` always populated by adapter), both behave identically. For a corrupted `productType === ""` line, customer renders the apparel branch (empty string is falsy), admin renders the non-apparel branch — same input, different surface, different render. This is pre-existing and out of scope per Imperator directive (no discriminator extraction in DIV-72 task 1). Flag as candidate for a later DIV-72 task or downstream backlog.

## Confidence map

- **§ Files touched.** **High** — every file path verified by scout against worktree state.
- **§ Frozen data contract.** **High** — scout verified `productOptions` / `productOptionsLabels` plumbing in all three adapters; per-surface quantity derivations re-verified directly against `useCart.ts:184`, `useOrderDetail.ts:241-243, 320`, `useAdminOrderDetail.ts:127-129`.
- **§ Step 1 (`formatOptionLabel`).** **High** — true verbatim move from `cart/page.tsx:80-93`. Body is byte-equivalent. The toTitleCase-based DRY was rejected on review because the two helpers diverge on labels containing underscores; preserving cart behavior keeps "extract" an extract.
- **§ Step 2 (`formatQuantity`).** **High** — verbatim move; no behavior change. `undefined` failure mode documented in docstring.
- **§ Step 3 (cart update).** **High** — three call sites verified by scout. No cart render-shape change in scope.
- **§ Step 4 (customer order detail).** **High** — scout quoted exact lines `62-74` and `90`; line `125` (price-block quantity) verified directly against the worktree. Replacement preserves the `<span ... block>` element style of the surrounding component.
- **§ Step 5 (admin order detail).** **High** — scout quoted exact lines `258-270` and `281`; replacement preserves the `<p>` element style of the surrounding component.
- **§ Acceptance criteria.** **High** — derived directly from steps 1-5; visual deltas on order detail enumerated explicitly per Provocator review.
- **§ Verification steps.** **Medium** — depends on having backend data for at least one non-apparel order. If no such order exists in the local seed, the implementer should create one or coordinate with Ivan; this is a known limitation, not a spec gap.
- **§ Out of scope.** **High** — Imperator directive verbatim.
- **§ Latent issues flagged.** **High** — guard-asymmetry pre-existing, verified in worktree. Out of scope per directive.
