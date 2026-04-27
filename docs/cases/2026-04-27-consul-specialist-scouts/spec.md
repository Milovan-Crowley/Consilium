# Spec: Consul Specialist Scouts

|field|value|
|-|-|
|Date|2026-04-27|
|Author|Publius Auctor (Consul)|
|Imperator|Milovan|
|Status|Iteration 2 (post-verification — 18 keepers applied, 9 rejections in `verification-rejections.md`)|
|Case|`2026-04-27-consul-specialist-scouts`|

## 1. Problem

The post-spec verification round routinely surfaces GAP and MISUNDERSTANDING findings whose root cause is *terrain misreading*. The Consul reads the codebase incorrectly during reconnaissance, bakes the wrong understanding into the spec, and the Censor or Provocator catches it after the artifact is written. DIV-100 incorporated eight verifier GAPs into its iteration-2 spec (`docs/cases/2026-04-27-div-100-non-apparel-saved-product/spec.md:9`); the majority cite codebase facts.

Two structural causes:

1. **Generalist scouts return generalist intel.** The current `consilium-scout` carries the Invocation but no repo-specific discipline. It can ride into any terrain, but it doesn't know the canonical paths, hard rules, or prior-art patterns of either Divinipress repo. It returns what it finds; it doesn't return what it *should have looked for.*

2. **Institutional memory is unused.** Every Censor finding, every Provocator GAP, every CONCERN that was upgraded or rejected sits in `$CONSILIUM_DOCS/cases/`. The reconnaissance phase has no mechanism to learn from prior failures.

## 2. Goals (WHAT and WHY)

1. **Specialist scouts with baked-in repo discipline** — frontend, backend, and integration scouts whose system prompts carry canonical paths, hard rules, scope contracts, and a Pitfalls Compendium mined from the case archive. *Why: terrain misreading drops when the scout knows what terrain it's in.*

2. **Lane-driven dispatch with magistrate judgment** — Consul reads the brainstorm, articulates which lanes the work touches, confirms with the Imperator in one line, dispatches matching specialists. *Why: prevents wasted dispatches and keeps lane choice with the magistrate, not a routing table.*

3. **Institutional memory as scout discipline** — case-archive findings distilled into per-lane Pitfalls Compendia, baked into agent files, refreshed periodically. *Why: every wound the Consilium has taken becomes prophylaxis for the next spec.*

4. **Imperator-controlled multiplicity for complex specs** — "send 2 backend scouts" splits surface between scouts at the magistrate's discretion. *Why: deep terrain dives at Imperator's call, no mode flag ceremony.*

## 3. Non-goals

- No change to Censor or Provocator verification *evaluation logic*. Verification protocol's role table will be updated to enumerate the new specialist subagents (§4.7) — vocabulary update only; grading semantics untouched.
- No retirement of the existing `consilium-scout`. The agent file is retained unchanged; the role shifts from default Consul scout to (a) triage fallback when lane reading fails and (b) recon for zero-lane brainstorms (meta-Consilium / infrastructure work).
- No doctrine specialist scout. Doctrine reading remains the Consul's own discipline.
- No depth flag, mode toggle, or `--swarm` parameter. All depth/multiplicity decisions are plain-language Imperator triggers.
- No dynamic case-archive retrieval at scout dispatch time (out of scope for MVP; static compendium only).
- MVP excludes automated post-case compendium refresh; manual Imperator trigger is the default. Auto-refresh via the existing `consilium:audit` skill is flagged for Imperator override at §8.

## 4. Architecture

### 4.1 Specialist scout agents

Three new agents are created at user-scope (`~/.claude/agents/`):

|agent|file|surface|stance|
|-|-|-|-|
|`consilium-scout-frontend`|`~/.claude/agents/consilium-scout-frontend.md`|`divinipress-store/` (storefront + admin)|retrieval, not verification|
|`consilium-scout-backend`|`~/.claude/agents/consilium-scout-backend.md`|`divinipress-backend/` (Medusa modules, workflows, links, routes)|retrieval, not verification|
|`consilium-scout-integration`|`~/.claude/agents/consilium-scout-integration.md`|the wire between the two repos (SDK, custom routes, shared types)|retrieval, not verification|

Each agent file carries:

