# Knowledge Hub Extraction Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract 12 knowledge hub docs into 25 verified, ultra-specific markdown files optimized for graphify ingestion.

**Architecture:** Three-phase pipeline — setup (extract canonical terminology), parallel extraction/verification (25 independent agents grouped by tier), post-processing (cross-reference pass + discrepancy report). Each agent reads source docs + anchor files, verifies claims against code, and writes one output file.

**Tech Stack:** Claude agents (Opus), file I/O, grep-based verification against TypeScript source files.

**Spec:** `docs/consilium/specs/2026-04-09-knowledge-extraction-design.md`

---

## Shared References

### Source Repos

| Repo | Path |
|-|-|
| Knowledge Hub | `/Users/milovan/projects/divinipress-knowledge` |
| Store | `/Users/milovan/projects/divinipress-store` |
| Backend | `/Users/milovan/projects/divinipress-backend` |
| Marketing | `/Users/milovan/projects/divinipress-marketing` |

### Output Directory

All output files: `/Users/milovan/projects/Consilium/graphify-source/`

### Output File Template

Every output file follows this structure:

```markdown
# [Concept Name]

[1-2 sentence definition. Named entities, concrete values, no fluff.]

## [Section per major facet of this concept]

[Content with named entities, enum values, permission names, state names.
Every statement is either code-verified or marked as editorial.]

### Why

[Rationale for why this works this way. Graphify extracts these as relationship edges.]

## Related

- See `other-file.md` — [one-line description of relationship]
- See `another-file.md` — [one-line description of relationship]
```

Rules (apply to every file):
1. Named entities only — "Role: Admin can manage employees, assign permissions, approve orders" not "admins have broad access"
2. Concrete values — list actual enum values, permission constants, state names
3. Rationale sections — WHY, not just WHAT
4. Cross-references — file-level only (e.g., "See `proofing-flow.md`"), no section anchors
5. No narrative fluff — cut marketing language, positioning, anything that doesn't inform development

### Claim Classification

- **Code-verifiable:** Truth determinable by reading source files. Verify against anchors.
- **Editorial:** Depends on human processes or business decisions. Pass through unchanged.
- **Hybrid:** Split — verify the code portion, pass through the editorial portion with a note.

### Verification Anchor Precedence

1. TypeScript enums/types (canonical)
2. CSV/reference files (may be stale)
3. Knowledge hub docs (claims being verified, not source of truth)

### Source Doc Frontmatter

Knowledge hub source docs contain YAML frontmatter with `sources`, `evidence`, `last_verified`, and `consumers` fields. Agents should **use the `sources` paths as hints** for where to find verification anchors, and **use evidence tables** to understand feature status. Do NOT include raw YAML in output files — extract the useful information into prose.

### Discrepancy Recording

Each agent appends unverifiable claims to a shared format:

```markdown
## [output-file-name.md]

- **Claim:** "[exact claim text]"
  **Source:** [knowledge hub file:line]
  **Why unverifiable:** [no code equivalent / operational process / judgment call]
```

---

## Phase 0: Setup

### Task 1: Create output directory and extract canonical terminology
> **Confidence: High** — glossary files confirmed at stated paths, structure verified.

**Files:**
- Read: `divinipress-knowledge/core/glossary.md`
- Read: `divinipress-knowledge/core/glossary.internal.md`
- Create: `Consilium/graphify-source/.gitkeep`
- Create: `Consilium/graphify-source/_terminology.md`

- [ ] **Step 1: Create the output directory**

```bash
mkdir -p /Users/milovan/projects/Consilium/graphify-source
touch /Users/milovan/projects/Consilium/graphify-source/.gitkeep
```

- [ ] **Step 2: Read both glossary files**

Read `/Users/milovan/projects/divinipress-knowledge/core/glossary.md` and `/Users/milovan/projects/divinipress-knowledge/core/glossary.internal.md`. Extract every defined term and its canonical name.

- [ ] **Step 3: Read permission files to capture canonical permission names**

Read:
- `/Users/milovan/projects/divinipress-store/src/app/_store/permissions.ts`
- `/Users/milovan/projects/divinipress-backend/src/api/_permissions/index.ts`

Extract every exported permission constant name.

- [ ] **Step 4: Read enum files to capture canonical state names**

Read:
- `/Users/milovan/projects/divinipress-backend/src/modules/custom-order/type.ts` — OrderStatus, JobStatus, PaymentStatus enums
- `/Users/milovan/projects/divinipress-store/src/app/_enums/general/OrderEvent.ts` — order events
- `/Users/milovan/projects/divinipress-store/src/app/_enums/general/ProofType.enum.ts` — proof types

Extract every enum value.

- [ ] **Step 5: Write the canonical terminology file**

Write `/Users/milovan/projects/Consilium/graphify-source/_terminology.md` with this structure:

```markdown
# Canonical Terminology

This file is the single source of term names. All extraction agents MUST use
these exact names when referencing these concepts. Do not paraphrase or alias.

## Domain Terms

- Catalog — [definition from glossary]
- My Products — [definition]
- Collection — [definition]
- Team — [definition]
- Proof / Proofing — [definition]
- Order — [definition]
- [... all terms from glossary.md]

## Internal Terms

- Super Admin — [definition from glossary.internal]
- Job Status — [definition]

## Roles

- Admin
- Designer
- Staff
- Super Admin

## Permission Constants

[List every permission constant from both repos, grouped by domain]

## OrderStatus Enum Values

[List every value from type.ts OrderStatus]

## JobStatus Enum Values

[List every value from type.ts JobStatus]

## PaymentStatus Enum Values

[List every value from type.ts PaymentStatus]

## Order Events

[List every value from OrderEvent.ts]

## Proof Types

[List every value from ProofType.enum.ts]
```

- [ ] **Step 6: Commit**

```bash
cd /Users/milovan/projects/Consilium
git add graphify-source/
git commit -m "feat: create graphify-source directory and canonical terminology"
```

---

## Phase 1: Tier 1 — Brand Files (no verification)

Tasks 2-4 run in parallel. No code verification needed. Read source docs, extract dev-relevant content, enhance for graphify.

### Task 2: Write voice-principles.md
> **Confidence: High** — editorial content, no verification needed.

**Files:**
- Read: `divinipress-knowledge/brand/voice-and-tone.md`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/voice-principles.md`

- [ ] **Step 1: Read the source doc**

Read `/Users/milovan/projects/divinipress-knowledge/brand/voice-and-tone.md`. Identify all dev-relevant content: voice principles, tone-by-context rules, preferred/disallowed terms, content rules, this/not-that examples.

- [ ] **Step 2: Read terminology file**

Read `/Users/milovan/projects/Consilium/graphify-source/_terminology.md`. Use canonical names for all domain references.

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/voice-principles.md`.

Extract and organize:
- The 5 voice principles (priority-ordered) with this/not-that examples
- Tone-by-context guidelines (marketing site, help articles, error messages, email notifications)
- Preferred terms vs disallowed terms (align with canonical terminology)
- Content rules (no invented features, no theological claims, glossary consistency)

