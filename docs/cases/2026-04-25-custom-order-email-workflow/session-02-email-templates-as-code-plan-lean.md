# Email Templates as Code Lean Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three custom-order emails editable, renderable, previewable, and test-sendable from the backend repo while fixing the current order-email rendering defects.

**Architecture:** Use React Email source in the backend repo and render the three custom-order emails to HTML/text before sending through Resend. Keep the existing Resend provider boundary, but make these three templates repo-rendered at runtime so order emails do not depend on Resend hosted-variable limits for `line_items_list`. Resend template IDs stay in the registry for optional draft mirroring and future rollback, not as the primary runtime dependency for these three emails.

**Tech Stack:** Node 22, Yarn 4.9.2, Medusa 2.13.1, TypeScript, Jest/SWC, React Email, Resend SDK.

**Spec:** `/Users/milovan/projects/Consilium/docs/cases/2026-04-25-custom-order-email-workflow/session-02-email-templates-as-code-spec.md`

**Repo:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`

---

## Lean Scope

Build only the practical MVP:

- Repo-owned template source for `ORDER_RECEIVED_CUSTOM`, `ORDER_CONFIRMED_PROOFED`, and `PROOF_READY`.
- Runtime rendered delivery for those three templates using Resend `html` and `text`.
- Local scripts to validate, render, preview, send a rendered test email, push an optional Resend draft, and publish only by explicit command.
- Current email correctness fixes: tax `$0.00`, zero discount hidden, apparel quantity total, unknown sizes after known sizes, non-apparel Quantity first.
- No Resend dashboard authoring as the normal path.

Do not build a full Resend reconciliation system, hosted-template smoke maze, metadata diff engine, or broad transactional-email framework in this slice.

## Assumptions

- The branch is already updated from `origin/import-script-promo-print`.
- `AGENTS.md` is untracked in the backend worktree and must not be staged.
- No production publish happens during implementation. Draft push and test-send are allowed only when the required env vars are present.
- API-backed commands require `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `EMAIL_TEST_TO`; if any are missing, skip only those commands and complete local validation/build.
- Every backend-code task invokes `building-with-medusa` before editing.

---

### Task 0: Runtime, Dependencies, and Secret Logging
> **Confidence: High** - implements the spec decision to use current Resend tooling, and fixes live repo evidence that `medusa-config.ts` currently prints `RESEND_API_KEY`.

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `medusa-config.ts`

- [ ] Activate runtime:

```bash
source ~/.nvm/nvm.sh && nvm use 22
node -v
yarn --version
```

Expected: Node 22.x and Yarn 4.9.2.

- [ ] Add the minimum email tooling:

```bash
yarn add resend@^6.12.2 @react-email/components@^1.0.12 @react-email/render@^2.0.8 react@^18.2.0 react-dom@^18.2.0
yarn add -D tsx@^4.21.0
```

- [ ] Add scripts:

```json
{
  "email:validate": "tsx src/scripts/email-templates.ts validate",
  "email:render": "tsx src/scripts/email-templates.ts render",
  "email:preview": "tsx src/scripts/email-templates.ts preview",
  "email:send": "tsx src/scripts/email-templates.ts send",
  "email:push-draft": "tsx src/scripts/email-templates.ts push-draft",
  "email:publish": "tsx src/scripts/email-templates.ts publish"
}
```

- [ ] Remove the debug logging from `medusa-config.ts`:

```typescript
console.log({
  isTest,
  isDevelopment,
  resendApiKey: process.env.RESEND_API_KEY,
});
console.dir(medusaConfig, { depth: null });
```

- [ ] Add `from_email: process.env.RESEND_FROM_EMAIL` to the Resend provider options in `medusa-config.ts`.

- [ ] Verify:

```bash
jq '.scripts | with_entries(select(.key | startswith("email:")))' package.json
rg 'console\\.dir\\(medusaConfig|resendApiKey' medusa-config.ts
```

Expected: the email scripts exist, and the `rg` command finds no secret-printing code.

---

### Task 1: Move Email Variable Builders Out of Subscribers
> **Confidence: High** - live repo currently keeps `buildOrderEmailVariables` and its test under `src/subscribers`; the spec forbids non-subscriber `.ts` files under subscriber scan paths.

