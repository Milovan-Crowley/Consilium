# DIV-100 — Non-apparel saved product creation on approve-proof — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a non-apparel catalog proof is approved, the backend creates a company-owned saved Medusa product matching the approved configuration. Apparel approve-proof behavior is preserved untouched.

**Architecture:** Branch the existing `approveProof.sideEffects` in `src/api/custom-order/order-flow.ts` on `sourceProduct.metadata.production_option_type` (apparel-class vs everything else). Apparel keeps its current inline implementation. Non-apparel routes to a new helper module `src/api/custom-order/_utils/non-apparel-saved-product.ts` that validates inputs against the source product's promo-print metadata contract, computes retained variants, builds a `createProductsWorkflow` payload, and writes the CompanyProduct row plus Webshop sales-channel link. No Medusa workflow refactor; no idempotency/race hardening; no cart-add lock changes.

**Tech Stack:** TypeScript strict; Medusa.js v2.12.5 (`@medusajs/medusa/core-flows` `createProductsWorkflow`, `link.create`, `query.graph`); MikroORM models; Zod (only for `NonApparelMetadataSchema` cross-references — no new schemas in this phase). Tests: Jest unit (`*.unit.spec.ts`).

**Spec:** `../spec.md`

**Required Medusa Rig skill:** `medusa-dev:building-with-medusa` — every Soldier dispatched on these tasks must invoke this skill on arrival.

---

## File Plan

**Modify**
- `src/api/custom-order/order-flow.ts` — add branch dispatch in `approveProof.sideEffects`. Apparel branch unchanged. Non-apparel branch calls new orchestrator.

**Create**
- `src/api/custom-order/_utils/non-apparel-saved-product.ts` — orchestrator + validators + payload builders for non-apparel saved-product creation.
- `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts` — unit tests for pure validators / payload builders / retention logic.
- `integration-tests/http/approve-proof-non-apparel.spec.ts` — end-to-end integration test for non-apparel approveProof. **Path is flat (no subdirectory)** because `jest.config.js:28` defines `testMatch = ["**/integration-tests/http/*.spec.[jt]s"]` — single-level glob; subdirectories are not picked up.

**Existing apparel regression coverage (do NOT modify)**
- `integration-tests/http/proof-to-catalog.spec.ts` — the apparel `approveProof` regression test lives in `it("proof to catalog flow")` at line 238; the `approveProof` call is at line 466. The test covers the apparel saved-product creation path (Size option, `selections` metadata on variant). It does NOT assert lowest price or `custom_order_id`; those become non-apparel-specific assertions in the new integration test, not apparel-parity claims.

**No changes to**
- `src/_custom/utils/promo-print-product/importer.ts` (importer is the source-of-truth for source product metadata — read-only here).
- `src/modules/company/models/product.ts` (CompanyProduct model — used as-is, non-null `price` column inherited).
- `src/modules/custom-order/non-apparel-type.ts` (`NonApparelMetadataSchema` — used as-is, referenced only).
- `src/modules/custom-order/service.ts` (`hydrateImages` — used as-is at read time, no write-side change needed).

---

## Task 1: Scaffold helper module + wire branch dispatch in approveProof

