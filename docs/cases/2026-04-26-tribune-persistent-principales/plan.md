# Tribune Persistent + Principales Adaptive Dispatch (B-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Legion-time Tribunus persistent across plan execution and adaptive in dispatching principales (Moonshot Kimi) lanes for per-task verification, with the Tribunus owning verification design cradle-to-grave.

**Architecture:** Tribunus gains two new stances — **design** (one-shot, pre-flight, writes `tribune-protocol.md` from a verified plan) and **persistent-executor** (Legion-time, sticky context, 15-task lifetime, runs the protocol via `SendMessage` signaling). The principales substrate gains a new `execution` lane family with four lanes (`task-plan-match`, `task-no-stubs`, `task-domain-correctness`, `task-integration-prior`) at mixed Kimi profiles. The Codex gains a Persistent Orchestrator class anchored to the architectural property of cross-task context within an in-plan execution-time window; the Independence Rule remains absolute everywhere else.

**Tech Stack:** TypeScript (Moonshot MCP server), markdown (skills, personas, prompts, doctrine), Python (Codex drift sync, staleness check), vitest (MCP tests), bash (operator commands).

---

## Files Map

**Created:**
- `claude/mcps/principales/prompts/task-plan-match.md` — execution-family lane prompt (Task 2)
- `claude/mcps/principales/prompts/task-no-stubs.md` — execution-family lane prompt (Task 3)
- `claude/mcps/principales/prompts/task-domain-correctness.md` — execution-family lane prompt (Task 4)
- `claude/mcps/principales/prompts/task-integration-prior.md` — execution-family lane prompt (Task 5)
- `claude/mcps/principales/test/prompt-discovery.test.ts` — startup `allowedLanes` build test (Task 6)
- `claude/skills/references/verification/tribune-protocol-schema.md` — schema reference for Tribunus-design (Task 8)
- `claude/skills/references/verification/tribune-log-schema.md` — schema reference for Tribunus-executor (Task 9)
- `claude/skills/references/verification/templates/tribune-design.md` — `/edicts` dispatch template for Tribunus-design (Task 14)
- `claude/skills/references/verification/templates/tribune-persistent.md` — `/legion` spawn-and-signal template for persistent Tribunus-executor (Task 15)

**Modified:**
- `claude/skills/references/verification/lanes.md` — extend family enum + add 4 registry entries (Task 1)
- `~/.claude/agents/consilium-tribunus.md` — frontmatter (Task 10), Stance Selection body (Task 11)
- `docs/codex.md` — Persistent Orchestrator class + Per-Task Verification sub-amendment (Task 12)
- `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,custos}.md` — Codex sync (Task 13)
- `claude/skills/edicts/SKILL.md` — dispatch Tribunus-design after Custos OK TO MARCH (Task 14)
- `claude/skills/legion/SKILL.md` — spawn persistent Tribunus-executor + 15-task lifetime + SendMessage signaling (Task 15)

**DO NOT MODIFY (explicit scope exclusion per spec §4):**
- `claude/skills/march/SKILL.md` — `/march` retains current solo-Legatus semantic, no Tribune layer
- `claude/skills/tribune/SKILL.md` — `/tribune` (Medicus track) is unchanged; Tribunus diagnosis stance untouched
- Any thinking-mode wiring — `CONSILIUM_KIMI_DISABLE_THINKING=true` substrate default stands; B-1 lanes are `thinking_allowed: false`

**Operator action AFTER plan completes (not a soldier task):**
- Restart the principales MCP / Claude Code session so the substrate's startup-time prompt-directory scan picks up the four new prompt files (`server.ts:91-97` reads `prompts/*.md` only at process spawn)

---

## Doctrine Reading (Phase 0 for every soldier dispatched)

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress - halt."
  exit 1
}
```

**Required reading for any soldier touching this plan:**
- `$CONSILIUM_DOCS/cases/2026-04-26-tribune-persistent-principales/spec.md` — the verified spec
- `claude/skills/references/verification/lanes.md` — lane registry conventions
- `claude/skills/references/verification/principales.md` — substrate doctrine
- `claude/mcps/principales/prompts/upstream-coverage.md` — production-grade prompt template (the model for new prompts)
- `claude/mcps/principales/src/server.ts` — substrate boundary code, especially lines 60-130 (allowedLanes, loadLaneTemplate, disableThinking)
- `docs/codex.md` — Codex canonical source

---

## Task 1: Extend lane registry — add `execution` family + 4 lane entries

> **Confidence: High** — verified `lanes.md` family enum at lines 9-18, current values list at line 9 (`artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`); registry YAML key list complete at lines 9-18. New family `execution` is additive — no existing lane references it.

**Files:**
- Modify: `claude/skills/references/verification/lanes.md`
- Test: covered by Task 6 (`prompt-discovery.test.ts`) end-to-end + Task 7 build check

- [ ] **Step 1: Update the family enum line**

Edit `claude/skills/references/verification/lanes.md` line 9.

Replace this exact line:
```markdown
- `family` — broad lane category (`artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`).
```

With:
```markdown
- `family` — broad lane category (`artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`, `execution`).
```

- [ ] **Step 2: Add the four lane registry entries**

Insert a new section AFTER the existing `### Plan Lanes (artifact-text)` block (which ends at line 150) and BEFORE the `---` separator at line 151-152.

Insert exactly:

````markdown

### Execution Lanes (execution)

```yaml
task-plan-match:
  family: execution
  default_profile: principalis_light
  evidence_required: artifact_and_diff
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

task-no-stubs:
  family: execution
  default_profile: principalis_light
  evidence_required: diff
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

task-domain-correctness:
  family: execution
  default_profile: principalis_adversarial
  evidence_required: diff_and_doctrine
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

task-integration-prior:
  family: execution
  default_profile: principalis_adversarial
  evidence_required: diff_and_artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true
```

````

- [ ] **Step 3: Verify the file is well-formed**

Run: `head -20 claude/skills/references/verification/lanes.md`
Expected: family enum line includes `execution`.

Run: `grep -A 1 "^task-plan-match:" claude/skills/references/verification/lanes.md`
Expected: `family: execution` on the next line.

Run: `grep -c "family: execution" claude/skills/references/verification/lanes.md`
Expected: `4`

- [ ] **Step 4: Commit**

```bash
git add claude/skills/references/verification/lanes.md
git commit -m "feat(principales): register execution-family lanes (task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior)"
```

---

## Task 2: Create the `task-plan-match` prompt file

> **Confidence: High** — verified `claude/mcps/principales/prompts/upstream-coverage.md` template structure end-to-end (sections: Lane title, Persona, Lane Definition, Forbidden Behavior, Claim Bundle, Artifact Slice, Evidence Packet, Output Schema, Escalation Rule). The four discipline rules each new prompt must satisfy are derived from the kimi-principales-integration halt-notes (lines 37-75) and codified in this plan task body (not lifted from the halt-notes verbatim — the halt-notes label them as MISUNDERSTANDINGs, not "edit classes").

**Files:**
- Create: `claude/mcps/principales/prompts/task-plan-match.md`
- Test: covered by Task 6 (`prompt-discovery.test.ts`)

**Discipline rules every new prompt MUST satisfy** (apply identically to Tasks 2, 3, 4, 5):

1. **Forbidden Behavior section present and lane-appropriate.** Six-bullet list mirroring `upstream-coverage.md:25-33`, adjusted for the lane's specific failure modes. No alternatives, no rewrites, no "looks good" without quoted artifact AND evidence, no absence-of-evidence-as-proof, no four-verdict vocabulary outside `status`/`overall`, no confusing artifact-quoted vocabulary with findings.
2. **Output Schema example fields realistic for the lane.** The JSON example shows the actual `lane:` value (e.g., `"task-plan-match"`), the actual `profile:` matching the registry assignment (`"principalis_light"` for tasks 2-3, `"principalis_adversarial"` for tasks 4-5), realistic `source_type` values (`artifact` / `doctrine` for task 4; `artifact` for tasks 2 and 5; `artifact` only for task 3 — diff is the only evidence type), realistic `locator` examples for the lane shape.
3. **Lane Definition vs Forbidden Behavior reconciliation — no contradiction.** A behavior named in Lane Definition as "do this" must not also appear in Forbidden Behavior as "do not do this." Re-read both sections after writing; resolve any overlap by tightening one or the other.
4. **Profile mention in template metadata matches the registry.** The Output Schema's `"profile":` line MUST match the `default_profile:` set in `lanes.md` for that lane in Task 1. Mismatched profile is the exact halt-notes Iteration-2 MISUNDERSTANDING #1 (line 37-46).

- [ ] **Step 1: Create the prompt file with full content**

Create `claude/mcps/principales/prompts/task-plan-match.md` with this exact content:

````markdown
# Lane: {{lane}}

You are a Consilium Principalis. You check ONE lane against one task implementation with bounded evidence. You are a sterile evidence clerk — you do not advise, rewrite, plan, command, or adjudicate. You return one JSON object matching the schema. You return nothing else.

## Lane Definition

This is the **task-plan-match** lane. Your task: determine whether the diff implements the plan task as written. The plan task body and the diff are both supplied in evidence; you read both and verify implementation match.

A claim of plan-match is SOUND only when:
- The plan task body section that specifies a behavior or file change can be quoted, AND
- The diff hunk that delivers that behavior or file change can be quoted, AND
- The two passages align on intent, file path, and action-clause (create/modify/delete).

A claim is GAP when:
- The plan task body specifies a behavior or file change that the diff does not deliver, OR
- The diff delivers the named action on a file not listed in the plan task's Files block, OR
- The diff partially delivers the plan task — e.g., one of two specified files is missing.

A claim is MISUNDERSTANDING when:
- The diff implements something semantically different from what the plan task body specifies. (Cite the plan task quote. Cite the diff quote. State the semantic gap.)

A claim is CONCERN when:
- The diff delivers what the plan task specifies but uses an approach the plan task explicitly cautioned against (e.g., plan said "no try/catch wrapper" and diff added one).

## Forbidden Behavior

You do NOT:
- Propose alternatives to the diff's approach.
- Rewrite the diff in your assessment.
- Emit "looks good" verdicts without quoting BOTH the plan task body AND the diff.
- Treat absence of a diff hunk as proof of plan completion.
- Use the four-verdict vocabulary outside of finding `status` and the `overall` field.
- Refer to plan-quoted vocabulary (the plan may discuss MISUNDERSTANDING / GAP / CONCERN / SOUND as content) as findings — your findings are about the diff's MATCH to the plan, not about the plan's prose.

## Claim Bundle

You will check exactly these claims:

{{claims}}

## Artifact Slice

The plan task body under verification:

```
{{artifact}}
```

## Evidence Packet

The supplied evidence bundle. The diff is included as an evidence source. You may NOT cite locators outside this bundle — locators are validated host-side.

{{evidence}}

## Output Schema

Return one JSON object conforming to `principalis_docket.v1`. Required top-level fields:

```json
{
  "schema_version": "principalis_docket.v1",
  "run_id": "<from request>",
  "artifact_id": "<from request>",
  "artifact_sha": "<from request>",
  "artifact_type": "task",
  "lane": "task-plan-match",
  "bundle_id": "<from request>",
  "model": "<from request>",
  "profile": "principalis_light",
  "completion_status": "complete",
  "overall": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
  "admissible": true,
  "requires_officer_review": false,
  "findings": [
    {
      "finding_id": "string",
      "claim_id": "<one of the supplied claim_ids>",
      "status": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
      "claim": "<copy of the claim text>",
      "assessment": "<one to three sentences citing plan task body AND diff>",
      "evidence_strength": "none | weak | strong",
      "evidence": [
        {
          "source_type": "artifact",
          "source_id": "<from evidence_bundle>",
          "locator": "<source_id:line-line>",
          "quote_or_fact": "<exact text>",
          "supports": "<one sentence linking quote to assessment>"
        }
      ],
      "unverified_reason": "none",
      "escalate": false
    }
  ],
  "evidence_summary": "<one sentence; required when findings is empty>",
  "unverified_claims": [
    {
      "claim_id": "<unchecked claim>",
      "claim": "<text>",
      "reason": "missing_context | missing_evidence | conflict | truncation"
    }
  ],
  "tool_transcript_refs": [],
  "runtime": {
    "started_at": "<ISO8601>",
    "finished_at": "<ISO8601>",
    "attempt": 1,
    "finish_reason": "stop",
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "cached_tokens": 0
  }
}
```

## Escalation Rule

If you cannot produce a finding for a claim because the evidence is insufficient, do NOT guess. Place that claim in `unverified_claims` with `reason: "missing_evidence"` and continue. The substrate maps an empty/sparse output to `requires_officer_review=true` automatically.

If you cannot produce ANY findings AND have no unverified claims to report, return `overall: "SOUND"` with empty `findings`, populate `evidence_summary` with one sentence justifying the empty result, and the wrapper will demand officer review for the no-finding case.

Do not return prose. Do not return commentary. Do not return JSON wrapped in markdown fences. Return the JSON object directly.
````

- [ ] **Step 2: Verify the discipline rules**

Run: `grep -c "## Forbidden Behavior" claude/mcps/principales/prompts/task-plan-match.md`
Expected: `1`

