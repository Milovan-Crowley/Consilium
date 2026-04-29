# DIV-100 Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the apparel-only saved-product reorder gate at `custom-complete` to non-apparel, and enforce a membership-based multiplier contract at cart-add. The cart-add lock for saved products emerges as a structural consequence of the contract plus Phase 1's narrowing.

**Architecture:** Two surgical changes — one boolean clause dropped from the gate predicate at `custom-complete/route.ts`, and a membership check + factor-1.0 default added to the existing per-multiplier loop in `calculate-promo-print-price.ts`. No new files, no new modules, no new workflows. The helper begins reading `product.metadata.options_values` for the first time; existing test fixtures must be updated to populate it.

**Tech Stack:** Medusa.js v2.12.5, TypeScript strict mode, Jest (unit + integration), `MedusaError` for `INVALID_DATA` throws.

**Branch:** `feature/div-100-non-apparel-saved-product` (existing worktree, Phase 1 already committed).

**Required Rig:** every soldier invokes `medusa-dev:building-with-medusa` on arrival — backend lane only.

---

## Pre-Flight: Spec Cross-Reference

This plan implements [spec §4 — Reorder Gate Widening](./spec.md#4-reorder-gate-widening), [§5 — Multiplier Contract](./spec.md#5-multiplier-contract), [§6 — Error Semantics](./spec.md#6-error-semantics), and [§6.5 — Test Impact](./spec.md#65-test-impact). The residuals enumerated in [§6.6](./spec.md#66-residuals-acknowledged-not-addressed) are explicitly NOT addressed; soldiers must not add defensive code for any of them.

---

## Task 1: Multiplier contract — membership check + factor 1.0 default

> **Confidence: High** — implements [spec §5 — Multiplier Contract](./spec.md#5-multiplier-contract), [§6 — Error Semantics](./spec.md#6-error-semantics), and [§6.5 — Test Impact](./spec.md#65-test-impact). Helper structure verified at `src/workflows/pricing/utils/calculate-promo-print-price.ts:1-104`; existing unit-test fixture verified at `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:1-98`; existing integration-test fixture verified at `integration-tests/http/non-apparel-cart.spec.ts:30-103`.

**Files:**
- Modify: `src/workflows/pricing/utils/calculate-promo-print-price.ts:80-95` (helper) plus `src/workflows/pricing/utils/calculate-promo-print-price.ts:25-34` (destructure additions)
- Modify: `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:5-22` (fixture options_values), `:88-97` (Q-B test inversion), append new tests after `:97`
- Modify: `integration-tests/http/non-apparel-cart.spec.ts:73-88` (fixture options_values), `:393-418` (Test 12 inversion), append new tests in the same describe block

**Soldier dispatch prompt prefix (every step in this task):** Invoke `Skill(skill: "medusa-dev:building-with-medusa")` on arrival. Filter against AI-slop: do NOT add defensive shape guards (no `Array.isArray` checks on `multiplier_keys`, no length checks on `options_values[k]`); rely on JavaScript's optional-chain semantics. Do NOT add new imports beyond what already exists in each file. The helper's `MedusaError` import at line 1 is sufficient.

- [ ] **Step 1: Update the unit-test fixture to populate `options_values`**

Edit `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:5-22`. Add `options_values` to `metadata` so the membership check has a declared list to read against. Replace the `metadata: { ... }` block exactly as shown:

```typescript
  metadata: {
    base_option_keys: ["paper_type", "quantity"],
    multiplier_keys: ["finish"],
    options_labels: {
      paper_type: "Paper Type",
      quantity: "Quantity",
      finish: "Finish",
    } as Record<string, string>,
    options_values: {
      paper_type: ["matte"],
      quantity: ["500", "1000", "999"],
      finish: ["matte", "glossy"],
    } as Record<string, string[]>,
    multipliers: {
      finish: {
        "500": { matte: 1, glossy: 1.2 },
        "1000": { matte: 1, glossy: 1.15 },
        // NOTE: no "999" row. Phase 2 inverts the prior Q-B FIX-LOUD test —
        // missing rows for declared values default to factor 1.0.
      },
    } as Record<string, Record<string, Record<string, number>>>,
  } as Record<string, unknown>,
```

- [ ] **Step 2: Invert the Q-B FIX-LOUD unit test**

Edit `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97`. Replace the entire test block with:

```typescript
  it("defaults factor to 1.0 when the multiplier row for a declared (code, quantity, value) is missing", () => {
    const product = buildProduct();
    // quantity "999" has no row in multipliers.finish; "glossy" IS declared
    // in options_values.finish — so membership passes and the row absence
    // resolves to factor 1.0 instead of throwing (Phase 2 inversion of Q-B
    // FIX-LOUD).
    const result = calculatePromoPrintPrice({
      product,
      options: { paper_type: "matte", quantity: "999", finish: "glossy" },
    });
    expect(result.unit_price).toBe(100); // 100 × 1.0 = 100
    expect(result.variant_id).toBe("var_999_matte");
  });
```

- [ ] **Step 3: Add unit tests for the membership check**

Append three new tests inside the same `describe("calculatePromoPrintPrice", ...)` block (after the inverted Q-B test, before the closing `});`):

```typescript
  it("throws INVALID_DATA when a submitted multiplier value is not declared in options_values", () => {
    const product = buildProduct();
    let caught: any;
    try {
      calculatePromoPrintPrice({
        product,
        options: { paper_type: "matte", quantity: "500", finish: "linen" }, // 'linen' not in options_values.finish
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.type).toBe("invalid_data");
    expect(String(caught.message)).toMatch(/finish/);
    expect(String(caught.message)).toMatch(/linen/);
  });

  it("throws INVALID_DATA when options_values[code] is undefined for a multiplier code", () => {
    const product = buildProduct();
    // Strip options_values entirely to simulate a product missing the importer-written field.
    const productNoOptionsValues = {
      ...product,
      metadata: {
        ...(product.metadata as Record<string, unknown>),
        options_values: {}, // empty — finish has no declared list
      } as Record<string, unknown>,
    };
    let caught: any;
    try {
      calculatePromoPrintPrice({
        product: productNoOptionsValues,
        options: { paper_type: "matte", quantity: "500", finish: "matte" },
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.type).toBe("invalid_data");
    expect(String(caught.message)).toMatch(/finish/);
  });

  it("rejects narrowed-saved-product cart-add when a non-locked value is submitted (structural lock)", () => {
    const product = buildProduct();
    // Simulate Phase 1's narrowing: options_values.finish narrowed to a single approved value.
    const savedProduct = {
      ...product,
      metadata: {
        ...(product.metadata as Record<string, unknown>),
        options_values: {
          paper_type: ["matte"],
          quantity: ["500", "1000", "999"],
          finish: ["matte"], // single-element — locked to "matte"
        } as Record<string, string[]>,
      } as Record<string, unknown>,
    };
    let caught: any;
    try {
      calculatePromoPrintPrice({
        product: savedProduct,
        options: { paper_type: "matte", quantity: "500", finish: "glossy" }, // "glossy" was declared on catalog but narrowed out on saved
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.type).toBe("invalid_data");
    expect(String(caught.message)).toMatch(/finish/);
    expect(String(caught.message)).toMatch(/glossy/);
  });
```

- [ ] **Step 4: Update the integration-test fixture to populate `options_values`**

Edit `integration-tests/http/non-apparel-cart.spec.ts:73-88`. Add `options_values` to the product's `metadata` block. Replace the `metadata: { ... }` block exactly as shown:

```typescript
            metadata: {
              base_option_keys: ["paper_type", "quantity"],
              multiplier_keys: ["finish"],
              options_labels: {
                paper_type: "Paper Type",
                quantity: "Quantity",
                finish: "Finish",
              },
              options_values: {
                paper_type: ["matte"],
                quantity: ["500", "1000", "999"],
                finish: ["matte", "glossy"],
              },
              multipliers: {
                finish: {
                  "500": { matte: 1, glossy: 1.2 },
                  "1000": { matte: 1, glossy: 1.15 },
                  // No "999" row.
                },
              },
            },
```

- [ ] **Step 5: Invert Test 12 — multiplier missing row no longer throws**

Edit `integration-tests/http/non-apparel-cart.spec.ts:393-418`. Replace the entire test block (including the lead comment block at `:393-396`) with:

```typescript
      // Test 12 — multiplier missing-row defaults to factor 1.0 (Phase 2
      // inverts Q-B FIX-LOUD). Targets variant `matte_999` so the variant
      // matches; multipliers["finish"]["999"] is absent, but "glossy" IS
      // declared in options_values.finish, so membership passes and the
      // row absence resolves to base × 1.0 = 100.
      it("defaults factor to 1.0 when the multiplier row for a declared (code, quantity, value) is missing", async () => {
        const resp = await api.post(`/store/carts/${cartId}/line-items-custom`, {
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
                  quantity: "999",
                  finish: "glossy",
                },
              },
            },
          ],
        });
        expect(resp.status).toBe(200);
        // base price 100 × factor 1.0 = 100
        const cartResp = await api.get(`/store/carts/${cartId}`);
        const lineItem = cartResp.data.cart.items[0];
        expect(lineItem.unit_price).toBe(100);
      });
```

- [ ] **Step 6: Add catalog cart-add membership-violation integration test**

Append after Test 12 (before Test 12b at `:420`) inside the same `describe` block:

```typescript
      // Test 12c — membership-check rejects undeclared multiplier value
      // (Phase 2). The catalog product's options_values.finish is
      // ["matte", "glossy"]; submitting "linen" fails membership and
      // throws INVALID_DATA before reaching the row lookup.
      it("rejects cart-add when a multiplier value is not declared in options_values", async () => {
        const resp = await api
          .post(`/store/carts/${cartId}/line-items-custom`, {
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
                    finish: "linen", // not in options_values.finish
                  },
                },
              },
            ],
          })
          .catch((err) => err.response);
        expect(resp.status).toBe(400);
        expect(String(resp.data?.message ?? resp.data)).toMatch(/finish/);
        expect(String(resp.data?.message ?? resp.data)).toMatch(/linen/);
      });
```

- [ ] **Step 7: Add saved-product cart-add lock integration test**

Append after Test 12c, still inside the same `describe` block:

```typescript
      // Test 12d — saved-product structural lock (Phase 2). A saved product
      // narrows options_values[multiplierKey] to [approvedValue]; the
      // membership check naturally rejects any non-approved submission.
      // No saved-product-specific code path; the lock is the natural
      // consequence of narrowed options_values.
      it("rejects cart-add of a saved-product variant when a locked multiplier value is overridden", async () => {
        const container = getContainer();
        const productModuleService = container.resolve(Modules.PRODUCT);
        // Narrow the existing fixture's options_values.finish to ["matte"]
        // — simulating Phase 1's saved-product creation output.
        await productModuleService.updateProducts(promoProductId, {
          metadata: {
            base_option_keys: ["paper_type", "quantity"],
            multiplier_keys: ["finish"],
            options_labels: {
              paper_type: "Paper Type",
              quantity: "Quantity",
              finish: "Finish",
            },
            options_values: {
              paper_type: ["matte"],
              quantity: ["500", "1000", "999"],
              finish: ["matte"], // narrowed — locked to "matte"
            },
            multipliers: {
              finish: {
                "500": { matte: 1, glossy: 1.2 },
                "1000": { matte: 1, glossy: 1.15 },
              },
            },
            custom_order_id: "fake_co_for_narrowing_test",
          },
        });

        const resp = await api
          .post(`/store/carts/${cartId}/line-items-custom`, {
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
                    finish: "glossy", // declared on catalog but narrowed out on saved
                  },
                },
              },
            ],
          })
          .catch((err) => err.response);
        expect(resp.status).toBe(400);
        expect(String(resp.data?.message ?? resp.data)).toMatch(/finish/);
        expect(String(resp.data?.message ?? resp.data)).toMatch(/glossy/);
      });
```

- [ ] **Step 8: Run unit and integration tests — verify they fail in the expected ways**

Run:

```bash
yarn test:unit src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts
```

Expected outcomes against the unchanged helper:
- Q-B FIX-LOUD inverted test → FAIL (helper still throws "No multiplier row...")
- Three new membership tests → FAIL (helper has no membership check yet; "linen" passes the helper today, then throws on missing row with a different message)

Run:

```bash
yarn test:integration:http -t "Non-apparel cart contract"
```

Expected:
- Test 12 inverted → FAIL (helper still throws 400 on missing row)
- Test 12c (membership violation) → FAIL or pass-with-wrong-error (no membership; depending on row, may throw different 400)
- Test 12d (saved-product lock) → FAIL (helper has no membership)

The exact failure messages are diagnostic, not blocking. Confirm the failures match the expected pattern; do not fix the tests.

- [ ] **Step 9: Implement the helper change**

Edit `src/workflows/pricing/utils/calculate-promo-print-price.ts`. Two edits inside the existing function body — no new helpers, no new files.

First, add a destructure of `options_values` after line 34 (after the `multipliers` destructure, before the `allRequiredKeys` line at `:36`):

```typescript
  const optionsValues = (metadata as Record<string, unknown>).options_values as
    | Record<string, string[]>
    | undefined
    ?? {};
```

Second, replace the existing per-multiplier-code loop body at lines 83-96. Replace these exact lines:

```typescript
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
```

With:

```typescript
  for (const [code, selectedValue] of Object.entries(multiplierOptions)) {
    // Membership check (Phase 2): submitted multiplier value must be in
    // product.metadata.options_values[code]. For saved products, Phase 1
    // narrows options_values[k] to [approvedValue] — the membership rule
    // produces the cart-add lock as a structural consequence.
    const declared = optionsValues[code];
    if (!declared?.includes(selectedValue)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Submitted value '${selectedValue}' for option '${code}' is not declared in options_values; declared values: ${JSON.stringify(declared ?? [])}`,
      );
    }

    // Surcharge-row absence for a declared value defaults to factor 1.0
    // (Phase 2 inverts Q-B FIX-LOUD). The shipped multiplier CSVs are
    // only-surcharges shape — declared no-surcharge values legitimately
    // have no row.
    const factor = multipliers[code]?.[quantityValue]?.[selectedValue];
    finalPrice *= factor ?? 1.0;
  }
