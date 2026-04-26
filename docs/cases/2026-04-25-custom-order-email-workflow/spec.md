# Spec: Non-Apparel Email Subscriber Retrofit

**Date:** 2026-04-25
**Project:** Non-Apparel Catalog Launch
**Closes:** DIV-97 (Decide transactional follow-up scope for checkout and confirmation email)
**Parent:** DIV-85
**Sibling-of:** DIV-99 (in review at `feature/div-82-importer-hierarchy` worktree, `377a9d9`) — **HARD PREREQUISITE: this PR merges AFTER DIV-99 merges to develop. No fallback shim.** The helper imports `isNonApparelProductType` from a file that does not exist on develop today; landing this PR first would break the build.
**Author:** Publius Auctor (Consul)
**Revision:** v5 — Censor + Provocator verified v4 and surfaced six substantive findings the prior pass missed. v5 patches all six per Imperator dispositions: integration tests dropped entirely (test env loads neither Resend nor `notification-local`, so observability assertions were unimplementable as written; validator + helper coverage stays at unit level which is sufficient); discriminator-import claim toned down (cart subsystem itself has TWO predicates — `isNonApparelMetadata` at `carts/type.ts:104-108` for runtime branching, `isNonApparelProductType` at `non-apparel-type.ts:7-8` for schema validation — the helper uses the latter because by event time the metadata has been schema-parsed; "forever tied" was overstated); HEAD reference corrected to `377a9d9` and the `custom-complete/route.ts:248-252` gate reframed as intentional DIV-99 hardening (not dead code); DIV-99 sequencing made an explicit hard prerequisite in Implementation Order step 0; `__tests__/` location safety verified empirically via boot-log smoke check (loader-safety verification, no precedent for `src/modules/{x}/utils/__tests__/` exists in repo despite the architectural claim being correct in source); multi-item non-apparel rendering trimmed back — helper accepts array input (natural pre-grouped shape) but reads `items[0]` only for non-apparel; storefront produces one item per `group_id` per `standardCartHelpers.ts`, broad multi-item handling was forward-looking overengineering. Plus: `current_year: .toString()` to match service.ts's declared `"string"` type, line-number precision (`calculate-promo-print-prices.ts` lives under `steps/` at `:154-159`), `jsonb` wording sharpened to "not preserved" (PostgreSQL spec language), apparel `product_name`-vs-`product_title` divergence note added (preserves existing apparel behavior; prevents implementer from "harmonizing" branches), `lineItemsList` join-separator specified as `.join("")`. Prior revisions: v1 framed work as Medusa-mandated workflow lift (dropped); v2 mis-located helper at `src/subscribers/_utils/` (relocated v3 to `src/modules/resend/utils/`); v3 carried the discriminator contradiction + unrunnable integration path + false single-item invariant + dashboard scope leak (all patched v3→v4 from Imperator's Codex Consul review); v4 over-engineered multi-item non-apparel + had non-functional integration tests + mis-stated dual-predicate-prevention + cited stale worktree HEAD + miscalled intentional hardening "dead code" + lacked DIV-99 sequencing constraint + lacked test-file loader-safety verification (all patched v4→v5 from Censor + Provocator round 4 review).

---

## Why

Two real problems, one preexisting and one inbound.

**Preexisting bug, just discovered:** `src/modules/resend/service.ts:144-150` validates that every required template variable is `!== undefined` and silently returns `false` when any is missing. The current `custom-order-created.ts` subscriber spreads `tax`, `tax_description`, `discount`, `discount_description` *conditionally* (only when nonzero), and the Resend templates `ORDER_RECEIVED_CUSTOM` / `ORDER_CONFIRMED_PROOFED` declare all four as required. Result: any order without both tax AND discount fails the validator and never sends the email. Logger emits `Invalid variables` and moves on. This bug is in production today.

**Inbound bug:** DIV-99 (in review, worktree `feature/div-82-importer-hierarchy`) opens the cart route to non-apparel orders and locks down `NonApparelMetadataSchema`. The subscriber was not touched in that worktree. When DIV-99 merges to develop, every non-apparel order will fire `custom-order.created`, hit the apparel-shaped formatter, and ship a confirmation email with empty `Color:` field and missing options. The retrofit is a merge prerequisite for DIV-99.

This spec adds a pure helper that formats line items per metadata shape (apparel vs non-apparel), refactors `custom-order-created.ts` to consume it, and patches the validator bug in the same PR.

> **Confidence: High** — bug verified at `src/modules/resend/service.ts:144-150`. DIV-99 schema verified at worktree `src/modules/custom-order/non-apparel-type.ts:14-28`. Both subscribers verified against current `develop`.

---

## Goal & V1 Outcome

**V1 outcome:**
- Apparel orders fire `ORDER_RECEIVED_CUSTOM` / `ORDER_CONFIRMED_PROOFED` for **every** completed order, regardless of tax/discount values (validator bug fixed).
- Non-apparel orders fire the same templates with stacked card rows showing options from `metadata.options` + `metadata.options_labels`.
- Card HTML is safe against importer-supplied or customer-supplied special characters (HTML-escaped).
- Apparel rendering visually matches non-apparel (same card chrome, different field inventory) so the customer sees a consistent format regardless of product type.
- Future P1/P2 email events (tracking, proof-approved, etc.) can import the helper directly — single source of truth for line-item-to-HTML conversion.

> **Confidence: High** — Imperator approved Option 2 (Path B + bug fix) explicitly.

---

## Out of Scope (explicit)

