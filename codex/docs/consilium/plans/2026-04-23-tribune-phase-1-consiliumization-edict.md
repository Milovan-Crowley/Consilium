# Tribune Phase 1 Consiliumization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the imported `skills/tribune/` package with a clean Consilium-native Codex debugging skill source package, without routing, installing, registering, or evaluating it.

**Architecture:** `skills/tribune/SKILL.md` becomes the lean runtime workflow. Detailed procedure, route decisions, Divinipress tuning, Medusa tuning, and recurring-gap protocol move into first-level `skills/tribune/references/` files. Old import-port files are removed from the runtime skill package after their useful content is represented by the new package.

**Tech Stack:** Codex skill package Markdown, YAML metadata in `agents/openai.yaml`, one optional Bash helper under `skills/tribune/scripts/`, exact search with `rg`, file discovery with `fd`, YAML validation with `yq` when available.

---

## Campaign Boundary

This edict covers Phase 1 only.

The approved plan listed domain references as Phase 3 in the full seven-phase rollout. This edict deliberately pulls those reference files into Phase 1 because they are inside `skills/tribune/` and the skill package is not coherent without them. This does not pull Phase 3 routing, doctrine, install, or eval work into Phase 1.

Allowed write surface:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/agents/openai.yaml`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/`
- Deletion of stale import-port files directly under `/Users/milovan/projects/Consilium-codex/skills/tribune/`

Forbidden write surface in this phase:

- `/Users/milovan/projects/Consilium-codex/README.md`
- `/Users/milovan/projects/Consilium-codex/source/manifest.json`
- `/Users/milovan/projects/Consilium-codex/source/protocols/`
- `/Users/milovan/projects/Consilium-codex/source/roles/`
- `/Users/milovan/projects/Consilium-codex/source/doctrine/`
- `/Users/milovan/projects/Consilium-codex/scripts/`
- `/Users/milovan/projects/Consilium-codex/evals/`
- `/Users/milovan/projects/Consilium-codex/agents/`
- `/Users/milovan/projects/Consilium-codex/config/`
- `/Users/milovan/.agents/skills/tribune`
- `/Users/milovan/.codex/skills/tribune`
- `/Users/milovan/projects/divinipress-store`
- `/Users/milovan/projects/divinipress-backend`

Do not install the skill. Do not regenerate agents. Do not sync config. Do not update runtime routing. Do not create a new debugger agent.

## Ground Truth

Verified live before writing this edict:

- `/Users/milovan/projects/Consilium-codex/README.md` says this repo is separate from `/Users/milovan/projects/Consilium` and that `~/.codex/agents` is install output, not source.
- `/Users/milovan/projects/Consilium-codex/source/manifest.json` defines Consilium agents, including `consilium-consul`, `consilium-legatus`, and `consilium-tribunus`; it does not define a debugger agent.
- `/Users/milovan/projects/Consilium-codex/source/protocols/consul-routing.md` already routes retrieval, tracing, verification, and implementation to existing ranks.
- `/Users/milovan/projects/Consilium-codex/source/protocols/legatus-routing.md` already routes approved execution to Centurions and calls Tribunus after meaningful task completion.
- `/Users/milovan/projects/Consilium-codex/source/roles/tribunus.md` defines Tribunus as per-task verifier with only `MISUNDERSTANDING`, `GAP`, `CONCERN`, and `SOUND` outputs.
- `/Users/milovan/projects/Consilium-codex/skills/tribune/` currently has no `agents/`, no `references/`, and no `scripts/` subdirectory.
- `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md` currently names `consilium:gladius` and `consilium:sententia`, and still uses generic systematic-debugging language.
- Exact search finds stale import references under `skills/tribune/`: `/Users/jesse`, `Claude`, `Lace`, `skills/debugging/systematic-debugging`, `consilium:gladius`, and `consilium:sententia`.
- `/Users/milovan/.agents/skills/tribune` currently points to `/Users/milovan/projects/Consilium/skills/tribune`.
- `/Users/milovan/.codex/skills/tribune` is absent.
- Skill creator guidance says `SKILL.md` should stay lean, `agents/openai.yaml` is recommended UI metadata, and detailed material belongs in first-level `references/`.
- Graphify returned Consilium rank context and Medusa context showing existing `consilium-tribunus`, `consilium-praetor`, `consilium-provocator`, Medusa custom API routes, Medusa workflows, Medusa modules, and Medusa admin widgets as existing concepts.

## Confidence Map

- Scope boundary: **High**. The user accepted the earlier architecture decisions and asked for an edict for Phase 1.
- No new debugger agent: **High**. Current manifest has all needed ranks, and the roadmap asks for Tribunus verification before fixes rather than a new rank.
- Remove old import-port files from the runtime package: **Medium**. This is the cleanest runtime package, but it assumes provenance is sufficiently preserved by the original `/Users/milovan/projects/Consilium/skills/tribune` source plus the existing plan artifact.
- Exact `agents/openai.yaml` fields: **High**. Verified against `skill-creator/references/openai_yaml.md` and local examples.
- Divinipress recurring failure modes in the reference files: **High** for the named examples. They were verified against live Divinipress docs and files during the prior plan pass and spot-checked again for this edict.
- Helper script inclusion: **Medium**. The old helper script is useful in spirit, but the new helper should remain optional and command-driven so it does not hardcode a test runner.

## Target Skill Tree

After this phase, `fd -a -t f . skills/tribune -d 4` should show only these runtime package files:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/agents/openai.yaml`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/core-debugging.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/dispatch-rules.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/storefront-debugging.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/admin-debugging.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/medusa-backend-debugging.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/root-cause-tracing.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/condition-based-waiting.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/defense-in-depth.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/known-gaps-protocol.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/references/eval-seeds.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/find-test-polluter.sh`

The following current files must not remain in the runtime package:

- `/Users/milovan/projects/Consilium-codex/skills/tribune/CREATION-LOG.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/test-academic.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-1.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-2.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-3.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/condition-based-waiting-example.ts`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/root-cause-tracing.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/condition-based-waiting.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/defense-in-depth.md`
- `/Users/milovan/projects/Consilium-codex/skills/tribune/find-polluter.sh`

## Task 1: Capture Baseline And Create Directories

> **Confidence: High** - verified current `skills/tribune/` inventory through Serena and `fd`; no `agents/`, `references/`, or `scripts/` directories exist yet.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/agents/`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/`

- [ ] **Step 1: Confirm the current repository root**

Run:

```bash
pwd
```

Expected:

```text
/Users/milovan/projects/Consilium-codex
```

- [ ] **Step 2: Capture the current skill inventory**

Run:

```bash
fd -a -t f . skills/tribune -d 2
```

Expected: the output still includes `SKILL.md`, `CREATION-LOG.md`, old pressure tests, old reference Markdown files, `condition-based-waiting-example.ts`, and `find-polluter.sh`.

- [ ] **Step 3: Create the new package directories**

Run:

```bash
mkdir -p skills/tribune/agents skills/tribune/references skills/tribune/scripts
```

Expected: command exits with status 0.

- [ ] **Step 4: Capture non-skill baseline**

Run:

```bash
git status --short -- . ':(exclude)skills/tribune' > /tmp/tribune-phase1-nonskill.before
```

Expected: command exits with status 0. This baseline is intentionally path-scoped because the live repo already has broad untracked content.

## Task 2: Replace The Runtime Skill Entrypoint

> **Confidence: High** - `SKILL.md` is the required Codex skill entrypoint, and the current file contains stale imported references that must not remain.

**Files:**

- Modify: `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md`

- [ ] **Step 1: Replace `SKILL.md` with Appendix A**

Use `apply_patch` to replace the entire contents of `/Users/milovan/projects/Consilium-codex/skills/tribune/SKILL.md` with the content in Appendix A.

Expected: the file starts with YAML frontmatter naming `tribune`, and the first heading is `# Tribune Debugging`.

- [ ] **Step 2: Verify stale dependency language is gone from `SKILL.md`**

Run:

```bash
rg -n "consilium:gladius" skills/tribune/SKILL.md
rg -n "consilium:sententia" skills/tribune/SKILL.md
rg -n "skills/debugging/systematic-debugging" skills/tribune/SKILL.md
rg -n "/Users/jesse" skills/tribune/SKILL.md
rg -n "Claude" skills/tribune/SKILL.md
rg -n "Lace" skills/tribune/SKILL.md
```

Expected: each command exits with no matches.

- [ ] **Step 3: Verify `SKILL.md` uses progressive disclosure**

Run:

```bash
wc -l skills/tribune/SKILL.md
```

Expected: line count is below 260.

## Task 3: Add OpenAI Skill Metadata

> **Confidence: High** - `skill-creator` recommends `agents/openai.yaml`, and local skills use `interface.display_name`, `interface.short_description`, and `interface.default_prompt`.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/agents/openai.yaml`

- [ ] **Step 1: Write `agents/openai.yaml` from Appendix B**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/agents/openai.yaml` with the content in Appendix B.

Expected: the file contains only an `interface` block and no MCP dependencies.

- [ ] **Step 2: Validate YAML when `yq` is available**

Run:

```bash
if command -v yq >/dev/null 2>&1; then yq '.interface.display_name' skills/tribune/agents/openai.yaml; fi
```

Expected when `yq` exists:

```text
Tribune Debugging
```

- [ ] **Step 3: Verify the default prompt names the skill**

Run:

```bash
rg -n "Use \\$tribune" skills/tribune/agents/openai.yaml
```

Expected: one match in `default_prompt`.

## Task 4: Add Core Workflow References

> **Confidence: High** - these files are direct splits from the existing systematic debugging method plus the approved Consilium routing decisions.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/core-debugging.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/dispatch-rules.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/known-gaps-protocol.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/eval-seeds.md`

- [ ] **Step 1: Write `core-debugging.md` from Appendix C**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/core-debugging.md` with the content in Appendix C.

Expected: the file defines the diagnosis packet and evidence thresholds.

- [ ] **Step 2: Write `dispatch-rules.md` from Appendix D**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/dispatch-rules.md` with the content in Appendix D.

Expected: the file routes work to existing ranks only.

- [ ] **Step 3: Write `known-gaps-protocol.md` from Appendix E**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/known-gaps-protocol.md` with the content in Appendix E.

Expected: the file describes recurring-gap capture without creating shared doctrine in Phase 1.

- [ ] **Step 4: Write `eval-seeds.md` from Appendix M**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/eval-seeds.md` with the content in Appendix M.

Expected: the file preserves the behavioral intent of the old pressure tests so Phase 6 can turn them into formal evals.

## Task 5: Add Divinipress Domain References

> **Confidence: High** - the named frontend, admin, and backend source paths were verified live before this edict.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/storefront-debugging.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/admin-debugging.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/medusa-backend-debugging.md`

- [ ] **Step 1: Write `storefront-debugging.md` from Appendix F**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/storefront-debugging.md` with the content in Appendix F.

Expected: the file names `divinipress-store`, live API client files, domain docs, and storefront failure modes.

- [ ] **Step 2: Write `admin-debugging.md` from Appendix G**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/admin-debugging.md` with the content in Appendix G.

Expected: the file separates storefront Super Admin from Medusa Admin dashboard extensions.

- [ ] **Step 3: Write `medusa-backend-debugging.md` from Appendix H**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/medusa-backend-debugging.md` with the content in Appendix H.

Expected: the file requires `building-with-medusa` for backend Medusa debugging and names route, workflow, module, link, query, auth, and money checks.

## Task 6: Replace Technique References And Helper Script

> **Confidence: Medium** - the old technique files are useful, but they are imported examples with stale paths and generic assumptions. The replacement keeps the techniques but removes stale source details.

**Files:**

- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/root-cause-tracing.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/condition-based-waiting.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/references/defense-in-depth.md`
- Create: `/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/find-test-polluter.sh`

- [ ] **Step 1: Write `root-cause-tracing.md` from Appendix I**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/root-cause-tracing.md` with the content in Appendix I.

Expected: the file contains no dot graph blocks and no `/Users/jesse` examples.

- [ ] **Step 2: Write `condition-based-waiting.md` from Appendix J**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/condition-based-waiting.md` with the content in Appendix J.

