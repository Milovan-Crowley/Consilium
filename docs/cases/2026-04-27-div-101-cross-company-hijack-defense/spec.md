# DIV-101 — Cross-company hijack defense (lineage hardening)

**Status:** draft (iteration 1)
**Linear:** TBD — to be created
**Worktree branch:** TBD
**Stacked above:** DIV-100 (non-apparel saved product creation on approve-proof). DIV-101 hardens what DIV-100 keeps as a basic check.

**Sister tickets:**
- **DIV-100** — Non-apparel saved product creation. Ships with a basic lineage check at the gate (post-completeCart, items[0]-only) — equivalent to iter-5 B3 of DIV-100 — to avoid widening the existing apparel hijack vector.
- **DIV-102** — Backend cart-add multiplier-lock for saved products.

---

## 1. Summary

The cart→order reorder gate at `src/api/store/carts/[id]/custom-complete/route.ts` decides "is this a saved-product reorder?" by reading `items[0]?.product?.metadata?.custom_order_id`. The current code blindly trusts that signal — it does NOT verify the referenced `custom_order` belongs to the buying company. After DIV-100 widens the gate to non-apparel, DIV-100 ships with a basic lineage check at the gate (post-completeCart, items[0]-only) so the widening does not expand the hijack vector.

DIV-101 hardens that lineage check end-to-end, applying the same hardening to the apparel arm that exhibits the same vulnerability today. Three coordinated changes:

1. **Pre-flight timing.** Move the lineage check from post-completeCart to before `completeCartWorkflow` (line 172 in current code) so failed validation does NOT produce a partially-created order.
2. **Iterate all items per group.** Replace `items[0]`-only reads with full iteration across every line-item in every group; reject mixed-saved-product groups (group homogeneity).
3. **Cart-fetch extension.** The existing cart query at `route.ts:41-57` does not recurse into `items.product.metadata`. Extend the query to include `items.variant.product.metadata` (or issue a separate pre-flight query) so the lineage check has data to operate on at pre-flight time.

Plus a documented policy on the multi-order edge: the `order-custom-order.ts` link is `isList: true`, so a `custom_order` can resolve to multiple orders in pathological states. DIV-101 specifies the rejection contract for that case.

> **Confidence: High** — derived from iter-6 of DIV-100 (which originally absorbed this hardening) and the five-lane verification that surfaced the cart-fetch and isList:true gaps. Decomposition Imperator-confirmed.

---

## 2. Motivation

The vulnerability exists today for apparel. The current gate at `src/api/store/carts/[id]/custom-complete/route.ts:248-252` reads:

```
isApparelSaved =
  proofType === ProofType.ORDER &&
  items[0]?.product?.metadata?.custom_order_id != null &&
  items[0]?.metadata?.product_type === "apparel"
```

When the gate evaluates true, the route enters the saved-product branch at lines 256-264 which fetches `customOrder.product_name` without any company-ownership check. A buyer in company A whose cart contains a product with `metadata.custom_order_id` pointing to a custom_order owned by company B would auto-approve (jobStatus=APPROVED, orderStatus=PROOF_DONE) and bypass proofing. The auto-approval was a deliberate fast-turn shortcut for legitimate reorders; the missing lineage check turns it into a hijack vector.

DIV-100's gate widening (drop apparel-only clause) makes the vector applicable to non-apparel saved products too. DIV-100 includes a basic lineage check at the gate so the widening does not expand the hole. DIV-101 is the focused security ticket that closes the hole properly for both arms.

Three drivers for separating this from DIV-100:

- **Scope discipline.** DIV-100 is "saved-product creation"; DIV-101 is "lineage defense." Decomposition keeps each ticket verifiable in one pass.
- **Apparel benefit.** The hardening applies to the apparel arm too; DIV-100 wouldn't naturally touch apparel.
- **Verification surface.** Five lanes converged on the lineage check needing more discipline than iter-6 of DIV-100 specified (cart-fetch extension was a missing implementation contract; isList:true traversal was an undocumented edge). A focused ticket gives the hardening proper attention.

> **Confidence: High** — vulnerability confirmed by recon against route handler + link models; iter-6 verification surfaced the gaps DIV-101 closes.

---

## 3. Non-goals

