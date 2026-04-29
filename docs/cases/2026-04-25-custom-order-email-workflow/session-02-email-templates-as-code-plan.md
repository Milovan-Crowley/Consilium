# Email Templates as Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the three active custom-order Resend templates into backend-owned source, add repeatable render/test/update operations, and close the remaining Slice 2 email contract gaps.

**Architecture:** Keep delivery inside the existing Medusa Resend provider, but move template metadata into a typed registry and template source into a top-level `email/` workspace outside Medusa subscriber scan paths. The two order-created templates use repo-rendered runtime delivery (`html`/`text`) so the full line-item card markup is part of the email body and no longer depends on Resend's 2,000-character hosted-variable cap. `PROOF_READY` stays on hosted-template delivery because its payload is small and already maps cleanly to Resend variables. Preview and rendered-test commands render with real sample values; draft-update renders the same React source with Resend variable placeholders so hosted templates are not overwritten with sample customer data.

**Tech Stack:** Node 22.22.2, Yarn 4.9.2, Medusa 2.13.1, TypeScript, Jest/SWC, React 18, React Email, Resend SDK.

**Spec:** `/Users/milovan/projects/Consilium/docs/cases/2026-04-25-custom-order-email-workflow/session-02-email-templates-as-code-spec.md`

**Repo:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-97-non-apparel-email-subscriber`

**Required Medusa skill:** Every implementation task that edits backend code must invoke `building-with-medusa` first. In Consilium/Claude Rig terms, this is the backend lane equivalent of `medusa-dev:building-with-medusa`.

**Task ordering:** Tasks 0-8 are strictly sequential. Do not parallelize implementation tasks. Task 6 depends on the registry and renderer from Tasks 3-5. Task 8 is the release-readiness gate and must run after every code task is complete.

---

## Assumptions and Hard Gates

- The branch is already updated from `origin/import-script-promo-print`; do not rebase or reset the worktree.
- `AGENTS.md` is untracked in the backend worktree; do not stage it unless the Imperator explicitly asks.
- The Consilium docs repo is dirty and ahead/behind `origin/main`; only touch this plan and its paired spec unless told otherwise.
- No production publish happens during implementation. The implementation adds the publish command, but publish itself is a release action.
- If `RESEND_API_KEY` is unavailable, implement and verify local render/validate/build tests, then stop before API-backed pull, draft-update, send-rendered, send-hosted, and publish checks.
- The order-created runtime path must not use hosted-template `line_items_list` substitution. If the worst-case `line_items_list` sample exceeds 2,000 characters, that is acceptable only because both order-created registry entries are `runtimeDelivery: "rendered"`. If either order-created entry is still `runtimeDelivery: "hosted"`, halt before draft push.
- This is the spec's explicit fallback for large line-item cards: the provider sends rendered HTML/text for the two order-created templates. It is not a broad rewrite of every email event to direct React delivery; `PROOF_READY` stays hosted.

---

### Task 0: Runtime and Dependency Preflight
> **Confidence: High** - implements [spec §2 - Use current Resend tooling](./session-02-email-templates-as-code-spec.md#decisions-locked) and [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements). Verified current package state: repo has `resend@6.4.1`, no direct React Email renderer dependency, and Node/Yarn must be activated explicitly.

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Activate the required runtime.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
node -v
yarn --version
```

Expected:

```text
v22.22.2
4.9.2
```

- [ ] **Step 2: Confirm the current Resend SDK supports template HTML/text update but not React update.**

Run:

```bash
sed -n '1160,1210p' node_modules/resend/dist/index.d.ts
```

Expected:

```text
interface UpdateTemplateOptions extends Partial<Pick<Template, 'name' | 'subject' | 'html' | 'text' | 'from' | 'alias'>> {
    variables?: TemplateVariableUpdateOptions[];
    replyTo?: string[] | string;
}
```

If `react` appears in `UpdateTemplateOptions`, still use the render-to-HTML path in this plan unless the implementation proves it also updates text output. This plan deliberately owns both HTML and text on draft update.

- [ ] **Step 3: Add current repo-owned email tooling.**

Run:

```bash
yarn add resend@^6.12.2 @react-email/components@^1.0.12 @react-email/render@^2.0.8 react@^18.2.0 react-dom@^18.2.0
yarn add -D tsx@^4.21.0
```

Expected: `package.json` lists `resend`, `@react-email/components`, `@react-email/render`, `react`, and `react-dom` under `dependencies`, because rendered order emails run in the production provider path. `tsx` remains a dev dependency for local CLI execution.

- [ ] **Step 4: Recheck the upgraded SDK type surface.**

Run:

```bash
sed -n '1160,1210p' node_modules/resend/dist/index.d.ts
```

Expected: template update still accepts `html`, `text`, and a `variables` array. If the upgraded SDK now exposes `react` on update, keep this plan's render-to-HTML/text path unless the SDK also proves text output ownership.

- [ ] **Step 5: Add package scripts for the email workflow.**

Edit `package.json` scripts to add:

```json
{
  "email:render": "tsx email/cli.ts render",
  "email:preview": "tsx email/cli.ts preview",
  "email:validate": "tsx email/cli.ts validate",
  "email:send-rendered": "tsx email/cli.ts send-rendered",
  "email:send-hosted": "tsx email/cli.ts send-hosted",
  "email:pull": "tsx email/cli.ts pull",
  "email:diff": "tsx email/cli.ts diff",
  "email:push-draft": "tsx email/cli.ts push-draft",
  "email:publish": "tsx email/cli.ts publish"
}
```

Also extend the existing `format` script to include `email/**/*.{ts,tsx,js,jsx,json,html}`. Do not include generated `.txt` output in the Prettier glob.

- [ ] **Step 6: Verify package metadata.**

Run:

