# DIV-100 — Saved-product reorder trust boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the saved-product reorder trust boundary so direct variant-id submission cannot add or auto-approve another company's saved product.

**Architecture:** Add two narrow validation gates. Cart-add validates saved-product ownership before `addToCartWorkflow.runAsStep`. Cart completion validates cart company, proof lineage, proof type, and saved-product group consistency before catalog normalization, payment/session creation, `completeCartWorkflow`, or custom_order creation. Existing saved-product creation, pricing, multiplier, upload movement, emails, and subscriber behavior are not refactored.

**Tech Stack:** Medusa v2 backend; TypeScript strict; Medusa workflows/steps; `query.graph` for same-module lookups; `query.index` for Product -> CompanyProduct link filtering; Jest HTTP integration tests.

**Spec:** `spec.md`

**Backend worktree:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product`

**Required Medusa Rig skill:** `medusa-dev:building-with-medusa` (Codex equivalent: `building-with-medusa`) for every implementation task.

---

## Scope Guard

Do not add staff/team/collection authorization. Do not add a custom 403 responder. Do not rewrite checkout, payment, email, event, upload, or saved-product creation flows. Do not rename proof states. This plan only fixes company ownership at cart-add and proof lineage before saved-product reorder auto-approval.

The important current facts:

- `src/api/store/carts/[id]/line-items-custom/route.ts:57-62` and `:110-116` call cart-add workflows without company ownership input.
- `src/api/store/carts/[id]/custom-complete/route.ts:66-91` trusts `cart.customer.metadata.company_handle` to choose company.
- `src/api/store/carts/[id]/custom-complete/route.ts:93-169` mutates catalog carts before saved-product validation.
- `src/api/store/carts/[id]/custom-complete/route.ts:171-176` completes the cart before saved-product validation.
- `src/api/store/carts/[id]/custom-complete/route.ts:247-279` uses `items[0]` to decide saved-product reorder behavior.
- `src/links/product-company-product-link.ts` marks `CompanyProduct.id` and `company_id` filterable for Product -> CompanyProduct index filtering.
- Medusa maps `MedusaError.Types.NOT_ALLOWED` to HTTP 400 with type `not_allowed`; tests must not expect literal 403 unless the implementation deliberately adds a responder, which this plan forbids.

---

## File Plan

**Create**
- `src/workflows/cart/steps/validate-saved-product-cart-add.ts` — saved-product ownership validation before cart mutation.
- `src/workflows/cart/steps/validate-saved-product-completion.ts` — saved-product completion preflight.
- `src/workflows/cart/validate-saved-product-completion.ts` — workflow wrapper invoked by the custom-complete route.

**Modify**
- `src/api/store/carts/[id]/line-items-custom/route.ts` — use authenticated company context and pass `company_id` into both cart-add workflows.
- `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts` — call saved-product ownership step before pricing and `addToCartWorkflow`.
- `src/workflows/pricing/custom-add-line-item-to-cart.ts` — call saved-product ownership step before apparel pricing and `addToCartWorkflow`.
- `src/api/store/carts/[id]/custom-complete/route.ts` — use `req.context.company.id`, invoke completion preflight before side effects, and stop using only `items[0]` for saved-product group decisions.
- `integration-tests/http/approve-proof-non-apparel.spec.ts` — add trust-boundary regression coverage using the real saved product created by the file scaffold.
- `integration-tests/http/non-apparel-cart.spec.ts` — remove the fake saved-product marker from the multiplier-lock fixture.
- `integration-tests/http/proof-to-catalog.spec.ts` — add one apparel saved-product reorder preservation check.

---

## Task 1: Write the trust-boundary regression tests

> **Confidence: High** — implements [spec §4 — Saved-product Cart-add Admission](spec.md#4-saved-product-cart-add-admission), [spec §5 — Completion Preflight](spec.md#5-completion-preflight), [spec §6 — Error Semantics](spec.md#6-error-semantics), and [spec §8 — Acceptance Criteria](spec.md#8-acceptance-criteria). The non-apparel approve-proof integration file already creates a real same-company saved product and verifies the happy reorder path.

**Files:**
- Modify: `integration-tests/http/approve-proof-non-apparel.spec.ts`
- Modify: `integration-tests/http/non-apparel-cart.spec.ts`
- Modify: `integration-tests/http/proof-to-catalog.spec.ts`

- [ ] **Step 1: Make the fake saved-product multiplier fixture honest**

In `integration-tests/http/non-apparel-cart.spec.ts:459-509`, keep the narrowed `options_values.finish = ["matte"]` assertion but remove `custom_order_id: "fake_co_for_narrowing_test"`. Rename the test and comments from saved-product wording to narrowed product wording.

Required behavioral assertion stays the same:

```typescript
expect(resp.status).toBe(400)
expect(String(resp.data?.message ?? resp.data)).toMatch(/finish/)
expect(String(resp.data?.message ?? resp.data)).toMatch(/glossy/)
```

This preserves Phase 2 multiplier membership coverage without manufacturing an invalid saved product.

- [ ] **Step 2: Add test helpers to the non-apparel approve-proof scaffold**

In `integration-tests/http/approve-proof-non-apparel.spec.ts`, persist the source variant from the existing scaffold:

```typescript
let sourceVariantId = ""
```

In `beforeAll`, immediately after `matte500Variant` is found:

```typescript
sourceVariantId = matte500Variant.id
```

Add local helpers inside the `describe` block:

```typescript
const getCartItems = async (cartId: string) => {
  const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.unit_price", "items.quantity", "items.requires_shipping"],
    filters: { id: cartId },
  })
  return data[0]?.items ?? []
}

