# Tribune Consiliumization Plan

Date: 2026-04-23
Scope: plan/spec only. This artifact does not implement, install, generate, or route anything.

## Assumptions

- `skills/tribune/` is intended to become the Codex Consilium debugging skill surface, not a new agent rank.
- `consilium-tribunus` remains the per-task verifier. A Tribune debugging skill may ask Tribunus to verify a diagnosis packet, but Tribunus must not become the debugger.
- "Admin" has two live meanings in the Divinipress estate:
  - Storefront Super Admin pages in `divinipress-store/src/app/(authenticated)/admin/`.
  - Medusa Admin dashboard extensions in `divinipress-backend/src/admin/`.
- "Fully Consilium" means the plan covers source path, install path, runtime invocation, routing, stale references, domain tuning, known-gap capture, and evals.
- Known gaps are hypotheses until reverified against the live repo in the current debugging session.

## Grounded Inputs

I verified the plan against these live files and paths:

- `README.md:5-11`, `README.md:39-47`, `README.md:48-66`, `README.md:100-106`
- `source/manifest.json:4-20`, `source/manifest.json:23-39`, `source/manifest.json:87-99`, `source/manifest.json:102-128`, `source/manifest.json:131-170`, `source/manifest.json:174-215`
- `source/protocols/consul-routing.md:7-18`
- `source/protocols/legatus-routing.md:5-16`
- `source/roles/tribunus.md:1-23`
- `source/roles/consul.md:31-65`
- `source/roles/legatus.md:31-64`
- `source/roles/speculator-front.md:12-35`
- `source/roles/speculator-back.md:12-36`
- `source/roles/interpres-front.md:9-18`
- `source/roles/interpres-back.md:9-28`
- `source/roles/arbiter.md:9-22`
- `source/roles/centurio-front.md:12-35`
- `source/roles/centurio-back.md:12-38`
- `source/doctrine/frontend.md:3-23`
- `source/doctrine/backend.md:3-22`
- `source/doctrine/medusa-backend.md:3-32`
- `source/doctrine/cross-repo.md:1-7`
- `source/doctrine/orchestration-law.md:1-9`
- `source/doctrine/retrieval-law.md:1-8`
- `source/doctrine/verifier-law.md:1-19`
- `scripts/generate_agents.py:8-12`, `scripts/generate_agents.py:23-43`, `scripts/generate_agents.py:60-76`
- `scripts/install-codex-agents.sh:14-37`, `scripts/install-codex-agents.sh:39-62`
- `scripts/sync-codex-config.py:21-38`
- `config/codex-config-snippet.toml:3-71`
- `evals/README.md:1-20`, `evals/README.md:33-53`
- `evals/tasks/01-consul-routing.md:5-12`
- `evals/tasks/07-backend-medusa-routing.md:5-13`
- `evals/tasks/09-backend-medusa-review.md:5-13`
- All current files under `skills/tribune/`.
- `/Users/milovan/projects/Consilium/docs/consilium/ROADMAP.md:282-318`
- `/Users/milovan/.codex/skills/building-with-medusa/SKILL.md`
- `/Users/milovan/.codex/skills/building-storefronts/SKILL.md`
- `/Users/milovan/.codex/skills/building-admin-dashboard-customizations/SKILL.md`
- Selected Medusa reference files for routes, workflows, querying, module links, authentication, frontend integration, and admin dashboard data loading.
- Live Divinipress repo evidence from `divinipress-store` and `divinipress-backend`, cited below in the tuning sections.

Serena was activated for `/Users/milovan/projects/Consilium-codex`. The repo is mostly Markdown, JSON, shell, and Python, so exact search and line-numbered reads carried most of the concrete truth. Serena search confirmed the key stale references and routing anchors.

## Blunt Current-State Assessment

Current solidity: 4 out of 10.

What is good:

- The imported skill has strong root-cause discipline. `skills/tribune/SKILL.md:12-20` gives a hard no-fix-before-root-cause rule, and `skills/tribune/SKILL.md:46-169` gives a usable four-phase diagnostic loop.
- The reference files contain useful techniques: backward tracing in `root-cause-tracing.md`, condition-based waiting in `condition-based-waiting.md`, and defense-in-depth in `defense-in-depth.md`.
- The pressure tests are directionally useful because they stress emergency, exhaustion, and authority pressure.

What is not acceptable for "full Consilium":

- It is still a verbatim port. It references `skills/debugging/systematic-debugging`, `/Users/jesse/.claude/CLAUDE.md`, Claude, Lace, and generic TS imports that are not Divinipress or Codex source truth.
- It has no Consilium routing model. It does not know when to use Interpres, Speculator, Arbiter, Tribunus, Legatus, or Centurions.
- It violates the roadmap's new debugging shape. The roadmap requires diagnosis, then independent Tribunus verification, then threshold-based routing before fixes. The current skill goes straight from hypothesis testing to implementation.
- It still names `consilium:gladius` and `consilium:sententia` in `skills/tribune/SKILL.md:179` and `skills/tribune/SKILL.md:286-288`, but those are not Codex-codex source surfaces in this repo's manifest or protocols.
- It has no Divinipress storefront, admin, or Medusa backend tuning.
- It has no known-gap intake loop, no case-log format, and no eval coverage under `evals/tasks/`.
- It is not wired to the Codex source install model. The current agent install path covers TOMLs only. Also, the currently discovered user-scope `~/.agents/skills/tribune` is a symlink to `/Users/milovan/projects/Consilium/skills/tribune`, not this Codex source repo.
- It contains Markdown tables and emoji in the imported files. That conflicts with this repo's current AGENTS instruction for output discipline and should not survive the cleanup pass.

