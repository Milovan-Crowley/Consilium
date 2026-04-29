# DIV-100 — Saved-product reorder trust boundary

**Status:** verified draft  
**Linear:** DIV-100  
**Backend worktree:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-100-non-apparel-saved-product`  
**Branch:** `feature/div-100-non-apparel-saved-product`  
**Stacked after:** DIV-100 Phase 1 saved-product creation and Phase 2 reorder + multiplier contract  
**Intent:** final saved-product trust-boundary slice inside the same DIV-100 PR, not a separate ticket

---

## 1. Summary

DIV-100 now creates non-apparel saved products and lets saved products skip proofing on reorder. The remaining broken surface is the saved-product trust boundary:

1. A saved product is detected by `product.metadata.custom_order_id`.
2. Cart-add currently accepts a submitted variant id without proving that a saved product belongs to the buying company.
3. Cart completion currently trusts the saved-product marker and auto-approves the reorder without proving the original proof belongs to the buying company.
4. `proof_type: catalog` can still drive the catalog proof branch, which normalizes line items to quantity 1, unit price 0, and no shipping.

This slice closes those specific holes. A saved product may be added to a company cart only when the product is associated to the authenticated company. It may skip proofing only when its backing proof lineage resolves to that same company. Saved products must complete as `proof_type: order`, never `catalog`. Invalid saved-product ownership or lineage must reject before cart mutation, before payment/order creation, and before proof auto-approval.

---

## 2. Domain Contract

Saved products are company-owned Medusa products created when a catalog proof is approved. They are not bookmarks, not catalog blanks, and not globally orderable stock. The saved-product marker is `product.metadata.custom_order_id`, which points back to the original proof/custom_order.

Saved-product reorder is valid only when all of these are true:

- the request is authenticated as a company user;
- the cart's company association resolves from an authoritative company/customer/employee relationship and matches the authenticated company context;
- the saved product's backing `custom_order_id` resolves to an existing custom_order;
- the backing custom_order's owning order/company lineage resolves to the same company as the cart;
- the request is completing as `proof_type: order`;
- every line item in a custom-order group agrees on whether the group is saved-product reorder or proof-required order.
- every saved-product line item in the same group resolves to the same backing `custom_order_id`.

When those conditions hold, the existing saved-product reorder shortcut remains correct: the new custom_order starts `job_status: approved`, `order_status: proof_done`, and records `metadata.original_custom_order_id`.

When any condition fails, the backend must reject instead of silently downgrading, auto-approving, zero-pricing, or crashing.

---

## 3. Scope

**In scope:**

- Saved-product company-ownership validation when adding a saved-product variant to a company cart.
- Saved-product lineage validation before cart completion creates or mutates order state.
- Rejection of saved-product completion with `proof_type: catalog`.
- All-line-item evaluation for saved-product groups; no `items[0]` trust for saved-product decisions.
- Clear invalid-data vs access-denied error semantics for invalid saved-product lineage.
- Regression coverage for valid same-company reorder behavior.

**Out of scope:**

- Saved-product creation on proof approval. Already handled by DIV-100 Phase 1.
- Non-apparel multiplier lock and surcharge-row behavior. Already handled by DIV-100 Phase 2.
- General workflow refactor of cart completion. This does not exempt the new validation from Medusa's workflow/step discipline where the implementation introduces business validation around mutations.
- Idempotency redesign for approveProof or custom-complete.
- Frontend UI changes.
- Staff team/collection authorization at cart-add. This slice enforces company ownership only; staff collection visibility is a separate access-policy surface.
- Catalog-product cart-add policy. This slice only changes products carrying `metadata.custom_order_id`.
- Confirmation email copy or subscriber behavior.

---

## 4. Saved-product Cart-add Admission

When a company user adds a line item through the custom cart-add path, the backend must distinguish catalog products from saved products.

For catalog products, existing behavior remains unchanged.

For saved products, identified by backing product metadata carrying `custom_order_id`, the cart-add request must be accepted only if that saved product belongs to the authenticated company. At cart-add, CompanyProduct association is the ownership authority: the backend must prove the selected product is linked to a CompanyProduct row whose company id matches the authenticated company. A product id, variant id, row id, handle, or metadata shortcut is not enough. Backing proof lineage is validated at cart completion before proof-skipping. The cart-add decision must not rely only on the submitted variant id. If the cart is already associated with a company, that association must match the authenticated company. If ownership cannot be proven, the request must reject before the line item is added.

The cart-add request is batch-shaped. Every submitted item in the request must be evaluated. If any submitted item is an unauthorized saved product, the whole request must reject before adding any submitted line item. A request where item 1 is valid and item 2 is another company's saved product is still invalid.

Required observable behavior:

- A same-company saved product can still be added to cart.
- A saved product belonging to another company returns a deliberate access-denied/not-allowed error.
- A saved product whose company ownership cannot be proven returns a deliberate access-denied/not-allowed error.
- A batch request containing any unauthorized saved-product item rejects the whole batch before adding any submitted line item.
- A catalog product with no `custom_order_id` follows the existing catalog/proof flow.

This is not a general product-visibility rewrite. The contract exists because saved products are company-owned and direct variant-id submission must not bypass that ownership boundary.

---

## 5. Completion Preflight

Before cart completion mutates cart line items, creates payment/order state, or creates custom_order records, the backend must confirm that the cart's company association matches the authenticated company and must preflight every cart line item that belongs to a saved product.

The cart-company comparison must use an authoritative relationship, not only `cart.customer.metadata.company_handle`. The implementation must compare `req.context.company.id` against the cart customer's linked employee/company relationship, or an equally authoritative existing company-cart association if the plan proves one exists. A metadata handle may help locate context, but it cannot be the sole trust source for completion authorization.

The preflight must happen after the cart's company is known and before the catalog proof branch normalizes line items to quantity 1 / unit price 0.

For every saved-product line item, preflight must:

1. read the saved product's `custom_order_id`;
2. resolve the backing custom_order;
3. resolve the backing custom_order's owning company through its order/company lineage;
4. compare that company to the authenticated/cart company;
5. reject if the backing proof is missing, ambiguous, has no resolvable owning order/company lineage, or is owned by another company;
6. reject if the request uses `proof_type: catalog`.

The preflight must evaluate all line items, not just the first line item in each group. A group with mixed saved-product and proof-required line items must reject, because one resulting custom_order cannot both skip proofing and require proofing. A saved-product group whose line items resolve to different backing `custom_order_id` values must also reject, because one resulting custom_order can record only one `metadata.original_custom_order_id`.

---

## 6. Error Semantics

The backend must use stable error classes so callers see deliberate failures, not accidental crashes.

- 400 invalid data: saved product references a missing or unresolvable `custom_order_id`.
- 400 invalid data: saved product references a custom_order that exists but has no resolvable owning order/company lineage.
- 400 invalid data: saved product is submitted with `proof_type: catalog`.
- 400 invalid data: a group mixes saved-product and non-saved-product line items.
- 400 invalid data: a saved-product group contains more than one backing `custom_order_id`.
- Access denied / not allowed: saved product backing proof belongs to a different company.
- Access denied / not allowed: the cart is associated to a different company than the authenticated company.
- Access denied / not allowed: cart company authorization cannot be proven from an authoritative relationship.
- 500 unexpected state: lineage lookup fails for infrastructure reasons after inputs were valid.

In this Medusa app, `MedusaError.Types.NOT_ALLOWED` is a valid access-denied error class but maps to HTTP 400 through Medusa's default error handler. The spec does not require a custom 403 responder. If the implementation does not deliberately add one, tests must assert the Medusa-native `not_allowed` error type/message and pre-side-effect behavior, not a literal 403 status.

Access-denied responses must not reveal the owning company's handle or identity. They may identify the offending line item and say the saved product does not belong to the current company.

When multiple invalid conditions are true, authorization wins before proof-type validation. A cross-company saved product submitted with `proof_type: catalog` returns access denied / not allowed. A same-company saved product submitted with `proof_type: catalog` returns invalid data.

All preflight failures must occur before cart mutation and before order creation. The customer must be able to correct the cart or retry without an already-created order needing manual cleanup.

Infrastructure failures during saved-product validation must not be reported as invalid customer input. If a lookup fails for infrastructure reasons, the response must be an unexpected-state/server failure, not a 400.

---

## 7. Valid Reorder Behavior Preserved

For a valid same-company saved-product reorder with `proof_type: order`, the existing Phase 2 behavior remains the observable contract:

- the order completes;
- a new custom_order is created for the saved-product group;
- the custom_order starts at `job_status: approved`;
- the custom_order starts at `order_status: proof_done`;
- the custom_order stores `metadata.original_custom_order_id` pointing to the approved proof that created the saved product;
- no new proofing round is required.

This applies to apparel and non-apparel saved products. This slice does not change pricing, proof approval, saved-product creation, or product display.

---

## 8. Acceptance Criteria

1. A same-company non-apparel saved-product reorder still completes as `proof_type: order` and creates an approved/proof_done custom_order with `metadata.original_custom_order_id`.
2. A same-company apparel saved-product reorder still completes as `proof_type: order`.
3. Adding another company's saved-product variant to a company cart is rejected with a deliberate not-allowed/access-denied error before the line item is added.
4. A batch cart-add request where one item is valid and another submitted item is another company's saved product is rejected as a whole before any submitted line item is added.
5. Adding a saved product to a cart associated with a different company than the authenticated company is rejected with a deliberate not-allowed/access-denied error before the line item is added.
6. Completing a cart whose authoritative customer/company relationship differs from the authenticated company is rejected with a deliberate not-allowed/access-denied error before cart mutation and before order creation.
7. Completing a cart containing another company's saved product is rejected with a deliberate not-allowed/access-denied error before cart mutation and before order creation.
8. Completing a saved-product cart with `proof_type: catalog` is rejected with 400 invalid data before catalog normalization mutates quantity, unit price, or shipping requirement.
9. A saved product whose `custom_order_id` does not resolve is rejected with 400 invalid data before order creation; the route does not crash on `customOrder.product_name`.
10. A saved product whose backing custom_order exists but has no resolvable owning order/company lineage is rejected with 400 invalid data before order creation.
11. A group mixing saved-product and non-saved-product line items is rejected with 400 invalid data.
12. A saved-product group containing line items from different backing `custom_order_id`s is rejected with 400 invalid data.
13. Completion logic no longer uses only the first item in a group to decide saved-product shortcut behavior.
14. Catalog proof flow for ordinary catalog products remains unchanged.
15. DIV-100 Phase 2 multiplier membership behavior remains covered and passing. Existing fake saved-product fixtures must be updated to use a valid same-company saved product or to stop pretending to be saved products.