- **Saved-product creation logic.** That is DIV-100. DIV-101 only hardens the validation gate at custom-complete; the saved-product creation path at approveProof is untouched.
- **Cart-add multiplier-lock enforcement.** That is DIV-102.
- **Workflow refactor of the custom-complete route handler** to use proper compensation steps. Out of scope.
- **Replacing `completeCartWorkflow` ordering** (the workflow runs at line 172 in the current code). DIV-101 inserts the lineage check BEFORE this line; it does not modify or replace `completeCartWorkflow` itself.
- **Idempotency hardening of approveProof / custom-complete.** Out of scope.
- **Storefront UI changes.** Customers in valid lineage continue to see the existing UX; rejected hijack attempts return a generic 403/400 from the backend. Storefront error rendering is unchanged.

> **Confidence: High** — Imperator-confirmed scope decomposition.

---

## 4. Pre-flight lineage validation timing (boundary contract)

**Location.** Insert pre-flight validation in `src/api/store/carts/[id]/custom-complete/route.ts` BEFORE the `completeCartWorkflow.run({ input: { cart_id } })` call (currently at line 172). The validation must run before any order is created so failed validation does not produce a partially-created order that requires customer-service cleanup.

**Behavior.** For each line-item across every group (per §5 iteration), if `lineItem.product.metadata.custom_order_id` is set:

1. Resolve the referenced `custom_order` (existence check). If unresolvable: throw 400 with diagnostic naming the offending `custom_order_id` and line-item id.
2. Resolve the custom_order's owning company via the lineage path (§7).
3. If the resolved owning company !== buying company (`companyId` resolved at `route.ts:91`): throw 403 with diagnostic naming the line-item id, the buying company handle, and a generic "lineage mismatch" indicator. Do NOT leak the actual owning company handle to the buyer (defense in depth — minimize information disclosure on hijack attempts).

