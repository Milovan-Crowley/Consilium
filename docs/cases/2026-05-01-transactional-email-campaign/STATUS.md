---
status: spec-draft
opened: 2026-05-01
last_updated: 2026-05-04
target: divinipress-backend
agent: claude
type: feature
sessions: 1
current_session: 1
---

## Current state

Spec rewritten 2026-05-04 with material changes; needs re-verification.

**Scope narrowed.** Original combined "Transactional Email and Slack Notification Campaign" was split on 2026-05-04 into two focused specs. This case folder now covers customer transactional email only. Internal ops Slack alerts moved to `../2026-05-04-internal-ops-slack-alerts/`.

**Pattern aligned with Medusa convention.** Subscribers re-implemented as thin shims that run notification workflows, per the [Resend integration guide](https://docs.medusajs.com/resources/integrations/guides/resend). Each workflow uses `useQueryGraphStep` + `sendNotificationStep`. Lifecycle event emissions move from `EVENT_MAP[X].sideEffects` (pre-persistence) to a dedicated post-persistence section in the route handler, after `updateCustomOrders` returns successfully.

**Send failure handling kept boring.** Customer email send failures fall to Medusa's default behavior (logged via framework logger, no rethrow, no retry). V1 accepts this silent-fail-on-send shape; hardening deferred to a future campaign.

**Foundation status:** Slice 2 commit `cc31649 feat(email): Add source-rendered custom order emails` on `feature/div-97-non-apparel-email-subscriber` shipped Resend delivery, repo-owned React Email path, source-rendered custom-order templates, and validation scripts. Verified via backend speculator pass before Inventory authorship.

**Verification history:**
- 2026-05-04 first Tabularius pass: GAP — Contract Inventory section absent.
- 2026-05-04 backend speculator anchored every contract surface to file/line citations on `cc31649`.
- 2026-05-04 Contract Inventory authored from speculator citations; committed as `f2e76b3 docs(consilium): Add Contract Inventory to transactional email spec`.
- 2026-05-04 second Tabularius pass: SOUND — coverage complete.
- 2026-05-04 Censor + Provocator dispatched in parallel; returned 8 GAPs + 10 CONCERNs across both. Imperator triaged; spec rewritten in response.
- Re-verification on rewritten spec: pending.

**Worktree:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`

## Approved scope (from spec.md)

Customer and company-user lifecycle email:

| Surface | Count | Notes |
|-|-|-|
| Customer email — existing copy refresh | 5 | Invite, password reset, order received custom, order confirmed proofed, proof ready. |
| Customer email — new lifecycle | 6 | Proof revision requested, proof approved (ORDER only), saved product ready (CATALOG only), production hold, shipped, delivered. |

Onboarding deferred (Medusa accept-invite workflow surgery out of V1 scope). `ORDER_CANCELED` deferred (no real customer-facing cancellation event on this branch). `proceedProduction` silent.

## What's next

- [ ] Re-run Tabularius foreground; if SOUND, dispatch Censor + Provocator in parallel.
- [ ] Resolve findings under Imperator's no-AI-slop constraint (GAPs surfaced, not auto-fixed).
- [ ] Imperator review gate.
- [ ] Issue edicts (write implementation plan).
- [ ] March (after companion Slack spec verification clears).

## Open questions

- Sequencing with companion Slack spec — both can verify in parallel; foundation (this spec) ships first or alongside Slack.
- Account template hosted-to-source migration: include in V1 if bounded, else split.

## Cross-references

- Spec: `spec.md`
- Companion: `../2026-05-04-internal-ops-slack-alerts/spec.md` (depends on this spec's foundation)
- Foundation Slice 2: `../2026-04-25-custom-order-email-workflow/STATUS.md` (commit `cc31649`)
- Worktree: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`
- Medusa Resend integration guide: https://docs.medusajs.com/resources/integrations/guides/resend
- Related PRs: #34 (email-only diff, Slices 1 + 2, awaiting #37 upstream), #37 (`import-script-promo-print` → `develop`, OPEN)