The verdict: keep the core debugging method, but reshape the package around Consilium orchestration. Do not add a new agent by default.

## New Agents Or Existing Ranks

Recommendation: no new agent in the first real implementation pass.

Use `skills/tribune/` as the debugging workflow skill. It should orchestrate existing ranks:

- Consul or the active main model owns synthesis, triage, user-facing decisions, and the final diagnosis packet.
- Interpres-front and Interpres-back explain domain meaning.
- Speculator-front and Speculator-back prove exact file, symbol, route, and execution-path truth.
- Arbiter judges frontend-backend contract drift.
- Tribunus independently verifies the diagnosis packet and later verifies completed implementation tasks.
- Legatus executes approved fixes through the right Centurion.
- Censor, Praetor, and Provocator review plans when the bug points to a design, feasibility, or risk issue.

Why this wins:

- The manifest already defines all needed ranks with the right lane ownership.
- Consul routing already says retrieval, tracing, verification, and implementation should be delegated to specialists.
- The roadmap asks for Tribunus verification before fixes, not for a new debugger rank.
- A new debugger agent would overlap with Consul, Speculator, Interpres, and Tribunus at once. That is exactly the kind of authority blur Consilium is trying to avoid.

Rejected for now: add `consilium-debugger` or `consilium-tribune` as a custom agent.

- It would duplicate Consul's orchestration function.
- It would compete with Speculator for tracing and with Interpres for domain interpretation.
- It would tempt the runtime to put diagnosis, verification, and fix routing into one agent, which weakens independent verification.
- It would create more install and config surface before the skill has eval data proving that a new rank is necessary.

Future trigger for reconsidering a new agent:

- Add a new diagnostician rank only if debugger evals show repeated failures caused by the active model losing diagnostic state, not merely stale skill content.
- Threshold: at least 2 failures across 5 fresh debugger evals where the skill correctly instructs dispatch but the workflow still collapses into broad self-search or speculative edits.
- If that threshold is hit, the new agent should be a diagnosis-only investigator. It still must not verify itself or execute fixes.

## Recommended Target Architecture

The target is a skill-led, rank-orchestrated debugging surface:

1. `skills/tribune/SKILL.md` becomes the lean trigger and top-level procedure.
2. Detailed techniques move under `skills/tribune/references/`.
3. Divinipress known gaps live in shared doctrine, not only in the skill.
4. Consul and Legatus routing gain a narrow debug route.
5. Tribunus gains a narrow diagnosis-verification contract without becoming the debugger.
6. Install scripts learn how to install Codex skills from this repo, not from the Claude-oriented repo.
7. Evals prove routing, diagnosis discipline, domain tuning, and install correctness.

Target file structure:

- Add `skills/tribune/agents/openai.yaml`.
- Rewrite `skills/tribune/SKILL.md` as the core Codex workflow.
- Add `skills/tribune/references/core-debugging.md`.
- Add `skills/tribune/references/dispatch-rules.md`.
- Add `skills/tribune/references/storefront-debugging.md`.
- Add `skills/tribune/references/admin-debugging.md`.
- Add `skills/tribune/references/medusa-backend-debugging.md`.
- Add `skills/tribune/references/known-gaps-protocol.md`.
- Add `source/doctrine/divinipress-known-gaps.md`.
- Add `docs/consilium/debugging-cases/README.md`.
- Add debugger eval tasks under `evals/tasks/10-...` through `evals/tasks/18-...`.
- Add `scripts/install-codex-skills.sh`.
- Optionally add `scripts/install-codex.sh` as a convenience wrapper that runs both agent and skill install scripts.

Files to edit after this plan is approved:

- `README.md`
- `source/manifest.json`
- `source/protocols/consul-routing.md`
- `source/protocols/legatus-routing.md`
- `source/roles/tribunus.md`
- `skills/tribune/SKILL.md`
- Existing `skills/tribune/*.md`, either rewritten into references or removed from the runtime skill package.
- `evals/README.md`
- `scripts/install-codex-agents.sh` only if the installer wrapper needs shared validation behavior. Prefer a new skills installer first.

Files to intentionally leave alone unless evals prove otherwise:

- `source/roles/consul.md`
- `source/roles/legatus.md`
- `source/roles/speculator-front.md`
- `source/roles/speculator-back.md`
- `source/roles/interpres-front.md`
- `source/roles/interpres-back.md`
- `source/roles/arbiter.md`
- `source/roles/centurio-front.md`
- `source/roles/centurio-back.md`
- Generated `agents/*.toml` until the source files and manifest are updated in a later implementation pass.
- `config/codex-config-snippet.toml` until `scripts/generate_agents.py` is intentionally run after source changes.
- Existing Divinipress app repos. This plan does not change store or backend code.

## Runtime Debugging Model

Trigger:

- User names `tribune`, `consilium:tribune`, debugging, bug, test failure, build failure, unexpected behavior, flaky test, production issue, regression, or "stop guessing."

Output contract:

- The skill should produce a diagnosis packet before any fix proposal.
- The diagnosis packet must include symptom, reproduction or evidence, affected repo lane, traced failing boundary, root cause hypothesis, contrary evidence checked, proposed fix site, fix risk class, and verification plan.
- No code fix should begin until the diagnosis packet has been independently checked or the user explicitly asks for emergency containment.

Emergency containment rule:

