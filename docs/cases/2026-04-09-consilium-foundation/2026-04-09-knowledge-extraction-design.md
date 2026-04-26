# Knowledge Hub Extraction Pipeline

**Date:** 2026-04-09
**Status:** Approved
**Source:** divinipress-knowledge repo → 25 ultra-specific MD files for graphify ingestion

## Purpose

Extract business domain knowledge from the Divinipress knowledge hub, verify code-facing claims against the store and backend repos, and produce 25 ultra-specific markdown files optimized for graphify knowledge graph extraction. Each file covers one concept completely with named entities, concrete values, rationale sections, and cross-references.

## Pipeline

```
[12 knowledge hub docs] → EXTRACT → VERIFY (tiered) → ENHANCE → [25 files in graphify-source/]
                                         ↓
                                [discrepancy report → Imperator reviews]
```

### Stage 1 — Extract

Read 12 source docs from `/Users/milovan/projects/divinipress-knowledge/`:

**Core (9 files):**
- `core/glossary.md`, `core/glossary.internal.md`
- `core/product-identity.md`, `core/product-identity.internal.md`
- `core/user-workflows.md`, `core/user-workflows.internal.md`
- `core/roles-permissions.md`, `core/roles-permissions.internal.md`
- `core/pricing-model.md`

**Brand (3 files):**
- `brand/messaging.md`
- `brand/voice-and-tone.md`
- `brand/visual-identity.md`

Internal docs (`.internal.md`) are included — they cover super admin features needed for development context.

### Stage 2 — Verify (tiered)

Each claim is classified as code-verifiable or editorial. Editorial claims pass through. Code-verifiable claims are checked against source repos.

**Verification repos:**
- Store: `/Users/milovan/projects/divinipress-store`
- Backend: `/Users/milovan/projects/divinipress-backend`
- Marketing: `/Users/milovan/projects/divinipress-marketing`

**Verification outcomes per claim:**
- **Confirmed** — matches reality, include as-is
- **Corrected** — wrong/drifted, include corrected version with note
- **Unverifiable** — can't determine from code, goes to discrepancy report

#### Tier 1 — Brand (no code verification)

3 files. Editorial decisions, not code claims. Visual tokens get a light check against marketing CSS.

#### Tier 2 — Thin graph coverage (full verification)

8 files. Roles, permissions, teams, company, employee. Graph has fragments from code extraction but knowledge hub claims about capabilities and boundaries need checking. Most discrepancies expected here.

**Anchor files:**
- Store: `src/app/_store/permissions.ts`, `src/app/_store/authStore.ts`
- Backend: `src/api/_permissions/index.ts`, `src/modules/company/models/`

#### Tier 3 — Rich graph coverage (drift-check)

13 files. Proofing, orders, products, pricing, workflows. Graph already covers these well. Verify knowledge hub claims still match current source, correct what's drifted. Specifically: confirm enum values, state names, route paths, and model fields match code. Skip deep behavioral verification (e.g., testing that a state transition actually triggers the expected side effects).

**Anchor files:**
- Store: `src/app/_enums/general/OrderEvent.ts`, `src/app/_enums/general/ProofType.enum.ts`, `src/app/_domain/custom-order/state-machine.ts`, `src/app/_domain/custom-order/types.ts`, `src/app/_api/`
- Backend: `src/modules/custom-order/types/timeline.ts`, `src/modules/custom-order/type.ts` (OrderStatus/JobStatus enums), `src/modules/custom-order/models/`, `src/modules/complex-pricing/`

## Output: 24 Files

### Entities (17 files)

| File | Source docs | Verify against | Tier |
|-|-|-|-|
| `proof.md` | glossary (both), user-workflows (both) | state machine, enums, models | 3 |
| `saved-product.md` | product-identity (both), glossary (both) | product models, API modules | 3 |
| `catalog-product.md` | product-identity (both), glossary (both) | catalog API, product models | 3 |
| `collection.md` | user-workflows, roles-permissions | collection model, API | 3 |
| `team.md` | user-workflows, roles-permissions | team model, API, access logic | 2 |
| `role-admin.md` | roles-permissions (both) | permissions files (both repos) | 2 |
| `role-designer.md` | roles-permissions (both) | permissions files (both repos) | 2 |
| `role-staff.md` | roles-permissions (both) | permissions files (both repos) | 2 |
| `role-super-admin.md` | roles-permissions.internal | admin routes, isSuperAdmin | 2 |
| `custom-order.md` | user-workflows (both) | state machine, timeline, models | 3 |
| `order-status.md` | user-workflows, glossary (both) | OrderEvent.ts, type.ts (OrderStatus enum) | 3 |
| `job-status.md` | glossary.internal, user-workflows.internal | timeline.ts, type.ts (JobStatus enum) | 3 |
| `complex-pricing.md` | pricing-model | complex-pricing module | 3 |
| `payment-status.md` | user-workflows | type.ts (PaymentStatus enum), order models | 3 |
| `company.md` | roles-permissions, user-workflows | company model, auth middleware | 2 |
| `employee.md` | roles-permissions, user-workflows | employee model, invite API | 2 |
| `permission-system.md` | roles-permissions (both) | _permissions/index.ts, _store/permissions.ts | 2 |

