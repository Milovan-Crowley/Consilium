# Cold Verification — Codex + Protocol Amendment

**Date:** 2026-04-27
**Author:** Publius Auctor (Consul)
**Status:** Authored, pending verification dispatch

---

## 1. Motivation

DIV-100 spec verification cleared all six lanes plus the Censor across five iterations. Six load-bearing implementation killers shipped through the gate intact and were caught only when a different, cold-reading Consul was summoned without the deliberation history.

The six misses share a pattern. Each is a structural coupling, schema authority, or test-suite contradiction that none of the existing five Provocator lanes was shaped to catch. Catalog of misses:

|#|Miss|Root|
|-|-|-|
|B1|Missing multiplier-row check on reorder of saved product|Producer-consumer coupling not enumerated|
|B2|sku/upc copy violates Medusa unique indexes|Schema authority not consulted|
|B3|Lineage check dropped, allowing customer X to reorder customer Y's saved product|Implicit assumption never extracted|
|B4|Empty prices on saved-product reorder path|Producer-consumer coupling not enumerated (where does the value get read?)|
|B5|Metadata guards on non-importer paths absent|Producer-consumer coupling not enumerated|
|B6|Test-scope claim invalidated by existing test that anticipated the rewrite|Test-suite contradiction grep not run|

Diagnosis: warm verification. Three named heat sources, plus one structural lane gap, plus one discipline gap.

**Heat source 1 — The Context Summary the Consul writes.** Even when factual per protocol §4, its shape ("decisions made, ambiguities resolved, constraints stated") IS the cleaned-up surface. By iteration 4-5, the summary mirrors the Consul's own iteration fatigue. The verifier reads the Consul's filtered view, not the live system.

**Heat source 2 — The Confidence Map handed to lanes as an attack signal.** Per spec-verification template: *"High confidence is your PRIMARY TARGET."* Backwards for these misses — the blind spots weren't where the Consul claimed High and was wrong; they were where the Consul never thought to claim anything. Telling lanes to attack High directs them away from unrated gaps.

**Heat source 3 — Differential re-verify on iteration 2+.** Protocol §12 — lanes only re-fire if their declared surface intersects the diff. The protocol formalizes anchoring as an optimization. Structural gaps spanning the whole spec are invisible to lanes whose declared surface is narrow.

**Lane gap — No structural-coupling surface in the existing roster.** None of the existing lanes has structural coupling, schema authority, or test contradiction as its surface. The cold Consul caught B1-B6 by doing producer-consumer enumeration, schema grepping, and test-suite contradiction grep — Consul-shaped audit, not Provocator-shaped attack.

**Discipline gap — Medusa Rig + MCP plumbing is dispatcher-gated.** Every verifier carries `mcp__medusa__ask_medusa_question` in tools and a body note: *"If the dispatcher names a medusa-dev:* skill in your prompt, invoke it."* If the Consul does not name it, the Rig sits idle. B2 and B4 specifically would have been caught by mandatory MCP consultation on Medusa schema and read-path claims.

---

## 2. Goals

- Verifiers come cold by structural protocol, not by Consul discipline.
- A cold structural audit role exists alongside the Censor and the five Provocator lanes — distinct surface, mission, and output shape.
- Medusa Rig + MCP consultation is mandatory for any verifier reading an artifact that touches Medusa surface area, regardless of whether the dispatcher named the Rig skill.
- Differential re-verify cannot fast-path substantive content changes.

---

## 3. Non-Goals

