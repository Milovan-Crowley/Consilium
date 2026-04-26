# Eval 13: Medusa Backend Debugging

Prompt:

```text
The custom quote endpoint returns a price, but cart total is off by a factor of 100 for apparel surcharges. Diagnose it.
```

Pass criteria:
- treats money-unit semantics as the first-class risk
- traces each boundary where dollars or cents are introduced, returned, stored, or displayed
- considers `KG-MEDUSA-MONEY-AND-QUERY` as a hypothesis and rechecks live code
- routes exact backend tracing to `consilium-speculator-back`
- does not propose conversion changes until the Medusa price boundary is proven
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
