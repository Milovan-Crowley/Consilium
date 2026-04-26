# 2026-04-26-provocator-decompose — Spec

## Goal

> **Confidence: Medium** — the direction is the Imperator's confirmed decision, but the iteration-1 framing of "multiplicative" compound was overconfident: the three axes are not orthogonal, and the Provocator caught it. Softened in iteration 2 to "compound."

Collapse the wall-clock cost of Provocator dispatch by decomposing the monolithic six-pass agent into five parallel adversarial lanes, install a spec-discipline rule that reduces the artifact surface Provocator is asked to attack, and add a differential re-verify mechanism so iteration 2+ of any verification round does only the work the diff justifies.

The current Provocator runs six sequential passes (confidence-map sweep, assumption extraction, failure-mode analysis, edge-case hunting, overconfidence audit, negative-claim attack) on the full artifact, ten to fifteen minutes per dispatch. Each spec or plan edit re-runs the agent end-to-end. The Censor and Praetor are already fast (textual, no Bash). Pain is concentrated in the Provocator. This work attacks that pain on three axes that compound: less surface (spec discipline), parallel lanes (decomposition), and near-zero iteration-2 work (differential re-verify).

## Source

> **Confidence: High** — every cited path was verified during reconnaissance.

- Provocator persona (canonical): `claude/skills/references/personas/provocator.md` — Spurius Ferox, the Challenger.
- Provocator user-scope agent (deployed): `~/.claude/agents/consilium-provocator.md` — persona + Codex baked into system prompt.
- Verification protocol: `claude/skills/references/verification/protocol.md`.
- Spec verification template: `claude/skills/references/verification/templates/spec-verification.md`.
- Plan verification template: `claude/skills/references/verification/templates/plan-verification.md`.
- Consul SKILL: `claude/skills/consul/SKILL.md` — Phase 3 Codification is where the spec discipline rule slots in.
- Drift script: `claude/scripts/check-codex-drift.py` — currently hard-codes 6 user-scope agent names; coverage of any new lane agents is an in-scope concern (see Deployment-Model Contract).
- Gaius Speculatus (informational reference, not a target): `~/.claude/agents/checkit-gaius-speculatus.md` — second-pass cross-claim auditor in the checkit legion. Pattern was considered and consciously deferred for v1.

**Pre-existing template drift acknowledgment.** The current `templates/spec-verification.md` enumerates only 5 of the canonical persona's 6 passes (negative-claim attack is omitted from the Provocator mission). The new five-lane templates authored by this work supersede both `spec-verification.md` and `plan-verification.md` and include all attack surfaces; the legacy enumeration drift is resolved in passing rather than fixed in advance.

PA-A's orders framed two parallel cause classes for Provocator slowness: monolithic structure (Cause A) and over-detailed specs (Cause B). This work addresses both.

## The Five-Lane Shape

> **Confidence: Medium** — the five-lane composition itself is High-confidence (Imperator-confirmed); the Aggregation Contract and Deployment-Model Contract added in iteration 2 are field-untested.

The decomposed Provocator is **not one agent with five passes**. It is five lanes, each its own dispatch, fired in parallel. Wall-clock for a single round becomes the time of the longest lane, not the sum of all lanes.

|Lane|Attack surface|Tools|Produces|
|-|-|-|-|
|Overconfidence audit|Assertions and certainty-shaped language ("straightforward", "simple", "unaffected") in the artifact; **also: missing or null confidence map**|Read|CONCERN — claims-without-evidence; GAP — missing confidence map|
|Assumption extraction|Narrative claims about behavior — "the user will…", "the API returns…", "the component receives…"|Read|GAP — unstated premises|
|Failure-mode analysis|Flow descriptions, success paths|Read|GAP — unhandled failures|
|Edge-case hunting|Boundary conditions, state descriptions, data shapes, contracts|Read|GAP — unhandled edges|
|Negative-claim attack|Negative assertions — "no migration", "no breaking changes", "does not route through"|Read + Bash|GAP / SOUND — verified absence claims|

**Confidence-map sweep is not a lane.** It is universal preamble. Every lane reads the artifact's confidence map first and prioritizes high-confidence sections accordingly. The Quality-Bar rule from the Provocator persona — *"if the Consul didn't provide a confidence map, that itself is a finding"* — is owned by the **overconfidence-audit lane** under decomposition.