- The Consilium **Invocation** (verbatim from `consilium-scout`).
- A **scope contract** in `You own:` / `You refuse:` form (see §4.2).
- A **tool allowlist** appropriate to the surface — see also the **filesystem-access constraint** in §4.1.1.
- A **`## Pitfalls Compendium`** section (see §4.4).
- An explicit **stance declaration** in second-person form, matching the canonical scout: *"You retrieve facts. You do not produce findings under Codex categories. The MISUNDERSTANDING/GAP/CONCERN/SOUND vocabulary applies to verifiers."*

The existing `consilium-scout` file at `~/.claude/agents/consilium-scout.md` is retained with no body changes; what shifts is its role assignment in dispatcher prose. Per §3, the generalist serves as triage fallback (when lane reading fails) and zero-lane recon (meta-Consilium / infrastructure brainstorms).

### 4.1.1 Filesystem-access constraint

Specialist scopes must be enforceable beyond prose. Each specialist's filesystem access is constrained at the tool-allowlist or MCP-filter layer such that:

- `consilium-scout-frontend` cannot read paths under `divinipress-backend/` **except** `divinipress-backend/src/admin/` (Medusa admin UI is React-rendered and lives structurally in the backend repo, but is functionally frontend-discipline territory per §4.2).
- `consilium-scout-backend` cannot read paths under `divinipress-store/`, and refuses questions about `divinipress-backend/src/admin/` (which is owned by the frontend specialist per the carve above).
- `consilium-scout-integration` reads both repos but only at the boundary (SDK call sites, route handlers, shared types).

The plan layer picks the enforcement mechanism. The contract is the *inability to speculate cross-surface even if prose-refusal degrades*. This makes the §4.2 refusal contract structural rather than purely behavioral.

### 4.2 Scope contract — `You own:` / `You refuse:`

Each specialist's system prompt declares its scope as a contract. The contract is a hard boundary: when a dispatched question strays outside the owned scope, the agent refuses with a pointer to the correct sibling rather than improvising.

Contract requirements per specialist:

|specialist|owns (categorically)|refuses (categorically)|
|-|-|-|
|frontend|terrain in `divinipress-store/` and the Medusa Admin UI at `divinipress-backend/src/admin/` (React-rendered admin extensions live in the backend repo but are functionally frontend-discipline territory) — file paths, symbol confirmation, line-cited evidence of existing patterns/components, slice and store boundaries, hydration discipline, prior-art for the component or flow being designed|backend behavior claims (workflows, modules, links, subscribers, route handlers), Medusa workflow logic, cross-repo wire-shape claims, business-logic interpretation derived from a storefront call site|
|backend|Medusa modules, workflows, route handlers, `link.create` boundaries, `query.graph` patterns, idempotency anchors, subscriber boundaries — line-cited evidence from `divinipress-backend/src/`|storefront UI claims, frontend hard-rule judgments, admin-widget behavior inferred from a workflow's audit log|
|integration|the wire — SDK call sites and the route handlers they reach, custom route shapes (`/store/...`, `/admin/...`), shared types where they exist (currently ad-hoc cross-repo; integration scout reads the boundary regardless of whether a shared types package is consolidated), request/response semantics, status-code contracts|deep internal logic on either side. Walks to the boundary, reports the boundary, points at the matching specialist for internals|

**Refusal contract.** A refusal must (a) name the out-of-scope subject, (b) name the correct sibling specialist OR — when no specialist owns the surface (cross-all-three-scopes or meta-Consilium) — point back to the generalist `consilium-scout`, (c) return without speculating. Refusals are not findings; they are terminations.

### 4.3 Dispatch model

The Consul reconnaissance phase replaces the current "dispatch a `consilium-scout`" pattern with the following decision sequence:

1. **Magistrate reading.** Consul reads the brainstorm and articulates in one line of conversation output which lanes the work touches: *"Reading this as backend + integration. Dispatching unless you redirect."* This commits the lane reading to text before any token is spent on dispatch.

2. **Imperator confirmation or redirect** in one line. Plain language. No flag. **If the Imperator does not respond in plain language (silence, ambiguity, clarifying-question response), Consul holds — does not auto-dispatch. Consul re-asks if necessary.**

3. **Lane-matched specialist dispatch.** Specialists fire in parallel for confirmed lanes with focused questions sharpened by the lane confirmation.

4. **Brief magistrate exchange** when the magistrate reading is uncertain. Two or three sharp narrowing questions before any scout dispatch. No scouts during exchange.

