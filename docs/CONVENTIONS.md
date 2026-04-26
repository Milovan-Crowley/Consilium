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

## Audit Artifacts

A case folder may include `decisions.md` — an append-only audit log for decisions, overrides, and verdicts that affect the case but are not part of `spec.md`, `plan.md`, or `STATUS.md`.

**Required when** any of the following fires for the case:

- Imperator overrides a verifier finding.
- Custos returns a verdict (any of `BLOCKER`, `PATCH BEFORE DISPATCH`, `OK TO MARCH`); both walks logged when re-walk fires.
- Plan modification gate (per the `edicts` skill "Dispatching the Custos" phase) triggers and the Imperator decides.
- Iteration count exceeded by Imperator authority (Codex auto-feed cap of 2 surpassed).
- Any other consequential decision the actor wants preserved separately from the spec/plan substrate.

**Optional when** the case has no overrides, no Custos verdicts, no gate decisions, and no iteration overrides.

**Schema:**

````markdown
---
case: <slug matching the case folder name>
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

## Entry: YYYY-MM-DD — <short title>

**Type:** [decision | override | verdict | revert | other]
**Actor:** [Imperator | Consul | Legatus | Custos | Praetor | Provocator | Censor | Tribunus | Medicus]
**Trigger:** <what surfaced this — e.g., "Custos returned BLOCKER on bash quoting at plan.md task 3 step 2">
**Decision:** <what was decided>
**Rationale:** <why; cite finding text or evidence verbatim where applicable>
**Plan SHA:** <`git rev-parse HEAD:<plan-path>` short SHA at the time of the entry; required for `verdict` and `revert` entries; optional for other types>
````

Entries are appended in chronological order. Old entries are never edited or removed (append-only discipline). A redaction or correction is itself a new entry of type `revert` referencing the prior entry.

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
