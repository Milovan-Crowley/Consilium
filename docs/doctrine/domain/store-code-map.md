---
repo: divinipress-store
path: /Users/milovan/projects/divinipress-store
verified: 2026-04-09
---

# Store Code Map

Next.js 16 + React 19 storefront for Divinipress. Shadcn (Base UI variant), Zustand, React Query.

## Structure

- `src/app/_domain/` — domain layer (business logic modules)
  - `custom-order/` — state machine, adapter, types, hooks (useCustomOrder, useOrderActions, useAdminProofNotes, useCustomerProofNotes, useProofDraft)
- `src/app/_api/` — React Query hooks wrapping Axios calls
  - 25+ subdirectories: address, admin, auth, cart, catalog, categories, collections, company, custom-order, employee, invites, login, order, orders, product, products, proof, roles, superAdmin, team, etc.
- `src/app/_store/` — Zustand stores for client state
  - `authStore.ts`, `ordersStore.ts`, `catalogCategoryStore.ts`, `productOptionsStore.ts`, `regionStore.ts`, plus subdirectories (admin, cart, catalog, dashboard, orders, table)
- `src/app/(authenticated)/` — page routes
  - `admin/` (super admin pages), `catalog/`, `orders/`, `products/` (My Products), `profile/`, `settings/`, `team/`
- `src/app/_hooks/` — shared hooks (usePermissions, useCurrentUser, useMediaQuery, usePagination, etc.)
- `src/app/_interfaces/` — TypeScript type definitions (order, product, employee, team, collection, etc.)
- `src/app/_config/` — routes, features, promo config
- `src/app/_utils/` — utilities
- `src/app/_lib/` — auth context, query context, API client (axiosInstance)
- `src/components/ui/` — 55 shadcn components (StatusBadge, AdaptiveMultiSelect, FilterBar, etc.)
- `src/_quarantine/` — pre-migration Fluent UI code, never import

**Where to add new code:**
- Domain hooks → `src/app/_domain/<domain>/`
- API hooks → `src/app/_api/<domain>/`
- Page hooks → `src/app/(authenticated)/<route>/_hooks/`
- Page components → `src/app/(authenticated)/<route>/_components/`
- Shared components → `src/components/ui/`

## Architecture

- **Domain layer** → **API layer** → **Store layer** → **Page layer**
- Domain hooks compose on top of API hooks. API hooks wrap Axios calls with React Query. Zustand handles client state only — server state is React Query's job.
- **Page pattern:** Thin orchestrator that gates on loading/error, renders an inner component. Inner component receives non-null data and calls domain hooks. This avoids conditional hook calls.
- **Component pattern:** Pages target ~200-300 lines. Extract to `_components/` when growing.
- **Adapter pattern:** `adaptCustomOrder()` transforms raw API responses (snake_case, nested) into typed domain models (camelCase, flat). Proof detail and order detail use different adapters.
- **Mutation pattern:** API mutation hooks own error toasts via `onError`. Never add `onError` at `.mutate()` call sites — causes double toasts.

## Key Entities

- `CustomOrder` — adapted from proof detail endpoint. Key fields: id, jobStatus, orderStatus, proofType, version, notes, uploads, lineItems, isLocked, hasCriticalAlerts
- `OrderEvent` — enum of state machine events (startJob, submitProof, approveProof, rejectProof, etc.)
- `ProofNote` — id, type, title, checked (computed), version, default
- `Upload` — id, url, type (proof/production/artwork/product_thumbnail/product_image), version
- `DraftFile` — local-only file added during current session (not yet saved)
- Relationships: CustomOrder has many Uploads, has many ProofNotes, has many LineItems

## Entry Points

- **Proof detail load:** page → `useCustomOrder(subOrderId)` → `useGetAdminProofBySubId` → `GET /custom-order/{id}` → `adaptCustomOrder()`
- **Order detail load:** page → `useOrderDetail(orderId)` → `useGetOrder` → `GET /custom-order/orders/{id}` → `adaptOrderResponse()`
- **Proof submission:** page → `useOrderActions.submitProof()` → `useSubmitProof` → `POST /custom-order/{id}` with `event: "submitProof"`
- **File upload:** page → `useProofDraft.addFiles()` → local state; `.save()` → `POST /custom-order/{id}/upload`
- **Cart completion:** checkout → `POST /store/carts/{id}/custom-complete`

## Integrations

- **Backend API:** Axios via `@lib/axiosInstance` (`companyApi`), base URL from `NEXT_PUBLIC_API_URL`
- **Auth:** Bearer token in cookies, `useAuthStore` for client state
- **File storage:** S3/CDN URLs from backend responses, uploads via multipart form
- **Base UI:** `@base-ui/react` — NOT Radix. No `asChild`, use `render` prop.
