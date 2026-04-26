# DIV-99 Non-Apparel Cart-to-Order Transactional Contract — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable `POST /store/carts/:id/line-items-custom` to accept non-apparel (promo-print) items via `variant_id + metadata`, preserve all non-apparel metadata fields through cart→order, and stamp the `production_option_type` bridge field the storefront proof adapter requires — while preserving apparel behavior. Apparel is behaviorally preserved (existing extras like `product_title`, `brand_name`, `style_name`, `color` flow through via passthrough), with a tightened tamper rejection on the apparel branch (raw payloads carrying `options` or `options_labels` without a valid `product_type` are rejected per Imperator's strengthened Option B).

**Architecture:** Pre-parse Zod discriminator (no `z.union` blind fallback) selects either strict `NonApparelMetadataSchema` or cart-local `ApparelMetadataSchema.passthrough()` based on raw `product_type`, with a raw-shape rejection branch for the apparel-route-with-non-apparel-keys case. Route reads `req.validatedBody`, branches by type guard, dispatches to apparel or new promo-print cart-add workflow. Promo-print path is two layers (pure helper + step + cart-add workflow), no intermediate workflow wrapper. Server is the price authority; client-supplied `unit_price` is ignored — the workflow overwrites it with the helper's computed price.

**Tech Stack:** Medusa.js v2.13.1, TypeScript strict, Zod, Jest (unit + integration), `@medusajs/framework/workflows-sdk`.

**Required Medusa skill on every backend task:** `building-with-medusa`. Soldier invokes it via `Skill(skill: "building-with-medusa")` on dispatch. (If your environment registers it under a plugin namespace such as `medusa-dev:building-with-medusa`, use that exact registered name — the bare name is the canonical form expected here.)

**Spec:** `/Users/milovan/projects/consilium-docs/cases/2026-04-24-div-99-non-apparel-cart-contract/spec.md`

**Branch:** `feature/div-99-non-apparel-cart-contract` (worktree path retains legacy name `feature/div-82-importer-hierarchy`).

**Baseline commit:** `574440e` (`fix: align promo print csv filenames`).

---

## Task 1: Prune Pre-DIV-99 Dead Scaffold

> **Confidence: High** — `git grep` confirmed both files are referenced ONLY by each other (no test, no production caller). The underscore prefix on `_route_print.ts` already excludes it from Medusa's auto-routing. Removing them eliminates a naming collision risk (`addPrintPriceToCartWorkflow` vs incoming `addPromoPrintPriceToCartWorkflow`) before the soldier writes new files.

**Files:**
- Delete: `src/api/store/carts/[id]/line-items-custom/_route_print.ts`
- Delete: `src/workflows/pricing/custom-print-price-to-cart.ts`

- [ ] **Step 1: Verify the pre-condition holds at execution time.**

```bash
git grep -n "custom-print-price-to-cart\|addPrintPriceToCartWorkflow\|calculateMultiplierStep" -- 'src/' 'integration-tests/'
```

Expected: only the two files listed above appear in the output. If anything else references them, halt and report; do not delete.

- [ ] **Step 2: Delete both files.**

```bash
rm 'src/api/store/carts/[id]/line-items-custom/_route_print.ts'
rm src/workflows/pricing/custom-print-price-to-cart.ts
```

> The single quotes around the `[id]` path are required: zsh treats `[id]` as a glob character class and fails with `no matches found` for unquoted bracketed paths. Every shell command in this plan that touches `[id]` paths uses single quotes for the same reason.

- [ ] **Step 3: Verify the build still passes.**

```bash
yarn build
```

Expected: build succeeds. If TypeScript reports an unresolved import, restore the file and report.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "chore(div-99): remove pre-DIV-99 print scaffold superseded by promo-print workflow"
```

---

## Task 2: Create `src/modules/custom-order/non-apparel-type.ts`

> **Confidence: High** — schema shape verbatim from spec §3 + §4. Mirrors `apparel-type.ts` conventions (Zod schema + inferred type, exported together).

**Files:**
- Create: `src/modules/custom-order/non-apparel-type.ts`

- [ ] **Step 1: Write the file.**

```ts
import { z } from "zod";

// Pre-discriminator predicate. Used by the carts/type.ts pre-parse transform
// to decide which schema runs against a raw payload BEFORE Zod sees it.
// Treats whitespace as empty (".trim().length"), and rejects "apparel" so the
// non-apparel branch never silently masquerades as apparel.
export const isNonApparelProductType = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.trim() !== "apparel";

// Strict — rejects unknown keys. Combined with the pre-parse discriminator,
// a payload like `{ product_type: "print", selections: [...] }` will be
// rejected here (selections is unknown), NOT silently stripped by an apparel
// fallback. See spec §4 for the first-match-wins evidence chain.
export const NonApparelMetadataSchema = z
  .object({
    product_type: z
      .string()
      .trim()
      .min(1, "product_type must be non-empty")
      .refine((v) => v !== "apparel", "product_type cannot be 'apparel' on non-apparel branch"),
    group_id: z.string(),
    upload_ids: z.array(z.string()),
    options: z.record(z.string(), z.string()),
    options_labels: z.record(z.string(), z.string()).optional(),
    product_name: z.string().optional(),
    design_notes: z.string().optional(),
  })
  .strict();

export type NonApparelMetadata = z.infer<typeof NonApparelMetadataSchema>;
```

- [ ] **Step 2: Verify it compiles in isolation.**

```bash
yarn build
```

Expected: build succeeds. No TypeScript errors.

- [ ] **Step 3: Commit.**

```bash
git add src/modules/custom-order/non-apparel-type.ts
git commit -m "feat(div-99): add NonApparelMetadataSchema (strict, with .trim().min(1).refine non-apparel discriminator)"
```

---

## Task 3: Pure Pricing Helper `calculate-promo-print-price.ts` (TDD)

> **Confidence: High** — extraction is mechanical from `src/api/pricing/promo-print/route.ts:35-154`. The Q-B fix-loud behavior on missing multiplier rows replaces the existing silent `continue` at lines 140 and 143, and silent `if (factor != null)` at line 146. Spec §5 + §13 list four required unit tests; this task implements them in TDD order.

**Files:**
- Create: `src/workflows/pricing/utils/__tests__/calculate-promo-print-price.unit.spec.ts`
- Create: `src/workflows/pricing/utils/calculate-promo-print-price.ts`

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Write the failing unit-test file.**

```ts
// src/workflows/pricing/utils/__tests__/calculate-promo-print-price.unit.spec.ts
import { calculatePromoPrintPrice } from "../calculate-promo-print-price";

const buildProduct = () => ({
  id: "prod_promo_1",
  metadata: {
    base_option_keys: ["paper_type", "quantity"],
    multiplier_keys: ["finish"],
    options_labels: {
      paper_type: "Paper Type",
      quantity: "Quantity",
      finish: "Finish",
    } as Record<string, string>,
    multipliers: {
      finish: {
        "500": { matte: 1, glossy: 1.2 },
        "1000": { matte: 1, glossy: 1.15 },
        // NOTE: no "999" row. The Q-B test below targets this gap by
        // submitting quantity "999" against the matte_999 variant — variant
        // resolves, but the multiplier row is absent.
      },
    } as Record<string, Record<string, Record<string, number>>>,
  } as Record<string, unknown>,
  variants: [
    {
      id: "var_500_matte",
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "500" },
      ],
      calculated_price: { calculated_amount: 50 },
    },
    {
      id: "var_1000_matte",
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "1000" },
      ],
      calculated_price: { calculated_amount: 80 },
    },
    {
      id: "var_999_matte",
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "999" },
      ],
      calculated_price: { calculated_amount: 100 },
    },
  ],
});

