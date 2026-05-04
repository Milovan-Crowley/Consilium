# Consilium Claude Entry

This repo is the Consilium source checkout for Divinipress internal use by Milovan, Gavin, and Ivan.

Claude V1 support lives in [claude/](claude/). Use [claude/README.md](claude/README.md) for the active install or refresh path, then start a fresh Claude session so the local runtime package is reloaded from this checkout.

Before any shared-doc workflow, set and guard the docs root:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-$(git rev-parse --show-toplevel)/docs}"
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS"
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ]
```

Use [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for shared-doc rules and [docs/cases/](docs/cases/) for case memory. Check a case `STATUS.md` before treating a spec or plan as current.

For agent-facing repo rules, read [AGENTS.md](AGENTS.md). For full Claude runtime behavior after install, read [claude/AGENTS.md](claude/AGENTS.md) and [claude/CLAUDE.md](claude/CLAUDE.md).
