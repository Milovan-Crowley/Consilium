# Storefront Debugging — Lane Guide

Customer-facing pages in `/Users/milovan/projects/divinipress-store`. React / Next.js app; Medusa SDK for data.

## Loading discipline

When this guide is loaded, the Tribunus diagnosis stance also invokes `Skill(skill: "medusa-dev:building-storefronts")` for his own reasoning and names this skill in every speculator/subordinate prompt touching storefront code.

## Canonical surfaces

- Pages: `src/app/**` (App Router) — check for the page-route matching the failing URL.
- Hooks: `src/app/_hooks/**` — React Query + Medusa SDK wrappers.
- Components: `src/components/**`.
- SDK integration: Medusa JS SDK calls through hooks; direct fetch is rare — flag direct fetch as likely contract break.

## Common failure modes

- Stale React Query cache (mutation did not invalidate the right key).
- Zod validation mismatch when backend adds an optional field the frontend's strict schema rejects.
- Session/auth token expired; hook returns error state but UI shows stale success state.
- Locale/i18n mismatch producing missing keys.
- Hydration mismatch when server-rendered and client-rendered shapes differ.

## Reconnaissance checklist

- Reproduce on the affected URL in local dev.
- Capture the React Query devtools state for the failing hook.
- Check Network tab for the exact SDK call and response.
- Read the hook source and trace the SDK method used.
- Check Zod schemas in the hook for strictness against the actual response.

## Timing and async

Storefront timing bugs cluster in React Query state transitions and SDK response waits. **Wait for the condition — the query settled, the mutation invalidated, the hook returned data — not a guess at how long it takes.**

### Core rule

Do not sleep. Do not `await new Promise(r => setTimeout(r, 300))` and hope. Wait on the actual condition with an explicit timeout.

```typescript
// BEFORE — flaky, fails under load
await new Promise(r => setTimeout(r, 500));
const { data } = useSavedProducts();
expect(data).toBeDefined();

// AFTER — reliable
await waitFor(() => {
  const state = queryClient.getQueryState(['saved-products']);
  return state?.status === 'success' && state?.data !== undefined;
});
```

### Storefront patterns

| Scenario | Pattern |
|-|-|
| Wait for React Query settle | `waitFor(() => queryClient.getQueryState(key)?.status === 'success')` |
| Wait for mutation to finish | `waitFor(() => !mutation.isPending)` |
| Wait for SDK response | `waitFor(() => sdk.store.product.list().then(r => r.products.length > 0))` |
| Wait for component render | `await screen.findByText('Expected text')` (Testing Library handles the polling) |

### When an arbitrary timeout IS correct

Animation durations, debounced inputs, throttled scroll handlers — these are real timing behaviors. Gate the timed wait behind a condition, use the known interval, document why:

```typescript
// Search input debounces at 300ms — need to wait for the debounce to fire
fireEvent.change(input, { target: { value: 'query' } });
await waitFor(() => input.value === 'query'); // Condition: input received
await new Promise(r => setTimeout(r, 350));    // Known: 300ms debounce + 50ms margin
// Now the debounced API call should have fired
```

### Common mistakes

- **Polling too fast** — 10ms is the floor; faster just wastes CPU.
- **No timeout** — every condition-wait needs a ceiling and a clear error message.
- **Stale closure** — call `queryClient.getQueryState` inside the loop, do not cache it outside.

## Known-gaps filter

When loaded, the Tribunus diagnosis stance checks `$CONSILIUM_DOCS/doctrine/known-gaps.md` for entries with `Lane: storefront` or `Lane: multi-lane` with `storefront` in Constituent lanes.

## Escalation signals

If the failure is in a backend-produced shape the storefront consumes, re-classify to `cross-repo` and load `cross-repo-debugging.md` alongside this one.
