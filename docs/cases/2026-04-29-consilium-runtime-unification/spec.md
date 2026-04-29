# Consilium Runtime Unification Spec

**Status:** Edict written — pending plan verification
**Date:** 2026-04-29
**Target:** Consilium repo, Claude runtime, Codex runtime
**Agent:** both

## 1. Goal

Unify Consilium around one canonical agent vocabulary and one neutral source tree, then generate separate Claude and Codex runtime files from that shared truth.

> **Confidence: High** — the Imperator explicitly rejected continued patching and wants the Codex/Claude split cleaned up today.

## 2. Locked Decisions

The following decisions are not open in the implementation plan:

- `soldier` and `scout` are retired as canonical workflow names.
- There is no removal date and no long compatibility tail.
- Claude and Codex use the same canonical Consilium agent names.
- Claude and Codex runtime files remain separate because their formats differ.
- Runtime-specific files are generated or installed targets, not separate doctrine worlds.
- The risk-tier plan-format work pauses until this standardization lands.
- `Medicus` is retired as a canonical rank name. Tribune debugging remains a workflow surface, and the dispatchable verifier remains `consilium-tribunus`.
- Centurio replaces Soldier as the implementation rank. The old Soldier habit of escalating real ambiguity is preserved, but Centurio may proceed on reversible local implementation choices after checking repo truth.

> **Confidence: High** — these combine direct Imperator rulings with verifier-forced decisions needed to make the cutover executable.

## 3. Canonical Vocabulary And Runtime Surfaces

The shared canonical Consilium vocabulary is:

- `consilium-consul`
- `consilium-legatus`
- `consilium-censor`
- `consilium-praetor`
- `consilium-provocator`
- `consilium-tribunus`
- `consilium-custos`
- `consilium-centurio-front`
- `consilium-centurio-back`
- `consilium-centurio-primus`
- `consilium-speculator-front`
- `consilium-speculator-back`
- `consilium-speculator-primus`
- `consilium-interpres-front`
- `consilium-interpres-back`
- `consilium-arbiter`

Canonical name does not always mean the same runtime surface:

- Main-session orchestration surfaces: `consilium-consul`, `consilium-legatus`.
- Dispatchable verification agents: `consilium-censor`, `consilium-praetor`, `consilium-provocator`, `consilium-tribunus`, `consilium-custos`.
- Dispatchable execution agents: `consilium-centurio-front`, `consilium-centurio-back`, `consilium-centurio-primus`.
- Dispatchable tracing and interpretation agents: `consilium-speculator-front`, `consilium-speculator-back`, `consilium-speculator-primus`, `consilium-interpres-front`, `consilium-interpres-back`, `consilium-arbiter`.

Claude may expose Consul and Legatus as main-session skills rather than user-scope agents. Codex may expose them as configured agents if that is how the Codex runtime registers orchestration roles. The required parity is name and behavior parity, not identical runtime file type.

`consilium-speculator-primus` replaces generic Scout reconnaissance for Consilium source, runtime adapters, plugin/cache/config surfaces, unknown-lane triage, and cross-surface read-only mapping. It is read-only unless a later plan explicitly assigns execution to a Centurio.

`consilium-soldier`, `consilium-scout`, `Medicus`, and the five lane-specific Provocator agents are not active workflow names after this cutover. They may appear only in historical case files, migration notes, explicit negative checks, or compatibility notes that say they are retired.

> **Confidence: High** — live Codex already exposes the Centurio and lane Speculator names in `codex/source/manifest.json`; `consilium-speculator-primus` is the new generic/source-runtime replacement for Scout. Live Claude still exposes Soldier/Scout, which is the mismatch this spec removes.

## 4. Source Layout Contract

Consilium agent-prompt source truth moves to a runtime-neutral tree:

```text
source/
  manifest.json
  doctrine/
  protocols/
  roles/
  skills/
```

Generated runtime outputs live next to each other:

```text
generated/
  claude/agents/
  claude/skills/
  codex/agents/
  codex/config/
```

Runtime adapters live under:

```text
runtimes/
  claude/
  codex/
```

The existing `claude/` and `codex/` directories may remain only where external tools, plugins, or current app configuration require those paths. If they remain, they must be shims, installers, skills, docs, or generated compatibility targets. They must not contain a second canonical agent doctrine source.

This source layout does not move or generate the shared runtime documentation tree. `$CONSILIUM_DOCS`, including `docs/CONVENTIONS.md`, `docs/cases/`, and any shared docs doctrine, remains the authoritative runtime case/artifact tree. Root `source/doctrine/` is baked prompt doctrine for generated agents and skills; root `source/skills/` is canonical main-session skill source; `docs/` remains the live work product and case record.

> **Confidence: Medium** — the desired neutral layout is clear. Exact shim needs depend on live plugin/config path checks during implementation.

## 5. Manifest Contract

There is one canonical manifest at `source/manifest.json`.

