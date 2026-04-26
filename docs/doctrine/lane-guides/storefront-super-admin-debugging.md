# Storefront Super Admin Debugging — Lane Guide

Super Admin surfaces in `/Users/milovan/projects/divinipress-store`. Same React/Next.js app as the customer storefront, but distinct components, permissions, and flows — moderation queues, team administration, cross-company visibility.

## Loading discipline

When this guide is loaded, the Medicus also invokes `Skill(skill: "medusa-dev:building-storefronts")` (same companion skill as customer storefront).

## Canonical surfaces

- Super Admin pages: gated routes under `src/app/(authenticated)/admin/**` (Next.js App Router route-group convention — `(authenticated)` is the auth-gated route group; `admin` is the Super Admin subtree). Directory listing (verified 2026-04-23) shows sibling routes `catalog/`, `orders/`, `products/`, `profile/`, `settings/`, `team/`, `free/` under the same `(authenticated)` group. The Legatus verifies the exact current directory before writing or reading — structure may have evolved.
- Permission components: HOCs or hooks that gate rendering on `isSuperAdmin` or equivalent role check. Look in `src/app/(authenticated)/_components/` and `src/app/(authenticated)/_hooks/`.
- Data contracts: Super Admin consumes backend APIs with broader scope than customer APIs (cross-company reads).

## Common failure modes (distinct from customer storefront)

- **Permission scope leak.** Super Admin action exposed to non-Super users; role check bypassed or missing.
- **Cross-company visibility bug.** Super Admin should see data across companies but the query scope is unexpectedly narrowed to the current company.
- **Super-admin-only endpoint contract drift.** Backend endpoints consumed only by Super Admin often lag in test coverage; contract breaks here are invisible to customer-flow testing.
- **Moderation state race.** Super Admin approves/rejects items; the state transition requires backend atomicity often not present in customer-facing mutations.

## Reconnaissance checklist

- Confirm the acting user has Super Admin role (hook state, auth token claims, backend permission check).
- Check the permission gate on the failing route or component.
- If data is scoped, trace the query to find where the scope narrowing happens (frontend filter? backend permission middleware?).
- Check whether the backend endpoint being consumed has Super-Admin-only permission semantics vs. company-scoped.

## Timing and async

Super Admin timing bugs concentrate around **moderation-state races** — approve/reject actions that require backend atomicity, cross-company queries that depend on a just-completed permission refresh, and bulk operations whose intermediate states are observable. **Wait for the moderation state to settle, not a guess at how long the mutation takes.**

### Core rule

Do not sleep. Wait on the actual condition — the item's status transitioned, the permission cache refreshed, the bulk operation drained — with an explicit timeout.

```typescript
// BEFORE — flaky, loses races to other moderators' concurrent actions
await adminSdk.approveItem(itemId);
await new Promise(r => setTimeout(r, 400));
const refreshed = await adminSdk.getItem(itemId);
expect(refreshed.status).toBe('approved');

// AFTER — reliable, observes the actual transition
await adminSdk.approveItem(itemId);
await waitFor(async () => {
  const refreshed = await adminSdk.getItem(itemId);
  return refreshed.status === 'approved' && refreshed.moderatedBy !== null;
}, 'item to reach approved state with moderator recorded');
```

### Super-Admin-specific patterns

| Scenario | Pattern |
|-|-|
| Wait for moderation transition | `waitFor(() => getItem(id).then(i => i.status === targetStatus))` |
| Wait for cross-company query to settle | `waitFor(() => queryClient.getQueryState(['admin', 'cross-company', key])?.status === 'success')` |
| Wait for permission refresh after role change | `waitFor(() => getCurrentUser().then(u => u.roles.includes('super_admin')))` |
| Wait for bulk operation to drain | `waitFor(() => getBulkJob(jobId).then(j => j.processed === j.total))` |

### Moderation-race discipline

A Super Admin approves an item. Another moderator rejected it two seconds earlier. The naive test waits 500ms and asserts `status === 'approved'` — and fails when the reject-then-approve ordering reverses under load. **Wait for the specific state AND the actor:**

```typescript
await waitFor(async () => {
  const item = await getItem(id);
  return item.status === 'approved' && item.moderatedBy === currentUserId;
}, 'approval by current user to take effect');
```

This fails fast and honestly when another moderator's action wins the race, instead of silently mis-asserting.

### Common mistakes

- **Assuming single-moderator semantics.** Super Admin surfaces are multi-actor; your condition must identify WHO produced the state you expect.
- **Polling too fast.** 10ms floor.
- **No timeout.** Every condition-wait needs a ceiling and a clear error — bulk operations especially, since "stuck" bulk jobs are a real failure mode you want the test to surface.

## Cross-company visibility discipline

Super Admin sees data across companies. Bugs where "data is missing" for a Super Admin frequently trace to:
- A filter applied correctly for customers accidentally applied to Super Admin too.
- A permission check returning company-scoped data when super-admin-scoped was expected.
- A backend endpoint with no Super-Admin bypass for company scoping.

## Known-gaps filter

Check `$CONSILIUM_DOCS/doctrine/known-gaps.md` for entries with `Lane: storefront-super-admin` or `Lane: multi-lane` with `storefront-super-admin` in Constituent lanes.

## Escalation signals

If the failure is in backend permission/scope logic that the Super Admin frontend consumes, re-classify to `cross-repo` and load `cross-repo-debugging.md` + `medusa-backend-debugging.md` alongside this one.
