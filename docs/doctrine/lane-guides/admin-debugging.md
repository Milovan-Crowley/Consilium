# Admin Dashboard Debugging — Lane Guide

Medusa Admin dashboard extensions in `/Users/milovan/projects/divinipress-backend/src/admin/`. Widgets, custom pages, forms, tables embedded in the Medusa Admin UI.

## Loading discipline

When this guide is loaded, the Medicus invokes BOTH `Skill(skill: "medusa-dev:building-admin-dashboard-customizations")` AND `Skill(skill: "medusa-dev:building-with-medusa")` — admin customizations are UI on top of backend. Scout/subordinate prompts name both.

## Canonical surfaces

- Admin UI extensions: `src/admin/widgets/**`, `src/admin/routes/**`, `src/admin/pages/**` (paths per current `divinipress-backend` convention).
- Admin-consumed custom API routes: `src/api/admin/**`.
- Admin-related workflows: `src/workflows/**` that fire from admin actions.

## Common failure modes

- Widget injection zone mismatch — widget renders but in the wrong admin page or zone.
- React Query cache drift between admin UI and recently-mutated backend state.
- Admin-only permission enforcement gaps — endpoint consumed by admin UI lacks Medusa's admin-only middleware.
- Workflow step failure during admin-triggered action; Medusa's default error surface in Admin UI is often cryptic.

## Reconnaissance checklist

- Confirm the widget/page is actually mounted (check injection zone, route config).
- Open browser devtools → Network; capture the failing admin API call.
- Check the admin API route's middleware (should include admin-only check).
- If a workflow fires from this action, trace workflow-step execution and compensation.
- Query the Medusa MCP for expected admin API patterns when unfamiliar.

## Timing and async

Admin actions frequently trigger long-running Medusa workflows with compensation steps. The naive approach — sleep for 500ms and hope — fails as workflows evolve and step counts change. **Wait for the workflow state, not a guess at workflow duration.**

### Core rule

Do not sleep. Wait on the actual condition — the workflow step completed, the mutation invalidated the admin React Query cache, the backend returned the new state — with an explicit timeout.

```typescript
// BEFORE — flaky, breaks when a workflow step is added
await new Promise(r => setTimeout(r, 1000));
const updated = await adminSdk.getOrder(orderId);
expect(updated.status).toBe('fulfilled');

// AFTER — reliable
await waitFor(async () => {
  const updated = await adminSdk.getOrder(orderId);
  return updated.status === 'fulfilled';
}, 'order to reach fulfilled state');
```

### Admin patterns

| Scenario | Pattern |
|-|-|
| Wait for workflow step completion | `waitFor(() => query.graph({ entity: 'workflow_execution', filters: { id } }).then(r => r[0]?.state === 'done'))` |
| Wait for admin mutation to settle | `waitFor(() => !mutation.isPending && mutation.isSuccess)` |
| Wait for widget to mount | `await screen.findByTestId('widget-injection-zone-X')` |
| Wait for compensation rollback | `waitFor(() => getWorkflowExec(id).then(w => w.state === 'reverted'))` |

### Generic polling helper

```typescript
async function waitFor<T>(
  condition: () => T | Promise<T> | undefined | null | false,
  description: string,
  timeoutMs = 10_000 // Admin workflows need a higher ceiling than storefront
): Promise<T> {
  const startTime = Date.now();
  while (true) {
    const result = await condition();
    if (result) return result as T;
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10));
  }
}
```

### When an arbitrary timeout IS correct

If a workflow step polls an external system at a known interval (e.g., 500ms), a timed wait after a condition-gate is justified — but document why:

```typescript
// External system polls every 500ms — need 2 polls to confirm retry happened
await waitFor(() => getWorkflowExec(id).then(w => w.state === 'running'));
await new Promise(r => setTimeout(r, 1_100)); // 2 × 500ms + 100ms margin
// At this point, two poll cycles should have completed
```

### Common mistakes

- **Assuming workflow duration is stable.** Workflows change; pin to state, not time.
- **Polling too fast.** 10ms floor; admin workflows are slow enough that faster polling is pure CPU waste.
- **Missing the compensation path.** If a workflow can roll back, your condition-check must distinguish "still running" from "rolled back" — otherwise you wait for a `done` state that never comes.

## Known-gaps filter

Check `$CONSILIUM_DOCS/doctrine/known-gaps.md` for entries with `Lane: admin-dashboard` or `Lane: multi-lane` with `admin-dashboard` in Constituent lanes.

## Escalation signals

If the failure is in workflow logic or data model (not admin UI), re-classify to `medusa-backend` and load `medusa-backend-debugging.md`.