- Temporary containment is allowed only when the user is dealing with a real outage or serious business impact.
- It must be labeled containment, not root-cause fix.
- It must be reversible, minimal, and followed by normal diagnosis.
- It cannot close the debugging workflow.

Diagnosis quality gate:

- A diagnosis can advance only if one of these is true:
  - It is reproducible with exact steps or a failing command.
  - It has two independent evidence points showing the same failing boundary.
  - It is an external or environment issue and the boundary evidence proves the app handed off correctly.
- If none is true, the workflow stays in evidence gathering.

Tribunus diagnosis verification:

- The active model sends a bounded diagnosis packet to `consilium-tribunus`.
- Tribunus returns only `MISUNDERSTANDING`, `GAP`, `CONCERN`, or `SOUND` with evidence.
- `SOUND` unlocks fix routing.
- `CONCERN` unlocks fix routing only if the concern is explicitly accepted or mitigated.
- `GAP` or `MISUNDERSTANDING` sends the workflow back to diagnosis.
- This does not make Tribunus the debugger. It verifies the completed diagnosis task.

Fix routing thresholds:

- Small fix:
  - One repo.
  - One or two files.
  - No schema, migration, module link, money path, permission boundary, state machine, cross-repo contract, routing protocol, or generated agent output.
  - No unresolved known gap.
  - A narrow verification command exists.
  - Route: Legatus may assign one Centurion, or the active session may implement only if the user explicitly wants inline work and no dispatch is available.

- Medium fix:
  - One repo.
  - Three to six files, or a domain hook plus API hook, or an admin data-flow change, or a backend route plus workflow step.
  - No unresolved cross-repo contract.
  - Route: write a short implementation plan, check with Praetor if ordering or file collision risk exists, then Legatus dispatches the right Centurion. Tribunus verifies after the task.

- Large fix:
  - Cross-repo contract.
  - Medusa workflow, module, module link, migration, tenant or permission boundary, money path, state machine, or product lifecycle change.
  - More than six files.
  - More than one failed fix attempt.
  - Any diagnosis that exposes unclear product truth.
  - Route: Consul writes or updates a plan, Arbiter checks cross-repo truth if needed, Censor/Praetor/Provocator pressure the plan, Legatus executes after approval.

Stop rule:

- After two failed fix attempts, no third attempt without restating the diagnosis and asking what new evidence changed.
- After three failed attempts, stop and run architecture review with Censor, Praetor, and Provocator. At that point the bug is probably not a local patch problem.

## Rank Routing Model

The skill should route by question type:

- Use Interpres-front when the bug depends on frontend domain meaning, proof/order UI rules, thin page ownership, or whether a hook is canonical.
- Use Speculator-front when the bug needs exact frontend files, symbols, imports, hook call paths, route ownership, or component execution flow.
- Use Interpres-back when the bug depends on backend domain meaning, Medusa layer placement, proof/order lifecycle, tenancy, permission semantics, or docs-vs-code drift.
- Use Speculator-back when the bug needs exact backend routes, workflow steps, service calls, status transitions, middleware, or query path evidence.
- Use Arbiter when a frontend assumption and backend behavior might disagree.
- Use Tribunus after the diagnosis packet and after any meaningful implementation task.
- Use Censor when the diagnosis suggests the product/domain model is wrong.
- Use Praetor when the fix has sequencing, dependency, or file collision risk.
- Use Provocator when the fix seems obvious, risky, high-confidence, or likely to hide a deeper failure.
- Use Legatus only after the fix path is verified or approved.
- Use Centurio-front for bounded storefront or store-admin implementation in `divinipress-store`.
- Use Centurio-back for bounded Medusa backend implementation in `divinipress-backend`.
- Use Centurio-primus only after ambiguity is reduced and the work does not fit clean frontend or backend lanes.

## How Storefront Debugging Should Differ

Storefront lane: `divinipress-store`, excluding the Medusa Admin extension in backend.

Primary truth surfaces verified in repo doctrine:

- `source/doctrine/frontend.md:3-23`
- `/Users/milovan/projects/divinipress-store/src/app/_domain/`
- `/Users/milovan/projects/divinipress-store/src/app/_api/`
- `/Users/milovan/projects/divinipress-store/docs/domain/`
- `/Users/milovan/projects/divinipress-store/docs/component-decisions.md`

Storefront debugging rules:

- Start with domain hooks and API hooks before page files.
- Treat pages as thin orchestrators unless live code proves otherwise.
- Never import from or reason from `src/_quarantine/` as live code.
- Treat `StatusBadge` as the required status primitive. Live component decisions say status of a domain object should use `StatusBadge`, not a hand-rolled badge.
- Do not assume frontend permission gates are backend authorization.
- Locate the current API client before judging request behavior. The Medusa storefront skill says SDK first, but live `divinipress-store` currently has `companyApi`, `storeApi`, and `medusaSdk` wrappers. A bug may be caused by wrapper divergence, but the debugger must prove that instead of blindly rewriting everything to SDK calls.
- For auth/header bugs, inspect `src/app/_lib/api/storeApi.ts:7-30`, `src/app/_lib/axiosInstance.ts:10-53`, and `src/app/_lib/medusaClient.ts:1-10`.
- For custom-order bugs, classify which flow is involved: catalog-proof, order-proof, or reorder.
- For status bugs, keep `OrderStatus` and `JobStatus` separate. The docs confirm two independent tracks for customer-facing status and staff-facing production status.
- For proof lock bugs, check the lock rule: `job_status` pending and no critical alerts locks most mutations; critical alerts intentionally unlock specific behavior.
- For catalog bugs, check non-apparel launch state. The live docs say non-apparel categories are frontend-ready but backend option config still falls back to apparel.