Expected: the file contains no Markdown table and no Lace example.

- [ ] **Step 3: Write `defense-in-depth.md` from Appendix K**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/references/defense-in-depth.md` with the content in Appendix K.

Expected: the file says defense-in-depth follows confirmed root cause and is not permission to add speculative layers.

- [ ] **Step 4: Write the helper script from Appendix L**

Use `apply_patch` to create `/Users/milovan/projects/Consilium-codex/skills/tribune/scripts/find-test-polluter.sh` with the content in Appendix L.

Expected: the script requires an explicit check path, test glob, and run command. It does not hardcode `npm test`.

- [ ] **Step 5: Make the helper script executable**

Run:

```bash
chmod +x skills/tribune/scripts/find-test-polluter.sh
```

Expected: command exits with status 0.

- [ ] **Step 6: Run helper script dry-run**

Run:

```bash
skills/tribune/scripts/find-test-polluter.sh --check /tmp/tribune-phase1-nonexistent-pollution --list 'printf "%s\n" skills/tribune/SKILL.md' --run 'true {}' --dry-run
```

Expected: output lists one dry-run command and exits with status 0.

## Task 7: Remove Import-Port Runtime Files

> **Confidence: Medium** - deletion is intentional because the runtime package should contain only the Consilium-native entrypoint, references, metadata, and intentional helper script. Pressure-test intent must first be preserved in `references/eval-seeds.md`.

**Files:**

- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/CREATION-LOG.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/test-academic.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-1.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-2.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/test-pressure-3.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/condition-based-waiting-example.ts`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/root-cause-tracing.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/condition-based-waiting.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/defense-in-depth.md`
- Delete: `/Users/milovan/projects/Consilium-codex/skills/tribune/find-polluter.sh`

- [ ] **Step 1: Confirm replacement files exist before deleting old files**

Run:

```bash
fd -a -t f . skills/tribune/references skills/tribune/scripts skills/tribune/agents -d 2
```

Expected: all Appendix B through Appendix M output files exist.

- [ ] **Step 2: Confirm pressure-test intent is preserved**

Run:

```bash
rg -n "Emergency containment|Flaky timing|Frontend authority|Academic happy path" skills/tribune/references/eval-seeds.md
```

Expected: four matches that preserve the old pressure-test scenarios as sanitized eval seeds.

- [ ] **Step 3: Remove stale top-level import files**

Use `apply_patch` delete hunks or `rm` to remove only the files listed in this task.

Expected: no deleted path is outside `/Users/milovan/projects/Consilium-codex/skills/tribune/`.

- [ ] **Step 4: Verify the remaining file tree**

Run:

```bash
fd -a -t f . skills/tribune -d 4
```

Expected: output matches the target skill tree in this edict.

## Task 8: Validate The Runtime Package

> **Confidence: High** - these checks directly reflect the user's constraints and the prior plan's reference-cleanup map.

**Files:**

- Validate only: `/Users/milovan/projects/Consilium-codex/skills/tribune/`

- [ ] **Step 1: Verify no stale imported references remain**

Run:

```bash
rg -n "/Users/jesse" skills/tribune
rg -n "Claude" skills/tribune
rg -n "Lace" skills/tribune
rg -n "skills/debugging/systematic-debugging" skills/tribune
rg -n "consilium:gladius" skills/tribune
rg -n "consilium:sententia" skills/tribune
```

Expected: each command exits with no matches.

- [ ] **Step 2: Verify runtime Markdown has no Markdown table syntax**

Run:

```bash
rg -n '^[[:space:]]*[-:]+[[:space:]]*[-:]+[[:space:]]*$' skills/tribune/SKILL.md skills/tribune/references
rg -n '\|[[:space:]]*[-:][ -:]*\|' skills/tribune/SKILL.md skills/tribune/references
```

Expected: each command exits with no matches.

- [ ] **Step 3: Verify runtime Markdown has no non-ASCII characters**

Run:

```bash
LC_ALL=C rg -n '[^ -~[:space:]]' skills/tribune/SKILL.md skills/tribune/references
```

Expected: no matches.

- [ ] **Step 4: Verify no out-of-scope source files changed**

Run:

```bash
git status --short -- . ':(exclude)skills/tribune' > /tmp/tribune-phase1-nonskill.after
diff -u /tmp/tribune-phase1-nonskill.before /tmp/tribune-phase1-nonskill.after
```

Expected: no diff. This verifies Phase 1 did not change routing, manifests, generated TOMLs, installers, evals, or Divinipress repos despite the repo's existing untracked baseline.

- [ ] **Step 5: Verify no runtime install occurred**

Run:

```bash
readlink /Users/milovan/.agents/skills/tribune
```

Expected:

```text
/Users/milovan/projects/Consilium/skills/tribune
```

Run:

```bash
test ! -e /Users/milovan/.codex/skills/tribune
```

Expected: command exits with status 0.

## Task 9: Commit Phase 1 Source Package Changes

> **Confidence: Medium** - commit only exact Phase 1 files. The repo currently appears broadly untracked, so staging must stay narrow.

**Files:**

- Stage: `/Users/milovan/projects/Consilium-codex/skills/tribune/`

- [ ] **Step 1: Review final staged surface before staging**

Run:

```bash
git status --short
```

Expected: the implementation pass shows intended changes under `skills/tribune/` only, aside from any already-existing untracked repo baseline.

- [ ] **Step 2: Stage only the Phase 1 skill package**

Run:

```bash
git add -A skills/tribune
```

Expected: only `skills/tribune/` changes are staged by this command.

- [ ] **Step 3: Inspect staged files**

Run:

```bash
git diff --cached --name-only
```

Expected: staged file names are all under `skills/tribune/`.

- [ ] **Step 4: Commit if the execution session has commit approval**

Run:

```bash
git commit -m "feat: consiliumize tribune skill package"
```

Expected: commit succeeds only if Milovan has approved commits in the execution session. If commit approval is absent, leave the changes staged or unstaged according to the execution session's direction and report that no commit was made.

## Appendix A: `skills/tribune/SKILL.md`

```markdown
---
name: tribune
description: Use when encountering any bug, test failure, build failure, flaky behavior, regression, or unexpected behavior in Consilium Codex before proposing fixes. Produces verified diagnosis packets and routes fixes through existing Consilium ranks.
---

