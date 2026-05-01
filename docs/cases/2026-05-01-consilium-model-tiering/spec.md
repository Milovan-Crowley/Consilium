# Consilium Model Tiering — Spec

**Date:** 2026-05-01
**Status:** Draft (pre-verification)
**Scope:** `source/manifest.json` (Consilium agent fleet), regenerate via `runtimes/scripts/generate.py`, verify via `runtimes/scripts/check-runtime-parity.py`.

## 1. Intent

Tier the per-role model-capability binding in the Consilium manifest so heavy-thinking ranks stay on Opus 4.7 / Codex `gpt-5.5` with `reasoning_effort: xhigh`, and routine verifiers drop to Sonnet 4.6 / Codex `gpt-5.5` with `reasoning_effort: medium`. Reserve a third tier (Haiku 4.5 / Codex `gpt-5.5` with `reasoning_effort: low`) for trivial-check work, unpopulated by Consilium-manifest ranks in this campaign. Reduce subagent dispatch cost without quality regression on senior synthesis surfaces.

## 2. Why

Today every Consilium-manifest agent runs uniformly at maximum capability on both runtimes — Claude `opus` and Codex `gpt-5.5` with `reasoning_effort: "xhigh"`. Heavy thinking is right for ranks that perform adversarial verification, cross-repo contract synthesis, or code writing. It is over-spec'd for ranks that retrieve citations, translate doctrine, verify per-task ordering, or check dispatch readiness. The cost ratio between Opus and Sonnet is roughly 5x per token in typical workflows, which makes uniform Opus a real burn on routine work — with no quality benefit because the routine work is below Opus's capability ceiling.

This campaign extends the *value space* of the existing `model` and `reasoning_effort` fields per rank. It introduces no new fields, no new agents, no new tools, and no runtime task-type tiering. The rank determines the tier; the task does not.

## 3. Hard Non-Goals

- No new agents; no retiring agents.
- No tools or MCP-profile changes.
- No runtime task-type tiering. Model selection at dispatch time based on task content is explicitly forbidden — the rank carries the tier, not the task.
- No new metadata regimes. The `model`, `runtime_surfaces.claude.model`, and `reasoning_effort` fields already exist in the manifest; this campaign extends their value space, it does not add fields, schemas, or lookup tables.
- No changes to `runtimes/scripts/generate.py`. It already pipes both runtimes' model fields and the Codex `reasoning_effort` field unchanged.
- No changes to `runtimes/scripts/check-runtime-parity.py`. Model drift surfaces transitively as byte-difference on generated/installed file comparison; no explicit model-parity check is needed for this campaign's correctness.
- No tiering of `checkit-*` agents. They live outside the Consilium manifest at a separate user-global surface and warrant a follow-up campaign with its own scope.
- No tiering of skill entries (`consilium-consul`, `consilium-legatus`). Skills execute in the parent session; the `claude.model` value on a skill entry is documentation-only and not consumed at dispatch. Skill entries' field values stay at their current settings.

## 4. Tier Definitions (Boundary Contract)

Three named tiers. Each tier binds both runtimes via their own knobs. Intent (capability level) is shared across runtimes; the implementation knobs differ because Claude tiers via model name and Codex tiers via reasoning effort while keeping the model name fixed in this campaign.

| Tier | Intent | Claude `runtime_surfaces.claude.model` | Codex `model` | Codex `reasoning_effort` |
|-|-|-|-|-|
| **I — Heavy synthesis** | deep reasoning, adversarial verification, cross-repo contract synthesis, code writing | `opus` | `gpt-5.5` | `xhigh` |
| **II — Verification / translation** | retrieval-with-citation, doctrine translation, plan ordering, dispatch readiness, per-task verification | `sonnet` | `gpt-5.5` | `medium` |
| **III — Trivial check** | reserved for existence-only verification, file-path resolution. **Unpopulated by Consilium-manifest ranks in this campaign.** | `haiku` | `gpt-5.5` | `low` |

Tier III is defined and reserved. No Consilium-manifest rank lands on it in this campaign. The follow-up `checkit-*` tiering campaign is the natural Tier III client. Future-revisit option: Tier III's Codex side may move to a smaller variant (e.g. `gpt-5.4-mini`) after validation; for this campaign Codex Tier III stays on `gpt-5.5` with `reasoning_effort: low` to avoid introducing an additional model identifier without prior validation.

## 5. Per-Rank Tier Assignment

