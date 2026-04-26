# Domain Bible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a modular domain knowledge system (6 domain files + 2 code maps + 1 manifest) that gives Consilium agents correct understanding of the Divinipress business domain.

**Architecture:** Topic-split domain files with frontmatter for staleness detection, composed at dispatch time via a manifest. Code maps organized by repo. All files under `skills/references/domain/`.

**Spec:** `docs/consilium/specs/2026-04-09-domain-bible-design.md`

---

## File Map

All files created under `skills/references/domain/`:

| File | Purpose |
|-|-|
| `MANIFEST.md` | Index — one-line descriptions, agents scan to select files |
| `proofing.md` | Proof lifecycle, job/order status, state machine, super admin pipeline |
| `products.md` | Catalog vs saved products, creation on approval, image hydration |
| `roles.md` | Super admin vs admin vs designer vs staff, permissions, tenancy |
| `orders.md` | Order lifecycle, cart flows, fulfillment, payment |
| `teams-collections.md` | Teams, collections, staff access boundaries |
| `naming.md` | Terminology traps, field naming, enum conventions |
| `store-code-map.md` | Frontend entity map — domain layer, hooks, pages, stores |
| `backend-code-map.md` | Backend entity map — modules, services, routes, models |

---

## Task 1: Create directory structure

**Files:**
- Create: `skills/references/domain/` (directory)

- [ ] **Step 1: Create the domain directory**

```bash
mkdir -p skills/references/domain
```

- [ ] **Step 2: Commit**

```bash
git add skills/references/domain
git commit -m "chore: create domain bible directory structure"
```

---

## Task 2: Store code map

**Files:**
- Create: `skills/references/domain/store-code-map.md`

**Source files to read (in this order):**
1. `/Users/milovan/projects/divinipress-store/CLAUDE.md` — architecture, conventions, codebase layout, import aliases
2. `src/app/_domain/custom-order/` — list all files, note exports from each
3. `src/app/_api/` — scan subdirectories, note which API hooks exist and what they wrap
4. `src/app/_store/` — list stores, note what state each manages
5. `src/app/(authenticated)/` — list route directories, note which pages exist
6. `src/components/ui/` — list components (just filenames, not contents)
7. `src/app/_hooks/` — list shared hooks
8. `src/app/_config/` — list config files
9. `src/app/_interfaces/` — list type definition files

- [ ] **Step 1: Read source files**

Read each source file/directory listed above. For directories, use `ls` or glob to get file listings. For key files (CLAUDE.md, domain layer files), read contents. Take notes on:
- Directory organization and what lives where
- Domain layer exports (hooks, types, state machine, adapter)
- API hooks grouped by domain (proofs, orders, products, team, etc.)
- Zustand stores and what state each manages
- Page routes and which hooks they use
- Shared components relevant to domain (StatusBadge, AdaptiveMultiSelect, etc.)

- [ ] **Step 2: Write store-code-map.md**

Follow this structure:

```markdown
---
repo: divinipress-store
path: /Users/milovan/projects/divinipress-store
verified: 2026-04-09
---

# Store Code Map

## Structure

[Top-level directory organization using indented lists.
Group by: domain layer, API layer, store layer, pages, components, shared.
Include "where to add new code" guidance:
- New domain hooks → src/app/_domain/<domain>/
- New API hooks → src/app/_api/<domain>/
- New page hooks → src/app/(authenticated)/<route>/_hooks/
- New shared components → src/components/ui/
- New page components → next to the page in _components/]

## Architecture

[Document these patterns:
- Domain layer (src/app/_domain/custom-order/) — types, state machine, adapter, hooks
- API layer (src/app/_api/) — React Query hooks wrapping Axios, mutations own error toasts
- Store layer (src/app/_store/) — Zustand for client state, React Query for server state
- Page pattern — thin orchestrator, inner component pattern for conditional hooks
- Component pattern — pages ~200-300 lines, extract to _components/ when growing]

## Key Entities

[Map the TypeScript types that matter:
- CustomOrder (from adapter) — key fields, what it represents
- OrderEvent (from state machine) — the event enum
- ProofNote, Upload, LineItem — supporting types
- DraftFile (from useProofDraft) — local draft state
List relationships: CustomOrder has many Uploads, has many ProofNotes, has many LineItems]

## Entry Points

[For each key flow, document the path through code:
- Proof submission: page → useOrderActions.submitProof → useSubmitProof API hook → POST /custom-order/{id}
- File upload: page → useProofDraft.addFiles → local state; .save() → POST /custom-order/{id}/upload
- Order detail load: page → useOrderDetail → useGetOrder API hook → GET /custom-order/orders/{id} → adaptOrderResponse
- Proof detail load: page → useCustomOrder → useGetAdminProofBySubId → GET /custom-order/{id} → adaptCustomOrder]

## Integrations

[Document:
- Backend API: Axios via @lib/axiosInstance (companyApi), base URL from env
- Auth: Bearer token in cookies, useAuthStore for client state
- File storage: S3/CDN URLs from backend, uploads via multipart form
- Key env vars: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MEDUSA_BACKEND_URL]
```