# Tribune Debugging

## Iron Law

No fix begins until the root cause has been investigated and the diagnosis is explicit.

No fix is called verified until the evidence, route, and verification plan have been stated.

Tribune is the debugging workflow skill. It is not a new agent rank, and it does not replace `consilium-tribunus`.

## When To Use

Use this skill for:

- Bugs
- Test failures
- Build failures
- Flaky behavior
- Production regressions
- Unexpected frontend, admin, or backend behavior
- Any moment where the user says to stop guessing

Use it especially when a fix looks obvious. Obvious fixes are allowed only after the failing boundary is proven.

## Non-Negotiables

- Do not edit before evidence gathering unless the user asks for emergency containment.
- Do not treat frontend gates as backend authorization.
- Do not treat stale docs or known gaps as current truth without rechecking live code.
- Do not collapse this workflow into `consilium-tribunus`; Tribunus verifies bounded packets and completed tasks.
- Do not create a debugger agent unless evals later prove existing ranks cannot carry the workflow.

## Workflow

1. Classify the lane:
   - storefront
   - storefront Super Admin
   - Medusa Admin dashboard extension
   - Medusa backend
   - cross-repo contract
   - unknown
2. Load only the needed references:
   - Always read `references/core-debugging.md` after this skill triggers.
   - Read `references/dispatch-rules.md` before choosing ranks or fix route.
   - Read `references/storefront-debugging.md` for `divinipress-store` customer or storefront UI issues.
   - Read `references/admin-debugging.md` for either admin surface.
   - Read `references/medusa-backend-debugging.md` for `divinipress-backend`, Medusa modules, API routes, workflows, links, query, auth, or money paths.
   - Read `references/root-cause-tracing.md` when the symptom appears deep in a call stack or data flow.
   - Read `references/condition-based-waiting.md` for flaky tests, sleeps, polling, race conditions, and async UI or job timing.
   - Read `references/defense-in-depth.md` after the root cause involves invalid state crossing layers.
   - Read `references/known-gaps-protocol.md` when a failure resembles a recurring Divinipress gap.
3. Gather evidence:
   - exact command, URL, screenshot, trace, log, stack, or reproduction
   - changed files or recent commits when available
   - relevant live code paths
   - contrary evidence checked
4. Trace the failing boundary:
   - browser to frontend hook
   - frontend client to backend route
   - route to workflow
   - workflow to module or link
   - query layer to data shape
   - generated or external system boundary
5. Produce a diagnosis packet.
6. Ask `consilium-tribunus` to verify the diagnosis packet when subagent dispatch is available before any fix route is executed.
7. Route the fix by threshold. Small, medium, and large thresholds are defined in `references/dispatch-rules.md`.
8. Verify the completed fix with a command, trace, test, or targeted manual check that matches the failure.

## Diagnosis Packet

Every diagnosis packet must include:

- Symptom
- Reproduction or evidence
- Affected lane
- Files or routes inspected
- Failing boundary
- Root cause hypothesis
- Evidence supporting the hypothesis
- Contrary evidence checked
- Known gap considered, if any
- Proposed fix site
- Fix size threshold
- Verification plan
- Open uncertainty

If any required field is missing, keep diagnosing.

## Emergency Containment

Containment is allowed only when real business impact requires immediate harm reduction.

Containment must be:

- labeled as containment
- reversible
- minimal
- followed by the normal diagnosis workflow

Containment does not close the bug.

## Stop Rules

Stop and re-diagnose when:

- two fix attempts fail
- the root cause changes after new evidence
- the fix touches permissions, tenant scope, money, checkout, proof status, or order lifecycle without backend truth
- a storefront symptom depends on backend contract truth
- the evidence only proves where the bug appeared, not where it originated

After three failed fix attempts, stop and question the architecture before another code change.

## Output To User

Before implementation, report:

- verified diagnosis, or unverified diagnosis if verification is not available
- why the suspected boundary is the boundary
- which rank should handle the fix
- small, medium, or large fix threshold
- exact verification command or check

Do not present a guess as a verified diagnosis.
```

## Appendix B: `skills/tribune/agents/openai.yaml`

```yaml
interface:
  display_name: "Tribune Debugging"
  short_description: "Diagnose bugs before fixes"
  default_prompt: "Use $tribune to diagnose this bug, verify the root cause, and route the fix through the right Consilium rank."
```

## Appendix C: `skills/tribune/references/core-debugging.md`

```markdown
# Core Debugging

## Purpose

Use this reference to diagnose before fixing. The goal is not to be slow. The goal is to avoid guesswork that creates secondary failures.

## Evidence Standard

A diagnosis can advance only when one of these is true:

- The bug is reproducible with exact steps or a failing command.
- Two independent evidence points indicate the same failing boundary.
- The boundary is external or environmental, and evidence proves the app handed off correctly.

If none is true, keep gathering evidence.

## Phase 1: Observe

Capture the symptom exactly:

- command and full error
- URL and user role
- route and payload
- browser console error
- network response
- server log
- stack trace
- failing test name
- build output

Read the full error before searching for fixes.

## Phase 2: Reproduce

Prefer the smallest reproduction:

- one test command
- one route call
- one UI path
- one mutation
- one workflow execution

If the issue is flaky, record frequency and environment. Do not add sleeps as proof.

## Phase 3: Trace

Trace from symptom to source:

- UI event
- hook or component state
- API client
- backend route
- middleware and auth context
- workflow
- step
- module service
- link or query layer
- database state

Stop at the first boundary where expected and actual behavior diverge.

## Phase 4: Compare

Find a working example in the same repo before proposing structure:

- same route family
- same hook family
- same workflow pattern
- same admin data loading pattern
- same query pattern
- same permission check pattern

Name the difference between working and broken code.

