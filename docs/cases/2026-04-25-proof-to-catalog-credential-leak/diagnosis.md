# 2026-04-25-proof-to-catalog-credential-leak — Diagnosis

**Lane:** medusa-backend (single-repo)
**Threshold:** medium (single-repo medium)
**Target worktree:** `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy`
**Branch HEAD:** `f6196b5` (DIV-99 merged)
**Verification iteration:** Pass 3 (Pass 2 returned to Imperator gate; gate response = `revise` with three amendments; this draft incorporates them).
**Verifiers (Pass 2):** Tribunus → SOUND; Provocator → SOUND on mechanism, GAP on sibling pattern, CONCERN on Site-A shell fragility, CONCERN on Node preflight.
**Imperator amendments (Pass 3):** (1) `.env.test` HEAD-vs-local truth; (2) pick a single fix — accept Site-A fragility OR redirect to deterministic guard (resolved: redirected); (3) reframe Site B language to drop any implication that empty `orderProduct.items` is semantically valid in production.

---

## Confidence Map

| Field | Confidence | Note |
|-|-|-|
| 1 Symptom | High | reproduced under Node 22 |
| 2 Reproduction | High | full stack captured, both bleeds independently inducible |
| 3 Affected lane | High | medusa-backend, single repo |
| 4 Files inspected | High | absolute paths cited; `.env.test` HEAD/worktree/skip-worktree distinction explicit |
| 5 Failing boundary | High | two distinct boundaries (env + schema) |
| 6 Root-cause hypothesis | High | dual-bleed mechanism, both empirically traced through library code |
| 7 Supporting evidence | High | file:line citations; Pass-3 alternate independently verified |
| 8 Contrary evidence | High | Pass-1 fix-site error AND Pass-2 Site-A fragility retained as honest contrary evidence |
| 9 Known gap | High | none of medusa-backend / multi-lane KGs match |
| 10 Proposed fix site | High | deterministic guard at `_utils/s3.ts` (replaces fragile `.env.test` approach) + `proof-to-catalog.spec.ts:532` Zod-pass-through; empirically verified end-to-end |
| 11 Fix threshold | High | medium (two files, single repo, ~5 lines, no schema/dep/signature change) |
| 12 Verification plan | High | exact commands, scout-verified |
| 13 Open uncertainty | Medium | architectural smell deferred; sibling GAP documented |
| 14 Contract compat | N/A | single-lane (single-repo medium does not require field 14) |

---

## 1. Symptom

`yarn test:integration:http --testPathPattern=proof-to-catalog` fails 1/2 with HTTP 500 `NoSuchKey` returned from `POST /store/carts/{id}/custom-complete` at `proof-to-catalog.spec.ts:196`. The S3 SDK reports `BucketName: 'divinipress-store'` (production DigitalOcean Spaces bucket), 404 on a freshly-minted temp upload key.

## 2. Reproduction

Worktree `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy`, branch `feature/div-82-importer-hierarchy` (HEAD `f6196b5`, DIV-99 merged):

```
nvm use 22  # package.json declares engines.node=22.*
yarn test:integration:http --testPathPattern=proof-to-catalog
```

Result: `1 failed, 1 skipped, 2 total`. Stack:

```
NoSuchKey: UnknownError
  at de_NoSuchKeyRes (@aws-sdk/client-s3 de_CopyObjectCommand)
  at moveS3File (src/api/_utils/s3.ts:148:3)
  at moveUploadsToCustomOrder (src/api/_utils/s3.ts:182:20)
  at POST (src/api/store/carts/[id]/custom-complete/route.ts:353:26)
$metadata.httpStatusCode: 404; Code: 'NoSuchKey'; BucketName: 'divinipress-store'
```

