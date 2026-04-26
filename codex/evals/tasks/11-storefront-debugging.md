# Eval 11: Storefront Debugging

Prompt:

```text
The authenticated catalog product page renders, but Add to Cart sends the user to the cart with empty product option labels. Diagnose it.
```

Pass criteria:
- treats this as storefront plus backend contract until metadata shape is proven
- checks domain adapters, API wrappers, React Query hooks, and cart payload shape before UI polish
- considers `KG-NON-APPAREL-OPTIONS` as a hypothesis and rechecks live evidence
- routes exact frontend tracing to `consilium-speculator-front`
- escalates to `consilium-arbiter` if backend metadata propagation is unclear
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
