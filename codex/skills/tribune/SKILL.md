---
name: tribune
description: Use when encountering any bug, test failure, build failure, flaky behavior, regression, or unexpected behavior in Consilium Codex before proposing fixes. Produces shared-docs diagnosis packets and routes fixes through existing Consilium ranks.
---

# Tribune Debugging

## Iron Law

No fix begins until the root cause has been investigated and the diagnosis packet is explicit.

No fix is called verified until the evidence, route, and verification plan have been stated.

Tribune is the debugging workflow skill. It is not a new agent rank, and it does not replace `consilium-tribunus`.

## Phase 0 - Resolve `$CONSILIUM_DOCS`

Before reading shared doctrine, scanning contained cases, creating a diagnosis case, invoking `$CONSILIUM_DOCS/scripts/case-new`, reading known gaps, or routing a fix from a shared case artifact, run:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
```

If the guard fails, halt and report the exact failure. Do not fall back to the Codex repo's historical local docs or copied local reference files.

## When To Use

Use this skill for:

- Bugs
- Test failures
- Build failures
- Flaky behavior
- Production regressions
- Unexpected frontend, admin, or backend behavior
- Any moment where the user says to stop guessing

Use it especially when a fix looks obvious. Obvious fixes are allowed only after the failing boundary is proven.

## Non-Negotiables

- Do not edit before evidence gathering unless the user asks for emergency containment.
- Do not treat frontend gates as backend authorization.
- Do not treat stale docs or known gaps as current truth without rechecking live code.
- Do not collapse this workflow into `consilium-tribunus`; Tribunus verifies bounded packets and completed tasks.
- Do not create a debugger agent unless evals later prove existing ranks cannot carry the workflow.
- Do not write undated case folders under `$CONSILIUM_DOCS/cases/`.

## Workflow

1. Run Phase 0.
2. Scan contained cases using `$CONSILIUM_DOCS/CONVENTIONS.md` Phase 1 rules.
3. Classify the lane using `$CONSILIUM_DOCS/doctrine/lane-classification.md`.
4. Load shared doctrine for the lane.
5. Gather evidence:
   - exact command, URL, screenshot, trace, log, stack, or reproduction
   - changed files or recent commits when available
   - relevant live code paths
   - contrary evidence checked
6. Trace the failing boundary:
   - browser to frontend hook
   - frontend client to backend route
   - route to workflow
   - workflow to module or link
   - query layer to data shape
   - generated or external system boundary
7. Produce the 14-field diagnosis packet.
8. Ask `consilium-tribunus` and `consilium-provocator` to verify the diagnosis packet when subagent dispatch is available before any fix route is executed.
9. Persist the diagnosis packet to a dated shared case folder before the Imperator gate.
10. Route the fix by threshold from `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`.
11. Verify the completed fix with a command, trace, test, or targeted manual check that matches the failure.

## Phase 1 Contained Case Scan

Scan `$CONSILIUM_DOCS/cases/*/STATUS.md` before new diagnosis when the user invokes Tribune.

Surface a contained case only when all three conditions from `$CONSILIUM_DOCS/CONVENTIONS.md` are true:

1. `STATUS.md` frontmatter has `status: contained`.
2. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`.
3. No later case has a `Resolves: <slug>` field naming the current case slug.

Draft cases older than 7 days may be marked `abandoned` only when the Imperator never approved or rejected them.

## Shared Doctrine Loading

Always read:

- `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`
- `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- `$CONSILIUM_DOCS/doctrine/lane-classification.md`
- `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`
- `$CONSILIUM_DOCS/doctrine/known-gaps.md`

Then read exactly the matching lane guide:

- `storefront` -> `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-debugging.md`
- `storefront-super-admin` -> `$CONSILIUM_DOCS/doctrine/lane-guides/storefront-super-admin-debugging.md`
- `admin-dashboard` -> `$CONSILIUM_DOCS/doctrine/lane-guides/admin-debugging.md`
- `medusa-backend` -> `$CONSILIUM_DOCS/doctrine/lane-guides/medusa-backend-debugging.md`
- `cross-repo` -> `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md`
- `unknown` -> `$CONSILIUM_DOCS/doctrine/lane-guides/cross-repo-debugging.md` until classified

Codex skill crosswalk for Medusa doctrine:

- `storefront` and `storefront-super-admin`: use `building-storefronts`
- `admin-dashboard`: use `building-admin-dashboard-customizations` and `building-with-medusa`
- `medusa-backend`: use `building-with-medusa`
- `cross-repo` and `unknown`: use `building-storefronts` and `building-with-medusa`

The shared lane guide may describe prefixed Rig names from another runtime. In Codex, load the Codex skill names above.

## Known-Gap Discipline

Known gaps are hypothesis accelerators, not proof.

When a known gap appears relevant:

1. Read `$CONSILIUM_DOCS/doctrine/known-gaps.md`.
2. Filter to the current lane or multi-lane entries containing the current lane.
3. Recheck the current repo evidence before using the known gap.
4. Write packet field 9 with `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`.

Using a known gap as evidence without live recheck is a diagnosis MISUNDERSTANDING.

## Diagnosis Packet

Every diagnosis packet must include all 14 fields from `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`:

1. Symptom
2. Reproduction
3. Affected lane
4. Files/routes inspected
5. Failing boundary
6. Root-cause hypothesis
7. Supporting evidence
8. Contrary evidence
9. Known gap considered
10. Proposed fix site
11. Fix threshold
12. Verification plan
13. Open uncertainty
14. Contract compatibility evidence

Field 14 is required when `Affected lane` is `cross-repo` or when the threshold is `medium` on cross-repo scope. `medium` cross-repo fixes require `backward-compatible` evidence. `breaking` means the fix threshold is `large`.

If any required field is missing, keep diagnosing.

## Shared Case Creation

Persist bug diagnosis packets with `$CONSILIUM_DOCS/scripts/case-new`. Run Phase 0 immediately before invoking the script.

Use this pattern:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
case_path="$("$CONSILIUM_DOCS/scripts/case-new" "$slug" --target "$target" --agent codex --type bug)"
printf '%s\n' "$case_path"
```

Capture the returned dated folder path and write the packet to `$case_path/diagnosis.md`. Do not construct an undated case path by hand.

Update `$case_path/STATUS.md` by rewriting YAML frontmatter. Do not append a second status block.

## Fix Routing

Use `$CONSILIUM_DOCS/doctrine/fix-thresholds.md` for threshold meaning:

- `small`
- `medium`
- `large`
- `contain`

Before implementation, route the diagnosis packet to `consilium-tribunus` and `consilium-provocator` when dispatch is available.

Routing rule:

- `SOUND` from both verifiers unlocks fix routing.
- `CONCERN` from either verifier unlocks fix routing only when the concern is explicitly accepted or mitigated.
- `GAP` from either verifier sends the workflow back to diagnosis.
- `MISUNDERSTANDING` from either verifier halts and escalates to the Imperator.
- If dispatch is unavailable, say the diagnosis is unverified and ask whether to proceed, dispatch, or keep diagnosing.

Fix execution rule:

- `small`: route one bounded task through `consilium-legatus`.
- `medium`: write a short implementation plan, then route through `consilium-legatus`.
- `large`: escalate to `consilium-consul`; use the shared case file as input to a fresh spec.
- `contain`: apply reversible containment only when the Imperator confirms emergency containment; leave the case `status: contained`.

## Emergency Containment

Containment is allowed only when real business impact requires immediate harm reduction.

Containment must be:

- labeled as containment
- reversible
- minimal
- followed by the normal diagnosis workflow

Containment does not close the bug.

## Stop Rules

Stop and re-diagnose when:

- two fix attempts fail
- the root cause changes after new evidence
- the fix touches permissions, tenant scope, money, checkout, proof status, or order lifecycle without backend truth
- a storefront symptom depends on backend contract truth
- the evidence only proves where the bug appeared, not where it originated

After three failed fix attempts, stop and question the architecture before another code change.

## Output To User

Before implementation, report:

- verified diagnosis, or unverified diagnosis if verification is not available
- why the suspected boundary is the boundary
- which rank should handle the fix
- `small`, `medium`, `large`, or `contain` fix threshold
- exact verification command or check
- shared case path once the diagnosis is persisted

Do not present a guess as a verified diagnosis.
