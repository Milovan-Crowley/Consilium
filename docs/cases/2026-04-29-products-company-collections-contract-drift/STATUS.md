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

Diagnosis packet drafted. Root-cause hypothesis: running backend integration branch is missing the existing `/company/my-products` collection DTO hydration repair that current storefront `develop` expects.

## What's next

- [x] Fill the primary case artifact
- [ ] Verify packet with Tribunus and Provocator before fix routing

## Open questions

- Should the backend integration branch merge the full backend base/repair stack or cherry-pick only the collection contract repair?