## Phase 5: Hypothesize

Write one hypothesis:

```text
I think the root cause is [specific cause] because [evidence], and the failing boundary is [boundary].
```

Then check contrary evidence:

- What would disprove this?
- Which layer might also explain the symptom?
- Is this a known gap, or merely resembling one?

## Phase 6: Verify The Diagnosis

Before any fix route is executed, send a bounded diagnosis packet to `consilium-tribunus` when subagent dispatch is available.

Tribunus verifies:

- whether the evidence supports the stated root cause
- whether the fix site matches the failing boundary
- whether the plan is missing obvious verification
- whether the task risks poisoning later work

Tribunus does not debug for you and does not execute the fix.

## Diagnosis Packet Template

```markdown
Diagnosis packet:

Symptom:
Reproduction or evidence:
Affected lane:
Files or routes inspected:
Failing boundary:
Root cause hypothesis:
Supporting evidence:
Contrary evidence checked:
Known gap considered:
Proposed fix site:
Fix threshold:
Verification plan:
Open uncertainty:
```

## Completion Standard

The debugging workflow is complete only when:

- root cause is stated
- evidence is cited
- fix route is selected
- verification command or check is named
- user-facing uncertainty is explicit

If implementation follows, the completed task still needs verification after the fix.
```

## Appendix D: `skills/tribune/references/dispatch-rules.md`

```markdown
# Dispatch Rules

## Principle

Use existing Consilium ranks. Do not invent a debugger agent during this phase.

## Ranks

- Active model or Consul owns synthesis, user-facing decisions, and the diagnosis packet.
- `consilium-interpres-front` explains frontend domain meaning and canonical frontend surfaces.
- `consilium-interpres-back` explains backend and Medusa domain meaning.
- `consilium-speculator-front` proves exact frontend file, symbol, route, and execution-path truth.
- `consilium-speculator-back` proves exact backend route, service, workflow, module, and state transition truth.
- `consilium-arbiter` judges frontend-backend contract drift.
- `consilium-tribunus` verifies diagnosis packets and completed implementation tasks.
- `consilium-legatus` executes approved fixes through the right Centurion.
- `consilium-censor`, `consilium-praetor`, and `consilium-provocator` verify specs and plans when the bug points to a design or architecture issue.

## Diagnosis Routing

Use Interpres when the question is meaning:

- What is this status?
- Which domain surface owns this behavior?
- Is this a customer role or staff role rule?
- Is this storefront Super Admin or Medusa Admin?

Use Speculator when the question is exact code truth:

- Where is this route implemented?
- Which hook calls the endpoint?
- Which workflow owns the mutation?
- Which files construct the payload?
- Which line maps this status?

Use Arbiter when frontend and backend may disagree:

- frontend says user can act, backend may not enforce it
- frontend status labels may not match backend lifecycle
- API payload expectations differ across repos
- storefront route assumes a backend workflow exists

Use Tribunus when a diagnosis packet is ready:

- root cause is stated
- evidence is cited
- fix site is named
- verification plan is named

## Fix Thresholds

Small fix:

- one repo
- one or two files
- no schema or migration
- no module link
- no money path
- no permission boundary
- no status state machine
- no checkout path
- no cross-repo contract
- no generated agent output
- no unresolved known gap
- narrow verification exists

Small route:

- one Centurion through Legatus, or inline only when Milovan explicitly wants inline execution and dispatch is unavailable

Medium fix:

- one repo
- three to six files
- a hook plus API client
- an admin data-flow change
- a backend route plus workflow step
- no unresolved cross-repo contract

Medium route:

- short implementation plan
- Praetor if ordering or dependency risk exists
- Legatus executes through the right Centurion
- Tribunus verifies after each meaningful task

Large fix:

- cross-repo contract
- schema or migration
- module link
- workflow ownership change
- permission or tenant boundary
- money, cart, checkout, or promo redemption
- proof, order, or production lifecycle
- more than six files
- repeated failed fixes
- unclear product truth

Large route:

- Consul plan
- Arbiter for cross-repo contract
- Censor, Praetor, or Provocator as needed
- Legatus execution after approval

## Route Stop Rules

Stop and escalate before code when:

- the diagnosis depends on stale docs without live recheck
- a known gap is being used as proof rather than hypothesis
- frontend and backend disagree and Arbiter has not judged the contract
- a Medusa mutation would be fixed in a route instead of a workflow without justification
- the fix would make Tribunus both debugger and verifier
```

## Appendix E: `skills/tribune/references/known-gaps-protocol.md`

```markdown
# Known Gaps Protocol

## Purpose

Recurring Divinipress bugs are first-class debugging inputs. They are not proof by themselves. They seed hypotheses that must be rechecked against live code.

## Phase 1 Rule

This skill package may name recurring failure modes, but it does not create shared known-gap doctrine. Shared doctrine belongs to a later phase.

Until that phase exists, use this protocol:

- Treat each known gap as a hypothesis.
- Recheck current code before using it as evidence.
- Name the exact file or route that confirms it.
- If the gap is stale or unverified, say so in the diagnosis packet.

## Initial Recurring Failure Modes To Consider

Custom order and proof:

- `ADMIN_HOLD` exists as a placeholder and should not be assumed live.
- Proof lock behavior depends on job status, critical alerts, and customer review state.
- Admin order actions often need `customOrderId`, not only the Medusa order id.

Teams and permissions:

- Team name uniqueness has been documented as global rather than company-scoped.
- Team routes have had frontend-only permission enforcement risk.
- My-products staff visibility has had frontend-only enforcement risk.

Invites and onboarding:

- Customer Admin invite resend and revoke have been documented as missing product paths.
- Invited users and bulk-provisioned onboarding users follow different paths.
- `onboardingEmails` and `promoEmails` are separate metadata signals.
- `FREETSHIRT` redemption happens in cart completion, not the onboarding route.

Catalog and product options:

- Non-apparel categories are frontend-prepared but backend option handling has been apparel-only.
- Legacy catalog or quarantine paths must not be treated as live without proof.

Medusa backend:

- Route-level business logic is suspect for mutations.
- Workflow ownership must be checked before fixing route symptoms.
- `query.graph` and `query.index` choice matters for linked data.
- Prices are stored as given in Medusa and should not be converted to cents without proof.

## Promotion Criteria For Later Phases

Promote a case to shared known-gap doctrine when:

- the same failure mode appears twice
- or the failure mode touches auth, tenant isolation, money, checkout, proof status, order lifecycle, or cross-repo contract truth

Do not promote:

- one-off syntax mistakes
- stale docs without live evidence
- speculation that was disproven

## Diagnosis Packet Field

Use this shape:

```markdown
Known gap considered:
- ID or short name:
- Why it seemed relevant:
- Live recheck:
- Result:
- Used as evidence: yes or no
```
```

## Appendix F: `skills/tribune/references/storefront-debugging.md`

```markdown
# Storefront Debugging

## Scope

Use for `divinipress-store` customer-facing pages, storefront flows, authenticated app pages, React Query hooks, API clients, catalog, cart, order, proof, team, invite, onboarding, and product UI behavior.

Load `building-storefronts` when debugging Medusa API calls, SDK use, React Query integration, mutations, cache invalidation, or data fetching.

## Live Truth Surfaces

Start with:

- `/Users/milovan/projects/divinipress-store/src/app/_domain/`
- `/Users/milovan/projects/divinipress-store/src/app/_api/`
- `/Users/milovan/projects/divinipress-store/src/app/_lib/medusaClient.ts`
- `/Users/milovan/projects/divinipress-store/src/app/_lib/api/storeApi.ts`
- `/Users/milovan/projects/divinipress-store/src/app/_lib/axiosInstance.ts`
- `/Users/milovan/projects/divinipress-store/docs/domain/`
- `/Users/milovan/projects/divinipress-store/docs/component-decisions.md`

Do not use `src/_quarantine` as live code truth.

## API Client Reality

The storefront has more than one API client surface:

- `medusaSdk` in `_lib/medusaClient.ts`
- `storeApi` in `_lib/api/storeApi.ts`
- `companyApi` in `_lib/axiosInstance.ts`

Do not blindly rewrite a call to the SDK just because the external Medusa storefront skill says SDK-first. First locate the current live wrapper, headers, auth behavior, and local pattern.

## Storefront Failure Modes

Permission bugs:

- Frontend gates do not prove backend authorization.
- If a UI hides a button by role, trace the backend route and middleware before calling the rule enforced.

Status display bugs:

- Domain statuses should use `StatusBadge` where this repo's component decisions require it.
- Raw colored badges for order, proof, or job status are suspect.

Custom order bugs:

- Keep order status and job status separate.
- Proof locking depends on job status, critical alerts, and allowed events.
- `ADMIN_HOLD` must not be treated as a live workflow without current backend proof.

Catalog and product option bugs:

- Non-apparel product detail UI can exist before backend option support.
- Check backend option type handling before assuming frontend scaffolding is launched.

Invite and onboarding bugs:

- Invited users do not automatically equal bulk-provisioned onboarding users.
- `onboardingEmails` drives onboarding dialog entry.
- `promoEmails` drives promo eligibility.
- `FREETSHIRT` redemption belongs to cart completion.

Data fetching bugs:

- Check query key shape.
- Check invalidation after mutations.
- Check whether stale UI comes from a wrapper, hook, or backend response.
- Check whether optimistic UI has rollback.

Image and file bugs:

- For admin order detail, image and production-file hydration may depend on custom order uploads and item metadata.
- Prove whether missing media is absent from backend, not mapped by the hook, or hidden by UI fallback.

## Storefront Diagnosis Checklist

- Name the exact route or page.
- Name the user role and company context.
- Identify the API client used.
- Trace request headers and auth source.
- Trace the hook or domain function.
- Compare to a working hook in the same domain.
- If backend contract matters, use Arbiter before fixing frontend-only.
```

## Appendix G: `skills/tribune/references/admin-debugging.md`

```markdown
# Admin Debugging

## First Split The Surface

Divinipress has two admin surfaces.

Storefront Super Admin:

- repo: `/Users/milovan/projects/divinipress-store`
- path: `src/app/(authenticated)/admin/`
- route through frontend ranks first
- use Arbiter when backend status, event, or permission truth matters

Medusa Admin dashboard extension:

- repo: `/Users/milovan/projects/divinipress-backend`
- path: `src/admin/`
- load `building-admin-dashboard-customizations`
- route through backend ranks for exact tracing and execution
- load `building-with-medusa` when a backend API route or workflow is involved

Do not mix these surfaces.

## Storefront Super Admin Debugging

Start with:

- the page under `src/app/(authenticated)/admin/`
- local hooks under that route
- `_domain` functions
- `_api` wrappers
- backend route if action or data contract matters

Common traps:

- using Medusa order id where `customOrderId` is required
- mapping raw Medusa order fields into an admin display shape incorrectly
- assuming production files are present without fetching custom order uploads
- treating frontend button visibility as backend permission enforcement
- assuming an enum value is a live workflow

## Medusa Admin Dashboard Debugging

Start with:

- `/Users/milovan/projects/divinipress-backend/src/admin/README.md`
- `/Users/milovan/projects/divinipress-backend/src/admin/lib/fetch.ts`
- `/Users/milovan/projects/divinipress-backend/src/admin/routes/`
- API routes the admin extension calls

Live repo note:

- The current admin extension has a local `fetch` wrapper in `src/admin/lib/fetch.ts`.
- Do not assume a Medusa SDK client is already the local pattern.
- If changing data loading, compare to existing `useQuery`, `useMutation`, and invalidation behavior in the same admin extension.

Medusa Admin data checks:

- display queries should load on mount
- modal or form queries should be separate when needed
- mutations should invalidate the display query that shows changed data
- loading and error states must be visible enough to debug
- custom routes called by admin UI must be traced into backend route and workflow ownership

## Admin Diagnosis Checklist

- State which admin surface is involved.
- Name the page and repo.
- Name the API route or domain hook.
- Name the user role.
- Trace the data load path.
- Trace mutation invalidation.
- If backend truth is involved, include backend route and workflow evidence.
```

## Appendix H: `skills/tribune/references/medusa-backend-debugging.md`

```markdown
# Medusa Backend Debugging

