---
domain: proofing
description: Proof lifecycle, job status vs order status, state machine, super admin pipeline, file uploads, notes
sources:
  - src/app/_domain/custom-order/state-machine.ts
  - src/modules/custom-order/service.ts
  - src/api/custom-order/order-flow.ts
  - src/api/custom-order/[id]/route.ts
verified: 2026-04-09
---

# Proofing

The proof lifecycle from submission through delivery. Covers the two status tracks, the super admin production pipeline, file management, and proof notes.

## Concepts

### Proof (Custom Order)
**Is:** A record in the `custom_order` table tracking the full lifecycle of a product configuration — from initial submission through design work, customer review, production, and delivery. It carries two independent status fields (job_status and order_status), file uploads, proof notes, and version tracking.
**Is not:** A file or image. Not an approval status. The proof is the entire lifecycle record.

### Proof Type
**Is:** A flag on the custom order — `catalog` or `order`.
- `catalog`: customer submitting artwork for a blank product. Qty 1, price 0. Goal is creating a saved product on approval.
- `order`: customer ordering configured products with real quantities and prices.
**Is not:** Interchangeable. They have different state transition paths on approval — catalog goes to `proof_done`, order goes to `awaiting_fulfillment`.

### Job Status (Super Admin Pipeline)
**Is:** Internal production pipeline status. 11 states tracking where a proof is in the Divinipress production process. Super admins drive the pipeline forward (startJob, submitProof, proceedProduction, addTracking). Company users make approval decisions that also change job status (approveProof, rejectProof).
**Is not:** The customer-facing status. Customers never see job status directly.

States: `new` | `on_hold` | `in_progress` | `pending` | `revision` | `approved` | `production_hold` | `in_production` | `awaiting_tracking` | `fulfilled` | `canceled`

### Order Status (Customer Lifecycle)
**Is:** Customer-facing lifecycle status. 10 states tracking where the order is from the customer's perspective.
**Is not:** The same as job status. They move independently on the same custom_order entity.

States: `admin_hold` | `proofing` | `proof_ready` | `proof_done` | `awaiting_fulfillment` | `production_hold` | `in_production` | `shipped` | `delivered` | `canceled`

### Super Admin Production Pipeline
**Is:** The daily operational flow for Divinipress staff — the sequence of actions super admins take to move a proof from receipt to delivery.

1. New proof arrives → job: `new`, order: `proofing`
2. `startJob` → job: `in_progress` — super admin begins working on it
3. Prepare proof files — upload customer proofs, production files, product photos
4. `submitProof` → job: `pending`, order: `proof_ready` — sends to customer for review
5. Customer reviews — approves or requests revision
6. If approved → job: `approved`, order: `awaiting_fulfillment` (order type) or `proof_done` (catalog type)
7. `proceedProduction` → job: `in_production`, order: `in_production`
8. `addTracking` → job: `fulfilled`, order: `shipped`
9. `deliverProduct` → order: `delivered`

### Lock Semantics
**Is:** When `job_status === "pending"` and no critical alerts exist, the order is locked. Admin cannot modify files or notes while the customer is reviewing.
**Is not:** A blanket block — `approveProof`, `rejectProof`, and `reopenProof` bypass the lock.

### File Uploads
Five types, each serving a different purpose:
- `proof` — customer-facing proof files showing the design
- `production` — internal production files (print-ready artwork)
- `artwork` — original artwork files uploaded by customer
- `product_thumbnail` — product image for saved product display (uploaded by super admin during proofing)
- `product_image` — gallery images for saved product (uploaded by super admin)

### Proof Notes
**Is:** Typed notes attached to a custom order. Types: `repair`, `alert`, `critical_alert`, `customer_comment`, `custom`. Notes are version-scoped — only notes where `version <= current version` are visible.
**Is not:** Simple text fields. The `checked` boolean is computed at the API layer from the M2M join between custom_order and proof_note, not stored in the database.

### Revision Cycle
Customer rejects proof → `rejectProof` sets job: `revision`, order: `proofing` → super admin calls `startJob` to reopen → version increments → new proof round begins with fresh note visibility.

## Rules

- Job status is affected by both super admins (pipeline actions: startJob, submitProof, proceedProduction, addTracking) and company users (approval decisions: approveProof, rejectProof, adminApprove, adminReject). Order status is also moved by both, depending on the event.
- Lock prevents modification during customer review (pending + no critical alerts).
- Only `approveProof`, `rejectProof`, `reopenProof` bypass the lock.
- Catalog proof approval creates a saved product (side effect in order-flow.ts). Order proof approval does not.
- Proof notes are version-scoped — only notes where `version <= current version` are visible.
- The `checked` field on notes is computed at the API layer, not stored in DB.
- Each state machine event specifies which user type can trigger it (`superadmin` or `company`).

## Code Pointers

- State machine: `src/app/_domain/custom-order/state-machine.ts`
- Backend event handling: `src/api/custom-order/order-flow.ts`
- Proof detail endpoint: `src/api/custom-order/[id]/route.ts`
- Domain hooks: `src/app/_domain/custom-order/hooks/`
- Upload handling: `POST /custom-order/{id}/upload`

## Related

- Proof approval creates saved products → also load **products.md**
- Status display in UI → also load **naming.md** (enum casing, StatusBadge)
- Who can trigger which events → also load **roles.md**
