# DIV-71 — Non-Apparel Cart Rendering Polish

**Type.** Storefront contract-correction (rendering polish).
**Repo.** `divinipress-store`.
**Worktree.** `/Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering`.
**Branch.** `feature/div-71-non-apparel-cart-rendering` off `origin/develop`. Single PR. No feature flag.
**Backend dependency.** `divinipress-backend` PR #33 (DIV-82 + DIV-99) must deploy first. Storefront points at the worktree at `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy` for local verification (`NEXT_PUBLIC_API_URL=http://localhost:9000`).

## Revision history

- **r1 — initial draft.** Censor caught a MISUNDERSTANDING: original Fix #4 treated absence of `metadata.product_type` as corruption, but apparel line items have never carried `product_type` — the absence IS the apparel default. Fix #4 as written would have broken every existing apparel cart line. Imperator approved corrected direction.
- **r2.** Fix #4 removed entirely. Storybook coverage dropped (no config exists; scaffolding = refactor churn). Pure-helper extraction dropped (no exported surface; fixes are render-site or trivial reducer-site). Several smaller corrections folded in.
- **r3 — current.** Round 2 verification produced 0 MISUNDERSTANDING + 7 GAP + 9 CONCERN. Stale "Fix #7" cross-reference fixed. Defensive hardening folded in: Fix #1 title-cases both label and key branches; Fix #2 sort takes explicit `"en-US"`; Fix #3 guards non-numeric quantity; Fix #4 warn extended to also fire on empty non-apparel `options`; Fix #5 de-dup normalizes whitespace + case and guards `productName` truthiness. Implementation steps tightened so no intermediate commit ships a duplicate-row state. Two confidence-map entries dropped (they rated absence of work, not active claims). Rejected hardening (discriminator value-normalization for `"APPAREL"` / whitespace, alternate quantity-bearing keys) explicitly listed below.

## Context

DIV-99 finalized the line-item metadata contract for non-apparel cart entries. PR #115 (already on `develop`) added a first-draft `product_type` branch in the storefront cart, written before the contract was frozen. The Phase 18 integration handoff doc explicitly lists "Cart page won't render non-apparel correctly" as a known limitation (`docs/phase-18-integration-handoff.md:137-145`). KG-NON-APPAREL-OPTIONS in `$CONSILIUM_DOCS/doctrine/known-gaps.md` confirms the rendering side as a separate downstream beat once the backend contract lands.

DIV-71 corrects the existing branch against the real DIV-99 contract. No new feature surface.

## Frozen contract — line-item metadata (non-apparel)

Source of truth: `divinipress-backend@feature/div-82-importer-hierarchy`, files `src/modules/custom-order/non-apparel-type.ts`, `src/workflows/pricing/steps/calculate-promo-print-prices.ts`.

| Field | Type | Required on a DIV-99 non-apparel line | Notes |
|-|-|-|-|
| `product_type` | `string` | yes | discriminator: `"print"` / `"promo"` / etc. Never `"apparel"` for non-apparel lines. |
| `group_id` | `string` | yes | sub-order key. |
| `upload_ids` | `string[]` | yes | not consumed by cart in DIV-71. |
| `options` | `Record<string,string>` | yes — `options.quantity` carries customer-facing tier as a string | machine codes. |
| `options_labels` | `Record<string,string>` | optional in schema, **reliably present** for any line created via the DIV-99 PDP path (`StandardActionDialogs.tsx:69,161` posts `product.metadata.options_labels`). | DIV-71 treats it as effectively required; uses graceful fallback when absent. |
| `product_name` | `string` | optional | user-entered design name. |
| `design_notes` | `string` | optional | not consumed by cart in DIV-71. |
| `production_option_type` | `string` | yes — server-stamped | bridge for proof adapter. Cart does NOT read this. |

**Apparel line items** never carry `product_type` or `options` in metadata. Their shape is `{ selections, upload_ids, group_id, design_notes?, product_name? }`. Verified at `divinipress-backend/src/modules/custom-order/apparel-type.ts:41-48` and `divinipress-store/src/app/_api/catalog/saveAndAddToCart.ts:181-190`.