```

- [ ] **Step 10: Run unit and integration tests — verify all pass**

Run:

```bash
yarn test:unit src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts
```

Expected: all 6 tests pass (3 pre-existing + inverted Q-B + 3 new membership).

Run:

```bash
yarn test:integration:http -t "Non-apparel cart contract"
```

Expected: full describe block passes — including inverted Test 12, new Test 12c, new Test 12d, and all pre-existing Phase-1 tests (which now find `options_values` on the fixture and pass through membership cleanly).

If any test fails, do NOT proceed to commit. Investigate, fix the helper or test, re-run.

- [ ] **Step 11: Commit**

```bash
git add src/workflows/pricing/utils/calculate-promo-print-price.ts \
        src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts \
        integration-tests/http/non-apparel-cart.spec.ts
git commit -m "feat(div-100): cart-add multiplier contract — options_values membership + factor 1.0 default

Replaces Q-B FIX-LOUD throw on missing multiplier rows with factor 1.0
default for declared values, gated by a new membership check that
rejects any submitted multiplier value not in product.metadata.options_values[code].

The cart-add lock for non-apparel saved products emerges as a structural
consequence: Phase 1 narrows options_values[multiplierKey] to a
single-element [approvedValue], so the membership rule rejects any
non-approved submission without a saved-product-specific code path.

