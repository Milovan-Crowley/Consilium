# Consul Brief + Estimate-lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:legion` or `consilium:march` to implement this plan task-by-task. The runtime is unified: hand-edit canonical `source/` files only, then run `python3 runtimes/scripts/generate.py`.

**Goal:** Add the Consul Brief and Estimate-lite discipline checkpoints to the Consul role, with Codex-runtime parity, without changing agents, model routing, verifier cadence, `/edicts`, `/legion`, or `/march`.

**Architecture:** Two canonical prose edits:
- `source/skills/claude/consul/SKILL.md` gets the Brief in Phase 1 and the Estimate-lite in Phase 3.
- `source/protocols/consul-routing.md` gets a terse `## Pre-Dispatch Shaping` section.

Generated and compatibility files (`claude/skills`, `codex/source`, `codex/agents`, `generated/*`) are updated only by `runtimes/scripts/generate.py`.

---

## Decisions on Plan-Level Open Items

|Open decision|Resolution|Reasoning|
|-|-|-|
|Insertion point inside Consul SKILL|Phase 1: between `Scope assessment` and `Codebase exploration`. Phase 3: between `In existing codebases` and `I write the spec`.|The Brief gates speculator dispatch. The Estimate-lite gates spec writing.|
|Codex-side parity|Yes, in `source/protocols/consul-routing.md`.|The discipline applies to the Consul role regardless of runtime.|
|Reference in `claude/CLAUDE.md`|No.|Avoid duplicated doctrine that will drift.|
|Examples vs inline contract|Inline field lists only, no external companion doc.|The field lists are small and should be load-bearing on first read.|
|Heading names|`The Consul Brief` and `The Estimate-lite`.|Matches current skill prose style.|
|Phase 1 prose order|Reorder to Domain knowledge -> Scope assessment -> Brief -> Codebase exploration -> Medusa Rig.|Current source places exploration before scope assessment; the Brief makes that order wrong.|

---

## Task 1: Add Brief and Estimate-lite to canonical Consul skill