**Discriminator rule.** `productType = (firstItem.metadata?.product_type as string) ?? "apparel"`. Missing `product_type` → defaults to apparel (preserves backward compatibility with all existing apparel lines). Explicit non-apparel `product_type` → enters non-apparel render path **regardless of `options` presence** (Fix #6 below covers the empty-options edge). Discriminator preserves the existing operator (`??`) per Imperator directive — see "Defensive notes & rejected hardening" below for the Provocator-flagged edge values that DIV-71 deliberately does not normalize at the read site.

**Quantity rule.** Non-apparel: `line.quantity === 1`, real count in `metadata.options.quantity`. Apparel: per-Size fan-out (one line per size, sum across `quantities`). Existing apparel quantity logic stays unchanged.

**Cart route projection.** `divinipress-backend/src/api/company/cart/route.ts:99-141` returns `items.metadata` and `items.variant.metadata` but NOT `items.product.metadata`. DIV-71 does not change this. No product-level fallback for `options_labels` is possible without changing backend behavior — out of scope.

## In-scope fixes

All fixes land in two files:
- `src/app/cart/_hooks/useCart.ts`
- `src/app/cart/page.tsx`

| # | Fix | Site | Behavior change |
|-|-|-|-|
| 1 | Graceful label fallback when a key has no entry in `options_labels` | `useCart.ts:79-81` (read), `page.tsx:505-509` (render) | When the line-item label map lacks an entry for a given key, render a title-cased version of the key (`paper_stock` → `Paper Stock`). Replace the `<span className="capitalize">{label}</span>` render-time CSS pass with a small `formatOptionLabel(key, labels)` helper. The helper title-cases word-by-word for **both** the label-present branch (defensive symmetry — guards against authored labels arriving lowercase, e.g. `"paper stock"` → `"Paper Stock"`) and the key fallback branch. |
| 2 | Render `Quantity` as a distinguished line for non-apparel, matching apparel's "Quantity: N" prominence | `page.tsx:502-513` | Render a dedicated `Quantity: N` row above the option list in the same visual treatment apparel uses (`page.tsx:520`). The remaining options iterate via `Object.entries(productOptions).filter(([k]) => k !== "quantity").sort(([a], [b]) => a.localeCompare(b, "en-US"))` — explicit filter so the prominent quantity row is not duplicated, and explicit `"en-US"` sort so render order is deterministic across SSR/CSR (matches Fix #3's locale specifier). |
| 3 | Format quantity with thousands separator + non-numeric guard | `page.tsx:520` (apparel), `page.tsx` (new non-apparel quantity row) | Helper: `formatQuantity(value: string \| number): string` returns `Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-US") : String(value)`. Apply at both branches. Guards against `NaN` display when `metadata.options.quantity` is non-numeric (corrupt data); falls back to the raw string so QA can see the bad value. Explicit `"en-US"` avoids runtime locale drift and hydration mismatch. |
| 4 | Dev-only warn when a line is dropped for missing `group_id` OR enters the non-apparel branch with empty `options` | `useCart.ts:60-61` (group_id), `useCart.ts:76-78` (empty options) | Both warns gated on `process.env.NODE_ENV === "development"`. The empty-options warn fires before Fix #6's friendly placeholder so dev/QA see the corruption signal even when the customer sees the placeholder. Production console / Sentry is NOT spammed. Caveat: `process.env.NODE_ENV` is `"production"` for Vercel preview builds, so the warn fires only in `next dev`. |
| 5 | Empty `product_name` falls back to `product_title`, with normalized duplicate suppression | `useCart.ts:94` (fallback), `page.tsx:500` (de-dup) | `designName: (firstItem.metadata?.product_name as string) || firstItem.product_title || "Custom Order"`. At the render site, suppress the `<p className="font-medium">{group.productName}</p>` row when `group.productName` is empty OR when normalized comparison `group.designName.trim().toLowerCase() === group.productName.trim().toLowerCase()` matches. Normalization catches whitespace and case differences (e.g. user typed `"custom tee "` vs catalog `"Custom Tee"`); empty-`productName` guard catches the both-fallback edge (`designName = "Custom Order"`, `productName = ""`). |
| 6 | Empty `metadata.options = {}` for non-apparel renders a placeholder row | `page.tsx:502-513` | When `Object.keys(productOptions).length === 0` and `productType !== "apparel"`, render a single muted `Custom configuration` placeholder line so the card body is not visually empty. Combined with the discriminator rule (explicit non-apparel `product_type` enters this branch even with empty options), this guards the edge where a non-apparel line legitimately has no options yet. Fix #4's dev-only warn fires here so the corruption signal is preserved for QA. |