### Workflows (5 files)

| File | Source docs | Verify against | Tier |
|-|-|-|-|
| `proofing-flow.md` | user-workflows (both) | state-machine.ts, timeline.ts, type.ts (enums) | 3 |
| `order-lifecycle.md` | user-workflows (both) | custom-order models, cart API, type.ts (enums) | 3 |
| `onboarding-flow.md` | user-workflows | onboarding API, company registration | 3 |
| `invite-flow.md` | user-workflows | invite API, accept-invite routes | 3 |
| `reorder-flow.md` | user-workflows, product-identity | my-products API, cart flow | 3 |

### Brand (3 files)

| File | Source docs | Verify against | Tier |
|-|-|-|-|
| `visual-tokens.md` | visual-identity | marketing repo globals.css | 1 |
| `voice-principles.md` | voice-and-tone | none (editorial) | 1 |
| `brand-identity.md` | messaging, product-identity | none (editorial) | 1 |

## Enhancement Rules

Every output file follows these rules to maximize graphify extraction quality:

1. **Named entities only** — no vague descriptions. "Role: Admin can manage employees, assign permissions, approve orders" not "admins have broad access"
2. **Concrete values** — enum values listed, permission names listed, state names listed
3. **Rationale sections** — WHY this works this way. Graphify extracts rationale as relationship edges
4. **Cross-references** — explicit links to other files. "See `proofing-flow.md` for state transitions" creates graph edges between files
5. **No narrative fluff** — cut marketing language, positioning statements, content that doesn't inform development

## Execution Model

All 25 agents run in parallel — each has independent scope:
- **Tier 1:** 3 agents produce brand files (fast, no verification)
- **Tier 2:** 8 agents read source docs + anchor files, produce corrected output
- **Tier 3:** 14 agents do the same with lighter verification touch

Output lands in `graphify-source/` directory in this project. Discrepancy report aggregates unverifiable claims for Imperator review.

## Terminology Coordination

Parallel agents reading the same source docs will describe identical concepts with different names unless coordinated. Before agents run, extract a canonical terminology list from `glossary.md` + `glossary.internal.md`. Every agent receives this list and must use exact canonical names for entities, states, roles, and permissions. This prevents graphify from creating duplicate nodes from the same concept described differently.

## Cross-Reference Rules

Agents cannot reference specific sections in files being written simultaneously. Cross-references are **file-level only**: "See `permission-system.md`" not "See `permission-system.md#rbac-matrix`". Graphify builds inter-file edges from file-level references. Section-level linking happens in a post-processing pass after all 25 files exist.

## Claim Classification

A claim is **code-verifiable** if its truth can be determined by reading source code files (not running them). Examples: "OrderStatus has 10 states" (read the enum), "Admin can approve orders" (read the permissions file).

A claim is **editorial** if its truth depends on human processes, business decisions, or runtime behavior. Examples: "Account approval takes 1 business day" (operational process), "Typically does not need a new proof" (judgment call).

**Hybrid claims** — statements that mix code facts with editorial qualifications — are split. The code-verifiable portion is verified. The editorial portion passes through with a note that it was not code-verified.

## Verification Anchor Precedence

When anchor files disagree (e.g., `statuses.csv` lists 8 order statuses, `type.ts` enum has 10):
1. **TypeScript enums/types** are canonical — they are what the code actually uses
2. **CSV/reference files** are secondary — they may be stale
3. **Knowledge hub docs** are the claims being verified, not a source of truth

## Source Doc Frontmatter

Knowledge hub source docs contain YAML frontmatter with `sources`, `evidence`, `last_verified`, and `consumers` fields. Agents should **extract useful metadata** (source file paths, feature status) as content inputs but **not include raw YAML** in the output files. The frontmatter is structured data about the docs, not graph-ready content.

## Scope Boundaries

**In scope:**
- Extracting, verifying, and enhancing 25 files from knowledge hub
- Producing discrepancy report for unverifiable claims

**Out of scope:**
- Running graphify on the output
- Updating the knowledge hub source docs
- Deduplicating the existing graphify graph
- Marketing-specific content (approved statements, persona targeting, competitive alternatives)

## Existing Graph Context

The graphify graph (1,461 nodes, 2,398 edges, 119 communities) already covers proofing, orders, pricing, products, roles, teams, and company from code extraction. Brand/voice/visual identity is essentially absent (1 node).

Tier 2 files (roles, permissions, teams, company, employee) get full verification because the knowledge hub makes detailed capability claims that need checking against code — regardless of how many graph nodes exist. Tier 1 fills the brand gap. Tier 3 provides verified domain narrative alongside what the graph already captured.
