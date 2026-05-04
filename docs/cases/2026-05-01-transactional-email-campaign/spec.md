# Spec: Customer Transactional Email Campaign

**Date:** 2026-05-01 (narrowed 2026-05-04)
**Repo:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`
**Status:** Draft for verification
**Author:** Publius Auctor
**Companion campaign:** Internal ops Slack alerts are scoped to a separate spec at `../2026-05-04-internal-ops-slack-alerts/spec.md`. This spec ships the foundation those alerts depend on (post-persistence lifecycle event emissions) but does not include the Slack provider module, alert templates, or alert subscribers.

## Why

Divinipress has the hard email machinery in place: Resend delivery, a repo-owned React Email path, source-rendered custom-order templates, and validation scripts. The remaining problem is product judgment. The current customer email set covers only a few moments, and the copy reads like generated transactional filler.

This campaign makes customer-facing transactional email complete enough for normal business operations without turning every internal status change into inbox noise. Customers should receive email when they need awareness, confirmation, or action. The system should stay silent when the platform is only moving through internal mechanics.

**Confidence: High** - the Imperator approved customer-facing lifecycle email coverage; live repo reconnaissance confirmed only four customer-facing send surfaces currently exist.

## Approved Scope

V1 covers customer and company-user lifecycle email:

| Class | Purpose |
|-|-|
| Customer and company-user emails | Tell the person what happened, whether action is needed, and where to go. |

The campaign refreshes existing customer templates, adds missing customer lifecycle templates, and lays the foundation (post-persistence lifecycle event emissions) that the companion ops Slack alerts campaign will subscribe to. It does not build a preference center, marketing nurture system, or per-company notification configuration. Internal ops Slack alerts are out of scope for this spec.

**Confidence: High** - the Imperator narrowed scope to customer email after splitting the original combined campaign into two focused specs.

## Existing Terrain

Live backend truth at the time of this spec:

| Existing send | Current trigger | Current role in campaign |
|-|-|-|
| Invite team member | `invite.created` and `invite.resent` | Keep, refresh copy, eventually source-own if practical. |
| Password reset | `auth.password_reset` | Keep, refresh copy, eventually source-own if practical. |
| Order received custom | `custom-order.created` when at least one sub-order still requires proof | Keep, refresh copy. |
| Order confirmed proofed | `custom-order.created` when all sub-orders are saved-product reorders | Keep, refresh copy. |
| Proof ready | `custom-order.proof_ready` after super admin submits a proof | Keep, refresh copy; emission relocated post-persistence (see §Notification Event Contract). |

Live template machinery already supports rendered/source-owned templates for order received, order confirmed, and proof ready. Invite, onboarding, and password reset are registered as hosted templates. `ONBOARDING` exists in the registry, but no current sender uses it.

**Confidence: High** - confirmed by repo reconnaissance against this branch's HEAD (`cc31649`).

## Notification Event Contract

The campaign must not confuse state-machine commands with notification events. Today, only `custom-order.created` and `custom-order.proof_ready` are already emitted as notification-grade events. The other lifecycle moments exist as custom-order state-machine commands, but they need explicit notification emissions after successful business transitions.

V1 must either use an existing emitted event or add a narrow emitted event for each implemented lifecycle send:

| Lifecycle moment | Notification event requirement |
|-|-|
| Order created | Reuse existing `custom-order.created`. |
| Proof ready | Keep the `custom-order.proof_ready` event name. Move emission out of `EVENT_MAP[submitProof].sideEffects` (which runs before status persistence) and into the route handler, after `updateCustomOrders` returns. |
| Customer requested revision | Emit from the route after `rejectProof` side effects and `updateCustomOrders` succeed. |
| Customer approved order proof | Emit from the route after `approveProof` for `ProofType.ORDER` and `updateCustomOrders` succeed. |
| Saved product ready | Emit from the route after `approveProof` for `ProofType.CATALOG`, saved-product creation, and `updateCustomOrders` succeed. |
| Production hold | Emit from the route after `holdProduction` and `updateCustomOrders` succeed. |
| Shipped | Emit from the route after `addTracking` shipment creation and `updateCustomOrders` succeed. |
| Delivered | Emit from the route after `deliverProduct` and `updateCustomOrders` succeed. |
| Canceled | Deferred in V1 — no real customer-facing cancellation action exists on this branch. `ORDER_CANCELED` template is not wired. |

**Emission placement.** All custom-order lifecycle event emissions live in the route handler (`src/api/custom-order/[id]/route.ts`), in a dedicated post-persistence section that runs after `updateCustomOrders` returns successfully. Emissions do NOT live in `EVENT_MAP[X].sideEffects` blocks — those run before status persistence and would emit even when the subsequent status write fails. The existing `submitProof` emission must be moved out of its sideEffects block.

**Subscriber pattern.** Subscribers follow Medusa's official notification pattern documented in the [Resend integration guide](https://docs.medusajs.com/resources/integrations/guides/resend). Each subscriber is a thin handler that runs a notification workflow. The workflow uses `useQueryGraphStep` to fetch the data needed to render the email, then `sendNotificationStep` to call the Notification Module. Event payloads carry only the id (`{ customOrderId: string }` for custom-order events; `{ order_id: string }` for `custom-order.created`); the workflow re-fetches everything else.

**Foundation contract for the companion Slack campaign.** The events listed in this section are the foundation that the companion internal ops Slack alerts campaign subscribes to. This spec ships the route emissions; the Slack campaign adds Slack subscribers and workflows on top. No event in this section is gated on the Slack campaign existing — they fire whether or not Slack is wired.

**Confidence: High** - emission placement and subscriber pattern aligned with Medusa convention; live gap confirmed by reconnaissance.

## Email Inventory

### Account Emails

| Template key | Recipient | Trigger | Purpose | V1 behavior |
|-|-|-|-|-|
| `INVITE_TEAM_MEMBER` | Invited user | Invite created or resent | Give the user a safe path into the organization. | Existing send, copy refresh. |
| `PASSWORD_RESET` | Account email | Password reset requested | Let the user reset access without support. | Existing send, copy refresh. |
| `ONBOARDING` | User who just activated or registered | (deferred) | Confirm account access and point them into the store. | Deferred — copy refresh allowed if bounded; subscriber wiring requires editing Medusa's `acceptCompanyInviteWorkflow` (which deletes the invite in parallel with id-only emission), which is out of scope for V1. |

Signup request received, approved, and rejected emails are not part of this V1 unless the target branch contains a live signup-request lifecycle. Do not invent signup-request emails against a missing subsystem.

**Confidence: High** - account send surfaces verified against HEAD; onboarding deferral grounded in the speculator's read of `src/workflows/invites/accept-company-invite.ts:79-89`.

### Customer Order and Proof Emails

| Template key | Recipient | Trigger | Purpose | V1 behavior |
|-|-|-|-|-|
| `ORDER_RECEIVED_CUSTOM` | Order customer | Custom cart completion with at least one proof-required sub-order | Confirm the request was received and proofing will happen. | Existing send, copy refresh. |
| `ORDER_CONFIRMED_PROOFED` | Order customer | Custom cart completion where all sub-orders are saved-product reorders | Confirm the paid order is already approved for fulfillment. | Existing send, copy refresh. |
| `PROOF_READY` | Order customer | Super admin submits proof for customer review | Ask the customer to approve or request changes. | Existing send, copy refresh; subscriber re-implemented as thin shim → workflow per §Notification Event Contract. |
| `PROOF_REVISION_REQUESTED_CUSTOMER` | Order customer | Customer rejects proof and requests changes | Confirm Divinipress received the requested revision. | New customer email; subscriber → workflow. |
| `PROOF_APPROVED_CUSTOMER` | Order customer | Customer approves an order proof | Confirm the proof is approved and production is next. | New customer email for `ProofType.ORDER` only; subscriber → workflow. |
| `SAVED_PRODUCT_READY` | Order customer | Customer approves a catalog proof and saved product creation succeeds | Tell the customer the product is ready to order from their account. | New customer email for `ProofType.CATALOG` only; subscriber → workflow. |
| `PRODUCTION_HOLD_CUSTOMER` | Order customer | Super admin places approved order on production hold | Explain the order is paused and Divinipress will follow up. | New customer email; subscriber → workflow. |
| `ORDER_SHIPPED` | Order customer | Tracking is added and order status becomes shipped | Give tracking details and confirm shipment. | New customer email; subscriber → workflow. |
| `ORDER_DELIVERED` | Order customer | Order is marked delivered | Close the loop after delivery. | New customer email; subscriber → workflow. Lower priority but in V1. |

The catalog approval split is intentional: a catalog proof approval should not send `PROOF_APPROVED_CUSTOMER` to the customer. The saved product becoming usable is the meaningful customer outcome, so `SAVED_PRODUCT_READY` is the only customer email for catalog approvals.

`ORDER_CANCELED` is deferred. No real customer-facing cancellation event exists on this branch (per `$CONSILIUM_DOCS/doctrine/known-gaps.md` `KG-ADMIN-HOLD-PLACEHOLDER`, the only cancellation transition is `adminReject`, which is not customer-facing). The template is not wired in V1.

**Confidence: High** - lifecycle table grounded in repo reconnaissance and Imperator scope decisions.

### Fanout Rules

`ORDER_RECEIVED_CUSTOM` and `ORDER_CONFIRMED_PROOFED` remain one customer email per Medusa order completion.

Every later proof, production, shipping, and delivery customer email is per `custom_order` transition, not aggregated across sibling sub-orders. These messages must name the product or sub-order clearly so a customer with multiple sub-orders understands which item changed.

**Confidence: High** - doctrine confirms one Medusa order can contain multiple independently tracked custom-order sub-orders.

## Events That Must Stay Silent

No V1 customer email should be sent for:

| Event or action | Why silent |
|-|-|
| `startJob` | Internal production movement. Customer does not need it. |
| `uploadProof` | File upload is not the customer handoff. `submitProof` is. |
| `updateNotes` | Notes can change without requiring an email. |
| `orderProduct` | Internal fulfillment creation, not shipment. |
| `proceedProduction` | Internal mechanic — the meaningful customer signal is shipping, not production-start. |
| `reopenProof` | Internal correction/reopen path. Notify only if it creates a customer-facing hold or revision request. |

**Confidence: High** - these are mechanics rather than customer decision moments.

## Recipient Rules

Customer lifecycle emails go to the Medusa order customer email unless the event is account-specific. Account emails go to the relevant account or invite email.

Company admins should not receive every staff order email in V1. The current system has no approved notification preference model for company-admin copies, and adding one would widen the campaign. Staff or requester receipts remain tied to the order customer.

**Send failure handling.** Customer email send failures fall to Medusa's default behavior — the local event bus catches subscriber errors and logs them via the framework logger. V1 accepts this silent-fail-on-send shape. No automatic retry, no external surfacing, no failure event. Customer email failure must NOT roll back the originating route's status transition or business mutation. Hardening (retry, observability, failure surfacing) is deferred to a future campaign.

**Confidence: High** - failure handling matches the Medusa default shape (per the Resend integration guide's `send` method, which logs and returns without throwing).

## Data Contracts

All customer email templates must carry:

| Field | Meaning |
|-|-|
| `current_year` | Footer year. |
| `customer_name` or recipient name | Human greeting when available. |
| Primary URL | Direct link to the order, proof, account, reset, invite, or tracking surface. |
| Primary identifier | Order id, custom order id, invite email, or tracking number depending on template. |

Order/proof customer templates must include the relevant order id and product title or line-item summary when available. Proof revision templates must include the customer note text when provided, but must handle empty note text without inventing content.

Shipping templates must include tracking number and tracking URL when present. If multiple labels exist on the triggering `addTracking` request, the template must render multiple tracking entries rather than dropping all but one.

Saved product ready must include a link to the customer's usable product or a fallback link to My Products if a direct product URL is not available from backend data.

`SAVED_PRODUCT_READY` data path. The notification payload's primary saved-product reference must be the `id` returned by `createProductsWorkflow` in the `approveProof` CATALOG side effect (`src/api/custom-order/order-flow.ts:349-403`, accessed as `result[0].id`). Pass this id through the lifecycle event payload (`{ customOrderId, savedProductId }`) so the notification workflow's `useQueryGraphStep` can fetch the saved product directly. The metadata-filter fallback (querying by `metadata.custom_order_id`) is a defensive secondary path only, used when the creation result id is unavailable. If neither path resolves a direct product URL, the customer email links to My Products and the lifecycle event still carries the saved product id when known.

`SAVED_PRODUCT_READY` duplicate prevention. Before creating or announcing a saved product, implementation must check for an existing saved product associated with the `custom_order` id. If one exists, reuse it rather than creating another. Anchor duplicate prevention to the `custom_order` id plus the saved product id from the prior successful proof approval. The route's existing `validateEventTransition` guard (`src/api/custom-order/order-flow.ts:686-728`) prevents a second `approveProof` once the first commits the status transition; the artifact-level reuse rule covers the narrower window between concurrent in-flight `approveProof` requests on the same row.

Shipping notification scope. Shipping notifications use the `labels` and `items` from the triggering `addTracking` request body directly. The route owns the scoping by virtue of how it accepts input — sub-orders are shipped individually by design, and the admin caller specifies which items belong to the triggering `custom_order`. The notification workflow does not re-validate item ownership; it renders the labels the route received.

**Confidence: High** - data contracts grounded in repo reconnaissance and Imperator decisions on saved-product retrieval primary path and shipping scope trust model.

## Copy Direction

Customer emails should sound like Divinipress closing the loop, not like SaaS boilerplate.

| Rule | Contract |
|-|-|
| Short opening | Get to the event in the first sentence. |
| Plain next step | Say exactly whether the recipient needs to review, wait, track, or do nothing. |
| Warm but operational | Friendly language is allowed. Sales language is not. |
| No inflated adjectives | Avoid generic words like seamless, robust, exciting, comprehensive, and innovative. |
| No stiff closings | Keep signoffs simple. |

Customer emails should usually be 2 to 4 short paragraphs plus one clear button.

**Confidence: High** - follows the Imperator's complaint that the current generated templates are weak and the established Divinipress email voice guidance.

## Source Ownership

All new customer email templates in this campaign should be repo-owned source templates. Existing rendered/source-owned templates stay source-owned. Existing hosted templates for invite, onboarding, and password reset may be migrated to source-owned rendered templates in this campaign if the implementation can do it without delaying lifecycle email work. If that migration starts to widen the work, account template source migration may be split into a follow-up while copy and variable contracts remain documented.

Normal customer email editing happens in code, with local render and preview samples. Production email publish remains an explicit release action, never a side effect of validation or build.

**Confidence: High** - this preserves the DIV-97 source-rendered pattern and the explicit no-publish discipline.

## Contract Inventory

Every canonical-six contract surface this spec touches, mapped to its definition in the spec body and (where it exists today) its location in code on this branch's HEAD (`cc31649`). New surfaces are wired by this campaign; existing surfaces are inherited and either reused unchanged or modified per the noted requirement. `link.create` boundaries and module-boundary API contracts are not present in this spec — declared empty at the bottom of this section.

Code citations were verified against this branch's HEAD by reconnaissance before this section was authored. The Inventory is the spec's contract-surface map; full requirements live in the named spec sections.

### Subscriber boundaries

| Subscriber wiring | Status | Spec body | Code citation |
|-|-|-|-|
| `custom-order.created` → `ORDER_RECEIVED_CUSTOM` (proof-required path) | Existing — copy refresh; subscriber re-implemented as thin shim → notification workflow | §Existing Terrain; §Email Inventory > Customer Order and Proof Emails; §Notification Event Contract | `src/subscribers/custom-order-created.ts:82-100` |
| `custom-order.created` → `ORDER_CONFIRMED_PROOFED` (all-reorder path) | Existing — copy refresh; subscriber re-implemented as thin shim → notification workflow | §Existing Terrain; §Email Inventory > Customer Order and Proof Emails; §Notification Event Contract | `src/subscribers/custom-order-created.ts:75-80` |
| `custom-order.proof_ready` → `PROOF_READY` | Existing — copy refresh; subscriber re-implemented as thin shim → notification workflow; emission point relocated post-persistence | §Existing Terrain; §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | subscriber `src/subscribers/custom-order-proof-ready.ts:29-40`; current pre-persistence emission `src/api/custom-order/order-flow.ts:172-185` |
| post-`rejectProof` event → `PROOF_REVISION_REQUESTED_CUSTOMER` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| post-`approveProof` (ORDER) event → `PROOF_APPROVED_CUSTOMER` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| post-`approveProof` (CATALOG) event → `SAVED_PRODUCT_READY` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts | none — to be added |
| post-`holdProduction` event → `PRODUCTION_HOLD_CUSTOMER` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| post-`addTracking` event → `ORDER_SHIPPED` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts | none — to be added |
| post-`deliverProduct` event → `ORDER_DELIVERED` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| `invite.created` / `invite.resent` → `INVITE_TEAM_MEMBER` | Existing — copy refresh; subscriber may be re-implemented as thin shim → workflow if account template migration is in scope | §Existing Terrain; §Email Inventory > Account Emails; §Source Ownership | `src/subscribers/user-invited.ts:24-37` |
| `auth.password_reset` → `PASSWORD_RESET` | Existing — copy refresh; subscriber may be re-implemented as thin shim → workflow if account template migration is in scope | §Existing Terrain; §Email Inventory > Account Emails; §Source Ownership | `src/subscribers/password-reset.ts:66-78` |

### Wire shapes on module boundaries

| Surface | Status | Spec body | Code citation |
|-|-|-|-|
| `custom-order.created` event payload — `{ order_id: string }` | Existing | §Notification Event Contract | emit `src/api/store/carts/[id]/custom-complete/route.ts:437-444`; consumer typing `src/subscribers/custom-order-created.ts:12-14` |
| `custom-order.proof_ready` event payload — `{ customOrderId: string }` | Existing — emission point moves to post-persistence; payload shape unchanged | §Notification Event Contract | `src/api/custom-order/order-flow.ts:172-185` |
| New lifecycle event payloads — `rejectProof`, `approveProof` (ORDER), `approveProof` (CATALOG with `savedProductId`), `holdProduction`, `addTracking` (with shipping labels reference), `deliverProduct` | New — minimum payload `{ customOrderId: string }`; `approveProof` CATALOG additionally carries `{ savedProductId: string }` from `createProductsWorkflow` result; `addTracking` carries the `labels` and `items` from the request body for shipping notifications | §Notification Event Contract; §Data Contracts | none — to be added |
| Existing customer email template variable contracts — `orderVariables` (13 fields, used by `ORDER_RECEIVED_CUSTOM` + `ORDER_CONFIRMED_PROOFED`), `proofReadyVariables` (6 fields, used by `PROOF_READY`), invite/password/onboarding variable shapes | Existing — copy refresh only; variable shapes unchanged unless required by new templates | §Data Contracts | registry `src/modules/resend/email/template-registry.ts:52-75, 93-161`; materializers `src/modules/resend/utils/build-order-email-variables.ts:31-57`, `src/modules/resend/utils/build-proof-ready-email-variables.ts:13-30` |
| New customer email template variable contracts — `PROOF_REVISION_REQUESTED_CUSTOMER`, `PROOF_APPROVED_CUSTOMER`, `SAVED_PRODUCT_READY`, `PRODUCTION_HOLD_CUSTOMER`, `ORDER_SHIPPED`, `ORDER_DELIVERED` | New — must include the field families named in §Data Contracts (`current_year`, recipient name, primary URL, primary identifier, plus per-template fields: order id + line-item summary, proof note text when present, multiple tracking entries when present, saved product id/handle with My Products fallback) | §Data Contracts; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| `SAVED_PRODUCT_READY` payload + saved-product retrieval shape | New — primary path: `id` returned by `createProductsWorkflow` (`result[0].id`) threaded through the lifecycle event; secondary fallback: query by `metadata.custom_order_id`; tertiary: My Products link with id-only payload | §Data Contracts (paragraph on `SAVED_PRODUCT_READY` data path) | creation site `src/api/custom-order/order-flow.ts:349-403` (returns standard Medusa `ProductDTO[]`); link mechanism `metadata.custom_order_id` on product record |

### Idempotency anchors

| Anchor | Status | Spec body | Code citation |
|-|-|-|-|
| `SAVED_PRODUCT_READY` send + saved-product creation, keyed by `custom_order` id (with saved product id from prior successful proof approval) | New — must be added; before creation/announcement, implementation queries for an existing saved product associated with the `custom_order` id and reuses it if present. The route's `validateEventTransition` guard handles the post-commit double-call case; this anchor handles the narrower in-flight concurrent case. | §Data Contracts (paragraph on duplicate prevention) | absent today — `approveProof` CATALOG branch `src/api/custom-order/order-flow.ts:221-445` has no pre-creation duplicate query; status guard `src/api/custom-order/order-flow.ts:686-728` |

### Workflow ownership claims

#### Route emission ownership

| Owner | Emission requirement | Status today | Spec body | Code citation |
|-|-|-|-|-|
| `submitProof` route — `custom-order.proof_ready` emission | Move emission to post-persistence section, after `updateCustomOrders` returns | Pre-persistence — emission inside `EVENT_MAP[submitProof].sideEffects` fires before status DB write | §Notification Event Contract | handler `src/api/custom-order/[id]/route.ts:297-352`; current emission `src/api/custom-order/order-flow.ts:172-185` |
| `approveProof` route — emission for ORDER and CATALOG branches | Emit in post-persistence section; CATALOG payload includes `savedProductId` from creation result | Not implemented today | §Notification Event Contract; §Data Contracts | sideEffects `src/api/custom-order/order-flow.ts:221-445`; persistence `src/api/custom-order/[id]/route.ts:349-352` |
| `rejectProof` route — revision event emission | Emit in post-persistence section | Not implemented today | §Notification Event Contract | sideEffects `src/api/custom-order/order-flow.ts:471-509` |
| `holdProduction` route — hold event emission | Emit in post-persistence section | Not implemented today | §Notification Event Contract | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:548-554` |
| `addTracking` route — shipped event emission | Emit in post-persistence section; payload includes triggering `labels` and `items` from request | Not implemented today | §Notification Event Contract; §Data Contracts | sideEffects `src/api/custom-order/order-flow.ts:585-627` |
| `deliverProduct` route — delivered event emission | Emit in post-persistence section | Not implemented today | §Notification Event Contract | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:628-631` |

#### Notification workflow ownership

One workflow per customer email template key. Each workflow is owned by this campaign and replaces the current direct-from-subscriber send pattern.

| Workflow ownership | Status | Spec body |
|-|-|-|
| Workflow that sends `ORDER_RECEIVED_CUSTOM` (triggered by `custom-order.created` — proof-required path) | New workflow; subscriber re-implemented as thin shim → workflow | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `ORDER_CONFIRMED_PROOFED` (triggered by `custom-order.created` — all-reorder path) | New workflow; subscriber re-implemented as thin shim → workflow | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `PROOF_READY` (triggered by `custom-order.proof_ready`) | New workflow; subscriber re-implemented as thin shim → workflow | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `PROOF_REVISION_REQUESTED_CUSTOMER` (triggered by post-`rejectProof` event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `PROOF_APPROVED_CUSTOMER` (triggered by post-`approveProof` ORDER event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `SAVED_PRODUCT_READY` (triggered by post-`approveProof` CATALOG event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts |
| Workflow that sends `PRODUCTION_HOLD_CUSTOMER` (triggered by post-`holdProduction` event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `ORDER_SHIPPED` (triggered by post-`addTracking` event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts |
| Workflow that sends `ORDER_DELIVERED` (triggered by post-`deliverProduct` event) | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails |
| Workflow that sends `INVITE_TEAM_MEMBER` (triggered by `invite.created` / `invite.resent`) | Optional — only if account template migration lands in V1; subscriber re-implemented as thin shim → workflow | §Notification Event Contract; §Email Inventory > Account Emails; §Source Ownership |
| Workflow that sends `PASSWORD_RESET` (triggered by `auth.password_reset`) | Optional — only if account template migration lands in V1; subscriber re-implemented as thin shim → workflow | §Notification Event Contract; §Email Inventory > Account Emails; §Source Ownership |

Each workflow follows Medusa's official Resend pattern (subscriber → workflow with `useQueryGraphStep` + `sendNotificationStep`):

- Accepts the lifecycle event payload as input.
- Uses `useQueryGraphStep` to fetch the customer, custom order, line items, product info, and (where applicable) saved product or tracking labels.
- Calls `sendNotificationStep` with `channel: "email"`, the appropriate template key, and the materialized variables.
- Send failures fall to Medusa's default logging behavior; the workflow does not catch or re-emit (see §Recipient Rules).

### `link.create` boundaries

None defined. The saved-product / `custom_order` association uses a metadata field (`product.metadata.custom_order_id`) on the product record, not a Medusa module link table. The spec does not introduce a new `link.create` boundary.

### API contracts at module boundaries

None defined. The spec covers notification events and template variable contracts. It does not introduce new REST endpoints or change existing ones.

**Confidence: High** — every entry is anchored to a named spec body section. Existing surfaces are anchored to verified file/line citations on this branch's HEAD (`cc31649`); new surfaces are explicitly marked "to be added."

## Non-Goals

- Marketing nurture or sales drip emails.
- Per-company notification settings.
- Company admin copy rules for every staff action.
- New frontend pages solely for email links.
- Publishing Resend production templates as part of implementation without an explicit release command.
- Emailing every proof/order state transition.
- Signup-request lifecycle emails when no live signup-request lifecycle exists in the target branch.
- Internal ops Slack alerts (companion spec at `../2026-05-04-internal-ops-slack-alerts/`).
- Onboarding subscriber wiring (deferred — requires editing `acceptCompanyInviteWorkflow`).
- `ORDER_CANCELED` wiring (deferred — no real customer-facing cancellation event exists on this branch).

**Confidence: High** - keeps the campaign focused on customer email coverage.

## Success Criteria

The campaign is complete when:

| Criterion | Observable proof |
|-|-|
| Inventory complete | Every customer email template in §Email Inventory is either implemented or explicitly marked deferred (onboarding, cancellation). |
| Existing templates improved | Invite, password reset, order received, order confirmed, and proof ready no longer use generic generated copy. |
| Customer lifecycle covered | Proof revision, proof approval (ORDER), saved product ready (CATALOG), production hold, shipped, and delivered have correct customer behavior. |
| No spammy mechanics | Silent events (per §Events That Must Stay Silent) remain silent. |
| Data contracts validated | Render samples exist for every source-owned customer email template, and validation fails when required variables are missing. |
| Delivery checked | Local validation, render, preview, focused unit tests, and build pass. API-backed email checks run when `RESEND_API_KEY` is present. |
| Notification events defined | Every newly implemented lifecycle email has a corresponding emitted notification event after the successful business transition. |
| Emission placement correct | Tests confirm `custom-order.proof_ready` and all new lifecycle events emit AFTER `updateCustomOrders` returns; tests confirm a thrown `updateCustomOrders` does not emit the event. |
| Fanout controlled | Order-created notifications are per Medusa order; later proof/production/shipping/delivery notifications are per custom order. |
| Send failure isolation | Tests confirm that customer email send failures do NOT roll back the originating route's status transition. |
| Subscriber pattern compliance | Each new subscriber file is a thin shim that runs a notification workflow; each workflow uses `useQueryGraphStep` + `sendNotificationStep` per the Medusa Resend guide. |

**Confidence: High** - all criteria map directly to the approved campaign intent and the official Medusa pattern.

## Open Implementation Checks

These are codebase checks for the implementation plan, not unresolved product decisions:

| Check | Why it matters |
|-|-|
| Saved product URL availability | Prefer direct product link from `createProductsWorkflow` result id; fallback to metadata-filter query; ultimate fallback to My Products. |
| Post-persistence emission placement | Move existing proof-ready emission and add new lifecycle emissions only after `updateCustomOrders` returns successfully. |
| Notification workflow file structure | One workflow per template key under `src/workflows/notifications/` (or equivalent); follow the Resend guide example structure. |
| Account template migration size | Migrating invite/password from hosted to source-owned is optional; only include in V1 if it stays bounded. |

**Confidence: Medium** - these require implementation-time repo tracing and cross-spec coordination.
