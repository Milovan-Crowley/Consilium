# Discrepancy Report

## Summary

- Total files processed: 25
- Files with corrections: 10
- Files with unverifiable claims: 16
- Total unverifiable claims: 27

## Corrections Made During Cross-Reference Pass

### brand-identity.md

- **Before:** `> See voice-principles.md for tone...`
  **After:** `> See \`voice-principles.md\` for tone...`
  (3 inline cross-refs reformatted to backtick style for consistency)
- **Before:** `| Teams Management | yes | yes | User groups with Collection-based access control |`
  **After:** `| Teams Management | yes | yes | Teams with Collection-based access control |`
  (Non-canonical term "User groups" replaced with "Teams" per `_terminology.md`)
- **Added:** Cross-References section with 7 links to related files

### catalog-product.md

- **Added:** 5 additional cross-references (`proofing-flow.md`, `complex-pricing.md`, `order-lifecycle.md`, `role-admin.md`, `role-designer.md`)

### collection.md

- **Added:** 6 additional cross-references (`saved-product.md`, `role-admin.md`, `role-designer.md`, `company.md`, `reorder-flow.md`, `permission-system.md`)

### company.md

- **Added:** 4 additional cross-references (`role-super-admin.md`, `collection.md`, `complex-pricing.md`, `permission-system.md`)

### complex-pricing.md

- **Before:** `See brand-identity.md | See order-lifecycle.md`
  **After:** `See \`brand-identity.md\` | See \`order-lifecycle.md\``
  (2 inline cross-refs reformatted to backtick style)
- **Added:** Cross-References section with 6 links to related files

### custom-order.md

- **Before:** `<!-- UNVERIFIED: The exact mechanism...`
  **After:** `<!-- UNVERIFIABLE: The exact mechanism...`
  (Tag normalized to match the standard `UNVERIFIABLE` prefix)
- **Added:** Cross-References section with 7 links to related files

### employee.md

- **Added:** 4 additional cross-references (`role-designer.md`, `role-staff.md`, `permission-system.md`, `onboarding-flow.md`)

### invite-flow.md

- **Added:** 4 additional cross-references (`role-designer.md`, `role-staff.md`, `permission-system.md`, `onboarding-flow.md`)

### job-status.md

- **Added:** 2 additional cross-references (`proof.md`, `order-lifecycle.md`)

### onboarding-flow.md

- **Added:** 2 additional cross-references (`invite-flow.md`, `brand-identity.md`)

### order-lifecycle.md

- **Added:** Cross-References section with 11 links to related files

### order-status.md

- **Added:** 2 additional cross-references (`proofing-flow.md`, `payment-status.md`)

### payment-status.md

- **Before:** `- See \`order-status.md\` -- the 10-state...`**After:**`- See \`order-status.md\` for the 10-state...`(3 cross-refs reformatted from`--`to`for` phrasing for consistency)
- **Added:** 1 additional cross-reference (`complex-pricing.md`)

### permission-system.md

- **Before:** `See role-admin.md | See role-designer.md | ...`
  **After:** `See \`role-admin.md\` | See \`role-designer.md\` | ...`
  (5 inline cross-refs reformatted to backtick style)
- **Added:** Cross-References section with 7 links to related files

### proof.md

- **Before:** `<!-- UNVERIFIED: The exact visibility filtering...`
  **After:** `<!-- UNVERIFIABLE: The exact visibility filtering...`
  (Tag normalized to match the standard `UNVERIFIABLE` prefix)
- **Before:** `See job-status.md for the full...` (3 inline refs without backticks)
  **After:** `See \`job-status.md\` for the full...`
- **Before:** `See proofing-flow.md for the live proof pipeline. See custom-order.md for order-level context.`
  **After:** Cross-References section with 6 structured links

### proofing-flow.md

- **Added:** Cross-References section with 10 links to related files

### reorder-flow.md

- **Added:** 4 additional cross-references (`saved-product.md`, `order-lifecycle.md`, `complex-pricing.md`, `catalog-product.md`)

### role-admin.md

- **Before:** `- See \`permission-system.md\` -- full permission...`**After:**`- See \`permission-system.md\` for the full permission...`(5 cross-refs reformatted from`--`to`for` phrasing)
- **Added:** 4 additional cross-references (`role-super-admin.md`, `invite-flow.md`, `order-lifecycle.md`, `team.md`)

### role-designer.md

- **Before:** `See \`permission-system.md\` | See \`role-admin.md\` | ...` (inline at bottom)
  **After:** Cross-References section with 6 structured links

### role-staff.md

- **Before:** `| Permission | Store | Backend |` then `|-|-|` (2-column separator for 3-column table)
  **After:** `|-|-|-|` (fixed table separator)
