# 2026-04-26-provocator-decompose — Spec

## Goal

> **Confidence: High** — the Imperator approved the five-lane shape, the spec discipline rule, the plausibility threshold, the per-lane trigger-surface differential re-verify, and the four-step in-Consul merge protocol over the deliberation that produced this spec.

Collapse the wall-clock cost of Provocator dispatch by decomposing the monolithic six-pass agent into five parallel adversarial lanes, install a spec-discipline rule that reduces the artifact surface Provocator is asked to attack, and add a differential re-verify mechanism so iteration 2+ of any verification round does only the work the diff justifies.

The current Provocator runs six sequential passes (confidence-map sweep, assumption extraction, failure-mode analysis, edge-case hunting, overconfidence audit, negative-claim attack) on the full artifact, ten to fifteen minutes per dispatch. Each spec or plan edit re-runs the agent end-to-end. The Censor and Praetor are already fast (textual, no Bash). Pain is concentrated in the Provocator. This work attacks that pain on three axes whose effects compound multiplicatively: less surface (spec discipline) × parallel lanes (decomposition) × near-zero iteration-2 work (differential re-verify).

## Source

> **Confidence: High** — every cited path was verified during reconnaissance.

- Provocator persona (canonical): `claude/skills/references/personas/provocator.md` — Spurius Ferox, the Challenger.
- Provocator user-scope agent (deployed): `~/.claude/agents/consilium-provocator.md` — persona + Codex baked into system prompt.
- Verification protocol: `claude/skills/references/verification/protocol.md`.
- Spec verification template: `claude/skills/references/verification/templates/spec-verification.md`.
- Plan verification template: `claude/skills/references/verification/templates/plan-verification.md`.
- Consul SKILL: `claude/skills/consul/SKILL.md` — Phase 3 Codification is where the spec discipline rule slots in.
- Gaius Speculatus (informational reference, not a target): `~/.claude/agents/checkit-gaius-speculatus.md` — second-pass cross-claim auditor in the checkit legion. Pattern was considered and consciously deferred for v1.

PA-A's orders framed two parallel cause classes for Provocator slowness: monolithic structure (Cause A) and over-detailed specs (Cause B). This work addresses both.

## The Five-Lane Shape

> **Confidence: High** — the Imperator confirmed five lanes over a structured pushback against PA-A's four-lane and six-lane options.

The decomposed Provocator is **not one agent with five passes**. It is five lanes, each its own dispatch, fired in parallel. Wall-clock for a single round becomes the time of the longest lane, not the sum of all lanes.

|Lane|Attack surface|Tools|Produces|
|-|-|-|-|
|Overconfidence audit|Assertions and certainty-shaped language ("straightforward", "simple", "unaffected") in the artifact|Read|CONCERN — claims-without-evidence|
|Assumption extraction|Narrative claims about behavior — "the user will…", "the API returns…", "the component receives…"|Read|GAP — unstated premises|
|Failure-mode analysis|Flow descriptions, success paths|Read|GAP — unhandled failures|
|Edge-case hunting|Boundary conditions, state descriptions, data shapes, contracts|Read|GAP — unhandled edges|
|Negative-claim attack|Negative assertions — "no migration", "no breaking changes", "does not route through"|Read + Bash|GAP / SOUND — verified absence claims|

**Confidence-map sweep is not a lane.** It is universal preamble. Every lane reads the artifact's confidence map first and prioritizes high-confidence sections accordingly. Promoting it to its own lane gives a worker that produces no findings of its own — a directive, not a soldier.

**The five-lane shape is portable to plan verification.** The lanes carry both spec-mode and plan-mode prompts, the same way the existing single-Provocator templates differ between `spec-verification.md` and `plan-verification.md`. Plan-mode prompts include the existing plan-side adversarial concerns the original Provocator template carried (execution friction, ordering assumptions, integration gaps, scope leaks).

**Each lane is its own Consilium verification agent.** Each lane carries the Codex (Independence Rule, finding categories, chain of evidence) and a specialized operational doctrine sized to its attack surface. The shared persona ancestor — Spurius Ferox — is preserved across the lanes; the lanes are five tactical disciplines of one fighter, not five separate fighters with separate origin stories.

## Spec Discipline Rule

> **Confidence: High** — the Imperator confirmed the litmus test and the boundary-contract carve-outs.

The Consul writes specs that carry **WHAT and WHY** at the feature level. The plan owns **HOW**. The litmus test:

> **Could two correct implementations of this feature differ on this detail without changing observable behavior or violating a domain invariant?**
> Yes → HOW. Plan.
> No → contract. Spec.

**Spec carries:**

- Feature-level capability — what the system can now do.
- Data shapes **at module boundaries** (the wire shape, not internal types).
- API contracts at module boundaries (request/response shape, status codes, error semantics).
- Domain invariants the work must respect — money-path idempotency anchors, link.create boundaries, workflow ownership, subscriber boundaries.
- Motivation, constraints, non-goals.
- Success criteria — observable outcomes.

