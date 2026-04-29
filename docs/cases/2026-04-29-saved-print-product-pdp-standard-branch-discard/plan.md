# Saved Standard Product PDP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make saved non-apparel products render, price, and add to cart from `/products/[handle]` without regressing saved apparel products.

**Architecture:** Work on the existing DIV-74 storefront branch. Preserve the shared fetch discriminator, reuse the existing standard product form/pricing/cart helpers with `files: []`, keep catalog proof actions out of the saved PDP, and send `proof_type: "order"` in redirect completion.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React Query, Zustand, existing `storeApi`/Medusa helpers, shadcn Base UI components, repo-local Yarn 4.3.1.

---

## Ground Rules

- Repository: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering`.
- Work on the current branch: `feature/div-74-non-apparel-proof-detail-rendering`.
- Do not create a new fix branch.
- Do not base on `integration/non-apparel-products`.
- Do not merge into `develop`.
- Do not push or open a PR.
- Do not make backend changes unless the spec is proven wrong.
- Leave unrelated untracked files alone, especially `AGENTS.md` and `.serena/`.
- Do not add a new test runner or Storybook story for this fix.
- Do not make per-task commits. Leave one final reviewed diff unless the Imperator asks for a commit.
- Required storefront skill for implementation: `medusa-dev:building-storefronts` (Codex equivalent: `building-storefronts`).

## Command Reality

The shell for this worktree has bundled `node` on PATH but not `npm`, `npx`, `yarn`, or `corepack`. Use the repo-local Yarn binary:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
node .yarn/releases/yarn-4.3.1.cjs dev
```

Baseline `node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit` was verified passing before this plan revision.

## File Responsibility Map

- `src/app/_interfaces/standardProduct.interface.ts` exposes optional required-key metadata already present on imported non-apparel products.
- `src/app/_api/catalog/getProductByHandle.ts` carries that metadata through `adaptToStandardProduct`.
- `src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts` stops discarding `{ type: "standard" }`.
- `src/app/(authenticated)/products/[handle]/page.tsx` reuses existing standard option, pricing, and add-to-cart helpers for the saved standard branch.
- `src/app/api/capture-payment/[cartId]/route.ts` sends `proof_type: "order"` on redirect completion.

---