**Terminology disambiguation.** This spec uses "Provocator lane" or simply "lane" for the decomposition concept. The doctrine file `$CONSILIUM_DOCS/doctrine/known-gaps.md` uses `Lane:` as a product-surface field (medusa-backend / storefront / cross-repo). The two senses are unrelated; downstream agents must not confuse them.

**Each lane is a separate verification dispatch** with its own attack surface and operational doctrine. The shared persona ancestor — Spurius Ferox — is preserved across the lanes; the lanes are five tactical disciplines of one fighter, not five separate fighters with separate origin stories.

### Deployment-Model Contract

The deployment model — whether lanes are five user-scope agent files, one agent invoked five times with different prompts, or another pattern — is a plan-level decision. The spec carries the contract; the plan picks the model.

The plan's chosen deployment model MUST satisfy:

- **Drift coverage.** Every agent file carrying the Codex is registered with `claude/scripts/check-codex-drift.py`'s `AGENTS` list.
- **Dispatch-table accuracy.** `claude/skills/references/verification/protocol.md` §2 names the actual dispatch surface (subagent_types) the Consul invokes.
- **Auditable trigger declarations.** Each lane produces a trigger declaration on iteration 1 (see Differential Re-Verify), regardless of whether the lane is its own agent or a prompt variant.
- **Independence Rule preserved.** Each lane receives only the artifact, doctrine, context summary, and confidence map — never the conversation, never another lane's report.

### Aggregation Contract

In **role-level** wording — the Codex Interaction Protocols, the depth-configuration counts in `protocol.md` §8 ("Spec verification: Censor + Provocator (2 agents)"), the dispatch-table Role column — "Provocator" refers to **the role**, not the agent count. The five lanes are operational decomposition within the Provocator role; the role count does not change.

