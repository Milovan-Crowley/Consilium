# Consul Brief + Estimate-lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Consul Brief and Estimate-lite discipline checkpoints to the Consul SKILL prose, with terse Codex-runtime parity, leaving every other surface untouched.

**Architecture:** Two prose insertions in `claude/skills/consul/SKILL.md` (Phase 1 Brief, Phase 3 Estimate-lite) plus a Phase 1 prose reorder; one terse section in `codex/source/protocols/consul-routing.md` for Codex-runtime parity. Inline tables embedded directly in SKILL.md (no companion doc). No new files. No new agents. No code changes.

**Tech Stack:** Markdown prose. Edit tool for string replacement. Grep + git diff for negative-scope verification.

---

## Decisions on Plan-Level Open Items

The spec deferred six open decisions to the plan author. Resolved here so soldiers and verifiers see the rationale.

|Open decision (spec [§Open Decisions](../spec.md#open-decisions-deferred-to-plan))|Resolution|Reasoning|
|-|-|-|
|1. Insertion point inside SKILL.md|Phase 1: between `**Scope assessment**` and `**Codebase exploration**` (the Brief must precede scout dispatch). Phase 3: between `**In existing codebases:**` and `**I write the spec**` (the Estimate-lite must precede spec write).|Both insertions sit at the natural pre-action gate. The Brief gates scouting; the Estimate-lite gates spec writing.|
|2. Codex-side parity in `codex/source/protocols/consul-routing.md`|Mirror in terse Codex style as a new `## Pre-Dispatch Shaping` section between Consul Routing and Debugging And Tribune Routing.|The discipline applies to the Consul role regardless of runtime. Parity prevents Codex-runtime drift. The Codex section uses Codex's existing terse-bullet style; it does not change dispatch rules.|
|3. Reference in `claude/CLAUDE.md` Architecture section|No.|CLAUDE.md does not enumerate every checkpoint inside a skill — the discipline is owned by SKILL.md. Adding here would slip toward duplication that drifts.|
|4. Inline example block vs external companion doc|Inline tables in SKILL.md prose.|The 9-field Brief table and 6-section Estimate-lite table ARE the canonical shape. External files require explicit invocation; inline keeps the contract load-bearing on first read.|
|5. Section heading naming|"The Consul Brief" and "The Estimate-lite" with definite article.|Matches existing magisterial cadence ("The Spec Discipline Rule", "The Imperator review gate", "The Codex").|
|6. Phase 1 prose reorder|Yes — reorder so Phase 1 reads: Domain knowledge → Scope assessment → The Consul Brief → Codebase exploration → Medusa Rig.|Codebase exploration currently appears before Scope assessment in prose; that ordering is incorrect operationally and the Brief insertion is the natural moment to fix it. The spec's negative scope explicitly preserves Phase 0/2/3 ordering but does not constrain Phase 1.|

---

### Task 1: SKILL.md Phase 1 — reorder + add the Consul Brief

> **Confidence: High** — implements [spec §1 — The Consul Brief](../spec.md#1-the-consul-brief) and [spec §2 — Scout Dispatch Gating](../spec.md#2-scout-dispatch-gating); verified current `claude/skills/consul/SKILL.md` Phase 1 has Codebase exploration before Scope assessment (acknowledged in spec [§Open Decisions](../spec.md#open-decisions-deferred-to-plan) #6) and that no Brief checkpoint exists.

**Files:**
- Modify: `claude/skills/consul/SKILL.md` (Phase 1 region — `### Phase 1: Reconnaissance` heading through end of `**Medusa Rig during reconnaissance.**` paragraph)

- [ ] **Step 1: Confirm pre-state**

Run from repo root `/Users/milovan/projects/Consilium`:

```bash
grep -n "The Consul Brief" claude/skills/consul/SKILL.md
grep -n "Scout Dispatch Gating" claude/skills/consul/SKILL.md
grep -nE "skipped only when.*all" claude/skills/consul/SKILL.md
```

Expected: zero matches for each command.

Confirm current Phase 1 ordering (Domain knowledge → Codebase exploration → scout-prompt note → Scope assessment → Medusa Rig):

```bash
grep -nE "^\*\*(Domain knowledge|Codebase exploration|The scout carries|Scope assessment|Medusa Rig during reconnaissance)" claude/skills/consul/SKILL.md
```

Expected: those five anchors present in that current order.

- [ ] **Step 2: Replace Phase 1 body via Edit tool**

The Phase 1 body is reordered (Scope assessment moves up before scout dispatch) and the Consul Brief subsection is inserted between Scope assessment and Codebase exploration. Codebase exploration prose is modified to gate scout dispatch on Brief unknowns.

Use the Edit tool on `claude/skills/consul/SKILL.md` with `old_string` and `new_string` exactly as below.

`old_string`:

```
### Phase 1: Reconnaissance

I read the terrain before I speak. Before I ask the Imperator a single question, I must know what I am working with.

**Domain knowledge.** I read `$CONSILIUM_DOCS/doctrine/` files directly. Use `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the domain index, then read the specific doctrine files relevant to the task.

**Codebase exploration.** I dispatch scouts. When I need to verify whether something exists, understand how existing code works, or confirm domain concepts against actual implementation, I dispatch a `consilium-scout` subagent with specific questions and a request for a concise report. My context window belongs to the Imperator, not to file-reading. I read files directly only when reading doctrine from `$CONSILIUM_DOCS/doctrine/`, reading a specific short file the Imperator has pointed at, or loading my own reference files.

**The scout carries the Invocation in its system prompt.** The `consilium-scout` user-scope agent at `/Users/milovan/.claude/agents/consilium-scout.md` has the Invocation baked into its system prompt. I do not paste the oath into the dispatch prompt — the scout already carries it. The scout is defending the wall too; its questions inform the work, and its mistakes would feed MISUNDERSTANDINGs into the spec.

**Scope assessment.** Before I dive into details, I assess whether this is one spec or many. If the Imperator describes multiple independent subsystems, I flag it immediately. I do not refine details of something that needs to be decomposed first. Each sub-project gets its own spec, its own plan, its own march.

**Medusa Rig during reconnaissance.** When the Imperator's idea implicates Medusa work — any backend route/workflow/module, any admin widget, any storefront SDK call, any cross-repo flow — invoke the matching Rig skill(s) via `Skill(skill: "medusa-dev:...")` for my own reasoning AND name them in every scout dispatch prompt so the scout invokes them too. Matching by lane: storefront → `building-storefronts`; admin → `building-admin-dashboard-customizations` + `building-with-medusa`; backend → `building-with-medusa`; cross-repo → `building-storefronts` + `building-with-medusa`. I do not "attach" skills as a durable binding — I invoke per turn and re-name them in every subordinate prompt.
```

`new_string`:

```
### Phase 1: Reconnaissance

I read the terrain before I speak. Before I ask the Imperator a single question, I must know what I am working with.

**Domain knowledge.** I read `$CONSILIUM_DOCS/doctrine/` files directly. Use `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` as the domain index, then read the specific doctrine files relevant to the task.

**Scope assessment.** Before I dive into details, I assess whether this is one spec or many. If the Imperator describes multiple independent subsystems, I flag it immediately. I do not refine details of something that needs to be decomposed first. Each sub-project gets its own spec, its own plan, its own march.

**The Consul Brief.** Before I dispatch any scout, I write a compact Brief — a framing of the work. The Brief gates scouting: scouts dispatch only against named Brief unknowns that materially affect the spec or shorten the critical path.

The Brief carries nine fields, each present, none larger than necessary:

|Field|Contract|
|-|-|
|Goal|One sentence. The work this case is about.|
|Success metric|Observable outcome the Imperator could see, run, or measure when done.|
|Non-goals|What this must not become or expand into.|
|Domain concepts to verify|Concepts whose misunderstanding would poison the spec. Empty if all are already verified in this session.|
|Known constraints|Imperator-stated, doctrine-derived, or technical constraints that bound the design space.|
|Unknowns|Facts I do not yet know that materially affect the spec or critical path. The list that gates scout dispatch.|
|Likely code surfaces|Repos, modules, components, routes, or workflows the work is likely to touch.|
|Scout lanes|Which scout flavors are needed (none / domain / codebase / docs / hybrid). Empty if no scouts will dispatch.|
|Decision gates|Questions that require Imperator or Consul judgment, not scout retrieval.|

The Brief is presented inline in my message thread — visible to the Imperator before the message that dispatches scouts. The Imperator may interject. I do not pause for explicit confirmation; the discipline is transparency, not approval gating. I may amend the Brief mid-session as new facts surface; an amended Brief is presented again before any further scout dispatch. Scouts already in flight are re-judged against the amended Brief — if the unknown a scout was dispatched against has been removed or reframed as a Decision gate, I evaluate the scout's return on relevance and may discard it as no longer load-bearing on the spec.

**Empty fields are valid.** A Brief with zero Unknowns, zero Domain concepts, or zero Scout lanes is acceptable. The framing exercise itself disciplines the spec — Goal, Non-goals, Known constraints, Likely code surfaces, and Decision gates do their work even when retrieval is not needed.

**When the Brief is required.** Default: required before any scout dispatch and required before writing a spec when the work touches more than one module, more than one repo, or names a domain concept I have not just verified in this session.

**When the Brief is skippable.** The Brief may be skipped only when **all** of the following hold:

1. No scout dispatch is anticipated.
2. The work is single-file or single-module scope.
3. Doctrine reads in this session already cover every named domain concept.
4. The success metric is observable in one sentence without further deliberation.

If any one fails, the Brief is required. The four conditions are continuously-evaluated invariants, not a one-time judgment. If any condition ceases to hold mid-spec — scope grows to a second module, a domain concept surfaces that needs verification, the success metric becomes compound — I halt spec writing, write the Brief retroactively, and resume the discipline from the appropriate point.

**Bootstrap.** When the Imperator's initial framing is too vague to articulate a Goal, I may open Phase 2 deliberation first, extract enough clarity, and then write the Brief before scouting. The Brief precedes scout dispatch — not necessarily Phase 2.

**Codebase exploration.** Scouts dispatch only against named Brief unknowns. The dispatch prompt names the unknown and how its resolution materially affects the spec or the critical path. If an unknown cannot be resolved by any available scout — no rank can answer — I escalate the unknown to the Imperator as a Decision gate, not a dispatch. More scouts is not automatically better; a scout that resolves no Brief unknown is not dispatched.

When I dispatch, I dispatch a `consilium-scout` subagent with specific questions and a request for a concise report. My context window belongs to the Imperator, not to file-reading. I read files directly only when reading doctrine from `$CONSILIUM_DOCS/doctrine/`, reading a specific short file the Imperator has pointed at, or loading my own reference files.

**The scout carries the Invocation in its system prompt.** The `consilium-scout` user-scope agent at `/Users/milovan/.claude/agents/consilium-scout.md` has the Invocation baked into its system prompt. I do not paste the oath into the dispatch prompt — the scout already carries it. The scout is defending the wall too; its questions inform the work, and its mistakes would feed MISUNDERSTANDINGs into the spec.

**Medusa Rig during reconnaissance.** When the Imperator's idea implicates Medusa work — any backend route/workflow/module, any admin widget, any storefront SDK call, any cross-repo flow — invoke the matching Rig skill(s) via `Skill(skill: "medusa-dev:...")` for my own reasoning AND name them in every scout dispatch prompt so the scout invokes them too. Matching by lane: storefront → `building-storefronts`; admin → `building-admin-dashboard-customizations` + `building-with-medusa`; backend → `building-with-medusa`; cross-repo → `building-storefronts` + `building-with-medusa`. I do not "attach" skills as a durable binding — I invoke per turn and re-name them in every subordinate prompt.
```

- [ ] **Step 3: Confirm post-state**

Run from repo root:

```bash
grep -n "The Consul Brief" claude/skills/consul/SKILL.md
grep -n "Empty fields are valid" claude/skills/consul/SKILL.md
grep -n "When the Brief is skippable" claude/skills/consul/SKILL.md
grep -n "Scouts dispatch only against named Brief unknowns" claude/skills/consul/SKILL.md
grep -n "Bootstrap\." claude/skills/consul/SKILL.md
```

Expected: each returns at least one matching line in Phase 1.

Confirm new Phase 1 ordering: Domain knowledge → Scope assessment → The Consul Brief → Codebase exploration → scout-prompt note → Medusa Rig.

```bash
grep -nE "^\*\*(Domain knowledge|Scope assessment|The Consul Brief|Codebase exploration|The scout carries|Medusa Rig during reconnaissance)" claude/skills/consul/SKILL.md
```

Expected: lines in that order, with The Consul Brief between Scope assessment and Codebase exploration.

Confirm the four skip conditions are present as a numbered list:

```bash
grep -nE "^[1-4]\. (No scout dispatch|The work is single|Doctrine reads|The success metric)" claude/skills/consul/SKILL.md
```

Expected: four matching lines, one per condition.

- [ ] **Step 4: Commit**

```bash
git add claude/skills/consul/SKILL.md
git commit -m "consul: add Consul Brief checkpoint before scout dispatch"
```

---

### Task 2: SKILL.md Phase 3 — add the Estimate-lite

> **Confidence: High** — implements [spec §3 — The Estimate-lite](../spec.md#3-the-estimate-lite) and [spec §4 — Decomposition Trigger](../spec.md#4-decomposition-trigger); verified current `claude/skills/consul/SKILL.md` Phase 3 has no synthesis step between `**In existing codebases:**` and `**I write the spec**`.

**Files:**
- Modify: `claude/skills/consul/SKILL.md` (Phase 3 region — insertion between `**In existing codebases:**` paragraph and `**I write the spec**` paragraph)

- [ ] **Step 1: Confirm pre-state**

Run from repo root:

```bash
grep -n "The Estimate-lite" claude/skills/consul/SKILL.md
grep -n "Decomposition trigger" claude/skills/consul/SKILL.md
grep -n "Forces is informational" claude/skills/consul/SKILL.md
grep -n "Decision gate, not a routing override" claude/skills/consul/SKILL.md
```

Expected: zero matches for each.

- [ ] **Step 2: Insert Estimate-lite subsection via Edit tool**

The `old_string` is the boundary between "In existing codebases" and "I write the spec"; the `new_string` preserves both anchor paragraphs verbatim and inserts the Estimate-lite block in between.

Use the Edit tool on `claude/skills/consul/SKILL.md`.

`old_string`:

```
**In existing codebases:** I explore the current structure before proposing changes. I follow existing patterns. Where existing code has problems that affect the work, I include targeted improvements — the way a good soldier improves the fortification he is assigned to defend. I do not propose unrelated refactoring.

**I write the spec** to `$CONSILIUM_DOCS/cases/YYYY-MM-DD-<topic>/spec.md` (the Imperator's location preferences override this). I commit it.
```

`new_string`:

```
**In existing codebases:** I explore the current structure before proposing changes. I follow existing patterns. Where existing code has problems that affect the work, I include targeted improvements — the way a good soldier improves the fortification he is assigned to defend. I do not propose unrelated refactoring.

**The Estimate-lite.** Before I write the spec, I produce a six-section synthesis. The Estimate-lite catches multi-campaign scope before it gets baked into a single spec, and forces me to articulate the work's shape before I commit it to prose.

Six sections, each present:

|Section|Contract|
|-|-|
|Intent|What the Imperator is really trying to achieve, and why. One paragraph.|
|Effects|What must change to achieve the Intent, independent of implementation. Behavior, contracts, data shapes at boundaries — not file paths or function names.|
|Terrain|Where the work lands. Repos, modules, existing contracts that constrain the design.|
|Forces|Which dispatch ranks the work will need (scouts, verifier ranks, implementer ranks), with reasoning. Informational only — does not override existing routing rules and does not pick models.|
|Coordination|What can run in parallel. What must sequence. What requires an Imperator gate.|
|Control|Review checkpoints, risk tier as I read it, and any human gates the work needs.|

The Estimate-lite is presented inline in my message thread before the spec is written.

**Forces is informational, not a routing override.** The Forces field documents which ranks I anticipate the work will need. It does not override the dispatch rules in this SKILL or in `codex/source/protocols/consul-routing.md`, and it does not select a model or a reasoning policy. If Forces appears to require a rank that does not exist or a routing change, I name that as a Decision gate, not a routing override.

**When the Estimate-lite is required.** Default: required before I write any spec.

**When the Estimate-lite is skippable.** Skippable only when the Brief was skipped under the tiny / direct exception **and** the work is a single task with no cross-module Coordination question. If the Brief was written, the Estimate-lite is written. The skip linkage is asymmetric by design — Brief-required for any reason (domain concept, cross-module scope, scout dispatch) implies the framing rigor of the Estimate-lite is also load-bearing, even when decomposition risk is low.

**Decomposition trigger.** The Estimate-lite must trigger decomposition when the synthesis shows the request is more than one campaign. A decomposition signal is present when **any** of the following hold:

1. Two or more independent Effects sets share no Terrain.
2. Coordination shows two waves where the second cannot start without an independent Imperator approval gate.
3. Forces names two non-overlapping rank sets that operate on disjoint repos with no contract between them.
4. The Goal cannot be written in one sentence without compounding *independent* outcomes — outcomes that share no domain invariant, module, or anchor. A coupled compound Goal (e.g., "add idempotency to cart-complete and order-create through the same anchor") does not trigger this criterion. The test is semantic, not syntactic.

When a decomposition signal is present, I halt spec writing, announce the signal in the message thread, and ask the Imperator to decompose into separate campaigns or to confirm a single combined campaign with explicit reasoning. I do not unilaterally decompose; the Imperator decides.

When the Imperator confirms a single combined campaign despite the trigger, I record the trigger and the override as an explicit accepted-risk note in the spec — placed in the Confidence Map, the Non-goals section, or as a callout in the spec body, at my judgment. The trail is preserved so downstream verifiers and future readers can see that the trigger was raised and the Imperator overrode it deliberately. I then proceed to spec writing.

**I write the spec** to `$CONSILIUM_DOCS/cases/YYYY-MM-DD-<topic>/spec.md` (the Imperator's location preferences override this). I commit it.
```

- [ ] **Step 3: Confirm post-state**

Run from repo root:

```bash
grep -n "The Estimate-lite" claude/skills/consul/SKILL.md
grep -n "Forces is informational, not a routing override" claude/skills/consul/SKILL.md
grep -n "Decomposition trigger\." claude/skills/consul/SKILL.md
grep -n "When the Estimate-lite is required" claude/skills/consul/SKILL.md
grep -n "When the Estimate-lite is skippable" claude/skills/consul/SKILL.md
```

Expected: each returns at least one matching line.

Confirm the Estimate-lite block appears between "In existing codebases" and "I write the spec":

```bash
grep -nE "^\*\*(In existing codebases|The Estimate-lite|I write the spec)" claude/skills/consul/SKILL.md
```

Expected: three lines in that order.

Confirm the four decomposition criteria are present as a numbered list:

```bash
grep -nE "^[1-4]\. (Two or more independent Effects|Coordination shows two waves|Forces names two non-overlapping|The Goal cannot be written)" claude/skills/consul/SKILL.md
```

Expected: four matching lines, one per criterion.

- [ ] **Step 4: Commit**

```bash
git add claude/skills/consul/SKILL.md
git commit -m "consul: add Estimate-lite synthesis with decomposition trigger"
```

---

### Task 3: Codex parity — add Pre-Dispatch Shaping to consul-routing.md

> **Confidence: Medium** — resolves [spec §Open Decisions](../spec.md#open-decisions-deferred-to-plan) item 2 ("Whether to mirror the discipline into `codex/source/protocols/consul-routing.md`") in the affirmative. Confidence is Medium because the Imperator did not explicitly require parity; mirror is the plan author's judgment to prevent Codex-runtime drift. Verified current `codex/source/protocols/consul-routing.md` has no shaping section between Consul Routing and Debugging And Tribune Routing.

**Files:**
- Modify: `codex/source/protocols/consul-routing.md` (insertion as new `## Pre-Dispatch Shaping` section between the existing `## Consul Routing` block and the `## Debugging And Tribune Routing` heading)

- [ ] **Step 1: Confirm pre-state**

Run from repo root:

```bash
grep -n "Pre-Dispatch Shaping" codex/source/protocols/consul-routing.md
grep -n "compact Brief" codex/source/protocols/consul-routing.md
grep -n "Estimate-lite" codex/source/protocols/consul-routing.md
```

Expected: zero matches for each.

- [ ] **Step 2: Insert Pre-Dispatch Shaping section via Edit tool**

The boundary the edit pivots on is the line containing `## Debugging And Tribune Routing` — the new section is inserted immediately above it.

Use the Edit tool on `codex/source/protocols/consul-routing.md`.

`old_string`:

```
- Use `consilium-legatus` to run an approved plan or explicit build order. Do not micromanage centurions directly when the job is multi-step.

## Debugging And Tribune Routing
```

`new_string`:

```
- Use `consilium-legatus` to run an approved plan or explicit build order. Do not micromanage centurions directly when the job is multi-step.

## Pre-Dispatch Shaping

Write a compact Brief before any retrieval, tracing, or scouting fan-out. Brief fields: Goal, Success metric, Non-goals, Domain concepts to verify, Known constraints, Unknowns, Likely code surfaces, Scout lanes, Decision gates.

Dispatch retrieval, tracing, or scouting only against a named Brief Unknown that materially affects the spec or shortens the critical path. An Unknown that no rank can answer escalates to the user as a Decision gate.

Write a six-section Estimate-lite before writing any spec: Intent, Effects, Terrain, Forces, Coordination, Control. The Forces section is informational synthesis; it does not override the dispatch rules above and does not select a model.

Halt spec writing and ask the user to decompose when the Estimate-lite shows multi-campaign scope. Decomposition signals: independent Effects sets sharing no Terrain; gated Coordination waves; non-overlapping Forces rank sets on disjoint repos; or a Goal that compounds independent outcomes (sharing no invariant, module, or anchor — semantic, not syntactic). If the user confirms a combined campaign despite the trigger, record the trigger and the override in the spec.

Skip Brief and Estimate-lite only when all hold: no scout dispatch anticipated, single-file or single-module scope, doctrine already covers every named domain concept, success metric is observable in one sentence. If any condition ceases to hold mid-spec, halt and write the Brief retroactively.

## Debugging And Tribune Routing
```

- [ ] **Step 3: Confirm post-state**

Run from repo root:

```bash
grep -n "## Pre-Dispatch Shaping" codex/source/protocols/consul-routing.md
grep -n "compact Brief" codex/source/protocols/consul-routing.md
grep -n "six-section Estimate-lite" codex/source/protocols/consul-routing.md
grep -n "decompose" codex/source/protocols/consul-routing.md
grep -n "Skip Brief and Estimate-lite" codex/source/protocols/consul-routing.md
```

Expected: each returns at least one matching line.

Confirm section ordering — Consul Routing → Pre-Dispatch Shaping → Debugging And Tribune Routing:

```bash
grep -nE "^## (Consul Routing|Pre-Dispatch Shaping|Debugging And Tribune Routing)" codex/source/protocols/consul-routing.md
```

Expected: three lines in that order.

- [ ] **Step 4: Commit**

```bash
git add codex/source/protocols/consul-routing.md
git commit -m "codex: mirror Pre-Dispatch Shaping (Brief + Estimate-lite) for Consul"
```

---

### Task 4: Negative-scope verification + Acceptance scenario walkthrough

> **Confidence: High** — implements [spec §5 — Negative Scope (Preservation Contract)](../spec.md#5-negative-scope-preservation-contract) and [spec §Acceptance Test Scenarios](../spec.md#acceptance-test-scenarios). Verification-only task. No edits, no commits — the grep gates and the walkthrough are the post-implementation discipline check before any verifier dispatch.

**Files:**
- No edits.
- Read for walkthrough: `claude/skills/consul/SKILL.md`, `codex/source/protocols/consul-routing.md`.

- [ ] **Step 1: Confirm negative scope — no edits to forbidden surfaces**

Run from repo root. Each command must produce empty output (no diff against `main`):

```bash
git diff main -- claude/skills/edicts/SKILL.md
git diff main -- claude/skills/legion/SKILL.md
git diff main -- claude/skills/march/SKILL.md
git diff main -- claude/skills/references/verification/protocol.md
git diff main -- claude/skills/references/verification/templates/spec-verification.md
git diff main -- claude/skills/references/verification/templates/plan-verification.md
git diff main -- claude/skills/references/verification/templates/campaign-review.md
git diff main -- claude/skills/references/verification/templates/mini-checkit.md
git diff main -- claude/skills/references/verification/templates/tribune-verification.md
git diff main -- claude/CLAUDE.md
git diff main -- claude/skills/consul/visual-companion.md
```

Expected: empty output for every command.

- [ ] **Step 2: Confirm no new agent files created and no agent files modified**

```bash
git diff main --name-only -- claude/agents/ 2>/dev/null
git status --porcelain claude/agents/ 2>/dev/null
```

Expected: empty output for both. (User-scope agent files at `~/.claude/agents/consilium-*.md` are out of repo scope and out of plan scope; no edits to user-scope files are part of this work.)

- [ ] **Step 3: Confirm only the two prose files were modified**

```bash
git diff main --name-only
```

Expected: exactly two paths in output, in any order:
- `claude/skills/consul/SKILL.md`
- `codex/source/protocols/consul-routing.md`

If a third file appears, halt and report — the change has leaked outside the negative-scope contract.

- [ ] **Step 4: Acceptance Scenario A walkthrough — tiny / direct task**

Read `claude/skills/consul/SKILL.md` Phase 1 and Phase 3 with the Scenario A prompt in mind: "Add a `--dry-run` flag to the existing `case-new` script."

Walk the four Brief skip conditions against the scenario:

1. No scout dispatch anticipated? Yes — single-script change; the Consul can read the script directly per the "specific short file the Imperator has pointed at" rule.
2. Single-file or single-module scope? Yes — one script.
3. Doctrine already covers every domain concept? No domain concept is named in the prompt.
4. Success metric observable in one sentence? Yes — "running with `--dry-run` prints intended actions and exits 0 without writing."

All four hold → Brief is skipped. The Estimate-lite skip rule says: skip only when the Brief was skipped under tiny / direct AND the work is a single task with no cross-module Coordination question. Both conditions hold → Estimate-lite is skipped.

Confirm by reading the SKILL prose: the four skip conditions appear as a numbered list under "When the Brief is skippable"; the asymmetric skip linkage appears under "When the Estimate-lite is skippable" and explicitly states the Brief-skipped + single-task path.

If the prose does not support this routing, halt and report the gap. Otherwise, mark the scenario walked.

- [ ] **Step 5: Acceptance Scenario B walkthrough — normal task with one unknown**

Read SKILL.md with the Scenario B prompt in mind: "Let customers rename their saved products."

Walk the conditions:

- Scope assessment: one campaign (rename only).
- Brief required? Yes — saved-product domain concept may need re-verification; cart line-item display surface is unknown. Skip condition 1 (no scout dispatch) fails; skip condition 3 (doctrine already covers domain concepts) may fail depending on session state.
- Brief Unknowns: ≥1 (cart line-item display surface for the renamed saved product).
- Scout dispatch: one scout against the cart line-item unknown, named in the dispatch prompt as the gating Unknown.
- Estimate-lite: required by default rule because the Brief was written.
- Decomposition signal: none — Effects all share saved-product Terrain; no two-wave Coordination; one rank set; Goal is one sentence with one outcome (rename).
- Spec writing proceeds.

Confirm by reading the SKILL prose: "Scouts dispatch only against named Brief unknowns" appears under Codebase exploration; "When the Brief is required" enumerates the cross-module / new-domain-concept conditions; "When the Estimate-lite is required" defaults to required-before-spec.

If the prose does not support this routing, halt and report the gap. Otherwise, mark the scenario walked.

- [ ] **Step 6: Acceptance Scenario C walkthrough — multi-campaign disguised as one**

Read SKILL.md with the Scenario C prompt in mind: "Let customers rename and reorder saved products."

Walk the conditions:

- Scope assessment: surfaces two outcomes (rename, reorder). The Consul may flag this directly at Scope assessment, but the spec contract says the Estimate-lite is the formal trigger.
- Brief required? Yes — multi-feature scope.
- Brief Unknowns: ≥2 (rename UX surface; reorder mechanism).
- Scout dispatches: against each named Unknown.
- Estimate-lite: six sections produced. The Effects section enumerates rename Effects and reorder Effects.
- Decomposition signals fire:
  - Criterion 1 — independent Effects sets sharing only the saved-product table as Terrain. Triggers.
  - Criterion 4 (semantic) — rename and reorder share no domain invariant or anchor (rename mutates display name; reorder mutates sort-order or sequence). Triggers semantically.
- The Consul halts spec writing, announces the signals in the message thread, and asks the Imperator to decompose or confirm.
- If the Imperator confirms a single combined campaign, the Consul records the trigger and the override in the spec — Confidence Map, Non-goals, or callout — at the Consul's judgment.

Confirm by reading the SKILL prose: the four decomposition criteria appear as a numbered list; the halt-and-ask behavior is explicit ("I do not unilaterally decompose; the Imperator decides"); the override-record contract is explicit ("I record the trigger and the override as an explicit accepted-risk note").

If the prose does not support this routing, halt and report the gap. Otherwise, mark the scenario walked.

- [ ] **Step 7: Note any walkthrough findings**

If any walkthrough surfaced a contractual gap (an Acceptance scenario routing the SKILL prose does not actually support), write the gap as a comment in the plan task and halt before any verifier dispatch. If all three walkthroughs route correctly, the plan is ready for the Imperator review gate.

- [ ] **Step 8: No commit**

This task makes no changes — it is a discipline gate before Praetor and Provocator. No `git add`, no `git commit`. Move on to the Imperator review gate.

---

## Implementation Notes for the Soldier

**Tools.** Tasks 1–3 use the Edit tool exclusively. Tasks rely on exact string matching — copy `old_string` and `new_string` blocks verbatim from the plan, including blank lines between paragraphs. The Edit tool fails fast on any whitespace mismatch; that failure is the desired guard.

**Order.** Tasks 1, 2, 3 are independent — they touch different file regions or different files. Run in plan order for clarity. Task 4 depends on 1, 2, 3 being complete (it verifies their post-state).

**Commit hygiene.** Each of Tasks 1, 2, 3 produces exactly one commit. Task 4 produces no commit. The branch should end at three new commits past `main`.

**Cwd.** All `git`, `grep`, and Edit operations run from `/Users/milovan/projects/Consilium`.

**Negative scope discipline.** If at any point during Tasks 1–3 a soldier finds that the contract requires editing a file outside `claude/skills/consul/SKILL.md` or `codex/source/protocols/consul-routing.md`, halt and report. The negative-scope contract is the spec's hardest boundary; any leak is a finding to escalate, not a fix to widen.
