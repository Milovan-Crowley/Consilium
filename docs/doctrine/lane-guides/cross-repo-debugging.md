# Cross-Repo Debugging — Lane Guide

Flows spanning `/Users/milovan/projects/divinipress-store` ↔ `/Users/milovan/projects/divinipress-backend`. **This is the Divinipress hot path.** Most bugs the Imperator ends up fixing personally are cross-repo contract breaks.

## Loading discipline

When this guide is loaded, the Tribunus diagnosis stance invokes BOTH `Skill(skill: "medusa-dev:building-storefronts")` AND `Skill(skill: "medusa-dev:building-with-medusa")`. Speculator/subordinate prompts name both.

## The cross-repo hypothesis bias

Symptoms that span any UI observation AND any data/backend observation default to cross-repo until evidence proves single-lane. Do not dismiss cross-repo because "it looks like a frontend bug" or "it looks like a backend bug" — the usual failure mode is a contract break that presents at one side but originates at the boundary.

## Common failure modes

- **API contract drift.** Backend changes response shape (adds/renames/removes field); frontend's Zod schema rejects or misses the field.
- **Authentication/session scope mismatch.** Token scopes don't match what the endpoint requires; endpoint silently returns empty or errors in a way the frontend handles as "not found."
- **Workflow-to-frontend race.** Backend workflow completes async; frontend polls or subscribes and sees stale state.
- **Permission scope mismatch.** Frontend asks for data as user-role X; backend interprets as role Y; returns filtered set.
- **Event payload drift.** Subscriber emits events with one shape; consumer (another subscriber, webhook, or frontend socket) expects a different shape.
- **Deployment order.** Breaking change deployed frontend-first or backend-first without backward compatibility; old-side errors on new-side's shape.

## Reconnaissance checklist

- Identify the contract boundary (which API route, which event, which workflow output).
- Capture the actual request/response (Network tab or server logs).
- Compare against the frontend's expected shape (Zod schema, TypeScript type) and the backend's produced shape (route handler return type, workflow output type).
- Check for version mismatch in deployed state (both repos at expected commits).
- Query the Medusa MCP for the canonical shape of the Medusa-native part of the contract.

## Field 14 discipline

The Tribunus diagnosis stance fills packet field 14 (Contract compatibility evidence) BEFORE proposing the threshold:

- `backward-compatible — <evidence>` → Medium, two coordinated marches allowed.
- `breaking — <which consumers error>` → Large, escalate to Consul for synchronized deploy planning.

Do not guess on field 14. If evidence is unclear, speculator first.

## Timing and async

Cross-repo timing bugs almost always live at the contract boundary: the frontend polls or subscribes for a state the backend produces asynchronously, and the race is in who observes what when. The discipline is **wait for the condition, not a guess at how long it takes**.

### Core rule

Do not sleep. Wait for the actual condition — the response arrived, the workflow completed, the event fired — with an explicit timeout and a clear error.

```typescript
// BEFORE — timing guess, fails under load
await new Promise(r => setTimeout(r, 300));
const result = await getWorkflowState(id);
expect(result.status).toBe('complete');

// AFTER — condition-based, reliable
await waitFor(() => getWorkflowState(id).then(s => s.status === 'complete'));
```

### Generic polling helper

```typescript
async function waitFor<T>(
  condition: () => T | Promise<T> | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();
  while (true) {
    const result = await condition();
    if (result) return result as T;
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10)); // Poll every 10ms
  }
}
```

### Cross-repo patterns

| Scenario | Pattern |
|-|-|
| Wait for backend response | `waitFor(() => fetch(url).then(r => r.ok && r.json()))` |
| Wait for workflow completion | `waitFor(() => query.graph({ entity: 'workflow_execution', filters: { id } }).then(r => r[0]?.status === 'complete'))` |
| Wait for event | `waitFor(() => events.find(e => e.type === 'TARGET_EVENT' && e.id === expectedId))` |
| Wait for cache invalidation | `waitFor(() => queryClient.getQueryState(key)?.fetchStatus === 'idle')` |

### When an arbitrary timeout IS correct

Real timing behavior (throttle/debounce intervals, animation durations) requires timed waits — but always gate them behind a condition first, then use the known interval, and document why:

```typescript
// Workflow step polls every 100ms — need 2 polls to verify retry behavior
await waitFor(() => workflow.status === 'running'); // Condition first
await new Promise(r => setTimeout(r, 200));         // Known interval (2 × 100ms)
// 200ms = two poll intervals — documented and justified
```

### Common mistakes

- **Polling too fast** (`setTimeout(check, 1)`) → 10ms is the right floor.
- **No timeout** → every condition-wait must have a ceiling and a clear error message.
- **Stale closure** → call the getter inside the loop, do not cache state outside.

## Root-cause tracing

Bugs manifest where the user sees them — a blank page, a stale number, a 500 response. Your instinct is to patch where the error appears. **That is treating a symptom.** The root cause is upstream, usually at the contract boundary or earlier. Trace backward until you find the original trigger; fix at the source; then add defense-in-depth at every layer between.

### The tracing process

1. **Observe the symptom.** What exactly failed, in what environment, with what data? Capture the concrete evidence (response body, error message, stack trace).
2. **Find the immediate cause.** What code directly produces this symptom? A hook's Zod validation fails — on what field? A route returns 500 — from what line?
3. **Ask: what called this?** Walk one layer up. The hook is consumed by a page — which page? The route is invoked by the SDK — with what arguments?
4. **Keep tracing up.** Follow the data, not just the call chain. If a field is undefined, where was it set? If a value is wrong, where was it computed?
5. **Find the original trigger.** Where did the bad value actually originate? Often: a test-setup state accessed before init, a stale cached response, a schema migration with a backfill gap, a default value in a code path no one reads.

