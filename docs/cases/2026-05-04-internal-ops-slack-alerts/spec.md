# Spec: Internal Ops Slack Alerts Campaign

**Date:** 2026-05-04
**Repo:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`
**Status:** Draft for verification
**Author:** Publius Auctor
**Foundation:** This spec depends on the Customer Transactional Email Campaign (`../2026-05-01-transactional-email-campaign/spec.md`), which ships the post-persistence lifecycle event emissions this campaign subscribes to. This spec does not modify routes; it adds subscribers and notification workflows that listen to the events that campaign emits.

## Why

Divinipress ops needs real-time visibility into customer/order events that require production attention. Today, only customer emails fire on lifecycle transitions; ops staff have no internal channel that surfaces "a new custom order arrived," "a proof was approved and is ready to print," "production was placed on hold," or "tracking was added and a shipment is out the door." Ops staff already work in Slack; surfacing these moments as compact Slack posts in a dedicated ops channel turns Slack into the operating awareness layer.

**Confidence: High** - the Imperator approved Slack as the ops alerting channel and split this from the customer email campaign so the two specs remain focused.

## Approved Scope

V1 covers internal ops Slack alerts in a dedicated Divinipress ops channel:

| Class | Purpose |
|-|-|
| Lifecycle ops Slack alerts | Tell internal production staff when a customer or order event needs attention. |

The campaign builds a Slack notification provider module on `channel: "slack"` following the Medusa Slack integration guide pattern, ships subscribers and workflows for five lifecycle alerts, and registers Slack-template payloads in the provider's templates registry. It does not duplicate every customer email into Slack, build slash commands or interactive controls, or introduce per-channel preference management.

**Confidence: High** - the Imperator approved Slack as the internal ops channel and confirmed the additive split from the customer email campaign.

## Existing Terrain

Live backend truth at the time of this spec:

- No Slack provider module exists today. The `Templates` enum in `src/modules/resend/templates.ts` carries only email keys.
- The Notification Module is registered in `medusa-config.ts:69-98` with a single provider (Resend on `channel: "email"`).
- The foundation campaign (`../2026-05-01-transactional-email-campaign/spec.md`) ships the events this campaign subscribes to: `custom-order.created`, `custom-order.proof_ready` (relocated post-persistence), and new emissions for revision-requested, proof-approved, saved-product-ready, production-hold, shipped, and delivered.

**Confidence: High** - confirmed by reconnaissance against this branch's HEAD (`cc31649`) and by direct cross-reference to the foundation spec.

## Foundation Dependency

This spec is purely additive over the foundation campaign. Specifically:

- This spec does NOT modify `src/api/custom-order/[id]/route.ts` or `src/api/custom-order/order-flow.ts`. All route emissions are owned by the foundation campaign.
- This spec does NOT define new lifecycle event payloads. It consumes the payloads defined by the foundation.
- This spec does NOT modify the existing Resend provider on `channel: "email"`. It registers a new provider on `channel: "slack"` alongside it.
- This spec assumes the foundation campaign has shipped (or is shipping in the same branch). If the foundation events are absent, the Slack subscribers in this campaign have nothing to listen to.

If a finding in verification or implementation suggests modifying the routes or the foundation events, that change belongs in the foundation spec, not here.

**Confidence: High** - explicit additive boundary protects both campaigns from scope leak.

## Slack Alert Inventory

| Alert key | Recipient | Trigger event | Purpose | V1 behavior |
|-|-|-|-|-|
| `SLACK_OPS_NEW_CUSTOM_ORDER` | Dedicated Divinipress ops Slack channel | `custom-order.created` | Alert production that new work entered the queue. | New Slack post, one per Medusa order completion with sub-order summary. |
| `SLACK_OPS_PROOF_APPROVED` | Dedicated Divinipress ops Slack channel | post-`approveProof` (both `ProofType.ORDER` and `ProofType.CATALOG`) | Tell ops the proof can move forward. | New Slack post for both proof types — single alert key, one post per `custom_order` transition. |
| `SLACK_OPS_PROOF_REVISION_REQUESTED` | Dedicated Divinipress ops Slack channel | post-`rejectProof` | Tell ops revision work is needed, with note context when available. | New Slack post per `custom_order` transition. |
| `SLACK_OPS_PRODUCTION_HOLD` | Dedicated Divinipress ops Slack channel | post-`holdProduction` | Give internal visibility into blocked production work. | New Slack post per `custom_order` transition. |
| `SLACK_OPS_ORDER_SHIPPED` | Dedicated Divinipress ops Slack channel | post-`addTracking` | Internal shipment receipt for recordkeeping. | New Slack post per `custom_order` transition. |

`SLACK_OPS_PROOF_APPROVED` covers both proof types deliberately — the customer email splits (`PROOF_APPROVED_CUSTOMER` for ORDER only, `SAVED_PRODUCT_READY` for CATALOG) but ops cares about either approval the same way.

### Fanout Rules

`SLACK_OPS_NEW_CUSTOM_ORDER` is one post per Medusa order completion with a sub-order summary, mirroring the customer email fanout for `custom-order.created`. The other lifecycle alerts are one post per `custom_order` transition.

**Confidence: High** - alert keys and triggers map directly to the foundation campaign's emitted events.

## Slack Provider Module

Following the [Medusa Slack integration guide](https://docs.medusajs.com/resources/integrations/guides/slack):

- Module location: `src/modules/slack/`.
- Service: extends `AbstractNotificationProviderService`, identifier `"slack"`.
- Options: `webhook_url` (the Slack incoming webhook URL — determines the destination channel) and `admin_url` (base URL for the Divinipress admin panel — used to construct deep-links in alert payloads).
- Registration: alongside the existing Resend provider in `medusa-config.ts`, on `channels: ["slack"]`.
- `validateOptions`: throws `MedusaError` if either `webhook_url` or `admin_url` is missing, preventing the application from starting with incomplete config.
- `send` method: posts to `webhook_url` with a payload constructed from the alert key's template plus the variables passed in. Logs errors and returns gracefully on Slack API failure — does not throw, does not roll back business state.

Templates registry: a Slack-side analog to the Resend template registry, defined inside the Slack module. One template entry per alert key. Templates are repo-owned source (not hosted), built as functions that take a typed variables object and return Slack block-kit JSON or compact text.

Environment variables:

| Variable | Purpose |
|-|-|
| `SLACK_WEBHOOK_URL` | The Slack webhook URL for the dedicated Divinipress ops channel. Determines destination. |
| `SLACK_ADMIN_URL` | Base URL for the Divinipress admin panel (e.g., `https://admin.divinipress.com`). Used to construct admin deep-links in alert payloads. |

