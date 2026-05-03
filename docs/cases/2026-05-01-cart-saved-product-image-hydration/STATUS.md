---
status: draft
opened: 2026-05-01
target: cross-repo
agent: codex
type: bug
sessions: 1
current_session: 1
---

## Current state

Diagnosis packet filled from read-only code investigation. Root cause is localized to the saved-product image hydration boundary between `/company/cart` and the storefront cart image renderer.

## What's next

- [x] Fill the primary case artifact
- [ ] Route diagnosis for independent verification before any fix

## Open questions

- Backend-normalize `/company/cart` thumbnails, or wire the existing storefront hydration hook with the extra cart product metadata needed to enable it?
