# Consilium Tightening — Parallel Session Briefing

**Date:** 2026-05-01
**Purpose:** Paste source for parallel `/consul` sessions specing the six tightening campaigns. Each session writes ONE spec. Specs are scope-narrow and compose at implementation time.

---

## The six campaigns

| # | Campaign | Status | Surfaces |
|-|-|-|-|
| 1 | Minimality contract | **Already specced** at `docs/cases/2026-04-29-consilium-minimality-contract/` — needs march, not new spec | source/roles/{centurio-*,tribunus}.md, source/protocols/* |
| 2 | Model tiering | Spec needed | source/manifest.json + role frontmatter |
| 3a | Edicts `**Files:**` write/read contract | Spec needed (precursor for 3b) | source/skills/claude/edicts/* (plan template) |
| 3b | File-ownership hook + marker activation | Spec needed (depends on 3a contract) | hooks/, scripts/, hooks.json |
| 4 | Spec Contract Inventory + Tabularius | Spec needed | source/skills/claude/consul/* (Spec Discipline/Phase 3), source/roles/tabularius.md, source/manifest.json, source/skills/claude/references/verification/templates/contract-inventory-verification.md |
| 5 | Phalanx surfacing | Spec needed | source/skills/claude/consul/* (Estimate-lite), source/skills/claude/edicts/* (plan template) |
| 6 | Sitrep | Spec needed | scripts/consilium-sitrep.py + optional invocation surface |

**Conflict zones (file-overlap, not blocking):**

- `source/skills/claude/consul/*` — touched by #4 (Spec Discipline/Phase 3 + pre-verification dispatch) and #5 (Estimate-lite subsection)
- `source/skills/claude/edicts/*` — touched by #3a (`**Files:**` contract) and #5 (plan template parallel-wave call)
- `source/roles/*.md` — frontmatter touched by #2 (model tiering); bodies touched by #1 (minimality, when marched); new `source/roles/tabularius.md` added by #4
- `source/manifest.json` — touched by #2 (model tiering) and #4 (`consilium-tabularius` entry)

Each spec is narrow-scoped. Centurions merge concurrent edits at implementation time.

---

## Universal session preamble

**Paste this at the top of every parallel `/consul` session, then add the spec-specific block below it.**

```
Concurrent Consilium tightening campaigns being specced in parallel sessions today (2026-05-01):
1. Minimality contract — already specced at docs/cases/2026-04-29-consilium-minimality-contract/, awaiting march. Touches: Centurion + Tribunus + Campaign triad role files.
2. Model tiering — manifest.json + role frontmatter only.
3a. Edicts `**Files:**` write/read contract — Edicts plan format amendment (source/skills/claude/edicts/*).
3b. File-ownership hook + marker activation — hooks/ + scripts/ + hooks.json. Depends on 3a's contract.
4. Spec Contract Inventory + Tabularius — Consul Spec Discipline/Phase 3 requires a persisted Contract Inventory; new `consilium-tabularius` runs the Inventory pass after self-review and before Censor + Provocator. Touches source/skills/claude/consul/*, source/roles/tabularius.md, source/manifest.json, and source/skills/claude/references/verification/templates/contract-inventory-verification.md.
5. Phalanx surfacing — Estimate-lite Coordination subsection + Edicts plan template parallel-wave call. Touches source/skills/claude/consul/* (Estimate-lite) and source/skills/claude/edicts/* (plan template).
6. Sitrep — new script reading session JSONL for context/cost. Touches scripts/consilium-sitrep.py + optional invocation surface.

Other specs may touch overlapping source files. Scope this spec narrowly — describe only the additions/amendments this campaign owns. Do NOT redesign sections or restructure files. The centurion will merge concurrent changes at implementation time.

Reference precedent specs:
- docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md — anti-slop rules, three plan scales, code-selective rule. Hard ban on Action Tier system, Owner field schema, dependency graphs, rollback fields, wave machinery.
- docs/cases/2026-04-29-consilium-runtime-unification/ — source/ canonical tree, generate.py, codex parity. Every spec must respect this proof chain.
- docs/cases/2026-04-29-consilium-minimality-contract/spec.md — eight named smells, T1-T5 closed trigger list.

THIS session writes spec for: <fill in below>
```

---

## Session 2 — Model tiering

```
THIS session writes spec for: Model tiering across the Consilium agent fleet.

Goal: Stop paying Opus 4.7 / GPT-5.5 max tax on agents that don't need it. Tier the manifest so heavy-thinking agents stay on Opus and read-only / mechanical agents drop to Sonnet 4.6 (or Haiku for the simplest checks).

My recommended tiering (from Consul deliberation 2026-05-01):
- Keep Opus 4.7: consul (skill), legatus (skill), censor, provocator, arbiter, centurions
- Drop to Sonnet 4.6: speculator-{back,front,primus}, tribunus, praetor, custos, interpres-{back,front}, `consilium-tabularius` if Campaign 4 lands first, most checkit-*
- Maybe Haiku 4.5: simplest checkit lanes (existence verification, file-path checks)

Decisions to surface: which checkit lanes get Haiku vs Sonnet. Whether centurions stay Opus uniformly or tier by task complexity (probably uniformly — task complexity isn't predictable at dispatch).

Coordination note: Campaign 4 may add `consilium-tabularius` to `source/manifest.json`. Preferred order is Campaign 4 first, then model tiering applies to the 17-entry manifest. If model tiering lands first, Campaign 4 must add Tabularius with the Tier II values and rerun generation/parity.

Codex side: GPT-5.5 max → GPT-5.5 (not max) for the same Sonnet-tier agents.

Surfaces: source/manifest.json (model field per role), regenerate via runtimes/scripts/generate.py, install generated agents to ~/.claude/agents/, parity check via claude/scripts/check-codex-drift.py.

Non-goals: creating agents in the model-tiering campaign, retiring agents, changing tools/MCP profiles. If Campaign 4 has already created Tabularius, tier that existing rank.
```

---

## Session 3a — Edicts `**Files:**` write/read contract

```
THIS session writes spec for: Edicts plan format hardens the per-task `**Files:**` block into the write/read contract.

Goal: Every plan task carries a `**Files:**` block where `Create:` + `Modify:` + `Test:` define the explicit write set, optional `Read:` entries define load-bearing read paths/patterns, and `(none)` marks an empty write set. This is the contract that the file-ownership hook (campaign 3b, parallel session) consumes at runtime to enforce blast-radius discipline.

Why: Right-sized-edicts shipped plans that declare file responsibilities at the campaign level, but the task-level `**Files:**` block is not yet declared as a stable contract surface. Without that contract, a runtime hook can't know whether a write is in-scope.

Scope:
- Plan template keeps the existing `**Files:**` block and recognizes exactly `Create:`, `Modify:`, `Test:`, and `Read:`.
- Write set is the union of `Create:` + `Modify:` + `Test:`. Write categories use explicit paths only — no globs that hide drift. `Read:` may use broader patterns when justified.
- `(none)` is the explicit empty-write-set marker for verification-only or reporting tasks.
- Patch and Feature plans both adopt the contract. Campaign plans inherit it at sub-plan level.
- Praetor's plan-verification doctrine validates the Files-block contract and, when a parallel-safe group exists, verifies disjoint write sets and read-write safety.

Hard non-goals (right-sized-edicts ban):
- NO Owner field schema, NO dependency graph metadata, NO rollback field, NO wave field, NO Action Tier system. This is one tightening inside the existing `**Files:**` block.
- NO new task-level metadata regime. Do not introduce separate raw write/read fields.

Surfaces: source/protocols/plan-format.md, source/skills/claude/edicts/* (plan template + writing instructions), source/skills/claude/references/verification/templates/plan-verification.md, source/roles/praetor.md.

Coordination note: campaign 3b (file-ownership hook) consumes the Files-block write set for runtime enforcement. Campaign 5 (phalanx surfacing) consumes the same write set plus optional `Read:` entries for disjoint-set detection. Both are concurrent specs.
```

---

## Session 3b — File-ownership hook + marker activation

```
THIS session writes spec for: File-ownership hook with marker-file activation.

Goal: Programmatically enforce that centurions only Write/Edit files declared in the active task's Files-block write set. Catches "while I was here, I cleaned up X" drift at execution time, not in post-hoc verification.

Source pattern (worth studying, not copying verbatim): /Users/milovan/projects/Consilium-Runtime-Fork/hooks/nelson_hooks.py — specifically the conflict_radar mechanism and the `.nelson/.active-{SESSION_ID}` marker pattern. All hooks degrade to exit 0 without the marker.

Scope:
- Marker file: `.consilium/.active-march/<campaign-id>` (or similar) created by /march and /legion at start, removed at clean exit. Records active campaign + active task.
- Hook event: PreToolUse:Write|Edit during active marker.
- Hook reads the active task's Files-block write set from the campaign's plan, rejects writes outside it with exit 2 + stderr feedback.
- Reject message names the file, the task, the declared writes, and instructs the centurion to either ask the Imperator before adding or treat the write as out-of-scope cleanup.
- Hook degrades to exit 0 without marker (so quick patches and one-off skill invocations are unaffected).
- Registration in claude/hooks/hooks.json (and Cursor variant).

Depends on: campaign 3a (Files-block write/read contract) — this spec assumes 3a's contract. Reference 3a explicitly: `Create:` + `Modify:` + `Test:` define the write set, optional `Read:` entries define reads, and `(none)` marks an empty write set. If 3a's contract isn't decided yet, name that shape and call it out as a Decision gate.

Surfaces: hooks/ (new hook script in Python or Node — check existing run-hook.cmd polyglot pattern at /Users/milovan/projects/Consilium/claude/hooks/), scripts/ (helpers), claude/hooks/hooks.json (registration), source/skills/claude/{march,legion}/* (marker creation/cleanup).

Hard non-goals:
- NO phase engine, NO Action Tier gating, NO mode-restriction on TaskCreate (those are nelson maximalism, not what we want).
- Hook only enforces the Files-block write-set contract. Single mechanism, single failure mode, single error message.
```

---

## Session 4 — Spec Contract Inventory + Tabularius

```
THIS session writes spec for: Persisted spec Contract Inventory plus a new Tabularius verification rank.

Goal: Specs systematically commit boundary contracts — wire shapes, API contracts, idempotency anchors, link.create boundaries, workflow ownership claims, subscriber boundaries — without enumerating them in the spec artifact. The old 10th-Brief-field design is rejected: the Brief lives too early, can be skipped, and is not the persisted spec surface. The Censor-extension design is also rejected: it bloats Censor and leaves producer-side enumeration weak.

Required design: the Consul Spec Discipline Rule in Phase 3 requires a Contract Inventory section whenever the spec touches any canonical contract surface. The Inventory enumerates each surface and points to the corresponding contract definition in the same spec. Specs with no contract surfaces declare an empty Inventory with a one-line reason.

Scope:
- Consul skill body Phase 3 gets the Contract Inventory rule inside Spec Discipline.
- Consul skill body Phase 3 gets a pre-verification step after self-review and before Censor + Provocator dispatch: dispatch `consilium-tabularius` on the spec, handle findings, then proceed to formal verification.
- New `source/roles/tabularius.md` defines the Tabularius persona and ownership: enumerate canonical-six contract surfaces, cross-check Inventory entries, report GAP/CONCERN/SOUND.
- `source/manifest.json` declares the new `consilium-tabularius` agent.
- Add `source/skills/claude/references/verification/templates/contract-inventory-verification.md` as the operational dispatch template for the Tabularius pass.

Coordination note: Concurrent campaign 5 (phalanx surfacing) also amends source/skills/claude/consul/*. Different Phase 3 subsections (Spec Discipline/pre-verification vs Estimate-lite Coordination). No conflict if implementation keeps edits anchored to those sections.

Surfaces: source/skills/claude/consul/* (Spec Discipline/Phase 3 and pre-verification dispatch), source/roles/tabularius.md, source/manifest.json, source/skills/claude/references/verification/templates/contract-inventory-verification.md.

Hard non-goals: NO 10th Brief field. NO Brief restructure. NO new Brief skip conditions. NO Censor role extension. NO changes to `source/roles/censor.md` or the existing spec-verification template. NO new self-review item; the Tabularius is a separate pre-verification pass.
```

---

## Session 5 — Phalanx surfacing

```
THIS session writes spec for: Surface parallel-wave opportunities at Estimate-lite and Edicts plan-template stages so /phalanx gets invoked when applicable.

Goal: /phalanx is currently invoked rarely because Edicts plans are written sequentially by default. The opportunity for parallel work isn't named anywhere in the deliberation or plan, so nobody notices.

Scope:
- Consul Estimate-lite Coordination section gets a "Parallel waves" subsection: Consul names which task groups can ship in parallel (disjoint writes, no sequential dependencies) vs which are gated. If single task or fully sequential, state that explicitly.
- Edicts plan output, when 2+ tasks have disjoint writes and no sequential dep, explicitly enumerates "Parallel-safe wave: tasks A, B, C" as a narrative observation in the plan header. Not per-task metadata.
- Praetor's plan-verification amended to recognize parallel-safe wave callouts and verify writes-disjointness.
- /phalanx, /legion, /march all updated (lightly) to recognize the wave callout when it exists.

Hard non-goals (right-sized-edicts ban):
- NO per-task `wave:` field. NO topology metadata. NO Action Tier system.
- This is narrative observation in plan prose, NOT a metadata regime. The disjoint-writes check uses 3a's Files-block write set and optional `Read:` entries.

Coordination notes:
- Concurrent campaign 4 (Spec Contract Inventory + Tabularius) also amends source/skills/claude/consul/*. Different Phase 3 subsection (Spec Discipline/pre-verification vs Estimate-lite Coordination). No conflict.
- Concurrent campaign 3a (Edicts `**Files:**` contract) provides the write/read contract this spec consumes for disjoint-set detection. Reference 3a explicitly.

Surfaces: source/skills/claude/consul/* (Estimate-lite Coordination subsection), source/skills/claude/edicts/* (plan template guidance), source/roles/praetor.md (verification amendment), source/skills/claude/{phalanx,legion,march}/* (light recognition).
```

---

## Session 6 — Sitrep

```
THIS session writes spec for: /sitrep script reading the active Claude session JSONL for context-window and cost reporting.

Goal: When running 7+ campaigns in parallel, the Imperator currently has no programmatic view of context utilization, cache hit rate, cumulative cost, or "which session is running long." Add a single script he can invoke that produces a damage report.

Source pattern (worth studying): /Users/milovan/projects/Consilium-Runtime-Fork/scripts/count-tokens.py — extracts exact input_tokens / cache_creation_input_tokens / cache_read_input_tokens / output_tokens from session JSONL files in the Claude Code session log directory.

Scope:
- New script at scripts/consilium-sitrep.py. Pure stdlib if possible.
- Inputs: optional session ID, defaults to most recent. Optional time window.
- Outputs: human-readable terminal report (and optional JSON) showing:
  - Context window utilization (with autoCompactWindow=700000 boundary).
  - Cache hit rate.
  - Cumulative input/output tokens.
  - Estimated cost (Opus rates by default; tier-aware once model tiering ships).
  - Top 5 longest tool calls (or notable).
- Optional invocation: a slash command or skill entry point. Or just a CLI invocation. Decide in deliberation — minimum-viable is "Imperator runs it from a terminal."

Hard non-goals:
- NO automatic enforcement (no hooks). Pure read-only reporting.
- NO new session/state management. Reads existing session JSONL only.
- NO integration with the planned file-ownership hook (campaign 3b). This script is independent.

Coordination notes: independent of all other campaigns. Cost calculation should be aware that model tiering (campaign 2) is in flight; either hardcode Opus rates and note the assumption, or read tiering from manifest.json once shipped.

Surfaces: scripts/consilium-sitrep.py, optional source/skills/claude/<surface> if a slash command is desired.
```

---

## Notes on running these in parallel

1. **Launch order matters slightly.** Session 2 (model tiering) is fastest and independent — start it first. Sessions 4 and 6 are also independent. Session 3a should land its Files-block contract decision before session 3b's spec gets deep into hook contract design (but you can start them within minutes of each other).

2. **Each spec verifies via Censor + Provocator independently.** That's six verification rounds. Doctrine permits this — concurrent specs don't share verification.

3. **Implementation later — likely one Campaign-shaped march** that takes all six approved specs and orders them into a single regenerate-and-install cycle. Or six small Patch marches. Decide at edicts time.

4. **Minimality contract is already specced.** When you have a march session free, dispatch /edicts → /march on `docs/cases/2026-04-29-consilium-minimality-contract/`. No new Consul session for it.
