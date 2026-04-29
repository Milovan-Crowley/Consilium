# DIV-74 — Non-Apparel Proof Detail Rendering

**Type.** Storefront contract-correction.
**Repo.** `divinipress-store`.
**Worktree.** `/Users/milovan/projects/worktrees/divinipress-store/feature/div-74-non-apparel-proof-detail-rendering`.
**Base / review rule.** Implement on top of PR #133 / `feature/div-72-non-apparel-order-detail-rendering`; review the DIV-74 delta against that base, not against `develop`.
**Backend dependency.** Existing backend detail endpoint only. No backend change required for this scope.
**Evidence.** `ref-evidence-packet.md`.

## Context

Non-apparel catalog proofs are created from catalog product cart submissions where the customer-facing configuration lives in line-item metadata:

- `product_type`
- `group_id`
- `options`
- `options_labels`
- `design_notes`
- `upload_ids`

The backend detail endpoint `GET /custom-order/:id` already returns the needed line-item metadata, product metadata, variant option values, product type, uploads, and flattened metadata. The gap is in the storefront proof-detail path: `useCustomOrder` fetches that endpoint, `adaptCustomOrder` converts it into the custom-order domain model, and the customer/admin proof pages render from that model.

The current custom-order proof adapter and types still preserve mostly apparel-shaped metadata: `production_option_type`, `selections`, `design_notes`, and `variant_option_values`. They do not preserve `product_type`, `options`, or `options_labels`, so customer/admin proof detail cannot truthfully render standard print choices or customer-facing quantity.

This is a rendering correction, not a new proof lifecycle feature.

## Goal

Customer and admin proof detail pages must render non-apparel catalog proof details from the real non-apparel metadata contract.

For a non-apparel proof, both surfaces must show:

- product name
- customer-facing quantity from `options.quantity`
- submitted standard options from `options`
- human labels from `options_labels` when available, with readable fallback labels
- design notes when present
- original artwork uploads and proof files using the existing upload sections

Apparel proof detail behavior must remain unchanged except for any shared helper reuse that is behavior-preserving.

## Frozen Contract

Source: backend non-apparel metadata schema and proof-detail projection verified in `ref-evidence-packet.md`.

Non-apparel line-item metadata:

| Field | Type | Required | Rendering responsibility |
|-|-|-|-|
| `product_type` | `string` | yes | Discriminator. Non-`apparel` values enter standard/non-apparel rendering. |
| `group_id` | `string` | yes | Backend grouping/linking field. Preserve typing where present, but do not render. |
| `options` | `Record<string, string>` | yes | Source of customer-facing option values. `options.quantity` is required for truthful proof-detail quantity. |
| `options_labels` | `Record<string, string>` | optional | Source of human labels for `options` keys. Missing labels fall back to readable key labels. |
| `design_notes` | `string` | optional | Existing design-note display remains the source for customer/admin proof detail notes. |
| `upload_ids` | `string[]` | yes | Backend upload linking only; existing upload arrays drive rendering. |
| `product_name` | `string` | optional | Existing product-name fallback chain remains acceptable. |

Proof detail endpoint:

- `GET /custom-order/:id` is the detail endpoint for this feature.
- `GET /custom-order/proofs` is a proof-list endpoint and stays out of scope.
- Proof files and artwork uploads are separate upload records distinguished by upload type. Do not infer missing artwork from missing apparel artwork-placement metadata.

## In Scope

1. Preserve non-apparel fields in proof API/domain types:

- `product_type`
- `group_id`
- `options`
- `options_labels`

2. Preserve those fields in `adaptLineItems`.

3. Customer proof detail must render non-apparel product details from the preserved metadata, not from `variantOptions` as the primary source.

4. Admin proof detail must render the same preserved non-apparel metadata in its Product Specs card.

5. Quantity for non-apparel catalog proofs must display from `options.quantity`, not summed line-item quantity.

6. Missing or empty `options.quantity` must not silently fall back to line-item quantity for non-apparel catalog proofs. If the value is missing, the UI may omit the quantity row or show an explicit unavailable/misconfigured state, but it must not render normalized line-item quantity `1` as the customer-facing quantity.

