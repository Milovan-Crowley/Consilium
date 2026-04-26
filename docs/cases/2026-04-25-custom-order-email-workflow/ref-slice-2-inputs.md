# Slice 2 Inputs — Templates-as-Code via Resend `--react-email`

> **Purpose:** This is the canonical input log for Session 2 (Slice 2) of the custom-order email workflow case. The Consul reading this can write `session-02-templates-as-code-spec.md` directly without re-deriving from Session 1's spec/plan.

> **Source attribution:** every entry below is tagged with where it surfaced — Session 1 spec/plan (carry-forward), Campaign verifier name (newly discovered), or Imperator decision.

## Goal

Migrate Resend dashboard templates to React Email `.tsx` files in the divinipress-backend repo, deployed via `resend templates create --react-email`. Make the templates the source of truth (versioned with code) instead of the dashboard. Reconcile the cosmetic regressions Session 1 deferred and the variable-bag drift the validator can't catch.

## Affected templates

Two templates currently live in the Resend dashboard, used by `src/subscribers/custom-order-created.ts` and `src/subscribers/custom-order-proof-ready.ts`:

| Template | ID | Alias | Subject |
|-|-|-|-|
| `ORDER_CONFIRMED_PROOFED` | `75866903-26c8-4881-9a0c-8b33219e7614` | `order_confirmed_proofed_v2` | `{{{order_id}}} Confirmed – Awaiting Fulfillment` |
| `ORDER_RECEIVED_CUSTOM` | `ed1fa28d-2c23-4ec5-8e9d-7aadf8ddabaf` | `order_received_custom_v2` | `{{{order_id}}} Received – We're preparing your proof now!` |

Both templates' rendered HTML was pulled live during Session 1 Task 5 — see `/tmp/order-confirmed-proofed.html` (41KB) and `/tmp/order-received-custom.html` (48KB) on the development host (will be lost across restarts; re-pull when Slice 2 begins via `curl -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/templates/<id>` and extract the `.html` field from the JSON response).

The Resend npm package ships no CLI (`node_modules/resend/package.json` has no `bin` field per Session 1 plan v2 patch). The `resend templates create --react-email` invocation requires a separate CLI install (or direct API calls via the dashboard / SDK) — Slice 2 spec must verify the actual CLI/SDK shape that exists at session start.

## Inputs

### A. Cosmetic regressions Session 1 deferred (Imperator decisions)

#### A.1 Tax/discount conditional rendering
**Source:** Session 1 spec §"Implementation Order step 4" + Provocator Campaign GAP P-2.

The current dashboard templates emit tax/discount via bare triple-brace interpolations with NO `{{#if}}` wrappers:

```html
<p style="margin:0;padding:0">{{{tax_description}}}</p>
<p style="margin:0;padding:0">{{{discount_description}}}</p>
...
<p style="margin:0;padding:0">{{{tax}}}</p>
<p style="margin:0;padding:0">{{{discount}}}</p>
```

Session 1's `buildOrderEmailVariables` always emits empty strings for these four fields when `tax_total=0 AND discount_total=0` (the validator silent-drop fix). Empty strings render as **4 empty `<p>` blocks across 2 columns** (~16px of blank vertical space — sharpened framing from Provocator: the original "Tax: empty value" framing was incomplete; both label AND value are template variables, so both are empty).

**Imperator's verbatim guidance for Slice 2 (during Slice 1 closeout, 2026-04-25):**

> "Yeah that's dumb. Tax should still show a zero number, not blank. And discount... I think the same? IDK but either way you can put my thoughts on it in phase 2."

**Two paths Slice 2 must pick between (Imperator decision needed at spec time):**

