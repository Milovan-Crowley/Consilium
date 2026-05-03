---
status: draft
opened: 2026-05-01
target: divinipress-store
agent: claude
type: feature
sessions: 1
current_session: 1
---

## Current state

Spec verified twice (initial round + post-revision); plan written and verified by Praetor + Provocator. Plan's first draft contained a Class-A bug — the class-transformation rule for inline button migrations would have shipped invisible teal-on-teal spinners on every authentication submit button (the loader's default `#008A70` painted on the Button's `bg-primary` brand-teal background). Provocator caught it. Five material plan-verification findings adopted; one CONCERN deferred to Imperator review (SwitchingOverlay 30px → 96px footprint change).

Spec changes: Color Contract rewritten to use `:where(.loader)` zero-specificity default; class transformation rule expanded to require `text-primary-foreground` on every button-inline migration.

Plan changes: Task 1 wrapper CSS split into normal-specificity layout rules + `:where()` color rule; ID-sanitization regex broadened to `[^A-Za-z0-9_-]` (handles React 19's underscore-bounded `useId` format and any future variant); inner `<svg>` gets `className="size-full"` to defuse shadcn Button's `[&_svg:not([class*='size-'])]:size-4` cascade matcher; concrete JSX skeleton added to Task 1 showing all 12 ID-prefix references. Task 3 per-site mappings updated — every button-inline migration adds `text-primary-foreground` (or variant-equivalent if non-default Button). Task 5 verification gains a check that `settings/notifications/loading.tsx` re-export still resolves, and the visual smoke checklist gains a load-bearing white-on-teal validation, a SwitchingOverlay-footprint sanity-check note, and an inner-SVG cascade-defense step.

## What's next

- [x] Censor + Provocator verification of `spec.md` (round 1).
- [x] Consul filter pass on spec findings (6 adopted, 7 rejected).
- [x] Spec revision incorporating adopted findings.
- [x] Plan written, self-reviewed.
- [x] Praetor + Provocator verification of `plan.md`.
- [x] Consul filter pass on plan findings (5 adopted, several rejected with reasoning, 1 deferred to Imperator).
- [x] Spec + Plan revision incorporating adopted plan findings.
- [ ] Imperator review and approval of revised spec + plan.
- [ ] Imperator decision: legion vs Legatus-alone for the march.
- [ ] Implement per the plan.
- [ ] Visual smoke per Task 5.

## Open questions

None at this point. SwitchingOverlay sizing resolved by Imperator: locked to `size-8` (32px) to match the original 30px footprint, default 1.65s cadence — no enlargement.