- **Added:** 3 additional cross-references (`reorder-flow.md`, `role-admin.md`, `role-designer.md`)

### role-super-admin.md

- **Added:** 3 additional cross-references (`job-status.md`, `proofing-flow.md`, `invite-flow.md`)

### saved-product.md

- **Added:** 2 additional cross-references (`company.md`, `complex-pricing.md`)

### team.md

- **Added:** 4 additional cross-references (`role-admin.md`, `role-designer.md`, `permission-system.md`, `invite-flow.md`)

### visual-tokens.md

- **Before:** `See brand-identity.md | See voice-principles.md`
  **After:** `See \`brand-identity.md\` | See \`voice-principles.md\``
  (2 inline cross-refs reformatted to backtick style)

### voice-principles.md

- **Before:** `## Related`
  **After:** `## Cross-References`
  (Section header normalized)
- **Before:** `- See \`brand-identity.md\` -- brand archetype and positioning `**After:**`- See \`brand-identity.md\` for brand archetype and positioning `(2 cross-refs reformatted from`--`to`for` phrasing)

## Unverifiable Claims -- Awaiting Review

### catalog-product.md

- **Claim:** "The four top-level categories are Apparel, Printed Materials, Promotional Products, Display Items"
  **Why unverifiable:** Derived from documentation, not from a runtime query of the category tree. Full category tree shape is not enumerated.
  **Recommendation:** include as-is -- categories are documented in knowledge base and confirmed in code patterns
  ***This is wrong. The top level categories are Apparel, Print, Promo, Disaply, Stickers & Decals. The 4 other categories have NOT launched yet but they will become live shortly. they are much much more simple than apparel.***
- **Claim:** "getCatalogCategory.ts uses mocked data with gender/color filters"
  **Why unverifiable:** Whether this file is still in active use or is legacy code was not verified.
  **Recommendation:** needs investigation -- if legacy, should be noted as such

  ***This is old garbage from premigration dev work. Not applicable to today.***
- **Claim:** "Standard products do not have corresponding backend ProductionOptionsType entries"
  **Why unverifiable:** Whether backend option configs for non-apparel types are planned was not verified.
  **Recommendation:** include as-is -- reflects current code reality

  ***This I think is correct, we have the product page ready for the other types of products coming in, but the backend has not been launched with this.***

### collection.md

- **Claim:** "When a proof is approved, the product is automatically placed in the organization's default Collection"
  **Why unverifiable:** No `default_collection` field or flag was found on the model. The mechanism for designating a collection as default was not verified against backend code.
  **Recommendation:** needs investigation -- the "default Collection" concept may be aspirational or implemented differently
  ***This is untrue as I don't think there is a default collection. The customer needs to create a collection and then place it in it. That being said I didn't create the system so there may be some mechanism I don't know at work.***

### company.md

- **Claim:** "Divinipress staff creates the initial Company record and sends credentials"
  **Why unverifiable:** The exact mechanism (admin panel, manual process, or automated workflow) was not traced in the codebase.
  **Recommendation:** include as-is -- operational process likely outside platform code
  ***This should be live I THINK, or it's sitting in the Backend PR (the data types that would allow it to work, the front end has this page ready and I think wired)***
- **Claim:** "company.pricing is used for company-specific price overrides"
  **Why unverifiable:** The field exists on the model but its consumers were not fully traced.
  **Recommendation:** include as-is -- `complex-pricing.md` confirms tier usage via `company.pricing.tier`
  ***Currently I belive everyone is on the same tier, this is a planned feature that may NOT befully baked, but again this was an Ivan domain so I don't know for sure.***

### custom-order.md

- **Claim:** "Timeline entries are written via a specific backend service method"
  **Why unverifiable:** The timeline type definitions are verified but the write path was not followed.
  **Recommendation:** include as-is -- the type system is verified even if the write mechanism was not traced
  ***No idea, I WANTED a timeline system but I have no idea if the original front end dev made it work.***

### employee.md

- **Claim:** "The default flag can be reassigned to a different employee after initial setup"
  **Why unverifiable:** The flag is set during company creation but no explicit endpoint for changing it was found.
  **Recommendation:** needs investigation -- important for support scenarios
  ***I don't know what this is. Not that it doesn't exist, I mean this explanation gives me little work on so I can't describe.***
- **Claim:** "Soft-deleting an employee also revokes their auth identity"
  **Why unverifiable:** The delete endpoint calls softDeleteCompanyEmployees but auth identity cleanup was not traced.
  **Recommendation:** needs investigation -- security-relevant claim
  ***No idea***
