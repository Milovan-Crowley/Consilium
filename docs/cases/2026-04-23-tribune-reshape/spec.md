# /tribune Reshape and the Medusa Rig — Design Specification

**Date:** 2026-04-23
**Author:** Publius Auctor (Consul of the Consilium)
**Status:** Draft v3, revised after v2 verification

---

## Revision Note

### v1 → v2 — Three MISUNDERSTANDING corrections

1. **Medusa MCP state.** v1 listed five user-scope agents as needing the Medusa MCP added. The Censor read the actual frontmatter of every agent; all five already carry `mcp__medusa__ask_medusa_question` + `medusa` in `mcpServers`. v2 flips Deliverable 6's agent work to body-content additions only.

2. **"Attach" vocabulary.** v1 described Consul/Edicts/Legion/March/Tribune as "attaching" Medusa skills via `Skill(...)`. The Provocator correctly observed that `Skill()` is a one-shot per-turn invocation, not a durable binding. v2 replaces "attach" throughout with explicit per-session semantics: main-session personas invoke `Skill()` for their own reasoning; dispatchers NAME the required skill in subordinate prompts for the subordinate to invoke.

3. **Known-gaps Route-field translation.** v1's port protocol was silent on Codex fork entries referencing foreign ranks. v2 made the translation explicit (but incompletely — see v2 → v3 below).

### v2 → v3 — One MISUNDERSTANDING correction

4. **Rank translation table was incomplete.** v2 mapped four Codex ranks; Provocator v2 caught that `KG-NON-APPAREL-OPTIONS` references `consilium-centurio-front` which was unmapped. A complete `rg` of the Codex known-gaps file surfaced seven unique ranks: `consilium-arbiter`, `consilium-speculator-back`, `consilium-centurio-back`, `consilium-centurio-front`, `consilium-interpres-front`, `consilium-consul`, `consilium-tribunus`. v3 maps all seven, including the two ranks whose names are shared with ours (Consul and Tribunus — no translation needed, they route to our Consul and our Tribunus).

### v2 → v3 GAPs resolved (five)

- **G1.** `campaign-review.md` dropped from the stance-declaration list (Censor). That template dispatches Censor + Praetor + Provocator, not Tribunus; no stance declaration is possible. Only `mini-checkit.md` and the new `tribune-verification.md` need stance declarations.
- **G2.** Case-file state machine added (Provocator). Top-level `Status:` field in the case template. States: `draft`, `rejected`, `approved`, `routed`, `contained`, `closed`, `abandoned`.
- **G3.** Phase 1 scan filter specified (Provocator). Date-range cap (last 90 days by default); `Resolves:` cross-reference field; Phase 1 surfaces only cases in `status: contained` with no resolving case.
- **G4.** `storefront-super-admin` lane now operationally distinct (Provocator). Added `lane-guides/storefront-super-admin-debugging.md` with permission-scope checks, cross-company visibility discipline, super-admin data-contract rules.
- **G5.** `multi-lane` known-gaps encoding specified (Provocator). New required sub-field `Constituent lanes:` on any entry with Lane = `multi-lane`.

### v2 → v3 CONCERNs adopted (four)

- **C1.** Staleness script plugin-path specificity (Censor + Provocator). Now walks `~/.claude/plugins/marketplaces/medusa/plugins/medusa-dev/skills/` and cross-references `~/.claude/plugins/installed_plugins.json` for enable/disable state. Detects disabled plugins and version drift.
- **C2.** Diagnosis packet grows to **14 fields** (Provocator). New field 14: **Contract compatibility evidence** — required when Lane = `cross-repo` or Fix threshold = Medium on cross-repo scope; states whether the backend supports both old and new shapes or the change is breaking. Lets the Tribunus verify Medium-vs-Large classification against evidence rather than assertion.
- **C3.** Contain-case scalability handled by G2 + G3 above.
- **C4.** Revision Note bookkeeping — this section is now split into GAPs-resolved and CONCERNs-adopted subsections per Censor's readability flag.

### v1 → v2 GAPs resolved (eight, preserved for audit)