describe("calculatePromoPrintPrice", () => {
  it("returns base price × multiplier factor at 2 decimal places", () => {
    const product = buildProduct();
    const result = calculatePromoPrintPrice({
      product,
      options: { paper_type: "matte", quantity: "500", finish: "glossy" },
    });
    expect(result.unit_price).toBe(60); // 50 × 1.2
    expect(result.variant_id).toBe("var_500_matte");
  });

  it("throws INVALID_DATA when a base option key is missing", () => {
    const product = buildProduct();
    expect(() =>
      calculatePromoPrintPrice({
        product,
        options: { quantity: "500", finish: "matte" }, // paper_type missing
      }),
    ).toThrow(/Missing required options.*paper_type/);
  });

  it("throws INVALID_DATA when no variant matches the submitted base options", () => {
    const product = buildProduct();
    let caught: any;
    try {
      calculatePromoPrintPrice({
        product,
        options: { paper_type: "linen", quantity: "500", finish: "matte" }, // 'linen' has no variant
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.type).toBe("invalid_data");
    expect(String(caught.message)).toMatch(/No variant found matching options/);
  });

  it("throws INVALID_DATA when the multiplier row for a code/quantity is missing (Q-B fix-loud)", () => {
    const product = buildProduct();
    // quantity "999" has no multiplier table for 'finish'
    expect(() =>
      calculatePromoPrintPrice({
        product,
        options: { paper_type: "matte", quantity: "999", finish: "glossy" },
      }),
    ).toThrow(/No multiplier row for finish at quantity tier 999/);
  });
});
```

- [ ] **Step 2: Run the failing tests.**

```bash
yarn test:unit --testPathPattern=calculate-promo-print-price
```

Expected: FAIL — `Cannot find module '../calculate-promo-print-price'`. The path import does not yet exist.

- [ ] **Step 3: Implement the helper.**

```ts
// src/workflows/pricing/utils/calculate-promo-print-price.ts
import { MedusaError } from "@medusajs/framework/utils";

export type PromoPrintPricingInput = {
  product: {
    id: string;
    metadata: Record<string, unknown> | null;
    variants: Array<{
      id: string;
      options: Array<{ option: { title: string }; value: string }>;
      calculated_price?: { calculated_amount?: number | null };
    }>;
  };
  // line-item metadata.options — submitted by client
  options: Record<string, string>;
};

export type PromoPrintPricingResult = {
  unit_price: number; // major units (dollars), 2dp
  variant_id: string;
};

export function calculatePromoPrintPrice(
  input: PromoPrintPricingInput,
): PromoPrintPricingResult {
  const { product, options } = input;
  const metadata = product.metadata ?? {};

  const baseOptionKeys = (metadata as Record<string, unknown>).base_option_keys as string[] | undefined ?? [];
  const multiplierKeys = (metadata as Record<string, unknown>).multiplier_keys as string[] | undefined ?? [];
  const optionsLabels = (metadata as Record<string, unknown>).options_labels as Record<string, string> | undefined ?? {};
  const multipliers = (metadata as Record<string, unknown>).multipliers as
    | Record<string, Record<string, Record<string, number>>>
    | undefined
    ?? {};

  const allRequiredKeys = [...baseOptionKeys, ...multiplierKeys];
  const missingKeys = allRequiredKeys.filter((k) => !(k in options));
  if (missingKeys.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required options: ${missingKeys.join(", ")}`,
    );
  }

  const baseOptions: Record<string, string> = {};
  const multiplierOptions: Record<string, string> = {};
  for (const [key, value] of Object.entries(options)) {
    if (baseOptionKeys.includes(key)) {
      baseOptions[key] = value;
    } else if (multiplierKeys.includes(key)) {
      multiplierOptions[key] = value;
    }
  }

  const matchingVariant = product.variants.find((variant) => {
    const variantOpts = variant.options;
    if (!variantOpts) return false;
    return Object.entries(baseOptions).every(([code, value]) => {
      const label = optionsLabels[code] ?? code;
      return variantOpts.some((vo) => vo.option?.title === label && vo.value === value);
    });
  });

  if (!matchingVariant) {
    // Spec §7 row "Variant resolves" → 400 (INVALID_DATA), not 404.
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `No variant found matching options: ${JSON.stringify(baseOptions)}`,
    );
  }

  const basePrice = matchingVariant.calculated_price?.calculated_amount;
  if (basePrice == null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Price not found for matching variant",
    );
  }

  const quantityValue = options.quantity;
  let finalPrice = basePrice;

  for (const [code, selectedValue] of Object.entries(multiplierOptions)) {
    const codeTable = multipliers[code];
    const qtyTable = codeTable?.[quantityValue];
    const factor = qtyTable?.[selectedValue];

    // Q-B FIX-LOUD: missing row is a 400, never a silent 1.0
    if (factor == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No multiplier row for ${code} at quantity tier ${quantityValue}; product configuration is incomplete`,
      );
    }
    finalPrice *= factor;
  }

  finalPrice = Math.round(finalPrice * 100) / 100;

  return {
    unit_price: finalPrice,
    variant_id: matchingVariant.id,
  };
}
```

- [ ] **Step 4: Run the unit tests, verify they pass.**

```bash
yarn test:unit --testPathPattern=calculate-promo-print-price
```

Expected: 4 PASS, 0 FAIL.

- [ ] **Step 5: Commit.**

```bash
git add src/workflows/pricing/utils/calculate-promo-print-price.ts src/workflows/pricing/utils/__tests__/calculate-promo-print-price.unit.spec.ts
git commit -m "feat(div-99): add calculatePromoPrintPrice helper with hard-fail on missing multiplier rows"
```

---

## Task 4: Refactor `/api/pricing/promo-print/route.ts` to Delegate to Helper

> **Confidence: High** — public response field stays `price` (existing contract). Helper returns `unit_price` (Medusa term-of-art); route renames in the response. The standalone route preserves its existing weak `QueryContext({ currency_code: "usd" })` shape per spec §5 ("standalone pricing route at `/api/pricing/promo-print` retains its current `currency_code: "usd"` shape").

**Files:**
- Modify: `src/api/pricing/promo-print/route.ts` — replace lines 70-154 (logic body) with helper call. Lines 1-69 (schema, query.graph fetch) preserved.

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Replace the file body.**

Replace the entire file with the following (preserves request schema + product fetch; delegates compute to helper):

```ts
import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils";
import { calculatePromoPrintPrice } from "@/workflows/pricing/utils/calculate-promo-print-price";

const postSchema = z
  .object({
    product_id: z.string().optional(),
    handle: z.string().optional(),
    options: z.record(z.string(), z.string()),
  })
  .strict()
  .refine((data) => data.product_id || data.handle, {
    message: "Either product_id or handle is required",
  });

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }

  const { product_id, handle, options } = parsed.data;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const filters: Record<string, unknown> = {};
  if (product_id) {
    filters.id = product_id;
  } else {
    filters.handle = handle;
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "variants.*",
      "variants.options.*",
      "variants.options.option.*",
      "variants.calculated_price.*",
    ],
    filters,
    context: {
      variants: {
        calculated_price: QueryContext({
          currency_code: "usd",
        }),
      },
    },
  });

  if (products.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found");
  }

  const product = products[0];
  const result = calculatePromoPrintPrice({
    product: {
      id: product.id,
      metadata: product.metadata as Record<string, unknown> | null,
      variants: (product.variants ?? []) as PromoPrintPricingInputVariants,
    },
    options,
  });

  // Public response field stays `price` to preserve the existing contract.
  res.json({ price: result.unit_price, variant_id: result.variant_id });
};

type PromoPrintPricingInputVariants = Parameters<
  typeof calculatePromoPrintPrice
>[0]["product"]["variants"];
```

- [ ] **Step 2: Build to confirm types resolve.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 3: Smoke-test the standalone route stays functional.**

(Manual cURL only if the integration test in Task 12 cannot exercise this path. Skip if Task 12's coverage subsumes it.)

- [ ] **Step 4: Commit.**

```bash
git add src/api/pricing/promo-print/route.ts
git commit -m "refactor(div-99): delegate /pricing/promo-print to calculatePromoPrintPrice helper"
```

---

## Task 5: Create the Step `calculate-promo-print-prices.ts`

> **Confidence: High** — mirrors `calculateApparelPricesStep` in `src/workflows/pricing/custom-apparel-pricing.ts:28-95`. The bridge stamp from spec §8 is added to each item's metadata in the StepResponse. Region resolution mirrors `custom-apparel-pricing.ts:46-54` exactly.

**Files:**
- Create: `src/workflows/pricing/steps/calculate-promo-print-prices.ts`

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Create the directory and file.**

```bash
mkdir -p src/workflows/pricing/steps
```

Then write the file:

```ts
// src/workflows/pricing/steps/calculate-promo-print-prices.ts
import {
  ContainerRegistrationKeys,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils";
import {
  StepResponse,
  createStep,
} from "@medusajs/framework/workflows-sdk";
import {
  calculatePromoPrintPrice,
  type PromoPrintPricingResult,
} from "@/workflows/pricing/utils/calculate-promo-print-price";
import type { NonApparelMetadata } from "@/modules/custom-order/non-apparel-type";

export type NonApparelCartItem = {
  variant_id: string;
  quantity: number;
  metadata: NonApparelMetadata;
};

type StepInput = {
  items: NonApparelCartItem[];
  currency_code: string;
  region_id: string;
};

type PerItemResult = PromoPrintPricingResult & {
  metadata: NonApparelMetadata & { production_option_type: string };
};

type StepOutput = {
  items: PerItemResult[];
};

export const calculatePromoPrintPricesStep = createStep(
  "calculate-promo-print-prices",
  async (
    { items, currency_code, region_id }: StepInput,
    { container },
  ): Promise<StepResponse<StepOutput>> => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Spec §5: cart-flow path uses BOTH currency_code AND region_id from the
    // cart, not a hardcoded region name. Apparel's hardcoded "United States"
    // pattern is a known weakness — we don't replicate it here.

    // Quantity sanity check (HARD per spec §7).
    for (const item of items) {
      const optQty = Number(item.metadata.options.quantity);
      if (!Number.isFinite(optQty) || optQty <= 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid or missing options.quantity for non-apparel item",
        );
      }
    }

    // Two-step fetch (variant-by-id is the verified Medusa pattern; nested
    // relation filters on entity: "product" are not in the existing codebase
    // and aren't worth the risk):
    // 1. Resolve product_id for each submitted variant.
    // 2. Fetch the unique products with their full variant catalog and prices.
    const variantIds = items.map((i) => i.variant_id);

    const { data: variantHeaders } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id"],
      filters: { id: variantIds },
    });

    const variantToProduct = new Map<string, string>();
    for (const v of variantHeaders) {
      if (v?.id && v?.product_id) {
        variantToProduct.set(v.id, v.product_id);
      }
    }

    const productIds = [...new Set(variantHeaders.map((v) => v.product_id).filter(Boolean) as string[])];

    if (productIds.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No products found for variant_ids: ${variantIds.join(", ")}`,
      );
    }

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "metadata",
        "variants.*",
        "variants.options.*",
        "variants.options.option.*",
        "variants.calculated_price.*",
      ],
      filters: { id: productIds },
      context: {
        variants: {
          calculated_price: QueryContext({
            currency_code,
            region_id,
          }),
        },
      },
    });

    const productById = new Map<string, (typeof products)[number]>();
    for (const product of products) {
      productById.set(product.id, product);
    }

    const productByVariantId = new Map<string, (typeof products)[number]>();
    for (const variantId of variantIds) {
      const productId = variantToProduct.get(variantId);
      if (productId && productById.has(productId)) {
        productByVariantId.set(variantId, productById.get(productId)!);
      }
    }

    // Compute price per item; verify the resolved variant matches the submitted one;
    // stamp the production_option_type bridge on line-item metadata.
    const out: PerItemResult[] = items.map((item) => {
      const product = productByVariantId.get(item.variant_id);
      if (!product) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product not found for variant_id ${item.variant_id}`,
        );
      }

      const result = calculatePromoPrintPrice({
        product: {
          id: product.id,
          metadata: product.metadata as Record<string, unknown> | null,
          variants: (product.variants ?? []) as Parameters<
            typeof calculatePromoPrintPrice
          >[0]["product"]["variants"],
        },
        options: item.metadata.options,
      });

      if (result.variant_id !== item.variant_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Submitted variant_id is stale relative to current product configuration. Re-fetch the PDP and retry.",
        );
      }

      return {
        unit_price: result.unit_price,
        variant_id: result.variant_id,
        metadata: {
          ...item.metadata,
          // Bridge stamp — see spec §8. Storefront proof adapter reads this.
          production_option_type: item.metadata.product_type,
        },
      };
    });

    return new StepResponse({ items: out });
  },
);
```

- [ ] **Step 2: Build to confirm types resolve.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 3: Commit.**

```bash
git add src/workflows/pricing/steps/calculate-promo-print-prices.ts
git commit -m "feat(div-99): add calculatePromoPrintPricesStep with bridge stamp + variant-mismatch guard"
```

---

## Task 6: Create the Cart-Add Workflow `custom-add-promo-print-line-item-to-cart.ts`

> **Confidence: High** — structurally mirrors `addApparelPriceToCartWorkflow` at `src/workflows/pricing/custom-add-line-item-to-cart.ts:27-77`. Differences (each justified by spec): step called directly (no intermediate workflow wrapper, per spec §6); metadata read from step output (carries the bridge stamp). Workflow body uses only Medusa-permitted primitives — no async, no service resolution, no `if`/ternary at body level.

**Files:**
- Create: `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Write the file.**