**Plan owns:**

- File paths, function names, signatures of internal helpers.
- Library and dependency choices.
- Internal type shapes (anything not on the wire).
- Per-task implementation patterns.
- Per-task definition-of-done.

**The carve-outs.** Boundary contracts — data shapes on the wire, API contracts at module boundaries, idempotency anchors, link.create boundaries — are **spec-level** even though they are concrete enough to look implementation-shaped. They pass the litmus test as contracts: violating them breaks consumers regardless of how cleanly internals are written. Their concreteness is contract, not choice.

**WHAT and WHY across spec and plan, by scope:**

|Component|Spec scope|Plan scope|
|-|-|-|
|WHAT|Feature capability + boundary contracts|Per-task deliverable|
|WHY|Motivation, constraints, invariants, non-goals|Inherits from spec; per-task rationale only when non-obvious|
|Success criteria|Feature-level acceptance (observable)|Per-task definition-of-done|
|HOW|Excluded (this is the discipline rule)|Owned here|

**Effect on the verification machinery.** The Censor's domain-correctness role is unchanged — the new rule is structural, not semantic. The Layer-1 self-review (Consul's own pass before dispatch) gains a scope check: *"does any section contain HOW that belongs in the plan?"* If yes, move it.

## Plausibility Threshold

> **Confidence: High** — the Imperator named edge-case hunting as the prime AI-slop offender; this rule is the response.

The edge-case lane and its cousin failure-mode lane each carry a hard plausibility threshold installed in the lane prompt. An edge or failure mode is raised as a finding **only if at least one of these is true**:

1. It is statable as a **single** user action (not a chain of unlikely events).
2. It is plausibly hit within roughly the first hundred real sessions of the feature.
3. It violates a domain invariant the spec asserts.
4. It is in a class of edges the codebase has historically failed at — per `$CONSILIUM_DOCS/doctrine/known-gaps.md`.

If none — the edge or failure mode is theatrical. The lane **does not raise it**. The Provocator persona's existing "relentless but bounded" discipline is preserved; this rule sharpens it.

**Compound effect with the spec discipline rule.** Edges that drive HOW-shaped responses (defensive try/catch in specific functions, fallback values in specific files) lose their *spec target* under the new spec rule — they belong in plan if anywhere. Half the slop dies on contact with spec discipline. The remainder — truly theatrical edges — gets filtered by the plausibility threshold at the lane.

## Differential Re-Verify

> **Confidence: High** — the Imperator confirmed the per-lane trigger-surface mechanism over PA-A's artifact-diff and evidence-base-diff binary.

**Iteration 1.** Every lane fires fully on the artifact. Each lane's report includes its findings AND a **trigger declaration** — what surface this lane attacks (e.g., for the overconfidence lane: *"I attack assertions and certainty-shaped language; surface keywords include 'straightforward', 'simple', 'unaffected'."*).

**Iteration 2+.** The Consul computes two diffs against the prior iteration:

1. **Artifact diff** — which sections of the spec or plan text changed.
2. **Evidence-base diff** — for findings that cited a codebase file:line, did that file change since prior iteration (mtime or git-hash check).

For each lane, the Consul evaluates: **does either diff intersect this lane's trigger surface?**

- **Neither intersects** → lane fast-paths. No dispatch. The lane's iteration-N report reads: *"No diff in trigger surface; iteration N-1 verdict stands."*
- **Either intersects** → lane re-fires, scoped to changed content. The lane receives the diff plus prior findings; it discards findings on now-deleted content and produces fresh findings on changed content.

**Why both diffs.** Within a single Consul session, the codebase doesn't change and artifact diff is the only signal that matters. Across sessions, the codebase can shift under prior negative-claim verdicts — evidence-base diff catches that gap. Most cases will see the artifact diff fire; the evidence-base diff is the cross-session safety net.

**Effect.** A typical iteration 2 — Imperator edits one paragraph — collapses to a single-lane re-fire, often well under a minute. The other four lanes fast-path with prior verdicts intact.

## Merge Protocol — Four Steps, In-Consul

> **Confidence: High** — the Imperator confirmed in-Consul aggregation over the second-pass-agent option.

The Consul merges the five lane reports via a structured protocol. No second-pass adversarial agent in v1; the lanes are themselves adversarial, and adding another adversarial pass burns wall-clock for unproven value.