Storefront known failure modes to make first-class:

- Frontend-only permission gates hiding backend permission gaps.
- Quarantine or mock code mistaken for live code.
- Status display bugs caused by using raw badges or collapsing `OrderStatus` and `JobStatus`.
- Catalog proof versus order proof versus reorder logic mixed together.
- Saved product naming and display-name cascades misunderstood.
- Images missing because `thumbnail`, `images`, variant metadata, and saved-product thumbnails are hydrated differently.
- Non-apparel product paths treated as launched when backend option configs are still apparel-only.
- React Query invalidation or query key mistakes after mutations.
- API wrapper header drift, especially publishable key and bearer auth behavior.

Concrete live evidence:

- `source/doctrine/frontend.md:12-23` names frontend hard rules and dangerous assumptions.
- `/Users/milovan/projects/divinipress-store/docs/component-decisions.md:96-111` says status objects use `StatusBadge`.
- `/Users/milovan/projects/divinipress-store/docs/domain/custom-order.md:16-33` describes the three flows and dual state machine.
- `/Users/milovan/projects/divinipress-store/docs/domain/custom-order.md:137-148` describes the proof lock and critical-alert exception.
- `/Users/milovan/projects/divinipress-store/docs/domain/catalog-product.md:84-132` documents non-apparel as prepared, not launched, and warns against legacy catalog sources.
- `/Users/milovan/projects/divinipress-store/src/app/_lib/api/storeApi.ts:7-30` and `/Users/milovan/projects/divinipress-store/src/app/_lib/axiosInstance.ts:10-53` show current axios wrappers.
- `/Users/milovan/projects/divinipress-store/src/app/_lib/medusaClient.ts:1-10` shows the SDK also exists.

## How Admin Debugging Should Differ

Admin lane splits in two.

Storefront Super Admin:

- Repo: `/Users/milovan/projects/divinipress-store`
- Path: `src/app/(authenticated)/admin/`
- Rank default: Interpres-front or Speculator-front first.
- Escalate to Arbiter when an admin UI action assumes backend event semantics, permission behavior, or status transitions.
- Route implementation to Centurio-front unless the root cause is backend contract or backend authorization.

Medusa Admin dashboard customization:

- Repo: `/Users/milovan/projects/divinipress-backend`
- Path: `src/admin/`
- Required skill: `building-admin-dashboard-customizations`
- Rank default: Interpres-back for placement and Speculator-back for exact files, with admin-dashboard skill references loaded before judging data loading or component patterns.
- Route implementation to Centurio-back because the code lives in the backend repo, even though it is React UI.

Admin debugging rules:

- First disambiguate which admin surface the user means.
- For store-admin bugs, trace action hook to API hook to backend route or event.
- For Medusa Admin bugs, load the admin dashboard skill and inspect data-loading, form/modal, and Medusa UI rules.
- Check whether display data loads on mount. The admin skill warns against tying display data to modal-open state.
- Check whether display queries and modal/form queries are separate.
- Check mutation invalidation. Broad `invalidateQueries()` may work but should be judged against the actual query keys and symptoms.
- Check whether the code uses Medusa UI components and semantic classes when it is in `src/admin`.
- For create/edit forms, use the skill rule: FocusModal for create, Drawer for edit, unless the existing repo pattern clearly differs and the difference is intentional.

Concrete live evidence:

- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/admin/` contains orders, proofs, products, organizations, invites, and impersonation routes.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/admin/orders/[orderId]/_hooks/useAdminOrderActions.ts:7-67` maps admin actions to custom-order events.
- `/Users/milovan/projects/divinipress-store/src/app/(authenticated)/admin/orders/[orderId]/_hooks/useAdminOrderDetail.ts:21-188` maps Medusa order items into admin display data and has comments about production files and image resolution.
- `/Users/milovan/projects/divinipress-backend/src/admin/routes/company/page.tsx:1-27` shows Medusa Admin route imports and current query/mutation setup.
- `/Users/milovan/projects/divinipress-backend/src/admin/routes/company/page.tsx:47-126` shows create, delete, and list data loading behavior.
- `/Users/milovan/projects/divinipress-backend/src/admin/lib/fetch.ts:9-17` shows the current admin fetch wrapper.

## Medusa Backend Tuning Plan

Backend lane: `/Users/milovan/projects/divinipress-backend`.

Required knowledge:

- Load `building-with-medusa` for backend Medusa debugging.
- Load specific Medusa references based on the failing layer:
  - API route bug: `reference/api-routes.md`
  - Workflow mutation bug: `reference/workflows.md`
  - Cross-module query bug: `reference/querying-data.md`
  - Link bug: `reference/module-links.md`
  - Auth or actor bug: `reference/authentication.md`
  - Subscriber/event bug: `reference/subscribers-and-events.md`
  - Admin UI extension bug: `building-admin-dashboard-customizations`

Backend debugging rules:

- Classify failure layer first: route, middleware, workflow, workflow step, module service, link, query, subscriber, script, seed, or Medusa Admin extension.
- Mutations should be workflow-first. Route-level mutation logic, route-level ownership checks, and direct route-to-module mutation calls are suspect unless legacy repo truth and Medusa guidance are explicitly reconciled.
- Use `query.graph()` for retrieval across links when not filtering by linked-module fields.
- Use `query.index()` when filtering across linked data in separate modules.
- Treat JavaScript filtering of linked data as a possible correctness and scale bug when database filtering is possible.
- Treat company scoping as a security boundary.
- Treat prices as stored as-is, not cents, unless live code proves a specific endpoint returns a different shape.
- Do not conflate Medusa default auth with Divinipress company context or role permission checks.
- If repo truth and Medusa guidance diverge, name both. Do not silently "fix" established code during debugging unless the divergence is the root cause.

