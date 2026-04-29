# DIV-100 Phase 2 — Non-apparel reorder shortcut + multiplier contract

**Status:** draft for cold verification
**Linear:** DIV-100 (continuation)
**Worktree branch:** `feature/div-100-non-apparel-saved-product`
**Stacked above:** Phase 1 — non-apparel saved-product creation (committed on this branch).

This artifact is intentionally standalone. Verify this spec on its own against doctrine and live repo truth. The earlier multi-section DIV-100 iteration-7 draft and the DIV-102 cart-add-lock draft are NOT context for this spec — they were rejected by the Imperator as over-engineered. Phase 2 reduces to two surgical changes.

---

## 1. Summary

Phase 1 of DIV-100 ships non-apparel saved-product creation. The saved product carries `metadata.options_values[multiplierKey] = [approvedValue]` for every locked multiplier code — a single-element array — encoding the customer's approved multiplier choices structurally. Phase 1 explicitly excluded two backend behaviors: the reorder shortcut at `custom-complete`, and backend enforcement of the structural lock at cart-add.

Phase 2 closes both with two changes:

- **Reorder gate widening.** The saved-product gate at `custom-complete` is currently apparel-only (a DIV-99 hardening). Drop that clause. Non-apparel saved-product reorders now take the APPROVED + PROOF_DONE shortcut and skip proofing.
- **Multiplier contract correction.** The non-apparel cart-add pricing helper validates submitted multiplier values against `product.metadata.options_values[code]` and treats missing surcharge rows for declared values as factor 1.0.

The cart-add lock for saved products is a **structural consequence** of the multiplier contract plus Phase 1's narrowing — the saved product's `options_values[k]` is single-element, so any non-approved multiplier submission fails the membership check. No saved-product-specific code path is added.

> **Confidence: High** — Imperator-confirmed framing; both changes verified against the gate, the helper, and the shipped multiplier CSVs.

---

## 2. Motivation

Phase 1 makes non-apparel saved products exist with a structural lock recorded in metadata. Frontend rendering of single-element `options_values` arrays as locked pickers honors the lock for legitimate users. Two backend seams remain.

**Reorder seam.** The gate at `custom-complete` excludes non-apparel saved products, so a customer who reorders one creates a fresh proofing job — the saved product was supposed to skip proofing entirely (per `doctrine/domain/products.md`: "saved product reorders skip proofing").

**Cart-add seam.** The pricing helper today reads `multipliers[code][quantity][selectedValue]` and throws on missing rows ("Q-B FIX-LOUD"). Two failures from this throw:

1. The shipped multiplier CSVs are **only-surcharges shape** — `flyers_multiplier.csv` writes `stapling,Yes,100,1.51` and zero rows for `No`. A saved product locked to `stapling: "No"` has no row in `multipliers.stapling[qty]["No"]`. Today this is invisible because no storefront cart-adds saved non-apparel variants. Once the reorder gate widens, this throw fires on the most common saved-product configuration (any locked no-surcharge multiplier value).
2. The throw treats row absence as configuration corruption, but never validates that the submitted value is a *declared* value. A scripted cart-add submitting `stapling: "Banana"` against any flyer fails on the row lookup with a misleading diagnostic — and after the multiplier semantic correction (factor `?? 1.0`), would silently price at base × 1.0 with no rejection. That is corrupt input, not surcharge absence.

The contract correction unifies both: declared values are honored, surcharge absence for declared values defaults to 1.0, undeclared values throw. The cart-add lock follows from Phase 1's narrowing without a saved-product-specific check.

A prior DIV-102 spec drafted the cart-add lock as a saved-product-only path with discriminator strengthening, defensive shape guards, schema gates, and absence-vs-mismatch diagnostic distinctions. Phase 2 does none of that. The lock is the natural consequence of treating `options_values[code]` as the authoritative declared-value list.

> **Confidence: High** — KG-NON-APPAREL-OPTIONS in `$CONSILIUM_DOCS/doctrine/known-gaps.md`; CSV shape verified at `products/print/flyers/flyers_multiplier.csv`; gate predicate verified at `src/api/store/carts/[id]/custom-complete/route.ts:248-252`; helper structure verified at `src/workflows/pricing/utils/calculate-promo-print-price.ts:80-95`.

---