After the credential-leak fix alone, the test progresses past the S3 boundary and exposes a second pre-existing failure at `proof-to-catalog.spec.ts:540-542`: the assertion `expect(error.response.data.message).toContain("Cannot transition catalog order from PROOF_DONE status")` fails because the route returned a Zod validation error message instead of the catalog-terminal-status error message — the request body `{ event: EVENT.orderProduct }` violates `orderProductSchema`'s required `items` at `src/api/custom-order/[id]/route.ts:25-29`, so Zod throws before the terminal-status guard runs.

Companion: `non-apparel-cart` test passes 20/20 (49 s) on baseline AND under both fixes (regression gate intact, with caveat in field 8 about narrow scope).

## 3. Affected lane

`medusa-backend` (single-repo). One backend utility (`src/api/_utils/s3.ts`) and one integration test fixture (`integration-tests/http/proof-to-catalog.spec.ts`) — both inside `divinipress-backend`. No storefront UI surface; no UI observation paired with a backend observation. Cross-Repo Default Rule does not trigger.

## 4. Files / routes inspected

- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/proof-to-catalog.spec.ts` — failing spec; `it.skip` at :605 explains the "1 skipped" count.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/non-apparel-cart.spec.ts` — passing companion; uses `upload_ids: []` exclusively, never exercises `_utils/s3.ts`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/proof-to-order.spec.ts` — sibling spec; same `{ event: EVENT.orderProduct }`-without-items pattern at line 463 (currently masked; see field 13).
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/jest.config.js` — `loadEnv("test", cwd)` at line 1-2; `setupFiles` at 21-24.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/setup.js` — three lines, only clears MikroORM metadata. (Pass-1 proposed fix site — proven inadequate; see field 8.)
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/.env.test` — **`S` (skip-worktree)** flag set per `git ls-files -v -- .env.test`. **HEAD-tracked content is EMPTY** (0 lines per `git show HEAD:.env.test | wc -l`). Local worktree state is per-developer, not propagated through git. Different developers may carry different local copies; the file is intended as a per-developer overlay, not a tracked test config. Pass-2 Site A (append empty `DO_BUCKET_*=` lines to `.env.test`) was rejected at the gate partly because of this — modifying `.env.test` does not propagate to teammates without first clearing skip-worktree, which would expose every developer's local DB/JWT credentials in HEAD. This file is not a fix site for this packet.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/.env` → symlink → `/Users/milovan/projects/divinipress-backend/.env` (production env file; lines 17-22 contain all six `DO_BUCKET_*` keys).
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/medusa-config.ts:1-7` — line 4 `loadEnv(process.env.NODE_ENV || "development", process.cwd())` runs at config-import time (a SECOND loadEnv pass after `setupFiles`); line 113 file-module test-skip.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/_utils/s3.ts:21-71, 130-166, 172-190` — parallel direct-AWS-SDK client. **Tracked (`H`), not skip-worktree** — eligible fix site.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/store/carts/[id]/custom-complete/route.ts:319-415` — `moveUploadsToCustomOrder` invocation site.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/custom-order/[id]/route.ts:19-62, 237-379` — `postSchema` discriminated union; `orderProductSchema` at 25-29 requires `items`; `postSchema.parse(req.body)` at 243 runs BEFORE `transitionOrderStatus` at 298.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/custom-order/order-flow.ts:679-728` — `validateEventTransition`; line 685-693 catalog+`PROOF_DONE` terminal check; line 559-579 `EVENT.orderProduct` side effect feeds `items` to `createOrderFulfillmentWorkflow`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/utils/dist/common/load-env.js` — `dotenv.config({ path: [".env.test", ".env"] })` with no `override` flag (first-wins).
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/dotenv/lib/main.js:218-260, 313-340` — `populate` skips keys already in `process.env` unless `override: true`.
- `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/node_modules/@medusajs/test-utils/dist/medusa-test-runner.js:156` — `MedusaTestRunner.beforeAll` triggers `getConfigFile` → dynamic-import of `medusa-config.ts` → second `loadEnv` pass AFTER `setupFiles`.

## 5. Failing boundary

Two boundaries broke; the second was masked by the first.

- **(B-env) Test environment ↔ file-storage credential boundary.** `_utils/s3.ts:21-37` infers test mode from credential absence, but `loadEnv("test", cwd)` populates `process.env` from `.env` (which symlinks to production), defeating the inference. The escape hatch at `_utils/s3.ts:137-140` never fires.
- **(B-schema) Test fixture ↔ route Zod schema.** Test sends `{ event: EVENT.orderProduct }` with no `items`, but `orderProductSchema` at `[id]/route.ts:25-29` requires `items: z.array(z.object({ id, quantity }))`. `postSchema.parse(req.body)` at line 243 throws ZodError before `transitionOrderStatus` at line 298 runs. Outer catch at `[id]/route.ts:371-378` wraps as `MedusaError(INVALID_ARGUMENT)`, returning a status with a Zod message instead of the expected catalog-terminal-status message.

## 6. Root-cause hypothesis

A dual-bleed test divergence:

1. **Credential leak**: the worktree convenience symlink `.env -> production .env` causes `loadEnv("test")` to populate `process.env` with live DigitalOcean credentials. `_utils/s3.ts` builds a real S3 client; route handler at `custom-complete:353` invokes `CopyObjectCommand` against bucket `divinipress-store` for a key that exists only as a DB row → `NoSuchKey 404`. The existing escape hatch infers test-mode from credential absence, an inference invalid in this worktree.
2. **Schema-test divergence**: `orderProductSchema` requires `items` because `EVENT.orderProduct`'s side effect (`order-flow.ts:559-579`) feeds items into `createOrderFulfillmentWorkflow` — items are mandatory for fulfillment in production. The test fixture omits `items` deliberately because it is asserting the catalog-terminal-status rejection, but the omission causes Zod to fire first, masking the transition guard. Items are NOT semantically valid as empty for orderProduct in production; the test's `items: []` is purely a Zod-structural pass-through to reach the terminal-status guard for assertion.

Neither bleed was introduced by DIV-82 or DIV-99. Both predate this branch. DIV-99 is implicated only because `non-apparel-cart`'s empty-uploads short-circuit at `custom-complete/route.ts:326-330` lets that suite bypass `_utils/s3.ts` entirely, so it never triggered the leak.

The Pass-1 hypothesis on root cause was correct; the Pass-1 fix site at `setup.js` was wrong — see field 8. The Pass-2 fix site at `.env.test` was mechanically valid but operationally fragile (skip-worktree, shell-export susceptibility) — see field 8.

## 7. Supporting evidence

- `_utils/s3.ts:21-37` — six-key check returning null only when ALL `DO_BUCKET_*` are absent.
- `_utils/s3.ts:50-71` — lazy `s3Client` builds real SDK client when config present.
- `_utils/s3.ts:130-140` — escape comment `// S3 not configured (likely test environment)` + early return.
- `_utils/s3.ts:148-155` — throw site `CopyObjectCommand` against `Bucket: divinipress-store`.
- `medusa-config.ts:4` — second `loadEnv` at config-import time (defeats any pre-config delete).
- `medusa-config.ts:113` — `isTest || !process.env.DO_BUCKET_ACCESS_KEY_ID ? [] : [@medusajs/medusa/file]`.
- `jest.config.js:1-2` — first `loadEnv("test", process.cwd())`.
- `node_modules/@medusajs/test-utils/dist/medusa-test-runner.js:156` — triggers second loadEnv via dynamic-import of `medusa-config.ts`.
- `node_modules/@medusajs/utils/dist/common/load-env.js:28, 31` — `dotenv.config({ path: [".env.test", ".env"] })` no override.
- `node_modules/dotenv/lib/main.js:218-260, 313-340` — `populate` first-wins.
- `git ls-files -v -- .env.test` → `S .env.test` (skip-worktree); `git show HEAD:.env.test | wc -l` → `0` (HEAD content empty).
- `.env` symlink (verified by `readlink`).
- production `.env:17-22` — six `DO_BUCKET_*` keys including `DO_BUCKET_NAME=divinipress-store`.
- `proof-to-catalog.spec.ts:196` — failing axios POST.
- `proof-to-catalog.spec.ts:528-543` — orderProduct request body without `items`; line 540-542 message-content assertion.
- `proof-to-catalog.spec.ts:605` — `it.skip("reject proof to catalog flow", ...)` accounts for "1 skipped".
- `[id]/route.ts:25-29` — `orderProductSchema` requires `items`.
- `[id]/route.ts:243` — `postSchema.parse` runs at request entry, before transition logic.
- `[id]/route.ts:298, 354-360, 377` — transition guard inside inner try; outer catch wraps Zod as `INVALID_ARGUMENT`.
- `order-flow.ts:559-579` — `EVENT.orderProduct` side effect: items fed to `createOrderFulfillmentWorkflow` (production constraint, schema is correct).
- `order-flow.ts:685-693` — catalog+`PROOF_DONE` terminal check.
- `custom-complete/route.ts:344-360` — unconditional `moveUploadsToCustomOrder` for non-empty `upload_ids`.
- **Empirical (Pass 3, post-redirect)**: independent scout stripped residual Site-A lines from local `.env.test` (back to 18 lines pre-session), applied the alternate fix at `_utils/s3.ts:22-25` (NODE_ENV guard) + Site B at `proof-to-catalog.spec.ts:532` (`items: []`), ran tests under Node 22.22.2 → `proof-to-catalog: 1 passed, 1 skipped, 2 total` (12.6 s) and `non-apparel-cart: 20 passed, 20 total` (61 s). All edits reverted; `git diff` clean on both tracked files; `.env.test` retained skip-worktree state.

