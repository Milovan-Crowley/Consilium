# Spec Contract Inventory and the Tabularius Rank — Force Contract Enumeration in the Spec, Verify with a Cheap Sonnet

**Status.** Draft for re-verification.
**Date.** 2026-05-01.
**Target.** Consul role, a new Tabularius verifier rank, and the manifest.
**Author.** Publius Auctor (Claude Consul). Revised after Censor + Provocator caught two factual errors and two producer-side gaps; redesigned at Imperator direction to introduce a dedicated cheap-Sonnet rank.

## Summary

Specs systematically commit boundary contracts — wire shapes, API contracts at module boundaries, idempotency anchors, link.create boundaries, workflow ownership claims, subscriber boundaries — without enumerating them. The original 10th-Brief-field design failed on three structural grounds. The Censor-extension counter-design failed on two producer-side grounds. This spec introduces the third design:

- The Spec Discipline Rule subsection in the Consul SKILL.md gains a clause: when the work touches any contract surface, the spec body must contain a **Contract Inventory** section enumerating each, and each entry must resolve to a contract definition in the same spec. The Codex-consumed Consul routing source gains the same operational requirement so Claude and Codex run the same discipline.
- A new rank, **Tabularius** (agent: `consilium-tabularius`, Claude model: sonnet), owns intra-spec contract coverage. It is dispatched by the Consul as a pre-verification pass between self-review and Censor + Provocator dispatch.
- The Tabularius reports findings in the Codex categories using a focused, cheap mission: read spec, enumerate contract surfaces, cross-check Inventory.

The Censor's role file is unchanged. The Provocator is unchanged. The spec-verification template is unchanged. Self-review items 1–5 are unchanged. The new machinery is bounded: one role file, one manifest entry, one prose addition to Consul SKILL.md, one Codex-consumed Consul routing amendment, and one operational template for the new rank.

## Why Not the Brief Field

The original Codex design proposed a 10th Brief field titled "Contract surfaces" with the Censor cross-referencing Brief → Spec. Rejected on three grounds:

1. **Phase mismatch.** The Brief lives in Phase 1 (reconnaissance), before Phase 2 deliberation and Phase 3 codification. Contracts are designed during deliberation and committed in codification. The Brief is amendable, but amendment-as-discipline is churn — the Consul re-states in the wrong artifact what she has already designed in the right one.
2. **Skip-condition hole.** The Brief is skippable under the tiny/direct exception and the Patch fast lane. A tiny single-file change that defines a contract surface escapes Brief-based discipline entirely.
3. **Cross-artifact cross-reference.** The Brief is inline in the message thread, not persisted. To cross-check Brief → Spec, the Censor must receive the Brief in dispatch Context — a new input contract for the verification template.

## Why Not the Censor-Extension

The first counter-design extended the Censor's durable ownership and added a Censor mission step in the spec-verification template. Censor and Provocator both verified that design and caught two producer-side gaps:

1. **Censor procedure missing.** The mission step said "judge whether the spec touches a contract surface" with no signal list. A first-time Censor would run the rule on instinct alone.
2. **Self-review path missing.** Self-review item 5 enforces HOW-vs-WHAT (HOW-leakage); the Inventory rule catches WHAT-omission. Different failure modes. The producer-side enforcement the spec claimed was absent.

The Tabularius design fixes both at the cost of one new low-cost rank: focused mission instead of judgment-by-instinct, producer-side dispatch instead of post-hoc verifier-side coverage.

## Evidence Basis

Repo state, verified directly:

- `source/skills/claude/consul/SKILL.md` Phase 3 carries the Spec Discipline Rule. Line 175 (the "spec carries" paragraph) enumerates all six canonical contract types under "data shapes at module boundaries," "API contracts at module boundaries," and "domain invariants" (idempotency anchors, link.create boundaries, workflow ownership, subscriber boundaries). Line 179 (the carve-outs subsection) repeats four of the six. Line 229 (self-review item 5) lists all six again as "Boundary contracts (wire shapes, API request/response, idempotency anchors, link.create boundaries, workflow ownership, subscriber boundaries)." The canonical home of the six is the Consul SKILL.md, not the right-sized-edicts spec; the Imperator's session prompt was imprecise on this point.
- `source/roles/censor.md` is a 23-line role file. The "You own" list will not be amended in this design.
- `source/skills/claude/references/verification/templates/spec-verification.md` Censor mission has four steps (domain sweep, requirement completeness, internal consistency, confidence-directed scrutiny). The template will not be amended in this design.
- `source/protocols/consul-routing.md` is included by the Codex `consilium-consul` agent through `source/manifest.json`. It is therefore the Codex-consumed surface that must receive the Contract Inventory and Tabularius routing rule.
- `source/manifest.json` is the canonical agent declaration source. New ranks are declared here; `runtimes/scripts/generate.py` renders both Claude and Codex agent files from this manifest. The Codex parallel under `codex/source/skills/claude/...` is auto-synced via the same script (`copy_tree(SOURCE, CODEX_SOURCE)`); no manual Codex edit is required for any change in this campaign.
- `~/.claude/agents/code-navigator.md` is precedent for `model: sonnet` in user-scope agent frontmatter. Cheap-Sonnet ranks are an established pattern.
- The right-sized-edicts spec at `docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md` does not enumerate the canonical six contract types. Earlier drafts of this spec cited it incorrectly; this revision corrects the citation.

## Goals

- The Spec Discipline Rule explicitly requires a Contract Inventory section in any spec that touches a contract surface.
- The same Contract Inventory and Tabularius routing requirement reaches Codex Consul through `source/protocols/consul-routing.md`.
- The Inventory enumerates each surface by canonical type and names the surface with enough specificity that a reader can locate its definition in the spec.
- A new low-cost Tabularius rank owns intra-spec contract coverage and runs as a pre-verification pass.
- The Consul invokes the Tabularius automatically after self-review, before Censor + Provocator dispatch.
- Tabularius findings feed back into the Consul's spec for fix-and-re-Tabularius before formal verification dispatch.
- The Censor, the Provocator, the spec-verification template, and self-review items 1–5 are unchanged.

## Non-Goals

- No 10th Brief field. The original Codex design is rejected on the three structural grounds named in §2.
- No extension of the Censor's durable ownership. The first counter-design is rejected on the two producer-side grounds named in §3.
- No change to Brief skip conditions, Estimate-lite, self-review items 1–5, the Imperator review gate, the edicts skill, the Legion or March skills, or any execution-side discipline.
- No change to the Provocator role file or the Provocator's spec-verification mission.
- No change to `source/skills/claude/references/verification/templates/spec-verification.md`.
- No change to `source/roles/censor.md`.
- No change to `source/protocols/legatus-routing.md`, `source/protocols/plan-format.md`, or any other protocol file. `source/protocols/consul-routing.md` changes only to carry the Codex-consumed Contract Inventory and Tabularius routing rule.
- No standardization of contract shape across types. The spec body defines them per type; the Inventory and the Tabularius enumerate.
- No new self-review item. The Tabularius is a pre-verification dispatch step, not a self-review item.
- No backfill of Inventory sections into existing case specs. The rule applies forward.

## Required Behavior

### 1. The Contract Inventory Rule

The Spec Discipline Rule subsection of the Consul SKILL.md (Phase 3) gains a rule with this content. The same requirement is added to the Codex-consumed Consul routing source (`source/protocols/consul-routing.md`) so Codex Consul applies it without reading the Claude skill body:

> **Contract Inventory.** When the work touches any contract surface — wire shape on a module boundary, API contract at a module boundary, idempotency anchor, link.create boundary, workflow ownership claim, subscriber boundary — the spec body must contain a section titled "Contract Inventory" (or equivalent label permitted by the spec author's judgment) that enumerates each surface. Each entry names the surface with enough specificity that a reader can locate the corresponding contract definition elsewhere in the same spec. The Inventory is a list, not a re-statement of the contracts; the contracts themselves remain in their respective spec sections.

The exact section title is plan-author judgment within the constraint that the section is unambiguously identifiable as the Inventory.

**Empty case.** A spec that touches no contract surface declares an empty Inventory section with a one-line reason ("Inventory: none — work touches no runtime contract surfaces; only Consilium discipline / documentation / configuration"). Declaring the Inventory section even when empty creates an artifact the Tabularius can read and confirm; no missing-Inventory gap is then possible.

### 2. The Tabularius Rank

A new Consilium rank is added.

**Persona.** Marcus Tabularius (rank: Tabularius). Roman record-keeper. Function: independent verifier of intra-spec contract coverage. Creed: *"Every contract gets a name and a home, or it does not exist."*

**Agent name.** `consilium-tabularius`.

**Model.** Claude runtime: `sonnet`. Codex runtime: Tier II when the model-tiering campaign is active (`gpt-5.5`, `reasoning_effort: medium`); otherwise use the manifest default that exists at implementation time and let model-tiering repair it when that campaign lands. Mission is text-scanning and enumeration, not domain reasoning.

**Tools.** The canonical mission needs only Read, Grep, and Glob. The manifest may use the existing `read` tools profile even though that profile carries extra read helpers and default MCP server declarations; the Tabularius role and template must not depend on MCP. No generator work is required merely to create a stripped tool profile.

**Ownership.** The Tabularius owns:
- enumerating contract surfaces named in a spec against the canonical six types
- cross-checking the spec's Contract Inventory section against those surfaces
- reporting Inventory entries without spec definitions as **GAP**
- reporting spec contract definitions without Inventory entries as **GAP**
- confirming an empty Inventory section by checking the spec touches no contract surface

**Voice.** Precise. Mechanical. Allergic to ambiguity. The Tabularius does not opine on design — it counts and matches.

**Output.** Codex finding categories only — `MISUNDERSTANDING`, `GAP`, `CONCERN`, or `SOUND`. Every finding cites the spec section and the Inventory line (or its absence).

### 3. Pre-Verification Dispatch in the Consul Flow

The Consul SKILL.md Phase 3 and the Codex-consumed Consul routing source gain a step between self-review and formal Censor + Provocator dispatch:

> **Pre-verification — Contract Inventory pass.** After self-review, I announce verification once: "Dispatching Tabularius, Censor, and Provocator for verification." The Imperator may say "skip" at this point to bypass all verification. If not skipped, I first dispatch the Tabularius (`consilium-tabularius`) on the spec in the foreground. The Tabularius reads the spec, enumerates contract surfaces against the canonical six, and cross-checks the Inventory. I handle findings per the Codex and the verification protocol §6/§7: **GAP** I fix inline; **CONCERN** I evaluate on merit; **SOUND** I note and proceed; **MISUNDERSTANDING** halts and escalates. Re-dispatch caps at the protocol §7 default (max 2 iterations before escalating to the Imperator). After the Tabularius pass clears, I dispatch Censor + Provocator in parallel.

The Tabularius is mandatory by default unless the Imperator says "skip" at the single verification announcement. No special phrasing is required to bypass the Tabularius alone; "skip" bypasses Tabularius, Censor, and Provocator together.

### 4. The Tabularius Verification Template

A new operational dispatch template is added at `source/skills/claude/references/verification/templates/contract-inventory-verification.md`. It defines:

- When to dispatch (after spec self-review, after the single verification announcement, before Censor + Provocator).
- The single agent dispatched: `consilium-tabularius`, mode `auto`, run in foreground (single dispatch — no parallel sibling at this step).
- Prompt skeleton consuming the standard verification protocol §3 structure.
- Mission steps for the Tabularius: (a) read spec; (b) enumerate contract surfaces named or implied in the spec body, classified by canonical-six type; (c) locate the Inventory section (which may be empty per the rule's empty case); (d) cross-check Inventory entries against contract definitions in the spec, and contract surfaces from step (b) against Inventory entries; (e) emit findings in Codex categories.
- Output format following the standard Codex chain-of-evidence shape.
- Handling rules referencing the verification protocol §6.

The template is the operational contract; the role file is the durable persona. They mirror the existing Censor/Praetor/Provocator pattern.

### 5. The Manifest Entry

`source/manifest.json` gains an agent entry for `consilium-tabularius` with: name, description, role-file path (`roles/tabularius.md`), `tools_profile: read`, Claude runtime surface (`model: sonnet`), and Codex runtime surface. If the model-tiering campaign has landed first, the Codex surface uses Tier II (`model: gpt-5.5`, `reasoning_effort: medium`, read-only sandbox). If it has not landed, this campaign uses the current manifest default and the model-tiering campaign later applies the Tier II value. Generation via `runtimes/scripts/generate.py` produces repo-local generated files for both runtimes.

**Manifest schema admission.** The current `manifest.json` has no precedent for `model: sonnet` in `runtime_surfaces.claude` — every existing entry uses `opus`. The Imperator authorized extending the schema to admit `sonnet` as a permitted Claude-runtime model. The plan applies this admission alongside the new agent entry. Future cheap ranks may reuse the admission without revisiting it.

### 6. Finding Categories (Tabularius)

The Tabularius uses the standard Codex categories:

- **GAP** — Inventory entry without a corresponding spec definition; Inventory missing on a spec that touches a contract surface; or a spec contract definition missing from the Inventory.
- **CONCERN** — the Inventory is present and complete enough to satisfy the rule, but naming, grouping, or section pointers could be clearer.
- **MISUNDERSTANDING** — emitted when the spec misclassifies a canonical-six contract type (e.g., labels a wire shape as a workflow ownership claim, or files a subscriber boundary under idempotency). Halts and escalates to the Imperator per Codex; no auto-fix attempts.
- **SOUND** — Inventory exists, every entry resolves, every contract definition is enumerated; or the spec touches no contracts and the empty Inventory is honest.

### 7. Negative Scope (Preservation Contract)

The following are explicitly out of scope and must be unchanged by any plan that implements this spec:

|Surface|Status|
|-|-|
|Consul Brief discipline (nine fields, skip conditions, ordering, presentation contract)|Unchanged.|
|Estimate-lite (six sections, decomposition trigger, Forces non-routing clause)|Unchanged.|
|Phase 0, Phase 1 reconnaissance, Phase 2 deliberation, Imperator review gate, edicts dispatch|Unchanged.|
|Self-review items 1–5 (placeholder scan, internal consistency, scope check, ambiguity check, Spec Discipline scope check)|Unchanged. The Tabularius is a separate dispatch step, not a self-review item.|
|`source/roles/censor.md`|Unchanged. Censor's durable ownership is not extended.|
|`source/skills/claude/references/verification/templates/spec-verification.md`|Unchanged. Censor + Provocator missions are not amended.|
|`source/roles/provocator.md` and Provocator dispatch missions across all templates|Unchanged.|
|Verification protocol (`source/skills/claude/references/verification/protocol.md`)|Unchanged. The new template references the protocol; the protocol itself is not amended.|
|Plan-verification, campaign-review, mini-checkit, tribune-verification templates|Unchanged.|
|`/edicts`, `/legion`, `/march`, `/tribune`, `/audit`, `/triumph` skill flows|Unchanged.|
|`source/protocols/consul-routing.md`|Changed only to carry Codex Consul's Contract Inventory and Tabularius routing rule.|
|`source/protocols/legatus-routing.md`, `source/protocols/plan-format.md`|Unchanged.|
|All existing dispatch agents (`consilium-{censor,praetor,provocator,tribunus,speculator-*,interpres-*,arbiter,centurio-*,custos,legatus}`)|Unchanged. Only the new `consilium-tabularius` is added.|
|Generated and compatibility surfaces (`generated/*`, `claude/skills`, `codex/source`, `codex/agents`)|Derived from canonical source via `runtimes/scripts/generate.py`. Generation is plan territory; do not hand-edit generated copies.|
|Doctrine files under `$CONSILIUM_DOCS/doctrine/`|Unchanged.|
|Visual companion|Unchanged.|

## Contract Inventory

This spec touches Consilium runtime manifest and dispatcher contracts, but no Divinipress product runtime contracts. The canonical-six list stays scoped to feature specs, yet this spec itself changes the agent manifest contract and Consul dispatch contract. Those are Consilium runtime contracts and are inventoried here rather than hidden under an empty declaration.

- **Manifest agent entry contract:** `source/manifest.json` must declare `consilium-tabularius` with role file `roles/tabularius.md`, `tools_profile: read`, Claude `runtime_surfaces.claude.model: sonnet`, and Codex read-only runtime metadata. If model-tiering has landed, Codex uses Tier II (`gpt-5.5`, `reasoning_effort: medium`).
- **Dispatch ordering contract:** Consul announces verification once after self-review; `skip` at that point bypasses Tabularius, Censor, and Provocator together. If not skipped, Tabularius runs foreground before Censor + Provocator.
- **Coverage finding contract:** missing Inventory, orphan Inventory entry, and defined contract missing from Inventory are all Tabularius **GAP** findings.
- **Generation/install contract:** `runtimes/scripts/generate.py` creates repo-local generated and compatibility outputs; installing/syncing user-scope runtime files and checking installed parity are separate implementation steps.
- **Codex parity contract:** `source/protocols/consul-routing.md` carries the Codex-consumed Contract Inventory and Tabularius routing rule.

This declaration avoids the earlier semantic stretch: documentation prose is not a Divinipress feature wire contract, but the Consilium manifest and dispatch behavior are real runtime contracts for this repository.

## Confidence Map

|Section|Confidence|Evidence|
|-|-|-|
|Counter-design choice (Tabularius rank over Censor extension)|High|Imperator agreed in deliberation after both verifiers caught two producer-side gaps in the Censor-extension design. Direct quote: "I agree." Earlier counter-design (Inventory in spec, Censor extension) was rejected for the gaps named in §3.|
|Canonical six contract types canonical home|High|Direct read of `source/skills/claude/consul/SKILL.md` lines 175 and 229 — both enumerate the same six. Earlier draft cited right-sized-edicts §4.2; that citation is corrected here. The carve-outs at line 179 lists four of the six.|
|Tabularius dispatch position (post-self-review, pre-verification)|High|Required to fix the producer-side gap the Provocator caught. Self-review items 1–5 stay unchanged; the Tabularius is a separate dispatch step, not a sixth self-review item.|
|Cheap-Sonnet model choice (Claude side)|High|Imperator authorized the manifest schema admission for `sonnet` in §5. `~/.claude/agents/code-navigator.md` is the hand-written Sonnet precedent; the schema admission carries Sonnet into the manifest-emitted ranks. The plan applies the admission alongside the Tabularius entry.|
|Tools profile|High|Current generator exposes named tool profiles; the `read` profile is sufficient and avoids generator work. The role/template constrain the mission to Read/Grep/Glob-style inspection and do not depend on MCP.|
|Persona name "Marcus Tabularius"|Low|Naming aesthetic is the Imperator's call. The rank "Tabularius" is correct (Roman record-keeper); the praenomen is suggestive only.|
|Manifest entry shape|Medium|Mirrors existing agent declaration shape per `runtimes/scripts/generate.py` rendering logic. Exact field set is plan territory.|
|Codex parity via `runtimes/scripts/generate.py`|High|The script's `sync_compatibility_copies` and `copy_tree(SOURCE, CODEX_SOURCE)` keep `codex/source/` synchronized with `source/`. Adding the rank to the manifest propagates automatically.|
|Verification template path under `source/skills/claude/references/verification/templates/`|High|Existing templates live in this directory; the new template follows the convention.|
|Self-review item 5 stays unchanged|High|Required by Non-Goals. Item 5 is HOW-vs-WHAT scope check; the Tabularius is WHAT-omission check at a different phase; they coexist without modification.|
|Censor and spec-verification template unchanged|High|Required by Non-Goals. The redesign explicitly moves the enforcement to the Tabularius rank.|
|Tabularius finding severity|High|The Inventory rule is mandatory. Missing Inventory, orphan Inventory entries, and spec contract definitions missing from Inventory are all GAPs; CONCERN is reserved for clarity improvements after coverage is complete.|
|Empty Inventory case requires explicit declaration|Medium|Earlier draft permitted the spec to omit an empty Inventory entirely; this revision requires an explicit empty-Inventory section to give the Tabularius an artifact to confirm. Without this, the Tabularius would face the same procedural gap that killed the Censor-extension design.|

## Success Criteria

- After implementation, the Consul SKILL.md Phase 3 Spec Discipline Rule subsection contains the Contract Inventory rule from §1.
- After implementation, the Consul SKILL.md Phase 3 contains a Pre-verification Tabularius dispatch step from §3.
- After implementation, `source/protocols/consul-routing.md` contains the Codex-consumed Contract Inventory rule and Pre-verification Tabularius dispatch step from §1 and §3.
- After implementation, `source/roles/tabularius.md` contains the Tabularius persona from §2.
- After implementation, `source/manifest.json` contains an agent entry for `consilium-tabularius` from §5.
- After implementation, `source/skills/claude/references/verification/templates/contract-inventory-verification.md` contains the operational template from §4.
- After running `runtimes/scripts/generate.py`, repo-local generated Claude and Codex agent files for `consilium-tabularius` exist.
- After installation/config sync, `python3 runtimes/scripts/check-runtime-parity.py --installed` exits zero.
- A spec that touches a contract surface and lacks an Inventory section is recognizable as a Tabularius GAP finding.
- A spec with an Inventory entry that points to no defined contract is recognizable as a Tabularius GAP finding.
- A spec with a defined contract that does not appear in the Inventory is recognizable as a Tabularius GAP finding.
- A spec that touches no contracts and declares an empty Inventory is recognizable as a Tabularius SOUND.
- The Brief, Estimate-lite, Imperator review gate, edicts dispatch, all execution skills, the Censor's role and missions, the Provocator's role and missions, and self-review items 1–5 are unchanged.

## Acceptance Test Scenarios

Three scenarios the implementation must satisfy.

**Scenario A — spec touches no contracts.**
Imperator: "Add a TODO comment to the SKILL.md placeholder noting future doctrine work." The spec is documentation-only with no boundary changes. The author writes an empty Inventory section: "none — TODO comment edit, no contract surfaces." The Consul dispatches the Tabularius, which confirms no canonical-six contract surface is touched and returns SOUND. Censor + Provocator follow.

**Scenario B — spec touches contracts, Inventory present and complete.**
Imperator: "Let customers rename their saved products." The spec defines a `display_name` field on the saved-product wire shape, a PATCH `/saved-products/:id` API contract, and a cart line-item subscriber boundary. The Inventory section lists all three with section pointers. The Tabularius cross-checks; SOUND. Censor + Provocator follow.

**Scenario C — spec touches contracts, Inventory missing one.**
Imperator: "Add idempotency to cart-complete and order-create." The spec defines two idempotency anchors but the Inventory lists only one. The Tabularius emits a GAP (Inventory incomplete). The Consul amends the Inventory inline and re-runs the Tabularius pass before proceeding.

## Open Decisions Deferred to Plan

These are HOW questions and belong to the plan author, not this spec:

- Exact prose wording inside Consul SKILL.md (Spec Discipline Rule addition + Pre-verification dispatch step), `source/roles/tabularius.md` (persona body), and `source/manifest.json` (agent entry).
- Exact mission-step phrasing inside the new `contract-inventory-verification.md` template.
- Exact praenomen or full Roman name of the Tabularius persona ("Marcus" is suggestive only; the Imperator may rename — note that renaming the rank cascades to the agent name, role-file path, manifest entry, and template references).
- Exact Codex runtime entry only when model-tiering has not landed first; if it has landed, Tier II is fixed by this spec.
- Whether to add a one-line example next to the Inventory rule in SKILL.md.

## Risks and Guardrails

**Risk: spec authors omit the Inventory entirely (no section, no empty declaration).** Guardrail: the rule requires an Inventory section even when empty. The Tabularius's mission step (c) is "locate the Inventory section"; absence triggers GAP.

**Risk: spec authors stretch contract types into doc/process metaphor.** Guardrail: the canonical six are runtime boundary contracts. The Tabularius mission cross-checks against these types specifically. Documentation-artifact "contracts" do not qualify; the spec under review here demonstrates the empty-case discipline.

**Risk: Tabularius pass becomes a bottleneck.** Guardrail: cheap Sonnet, foreground dispatch, mechanical mission. A typical Inventory check completes in seconds, not minutes. Re-dispatch follows verification protocol §7 (max 2 iterations before escalating to the Imperator) — the same cap that governs Censor + Provocator iteration.

**Risk: the Tabularius rank duplicates the Censor.** Guardrail: missions are disjoint. The Censor verifies domain truth (entities, relationships, state claims); the Tabularius verifies structural enumeration (Inventory ↔ body coverage). The Tabularius does not opine on contract correctness; the Censor does not enumerate Inventory.

**Risk: the new rank expands into a metadata regime.** Guardrail: the Tabularius output is Codex findings, not metadata. The Inventory itself is prose, not a schema. No machine-parseable shape is added to specs.

**Risk: the canonical six list ossifies.** Guardrail: the rule names the canonical six. The Imperator can extend the list in a separate spec when a new contract type emerges. The Tabularius's mission consumes the canonical list as configured at the time of dispatch.

**Risk: the Tabularius is invoked on specs that the Brief skipped under tiny/direct or Patch fast lane, where contracts may still be touched.** Guardrail: the Tabularius pass is gated on the spec, not the Brief. Whenever a spec is written and verification is not skipped at the single post-self-review announcement, the Tabularius is dispatched. The Brief skip-condition hole that killed the original Codex design does not exist here.