Of the 16 entries in `source/manifest.json`: 6 stay at Tier I, 8 drop to Tier II, 2 skill entries are out of scope.

### 5.1 Tier I — Heavy synthesis (6 ranks)

| Rank | Justification |
|-|-|
| `consilium-censor` | adversarial spec verification with deep domain reasoning |
| `consilium-provocator` | adversarial failure-mode hunting across spec, plan, and implementation |
| `consilium-arbiter` | cross-repo contract synthesis (frontend ↔ backend) |
| `consilium-centurio-back` | implementation; task complexity unpredictable at dispatch |
| `consilium-centurio-front` | implementation; task complexity unpredictable at dispatch |
| `consilium-centurio-primus` | senior fallback for ambiguous or cross-cutting lanes |

Centurions stay uniformly on Tier I because runtime task-type tiering is a hard non-goal of this campaign — the Legatus does not know at dispatch time whether a centurion's task will be a five-line CSS adjustment or a deep architectural change. Uniform Tier I is the only safe default given that constraint.

### 5.2 Tier II — Verification / translation (8 ranks)

| Rank | Justification |
|-|-|
| `consilium-speculator-primus` | retrieval-with-citation; the Consul (parent session, Opus) is the synthesis quality gate, not the speculator |
| `consilium-speculator-back` | retrieval during execution; ground-truth verification of already-planned work |
| `consilium-speculator-front` | retrieval during execution; ground-truth verification of already-planned work |
| `consilium-tribunus` | per-task verification during execution; mechanical alignment check between task spec and produced code |
| `consilium-praetor` | plan-ordering verification; consistency reasoning over a fixed plan artifact |
| `consilium-custos` | dispatch-readiness verification; shell, env, tests, baseline checks |
| `consilium-interpres-back` | doctrine translation from backend truth; pattern-matching with semantic depth |
| `consilium-interpres-front` | doctrine translation from frontend truth; pattern-matching with semantic depth |

### 5.3 Out of scope — skill entries (2 entries)

| Entry | Reason |
|-|-|
| `consilium-consul` | skill surface; executes in parent session; `claude.model` field is documentation-only and not consumed at dispatch |
| `consilium-legatus` | skill surface; same reasoning |

These entries' field values stay byte-unchanged at their current settings (`opus` on the Claude side, `gpt-5.5` with `reasoning_effort: xhigh` on the Codex side). Tiering would be a no-op semantically because the skill is loaded into the parent conversation rather than dispatched to its own runtime context.

## 6. Acceptance Criteria

After implementation:

1. `source/manifest.json` field values per rank match the tier table at section 4 and the per-rank assignment at section 5 exactly. Specifically: each Tier-I rank carries `runtime_surfaces.claude.model: "opus"` and top-level `model: "gpt-5.5"` with `reasoning_effort: "xhigh"`; each Tier-II rank carries `runtime_surfaces.claude.model: "sonnet"` and top-level `model: "gpt-5.5"` with `reasoning_effort: "medium"`.
2. `python3 runtimes/scripts/generate.py` regenerates without errors, producing updated `~/.claude/agents/*.md`, `~/.codex/agents/*.toml`, `~/.codex/config.toml`, and the regenerated `codex/source/manifest.json` compatibility copy.
3. After install, every regenerated `~/.claude/agents/{rank}.md` file's frontmatter `model:` value matches the rank's tier.
4. After install, every Codex agent file's `model = "..."` and `model_reasoning_effort = "..."` TOML values match the rank's tier.
5. `python3 runtimes/scripts/check-runtime-parity.py --installed` exits zero (parity holds across source → generated → installed).
6. Skill entries (`consilium-consul`, `consilium-legatus`) field values are byte-unchanged from the pre-campaign manifest.
7. No file outside `source/manifest.json` (the source edit), `codex/source/manifest.json` (regenerated compatibility copy), `~/.claude/agents/*.md` (regenerated), `~/.codex/agents/*.toml` (regenerated), and `~/.codex/config.toml` (regenerated registration) changes as a result of this campaign.

## 7. Relationship to Prior Locks

The runtime-unification spec (`docs/cases/2026-04-29-consilium-runtime-unification/spec.md`) §9 lines 232–233 reads:

> "No model downgrade. No verifier-model lowering."

That lock was scoped to the runtime-unification campaign. Its purpose was preventing the unification work from being a Trojan-horse vehicle for downgrades that hadn't been independently reasoned through. The lock is not durable Consilium doctrine; it constrained one campaign so its scope stayed clean.

