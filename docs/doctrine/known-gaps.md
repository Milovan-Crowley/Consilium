# Divinipress Known Gaps — Doctrine

Product-specific recurring bug memory. Read directly from `$CONSILIUM_DOCS/doctrine/known-gaps.md` by the Medicus on every `/tribune` session, by the Consul during reconnaissance, and by any verifier that receives known-gap context. Each entry is a hypothesis accelerator with strict discipline rules.

## Discipline

**Known gaps are hypothesis accelerators, not proof.** Before using a known gap in a diagnosis, recheck the current repo. If the evidence is stale, missing, or contradicted, say that and drop the hypothesis. A known gap cited as proof without live recheck is MISUNDERSTANDING.

**Diagnosis-packet field requirement.** Every packet's "Known gap considered" field MUST state: `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`. Absence is allowed only if no known gap maps to the affected lane and symptom — in which case the field carries `None applicable — checked against all <lane> entries`.

**Port origin.** These entries are ported from the Codex fork (`/Users/milovan/projects/Consilium/codex/source/doctrine/divinipress-known-gaps.md`) with live evidence re-verification against our current repos and rank-field translation into our hierarchy.

## Entries

### KG-MEDUSA-MONEY-AND-QUERY — query.graph + dollar/cent unit semantics

- **Lane:** medusa-backend
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** Price off by 100x, or over-fetch-then-filter patterns papering over query-graph limitations.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-backend/src/api/pricing/_quote/route.ts:67-119` — `query.graph({ entity: "variant", ..., context: { calculated_price: QueryContext(...) } })` at :67-80; parallel multiplier `query.graph` calls at :82-100; `finalPrice` at :114-115; `res.json({ price: finalPrice })` at :117-119.
  - `/Users/milovan/projects/divinipress-backend/src/api/pricing/apparel/pricing-config.ts:26-27` — `// Prices are in dollars (will be converted to cents in route)` above `ARTWORK_COLOR_PRICING`.
  - `/Users/milovan/projects/divinipress-backend/src/api/pricing/apparel/pricing-config.ts:66-67` — dollars-to-cents comment above `PANTONE_PRICING`.
  - `/Users/milovan/projects/divinipress-backend/src/api/pricing/apparel/pricing-config.ts:99-111` — `getArtworkColorSurcharge` returns `prices[tierIndex] * 100` at :100 with `// Convert to cents`; `getPantoneFee` returns `price * 100` at :111 with `// Convert to cents`.
- **Debug rule:** Trace unit semantics (cents vs dollars) at every boundary. Verify Medusa query API can express linked-data/tenant relations before falling back to broad-fetch + JS filter.
- **Route:** Medicus + cross-repo-debugging guide + `medusa-dev:building-with-medusa` → (only after idempotency/ownership/price-unit boundaries explicit) Legatus → Soldier + `medusa-dev:building-with-medusa`.

### KG-INVITE-ONBOARDING-SPLIT — /accept-invite vs in-app onboarding are distinct paths

- **Lane:** cross-repo
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** Customer Admin cannot resend/revoke invite, or invited Designer/Staff does not see onboarding dialog.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/domain/invite-flow.md:22-35` — Customer Admin path exposes only POST; Super Admin has list/revoke/resend; customer Admin resend/revoke is a product gap.
  - `/Users/milovan/projects/divinipress-store/docs/domain/invite-flow.md:37-45` — frontend-enforced Admin gate; backend route has "No isAdmin check."
  - `/Users/milovan/projects/divinipress-store/docs/domain/invite-flow.md:151` — invited users do NOT enter in-app onboarding dialog.
  - `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:16-30` — `onboardingEmails` is the entry signal; bulk-provisioning script at `generate-tokens.ts:110` is the sole writer.
- **Debug rule:** `/accept-invite` and in-app onboarding are separate entry paths keyed on different metadata signals. Never merge them.
- **Route:** Medicus (UI-permission vs backend-enforcement disagreement) → Legatus → Soldier + `medusa-dev:building-storefronts` (for explaining user-flow split between `/accept-invite` and in-app onboarding).

### KG-NON-APPAREL-OPTIONS — non-apparel metadata contract loss upstream of UI

- **Lane:** cross-repo
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** Non-apparel line items showing apparel fields (Color/Decoration/Size) blank or with labels absent.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:46-70` — non-apparel cart route activation, `multiplier_keys` importer gap, `approveProof` saved-product branch.
  - `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:111-129` — cart/proof/order-detail expectations for non-apparel labels and options.
  - `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:137-145` — Known Limitations: cart adapter gap, order-detail empty fields, proof option display, saved-mode deferred, multiplier visual indicator missing.
  - `/Users/milovan/projects/divinipress-backend/src/_custom/config/product_options.ts:3-5` — `ProductionOptionsType` still defines only `APPAREL = "apparel"`.