**Files:**
- Create: `src/modules/resend/utils/build-order-email-variables.ts`
- Create: `src/modules/resend/utils/build-proof-ready-email-variables.ts`
- Create: `src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts`
- Create: `src/modules/resend/utils/__tests__/build-proof-ready-email-variables.unit.spec.ts`
- Modify: `src/subscribers/custom-order-created.ts`
- Modify: `src/subscribers/custom-order-proof-ready.ts`
- Delete: `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

- [ ] Move `buildOrderEmailVariables` and its helper types/functions from `custom-order-created.ts` into `src/modules/resend/utils/build-order-email-variables.ts`.

- [ ] Move the existing test from `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts` to `src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts`.

- [ ] Update the order variable behavior:

```typescript
tax: `$${taxNum.toFixed(2)}`,
tax_description: "Tax",
discount: discountNum !== 0 ? `$${discountNum.toFixed(2)}` : "",
discount_description: discountNum !== 0 ? "Discount" : "",
```

- [ ] Create `buildProofReadyEmailVariables` with these required keys: `current_year`, `customer_name`, `order_id`, `product_title`, `proof_url`, `sub_order_id`.

- [ ] Use `"Custom product"` when `customOrder.product_name` is empty or null.

- [ ] Update both subscribers to import the builders and keep only event/query/send logic in the subscriber files.

- [ ] Verify:

```bash
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts src/modules/resend/utils/__tests__/build-proof-ready-email-variables.unit.spec.ts
unexpected="$(rg --files src/subscribers -g '*.ts' | rg -v '^src/subscribers/(custom-order-created|custom-order-proof-ready|password-reset|user-invited)\\.ts$' || true)"; [ -z "$unexpected" ] || { echo "$unexpected"; exit 1; }
```

Expected: tests pass, and no helper/test `.ts` files remain under `src/subscribers`.

---

### Task 2: Fix Line Item Card Rules
> **Confidence: High** - live helper already centralizes line-item rendering, but it lacks apparel total quantity, sorts unknown sizes before known sizes, and alphabetizes non-apparel Quantity instead of pinning it first.

**Files:**
- Modify: `src/modules/resend/utils/format-email-line-item.ts`
- Modify: `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`

- [ ] Add tests for apparel total quantity:

Expected fields:

```typescript
[
  { label: "Color", value: "Black" },
  { label: "Quantity", value: "22" },
  { label: "Sizes", value: "M - 10, L - 8, Youth XL - 4" },
]
```

- [ ] Add a test proving an unknown size sorts after known sizes.

- [ ] Add a test proving non-apparel `metadata.options.quantity` renders first, with remaining option rows sorted by key after it.

- [ ] Implement the smallest helper changes:

```typescript
const sizeIndex = SIZE_ORDER.indexOf(size);
return sizeIndex === -1 ? Number.MAX_SAFE_INTEGER : sizeIndex;
```

Add a `Quantity` field for apparel using the sum of item quantities. For non-apparel, pull the `quantity` option first when present, then sort all remaining non-empty options by key.

- [ ] Verify:

```bash
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts
```

Expected: PASS.

---

### Task 3: Add Template Source, Registry, and Email CLI
> **Confidence: Medium** - the repo/source direction is settled, but exact file boundaries are implementation choices. This plan chooses module-local source to keep runtime imports simple and outside `src/subscribers`.

**Files:**
- Create: `src/modules/resend/templates.ts`
- Create: `src/modules/resend/email/template-registry.ts`
- Create: `src/modules/resend/email/render-template.tsx`
- Create: `src/modules/resend/email/samples.ts`
- Create: `src/modules/resend/email/templates/order-received-custom.tsx`
- Create: `src/modules/resend/email/templates/order-confirmed-proofed.tsx`
- Create: `src/modules/resend/email/templates/proof-ready.tsx`
- Create: `src/modules/resend/email/templates/layout.tsx`
- Create: `src/scripts/email-templates.ts`
- Modify: `src/modules/resend/index.ts`
- Modify: `src/modules/resend/service.ts`
- Modify: `jest.config.js`

- [ ] Move the `Templates` enum from `service.ts` into `src/modules/resend/templates.ts`; export it from `index.ts`.

- [ ] Create a typed registry for all current templates. The three custom-order templates must include:

| Template | ID | Alias | Delivery |
|-|-|-|-|
| `ORDER_RECEIVED_CUSTOM` | `ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf` | `order_received_custom_v2` | `rendered` |
| `ORDER_CONFIRMED_PROOFED` | `75866903-26c8-4881-9a0c-8b33219e7614` | `order_confirmed_proofed_v2` | `rendered` |
| `PROOF_READY` | `0031e303-c209-4768-a21f-5b59e2959edb` | `proof_ready_v1` | `rendered` |

- [ ] Keep invite, onboarding, and password reset as `hosted` entries so this slice does not rewrite unrelated emails.

- [ ] Add registry variable lists for the three custom-order templates. Include `order_url` on both order templates and `proof_url` on `PROOF_READY`.

- [ ] Write React Email templates for the three custom-order templates. Keep copy simple and close to current behavior. Use raw HTML only for `line_items_list`; all other values render through normal React escaping.

- [ ] Write `renderTemplate(template, data)` that returns `{ subject, html, text }` using `@react-email/render`.

- [ ] Write samples for: order received apparel zero tax/discount, order received non-apparel, order confirmed proofed, and proof ready.

- [ ] Write `src/scripts/email-templates.ts` commands:
  - `validate`: render every sample and fail on missing/extra variables for source-owned templates.
  - `render`: write HTML/text files under `.email-rendered/`.
  - `preview`: run `render`, write `.email-rendered/index.html`, and print the absolute preview path.
  - `send`: send a rendered sample to `EMAIL_TEST_TO` using `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
  - `push-draft`: update the matching Resend template draft by ID with placeholder values, not customer sample values.
  - `publish`: publish by template key only when explicitly invoked.