Cut: persona-specific messaging (that's marketing strategy, not dev guidance).

Cross-reference: `See brand-identity.md` for brand archetype and positioning.

- [ ] **Step 4: Commit**

```bash
git add graphify-source/voice-principles.md
git commit -m "feat: extract voice-principles.md from knowledge hub"
```

### Task 3: Write brand-identity.md
> **Confidence: High** — editorial content, no verification needed.

**Files:**
- Read: `divinipress-knowledge/brand/messaging.md`
- Read: `divinipress-knowledge/core/product-identity.md`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/brand-identity.md`

- [ ] **Step 1: Read source docs**

Read both files. From `messaging.md`, extract: positioning statement, unique attributes, messaging hierarchy (Levels 1-4), church procurement models, best-fit customer profile, market trends.

**Exclude** (marketing-specific, not dev context): approved/disallowed statements, persona-specific messaging, competitive alternatives.

From `product-identity.md`, extract: what Divinipress is, what it is NOT, feature evidence table, exclusivity claim (faith-based organizations only, account approval).

- [ ] **Step 2: Read terminology file**

Use canonical names for all domain references.

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/brand-identity.md`.

Structure around:
- What Divinipress is (platform identity, target audience, exclusivity)
- What Divinipress is NOT (not a marketplace, not a design editor, not SaaS with per-seat fees)
- Brand archetype ("the youth pastor" — from voice-and-tone.md)
- Unique attributes (with value mapping from messaging.md)
- Church procurement models (centralized vs decentralized, role mapping)
- Feature inventory (from product-identity evidence table — list what's live)

### Why section: explain WHY the platform serves only faith-based organizations (account approval, trust model, specialized needs).

Cross-reference: `See voice-principles.md`, `See role-admin.md`, `See catalog-product.md`

- [ ] **Step 4: Commit**

```bash
git add graphify-source/brand-identity.md
git commit -m "feat: extract brand-identity.md from knowledge hub"
```

### Task 4: Write visual-tokens.md
> **Confidence: High** — mostly editorial, light CSS verification.

**Files:**
- Read: `divinipress-knowledge/brand/visual-identity.md`
- Read: `divinipress-marketing/src/styles/globals.css` (light verification)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/visual-tokens.md`

- [ ] **Step 1: Read the source doc**

Read `/Users/milovan/projects/divinipress-knowledge/brand/visual-identity.md`. Extract all design tokens: colors (hex values), typography (fonts, weights, sizes), spacing, shadows, component styles (buttons, cards, sections), motion/interaction rules.

- [ ] **Step 2: Light CSS verification**

Read `/Users/milovan/projects/divinipress-marketing/src/styles/globals.css`. Spot-check that the primary color (`#008A70`), background cream (`#FDFAF6`), and font declarations match the knowledge hub claims. If they don't, use the CSS values (code is canonical).

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/visual-tokens.md`.

Structure around:
- Color palette (10 tokens with hex values and usage context)
- Typography (font families, weights, sizes per context: hero, section, card, button, body)
- Spacing system (section rhythm, margins, padding)
- Component styles (button variants, card specs, header/navbar, frame system)
- Shadow system (layers, values)
- Motion rules (transition durations, hover behavior, scroll behavior)
- Design principles (5 principles with concrete examples)
- What we are NOT (anti-patterns: Slack-loud, enterprise-cold, churchy clip art, SaaS template)

Note corrections if CSS values differ from knowledge hub claims.

Cross-reference: `See brand-identity.md`, `See voice-principles.md`

- [ ] **Step 4: Commit**

```bash
git add graphify-source/visual-tokens.md
git commit -m "feat: extract visual-tokens.md from knowledge hub"
```

---

## Phase 2: Tier 2 — Full Verification

Tasks 5-12 run in parallel. Each agent reads source docs + specific anchor files, verifies every code-facing claim, and produces corrected output. These areas have the most expected discrepancies.

### Task 5: Write permission-system.md
> **Confidence: High** — both permission files confirmed at stated paths.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Read: `divinipress-knowledge/core/roles-permissions.internal.md`
- Verify: `divinipress-backend/src/api/_permissions/index.ts`
- Verify: `divinipress-store/src/app/_store/permissions.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/permission-system.md`

- [ ] **Step 1: Read source docs**

Read both roles-permissions files. Extract all claims about the permission system: number of permissions, domain groupings, how RBAC works, permission inheritance.

- [ ] **Step 2: Read both permission anchor files**

Read the backend `_permissions/index.ts` and store `permissions.ts`. Extract:
- Every permission constant name
- Domain groupings (if any)
- Role-to-permission mappings
- Any intentional divergence between store and backend (the knowledge hub documents some as "Temporary Store-Only Permissions" — these are confirmed, not errors)

- [ ] **Step 3: Verify claims against code**

For each claim in the knowledge hub:
- "30+ permissions across 8 domains" — count actual permissions and domains in `_permissions/index.ts`
- Permission names listed — confirm each exists in the code
- Role mappings — confirm which permissions map to which roles

Record **Confirmed**, **Corrected** (with what changed), or **Unverifiable** for each claim.

- [ ] **Step 4: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/permission-system.md`.

Structure:
- How RBAC works in Divinipress (company-scoped, role-based)
- Complete permission list grouped by domain (use actual names from code)
- Role-to-permission mapping matrix
- Store vs backend permission alignment (note intentional divergences)
- Permission checking flow (middleware, frontend guards)

### Why section: explain WHY permissions are company-scoped (multi-tenancy), WHY store has temporary extra permissions.

Cross-reference: `See role-admin.md`, `See role-designer.md`, `See role-staff.md`, `See role-super-admin.md`, `See company.md`

- [ ] **Step 5: Record unverifiable claims**

Append any unverifiable claims to the discrepancy log format (see Shared References).

- [ ] **Step 6: Commit**

```bash
git add graphify-source/permission-system.md
git commit -m "feat: extract and verify permission-system.md"
```

### Task 6: Write role-admin.md
> **Confidence: High** — permissions files are the verification anchor, confirmed.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Read: `divinipress-knowledge/core/roles-permissions.internal.md`
- Verify: `divinipress-backend/src/api/_permissions/index.ts`
- Verify: `divinipress-store/src/app/_store/permissions.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/role-admin.md`

- [ ] **Step 1: Read source docs**

Extract all claims about the Admin role: capabilities, permissions, what Admin CAN and CANNOT do.

- [ ] **Step 2: Verify against permission files**

Read both permission files. Confirm which permissions map to the Admin role. Check every capability claim: "Admin can manage employees" — is there a permission for employee management assigned to Admin?

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/role-admin.md`.

Structure:
- Role definition (who is an Admin, how they get this role)
- Complete capability list (verified against permissions — every capability backed by a specific permission constant)
- What Admin cannot do (explicit negations, verified)
- Admin-specific workflows (employee management, order approval, proof review)

### Why section: explain WHY Admin has these specific boundaries.

Cross-reference: `See permission-system.md`, `See role-designer.md`, `See role-staff.md`, `See employee.md`, `See proofing-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/role-admin.md
git commit -m "feat: extract and verify role-admin.md"
```

### Task 7: Write role-designer.md
> **Confidence: High** — same verification approach as role-admin.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Verify: `divinipress-backend/src/api/_permissions/index.ts`
- Verify: `divinipress-store/src/app/_store/permissions.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/role-designer.md`

- [ ] **Step 1: Read source docs and verify against permission files**

Same approach as Task 6 but for the Designer role. Extract claims, verify each capability against permission constants.

- [ ] **Step 2: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/role-designer.md`.

Structure:
- Role definition
- Complete capability list (verified)
- What Designer cannot do (verified — e.g., cannot manage teams, cannot manage billing)
- Designer-specific workflows

### Why section: explain WHY Designer has different access than Admin.

Cross-reference: `See permission-system.md`, `See role-admin.md`, `See proofing-flow.md`, `See catalog-product.md`

- [ ] **Step 3: Record unverifiable claims, commit**

```bash
git add graphify-source/role-designer.md
git commit -m "feat: extract and verify role-designer.md"
```

### Task 8: Write role-staff.md
> **Confidence: High** — same verification approach.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Verify: `divinipress-backend/src/api/_permissions/index.ts`
- Verify: `divinipress-store/src/app/_store/permissions.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/role-staff.md`

- [ ] **Step 1: Read source docs and verify against permission files**

Extract claims about Staff role. Key claim to verify: "Staff can only order from assigned Collections." Check permission constants and team/collection access logic.

- [ ] **Step 2: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/role-staff.md`.

Structure:
- Role definition (most restricted customer role)
- Complete capability list (verified)
- Explicit limitations (cannot approve orders, cannot manage catalog, collection-scoped access)
- Staff ordering workflow (Collection → Cart → Order)

### Why section: explain WHY Staff is restricted to Collections (delegated ordering for larger churches).

Cross-reference: `See permission-system.md`, `See collection.md`, `See team.md`, `See order-lifecycle.md`

- [ ] **Step 3: Record unverifiable claims, commit**

```bash
git add graphify-source/role-staff.md
git commit -m "feat: extract and verify role-staff.md"
```

### Task 9: Write role-super-admin.md
> **Confidence: High** — internal docs + backend admin routes verified.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.internal.md`
- Read: `divinipress-knowledge/core/product-identity.internal.md`
- Verify: `divinipress-backend/src/api/super-admin/` (routes)
- Verify: `divinipress-store/src/app/(authenticated)/admin/` (pages)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/role-super-admin.md`

- [ ] **Step 1: Read source docs**

Extract all Super Admin claims from internal docs: elevated access, impersonation, organization management, product curation.

- [ ] **Step 2: Verify against admin routes and pages**

Read the backend `super-admin/` routes — what endpoints exist? Read the store `admin/` pages — what admin UI exists? Confirm `isSuperAdmin` flag usage.

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/role-super-admin.md`.

Structure:
- Role definition (internal, not customer-facing, Divinipress staff only)
- How Super Admin is assigned (`isSuperAdmin` flag)
- Capabilities (verified against admin routes/pages)
- Super Admin workflows (organization management, product curation, impersonation)
- What's live vs partial (from internal doc status flags)

### Why section: explain WHY Super Admin exists separately from Admin (platform-level vs company-level).

Cross-reference: `See role-admin.md`, `See permission-system.md`, `See company.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/role-super-admin.md
git commit -m "feat: extract and verify role-super-admin.md"
```

### Task 10: Write team.md
> **Confidence: High** — team model confirmed at backend modules.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (team sections)
- Read: `divinipress-knowledge/core/roles-permissions.md` (team-related permissions)
- Verify: `divinipress-backend/src/modules/company/models/team.ts`
- Verify: `divinipress-store/src/app/(authenticated)/team/` (pages)
- Verify: `divinipress-store/src/app/_api/team/` (if exists)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/team.md`

- [ ] **Step 1: Read source docs, extract team claims**

- [ ] **Step 2: Verify against team model and routes**

Read the team model. Confirm: fields, relationships (team → staff, team → collections). Check store routes for team management pages.

- [ ] **Step 3: Write the output file**

Write `/Users/milovan/projects/Consilium/graphify-source/team.md`.

Structure:
- What a Team is (organizational grouping within a company)
- Team model fields (from backend model)
- Team → Staff assignment relationship
- Team → Collection visibility relationship
- Team management operations (create, update, delete, assign members)
- Access boundary rules (Staff sees only their team's collections)

### Why section: explain WHY teams exist (large churches with multiple departments need delegated ordering).

Cross-reference: `See role-staff.md`, `See collection.md`, `See company.md`, `See employee.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/team.md
git commit -m "feat: extract and verify team.md"
```

### Task 11: Write company.md
> **Confidence: High** — company model confirmed at backend modules.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md` (company-scoped tenancy)
- Read: `divinipress-knowledge/core/user-workflows.md` (onboarding, company context)
- Verify: `divinipress-backend/src/modules/company/models/company.ts`
- Verify: `divinipress-backend/src/modules/company/models/employee.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/company.md`

- [ ] **Step 1: Read source docs, extract company claims**

- [ ] **Step 2: Verify against company model**

Read the company model. Confirm: fields, relationships (company → employees, company → products, company → teams). Check how company-scoping works in auth/middleware.

- [ ] **Step 3: Write the output file**

Structure:
- What a Company is (tenant entity, multi-tenant scoping boundary)
- Company model fields
- Company relationships (owns employees, products, teams, collections, orders)
- Company-scoped isolation (how auth middleware enforces tenancy)
- Company onboarding (account creation, approval process)

### Why section: explain WHY company-scoped isolation exists (B2B multi-tenant, each church is its own company).

Cross-reference: `See employee.md`, `See team.md`, `See role-admin.md`, `See onboarding-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/company.md
git commit -m "feat: extract and verify company.md"
```

### Task 12: Write employee.md
> **Confidence: High** — employee model confirmed at backend modules.

**Files:**
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Read: `divinipress-knowledge/core/user-workflows.md` (invite flow, onboarding)
- Verify: `divinipress-backend/src/modules/company/models/employee.ts`
- Verify: `divinipress-backend/src/api/company/employees/` (routes)
- Verify: `divinipress-store/src/app/_api/employee/` (if exists)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/employee.md`

- [ ] **Step 1: Read source docs, extract employee claims**

- [ ] **Step 2: Verify against employee model and routes**

Read the employee model. Confirm: fields (role, company, teams), relationships. Check API routes for employee CRUD operations.

- [ ] **Step 3: Write the output file**

Structure:
- What an Employee is (company-scoped user entity)
- Employee model fields
- Employee lifecycle (invited → accepted → active)
- Employee-Role relationship (each employee has exactly one role)
- Employee-Team assignment
- Employee management operations (invite, update role, deactivate)

### Why section: explain WHY employees are company-scoped (not global users).

Cross-reference: `See company.md`, `See role-admin.md`, `See invite-flow.md`, `See team.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/employee.md
git commit -m "feat: extract and verify employee.md"
```

---

## Phase 3: Tier 3 — Drift-Check Verification

Tasks 13-26 run in parallel. The graph already covers these well from code. Verify knowledge hub claims still match current code: confirm enum values, state names, route paths, model fields. Skip deep behavioral verification.

**Proofing-flow exception:** For `proofing-flow.md` (Task 18), also verify transition sequences — which states can transition to which — not just state names. The state machine is too important to get transitions wrong.

### Task 13: Write proof.md
> **Confidence: High** — glossary + user-workflows provide the source, state machine files confirmed.

**Files:**
- Read: `divinipress-knowledge/core/glossary.md` (Proof/Proofing definition)
- Read: `divinipress-knowledge/core/glossary.internal.md` (Job Status)
- Read: `divinipress-knowledge/core/user-workflows.md` (proofing sections)
- Read: `divinipress-knowledge/core/user-workflows.internal.md`
- Verify: `divinipress-store/src/app/_domain/custom-order/state-machine.ts`
- Verify: `divinipress-store/src/app/_enums/general/ProofType.enum.ts`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/proof.md`

- [ ] **Step 1: Read source docs, extract proof concept claims**

- [ ] **Step 2: Verify enum values and state names against code**

Confirm: ProofType enum values, JobStatus enum values (these are the proof lifecycle states), proof-related model fields.

- [ ] **Step 3: Write the output file**

Structure:
- What a Proof is (design review artifact in the proofing workflow)
- Proof types (from ProofType enum — list actual values)
- Proof lifecycle states (JobStatus enum values — the proof progresses through these)
- Proof entity relationships (belongs to CustomOrder, has ProofNotes, has Uploads)
- Proof approval → creates Saved Product (the key transformation)
- Admin vs customer proof notes (separate visibility)

### Why section: explain WHY proofs exist (quality control before production — churches need to approve designs before printing).

Cross-reference: `See proofing-flow.md`, `See saved-product.md`, `See job-status.md`, `See custom-order.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/proof.md
git commit -m "feat: extract and verify proof.md"
```

### Task 14: Write saved-product.md
> **Confidence: High** — product models confirmed at backend.

**Files:**
- Read: `divinipress-knowledge/core/product-identity.md`
- Read: `divinipress-knowledge/core/product-identity.internal.md`
- Read: `divinipress-knowledge/core/glossary.md`
- Verify: `divinipress-backend/src/modules/company/models/product.ts`
- Verify: `divinipress-store/src/app/_api/products/` or `_api/product/` (check which exists)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/saved-product.md`

- [ ] **Step 1: Read source docs, extract saved product claims**

Key distinction: a Saved Product is a customer-owned copy created through proof approval. It is NOT a catalog product.

- [ ] **Step 2: Verify against product model and API**

Read the product model. Confirm: fields, relationship to company (owned by), relationship to catalog product (derived from). Check the API modules for my-products operations.

- [ ] **Step 3: Write the output file**

Structure:
- What a Saved Product is (customer-owned copy, created on proof approval)
- How it differs from Catalog Product (different ownership, lifecycle, data model)
- Saved Product model fields (verified)
- How Saved Products are created (proof approval → product creation)
- Reorder flow (ordering again from a saved product)
- Display name concept (customer-chosen name vs catalog product title)

### Why section: explain WHY saved products are separate from catalog products (customer ownership, customization data, reorder capability).

Cross-reference: `See catalog-product.md`, `See proof.md`, `See proofing-flow.md`, `See reorder-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/saved-product.md
git commit -m "feat: extract and verify saved-product.md"
```

### Task 15: Write catalog-product.md
> **Confidence: High** — catalog API confirmed.

**Files:**
- Read: `divinipress-knowledge/core/product-identity.md`
- Read: `divinipress-knowledge/core/glossary.md`
- Verify: `divinipress-store/src/app/_api/catalog/` (modules)
- Verify: `divinipress-backend/src/modules/company/models/product.ts` (if catalog-specific)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/catalog-product.md`

- [ ] **Step 1-3: Same pattern as Task 14 but for catalog products**

Structure:
- What a Catalog Product is (vendor blank, available for ordering/proofing)
- How it differs from Saved Product
- Product categories, variant metadata
- Image hydration (how product images work)
- Catalog browsing flow

### Why section: explain WHY catalog products are separate (vendor-managed blanks vs customer-owned customized items).

Cross-reference: `See saved-product.md`, `See proof.md`, `See collection.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/catalog-product.md
git commit -m "feat: extract and verify catalog-product.md"
```

### Task 16: Write collection.md
> **Confidence: High** — collection model confirmed at backend.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md`
- Read: `divinipress-knowledge/core/roles-permissions.md`
- Verify: `divinipress-backend/src/modules/company/models/product-collection.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/collection.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- What a Collection is (curated product grouping, access boundary for Staff)
- Collection model fields
- Collection → Product relationship
- Collection → Team visibility relationship
- Who can create/manage collections (Admin, Designer)
- Staff access through collections (can only see/order from assigned team's collections)

### Why section: explain WHY collections exist (organize catalog for different groups, enable delegated Staff ordering).

Cross-reference: `See team.md`, `See role-staff.md`, `See catalog-product.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/collection.md
git commit -m "feat: extract and verify collection.md"
```

### Task 17: Write custom-order.md
> **Confidence: High** — state machine and timeline files confirmed.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md`
- Read: `divinipress-knowledge/core/user-workflows.internal.md`
- Verify: `divinipress-store/src/app/_domain/custom-order/state-machine.ts`
- Verify: `divinipress-store/src/app/_domain/custom-order/types.ts`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts`
- Verify: `divinipress-backend/src/modules/custom-order/types/timeline.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/custom-order.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- What a Custom Order is (the order entity with dual state machine)
- OrderStatus states (verified from enum — list all values)
- JobStatus states (verified from enum — list all values)
- Dual state machine concept (order-level vs job-level tracking)
- Timeline system (how state transitions are recorded)
- Custom order model fields
- Locking semantics (optimistic locking for concurrent edits)

### Why section: explain WHY dual state machine (customer sees order status, admin tracks job status for production).

Cross-reference: `See order-status.md`, `See job-status.md`, `See order-lifecycle.md`, `See proofing-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/custom-order.md
git commit -m "feat: extract and verify custom-order.md"
```

### Task 18: Write proofing-flow.md
> **Confidence: High** — state machine files confirmed. **Note:** verify transition sequences, not just state names.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (proofing workflow sections)
- Read: `divinipress-knowledge/core/user-workflows.internal.md`
- Verify: `divinipress-store/src/app/_domain/custom-order/state-machine.ts` — **read transition rules, not just state names**
- Verify: `divinipress-backend/src/modules/custom-order/types/timeline.ts`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts` (JobStatus enum)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/proofing-flow.md`

- [ ] **Step 1: Read source docs**

- [ ] **Step 2: Verify state machine transitions (deeper than typical Tier 3)**

Read `state-machine.ts` carefully. For each state, identify:
- What transitions are allowed FROM this state
- What transitions are allowed TO this state
- Guard conditions (if any)

This is more than drift-checking — get the transitions right.

- [ ] **Step 3: Write the output file**

Structure:
- Proofing flow overview (submit → review → approve/reject → production → delivery)
- State-by-state breakdown: each JobStatus value with allowed transitions (verified from state machine)
- Transition triggers (what actions cause each transition)
- Proof submission (file uploads, notes)
- Proof review (admin reviews, approves or requests changes)
- Proof approval outcome (creates Saved Product)
- Proof rejection outcome (revision cycle)
- Admin vs customer proof notes

### Why section: explain WHY proofing exists (quality gate before production, preventing costly print errors).

Cross-reference: `See proof.md`, `See job-status.md`, `See custom-order.md`, `See saved-product.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/proofing-flow.md
git commit -m "feat: extract and verify proofing-flow.md"
```

### Task 19: Write order-status.md
> **Confidence: High** — OrderStatus enum confirmed in type.ts.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md`
- Read: `divinipress-knowledge/core/glossary.md`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts` (OrderStatus enum)
- Verify: `divinipress-store/src/app/_enums/general/OrderEvent.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/order-status.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Complete OrderStatus enum (every value, verified)
- What each status means (from knowledge hub, verified against code naming)
- Status transitions (which statuses can follow which)
- OrderEvent mapping (events that trigger status changes)
- Customer visibility vs admin visibility

### Why section: explain WHY order statuses exist separately from job statuses.

Cross-reference: `See job-status.md`, `See custom-order.md`, `See order-lifecycle.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/order-status.md
git commit -m "feat: extract and verify order-status.md"
```

### Task 20: Write job-status.md
> **Confidence: High** — JobStatus enum confirmed in type.ts.

**Files:**
- Read: `divinipress-knowledge/core/glossary.internal.md`
- Read: `divinipress-knowledge/core/user-workflows.internal.md`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts` (JobStatus enum)
- Verify: `divinipress-backend/src/modules/custom-order/types/timeline.ts`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/job-status.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Complete JobStatus enum (every value, verified)
- What each status means
- Distinction from OrderStatus (job-level = production tracking, order-level = customer-facing)
- Super Admin visibility (only Super Admin sees JobStatus in full)
- Timeline integration (how job status changes are recorded)

### Why section: explain WHY job status is internal (production pipeline detail that customers don't need to see).

Cross-reference: `See order-status.md`, `See custom-order.md`, `See role-super-admin.md`, `See proofing-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/job-status.md
git commit -m "feat: extract and verify job-status.md"
```

### Task 21: Write payment-status.md
> **Confidence: Medium** — PaymentStatus enum expected in type.ts but not explicitly referenced in knowledge hub docs. Extracted primarily from code.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (payment-related sections)
- Verify: `divinipress-backend/src/modules/custom-order/type.ts` (PaymentStatus enum)
- Verify: `divinipress-backend/src/file/statuses.csv` (Payment section — secondary, may be stale)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/payment-status.md`

- [ ] **Step 1: Read source docs and verify PaymentStatus enum**

The knowledge hub may have minimal payment status content. The primary source is the TypeScript enum. Read `type.ts` and extract all PaymentStatus values.

- [ ] **Step 2: Write the output file**

Structure:
- Complete PaymentStatus enum (every value from code)
- What each status means
- Payment status transitions
- Relationship to order lifecycle (payment status is tracked alongside order status)

### Why section: explain WHY payment status is tracked separately (orders can be partially paid, refunded, etc.).

Cross-reference: `See order-status.md`, `See order-lifecycle.md`, `See custom-order.md`

- [ ] **Step 3: Record unverifiable claims, commit**

```bash
git add graphify-source/payment-status.md
git commit -m "feat: extract and verify payment-status.md"
```

### Task 22: Write complex-pricing.md
> **Confidence: High** — complex-pricing module confirmed at backend.

**Files:**
- Read: `divinipress-knowledge/core/pricing-model.md`
- Verify: `divinipress-backend/src/modules/complex-pricing/`
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/complex-pricing.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Pricing model overview (margin-based, no platform fees, no per-seat charges)
- Complex pricing module structure (from backend module)
- Pricing methods (screen print, DTG, embroidery — if in code)
- Pricing components (base surcharge, decoration surcharge, tiers)
- Custom sourcing concept (operational capability)

### Why section: explain WHY margin-based pricing (churches get wholesale-like pricing without SaaS fees).

Cross-reference: `See brand-identity.md`, `See catalog-product.md`, `See order-lifecycle.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/complex-pricing.md
git commit -m "feat: extract and verify complex-pricing.md"
```

### Task 23: Write order-lifecycle.md
> **Confidence: High** — custom-order models confirmed.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (ordering sections)
- Read: `divinipress-knowledge/core/user-workflows.internal.md`
- Verify: `divinipress-backend/src/modules/custom-order/type.ts` (OrderStatus enum)
- Verify: `divinipress-store/src/app/_api/cart/` (cart API)
- Verify: `divinipress-store/src/app/_api/orders/` or `_api/order/` (order API)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/order-lifecycle.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Order lifecycle overview (cart → checkout → proofing → production → fulfillment → delivery)
- Two ordering paths (from knowledge hub — verify both exist in code)
- Cart flow (add items, checkout)
- Order creation (what happens at checkout)
- Order → Proofing handoff
- Fulfillment flow
- Order status progression (reference order-status.md)

### Why section: explain WHY two ordering paths exist (catalog browsing vs reorder from saved products).

Cross-reference: `See order-status.md`, `See payment-status.md`, `See proofing-flow.md`, `See custom-order.md`, `See reorder-flow.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/order-lifecycle.md
git commit -m "feat: extract and verify order-lifecycle.md"
```

### Task 24: Write onboarding-flow.md
> **Confidence: Medium** — onboarding routes expected but not individually verified.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (onboarding section)
- Verify: `divinipress-backend/src/api/company/onboarding/` (if exists)
- Verify: `divinipress-store/src/app/_api/onboarding/` (if exists)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/onboarding-flow.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Onboarding flow overview (register → account approval → first login → setup)
- Registration process
- Account approval (faith-based verification — likely editorial/manual process)
- First login experience
- Company setup steps

### Why section: explain WHY account approval exists (exclusive to faith-based orgs, prevents misuse).

Cross-reference: `See company.md`, `See employee.md`, `See role-admin.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/onboarding-flow.md
git commit -m "feat: extract and verify onboarding-flow.md"
```

### Task 25: Write invite-flow.md
> **Confidence: Medium** — invite routes expected but not individually verified.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (invite section)
- Verify: `divinipress-backend/src/api/company/invites/` (if exists)
- Verify: `divinipress-store/src/app/accept-invite/` (page)
- Verify: `divinipress-store/src/app/_api/invites/` (if exists)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/invite-flow.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Invite flow overview (Admin creates → email sent → recipient accepts → employee created)
- Invite creation (who can invite, role assignment at invite time)
- Invite acceptance (accept-invite page flow)
- Employee activation (what happens after accepting)

### Why section: explain WHY invites exist (controlled onboarding within a company, Admin controls who joins).

Cross-reference: `See employee.md`, `See role-admin.md`, `See company.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/invite-flow.md
git commit -m "feat: extract and verify invite-flow.md"
```

### Task 26: Write reorder-flow.md
> **Confidence: Medium** — my-products API expected but not individually verified.

**Files:**
- Read: `divinipress-knowledge/core/user-workflows.md` (reorder section)
- Read: `divinipress-knowledge/core/product-identity.md`
- Verify: `divinipress-store/src/app/_api/products/` or `_api/product/`
- Verify: `divinipress-store/src/app/(authenticated)/products/` (my products pages)
- Read: `Consilium/graphify-source/_terminology.md`
- Create: `Consilium/graphify-source/reorder-flow.md`

- [ ] **Step 1-3: Read, verify, write**

Structure:
- Reorder flow overview (Saved Product → new order, bypasses proofing if unchanged)
- What carries over from the original order
- When a new proof is needed vs not
- Size/quantity changes
- My Products page (where reorders start)

### Why section: explain WHY reorder exists (churches reorder the same items regularly — seasons, events, new staff).

Cross-reference: `See saved-product.md`, `See order-lifecycle.md`, `See proof.md`

- [ ] **Step 4: Record unverifiable claims, commit**

```bash
git add graphify-source/reorder-flow.md
git commit -m "feat: extract and verify reorder-flow.md"
```

---

## Phase 4: Post-Processing

### Task 27: Cross-reference pass
> **Confidence: High** — straightforward file-level linking after all files exist.

**Files:**
- Modify: all 25 files in `Consilium/graphify-source/`

**Depends on:** Tasks 2-26 (all extraction tasks must complete first)

- [ ] **Step 1: Read all 25 output files**

Read every file in `graphify-source/` (excluding `_terminology.md`).

- [ ] **Step 2: Verify cross-references**

For each `See X.md` reference in every file:
- Confirm the referenced file exists
- Confirm the relationship description is accurate given the actual content
- Add missing cross-references where concepts clearly relate but no link exists

- [ ] **Step 3: Check terminology consistency**

Compare entity names used across all 25 files against `_terminology.md`. Flag any inconsistencies — same concept called different names in different files.

- [ ] **Step 4: Fix inconsistencies**

Update files to use canonical terminology. Add missing cross-references. Remove any cross-references to files that don't exist.

- [ ] **Step 5: Commit**

```bash
git add graphify-source/
git commit -m "fix: cross-reference pass across all extraction files"
```

### Task 28: Aggregate discrepancy report
> **Confidence: High** — collecting outputs from previous tasks.

**Files:**
- Read: all unverifiable claims recorded during Tasks 5-26
- Create: `Consilium/graphify-source/DISCREPANCY_REPORT.md`

**Depends on:** Tasks 5-26 (all verification tasks must complete first)

- [ ] **Step 1: Collect all unverifiable claims**

Read every output file. Identify any claims marked as unverifiable, editorial pass-throughs with notes, or corrections made during verification.

- [ ] **Step 2: Write the discrepancy report**

Write `/Users/milovan/projects/Consilium/graphify-source/DISCREPANCY_REPORT.md`.

Structure:

```markdown
# Discrepancy Report

## Summary

- Total claims verified: [count]
- Confirmed: [count]
- Corrected: [count]
- Unverifiable: [count]

## Corrections Made

[List every claim that was corrected, with before/after and source file]

## Unverifiable Claims — Awaiting Imperator Review

[List every claim that could not be verified from code, grouped by output file]

## [output-file-name.md]

- **Claim:** "[exact claim text]"
  **Source:** [knowledge hub file]
  **Why unverifiable:** [reason]
  **Recommendation:** [include as-is / exclude / needs investigation]
```

- [ ] **Step 3: Commit**

```bash
git add graphify-source/DISCREPANCY_REPORT.md
git commit -m "docs: aggregate discrepancy report from extraction pipeline"
```

---

## Execution Order

```
Task 1 (setup + terminology)
    ↓
Tasks 2-26 (all parallel — independent scope, shared terminology)
    ↓
Tasks 27-28 (sequential — cross-reference pass, then discrepancy report)
```

Total: 28 tasks. 25 run in parallel (after setup). 2 run sequentially after.
