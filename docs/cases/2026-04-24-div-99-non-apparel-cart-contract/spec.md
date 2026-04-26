---
case: div-99-non-apparel-cart-contract
linear: DIV-99
project: Non-Apparel Catalog Launch
branch: feature/div-99-non-apparel-cart-contract
baseline: origin/import-script-promo-print + promo-print pricing fixes (local branch tip 574440e)
date: 2026-04-24
consul: Publius Auctor
imperator: Milovan Crowley
repo: divinipress-backend
---

# DIV-99 — Non-Apparel Cart-to-Order Transactional Contract

## 1. Goal

Enable the active cart write path (`POST /store/carts/:id/line-items-custom`) to accept non-apparel (promo-print) line items while preserving apparel behaviour. Guarantee that the real payload emitted by the storefront's standard-product flow (`variant_id + non-apparel metadata`) survives all downstream transactional reads to the extent the read paths currently expose metadata — specifically:

- `POST /store/carts/:id/line-items-custom` accepts and validates it
- `POST /store/carts/:id/custom-complete` does not throw or silently drop non-apparel fields
- `GET /company/cart` exposes it
- `GET /custom-order/orders` aggregates its quantity correctly
- `GET /custom-order/orders/:id` exposes it
- The storefront proof adapter receives a reliable `production_option_type` from line-item metadata

> **Confidence: High** — Imperator's orders verbatim; DIV-99 ticket description identical in scope; scout evidence confirms every named path is reachable on the current branch.

## 2. Non-Goals (explicit exclusions)

The following tickets are OUT of scope for this spec. Where they adjoin this work, the spec references them so the boundary is visible:

|Ticket|Surface|Why excluded|
|-|-|
|DIV-71|Cart UI rendering polish|Presentation layer; blocked on this contract landing. Not this ticket.|
|DIV-72|Customer/admin order-detail rendering polish|Same — rendering, not contract.|
|DIV-74|Proof page non-apparel option display|Rendering. This spec provides the bridge field the proof adapter needs, nothing more.|
|DIV-91|Non-apparel PDP product adapter alignment|Importer / product-metadata territory.|
|DIV-92|Non-apparel PDP option controls alignment|PDP UI.|
|DIV-100|Non-apparel approve-proof saved-product creation|`order-flow.ts` apparel-only construction. Downstream of this ticket.|

In particular this spec does NOT:

- extend the `ProductionOptionsType` enum
- touch the promo-print importer
- touch `/api/company/product-options/[handle]/route.ts`
- change the storefront
- create a non-apparel proof-submission flow
- construct saved products for non-apparel approve-proof

> **Confidence: High** — Imperator explicitly directed scope; each adjacent Linear ticket pulled and confirmed by the Consul.

## 3. Canonical Non-Apparel Cart-Line Metadata Shape

The canonical non-apparel cart-add contract is **`variant_id + metadata`** (not `handle + options + metadata`). This realizes DIV-94's choice. The storefront already posts this shape via `divinipress-store/src/app/_api/catalog/standardCartHelpers.ts:83`.

Non-apparel metadata shape (Zod `NonApparelMetadataSchema`):

|Field|Type|Required|Notes|
|-|-|-|-|
|`product_type`|`string`|yes|Discriminator. Non-empty, ≠ `"apparel"`. Storefront enumerates `"print" \| "promo" \| "display" \| "stickers"` (`divinipress-store/src/app/_interfaces/standardProduct.interface.ts:6`); backend treats the string as opaque non-apparel discriminator and validates only "non-empty AND ≠ apparel".|
|`group_id`|`string`|yes|Cart-sub-order grouping, same semantics as apparel.|
|`upload_ids`|`string[]`|yes|May be empty `[]`. When non-empty, every id must resolve via `listAndCountCustomOrderUploads`. Existence + non-association validated at middleware layer (see §7).|
|`options`|`Record<string, string>`|yes|Must contain every key listed in product `metadata.base_option_keys` AND `metadata.multiplier_keys`. All string values.|
|`options_labels`|`Record<string, string>`|no|Pass-through display data on line-item metadata only. NOT used for variant matching — see §5.|
|`product_name`|`string`|no|Display name; pass-through.|
|`design_notes`|`string`|no|Free text; pass-through.|

Apparel metadata shape (`ApparelMetadataSchema` in `src/modules/custom-order/apparel-type.ts`) is unchanged.

> **Confidence: High** — shape derived from ticket description, verified storefront producer (`standardCartHelpers.ts:83-85`) and three storefront readers (`useCart.ts:74-80`, `useOrderDetail.ts:147-153`, `useAdminOrderDetail.ts:52-58`).

## 4. Type-Guard and Zod Composition

**Do not use `z.union([NonApparel, Apparel])`.** Zod's `z.union` is first-match-wins (verified at `node_modules/zod/v3/types.js:2316-2332`); a payload `{ product_type: "print", selections: [...], ... }` would be rejected by strict non-apparel (because `selections` is unknown), then silently accepted by non-strict apparel (default `strip` behavior at `node_modules/zod/v3/types.js:1965-1988`), losing `product_type` and `options` and routing the item to the apparel workflow with the customer's intent destroyed. Use a **pre-parse discriminator** that picks the schema by raw `product_type` BEFORE Zod runs.

