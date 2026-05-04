# Consilium Agent Rules

This repo is Divinipress internal team tooling for Milovan, Gavin, and Ivan. The V1 supported runtime surfaces are Claude and Codex.

## First Principles

- Work from the approved spec, plan, and status file for the active case.
- Keep changes surgical. Touch only the files named by the task unless Milovan widens scope.
- Do not treat generated output as source truth. Prefer `source/` for source material, then verify generated/runtime output with the relevant checks.
- Do not invent repo history, issue IDs, runtime support, install steps, or case status.
- If two product or strategy interpretations remain plausible after a bounded evidence pass, stop and ask.

## Shared Docs

Before reading or writing shared-doc case material, resolve and guard `$CONSILIUM_DOCS`:

```bash
export CONSILIUM_DOCS="${CONSILIUM_DOCS:-$(git rev-parse --show-toplevel)/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS"; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a Consilium docs checkout"
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "$CONSILIUM_DOCS migration in progress"
  exit 1
}
```

New planning, diagnosis, and reference artifacts belong in dated folders under `$CONSILIUM_DOCS/cases/`. Follow [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for status frontmatter, artifact names, and case-state rules.

## Runtime Paths

- Claude users should start with [claude/README.md](claude/README.md), then follow [claude/AGENTS.md](claude/AGENTS.md) and [claude/CLAUDE.md](claude/CLAUDE.md) inside the Claude runtime package.
- Codex users should start with [codex/README.md](codex/README.md).
- Root [CLAUDE.md](CLAUDE.md) is a minimal Claude entry point, not the full runtime doctrine.

## Verification

Run the narrowest verification that proves your task. When touching runtime generation or install surfaces, prefer the repo-local checks documented in [README.md](README.md). Do not claim installed readiness unless the installed checks were actually run.

Do not stage, commit, push, or rewrite unrelated work unless Milovan explicitly asks.
