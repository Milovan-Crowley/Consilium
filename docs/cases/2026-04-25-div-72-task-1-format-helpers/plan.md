# DIV-72 Task 1 — Format Helper Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:legion` (recommended) or `consilium:march` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `formatOptionLabel` and `formatQuantity` from `src/app/cart/page.tsx` (where DIV-71 placed them inline) into two single-helper modules under `src/app/_utils/`. Point cart at the new utils. Apply both helpers — together with the cart's full non-apparel rendering shape — to customer order detail (`src/components/orders/line-item-row.tsx`) and admin order detail (`src/app/(authenticated)/admin/orders/[orderId]/_components.tsx`).

**Architecture:** Two pure helper functions move from a private file-local declaration in cart to two exported single-helper modules under `src/app/_utils/` (`formatOptionLabel.ts`, `formatQuantity.ts`). Both files are byte-equivalent verbatim moves from DIV-71's cart inline (no DRY against `toTitleCase` — they diverge on labels with underscores). Three consumers import them: cart (no render-shape change), customer order-detail `LineItemRow` (replaces non-apparel block, applies `formatQuantity` to two apparel-side render sites), admin order-detail `ProductCard` (replaces non-apparel block, applies `formatQuantity` to apparel quantity row). No `productType` discriminator extraction. No shared options component. No tests (per spec § Out of scope — DIV-71 shipped the helpers untested; testing is a separate decision).

**Tech Stack:** TypeScript, Next.js 16 (App Router), React 19. yarn 4.3.1. `@utils/*` resolves to `src/app/_utils/*` per `tsconfig.json`. `npx tsc --noEmit` for type-check; `yarn lint` for lint; `yarn dev` for smoke verification. Pre-commit hook (`scripts/pre-commit-validate.sh`) caps at 8 files outside primary page dir; per-task commits are well under.

**Worktree:** `/Users/milovan/projects/worktrees/divinipress-store/feature/div-72-non-apparel-order-detail-rendering`
**Branch:** `feature/div-72-non-apparel-order-detail-rendering` (off `feature/div-71-non-apparel-cart-rendering` @ `940657a5`)
**PR base on open:** `feature/div-71-non-apparel-cart-rendering`
**Spec:** `$CONSILIUM_DOCS/cases/2026-04-25-div-72-task-1-format-helpers/spec.md` (r2, commit `488ef4d`)

## Revision history

- **r1** — initial draft (commit `a0f9676`). Praetor cleared as feasible (8 SOUND, 1 minor cosmetic CONCERN). Provocator cleared as executable but flagged ergonomic friction: code-fence indentation does not match file indentation (Edit-tool match risk), pre-edit line numbers shift after Step 1's import insertion, Task 4 omitted backend-boot prerequisite, customer `Quantity: 1` degraded fallback could be misread as a bug during smoke.
- **r2 — current.** Added "How to read this plan" section covering line-number drift, code-fence indent vs. file indent (with per-file indent table), and lint-reorder acceptance. Per-step indent annotations added to Tasks 2 and 3. Task 4 split: new Step 1 boots the Medusa backend before the storefront. Customer non-apparel Quantity-fallback note added to Task 2 Step 2 ("`Quantity: 1` is degraded but accepted, file as backend metadata issue not frontend bug"). Step numbering in Task 4 corrected.

**Operational hygiene (Imperator directives):**
- Do not stage `.env.local`. It carries real secrets.
- No co-author line in commits.
- No "Test Plan" section in the PR body when the PR is opened.
- `yarn install` already ran; `node_modules` is present.

---

## How to read this plan

Two execution conventions matter — read these once before starting Task 1, then proceed.

**1. Line numbers cited in Steps 2+ within each task are PRE-EDIT.** Each task's Step 1 inserts imports, which shifts every line below by the number of inserted lines. The quoted pre-edit code blocks in subsequent steps are the **anchor of truth** — use them as content-based search targets for the Edit tool, not the cited line numbers. The line numbers serve as a navigation hint only.

