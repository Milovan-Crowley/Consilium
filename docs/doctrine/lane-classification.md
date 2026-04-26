# Lane Classification — Taxonomy for the Medicus

The Medicus applies this taxonomy in Phase 1 of a debug session to pick the matching lane guide and the matching Medusa Rig skill(s).

## The Six Lanes

- **`storefront`** — Customer-facing pages in `/Users/milovan/projects/divinipress-store`. Includes checkout, proofing UI, account, cart, home, category/product pages.
- **`storefront-super-admin`** — Super Admin surfaces in `/Users/milovan/projects/divinipress-store`. Distinct components, distinct permissions (super-admin-only), distinct flows (cross-company visibility, team administration, moderation queues). React app but different layout, permission scopes, and data contracts from the customer storefront.
- **`admin-dashboard`** — Medusa Admin dashboard extensions in `/Users/milovan/projects/divinipress-backend/src/admin/`. Widgets, custom pages, forms, tables embedded in the Medusa Admin UI. Requires `building-admin-dashboard-customizations` + `building-with-medusa` because admin customizations are UI on top of backend.
- **`medusa-backend`** — Medusa backend work in `/Users/milovan/projects/divinipress-backend/src/{modules,workflows,api,subscribers}/`. Modules, workflows, API routes, module links, data models, subscribers.
- **`cross-repo`** — Flows spanning both repos. Storefront consumes a backend API; a backend workflow produces state the storefront reads; a contract evolution requires coordinated changes. THIS IS THE DEFAULT SUSPECT for ambiguous Divinipress bugs.
- **`unknown`** — Symptoms that cannot be classified at summons time. Re-classify after scout evidence returns.

## Classification Heuristics (symptom → lane)

1. Does the symptom involve a customer-observable UI failure (broken page, missing data in UI, incorrect render)?
   - Yes → start with `storefront` or `storefront-super-admin`. Route to `cross-repo` if the missing data or incorrect render depends on a backend API shape.
   - No → go to 2.

2. Does the symptom involve the Medusa Admin dashboard UI (widgets, custom pages, admin forms)?
   - Yes → `admin-dashboard`.
   - No → go to 3.

3. Does the symptom involve backend behavior (workflow failure, API error, data model violation, background job failure, subscriber not firing)?
   - Yes → start with `medusa-backend`. Route to `cross-repo` if a storefront consumer is affected.
   - No → go to 4.

4. Does the symptom span BOTH a UI observation AND a data/backend observation?
   - Yes → `cross-repo` (see the Cross-Repo Default Rule below).
   - No → `unknown`.

## The Cross-Repo Default Rule

If symptoms span any UI observation and any data/backend observation, default to `cross-repo` until evidence proves single-lane. At Divinipress, cross-repo is not a fallback — it is the hot path. Contract breaks between `divinipress-store` and `divinipress-backend` are what the Imperator most often ends up fixing.

## The Unknown-Lane Protocol

When a symptom is classified `unknown`:

1. Load the known-gaps doctrine (`$CONSILIUM_DOCS/doctrine/known-gaps.md`).
2. Load the cross-repo lane guide (`$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md`) as the default reference.
3. Dispatch a classification-focused scout with a reproduction request + instruction to report WHICH repo(s) the failing code lives in.
4. Re-classify after scout evidence returns. Rewrite the packet's `Affected lane` field with the refined classification.

## Lane-to-Guide Mapping

| Lane | Guide |
|-|-|
| `storefront` | `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-debugging.md` |
| `storefront-super-admin` | `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-super-admin-debugging.md` |
| `admin-dashboard` | `$CONSILIUM_DOCS/doctrine/lane-guides/admin-debugging.md` |
| `medusa-backend` | `$CONSILIUM_DOCS/doctrine/lane-guides/medusa-backend-debugging.md` |
| `cross-repo` | `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md` |
| `unknown` | `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md` (fallback during classification) |

## Lane-to-Rig-Skill Mapping

Mirrors the table in `skills/tribune/SKILL.md` Deliverable 6 so the Medicus does not cross-reference.

| Lane | Skill(s) loaded (Layer 1) and named in prompts (Layer 2) |
|-|-|
| `storefront` | `medusa-dev:building-storefronts` |
| `storefront-super-admin` | `medusa-dev:building-storefronts` |
| `admin-dashboard` | `medusa-dev:building-admin-dashboard-customizations` + `medusa-dev:building-with-medusa` |
| `medusa-backend` | `medusa-dev:building-with-medusa` |
| `cross-repo` | `medusa-dev:building-storefronts` + `medusa-dev:building-with-medusa` |
| `unknown` | `medusa-dev:building-storefronts` + `medusa-dev:building-with-medusa` (cross-repo-default) until classified |
