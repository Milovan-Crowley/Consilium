# Spec: Transactional Email and Slack Notification Campaign

**Date:** 2026-05-01
**Repo:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`
**Status:** Draft for verification
**Author:** Publius Auctor

## Why

Divinipress has the hard email machinery in place: Resend delivery, a repo-owned React Email path, source-rendered custom-order templates, and validation scripts. The remaining problem is product judgment. The current customer email set covers only a few moments, and the copy reads like generated transactional filler.

This campaign makes transactional communication complete enough for normal business operations without turning every internal status change into inbox noise. Customers should receive email when they need awareness, confirmation, or action. Divinipress internal ops should receive Slack alerts in a dedicated notification channel when production attention is needed. The system should stay silent when the platform is only moving through internal mechanics.

**Confidence: High** - the Imperator approved customer-facing lifecycle email and then changed internal Divinipress ops alerts to Slack-first. Live repo reconnaissance confirmed only four production send surfaces currently exist.

## Approved Scope

V1 includes both recipient classes:

| Class | Purpose |
|-|-|
| Customer and company user emails | Tell the person what happened, whether action is needed, and where to go. |
| Divinipress ops Slack alerts | Tell internal production staff when a customer or order event needs attention. |

The campaign should refresh existing customer templates, add missing customer lifecycle templates, and add compact Slack notifications for internal ops. It should not build a preference center, marketing nurture system, or per-company notification configuration.

**Confidence: High** - the Imperator explicitly approved knocking out both customer-facing email and internal Slack notification sets.

## Existing Terrain

Live backend truth at the time of this spec:

| Existing send | Current trigger | Current role in campaign |
|-|-|-|
| Invite team member | `invite.created` and `invite.resent` | Keep, refresh copy, eventually source-own if practical. |
| Password reset | `auth.password_reset` | Keep, refresh copy, eventually source-own if practical. |
| Order received custom | `custom-order.created` when at least one sub-order still requires proof | Keep, refresh copy. |
| Order confirmed proofed | `custom-order.created` when all sub-orders are saved-product reorders | Keep, refresh copy. |
| Proof ready | `custom-order.proof_ready` after super admin submits a proof | Keep, refresh copy. |

Live template machinery already supports rendered/source-owned templates for order received, order confirmed, and proof ready. Invite, onboarding, and password reset are registered as hosted templates. `ONBOARDING` exists in the registry, but no current sender uses it.

**Confidence: High** - confirmed by repo reconnaissance against the DIV-97 backend worktree.

## Notification Event Contract

The campaign must not confuse state-machine commands with notification events. Today, only `custom-order.created` and `custom-order.proof_ready` are already emitted as notification-grade events. The other lifecycle moments exist as custom-order state-machine commands, but they need explicit notification emissions after successful business transitions.

V1 must either use an existing emitted event or add a narrow emitted event for each implemented lifecycle send:

| Lifecycle moment | Notification event requirement |
|-|-|
| Order created | Reuse existing `custom-order.created`. |
| Proof ready | Keep the `custom-order.proof_ready` event name if useful, but move or protect the emission so it occurs only after the proof-ready status update is durable. Do not reuse the current pre-persistence emission as-is. |
| Customer requested revision | Emit after `rejectProof` side effects and status transition succeed. |
| Customer approved order proof | Emit after `approveProof` for `ProofType.ORDER` succeeds. |
| Saved product ready | Emit after `approveProof` for `ProofType.CATALOG` succeeds and saved product data is available. |
| Production hold | Emit after `holdProduction` status transition succeeds. |
| Shipped | Emit after `addTracking` shipment creation and status transition succeed. |
| Delivered | Emit after `deliverProduct` status transition succeeds. |
| Canceled | Emit only from a real customer-facing cancellation action if one exists in the target branch. |

Notification emissions must happen after the business mutation they describe is durable. They must not announce work that later fails. For custom-order state transitions, this means post-persistence emission from the route or an equivalent durable handoff after the `custom_order` status update succeeds. State-machine side effects that run before the route persists status are not a safe notification emission point.

**Confidence: High** - both verifiers confirmed the live gap: most approved lifecycle moments are currently state-machine events, not emitted notification events.

## Email Inventory

### Account Emails

| Template key | Recipient | Trigger | Purpose | V1 behavior |
|-|-|-|-|-|
| `INVITE_TEAM_MEMBER` | Invited user | Invite created or resent | Give the user a safe path into the organization. | Existing send, copy refresh. |
| `PASSWORD_RESET` | Account email | Password reset requested | Let the user reset access without support. | Existing send, copy refresh. |
| `ONBOARDING` | User who just activated or registered | Invite acceptance or direct successful registration | Confirm account access and point them into the store. | Wire if a durable success event exists or can be emitted narrowly after successful account creation. |

Onboarding must not subscribe directly to an id-only invite acceptance event if the payload cannot reliably recover recipient/name/company after invite cleanup. If onboarding is wired in V1, implementation must emit or use a durable post-account-created event carrying the recipient email, name, company context, and account/store entry URL. Do not assume invited users enter the in-app onboarding dialog unless the `onboardingEmails` flow is explicitly being triggered. If that durable event cannot be added narrowly, the onboarding sender is deferred while the template copy/source can still be improved.

Signup request received, approved, and rejected emails are not part of this V1 unless the target branch contains a live signup-request lifecycle. Do not invent signup-request emails against a missing subsystem.

**Confidence: Medium** - account send surfaces exist, but the exact welcome trigger depends on the live invite/register event boundary during implementation.

### Customer Order and Proof Emails

| Template key | Recipient | Trigger | Purpose | V1 behavior |
|-|-|-|-|-|
| `ORDER_RECEIVED_CUSTOM` | Order customer | Custom cart completion with at least one proof-required sub-order | Confirm the request was received and proofing will happen. | Existing send, copy refresh. |
| `ORDER_CONFIRMED_PROOFED` | Order customer | Custom cart completion where all sub-orders are saved-product reorders | Confirm the paid order is already approved for fulfillment. | Existing send, copy refresh. |
| `PROOF_READY` | Order customer | Super admin submits proof for customer review | Ask the customer to approve or request changes. | Existing send, copy refresh. |
| `PROOF_REVISION_REQUESTED_CUSTOMER` | Order customer | Customer rejects proof and requests changes | Confirm Divinipress received the requested revision. | New customer confirmation. |
| `PROOF_APPROVED_CUSTOMER` | Order customer | Customer approves an order proof | Confirm the proof is approved and production is next. | New customer email for `ProofType.ORDER` only. |
| `SAVED_PRODUCT_READY` | Order customer | Customer approves a catalog proof and saved product creation succeeds | Tell the customer the product is ready to order from their account. | New customer email for `ProofType.CATALOG` only. |
| `PRODUCTION_HOLD_CUSTOMER` | Order customer | Super admin places approved order on production hold | Explain the order is paused and Divinipress will follow up. | New customer email only when a real production hold event occurs. |
| `ORDER_SHIPPED` | Order customer | Tracking is added and order status becomes shipped | Give tracking details and confirm shipment. | New customer email. |
| `ORDER_DELIVERED` | Order customer | Order is marked delivered | Close the loop after delivery. | New customer email, lower priority but in campaign. |
| `ORDER_CANCELED` | Order customer | A real customer-facing cancellation event moves the order to canceled | Confirm cancellation. | Wire only to an existing concrete cancellation action. Do not infer cancellation from unrelated state cleanup. |

The catalog approval split is intentional: a catalog proof approval should not send both `PROOF_APPROVED_CUSTOMER` and `SAVED_PRODUCT_READY` to the customer. The saved product becoming usable is the meaningful customer outcome.

**Confidence: High** for order/proof/shipping lifecycle. **Confidence: Medium** for cancellation because the exact customer-facing cancel trigger must be verified against live code before wiring.

### Fanout Rules

`ORDER_RECEIVED_CUSTOM` and `ORDER_CONFIRMED_PROOFED` remain one customer email per Medusa order completion.

Every later proof, production, shipping, delivery, and cancellation customer email is per `custom_order` transition, not aggregated across sibling sub-orders. These messages must name the product or sub-order clearly so a customer with multiple sub-orders understands which item changed.

Internal Slack alerts follow the same shape: `SLACK_OPS_NEW_CUSTOM_ORDER` is one post per Medusa order completion with a sub-order summary; the later ops alerts are one post per `custom_order` transition.

**Confidence: High** - doctrine confirms one Medusa order can contain multiple independently tracked custom-order sub-orders.

### Internal Divinipress Slack Alerts

| Alert key | Recipient | Trigger | Purpose | V1 behavior |
|-|-|-|-|-|
| `SLACK_OPS_NEW_CUSTOM_ORDER` | Dedicated Divinipress ops Slack channel | Custom order created | Alert production that new work entered the queue. | New internal Slack post, one per Medusa order completion with sub-order summary. |
| `SLACK_OPS_PROOF_APPROVED` | Dedicated Divinipress ops Slack channel | Customer approves proof | Tell ops the proof can move forward. | New internal Slack post for both proof types. |
| `SLACK_OPS_PROOF_REVISION_REQUESTED` | Dedicated Divinipress ops Slack channel | Customer rejects proof | Tell ops revision work is needed, with note context when available. | New internal Slack post. |
| `SLACK_OPS_PRODUCTION_HOLD` | Dedicated Divinipress ops Slack channel | Production hold is created | Give internal visibility into blocked production work. | New internal Slack post. |
| `SLACK_OPS_ORDER_SHIPPED` | Dedicated Divinipress ops Slack channel | Tracking is added | Internal shipment receipt for recordkeeping. | New internal Slack post, useful but not customer-critical. |

Internal ops alerts must post to a configured Slack webhook or equivalent Slack integration owned by a dedicated channel such as `#divinipress-ops` or `#dp-order-alerts`. No personal Slack destination, user id, or hardcoded channel may be baked into source.