**2. Code fences in this plan are 0-indented for readability; the actual file content is indented.** When using the `Edit` tool with `old_string` set to one of the quoted pre-edit blocks, **prepend the file's existing indentation to every line of the search string**. Specifically:
- `cart/page.tsx` deletion target (helpers section): 0-space indent. Plan's code matches.
- `cart/page.tsx` import insertion: 0-space indent. Plan's code matches.
- `line-item-row.tsx` non-apparel block (lines 62-74): **8-space indent** in the file (sits inside the `<div className="flex flex-1 ...">`).
- `line-item-row.tsx` apparel-side `Quantity:` row at line 90: **14-space indent** (deep inside the `sizeBreakdown` block).
- `line-item-row.tsx` desktop price-block quantity at line 125: **8-space indent**.
- `_components.tsx` non-apparel block (lines 258-270): **14-space indent** (inside `ProductCard`'s nested render).
- `_components.tsx` apparel-side `Quantity:` row at line 281: **24-space indent** (deep inside the `quantities.length > 0` block — read the file at that line for exact spacing).

If the Edit tool reports "not found" on any step, the indentation prefix is the most likely cause — re-Read the file at the cited line range, copy the exact whitespace, and prepend.

**3. If `yarn lint` requests import reordering**, accept it (run `yarn lint --fix` or apply manually). The intra-import-block ordering is not load-bearing for this plan.

---

## Task 1: Extract both helpers + update cart imports

> **Confidence: High** — Both helpers are pure functions with no closure captures (verified at `cart/page.tsx:80-98`). Three call sites in cart (lines `537`, `547`, `560`) use only the helper name and arguments. `@utils/*` alias resolves to `src/app/_utils/*` per `tsconfig.json:42-44`. The `_utils/` directory follows a one-helper-per-file convention (`toTitleCase.ts`, `formatTime.ts`, `format-date.ts`, `format-price.ts`).

**Files:**
- Create: `src/app/_utils/formatOptionLabel.ts`
- Create: `src/app/_utils/formatQuantity.ts`
- Modify: `src/app/cart/page.tsx` (delete the helpers section at lines 78-99; add two imports)

- [ ] **Step 1: Create `src/app/_utils/formatQuantity.ts`**

Write file with exactly this content:

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
 * inherited from the DIV-71 cart helper. All call sites added by this task
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

- [ ] **Step 2: Create `src/app/_utils/formatOptionLabel.ts`**

Write file with exactly this content:

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

- [ ] **Step 3: Update `src/app/cart/page.tsx` — add imports**

Open `src/app/cart/page.tsx`. Locate the import block — current state ends at line 76:

```ts
import { TAddShippingAddressFormSchema } from "./_utils/addShippingAddressFormSchema";
```

Insert two new imports immediately after `useMediaQuery` (currently line 70) and before the `useCart` import (currently line 71). The result of that segment:

```ts
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
import { useCart, CartGroupedItem } from "./_hooks/useCart";
```

- [ ] **Step 4: Update `src/app/cart/page.tsx` — delete inline helpers + orphaned section comment**

In the same file, delete the entire helpers block at lines 78-99 (the `// --- Helpers ---` comment AND both function bodies AND surrounding blank lines). Pre-edit, lines 77-100 read:

```
77: (blank)
78: // --- Helpers ---
79: (blank)
80: function formatOptionLabel(
81:   key: string,
82:   labels: Record<string, string> | undefined
83: ): string {
... (through line 98 — formatQuantity closing brace)
99: (blank)
100: // --- Types ---
```

Post-edit, the transition should read:

```
(line 76): import { TAddShippingAddressFormSchema } from "./_utils/addShippingAddressFormSchema";
(blank)
// --- Types ---
```

The orphaned `// --- Helpers ---` comment on line 78 is removed alongside the function bodies — it would otherwise dangle with no helpers below it.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit (no new errors). The three call sites at `cart/page.tsx` (now at shifted line numbers after deletion) — `formatQuantity(...)`, `formatOptionLabel(...)`, `formatQuantity(...)` — must resolve via the new imports.

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: no new warnings or errors on `src/app/_utils/formatOptionLabel.ts`, `src/app/_utils/formatQuantity.ts`, or `src/app/cart/page.tsx`. Pre-existing warnings on unrelated files are not blocking.

- [ ] **Step 7: Commit**

```bash
git add src/app/_utils/formatOptionLabel.ts src/app/_utils/formatQuantity.ts src/app/cart/page.tsx
git commit -m "refactor(utils): extract formatOptionLabel and formatQuantity from cart inline (DIV-72)"
```

Pre-commit gate: 3 files staged, all under `src/app` prefix → `OUTSIDE_COUNT = 0`. Hook will pass.

---

## Task 2: Customer order detail — non-apparel rendering parity + formatQuantity application

> **Confidence: High** — `LineItemRow` boundary, all three target line numbers, and the surrounding component style (`<span ... block>`) verified against the worktree at base SHA `940657a5`. The branch condition (`item.productType && item.productType !== "apparel" && item.productOptions`) is preserved verbatim. The non-apparel branch's existing element style — inline `<span ... block>` rather than `<p>` — is retained to match the surrounding component.

**Files:**
- Modify: `src/components/orders/line-item-row.tsx` (4 sub-edits: imports, non-apparel block at lines 62-74, apparel-side `Quantity:` row at line 90, desktop price-block quantity at line 125)

- [ ] **Step 1: Add imports**

Open `src/components/orders/line-item-row.tsx`. Pre-edit imports end at line 8 (`import { formatCurrency } from "./utils";`). Insert two new imports immediately after the lucide-react import on line 6 and before the `./types` import on line 7. The result:

```ts
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
import type { LineItem } from "./types";
import { formatCurrency } from "./utils";
```

- [ ] **Step 2: Replace the non-apparel options block at lines 62-74**

The block sits at **8-space indent** inside `<div className="flex flex-1 flex-col gap-1 min-w-0">`. Re-Read `line-item-row.tsx` lines 62-74 at execution time to capture the exact whitespace, then prepend the leading 8 spaces to every line of the `old_string` and `new_string` you pass to Edit.

Pre-edit block (logical content; prepend 8-space indent to each line when using as `old_string`):

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

Replacement (logical content; prepend 8-space indent to each line when using as `new_string`):

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

The branch condition is verbatim. Element types stay as `<span ... block>` (matching the surrounding component, NOT `<p>`).

**Note on the `productOptions.quantity ?? item.quantity` fallback.** Per spec § Frozen data contract, customer `item.quantity` is hardcoded `1` for non-apparel by adapter contract. If `productOptions.quantity` is absent (DIV-99 contract violation), the row renders `Quantity: 1` — same DIV-71 cart fallback. This is **accepted degraded behavior, not a regression**. If you observe `Quantity: 1` during smoke verification on a real non-apparel order with a known customer-facing quantity > 1, file as a backend metadata issue, not a frontend bug.

- [ ] **Step 3: Apply `formatQuantity` to the apparel-side `Quantity:` row at line 90**

Located inside the `sizeBreakdown` block at **14-space indent** (the existing line in the file already shows the 14 leading spaces). The pre-edit line in the file reads literally:

```
              Quantity: {item.quantity}
```

Replace with (preserving the 14-space lead):

```
              Quantity: {formatQuantity(item.quantity)}
```

The wrapping `<span className="text-sm text-muted-foreground">...</span>` is unchanged. The 14-space lead comes from the file — copy it exactly when using Edit.

- [ ] **Step 4: Apply `formatQuantity` to the desktop price-block quantity at line 125**

Located inside the `<div className="shrink-0 text-right tabular-nums text-sm hidden md:block">` desktop price block at **8-space indent**. The pre-edit line in the file reads literally:

```
        <span>{item.quantity}</span>
```

Replace with (preserving the 8-space lead):

```
        <span>{formatQuantity(item.quantity)}</span>
```

The mobile price block (`md:hidden` at line 129; `formatCurrency(item.total)` expression at line 130; closing `</div>` at line 131) does NOT reference `item.quantity` — no edit there.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit. `item.productOptions.quantity` is `string | undefined` (Record access), `item.quantity` is `number` (per `src/components/orders/types.ts:38`). The `formatQuantity` parameter type `string | number | undefined` accepts both. `formatOptionLabel` second param `Record<string, string> | undefined` accepts `item.productOptionsLabels` (typed `Record<string, string> | undefined` per `types.ts:50`).

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: no new warnings or errors on `src/components/orders/line-item-row.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/orders/line-item-row.tsx
git commit -m "feat(orders): non-apparel rendering parity on customer order detail (DIV-72)"
```

Pre-commit gate: 1 file staged → `OUTSIDE_COUNT = 0` (the file IS the bucket). Hook will pass.

---

## Task 3: Admin order detail — non-apparel rendering parity + formatQuantity application

> **Confidence: High** — `ProductCard` boundary at `_components.tsx:258-270` and `:281` verified against the worktree at base SHA `940657a5`. The branch condition (`product.productType !== "apparel" && product.productOptions`) is preserved verbatim. Element style stays as `<p>` (matching the surrounding component, which already uses `<p>`).

**Files:**
- Modify: `src/app/(authenticated)/admin/orders/[orderId]/_components.tsx` (3 sub-edits: imports, non-apparel block at lines 258-270, apparel-side `Quantity:` row at line 281)

- [ ] **Step 1: Add imports**

Open `src/app/(authenticated)/admin/orders/[orderId]/_components.tsx`. The import block currently ends at line 88 (`import type { AdminOrderActions } from "./_hooks/useAdminOrderActions";`). Insert two new imports immediately after the existing `@/components/orders/utils` import on line 67. The result of that segment:

```ts
import { formatCurrency } from "@/components/orders/utils";
import { formatOptionLabel } from "@utils/formatOptionLabel";
import { formatQuantity } from "@utils/formatQuantity";
import { USStateOptionsData } from "./_mock/USStateOptionsData";
```

- [ ] **Step 2: Replace the non-apparel options block at lines 258-270**

The block sits at **14-space indent** inside `ProductCard`'s nested render. The code below already includes the 14-space lead — copy it verbatim into Edit.

Pre-edit block (verbatim, 14-space indent on the outer `{`):

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

Replace with (preserving the trailing `) : (` that introduces the apparel `else` branch which follows):

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

The outer ternary's `?` branch is now an inner ternary (empty-options → italic placeholder, otherwise → quantity-row + sorted options). The outer ternary's `:` branch (the apparel side) is untouched in this step. Element type stays `<p>`.

- [ ] **Step 3: Apply `formatQuantity` to the apparel-side `Quantity:` row at line 281**

Located inside `{product.quantities.length > 0 && (...)}`, which renders only for apparel since non-apparel `quantities` is `[]`. Read the file at line 281 for the exact whitespace lead before using Edit. The pre-edit line reads (the leading whitespace below is approximate — copy from the file):

```
                        Quantity: {product.itemQuantity}
```

Replace with (preserving the file's exact lead):

```
                        Quantity: {formatQuantity(product.itemQuantity)}
```

The wrapping `<span className="text-sm font-medium">...</span>` is unchanged. If Edit reports "not found", re-Read line 281 to capture the exact leading whitespace and try again.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit. `product.productOptions.quantity` is `string | undefined`, `product.itemQuantity` is `number` (per `src/components/orders/types.ts:88`). `formatQuantity` accepts both. `product.productOptionsLabels` is `Record<string, string> | undefined` (per `types.ts:94`); accepted by `formatOptionLabel`'s second param.

- [ ] **Step 5: Lint**

Run: `yarn lint`
Expected: no new warnings or errors on `src/app/(authenticated)/admin/orders/[orderId]/_components.tsx`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(authenticated)/admin/orders/[orderId]/_components.tsx"
git commit -m "feat(orders): non-apparel rendering parity on admin order detail (DIV-72)"
```

Pre-commit gate: 1 file staged → `OUTSIDE_COUNT = 0`. Hook will pass.

---

## Task 4: Smoke verification

> **Confidence: Medium** — depends on (a) the Medusa backend running locally on the URL `NEXT_PUBLIC_API_URL` targets, (b) at least one non-apparel order in the local backend seed, (c) at least one apparel order with quantity ≥ 1000 to validate the thousands-separator. If any are absent, coordinate with Ivan or create fixtures.

**Files:** None modified.

- [ ] **Step 1: Boot the Medusa backend**

`yarn dev` (Step 2) starts ONLY the Next.js storefront. Without the backend running, every cart/order API call will fail and the smoke steps below cannot be evaluated.

Boot the backend in a separate terminal at the path the storefront's `.env.local` points to (typically `/Users/milovan/projects/divinipress-backend` per Imperator memory). Use the project's standard backend dev command (`yarn dev` or equivalent inside the backend repo) and wait for it to log "Server is ready on `http://localhost:9000`" or similar.

If the backend is unavailable for any reason, mark Steps 2-5 as DEFERRED in the campaign report and ask the Imperator how to proceed (Type-check + lint already passed in Tasks 1-3, so the deferral is bounded).

- [ ] **Step 2: Boot the storefront dev server**

Run: `yarn dev`
Expected: Next.js server starts on `http://localhost:3000`. No build errors. Compile completes without the `formatOptionLabel`/`formatQuantity` modules erroring out.

- [ ] **Step 3: Cart smoke**

Browser: navigate to the cart page. Log in with a test account from `~/.claude/projects/-Users-milovan-projects-divinipress-store/memory/reference_app_login.md`. Add a non-apparel product to cart with backend-served `metadata.options` including `quantity` (string) and at least two other keys (e.g., `material`, `size`).

Expected:
- Non-apparel cart card renders a dedicated `Quantity:` row above the option list, formatted with thousands separator if quantity ≥ 1000 (e.g., `Quantity: 1,500` for `metadata.options.quantity = "1500"`).
- `quantity` does NOT appear inside the options iteration.
- Remaining option keys appear in alphabetic order.
- Apparel cart line (if any) still renders correctly with `formatQuantity(itemQuantity)` on the per-line Quantity row.

- [ ] **Step 4: Customer order detail smoke**

Browser: navigate to `/orders/<existing-non-apparel-order-id>`. (If no such order exists in the local seed, create one by checking out a non-apparel cart, or coordinate with Ivan.)

Expected:
- Non-apparel line items render the dedicated `Quantity: <formatted>` row above the option list.
- `quantity` does NOT appear inside the options iteration.
- Remaining option keys appear in alphabetic order with proper title-casing (e.g., `color_choice` → `Color Choice`).
- For an apparel order with quantity ≥ 1000, the apparel-side `Quantity:` row at line 90 of `LineItemRow` shows the formatted value (e.g., `Quantity: 1,500`).
- Same apparel order's desktop price block (visible at `md:` breakpoint and above) shows `... × 1,500 ...` in the unit-price row.

- [ ] **Step 5: Admin order detail smoke**

Browser: log out, log in as an admin user, navigate to `/admin/orders/<existing-non-apparel-order-id>`.

Expected:
- Same three behaviors as the customer surface (Quantity-first row, alphabetic options, formatted thousands separator).
- For an apparel admin view with quantity ≥ 1000, the apparel-side `Quantity:` row at line 281 of `_components.tsx` shows the formatted value.

- [ ] **Step 6: Empty-options edge case**

If a non-apparel line is rendered with `productOptions === {}` (no keys at all), confirm the italic muted `"Custom configuration"` placeholder appears on BOTH order-detail surfaces (customer and admin) where today an empty `<div>` rendered nothing visible.

If creating an empty-options test fixture is not feasible against the local backend, accept this step as best-effort and note it in the campaign report.

- [ ] **Step 7: Final type-check and lint sweep**

Run: `npx tsc --noEmit`
Expected: clean exit across all touched files.

Run: `yarn lint`
Expected: no new warnings on any of the five files touched by this plan.

- [ ] **Step 8: Final state confirmation (no commit unless cleanup needed)**

Run: `git status` and `git log --oneline feature/div-71-non-apparel-cart-rendering..HEAD`
Expected branch state at completion: three commits ahead of `feature/div-71-non-apparel-cart-rendering`, working tree clean. Commits should read:

```
<sha> feat(orders): non-apparel rendering parity on admin order detail (DIV-72)
<sha> feat(orders): non-apparel rendering parity on customer order detail (DIV-72)
<sha> refactor(utils): extract formatOptionLabel and formatQuantity from cart inline (DIV-72)
```

If smoke verification surfaces a regression that wasn't caught by type-check or lint, fix it inline as a fourth commit and document in the campaign report.

---

## Acceptance criteria — full plan

These mirror the spec § Acceptance criteria. The plan is complete only when every criterion is satisfied:

1. `src/app/_utils/formatOptionLabel.ts` and `src/app/_utils/formatQuantity.ts` exist with the bodies in Task 1 steps 1-2 (byte-equivalent to DIV-71 cart inline modulo docstrings).
2. `src/app/cart/page.tsx` no longer contains inline declarations of `formatOptionLabel` or `formatQuantity`. Both are imported from `@utils/*`. The three pre-edit call sites (lines `537`, `547`, `560`) still resolve and render identically to DIV-71's `940657a5`.
3. Customer order-detail (`line-item-row.tsx`) — non-apparel: non-empty `productOptions` renders `Quantity: <formatted>` row first, then options sorted alphabetically with `formatOptionLabel`-titled keys, `quantity` filtered from the iteration; empty `productOptions` renders italic muted `"Custom configuration"`.
4. Customer order-detail apparel and price block: `Quantity:` row at line 90 uses `formatQuantity(item.quantity)`; desktop price-block quantity at line 125 uses `formatQuantity(item.quantity)`.
5. Admin order-detail (`_components.tsx`) — non-apparel: same two behaviors as (3), bound to admin field names.
6. Admin order-detail apparel: `Quantity:` row at line 281 uses `formatQuantity(product.itemQuantity)`.
7. **Visual deltas on order detail** (intended user-visible): new `Quantity:` row above non-apparel option list; alphabetic sort; thousands separator on quantities ≥ 1000; `"Custom configuration"` placeholder for empty options; apparel desktop price block shows `× 1,500` instead of `× 1500`.
8. `npx tsc --noEmit` is clean.
9. `yarn lint` is clean (no new warnings on touched files).
10. No render-shape changes to apparel beyond the `formatQuantity` swap. Color, sizeBreakdown, Decoration, brandStyle, artworkPlacements blocks are untouched.
11. No edits to adapters (`useOrderDetail.ts`, `useAdminOrderDetail.ts`, `useCart.ts`), types (`src/components/orders/types.ts`), or any file outside the five enumerated.

---

## Out of scope (carry forward from spec)

- ❌ No `productType` discriminator helper, hook, or component.
- ❌ No `<NonApparelOptions>` (or similar) shared options component.
- ❌ No tests for the helpers.
- ❌ No changes to adapters or backend.
- ❌ No re-shape of apparel rendering beyond `formatQuantity`.
- ❌ No edits to `src/components/orders/types.ts`.
- ❌ No `<dl>` or `<table>` semantic upgrade.
- ❌ No widening of `formatOptionLabel` to split underscores within curated labels.
- ❌ No tightening of `formatQuantity`'s `undefined` failure mode.
- ❌ No fix for the customer/admin guard asymmetry on empty-string `productType` (flagged in spec § Latent issues; deferred).
