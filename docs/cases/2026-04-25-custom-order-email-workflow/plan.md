# Non-Apparel Email Subscriber Retrofit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** v2 — Praetor + Provocator round 1 returned 6 GAPs and 9 CONCERNs against plan v1. v2 patches the substantive issues:
- Validator-test file relocated from `src/modules/resend/__tests__/` to `src/modules/resend/utils/__tests__/` (Praetor GAP) — the original location matched `jest.config.js:30`'s `**/src/modules/*/__tests__/**` integration:modules glob, polluting that suite.
- Test case 15's expected substring corrected from `&lt;script&gt;` to `&lt;Script&gt;` (Provocator GAP) — the helper's `humanize()` step uppercases word-boundary chars before `escapeHtml()` runs.
- `formatNonApparel` product_name extraction switched from `??` to a length check (Provocator GAP) — empty-string `product_name` now correctly falls through to `product_title` rather than rendering an empty card heading.
- `OrderForEmail` totals widened to `Totalish = number | string | null | undefined` and the helper coerces via `Number(value ?? 0)` with a `Number.isFinite` guard (Provocator GAP) — Medusa's `query.graph` returns `Maybe<Float>` for totals, so the prior `number | string` declaration would type-error at the Task 6 call site AND `Number(undefined).toFixed(2)` produced `"$NaN"` in customer-facing emails.
- Task 5 reframed: Resend ships no CLI (`node_modules/resend/package.json` has no `bin` field). Dashboard UI is now the primary path; curl with explicit redirect is the documented fallback.
- Task 0 reordered: file-existence check is the load-bearing gate; the commit-message grep is informational only (squash-merges may not include the ticket marker in the title).
- Task 2 now revert-aware: a loader-collision finding triggers `git revert HEAD` before surfacing.
- Task 7 staging verification reframed from "(optional, for full confidence)" to "production-cutover gate" — unit tests are the merge gate; staging confirms customer-facing render.
- `EmailLineItemInput.variant.options[].option.title` widened to `string | null` to match `query.graph`'s actual return shape.
- Task 8 PR-creation branch name uses `$(git branch --show-current)` instead of `<branch-name>` placeholder.
- Task 3 mock logger simplified to `{} as Logger` — the constructor never invokes logger methods.
- Plan header now states task ordering is strictly sequential.
- Plus 1 new test case (case 13b: empty-string product_name fallback) and 2 new test cases in `buildOrderEmailVariables` (case 7: null/undefined totals → $0.00; case 8: numeric-string totals from BigNumberValue serialization).

CONCERNs not adopted as plan changes (carried as residual risk):
- Pre-merge dashboard grep verifies syntax only, not Resend's template-engine empty-string semantics. Spec already accepts this as residual risk for V1; Task 7 staging gate is the customer-facing verification.
- Task 3 mock logger relies on Logger interface stability across Medusa versions; the simplified `{} as Logger` cast bypasses interface drift but accepts that future logger-interface changes could surface here.

**Goal:** Add non-apparel support to the `custom-order.created` email subscriber, fix the validator silent-drop bug for orders without both tax AND discount, and extract a reusable line-item-formatter helper.

**Architecture:** New pure helper at `src/modules/resend/utils/format-email-line-item.ts` handles per-card line-item rendering for both apparel and non-apparel branches via the imported `isNonApparelProductType` predicate. New top-of-file helper `buildOrderEmailVariables` in `custom-order-created.ts` always emits all four tax/discount template variables (empty-string fallback) so the Resend validator no longer silently drops orders without both. Subscriber stays inline (no workflow lift); helpers are unit-tested in isolation. Three new unit-test groups (helper output, subscriber-helper variables, validator-contract) replace the proposed integration tests — `medusa-config.ts:73-94` registers no notification provider in `NODE_ENV=test`, so integration tests cannot exercise the validator regardless.

**Tech Stack:** TypeScript, Medusa v2.12.5, Jest (unit), Resend dashboard templates, Yarn 4.9.2.

**Spec:** `/Users/milovan/projects/consilium-docs/cases/2026-04-25-custom-order-email-workflow/spec.md` (v5, commit `ea6c485`)

**Repo:** `/Users/milovan/projects/divinipress-backend` (operate against `develop` after DIV-99 merges; the legion/march skill creates the worktree).

**Required Medusa skill:** Every implementation task must invoke `Skill(skill: "medusa-dev:building-with-medusa")` on arrival — this is backend-only work (subscriber + module helper + unit tests).

**Task ordering:** Tasks 0-8 are **strictly sequential**. Task 6 imports the helper from Task 1 and the function from Task 4; Task 8 verifies tests added in Tasks 1, 3, and 4. The legion or march skill executes them in numerical order — do not parallelize. Task 7 Step 1 (seed grep) is the only step that could run independently, but it's gated after the refactor for completeness of the PR description.

---

### Task 0: DIV-99 prerequisite verification

> **Confidence: High** — Imperator was explicit ("Hard requirement: this merges after DIV-99. No fallback shim"). The helper imports `isNonApparelProductType` from `src/modules/custom-order/non-apparel-type.ts`, which only exists in the DIV-99 worktree. Landing this PR before DIV-99 breaks the build on develop.

**Files:** None modified. Verification only.

- [ ] **Step 1: Sync develop and verify the predicate file exists.**

Run: `git checkout develop && git pull origin develop && ls src/modules/custom-order/non-apparel-type.ts`

Expected: the file exists, no error. If `ls` returns "No such file or directory", DIV-99 has not landed on develop yet — halt and surface to Imperator. **This file-existence check is the load-bearing gate; the commit-message check below is informational.**

- [ ] **Step 2: Verify the predicate signature matches what the helper will import.**

Run: `cat src/modules/custom-order/non-apparel-type.ts`

Expected: a function `export const isNonApparelProductType = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.trim() !== "apparel";` (the actual implementation may differ in style but must export `isNonApparelProductType` with this semantic — non-empty after trim AND not equal to `"apparel"`). If the export name has been renamed during the DIV-99 merge process or the predicate's semantics differ, halt and surface to Imperator — the helper's discriminator depends on these exact semantics.

- [ ] **Step 3 (informational): Confirm DIV-99 in the recent commit log.**

Run: `git log origin/develop --oneline -50`

Expected: a recent commit referencing DIV-99 or `feature/div-82-importer-hierarchy` should appear (e.g., "Feature DIV-99 (#NN)" via squash-merge). This is informational only — squash-commit titles don't always include the ticket marker, so the absence of a literal "DIV-99" string is NOT a halt condition. The Step 1 file-existence check is the actual gate.