Internal ops alerts are Slack-first in V1. Do not create parallel internal ops email templates unless the implementation plan explicitly identifies a critical fallback need and the Imperator approves it.

**Confidence: High** - the Imperator approved Slack as the internal ops channel, and these alerts map to approved lifecycle moments that must be emitted as notification events where no event exists yet.

## Events That Must Stay Silent

No V1 customer email or internal Slack alert should be sent for:

| Event or action | Why silent |
|-|-|
| `startJob` | Internal production movement. Customer does not need it. |
| `uploadProof` | File upload is not the customer handoff. `submitProof` is. |
| `updateNotes` | Notes can change without requiring an email. |
| `orderProduct` | Internal fulfillment creation, not shipment. |
| `reopenProof` | Internal correction/reopen path. Notify only if it creates a customer-facing hold or revision request. |

**Confidence: High** - these are mechanics rather than customer or ops decision moments.

## Recipient Rules

Customer lifecycle emails go to the Medusa order customer email unless the event is account-specific. Account emails go to the relevant account or invite email.

Company admins should not receive every staff order email in V1. The current system has no approved notification preference model for company-admin copies, and adding one would widen the campaign. Staff or requester receipts remain tied to the order customer.

Internal ops alerts go only to the configured Slack destination. Missing Slack configuration must be visible during setup or logs, but must not hardcode a fallback destination.