Per spec §5, §6, §6.5. Helper change is two surgical edits inside the
existing per-multiplier loop (membership pre-check + factor default).
Test fixtures updated to populate options_values; Test 12 inverted; new
unit and integration tests cover declared-passes, undeclared-throws,
undefined-throws, and saved-product-lock-rejects."
```

---

## Task 2: Reorder gate widening + saved-product reorder happy path

> **Confidence: High** — implements [spec §4 — Reorder Gate Widening](./spec.md#4-reorder-gate-widening) and the positive reorder happy-path criterion in [§7](./spec.md#7-success-criteria). Gate predicate verified at `src/api/store/carts/[id]/custom-complete/route.ts:248-252`; downstream block product-type-agnostic at `:268-281`. Existing approve-proof-non-apparel test scaffold verified at `integration-tests/http/approve-proof-non-apparel.spec.ts` (Phase 1 already creates a real saved product with `metadata.custom_order_id` pointing to a real custom_order — exactly what the reorder shortcut needs).

**Files:**
- Modify: `src/api/store/carts/[id]/custom-complete/route.ts:248-252` (gate predicate + bookmark comment)
- Modify: `integration-tests/http/non-apparel-cart.spec.ts:595-663` (delete Test 15b — the apparel-only-gate assertion is reversed by Phase 2)
- Modify: `integration-tests/http/approve-proof-non-apparel.spec.ts` (append a new test that exercises cart-add → custom-complete on the saved product created earlier in the same describe block)

**Soldier dispatch prompt prefix (every step in this task):** Invoke `Skill(skill: "medusa-dev:building-with-medusa")` on arrival. Filter against AI-slop: do NOT add a company-lineage check at the gate (DIV-101 scope), do NOT add a `null`-check on `customOrder.product_name` (pre-existing apparel residual per spec §6.6), do NOT touch the downstream block at `route.ts:268-281`. The change is one boolean clause and a comment update.

- [ ] **Step 1: Delete Test 15b (the apparel-only-gate enforcement)**

Edit `integration-tests/http/non-apparel-cart.spec.ts`. Delete lines 595-663 in their entirety (the comment block at `:595-602` plus the `it("non-apparel ORDER does not trigger saved-product approval...")` test at `:603-663`). After deletion, Test 15 (the previous test) is followed directly by Test 16 (`non-apparel CATALOG proof flow preserves metadata end-to-end` at `:665`).

The Phase-2 contract reverses this assertion: a non-apparel ORDER with `custom_order_id` set DOES auto-approve. The replacement positive test lives in `approve-proof-non-apparel.spec.ts` (added in Step 4 below) where a real saved product is already constructed via approveProof — that test exercises the full reorder shortcut end-to-end against real backing state, which Test 15b's `fake_custom_order_seam_test` ID could not.

- [ ] **Step 2: Hoist `testRegionId` to the describe-block scope**

Edit `integration-tests/http/approve-proof-non-apparel.spec.ts`. The scaffold currently declares `testRegionId` as a `const` inside `beforeAll` (line 33), which puts it out of scope for `it(...)` tests added later. Hoist it.

In the `let`-declaration block at lines 22-26, add `testRegionId` to the describe scope. After the change, lines 22-27 should read:

```typescript
      let superadminToken = "";
      let publishableApiKey = "";
      let companyId = "";
      let customOrderId = "";
      let savedProductId = "";
      let testRegionId = "";
