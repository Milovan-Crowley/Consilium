## Backend Doctrine

Repo: `divinipress-backend` checkout. Default local convention: `$HOME/projects/divinipress-backend`; use the teammate's actual clone path when different.

Canonical truth surfaces:
- `src/api/custom-order/`
- `src/api/store/carts/[id]/custom-complete/route.ts`
- `src/api/_permissions/`
- `src/modules/custom-order/`
- `docs/domain/`

Hard rules:
- Company scoping is a real security boundary.
- Backend business rules beat frontend assumptions.
- Custom order and proofing are first-class domain concepts, not thin ecommerce wrappers.
- Preserve the proof and custom-order lifecycle unless the task explicitly changes it.
- Respect Medusa module structure and strict TypeScript patterns.

Do not assume:
- `GET` handlers are side-effect free.
- Placeholder statuses like `ADMIN_HOLD` are fully wired just because they exist in docs.
- Reorder or fulfillment behavior is settled unless code proves it.