- [ ] Add `tsx`/`jsx` to `jest.config.js` module extensions if the new tests or imports need TSX resolution.

- [ ] Verify:

```bash
yarn email:validate
yarn email:render
yarn email:preview
test -f .email-rendered/index.html
```

Expected: commands pass and print an absolute preview path.

---

### Task 4: Wire Rendered Delivery Into the Resend Provider
> **Confidence: High** - the existing Medusa notification provider is the correct boundary. The change is to render repo-owned custom-order templates before calling Resend instead of sending hosted variables for those three templates.

**Files:**
- Modify: `src/modules/resend/service.ts`
- Modify: `src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts`
- Create: `src/modules/resend/utils/__tests__/resend-rendered-delivery.unit.spec.ts`

- [ ] Extend provider options:

```typescript
type ResendOptions = {
  api_key: string;
  from_email?: string;
};
```

- [ ] Replace the private inline `templates` object with the registry from Task 3.

- [ ] Update `validateTemplateVariables` to use the registry and enforce required keys for all templates.

- [ ] In `send`, branch by delivery type:
  - `hosted`: preserve the existing `template: { id, variables }` send path for invite, onboarding, and password reset.
  - `rendered`: render `{ subject, html, text }`, require `from_email`, and call `resendClient.emails.send({ from, to, subject, html, text })`.

- [ ] Stop silently returning `{}` on missing template, invalid variables, missing `from_email` for rendered templates, or Resend send failure. Throw an error with a clear message so failed transactional email is visible.

- [ ] Tests must cover:
  - order templates accept `order_url`.
  - `PROOF_READY` accepts `proof_url`.
  - rendered templates call Resend with `from`, `subject`, `html`, and `text`.
  - missing rendered `from_email` throws.
  - invalid variables throw or fail validation instead of silently returning `{}`.

- [ ] Verify:

```bash
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts src/modules/resend/utils/__tests__/resend-rendered-delivery.unit.spec.ts
```

Expected: PASS.

---

### Task 5: Final Verification
> **Confidence: High** - these checks prove the slice without reopening the overgrown hosted-template hardening plan.

**Files:**
- No new files unless a previous task requires a focused test update.

- [ ] Run focused unit tests:

```bash
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts src/modules/resend/utils/__tests__/build-proof-ready-email-variables.unit.spec.ts src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts src/modules/resend/utils/__tests__/resend-rendered-delivery.unit.spec.ts
```

- [ ] Run email local checks:

```bash
yarn email:validate
yarn email:render
yarn email:preview
```

- [ ] Run build:

```bash
yarn build
```

- [ ] If `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `EMAIL_TEST_TO` are present, run one rendered send for an order template and one rendered send for `PROOF_READY`:

```bash
yarn email:send --template order_received_custom --sample order_received_non_apparel
yarn email:send --template proof_ready --sample proof_ready
```

Expected: each command prints a concrete Resend email id. If env vars are missing, record that API-backed sends were skipped.

- [ ] Do not run `email:publish` during implementation. Publishing is a separate release action.

---

## Legion Handoff

This lean plan is good enough to Legion. Dispatch it as one backend lane or split only if the workers have disjoint files:

- Worker A: Tasks 1-2, utilities and tests.
- Worker B: Task 3, email source and CLI.
- Worker C: Task 4, provider wiring and provider tests.

Task 0 should be done first by the lead session. Task 5 is the final integration gate.

The older `session-02-email-templates-as-code-plan.md` is research context, not marching orders.
