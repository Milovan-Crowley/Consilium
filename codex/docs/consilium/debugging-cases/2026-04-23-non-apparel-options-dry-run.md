# Non-Apparel Options Debugger Dry Run

Date: 2026-04-23

Repos:
- `/Users/milovan/projects/divinipress-store`
- `/Users/milovan/projects/divinipress-backend`

Trigger:
- What failed: recreated debugger validation case for non-apparel cart, proof, and order pages rendering empty apparel-shaped fields instead of option labels.
- User-visible symptom: Color, Decoration, or Size fields appear empty or irrelevant for non-apparel items.
- Runtime surface: authenticated storefront, Super Admin storefront pages, and backend proof/order metadata.

Initial hypothesis:
- What seemed likely: the UI may be rendering the wrong component branch.
- Why: the symptom is visible on frontend pages.
- Known gap considered: `KG-NON-APPAREL-OPTIONS`.

Evidence:
- `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:46` through `:70` names pending backend work for non-apparel cart route metadata, multiplier keys, and `approveProof` saved-product handling.
- `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:111` through `:129` names cart, proof, and order-detail checks for labeled non-apparel options.
- `/Users/milovan/projects/divinipress-store/docs/phase-18-integration-handoff.md:137` through `:145` lists known downstream non-apparel rendering limitations.
- `/Users/milovan/projects/divinipress-backend/src/_custom/config/product_options.ts:3` through `:5` currently defines only `ProductionOptionsType.APPAREL`.

Diagnosis:
- Root cause: not proven to be a frontend render defect. Current evidence points to an incomplete non-apparel metadata contract across cart, proof, order, and saved-product paths.
- Blast radius: storefront cart, customer order detail, Super Admin order detail, proof editor, saved-product proof creation, and backend `approveProof` metadata propagation.
- Why nearby symptoms were not the root cause: empty UI labels can be caused by missing backend metadata. Editing labels in the frontend first would mask the contract defect and leave proof/order surfaces inconsistent.

Routing:
- Skill: `consilium:tribune`.
- Rank: `consilium-arbiter` first.
- Why this route: the failure crosses frontend display assumptions and backend metadata truth.
- Escalation threshold: if Arbiter proves metadata is present and correctly shaped everywhere, route frontend rendering to `consilium-speculator-front` and then `consilium-centurio-front`. If metadata is missing or inconsistent, route backend propagation to `consilium-speculator-back` and then `consilium-centurio-back`.

Fix route:
- Storefront: render non-apparel option labels only after payload availability is proven.
- Admin: use the same proven option metadata contract as storefront, not a separate hardcoded specs shape.
- Backend: preserve `options`, `options_labels`, and product-type semantics through cart, custom order, proof approval, and saved-product creation.
- Cross-repo contract: define which field is canonical for frontend adapters when backend uses `product_type` versus `production_option_type`.

Verification:
- Command or manual check: no code changed in this dry run.
- Expected result: debugger routes to Arbiter before any implementation and treats `KG-NON-APPAREL-OPTIONS` as a rechecked hypothesis.
- Actual result: dry run produced diagnosis, evidence anchors, routing recommendation, and fix threshold without implementing a fix.

Promotion decision:
- Promote to `source/doctrine/divinipress-known-gaps.md`: no.
- Reason: the gap is already promoted as `KG-NON-APPAREL-OPTIONS`.
- Proposed known-gap ID: none.

Follow-up:
- Owner: next implementation lane.
- Artifact: use this case as a seed for a real Arbiter trace before changing frontend or backend code.
- Date: none yet.