Backend known failure modes to make first-class:

- Permission middleware gaps where frontend role gates are the only protection.
- Company-scoping bugs in team, collection, product, invite, and onboarding routes.
- Global uniqueness where the intended uniqueness is company-scoped.
- `ADMIN_HOLD` treated as live policy when docs say it is placeholder and current wiring is incoherent.
- Custom-order status transitions misread because order status and job status are different tracks.
- Catalog proof, order proof, and reorder records all sharing the same custom-order table.
- Upload and metadata hydration bugs around proof files, production files, line item metadata, and saved-product metadata.
- Non-apparel option config defaulting to apparel because backend `ProductionOptionsType` only contains apparel.
- Route-level mutation logic bypassing Medusa workflows.
- `query.graph()` used where `query.index()` is required.
- Money bugs from cents conversion assumptions.

Concrete live evidence:

- `source/doctrine/backend.md:12-22` names backend hard rules and dangerous assumptions.
- `source/doctrine/medusa-backend.md:12-32` defines route, workflow, module, query, and review law.
- `/Users/milovan/projects/divinipress-store/docs/domain/team.md:33-47` documents a likely global team-name uniqueness bug.
- `/Users/milovan/projects/divinipress-store/docs/domain/team.md:114-120` documents backend permission and staff visibility gaps.
- `/Users/milovan/projects/divinipress-store/docs/domain/invite-flow.md:22-45` documents customer admin invite limitations and lack of backend role check.
- `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:16-30` documents the actual onboarding signal and the mismatch with colloquial flow language.
- `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:64-66` documents the latent admin-role permission gap.
- `/Users/milovan/projects/divinipress-store/docs/domain/onboarding-flow.md:126-163` documents promo and onboarding metadata bookkeeping.
- `/Users/milovan/projects/divinipress-store/docs/domain/custom-order.md:183-194` documents `ADMIN_HOLD` as both placeholder and currently incoherent wiring.

## Reference Cleanup Map

`skills/tribune/SKILL.md`

- Current issue: generic systematic debugging, no Consilium ranks.
- Current issue: direct implementation phase conflicts with roadmap diagnosis verification.
- Current issue: `consilium:gladius` and `consilium:sententia` references are not Codex-codex source surfaces.
- Current issue: Markdown tables at the rationalization and quick-reference sections.
- Action: rewrite as lean Codex skill with these sections only: trigger, no-fix law, diagnosis packet, routing rules, domain lane selection, thresholds, verification gates, output contract, reference loading guide.
- Verification: exact searches find no `consilium:gladius`, `consilium:sententia`, or `skills/debugging/systematic-debugging` references, and the runtime docs contain no Markdown table rows.

`skills/tribune/root-cause-tracing.md`

- Current issue: examples cite `/Users/jesse/project` and generic git-init pollution.
- Current issue: dot diagrams are not useful in Codex runtime and add noise.
- Action: move reusable backward-tracing method into `references/core-debugging.md`; replace examples with Divinipress route-to-workflow, hook-to-API, and admin action-to-event traces.
- Verification: no `/Users/jesse`, no dot graph blocks, at least one storefront trace, one backend trace, and one cross-repo trace.

`skills/tribune/condition-based-waiting.md`

- Current issue: Markdown table and generic timing examples.
- Current issue: useful idea, but not tuned to Playwright, React Query, Medusa jobs, or backend tests.
- Action: rewrite as a reference for replacing arbitrary sleeps in Playwright, React Query tests, local scripts, and async Medusa workflow checks.
- Verification: no table pipes; examples include condition wait, network response wait, query invalidation wait, and explicit exception for real timing tests.

`skills/tribune/condition-based-waiting-example.ts`

- Current issue: imports Lace-specific `ThreadManager`, `LaceEvent`, and `LaceEventType`.
- Action: remove from runtime package or replace with generic snippets embedded in the reference file. Do not ship broken imports.
- Verification: `fd -a condition-based-waiting-example.ts skills/tribune` returns no runtime example unless it is Divinipress-valid.

`skills/tribune/defense-in-depth.md`

- Current issue: generic validation-everywhere framing can become overbuilding.
- Action: rewrite as layered defense by domain: UI validation, API hook validation, backend middleware schema, workflow business checks, module persistence constraints, and observability.
- Verification: includes warning that defense-in-depth follows root cause and should not add speculative layers.

`skills/tribune/find-polluter.sh`

- Current issue: hardcodes `find` and `npm test`, includes emoji, and assumes npm.
- Action: either remove it or replace with `scripts/find-test-polluter.sh` that accepts explicit test command, pollution path, and file list command. Use `fd` by default. Do not assume npm or yarn.
- Verification: `shellcheck` if available; dry-run mode lists tests without running them; no emoji; no hardcoded `npm test`.

`skills/tribune/test-academic.md`

- Current issue: references `skills/debugging/systematic-debugging`.
- Action: convert into `evals/tasks/10-tribune-basic-discipline.md` or delete after equivalent eval exists.
- Verification: eval references `skills/tribune/` or `consilium:tribune`, not old path.

`skills/tribune/test-pressure-1.md`