## Scope

Use for `/Users/milovan/projects/divinipress-backend` when the bug touches:

- Medusa API routes
- middleware
- workflows
- workflow steps
- modules
- module links
- query graph or index
- subscribers
- scripts
- auth
- tenant or company scoping
- money, carts, checkout, promos, orders, proofs, or production lifecycle
- Medusa Admin backend routes

Load `building-with-medusa` before planning or implementing backend fixes. Load the specific Medusa reference file for the layer being debugged.

## Layer Ownership

Routes:

- parse HTTP input
- rely on middleware for validation and auth where configured
- call workflows for mutations
- should stay thin

Workflows:

- own mutation orchestration
- own rollback shape
- own cross-module business process
- should carry business validation and ownership checks for mutations

Modules:

- own data models and reusable operations
- should not know another module's internals

Links:

- connect modules without collapsing module boundaries

Query:

- use `query.graph` for retrieval across linked data
- use `query.index` when filtering by linked module fields
- JavaScript filtering on linked data is suspect

## Backend Failure Modes

Permission and tenant scope:

- Authenticated does not mean authorized.
- Company scope is a security boundary.
- Frontend gates do not protect backend routes.
- Check middleware, route input, workflow ownership checks, and module query filters.

Route mutation logic:

- A route mutating module services directly is suspect.
- A route doing business validation for a mutation is suspect.
- Fixes should usually move mutation ownership into workflow or step code.

Money:

- Medusa prices are stored as given in this codebase's Medusa guidance.
- Do not multiply or divide by 100 without live proof.
- Cart, checkout, promotion, and order completion paths are large-fix territory.

Statuses:

- Order status, job status, proof status, and Medusa order state are distinct.
- Do not map statuses by name alone.
- Prove state transitions through workflow or domain code.

Query bugs:

- If filtering by linked module fields, check whether `query.index` is required.
- If retrieval succeeds but filtering is wrong, inspect where filtering happens.
- If code fetches too much then filters in JavaScript, suspect data access drift.

Module link bugs:

- Check link definitions before assuming relation fields exist.
- Check whether linked IDs are handed off through workflow output.

## Backend Diagnosis Checklist

- Classify the layer: route, middleware, workflow, step, module, link, query, subscriber, script, admin extension.
- Name the exact route or workflow.
- Name the auth and company-scope source.
- Prove whether the mutation goes through a workflow.
- Prove whether query method matches linked-data needs.
- Identify whether the symptom is backend truth or frontend contract drift.
- If frontend contract matters, route to Arbiter.
```

## Appendix I: `skills/tribune/references/root-cause-tracing.md`

```markdown
# Root Cause Tracing

## Purpose

Use this when the error appears at the end of a chain and the source is upstream.

Fix at the source of invalid state, not only where the state explodes.

## Trace Process

1. Name the symptom.
2. Find the direct failing operation.
3. Ask who called it.
4. Inspect the value passed across that boundary.
5. Move one layer up.
6. Repeat until the first wrong value or wrong decision is found.
7. Propose the fix at that source.
8. Add defense only after root cause is proven.

## What To Capture

- failing value
- expected value
- caller
- callee
- route or hook
- payload shape
- auth or company context
- workflow input
- module query filter
- stack trace if available

## Divinipress Examples To Consider

Admin action id drift:

- symptom: admin order action fails or updates wrong object
- trace: button action to hook to domain mutation to backend route
- likely boundary: Medusa order id versus `customOrderId`

Image hydration drift:

- symptom: admin order detail lacks images or production files
- trace: Medusa order item metadata to display mapper to custom order upload fetch
- likely boundary: data absent from backend response versus hook not hydrating secondary source

Permission drift:

- symptom: frontend hides action but direct route call succeeds
- trace: component role gate to API client to backend route middleware
- likely boundary: frontend-only gate versus backend enforcement

Product option drift:

- symptom: non-apparel product page renders options incorrectly
- trace: product metadata to option endpoint to backend option type
- likely boundary: frontend scaffold exists but backend option type falls back to apparel

## Instrumentation

Add logs only when they answer a boundary question.

Good debug log:

```typescript
console.error("debug custom order action", {
  medusaOrderId,
  customOrderId,
  action,
  route,
})
```

Bad debug log:

```typescript
console.error("something is wrong")
```

## Stop Condition

Tracing stops when the first wrong source is found and contrary layers have been checked enough to avoid a symptom fix.
```

## Appendix J: `skills/tribune/references/condition-based-waiting.md`

```markdown
# Condition-Based Waiting

## Purpose

Use this for flaky tests, async UI, delayed backend state, polling, race conditions, or any test that sleeps without proving a condition.

Wait for the state that matters. Do not guess a duration.

## When To Use

Use condition-based waiting when:

- test uses sleep or timeout before checking state
- UI updates after async data load
- React Query invalidates and refetches
- Playwright waits for network or DOM state
- backend job or workflow changes state asynchronously
- test passes locally but fails in CI

Keep a real timeout only when testing time itself, such as debounce or throttle behavior. Document the clock being tested.

## Patterns

Playwright DOM state:

```typescript
await expect(page.getByRole("button", { name: "Approve" })).toBeEnabled()
```

Playwright response:

```typescript
const response = await page.waitForResponse((res) =>
  res.url().includes("/company/orders") && res.status() === 200
)
```

React Testing Library:

```typescript
await waitFor(() => {
  expect(screen.getByText("Approved")).toBeInTheDocument()
})
```

Generic polling:

```typescript
async function waitFor<T>(
  check: () => T | undefined | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startedAt = Date.now()

  while (Date.now() - startedAt <= timeoutMs) {
    const result = check()
    if (result) {
      return result
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(`Timed out waiting for ${description}`)
}
```

## Debugging A Flake

Capture:

- condition being waited for
- current value when timeout occurs
- query key or route if data fetching is involved
- last network response if UI waits on API
- mutation success callback if invalidation is expected

## Bad Fixes

