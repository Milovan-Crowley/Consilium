# Brand Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task.

**Goal:** Ship `BrandLoader`, migrate active storefront spinner/static-monogram loading affordances to it, and remove dead spinner infrastructure.

**Plan Scale:** Feature

**Implementation Shape:** Add one client component and one CSS module under `src/components/ui/`. Replace existing active `Loader2`/static monogram loaders in place. Do not redesign layouts or touch quarantined code.

**Scope In:**
- `src/components/ui/brand-loader.tsx`
- `src/components/ui/brand-loader.module.css`
- 12 active `Loader2` render-site migrations
- 2 static-monogram migrations
- `src/components/ui/spinner.tsx` deletion
- Dead `Loader2` import cleanup in `CheckoutStripeWrapper.tsx`

**Scope Out:**
- `src/_quarantine/**`
- `Skeleton` components
- Stripe iframe internals
- Non-loading Lucide icon usage
- Tailwind token work
- Layout redesigns

**Execution Preconditions:**
- Do not work in `/Users/milovan/projects/divinipress-store` while it is the dirty `integration/non-apparel-products` checkout.
- If PR #137 is still open, create `/Users/milovan/projects/worktrees/divinipress-store/feature/brand-loader-on-div-74` from `origin/feature/div-74-non-apparel-proof-detail-rendering`, branch `feature/brand-loader-on-div-74`, and target the BrandLoader PR at `feature/div-74-non-apparel-proof-detail-rendering`.
- If PR #137 has merged, create `/Users/milovan/projects/worktrees/divinipress-store/feature/brand-loader` from fresh `origin/develop`, branch `feature/brand-loader`, and target `develop`.
- Stop if the selected worktree path already exists with unrelated changes, PR #137 changed head branch, or neither base exists.
- Use Yarn only.
- On the PR #137 base, do not use `yarn lint`; it still points at obsolete `next lint`. Use:
  ```bash
  yarn eslint src --ext .js,.jsx,.ts,.tsx --ignore-pattern 'src/_quarantine/**'
  ```

**Verification:**
- `yarn tsc --noEmit`
- `yarn build`
- ESLint command above
- Final greps in Task 5
- Visual smoke in Task 5

---

## Task 1: Create `BrandLoader`

**Files:**
- Create: `src/components/ui/brand-loader.tsx`
- Create: `src/components/ui/brand-loader.module.css`

**Objective:** Port the source loader from `/Users/milovan/projects/Consilium/docs/cases/2026-05-01-brand-loader/ref-source-loader.html` into a reusable UI primitive.

**Required decisions:**
- First line of the component is `"use client";`.
- Import `* as React` and `cn` from `@/lib/utils`.
- Props:
  ```tsx
  export interface BrandLoaderProps {
    className?: string;
    duration?: string;
    ariaLabel?: string;
  }
  ```
- Export `BrandLoader` with inferred return type. Do not annotate `JSX.Element`.
- Default `duration = "1.65s"` and `ariaLabel = "Loading"`.
- Wrapper is `<span role="status" aria-label={ariaLabel}>`.
- Wrapper class is `cn(styles.loader, className)`.
- Duration is written as `style={{ "--dp-loader-dur": duration } as React.CSSProperties}`.
- Use `React.useId()` and sanitize with `replace(/[^A-Za-z0-9_-]/g, "")`; prefix all internal SVG IDs and every `mask` / `href` reference.
- Inner `<svg>` gets `className="size-full"` to avoid shadcn Button forcing it to `size-4`.
- Paths fill with `currentColor`.
- CSS module includes:
  ```css
  .loader {
    display: inline-block;
    flex: 0 0 auto;
    position: relative;
  }

  :where(.loader) {
    color: #008A70;
  }
  ```
- Port source geometry and six keyframes. Keep phase percentages.
- Port reduced-motion behavior.
- Remove all `!important`.

**Acceptance:**
- Default render works at `size-8`, `#008A70`, `1.65s`.
- Page render works at `size-[min(360px,80vw,60vh)]`, `5.2s`.
- Button render works at `size-4 text-primary-foreground`.
- Two instances do not share SVG IDs.
- CSS module has zero `!important` and exactly one `#008A70`.

**Verification:**
```bash
yarn tsc --noEmit
if rg -n '!important' src/components/ui/brand-loader.module.css; then echo FAIL; exit 1; else echo OK; fi
test "$(rg -n '#008A70' src/components/ui/brand-loader.module.css | wc -l | tr -d ' ')" = "1"
```

---

## Task 2: Migrate Static-Monogram Surfaces

**Files:**
- Modify: `src/app/loading.tsx`
- Modify: `src/app/(authenticated)/_components/SwitchingOverlay.tsx`

**Objective:** Replace the root fallback and impersonation overlay static monograms.

**Implementation:**
- Replace `src/app/loading.tsx` with:
  ```tsx
  import { BrandLoader } from "@/components/ui/brand-loader";

  export default function AppLoading() {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandLoader
          className="size-[min(360px,80vw,60vh)]"
          duration="5.2s"
          ariaLabel="Loading page"
        />
      </div>
    );
  }
  ```
- In `SwitchingOverlay.tsx`, add the `BrandLoader` import and replace only the SVG block with `<BrandLoader className="size-8" ariaLabel={switchingMessage} />`.
- Preserve the overlay shell and message text.