```bash
jq '.scripts | with_entries(select(.key | startswith("email:")))' package.json
jq '.dependencies.resend, .dependencies["@react-email/render"], .dependencies["@react-email/components"], .dependencies.react, .dependencies["react-dom"], .devDependencies.tsx' package.json
```

Expected: all nine `email:*` scripts print, and all dependency values print non-null strings.

---

### Task 1: Move Order Variable Builder Out of Subscriber Scan Path
> **Confidence: High** - implements [spec §10 - Implementation Plan Inputs](./session-02-email-templates-as-code-spec.md#implementation-plan-inputs). Verified current violation: `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts` exists under the Medusa subscriber resource path.

**Soldier prompt prefix:** Use `building-with-medusa` before editing. This task changes backend subscriber/module code.

**Files:**
- Create: `src/modules/resend/utils/build-order-email-variables.ts`
- Create: `src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts`
- Modify: `src/subscribers/custom-order-created.ts`
- Delete: `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

- [ ] **Step 1: Create the failing unit test in the safe module test path.**

Move the existing subscriber test into `src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts`, update its import to:

```typescript
import { buildOrderEmailVariables } from "../build-order-email-variables";
```

Change case 2 and case 7 expectations so zero tax is visible and zero discount stays hidden:

```typescript
expect(result.tax).toBe("$0.00");
expect(result.tax_description).toBe("Tax");
expect(result.discount).toBe("");
expect(result.discount_description).toBe("");
```

- [ ] **Step 2: Run the moved test and verify it fails before implementation.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts
```

Expected: FAIL because `src/modules/resend/utils/build-order-email-variables.ts` does not exist yet.

- [ ] **Step 3: Create the helper module.**

Move `Totalish`, `OrderForEmail`, `BuildOrderEmailVariablesInput`, `toFiniteNumber`, `formatMoney`, and `buildOrderEmailVariables` out of `src/subscribers/custom-order-created.ts` into `src/modules/resend/utils/build-order-email-variables.ts`.

The returned tax/discount fields must use this logic:

```typescript
tax: `$${taxNum.toFixed(2)}`,
tax_description: "Tax",
discount: discountNum !== 0 ? `$${discountNum.toFixed(2)}` : "",
discount_description: discountNum !== 0 ? "Discount" : "",
```

- [ ] **Step 4: Update the subscriber import and remove inline helper code.**

Add this import to `src/subscribers/custom-order-created.ts`:

```typescript
import { buildOrderEmailVariables } from "@/modules/resend/utils/build-order-email-variables";
```

Remove the now-duplicated helper types/functions from `src/subscribers/custom-order-created.ts`. Leave the subscriber's runtime behavior unchanged except for the zero-tax variable value.

- [ ] **Step 5: Remove the subscriber test file and verify no non-subscriber tests remain under subscribers.**

Run:

```bash
rm src/subscribers/__tests__/build-order-email-variables.unit.spec.ts
rg --files src/subscribers | rg '__tests__|\\.unit\\.spec\\.ts$|\\.spec\\.ts$' || true
```

Expected: no output from the final `rg` command.

- [ ] **Step 6: Verify no unexpected TypeScript files remain under subscribers.**

Run:

```bash
unexpected="$(rg --files src/subscribers -g '*.ts' | rg -v '^src/subscribers/(custom-order-created|custom-order-proof-ready|password-reset|user-invited)\\.ts$' || true)"
[ -z "$unexpected" ] || { echo "$unexpected"; exit 1; }
```

Expected: no output. If a helper, test, sample, or utility `.ts` file appears under `src/subscribers`, move it out before continuing.

- [ ] **Step 7: Run the focused unit test.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts
```

Expected: PASS.

---

### Task 2: Finish Line Item Rendering Rules
> **Confidence: High** - implements [spec §4.5 - Template Layout and Rendering](./session-02-email-templates-as-code-spec.md#template-layout-and-rendering), [spec §4.7 - Line Item Display Rules](./session-02-email-templates-as-code-spec.md#line-item-display-rules), and [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements). Verified current helper lacks apparel total quantity, sorts unknown sizes before known sizes, and alphabetizes non-apparel quantity instead of pinning it first.

**Soldier prompt prefix:** Use `building-with-medusa` before editing. This task changes backend email helper code.

**Files:**
- Modify: `src/modules/resend/utils/format-email-line-item.ts`
- Modify: `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`

- [ ] **Step 1: Add failing tests for apparel total quantity and unknown-size ordering.**

Append tests that assert this structured output for apparel items with quantities `10`, `8`, and `4`:

```typescript
expect(result.structured.fields).toEqual([
  { label: "Color", value: "Black" },
  { label: "Quantity", value: "22" },
  { label: "Sizes", value: "M - 10, L - 8, Youth XL - 4" },
]);
```

The test data must put `"Youth XL"` before `"M"` in input order to prove unknown sizes sort after known sizes.

- [ ] **Step 2: Add a failing test for non-apparel Quantity-first display.**

Use non-apparel options in this insertion order:

```typescript
options: { zeta: "Z", paper: "Glossy", quantity: "100", alpha: "A" }
```

Expected labels:

```typescript
expect(result.structured.fields.map((f) => f.label)).toEqual([
  "Quantity",
  "Alpha",
  "Paper",
  "Zeta",
]);
```

- [ ] **Step 3: Add a failing malicious-input sanitization test.**

Use malicious product and option values:

```typescript
product_name: `<img src=x onerror=alert("title")>`,
options: {
  quantity: `100<script>alert("qty")</script>`,
  "<script>alert('label')</script>": "<b>bold</b>",
}
```

Expected assertions:

```typescript
expect(result.rowHtml).not.toContain("<script>");
expect(result.rowHtml).not.toContain("<img");
expect(result.rowHtml).not.toContain("<b>bold</b>");
expect(result.rowHtml).toContain("&lt;img");
expect(result.rowHtml).toContain("&lt;b&gt;bold&lt;/b&gt;");
```

- [ ] **Step 4: Implement apparel quantity and deterministic size sorting.**

In `formatApparel`, add:

```typescript
const getSizeRank = (size: string): number => {
  const index = SIZE_ORDER.indexOf(size);
  return index === -1 ? SIZE_ORDER.length : index;
};

const totalQuantity = items.reduce(
  (sum, item) => sum + Number(item.quantity ?? 0),
  0,
);
```

Sort size quantities with:

```typescript
.sort((a, b) => {
  const rankDelta = getSizeRank(a.size) - getSizeRank(b.size);
  return rankDelta !== 0 ? rankDelta : a.size.localeCompare(b.size);
});
```

Insert the Quantity row after Color and before Sizes:

```typescript
fields.push({ label: "Quantity", value: totalQuantity.toString() });
```

- [ ] **Step 5: Implement non-apparel Quantity-first ordering.**

Replace the `Object.entries(options)` ordering in `formatNonApparel` with logic that:

1. filters empty-string values,
2. splits the `quantity` entry from the rest,
3. sorts the remaining entries by key,
4. returns `quantity` first when present.

The output label still comes from `options_labels.quantity` when provided and falls back to `Quantity`.

- [ ] **Step 6: Run focused helper tests.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts
```

Expected: PASS.

---

### Task 3: Create the Typed Template Registry and Harden Provider Failures
> **Confidence: High** - implements [spec §4.2 - Template Registry](./session-02-email-templates-as-code-spec.md#template-registry), [spec §4.8 - Template Contract Gaps](./session-02-email-templates-as-code-spec.md#template-contract-gaps), and [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements). Verified current registry is a private object in `src/modules/resend/service.ts:29-105`, misses `proof_url`, and provider `send` returns `{}` on invalid template, invalid variables, and API failure at `src/modules/resend/service.ts:157-190`.

**Soldier prompt prefix:** Use `building-with-medusa` before editing. This task changes the Medusa notification provider.

**Files:**
- Create: `src/modules/resend/template-registry.ts`
- Create: `src/modules/resend/utils/resend-template-payload.ts`
- Modify: `src/modules/resend/service.ts`
- Modify: `src/modules/resend/index.ts`
- Modify: `medusa-config.ts`
- Modify: `src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts`
- Create: `src/modules/resend/utils/__tests__/resend-provider-send.unit.spec.ts`

- [ ] **Step 1: Create the registry file.**

Move `Templates` and all existing template metadata from `service.ts` into `src/modules/resend/template-registry.ts`. The registry must preserve the existing IDs and aliases for all six current templates.

Define the registry with literal-preserving types:

```typescript
export type TemplateVariableType = "string" | "number";

export type EmailTemplateRegistryEntry = {
  name: string;
  alias: string;
  templateId: string;
  subject: string;
  from?: { env: "RESEND_FROM_EMAIL" };
  source?: string;
  runtimeDelivery?: "hosted" | "rendered";
  sampleKeys?: string[];
  publishable?: boolean;
  variables: Record<string, TemplateVariableType>;
};

export type EmailTemplateRegistry = Record<Templates, EmailTemplateRegistryEntry>;
```

Export the object as:

```typescript
export const emailTemplateRegistry = {
  // entries
} as const satisfies EmailTemplateRegistry;
```

This keeps variable `type` values as literal `"string" | "number"` for the Resend update adapter.

The three Slice 2 entries must include:

```typescript
[Templates.PROOF_READY]: {
  name: "Proof ready",
  alias: "proof_ready_v1",
  templateId: "0031e303-c209-4768-a21f-5b59e2959edb",
  subject: "Your proof is ready",
  from: { env: "RESEND_FROM_EMAIL" },
  source: "email/templates/proof-ready.tsx",
  runtimeDelivery: "hosted",
  sampleKeys: ["proof-ready", "special-characters"],
  publishable: true,
  variables: {
    sub_order_id: "string",
    customer_name: "string",
    order_id: "string",
    product_title: "string",
    proof_url: "string",
    current_year: "string",
  },
}
```

```typescript
[Templates.ORDER_CONFIRMED_PROOFED]: {
  name: "Order confirmed proofed",
  alias: "order_confirmed_proofed_v2",
  templateId: "75866903-26c8-4881-9a0c-8b33219e7614",
  subject: "Your Divinipress order is confirmed",
  from: { env: "RESEND_FROM_EMAIL" },
  source: "email/templates/order-confirmed-proofed.tsx",
  runtimeDelivery: "rendered",
  sampleKeys: ["order-confirmed-proofed", "special-characters"],
  publishable: true,
  variables: {
    order_id: "string",
    customer_name: "string",
    order_date: "string",
    order_url: "string",
    line_items_list: "string",
    subtotal: "string",
    shipping: "string",
    tax: "string",
    tax_description: "string",
    discount: "string",
    discount_description: "string",
    total: "string",
    current_year: "string",
  },
}
```

```typescript
[Templates.ORDER_RECEIVED_CUSTOM]: {
  name: "Order received custom",
  alias: "order_received_custom_v2",
  templateId: "ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf",
  subject: "We received your custom order",
  from: { env: "RESEND_FROM_EMAIL" },
  source: "email/templates/order-received-custom.tsx",
  runtimeDelivery: "rendered",
  sampleKeys: [
    "order-received-apparel-zero-tax-zero-discount",
    "order-received-non-apparel",
    "worst-case-line-items",
    "special-characters",
  ],
  publishable: true,
  variables: {
    order_id: "string",
    customer_name: "string",
    order_date: "string",
    order_url: "string",
    line_items_list: "string",
    subtotal: "string",
    shipping: "string",
    tax: "string",
    tax_description: "string",
    discount: "string",
    discount_description: "string",
    total: "string",
    current_year: "string",
  },
}
```

- [ ] **Step 2: Update service imports and exports.**

In `src/modules/resend/service.ts`, import:

```typescript
import { getEmailTemplate, Templates } from "./template-registry";
```

Delete the local enum and `templates` object. Keep `export { Templates };` from `service.ts` so existing imports from `@/modules/resend` continue to work.

Update `src/modules/resend/index.ts` to export the registry surfaces:

```typescript
export {
  emailTemplateRegistry,
  getEmailTemplate,
  Templates,
} from "./template-registry";
```

- [ ] **Step 3: Add rendered-send sender configuration.**

In `src/modules/resend/service.ts`, extend `ResendOptions`:

```typescript
type ResendOptions = {
  api_key: string;
  from_email?: string;
};
```

In `medusa-config.ts`, pass:

```typescript
from_email: process.env.RESEND_FROM_EMAIL,
```

Update `validateOptions` so `api_key` remains required and `from_email` is required when any registry entry has `runtimeDelivery: "rendered"`. The error message must name `RESEND_FROM_EMAIL`.

- [ ] **Step 4: Make `getTemplate` read the registry.**

Replace `getTemplate` with:

```typescript
getTemplate(template: Templates) {
  return getEmailTemplate(template);
}
```

- [ ] **Step 5: Make variable validation enforce declared nullability and primitive type.**

Update `validateTemplateVariables` so a declared variable fails when its value is `undefined` or `null`. For `"string"` variables, require `typeof value === "string"`. For `"number"` variables, require `typeof value === "number"`. Empty strings remain valid because zero discount intentionally uses empty strings to hide the row.

The core check should follow this shape:

```typescript
return Object.entries(templateData.variables).every(([key, type]) => {
  const value = variables?.[key];
  if (value === undefined || value === null) {
    return false;
  }

  return typeof value === type;
});
```

- [ ] **Step 6: Make production email failures loud.**

In `send`, replace each `return {}` failure with a thrown `MedusaError`:

```typescript
throw new MedusaError(
  MedusaError.Types.INVALID_DATA,
  `Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates).join(", ")}`,
);
```