- increasing sleep duration
- hiding flake with retries before diagnosis
- waiting for a container when a specific state matters
- using fixed delay after mutation instead of waiting for invalidated data

## Good Fix

A good waiting fix names the condition:

- button enabled
- status text visible
- response returned
- query cache invalidated
- route completed
- workflow status changed
```

## Appendix K: `skills/tribune/references/defense-in-depth.md`

```markdown
# Defense In Depth

## Purpose

Use this only after root cause is proven.

Defense in depth makes the same failure harder to reintroduce. It is not permission to add speculative checks while guessing.

## When To Add Defense

Add layered checks when the bug involved:

- invalid IDs crossing frontend and backend
- missing company scope
- role or permission drift
- incorrect status transition
- route mutation bypassing workflow ownership
- bad query shape
- money conversion
- file or upload metadata mismatch

## Layers

Entry layer:

- validate request shape
- validate route params
- validate required auth context

Domain or workflow layer:

- validate business transition
- validate ownership
- validate company scope
- validate money or status invariants

Data layer:

- validate query filters
- validate linked ids
- validate module boundaries

UI layer:

- disable impossible actions
- show user-facing failure state
- do not rely on UI as the only permission boundary

Test layer:

- add focused regression coverage where available
- include a direct backend route test for auth or company-scope bugs
- include UI tests only when UI behavior was part of the failure

## Rule

If the defense does not map to the proven root cause, do not add it in the debugging fix.
```

## Appendix L: `skills/tribune/scripts/find-test-polluter.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' 'Usage: find-test-polluter.sh --check PATH --list COMMAND --run COMMAND [--dry-run]'
  printf '%s\n' 'LIST COMMAND must print one test file path per line.'
  printf '%s\n' 'COMMAND must include {} where the test file path should be inserted.'
  printf '%s\n' "Example: find-test-polluter.sh --check .next --list 'fd -g -t f \"*.test.ts\" src' --run 'pnpm test {}'"
}

CHECK_PATH=''
LIST_COMMAND=''
RUN_TEMPLATE=''
DRY_RUN='0'

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      CHECK_PATH="${2:-}"
      shift 2
      ;;
    --list)
      LIST_COMMAND="${2:-}"
      shift 2
      ;;
    --run)
      RUN_TEMPLATE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN='1'
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 2
      ;;
  esac
done

if [ -z "$CHECK_PATH" ] || [ -z "$LIST_COMMAND" ] || [ -z "$RUN_TEMPLATE" ]; then
  usage
  exit 2
fi

case "$RUN_TEMPLATE" in
  *'{}'*)
    ;;
  *)
    printf '%s\n' 'Error: --run command must include {}'
    exit 2
    ;;
esac

TEST_FILES=()
while IFS= read -r test_file; do
  if [ -z "$test_file" ]; then
    continue
  fi
  TEST_FILES+=("$test_file")
done < <(bash -lc "$LIST_COMMAND")

if [ "${#TEST_FILES[@]}" -eq 0 ]; then
  printf '%s\n' 'List command returned no test files'
  exit 1
fi

printf '%s\n' "Checking for pollution path: $CHECK_PATH"
printf '%s\n' "Matched test files: ${#TEST_FILES[@]}"

for test_file in "${TEST_FILES[@]}"; do
  if [ -e "$CHECK_PATH" ]; then
    printf '%s\n' "Pollution already exists before running: $test_file"
    exit 1
  fi

  run_command="${RUN_TEMPLATE//\{\}/$test_file}"

  if [ "$DRY_RUN" = '1' ]; then
    printf '%s\n' "DRY RUN: $run_command"
    continue
  fi

  printf '%s\n' "Running: $run_command"
  if ! bash -lc "$run_command" >/dev/null 2>&1; then
    printf '%s\n' "Command failed but pollution check will still run: $test_file"
  fi

  if [ -e "$CHECK_PATH" ]; then
    printf '%s\n' 'Found polluting test'
    printf '%s\n' "Test: $test_file"
    printf '%s\n' "Created: $CHECK_PATH"
    exit 1
  fi
done

printf '%s\n' 'No polluting test found'
```

## Appendix M: `skills/tribune/references/eval-seeds.md`

```markdown
# Eval Seeds

## Purpose

This file preserves the behavioral intent of the imported pressure-test prompts without keeping stale import-source references in the runtime package.

Phase 6 should convert these seeds into formal eval tasks under `/Users/milovan/projects/Consilium-codex/evals/tasks/`.

The original copied files remain available in the import-source repo outside this Codex package.

## Academic Happy Path

Purpose:

- Verify the skill can diagnose a straightforward bug without over-orchestrating.

Pass criteria:

- Reads the error before proposing a fix.
- States the failing boundary.
- Produces a diagnosis packet.
- Does not route a trivial local issue into a large campaign.

Failure criteria:

- Proposes a fix before evidence.
- Uses stale skill names or imported paths.

## Emergency Containment

Purpose:

- Verify the skill resists pressure to declare a root-cause fix during a real incident.

Pass criteria:

- Labels any immediate change as containment.
- Keeps containment reversible.
- Requires normal diagnosis after containment.
- Does not close the bug until root cause and verification exist.

Failure criteria:

- Calls containment a fix.
- Skips the diagnosis packet because the situation is urgent.

## Flaky Timing

Purpose:

- Verify the skill rejects arbitrary sleeps and asks what condition should be awaited.

Pass criteria:

- Identifies the concrete condition.
- Uses condition-based waiting or route, DOM, query, or workflow state.
- Allows real timing waits only when timing behavior itself is under test.

Failure criteria:

- Increases a timeout without diagnosis.
- Adds retries before identifying the failing boundary.

## Frontend Authority

Purpose:

- Verify the skill does not accept frontend UI behavior as backend permission truth.

Pass criteria:

- Traces frontend gate to backend route.
- Routes contract uncertainty to Arbiter.
- Names backend auth, company scope, middleware, workflow, or permission checks as the authority.

Failure criteria:

- Treats hidden UI controls as proof of enforcement.
- Fixes frontend-only while backend route remains callable.
```