## 3. Scope

**In scope:**

- Drop the apparel-only clause from the `custom-complete` saved-product reorder gate.
- Validate submitted multiplier values against `options_values[code]` at cart-add (membership check).
- Default missing multiplier rows for declared values to factor 1.0 at cart-add (Q-B FIX-LOUD inversion).

**Out of scope:**

- Cross-company lineage check at the reorder gate. Apparel ships without one today; non-apparel matches apparel posture. DIV-101 covers both arms when chosen.
- Discriminator strengthening at cart-add (resolving the backing custom_order to verify the saved product is real). Phase 1 trusts saved-product creation; Phase 2 trusts Phase 1.
- Defensive metadata-shape guards at cart-add (validating `multiplier_keys` is an array, `options_values[k]` is non-empty in shape). The promo-print importer writes `options_values` for shipped catalog products; Phase 1 narrows it on saved products. Phase 2 reads it. A product whose `options_values` is missing or whose `options_values[code]` is undefined for a multiplier code naturally fails the membership check (`undefined?.includes(value)` is falsy) and throws `INVALID_DATA` — no shape-validation code path is added.
- `NonApparelMetadataSchema` schema changes. The schema accepts `upload_ids: []` today; saved-product reorders send empty arrays.
- Distinguishing "submitted wrong value" from "omitted required value" with separate error shapes. Existing required-options check upstream of the membership check already throws on absence; the membership check throws on presence-with-undeclared-value. One diagnostic per case.
- Frontend storefront work (saved-product PDP rendering, request body shape). Backend-only.
- Saved-product immutability post-approval (Medusa Admin edits to saved metadata).
- Confirmation-email subscriber cosmetic degradation for non-apparel reorders.
- Idempotency hardening at approve-proof or custom-complete.
- Pre-flight gate timing or iterate-all-items widening (DIV-101).
- Apparel cart-add lock. Apparel locks are structural via variant retention; no metadata-only apparel lock exists today.

> **Confidence: High** — Imperator-confirmed scope; AI-slop filter applied against prior DIV-102 draft.

---

## 4. Reorder Gate Widening

The gate at `src/api/store/carts/[id]/custom-complete/route.ts` triggers the APPROVED + PROOF_DONE shortcut for a saved-product reorder. After Phase 2 the predicate must be:

```text
isSavedProduct =
  proofType === ProofType.ORDER &&
  items[0]?.product?.metadata?.custom_order_id != null
```

The `items[0]?.metadata?.product_type === "apparel"` clause is dropped. The pre-existing bookmark comment that flagged the apparel-only clause as DIV-100-conditional is updated to reflect post-Phase-2 status (the gate is now product-type-agnostic).

When the gate evaluates true, the new custom_order is created with the same fields the apparel branch uses today: `job_status: APPROVED`, `order_status: PROOF_DONE`, `product_name` resolved from the source custom_order via `query.graph`, `metadata.original_custom_order_id` set. Phase 2 introduces no new field on the new custom_order.

The gate continues to evaluate `items[0]` only — not the full items array. Pre-flight timing and cross-line-item iteration are DIV-101 scope.

A non-apparel reorder where the line item's `product.metadata.custom_order_id` is unset (catalog product) silently downgrades to a fresh proofing flow. A non-apparel reorder whose `custom_order_id` resolves to an existing custom_order owned by a different company auto-approves regardless of company match — the gate has no lineage check. A non-apparel reorder whose `custom_order_id` resolves to a deleted custom_order causes the source-product_name lookup to TypeError on `customOrder.product_name` and 500s the request. All three behaviors match apparel's posture today; Phase 2 does not introduce or fix any of them. DIV-101 hardens the cross-company case for both arms; the deleted-custom_order TypeError is a pre-existing apparel bug Phase 2 inherits and disclaims.

> **Confidence: High** — gate predicate verified at `route.ts:248-252`; downstream block at `route.ts:268-281` is product-type-agnostic per scout report.

---

## 5. Multiplier Contract

The pricing helper at `src/workflows/pricing/utils/calculate-promo-print-price.ts` enforces a contract between the request and the source product's metadata. After Phase 2 the contract is:

> `product.metadata.options_values[code]` is the authoritative declared-value list for option code `code`. For every multiplier code, the submitted value MUST be in `options_values[code]`. Surcharge-row absence in `multipliers[code][quantity]` for a declared value is factor 1.0.

