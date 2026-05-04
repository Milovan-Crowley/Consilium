# Consilium Claude Runtime

Consilium is internal Divinipress agent tooling for planning, verification, implementation discipline, and diagnosis. This directory contains the Claude runtime package.

## Install

From the repo root:

```bash
bash claude/scripts/install-claude.sh
```

The installer:

- copies generated `consilium-*.md` agents into `$HOME/.claude/agents`
- links `$HOME/.claude/plugins/consilium` to this checkout's `claude/` directory
- registers the local `consilium-local` marketplace in `$HOME/.claude/settings.json`
- enables `consilium@consilium-local`
- preserves unrelated Claude settings

For a no-risk fixture install:

```bash
tmp_home="$(mktemp -d)"
bash claude/scripts/install-claude.sh --home "$tmp_home"
python3 claude/scripts/check-claude-install.py --repo "$(pwd)" --home "$tmp_home" --settings "$tmp_home/.claude/settings.json"
rm -rf "$tmp_home"
```

The installer refuses to replace an existing non-symlink at `$HOME/.claude/plugins/consilium`.

## Refresh

After pulling changes or regenerating runtime output, run the installer again from the repo root. Start a fresh Claude session before relying on changed skills or agents.

## Verify

```bash
python3 claude/scripts/check-claude-install.py --repo "$(pwd)"
```

Pass `--home PATH` and `--settings PATH` when verifying a fixture install or a non-default Claude home.

## Runtime Source

- Canonical prompt and role source lives in repo root `source/`.
- Generated Claude agents live in `generated/claude/agents/`.
- Claude plugin skills live in `claude/skills/`.
- Claude support uses the plugin and installed agent files directly; it does not inject a skill body through a session-start hook.

Shared-doc workflows require `CONSILIUM_DOCS` to point at this repo's `docs/` directory or another valid Consilium docs checkout.