- **Debug rule:** Empty Color/Decoration/Size on non-apparel = metadata contract loss upstream of UI. Verify `options` / `options_labels` / `product_type` and the `product_type` ↔ `production_option_type` bridge before touching display.
- **Route:** Medicus → (if backend propagation gap) Legatus → Soldier + `medusa-dev:building-with-medusa` → (if rendering gap) Legatus → Soldier + `medusa-dev:building-storefronts`.

### KG-TEAM-NAME-SCOPE — team name is globally unique, not company-scoped

- **Lane:** cross-repo
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** Second company cannot create a team with a name already used by any other company; unique-constraint violation at insert.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/domain/team.md:33-45` — section "Name uniqueness is global, not per-company (likely bug)."
  - `/Users/milovan/projects/divinipress-backend/src/modules/company/models/team.ts:8` — declares `name: model.text().unique()`.
  - `/Users/milovan/projects/divinipress-backend/src/modules/company/migrations/Migration20260104075004.ts:51` — creates `IDX_company_team_name_unique` on `("name")` with `WHERE deleted_at IS NULL` — no company-scoping column.
- **Debug rule:** Duplicate team-name failures across companies = backend model/migration work, not frontend validation.
- **Route:** Medicus + cross-repo-debugging guide + `medusa-dev:building-with-medusa` → (after migration direction explicit) Legatus → Soldier + `medusa-dev:building-with-medusa`.

### KG-TEAM-PERMISSIONS — frontend role checks insufficient; backend routes ungated

- **Lane:** cross-repo
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** Role-gated UI action succeeds via direct backend call, or lower-role user performs mutation the UI should block.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/domain/team.md:12` — documents Designer privilege-escalation path (frontend gates only `canChangeRoles`, backend ungated).
  - `/Users/milovan/projects/divinipress-store/docs/domain/team.md:112-120` — line 114 confirms backend team routes do NOT call `hasPermission`; line 120 confirms `GET /company/my-products` is not team-scoped (at `src/api/company/my-products/route.ts:38-53`).
- **Debug rule:** Frontend role checks insufficient for team/invite/collection/employee/product bugs. Trace both UI gate and backend route/middleware. If either missing, cross-repo until proven otherwise.
- **Route:** Medicus (frontend-vs-backend mutation acceptance) | Medicus + cross-repo-debugging guide + `medusa-dev:building-with-medusa` (backend `hasPermission` enforcement).

### KG-ADMIN-HOLD-PLACEHOLDER — Admin Hold state machine wiring is broken

- **Lane:** multi-lane
- **Constituent lanes:** storefront, medusa-backend
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** `ADMIN_HOLD` enum referenced but `holdOrder` guard never passes; `adminApprove`/`adminReject` never fire; frontend hides `holdOrder` button with a comment pointing at broken wiring.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/domain/custom-order.md:181-194` — heading "Admin Hold (Half-Baked Placeholder with Broken Wiring)" at :181; placeholder + unreachable `holdOrder` + mismatched `adminApprove`/`adminReject` documented at :187-194.
  - `/Users/milovan/projects/divinipress-backend/docs/admin-hold-state-fix.md:5-25` — line 5 names EVENT_MAP :522-538 as unreachable; :9-25 walks `holdOrder` (impossible state pair), `adminApprove`, `adminReject` as dead.
  - `/Users/milovan/projects/divinipress-backend/docs/admin-hold-state-fix.md:54-65` — "Secondary concern" heading; `adminApprove` job.from PENDING vs. expected ON_HOLD; same critique applied to `adminReject`.
- **Debug rule:** Admin Hold is not a live flow. Any `ADMIN_HOLD` / `holdOrder` / `adminApprove` / `adminReject` defect is an order-lifecycle state-machine bug, not a UI button bug.
- **Route:** Medicus (status contract mismatches) + Medicus + cross-repo-debugging guide + `medusa-dev:building-with-medusa` (transition guards and call sites).

### KG-ONBOARDING-PROMO-METADATA — onboardingEmails ≠ promoEmails; FREETSHIRT not in onboarding route

- **Lane:** multi-lane
- **Constituent lanes:** storefront, medusa-backend
- **Status:** live
- **Last verified:** 2026-04-23
- **Symptom signature:** User completed onboarding but free-shirt promo missing / still-eligible after redemption / FREETSHIRT not applied — look at `promoEmails` + cart-complete path.
- **Evidence (as of last verify):**
  - `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:64-66` — permission note (no Admin-role check) at :64; FREETSHIRT-not-in-onboarding note at :66.
  - `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:122-152` — Free T-shirt Promo section with `company.metadata.promoEmails`, `/free` route, cart-completion redemption.
  - `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:154-163` — `onboardingEmails` vs `promoEmails` table with distinct writers/readers/removers.
- **Debug rule:** Free-shirt redemption lives in `/free` + cart-complete, not onboarding. `onboardingEmails` ≠ `promoEmails`.
- **Route:** Medicus (storefront + backend routes + metadata) → (fall back to) Medicus + cross-repo-debugging guide + `medusa-dev:building-with-medusa` when failure localizes to backend route metadata mutation.