Notification delivery failures must not silently disappear. Existing Resend behavior already hard-fails invalid templates and failed sends; this campaign should preserve that observability for customer email. Slack delivery failures should be observable, but Slack must not become the business transaction source of truth.

Slack configuration and failure behavior:

| Condition | Required behavior |
|-|-|
| Slack webhook/integration config missing in local or test | Skip Slack sends with an explicit structured warning. |
| Slack webhook/integration config missing in production-like runtime | Surface a configuration error during startup or first attempted send; do not invent a fallback destination. |
| Slack request fails | Log event key, order id, custom order id when available, and Slack error detail. The business state transition must not roll back only because Slack failed. |
| Slack delivery check command has env configured | Send a test payload to the configured dedicated channel and fail if Slack rejects it. |

**Confidence: Medium** - recipient intent is clear, but the implementation must verify how notification subscriber failures behave under Medusa event delivery.

## Data Contracts

All customer email templates must carry:

| Field | Meaning |
|-|-|
| `current_year` | Footer year. |
| `customer_name` or recipient name | Human greeting when available. |
| Primary URL | Direct link to the order, proof, account, reset, invite, or tracking surface. |
| Primary identifier | Order id, custom order id, invite email, or tracking number depending on template. |

Order/proof customer templates must include the relevant order id and product title or line-item summary when available. Proof revision templates must include the customer note text when provided, but must handle empty note text without inventing content.

Shipping templates must include tracking number and tracking URL when present. If multiple labels exist, the template must render multiple tracking entries rather than dropping all but one.

Saved product ready must include a link to the customer's usable product or a fallback link to My Products if a direct product URL is not available from backend data.