- Restructuring the existing five Provocator lanes (their decomposition stands).
- Changing the Censor's correctness-against-doctrine mission.
- Adding new agent classes beyond the single Glacialis role.
- Modifying the Tribunus persistent-orchestrator stance (Codex §Persistent Orchestrator Class is unchanged; cold-dispatch applies at spawn/restart, persistent orchestrator's in-window cross-task context is preserved).
- Replacing the Codex as authoritative source — this is an amendment.
- Rig/MCP changes to brainstorming/recon phase Consul doctrine — recon already names the Rig; only deliberation + verification phases need amendment.
- Changes to Campaign Review (post-execution) verification surface in v1.

---

## 4. The Four Amendments

### 4.1 Cold Dispatch — Strip Context Summary and Confidence Map from Verifier Inputs

> **Confidence: High** — Imperator approved this exact framing in the deliberation. Heat-source diagnosis directly traces to the Independence Rule wording (Codex line 134-146) and protocol §3, §4.

**WHAT.** Verifiers (Censor, all five Provocator lanes, Praetor, Glacialis) receive in their dispatch prompt:

- The artifact (spec, plan, or implementation output).
- A minimal task statement: one sentence naming the artifact and the verification mission.
- Pointers to relevant doctrine files in `$CONSILIUM_DOCS/doctrine/`.

Verifiers do NOT receive:

- The Consul's Context Summary.
- The Confidence Map as a separate dispatch section.

The Confidence Map remains in the artifact as inline annotations (the Imperator reviews them; the dispatcher uses them for differential-re-verify trigger evidence). It is not extracted into a separate section passed to verifiers, and verifier missions no longer reference it as an attack target.

**WHY.** The Context Summary, however factually structured, is a Consul-authored interpretive briefing of "what we settled." By high-iteration count, that briefing IS the cleaned-up surface and signals "everything here has been considered." The Confidence Map directs lane attention by signaling where the Consul felt safe vs. unsafe — but the DIV-100 misses landed in unrated gaps, not in mis-rated High sections. Stripping both forces verifiers to build understanding from primary sources (artifact + doctrine + live code) without Consul framing.

**Boundary contract.** Dispatch prompt skeleton (protocol §3) is amended:
- Sections retained: `## The Artifact`, `## Domain Knowledge` (doctrine pointers, not pre-loaded excerpts), `## Your Mission`, `## Output Format`, `## Trigger Declaration` (lanes only).
- Sections REMOVED: `## Context Summary`, `## Confidence Map`.

### 4.2 Differential Re-Verify Fast-Path Tightening

> **Confidence: High** — Imperator approved. Mechanism is named in protocol §12 Intersection Rule.

**WHAT.** Iteration 2+ lane fast-path is restricted. A lane may fast-path ONLY when the artifact diff is empty, whitespace-only, or confined to YAML frontmatter. Any change to artifact body content forces full re-fire of every lane, regardless of the lane's declared trigger surface.

**WHY.** Differential re-verify formalized anchoring as an optimization. By iteration 4-5, lanes that "shouldn't" re-fire (per their narrow surface declaration) miss structural gaps that span the whole spec. Tightening the fast-path criterion restores per-iteration adversarial pressure on body-content changes; the optimization survives only for trivially-clean diffs.

**Boundary contract.** Protocol §12 Intersection Rule is amended: a lane fast-paths if and only if the artifact diff is empty OR consists exclusively of whitespace OR consists exclusively of YAML frontmatter changes. All other diffs force full re-fire. The Intersection Rule's keyword/section_pattern/evidence_base mechanism is preserved as the SCOPING mechanism within a re-fire (the lane attacks the changed surface), but never as a SKIP mechanism on substantive diffs.

### 4.3 The Glacialis Pass — Cold Structural Reader

> **Confidence: High** — Imperator approved. Role mission directly traces to the cold-Consul DIV-100 catch behavior. Persona naming and agent file content deferred to plan.

**WHAT.** A new verifier role: `consilium-glacialis`. Dispatched alongside the Censor and the five Provocator lanes for spec verification, and alongside the Praetor and the five lanes for plan verification.

The Glacialis mission has four surfaces:

- **Producer-consumer coupling enumeration.** For every piece of state the artifact creates or modifies, enumerate every downstream consumer. For each consumer, verify the producer satisfies the consumer's read-shape requirements. Mismatch is GAP.
- **Schema authority verification.** For every field-level claim about an external library or the database, grep the authoritative schema source (model file, migration, library source) and confirm the claim. Medusa-scope claims invoke `mcp__medusa__ask_medusa_question` per Amendment 4.4. Unverified claims are GAP.
- **Test-suite contradiction grep.** For every change to gate logic, state machine, or public contract described in the artifact, grep the test suite for assertions the change would invalidate. Existing tests anticipating the change are GAP — the artifact's "no test scope" or "scope confined to N files" claim is contradicted.
- **Implicit-assumption extraction at structural level.** Read the artifact for state changes whose original gate clauses are being widened or dropped. For each, ask what the original clause defended against. If the answer is unstated in the artifact, GAP.

The Glacialis is NOT a Provocator lane — its surface is structural-coupling, not content-adversarial. The Glacialis is NOT the Censor — its surface is structural, not correctness-against-doctrine. Distinct role, distinct dispatch, parallel with the others.

**Boundary contract — Glacialis output.** Findings emitted in the standard four categories (MISUNDERSTANDING / GAP / CONCERN / SOUND) per the Codex. Trigger declaration emitted at end of report per protocol §12 — Glacialis lane name is `glacialis`, default `coverage: "entire_artifact"` (the role sweeps the whole spec; differential re-verify never fast-paths Glacialis even before Amendment 4.2 tightens the criterion).

**Boundary contract — Glacialis inputs.** Same as other verifiers post-Amendment 4.1: artifact + minimal task statement + doctrine pointers. Plus: the Glacialis MUST consult the live codebase via Read/Grep/Serena/Bash — its mission requires it. Glacialis tools include `Bash` for `rg` cross-repo greps and test-suite contradiction grep.

**Aggregation Contract amendment.** Protocol §14 Aggregation Contract is extended: "Glacialis" is a peer role to Censor and Provocator. The Glacialis does NOT decompose into lanes; it is one role, one dispatch. Findings tagged `(Glacialis): X` per §11 attribution. The Censor + Provocator (5 lanes) + Glacialis = seven dispatch calls in parallel for spec verification. Eight for plan verification (Praetor takes Censor's place; Glacialis still dispatched).

### 4.4 Rig + MCP Imperative Discipline

> **Confidence: High** — Imperator approved. Mechanism traces to verifier body note conditional wording.

**WHAT.** Every verifier body note that currently reads *"If the dispatcher names a medusa-dev:* skill in your prompt..."* is amended to imperative form:

> *"If the artifact touches Medusa surface area (any backend route/workflow/module, any admin widget, any storefront SDK call, any cross-repo flow, any reference to a Medusa entity or schema field), the verifier MUST invoke `mcp__medusa__ask_medusa_question` AND the matching `medusa-dev:*` skill via `Skill(skill: "<name>")` before reasoning about Medusa-side behavior. The verifier infers Medusa scope from the artifact's content; dispatcher prompt naming is no longer required."*

The Rig fallback rule (degraded-MCP-only when Skill invocation fails) is preserved verbatim.

The Consul's own doctrine in the consul SKILL body is amended: Rig + MCP consultation moves from "during reconnaissance" only to "during reconnaissance AND deliberation AND every verification dispatch on a Medusa-touching artifact." When deliberating with the Imperator on a Medusa-touching question, the Consul invokes Rig + MCP before reasoning further on that question — not after the recon phase ends.

**WHY.** B2 (sku/upc unique indexes never grepped) and B4 (empty prices, never asked where the value gets read) are direct consequences of dispatcher-gated Rig invocation. The plumbing existed; nobody pulled the lever. Making invocation imperative — surface-detected, not dispatcher-named — closes the discipline gap structurally, independent of whether the Consul or any subsequent verifier remembers to name the Rig.

**Boundary contract.** Verifier body notes in 12 user-scope agent files (Censor, Praetor, Provocator legacy, Tribunus, Soldier, Custos, Scout, plus 5 Provocator lane agents — see CLAUDE.md "User-scope agent customizations" enumeration) are updated to imperative form. The Glacialis agent (new in Amendment 4.3) carries the same imperative body note.

The Consul skill body Phase 1 (Reconnaissance), Phase 2 (Deliberation), and Phase 3 (Codification + verification dispatch) Medusa Rig directives are all updated to invoke Rig + MCP as standard.

**Surface detection.** "Medusa surface area" is defined as: any reference to backend route/workflow/module, admin widget, storefront SDK call, Medusa entity (Product, Variant, Cart, Order, LineItem, etc.), Medusa schema field, or cross-repo flow between divinipress-store and divinipress-backend. The verifier infers Medusa scope from the artifact's content, not from the dispatcher's directive. When uncertain, the verifier consults the MCP — over-consulting is preferable to under-consulting.

---

## 5. Doctrine and Protocol Amendments

> **Confidence: Medium** — The list is exhaustive to the Consul's knowledge of current Codex/protocol/agent surface. Plan-time investigation will confirm whether additional drift surfaces exist (e.g., other templates, the brainstorming skill's interactions with verification).

|Doctrine surface|Section affected|Change|
|-|-|-|
|Codex `docs/codex.md`|Independence Rule|Strip "context summary" and "confidence map" from "they receive, and only receive" enumeration. Add note: the confidence map remains as inline artifact annotations for the Imperator's review and the dispatcher's differential-re-verify tracking, but is NOT passed to verifiers.|
|Codex `docs/codex.md`|The Confidence Map|Amend "How verifiers use them" subsection — verifiers do NOT receive the map as a dispatch section. The map's purpose is the Consul's self-discipline and the Imperator's review aid.|
|Codex `docs/codex.md`|Interaction Protocols — Spec Verification|"Censor and Provocator" → "Censor, Provocator, and Glacialis." Same for Plan Verification (Praetor + Provocator + Glacialis). Campaign Review unchanged in v1.|
|Protocol `verification/protocol.md` §3|Prompt Skeleton|Remove `## Context Summary` and `## Confidence Map` sections.|
|Protocol §4|Context Summary Format|Section deleted in its entirety.|
|Protocol §5|Inline Confidence Annotations|Amend "How verifiers use them" — annotations remain in artifact for the Imperator and for trigger-declaration evidence_base citations, but are NOT extracted as a separate section to verifiers, and verifier missions do NOT reference high-confidence sections as primary attack targets.|
|Protocol §8|Depth Configuration|Spec verification: "Censor + Provocator (2 agents)" → "Censor + Provocator + Glacialis (3 roles)." Plan: "Praetor + Provocator" → "Praetor + Provocator + Glacialis."|
|Protocol §12|Intersection Rule|Tighten fast-path criterion to whitespace/frontmatter-only diffs per Amendment 4.2.|
|Protocol §14|Aggregation Contract|Extend to enumerate Glacialis as peer role. Findings tagged `(Glacialis): X`. Glacialis does not decompose into lanes.|
|Spec verification template|Agents block + dispatch sections|Add Glacialis dispatch (seventh dispatch alongside Censor + 5 lanes). Remove Context Summary + Confidence Map from all dispatch prompts.|
|Plan verification template|Agents block + dispatch sections|Add Glacialis dispatch. Remove Context Summary + Confidence Map.|
|12 user-scope agent files|Medusa MCP body note|Conditional → imperative form per Amendment 4.4.|
|New user-scope agent file|`~/.claude/agents/consilium-glacialis.md`|Created with Glacialis persona, Codex, Operational Doctrine, Operational Notes, and imperative Medusa MCP body note. Tools: Read, Grep, Glob, Skill, all Serena tools, Bash, mcp__medusa__ask_medusa_question.|
|Consul skill body|Phase 1, Phase 2, Phase 3 Medusa Rig directive|"during reconnaissance" → "during reconnaissance AND deliberation AND verification dispatch."|
|Consul skill body|Phase 3 verification dispatch|"Dispatching the Censor and the Provocator's five lanes" → "Dispatching the Censor, the Provocator's five lanes, and the Glacialis." Same for plan-mode in edicts skill.|
|Drift-check script|Codex section list + agent file enumeration|Codex sections affected by amendments are re-synced. New `consilium-glacialis.md` agent file added to drift-check enumeration. Persona-body drift coverage scope (currently 5 lane agents) extended if appropriate.|
|`docs/CONSILIUM-VISION.md`|If the vision document references the verifier roster|Update reference enumeration. (Plan-time confirms whether reference exists.)|
|`claude/CLAUDE.md`|"User-scope agent customizations" enumeration|Add `consilium-glacialis.md` to the 12-file list (becoming 13 files).|

---

## 6. Confidence Map

|Section|Confidence|Evidence|
|-|-|-|
|§1 Motivation|High|DIV-100 evidence cited by Imperator; six blockers enumerated with shared root pattern.|
|§2 Goals|High|Imperator authorization message: "Authorized."|
|§3 Non-Goals|High|Conservative scoping derived from Imperator's "scoped to the verification stack and Rig/MCP discipline" framing in the deliberation.|
|§4.1 Cold Dispatch|High|Imperator approved exact framing. Heat-source 1 + 2 diagnosis traces directly to Codex Independence Rule and protocol §3, §4.|
|§4.2 Differential Tighten|High|Imperator approved. Mechanism named in protocol §12 surface.|
|§4.3 Glacialis Pass|High|Imperator approved. Role shape traces to cold-Consul DIV-100 catch behavior. Persona naming and tools list deferred to plan.|
|§4.4 Rig + MCP Imperative|High|Imperator approved. Surface gap traces to specific verifier body note text confirmed by direct read of `consilium-censor.md` and `consilium-provocator-negative-claim.md`.|
|§5 Doctrine Amendments|Medium|List is exhaustive to Consul's knowledge of current surface. Plan-time investigation will confirm additional drift points (e.g., brainstorming skill interactions, other templates).|
|§7 Success Criteria|High|Direct mapping from §2 Goals plus §4 Amendments.|
|§8 Out of Scope|High|Conservative scoping derived from Imperator's framing.|

---

## 7. Success Criteria

- A re-run of spec verification on an artifact equivalent to DIV-100 iteration 4 surfaces the six blockers (B1-B6) without further iteration:
  - Glacialis catches B1, B4, B5 via producer-consumer coupling enumeration.
  - Glacialis catches B6 via test-suite contradiction grep.
  - Rig + MCP imperative catches B2 via Medusa schema authority verification.
  - Cold dispatch (no Context Summary anchoring) plus Glacialis assumption-extraction surface catches B3.
- The Censor and Provocator lanes operate without Context Summary or Confidence Map inputs in their dispatch prompts and produce findings of equal or better quality (no regression in finding count or chain-of-evidence rigor on a control artifact).
- A spec verification iteration 2 on a body-content diff re-fires every lane, not just lanes whose declared surface intersects.
- Every verifier dispatched on a Medusa-touching artifact invokes `mcp__medusa__ask_medusa_question` at least once during its investigation. Matching `medusa-dev:*` skill is invoked when surface-detected, regardless of dispatcher prompt content.
- The Codex drift-check script passes after Codex amendments are applied; no agent-file copy lags behind canonical Codex text.
- The new `consilium-glacialis` agent dispatches successfully, returns findings in standard categories, and emits a trigger declaration with `coverage: "entire_artifact"`.

---

## 8. Out of Scope

- Implementation of `consilium-glacialis.md` agent file body content (plan-territory).
- Detailed wording of Codex section amendments (plan-territory).
- Persona naming for Glacialis (plan-territory; "Severus Glacialis" is a working hypothesis, not committed).
- Campaign Review verification changes — Glacialis is not added to Campaign Review in v1. (Future amendment: post-implementation structural audit may benefit from Glacialis-shape, but the cost/benefit is unclear without evidence of Campaign-review misses.)
- Tribunus persistent-orchestrator stance changes. Cold-dispatch applies at Tribunus spawn and 15-task restart boundaries, which is consistent with the Persistent Orchestrator class exception (the exception is in-window, not at-spawn).
- Cost optimization of seven-agent parallel dispatch (Censor + 5 lanes + Glacialis). The Imperator has explicitly authorized the cost on the grounds that DIV-100-class misses justify it.
- Cross-session persistence of trigger declarations and lane reports — out of scope per protocol §12 v1 boundary.
- Changes to the brainstorming or recon-phase Consul behavior beyond Rig/MCP timing.
- Changes to the Medicus diagnosis stance verification surface.
- Changes to the Custos dispatch-readiness verification (Custos receives plan + tribune-protocol; the cold-dispatch rule logically applies but Custos's six-walks doctrine is its own contract — adoption deferred to a separate amendment if needed).
