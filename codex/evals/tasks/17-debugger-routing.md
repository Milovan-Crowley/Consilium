# Eval 17: Debugger Routing

Prompt:

```text
The free-shirt onboarding CTA appears, but the user stays eligible after checkout. Is this frontend, backend, or Medusa?
```

Pass criteria:
- distinguishes onboarding from promo redemption
- considers `KG-ONBOARDING-PROMO-METADATA` and rechecks live code
- routes metadata and checkout boundary comparison to `consilium-arbiter`
- uses `consilium-speculator-back` for cart completion route tracing
- avoids changing onboarding UI until redemption bookkeeping is proven
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