---

### Task 1: Create the line-item formatter helper

> **Confidence: High** — file location verified safe per spec section "Architecture" (loaders bounded; precedent at `src/workflows/pricing/utils/`). Helper signature derived from existing subscriber's `query.graph` field selection at `custom-order-created.ts:36-49`.

**Files:**
- Create: `src/modules/resend/utils/format-email-line-item.ts`
- Create: `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`

- [ ] **Step 1: Create the helper file with full type signatures and a stub function.**

Write `src/modules/resend/utils/format-email-line-item.ts`:

```typescript
import { isNonApparelProductType } from "@/modules/custom-order/non-apparel-type";

const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
  "8XL",
  "9XL",
  "10XL",
];

export type EmailLineItemInput = {
  product_title: string | null;
  quantity: number;
  metadata: Record<string, unknown> | null;
  variant?: {
    options?: Array<{
      value: string;
      // option.title is `string | null` per Medusa's query.graph return shape.
      // The `===` comparisons below null-coalesce safely.
      option?: { title: string | null } | null;
    }> | null;
  } | null;
};

export type EmailLineItemCardOutput = {
  rowHtml: string;
  structured: {
    productName: string;
    fields: Array<{ label: string; value: string }>;
  };
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const humanize = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const renderCard = (
  productName: string,
  fields: Array<{ label: string; value: string }>,
): string => {
  const fieldRows = fields
    .map(
      (f) =>
        `<div><span style="color:#666;">${escapeHtml(f.label)}:</span> ${escapeHtml(f.value)}</div>`,
    )
    .join("");
  return (
    `<div style="border:1px solid #e5e5e5;border-radius:6px;padding:12px;margin-bottom:8px;font-family:inherit;">` +
    `<div style="font-weight:600;font-size:15px;margin-bottom:6px;">${escapeHtml(productName)}</div>` +
    `<div style="font-size:14px;line-height:1.6;">${fieldRows}</div>` +
    `</div>`
  );
};

export function formatEmailLineItemCard(
  items: EmailLineItemInput[],
): EmailLineItemCardOutput {
  if (items.length === 0) {
    return {
      rowHtml: "",
      structured: { productName: "", fields: [] },
    };
  }

  const first = items[0];
  if (isNonApparelProductType(first.metadata?.["product_type"])) {
    return formatNonApparel(first);
  }
  return formatApparel(items);
}

function formatApparel(items: EmailLineItemInput[]): EmailLineItemCardOutput {
  const first = items[0];
  const productName = first.product_title ?? "(unnamed item)";

  const color =
    first.variant?.options?.find((o) => o.option?.title === "Color")?.value ??
    "";

  const sizeQuantities = items
    .map((item) => {
      const size =
        item.variant?.options?.find((o) => o.option?.title === "Size")?.value ??
        "";
      return { size, quantity: item.quantity ?? 0 };
    })
    .filter((sq) => sq.size !== "")
    .sort(
      (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
    );

  const fields: Array<{ label: string; value: string }> = [];
  if (color !== "") {
    fields.push({ label: "Color", value: color });
  }
  if (sizeQuantities.length > 0) {
    fields.push({
      label: "Sizes",
      value: sizeQuantities.map((sq) => `${sq.size} - ${sq.quantity}`).join(", "),
    });
  }

  return {
    rowHtml: renderCard(productName, fields),
    structured: { productName, fields },
  };
}

function formatNonApparel(item: EmailLineItemInput): EmailLineItemCardOutput {
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  // Length check (not just typeof) so empty-string product_name falls
  // through to product_title — `??` only short-circuits on null/undefined,
  // and Zod's z.string().optional() permits empty strings on input.
  const rawName = metadata["product_name"];
  const metadataName =
    typeof rawName === "string" && rawName.length > 0 ? rawName : null;
  const productName = metadataName ?? item.product_title ?? "(unnamed item)";

  const optionsRaw = metadata["options"];
  const options: Record<string, string> =
    optionsRaw && typeof optionsRaw === "object"
      ? (optionsRaw as Record<string, string>)
      : {};

  const labelsRaw = metadata["options_labels"];
  const labels: Record<string, string> =
    labelsRaw && typeof labelsRaw === "object"
      ? (labelsRaw as Record<string, string>)
      : {};

  const fields = Object.entries(options)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: labels[key] ?? humanize(key),
      value,
    }));

  return {
    rowHtml: renderCard(productName, fields),
    structured: { productName, fields },
  };
}
```

- [ ] **Step 2: Create the test file with all 18 test cases (failing — implementation lands progressively).**

Write `src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`:

