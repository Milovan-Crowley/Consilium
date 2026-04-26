# DIV-71 Non-Apparel Cart Rendering Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the storefront cart's non-apparel rendering against the now-finalized DIV-99 backend metadata contract. Fix six concrete rendering gaps without changing backend behavior or any other surface.

**Architecture:** Two-file change. `useCart.ts` adapts line-item metadata into the per-group `CartGroupedItem` shape; `cart/page.tsx` renders that shape. All fixes land in these two files. No new modules, no new components, no helper extraction beyond two trivial in-file pure functions (`formatOptionLabel`, `formatQuantity`).

**Tech Stack:** Next.js 16 App Router, React 19, Medusa v2 SDK types, Tailwind, shadcn/Base UI components.

**Spec source-of-truth:** `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/spec.md` (r3.1, sealed by Imperator after two rounds of Censor + Provocator verification).

**Backend dependency:** `divinipress-backend` PR #33 (DIV-82 + DIV-99). Must be running locally for verification: worktree at `/Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy` on port 9000.

**Verification:** Manual screenshots only — no test-runner retrofit, no Storybook scaffolding (no config exists in repo; adding either is refactor churn per spec's testing strategy).

**Lint gate dropped — repo-wide pre-existing issue.** `yarn lint` is broken in Next 16 (the `next lint` CLI was removed in Next 15→16; confirmed by direct invocation). `npx eslint` also fails with `TypeError: Converting circular structure to JSON` due to legacy `.eslintrc.json` incompatibility with current eslint plugins. Neither is DIV-71's scope to fix. The spec's "yarn lint clean" gate is structurally unrunnable at this commit; this plan executes against `npx tsc --noEmit` only. File a separate Linear ticket: "DIV-71 follow-up: restore lint runnable (next lint removed in Next 16; flat-config migration or alternate runner)."

**Stale-state safety.** `develop` may have moved between plan authoring and soldier execution. Each implementation task's "Read the file" sub-step is the gate: if the quoted current-state code does NOT match what the soldier actually finds, halt the task and escalate to the Imperator. Do NOT improvise.

**Commit grouping (load-bearing — see spec implementation steps):**
- Task 2 ships Fix #5 fallback + de-dup as ONE commit (intermediate state would render duplicate rows).
- Task 5 ships Fix #2 + Fix #3 as ONE commit (Fix #2 without Fix #3 renders unformatted prominent quantity).
- All other tasks are one commit each.

---

## Pre-flight setup

### Task 1: Worktree creation + environment

> **Confidence: High** — standard git worktree pattern, target path verified clean by scout in Consul reconnaissance.

**Files:**
- Create: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering/` (worktree)
- Create: `/Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering/.env.local` (gitignored, no commit)

- [ ] **Step 1: Fetch latest develop**

```bash
cd /Users/milovan/projects/divinipress-store
git fetch --prune origin
git rev-parse origin/develop
```

Expected: prints SHA of `origin/develop` HEAD.

- [ ] **Step 2: Create the worktree**

```bash
cd /Users/milovan/projects/divinipress-store
git worktree add -b feature/div-71-non-apparel-cart-rendering /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering origin/develop
```

Expected: worktree created, branch `feature/div-71-non-apparel-cart-rendering` created off `origin/develop`.

- [ ] **Step 3: Confirm worktree state**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
git status
git log --oneline -3
```

Expected: clean working tree, HEAD points at `origin/develop` SHA from Step 1.

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
yarn install
```

Expected: `Done in Xs` with no errors. Yarn 4.3.1 — do NOT use npm or pnpm.

- [ ] **Step 5: Configure backend pointing**

Create `.env.local` in the worktree root with this single line:

```
NEXT_PUBLIC_API_URL=http://localhost:9000
```

This file is gitignored — no commit needed.

- [ ] **Step 6: Verify backend is reachable**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:9000/health
```

Expected: `200`. If not 200, START the backend dev server in a separate terminal:

```bash
cd /Users/milovan/projects/worktrees/divinipress-backend/feature/div-82-importer-hierarchy
yarn dev
```

Then re-run the curl. Do NOT proceed to Task 2 until the health check returns 200.

- [ ] **Step 7: Smoke-start the storefront dev server**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
yarn dev
```

Expected: Next.js boots, prints `Local: http://localhost:3000`. Stop the dev server (`Ctrl+C`) before proceeding to Task 2 — Task 2 starts it fresh after edits.

---

## Implementation

### Task 2: Fix #5 (full) — designName fallback + render-site de-dup

> **Confidence: High** — `useCart.ts:94` and `page.tsx:500` verified byte-accurate against `develop`. Fallback chain and normalized de-dup match spec r3.1 fix table.

**Files:**
- Modify: `src/app/cart/_hooks/useCart.ts:94`
- Modify: `src/app/cart/page.tsx:500`

**Why one commit:** Shipping the fallback alone (without the de-dup) would render duplicate adjacent rows for any line missing `product_name` — breaks Acceptance Criterion #6 in the intermediate state.

- [ ] **Step 1: Read both files**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
cat src/app/cart/_hooks/useCart.ts | sed -n '90,100p'
cat src/app/cart/page.tsx | sed -n '498,503p'
```

Confirm useCart.ts:94 reads:
```ts
      const designName = (firstItem.metadata?.product_name ?? "") as string;
```

Confirm page.tsx:500 reads:
```tsx
                      <p className="font-medium">{group.productName}</p>
```

- [ ] **Step 2: Edit `useCart.ts:94`**

Replace this block:

```ts
      // Design name
      const designName = (firstItem.metadata?.product_name ?? "") as string;
```

With:

```ts
      // Design name — fall back to product title, then a generic label.
      const designName =
        (firstItem.metadata?.product_name as string | undefined) ||
        (firstItem.product_title as string | undefined) ||
        "Custom Order";
```

- [ ] **Step 3: Edit `page.tsx:500`**

Replace this line:

```tsx
                      <p className="font-medium">{group.productName}</p>
```

With:

```tsx
                      {group.productName &&
                        group.productName.trim().toLowerCase() !==
                          group.designName.trim().toLowerCase() && (
                          <p className="font-medium">{group.productName}</p>
                        )}
```

- [ ] **Step 4: Type check**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Lint — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). No lint invocation. Type-check at Step 4 is the static gate.

- [ ] **Step 6: Visual verification**

Start dev server: `yarn dev`. Navigate to `http://localhost:3000/cart`. Confirm:
- A cart line with a non-empty `metadata.product_name` shows that name as the headline (CardTitle) AND the catalog product title as the secondary line below.
- A cart line with empty `metadata.product_name` (legacy or test data) shows the catalog product title as the headline (CardTitle) and the secondary line is suppressed (no duplicate).
Stop the dev server.

- [ ] **Step 7: Commit**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
git add src/app/cart/_hooks/useCart.ts src/app/cart/page.tsx
git commit -m "fix(cart): designName fallback to product_title with normalized de-dup (DIV-71)"
```

---

### Task 3: Fix #4 (full) — dev-only warns for missing group_id and empty non-apparel options

> **Confidence: High** — `useCart.ts:60-62` and `useCart.ts:76-78` verified. Both warns gated on `process.env.NODE_ENV === "development"` per spec rejection of production-spam.

**Files:**
- Modify: `src/app/cart/_hooks/useCart.ts:59-67` (group_id warn)
- Modify: `src/app/cart/_hooks/useCart.ts:76-78` (empty-options warn)

**Why one commit:** Both warns are the same defensive pattern; pairing them keeps the dev-only diagnostic story coherent in one commit.

- [ ] **Step 1: Read the file**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
cat src/app/cart/_hooks/useCart.ts | sed -n '55,82p'
```

- [ ] **Step 2: Edit `useCart.ts:59-67` — group_id warn**

Replace this block:

```ts
      cart.items.reduce(
        (acc, item) => {
          const groupId = (item.metadata as { group_id?: string })
            ?.group_id as string;
          if (!groupId) return acc;
          if (!acc[groupId]) acc[groupId] = [];
          acc[groupId].push(item);
          return acc;
        },
        {} as Record<string, StoreCartLineItem[]>
      ) ?? {};
```

With:

```ts
      cart.items.reduce(
        (acc, item) => {
          const groupId = (item.metadata as { group_id?: string })
            ?.group_id as string;
          if (!groupId) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "[cart] dropping line item without group_id",
                item.id
              );
            }
            return acc;
          }
          if (!acc[groupId]) acc[groupId] = [];
          acc[groupId].push(item);
          return acc;
        },
        {} as Record<string, StoreCartLineItem[]>
      ) ?? {};
```

- [ ] **Step 3: Edit `useCart.ts:76-81` — empty-options warn**

Locate this block (in the `Object.values(grouped).map((items) => { ... })` body, after the `productOptions` and `productOptionsLabels` declarations):

```ts
      const productOptions = isNonApparel
        ? (firstItem.metadata?.options as Record<string, string>) ?? {}
        : undefined;
      const productOptionsLabels = isNonApparel
        ? (firstItem.metadata?.options_labels as Record<string, string>) ?? undefined
        : undefined;
```

Insert the following block IMMEDIATELY AFTER `productOptionsLabels`:

```ts
      if (
        process.env.NODE_ENV === "development" &&
        isNonApparel &&
        productOptions &&
        Object.keys(productOptions).length === 0
      ) {
        console.warn(
          "[cart] non-apparel line item has empty options",
          firstItem.id
        );
      }
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Lint — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). Type-check at Step 4 is the static gate.

- [ ] **Step 6: Visual verification**

Start dev server: `yarn dev`. Open browser dev tools console. Navigate to `/cart`. Confirm:
- No warns under normal (well-formed) cart contents.
- If a test cart contains a line without `group_id` (manual DB nudge or stock-Medusa-injected line), the warn fires once per `useMemo` recomputation (which fires per cart-data change — React Query refetches on focus, so seeing the warn multiple times during a session is expected, not a bug).
- If a test cart contains a non-apparel line with `options: {}`, the empty-options warn fires on the same cadence.
Stop dev server before proceeding to the next task — Next dev server holds port 3000.

(If you cannot easily produce these test conditions locally, document the absence in commit message body and proceed — the warn paths are guarded by `NODE_ENV === "development"` and have no production effect.)

- [ ] **Step 7: Commit**

```bash
git add src/app/cart/_hooks/useCart.ts
git commit -m "fix(cart): dev-only warns for missing group_id and empty non-apparel options (DIV-71)"
```

---

### Task 4: Fix #1 — formatOptionLabel helper (defensive title-case for both branches)

> **Confidence: High** — `page.tsx:504-512` verified. Helper placement at module scope is consistent with existing pattern (no other helpers exist in this file; Page is a default export below imports).

**Files:**
- Modify: `src/app/cart/page.tsx` — add module-scope `formatOptionLabel` function after imports, replace render block at lines 504-512.

- [ ] **Step 1: Read the file (header + target render block)**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
cat src/app/cart/page.tsx | sed -n '1,5p'
cat src/app/cart/page.tsx | sed -n '500,515p'
```

- [ ] **Step 2: Add the `formatOptionLabel` helper**

Find the line that ends the imports block (immediately before the `Page` component or any other module-scope code). After the last `import` statement and before the next non-import code, add this helper:

```ts
// --- Helpers ---

function formatOptionLabel(
  key: string,
  labels: Record<string, string> | undefined
): string {
  const raw = labels?.[key] ?? key.replace(/_/g, " ");
  return raw
    .split(/\s+/)
    .map((word) =>
      word.length > 0
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : word
    )
    .join(" ");
}
```

**Helper placement is canonical.** The file's last `import { ... } from "...";` line ends at approximately line 76. Immediately below are a `// --- Types ---` comment block and the `US_STATES` const (lines ~78-86), then the `AddressForm` component (line ~106). Insert the `// --- Helpers ---` block + `formatOptionLabel` function BETWEEN the last import and the `// --- Types ---` comment — that is the only placement that keeps helpers above all other module-scope code. Do NOT place the helper after `US_STATES` or below `AddressForm`; subsequent task instructions assume helpers are colocated at the top.

- [ ] **Step 3: Replace the option-row render block**

Locate and replace the block at `page.tsx:502-513`:

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        <>
                          {Object.entries(group.productOptions).map(([key, value]) => {
                            const label = group.productOptionsLabels?.[key]
                              ?? key.replace(/_/g, " ");
                            return (
                              <p key={key} className="text-muted-foreground">
                                <span className="capitalize">{label}</span>: {value}
                              </p>
                            );
                          })}
                        </>
                      ) : (
```

With:

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        <>
                          {Object.entries(group.productOptions).map(([key, value]) => (
                            <p key={key} className="text-muted-foreground">
                              <span>
                                {formatOptionLabel(key, group.productOptionsLabels)}
                              </span>
                              : {value}
                            </p>
                          ))}
                        </>
                      ) : (
```

The CSS `className="capitalize"` is intentionally removed — title-casing now lives in the JS helper for both label-present and key-fallback branches.

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Lint — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). Type-check at Step 4 is the static gate.