5. **Generalist triage scout fallback** when even exchange fails to narrow lanes (open-ended discovery, Imperator unsure of surface). The retained `consilium-scout` reads the brainstorm and reports which lanes the work touches; specialists then deploy.

6. **Self-correction safety net.** If a specialist receives an out-of-scope question, it refuses per §4.2; Consul redispatches to the correct specialist. **Maximum 2 redispatch attempts in a refusal chain (mirrors Codex Auto-Feed Loop). If both refuse, escalate to Imperator.**

7. **Zero-lane brainstorm.** When the brainstorm touches none of frontend / backend / integration (meta-Consilium work, infrastructure, doctrine), specialist dispatch is skipped entirely. Consul dispatches the generalist `consilium-scout` directly. *This very spec is a zero-lane brainstorm.*

**Multiplicity** is Imperator-driven via plain language. *"Send 2 backend scouts on this one"* dispatches two backend scouts; Consul splits the surface between them at the magistrate's judgment. No mode flag, no parameter; just conversation.

**The pattern in one line:** think → state lane → confirm → dispatch. Never the inversion.

### 4.4 Pitfalls Compendium

Each specialist agent file carries a `## Pitfalls Compendium` section. Contract:

- **Format:** one-line lessons, each with a citation. Bullet list.
- **Citation format:** `*(case: <case-dir-name>, <verifier-role>: <finding-class>)*` — e.g. `*(case: 2026-04-27-div-100-non-apparel-saved-product, Censor: GAP §3)*`.
- **Scope:** lessons applicable to the specialist's owned surface only. Cross-cutting lessons are duplicated to all relevant specialists with the same citation.
- **Source:** mined from `$CONSILIUM_DOCS/cases/` by the case-mining scout (§4.5).
- **Growth bound:** soft cap of ~50 lessons per specialist. When the cap is exceeded on refresh, the mining scout retains the most recent and most cross-cutting lessons (multi-case-cited lessons score higher); older single-case lessons are evicted. The cap is a target; the mining scout exercises judgment.
- **Refresh semantics:** the mining scout regenerates from scratch on every refresh — *overwrite, not append*. This avoids duplicate lessons accruing across cycles.
- **Refresh trigger:** manual, Imperator plain-language request to the Consul ("refresh the pitfalls compendium"). The trigger is Consul-scoped — Medicus and Legatus do not initiate refreshes, though they may surface stale-compendium signals to the Imperator. Consul re-dispatches the mining scout; specialist agent files are regenerated with the updated compendia.
- **Staleness signal:** each compendium's `## Pitfalls Compendium` heading is followed by a `last_refreshed: YYYY-MM-DD` line. The Consul reads it at session start; the Imperator decides whether to refresh based on the signal. No automated reminder exists in MVP.

The compendium does not change the agent's stance (retrieval, not verification). It changes what the agent *knows to look for* and *knows not to assume*.

### 4.5 Case-mining scout contract

A scout dispatched (a) once at agent-file creation time and (b) on every manual refresh.

**Input:** the full `$CONSILIUM_DOCS/cases/` archive — every spec, every Censor report, every Provocator report, every plan-verification, every soldier completion report.

**Archive heterogeneity.** The archive contains cases from before and after the Provocator five-lane decomposition. The mining scout treats verifier reports uniformly: a single `consilium-provocator` report (legacy) and any of the five lane reports (current) are all valid finding sources. The mining scout does not distinguish iteration count or report shape.

**Output schema.** The mining scout returns three drop-in markdown blocks ready to paste under each agent file's `## Pitfalls Compendium` heading. Each block contains:

- A `last_refreshed: YYYY-MM-DD` line at the top (today's date at refresh time).
- A bulleted lesson list per §4.4 format.
- For empty surfaces: a single `_No archive findings yet for this surface._` placeholder line in lieu of the bulleted list.

**Classification rules:**

- Findings citing files under `divinipress-store/` → frontend lane.
- Findings citing files under `divinipress-backend/src/api/`, `/workflows/`, `/modules/`, `/links/`, `/subscribers/` → backend lane.
- Findings citing the SDK boundary, custom route shapes, or shared cross-repo types → integration lane.
- Findings citing files outside the enumerated specialist surfaces, or findings about *behavior* that cite no files: classified by the §4.2 surface ownership of the *subject matter*, not the file path. The mining scout exercises judgment; ambiguous findings default to cross-cutting (duplicated to all specialists).
- Findings citing meta-Consilium / infrastructure surfaces (skill files, agent files, hooks): excluded from all specialist compendia.

**Cross-cutting lessons** (e.g. domain invariants that apply on both sides of the wire) are duplicated to every relevant specialist's compendium with the same citation.

**Empty / sparse surface handling.** If a specialist's surface has zero applicable findings (early Consilium, integration scout's common case), the mining scout returns the placeholder block per the output schema. The agent file is created with that placeholder section; this is not a failure state.