- **Claim:** "Email uniqueness is globally unique across all companies"
  **Why unverifiable:** `model.text().unique()` in MikroORM typically creates a global unique constraint, which would prevent the same email at two companies. Not verified at database level.
  **Recommendation:** needs investigation -- contradicts the theoretical multi-company scenario described in the file
  ***No idea, too technical for me***

### invite-flow.md

- **Claim:** "Invitation is delivered via email"
  **Why unverifiable:** The email sending step (likely Medusa core or notification provider) was not traced.
  **Recommendation:** include as-is -- standard platform behavior
  ***We use RESEND but have had issues in the past, it should be working.***
- **Claim:** "Invites expire after a certain period"
  **Why unverifiable:** The accept route validates the JWT token but the token's TTL/expiration configuration was not found.
  **Recommendation:** needs investigation -- security-relevant
  ***I belive they expire after 1 week.***

### job-status.md

- **Claim:** "companyVisibleEvents and superadminVisibleEvents filter arrays exist with specific values"
  **Why unverifiable:** Typed in TimelineDisplayConfig but the runtime values were not found in reviewed code.
  **Recommendation:** include as-is -- type system confirms the pattern
  ***IDK what this is asking.***

### onboarding-flow.md

- **Claim:** "The exact registration form fields and submission mechanism"
  **Why unverifiable:** The signup process may be handled outside the platform (marketing site or manual intake).
  **Recommendation:** include as-is -- operational process likely external
  ***?? We have an onboarding flow HERE in the frontend. Tho some distinction is probably required. Admins get their own flow, designers/staff get a trimmed down flow that only requires them to set a password. Admins get to update their shipping address ect, and get prompted at the last step to order a free t shirt. /free was the old route but it should redirect to the new one.***
- **Claim:** "Whether approval is fully manual or involves automated checks"
  **Why unverifiable:** No approval workflow or admin tooling for this step was found in the backend codebase.
  **Recommendation:** include as-is -- likely manual per business operations
  ***This must be talking about the marketing site. Irelevent. But it is manual.***
- **Claim:** "Whether onboarding includes guided tour or multi-step wizard UI"
  **Why unverifiable:** Backend only handles data submission; frontend onboarding page component was not inspected for multi-step UX.
  **Recommendation:** needs investigation -- UX-relevant
  ***Its a 2 step dialog, not complicated.***

### order-lifecycle.md

- **Claim:** "Admin hold behavior on Staff-placed orders"
  **Why unverifiable:** The triggering criteria for Super Admin holding a Staff order vs Admin/Designer order are not specified.
  **Recommendation:** needs investigation -- workflow-relevant
  ***Admin hold is currently a half baked feature. Admin hold exists as the place where we will be inserting additional permission gates, and allowing the customer admin to make choices. For example: If a staff wants to order over a specific dollar amount, that order is auto placed on admin-hold until THEIR admin either approves or rejects it. This was just an example and is not live yet since it requires more planning.***
- **Claim:** "Cart promo code validation logic beyond FREETSHIRT"
  **Why unverifiable:** The API files exist but specific promo code logic and available promotions are not documented.
  **Recommendation:** include as-is -- promotional system is operational detail
  ***This is the free t shirt admins get after they onboard. Not super complicated.***

### order-status.md

- **Claim:** "companyVisibleEvents and superadminVisibleEvents filter values"
  **Why unverifiable:** The type exists but runtime configuration was not verified.
  **Recommendation:** include as-is -- duplicate of job-status.md claim
  ORDER STATUS is NOT JOB STATUS. holy shit man. Order status is whats important for the customer. Job status is what is important for us as the people doing the work. Not that complicated.

### payment-status.md

- **Claim:** "Payment status transitions trigger notifications (partial payment email, refund email)"
  **Why unverifiable:** CSV suggests notifications but whether they are implemented could not be verified from code.
  **Recommendation:** needs investigation -- customer communication gap if not implemented
  ***I don't think there are emails setup yet for this, planned but not operational. I don't even think the pay balance feature (for if a customer wants to add something to their order, we could add it an allow them to pay the balance from their order detail page) Again not operational yet.***

### permission-system.md

- **Claim:** "MY_PRODUCTS_EDIT_VIEW added in PR #58 (2026-01-29)"
  **Why unverifiable:** PR metadata is not accessible from the codebase; cannot verify PR number or date.
  **Recommendation:** include as-is -- minor metadata claim
  ***Open PR on the backend matching this.***
- **Claim:** "Medusa v2 native permissions feature will replace store-only permissions"
  **Why unverifiable:** Medusa v2 roadmap is external; cannot verify timeline or feature availability from code.
  **Recommendation:** include as-is -- documented as aspirational
  ***ehhhhh yeah we're waiting on medusa but they would need their version to be much better.***