```ts
// src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import {
  calculatePromoPrintPricesStep,
  type NonApparelCartItem,
} from "./steps/calculate-promo-print-prices";

type AddPromoPrintPriceToCartWorkflowInput = {
  cart_id: string;
  items: NonApparelCartItem[];
};

export const addPromoPrintPriceToCartWorkflow = createWorkflow(
  "add-promo-print-price-to-cart",
  ({ cart_id, items }: AddPromoPrintPriceToCartWorkflowInput) => {
    // @ts-ignore
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "currency_code", "region_id"],
    });

    const stepInput = transform({ carts, items }, ({ carts, items }) => ({
      items,
      currency_code: carts[0]?.currency_code as string,
      // Spec §5 mandate: thread cart's region_id, do not fall back to a
      // hardcoded "United States" lookup like apparel does.
      region_id: carts[0]?.region_id as string,
    }));

    const pricingResult = calculatePromoPrintPricesStep(stepInput);

    const cartInput = transform(
      { cart_id, pricingResult, items },
      ({ cart_id, pricingResult, items }) => ({
        cart_id,
        items: items.map((item, index) => ({
          variant_id: pricingResult.items[index].variant_id,
          // Storefront posts quantity: 1 for non-apparel; the real customer-facing
          // count lives in metadata.options.quantity (a tier string like "500").
          quantity: item.quantity,
          unit_price: pricingResult.items[index].unit_price,
          // Bridged metadata (production_option_type stamped) from the step.
          metadata: pricingResult.items[index].metadata,
        })),
      }),
    );

    addToCartWorkflow.runAsStep({ input: cartInput });

    // @ts-ignore
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*", "items.variant.*"],
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse(updatedCarts);
  },
);
```

- [ ] **Step 2: Build to confirm types resolve.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 3: Commit.**

```bash
git add src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts
git commit -m "feat(div-99): add addPromoPrintPriceToCartWorkflow (step composed directly, no wrapper)"
```

---

## Task 7: Add Discriminator Schema to `src/api/store/carts/type.ts` (Build-Safe)

> **Confidence: High** — schema verbatim from spec §4. The pre-parse discriminator avoids `z.union` first-match-wins. **This task ADDS the new exports while leaving the old `cartLineItemMetadataSchema` in place.** That keeps `yarn build` green between this commit and Task 9 (where the old symbol is removed). Bisectability is preserved.

**Files:**
- Modify: `src/api/store/carts/type.ts` — append new exports; preserve the existing `cartLineItemMetadataSchema` until Task 9 removes it.

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Append to the file (do not remove the existing schema).**

The current file is:

```ts
import { z } from "zod";

export const cartLineItemMetadataSchema = z.object({
  group_id: z.string(),
  product_name: z.string().optional(),
  upload_ids: z.array(z.string()),
  selections: z.array(z.any()),
});
```

Replace the entire file with:

```ts
// src/api/store/carts/type.ts
import { z } from "zod";
import { StoreAddCartLineItem } from "@medusajs/medusa/api/store/carts/validators";
import { ApparelMetadataSchema } from "@/modules/custom-order/apparel-type";
import {
  isNonApparelProductType,
  NonApparelMetadataSchema,
  type NonApparelMetadata,
} from "@/modules/custom-order/non-apparel-type";

export { ApparelMetadataSchema, NonApparelMetadataSchema };
export type { NonApparelMetadata };

// Legacy schema. Still exported because middleware (Task 8) and the route file
// (Task 9) currently import it. Removed in Task 9 once those callers switch.
export const cartLineItemMetadataSchema = z.object({
  group_id: z.string(),
  product_name: z.string().optional(),
  upload_ids: z.array(z.string()),
  selections: z.array(z.any()),
});

// Cart-local apparel schema — `.passthrough()` preserves extra metadata fields
// (product_title, brand_name, style_name, color, etc.) that the existing
// apparel proof submission flow attaches to line-item metadata. Without
// passthrough, switching the route from req.body to req.validatedBody would
// silently strip those fields and break apparel.
//
// THIS IS NOT A GLOBAL CHANGE to ApparelMetadataSchema in
// modules/custom-order/apparel-type.ts — only the cart-local discriminator
// uses passthrough. Other apparel callers retain strip semantics.
const cartApparelMetadataSchema = ApparelMetadataSchema.passthrough();

// Pre-parse discriminator (strengthened Option B per Imperator decision).
// Three branches:
//   1. raw.product_type is a valid non-apparel discriminator → run strict NonApparel
//   2. raw has non-apparel-shape signals (`options` or `options_labels`) but
//      no valid product_type → REJECT (don't route to apparel and silent-strip)
//   3. neither → run apparel passthrough (preserves extra fields)
//
// Evidence chain in spec §4 (Zod source citations) + Imperator's Q-A
// strengthening: apparel branch must preserve raw metadata for the existing
// proof-submission flow, but must NOT accept non-apparel-shape payloads that
// happen to lack a valid product_type.
export const lineItemMetadataSchema = z.unknown().transform((raw, ctx) => {
  if (typeof raw !== "object" || raw === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata must be an object",
    });
    return z.NEVER;
  }

  const rawObj = raw as Record<string, unknown>;
  const productType = rawObj.product_type;

  // Branch 1: caller declares non-apparel via valid product_type.
  if (isNonApparelProductType(productType)) {
    const parsed = NonApparelMetadataSchema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => ctx.addIssue(issue));
      return z.NEVER;
    }
    return parsed.data;
  }

  // Branch 2: caller did NOT declare non-apparel. Reject if the payload
  // carries non-apparel-shape signals — these keys are NOT part of the
  // apparel contract and their presence indicates a non-apparel payload
  // missing a valid discriminator. Closes the silent-strip vulnerability
  // identified by the Praetor.
  const hasNonApparelOptions =
    typeof rawObj.options === "object" && rawObj.options !== null;
  const hasNonApparelOptionsLabels =
    typeof rawObj.options_labels === "object" && rawObj.options_labels !== null;

  if (hasNonApparelOptions || hasNonApparelOptionsLabels) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "metadata contains non-apparel-shape keys (options/options_labels) " +
        "without a valid product_type discriminator. Set product_type to " +
        "a non-apparel value (e.g., 'print', 'promo') to use the non-apparel " +
        "branch, or remove these keys for the apparel branch.",
    });
    return z.NEVER;
  }

  // Branch 3: apparel passthrough — preserve all metadata fields including
  // existing extras like product_title, brand_name, style_name, color.
  const parsed = cartApparelMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => ctx.addIssue(issue));
    return z.NEVER;
  }
  return parsed.data;
});

// Request-body schema used by the route's middleware.
export const lineItemsCustomSchema = z.object({
  items: z.array(
    StoreAddCartLineItem.merge(
      z.object({
        metadata: lineItemMetadataSchema,
      }),
    ),
  ),
});

export type LineItemsCustomItem = z.infer<typeof lineItemsCustomSchema>;

// Type guard discriminator on the post-parse shape.
export const isNonApparelMetadata = (m: unknown): m is NonApparelMetadata =>
  typeof m === "object" &&
  m !== null &&
  typeof (m as { product_type?: unknown }).product_type === "string" &&
  (m as { product_type: string }).product_type !== "apparel";
```

- [ ] **Step 2: Build — must succeed (the legacy export keeps middleware/route imports satisfied).**

```bash
yarn build
```

Expected: build succeeds. Legacy `cartLineItemMetadataSchema` is retained so middleware/route imports stay valid; Task 9 prunes it once those callers have migrated.

- [ ] **Step 3: Add discriminator unit tests (TDD-style — schema is already implemented, tests pin the contract).**

Create `src/api/store/carts/__tests__/line-item-metadata-schema.unit.spec.ts`:

