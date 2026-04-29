# Spec: Email Templates as Code and Resend Operations

**Date:** 2026-04-29
**Project:** Non-Apparel Catalog Launch
**Issue:** DIV-97, Slice 2
**Parent case:** `2026-04-25-custom-order-email-workflow`
**Status:** Draft for Imperator review
**Author:** Publius Auctor

---

## Why

Slice 1 fixed the backend subscriber path: non-apparel line items now render through a helper, and orders with zero tax or zero discount no longer silently fail Resend variable validation. That work exposed the next problem: Divinipress email templates still live as dashboard artifacts, so layout bugs, variable drift, and copy changes require manual Resend editing.

That is too fragile for transactional email. The dashboard may remain useful for logs and emergency inspection, but it must stop being the normal editing surface.

Slice 2 moves the email template source of truth into the backend repo and adds a repeatable local workflow to render, preview, test-send, draft-update, diff, and publish Resend templates without hand-editing dashboard HTML.

> **Confidence: High** - Imperator explicitly confirmed the repo-first direction and the pain of dashboard editing. Slice 1 case inputs identify dashboard template drift, invalid wrapper HTML, and zero tax/discount rendering as the deferred work.

---

## Decisions Locked

1. **Include `PROOF_READY` in Slice 2.**
   The order-created templates are the main reason for this slice, but `PROOF_READY` has the same template-source problem and already has a variable-registration drift: the subscriber sends `proof_url`, while the Resend provider registry does not declare it. Slice 2 covers it as a contract migration, not as a broad proof-flow redesign.

2. **Use current Resend tooling, not stale local constraints.**
   Resend now documents an official CLI, including template create/update/publish and `--react-email`. The repo's installed `resend@6.4.1` is stale for this purpose and has no binary. Because this app has effectively no active-user compatibility pressure, Slice 2 should upgrade or add the tooling that gives Divinipress the cleanest repo-first workflow instead of designing around the old installed SDK. The preferred path is versioned repo commands using proven current tooling: either a pinned Resend CLI path that supports React Email template updates, or repo rendering of React Email to HTML/text followed by SDK template update. If both automation paths fail, implementation must stop for a decision rather than quietly returning to dashboard-first editing.

3. **Dashboard becomes inspect-only for this lane.**
   Normal changes must be made in code, reviewed in PRs, and pushed through scripts. The dashboard remains acceptable for account setup, domain/DNS work, logs, emergency inspection, and manual rollback if the scripted path fails.

4. **Tax always displays, discount hides when zero.**
   Tax is a customer trust line. If tax is zero, the email should say `$0.00`. Discount is different: no discount is the default state, so showing `Discount: $0.00` adds noise and reads like a missed promotion.

5. **Do not create the full proof-flow template family in this slice.**
   `ProofType.CATALOG`-specific future templates are real, but they are not this session. Slice 2 prepares the template system so those emails are easier later.

> **Confidence: High** - These decisions follow the Imperator's latest approval plus live repo facts around the Resend package and current subscribers. The only Medium-confidence area is the exact command surface the plan should standardize on after preflight.

---

## Current External Facts

The implementation plan must re-check these before execution, but the current verified shape is:

- Resend's official CLI supports `templates create`, `templates update`, `templates publish`, and React Email input by path.
- `resend-cli@2.2.1` exposes `templates update --react-email`, which bundles/renders a React Email `.tsx` template and uses it as the HTML body.
- Resend's current API docs expose template create, get, update, and publish. The docs list `react` for template update, but the current public SDK package does not expose `react` in `UpdateTemplateOptions`; the plan must treat CLI React update and SDK HTML/text update as the verified paths unless SDK behavior changes.
- Resend hosted template variables are string/number variables, not arbitrary structured objects.
- Resend send-template variables cap string values at 2,000 characters and templates can declare up to 50 variables.
- Templates remain draft until published; publishing is a separate operation.
- The local dependency `resend@6.4.1` has no `bin` entry and its installed template update type/runtime do not support `react`. The current public `resend` package is `6.12.2`, with `@react-email/render` as a peer dependency, but `resend@6.12.2` still lacks `react` on template update. The plan must verify the selected CLI or render-to-HTML path before coding against it.