### proof.md

- **Claim:** "Proof note visibility filtering rules"
  **Why unverifiable:** Inferred from enum naming convention. Actual frontend filtering rules have not been traced in code.
  **Recommendation:** needs investigation -- correctness of customer-facing visibility matters
  ***I don't understand the question. Proof notes contain multipel types of notes. I'm ASSUMING thisis talking about the alerts we superadmin can create that forces the customer to acknowlegd before they approve a proof but it could be also talking about the design notes a customer puts into the upload box inside the catalog when they are configuring, OR it could be talking about the revision notes, when a customer rejects a proof, they can leave comments about what we need to fix and or upload new art.***

### proofing-flow.md

- **Claim:** "Exact UX for proof review (layout, proof image display, side-by-side comparison)"
  **Why unverifiable:** The approve/reject API calls are verified but UI presentation details are not captured.
  **Recommendation:** include as-is -- API verification is sufficient for knowledge graph
  ***I don't know what this is a contradiction***
- **Claim:** "Maximum number of revision cycles or escalation policy"
  **Why unverifiable:** The state machine allows unlimited revision loops. No policy constraints found.
  **Recommendation:** include as-is -- "unlimited" is the current implementation reality
  ***NO limits***

### role-admin.md

- **Claim:** "Backend route guards beyond permission constants (rate limits, ownership checks)"
  **Why unverifiable:** Permission constants define the capability set, but route-level middleware may impose additional constraints.
  **Recommendation:** include as-is -- permission-level documentation is the correct scope
  ***Again idk what this is really. Honestly our permissions on route based stuff is a little weak imo, but it's in process and nobody currently takes advantage so it's something we're keeping in mind and working toward but not a blocking thing yet unless it's gross.***

### role-designer.md

- **Claim:** "PROFILE_ALL scope (what profile fields are editable)"
  **Why unverifiable:** The constant exists and is granted, but what it guards at the UI/API level is not specified in the permission files.
  **Recommendation:** needs investigation -- useful for role documentation completeness
  ***Designers can do a lot of the same stuff as admins, but just slightly less.***
- **Claim:** "Whether Designer orders always require Admin approval or only above a threshold"
  **Why unverifiable:** ORDERS_APPROVE is Admin-only, but conditions for entering Admin Hold are not defined in permission files.
  **Recommendation:** needs investigation -- important workflow question
  ***This doesnt make any sense at all. Admin hold is still being baked, so this shouldn't conflic with anything.***

### role-staff.md

- **Claim:** "Exact UI flow for Staff ordering (Collection product rendering, distinct landing page)"
  **Why unverifiable:** Only permission constants were checked; frontend components were not inspected.
  **Recommendation:** include as-is -- permission verification is sufficient for knowledge graph
  Staff can see their own dashboard (or should I fixed this recently but idk if the PR was merged) the My products, the orders, and their profile, no other nav items. They cannot see catalog, proofing stuff, settings.

### role-super-admin.md

- **Claim:** "Backend routes for organization CRUD beyond mocked frontend"
  **Why unverifiable:** No routes found under `src/api/super-admin/organizations/`.
  **Recommendation:** include as-is -- correctly documented as "Partial"
  ***Accurate***
- **Claim:** "Frontend invite management page wiring to super-admin/invites backend routes"
  **Why unverifiable:** Only the backend routes and page existence were verified, not the wiring.
  **Recommendation:** include as-is -- both endpoints exist
  ***This should be working.***
- **Claim:** "Mechanism for ending an impersonation session"
  **Why unverifiable:** Whether there is a dedicated "stop impersonating" action or the user must log out.
  **Recommendation:** needs investigation -- UX-relevant for support workflows
  ***Yes thereis a dedicated stop button I think and a bar that shows up that says you are impersonating.***

### saved-product.md

- **Claim:** "display_name storage mechanism"
  **Why unverifiable:** Used on frontend HydratedProduct type and sent via API, but backend route handler was not located. Field does not exist on CompanyProduct model.
  **Recommendation:** needs investigation -- data model gap
  PR is open.

### team.md

- **Claim:** "Permission middleware enforcement on each backend route"
  **Why unverifiable:** Only permission constants and roles-permissions matrix were checked. Route handlers do not show explicit guards.
  **Recommendation:** include as-is -- permission system documentation covers the constants
- **Claim:** "Deleting a Team removes Staff access in real-time"
  **Why unverifiable:** Not verified against runtime behavior.
  **Recommendation:** include as-is -- standard expectation for soft-delete operations