## 8. Contrary evidence

- **Pass-1 fix site (`setup.js` delete) does NOT work.** Provocator empirically applied `delete process.env.DO_BUCKET_*` in `integration-tests/setup.js`, re-ran the test, observed identical `NoSuchKey`. Mechanism: `medusa-config.ts:4` calls `loadEnv` itself; `MedusaTestRunner.beforeAll` (`medusa-test-runner.js:156`) dynamic-imports `medusa-config.ts` AFTER `setupFiles`, re-loading env from `.env`. Retained as honest record.
- **Pass-2 fix site (`.env.test` empty `DO_BUCKET_*=` overrides) was rejected at the Imperator gate.** Two reasons: (a) `.env.test` is `S` (skip-worktree) with empty HEAD content, so the fix can't propagate via git without first clearing skip-worktree, which would expose every developer's local DB/JWT credentials in HEAD; (b) dotenv's first-wins (`dotenv/main.js:325`) skips populating keys already present in `process.env` — if any developer exports `DO_BUCKET_*` in their shell (common when prod-debugging), Site A silently fails. The Pass-2 packet's claim that `.env.test` had no `DO_BUCKET_*` keys was based on session-start state; Pass-2 verification scouts subsequently added the lines locally and "reverted" through skip-worktree as a no-op, leaving residual contamination that the Pass-3 verification scout had to strip before testing the alternate. Retained as honest record of how skip-worktree foiled the iteration.
- **Route-architecture smell** — `_utils/s3.ts` is a parallel direct-AWS-SDK client that bypasses the registered Medusa file module. Logged as CONCERN, not root cause: the parallel client predates DIV-82/DIV-99; refactoring to use the file module is a separate scope.
- **`non-apparel-cart` regression gate has narrow scope.** That suite uses `upload_ids: []` exclusively, so the empty-uploads short-circuit at `custom-complete/route.ts:326-330` skips `_utils/s3.ts` entirely. Passing `non-apparel-cart` confirms DIV-99 contract intact but does NOT directly exercise the S3 path. The affirmative coverage is `proof-to-catalog` itself, which after the fix passes.
- **Site B is the divergent party, not the route.** Storefront callers (`updateOrder.ts:11-18`, quarantine `AdminOrderApparelProductDetails.tsx:262-265`) always pass `items` to orderProduct. Only the test omits items. Relaxing the route schema would weaken production safety; the test must satisfy the route's structural contract — even when the test is asserting a NEGATIVE outcome (terminal-status rejection).
- No additional contrary evidence after deliberate search.

