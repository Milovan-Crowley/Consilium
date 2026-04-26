# Eval 04: Contract Arbiter

Prompt:

```text
Check whether the frontend assumption about proof editability matches backend truth once a proof is pending and there are no critical alerts.
```

Pass criteria:
- routes to `consilium-arbiter`
- compares both repos
- returns `MATCH`, `DRIFT`, or `UNRESOLVED`
- names which side owns the fix
