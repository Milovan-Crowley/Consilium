# Codex Consilium Shared Docs Adoption Spec

## Purpose

> **Confidence: High** - Claude-side Consilium now resolves `$CONSILIUM_DOCS` through Phase 0 guards, and `INDEX.md` still marks Codex adoption as pending.

Codex-side Consilium must use `/Users/milovan/projects/consilium-docs` as the shared home for operational Consilium docs: case folders, shared doctrine reads, diagnosis packets, and known-gap promotion. The work is split into two pieces so the core Codex agent pack can adopt the shared repo before the separate Tribune debugging skill is brought to Claude-level parity.

## Current State

> **Confidence: High** - Verified against `/Users/milovan/projects/Consilium-codex` and `/Users/milovan/projects/consilium-docs` on 2026-04-24.

- `/Users/milovan/projects/Consilium-codex/source/manifest.json` builds 14 Codex agents from `source/roles/`, `source/doctrine/`, and `source/protocols/`.
- `/Users/milovan/projects/Consilium-codex/scripts/generate_agents.py` bakes those sources into `agents/consilium-*.toml` and writes `config/codex-config-snippet.toml`.
- `/Users/milovan/projects/Consilium-codex/scripts/install-codex-agents.sh` regenerates and installs generated agents into `~/.codex/agents`.
- `/Users/milovan/projects/Consilium-codex/skills/tribune/` is an independently installed Codex skill symlinked into `~/.agents/skills/tribune`.
- `/Users/milovan/projects/Consilium-codex/docs/consilium/` still contains local debugging cases and historical Tribune plans.
- `/Users/milovan/projects/consilium-docs/CONVENTIONS.md` is the identity marker and source of truth for case folders, `STATUS.md`, case state, and Phase 1 contained-case scans.
- `/Users/milovan/projects/consilium-docs/scripts/case-new` creates dated case folders under `$CONSILIUM_DOCS/cases/` and supports `--agent codex`.

## Source-Of-Truth Decision

> **Confidence: Medium** - This is a Consul judgment from live repo shape and the README rule that Codex and Claude should not share prompt source files.

Keep `/Users/milovan/projects/Consilium-codex/source/doctrine/` as Codex prompt-source law for generated agents. Do not delete it and do not replace generated-agent includes with direct reads from `consilium-docs`.

One exception is required: `/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md` must stop carrying duplicated known-gap entries. It remains in the Codex prompt-source tree only as pointer/guard doctrine that instructs agents to resolve `$CONSILIUM_DOCS` and read `$CONSILIUM_DOCS/doctrine/known-gaps.md` at runtime.

The shared docs repo becomes the operational source of truth for:

- case folders and case state
- shared Divinipress domain doctrine used during runtime reasoning
- known-gap reads and promotions
- diagnosis packets and planning artifacts

This preserves the existing boundary: Codex prompt source stays Codex-native, while operational artifacts and shared doctrine live in the shared docs repo.

## Piece 1: Codex Core Shared-Docs Adoption

> **Confidence: High** - The affected core surfaces are verified in `source/`, `agents/`, `scripts/`, `config/`, `README.md`, `evals/README.md`, and installed-agent flow.

Piece 1 updates the Codex agent pack and repo-level validation so Codex core agents know how to resolve and use `$CONSILIUM_DOCS`.

Required behavior:

- Add a Phase 0 `$CONSILIUM_DOCS` resolution law to generated Codex agents, defaulting to `/Users/milovan/projects/consilium-docs`.
- Phase 0 must check all three guard conditions: `$CONSILIUM_DOCS` exists, `$CONSILIUM_DOCS/CONVENTIONS.md` starts with the `consilium-docs CONVENTIONS` marker line, and `$CONSILIUM_DOCS/.migration-in-progress` is absent.
- Require the Phase 0 guard before reading doctrine, reading or writing case files, dispatching Consilium verification, or routing work through shared artifacts.
- Require agents to use an existing dated case folder or create one through `$CONSILIUM_DOCS/scripts/case-new`; core agents must not write flat planning/debugging files directly under `$CONSILIUM_DOCS/cases/`.
- Teach core agents that `source/doctrine/` is baked prompt law, while `$CONSILIUM_DOCS/doctrine/` is runtime shared doctrine.
- Replace `/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md` entry payload with pointer/guard doctrine for `$CONSILIUM_DOCS/doctrine/known-gaps.md`; keep the manifest include only if the file no longer duplicates entries.
- Repoint non-debug planning and case references away from `/Users/milovan/projects/Consilium-codex/docs/consilium/` and toward `$CONSILIUM_DOCS/cases/`. Debug-routing packet and threshold references remain Piece 2-owned.
- Update generated `agents/consilium-*.toml` through `scripts/generate_agents.py`, not by hand.
- Update README, `evals/README.md`, and config/install documentation so a fresh Codex session knows the shared-docs dependency.
- Add or tighten validation that catches stale `docs/consilium`, stale local known-gap paths, malformed `$CONSILIUM_DOCS` instructions, and stale graphify-runtime tokens.
- The graph stale gate must ban exact stale runtime tokens such as `graphify`, `mcp__graphify`, `knowledge graph`, `query_graph`, and `get_neighbors`; it must not ban valid Medusa `query.graph()` or `query.index()` doctrine.

Out of scope for Piece 1:

- Changing `/Users/milovan/projects/Consilium-codex/skills/tribune/`.
- Deleting local historical files under `/Users/milovan/projects/Consilium-codex/docs/consilium/`, unless the plan explicitly moves or archives them.
- Changing Claude-side Consilium, Claude plugin cache, or `~/.claude/agents`.

Piece 1 is complete when:

- `scripts/generate_agents.py` regenerates cleanly.
- `scripts/install-codex-agents.sh` validates generated TOMLs.
- A stale-reference gate passes across `source/`, `agents/`, `scripts/`, `config/`, `README.md`, and `evals/README.md`, with explicit allowance for Piece 2-owned debug-routing parity references until Piece 2 lands.
- After install, the same generated-agent stale gate passes against `~/.codex/agents/consilium-*.toml`.
- `$CONSILIUM_DOCS` resolution failure is explicit and actionable.
- Tribune/debugging eval task updates remain pending for Piece 2, including `evals/tasks/10-18`.
- The docs repo `INDEX.md` marks Codex core adoption complete and Tribune parity pending unless Piece 2 has already landed.

## Piece 2: Codex Tribune Shared-Docs Parity

> **Confidence: High** - `skills/tribune/SKILL.md` currently reads local `references/*.md`, routes by local dispatch rules, and the skill installer validates only the local skill package.

Piece 2 updates the Codex Tribune debugging skill and the core Codex debug-routing surfaces so they use the shared case-folder model and match Claude Tribune behavior at the workflow level.

Required behavior:

- Add Phase 0 `$CONSILIUM_DOCS` resolution to the Tribune skill.
- Run the Phase 0 guard immediately before every invocation of `$CONSILIUM_DOCS/scripts/case-new`; do not rely on `case-new` alone to validate the docs root.
- Replace local reference loading with shared doctrine reads from `$CONSILIUM_DOCS/doctrine/`, including `diagnosis-packet.md`, `fix-thresholds.md`, `known-gaps.md`, `known-gaps-protocol.md`, `lane-classification.md`, and relevant `lane-guides/*.md`.
- Update Phase 1 contained-case scanning to use `$CONSILIUM_DOCS/cases/*/STATUS.md` and match the `CONVENTIONS.md` three-condition scan rule.
- Write new bug diagnosis packets through `$CONSILIUM_DOCS/scripts/case-new <slug> --target <target> --agent codex --type bug`.
- Capture the actual dated case folder returned by `case-new`; do not write to an undated `$CONSILIUM_DOCS/cases/<slug>/` path.
- Update `STATUS.md` state transitions by rewriting YAML frontmatter.
- Update core debug-routing surfaces that carry Tribune behavior, including `source/protocols/consul-routing.md`, `source/protocols/legatus-routing.md`, and `source/roles/tribunus.md`.
- Align Codex diagnosis-packet and threshold language with shared doctrine, including the 14-field packet and the field 14 compatibility gate for cross-repo medium fixes.
- Regenerate and install Codex agents when core debug-routing sources change.
- Preserve the boundary that `consilium-tribunus` verifies diagnosis packets and completed tasks; Tribune remains the debugging workflow skill.
- Update Tribune/debugging evals and skill-install validation so stale local docs paths, undated case paths, old packet shape, and local known-gap paths fail.

Out of scope for Piece 2:

- Rebuilding unrelated core orchestration behavior outside debug-routing parity.
- Changing Claude-side Tribune.
- Changing the shared docs repo conventions unless a verified gap proves the convention itself is wrong.

Piece 2 is complete when:

- `scripts/install-codex-skills.sh --dry-run` validates the skill.
- A Tribune stale-reference gate passes across `skills/tribune/`, installed skill target expectations, and relevant eval tasks.
- A controlled temp-root case creation fixture proves Tribune would create a dated shared case folder with `agent: codex` without polluting the real docs repo.
- The docs repo `INDEX.md` Codex adoption banner can be removed or rewritten only after Piece 1 and Piece 2 both pass.

## Campaign Acceptance

> **Confidence: Medium** - The campaign gates combine live repo checks with the desired migration end state.

The full Codex adoption campaign is complete only when:

- Codex core agents resolve `$CONSILIUM_DOCS` and read shared runtime doctrine from `$CONSILIUM_DOCS/doctrine/`.
- Codex core agents write and reference planning artifacts under `$CONSILIUM_DOCS/cases/`.
- Codex Tribune writes diagnosis packets under `$CONSILIUM_DOCS/cases/`.
- Known-gap reads and promotions use `$CONSILIUM_DOCS/doctrine/known-gaps.md`.
- Local Codex prompt source remains in `/Users/milovan/projects/Consilium-codex/source/`.
- Generated agents, installed agents, and installed skill surfaces pass stale-reference gates.
- Fresh Codex sessions are documented as required after install.
- `/Users/milovan/projects/consilium-docs/INDEX.md` no longer says Codex adoption is pending.

## Verification Strategy

> **Confidence: High** - Verification follows the Consilium spec and plan verification protocol already used by the Claude-side cutover.

- Verify this spec with Censor and Provocator before writing implementation edicts.
- Write and verify the Piece 1 edict before any core adoption implementation.
- Write the Piece 2 edict only after Piece 1 is accepted or explicitly deferred.
- Verify Piece 1 plans with Praetor and Provocator.
- Require every implementation plan to include exact stale-reference gates and fresh-session install checks.