```typescript
import {
  formatEmailLineItemCard,
  type EmailLineItemInput,
} from "../format-email-line-item";

const apparelItem = (overrides: Partial<EmailLineItemInput> = {}): EmailLineItemInput => ({
  product_title: "Bella Canvas 3001 Unisex Jersey Tee",
  quantity: 1,
  metadata: { group_id: "g1", upload_ids: [], selections: [], product_name: "Youth Group Tees" },
  variant: {
    options: [
      { value: "Black", option: { title: "Color" } },
      { value: "M", option: { title: "Size" } },
    ],
  },
  ...overrides,
});

const nonApparelItem = (
  metadataOverrides: Record<string, unknown> = {},
): EmailLineItemInput => ({
  product_title: "Promo Print Item",
  quantity: 1,
  metadata: {
    product_type: "print",
    group_id: "g1",
    upload_ids: ["u1"],
    options: { paper: "Glossy", quantity: "100", sides: "Double" },
    options_labels: { paper: "Paper", quantity: "Quantity", sides: "Sides" },
    ...metadataOverrides,
  },
  variant: null,
});

describe("formatEmailLineItemCard — apparel branch", () => {
  it("case 1: full input with multiple sizes renders a single card with Color and Sizes rows", () => {
    const items: EmailLineItemInput[] = [
      apparelItem({
        quantity: 10,
        variant: {
          options: [
            { value: "Black", option: { title: "Color" } },
            { value: "M", option: { title: "Size" } },
          ],
        },
      }),
      apparelItem({
        quantity: 8,
        variant: {
          options: [
            { value: "Black", option: { title: "Color" } },
            { value: "L", option: { title: "Size" } },
          ],
        },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.productName).toBe(
      "Bella Canvas 3001 Unisex Jersey Tee",
    );
    expect(result.structured.fields).toEqual([
      { label: "Color", value: "Black" },
      { label: "Sizes", value: "M - 10, L - 8" },
    ]);
    expect(result.rowHtml).toContain(
      "Bella Canvas 3001 Unisex Jersey Tee",
    );
    expect(result.rowHtml).toContain("Color");
    expect(result.rowHtml).toContain("Black");
    expect(result.rowHtml).toContain("M - 10, L - 8");
  });

  it("case 2: variant has no Color option → Color row omitted; structured fields excludes Color", () => {
    const items = [
      apparelItem({
        variant: {
          options: [{ value: "M", option: { title: "Size" } }],
        },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.find((f) => f.label === "Color")).toBeUndefined();
    expect(result.rowHtml).not.toMatch(/Color:\s*<\/span>\s*<\/div>/);
  });

  it("case 3: variant has no Size option → Sizes row omitted entirely", () => {
    const items = [
      apparelItem({
        variant: {
          options: [{ value: "Black", option: { title: "Color" } }],
        },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.find((f) => f.label === "Sizes")).toBeUndefined();
  });

  it("case 4: discriminator metadata.product_type === undefined → apparel branch", () => {
    const items = [apparelItem({ metadata: { group_id: "g1" } })];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.some((f) => f.label === "Color")).toBe(true);
  });

  it("case 5: discriminator metadata.product_type === '' (empty string) → apparel branch", () => {
    const items = [
      apparelItem({ metadata: { group_id: "g1", product_type: "" } }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.some((f) => f.label === "Color")).toBe(true);
  });

  it("case 6: discriminator metadata.product_type === null → apparel branch", () => {
    const items = [
      apparelItem({ metadata: { group_id: "g1", product_type: null } }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.some((f) => f.label === "Color")).toBe(true);
  });

  it("case 7: discriminator metadata.product_type === 'apparel' (DIV-99 carve-out) → apparel branch", () => {
    const items = [
      apparelItem({ metadata: { group_id: "g1", product_type: "apparel" } }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.some((f) => f.label === "Color")).toBe(true);
  });

  it("case 8: apparel branch uses product_title only — does NOT fall back to metadata.product_name", () => {
    const items = [
      apparelItem({
        product_title: "Bella Canvas 3001 Unisex Jersey Tee",
        metadata: {
          group_id: "g1",
          product_name: "Youth Group Tees 2026",
        },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.productName).toBe(
      "Bella Canvas 3001 Unisex Jersey Tee",
    );
    expect(result.structured.productName).not.toBe("Youth Group Tees 2026");
  });
});

describe("formatEmailLineItemCard — non-apparel branch", () => {
  it("case 9: full input with options_labels → labels resolved correctly", () => {
    const items = [nonApparelItem()];
    const result = formatEmailLineItemCard(items);
    const labels = result.structured.fields.map((f) => f.label);
    expect(labels).toEqual(["Paper", "Quantity", "Sides"]);
  });

  it("case 10: missing options_labels → humanize fallback for every field", () => {
    const items = [
      nonApparelItem({
        options: { ink_color: "Black", paper_weight: "80lb" },
        options_labels: undefined,
      }),
    ];
    const result = formatEmailLineItemCard(items);
    const labels = result.structured.fields.map((f) => f.label);
    expect(labels).toEqual(["Ink Color", "Paper Weight"]);
  });

  it("case 11: partial options_labels → mix of labels and humanize fallbacks", () => {
    const items = [
      nonApparelItem({
        options: { paper: "Glossy", ink_color: "Black" },
        options_labels: { paper: "Paper" },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    const map = Object.fromEntries(
      result.structured.fields.map((f) => [f.label, f.value]),
    );
    expect(map["Paper"]).toBe("Glossy");
    expect(map["Ink Color"]).toBe("Black");
  });

  it("case 12: empty metadata.options {} → card with just product name, no field rows", () => {
    const items = [
      nonApparelItem({ options: {}, options_labels: {} }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields).toEqual([]);
    expect(result.structured.productName).toBe("Promo Print Item");
  });

  it("case 13: missing metadata.product_name, present product_title → falls back to product_title", () => {
    const items = [
      nonApparelItem({ product_name: undefined }),
    ];
    items[0].product_title = "Print Job Fallback";
    const result = formatEmailLineItemCard(items);
    expect(result.structured.productName).toBe("Print Job Fallback");
  });

  it("case 13b: empty-string metadata.product_name → falls through to product_title (length-checked, not just nullish)", () => {
    const items = [
      nonApparelItem({ product_name: "" }),
    ];
    items[0].product_title = "Print Job Fallback";
    const result = formatEmailLineItemCard(items);
    expect(result.structured.productName).toBe("Print Job Fallback");
    expect(result.structured.productName).not.toBe("");
  });

  it("case 14: alphabetical key sort verified across multiple options", () => {
    const items = [
      nonApparelItem({
        options: { zeta: "Z", alpha: "A", mike: "M" },
        options_labels: undefined,
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.structured.fields.map((f) => f.label)).toEqual([
      "Alpha",
      "Mike",
      "Zeta",
    ]);
  });
});

describe("formatEmailLineItemCard — HTML escape and defensive cases", () => {
  it("case 15: option key with HTML special chars → emitted as escaped entities", () => {
    const items = [
      nonApparelItem({
        options: { "<script>foo</script>": "value" },
        options_labels: undefined,
      }),
    ];
    const result = formatEmailLineItemCard(items);
    // Raw HTML must never appear unescaped.
    expect(result.rowHtml).not.toContain("<script>foo</script>");
    // The key flows through humanize() before escapeHtml(): humanize
    // uppercases each word-boundary char (\b\w), turning `<script>foo</script>`
    // into `<Script>Foo</Script>`. escapeHtml then encodes the brackets.
    expect(result.rowHtml).toContain("&lt;Script&gt;Foo&lt;/Script&gt;");
  });

  it("case 16: option value with & \" < > ' → emitted as escaped entities", () => {
    const items = [
      nonApparelItem({
        options: { paper: `A & B "C" <D> 'E'` },
        options_labels: { paper: "Paper" },
      }),
    ];
    const result = formatEmailLineItemCard(items);
    expect(result.rowHtml).toContain("A &amp; B &quot;C&quot; &lt;D&gt; &#39;E&#39;");
  });

  it("case 17: empty array input → returns empty rowHtml and empty structured fields without throwing", () => {
    const result = formatEmailLineItemCard([]);
    expect(result.rowHtml).toBe("");
    expect(result.structured).toEqual({ productName: "", fields: [] });
  });
});
```