This campaign is the deliberate, separately-specced revisit of that decision. The reasoning chain is explicit: cost ratio between tiers is real (Opus is roughly 5x Sonnet per token); routine verification work is below Opus's capability ceiling; the Consul (running in the parent session on Opus) remains the synthesis quality gate for spec accuracy; the Censor and Provocator (Tier I, unchanged) remain on Opus to verify spec quality before any plan ships.

The right-sized-edicts spec (`docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md`) §11 line 249 forbids the right-sized-edicts plan from introducing "new model-routing policy" as a side effect. That non-goal is scoped to its parent campaign. This is a separate, properly-scoped campaign whose entire purpose is model-tier policy. Tiering existing field values is not a "new metadata regime" — no new fields, no new schemas, no new lookup tables; the `model` and `reasoning_effort` fields already exist and are already runtime-specific per the runtime-unification manifest contract (§5).

The minimality contract spec (`docs/cases/2026-04-29-consilium-minimality-contract/spec.md`) §Non-Goals line 58 forbids the minimality plan from doing model-routing changes. That non-goal is scoped to its parent campaign. Reconnaissance confirmed zero file overlap between the two campaigns; minimality edits doctrine markdown, this edits the manifest.

## 8. Coordination With Concurrent Campaign 1

Campaign 1 (minimality contract, awaiting march at the time of this spec) edits doctrine markdown files in `source/`. This campaign edits `source/manifest.json`. There is zero file overlap. Both campaigns must run `python3 runtimes/scripts/generate.py` and the parity checker after their edits; whichever campaign lands second regenerates to absorb the first's changes. This is generation-flow coordination, not architectural coupling. No "Centurion will merge at implementation" reconciliation is needed because the touched surfaces do not intersect.

## 9. Risks

- **Quality regression on Tier II.** Sonnet 4.6 may underperform on verification tasks that look mechanical but require subtle code reasoning (e.g. plan-ordering check on a complex dependency graph, or interpres translating a contested doctrine passage). Mitigation: tier assignments are not load-bearing on doctrine, only on cost. The Imperator can ratify per-rank Tier-I overrides at any time by amending this section's table; no doctrinal re-spec is required for individual rank promotions.
- **Spec quality from Sonnet-tier speculator-primus.** Speculator-primus is dispatched by the Consul during Phase 1 reconnaissance; its findings shape spec content. A wrong citation, missed file, or shallow reasoning at the Brief Unknown stage poisons downstream spec quality. Mitigation: the Consul (parent session, Opus) reads speculator reports critically, challenges weak findings, and re-dispatches when reports are insufficient. The Consul's synthesis is the quality gate for spec accuracy, not the speculator's retrieval. If Sonnet retrieval proves insufficient over a sample of campaigns, `consilium-speculator-primus` is the natural first candidate for Tier-I revert.
- **Codex `reasoning_effort: medium` and `low` semantics unverified.** The runtime accepts the values (no enum validator at the manifest layer) but their actual effect on Codex behavior is the rig's contract, not the Consilium's. If `medium` underperforms in practice, the Tier II Codex value can be revised to `high` without re-spec — section 4's table is the boundary contract and amendments to its values are spec-amendments, not new specs.
- **Tier-III future ambiguity.** Defining Tier III without populating it leaves a future decision (`gpt-5.5` + `low` vs `gpt-5.4-mini` or another smaller variant) for the rig to revisit when the first Tier III rank lands. This is intentional — populate-then-decide rather than decide-then-populate. The first Tier III client (likely the `checkit-*` follow-up campaign) inherits the values defined here and may amend the table if validation reveals a better Codex Tier III binding.

## 10. Out of Scope / Follow-up Campaigns

- **`checkit-*` model tiering.** Follow-up campaign, separately scoped. Different surface (user-global skill, not Consilium manifest), different verification posture. Natural Tier III client; some lanes may stay Tier II, some may be Tier III.
- **Validation enforcement on manifest model values.** No enum or schema today; introducing one is a separate hardening campaign. Out of scope here.
- **Reasoning-effort tiering on the Claude side.** Claude has no per-agent reasoning-effort knob in agent frontmatter today. Out of scope; future runtime-feature campaign if such a knob is exposed.
- **Tiering of `consilium-consul` / `consilium-legatus` skill entries.** No-op at the dispatch surface; pursuing it would be cosmetic. Out of scope unless skills gain an independent runtime context.