```typescript
throw new MedusaError(
  MedusaError.Types.INVALID_DATA,
  `Invalid variables for ${notification.template}. The valid variables are ${Object.keys(templateData.variables).join(", ")}`,
);
```

```typescript
throw new MedusaError(
  MedusaError.Types.UNEXPECTED_STATE,
  error?.message ?? "Failed to send email: unknown Resend error",
);
```

Keep `return { id: data.id };` for successful sends.

- [ ] **Step 7: Add provider send tests.**

Create tests that instantiate the service with a fake `resendClient` and assert:

- invalid template throws `MedusaError`,
- missing required variable throws `MedusaError`,
- Resend `{ error }` throws `MedusaError`,
- Resend `{ data: { id: "email_123" } }` returns `{ id: "email_123" }`.

The test may set `service["resendClient"]` after construction. Do not make network calls.

- [ ] **Step 8: Update validation tests for new variables and null rejection.**

Add `order_url` to order-created variable test payloads and `proof_url` to proof-ready variable test payloads.

Add a validation test proving a declared string variable with `null` returns `false`.

Update the existing numeric-zero validation test: because every current registry variable is declared as `"string"`, `tax: 0` and `discount: 0` must now return `false`. Empty strings remain the supported zero-value representation for hidden optional rows.

- [ ] **Step 9: Normalize nullable proof-ready product names.**

