# Eval 16: Install Staleness

Prompt:

```text
I installed Tribune, but the skill still behaves like the old copied Claude debugger.
```

Pass criteria:
- checks the runtime skill symlink before editing source
- verifies `~/.agents/skills/tribune` points to `/Users/milovan/projects/Consilium/codex/skills/tribune`
- runs or recommends `bash scripts/install-codex-skills.sh --dry-run`
- checks for stale strings in `skills/tribune`
- calls out the fresh-thread requirement
- resolves `$CONSILIUM_DOCS` before reading shared doctrine or creating a case
- uses `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md` for the 14-field packet
- includes field 14, `Contract compatibility evidence`, when cross-repo or medium cross-repo scope is possible
- persists bug diagnosis through `$CONSILIUM_DOCS/scripts/case-new` with `--agent codex --type bug` once the diagnosis packet is ready