const expectCartHasNoItems = async (cartId: string) => {
  await expect(getCartItems(cartId)).resolves.toHaveLength(0)
}

const createCompanyAndLogin = async (
  name: string,
  handle: string,
  email: string,
) => {
  const password = "Test123!"
  await api.post(
    "/company",
    {
      name,
      handle,
      address_1: "123 Test St",
      city: "Test City",
      province: "CA",
      postal_code: "12345",
      logo: "",
      admin: [
        {
          email,
          password,
          first_name: "Jane",
          last_name: "Doe",
        },
      ],
    },
    { headers: { Authorization: `Bearer ${superadminToken}` } },
  )

  const login = await api.post(`/auth/${handle}/emailpass`, {
    email,
    password,
  })

  return { email, handle, token: login.data.token as string }
}

const createCartFor = async (email: string, token?: string) => {
  const response = await api.post(
    "/store/carts",
    {
      currency_code: "usd",
      region_id: testRegionId,
      email,
    },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  )

  return response.data.cart.id as string
}

const getSavedProductWithVariant = async () => {
  const productModuleService: any = getContainer().resolve(Modules.PRODUCT)
  const selector = savedProductId
    ? { id: [savedProductId] }
    : { metadata: { custom_order_id: customOrderId } }
  const [saved] = await productModuleService.listProducts(selector, {
    relations: ["variants", "variants.options", "variants.options.option"],
  })
  expect(saved).toBeDefined()
  savedProductId = saved.id
  expect(saved.variants?.[0]).toBeDefined()
  return { saved, savedVariant: saved.variants[0] }
}

const buildCatalogCartItem = () => ({
  variant_id: sourceVariantId,
  quantity: 1,
  metadata: {
    product_type: "print",
    group_id: `g_catalog_${Date.now()}`,
    upload_ids: [],
    product_name: "Batch Catalog Item",
    options: {
      paper_type: "matte",
      quantity: "500",
    },
  },
})