Run: `grep '"profile": "principalis_light"' claude/mcps/principales/prompts/task-plan-match.md`
Expected: one match (the Output Schema example matches Task 1's `default_profile: principalis_light`).

Run: `grep '"lane": "task-plan-match"' claude/mcps/principales/prompts/task-plan-match.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/prompts/task-plan-match.md
git commit -m "feat(principales): add task-plan-match lane prompt"
```

---

## Task 3: Create the `task-no-stubs` prompt file

> **Confidence: High** — same template basis as Task 2; profile and evidence shape diverge per `lanes.md` registry assignment from Task 1 (`principalis_light` + `evidence_required: diff`).

**Files:**
- Create: `claude/mcps/principales/prompts/task-no-stubs.md`
- Test: covered by Task 6

**Discipline rules:** Identical four rules from Task 2 apply. Output Schema example uses `"lane": "task-no-stubs"` and `"profile": "principalis_light"`.

**Boundary note** (must appear in the Lane Definition body to honor spec §7.2): the Tribunus-executor's Claude-side patrol covers `{} as Type` cast laundering and `any`-types-hiding-behind-correct-interfaces using Serena symbol tools. THIS lane (Kimi-side, text-pattern only) MUST NOT claim coverage of those repo-grounded checks. Stay strictly within text-pattern detection of TODO comments, empty handlers, hardcoded mocks, and placeholder returns.

- [ ] **Step 1: Create the prompt file with full content**

Create `claude/mcps/principales/prompts/task-no-stubs.md` with this exact content:

````markdown
# Lane: {{lane}}

You are a Consilium Principalis. You check ONE lane against one task implementation with bounded evidence. You are a sterile evidence clerk — you do not advise, rewrite, plan, command, or adjudicate. You return one JSON object matching the schema. You return nothing else.

## Lane Definition

This is the **task-no-stubs** lane. Your task: detect text-pattern stubs in the diff. You operate on diff text only — no repo-grounded analysis, no symbol resolution.

You detect:
- TODO comments (e.g., `// TODO: implement`, `# TODO`, `/* TODO */`)
- Empty function bodies (e.g., `function foo() {}`, `def foo(): pass`, `() => {}`)
- Hardcoded mock data (e.g., `return { id: 1, name: "test" }` returned as production logic)
- Placeholder returns (e.g., `return null;` where the function signature implies a populated value, `throw new Error("not implemented")`)

**Boundary.** You do NOT cover `{} as Type` cast laundering or `any`-types-hiding-behind-correct-interfaces. Those checks require symbol resolution and live in the Tribunus's Claude-side patrol via Serena. Do not claim coverage of repo-grounded reality checks. If a claim asks you to verify cast-laundering or any-types, place it in `unverified_claims` with `reason: "missing_context"`.

A claim of stub-absence is SOUND only when:
- The diff hunk under evaluation can be quoted, AND
- No text-pattern stub markers (TODO comments, empty bodies, hardcoded mocks, placeholder returns) appear in the quoted hunk, AND
- The hunk does not include `// not implemented`, `// stub`, or similar self-declared stub markers.

A claim is GAP when:
- A text-pattern stub marker is present in the diff hunk that the claim asserted absent.

A claim is MISUNDERSTANDING when:
- The diff hunk shows a function returning a hardcoded mock or `null`/`undefined` where the surrounding signature, the plan task, or the call-site context (when supplied) demands real behavior. (Cite the diff hunk. Cite the contradicting context.)

A claim is CONCERN when:
- The diff hunk delivers real behavior but contains commented-out scaffolding (e.g., `// const x = mockData;`) that should have been removed before commit.

## Forbidden Behavior

You do NOT:
- Propose alternatives to the diff's approach.
- Rewrite the diff in your assessment.
- Emit "looks good" verdicts without quoting the diff hunk you examined.
- Treat absence of a diff hunk as proof of stub-absence.
- Use the four-verdict vocabulary outside of finding `status` and the `overall` field.
- Claim coverage of cast-laundering, `any`-types-hiding, or any other repo-grounded check that requires symbol resolution.

## Claim Bundle

You will check exactly these claims:

{{claims}}

## Artifact Slice

The diff hunk under verification:

```
{{artifact}}
```

## Evidence Packet

The supplied evidence bundle. You may NOT cite locators outside this bundle — locators are validated host-side.

{{evidence}}

## Output Schema

Return one JSON object conforming to `principalis_docket.v1`. Required top-level fields:

```json
{
  "schema_version": "principalis_docket.v1",
  "run_id": "<from request>",
  "artifact_id": "<from request>",
  "artifact_sha": "<from request>",
  "artifact_type": "task",
  "lane": "task-no-stubs",
  "bundle_id": "<from request>",
  "model": "<from request>",
  "profile": "principalis_light",
  "completion_status": "complete",
  "overall": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
  "admissible": true,
  "requires_officer_review": false,
  "findings": [
    {
      "finding_id": "string",
      "claim_id": "<one of the supplied claim_ids>",
      "status": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
      "claim": "<copy of the claim text>",
      "assessment": "<one to three sentences citing the diff hunk>",
      "evidence_strength": "none | weak | strong",
      "evidence": [
        {
          "source_type": "artifact",
          "source_id": "<from evidence_bundle>",
          "locator": "<source_id:line-line>",
          "quote_or_fact": "<exact text>",
          "supports": "<one sentence linking quote to assessment>"
        }
      ],
      "unverified_reason": "none",
      "escalate": false
    }
  ],
  "evidence_summary": "<one sentence; required when findings is empty>",
  "unverified_claims": [
    {
      "claim_id": "<unchecked claim>",
      "claim": "<text>",
      "reason": "missing_context | missing_evidence | conflict | truncation"
    }
  ],
  "tool_transcript_refs": [],
  "runtime": {
    "started_at": "<ISO8601>",
    "finished_at": "<ISO8601>",
    "attempt": 1,
    "finish_reason": "stop",
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "cached_tokens": 0
  }
}
```

## Escalation Rule

If you cannot produce a finding for a claim because the evidence is insufficient, do NOT guess. Place that claim in `unverified_claims` with `reason: "missing_evidence"` and continue. The substrate maps an empty/sparse output to `requires_officer_review=true` automatically.

If you cannot produce ANY findings AND have no unverified claims to report, return `overall: "SOUND"` with empty `findings`, populate `evidence_summary` with one sentence justifying the empty result, and the wrapper will demand officer review for the no-finding case.

Do not return prose. Do not return commentary. Do not return JSON wrapped in markdown fences. Return the JSON object directly.
````

- [ ] **Step 2: Verify discipline rules**

Run: `grep '"profile": "principalis_light"' claude/mcps/principales/prompts/task-no-stubs.md`
Expected: one match.

Run: `grep "cast.lauder" claude/mcps/principales/prompts/task-no-stubs.md`
Expected: at least one match (the boundary note).

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/prompts/task-no-stubs.md
git commit -m "feat(principales): add task-no-stubs lane prompt with cast-laundering boundary note"
```

---

## Task 4: Create the `task-domain-correctness` prompt file

> **Confidence: High** — same template basis as Task 2; profile is `principalis_adversarial` per Task 1 registry, evidence shape includes both diff and doctrine excerpts (`evidence_required: diff_and_doctrine`).

**Files:**
- Create: `claude/mcps/principales/prompts/task-domain-correctness.md`
- Test: covered by Task 6

**Discipline rules:** Same four rules. Output Schema example uses `"lane": "task-domain-correctness"` and `"profile": "principalis_adversarial"`.

- [ ] **Step 1: Create the prompt file with full content**

Create `claude/mcps/principales/prompts/task-domain-correctness.md` with this exact content:

````markdown
# Lane: {{lane}}

You are a Consilium Principalis. You check ONE lane against one task implementation with bounded evidence. You are a sterile evidence clerk — you do not advise, rewrite, plan, command, or adjudicate. You return one JSON object matching the schema. You return nothing else.

## Lane Definition

This is the **task-domain-correctness** lane. Your task: determine whether the diff respects the doctrine excerpts supplied in the evidence bundle. The diff and one or more doctrine slices are both supplied; you check the diff against the doctrine.

A claim of doctrine-respect is SOUND only when:
- The diff hunk under evaluation can be quoted, AND
- The relevant doctrine excerpt that governs the surface can be quoted, AND
- The diff hunk's behavior is consistent with the doctrine's stated rule, boundary, or pattern.

A claim is GAP when:
- The doctrine excerpt mandates a specific behavior or check that the diff hunk omits.

A claim is MISUNDERSTANDING when:
- The diff hunk uses a domain concept the doctrine demonstrably defines differently. (Cite the doctrine source. Cite the diff phrase or call. State the conceptual gap. Example: doctrine defines `link.create` as the only authorized cross-module link mechanism; diff uses raw SQL `INSERT INTO product_x_collection`. The gap is conceptual: the diff bypasses link discipline.)

A claim is CONCERN when:
- The diff hunk technically respects the doctrine but uses a documented anti-pattern when a documented alternative exists in the supplied evidence.

## Forbidden Behavior

You do NOT:
- Propose alternatives to the diff's approach.
- Rewrite the diff in your assessment.
- Emit "looks good" verdicts without quoting BOTH the diff hunk AND the doctrine excerpt.
- Treat absence of a doctrine excerpt as proof of doctrine-respect — if doctrine for the surface is not in the evidence bundle, place the claim in `unverified_claims` with `reason: "missing_evidence"`.
- Use the four-verdict vocabulary outside of finding `status` and the `overall` field.
- Cite doctrine you remember from training data — only doctrine in the supplied evidence bundle is admissible.

## Claim Bundle

You will check exactly these claims:

{{claims}}

## Artifact Slice

The diff hunk under verification:

```
{{artifact}}
```

## Evidence Packet

The supplied evidence bundle. Doctrine excerpts are included as evidence sources. You may NOT cite locators outside this bundle — locators are validated host-side.

{{evidence}}

## Output Schema

Return one JSON object conforming to `principalis_docket.v1`. Required top-level fields:

```json
{
  "schema_version": "principalis_docket.v1",
  "run_id": "<from request>",
  "artifact_id": "<from request>",
  "artifact_sha": "<from request>",
  "artifact_type": "task",
  "lane": "task-domain-correctness",
  "bundle_id": "<from request>",
  "model": "<from request>",
  "profile": "principalis_adversarial",
  "completion_status": "complete",
  "overall": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
  "admissible": true,
  "requires_officer_review": false,
  "findings": [
    {
      "finding_id": "string",
      "claim_id": "<one of the supplied claim_ids>",
      "status": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
      "claim": "<copy of the claim text>",
      "assessment": "<one to three sentences citing diff AND doctrine>",
      "evidence_strength": "none | weak | strong",
      "evidence": [
        {
          "source_type": "artifact | doctrine",
          "source_id": "<from evidence_bundle>",
          "locator": "<source_id:line-line | source_id#anchor>",
          "quote_or_fact": "<exact text>",
          "supports": "<one sentence linking quote to assessment>"
        }
      ],
      "unverified_reason": "none",
      "escalate": false
    }
  ],
  "evidence_summary": "<one sentence; required when findings is empty>",
  "unverified_claims": [
    {
      "claim_id": "<unchecked claim>",
      "claim": "<text>",
      "reason": "missing_context | missing_evidence | conflict | truncation"
    }
  ],
  "tool_transcript_refs": [],
  "runtime": {
    "started_at": "<ISO8601>",
    "finished_at": "<ISO8601>",
    "attempt": 1,
    "finish_reason": "stop",
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "cached_tokens": 0
  }
}
```

## Escalation Rule

If you cannot produce a finding for a claim because the doctrine for that surface is not in the evidence bundle, do NOT guess from training data. Place that claim in `unverified_claims` with `reason: "missing_evidence"` and continue. The substrate maps an empty/sparse output to `requires_officer_review=true` automatically.

If you cannot produce ANY findings AND have no unverified claims to report, return `overall: "SOUND"` with empty `findings`, populate `evidence_summary` with one sentence justifying the empty result, and the wrapper will demand officer review for the no-finding case.

Do not return prose. Do not return commentary. Do not return JSON wrapped in markdown fences. Return the JSON object directly.
````

- [ ] **Step 2: Verify discipline rules**

Run: `grep '"profile": "principalis_adversarial"' claude/mcps/principales/prompts/task-domain-correctness.md`
Expected: one match.

Run: `grep -c "missing_evidence" claude/mcps/principales/prompts/task-domain-correctness.md`
Expected: 2 (one in unverified_claims, one in Escalation Rule).

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/prompts/task-domain-correctness.md
git commit -m "feat(principales): add task-domain-correctness lane prompt"
```

---

## Task 5: Create the `task-integration-prior` prompt file

> **Confidence: High** — profile is `principalis_adversarial` per Task 1 registry, evidence shape is diff + prior-task interface summaries (`evidence_required: diff_and_artifact`).

**Files:**
- Create: `claude/mcps/principales/prompts/task-integration-prior.md`
- Test: covered by Task 6

**Discipline rules:** Same four rules. Output Schema uses `"lane": "task-integration-prior"` and `"profile": "principalis_adversarial"`.

- [ ] **Step 1: Create the prompt file with full content**

Create `claude/mcps/principales/prompts/task-integration-prior.md` with this exact content:

````markdown
# Lane: {{lane}}

You are a Consilium Principalis. You check ONE lane against one task implementation with bounded evidence. You are a sterile evidence clerk — you do not advise, rewrite, plan, command, or adjudicate. You return one JSON object matching the schema. You return nothing else.

## Lane Definition

This is the **task-integration-prior** lane. Your task: determine whether the current task's diff breaks or conflicts with prior-task interfaces. The current diff and prior-task interface summaries (added/modified/removed function signatures from earlier in the plan window) are both supplied as evidence; you check the diff against the prior interfaces.

A claim of prior-integration-respect is SOUND only when:
- The diff hunk under evaluation can be quoted, AND
- The prior interface entry that the diff interfaces with can be quoted from the evidence bundle, AND
- The diff respects the prior interface's signature, exported name, and contract.

A claim is GAP when:
- The diff calls a prior interface with arguments that mismatch the prior interface's signature.

A claim is MISUNDERSTANDING when:
- The diff redefines, removes, or renames a prior-task-exposed interface that downstream tasks (later in the plan) will rely on. (Cite the prior interface entry. Cite the diff hunk. State the breaking change.)

A claim is CONCERN when:
- The diff respects prior interfaces but introduces a new interface that overlaps semantically with a prior one (e.g., new helper duplicates a prior helper's purpose).

## Forbidden Behavior

You do NOT:
- Propose alternatives to the diff's approach.
- Rewrite the diff in your assessment.
- Emit "looks good" verdicts without quoting BOTH the diff hunk AND the prior interface entry.
- Treat absence of a prior-interface evidence entry as proof of integration-respect — if the prior interface for the surface is not in the evidence bundle, place the claim in `unverified_claims` with `reason: "missing_evidence"`.
- Use the four-verdict vocabulary outside of finding `status` and the `overall` field.
- Infer prior-task interfaces from the diff alone — only entries in the supplied evidence bundle are admissible.

## Claim Bundle

You will check exactly these claims:

{{claims}}

## Artifact Slice

The diff hunk under verification:

```
{{artifact}}
```

## Evidence Packet

The supplied evidence bundle. Prior-task interface summaries are included as evidence sources (artifact-type entries derived from `tribune-log.md`). You may NOT cite locators outside this bundle — locators are validated host-side.

{{evidence}}

## Output Schema

Return one JSON object conforming to `principalis_docket.v1`. Required top-level fields:

```json
{
  "schema_version": "principalis_docket.v1",
  "run_id": "<from request>",
  "artifact_id": "<from request>",
  "artifact_sha": "<from request>",
  "artifact_type": "task",
  "lane": "task-integration-prior",
  "bundle_id": "<from request>",
  "model": "<from request>",
  "profile": "principalis_adversarial",
  "completion_status": "complete",
  "overall": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
  "admissible": true,
  "requires_officer_review": false,
  "findings": [
    {
      "finding_id": "string",
      "claim_id": "<one of the supplied claim_ids>",
      "status": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
      "claim": "<copy of the claim text>",
      "assessment": "<one to three sentences citing diff AND prior interface>",
      "evidence_strength": "none | weak | strong",
      "evidence": [
        {
          "source_type": "artifact",
          "source_id": "<from evidence_bundle>",
          "locator": "<source_id:line-line | source_id#anchor>",
          "quote_or_fact": "<exact text>",
          "supports": "<one sentence linking quote to assessment>"
        }
      ],
      "unverified_reason": "none",
      "escalate": false
    }
  ],
  "evidence_summary": "<one sentence; required when findings is empty>",
  "unverified_claims": [
    {
      "claim_id": "<unchecked claim>",
      "claim": "<text>",
      "reason": "missing_context | missing_evidence | conflict | truncation"
    }
  ],
  "tool_transcript_refs": [],
  "runtime": {
    "started_at": "<ISO8601>",
    "finished_at": "<ISO8601>",
    "attempt": 1,
    "finish_reason": "stop",
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "cached_tokens": 0
  }
}
```

## Escalation Rule

If you cannot produce a finding for a claim because the prior interface for that surface is not in the evidence bundle, do NOT guess. Place that claim in `unverified_claims` with `reason: "missing_evidence"` and continue. The substrate maps an empty/sparse output to `requires_officer_review=true` automatically.

If you cannot produce ANY findings AND have no unverified claims to report, return `overall: "SOUND"` with empty `findings`, populate `evidence_summary` with one sentence justifying the empty result, and the wrapper will demand officer review for the no-finding case.

Do not return prose. Do not return commentary. Do not return JSON wrapped in markdown fences. Return the JSON object directly.
````

- [ ] **Step 2: Verify discipline rules**

Run: `grep '"profile": "principalis_adversarial"' claude/mcps/principales/prompts/task-integration-prior.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/prompts/task-integration-prior.md
git commit -m "feat(principales): add task-integration-prior lane prompt"
```

---

## Task 6: Add prompt-discovery test for execution-family lanes

> **Confidence: High** — verified existing test directory at `claude/mcps/principales/test/` (flat — 13 files, no `integration/` subdir). Existing `sanity.test.ts:24,34` mocks `loadLaneTemplate` and bypasses `readdir`-based discovery, so the startup `allowedLanes` build path at `server.ts:91-97` is currently uncovered. This test exercises that path directly via vitest using `node:fs/promises` `readdir` against the real prompts directory.

**Files:**
- Create: `claude/mcps/principales/test/prompt-discovery.test.ts`
- Test: this is the test

- [ ] **Step 1: Write the failing test**

Create `claude/mcps/principales/test/prompt-discovery.test.ts` with this exact content:

```typescript
import { describe, it, expect } from 'vitest';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

async function discoverLanes(promptsDir: string): Promise<Set<string>> {
  return new Set(
    (await readdir(promptsDir))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -'.md'.length))
      .filter((name) => LANE_NAME_RE.test(name)),
  );
}

describe('prompt discovery — execution family lanes', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const promptsDir = path.resolve(here, '..', 'prompts');

  it('discovers task-plan-match', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-plan-match')).toBe(true);
  });

  it('discovers task-no-stubs', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-no-stubs')).toBe(true);
  });

  it('discovers task-domain-correctness', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-domain-correctness')).toBe(true);
  });

  it('discovers task-integration-prior', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-integration-prior')).toBe(true);
  });

  it('preserves existing lanes alongside new ones', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('upstream-coverage')).toBe(true);
    expect(lanes.has('ambiguity-audit')).toBe(true);
    expect(lanes.has('contradiction-hunt')).toBe(true);
  });

  it('rejects accidental matches per LANE_NAME_RE', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('')).toBe(false);
    expect(lanes.has('.')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes (the four execution prompts should already be on disk from Tasks 2-5)**

Run: `cd claude/mcps/principales && npx vitest run test/prompt-discovery.test.ts`
Expected: 6 tests pass.

If a test fails because a prompt file is missing, return to the corresponding earlier task (2-5) and verify that step 1 was completed.

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/test/prompt-discovery.test.ts
git commit -m "test(principales): cover startup prompt-discovery for execution-family lanes"
```

---

## Task 7: Build & verify principales MCP

> **Confidence: High** — substrate code requires no edits; only the `prompts/` directory grew. Build emits `dist/server.js` which the running MCP loads. Operator-side restart of Claude Code is required to pick up the new prompt files because `server.ts` reads the `prompts/` directory only at process spawn (lines 91-97). Documented for the Imperator post-completion.

**Files:**
- Build artifact: `claude/mcps/principales/dist/`
- Test: this task includes `npm test` over the full principales test suite

- [ ] **Step 1: Build the substrate**

Run: `cd claude/mcps/principales && npm run build`
Expected: succeeds with no TypeScript errors. `dist/server.js` exists with current mtime.

- [ ] **Step 2: Run the full test suite**

Run: `cd claude/mcps/principales && npm test`
Expected: all tests pass, including `prompt-discovery.test.ts` from Task 6.

- [ ] **Step 3: Document the operator restart requirement**

This step has no edit. The plan's "Operator action AFTER plan completes" section in the Files Map already names the restart. The legion's post-completion report MUST reference this.

- [ ] **Step 4: Commit**

If `npm run build` produced changes under `dist/`, commit them:

```bash
git add claude/mcps/principales/dist/
git commit -m "build(principales): rebuild dist with execution-family prompts on disk"
```

If `dist/` is gitignored or unchanged, skip the commit — Task 7 produces no other tracked artifact.

---

## Task 8: Create `tribune-protocol-schema.md` reference doc

> **Confidence: High** — schema specified in spec §7.3 (lines 125-156). This task converts the spec schema into a verification reference doc that Tribunus-design reads when authoring per-case `tribune-protocol.md` files.

**Files:**
- Create: `claude/skills/references/verification/tribune-protocol-schema.md`

- [ ] **Step 1: Create the schema reference doc**

Create `claude/skills/references/verification/tribune-protocol-schema.md` with this exact content:

````markdown
# Tribune Protocol Schema

The `tribune-protocol.md` artifact lives at `$CONSILIUM_DOCS/cases/<slug>/tribune-protocol.md`. It is written by Tribunus-design after the plan is verified and Custos-blessed; it is consumed by Tribunus-executor at Legion start.

The protocol is structured markdown, parseable by Tribunus-executor. Per task, the protocol specifies which lanes fire, what claims to verify per lane, what evidence sources to preload, what model profile to use per lane, and free-text executor notes.

## Schema (v1)

```yaml
schema_version: 1
plan_id: <case>/plan.md commit-or-hash
sampling_mode: every-3rd-task-by-plan-index  # determines counterfactual cadence
tasks:
  - task_id: <plan task identifier>
    lanes_triggered: [task-plan-match, task-domain-correctness, ...]  # subset of the four execution lanes
    claims_per_lane:
      task-plan-match: ["claim text 1", "claim text 2"]
      task-domain-correctness: [...]
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "<plan.md>#task-N"}
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "doctrine", path: "<doctrine excerpt path>"}
        - ...
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-domain-correctness: false
    executor_notes: "task touches money path; additional scrutiny on idempotency"
```

## Field Definitions

- **`schema_version`** — currently `1`. Bumps on incompatible changes.
- **`plan_id`** — case-relative path to `plan.md` plus the git SHA at which the protocol was authored. Detects post-protocol plan drift.
- **`sampling_mode`** — counterfactual cadence. v1 supports `every-3rd-task-by-plan-index`; future modes may expand. Sampling computed against plan position, not window position. Boundary continuity: a 15-task window restart does not shift the sampling sequence.
- **`tasks[].task_id`** — plan task identifier (e.g., `task-3`).
- **`tasks[].lanes_triggered`** — subset of `[task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]`. Tribunus-design selects per-task; the empty list means no Kimi dispatch (Tribunus-executor falls back to Claude-side patrol only).
- **`tasks[].claims_per_lane`** — per-lane claim list. Empty for any lane not in `lanes_triggered`.
- **`tasks[].evidence_sources_per_lane`** — per-lane evidence type list. `<runtime>` markers indicate sources Tribunus-executor populates at task time (the diff is generated from `git diff` at task completion).
- **`tasks[].model_profile_per_lane`** — `principalis_light` or `principalis_adversarial` per lane. Must match the `default_profile` in `claude/skills/references/verification/lanes.md` for that lane unless the spec authorizes deviation.
- **`tasks[].thinking_allowed_per_lane`** — `true` or `false` per lane. B-1 substrate ships `CONSILIUM_KIMI_DISABLE_THINKING=true` by default, so this is `false` for all execution lanes in B-1.
- **`tasks[].executor_notes`** — free-text guidance from Tribunus-design to Tribunus-executor. v1 is unstructured; Tribunus-design SHOULD use structured-discriminator-style notes (e.g., `domain-surface: money_path`, `additional-scrutiny: idempotency`) when applicable to enable later schema upgrade.

## Authoring Discipline (Tribunus-design)

- **Read the plan with fresh context.** Tribunus-design does NOT inherit the Consul's deliberation context. The plan and the doctrine are the inputs.
- **Subset selection.** Not every task fires every lane. A task that touches no domain doctrine surface skips `task-domain-correctness`. A task that does not interface with prior tasks skips `task-integration-prior`. Default subset for any task: `[task-plan-match, task-no-stubs]`. Tribunus-design adds the adversarial lanes per evidence.
- **Evidence preload paths.** When `task-domain-correctness` is selected, name the doctrine file path explicitly. **Path discipline (load-bearing):** doctrine paths MUST start with the literal token `$CONSILIUM_DOCS/doctrine/` followed by a filename that exists on disk at protocol-write time. Tribunus-design MUST verify path existence (e.g., via `Read` tool against the absolute resolved path) before committing the path to the protocol. A path that fails to resolve is a Tribunus-design BLOCKER, not a runtime fall-through. Common failures to avoid: relative paths (`medusa-workflow.md`), `~/projects/...` paths (doctrine does not live in the repo root; it lives at `$CONSILIUM_DOCS`), made-up filenames (verify the file exists). Plan task 1 of any window has no prior interface evidence; if `task-integration-prior` is selected for plan-task-1, document this as the empty-log case in `evidence_sources_per_lane` so the executor knows to expect zero entries and route the lane finding to `unverified_claims`.
- **Profile match.** Profile assignment in the protocol MUST match the registry default unless the spec explicitly authorized deviation.

## Consumption Discipline (Tribunus-executor)

- **Read at spawn.** Tribunus-executor reads the protocol once at Legion start and holds it in context across the 15-task lifetime window.
- **Lane subset enforcement.** Dispatch only the lanes named in `lanes_triggered` for that task. Do not improvise additional lanes.
- **Evidence bundle assembly.** For each lane, assemble the evidence bundle from the `evidence_sources_per_lane` paths. `<runtime>` sources (the diff) are populated from `git diff` at task time.
- **Profile honored.** Send the lane to `verify_lane` with `profile_override` matching `model_profile_per_lane`.

## Invalidation

`tribune-protocol.md` is invalidated when:
- Custos returns `PATCH BEFORE DISPATCH` and the patches modify task structure (additions, removals, reordering). `/edicts` re-dispatches Tribunus-design after the second Custos walk.
- The Imperator edits the plan after Tribunus-design ran but before Legion start. The `plan_id` SHA mismatch is detected at Legion start; Tribunus-executor halts and signals re-design.
````

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 claude/skills/references/verification/tribune-protocol-schema.md`
Expected: starts with `# Tribune Protocol Schema`.

Run: `grep "schema_version: 1" claude/skills/references/verification/tribune-protocol-schema.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add claude/skills/references/verification/tribune-protocol-schema.md
git commit -m "docs(verification): add tribune-protocol.md schema reference for Tribunus-design"
```

---

## Task 9: Create `tribune-log-schema.md` reference doc

> **Confidence: High** — schema specified in spec §7.4 (lines 159-184).

**Files:**
- Create: `claude/skills/references/verification/tribune-log-schema.md`

- [ ] **Step 1: Create the schema reference doc**

Create `claude/skills/references/verification/tribune-log-schema.md` with this exact content:

````markdown
# Tribune Log Schema

The `tribune-log.md` artifact lives at `$CONSILIUM_DOCS/cases/<slug>/tribune-log.md`. It is written by Tribunus-executor as it processes tasks during Legion execution. Append-only. Schema-strict per-task entries.

## Schema (v1)

```yaml
schema_version: 1
plan_id: <plan_id from protocol>
window_id: w1, w2, ...  # which Tribunus-executor instance authored this slice
entries:
  - task_id: <id>
    window_id: w1
    verdict: PASS | CONCERN | FAIL
    lanes_fired: [task-plan-match, ...]
    model_profile_per_lane: {...}
    kimi_dockets: [...]  # full content per docket; or refs to docket files
    claude_side_findings: [...]  # findings from Claude-side patrol on uncovered surfaces
    deviation_as_improvement_notes: "..."  # judgment notes when applicable
    final_chain_of_evidence: "..."
    cost_usd_kimi: <number>
    counterfactual:  # populated only on sampled tasks
      verdict: PASS | CONCERN | FAIL
      findings: [...]
    interface_summary:  # for downstream task-integration-prior consumers
      added: ["function foo: (a: A) => B at file:line", ...]
      modified: [...]
      removed: [...]
    token_budget_at_boundary: <int or null>  # logged at the 15-task boundary
```

## Field Definitions

- **`schema_version`** — currently `1`.
- **`plan_id`** — copied from `tribune-protocol.md`; consistency check at append time.
- **`window_id`** — `w1`, `w2`, ... per Tribunus-executor instance. Restart at the 15-task boundary increments.
- **`entries[].task_id`** — plan task identifier; matches the protocol task_id.
- **`entries[].verdict`** — Tribunus-executor's integrated verdict. PASS = SOUND. CONCERN = soft finding for Campaign review. FAIL = GAP or MISUNDERSTANDING that halts the legion.
- **`entries[].lanes_fired`** — actual lanes dispatched (subset of protocol `lanes_triggered`; identical unless a transport failure dropped a lane).
- **`entries[].model_profile_per_lane`** — actual profiles used per lane.
- **`entries[].kimi_dockets`** — full docket content per fired lane, or filesystem refs.
- **`entries[].claude_side_findings`** — findings from Tribunus-executor's own patrol on surfaces not covered by Kimi (cast-laundering, `any`-types-hiding via Serena; deviation-as-improvement judgment integration).
- **`entries[].deviation_as_improvement_notes`** — when a lane flagged a deviation that Tribunus judged an improvement, the rationale lives here. Empty when not applicable.
- **`entries[].final_chain_of_evidence`** — the integrated chain naming whether each finding came from Kimi, Claude-side patrol, or judgment integration.
- **`entries[].cost_usd_kimi`** — sum of `cost_usd` from all fired-lane dockets.
- **`entries[].counterfactual`** — populated only on sampled tasks (every 3rd task by plan-index). Captures Claude-side patrol verdict rendered BEFORE lane dispatch on that task — uncontaminated by docket exposure. PASS/CONCERN/FAIL same vocabulary.
- **`entries[].interface_summary`** — producer side of the contract that `task-integration-prior` consumes. Tribunus-executor extracts added/modified/removed function signatures from the task diff and writes them here. Downstream tasks' `task-integration-prior` lane reads this from the appended log via the `tribune-protocol.md` evidence path.
- **`entries[].token_budget_at_boundary`** — Tribunus-executor's observed input-token usage at the 15-task boundary. Populated only on the boundary task. Used to revisit the 15-task threshold per spec §9.

## Authoring Discipline (Tribunus-executor)

- **Append-only.** No edits to prior entries. Concurrency-write is not addressed in v1 because only one Tribunus-executor instance is alive at any moment.
- **Atomic per task.** One full entry per task; no partial entries.
- **Counterfactual sequencing.** On a sampled task: Claude-side patrol runs FIRST (before lane dispatch). The counterfactual verdict is captured at that point. Then lanes dispatch. The integrated verdict is computed and logged separately.
- **Boundary atomicity.** The window-final entry includes `token_budget_at_boundary`. A new window starts a new entries section with the new `window_id`.

## Independence Rule (Campaign Review boundary)

`tribune-log.md` is written for audit and for Tribunus-executor cross-task continuity. The Legion's Campaign Review (Censor + Praetor + Provocator parallel dispatch after the last task) **MUST NOT** receive `tribune-log.md` as evidence. The Campaign Review verifiers are ephemeral and independent per the Codex; they read the implementation, the spec, the plan, and the doctrine — not Tribunus-executor's verdicts.

Overlap between Tribunus-executor's per-task findings and Campaign Review findings is independent confirmation, not duplication.
````

- [ ] **Step 2: Verify the file is well-formed**

Run: `grep "Independence Rule" claude/skills/references/verification/tribune-log-schema.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add claude/skills/references/verification/tribune-log-schema.md
git commit -m "docs(verification): add tribune-log.md schema reference + Campaign Review boundary"
```

---

## Task 10: Update `consilium-tribunus.md` frontmatter

> **Confidence: High** — verified persona file lives at `~/.claude/agents/consilium-tribunus.md`. Frontmatter currently spans lines 1-9; description on line 3, tools on line 4, mcpServers lines 5-7, model line 8.

**Files:**
- Modify: `~/.claude/agents/consilium-tribunus.md` (lines 1-9)

- [ ] **Step 1: Read the current frontmatter to confirm exact text**

Run: `head -9 ~/.claude/agents/consilium-tribunus.md`
Expected output (use this as the baseline for the next step):

```
---
name: consilium-tribunus
description: Per-task mini-checkit patrol verification (Legion dispatch) OR diagnosis-packet verification (Medicus dispatch). Stance is declared by the dispatcher in the prompt. Patrol depth — fast, focused, one pass. Patrol stance verifies plan-step match, domain correctness, reality (no stubs), integration with earlier tasks. Diagnosis stance verifies packet correctness — reproduction, evidence, known-gap discipline with live recheck, fix-site match, threshold match with field-14 contract-compat evidence, verification plan executability. Read-only with Bash.
tools: Read, Grep, Glob, Skill, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__serena__find_file, mcp__serena__list_dir, mcp__medusa__ask_medusa_question, Bash
mcpServers:
  - serena
  - medusa
model: opus
---
```

If the actual current frontmatter differs from the above, halt and surface the diff to the Imperator before proceeding.

- [ ] **Step 2: Replace the frontmatter**

Edit `~/.claude/agents/consilium-tribunus.md` lines 1-9.

Replace:
```
---
name: consilium-tribunus
description: Per-task mini-checkit patrol verification (Legion dispatch) OR diagnosis-packet verification (Medicus dispatch). Stance is declared by the dispatcher in the prompt. Patrol depth — fast, focused, one pass. Patrol stance verifies plan-step match, domain correctness, reality (no stubs), integration with earlier tasks. Diagnosis stance verifies packet correctness — reproduction, evidence, known-gap discipline with live recheck, fix-site match, threshold match with field-14 contract-compat evidence, verification plan executability. Read-only with Bash.
tools: Read, Grep, Glob, Skill, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__serena__find_file, mcp__serena__list_dir, mcp__medusa__ask_medusa_question, Bash
mcpServers:
  - serena
  - medusa
model: opus
---
```

With:
```
---
name: consilium-tribunus
description: Per-task mini-checkit patrol verification (Legion dispatch — patrol or persistent-executor stance), pre-flight protocol authoring (design stance, /edicts dispatch), OR diagnosis-packet verification (Medicus dispatch). Stance is declared by the dispatcher in the prompt. Patrol depth — fast, focused, one pass. Patrol/persistent-executor stances verify plan-step match, domain correctness, reality (no stubs), integration with earlier tasks. Design stance authors tribune-protocol.md from a verified, Custos-blessed plan. Diagnosis stance verifies packet correctness — reproduction, evidence, known-gap discipline with live recheck, fix-site match, threshold match with field-14 contract-compat evidence, verification plan executability. Read-only with Bash in patrol/diagnosis stances; writes tribune-protocol.md and tribune-log.md in design and persistent-executor stances.
tools: Read, Write, Grep, Glob, Skill, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__serena__find_file, mcp__serena__list_dir, mcp__medusa__ask_medusa_question, mcp__consilium-principales__verify_lane, Bash
mcpServers:
  - serena
  - medusa
  - principales
model: opus
---
```

- [ ] **Step 3: Verify frontmatter changes**

Run: `head -9 ~/.claude/agents/consilium-tribunus.md`
Expected: matches the new frontmatter exactly.

Run: `grep "mcp__consilium-principales__verify_lane" ~/.claude/agents/consilium-tribunus.md`
Expected: at least one match (in the tools line).

Run: `grep "  - principales" ~/.claude/agents/consilium-tribunus.md`
Expected: at least one match (in mcpServers).

- [ ] **Step 4: Commit (if user-scope agents are tracked under the repo's `claude/scripts` or via `~/.claude/agents/` symlink)**

`~/.claude/agents/consilium-tribunus.md` is a user-scope agent file. It is NOT under the Consilium repo's tracked tree, but its canonical content lives in repo case files per `claude/CLAUDE.md` Maintenance section. This task edits the live file directly. Skip git commit for this task; commit `consilium-tribunus.md` in Task 11 (after the body edits) using the appropriate path.

If `~/.claude/agents/` is a symlinked location to a tracked repo path on this machine, commit per repo conventions:

```bash
# Only if the agent file is symlinked into a repo tracked path:
git add ~/.claude/agents/consilium-tribunus.md  # follows the symlink
git commit -m "feat(tribunus): add design + persistent-executor stances to frontmatter"
```

If the file is standalone (typical), proceed to Task 11 and commit jointly.

---

## Task 11: Update Stance Selection in `consilium-tribunus.md` body

> **Confidence: Medium** — verified Stance Selection section starts at `consilium-tribunus.md:335` (`## Stance Selection`) and ends at line 357 (last content line of the Diagnosis Stance block before the blank line at 358 and the `## Medusa MCP Usage` heading at line 359). Codex content occupies lines 109-323 (drift-checked block); Stance Selection is BELOW the Codex. Body edits do NOT modify the Codex block, so the drift check in Task 13 will not be triggered by Task 11 edits to Stance Selection alone. Confidence is Medium because Task 10's frontmatter edit shifts line numbers — soldier MUST use `grep -n` to relocate the section dynamically rather than relying on the cited line range.

**Files:**
- Modify: `~/.claude/agents/consilium-tribunus.md` (Stance Selection block — section anchor `## Stance Selection`; line numbers will shift after Task 10's frontmatter edit, so the soldier must locate via `grep -n` per Step 1)

- [ ] **Step 1: Locate the current Stance Selection block**

Run: `grep -n "## Stance Selection" ~/.claude/agents/consilium-tribunus.md`
Expected: one match. Note the line number (call it `N`).

Run: `sed -n "${N},/## Medusa MCP Usage/p" ~/.claude/agents/consilium-tribunus.md`
Expected: prints the Stance Selection block ending at the `## Medusa MCP Usage` heading.

- [ ] **Step 2: Replace the Stance Selection block**

Edit `~/.claude/agents/consilium-tribunus.md`. Replace the entire block starting at `## Stance Selection` and ending immediately before `## Medusa MCP Usage` (do NOT replace the Medusa heading itself).

Replace:
```markdown
## Stance Selection

The Tribunus is dispatched in one of two stances. The dispatch prompt declares which. The identity, creed, trauma, and Codex carry over unchanged. The stance changes what the Tribunus checks.

### Patrol Stance (Legion)

Dispatched by the Legatus after a soldier reports DONE or DONE_WITH_CONCERNS on a plan task. Verifies plan-step match, domain correctness, reality (no stubs, no TODO leftovers), and integration with earlier tasks.

### Diagnosis Stance (Tribune)

Dispatched by the Medicus after a diagnosis packet is written. Verifies the packet, not code:

- Reproduction is present or absence is explicitly justified.
- Evidence cited in Supporting evidence is specific (file:line, log excerpt, MCP citation).
- Contrary evidence is not a placeholder.
- Known-gap discipline — every referenced gap carries a live recheck result. Using a gap as proof without recheck is MISUNDERSTANDING.
- Root-cause hypothesis is traceable from evidence.
- Proposed fix site matches the failing boundary.
- Fix threshold matches the scope.
- Verification plan is executable.
- Field 14 (Contract compatibility evidence) matches the declared Fix threshold when cross-repo is implicated.

Same finding categories (MISUNDERSTANDING / GAP / CONCERN / SOUND). Same chain of evidence.

```

With:

````markdown
## Stance Selection

The Tribunus is dispatched in one of four stances. The dispatch prompt declares which. The identity, creed, trauma, and Codex carry over unchanged. The stance changes what the Tribunus checks and writes.

**Role separation across all stances.** The Tribunus is the judge of deviation. The principales are claim-verifiers. The Tribunus reads dockets, applies the Codex's Deviation-as-Improvement Rule, and renders verdict. Principales return yes/no per claim and never judge.

### Patrol Stance (`/march` primary; `/legion` fallback)

Dispatched by the Legatus per task as a fresh subagent. Used in two situations:

- **`/march` primary mode.** `/march` never spawns a persistent Tribunus — it is the deliberate ceremony-skip skill for trivial plans where the Imperator chooses solo-Legatus execution. Under `/march`, Patrol stance is the active per-task verification stance, not a fallback. The Imperator chose `/march` deliberately; the Tribunus serves that choice as the primary verification mode.
- **`/legion` fallback mode.** When the persistent-executor pattern has degraded — principales transport failure, substrate session-budget breach, operator-disabled persistence config, or persistent-executor crash without recovery — the Legatus falls back to dispatching ephemeral Patrol-stance subagents per task.

Verifies plan-step match, domain correctness, reality (no stubs, no TODO leftovers), and integration with earlier tasks. Read-only.

### Persistent-Executor Stance (Legion)

Spawned by the Legatus once at Legion start as a named addressable agent. Receives `tribune-protocol.md` and any pre-existing `tribune-log.md` digest at spawn and holds them in context across a 15-task lifetime window (±2 ergonomic — a 16-task plan uses one Tribunus, not two). Per task completion, the Legatus signals via `SendMessage` with task identifier, change-set, files touched, and a brief implementation summary. Tribunus-executor then:

- Preloads per-lane evidence bundles per the protocol (diff slices, file-content slices, doctrine excerpts where applicable, prior-task interface summaries from `tribune-log.md`).
- Dispatches the protocol-selected lanes via `mcp__consilium-principales__verify_lane`.
- Runs Claude-side patrol on surfaces NOT covered by Kimi — including `{} as Type` cast laundering and `any`-types-hiding-behind-correct-interfaces via Serena symbol tools, on every task regardless of which Kimi lanes fired.
- Applies the Codex's Deviation-as-Improvement Rule as judgment over flagged dockets: when a lane flags a deviation, Tribunus decides improvement (SOUND-with-note) or drift (FAIL-with-note).
- Returns a per-task verdict (PASS / CONCERN / FAIL) with chain-of-evidence citing whether each finding came from a Kimi docket, Claude-side patrol, or judgment integration.
- Appends an entry to `tribune-log.md` per the schema in `claude/skills/references/verification/tribune-log-schema.md`.

**Counterfactual sampling.** On every 3rd task by plan-index (deterministic across window boundaries), Claude-side patrol runs FIRST — before dispatching lanes — to keep the counterfactual uncontaminated by docket exposure. The integrated verdict and the counterfactual verdict are logged separately per the schema.

**15-task boundary.** At the 15-task boundary (or boundary + ≤2 if the plan ends within the ergonomic window), the outgoing Tribunus-executor receives a final "window-complete" SendMessage from the Legatus, writes `token_budget_at_boundary` into the final entry, acknowledges, and terminates. The Legatus spawns a new Tribunus-executor with a new name and fresh context; the new instance reads `tribune-protocol.md` and the appended `tribune-log.md` at spawn.

**Substrate degradation fallback.** When `verify_lane` returns `refused` (substrate session-budget breach), `transport_failure`, or any synthetic-failure docket, Tribunus-executor falls back to Claude-side patrol on that task, logs the fallback in `claude_side_findings`, and continues. Repeated transport failures across multiple tasks escalate to the Imperator.

**Independence boundary.** The Legion's post-execution Campaign Review (Censor + Praetor + Provocator parallel dispatch) does NOT receive `tribune-log.md`. The Campaign Review verifiers are ephemeral and independent per the Codex; they read the implementation, the spec, the plan, and the doctrine — not the persistent-executor's verdicts.

### Design Stance (/edicts dispatch — pre-flight)

Dispatched by the Consul (in the `/edicts` skill body) once per plan, AFTER plan-level Praetor + Provocator return SOUND AND the Custos walk returns OK TO MARCH (or after Imperator override of BLOCKER). One-shot — no SendMessage continuation. Reads the verified, Custos-blessed plan with fresh context (does NOT inherit the Consul's deliberation context per the Codex Independence Rule for spec/plan verifiers).

Writes `tribune-protocol.md` to the case directory per the schema in `claude/skills/references/verification/tribune-protocol-schema.md`. Per task, the protocol specifies which lanes fire, what claims to verify per lane, what evidence sources to preload per lane, what model profile per lane, and free-text executor notes.

**Subset selection discipline.** Not every task fires every lane. A task that touches no domain-doctrine surface skips `task-domain-correctness`. A task that does not interface with prior tasks skips `task-integration-prior`. Default subset for any task: `[task-plan-match, task-no-stubs]`. Add adversarial lanes per evidence in the plan task body.

**Invalidation.** If Custos returns PATCH BEFORE DISPATCH on a structural patch (task additions, removals, reordering), `tribune-protocol.md`'s prior content is invalidated; the Consul re-runs Tribunus-design after the second Custos walk completes.

### Diagnosis Stance (Tribune)

Dispatched by the Medicus after a diagnosis packet is written. Verifies the packet, not code:

- Reproduction is present or absence is explicitly justified.
- Evidence cited in Supporting evidence is specific (file:line, log excerpt, MCP citation).
- Contrary evidence is not a placeholder.
- Known-gap discipline — every referenced gap carries a live recheck result. Using a gap as proof without recheck is MISUNDERSTANDING.
- Root-cause hypothesis is traceable from evidence.
- Proposed fix site matches the failing boundary.
- Fix threshold matches the scope.
- Verification plan is executable.
- Field 14 (Contract compatibility evidence) matches the declared Fix threshold when cross-repo is implicated.

Same finding categories (MISUNDERSTANDING / GAP / CONCERN / SOUND). Same chain of evidence. Read-only.

### Tool-Use Discipline Across Stances

The frontmatter declares `Write` as an available tool because the design and persistent-executor stances author artifacts. Patrol and Diagnosis stances DO NOT write — even though the tool is now technically available. The persona's read-only behavior in those stances is doctrine, not capability gating.

````

- [ ] **Step 3: Verify the new Stance Selection structure**

Run: `grep -c "^### " ~/.claude/agents/consilium-tribunus.md`
Expected: at least 4 matches in the Stance Selection area (Patrol, Persistent-Executor, Design, Diagnosis).

Run: `grep "Persistent-Executor Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: one match.

Run: `grep "Design Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: one match.

Run: `grep "Tool-Use Discipline Across Stances" ~/.claude/agents/consilium-tribunus.md`
Expected: one match.

- [ ] **Step 4: Commit (jointly with Task 10's frontmatter edit if Tasks 10 and 11 ran in the same worktree)**

```bash
git add ~/.claude/agents/consilium-tribunus.md  # if symlinked into a repo path; otherwise this is a file-edit-only task
git commit -m "feat(tribunus): add design + persistent-executor stances; codify role separation, fallback, sampling, and tool-use discipline"
```

If `~/.claude/agents/` is not symlinked into a tracked repo path on this machine, the persona file edits are done in-place and not git-tracked at this path. The repo-tracked canonical content for this persona block lives in `docs/cases/<the-tribune-reshape-case>/plan.md` per `claude/CLAUDE.md` Maintenance section's "User-scope agent customizations" — out of scope for this task.

---

## Task 12: Amend `docs/codex.md` — Persistent Orchestrator class + Per-Task Verification sub-amendment

> **Confidence: Medium** — verified canonical Codex location at `docs/codex.md` (per `claude/scripts/check-codex-drift.py:26`); 6 user-scope agents copy this content (per AGENTS list at `check-codex-drift.py:28`); drift script extracts via header `# The Codex of the Consilium` and boundary `## Operational Notes`. Verified live section ordering by direct file read: `## The Confidence Map` (line 95) → `## The Deviation-as-Improvement Rule` (line 114) → `## The Auto-Feed Loop` (line 124) → `## The Independence Rule` (line 134) → `## The Interaction Protocols` (line 150). Auto-Feed Loop PRECEDES Independence Rule. The amendment text is from spec §8 lines 219-229. Placement: AFTER Independence Rule, BEFORE Interaction Protocols (Persistent Orchestrator is a narrow exception to Independence; adjacency reads as "Independence is the rule, this is the named exception"). Confidence is Medium because line numbers may have shifted since file-read; soldier MUST re-grep at execution time.

**Files:**
- Modify: `docs/codex.md`

- [ ] **Step 1: Locate the existing Independence Rule and Interaction Protocols sections**

Run: `grep -n "^## The Independence Rule" docs/codex.md`
Expected: one match. Note the line (call it `INDEP_LINE`).

Run: `grep -n "^## The Interaction Protocols" docs/codex.md`
Expected: one match. Note the line (call it `INTER_LINE`). MUST be greater than `INDEP_LINE`.

Run: `grep -n "^## The Auto-Feed Loop" docs/codex.md`
Expected: one match. Note the line (call it `AUTOFEED_LINE`). For sanity, MUST be less than `INDEP_LINE` (Auto-Feed Loop precedes Independence Rule per the canonical file ordering).

If any of the three commands returns 0 matches or multiple matches, halt and surface to Imperator — the canonical file ordering has drifted from the plan's expectation and Step 2's insertion logic does not apply.

The amendment will add a new section AFTER `## The Independence Rule` ends (its closing `---` separator) and BEFORE `## The Interaction Protocols` begins.

- [ ] **Step 2: Insert the Persistent Orchestrator class section**

Edit `docs/codex.md`. Insert this content as a new section AFTER `## The Independence Rule` ends (immediately after its trailing `---` separator) and BEFORE `## The Interaction Protocols` heading begins. The Auto-Feed Loop is NOT the insertion anchor — it sits before Independence Rule in the file and is irrelevant to placement.

Placement reasoning: the Persistent Orchestrator class is a narrow exception to Independence. Adjacency to Independence reads as "Independence is the rule; this is the one named exception."

```markdown
## The Persistent Orchestrator Class

The Codex recognizes one narrowly scoped exception to per-dispatch independence: a **Persistent Orchestrator**. A verifier holding cross-task context within a single in-plan execution-time window. Per-task independence is explicitly traded for cross-task coherence detection. Lifetime is bounded (default 15 tasks, ±2 ergonomic) to prevent context degradation.

The Persistent Orchestrator class has exactly one member: the Tribunus-on-Legion executor stance. **Any future role exhibiting the architectural property — cross-task context within an in-plan execution-time window — MUST be added to this enumeration through a new Codex amendment specifically. The privilege does NOT generalize from the property.** A future role with similar architecture but a different name is bound by the Independence Rule until the Codex names it as a Persistent Orchestrator.

The Independence Rule remains absolute for all other verifier roles in all other contexts: Censor, Praetor, Provocator (in spec-time, plan-time, and Campaign-review contexts), Custos (field-readiness verification), and Tribunus-in-diagnosis-stance (Medicus track) all remain ephemeral and independent.

**Term definition.** *In-plan execution-time* refers to verification of implemented tasks during Legion execution — after spec is verified, after plan is verified, after each task is implemented, before Campaign review.

```

- [ ] **Step 3: Amend the Per-Task Verification subsection inside `## The Interaction Protocols`**

Run: `grep -n "### Per-Task Verification" docs/codex.md`
Expected: one match. Note the line.

The existing block reads (per the persona-file copy at `consilium-tribunus.md:266-267`):

```markdown
### Per-Task Verification (Mini-Checkit)
After each soldier completes a task, the Legatus dispatches the **Tribunus**. The Tribunus receives the task output, the plan step, and the domain knowledge. Sequential — one task at a time, because the next task may depend on the current being verified clean.
```

Replace with:

```markdown
### Per-Task Verification (Mini-Checkit)
After each soldier completes a task, the Legatus dispatches the **Tribunus**. The Tribunus receives the task output, the plan step, and the domain knowledge. Sequential — one task at a time, because the next task may depend on the current being verified clean.

**Legion-executor amendment.** In the Legion executor stance, the Legatus does NOT dispatch the Tribunus per task. At Legion start, Legatus spawns Tribunus-executor with the verified protocol and signals task completions across its 15-task lifetime window via `SendMessage`. Restart-with-fresh-context occurs at the 15-task boundary (±2 ergonomic). Per-task independence is replaced by intra-window cross-task coherence; cross-window independence is preserved through `tribune-log.md`-driven restart. All other Per-Task Verification semantics are unchanged. The Medicus diagnosis stance retains the original per-dispatch shape.
```

- [ ] **Step 4: Verify the amendments parse cleanly**

Run: `grep "Persistent Orchestrator" docs/codex.md`
Expected: at least 2 matches (heading + body).

Run: `grep "Legion-executor amendment" docs/codex.md`
Expected: one match.

Run: `grep "in-plan execution-time" docs/codex.md`
Expected: at least 2 matches.

- [ ] **Step 5: Commit**

```bash
git add docs/codex.md
git commit -m "doctrine: add Persistent Orchestrator class to Codex (Tribunus-on-Legion executor stance only); amend Per-Task Verification for Legion executor"
```

---

## Task 13: Run codex drift check + sync to user-scope agents

> **Confidence: High** — verified `claude/scripts/check-codex-drift.py` exists (NOT `scripts/check-codex-drift.py` as `claude/CLAUDE.md` Maintenance line currently says — that path is stale; fix the doc as a step in this task). `AGENTS = ["censor", "praetor", "provocator", "tribunus", "soldier", "custos"]` per script line 28. Script supports `--sync` flag.

**Files:**
- Modify (auto, via `--sync`): `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,custos}.md`
- Modify: `claude/CLAUDE.md` — fix the stale `scripts/check-codex-drift.py` path

- [ ] **Step 1: Verify script location**

Run: `ls -1 claude/scripts/check-codex-drift.py`
Expected: file exists.

Run: `ls -1 scripts/check-codex-drift.py 2>&1 | head -1`
Expected: error or "No such file" — the script does NOT live at this path. Confirms the documentation path in `claude/CLAUDE.md` is stale.

- [ ] **Step 1b: Boundary integrity precheck on all 6 user-scope agents (BEFORE the destructive `--sync`)**

The drift script's `--sync` rewrites each user-scope agent file using `extract_codex` boundaries (`# The Codex of the Consilium` header → `## Operational Notes` footer). If any one agent file is MISSING the `## Operational Notes` boundary, `extract_codex` returns `end = len(lines)` (script line ~56), and `--sync` writes `prefix + canonical + ["", "---", ""] + suffix=[]` — silently destroying any persona body content sitting after the Codex block. Verify boundary integrity across all 6 agents BEFORE running `--sync`:

Run this verification loop:
```bash
for agent in censor praetor provocator tribunus soldier custos; do
  file="$HOME/.claude/agents/consilium-${agent}.md"
  echo "=== ${agent} ==="
  grep -c "^# The Codex of the Consilium" "${file}"
  grep -c "^## Operational Notes" "${file}"
done
```

Expected per agent: each `grep -c` returns exactly `1`. If any agent returns `0` for `## Operational Notes`, halt — `--sync` would destroy that agent's post-Codex body content. Surface the affected agent(s) to the Imperator and pause for guidance before continuing. Do NOT proceed to `--sync` until all 6 agents report `1 1`.

- [ ] **Step 2: Run drift check (report mode) BEFORE syncing**

Run: `python3 claude/scripts/check-codex-drift.py --verbose`
Expected: reports the diff between the canonical `docs/codex.md` (Task 12-amended) and the 6 user-scope agent copies. The Tribunus copy will show drift if Task 11's body edits are below the Codex block (Stance Selection is below the Codex per scout report — drift detection should NOT flag Stance Selection edits because the script extracts the Codex block by `# The Codex of the Consilium` heading + `## Operational Notes` boundary). The 5 other agents will show drift purely from Task 12's Codex amendment.

- [ ] **Step 3: Sync canonical to user-scope agent copies**

Run: `python3 claude/scripts/check-codex-drift.py --sync`
Expected: rewrites the Codex block inside each of the 6 user-scope agent files using the canonical `docs/codex.md` content. All 6 should report synced.

- [ ] **Step 4: Re-run drift check to confirm clean**

Run: `python3 claude/scripts/check-codex-drift.py`
Expected: reports no drift across all 6 agents.

- [ ] **Step 5: Fix the stale path in `claude/CLAUDE.md`**

Edit `claude/CLAUDE.md`. Find the Maintenance section block:

```markdown
**Codex drift check.** The Codex (`skills/references/personas/consilium-codex.md`) is copy-pasted into 6 user-scope agent files. After editing the canonical Codex, run:

```bash
python3 scripts/check-codex-drift.py              # report drift
python3 scripts/check-codex-drift.py --verbose    # report + unified diff
python3 scripts/check-codex-drift.py --sync       # rewrite agent copies from canonical
```
```

Replace the three `python3 scripts/...` lines with `python3 claude/scripts/...` paths:

```bash
python3 claude/scripts/check-codex-drift.py              # report drift
python3 claude/scripts/check-codex-drift.py --verbose    # report + unified diff
python3 claude/scripts/check-codex-drift.py --sync       # rewrite agent copies from canonical
```

Apply the same path correction to the staleness check block (replace `python3 scripts/check-tribune-staleness.py` with `python3 claude/scripts/check-tribune-staleness.py` — both report and verbose lines).

- [ ] **Step 6: Verify the path fixes**

Run: `grep -c "python3 claude/scripts/" claude/CLAUDE.md`
Expected: at least 5 (3 drift + 2 staleness).

Run: `grep "python3 scripts/" claude/CLAUDE.md | grep -v "claude/scripts"`
Expected: no output (no stale `scripts/` paths remain).

- [ ] **Step 7: Commit**

```bash
git add docs/codex.md claude/CLAUDE.md
# user-scope agent files at ~/.claude/agents/ are not under repo tree on most machines — skip those from git add
git commit -m "doctrine: sync Codex amendment to user-scope agents; fix stale claude/scripts path in CLAUDE.md"
```

---

## Task 14: Modify `/edicts/SKILL.md` — dispatch Tribunus-design after Custos OK TO MARCH

> **Confidence: High** — verified existing flow in `claude/skills/edicts/SKILL.md`: Praetor + Provocator dispatch (lines 265-281) → Custos walk (lines 285-391) → "The Legion Awaits" (line 395+). Tribunus-design fits between Custos OK TO MARCH and Legion Awaits.

**Files:**
- Modify: `claude/skills/edicts/SKILL.md` (insert new section between current Custos and Legion Awaits)
- Create: `claude/skills/references/verification/templates/tribune-design.md`

- [ ] **Step 1: Create the dispatch template**

Create `claude/skills/references/verification/templates/tribune-design.md` with this exact content:

````markdown
# Tribune-Design Dispatch Template

The Consul invokes this template inside `/edicts` after the Custos walk returns OK TO MARCH (or after Imperator override of BLOCKER). It dispatches one Tribunus subagent in **design stance** to author `tribune-protocol.md` from the verified, Custos-blessed plan.

## Pre-dispatch Conditions

All five conditions from the Custos dispatch contract must hold (no MISUNDERSTANDING in escalation, no unresolved GAPs, all CONCERNs explicitly handled, no silent plan modifications since plan verification, Imperator overrides recorded). The plan is committed.

## Dispatch Shape

The `Agent({...})` notation below is illustrative shorthand for the actual subagent-dispatch tool available in the runtime (e.g., `Task` or whichever primitive Claude Code exposes for subagent spawning at execution time). The dispatching consul invokes the runtime's actual tool with the named parameters shown — particularly `subagent_type` for persona selection.

```
Agent({
  description: "Tribunus design — author tribune-protocol.md",
  subagent_type: "consilium-tribunus",
  prompt: <below>
})
```

## Dispatch Prompt Body

Stance: **design** (declared in prompt, per persona Stance Selection block).

```
You are dispatched in DESIGN STANCE.

Read the Consilium Codex (your system prompt carries it). Read the Tribune Protocol Schema at:
  /Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-protocol-schema.md

You will read a verified, Custos-blessed plan at:
  <PLAN PATH — substituted by /edicts at dispatch time>

You will write tribune-protocol.md at:
  <CASE DIR>/tribune-protocol.md

Your task:

1. Read the plan with fresh context. You do NOT inherit the Consul's deliberation context. The plan and the doctrine are your inputs.

2. For each task in the plan, decide which execution-family lanes should fire. The four available lanes:
   - task-plan-match (principalis_light, evidence: plan-task-body + diff)
   - task-no-stubs (principalis_light, evidence: diff)
   - task-domain-correctness (principalis_adversarial, evidence: diff + doctrine)
   - task-integration-prior (principalis_adversarial, evidence: diff + prior interfaces)

   Default subset for any task: [task-plan-match, task-no-stubs]. Add task-domain-correctness when the task touches a domain-doctrine surface (Medusa workflow boundary, link.create, money path, frontend hard rule). Add task-integration-prior when the task interfaces with prior-task interfaces.

3. For each lane fired on a task:
   - Write 2-6 specific claims (under the lane's `max_claims_per_bundle`).
   - List evidence sources by type and path (e.g., `{type: "plan-task-body", path: "<plan.md>#task-N"}`, `{type: "doctrine", path: "$CONSILIUM_DOCS/doctrine/medusa-workflow.md"}`).
   - Set model_profile_per_lane to the registry default (principalis_light or principalis_adversarial). Do NOT deviate.
   - Set thinking_allowed_per_lane to false (B-1 substrate default).

4. Set sampling_mode to "every-3rd-task-by-plan-index" (B-1 default).

5. Add executor_notes per task when the task has a domain-surface flag (e.g., "task touches money path; additional scrutiny on idempotency").

6. Write the protocol to <CASE DIR>/tribune-protocol.md per the schema.

7. Report back to the Consul one of:
   - DESIGN_COMPLETE — protocol written; brief summary of lane assignments.
   - DESIGN_BLOCKED — plan has a gap that prevents protocol authoring (e.g., a task body too vague to claim-extract); name the gap.

Do not modify the plan. Do not modify the spec. Do not dispatch verify_lane. You are an authoring stance, not an executing stance.
```

## Re-dispatch Triggers

Tribunus-design re-runs in two cases:
- Custos returns PATCH BEFORE DISPATCH on a structural patch (task additions, removals, reordering). The first run's `tribune-protocol.md` is invalidated and re-written.
- The Imperator edits the plan after Tribunus-design ran but before Legion start. Detected at Legion start via `plan_id` SHA mismatch — the Legion announces the mismatch and returns the case to `/edicts` for re-design.

## Failure Handling

- **DESIGN_BLOCKED return:** the Consul surfaces the blocker to the Imperator and routes back to plan revision (treated as exhausted CONCERN at the Custos boundary; counts toward the auto-feed cap).
- **Subagent crash / non-return:** announce the failure to the Imperator. Re-dispatch once. If the second dispatch also fails, escalate.
````

- [ ] **Step 2: Modify `/edicts/SKILL.md` to insert Tribunus-design dispatch between Custos and Legion Awaits**

Locate the current "After verdict handling completes (or override is confirmed), proceed to 'The Legion Awaits.'" line at the end of the Custos section.

Run: `grep -n "After verdict handling completes" claude/skills/edicts/SKILL.md`
Expected: one match.

Replace this line:
```markdown
After verdict handling completes (or override is confirmed), proceed to "The Legion Awaits."
```

With:
```markdown
After verdict handling completes (or override is confirmed), proceed to "Dispatching Tribunus-Design."

---

## Dispatching Tribunus-Design

**This section is reached after EVERY Custos-cleared path** — first-walk `OK TO MARCH`, second-walk `OK TO MARCH` after a `PATCH BEFORE DISPATCH` re-walk, or `BLOCKER` override-and-proceed. The verdict-bullet lines elsewhere in this skill that read "proceed to The Legion Awaits" refer to the eventual final destination; the actual transition flows through this Tribunus-Design dispatch first.

The plan is verified, Custos-blessed, and committed. One artifact remains before the Legion Awaits — the per-task verification protocol that the persistent Tribunus-executor will run during Legion execution.

I dispatch Tribunus-design exactly once per plan, in the **design stance** of the `consilium-tribunus` user-scope agent. The dispatch produces `tribune-protocol.md` in the case directory alongside `plan.md`.

I read the template before dispatch:
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-design.md`

I follow the template exactly. Dispatch is one-shot — Tribunus-design returns DESIGN_COMPLETE or DESIGN_BLOCKED.

### Re-dispatch on Structural Patch

If Custos returned `PATCH BEFORE DISPATCH` AND the patches modified task structure (additions, removals, reordering), the prior `tribune-protocol.md` (if any) is invalidated. I re-dispatch Tribunus-design after the second Custos walk completes with `OK TO MARCH`. Re-dispatch on non-structural patches (typo fixes inside a task body, evidence-path corrections) is NOT required — the prior protocol output is preserved.

The structural-vs-non-structural distinction is made by inspecting the `## Re-walk Marker` diff hunks: any hunk that adds or removes a `### Task N` heading, changes a task's `**Files:**` block, or reorders tasks is structural. A hunk that touches only the body text of a single task without changing its structural metadata is non-structural.

### Path coverage

- **First-walk `OK TO MARCH`** → Tribunus-design dispatch (first run; no prior protocol).
- **Second-walk `OK TO MARCH` after structural patch** → Tribunus-design dispatch (re-run; prior protocol invalidated).
- **Second-walk `OK TO MARCH` after non-structural patch** → Tribunus-design dispatch only if no prior protocol exists; otherwise the prior protocol is preserved.
- **BLOCKER override-and-proceed** → Tribunus-design dispatch (the override does not bypass protocol authoring; the Imperator chose to dispatch despite the finding, and the protocol still needs to be written).

### Failure Handling

- **DESIGN_BLOCKED:** the plan has a gap that prevents protocol authoring (e.g., a task body too vague to claim-extract). Surface the blocker to the Imperator with the Tribunus's gap report. The Imperator decides: revise the plan (route back to plan-writing), accept the gap and dispatch with a partial protocol (Tribunus-executor falls back to Claude-side patrol on uncovered tasks), or halt the campaign.
- **Subagent crash / non-return:** announce failure. Re-dispatch once. If the second dispatch also fails, escalate to the Imperator. The Legion can still march on a partial-or-empty `tribune-protocol.md` because Tribunus-executor falls back to Claude-side patrol per the Patrol Stance fallback in `consilium-tribunus.md`.

### Imperator Review of Plan + Protocol Bundle

After DESIGN_COMPLETE, present the plan and the protocol to the Imperator together as one approval bundle:

> "The orders are sealed and the verification protocol is authored, Imperator. Plan: `<plan path>`. Protocol: `<case>/tribune-protocol.md`. Review both. Tell me if you want changes before I yield to The Legion Awaits."

The Imperator may request changes to the protocol without re-running plan authoring (the protocol is independently revisable). After approval, proceed to "The Legion Awaits."

After approval, proceed to "The Legion Awaits."
```

- [ ] **Step 3: Verify the modification**

Run: `grep -n "## Dispatching Tribunus-Design" claude/skills/edicts/SKILL.md`
Expected: one match.

Run: `grep "DESIGN_COMPLETE" claude/skills/edicts/SKILL.md`
Expected: at least 2 matches.

Run: `grep "tribune-design.md" claude/skills/edicts/SKILL.md`
Expected: one match.

- [ ] **Step 4: Commit**

```bash
git add claude/skills/edicts/SKILL.md claude/skills/references/verification/templates/tribune-design.md
git commit -m "feat(edicts): dispatch Tribunus-design after Custos OK TO MARCH; present plan+protocol bundle to Imperator"
```

---

## Task 15: Modify `/legion/SKILL.md` — spawn persistent Tribunus-executor + 15-task lifetime + SendMessage signaling

> **Confidence: Medium-High** — verified `/legion/SKILL.md` flow at lines 87-134 (per-task digraph: dispatch soldier → Tribunus mini-checkit → finding handling → next task). The persistent flow replaces "Dispatch Tribunus mini-checkit" with "Send completion signal via SendMessage to persistent tribune-w<N>; await verdict." Existing patrol template (`templates/mini-checkit.md`) is preserved as fallback dispatch shape. SendMessage primitive confirmed via Imperator-demonstrated transcript per spec §6.2.

**Files:**
- Modify: `claude/skills/legion/SKILL.md`
- Create: `claude/skills/references/verification/templates/tribune-persistent.md`

- [ ] **Step 1: Create the persistent-executor template**

Create `claude/skills/references/verification/templates/tribune-persistent.md` with this exact content:

````markdown
# Tribune Persistent-Executor Template

The Legatus invokes this template inside `/legion` to (a) spawn the persistent Tribunus-executor at Legion start, (b) signal task completions via `SendMessage`, (c) handle the 15-task lifetime restart, and (d) fall back to ephemeral Patrol stance per `templates/mini-checkit.md` when persistence degrades.

## Pre-spawn Conditions

- Plan exists at `<case>/plan.md`.
- `tribune-protocol.md` exists at `<case>/tribune-protocol.md` (written by `/edicts` Tribunus-design dispatch).
- Operator-side restart of the principales MCP has occurred since the last prompt-file change (verifiable by attempting a sample `verify_lane` call; if it returns "lane not found" for an execution-family lane, the MCP needs restart and the Legatus should halt and surface this).

## Spawn the Persistent Tribunus-Executor

Spawn at Legion start, BEFORE the first soldier dispatch. Naming convention: `tribune-w1` for the first window, `tribune-w2` for the second, etc.

The `Agent({...})` notation below is illustrative shorthand for the actual subagent-dispatch tool available in the runtime (e.g., `Task` or whichever primitive Claude Code exposes). The Legatus invokes the runtime's actual tool with the named parameters shown — particularly `name:` for `SendMessage` addressability. If the runtime's primitive uses different parameter names (e.g., `agent_name` instead of `name`), substitute accordingly; the load-bearing requirement is that the agent is named such that subsequent `SendMessage({to: <name>})` calls reach the same persistent process.

```
Agent({
  description: "Tribunus persistent-executor — window 1",
  subagent_type: "consilium-tribunus",
  name: "tribune-w1",  // makes addressable via SendMessage({to: "tribune-w1"})
  prompt: <see body below>
})
```

The `name` parameter is the harness primitive that makes the agent addressable while running. Documented in the Agent tool's `name` parameter. Confirmed via Imperator-demonstrated transcript: persistent named-agent dispatch, full context across turns, addressable by name or ID, occasional messages keep the agent warm.

**Pre-spawn smoke check.** Before the spawn, the Legatus performs a minimal smoke test: dispatch one ephemeral subagent with `name: "tribune-smoke"` and immediately `SendMessage({to: "tribune-smoke"})`. If the SendMessage succeeds and returns a reply within 30 seconds, persistence is confirmed at the harness level. If it fails (parameter rejected, agent not addressable, no reply within timeout), halt and surface the failure mode to the Imperator before proceeding — fall back to ephemeral Patrol per `templates/mini-checkit.md` for the entire legion. This protects against the load-bearing-primitive failure that B-1 specifically risks.

## Spawn Prompt Body

```
You are dispatched in PERSISTENT-EXECUTOR STANCE.

Read the Consilium Codex (your system prompt carries it). Read the Tribune Log Schema at:
  /Users/milovan/projects/Consilium/claude/skills/references/verification/tribune-log-schema.md

Read the verified protocol at:
  <CASE DIR>/tribune-protocol.md

If <CASE DIR>/tribune-log.md exists (prior window's log), read it as digest — note the prior interface_summary entries, prior verdicts, and `token_budget_at_boundary` from the last window. If it does not exist (first window), prepare to author it fresh with `schema_version: 1`, `plan_id` from the protocol, and `window_id: w1`.

Your window covers tasks <START_INDEX> through <END_INDEX> of the plan (15-task default; ±2 ergonomic if the plan ends within the boundary). Hold the protocol and the log digest in context across the window.

Per task, the Legatus will SendMessage you with:
  - task_id: <plan task identifier>
  - change_set: <files touched>
  - implementation_summary: <one paragraph>
  - sampled: true | false  (every 3rd task by plan-index)

When sampled=true:
  1. Run Claude-side patrol on Kimi-covered surfaces FIRST — before dispatching lanes. Capture the counterfactual verdict (PASS/CONCERN/FAIL) and findings. This counterfactual is uncontaminated by docket exposure.

When sampled=false (skip the counterfactual step):

For all tasks (sampled or not):
  2. Read the protocol's `tasks[].lanes_triggered`, `claims_per_lane`, `evidence_sources_per_lane`, and `model_profile_per_lane` for this task_id.
  3. Preload the evidence bundle per lane:
     - Diff slices from `git diff` over the change_set.
     - File-content slices for full-file context where the protocol names them.
     - Doctrine excerpts from the paths in evidence_sources_per_lane (read directly).
     - Prior-task interface summaries from the appended tribune-log.md entries.
  4. Dispatch each lane via `mcp__consilium-principales__verify_lane` with the protocol's claims, the assembled evidence_bundle, the named profile, and thinking_allowed=false.
  5. Run Claude-side patrol on surfaces NOT covered by Kimi:
     - `{} as Type` cast laundering and `any`-types-hiding-behind-correct-interfaces via Serena symbol tools (every task — non-negotiable per spec §7.2).
     - Any deviations the Kimi lanes flagged that require Deviation-as-Improvement judgment.
  6. Apply the Codex's Deviation-as-Improvement Rule: when a lane flags a deviation, decide improvement (SOUND-with-note) or drift (FAIL-with-note).
  7. Compute the integrated verdict: PASS / CONCERN / FAIL.
  8. Append an entry to <CASE DIR>/tribune-log.md per the schema, including kimi_dockets, claude_side_findings, deviation_as_improvement_notes, final_chain_of_evidence, cost_usd_kimi (sum of fired-lane docket cost_usd), and interface_summary (added/modified/removed function signatures from the diff). On sampled tasks, also write the counterfactual block.
  9. Reply to the Legatus's SendMessage with: verdict (PASS/CONCERN/FAIL), brief findings summary, and one-line chain of evidence per major finding.

Substrate degradation handling:
  - If `verify_lane` returns `refused` (substrate session-budget breach), `transport_failure`, or any synthetic-failure docket: log the failure in claude_side_findings, fall back to Claude-side patrol on the affected lane's surface, and continue. Do not retry within this task.
  - If transport failures persist across multiple consecutive tasks: report to the Legatus with verdict CONCERN and recommend halt-and-escalate.

15-task boundary handling:
  - When the Legatus sends "WINDOW_COMPLETE" with the final task_id of your window:
    - Write the final task entry as normal.
    - Append `token_budget_at_boundary: <your observed input-token usage>` to the final entry.
    - Acknowledge with "WINDOW_CLOSED window_id=<your window_id>".
    - Terminate. The Legatus will spawn the next window's Tribunus.

Reply rules:
  - Always reply to a SendMessage with a structured response: verdict + findings.
  - Never volunteer architectural opinions. Patrol depth.
  - Never write to plan.md, spec.md, or any file outside <CASE DIR>/tribune-log.md and the case-relative protocol references.
```

## Per-Task Signaling (after each soldier completes)

After each soldier reports DONE or DONE_WITH_CONCERNS, the Legatus signals the active Tribunus-executor:

```
SendMessage({
  to: "tribune-w<N>",  // current window
  message: <see body below>
})
```

### SendMessage Body

```
Task complete: <task_id>
Change set: <list of files touched>
Implementation summary: <one paragraph from soldier's DONE report>
Sampled: <true if (plan_index of this task) mod 3 == 0, else false>

Verify and reply.
```

The Tribunus-executor responds with the integrated verdict. The Legatus handles findings per the Codex (PASS → next task; CONCERN → note for Campaign review; FAIL → fix-soldier dispatch + re-verify; MISUNDERSTANDING-tagged FAIL → halt + escalate).

## 15-Task Boundary Restart

When the current window's task count reaches 15 (or 16-17 if within the ±2 ergonomic window AND the plan ends within those tasks):

1. Send the final-task signal as usual.
2. After the verdict, send "WINDOW_COMPLETE" to close the window:
   ```
   SendMessage({
     to: "tribune-w<N>",
     message: "WINDOW_COMPLETE — final task was <task_id>. Write token_budget_at_boundary and terminate."
   })
   ```
3. Wait for "WINDOW_CLOSED window_id=w<N>" acknowledgment.
4. Spawn the next window's Tribunus-executor with name `tribune-w<N+1>` using the same spawn template (the new instance reads the appended tribune-log.md at startup to get prior interface summaries).

## Crash Recovery

If a SendMessage to `tribune-w<N>` returns an error indicating the agent has terminated unexpectedly mid-window:

1. Do NOT attempt a second SendMessage to the same name.
2. Spawn a fresh Tribunus-executor with name `tribune-w<N>-recover` (preserve the window number; suffix denotes recovery).
3. The new instance reads the protocol and the appended tribune-log.md (including prior entries from the crashed window).
4. Re-send the most recent task signal that did NOT receive a verdict.
5. Continue normally. Loss is the in-window context the crashed instance held; bounded and acceptable.

## Persistence-Disabled Fallback (operator config)

If the operator has disabled persistence for any reason (B-1 does not specify a config flag — when added in B-2, this section will be amended), or if the spawn itself fails repeatedly, the Legatus falls back to ephemeral Patrol stance per `templates/mini-checkit.md` for the remainder of the legion. The fallback is logged in the campaign report's preamble.

## Independence Boundary at Campaign Review

The post-execution Campaign Review (Censor + Praetor + Provocator) does NOT receive `tribune-log.md`. Construct the Campaign Review dispatch prompts WITHOUT referencing the persistent-executor's per-task verdicts. The Campaign verifiers read the implementation, the spec, the plan, and the doctrine. Per Codex Independence Rule.
````

- [ ] **Step 2: Modify `/legion/SKILL.md` to spawn persistent Tribunus and signal via SendMessage**

Find the current "Read plan, extract tasks, read doctrine" digraph node referenced at line ~108-128.

Run: `grep -n '"Dispatch Tribunus mini-checkit"' claude/skills/legion/SKILL.md`
Expected: at least 2 matches in the digraph.

The digraph itself is illustrative; the load-bearing prose is in subsequent sections. Add a new section **after** the `## When to Summon the Legion` section and **before** `## The March` (or wherever the existing dispatch flow lives).

Run: `grep -n "^## Choosing the Soldier's Grade" claude/skills/legion/SKILL.md`
Expected: one match. Note the line.

Insert this section IMMEDIATELY BEFORE `## Choosing the Soldier's Grade`:

```markdown
## Persistent Tribunus-Executor (B-1)

At Legion start, BEFORE the first soldier dispatch, I spawn the persistent Tribunus-executor as a named addressable agent. This is the load-bearing change that B-1 introduced — per-task verification is no longer a fresh subagent dispatch but a `SendMessage` signal to a long-running Tribunus that holds plan-wide context across a 15-task window.

I read the template before spawn:
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`

The template specifies: spawn shape (name, subagent_type, prompt), per-task SendMessage body (task_id, change_set, summary, sampled flag), 15-task boundary restart pattern, crash recovery, and the persistence-disabled fallback to ephemeral Patrol via `templates/mini-checkit.md`.

**Pre-spawn check.** I verify `<case>/tribune-protocol.md` exists at Legion start. If absent, halt — the protocol must come from `/edicts` Tribunus-design dispatch BEFORE the legion marches. Surface the missing-protocol condition to the Imperator and route back to `/edicts`.

**Naming convention.** First window: `tribune-w1`. After 15-task boundary: `tribune-w2`. After crash mid-window: `tribune-w<N>-recover` (preserve the window number).

**Independence Boundary.** The persistent-executor's `tribune-log.md` is for audit and intra-plan context only. The Campaign Review (Censor + Praetor + Provocator) at the end of the legion DOES NOT receive `tribune-log.md`. The Campaign verifiers are ephemeral and independent per the Codex Persistent Orchestrator class — the privilege belongs to Tribunus-on-Legion executor stance only and does NOT generalize to the Campaign triad.

**`/march` is NOT changed.** The persistent pattern lives in `/legion`. `/march` retains the current solo-Legatus, no-Tribune-layer semantic for trivial plans. The Imperator chooses `/march` deliberately when ceremony is over-engineering for the task.

```

- [ ] **Step 3: Update the per-task verification phrasing in the existing flow**

Find the existing per-task description (around the "Dispatch Tribunus mini-checkit" digraph nodes and surrounding prose).

Run: `grep -n "I dispatch the Tribunus for mini-checkit" claude/skills/legion/SKILL.md`
Expected: one match (in the "When the Soldier Reports" section under DONE).

Replace this line:
```markdown
**DONE** — The task is complete as specified. I dispatch the Tribunus for mini-checkit per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` and `/Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md`. No task passes without verification — not one, not ever.
```

With:
```markdown
**DONE** — The task is complete as specified. I signal the persistent Tribunus-executor via `SendMessage({to: "tribune-w<N>", ...})` per `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/tribune-persistent.md`. The Tribunus replies with the integrated verdict (PASS/CONCERN/FAIL). If the persistent pattern is unavailable, I fall back to ephemeral Patrol via `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/mini-checkit.md` per the fallback procedure in the persistent template. No task passes without verification — not one, not ever.
```

- [ ] **Step 4: Update the digraph nodes**

Find the digraph block at lines 87-134.

Run: `grep -n "Dispatch Tribunus mini-checkit" claude/skills/legion/SKILL.md`
Expected: 2 matches in the digraph — one node DECLARATION (line ~99: `"Dispatch Tribunus mini-checkit" [shape=box];`) and one TRANSITION (line ~119: `"Soldier implements,\ntests, commits, self-reviews" -> "Dispatch Tribunus mini-checkit";`).

Use the Edit tool with `replace_all=true` to replace `"Dispatch Tribunus mini-checkit"` with `"Signal persistent Tribunus\n(SendMessage)"`. The literal string matches both occurrences identically; `replace_all` updates both in one operation.

If `replace_all` is unavailable, apply two edits with surrounding context to disambiguate:
- First occurrence (declaration): `old_string: "\"Dispatch Tribunus mini-checkit\" [shape=box];"`, `new_string: "\"Signal persistent Tribunus\\n(SendMessage)\" [shape=box];"`.
- Second occurrence (transition): `old_string: "-> \"Dispatch Tribunus mini-checkit\";"`, `new_string: "-> \"Signal persistent Tribunus\\n(SendMessage)\";"`.

After the edit, immediately verify both occurrences were updated:

Run: `grep -c "Dispatch Tribunus mini-checkit" claude/skills/legion/SKILL.md`
Expected: `0` (both occurrences replaced; if `1` remains, the digraph is in inconsistent state — re-apply the missing edit).

Run: `grep -c "Signal persistent Tribunus" claude/skills/legion/SKILL.md`
Expected: at least `2` (both digraph occurrences plus any prose mentions added in Steps 2-3).

- [ ] **Step 5: Verify the modifications**

Run: `grep -c "## Persistent Tribunus-Executor" claude/skills/legion/SKILL.md`
Expected: 1.

Run: `grep "tribune-persistent.md" claude/skills/legion/SKILL.md`
Expected: at least 2 matches (one in the new section, one in the DONE handling line).

Run: `grep "tribune-w" claude/skills/legion/SKILL.md`
Expected: at least 2 matches (in the new section + DONE handling line).

Run: `grep "tribune-log.md" claude/skills/legion/SKILL.md`
Expected: at least one match (in the Independence Boundary block).

- [ ] **Step 6: Commit**

```bash
git add claude/skills/legion/SKILL.md claude/skills/references/verification/templates/tribune-persistent.md
git commit -m "feat(legion): spawn persistent Tribunus-executor at Legion start; signal via SendMessage; 15-task lifetime; preserve mini-checkit fallback"
```

---

## Task 16: Final smoke verification — staleness, drift, build, end-to-end

> **Confidence: High** — all five verifications below are scripted or scriptable. The only manual step is the operator-side MCP restart, which is called out in the Files Map and the campaign report.

**Files:**
- Read-only verification — no file writes in this task

- [ ] **Step 1: Run the Codex drift check (post-Tasks 12+13)**

Run: `python3 claude/scripts/check-codex-drift.py`
Expected: no drift across all 6 user-scope agents. If drift is reported, return to Task 13 and re-run `--sync`.

- [ ] **Step 2a: Validate Tasks 10-11 persona-file edits survived to disk**

The staleness script (Step 2b) scans `claude/skills/tribune/` (the Medicus skill), NOT `~/.claude/agents/consilium-tribunus.md` (the persona). Tasks 10-11 edited the persona; staleness is silent on those edits. Validate persona edits directly:

Run: `head -9 ~/.claude/agents/consilium-tribunus.md`
Expected: matches the new frontmatter from Task 10 — `description:` includes "design stance" and "persistent-executor stance"; `tools:` includes `Write` and `mcp__consilium-principales__verify_lane`; `mcpServers:` includes `principales`.

Run: `grep -c "^### Patrol Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: `1` (renamed by Task 11 to "Patrol Stance (`/march` primary; `/legion` fallback)").

Run: `grep -c "^### Persistent-Executor Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: `1` (added by Task 11).

Run: `grep -c "^### Design Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: `1` (added by Task 11).

Run: `grep -c "^### Diagnosis Stance" ~/.claude/agents/consilium-tribunus.md`
Expected: `1` (preserved by Task 11).

Run: `grep -c "^### Tool-Use Discipline Across Stances" ~/.claude/agents/consilium-tribunus.md`
Expected: `1` (added by Task 11 per spec §7.1's tool-discipline mandate).

If any expectation fails, return to Tasks 10/11 and re-apply the missing edit.

- [ ] **Step 2b: Run the Tribune staleness check (regression guard against Medicus-skill drift)**

This step does NOT validate Tasks 10-11 directly. The staleness script scans `claude/skills/tribune/` (the Medicus invocation skill) — a different "tribune" than the persona file. Run as a regression guard against accidental drift in the Medicus skill caused by adjacent work in this campaign:

Run: `python3 claude/scripts/check-tribune-staleness.py --verbose`
Expected: no stale references, no broken reference targets, no test-writing discipline leaks. If issues are reported, fix them inline (the script's `--verbose` flag identifies the file:line of each issue). If issues report against files this campaign did not touch, halt and surface — drift came from a different campaign's commits and needs investigation outside B-1's scope.

- [ ] **Step 3: Run the principales build + test suite (post-Tasks 1-7)**

Run: `cd claude/mcps/principales && npm run build && npm test`
Expected: build succeeds with no TypeScript errors; all tests pass including `prompt-discovery.test.ts`.

- [ ] **Step 4: Verify file inventory (sanity check)**

Run: `ls claude/mcps/principales/prompts/task-*.md`
Expected: 4 files — `task-plan-match.md`, `task-no-stubs.md`, `task-domain-correctness.md`, `task-integration-prior.md`.

Run: `grep -c "family: execution" claude/skills/references/verification/lanes.md`
Expected: 4.

Run: `ls claude/skills/references/verification/templates/tribune-*.md`
Expected: 2 files — `tribune-design.md`, `tribune-persistent.md`.

Run: `ls claude/skills/references/verification/tribune-*.md`
Expected: 2 files — `tribune-protocol-schema.md`, `tribune-log-schema.md`.

- [ ] **Step 5: Verify `/edicts` and `/legion` modifications**

Run: `grep -c "Dispatching Tribunus-Design" claude/skills/edicts/SKILL.md`
Expected: at least 1.

Run: `grep -c "Persistent Tribunus-Executor" claude/skills/legion/SKILL.md`
Expected: at least 1.

Run: `grep -c "## Persistent Orchestrator Class" docs/codex.md`
Expected: 1.

- [ ] **Step 6: Verify `/march` was NOT modified by THIS plan (scope guard)**

The branch may carry commits unrelated to B-1 that touched `/march/SKILL.md` before this plan started (e.g., the prior `kimi-principales-v1` substrate commits). A naive `git diff main -- claude/skills/march/SKILL.md` would conflate those with B-1's scope. Compare against the branch's pre-B-1 baseline instead.

The pre-B-1 baseline SHA is the parent of the FIRST commit produced by this plan (Task 1's commit). Identify it:

Run: `git log --oneline --reverse claude/skills/references/verification/lanes.md | head -3`
This shows commits touching `lanes.md` in chronological order. The first commit on this branch from this plan is Task 1's "feat(principales): register execution-family lanes..." commit. The parent SHA of that commit is the pre-B-1 baseline.

Run: `git log --pretty=format:"%H %s" claude/skills/references/verification/lanes.md | grep "register execution-family lanes" | head -1 | cut -d' ' -f1` and call its parent `BASELINE_SHA`. Then:

Run: `git diff "${BASELINE_SHA}" -- claude/skills/march/SKILL.md`
Expected: empty output (no diff between baseline and HEAD on `/march`). If non-empty, this plan modified `/march` — halt and surface the diff to the Imperator.

Alternative (simpler if no commits on `/march/SKILL.md` exist on this branch at all):

Run: `git log --oneline HEAD -- claude/skills/march/SKILL.md`
Expected: no commits from this plan's session appear in the log. If any commit since the plan started shows up, halt.

- [ ] **Step 7: Document the operator-side restart in the legion's post-completion report**

This step has no edit. The campaign-completion report from `/legion` (or the Triumph skill) MUST reference the operator-restart requirement when reporting the legion home:

> "Imperator — campaign complete. **Operator action required:** restart the principales MCP / Claude Code session so the four new execution-family lane prompt files are picked up by the substrate at next process spawn (`server.ts:91-97`). Until restart, the new lanes return synthetic-failure dockets."

- [ ] **Step 8: Final commit (if any verification step produced fix-edits)**

If Steps 1-7 did NOT trigger any fix-edits, this task produces no commit. Skip the commit and report DONE.

If a verification step revealed an issue and was fixed inline, commit:

```bash
git add <fixed files>
git commit -m "chore(b-1): post-completion smoke fixes per Task 16"
```

---

## Plan Coverage Map (Spec → Task)

- Spec §1 Summary, §2 Background, §3 Goals — covered by the cumulative tasks below.
- Spec §4 Non-goals — enforced by Files Map "DO NOT MODIFY" callout (`/march`, `/tribune`, thinking-mode wiring).
- Spec §5 Constraints — Independence Rule preservation enforced by Codex amendment in Task 12; 15-task lifetime enforced by Task 11 (persona) and Task 15 (legion); fallback enforced by Task 11 + Task 15.
- Spec §6.1 Pre-flight Design Phase — Task 14 (`/edicts` modification + tribune-design.md template).
- Spec §6.2 Legion Execution Phase — Task 15 (`/legion` modification + tribune-persistent.md template).
- Spec §7.1 Tribunus Persona — Tasks 10-11.
- Spec §7.2 Execution-Time Lane Family — Tasks 1-5.
- Spec §7.3 `tribune-protocol.md` Artifact — Task 8 (schema reference); per-case file authored at runtime by Tribunus-design.
- Spec §7.4 `tribune-log.md` Artifact — Task 9 (schema reference); per-case file authored at runtime by Tribunus-executor.
- Spec §7.5 Substrate Amendment — Tasks 1-7 (lanes.md edits, prompt files, test, build, restart documentation).
- Spec §7.6 `/edicts` Skill — Task 14.
- Spec §7.7 `/legion` Skill — Task 15.
- Spec §7.8 `/tribune` Skill — explicitly NOT modified (Files Map "DO NOT MODIFY").
- Spec §7.9 Campaign Review Interaction — Independence Boundary text in Task 11 (persona) and Task 15 (legion); enforced by absence of `tribune-log.md` reference in Campaign Review dispatch.
- Spec §8 Doctrine Amendment — Task 12 (canonical edit) + Task 13 (sync to user-scope agents).
- Spec §9 Empirical Experiment — counterfactual sampling enforced by Task 11 (persona Stance Selection) and Task 15 (legion template); the experiment runs naturally as B-1 cases execute.
- Spec §10 Cost — no implementation surface; informational only.
- Spec §11 Failure Modes — fallback paths in Tasks 11 and 15.
- Spec §12 Verification — Task 16 (smoke).