### Cross-repo specifics

A cross-repo bug usually has two candidate causes — the frontend misread the response, or the backend misreturned it. **The real cause is often at the boundary itself.** Do not stop at the first plausible explanation on either side. Name the layer where the expected contract broke in packet field 5.

### Adding stack traces

When you cannot trace manually, instrument. Log before the dangerous operation, not after it fails:

```typescript
async function dangerousOp(input: string) {
  const stack = new Error().stack;
  console.error('DEBUG dangerousOp:', {
    input,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });
  // ... proceed
}
```

Then capture:

```bash
npm test 2>&1 | grep 'DEBUG dangerousOp'
```

**Why `console.error` and not the logger:** loggers may be suppressed in test environments. `console.error` always surfaces. Use it for forensic instrumentation.

### Finding which test causes pollution

If something appears during tests but you do not know which test produces it, use the bisection script `skills/tribune/find-polluter.sh`:

```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```

Runs tests one-by-one, stops at the first polluter. See the script for flags.

### Worked example pattern

A symptom appears deep — for instance, a file created in the wrong directory, or a row inserted into the wrong tenant scope. Typical trace chain:

1. Symptom: operation runs against the wrong target (empty parameter resolves to a default).
2. Immediate cause: the parameter passed in was empty or missing.
3. One level up: the caller passed a value from a context object.
4. Two levels up: the context was accessed before initialization (top-level variable captured the initial empty state).
5. Root: the setup helper returned `{ tempDir: '' }` initially, and a test captured the reference before `beforeEach` populated it.

**Fix at source:** convert the empty value to a getter that throws if accessed before init.

**Then add defense-in-depth** at each layer — entry validation, business-logic guard, environment guard, debug instrumentation (see next section).

### The non-negotiable

**Never fix just the symptom.** Trace backward to find the original trigger, fix there, then add validation at every layer between the trigger and the symptom. A bug fixed only at the symptom point is a bug that will recur via a different code path.

## Defense in depth

When you fix a bug caused by invalid data, adding a single validation feels sufficient. But that single check can be bypassed — by a different code path, by refactoring, by mocks, by a caller that skips the validated entry point. **Validate at every layer the data passes through. Make the bug structurally impossible.**

### The four layers

**Layer 1 — Entry-point validation.** Reject obviously invalid input at the API boundary.

```typescript
function startWorkflow(name: string, payload: unknown) {
  if (!name || name.trim() === '') {
    throw new Error('workflow name cannot be empty');
  }
  const parsed = PayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`invalid payload: ${parsed.error.message}`);
  }
  // ... proceed
}
```

**Layer 2 — Business-logic validation.** Ensure the data makes sense for this specific operation, not just generically well-formed.

```typescript
function createSavedProduct(customerId: string, productId: string) {
  if (!customerId) {
    throw new Error('customerId required for saved-product creation');
  }
  if (!productId) {
    throw new Error('productId required for saved-product creation');
  }
  // ... proceed
}
```

**Layer 3 — Environment guards.** Prevent dangerous operations in specific contexts where they would cause harm.

```typescript
async function writeToExternalSystem(target: string, data: unknown) {
  if (process.env.NODE_ENV === 'test') {
    // Refuse production-targeting writes during tests
    if (!target.startsWith('https://test.') && !target.startsWith('http://localhost')) {
      throw new Error(`Refusing external write in test env: ${target}`);
    }
  }
  // ... proceed
}
```

**Layer 4 — Debug instrumentation.** Capture context so that when a layer above fails silently (a mock bypasses the guard, an edge case slips through), you have forensic evidence.

```typescript
async function sensitiveOp(input: string) {
  const stack = new Error().stack;
  console.error('About to run sensitiveOp', {
    input,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

### Applying the pattern

1. **Trace the data flow.** Where does the bad value originate? Where is it used? (Use the Root-cause tracing section above.)
2. **Map all checkpoints.** List every layer the data passes through between origin and dangerous use.
3. **Add validation at each layer.** Entry, business, environment, debug — each layer has a distinct purpose.
4. **Test each layer.** Try to bypass layer 1; verify layer 2 catches it. Mock layer 2; verify layer 3 guards it.

### Cross-repo boundaries

For cross-repo bugs, the two most important layers are the frontend Zod at the hook level and the backend Zod at the route level. A cross-repo bug that survives both validations is usually a schema-coordination break — both schemas drifted together, or neither was updated when the contract changed. When fixing, add a boundary test to the verification plan (frontend parses a recorded backend response; backend route produces a shape the frontend's parser accepts).

### Key insight

All four layers are necessary. During testing, each layer catches bugs the others miss:

- Different code paths bypass entry validation.
- Mocks bypass business-logic checks.
- Edge cases on different platforms need environment guards.
- Debug logging identifies structural misuse when everything else passes.

**Do not stop at one validation point.** The goal is not "we fixed the bug" — it is "we made the bug impossible."

## Known-gaps filter

Check `$CONSILIUM_DOCS/doctrine/known-gaps.md` for entries with `Lane: cross-repo` or `Lane: multi-lane`.

## Escalation signals

If evidence resolves the bug to a single side (pure frontend or pure backend), re-classify to the specific lane and load that lane's guide. Cross-repo-as-default does not mean cross-repo-as-final — evidence promotes or demotes the classification.
