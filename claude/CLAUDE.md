# Consilium

Domain-aware planning and verification system for Divinipress. Roman-themed agent hierarchy with independent verification at every stage.

## Vision

Read `docs/CONSILIUM-VISION.md` for full context on decisions, architecture, and open questions.

## Commands

- `/consul` — summon the Consul. Brainstorm → plan → execute pipeline.
- `/tribune` — summon the Medicus. Diagnosis before execution.

## Architecture

- **Personas (canonical source):** `skills/references/personas/` — Consul, Censor, Praetor, Legatus, Tribunus, Provocator, Medicus, Imperator + Codex
- **User-scope agents (dispatched workers):** `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,scout,custos}.md` plus five Provocator lane agents `~/.claude/agents/consilium-provocator-{overconfidence,assumption,failure-mode,edge-case,negative-claim}.md` — twelve files in total. Censor, Praetor, Provocator (legacy), Tribunus, Soldier, Custos, and the five Provocator lanes carry persona + Codex baked into system prompt; Scout carries its reconnaissance persona + Invocation only. Loaded once per spawn. **The Provocator role decomposes into five parallel lanes for spec verification and plan verification** (see `skills/references/verification/protocol.md` §14 Aggregation Contract). The legacy `consilium-provocator` agent is retained for Campaign review (post-execution triad), which continues to use a single-Provocator dispatch in v1.
- **Main-session personas:** Consul (consul/edicts SKILLs) and Legatus (legion/march SKILLs) run in the main conversation. Persona content is inlined into the SKILL.md bodies directly — no runtime file reads.
- **Doctrine:** `$CONSILIUM_DOCS/doctrine/` — modular business knowledge (MANIFEST.md + 6 topic files + 2 code maps). Read directly from the resolved `$CONSILIUM_DOCS` checkout.
- **Verification Engine:** `skills/references/verification/` — protocol + 4 dispatch templates (spec, plan, campaign, mini-checkit)
- **Finding Categories:** MISUNDERSTANDING (halt), GAP (auto-feed), CONCERN (suggestion), SOUND (confirmed)
- **All verification agents run on Opus**

## Repos

- Consilium monorepo: `/Users/milovan/projects/Consilium` (this repo) — runtime-tuned source under `claude/`, `codex/`, doctrine + cases under `docs/`. The canonical jurisprudence Codex lives at `docs/codex.md`.
- Store: `/Users/milovan/projects/divinipress-store`
- Backend: `/Users/milovan/projects/divinipress-backend`

## Maintenance

**Codex drift check.** The Codex (canonical at `docs/codex.md`) is copy-pasted into 11 user-scope agent files (Censor, Praetor, Provocator legacy, Tribunus, Soldier, Custos, plus 5 Provocator lane agents). The shared persona body of Spurius Ferox (canonical at `skills/references/personas/provocator.md`, sections from `## Creed` through `## Loyalty to the Imperator`) is also copy-pasted into the 5 Provocator lane agents. After editing the canonical Codex or canonical persona, run:

```bash
python3 scripts/check-codex-drift.py              # report drift (Codex + lane persona body)
python3 scripts/check-codex-drift.py --verbose    # report + unified diff
python3 scripts/check-codex-drift.py --sync       # rewrite Codex sections from canonical (persona body NOT auto-synced in v1)
```

**Persona-body drift coverage scope.** The script's persona-body drift detection is scoped to the 5 Provocator lane agents only (they share one canonical persona file, so drift detection is mechanical). The 6 original agents (Censor, Praetor, Provocator legacy, Tribunus, Soldier, Custos) each have their own persona file under `skills/references/personas/`; persona-body drift detection across that surface is a documented gap — extending coverage there is future work. Editing those 6 agent files post-deploy without manually re-syncing from canonical can drift silently; the Codex section drift check still catches Codex-side drift.

**Plugin cache.** The plugin cache at `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` is symlinked to `/Users/milovan/projects/Consilium/claude/`. Edits to source under `claude/` are instantly live in the next session — no copy step needed.

**Tribune staleness check.** After editing any tribune file, run:

```bash
python3 scripts/check-tribune-staleness.py              # report
python3 scripts/check-tribune-staleness.py --verbose    # report + unified matches
```

Scans for stale references (banned regex, case-insensitive), broken reference targets (including medusa-dev skills resolved via `~/.claude/plugins/installed_plugins.json` + cache), and test-writing discipline leaks.

**Debugging cases.** Case files live at `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`. Written by the Medicus in `/tribune` Phase 6 before the Imperator gate; read by Legion at intake; promoted to `$CONSILIUM_DOCS/doctrine/known-gaps.md` per `$CONSILIUM_DOCS/CONVENTIONS.md`.

**User-scope agent customizations (machine-switch recovery).** Twelve user-scope agents carry Consilium-specific body content that lives OUTSIDE this repo at `~/.claude/agents/consilium-*.md`:

- `consilium-tribunus.md` — two-stance `description:` line + Stance Selection body block + Medusa MCP Usage body note (+ Rig fallback rule).
- `consilium-{scout,censor,praetor,provocator,soldier}.md` — Medusa MCP Usage body note (+ Rig fallback rule).
- `consilium-custos.md` — Six Walks operational doctrine (Marcus Pernix; dispatch-readiness verifier; verdict format BLOCKER / PATCH BEFORE DISPATCH / OK TO MARCH; mandatory Do Not Widen section) + Medusa MCP Usage body note (+ Rig fallback rule).
- `consilium-provocator-{overconfidence,assumption,failure-mode,edge-case,negative-claim}.md` — five Provocator lane agents. Each carries the shared Spurius Ferox persona body (from `skills/references/personas/provocator.md`) + a lane-specific Operational Doctrine + the Codex + Operational Notes + Medusa MCP Usage body note (+ Rig fallback rule). The negative-claim lane has Bash in its tools list; the other four lanes do not.

Canonical content for the original 7 agents lives in `$CONSILIUM_DOCS/cases/2026-04-23-tribune-reshape/plan.md` (T3 + T30). Canonical content for the 5 Provocator lane agents lives in `$CONSILIUM_DOCS/cases/2026-04-26-provocator-decompose/plan.md` (Tasks 5-9). On machine switch, re-apply by copying the relevant Task content blocks into the user-scope files and running the staleness + drift checks (the drift check is now extended to cover the Provocator lane agents' Codex + persona body — see "Codex drift check" above). The plan documents are the source of truth; the user-scope agent files are the deployment target.

**Agent testing checklist.** See `docs/testing-agents.md` for manual verification procedures after editing agents, personas, or verification templates.

## Remaining Work

- Learning loop: post-run $CONSILIUM_DOCS doctrine updates (deferred)