Each agent entry declares:

- canonical `name`
- role source file
- included doctrine/protocol files
- nicknames
- description
- runtime availability for Claude
- runtime availability for Codex
- runtime surface type: main-session skill, dispatchable agent, or runtime adapter
- runtime-specific model and execution settings only where the runtime needs them
- runtime-specific metadata that must be preserved during generation

Runtime-specific settings are allowed. Runtime-specific doctrine forks are not.

Claude generation must preserve required frontmatter and runtime metadata such as `name`, `description`, `model`, `tools`, and `mcpServers`. Codex generation must preserve required TOML metadata such as model, reasoning effort, sandbox, MCP/tool wiring, and generated config registration data.

> **Confidence: High** — current Codex already has a manifest-driven generator; this generalizes it instead of keeping Codex as its own source island.

## 6. Runtime Output Contracts

### 6.1 Claude

Claude generated dispatchable agents are Markdown files:

```text
generated/claude/agents/consilium-*.md
```

The installer syncs these into:

```text
/Users/milovan/.claude/agents/consilium-*.md
```

After install, active Claude user-scope agents match the dispatchable subset in §3. Old active names are pruned from user scope.

Claude generated or adapted main-session skills live under:

```text
generated/claude/skills/
```

The Claude plugin path may still require installed skill files under `claude/skills/`. Those files are runtime adapters, not canonical doctrine source. They must be generated from neutral `source/skills/`, or be thin handwritten shims that point at neutral source and contain no divergent rank vocabulary, routing law, verifier law, or execution doctrine.

The implementation plan must inspect and preserve Claude plugin registration surfaces before moving or pruning anything:

- `/Users/milovan/.claude/settings.json`
- `/Users/milovan/.claude/plugins/installed_plugins.json`
- `/Users/milovan/.claude/plugins/consilium`
- `claude/.claude-plugin/*`
- any plugin cache path named by installed Claude plugin metadata

### 6.2 Codex

Codex generated agents remain TOML files:

```text
generated/codex/agents/consilium-*.toml
```

The installer syncs these into:

```text
/Users/milovan/.codex/agents/consilium-*.toml
```

`generated/codex/config/codex-config-snippet.toml` remains generated from the same manifest.

The Codex installer must sync generated config into `/Users/milovan/.codex/config.toml` as a required cutover check. Config registration parity is not optional and may not depend on a forgotten flag.

> **Confidence: High** — the runtime output formats cannot be shared, but their source can.

## 7. Workflow Language Contract

Plans, specs, verification templates, and routing protocols use canonical rank names.

Use:

- `consilium-centurio-front` for bounded storefront/frontend implementation.
- `consilium-centurio-back` for bounded backend implementation.
- `consilium-centurio-primus` for Consilium source, runtime adapter, installer, generated-agent, cross-surface, or rescue implementation after ambiguity is reduced.
- `consilium-speculator-front` and `consilium-speculator-back` for frontend/backend reconnaissance and tracing.
- `consilium-speculator-primus` for Consilium source, runtime adapter, plugin/cache/config, unknown-lane, and cross-surface reconnaissance.
- `consilium-tribunus` for implementation verification and debugging verdicts. Do not rename this surface to Medicus.

Do not use:

- `consilium-soldier`
- `consilium-scout`
- `Medicus`
- `soldier` as the generic implementation owner in new plans
- `scout` as the generic reconnaissance owner in new specs

Plain English words like "implementation agent" or "reconnaissance pass" are allowed only when not naming a dispatch target.

> **Confidence: High** — this is the core cleanup needed to stop specs from mixing Claude and Codex dialects.

## 8. Direct Cutover Rules

This is a direct cutover, not a gradual migration.

- Update active source, skills, protocols, and templates in the same campaign.
- Install both runtimes in the same campaign.
- Prune old user-scope Claude names after the new Claude agents are installed and verified.
- Do not leave `consilium-soldier` or `consilium-scout` as active aliases.
- Do not add a removal date.
- Do not continue risk-tier plan-format work until this cutover passes verification.

If a runtime cannot dispatch a canonical agent name after install, that is a blocker, not an aliasing excuse.

The implementation plan must preserve this order:

1. Preflight: record the current repo status, generated outputs, installed Claude/Codex agent lists, Claude plugin/settings/cache paths, and Codex config registration.
2. Build the neutral `source/` tree and generation scripts without pruning old runtime files.
3. Dry-run generation into `generated/` and validate Claude metadata, Codex TOML, and Codex config snippet output.
4. Sync generated compatibility outputs back into any required `claude/` or `codex/` shim paths.
5. Install new Claude and Codex runtime files, including required Codex config sync.
6. Verify generated-to-installed byte parity, active name parity, and runtime registration visibility.
7. Only after successful verification, prune retired Claude user-scope agents and stale five-lane Provocator agents.
8. If runtime registration fails, restore the preflight backup of installed agents/config/plugin metadata before attempting another install.

