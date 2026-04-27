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

**Pre-existing template drift acknowledgment.** The current `templates/spec-verification.md` enumerates only 5 of the canonical persona's 6 passes (negative-claim attack is omitted from the Provocator mission). The new five-lane templates authored by this work supersede both `spec-verification.md` and `plan-verification.md` and include all attack surfaces; the legacy enumeration drift is resolved in passing rather than fixed in advance. **Rollback note:** if the five-lane structure is ever rolled back as a future-case decision, the legacy 5-of-6-passes drift returns silently — future maintainers performing such a rollback must restore the omitted negative-claim attack pass enumeration in the legacy template at the same time.

PA-A's orders framed two parallel cause classes for Provocator slowness: monolithic structure (Cause A) and over-detailed specs (Cause B). This work addresses both.

## The Five-Lane Shape

> **Confidence: Medium** — the five-lane composition itself is High-confidence (Imperator-confirmed); the Aggregation Contract and Deployment-Model Contract added in iteration 2 (extended in iteration 3) are field-untested.

The decomposed Provocator is **not one agent with five passes**. It is five lanes, each its own dispatch, fired in parallel. Wall-clock for a single round becomes the time of the longest lane, not the sum of all lanes.

|Lane|Attack surface|Tools|Produces|
|-|-|-|-|
|Overconfidence audit|Assertions and certainty-shaped language ("straightforward", "simple", "unaffected") in the artifact; **also: missing or null confidence map**|Read|CONCERN — claims-without-evidence; GAP — missing confidence map|
|Assumption extraction|Narrative claims about behavior — "the user will…", "the API returns…", "the component receives…"|Read|GAP — unstated premises|
|Failure-mode analysis|Flow descriptions, success paths|Read|GAP — unhandled failures|
|Edge-case hunting|Boundary conditions, state descriptions, data shapes, contracts|Read|GAP — unhandled edges|
|Negative-claim attack|Negative assertions — "no migration", "no breaking changes", "does not route through"|Read + Bash|GAP / SOUND — verified absence claims|

**Confidence-map sweep is not a lane.** It is universal preamble. Every lane reads the artifact's confidence map first and prioritizes high-confidence sections accordingly. The Quality-Bar rule from the Provocator persona — *"if the Consul didn't provide a confidence map, that itself is a finding"* — is owned by the **overconfidence-audit lane** under decomposition.

**Terminology disambiguation.** This spec uses "Provocator lane" or simply "lane" for the decomposition concept. Two unrelated `Lane` concepts exist in the same doctrine surface and must not be confused:

- `$CONSILIUM_DOCS/doctrine/known-gaps.md` uses `Lane:` as a product-surface field (medusa-backend / storefront / cross-repo).
- The in-flight sibling case `2026-04-26-kimi-principales-v1` (Task 15) creates `claude/skills/references/verification/lanes.md` — a Principales taxonomy file in the same directory as the templates this work edits.

Downstream agents reading either of those files should consult this disambiguation before assuming a single meaning of "lane."

**Each lane is a separate verification dispatch** with its own attack surface and operational doctrine. The shared persona ancestor — Spurius Ferox — is preserved across the lanes; the lanes are five tactical disciplines of one fighter, not five separate fighters with separate origin stories.

### Deployment-Model Contract

The deployment model — whether lanes are five user-scope agent files, one agent invoked five times with different prompts, or another pattern — is a plan-level decision. The spec carries the contract; the plan picks the model.

The plan's chosen deployment model MUST satisfy:

- **Drift coverage.** The plan must register every agent file carrying canonical Consilium content under a drift-detection mechanism. **Canonical content** includes (a) the Codex (extracted between `# The Codex of the Consilium` and `## Operational Notes` headers per `claude/scripts/check-codex-drift.py`), AND (b) the persona body (canonical at `claude/skills/references/personas/<persona>.md`). The current drift script covers only the Codex section; if the deployment model creates new agent files, the plan must either extend the script's coverage to the persona body OR document the persona-body drift gap explicitly and accept the risk.
- **Dispatch-table accuracy.** `claude/skills/references/verification/protocol.md` §2 names the actual dispatch surface (subagent_types) the Consul invokes.
- **Auditable trigger declarations.** Each lane produces a trigger declaration on iteration 1 (see Differential Re-Verify), regardless of whether the lane is its own agent or a prompt variant.
- **Independence Rule preserved.** Each lane receives only the artifact, doctrine, context summary, and confidence map — never the conversation, never another lane's report.

### Aggregation Contract

In **role-level** wording — the Codex Interaction Protocols, the depth-configuration counts in `protocol.md` §8 ("Spec verification: Censor + Provocator (2 agents)"), the dispatch-table Role column — "Provocator" refers to **the role**, not the agent count. The five lanes are operational decomposition within the Provocator role; the role count does not change.

Trigger declarations and merge attribution are introduced as concepts in **lane operational doctrine** (the lane prompt's mission section) and the **Consul SKILL** (the merge protocol). They are not Codex concepts. The Codex's four-category vocabulary, Independence Rule, chain-of-evidence rule, and auto-feed loop are all unchanged.

This is what "no Codex vocabulary changes" means: the doctrinal floor stays put. The role-level wording stays put. The decomposition lives one layer below — in the Consul's dispatch machinery and the lane's operational prompts.

**§11 attribution under decomposition.** Protocol §11's example pattern — *"GAP (Provocator): X"* — is preserved verbatim. The Provocator role tag stays as the source-agent label per the §11 rule. Lane attribution is a **suffix** on the role tag in the Consul's merge presentation: *"GAP (Provocator / overconfidence-audit lane): X"*. This extends the role-level pattern with operational decomposition; it does not amend §11. The "tag every finding with its source agent" rule is preserved; the agent is the Provocator role; the lane is a sublabel.

**§8 readability.** The role-level wording in `protocol.md` §8 ("Spec verification: Censor + Provocator (2 agents)") stays unchanged — *agents* there refers to the role count, not the dispatch count. To prevent a misleading read, the plan SHOULD add an annotation to §8 cross-referencing the Aggregation Contract; the precise annotation wording is plan-level work.

**The five-lane structure adapts to plan-mode verification with prompt re-tuning.** The existing plan-mode Provocator template carries adversarial concerns specific to plans (execution friction, ordering assumptions, integration gaps, scope leaks). These do not map one-to-one onto the five spec-mode lanes; the plan-mode prompts redistribute these concerns across the lanes (e.g., ordering assumptions → assumption-extraction lane; integration gaps → failure-mode lane). This is **adaptation work, not direct portability** — the plan owns the redistribution.

## Spec Discipline Rule

> **Confidence: High** — the litmus test survived four angles of Provocator attack across iterations 1 and 2; the carve-outs match the Imperator's confirmed boundary; iteration 3 tightened the plan-WHY citation form.

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
|WHY|Motivation, constraints, invariants, non-goals|Cites spec sections by **markdown link** (e.g., `[spec §3](../spec.md#3-section-name)`). Section-name-only prose citations are not permitted under this contract — they go stale silently when the spec is revised. Per-task rationale only when the implementation choice is non-obvious. Under spec revision, broken links surface at re-verify; the plan must update affected citations.|
|Success criteria|Feature-level acceptance (observable)|Per-task definition-of-done|
|HOW|Excluded (this is the discipline rule)|Owned here|

**Effect on the verification machinery.** The Censor's domain-correctness role is unchanged — the new rule is structural, not semantic. The Layer-1 self-review (Consul's own pass before dispatch) gains a scope check: *"does any section contain HOW that belongs in the plan?"* If yes, move it.

## Plausibility Threshold

> **Confidence: High** — the Imperator named edge-case hunting as the prime AI-slop offender; this rule is the response. Iteration 3 broadened criterion 3 to cover doctrine-derived invariants.