const buildSavedProductCartItem = async () => {
  const { saved, savedVariant } = await getSavedProductWithVariant()
  const optionsLabels = (saved.metadata as Record<string, unknown>)
    .options_labels as Record<string, string>
  const labelToCode: Record<string, string> = {}
  for (const [code, label] of Object.entries(optionsLabels)) {
    labelToCode[label] = code
  }

  const options: Record<string, string> = {}
  for (const variantOption of (savedVariant.options ?? []) as any[]) {
    const code = labelToCode[variantOption.option?.title ?? ""]
    if (code) options[code] = variantOption.value
  }

  const savedMultiplierKeys =
    ((saved.metadata as Record<string, unknown>).multiplier_keys as string[]) ?? []
  const savedOptionsValues =
    ((saved.metadata as Record<string, unknown>).options_values as Record<string, string[]>) ?? {}
  for (const key of savedMultiplierKeys) {
    if (savedOptionsValues[key]?.[0]) {
      options[key] = savedOptionsValues[key][0]
    }
  }

  return {
    variant_id: savedVariant.id,
    quantity: 1,
    metadata: {
      product_type: "print",
      group_id: `g_saved_${Date.now()}`,
      upload_ids: [],
      options,
    },
  }
}

const createSameCompanySavedProductCart = async () => {
  const cartId = await createCartFor("admin@test-company.com")
  await api.post(`/store/carts/${cartId}/line-items-custom`, {
    items: [await buildSavedProductCartItem()],
  })
  return cartId
}
```

Then update the existing same-company reorder happy-path test to call `createSameCompanySavedProductCart()` instead of carrying its own duplicate saved-product payload construction. Do not create a fake `custom_order_id` product for the normal cross-company ownership tests.

- [ ] **Step 3: Add cart-add ownership tests**

Add these tests to `integration-tests/http/approve-proof-non-apparel.spec.ts` after the existing saved-product creation/link assertions and before or near the reorder happy path:

```typescript
it("rejects another company's saved-product variant before adding a line item", async () => {
  const other = await createCompanyAndLogin("Other Company", "other-company", "admin@other-company.com")
  const otherCartResp = await api.post(
    "/store/carts",
    {
      currency_code: "usd",
      region_id: testRegionId,
      email: "admin@other-company.com",
    },
    { headers: { Authorization: `Bearer ${other.token}` } },
  )
  const otherCartId = otherCartResp.data.cart.id

  const resp = await api
    .post(
      `/store/carts/${otherCartId}/line-items-custom`,
      { items: [await buildSavedProductCartItem()] },
      { headers: { Authorization: `Bearer ${other.token}` } },
    )
    .catch((err) => err.response)

  expect(resp.status).toBe(400)
  expect(resp.data?.type).toBe("not_allowed")
  expect(String(resp.data?.message ?? "")).toMatch(/saved product/i)
  await expectCartHasNoItems(otherCartId)
})
```

Add the batch atomic test in the same file. The first item must be a valid same-company catalog or saved-product item, and the second submitted item must be the saved product owned by the original company while the request is authenticated as the other company:

```typescript
it("rejects a batch cart-add atomically when any submitted saved product is unauthorized", async () => {
  const other = await createCompanyAndLogin("Batch Other Company", "batch-other-company", "admin@batch-other-company.com")
  const otherCartResp = await api.post(
    "/store/carts",
    {
      currency_code: "usd",
      region_id: testRegionId,
      email: "admin@batch-other-company.com",
    },
    { headers: { Authorization: `Bearer ${other.token}` } },
  )
  const otherCartId = otherCartResp.data.cart.id

  const validOtherCompanyItem = buildCatalogCartItem()
  const unauthorizedSavedProductItem = await buildSavedProductCartItem()

  const resp = await api
    .post(
      `/store/carts/${otherCartId}/line-items-custom`,
      { items: [validOtherCompanyItem, unauthorizedSavedProductItem] },
      { headers: { Authorization: `Bearer ${other.token}` } },
    )
    .catch((err) => err.response)

  expect(resp.status).toBe(400)
  expect(resp.data?.type).toBe("not_allowed")
  await expectCartHasNoItems(otherCartId)
})
```

Add the cart/authenticated-company mismatch test:

```typescript
it("rejects cart-add when the cart belongs to a different company than the authenticated user", async () => {
  const other = await createCompanyAndLogin("Cart Mismatch Company", "cart-mismatch-company", "admin@cart-mismatch-company.com")
  const currentCompanyCartId = await createCartFor("admin@test-company.com")

  const resp = await api
    .post(
      `/store/carts/${currentCompanyCartId}/line-items-custom`,
      { items: [await buildSavedProductCartItem()] },
      { headers: { Authorization: `Bearer ${other.token}` } },
    )
    .catch((err) => err.response)

  expect(resp.status).toBe(400)
  expect(resp.data?.type).toBe("not_allowed")
  await expectCartHasNoItems(currentCompanyCartId)
})
```

- [ ] **Step 4: Add completion preflight tests**

In the same file, add these completion tests using a saved-product cart that is already addable by the same company:

```typescript
it("rejects saved-product completion as catalog before catalog normalization or order creation", async () => {
  const cartId = await createSameCompanySavedProductCart()
  const beforeItems = await getCartItems(cartId)

  const resp = await api
    .post(`/store/carts/${cartId}/custom-complete`, { proof_type: ProofType.CATALOG })
    .catch((err) => err.response)

  expect(resp.status).toBe(400)
  expect(resp.data?.type).toBe("invalid_data")
  expect(String(resp.data?.message ?? "")).toMatch(/catalog/i)
  expect(await getCartItems(cartId)).toEqual(beforeItems)
})
```

Add unit-like integration coverage for invalid lineage by temporarily pointing the already linked saved product at bad custom_order ids, then restoring original metadata in `finally`. The saved-product helper must look up the product by `savedProductId` after this mutation; filtering by `metadata.custom_order_id === customOrderId` would test setup failure instead of completion preflight.

```typescript
it("rejects saved product whose custom_order_id does not resolve", async () => {
  const productModuleService: any = getContainer().resolve(Modules.PRODUCT)
  await getSavedProductWithVariant()
  const [saved] = await productModuleService.listProducts({ id: [savedProductId] })
  const originalMetadata = saved.metadata

  try {
    await productModuleService.updateProducts(savedProductId, {
      metadata: { ...originalMetadata, custom_order_id: "co_missing_for_div_100" },
    })
    const cartId = await createSameCompanySavedProductCart()
    const resp = await api
      .post(`/store/carts/${cartId}/custom-complete`, { proof_type: ProofType.ORDER })
      .catch((err) => err.response)

    expect(resp.status).toBe(400)
    expect(resp.data?.type).toBe("invalid_data")
  } finally {
    await productModuleService.updateProducts(savedProductId, {
      metadata: originalMetadata,
    })
  }
})
```

Add one orphan-lineage test by creating a `custom_order` with no order/company link through `CUSTOM_ORDER_MODULE`, temporarily setting the saved product's `custom_order_id` to that orphan id, and asserting `invalid_data` before order creation.

Add the completion cart/authenticated-company mismatch test:

```typescript
it("rejects completion authorization before proof-type validation", async () => {
  const other = await createCompanyAndLogin("Complete Mismatch Company", "complete-mismatch-company", "admin@complete-mismatch-company.com")
  const cartId = await createSameCompanySavedProductCart()

  const resp = await api
    .post(
      `/store/carts/${cartId}/custom-complete`,
      { proof_type: ProofType.CATALOG },
      { headers: { Authorization: `Bearer ${other.token}` } },
    )
    .catch((err) => err.response)

  expect(resp.status).toBe(400)
  expect(resp.data?.type).toBe("not_allowed")
})