### Task 1: Confirm Current Branch And Baseline
> **Confidence: High** — implements [spec §Branching And Repository Constraints](../spec.md#branching-and-repository-constraints); the Imperator corrected the branch choice to stay on the current DIV-74 branch.

**Centurio prompt:** Invoke `Skill(skill: "medusa-dev:building-storefronts")` before editing storefront code.

**Files:**
- Modify: none
- Test: current branch and static baseline

- [ ] **Step 1: Confirm branch and dirty state**

Run:

```bash
git status --short --branch
git branch --show-current
```

Expected:
- Current branch is `feature/div-74-non-apparel-proof-detail-rendering`.
- `AGENTS.md` and `.serena/` may be untracked and must remain untouched.

- [ ] **Step 2: Confirm static baseline**

Run:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
git diff --check
```

Expected: both pass before code changes. If baseline fails before edits, halt and report the output.

---

### Task 2: Preserve Standard Product Metadata And Fetch Result
> **Confidence: High** — implements [spec §Product Fetch Contract](../spec.md#product-fetch-contract) and [spec §Saved Standard Cart Contract](../spec.md#saved-standard-cart-contract); Serena verified `getProductByHandle` already returns `{ type: "standard" }`, while `useSavedProduct` currently keeps only `data.type === "apparel"`.

**Centurio prompt:** Invoke `Skill(skill: "medusa-dev:building-storefronts")`.

**Files:**
- Modify: `src/app/_interfaces/standardProduct.interface.ts`
- Modify: `src/app/_api/catalog/getProductByHandle.ts`
- Modify: `src/app/(authenticated)/catalog/[category]/[productHandle]/_hooks/useSavedProduct.ts`
- Test: `node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit`

- [ ] **Step 1: Add optional required-key metadata to the standard product type**

In `StandardProductMetadata`, add:

```typescript
  base_option_keys?: string[];
  multiplier_keys?: string[];
```

Place them next to `options_values`.

- [ ] **Step 2: Preserve the metadata in `adaptToStandardProduct`**

In the returned `metadata` object, add:

```typescript
      base_option_keys: metadata?.base_option_keys as string[] | undefined,
      multiplier_keys: metadata?.multiplier_keys as string[] | undefined,
```

- [ ] **Step 3: Keep the standard branch in `useSavedProduct`**

Add this import:

```typescript
import { generateImageUrl } from "@utils/image";
```

In `useSavedProduct`, keep apparel as `product`, add `standardProduct`, and use whichever one exists for shared display fields:

```typescript
  const product = data?.type === "apparel" ? data.product : undefined;
  const standardProduct = data?.type === "standard" ? data.product : undefined;
  const displayProduct = product ?? standardProduct;
```

Update the company product/title lookup:

```typescript
  const companyProduct = (myProducts ?? []).find(
    (p) => p.id === displayProduct?.id
  );
  const productTitle = companyProduct?.display_name ?? displayProduct?.name ?? "";
```

Keep apparel-only fields tied to `product`:

```typescript
  const brandName = product?.metadata?.brandName ?? "";
  const styleName = product?.metadata?.styleName ?? "";
  const originalTitle = ((product?.variants?.[0]?.metadata as any)?.original_title ?? "") as string;
```

Use saved standard images with the hydrated thumbnail first:

```typescript
  const standardImages: ProductImage[] = standardProduct
    ? [
        ...(standardProduct.thumbnail
          ? [
              {
                src: generateImageUrl(standardProduct.thumbnail),
                alt: standardProduct.name,
              },
            ]
          : []),
        ...standardProduct.images,
      ]
    : [];
```

Return the discriminator and the standard product:

```typescript
    product,
    standardProduct,
    productType: data?.type ?? "unknown",
    isUnsupported: data?.type === "unknown",
```

Change the returned `images` field to:

```typescript
    images: product ? images : standardImages,
```

Do not change the apparel `savedConfig`, size inventory, `useProductMedia`, or `isApparel` logic beyond making them tolerate `product === undefined`.

- [ ] **Step 4: Run the type gate**

Run:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
```

Expected: pass, or only fail on `page.tsx` not yet consuming the new hook fields. Any other failure is a task failure.

---

### Task 3: Wire Saved Standard PDP With Existing Standard Helpers
> **Confidence: High** — implements [spec §Required User Behavior](../spec.md#required-user-behavior), [spec §Saved Apparel Contract](../spec.md#saved-apparel-contract), [spec §Saved Standard Cart Contract](../spec.md#saved-standard-cart-contract), [spec §Rendering Contract](../spec.md#rendering-contract), and [spec §Non-goals](../spec.md#non-goals); current `page.tsx` already has a non-apparel card and handler, but they are apparel-helper shaped.

**Centurio prompt:** Invoke `Skill(skill: "medusa-dev:building-storefronts")`.

**Files:**
- Modify: `src/app/(authenticated)/products/[handle]/page.tsx`
- Test: `node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit`

- [ ] **Step 1: Add the standard imports**

Update the React import:

```typescript
import { useEffect, useMemo, useState } from "react";
```

Add imports:

```typescript
import { StandardTabs } from "@/app/(authenticated)/catalog/[category]/[productHandle]/_components/standardProduct/StandardTabs";
import { DynamicOptionForm } from "@/app/(authenticated)/catalog/[category]/[productHandle]/_components/standardProduct/DynamicOptionForm";
import { PricingCard } from "@/app/(authenticated)/catalog/[category]/[productHandle]/_components/standardProduct/PricingCard";
import { StandardProductionTimePopover } from "@/app/(authenticated)/catalog/[category]/[productHandle]/_components/standardProduct/StandardProductionTimePopover";
import { useStandardPricing } from "@api/catalog/standardPricing";
import { useStandardAddToCart } from "@api/catalog/standardAddToCart";
import { useStandardProductFormState } from "@store/catalog/standardProductFormState";
import { IStandardProduct } from "@interfaces/standardProduct.interface";
```

- [ ] **Step 2: Replace only the existing `NonApparelSavedConfigCard` body and props**

Keep the component in `page.tsx`; do not create a new file. Change it to receive the standard product, pricing state, and no quantity argument:

```tsx
function NonApparelSavedConfigCard({
  isMobile,
  product,
  productTitle,
  pricing,
  pricingLoading,
  pricingError,
  variantId,
  onAddToCart,
  isSubmitting,
}: {
  isMobile: boolean;
  product: IStandardProduct;
  productTitle: string;
  pricing: { price: number; variant_id?: string } | undefined;
  pricingLoading: boolean;
  pricingError: boolean;
  variantId: string | undefined;
  onAddToCart: () => void;
  isSubmitting: boolean;
}) {
  const options = useStandardProductFormState((s) => s.options);
  const quantity = parseInt(options.quantity ?? "1", 10) || 1;
  const disabled = isSubmitting || pricingLoading || pricingError || !variantId;

  return (
    <Card>
      <CardContent className="space-y-5 pt-2">
        <div>
          <h2 className="text-lg font-semibold leading-snug">
            {productTitle || product.name}
          </h2>
          {product.metadata.short_description && (
            <p className="text-sm text-muted-foreground">
              {product.metadata.short_description}
            </p>
          )}
        </div>

        <Separator />

        <h3 className="text-base font-semibold">Configure</h3>
        <DynamicOptionForm options={product.options} isMobile={isMobile} />

        <Separator />

        <PricingCard
          price={pricing?.price}
          quantity={quantity}
          isLoading={pricingLoading}
          isError={pricingError}
        />

        <Separator />

        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Purchase now</p>
                <p className="text-xs text-muted-foreground">
                  Order your saved configuration now.
                </p>
              </div>
              <Button onClick={onAddToCart} disabled={disabled}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add to Cart
              </Button>
            </CardContent>
          </Card>
          {product.metadata.production_time && (
            <div className="flex justify-end">
              <StandardProductionTimePopover
                productionTime={product.metadata.production_time}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Add a no-action unsupported card in the same file**

Add this near `NonApparelSavedConfigCard`:

```tsx
function UnsupportedStandardProductCard({
  productTitle,
}: {
  productTitle: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold leading-snug">
          {productTitle || "Saved product unavailable"}
        </h2>
        <p className="text-sm text-muted-foreground">
          This saved product cannot be reordered online.
        </p>
      </CardContent>
    </Card>
  );
}
```

Do not render a disabled `Add to Cart` button in this unsupported state.

- [ ] **Step 4: Read the new hook fields and standard stores in `SavedProductDetailPage`**

Extend the `useSavedProduct` destructure:

```typescript
    standardProduct,
    productType,
    isUnsupported,
```

Add the existing standard cart/pricing state:

```typescript
  const standardCartMutation = useStandardAddToCart();
  const standardOptions = useStandardProductFormState((s) => s.options);
  const initializeStandardOptions = useStandardProductFormState(
    (s) => s.initializeOptions
  );
  const resetStandardOptions = useStandardProductFormState((s) => s.reset);
```

Add the required-option and product-type checks inline:

```typescript
  const requiredStandardCodes = useMemo(() => {
    if (!standardProduct) return [];
    return Array.from(
      new Set([
        ...(standardProduct.metadata.options_order ?? []),
        ...(standardProduct.metadata.base_option_keys ?? []),
        ...(standardProduct.metadata.multiplier_keys ?? []),
      ])
    );
  }, [standardProduct]);

  const validStandardProductTypes = ["print", "promo", "display", "stickers"];
  const hasRequiredStandardOptions = standardProduct
    ? requiredStandardCodes.length > 0 &&
      requiredStandardCodes.includes("quantity") &&
      requiredStandardCodes.every((code) =>
        standardProduct.options.some(
          (option) => option.code === code && option.values.length > 0
        )
      )
    : false;
  const canUseSavedStandard = Boolean(
    standardProduct &&
      validStandardProductTypes.includes(standardProduct.metadata.product_type) &&
      hasRequiredStandardOptions
  );
```

Add the pricing query:

```typescript
  const standardPricing = useStandardPricing({
    productId: standardProduct?.id ?? "",
    options: standardOptions,
    enabled: Boolean(standardProduct && canUseSavedStandard),
  });
```

- [ ] **Step 5: Initialize standard options only for supported saved standard products**

Add this effect below the apparel initialization effect:

```typescript
  useEffect(() => {
    if (!standardProduct || !canUseSavedStandard) return;

    const firstValues: Record<string, string> = {};
    const codes: string[] = [];
    for (const option of standardProduct.options) {
      codes.push(option.code);
      if (option.values.length > 0) {
        firstValues[option.code] = option.values[0];
      }
    }

    initializeStandardOptions(codes, firstValues);

    return () => {
      resetStandardOptions();
    };
  }, [
    standardProduct,
    canUseSavedStandard,
    initializeStandardOptions,
    resetStandardOptions,
  ]);
```

- [ ] **Step 6: Replace the non-apparel handler with a standard cart helper call**

Delete `handleNonApparelAddToCart(quantity: number)` and add:

```typescript
  async function handleSavedStandardAddToCart() {
    if (!standardProduct || !canUseSavedStandard) {
      toast.error("This saved product cannot be reordered online.");
      return;
    }

    const missingRequiredOption = requiredStandardCodes.find(
      (code) => !standardOptions[code]?.trim()
    );
    if (missingRequiredOption) {
      toast.error("Select all options before adding to cart.");
      return;
    }

    const variantId = standardPricing.data?.variant_id;
    if (!variantId) {
      toast.error("Pricing is not ready yet.");
      return;
    }

    try {
      await standardCartMutation.mutateAsync({
        regionId,
        cartId: cart?.id,
        variantId,
        productName: productTitle || standardProduct.name,
        productType: standardProduct.metadata.product_type,
        options: standardOptions,
        optionsLabels: standardProduct.metadata.options_labels,
        designNotes: "",
        files: [],
      });
      toast.success("Added to cart.");
      router.push("/cart");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add to cart";
      toast.error(message);
    }
  }
```

Do not change `handleApparelAddToCart` except where TypeScript requires it. Its current failure toast behavior must remain.

- [ ] **Step 7: Change the loading and render branches**

The skeleton gate should only wait on mount/loading, not on `!product`:

```typescript
  if (!mounted || loading) {
```

After the skeleton gate, add:

```typescript
  const displayProduct = product ?? standardProduct;
  if (!displayProduct || isUnsupported || productType === "unknown") {
    return (
      <>
        <PageHeader>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-1 mr-1"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">My Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Saved product unavailable</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageHeader>
        <div className="p-4 md:p-8">
          <div className="mx-auto max-w-3xl">
            <UnsupportedStandardProductCard productTitle="" />
          </div>
        </div>
      </>
    );
  }
```

Build `configCard` with the saved standard branch:

```tsx
  const configCard = isApparel && product ? (
    <SavedConfigCard
      isMobile={!isDesktop}
      productTitle={productTitle}
      brandName={brandName}
      styleName={styleName}
      sizes={sizes}
      sizeInventory={sizeInventory}
      config={config}
      onAddToCart={handleApparelAddToCart}
      isSubmitting={cartMutation.isPending}
    />
  ) : standardProduct && canUseSavedStandard ? (
    <NonApparelSavedConfigCard
      isMobile={!isDesktop}
      product={standardProduct}
      productTitle={productTitle}
      pricing={standardPricing.data}
      pricingLoading={standardPricing.isLoading}
      pricingError={standardPricing.isError}
      variantId={standardPricing.data?.variant_id}
      onAddToCart={handleSavedStandardAddToCart}
      isSubmitting={standardCartMutation.isPending}
    />
  ) : (
    <UnsupportedStandardProductCard productTitle={productTitle} />
  );
```

Use standard tabs for standard saved products:

```tsx
  const detailContent = standardProduct ? (
    <StandardTabs
      description={standardProduct.description}
      tabs={standardProduct.metadata.tabs ?? []}
    />
  ) : (
    <SavedProductTabs {...detailProps} />
  );

  const mobileDetailContent = standardProduct ? (
    <StandardTabs
      description={standardProduct.description}
      tabs={standardProduct.metadata.tabs ?? []}
    />
  ) : (
    <SavedProductAccordion {...detailProps} />
  );
```

Render `detailContent` where desktop currently renders `SavedProductTabs`, and `mobileDetailContent` where mobile currently renders `SavedProductAccordion`.

- [ ] **Step 8: Run the type gate**

Run:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
```

Expected: pass. If TypeScript reports stale imports after removing the old non-apparel quantity input, remove only imports made unused by this task.

---

### Task 4: Complete Redirect Checkout As Order Proof
> **Confidence: High** — implements [spec §Saved Standard Completion Contract](../spec.md#saved-standard-completion-contract); Serena verified the normal checkout path already sends `proof_type: "order"` while the redirect/capture route posts no body.

**Centurio prompt:** Invoke `Skill(skill: "medusa-dev:building-storefronts")`.

**Files:**
- Modify: `src/app/api/capture-payment/[cartId]/route.ts`
- Test: `node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit`

- [ ] **Step 1: Add the completion body**

Replace:

```typescript
const orderResponse = await storeApi.post(
  `/store/carts/${cartId}/custom-complete`
);
```

with:

```typescript
const orderResponse = await storeApi.post(
  `/store/carts/${cartId}/custom-complete`,
  { proof_type: "order" }
);
```

- [ ] **Step 2: Run the type gate**

Run:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
```

Expected: pass.

---

### Task 5: Verify The Finished Diff
> **Confidence: High** — implements [spec §Acceptance Criteria](../spec.md#acceptance-criteria); the command paths were verified in this shell and the manual checks match the approved spec.

**Centurio prompt:** Invoke `Skill(skill: "medusa-dev:building-storefronts")`.

**Files:**
- Modify: none
- Test: static checks and manual logged-in browser checks

- [ ] **Step 1: Run static checks**

Run:

```bash
node .yarn/releases/yarn-4.3.1.cjs exec tsc --noEmit
git diff --check
```

Expected: both pass.

- [ ] **Step 2: Start or reuse the storefront**

If no local storefront is already serving the authenticated app, run:

```bash
node .yarn/releases/yarn-4.3.1.cjs dev
```

Expected: app serves locally. Do not use `npm`, `npx`, `pnpm`, or bare `yarn` in this shell.

- [ ] **Step 3: Verify saved standard PDP happy path**

In a logged-in browser session, open:

```text
http://localhost:3000/products/brochures-8dd0f4c4
```

Expected:
- Saved product content renders instead of staying on skeleton.
- Breadcrumb is under `My Products`.
- The standard options show, including `Size`, `Paper`, and `Quantity` for the brochure fixture.
- Pricing appears.
- `Save & Proof` is not visible on `/products/brochures-8dd0f4c4`.

- [ ] **Step 4: Verify saved standard cart**

From the saved standard PDP, click `Add to Cart`, then open:

```text
http://localhost:3000/cart
```

Expected:
- Add to cart succeeds.
- Cart shows non-apparel options/metadata.
- Cart does not render apparel-only Color/Size assumptions for the saved print line.

- [ ] **Step 5: Verify unsupported branch by code inspection**

Run:

```bash
rg -n 'UnsupportedStandardProductCard|canUseSavedStandard|validStandardProductTypes|requiredStandardCodes|files: \\[\\]' 'src/app/(authenticated)/products/[handle]/page.tsx'
```

Expected:
- Unsupported branch exists.
- Unsupported branch does not render `Add to Cart`.
- Saved standard cart input passes `files: []`.
- Required-option checks use `options_order`, `base_option_keys`, and `multiplier_keys`.

- [ ] **Step 6: Verify saved apparel regression**

Open:

```text
http://localhost:3000/products/triblend-tee-77c1-b523
```

Expected:
- Apparel saved PDP renders.
- Size quantity controls render.
- Apparel add-to-cart succeeds.
- Apparel add-to-cart failure handling remains the existing page-level toast.

- [ ] **Step 7: Verify checkout completion body**

Run:

```bash
rg -n 'proof_type: "order"|custom-complete' src/app/_api/cart/placeOrder.ts 'src/app/api/capture-payment/[cartId]/route.ts'
```

Expected:
- `src/app/_api/cart/placeOrder.ts` posts `{ proof_type: "order" }`.
- `src/app/api/capture-payment/[cartId]/route.ts` posts `{ proof_type: "order" }`.

- [ ] **Step 8: Verify repository boundaries**

Run:

```bash
git status --short --branch
git diff --name-only
```

Expected:
- Current branch remains `feature/div-74-non-apparel-proof-detail-rendering`.
- Changed files are storefront files only.
- No backend files are changed.
- `AGENTS.md` and `.serena/` remain unrelated/untracked if they were untracked at start.
- Nothing was pushed and no PR was opened.

---

## Self-Review Coverage Map

- Product fetch discriminator: Task 2.
- Required standard option keys including base/multiplier metadata: Task 2 and Task 3.
- Saved apparel preservation: Task 3.
- Saved standard rendering and pricing: Task 3.
- Saved standard cart metadata with `product_type`, `upload_ids: []`, complete options, and line item quantity `1`: Task 3 through the existing standard cart helper.
- Unsupported/error fallback with no add-to-cart exposure: Task 3.
- No saved PDP `Save & Proof`: Task 3 and Task 5.
- Redirect/capture checkout `proof_type: "order"`: Task 4.
- Branching and no-push constraints: Task 1 and Task 5.

## Legion Choice

The orders are saved to `$CONSILIUM_DOCS/cases/2026-04-29-saved-print-product-pdp-standard-branch-discard/plan.md`.

1. The legion marches (recommended) — dispatch fresh centurios task-by-task, with Tribunus checks.
2. The Legatus marches alone — execute this plan in-session, task by task.