default-delete flipped to default-keep on existing tribune files; lane taxonomy expanded from four to six lanes (adding `storefront-super-admin` and `unknown`); cross-session packet handoff mechanism made explicit via case file written before Imperator gate; staleness script gains Medusa-skill resolution check; `run_in_background` wait semantics clarified; Consul Debug Routing prints paste-ready symptom recap; Tribunus agent `description:` field updated for both stances; 13 packet fields enumerated inline (now 14 after v3's C2); `mini-checkit.md` template added to the modification list with patrol-stance declarations (`campaign-review.md` removed in v3 per G1); `lane-classification.md` contents specified.

## Purpose

Reshape `/tribune` from a superpowers relic into a consiliumized debugging subsystem. Introduce the Medicus, a main-session persona symmetric with the Consul and Legatus, who owns the debug session and emits a structured diagnosis packet. Extend the existing Tribunus persona with a second stance (diagnosis verification) alongside its current Legion patrol stance. Install a product-specific known-gaps doctrine in the domain bible, a case-log pipeline in `docs/consilium/debugging-cases/`, and the **Medusa Rig** — a triad of Medusa companion skills wired across the Consilium by lane, with cross-repo as the default suspect for ambiguous Divinipress bugs. "Wired" here means explicit per-session semantics, not durable frontmatter binding — see Deliverable 6 for mechanics.

This spec is Phase 1 of a larger debugging reform. Evals and the Divinipress storefront overlay are explicitly deferred.

## Context

Three inputs shaped this design:

1. **The Codex fork's reform** at `/Users/milovan/projects/Consilium-codex`. Both plans (`2026-04-23-tribune-phase-1-consiliumization-edict.md` and `2026-04-23-tribune-phase-2-debug-routing-edict.md`) shipped and sealed. Their artifacts were scouted and judged on merit — the 13-field diagnosis packet (extended to 14 fields in v3 with Divinipress-specific contract-compatibility evidence), the lane taxonomy, the known-gaps discipline rule, and the debugging-cases promotion pipeline are taken as-is. Their rank layout (centurios, interpretes, speculators, arbiter), their install mechanics (Codex symlinks), and their source-regeneration pipeline (TOML generation from `source/roles/`) are NOT ported — our runtime is Claude Code plugin-cache-based and our rank layout differs.

2. **The Imperator's bug distribution.** The real Divinipress bug shape is *small frontend bugs or cross-repo bugs*. Cross-repo is the hot path — storefront-to-backend contract breaks are what the Imperator personally ends up fixing. The Medicus's hypothesis bias must reflect this: cross-repo is the leading suspect for any symptom spanning UI and data, not a fallback lane.

3. **Our current tribune state** (per scout report). `skills/tribune/SKILL.md` is generic systematic-debugging content with no Consilium shape. CLAUDE.md line 12 admits it: *"`/tribune` — summon the Tribunus for debugging. (Not yet reshaped.)"* Our existing `consilium-tribunus` is the Legion mini-checkit patrol verifier — not a debugger. Two Tribuni would collide; the collapse is the cleanest resolution.

## Scope

### In scope

1. New Medicus persona + tribune skill rewrite around it.
2. Tribunus persona extended with a diagnosis-verification stance.
3. Known-gaps doctrine seeded into our domain bible.
4. Debugging-cases directory with template and promotion rule.
5. Medusa Rig — three companion skills wired across Consilium by lane via explicit dispatch-prompt naming. (Per v1 verification: the Medusa MCP is already universally present on all user-scope agents; no frontmatter additions needed. Agent bodies gain a short note on MCP usage.)
6. Consul and Legion routing protocol updates (debug trigger detection, fix intake).
7. Staleness check script + maintenance surface updates (CLAUDE.md, CONSILIUM-VISION.md).

### Out of scope

- Evals suite. The Codex fork's 18-task behavioral drift suite is valuable but is its own sub-project.
- Divinipress storefront overlay doctrine. The Imperator has docs prepared; addressed after this reform.
- New rank specializations (backend-specialized Medicus, etc.). This spec does not replicate the `consilium-tribunus-back` pattern into the Medicus.
- Backend-verifier specialization session 2 (that work continues independently).
- Any change to `skills/audit/SKILL.md`, `skills/gladius/SKILL.md`, `skills/sententia/SKILL.md`, `skills/tribunal/SKILL.md`, `skills/triumph/SKILL.md`, `skills/phalanx/SKILL.md`, `skills/forge/SKILL.md`, `skills/castra/SKILL.md`. These skills are orthogonal to the debugging reshape.

## Inputs

| Artifact | Path | Role |
|-|-|-|
| Codex Phase 1 plan | `/Users/milovan/projects/Consilium-codex/docs/consilium/plans/2026-04-23-tribune-phase-1-consiliumization-edict.md` | Source for tribune skill structure |
| Codex Phase 2 plan | `/Users/milovan/projects/Consilium-codex/docs/consilium/plans/2026-04-23-tribune-phase-2-debug-routing-edict.md` | Source for routing protocol |
| Codex known-gaps doctrine | `/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md` | Source for the 7 seed entries (requires Route-field translation per Deliverable 4) |
| Codex known-gaps protocol | `/Users/milovan/projects/Consilium-codex/skills/tribune/references/known-gaps-protocol.md` | Source for discipline rules |
| Codex cases README | `/Users/milovan/projects/Consilium-codex/docs/consilium/debugging-cases/README.md` | Source for case template |
| Our Consul SKILL | `/Users/milovan/projects/Consilium/skills/consul/SKILL.md` | Pattern reference for main-session-persona skills |
| Our Legion SKILL | `/Users/milovan/projects/Consilium/skills/legion/SKILL.md` | Pattern reference + intake gate insertion point |
| Our Tribunus persona | `/Users/milovan/projects/Consilium/skills/references/personas/tribunus.md` | Extension target |
| Our Tribunus agent | `/Users/milovan/.claude/agents/consilium-tribunus.md` | Extension target |
| Our domain bible MANIFEST | `/Users/milovan/projects/Consilium/skills/references/domain/MANIFEST.md` | Update to list known-gaps |
| Verification protocol | `/Users/milovan/projects/Consilium/skills/references/verification/protocol.md` | Governs all finding handling |
| Verification templates | `/Users/milovan/projects/Consilium/skills/references/verification/templates/` | New `tribune-verification.md` joins this directory |
| Medusa backend skill | `medusa-dev:building-with-medusa` | Companion, loaded by lane (per-session) |
| Medusa storefront skill | `medusa-dev:building-storefronts` | Companion, loaded by lane (per-session) |
| Medusa admin skill | `medusa-dev:building-admin-dashboard-customizations` | Companion, loaded by lane (per-session) |
| Medusa MCP | `mcp__medusa__ask_medusa_question` | Question-answering tool added to scout/censor/praetor/provocator/soldier |

## Deliverable 1 — Medicus persona

**Purpose:** The main-session debugging magistrate. Symmetric with the Consul (spec) and Legatus (execution). Owns a debug session, classifies the affected lane, assembles evidence, writes the diagnosis packet, dispatches verification, presents findings to the Imperator, then routes the fix by threshold.

**Files:**
- `skills/references/personas/medicus.md` — canonical persona (new)
- `skills/tribune/SKILL.md` — Medicus body inlined per the Consul/Legatus pattern (see Deliverable 2)

**Voice and function.** The Medicus is a Roman army surgeon. His discipline is triage: distinguish wounded from dead, diagnose before prescribing, never mistake a known-gap hypothesis for proof. He speaks as a field physician, not a judge. *"The symptom is A. Reproduction confirms B. The evidence suggests C but contradicts D — I want another look before I prescribe."*

**Required sections of the persona file:**

1. **Identity line** — `You are Gaius Salvius Medicus, field surgeon of the Consilium.` (Name may be sharpened during execution; the shape is a three-name Roman with a medical cognomen.)

2. **Creed.** One paragraph on the Medicus's purpose. *"The Imperator summons me when the code is wounded. I do not guess. I reproduce the bleed, trace the boundary at which it failed, name the cause by evidence and not by instinct, and propose a fix the Legatus can execute cleanly. A wrong diagnosis costs more than a slow one."*

3. **Trauma.** One paragraph on a past failure that motivates discipline. Draft: *"I once saw a failing checkout and recognized a known gap — a scope bug in team-name lookups that had bitten us before. I wrote the diagnosis on that hypothesis without rechecking the live code. The fix went in, the test passed, and the real cause — a missing idempotency key on the backend — surfaced two days later when a customer was charged twice. The known gap was a shadow of a real issue. I used it as proof, and it was never proof. Now every known gap goes through live recheck before it touches the packet."* This trauma directly motivates the "hypothesis accelerator, not proof" discipline.

4. **The Codex.** The same finding categories, chain-of-evidence discipline, confidence map, deviation-as-improvement, independence rule, and auto-feed loop that the Consul and Legatus carry. Inlined per our main-session-persona pattern.

5. **Doctrine** — five discipline subsections:
   - **Reconnaissance.** Dispatch scouts to reproduce, inspect, and query. Load known-gaps from the domain bible. Load the Medusa Rig skill(s) matching the classified lane. Never assume Medusa API shape — ask the MCP.
   - **Lane classification.** Apply the taxonomy in `skills/tribune/references/lane-classification.md`. If symptoms span UI and data, default to cross-repo.
   - **Hypothesis discipline.** Known gaps are hypothesis accelerators, never proof. Every known-gap reference in a packet carries a live recheck result. Contrary evidence is a field, not an afterthought.
   - **Packet construction.** Fill all 14 fields. Missing field = incomplete packet = cannot dispatch verification.
   - **Threshold honesty.** Propose a fix threshold. Do not inflate (Imperator loses trust). Do not deflate (a large fix dispatched as small skips the ceremony it needed).

6. **Dispatch triggers.** Words or contexts that summon the Medicus: bug, broken, failing, flaky, regression, test failure, "stop guessing," "find the cause," explicit `/tribune`.

7. **Relation to the Tribunus.** The Tribunus is the Medicus's verifier on the diagnosis packet, just as the Censor is the Consul's on the spec. Same persona the Legion uses for per-task patrol; different stance.

8. **What the Medicus will NOT do.**
   - Will not guess. Every diagnosis has a reproduction or a stated inability to reproduce.
   - Will not write code directly. Fix dispatch goes through the Legatus.
   - Will not skip the known-gap live recheck.
   - Will not close a case without a verification plan that confirms the fix.
   - Will not speak like a project manager. He is a surgeon.

> **Confidence: High** — symmetry with Consul and Legatus patterns. Creed and trauma drafts are indicative; final prose gets sharpened during execution but the shape holds.

## Deliverable 2 — `/tribune` skill rewrite

**Purpose:** The entry point when the Imperator invokes `/tribune`. Inlines the Medicus persona + the Codex, like `skills/consul/SKILL.md` inlines the Consul persona. Runtime-loadable at `skills/tribune/SKILL.md` and synced to `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/tribune/SKILL.md`.

**File manifest for the skill:**

```
skills/tribune/
├── SKILL.md                                    (FULL REWRITE)
└── references/                                 (NEW subtree)
    ├── lane-classification.md                  (NEW)
    ├── diagnosis-packet.md                     (NEW)
    ├── known-gaps-protocol.md                  (NEW)
    ├── fix-thresholds.md                       (NEW)
    └── lane-guides/
        ├── storefront-debugging.md             (NEW)
        ├── admin-debugging.md                  (NEW)
        ├── medusa-backend-debugging.md         (NEW)
        └── cross-repo-debugging.md             (NEW)
```

Existing files in `skills/tribune/` — `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md` — are **kept by default and folded into the matching lane guide(s)**. Censor v1 verification read all three and judged them substantive, not superpowers-relic boilerplate; the Codex fork's Phase 1 plan kept the equivalents as first-class references. The Legatus evaluates each file during execution and folds its content into the appropriate lane guide (e.g., `condition-based-waiting.md` material → every lane guide's "timing and async" subsection; `root-cause-tracing.md` → `cross-repo-debugging.md`'s tracing discipline; `defense-in-depth.md` → `cross-repo-debugging.md` boundary-validation). Delete only content that is unambiguous superpowers-provenance boilerplate (e.g., file frontmatter referencing superpowers authorship with no Divinipress value).

**SKILL.md structure (prose order):**

1. Base directory line (standard skill preamble).
2. The Medicus identity line.
3. Creed + trauma.
4. The Codex (inlined, same content as Consul's SKILL).
5. Doctrine — reconnaissance, lane classification, hypothesis discipline, packet construction, threshold honesty.
6. Workflow phases (see below).
7. What the Medicus will NOT do.
8. Visual companion note (consistent with Consul — debugging may benefit from terminal stacks or flame graphs; option to use browser for traces).

**Workflow phases (the eight-step flow):**

1. **Summons.** Record the Imperator's symptom description. Classify the lane preliminarily per `skills/tribune/references/lane-classification.md`.
2. **Doctrine load.** Read `skills/references/domain/known-gaps.md`. Read the matching lane guide(s) from `skills/tribune/references/lane-guides/`. Invoke `Skill(skill: "medusa-dev:...")` for the matching Medusa Rig skill(s) so the Medusa knowledge is loaded into the Medicus's active context for his own reasoning. (Downstream subagents do not inherit this load — the Medicus names the required skill in every scout/subordinate prompt so they invoke it themselves on arrival. See Deliverable 6 for Rig mechanics.)
3. **Reconnaissance.** Dispatch `consilium-scout` subagents. Scout prompts carry reproduction requests, grep targets, and — when Medusa is in scope — the required `medusa-dev:*` skill name(s) + explicit instruction to query `mcp__medusa__ask_medusa_question` before assuming API shape.
4. **Packet construction.** Fill all 14 fields (enumerated below) per `skills/tribune/references/diagnosis-packet.md`. Write the known-gap field with live recheck result. Write the contract-compatibility-evidence field when cross-repo is implicated. Propose a fix threshold per `skills/tribune/references/fix-thresholds.md`.
5. **Verification dispatch.** Dispatch Tribunus (diagnosis stance) + Provocator in parallel with `run_in_background: true`, per the new `skills/references/verification/templates/tribune-verification.md`. **The Medicus blocks here** — phase 6 does not begin until both verifiers have returned. The Medicus may monitor status but does not proceed to the Imperator gate with partial results.
6. **Case-file write.** The Medicus writes the verified packet + verifier reports + declared threshold to `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` with `Status: draft` **before** the Imperator gate. This file is the durable cross-session artifact; downstream personas (Legatus, later Consul escalations, future Medicus sessions) read it as orders.
7. **Imperator gate.** Present the packet summary with the case-file path. The Imperator approves (Medicus updates `Status: approved`), rejects (Medicus updates `Status: rejected`, retains file for audit, terminates), contains (Medicus writes the approval and passes to Legion; Legion will update `Status: contained` after dispatch), or revises (Medicus re-enters Phase 4 with corrections; the `draft` case file is overwritten in place — original draft content is not preserved because v1 drafts of a diagnosis are not audit-worthy until the Imperator approves). If the Imperator never responds and 7 days elapse, a future Medicus session's Phase 1 scan tags the case `Status: abandoned` on first encounter.
8. **Fix dispatch.** Route by threshold — see Deliverable 7 (Legion's Debug Fix Intake). Legion reads the case file as orders; the Medicus does not re-paste content into a fresh Legion session. Legion updates the Status field as dispatch progresses (`approved` → `routed` → `closed` for normal flow; `approved` → `routed` → `contained` for contain flow).

### The 14 diagnosis-packet fields

Enumerated inline so the spec is self-checkable. Fields 1-13 match the Codex fork's `core-debugging.md` verbatim; field 14 is a Divinipress-specific addition motivated by our cross-repo bias. The `diagnosis-packet.md` reference file renders this list with per-field content rules.

1. **Symptom** — external observable (customer-facing failure, test output, UI state).
2. **Reproduction** — exact steps, or explicit statement of inability with cause.
3. **Affected lane** — from the six-lane taxonomy (see Deliverable 6).
4. **Files/routes inspected** — absolute paths the scouts hit.
5. **Failing boundary** — the layer where the expected contract broke (route handler, workflow step, subscriber, store, API surface).
6. **Root-cause hypothesis** — the Medicus's single leading explanation.
7. **Supporting evidence** — file:line citations, log excerpts, MCP answers supporting the hypothesis.
8. **Contrary evidence** — observations that do NOT fit the hypothesis. Required field. "None observed — contrary evidence actively searched for" is a valid answer. Placeholder or empty is a GAP.
9. **Known gap considered** — `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`. `None applicable — checked against all <lane> entries` is valid.
10. **Proposed fix site** — absolute path + approximate line range where the fix belongs.
11. **Fix threshold** — `small | medium | large | contain` per `fix-thresholds.md`.
12. **Verification plan** — exact command or test that confirms the fix after dispatch.
13. **Open uncertainty** — what the Medicus does NOT know but the fix depends on (intentional honesty; becomes the Provocator's target).
14. **Contract compatibility evidence** — REQUIRED when Affected lane = `cross-repo` OR Fix threshold implies cross-repo work. States whether the proposed fix is backward-compatible with existing consumers of the surfaces it touches. Format: `backward-compatible — <evidence>` OR `breaking — <which consumers error on old shape, requires synchronized deploy>` OR `N/A — single-lane fix`. This field is what distinguishes a Medium-cross-repo fix (backward-compatible, two coordinated marches) from a Large fix (breaking contract, requires spec + synchronized deploy). The Tribunus (diagnosis stance) verifies this field's evidence matches the declared Fix threshold.

### `lane-classification.md` contents

This reference file is the taxonomy the Medicus applies in phase 1. Contents:

1. **The six lanes** (matching the Codex fork):
   - `storefront` — customer-facing pages in `divinipress-store`
   - `storefront-super-admin` — Super Admin surfaces in `divinipress-store` (distinct components, distinct permissions, distinct flows)
   - `admin-dashboard` — Medusa Admin dashboard extensions in `divinipress-backend/src/admin/`
   - `medusa-backend` — Medusa backend work in `divinipress-backend/src/{modules,workflows,api,subscribers}/`
   - `cross-repo` — flows spanning `divinipress-store` ↔ `divinipress-backend`
   - `unknown` — symptoms that cannot be classified at summons time
2. **Classification heuristics** — symptom → lane mapping, with a small decision tree.
3. **The cross-repo default rule** — if symptoms span any UI observation AND any data/backend observation, default to `cross-repo` until evidence proves single-lane.
4. **The unknown-lane protocol** — load the known-gaps doctrine and the cross-repo lane guide; dispatch a classification-focused scout first; re-classify after evidence returns.
5. **Lane-to-guide mapping** (which lane-guide the Medicus loads per classification).
6. **Lane-to-Rig-skill mapping** (mirrors Deliverable 6's table so the Medicus does not cross-reference).

> **Confidence: High** — structure mirrors Consul's SKILL; 13 Codex fields ported verbatim (Censor v1 cross-referenced), 14th Divinipress-specific field added for cross-repo contract evidence (v3 per Provocator CONCERN); lane taxonomy expanded to six per Censor v1 recommendation.

## Deliverable 3 — Tribunus collapse (two stances, one persona)

**Purpose:** Extend the existing Tribunus persona with a diagnosis-stance block alongside its existing patrol stance. One dispatched agent file (`~/.claude/agents/consilium-tribunus.md`); no second Tribunus.

**Files:**
- `skills/references/personas/tribunus.md` — extend with a diagnosis stance section
- `~/.claude/agents/consilium-tribunus.md` — extend with matching content + add Medusa Rig skill references

**Extension content for the persona:**

```markdown
## Stance Selection

The Tribunus is dispatched in one of two stances. The dispatch prompt declares which. The identity, creed, trauma, and Codex carry over unchanged. The stance changes what the Tribunus checks.

### Patrol Stance (Legion)

Dispatched by the Legatus after a soldier reports DONE or DONE_WITH_CONCERNS on a plan task. Verifies:
- The implementation matches the plan step.
- Domain correctness (no MISUNDERSTANDINGs on business concepts).
- Reality — no stubs, no "TODO" leftovers, no mocked-out behavior where real behavior was required.
- Integration with earlier tasks.

### Diagnosis Stance (Tribune)

Dispatched by the Medicus after a diagnosis packet is written. Verifies the packet, not code:
- Reproduction is present or absence is explicitly justified.
- Evidence cited in Supporting evidence is specific (file:line, log excerpt, MCP citation).
- Contrary evidence is not a placeholder — if none, the Medicus must say so and justify.
- Known-gap discipline — every referenced gap carries a live recheck result. Using a gap as proof without recheck is MISUNDERSTANDING.
- Root-cause hypothesis is traceable from evidence.
- Proposed fix site matches the failing boundary. A fix proposed in the wrong layer is MISUNDERSTANDING.
- Fix threshold matches the scope of the proposed change.
- Verification plan is executable and will confirm the fix.

Same finding categories (MISUNDERSTANDING / GAP / CONCERN / SOUND). Same chain of evidence. The Tribunus does not propose alternatives — that is the Medicus's or Provocator's role.
```

**Extension content for the user-scope agent file:**

The existing `consilium-tribunus.md` agent at `~/.claude/agents/consilium-tribunus.md` already carries `mcp__medusa__ask_medusa_question` in its tools and `medusa` in its mcpServers (Censor v1 verified). Required changes:

1. **Update the `description:` frontmatter field** to advertise both stances. Current v1 description reads *"Per-task mini-checkit verification during plan execution..."* which only advertises patrol. Revised description must name both — e.g., *"Per-task mini-checkit patrol verification (Legion dispatch) AND diagnosis-packet verification (Medicus dispatch). Stance is declared by the dispatcher in the prompt. Patrol depth — fast, focused, one pass. Verifies plan-step match, domain correctness, reality (no stubs), integration — OR packet correctness: reproduction, evidence, known-gap discipline, fix-site match, threshold match, verification plan executability. Read-only with Bash."* The exact wording is finalized in execution but must name both stances.
2. **Body gets the stance-selection block** (same content as the persona file above).
3. **No `tools` or `mcpServers` change.**

**Dispatch-template updates — required for the collapse to work without ambiguity:**

The existing `skills/references/verification/templates/mini-checkit.md` dispatches the Tribunus today without declaring a stance (because there was only one stance). Post-collapse, every Tribunus dispatch MUST declare a stance explicitly — otherwise the Tribunus receives an ambiguous prompt.

- `skills/references/verification/templates/mini-checkit.md` — Legion's per-task dispatch. Add a line near the top of the dispatch prompt: `"You are dispatched in the **patrol stance** — verify the implemented task against the plan."`
- `skills/references/verification/templates/campaign-review.md` — **not modified.** Censor v2 verified that this template dispatches Censor + Praetor + Provocator only, no Tribunus. Stance declaration is not applicable; any claim of "campaign-review uses Tribunus at patrol depth on per-task checks" was wrong — per-task Tribunus patrol runs in `mini-checkit.md` BEFORE campaign review ever dispatches.

The new `skills/references/verification/templates/tribune-verification.md` (Deliverable 8) declares diagnosis stance. Together the two templates (`mini-checkit.md` + `tribune-verification.md`) cover 100% of Tribunus dispatches — no dispatch path is left without a stance declaration.

> **Confidence: High** — collapse is the Imperator's explicit choice. Stance-declaration mechanism closes the Provocator v1 GAP on ambiguous dispatches by making the declaration mandatory in all three templates.

## Deliverable 4 — Known-gaps doctrine

**Purpose:** Product-specific recurring-bug memory. Read by the Medicus on every debug session, by the Consul during reconnaissance, and available to any verifier via graphify. Each entry is a hypothesis accelerator with strict discipline rules.

**Files:**
- `skills/references/domain/known-gaps.md` (new)
- `skills/references/domain/MANIFEST.md` (update — add known-gaps entry)
- Graphify re-ingest of `skills/references/domain/` so known-gaps is queryable via `query_graph`

**Entry shape** (one entry per known gap):

```markdown
### KG-IDENTIFIER — short title

- **Lane:** storefront | storefront-super-admin | admin-dashboard | medusa-backend | cross-repo | multi-lane
- **Constituent lanes:** (REQUIRED when Lane = `multi-lane`; omit otherwise) comma-separated list of specific lanes the gap spans, e.g., `admin-dashboard, medusa-backend`
- **Status:** live | resolved | historical
- **Last verified:** YYYY-MM-DD (date of last live recheck in the current repos)
- **Symptom signature:** what this gap presents as externally
- **Evidence (as of last verify):** absolute file path + line range snippets that show the gap in the current code
- **Debug rule:** what to suspect; what NOT to assume; how to confirm
- **Route:** which rank receives the fix dispatch when confirmed (always in OUR rank layout)
```

`multi-lane` is a valid Lane value for gaps that span two or more non-cross-repo surfaces (e.g., admin-dashboard + medusa-backend — note: `cross-repo` already denotes the specific storefront↔backend span, so `multi-lane` covers the other combinations). The `Constituent lanes:` sub-field is REQUIRED for multi-lane entries so the Medicus's lookup can match relevance by specific lane rather than by "matches any lane always" (which would flood every diagnosis with noise).

The Medicus's lookup treats a multi-lane entry as relevant when the symptom's classified lane is listed in the entry's Constituent lanes. If an entry has `Lane: multi-lane` without a Constituent lanes sub-field, that entry is malformed and the staleness-script validation fails.

**Seed entries — verification and translation gate.**

The Codex fork has seven entries: `KG-TEAM-PERMISSIONS`, `KG-TEAM-NAME-SCOPE`, `KG-INVITE-ONBOARDING-SPLIT`, `KG-ONBOARDING-PROMO-METADATA`, `KG-ADMIN-HOLD-PLACEHOLDER`, `KG-NON-APPAREL-OPTIONS`, `KG-MEDUSA-MONEY-AND-QUERY`.

**Each seed entry is independently re-verified AND translated into our schema before being copied into our file.** Two steps per entry:

1. **Evidence re-verification.** A scout reads the Codex fork's entry, checks the cited evidence in our current `divinipress-store` and `divinipress-backend` repos, and reports whether evidence still holds, paths are current, and symptom is reproducible.
2. **Rank translation.** The Codex fork's Route fields reference ranks in their hierarchy; some do not exist in ours, and some share names with our own ranks and route to them directly. **Exhaustive inventory** via `rg -oP 'consilium-[a-z-]+' <codex-file> | sort -u` surfaces seven unique ranks across the seven seed entries. The mapping (all seven, not a subset):

   | Codex rank | Our translation |
   |-|-|
   | `consilium-arbiter` | our Medicus (the diagnostic authority — this is a NEW rank in our system playing the arbiter role) |
   | `consilium-speculator-back` | our Medicus with `cross-repo-debugging.md` guide loaded and `medusa-dev:building-with-medusa` named in subordinate prompts (reconnaissance-heavy role) |
   | `consilium-centurio-back` | our Legatus → Soldier with `medusa-dev:building-with-medusa` named in the Soldier prompt (backend execution) |
   | `consilium-centurio-front` | our Legatus → Soldier with `medusa-dev:building-storefronts` named in the Soldier prompt (frontend execution) |
   | `consilium-interpres-front` | our Legatus → Soldier with `medusa-dev:building-storefronts` named (frontend execution, interpretation-heavy task shape — same dispatch chain as `consilium-centurio-front` in our layout) |
   | `consilium-consul` | our Consul — name shared; no translation needed |
   | `consilium-tribunus` | our Tribunus — name shared; no translation needed |

   The Route field in OUR entries always reads as a dispatch chain in our rank layout. The two name-shared ranks (Consul, Tribunus) route to our ranks of the same name; the five translated ranks route to our Medicus / Medicus-reconnaissance / Legatus→Soldier chains as mapped above. No un-translated Codex rank name appears in the final file.

   **Exhaustive-inventory invariant.** The port protocol begins with a scout running the same `rg` against the Codex file to confirm no new ranks have been added in the time between this spec and execution. If the scout surfaces a rank not in the table above, execution halts and the Consul is re-summoned to extend the mapping before the port proceeds.

Entries that fail re-verification are either updated (new evidence, new paths) or dropped. The file ships with a minimum of three verified entries to start. The Imperator can override inclusion/exclusion case-by-case.

**Discipline rules** (headline prose of the file, unchanged from Codex discipline):

> *Known gaps are hypothesis accelerators, not proof. Before using a known gap in a diagnosis, recheck the current repo. If the evidence is stale, missing, or contradicted, say that and drop the hypothesis. A known gap cited as proof without live recheck is MISUNDERSTANDING.*

**Diagnosis-packet field requirement** (referenced by Deliverable 5):

> Every diagnosis packet's "Known gap considered" field MUST state: `ID / Why relevant / Live recheck performed: yes|no / Result / Used as evidence: yes|no`. Absence of a known-gap consideration is allowed only if no known gap maps to the affected lane and symptom — in which case the field carries `None applicable — checked against all <lane> entries`.

**MANIFEST update:** add a new entry to `skills/references/domain/MANIFEST.md` naming `known-gaps.md` and describing when to load it (any debug session; any spec or plan touching a lane with live known gaps).

> **Confidence: High** on location, shape, and discipline. **Medium** on seed content — dependent on per-entry re-verification at execution time.

## Deliverable 5 — Debugging cases directory

**Purpose:** Historical log of debug sessions. Feeds the known-gaps promotion pipeline. Also serves as an operational record for the Imperator — what was diagnosed, what was the root cause, what was routed where.

**Files:**
- `docs/consilium/debugging-cases/README.md` (new)
- Directory ready to receive cases (one file per case, `YYYY-MM-DD-<bug-description>.md`)

**README contents:**

1. Purpose of the directory.
2. When to write a case — promotion rule.
3. Case template (Trigger / Initial hypothesis / Evidence / Diagnosis / Routing / Fix route / Verification / Promotion decision / Follow-up).
4. Relation to known-gaps (how a case becomes a KG entry).

**Promotion rule (when to promote a case to the known-gaps doctrine):**

- Two recurrences of the same failure mode across distinct cases, OR
- One hit on a sensitive surface: auth, tenant isolation, money path, checkout, proof status, order lifecycle, cross-repo contract, OR
- Imperator override — he may promote any case at any time regardless of the above.

**Case file shape** (lives in the directory after a debug session):

```markdown
# YYYY-MM-DD — Short case title

**Status:** draft | rejected | approved | routed | contained | closed | abandoned
**Triggered by:** who summoned the Medicus, and with what symptom
**Lane:** storefront | storefront-super-admin | admin-dashboard | medusa-backend | cross-repo | unknown (re-classified during session)
**Fix threshold:** small | medium | large | contain
**Resolves:** (OPTIONAL) slug of a prior case this case's fix closes; when set, the prior case's Status is updated to `closed` by the Medicus writing this file

## Trigger
## Initial hypothesis
## Evidence
## Diagnosis
## Routing
## Fix route
## Verification
## Promotion decision
## Follow-up
```

**The case-file state machine.** Every case file carries a top-level `Status:` field. States and transitions:

| State | Set by | Meaning |
|-|-|-|
| `draft` | Medicus Phase 6 (write) | Packet written, pre-Imperator gate. Not yet approved. |
| `rejected` | Medicus Phase 7 | Imperator rejected the packet. File retained for audit but NOT surfaced by Phase 1 scans. |
| `approved` | Medicus Phase 7 | Imperator approved; pending Legion intake. |
| `routed` | Legatus intake | Legion has taken the packet; fix march underway. |
| `contained` | Legatus after contain-dispatch | Fix shipped as containment; root cause still pending. **Phase 1 scans surface this state.** |
| `closed` | Legatus after verified fix, OR Medicus writing a `Resolves:` field on a later case | Root cause confirmed and fixed. Terminal state. |
| `abandoned` | Medicus on re-summons when a `draft` case older than 7 days has no Imperator annotation | Session timed out or Imperator never responded. Terminal state. Not surfaced. |

**Phase 1 scan semantics** (resolves Provocator v2 GAP-v2-2):

When the Medicus is summoned, Phase 1 reads `docs/consilium/debugging-cases/` and surfaces ONLY cases matching ALL of:

1. `Status: contained` (not `closed`, `rejected`, `abandoned`, etc.)
2. File modification time within the last 90 days (default; Imperator can override per-invocation with `/tribune --scan-all` to disable the date cap)
3. No later case file references this case's slug in its `Resolves:` field (a `Resolves:` chain means a fix was shipped elsewhere; the original is effectively closed)

The scan is a directory listing + head-only read of each matching file's frontmatter — not a full content read. At 500 cases this is a sub-second operation.

No seed cases. The directory starts empty and fills as `/tribune` is used.

> **Confidence: High** — direct port of the Codex fork's pattern, which is clean.

## Deliverable 6 — The Medusa Rig (Triad)

**Purpose:** Wire Medusa companion skills across the Consilium by lane, with cross-repo as the default suspect for ambiguous Divinipress bugs. Not tribune-local; reshapes how Consul, Edicts, Legion, and March dispatch subordinates when Medusa work is implicated.

### How the Rig actually wires — mechanism

This subsection addresses v1 Provocator MISUNDERSTANDING on the "attach" verb. The Rig has two distinct wiring layers:

**Layer 1 — Main-session persona invokes `Skill(skill: "medusa-dev:...")` for its own reasoning.** The Medicus (in a `/tribune` session), the Consul (in a `/consul` session during Medusa-adjacent reconnaissance), and the Legatus (in a `/legion` or `/march` session when the plan touches Medusa work) each invoke the matching skill at the point they need the knowledge. This loads the skill's guidance into the current turn's context. The load is turn-scoped — the knowledge informs the persona's immediate reasoning but does NOT automatically propagate to any subagent the persona subsequently dispatches.

**Layer 2 — Dispatchers NAME the required skill in subordinate prompts; subordinates invoke it on arrival.** When the Medicus dispatches a scout, the scout prompt explicitly names the required `medusa-dev:*` skill(s) and instructs: *"Invoke `Skill(skill: '<name>')` before beginning your investigation."* Same for Consul dispatching scouts, Edicts naming skills in Soldier prompts, Legion/March naming skills in Soldier dispatch prompts. The subordinate loads the skill in its own fresh context.

**Durable frontmatter bindings exist only at the user-scope agent level** — in `~/.claude/agents/consilium-*.md` files. The Medusa MCP (`mcp__medusa__ask_medusa_question`) is in every Consilium agent's `tools:` list already (Censor v1 verified). This is orthogonal to the skill-loading mechanism above: the MCP is a persistent tool available on every turn; skills are per-turn loads.

"Attach" is avoided throughout this spec. Replaced by: *invoke* (Layer 1), *name in prompt* (Layer 2), *frontmatter-bound* (durable MCP).

### The three skills

| Skill | Covers |
|-|-|
| `medusa-dev:building-storefronts` | Storefront data fetching, SDK usage, custom API route consumption |
| `medusa-dev:building-admin-dashboard-customizations` | Admin UI — widgets, custom pages, forms, tables |
| `medusa-dev:building-with-medusa` | Backend — modules, workflows, API routes, links, data models |

### Lane-to-skill mapping

| Lane | Skill(s) loaded (Layer 1) and named in prompts (Layer 2) | Lane guide |
|-|-|-|
| storefront | `building-storefronts` | `storefront-debugging.md` |
| storefront-super-admin | `building-storefronts` | `storefront-super-admin-debugging.md` (permission scoping, cross-company visibility, super-admin data contracts) |
| admin-dashboard | `building-admin-dashboard-customizations` + `building-with-medusa` | `admin-debugging.md` |
| medusa-backend | `building-with-medusa` | `medusa-backend-debugging.md` |
| **cross-repo** | `building-storefronts` + `building-with-medusa` | `cross-repo-debugging.md` |
| unknown | Load `building-storefronts` + `building-with-medusa` (cross-repo-default) until classified | `cross-repo-debugging.md` (fallback during classification) |

The storefront vs. storefront-super-admin split shares the Medusa Rig skill (both are storefront React surfaces) but diverges on the lane guide — the Super Admin guide captures Divinipress-specific discipline the ordinary storefront guide does not: permission-scope assertions, cross-company data visibility, the backend data contracts that only Super Admin consumes.

### Wiring — main-session skills

1. **`skills/tribune/SKILL.md`** — Medicus invokes matching Rig skill(s) in Phase 2 (Doctrine load) of his workflow AND names them in every scout/subordinate prompt.
2. **`skills/consul/SKILL.md`** — add guidance in the reconnaissance section: *"When Medusa work is implicated (any backend route/workflow/module, any admin widget, any storefront SDK call, any cross-repo flow), invoke the matching Rig skill(s) for your own reasoning AND name them in every scout dispatch prompt so the scout invokes them too."*
3. **`skills/edicts/SKILL.md`** — add guidance: *"When the plan includes Medusa work, name the required Rig skill(s) in every affected task's Soldier prompt."*
4. **`skills/legion/SKILL.md`** — add guidance: *"When dispatching a Soldier on a Medusa-adjacent task, invoke the Rig skill(s) yourself before dispatch AND name them in the dispatch prompt."*
5. **`skills/march/SKILL.md`** — identical guidance to legion's.

### Wiring — user-scope agents

**Frontmatter state (Censor v1 verified):** All six user-scope agents (`consilium-scout`, `consilium-censor`, `consilium-praetor`, `consilium-provocator`, `consilium-soldier`, `consilium-tribunus`) already carry `mcp__medusa__ask_medusa_question` in `tools:` and `medusa` in `mcpServers:`. **No frontmatter modifications required.**

**Body-content additions (the only agent-file work for this deliverable):** Each agent's body gains a short note — *"When Medusa work is in scope, consult `mcp__medusa__ask_medusa_question` before assuming Medusa API shape or behavior. If the dispatcher names a `medusa-dev:*` skill in your prompt, invoke it with `Skill(skill: '<name>')` before beginning your investigation."* The exact wording is tailored per-agent but the substance is the same. Files modified: six user-scope agent files for body content only.

### Third-party skill fragility

We do NOT own `medusa-dev:*` skills. They are third-party. Three defenses:

1. The staleness script (Deliverable 9) validates that all three `medusa-dev:*` skill names resolve against the current Claude Code plugin environment — adds a new check beyond the banned-regex surface.
2. If the skill names change upstream, the staleness script surfaces the break before a `/tribune` session is summoned.
3. If the skill *content* drifts from Divinipress conventions, we write an overlay under `skills/references/domain/divinipress-storefront-overlay.md` (or similar) — the Imperator has drafts; deferred to post-this-spec.

> **Confidence: High** on mechanism, lane mapping, and frontmatter audit (Censor v1 verified). The Rig now has explicit per-session semantics addressing v1's "attach" error.

## Deliverable 7 — Consul and Legion routing protocol

**Purpose:** Wire `/tribune` into the two main-session personas that normally dispatch work. Consul learns to summon the Medicus instead of writing a spec when the Imperator describes a bug. Legion learns to accept a verified diagnosis packet as orders and dispatch by threshold.

**Files:**
- `skills/consul/SKILL.md` — add a Debug Routing section
- `skills/legion/SKILL.md` — add a Debug Fix Intake section
- `skills/march/SKILL.md` — mirror the Debug Fix Intake section (march dispatches the same way legion does)

**Consul — Debug Routing section (content):**

```markdown
## Debug Routing

If the Imperator describes a bug — symptoms, test failure, flaky behavior, regression, broken flow, "it's not working," "stop guessing," "find the cause" — do NOT begin a deliberation toward a spec. Summon the Medicus instead.

### Clarifying-question gate

Several trigger words ("broken," "failing," "not working") overlap with legitimate build-request language (e.g., "the onboarding flow is broken — we need to rebuild it with resumability"). When the input is ambiguous between bug-report and build-request, ask ONE clarifying question before routing:

> "Imperator — bug report (summon the Medicus to diagnose), or build request (I write a spec for the rebuild)?"

If the Imperator says bug → proceed with the recap-and-step-aside protocol below. If build → continue as Consul.

### The recap-and-step-aside protocol

The hand-off loses the conversation context the Imperator just gave the Consul. To prevent the Imperator retyping symptoms, the Consul prints a compact, paste-ready recap BEFORE stepping aside:

> "Imperator — this is a wound, not a new build. I hand it to the Medicus.
>
> **Paste this into your `/tribune` prompt so the Medicus has what you told me:**
>
> ```
> Symptom: <recap of what Imperator described>
> Affected surface: <as stated or inferred>
> Reproduction steps (if given): <as stated>
> Last-known-working context (if given): <as stated>
> Trigger words Imperator used: <exact phrases>
> ```
>
> Invoke `/tribune` and paste the block above. I step aside."

The Consul does not self-transform into the Medicus. The skill hand-off is explicit: the Imperator invokes `/tribune` in a fresh prompt with the recap block, the Medicus is loaded with immediate context, and the Consul's session ends cleanly.

Trigger words that bias the Consul toward Debug Routing: bug, broken, failing, flaky, regression, test failure, "not working," "find the cause," "stop guessing," "something wrong."

If the Imperator is describing a *new* capability with known bugs to fix inside it, the Consul still writes the spec — but the spec must name the tribune-preceded bug investigation as a prerequisite (Deliverable ordering: Medicus diagnosis first, then build).
```

**Legion — Debug Fix Intake section (content):**

```markdown
## Debug Fix Intake

A verified diagnosis packet arrives from the Medicus **as a case file** at `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md`. The Imperator hands the Legion the file path (not the content). The Legion reads the file as orders. Cross-session transport is the case file; no re-pasting.

The case file contains:
- The 14-field diagnosis
- The Tribunus + Provocator verification report
- The Imperator's approval (explicit, annotated in the file)
- The declared fix threshold (small | medium | large | contain)

### Legatus responsibilities on intake

1. Read the case file. Do not re-plan — the diagnosis is the plan.
2. Honor the threshold the Imperator confirmed.
3. Reject the case file if:
   - The Tribunus returned MISUNDERSTANDING that the Medicus did not escalate.
   - The declared threshold does not match the scope of the proposed change (e.g., "small" on a four-file change).
   - The Imperator's approval annotation is not present.
4. Dispatch by threshold:
   - **Small** (single file, ≤30 lines, no data model change, no UX change, single repo): dispatch one Soldier with the case file path in orders, run the verification plan as the acceptance test.
   - **Medium — single repo** (2+ files, model or workflow touch, visible to Legion discipline, touches only `divinipress-store` OR only `divinipress-backend`): run a full march — generate a plan from the case-file diagnosis + fix site + verification plan; each task gets patrol-Tribunus verification as usual.
   - **Medium — cross-repo** (2+ files spanning both `divinipress-store` AND `divinipress-backend`): gate condition — the packet's field 14 (Contract compatibility evidence) must read `backward-compatible — <evidence>`. If the field instead reads `breaking`, the threshold is wrong and Legion rejects. When the gate passes: run TWO coordinated marches, one per repo, sequenced by the contract direction (backend change first if frontend depends on new API shape; frontend first only if the backend already supports both shapes). Each march runs in its own castra worktree. The Legatus holds a coordination record in the case file's "Fix route" section listing both march artifacts. Cross-repo Medium does NOT auto-escalate to Consul — the diagnosis is already done; escalation would duplicate the Medicus's work.
   - **Large** (new subsystem, policy change, breaking cross-repo contract, or any fix requiring a data migration): escalate to the Consul. The case file path becomes an input to a fresh spec; the Consul references the case file in the spec's Context section. "Breaking cross-repo contract" here means a change that cannot be deployed without synchronization between repos (one side's old code errors against the other side's new code) — evidenced in the packet's field 14 reading `breaking — <which consumers error>`.
   - **Contain** (Emergency Containment): dispatch one Soldier with the case file as orders. The fix is labeled reversible, scoped minimal. The case does NOT close — the Legatus appends "contained; root cause pending; next-session carryover" to the case file and returns to the Imperator with a follow-up recommendation. **Contained cases appear on the Imperator's next `/tribune` session as an open queue item** — the Medicus's Phase 1 (Summons) reads `docs/consilium/debugging-cases/` for any case with a "root cause pending" annotation and surfaces them.
```

**March — identical intake section.** March is the Legion's execution skill; same intake, same rules.

> **Confidence: High** on triggers and intake. Cross-session transport is the case file written in Medicus Phase 6. Cross-repo Medium explicitly handled. Contain-case re-surfacing gives the open loop a closer.

## Deliverable 8 — Tribune verification dispatch template

**Purpose:** The protocol the Medicus uses to dispatch Tribunus (diagnosis stance) + Provocator on the diagnosis packet. Parallel to `skills/references/verification/templates/spec-verification.md` and `plan-verification.md`.

**File:** `skills/references/verification/templates/tribune-verification.md` (new)

**Structure** (matches existing templates):

1. **When to Dispatch.** After the Medicus writes the packet and self-reviews.
2. **Agents.** Tribunus + Provocator in parallel, run_in_background.
3. **Dispatch: Tribunus.** Prompt includes the packet, context summary (lane, symptoms, scouts dispatched), and stance declaration — "You are in the diagnosis stance."
4. **Dispatch: Provocator.** Prompt includes the packet, context summary, and attack brief — "The Medicus proposed this root cause. Attack the hypothesis. Is the evidence sufficient? Are there alternative hypotheses the packet does not address? Is the proposed fix site where the fix actually belongs, or could the failure originate in a layer the Medicus did not consider?"
5. **After Both Return.** Standard handling per protocol section 6.

**Finding categories** — reuse the four (MISUNDERSTANDING / GAP / CONCERN / SOUND). No new categories. Diagnosis-specific semantics:
- MISUNDERSTANDING: the Medicus confused what a Medusa concept IS, or used a known gap as proof without recheck, or proposed a fix at the wrong boundary.
- GAP: the packet is missing required field content, contrary evidence is a placeholder, or verification plan is unexecutable.
- CONCERN: alternative hypothesis deserves consideration; fix threshold may be off by one step.
- SOUND: the packet holds up.

> **Confidence: High** — direct port of the spec-verification template's shape.

## Deliverable 9 — Maintenance surfaces

**Files:**

1. **`scripts/check-tribune-staleness.py`** (new). A check script for the tribune subsystem. Three check classes:

   **Banned-regex scan.** Scans `skills/tribune/` for stale or out-of-place references. Ports the Codex fork's banned-regex discipline. Banned patterns (non-exhaustive; finalized in execution): `Jesse`, `Claude` (as author), `CLAUDE.md` (referenced as if the skill owns it), superpowers-provenance markers, `consilium:gladius`/`consilium:sententia` (those skills exist but have no business being referenced from tribune), tribune-external skill names not in the known-loadable allowlist.

   **Reference existence check.** Every `references/NAME.md` named in `SKILL.md` actually exists. Every `lane-guides/NAME.md` named in `lane-classification.md` actually exists. Every `medusa-dev:*` skill named in `SKILL.md` or any reference file resolves against the current plugin environment. The resolution check walks the filesystem at `~/.claude/plugins/marketplaces/<marketplace>/plugins/medusa-dev/skills/<skill-name>/` to confirm each named skill directory exists, AND cross-references `~/.claude/plugins/installed_plugins.json` to confirm the plugin is currently enabled (a disabled plugin's files may still exist but will not be loaded by Claude Code). Both checks must pass; either failure reports the break. Version drift is handled by reading the version currently active per `installed_plugins.json` rather than any version present in `~/.claude/plugins/cache/`.

   **Test-writing reference vacuum check.** The v1 SKILL body references `consilium:gladius` for writing failing tests; the rewrite removes that reference. To prevent the Medicus from carrying implicit test-writing expectations that the new SKILL does not instruct, the script greps the rewritten tribune tree for any test-writing guidance. If found, it must be explicit (cite a skill or reference) rather than ambient. Verification-plan execution (running a test) is the Medicus's job; writing tests is Legatus/Soldier work and should NOT appear in tribune references.

   Invocation: `python3 scripts/check-tribune-staleness.py` (report) and `--verbose` (report + unified grep hits). Mirrors the existing `check-codex-drift.py` script's interface.

2. **`CLAUDE.md` update.**
   - Remove line 12: "`/tribune` — summon the Tribunus for debugging. (Not yet reshaped.)"
   - Add: "`/tribune` — summon the Medicus. Diagnosis before execution."
   - Add Medicus to the persona list under Architecture.
   - Add `docs/consilium/debugging-cases/` to the directory conventions (alongside specs/ and plans/).
   - Add `scripts/check-tribune-staleness.py` to Maintenance section.
   - Remove line 49 "Sub-project 7: Systematic Debugger Reshape → /tribune" from Remaining Work.

3. **`docs/CONSILIUM-VISION.md` update.**
   - Add a new section: "The Debugging Subsystem" describing the Medicus + Tribunus-diagnosis-stance + known-gaps doctrine + cases pipeline. One page.
   - Add a matching entry to the Five Verification Points list — now Six, adding "Diagnosis verification (Tribunus + Provocator on the packet)."

4. **Plugin cache sync.** All edited skills (consul, edicts, legion, march, tribune) must be copied to `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/<name>/SKILL.md` per the existing pattern. Handled as a final march task; not in this spec's file manifest per file since the sync is mechanical.

> **Confidence: High.**

## File Manifest

**New files (create):**

- `skills/references/personas/medicus.md`
- `skills/tribune/references/lane-classification.md`
- `skills/tribune/references/diagnosis-packet.md`
- `skills/tribune/references/known-gaps-protocol.md`
- `skills/tribune/references/fix-thresholds.md`
- `skills/tribune/references/lane-guides/storefront-debugging.md`
- `skills/tribune/references/lane-guides/storefront-super-admin-debugging.md`
- `skills/tribune/references/lane-guides/admin-debugging.md`
- `skills/tribune/references/lane-guides/medusa-backend-debugging.md`
- `skills/tribune/references/lane-guides/cross-repo-debugging.md`
- `skills/references/verification/templates/tribune-verification.md`
- `skills/references/domain/known-gaps.md`
- `docs/consilium/debugging-cases/README.md`
- `scripts/check-tribune-staleness.py`

**Modified files (edit):**

- `skills/tribune/SKILL.md` — full rewrite; fold surviving content from `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md` into matching lane guides
- `skills/references/personas/tribunus.md` — add diagnosis stance
- `~/.claude/agents/consilium-tribunus.md` — update `description:` field for both stances; add diagnosis stance to body; no tools/mcpServers change
- `skills/references/verification/templates/mini-checkit.md` — add patrol-stance declaration to dispatch prompt (this is the ONLY Tribunus-dispatching template requiring a stance update; see Deliverable 3)
- `skills/references/domain/MANIFEST.md` — add known-gaps entry
- `skills/consul/SKILL.md` — Debug Routing section (clarifying gate + recap protocol); Medusa Rig reconnaissance guidance using the per-session mechanism
- `skills/edicts/SKILL.md` — Medusa Rig guidance in plan authorship (name skills in Soldier prompts)
- `skills/legion/SKILL.md` — Debug Fix Intake section (case-file-as-orders intake, cross-repo Medium, contain re-surface); Medusa Rig dispatch guidance
- `skills/march/SKILL.md` — mirror legion's intake + dispatch guidance
- `~/.claude/agents/consilium-scout.md` — body-content addition (MCP usage note); no frontmatter change
- `~/.claude/agents/consilium-censor.md` — body-content addition; no frontmatter change
- `~/.claude/agents/consilium-praetor.md` — body-content addition; no frontmatter change
- `~/.claude/agents/consilium-provocator.md` — body-content addition; no frontmatter change
- `~/.claude/agents/consilium-soldier.md` — body-content addition; no frontmatter change
- `CLAUDE.md` — per Deliverable 9
- `docs/CONSILIUM-VISION.md` — per Deliverable 9

**Existing tribune files — folded into lane guides (not deleted):**

Per v1 Censor verification. Content is substantive; Codex fork kept equivalents.

- `skills/tribune/root-cause-tracing.md` → fold into `lane-guides/cross-repo-debugging.md` (tracing across repo boundaries)
- `skills/tribune/defense-in-depth.md` → fold into `lane-guides/cross-repo-debugging.md` (boundary validation discipline)
- `skills/tribune/condition-based-waiting.md` → fold into every lane guide's timing/async subsection (applies universally)

The original files are deleted only after their substantive content has landed in the lane guides; the Legatus confirms no information is lost before removing.

**Plugin cache syncs (mechanical, final step):**

- `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/tribune/SKILL.md` (full sync including the new `references/` subtree)
- `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/consul/SKILL.md`
- `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/edicts/SKILL.md`
- `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/legion/SKILL.md`
- `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/march/SKILL.md`

## Dependencies and Sequencing

| Deliverable | Depends on | Parallelizable with |
|-|-|-|
| 1. Medicus persona | — | 4, 5, 9 |
| 2. `/tribune` skill rewrite | 1 (inlines the persona) | 5 |
| 3. Tribunus collapse | — | 1, 4, 5, 6, 9 |
| 4. Known-gaps doctrine | — (but seed verification requires scouts) | 1, 3, 5 |
| 5. Debugging cases dir | — | 1, 3, 4, 9 |
| 6. Medusa Rig | — (agent frontmatter is already verified universal; work reduces to body content) | 3, 5, 9 |
| 7. Consul/Legion routing | 1, 3, 6 (references the Medicus, Tribunus stance, Medusa Rig guidance) | — |
| 8. Tribune verification template | 1, 3 | 4, 5 |
| 9. Maintenance surfaces | 1, 2, 3, 4, 5, 6, 7, 8 (updates reference artifacts from each) | — |

Recommended march ordering (edicts will finalize):

1. Parallel wave: Deliverables 1 (Medicus persona), 3 (Tribunus collapse + patrol-stance declaration in mini-checkit.md), 4 (known-gaps seed re-verification and rank translation), 5 (debugging-cases README with state machine), 6 (Medusa Rig body-content additions across six user-scope agents + Rig guidance in Consul/Edicts/Legion/March SKILLs).
2. Deliverable 2 (tribune SKILL rewrite, depends on 1) + Deliverable 8 (verification template, depends on 1, 3) in parallel. Deliverable 2 also folds `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md` content into lane guides.
3. Deliverable 7 (routing, depends on 1, 3, 6).
4. Deliverable 9 (maintenance, final) — including staleness-script Medusa-resolution check.
5. Plugin cache sync + staleness script run as the closing discipline.

## Open Decisions the Imperator Must Make Before Execution

1. **Medicus's name.** Spec uses *Gaius Salvius Medicus* as a working placeholder. The Imperator may prefer a different three-name pattern. Consul recommendation: keep `Medicus` as the cognomen (it carries the role) and let execution settle the praenomen/nomen.

2. **Known-gaps seeding threshold.** Spec requires a minimum of three verified entries at ship. Alternatives: ship with whatever survives re-verification even if fewer (risk: thin doctrine), or require all seven (risk: execution stalls on one stubborn stale entry). Consul recommendation: three minimum, include any of the seven that verify cleanly.

3. **Tribune invocation form.** `/tribune` free-text symptoms (current pattern), or `/tribune <lane> <symptom>` short-form for explicit lane override? Consul recommendation: free-text with optional trailing `--lane <name>` flag if the Imperator wants to force classification. Not critical; easy to add later.

4. **Existing tribune files — fold, not delete** (resolved in v2). Per v1 Censor verification, default is now fold-into-lane-guide, not delete. The specific folding targets are stated in the File Manifest; the Legatus confirms no information is lost before removing the originals. No open decision remaining on this unless the Imperator wants to override.

## Prerequisites to Start

- Imperator review of this spec — approve, or direct revisions
- Answers to the four Open Decisions above
- Censor + Provocator verification cleared (this is in progress on the way to the Imperator gate)

## Expected Artifacts After Execution

- Medicus persona at `skills/references/personas/medicus.md`
- Rewritten `/tribune` skill with eight new reference files and four lane guides
- Extended Tribunus persona with two stances; extended user-scope agent
- Known-gaps doctrine in the domain bible with at least three verified entries
- Debugging-cases directory with a README and template
- Medusa Rig wired into Consul, Edicts, Legion, March, and Tribune SKILLs
- Medusa MCP added to any verifier/worker agent lacking it
- Consul and Legion (and March) routing sections for `/tribune` trigger and debug-fix intake
- Tribune verification template at `skills/references/verification/templates/tribune-verification.md`
- Maintenance surfaces: CLAUDE.md updated, CONSILIUM-VISION.md updated, `scripts/check-tribune-staleness.py` created
- Plugin cache synced for all modified skills
- Consilium-repo commit; unpushed

## What This Spec Does NOT Do

- Does not build the evals suite (deferred sub-project)
- Does not write a Divinipress storefront overlay (Imperator has docs prepared; separate effort)
- Does not specialize the Medicus by lane (no `medicus-back`, `medicus-front`, `medicus-cross`). The lane guides are reference material the generic Medicus loads; the Medicus himself is one persona.
- Does not modify `skills/audit`, `skills/gladius`, `skills/sententia`, `skills/tribunal`, `skills/triumph`, `skills/phalanx`, `skills/forge`, `skills/castra`
- Does not touch the Consilium-backend-specialization session 2 work (`consilium-censor-back`, etc.) — orthogonal
- Does not add a hook or any new automation outside the staleness script
- Does not change the finding categories (still MISUNDERSTANDING / GAP / CONCERN / SOUND)
- Does not push any commits

## Confidence Map

| Section | Confidence | Evidence |
|-|-|-|
| Medicus persona | High | Symmetric with Consul/Legatus pattern; Imperator approved |
| `/tribune` skill rewrite | High | Structure mirrors Consul's SKILL; 14 fields now enumerated inline (13 Codex + 1 Divinipress contract-evidence); lane-classification.md contents specified |
| Tribunus collapse | High | Imperator explicit; only `mini-checkit.md` + new `tribune-verification.md` need stance declarations (v3: `campaign-review.md` correctly excluded, does not dispatch Tribunus) |
| Known-gaps location (domain bible) | High | Matches existing domain bible + MANIFEST pattern |
| Known-gaps seeded content | Medium | Each seed entry requires live re-verification at execution |
| Known-gaps Route-field translation | High | v3 maps all seven Codex ranks surfaced by exhaustive `rg`; two name-shared ranks (Consul, Tribunus) route to ours without translation |
| Known-gaps multi-lane encoding | High | v3 specifies `Constituent lanes:` required sub-field; malformed entries caught by staleness script |
| Debugging cases + state machine | High | v3 adds explicit Status field, seven states, Phase 1 scan filter (status + 90-day cap + Resolves cross-ref) |
| Medusa Rig — mechanism (per-session semantics) | High | v2 replaces "attach" with explicit Layer-1/Layer-2 mechanism |
| Medusa Rig — lane mapping | High | Both v1 verifiers confirmed; v2 extended to six lanes; v3 makes Super Admin operationally distinct with its own lane guide |
| Medusa Rig — cross-repo as default | High | Imperator explicit about bug distribution |
| Medusa Rig — agent frontmatter | High | v1 Censor verified all six user-scope agents already carry Medusa MCP; v2 reduces agent-file work to body notes only |
| Medusa Rig — third-party fragility | High | v3 specifies plugin-path target (marketplaces dir + installed_plugins.json cross-check); version drift handled |
| Consul Debug Routing | High | Clarifying gate + recap protocol added in v2 |
| Legion/March Debug Fix Intake | High | Case-file-as-orders transport; cross-repo Medium gated on packet field 14 (contract-compat evidence); contain re-surface via state machine |
| Tribune verification template | High | Ports the spec-verification template structure |
| 14-field diagnosis packet | High | 13 Codex fields ported verbatim; 14th Divinipress-specific field (contract compatibility evidence) enables Medium-vs-Large cross-repo distinction on evidence rather than assertion |
| Fix threshold definitions | Medium | Small/Medium/Large/Contain boundaries; cross-repo Medium gated on field 14 in v3 |
| Existing tribune file disposition | High | v2 resolved — fold into lane guides (Censor v1 verified substance) |
| Maintenance surfaces | High | Standard CLAUDE.md / VISION / script-add pattern; staleness script gains three check classes (banned-regex, reference existence + Medusa resolution, test-writing vacuum) |

## Review Instructions for the Imperator

Read the Revision Note first to confirm the v1 findings are correctly absorbed. Then scan the Deliverables. Flag:

- Any deliverable whose scope you want tightened or expanded
- The Medicus's creed and trauma drafts — do they carry the voice you want?
- The hypothesis bias language — is cross-repo strong enough as default?
- The six-lane taxonomy — does adding `storefront-super-admin` and `unknown` match your mental model of Divinipress surfaces?
- The case-file-as-orders transport — is `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` the right path?
- The cross-repo Medium threshold handling (two coordinated marches, no auto-escalation) — appropriate?
- The contain-case re-surface rule (Medicus's Phase 1 scans the cases dir for open items) — the right closure mechanism?
- The three Open Decisions remaining (item 4 resolved in v2)

Once approved, the spec dispatches `/edicts` to produce the implementation plan, then `/march` executes.
