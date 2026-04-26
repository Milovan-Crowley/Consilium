# DIV-99 Smoke Trace — DIV-94 / DIV-95 Closure Evidence

**Date:** 2026-04-25T05:22:48Z
**Branch:** feature/div-99-non-apparel-cart-contract
**Backend commit:** 8f12b61438cb4ce8cdf508d6ff9549ba035ebb2d
**Worktree:** /Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy
**Evidence type:** Assertion-confirmed HTTP integration transcript against controlled Medusa integration fixtures.

The integration suite at `integration-tests/http/non-apparel-cart.spec.ts` runs the full DIV-99 contract against an in-app Medusa runtime (`medusaIntegrationTestRunner({ inApp: true, env: {} })` at file:11–14) with controlled fixtures over a local Postgres 16 instance (`databaseUrl: 'postgres://milovan@localhost:5432/postgres'` per the test runner's printed `medusa-config` block at run start). Every DIV-94 and DIV-95 contract field is asserted by the suite. This document captures (a) the full run summary, (b) the canonical request bodies posted by the suite, and (c) the assertion list that proves each closure field.

The `inApp: true` runner boots a real Medusa instance, real route handlers, real workflows, and a real database. The HTTP responses are real — only the fixture data is controlled. This is closer to live smoke than to unit-test mock.

## Run output — 18/18 PASS

Verbatim trailing summary from `yarn test:integration:http --testPathPattern=non-apparel-cart` captured 2026-04-24 22:22 local at branch tip `8f12b61`:

```
PASS integration-tests/http/non-apparel-cart.spec.ts (46.705 s)
    Non-apparel cart contract (DIV-99)
      ✓ accepts a non-apparel item, prices it, stamps production_option_type (1609 ms)
      ✓ rejects a request whose variant_id does not match the resolved options (2073 ms)
      ✓ rejects when a base option key is missing (2005 ms)
      ✓ rejects when options.quantity is invalid ({"quantity": "0"}) (1861 ms)
      ✓ rejects when options.quantity is invalid ({"quantity": "abc"}) (1710 ms)
      ✓ rejects when options.quantity is invalid ({}) (1943 ms)
      ✓ rejects when upload_id does not exist (1866 ms)
      ✓ accepts empty upload_ids array (2173 ms)
      ✓ rejects mixed apparel + non-apparel in a single request (2013 ms)
      ✓ rejects when product_type is "" (1737 ms)
      ✓ rejects when product_type is "   " (2077 ms)
      ✓ rejects unknown `selections` key on non-apparel branch (strict) (2075 ms)
      ✓ rejects when no multiplier row exists for the submitted quantity tier (1848 ms)
      ✓ does not call listCustomOrderUploads when upload_ids is empty (2125 ms)
      ✓ orders list aggregates non-apparel quantity from metadata.options.quantity (3280 ms)
      ✓ orders list falls back to line_item.quantity and logs when options.quantity is malformed (2887 ms)
      ✓ non-apparel CATALOG proof flow preserves metadata end-to-end (3033 ms)
      ✓ ignores client-supplied unit_price; cart line uses server-computed price (2181 ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        46.761 s, estimated 47 s
Ran all test suites matching /non-apparel-cart/i.
```

Source log retained at `/tmp/div-99-non-apparel-cart-run.log` (1073 lines, captured via `tee`).

## DIV-94 closure proof — canonical contract round-trip

**Canonical evidence test:** Test 16, `non-apparel CATALOG proof flow preserves metadata end-to-end`, at `integration-tests/http/non-apparel-cart.spec.ts:582`. This is the densest contract-coverage test in the suite — it asserts `product_type`, `production_option_type`, `group_id`, `options` (deep-equal), and `options_labels` end-to-end on the **persisted ORDER line item** after cart-add → cart-complete (i.e., after the workflow boundary that other tests stop short of).

### Canonical cart-add request body

`POST /store/carts/:cartId/line-items-custom` (extracted from the test code at file:585–603):

```json
{
  "items": [
    {
      "variant_id": "<promoVariantIds.matte_500>",
      "quantity": 1,
      "metadata": {
        "product_type": "print",
        "group_id": "g_proof",
        "upload_ids": [],
        "options": {
          "paper_type": "matte",
          "quantity": "500",
          "finish": "matte"
        },
        "options_labels": { "finish": "Finish" }
      }
    }
  ]
}
```

The product fixture (file:35–91) defines `promoVariantIds.matte_500` against a `Test Business Cards` product with `metadata.base_option_keys = ["paper_type", "quantity"]`, `metadata.multiplier_keys = ["finish"]`, and a `multipliers.finish` matrix yielding the `multipliers.finish["500"].matte = 1` row used for pricing.

### Canonical response-shape assertions

After the cart is completed via `POST /store/carts/:cartId/custom-complete { proof_type: ProofType.CATALOG }` (file:605–608) the test resolves the persisted order from `Modules.ORDER.listOrders({ id: [completedOrderId] }, { relations: ["items"] })` (file:611–615) and asserts the following on `item.metadata` (`meta`):

- `expect(item.quantity).toBe(1)` — file:618 — confirms Medusa line-item quantity stays `1` for non-apparel (per DIV-95 quantity semantics).
- `expect(item.unit_price).toBe(0)` — file:619 — confirms CATALOG proof zero-prices the line.
- `expect(meta.product_type).toBe("print")` — file:621 — DIV-94 field.
- `expect(meta.production_option_type).toBe("print")` — file:622 — DIV-94 workflow-bridge stamp (added by the cart-add workflow's `calculate-promo-print-prices` step per Task 5 of the DIV-99 plan).
- `expect(meta.group_id).toBe("g_proof")` — file:623 — DIV-94 field.
- `expect(meta.options).toEqual({ paper_type: "matte", quantity: "500", finish: "matte" })` — file:624–628 — DIV-94 field, deep-equal proof of full options round-trip.
- `expect(meta.options_labels).toEqual({ finish: "Finish" })` — file:629 — DIV-94 field, label round-trip proof.

All seven assertions held in the run captured above (Test 16 reported `✓ ... (3033 ms)` at log line 1065).

### Cross-reference: cart-line metadata is also asserted directly on Test 1

Test 1 (`accepts a non-apparel item, prices it, stamps production_option_type`, file:152–179) confirms the same DIV-94 round-trip at the **cart line level** (before order completion):

- `expect(item.unit_price).toBe(60)` — file:176 — `50 × 1.2` (server-computed `glossy` price; client supplied no unit_price).
- `expect(item.metadata.product_type).toBe("print")` — file:177.
- `expect(item.metadata.production_option_type).toBe("print")` — file:178 (workflow stamp present at cart line stage, not just post-complete).

Test 1's cart-add request body (file:154–172) used `options.finish = "glossy"` to exercise the multiplier path; otherwise contract-shape identical to Test 16.

## DIV-95 closure proof — quantity semantics

### `subOrders[0].quantity === Number(metadata.options.quantity)` (NOT Medusa line-item `quantity: 1`)

**Canonical evidence test:** Test 14, `orders list aggregates non-apparel quantity from metadata.options.quantity`, at `integration-tests/http/non-apparel-cart.spec.ts:487`.

Cart-add request body (file:488–505):

```json
{
  "items": [
    {
      "variant_id": "<promoVariantIds.matte_500>",
      "quantity": 1,
      "metadata": {
        "product_type": "print",
        "group_id": "g_oa",
        "upload_ids": [],
        "options": {
          "paper_type": "matte",
          "quantity": "500",
          "finish": "matte"
        }
      }
    }
  ]
}
```

After cart completion (`proof_type: ProofType.ORDER`, file:510–512), the test issues `GET /custom-order/orders` (file:514) and asserts:

```ts
expect(orders.length).toBe(1);                  // file:516
const subOrder = orders[0].subOrders[0];        // file:517
expect(subOrder.quantity).toBe(500);            // file:518
```

Medusa stored `quantity: 1` on the line item (per the request) but the orders-list handler aggregated `subOrder.quantity = 500` from `metadata.options.quantity`. Held in the run captured above (Test 14 reported `✓ ... (3280 ms)` at log line 1063).

### Fallback + audit breadcrumb

**Canonical evidence test:** Test 15, `orders list falls back to line_item.quantity and logs when options.quantity is malformed`, at `integration-tests/http/non-apparel-cart.spec.ts:522`.

The test posts a normal non-apparel line with `options.quantity = "500"`, completes the cart, then directly mutates the persisted `metadata.options.quantity` to `"xyz"` via `Modules.ORDER.updateOrderLineItems` (file:561–569) to simulate corruption. It then re-fetches `GET /custom-order/orders` and asserts:

```ts
expect(ordersResp.status).toBe(200);            // file:572
const subOrder = ordersResp.data.orders[0]?.subOrders[0];   // file:573
expect(subOrder.quantity).toBe(1);              // file:574 — falls back to line_item.quantity
expect(warnSpy).toHaveBeenCalledWith(
  expect.stringContaining("[orders-list] non-apparel quantity fallback"),
);                                              // file:575–577
```

The `warnSpy` is `jest.spyOn(logger, "warn")` against the container-resolved logger (file:523–525). Held in the run captured above (Test 15 reported `✓ ... (2887 ms)` at log line 1064). The audit breadcrumb itself appeared at log line 1001 of the run output:

```
[orders-list] non-apparel quantity fallback: order=order_01KQ1HE29NHVQYBRBSWGHBPSN2 line_item=ordli_01KQ1HE29NCPKW7JVPWXK7QEP1 options.quantity={"finish":"matte","quantity":"xyz","paper_type":"matte"} falling back to line_item.quantity=1
```

This proves the `/custom-order/orders` handler falls back softly and logs the audit breadcrumb instead of crashing — the DIV-95 fallback contract holds end-to-end.

## Apparel regression gate

`yarn test:integration:http --testPathPattern=proof-to-catalog` summary block (verbatim from `/tmp/div-99-proof-to-catalog-run.log`):

```
FAIL integration-tests/http/proof-to-catalog.spec.ts (8.09 s)
    Proofing endpoints
      ✕ proof to catalog flow (2501 ms)
      ○ skipped reject proof to catalog flow

  ●  › Proofing endpoints › proof to catalog flow

    AxiosError: Request failed with status code 500

      194 |
      195 |         // Complete the cart using the custom-complete endpoint
    > 196 |         const completeCartResponse = await api.post(
          |                                      ^
      197 |           `/store/carts/${testCart.id}/custom-complete`,
      198 |           {
      199 |             proof_type: ProofType.CATALOG,

      at settle (node_modules/axios/lib/core/settle.js:19:12)
      at IncomingMessage.handleStreamEnd (node_modules/axios/lib/adapters/http.js:793:11)
      at Axios.request (node_modules/axios/lib/core/Axios.js:45:41)
      at Object.<anonymous> (integration-tests/http/proof-to-catalog.spec.ts:196:38)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 skipped, 2 total
Snapshots:   0 total
Time:        8.13 s, estimated 9 s
Ran all test suites matching /proof-to-catalog/i.
```

Underlying server error (verbatim, from log lines 740–770):

```
NoSuchKey: UnknownError
    at de_NoSuchKeyRes (.../@aws-sdk/client-s3/dist-cjs/index.js:5051:21)
    at de_CommandError (.../@aws-sdk/client-s3/dist-cjs/index.js:4950:19)
    at processTicksAndRejections (node:internal/process/task_queues:103:5)
    at .../@smithy/middleware-serde/dist-cjs/index.js:35:20
    at .../@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:484:18
    at .../@smithy/middleware-retry/dist-cjs/index.js:321:38
    at .../@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:110:22
    at .../@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:137:14
    at .../@aws-sdk/middleware-logger/dist-cjs/index.js:33:22
    at moveS3File (src/api/_utils/s3.ts:148:3)
    at moveUploadsToCustomOrder (src/api/_utils/s3.ts:182:20)
    at POST (src/api/store/carts/[id]/custom-complete/route.ts:351:26)
{
  '$fault': 'client',
  '$metadata': {
    httpStatusCode: 404,
    requestId: 'tx00000c80ad2835cdd408b-0069ec4fb9-245eb391-sfo2b',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  Code: 'NoSuchKey',
  BucketName: 'divinipress-store',
  RequestId: 'tx00000c80ad2835cdd408b-0069ec4fb9-245eb391-sfo2b',
  HostId: '245eb391-sfo2b-sfo2-zg02'
}
```

**Status:** Pre-existing file-storage fixture defect — failure occurs at S3 `NoSuchKey` inside `moveUploadsToCustomOrder` at `src/api/_utils/s3.ts:182` (calling `moveS3File` at `src/api/_utils/s3.ts:148`), NOT inside `validateShippingStep`. Per diagnosis at `/Users/milovan/projects/consilium-docs/cases/2026-04-24-div-99-custom-complete-shipping-gate/diagnosis.md` §8 + §12, this is a separate environment issue and is NOT a DIV-99 regression. The Imperator approved this characterization on 2026-04-24.

`proof-to-order` is NOT a regression gate either — see DIV-99 plan Task 12 Step 3 note: it posts to the BLOCKED `/store/carts/:id/line-items` route at `src/api/store/carts/middleware.ts:136–148` and is independent of DIV-99.

## Closure decision

- **DIV-94** — closure evidence sufficient. The canonical metadata contract (`product_type`, `options`, `options_labels`, `group_id`, `production_option_type`) round-trips end-to-end through cart-add → cart-complete → persisted order line item, asserted by Test 16 (and corroborated at the cart-line stage by Test 1).
- **DIV-95** — closure evidence sufficient. Non-apparel `subOrders[0].quantity` aggregates from `metadata.options.quantity` (=500 in the Test 14 fixture, despite Medusa line-item `quantity: 1`), with the malformed-input fallback + audit breadcrumb path also covered (Test 15).

The Imperator may attach this artifact to DIV-94 and DIV-95 in Linear before closing the tickets.
