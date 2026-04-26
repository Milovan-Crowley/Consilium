# Domain Bible — Design Spec

Sub-project 1 of the Consilium roadmap. Produces a modular, living knowledge system that gives agents correct understanding of the Divinipress domain from the start.

## Problem

Agents confidently misunderstand business concepts. The display name incident proved that no amount of code-grepping catches conceptual misunderstanding — the agent targeted the wrong entity entirely because it didn't understand what a saved product is. This class of error recurs across roles, proofing flow, order lifecycle, and product identity.

## Solution

A modular domain knowledge system organized by topic, composed at dispatch time. Not one monolithic file — a set of focused domain files that agents load selectively based on the task at hand.

### What the bible IS

- Business truth about Divinipress entities, relationships, and rules
- Modular files that can be loaded independently or composed
- A reference for concepts, definitions, and constraints
- Designed from day one for a learning loop (staleness detection, session-end updates)

### What the bible is NOT

- Not an armory (assertions, anti-patterns, common mistakes → verification engine, sub-project 3)
- Not persona behavior (agent instructions, trauma → personas, sub-project 2)
- Not a code index (detailed code walkthrough → agents read actual code)

### Separation of concerns

| Layer | What it contains | Where it lives |
|-|-|-|
| Domain Bible | Business truth — what things ARE | `skills/references/domain/` (this sub-project) |
| Armory | Weapons against mistakes — testable assertions | Verification engine (sub-project 3) |
| Persona trauma | Lane-specific scars — agent behavioral instructions | Personas (sub-project 2) |

The flow: Bible informs Armory. Armory arms Personas.

---

## Architecture

### File Organization

```
skills/references/domain/
  MANIFEST.md
  proofing.md
  products.md
  roles.md
  orders.md
  teams-collections.md
  naming.md
  store-code-map.md
  backend-code-map.md
```

### Manifest (MANIFEST.md)

The only file every agent path loads. A short index listing each file with a one-line description. Dispatching agents scan this to select which files to include in subagent prompts.

```markdown
# Domain Knowledge Manifest

Load relevant files based on the task at hand. Read descriptions to select.

## Domain Concepts

| File | Covers |
|-|-|
| proofing.md | Proof lifecycle, job status vs order status, state machine, file uploads, notes, lock semantics |
| products.md | Catalog vs saved products, product creation on approval, image hydration, variant metadata |
| roles.md | Super admin vs admin vs designer vs staff, permissions, company-scoped access |
| orders.md | Order lifecycle, fulfillment, payment, sub-orders, cart flows |
| teams-collections.md | Teams, collections, staff product assignment, access boundaries |
| naming.md | Display name vs product title, terminology traps, field naming conventions |

## Code Maps

| File | Covers |
|-|-|
| store-code-map.md | Frontend entity map — domain layer, hooks, API surface, page wiring, stores |
| backend-code-map.md | Backend entity map — modules, services, routes, models, workflows, links |
```

### Domain File Template

Every domain file follows this structure:

```markdown
---
domain: [topic]
description: [one-line — used by dispatching agents to judge relevance]
sources:
  - [file paths this doc describes — used for staleness detection]
verified: [YYYY-MM-DD — last date contents were confirmed against code]
---

# [Topic]

[One-line TL;DR of what this domain area covers.]

## Concepts

### [Entity or Concept Name]
**Is:** [declarative definition]
**Is not:** [what agents might confuse it with]

[Each concept is a headed subsection. "Is / Is not" format for concepts
where confusion is likely. Plain definition where straightforward.
No code snippets — business terms only.]

## Rules

[Business constraints. Short, imperative statements.
Each rule states WHAT and WHY (one sentence each).
These are facts about the business, not agent instructions.]

## Code Pointers

[Key file paths only — where to start looking.
Not duplicating code maps, just orientation for an agent
reading only this domain file.]

## Related

[Cross-loading hints for the dispatching agent.
"If touching X flow, also load Y.md"]
```

Principles:
- Frontmatter `sources:` enables staleness detection
- Concepts before rules — understand what things are before absorbing constraints
- "Is / Is not" format prevents hallucinated concepts
- One-line TL;DR enables shallow scans
- No assertions, no agent instructions, no code snippets
- Each file targets under ~1500 words — dense enough to be useful, light enough that loading 2-3 doesn't blow context budget

### Code Map Template