The edge-case lane and its cousin failure-mode lane each carry a hard plausibility threshold installed in the lane prompt. An edge or failure mode is raised as a finding **only if at least one of these is true**:

1. It is statable as a **single** user action (not a chain of unlikely events).
2. It is plausibly hit within roughly the first hundred real sessions of the feature.
3. It violates a domain invariant the spec asserts **OR** a doctrine-asserted invariant binding for the artifact's domain (per `$CONSILIUM_DOCS/doctrine/`).
4. It is in a class of edges the codebase has historically failed at — per `$CONSILIUM_DOCS/doctrine/known-gaps.md`.

If none — the edge or failure mode is theatrical. The lane **does not raise it**. The Provocator persona's existing "relentless but bounded" discipline is preserved; this rule sharpens it.

**Note on criterion 3.** Criterion 3 fires for two cases: (a) specs that explicitly assert domain invariants — which under the Spec Discipline Rule above includes any boundary contract (wire shapes, idempotency anchors, link.create boundaries, workflow ownership, subscriber boundaries); AND (b) doctrine-derived invariants in `$CONSILIUM_DOCS/doctrine/` that bind the artifact's domain even when the spec does not enumerate them explicitly. Case (b) prevents the criterion from silently demoting invariants that exist in doctrine but are not declared in the spec. For specs whose domain has neither explicit nor doctrine-derived invariants — pure-frontend or pure-presentational features — criterion 3 is a no-op and the lane operates on criteria 1, 2, and 4. The threshold is not designed to manufacture invariants where neither spec nor doctrine declares them.

**Compound effect with the spec discipline rule.** Edges that drive HOW-shaped responses (defensive try/catch in specific functions, fallback values in specific files) lose their *spec target* under the new spec rule — they belong in plan if anywhere. Half the slop dies on contact with spec discipline. The remainder — truly theatrical edges — gets filtered by the plausibility threshold at the lane.

## Differential Re-Verify

> **Confidence: Medium** — the trigger-declaration schema, matching primitives, intersection rule, iteration-1 sanity check rule, and single-session scope were specified across iterations 2 and 3 in response to verifier findings; the mechanism is field-untested.

**Iteration 1.** Every lane fires fully on the artifact. Each lane's report includes its findings AND a **trigger declaration** — a structured object naming the surface the lane attacks.

**Trigger declaration schema:**

```yaml
lane: <lane name>
surface_predicates:
  coverage: "specific" | "entire_artifact"   # explicit sentinel; "specific" is the default
  keywords: [<word>, <word>, ...]            # case-insensitive whole-word match
  section_patterns: [<regex>, ...]           # regex against heading line text only
  evidence_base: [<file:line>, ...]          # codebase citations the lane's findings rest on (optional)
```

**Matching rules:**

- **Keywords** — case-insensitive whole-word match against artifact text. The keyword `failure` matches `Failure` and `FAILURE`, but does not match `failures` or `failed`. Multi-word keywords are matched as a whole phrase.
- **Section patterns** — regex against the markdown heading line text only (e.g., `^## Spec Discipline Rule`). A diff hunk falls "within" a section if it appears in lines after a heading whose text matches the regex and before the next heading at equal-or-shallower depth.
- **Evidence base** — literal `file:line` match. A diff line "touches" `file:line` when the diff modifies the file and the modified line range overlaps the cited line.

**Intersection rule (iteration 2+).** The artifact diff intersects the lane's trigger surface if **any** of:

- Any diff hunk text contains any keyword (per matching rule above), OR
- Any diff hunk falls within a section whose heading matches any section_pattern, OR
- Any diff line touches any `file:line` in evidence_base.

A lane with `coverage: "entire_artifact"` always intersects — no fast-path is available for that lane. Such lanes should be rare; spec authors should narrow surface where possible. The default is `coverage: "specific"`.

**Iteration-1 sanity check rule.** A finding is "within declared surface" if **any** of:

- The finding's Evidence quote contains any keyword (per matching rule), OR
- The finding's Evidence cites a section whose heading matches any section_pattern, OR
- The finding's Source cites a `file:line` in evidence_base.

A finding "outside declared surface" — none of the above. The lane's trigger declaration is flagged as suspect; iteration-2+ fast-path is disabled until the declaration is corrected; the finding itself is processed normally per merge protocol.

Each lane MUST emit a trigger declaration. A lane that fails to emit one is treated as fires-every-iteration until the declaration is produced (the Consul does not silently fast-path a lane with no declared surface).

**Iteration 2+.** The Consul computes the **artifact diff** against the prior iteration. For each lane, the Consul evaluates: **does the diff intersect the lane's trigger surface?** (per the Intersection rule above)

- **No intersection** → lane fast-paths. No dispatch. The lane's iteration-N report reads: *"No diff in trigger surface; iteration N-1 verdict stands."*
- **Intersection** → lane re-fires, scoped to changed content. The lane receives the diff plus prior findings; it discards findings on now-deleted content and produces fresh findings on changed content.

**Single-session scope (v1).** Differential re-verify is scoped to a single Consul session. Across sessions, all lanes re-fire from a clean baseline. Cross-session persistence of lane reports is a separate future case if data demands it.

**Effect.** A typical iteration 2 — Imperator edits one paragraph — collapses to a single-lane re-fire, often well under a minute. The other four lanes fast-path with prior verdicts intact.

## Merge Protocol — Four Steps, In-Consul

> **Confidence: Medium** — the failure-handling subsection, the context-exhaustion heuristic, and the thin-SOUND cap were tightened across iterations 2 and 3 in response to verifier findings; field-untested.

The Consul merges the five lane reports via a structured protocol. No second-pass adversarial agent in v1; the lanes are themselves adversarial, and adding another adversarial pass burns wall-clock for unproven value.

1. **Dedup pass.** For each finding from a lane, check whether a near-cognate finding appears in any other lane. If yes, merge with attribution to both lanes — one consolidated finding, two source labels.
2. **Synergy pass.** Two CONCERN findings across lanes that, taken together, point to a single GAP get promoted with reasoning. *"Lane 2 says 'assumption: payment succeeds' (CONCERN). Lane 3 says 'no failure handling for declined card' (CONCERN). Together: GAP — declined-card path is unstated and unhandled."*
3. **Thin-SOUND audit.** Each lane SOUND is checked for chain-of-evidence quality. A SOUND with reasoning thinner than one specific quote plus one specific citation is bounced back to the lane with "show evidence" — not escalated, just re-asked. **Cap: one re-ask total per merge round, regardless of how many SOUNDs triggered it.** If the re-ask response itself contains thin SOUNDs (whether the same one or new ones), escalate the entire merge to the Imperator rather than starting a new re-ask cycle.
4. **Conflict resolution.** Contradictory findings on the same surface are resolved by the Consul on merit, per the existing Codex protocol (`protocol.md` §6 "Conflicting findings between agents"). Unresolvable contradictions escalate to the Imperator.

### Lane Failure Handling

- **Lane returns no output (timeout, OOM, dispatch error).** Re-dispatch once. If still no return, escalate to the Imperator with the attempts shown.
- **Lane crashes mid-execution.** Escalate to the Imperator immediately; do not silently retry a crashed lane.
- **Lane returns malformed output.** Malformed = missing findings block, missing trigger declaration, or schema violation. Re-dispatch ONCE with an explicit format reminder in the prompt. If the second dispatch is malformed in any way (same shape OR a different shape), escalate. The cap is one re-dispatch attempt total, not one re-dispatch per malformation type.
- **Lane returns a finding outside its declared trigger surface.** See iteration-1 sanity check under Differential Re-Verify — finding processed normally; trigger declaration flagged for correction; iteration-2+ fast-path disabled for that lane until corrected.

### Context Exhaustion Checkpoint