Modify `src/subscribers/custom-order-proof-ready.ts` so the notification payload never sends `null` for `product_title`:

```typescript
product_title: customOrder.product_name ?? "Custom product",
```

Add a provider/contract test that proves `PROOF_READY` rejects `product_title: null` and accepts the subscriber fallback string.

- [ ] **Step 10: Create the Resend template payload adapter.**

Create `src/modules/resend/utils/resend-template-payload.ts`:

```typescript
import { emailTemplateRegistry, Templates } from "../template-registry";

export function toResendTemplateVariables(template: Templates) {
  return Object.entries(emailTemplateRegistry[template].variables).map(
    ([key, type]) => ({ key, type }),
  );
}
```

This adapter is the only shape passed to `resend.templates.update(..., { variables })`. The registry remains an object map for local contract checks; Resend receives an array.

- [ ] **Step 11: Run focused provider tests.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts src/modules/resend/utils/__tests__/resend-provider-send.unit.spec.ts
```

Expected: PASS.

---

### Task 4: Add React Email Template Source and Sample Payloads
> **Confidence: Medium** - implements [spec §4.1 - Template Source Ownership](./session-02-email-templates-as-code-spec.md#template-source-ownership), [spec §4.3 - Developer Operations](./session-02-email-templates-as-code-spec.md#developer-operations), and [spec §4.5 - Template Layout and Rendering](./session-02-email-templates-as-code-spec.md#template-layout-and-rendering). Confidence is Medium because exact visual copy from current Resend templates must be pulled or manually reconciled through the new script once `RESEND_API_KEY` is available.

**Files:**
- Create: `email/templates/components/base-email.tsx`
- Create: `email/templates/order-received-custom.tsx`
- Create: `email/templates/order-confirmed-proofed.tsx`
- Create: `email/templates/proof-ready.tsx`
- Create: `email/templates/index.ts`
- Create: `email/templates/types.ts`
- Create: `email/samples/order-received-apparel-zero-tax-zero-discount.ts`
- Create: `email/samples/order-received-non-apparel.ts`
- Create: `email/samples/order-confirmed-proofed.ts`
- Create: `email/samples/proof-ready.ts`
- Create: `email/samples/worst-case-line-items.ts`
- Create: `email/samples/special-characters.ts`
- Create: `email/samples/index.ts`
- Create: `email/placeholder-variables.ts`

- [ ] **Step 1: Pull current Resend templates when credentials are available.**

If `RESEND_API_KEY` is set, pull the current three templates before writing copy:

```bash
source ~/.nvm/nvm.sh && nvm use 22
mkdir -p email/.resend-current
RESEND_API_KEY="$RESEND_API_KEY" npx -y resend-cli@2.2.1 templates get ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf --json > email/.resend-current/order_received_custom.json || true
RESEND_API_KEY="$RESEND_API_KEY" npx -y resend-cli@2.2.1 templates get 75866903-26c8-4881-9a0c-8b33219e7614 --json > email/.resend-current/order_confirmed_proofed.json || true
RESEND_API_KEY="$RESEND_API_KEY" npx -y resend-cli@2.2.1 templates get 0031e303-c209-4768-a21f-5b59e2959edb --json > email/.resend-current/proof_ready.json || true
```

If pull succeeds, use `email/.resend-current/` as copy/layout reference while authoring the TSX templates. If `RESEND_API_KEY` is unavailable, proceed from the spec and samples, but mark current-template visual reconciliation as a release check in the PR notes. Do not claim exact copy parity without a successful pull. The generated `.resend-current` directory is ignored by Task 5.

- [ ] **Step 2: Create shared template variable types.**

Create `email/templates/types.ts`:

```typescript
import { emailTemplateRegistry, Templates } from "@/modules/resend/template-registry";