Sources:
- [Resend CLI](https://resend.com/docs/cli)
- [Create Template](https://resend.com/docs/api-reference/templates/create-template)
- [Update Template](https://resend.com/docs/api-reference/templates/update-template)
- [Publish Template](https://resend.com/docs/api-reference/templates/publish-template)
- [Using Templates](https://resend.com/docs/dashboard/emails/email-templates)
- [Send Email](https://resend.com/docs/api-reference/emails/send-email)
- [Template Variables](https://resend.com/docs/dashboard/templates/template-variables)

> **Confidence: Medium** - Resend docs, npm metadata, and `resend-cli@2.2.1 templates update --help` were checked on 2026-04-29, but external APIs can drift. The plan must include a short preflight against the selected CLI or render-to-HTML path before writing deployment scripts.

---

## In Scope

### Template Source Ownership

The repo must own the source for these three Resend templates:

| Template enum | Current alias | Current template ID | Scope |
|-|-|-|-|
| `ORDER_RECEIVED_CUSTOM` | `order_received_custom_v2` | `ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf` | Full migration and rendering fix |
| `ORDER_CONFIRMED_PROOFED` | `order_confirmed_proofed_v2` | `75866903-26c8-4881-9a0c-8b33219e7614` | Full migration and rendering fix |
| `PROOF_READY` | `proof_ready_v1` | `0031e303-c209-4768-a21f-5b59e2959edb` | Contract migration and source ownership |

The two order templates must be actively corrected. `PROOF_READY` must be brought under source control and typed, but its copy/flow should stay behaviorally equivalent unless a defect is directly tied to the migration.

> **Confidence: High** - The two order templates are called by `custom-order-created`; `PROOF_READY` is called by `custom-order-proof-ready` and has a known `proof_url` declaration gap.

### Template Registry

The repo must have one durable template registry that defines, per template:

- enum key
- Resend template ID
- alias
- subject
- from and reply-to defaults if owned by the template
- variable contract
- sample payload references
- whether the template is currently publishable by script

`src/modules/resend/service.ts` and the template tooling must not maintain separate hand-written variable lists that can drift. The implementation may either make the provider consume the registry directly or generate one surface from the other, but the observable outcome is one source of truth.

> **Confidence: High** - Slice 1 already proved that the current registry misses keys the subscribers send. Drift must be structurally prevented, not merely patched once.

### Developer Operations

The repo must provide a normal developer workflow for emails without dashboard editing. Exact script names belong in the implementation plan, but the capability contract is:

- **Render:** produce local HTML and text output from each template using sample payloads.
- **Preview:** open or serve rendered examples for quick visual inspection.
- **Validate:** prove every template compiles, every declared sample renders, rendered template variables stay inside Resend limits, and provider variables match the sender contract.
- **Send rendered test:** send repo-rendered HTML/text for a specific template to a specified email address with a named sample payload. This proves draft visual content before publish.
- **Send hosted smoke:** send a published hosted template by ID or alias with a named sample payload. This proves the live hosted path, not draft content.
- **Pull current:** fetch current Resend template metadata and HTML for comparison.
- **Diff:** compare repo-rendered output and manifest metadata against Resend's current draft/published template state.
- **Push draft:** update the existing Resend template draft from repo source without publishing. Draft updates must own both HTML and text output; if the selected React Email command only updates HTML, the command must also pass/update the matching plain-text output.
- **Publish:** publish an existing draft only through an explicit command/flag. Publishing must never happen as a side effect of a normal build or test command.

All commands must use `RESEND_API_KEY` or an explicit API-key flag. No API key may be stored in the repo, printed to logs, or committed into generated artifacts.

> **Confidence: High** - This is the operational answer to the Imperator's complaint. The dashboard stops being the editing surface only if the repo has these verbs.

### Template Layout and Rendering

The order templates must no longer place `line_items_list` inside `<ul><li><p>...</p></li></ul>`.

The line-item area must be a block-safe region. It may still receive a pre-rendered, already-escaped HTML string from the Slice 1 helper, because Resend hosted template variables are string/number oriented and this slice should not rewrite the notification provider to send structured line-item arrays. The key requirement is that the template shell gives the helper's card HTML a valid block container.

Non-line-item variables must render through escaped React/HTML interpolation by default. Raw HTML insertion is allowed only for the explicitly sanitized `line_items_list` field.

`line_items_list` must also respect Resend's hosted-template string limit. The implementation must either prove the generated value stays within the 2,000-character variable cap for a worst-case sample of at least five sub-order cards with mixed apparel and non-apparel options, or stop using hosted-template variable substitution for that card region and instead send the repo-rendered HTML path where the full line-item markup is part of the email HTML.

> **Confidence: High** on the invalid-wrapper regression. **Confidence: Medium** on preserving `line_items_list` as HTML being the best long-term shape. It is the right Slice 2 boundary because it avoids a larger provider rewrite.

### Order Summary Rules

The order-created templates must render totals as follows:

- Subtotal: always visible.
- Shipping: always visible.
- Tax: always visible, including `$0.00`.
- Discount: visible only when the discount amount is nonzero.
- Total: always visible.

The backend variable builder must stop encoding "hidden row" as an empty label/value pair for tax. It may continue to omit/hide discount when zero, but the contract must be explicit and tested.

> **Confidence: High** - This matches Imperator guidance plus the stronger UX judgment: tax is a trust line; zero discount is noise.

### Line Item Display Rules

Apparel line-item cards must show both:

- total quantity for quick scanning
- size breakdown for verification

The customer should not need to mentally add `M - 10, L - 8, XL - 4` to understand how many garments are in the order.

Non-apparel line-item cards must continue to show product-specific option rows from `metadata.options` and `metadata.options_labels`. Current non-apparel order quantity is encoded in `metadata.options.quantity`; that value must display as a first-class quantity row before arbitrary alphabetized options. If a future non-apparel product lacks that key, the implementation may fall back to the existing option key/label and avoid inventing product-specific rules.

Off-list apparel sizes must not sort before normal sizes. Unknown sizes should sort after known sizes while preserving deterministic order among unknowns.

> **Confidence: High** on apparel total + size breakdown from Imperator guidance. **Confidence: Medium** on non-apparel quantity treatment because current metadata is product-specific and still lacks a unified quantity semantic.

### Template Contract Gaps

Slice 2 must reconcile these variable-contract gaps:

- `custom-order-proof-ready` sends `proof_url`; `PROOF_READY` registration must declare it.
- `custom-order-created` sends `order_url`; both order-created template registrations must declare it if the templates use it.
- All template variable contracts must be reflected in the repo-owned registry and sample payloads.

This is not just a Resend provider patch. The contract must become visible in the template source and local validation.

> **Confidence: High** - Live code shows these senders pass keys that the current registry does not list.

---

## Out of Scope

- Creating new proof-approved, proof-rejected, tracking, shipping, delivered, or in-production email events.
- Creating new catalog-vs-order proof template families for `ProofType.CATALOG`.
- Rewriting the notification provider to bypass hosted Resend templates and send `react` emails directly per event.
- Moving line-item rendering entirely from the helper into Resend template variables that require arrays or objects.
- Changing importer hierarchy, non-apparel cart pricing, or saved-product creation.
- Solving `options_order` by changing cart/pricing metadata propagation. Slice 2 may consume `options_order` if it already exists by implementation time, but it should not add upstream metadata plumbing.
- Adding a broad visual-design redesign of Divinipress emails beyond the rendering and source-control fixes above.

> **Confidence: High** - These boundaries keep this lane tight and avoid turning an email-ops migration into the entire transactional-email roadmap.

---

## User-Facing Outcomes

After Slice 2:

- A developer can edit transactional email templates in the backend repo and review the changes in a PR.
- A developer can preview or send a test email without touching the Resend dashboard.
- A developer can update Resend drafts from the repo and publish deliberately.
- The current order-created emails no longer contain invalid block cards inside paragraph/list wrappers.
- Orders with zero tax show `Tax: $0.00`, not blank vertical space.
- Orders with no discount do not show a useless `Discount: $0.00` row.
- Apparel line cards show total quantity and size breakdown.
- `PROOF_READY` is source-controlled and its `proof_url` contract is explicit.
- Template variables cannot drift silently between subscriber payloads, provider registry, and template source.

> **Confidence: High** - This is the requested product outcome, not an implementation strategy.

---

## Source-Control and Resend Contract

Existing production template IDs should be preserved. Slice 2 should update current templates by ID and publish new versions rather than creating new production IDs, unless implementation preflight proves Resend requires a create-new-template path for React Email conversion.

React Email `.tsx` files are the desired repo authoring format. The preferred deployment path is: upgrade or add current Resend/React Email tooling, prove a repo-owned command can update existing drafts by ID from that source, then standardize on that command. The verified candidates are a pinned `resend-cli` update path with `--react-email` or repo rendering to static HTML/text followed by SDK update with `html` and `text`. If one candidate fails, the other should be tried before escalating for a decision.

If a create-new path is required, the implementation must:

1. create draft templates with stable aliases,
2. update the repo registry and provider template IDs in the same PR,
3. send repo-rendered test emails from the new template source before publishing,
4. keep rollback instructions to restore the previous IDs.

Publishing must be explicit and auditable. A draft push may happen during implementation; a production publish is a release action.

> **Confidence: Medium** - Resend supports draft/publish and template update by ID. Current CLI and SDK surfaces differ, so implementation preflight must choose and prove the command path before coding the scripts.

---

## Validation Requirements

The implementation is not complete unless all of the following are true:

- Repo template validation passes for all three templates.
- Sample render output exists for:
  - order received with apparel items and zero tax/zero discount
  - order received with non-apparel items
  - order confirmed proofed
  - proof ready
- Variable-contract validation proves sender payload keys, provider registry keys, and template source variables are synchronized.
- A rendered test-send command sends repo-rendered HTML/text for at least one order-created template and one proof-ready template to a controlled inbox, and fails if Resend does not return a concrete email id.
- A hosted smoke-send command sends at least one published hosted template to a controlled inbox, and the command makes clear that this proves the published version, not an unpublished draft.
- A draft-update command updates Resend without publishing and fails on SDK/API errors instead of swallowing them.
- A publish command exists but requires explicit invocation.
- Visual inspection confirms the line-item card region is block-valid and does not render as one bullet containing many cards.
- Tax/discount rendering matches the locked rule.
- Apparel validation confirms total quantity, size breakdown, and unknown sizes sorting after known sizes.
- Non-apparel validation confirms `metadata.options.quantity` renders as the first option row when present, with remaining options sorted after it.
- Template rendering validation includes special characters in non-line-item variables, including `&`, `<`, `>`, quotes, and apostrophes, and proves they do not become raw HTML.
- Line-item sanitization validation includes malicious product titles and option labels/values in `line_items_list`, and proves the only raw HTML emitted is the helper's own card markup.
- Provider validation confirms the live Medusa Resend provider path cannot silently return `{}` for missing templates, invalid variables, or Resend API failures in production email paths. The exact error/return behavior belongs in the plan, but silent drop is not acceptable for this slice.
- The plan states the exact Node 22/Yarn 4.9.2 activation command for this worktree; `yarn build` and focused unit tests must pass under that environment.

Integration tests are not required for the Resend send path unless the implementation adds a test-safe notification provider. Slice 1 already established that current test config does not load Resend or `notification-local` in `NODE_ENV=test`, and the Imperator rejected changing runtime notification config merely to make tests easier.

> **Confidence: High** - This keeps proof tied to actual risks without reopening the rejected integration-test path.

---

## Implementation Plan Inputs

The plan should determine exact file paths and command names, but it should respect these constraints:

- Use the Medusa backend rules for provider/subscriber changes.
- Do not put non-subscriber `.ts` files anywhere under `src/subscribers/`, including tests, sample payloads, render helpers, and shared utilities. Medusa scans subscriber resource paths recursively by file shape, not by intent.
- Keep template tooling outside runtime subscriber loading paths.
- Upgrade or add current Resend/React Email tooling if needed; do not preserve stale `resend@6.4.1` constraints for their own sake.
- Prefer repo-owned package scripts over global installs. The scripts may wrap a pinned `resend-cli` dependency or SDK plus `@react-email/render`, whichever preflight proves cleaner.
- Keep publish separate from draft update.
- Add focused tests around registry/template contract synchronization.
- Add focused render tests for worst-case line-item HTML length, line-item sanitization, apparel quantity display, non-apparel Quantity-first display, and escaped non-line-item variables.
- Use sample payloads rather than live production data for local renders.
- Preserve existing behavior for `PROOF_READY` except for source ownership and the `proof_url` contract.

> **Confidence: High** - These constraints are directly derived from Slice 1 failures and current repo architecture.

---

## Risks

### Resend React Template Semantics

Resend supports React Email through current tooling, but the CLI and SDK surfaces are not identical. The implementation must prove the chosen command's type and runtime behavior before using it for template update. If CLI React update cannot preserve the required hosted-template variable placeholders cleanly, the fallback is to render React Email to static HTML/text in repo tooling, then update the Resend template with that HTML/text through the SDK.

This fallback still satisfies the core goal: repo source owns the template and the dashboard is not the editing surface.

### Hosted Template Variable Shape

Hosted Resend variables are string/number oriented. Do not depend on arrays or objects for line items in this slice. Keep `line_items_list` as a pre-rendered sanitized HTML string unless the implementation proves a supported structured alternative without rewriting the notification provider.

Resend also caps string variable values at 2,000 characters. If realistic line-item card HTML exceeds that cap, the implementation must move the full line-item markup into repo-rendered HTML rather than forcing large HTML through a hosted-template variable.

### Cross-Client Rendering

React Email improves email-client compatibility but does not remove the need for real inspection. Outlook desktop, Gmail, and Apple Mail must be checked for the order-created templates before publish.

### Repository State

The Consilium docs repo is currently ahead and behind `origin/main` with unrelated untracked case files. This spec can be created safely, but committing/pushing docs should be handled deliberately so unrelated case work is not swept into the commit.

> **Confidence: High** on the risks. They are exactly where the previous slice was bitten: external template behavior, variable shape assumptions, and repo hygiene.

---

## Confidence Map

| Section | Confidence | Reason |
|-|-|-|
| Why | High | Directly follows Slice 1 findings and Imperator direction. |
| Decisions Locked | High | Imperator approved `PROOF_READY` inclusion and repo-first email operations. |
| External facts | Medium | Verified against current Resend docs, but must be rechecked before implementation. |
| In scope | High | Maps to the case-file Slice 2 inputs and latest decision. |
| Out of scope | High | Keeps the lane from expanding into the full transactional-email roadmap. |
| User-facing outcomes | High | Observable outcomes are clear and testable. |
| Resend contract | Medium | Existing IDs should be updateable, but the selected CLI or render-to-HTML update path must be proven. |
| Validation | High | Focused on the exact risks and respects prior test-environment decision. |
| Risks | High | Known uncertain areas are named rather than hidden. |

---

## Approval Gate

If the Imperator approves this spec, the next artifact is `session-02-email-templates-as-code-plan.md`.

The plan must not reopen settled decisions unless implementation preflight proves a factual blocker:

- `PROOF_READY` is included.
- Tax always shows, including `$0.00`.
- Zero discount hides.
- Repo-owned email commands are primary.
- Stale local SDK constraints are not preserved if an upgrade gives the cleaner path.
- Dashboard editing is no longer the normal workflow.
