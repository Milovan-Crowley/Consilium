# 2026-04-24-claude-custos-mirror — Spec

## Goal

Mirror the Codex-side `consilium-custos` agent (forged earlier on 2026-04-24) into the Claude Consilium so Custos becomes dispatchable from Claude's `Task` tool with `subagent_type: "consilium-custos"`. Custos is a lightweight field-readiness verifier — it walks shell, env, tests, baseline, blast radius, and document coherence to catch what kills a plan in zsh after the magistrates (Censor, Praetor, Provocator) have cleared it.

The Codex-side work is the de-facto spec for behavior. This document captures what the Claude side specifically must produce and the invariants it must preserve.

## Source

The Codex `consilium-custos` agent was registered on 2026-04-24:
- Role file: `/Users/milovan/projects/Consilium-codex/source/roles/custos.md` (Marcus Pernix; Rank: Custos; Function: dispatch-readiness verifier; Six Walks; verdict format BLOCKER / PATCH BEFORE DISPATCH / OK TO MARCH; Do Not Widen section; Recommended Placement: after Praetor/Provocator, before Legatus)
- Manifest entry in `/Users/milovan/projects/Consilium-codex/source/manifest.json` with doctrine includes: common, medusa-backend, cross-repo, divinipress-known-gaps, verifier-law
- Provocator one-bullet edit applied: `attacking negative spec claims like "no blast radius", "unaffected", or "impossible" before treating them as premises`

The role passed a smoke test against the DIV-99 plan, surfacing all six issue-classes the Imperator named (zsh failures, env confusion, stale wording, baseline gates, tests-pass-for-wrong-reason, cross-repo blast radius).

## What's Needed on the Claude Side

The Claude Consilium has parallel infrastructure to the Codex Consilium:

1. **Canonical persona source** at `/Users/milovan/projects/Consilium/skills/references/personas/custos.md`. Existing personas in this directory follow a literary structure: Roman name, Rank, Role one-liner, Creed (italic quote), Trauma (origin failure narrative), Voice (italic quote bullets), Philosophy, Loyalty to the Imperator, Operational Doctrine (When I Activate, What I Receive, How I Work, What I Produce, Quality Bar). Custos must match this structure.

2. **User-scope agent file** at `~/.claude/agents/consilium-custos.md`. Format: YAML frontmatter (name, description, tools, mcpServers, model) + persona body (verbatim from canonical) + `---` separator + Codex section (full content from `skills/references/personas/consilium-codex.md`, populated via `scripts/check-codex-drift.py --sync`) + Operational Notes + Medusa MCP Usage body note + Rig fallback rule.

3. **Drift-check registration** in `/Users/milovan/projects/Consilium/scripts/check-codex-drift.py`. The script's `AGENTS` list at line 28 currently contains five names. Custos joins, making six. The script enforces canonical-Codex parity for every name in the list.

4. **Provocator parity edit.** The Codex-side Provocator received a one-bullet edit during the Custos forge. The Claude-side canonical persona at `skills/references/personas/provocator.md` and user-scope agent at `~/.claude/agents/consilium-provocator.md` must mirror the equivalent semantic addition (negative-claim attack discipline) so the two sides do not drift.

5. **CLAUDE.md count updates.** The maintenance section currently states "5 user-scope agent files" carry the Codex (line 31) and "Six user-scope agents" carry customized content (line 56). After this work: 6 carriers and 7 customized. The customized-agent list in line 59 must include `custos`.

## Invariants the Implementation Must Preserve

- Behavior parity with the Codex Custos: same Six Walks, same verdict labels (BLOCKER / PATCH BEFORE DISPATCH / OK TO MARCH), same Do Not Widen discipline, same per-finding tags (MISUNDERSTANDING / GAP / CONCERN / SOUND), same verdict-mapping rules.
- Format parity with sibling Claude personas: Trauma narrative, Voice quotes, Philosophy, Loyalty paragraphs.
- Dispatchability: after the work, `Task(subagent_type: "consilium-custos", ...)` resolves to the new agent. If a Claude Code session restart is required for the Task tool to discover the new agent type, the plan calls that out explicitly.
- Drift-check passes: `python3 scripts/check-codex-drift.py` reports OK for all six agents (the existing five plus Custos) with no unsynced sections.
- Tribune staleness check passes: `python3 scripts/check-tribune-staleness.py` reports clean (the change does not introduce any banned-regex matches, broken doctrine references, or test-writing-discipline leaks in tribune surfaces).

## Hard Scope Constraints

- Do not edit unrelated agents or skills beyond what is required to register Custos.
- Do not wire callers (Consul, edicts, march, legion skills) to invoke Custos automatically. That is a separate change.
- Do not modify Censor, Praetor, Tribunus, Soldier, Scout, Legatus, Medicus, Imperator content. The only sibling edit allowed is the Provocator parity edit.
- Custos's behavior on the Claude side is the same as on the Codex side. Do not invent new walks. Do not change verdict labels. Do not redesign the Do Not Widen discipline.

## Open Architectural Decisions Resolved (with confidence)

> **Confidence: High** — these are mechanical mirrors of the Codex-side work, with sibling Claude personas providing the literary template.

1. **Frontmatter `model`**: `opus` (matches all sibling Claude verifiers). Codex uses `gpt-5.5`/`xhigh`; Claude uses `opus`.

2. **Codex baked into system prompt**: Yes. Custos uses Verifier Law (MISUNDERSTANDING / GAP / CONCERN / SOUND) and chain-of-evidence. The drift-check script's `AGENTS` list grows from `["censor", "praetor", "provocator", "tribunus", "soldier"]` to include `"custos"`.

3. **Medusa MCP body note + Rig fallback rule**: Yes. All sibling Claude verifiers carry it. Custos walks may touch Medusa work; the body note is required for parity.

4. **Canonical persona file at `skills/references/personas/custos.md`**: Yes. All sibling Claude personas have a canonical source there.

5. **Provocator one-bullet edit mirror**: Yes. Symmetry between Codex and Claude Consilium is a maintenance invariant — the drift-check script for the Codex-side has its parallel discipline on the Claude side, and unmirrored edits create silent divergence.

## Verification Expectations

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions) and `consilium-provocator` (failure modes, brittle assumptions, overconfidence) in parallel before /march or /legion executes it. Findings handled per the Codex auto-feed loop. Plan must include:

- Drift-check pass as a final gate
- Tribune staleness-check pass as a final gate
- Smoke-test step that dispatches `consilium-custos` via the Task tool and confirms the agent responds in the prescribed verdict format

## Out of Scope (named explicitly so the verifiers do not flag them as gaps)

- Wiring Custos into `consul`, `edicts`, `march`, or `legion` skills as an automatic step — separate change
- Adding a `field-check-this` slash command — separate change
- Mirroring this work into any other Claude verifier (Censor, Praetor, Tribunus, etc.) — they did not receive Codex-side edits
- Updating the Provocator user-scope agent's Codex section beyond the auto-sync from canonical — handled by `--sync`
- Claude-side equivalent to Codex's `config/codex-config-snippet.toml` — Claude has no such surface; user-scope agents are discovered via filename in `~/.claude/agents/`