- **Workflow lift.** Subscribers stay structurally like `password-reset.ts`. The lift was rejected after verifier findings showed it was sold on a misread of `arch-workflow-required` (mutations rule, not side-effects rule). Future P1/P2 emails follow the same inline-with-helper pattern.
- **Resend dashboard template work.** Slice 2, separate spec coming next session per Imperator (templates-as-code via `resend templates create --react-email` CLI).
- **`custom-order-proof-ready.ts` refactor.** No non-apparel correctness issue (the `PROOF_READY` template's variable bag is generic — `customer_name`, `order_id`, `product_title`, `proof_url`, `sub_order_id`). The original v1 lift justification was consistency with the workflow refactor; that's gone. Leave it alone.
- **DIV-100.** Saved-product creation for non-apparel approveProof — separate ticket.
- **New email events** — proof-approved, proof-rejected, tracking-added, in-production, delivered. Each is its own follow-up subscriber built on the same helper.
- **DIV-95 quantity display rule.** Whatever DIV-95 settles becomes the rule the formatter obeys; this spec does not redefine it. Quantity for non-apparel renders as just another option value.
- **Mixed-cart special-casing.** Mixed apparel + non-apparel cart is reachable per `custom-complete/route.ts:93-99` (proof_type=ORDER allows multiple items) but is an edge case not specifically targeted. The helper handles it correctly per group with its own discriminator; template selection follows current logic. Out of scope for V1.
- **Worktree gate at `custom-complete/route.ts:248-252`.** DIV-99 hardens saved-product auto-approval by gating on `metadata.product_type === "apparel"` (commit `d71ef4d`, "DIV-99 hardening: prevents non-apparel ORDER items from auto-approving via custom_order_id"). This is intentional and load-bearing — non-apparel orders sharing a `product_id` with a saved apparel product would otherwise auto-approve at completion, skipping proof flow. Re-evaluate when DIV-100 introduces non-apparel saved products. Not a bug, not in this spec's scope, just flagged for shared awareness.

---

## Domain Context

> **Confidence: High** on entity references — verified against `$CONSILIUM_DOCS/doctrine/domain/{products,orders,proofing,naming}.md`.

**Three metadata objects (the trap, per `naming.md`):** `product.metadata`, `item.metadata`, `custom_order.metadata`. This spec touches **`item.metadata`** (line item level) only.

**The two metadata contracts on `item.metadata`:**

- **Apparel** (`src/modules/custom-order/apparel-type.ts`, `ApparelMetadataSchema`): `group_id`, `upload_ids`, `selections`, `design_notes`, `product_name`. Color/Size are read from `item.variant.options` by `option.title`. **No `product_type` key.** The apparel storefront helper at `divinipress-store/src/app/_api/catalog/saveAndAddToCart.ts:10-16` does not write it.

- **Non-apparel** (`src/modules/custom-order/non-apparel-type.ts:14-28`, present only in DIV-99 worktree): `product_type` (required, non-empty, never `"apparel"`), `group_id`, `upload_ids`, `options: Record<string, string>`, `options_labels?`, `product_name?`, `design_notes?`. Schema is `.strict()` at write time.

**Post-pricing-step augmentation:** the worktree's `src/workflows/pricing/steps/calculate-promo-print-prices.ts:154-159` adds `production_option_type` to non-apparel line item metadata after pricing. So by the time `custom-order.created` fires, the persisted `metadata` has 8 keys, not 7. The helper does not read this key but the spec acknowledges the shape.

> **Confidence: High** — `production_option_type` augmentation verified in worktree.

**The discriminator:** the helper imports `isNonApparelProductType` from `src/modules/custom-order/non-apparel-type.ts` rather than hand-rolling a discriminator.

```ts
// from src/modules/custom-order/non-apparel-type.ts
export const isNonApparelProductType = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.trim() !== "apparel";
```

The predicate routes:
- absent / `null` / `undefined` / non-string / empty-after-trim → **apparel branch**
- exactly `"apparel"` (or `"apparel"` after trim) → **apparel branch**
- any other non-empty string → **non-apparel branch**

**Two predicates exist in the cart subsystem; the helper uses the right one for its lifecycle stage.** `carts/type.ts:104-108` defines a separate `isNonApparelMetadata(m)` used at the cart route's runtime *pre-parse* branching (`line-items-custom/route.ts:39-47`) — this one does not call `.trim()` and does not reject empty strings. `non-apparel-type.ts:7-8` defines `isNonApparelProductType(v)` used by `NonApparelMetadataSchema`'s `.refine((v) => v !== "apparel")` validation. By the time `custom-order.created` fires, line-item metadata has already been parsed against `NonApparelMetadataSchema`; therefore `product_type` in persisted metadata satisfies `isNonApparelProductType` (trimmed, non-empty, non-`"apparel"`). The helper is *aligned with the schema* (post-validation state), not with the cart-route's pre-parse branch. Both predicates are correct for their respective layers.

> **Confidence: High** — both predicates verified in worktree. The helper's choice (`isNonApparelProductType`) matches the persisted-metadata contract.

**Two emails affected by this spec:**

| Event | Template | Variable bag |
|-|-|-|
| `custom-order.created` | `ORDER_RECEIVED_CUSTOM` (proof required) or `ORDER_CONFIRMED_PROOFED` (saved-product reorder) | customer_name, order_id, order_date, order_url, line_items_list (HTML), subtotal, shipping, total, current_year, **always-present** tax/tax_description/discount/discount_description |

The third subscriber affected (`PASSWORD_RESET`, `INVITE_TEAM_MEMBER`, `PROOF_READY`) are out of scope per "Out of Scope" above.

---

## Architecture

> **Confidence: High** — file location revised v2→v3 after both verifiers caught that `src/subscribers/_utils/` would be scanned by the Medusa subscriber loader (helper file emits a noisy `warn` on every boot; test file crashes boot with `ReferenceError: describe`). The `src/api/_utils/` precedent does not transfer — API router and subscriber loader have different exclusion behavior. Helper is now co-located with its consumer module.

### File layout

```
src/modules/resend/
└── utils/
    ├── format-email-line-item.ts            # PURE helper — apparel | non-apparel branch + HTML escape
    └── __tests__/
        └── format-email-line-item.unit.spec.ts

src/subscribers/
└── custom-order-created.ts                  # MODIFIED — calls helper, fixes validator bug
```

That's the entire architectural footprint. Three files: one helper, one test file, one modified subscriber.

### Why this shape

- **Inline pattern is canonical Medusa.** The v1 spec's claim that subscribers must call workflows for side effects was a misread of `arch-workflow-required` (which is about mutations). Medusa's official `auth.password_reset` example shows subscribers calling `notificationModuleService.createNotifications` directly. `password-reset.ts` and `user-invited.ts` in this repo follow that pattern.
- **Helper colocation with the consumer module.** The helper produces HTML that is consumed by Resend templates. Living at `src/modules/resend/utils/` co-locates the formatter with the templates it serves. Pattern matches existing repo precedent at `src/workflows/pricing/utils/` and `src/modules/custom-order/utils/` — utilities live inside the area that owns them.
- **No subscriber-loader interaction.** `src/modules/resend/utils/` is outside the subscriber loader's scan path. Medusa's module loader only auto-loads `index.ts`, `service.ts`, `models/`, `migrations/` — not arbitrary `utils/` subdirs. The helper is invisible to all loaders; it's just a file the subscriber imports explicitly.
- **Helper isolation.** Pure function. No Medusa runtime dependency. Unit-testable in isolation. Doesn't import any module service — `arch-module-isolation` not violated despite living inside `src/modules/resend/`.
- **No workflow rollback overhead.** Resend's `createNotifications` is non-rollbackable anyway. Failure handling stays exactly as today (the resend service swallows errors and logs).

The subscriber imports via `@/modules/resend/utils/format-email-line-item` (alias `@/*` → `./src/*` per `CLAUDE.md`).

> **Confidence: High** — verified `password-reset.ts` and `user-invited.ts` shapes; verified `src/workflows/pricing/utils/` precedent for module-area utility colocation; verified subscriber loader scan is bounded to `src/subscribers/`; verified test runner glob `**/src/**/__tests__/**/*.unit.spec.[jt]s` matches the new test file path.

---

## Data Contract — the Helper

The helper formats ONE card's worth of line items. A card is the visual unit shown in the email. The grouping-by-`group_id` logic stays in the subscriber (matches the existing `groupedItems` reducer at `custom-order-created.ts:60-74`); the helper receives a pre-grouped array.

```ts
// src/modules/resend/utils/format-email-line-item.ts

export type EmailLineItemInput = {
  product_title: string | null
  quantity: number
  metadata: Record<string, unknown> | null
  variant?: {
    options?: Array<{
      value: string
      option?: { title: string } | null
    }> | null
  } | null
}

export type EmailLineItemCardOutput = {
  // Pre-rendered HTML for one card. The subscriber concatenates cards across
  // groups via .join("") into the line_items_list template variable.
  // HTML-escaped against importer-supplied keys and customer-supplied values.
  rowHtml: string

  // Optional structured form for unit-test assertions and future P1/P2 templates
  // that may consume structured variable bags.
  structured: {
    productName: string
    fields: Array<{ label: string; value: string }>
  }
}

// Input is an ARRAY representing one group's worth of items (the subscriber's
// existing groupedItems reducer produces this shape — kept verbatim).
// Apparel branch: iterates the array (one card aggregating all sizes for this product).
// Non-apparel branch: reads items[0] only; storefront produces one item per group_id
//   today (verified at divinipress-store standardCartHelpers.ts). The array signature
//   is preserved because the input shape is array-typed; broader multi-item rendering
//   is not a V1 design promise.
export function formatEmailLineItemCard(
  items: EmailLineItemInput[],
): EmailLineItemCardOutput
```

> **Confidence: High** on input shape — mirrors `query.graph` field selection from existing subscriber. **Confidence: Medium** on TypeScript exactness — the actual `query.graph` return type may have `option: { title: string | null } | null | undefined` that requires a small narrowing cast at the subscriber-to-helper boundary. Implementer-time fix, not a spec-level concern.

### Apparel branch

**Discriminator:** `!isNonApparelProductType(items[0].metadata?.product_type)` (negation of the imported predicate). Catches absent / null / undefined / empty / non-string AND the explicit `"apparel"` carve-out.

**Reads:**
- `items[0].product_title` → product name
- `items[0].variant.options[].option.title === "Color"` → color value (locked to one color per card)
- For each item in the array: `option.title === "Size"` → size value, plus `item.quantity`
- Sort `(size, quantity)` pairs using `SIZE_ORDER` (preserved verbatim from `custom-order-created.ts:5-20`)

**Product name source:** `items[0].product_title` only. The apparel branch deliberately preserves current-subscriber behavior (`custom-order-created.ts:81`). It does NOT fall back to `metadata.product_name` like the non-apparel branch does. Customers who supplied `product_name` for an apparel order (e.g., "Youth Group Tees 2026") see the catalog title in their email today; this spec preserves that. Aligning to `product_name` first like non-apparel is a UX call out of scope here — flagged so an implementer doesn't "harmonize" the two branches and silently change apparel email content.

**Output structured fields example:**
```
{
  productName: "Bella Canvas 3001 Unisex Jersey Tee",
  fields: [
    { label: "Color", value: "Black" },
    { label: "Sizes", value: "M - 10, L - 8, XL - 4" }
  ]
}
```

**Output for empty-Color case:**
```
{
  productName: "Bella Canvas 3001 Unisex Jersey Tee",
  fields: [
    { label: "Sizes", value: "M - 10, L - 8" }
  ]
}
```

**Empty-value handling:** if Color is missing from variant options (e.g., natural finish products), the `Color` row is omitted from the output entirely — not rendered as `Color: ` (empty value). This is a small visual cleanup vs the v1 plan; addresses Provocator CONCERN that empty rows look worse in card layout than in single-line format.

> **Confidence: High** on data flow — mirrors existing subscriber loops at lines 80-106. **Confidence: Medium** on the `"Sizes"` label — current subscriber emits `Quantity (M - 10, ...)`. Imperator should confirm `"Sizes"` reads better in card form, or push back to keep `"Quantity"`.

### Non-apparel branch

**Discriminator:** `isNonApparelProductType(items[0].metadata?.product_type)` returns true.

**Single-item per group_id:** the storefront's non-apparel cart-write path (`divinipress-store/src/app/_api/catalog/standardCartHelpers.ts:62-88`) calls `generateGroupId()` for every non-apparel write and posts ONE item per call with `quantity: 1`. So `items.length === 1` holds *by storefront convention* in V1. The cart route at `src/api/store/carts/[id]/line-items-custom/route.ts:39-47` does not *enforce* single-item (it enforces single-*type*), but no current frontend path produces multi-item non-apparel groups. The helper reads `items[0]` only; if a future product flow ever needs multi-item non-apparel groups, that's a follow-up — the array signature is preserved so an extension is mechanical, but V1 does not promise multi-item rendering as a documented feature.

**Reads (`items[0]` only):**
- `items[0].metadata.product_name ?? items[0].product_title ?? "(unnamed item)"` → product name
- `items[0].metadata.options` (defensive: treat undefined/null as `{}`) → option pairs
- `items[0].metadata.options_labels ?? {}` → optional human labels

**Behavior:**
- Sort `Object.entries(metadata.options)` **alphabetically by key** for deterministic V1 output. The cart route receives ordered options from the storefront (a JS `Record` literal preserves insertion order in transit), but Medusa stores line-item `metadata` as PostgreSQL `jsonb`, and per the PostgreSQL specification `jsonb` does not preserve object key order on write. By the time `custom-order.created` fires, the subscriber's `query.graph` returns options in whatever order Postgres returns them — original storefront order is lost at the storage boundary. Alphabetical is the only deterministic option without a schema change.
- For each `[key, value]` pair, label = `options_labels[key] ?? humanize(key)`. `humanize` is `key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())`.
- Empty `value` → omit the row entirely (same rule as apparel empty Color).
- `items[0].quantity === 1` always per non-apparel; customer-facing quantity is one of the option values inside `metadata.options`.

**Why not read product-level `options_order`:** the importer at `src/_custom/utils/promo-print-product/importer.ts:83` persists `options_order: string[]` on **product.metadata**. Line item metadata does not carry it. Reading it would require `query.graph` from inside the helper, which would break the helper's purity (no Medusa runtime dependency, unit-testable in isolation, single-responsibility). The DIV-99 follow-up ticket is to mirror `options_order` onto line-item metadata at write time (cart route or pricing workflow); once shipped, the helper switches to that field — single-line change. Filed as Open Question.

> **Confidence: High** on field iteration, single-item-by-storefront-convention, and `jsonb` order-loss rationale. **Confidence: Medium** on alphabetical sort being acceptable V1 — Imperator may prefer to push the DIV-99 follow-up first to get semantic order before this email retrofit ships.

### HTML escaping

All values that flow into `rowHtml` (productName, label, value) pass through an `escapeHtml(s: string): string` private helper that maps `& < > " '` to their HTML entities. Importer-supplied keys (via `humanize`) AND customer-supplied option values (via the cart) AND product titles all pass through escape. Prevents an importer from landing a key like `<script>` and an email being shipped with that markup.

> **Confidence: High** — straightforward defensive code.

---

## Behavior Contract — Card Row HTML

Both apparel and non-apparel produce the same outer shape.

```html
<div style="border:1px solid #e5e5e5;border-radius:6px;padding:12px;margin-bottom:8px;font-family:inherit;">
  <div style="font-weight:600;font-size:15px;margin-bottom:6px;">${escapeHtml(productName)}</div>
  <div style="font-size:14px;line-height:1.6;">
    <div><span style="color:#666;">${escapeHtml(label1)}:</span> ${escapeHtml(value1)}</div>
    ...
  </div>
</div>
```

`line_items_list` is constructed in the subscriber by calling `formatEmailLineItemCard()` once per group and concatenating the `rowHtml` outputs with `.join("")` — no separator needed because each card carries its own `margin-bottom`. (Replaces the existing subscriber's `.join("<br>")` pattern at `custom-order-created.ts:111`.)

> **Confidence: Medium** on inline-style choices — these are tunable values; the dashboard template chrome may render them differently. The structure (div + header + label-value rows) is firm.

---

## The Validator Bug Fix

### The bug

In `custom-order-created.ts:139-150`, the conditional spread:

```ts
...(order.tax_total !== 0 ? { tax: ..., tax_description: "Tax" } : {}),
...(order.discount_total !== 0 ? { discount: ..., discount_description: "Discount" } : {}),
```

omits four keys from the variables bag when totals are zero. `src/modules/resend/service.ts:144-150`'s `validateTemplateVariables` rejects the send if any registered required variable is `undefined`. Both templates declare all four. Result: silent drop for any order without both tax AND discount.

### The fix — extract `buildOrderEmailVariables`

The variable-bag construction moves out of the subscriber body into a top-of-file pure helper inside `custom-order-created.ts`:

```ts
// Top-of-file helper, exported for unit testing.
export function buildOrderEmailVariables(input: {
  order: { /* fields needed: id, email, total, subtotal, shipping_total, tax_total, discount_total, created_at */ }
  customerName: string
  lineItemsList: string
  orderUrl: string
}): Record<string, string> {
  const { order, customerName, lineItemsList, orderUrl } = input
  return {
    customer_name: customerName,
    order_id: order.id,
    order_date: /* formatted */,
    order_url: orderUrl,
    line_items_list: lineItemsList,
    subtotal: `$${Number(order.subtotal).toFixed(2)}`,
    shipping: `$${Number(order.shipping_total).toFixed(2)}`,
    total: `$${Number(order.total).toFixed(2)}`,
    current_year: new Date().getFullYear().toString(), // service.ts declares "string"; preserves existing subscriber behavior
    // Always-include keys with empty-string fallback so validateTemplateVariables passes.
    tax: order.tax_total !== 0 ? `$${Number(order.tax_total).toFixed(2)}` : "",
    tax_description: order.tax_total !== 0 ? "Tax" : "",
    discount: order.discount_total !== 0 ? `$${Number(order.discount_total).toFixed(2)}` : "",
    discount_description: order.discount_total !== 0 ? "Discount" : "",
  }
}
```

The subscriber body calls this helper once per template, then passes the result straight into `notificationModuleService.createNotifications`.

### Why a top-of-file helper, not its own file

The helper is subscriber-specific (knows the variable contract for `ORDER_RECEIVED_CUSTOM` / `ORDER_CONFIRMED_PROOFED`). Future P1/P2 emails (proof-approved, tracking-added) would each have their own variable-bag helper next to their own subscriber. Co-location with the subscriber keeps the contract obvious. `format-email-line-item.ts` is the cross-subscriber helper because line-item rendering is the part that recurs.

### Why this proves the fix at unit-test level

`medusa-config.ts:73-94` registers `notification-local` only when `isDevelopment === true`. In `NODE_ENV=test`, both `isDevelopment=false` AND `!isTest=false`, so the providers spread is `[]` — neither Resend nor `notification-local` is loaded. The notification module with empty providers throws `MedusaError.NOT_FOUND` on `createNotifications` calls (`notification-module-service.js:85-91`). An integration test asserting validator behavior cannot run. The fix is proved at unit-test level instead, with three unit-test groups (see Test Plan):

1. `buildOrderEmailVariables` always emits all four tax/discount keys regardless of zero/nonzero totals.
2. `validateTemplateVariables` rejects undefined values for declared required variables (sanity test on the validator's contract — guards against silent regressions to the validator itself).
3. Helper unit tests prove the rendered card HTML and structured output for both branches.

Together: "the bag is well-formed AND the validator enforces what we think it enforces AND the helper produces the right HTML."

### The dashboard template assumption

The Resend dashboard template's conditional rendering (`{{#if tax}}...{{/if}}` or equivalent) must treat empty strings as falsy and hide the row, otherwise customers see `Tax: ` (empty) regression. **This is verified by the implementer pre-merge at Implementation Order step 4** — `resend templates get <id>` + grep. If the templates render unconditionally, **halt and surface to the Imperator**. No tactical template edits in this PR; dashboard work is Slice 2's lane.

> **Confidence: High** that the fix removes the silent-drop and that the proof at unit-test level is correct. **Confidence: High** that dashboard verification belongs in Slice 2 — Imperator confirmed.

---

## Edge Cases

| Case | Behavior |
|-|-|
| Line item with no metadata | Skip — preserves `custom-order-created.ts:63` |
| Line item with metadata but no `group_id` | Skip — preserves `custom-order-created.ts:66` |
| Customer has no email | Workflow short-circuits — preserves `custom-order-created.ts:55-57` |
| Mixed apparel + non-apparel groups in one order | Helper handles each group with its own discriminator. Template selection follows existing logic (`.some()` on `original_custom_order_id`). Out-of-scope for explicit testing. |
| Multiple non-apparel items in one `group_id` (theoretical, not produced by storefront in V1) | Helper reads `items[0]` only and ignores the rest. Storefront's `standardCartHelpers.ts` produces one item per `group_id` per non-apparel write, so this case is unreachable today. Forward-looking extension is filed in Open Questions §7. |
| All line items filtered out | Empty `line_items_list`, email still fires (totals still useful). Preserves current behavior at `custom-order-created.ts:74-111`. |
| Non-apparel `metadata.options` empty `{}` | Card with just product name, no field rows. Defensive. |
| `options_labels` missing entirely | `humanize(key)` fallback applied to all fields. |
| `options_labels` partially populated | Mix of labels and `humanize` fallbacks. |
| `product_title` null AND `metadata.product_name` missing | Render `(unnamed item)`. Should not occur in practice. |
| Apparel item with empty/missing `Color` value | Color row omitted entirely (visual cleanup vs single-line format). |
| Apparel item where `metadata.product_type === "apparel"` (DIV-99 carve-out, future-proofing) | `isNonApparelProductType` returns false → routes to apparel branch as intended. |
| Apparel item where `metadata.product_type` is unexpectedly some other non-empty string | Routes to non-apparel branch, attempts to read `metadata.options` (will be undefined for apparel) → defensive default returns card with just product name. Acceptable degraded state for unexpected data. |
| Catalog proof flow (qty=1, price=0) | Workflow runs unchanged. Template selection branch logic at `custom-order-created.ts:114-119` is preserved verbatim. |
| Importer-supplied option key contains HTML special chars | `escapeHtml` neutralizes. No injection. |
| `tax_total === 0 AND discount_total === 0` (the validator-bug regression case) | `buildOrderEmailVariables` emits `tax: ""`, `tax_description: ""`, `discount: ""`, `discount_description: ""`. Validator passes. Dashboard template's `{{#if}}` conditionals hide empty rows. |

> **Confidence: High** — walked the existing subscriber line-by-line and matched each branch.

---

## File-by-File Changes

### Created

| Path | Purpose |
|-|-|
| `src/modules/resend/utils/format-email-line-item.ts` | The pure helper. ~100-140 lines. Imports `isNonApparelProductType` for the discriminator, branches accordingly, returns `{ rowHtml, structured }`. Includes private `escapeHtml` and `humanize` helpers. Non-apparel branch iterates input array (one card per item). |
| `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts` | Helper unit tests, 17 cases. |
| `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts` | Subscriber-helper unit tests for `buildOrderEmailVariables`. 6 cases proving all four tax/discount keys defined regardless of value. |
| `src/modules/resend/__tests__/validate-template-variables.unit.spec.ts` | Direct unit tests on `validateTemplateVariables` proving the contract: undefined required values rejected, defined values (including empty string) accepted. 4 cases. |

### Modified

| Path | Change |
|-|-|
| `src/subscribers/custom-order-created.ts` | (1) Add top-of-file exported `buildOrderEmailVariables(input)` helper. (2) Replace per-group inline formatter (lines 76-111) with `formatEmailLineItemCard()` calls. (3) Replace conditional tax/discount spread (lines 139-150) with `buildOrderEmailVariables` call producing always-include keys with empty-string fallbacks. ~70 lines changed total. |

### Deleted

None.

> **Confidence: High** on file list and scope.

---

## Test Plan

### Unit (helper) — `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`

Each discriminator-routing case (4-8) MUST also assert the resulting card HTML, not just the branch chosen — otherwise routing-only tests pass while the branch crashes in production on missing fields.

1. Apparel: full input (product_title, color, sizes, quantities) → expected card HTML and structured output.
2. Apparel: variant has no Color option → Color row omitted (NOT rendered as empty); structured output's `fields` excludes the Color entry.
3. Apparel: variant has no Size option → Sizes row omitted entirely (consistent with empty-Color rule).
4. Apparel: discriminator `metadata.product_type === undefined` → apparel branch + correct card output.
5. Apparel: discriminator `metadata.product_type === ""` (empty string) → apparel branch + correct card output.
6. Apparel: discriminator `metadata.product_type === null` → apparel branch + correct card output.
7. Apparel: discriminator `metadata.product_type === "apparel"` (DIV-99 carve-out) → apparel branch + correct card output. Tests the explicit `isNonApparelProductType` exclusion.
8. Apparel: `metadata.product_name` is set, but helper still uses `product_title` (preserves current-subscriber behavior; the implementer must not "harmonize" with non-apparel's `product_name ?? product_title` fallback).
9. Non-apparel: full input with `options_labels` → labels resolved correctly.
10. Non-apparel: missing `options_labels` → `humanize` fallback for every field.
11. Non-apparel: partial `options_labels` → mix of labels and fallbacks.
12. Non-apparel: empty `metadata.options` `{}` → card with just product name, no field rows.
13. Non-apparel: missing `product_name`, present `product_title` → falls back to product_title.
14. Non-apparel: alphabetical key sort verified across multiple options.
15. HTML escape: option key `<script>foo</script>` → emitted as escaped entities.
16. HTML escape: option value with `&"<>` → emitted as escaped entities.
17. Defensive: `items === []` (empty array) → returns `{ rowHtml: "", structured: { productName: "", fields: [] } }` without throwing.

### Unit (subscriber-helper) — `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

Direct proof of the validator-bug fix at unit-test level. Integration coverage is intentionally not provided (see §"Why no integration tests" below).

1. `tax_total !== 0 AND discount_total !== 0` → emits `tax: "$X.XX"`, `tax_description: "Tax"`, `discount: "$Y.YY"`, `discount_description: "Discount"`. All four keys defined.
2. `tax_total === 0 AND discount_total === 0` (the regression case) → emits `tax: ""`, `tax_description: ""`, `discount: ""`, `discount_description: ""`. **All four keys defined as empty strings, not undefined.** This is the bug fix proof.
3. `tax_total !== 0 AND discount_total === 0` → tax populated, discount keys empty.
4. `tax_total === 0 AND discount_total !== 0` → discount populated, tax keys empty.
5. Negative discount/tax (refunds) → numeric formatting handles correctly.
6. `current_year` emitted as a string (`new Date().getFullYear().toString()`), matching service.ts's declared `"string"` type and the existing subscriber's behavior.

### Unit (validator contract) — `src/modules/resend/__tests__/validate-template-variables.unit.spec.ts`

Sanity test on `validateTemplateVariables` directly. Guards against future changes that might silently weaken the validator (e.g., someone "fixing" the silent return-false to log+continue).

1. All required keys present and non-undefined → returns true.
2. Required key with value `undefined` → returns false.
3. Required key with value `""` (empty string) → returns true. Confirms the bug-fix contract: empty-string IS valid, only undefined is not.
4. Required key with value `0` (numeric zero) → returns true. Same contract.

### Why no integration tests

The original spec proposed integration tests asserting `notification-local`'s `createNotifications` was invoked. **`medusa-config.ts:73-94` registers `notification-local` only when `isDevelopment === true`; in `NODE_ENV=test`, neither Resend nor `notification-local` is loaded** (`isDevelopment=false` and `!isTest=false`, so the providers spread is `[]`). Calling `createNotifications` against an empty-providers notification module throws `MedusaError.NOT_FOUND` from `notification-module-service.js:85-91`. The proposed assertions could not run. The Imperator's call: do not amend `medusa-config.ts` to register `notification-local` in test mode just to make this spec's tests easier — that widens runtime config for test convenience. The validator-bug fix is fully proved by the three unit-test groups above; the helper's HTML/structured output is fully proved by the helper unit tests. End-to-end inbox verification is the staging-time manual check (see below).

### Manual recipe

After implementation, against staging with a real Resend API key (`NODE_ENV=production` or any environment where Resend is actually loaded per `medusa-config.ts:73-94`): place one apparel order with no tax/discount and one non-apparel order. Confirm both emails arrive in inbox. The apparel-no-tax case is the regression catch.

---

## Implementation Order

0. **DIV-99 must be merged to develop first.** Hard prerequisite. The helper imports `isNonApparelProductType` from `@/modules/custom-order/non-apparel-type`, which only exists in the DIV-99 worktree. Landing this PR before DIV-99 breaks the build on develop. No fallback shim — the right sequencing is "DIV-99 merges, then this PR rebases on develop."

1. **Helper first.** Write `format-email-line-item.ts` + the 17 unit test cases (Test Plan §"Unit (helper)"). Pure, isolated, validatable on its own.

2. **Loader-safety boot check.** After writing `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`, run `yarn dev` and verify the boot logs are clean — no `WARN`/`ERROR` lines referencing the test file or `utils/` directory. Medusa's subscriber, workflow, and module loaders should not scan this path (verified by source review against the Medusa framework loaders), but no existing repo code places `__tests__/` inside `src/modules/{x}/utils/`, so empirical confirmation is cheap insurance. Reference: DIV-99 commit `c6debee` ("relocate unit test outside src/workflows to avoid Medusa WorkflowLoader collision") shows this exact class of issue has bitten the team before in a different module subtree.

3. **Subscriber-helper extraction + validator bug fix.** Add the top-of-file `buildOrderEmailVariables` to `custom-order-created.ts` with always-include tax/discount keys (empty-string fallbacks). Write the 6 unit test cases for `buildOrderEmailVariables` + the 4 unit test cases for `validateTemplateVariables`. These three unit-test groups are the bug-fix proof; no integration test is needed (see Test Plan §"Why no integration tests").

4. **Pre-merge dashboard template check (5-minute task) — strict halt-and-surface.** Before merging the validator fix, the implementer pulls the actual `ORDER_RECEIVED_CUSTOM` and `ORDER_CONFIRMED_PROOFED` template HTML via `resend templates get <id>` (CLI) or the Resend API. Grep for `{{#if tax}}` and `{{#if discount}}` blocks. If both templates wrap their tax/discount rows in `{{#if}}` conditionals, empty-string falsy semantics apply and the fix is safe to merge. **If either template renders these rows unconditionally, the implementer halts and escalates to the Imperator. The implementer does NOT edit the dashboard template — dashboard template work is Slice 2's lane, out of scope for this PR.** The Imperator decides whether to defer to Slice 2 (and accept that customers will briefly see "Tax: " (empty) labels for orders without tax until Slice 2 ships) or authorize a one-off dashboard edit out-of-band.

5. **Subscriber refactor.** Replace per-group inline formatter loop with `formatEmailLineItemCard()` calls (concatenated via `.join("")`) and the per-template `buildOrderEmailVariables()` call. The apparel-only path's behavior in the inbox is unchanged.

6. **Seed data sanity check.** `rg "metadata.*product_type" src/scripts/seed*.ts` for any apparel-item writes that include `product_type`. If any exist, apparel orders from those seeds would route to non-apparel branch unexpectedly. Cheap to verify; expensive to debug if missed.

7. **Run `yarn build` and `yarn test:unit`** before declaring DONE. (Integration test suite stays untouched by this spec — `yarn test:integration:http` should pass exactly as it did pre-change.)

> **Confidence: High** on order — DIV-99 sequencing is a hard requirement; helper-first is a strict topological dependency; loader-safety boot check is precautionary but cheap.

---

## Open Questions / Dependencies

1. **DIV-99 follow-up: line-item `options_order` field.** V1 ships alphabetical sort for non-apparel options because the importer's `options_order` lives on **product** metadata, not line-item metadata, and pulling it into the helper would break helper purity. The follow-up: copy `options_order` onto line-item metadata at write time (cart route or the promo-print pricing workflow at `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`). Once line-item metadata carries it, the helper switches to that field — single-line change.
2. **Sizes vs Quantity label.** Current subscriber emits `Quantity (M - 10, ...)`. Spec proposes `Sizes: M - 10, ...` for card form. Imperator confirms or pushes back.
3. **Slice 2 (templates-as-code).** Imperator's next session — separate spec for migrating Resend dashboard templates to React Email `.tsx` files in the repo, deployed via `resend templates create --react-email`. Slice 2 also reconciles: (a) two latent variable-registration omissions the verifiers caught — `proof_url` is sent by `custom-order-proof-ready.ts:37` but not declared in PROOF_READY's `service.ts:40-49` registration; `order_url` is sent by `custom-order-created.ts:133` but not declared in ORDER_RECEIVED_CUSTOM / ORDER_CONFIRMED_PROOFED registration. The validator only checks declared keys for `!== undefined`; undeclared keys flow through. So these omissions have no functional consequence today (no silent-drop bug) — they're a type-system rigor gap that templates-as-code resolves by making the `.tsx` file the declaration source of truth. (b) any `{{#if tax}}` conditional issue surfaced by Implementation Order step 4.
4. **`humanize` Unicode handling.** The `humanize` regex `\b\w` is ASCII-only. Importer keys with accented characters (`pâté_options`) capitalize partially. Acceptable for English-only B2B in V1; document as known limitation. Empty-string keys (allowed by Zod's `z.record(z.string(), z.string())`) produce empty labels — defensive, very unlikely in practice.
5. **Mixed-cart customer wording mismatch (out of scope, flagged for awareness).** A customer with one saved-product reorder + one fresh proof-required item gets ONE template per order (current `.some()` logic, preserved verbatim). Worst case: customer reads "we'll send a proof" when only half the order needs one. Out of scope for V1 fix; flag for future ticket.
6. **Inline-style cross-client rendering.** `border-radius` is silently dropped by Outlook desktop (Word HTML engine); `font-family:inherit` falls back to client default. Slice 2 (templates-as-code) is the right place to add proper email-client testing. Acceptable degraded state for V1.
7. **Multi-item non-apparel groups (forward-looking).** V1 reads `items[0]` only on the non-apparel branch because storefront produces one item per `group_id` (`standardCartHelpers.ts`). If a future product flow ever needs multiple non-apparel items in one group, extend the helper to iterate the array — the array-typed input signature was preserved to make this mechanical. Filing here so a future implementer doesn't re-discover the constraint.

---

## Confidence Map

| Section | Confidence | Reason |
|-|-|-|
| Why (validator bug) | High | Verified at `service.ts:144-150`. |
| Why (DIV-99 prerequisite) | High | Verified subscriber state in worktree HEAD `377a9d9`. |
| Goal & V1 Outcome | High | Imperator approved Path B. |
| Out of Scope | High | Imperator explicit. Dashboard work confirmed Slice 2 deferral. `custom-complete/route.ts:248-252` reframed as intentional DIV-99 hardening, not dead code. |
| Domain Context — discriminator | High | Helper uses `isNonApparelProductType` because by `custom-order.created` event time the metadata has been schema-parsed against `NonApparelMetadataSchema`. Cart subsystem has a second predicate (`isNonApparelMetadata`) for pre-parse runtime branching; the two operate at different lifecycle stages and are not in conflict. Both verified in worktree. |
| Domain Context — `production_option_type` post-step | High | Verified at `src/workflows/pricing/steps/calculate-promo-print-prices.ts:154-159` in worktree. |
| Architecture — `src/modules/resend/utils/` location | High | Verified Medusa loader sources directly: SubscriberLoader bounded to `subscribers/`, WorkflowLoader to `workflows/`, module loader auto-loads only `index.ts`/`service.ts`/`models/`/`migrations/`. `utils/` subdir is invisible to all loaders. |
| Architecture — `__tests__/` inside `utils/` empirical safety | Medium | Architecturally safe per loader source review, but no precedent on develop for `src/modules/{x}/utils/__tests__/`. Implementation Order step 2 boot-log smoke check makes this empirically verifiable. |
| Architecture — inline pattern | High | Verified in `password-reset.ts`, `user-invited.ts`. Verified in Medusa docs. |
| Helper signature | High on shape; Medium on TS exactness (narrowing at boundary) |
| Apparel branch | High on data flow and `product_title`-only sourcing (preserves current behavior). Medium on `Sizes` label choice (Imperator confirms). |
| Non-apparel branch — single-item-per-group_id | High | Storefront's `standardCartHelpers.ts:62-88` produces one item per `group_id`. Helper reads `items[0]` only. Multi-item is forward-looking, not a V1 feature. |
| Non-apparel branch — alphabetical sort rationale | High | PostgreSQL `jsonb` does not preserve object key order on write per its specification. The importer's product-level `options_order` doesn't traverse to line-item metadata. Alphabetical is the deterministic V1 choice. |
| HTML escape | High |
| Card HTML structure + `.join("")` cross-card concat | Medium on cosmetic style choices (tunable); High on the `.join("")` separator (cards have own `margin-bottom`). |
| Validator bug fix — `buildOrderEmailVariables` extraction | High on the silent-drop fix. Unit-test proof level is correct because `medusa-config.ts:73-94` registers no notification provider in `NODE_ENV=test`; integration tests cannot exercise the validator regardless. |
| Validator bug fix — dashboard template assumption | Medium on dashboard rendering empty strings as falsy. Pre-merge `resend templates get` + grep verifies syntax presence; the actual template-engine semantics for empty-string falsy are unverified in the spec (Provocator GAP — accepted as residual risk for V1 since changing it would require either a Resend live-send test or documenting the engine). Halt-and-surface if grep finds no `{{#if}}`. |
| Edge cases | High |
| File-by-file changes | High |
| Test plan | High on unit. No integration tests this round (test env loads no notification provider). |
| Implementation order | High. DIV-99 is a hard prerequisite; loader-safety boot check is precautionary but cheap. |

---

## What prior revisions got wrong (transparency for the reviewer)

**v1 → v2 corrections** (after verifier iteration 1):
- v1 claimed Medusa `arch-workflow-required` mandates lifting subscribers into workflows. That rule is about mutations from API routes, not side effects from subscribers. The lift was unjustified by doctrine; v2 dropped it.
- v1 claimed the discriminator was 3-way (`undefined | "apparel" | non-apparel-string`). The storefront never writes `product_type` for apparel. v2 corrected to 2-way.
- v1 missed the validator silent-drop bug, ignored built-in `sendNotificationsStep`, made an empty workflow-rollback claim, had no HTML escape, used non-deterministic `Object.entries()` order, rendered empty rows in cards, and didn't document the `production_option_type` post-pricing augmentation. All addressed in v2.

**v2 → v3 corrections** (after verifier iteration 2):
- v2 placed the helper at `src/subscribers/_utils/` citing `src/api/_utils/` precedent. **The precedent doesn't transfer.** API router and subscriber loader have different exclusion behavior. The subscriber loader's `_ResourceLoader_excludes` regex (`resource-loader.js:30`) tests file *basename* only; `read-dir-recursive.js:32` walks all subdirectories. The helper file (basename has no `_` prefix) emits `[WARN] The subscriber in <path> is not a function. skipped.` on every boot. The test file (`__tests__/format-email-line-item.unit.spec.ts`) is `require()`d unguarded by `dynamic-import.js:18`, top-level `describe(...)` references undefined Jest globals, **boot crashes**. v3 relocates to `src/modules/resend/utils/` — a non-subscriber-loader path, co-located with the consumer module, matching `src/workflows/pricing/utils/` precedent.
- v2 had no unit test for empty-array helper input. v3 added case 15.
- v2 deferred verification of the dashboard `{{#if tax}}` conditional to the Imperator's e2e test. v3 promoted this to a pre-merge implementation step.
- v2 didn't surface the `proof_url` / `order_url` variable-bag drift in template registrations. v3 documented them as Slice 2 prereqs.
- v2 didn't acknowledge `humanize` Unicode limitations or Outlook `border-radius` rendering. v3 documented both.
- v2 didn't include a seed-data sanity check. v3 added it to Implementation Order step 5.

**v3 → v4 corrections** (after Imperator's Codex Consul review):
- v3's discriminator section contradicted itself: paragraph 1 said "any non-empty `product_type` → non-apparel," paragraph 2 said "future `product_type: 'apparel'` would route apparel via fallback." The fallback didn't exist — those two rules conflict because `"apparel"` is a non-empty string. DIV-99's `isNonApparelProductType` already excludes `"apparel"` explicitly. v4 imports the predicate, eliminating the contradiction.
- v3 placed the integration test at `integration-tests/http/notifications/custom-order-created.spec.ts`. `jest.config.js:28` matches `**/integration-tests/http/*.spec.[jt]s` only — flat glob, no `**` recursion. The test would never run. v4 flattened the path.
- v3 proposed an integration test as the regression test for the validator bug. The validator lives in `src/modules/resend/service.ts:144-150`, but `medusa-config.ts:73-94` registers no Resend provider in test. v4 moved the proof to unit-test level.
- v3 claimed "Non-apparel cards always have `items.length === 1` per cart route invariant." That invariant doesn't exist at the cart-route layer. v4 redesigned the helper to render one card per item.
- v3's Implementation Order step 3 said "the implementer either updates the template or surfaces the issue," contradicting Out-of-Scope. v4 made step 3 strict halt-and-surface.
- v3 explained the alphabetical sort with a thin parenthetical. v4 spelled out the `jsonb` storage rationale.
- v3 had five tables with merged-header-and-separator form. v4 split them.

**v4 → v5 corrections** (after Censor + Provocator round 4 review):
- v4 proposed integration tests asserting `notification-local`'s `createNotifications` is invoked. **`medusa-config.ts:73-94` registers `notification-local` only when `isDevelopment === true`; in `NODE_ENV=test`, neither Resend nor `notification-local` loads** (Provocator caught this; Censor missed it). The notification module with empty providers throws `MedusaError.NOT_FOUND` from `notification-module-service.js:85-91` on `createNotifications` calls. The proposed assertions could not run. v5 drops integration tests entirely. The unit-level proof (helper output + `buildOrderEmailVariables` + `validateTemplateVariables`) is sufficient. Imperator's call: do not amend `medusa-config.ts` to register `notification-local` in test mode just to make this spec's tests easier — that would widen runtime config for test convenience.
- v4 claimed importing `isNonApparelProductType` "ties the email path's discriminator to the cart's discriminator forever." Provocator caught that the cart subsystem has TWO predicates: `isNonApparelMetadata` at `carts/type.ts:104-108` for runtime pre-parse branching (no `.trim()`, doesn't reject empty strings) and `isNonApparelProductType` at `non-apparel-type.ts:7-8` for schema validation. The helper uses the latter — the right predicate for *post-validation persisted data* — but the "tied forever" claim was overstated. v5 replaces the rhetoric with a factual explanation: the two predicates operate at different lifecycle stages and the helper aligns with the schema layer.
- v4 cited worktree HEAD `f6196b5`. Actual HEAD is `377a9d9` (two commits ahead: `377a9d9` test-env S3 guard + `d71ef4d` apparel-only saved-product gate hardening). Provocator caught this. v5 corrects the HEAD.
- v4's Out of Scope section called the `custom-complete/route.ts:248-252` `metadata.product_type === "apparel"` gate "dead code." Provocator caught that this is intentional DIV-99 hardening (commit `d71ef4d`: "prevents non-apparel ORDER items from auto-approving via custom_order_id"). v5 reframes it as intentional and load-bearing.
- v4 left the DIV-99 sequencing as "implementer's call." Provocator caught the build-break window: `develop` doesn't have `non-apparel-type.ts` yet; the helper's import would fail. v5 makes DIV-99-first a hard prerequisite (Implementation Order step 0). No fallback shim per Imperator.
- v4 placed `__tests__/` inside `src/modules/resend/utils/` and dismissed loader risk based on framework source review. Provocator pointed out there's NO empirical precedent on develop for `src/modules/{x}/utils/__tests__/`, and DIV-99 commit `c6debee` shows the team has been bitten by this exact class of issue in a different module subtree. v5 adds Implementation Order step 2: boot-log smoke check after writing the test file.
- v4 over-engineered multi-item non-apparel rendering as "one card per item, concatenated" based on the cart route's *theoretical* multi-item permissiveness. Provocator caught that the storefront's `standardCartHelpers.ts:62-88` produces one item per `group_id` per non-apparel write — multi-item non-apparel groups are not reachable from V1 storefront flows. v5 trims the design: helper reads `items[0]` only on the non-apparel branch; the array signature is preserved (mechanical extension if a future flow needs it) but multi-item is not a documented V1 feature. Test case 14 (multi-item non-apparel) dropped.
- v4 stated `current_year: new Date().getFullYear()` (number) in the helper example body. Censor caught that the existing subscriber emits `.toString()` and `service.ts:67` declares the type as `"string"`. v5 fixes the example body.
- v4 cited `calculate-promo-print-prices.ts:151-159`. Censor + Provocator caught path imprecision (file lives under `steps/`) and line drift (actual lines `:154-159`). v5 corrects.
- v4 cited `line-items-custom/route.ts:31-47`. Censor caught that lines 31-36 are the empty-items check; the mixed-type rejection is at lines 39-47. v5 narrows the citation.
- v4 didn't specify the subscriber-level join across groups. Censor caught ambiguity. v5 specifies `.join("")` (cards have own `margin-bottom`); replaces existing subscriber's `.join("<br>")`.
- v4 didn't include a structured-output example for the apparel empty-Color case. Censor caught. v5 adds it.
- v4 didn't note the apparel `product_title`-only sourcing (vs non-apparel's `product_name ?? product_title` fallback). Censor caught that an implementer might "harmonize" the two branches and silently change apparel email content. v5 adds an explicit divergence note + a unit test (case 8) that asserts apparel branch ignores `metadata.product_name`.
- v4 phrased `jsonb` order behavior as "normalizes per its specification." PostgreSQL spec says "not preserved" — same outcome but more precise. v5 corrects.
- v4 framed the `proof_url` / `order_url` template-registration omissions as "drift" implying functional consequence. Provocator caught that these have NO functional consequence (validator only checks declared keys; undeclared flow through). v5 reframes as type-system rigor gaps for Slice 2.

**SOUNDs that survived all four rounds (Censor + Provocator both rounds):** validator silent-drop diagnosis, helper file location at `src/modules/resend/utils/`, HTML escape rule, `isNonApparelProductType` as right predicate for the helper specifically, apparel storefront does not write `product_type`, validator-bug proof at unit-test level methodology, inline subscriber pattern (no workflow lift), domain entity references, metadata schema shapes.
