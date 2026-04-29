# Medusa Backend Debugging — Lane Guide

Backend work in `/Users/milovan/projects/divinipress-backend/src/{modules,workflows,api,subscribers}/`.

## Loading discipline

When this guide is loaded, the Tribunus diagnosis stance invokes `Skill(skill: "medusa-dev:building-with-medusa")` and names it in every speculator/subordinate prompt.

## Canonical surfaces

- `src/modules/**` — data models + service layer.
- `src/workflows/**` — orchestration with compensation.
- `src/api/**` — HTTP route handlers (should be thin; delegate to workflows).
- `src/subscribers/**` — event reactions (delegate mutations to workflows).

## Layering discipline (Medusa idioms)

- Routes call workflows. Routes do NOT coordinate multi-step mutations directly.
- Multi-step mutations live in workflow steps with compensation.
- Raw SQL (`db.raw`) is forbidden outside workflow steps.
- `query.graph()` for graph reads; `query.index()` for filtered link reads.
- Subscribers delegate business mutations to workflows; they do NOT mutate directly.
- `link.create()` inside workflow steps only; not in routes, not in subscribers.

A symptom that violates any of these is usually the root cause.

## Common failure modes

- Route handler performing multi-step mutation without a workflow — fails mid-way with no compensation.
- `query.graph()` + JS filter where `query.index()` was correct — slow or incorrect.
- Subscriber mutating business state directly; race with other subscribers or workflow steps.
- Missing idempotency on money-path endpoints — retries cause double-charge or double-disburse.
- Workflow step missing its compensation — rollback on later failure leaves partial state.

## Reconnaissance checklist

- Identify which of `src/modules/ | src/workflows/ | src/api/ | src/subscribers/` the failing code lives in.
- Check the Medusa docs via MCP: `"What is the correct Medusa pattern for <the failing operation>?"`
- Look for workflow-bypass smells (raw SQL, direct link.create, multi-step in a route).
- For money-path failures, check idempotency key handling.

## Timing and async

Backend timing bugs concentrate around **workflow-step completion waits** — tests and speculators that sleep for N milliseconds and hope the workflow finished, compensation completed, or subscribers drained. Workflows evolve; step counts change; sleeps silently break. **Wait for the workflow-execution state, not a guess at workflow duration.**

### Core rule

Do not sleep. Wait on the actual condition — the workflow reached `done`, the compensation reached `reverted`, the subscriber fired, the link was created — with an explicit timeout.

```typescript
// BEFORE — flaky, breaks whenever a step is added
await startWorkflow('createSavedProduct', { customerId, productId });
await new Promise(r => setTimeout(r, 800));
const saved = await query.graph({ entity: 'saved_product', filters: { customer_id: customerId } });
expect(saved.data.length).toBe(1);

// AFTER — reliable
const execId = await startWorkflow('createSavedProduct', { customerId, productId });
await waitFor(async () => {
  const execs = await query.graph({
    entity: 'workflow_execution',
    filters: { transaction_id: execId },
  });
  return execs.data[0]?.state === 'done';
}, 'createSavedProduct workflow to complete');
```

### Backend patterns

| Scenario | Pattern |
|-|-|
| Wait for workflow step to complete | `waitFor(() => query.graph({ entity: 'workflow_execution', filters: { transaction_id } }).then(r => r.data[0]?.state === 'done'))` |
| Wait for compensation to roll back | `waitFor(() => getWorkflowExec(txId).then(w => w.state === 'reverted'))` |
| Wait for subscriber to drain | `waitFor(() => getEventLog(eventId).then(log => log.processedBy.includes('mySubscriber')))` |
| Wait for module-link creation | `waitFor(() => query.index({ ... }).then(r => r.data.length > 0))` |

### Generic polling helper

```typescript
async function waitFor<T>(
  condition: () => T | Promise<T> | undefined | null | false,
  description: string,
  timeoutMs = 10_000
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

Real timing behavior — debouncer intervals, external system poll cycles, throttled webhooks — requires timed waits. Gate behind a condition, use the known interval, document why:

```typescript
// External webhook processor polls every 200ms — verify retry behavior
await waitFor(() => getWorkflowExec(txId).then(w => w.state === 'running'));
await new Promise(r => setTimeout(r, 450)); // 2 × 200ms + 50ms margin
// Two poll cycles should have completed
```

### Common mistakes

- **Assuming workflow duration is stable.** Workflows change; pin to state, not time.
- **Forgetting compensation.** If your condition waits for `done`, a compensation-triggered `reverted` will timeout instead of failing fast. Distinguish both terminal states in the check.
- **Polling the wrong entity.** If you wait on `saved_product` rows instead of `workflow_execution` state, a silent workflow failure looks identical to a still-running workflow. Poll the workflow state; query the entity for the assertion.

## Known-gaps filter

Check `$CONSILIUM_DOCS/doctrine/known-gaps.md` for entries with `Lane: medusa-backend` or `Lane: multi-lane` with `medusa-backend` in Constituent lanes.

## Escalation signals

If the failure surfaces to a storefront consumer, re-classify to `cross-repo` and load `cross-repo-debugging.md` alongside this one.
