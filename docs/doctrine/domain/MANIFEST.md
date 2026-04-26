# Domain Knowledge Manifest

Load relevant files based on the task at hand. Read descriptions to select.
Typical loading budget: 1-3 domain files + 0-1 code maps.

## Domain Concepts

| File | Covers |
|-|-|
| proofing.md | Proof lifecycle, job status vs order status, state machine, super admin pipeline, file uploads, notes |
| products.md | Catalog vs saved products, product creation on approval, image hydration, variant metadata, reorder flow |
| roles.md | Super admin vs admin vs designer vs staff, permissions, company-scoped tenancy |
| orders.md | Order lifecycle, two ordering paths, cart flows, sub-orders, fulfillment, payment |
| teams-collections.md | Teams, collections, staff product assignment, access boundaries |
| naming.md | Display name vs product title, terminology traps, field naming, enum conventions |
| $CONSILIUM_DOCS/doctrine/known-gaps.md | Divinipress recurring-bug memory. Load during any debug session; load in Consul reconnaissance when the topic touches a lane with live known gaps. Entries include Lane, Status, Evidence paths, Debug rule, and Route (in our rank layout). |

## Code Maps

| File | Covers |
|-|-|
| store-code-map.md | Frontend — domain layer, hooks, API surface, page wiring, stores, components |
| backend-code-map.md | Backend — modules, services, routes, models, state machine, workflows, links |
