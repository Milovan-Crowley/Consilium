# Brand Loader Spec

Date: 2026-05-01
Status: Draft for implementation
Primary repo: `/Users/milovan/projects/divinipress-store`
Source artifact: `ref-source-loader.html`

## Intent

Replace every active storefront spinner/static-monogram loading affordance with one branded primitive: `BrandLoader`.

The loader is the Divinipress monogram drawing, holding, and erasing as a brushstroke animation. The source artifact is the visual contract for geometry and timing shape.

## Component Contract

Create `src/components/ui/brand-loader.tsx` plus `src/components/ui/brand-loader.module.css`.

Public props:

```tsx
export interface BrandLoaderProps {
  className?: string;
  duration?: string;
  ariaLabel?: string;
}
```

Behavior:

- Default `duration` is `"1.65s"`.
- Default `ariaLabel` is `"Loading"`.
- Wrapper is `<span role="status" aria-label={ariaLabel}>`.
- SVG is `aria-hidden="true"` and fills the wrapper.
- Wrapper sizing and color come from `className`.
- Wrapper must not shrink in flex/button contexts.
- SVG IDs are namespaced per render with `React.useId()` plus sanitization; duplicate IDs across two rendered loaders are not allowed.
- SVG paths paint with `currentColor`.
- Default color is `#008A70`, set in the CSS module with low specificity so Tailwind text-color utilities can override it.
- CSS module contains no `!important`.
- `prefers-reduced-motion: reduce` disables animation and shows the fully revealed monogram.

React typing constraint:

- Import React as a namespace for `React.useId()` and `React.CSSProperties`.
- Do not annotate the component return type as `JSX.Element`; let TypeScript infer it.

## Visual Contract

- Geometry, masks, paths, and keyframes are ported from `ref-source-loader.html`.
- Animation order: top lane draw, middle lane draw, bottom lane draw, hold, then top/middle/bottom erase in the same forward direction.
- Page-level brand moment uses `duration="5.2s"`.
- Inline and mid-size loaders use the default `1.65s`.
- Verified sizing range: 16px through 360px.

## Replacement Surface

Brand moment:

- `src/app/loading.tsx`: replace the current static/orphan-CSS loader with `<BrandLoader className="size-[min(360px,80vw,60vh)]" duration="5.2s" ariaLabel="Loading page" />`.

Static monogram:

- `src/app/(authenticated)/_components/SwitchingOverlay.tsx`: replace the inline SVG with `<BrandLoader className="size-8" ariaLabel={switchingMessage} />`. Preserve the overlay shell and message text.

Page/content waits:

- `src/app/checkout/_components/ZeroTotalCheckout.tsx:99`: `<BrandLoader className="size-8" ariaLabel="Processing order" />`.
- `src/app/accept-invite/page.tsx:28`: `<BrandLoader className="size-8" ariaLabel="Loading invite" />`.
- `src/app/accept-invite/page.tsx:141`: `<BrandLoader className="size-8" ariaLabel="Setting up account" />`.
- `src/app/reset-password/page.tsx:28`: `<BrandLoader className="size-8" ariaLabel="Loading password reset" />`.
- `src/app/reset-password/page.tsx:141`: `<BrandLoader className="size-8" ariaLabel="Updating password" />`.

Button-inline waits:

- `src/app/log-in/page.tsx:103`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Logging in" />`.
- `src/app/log-in/page.tsx:154`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Sending reset link" />`.
- `src/app/accept-invite/page.tsx:127`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Setting up account" />`.
- `src/app/reset-password/page.tsx:127`: `<BrandLoader className="size-4 text-primary-foreground" ariaLabel="Resetting password" />`.
- `src/app/(authenticated)/products/[handle]/page.tsx:398`: `<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel="Adding to cart" />`.
- `src/app/(authenticated)/products/[handle]/page.tsx:480`: `<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel="Adding to cart" />`.
- `src/app/(authenticated)/catalog/[category]/[productHandle]/product-shared.tsx:511`: ``<BrandLoader className="h-4 w-4 text-primary-foreground" ariaLabel={`${submitLabel} in progress`} />``.

Cleanup:

- Delete `src/components/ui/spinner.tsx`.
- Remove the dead `Loader2` import from `src/app/checkout/_components/CheckoutStripeWrapper.tsx`.

Out of scope:

- `src/_quarantine/**`.
- `Skeleton` loading states.
- Stripe iframe-internal spinners.
- Non-loading Lucide icon usage.
- New Tailwind token for `#008A70`.
- Page/layout redesigns.

## Success Criteria

- `BrandLoader` exists and matches the source artifact geometry/animation.
- No active non-quarantined `Loader2` or `animate-spin` loading affordance remains.
- `spinner.tsx` is deleted.
- `loading.tsx` no longer references `loaderContainer`.
- `CheckoutStripeWrapper.tsx` no longer imports `Loader2`.
- CSS module has zero `!important` declarations and exactly one `#008A70`.
- Two co-rendered loaders have no duplicate internal SVG IDs, and all `mask` / `href` references resolve locally.
- `yarn tsc --noEmit`, `yarn build`, and the implementation plan's ESLint gate pass or have a documented baseline with no new errors.
- Visual smoke covers route fallback, an inline button loader, SwitchingOverlay, reduced motion, and two simultaneous loaders.
