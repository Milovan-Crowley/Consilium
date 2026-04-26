# Consilium Codex

Codex-native source repo for the Consilium orchestration system.

This is the Codex-runtime source within the Consilium monorepo. Sibling runtime source for Claude lives at [../claude](/Users/milovan/projects/Consilium/claude). The two runtimes are not tuned the same way, and they do not share prompt source files — the subdirectories make the separation explicit.

Rules:
- Claude source stays in `/Users/milovan/projects/Consilium/claude`
- Codex source stays here
- Do not sync files from this repo into Claude's plugin cache
- Do not treat `~/.codex/agents` as source; it is install output

## Runtime Shape

Main orchestrator:
- `consilium-consul`

Execution commander:
- `consilium-legatus`

Verification magistrates:
- `consilium-censor`
- `consilium-praetor`
- `consilium-provocator`
- `consilium-tribunus`

Retrieval and interpretation:
- `consilium-speculator-front`
- `consilium-speculator-back`
- `consilium-interpres-front`
- `consilium-interpres-back`
- `consilium-arbiter`

Execution ranks:
- `consilium-centurio-front`
- `consilium-centurio-back`
- `consilium-centurio-primus`

## Source Of Truth

- `source/roles/` contains compact Codex persona source files
- `source/doctrine/` contains Codex prompt-source law baked into generated agents
- Runtime shared doctrine and Consilium artifacts live in `$CONSILIUM_DOCS`, defaulting to `/Users/milovan/projects/Consilium/docs`
- `source/protocols/` contains routing and planning rules
- `source/manifest.json` defines the installed agent pack
- `scripts/generate_agents.py` renders installable TOMLs into `agents/`
- `config/codex-config-snippet.toml` is generated from the manifest

## Shared Docs Requirement

Codex Consilium agents expect `$CONSILIUM_DOCS` to resolve to a valid `consilium-docs` checkout. The default is `/Users/milovan/projects/Consilium/docs`.

The checkout is valid only when:

- `$CONSILIUM_DOCS/CONVENTIONS.md` starts with the `consilium-docs CONVENTIONS` marker line
- `$CONSILIUM_DOCS/.migration-in-progress` is absent

Start a fresh Codex thread after installing agents. Existing threads may keep old generated-agent instructions.

## Install

Install everything from this repo:

```bash
bash scripts/install-codex.sh
```

Optional full refresh:

```bash
bash scripts/install-codex.sh --prune-agents --sync-config
```

The wrapper:
- regenerates and installs `consilium-*.toml` into `~/.codex/agents`
- installs `skills/tribune` into the local skill registry at `~/.agents/skills/tribune`
- optionally prunes stale installed Consilium agents
- optionally syncs `~/.codex/config.toml`

Start a new Codex thread or session after installing. Existing threads do not pick up newly added agent types or changed skill instructions.

## Agent Install

```bash
bash scripts/install-codex-agents.sh
```

Optional prune of stale installed agents:

```bash
bash scripts/install-codex-agents.sh --prune
```

The script:
- regenerates the TOMLs from source
- validates each generated TOML
- syncs `consilium-*.toml` into `~/.codex/agents`
- optionally prunes stale installed agent files

Verify:

```bash
python3 scripts/check-shared-docs-adoption.py --installed
```

After installing, start a new Codex thread or session. Existing threads do not pick up newly added custom agent types.

## Skill Install

Install only the Codex Tribune debugging skill:

```bash
bash scripts/install-codex-skills.sh
```

Dry-run validation:

```bash
bash scripts/install-codex-skills.sh --dry-run
```

The skill installer:
- validates `skills/tribune/SKILL.md` frontmatter
- validates `skills/tribune/agents/openai.yaml`
- checks referenced skill files exist
- rejects stale copied references such as Claude-era paths and wrong Consilium skill calls
- rejects Markdown tables in runtime skill docs
- updates the local `~/.agents/skills/tribune` symlink

Verify:

```bash
readlink ~/.agents/skills/tribune
```

Expected result:

```text
/Users/milovan/projects/Consilium/codex/skills/tribune
```

## Config Sync

To sync the generated Consilium registrations into `~/.codex/config.toml`:

```bash
python3 scripts/sync-codex-config.py
```

The generated registration blocks include:
- `config_file`
- `description`
- `nickname_candidates`

Safe manual line retained:

```toml
project_doc_fallback_filenames = ["AGENTS.md"]
```

## Main Workflow

Use `consilium-consul` as the main agent mode for orchestration-heavy work.

The Consul should:
- think, sequence, judge, and synthesize
- delegate mapping to the `Interpres`
- delegate exact tracing to the `Speculator`
- delegate cross-repo disputes to the `Arbiter`
- delegate execution to the `Legatus`, who then commands the right `Centurio`

## Notes

- `~/.codex/config.toml` still controls which agents are registered.
- If you add or rename agents here, update `~/.codex/config.toml` to match. Use `config/codex-config-snippet.toml` as the reference block.
- Tracers stay intentionally lighter than the other ranks. Magistrates and Centurions keep stronger identity.

## Evals

Golden-task eval prompts live in [evals/](/Users/milovan/projects/Consilium/codex/evals:1). Use them when tuning prompts so changes are judged against recurring work instead of intuition alone.
