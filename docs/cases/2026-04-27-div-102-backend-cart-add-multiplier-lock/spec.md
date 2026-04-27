# DIV-102 — Backend cart-add multiplier-lock for saved products

**Status:** draft (iteration 1)
**Linear:** TBD — to be created
**Worktree branch:** TBD
**Stacked above:** DIV-100 (non-apparel saved product creation). DIV-100 ships with frontend-only enforcement of multiplier locks; DIV-102 adds the backend defense for both arms.

**Sister tickets:**
- **DIV-100** — Non-apparel saved product creation. Encodes the multiplier lock structurally on the saved product (single-element `options_values[multiplierKey] = [approvedValue]`) but does NOT enforce it server-side at cart-add. Frontend rendering reads the single-element array as a locked picker.
- **DIV-101** — Cross-company hijack defense at custom-complete.

---

## 1. Summary

A non-apparel saved product locks the customer's approved multiplier choices via single-element arrays in `options_values`. Today, that lock is *frontend-rendered only* — the storefront PDP picker renders a single-value array as a disabled picker, but a customer (or scripted client, or browser fuzz) can submit an arbitrary multiplier value at cart-add and the backend accepts it. Combined with DIV-100's reorder shortcut at custom-complete (auto-approval), the result: an order auto-approves with a multiplier configuration the customer never approved during proofing.

DIV-102 closes this seam by adding a backend cart-add validation for saved products. Five coordinated changes:

1. **Discriminator strengthening.** Use the *backing custom_order* as the source of truth for the lock, not just `product.metadata.custom_order_id`. A saved product is identified by both metadata presence AND a resolvable backing custom_order owned by the buying company. Stale `custom_order_id` from any other source (legacy migration, admin edit) does NOT trigger the lock check.
2. **Defensive metadata-shape guards.** Validate `product.metadata.multiplier_keys` is an array and `product.metadata.options_values[k]` is a non-empty array for every `k ∈ multiplier_keys` before reading the lock value. Malformed metadata produces a 400, not a TypeError.
3. **Absence semantics.** Treat absence (line-item omits `options[k]` for a locked code) as a mismatch — same 400 throw as wrong-value submission, with a distinguishing diagnostic ("omitted required locked value vs. submitted wrong value").
4. **Schema gate.** Modify `NonApparelMetadataSchema` to make `upload_ids` optional with a default of `[]` (saved-product reorders carry no new artwork, so the schema must admit empty `upload_ids`).
5. **Data-plane placement.** The validation lives inside `addPromoPrintPriceToCartWorkflow` (a new step or extension of the existing `calculatePromoPrintPricesStep`), NOT in the route handler at `line-items-custom/route.ts`. The pricing step already fetches the product with metadata; co-locating the validation avoids a duplicate fetch.

DIV-102 also adds an apparel-arm equivalent for any apparel saved product attributes that are metadata-locked (color/size locks are structural; if no metadata-only lock exists for apparel, the apparel arm needs only the schema/shape guards, not the multiplier-specific check).

> **Confidence: High** — derived from iter-6 of DIV-100 §10b plus four-lane verification convergence on the discriminator, defensive shape, absence semantics, and data-plane placement gaps.

---

## 2. Motivation

The lock semantic is broken without backend enforcement. Concrete scenario:

1. Customer in company A approves a non-apparel proof with `stapling: "Yes"` (locked, surcharge applies).
2. DIV-100 creates a saved product. Its `metadata.options_values.stapling = ["Yes"]` (single-element array — frontend will render as locked).
3. Customer (or scripted client) cart-adds the saved product variant with `metadata.options.stapling = "No"` directly to the API. Storefront UI never gets a chance to enforce the lock.
4. DIV-99 cart pricing computes a price (now correctly factor 1.0 for "No" per DIV-100 §10c). Cart-add succeeds.
5. Customer completes cart. DIV-100's gate widening + DIV-101's lineage check pass (same-company). The order auto-approves with `jobStatus: APPROVED, orderStatus: PROOF_DONE`.
6. The customer now has an APPROVED order whose multiplier configuration differs from what they approved at proofing. They paid less than the proofed price (no stapling surcharge) but the order ships as if proofed for "Yes".