```ts
// src/api/store/carts/type.ts (conceptual)
const trimmedNonApparel = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.trim() !== "apparel";

export const NonApparelMetadataSchema = z.object({
  // .trim() pre-transforms before length/refine; rejects empty AND whitespace AND "apparel"
  product_type: z.string()
    .trim()
    .min(1, "product_type must be non-empty")
    .refine((v) => v !== "apparel", "product_type cannot be 'apparel' on non-apparel branch"),
  group_id: z.string(),
  upload_ids: z.array(z.string()),
  options: z.record(z.string(), z.string()),
  options_labels: z.record(z.string(), z.string()).optional(),
  product_name: z.string().optional(),
  design_notes: z.string().optional(),
}).strict();  // reject unknown keys (including stray apparel `selections`) on this branch

// Pre-parse discriminator. Single Zod schema that branches BEFORE Zod tries
// either underlying schema. No first-match-wins gambling — the raw discriminator
// picks one schema, that schema runs alone, errors propagate cleanly.
export const lineItemMetadataSchema = z.unknown().transform((raw, ctx) => {
  if (typeof raw !== "object" || raw === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "metadata must be an object" });
    return z.NEVER;
  }
  const productType = (raw as { product_type?: unknown }).product_type;
  const targetSchema = trimmedNonApparel(productType)
    ? NonApparelMetadataSchema
    : ApparelMetadataSchema;
  const parsed = targetSchema.safeParse(raw);
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => ctx.addIssue(issue));
    return z.NEVER;
  }
  return parsed.data;
});

// After validateAndTransformBody runs this schema, req.validatedBody.items[i].metadata
// is guaranteed to match either the strict NonApparel shape OR the (non-strict, stripping)
// Apparel shape. The route's type guard discriminates by the post-parse shape:
const isNonApparelMetadata = (m: unknown): m is NonApparelMetadata =>
  typeof m === "object" && m !== null &&
  typeof (m as { product_type?: unknown }).product_type === "string" &&
  (m as { product_type: string }).product_type !== "apparel";
```

