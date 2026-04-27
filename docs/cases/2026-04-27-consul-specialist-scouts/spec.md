# Spec: Consul Specialist Scouts

|field|value|
|-|-|
|Date|2026-04-27|
|Author|Publius Auctor (Consul)|
|Imperator|Milovan|
|Status|Draft (pre-verification)|
|Case|`2026-04-27-consul-specialist-scouts`|

## 1. Problem

The post-spec verification round routinely surfaces GAP and MISUNDERSTANDING findings whose root cause is *terrain misreading*. The Consul reads the codebase incorrectly during reconnaissance, bakes the wrong understanding into the spec, and the Censor or Provocator catches it after the artifact is written. DIV-100 incorporated eight terrain-flavored verifier GAPs into its iteration-2 spec (`docs/cases/2026-04-27-div-100-non-apparel-saved-product/spec.md:9`).

Two structural causes:

1. **Generalist scouts return generalist intel.** The current `consilium-scout` carries the Invocation but no repo-specific discipline. It can ride into any terrain, but it doesn't know the canonical paths, hard rules, or prior-art patterns of either Divinipress repo. It returns what it finds; it doesn't return what it *should have looked for.*

2. **Institutional memory is unused.** Every Censor finding, every Provocator GAP, every CONCERN that was upgraded or rejected sits in `$CONSILIUM_DOCS/cases/`. The reconnaissance phase has no mechanism to learn from prior failures.

## 2. Goals (WHAT and WHY)

1. **Specialist scouts with baked-in repo discipline** — frontend, backend, and integration scouts whose system prompts carry canonical paths, hard rules, scope contracts, and a Pitfalls Compendium mined from the case archive. *Why: terrain misreading drops when the scout knows what terrain it's in.*

2. **Lane-driven dispatch with magistrate judgment** — Consul reads the brainstorm, articulates which lanes the work touches, confirms with the Imperator in one line, dispatches matching specialists. *Why: prevents wasted dispatches and keeps lane choice with the magistrate, not a routing table.*

3. **Institutional memory as scout discipline** — case-archive findings distilled into per-lane Pitfalls Compendia, baked into agent files, refreshed periodically. *Why: every wound the Consilium has taken becomes prophylaxis for the next spec.*

4. **Imperator-controlled multiplicity for complex specs** — "send 2 backend scouts" splits surface between scouts at the magistrate's discretion. *Why: deep terrain dives at Imperator's call, no mode flag ceremony.*

## 3. Non-goals

- No change to Censor or Provocator verification behavior.
- No retirement of the existing `consilium-scout`. It retains its role for non-Divinipress / meta-Consilium recon and serves as triage scout when lane ambiguity blocks specialist dispatch.
- No doctrine specialist scout. Doctrine reading remains the Consul's own discipline.
- No depth flag, mode toggle, or `--swarm` parameter. All depth/multiplicity decisions are plain-language Imperator triggers.
- No dynamic case-archive retrieval at scout dispatch time (out of scope for MVP; static compendium only).
- No automated post-case compendium refresh. Manual Imperator trigger only.

## 4. Architecture

### 4.1 Specialist scout agents

Three new agents are created at user-scope (`~/.claude/agents/`):

|agent|file|surface|stance|
|-|-|-|-|
|`consilium-scout-frontend`|`~/.claude/agents/consilium-scout-frontend.md`|`divinipress-store/` (storefront + admin)|retrieval, not verification|
|`consilium-scout-backend`|`~/.claude/agents/consilium-scout-backend.md`|`divinipress-backend/` (Medusa modules, workflows, links, routes)|retrieval, not verification|
|`consilium-scout-integration`|`~/.claude/agents/consilium-scout-integration.md`|the wire between the two repos (SDK, custom routes, shared types)|retrieval, not verification|

Each agent file carries:

- The Consilium **Invocation** (verbatim from `consilium-scout`)
- A **scope contract** in `You own:` / `You refuse:` form (see §4.2)
- A **tool allowlist** appropriate to the surface (plan-level detail; allowlist must enable the owned scope and disable cross-surface calls that would invite scope creep)
- A **`## Pitfalls Compendium`** section (see §4.4)
- An explicit **stance declaration**: "I retrieve facts. I do not produce findings under Codex categories. I am not a verifier."

The existing `consilium-scout` at `~/.claude/agents/consilium-scout.md` is retained unchanged in role and contract; it is no longer the default Consul scout but remains available for triage and non-Divinipress contexts.

### 4.2 Scope contract — `You own:` / `You refuse:`

Each specialist's system prompt declares its scope as a contract. The contract is a hard boundary: when a dispatched question strays outside the owned scope, the agent refuses with a pointer to the correct sibling rather than improvising.

Contract requirements per specialist:

|specialist|owns (categorically)|refuses (categorically)|
|-|-|-|
|frontend|terrain in `divinipress-store/` and `divinipress-store/src/admin/` — file paths, symbol confirmation, line-cited evidence of existing patterns/components, slice and store boundaries, hydration discipline, prior-art for the component or flow being designed|backend behavior claims, Medusa workflow logic, cross-repo wire-shape claims, business-logic interpretation derived from a storefront call site|
|backend|Medusa modules, workflows, route handlers, `link.create` boundaries, `query.graph` patterns, idempotency anchors, subscriber boundaries — line-cited evidence from `divinipress-backend/src/`|storefront UI claims, frontend hard-rule judgments, admin-widget behavior inferred from a workflow's audit log|
|integration|the wire — SDK call sites and the route handlers they reach, custom route shapes (`/store/...`, `/admin/...`), shared types in `divinipress-types`, request/response semantics, status-code contracts|deep internal logic on either side. Walks to the boundary, reports the boundary, points at the matching specialist for internals|

**Refusal contract.** A refusal must (a) name the out-of-scope subject, (b) name the correct sibling specialist, (c) return without speculating. Refusals are not findings; they are terminations.

### 4.3 Dispatch model

The Consul reconnaissance phase replaces the current "dispatch a `consilium-scout`" pattern with the following decision sequence:

1. **Magistrate reading.** Consul reads the brainstorm and articulates in one line of conversation output which lanes the work touches: *"Reading this as backend + integration. Dispatching unless you redirect."* This commits the lane reading to text before any token is spent on dispatch.

2. **Imperator confirmation or redirect** in one line. Plain language. No flag.

3. **Lane-matched specialist dispatch.** Specialists fire in parallel for confirmed lanes with focused questions sharpened by the lane confirmation.

4. **Brief magistrate exchange** when the magistrate reading is uncertain. Two or three sharp narrowing questions before any scout dispatch. No scouts during exchange.

5. **Generalist triage scout fallback** when even exchange fails to narrow lanes (open-ended discovery, Imperator unsure of surface). The retained `consilium-scout` reads the brainstorm and reports which lanes the work touches; specialists then deploy.

6. **Self-correction safety net.** If a specialist receives an out-of-scope question (lane reading was wrong), it refuses per §4.2; Consul redispatches to the correct specialist.

**Multiplicity** is Imperator-driven via plain language. *"Send 2 backend scouts on this one"* dispatches two backend scouts; Consul splits the surface between them at the magistrate's judgment. No mode flag, no parameter; just conversation.

**The pattern in one line:** think → state lane → confirm → dispatch. Never the inversion.

### 4.4 Pitfalls Compendium

Each specialist agent file carries a `## Pitfalls Compendium` section. Contract:

- **Format:** one-line lessons, each with a citation. Bullet list.
- **Citation format:** `*(case: <case-dir-name>, <verifier-role>: <finding-class>)*` — e.g. `*(case: 2026-04-27-div-100-non-apparel-saved-product, Censor: GAP §3)*`
- **Scope:** lessons applicable to the specialist's owned surface only. Cross-cutting lessons (e.g., "money-path mutations need idempotency anchors at the cart-level") are duplicated to all relevant specialists.
- **Source:** mined from `$CONSILIUM_DOCS/cases/` by the case-mining scout (§4.5).
- **Refresh trigger:** manual, Imperator plain-language request ("refresh the pitfalls compendium"). Consul re-dispatches the mining scout; specialist agent files are regenerated with the updated compendia.

The compendium does not change the agent's stance (retrieval, not verification). It changes what the agent *knows to look for* and *knows not to assume*.

### 4.5 Case-mining scout contract

A scout dispatched (a) once at agent-file creation time and (b) on every manual refresh.

**Input:** the full `$CONSILIUM_DOCS/cases/` archive — every spec, every Censor report, every Provocator report (across all five lanes), every plan-verification, every soldier completion report.

**Output contract:** a structured set of per-lane compendia. For each surface (frontend, backend, integration), a list of one-line lessons. Each lesson:

- Distilled from one or more verifier findings
- Cited back to the source case and the verifier finding identifier
- Applicable to terrain inside the specialist's owned scope (lessons inapplicable to any specialist surface are dropped)

**Classification rules:**

- Findings citing files under `divinipress-store/` → frontend lane
- Findings citing files under `divinipress-backend/src/api/`, `divinipress-backend/src/workflows/`, `divinipress-backend/src/modules/`, `divinipress-backend/src/links/`, `divinipress-backend/src/subscribers/` → backend lane
- Findings citing the SDK boundary, custom route shapes, or `divinipress-types` package → integration lane
- Findings citing meta-Consilium / infrastructure surfaces (skill files, agent files, hooks) → excluded from all specialist compendia

**Cross-cutting lessons** (e.g. domain invariants that apply on both sides of the wire) are duplicated to every relevant specialist's compendium with the same citation.

The path-specific classification above follows standard Medusa module-system conventions. Exact path boundaries against the actual `divinipress-backend` repo structure are confirmed by the mining scout at dispatch time; contractually, classification follows the surface ownership in §4.2 — terrain owned by a specialist receives lessons from findings that cite that terrain.

### 4.6 Consul skill changes

The Consul skill at `claude/skills/consul/SKILL.md`, Phase 1 (Reconnaissance), is updated:

- The "I dispatch scouts" doctrine is rewritten to codify the decision sequence in §4.3.
- The think→state→confirm→dispatch pattern is explicit doctrine.
- The retained generalist scout is documented as triage fallback and non-Divinipress recon.
- The Imperator-driven multiplicity convention is documented.

The change is to Phase 1 only. Phases 0, 2, and 3 of the Consul are untouched.

## 5. Success criteria

Observable outcomes:

1. **Specialist agent files exist** at the three paths in §4.1, each carrying Invocation + scope contract + tool allowlist + Pitfalls Compendium + stance declaration.
2. **Generalist scout retained** at its current path with no contract change.
3. **Consul skill Phase 1 prose** dispatches lane-specialists by default, with the decision sequence in §4.3 documented inline.
4. **Pitfalls Compendia populated** at agent-file creation by the mining scout. At least one lesson per specialist on the first run.
5. **Refusal contract verified** by at least one cross-surface dispatch test before declaring done — dispatching the frontend scout with a backend question must produce a refusal with sibling pointer, not a speculation.
6. **Probation measurement plan** for the integration scout: track verifier findings on the next cross-repo specs; if seam-specific findings the integration scout caught are zero across N cases (N to be set by Imperator), the integration scout is killed and its compendium folded into frontend + backend.

## 6. Deliverables (ordered by dependency)

1. **Case-mining scout** — one-time dispatch. Output is the per-lane Pitfalls Compendia. Must run before agent files can be authored with their compendia baked in.
2. **`consilium-scout-frontend.md`** — agent file. Built with frontend compendium baked in.
3. **`consilium-scout-backend.md`** — agent file. Built with backend compendium baked in.
4. **`consilium-scout-integration.md`** — agent file. Built with integration compendium baked in.
5. **Consul skill Phase 1 update** — `claude/skills/consul/SKILL.md`. Dispatch model rewritten per §4.3.
6. **Refusal-contract verification test** — one cross-surface dispatch per specialist. Must produce refusal-with-pointer, not speculation.
7. **Compendium refresh ritual documentation** — one paragraph in the Consul skill describing the manual Imperator trigger.

## 7. Confidence map

|section|confidence|evidence|
|-|-|-|
|§1 Problem|High|DIV-100 incorporated 8 terrain-flavored GAPs (case file, line 9). Imperator confirmed terrain-driven misunderstandings in deliberation.|
|§2 Goals|High|All four goals confirmed across deliberation rounds with the Imperator.|
|§3 Non-goals|High|Each non-goal corresponds to an Imperator decision in deliberation (cut doctrine scout, retain generalist, no mode flag, manual refresh, static MVP).|
|§4.1 Specialist agents|High|Names, paths, surfaces, stance all confirmed.|
|§4.2 Scope contract|High|Owns/refuses categories deliberated and accepted by Imperator.|
|§4.3 Dispatch model|High|Six-step sequence is the *think→state→confirm→dispatch* pattern explicitly confirmed.|
|§4.4 Pitfalls Compendium|High|Format, scope, refresh trigger confirmed.|
|§4.5 Case-mining scout contract|Medium|Concept agreed; classification rules and exclusion rules are my synthesis from doctrine reading and code-map paths. Imperator did not deliberate the exact boundaries.|
|§4.6 Consul skill changes|Medium|Imperator confirmed Phase 1 changes are needed but did not deliberate exact prose. Plan layer will own the prose.|
|§5 Success criteria|Medium|Items 1–5 are direct contract outcomes; item 6 (probation measurement) carries a numerical threshold left to Imperator's judgment.|
|§6 Deliverables|High|Ordering follows dependency chain explicitly walked in deliberation.|

## 8. Open items flagged for Imperator review

- **§4.5 mining-scope boundaries** — exclusion of meta-Consilium / infrastructure findings is a magistrate's call. Imperator may want infrastructure lessons available to specialists if they happen to apply to a specialist surface. *Default: exclude. Override: tell me at review.*
- **§5 success criterion 6 — probation threshold N** — not specified. Imperator's call. *Default: 5 cross-repo specs. Override: tell me at review.*
- **§4.4 refresh trigger** — manual Imperator-triggered. Alternative: hook into the existing `consilium:audit` skill so the compendium auto-refreshes after every approved post-implementation audit. *Default: manual. Override: tell me at review.*

## 9. Risk and cost

- **Token cost.** Specialist dispatch with three scouts in parallel triples reconnaissance cost vs single generalist. Mitigation: lane-driven dispatch (only matching specialists fire); Imperator-driven multiplicity (Imperator controls when to deepen).
- **Stale compendium.** Manual refresh means compendia drift if Imperator forgets. Mitigation: refresh triggered explicitly when new failure patterns surface; periodic Consul-prompted reminder ("compendium last refreshed N cases ago — refresh?").
- **Wrong-lane dispatch.** Specialist receives out-of-scope question. Mitigation: §4.2 refusal contract. Cost of wrong dispatch is one wasted call, not a wrong-direction spec.
- **Integration scout earns no keep.** Probation criterion in §5 item 6 governs.