**Files:**
- Create: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Modify: `src/api/custom-order/order-flow.ts:221-445` (approveProof side-effect block)
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §4 — Branch Contract](../spec.md#4-branch-contract); verified `order-flow.ts:221-445` is the apparel-shaped side-effect today, has no non-apparel branch, and reads `proofType`, line item, source product, source variant before the apparel-specific Color filter (per scout report).

- [ ] **Step 1: Write the failing test for branch dispatch**

Create `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`:

```typescript
import { reduceBranch, isApparelSource, validateBranchAgreement } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — branch dispatch", () => {
  it("reduces source apparel stamp to apparel branch", () => {
    expect(reduceBranch({ production_option_type: "apparel" })).toBe("apparel")
  })
  it("reduces source absent stamp to non-apparel branch", () => {
    expect(reduceBranch({})).toBe("non-apparel")
    expect(reduceBranch(null)).toBe("non-apparel")
    expect(reduceBranch(undefined)).toBe("non-apparel")
  })
  it("reduces source non-apparel product_type-shaped stamp to non-apparel branch", () => {
    expect(reduceBranch({ production_option_type: "print" })).toBe("non-apparel")
    expect(reduceBranch({ production_option_type: "business_cards" })).toBe("non-apparel")
  })
  it("isApparelSource is the apparel-equivalent predicate", () => {
    expect(isApparelSource({ metadata: { production_option_type: "apparel" } })).toBe(true)
    expect(isApparelSource({ metadata: { production_option_type: "print" } })).toBe(false)
    expect(isApparelSource({ metadata: {} })).toBe(false)
    expect(isApparelSource({ metadata: null })).toBe(false)
  })
  it("validateBranchAgreement passes when line-item stamp absent", () => {
    expect(() =>
      validateBranchAgreement(
        { metadata: { production_option_type: "apparel" } },
        { metadata: {} }
      )
    ).not.toThrow()
  })
  it("validateBranchAgreement passes when both reduce to apparel", () => {
    expect(() =>
      validateBranchAgreement(
        { metadata: { production_option_type: "apparel" } },
        { metadata: { production_option_type: "apparel" } }
      )
    ).not.toThrow()
  })
  it("validateBranchAgreement passes when both reduce to non-apparel (line item carries product_type)", () => {
    expect(() =>
      validateBranchAgreement(
        { metadata: {} },
        { metadata: { production_option_type: "print" } }
      )
    ).not.toThrow()
  })
  it("validateBranchAgreement throws on disagreement", () => {
    expect(() =>
      validateBranchAgreement(
        { metadata: { production_option_type: "apparel" } },
        { metadata: { production_option_type: "print" } }
      )
    ).toThrow(/branch.*disagree/i)
    expect(() =>
      validateBranchAgreement(
        { metadata: {} },
        { metadata: { production_option_type: "apparel" } }
      )
    ).toThrow(/branch.*disagree/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — module `../_utils/non-apparel-saved-product` not found.

- [ ] **Step 3: Create scaffold helper file with branch reducers**

Create `src/api/custom-order/_utils/non-apparel-saved-product.ts`:

```typescript
import type { MedusaContainer } from "@medusajs/framework/types"

export type Branch = "apparel" | "non-apparel"

type WithMetadata = { metadata?: Record<string, unknown> | null }

export function reduceBranch(metadata: Record<string, unknown> | null | undefined): Branch {
  return metadata && metadata.production_option_type === "apparel" ? "apparel" : "non-apparel"
}

export function isApparelSource(source: WithMetadata): boolean {
  return reduceBranch(source.metadata) === "apparel"
}

export function validateBranchAgreement(source: WithMetadata, lineItem: WithMetadata): void {
  const sourceBranch = reduceBranch(source.metadata)
  const lineStamp = lineItem.metadata?.production_option_type
  if (lineStamp == null) return
  const lineBranch = reduceBranch(lineItem.metadata)
  if (sourceBranch !== lineBranch) {
    throw new Error(
      `Source product and line-item branch signals disagree (source=${sourceBranch}, lineItem=${lineBranch})`
    )
  }
}

export async function createNonApparelSavedProduct(_args: {
  container: MedusaContainer
  customOrder: any
  orderLineItem: any
  sourceProduct: any
  sourceVariants: any[]
  companyId: string
}): Promise<{ savedProductId: string }> {
  throw new Error("createNonApparelSavedProduct not implemented")
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Wire branch dispatch into approveProof.sideEffects**

Modify `src/api/custom-order/order-flow.ts`. Insert the branch dispatch **between line 297 and line 299** — immediately after the existing `if (!variant) { throw new Error("Variant not found"); }` guard at line 295-297, and immediately before the `selectionsMetadata` resolution block at line 299. The live local binding for the source product is named `product` (declared at line 263 as `const { data: [product] } = ...`), NOT `sourceProduct` — DO NOT rename the live binding (12+ existing references in the apparel branch); use `product` in the helper call.

```typescript
// add to imports near the top of the file
import {
  isApparelSource,
  validateBranchAgreement,
  createNonApparelSavedProduct,
} from "@/api/custom-order/_utils/non-apparel-saved-product"

// inside approveProof.sideEffects, BETWEEN line 297 and line 299:
validateBranchAgreement(product, orderLineItem)

if (!isApparelSource(product)) {
  await createNonApparelSavedProduct({
    container: req.scope,
    customOrder,
    orderLineItem,
    sourceProduct: product,
    sourceVariants: /* all-variants query.graph result; see Task 7 step 4 */ [],
    companyId,
  })
  return
}

// existing apparel code (lines 299-445) remains unchanged below this point
```

The non-apparel branch returns BEFORE the apparel-specific `selectedColor` resolver at line 321-323 (`if (!selectedColor) throw new Error("Selected color not found")`), so non-apparel approvals never enter apparel resolution. Note: the helper function takes a `sourceProduct` parameter (renamed at the helper boundary for clarity); the call site passes the live `product` binding into that named parameter. Soldiers MUST invoke `medusa-dev:building-with-medusa` to confirm `req.scope` is the correct container reference for this call site.

- [ ] **Step 6: Run unit tests + apparel regression check**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: PASS.

Run: `yarn test:integration:http -t "proof to catalog flow"`
Expected: the apparel approveProof regression at `integration-tests/http/proof-to-catalog.spec.ts:466+` (inside `it("proof to catalog flow")` at line 238) passes unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts \
        src/api/custom-order/order-flow.ts
git commit -m "feat(div-100): scaffold non-apparel saved-product branch dispatch in approveProof"
```

---

## Task 2: Approved-configuration validation against source `options_values`

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §5 — Approved Configuration](../spec.md#5-approved-configuration); `NonApparelMetadataSchema` only proves `Record<string, string>` shape (verified at `src/modules/custom-order/non-apparel-type.ts:14-28`); `options_values` lives on source product metadata as `Record<string, string[]>` (verified at `src/_custom/utils/promo-print-product/importer.ts:99-105`).

- [ ] **Step 1: Add failing tests for approved-options validation**

Append to `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`:

```typescript
import { validateApprovedOptions } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — approved options validation", () => {
  const source = {
    metadata: {
      base_option_keys: ["paper_type", "quantity"],
      multiplier_keys: ["finish"],
      options_values: {
        paper_type: ["matte", "glossy"],
        quantity: ["500", "1000"],
        finish: ["uv", "aqueous"],
      },
    },
  }

  it("passes for fully populated, declared values", () => {
    expect(() =>
      validateApprovedOptions(
        { paper_type: "matte", quantity: "500", finish: "uv" },
        source
      )
    ).not.toThrow()
  })

  it("throws when options map is missing", () => {
    expect(() => validateApprovedOptions(undefined, source)).toThrow(/options.*absent|malformed/i)
    expect(() => validateApprovedOptions(null, source)).toThrow(/options.*absent|malformed/i)
  })

  it("throws when options is not a plain object map", () => {
    expect(() => validateApprovedOptions([] as any, source)).toThrow(/options.*malformed/i)
    expect(() => validateApprovedOptions("matte" as any, source)).toThrow(/options.*malformed/i)
  })

  it("throws when a base code is missing", () => {
    expect(() =>
      validateApprovedOptions({ paper_type: "matte", finish: "uv" }, source)
    ).toThrow(/missing.*quantity/i)
  })

  it("throws when a multiplier code is missing", () => {
    expect(() =>
      validateApprovedOptions({ paper_type: "matte", quantity: "500" }, source)
    ).toThrow(/missing.*finish/i)
  })

  it("throws when a value is empty or whitespace-only", () => {
    expect(() =>
      validateApprovedOptions({ paper_type: "", quantity: "500", finish: "uv" }, source)
    ).toThrow(/empty/i)
    expect(() =>
      validateApprovedOptions({ paper_type: "   ", quantity: "500", finish: "uv" }, source)
    ).toThrow(/empty/i)
  })

  it("throws when a value is not a string", () => {
    expect(() =>
      validateApprovedOptions({ paper_type: 5 as any, quantity: "500", finish: "uv" }, source)
    ).toThrow(/string/i)
  })

  it("throws when a base value is not declared in source options_values", () => {
    expect(() =>
      validateApprovedOptions(
        { paper_type: "transparent", quantity: "500", finish: "uv" },
        source
      )
    ).toThrow(/paper_type.*not declared/i)
  })

  it("throws when a multiplier value is not declared in source options_values", () => {
    expect(() =>
      validateApprovedOptions(
        { paper_type: "matte", quantity: "500", finish: "metallic" },
        source
      )
    ).toThrow(/finish.*not declared/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — `validateApprovedOptions` not exported.

- [ ] **Step 3: Implement `validateApprovedOptions`**

Insert into `src/api/custom-order/_utils/non-apparel-saved-product.ts`:

```typescript
type SourceMetadataView = {
  base_option_keys: string[]
  multiplier_keys: string[]
  options_values: Record<string, string[]>
}

function readSourceMeta(source: any): SourceMetadataView {
  const metadata = (source?.metadata ?? {}) as Record<string, unknown>
  return {
    base_option_keys: (metadata.base_option_keys as string[]) ?? [],
    multiplier_keys: (metadata.multiplier_keys as string[]) ?? [],
    options_values: (metadata.options_values as Record<string, string[]>) ?? {},
  }
}

export function validateApprovedOptions(
  options: unknown,
  source: { metadata?: Record<string, unknown> | null }
): asserts options is Record<string, string> {
  if (options == null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("Approved options map is absent or malformed")
  }
  const map = options as Record<string, unknown>
  const { base_option_keys, multiplier_keys, options_values } = readSourceMeta(source)
  const requiredCodes = [...base_option_keys, ...multiplier_keys]
  for (const code of requiredCodes) {
    const raw = map[code]
    if (raw === undefined) {
      throw new Error(`Approved options missing required code "${code}"`)
    }
    if (typeof raw !== "string") {
      throw new Error(`Approved options value for "${code}" must be a string`)
    }
    if (raw.trim().length === 0) {
      throw new Error(`Approved options value for "${code}" is empty`)
    }
    const declared = options_values[code]
    if (!Array.isArray(declared) || !declared.includes(raw)) {
      throw new Error(`Approved options value "${raw}" for "${code}" is not declared in source options_values`)
    }
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all approved-options tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts
git commit -m "feat(div-100): validate approved line-item options against source options_values"
```

---

## Task 3: Source-product sanity validation

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §6 — Source Product Sanity](../spec.md#6-source-product-sanity); the importer writes `options_order`, `options_labels`, `options_values`, `base_option_keys`, `multiplier_keys`, `multipliers` (verified at `src/_custom/utils/promo-print-product/importer.ts:80-130`); per spec §6 confidence prose, Medusa's `createProductVariantsStep` does NOT validate option titles — it auto-creates phantom options on label drift, so stale-label detection MUST happen at approval time.

- [ ] **Step 1: Add failing tests for source sanity**

Append:

```typescript
import { validateSourceProductMetadata } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — source product sanity", () => {
  const goodSource = {
    handle: "biz-cards",
    metadata: {
      base_option_keys: ["paper_type", "quantity"],
      multiplier_keys: ["finish"],
      options_order: ["paper_type", "finish", "quantity"],
      options_labels: { paper_type: "Paper Type", finish: "Finish", quantity: "Quantity" },
      options_values: {
        paper_type: ["matte", "glossy"],
        finish: ["uv", "aqueous"],
        quantity: ["500", "1000"],
      },
      multipliers: { finish: { "500": { uv: 1.1, aqueous: 1.0 } } },
    },
    options: [
      { title: "Paper Type", values: [{ value: "matte" }, { value: "glossy" }] },
      { title: "Quantity", values: [{ value: "500" }, { value: "1000" }] },
    ],
  }

  it("passes on a well-formed source product", () => {
    expect(() => validateSourceProductMetadata(goodSource)).not.toThrow()
  })

  it("throws when base_option_keys is missing", () => {
    const s = { ...goodSource, metadata: { ...goodSource.metadata, base_option_keys: undefined } }
    expect(() => validateSourceProductMetadata(s)).toThrow(/base_option_keys/i)
  })

  it("throws when multiplier_keys is missing entirely (must be present, even if empty)", () => {
    const s = { ...goodSource, metadata: { ...goodSource.metadata, multiplier_keys: undefined } }
    expect(() => validateSourceProductMetadata(s)).toThrow(/multiplier_keys/i)
  })

  it("accepts empty multiplier_keys + missing multipliers table", () => {
    const s = {
      ...goodSource,
      metadata: { ...goodSource.metadata, multiplier_keys: [], multipliers: undefined },
    }
    expect(() => validateSourceProductMetadata(s)).not.toThrow()
  })

  it("throws when multiplier_keys non-empty but multipliers table missing", () => {
    const s = { ...goodSource, metadata: { ...goodSource.metadata, multipliers: undefined } }
    expect(() => validateSourceProductMetadata(s)).toThrow(/multipliers/i)
  })

  it("throws when quantity is not in base_option_keys", () => {
    const s = { ...goodSource, metadata: { ...goodSource.metadata, base_option_keys: ["paper_type"] } }
    expect(() => validateSourceProductMetadata(s)).toThrow(/quantity.*base_option_keys/i)
  })

  it("throws when an options_order code is missing from options_labels", () => {
    const s = {
      ...goodSource,
      metadata: { ...goodSource.metadata, options_labels: { paper_type: "Paper Type", quantity: "Quantity" } },
    }
    expect(() => validateSourceProductMetadata(s)).toThrow(/finish.*options_labels/i)
  })

  it("throws when an options_order code is missing from options_values", () => {
    const s = {
      ...goodSource,
      metadata: {
        ...goodSource.metadata,
        options_values: { paper_type: ["matte"], quantity: ["500"] },
      },
    }
    expect(() => validateSourceProductMetadata(s)).toThrow(/finish.*options_values/i)
  })

  it("throws when a base option label does not match any source variant option title", () => {
    const s = {
      ...goodSource,
      metadata: {
        ...goodSource.metadata,
        options_labels: { paper_type: "Paper Stock", finish: "Finish", quantity: "Quantity" },
      },
    }
    expect(() => validateSourceProductMetadata(s)).toThrow(/Paper Stock.*variant option/i)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — `validateSourceProductMetadata` not exported.

- [ ] **Step 3: Implement `validateSourceProductMetadata`**

Insert:

```typescript
export function validateSourceProductMetadata(source: any): void {
  const metadata = (source?.metadata ?? {}) as Record<string, unknown>
  const handle = source?.handle ?? "(unknown handle)"

  const baseKeys = metadata.base_option_keys
  if (!Array.isArray(baseKeys) || baseKeys.some((k) => typeof k !== "string")) {
    throw new Error(`Source ${handle}: base_option_keys must be a string array`)
  }
  const multKeys = metadata.multiplier_keys
  if (!Array.isArray(multKeys) || multKeys.some((k) => typeof k !== "string")) {
    throw new Error(`Source ${handle}: multiplier_keys must be a string array (use [] for none)`)
  }
  const order = metadata.options_order
  if (!Array.isArray(order) || order.some((k) => typeof k !== "string")) {
    throw new Error(`Source ${handle}: options_order must be a string array`)
  }
  const labels = metadata.options_labels
  if (!labels || typeof labels !== "object" || Array.isArray(labels)) {
    throw new Error(`Source ${handle}: options_labels must be an object`)
  }
  const values = metadata.options_values
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error(`Source ${handle}: options_values must be an object`)
  }

  for (const code of baseKeys as string[]) {
    if (!(order as string[]).includes(code)) {
      throw new Error(`Source ${handle}: base_option_keys code "${code}" missing from options_order`)
    }
  }
  for (const code of multKeys as string[]) {
    if (!(order as string[]).includes(code)) {
      throw new Error(`Source ${handle}: multiplier_keys code "${code}" missing from options_order`)
    }
  }
  for (const code of order as string[]) {
    if (!(code in (labels as Record<string, unknown>))) {
      throw new Error(`Source ${handle}: options_order code "${code}" missing from options_labels`)
    }
    if (!(code in (values as Record<string, unknown>))) {
      throw new Error(`Source ${handle}: options_order code "${code}" missing from options_values`)
    }
  }

  if (!(baseKeys as string[]).includes("quantity")) {
    throw new Error(`Source ${handle}: "quantity" must appear in base_option_keys`)
  }

  if ((multKeys as string[]).length > 0) {
    const multipliers = metadata.multipliers
    if (!multipliers || typeof multipliers !== "object" || Array.isArray(multipliers)) {
      throw new Error(`Source ${handle}: multipliers table required when multiplier_keys is non-empty`)
    }
    for (const code of multKeys as string[]) {
      if (!(code in (multipliers as Record<string, unknown>))) {
        throw new Error(`Source ${handle}: multipliers table missing entry for "${code}"`)
      }
    }
  }

  const variantOptionTitles = new Set<string>()
  for (const opt of (source?.options ?? []) as Array<{ title?: string }>) {
    if (typeof opt?.title === "string") variantOptionTitles.add(opt.title)
  }
  for (const code of baseKeys as string[]) {
    const label = (labels as Record<string, string>)[code]
    if (typeof label === "string" && !variantOptionTitles.has(label)) {
      throw new Error(
        `Source ${handle}: base option label "${label}" (code "${code}") does not match any source variant option title`
      )
    }
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all sanity tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts
git commit -m "feat(div-100): validate source product promo-print metadata sanity at approval"
```

---

## Task 4: Variant retention + quantity tier derivation

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §8 — Variant Retention](../spec.md#8-variant-retention); ordering is taken from `source.metadata.options_values.quantity` (importer-deterministic per `importer.ts:99-105`) filtered to retained quantities. Quantity-only base grids retain all variants per spec §8.

- [ ] **Step 1: Add failing tests for retention**

Append:

```typescript
import { retainVariantsForApproved } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — variant retention", () => {
  const sourceMeta = {
    base_option_keys: ["paper_type", "quantity"],
    multiplier_keys: ["finish"],
    options_values: {
      paper_type: ["matte", "glossy"],
      finish: ["uv", "aqueous"],
      quantity: ["1000", "500", "250"], // CSV-declared order, not numerical
    },
    options_labels: { paper_type: "Paper Type", finish: "Finish", quantity: "Quantity" },
  }
  const variants = [
    { id: "v1", options: [{ option: { title: "Paper Type" }, value: "matte" }, { option: { title: "Quantity" }, value: "500" }] },
    { id: "v2", options: [{ option: { title: "Paper Type" }, value: "matte" }, { option: { title: "Quantity" }, value: "1000" }] },
    { id: "v3", options: [{ option: { title: "Paper Type" }, value: "glossy" }, { option: { title: "Quantity" }, value: "500" }] },
  ]
  const source = { handle: "biz-cards", metadata: sourceMeta }

  it("retains variants matching the locked base values", () => {
    const out = retainVariantsForApproved(
      source,
      { paper_type: "matte", quantity: "500", finish: "uv" },
      variants
    )
    expect(out.retained.map((v) => v.id)).toEqual(["v1", "v2"])
  })

  it("derives quantity tiers in source declared order, filtered to retained", () => {
    const out = retainVariantsForApproved(
      source,
      { paper_type: "matte", quantity: "500", finish: "uv" },
      variants
    )
    expect(out.quantityTiers).toEqual(["1000", "500"]) // declared order, "250" excluded (no retained variant)
  })

  it("retains all variants when lockedBaseKeys is empty (quantity-only grid)", () => {
    const qOnlySource = {
      handle: "qty-only",
      metadata: {
        ...sourceMeta,
        base_option_keys: ["quantity"],
        multiplier_keys: [],
      },
    }
    const qOnlyVariants = [
      { id: "qv1", options: [{ option: { title: "Quantity" }, value: "500" }] },
      { id: "qv2", options: [{ option: { title: "Quantity" }, value: "1000" }] },
    ]
    const out = retainVariantsForApproved(
      qOnlySource,
      { quantity: "500" },
      qOnlyVariants
    )
    expect(out.retained.map((v) => v.id)).toEqual(["qv1", "qv2"])
    expect(out.quantityTiers).toEqual(["1000", "500"])
  })

  it("throws when no variants match the locked base values", () => {
    expect(() =>
      retainVariantsForApproved(
        source,
        { paper_type: "transparent", quantity: "500", finish: "uv" },
        variants
      )
    ).toThrow(/no variants retained.*biz-cards.*paper_type.*transparent/i)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — `retainVariantsForApproved` not exported.

- [ ] **Step 3: Implement retention**

Insert:

```typescript
type SourceVariant = {
  id: string
  options?: Array<{ option?: { title?: string } | null; value?: string }>
  prices?: Array<{ amount: number; currency_code: string }>
  metadata?: Record<string, unknown> | null
  title?: string
  sku?: string | null
  upc?: string | null
}

export function retainVariantsForApproved(
  source: any,
  approvedOptions: Record<string, string>,
  sourceVariants: SourceVariant[]
): { retained: SourceVariant[]; quantityTiers: string[] } {
  const metadata = (source?.metadata ?? {}) as Record<string, unknown>
  const baseKeys = (metadata.base_option_keys as string[]) ?? []
  const labels = (metadata.options_labels as Record<string, string>) ?? {}
  const allQuantities = ((metadata.options_values as Record<string, string[]>) ?? {}).quantity ?? []
  const lockedBaseKeys = baseKeys.filter((k) => k !== "quantity")

  const matchesLockedBase = (v: SourceVariant): boolean => {
    for (const code of lockedBaseKeys) {
      const label = labels[code]
      const approved = approvedOptions[code]
      const variantValue = v.options?.find((o) => o.option?.title === label)?.value
      if (variantValue !== approved) return false
    }
    return true
  }

  const retained = sourceVariants.filter(matchesLockedBase)
  if (retained.length === 0) {
    const handle = source?.handle ?? "(unknown handle)"
    const lockedDesc = lockedBaseKeys
      .map((c) => `${c}=${approvedOptions[c] ?? "?"}`)
      .join(", ")
    throw new Error(
      `No variants retained for source "${handle}" with locked base [${lockedDesc}]`
    )
  }

  const quantityLabel = labels.quantity
  const retainedQuantitySet = new Set<string>()
  for (const v of retained) {
    const q = v.options?.find((o) => o.option?.title === quantityLabel)?.value
    if (typeof q === "string") retainedQuantitySet.add(q)
  }
  const quantityTiers = allQuantities.filter((q) => retainedQuantitySet.has(q))

  return { retained, quantityTiers }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all retention tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts
git commit -m "feat(div-100): retain variants matching locked base values and derive quantity tiers"
```

---

## Task 5: Saved-product payload builder (product + options + metadata narrowing)

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §9 — Saved Product Shape](../spec.md#9-saved-product-shape); preserves source metadata adding `custom_order_id` and narrowing `options_values` per spec; medusa product options use `options_order` order filtered to base codes; option titles come from `options_labels[code]`.

- [ ] **Step 1: Add failing tests for the product payload builder**

Append:

```typescript
import { buildSavedProductPayload } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — product payload builder", () => {
  const source = {
    id: "prod_src",
    handle: "biz-cards",
    title: "Business Cards",
    description: "Paper rectangles",
    subtitle: null,
    thumbnail: "https://cdn/example.png",
    images: [{ url: "https://cdn/a.png" }],
    external_id: "ext_001",
    type_id: "ptype_print",
    tags: [{ id: "tag_a" }, { id: "tag_b" }],
    categories: [{ id: "cat_1" }, { id: null }, null],
    metadata: {
      product_type: "print",
      short_description: "Premium cards",
      base_option_keys: ["paper_type", "quantity"],
      multiplier_keys: ["finish"],
      options_order: ["paper_type", "finish", "quantity"],
      options_labels: { paper_type: "Paper Type", finish: "Finish", quantity: "Quantity" },
      options_values: {
        paper_type: ["matte", "glossy"],
        finish: ["uv", "aqueous"],
        quantity: ["1000", "500", "250"],
      },
      multipliers: { finish: { "500": { uv: 1.1, aqueous: 1.0 } } },
    },
  }
  const customOrder = { id: "co_xyz", product_name: "My Cards" }
  const approvedOptions = { paper_type: "matte", quantity: "500", finish: "uv" }
  const quantityTiers = ["1000", "500"]

  it("uses customOrder.product_name as title when present", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.title).toBe("My Cards")
  })

  it("falls back to source title when customOrder.product_name is empty/whitespace/missing", () => {
    expect(
      buildSavedProductPayload({
        source,
        customOrder: { id: "co_xyz", product_name: "" },
        approvedOptions,
        quantityTiers,
      }).title
    ).toBe("Business Cards")
    expect(
      buildSavedProductPayload({
        source,
        customOrder: { id: "co_xyz", product_name: "   " },
        approvedOptions,
        quantityTiers,
      }).title
    ).toBe("Business Cards")
    expect(
      buildSavedProductPayload({
        source,
        customOrder: { id: "co_xyz", product_name: null },
        approvedOptions,
        quantityTiers,
      }).title
    ).toBe("Business Cards")
  })

  it("derives a unique handle from the source handle (suffix non-empty, prefix preserved)", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.handle.startsWith("biz-cards-")).toBe(true)
    expect(out.handle.length).toBeGreaterThan("biz-cards-".length)
  })

  it("preserves description, subtitle, thumbnail, images, external_id, type_id", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.description).toBe(source.description)
    expect(out.subtitle).toBeNull()
    expect(out.thumbnail).toBe(source.thumbnail)
    expect(out.images).toEqual(source.images)
    expect(out.external_id).toBe(source.external_id)
    expect(out.type_id).toBe(source.type_id)
  })

  it("maps tags to tag_ids and filters category nulls", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.tag_ids).toEqual(["tag_a", "tag_b"])
    expect(out.category_ids).toEqual(["cat_1"])
  })

  it("sets status published", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.status).toBe("published")
  })

  it("emits Medusa product options for each base code in options_order order using options_labels titles", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.options).toEqual([
      { title: "Paper Type", values: ["matte"] },
      { title: "Quantity", values: ["1000", "500"] },
    ])
  })

  it("preserves source metadata, adds custom_order_id, narrows options_values", () => {
    const out = buildSavedProductPayload({ source, customOrder, approvedOptions, quantityTiers })
    expect(out.metadata.custom_order_id).toBe("co_xyz")
    expect(out.metadata.product_type).toBe("print")
    expect(out.metadata.short_description).toBe("Premium cards")
    expect(out.metadata.base_option_keys).toEqual(["paper_type", "quantity"])
    expect(out.metadata.multiplier_keys).toEqual(["finish"])
    expect(out.metadata.options_order).toEqual(["paper_type", "finish", "quantity"])
    expect(out.metadata.options_values).toEqual({
      paper_type: ["matte"],
      finish: ["uv"],
      quantity: ["1000", "500"],
    })
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — `buildSavedProductPayload` not exported.

- [ ] **Step 3: Implement `buildSavedProductPayload`**

Insert:

```typescript
import { randomUUID } from "node:crypto"

export type SavedProductPayload = {
  title: string
  handle: string
  description: string | null
  subtitle: string | null
  thumbnail: string | null
  images: Array<{ url: string }> | null
  external_id: string | null
  type_id: string | null
  tag_ids: string[]
  category_ids: string[]
  status: "published"
  options: Array<{ title: string; values: string[] }>
  metadata: Record<string, unknown>
}

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0
}

export function buildSavedProductPayload(args: {
  source: any
  customOrder: { id: string; product_name?: string | null }
  approvedOptions: Record<string, string>
  quantityTiers: string[]
}): SavedProductPayload {
  const { source, customOrder, approvedOptions, quantityTiers } = args
  const metadata = (source?.metadata ?? {}) as Record<string, unknown>
  const baseKeys = (metadata.base_option_keys as string[]) ?? []
  const multKeys = (metadata.multiplier_keys as string[]) ?? []
  const order = (metadata.options_order as string[]) ?? []
  const labels = (metadata.options_labels as Record<string, string>) ?? {}
  const values = (metadata.options_values as Record<string, string[]>) ?? {}

  const title = nonEmpty(customOrder.product_name) ? customOrder.product_name!.trim() : source.title

  const options = order
    .filter((code) => baseKeys.includes(code))
    .map((code) => ({
      title: labels[code],
      values: code === "quantity" ? quantityTiers : [approvedOptions[code]],
    }))

  const narrowedValues: Record<string, string[]> = { ...values }
  for (const code of baseKeys) {
    narrowedValues[code] = code === "quantity" ? quantityTiers : [approvedOptions[code]]
  }
  for (const code of multKeys) {
    narrowedValues[code] = [approvedOptions[code]]
  }

  return {
    title,
    handle: `${source.handle}-${randomUUID().slice(0, 8)}`,
    description: source.description ?? null,
    subtitle: source.subtitle ?? null,
    thumbnail: source.thumbnail ?? null,
    images: source.images ?? null,
    external_id: source.external_id ?? null,
    type_id: source.type_id ?? null,
    tag_ids: ((source.tags ?? []) as Array<{ id: string }>).map((t) => t.id),
    category_ids: ((source.categories ?? []) as Array<{ id?: string | null } | null>)
      .map((c) => c?.id)
      .filter((id): id is string => typeof id === "string"),
    status: "published",
    options,
    metadata: {
      ...metadata,
      options_values: narrowedValues,
      custom_order_id: customOrder.id,
    },
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all product-payload tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts
git commit -m "feat(div-100): build saved Medusa product payload with narrowed options_values"
```

---

## Task 6: Saved-variant payload builder + lowest-price computation

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts`
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`

> **Confidence: High** — implements [spec §10 — Saved Variant Shape](../spec.md#10-saved-variant-shape) and the price-presence guard from [spec §11 — Company Ownership And Sales Channel](../spec.md#11-company-ownership-and-sales-channel); does NOT copy `sku`, `upc`, `barcode`, `ean` to top-level (Medusa partial unique index `WHERE deleted_at IS NULL`); records `original_sku`/`original_upc` in metadata; intentionally drops `barcode`/`ean` (apparel parity); strips any apparel `selections` key from preserved variant metadata.

- [ ] **Step 1: Add failing tests for variant payloads + lowest price**

Append:

```typescript
import { buildSavedVariantPayloads, computeLowestRetainedPrice } from "../_utils/non-apparel-saved-product"

describe("non-apparel saved-product — variant payloads", () => {
  const labels = { paper_type: "Paper Type", quantity: "Quantity" }
  const retained = [
    {
      id: "v_src_1",
      title: "Business Cards - matte - 500",
      sku: "BC-M-500",
      upc: "0000000001",
      barcode: "BC0001",
      ean: "EAN0001",
      prices: [{ amount: 5000, currency_code: "usd" }],
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "500" },
      ],
      metadata: { custom_color: "ivory", selections: ["legacy_artwork"] },
    },
    {
      id: "v_src_2",
      title: "Business Cards - matte - 1000",
      sku: "BC-M-1000",
      upc: "0000000002",
      prices: [{ amount: 8500, currency_code: "usd" }],
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "1000" },
      ],
      metadata: null,
    },
  ]
  const customOrder = { id: "co_xyz" }

  it("preserves title, prices, and option-value map", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0].title).toBe("Business Cards - matte - 500")
    expect(out[0].prices).toEqual([{ amount: 5000, currency_code: "usd" }])
    expect(out[0].options).toEqual({ "Paper Type": "matte", "Quantity": "500" })
  })

  it("never copies sku/upc/barcode/ean to top-level", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0]).not.toHaveProperty("sku")
    expect(out[0]).not.toHaveProperty("upc")
    expect(out[0]).not.toHaveProperty("barcode")
    expect(out[0]).not.toHaveProperty("ean")
  })

  it("records original_variant_id, original_sku, original_upc, original_title in metadata", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0].metadata.original_variant_id).toBe("v_src_1")
    expect(out[0].metadata.original_sku).toBe("BC-M-500")
    expect(out[0].metadata.original_upc).toBe("0000000001")
    expect(out[0].metadata.original_title).toBe("Business Cards - matte - 500")
  })

  it("does not record original_barcode or original_ean (intentional drop, apparel parity)", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0].metadata).not.toHaveProperty("original_barcode")
    expect(out[0].metadata).not.toHaveProperty("original_ean")
  })

  it("preserves source variant metadata except for apparel selections", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0].metadata.custom_color).toBe("ivory")
    expect(out[0].metadata).not.toHaveProperty("selections")
  })

  it("adds design_notes to metadata when present", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: "Use brand red" })
    expect(out[0].metadata.design_notes).toBe("Use brand red")
    expect(out[1].metadata.design_notes).toBe("Use brand red")
  })

  it("omits design_notes from metadata when absent", () => {
    const out = buildSavedVariantPayloads({ retained, labels, customOrder, designNotes: undefined })
    expect(out[0].metadata).not.toHaveProperty("design_notes")
  })
})

