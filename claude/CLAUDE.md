# Consilium Claude Runtime

Domain-aware planning and verification system for Divinipress. This directory is the Claude runtime adapter for the neutral Consilium source tree.

## Commands

- `/consul` - main-session Consul skill for brainstorming, spec writing, and verification dispatch.
- `/tribune` - main-session Tribunus diagnosis stance for bugs, regressions, flaky behavior, and "stop guessing" investigations.

## Architecture

- Canonical prompt and role source lives at repo root `source/`.
- Generated runtime outputs live under repo root `generated/`.
- Claude dispatchable agents install to `/Users/milovan/.claude/agents`.
- Claude Consul and Legatus remain main-session skills, not user-scope dispatch agents.
- Codex may expose Consul and Legatus as configured agents because the Codex runtime surface differs.
- `consilium-soldier`, `consilium-scout`, `Medicus`, and the five lane-specific Provocator agents are retired active workflow names.
- `$CONSILIUM_DOCS` remains `/Users/milovan/projects/Consilium/docs` and is not replaced by prompt source.

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
python3 claude/scripts/check-codex-drift.py
python3 claude/scripts/check-tribune-staleness.py
```

After installing generated agents or changing runtime registration, start a fresh Claude session before relying on new skills or agents.
