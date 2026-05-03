# Store UI Polish Intake

Date: 2026-05-01
Status: Intake only
Source: Imperator live review on `http://localhost:3000/catalog/display`

## Scoping Decisions

- Split into two UI-polish specs.
- Ship both specs in the same PR unless reconnaissance reveals a hard dependency or risk that justifies separation.
- Working split:
  - Non-apparel PDP polish: saved-product read-only affordances, saved-product Artwork Guidelines tab, and total box uplift.
  - Team-page polish: dialog spacing and collection product-list visual treatment.

## Purpose

Record observed storefront/admin UI issues before scoping. This is not a spec and not an implementation plan.

## Raw Observations

1. Saved non-apparel product page dropdowns appear clickable even though the user cannot actually change those values.
   - Problem: The controls give a false editing affordance.
   - Initial direction: These should probably read as read-only/locked rather than editable.
   - Surface to verify: saved non-apparel product detail page.

2. Saved non-apparel product page still shows an Artwork Guidelines tab.
   - Problem: Once the product is already saved, the tab is no longer useful.
   - Initial direction: Remove or hide the tab on saved non-apparel product pages if no saved-state need exists.
   - Surface to verify: saved non-apparel product detail page tab set.

3. Non-apparel PDP total box needs a design lift.
   - Problem: The current total box looks weak and visually unfinished.
   - Initial direction: Small design uplift, not a large redesign.
   - Surface to verify: non-apparel PDP and saved non-apparel PDP.
   - Note: Imperator may supply visual direction later.

4. Team page dialogs have too much vertical gap between the title/subtitle area and the content.
   - Problem: Dialog rhythm feels broken; header-to-content spacing is too loose.
   - Initial direction: Tighten dialog spacing, starting with team dialogs and then checking whether the issue is shared by other dialogs.
   - Evidence: Screenshot supplied in chat of the Edit Team dialog.
   - Surface to verify: team page dialogs first; shared dialog wrapper/component if the spacing is global.

5. Expanded team collection product list uses tiny box-like icons for included products.
   - Problem: The icons communicate "product exists" but look visually awkward.
   - Initial direction: Improve the product indicator treatment without pretending tiny thumbnails can carry useful detail.
   - Surface to verify: team collection expansion/product list.

## Early Scope Notes

- These issues are related by polish and affordance, but they should be scoped as two specs.
- Saved non-apparel PDP issues belong together.
- Team dialog spacing and team collection product indicators belong together as a team-page polish spec.
- Both specs are intended to land in one PR for review and shipping cohesion.
- The total box uplift should stay narrow unless the Imperator deliberately opens a broader PDP redesign.

## Domain Concepts To Verify During Scoping

- Saved product: customer-owned saved product instance, distinct from the catalog product.
- Non-apparel PDP: print-product detail/configuration flow, including saved variant.
- Team collection expansion: collection-to-product visibility inside the team management surface.

## Candidate Scoping Questions

1. For saved non-apparel dropdowns, should the values be visibly locked controls, static rows, or disabled selects?
2. For Artwork Guidelines on saved products, is the rule "always hide after save" or "hide only when guidelines are unchanged/non-actionable"?
3. For tiny product indicators in team collections, should the treatment favor product count/list clarity over visual product identity?

## Non-Goals Until Approved

- No code changes.
- No route or data-contract changes.
- No broad PDP redesign.
- No broad dialog-system redesign unless source verification shows the spacing defect is shared.