> **Confidence: High** — implements [spec §1](spec.md#1-the-consul-brief), [spec §2](spec.md#2-speculator-dispatch-gating), [spec §3](spec.md#3-the-estimate-lite), and [spec §4](spec.md#4-decomposition-trigger). Live source has no Brief/Estimate-lite checkpoint and still puts Codebase exploration before Scope assessment.

**Files:**
- Modify: `source/skills/claude/consul/SKILL.md`
- Do not edit generated copies directly.

### Steps

- [ ] **Confirm pre-state**

```bash
rg -n "The Consul Brief|The Estimate-lite|Pre-Dispatch Shaping" source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md
rg -n "^\*\*(Domain knowledge|Codebase exploration|The speculator carries|Scope assessment|Medusa Rig during reconnaissance)" source/skills/claude/consul/SKILL.md
```

Expected: first command returns no hits for the new checkpoints; second command shows the current Phase 1 anchors.

- [ ] **Rewrite Phase 1 order and add the Brief**

In `source/skills/claude/consul/SKILL.md`, rewrite the Phase 1 body so it reads:

1. `Domain knowledge`
2. `Scope assessment`
3. `The Consul Brief`
4. `Codebase exploration`
5. `The speculator carries the Invocation in its system prompt`
6. `Medusa Rig during reconnaissance`

The Brief prose must include:

- It is written before any speculator/retrieval dispatch.
- It is presented inline in the Consul's message thread, visible before dispatch.
- It does not require explicit Imperator approval.
- It may be amended; later dispatches use the amended Brief.
- Empty Unknowns, Domain concepts, or Recon lanes are valid.
- The nine fields: Goal, Success metric, Non-goals, Domain concepts to verify, Known constraints, Unknowns, Likely code surfaces, Recon lanes, Decision gates.
- The four skip conditions, as a numbered list:
  1. no speculator/retrieval dispatch anticipated
  2. single-file or single-module scope
  3. doctrine already covers every named domain concept
  4. success metric observable in one sentence
- The continuous-invariant rule: if any skip condition fails mid-spec, halt spec writing, write the Brief retroactively, and resume from the right point.
- Bootstrap rule: if the initial idea is too vague to articulate a Goal, deliberation may happen first, but the Brief still precedes dispatch.

The Codebase exploration prose must gate dispatch:

- Speculators dispatch only against named Brief Unknowns.
- The dispatch prompt names the Unknown and why it matters.
- If no rank can answer the Unknown, escalate it as a Decision gate.
- More speculators is not automatically better.
- Use `consilium-speculator-primus` language, not the retired Scout vocabulary.

- [ ] **Insert Estimate-lite in Phase 3**

Insert `The Estimate-lite` between `In existing codebases` and `I write the spec`.

The Estimate-lite prose must include:

- Six sections: Intent, Effects, Terrain, Forces, Coordination, Control.
- Forces is informational only: it does not select models, override dispatch rules, or invent ranks.
- Required by default before writing any spec.
- Skippable only when the Brief was skipped under the tiny/direct exception and the work is a single task with no cross-module Coordination question.
- Decomposition triggers:
  1. independent Effects sets share no Terrain
  2. Coordination shows gated waves
  3. Forces names non-overlapping rank sets on disjoint repos with no contract
  4. the Goal compounds independent outcomes with no shared invariant, module, or anchor
- When a trigger fires, halt spec writing and ask the Imperator to decompose or explicitly confirm one combined campaign.
- If the Imperator confirms a combined campaign, record the trigger and override in the spec before proceeding.

- [ ] **Verify canonical Consul skill**

```bash
rg -n "The Consul Brief|When the Brief is skippable|Speculators dispatch only against named Brief Unknowns|The Estimate-lite|Forces is informational|Decomposition trigger" source/skills/claude/consul/SKILL.md
rg -n "consilium-scout|\\bscout\\b|\\bScout\\b|\\bsoldier\\b|\\bSoldier\\b" source/skills/claude/consul/SKILL.md
```

Expected: first command returns hits; second command returns no retired vocabulary in the edited Consul skill.

---

## Task 2: Add Codex Consul routing parity

> **Confidence: High** — implements the spec's Codex parity surface after runtime unification. This is a canonical source edit; generated Codex agent TOMLs are derived later.

**Files:**
- Modify: `source/protocols/consul-routing.md`

### Steps

- [ ] **Insert `## Pre-Dispatch Shaping`**

Insert the section between `## Consul Routing` and `## Debugging And Tribune Routing`.

The section must say:

- Write a compact Brief before retrieval, tracing, or speculator fan-out.
- Brief fields are Goal, Success metric, Non-goals, Domain concepts to verify, Known constraints, Unknowns, Likely code surfaces, Recon lanes, Decision gates.
- Dispatch retrieval/tracing/speculators only against named Brief Unknowns that materially affect the spec or critical path.
- Unknowns no rank can answer become Decision gates for the user.
- Write a six-section Estimate-lite before writing any spec: Intent, Effects, Terrain, Forces, Coordination, Control.
- Forces is informational and does not override routing or model choice.
- Halt spec writing and ask for decomposition when Estimate-lite shows multi-campaign scope.
- Skip Brief and Estimate-lite only under the tiny/direct exception.

- [ ] **Verify routing source**

```bash
rg -n "## Pre-Dispatch Shaping|compact Brief|six-section Estimate-lite|decompose|Skip Brief and Estimate-lite" source/protocols/consul-routing.md
rg -n "^## (Consul Routing|Pre-Dispatch Shaping|Debugging And Tribune Routing)" source/protocols/consul-routing.md
```

Expected: first command returns hits; second command shows the section order.

---

## Task 3: Generate derived runtime surfaces

> **Confidence: High** — runtime unification made `source/` canonical; this task keeps generated surfaces honest.

### Steps

- [ ] **Run generator**

```bash
python3 runtimes/scripts/generate.py
```

Expected:

```text
Generated 16 Codex agents
Generated 14 Claude agents
Generated 13 Claude skills
Synced 4 compatibility paths
```

- [ ] **Confirm expected changed surface set**

```bash
git diff --name-only
```

Expected changed paths should be limited to the case docs plus canonical and generated/compatibility outputs derived from:

- `source/skills/claude/consul/SKILL.md`
- `source/protocols/consul-routing.md`
- `claude/skills/consul/SKILL.md`
- `codex/source/protocols/consul-routing.md`
- `codex/source/skills/claude/consul/SKILL.md`
- `generated/claude/skills/consul/SKILL.md`
- generated/installed-in-repo Codex agent TOMLs that include `protocols/consul-routing.md`

If unrelated doctrine, verifier templates, `/edicts`, `/legion`, `/march`, model config, or agent manifest files changed, halt and report.

---

## Task 4: Verification gates

> **Confidence: High** — proves the change stayed inside runtime-unification rules and did not widen workflow machinery.

Run from repo root:

```bash
python3 runtimes/scripts/check-runtime-parity.py
python3 codex/scripts/check-shared-docs-adoption.py
python3 claude/scripts/check-codex-drift.py
git diff --check
rg -n "consilium-scout|\\bScout\\b|\\bscout\\b|consilium-soldier|\\bSoldier\\b|\\bsoldier\\b" source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md
```

Expected:

- parity checks pass
- shared-docs adoption passes
- drift check delegates to runtime parity and passes
- diff check is clean
- retired Scout/Soldier vocabulary scan returns no hits in the edited canonical surfaces

Optional but recommended before merge:

```bash
/Users/milovan/.local/bin/claude plugin validate /Users/milovan/projects/Consilium/claude
```

---

## Task 5: Acceptance scenario walkthrough

> **Confidence: Medium** — these are transcript behaviors, not unit tests. The walkthrough catches prose gaps before dispatching verifiers.

Walk the three spec scenarios against `source/skills/claude/consul/SKILL.md`:

- **Tiny/direct:** `Add a --dry-run flag to the existing case-new script.` The Consul can skip both artifacts only if all four Brief skip conditions and the Estimate-lite skip condition hold.
- **Normal one-unknown:** `Let customers rename their saved products.` The Consul writes the Brief, dispatches a speculator only against the named Unknown, writes the Estimate-lite, finds no decomposition signal, then writes the spec.
- **Multi-campaign:** `Let customers rename and reorder saved products.` The Consul writes the Brief and Estimate-lite, detects independent Effects, halts spec writing, and asks the Imperator to decompose or explicitly confirm one combined campaign.

If the prose does not support one scenario, patch the canonical source before verifier dispatch. If all three route correctly, the plan is ready for Censor/Praetor/Provocator or direct march approval.

---

## Commit Hygiene

Commit as one coherent runtime-doc/prose change after Tasks 1-5 pass:

```bash
git add docs/cases/2026-04-29-consul-brief-estimate-lite/spec.md docs/cases/2026-04-29-consul-brief-estimate-lite/plan.md source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md claude/skills/consul/SKILL.md codex/source/protocols/consul-routing.md codex/source/skills/claude/consul/SKILL.md generated/claude/skills/consul/SKILL.md generated/codex/agents/consilium-consul.toml codex/agents/consilium-consul.toml
git commit -m "consul: add pre-spec shaping checkpoints"
```

If generation changes additional Codex agent files because the protocol is included elsewhere, include them only after confirming they are derived from `source/protocols/consul-routing.md`.