```ts
// src/api/store/carts/__tests__/line-item-metadata-schema.unit.spec.ts
import { lineItemMetadataSchema } from "../type";

describe("lineItemMetadataSchema (cart-local discriminator)", () => {
  // Branch 1 — non-apparel valid payload
  it("accepts a strict-shaped non-apparel payload", () => {
    const result = lineItemMetadataSchema.safeParse({
      product_type: "print",
      group_id: "g1",
      upload_ids: [],
      options: { paper_type: "matte", quantity: "500", finish: "matte" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-apparel payload with an unknown extra key (strict)", () => {
    const result = lineItemMetadataSchema.safeParse({
      product_type: "print",
      group_id: "g1",
      upload_ids: [],
      options: { paper_type: "matte", quantity: "500", finish: "matte" },
      mystery_field: "should_fail_strict",
    });
    expect(result.success).toBe(false);
  });

  // Branch 2 — non-apparel-shape payload missing valid product_type
  it("rejects raw payload with `options` and no valid product_type", () => {
    const result = lineItemMetadataSchema.safeParse({
      group_id: "g1",
      upload_ids: [],
      options: { paper_type: "matte", quantity: "500", finish: "matte" },
      selections: [], // even with apparel-shape selections, options presence triggers rejection
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) =>
        /non-apparel-shape keys/.test(i.message),
      )).toBe(true);
    }
  });

  it("rejects raw payload with `options_labels` and no valid product_type", () => {
    const result = lineItemMetadataSchema.safeParse({
      group_id: "g1",
      upload_ids: [],
      options_labels: { finish: "Finish" },
      selections: [],
    });
    expect(result.success).toBe(false);
  });

  // Branch 3 — apparel passthrough preserves extra metadata fields
  it("accepts an apparel payload and PRESERVES product_title/brand_name/style_name/color (passthrough)", () => {
    const result = lineItemMetadataSchema.safeParse({
      group_id: "g1",
      upload_ids: ["upload_1"],
      selections: [
        { key: "decoration", value: "screen_print" },
        {
          key: "artwork",
          value: [
            { location: "front", placement_id: "front_chest", upload_id: "upload_1", color: "1" },
          ],
        },
      ],
      product_title: "Bella Canvas 3001",
      brand_name: "Bella Canvas",
      style_name: "3001",
      color: "Black",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.product_title).toBe("Bella Canvas 3001");
      expect(data.brand_name).toBe("Bella Canvas");
      expect(data.style_name).toBe("3001");
      expect(data.color).toBe("Black");
    }
  });

  // Edge cases on the discriminator
  it.each([null, undefined, 123, "  ", "apparel"])(
    "treats product_type=%p as the apparel branch",
    (productType) => {
      const result = lineItemMetadataSchema.safeParse({
        product_type: productType,
        group_id: "g1",
        upload_ids: [],
        selections: [
          { key: "decoration", value: "screen_print" },
          { key: "artwork", value: [] },
        ],
      });
      // Apparel parse may fail for other reasons (e.g. empty artwork), but the
      // schema choice itself must NOT be the strict non-apparel branch — proven
      // by the absence of the strict-rejection error message.
      if (!result.success) {
        for (const issue of result.error.issues) {
          expect(issue.message).not.toMatch(/non-apparel-shape/);
        }
      }
    },
  );
});
```

- [ ] **Step 4: Run the unit tests.**

```bash
yarn test:unit --testPathPattern=line-item-metadata-schema
```

Expected: all tests PASS. The schema is already implemented in Step 1.

- [ ] **Step 5: Commit.**

```bash
git add src/api/store/carts/type.ts src/api/store/carts/__tests__/line-item-metadata-schema.unit.spec.ts
git commit -m "feat(div-99): add pre-parse discriminator schema with strengthened apparel-branch guard + unit tests"
```

---

## Task 8: Switch `src/api/store/carts/middleware.ts` to `req.validatedBody` + Empty-Array Short-Circuit

> **Confidence: High** — `validateAndTransformBody(lineItemsCustomSchema)` at line 80 already populates `req.validatedBody` with the discriminator-parsed shape. Removing the local `cartLineItemMetadataSchema.parse(item.metadata)` re-parse eliminates redundant validation. After this task, `cartLineItemMetadataSchema` has only one remaining caller (the route file), which Task 9 migrates. Empty-array short-circuit added per spec §7.

**Files:**
- Modify: `src/api/store/carts/middleware.ts` — replace lines 1-21 (imports) and lines 81-138 (inner middleware body).

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Replace the imports block (lines 1-21).**

Old (top of file):

```ts
import { MedusaRequestWithCompany } from "src/api/_type/request";
import { z } from "zod";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import { validateAndTransformBody } from "@medusajs/framework/http";
import type { StoreCreateCart } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { CUSTOM_ORDER_MODULE } from "../../../modules/custom-order";
import {
  LineItemsCustomItem,
  lineItemsCustomSchema,
} from "./[id]/line-items-custom/route";
import { cartLineItemMetadataSchema } from "./type";
```

New:

```ts
import { MedusaRequestWithCompany } from "src/api/_type/request";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import { validateAndTransformBody } from "@medusajs/framework/http";
import type { StoreCreateCart } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { CUSTOM_ORDER_MODULE } from "../../../modules/custom-order";
import {
  LineItemsCustomItem,
  lineItemsCustomSchema,
} from "./type";
```

(Note: `lineItemsCustomSchema` and `LineItemsCustomItem` now live in `./type`, not in the route file. The route file in Task 9 will import them from `./type` as well.)

- [ ] **Step 2: Replace the inner middleware body (lines 81-138 in the original file — the second middleware function inside the `/store/carts/:id/line-items-custom` matcher).**

Old (the function starting at `async (req: MedusaRequest<LineItemsCustomItem>...` after `validateAndTransformBody(lineItemsCustomSchema)`):