- [ ] **Step 5: Add one apparel reorder preservation check**

Search first:

```bash
rg -n "original_custom_order_id|saved-product reorder|auto-approves" integration-tests/http/proof-to-catalog.spec.ts integration-tests/http
```

The search should confirm there is no apparel reorder test today. Extend `integration-tests/http/proof-to-catalog.spec.ts` after the saved product creation assertions. Reuse the created apparel saved product from `/company/my-products`, create a fresh cart, add the saved variant through `/store/carts/{id}/line-items-custom`, create payment session and shipping method, complete as `ProofType.ORDER`, and assert the new linked custom_order has:

```typescript
await api.post(`/store/carts/${reorderCartId}/line-items-custom`, {
  items: [
    {
      variant_id: savedVariant.id,
      quantity: 1,
      metadata: {
        upload_ids: [],
        group_id: "g_apparel_reorder",
        selections:
          (savedVariant.metadata?.selections as typeof productionSelections) ??
          productionSelections,
      },
    },
  ],
})
```

The metadata shape is mandatory: `ApparelMetadataSchema` requires `upload_ids`, `group_id`, and `selections`, while the saved variant only carries proof selections/source identity.

```typescript
expect(newCustomOrder.job_status).toBe(JobStatus.APPROVED)
expect(newCustomOrder.order_status).toBe(OrderStatus.PROOF_DONE)
expect(newCustomOrder.metadata?.original_custom_order_id).toBe(customOrderId)
```

