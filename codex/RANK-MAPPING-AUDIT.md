# Codex Rank Mapping Audit

Date: 2026-04-29

This note supersedes the old Claude-vs-Codex rank split audit. Consilium now uses one canonical vocabulary from root `source/manifest.json` and generates separate Claude and Codex runtime surfaces from that source.

## Current Mapping

- Reconnaissance:
  - `consilium-speculator-front`
  - `consilium-speculator-back`
  - `consilium-speculator-primus`
- Interpretation and contract judgment:
  - `consilium-interpres-front`
  - `consilium-interpres-back`
  - `consilium-arbiter`
- Execution:
  - `consilium-centurio-front`
  - `consilium-centurio-back`
  - `consilium-centurio-primus`

## Source Boundary

- Root `source/` is canonical.
- Root `generated/codex/` is generated output.
- `codex/source`, `codex/agents`, and `codex/config` are generated compatibility copies.
- Fresh Codex sessions are required after install before relying on new agent registrations.
