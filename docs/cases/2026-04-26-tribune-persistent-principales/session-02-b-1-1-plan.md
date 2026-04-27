# B-1.1 — Persistent Tribunus Executor: Wire-Up Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four design-fork GAPs that keep B-1's persistent Tribunus-executor pattern dormant — vocabulary unification across the verification flow, `plan_id` blob-SHA wire-up at `/legion` pre-spawn, post-Soldier-commit diff semantics, and partial-protocol routing to mini-checkit fallback.

**Architecture:** Six tasks across five surfaces — three template/schema docs (`tribune-persistent.md`, `tribune-log-schema.md`, `tribune-protocol-schema.md`), one design template (`tribune-design.md`), and one orchestration skill (`legion/SKILL.md`). Task 1 is the §4.1 atomic vocabulary migration (single commit covering 5 surfaces — discipline mandated by spec). Tasks 2–3 land the schema/design contract changes pre-runtime. Tasks 4–5 wire `task_start_sha` through templates and `/legion`. Task 6 reshapes `/legion` pre-spawn into the 4-branch ordered routing with SHA comparison. No code is written; the changes are markdown contract revisions and `/legion` SKILL prose.

**Tech Stack:** Markdown (skill bodies, templates, schema docs). Bash (pre-flight grep/SHA verification only). No new code. No tests in the unit-test sense — verification is grep-based post-conditions on the migrated surfaces, plus the eventual end-of-campaign Campaign Review.

---

## Pre-flight: Verify the ground

> **Confidence: High** — these checks confirm the plan's prerequisites before any edit fires. Spec blob SHA is the iteration-3 sealed value the verification cycle and Imperator approval ran against.

Before Task 1, the executing agent (Soldier or Legatus) must confirm:

- [ ] **Pre-flight 1: $CONSILIUM_DOCS resolves.**

Run:

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS" && echo OK
```

Expected: `OK`.

- [ ] **Pre-flight 2: Spec is at iteration 3 and committed (blob SHA match).**

Run:

```bash
git -C "$HOME/projects/Consilium" rev-parse HEAD:docs/cases/2026-04-26-tribune-persistent-principales/session-02-b-1-1-spec.md
```

Expected: `518eb41217c6069807de3c88c165910ac5d2fb58`.

If the SHA differs, the spec has drifted since iteration-3 sealing — halt and escalate.

- [ ] **Pre-flight 3: All five target files exist.**

Run:

```bash
ls "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md" \
   "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md" \
   "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md" \
   "$HOME/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md" \
   "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: all five paths listed (no error).

- [ ] **Pre-flight 4: Working tree is clean.**

Run:

```bash
git -C "$HOME/projects/Consilium" status --porcelain
```

Expected: empty output. If non-empty, halt and ask the Imperator how to handle pre-existing changes — Task 1's commit must be a clean atomic migration commit.

If any pre-flight fails, halt and escalate to the Imperator.

---

## Task 1: §4.1 Vocabulary Unification — atomic migration across 5 surfaces