1. **Dedup pass.** For each finding from a lane, check whether a near-cognate finding appears in any other lane. If yes, merge with attribution to both lanes — one consolidated finding, two source labels.
2. **Synergy pass.** Two CONCERN findings across lanes that, taken together, point to a single GAP get promoted with reasoning. *"Lane 2 says 'assumption: payment succeeds' (CONCERN). Lane 3 says 'no failure handling for declined card' (CONCERN). Together: GAP — declined-card path is unstated and unhandled."*
3. **Thin-SOUND audit.** Each lane SOUND is checked for chain-of-evidence quality. A SOUND with reasoning thinner than one specific quote plus one specific citation is bounced back to the lane with "show evidence" — not escalated, just re-asked.
4. **Conflict resolution.** Contradictory findings on the same surface are resolved by the Consul on merit, per the existing Codex protocol (`protocol.md` §6 "Conflicting findings between agents"). Unresolvable contradictions escalate to the Imperator.

**Audit visibility.** When the Consul presents the merged summary to the Imperator, each finding carries source-lane attribution; dedups and synergies are visible. The merge is not opaque.

**Future option, deferred.** If observability after this work ships shows the Consul-merge missing real cross-lane synergies, a Gaius-style second-pass agent can be wired in later. The lane reports already carry chain of evidence; an adversarial auditor can read them. The deferral is reversible.

## Sequencing Constraint

> **Confidence: High** — collision identified during reconnaissance against the in-flight `2026-04-26-custos-edicts-wiring` case.

This work touches `claude/skills/references/verification/protocol.md`. The in-flight Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) also touches `protocol.md` (Task 3 — adds a Custos row to the §2 dispatch table). **The Custos case lands first.** This case's edits to `protocol.md` are designed to apply on top of the post-Custos state of the file.

No other file collisions exist between this case and any in-flight case at the time of writing. The Custos case is explicit about not touching `claude/skills/consul/SKILL.md` (their plan §1009, Out of Scope). This case's Spec Discipline Rule edits land in that file safely.

## Out of Scope

> **Confidence: High** — PA-A's brief explicitly excluded these; the Imperator did not contest.

- **Praetor decomposition.** The Praetor is read-only, textual, Bash-less. Pain is real but an order of magnitude smaller than Provocator's. Decompose Provocator first; once observability surfaces from the five-lane shape, decide on Praetor as a separate case. The five-lane template is portable when that decision is made.
- **Codex changes.** Finding categories remain MISUNDERSTANDING / GAP / CONCERN / SOUND. The Independence Rule is unchanged for spec and plan verification. The auto-feed loop is unchanged. The vocabulary is uniform across all lanes.
- **Kimi / principales integration.** Separate case track (in-flight under `2026-04-26-kimi-principales-*`). The five-lane shape is independent of any principales work.
- **Second-pass adversarial agent (Gaius pattern for Provocator).** Deferred — see Merge Protocol.
- **Campaign review changes.** This case scopes to spec verification and plan verification. Post-execution Campaign review continues to use the existing single-Provocator dispatch until a separate case decides whether to mirror the five-lane shape there.

## Success Criteria

> **Confidence: Medium** — the qualitative criteria are firm; the wall-clock estimates are extrapolations from PA-A's brief and will be replaced by real numbers after the first dispatch on a live spec or plan.

Observable outcomes after this work ships:

1. **Single-round wall-clock collapses.** Provocator dispatch drops from ~10–15 min sequential to roughly the longest-lane time. The negative-claim lane is the expected longest, projected at ~3–5 min on a typical spec.
2. **Iteration 2+ wall-clock collapses further.** When the Imperator's edit touches few lanes' trigger surfaces, the round becomes a single-lane re-fire, often under a minute. The other lanes fast-path with prior verdicts intact.
3. **Specs are smaller in the HOW dimension.** A post-deliberation spec for any feature should not contain file paths, function signatures, internal type definitions, library choices, or per-task implementation patterns. Boundary contracts may appear and pass the litmus test.
4. **Edge-case findings filter through the plausibility threshold.** Findings that fail all four criteria are not raised. The Consul should observe a measurable drop in findings of the "what if five unlikely events all happen" class.
5. **Lane reports carry trigger declarations.** Every lane report on iteration 1 includes the trigger surface description used for iteration 2+ differential re-verify.
6. **Merge summary is auditable.** When the Consul presents the merged finding summary, each finding carries source-lane attribution; dedups and synergies are visible to the Imperator without reading the raw lane reports.

---

## Confidence Map (Aggregated)

|Section|Confidence|Anchor|
|-|-|-|
|Goal|High|Imperator approved over deliberation|
|Source|High|Paths verified during reconnaissance|
|Five-lane shape|High|Imperator confirmed five over four/six|
|Spec discipline rule|High|Litmus test + carve-outs confirmed|
|Plausibility threshold|High|Imperator named edge-case as slop offender|
|Differential re-verify|High|Per-lane trigger-surface confirmed|
|Merge protocol|High|In-Consul over second-pass-agent confirmed|
|Sequencing constraint|High|Collision identified by recon|
|Out of scope|High|PA-A explicit, Imperator silent|
|Success criteria|Medium|Wall-clock estimates pending real measurement|