- [ ] **Step 3: Run the helper unit tests; verify all 18 pass.**

Run: `yarn test:unit src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts`

Expected: 18 tests pass (17 numbered cases plus case 13b). If any fail, debug the helper implementation against the failing test's expectations. Do NOT proceed to Task 2 with red tests.

- [ ] **Step 4: Commit.**

```bash
git add src/modules/resend/utils/format-email-line-item.ts src/modules/resend/utils/__tests__/format-email-line-item.unit.spec.ts
git commit -m "feat(resend): add format-email-line-item helper with apparel + non-apparel branches"
```

---

### Task 2: Loader-safety boot check

> **Confidence: Medium on empirical safety, High on architectural reasoning** — Medusa loaders (subscriber, workflow, module) verified bounded by source review (spec section "Architecture"). No precedent on develop for `__tests__/` inside `src/modules/{x}/utils/`. DIV-99 commit `c6debee` shows the team has been bitten by an analogous loader collision in a different subtree. Boot-log smoke check is cheap insurance.

**Files:** None modified. Verification only.

- [ ] **Step 1: Start the dev server.**

Run: `yarn dev`

Wait for the boot logs to settle (look for "Server is ready" or "Listening on port" or equivalent — dev server is up and healthy).

- [ ] **Step 2: Scan boot logs for any reference to the new test file.**