> **Confidence: High** — implements [spec §4.1 — Vocabulary Unification (GAP-4)](./session-02-b-1-1-spec.md#41-vocabulary-unification-gap-4); migration footprint table names the exact lines and surfaces; spec §4.1 mandates "single atomic plan-task with one commit" — this task is non-decomposable. Verified target lines exist at the cited line numbers via direct file read at plan-authoring time.

**Files:**
- Modify: `claude/skills/references/verification/templates/tribune-persistent.md` (lines 52, 67, 68, 70, 111)
- Modify: `claude/skills/references/verification/tribune-log-schema.md` (lines 14, 23, 38, 46, 53)
- Modify: `claude/skills/legion/SKILL.md` (line 175)

- [ ] **Step 1: Read the three target files to confirm line content matches the migration footprint.**

Use the Read tool on each of the three absolute paths:

- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`
- `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

Confirm the `old_string` blocks below appear verbatim in their respective files. If any anchor is missing, halt — the file has drifted since the spec was written, and the Imperator must reconcile.

- [ ] **Step 2: Edit `tribune-persistent.md` line 52 — counterfactual verdict vocabulary.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  1. Run Claude-side patrol on Kimi-covered surfaces FIRST — before dispatching lanes. Capture the counterfactual verdict (PASS/CONCERN/FAIL) and findings. This counterfactual is uncontaminated by docket exposure.
```

new_string:

```
  1. Run Claude-side patrol on Kimi-covered surfaces FIRST — before dispatching lanes. Capture the counterfactual verdict (SOUND/CONCERN/GAP/MISUNDERSTANDING — Codex categories) and findings. This counterfactual is uncontaminated by docket exposure.
```

- [ ] **Step 3: Edit `tribune-persistent.md` line 67 — Deviation rule vocabulary.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  6. Apply the Codex's Deviation-as-Improvement Rule: when a lane flags a deviation, decide improvement (SOUND-with-note) or drift (FAIL-with-note).
```

new_string:

```
  6. Apply the Codex's Deviation-as-Improvement Rule: when a lane flags a deviation, decide improvement (SOUND-with-note) or drift (GAP-with-note).
```

- [ ] **Step 4: Edit `tribune-persistent.md` line 68 — integrated verdict vocabulary.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  7. Compute the integrated verdict: PASS / CONCERN / FAIL.
```

new_string:

```
  7. Compute the integrated verdict using most-severe-wins: SOUND / CONCERN / GAP / MISUNDERSTANDING. If any single finding is MISUNDERSTANDING, the integrated verdict is MISUNDERSTANDING; else if any is GAP, the verdict is GAP; else if any is CONCERN, the verdict is CONCERN; else SOUND.
```

- [ ] **Step 5: Edit `tribune-persistent.md` line 70 — reply contract vocabulary.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  9. Reply to the Legatus's SendMessage with: verdict (PASS/CONCERN/FAIL), brief findings summary, and one-line chain of evidence per major finding.
```

new_string:

```
  9. Reply to the Legatus's SendMessage with: verdict (one of SOUND, CONCERN, GAP, MISUNDERSTANDING — Codex categories), verdict_summary (one-line synopsis tied to the verdict category), findings (Codex-tagged with chain of evidence per Codex rules).
```

- [ ] **Step 6: Edit `tribune-persistent.md` line 111 — per-task verdict-handling routing.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
The Tribunus-executor responds with the integrated verdict. The Legatus handles findings per the Codex (PASS → next task; CONCERN → note for Campaign review; FAIL → fix-soldier dispatch + re-verify; MISUNDERSTANDING-tagged FAIL → halt + escalate).
```

new_string:

```
The Tribunus-executor responds with the integrated verdict. The Legatus handles findings per the Codex (SOUND → next task; CONCERN → note for Campaign review; GAP → fix-soldier dispatch + re-verify; MISUNDERSTANDING → halt + escalate).
```

- [ ] **Step 7: Edit `tribune-log-schema.md` line 14 — entry verdict field domain.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
    verdict: PASS | CONCERN | FAIL
    lanes_fired: [task-plan-match, ...]
```

new_string:

```
    verdict: SOUND | CONCERN | GAP | MISUNDERSTANDING
    lanes_fired: [task-plan-match, ...]
```

- [ ] **Step 8: Edit `tribune-log-schema.md` line 23 — counterfactual verdict field domain.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
    counterfactual:  # populated only on sampled tasks
      verdict: PASS | CONCERN | FAIL
      findings: [...]
```

new_string:

```
    counterfactual:  # populated only on sampled tasks
      verdict: SOUND | CONCERN | GAP | MISUNDERSTANDING
      findings: [...]
```

- [ ] **Step 9: Edit `tribune-log-schema.md` line 38 — verdict definition (retire mapping comment).**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
- **`entries[].verdict`** — Tribunus-executor's integrated verdict. PASS = SOUND. CONCERN = soft finding for Campaign review. FAIL = GAP or MISUNDERSTANDING that halts the legion.
```

new_string:

```
- **`entries[].verdict`** — Tribunus-executor's integrated verdict, one of the four Codex categories: SOUND, CONCERN, GAP, MISUNDERSTANDING. SOUND advances; CONCERN is a soft finding for Campaign review; GAP routes to fix-soldier dispatch + re-verify; MISUNDERSTANDING halts the legion and escalates to the Imperator per the Codex.
```

- [ ] **Step 10: Edit `tribune-log-schema.md` line 46 — counterfactual definition vocabulary.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
- **`entries[].counterfactual`** — populated only on sampled tasks (every 3rd task by plan-index). Captures Claude-side patrol verdict rendered BEFORE lane dispatch on that task — uncontaminated by docket exposure. PASS/CONCERN/FAIL same vocabulary.
```

new_string:

```
- **`entries[].counterfactual`** — populated only on sampled tasks (every 3rd task by plan-index). Captures Claude-side patrol verdict rendered BEFORE lane dispatch on that task — uncontaminated by docket exposure. Same Codex vocabulary (SOUND/CONCERN/GAP/MISUNDERSTANDING) as the integrated verdict.
```

- [ ] **Step 11: Edit `tribune-log-schema.md` line 53 — relax "Atomic per task" discipline.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
- **Atomic per task.** One full entry per task; no partial entries.
```

new_string:

```
- **One entry per Soldier-dispatch.** Primary task verification produces one entry; a fix-soldier re-dispatch (triggered when the primary verdict was GAP) produces a second entry against the same `task_id`. Both entries carry their own `task_start_sha` and verdict. No partial entries — each entry is fully populated.
```

- [ ] **Step 12: Edit `legion/SKILL.md` line 175 — DONE handler reply-vocabulary prose.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

old_string:

```
**DONE** — The task is complete as specified. Before signaling, I compute the Sampled flag for this task: `(plan_index of this task) mod 3 == 0` — true on tasks 3, 6, 9, 12, 15, 18, ... (deterministic across 15-task window restarts; plan-index is the canonical input, not window-position). I signal the persistent Tribunus-executor via `SendMessage({to: "tribune-w<N>", ...})` per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`, populating the message body fields the template specifies — including the computed Sampled flag. The Tribunus replies with the integrated verdict (PASS/CONCERN/FAIL). If the persistent pattern is unavailable, I fall back to ephemeral Patrol via `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` per the fallback procedure in the persistent template. No task passes without verification — not one, not ever.
```

new_string:

```
**DONE** — The task is complete as specified. Before signaling, I compute the Sampled flag for this task: `(plan_index of this task) mod 3 == 0` — true on tasks 3, 6, 9, 12, 15, 18, ... (deterministic across 15-task window restarts; plan-index is the canonical input, not window-position). I signal the persistent Tribunus-executor via `SendMessage({to: "tribune-w<N>", ...})` per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`, populating the message body fields the template specifies — including the computed Sampled flag. The Tribunus replies with the integrated verdict in Codex vocabulary (SOUND/CONCERN/GAP/MISUNDERSTANDING). If the persistent pattern is unavailable, I fall back to ephemeral Patrol via `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` per the fallback procedure in the persistent template. No task passes without verification — not one, not ever.
```

- [ ] **Step 13: Verify no `PASS`/`FAIL` token remains in the migrated surfaces.**

Run:

```bash
grep -nE '\bPASS\b|\bFAIL\b' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md" \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md" \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: **no matches** (exit code 1; grep returns empty). If any match returns, the migration is incomplete — locate the line, add another Edit step, and re-run before committing.

Note on word-boundary discipline: `\bPASS\b` and `\bFAIL\b` will not match `passing`, `failure`, `bypass`, `failover`, etc. — only the standalone tokens this migration retires.

- [ ] **Step 14: Verify the four Codex categories now appear across the migrated surfaces.**

Run:

```bash
grep -cE 'SOUND|CONCERN|GAP|MISUNDERSTANDING' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md" \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md" \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: each of the three files shows a non-zero count.

- [ ] **Step 15: Commit the atomic migration.**

```bash
git -C "$HOME/projects/Consilium" add \
  claude/skills/references/verification/templates/tribune-persistent.md \
  claude/skills/references/verification/tribune-log-schema.md \
  claude/skills/legion/SKILL.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): unify verdict vocabulary on Codex categories (§4.1)

Atomic migration across 5 surfaces:
- tribune-persistent.md spawn body (counterfactual + Deviation + integrated + reply contract)
- tribune-persistent.md per-task verdict-handling routing
- executor reply contract (verdict / verdict_summary / findings)
- tribune-log-schema.md (entry + counterfactual field domains; verdict definition; Atomic per task discipline relaxation)
- /legion DONE handler reply-vocabulary prose

Retires PASS/CONCERN/FAIL across the persistent verification flow. MISUNDERSTANDING promoted from a tag overlay on FAIL to a first-class category. Codex halt-on-MISUNDERSTANDING semantics preserved unchanged."
```

---

## Task 2: §4.2 SHA contract documentation — pin `plan_id` to blob SHA + correct invalidation actor

> **Confidence: High** — implements [spec §4.2 — `plan_id` SHA Mismatch Wire-Up (GAP-1)](./session-02-b-1-1-spec.md#42-plan_id-sha-mismatch-wire-up-gap-1); blob SHA precedent established at `2026-04-26-custos-edicts-wiring/decisions.md:111`. Verified target lines (11, 38, 66) at plan-authoring time.

**Files:**
- Modify: `claude/skills/references/verification/tribune-protocol-schema.md` (lines 11, 38, 66)
- Modify: `claude/skills/references/verification/templates/tribune-design.md` (dispatch prompt body — instruct blob SHA when authoring `plan_id`)

- [ ] **Step 1: Read the two target files to confirm anchor content.**

Read:
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md`
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md`

Confirm the `old_string` blocks below appear verbatim. If drifted, halt.

- [ ] **Step 2: Edit `tribune-protocol-schema.md` line 11 — YAML schema example for `plan_id`.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md`

old_string:

```
plan_id: <case>/plan.md commit-or-hash
```

new_string:

```
plan_id: <case>/plan.md <40-hex-blob-sha>  # space-separated path + blob SHA from `git rev-parse HEAD:<plan-path>`
```

- [ ] **Step 3: Edit `tribune-protocol-schema.md` line 38 — `plan_id` field definition.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md`

old_string:

```
- **`plan_id`** — case-relative path to `plan.md` plus the git SHA at which the protocol was authored. Detects post-protocol plan drift.
```

new_string:

```
- **`plan_id`** — case-relative path to `plan.md` plus the **blob SHA** at which the protocol was authored, computed via `git rev-parse HEAD:<plan-path>` at the moment Tribunus-design wrote the protocol. Format: `<path> <40-hex-blob-sha>` (space-separated, single line). The SHA is case-insensitive on read; lowercase preferred per git's output convention. Blob SHA (not commit SHA) is the canonical form: it is stable across unrelated commits and detects only meaningful plan changes. Precedent: `2026-04-26-custos-edicts-wiring/decisions.md:111`. Detects post-protocol plan drift.
```

- [ ] **Step 4: Edit `tribune-protocol-schema.md` line 66 — invalidation clause actor correction.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md`

old_string:

```
- The Imperator edits the plan after Tribunus-design ran but before Legion start. The `plan_id` SHA mismatch is detected at Legion start; Tribunus-executor halts and signals re-design.
```

new_string:

```
- The Imperator edits the plan after Tribunus-design ran but before Legion start. The `plan_id` SHA mismatch is detected at `/legion` pre-spawn (BEFORE any executor exists); `/legion` refuses to spawn the persistent executor, surfaces the diff inline + as a `decisions.md` `verdict` entry, and routes the case back to `/edicts` for re-design at the Imperator's gate. The executor itself is not spawned and therefore does not halt — the response is `/legion` refusing to spawn, not the executor halting.
```

- [ ] **Step 5: Edit `tribune-design.md` dispatch prompt body — instruct blob SHA on `plan_id` authoring.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md`

old_string:

```
6. Write the protocol to <CASE DIR>/tribune-protocol.md per the schema.

7. Report back to the Consul one of:
```

new_string:

```
6. Write the protocol to <CASE DIR>/tribune-protocol.md per the schema. The `plan_id` field MUST be authored as `<case-relative-path-to-plan.md> <40-hex-blob-sha>` (space-separated). Compute the blob SHA via `git rev-parse HEAD:<plan-path>` at the moment of authoring. Blob SHA, not commit SHA — blob SHA is stable across unrelated commits and detects only meaningful plan changes (precedent: `2026-04-26-custos-edicts-wiring/decisions.md:111`). The path must be case-relative (e.g., `plan.md` if authoring inside the case folder, or `<case-slug>/plan.md` if authored from the repo root context — match how `/legion` will resolve the path against the case folder at pre-spawn).

7. Report back to the Consul one of:
```

- [ ] **Step 6: Verify the schema doc no longer says "commit-or-hash" or "Tribunus-executor halts" on the invalidation clause.**

Run:

```bash
grep -nE 'commit-or-hash|Tribunus-executor halts and signals re-design' \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md"
```

Expected: **no matches**.

- [ ] **Step 7: Verify the design template now mentions blob SHA in `plan_id` authoring.**

Run:

```bash
grep -nE 'blob SHA|git rev-parse HEAD:' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md"
```

Expected: at least one match (the new authoring instruction).

- [ ] **Step 8: Commit.**

```bash
git -C "$HOME/projects/Consilium" add \
  claude/skills/references/verification/tribune-protocol-schema.md \
  claude/skills/references/verification/templates/tribune-design.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): pin plan_id to blob SHA + correct invalidation actor (§4.2)

- tribune-protocol-schema.md: plan_id YAML example + field definition pinned to blob SHA via \`git rev-parse HEAD:<plan-path>\`; format \`<path> <40-hex-blob-sha>\`.
- tribune-protocol-schema.md: invalidation clause actor corrected — detection at /legion pre-spawn, response is /legion refusing to spawn, not executor halting.
- tribune-design.md: authoring guidance instructs blob SHA when writing plan_id."
```

---

## Task 3: §4.4 `lanes_triggered: []` authorization — design template + persistent template

> **Confidence: High** — implements [spec §4.4 — Partial-Protocol Routing (GAP-5)](./session-02-b-1-1-spec.md#44-partial-protocol-routing-gap-5) per-task scope wire-shape (CONCERN-Praetor-2 + CONCERN-Provocator-9 fold-in); spec mandates explicit authorization in `tribune-design.md` and runbook documentation in `tribune-persistent.md`.

**Files:**
- Modify: `claude/skills/references/verification/templates/tribune-design.md` (dispatch prompt body — explicit `lanes_triggered: []` authorization)
- Modify: `claude/skills/references/verification/templates/tribune-persistent.md` (per-task scope clarification: protocol-level vs per-task `lanes_triggered: []`)

- [ ] **Step 1: Read the two target files to confirm anchor content.**

Read:
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md`
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

Confirm anchor content matches. If drifted, halt.

- [ ] **Step 2: Edit `tribune-design.md` — explicit authorization for `lanes_triggered: []`.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md`

old_string:

```
   Default subset for any task: [task-plan-match, task-no-stubs]. Add task-domain-correctness when the task touches a domain-doctrine surface (Medusa workflow boundary, link.create, money path, frontend hard rule). Add task-integration-prior when the task interfaces with prior-task interfaces.
```

new_string:

```
   Default subset for any task: [task-plan-match, task-no-stubs]. Add task-domain-correctness when the task touches a domain-doctrine surface (Medusa workflow boundary, link.create, money path, frontend hard rule). Add task-integration-prior when the task interfaces with prior-task interfaces.

   **Empty `lanes_triggered: []` is explicitly authorized** for tasks that genuinely have no per-task verification surface — for example, a documentation-only task with no code changes, or a configuration toggle whose effects are not Kimi-verifiable. Do NOT default to empty; reach for it deliberately when no lane has anything to verify. When `lanes_triggered: []`, the persistent executor handles that task in patrol-mode (Claude-side mini-checkit only, no Kimi dispatch) — see the per-task scope documentation in `templates/tribune-persistent.md`. This per-task authorization is distinct from the protocol-level routing in `/legion` pre-spawn (which routes empty/malformed protocols to mini-checkit fallback, not just empty `lanes_triggered`).
```

- [ ] **Step 3: Edit `tribune-persistent.md` — add per-task scope documentation distinguishing protocol-level vs per-task scope.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
For all tasks (sampled or not):
  2. Read the protocol's `tasks[].lanes_triggered`, `claims_per_lane`, `evidence_sources_per_lane`, and `model_profile_per_lane` for this task_id.
```

new_string:

```
For all tasks (sampled or not):
  2. Read the protocol's `tasks[].lanes_triggered`, `claims_per_lane`, `evidence_sources_per_lane`, and `model_profile_per_lane` for this task_id.

  **Per-task scope: empty `lanes_triggered: []`.** When the protocol authorizes `lanes_triggered: []` for the current task (per the per-task scope clause in `templates/tribune-design.md`), skip steps 3-4 (evidence preload + Kimi dispatch) for this task and proceed directly to step 5 (Claude-side patrol). Patrol-mode is the verification stance for that single task; subsequent tasks may still have non-empty `lanes_triggered` and use full Kimi dispatch. Do NOT confuse this per-task fall-back with the protocol-level fall-back (`/legion` pre-spawn routes absent/empty/unparseable/malformed protocols to mini-checkit for the entire campaign — distinct decision point, distinct scope).
```

- [ ] **Step 4: Verify the design template now explicitly authorizes empty `lanes_triggered`.**

Run:

```bash
grep -nE 'Empty.*lanes_triggered.*explicitly authorized' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md"
```

Expected: one match.

- [ ] **Step 5: Verify the persistent template now documents per-task scope.**

Run:

```bash
grep -nE 'Per-task scope: empty' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md"
```

Expected: one match.

- [ ] **Step 6: Commit.**

```bash
git -C "$HOME/projects/Consilium" add \
  claude/skills/references/verification/templates/tribune-design.md \
  claude/skills/references/verification/templates/tribune-persistent.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): authorize lanes_triggered: [] + document per-task scope (§4.4)

- tribune-design.md: explicit authorization for empty lanes_triggered as a per-task state when no Kimi-verifiable surface exists.
- tribune-persistent.md: per-task scope clause clarifying that empty lanes_triggered routes to Claude-side patrol for that single task, distinct from protocol-level fall-back at /legion pre-spawn.

Folds CONCERN-Praetor-2 + CONCERN-Provocator-9 from B-1 Campaign Review."
```

---

## Task 4: §4.3 schema and template — `task_start_sha` field + diff-range semantics

> **Confidence: High** — implements [spec §4.3 — Post-Soldier-Commit Diff Semantics (GAP-3)](./session-02-b-1-1-spec.md#43-post-soldier-commit-diff-semantics-gap-3); spec specifies the wire-shape additions to `tribune-log-schema.md` (new field) + `tribune-persistent.md` (diff range applies to verification AND `interface_summary`); SendMessage body documentation grows by one required field.

**Files:**
- Modify: `claude/skills/references/verification/tribune-log-schema.md` (add `task_start_sha` to entries schema + field definition)
- Modify: `claude/skills/references/verification/templates/tribune-persistent.md` (diff range against `task_start_sha`; SendMessage body adds `task_start_sha` + `change_set` required; fix-soldier verification scope clause)

- [ ] **Step 1: Read the two target files to confirm anchor content.**

Read:
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

Confirm anchor content. If drifted, halt.

- [ ] **Step 2: Edit `tribune-log-schema.md` schema YAML — add `task_start_sha` field after `window_id`.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
  - task_id: <id>
    window_id: w1
    verdict: SOUND | CONCERN | GAP | MISUNDERSTANDING
```

new_string:

```
  - task_id: <id>
    window_id: w1
    task_start_sha: <40-hex-commit-sha>  # full commit SHA captured at SendMessage emission for this entry; diff range is (task_start_sha, HEAD]
    verdict: SOUND | CONCERN | GAP | MISUNDERSTANDING
```

- [ ] **Step 3: Edit `tribune-log-schema.md` Field Definitions — add `task_start_sha` definition after `window_id`.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md`

old_string:

```
- **`window_id`** — `w1`, `w2`, ... per Tribunus-executor instance. Restart at the 15-task boundary increments.
- **`entries[].task_id`** — plan task identifier; matches the protocol task_id.
```

new_string:

```
- **`window_id`** — `w1`, `w2`, ... per Tribunus-executor instance. Restart at the 15-task boundary increments.
- **`entries[].task_id`** — plan task identifier; matches the protocol task_id.
- **`entries[].task_start_sha`** — full commit SHA at the moment `/legion` emitted the SendMessage that triggered this entry. Captured by `/legion` via `git rev-parse HEAD` at SendMessage emission. **Required.** The verifier's diff range for this entry is bounded by `(task_start_sha, HEAD]` over the task's `change_set`. On fix-soldier re-dispatch, a fresh `task_start_sha` is captured at the fix-soldier's SendMessage emission and a second entry is appended against the same `task_id` (per the "One entry per Soldier-dispatch" discipline in this schema).
```

- [ ] **Step 4: Edit `tribune-persistent.md` — diff slice instruction (replaces bare `git diff` with the bounded range).**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  3. Preload the evidence bundle per lane:
     - Diff slices from `git diff` over the change_set.
     - File-content slices for full-file context where the protocol names them.
     - Doctrine excerpts from the paths in evidence_sources_per_lane (read directly).
     - Prior-task interface summaries from the appended tribune-log.md entries.
```

new_string:

```
  3. Preload the evidence bundle per lane:
     - Diff slices over `change_set`, bounded by the commit range from `task_start_sha` (exclusive) through current HEAD (inclusive). Pseudo-command: `git diff <task_start_sha>..HEAD -- <change_set>`. The base ref is supplied per-task by `/legion` in the SendMessage body. Bare `git diff` (working-tree-vs-HEAD) is **not permitted** — it returns empty after a Soldier commit and produces silent verification on stale state. If `change_set: []` (empty list), skip diff extraction entirely — the executor emits `verdict: SOUND` with `verdict_summary: "no-op task"` and proceeds to the next step.
     - File-content slices for full-file context where the protocol names them.
     - Doctrine excerpts from the paths in evidence_sources_per_lane (read directly).
     - Prior-task interface summaries from the appended tribune-log.md entries.
```

- [ ] **Step 5: Edit `tribune-persistent.md` — interface_summary uses the same diff convention.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
  8. Append an entry to <CASE DIR>/tribune-log.md per the schema, including kimi_dockets, claude_side_findings, deviation_as_improvement_notes, final_chain_of_evidence, cost_usd_kimi (sum of fired-lane docket cost_usd), and interface_summary (added/modified/removed function signatures from the diff). On sampled tasks, also write the counterfactual block.
```

new_string:

```
  8. Append an entry to <CASE DIR>/tribune-log.md per the schema, including task_start_sha (received in the SendMessage body), kimi_dockets, claude_side_findings, deviation_as_improvement_notes, final_chain_of_evidence, cost_usd_kimi (sum of fired-lane docket cost_usd), and interface_summary (added/modified/removed function signatures from the diff range `(task_start_sha, HEAD]` over `change_set` — the same convention as verification, never bare `git diff`). On sampled tasks, also write the counterfactual block.
```

- [ ] **Step 6: Edit `tribune-persistent.md` — SendMessage Body adds `task_start_sha` and required-field discipline.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

old_string:

```
### SendMessage Body

```
Task complete: <task_id>
Change set: <list of files touched>
Implementation summary: <one paragraph from soldier's DONE report>
Sampled: <true if (plan_index of this task) mod 3 == 0, else false>

Verify and reply.
```

The Tribunus-executor responds with the integrated verdict.
```

new_string:

```
### SendMessage Body

```
Task complete: <task_id>
Task start SHA: <40-hex-commit-sha — `git rev-parse HEAD` at SendMessage emission>
Change set: <list of files touched — empty list permitted; absent field is malformed>
Implementation summary: <one paragraph from soldier's DONE report>
Sampled: <true if (plan_index of this task) mod 3 == 0, else false>

Verify and reply.
```

**Required field discipline.** `task_id`, `task_start_sha`, `change_set`, `implementation_summary`, and `sampled` are all required. A SendMessage body received without `task_start_sha` or without `change_set` is malformed; the executor responds with `verdict: GAP` naming the missing-field error and does not proceed to verification. `change_set: []` (empty list) is well-formed and means the task produced no file changes — the executor emits `verdict: SOUND` with `verdict_summary: "no-op task"` and skips diff extraction.

**Fix-soldier re-dispatch.** When the executor returned `verdict: GAP` on a primary task and `/legion` dispatches a fix-soldier, `/legion` captures a **fresh** `task_start_sha` at the fix-soldier's SendMessage emission. The fix-soldier verifier evaluates **the fix as a unit**, not the integrated (primary + fix) work — the diff range `(fix_task_start_sha, HEAD]` covers only what the fix-soldier produced after dispatch. Two consecutive log entries for the same `task_id` are appended (per the schema's "One entry per Soldier-dispatch" discipline): the original verification and the fix's re-verification, each carrying its own `task_start_sha`.

**Fix-soldier failure modes.** Two specific cases the executor handles:
- **Fix-soldier mid-dispatch crash.** `/legion` retries per the existing crash-recovery semantics; on retry, a fresh `task_start_sha` is captured at the retried fix dispatch. The crashed dispatch produces no log entry.
- **Fix-soldier returns DONE with zero commits** (`change_set` non-empty but no commits landed since fix dispatch). The verifier emits `verdict: GAP` with `verdict_summary: "fix-soldier produced no commits — escalate per Codex auto-feed-cap"`. A zero-commit response to a GAP-driven fix dispatch is functionally a refusal-to-fix; the verdict surfaces it for the auto-feed handler to escalate.

The Tribunus-executor responds with the integrated verdict.
```

- [ ] **Step 7: Verify `tribune-log-schema.md` now declares `task_start_sha` as a required entry field.**

Run:

```bash
grep -nE 'task_start_sha' \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md"
```

Expected: at least 2 matches (one in YAML schema, one in field definition).

- [ ] **Step 8: Verify `tribune-persistent.md` no longer instructs bare `git diff` for verification or interface_summary.**

Run:

```bash
grep -nE 'from `git diff` over the change_set|signatures from the diff\)' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md"
```

Expected: **no matches** — the bare-diff instructions have been replaced.

- [ ] **Step 9: Commit.**

```bash
git -C "$HOME/projects/Consilium" add \
  claude/skills/references/verification/tribune-log-schema.md \
  claude/skills/references/verification/templates/tribune-persistent.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): wire task_start_sha into log schema + persistent template diff semantics (§4.3)