(There is no Fix #4 in this revision — see revision history. Numbering is contiguous in this list.)

## Out of scope (file as follow-up)

- **Image hydration via `upload_ids`.** Custom-printed non-apparel items currently fall back to the generic placeholder when no thumbnail exists (`useCart.ts:165-176`). Feature addition, not a contract bug.
- **`design_notes` display in cart.** Not part of the rendered cart contract today.
- **Product-level `options_labels` fallback.** Would require expanding the `/company/cart` field projection to include `items.product.metadata`. Out of scope per "do not change backend behavior."
- **Saved-product reorder for non-apparel.** The only saved-product add-to-cart path today (`useSaveAndAddToCart`) is apparel-only — its `ItemMetadata` type lacks `product_type` / `options` / `options_labels`. When a customer reorders a saved non-apparel product, the cart will currently fall through to the apparel render path because `metadata.product_type` is absent. KG-NON-APPAREL-OPTIONS lists this as a deferred limitation. DIV-71 acknowledges it but does not address it — institutional memory lives in the PR description and the Linear follow-up ticket; no code marker is added to `saveAndAddToCart.ts`.

## Defensive notes & rejected hardening

The Provocator surfaced edge values the spec deliberately does not defend against. These are documented here so the rejection is explicit:

- **Discriminator value-normalization (`"APPAREL"` uppercase, `" print "` whitespace, `""` empty string).** Backend Zod at `non-apparel-type.ts:7-8` validates input shape (`v.trim().length > 0 && v.trim() !== "apparel"`). No producer in the storefront emits malformed `product_type` values. Defending the read site against values backend rejects on input would be hardening for a non-existent threat. Imperator directive: keep the existing `?? "apparel"` operator. If a malformed value ever appears in the DB, it is a backend / migration concern, not a cart-rendering concern.
- **Alternate quantity-bearing keys (`qty`, `quantity_total`, etc.).** Backend schema accepts arbitrary string keys in `options`, but no current importer emits non-`quantity` quantity-like keys. Filter is intentionally literal (`k !== "quantity"`).
- **i18n / localization.** Storefront has no i18n provider in scope. Hardcoded English strings (`"Custom Order"` fallback in Fix #5; `"Custom configuration"` placeholder in Fix #6) are acceptable in the current monolingual product. Localization is a separate cross-cutting concern, not a DIV-71 responsibility.
- **Backend deployment ordering enforcement.** No CI / version-gate enforces "DIV-99 backend deployed before DIV-71 storefront." Enforcement is by social contract via the PR description and the deploy runbook. If the storefront ships first, every cart line lacks `product_type`, falls through `?? "apparel"`, and renders apparel — a degraded but non-crashing state. Acceptable failure mode given the cart had no non-apparel rendering at all before DIV-71.

## Testing strategy

The repo has Playwright (e2e only) and a `storybook` dev script in `package.json`, **but no Storybook configuration exists** (`.storybook/` directory absent; zero `.stories.tsx` files in `src/`). Adding a Storybook config + first stories qualifies as "refactor churn" per the Imperator's caveat. Adding a unit-test runner (Vitest/Jest) likewise qualifies.

The Imperator's caveat — *"if useCart has or can expose a small pure mapping surface without refactor churn, add a focused unit test"* — is unmet because no zero-churn test surface exists in this repo. Therefore:

**Verification = manual screenshots only.** Three screenshots captured against the local dev stack pointing at the DIV-82+DIV-99 backend worktree, committed to the case directory:
- `apparel-only-cart.png`
- `non-apparel-only-cart.png`
- `mixed-cart.png`

Path: `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/`.

Optional fourth screenshot if a non-apparel test product with empty `options` exists locally: `non-apparel-empty-options.png` — verifies Fix #6 placeholder.

No Playwright cart e2e fixtures retrofitted. No Storybook scaffolding.

## Acceptance criteria

Mirroring the Imperator's order:

1. A non-apparel cart line renders selected options clearly — human labels (or title-cased keys when label map is missing for a given key), a distinguished `Quantity: N` row with thousands separator, and the design name as the card headline.
2. Quantity displays per DIV-99 semantics — `metadata.options.quantity` for non-apparel, sum of per-size lines for apparel.
3. Apparel cart lines still render unchanged — Color, size pills, decoration, artwork placements, single distinguished `Quantity: N` row.
4. Mixed apparel + non-apparel carts do not regress — both groups render correctly side by side.
5. A non-apparel line with empty `metadata.options` renders the placeholder row (not an empty card body or a crash).
6. A line with empty `metadata.product_name` renders `product_title` as the headline without duplicating the row underneath.

## Implementation steps

The Legatus issues these as soldier orders. **Steps that must commit together are explicitly grouped** so no intermediate commit ships a duplicate-row state.

1. Create the worktree at `/Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering` off `origin/develop`. Verify backend dev server is up at `http://localhost:9000` (DIV-82 + DIV-99 worktree).
2. Set `NEXT_PUBLIC_API_URL=http://localhost:9000` in `.env.local` if not already.
3. Read `useCart.ts` and `cart/page.tsx` end-to-end before editing.
4. **Single commit — Fix #5 (full).** Apply Fix #5 in `useCart.ts:94` (`designName` fallback chain) AND the render-site de-dup at `page.tsx:500` in the same commit. The intermediate state where the fallback exists without the de-dup would render duplicate rows and break Acceptance Criterion #6 — they ship together. No code marker added to `saveAndAddToCart.ts`; saved-product reorder follow-up tracked in PR description and Linear only.
5. **Single commit — Fix #4 (full).** Apply both warns: missing `group_id` at `useCart.ts:60-61` AND empty non-apparel `options` at `useCart.ts:76-78`. Both gated on `process.env.NODE_ENV === "development"`.
6. **Single commit — Fix #1.** Introduce `formatOptionLabel(key, labels)` as a local function in `page.tsx` (or co-located util if repo convention prefers `_utils/`). Replace the existing `<span className="capitalize">{label}</span>` pattern. Title-cases both branches per defensive symmetry note in the fix table.
7. **Single commit — Fix #2 + Fix #3 (must ship together).** Extract the dedicated `Quantity: N` row above the option list (Fix #2), introduce the `formatQuantity` helper applied at both the new non-apparel quantity row AND the apparel quantity at `page.tsx:520` (Fix #3), and iterate the remaining options via `Object.entries(productOptions).filter(([k]) => k !== "quantity").sort(([a], [b]) => a.localeCompare(b, "en-US"))`. Shipping Fix #2 without Fix #3 would render an unformatted prominent quantity row; shipping Fix #3 without Fix #2 would format apparel only. They are coupled.
8. **Single commit — Fix #6.** When `Object.keys(productOptions).length === 0` and `productType !== "apparel"`, render the muted `Custom configuration` placeholder row.
9. Capture three (optionally four) manual screenshots against the running dev stack. Commit them under `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/`.
10. `npx tsc --noEmit` clean. `yarn lint` clean for the touched files.
11. Open PR titled "DIV-71: non-apparel cart rendering polish" against `develop`. PR description names the backend dependency (DIV-82 + DIV-99 must deploy first) and notes the merge-ordering relationship with PR #120 (DIV-98 order metadata, currently draft) — see Concurrent work below.

## Concurrent work / merge ordering

PR #120 (DIV-98 order metadata + reporting shells, currently draft) modifies `src/app/cart/page.tsx` with +121 additions. If PR #120 lands first, DIV-71 rebases against the post-DIV-98 state. If DIV-71 lands first, PR #120 rebases. Order is the Imperator's call at merge time. The PR description should flag this so the reviewer knows. No further action required at spec time.

## Confidence map

> **Contract definition: High** — file:line evidence in backend worktree.
> **Discriminator rule (`?? "apparel"` default + explicit non-apparel `product_type` enters non-apparel branch even with empty options): High** — Imperator-confirmed after Censor MISUNDERSTANDING + adversarial pass.
> **Bug list scope: High** — file:line audit by scout, refined by Censor + Provocator findings across two rounds.
> **`options_labels` reliably populated for new lines: High** — PDP code path verified end-to-end.
> **No product-level fallback for `options_labels` possible without backend change: High** — `/company/cart` projection verified to omit `items.product.metadata`.
> **Branch base = develop, no flag: High** — Imperator approved.
> **Saved-product reorder for non-apparel deferred: High** — Provocator-flagged, Imperator-acknowledged. Code marker in `saveAndAddToCart.ts` carries the institutional memory.
> **PR #120 merge ordering noted in PR description: Medium** — Imperator's call at merge time; spec does not specify rebase owner. Acceptable because both possibilities (DIV-71 first vs. PR #120 first) are well-defined and the regions don't structurally overlap.
> **Defensive hardening rejection list explicit: High** — discriminator value-normalization, alternate quantity keys, i18n, deploy-ordering CI gate all named and out of scope.
> **Manual verification adequacy: Medium** — manual screenshots are the strongest verification available given repo state. Residual uncertainty: regression surface for visual changes is not automated. Mitigated by tightly scoped fix list and apparel-side Fix #3 changing only a numeric format.

## Verification dispatched

Censor (correctness vs codex + doctrine) and Provocator (adversarial stress test) re-run after this revision. Findings handled per Codex auto-feed loop.