**Verification:**
```bash
if rg -n 'loaderContainer|#007861' src/app/loading.tsx 'src/app/(authenticated)/_components/SwitchingOverlay.tsx'; then echo FAIL; exit 1; else echo OK; fi
rg -n 'BrandLoader' src/app/loading.tsx 'src/app/(authenticated)/_components/SwitchingOverlay.tsx'
yarn tsc --noEmit
```

---

## Task 3: Migrate Active `Loader2` Render Sites

**Files:**
- Modify: `src/app/checkout/_components/ZeroTotalCheckout.tsx`
- Modify: `src/app/accept-invite/page.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/log-in/page.tsx`
- Modify: `src/app/(authenticated)/products/[handle]/page.tsx`
- Modify: `src/app/(authenticated)/catalog/[category]/[productHandle]/product-shared.tsx`

**Objective:** Replace active `Loader2` render sites in these six files.

**Rules:**
- Remove `Loader2` from `lucide-react` imports.
- Add `import { BrandLoader } from "@/components/ui/brand-loader";`.
- Page/content waits become `className="size-8"` with contextual `ariaLabel`.
- Button-inline waits drop `mr-2` and `animate-spin`, add `text-primary-foreground`, and pass contextual `ariaLabel`.
- No `duration` prop is used in this task.

**Exact replacements:**
- `ZeroTotalCheckout.tsx:99`: `<BrandLoader className="size-8" ariaLabel="Processing order" />`
- `accept-invite/page.tsx:28`: `<BrandLoader className="size-8" ariaLabel="Loading invite" />`
- `accept-invite/page.tsx:127`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Setting up account" />`
- `accept-invite/page.tsx:141`: `<BrandLoader className="size-8" ariaLabel="Setting up account" />`
- `reset-password/page.tsx:28`: `<BrandLoader className="size-8" ariaLabel="Loading password reset" />`
- `reset-password/page.tsx:127`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Resetting password" />`
- `reset-password/page.tsx:141`: `<BrandLoader className="size-8" ariaLabel="Updating password" />`
- `log-in/page.tsx:103`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Logging in" />`
- `log-in/page.tsx:154`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Sending reset link" />`
- `products/[handle]/page.tsx:398`: `<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel="Adding to cart" />`
- `products/[handle]/page.tsx:480`: `<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel="Adding to cart" />`
- `product-shared.tsx:511`: ``<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel={`${submitLabel} in progress`} />``

**Verification:**
```bash
if rg -n 'Loader2|animate-spin' src/app/checkout/_components/ZeroTotalCheckout.tsx src/app/accept-invite/page.tsx src/app/reset-password/page.tsx src/app/log-in/page.tsx 'src/app/(authenticated)/products/[handle]/page.tsx' 'src/app/(authenticated)/catalog/[category]/[productHandle]/product-shared.tsx'; then echo FAIL; exit 1; else echo OK; fi
yarn tsc --noEmit
```

---

## Task 4: Delete Dead Spinner Infrastructure

**Files:**
- Delete: `src/components/ui/spinner.tsx`
- Modify: `src/app/checkout/_components/CheckoutStripeWrapper.tsx`

**Objective:** Remove dead spinner infrastructure after active call-site migration.

**Implementation:**
- Delete `src/components/ui/spinner.tsx`.
- Change `import { Loader2, Lock } from "lucide-react";` to `import { Lock } from "lucide-react";`.

**Verification:**
```bash
[ ! -f src/components/ui/spinner.tsx ] && echo OK || echo STILL_EXISTS
if rg -n 'Loader2' src/app/checkout/_components/CheckoutStripeWrapper.tsx; then echo FAIL; exit 1; else echo OK; fi
if rg -n 'from "@/components/ui/spinner"|from "@components/ui/spinner"' src --glob '!src/_quarantine/**'; then echo FAIL; exit 1; else echo OK; fi
yarn tsc --noEmit
```

---

## Task 5: Final Verification

**Objective:** Prove the migration is complete without adding permanent test/probe files.

**Commands:**
```bash
yarn tsc --noEmit
yarn build
yarn eslint src --ext .js,.jsx,.ts,.tsx --ignore-pattern 'src/_quarantine/**'
if rg -n '!important' src/components/ui/brand-loader.module.css; then echo FAIL; exit 1; else echo OK; fi
test "$(rg -n '#008A70' src/components/ui/brand-loader.module.css | wc -l | tr -d ' ')" = "1"
if rg -n 'Loader2|animate-spin' src --glob '!src/_quarantine/**' --glob '!src/components/ui/brand-loader.*'; then echo FAIL; exit 1; else echo OK; fi
if rg -n 'loaderContainer' src --glob '!src/_quarantine/**'; then echo FAIL; exit 1; else echo OK; fi
if rg -n '#007861' src --glob '!src/_quarantine/**' --glob '!src/app/theme.ts'; then echo FAIL; exit 1; else echo OK; fi
[ ! -f src/components/ui/spinner.tsx ] && echo OK_DELETED || echo STILL_EXISTS
rg -n 'from "app/loading"' 'src/app/(authenticated)/settings/notifications/loading.tsx'
```

**Manual smoke:**
- Route fallback shows the large 5.2s loader and fits narrow/short viewports.
- Login or other submit button shows white inline loader with normal button gap.
- SwitchingOverlay shows `size-8` brand loader above the existing message.
- Reduced-motion shows static monogram, no brushstroke animation.
- Two simultaneous loaders have no duplicate internal SVG IDs, and all `mask` / `href` refs resolve.

**Stop conditions:**
- Stop on wrong color, invisible button loader, broken route fallback sizing, duplicate SVG IDs, unresolved SVG refs, type/build failure, or new lint errors.