This is the bypass the structural lock was meant to prevent. DIV-100 ships without the backend check (matching apparel's posture today, where the apparel lock is fully structural via variant retention so no metadata-only lock exists). DIV-102 closes the seam for non-apparel and adds parallel defenses for any future apparel metadata-only locks.

Four drivers for separating this from DIV-100:

- **Verification surface.** Five lanes converged on §10b of iter-6 needing more discipline than was specified: data-plane placement (route vs step), discriminator strength, absence semantics, defensive shape guards, schema gate. A focused ticket gives each its proper attention.
- **Apparel parity.** The cart-add lock pattern can extend to apparel metadata-only locks if/when introduced. DIV-102 defines the pattern; DIV-100 doesn't naturally touch apparel cart-add.
- **Schema change.** `NonApparelMetadataSchema` modification (`upload_ids` optional) is a contract change with cross-cutting implications (storefront request shape, integration test fixtures). Belongs in a focused ticket.
- **Defense in depth.** The frontend lock (single-element array → locked picker) is sufficient for legitimate users; the backend lock catches scripted bypass. Production data shows no current bypass attempts (the saved-product UI is out of scope per DIV-100 §3, so no users currently reach the cart-add bypass surface), so DIV-102 is hardening, not breach-response.

> **Confidence: High** — bypass scenario verified against route flow + DIV-99 schema; verification gaps from iter-6 of DIV-100 documented.

---

## 3. Non-goals

- **Saved-product creation logic.** That is DIV-100. DIV-102 only adds enforcement at cart-add.
- **Cross-company hijack defense.** That is DIV-101. DIV-102 reuses the lineage path (custom_order → order → company) but for a different purpose (saved-product identification).
- **Frontend lock rendering.** The storefront PDP picker rendering single-element arrays as locked pickers is unchanged. DIV-102 adds backend defense in depth, not replacement.
- **Apparel saved-product structural lock.** Apparel locks are structural (variant retention drops Color, narrows Size). No metadata-only lock exists today. DIV-102 defines the cart-add validation pattern; if/when apparel introduces a metadata-only lock, the same pattern applies. No code path is added for apparel today.
- **Workflow refactor of `addPromoPrintPriceToCartWorkflow`.** DIV-102 either adds a step OR extends the existing pricing step; the workflow shape is preserved.
- **Idempotency hardening of cart-add.** Out of scope.
- **Saved-product immutability enforcement.** A Medusa Admin user editing the saved product's metadata after creation could mutate the locked value. DIV-102's discriminator strengthening (use the *backing custom_order* as source of truth) provides partial mitigation — the lock validates against the original approval data, not the live saved-product metadata, so admin edits to saved-product metadata don't compromise the lock. Full enforcement (write-path guard on saved-product metadata) is its own ticket.

> **Confidence: High** — Imperator-confirmed scope decomposition.

---

## 4. Discriminator strengthening (boundary contract)

**Today's blocker.** DIV-100's saved-product encoding sets `product.metadata.custom_order_id`. The naive cart-add discriminator is "if this metadata field is set, run the lock check." Three failure modes:

- A non-apparel catalog product with stale or migrated `custom_order_id` (legacy migration, admin edit) would trigger the lock check, possibly with multi-element `options_values` (the catalog product was never narrowed). The check would fail every value except the first, breaking catalog cart-add for that product.
- A future code path that sets `custom_order_id` for purposes other than DIV-100 saved products would unexpectedly invoke the lock check.
- The discriminator is asserted by the spec but the reader's only guarantee is the metadata field — no validation that a real backing custom_order exists.

**The fix.** The discriminator is two-part:

1. `product.metadata.custom_order_id` is set (necessary).
2. The referenced custom_order **resolves** AND its owning company matches the buying company (necessary; reuses the lineage path from DIV-101 §7).

Only when both hold is the line-item identified as a saved-product reorder. Step 1 alone is insufficient; step 2 is the load-bearing part.

**Why this is stronger.** Stale `custom_order_id` from migration/edit/legacy resolves to a deleted or non-existent custom_order — fails step 2. The cart-add lock check is skipped; the catalog cart-add path is unaffected. (Note: cross-company hijack at cart-add is naturally blocked by step 2; that's a side benefit, not the primary purpose.)

**Resolution scope.** The cart-add path is per-line-item. For each non-apparel line-item with `custom_order_id` metadata, resolve the lineage at validation time. This adds one `query.graph` per locked line-item per cart-add. Performance: bounded by line-item count, low cardinality in practice (carts typically have 1-3 saved-product items max).

> **Confidence: High** — derived from Overconfidence GAP-2 of iter-6 verification (custom_order_id alone insufficient); reuses DIV-101's lineage path.

---

## 5. Validation logic + absence semantics (boundary contract)

**Trigger.** When the discriminator (§4) confirms a line-item is a saved-product reorder.

**Per multiplier code `k ∈ product.metadata.multiplier_keys`:**

1. **Defensive shape guard (§6).** Validate `product.metadata.options_values[k]` is a non-empty array. Validate `product.metadata.multiplier_keys` is an array.
2. **Read the locked value.** `lockedValue = product.metadata.options_values[k][0]`. (Single-element array invariant per DIV-100 §7c.)
3. **Compare.** Read `submittedValue = lineItem.metadata.options[k]`.
   - If `submittedValue === lockedValue`: pass.
   - If `submittedValue !== lockedValue`: throw 400 with diagnostic distinguishing two cases:
     - **Submitted wrong value:** `submittedValue` is set and `!== lockedValue`. Diagnostic: "Submitted value 'X' for code 'Y' on saved product 'Z'; locked value is 'W'."
     - **Submitted nothing (absence):** `submittedValue` is `undefined`. Diagnostic: "Required locked value for code 'Y' on saved product 'Z' was omitted; expected 'W'."

**Why distinguishing absence from mismatch.** A storefront UI bug (request body fails to echo locked codes) produces absence; a deliberate bypass attempt produces mismatch. The diagnostic helps debug. Both throw 400 — same status code, different messages.

**Trim semantics.** Per DIV-100 §11 case 7, `submittedValue` is trimmed; whitespace-only submissions are treated as absence (after trim, the value is empty).

> **Confidence: High** — derived from Edge-case GAP-1 (absence semantics) + Failure-mode GAP-3 (defensive shape need).

---

## 6. Defensive metadata-shape guards (boundary contract)

DIV-100 §11 case 8 enforces source-product metadata invariants at approve-proof time. DIV-102 adds the cart-add equivalent for saved products:

**At cart-add time, per saved-product line-item:**

1. `product.metadata.multiplier_keys` is an array (possibly empty). If undefined or non-array: throw 400 ("saved product 'Z' has malformed multiplier_keys metadata; contact admin").
2. For every `k ∈ multiplier_keys`: `product.metadata.options_values[k]` is a non-empty array. If undefined or empty: throw 400 ("saved product 'Z' has malformed options_values for code 'Y'; contact admin").

**Why guard at cart-add and not just at creation.** Saved-product immutability is asserted but not enforced (DIV-100 §13). A Medusa Admin user editing the saved product's metadata after creation could leave the multiplier_keys array intact while emptying `options_values[k]`, or replace the multiplier_keys with `undefined`. The cart-add guards catch this corruption with a clear diagnostic (admin-driven malformation) rather than a TypeError. Better UX, same security posture.

**Failure mode if the guard fires.** The customer cannot cart-add the saved product. They see a 400 with a "contact admin" diagnostic. The admin (or DIV-102 ops monitor) notices and fixes the saved-product metadata. Customer retries.

> **Confidence: High** — derived from Assumption GAP-3 of iter-6 verification.

---

## 7. Schema gate — `NonApparelMetadataSchema.upload_ids` optional (boundary contract)

**Today's blocker.** `NonApparelMetadataSchema` at `src/modules/custom-order/non-apparel-type.ts:14-28`:

```
export const NonApparelMetadataSchema = z
  .object({
    product_type: z.string()...,
    group_id: z.string(),
    upload_ids: z.array(z.string()),    // REQUIRED
    options: z.record(z.string(), z.string()),
    options_labels: z.record(z.string(), z.string()).optional(),
    product_name: z.string().optional(),
    design_notes: z.string().optional(),
  })
  .strict();
```

`upload_ids` is required (no `.optional()`). A saved-product reorder cart-add carries no new artwork — the design was already approved at proofing. The storefront request body for a saved-product reorder would either:

(a) Send `upload_ids: []` explicitly. The schema accepts this — array is required, empty array is valid.
(b) Omit `upload_ids` entirely. The schema rejects this — 400 from the gate at `src/api/store/carts/type.ts:50-55` (`lineItemMetadataSchema`).

If option (a): the spec is sufficient; no schema change needed. The contract requirement is "storefront MUST send `upload_ids: []` for saved-product reorders."

If option (b) is preferred (cleaner storefront contract): make `upload_ids` optional with default `[]`.

**The decision.** Make `upload_ids` optional with default `[]`. Rationale:

- The storefront (out of scope per DIV-100 §3) doesn't yet exist for saved-product reorders. When it ships, requiring it to send empty arrays is fragile contract design.
- Schema-level optionality with default makes the contract "saved-product reorders carry zero new uploads" naturally expressible.
- Cost: one Zod modifier change + propagation to any downstream readers that assume `upload_ids` is always defined. Recon at plan time identifies readers.

**The change.** `upload_ids: z.array(z.string()).default([])` (or `.optional()` if `.default()` is awkward downstream).

**Downstream readers to verify at plan time.**

- `src/api/custom-order/order-flow.ts:230` reads `metadata.upload_ids` for the `hydrateImages` call. Default `[]` produces no uploads — saved-product reorders correctly skip image hydration (they reuse the saved product's existing images per DIV-100 §9).
- Other readers TBD via recon at plan time. The plan must enumerate them and verify default-`[]` is safe.

> **Confidence: High** — derived from Assumption GAP-2 of iter-6 verification.

---

## 8. Data-plane placement — pricing step, not route handler (boundary contract)

**The choice.** Two possible locations for the validation:

**(a) Route handler.** Add the validation in `src/api/store/carts/[id]/line-items-custom/route.ts:50-65` (the non-apparel branch). The route fetches each line-item's product (variant → product lookup), runs the discriminator + validation, then dispatches `addPromoPrintPriceToCartWorkflow`.

**(b) Pricing step.** Add the validation inside `addPromoPrintPriceToCartWorkflow`, either as a new step before `calculatePromoPrintPricesStep` or as an extension of `calculatePromoPrintPricesStep` itself. The step already fetches the product with metadata at `src/workflows/pricing/steps/calculate-promo-print-prices.ts:88-107`; the validation co-locates with the data.

**The decision.** Option (b) — pricing step.

**Why.** The route handler at `line-items-custom/route.ts:50-65` performs no per-line-item product fetch today. The non-apparel branch maps `nonApparelItems` to `{variant_id, quantity, metadata}` and dispatches the workflow. Adding the validation at the route layer would require a new product fetch per line-item — a duplicate of the fetch the workflow step already performs. Option (b) avoids the duplicate.

**Implementation shape.**

- **Sub-option (b1):** New step `validateSavedProductLockStep` that runs before `calculatePromoPrintPricesStep`. Fetches the product (or receives it from a shared upstream step), runs the lineage discriminator (§4), the defensive guards (§6), and the validation (§5). Throws 400 on failure. Output: pass-through cart items.
- **Sub-option (b2):** Extend `calculatePromoPrintPricesStep` to include the validation as an inline check before pricing computation. The step already has the product loaded; adding a validation block is small.

The plan picks the cleaner sub-option. Spec mandates option (b) overall.

**Failure-shape implication.** If the pricing step throws 400, the cart-add fails with the same workflow-error path as DIV-99's "missing required options" or "no variant matches" failures. The customer sees a 400 with the diagnostic; cart-add does not modify cart state.

> **Confidence: High** — derived from Censor GAP-2 + Overconfidence CONCERN-2 + Assumption CONCERN-2 of iter-6 verification (data-plane convergence on workflow-internal placement).

---

## 9. Error semantics (boundary contract)

The cart-add lock validation throws 400 when:

1. **Discriminator step 2 fails (line-item carries `custom_order_id` but no resolvable backing custom_order).** Throw 400 with diagnostic ("custom_order with id X referenced by saved product 'Z' does not resolve"). Distinct from DIV-101's lineage check at custom-complete (which throws 403 on cross-company); at cart-add, the 400 catches admin-driven corruption (admin deletes a custom_order). Cross-company hijack at cart-add is implicitly blocked but does not produce a 403 here — it produces the same 400 (the discriminator simply doesn't match, so the lock check is skipped, but the cart-add proceeds; 403 happens at custom-complete via DIV-101).

   **Refinement.** If the line-item carries `custom_order_id` AND the resolved custom_order owns by a *different* company, treat this as a stronger error: throw 403 at cart-add with "lineage mismatch" diagnostic. This catches cross-company hijack at the earliest possible point (before cart-add succeeds), reducing the attack surface DIV-101 has to defend at custom-complete.

2. **Defensive shape guard fails (per §6).** Throw 400 with admin-corrupted-metadata diagnostic.
3. **Submitted multiplier value mismatch (per §5).** Throw 400 with mismatch-or-absence distinguishing diagnostic.

**Recovery posture.** Cart-add validation runs before the cart is mutated. A throw leaves the cart unchanged; the customer can retry after fixing the request (or contacting admin for case 2). No partial state.

> **Confidence: High** — three throw cases; recovery posture documented.

---

## 10. Source-file scope, integration tests, idempotency

**Source-file scope.** Three files:
- `src/api/store/carts/[id]/line-items-custom/route.ts` — no new validation logic; the route continues to dispatch `addPromoPrintPriceToCartWorkflow`. The workflow internalizes the new validation. Verify at plan time whether the route file changes at all (it may not).
- `src/workflows/pricing/steps/calculate-promo-print-prices.ts` (or a new sibling step file in the same directory) — the saved-product lock validation logic per §8 sub-option (b1) or (b2).
- `src/modules/custom-order/non-apparel-type.ts` — `upload_ids` schema change per §7.

**Integration test scope.** Four additions to `integration-tests/http/non-apparel-cart.spec.ts`:

1. **Saved-product locked-multiplier-mismatch test.** Approve a non-apparel proof with `stapling: "Yes"` (locked). Construct a fresh cart, attempt cart-add of the saved variant with `metadata.options.stapling = "No"`. Assert 400 with mismatch diagnostic.
2. **Saved-product locked-multiplier-absence test.** Same setup. Cart-add omits `stapling` from `metadata.options` entirely. Assert 400 with absence diagnostic.
3. **Saved-product reorder happy path.** Cart-add of saved variant with correctly echoed locked values + valid quantity. Assert 200 (cart-add succeeds, pricing computed).
4. **Catalog product with stale `custom_order_id` metadata.** Create a non-apparel catalog product with `metadata.custom_order_id = "co_nonexistent"`. Cart-add with multi-element `options_values` configurations. Assert: cart-add succeeds (the stale `custom_order_id` does NOT trigger the lock check because the discriminator step 2 fails); the catalog cart-add path is unaffected.

(Plus: the cross-company hijack at cart-add is naturally blocked by the discriminator. Add an integration test asserting cart-add returns 403 if the saved product's `custom_order_id` resolves to a different company. This shares the lineage resolver with DIV-101.)

**Unit test scope.** Cover the new step (or step extension) in isolation:
- Discriminator pass/fail cases (resolves + same company / resolves + different company / unresolvable).
- Defensive shape guards (multiplier_keys not array / options_values[k] empty / options_values[k] missing).
- Validation pass/fail cases (match / mismatch / absence).
- Schema gate (`upload_ids` optional with default).

**Idempotency posture.** Validation is read-only. No idempotency change.

> **Confidence: High** — three-file scope; tests cover discriminator + shape + validation + schema.

---

## 11. Out-of-scope but adjacent (acknowledged)

- **Saved-product creation logic.** That is DIV-100.
- **Cross-company hijack defense at custom-complete.** That is DIV-101. DIV-102 reuses the lineage resolver at cart-add as defense in depth.
- **Frontend lock rendering.** Unchanged.
- **Apparel cart-add lock.** No metadata-only apparel lock exists today; DIV-102 defines the pattern but adds no apparel code path.
- **Saved-product immutability enforcement.** Asserted by DIV-100 §13, partially mitigated by DIV-102 §4 (validate against backing custom_order, not live metadata). Full enforcement is its own ticket.
- **Workflow refactor of `addPromoPrintPriceToCartWorkflow`.** Adding a step or extending an existing step is allowed; refactoring the workflow shape is out of scope.
- **Idempotency hardening of cart-add.** Out of scope.
- **The pricing route's value-membership check (DIV-100 §10c part 2).** That ships with DIV-100. DIV-102's lock check is on saved products only; the pricing route's check is on all non-apparel cart-adds.

> **Confidence: High** — Imperator scope decisions.

---

## 12. Success criteria (observable outcomes)

1. A cart-add request for a saved-product variant whose line-item `metadata.options[k]` differs from the saved product's `options_values[k][0]` for any `k ∈ multiplier_keys` returns 400 with a mismatch diagnostic naming the locked code, expected value, submitted value, saved-product handle.
2. Same setup but `metadata.options[k]` is absent (omitted from the request body): returns 400 with an absence diagnostic distinguishing the omission from a wrong-value submission.
3. A cart-add request for a saved-product variant whose line-item `metadata.options[k]` correctly echoes the saved product's locked value for every `k ∈ multiplier_keys` succeeds (200, pricing computed, line-item added).
4. A cart-add request for a non-apparel catalog product (no `custom_order_id` in metadata) is unaffected by DIV-102 — the lock check does not run; cart-add succeeds per DIV-99 contract.
5. A cart-add request for a non-apparel catalog product with a stale or admin-edited `custom_order_id` that does not resolve to an existing custom_order is unaffected by DIV-102 — the discriminator step 2 fails; the lock check is skipped; cart-add succeeds.
6. A cart-add request for a saved product whose `custom_order_id` resolves to a custom_order owned by a different company returns 403 with lineage-mismatch diagnostic. Cross-company hijack blocked at the earliest point.
7. A cart-add request for a saved product whose metadata has been corrupted (admin-edited `multiplier_keys` to non-array, or `options_values[k]` emptied) returns 400 with an admin-corrupted-metadata diagnostic. Customer cannot cart-add until admin remediation.
8. `NonApparelMetadataSchema.upload_ids` accepts both omitted and `[]` shapes; default is `[]`. Saved-product reorder request bodies that omit `upload_ids` are no longer rejected by the cart-add gate.
9. The validation lives inside `addPromoPrintPriceToCartWorkflow` (workflow step or step extension), NOT in the route handler. The route handler at `line-items-custom/route.ts:50-65` is unchanged or minimally changed.
10. Apparel cart-add behavior is unchanged. DIV-102 adds no apparel code path.

---

## 13. Confidence map (rolled up)

| Section | Confidence | Evidence anchor |
|-|-|-|
| 1. Summary | High | Decomposed from iter-6 §10b of DIV-100 + four-lane convergence on placement, discriminator, defensive shape, absence, schema. |
| 2. Motivation | High | Bypass scenario verified against DIV-99 schema + cart route flow. |
| 3. Non-goals | High | Imperator-confirmed scope decomposition. |
| 4. Discriminator strengthening | High | Overconfidence GAP-2 of iter-6 verification; reuses DIV-101 lineage resolver. |
| 5. Validation + absence semantics | High | Edge-case GAP-1 + Failure-mode GAP-3. |
| 6. Defensive metadata-shape guards | High | Assumption GAP-3 of iter-6 verification. |
| 7. Schema gate | High | Assumption GAP-2 of iter-6 verification; downstream-reader audit deferred to plan. |
| 8. Data-plane placement | High | Censor GAP-2 + Overconfidence CONCERN-2 + Assumption CONCERN-2 convergence. |
| 9. Error semantics | High | Three throw cases; cart-add cross-company refinement to 403 documented. |
| 10. Source-file scope + tests | High | Three-file scope; four integration + unit coverage of all branches. |
| 11. Adjacent out-of-scope | High | Imperator scope decisions; immutability partial-mitigation noted. |
| 12. Success criteria | High | Ten criteria covering apparel + non-apparel + stale-id + admin-corruption + happy-path. |