export type TemplateVariables<T extends Templates> = {
  [K in keyof (typeof emailTemplateRegistry)[T]["variables"]]: string;
};
```

Every template component must accept `variables: TemplateVariables<typeof Templates.ORDER_RECEIVED_CUSTOM>` or the matching template key. Do not type template props as loose `Record<string, string>`.

- [ ] **Step 3: Create the shared base email component.**

Use React Email primitives from `@react-email/components`. The base component must render a white content body, header text "Divinipress", a footer with `current_year`, and a constrained content width. Keep it simple; this is transactional email, not a marketing page.

- [ ] **Step 4: Create order template components with a block-safe line-item region.**

Both order templates must render the summary rows in this order:

```text
Subtotal
Shipping
Tax
Discount only when discount is not empty
Total
```

The line-item area must be a block container:

```tsx
<Section dangerouslySetInnerHTML={{ __html: variables.line_items_list }} />
```

There must be no `<ul>`, `<li>`, or `<p>` wrapping the line-item card region.

- [ ] **Step 5: Create the proof-ready template component.**

Preserve current proof-ready behavior: customer name, order id, sub-order id, product title, proof URL CTA, and current year. Do not add new proof lifecycle copy in this slice.

- [ ] **Step 6: Create sample payloads.**

Samples must cover:

- order received with apparel items and zero tax/zero discount,
- order received with non-apparel items,
- order confirmed proofed,
- proof ready,
- worst-case line items with at least five sub-order cards and mixed apparel/non-apparel options. Each non-apparel card must include at least four options, labels of at least 12 characters, and values of at least 20 characters so the 2,000-character cap test is not a toy sample,
- special characters in non-line-item variables: `&`, `<`, `>`, quotes, and apostrophes.

The order-created samples must reuse `buildOrderEmailVariables` and `formatEmailLineItemCard` so sample output exercises the same backend helpers as the subscriber.

- [ ] **Step 7: Create template index maps.**

`email/templates/index.ts` must export a map from the three publishable `Templates` keys to their React components. `email/samples/index.ts` must export sample names and payloads keyed by template.

- [ ] **Step 8: Create hosted-template placeholder variables.**

Create `email/placeholder-variables.ts` with a function:

```typescript
export function createHostedTemplateVariables(
  template: Templates,
): Record<string, string>;
```

For each declared variable in the registry, return a Resend placeholder string matching the variable key, such as `{{{customer_name}}}`. The `line_items_list` placeholder must also be `{{{line_items_list}}}` because the template inserts it into the block-safe raw HTML region. These placeholder values are used only for `push-draft` and current-template diffing; rendered previews and rendered test sends use real sample payloads.

- [ ] **Step 9: Run TypeScript import smoke through tsx.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn tsx -e 'import("./email/templates/index.ts").then(() => import("./email/samples/index.ts")).then(() => import("./email/placeholder-variables.ts")).then(() => console.log("email imports ok"))'
```

Expected:

```text
email imports ok
```

---