This is not new feature work; it proves the shared cart-add and completion gates did not break the existing apparel saved-product path.

- [ ] **Step 6: Run tests to verify the new assertions fail before implementation**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts
yarn test:integration:http integration-tests/http/non-apparel-cart.spec.ts -t "locked multiplier value"
```

Expected before implementation:
- Cross-company cart-add tests fail because the route currently accepts the submitted saved-product variant.
- Catalog completion test fails because validation currently happens after catalog mutation/order creation or not at all.
- The narrowed-product fixture test should still pass after removing the fake `custom_order_id`.

---

## Task 2: Add saved-product ownership validation before cart-add mutation

> **Confidence: High** — implements [spec §4 — Saved-product Cart-add Admission](spec.md#4-saved-product-cart-add-admission). `product_company_product` is a Product -> CompanyProduct link with `company_id` filterable, so ownership can be checked with `query.index` instead of broad-fetching and filtering in JavaScript.

**Files:**
- Create: `src/workflows/cart/steps/validate-saved-product-cart-add.ts`
- Modify: `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`
- Modify: `src/workflows/pricing/custom-add-line-item-to-cart.ts`
- Modify: `src/api/store/carts/[id]/line-items-custom/route.ts`

- [ ] **Step 1: Create the cart-add validation step**

Create `src/workflows/cart/steps/validate-saved-product-cart-add.ts` with this behavior:

```typescript
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

type CartAddItem = { variant_id: string }

type StepInput = {
  cart_id: string
  company_id: string
  items: CartAddItem[]
}

export const validateSavedProductCartAddStep = createStep(
  "validate-saved-product-cart-add",
  async ({ cart_id, company_id, items }: StepInput, { container }) => {
    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const variantIds = [...new Set(items.map((item) => item.variant_id).filter(Boolean))]

      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "product_id"],
        filters: { id: variantIds },
      })

      const productIds = [...new Set(variants.map((variant) => variant.product_id).filter(Boolean))]
      if (productIds.length === 0) {
        return new StepResponse({ checked_saved_product_count: 0 })
      }

      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "metadata"],
        filters: { id: productIds },
      })

      const savedProductIds = products
        .filter((product) => typeof product.metadata?.custom_order_id === "string")
        .map((product) => product.id)

      if (savedProductIds.length === 0) {
        return new StepResponse({ checked_saved_product_count: 0 })
      }

      const { data: carts } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "customer.company_employee.employee_company.id",
        ],
        filters: { id: cart_id },
      })

      const cartCompanyId = carts[0]?.customer?.company_employee?.employee_company?.id
      if (!cartCompanyId || cartCompanyId !== company_id) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cart does not belong to the current company",
        )
      }

      const { data: allowedProducts } = await query.index({
        entity: "product",
        fields: ["id", "company_product.id", "company_product.company_id"],
        filters: {
          id: savedProductIds,
          company_product: { company_id },
        },
      })

      const allowedIds = new Set(allowedProducts.map((product) => product.id))
      const unauthorized = savedProductIds.find((productId) => !allowedIds.has(productId))
      if (unauthorized) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Saved product does not belong to the current company",
        )
      }

      return new StepResponse({ checked_saved_product_count: savedProductIds.length })
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Saved-product cart-add validation failed",
      )
    }
  },
)
```

Keep the access-denied messages generic. Do not leak the owning company handle or id. The cart-company check intentionally runs only after the submitted items include at least one saved product, so catalog-only cart-add behavior remains unchanged.

- [ ] **Step 2: Thread company_id into the non-apparel cart-add workflow**

Modify `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`:

```typescript
import { validateSavedProductCartAddStep } from "@/workflows/cart/steps/validate-saved-product-cart-add"

