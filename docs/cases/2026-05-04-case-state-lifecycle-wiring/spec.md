# Case-state Lifecycle Wiring

## Goal

Wire the canonical Consilium case-folder lifecycle into the skills that currently bypass it. A single new helper script — `docs/scripts/case-state` — becomes the only locus of `STATUS.md` `status:` field mutation. Five skills (Consul, Edicts, March, Legion, Phalanx) call it at their respective lifecycle events. The silent `routed → closed` bug in March/Legion (which skips `contained` and breaks Tribune's Phase 1 case scan) is corrected as a fold-in.

## Motivation

`docs/CONVENTIONS.md` requires every case folder to carry a `STATUS.md` with frontmatter encoding the case state. Five of the last twelve cases under `docs/cases/` have no `STATUS.md` at all — they were created by hand-mkdir + spec.md write, bypassing the existing `case-new` script.

Recon evidence:
- Tribune is the only skill with explicit STATUS.md create/update directives (`claude/skills/tribune/SKILL.md` lines 136–214).
- Consul, Edicts, Custos, and the execution skills (March/Legion/Phalanx) carry no STATUS-write directives. The Consul SKILL.md writes `spec.md` directly without invoking `case-new`.
- March SKILL.md (lines 138–142) and Legion SKILL.md (lines 403–407) direct `status: closed` after implementation verification. This skips the `contained` state entirely. Tribune's Phase 1 case scan reads `status: contained` — the bug renders all build-path cases invisible to that scan.
- One case (`2026-05-01-team-share-readiness-v1`) carries the field name `closed:` instead of CONVENTIONS-mandated `closed_at:`. Confirmed as a hand-edit bypass of `case-close`.

The fix is small and infrastructural: introduce one helper script with a state-machine-enforcing CLI, wire five skills to call it at well-defined lifecycle events, correct the `closed → contained` bug in passing.

## The `case-state` contract

### CLI

```
case-state <slug> --to <state>
case-state <slug> --validate
```

- `<slug>`: case folder name (e.g., `2026-05-04-case-state-lifecycle-wiring`).
- `--to <state>`: target state. One of CONVENTIONS' eight allowed `status:` values: `draft, approved, routed, contained, closed, rejected, abandoned, referenced`.
- `--validate`: ad-hoc audit. Verifies the case folder exists, contains a `STATUS.md` with all required frontmatter fields, and the `status:` value is one of the eight allowed. Exit 0 on pass, non-zero with stderr message on miss.

### State machine

The script enforces this transition graph. Any transition not listed is rejected with a non-zero exit and stderr message naming current state, target state, and the rule violated.

Forward transitions:
- `draft → approved` (Consul, after Imperator review gate clears)
- `approved → routed` (Edicts, after `plan.md` committed)
- `routed → contained` (March/Legion/Phalanx, after Tribunus verification passes clean)
- `draft → rejected` (manual; allowed but no skill auto-triggers)
- `draft → abandoned` (Tribune 7-day-stale rule per CONVENTIONS; allowed but no skill auto-triggers in this campaign)
- any pre-`closed` state `→ referenced` (manual; for cases promoted to doctrine reference)

Self-transitions:
- `X → X` is a no-op. Exit 0. No file mutation.

Forbidden transitions:
- Skipping forward states (e.g., `draft → routed`, `approved → contained`, `routed → closed`).
- Backward transitions (e.g., `routed → draft`, `contained → routed`).
- Transitions out of `closed` (terminal).

`→ closed` is **refused by `case-state`**. `case-close` owns that path because it carries the retro check and writes the `closed_at:` field. The refusal preserves the retro gate. To close a case, call `case-close` directly.

### Idempotency

`--to <X>` when status already equals `<X>` exits 0 with no file mutation. This supports partial-failure recovery: if a skill crashes after writing its primary artifact but before its state transition, re-running the skill re-calls `case-state`, which no-ops if the state was already advanced manually.

### Field discipline

The script mutates only `status:` in YAML frontmatter. It does not touch `sessions:`, `current_session:`, `closed_at:`, or any other field.

- `case-new` continues to own initial frontmatter creation.
- `case-session` continues to own `sessions:` and `current_session:` updates.
- `case-close` continues to own `status: closed` plus `closed_at:`.
- `case-state` owns every other `status:` transition.

One mutator per field. No overlapping responsibility.

### Error behavior

The script exits non-zero with a stderr message when:
- `<slug>` is not a folder under `$CONSILIUM_DOCS/cases/`.
- `STATUS.md` is missing inside the case folder.
- `--to` value is not one of the eight allowed states.
- The transition is forbidden per the state machine.
- IO/permission error.

Loud failure, idempotent no-op, or successful transition — those are the three outcomes. The script never silently corrects state.

## Skill call-site contracts

| Skill | Event | Action |
|-|-|-|
| Consul | At codification (after slug + target/type/agent decided) | Invoke `case-new <slug> --target ... --type ... --agent ...`. Overwrite the stub `spec.md` with real content. |
| Consul | After Imperator review gate clears | Invoke `case-state <slug> --to approved` |
| Edicts | After `plan.md` committed | Invoke `case-state <slug> --to routed` |
| March / Legion / Phalanx | After Tribunus verification passes clean | Invoke `case-state <slug> --to contained` |

**Location override**: If the Imperator points Consul at an existing case folder, Consul respects that path and skips `case-new`. Consul still calls `case-state --to approved` after the review gate.

**Failure handling**: If any `case-state` invocation exits non-zero, the calling skill halts and surfaces the error to the Imperator. No silent skip. No continuing past a failed transition.

## Bug fold-in: March/Legion `closed → contained`

March SKILL.md (lines 138–142) and Legion SKILL.md (lines 403–407) currently direct writing `status: closed` after implementation verification. This skips the `contained` state and renders Tribune's Phase 1 case scan blind to those cases.

Correction: those directives become `case-state <slug> --to contained`. The `closed` transition only happens via `case-close` (manual ritual, retro-gated).

## Tribune verification

Tribune currently has explicit STATUS.md create/update directives in its SKILL.md (lines 136–214). Plan-task: verify Tribune's STATUS.md creation routes through `case-new`. If Tribune inline-writes the file, fold a one-line fix to call `case-new` instead. Closes a parallel bypass surface.

## Out of scope

- **Fail-closed PostToolUse hook on `docs/cases/*` writes**. Deferred. The `case-state --validate` sub-command provides the seed entry point. Promote to a hook in a follow-on case if the bypass fail-mode recurs.
- **Backfill of the 5 orphan cases without STATUS.md**. Existing-data fix, separate campaign.
- **User-scope agent boilerplate update** (the `~/.claude/agents/consilium-*.md` shared text mentions `case-new` but not `case-state`). Minor doc — defer unless verifier flags.
- **Auto-`rejected` from Consul**. Rejection stays manual.
- **Auto-`abandoned` automation**. Tribune's 7-day-stale rule per CONVENTIONS already encodes the policy; the mechanism is a separate concern.

## Contract Inventory

**EMPTY.**

Reason: no canonical contract surface touched. STATUS.md is a Consilium internal artifact, not a wire shape on a module boundary, API contract on a module boundary, money-path idempotency anchor, `link.create` boundary, workflow ownership claim, or subscriber boundary. The `case-state` CLI is a human- and skill-facing helper, not a canonical contract surface per the Codex's six.

## Success criteria

1. Every new case created through Consul has a `STATUS.md` with all CONVENTIONS-required frontmatter fields and `status: draft`.
2. Every state transition (`draft → approved → routed → contained`) writes a single `status:` mutation through `case-state`. No inline awk in skill bodies.
3. Tribune's Phase 1 case scan surfaces post-implementation cases (`status: contained`) — the population currently invisible due to the `closed` bug.
4. Re-running any skill mid-flow is idempotent (no double-writes, no errors when state already matches target).
5. `case-state --validate <slug>` produces a clean pass/fail signal for ad-hoc audits.

Acknowledged limitation: a manual `mkdir docs/cases/foo/` followed by `cat > spec.md` still produces an orphan case with no STATUS.md. That bypass closes only when the v2 hook lands. The `--validate` sub-command provides the manual audit hook in the meantime.