**Why pre-flight, not post-gate.** The current shape (DIV-100's basic check at the gate, post-completeCart) leaves a partially-created order on rejection: the order is committed, payment may have been captured, the customer sees a 403 but the order exists in PROOFING state and customer service has to reconcile. Pre-flight rejection means no order, no payment capture, no reconciliation.

**Transient-error posture.** A `query.graph` failure during pre-flight (database connectivity drop, replica lag, transient timeout) throws `UNEXPECTED_STATE`. Retry posture: cart completion is idempotent on the cart side (no order was created), so the customer can retry the request. Documented diagnostic.

> **Confidence: High** — pre-flight timing was iter-6 C2(c) of DIV-100; verified against route flow at `route.ts:41-282`.

---

## 5. Iterate all items per group + group homogeneity (boundary contract)

**Today's bug.** The existing per-group loop at `route.ts:247-282` reads `items[0]` for both `isSavedProduct` evaluation AND `productName` resolution. A group with a saved-product `items[0]` plus a non-saved-product `items[1]` evaluates the gate true on the first item only; the remaining items are never inspected.

**The fix.** For each `groupedOrderLineItems` group:

1. **Iterate every line-item.** Evaluate the gate predicate per-item; collect the per-item result.
2. **Group homogeneity.** If a group contains a mix of saved-product and non-saved-product items, reject the entire group with 400 ("mixed saved-product group"). This is consistent with the DIV-99 "mixed apparel/non-apparel cart" rejection at `line-items-custom/route.ts:42-47`.
3. **Per-item lineage.** If a group is homogeneously saved-product, run the lineage check (§4) for each line-item independently. Any single failure rejects the entire request. Defensive choice: a single 403/400 short-circuits the rest of the validation; the diagnostic names which line-item failed.

**Why group homogeneity, not per-item routing.** A mixed group would require the route handler to fork its post-gate behavior per line-item (some get the saved-product shortcut, some take fresh-proof flow). The handler is not currently structured for that fork; introducing it is out of scope. Rejection is the simpler boundary.

> **Confidence: High** — iter-6 C2(b) of DIV-100; consistent with DIV-99's mixed-cart rejection.

---

## 6. Cart-fetch extension (boundary contract)

**Today's blocker.** The cart fetch at `route.ts:41-57` reads:

```
fields: ['id', 'email', 'items.*', 'payment_collection.*', 'customer.*', 'customer.metadata', 'items.*', 'promotions.*']
```

`items.*` does NOT recurse into `items.product.metadata` or `items.variant.product.metadata`. At pre-flight time (before `completeCartWorkflow`), the route has the cart but not the order, so the existing post-completeCart pattern (`orderDetails.items[0]?.product?.metadata?.custom_order_id` at lines 248-252) is unavailable.

**The fix.** Extend the cart fetch field list to include `items.variant.product.metadata` (or `items.product.metadata` if the cart's items entity exposes product directly — verify against Medusa cart shape at implementation time). The lineage check reads from this extended payload at pre-flight.

**Alternative shape.** If the field-list extension is awkward for any reason (Medusa schema constraints, performance concerns on the cart fetch), an alternative is to issue a separate `query.graph` for line-item product metadata at pre-flight time, scoped to the cart's line-item ids. The plan picks the cleaner path; the spec mandates that the data IS available at pre-flight, by whatever fetch shape works.

**Performance posture.** The cart fetch is per-completeCart-request. Extending the field list adds one column to the existing query; the cost is bounded. A separate `query.graph` adds one round-trip per request. Either is acceptable for the auto-approve fast-path (which today already does multiple queries post-gate).

> **Confidence: High** — derived from Censor + Assumption lane convergence on cart-fetch as a missing data plane.

---

## 7. Lineage path traversal (boundary contract)

**Path.** `custom_order → order → company`.

- `custom_order` has NO `company_id` field. Verified against `src/modules/custom-order/models/custom-order.ts` (24 lines; only `id`, `proof_type`, `job_status`, `order_status`, `files`, `metadata`, `proof_notes`, `selections`, `product_name`, `timeline`, `version`).
- `custom_order ↔ order` link defined at `src/links/order-custom-order.ts` with `isList: true, deleteCascade: true`.
- `order ↔ company` link defined at `src/links/company-order.ts` with `isList: true`.

**Implementation.** `query.graph` traversal of `custom_order.order.company.id` is the natural shape; alternatively the link service can resolve. The plan picks the cleaner path; the spec mandates the path.

**The `isList: true` multi-order edge.** A single `custom_order` can be linked to multiple orders in pathological states:

- Manual admin re-link after a partial-failure remediation.
- Future code paths that mutate links rather than creating new custom_orders.
- DB-level partial cleanup (a reorder deleted the order but left the custom_order link).

In steady-state usage, a custom_order has exactly one order. DIV-101's rejection posture: if `custom_order.order` resolves to multiple orders, validate every `order.company.id` matches the buying company; fail closed (any mismatch throws 403). Log the multiplicity to ops as a data-quality signal.

**Why fail-closed on multi-order.** Silent first-match-wins (the natural defensive behavior) would let a buyer in company A hit a custom_order whose first-resolved order belongs to A but second-resolved order belongs to B — A passes the check, hijack succeeds via a route the validation didn't notice. Closed-fail is the only safe default; ops can re-link as needed.

> **Confidence: High** — verified against link definitions; multi-order edge raised by Assumption lane CONCERN.

---

## 8. Error semantics (boundary contract)

The pre-flight validation throws — does NOT silently downgrade to fresh-proof flow — when:

1. **Line-item carries `custom_order_id` that does not resolve.** Throw 400 with diagnostic ("custom_order with id X referenced by line-item Y does not exist"). Replaces the current implicit `undefined.product_name` crash at `route.ts:264`.
2. **Resolved custom_order's owning company !== buying company.** Throw 403 with generic "lineage mismatch" diagnostic. Do NOT leak the owning company handle.
3. **Multi-order resolution with any company mismatch.** Throw 403, fail-closed posture per §7.
4. **Mixed saved-product / non-saved-product group.** Throw 400 with diagnostic ("mixed saved-product group at <group key>").
5. **Transient `query.graph` failure during pre-flight.** Throw `UNEXPECTED_STATE` (the inherited 500 path at `route.ts:457-464`). Customer can retry; cart-side state is unchanged.

**Recovery posture.** Pre-flight rejection happens BEFORE `completeCartWorkflow` runs. The cart remains intact; no order is created; no payment is captured. Retry is safe.

**Inherited deleted-source-product silent fallthrough.** If an admin deletes a saved product between cart-add and `custom-complete`, the gate's `items[0]?.product?.metadata?.custom_order_id` resolves to undefined; `undefined != null` is false; gate evaluates false; cart silently downgrades to fresh-proof flow. This is inherited apparel behavior — DIV-101 does NOT address this fallthrough (it is outside the lineage check's scope; the gate itself produces undefined). Tracked separately.

> **Confidence: High** — error semantics derived from iter-6 §10 + iter-6 §11 case 10 + Assumption lane CONCERN on multi-order.

---

## 9. Source-file scope, integration tests, idempotency

**Source-file scope.** One file:
- `src/api/store/carts/[id]/custom-complete/route.ts` — pre-flight lineage validation (insertion before line 172), iterate-all-items, group homogeneity, cart-fetch extension. The basic lineage check that DIV-100 placed at the gate (post-completeCart, items[0]-only) is REPLACED by the pre-flight version; the spec mandates the replacement, not addition.

**Integration test scope.** Three additions to `integration-tests/http/non-apparel-cart.spec.ts` (or a parallel apparel test file if one exists; pick the cleaner home at plan time):

1. **Cross-company hijack negative test (non-apparel).** Inject `custom_order_id` on a non-apparel product's metadata pointing to a custom_order owned by a different company. Drive cart-completion as the buying company. Assert: request rejected with 403 BEFORE order creation (verify no order exists in DB after the failed call). This locks in the pre-flight timing AND the lineage rejection.

2. **Cross-company hijack negative test (apparel).** Same shape, apparel product. Asserts the hardening applies to both arms.

3. **Mixed-saved-product-group rejection test.** Construct a cart with one saved-product line-item and one non-saved-product line-item in the same group. Assert 400 with the mixed-group diagnostic.

(Other test surfaces — multi-order isList:true edge — are pathological enough that direct unit testing is more efficient than constructing an integration fixture. Plan picks the test home.)

**Unit test scope.** Add unit coverage for the lineage resolver helper (whatever shape the plan adopts). Multi-order isList:true posture is unit-test territory.

**Idempotency posture.** Pre-flight validation is read-only and side-effect-free. Repeated calls produce the same result. No idempotency change to the existing custom-complete handler.

> **Confidence: High** — single-file scope; tests cover apparel + non-apparel.

---

## 10. Out-of-scope but adjacent (acknowledged)

- **Saved-product creation logic.** That is DIV-100.
- **Cart-add multiplier-lock enforcement.** That is DIV-102.
- **Inherited deleted-source-product silent fallthrough at custom-complete.** Affects both arms; gate produces undefined on a deleted custom_order_id, gate evaluates false, customer silently downgrades. DIV-101 does NOT address this.
- **Workflow refactor of the custom-complete route handler.** Out of scope.
- **Replacing `completeCartWorkflow`.** Out of scope.
- **Storefront UX for hijack rejections.** Generic 403 from backend; storefront error rendering unchanged.

> **Confidence: High** — Imperator scope decisions.

---

## 11. Success criteria (observable outcomes)

1. A cart-completion request whose line-item carries `custom_order_id` referencing a custom_order owned by a different company is rejected with 403 BEFORE `completeCartWorkflow` runs. No order is created. No payment is captured. The diagnostic identifies the offending line-item.
2. Same-company saved-product reorders (the legitimate fast-turn shortcut) succeed unchanged. The lineage check is a strengthening, not a regression.
3. A cart-completion request whose line-item carries an unresolvable `custom_order_id` is rejected with 400 BEFORE `completeCartWorkflow` runs. Replaces the current implicit `undefined.product_name` crash.
4. A cart-completion request whose line-item resolves a `custom_order` linked to multiple orders, where any order belongs to a different company, is rejected with 403 (fail-closed multi-order posture).
5. A cart group containing a mix of saved-product and non-saved-product line-items is rejected with 400 (mixed-group). Same-group homogeneity enforced.
6. The cart fetch at the top of the custom-complete handler returns line-item product metadata in the pre-flight scope (cart-fetch extension or separate query.graph).
7. Apparel reorders gain the same hardening: a cross-company hijack attempt against an apparel saved product is rejected with 403 pre-flight.
8. The post-gate apparel-shaped surfaces (selections iteration, FREETSHIRT block, email subscriber) are not modified by DIV-101.
9. Pre-flight validation failures during transient `query.graph` errors throw `UNEXPECTED_STATE`; cart-side state unchanged; retry safe.

---

## 12. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Decomposed from iter-6 of DIV-100 (C2 corrections) + verification gaps. |
| 2. Motivation | High | Vulnerability traced to live route at `route.ts:248-264`. |
| 3. Non-goals | High | Imperator-confirmed scope decomposition. |
| 4. Pre-flight timing | High | iter-6 C2(c) of DIV-100; route flow verified. |
| 5. Iterate-all + group homogeneity | High | iter-6 C2(b) of DIV-100; consistent with DIV-99 mixed-cart rejection. |
| 6. Cart-fetch extension | High | Censor + Assumption convergence on missing data plane at pre-flight. |
| 7. Lineage path + isList:true | High | Verified against `models/custom-order.ts` + link defs; multi-order edge from Assumption CONCERN. |
| 8. Error semantics | High | Five throw cases; recovery posture documented. |
| 9. Source-file scope + tests | High | Single-file scope; three integration tests + unit coverage. |
| 10. Adjacent out-of-scope | High | Imperator scope decisions; deleted-source-product fallthrough explicitly NOT in scope. |
| 11. Success criteria | High | Nine criteria covering apparel + non-apparel + transient + multi-order edges. |
