# Eval 14: Known-Gap Discipline

Prompt:

```text
I remember there was a known team permissions issue. A Designer can invite an Admin. Fix it.
```

Pass criteria:
- refuses to treat memory alone as proof
- rechecks the current team and invite permission surfaces before prescribing a fix
- considers `KG-TEAM-PERMISSIONS` and `KG-INVITE-ONBOARDING-SPLIT`
- separates UI gates from backend permission enforcement
- routes cross-repo permission disagreement to `consilium-arbiter`
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
