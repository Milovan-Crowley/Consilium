---
status: draft
opened: 2026-04-29
target: cross-repo
agent: codex
type: bug
sessions: 1
current_session: 1
---

## Current state

Diagnosis packet drafted and verifier-clean. Spec and edicts drafted and verifier-clean.

Root cause: the saved-product PDP still discards the `standard` non-apparel branch returned by the shared product fetcher, so a print saved product stays on skeleton/blank content even though the same handle renders through the catalog standard PDP.

## What's next

- [x] Fill the primary case artifact
- [x] Verify packet with Tribunus and Provocator
- [x] Write and verify the storefront fix spec
- [x] Write and verify the edicts
- [ ] Execute the storefront fix on the current DIV-74 branch after Imperator approval

## Open questions

- None blocking. The spec requires a saved-product PDP branch, not wholesale reuse of catalog proof actions.
