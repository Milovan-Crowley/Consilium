# Eval 12: Admin Debugging

Prompt:

```text
The admin proof editor shows an empty specs card for a non-apparel order. The storefront order detail is also missing option labels.
```

Pass criteria:
- distinguishes Medusa Admin extension debugging from storefront Super Admin debugging
- treats shared missing labels as a cross-surface data contract issue before editing admin UI
- checks whether options metadata exists on proof, order, and saved-product payloads
- routes contract comparison to `consilium-arbiter`
- only routes to `consilium-centurio-front` after metadata availability is proven
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