- [ ] **Step 6: Visual verification**

Start dev server: `yarn dev`. Navigate to `/cart` with a non-apparel line in the cart. Confirm:
- Options render with title-cased labels: `paper_stock` → `Paper Stock`, `stapling` → `Stapling`.
- If `options_labels` provides `"paper stock"` (lowercase author-supplied), the render shows `Paper Stock` (defensive title-case).
- The colon-separator and value formatting are unchanged.
Stop dev server.

- [ ] **Step 7: Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "fix(cart): formatOptionLabel helper with defensive title-case (DIV-71)"
```

---

### Task 5: Fix #2 + Fix #3 — distinguished Quantity row, formatQuantity helper, filtered/sorted options, apparel quantity formatting

> **Confidence: High** — spec implementation step 7 explicitly couples these two fixes in one commit. Filter and sort are spec-specified verbatim.

**Files:**
- Modify: `src/app/cart/page.tsx` — add `formatQuantity` helper at module scope, modify non-apparel render block (now at the post-Task-4 location), modify apparel quantity render at `page.tsx:520`.

**Why one commit:** Fix #2 alone would render an unformatted prominent quantity row (e.g. "Quantity: 5000" without separator); Fix #3 alone would format apparel quantity but leave non-apparel options-row quantity unformatted. They ship together.

- [ ] **Step 1: Locate the post-Task-4 non-apparel render block by literal search**

Line numbers have drifted from the spec's original `:502-513` because Task 4 inserted the `formatOptionLabel` helper above. Do NOT read by line number. Use `grep -n` to locate the unique anchor:

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
git grep -n 'formatOptionLabel(key, group.productOptionsLabels)' -- src/app/cart/page.tsx
git grep -n '<span>Quantity: {group.itemQuantity}</span>' -- src/app/cart/page.tsx
```