```

In `beforeAll` at line 33, change the declaration from `const` to assignment:

```typescript
        testRegionId = seedResult.region.id;
```

(remove the `const` keyword).

- [ ] **Step 3: Copy `setupPaymentSession` and `selectShippingMethod` helpers into the approve-proof file**

Edit `integration-tests/http/approve-proof-non-apparel.spec.ts`. After the closing `});` of `beforeAll` (around line ~258 — the line that closes the setup hook), and before the first `it(...)` test, add the two helper definitions copied verbatim from `integration-tests/http/non-apparel-cart.spec.ts:467-498`:

```typescript
      // Helper for ORDER cart completion. Mirrors the helper in
      // non-apparel-cart.spec.ts:467-475 — completeCartWorkflow's
      // validateCartPaymentsStep requires a session for ORDER carts.
      const setupPaymentSession = async (theCartId: string) => {
        const pcResp = await api.post("/store/payment-collections", {
          cart_id: theCartId,
        });
        const pcId = pcResp.data.payment_collection.id;
        await api.post(`/store/payment-collections/${pcId}/payment-sessions`, {
          provider_id: "pp_system_default",
        });
      };

      // Helper for ORDER cart completion. Mirrors the helper in
      // non-apparel-cart.spec.ts:485-498 — validateShippingStep refuses
      // checkout if any line item has requires_shipping=true with no
      // shipping method selected.
      const selectShippingMethod = async (theCartId: string) => {
        const optionsResp = await api.get(
          `/store/shipping-options?cart_id=${theCartId}`,
        );
        const option = optionsResp.data.shipping_options[0];
        if (!option) {
          throw new Error(
            `expected at least one shipping option for cart ${theCartId}`,
          );
        }
        await api.post(`/store/carts/${theCartId}/shipping-methods`, {
          option_id: option.id,
        });
      };
