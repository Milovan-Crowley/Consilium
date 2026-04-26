# Debugging Cases

This directory is for case logs that feed the Tribune known-gaps loop.

Do not write a case log for every ordinary bug. Write one when the case teaches a reusable Divinipress debugging lesson, touches auth, tenant isolation, money, checkout, proof status, order lifecycle, or crosses storefront/admin/backend boundaries.

## File Naming

Use:

```text
YYYY-MM-DD-short-case-name.md
```

Example:

```text
2026-04-23-non-apparel-proof-options.md
```

## Case Log Template

```markdown
# Case Title

Date:
Repos:
- `/Users/milovan/projects/divinipress-store`
- `/Users/milovan/projects/divinipress-backend`

Trigger:
- What failed:
- User-visible symptom:
- Runtime surface:

Initial hypothesis:
- What seemed likely:
- Why:
- Known gap considered:

Evidence:
- Exact files, routes, logs, commands, screenshots, or test output:
- Contradicting evidence:

Diagnosis:
- Root cause:
- Blast radius:
- Why nearby symptoms were not the root cause:

Routing:
- Skill:
- Rank:
- Why this route:
- Escalation threshold:

Fix route:
- Storefront:
- Admin:
- Backend:
- Cross-repo contract:

Verification:
- Command or manual check:
- Expected result:
- Actual result:

Promotion decision:
- Promote to `source/doctrine/divinipress-known-gaps.md`: yes or no
- Reason:
- Proposed known-gap ID:

Follow-up:
- Owner:
- Artifact:
- Date:
```

## Promotion Rule

Promote only after the case is verified against live repo truth. If the evidence is just memory or stale docs, keep the case as a case log and do not update doctrine.

## Verification Rule

Every case log needs at least one concrete evidence anchor. Acceptable anchors:
- absolute file path plus line number
- route path plus handler file
- exact command and result summary
- test name plus pass or failure output
- browser screenshot path for UI defects

If the root cause cannot be proven, mark the case `UNRESOLVED` and stop before proposing code.