### 4.6 Consul skill changes

The Consul skill at `/Users/milovan/projects/Consilium/claude/skills/consul/SKILL.md` is updated in two phases:

- **Phase 1 (Reconnaissance):** the "I dispatch scouts" doctrine is rewritten to codify the dispatch model in §4.3. The think → state → confirm → dispatch pattern becomes explicit doctrine. The retained generalist is documented as triage fallback and zero-lane recon. The Imperator-driven multiplicity convention is documented.
- **Phase 3 (Codification, ambiguity elimination):** the codebase-ambiguity scout dispatch (currently a generic scout reference) is updated to invoke the same lane-driven dispatch model.

Phases 0 and 2 of the Consul are untouched.

### 4.7 Cross-skill scope

The lane-driven dispatch model extends to three other surfaces:

- **Tribune SKILL.md** (Medicus reconnaissance scout dispatch): updated to lane-driven specialist dispatch. The Medicus's existing debug-lane taxonomy in `$CONSILIUM_DOCS/doctrine/lane-classification.md` (storefront / storefront-super-admin / admin-dashboard / medusa-backend / cross-repo / unknown) maps to specialist scouts as: storefront/super-admin/admin-dashboard → frontend, medusa-backend → backend, cross-repo → integration, unknown → generalist triage.
- **Edicts SKILL.md** (Legatus codebase-verification scout dispatch): updated to lane-driven specialist dispatch.
- **Verification protocol** (`claude/skills/references/verification/protocol.md` §2 Dispatch Mechanics role table): the new specialist subagent types are enumerated alongside `consilium-scout`.

These updates are line-level (replacing one dispatch reference or extending a table); they do not expand the skill files structurally. After implementation, no skill in the Consilium dispatches the bare `consilium-scout` for Divinipress recon by default — all such dispatches go through lane-driven specialist routing.

## 5. Success criteria

Observable outcomes:

1. **Specialist agent files exist** at the three paths in §4.1, each carrying Invocation + scope contract + tool allowlist + filesystem-access constraint + Pitfalls Compendium + canonical stance declaration.
2. **Generalist scout retained** at its current path with no body change. Role-shift documented in dispatcher prose (Consul, tribune, edicts, verification protocol).
3. **Consul skill Phase 1 + Phase 3 prose** dispatches lane-specialists by default; Phase 3 ambiguity-scout dispatch updated to match.
4. **Pitfalls Compendia populated** at agent-file creation by the mining scout. For every specialist surface that has applicable findings in the case archive, the mining scout returns at least one lesson. Empty-archive surfaces get the `_No archive findings yet for this surface._` placeholder per §4.5; this is not a failure.
5. **Refusal contract verified** by at least one cross-surface dispatch test before declaring done. The scout's response must contain only (a) the refusal naming the out-of-scope subject, (b) the sibling pointer (or generalist pointer if no specialist owns), (c) no claims about the refused subject. Any content beyond these three elements is a fail.
6. **Probation review** for the integration scout. After N cross-repo specs (N at §8; default 5), Imperator reviews the integration scout's output history and decides retain or kill. The decision is judgment-based, not mechanical: Imperator judges whether the integration scout's outputs surfaced terrain that frontend + backend specialists running in parallel would not have caught. If killed, the integration compendium folds into frontend + backend.
7. **Cross-skill consistency.** Tribune, edicts, and the verification protocol's role table updated to use the same dispatch model.

## 6. Deliverables (ordered by build readiness)