Trigger declarations and merge attribution are introduced as concepts in **lane operational doctrine** (the lane prompt's mission section) and the **Consul SKILL** (the merge protocol). They are not Codex concepts. The Codex's four-category vocabulary, Independence Rule, chain-of-evidence rule, and auto-feed loop are all unchanged.

This is what "no Codex vocabulary changes" means: the doctrinal floor stays put. The role-level wording stays put. The decomposition lives one layer below — in the Consul's dispatch machinery and the lane's operational prompts.

**The five-lane structure adapts to plan-mode verification with prompt re-tuning.** The existing plan-mode Provocator template carries adversarial concerns specific to plans (execution friction, ordering assumptions, integration gaps, scope leaks). These do not map one-to-one onto the five spec-mode lanes; the plan-mode prompts redistribute these concerns across the lanes (e.g., ordering assumptions → assumption-extraction lane; integration gaps → failure-mode lane). This is **adaptation work, not direct portability** — the plan owns the redistribution.

## Spec Discipline Rule

> **Confidence: High** — the litmus test survived four angles of Provocator attack; the carve-outs match the Imperator's confirmed boundary.

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
|WHY|Motivation, constraints, invariants, non-goals|Cites spec sections by reference (link or section name); does NOT restate spec WHY content. Per-task rationale only when the implementation choice is non-obvious.|
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

**Note on criterion 3.** This criterion fires only for specs that explicitly assert domain invariants — which under the Spec Discipline Rule above includes any boundary contract (wire shapes, idempotency anchors, link.create boundaries, workflow ownership, subscriber boundaries). For specs that assert no invariants — a not-uncommon case for pure-frontend or pure-presentational features — criterion 3 is a no-op, and the lane operates on criteria 1, 2, and 4. This is intended; the threshold is not designed to manufacture invariants where the spec does not declare them.

**Compound effect with the spec discipline rule.** Edges that drive HOW-shaped responses (defensive try/catch in specific functions, fallback values in specific files) lose their *spec target* under the new spec rule — they belong in plan if anywhere. Half the slop dies on contact with spec discipline. The remainder — truly theatrical edges — gets filtered by the plausibility threshold at the lane.

## Differential Re-Verify

> **Confidence: Medium** — the trigger-declaration schema, iteration-1 sanity check, and single-session scope were specified in iteration 2 in response to verifier findings; the mechanism is field-untested.

**Iteration 1.** Every lane fires fully on the artifact. Each lane's report includes its findings AND a **trigger declaration** — a structured object naming the surface the lane attacks.

**Trigger declaration schema:**

```yaml
lane: <lane name>
surface_predicates:
  - keywords: [<word>, <word>, ...]      # surface vocabulary the lane attacks
  - section_patterns: [<regex>, ...]     # heading patterns the lane considers in scope
  - evidence_base: [<file:line>, ...]    # codebase citations the lane's findings rest on (optional)
```

Each lane MUST emit a trigger declaration. A lane that fails to emit one is treated as fires-every-iteration until the declaration is produced (the Consul does not silently fast-path a lane with no declared surface).

**Iteration-1 sanity check.** When iteration 1 returns, the Consul cross-checks each lane's findings against its declared surface. A finding falling outside the lane's declared surface flags the declaration as suspect; the Consul notes the discrepancy, the lane's iteration-2+ fast-path is disabled until the declaration is corrected, and the finding itself is processed normally per merge protocol.

**Iteration 2+.** The Consul computes the **artifact diff** against the prior iteration — which sections of the spec or plan text changed. For each lane, the Consul evaluates: **does the diff intersect the lane's trigger surface?**

- **No intersection** → lane fast-paths. No dispatch. The lane's iteration-N report reads: *"No diff in trigger surface; iteration N-1 verdict stands."*
- **Intersection** → lane re-fires, scoped to changed content. The lane receives the diff plus prior findings; it discards findings on now-deleted content and produces fresh findings on changed content.

**Single-session scope (v1).** Differential re-verify is scoped to a single Consul session. Across sessions, all lanes re-fire from a clean baseline. Cross-session persistence of lane reports is a separate future case if data demands it.

**Effect.** A typical iteration 2 — Imperator edits one paragraph — collapses to a single-lane re-fire, often well under a minute. The other four lanes fast-path with prior verdicts intact.

## Merge Protocol — Four Steps, In-Consul

> **Confidence: Medium** — the failure-handling subsection and the context-exhaustion heuristic were added in iteration 2 in response to verifier findings; field-untested.

The Consul merges the five lane reports via a structured protocol. No second-pass adversarial agent in v1; the lanes are themselves adversarial, and adding another adversarial pass burns wall-clock for unproven value.

1. **Dedup pass.** For each finding from a lane, check whether a near-cognate finding appears in any other lane. If yes, merge with attribution to both lanes — one consolidated finding, two source labels.
2. **Synergy pass.** Two CONCERN findings across lanes that, taken together, point to a single GAP get promoted with reasoning. *"Lane 2 says 'assumption: payment succeeds' (CONCERN). Lane 3 says 'no failure handling for declined card' (CONCERN). Together: GAP — declined-card path is unstated and unhandled."*
3. **Thin-SOUND audit.** Each lane SOUND is checked for chain-of-evidence quality. A SOUND with reasoning thinner than one specific quote plus one specific citation is bounced back to the lane with "show evidence" — not escalated, just re-asked. **Cap: one re-ask per SOUND.** If the lane returns the same thin SOUND, escalate to the Imperator.
4. **Conflict resolution.** Contradictory findings on the same surface are resolved by the Consul on merit, per the existing Codex protocol (`protocol.md` §6 "Conflicting findings between agents"). Unresolvable contradictions escalate to the Imperator.

### Lane Failure Handling

- **Lane returns no output (timeout, OOM, dispatch error).** Re-dispatch once. If still no return, escalate to the Imperator with the attempts shown.
- **Lane crashes mid-execution.** Escalate to the Imperator immediately; do not silently retry a crashed lane.
- **Lane returns malformed output (no findings block, no trigger declaration, schema violation).** Re-dispatch once with an explicit format reminder in the prompt. If still malformed, escalate.
- **Lane returns a finding outside its declared trigger surface.** See iteration-1 sanity check under Differential Re-Verify — finding processed normally; trigger declaration flagged for correction; iteration-2+ fast-path disabled for that lane until corrected.

### Context Exhaustion Checkpoint

When the combined volume of lane findings approaches Consul context capacity, the Consul presents a compressed summary to the Imperator and requests focus areas before completing the merge. This is the explicit Imperator-checkpoint that replaces what the Gaius pattern would otherwise offload to a second-pass agent. The threshold (precise findings count or token budget) is plan-level; the contract is the existence of the checkpoint.

**Audit visibility.** When the Consul presents the merged summary to the Imperator, each finding carries source-lane attribution; dedups and synergies are visible. The merge is not opaque.

**Future option, deferred.** If observability after this work ships shows the Consul-merge missing real cross-lane synergies — particularly in the context-exhaustion case — a Gaius-style second-pass agent can be wired in later. The lane reports already carry chain of evidence; an adversarial auditor can read them. The deferral is reversible.

## Sequencing Constraint

> **Confidence: High** — collisions identified during reconnaissance and re-verified by the Provocator's negative-claim attack; one sibling-case overlap surfaced in iteration 2.

This work touches `claude/skills/references/verification/protocol.md`. The in-flight Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) also touches `protocol.md` (Task 3 — adds a Custos row to the §2 dispatch table). **The Custos case lands first.** This case's edits to `protocol.md` are designed to apply on top of the post-Custos state of the file.

