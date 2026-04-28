# Consilium

Domain-aware planning and verification system for Divinipress. Roman-themed agent hierarchy with independent verification at every stage.

## Vision

Read `docs/CONSILIUM-VISION.md` for full context on decisions, architecture, and open questions.

## Commands

- `/consul` — summon the Consul. Brainstorm → plan → execute pipeline.
- `/tribune` — summon the Medicus. Diagnosis before execution.

## Architecture

- **Personas (canonical source):** `skills/references/personas/` — Consul, Censor, Praetor, Legatus, Tribunus, Provocator, Medicus, Imperator + Codex. The Custos persona file remains for optional invocation but is not in the default workflow.
- **User-scope agents (dispatched workers):** `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,scout}.md` — six active dispatch agents. Censor, Praetor, Provocator, Tribunus, and Soldier carry persona + Codex baked into system prompt; Scout carries its reconnaissance persona + Invocation only. Loaded once per spawn. The five Provocator lane agents (`consilium-provocator-{overconfidence,assumption,failure-mode,edge-case,negative-claim}`) and `consilium-custos` may exist locally from prior workflows but are no longer dispatched by active skills — they can be left dormant or pruned by the operator.
- **Main-session personas:** Consul (consul/edicts SKILLs) and Legatus (legion/march SKILLs) run in the main conversation. Persona content is inlined into the SKILL.md bodies directly — no runtime file reads.
- **Doctrine:** `$CONSILIUM_DOCS/doctrine/` — modular business knowledge (MANIFEST.md + 6 topic files + 2 code maps). Read directly from the resolved `$CONSILIUM_DOCS` checkout.
- **Verification Engine:** `skills/references/verification/` — protocol + dispatch templates (spec, plan, campaign, mini-checkit, tribune for Medicus diagnosis).
- **Finding Categories:** MISUNDERSTANDING (halt), GAP (auto-feed), CONCERN (suggestion), SOUND (confirmed)
- **All verification agents run on Opus**

## Repos

- Consilium monorepo: `/Users/milovan/projects/Consilium` (this repo) — runtime-tuned source under `claude/`, `codex/`, doctrine + cases under `docs/`. The canonical jurisprudence Codex lives at `docs/codex.md`.
- Store: `/Users/milovan/projects/divinipress-store`
- Backend: `/Users/milovan/projects/divinipress-backend`

## Maintenance

**Codex drift check.** The Codex (canonical at `docs/codex.md`) is copy-pasted into the active user-scope agent files (Censor, Praetor, Provocator, Tribunus, Soldier). After editing the canonical Codex, run:

```bash
python3 claude/scripts/check-codex-drift.py              # report drift
python3 claude/scripts/check-codex-drift.py --verbose    # report + unified diff
python3 claude/scripts/check-codex-drift.py --sync       # rewrite Codex sections from canonical
```

**Persona-body drift coverage scope.** The drift script also covers the dormant Provocator lane agents and Custos agent if they remain on disk; the dormant agents are no longer in the active workflow, so reported drift on those files is informational only. Editing the active agent files post-deploy without manually re-syncing from canonical can drift silently; the Codex section drift check still catches Codex-side drift.

**Plugin cache.** The plugin cache at `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` is symlinked to `/Users/milovan/projects/Consilium/claude/`. Edits to source under `claude/` are instantly live in the next session — no copy step needed.

**Tribune staleness check.** After editing any tribune file, run:

```bash
python3 claude/scripts/check-tribune-staleness.py              # report
python3 claude/scripts/check-tribune-staleness.py --verbose    # report + unified matches
```

Scans for stale references (banned regex, case-insensitive), broken reference targets (including medusa-dev skills resolved via `~/.claude/plugins/installed_plugins.json` + cache), and test-writing discipline leaks.

**Debugging cases.** Case files live at `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`. Written by the Medicus in `/tribune` Phase 6 before the Imperator gate; read by Legion at intake; promoted to `$CONSILIUM_DOCS/doctrine/known-gaps.md` per `$CONSILIUM_DOCS/CONVENTIONS.md`.

**User-scope agent customizations (machine-switch recovery).** The active user-scope agents carry Consilium-specific body content that lives OUTSIDE this repo at `~/.claude/agents/consilium-*.md`:

- `consilium-tribunus.md` — two-stance `description:` line + Stance Selection body block + Medusa MCP Usage body note (+ Rig fallback rule).
- `consilium-{scout,censor,praetor,provocator,soldier}.md` — Medusa MCP Usage body note (+ Rig fallback rule).

Canonical content for the active agents lives in `$CONSILIUM_DOCS/cases/2026-04-23-tribune-reshape/plan.md` (T3 + T30). On machine switch, re-apply by copying the relevant Task content blocks into the user-scope files and running the staleness + drift checks. The plan documents are the source of truth; the user-scope agent files are the deployment target.

The dormant `consilium-custos.md` and `consilium-provocator-{overconfidence,assumption,failure-mode,edge-case,negative-claim}.md` files (from prior workflows) are not part of active dispatch. The operator may keep them on disk for reference or prune them; the simplified workflow does not require them.

**Agent testing checklist.** See `docs/testing-agents.md` for manual verification procedures after editing agents, personas, or verification templates.

## Remaining Work

- Learning loop: post-run $CONSILIUM_DOCS doctrine updates (deferred)