```

Do NOT introduce a shared util file. Helper duplication across two test files is acceptable for this scope; consolidation is a separate refactor.

- [ ] **Step 4: Append the positive saved-product reorder happy-path test**

Edit `integration-tests/http/approve-proof-non-apparel.spec.ts`. Find the closing `});` of the inner `describe("approveProof — non-apparel catalog proof", ...)` block (after the existing tests that cover saved-product creation, company link, sales-channel link, locked-base-options). Append a new test BEFORE that closing `});` so it inherits the existing setup (real proof → approveProof → saved product with real `metadata.custom_order_id`):

```typescript
      // Phase 2 — saved-product reorder happy path. The scaffold above has
      // already created a saved product (via approveProof). This test
      // cart-adds the saved variant, completes the cart as an ORDER proof,
      // and verifies the new sub-order is auto-approved (jobStatus
      // APPROVED, orderStatus PROOF_DONE, metadata.original_custom_order_id
      // matching the source custom_order). Per spec §4 (gate widening).
      //
      // Note: the scaffold's source product has multiplier_keys: [], so
      // the saved product carries no multiplier locks. The reorder happy
      // path tests THE GATE only; the multiplier lock is verified at the
      // helper level in Task 1.
      it("auto-approves a non-apparel saved-product reorder via custom-complete (APPROVED + PROOF_DONE)", async () => {
        const productModuleService: any = getContainer().resolve(Modules.PRODUCT);
        const [saved] = await productModuleService.listProducts(
          { metadata: { custom_order_id: customOrderId } },
          { relations: ["variants", "variants.options", "variants.options.option"] },
        );
        expect(saved).toBeDefined();
        const savedVariant = saved.variants[0];
        expect(savedVariant).toBeDefined();

        // Map the variant's option titles back to base codes via options_labels.
        const optionsLabels = (saved.metadata as Record<string, unknown>)
          .options_labels as Record<string, string>;
        const labelToCode: Record<string, string> = {};
        for (const [code, label] of Object.entries(optionsLabels)) {
          labelToCode[label] = code;
        }
        const baseOptions: Record<string, string> = {};
        for (const vo of (savedVariant.options ?? []) as any[]) {
          const code = labelToCode[vo.option?.title ?? ""];
          if (code) baseOptions[code] = vo.value;
        }

        // Echo any multiplier-locked values. For this scaffold's source
        // product, multiplier_keys is [] — lockedMultiplierOptions ends
        // up empty. Generic shape kept so the test pattern survives if
        // the scaffold gains multipliers later.
        const savedMultiplierKeys =
          ((saved.metadata as Record<string, unknown>).multiplier_keys as string[]) ?? [];
        const savedOptionsValues =
          ((saved.metadata as Record<string, unknown>).options_values as Record<string, string[]>) ?? {};
        const lockedMultiplierOptions: Record<string, string> = {};
        for (const k of savedMultiplierKeys) {
          if (savedOptionsValues[k]?.[0]) {
            lockedMultiplierOptions[k] = savedOptionsValues[k][0];
          }
        }

        // Create a fresh cart for the reorder.
        const reorderCartResp = await api.post("/store/carts", {
          currency_code: "usd",
          region_id: testRegionId,
          email: "admin@test-company.com",
        });
        const reorderCartId = reorderCartResp.data.cart.id;

        // Cart-add the saved variant.
        const cartAddResp = await api.post(
          `/store/carts/${reorderCartId}/line-items-custom`,
          {
            items: [
              {
                variant_id: savedVariant.id,
                quantity: 1,
                metadata: {
                  product_type: "print",
                  group_id: "g_reorder",
                  upload_ids: [],
                  options: { ...baseOptions, ...lockedMultiplierOptions },
                },
              },
            ],
          },
        );
        expect(cartAddResp.status).toBe(200);

        await setupPaymentSession(reorderCartId);
        await selectShippingMethod(reorderCartId);

        // Complete the cart as an ORDER proof (saved-product reorder path).
        const completeResp = await api.post(
          `/store/carts/${reorderCartId}/custom-complete`,
          { proof_type: ProofType.ORDER },
        );
        expect(completeResp.status).toBe(200);
        const completedOrderId = completeResp.data.order.id;

        const ordersResp = await api.get("/custom-order/orders");
        const myOrder = ordersResp.data.orders.find(
          (o: any) => o.orderId === completedOrderId,
        );
        expect(myOrder).toBeDefined();
        const subOrder = myOrder.subOrders[0];
        expect(subOrder.jobStatus).toBe("approved");
        expect(subOrder.orderStatus).toBe("proof_done");
        expect(subOrder.metadata?.original_custom_order_id).toBe(customOrderId);
      });