**Confidence: High** - structure verified against the Medusa Slack guide; provider shape mirrors the existing Resend provider.

## Events That Must Stay Silent

No V1 ops Slack alert should be sent for:

| Event or action | Why silent |
|-|-|
| `startJob` | Internal production movement. |
| `uploadProof` | File upload is not a customer or ops decision moment. |
| `updateNotes` | Notes can change without requiring an alert. |
| `orderProduct` | Internal fulfillment creation, not shipment. |
| `proceedProduction` | Internal mechanic — the meaningful ops signal is shipping or hold, not production-start. |
| `reopenProof` | Internal correction/reopen path. |

These match the foundation campaign's silent-event list. The two campaigns intentionally agree on the silent-event boundary so the same lifecycle moment doesn't produce a customer email but no Slack alert (or vice versa).

**Confidence: High** - consistency with foundation enforced.

## Recipient Rules

All ops Slack alerts go to the Slack channel determined by the `webhook_url` provider option. No personal Slack destination, user id, or hardcoded channel may be baked into source.

Slack configuration and failure behavior:

| Condition | Required behavior |
|-|-|
| Slack webhook config missing in local or test | The `validateOptions` method throws on application start; Slack module fails fast in non-runtime contexts (or skips registration if explicitly opted out via env). |
| Slack webhook config missing in production-like runtime | Application fails to start (per `validateOptions`); the notification module cannot register the Slack provider without options. |
| Slack request fails at send time | The `send` method logs the event key, originating event name, identifier (order id / custom order id when available), and Slack error detail. The originating route's status transition is unaffected because Slack runs in a subscriber, not in the route. |
| Slack delivery check command has env configured | A focused harness sends a test payload to the configured channel and fails if Slack rejects it. |

Ops Slack alerts must NEVER be the source of truth for business state. If Slack fails, business transactions (status transitions, status writes, customer email sends) must complete normally; the Slack failure is logged and visible to ops via the dashboard / log inspection.

**Confidence: High** - failure-path requirements grounded in Medusa Slack guide and the additive boundary with the foundation campaign.

## Data Contracts

All Slack alerts must carry enough context for ops to act:

| Field | Meaning |
|-|-|
| Customer / company name | Who the work is for. |
| Order id | Medusa order id when relevant. |
| Custom order id | When the alert is per `custom_order` transition. |
| Product / line-item summary | What was ordered, approved, held, or shipped. |
| Triggering event | Human-readable name of the lifecycle event (e.g., "Proof approved", "Production hold"). |
| Admin deep-link | URL constructed using `SLACK_ADMIN_URL` + the relevant admin path (e.g., `${SLACK_ADMIN_URL}/custom-orders/${customOrderId}`). |