1. **Case-mining scout** — one-time dispatch. Output is the per-lane Pitfalls Compendia per §4.5 output schema. Must run before agent files can be authored with their compendia baked in.
2. **`consilium-scout-frontend.md`** — agent file with frontend compendium baked in.
3. **`consilium-scout-backend.md`** — agent file with backend compendium baked in.
4. **`consilium-scout-integration.md`** — agent file with integration compendium baked in.
5. **Consul skill Phase 1 + Phase 3 update** — `claude/skills/consul/SKILL.md`. Dispatch model rewritten per §4.3 in Phase 1; ambiguity-scout dispatch updated to match in Phase 3.
6. **Refusal-contract verification test** — one cross-surface dispatch per specialist. Must produce refusal-with-pointer and no claims about the refused subject.
7. **Compendium refresh ritual documentation** — paragraph in the Consul skill describing the manual Imperator trigger and the staleness-signal convention.
8. **Tribune SKILL.md update** — line-level dispatch reference change to lane-driven dispatch.
9. **Edicts SKILL.md update** — line-level dispatch reference change to lane-driven dispatch.
10. **Verification protocol update** — `claude/skills/references/verification/protocol.md` §2 Dispatch Mechanics role table extended with new specialist subagent types.

## 7. Confidence map

|section|confidence|evidence|
|-|-|-|
|§1 Problem|High|DIV-100 incorporated 8 verifier GAPs (case file, line 9); majority cite codebase facts. Imperator confirmed terrain-driven misunderstandings in deliberation.|
|§2 Goals|High|All four goals confirmed across deliberation rounds.|
|§3 Non-goals|High|Each non-goal corresponds to an Imperator decision.|
|§4.1 Specialist agents|High|Names, paths, surfaces, stance all confirmed. Stance wording aligned to canonical `consilium-scout.md` per Censor finding.|
|§4.1.1 Filesystem-access constraint|High|Promoted from Censor CONCERN — refusal contract becomes structural via tool-allowlist enforcement.|
|§4.2 Scope contract|High|Owns/refuses categories deliberated and accepted. Refusal-pointer-to-generalist clause added per Edge-case finding. `divinipress-types` softened per Censor finding.|
|§4.3 Dispatch model|High|Seven-step sequence is the *think→state→confirm→dispatch* pattern with operational fence-posts (silence handling, refusal-loop cap, zero-lane clause) added per Provocator findings.|
|§4.4 Pitfalls Compendium|High|Format, scope, refresh trigger confirmed. Growth bound, refresh semantics, staleness signal added per Provocator findings.|
|§4.5 Case-mining scout contract|Medium|Output schema, heterogeneity acknowledgement, empty-archive handling, classification fallback added per verification findings. Exact path enumeration is mining-scout judgment territory.|
|§4.6 Consul skill changes|High|Phase 1 + Phase 3 scope confirmed. Path anchor corrected per Censor finding.|
|§4.7 Cross-skill scope|Medium|Brings tribune, edicts, verification protocol into scope per Negative-claim findings. Each change is line-level; the line-level shape is contract.|
|§5 Success criteria|Medium|Items 1–5, 7 are direct contract outcomes; item 6 (probation) is honestly relabeled as Imperator's judgment-based call.|
|§6 Deliverables|High|Ordering follows build readiness. Cross-skill items added per §4.7.|

## 8. Open items flagged for Imperator review

- **§5 #6 probation threshold N** — default 5 cross-repo specs. Override: tell me at edicts time.
- **§4.4 refresh trigger** — manual default. Alternative: hook into `consilium:audit` for auto-refresh post-implementation. Override: tell me at edicts time.

## 9. Risk and cost

- **Token cost.** Specialist dispatch with multiple scouts in parallel multiplies reconnaissance cost vs single generalist. Mitigation: lane-driven dispatch fires only matching specialists; Imperator-driven multiplicity controls deepening. Cost bound is per dispatch, not per spec.
- **Stale compendium.** Manual refresh means compendia drift if Imperator forgets. The §4.4 staleness signal (`last_refreshed: YYYY-MM-DD` per compendium) gives the Consul something to read at session start; whether to act is the Imperator's call. No automated reminder.
- **Wrong-lane dispatch.** Specialist receives out-of-scope question. Mitigation: §4.2 refusal contract + §4.1.1 filesystem-access constraint. Cost of wrong dispatch is bounded — one wasted call, with §4.3 step 6 capping the redispatch chain at 2.
- **Integration scout earns no keep.** §5 #6 probation review governs the kill/retain decision.
- **Cross-skill churn.** Bringing tribune, edicts, and the verification protocol into scope (§4.7) means changes to four skill files instead of one. Mitigation: each change is line-level (dispatch reference replacement or table extension), not structural.