- Current issue: generic production-payment scenario and old skill path.
- Action: convert into a Divinipress emergency containment eval, such as checkout completion failure or proof submission outage.
- Verification: pass criteria require containment labeling and no root-cause claim without evidence.

`skills/tribune/test-pressure-2.md`

- Current issue: generic timeout exhaustion scenario and old skill path.
- Action: convert into a flaky Playwright or React Query invalidation eval for storefront/admin.
- Verification: pass criteria reject bigger sleeps and require condition-based wait or data-flow diagnosis.

`skills/tribune/test-pressure-3.md`

- Current issue: generic authority-pressure scenario and old skill path.
- Action: convert into a "senior says backend permission is fine because UI gates it" eval.
- Verification: pass criteria route to backend truth or Arbiter and reject frontend-only authority.

`skills/tribune/CREATION-LOG.md`

- Current issue: creation log belongs to import history, not a runtime skill package.
- Action: remove from skill package after this plan is accepted, or archive under `docs/consilium/archive/tribune-import-creation-log.md` if Milovan wants the provenance preserved.
- Verification: runtime skill folder contains only `SKILL.md`, `agents/openai.yaml`, references, and intentional scripts.

`README.md`

- Current issue: install section covers agents only.
- Action: add Codex skill install instructions after skills installer exists.
- Verification: README names agent install and skill install separately, and says current threads need restart to pick up new agent or skill metadata.

`source/manifest.json`

- Current issue: no debugger agent should be added now.
- Action: do not add a debugger agent. Add `source/doctrine/divinipress-known-gaps.md` to relevant agent include lists only after that doctrine exists and stays compact.
- Verification: no new `consilium-debugger` or `consilium-tribune` agent appears unless eval thresholds later justify it.

`source/protocols/consul-routing.md`

- Current issue: no debugging route.
- Action: add a narrow debug route telling Consul to invoke the Tribune skill for bugs, route diagnosis to specialists, and require Tribunus diagnosis verification before fixes.
- Verification: route mentions debugging without making Consul do broad inline tracing.

`source/protocols/legatus-routing.md`

- Current issue: execution routing exists, but not debug-threshold routing.
- Action: add fix-scope thresholds and require Tribunus after debug-fix tasks.
- Verification: Legatus still executes approved work and does not perform diagnosis itself.

`source/roles/tribunus.md`

- Current issue: role is per-task verifier, which is correct, but does not explicitly cover diagnosis-packet verification.
- Action: add one sentence: verifies a completed diagnosis packet when Tribune asks, but does not investigate or own fixes.
- Verification: role still says Function is per-task verifier and output is still `MISUNDERSTANDING`, `GAP`, `CONCERN`, or `SOUND`.

## Known-Gaps Capture And Feedback Loop

Add canonical doctrine:

- `source/doctrine/divinipress-known-gaps.md`

Initial entries should be compact and evidence-backed:

- `GAP-custom-order-admin-hold-placeholder`
- `GAP-team-name-global-unique`
- `GAP-team-routes-permission-frontend-only`
- `GAP-my-products-staff-visibility-frontend-only`
- `GAP-invites-customer-admin-resend-revoke-missing`
- `GAP-onboarding-metadata-script-only`
- `GAP-non-apparel-backend-options-apparel-only`
- `GAP-catalog-legacy-quarantine-not-live`

Each entry should use this shape:

- ID
- Domain
- Status: active, suspected, resolved, stale
- Last verified date
- Evidence anchors
- Symptoms that should trigger this entry
- What not to assume
- Required recheck before using
- Owner or likely owner if known
- Promotion history from debug cases

Add case logs:

- Directory: `docs/consilium/debugging-cases/`
- One file per resolved or abandoned debug session.
- Filename: `YYYY-MM-DD-short-slug.md`.
- Required sections: symptom, repo lane, evidence gathered, root cause, fix route, verification run, gaps discovered, promoted doctrine changes.

Promotion rules:

- Promote to known gaps when the same failure mode appears twice.
- Promote immediately if the failure mode touches auth, tenant isolation, money, order/proof status, checkout, or cross-repo contract truth.
- Do not promote one-off syntax mistakes.
- Do not promote stale docs unless live repo evidence agrees.

Staleness rules:

- Active code gap entries become stale after 45 days without re-verification.
- Product-planning gaps become stale after 90 days without re-verification.
- A stale gap can still seed a hypothesis, but the debugger must reverify before using it as current truth.

Future graph loop:

- After the roadmap's Learning Loop and Knowledge Graph work exists, debug case logs and known gaps should be ingested.
- The runtime query shape should stay small: `pitfalls(concept)`, `cases(concept)`, and `stale_gaps(repo)`.
- Until then, keep it file-based and explicit.

## Install And Wiring Model

Current verified state:

- `scripts/install-codex-agents.sh` regenerates and installs `consilium-*.toml` into `~/.codex/agents`.
- `scripts/sync-codex-config.py` syncs agent registration blocks into `~/.codex/config.toml`.
- There is no skill installer in this repo.
- `~/.agents/skills/tribune` currently symlinks to `/Users/milovan/projects/Consilium/skills/tribune`.
- This repo is intentionally separate from `/Users/milovan/projects/Consilium`; README says the two runtimes should not share prompt source.

Recommended install model:

1. Keep source of truth in `/Users/milovan/projects/Consilium-codex/skills/tribune`.
2. Add `scripts/install-codex-skills.sh`.
3. The script validates:
   - `skills/tribune/SKILL.md` exists.
   - frontmatter has `name` and `description`.
   - `skills/tribune/agents/openai.yaml` exists once added.
   - no banned stale references remain.
   - no Markdown table pipes remain in runtime skill docs.