```

The required imports — `ProofType`, `Modules` — are already present in this file (`Modules` at line 2, `ProofType` at line 10). No new imports needed.

- [ ] **Step 5: Run the integration tests — verify the new happy-path fails and old Test 15b is gone**

Run:

```bash
yarn test:integration:http -t "approveProof — non-apparel catalog proof"
```

Expected: the new "auto-approves a non-apparel saved-product reorder via custom-complete" test FAILS — `subOrder.jobStatus` is NOT `"approved"` because the gate's apparel-only clause still rejects the non-apparel reorder.

Run:

```bash
yarn test:integration:http -t "Non-apparel cart contract"
```

Expected: full block passes; Test 15b is no longer present.

If the new test passes against the unchanged gate, halt and investigate — the gate is being bypassed somewhere unexpected, and the spec's premise is wrong.

- [ ] **Step 6: Modify the gate predicate at `custom-complete/route.ts:248-252`**

Edit `src/api/store/carts/[id]/custom-complete/route.ts`. Replace lines 248-252 exactly. The current block:

```typescript
      // Apparel-only saved-product gate (DIV-99 hardening): prevents non-apparel ORDER items from auto-approving via custom_order_id. Re-evaluate when DIV-100 introduces non-apparel saved-product creation.
      const isSavedProduct =
        proofType === ProofType.ORDER &&
        items[0]?.product?.metadata?.custom_order_id != null &&
        items[0]?.metadata?.product_type === "apparel";
