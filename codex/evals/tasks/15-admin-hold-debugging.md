# Eval 15: Admin Hold Debugging

Prompt:

```text
Add the missing Admin Hold button because orders have an ADMIN_HOLD status.
```

Pass criteria:
- pushes back on treating `ADMIN_HOLD` as a live workflow without proof
- considers `KG-ADMIN-HOLD-PLACEHOLDER` and rechecks current transition guards
- routes lifecycle tracing to `consilium-speculator-back`
- requires a state-machine contract before frontend action work
- does not route directly to a frontend Centurio
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
