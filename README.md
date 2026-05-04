# Consilium

Consilium is Divinipress internal team tooling for planning, diagnosis, verification, and implementation discipline. It exists for Milovan, Gavin, and Ivan to use from this repo without needing the repo history explained out loud.

V1 supports two runtime paths:

- Claude
- Codex

If you are using anything else, treat it as outside the V1 support surface and start from one of the supported paths above.

## First Setup

From a fresh clone:

1. Set the shared-docs root:

   ```bash
   export CONSILIUM_DOCS="$(pwd)/docs"
   ```

2. Confirm the docs checkout is valid:

   ```bash
   [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS"
   [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ]
   ```

3. If you use Claude, install or refresh Claude support from this checkout. Start with [claude/README.md](claude/README.md) for the active Claude runtime path.

4. If you use Codex, install or refresh Codex support from repo root:

   ```bash
   bash codex/scripts/install-codex.sh --prune-agents
   ```

   Start with [codex/README.md](codex/README.md) for Codex-specific details.

5. Run the repo-local readiness checks before treating the checkout as ready:

   ```bash
   python3 runtimes/scripts/generate.py
   python3 runtimes/scripts/check-runtime-parity.py
   python3 codex/scripts/check-shared-docs-adoption.py
   python3 codex/scripts/check-tribune-shared-docs.py
   bash codex/scripts/install-codex-skills.sh --dry-run
   ```

## Repo Map

- [source/](source/) is the root source of truth for roles, doctrine, and shared runtime material.
- [generated/](generated/) contains generated runtime output. Do not hand-edit it unless a task explicitly says to.
- [claude/](claude/) is the Claude runtime package and install-facing surface.
- [codex/](codex/) is the Codex adapter, installer, config sync, and Codex runtime docs.
- [docs/](docs/) is the shared planning and diagnosis memory. Set `$CONSILIUM_DOCS` here before shared-doc workflows.

Installed runtime destinations are user-scope locations:

- Claude agents install under `$HOME/.claude/agents`.
- Claude plugin support links this checkout's `claude/` package under `$HOME/.claude/plugins/consilium` and records local settings under `$HOME/.claude/settings.json`.
- Codex agents install under `$HOME/.codex/agents`.
- The Tribune skill installs or links under `$HOME/.agents/skills/tribune`.

## Reading The Docs

Use [docs/CONVENTIONS.md](docs/CONVENTIONS.md) as the rulebook for shared docs and case folders. Use [docs/cases/](docs/cases/) as working memory: specs, plans, diagnosis packets, decisions, and historical context. A case file is not current law just because it exists; check its `STATUS.md` and the current plan before acting.

Keep root onboarding practical. This repo is for internal team execution, not broad audience polish.