type AddPromoPrintPriceToCartWorkflowInput = {
  cart_id: string
  company_id: string
  items: NonApparelCartItem[]
}
```

Call the step before `calculatePromoPrintPricesStep(stepInput)`:

```typescript
validateSavedProductCartAddStep({ cart_id, company_id, items })
```

Do not move price calculation or `addToCartWorkflow.runAsStep`. The validation only gates them.

- [ ] **Step 3: Thread company_id into the apparel cart-add workflow**

Modify `src/workflows/pricing/custom-add-line-item-to-cart.ts` the same way:

```typescript
import { validateSavedProductCartAddStep } from "@/workflows/cart/steps/validate-saved-product-cart-add"

type AddApparelPriceToCartWorkflowInput = {
  cart_id: string
  company_id: string
  pricingTier: "tier1" | "tier2" | "tier3"
  items: ApparelCartItem[]
}
```

Call:

```typescript
validateSavedProductCartAddStep({ cart_id, company_id, items })
```

Place it before `calculateApparelPricesWorkflow.runAsStep`.

- [ ] **Step 4: Pass authenticated company context from the route**

Modify `src/api/store/carts/[id]/line-items-custom/route.ts`:

```typescript
import { AuthenticatedCompanyRequest } from "@/api/company/type"
```

Change the request type:

```typescript
req: AuthenticatedCompanyRequest<LineItemsCustomItem>,
```

Pass `company_id: req.context.company.id` into both workflows:

```typescript
input: {
  cart_id: cartId,
  company_id: req.context.company.id,
  items: nonApparelItems,
}
```

and:

```typescript
input: {
  cart_id: cartId,
  company_id: req.context.company.id,
  pricingTier,
  items: apparelItems,
}
```

Do not add ownership validation directly in the route beyond passing authenticated context.

- [ ] **Step 5: Run the cart-add tests**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts -t "saved-product variant|batch cart-add"
yarn test:integration:http integration-tests/http/non-apparel-cart.spec.ts -t "locked multiplier value"
```

Expected: PASS for the new cross-company and batch-atomic tests; PASS for the renamed narrowed-product multiplier test.

---

## Task 3: Add saved-product completion preflight workflow