The first command returns the post-Task-4 non-apparel block location. The second returns the apparel `Quantity` span (Task 5 Step 4 target). If either returns no matches, halt — Task 4 did not land cleanly or `develop` has drifted, and the soldier must escalate to the Imperator before continuing.

- [ ] **Step 2: Add the `formatQuantity` helper**

Insert immediately AFTER the `formatOptionLabel` helper added in Task 4 (still in the `// --- Helpers ---` block):

```ts
function formatQuantity(value: string | number | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : String(value);
}
```

- [ ] **Step 3: Replace the non-apparel option-row block (now post-Task-4) with quantity-prominent + filtered/sorted iteration**

Locate the block currently in place (post-Task-4):

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        <>
                          {Object.entries(group.productOptions).map(([key, value]) => (
                            <p key={key} className="text-muted-foreground">
                              <span>
                                {formatOptionLabel(key, group.productOptionsLabels)}
                              </span>
                              : {value}
                            </p>
                          ))}
                        </>
                      ) : (
```

Replace with:

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        <>
                          <p className="text-muted-foreground">
                            Quantity:{" "}
                            {formatQuantity(
                              group.productOptions.quantity ?? group.itemQuantity
                            )}
                          </p>
                          {Object.entries(group.productOptions)
                            .filter(([k]) => k !== "quantity")
                            .sort(([a], [b]) => a.localeCompare(b, "en-US"))
                            .map(([key, value]) => (
                              <p key={key} className="text-muted-foreground">
                                <span>
                                  {formatOptionLabel(key, group.productOptionsLabels)}
                                </span>
                                : {value}
                              </p>
                            ))}
                        </>
                      ) : (
```

- [ ] **Step 4: Replace the apparel quantity row (literal-string target)**

The original `page.tsx:520` line has drifted due to Task 4's helper insertion AND Task 5 Step 3's expansion of the non-apparel block. Do NOT use the line number. Use the unique literal target string located by Step 1's `git grep`:

```tsx
                            <span>Quantity: {group.itemQuantity}</span>
```

Replace with:

```tsx
                            <span>Quantity: {formatQuantity(group.itemQuantity)}</span>
```

If `git grep` returned multiple matches in Step 1, halt and escalate — the apparel quantity span should be unique in this file. If only one match exists, proceed with the Edit tool keying on the literal string.

- [ ] **Step 5: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Lint — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). Type-check at Step 5 is the static gate.

