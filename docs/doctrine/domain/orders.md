---
domain: orders
description: Order lifecycle, two ordering paths, cart flows, sub-orders, fulfillment, payment
sources:
  - src/api/custom-order/orders/route.ts
  - src/api/custom-order/orders/[id]/route.ts
  - src/api/store/carts/[id]/custom-complete/route.ts
verified: 2026-04-09
---

# Orders

Order lifecycle from cart to delivery, including the two ordering paths and how orders decompose into sub-orders.

## Concepts

### Order
**Is:** A Medusa order containing line items grouped into sub-orders (custom_order records). One order can have multiple sub-orders, each with its own job_status and order_status.
**Is not:** A single product purchase. An order is a container — the sub-orders within it are the individually tracked units.

### Sub-Order (Custom Order in Order Context)
**Is:** A group of line items sharing a `metadata.group_id`, represented by one custom_order record. Each sub-order tracks its own proof lifecycle independently (own job_status, order_status, uploads, notes).
**Is not:** A separate order entity. It's a record within an order, grouped by the client-generated group_id.

### Path A: Proof Flow (catalog proof type)
**Is:** Customer configures a catalog product and submits for proofing. Creates a custom_order with `proof_type: "catalog"`, qty 1, price 0. The goal is design review — if approved, a saved product is created.
**Is not:** A purchase. No money changes hands. The line item has zero price and quantity 1.

### Path B: Order Flow (order proof type)
**Is:** Customer configures a product and adds to cart for purchase. Creates custom_order(s) with `proof_type: "order"`, real quantities (one line item per size, all sharing group_id), real prices.
**Is not:** Guaranteed to go through proofing. Saved product reorders (where `product.metadata.custom_order_id` exists) skip to `approved`/`proof_done` automatically.

### Custom-Complete Flow
What the backend does when a cart completes (`POST /store/carts/{id}/custom-complete`):
1. Validates cart (catalog type: max 1 item; forces qty 1 and price 0)
2. Creates payment collection + session
3. Completes cart via Medusa workflow → creates Order
4. Links order to company
5. Groups line items by `metadata.group_id`
6. Creates one custom_order per group
7. Links custom_order ↔ line items and order ↔ custom_orders
8. Associates uploads with custom_order
9. Moves files from temp S3 path to permanent path
10. Remaps upload IDs in records and metadata
11. Emits `custom-order.created` event

### Two Adapters
**Is:** Proof detail and order detail use completely different adapter functions with different output shapes. `adaptCustomOrder` (proof detail) produces a flat `CustomOrder` type. `adaptOrderResponse` / page-level adapters (order detail) produce nested structures with sub-orders grouped by group_id.
**Is not:** The same data presented differently. They query different endpoints (`GET /custom-order/{id}` vs `GET /custom-order/orders/{id}`) with fundamentally different response structures.

### Payment Status
Medusa v2 uses `"completed"` (not `"captured"`) for successful payment collection status. The domain adapter maps both `"completed"` and `"captured"` to `"fully_paid"`. Zero-total orders (proof flow) are treated as `"fully_paid"`.

### Fulfillment
Tracking lives on `fulfillments[].labels[]` — tracking_number, tracking_url, label_url. There is no `tracking_number` field on the custom_order itself. Fulfillment items link back to order line items.

## Rules

- One order can contain multiple sub-orders (custom_order records), each tracked independently.
- Saved product reorders skip proofing — backend detects `product.metadata.custom_order_id` and sets initial status to approved/proof_done.
- The orders list endpoint (`GET /custom-order/orders`) only shows `proof_type: "order"` items. Proofs are filtered out.
- Non-admin employees only see their own orders on the orders list.
- `group_id` scope is per cart completion — not globally unique.
- Proof detail and order detail are different endpoints with different adapters. Never assume one works like the other.

## Code Pointers

- Custom-complete: `src/api/store/carts/[id]/custom-complete/route.ts`
- Order detail endpoint: `src/api/custom-order/orders/[id]/route.ts`
- Orders list endpoint: `src/api/custom-order/orders/route.ts`
- Frontend order adapter: `src/app/(authenticated)/orders/[id]/_hooks/useOrderDetail.ts`
- Frontend admin order adapter: `src/app/(authenticated)/admin/orders/[orderId]/_hooks/useAdminOrderDetail.ts`
- Domain adapter (proof): `src/app/_domain/custom-order/adapter.ts`

## Related

- Proof lifecycle within sub-orders → also load **proofing.md**
- Saved product reorder detection → also load **products.md**
- Who can see which orders → also load **roles.md**
- Field naming differences between endpoints → also load **naming.md**
