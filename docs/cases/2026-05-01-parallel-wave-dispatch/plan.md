# Parallel-Wave Dispatch Implementation Plan

> **Bootstrap execution note:** This campaign cannot require `/phalanx` for its own first implementation, because Task 4 rewrites `/phalanx` from the current debug-fanout skill into the new implementation-dispatch skill. Execute Tasks 1-5 through `consilium:legion` using the verified wave evidence and its existing strict parallel-dispatch judgment; future plans use `consilium:phalanx` after Task 6 regenerates runtime surfaces. Task 6 runs after the wave.

**Goal:** Make parallel-wave dispatch visible, verifiable, and executable across Consul, Edicts, Praetor, /phalanx, /legion, /march, and the Codex routing equivalents.

**Plan Scale:** Campaign

**Implementation Shape:** Tasks 1-5 are the self-applying parallel-safe wave: each task changes a disjoint Consilium source surface and reads only its own target files plus stable spec/doctrine context. Task 6 runs after the wave to regenerate derived runtime surfaces, install when ordered by the executor, and prove parity. Generated and compatibility outputs are derived artifacts; do not hand-edit them.

**Parallel-safe wave:** tasks 1, 2, 3, 4, 5 — Files-block write sets are disjoint, `Read:` entries declared and non-overlapping with sibling writes.

**Scope In:**
- Add Consul Estimate-lite parallel-wave guidance to Claude Consul and Codex Consul routing.
- Add Edicts / plan-format wave-callout authoring guidance.
- Add Praetor wave-callout validation.
- Rewrite `/phalanx` as parallel implementation dispatch.
- Add `/legion`, `/march`, and Codex Legatus prompt recognition for wave callouts.
- Regenerate derived runtime surfaces after source edits.

**Scope Out:**
- No implementation before the Imperator explicitly orders execution.
- No new agents, verifier roles, model-routing policy, lint scripts, or topology metadata.
- No changes to Tribunus diagnosis routing.
- No changes to Campaign 3a's Files-block contract.
- No edits to historical case docs outside this Campaign 5 case.

**Verification:** `python3 runtimes/scripts/generate.py`; `python3 runtimes/scripts/check-runtime-parity.py`; targeted `rg`/`jq` checks named per task; installed parity only if the executor performs install.

---