> **Confidence: High** — implements [spec §5 — Completion Preflight](spec.md#5-completion-preflight) and [spec §6 — Error Semantics](spec.md#6-error-semantics). Existing custom-order routes already use `order.company.*` and `order.customer.company_employee.*` fields, so the required lineage can be read without inventing a new persistence model.

**Files:**
- Create: `src/workflows/cart/steps/validate-saved-product-completion.ts`
- Create: `src/workflows/cart/validate-saved-product-completion.ts`

- [ ] **Step 1: Create the completion validation step**

Create `src/workflows/cart/steps/validate-saved-product-completion.ts`.

The step input is:

```typescript
type StepInput = {
  cart_id: string
  company_id: string
  proof_type: ProofType
}
```

The step must:

1. query the cart by `cart_id` with fields:

```typescript
[
  "id",
  "items.id",
  "items.metadata",
  "items.product.id",
  "items.product.metadata",
  "customer.company_employee.employee_company.id",
]
```

2. throw `NOT_ALLOWED` if the authoritative cart company is missing or different from `company_id`;
3. find every line item whose `item.product.metadata.custom_order_id` is a string;
4. return successfully if no saved-product line items exist;
5. query `custom_order` with fields:

```typescript
["id", "product_name", "order.id", "order.company.id"]
```

6. throw `INVALID_DATA` if a saved product references a missing custom_order;
7. throw `INVALID_DATA` if a backing custom_order has no `order.company.id`;
8. throw `NOT_ALLOWED` if a backing custom_order belongs to another company;
9. after authorization/lineage passes, throw `INVALID_DATA` if `proof_type === ProofType.CATALOG`;
10. throw `INVALID_DATA` if a saved-product line item has no string `metadata.group_id`;
11. group line items by `metadata.group_id` and throw `INVALID_DATA` if a group mixes saved-product and non-saved-product items;
12. throw `INVALID_DATA` if a saved-product group contains more than one backing `custom_order_id`.

Keep this as a validation step. It must not create orders, update carts, move uploads, emit events, or normalize catalog items.

- [ ] **Step 2: Add the workflow wrapper**

Create `src/workflows/cart/validate-saved-product-completion.ts`:

```typescript
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ProofType } from "@/modules/custom-order"
import { validateSavedProductCompletionStep } from "./steps/validate-saved-product-completion"

type Input = {
  cart_id: string
  company_id: string
  proof_type: ProofType
}

export const validateSavedProductCompletionWorkflow = createWorkflow(
  "validate-saved-product-completion",
  (input: Input) => {
    const result = validateSavedProductCompletionStep(input)
    return new WorkflowResponse(result)
  },
)
```

- [ ] **Step 3: Run the completion tests to confirm they still fail before route wiring**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts -t "saved-product completion|custom_order_id does not resolve|orphan"
```

Expected before route wiring: FAIL because the new workflow exists but is not invoked by `custom-complete`.

---

## Task 4: Invoke completion preflight before all custom-complete side effects

> **Confidence: High** — implements [spec §5 — Completion Preflight](spec.md#5-completion-preflight), [spec §6 — Error Semantics](spec.md#6-error-semantics), and [spec §7 — Valid Reorder Behavior Preserved](spec.md#7-valid-reorder-behavior-preserved). The current route completes the cart at `custom-complete/route.ts:171-176`; the new preflight must run before that and before the catalog branch at `:93-169`.

**Files:**
- Modify: `src/api/store/carts/[id]/custom-complete/route.ts`

- [ ] **Step 1: Replace metadata-handle company selection with authenticated company context**

In `custom-complete/route.ts`, set:

```typescript
const company = req.context.company
const companyId = company.id
```

Remove the company lookup based only on `cart.customer.metadata.company_handle`. Keep the existing cart existence and non-empty item checks. Do not remove the later `company.metadata?.promoEmails` logic; it should use the authenticated `company` object already assigned above.

- [ ] **Step 2: Invoke preflight before the catalog branch**

Import:

```typescript
import { validateSavedProductCompletionWorkflow } from "@/workflows/cart/validate-saved-product-completion"
```

Immediately after the cart existence and non-empty item checks, before `if (proofType === ProofType.CATALOG)`, run:

```typescript
await validateSavedProductCompletionWorkflow(req.scope).run({
  input: {
    cart_id: id,
    company_id: companyId,
    proof_type: proofType,
  },
})
```

This location is mandatory. It ensures saved-product failures happen before catalog quantity/price/shipping normalization, payment collection/session creation, `completeCartWorkflow`, order-company linking, custom_order creation, upload movement, and event emission.

- [ ] **Step 3: Keep ordinary catalog proof behavior unchanged**

Leave the existing ordinary catalog branch in place for non-saved products:

- max one item for catalog proof;
- quantity forced to 1;
- unit price forced to 0;
- `requires_shipping` forced to false;
- payment collection/session creation for zero-cost proof checkout.

Do not move this branch into a new workflow in this task.

- [ ] **Step 4: Run the completion preflight tests**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts -t "saved-product completion|custom_order_id does not resolve|orphan"
```

Expected: PASS.

---

## Task 5: Remove `items[0]` trust from saved-product custom_order creation

> **Confidence: High** — implements [spec §5 — Completion Preflight](spec.md#5-completion-preflight) and [spec §8 — Acceptance Criteria](spec.md#8-acceptance-criteria). Preflight blocks invalid groups before order creation; this route still needs to stop deriving saved-product status and original lineage from only the first item.

**Files:**
- Modify: `src/api/store/carts/[id]/custom-complete/route.ts`

- [ ] **Step 1: Query enough order line item fields**

In the order details query after `completeCartWorkflow`, include product id as well as product metadata:

```typescript
fields: [
  "id",
  "items.metadata",
  "items.id",
  "items.product.id",
  "items.product.metadata",
]
```

- [ ] **Step 2: Replace first-item saved-product detection with group-wide detection**

Inside the `for (const items of groupedOrderLineItems)` loop, compute saved-product lineage from every item:

```typescript
const savedCustomOrderIds = [
  ...new Set(
    items
      .map((item) => item?.product?.metadata?.custom_order_id)
      .filter((id): id is string => typeof id === "string"),
  ),
]
const savedItemCount = items.filter(
  (item) => typeof item?.product?.metadata?.custom_order_id === "string",
).length

if (savedItemCount > 0 && savedItemCount !== items.length) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "A custom-order group cannot mix saved-product and proof-required items",
  )
}

if (savedCustomOrderIds.length > 1) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "A saved-product group cannot reference multiple original proofs",
  )
}

const originalCustomOrderId = savedCustomOrderIds[0]
const isSavedProduct = proofType === ProofType.ORDER && !!originalCustomOrderId
```

This duplicates the preflight check defensively at the point of custom_order creation. Keep it narrow; do not rewrite upload grouping or product naming for ordinary groups.

- [ ] **Step 3: Guard original custom_order lookup**

Replace the current `items[0]?.product?.metadata?.custom_order_id` lookup with `originalCustomOrderId`.

```typescript
if (isSavedProduct) {
  const {
    data: [customOrder],
  } = await query.graph({
    entity: "custom_order",
    fields: ["product_name"],
    filters: { id: originalCustomOrderId },
  })

  if (!customOrder) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Saved product references an unknown original proof",
    )
  }

  productName = customOrder.product_name ?? productName
}
```

When creating `customOrdersData`, set:

```typescript
metadata: {
  original_custom_order_id: originalCustomOrderId,
}
```

- [ ] **Step 4: Run reorder behavior tests**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts -t "auto-approves|saved-product completion|custom_order_id does not resolve|orphan"
```

Expected: PASS.

---

## Task 6: Final verification gates

> **Confidence: Medium** — implements [spec §8 — Acceptance Criteria](spec.md#8-acceptance-criteria). The exact local integration baseline can drift because `.env.test` is already dirty in this worktree; failures outside these files must be triaged, not papered over.

**Files:**
- No new implementation files.
- Test target files only.

- [ ] **Step 1: Run targeted non-apparel saved-product suite**

Run:

```bash
yarn test:integration:http integration-tests/http/approve-proof-non-apparel.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run multiplier fixture regression**

Run:

```bash
yarn test:integration:http integration-tests/http/non-apparel-cart.spec.ts -t "locked multiplier value|multiplier value is not declared"
```

Expected: PASS.

- [ ] **Step 3: Run apparel proof/reorder preservation check**

Run:

```bash
yarn test:integration:http integration-tests/http/proof-to-catalog.spec.ts -t "proof to catalog flow"
```

Expected: PASS. If the new apparel reorder assertion was added under that test, it must be included in this run.

- [ ] **Step 4: Run type/build gate**

Run:

```bash
yarn build
```

Expected: PASS.

- [ ] **Step 5: Commit the finished slice**

After the above gates pass, commit only the files changed by this plan:

```bash
git add src/workflows/cart \
        src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts \
        src/workflows/pricing/custom-add-line-item-to-cart.ts \
        'src/api/store/carts/[id]/line-items-custom/route.ts' \
        'src/api/store/carts/[id]/custom-complete/route.ts' \
        integration-tests/http/approve-proof-non-apparel.spec.ts \
        integration-tests/http/non-apparel-cart.spec.ts \
        integration-tests/http/proof-to-catalog.spec.ts
git commit -m "fix(div-100): enforce saved-product reorder ownership"
```

Do not stage `.env.test`, `.codex/`, `.mcp.json`, `AGENTS.md`, or unrelated docs already present in this worktree.
