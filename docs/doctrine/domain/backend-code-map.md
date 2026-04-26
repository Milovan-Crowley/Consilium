---
repo: divinipress-backend
path: /Users/milovan/projects/divinipress-backend
verified: 2026-04-09
---

# Backend Code Map

Medusa.js v2 backend for Divinipress. Node.js 22, Yarn 4, TypeScript strict, MikroORM.

## Structure

- `src/modules/` — custom Medusa modules (core business logic)
  - `company/` — multi-tenant company management, RBAC, employee models (10 model files)
  - `custom-order/` — proofing workflow, custom orders, uploads, proof notes (5 model files)
  - `custom-fulfillment/` — extended fulfillment provider
  - `complex-pricing/` — pricing rules (3 model files)
  - `file-s3/` — DigitalOcean Spaces file storage
  - `resend/` — email notification provider
  - `simple-tax/` — tax calculation by zip code
- `src/api/` — REST API route handlers
  - `company/` — company-scoped endpoints (middleware-protected)
  - `custom-order/` — proof/order CRUD, state transitions, uploads
  - `super-admin/` — platform operator endpoints
  - `store/` — storefront endpoints (cart, products)
  - `pricing/`, `product/`, `proof-note/` — supporting endpoints
  - `_permissions/`, `_type/`, `_utils/`, `helpers/` — shared API utilities
- `src/workflows/` — Medusa workflows (company/, invites/, pricing/)
- `src/subscribers/` — event handlers (custom-order-created, proof-ready, password-reset, user-invited)
- `src/links/` — data relationship definitions (6 link files)
- `src/admin/` — React-based admin dashboard (components, context, routes)

**Where to add new code:**
- New module → `src/modules/<name>/` with `index.ts`, `service.ts`, `models/`, `migrations/`
- New API route → `src/api/<domain>/` following Medusa route conventions
- New workflow → `src/workflows/<domain>/`
- New subscriber → `src/subscribers/`
- New link → `src/links/`

## Architecture

- **Module pattern:** `index.ts` (registration), `service.ts` (business logic via Awilix DI), `models/` (MikroORM entities), `migrations/` (database schema)
- **Company-scoped API:** All routes under `/api/company/[handle]/` validated by `src/api/company/middlewares.ts`. Middleware validates company handle, checks roles, filters by team.
- **Auth flow:** Bearer token → `parse-bearer-auth.ts` → validate company handle → check role permissions → filter resources by team assignments
- **Event-driven:** Medusa event system. Subscribers in `src/subscribers/` react to domain events (`custom-order.created`, `custom-order.proof-ready`).
- **State machine:** `src/api/custom-order/order-flow.ts` (24KB) — EVENT_MAP defines all transitions, guards, and side effects. `POST /custom-order/{id}` with `{ event, ...data }` triggers transitions.

## Key Entities

- **Company** — multi-tenant root. Has many employees, orders, products.
- **CompanyEmployee** — user within a company. Has role (admin/designer/staff), team assignments.
- **CustomOrder** — proof/order record. Fields: id, proof_type, job_status, order_status, product_name, version, metadata, uploads, proof_notes.
- **Upload** (custom_order_upload) — files attached to custom orders. Typed by upload_type enum. Version-scoped.
- **ProofNote** — notes attached to custom orders. Typed (repair, alert, critical_alert, customer_comment, custom). M2M join with custom_order determines `checked` state.
- **CompanyProduct** — links a Product to a Company with price. Created when saved products are made.
- **Links:** Order 1:many CustomOrder, CustomOrder 1:many OrderLineItem, Company 1:many Order, Customer 1:1 CompanyEmployee, Product 1:1 CompanyProduct, Product 1:1 PriceSet

## Entry Points

- **Cart completion:** `POST /store/carts/{id}/custom-complete` → validate → `completeCartWorkflow` → create custom_orders → associate uploads → remap IDs → emit event
- **State transition:** `POST /custom-order/{id}` with `{ event }` → `order-flow.ts` EVENT_MAP → validate guards → update status → execute side effects
- **Saved product creation:** `approveProof` side effect in `order-flow.ts` → create new Product with filtered variants → CompanyProduct → sales channel link
- **Proof detail:** `GET /custom-order/{id}` → hydrate metadata (fallback to line item) → hydrate variant_option_values → compute note checked flags
- **File upload:** `POST /custom-order/{id}/upload` → multer → S3 upload via file-s3 module → create upload record

## Integrations

- **Database:** PostgreSQL via MikroORM. Migrations in each module's `migrations/` dir.
- **File storage:** DigitalOcean Spaces (S3-compatible). Env vars: `DO_BUCKET_NAME`, `DO_BUCKET_REGION`, `DO_BUCKET_ACCESS_KEY`, `DO_BUCKET_SECRET_KEY`, `DO_BUCKET_ENDPOINT`, `DO_CDN_URL`
- **Email:** Resend module. Env var: `RESEND_API_KEY`
- **Payment:** Stripe via Medusa. Env var: `STRIPE_API_KEY`
- **Caching:** Redis (optional). Env var: `REDIS_URL`
- **Core env vars:** `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`