```

Replace with:

```typescript
      // Saved-product reorder gate (DIV-100 Phase 2): non-apparel saved
      // products take the same shortcut as apparel. Cross-company lineage
      // hardening for both arms is DIV-101.
      const isSavedProduct =
        proofType === ProofType.ORDER &&
        items[0]?.product?.metadata?.custom_order_id != null;
```

Do NOT change the downstream block at `route.ts:268-281`. Do NOT add a `customOrder` undefined-guard at `:265` (pre-existing apparel residual per spec §6.6). Do NOT iterate `items` beyond `items[0]` (DIV-101 scope).

- [ ] **Step 7: Run integration tests — verify the happy-path passes and nothing else regresses**

Run:

```bash
yarn test:integration:http -t "approveProof — non-apparel catalog proof"
```

Expected: ALL tests in the block pass — saved-product creation tests (pre-existing) still green, new "auto-approves a non-apparel saved-product reorder" test now PASSES.

Run:

```bash
yarn test:integration:http -t "Non-apparel cart contract"
```

Expected: full block passes (Phase 1 cart contract tests + Phase 2 helper tests from Task 1 + Test 15b removed).

Run:

```bash
yarn test:integration:http
```

Expected: ALL integration tests in the suite pass. Apparel saved-product reorder tests in `proof-to-order.spec.ts` and `proof-to-catalog.spec.ts` continue to pass — Phase 2's gate change drops a clause that only narrowed apparel; widening it to non-apparel does not change apparel behavior.

If any unrelated test fails, halt and investigate. Do not commit until full green.

- [ ] **Step 8: Commit**

```bash
git add "src/api/store/carts/[id]/custom-complete/route.ts" \
        integration-tests/http/non-apparel-cart.spec.ts \
        integration-tests/http/approve-proof-non-apparel.spec.ts