When the combined volume of lane findings approaches Consul context capacity, the Consul presents a compressed summary to the Imperator and requests focus areas before completing the merge. This is the explicit Imperator-checkpoint that replaces what the Gaius pattern would otherwise offload to a second-pass agent. The threshold (precise findings count or token budget) is plan-level; the contract is the existence of the checkpoint.

**Audit visibility.** When the Consul presents the merged summary to the Imperator, each finding carries source-lane attribution (per Aggregation Contract: role tag with lane suffix); dedups and synergies are visible. The merge is not opaque.

**Future option, deferred.** If observability after this work ships shows the Consul-merge missing real cross-lane synergies — particularly in the context-exhaustion case — a Gaius-style second-pass agent can be wired in later. The lane reports already carry chain of evidence; an adversarial auditor can read them. The deferral is reversible.

## Sequencing Constraint

> **Confidence: High** — collisions identified during reconnaissance and re-verified across iterations; iteration 3 added the kimi-principales-v1 sibling-overlap entry.

This work touches `claude/skills/references/verification/protocol.md`. The in-flight Custos case (`docs/cases/2026-04-26-custos-edicts-wiring/`) also touches `protocol.md` (Task 3 — adds a Custos row to the §2 dispatch table). **The Custos case lands first.** This case's edits to `protocol.md` are designed to apply on top of the post-Custos state of the file.