- tribune-log-schema.md: task_start_sha required field per entry; diff range (task_start_sha, HEAD] over change_set; fix-soldier re-dispatch creates a second entry against the same task_id.
- tribune-persistent.md: diff slice and interface_summary both bounded by (task_start_sha, HEAD] over change_set; bare git diff is no longer permitted.
- tribune-persistent.md: SendMessage body adds task_start_sha + required-field discipline (missing → verdict GAP; change_set: [] permitted; fix-soldier re-dispatch captures fresh task_start_sha; fix-soldier verifier evaluates fix-as-unit; crash-retry + zero-commit failure modes specified)."
```

---

## Task 5: §4.3 `/legion` `task_start_sha` capture at every executor-bound SendMessage

> **Confidence: High** — implements [spec §4.3 — Post-Soldier-Commit Diff Semantics (GAP-3)](./session-02-b-1-1-spec.md#43-post-soldier-commit-diff-semantics-gap-3); spec specifies the property-based capture surface — every `/legion` code path emitting an executor-bound SendMessage captures `task_start_sha` at the moment of emission. The two emission paths in current `/legion` prose are the primary DONE handler and the fix-soldier re-dispatch (referenced in the "When the Tribunus finds a GAP" prose).

**Files:**
- Modify: `claude/skills/legion/SKILL.md` (DONE handler line 175 region — capture `task_start_sha` at primary SendMessage; fix-soldier dispatch prose around line 356 — capture fresh `task_start_sha` at fix-soldier SendMessage)

- [ ] **Step 1: Read `legion/SKILL.md` to confirm anchor content for the DONE handler and fix-soldier prose.**

Read: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

Confirm both anchors below appear verbatim. If drifted, halt.

- [ ] **Step 2: Edit DONE handler — capture `task_start_sha` at primary SendMessage emission.**

Note: this Edit's `old_string` includes the iteration produced by Task 1 Step 12 (Codex vocabulary in the parenthetical). Sequencing matters — Task 1 must commit before Task 5 runs.

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

old_string:

```
**DONE** — The task is complete as specified. Before signaling, I compute the Sampled flag for this task: `(plan_index of this task) mod 3 == 0` — true on tasks 3, 6, 9, 12, 15, 18, ... (deterministic across 15-task window restarts; plan-index is the canonical input, not window-position). I signal the persistent Tribunus-executor via `SendMessage({to: "tribune-w<N>", ...})` per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`, populating the message body fields the template specifies — including the computed Sampled flag. The Tribunus replies with the integrated verdict in Codex vocabulary (SOUND/CONCERN/GAP/MISUNDERSTANDING). If the persistent pattern is unavailable, I fall back to ephemeral Patrol via `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` per the fallback procedure in the persistent template. No task passes without verification — not one, not ever.
```