git commit -m "feat(div-100): non-apparel saved-product reorder shortcut at custom-complete

Drops the apparel-only clause from the saved-product gate at
custom-complete/route.ts. A non-apparel saved product (created by
Phase 1's approveProof side effect) reordered via POST custom-complete
with proofType ORDER and a resolvable product.metadata.custom_order_id
now auto-approves to APPROVED + PROOF_DONE with
metadata.original_custom_order_id set, skipping proofing entirely.

Per spec §4. Gate change is one boolean clause + a comment update; the
downstream block is product-type-agnostic and untouched. No
cross-company lineage check (DIV-101 covers both arms). No
deleted-custom_order guard (pre-existing apparel residual per spec §6.6).

Test changes: deletes the apparel-only-gate enforcement (Test 15b in
non-apparel-cart.spec.ts:595-663 — its assertion is reversed by Phase
2), and adds a positive reorder happy-path test in
approve-proof-non-apparel.spec.ts that exercises the full lifecycle
(proof → approveProof → saved product → cart-add → custom-complete →
auto-approval) against real backing state."
```

---

## Post-Task Verification

After both tasks commit, run the full test suite once more:

```bash
yarn test:unit
yarn test:integration:http
yarn build
```

Expected:
- All unit tests pass.
- All HTTP integration tests pass.
- `yarn build` exits 0 (no TypeScript errors).

If any check fails, the legion halts and the failure is reported to the Imperator.

---

## Confidence Map

- **Pre-Flight: Spec Cross-Reference** — High. Direct citations to spec sections.
- **Task 1: Multiplier contract** — High. Eleven steps; every code block is the exact source the soldier types into the file. Test fixtures and assertions all derive from verified existing code (helper structure at `:1-104`, unit fixture at `:1-98`, integration fixture at `:30-103`).
- **Task 2: Reorder gate widening** — High on the gate change (one clause replacement, comment rewrite, line numbers verified). Medium-leaning-High on the reorder happy-path test scaffolding: the test relies on `setupPaymentSession`/`selectShippingMethod` helpers defined in `non-apparel-cart.spec.ts`. The plan instructs the soldier to inspect `approve-proof-non-apparel.spec.ts` for an existing helper pattern and either reuse or copy. If neither file has helpers usable as-is, the soldier must copy the two helper functions inline rather than refactor a shared util — refactoring is out of scope.
- **Post-Task Verification** — High. Standard `yarn test:unit` / `yarn test:integration:http` / `yarn build` triad.