7. Non-quantity options must include multiplier-only option keys from `options`, not only base variant options from `variantOptions`.

8. Non-quantity options render in deterministic alphabetical order by option key, matching the PR #133 cart/order-detail helper pattern.

9. Existing upload, proof-file, artwork-file, note, draft, mutation, status, approval, and lock behavior must remain unchanged.

## Out Of Scope

- Backend route changes.
- `GET /custom-order/proofs` projection changes.
- Cart submission changes.
- Upload mutation changes.
- Proof lifecycle/state-machine changes.
- Non-apparel saved-product approval or saved-product creation.
- Admin/customer order detail work already covered by PR #133.
- A shared options-rendering component.
- A broad adapter refactor beyond preserving/rendering the required metadata.

## Required Files

Implementation is expected to stay inside these storefront files unless verification finds a direct type/import need:

- `src/app/_types/admin/proofs/proofBySubId.ts`
- `src/app/_domain/custom-order/types.ts`
- `src/app/_domain/custom-order/adapter.ts`
- `src/app/(authenticated)/orders/[id]/[subOrderId]/page.tsx`
- `src/app/(authenticated)/admin/proofs/[id]/page.tsx`

This branch stacks on PR #133, so reuse:

- `src/app/_utils/formatOptionLabel.ts`
- `src/app/_utils/formatQuantity.ts`

Do not recreate those helpers independently. Reviewers should compare DIV-74 against the PR #133 base so inherited cart/order-detail helper changes are not misread as DIV-74 scope creep.

## Acceptance Criteria

1. A non-apparel customer proof detail page shows the customer-facing quantity from `options.quantity`.
2. The same customer page shows submitted standard options from `options`, excluding duplicate quantity display.
3. Option labels use `options_labels` when present and a readable fallback when missing.
4. Non-quantity options include multiplier-only keys from `options`, not just values present in `variantOptions`.
5. Non-quantity options render in deterministic alphabetical order by option key.
6. Admin proof detail shows the same non-apparel option set in Product Specs.
7. Admin proof detail shows customer-facing quantity from `options.quantity`.
8. Design notes still render on both customer and admin proof detail when present.
9. Original artwork and proof-file sections still render from existing upload data.
10. Apparel proof detail still renders color, decoration, artwork placements, and quantity as before.
11. The implementation does not touch backend code, cart submission, approval, saved-product creation, or proof-list projection.
12. `npx tsc --noEmit` passes from the storefront worktree.

## Verification

Required:

- `npx tsc --noEmit`

Recommended targeted verification:

- Exercise or fixture a proof detail payload with `product_type !== "apparel"`, `options.quantity`, at least one multiplier-only option key, `options_labels`, artwork uploads, and proof uploads.
- Exercise or fixture missing `options.quantity` behavior enough to prove the UI does not silently render normalized line-item quantity `1` as customer-facing quantity.
- Check both customer route `/orders/[id]/[subOrderId]` and admin route `/admin/proofs/[id]`.

No Storybook or broad e2e scaffolding is required for this slice unless an existing low-churn fixture already covers proof detail.

## Known Trap

DIV-74 must not claim non-apparel catalog approval or saved-product creation support. Rendering proof detail truthfully is separate from approval side effects. The backend approval path for catalog proofs still needs its own non-apparel saved-product work.

## Confidence Map

High — backend detail projection is sufficient. Evidence: `ref-evidence-packet.md`.

High — frontend adapter/domain types currently drop the non-apparel metadata contract. Evidence: `ref-evidence-packet.md`.

High — both customer and admin proof detail renderers need changes. Evidence: `ref-evidence-packet.md`.

High — backend changes are not needed for this proof-detail rendering slice. Evidence: Backend Speculator and Arbiter findings in `ref-evidence-packet.md`.

High — helper reuse and review base are fixed by branch stacking. DIV-74 is implemented on top of PR #133 and reviewed against that base.