`SAVED_PRODUCT_READY` must use a reliable saved-product data path. The notification payload must include the saved product id and handle captured from the successful product creation result, or implementation must query the saved product by `metadata.custom_order_id` after creation and linking succeed. If neither direct product handle nor URL can be proven, the customer email must link to My Products and the internal Slack payload must still include the custom order id and product id if available.

Duplicate saved-product-ready sends and duplicate saved-product creation must be prevented for retries or replays. Before creating or announcing a saved product, implementation must check for an existing saved product associated with the `custom_order` id when live code makes that possible; if one exists, reuse that product for the notification payload instead of creating or announcing another. The implementation plan must anchor duplicate prevention to the `custom_order` id plus the saved product id or another stable proof-approval result.

Shipping notifications must be scoped to the triggering `custom_order`. Because tracking labels live on Medusa order fulfillments, a shipped email or Slack post must use the labels/items from the triggering `addTracking` request or filter queried fulfillment labels back to the triggering custom order's items. It must not render sibling sub-order tracking labels just because they live on the same Medusa order.

Internal Slack alerts must include enough context for staff to act: customer/company, order id, custom order id when relevant, product title or line-item summary, triggering event, and admin/proof URL if available. Slack alerts should use compact blocks or a compact text layout with one clear action link.

**Confidence: Medium** - the required fields are clear, but some direct URLs and product links may require implementation-time verification.

## Copy Direction

The customer emails should sound like Divinipress closing the loop, not like SaaS boilerplate.

Rules:

| Rule | Contract |
|-|-|
| Short opening | Get to the event in the first sentence. |
| Plain next step | Say exactly whether the recipient needs to review, wait, track, or do nothing. |
| Warm but operational | Friendly language is allowed. Sales language is not. |
| No inflated adjectives | Avoid generic words like seamless, robust, exciting, comprehensive, and innovative. |
| No stiff closings | Keep signoffs simple. |
| Internal Slack alerts are terse | Slack posts are for action, not polish. |

Customer emails should usually be 2 to 4 short paragraphs plus one clear button. Internal Slack alerts should favor direct labels, compact context, and a single useful link.

**Confidence: High** - follows the Imperator's complaint that the current generated templates are weak and the established Divinipress email voice guidance.

## Source Ownership

All new customer email templates in this campaign should be repo-owned source templates. Existing rendered/source-owned templates stay source-owned. Existing hosted templates for invite, onboarding, and password reset may be migrated to source-owned rendered templates in this campaign if the implementation can do it without delaying lifecycle email and Slack fanout. If that migration starts to widen the work, account template source migration may be split into a follow-up while copy and variable contracts remain documented.

Slack message formats must also be source-owned in the backend repo. Normal customer email editing should happen in code, with local render and preview samples. Slack alert payloads should be covered by focused samples or unit tests. Production email publish remains an explicit release action, never a side effect of validation or build.

**Confidence: High** - this preserves the DIV-97 source-rendered pattern and the explicit no-publish discipline.

## Contract Inventory

Every canonical-six contract surface this spec touches, mapped to its definition in the spec body and (where it exists today) its location in code on this branch's HEAD (`cc31649`). New surfaces are wired by this campaign; existing surfaces are inherited and either reused unchanged or modified per the noted requirement. `link.create` boundaries and module-boundary API contracts are not present in this spec — declared empty at the bottom of this section.

Code citations were verified against this branch's HEAD by reconnaissance before this section was authored. The Inventory is the spec's contract-surface map; full requirements live in the named spec sections.

### Subscriber boundaries