`SLACK_OPS_NEW_CUSTOM_ORDER` includes a sub-order summary block — one row per `custom_order` sub-order on the parent Medusa order, with product titles and quantities.

`SLACK_OPS_ORDER_SHIPPED` includes the tracking number(s) and tracking URL(s) from the triggering `addTracking` request. Multiple labels render as multiple lines.

Slack alerts use compact block-kit blocks or compact text. Each alert has one clear action link to the admin panel. No sales language, no decoration — terse and operational.

**Confidence: High** - data contracts grounded in the Medusa Slack guide and Spec A's data contracts.

## Copy Direction

Slack alerts are terse, action-oriented, and stripped of polish:

| Rule | Contract |
|-|-|
| One line headline | "Proof approved — Acme Order #1234". |
| Compact context | Customer/company, product summary, triggering event. |
| One action link | Admin deep-link, no decorative buttons. |
| No emoji decoration | Optional single status emoji at the start of the headline (e.g., for hold/failure alerts) is allowed; no full emoji garnishing. |
| No CTA copy | Slack alerts are for action, not engagement. |

**Confidence: High** - matches the Imperator's Slack-first, no-noise direction.

## Source Ownership

The Slack provider module and all its alert templates are repo-owned source under `src/modules/slack/`. Slack alert payloads are covered by focused unit tests that render the payload from typed variables and assert structure.

Production Slack send remains an explicit configured action — no Slack POST happens during validation, render, or build. Test environment with `SLACK_WEBHOOK_URL` unset must skip Slack sends or fail registration, never silently no-op.

**Confidence: High** - preserves the no-publish-by-side-effect discipline established for email.

## Contract Inventory

Every canonical-six contract surface this spec touches, mapped to its definition in the spec body and (where it exists today) its location in code on this branch's HEAD (`cc31649`). New surfaces are wired by this campaign; existing surfaces are inherited from the foundation campaign. `link.create` boundaries, idempotency anchors, and module-boundary API contracts are not present in this spec — declared empty at the bottom of this section.

The Inventory is the spec's contract-surface map; full requirements live in the named spec sections.

### Subscriber boundaries

| Subscriber wiring | Status | Spec body | Code citation |
|-|-|-|-|
| `custom-order.created` → `SLACK_OPS_NEW_CUSTOM_ORDER` | New | §Slack Alert Inventory; §Fanout Rules | none — to be added |
| post-`approveProof` (both `ProofType.ORDER` and `ProofType.CATALOG`) → `SLACK_OPS_PROOF_APPROVED` | New | §Slack Alert Inventory | none — to be added |
| post-`rejectProof` → `SLACK_OPS_PROOF_REVISION_REQUESTED` | New | §Slack Alert Inventory | none — to be added |
| post-`holdProduction` → `SLACK_OPS_PRODUCTION_HOLD` | New | §Slack Alert Inventory | none — to be added |
| post-`addTracking` → `SLACK_OPS_ORDER_SHIPPED` | New | §Slack Alert Inventory; §Data Contracts | none — to be added |

### Wire shapes on module boundaries

| Surface | Status | Spec body | Code citation |
|-|-|-|-|
| Slack provider service interface | New — `AbstractNotificationProviderService` extension with identifier `"slack"`, `validateOptions` (throws on missing `webhook_url` / `admin_url`), `send` method (posts to `webhook_url`, logs on failure, returns without throwing) | §Slack Provider Module | none — to be added at `src/modules/slack/service.ts` |
| Slack provider options shape — `{ webhook_url: string, admin_url: string }` | New — sourced from `SLACK_WEBHOOK_URL` and `SLACK_ADMIN_URL` env vars in `medusa-config.ts` | §Slack Provider Module; §Recipient Rules | `medusa-config.ts:69-98` (Notification Module config) — Slack provider entry to be added |
| Slack alert template registry — one entry per alert key | New — repo-owned source templates rendering compact Slack block-kit or text payloads | §Slack Provider Module; §Source Ownership | none — to be added at `src/modules/slack/templates/` (or equivalent) |
| Slack alert payload contracts — five alerts | New — must include customer/company, order id, custom order id when relevant, product/line-item summary, triggering event, admin deep-link constructed from `admin_url` provider option | §Data Contracts; §Slack Alert Inventory | none — to be added |

### Workflow ownership claims

#### Notification workflow ownership

One workflow per Slack alert key. Each workflow is owned by this campaign.

