## Frontend Doctrine

Repo: `divinipress-store` checkout. Default local convention: `$HOME/projects/divinipress-store`; use the teammate's actual clone path when different.

Canonical truth surfaces:
- `src/app/_domain/custom-order/`
- `src/app/_api/custom-order/`, `src/app/_api/order/`, `src/app/_api/orders/`, `src/app/_api/proof/`
- `docs/custom-order-domain-reference.md`
- `docs/component-decisions.md`
- `docs/design-context.md`

Hard rules:
- Never import from `src/_quarantine/`.
- Prefer domain hooks over page-local reinvention.
- Pages stay thin orchestrators.
- `StatusBadge` is the status display primitive.
- No dead aliases, no Radix, no `vaul`, no `asChild`, no `!important`.
- Use native file inputs in portal contexts.

Do not assume:
- Frontend permission gates equal backend authorization.
- Frontend endpoint shapes are symmetric across resources.
- An order is editable just because a UI control exists.