- [ ] **Step 7: Visual verification**

Start dev server: `yarn dev`. Navigate to `/cart`. Confirm:
- Non-apparel line renders `Quantity: 1,000` (or whatever `metadata.options.quantity` value, with thousands separator if ≥1000) as the FIRST row in the option list, not buried among other options.
- Remaining options render below the quantity row in alphabetic key order. The `quantity` key does NOT appear twice.
- Apparel line still renders `Quantity: N` with the size pills next to it; `N ≥ 1000` now formats with comma separator.
- Non-numeric or corrupt `options.quantity` (e.g., `"abc"`) renders the raw string instead of `NaN`.
Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "fix(cart): distinguished Quantity row + formatQuantity for both branches (DIV-71)"
```

---

### Task 6: Fix #6 — placeholder for empty non-apparel options

> **Confidence: High** — spec rule explicit; render condition matches the discriminator rule (non-apparel `product_type` enters branch even with empty options).

**Files:**
- Modify: `src/app/cart/page.tsx` — wrap the non-apparel branch body to render a placeholder when options are empty.

**Ordering precondition.** Task 6 depends on Task 5 having committed. If `git log --oneline origin/develop..HEAD` does not show "fix(cart): distinguished Quantity row + formatQuantity..." as a recent commit, halt and run Task 5 first. Do NOT execute Task 6 against pre-Task-5 state.

- [ ] **Step 1: Locate the post-Task-5 non-apparel block by literal search**

Line numbers continue to drift. Locate the unique anchor introduced in Task 5:

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
git grep -n 'group.productOptions.quantity ?? group.itemQuantity' -- src/app/cart/page.tsx
```

