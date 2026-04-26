---
domain: roles
description: Super admin vs admin vs designer vs staff, permissions, company-scoped tenancy
sources:
  - src/api/company/middlewares.ts
  - src/modules/company/service.ts
  - src/app/_hooks/usePermissions.ts
verified: 2026-04-09
---

# Roles

The permission hierarchy from platform operator (Divinipress) down to restricted staff users within customer organizations.

## Concepts

### Super Admin
**Is:** Divinipress staff — the platform operator. Manages the production pipeline, moves proofs through job status, uploads proof files, manages catalog products. Has a completely different access model than customer roles — sees across all companies, accesses the `/admin/` UI.
**Is not:** A customer admin with elevated privileges. Super admin and admin are fundamentally different roles with different UIs, different data access, and different responsibilities. Backend identifies via `isSuperAdmin` boolean flag.

### Admin (Customer Company Admin)
**Is:** The organization administrator within a customer company. Full access within their organization: catalog browsing, proofing, collections, teams, user invites, order approval, billing, settings.
**Is not:** A super admin. Cannot see other companies. Cannot access the production pipeline. Cannot upload proof files. Their "full access" is scoped entirely to their own company.

### Designer
**Is:** A role with catalog and proofing access within the company. Can browse the catalog, submit proof requests (own proofs), manage collections and My Products, view orders.
**Is not:** A junior admin. Fundamentally different permission set — cannot approve orders, invite/remove users, change roles, create/delete teams, manage team assignments, access settings, or handle billing.

### Staff
**Is:** The most restricted role. Can ONLY view saved products assigned to their team's collections. Can place orders (select sizes, quantities) and view their own orders.
**Is not:** A user with limited admin access. Has zero catalog access — cannot browse, search, or see catalog products at all. Cannot proof. Cannot manage collections or teams. Can only see products explicitly assigned to their team.

### Company-Scoped Tenancy
**Is:** All API routes under `/api/company/[handle]/` validate company context via middleware before any data access. Data never crosses company boundaries. The middleware validates the company handle from route params, checks role permissions, and filters resources by team assignments.
**Is not:** Optional filtering that can be bypassed. Tenant isolation is enforced at the middleware layer — it's the first thing that runs on every company-scoped request.

## Rules

- Staff cannot access the catalog in any way, shape, or form. They can only access products assigned to their team's collections.
- Super admin and admin are fundamentally different roles — one is Divinipress (us), the other is the customer's organization admin. Never conflate them.
- All API routes under `/api/company/[handle]/` enforce tenant isolation via middleware.
- Permission checks happen at both frontend (`usePermissions` hook) and backend (middleware) layers.
- There are 30+ granular permissions across 8 domains: Dashboard, Catalog, My Products, Orders, Proofs, Team Management, Settings, Profile.
- Known permission sync gaps exist between frontend and backend (e.g., `MY_PRODUCTS_VIEW_ALL` granted to frontend Staff but not backend Staff; `MY_PRODUCTS_EDIT_VIEW` exists in frontend only).
- Auth flow: bearer token → parse → validate company handle → check role permissions → filter by team assignments.

## Code Pointers

- Company middleware: `src/api/company/middlewares.ts`
- Auth parsing: `src/api/company/_utils/parse-bearer-auth.ts`
- Frontend permissions: `src/app/_hooks/usePermissions.ts`
- Auth store: `src/app/_store/authStore.ts`
- Backend roles: `src/modules/company/` (company employee models)

## Related

- Staff access to products via teams → also load **teams-collections.md**
- Who can trigger which proof events → also load **proofing.md**