new_string:

```
**DONE** — The task is complete as specified. Before signaling, I compute the Sampled flag for this task: `(plan_index of this task) mod 3 == 0` — true on tasks 3, 6, 9, 12, 15, 18, ... (deterministic across 15-task window restarts; plan-index is the canonical input, not window-position). I also capture `task_start_sha` — the full commit SHA at this exact moment, computed via `git rev-parse HEAD` — and `change_set` — the list of files the dispatched Soldier was directed to touch (which may be the empty list `[]` if the task produced no file changes). I signal the persistent Tribunus-executor via `SendMessage({to: "tribune-w<N>", ...})` per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`, populating the message body fields the template specifies — `task_id`, `task_start_sha`, `change_set`, `implementation_summary`, and the computed `sampled` flag (all required; missing `task_start_sha` or `change_set` makes the body malformed, and the executor will return `verdict: GAP` naming the missing field). The Tribunus replies with the integrated verdict in Codex vocabulary (SOUND/CONCERN/GAP/MISUNDERSTANDING). If the persistent pattern is unavailable, I fall back to ephemeral Patrol via `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` per the fallback procedure in the persistent template. No task passes without verification — not one, not ever.

**Capture-at-emission property.** Every code path I run that emits an executor-bound `SendMessage` captures `task_start_sha` at the moment of `SendMessage` emission, where the SHA is `git rev-parse HEAD` at that moment. This property covers the primary task dispatch (this DONE handler) and the fix-soldier re-dispatch (the path triggered when the Tribunus returned GAP and I dispatch a fix). Any future code path I add that produces an executor-bound `SendMessage` must satisfy the same capture rule. I do NOT cache an earlier `task_start_sha` and reuse it for the fix-soldier dispatch — the fix's verification range is bounded by the fix dispatch SHA, not the original task's.
```

- [ ] **Step 3: Edit fix-soldier prose — capture fresh `task_start_sha` on fix-soldier dispatch.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

old_string:

```
**When the Tribunus finds a GAP,** I dispatch a fresh fix soldier with the finding, the original task, and the current file state. The Tribunus re-verifies once after the fix. If the GAP persists, I escalate to the Imperator. CONCERNs I note for the Campaign review, not fix per task.
```

new_string:

```
**When the Tribunus finds a GAP,** I dispatch a fresh fix soldier with the finding, the original task, and the current file state. When the fix-soldier reports DONE, I capture a **fresh** `task_start_sha` (via `git rev-parse HEAD` at the fix-soldier's SendMessage emission — NOT the original task's SHA) and signal the persistent Tribunus with the same SendMessage body schema (`task_id`, fresh `task_start_sha`, fix-soldier `change_set`, fix-soldier `implementation_summary`, computed `sampled` flag — fix-soldier dispatches inherit the original task's `sampled` value). The Tribunus re-verifies the fix as a unit — its diff range is `(fix_task_start_sha, HEAD]` over the fix-soldier's `change_set`, which covers only what the fix-soldier produced after dispatch. Two log entries land for the same `task_id`: the original verification and the fix's re-verification, each carrying its own `task_start_sha`. If the fix re-verifies as GAP, that is iteration 2 of the Codex auto-feed loop; per the cap, I escalate to the Imperator. CONCERNs I note for the Campaign review, not fix per task.

**Fix-soldier crash and zero-commit failure modes.** If the fix-soldier crashes mid-dispatch (LLM error, network failure, harness collision), I retry per the existing crash-recovery semantics in `tribune-persistent.md`; on retry, a fresh `task_start_sha` is captured at the retried fix dispatch, and the crashed dispatch produces no log entry. If the fix-soldier returns DONE with zero commits since dispatch (the soldier read the GAP and decided no change was needed, or staged work without committing), the Tribunus emits `verdict: GAP` with `verdict_summary: "fix-soldier produced no commits — escalate per Codex auto-feed-cap"`, and I escalate.
```

- [ ] **Step 4: Verify `legion/SKILL.md` now references `task_start_sha` capture.**

Run:

```bash
grep -nE 'task_start_sha' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: at least 5 matches (DONE handler primary capture, capture-at-emission property block, fix-soldier prose primary capture, fix-soldier prose diff-range mention, crash-retry mention).

- [ ] **Step 5: Commit.**

```bash
git -C "$HOME/projects/Consilium" add claude/skills/legion/SKILL.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): /legion captures task_start_sha at every executor-bound SendMessage (§4.3)

- DONE handler: capture task_start_sha (git rev-parse HEAD at emission) + change_set; populate them in the SendMessage body alongside task_id, implementation_summary, sampled.
- Capture-at-emission property block: every code path emitting an executor-bound SendMessage captures task_start_sha at emission.
- Fix-soldier dispatch: fresh task_start_sha at fix-soldier SendMessage; fix-verifier diff range (fix_task_start_sha, HEAD] over fix change_set; two log entries per fix-cycle (original + re-verification), each with own task_start_sha.
- Fix-soldier crash + zero-commit failure modes specified."
```

---

## Task 6: §4.4 + §4.2 `/legion` pre-spawn 4-branch ordered routing

> **Confidence: High** — implements [spec §4.4 — Partial-Protocol Routing (GAP-5)](./session-02-b-1-1-spec.md#44-partial-protocol-routing-gap-5) and [spec §4.2 — `plan_id` SHA Mismatch Wire-Up (GAP-1)](./session-02-b-1-1-spec.md#42-plan_id-sha-mismatch-wire-up-gap-1); spec mandates ordered evaluation (single-snapshot read; branches 1-4 in order) with SHA comparison gating branches 3 vs 4; smoke-check fires only on branch 4. The `<case>` placeholder in pseudo-commands is the case folder absolute path the Legatus already resolved at session start; the placeholder is intentional — the prose is doctrine, not literal shell.

**Files:**
- Modify: `claude/skills/legion/SKILL.md` (Pre-spawn check section around line 147)

- [ ] **Step 1: Read `legion/SKILL.md` Pre-spawn check section to confirm anchor content.**

Read: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

Confirm the `old_string` in Step 2 appears verbatim. If drifted, halt.

- [ ] **Step 2: Edit Pre-spawn check — replace halt-on-absent with the 4-branch ordered routing.**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/legion/SKILL.md`

old_string:

```
**Pre-spawn check.** I verify `<case>/tribune-protocol.md` exists at Legion start. If absent, halt — the protocol must come from `/edicts` Tribunus-design dispatch BEFORE the legion marches. Surface the missing-protocol condition to the Imperator and route back to `/edicts`.
```

new_string:

```
**Pre-spawn ordered routing.** At Legion start, I read `<case>/tribune-protocol.md` **once into an in-memory snapshot** (read-into-buffer-once shell pattern: e.g., `proto=$(cat <case>/tribune-protocol.md 2>/dev/null || echo "")` for absence-tolerant capture, or `[ -s <case>/tribune-protocol.md ] && proto=$(cat <case>/tribune-protocol.md)` for explicit non-empty capture). All four branch evaluations below operate on the buffered snapshot — the file path is not re-read after the initial capture. This is the *single-snapshot-per-pre-spawn-evaluation* contract; it protects against the read-then-act race within one `/legion` invocation. Cross-invocation reconciliation (the executor's own re-read at spawn time, or two concurrent `/legion` invocations) is bounded out of scope per spec §3 Non-Goals.

I evaluate the snapshot in this order; the first matching branch determines the route:

**Branch 1 — File absent OR empty OR unparseable OR `tasks: []` (non-actionable).** If `<case>/tribune-protocol.md` is absent, zero-bytes / whitespace-only / has no YAML body, fails to parse as markdown+YAML, OR parses cleanly but has `tasks: []`: route the campaign to mini-checkit fallback per `templates/mini-checkit.md` for the entire legion. Skip the smoke check (no executor will spawn). Skip remaining branches. Note in the campaign report preamble: `Persistence routing: mini-checkit fallback (branch 1 — absent/empty/unparseable/non-actionable)`.

**Branch 2 — Malformed.** If the snapshot parses but fails the well-formed definition (any of: missing top-level required field `schema_version`/`plan_id`/`sampling_mode`/`tasks`; unsupported `schema_version` (currently only `1`); empty-string path or empty-string SHA in `plan_id`; `plan_id` SHA not matching the 40-char hex pattern (case-insensitive; lowercase preferred per git's output convention, uppercase tolerated and normalized on read); any single `tasks` entry missing `task_id` or `lanes_triggered`; any `lanes_triggered` value that is not a list — YAML null, scalar, or non-list value — makes the entire protocol malformed per the all-or-nothing partition): route the campaign to mini-checkit fallback per `templates/mini-checkit.md` for the entire legion. Skip the smoke check. Skip remaining branches. Note in the campaign report preamble: `Persistence routing: mini-checkit fallback (branch 2 — malformed: <named failure>)`.

**Branch 3 — Well-formed, `plan_id` SHA mismatch (or path-resolution failure).** Read the `plan_id` field from the snapshot (case-relative path + recorded blob SHA). Resolve the recorded path against the current HEAD: compute the current blob SHA via `git rev-parse HEAD:<recorded-path>`. If the resolution fails for any reason — path resolves to nothing (deletion, rename, moved out of the case folder); HEAD is unborn (fresh worktree before any commit); the resolution itself errors (corrupt object database, IO error, unreadable git state) — treat as SHA mismatch and proceed to refusal with the failure class named in the diagnostic so a corrupt-worktree case can be distinguished from a deletion case during recovery. If the resolution succeeds and the recorded SHA does not equal the current SHA: refuse to spawn the persistent executor; surface the diff (or pointer to it) and the path-resolution result inline in the `/legion` session output AND append a `decisions.md` entry of type `verdict` per CONVENTIONS schema (the `**Plan SHA:**` field of that entry carries the *current* HEAD blob SHA, not the recorded one). The Imperator decides whether to re-dispatch `/edicts` (regenerate protocol against the new plan) or override. Do **NOT** fall back to mini-checkit — a stale protocol is a problem to surface, not a missing capability to substitute. Skip the smoke check. Skip branch 4.

**Branch 4 — Well-formed, SHA match.** The protocol is well-formed and `plan_id`'s recorded blob SHA equals the current `git rev-parse HEAD:<recorded-path>`. Run the **pre-spawn smoke check** per `templates/tribune-persistent.md` (`name: tribune-smoke` ephemeral dispatch + immediate SendMessage round-trip). If the smoke check passes, spawn the persistent executor `tribune-w1`. If the smoke check fails, fall back to ephemeral Patrol per `templates/mini-checkit.md` for the entire legion (the smoke check protects against substrate degradation; failure on branch 4 means the load-bearing primitive is not working and persistence cannot be trusted, regardless of protocol well-formedness). Note in the campaign report preamble: `Persistence routing: persistent executor (branch 4 — well-formed + SHA match + smoke OK)` or `Persistence routing: mini-checkit fallback (branch 4 — smoke failed)`.

**Smoke-check sequencing.** The smoke check runs **only on branch 4** — the path that actually intends to spawn the persistent executor. On branches 1, 2, and 3 the smoke check is skipped: branches 1 and 2 route to mini-checkit fallback (no executor will spawn — smoke would dispatch an agent whose result is unused); branch 3 refuses spawn entirely. Bounding the smoke to branch 4 keeps its purpose tight (substrate-validation-immediately-before-spawn) and removes the lifecycle ambiguity CONCERN-Provocator-7 named in B-1's Campaign Review.

**Crash-recovery respawn.** When the persistent executor crashes mid-window and I respawn it (per `tribune-persistent.md` Crash Recovery section), the respawn re-reads the protocol against the current snapshot but does **not** re-fire the §4.4 ordered routing above. The respawn presumes the protocol that was valid at the original branch-4 spawn is still valid — if `plan_id` SHA has drifted between original spawn and respawn, the discrepancy is detected at the executor's own protocol-load step (which reads `plan_id` and may halt with a verdict pointing at drift). Detection is the executor's responsibility post-spawn; pre-spawn routing belongs to me, the Legatus.
```

- [ ] **Step 3: Verify `legion/SKILL.md` now contains the 4-branch routing.**

Run:

```bash
grep -nE 'Branch 1|Branch 2|Branch 3|Branch 4|Pre-spawn ordered routing' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: at least 5 matches (one per branch heading + the section heading).

- [ ] **Step 4: Verify the prior halt-on-absent prose is gone.**

Run:

```bash
grep -nE 'If absent, halt — the protocol must come from' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: **no matches**.

- [ ] **Step 5: Verify SHA comparison via `git rev-parse HEAD:` is referenced in the routing.**

Run:

```bash
grep -nE 'git rev-parse HEAD:' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: at least one match in the new branch-3 logic.

- [ ] **Step 6: Verify smoke-check is gated to branch 4.**

Run:

```bash
grep -nE 'smoke check runs.*only on branch 4|Smoke-check sequencing' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: at least one match.

- [ ] **Step 7: Commit.**

```bash
git -C "$HOME/projects/Consilium" add claude/skills/legion/SKILL.md
git -C "$HOME/projects/Consilium" commit -m "feat(b-1.1): /legion pre-spawn 4-branch ordered routing with SHA comparison (§4.4 + §4.2)

Replaces halt-on-absent with the 4-branch ordered routing:
- Branch 1: absent/empty/unparseable/tasks:[] → mini-checkit fallback (entire legion).
- Branch 2: malformed (well-formed definition: schema_version=1, plan_id non-empty path + 40-hex SHA, lanes_triggered list-typed; all-or-nothing partition) → mini-checkit fallback.
- Branch 3: well-formed, plan_id SHA mismatch (or path-resolution failure for any reason — deletion, rename, unborn HEAD, corrupt git state, IO error) → refuse spawn + decisions.md verdict entry + Imperator gate. Do NOT fall back.
- Branch 4: well-formed, SHA match → smoke check fires; on smoke OK spawn persistent executor; on smoke fail fall back to mini-checkit.

Single-snapshot semantics: read protocol once into in-memory buffer, all four branch evaluations operate on the buffer.

Smoke-check sequencing: smoke runs only on branch 4 (skipped on 1, 2, 3).

Crash-recovery respawn does not re-fire pre-spawn routing — drift detection on respawn is the executor's responsibility."
```

---

## Wrap-up checks

After Task 6 commits, the executing agent (Legatus or Soldier completing the last task) should run the following sanity checks and surface results to the Imperator:

- [ ] **Final-1: All four wire-ups land cleanly.**

Run:

```bash
git -C "$HOME/projects/Consilium" log --oneline -10 -- \
  claude/skills/references/verification/templates/tribune-persistent.md \
  claude/skills/references/verification/templates/tribune-design.md \
  claude/skills/references/verification/tribune-log-schema.md \
  claude/skills/references/verification/tribune-protocol-schema.md \
  claude/skills/legion/SKILL.md
```

Expected: 6 new commits (one per task) on top of B-1's history. Each commit message names the spec section it implements.

- [ ] **Final-2: No `PASS`/`FAIL` token survives in the persistent verification flow surfaces.**

Run:

```bash
grep -nE '\bPASS\b|\bFAIL\b' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md" \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md" \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: **no matches**.

- [ ] **Final-3: `task_start_sha` is referenced across the wire.**

Run:

```bash
grep -lE 'task_start_sha' \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md" \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md" \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: all three files listed.

- [ ] **Final-4: 4-branch routing in place.**

Run:

```bash
grep -cE '^\*\*Branch [1-4]' \
  "$HOME/projects/Consilium/claude/skills/legion/SKILL.md"
```

Expected: `4`.

- [ ] **Final-5: blob SHA pinned in schema and design template.**

Run:

```bash
grep -lE 'blob SHA|git rev-parse HEAD:' \
  "$HOME/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md" \
  "$HOME/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md"
```

Expected: both files listed.

If any check fails, surface to the Imperator before the Campaign Review — this is the readiness baseline the spec promises in §7 Observable Outcomes.

---

## Notes for the Legatus

**Implementation order matters.** Tasks must run in numeric order (1 → 6). Task 5's `old_string` in Step 2 includes the iteration produced by Task 1 Step 12 (Codex vocabulary in the parenthetical) — running Task 5 before Task 1 commits will fail to match. Same coupling holds across other tasks where one Edit's `old_string` depends on a prior Edit having landed. Sequential execution within `/legion` (one Soldier per task, Tribunus verification before next dispatch) naturally enforces this. If running via `/march`, the Legatus must execute tasks strictly in order.

**Atomic-migration discipline (Task 1).** Per spec §4.1, Task 1's vocabulary migration must land as a single commit covering all five surfaces. Do NOT split Task 1's edits across multiple commits, and do NOT dispatch a `/legion` test campaign between Task 1's start and end. This task is non-decomposable.

**No /legion dispatched against this case folder until all tasks complete.** This plan modifies `/legion` itself. Running a test campaign of `/legion` against this case while edits are mid-flight would consume a half-migrated `/legion` against a half-migrated protocol surface. The Campaign Review at the end of the legion (Censor + Praetor + Provocator) is the verification of the work — no intermediate `/legion` dispatch is needed or warranted.

**No `/edicts` semantic changes.** Per spec §3 Non-Goals: `/edicts/SKILL.md:445` prose ("legion can march on partial-or-empty `tribune-protocol.md`") becomes factually true at the runtime mechanism level for the first time after this plan lands, but the prose itself stays as-is. Do NOT edit `/edicts/SKILL.md`. If the Soldier or Legatus is tempted to "fix" the prose, halt — that is scope creep.

**No code changes.** Every edit in this plan is markdown contract revision. There is no application code to test; no test suite to run. Verification is grep-based post-conditions (Steps 13/14 of Task 1; Steps 7-8 of Task 4; Steps 4-5 of Task 5; Steps 3-6 of Task 6) plus the eventual Campaign Review.

**Soldier history-rewriting discipline (presumed by §4.3).** The plan presumes Soldiers do not rebase, amend, or reset commits between task dispatch and verification — `task_start_sha` requires commits to accumulate forward. This discipline is not enforced by this plan; it is a convention the implementer-prompt template carries (per spec §3 Non-Goals: "Soldier history-rewriting discipline" is named as out-of-scope for B-1.1's wire-up work). If a Soldier executing this plan rewrites history mid-task, halt and escalate.