| Workflow ownership | Status | Spec body |
|-|-|-|
| Workflow that sends `SLACK_OPS_NEW_CUSTOM_ORDER` (triggered by `custom-order.created`) | New | §Slack Alert Inventory; §Fanout Rules |
| Workflow that sends `SLACK_OPS_PROOF_APPROVED` (triggered by post-`approveProof` event for both `ProofType.ORDER` and `ProofType.CATALOG`) | New | §Slack Alert Inventory |
| Workflow that sends `SLACK_OPS_PROOF_REVISION_REQUESTED` (triggered by post-`rejectProof` event) | New | §Slack Alert Inventory |
| Workflow that sends `SLACK_OPS_PRODUCTION_HOLD` (triggered by post-`holdProduction` event) | New | §Slack Alert Inventory |
| Workflow that sends `SLACK_OPS_ORDER_SHIPPED` (triggered by post-`addTracking` event) | New | §Slack Alert Inventory; §Data Contracts |

Each workflow follows Medusa's official Slack integration pattern (subscriber → workflow with `useQueryGraphStep` + `sendNotificationsStep`):

- Accepts the lifecycle event payload as input.
- Uses `useQueryGraphStep` to fetch the customer, custom order, line items, product info, and tracking labels as needed.
- Calls `sendNotificationsStep` with `channel: "slack"`, the appropriate alert key as `template`, and the materialized variables.
- Constructs the admin deep-link using the Slack provider's `admin_url` option (accessed via the provider, not duplicated in the workflow).

#### Route emission ownership

None. This spec does not modify routes. All route-level emissions are owned by the foundation campaign.

### `link.create` boundaries

None defined. This spec does not introduce module links.

### Idempotency anchors

None defined. Slack alerts are idempotent at the alert level — Slack itself dedupes identical messages within a short window — and this spec does not introduce a stronger anchor for V1.

### API contracts at module boundaries

None defined. The spec covers Slack provider internals, alert templates, and notification workflows; it does not introduce new REST endpoints or change existing ones.

**Confidence: High** — every entry is anchored to a named spec body section; new surfaces are explicitly marked "to be added"; existing dependencies cite the foundation spec.

## Non-Goals

- Slack slash commands, buttons, interactive approvals, or modal dialogs.
- Per-channel or per-user Slack preference management.
- Auto-retry of failed customer email sends from the failure alert.
- Mirroring every customer email into Slack as a redundant channel.
- Multiple Slack channels (V1 routes everything to one channel via one webhook).
- Customer-facing Slack messaging (Slack is internal-ops-only).
- Modifications to the foundation campaign's routes or events. Belongs in the foundation spec.

**Confidence: High** - keeps the campaign focused on additive ops Slack alerting.

## Success Criteria

The campaign is complete when:

| Criterion | Observable proof |
|-|-|
| Slack provider module exists | `src/modules/slack/` ships with service, templates registry, and module definition; module is registered in `medusa-config.ts` on `channels: ["slack"]`. |
| All five alerts deliverable | New custom order, proof approved, revision requested, production hold, and shipped alerts can reach the configured Divinipress Slack channel. |
| Subscribers wired | One subscriber per alert key; each subscriber is a thin shim that runs its notification workflow. |
| Workflows follow official pattern | Each Slack notification workflow uses `useQueryGraphStep` + `sendNotificationsStep`. |
| Foundation dependency holds | All Slack subscribers listen to events emitted by the foundation campaign; this spec does not modify any route. |
| Env validation works | `validateOptions` throws when `SLACK_WEBHOOK_URL` or `SLACK_ADMIN_URL` is missing; application fails to start in that condition (or skips Slack registration cleanly with explicit env opt-out). |
| Slack failure isolation | Tests prove that Slack send failures (network error, invalid webhook, Slack API rejection) do NOT roll back the originating route's status transition AND do NOT block the customer email from sending. |
| Silent events stay silent | Per §Events That Must Stay Silent. |
| Data contracts validated | Slack alert payload samples exist and validation fails when required variables are missing. |
| Delivery checked | Local validation, focused unit tests, and build pass. API-backed Slack checks run when `SLACK_WEBHOOK_URL` is present. |

**Confidence: High** - all criteria map directly to the campaign intent and the additive boundary with the foundation.

## Open Implementation Checks

| Check | Why it matters |
|-|-|
| Slack provider file structure | Mirror `src/modules/resend/` layout: `service.ts`, `index.ts`, templates registry. |
| `SLACK_WEBHOOK_URL` and `SLACK_ADMIN_URL` env conventions | Confirm naming alignment with rest of Divinipress env config; document in `.env.example`. |
| `useQueryGraphStep` field selection per alert | Each Slack workflow's query.graph fields list must be sufficient to render its alert without requiring additional fetches inside the workflow. |
| Test harness for Slack delivery | Decide whether to add a dedicated `yarn slack:check` command (parallel to existing email check pattern) for verifying webhook reachability. |

**Confidence: Medium** - these require implementation-time repo tracing and cross-spec coordination with the foundation campaign.