describe("non-apparel saved-product — lowest retained price", () => {
  it("returns the lowest amount across retained variants", () => {
    const out = computeLowestRetainedPrice([
      { id: "v1", prices: [{ amount: 5000, currency_code: "usd" }] },
      { id: "v2", prices: [{ amount: 3000, currency_code: "usd" }, { amount: 4000, currency_code: "usd" }] },
    ] as any)
    expect(out).toBe(3000)
  })

  it("throws when any retained variant has no prices", () => {
    expect(() =>
      computeLowestRetainedPrice([
        { id: "v1", prices: [{ amount: 5000, currency_code: "usd" }] },
        { id: "v2", prices: [] },
      ] as any)
    ).toThrow(/v2.*no prices/i)
  })

  it("throws when prices array is missing", () => {
    expect(() =>
      computeLowestRetainedPrice([
        { id: "v1" },
      ] as any)
    ).toThrow(/v1.*no prices/i)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — both functions not exported.

- [ ] **Step 3: Implement `buildSavedVariantPayloads` and `computeLowestRetainedPrice`**

Insert:

```typescript
export type SavedVariantPayload = {
  title: string
  manage_inventory: false
  prices: Array<{ amount: number; currency_code: string }>
  options: Record<string, string>
  metadata: Record<string, unknown>
}

export function buildSavedVariantPayloads(args: {
  retained: SourceVariant[]
  labels: Record<string, string>
  customOrder: { id: string }
  designNotes: string | undefined
}): SavedVariantPayload[] {
  const { retained, labels, customOrder, designNotes } = args
  const labelByTitle = new Set(Object.values(labels))

  return retained.map((v) => {
    const optionMap: Record<string, string> = {}
    for (const o of v.options ?? []) {
      const t = o?.option?.title
      const val = o?.value
      if (typeof t === "string" && labelByTitle.has(t) && typeof val === "string") {
        optionMap[t] = val
      }
    }

    const sourceMeta = (v.metadata && typeof v.metadata === "object" ? { ...v.metadata } : {}) as Record<string, unknown>
    delete sourceMeta.selections

    const metadata: Record<string, unknown> = {
      ...sourceMeta,
      original_variant_id: v.id,
      original_sku: v.sku ?? null,
      original_upc: v.upc ?? null,
      original_title: v.title ?? null,
    }
    if (designNotes !== undefined) {
      metadata.design_notes = designNotes
    }

    return {
      title: v.title ?? "",
      manage_inventory: false as const,
      prices: (v.prices ?? []).map((p) => ({ amount: p.amount, currency_code: p.currency_code })),
      options: optionMap,
      metadata,
    }
  })
}

export function computeLowestRetainedPrice(retained: SourceVariant[]): number {
  let lowest: number | null = null
  for (const v of retained) {
    const prices = v.prices ?? []
    if (prices.length === 0) {
      throw new Error(`Retained variant ${v.id} has no prices`)
    }
    for (const p of prices) {
      if (lowest === null || p.amount < lowest) lowest = p.amount
    }
  }
  if (lowest === null) {
    throw new Error("Retained variants array was empty when computing lowest price")
  }
  return lowest
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all variant + lowest-price tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts
git commit -m "feat(div-100): build saved variant payloads and compute lowest retained price"
```

---

## Task 7: Orchestrator wiring — query.graph, createProductsWorkflow, links

**Files:**
- Modify: `src/api/custom-order/_utils/non-apparel-saved-product.ts` (replace `createNonApparelSavedProduct` body)
- Modify: `src/api/custom-order/order-flow.ts` (pass `sourceVariants` from existing all-variants query)
- Test: `src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts` (orchestrator unit test against mocked container — narrow surface)

> **Confidence: Medium** — implements [spec §11 — Company Ownership And Sales Channel](../spec.md#11-company-ownership-and-sales-channel) and the orchestrator described across [spec §4–§13](../spec.md). Wires `createProductsWorkflow` from `@medusajs/medusa/core-flows` (verified at `order-flow.ts:349-404` for apparel branch), the company module via `req.scope.resolve(COMPANY_MODULE)` where `COMPANY_MODULE = "company"` (verified at `src/modules/company/index.ts:5` and used at `order-flow.ts:407`), `link.create` for Product↔CompanyProduct (verified at `order-flow.ts:415-423`), the sales-channel module via `req.scope.resolve(Modules.SALES_CHANNEL)` (which expands to the literal `"sales_channel"`, verified at `order-flow.ts:425`), `salesChannelService.listSalesChannels({ name: "Webshop" })` (verified at `order-flow.ts:425-428`), and `link.create` for Product↔SalesChannel (verified at `order-flow.ts:431-438`). The literal strings `"salesChannelService"` and `"companyModuleService"` are NOT registered Awilix keys — calling `container.resolve` with either throws `AwilixResolutionError`. Confidence is Medium because the orchestrator coordinates multiple Medusa services and the precise call shapes must be verified by the Soldier with `medusa-dev:building-with-medusa` Rig before committing.

- [ ] **Step 1: Add failing orchestrator unit test (mocked container)**

Append:

```typescript
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createNonApparelSavedProduct } from "../_utils/non-apparel-saved-product"
import { COMPANY_MODULE } from "@/modules/company"

describe("non-apparel saved-product — orchestrator (mocked container)", () => {
  function makeContainer(opts: { salesChannels?: Array<{ id: string }> } = {}) {
    const created: any[] = []
    const links: any[] = []
    const companyProductsCreated: any[] = []
    const container = {
      resolve: (key: string) => {
        if (key === COMPANY_MODULE) {
          return {
            createCompanyProducts: async (input: any) => {
              companyProductsCreated.push(input)
              return [{ id: input.id }]
            },
          }
        }
        if (key === Modules.SALES_CHANNEL) {
          return {
            listSalesChannels: async () => opts.salesChannels ?? [{ id: "sc_webshop" }],
          }
        }
        if (key === ContainerRegistrationKeys.LINK) {
          return {
            create: async (l: any) => links.push(l),
          }
        }
        throw new Error(`unmocked resolve: ${key}`)
      },
    } as any
    return { container, links, companyProductsCreated, created }
  }

  const goodSource = {
    id: "prod_src",
    handle: "biz-cards",
    title: "Business Cards",
    description: null,
    subtitle: null,
    thumbnail: null,
    images: null,
    external_id: null,
    type_id: null,
    tags: [],
    categories: [],
    metadata: {
      product_type: "print",
      base_option_keys: ["paper_type", "quantity"],
      multiplier_keys: [],
      options_order: ["paper_type", "quantity"],
      options_labels: { paper_type: "Paper Type", quantity: "Quantity" },
      options_values: { paper_type: ["matte"], quantity: ["500", "1000"] },
    },
    options: [
      { title: "Paper Type", values: [{ value: "matte" }] },
      { title: "Quantity", values: [{ value: "500" }, { value: "1000" }] },
    ],
  }
  const variants = [
    {
      id: "v1",
      title: "Business Cards - matte - 500",
      prices: [{ amount: 5000, currency_code: "usd" }],
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "500" },
      ],
      metadata: null,
    },
    {
      id: "v2",
      title: "Business Cards - matte - 1000",
      prices: [{ amount: 8000, currency_code: "usd" }],
      options: [
        { option: { title: "Paper Type" }, value: "matte" },
        { option: { title: "Quantity" }, value: "1000" },
      ],
      metadata: null,
    },
  ]
  const orderLineItem = { metadata: { options: { paper_type: "matte", quantity: "500" } } }
  const customOrder = { id: "co_xyz", product_name: "My Cards" }

  it("throws clearly when Webshop sales channel does not resolve", async () => {
    const { container } = makeContainer({ salesChannels: [] })
    await expect(
      createNonApparelSavedProduct({
        container,
        customOrder,
        orderLineItem,
        sourceProduct: goodSource,
        sourceVariants: variants,
        companyId: "co_company",
        runCreateProducts: async () => [{ id: "prod_saved" }],
      } as any)
    ).rejects.toThrow(/webshop.*sales channel/i)
  })

  it("end-to-end: validates, creates product, links company + sales channel", async () => {
    const { container, links, companyProductsCreated } = makeContainer()
    const calls: any[] = []
    const out = await createNonApparelSavedProduct({
      container,
      customOrder,
      orderLineItem,
      sourceProduct: goodSource,
      sourceVariants: variants,
      companyId: "co_company",
      runCreateProducts: async (input: any) => {
        calls.push(input)
        return [{ id: "prod_saved" }]
      },
    } as any)
    expect(out.savedProductId).toBe("prod_saved")
    expect(calls.length).toBe(1)
    expect(calls[0].products[0].title).toBe("My Cards")
    expect(companyProductsCreated).toEqual([
      { id: "prod_saved", company_id: "co_company", price: 5000 },
    ])
    expect(links.length).toBe(2)
    expect(links).toEqual(
      expect.arrayContaining([
        {
          [Modules.PRODUCT]: { product_id: "prod_saved" },
          [COMPANY_MODULE]: { company_product_id: "prod_saved" },
        },
        {
          [Modules.PRODUCT]: { product_id: "prod_saved" },
          [Modules.SALES_CHANNEL]: { sales_channel_id: "sc_webshop" },
        },
      ])
    )
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: FAIL — orchestrator stub still throws "not implemented".

- [ ] **Step 3: Implement orchestrator**

Replace the placeholder `createNonApparelSavedProduct` body in `src/api/custom-order/_utils/non-apparel-saved-product.ts` with:

```typescript
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { COMPANY_MODULE } from "@/modules/company"

export async function createNonApparelSavedProduct(args: {
  container: MedusaContainer
  customOrder: any
  orderLineItem: any
  sourceProduct: any
  sourceVariants: SourceVariant[]
  companyId: string
  runCreateProducts?: (input: any) => Promise<Array<{ id: string }>>
}): Promise<{ savedProductId: string }> {
  const { container, customOrder, orderLineItem, sourceProduct, sourceVariants, companyId } = args

  // 1. Source-product sanity (spec §6) and approved-options validation (spec §5)
  validateSourceProductMetadata(sourceProduct)
  const approvedOptionsRaw = orderLineItem?.metadata?.options
  validateApprovedOptions(approvedOptionsRaw, sourceProduct)
  const approvedOptions = approvedOptionsRaw as Record<string, string>

  // 2. Variant retention (spec §8)
  const { retained, quantityTiers } = retainVariantsForApproved(
    sourceProduct,
    approvedOptions,
    sourceVariants
  )

  // 3. Lowest-price guard (spec §11) — must run BEFORE product creation
  const lowestPrice = computeLowestRetainedPrice(retained)

  // 4. Webshop sales-channel pre-resolution (spec §11) — must succeed BEFORE product creation
  const salesChannelService: any = container.resolve(Modules.SALES_CHANNEL)
  const salesChannels = await salesChannelService.listSalesChannels({ name: "Webshop" })
  const webshop = salesChannels?.[0]
  if (!webshop?.id) {
    throw new Error('Webshop sales channel could not be resolved by name lookup')
  }

  // 5. Product payload + variant payloads (spec §9, §10)
  const productPayload = buildSavedProductPayload({
    source: sourceProduct,
    customOrder,
    approvedOptions,
    quantityTiers,
  })
  const labels = (sourceProduct.metadata.options_labels ?? {}) as Record<string, string>
  const designNotes = orderLineItem?.metadata?.design_notes
  const variantPayloads = buildSavedVariantPayloads({
    retained,
    labels,
    customOrder,
    designNotes: typeof designNotes === "string" ? designNotes : undefined,
  })

  // 6. Run createProductsWorkflow (spec §9)
  const runCreateProducts =
    args.runCreateProducts ??
    (async (input: any) => {
      const { result } = await createProductsWorkflow(container).run({ input })
      return result
    })

  const result = await runCreateProducts({
    products: [
      {
        ...productPayload,
        variants: variantPayloads,
      },
    ],
  })
  const savedProductId = result?.[0]?.id
  if (!savedProductId) {
    throw new Error("createProductsWorkflow returned no product id")
  }

  // 7. Company link (spec §11)
  const companyModuleService: any = container.resolve(COMPANY_MODULE)
  await companyModuleService.createCompanyProducts({
    id: savedProductId,
    company_id: companyId,
    price: lowestPrice,
  })

  const link: any = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create({
    [Modules.PRODUCT]: { product_id: savedProductId },
    [COMPANY_MODULE]: { company_product_id: savedProductId },
  })

  // 8. Sales-channel link (spec §11)
  await link.create({
    [Modules.PRODUCT]: { product_id: savedProductId },
    [Modules.SALES_CHANNEL]: { sales_channel_id: webshop.id },
  })

  return { savedProductId }
}
```

**Resolve keys mirror the live apparel branch verbatim:** `req.scope.resolve(COMPANY_MODULE)` matches `order-flow.ts:407`; `req.scope.resolve(Modules.SALES_CHANNEL)` matches `order-flow.ts:425`. The literal strings `"salesChannelService"` and `"companyModuleService"` are NOT registered Awilix keys — using them throws `AwilixResolutionError`. The `link` key is the standard Medusa link-module reference (used at `order-flow.ts:415-423` and `order-flow.ts:431-438`).

The `runCreateProducts` parameter is a test-only injection point so the unit test can run without booting the Medusa workflow runtime. Production callers omit it; the live `createProductsWorkflow(container).run(...)` path is the default.

- [ ] **Step 4: Wire all-variants fetch + branch dispatch in `order-flow.ts`**

This step replaces the Task-1 placeholder dispatch with the real call. Two changes against the live file (live local binding for the source product is `product`, declared at `order-flow.ts:263`):

1. Add an all-variants `query.graph` ONLY when the non-apparel branch will fire. Apparel keeps its own already-Color-filtered query at `order-flow.ts:325-332` untouched.
2. Replace the Task-1 placeholder `sourceVariants: []` with the real `allSourceVariants` and pass `product` (the live binding) into the helper's `sourceProduct` parameter.

Updated dispatch code, inserted between live-file lines 297 and 299 (replacing the Task-1 placeholder block):

```typescript
validateBranchAgreement(product, orderLineItem)

if (!isApparelSource(product)) {
  const { data: allSourceVariants } = await query.graph({
    entity: "product_variant",
    fields: ["*", "prices.*", "options.*", "options.option.*", "metadata"],
    filters: { product_id: product.id },
  })

  await createNonApparelSavedProduct({
    container: req.scope,
    customOrder,
    orderLineItem,
    sourceProduct: product,
    sourceVariants: allSourceVariants,
    companyId,
  })
  return
}

// existing apparel logic (lines 299-445 of the live file) runs unchanged below this point
```

The `query.graph` runs inside the `if` so apparel approvals incur no extra DB round-trip. The non-apparel branch returns BEFORE the apparel-specific `selectedColor` resolver at `order-flow.ts:321-323`.

- [ ] **Step 5: Run unit + integration suites**

Run: `yarn test:unit src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts`
Expected: all orchestrator + earlier tests PASS.

Run: `yarn test:integration:http -t "proof to catalog flow"`
Expected: the apparel `approveProof` regression at `integration-tests/http/proof-to-catalog.spec.ts:466+` (inside `it("proof to catalog flow")` at line 238) passes unchanged. (No new HTTP integration test in this task — covered in Task 8.)

- [ ] **Step 6: Commit**

```bash
git add src/api/custom-order/_utils/non-apparel-saved-product.ts \
        src/api/custom-order/__tests__/non-apparel-saved-product.unit.spec.ts \
        src/api/custom-order/order-flow.ts
git commit -m "feat(div-100): orchestrate non-apparel saved-product creation end-to-end"
```

---

## Task 8: Integration test — non-apparel approveProof creates company-owned saved product

**Files:**
- Create: `integration-tests/http/approve-proof-non-apparel.spec.ts` — **flat path, no subdirectory**, because `jest.config.js:28` defines `testMatch = ["**/integration-tests/http/*.spec.[jt]s"]` (single-level glob). Files in `integration-tests/http/<subdir>/` are silently skipped by `yarn test:integration:http`.
- Reference (do NOT modify): `integration-tests/http/proof-to-catalog.spec.ts` is the existing apparel `approveProof` regression test. Read it for the harness pattern (`medusaIntegrationTestRunner`, `api` HTTP client, `getContainer()`, fixture seeding, admin-auth headers, `EVENT.approveProof` invocation).

> **Confidence: Medium** — implements [spec §14 — Success Criteria](../spec.md#14-success-criteria); end-to-end test using the existing `medusaIntegrationTestRunner` harness already exercised at `integration-tests/http/proof-to-catalog.spec.ts`. Confidence is Medium because seeding a promo-print source product directly (without going through the importer's CSV path) requires the Soldier to write `metadata` fields by hand from spec §6 — a fixture-shape risk the harness can't catch ahead of time. Soldier MUST invoke `medusa-dev:building-with-medusa` to confirm `productModuleService` create-shape and module-link query patterns.

- [ ] **Step 1: Author the integration spec**

Create `integration-tests/http/approve-proof-non-apparel.spec.ts`. Mirror the harness pattern in `integration-tests/http/proof-to-catalog.spec.ts` (admin auth + fixture seeding + `api.post` against `/admin/custom-order/{id}` with `{ event: "approveProof" }` + post-assertions via `getContainer()` resolves). The example below is the contract; the Soldier adapts the harness conventions verbatim from `proof-to-catalog.spec.ts`:

```typescript
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "@/modules/company"

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("approveProof — non-apparel catalog proof", () => {
      let companyId: string
      let customOrderId: string
      let savedProductId: string

      beforeAll(async () => {
        // Seed: company, admin employee, promo-print source product (build directly via
        // productModuleService — no CSV importer in the test path), catalog custom-order
        // with one line item carrying NonApparelMetadata-shaped metadata
        // (options: { paper_type: "matte", quantity: "500" }), job_status: pending,
        // order_status: proof_ready. Source product metadata must satisfy spec §6 sanity
        // (base_option_keys, multiplier_keys, options_order, options_labels, options_values,
        // multipliers when applicable). Re-use admin-auth + cart-completion helpers from
        // proof-to-catalog.spec.ts where possible.
      })

      it("creates exactly one published saved product carrying custom_order_id", async () => {
        const res = await api.post(
          `/custom-order/${customOrderId}`,
          { event: "approveProof" },
          /* auth headers — copy pattern from proof-to-catalog.spec.ts */
        )
        expect(res.status).toBe(200)

        const productModuleService: any = getContainer().resolve(Modules.PRODUCT)
        const products = await productModuleService.listProducts({
          metadata: { custom_order_id: customOrderId },
        })
        expect(products.length).toBe(1)
        expect(products[0].status).toBe("published")
        savedProductId = products[0].id
      })

      it("links the saved product to the company through CompanyProduct", async () => {
        const companyModuleService: any = getContainer().resolve(COMPANY_MODULE)
        const cps = await companyModuleService.listCompanyProducts({ company_id: companyId })
        expect(cps.some((c: any) => c.id === savedProductId)).toBe(true)
      })

      it("links the saved product to the Webshop sales channel", async () => {
        const salesChannelService: any = getContainer().resolve(Modules.SALES_CHANNEL)
        const [webshop] = await salesChannelService.listSalesChannels({ name: "Webshop" })
        expect(webshop?.id).toBeTruthy()
        // Verify the link via the query module — Soldier confirms exact filter shape via
        // `medusa-dev:building-with-medusa` Rig (link-module query pattern in v2.12.5).
        const query = getContainer().resolve("query")
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "sales_channels.id"],
          filters: { id: savedProductId },
        })
        expect(data[0].sales_channels.some((sc: any) => sc.id === webshop.id)).toBe(true)
      })

      it("locks base options to the approved value and keeps quantity selectable", async () => {
        const productModuleService: any = getContainer().resolve(Modules.PRODUCT)
        const [saved] = await productModuleService.listProducts(
          { metadata: { custom_order_id: customOrderId } },
          { relations: ["options", "options.values"] }
        )
        const paperType = saved.options.find((o: any) => o.title === "Paper Type")
        expect(paperType.values.map((v: any) => v.value)).toEqual(["matte"])
        const quantity = saved.options.find((o: any) => o.title === "Quantity")
        expect(quantity.values.length).toBeGreaterThanOrEqual(1)
      })

      it("does not copy source identity values (sku/upc/barcode/ean) to saved-variant top-level", async () => {
        const productModuleService: any = getContainer().resolve(Modules.PRODUCT)
        const [saved] = await productModuleService.listProducts(
          { metadata: { custom_order_id: customOrderId } },
          { relations: ["variants"] }
        )
        for (const v of saved.variants) {
          expect(v.sku).toBeFalsy()
          expect(v.upc).toBeFalsy()
          expect(v.barcode).toBeFalsy()
          expect(v.ean).toBeFalsy()
          expect(v.metadata?.original_variant_id).toBeTruthy()
        }
      })
    })
  },
})
```

Apparel regression coverage is NOT duplicated in this file — `integration-tests/http/proof-to-catalog.spec.ts:466+` already exercises the apparel `approveProof` flow and is the named regression check for Tasks 1, 7, and 8.

- [ ] **Step 2: Run integration test**

Run: `yarn test:integration:http -t "approveProof — non-apparel"`
Expected: PASS.

Run: `yarn test:integration:http`
Expected: full integration suite PASS — non-apparel approveProof creates the saved product end-to-end AND `proof-to-catalog.spec.ts` (apparel regression) is unchanged.

- [ ] **Step 3: Commit**

```bash
git add integration-tests/http/approve-proof-non-apparel.spec.ts
git commit -m "test(div-100): integration coverage for non-apparel approveProof saved-product creation"
```

---

## Definition of Done

- [ ] All 8 tasks committed in order, each with the specified test runs passing.
- [ ] `yarn test:unit` passes for the new helper file.
- [ ] `yarn test:integration:http` passes — apparel approveProof unchanged AND non-apparel approveProof creates a saved product end-to-end.
- [ ] No changes to `src/_custom/utils/promo-print-product/importer.ts`, `src/modules/company/models/product.ts`, `src/modules/custom-order/non-apparel-type.ts`, or `src/modules/custom-order/service.ts`.
- [ ] No new Medusa workflow added (per spec §3 out-of-scope: "Refactoring approve-proof saved-product creation into a new workflow").
- [ ] No idempotency / orphan-cleanup / cache-invalidation code introduced (per spec §3 + §15 out-of-scope).
