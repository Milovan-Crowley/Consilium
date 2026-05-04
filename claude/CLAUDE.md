# Consilium Claude Runtime

This directory is the Claude runtime adapter for Consilium, Divinipress's internal planning, verification, implementation, and diagnosis system.

## Supported Runtime

Claude support is installed from this repo with:

```bash
bash claude/scripts/install-claude.sh
```

Use `--home PATH` for fixture installs. Verify with:

```bash
python3 claude/scripts/check-claude-install.py --repo "$(pwd)"
```

## Architecture

- Canonical prompt and role source lives at repo root `source/`.
- Generated runtime outputs live under repo root `generated/`.
- Claude dispatchable agents install to `$HOME/.claude/agents`.
- Claude Consul and Legatus remain main-session skills, not user-scope dispatch agents.
- `consilium-soldier`, `consilium-scout`, `Medicus`, and the five lane-specific Provocator agents are retired active workflow names.
- `$CONSILIUM_DOCS` must point at the active Consilium docs checkout before shared-doc workflows run.
- Claude support must not rely on a session-start hook for skill-body injection.

## Runtime Source

- `source/skills/claude/` is the canonical source for Claude skill bodies.
- `generated/claude/skills/` is generated from that source.
- `claude/skills/` is the plugin runtime copy loaded by Claude.
- `generated/claude/agents/` contains generated Claude user-scope agents.

## Maintenance

After changing neutral source or Claude skill source, run:

```bash
python3 runtimes/scripts/generate.py
python3 runtimes/scripts/check-runtime-parity.py
python3 claude/scripts/check-tribune-staleness.py
```

After installing generated agents or changing runtime registration, start a fresh Claude session before relying on new skills or agents.