Two coordinated changes inside the helper's existing per-multiplier-code loop:

- **Membership check (NEW).** Before the row lookup, validate `selectedValue ∈ product.metadata.options_values[code]`. If the value is not declared, throw `MedusaError.Types.INVALID_DATA` with a diagnostic naming the option code, the submitted value, and the declared value list.
- **Row absence default (CHANGED).** Replace the `factor == null` throw with `factor ?? 1.0`. Surcharge sparseness is no longer corrupt state — it is the design (verified against shipped CSV shape).

The membership check applies to multiplier codes only. Base option codes (including `quantity`) are validated by Medusa variant matching upstream — submitting an undeclared base value fails to resolve a variant, which the existing pricing-step code already handles.

The cart-add lock for saved products is the structural consequence: a saved product's `options_values[multiplierKey]` is `[approvedValue]` (single-element, per Phase 1). Submitting any value other than `approvedValue` fails membership. No saved-product-specific check is added; no discriminator on `metadata.custom_order_id` is read by the helper. The same membership rule applies to catalog cart-adds, where it rejects undeclared values like `"Banana"` that would otherwise silently price at base × 1.0 after the row-absence default.

**Provenance of `options_values`.** The helper does not currently read `options_values` — Phase 2 introduces this read. The field is written by the promo-print importer for catalog products (`src/_custom/utils/promo-print-product/importer.ts:97-104`) and narrowed by Phase 1 for saved products (the narrowing is built at `src/api/custom-order/_utils/non-apparel-saved-product.ts:344-346` and committed to product metadata at `:363-368`). Catalog products created via the Medusa Admin UI without going through the importer, or test fixtures hand-built in spec files, do NOT carry `options_values`. For Phase 2 to function against such products, those fixtures and admin paths must populate `options_values`. This is a contract pre-condition, not a defensive guard — products without `options_values` legitimately fail membership for any submitted multiplier value.

> **Confidence: High** — helper structure verified at `calculate-promo-print-price.ts:80-95`; CSV ground truth verified at `products/print/flyers/flyers_multiplier.csv`; importer write verified at `importer.ts:97-104`; Phase 1 narrowing verified at `non-apparel-saved-product.ts:344-346` (built) + `:363-368` (written into product metadata).

---

## 6. Error Semantics

The cart-add path throws `INVALID_DATA` (400) when:

- A submitted multiplier value is not in `product.metadata.options_values[code]`. Diagnostic names the option code, submitted value, and the declared value list.

Existing throw behavior changes:

- `factor == null` for a declared value at `calculate-promo-print-price.ts:88-94` was previously `INVALID_DATA "No multiplier row for {code} at quantity tier {quantity}; product configuration is incomplete"`. **REMOVED.** Replaced by factor 1.0 default.

Existing throws preserved unchanged:

- Missing required option in `metadata.options` for any code in `base_option_keys ∪ multiplier_keys` — already enforced upstream of the membership check at `calculate-promo-print-price.ts:36-43`. Absence of a value in the request continues to throw with the existing "Missing required option" diagnostic, distinct from the new membership-failure diagnostic.
- Variant-not-found for the requested base configuration — existing behavior.

The reorder gate (§4) introduces no new throw at `custom-complete`. The pre-existing apparel-inherited behaviors at the gate (catalog `custom_order_id` absent → fresh proofing; deleted custom_order → 500 TypeError on the product_name read; cross-company custom_order → auto-approves with no lineage check) are preserved verbatim. See §6.6 for the residual list.

> **Confidence: High** — one new throw, one removed throw, no new throw at the gate.

---

## 6.5. Test Impact

The contract changes invalidate three existing assertions in the test suite. Listed here as contractual statements (the tests today assert behaviors Phase 2 reverses), not as implementation prescription.