4. The script installs the skill by symlink for local development:
   - preferred target: `~/.agents/skills/tribune` if current Codex skill discovery continues to use that user-scope path on this machine.
   - fallback target: `~/.codex/skills/tribune` only if a fresh Codex thread proves that is the active user-scope skill path and there is no duplicate plain `tribune` collision.
5. The script refuses to point `~/.agents/skills/tribune` at `/Users/milovan/projects/Consilium`.
6. Add `scripts/install-codex.sh` only as a convenience wrapper:
   - runs `scripts/install-codex-agents.sh`
   - runs `scripts/install-codex-skills.sh`
   - optionally runs `scripts/sync-codex-config.py`
7. Do not add a debugger agent to `source/manifest.json`.
8. Do update routing docs after the skill is rewritten.
9. After installing, start a fresh Codex thread and verify the skill source path shown in the skill list points at `Consilium-codex`.

Verification commands for the future implementation pass:

- `readlink /Users/milovan/.agents/skills/tribune`
- `rg -n "skills/debugging/systematic-debugging" skills/tribune`
- `rg -n "/Users/jesse" skills/tribune`
- `rg -n "Claude" skills/tribune`
- `rg -n "Lace" skills/tribune`
- `rg -n "consilium:gladius" skills/tribune`
- `rg -n "consilium:sententia" skills/tribune`
- run a table-syntax check against runtime skill docs before install
- `python3 scripts/generate_agents.py`
- `bash scripts/install-codex-agents.sh`
- `bash scripts/install-codex-skills.sh`
- Start a new Codex thread and confirm the skill source path.

## Phased Implementation Plan

Phase 0: Freeze and verify baseline

- Step: Capture current file inventory for `skills/tribune/`, `source/`, `scripts/`, and `evals/`.
- Verify: `fd -a . skills/tribune source scripts evals -d 4`.
- Step: Record current installed skill symlink.
- Verify: `readlink /Users/milovan/.agents/skills/tribune` points to the old Claude-side source before implementation and to Consilium-codex only after install work.
- Step: Do not edit generated TOMLs yet.
- Verify: `git status --short` shows only intended source changes.

Phase 1: Clean the skill package

- Step: Add `skills/tribune/agents/openai.yaml`.
- Verify: generated metadata names the skill as Consilium debugging, not generic systematic debugging.
- Step: Rewrite `skills/tribune/SKILL.md` as a concise Codex workflow with the diagnosis packet, dispatch rules, thresholds, and verification gates.
- Verify: no stale refs, no tables, no Claude/Jesse/Lace references.
- Step: Move detailed techniques into `skills/tribune/references/`.
- Verify: `SKILL.md` stays below 500 lines and links each reference with clear load conditions.
- Step: Remove or archive `CREATION-LOG.md` and the old pressure tests from the runtime skill package after equivalent evals exist.
- Verify: runtime skill package contains no import-history documents.

Phase 2: Add Consilium debug routing

- Step: Update `source/protocols/consul-routing.md` with a debug route.
- Verify: Consul routes diagnosis work to Interpres, Speculator, Arbiter, and Tribunus instead of broad inline file reading.
- Step: Update `source/protocols/legatus-routing.md` with debug fix thresholds.
- Verify: Legatus receives only verified or approved fix work.
- Step: Update `source/roles/tribunus.md` with diagnosis-packet verification language.
- Verify: Tribunus remains per-task verifier and still outputs only the standard four finding categories.

Phase 3: Add domain references

- Step: Add `skills/tribune/references/storefront-debugging.md`.
- Verify: it names current Divinipress storefront truth surfaces, API wrappers, custom-order flows, status rules, and known pitfalls.
- Step: Add `skills/tribune/references/admin-debugging.md`.
- Verify: it separates storefront Super Admin from Medusa Admin extension debugging.
- Step: Add `skills/tribune/references/medusa-backend-debugging.md`.
- Verify: it includes route/workflow/module/link/query/auth/money checks and points to the Medusa skill references.
- Step: Add `skills/tribune/references/dispatch-rules.md`.
- Verify: each route decision maps to one existing Consilium rank and does not invent a new rank.

Phase 4: Add known-gaps loop

- Step: Add `source/doctrine/divinipress-known-gaps.md` with the initial verified entries.
- Verify: every entry has live evidence anchors and a last-verified date.
- Step: Add `docs/consilium/debugging-cases/README.md`.
- Verify: case-log template includes diagnosis, evidence, fix route, verification, and promotion decision.
- Step: Add this doctrine to relevant manifest include lists only if it stays compact.
- Verify: `python3 scripts/generate_agents.py` regenerates TOMLs and the known-gaps doctrine appears only in ranks that should use it.

Phase 5: Add install path

- Step: Add `scripts/install-codex-skills.sh`.
- Verify: it validates frontmatter, references, banned stale strings, and table-free runtime docs.
- Step: Update README install section.
- Verify: README clearly separates agent install, skill install, config sync, and fresh-thread requirement.
- Step: Replace stale skill symlink only in the install phase.
- Verify: `readlink /Users/milovan/.agents/skills/tribune` points to `/Users/milovan/projects/Consilium-codex/skills/tribune`.

Phase 6: Add evals

- Step: Add debugger eval tasks 10 through 18.
- Verify: `evals/README.md` lists them and explains pass criteria.
- Step: Run manual evals before claiming the skill is ready.
- Verify: no FAIL results and no more than one PASS_WITH_DRIFT before rollout.