**Route handler MUST read `req.validatedBody`, not `req.body`.** Per Medusa v2 official docs ([Request Validation](https://docs.medusajs.com/learn/fundamentals/api-routes/validation#how-to-validate-request-body)): "the validated body parameters in the `validatedBody` property of `req`. Example: `req.validatedBody.a + req.validatedBody.b`." Confirmed in framework source at `node_modules/@medusajs/framework/dist/http/utils/validate-body.js:15` (`req.validatedBody = await zodValidator(schema, req.body)`). Today the route at `src/api/store/carts/[id]/line-items-custom/route.ts:26` reads `const { items } = req.body;` — this is wrong and must change to `const { items } = req.validatedBody;` so the type-guard runs on the discriminator-parsed shape.

Route-entry flow:

1. Middleware `validateAndTransformBody(lineItemsCustomSchema)` at `middleware.ts:80` runs the discriminator schema; populates `req.validatedBody`.
2. Middleware per-item upload check (`middleware.ts:110-134`) reads `cartLineItemMetadata` from a local Zod parse — this becomes redundant once `lineItemMetadataSchema` is the discriminator. Replace the local re-parse with reading from `req.validatedBody.items[i].metadata`. Keep the upload existence + non-association check, with the empty-array short-circuit added per §7.
3. Route handler reads `req.validatedBody.items`. For each item, runs `isNonApparelMetadata(item.metadata)`.
4. All items non-apparel → `addPromoPrintPriceToCartWorkflow`.
5. All items apparel → existing `addApparelPriceToCartWorkflow` (unchanged).
6. Mixed → reject with `400 MedusaError.Types.INVALID_DATA("mixed apparel / non-apparel items not permitted in one request")`.

`src/api/store/carts/type.ts` is updated to export `NonApparelMetadataSchema`, `ApparelMetadataSchema` re-export, the discriminator `lineItemMetadataSchema`, and the type-guard.

> **Confidence: High** — Zod discriminator constraint documented; middleware and type file identified; parallel schema pattern already exists in the codebase for apparel.

## 5. Pricing Helper Extraction

Lift the body of `src/api/pricing/promo-print/route.ts` into a pure function:

**File:** `src/workflows/pricing/utils/calculate-promo-print-price.ts`
**Signature:**

```ts
export type PromoPrintPricingInput = {
  product: {
    id: string;
    metadata: Record<string, unknown> | null;  // product.metadata, NOT line-item metadata
    variants: Array<{
      id: string;
      options: Array<{ option: { title: string }; value: string }>;
      calculated_price?: { calculated_amount?: number | null };
    }>;
  };
  options: Record<string, string>;  // line-item metadata.options — submitted by client
};

export type PromoPrintPricingResult = {
  unit_price: number; // major units (dollars for USD), 2dp
  variant_id: string;
};

export function calculatePromoPrintPrice(
  input: PromoPrintPricingInput
): PromoPrintPricingResult;
```

Behavior:

- Validate all `product.metadata.base_option_keys + product.metadata.multiplier_keys` present in `input.options`; throw `MedusaError.INVALID_DATA("Missing required options: …")` otherwise.
- Match variant by `(label, value)` where `label = product.metadata.options_labels[base_option_code] ?? base_option_code`. **The variant matcher reads `options_labels` from PRODUCT metadata only.** The line-item's `options_labels` field is pass-through display data and MUST NOT be passed into this helper. Importer-side discipline (case-correct labels in product metadata) is required for matching to succeed; if a base-option key has no entry in `product.metadata.options_labels` AND its variant-option title differs in case, no variant resolves and the helper throws `INVALID_DATA("No variant found matching options: …")`. (This is a data-contract dependency on the importer; see also DIV-91 for the broader importer-correctness ticket.)
- Read `variants[i].calculated_price.calculated_amount` as the base price (major units).
- Apply multiplier factors from `product.metadata.multipliers[code][quantity_tier][value]`. **Missing multiplier row is a HARD 400** (per Q-B resolution): helper throws `INVALID_DATA("No multiplier row for {code} at quantity tier {quantity}; product configuration is incomplete")` instead of silently no-opping. This closes the financial-loss class flagged by the Provocator and corrects the existing route's silent-skip behavior.
- Round to 2dp.
- Return `{ unit_price, variant_id }`.

`src/api/pricing/promo-print/route.ts` becomes a thin wrapper that **preserves the existing public response shape**: parse request, fetch product via `query.graph`, call `calculatePromoPrintPrice`, return `res.json({ price: result.unit_price, variant_id: result.variant_id })`. The route's response field stays `price` (matching the existing public contract); internal Medusa cart-flow code uses Medusa's standard `unit_price` term-of-art.

**Unit invariant:** `unit_price` is ALWAYS in the major currency unit (dollars for USD), matching Medusa v2's storage convention (verified via Medusa docs: "Prices are Stored in Major Units"). No cents conversion anywhere in this helper or its callers.

**QueryContext invariant:** When the cart-flow path (§6) fetches variants for pricing, it MUST pass both `currency_code` (from cart) AND `region_id` (resolved like apparel at `custom-apparel-pricing.ts:46-67`) into `QueryContext`. The standalone pricing route at `/api/pricing/promo-print` retains its current `currency_code: "usd"` shape (preserving its public behavior); the cart-add path uses the stronger context to avoid the price-drift class flagged in KG-MEDUSA-MONEY-AND-QUERY when the cart's region differs from the default US region.

> **Confidence: High** — Medusa v2 major-unit storage confirmed via official documentation; existing apparel workflow passes `unit_price: pricingResult.items[index].perItemCharge` as a plain decimal (`src/workflows/pricing/custom-add-line-item-to-cart.ts:55`); current promo-print route returns 2dp decimals already.

## 6. Non-Apparel Cart Workflow (Medusa Step Discipline)

Medusa v2 workflow bodies are declarative composition. Business logic — product query, validation, price calculation — MUST live inside a `createStep`, not in the `createWorkflow` body.

**New files (two layers, not three — see note):**

1. `src/workflows/pricing/steps/calculate-promo-print-prices.ts` — a `createStep`
2. `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts` — the cart-add workflow

**Why no intermediate workflow wrapper:** Apparel maintains a `calculateApparelPricesWorkflow` because the standalone pricing route at `src/api/pricing/apparel/route.ts:56` calls it with a direct `.run({...})`, AND `addApparelPriceToCartWorkflow` calls it via `.runAsStep`. Two callers justify the wrapper.

For promo-print, the standalone pricing route at `src/api/pricing/promo-print/route.ts` will call the **pure helper** `calculatePromoPrintPrice` (per §5), not a workflow. Only the cart-add path needs the step. Wrapping the step in a workflow gives us only one caller — dead structure. The cart-add workflow calls the step directly via `someStep.runAsStep` (or by importing the step into the workflow body). This keeps the layer count honest. If a future caller needs workflow-level features (transaction retry, telemetry, lifecycle hooks), it is trivial to lift the step into a workflow at that point.

**`calculatePromoPrintPricesStep`** (the step doing the work):

```ts
// Conceptual
export const calculatePromoPrintPricesStep = createStep(
  "calculate-promo-print-prices",
  async ({ items }: { items: NonApparelCartItem[] }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // 1. Batch-fetch products for every distinct variant_id in items, with
    //    QueryContext({ currency_code, region_id }) for calculated_price.
    // 2. For each item:
    //    - validate metadata.options completeness against
    //      product.metadata.base_option_keys ∪ multiplier_keys
    //    - validate Number(metadata.options.quantity) is finite AND > 0
    //      (hard 400 — see §7)
    //    - run calculatePromoPrintPrice(product, options) → { unit_price, variant_id }
    //    - confirm resolved variant_id equals submitted item.variant_id
    //    - return bridged metadata: { ...item.metadata, production_option_type: item.metadata.product_type }
    // 3. Upload validation is OWNED BY MIDDLEWARE — see §7. Step does NOT re-check.

    return new StepResponse({
      items: items.map(/* { unit_price, variant_id, metadata: bridged } */)
    });
  }
);
```

**`addPromoPrintPriceToCartWorkflow`** (structurally mirrors `addApparelPriceToCartWorkflow` at `src/workflows/pricing/custom-add-line-item-to-cart.ts`; differs in (a) calling the step directly instead of a workflow wrapper, and (b) reading `metadata` from the step output because §8's bridge stamp lives inside the step):

```ts
export const addPromoPrintPriceToCartWorkflow = createWorkflow(
  "add-promo-print-price-to-cart",
  ({ cart_id, items }: AddPromoPrintPriceToCartWorkflowInput) => {
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "currency_code", "region_id"],
    });

    const pricingResult = calculatePromoPrintPricesStep({
      items,
      currency_code: carts[0].currency_code,
      region_id: carts[0].region_id,
    });

    const cartInput = transform(
      { cart_id, pricingResult, items },
      ({ cart_id, pricingResult, items }) => ({
        cart_id,
        items: items.map((item, index) => ({
          variant_id: pricingResult.items[index].variant_id,
          quantity: item.quantity, // storefront posts 1; real count lives in metadata.options.quantity
          unit_price: pricingResult.items[index].unit_price,
          metadata: pricingResult.items[index].metadata, // bridged metadata from the step
        })),
      }),
    );

    addToCartWorkflow.runAsStep({ input: cartInput });

    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*", "items.variant.*"],
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse(updatedCarts);
  },
);
```

**Invariants** (per Medusa v2 official docs — [Workflow Constraints](https://docs.medusajs.com/learn/fundamentals/workflows/constructor-constraints)):

- The `createWorkflow` constructor body is declarative. Permitted constructs: `createStep` invocations, `someStep.runAsStep(...)` / `someStep({...})`, `someWorkflow.runAsStep(...)`, `useQueryGraphStep`, `transform`, `when(...).then(...)`, `WorkflowResponse`.
- The constructor body MUST NOT contain: async / `await`, direct service resolution, raw `if`/ternary / `&&` short-circuits at the body level, error throwing, `new Date()` at the body level, raw string interpolation of step outputs at the body level.
- Async work, validation that throws, and service resolution all live inside `createStep`.
- **Inside `transform`:** synchronous computation IS permitted — date construction, string interpolation, conditionals, null-coalescing, mapping, picking. What is NOT permitted inside `transform`: async, service resolution, error throwing. Errors must originate in steps. (This corrects the prior over-strict prohibition on conditionals inside transform; per Medusa docs, transform IS the place for sync data computation.)
- Product query, server-side validation, price calculation, and the bridge stamp all live inside `calculatePromoPrintPricesStep`.

> **Confidence: High** — Imperator's guardrail explicit; apparel workflow at `custom-add-line-item-to-cart.ts:27-77` provides the exact template to mirror.

## 7. Server-Side Validation Rules

Validation is split between two layers — middleware and step — to match the existing apparel discipline. The step does NOT re-run middleware-owned checks.

**Middleware layer** (`src/api/store/carts/middleware.ts:77-134`, applies to both apparel and non-apparel):

|Check|Condition|On failure|
|-|-|-|
|Schema parse via `validateAndTransformBody(lineItemsCustomSchema)`|discriminator parses to one strict shape|400 Zod error|
|Upload-array empty short-circuit|`if (metadata.upload_ids.length === 0) continue;` — added BEFORE `listCustomOrderUploads` call|skips the module call entirely|
|Upload existence|every `metadata.upload_ids[i]` exists in `listCustomOrderUploads`|404 "Upload with ID … not found"|
|Upload non-association|no `upload.custom_order_id` already set|400 "Upload already associated with a custom order"|

The empty-array short-circuit is mandatory because Medusa module-service `list*` filter behavior with `id: []` is **not officially documented** (verified via `mcp__medusa__ask_medusa_question` — neither the Service Factory `list` nor the Data Model Repository `find` reference covers empty-array semantics). Today's MikroORM normalizes `WHERE id IN ()` to no rows, but relying on undocumented driver behavior is fragile. Skip explicitly.

**Step layer** (`calculatePromoPrintPricesStep`, non-apparel only — does NOT re-run any middleware-owned check):

|Check|Condition|On failure|
|-|-|-|
|Option completeness|every key in `product.metadata.base_option_keys ∪ product.metadata.multiplier_keys` appears in `metadata.options`|400 with missing keys listed|
|Variant resolves|`calculatePromoPrintPrice` resolves a variant from the options against `product.metadata.options_labels`|400 "No variant matches submitted options. Verify options against product configuration."|
|Variant match|resolved variant id equals submitted `item.variant_id`|400 "Submitted variant_id is stale relative to current product configuration. Re-fetch the PDP and retry."|
|Quantity rule (HARD)|`Number(metadata.options.quantity)` is finite AND `> 0`|400 "Invalid or missing options.quantity for non-apparel item"|
|Multiplier row presence (HARD — Q-B resolved)|for every `code ∈ multiplier_keys`, `product.metadata.multipliers[code][metadata.options.quantity][metadata.options[code]]` exists|400 "No multiplier row for {code} at quantity tier {quantity}; product configuration is incomplete"|
|Price authority|step overwrites any client-supplied price with the helper's output|always|

The client-supplied `variant_id` is required on the request (per Medusa's `StoreAddCartLineItem`) but is re-validated against the options server-side. Mismatch is hard-fail; the error message attributes the cause to data drift (stale PDP / changed product) rather than user error.

The multiplier-row HARD check closes a financial-loss class. The existing `/api/pricing/promo-print/route.ts:138-149` silently no-ops missing multiplier rows (factor 1.0), letting customers pay base price for any out-of-range quantity. Per Imperator decision Q-B: fix loud. Helper throws on missing row; route surfaces a 400; importer-side data correction is forced.

> **Confidence: High** — mirror of apparel discipline (`validateApparelPricingInput` exhaustive checks at `src/workflows/pricing/utils/validate-apparel-input.ts:62-193`); hard-400 quantity rule per Imperator's explicit guardrail.

## 8. Bridge Field — Server-Stamp `production_option_type` on Line-Item Metadata

`src/app/_domain/custom-order/adapter.ts:224` (storefront proof adapter) reads `metadata.production_option_type` from line-item metadata. The storefront does NOT write this field (`standardCartHelpers.ts:83` writes `product_type` only). Without a bridge, non-apparel proofs render with `productionOptionType: undefined`, defaulting silently to apparel shape — this is the live known-gap KG-NON-APPAREL-OPTIONS.

**The bridge:** inside `calculatePromoPrintPricesStep`, stamp the line-item metadata before it is written:

```ts
metadata: {
  ...item.metadata,
  production_option_type: item.metadata.product_type,
}
```

Scope boundary:

- Stamp happens ONLY on non-apparel line items (via this step). Apparel path unchanged.
- Stamp targets LINE-ITEM metadata only. Product metadata, the enum, and the `/company/product-options/[handle]/route.ts` reader are NOT touched in this spec — that is DIV-91 territory.
- No enum value is added. `ProductionOptionsType` remains `APPAREL`-only for its current reader (`src/api/company/product-options/[productHandle]/route.ts:21`), which is outside the cart/order path.

Asymmetry acknowledged: apparel items continue to rely on product-metadata for `production_option_type` (seeded by `seed-apparel.ts:1112`); non-apparel items rely on line-item metadata bridged here. Closing the asymmetry belongs to DIV-91.

> **Confidence: High** — adapter reader verified by direct read (`adapter.ts:213-224`); storefront producer verified (`standardCartHelpers.ts:83-85`); importer scope-out confirmed via DIV-91 ticket pull.

## 9. Custom-Complete Cleanup (Minimal)

`src/api/store/carts/[id]/custom-complete/route.ts` branches only on `proof_type` (never `product_type`) and is largely shape-agnostic. One surgical touch:

1. **Guard the unguarded `upload_ids.map` at `route.ts:320-322`.** Today line 320 reads `const uploadIds = items[0]?.metadata?.upload_ids as string[];` and immediately calls `uploadIds.map(...)` at line 322 with no null-safety. Lines 305-308 and 331-332 already use `|| []` fallback; line 320 does not. Replace with `const uploadIds = (items[0]?.metadata?.upload_ids ?? []) as string[];`.

   The §3 schema requires `upload_ids: z.array(z.string())`, so any item that flowed through the supported write path will have an array (possibly empty). The guard is belt-and-suspenders against any path that bypassed schema validation (legacy data, direct DB writes, future drift). It is mechanically identical to the existing fallback at line 331.

2. **No other changes.** The `metadata.selections` walk at `route.ts:371-389` already no-ops when selections is absent (early `find` returns undefined → `.map` returns `[]`). Lines 305-308 and 331-332 already defensive. Verified directly.

The rest of custom-complete (group_id handling at `route.ts:216-226`, product_name at `route.ts:240`, upload remap at `route.ts:371-389`, payment/session, workflow dispatch) is shape-agnostic as-is.

**Note on cart→order metadata preservation:** Per Medusa v2 docs ([Gift Message Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/gift-message)): "the `metadata` is copied to the `metadata` of the order's line items." This means the `production_option_type` stamp from §8 (and `product_type`, `options`, `options_labels`) carries through to order line items automatically. No special copy step is needed in custom-complete.

> **Confidence: High** — scout traced every apparel-specific field in this file; the only unguarded read is the `upload_ids` array access at line 320 (line 331 is already defensive).

## 10. Orders-List Quantity Fix (with Parse Defense)

`src/api/custom-order/orders/route.ts:123` currently aggregates `subOrder.quantity += item.quantity || 0;`. Non-apparel line items always post `quantity: 1` with the customer-facing count encoded in `metadata.options.quantity` as a tier string (e.g. `"500"` for 500 business cards). Apparel line items post real counts.

**Replacement logic (read-path, soft fallback with audit breadcrumb):**

```ts
const meta = item.metadata as Record<string, unknown> | null;
const productType = (meta?.product_type as string | undefined) ?? "apparel";

let itemQty: number;
if (productType !== "apparel") {
  const optQty = Number((meta?.options as Record<string, string> | undefined)?.quantity);
  if (Number.isFinite(optQty) && optQty > 0) {
    itemQty = optQty;
  } else {
    // Soft fallback: log so the silent miscount is observable in production.
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.warn(
      `[orders-list] non-apparel quantity fallback: order=${order.id} ` +
      `line_item=${item.id} options.quantity=${JSON.stringify(meta?.options ?? null)} ` +
      `falling back to line_item.quantity=${item.quantity ?? 0}`
    );
    itemQty = item.quantity ?? 0;
  }
} else {
  itemQty = item.quantity ?? 0;
}

subOrder.quantity += itemQty;
```

**Rationale for soft fallback on the read path:** orders list is a read endpoint. A malformed `metadata.options.quantity` (stale order from before the contract existed, bad import, etc.) must not blow up the whole orders list. Fall back to `item.quantity`. This contrasts with the cart-add path, which hard-fails per §7 because bad input at write-time must be rejected cleanly.

**The fallback is audited.** Every fallback activation emits a `logger.warn` with order id, line-item id, and the offending `options` payload. A silent miscount (1 instead of 500) on the customer-facing UI is a real risk; the audit breadcrumb means ops can detect the condition before customers do, and the read endpoint never 500s.

No change to `GET /custom-order/orders/:id` (order detail exposes raw metadata; storefront hook already computes display quantity from metadata).

> **Confidence: High** — Imperator's explicit guardrail (hard 400 at write, soft fallback at read); one-line change at one call site.

## 11. Quantity Parsing Rules (unified)

|Path|Parse|Invalid handling|
|-|-|-|
|Cart-add validation (§7)|`Number(metadata.options.quantity)` must be `isFinite && > 0`|Hard 400 `MedusaError.Types.INVALID_DATA`|
|Orders-list aggregation (§10)|Same predicate|Soft fallback to `item.quantity`|
|Order-detail read|No backend parsing — raw metadata passes through|Storefront hook handles|
|Cart read|No backend parsing — raw metadata passes through|Storefront hook handles|

A single helper can be factored if convenient — `src/api/custom-order/_utils/parse-non-apparel-quantity.ts` — but it is not required. Duplication across two call sites is acceptable and clear.

> **Confidence: High** — Imperator's explicit direction on the two-mode policy.

## 12. Touched Files (Blast Radius)

|File|Change|
|-|-|
|`src/api/store/carts/type.ts`|Replace `cartLineItemMetadataSchema` with `NonApparelMetadataSchema` (`.strict()`, `.trim().min(1).refine(≠ apparel)` on `product_type`); export `ApparelMetadataSchema` re-export; export `lineItemMetadataSchema` (the pre-parse discriminator transform schema) and `isNonApparelMetadata` type guard.|
|`src/api/store/carts/middleware.ts`|Replace local `cartLineItemMetadataSchema.parse(item.metadata)` (line 100) with reading from `req.validatedBody.items[i].metadata` — the `validateAndTransformBody(lineItemsCustomSchema)` at line 80 already produces the discriminator-parsed shape. Add `if (cartLineItemMetadata.upload_ids.length === 0) continue;` BEFORE the `listCustomOrderUploads` call at line 113 to short-circuit empty arrays.|
|`src/api/store/carts/[id]/line-items-custom/route.ts`|Replace apparel-only schema at :11-19 with the discriminator; **read `req.validatedBody.items` (NOT `req.body.items`)**; after validation, branch by type guard; dispatch to apparel vs. promo-print workflow.|
|`src/api/store/carts/[id]/custom-complete/route.ts`|Line 320-322: guard `metadata.upload_ids` read with `?? []` fallback.|
|`src/api/pricing/promo-print/route.ts`|Refactor body to call `calculatePromoPrintPrice` helper. Wrapper renames `unit_price → price` in the response to preserve existing public contract.|
|`src/api/custom-order/orders/route.ts`|Line 123: replace aggregation with product-type-branched logic + `logger.warn` audit on fallback.|
|`src/workflows/pricing/utils/calculate-promo-print-price.ts`|NEW. Pure function. Throws on missing multiplier rows (Q-B fix-loud).|
|`src/workflows/pricing/steps/calculate-promo-print-prices.ts`|NEW. Medusa `createStep`. Performs product fetch with `QueryContext({ currency_code, region_id })`, validation, price compute, bridge stamp.|
|`src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`|NEW. Cart-add workflow. Calls the step directly — no intermediate workflow wrapper.|
|`src/modules/custom-order/non-apparel-type.ts`|NEW (or add to existing apparel-type.ts). Exports `NonApparelMetadataSchema` and `NonApparelMetadata` type.|
|`integration-tests/http/non-apparel-cart.spec.ts`|NEW. Test plan §13.|

**Explicitly NOT touched:** `src/_custom/config/product_options.ts` (enum), `src/_custom/utils/promo-print-product/importer.ts`, `src/api/company/product-options/[productHandle]/route.ts`, `src/api/custom-order/order-flow.ts`, `src/api/custom-order/orders/[id]/route.ts`, `src/modules/custom-order/apparel-type.ts`, any storefront file.

> **Confidence: High** — every path verified against current branch.

## 13. Test Plan

**Integration tests** (new file `integration-tests/http/non-apparel-cart.spec.ts`):

1. **Happy path.** POST a non-apparel line item with `{ variant_id, quantity: 1, metadata: { product_type: "print", group_id, options: {...all keys...}, options_labels?, upload_ids: [] } }`. Assert cart returned, line-item `unit_price` matches server-recomputed helper output, line-item metadata contains `production_option_type: "print"`.

2. **Stale variant.** POST with options that do not resolve to the submitted `variant_id`. Assert 400 with "Submitted variant_id is stale" phrasing.

3. **Missing options.** POST with `metadata.options` missing a key from `base_option_keys`. Assert 400 listing missing keys.

4. **Missing / invalid quantity option.** POST with `metadata.options.quantity` absent / `"0"` / `"abc"`. Each → 400 "Invalid or missing options.quantity".

5. **Non-existent upload_id.** POST with `upload_ids: ["nonexistent"]`. Assert 404 (middleware-owned check).

6. **Empty upload_ids accepted.** POST with `upload_ids: []`. Assert success.

7. **Mixed apparel + non-apparel items.** POST one request containing both. Assert 400 "mixed" phrasing.

8. **Apparel regression.** Existing apparel flow from `integration-tests/http/proof-to-catalog.spec.ts:178-191` continues to pass unchanged.

9. **Empty / whitespace product_type.** POST with `product_type: ""` and `product_type: "   "`. Each → 400 Zod schema rejection from `NonApparelMetadataSchema`.

10. **Discriminator picks correct schema.** POST `{ product_type: "print", selections: [...], group_id, upload_ids, options }`. Assert 400 (strict non-apparel rejects unknown `selections` key — does NOT silently fall through to apparel branch and strip `product_type`).

11. **`req.validatedBody` consumed, not `req.body`.** Unit-level assertion: route handler reads from `req.validatedBody.items` so the discriminator-parsed shape is what reaches the type-guard.

12. **Multiplier missing-row HARD fail (Q-B).** POST a non-apparel item with `options.quantity: "999"` for a product whose `metadata.multipliers.<key>["999"]` does not exist. Assert 400 "No multiplier row for {code} at quantity tier 999". Confirms financial-loss class is closed.

13. **Empty upload_ids middleware short-circuit.** POST with `upload_ids: []`. Confirm via test instrumentation that `listCustomOrderUploads` was NOT called (no module call for empty array).

14. **Orders list aggregation.** Create a non-apparel order via custom-complete, then `GET /custom-order/orders`. Assert `quantity` equals `Number(metadata.options.quantity)` not `1`.

15. **Orders list fallback + audit breadcrumb.** Seed a non-apparel order with `metadata.options.quantity = "xyz"` (bypassing the write-path validator by inserting directly into the DB). `GET /custom-order/orders` returns 200 with `quantity = item.quantity` (1). Endpoint does not throw. Test asserts `logger.warn` was called with the line-item id and the offending payload (spy on logger).

**Unit tests** (new file alongside `calculate-promo-print-price.ts`):

- `calculatePromoPrintPrice` with (variant=base price × multiplier tier) returns correct unit_price.
- Same helper throws on missing option keys.
- Same helper throws when no variant matches options.
- Same helper throws on missing multiplier row (Q-B fix-loud — the financial-loss closure).

> **Confidence: High** — mirrors scope of apparel tests; adds coverage for quantity parse defense and mixed-cart rejection.

## 14. Verification Plan (DIV-94 / DIV-95 Closure Proofs)

DIV-99 operationally closes DIV-94 (canonical contract choice) and DIV-95 (quantity semantics). **Neither is marked done until the following smoke trace passes:**

1. **DIV-94 closure proof.** Seed a non-apparel product via the promo-print importer. Execute the full storefront flow (PDP → add to cart → view cart → checkout → order detail). `POST /store/carts/:id/line-items-custom` with real `{ variant_id + metadata }` succeeds; `GET /company/cart` returns the line item with `product_type`, `options`, `options_labels`, `group_id`, `production_option_type` all present on line-item metadata; `GET /custom-order/orders/:id` returns same.

2. **DIV-95 closure proof.** The same order appears in `GET /custom-order/orders` with `quantity` equal to `Number(metadata.options.quantity)` (e.g. 500), not 1. Cart display, order-detail display, and admin order-detail display all read the same non-apparel quantity source (line-item `metadata.options.quantity`).

3. **Apparel regression proof.** Run existing apparel integration tests: no failures.

Verification owner: the implementation agent records smoke-trace evidence in the case directory (request/response snapshots or cURL transcripts) before DIV-94 / DIV-95 are closed in Linear.

> **Confidence: High** — explicit Imperator policy: paperwork optimism rejected; proof or nothing.

## 15. Proof-Submission Blast Radius

Proof submission does NOT currently route through `/store/carts/:id/line-items-custom`. Scout grep confirmed zero non-test callers to that route from proofing code; proof creation happens in `src/api/custom-order/orders/...` flows post-cart via `custom-complete` on a `proof_type: "catalog"` cart.

This spec does NOT introduce a non-apparel proof-submission flow. Non-apparel proof submission remains unimplemented (blocked by DIV-100 upstream).

Risk statement: because this spec changes how line-items-custom accepts metadata, apparel proof submission (which flows through the same cart-add route for catalog proof-type carts) remains fully backward-compatible — the apparel branch is untouched. No blast radius into proof-submission.

> **Confidence: High** — scout trace of proof-submission call sites; apparel branch in line-items-custom preserved byte-for-byte.

## 16. Confidence Map

|Section|Confidence|Why|
|-|-|-|
|1. Goal|High|Imperator verbatim + DIV-99 ticket.|
|2. Non-goals|High|Every ticket pulled and boundary confirmed.|
|3. Contract shape|High|Storefront producer and three readers verified.|
|4. Type-guard / Zod|High|Zod discriminator mechanics documented; apparel schema inspected.|
|5. Pricing helper|High|Medusa v2 major-unit storage confirmed; extraction is mechanical.|
|6. Workflow / step|High|Apparel template at `custom-add-line-item-to-cart.ts:27-77` structurally mirrored; metadata source diverges where the bridge stamp requires reading the step output. Divergence required by §8, not accidental.|
|7. Validation rules|High|Apparel discipline mirrored.|
|8. Bridge field|High|Adapter reader verified at `adapter.ts:224`.|
|9. Custom-complete|High|Scout traced every apparel assumption; only `:320` is unguarded (`:331` already defensive). Cart→order metadata preservation is a Medusa guarantee per official docs.|
|10. Orders list|High|One call site, Imperator's explicit parse rule.|
|11. Quantity parse|High|Imperator guardrail explicit.|
|12. Touched files|High|Every path verified.|
|13. Test plan|High|Mirrors apparel coverage + new scenarios.|
|14. Verification|High|Smoke trace owner and acceptance both named.|
|15. Proof blast radius|High|Scout confirmed no current path.|

No Medium or Low confidence sections. Every ambiguity surfaced during deliberation was resolved before codification.

## 17. Open Ambiguity

**None remaining.** Both policy questions surfaced after Censor + Provocator review have been resolved by the Imperator:

### Q-A — Apparel-side symmetric bridge — RESOLVED: DEFER

The §8 bridge stamps `production_option_type` onto non-apparel line-item metadata only. Apparel continues to rely on product-metadata seeded by `seed-apparel.ts:1112`. Today the asymmetry is harmless because the proof adapter's silent default-to-apparel matches reality. Closing the asymmetry belongs to DIV-91. DIV-99 stays scoped to non-apparel.

### Q-B — Multiplier missing-row policy — RESOLVED: FIX LOUD

The helper throws `INVALID_DATA("No multiplier row for {code} at quantity tier {quantity}; product configuration is incomplete")` on missing rows. Cart-add fails cleanly; importer-side correction is forced. The financial-loss class is closed. §5 helper behavior, §7 step-layer validation table row "Multiplier row presence", and §13 test 12 + unit-test list all updated.

### Resolved on Consul authority + Medusa-doc evidence

The following Censor / Provocator / second-opinion-Consul critiques were resolved in spec revisions, each backed by code or doc citation:

- **Pre-parse discriminator schema** replaces `z.union` blind fallback. Evidence: Zod 3 source `node_modules/zod/v3/types.js:2316-2332` (first-match-wins) + `:1965-1988` (default `strip`). Without pre-parse branch, payload `{ product_type: "print", selections: [...] }` silently routes to apparel branch with `product_type` stripped.
- **`product_type` schema uses `.trim().min(1).refine(...)`.** Evidence: Zod source `:494-507` — `.min(1)` is character length; `" "` passes `.min(1)` and bypasses `.refine(v !== "apparel")` without `.trim()`.
- **Route reads `req.validatedBody.items`**, not `req.body.items`. Evidence: Medusa v2 official docs ([Request Validation](https://docs.medusajs.com/learn/fundamentals/api-routes/validation#how-to-validate-request-body)) — "the validated body parameters in the `validatedBody` property of `req`. Example: `req.validatedBody.a + req.validatedBody.b`." Plus framework source `node_modules/@medusajs/framework/dist/http/utils/validate-body.js:15`.
- **Empty `upload_ids` middleware short-circuit added** before `listCustomOrderUploads`. Evidence: Medusa MCP — module-service `list*` filter behavior with `id: []` is undocumented.
- **Workflow wrapper file dropped.** Evidence: apparel has 2 callers (`custom-add-line-item-to-cart.ts:39` cart-add path AND `src/api/pricing/apparel/route.ts:56` standalone route); promo-print spec has standalone route calling the helper directly, leaving the workflow wrapper as dead structure with one caller.
- **`transform` invariant corrected.** Evidence: Medusa v2 official docs ([Workflow Constraints](https://docs.medusajs.com/learn/fundamentals/workflows/constructor-constraints)) — `transform` IS the place for synchronous computation (date construction, string interpolation, conditionals). Prior over-strict prohibition on conditionals inside transform contradicted Medusa docs and is removed.
- **Cart→order metadata preservation noted as Medusa guarantee.** Evidence: Medusa v2 official docs ([Gift Message Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/gift-message)) — "the `metadata` is copied to the `metadata` of the order's line items."
- **§6 step skeleton no longer mentions upload validation.** Spec §7 explicitly assigns it to middleware. Internal contradiction resolved.
- **Stale `:331` references corrected to `:320`** in §16 confidence map and §9 prose. Verified directly against `custom-complete/route.ts`.
- **Empty/whitespace `product_type` rejected at schema** via `.trim().min(1).refine(v !== "apparel")`. Tests added.
- **`options_labels` source explicitly = product metadata** (line-item field is pass-through display data only).
- **Helper return shape `{ unit_price, variant_id }` internally**; route wrapper renames `unit_price → price` to preserve existing public contract.
- **`NonApparelMetadataSchema` is `.strict()`** to reject apparel-shape leakage; combined with pre-parse discriminator, the union has no silent-fall-through path.
- **Soft-fallback breadcrumb** via `logger.warn` on the orders-list aggregation makes the read-path soft fallback observable in production.
- **Variant-mismatch error phrasing** attributes cause to data drift, not user error.
- **QueryContext for cart-add uses `currency_code` AND `region_id`** (apparel parity per `custom-apparel-pricing.ts:46-67`); standalone pricing route preserves its weaker shape.
- **Test payload uses `"print"`** (a real storefront-emitted value per `divinipress-store/src/app/_interfaces/standardProduct.interface.ts:6`).

### Implementation guardrails preserved

- Helper runs inside a `createStep`, not in the workflow body.
- Quantity parse: hard 400 at write, soft fallback (to `item.quantity`) at read, with `logger.warn` audit on every fallback activation.
- Workflow constructor body contains only Medusa-permitted primitives: `createStep` invocations, `runAsStep`, `useQueryGraphStep`, `transform`, `when(...).then(...)`, `WorkflowResponse`. No async, no service resolution, no error throwing in the body.
- All async, validation-with-throw, service resolution lives inside steps.
- All money-path computations are server-authoritative; client-supplied prices are rejected.