| Subscriber wiring | Status | Spec body | Code citation |
|-|-|-|-|
| `custom-order.created` → `ORDER_RECEIVED_CUSTOM` (proof-required path) | Existing — copy refresh | §Existing Terrain; §Email Inventory > Customer Order and Proof Emails | `src/subscribers/custom-order-created.ts:82-100` |
| `custom-order.created` → `ORDER_CONFIRMED_PROOFED` (all-reorder path) | Existing — copy refresh | §Existing Terrain; §Email Inventory > Customer Order and Proof Emails | `src/subscribers/custom-order-created.ts:75-80` |
| `custom-order.created` → `SLACK_OPS_NEW_CUSTOM_ORDER` | New | §Email Inventory > Internal Divinipress Slack Alerts; §Fanout Rules | none — to be added |
| `custom-order.proof_ready` → `PROOF_READY` | Existing — copy refresh; emission must be moved or protected to post-persistence | §Existing Terrain; §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | subscriber `src/subscribers/custom-order-proof-ready.ts:29-40`; current emission `src/api/custom-order/order-flow.ts:172-185` (pre-persistence today) |
| post-`rejectProof` event → `PROOF_REVISION_REQUESTED_CUSTOMER` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| post-`rejectProof` event → `SLACK_OPS_PROOF_REVISION_REQUESTED` | New | §Notification Event Contract; §Email Inventory > Internal Divinipress Slack Alerts | none — to be added |
| post-`approveProof` (ORDER) → `PROOF_APPROVED_CUSTOMER` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| post-`approveProof` (CATALOG) → `SAVED_PRODUCT_READY` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts | none — to be added |
| post-`approveProof` (both types) → `SLACK_OPS_PROOF_APPROVED` | New | §Notification Event Contract; §Email Inventory > Internal Divinipress Slack Alerts | none — to be added |
| post-`holdProduction` → `PRODUCTION_HOLD_CUSTOMER` | New — `holdProduction` requires a sideEffects-capable dispatch path; currently dispatched via `otherEventSchema` with no sideEffects block | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:548-554` |
| post-`holdProduction` → `SLACK_OPS_PRODUCTION_HOLD` | New — same dispatch dependency as above | §Notification Event Contract; §Email Inventory > Internal Divinipress Slack Alerts | as above |
| post-`addTracking` → `ORDER_SHIPPED` | New | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails; §Data Contracts | sideEffects today `src/api/custom-order/order-flow.ts:585-627` (no emission) |
| post-`addTracking` → `SLACK_OPS_ORDER_SHIPPED` | New | §Notification Event Contract; §Email Inventory > Internal Divinipress Slack Alerts | as above |
| post-`deliverProduct` → `ORDER_DELIVERED` | New — `deliverProduct` requires a sideEffects-capable dispatch path; currently dispatched via `otherEventSchema` with no sideEffects block | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:628-631` |
| cancellation event (conditional) → `ORDER_CANCELED` | Conditional new — wire only if a real customer-facing cancellation action exists in the target branch | §Notification Event Contract; §Email Inventory > Customer Order and Proof Emails | none — no cancellation emission point identified on HEAD |
| onboarding event (conditional) → `ONBOARDING` | Conditional new — `ONBOARDING` template exists in registry but no subscriber is wired; needs a durable post-account-created event carrying recipient identity | §Email Inventory > Account Emails | template at `src/modules/resend/email/template-registry.ts:144-153`; no subscriber present under `src/subscribers/` |
| `invite.created` / `invite.resent` → `INVITE_TEAM_MEMBER` | Existing — copy refresh; account template hosted-to-source migration optional | §Existing Terrain; §Email Inventory > Account Emails; §Source Ownership | `src/subscribers/user-invited.ts:24-37` |
| `auth.password_reset` → `PASSWORD_RESET` | Existing — copy refresh; account template hosted-to-source migration optional | §Existing Terrain; §Email Inventory > Account Emails; §Source Ownership | `src/subscribers/password-reset.ts:66-78` |

### Wire shapes on module boundaries