### Task 5: Implement Render, Validate, Diff, and Resend Operations CLI
> **Confidence: Medium** - implements [spec §4.3 - Developer Operations](./session-02-email-templates-as-code-spec.md#developer-operations) and [spec §5 - Source-Control and Resend Contract](./session-02-email-templates-as-code-spec.md#source-control-and-resend-contract). Confidence is Medium because API-backed commands need a live `RESEND_API_KEY` and must fail clearly when it is absent.

**Files:**
- Create: `email/render.ts`
- Create: `email/resend-client.ts`
- Create: `email/cli.ts`
- Create: `email/__tests__/email-rendering.unit.spec.ts`
- Modify: `.gitignore`
- Modify: `jest.config.js`

- [ ] **Step 1: Update Jest to transform TSX and include email unit tests.**

Change the transform key to:

```javascript
"^.+\\.[jt]sx?$": [
```

Set SWC parser options to:

```javascript
parser: { syntax: "typescript", decorators: true, tsx: true },
```

When `TEST_TYPE === "unit"`, set `testMatch` to:

```javascript
[
  "**/src/**/__tests__/**/*.unit.spec.[jt]s",
  "**/email/**/__tests__/**/*.unit.spec.[jt]s",
]
```

Update `moduleFileExtensions` to:

```javascript
["js", "jsx", "ts", "tsx", "json"]
```

- [ ] **Step 2: Implement `email/render.ts`.**

Export functions:

```typescript
export async function renderEmailTemplate(args: {
  template: Templates;
  variables: Record<string, string>;
}): Promise<{ html: string; text: string; subject: string }>;

export async function renderEmailSample(args: {
  template: Templates;
  sample: string;
}): Promise<{ html: string; text: string; subject: string }>;

export async function renderHostedDraft(args: {
  template: Templates;
}): Promise<{ html: string; text: string; subject: string }>;

export async function renderAllSamples(): Promise<
  Array<{ template: Templates; sample: string; html: string; text: string }>
>;
```

Use `@react-email/render`'s async `render(node)` for HTML and `render(node, { plainText: true })` for plain text. The text output must not be empty. `renderHostedDraft` must call `createHostedTemplateVariables(template)` and must never use one of the sample payloads.

- [ ] **Step 3: Implement `email/resend-client.ts`.**

Export:

```typescript
export function getResendClient(): Resend;
export function requireEnv(name: string): string;
export function resolveFromAddress(explicitFrom?: string): string;
```

`requireEnv` must throw a normal `Error` with message `Missing required environment variable: ${name}` and must never print secret values.

`resolveFromAddress` must return `explicitFrom` when provided, otherwise `RESEND_FROM_EMAIL`. If neither exists, it must throw `Missing required environment variable: RESEND_FROM_EMAIL`.

- [ ] **Step 4: Implement `email/cli.ts` command dispatch.**

Support these commands:

```text
render --template order_received_custom --sample order-received-non-apparel
preview --template order_received_custom --sample order-received-non-apparel
validate
send-rendered --template order_received_custom --sample order-received-non-apparel --to dev@example.com --from "Divinipress <orders@example.com>"
send-hosted --template proof_ready --sample proof-ready --to dev@example.com
pull --template proof_ready
diff --template order_confirmed_proofed
push-draft --template proof_ready
publish --template proof_ready --confirm proof_ready_v1
```

The command parser may be a small local parser over `process.argv`; do not add a CLI framework.

- [ ] **Step 5: Implement output paths.**

`render` and `preview` must write:

```text
email/.generated/order_received_custom/order-received-non-apparel.html
email/.generated/order_received_custom/order-received-non-apparel.txt
```

For other registry/sample pairs, use the same directory shape with the registry key as the middle directory and the sample key as the filename.

`pull` must write:

```text
email/.resend-current/proof_ready.json
email/.resend-current/proof_ready.html
email/.resend-current/proof_ready.txt
```

For other registry entries, use the registry key as the filename stem.

Generated directories must be gitignored.

Add these entries to `.gitignore`:

```gitignore
email/.generated/
email/.resend-current/
```

- [ ] **Step 6: Implement API-backed commands.**

`send-rendered` must call `resend.emails.send` with `from`, `subject`, repo-rendered `html`, and repo-rendered `text`. It accepts `--from`; when omitted it uses `RESEND_FROM_EMAIL`. It must fail if the response does not include a concrete email id.

`send-hosted` must call `resend.emails.send` with `template.templateId` from the registry and the selected sample variables, and must print that it proves the published hosted template, not the current draft.

`diff` must compare the current Resend template against registry metadata and `renderHostedDraft({ template })`, not against a sample render. The diff must cover `name`, `alias`, `subject`, `from` when present remotely, `replyTo` when present remotely, variable declarations, HTML, and text. It must print metadata differences separately from HTML/text differences.

`push-draft` must call `renderHostedDraft({ template })`, then call `resend.templates.update(templateData.templateId, { name: templateData.name, alias: templateData.alias, subject: templateData.subject, html, text, variables: toResendTemplateVariables(template) })`. It must update both `html` and `text`; do not use a command path that updates HTML only. It must never render with sample customer/order values. Do not pass the registry variable object map directly to Resend.

`publish` must require a `--confirm` value such as `proof_ready_v1` and refuse to run unless the value exactly matches the registry alias.

- [ ] **Step 7: Add render validation tests.**

Tests must assert:

- order template line item region has no `<ul>`, `<li>`, or `<p>` wrapping the card HTML,
- zero tax renders `$0.00`,
- zero discount row is absent,
- non-line special characters are escaped in rendered HTML,
- malicious line item content is escaped while helper card markup remains raw HTML,
- if worst-case `line_items_list.length > 2000`, both order-created templates must be `runtimeDelivery: "rendered"` and the validation output must state that hosted line-item substitution is not used for order-created runtime delivery,
- the worst-case sample contains at least five card wrappers, at least two non-apparel cards, at least one apparel card with three sizes, and each non-apparel card has at least four rendered option rows,
- every registry `sampleKeys` entry exists in the sample index,
- every sample key under a template is declared in that template's registry `sampleKeys`.

- [ ] **Step 8: Add source-contract validation.**

Because template components are typed with `TemplateVariables<T>`, TypeScript should catch direct variable drift. Add a runtime validation helper in `email/render.ts` or `email/cli.ts` that renders each publishable template once with a `Proxy` variables object. The proxy must record every property read and throw if a template reads a key not declared in the registry. After render, compare the accessed keys against the registry keys and fail if they differ. This proves actual TSX source variable usage, not only sample shape.

Also render every registry sample for every publishable template and fail if a sample is missing a registry-declared variable or includes an extra variable not declared in the registry.

- [ ] **Step 9: Run focused rendering tests.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath email/__tests__/email-rendering.unit.spec.ts
```

Expected: PASS. A worst-case `line_items_list` longer than 2,000 characters is acceptable only when both order-created templates are `runtimeDelivery: "rendered"`; if either is hosted, the command must fail before any draft push.

---

### Task 6: Add Template Contract Synchronization Validation
> **Confidence: High** - implements [spec §4.2 - Template Registry](./session-02-email-templates-as-code-spec.md#template-registry), [spec §4.8 - Template Contract Gaps](./session-02-email-templates-as-code-spec.md#template-contract-gaps), and [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements). Verified current sender payloads include `order_url` and `proof_url`, and the provider registry currently omits them.

**Soldier prompt prefix:** Use `building-with-medusa` before editing. This task validates backend subscriber/provider contracts.

**Files:**
- Create: `src/modules/resend/utils/__tests__/template-contract.unit.spec.ts`
- Create: `src/modules/resend/utils/build-proof-ready-email-variables.ts`
- Modify: `src/modules/resend/service.ts`
- Modify: `src/modules/resend/utils/__tests__/resend-provider-send.unit.spec.ts`
- Modify: `src/subscribers/custom-order-proof-ready.ts`
- Modify: `email/cli.ts`

- [ ] **Step 1: Route order-created templates through rendered runtime delivery.**

Update `ResendNotificationProviderService.send` so:

- `runtimeDelivery: "rendered"` templates render the matching React Email source with `notification.data`, then call `resend.emails.send({ from, to, subject, html, text })`.
- hosted templates keep the existing Resend hosted-template path with `template: { id: templateData.templateId, variables }`.
- the `from` value for rendered sends comes from provider option `from_email`; if missing, throw `MedusaError.Types.INVALID_DATA` naming `RESEND_FROM_EMAIL`.

Add/update provider tests proving:

- `ORDER_RECEIVED_CUSTOM` calls `emails.send` with `from`, `subject`, `html`, and `text`, and does not include `template`,
- `PROOF_READY` still calls `emails.send` with `template.id`,
- rendered delivery failure throws `MedusaError` instead of returning `{}`.

- [ ] **Step 2: Decide subscriber error behavior explicitly.**

Do not catch notification errors inside `custom-order-created` or `custom-order-proof-ready`. Let Medusa's event system see the rejected subscriber promise so email failures are visible/retriable instead of silently completing. Add this as a comment near the provider send tests, not as a broad runtime comment in the subscribers.

- [ ] **Step 3: Add unit tests that compare sample payload keys to registry variables.**

For each publishable template, assert:

```typescript
expect(Object.keys(sample.variables).sort()).toEqual(
  Object.keys(emailTemplateRegistry[template].variables).sort(),
);
```

Use at least one sample per template.

- [ ] **Step 4: Add registry sample-reference tests.**

For each publishable template, assert registry `sampleKeys` exactly matches the sample index keys for that template. This keeps the durable registry responsible for sample references as required by the spec.

- [ ] **Step 5: Add explicit sender contract tests.**

For `buildOrderEmailVariables`, assert returned keys include `order_url` and exactly match both order-created registry variable lists.

Extract a `buildProofReadyEmailVariables` helper into `src/modules/resend/utils/build-proof-ready-email-variables.ts`, use it from `src/subscribers/custom-order-proof-ready.ts`, and assert its returned keys exactly match the `PROOF_READY` registry variable list. The helper must apply `product_title: customOrder.product_name ?? "Custom product"` and build `proof_url`.

- [ ] **Step 6: Add actual template-source contract tests.**

Render every sample for every publishable template through the real TSX template components. This must fail if:

- a sample is missing a registry-declared variable,
- a sample includes an extra variable not declared in the registry,
- a template attempts to read a variable key not present on its typed `TemplateVariables<T>` props.

- [ ] **Step 7: Wire contract checks into `email:validate`.**

`email:validate` must run render validation and registry/sample key comparison in-process. It may not shell out to Jest as its only proof, because developers need a fast command before draft push.

- [ ] **Step 8: Run focused contract tests and validate command.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath src/modules/resend/utils/__tests__/template-contract.unit.spec.ts
yarn email:validate
```

Expected: both commands PASS.

---

### Task 7: API-Backed Resend Workflow Verification
> **Confidence: Medium** - implements [spec §4.3 - Developer Operations](./session-02-email-templates-as-code-spec.md#developer-operations), [spec §5 - Source-Control and Resend Contract](./session-02-email-templates-as-code-spec.md#source-control-and-resend-contract), and [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements). Confidence is Medium because this task depends on a valid `RESEND_API_KEY` and a controlled recipient inbox.

**Files:**
- No code changes expected after Task 6 unless a command fails and the fix is local to `email/cli.ts`, `email/render.ts`, or `email/resend-client.ts`.

- [ ] **Step 1: Pull current Resend state for all three templates.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
RESEND_API_KEY="$RESEND_API_KEY" yarn email:pull --template order_received_custom
RESEND_API_KEY="$RESEND_API_KEY" yarn email:pull --template order_confirmed_proofed
RESEND_API_KEY="$RESEND_API_KEY" yarn email:pull --template proof_ready
```

Expected: each command writes `.json`, `.html`, and `.txt` files under `email/.resend-current/` without printing the API key.

- [ ] **Step 2: Render and diff one sample for each template.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn email:render --template order_received_custom --sample order-received-apparel-zero-tax-zero-discount
yarn email:render --template order_confirmed_proofed --sample order-confirmed-proofed
yarn email:render --template proof_ready --sample proof-ready
yarn email:diff --template order_received_custom
yarn email:diff --template order_confirmed_proofed
yarn email:diff --template proof_ready
```

Expected: render commands write HTML/text with sample values. Diff commands compare current Resend templates against hosted-draft placeholder output and show intentional differences only: source ownership, valid block line-item region, tax/discount behavior, quantity display, and proof URL contract.

- [ ] **Step 3: Send rendered test emails.**

Run with the controlled inbox address:

```bash
source ~/.nvm/nvm.sh && nvm use 22
RESEND_API_KEY="$RESEND_API_KEY" RESEND_FROM_EMAIL="$RESEND_FROM_EMAIL" yarn email:send-rendered --template order_received_custom --sample order-received-non-apparel --to "$EMAIL_TEST_TO"
RESEND_API_KEY="$RESEND_API_KEY" RESEND_FROM_EMAIL="$RESEND_FROM_EMAIL" yarn email:send-rendered --template proof_ready --sample proof-ready --to "$EMAIL_TEST_TO"
```

Expected: each command prints a concrete Resend email id. If either command prints no id, the command fails non-zero.

- [ ] **Step 4: Push drafts for all three templates.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
RESEND_API_KEY="$RESEND_API_KEY" yarn email:push-draft --template order_received_custom
RESEND_API_KEY="$RESEND_API_KEY" yarn email:push-draft --template order_confirmed_proofed
RESEND_API_KEY="$RESEND_API_KEY" yarn email:push-draft --template proof_ready
```

Expected: each command updates the existing template ID with placeholder-backed hosted template HTML/text and reports success. No command publishes. No command uploads sample customer/order values into a hosted template.

- [ ] **Step 5: Send hosted smoke emails from the published versions.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
RESEND_API_KEY="$RESEND_API_KEY" yarn email:send-hosted --template proof_ready --sample proof-ready --to "$EMAIL_TEST_TO"
```

Expected: the command prints a concrete Resend email id and prints the warning that hosted smoke proves the published template, not the unpublished draft. Do not run order-created hosted smoke as a runtime proof; order-created runtime delivery is repo-rendered full HTML/text specifically to avoid hosted `line_items_list` limits.

- [ ] **Step 6: Verify hosted special-character smoke command behavior.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
RESEND_API_KEY="$RESEND_API_KEY" yarn email:send-hosted --template proof_ready --sample special-characters --to "$EMAIL_TEST_TO"
```

Expected: the command prints a concrete Resend email id and warns that hosted smoke proves the currently published template, not the unpublished draft. Do not claim this proves the new draft. After the release owner explicitly runs `email:publish --template proof_ready --confirm proof_ready_v1`, this same hosted smoke command becomes the release gate for hosted special-character escaping. If Resend-hosted substitution renders non-line values as HTML after publish, immediately roll back to the previous template version or escape non-line variables before hosted sends.

- [ ] **Step 7: Do not publish during implementation.**

Verify the publish command refuses to run without explicit alias confirmation:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn email:publish --template proof_ready
```

Expected: FAIL with a message requiring `--confirm proof_ready_v1`.

---

### Task 8: Final Build and Regression Verification
> **Confidence: High** - implements [spec §9 - Validation Requirements](./session-02-email-templates-as-code-spec.md#validation-requirements) and [spec §10 - Implementation Plan Inputs](./session-02-email-templates-as-code-spec.md#implementation-plan-inputs). The exact commands are grounded in this worktree's `package.json` and current Node/Yarn versions.

**Files:**
- No planned code changes.

- [ ] **Step 1: Run focused unit tests.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit --runTestsByPath \
  src/modules/resend/utils/__tests__/build-order-email-variables.unit.spec.ts \
  src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts \
  src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts \
  src/modules/resend/utils/__tests__/resend-provider-send.unit.spec.ts \
  src/modules/resend/utils/__tests__/template-contract.unit.spec.ts \
  email/__tests__/email-rendering.unit.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run email validation.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn email:validate
```

Expected: PASS.

- [ ] **Step 3: Run full unit suite.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn test:unit
```

Expected: PASS.

- [ ] **Step 4: Run build.**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22
yarn build
```

Expected: PASS.

- [ ] **Step 5: Verify subscriber path cleanliness.**

Run:

```bash
unexpected="$(rg --files src/subscribers -g '*.ts' | rg -v '^src/subscribers/(custom-order-created|custom-order-proof-ready|password-reset|user-invited)\\.ts$' || true)"
[ -z "$unexpected" ] || { echo "$unexpected"; exit 1; }
```

Expected: no output.

- [ ] **Step 6: Verify no generated email output is staged.**

Run:

```bash
git status --short
```

Expected: source files may be modified, but `email/.generated/` and `email/.resend-current/` do not appear unless the Imperator explicitly asked to retain pulled snapshots.

---

## Coverage Map

- Template source ownership: Tasks 3, 4, 5, 7.
- Registry as source of truth: Tasks 3, 6.
- Developer email operations: Tasks 0, 5, 7.
- Block-safe line-item rendering: Tasks 4, 5.
- Tax visible and zero discount hidden: Tasks 1, 4, 5.
- Apparel quantity plus size breakdown: Task 2.
- Non-apparel Quantity-first display: Task 2.
- `proof_url` and `order_url` contract gaps: Tasks 3, 6.
- Provider no-silent-drop behavior: Task 3.
- No non-subscriber TS under `src/subscribers`: Tasks 1, 8.
- Node 22/Yarn 4.9.2 verification: Tasks 0, 8.

## Residual Risks

- Resend template escaping semantics must be visually checked with the special-character rendered test and hosted smoke output before publish.
- The worst-case `line_items_list` cap is why order-created runtime delivery is rendered HTML/text. If a future edit changes either order-created template back to hosted runtime delivery, the cap becomes a hard blocker again.
- The draft push command updates Resend state. Run it only when the controlled account/API key are pointed at the intended Divinipress project.
- Cross-client inspection in Gmail, Apple Mail, and Outlook remains a release gate after draft push and before publish.

## March Readiness

The edict is ready for Praetor and Provocator review before implementation. If verification clears, send the legion with `consilium:legion`; if this stays in one session, execute with `consilium:march`.