- **Unit test at `src/__tests__/workflows/pricing/utils/calculate-promo-print-price.unit.spec.ts:88-97`** — asserts `INVALID_DATA` on missing multiplier row (Q-B FIX-LOUD). Must invert to assert `factor 1.0` default for declared values when no surcharge row exists.
- **Integration Test 12 at `integration-tests/http/non-apparel-cart.spec.ts:393-418`** — asserts the same throw at the integration level. Must invert to assert successful pricing at base × 1.0 for declared values with absent surcharge rows.
- **Integration Test 15b at `integration-tests/http/non-apparel-cart.spec.ts:595-663`** — asserts the apparel-only gate rejects non-apparel auto-approval. Must remove or invert: with Phase 2's gate widening, a non-apparel ORDER with `custom_order_id` set and same buying company auto-approves to `APPROVED + PROOF_DONE`.

The catalog product fixtures at `non-apparel-cart.spec.ts:73-88` and `calculate-promo-print-price.unit.spec.ts:5-22` must populate `metadata.options_values` to match the importer's contract. The membership check rejects every fixture call without this update; this is a fixture-completeness pre-condition, not a defensive change.

New tests required (scenarios; the plan owns file placement):

- A positive saved-product reorder happy path: approve a non-apparel proof, cart-add the saved variant with locked multiplier values echoed, complete the cart, assert `APPROVED + PROOF_DONE + metadata.original_custom_order_id` set.
- A saved-product cart-add lock test: cart-add the saved variant with a non-locked multiplier value; assert 400 with the membership diagnostic.
- A catalog cart-add membership-violation test: cart-add a catalog variant with an undeclared multiplier value (e.g., `"Banana"`); assert 400 with the membership diagnostic.
- A unit test for the membership check itself, covering: declared value passes; undeclared value throws; `options_values[code]` undefined throws via the same membership-failure path (no defensive guard).

> **Confidence: High** — three test sites enumerated against verified line ranges; new scenarios trace directly from the success criteria in §7.

---

## 6.6. Residuals (acknowledged, not addressed)

Phase 2 inherits and in some cases widens pre-existing behaviors. None of these are introduced by Phase 2, and the AI-slop filter rejects defensive engineering against them inside this scope. Listed here for honest accounting.