| Surface | Status | Spec body | Code citation |
|-|-|-|-|
| `custom-order.created` event payload — `{ order_id: string }` | Existing | §Notification Event Contract | emit `src/api/store/carts/[id]/custom-complete/route.ts:437-444`; consumer typing `src/subscribers/custom-order-created.ts:12-14` |
| `custom-order.proof_ready` event payload — `{ customOrderId: string }` | Existing — emission point moves to post-persistence; payload shape unchanged | §Notification Event Contract | `src/api/custom-order/order-flow.ts:172-185` |
| New lifecycle event payloads — `rejectProof`, `approveProof` (ORDER), `approveProof` (CATALOG), `holdProduction`, `addTracking`, `deliverProduct`, cancellation | New — must carry enough identifier data for subscribers to render emails per §Data Contracts (order id, custom order id, customer email/name, product/line-item summary, tracking labels for shipping, etc.) | §Notification Event Contract; §Data Contracts | none — to be added |
| Existing customer email template variable contracts — `orderVariables` (13 fields, used by `ORDER_RECEIVED_CUSTOM` + `ORDER_CONFIRMED_PROOFED`), `proofReadyVariables` (6 fields, used by `PROOF_READY`), invite/password/onboarding variable shapes | Existing — copy refresh only; variable shapes unchanged unless required by spec | §Data Contracts | registry `src/modules/resend/email/template-registry.ts:52-75, 93-161`; materializers `src/modules/resend/utils/build-order-email-variables.ts:31-57`, `src/modules/resend/utils/build-proof-ready-email-variables.ts:13-30` |
| New customer email template variable contracts — `PROOF_REVISION_REQUESTED_CUSTOMER`, `PROOF_APPROVED_CUSTOMER`, `SAVED_PRODUCT_READY`, `PRODUCTION_HOLD_CUSTOMER`, `ORDER_SHIPPED`, `ORDER_DELIVERED`, `ORDER_CANCELED` | New — must include the field families named in §Data Contracts (`current_year`, recipient name, primary URL, primary identifier, plus per-template fields: order id + line-item summary, proof note text when present, multiple tracking entries when present, saved product id/handle with My Products fallback) | §Data Contracts; §Email Inventory > Customer Order and Proof Emails | none — to be added |
| Slack alert payload contracts — five alerts | New — must include customer/company, order id, custom order id when relevant, product/line-item summary, triggering event, and admin/proof URL when available; compact block or text layout with one action link | §Data Contracts; §Email Inventory > Internal Divinipress Slack Alerts | none — `Templates` enum `src/modules/resend/templates.ts` has no Slack keys today |
| `SAVED_PRODUCT_READY` payload + saved-product retrieval shape | New — payload must carry saved product id and handle from creation result; fallback path queries by `metadata.custom_order_id` and falls back to a My Products link if no direct URL is provable | §Data Contracts (paragraph on `SAVED_PRODUCT_READY`) | creation site `src/api/custom-order/order-flow.ts:349-403` (returns standard Medusa `ProductDTO[]`, accessed `result[0].id`); link mechanism `metadata.custom_order_id` on product record |
| Shipping notification scoping shape | New — must use labels from triggering `addTracking` request or filter queried fulfillment labels back to the triggering custom order's items; multiple labels render as multiple tracking entries | §Data Contracts (paragraph on shipping notifications) | `addTracking` schema `src/api/custom-order/order-flow.ts:50-61` (`{ fulfillmentId, labels: [{ trackingNumber, trackingUrl?, labelUrl? }], items, metadata? }`); current write path `src/api/custom-order/order-flow.ts:613-625` |
| Template variable validation contract — `validateTemplateVariables` presence-only check | Existing — campaign preserves hard-fail behavior on missing variables for customer email; no weakening allowed under Slack's warning-only failure mode | §Recipient Rules ("Existing Resend behavior already hard-fails invalid templates and failed sends; this campaign should preserve that observability for customer email."); §Source Ownership; §Success Criteria | `src/modules/resend/service.ts:71-84` |

### Idempotency anchors

| Anchor | Status | Spec body | Code citation |
|-|-|-|-|
| `SAVED_PRODUCT_READY` send + saved-product creation, keyed by `custom_order` id (with saved product id or another stable proof-approval result) | New — must be added; before creation/announcement, implementation must query for an existing saved product associated with the `custom_order` id and reuse if present | §Data Contracts (paragraph on duplicate prevention) | absent today — `approveProof` CATALOG branch `src/api/custom-order/order-flow.ts:221-445` has no pre-creation duplicate query; only guard is status-based via `validateEventTransition` (`src/api/custom-order/order-flow.ts:686-728`), which is artifact-blind |

### Workflow ownership claims