```ts
async (
  req: MedusaRequest<LineItemsCustomItem>,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const { items } = req.body;

  for (const item of items) {
    if (!item.metadata) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "metadata is required",
      );
    }

    let cartLineItemMetadata: null | z.infer<
      typeof cartLineItemMetadataSchema
    > = null;
    try {
      cartLineItemMetadata = cartLineItemMetadataSchema.parse(
        item.metadata,
      );
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error.message,
      );
    }

    // Validate that the upload exists and is not already associated with a custom order
    const customOrderModuleService =
      req.scope.resolve(CUSTOM_ORDER_MODULE);
    const uploads = await customOrderModuleService.listCustomOrderUploads(
      {
        id: cartLineItemMetadata.upload_ids,
      },
    );

    if (uploads.length !== cartLineItemMetadata.upload_ids.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Upload with ID [${cartLineItemMetadata.upload_ids.filter((id) => !uploads.some((upload) => upload.id === id)).join(", ")}] not found`,
      );
    }

    const previouslyAssociatedUploads = uploads.filter(
      (upload) => upload.custom_order_id != null,
    );
    if (previouslyAssociatedUploads.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Upload [${previouslyAssociatedUploads.map((upload) => upload.id).join(", ")}] are already associated with a custom order`,
      );
    }
  }

  next();
},
```

New:

```ts
async (
  req: MedusaRequest<LineItemsCustomItem>,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  // Read the discriminator-parsed shape from req.validatedBody (Medusa convention,
  // populated by validateAndTransformBody above). Do NOT re-parse here — the
  // schema already ran in validateAndTransformBody.
  const validated = req.validatedBody as LineItemsCustomItem | undefined;
  if (!validated) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Validated request body unavailable",
    );
  }

  const customOrderModuleService = req.scope.resolve(CUSTOM_ORDER_MODULE);

  for (const item of validated.items) {
    const metadata = item.metadata as { upload_ids: string[] };

    // Spec §7: skip the module call entirely when upload_ids is empty.
    // MikroORM behavior with `id: []` is undocumented; do not depend on it.
    if (metadata.upload_ids.length === 0) {
      continue;
    }

    const uploads = await customOrderModuleService.listCustomOrderUploads({
      id: metadata.upload_ids,
    });

    if (uploads.length !== metadata.upload_ids.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Upload with ID [${metadata.upload_ids
          .filter((id) => !uploads.some((upload) => upload.id === id))
          .join(", ")}] not found`,
      );
    }

    const previouslyAssociatedUploads = uploads.filter(
      (upload) => upload.custom_order_id != null,
    );
    if (previouslyAssociatedUploads.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Upload [${previouslyAssociatedUploads
          .map((upload) => upload.id)
          .join(", ")}] are already associated with a custom order`,
      );
    }
  }

  next();
},
```

- [ ] **Step 3: Build — must succeed.**

```bash
yarn build
```

Expected: build succeeds. The `cartLineItemMetadataSchema` import has been removed from the middleware; the legacy export in `type.ts` (added in Task 7) now has only one remaining caller (the route in Task 9).

- [ ] **Step 4: Commit.**

```bash
git add src/api/store/carts/middleware.ts
git commit -m "refactor(div-99): middleware reads req.validatedBody, adds empty-array upload short-circuit"
```

---

## Task 9: Switch `line-items-custom/route.ts` to `req.validatedBody` + Branch By Type Guard, Then Prune Legacy Schema

> **Confidence: High** — `req.validatedBody` requirement verbatim from Medusa v2 official docs (spec §4 cited evidence chain). Apparel branch preserves byte-for-byte equivalence with current behavior — only differences are: (a) reading from `req.validatedBody`, (b) selections/upload extraction is now apparel-only, (c) mixed-cart rejection added. Promo-print branch dispatches to the new workflow.

**Files:**
- Modify: `src/api/store/carts/[id]/line-items-custom/route.ts` — replace entire contents. The schema definition moves to `src/api/store/carts/type.ts` (Task 7).

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Replace the file.**

```ts
// src/api/store/carts/[id]/line-items-custom/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import {
  isNonApparelMetadata,
  type LineItemsCustomItem,
} from "@/api/store/carts/type";
import { CUSTOM_ORDER_MODULE } from "@/modules/custom-order";
import type { ApparelMetadata } from "@/modules/custom-order/apparel-type";
import type { NonApparelMetadata } from "@/modules/custom-order/non-apparel-type";
import { addApparelPriceToCartWorkflow } from "@/workflows/pricing/custom-add-line-item-to-cart";
import { addPromoPrintPriceToCartWorkflow } from "@/workflows/pricing/custom-add-promo-print-line-item-to-cart";
import { validateApparelPricingInput } from "@/workflows/pricing/utils/validate-apparel-input";

export const POST = async (
  req: MedusaRequest<LineItemsCustomItem>,
  res: MedusaResponse,
) => {
  const cartId = req.params.id;
  // Spec §4 + Medusa Request Validation docs: validated body MUST be read from
  // req.validatedBody, not req.body.
  const validated = req.validatedBody as LineItemsCustomItem | undefined;
  if (!validated) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Validated request body unavailable",
    );
  }
  const { items } = validated;

  try {
    // Reject mixed carts (spec §4 mandate).
    const nonApparelCount = items.filter((i) => isNonApparelMetadata(i.metadata)).length;
    const apparelCount = items.length - nonApparelCount;
    if (nonApparelCount > 0 && apparelCount > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "mixed apparel / non-apparel items not permitted in one request",
      );
    }

    if (nonApparelCount > 0) {
      const nonApparelItems = items.map((item) => ({
        variant_id: item.variant_id as string,
        quantity: item.quantity,
        metadata: item.metadata as NonApparelMetadata,
      }));

      const { result } = await addPromoPrintPriceToCartWorkflow(req.scope).run({
        input: {
          cart_id: cartId,
          items: nonApparelItems,
        },
      });

      return res.status(200).json(result);
    }

    // Apparel branch — preserves the existing apparel behaviour.
    const apparelItems = items.map((item) => ({
      variant_id: item.variant_id as string,
      quantity: item.quantity,
      metadata: item.metadata as ApparelMetadata,
    }));

    const pricingTier = "tier1";
    const selections = apparelItems.find((item) => !!item.metadata?.selections)
      ?.metadata?.selections;

    const validation = validateApparelPricingInput(
      apparelItems,
      selections,
      pricingTier,
    );

    if (!validation.valid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        validation.error || "Invalid apparel pricing input",
      );
    }

    const uploadIds =
      selections
        ?.find((selection) => selection.key === "artwork")
        ?.value?.map((value) => value.upload_id)
        .filter(Boolean) ?? [];

    const [_, count] = await req.scope
      .resolve(CUSTOM_ORDER_MODULE)
      .listAndCountCustomOrderUploads({
        id: uploadIds,
      });

    if (count !== uploadIds.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Some of the uploads not found",
      );
    }

    const { result } = await addApparelPriceToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        pricingTier,
        items: apparelItems,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error;
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message);
  }
};
```

- [ ] **Step 2: Build to confirm everything resolves now that schema lives in `./type`.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 3: Commit the route migration.**

```bash
git add 'src/api/store/carts/[id]/line-items-custom/route.ts'
git commit -m "feat(div-99): line-items-custom branches by metadata type, dispatches to apparel or promo-print workflow"
```

- [ ] **Step 4: Prune the legacy `cartLineItemMetadataSchema` export from `src/api/store/carts/type.ts`.**

The legacy schema (preserved by Task 7 to keep the build green) now has zero callers. Remove it. Open `src/api/store/carts/type.ts` and delete this block:

```ts
// Legacy schema. Still exported because middleware (Task 8) and the route file
// (Task 9) currently import it. Removed in Task 9 once those callers switch.
export const cartLineItemMetadataSchema = z.object({
  group_id: z.string(),
  product_name: z.string().optional(),
  upload_ids: z.array(z.string()),
  selections: z.array(z.any()),
});
```

- [ ] **Step 5: Confirm no caller remains.**

```bash
git grep -n "cartLineItemMetadataSchema" -- 'src/' 'integration-tests/' || echo "PRUNED"
```

Expected output: `PRUNED`. If anything still references it, restore the block and report.

- [ ] **Step 6: Build — must succeed.**

```bash
yarn build
```

- [ ] **Step 7: Commit the cleanup.**

```bash
git add src/api/store/carts/type.ts
git commit -m "chore(div-99): remove legacy cartLineItemMetadataSchema (no remaining callers)"
```

---

## Task 10: Guard Upload Reads + Normalize CATALOG Proof Items in `custom-complete/route.ts` (Three Sites)

> **Confidence: High** — three-edit task.
> - Site 1 at line 320: `?? []` fallback (only unguarded `.map(...)` access).
> - Site 2 at line 311: short-circuit `listCustomOrderUploads({ id: [] })` (MikroORM `id: []` is undocumented per spec §7; mirrors the middleware short-circuit added in Task 8).
> - Site 3 at lines 107-119: **normalize every CATALOG proof item to qty 1, unit_price 0 unconditionally** (Imperator decision after Consul reflection — the existing `if (currentQuantity > 1)` guard contradicts the comment ("Update item quantity to 1 and unit price to 0") and the proof-to-catalog semantics. Apparel happened to satisfy `currentQuantity > 1` because `proof-to-catalog.spec.ts` posts qty 5; the storefront's non-apparel path posts qty 1 (`standardCartHelpers.ts:40`), so the price was silently never reset and the order record carried the helper-computed price for what should be a free proof).

**Files:**
- Modify: `src/api/store/carts/[id]/custom-complete/route.ts` — three sites: lines 107-119 (catalog proof normalization), 311 (short-circuit guard), 320 (`?? []` fallback).

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Apply the line 320 fallback edit.**

Old (line 320):

```ts
      const uploadIds = items[0]?.metadata?.upload_ids as string[];
```

New:

```ts
      const uploadIds = (items[0]?.metadata?.upload_ids ?? []) as string[];
```

- [ ] **Step 2: Apply the line 311 short-circuit guard.**

Old (lines 309-315 — the empty-array module call risk):

```ts
    // Fetch upload details for moving files
    const uploadsToMove = await customOrderModuleService.listCustomOrderUploads(
      {
        id: allUploadIds,
      },
    );
```

New:

```ts
    // Spec §7 invariant: listCustomOrderUploads with `id: []` is undocumented
    // MikroORM territory. Mirror the middleware short-circuit added in Task 8.
    const uploadsToMove = allUploadIds.length === 0
      ? []
      : await customOrderModuleService.listCustomOrderUploads({
          id: allUploadIds,
        });
```

- [ ] **Step 3: Apply the catalog proof normalization at lines 107-119.**

Old (lines 101-120 — the `for (const item of cart.items)` block inside `if (proofType === ProofType.CATALOG)`):

```ts
      for (const item of cart.items) {
        if (!item) {
          continue;
        }

        // Update item quantity to 1 and unit price to 0 for proof to catalog workflow
        const currentQuantity = item.quantity;
        if (currentQuantity > 1) {
          await updateLineItemInCartWorkflow(req.scope).run({
            input: {
              cart_id: id,
              item_id: item.id,
              update: {
                quantity: 1,
                unit_price: 0,
              },
            },
          });
        }
      }
```

New:

```ts
      for (const item of cart.items) {
        if (!item) {
          continue;
        }

        // Catalog proofs are zero-cost design reviews — every line item is
        // normalized to qty 1, unit_price 0 regardless of incoming values.
        // The pre-DIV-99 `if (currentQuantity > 1)` guard happened to work for
        // apparel (proof-to-catalog.spec.ts posts qty 5) but missed non-apparel
        // (standardCartHelpers.ts:40 posts qty 1), letting the helper-computed
        // price carry through. Normalize unconditionally.
        if (item.quantity !== 1 || (item.unit_price ?? 0) !== 0) {
          await updateLineItemInCartWorkflow(req.scope).run({
            input: {
              cart_id: id,
              item_id: item.id,
              update: {
                quantity: 1,
                unit_price: 0,
              },
            },
          });
        }
      }
```

The `if (item.quantity !== 1 || (item.unit_price ?? 0) !== 0)` predicate avoids dispatching the workflow when the line is already in the canonical proof shape (mostly a defensive optimization — the workflow is idempotent, but skipping the round-trip when there's nothing to do is cleaner).

- [ ] **Step 4: Build.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 5: Commit.**

```bash
git add 'src/api/store/carts/[id]/custom-complete/route.ts'
git commit -m "fix(div-99): custom-complete normalizes catalog proofs (qty 1, price 0) + guards uploadIds + short-circuits empty listCustomOrderUploads"
```

---

## Task 11: Branch Orders-List Quantity Aggregation by `product_type` (Soft Fallback With Audit Breadcrumb)

> **Confidence: High** — single call site at line 123. `ContainerRegistrationKeys.LOGGER` resolution pattern verified at `src/scripts/seed-apparel.ts:325`, `seed-setup.ts:18`. `ContainerRegistrationKeys` is already imported at the top of the file. Logger is resolved ONCE at the top of the handler (alongside the existing `query` resolution at line 16) and captured by closure into the per-order/per-item loops.

**Files:**
- Modify: `src/api/custom-order/orders/route.ts` — add a logger resolve near line 17 (after `query`), then replace the body of the `order.items?.forEach((item: any) => {...})` callback at lines 98-125. The `subOrder.quantity += item.quantity || 0;` line (123) is the target.

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Hoist the logger resolution to the top of the GET handler.**

Old (lines 15-17):

```ts
    const company = req.context.company;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const employeeId = req.context.employee.id;
```

New:

```ts
    const company = req.context.company;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const employeeId = req.context.employee.id;
```

- [ ] **Step 2: Replace the forEach body. The `logger` is captured from the outer scope — do NOT re-resolve inside the loop.**

Old (lines 97-125, the `forEach` over `order.items`):

```ts
        let skip = false;
        order.items?.forEach((item: any) => {
          const customOrder: CustomOrder = item.custom_order;
          if (!customOrder?.id) {
            skip = true;
            return;
          }

          if (customOrder.proof_type !== ProofType.ORDER) {
            skip = true;
            return;
          }

          const customOrderId = customOrder.id;
          if (!subOrdersMap.has(customOrderId)) {
            subOrdersMap.set(customOrderId, {
              customOrderId,
              productName: item.metadata?.product_name || "",
              quantity: 0,
              orderStatus: item.custom_order.order_status,
              jobStatus: item.custom_order.job_status,
              subTotal: 0,
            });
          }

          const subOrder = subOrdersMap.get(customOrderId);
          subOrder.quantity += item.quantity || 0;
          subOrder.subTotal += item.total || 0;
        });
```

New:

```ts
        let skip = false;
        order.items?.forEach((item: any) => {
          const customOrder: CustomOrder = item.custom_order;
          if (!customOrder?.id) {
            skip = true;
            return;
          }

          if (customOrder.proof_type !== ProofType.ORDER) {
            skip = true;
            return;
          }

          const customOrderId = customOrder.id;
          if (!subOrdersMap.has(customOrderId)) {
            subOrdersMap.set(customOrderId, {
              customOrderId,
              productName: item.metadata?.product_name || "",
              quantity: 0,
              orderStatus: item.custom_order.order_status,
              jobStatus: item.custom_order.job_status,
              subTotal: 0,
            });
          }

          const subOrder = subOrdersMap.get(customOrderId);

          // Spec §10 — non-apparel items always post quantity: 1; the real count
          // is encoded in metadata.options.quantity. Fall back softly on read so
          // the orders list never 500s on malformed data, but log so silent
          // miscounts are observable.
          const meta = item.metadata as Record<string, unknown> | null;
          const productType = (meta?.product_type as string | undefined) ?? "apparel";

          let itemQty: number;
          if (productType !== "apparel") {
            const optQty = Number(
              (meta?.options as Record<string, string> | undefined)?.quantity,
            );
            if (Number.isFinite(optQty) && optQty > 0) {
              itemQty = optQty;
            } else {
              logger.warn(
                `[orders-list] non-apparel quantity fallback: order=${order.id} ` +
                  `line_item=${item.id} options.quantity=${JSON.stringify(
                    meta?.options ?? null,
                  )} falling back to line_item.quantity=${item.quantity ?? 0}`,
              );
              itemQty = item.quantity ?? 0;
            }
          } else {
            itemQty = item.quantity ?? 0;
          }

          subOrder.quantity += itemQty;
          subOrder.subTotal += item.total || 0;
        });
```

- [ ] **Step 3: Build.**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 4: Commit.**

```bash
git add src/api/custom-order/orders/route.ts
git commit -m "fix(div-99): orders-list quantity branches by product_type with logger.warn audit on fallback"
```

---

## Task 12: Integration Test Spec for the Non-Apparel Cart Flow

> **Confidence: High** — scaffold mirrors `proof-to-catalog.spec.ts` setup (companies, auth, apparel product, upload, cart). Adds promo-print product seeding via the existing `seed-promo-print` script invoked through `medusa exec`. Each test case from spec §13 maps to an `it()` here.

**Files:**
- Create: `integration-tests/http/non-apparel-cart.spec.ts`

**Required Medusa skill:** `building-with-medusa` (use namespaced form like `medusa-dev:building-with-medusa` only if that is how your environment registers it)

- [ ] **Step 1: Stand up the test scaffold and write all 15 scenarios.**

Write the file in full. Note: this is a single TDD task (write the tests + run; the impl from Tasks 1-11 should already make them pass). If a test fails, drill down — do not weaken the test. The Praetor will catch weakened assertions.

```ts
// integration-tests/http/non-apparel-cart.spec.ts
import FormData from "form-data";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { CUSTOM_ORDER_MODULE } from "../../src/modules/custom-order";
import { ProofType } from "../../src/modules/custom-order/type";
import seedDemoData from "../../src/scripts/seed-setup";
import { createAuthUser } from "../utils/create-admin";

jest.setTimeout(120 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("Non-apparel cart contract (DIV-99)", () => {
      let superadminToken = "";
      let publishableApiKey = "";
      let cartId = "";
      let promoProductId = "";
      let promoVariantIds: Record<string, string> = {}; // keyed by paper_type+quantity
      let testRegionId = "";

      beforeEach(async () => {
        const container = getContainer();
        superadminToken = await createAuthUser({ container, api });
        const seedResult = await seedDemoData({ container, args: [] });
        publishableApiKey = seedResult.publishableApiKey.token;
        testRegionId = seedResult.region.id;

        // Build a minimal promo-print product with the metadata shape the helper expects.
        // We use the admin product API rather than the importer to keep the test hermetic.
        // Note: seedResult.shippingProfile is the apparel profile; we accept this cosmetic
        // mismatch because the cart-add path does not branch on shipping profile, and
        // extending seed-setup to expose both profiles is out of scope for DIV-99.
        const productResp = await api.post(
          "/admin/products",
          {
            title: "Test Business Cards",
            handle: "test-business-cards",
            status: "published",
            shipping_profile_id: seedResult.shippingProfile.id,
            sales_channels: [{ id: seedResult.salesChannel.id }],
            options: [
              { title: "Paper Type", values: ["matte", "glossy"] },
              // The "999" tier is intentionally seeded with a variant but
              // NOT seeded with a multipliers["finish"]["999"] row — Q-B test
              // (test 12) targets the gap.
              { title: "Quantity", values: ["500", "1000", "999"] },
            ],
            variants: [
              {
                title: "matte 500",
                sku: "BC-matte-500",
                manage_inventory: false,
                options: { "Paper Type": "matte", Quantity: "500" },
                prices: [{ amount: 50, currency_code: "usd" }],
              },
              {
                title: "matte 1000",
                sku: "BC-matte-1000",
                manage_inventory: false,
                options: { "Paper Type": "matte", Quantity: "1000" },
                prices: [{ amount: 80, currency_code: "usd" }],
              },
              {
                title: "matte 999",
                sku: "BC-matte-999",
                manage_inventory: false,
                options: { "Paper Type": "matte", Quantity: "999" },
                prices: [{ amount: 100, currency_code: "usd" }],
              },
            ],
            metadata: {
              base_option_keys: ["paper_type", "quantity"],
              multiplier_keys: ["finish"],
              options_labels: {
                paper_type: "Paper Type",
                quantity: "Quantity",
                finish: "Finish",
              },
              multipliers: {
                finish: {
                  "500": { matte: 1, glossy: 1.2 },
                  "1000": { matte: 1, glossy: 1.15 },
                  // No "999" row.
                },
              },
            },
          },
          { headers: { Authorization: `Bearer ${superadminToken}` } },
        );

        promoProductId = productResp.data.product.id;
        for (const v of productResp.data.product.variants) {
          const paperType = (v.options ?? []).find(
            (o: any) => o.option?.title === "Paper Type",
          )?.value;
          const qty = (v.options ?? []).find(
            (o: any) => o.option?.title === "Quantity",
          )?.value;
          promoVariantIds[`${paperType}_${qty}`] = v.id;
        }

        // Create a company so the cart can be tied to a company actor.
        const createCompanyResponse = await api.post(
          "/company",
          {
            name: "Test Company",
            handle: "test-company",
            address_1: "123 Test St",
            city: "Test City",
            province: "CA",
            postal_code: "12345",
            logo: "",
            admin: [
              {
                email: "admin@test-company.com",
                password: "Test123!",
                first_name: "Jane",
                last_name: "Doe",
              },
            ],
          },
          { headers: { Authorization: `Bearer ${superadminToken}` } },
        );

        const loginResponse = await api.post(
          `/auth/${createCompanyResponse.data.company.handle}/emailpass`,
          { email: "admin@test-company.com", password: "Test123!" },
        );
        const companyToken = loginResponse.data.token;
        api.interceptors.request.use((config) => {
          if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${companyToken}`;
          }
          if (!config.headers["x-publishable-api-key"]) {
            config.headers["x-publishable-api-key"] = publishableApiKey;
          }
          return config;
        });

        const createCartResponse = await api.post("/store/carts", {
          currency_code: "usd",
          region_id: testRegionId,
          email: "admin@test-company.com",
        });
        cartId = createCartResponse.data.cart.id;
      });

      // Test 1 — happy path
      it("accepts a non-apparel item, prices it, stamps production_option_type", async () => {
        const variantId = promoVariantIds["matte_500"];
        const resp = await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: variantId,
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g1",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "glossy",
                },
                options_labels: { finish: "Finish" },
              },
            },
          ],
        });
        expect(resp.status).toBe(200);
        const item = resp.data[0]?.items?.[0] ?? resp.data?.items?.[0];
        expect(item).toBeDefined();
        expect(item.unit_price).toBe(60); // 50 × 1.2
        expect(item.metadata.product_type).toBe("print");
        expect(item.metadata.production_option_type).toBe("print");
      });

      // Test 2 — stale variant
      it("rejects a request whose variant_id does not match the resolved options", async () => {
        const wrongVariant = promoVariantIds["matte_1000"]; // we'll send paper_type matte + quantity 500 → resolves to matte_500
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: wrongVariant,
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: [],
                  options: {
                    paper_type: "matte",
                    quantity: "500",
                    finish: "matte",
                  },
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      // Test 3 — missing base option
      it("rejects when a base option key is missing", async () => {
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: promoVariantIds["matte_500"],
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: [],
                  options: { quantity: "500", finish: "matte" }, // paper_type missing
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      // Test 4 — invalid quantity (zero, abc, missing)
      it.each([{ quantity: "0" }, { quantity: "abc" }, {}])(
        "rejects when options.quantity is invalid (%p)",
        async (badOpts) => {
          await expect(
            api.post(`/store/carts/${cartId}/line-items-custom`, {
              items: [
                {
                  variant_id: promoVariantIds["matte_500"],
                  quantity: 1,
                  metadata: {
                    product_type: "print",
                    group_id: "g1",
                    upload_ids: [],
                    options: {
                      paper_type: "matte",
                      finish: "matte",
                      ...badOpts,
                    } as Record<string, string>,
                  },
                },
              ],
            }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        },
      );

      // Test 5 — non-existent upload_id
      it("rejects when upload_id does not exist", async () => {
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: promoVariantIds["matte_500"],
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: ["nonexistent_upload_id"],
                  options: {
                    paper_type: "matte",
                    quantity: "500",
                    finish: "matte",
                  },
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 404 } });
      });

      // Test 6 — empty upload_ids accepted
      it("accepts empty upload_ids array", async () => {
        const resp = await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g1",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "matte",
                },
              },
            },
          ],
        });
        expect(resp.status).toBe(200);
      });

      // Test 7 — mixed apparel + non-apparel
      it("rejects mixed apparel + non-apparel in a single request", async () => {
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: promoVariantIds["matte_500"],
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: [],
                  options: {
                    paper_type: "matte",
                    quantity: "500",
                    finish: "matte",
                  },
                },
              },
              {
                // Apparel-shaped metadata (no product_type, has selections)
                variant_id: promoVariantIds["matte_500"],
                quantity: 1,
                metadata: {
                  selections: [
                    { key: "decoration", value: "screen_print" },
                    { key: "artwork", value: [] },
                  ],
                  group_id: "g2",
                  upload_ids: [],
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      // Test 8 — apparel regression is covered by proof-to-catalog.spec.ts (no duplication here).

      // Test 9 — empty / whitespace product_type
      it.each(["", "   "])(
        "rejects when product_type is %p",
        async (badType) => {
          await expect(
            api.post(`/store/carts/${cartId}/line-items-custom`, {
              items: [
                {
                  variant_id: promoVariantIds["matte_500"],
                  quantity: 1,
                  metadata: {
                    product_type: badType,
                    group_id: "g1",
                    upload_ids: [],
                    options: {
                      paper_type: "matte",
                      quantity: "500",
                      finish: "matte",
                    },
                  },
                },
              ],
            }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        },
      );

      // Test 10 — discriminator picks correct schema (rejects stray apparel `selections` on non-apparel branch)
      it("rejects unknown `selections` key on non-apparel branch (strict)", async () => {
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: promoVariantIds["matte_500"],
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: [],
                  options: {
                    paper_type: "matte",
                    quantity: "500",
                    finish: "matte",
                  },
                  selections: [{ key: "decoration", value: "screen_print" }],
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      // Test 11 — req.validatedBody, not req.body. Asserted indirectly by tests 1-10 succeeding;
      // a pure `req.body` read would bypass the discriminator-parsed shape and break test 10.

      // Test 12 — multiplier missing-row HARD fail (Q-B). Targets variant
      // `matte_999` (which DOES exist in the fixture) so the variant matches,
      // forcing the helper to reach the multiplier-row lookup which fails
      // because multipliers["finish"]["999"] is intentionally absent.
      it("rejects when no multiplier row exists for the submitted quantity tier", async () => {
        await expect(
          api.post(`/store/carts/${cartId}/line-items-custom`, {
            items: [
              {
                variant_id: promoVariantIds["matte_999"],
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g1",
                  upload_ids: [],
                  options: {
                    paper_type: "matte",
                    quantity: "999", // matte_999 variant exists; multiplier row does not
                    finish: "glossy",
                  },
                },
              },
            ],
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      // Test 13 — empty upload_ids middleware short-circuit (no module call)
      it("does not call listCustomOrderUploads when upload_ids is empty", async () => {
        const container = getContainer();
        const customOrderModuleService = container.resolve(CUSTOM_ORDER_MODULE);
        const spy = jest.spyOn(customOrderModuleService, "listCustomOrderUploads");

        await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g1",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "matte",
                },
              },
            },
          ],
        });

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      });

      // Helper used by tests 14 & 15. custom-complete with proof_type: ORDER does
      // NOT auto-create the payment collection or session (only the catalog branch
      // does — see custom-complete/route.ts:131-156). completeCartWorkflow's
      // validateCartPaymentsStep requires a session. Set one up explicitly.
      const setupPaymentSession = async (theCartId: string) => {
        const pcResp = await api.post("/store/payment-collections", {
          cart_id: theCartId,
        });
        const pcId = pcResp.data.payment_collection.id;
        await api.post(`/store/payment-collections/${pcId}/payment-sessions`, {
          provider_id: "pp_system_default",
        });
      };

      // Test 14 — orders-list aggregation reads metadata.options.quantity
      it("orders list aggregates non-apparel quantity from metadata.options.quantity", async () => {
        // 1. Add the line item
        await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g_oa",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "matte",
                },
              },
            },
          ],
        });

        // 2. Set up payment session (proof_type: ORDER does not auto-create one).
        await setupPaymentSession(cartId);

        // 3. Complete the cart as an order proof
        await api.post(`/store/carts/${cartId}/custom-complete`, {
          proof_type: ProofType.ORDER,
        });

        // 4. Fetch the orders list
        const ordersResp = await api.get("/custom-order/orders");
        const orders = ordersResp.data.orders;
        expect(orders.length).toBe(1);
        const subOrder = orders[0].subOrders[0];
        expect(subOrder.quantity).toBe(500);
      });

      // Test 15 — orders-list fallback + audit breadcrumb
      it("orders list falls back to line_item.quantity and logs when options.quantity is malformed", async () => {
        const container = getContainer();
        const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
        const warnSpy = jest.spyOn(logger, "warn");

        // 1. Add a normal item
        await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g_fb",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "matte",
                },
              },
            },
          ],
        });

        // 2. Set up payment session, then complete.
        await setupPaymentSession(cartId);
        const completeResp = await api.post(
          `/store/carts/${cartId}/custom-complete`,
          { proof_type: ProofType.ORDER },
        );
        const completedOrderId = completeResp.data.order.id;

        // 3. Corrupt the persisted line-item metadata to simulate stale data.
        // Filter listOrders by id explicitly — fetching the first of all orders
        // is brittle if a future test seeds extra orders.
        const orderModuleService = container.resolve(Modules.ORDER);
        const [order] = await orderModuleService.listOrders(
          { id: [completedOrderId] },
          { relations: ["items"] },
        );
        const item = order.items?.[0];
        if (!item) throw new Error("expected one line item");
        await orderModuleService.updateOrderLineItems(item.id, {
          metadata: {
            ...(item.metadata as Record<string, unknown>),
            options: {
              ...((item.metadata as Record<string, any>)?.options ?? {}),
              quantity: "xyz",
            },
          },
        });

        // 4. Hit the orders-list endpoint and assert soft fallback + audit
        const ordersResp = await api.get("/custom-order/orders");
        expect(ordersResp.status).toBe(200);
        const subOrder = ordersResp.data.orders[0]?.subOrders[0];
        expect(subOrder.quantity).toBe(1); // line_item.quantity fallback
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("[orders-list] non-apparel quantity fallback"),
        );
        warnSpy.mockRestore();
      });

      // Test 16 — non-apparel CATALOG proof flow (the storefront's
      // `standardProofToMyProduct` flow → /line-items-custom + /custom-complete
      // with proof_type: catalog). Verifies the proof blast radius identified
      // by Imperator: metadata fields survive the catalog branch's
      // updateLineItemInCart (qty→1, unit_price→0).
      it("non-apparel CATALOG proof flow preserves metadata end-to-end", async () => {
        const container = getContainer();

        await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              metadata: {
                product_type: "print",
                group_id: "g_proof",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "matte",
                },
                options_labels: { finish: "Finish" },
              },
            },
          ],
        });

        // CATALOG branch creates payment collection + session itself
        // (custom-complete/route.ts:131-156). No setupPaymentSession needed.
        const completeResp = await api.post(
          `/store/carts/${cartId}/custom-complete`,
          { proof_type: ProofType.CATALOG },
        );
        const completedOrderId = completeResp.data.order.id;

        const orderModuleService = container.resolve(Modules.ORDER);
        const [order] = await orderModuleService.listOrders(
          { id: [completedOrderId] },
          { relations: ["items"] },
        );
        const item = order.items?.[0];
        if (!item) throw new Error("expected one line item");
        expect(item.quantity).toBe(1); // catalog branch forces qty 1
        expect(item.unit_price).toBe(0); // catalog branch forces unit_price 0
        const meta = item.metadata as Record<string, any>;
        expect(meta.product_type).toBe("print");
        expect(meta.production_option_type).toBe("print");
        expect(meta.group_id).toBe("g_proof");
        expect(meta.options).toEqual({
          paper_type: "matte",
          quantity: "500",
          finish: "matte",
        });
        expect(meta.options_labels).toEqual({ finish: "Finish" });
      });

      // Test 17 — client-supplied unit_price is IGNORED (server overwrites).
      // Spec §17 originally claimed "rejected" but the truth is "ignored": the
      // route's mapping does not pass through client unit_price; the helper
      // computes the authoritative price.
      it("ignores client-supplied unit_price; cart line uses server-computed price", async () => {
        const resp = await api.post(`/store/carts/${cartId}/line-items-custom`, {
          items: [
            {
              variant_id: promoVariantIds["matte_500"],
              quantity: 1,
              unit_price: 0.01, // adversarial value
              metadata: {
                product_type: "print",
                group_id: "g_price",
                upload_ids: [],
                options: {
                  paper_type: "matte",
                  quantity: "500",
                  finish: "glossy",
                },
              },
            },
          ],
        });
        expect(resp.status).toBe(200);
        const item = resp.data[0]?.items?.[0] ?? resp.data?.items?.[0];
        // Server-computed: 50 × 1.2 = 60. Definitely not 0.01.
        expect(item.unit_price).toBe(60);
      });
    });
  },
});
```

- [ ] **Step 2: Run the integration suite.**

```bash
yarn test:integration:http --testPathPattern=non-apparel-cart
```

Expected: all 17 `it()` / `it.each` cases PASS. If any fail, drill into the specific case — do not change the assertion to satisfy the test. The Praetor catches weakened assertions.

- [ ] **Step 3: Run the apparel regression gate.**

```bash
yarn test:integration:http --testPathPattern=proof-to-catalog
```

Expected: PASS unchanged.

**Note:** `proof-to-order.spec.ts` is NOT a clean regression gate for this work. That spec posts to `/store/carts/:id/line-items` (lines 179, 190) — a route the backend middleware actively blocks (middleware.ts:142-153, `MedusaError.Types.NOT_ALLOWED`). Whatever its current status on the baseline, it does not exercise our cart-add path and its result is independent of DIV-99. Do NOT include it in the regression assertion. (If the baseline already has it failing, that is a separate fix outside DIV-99 scope.)

- [ ] **Step 4: Commit.**

```bash
git add integration-tests/http/non-apparel-cart.spec.ts
git commit -m "test(div-99): integration suite for non-apparel cart contract (17 scenarios incl. CATALOG proof + price authority)"
```

---

## Task 13: DIV-94 / DIV-95 Closure Smoke Trace

> **Confidence: High** — spec §14 explicitly assigns this artifact to the implementation agent. The trace is recorded in the case directory so the Imperator can attach it to Linear before closing DIV-94 and DIV-95.

**Files:**
- Create: `$CONSILIUM_DOCS/cases/2026-04-24-div-99-non-apparel-cart-contract/evidence/smoke-trace.md`

**Environment prerequisites:** the smoke flow runs against a live dev server, which means `STRIPE_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, and `COOKIE_SECRET` must be present (per `CLAUDE.md`). `DO_BUCKET_*` and `RESEND_API_KEY` are optional — `custom-complete/route.ts:338` calls `moveUploadsToCustomOrder`, but the smoke uses `upload_ids: []`, so the S3 path is never exercised. If any required key is missing, halt the trace and report which one — do NOT fabricate transcripts.