## 9. Known gap considered

- **ID:** None applicable
- **Why relevant:** Filtered by `Lane: medusa-backend` OR `multi-lane` with `medusa-backend` in Constituent lanes → 3 in-filter entries: `KG-MEDUSA-MONEY-AND-QUERY` (price-unit / query.graph), `KG-ADMIN-HOLD-PLACEHOLDER` (state-machine), `KG-ONBOARDING-PROMO-METADATA` (free-shirt redemption). Out-of-filter cross-repo entries (`KG-INVITE-ONBOARDING-SPLIT`, `KG-NON-APPAREL-OPTIONS`, `KG-TEAM-NAME-SCOPE`, `KG-TEAM-PERMISSIONS`) cross-checked over-inclusively for completeness.
- **Live recheck performed:** yes — symptom-signature comparison against each of the 7 KG entries.
- **Result:** No entry matches the test-environment credential-leak signature OR the test-route-Zod-divergence signature.
- **Used as evidence:** no

## 10. Proposed fix site

Two sites, single repo (`divinipress-backend`):

**Site A — deterministic test-mode guard at `src/api/_utils/s3.ts`**

Path: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/src/api/_utils/s3.ts:21`.

Modify `getS3Config` to return null when `NODE_ENV === "test"` regardless of credential presence. Concrete shape (4-line addition):

```ts
function getS3Config(): S3Config | null {
  // Test environments must never reach real S3 even when credentials leak through .env.
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  const accessKeyId = process.env.DO_BUCKET_ACCESS_KEY_ID;
  // ... existing body unchanged ...
}
```

Mechanism: Jest unconditionally sets `process.env.NODE_ENV = "test"` before any test code runs. The guard fires deterministically in any test environment regardless of (a) whether `.env.test` is tracked or skip-worktree, (b) what `.env.test` contains, (c) whether `.env` symlinks to production, (d) whether shell exports `DO_BUCKET_*`, (e) whether `medusa-config.ts:4` re-runs `loadEnv`. `getS3Config()` returns null → `getS3Client()` returns null → `moveS3File` short-circuits at `_utils/s3.ts:137-140` (existing escape hatch) → `moveUploadsToCustomOrder` returns `[]` → `custom-complete/route.ts:363` skips the DB-update branch (`if (movedFiles.length > 0)`).

Production behavior unchanged: in production, `NODE_ENV` is `production` (or unset), the new guard does not fire, the existing six-key check runs.

**Site B — Zod structural pass-through in `proof-to-catalog.spec.ts:532`**

Path: `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy/integration-tests/http/proof-to-catalog.spec.ts:532`.

Modify the orderProduct request body to include an empty `items` array:
```ts
// from
{ event: EVENT.orderProduct }
// to
{ event: EVENT.orderProduct, items: [] }
```

Purpose and limit: the test is asserting that orderProduct on a catalog order in `PROOF_DONE` status is rejected with a specific terminal-status error message. To run that assertion, the request must first pass `postSchema.parse` at `[id]/route.ts:243`. `orderProductSchema` requires `items` as a structural field, so the body needs an `items` field. Empty array satisfies the structural requirement without making any semantic claim about whether `orderProduct` with empty items would be valid in production — it would not be (the side effect at `order-flow.ts:559-579` would fail or produce nothing). This change is a Zod-structural pass-through purely so the catalog-terminal-status guard at `order-flow.ts:685-693` becomes the authoritative rejection, which is what the test is asserting.

This is a test-side fix. The route's stricter `items` requirement is correct for production callers; the test was written before that strictness and was masked from failing on this surface by the upstream S3 bleed.

## 11. Fix threshold

`medium` (single-repo medium).

Justification:
- 2 files modified (`src/api/_utils/s3.ts`, `integration-tests/http/proof-to-catalog.spec.ts`) → cannot be `small` per `fix-thresholds.md` ("single file" exclusion).
- ≤30 lines total delta (~5 lines: 4-line guard at Site A + 1-line items addition at Site B).
- Single repo (`divinipress-backend`).
- No data model change. No workflow change. No exported-symbol-signature change (`getS3Config` is not exported; its return type is unchanged; only its body is altered). No new dependency. No DB migration.
- Field 14 = N/A because this is single-repo, not cross-repo medium.

`small`-collapse alternatives considered and ruled out:
- Single-file at `_utils/s3.ts` only (omit Site B): the Zod-divergence bleed remains; test still fails on message-content assertion at `:540-542`. Insufficient.
- Single-file at `proof-to-catalog.spec.ts` only (omit Site A): the credential leak remains; test still fails with `NoSuchKey` at `:196` before reaching the orderProduct assertion. Insufficient.
- Single-file at `[id]/route.ts` relaxing `orderProductSchema`: violates `small` exclusion (schema change) AND weakens production safety per field 8 (Site B contrary-evidence point).

Per `fix-thresholds.md`, single-repo medium is "one full `/march`." Legion runs one Soldier with the case file as orders, executes the verification plan as the acceptance test.

## 12. Verification plan

```
cd /Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy
nvm use 22   # engines.node = 22.* (no .nvmrc enforces this; Node 25 trips on SlowBuffer.prototype in buffer-equal-constant-time before reaching the test)

