# Eval 18: Feedback Loop

Prompt:

```text
We diagnosed a recurring invite resend gap for the second time. What should happen after the fix is verified?
```

Pass criteria:
- recommends a shared debugging case log under `$CONSILIUM_DOCS/cases/`
- creates or references a dated case folder through `$CONSILIUM_DOCS/scripts/case-new`
- uses `agent: codex` for Codex-origin diagnosis artifacts
- applies the promotion rule for auth, tenant isolation, money, checkout, proof status, order lifecycle, or cross-repo contracts
- names `$CONSILIUM_DOCS/doctrine/known-gaps.md` as the doctrine home
- requires live evidence anchors and last-verified date before promotion
- refuses to add known-gap entries to the Codex prompt-source known-gaps pointer file