**Path A — Always show with $0.00 zero (Imperator's leaning for Tax, uncertain for Discount):**
- Tax row: ALWAYS renders. Shows `$0.00` when `tax_total === 0`, shows `$X.XX` when non-zero. Honest, scannable, customer sees tax is zero (vs guessing whether it was forgotten).
- Discount row: TBD. Imperator said "I think the same" but uncertain. Slice 2 spec must pick:
  - (A1) Always show — `$0.00` when no discount applied. Same logic as Tax.
  - (A2) Hide when zero — many UX patterns hide zero-discount because "no discount" is ambient default; explicit `$0.00` reads as "you missed an opportunity."
- Implementation: `buildOrderEmailVariables` ALWAYS emits the four keys with formatted values (no empty-string fallback for the always-show fields).

**Path B — Conditional show (only when non-zero):**
- Both rows: hidden via template conditional when zero. Email shows only what's relevant.
- Implementation: template-side conditional (`{{#if tax}}...{{/if}}` or React Email JSX `{tax ? <Row /> : null}`).
- This is the path Slice 1 spec originally framed; Imperator's new guidance suggests A is preferred for Tax at minimum.

**Slice 2 spec author: present both paths with examples and let Imperator pick.** A is more honest/scannable; B is cleaner-looking. Tax leans A; Discount is open.

**Acceptance criteria depend on path chosen:**
- If A: order with zero tax+discount shows `Tax: $0.00, Discount: $0.00` (or $0.00/hidden depending on A1 vs A2). No empty paragraphs.
- If B: order with zero tax+discount shows neither row. Cleanest visual.
- Either way: NO empty `<p>` paragraphs — that's the regression Slice 2 must close.

#### A.2 Card-in-paragraph regression (NEW from Provocator GAP P-1)
**Source:** Provocator Campaign GAP P-1 + independent Legatus verification at `/tmp/order-confirmed-proofed.html:286-294` and `/tmp/order-received-custom.html:339-347`.

Both templates wrap the line-items spot in `<ul><li><p>...</p></li></ul>`:

```html
<ul style="...padding-left:18px">
  <li style="margin:0;padding:0">
    <p style="margin:0;padding:0">
      {{{line_items_list}}}
    </p>
  </li>
</ul>
```

Session 1's new helper produces block-level `<div>` cards joined with `""`. Block `<div>` inside inline `<p>` is invalid HTML; rendering varies by client (Gmail auto-closes the `<p>`, Outlook may collapse styles, Apple Mail tolerates). Worse: all N cards live inside ONE `<li>`, so multi-group orders show **a single bullet point at the top with N cards stacked below** (not one bullet per item).

**This is a regression CAUSED by Session 1.** Pre-refactor, the subscriber emitted inline strings + `<br>` which were valid inside `<p>`. The new card design needs a wrapper-free spot.

**Slice 2 must (pick one):**
- Restructure the template: remove the `<ul><li><p>` wrapper around `{{{line_items_list}}}`; let cards stand as top-level block elements.
- OR: change the helper output shape to inline-friendly markup (loses the card design, regressive vs Session 1 intent).
- OR: emit one card per `<li>` from the subscriber side (would require helper signature change to return per-item HTML rather than concatenated, AND a template restructure to put the `<ul>` around a `{{{cards}}}` interpolation that already contains `<li>` elements per card).

Slice 2 spec must pick the structural shape and then drive the React Email translation from there.

**Acceptance criteria:**
- Multi-group order renders as N visually-distinct cards with consistent inter-card spacing (no single bullet point swallowing the whole group).
- Cross-client testing on Gmail, Outlook desktop, Apple Mail — render is consistent and non-degraded.

### B. Template-registration drift (carry-forward from Session 1 spec)

**Source:** Session 1 spec §"Slice 2 prereq" — found by Censor + Provocator during Session 1 spec verification rounds.

Two latent template-variable omissions:

#### B.1 `proof_url` not declared in `PROOF_READY` registration
- Sender: `src/subscribers/custom-order-proof-ready.ts:37` passes `proof_url` in the data bag.
- Registration: `src/modules/resend/service.ts:40-49` declares `PROOF_READY` template variables but does NOT include `proof_url`.
- Functional consequence: NONE today. The validator only checks declared keys for `!== undefined`; undeclared keys flow through to the template engine.
- Why fix in Slice 2: when templates become `.tsx` files with typed props, the React Email component's prop interface IS the declaration source of truth. The drift becomes a compile-time error rather than runtime invisible.

#### B.2 `order_url` not declared in `ORDER_RECEIVED_CUSTOM` / `ORDER_CONFIRMED_PROOFED` registration
- Sender: `src/subscribers/custom-order-created.ts:158` (post-Session-1 line numbers) passes `orderUrl` → `order_url` in the data bag via `buildOrderEmailVariables`.
- Registration: `src/modules/resend/service.ts:54-86` (approximate) declares both template variables but does NOT include `order_url`.
- Functional consequence: NONE today (same reason as B.1).
- Why fix in Slice 2: same as B.1 — type-system rigor.

### C. Cross-client rendering gaps (carry-forward from Session 1 spec)

**Source:** Session 1 spec §"Inline-style cross-client rendering."

The new helper uses inline styles like `border-radius:6px`, `font-family:inherit`, `margin-bottom:8px` on its `<div>` cards. Known issues:
- **Outlook desktop (Word HTML engine):** silently drops `border-radius` (cards render as sharp rectangles) and ignores `box-shadow` if added.
- **Gmail:** `font-family:inherit` falls back to client default (usually Arial), losing the apple-system-font intent.
- **Apple Mail:** generally tolerant.

**Slice 2 must:** test rendering across Gmail (web + iOS), Outlook desktop (Windows), Outlook web, Apple Mail, Yahoo Mail. React Email's component primitives (`<Container>`, `<Section>`, `<Row>`, `<Column>`) are designed for cross-client compatibility; using them avoids most of the manual inline-style work.

### D. Discriminator hooks for upcoming subscribers (Imperator roadmap)

**Source:** Session 1 Imperator decision during Campaign review (the `ProofType` import in `custom-order-created.ts:2` is currently unused but kept as a placeholder).

Future email subscribers will discriminate by `proof_type`:
- `ProofType.CATALOG` (proofing to save a product) → distinct copy, distinct CTAs, distinct next-steps.
- `ProofType.ORDER` (proofing to fulfill an order) → existing copy direction.

**Slice 2 should:** define template prop interfaces that include `proofType: ProofType` and render branch-specific subject lines, body copy, and CTAs. The current ORDER_RECEIVED_CUSTOM / ORDER_CONFIRMED_PROOFED templates implicitly assume ProofType.ORDER context. CATALOG-flow emails will need new templates (e.g., `CATALOG_PROOF_RECEIVED`, `CATALOG_PROOF_CONFIRMED`).

This expands Slice 2's scope beyond "migrate existing 2 templates to React Email" toward "establish the template family for the proof-flow email roadmap."

### E. Pre-existing GAPs surfaced in Session 1 (Imperator scoping decision needed)

These are NOT regressions caused by Session 1 — they predate this work — but Session 1's verifier round surfaced them. Slice 2 spec should explicitly decide whether to fix them in Slice 2 or file separate follow-up tickets.

#### E.1 Apparel sizes outside `SIZE_ORDER` sort to FIRST
**Source:** Provocator Campaign GAP P-3.

`SIZE_ORDER` lists `XS` through `10XL`. `Array.indexOf` returns `-1` for any size outside that list (`OS`, `XXS`, `Toddler 2T`, etc.). `-1` sorts before `0`, so off-list sizes appear FIRST in the rendered list.

Fix: `indexOf` returning -1 → coerce to `Number.MAX_SAFE_INTEGER` (push to end) or a configurable fallback ordinal.

Whether this hits production today depends on the actual catalog's variant data — verify via grep before deciding scope.

#### E.2 `customer_name` not HTML-escaped in templates
**Source:** Provocator Campaign GAP P-4.

Templates use Mustache triple-brace `{{{customer_name}}}` (no HTML escape). A customer with `first_name = "<a href='evil.com'>click me</a>"` would render that markup as a clickable link inside the email. Email clients don't execute JavaScript so it's not XSS in the traditional sense, but it IS a social-engineering surface (malicious links inside trusted-looking divinipress emails).

Risk: low (customer attacks themselves and their CSR). Pre-existing; not a regression.

Fix: switch templates to `{{customer_name}}` (double-brace = escaped) when migrating to React Email — the JSX `{customer_name}` interpolation is HTML-escaped by default.

This applies to ALL non-line-item template variables — `customer_name`, `order_id`, `order_date`, etc. The line-items HTML (which IS HTML by design) stays in a triple-brace / `dangerouslySetInnerHTML` slot.

### F. Apparel quantity rendering — Imperator's design intent (Slice 2 must implement)

**Source:** Provocator Campaign C-3 + Spec Open Question §2 + **Imperator decision during Slice 1 closeout (2026-04-25)**.

Slice 1 changed the apparel line-items rendering from:
```
${productName}, Color: ${color}, Quantity (${quantityStr})
```
to a card with a "Sizes: M-10, L-8" row. The label changed from `Quantity (...)` to `Sizes: ...`.

**Imperator's verbatim guidance for Slice 2:**

> "Quantity and size are different. Just because it shows M-10 I know it's 10 mediums doesn't mean it's great UX. Ideally I'd have both, the total quantity for scanning — 'hey I just ordered 347 t-shirts, they want to see 347, not do mental math that adds up to 347' — but they obviously need the size/qty breakdown as well. So it's not an either OR thing. This will have to be dealt with in the second slice cause quantity works different for non-apparel so it'll need to be thought out."

**Slice 2 design implications:**
- **Apparel cards must show BOTH:** a total-quantity scan-line ("347 T-Shirts" or similar) AND the size breakdown row ("Sizes: M-10, L-8, S-5"). The total is for cognitive scanning; the breakdown is for production/fulfillment confirmation.
- **Non-apparel quantity is structurally different:** A non-apparel item may be "100 business cards" (single item, single quantity field) or "200 stickers + 50 banners" (mixed group with per-item quantities). The Slice 2 spec must think through what "quantity" means per non-apparel product type before designing the card.
- **No label rollback:** "Quantity" is NOT the right legacy label to revert to — it loses size context. "Sizes" alone is also incomplete. The Slice 2 design needs both.

**Acceptance criteria for Slice 2 apparel rendering:**
- Customer reading the email can see total apparel-piece count for the line at a glance.
- Customer can also see the size breakdown for production accuracy verification.
- Both pieces of information are visually distinct (e.g., total prominent, breakdown subordinate).

### G. Slice 1 spec Open Questions deferred (carry-forward sweep)

These are the Open Questions from the Slice 1 spec that were filed as out-of-scope or future-looking. The retro promised every deferral lands here; consolidating them now.

#### G.1 DIV-99 follow-up: line-item `options_order` field
**Source:** Spec Open Question §1.

V1 ships **alphabetical sort** for non-apparel options (`format-email-line-item.ts:149`) because the importer's `options_order` lives on **product metadata**, not line-item metadata. Pulling product data into the helper would break the helper's purity (it would no longer be a pure function of line-item input).

The follow-up: **copy `options_order` onto line-item metadata at write time**. Two candidate write sites:
- Cart route at `src/api/store/carts/[id]/line-items-custom/route.ts` (per the DIV-99 contract)
- Promo-print pricing workflow at `src/workflows/pricing/custom-add-promo-print-line-item-to-cart.ts`

Once line-item metadata carries `options_order`, the helper switches from `Object.entries(options).sort(([a],[b]) => a.localeCompare(b))` to `options_order.map(key => [key, options[key]])` — a single-line change in the helper.

**Slice 2 dependency:** if `options_order` lands in line-item metadata before Slice 2 ships, the Slice 2 React Email template can read the importer-defined order directly. If not, Slice 2 inherits Slice 1's alphabetical sort. The Slice 2 spec author should verify which state holds at the time of writing.

#### G.2 Mixed-cart customer wording mismatch
**Source:** Spec Open Question §5.

A customer with one saved-product reorder + one fresh proof-required item gets ONE template per order (current `.some()` logic at `custom-order-created.ts:135-140`, preserved verbatim through Slice 1). Worst case: customer reads "we'll send a proof" when only half the order needs one.

Out of scope for both Slice 1 and Slice 2 — flagging here for traceability. Likely belongs in a separate ticket: per-order template selection refinement (or per-line-item email split, which is a much larger redesign).

#### G.3 `humanize` Unicode handling
**Source:** Spec Open Question §4.

The `humanize` helper at `format-email-line-item.ts:54` uses regex `\b\w` which is ASCII-only. Importer keys with accented characters (e.g., `pâté_options`) capitalize partially: `Pâté Options` becomes `Pâté options` (lowercase `o` after `é` because `\b` doesn't fire mid-word in JS regex on Unicode chars).

Acceptable for English-only B2B in V1. **Slice 2 may resolve this incidentally** if the React Email template uses JSX `{key.replace(/_/g, ' ')}` interpolation with proper Unicode-aware capitalization (e.g., `Intl` or a Unicode-aware library). Worth a one-line note in Slice 2's design but not a blocker.

#### G.4 Multi-item non-apparel groups (forward-looking)
**Source:** Spec Open Question §7.

V1 reads `items[0]` only on the non-apparel branch (`format-email-line-item.ts:84`) because the storefront produces one item per `group_id` per non-apparel write (`standardCartHelpers.ts` in divinipress-store). If a future product flow ever needs multiple non-apparel items in one group, extend the helper to iterate the array.

The helper's input signature is already `EmailLineItemInput[]` (array-typed) for exactly this reason — making the future extension mechanical. Slice 2's React Email template should preserve this shape (accept an array, render appropriately) so the forward-looking change remains mechanical.

## Out of scope for Slice 2

- New email events (proof-approved, tracking-added, shipping-confirmed) — each follows as its own subscriber on the same helper. May warrant a separate Session 3 spec.
- Saved-product creation for non-apparel (DIV-100) — separate Linear ticket.
- Importer hierarchy (DIV-82) and non-apparel cart contract (DIV-99) — landed before Slice 1; not Slice 2's lane.

## Suggested session-02 structure

```
session-02-templates-as-code-spec.md
session-02-templates-as-code-plan.md
```

Plus this `ref-slice-2-inputs.md` (the input log; left in place for cross-session traceability).

## Open questions for the next Consul

1. Does Resend's CLI (`resend templates create --react-email`) actually exist and work, or do we need to use the SDK / dashboard API directly? Verify before committing to the migration approach.
2. Can React Email components be used standalone (build → static HTML → upload to dashboard via API) or must they be deployed via Resend's hosted template engine? Different deployment shapes.
3. Should Slice 2's PR be stacked on Slice 1's PR (`feature/div-97-non-apparel-email-subscriber`) or wait for Slice 1 to merge to develop first? Decision matters for branch sequencing.
4. The `ProofType` discriminator (D above) — is it Slice 2 scope or a Session 3 (proof-flow templates) scope?