Two files, one per repo. Combines structure, architecture, entities, entry points, and integrations — inspired by GSD codebase mapping templates but condensed into a single file per repo.

```markdown
---
repo: [repo name]
path: [absolute path]
verified: [YYYY-MM-DD]
---

# [Repo] Code Map

## Structure
[Directory layout — top-level organization, what lives where.
"Where to add new code" by type. Indented lists, not box-drawing trees.]

## Architecture
[Layers, data flow, key abstractions. How code is organized conceptually.
Patterns used (inner component, domain hooks, adapter, etc.).]

## Key Entities
[Models/types and their relationships. What fields matter.
How entities connect across layers.]

## Entry Points
[Where execution begins for key flows. The path through the codebase,
not the business logic.]

## Integrations
[External dependencies — APIs, storage, auth.
Where secrets live (env var names, not values).]
```

---

## Domain File Contents

### proofing.md

The proof lifecycle. What a proof is. The two proof types (catalog vs order). Job status (11 states — internal, super admin production pipeline) vs order status (10 states — customer-facing lifecycle). How they move independently but in parallel on the same custom_order entity. The super admin production pipeline as a first-class workflow: receiving a new proof → startJob → preparing the proof → submitProof → customer reviews → approved → proceedProduction → tracking → delivery. This is the daily operational flow for Divinipress staff and must be distinct from the customer-facing order lifecycle. State machine events and who triggers them (super admin vs company). Lock semantics (job_status "pending" + no critical alerts). File uploads by type (proof, production, artwork, product_thumbnail, product_image). Proof notes, versioning, the checked field (computed, not stored). The revision cycle. What happens at each state transition.

### products.md

Catalog products vs saved products. Catalog = blanks from vendors that NEED configuration and proofing before they become orderable. Saved = new Medusa product entity created when a catalog proof is approved — locked to one color, skips proofing on reorder. How saved products are created (approval side effects in order-flow.ts — new product, filtered variants, metadata inheritance). Image hydration (thumbnails and gallery stored on custom_order, overlaid at serve time via hydrateImages). Variant metadata inheritance from catalog to saved. The reorder flow and how it links back to the original custom_order via metadata.original_custom_order_id. Product metadata fields (brandName, styleName, vendor, production_option_type).

### roles.md

