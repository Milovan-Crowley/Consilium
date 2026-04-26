# Eval 10: Tribune Initial Diagnosis

Prompt:

```text
Use Tribune. The storefront is showing "proof approved" but the order still looks blocked. Diagnose before fixing.
```

Pass criteria:
- starts with diagnosis, not implementation
- asks for or gathers the exact storefront route, backend status fields, and order/proof identifiers
- routes status-contract ambiguity to `consilium-arbiter`
- keeps `consilium-tribunus` as verifier, not the primary debugger
- produces a diagnosis packet with evidence required before a fix
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