- **Saved-product `multiplier_keys` corruption.** A Medusa Admin UI edit (or future migration bug) that empties or removes `multiplier_keys` on a saved product causes the membership-check loop to skip the affected codes. The lock fails open silently. This is the saved-product immutability seam Phase 1 disclaimed. Out-of-scope.
- **Deleted backing custom_order at the gate.** When `product.metadata.custom_order_id` resolves to a deleted custom_order, the gate's `query.graph` for `product_name` returns an empty array; the destructure produces `customOrder === undefined`; the next line reads `customOrder.product_name` and TypeErrors (500). Apparel exhibits this today; Phase 2 widens the surface to non-apparel.
- **`proofType: CATALOG` cart-completion against a saved-product cart.** The catalog branch force-normalizes every line item to `quantity: 1, unit_price: 0, requires_shipping: false` regardless of saved-product status. A scripted POST or storefront bug that submits CATALOG against a saved-product cart yields a $0 fulfillment for the goods. Apparel exhibits this today; Phase 2 widens the surface to non-apparel.
- **`parseFloat` of a blank `factor` field in a multiplier CSV row produces `NaN`.** `NaN ?? 1.0 === NaN` (nullish coalescing only catches `null`/`undefined`). A CSV admin who blanks a factor cell silently propagates NaN through pricing. Pre-existing parser behavior at `src/_custom/utils/promo-print-product/parser.ts:138-154`; Phase 2's `factor ?? 1.0` default does not catch this.
- **Strict-string membership semantics.** The membership check uses exact-string equality (matching Phase 1's `validateApprovedOptions`). A storefront request with whitespace, smart-quote, or case drift against a CSV-declared value (`"yes"` vs `"Yes"`, `"Yes "` vs `"Yes"`) fails membership. Storefront contract for saved-product reorder must echo the locked value byte-for-byte.

> **Confidence: High** — five residuals enumerated; each is pre-existing or follows from a deliberate Phase 2 design choice.

---

## 7. Success Criteria

1. A non-apparel saved-product reorder via `POST /store/carts/{id}/custom-complete` with `proofType === ORDER` and the saved-product's `metadata.custom_order_id` resolvable produces a custom_order with `jobStatus: APPROVED, orderStatus: PROOF_DONE, metadata.original_custom_order_id` set. The customer skips proofing.
2. An apparel saved-product reorder behaves as it did before Phase 2.
3. A non-apparel cart-add request submitting any multiplier value not present in `product.metadata.options_values[code]` returns 400 `INVALID_DATA` with a diagnostic naming the code, submitted value, and declared value list.
4. A non-apparel cart-add request submitting a declared multiplier value for which `multipliers[code][quantity][value]` is absent succeeds, with that code's surcharge factor defaulted to 1.0 in the price computation.
5. A non-apparel saved-product cart-add submitting any value other than `options_values[k][0]` for any locked multiplier code returns 400 (structural consequence of §5 plus Phase 1 narrowing — no saved-product-specific code path is invoked).
6. A non-apparel saved-product cart-add echoing the locked multiplier values for every locked code succeeds and prices correctly using the surcharge rows or 1.0 defaults from the source product's multiplier table.
7. The apparel cart-add path is unchanged. Phase 2 adds no apparel-specific code path.
8. The reorder gate continues to evaluate `items[0]` only. Phase 2 does not introduce cross-line-item iteration or pre-flight gate timing.

---

## 8. Verification Boundary

Cold verifiers should verify only the two contract changes specified.

Do NOT treat these as Phase 2 gaps unless this artifact makes a claim about them:

- Cross-company lineage check at the reorder gate (DIV-101 scope).
- Discriminator strengthening at cart-add (resolving backing custom_order at validation time).
- Schema changes (`NonApparelMetadataSchema.upload_ids` optionality).
- Defensive metadata-shape guards at cart-add (`multiplier_keys` array shape, `options_values[k]` non-empty).
- Distinguishing absence from mismatch with separate error shapes.
- Frontend storefront rendering or request body shape for saved-product reorders.
- Saved-product immutability enforcement against admin edits.
- Confirmation-email subscriber cosmetic degradation for non-apparel reorders.
- Idempotency hardening at approve-proof or custom-complete.
- Pre-flight gate timing, iterate-all-items widening, isList traversal posture.
- Apparel cart-add lock (no metadata-only apparel lock exists today).
- Production_option_type enum extension at `src/_custom/config/product_options.ts`.

> **Confidence: High** — verification boundary mirrors Phase 1's scope discipline.

---

## 9. Confidence Map

- Sections 1-2: High. Imperator-confirmed framing; gate predicate, helper structure, and CSV shape verified by scout reports against the live repo at HEAD of `feature/div-100-non-apparel-saved-product`.
- Section 3: High. Imperator-confirmed scope; out-of-scope items derive from the AI-slop filter applied against the prior DIV-102 draft. The `options_values` provenance clarification (importer-written, Phase-1-narrowed, Phase-2-read) was added after Censor flagged the original "Phase 1 writes; Phase 2 reads" framing as imprecise.
- Section 4: High. Predicate at `route.ts:248-252` quoted by scout. Downstream block product-type-agnostic per scout audit of `route.ts:268-281`. The "items[0]-only" clause is preserved verbatim — DIV-101 hardens. The deleted-custom_order TypeError exposure was named explicitly after Provocator flagged the earlier "silently downgrades" claim as factually wrong.
- Section 5: High. Helper at `calculate-promo-print-price.ts:80-95` quoted by scout. CSV-shape claim grounded in `products/print/flyers/flyers_multiplier.csv` row-1 data; parser logic at `src/_custom/utils/promo-print-product/parser.ts:138-154` writes verbatim what the CSV contains. Phase 1 narrowing built at `non-apparel-saved-product.ts:344-346` and committed to product metadata at `:363-368`. The `options_values` provenance paragraph documents that Phase 2 introduces the helper read; fixtures must be updated to populate the field.
- Section 6: High. One new throw site (membership). One removed throw site (Q-B FIX-LOUD). Existing throws preserved.
- Section 6.5: High. Three test sites with verified line ranges; four new scenario classes covering reorder happy path, saved-product lock, catalog membership violation, and unit-level membership.
- Section 6.6: High. Five residuals named, all pre-existing or following from a deliberate Phase 2 design choice. None blocks Phase 2 scope.
- Section 7: High. Eight criteria covering: non-apparel reorder shortcut (1, 8), apparel preservation (2, 7), undeclared-value throw (3), surcharge default (4), saved-product structural lock (5, 6).
- Section 8: High. Verification boundary mirrors Phase 1's discipline — explicit list of items NOT to flag.