Expected: exactly one match, in the non-apparel branch of the cart card render. If no match: Task 5 did not land. If more than one match: code drift — escalate.

- [ ] **Step 2: Wrap the non-apparel branch body**

Locate the block currently in place (post-Task-5):

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        <>
                          <p className="text-muted-foreground">
                            Quantity:{" "}
                            {formatQuantity(
                              group.productOptions.quantity ?? group.itemQuantity
                            )}
                          </p>
                          {Object.entries(group.productOptions)
                            .filter(([k]) => k !== "quantity")
                            .sort(([a], [b]) => a.localeCompare(b, "en-US"))
                            .map(([key, value]) => (
                              <p key={key} className="text-muted-foreground">
                                <span>
                                  {formatOptionLabel(key, group.productOptionsLabels)}
                                </span>
                                : {value}
                              </p>
                            ))}
                        </>
                      ) : (
```

Replace with:

```tsx
                      {group.productType !== "apparel" && group.productOptions ? (
                        Object.keys(group.productOptions).length === 0 ? (
                          <p className="text-muted-foreground italic">
                            Custom configuration
                          </p>
                        ) : (
                          <>
                            <p className="text-muted-foreground">
                              Quantity:{" "}
                              {formatQuantity(
                                group.productOptions.quantity ?? group.itemQuantity
                              )}
                            </p>
                            {Object.entries(group.productOptions)
                              .filter(([k]) => k !== "quantity")
                              .sort(([a], [b]) => a.localeCompare(b, "en-US"))
                              .map(([key, value]) => (
                                <p key={key} className="text-muted-foreground">
                                  <span>
                                    {formatOptionLabel(key, group.productOptionsLabels)}
                                  </span>
                                  : {value}
                                </p>
                              ))}
                          </>
                        )
                      ) : (
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Lint — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). Type-check at Step 3 is the static gate.

- [ ] **Step 5: Visual verification**

Start dev server: `yarn dev`. Navigate to `/cart`. Confirm:
- A non-apparel line with non-empty options renders the Quantity row + filtered/sorted option rows (Task 5 behavior preserved).
- A non-apparel line with empty `metadata.options = {}` renders a single muted italic `Custom configuration` row in place of the option list.
- Apparel branch unchanged.
- Mixed cart (apparel + non-apparel + empty-options non-apparel) renders all three correctly side by side.

If you cannot produce an empty-options non-apparel line locally, note in commit body and proceed — the dev-only warn from Task 3 will surface this case in any environment that hits it.

- [ ] **Step 6: Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "fix(cart): placeholder row for non-apparel lines with empty options (DIV-71)"
```

---

## Verification

### Task 7: Manual screenshots

> **Confidence: Medium** — depends on local seed data covering non-apparel test products. If non-apparel products aren't seeded, the soldier may need to coordinate with the backend worktree's seed pipeline before capturing the non-apparel screenshots.

**Files:**
- Create: `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/apparel-only-cart.png`
- Create: `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/non-apparel-only-cart.png`
- Create: `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/mixed-cart.png`
- Create (optional, if test data permits): `$CONSILIUM_DOCS/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/non-apparel-empty-options.png`

- [ ] **Step 1: Start the storefront against the DIV-99 backend**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
yarn dev
```

Confirm `http://localhost:3000` loads. Confirm `NEXT_PUBLIC_API_URL=http://localhost:9000` is in effect (check Network tab on a cart fetch — request should hit `:9000`).

- [ ] **Step 2: Build a cart in three states**

In the running storefront, log in as a test customer (credentials live in user memory at `~/.claude/projects/-Users-milovan-projects-divinipress-store/memory/reference_app_login.md` — if the soldier lacks access to user memory, escalate to the Imperator for credentials) and prepare three cart states sequentially:
1. **Apparel-only:** add 1+ apparel products via the apparel PDP path. Confirm cart renders with Color/size pills/Decoration. Take screenshot.
2. **Non-apparel-only:** clear the cart. Add 1+ non-apparel products via the standard (non-apparel) PDP path. Confirm cart renders the Quantity row + sorted option rows. Take screenshot.
3. **Mixed:** add both. Confirm both render correctly side by side. Take screenshot.

For the optional fourth screenshot (empty-options non-apparel), if the local backend has a non-apparel test product configured with no options at all, build a cart line for it and capture. Otherwise skip and document the absence in the commit message.

**Seed-data fallback.** If the backend worktree has DIV-99 importer changes but no non-apparel products are seeded, run the importer per the backend repo's seed runbook (consult the backend worktree's CLAUDE.md or `docs/` for the exact command — varies by branch state). If unable to seed, escalate to the Imperator before proceeding; do NOT fabricate cart lines via direct DB writes.

- [ ] **Step 3: Save screenshots to the case directory**

```bash
mkdir -p /Users/milovan/projects/consilium-docs/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots
```

Save the three (optionally four) screenshots into that directory with the exact filenames above.

- [ ] **Step 4: Commit the screenshots to consilium-docs**

```bash
cd /Users/milovan/projects/consilium-docs
git add cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/
git commit -m "DIV-71: cart rendering verification screenshots"
```

Note: This commit lands in the `consilium-docs` repo, not the `divinipress-store` worktree. The screenshots are case-file evidence, not source code.

- [ ] **Step 5: Stop the dev server**

```bash
# In the storefront worktree's dev terminal:
# Ctrl+C
```

---

### Task 8: Final type-check sweep

> **Confidence: High** — `npx tsc --noEmit` is the only static gate available; lint is broken repo-wide (see plan header).

- [ ] **Step 1: Type-check the full repo**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Lint sweep — SKIPPED**

Repo-wide lint is broken at this commit (see plan header). Lint follow-up is a separate Linear ticket per Task 9 Step 4.

- [ ] **Step 3: Confirm clean working tree**

```bash
git status
```

Expected: nothing to commit, working tree clean. The branch should have 5 new commits beyond `origin/develop` (Tasks 2–6).

```bash
git log --oneline origin/develop..HEAD
```

Expected: 5 commits, one per implementation task, in order.

---

### Task 9: Open the pull request

> **Confidence: High** — PR title and body content sealed by spec; merge-ordering note required.

- [ ] **Step 1: Push the branch**

```bash
cd /Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering
git push -u origin feature/div-71-non-apparel-cart-rendering
```

- [ ] **Step 2: Create the PR**

```bash
gh pr create \
  --title "DIV-71: non-apparel cart rendering polish" \
  --base develop \
  --body "$(cat <<'EOF'
## Summary

Polishes the storefront cart's non-apparel rendering against the DIV-99 backend metadata contract. Fixes six concrete rendering gaps in `src/app/cart/_hooks/useCart.ts` and `src/app/cart/page.tsx`. No backend changes. No new modules. No test-runner retrofit (none exists in repo).

Spec: `consilium-docs/cases/2026-04-24-div-71-non-apparel-cart-rendering/spec.md` (r3.1).

## Backend dependency — DEPLOY ORDERING

This PR depends on `divinipress-backend` PR #33 (DIV-82 + DIV-99) being deployed FIRST. The cart's non-apparel rendering reads metadata fields (`product_type`, `options`, `options_labels`) that DIV-99 stamps on cart line items. If this storefront ships before DIV-99 backend is live, every cart line lacks `product_type`, falls through the `?? "apparel"` default, and renders apparel — degraded but non-crashing. Acceptable failure mode, but the deploy ordering should be respected.

## Merge-ordering with PR #120

PR #120 (DIV-98 order metadata + reporting shells, currently draft) modifies the same file (`src/app/cart/page.tsx`). The two PRs touch non-overlapping line ranges (this PR: cart item card details lines ~500-530; PR #120: Order Summary right-column additions). If PR #120 lands first, this PR rebases. If this PR lands first, PR #120 rebases.

## Fixes

1. Graceful label fallback (Fix #1) — `formatOptionLabel` helper title-cases both authored labels and key fallbacks for defensive symmetry.
2. Distinguished `Quantity: N` row for non-apparel (Fix #2) — explicit filter on the `quantity` key, alphabetic sort with `localeCompare("en-US")`.
3. Thousands-separator on quantity (Fix #3) — `formatQuantity` helper applied to both apparel and non-apparel; non-numeric guard falls back to raw string instead of "NaN".
4. Dev-only warns (Fix #4) — surface dropped lines (missing `group_id`) and corrupt non-apparel lines (empty `options`) to dev console without spamming production / Sentry.
5. `designName` fallback chain + de-dup (Fix #5) — empty `metadata.product_name` falls back to `product_title`, then `"Custom Order"`. Render-site normalized de-dup suppresses the duplicate row when designName equals productName.
6. Empty-options placeholder (Fix #6) — non-apparel lines with empty `metadata.options` render a muted `Custom configuration` placeholder instead of an empty card body.

## Out of scope (follow-ups to file in Linear)

- Image hydration via `upload_ids` for custom-printed non-apparel items.
- `design_notes` display in cart.
- Product-level `options_labels` fallback (would require backend `/company/cart` projection change).
- Saved-product reorder for non-apparel — `useSaveAndAddToCart` `ItemMetadata` lacks `product_type`/`options`/`options_labels`. Acknowledged as deferred per KG-NON-APPAREL-OPTIONS.

## Verification

Manual screenshots captured against the DIV-99 backend worktree (port 9000). See `consilium-docs/cases/2026-04-24-div-71-non-apparel-cart-rendering/screenshots/` for apparel-only, non-apparel-only, and mixed-cart states. No automated tests added — no test-runner exists in repo and adding one is refactor churn per spec.
EOF
)"
```

- [ ] **Step 3: Confirm PR creation**

The `gh pr create` command outputs the PR URL. Open it in browser, confirm the body renders, confirm CI checks (if any) start running.

- [ ] **Step 4: File five follow-up tickets in Linear (or hand the wording to the Imperator)**

Create five Linear tickets under the storefront project, each prefixed with the relationship to DIV-71. **If the soldier lacks Linear MCP access, paste the five ticket bodies into the conversation as a single block addressed to the Imperator and mark this step "handed off, not blocking PR" in the final-state checklist below.**

1. **DIV-71 follow-up: Image hydration via `upload_ids` for non-apparel cart lines.** Reference `useCart.ts:165-176` image-resolution path.
2. **DIV-71 follow-up: `design_notes` display in cart.** Add row under options if present.
3. **DIV-71 follow-up: Product-level `options_labels` fallback.** Requires expanding `divinipress-backend/src/api/company/cart/route.ts:99-141` projection to include `items.product.metadata`.
4. **DIV-71 follow-up: Saved-product reorder support for non-apparel.** Update `useSaveAndAddToCart.ts` `ItemMetadata` type to carry `product_type` / `options` / `options_labels`. References KG-NON-APPAREL-OPTIONS.
5. **DIV-71 follow-up: Restore lint runnable.** `next lint` was removed in Next 16; `.eslintrc.json` legacy config also incompatible with current eslint plugins (TypeError: Converting circular structure to JSON). Migrate to flat config or alternate runner.

Cross-link each Linear ticket back to DIV-71 and to this PR.

---

## Final state checklist

Before declaring the campaign complete, confirm:

- [ ] Worktree exists at `/Users/milovan/projects/worktrees/divinipress-store/feature/div-71-non-apparel-cart-rendering`
- [ ] Branch `feature/div-71-non-apparel-cart-rendering` has exactly 5 commits beyond `origin/develop` (Tasks 2–6)
- [ ] `npx tsc --noEmit` clean
- [ ] Lint sweep — N/A (`yarn lint` broken repo-wide; tracked as Linear follow-up #5)
- [ ] All 6 fixes from the spec applied verbatim
- [ ] No backend files touched
- [ ] No proof / saved-product / approve-proof code touched
- [ ] No `saveAndAddToCart.ts` TODO marker added (Imperator removed in r3.1)
- [ ] Three (optionally four) screenshots committed to consilium-docs
- [ ] PR opened against `develop` with backend-dependency note + PR #120 merge-ordering note
- [ ] Five follow-up tickets either filed in Linear with cross-links OR handed to the Imperator with full wording (whichever the soldier's Linear MCP access permits)

## Confidence map (full plan)

> **Worktree creation: High** — standard git worktree, target path verified clean.
> **Per-task code shape: High at plan-authoring time** — all file:line targets verified by direct file read. Soldier MUST recheck via the "Read both files" / `git grep` sub-step at task start; if `develop` has drifted, halt and escalate. Line numbers are advisory; literal-string anchors are authoritative.
> **Helper function placement: High** — placement window between last import (line ~76) and `// --- Types ---` comment (line ~78) is unambiguous; existing module-scope code (`US_STATES` const, `AddressForm` component) sits below this window.
> **Manual visual verification: Medium** — depends on local backend having DIV-99 metadata-emitting non-apparel products in seed data. Plan provides escalation path if seed is absent.
> **PR description merge-ordering: High** — content fully specified; soldier copies verbatim. PR #120 draft state should be sanity-checked before paste (it may have merged or closed since plan authoring).
> **Linear follow-ups: Medium** — exact wording is provided. If soldier lacks Linear MCP access, the wording is handed to the Imperator and the final-state checkbox is satisfied by the handoff, NOT by the soldier filing tickets.
> **Lint gate: N/A** — `yarn lint` is broken repo-wide (Next 16 + legacy ESLint config); plan executes without lint, tracked as Linear follow-up #5.
