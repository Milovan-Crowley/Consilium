---
domain: naming
description: Terminology traps, field naming inconsistencies, enum conventions across the codebase
sources:
  - src/app/_domain/custom-order/adapter.ts
  - src/app/_interfaces/order.interface.ts
verified: 2026-04-09
---

# Naming

Terminology traps that cross domain boundaries. An agent working in any area might hit one of these.

## Term Disambiguation

### Product Names
- **product_name** — field on `custom_order` table. The user-entered design name (e.g., "Youth Group Tees 2026"). Set during proof submission.
- **product_title** — Medusa line item field (`item.product_title`). The catalog product name (e.g., "Bella Canvas 3001 Unisex Jersey Tee").
- **display name** — a UI concept for how a saved product is shown to users. NOT a database field. Derived from product_name or product_title depending on context.
- **The trap:** Agents treat these as interchangeable. They're three different things at three different levels. Targeting the wrong one means modifying the wrong entity.

### Uploads vs Files
- **uploads** — the API field name on custom_order responses (`customOrder.uploads`). Array of upload records with id, url, type, size, name.
- **files** — used in some admin order detail code to mean production files for display. Also the multipart form field name for upload endpoints.
- **The trap:** The domain model uses `uploads`. Some quarantine code and the admin order adapter used `files` for a different concept. The API field is always `uploads`.

### Employee Naming
- **employee** — returned at the top level of the proof detail endpoint (`GET /custom-order/{id}`). This IS `customer.company_employee` — the backend GET handler renames it.
- **customer.company_employee** — returned on the order detail endpoint (`GET /custom-order/orders/{id}`). Same data, not renamed.
- **The trap:** The adapter handles both paths, but agents writing new code that reads employee data need to know which endpoint they're working with to find the right field.

### Checked Field on Proof Notes
- **checked** — boolean on proof notes in API responses. Agents assume it's stored in the database.
- **The trap:** `checked` is computed at the API layer from the M2M join between custom_order and proof_note. Notes attached to the current custom order AND matching the current version → `checked: true`. Default notes not attached → `checked: false`. It's derived state, not stored state.

### Enum Casing
- **Backend:** All enum values are lowercase: `in_progress`, `proof_ready`, `awaiting_fulfillment`.
- **The trap:** Agents write UPPERCASE values (`IN_PROGRESS`, `PROOF_READY`). The frontend `JobStatusText` and `OrderStatusText` lookups use lowercase keys. UPPERCASE won't match.

### variant_option_values
- **Proof detail endpoint** (`GET /custom-order/{id}`): Returns `variant_option_values` as a flat object: `{ "Color": "Black", "Size": "M" }`.
- **Order detail endpoint** (`GET /custom-order/orders/{id}`): Returns `variant.options` as a nested array: `[{ value: "Black", option: { title: "Color" } }]`.
- **The trap:** Different endpoints use different shapes for the same data. Code that reads color/size must know which endpoint it's working with.

### Three Metadata Objects
- **product.metadata** — on the Medusa product record. Contains brandName, styleName, vendor, production_option_type. For saved products, also has custom_order_id.
- **item.metadata** (line item metadata) — on the order line item. Contains group_id, upload_ids, selections, design_notes, product_name. These are the 5 Zod-validated fields.
- **custom_order.metadata** — on the custom_order record. Usually null for new proofs. For saved product reorders, contains `original_custom_order_id`.
- **The trap:** Three separate objects named "metadata" with completely different contents. Agents read from the wrong one and get null or unexpected data.

### Custom Order in Context
- **custom_order** — the database table / entity name
- **sub-order** — how it's described in order context (grouped by group_id)
- **proof** — how it's described in proofing context
- **The trap:** Same entity, three names depending on context. The `custom_order` table is the single source of truth for all three concepts.

## Rules

- Backend enums are always lowercase — `in_progress`, not `IN_PROGRESS`.
- The API field is `uploads`, never `files` for custom order file records.
- `employee` at the top level of proof detail IS `company_employee` — the backend renames it.
- `product.metadata`, `item.metadata`, and `custom_order.metadata` are three separate objects with different contents. Never assume one has the fields of another.

## Code Pointers

- Adapter (field transformations): `src/app/_domain/custom-order/adapter.ts`
- Type definitions: `src/app/_interfaces/order.interface.ts`
- Status text lookups: search for `JobStatusText` and `OrderStatusText`

## Related

- All domain files reference fields covered here — load this file whenever field naming is relevant to the task.