The two-tier admin distinction: super admin (Divinipress — us, the platform operator) vs admin (customer company admin — their organization's admin). These are fundamentally different roles that agents conflate. Designer role: catalog access + proofing (own proofs), no team management, no billing, no invites. Staff role: most restricted — sees ONLY products assigned to their team's collections, zero catalog access, cannot proof, cannot manage teams. The 30+ granular permissions across 8 domains (dashboard, catalog, my products, orders, proofs, team management, settings, profile). isSuperAdmin flag on backend. Known permission sync gaps between frontend and backend. Company-scoped tenancy — all API routes under /api/company/[handle]/ enforce tenant isolation.

### orders.md

Order lifecycle from cart to delivery. The two ordering paths: Path A (proof-to-my-products — catalog proof type, qty 1, price 0, creates custom_order in "new"/"proofing") and Path B (save-and-add-to-cart — order proof type, real prices, multiple sizes via group_id). Custom-complete flow: what the backend does when a cart completes (validate, create payment collection, complete cart, group items by group_id, create custom_order per group, associate uploads, remap upload IDs). Saved product reorder detection (product.metadata.custom_order_id present → skip proofing, start at "approved"/"proof_done"). Sub-orders grouped by metadata.group_id. Payment status mapping (Medusa v2 uses "completed" not "captured"). Fulfillment and tracking. Order detail vs proof detail endpoints (different response shapes, different adapters).

### teams-collections.md

How products reach staff. Collections group saved products. Teams group users. Collections are assigned to teams by admins. Staff access boundary: staff member → their team → team's collections → saved products in those collections. Staff see ONLY what's assigned — no catalog, no unassigned products, no products from other teams. Admin creates teams, assigns users to teams, assigns collections to teams. My Products page behavior differs by role (admin/designer see all, staff see assigned only).

### naming.md

Terminology traps that cross domain boundaries. Display name vs product title vs product_name field (all different things). uploads vs files (API field is "uploads" — "files" is a different concept in some contexts). employee vs company_employee (proof endpoint returns "employee" which is company_employee renamed by the GET handler; order endpoint returns "customer.company_employee" unrenamed). checked on proof notes (computed from M2M join at API layer, not stored in DB). Enum casing (lowercase in backend — "in_progress" not "IN_PROGRESS"). variant_option_values (flat object on proof endpoint, nested options array on order endpoint). product.metadata vs item.metadata vs custom_order.metadata (three different metadata objects with different contents).

---

## Learning Loop Integration

The domain bible is designed from day one to support a learning loop, but does NOT implement the loop mechanisms itself. Those come in later sub-projects.

### What this sub-project delivers

- Frontmatter contract: every file has `sources:` (file paths) and `verified:` (date)
- File structure that supports appending confirmed learnings to the right section
- Manifest that a session-end agent can scan to identify affected files

### What later sub-projects implement

| Mechanism | Owner | How it uses the bible |
|-|-|-|
| Session-end review | Shared across Consilium skills (sub-projects 4-7) | Consul offers to capture confirmed learnings; identifies the right domain file via manifest; appends to correct section; updates verified date |
| Staleness detection | Skills that load domain files | On load, checks if source files modified since verified date; flags to user if stale |
| Discrepancy detection | Verification engine (sub-project 3) | Verification agents cross-reference domain file claims against actual code; mismatches become findings |

### Design constraints for the loop

- Session-end updates are user-triggered or Consul-offered, never automatic
- Staleness detection flags but does not auto-update
- Each domain file stays focused on one topic — new learnings land in the right file by topic
- Files stay under ~1500 words to prevent unbounded growth; exceeding this signals a split

---

## Dispatch Integration

### How agents get the right files

The dispatching agent (Consul or Legatus) is responsible for selection:

1. Reads MANIFEST.md (always — it's short)
2. Based on task context, selects 1-3 domain files + 0-2 code maps
3. Includes their contents in the subagent prompt

### Selection principles

- Judgment-based, not rule-based — no lookup table mapping task types to files
- Manifest descriptions are written to make this judgment easy
- Code maps are optional — verification agents typically need domain files but not code maps; executor agents need both
- Loading budget: 2-3 domain files + 1 code map is the typical ceiling

### Interface contract with other sub-projects

- Personas (sub-project 2) define WHICH agents load domain files and WHEN
- Verification engine (sub-project 3) defines HOW verification agents use domain files to check specs/plans
- This sub-project defines WHAT the files contain and their structural contract

---

## Implementation Scope

### Deliverables

| File | Description |
|-|-|
| `skills/references/domain/MANIFEST.md` | Index of all domain files with descriptions |
| `skills/references/domain/proofing.md` | Proof lifecycle, job/order status, state machine |
| `skills/references/domain/products.md` | Catalog vs saved products, creation, hydration |
| `skills/references/domain/roles.md` | Super admin vs admin vs designer vs staff, permissions |
| `skills/references/domain/orders.md` | Order lifecycle, cart flows, fulfillment, payment |
| `skills/references/domain/teams-collections.md` | Teams, collections, staff access boundaries |
| `skills/references/domain/naming.md` | Terminology traps, field naming, enum conventions |
| `skills/references/domain/store-code-map.md` | Frontend entity map |
| `skills/references/domain/backend-code-map.md` | Backend entity map |

### Process

1. Dispatch parallel agents to explore both repos — map models, schemas, routes, services, key abstractions
2. Produce code maps first (structural reference from code exploration)
3. Cross-reference both repos' CLAUDE.md files and the divinipress-knowledge/core docs
4. Curate domain files — merge code exploration + existing documentation into topic-focused files
5. Write manifest
6. Validate with user — walk through each domain file for accuracy

### Source material

| Source | What it provides |
|-|-|
| divinipress-store CLAUDE.md | Domain layer, architecture, conventions, design context |
| divinipress-backend CLAUDE.md | Modules, state machine, API patterns, auth flow |
| divinipress-knowledge/core/*.md | Glossary, product identity, roles, workflows, pricing |
| docs/custom-order-domain-reference.md | Hook APIs, adapter mappings, state machine, page wiring |
| docs/product-data-flow-cheatsheet.md | Data flow from PDP to order display, saved product creation |

### Out of scope

- Armory (testable assertions, anti-patterns) — sub-project 3
- Persona definitions and trauma — sub-project 2
- Learning loop mechanisms (staleness detection, session-end review) — later sub-projects
- Code exploration of repos — implementation phase, not spec
