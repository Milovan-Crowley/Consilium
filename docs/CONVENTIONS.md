<!-- consilium-docs CONVENTIONS — do not remove this marker line -->
# Consilium Docs — Conventions

This file is the identity marker for `$CONSILIUM_DOCS` resolution and the authoritative rule doc for case-folder conventions, `STATUS.md` schema, state machine, and collision rules.

## Case Folder Model

Every Consilium planning, diagnosis, or historical reference case lives under `$CONSILIUM_DOCS/cases/`.

Folder names use `YYYY-MM-DD-<slug>`, where the date is the first-session date and the slug is stable for the life of the case.

## Required State File

Every case folder has `STATUS.md`. Its YAML frontmatter is the source of truth for case state.

Required frontmatter fields:

- `status`
- `opened`
- `target`
- `agent`
- `type`
- `sessions`
- `current_session`

Closed cases also set `closed_at`.

Allowed `target` values:

- `divinipress-store`
- `divinipress-backend`
- `consilium`
- `cross-repo`

Allowed `agent` values:

- `claude`
- `codex`
- `both`

Allowed `type` values:

- `feature`
- `bug`
- `infra`
- `idea`

## State Machine

Allowed `status:` values:

- `draft`
- `rejected`
- `approved`
- `routed`
- `contained`
- `closed`
- `referenced`
- `abandoned`

State transitions update the YAML frontmatter in `STATUS.md`.

## Primary Artifacts

Feature, infra, and idea cases use `spec.md` as the primary artifact.

Bug cases use `diagnosis.md` as the primary artifact.

Session 1 implementation plans use `plan.md`.

Later sessions use:

- `session-NN-<topic>-spec.md`
- `session-NN-<topic>-plan.md`

Reference files use `ref-<topic>.md`.

Handoff files use `handoff-NN-to-MM.md`.

Retros use `retro.md`.

## Phase 1 Case Scan

Phase 1 surfaces a case only when all three conditions are true:

1. `STATUS.md` frontmatter has `status: contained`.
2. The case folder was modified within the last 90 days, unless the Imperator invoked `/tribune --scan-all`.
3. No later case has a `Resolves: <slug>` field naming the current case slug.

Draft cases older than 7 days may be marked `abandoned` on first future scan when the Imperator never approved or rejected them.

## Known-Gap Promotion

Known-gap reads and writes go through `$CONSILIUM_DOCS/doctrine/known-gaps.md`.

A promoted known gap must preserve:

- Lane
- Status
- Last verified date
- Symptom signature
- Evidence
- Debug rule
- Route

Known gaps are hypothesis accelerators, not proof. The Medicus must recheck live evidence before relying on a known gap in a diagnosis packet.