This work also touches `claude/skills/references/verification/templates/spec-verification.md` and `templates/plan-verification.md` (the lanes' new prompts replace the existing single-Provocator missions). The Custos case does NOT touch either template (verified against `2026-04-26-custos-edicts-wiring/plan.md`); no collision.

This work touches `claude/skills/consul/SKILL.md` (Spec Discipline Rule edits + Merge Protocol additions). The Custos case is explicit about not touching `consul/SKILL.md` (their plan §1009, Out of Scope); no collision.

**Sibling case overlap: `2026-04-26-tribune-persistent-principales`.** The tribune-persistent case proposes a Codex amendment for "Persistent Orchestrator" and modifies `/edicts`, `/legion`, `/march` skills. No file collision with this work, but the **Codex-amendment concept** overlaps with this work's Aggregation Contract (which preserves Codex vocabulary while introducing trigger declarations and merge attribution at the layer below). The plan must coordinate the two: confirm that the tribune-persistent amendment and this work's Aggregation Contract describe non-overlapping doctrinal surfaces before either ships.

## Out of Scope

> **Confidence: High** — PA-A's brief explicitly excluded these; the Imperator confirmed; iteration-2 narrowed the Codex stance and removed the Praetor portability claim.

- **Praetor decomposition.** The Praetor is read-only, textual, Bash-less. Its role is forensic (dependency tracing, file-collision checks, spec-coverage audits) — not adversarial. The Provocator's adversarial five-lane shape **does not translate** to Praetor's role. If Praetor decomposition is ever undertaken, it requires its own forensic-lens decomposition designed from scratch; the Provocator template does not carry over.
- **Codex vocabulary changes.** Finding categories remain MISUNDERSTANDING / GAP / CONCERN / SOUND. The Independence Rule is unchanged. The auto-feed loop is unchanged. Chain of evidence is unchanged. The role-level wording in `protocol.md` (Interaction Protocols, depth-configuration counts) treats "Provocator" as one role; the lanes are operational decomposition within that role. (See Aggregation Contract under The Five-Lane Shape.)
- **Kimi / principales integration.** Separate case track — the in-flight `2026-04-26-kimi-principales-v1` substrate work; the `2026-04-26-kimi-principales-integration` case is HALTED pending a 5-case empirical dataset, not in-flight. The five-lane shape is independent of any principales work.
- **Second-pass adversarial agent (Gaius pattern for Provocator).** Deferred — see Merge Protocol.
- **Campaign review changes.** This case scopes to spec verification and plan verification. Post-execution Campaign review continues to use the existing single-Provocator dispatch until a separate case decides whether to mirror the five-lane shape there.
- **Cross-session persistence of lane reports.** Differential re-verify is scoped to single-session in v1 (see Differential Re-Verify). Cross-session persistence is a separate future case if data demands it.

## Success Criteria

> **Confidence: Medium** — the qualitative criteria are firm; the wall-clock estimates are extrapolations from PA-A's brief and will be replaced by real numbers after the first dispatch on a live spec or plan.

Observable outcomes after this work ships:

1. **Single-round wall-clock collapses.** Provocator dispatch drops from ~10–15 min sequential to roughly the longest-lane time. The negative-claim lane is the expected longest, projected at ~3–5 min on a typical spec.
2. **Iteration 2+ wall-clock collapses further.** When the Imperator's edit touches few lanes' trigger surfaces, the round becomes a single-lane re-fire, often under a minute. The other lanes fast-path with prior verdicts intact.
3. **Specs are smaller in the HOW dimension.** A post-deliberation spec for any feature should not contain file paths, function signatures, internal type definitions, library choices, or per-task implementation patterns. Boundary contracts may appear and pass the litmus test.
4. **Edge-case findings filter through the plausibility threshold.** Findings that fail all four criteria are not raised. The Consul should observe a measurable drop in findings of the "what if five unlikely events all happen" class.
5. **Lane reports carry trigger declarations matching the schema.** Every lane report on iteration 1 includes the structured trigger declaration defined under Differential Re-Verify. The schema is the contract; informal prose alone is not a valid declaration.
6. **Merge summary is auditable.** When the Consul presents the merged finding summary, each finding carries source-lane attribution; dedups and synergies are visible to the Imperator without reading the raw lane reports.

---

## Confidence Map (Aggregated)

|Section|Confidence|Anchor|
|-|-|-|
|Goal|Medium|"Multiplicative" softened to "compound" after Provocator attack on axis-orthogonality assumption|
|Source|High|Paths verified during reconnaissance; template drift acknowledged|
|Five-lane shape|Medium|Composition is High; Aggregation Contract and Deployment-Model Contract field-untested|
|Spec discipline rule|High|Litmus test survived adversarial attack; plan WHY contract spelled out|
|Plausibility threshold|High|Imperator-confirmed; criterion 3 no-op annotated|
|Differential re-verify|Medium|Schema and sanity check spelled out in iteration 2; field-untested|
|Merge protocol|Medium|Failure handling and context exhaustion checkpoint added in iteration 2; field-untested|
|Sequencing constraint|High|Collisions verified; sibling overlap surfaced|
|Out of scope|High|Codex stance narrowed; Praetor portability removed|
|Success criteria|Medium|Wall-clock estimates pending real measurement|

---

## Iteration 2 — Verifier Findings Disposition

Iteration 1 was reviewed by the Censor and Provocator in parallel per the Codex spec-verification protocol. Eleven GAPs and nine CONCERNs (after dedup and synergy promotion) were addressed in this revision. Six SOUNDs were validated. No MISUNDERSTANDINGs.

**Major changes in iteration 2:**

- Added Deployment-Model Contract and Aggregation Contract under The Five-Lane Shape.
- Added trigger-declaration schema, iteration-1 sanity check, and single-session scope under Differential Re-Verify; removed cross-session "evidence-base diff" framing.
- Added Lane Failure Handling and Context Exhaustion Checkpoint under Merge Protocol; thin-SOUND re-ask capped at one attempt.
- Spelled out plan-WHY inheritance contract under Spec Discipline Rule.
- Annotated criterion 3 no-op behavior under Plausibility Threshold.
- Extended Sequencing Constraint to verification templates and the `tribune-persistent-principales` sibling-case Codex-amendment overlap.
- Narrowed Out of Scope: "no Codex changes" → "no Codex vocabulary changes" + Aggregation Contract; Praetor portability claim removed; cross-session persistence explicitly out of scope.
- Re-rated confidence on Goal, Five-Lane Shape, Differential Re-Verify, and Merge Protocol from High to Medium.
- Softened "multiplicatively" to "compound" throughout.
- Added pre-existing template-drift acknowledgment under Source.
- Assigned the orphaned Quality-Bar finding ("missing confidence map = finding") to the overconfidence-audit lane.
- Added terminology-disambiguation note for "Provocator lane" vs. doctrine-level `Lane:` field.

The five-lane composition itself, the litmus test, the Plausibility Threshold's four criteria, the Custos sequencing constraint, and the Out of Scope list (after iteration-2 narrowing) all survived adversarial review.