This work also touches `claude/skills/references/verification/templates/spec-verification.md` and `templates/plan-verification.md` (the lanes' new prompts replace the existing single-Provocator missions). The Custos case does NOT touch either template (verified against `2026-04-26-custos-edicts-wiring/plan.md`); no collision.

This work touches `claude/skills/consul/SKILL.md` (Spec Discipline Rule edits + Merge Protocol additions). The Custos case is explicit about not touching `consul/SKILL.md` (their plan §1009, Out of Scope); no collision.

**Sibling case overlap: `2026-04-26-kimi-principales-v1`.** This case (Task 15) creates `claude/skills/references/verification/lanes.md` — a Principales taxonomy file in the same directory as the templates this work edits. **No file collision** (different filename), but a terminology overlap on the word "lane." Disambiguation lives in Terminology Disambiguation under The Five-Lane Shape. Either case can ship first; the disambiguation note in this spec stands as the canonical reference.

**Sibling case overlap: `2026-04-26-tribune-persistent-principales`.** The tribune-persistent case proposes a Codex amendment for "Persistent Orchestrator" and modifies `/edicts`, `/legion`, `/march` skills. No file collision with this work, but the **Codex-amendment concept** overlaps with this work's Aggregation Contract (which preserves Codex vocabulary while introducing trigger declarations and merge attribution at the layer below). The plan must coordinate the two: confirm that the tribune-persistent amendment and this work's Aggregation Contract describe non-overlapping doctrinal surfaces before either ships. The tribune-persistent amendment scopes to Tribunus only and does not touch Provocator, so the surfaces are non-overlapping in practice.

## Out of Scope

> **Confidence: High** — PA-A's brief explicitly excluded these; the Imperator confirmed; iteration-2 narrowed the Codex stance and removed the Praetor portability claim.

- **Praetor decomposition.** The Praetor is read-only, textual, Bash-less. Its role is forensic (dependency tracing, file-collision checks, spec-coverage audits) — not adversarial. The Provocator's adversarial five-lane shape **does not translate** to Praetor's role. If Praetor decomposition is ever undertaken, it requires its own forensic-lens decomposition designed from scratch; the Provocator template does not carry over.
- **Codex vocabulary changes.** Finding categories remain MISUNDERSTANDING / GAP / CONCERN / SOUND. The Independence Rule is unchanged. The auto-feed loop is unchanged. Chain of evidence is unchanged. The role-level wording in `protocol.md` (Interaction Protocols, depth-configuration counts) treats "Provocator" as one role; the lanes are operational decomposition within that role. (See Aggregation Contract under The Five-Lane Shape.)
- **Kimi / principales integration.** Separate case track — the in-flight `2026-04-26-kimi-principales-v1` substrate work; the `2026-04-26-kimi-principales-integration` case is HALTED pending a 5-case empirical dataset, not in-flight. The five-lane shape is independent of any principales work.
- **Second-pass adversarial agent (Gaius pattern for Provocator).** Deferred — see Merge Protocol.
- **Campaign review changes.** This case scopes to spec verification and plan verification. Post-execution Campaign review continues to use the existing single-Provocator dispatch until a separate case decides whether to mirror the five-lane shape there.
- **Cross-session persistence of lane reports.** Differential re-verify is scoped to single-session in v1 (see Differential Re-Verify). Cross-session persistence is a separate future case if data demands it.

## Success Criteria

> **Confidence: Mixed** — qualitative outcomes (criteria 3–6) are Medium; quantitative wall-clock estimates (criteria 1–2) are Low pending real measurement. Iteration 3 split the rating to reflect the chain-multiplied uncertainty the Provocator surfaced.

Observable outcomes after this work ships:

1. *(Confidence: Low)* **Single-round wall-clock collapses.** Provocator dispatch drops from ~10–15 min sequential to roughly the longest-lane time. The negative-claim lane is the expected longest, projected at ~3–5 min on a typical spec.
2. *(Confidence: Low)* **Iteration 2+ wall-clock collapses further.** When the Imperator's edit touches few lanes' trigger surfaces, the round becomes a single-lane re-fire, often under a minute. The other lanes fast-path with prior verdicts intact.
3. *(Confidence: Medium)* **Specs are smaller in the HOW dimension.** A post-deliberation spec for any feature should not contain file paths, function signatures, internal type definitions, library choices, or per-task implementation patterns. Boundary contracts may appear and pass the litmus test.
4. *(Confidence: Medium)* **Edge-case findings filter through the plausibility threshold.** Findings that fail all four criteria are not raised. The Consul should observe a measurable drop in findings of the "what if five unlikely events all happen" class.
5. *(Confidence: Medium)* **Lane reports carry trigger declarations matching the schema.** Every lane report on iteration 1 includes the structured trigger declaration defined under Differential Re-Verify. The schema is the contract; informal prose alone is not a valid declaration.
6. *(Confidence: Medium)* **Merge summary is auditable.** When the Consul presents the merged finding summary, each finding carries source-lane attribution (role tag with lane suffix per Aggregation Contract); dedups and synergies are visible to the Imperator without reading the raw lane reports.

---

## Confidence Map (Aggregated)

|Section|Confidence|Anchor|
|-|-|-|
|Goal|Medium|"Multiplicative" softened to "compound" (iter 2)|
|Source|High|Paths verified; template drift acknowledged with rollback note (iter 3)|
|Five-lane shape|Medium|Aggregation Contract extended with §11 attribution + §8 readability (iter 3); Deployment-Model Contract drift coverage broadened (iter 3); Terminology Disambiguation extended for kimi-lanes.md (iter 3)|
|Spec discipline rule|High|Litmus test survived adversarial attack across iterations; plan WHY tightened to markdown links (iter 3)|
|Plausibility threshold|High|Imperator-confirmed; criterion 3 broadened to doctrine-derived invariants (iter 3)|
|Differential re-verify|Medium|Schema + matching primitives + intersection rule + iteration-1 sanity check rule + coverage sentinel fully specified (iter 2 + iter 3)|
|Merge protocol|Medium|Lane failure handling tightened to "any malformation, one retry total" + thin-SOUND cap restructured to per-merge-round (iter 3)|
|Sequencing constraint|High|Verified across iterations; kimi-principales-v1 sibling overlap added (iter 3)|
|Out of scope|High|Codex stance + Praetor portability stable since iter 2|
|Success criteria|Mixed|Quantitative criteria 1–2 = Low; qualitative criteria 3–6 = Medium (split in iter 3)|

---

## Iteration 2 — Verifier Findings Disposition

Iteration 1 was reviewed by the Censor and Provocator in parallel per the Codex spec-verification protocol. Eleven GAPs and nine CONCERNs (after dedup and synergy promotion) were addressed in iteration 2. Six SOUNDs were validated. No MISUNDERSTANDINGs.

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

## Iteration 3 — Verifier Findings Disposition

Iteration 2 was reviewed by the Censor and Provocator in parallel. Counts: 0 MISUNDERSTANDING, ~10 GAPs (after dedup and synergy across both verifiers), ~6 CONCERNs, 6 SOUNDs. The Provocator's GAP count rose from iteration 1 (7 → 9) because iteration-2 contracts opened new attack surfaces; the Censor's fell sharply (8 → 4) because iteration-2 closed his prior issues. One conflict between verifiers was resolved on merit: Provocator's catch on `protocol.md` §11 (Finding Attribution) outweighed Censor's SOUND on Aggregation Contract — the §11 attribution pattern needed clarification.

The Imperator authorized iteration 3 with **no further re-dispatch** (auto-feed loop cap at 2; iteration 3 needs Imperator authorization per Codex; no fourth iteration in this case). Eleven fixes applied:

1. **Trigger declaration schema operational primitives.** Defined keyword matching (case-insensitive whole-word), section_pattern matching (regex against heading line; section body falls within), evidence_base matching (literal `file:line`), the disjunctive intersection rule, and the iteration-1 sanity check rule (against the finding's Evidence and Source fields). Closes the dominant "schema-without-primitive" theme from both verifiers.
2. **§11 attribution clarification under Aggregation Contract.** Lane is a suffix on the role tag in the Consul's merge presentation: *"GAP (Provocator / overconfidence-audit lane): X"*. §11's "tag with source agent" rule preserved; no Codex amendment.
3. **Lane Failure Handling tightened.** Collapsed to "any malformation, any kind, one re-dispatch total → escalate." Thin-SOUND cap restructured to one re-ask per merge round (prevents recursive thin-SOUND spawn).
4. **Drift coverage broadened.** The Deployment-Model Contract clause now covers canonical content (Codex + persona body), with the plan permitted to either extend the script or document the persona-body gap explicitly.
5. **Criterion 3 broadened.** Fires for spec-asserted invariants OR doctrine-asserted invariants binding for the artifact's domain. Closes the "implicit invariants demoted" hole.
6. **Sequencing audit completed.** `2026-04-26-kimi-principales-v1`'s in-flight `verification/lanes.md` Principales taxonomy added as a sibling-overlap entry; terminology disambiguation extended to cover the file.
7. **Plan-WHY citation form tightened.** Markdown links required (machine-checkable); section-name-only prose forbidden; behavior under spec revision spelled out (broken links surface at re-verify).
8. **§8 readability note added.** The plan SHOULD add a §8 annotation cross-referencing the Aggregation Contract; precise wording is plan-level.
9. **Success Criteria confidence split.** Quantitative wall-clock estimates (criteria 1–2) at Low; qualitative criteria (3–6) at Medium.
10. **"Covers entire artifact" sentinel added.** New `coverage: "specific" | "entire_artifact"` field in the schema; lanes whose surface is the whole artifact emit `entire_artifact` and never fast-path.
11. **Template-drift rollback note.** Future maintainers rolling back the five-lane structure must restore the legacy template's omitted negative-claim attack pass enumeration.

The litmus test, the Custos sequencing, the Aggregation Contract's §2/§8 consistency, the criterion-3 disjunction structure, the tribune-persistent-principales overlap framing, and the template-drift acknowledgment all survived iteration 2's adversarial review. The five-lane composition itself was never contested.

The spec is fit for plan dispatch. No further verifier iteration in this case; the remaining edges (e.g., per-lane prompt wording, threshold numbers for context-exhaustion checkpoint, deployment-model choice) fall to plan-level discipline and the Praetor's plan-verification.