### Task 1: Add Consul Estimate-Lite Parallel-Wave Guidance
> **Evidence:** Implements [spec §5 — Estimate-lite Coordination Amendment](spec.md#5-estimate-lite-coordination-amendment). Fetched `origin/main:source/manifest.json` shows Codex `consilium-consul` includes `protocols/consul-routing.md`, so the Codex routing protocol must receive the same operational guidance as the Claude Consul skill.

**Files:**
- Modify: `source/skills/claude/consul/SKILL.md`
- Modify: `source/protocols/consul-routing.md`
- Read: `docs/cases/2026-05-01-parallel-wave-dispatch/spec.md`
- Read: `docs/cases/2026-04-29-consul-brief-estimate-lite/spec.md`
- Read: `source/manifest.json`

**Objective:** Teach Consul to name parallel-wave structure during Estimate-lite Coordination without pretending plan-stage Files-block evidence exists yet.

**Decisions already made:**
- Add a `Parallel waves` clause inside the Estimate-lite / Coordination guidance.
- Name the three allowed states: no parallel structure, anticipated parallel-safe wave, and multi-wave structure with sequential gate.
- The "anticipated parallel-safe wave" language is explicitly anticipatory: it is based on Effects and Terrain, not on per-task Files blocks.
- Multi-wave structure with a sequential gate remains a decomposition trigger.
- Do not change Brief fields, Contract Inventory routing, self-review, Tabularius dispatch, Censor/Provocator dispatch, or debug routing.
- `source/protocols/consul-routing.md` gets the compact Codex-consumed equivalent; do not paste the whole Claude skill section into the protocol.

**Acceptance:**
- Claude Consul can write Estimate-lite Coordination with the three parallel-wave states.
- Codex Consul receives equivalent guidance through `source/protocols/consul-routing.md`.
- The text distinguishes anticipatory Consul synthesis from evidentiary Edicts/Praetor validation.

**Verification:**
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do for term in "Parallel waves" "Anticipated parallel-safe wave" "No parallel structure" "Multi-wave structure" "decomposition"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero.

**Stop conditions:** Stop if `source/manifest.json` no longer routes Codex `consilium-consul` through `protocols/consul-routing.md`; the Codex parity target would need re-evaluation.

### Task 2: Add Edicts Wave-Callout Authoring Guidance
> **Evidence:** Implements [spec §4 — The Wave Callout — Contract](spec.md#4-the-wave-callout--contract) and [spec §6 — Edicts Plan-Template Amendment](spec.md#6-edicts-plan-template-amendment). Campaign 3a is merged on fetched `origin/main`; the consumed Files-block contract is writes = `Create:` + `Modify:` + `Test:`, optional `Read:`, and `(none)` for empty writes.

**Files:**
- Modify: `source/skills/claude/edicts/SKILL.md`
- Modify: `source/protocols/plan-format.md`
- Read: `docs/cases/2026-05-01-parallel-wave-dispatch/spec.md`
- Read: `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`
- Read: `source/skills/claude/edicts/SKILL.md`
- Read: `source/protocols/plan-format.md`

**Objective:** Make the plan writer able to declare exactly one parallel-safe wave when the Files-block evidence earns it.

**Decisions already made:**
- Add the optional header line: `**Parallel-safe wave:** tasks <task numbers> — Files-block write sets are disjoint, Read entries declared and non-overlapping with sibling writes.`
- Place the callout in the plan header after `**Implementation Shape:**`; keep existing `Scope In`, `Scope Out`, and `Verification` fields.
- Declare the wave only when 2+ tasks have disjoint writes, every wave task declares `Read:`, no wave task reads a sibling's writes, and no two wave tasks invoke the same recognized canonical generator command.
- The write set is exactly the union of `Create:` + `Modify:` + `Test:` paths. `Read:` never authorizes writes. `(none)` marks an empty writes set.
- A plan with disjoint writes but missing `Read:` declarations does not receive a wave callout.
- At most one wave callout is allowed per plan; multi-wave structure halts and returns to spec-stage decomposition.
- `source/protocols/plan-format.md` receives the Codex-consumed compact equivalent of the Edicts guidance.

**Acceptance:**
- The Edicts skill template and guidance can author a valid wave callout.
- The Codex plan-format protocol names the same callout and safety conditions.
- The existing Files-block contract remains intact.

**Verification:**
- Run: `for file in source/skills/claude/edicts/SKILL.md source/protocols/plan-format.md; do for term in "Parallel-safe wave" "Create:" "Modify:" "Test:" "Read:" "(none)" "one wave"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero.

**Stop conditions:** Stop if the merged Campaign 3a Files-block contract no longer says writes are `Create:` + `Modify:` + `Test:` or no longer treats `Read:` as optional; this plan consumes that contract and must be revised if it changes.

### Task 3: Add Praetor Wave-Callout Validation
> **Evidence:** Implements [spec §7 — Praetor Verification Amendment](spec.md#7-praetor-verification-amendment). Current fetched `origin/main` already contains the Campaign 3a Files-block well-formedness check and dormant disjointness hook in the plan-verification template.

**Files:**
- Modify: `source/roles/praetor.md`
- Modify: `source/skills/claude/references/verification/templates/plan-verification.md`
- Read: `docs/cases/2026-05-01-parallel-wave-dispatch/spec.md`
- Read: `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`
- Read: `source/roles/praetor.md`
- Read: `source/skills/claude/references/verification/templates/plan-verification.md`

**Objective:** Make Praetor verify that a declared parallel-safe wave is actually safe under the Campaign 3a Files-block evidence.

**Decisions already made:**
- Add `wave-callout validation when plan declares a parallel-safe wave` to Praetor's "You own" list.
- Extend the plan-verification mission with a wave-callout validation item.
- Praetor must parse the callout task list and verify each task exists.
- Praetor computes writes as `Create:` + `Modify:` + `Test:` at file-path level; line ranges do not make same-file edits disjoint.
- Praetor requires explicit `Read:` entries for every wave task.
- Praetor checks wave-task `Read:` patterns against sibling writes under Campaign 3a glob semantics.
- Praetor flags same canonical generator command use inside the wave as a conflict.
- Failures are GAP findings; SOUND requires reasoning. CONCERN is reserved for plausible undeclared waves.
- Do not weaken or duplicate the existing Files-block well-formedness check; wave validation operates after well-formedness.

**Acceptance:**
- Praetor owns wave-callout validation.
- The plan-verification template gives Praetor enough procedure to verify syntax, disjoint writes, `Read:` presence, read/write overlap, and generator-run conflict.
- The existing Files-block well-formedness mission remains present.

**Verification:**
- Run: `for term in "wave-callout validation" "Parallel-safe wave" "Create:" "Modify:" "Test:" "Read:" "generator" "GAP" "SOUND"; do rg -Fq "$term" source/skills/claude/references/verification/templates/plan-verification.md || { echo "plan verification missing $term"; exit 1; }; done; rg -Fq "wave-callout validation" source/roles/praetor.md`
- Expected: exits zero.

**Stop conditions:** Stop if the template's Campaign 3a Files-block well-formedness check is missing; this task is an extension of that check, not a replacement.

### Task 4: Rewrite `/phalanx` For Parallel Implementation Dispatch
> **Evidence:** Implements [spec §8 — /phalanx Redefinition — Behavioral Contract](spec.md#8-phalanx-redefinition--behavioral-contract).

**Files:**
- Modify: `source/skills/claude/phalanx/SKILL.md`
- Read: `docs/cases/2026-05-01-parallel-wave-dispatch/spec.md`
- Read: `docs/cases/2026-05-01-consilium-edicts-writes-contract/spec.md`
- Read: `source/skills/claude/phalanx/SKILL.md`
- Read: `source/skills/claude/legion/implementer-prompt.md`

**Objective:** Replace the current debug fan-out skill body with a parallel implementation dispatch skill for Praetor-verified wave plans.

**Decisions already made:**
- Remove the debug-fanout framing: multi-test failure examples, broken subsystem diagnosis, and investigation-first language do not carry forward.
- Define `/phalanx` as implementation parallel dispatch for plans with a `**Parallel-safe wave:**` callout.
- Require `/phalanx` to read the plan path, locate the wave callout, parse task numbers, and defensively check each wave task has a Files block and explicit `Read:`.
- Use the spec's refusal messages for missing wave callout, missing Files block, and missing `Read:`.
- Dispatch one centurio per wave task in a single parallel dispatch message.
- Each centurio executes only its assigned task and runs that task's verification.
- If any centurio fails self-verification, halt before per-wave Tribunus and report per-task status.
- If all centurios pass, dispatch one Tribunus in plan-execution-verifier stance for per-wave verification.
- Preserve the Legatus voice and Invocation discipline; `/phalanx` is a formation, not a new verifier.
- Do not change Tribunus diagnosis routing.

**Acceptance:**
- `/phalanx` no longer reads as a debug investigation skill.
- `/phalanx` has clear summon/don't-summon rules, dispatch model, failure handling, and per-wave Tribunus verification.
- The skill consumes Campaign 3a's Files-block contract without redefining it.

**Verification:**
- Run: `for term in "parallel implementation dispatch" "Parallel-safe wave" "Files:" "Read:" "per-wave Tribunus" "plan-execution-verifier" "No parallel-safe wave callout"; do rg -Fq "$term" source/skills/claude/phalanx/SKILL.md || { echo "phalanx missing $term"; exit 1; }; done; if rg -n "3\\+ test files|multiple subsystems broken|debug session|race condition" source/skills/claude/phalanx/SKILL.md; then exit 1; fi`
- Expected: required terms exist and stale debug-fanout terms are absent.

**Stop conditions:** Stop if the executor cannot access centurio-style subagent dispatch in the target runtime; `/phalanx` is a dispatch skill and should not silently degrade into inline self-execution.

### Task 5: Add `/legion`, `/march`, And Codex Legatus Wave Recognition
> **Evidence:** Implements [spec §9 — /legion and /march Light Recognition](spec.md#9-legion-and-march-light-recognition). Fetched `origin/main:source/manifest.json` shows Codex `consilium-legatus` includes `protocols/legatus-routing.md` and `protocols/plan-format.md`, so Codex Legatus needs the routing equivalent.

**Files:**
- Modify: `source/skills/claude/legion/SKILL.md`
- Modify: `source/skills/claude/march/SKILL.md`
- Modify: `source/protocols/legatus-routing.md`
- Read: `docs/cases/2026-05-01-parallel-wave-dispatch/spec.md`
- Read: `source/skills/claude/legion/SKILL.md`
- Read: `source/skills/claude/march/SKILL.md`
- Read: `source/protocols/legatus-routing.md`
- Read: `source/manifest.json`

**Objective:** Make sequential execution paths pause and surface a declared wave before they begin mainline execution.

**Decisions already made:**
- Add a pre-mainline check after the plan is read and before dispatch/execution starts.
- If the plan header contains `**Parallel-safe wave:**`, surface one prompt naming the task list and offering the binary choice: dispatch via `/phalanx` or continue with the current skill.
- Use this wording unless implementation context forces a tiny adaptation: `Plan declares a parallel-safe wave: tasks <N>. Imperator: dispatch this wave with /phalanx, or continue here sequentially?`
- Block mainline dispatch until the Imperator answers.
- If the Imperator chooses `/phalanx`, exit cleanly and instruct a fresh `/phalanx <plan-path>` invocation. Do not auto-invoke `/phalanx`.
- If the Imperator chooses continue, proceed with the current skill unchanged.
- Do not remove /legion's existing tactical parallelism clause.
- Do not change /march's self-execution model except for this prompt.
- Add the equivalent rule to Codex `source/protocols/legatus-routing.md` without rewriting unrelated fix routing, Centurion dispatch law, or Medusa execution sections.

**Acceptance:**
- `/legion`, `/march`, and Codex Legatus all recognize a wave callout before mainline execution.
- The prompt is informational and blocking, not automatic dispatch.
- Existing sequential execution behavior remains available after the Imperator chooses continue.

**Verification:**
- Run: `for file in source/skills/claude/legion/SKILL.md source/skills/claude/march/SKILL.md source/protocols/legatus-routing.md; do for term in "Parallel-safe wave" "/phalanx" "continue" "before" "mainline"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero.

**Stop conditions:** Stop if runtime routing no longer uses `source/protocols/legatus-routing.md` for Codex `consilium-legatus`; the Codex parity target would need re-evaluation.

### Task 6: Regenerate Derived Runtime Surfaces And Prove Parity
> **Risk:** This task invokes recognized generator/install commands. Per Campaign 3a, generator-derived outputs are not listed as writes in this Files block; do not hand-edit generated or compatibility files.

**Files:**
- (none)
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Read: `codex/scripts/install-codex.sh`
- Read: `source/manifest.json`
- Read: `source/skills/claude/consul/SKILL.md`
- Read: `source/skills/claude/edicts/SKILL.md`
- Read: `source/skills/claude/phalanx/SKILL.md`
- Read: `source/skills/claude/legion/SKILL.md`
- Read: `source/skills/claude/march/SKILL.md`
- Read: `source/protocols/consul-routing.md`
- Read: `source/protocols/plan-format.md`
- Read: `source/protocols/legatus-routing.md`
- Read: `source/roles/praetor.md`
- Read: `source/skills/claude/references/verification/templates/plan-verification.md`

**Objective:** Update derived runtime copies from canonical source and prove repo-local parity; install only when the execution lane calls for active user-scope runtime update.

**Decisions already made:**
- Run `python3 runtimes/scripts/generate.py` after all source edits are complete.
- Do not manually edit `generated/`, `codex/source/`, `codex/agents/`, `codex/config/`, or `claude/skills/`.
- Run repo-local parity after generation.
- If the executor is shipping the active runtime, run `bash codex/scripts/install-codex.sh` and then installed parity. If the executor is only preparing a branch/PR, skip install and state that installed parity was not run.
- Generated outputs may include derived copies for all changed source surfaces; treat those as generator-owned.

**Acceptance:**
- Generated and compatibility copies reflect the canonical source changes.
- Repo-local parity passes.
- Installed parity passes if install is performed; otherwise the report clearly says install was skipped.

**Verification:**
- Run: `python3 runtimes/scripts/generate.py`
- Expected: exits zero and prints generated Codex/Claude counts.
- Run: `python3 runtimes/scripts/check-runtime-parity.py`
- Expected: exits zero.
- Optional install lane run: `bash codex/scripts/install-codex.sh && python3 runtimes/scripts/check-runtime-parity.py --installed`
- Expected: exits zero if install is in scope.
- Run: `for term in "Parallel-safe wave" "per-wave Tribunus" "wave-callout validation" "Anticipated parallel-safe wave"; do rg -Fq "$term" generated codex/source claude/skills || { echo "derived outputs missing $term"; exit 1; }; done`
- Expected: exits zero after generation.

**Stop conditions:** Stop if generation changes unrelated source files or if parity fails after generation; do not paper over derived-runtime drift.