> **Confidence: High** — the Imperator explicitly wants this done today and does not want to keep using Claude until the split is resolved.

## 9. Non-Goals

- No model downgrade.
- No verifier-model lowering.
- No risk-tier plan-format implementation in this lane.
- No redesign of the Consilium personas beyond naming and shared-source unification.
- No behavior change to Medusa doctrine, money-path doctrine, diagnosis packets, or fix thresholds.
- No unrelated execution philosophy change. Centurio replaces Soldier as the implementation rank while preserving ambiguity escalation at real decision boundaries.
- No manual copy-paste sync as the final architecture.

> **Confidence: High** — this lane is cleanup of source truth and runtime naming, not a new workflow invention.

## 10. Affected Surfaces

The implementation plan should inspect and update at minimum:

- `claude/CLAUDE.md`
- `claude/skills/consul/SKILL.md`
- `claude/skills/edicts/SKILL.md`
- `claude/skills/legion/SKILL.md`
- `claude/skills/legion/implementer-prompt.md`
- `claude/skills/march/SKILL.md`
- `claude/skills/tribune/SKILL.md`
- `claude/skills/references/verification/protocol.md`
- `claude/skills/references/verification/templates/*.md`
- `claude/scripts/check-codex-drift.py`
- `claude/scripts/check-tribune-staleness.py`
- `claude/.claude-plugin/*`
- `source/`
- `generated/`
- `runtimes/`
- `docs/CONVENTIONS.md`
- `docs/doctrine/*`
- `/Users/milovan/.claude/settings.json`
- `/Users/milovan/.claude/plugins/installed_plugins.json`
- `/Users/milovan/.claude/plugins/consilium`
- any Claude plugin cache path named by installed metadata
- `codex/source/manifest.json`
- `codex/source/roles/*`
- `codex/source/protocols/*`
- `codex/scripts/generate_agents.py`
- `codex/scripts/install-codex-agents.sh`
- `codex/scripts/sync-codex-config.py`
- `codex/scripts/check-shared-docs-adoption.py`
- `codex/README.md`
- `codex/RANK-MAPPING-AUDIT.md`
- `/Users/milovan/.codex/config.toml`
- user-scope Claude agents under `/Users/milovan/.claude/agents`
- user-scope Codex agents under `/Users/milovan/.codex/agents`

The plan may choose whether to move the current scripts into `runtimes/*/scripts` in this campaign or leave script paths as thin runtime adapters. It may not leave canonical prompt source under `codex/source`.

> **Confidence: Medium** — the minimum surfaces are live and visible; exact script move depth is implementation-plan territory.

## 11. Verification Requirements

The implementation is not complete until all of these pass:

1. A source-generation check proves Claude and Codex runtime files are generated from the neutral `source/` tree.
2. Claude main-session skills are generated from neutral `source/skills/` or verified as thin runtime shims with no divergent doctrine.
3. Installed Claude agents match generated Claude agents.
4. Installed Codex agents match generated Codex agents.
5. Installed Codex config registration matches generated Codex config output.
6. The installed Claude active user-scope agent set matches the dispatchable subset in §3.
7. The installed Codex active agent set matches the Codex runtime subset declared in the manifest.
8. Claude plugin/settings/cache surfaces point at the intended installed plugin/source paths and do not silently skip missing expected roots.
9. Active workflow files contain no `consilium-soldier`, `consilium-scout`, or `Medicus` references except in explicit migration notes, retired-name notes, historical cases, or negative checks.
10. Active workflow files contain no five-lane Provocator dispatch references.
11. Existing Codex generated TOML validation still passes.
12. Existing Claude agent drift/staleness checks are replaced or updated so they verify the new source truth and fail on missing expected roots.
13. A smoke check proves the runtime can resolve canonical dispatch names after install, or records the exact runtime limitation as a blocker before pruning.
14. The final report tells the Imperator that both Claude and Codex require fresh sessions after install.

> **Confidence: High** — these are observable checks and directly target the current confusion.

## 12. Success Criteria

After this campaign:

- A Consilium plan can name an implementation owner without caring whether Claude or Codex is executing it.
- Claude and Codex use the same canonical Consilium names, with runtime surface differences documented in the manifest.
- There is one neutral canonical source tree for roles, doctrine, protocols, and manifest data.
- Runtime-specific generated files are housed next to each other.
- `codex/source` no longer acts as a separate source kingdom.
- `consilium-soldier`, `consilium-scout`, and `Medicus` are gone from active workflow.
- The risk-tier plan-format spec can be rewritten against one vocabulary instead of two.

> **Confidence: High** — these outcomes directly answer the Imperator's complaint.

## 13. Open Questions

None for product direction.

The implementation plan must decide tactical script/file-move order after checking live path dependencies. If a path is externally required by an app or plugin, keep a shim and document why.

> **Confidence: High** — strategic decisions are locked; remaining uncertainty is tactical filesystem migration order.