| Owner | Emission requirement | Status today | Spec body | Code citation |
|-|-|-|-|-|
| `submitProof` route — `custom-order.proof_ready` emission | Move or protect emission so it occurs only after the `custom_order` status update is durable | Pre-persistence — emission inside sideEffects fires before status DB write | §Notification Event Contract | handler order `src/api/custom-order/[id]/route.ts:297-352`; current emission `src/api/custom-order/order-flow.ts:172-185` |
| `approveProof` route — emission for ORDER and CATALOG branches | Emit post-persistence after `approveProof` succeeds | Not implemented today | §Notification Event Contract | sideEffects `src/api/custom-order/order-flow.ts:221-445` (no emission); persistence `src/api/custom-order/[id]/route.ts:349-352` |
| `rejectProof` route — revision event emission | Emit after `rejectProof` side effects and status transition succeed | Not implemented today | §Notification Event Contract | sideEffects `src/api/custom-order/order-flow.ts:471-509` (no emission) |
| `holdProduction` route — hold event emission | Emit after `holdProduction` status transition succeeds | Not implemented today; route lacks sideEffects block | §Notification Event Contract | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:548-554` |
| `addTracking` route — shipped event emission | Emit after `addTracking` shipment creation and status transition succeed | Not implemented today | §Notification Event Contract | sideEffects `src/api/custom-order/order-flow.ts:585-627` (no emission) |
| `deliverProduct` route — delivered event emission | Emit after `deliverProduct` status transition succeeds | Not implemented today; route lacks sideEffects block | §Notification Event Contract | dispatch `src/api/custom-order/[id]/route.ts:306-346`; `EVENT_MAP` entry `src/api/custom-order/order-flow.ts:628-631` |

### `link.create` boundaries

None defined. The saved-product / `custom_order` association uses a metadata field (`product.metadata.custom_order_id`) on the product record, not a Medusa module link table. The spec does not introduce a new `link.create` boundary.

### API contracts at module boundaries

None defined. The spec covers notification events, template variable contracts, and Slack alert payload contracts. It does not introduce new REST endpoints or change existing ones.

**Confidence: High** — every entry is anchored to a named spec body section. Existing surfaces are anchored to verified file/line citations on this branch's HEAD (`cc31649`); new surfaces are explicitly marked "to be added."

## Non-Goals

- Marketing nurture or sales drip emails.
- Per-company notification settings.
- Company admin copy rules for every staff action.
- New frontend pages solely for email links.
- Publishing Resend production templates as part of implementation without an explicit release command.
- Emailing every proof/order state transition.
- Duplicating every customer email into Slack.
- Slack slash commands, buttons, interactive approvals, or preference management.
- Signup-request lifecycle emails when no live signup-request lifecycle exists in the target branch.

**Confidence: High** - keeps the campaign from becoming a notification platform.

## Success Criteria

The campaign is complete when:

| Criterion | Observable proof |
|-|-|
| Inventory complete | Every template in this spec is either implemented or explicitly marked deferred because the live event does not exist. |
| Existing templates improved | Invite, password reset, order received, order confirmed, and proof ready no longer use generic generated copy. |
| Customer lifecycle covered | Proof revision, proof approval, saved product ready, production hold, shipped, delivered, and canceled have correct customer behavior where live events exist. |
| Ops Slack alerts covered | New order, proof approved, revision requested, production hold, and shipped alerts can reach the configured Divinipress Slack channel. |
| No spammy mechanics | Silent events remain silent. |
| Data contracts validated | Render samples exist for every source-owned email template, Slack alert payload samples exist for every ops alert, and validation fails when required variables are missing. |
| Delivery checked | Local validation, render, preview, focused unit tests, and build pass. API-backed email and Slack checks run when required env vars are present. |
| Notification events defined | Every newly implemented lifecycle email or Slack alert has a corresponding emitted notification event or documented existing event after the successful business transition. |
| Fanout controlled | Order-created notifications are per Medusa order; later proof/production/shipping/delivery notifications are per custom order. |
| Failure paths proven | Tests or targeted harnesses prove missing Slack config warns/skips as specified, Slack rejection does not roll back business state, and customer email hard-failure behavior is not weakened by Slack warning-only behavior. |

**Confidence: High** - all criteria map directly to the approved campaign intent.

## Open Implementation Checks

These are codebase checks for the implementation plan, not unresolved product decisions:

| Check | Why it matters |
|-|-|
| Welcome/onboarding trigger | Choose invite acceptance, direct registration success, or both based on live event boundaries. |
| Cancellation trigger | Wire only to a real customer-facing cancellation action. |
| Saved product URL availability | Prefer direct product link; fallback to My Products if direct URL is not readily available. |
| Slack destination config shape | Use a dedicated channel webhook or equivalent Slack integration without hardcoded people or channels. |
| Event subscriber failure behavior | Preserve observability without making email or Slack the business transaction source of truth. |
| Account template migration size | Keep invite/password/onboarding source migration only if it stays bounded; otherwise split it from lifecycle and Slack work. |
| Post-persistence emission placement | Move or wrap existing proof-ready emission and add new lifecycle emissions only after the custom-order status update is durable. |

**Confidence: Medium** - these require implementation-time repo tracing, but none changes the approved email map.