yarn test:integration:http --testPathPattern=proof-to-catalog
# MUST report: Tests: 1 passed, 1 skipped, 2 total
# (the skip is pre-existing `it.skip("reject proof to catalog flow", ...)` at proof-to-catalog.spec.ts:605 — NOT a new skip introduced by the fix)

yarn test:integration:http --testPathPattern=non-apparel-cart
# MUST report: Tests: 20 passed, 20 total
```

Both commands must exit 0. Empirically verified by Pass-3 scout: `proof-to-catalog` 12.6 s, `non-apparel-cart` 61 s, both green.

**Soldier note**: Do NOT modify `.env.test` as part of this fix. The file is `S` (skip-worktree) with empty HEAD content; touching it requires clearing skip-worktree and would surface per-developer secrets. Some developer worktrees may currently carry residual blank `DO_BUCKET_*=` lines from prior verification iterations — they are harmless (the alternate's NODE_ENV guard makes the leak path unreachable regardless) and can be removed locally without consequence.

## 13. Open uncertainty

- **Architectural smell deferred**: `src/api/_utils/s3.ts` parallel S3 client bypasses Medusa file module. Routing file mutations through `fileService.move(...)` would consolidate the storage abstraction. Out of scope here per Imperator's "don't change proof/order semantics."
- **Sibling pattern at `proof-to-order.spec.ts:463`** — same `{ event: EVENT.orderProduct }`-without-items divergence in the sibling spec. Currently MASKED by an unrelated pre-existing 500 at `proof-to-order.spec.ts:52` (POST `/company` Zod error: admin field shape mismatch). When that other defect is fixed, line 463 will surface the same Zod-vs-transition-guard pattern. Recorded as known-deferred follow-up; the Imperator accepted this as deferred at the Pass-2 gate. Imperator may still elect to fold a one-line preventive fix (`items: []` at `proof-to-order.spec.ts:463`) into this dispatch.
- **`.env.test` as per-developer hidden state** — the file's tracked HEAD is empty and skip-worktree is set. The Site-A approach in Pass-2 was incompatible with this without first promoting `.env.test` to a tracked overlay (which would expose per-developer credentials). The deterministic NODE_ENV guard at Site A (this packet's revised proposal) avoids `.env.test` entirely and is therefore robust to whatever per-developer state exists.
- **Schema-test divergence is symptomatic, not systemic**: empirical scout run shows no third bleed in `proof-to-catalog.spec.ts` itself. A broader audit for similar test/schema mismatches across all integration specs is a separate scope (the Provocator's Pass-2 finding identified one such sibling at `proof-to-order.spec.ts:463`; whether others exist is unprobed).

## 14. Contract compatibility evidence

`N/A — single-lane / single-repo medium fix.` Per `diagnosis-packet.md:33-36`, field 14 is REQUIRED only when "Affected lane = `cross-repo` OR Fix threshold = `medium` on cross-repo scope." This is single-repo medium, so N/A is doctrinally correct.

No API surface change (route Zod schema is unchanged), no exported-symbol signature change, no storefront contract touched. Verified independently:
- Storefront caller `divinipress-store/src/app/_api/catalog/proofToMyProduct.ts:104-125` does not consume URL fields from this response.
- Storefront orderProduct callers (`divinipress-store/src/app/_api/orders/updateOrder.ts:11-18`, quarantine `AdminOrderApparelProductDetails.tsx:262-265`) always pass `items`; production behavior untouched by Site B.
- `rg "DO_BUCKET" /Users/milovan/projects/divinipress-store` → 0 hits; no storefront dependence on env-loading shape.
- Production `NODE_ENV` is not `"test"`, so the new guard at Site A is unreachable in production. Production retains its existing six-key behavior.

---

## Verifier disposition

**Pass 2 — Tribunus (diagnosis stance):** SOUND across all 14 fields. Empirically re-verified Sites A and B by reverting/applying both. Threshold-honesty probe ruled out single-file `small` collapse. Confidence-map High ratings defensible after Pass-1 miscalibration was caught.

**Pass 2 — Provocator:** SOUND on mechanism, threshold, lane, and field 14. Found:
- One **GAP** — sibling pattern at `proof-to-order.spec.ts:463`. Currently masked. Documented as known-deferred in field 13.
- One **CONCERN (mechanism)** — Site A (`.env.test`) is fragile to shell `DO_BUCKET_*` exports.
- One **CONCERN (documentation)** — verification plan should preflight Node version. Already addressed in field 12 with `nvm use 22`.

**Pass 3 — Imperator gate response (`revise`):** Three amendments required:
1. `.env.test` HEAD-vs-local-vs-skip-worktree truth must be explicit. **Resolved**: field 4 now states `S` flag, empty HEAD, and per-developer local state explicitly. Field 13 carries the policy implication. The new fix site avoids `.env.test` entirely.
2. Pick a single fix — accept Site-A fragility OR redirect to deterministic guard. **Resolved**: redirected to deterministic NODE_ENV guard at `_utils/s3.ts:21`. Justification: skip-worktree complication compounds shell-export fragility — the test-side fix cannot propagate through git without exposing per-developer secrets, and even then is shell-pollution-sensitive. The `_utils/s3.ts` guard is single-file at the boundary that owns the bleed, deterministic on `NODE_ENV`, and has no production effect.
3. Reframe Site B language to drop any implication that empty `orderProduct.items` is semantically valid. **Resolved**: field 6 and field 10 now explicitly state `items: []` is a Zod-structural pass-through purely to reach the terminal-status guard, NOT a semantic assertion of valid empty-items orderProduct. The route's `items` requirement is correct for production callers.

Pass-3 empirical verification (alternate + Site B): `proof-to-catalog: 1 passed, 1 skipped, 2 total` (12.6 s); `non-apparel-cart: 20 passed, 20 total` (61 s). Worktree clean post-revert.

The Medicus considers the packet dispatch-ready at threshold `medium`. Awaiting final Imperator approval.