Verify: every section populated, file paths are accurate (spot-check 3-4 against actual filesystem), under 1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/store-code-map.md
git commit -m "docs: add store code map"
```

---

## Task 3: Backend code map

**Files:**
- Create: `skills/references/domain/backend-code-map.md`

**Source files to read (in this order):**
1. `/Users/milovan/projects/divinipress-backend/CLAUDE.md` — architecture, modules, commands, auth flow
2. `src/modules/` — list each module directory, read `index.ts` and `service.ts` from each
3. `src/api/` — scan route directories, note endpoints and middleware
4. `src/workflows/` — list workflow files
5. `src/subscribers/` — list subscriber files
6. `src/links/` — list link definition files, read each (they're short)
7. `src/modules/custom-order/models/` — list model files, note key fields
8. `src/api/custom-order/order-flow.ts` — the state machine, read for event map and side effects
9. `memory-bank/systemPatterns.md` — if exists, read for architecture patterns

- [ ] **Step 1: Read source files**

Read each source file/directory listed above. For modules, focus on: what entities the module owns, what the service exposes, what routes exist. For the state machine, note: all events, transition guards, side effects (especially approveProof which creates saved products). Take notes on:
- Module ownership (which module owns which entities)
- API route structure (company-scoped via middleware)
- Event-driven patterns (subscribers, what events trigger what)
- Link definitions (how entities relate across modules)
- Auth/middleware chain

- [ ] **Step 2: Write backend-code-map.md**

Follow this structure:

```markdown
---
repo: divinipress-backend
path: /Users/milovan/projects/divinipress-backend
verified: 2026-04-09
---

# Backend Code Map

## Structure

[Top-level directory organization using indented lists.
Group by: modules, API routes, workflows, subscribers, links.
Include "where to add new code" guidance:
- New module → src/modules/<name>/ with index.ts, service.ts, models/, migrations/
- New API route → src/api/<domain>/ following Medusa route conventions
- New workflow → src/workflows/
- New subscriber → src/subscribers/
- New link → src/links/]

## Architecture

[Document these patterns:
- Module pattern: index.ts registration, service.ts business logic (Awilix DI), models/ for entities
- Company-scoped API: all routes under /api/company/[handle]/ validated by middleware
- Auth flow: bearer token → parse → validate company handle → check role permissions → filter by team
- Event-driven: Medusa event system, subscribers react to domain events
- Workflows: Medusa workflow orchestration for multi-step business logic]

## Key Entities

[Map the database models:
- Company — multi-tenant root, has many employees
- CompanyEmployee — user within a company, has role (admin/designer/staff)
- CustomOrder — proof/order record, has job_status + order_status + version
- Upload (custom_order_upload) — files attached to custom orders, typed by upload_type
- ProofNote — notes attached to custom orders, default vs custom, version-scoped
- CompanyProduct — link between Product and Company (for saved products)
- Links: Order 1:many CustomOrder, CustomOrder 1:many OrderLineItem, Company 1:many Order, Customer 1:1 CompanyEmployee, Product 1:1 CompanyProduct]

## Entry Points

[For each key flow, document the path through backend code:
- Proof submission: POST /custom-order/{id} with event:"submitProof" → order-flow.ts EVENT_MAP → transition guards → status update
- Cart completion: POST /store/carts/{id}/custom-complete → validate → completeCartWorkflow → create custom_orders → associate uploads → remap IDs
- Saved product creation: approveProof event side effect → create new Product with filtered variants → link to company → link to sales channel
- File upload: POST /custom-order/{id}/upload → multer → S3 upload → create upload record
- Proof detail: GET /custom-order/{id} → hydrate metadata → hydrate variant_option_values → compute proof note checked flags]

