---
status: draft
opened: 2026-05-01
target: divinipress-store
agent: codex
type: bug
sessions: 1
current_session: 1
---

## Current state

Diagnosis packet filled and route decision captured in `spec.md`. No storefront fix has been implemented.

## What's next

- [x] Consul reviews diagnosis and chooses route.
- [x] If keeping current URL shape, route a small storefront resolver fix.
- [ ] If changing to nested category URLs, open a separate routing spec.
- [ ] Implement the storefront resolver fix.
- [ ] Verify display, print, promo, and apparel category behavior before completion.

## Open questions

- Exact authenticated `/store/product-categories?include_descendants_tree=true` payload ordering should be captured before implementation.