- [ ] **Step 1: Confirm `.env` carries the four required keys and start the dev server.**

Medusa loads env from `.env` at runtime via dotenv; do not check the exported shell environment (those keys won't appear in `env` unless someone manually sourced them). Check the file directly:

```bash
[ -f .env ] || { echo ".env missing — halt"; exit 1; }
git grep -h -c -E '^(STRIPE_API_KEY|DATABASE_URL|JWT_SECRET|COOKIE_SECRET)=' --no-index -- .env || true
```

Expected output from the second command: `4`. If less, identify the missing key and add it before continuing.

```bash
yarn dev
```

In a second shell, run the four request/response captures:

1. `POST /store/carts/:id/line-items-custom` — non-apparel happy path (already covered by integration test 1; capture the live response).
2. `GET /company/cart` — confirm `product_type`, `options`, `options_labels`, `group_id`, `production_option_type` all present on `items[].metadata`.
3. `GET /custom-order/orders/:id` — confirm same metadata fields preserved on order line items.
4. `GET /custom-order/orders` — confirm `subOrders[0].quantity === Number(metadata.options.quantity)` (e.g., 500), not 1.

- [ ] **Step 2: Write the evidence file with cURL transcripts and response excerpts.**

```bash
mkdir -p $CONSILIUM_DOCS/cases/2026-04-24-div-99-non-apparel-cart-contract/evidence
```

Then write `smoke-trace.md` with this structure:

```markdown
# DIV-99 Smoke Trace — DIV-94 / DIV-95 Closure Evidence

Date: <ISO date>
Branch: feature/div-99-non-apparel-cart-contract
Commit: <git rev-parse HEAD>

## DIV-94 closure proof — canonical contract round-trip

### 1. POST /store/carts/:id/line-items-custom
Request:
```
<cURL>
```
Response (200):
```
<JSON snippet showing items[0].unit_price + items[0].metadata>
```

### 2. GET /company/cart
Response shows:
- items[0].metadata.product_type: "print"
- items[0].metadata.options: { paper_type, quantity, finish }
- items[0].metadata.options_labels (if posted)
- items[0].metadata.group_id
- items[0].metadata.production_option_type: "print"   ← bridge stamp present

### 3. GET /custom-order/orders/:id
Response shows the same five metadata fields persisted on the order's line items.

## DIV-95 closure proof — quantity semantics

### 4. GET /custom-order/orders
Response shows:
- orders[0].subOrders[0].quantity: 500   ← NOT 1
- aggregated from metadata.options.quantity per spec §10

## Apparel regression proof
- yarn test:integration:http --testPathPattern=proof-to-catalog → PASS
- (proof-to-order is NOT a regression gate — see Task 12 Step 3 note: it posts to the BLOCKED `/line-items` route at middleware.ts:142-153 and is independent of DIV-99.)
```

- [ ] **Step 3: Commit the evidence file.**

```bash
cd $CONSILIUM_DOCS
git add cases/2026-04-24-div-99-non-apparel-cart-contract/evidence/smoke-trace.md
git commit -m "evidence(div-99): smoke trace for DIV-94/95 closure"
```

The Imperator uses this artifact to close DIV-94 and DIV-95 in Linear.

---

## Verification Stance

After all 13 tasks land, the Legatus runs the backend test gauntlet from the worktree root:

```bash
yarn build
yarn test:unit
yarn test:integration:http --testPathPattern='non-apparel-cart|proof-to-catalog'
```

All three must succeed before reporting the campaign complete.

The integration test pattern is narrowed because `proof-to-order.spec.ts` posts to the BLOCKED `/store/carts/:id/line-items` route (lines 179, 190) — the backend middleware at middleware.ts:142-153 returns `NOT_ALLOWED`. Whatever its current pass/fail status is on the baseline, it does not exercise the cart-add path DIV-99 changes and is not a clean regression signal for this work.

## Confidence Map (Plan-Level)

|Task|Confidence|Why|
|-|-|-|
|1 — prune dead scaffold|High|`git grep` confirms no other reference; underscore-prefixed route already excluded by Medusa.|
|2 — non-apparel-type.ts|High|Schema verbatim from spec §3 + §4; mirrors apparel-type.ts conventions.|
|3 — pure helper TDD|High|Mechanical extraction; Q-B fix-loud is a localized change at the multiplier loop. **Revised:** "no variant matches" now throws `INVALID_DATA` (400) per spec §7, not `NOT_FOUND` (404) — Provocator GAP A fix.|
|4 — refactor pricing route|High|Public response field stays `price`; only the compute body is delegated to the helper.|
|5 — pricing step|High|**Revised:** step now reads `region_id` from cart input instead of hardcoding "United States" — Praetor GAP fix per spec §5 mandate. Two-query pattern (variant headers → product fetch) replaces unverified `filters: { variants: { id: ... } }` shape — Praetor CONCERN fix.|
|6 — cart-add workflow|High|**Revised:** `transform` now passes `region_id` from cart into step input alongside `currency_code`.|
|7 — discriminator schema|High|**Revised:** legacy `cartLineItemMetadataSchema` is RETAINED until Task 9 prune (build-green commit boundary). **Strengthened Option B**: cart-local `cartApparelMetadataSchema = ApparelMetadataSchema.passthrough()` preserves existing apparel extras (product_title, brand_name, style_name, color); raw-payload non-apparel-shape cross-check rejects payloads with `options`/`options_labels` but no valid `product_type`. Direct unit tests pin all three branches.|
|8 — middleware update|High|Reads `req.validatedBody` (Medusa convention); empty-array short-circuit per spec §7. Build remains green at every commit.|
|9 — route handler|High|Apparel branch preserved byte-for-byte (passthrough on the cart-local schema means existing apparel extras now flow through `req.validatedBody` instead of being silently stripped). **Adds final pruning step** to remove the legacy schema export from `type.ts`.|
|10 — custom-complete guards + catalog normalization|High|**Revised twice:** THREE sites — line 320 `?? []` fallback, line 311 empty-array short-circuit (Praetor GAP), AND lines 107-119 unconditional CATALOG-proof normalization to qty 1 / unit_price 0 (Imperator decision after Consul reflection caught the legacy `if (currentQuantity > 1)` guard contradicted the inline comment and broke for non-apparel single-item proofs).|
|11 — orders-list quantity|High|**Revised:** logger resolved ONCE at the top of the GET handler (not per-order inside the map callback) — Praetor CONCERN fix.|
|12 — integration tests|High|**Revised:** 17 cases. Tests 14/15 set up payment session before custom-complete; test 15 filters `listOrders` by id; **test 16 covers the non-apparel CATALOG proof flow** (storefront blast-radius gap); **test 17 verifies client `unit_price` is ignored, server overwrites**; Q-B test 12 now uses a `matte_999` variant so multiplier-row absence (not variant-match failure) is what trips the throw. Shipping profile mismatch documented inline. proof-to-order excluded from regression gate (BLOCKED route).|
|13 — closure smoke trace|High|**Revised:** env-var prerequisites (`STRIPE_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`) explicitly listed; soldier halts the trace if any required var is unset rather than fabricating transcripts — Provocator CONCERN fix.|

No Medium or Low confidence tasks. All findings from both verification rounds resolved.

## Resolutions of the Two Imperator-Driven Issues

### 1. Apparel-strip discriminator asymmetry — Option B strengthened

The Imperator decided **Option B, strengthened**: cart-local apparel passthrough (so existing apparel extras like `product_title`, `brand_name`, `style_name`, `color` are NOT silently stripped when the route migrates to `req.validatedBody`) PLUS a raw-payload cross-check that rejects non-apparel-shape signals (`options` / `options_labels`) when the apparel branch is selected.

This is sharper than my original Option B — my proposal would have used `.strict()` on apparel and broken legitimate apparel proof flows that today rely on extra fields flowing through the existing route's raw `req.body` read. The Imperator caught the regression I would have introduced by switching to `req.validatedBody` against a strip-mode schema.

Cross-repo verified during the Imperator's review:
- `divinipress-store/src/app/_api/catalog/standardCartHelpers.ts:34-35` posts to `/line-items-custom`
- `divinipress-store/src/app/_api/catalog/standardProofToMyProduct.ts:20-21` calls that helper then `completeAsProof` (proof_type catalog) — **the storefront's standard-product proof submission DOES route through this contract.**
- spec §15's claim "Proof submission does NOT currently route through `/store/carts/:id/line-items-custom`" was incorrect; only the BACKEND was scouted, not the storefront. **Test 16 closes that blast-radius gap** by exercising the catalog proof path with non-apparel metadata.

### 2. CATALOG proof normalization — Option B (unconditional reset)

While walk-the-test-ing Test 16, the Consul caught a residual gap nobody had flagged: `custom-complete/route.ts:108`'s `if (currentQuantity > 1)` guard meant the qty-1, price-0 normalization NEVER fired for non-apparel catalog proofs (storefront posts qty 1 by design at `standardCartHelpers.ts:40`). Apparel happened to pass because `proof-to-catalog.spec.ts` posts qty 5; non-apparel never tripped the condition, so the helper-computed price (e.g., $60 for matte 500 glossy) carried through into the order record.

Not a real money-loss bug at runtime — `pp_system_default` auto-authorizes without external charging — but the order record carried a $60 "captured" total for what is semantically a free design review. The condition contradicted the comment ("Update item quantity to 1 and unit price to 0"), the spec's catalog-proof semantics, and the storefront's expectations.

The Imperator decided **Option B (unconditional normalization)**: Task 10 Step 3 removes the `currentQuantity > 1` guard. CATALOG proofs always normalize to qty 1, price 0. Apparel behavior unchanged (multi-qty was already triggering); non-apparel now correctly produces $0 proof records. A small idempotency optimization (`if (item.quantity !== 1 || (item.unit_price ?? 0) !== 0)`) skips the workflow round-trip when the line is already canonical.

## Glossary

|Symbol|Defined in|
|-|-|
|`ApparelMetadataSchema`|`src/modules/custom-order/apparel-type.ts` (existing)|
|`NonApparelMetadataSchema`|`src/modules/custom-order/non-apparel-type.ts` (Task 2)|
|`isNonApparelProductType`|`src/modules/custom-order/non-apparel-type.ts` (Task 2)|
|`lineItemMetadataSchema`|`src/api/store/carts/type.ts` (Task 7)|
|`lineItemsCustomSchema`|`src/api/store/carts/type.ts` (Task 7)|
|`isNonApparelMetadata`|`src/api/store/carts/type.ts` (Task 7)|
|`calculatePromoPrintPrice`|`src/workflows/pricing/utils/calculate-promo-print-price.ts` (Task 3)|
|`calculatePromoPrintPricesStep`|`src/workflows/pricing/steps/calculate-promo-print-prices.ts` (Task 5)|
|`addPromoPrintPriceToCartWorkflow`|`src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts` (Task 6)|

Symbol consistency: every reference above traces to a single defining task. No `clearLayers` / `clearFullLayers` drift.