## Integrations

[Document:
- Database: PostgreSQL via MikroORM, migrations in each module
- File storage: DigitalOcean Spaces (S3-compatible), env vars DO_BUCKET_*
- Email: Resend module, RESEND_API_KEY
- Payment: Stripe via Medusa, STRIPE_API_KEY
- Caching: Redis (optional), REDIS_URL
- Key env vars: DATABASE_URL, JWT_SECRET, COOKIE_SECRET]
```

Verify: every section populated, file paths are accurate (spot-check 3-4 against actual filesystem), under 1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/backend-code-map.md
git commit -m "docs: add backend code map"
```

---

## Task 4: proofing.md

**Files:**
- Create: `skills/references/domain/proofing.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-store/docs/product-data-flow-cheatsheet.md` — sections on enums, event-based state transitions, lock semantics, proof detail response shape
2. `/Users/milovan/projects/divinipress-store/docs/custom-order-domain-reference.md` — state machine quick reference, lock semantics, getAvailableActions logic
3. `/Users/milovan/projects/divinipress-store/src/app/_domain/custom-order/state-machine.ts` — actual state machine code, EVENT_MAP, transitions
4. `/Users/milovan/projects/divinipress-knowledge/core/glossary.internal.md` — job status definitions (11 states)
5. `/Users/milovan/projects/divinipress-knowledge/core/user-workflows.md` — proofing workflow (#6), order lifecycle (#11)

- [ ] **Step 1: Read source files**

Read each source file listed above. Extract:
- All 11 job status values and what each means
- All 10 order status values and what each means
- How job status and order status move in parallel on the same custom_order
- The super admin daily pipeline: new proof arrives → startJob → in_progress → prepare proof files → submitProof → pending → customer reviews → approve/reject → approved → proceedProduction → in_production → addTracking → shipped → deliverProduct → delivered
- State machine events: who triggers each (super admin vs company), what transitions it causes
- Lock semantics: when an order is locked, what's blocked, what bypasses the lock
- Proof types: catalog vs order, how they differ in state transitions (catalog approveProof → proof_done, order approveProof → awaiting_fulfillment)
- File upload types: proof, production, artwork, product_thumbnail, product_image — what each is for, who uploads it
- Proof notes: types (repair, alert, critical_alert, customer_comment, custom), versioning, the checked field (computed from M2M join, not stored)
- The revision cycle: rejectProof → revision → startJob (reopened) → in_progress → submitProof again, version increments

- [ ] **Step 2: Write proofing.md**

Follow the domain file template from the spec:

```markdown
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

[TL;DR: one line summarizing what this file covers]

## Concepts

### Proof
**Is:** [definition — a custom order record tracking the design review process for a product configuration]
**Is not:** [not a file, not an image, not approval status — it's the entire lifecycle record]

### Proof Type
**Is:** [catalog = customer submitting artwork for a blank product, qty 1, price 0, goal is creating a saved product. order = customer ordering configured products with real quantities and prices]
**Is not:** [not interchangeable — they have different state transition paths on approval]

### Job Status
**Is:** [internal production pipeline status. 11 states tracking what Divinipress (super admin) is doing with this proof. Only super admins move job status forward.]
**Is not:** [not the customer-facing status. Customers never see job status directly.]

[List all 11 states with one-line definitions]

### Order Status
**Is:** [customer-facing lifecycle status. 10 states tracking where the order is from the customer's perspective.]
**Is not:** [not the same as job status. They move independently on the same custom_order entity.]

[List all 10 states with one-line definitions]

### Super Admin Production Pipeline
**Is:** [the daily operational flow for Divinipress staff — the sequence of actions super admins take to move a proof from receipt to delivery]

[Walk through the full pipeline:
1. New proof arrives (job: new, order: proofing)
2. startJob → (job: in_progress) — super admin begins working on it
3. Prepare proof files — upload customer proofs, production files, product photos
4. submitProof → (job: pending, order: proof_ready) — sends to customer for review
5. Customer reviews — approves or requests revision
6. If approved → (job: approved, order: awaiting_fulfillment or proof_done)
7. proceedProduction → (job: in_production, order: in_production)
8. addTracking → (job: fulfilled, order: shipped)
9. deliverProduct → (order: delivered)]

### Lock Semantics
**Is:** [when job_status is "pending" and no critical alerts exist, the order is locked — admin cannot modify files or notes while customer is reviewing]

### File Uploads
[Define each upload type:
- proof: customer-facing proof files
- production: internal production files
- artwork: original artwork files from customer
- product_thumbnail: product image for saved product (uploaded by super admin)
- product_image: gallery images for saved product (uploaded by super admin)]

### Proof Notes
[Define: types, versioning, the checked field computation]

### Revision Cycle
[Define: reject → revision status → startJob reopens → version increments → new proof round]

## Rules

[Key business rules:
- Job status is moved only by super admins. Order status is moved by both super admins and company users depending on the event.
- Lock prevents modification during customer review (pending + no critical alerts).
- Only approveProof, rejectProof, reopenProof bypass the lock.
- Catalog proof approval creates a saved product (side effect in order-flow.ts). Order proof approval does not.
- Proof notes are version-scoped — only notes where version <= current version are visible.
- The checked field on notes is computed at the API layer from M2M join, not stored in DB.]

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
```

Verify: all concepts from the spec's proofing.md description are covered, super admin pipeline is a first-class section, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/proofing.md
git commit -m "docs: add proofing domain file"
```

---

## Task 5: products.md

**Files:**
- Create: `skills/references/domain/products.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-store/docs/product-data-flow-cheatsheet.md` — section 5 (Saved Product), section 2 (Catalog Order Flow), variant metadata
2. `/Users/milovan/projects/divinipress-knowledge/core/product-identity.md` — what Divinipress is/isn't, product categories, core model
3. `/Users/milovan/projects/divinipress-knowledge/core/glossary.md` — Catalog, My Products, Collection definitions
4. `/Users/milovan/projects/divinipress-backend/src/api/custom-order/order-flow.ts` — approveProof side effects (saved product creation)
5. `/Users/milovan/projects/divinipress-backend/src/modules/custom-order/service.ts` — hydrateImages function

- [ ] **Step 1: Read source files**

Extract:
- Catalog product definition: blank products from vendors, need configuration before ordering
- Saved product definition: new Medusa product entity created on catalog proof approval
- How saved products are created: approval side effects (new product, filtered variants to selected color only, Size option only, metadata inheritance with custom_order_id added)
- Variant metadata inheritance: what's spread from original catalog variant, what's added by approveProof (original_variant_id, original_sku, original_upc, original_title, selections, design_notes)
- Image hydration: product_thumbnail and product_image uploads stored on custom_order, hydrateImages() overlays them at serve time on GET /api/company/my-products and GET /api/store/custom-products
- Reorder flow: saved product detected by product.metadata.custom_order_id, skips proofing (job: approved, order: proof_done), links back via metadata.original_custom_order_id
- Product metadata fields: brandName, styleName, vendor, production_option_type (live on product.metadata, seeded during apparel import)
- Product categories: Apparel, Printed Materials, Promotional Products, Display Items
- Custom sourcing: available for products not in Catalog

- [ ] **Step 2: Write products.md**

Follow the domain file template. Key concepts with "Is / Is not":
- **Catalog Product** — Is: blank from vendor. Is not: ready to order as-is.
- **Saved Product** — Is: new Medusa product entity, separate from catalog. Is not: a bookmark, wishlist, or cart item.
- **Image Hydration** — Is: runtime overlay of custom order uploads onto saved product fields. Is not: writing upload URLs to the product record.
- **Reorder** — Is: creating a new custom_order that skips proofing. Is not: re-purchasing the original order.

Rules:
- Catalog products MUST go through proofing to become saved products.
- Saved products are locked to one color (variants filtered during creation).
- Saved product images come from custom order uploads, not the product record itself.
- product.metadata.custom_order_id is the link from saved product back to original proof.

Verify: all concepts from the spec's products.md description are covered, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/products.md
git commit -m "docs: add products domain file"
```

---

## Task 6: roles.md

**Files:**
- Create: `skills/references/domain/roles.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-knowledge/core/roles-permissions.md` — full roles and permissions reference, 30+ permissions across 8 domains
2. `/Users/milovan/projects/divinipress-knowledge/core/roles-permissions.internal.md` — super admin partial status, permission sync gaps
3. `/Users/milovan/projects/divinipress-backend/CLAUDE.md` — auth flow, company-scoped architecture
4. `/Users/milovan/projects/divinipress-backend/src/api/company/middlewares.ts` — company validation middleware
5. `/Users/milovan/projects/divinipress-store/src/app/_hooks/` — look for usePermissions hook

- [ ] **Step 1: Read source files**

Extract:
- Super admin (Divinipress) vs admin (customer company admin) — the two-tier distinction
- All four roles: super admin, admin, designer, staff — what each can and cannot do
- The 30+ granular permissions across 8 domains
- Staff restrictions: no catalog, no proofing, only assigned team collections
- Designer permissions: catalog + proofing (own proofs), no team/billing/invite
- Company-scoped tenancy: /api/company/[handle]/ middleware enforces isolation
- isSuperAdmin flag on backend
- Known permission sync gaps between frontend and backend
- Auth flow: bearer token → parse → validate company → check role → filter by team

- [ ] **Step 2: Write roles.md**

Follow the domain file template. Key concepts with "Is / Is not":
- **Super Admin** — Is: Divinipress staff, platform operator, moves proofs through production. Is not: a customer admin with elevated privileges — completely different access model.
- **Admin** — Is: customer company admin, full access within their organization. Is not: a super admin — cannot see other companies, cannot access production pipeline.
- **Designer** — Is: catalog and proofing access, cannot manage teams or billing. Is not: a junior admin — fundamentally different permission set.
- **Staff** — Is: most restricted role, sees only assigned team collections, places orders. Is not: a user with limited admin — has zero catalog access, zero proofing access.
- **Company-Scoped Tenancy** — Is: all API routes validate company context via middleware, data never crosses company boundaries. Is not: optional filtering — it's enforced at the middleware layer.

Rules:
- Staff cannot access the catalog in any way. They can only see products assigned to their team's collections.
- Super admin and admin are fundamentally different roles — one is Divinipress (us), the other is the customer's organization admin.
- All API routes under /api/company/[handle]/ enforce tenant isolation via middleware.
- Permission checks happen at both frontend (usePermissions) and backend (middleware) layers.

Verify: all concepts from the spec's roles.md description are covered, the super admin vs admin distinction is prominent, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/roles.md
git commit -m "docs: add roles domain file"
```

---

## Task 7: orders.md

**Files:**
- Create: `skills/references/domain/orders.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-store/docs/product-data-flow-cheatsheet.md` — sections 1-4 (proof flow, catalog order flow, order detail, admin proof detail), section 6 (orders list), section 8 (link definitions)
2. `/Users/milovan/projects/divinipress-knowledge/core/user-workflows.md` — ordering paths (#5), order lifecycle (#11)
3. `/Users/milovan/projects/divinipress-store/docs/custom-order-domain-reference.md` — adapter field mapping tables (Table A and Table B), page wiring for order detail pages

- [ ] **Step 1: Read source files**

Extract:
- Two ordering paths: Path A (proof-to-my-products) and Path B (save-and-add-to-cart)
- Custom-complete flow: what happens when a cart completes (the 12-step backend process)
- Saved product reorder detection and different default statuses
- Sub-orders: grouped by metadata.group_id, one custom_order per group
- Payment status mapping: Medusa v2 "completed" vs "captured" → "fully_paid"
- Fulfillment and tracking: labels, tracking numbers, fulfillment-to-item mapping
- Order detail vs proof detail: different endpoints, different response shapes, different adapters
- The two adapters: adaptCustomOrder (proof detail) vs adaptOrderResponse (order detail) — different fields, different shapes
- Line items: metadata fields (group_id, upload_ids, selections, design_notes, product_name)

- [ ] **Step 2: Write orders.md**

Follow the domain file template. Key concepts with "Is / Is not":
- **Order** — Is: a Medusa order containing line items grouped into sub-orders. Is not: a single product purchase — one order can contain multiple sub-orders (custom_order records).
- **Sub-Order (Custom Order)** — Is: one group of line items sharing a group_id, with its own job_status and order_status. Is not: a separate order entity — it's a record within an order.
- **Path A (Proof Flow)** — Is: catalog proof type, qty 1, price 0, creates custom_order in new/proofing. Is not: a purchase — it's a proof request.
- **Path B (Order Flow)** — Is: order proof type, real prices, multiple sizes via group_id. Is not: guaranteed to go through proofing — saved product reorders skip to approved/proof_done.
- **Two Adapters** — Is: proof detail and order detail use completely different adapter functions with different output shapes. Is not: the same data presented differently — they query different endpoints with different response structures.

Verify: all concepts from the spec's orders.md description are covered, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/orders.md
git commit -m "docs: add orders domain file"
```

---

## Task 8: teams-collections.md

**Files:**
- Create: `skills/references/domain/teams-collections.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-knowledge/core/user-workflows.md` — teams (#9), collections (#8), staff ordering (#10)
2. `/Users/milovan/projects/divinipress-knowledge/core/roles-permissions.md` — staff permissions, team management permissions
3. `/Users/milovan/projects/divinipress-knowledge/core/glossary.md` — Team, Collection definitions
4. `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/` — look for my-products, collections, and team page directories to confirm route structure
5. `/Users/milovan/projects/divinipress-backend/src/modules/company/` — look for team/collection-related models and services

- [ ] **Step 1: Read source files**

Extract:
- Collections: group saved products, created by admin, assigned to teams
- Teams: group users (employees), created by admin, assigned collections
- Staff access boundary: staff → team → collections → saved products
- Staff see ONLY collections assigned to their team — no catalog, no unassigned products
- Admin creates teams, assigns users, assigns collections
- My Products page behavior per role: admin/designer see all, staff see assigned only
- How this connects to the saved product flow (products.md): proof approved → saved product → added to collection → assigned to team → staff can order

- [ ] **Step 2: Write teams-collections.md**

Follow the domain file template. Key concepts with "Is / Is not":
- **Collection** — Is: a group of saved products, assigned to teams by admin. Is not: a category or tag — it's an access-control mechanism that determines which products staff can see.
- **Team** — Is: a group of users within a company, assigned collections by admin. Is not: a department or organizational unit — it's a product-access grouping.
- **Staff Access Boundary** — Is: staff → their team → team's collections → saved products in those collections. Is not: optional filtering — staff literally cannot see products outside their team's collections.

Rules:
- Staff cannot access the catalog. Ever. They can only see saved products in their team's collections.
- Collections are the bridge between saved products and staff ordering.
- Only admins can create teams, assign users to teams, and assign collections to teams.
- Designers can manage collections and My Products but cannot create or manage teams.

Verify: all concepts from the spec's teams-collections.md description are covered, the access boundary chain is clear, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/teams-collections.md
git commit -m "docs: add teams-collections domain file"
```

---

## Task 9: naming.md

**Files:**
- Create: `skills/references/domain/naming.md`

**Source files to read:**
1. `/Users/milovan/projects/divinipress-store/docs/custom-order-domain-reference.md` — gotchas & spec divergences (section 5), adapter field mapping tables
2. `/Users/milovan/projects/divinipress-store/docs/product-data-flow-cheatsheet.md` — field naming across endpoints, metadata objects
3. `/Users/milovan/projects/divinipress-store/src/app/_domain/custom-order/adapter.ts` — field name transformations
4. `/Users/milovan/projects/divinipress-store/src/app/_interfaces/` — look for order.interface.ts for enum definitions

- [ ] **Step 1: Read source files**

Extract every naming inconsistency and terminology trap:
- display name vs product title vs product_name field
- uploads vs files (API field is "uploads" — some code uses "files" for different concepts)
- employee vs company_employee (proof endpoint renames, order endpoint doesn't)
- checked on proof notes (computed from M2M join, not stored)
- Enum casing: lowercase in backend (in_progress), agents assume UPPERCASE (IN_PROGRESS)
- variant_option_values: flat object on proof endpoint, nested options array on order endpoint
- product.metadata vs item.metadata vs custom_order.metadata (three different objects)
- product_title (Medusa line item field) vs product_name (custom order field) vs title (variant/product field)
- "custom_order" vs "sub-order" vs "proof" — same entity, different names in different contexts

- [ ] **Step 2: Write naming.md**

Follow the domain file template. This file uses a different structure than others — instead of "Is / Is not" per concept, use a **term disambiguation** format:

```markdown
---
domain: naming
description: Terminology traps, field naming inconsistencies, enum conventions across the codebase
sources:
  - src/app/_domain/custom-order/adapter.ts
  - src/app/_interfaces/order.interface.ts
verified: 2026-04-09
---

# Naming

Terminology traps that cross domain boundaries. An agent working
in any area might hit one of these.

## Term Disambiguation

### [Term Group]
- **term_a** — [what it is, where it appears]
- **term_b** — [what it is, where it appears]
- **The trap:** [what agents confuse and why it matters]
```

Cover every naming inconsistency extracted in step 1. Each entry: what the terms are, where they appear, and what breaks if you confuse them.

Rules:
- Backend enums are always lowercase (in_progress, not IN_PROGRESS).
- The API field is uploads, never files (files means something different in some contexts).
- employee at the top level of proof detail IS company_employee — the backend renames it.
- product.metadata, item.metadata, and custom_order.metadata are three separate objects with different contents.

Verify: all naming traps from the spec's naming.md description are covered, frontmatter sources are real file paths, under ~1500 words.

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/naming.md
git commit -m "docs: add naming domain file"
```

---

## Task 10: MANIFEST.md

**Files:**
- Create: `skills/references/domain/MANIFEST.md`

- [ ] **Step 1: Review all completed domain files**

Read each file's frontmatter `description:` field. Verify descriptions are accurate and specific enough for a dispatching agent to judge relevance in one scan.

- [ ] **Step 2: Write MANIFEST.md**

```markdown
# Domain Knowledge Manifest

Load relevant files based on the task at hand. Read descriptions to select.
Typical loading budget: 1-3 domain files + 0-1 code maps.

## Domain Concepts

| File | Covers |
|-|-|
| proofing.md | Proof lifecycle, job status vs order status, state machine, super admin pipeline, file uploads, notes |
| products.md | Catalog vs saved products, product creation on approval, image hydration, variant metadata |
| roles.md | Super admin vs admin vs designer vs staff, permissions, company-scoped tenancy |
| orders.md | Order lifecycle, cart flows, sub-orders, fulfillment, payment |
| teams-collections.md | Teams, collections, staff product assignment, access boundaries |
| naming.md | Display name vs product title, terminology traps, field naming, enum conventions |

## Code Maps

| File | Covers |
|-|-|
| store-code-map.md | Frontend — domain layer, hooks, API surface, page wiring, stores, components |
| backend-code-map.md | Backend — modules, services, routes, models, state machine, workflows, links |
```

Update the descriptions in the table to match the actual `description:` fields from each file's frontmatter (they may have been refined during writing).

- [ ] **Step 3: Commit**

```bash
git add skills/references/domain/MANIFEST.md
git commit -m "docs: add domain knowledge manifest"
```

---

## Task 11: Validation

No files created. This is a review task with the user.

- [ ] **Step 1: Present summary**

List all 9 files with their word counts and a one-line summary of what each covers.

- [ ] **Step 2: Walk through each domain file**

For each of the 6 domain files, present:
- The concepts covered (section headers)
- The rules listed
- The "Is / Is not" definitions for key concepts
- Ask: "Anything wrong, missing, or misleading?"

- [ ] **Step 3: Walk through code maps**

For each code map, present:
- The structure overview
- Key entities listed
- Entry points documented
- Ask: "Any important files or patterns I missed?"

- [ ] **Step 4: Final verification**

Check:
- All frontmatter `sources:` point to files that exist
- All `verified:` dates are today's date
- All domain files are under ~1500 words
- MANIFEST.md descriptions match file frontmatter
- Cross-loading hints in Related sections are accurate

- [ ] **Step 5: Final commit**

If any corrections were made during validation:

```bash
git add skills/references/domain/
git commit -m "docs: domain bible validation corrections"
```

---

## Parallelization Notes

Tasks 2 and 3 (code maps) can run in parallel — they read different repos.

Tasks 4-9 (domain files) can run in parallel after code maps are complete — each reads different source material. However, naming.md (Task 9) benefits from seeing the other domain files first to catch terminology gaps, so consider running it last.

Task 10 (manifest) must run after all domain files are complete.

Task 11 (validation) must run last.

**Recommended execution order:**
1. Task 1 (directory)
2. Tasks 2 + 3 in parallel (code maps)
3. Tasks 4-8 in parallel (domain files)
4. Task 9 (naming — after reviewing other domain files)
5. Task 10 (manifest)
6. Task 11 (validation)
