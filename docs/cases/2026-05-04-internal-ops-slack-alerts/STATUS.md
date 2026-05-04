---
status: spec-draft
opened: 2026-05-04
last_updated: 2026-05-04
target: divinipress-backend
agent: claude
type: feature
sessions: 0
current_session: 0
---

## Current state

Spec drafted 2026-05-04; needs verification.

This is the additive Slack ops alerts campaign, split from the original combined "Transactional Email and Slack Notification Campaign" on 2026-05-04 so both specs stay focused. Foundation comes from `../2026-05-01-transactional-email-campaign/` — that campaign ships post-persistence lifecycle event emissions and the customer email implementation. This campaign adds:

- Slack notification provider module on `channel: "slack"` (per the [Medusa Slack integration guide](https://docs.medusajs.com/resources/integrations/guides/slack)).
- Five Slack alerts: new custom order, proof approved, revision requested, production hold, shipped.
- Subscriber → notification workflow per alert (Medusa-canonical pattern: thin subscriber, workflow with `useQueryGraphStep` + `sendNotificationsStep`).
- Env vars `SLACK_WEBHOOK_URL` and `SLACK_ADMIN_URL` (the latter sourced as the Slack provider's `admin_url` option).

**Send failure handling kept boring.** This spec accepts Medusa's default Slack-send failure shape (log, do not rethrow, do not roll back business state). No retry, no fanout, no observability scaffolding. Hardening deferred to a future campaign.

**Worktree:** same as foundation, `feature/div-97-non-apparel-email-subscriber`.

## Approved scope (from spec.md)

| Alert | Trigger | Count |
|-|-|-|
| `SLACK_OPS_NEW_CUSTOM_ORDER` | `custom-order.created` | 1 |
| `SLACK_OPS_PROOF_APPROVED` | post-`approveProof` (both ORDER and CATALOG) | 1 |
| `SLACK_OPS_PROOF_REVISION_REQUESTED` | post-`rejectProof` | 1 |
| `SLACK_OPS_PRODUCTION_HOLD` | post-`holdProduction` | 1 |
| `SLACK_OPS_ORDER_SHIPPED` | post-`addTracking` | 1 |

Plus the Slack provider module structure (service, options, templates registry, registration in `medusa-config.ts`).

## What's next

- [ ] Dispatch Tabularius (Contract Inventory) foreground; if SOUND, dispatch Censor + Provocator in parallel.
- [ ] Resolve findings under Imperator's no-AI-slop constraint.
- [ ] Imperator review gate.
- [ ] Issue edicts.
- [ ] March (after foundation lands or alongside).

## Open questions

- `SLACK_ADMIN_URL` value: needs the production admin panel URL.
- Sequencing with foundation: foundation must merge or be in flight before Slack subscribers can listen meaningfully (events have to fire for subscribers to receive).
- Whether to add a `yarn slack:check` command (parallel to existing email check pattern).

## Cross-references

- Spec: `spec.md`
- Foundation: `../2026-05-01-transactional-email-campaign/spec.md`
- Worktree: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`
- Medusa Slack integration guide: https://docs.medusajs.com/resources/integrations/guides/slack