Phase 7: Dry-run on one real bug

- Step: Use the skill on a real or recreated Divinipress bug without code changes first.
- Verify: it produces a diagnosis packet, dispatch/routing recommendation, and fix threshold.
- Step: If Milovan approves implementation, execute through normal Consilium routing.
- Verify: Tribunus verifies the diagnosis before fix and verifies the completed task after fix.

## Eval Plan

Add `evals/tasks/10-tribune-basic-discipline.md`.

- Prompt: A test fails with an obvious one-line fix. User asks to patch it quickly.
- Pass criteria:
  - invokes Tribune workflow
  - refuses fix before diagnosis
  - asks for or runs reproduction
  - produces diagnosis packet before any patch

Add `evals/tasks/11-tribune-storefront-proof-breadcrumb.md`.

- Prompt: Catalog proof review shows an order breadcrumb that links to an empty order detail page.
- Pass criteria:
  - routes to Speculator-front for exact path
  - distinguishes catalog proof from order proof
  - does not infer backend truth
  - proposes a small frontend fix only after diagnosis verification

Add `evals/tasks/12-tribune-storefront-permission-gap.md`.

- Prompt: Staff user can call a team or invite endpoint directly despite frontend hiding the button.
- Pass criteria:
  - routes backend permission truth to Interpres-back or Speculator-back
  - treats frontend gate as insufficient
  - identifies company scoping and permission middleware as separate checks
  - likely routes to Arbiter if frontend and backend contract disagree

Add `evals/tasks/13-tribune-admin-surface-disambiguation.md`.

- Prompt: "Admin company page does not refresh after create."
- Pass criteria:
  - asks or infers whether this is store Super Admin or Medusa Admin extension
  - for Medusa Admin, loads admin-dashboard rules
  - checks query keys, mutation invalidation, display query behavior, and fetch wrapper
  - routes implementation to Centurio-back if code is under `divinipress-backend/src/admin`

Add `evals/tasks/14-tribune-medusa-route-workflow-bypass.md`.

- Prompt: A POST route validates ownership and mutates a module service directly.
- Pass criteria:
  - loads Medusa backend guidance
  - flags route-level business logic and workflow bypass as architecture issues
  - routes diagnosis verification to Tribunus
  - routes fix planning through Legatus after verification

Add `evals/tasks/15-tribune-query-graph-index.md`.

- Prompt: Filtering linked company products by collection/team gives wrong results and uses JavaScript filtering.
- Pass criteria:
  - checks whether filtering crosses module links
  - applies `query.graph()` versus `query.index()` distinction
  - treats data leak risk as correctness/security, not style

Add `evals/tasks/16-tribune-known-gap-retrieval.md`.

- Prompt: User asks why non-apparel product options look like apparel.
- Pass criteria:
  - finds known gap
  - revalidates against live repo/docs before using it as truth
  - does not implement a broad product-options redesign inline

Add `evals/tasks/17-tribune-money-path.md`.

- Prompt: Quote or display price appears off by 100x.
- Pass criteria:
  - checks Medusa price storage assumption
  - searches both frontend display and backend persistence path
  - refuses cents conversion patch until data shape is proven

Add `evals/tasks/18-tribune-install-source.md`.

- Prompt: Verify Tribune is installed as Codex Consilium source.
- Pass criteria:
  - checks symlink/source path
  - rejects `/Users/milovan/projects/Consilium/skills/tribune` as Codex source
  - confirms fresh-thread requirement

## Rejected Alternatives

Rejected: collapse Tribune into `consilium-tribunus`.

- Tribunus is currently a verifier in README, manifest, protocols, and role file.
- The current role owns checking completed work and finding evidence-backed issues.
- Debugging requires investigation, routing, domain interpretation, and execution handoff. That is broader than Tribunus.
- Keep Tribunus independent so the diagnosis can be challenged.

Rejected: keep the imported skill mostly as-is and add Divinipress examples.

- That would leave stale source paths, old skill references, no install path, no routing, no evals, and no known-gap loop.
- It would still not qualify as "full Consilium."

Rejected: make the active model do all debugging inline.

- Consilium doctrine says preserve orchestrator context and dispatch specialists.
- Debugging benefits from independent checks because plausible root causes are often wrong.

Rejected: add a debugger agent immediately.

- No eval data proves the existing ranks are insufficient.
- It creates authority overlap.
- It adds install/config work without solving stale references or domain tuning.

Rejected: copy the skill into `~/.codex/skills` manually.

- Manual copies drift.
- The repo already has install scripts for agents; skills need a repeatable installer too.
- Current local discovery shows `~/.agents/skills/tribune` is active, so the install script must verify the real discovery path before changing it.

## Open Questions

No blocking questions.

Non-blocking decisions for Milovan before implementation:

- Whether to archive `CREATION-LOG.md` under docs or delete it from the runtime skill package.
- Whether the installer should prefer symlink-only local development or copied skill packages for release snapshots.
- Whether known gaps should be included in every major rank immediately or only loaded by Tribune and Consul first, then expanded after evals.

## Solidity

Plan solidity: 8.5 out of 10.

The plan is strong because it is grounded in live Consilium source, the imported skill contents, the roadmap, Medusa skills, and live Divinipress repo surfaces. The main uncertainty is Codex skill discovery and namespacing, because the current visible `consilium:tribune` surface comes from the Claude-oriented Consilium source path through user-scope skill discovery. That is solvable with an installer verification step, but it should not be guessed.
