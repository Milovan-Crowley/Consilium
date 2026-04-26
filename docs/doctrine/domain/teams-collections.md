---
domain: teams-collections
description: Teams, collections, staff product assignment, access boundaries
sources:
  - src/modules/company/service.ts
verified: 2026-04-09
---

# Teams & Collections

How products reach staff. The access control chain from saved products through collections and teams to end users.

## Concepts

### Collection
**Is:** A group of saved products, created and managed by admins (and designers). Assigned to teams to make products available to staff. The bridge between the saved product library and staff ordering.
**Is not:** A category or tag. Collections are an access-control mechanism — they determine which products staff can see and order.

### Team
**Is:** A group of users (employees) within a company, created by admins. Teams are assigned collections, which determines what products team members can access.
**Is not:** A department or organizational unit in a general sense. Teams exist specifically as a product-access grouping mechanism.

### Staff Access Boundary
**Is:** A strict chain: staff member → their team → team's collections → saved products in those collections. Staff see ONLY what's at the end of this chain.
**Is not:** A filter or preference. Staff literally cannot see products outside their team's collections. No catalog access. No unassigned products. No products from other teams' collections.

### The Access Chain
```
Admin creates saved product (via proof approval)
  → Admin adds saved product to Collection
    → Admin assigns Collection to Team
      → Admin assigns Staff user to Team
        → Staff sees products in their team's collections
```

Every link in this chain is required. A saved product not in any collection is invisible to all staff. A collection not assigned to any team is invisible to staff. A staff member not on any team sees no products.

### My Products Page
Behavior differs by role:
- **Admin / Designer:** See all saved products across the company
- **Staff:** See only products in their team's collections

## Rules

- Staff cannot access the catalog. They can only see saved products in their team's collections.
- Collections are the bridge between saved products and staff ordering — without collections, staff have nothing to order.
- Only admins can create teams, assign users to teams, and assign collections to teams.
- Designers can manage collections and My Products but cannot create or manage teams.
- A saved product must be in a collection AND that collection must be assigned to a team for staff to see it.

## Code Pointers

- Company module (teams/employees): `src/modules/company/`
- My Products page: `src/app/(authenticated)/products/`
- Team management: `src/app/(authenticated)/team/`

## Related

- How saved products are created → also load **products.md**
- Staff role restrictions → also load **roles.md**