Inspect the dev-server output for `WARN`/`ERROR` lines. Specifically grep for:
- `format-email-line-item` (the helper file or test file basename)
- `__tests__` (the test directory)
- `src/modules/resend/utils` (the helper directory)
- `is not a function` (subscriber-loader's "skipped" warning)
- `describe is not defined` (test-globals leakage indicator)

Expected: NONE of these appear in the boot logs. Helper and test files are invisible to all Medusa loaders.

- [ ] **Step 3: If any of the above appear, halt, revert Task 1's commit, and surface to Imperator.**

If boot logs reference the helper or test file, the loader-safety claim is empirically false. Stop the dev server. **Revert Task 1's commit — do not leave a known-bad helper location in the working tree:**

```bash
git revert HEAD --no-edit
```

Document the exact log lines and the loader source (e.g., "subscriber-loader skipped"). Do NOT attempt a workaround inline — the relocation needs a fresh design decision (move tests outside `src/modules/`, e.g., to a top-level `tests/` directory; or rename the path to add a leading `_` prefix). Surface to Imperator with the log evidence + the revert commit hash. The Imperator decides the relocation strategy before Task 1 is re-attempted.

- [ ] **Step 4: Stop the dev server.**

Send `Ctrl+C` to the dev process. Verify shutdown is clean.

- [ ] **Step 5: Note the verification result.**

If clean: append a one-line note to the eventual PR description: "Loader-safety boot check passed — `src/modules/resend/utils/__tests__/` is invisible to all Medusa loaders." No commit needed; this is a checkpoint, not a code change.

---

### Task 3: Add `validateTemplateVariables` direct unit tests

> **Confidence: High** — service.ts validator at lines 137-150 verified by spec. Test exercises the existing contract; guards against silent regressions to the validator itself. Test file co-located with the helper test (under `src/modules/resend/utils/__tests__/`) to escape `jest.config.js:30`'s `**/src/modules/*/__tests__/**/*.[jt]s` glob — that glob runs `test:integration:modules` and would pick up a `__tests__/` directly under `src/modules/{x}/`.

**Files:**
- Create: `src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts`

- [ ] **Step 1: Write the test file with 4 cases.**

Write `src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts`:

```typescript
import type { Logger } from "@medusajs/framework/types";
import ResendNotificationProviderService, { Templates } from "../../service";

const makeService = () => {
  // Constructor only does super(), `new Resend(api_key)` (no network at
  // instantiation), and assigns `this.logger`. Logger is never invoked
  // during validateTemplateVariables, so an empty cast is safe.
  return new ResendNotificationProviderService(
    { logger: {} as Logger },
    { api_key: "test-key" },
  );
};

describe("ResendNotificationProviderService.validateTemplateVariables", () => {
  it("case 1: all required keys present and non-undefined → returns true", () => {
    const service = makeService();
    const result = service.validateTemplateVariables(
      Templates.ORDER_RECEIVED_CUSTOM,
      {
        order_id: "ord_1",
        customer_name: "Jane",
        order_date: "01/01/2026",
        line_items_list: "<div></div>",
        subtotal: "$10.00",
        shipping: "$0.00",
        total: "$10.00",
        current_year: "2026",
        tax: "$1.00",
        tax_description: "Tax",
        discount: "$0.50",
        discount_description: "Discount",
      },
    );
    expect(result).toBe(true);
  });

  it("case 2: required key with value undefined → returns false (silent-drop bug recreation)", () => {
    const service = makeService();
    const result = service.validateTemplateVariables(
      Templates.ORDER_RECEIVED_CUSTOM,
      {
        order_id: "ord_1",
        customer_name: "Jane",
        order_date: "01/01/2026",
        line_items_list: "<div></div>",
        subtotal: "$10.00",
        shipping: "$0.00",
        total: "$10.00",
        current_year: "2026",
        // tax intentionally undefined — exercises the bug path before the fix
        tax_description: "Tax",
        discount: "$0.50",
        discount_description: "Discount",
      },
    );
    expect(result).toBe(false);
  });

  it("case 3: required key with value '' (empty string) → returns true (the bug-fix contract)", () => {
    const service = makeService();
    const result = service.validateTemplateVariables(
      Templates.ORDER_RECEIVED_CUSTOM,
      {
        order_id: "ord_1",
        customer_name: "Jane",
        order_date: "01/01/2026",
        line_items_list: "<div></div>",
        subtotal: "$10.00",
        shipping: "$0.00",
        total: "$10.00",
        current_year: "2026",
        tax: "",
        tax_description: "",
        discount: "",
        discount_description: "",
      },
    );
    expect(result).toBe(true);
  });

  it("case 4: required key with value 0 (numeric zero) → returns true (same contract)", () => {
    const service = makeService();
    const result = service.validateTemplateVariables(
      Templates.ORDER_RECEIVED_CUSTOM,
      {
        order_id: "ord_1",
        customer_name: "Jane",
        order_date: "01/01/2026",
        line_items_list: "<div></div>",
        subtotal: "$10.00",
        shipping: "$0.00",
        total: "$10.00",
        current_year: "2026",
        tax: 0,
        tax_description: "Tax",
        discount: 0,
        discount_description: "Discount",
      },
    );
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run the validator unit tests; verify all 4 pass.**

Run: `yarn test:unit src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts`

Expected: 4 tests pass. These exercise the EXISTING validator behavior; no service.ts code changes. If any fail, the validator's runtime semantics differ from what the spec assumed — halt and surface to Imperator with the failure output.

- [ ] **Step 3: Commit.**

```bash
git add src/modules/resend/utils/__tests__/validate-template-variables.unit.spec.ts
git commit -m "test(resend): direct unit coverage for validateTemplateVariables contract"
```

---

### Task 4: Extract `buildOrderEmailVariables` from the subscriber

> **Confidence: High** — extraction shape verified against existing subscriber at `custom-order-created.ts:121-152`. Always-include tax/discount fix is the spec's load-bearing change; unit-tested directly because the validator never runs in `NODE_ENV=test` per `medusa-config.ts:73-94`.

**Files:**
- Modify: `src/subscribers/custom-order-created.ts` (add top-of-file `buildOrderEmailVariables` export; do NOT yet refactor the handler body — that's Task 6)
- Create: `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

- [ ] **Step 1: Write the failing tests for `buildOrderEmailVariables`.**

Write `src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`:

```typescript
import { buildOrderEmailVariables } from "../custom-order-created";

const baseInput = (orderOverrides: Record<string, unknown> = {}) => ({
  order: {
    id: "ord_42",
    total: 100,
    subtotal: 90,
    shipping_total: 5,
    tax_total: 0,
    discount_total: 0,
    created_at: "2026-04-25T12:00:00.000Z",
    ...orderOverrides,
  },
  customerName: "Jane Smith",
  lineItemsList: "<div>card html</div>",
  orderUrl: "https://example.com/orders/ord_42",
});

describe("buildOrderEmailVariables", () => {
  it("case 1: tax_total !== 0 AND discount_total !== 0 → all four tax/discount keys defined with $-prefixed values", () => {
    const result = buildOrderEmailVariables(
      baseInput({ tax_total: 5.5, discount_total: 2.25 }),
    );
    expect(result.tax).toBe("$5.50");
    expect(result.tax_description).toBe("Tax");
    expect(result.discount).toBe("$2.25");
    expect(result.discount_description).toBe("Discount");
  });

  it("case 2: tax_total === 0 AND discount_total === 0 (regression case) → all four keys defined as empty strings, NEVER undefined", () => {
    const result = buildOrderEmailVariables(baseInput());
    expect(result.tax).toBe("");
    expect(result.tax_description).toBe("");
    expect(result.discount).toBe("");
    expect(result.discount_description).toBe("");
    expect(result.tax).not.toBeUndefined();
    expect(result.tax_description).not.toBeUndefined();
    expect(result.discount).not.toBeUndefined();
    expect(result.discount_description).not.toBeUndefined();
  });

  it("case 3: tax_total !== 0 AND discount_total === 0 → tax populated, discount keys empty", () => {
    const result = buildOrderEmailVariables(
      baseInput({ tax_total: 3.14, discount_total: 0 }),
    );
    expect(result.tax).toBe("$3.14");
    expect(result.tax_description).toBe("Tax");
    expect(result.discount).toBe("");
    expect(result.discount_description).toBe("");
  });

  it("case 4: tax_total === 0 AND discount_total !== 0 → discount populated, tax keys empty", () => {
    const result = buildOrderEmailVariables(
      baseInput({ tax_total: 0, discount_total: 7.77 }),
    );
    expect(result.tax).toBe("");
    expect(result.tax_description).toBe("");
    expect(result.discount).toBe("$7.77");
    expect(result.discount_description).toBe("Discount");
  });

  it("case 5: negative discount/tax (refunds) → numeric formatting handles correctly", () => {
    const result = buildOrderEmailVariables(
      baseInput({ tax_total: -1.5, discount_total: -0.25 }),
    );
    expect(result.tax).toBe("$-1.50");
    expect(result.discount).toBe("$-0.25");
    expect(result.tax_description).toBe("Tax");
    expect(result.discount_description).toBe("Discount");
  });

  it("case 6: current_year emitted as string (matches service.ts declared type)", () => {
    const result = buildOrderEmailVariables(baseInput());
    expect(typeof result.current_year).toBe("string");
    expect(result.current_year).toMatch(/^\d{4}$/);
  });

  it("case 7: totals are null/undefined (Maybe<Float>) → coerced to '$0.00', never '$NaN'", () => {
    const result = buildOrderEmailVariables({
      order: {
        id: "ord_null",
        total: null,
        subtotal: undefined,
        shipping_total: null,
        tax_total: undefined,
        discount_total: null,
        created_at: "2026-04-25T12:00:00.000Z",
      },
      customerName: "Jane",
      lineItemsList: "<div></div>",
      orderUrl: "https://example.com/orders/ord_null",
    });
    expect(result.total).toBe("$0.00");
    expect(result.subtotal).toBe("$0.00");
    expect(result.shipping).toBe("$0.00");
    expect(result.tax).toBe("");
    expect(result.tax_description).toBe("");
    expect(result.discount).toBe("");
    expect(result.discount_description).toBe("");
    // No "$NaN" anywhere — that would render as broken pricing in the email.
    expect(JSON.stringify(result)).not.toContain("NaN");
  });

  it("case 8: totals as numeric strings (Medusa BigNumberValue serialization) → parsed correctly", () => {
    const result = buildOrderEmailVariables({
      order: {
        id: "ord_str",
        total: "100.50",
        subtotal: "90.00",
        shipping_total: "5.50",
        tax_total: "5.00",
        discount_total: "0",
        created_at: "2026-04-25T12:00:00.000Z",
      },
      customerName: "Jane",
      lineItemsList: "<div></div>",
      orderUrl: "https://example.com/orders/ord_str",
    });
    expect(result.total).toBe("$100.50");
    expect(result.subtotal).toBe("$90.00");
    expect(result.shipping).toBe("$5.50");
    expect(result.tax).toBe("$5.00");
    expect(result.discount).toBe("");
  });
});
```

- [ ] **Step 2: Run the test file; verify all 8 fail with "buildOrderEmailVariables is not exported".**

Run: `yarn test:unit src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

Expected: tests fail at import time because `buildOrderEmailVariables` is not yet exported from the subscriber.

- [ ] **Step 3: Add `buildOrderEmailVariables` as a top-of-file export in the subscriber.**

Open `src/subscribers/custom-order-created.ts`. Insert the following AFTER the `SIZE_ORDER` constant (currently lines 5-20) and BEFORE the `customOrderCreatedHandler` default export (currently line 22):

```typescript
// Medusa's query.graph returns line-item totals as Maybe<Float> = number | null | undefined.
// The type permits all three; the helper coerces defensively.
type Totalish = number | string | null | undefined;

type OrderForEmail = {
  id: string;
  total: Totalish;
  subtotal: Totalish;
  shipping_total: Totalish;
  tax_total: Totalish;
  discount_total: Totalish;
  created_at: string | Date;
};

export type BuildOrderEmailVariablesInput = {
  order: OrderForEmail;
  customerName: string;
  lineItemsList: string;
  orderUrl: string;
};

// Coerce any Totalish to a finite number; null/undefined/NaN/Infinity → 0.
// Prevents `Number(undefined).toFixed(2) === "NaN"` from emitting `"$NaN"` to customers.
const toFiniteNumber = (value: Totalish): number => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const formatMoney = (value: Totalish): string =>
  `$${toFiniteNumber(value).toFixed(2)}`;

export function buildOrderEmailVariables(
  input: BuildOrderEmailVariablesInput,
): Record<string, string> {
  const { order, customerName, lineItemsList, orderUrl } = input;
  const taxNum = toFiniteNumber(order.tax_total);
  const discountNum = toFiniteNumber(order.discount_total);
  return {
    customer_name: customerName,
    order_id: order.id,
    order_date: new Date(order.created_at).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    order_url: orderUrl,
    line_items_list: lineItemsList,
    subtotal: formatMoney(order.subtotal),
    shipping: formatMoney(order.shipping_total),
    total: formatMoney(order.total),
    current_year: new Date().getFullYear().toString(),
    // Always-include tax/discount keys with empty-string fallback so
    // ResendNotificationProviderService.validateTemplateVariables (which
    // requires `!== undefined` for declared keys) does not silently drop
    // orders without both tax AND discount. NaN-coerced values count as zero.
    tax: taxNum !== 0 ? `$${taxNum.toFixed(2)}` : "",
    tax_description: taxNum !== 0 ? "Tax" : "",
    discount: discountNum !== 0 ? `$${discountNum.toFixed(2)}` : "",
    discount_description: discountNum !== 0 ? "Discount" : "",
  };
}
```

(Do NOT yet modify the existing handler body to call this helper — that's Task 6. Adding the export now lets the unit tests run while the handler stays unchanged.)

- [ ] **Step 4: Run the test file; verify all 8 pass.**

Run: `yarn test:unit src/subscribers/__tests__/build-order-email-variables.unit.spec.ts`

Expected: 8 tests pass.

- [ ] **Step 5: Run a focused tsc to verify no type errors.**

Run: `yarn build`

Expected: build succeeds. If type errors surface in `custom-order-created.ts`, debug and fix; the existing handler should still type-check because the new export is purely additive.

- [ ] **Step 6: Commit.**

```bash
git add src/subscribers/custom-order-created.ts src/subscribers/__tests__/build-order-email-variables.unit.spec.ts
git commit -m "feat(subscribers): extract buildOrderEmailVariables with always-include tax/discount keys"
```

---

### Task 5: Pre-merge dashboard template check (strict halt-and-surface)

> **Confidence: Medium** — Resend's template engine semantics for empty-string falsy are unverified by code; pre-merge grep verifies syntax presence only. If `{{#if tax}}` is absent, the implementer halts and escalates — no tactical template edits in this PR per Imperator (dashboard work is Slice 2's lane).

**Files:** None modified. Verification only.

- [ ] **Step 1: Pull the live Resend templates.**

Identify the two templates by ID from `src/modules/resend/service.ts:51-86`:
- `ORDER_CONFIRMED_PROOFED`: templateId `75866903-26c8-4881-9a0c-8b33219e7614`
- `ORDER_RECEIVED_CUSTOM`: templateId `ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf`

**Primary path — Resend dashboard UI:** open `https://resend.com/templates` while logged in to the divinipress Resend account. For each template ID above, navigate to the template detail view and copy the rendered HTML source (the dashboard exposes "View source" / "HTML" tabs depending on the template type). Save to local files:
- `/tmp/order-confirmed-proofed.html`
- `/tmp/order-received-custom.html`

**Fallback path — direct API:** the Resend npm package ships no CLI (no `bin` field in `node_modules/resend/package.json`); the `resend` symbol is a JS class only. If the dashboard UI is unavailable, the underlying SDK route is `GET https://api.resend.com/templates/<id>` (per `node_modules/resend/dist/index.js` — the same path the Resend SDK uses internally). With `RESEND_API_KEY` exported:

```bash
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/templates/75866903-26c8-4881-9a0c-8b33219e7614 \
  > /tmp/order-confirmed-proofed.html
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/templates/ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf \
  > /tmp/order-received-custom.html
```

If both paths fail (curl returns 404 — the public API may not expose `/templates/<id>` for dashboard-built templates), halt and surface to Imperator. The dashboard UI is the canonical source; if neither it nor the API is accessible, this PR cannot proceed without an alternate verification mechanism.

Expected: both files saved with the actual rendered template HTML content (dashboard UI returns the raw template HTML; API may return JSON-wrapped content — extract the HTML field if so).

- [ ] **Step 2: Grep both templates for `{{#if tax}}` and `{{#if discount}}` blocks.**

Run:

```bash
echo "--- ORDER_CONFIRMED_PROOFED ---"
grep -E '\{\{#if tax\}\}|\{\{#if discount\}\}' /tmp/order-confirmed-proofed.html
echo "--- ORDER_RECEIVED_CUSTOM ---"
grep -E '\{\{#if tax\}\}|\{\{#if discount\}\}' /tmp/order-received-custom.html
```

Expected: BOTH templates print at least one match for `{{#if tax}}` AND at least one for `{{#if discount}}`. The exact engine syntax may be `{{#if tax}}...{{/if}}` or `{% if tax %}...{% endif %}` depending on Resend's template engine — accept either form, but a `{{tax}}` reference outside any conditional fails this check.

- [ ] **Step 3: If both conditionals are present, document and proceed.**

Append a one-line note to the eventual PR description: "Pre-merge dashboard template check passed — both ORDER templates wrap tax/discount rows in conditionals. Empty-string falsy semantics will hide the rows for orders with zero tax/discount."

- [ ] **Step 4: If either conditional is absent, halt and escalate.**

Stop. Do NOT edit the dashboard template. Document the missing conditional with the exact template ID and the surrounding HTML context (e.g., 5 lines before and after where `{{tax}}` appears). Surface to Imperator. The Imperator decides between (a) deferring the customer-facing fix to Slice 2 and accepting that customers will briefly see "Tax: " (empty label, no value) until Slice 2 ships, or (b) authorizing a one-off dashboard edit out-of-band.

---

### Task 6: Refactor the subscriber to use both helpers

> **Confidence: High** — refactor target verified at `custom-order-created.ts:60-152`. SIZE_ORDER constant moves out of the subscriber into the helper file (Task 1 already imports the constant locally; this task removes the duplicate from the subscriber). Manual verification at the end is `yarn dev` + a placed test order; integration tests cannot exercise this path (see Task 7's manual recipe).

**Files:**
- Modify: `src/subscribers/custom-order-created.ts`

- [ ] **Step 1: Replace the per-group inline formatter with `formatEmailLineItemCard()` calls.**

In `src/subscribers/custom-order-created.ts`, the existing handler body at lines 76-111 builds `lineItemsList` via an inline reducer-then-join. Replace that block.

**Find** (lines 76-111):
```typescript
  // Build line items list
  const lineItemsDescriptions = Object.values(groupedItems)
    .filter((items) => items.length > 0 && items[0])
    .map((items) => {
      const firstItem = items[0]!;
      const productName = firstItem.product_title ?? "";

      const color =
        firstItem.variant?.options?.find(
          (option) => option.option?.title === "Color",
        )?.value ?? "";

      const quantities = items
        .filter((item) => item != null)
        .map((item) => {
          const size =
            item.variant?.options?.find(
              (option) => option.option?.title === "Size",
            )?.value ?? "";
          const quantity = item.quantity ?? 0;
          return { size, quantity };
        })
        .sort((a, b) => {
          const indexA = SIZE_ORDER.indexOf(a.size);
          const indexB = SIZE_ORDER.indexOf(b.size);
          return indexA - indexB;
        });

      const quantityStr = quantities
        .map((q) => `${q.size} - ${q.quantity}`)
        .join(", ");

      return `${productName}, Color: ${color}, Quantity (${quantityStr})`;
    });

  const lineItemsList = lineItemsDescriptions.join("<br>");
```

**Replace with:**
```typescript
  // Build line items list — one card per group, concatenated.
  // Helper handles the apparel/non-apparel discriminator internally via
  // the imported isNonApparelProductType predicate. Cards have their own
  // margin-bottom, so cross-card join is empty string (not <br>).
  const lineItemsList = Object.values(groupedItems)
    .filter((items) => items.length > 0 && items[0])
    .map((items) => formatEmailLineItemCard(items as EmailLineItemInput[]).rowHtml)
    .join("");
```

- [ ] **Step 2: Add the helper import at the top of the subscriber.**

In the import block at the top of `src/subscribers/custom-order-created.ts` (currently lines 1-3), add the helper import:

```typescript
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { ProofType } from "@/modules/custom-order";
import { Templates } from "@/modules/resend";
import {
  formatEmailLineItemCard,
  type EmailLineItemInput,
} from "@/modules/resend/utils/format-email-line-item";
```

- [ ] **Step 3: Remove the duplicate `SIZE_ORDER` constant from the subscriber.**

The `SIZE_ORDER` constant at lines 5-20 of the existing subscriber is now defined inside the helper file. Delete the entire constant declaration from the subscriber (lines 5-20). The subscriber no longer references `SIZE_ORDER` directly after Step 1's replacement.

- [ ] **Step 4: Replace the `notificationModuleService.createNotifications` data object with a `buildOrderEmailVariables` call.**

**Find** (lines 121-152, in the existing handler body — line numbers shift after Steps 1 and 3 but the block is structurally identifiable):
```typescript
  await notificationModuleService.createNotifications({
    to: order.customer.email,
    template,
    channel: "email",
    data: {
      customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
      order_id: order.id,
      order_date: new Date(order.created_at).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      order_url: `${config.admin.storefrontUrl}/orders/${order.id}`,
      line_items_list: lineItemsList,
      subtotal: `$${Number(order.subtotal).toFixed(2)}`,
      shipping: `$${Number(order.shipping_total).toFixed(2)}`,
      total: `$${Number(order.total).toFixed(2)}`,
      current_year: new Date().getFullYear().toString(),
      ...(order.tax_total !== 0
        ? {
            tax: `$${Number(order.tax_total).toFixed(2)}`,
            tax_description: "Tax",
          }
        : {}),
      ...(order.discount_total !== 0
        ? {
            discount: `$${Number(order.discount_total).toFixed(2)}`,
            discount_description: "Discount",
          }
        : {}),
    },
  });
```

**Replace with:**
```typescript
  await notificationModuleService.createNotifications({
    to: order.customer.email,
    template,
    channel: "email",
    data: buildOrderEmailVariables({
      order: {
        id: order.id,
        total: order.total,
        subtotal: order.subtotal,
        shipping_total: order.shipping_total,
        tax_total: order.tax_total,
        discount_total: order.discount_total,
        created_at: order.created_at,
      },
      customerName: `${order.customer.first_name} ${order.customer.last_name}`,
      lineItemsList,
      orderUrl: `${config.admin.storefrontUrl}/orders/${order.id}`,
    }),
  });
```

- [ ] **Step 5: Run all unit tests; verify nothing regressed.**

Run: `yarn test:unit`

Expected: every unit test in the repo passes, including the 18 helper tests (Task 1), the 4 validator tests (Task 3), and the 8 subscriber-helper tests (Task 4).

- [ ] **Step 6: Run `yarn build`; verify TypeScript compiles cleanly.**

Run: `yarn build`

Expected: build succeeds. The subscriber's `query.graph` return type may surface a type narrowing concern at the `as EmailLineItemInput[]` cast in Step 1 — this is the spec's "Implementer-time fix, not a spec-level concern" caveat. If the cast is rejected, narrow the input shape with a small mapping function (e.g., map `items` to `{ product_title, quantity, metadata, variant }` explicitly) rather than fighting the structural type.

- [ ] **Step 7: Commit.**

```bash
git add src/subscribers/custom-order-created.ts
git commit -m "refactor(subscribers): consume formatEmailLineItemCard + buildOrderEmailVariables, fix tax/discount silent-drop"
```

---

### Task 7: Seed data sanity check + production-cutover staging gate

> **Confidence: High on grep; Medium on manual verification (depends on staging environment).** Note: unit tests are the **merge gate** — Task 4 case 2 unit-proves the validator silent-drop is fixed. Staging inbox verification is the **production-cutover gate** — confirms the customer-facing render once a real Resend send happens. The two are not interchangeable.

**Files:** None modified. Verification only.

- [ ] **Step 1: Grep seed scripts for any `metadata.product_type` writes on apparel.**

Run: `rg "metadata.*product_type" src/scripts/`

Expected: NO matches in apparel-seed scripts (e.g., `seed.ts`, `seed-apparel.ts`). If a match appears that writes `product_type` on an apparel item, surface to Imperator — the seed needs updating before this PR ships, otherwise apparel orders from those seeds will route to the non-apparel branch and render with empty options.

- [ ] **Step 2: Place a test apparel order against staging (production-cutover gate).**

This is the customer-facing render verification. Against an environment where Resend is actually loaded (per `medusa-config.ts:73-94`, this requires `NODE_ENV !== "development"`, `NODE_ENV !== "test"`, and `RESEND_API_KEY` set), place one apparel order with `tax_total = 0` AND `discount_total = 0`. Confirm the email arrives in inbox AND the rendered email shows clean tax/discount handling (no "Tax: " (empty label) regression — Task 5's grep verified syntax presence; this step verifies the engine semantics actually treat empty strings as falsy).

This is the apparel-no-tax regression catch — the case that was silently dropping in production today.

- [ ] **Step 3: Place a test non-apparel order against staging.**

Confirm the email arrives with the new card format, alphabetically-sorted options, and humanized labels for any options not in `options_labels`.

- [ ] **Step 4: Document the staging verification results in the PR description.**

Required note in the PR description: either (a) "Staging verification: PASSED — apparel-no-tax regression confirmed fixed; non-apparel email rendered correctly," or (b) "Staging verification: deferred — unit tests prove the validator silent-drop is fixed (Task 4 case 2), but customer-facing render not yet verified against a real Resend send. Production cutover blocked on this gate." If (b), the PR can still merge to develop, but the production-cutover blocker must be tracked explicitly.

---

### Task 8: Final build + test gate

> **Confidence: High.**

**Files:** None modified. Verification only.

- [ ] **Step 1: Run the full unit test suite.**

Run: `yarn test:unit`

Expected: all unit tests pass, including the new tests added in Tasks 1, 3, and 4.

- [ ] **Step 2: Run the existing integration test suite.**

Run: `yarn test:integration:http`

Expected: all existing integration tests pass. This spec adds NO integration tests; the suite should behave exactly as it did before this PR.

- [ ] **Step 3: Run `yarn build`.**

Run: `yarn build`

Expected: build succeeds with zero TypeScript errors.

- [ ] **Step 4: Run `yarn format` (Prettier).**

Run: `yarn format`

Expected: any formatting drift in the new/modified files is auto-corrected. If `yarn format` produces changes, commit them.

```bash
git add -A
git diff --cached --stat
git commit -m "chore: prettier-formatted new helper + tests" || echo "(no formatting changes — clean)"
```

- [ ] **Step 5: Push and open the PR.**

```bash
BRANCH="$(git branch --show-current)"
git push -u origin "$BRANCH"
gh pr create --base develop --title "DIV-97: Non-apparel email subscriber retrofit + validator silent-drop fix" --body "$(cat <<'EOF'
## Summary
- New helper `formatEmailLineItemCard` at `src/modules/resend/utils/` renders apparel and non-apparel cards via the imported `isNonApparelProductType` discriminator
- New top-of-file helper `buildOrderEmailVariables` in `custom-order-created.ts` always emits all four tax/discount template variables (empty-string fallback) — fixes the validator silent-drop for orders without both tax AND discount
- 30 new unit tests across three files (helper output, subscriber-helper variables, validator-contract)
- Subscriber refactored to use both helpers; SIZE_ORDER moves into the helper file
- No new integration tests — `medusa-config.ts:73-94` registers no notification provider in `NODE_ENV=test`, so integration coverage is impossible without widening runtime config

## Test plan
- [x] All unit tests pass (`yarn test:unit`)
- [x] Existing integration suite untouched (`yarn test:integration:http`)
- [x] `yarn build` clean
- [x] Loader-safety boot check: `src/modules/resend/utils/__tests__/` invisible to Medusa loaders
- [x] Pre-merge dashboard template check: both ORDER templates wrap tax/discount rows in `{{#if}}` conditionals
- [ ] Staging inbox verification (apparel-no-tax regression catch + non-apparel happy path)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Confidence Map

| Task | Confidence | Reason |
|-|-|-|
| 0 (DIV-99 prerequisite) | High | Imperator explicit; helper import target verified in worktree. |
| 1 (helper file) | High | Spec text + existing subscriber lines 5-20 (SIZE_ORDER), 76-109 (formatter logic) are the source. Helper test cases cover discriminator, branches, edge cases, escape. |
| 2 (loader-safety boot check) | Medium-High | Loader source review confirms safety; empirical precedent absent. Boot-log smoke check is the load-bearing verification. |
| 3 (validator unit tests) | High | Tests existing `service.ts:137-150` behavior; no implementation change needed. |
| 4 (`buildOrderEmailVariables` extraction) | High | Extraction shape mirrors existing subscriber lines 121-152 exactly except for the always-include tax/discount fix. |
| 5 (pre-merge dashboard check) | Medium | Halt-and-surface gate; semantics of empty-string falsy assumed but not verified by automated test. |
| 6 (subscriber refactor) | High | Replacement blocks identified by line ranges + verbatim quote matches. |
| 7 (seed sanity check) | High | Single grep, fast. |
| 8 (build + test gate) | High | Standard CI checks. |

## What This Plan Does Not Include

- **Workflow lift.** Subscribers stay structurally like `password-reset.ts`. Confirmed in spec.
- **Resend dashboard template work.** Slice 2's lane.
- **`custom-order-proof-ready.ts` refactor.** Out of scope per spec.
- **Saved-product creation for non-apparel (DIV-100).** Separate ticket.
- **New email events (proof-approved, tracking-added, etc.).** Each follows as its own subscriber on this same helper.
- **Integration tests for email observability.** Test environment loads no notification provider; do not amend `medusa-config.ts` to fix this per Imperator.
