# Custos Edicts Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing `consilium-custos` agent into the `edicts` skill at his designed default lane — dispatched after Praetor+Provocator plan verification clears, before the Legion/March handoff — and add a per-case `decisions.md` audit artifact to CONVENTIONS as the recording substrate for verdicts and overrides.

**Architecture:** Five surfaces. Three in the verification reference layer (`templates/custos-verification.md`, `protocol.md` table row, `edicts/SKILL.md` dispatching phase + Authoring Awareness subsection); one in the case-folder convention (`docs/CONVENTIONS.md` Audit Artifacts section); one in this case folder (`smoke-tests.md` for Imperator manual gating). Custos's agent file and canonical persona are NOT modified — the dispatcher conforms to him.

**Tech Stack:** Markdown (skills, templates, protocol, conventions). Python (existing drift/staleness gate scripts). No new code.

---

## Pre-flight: Verify the ground

> **Confidence: High** — these checks confirm the plan's prerequisites before any edit fires.

Before Task 1, the executing agent (Soldier or Legatus) must confirm:

- [ ] **Pre-flight 1: $CONSILIUM_DOCS resolves.**

Run:

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/Consilium/docs}"
[ -d "$CONSILIUM_DOCS" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS" && echo OK
```

Expected: `OK`.

- [ ] **Pre-flight 2: Spec is at iteration 3 and committed.**

Run:

```bash
git -C /Users/milovan/projects/Consilium log --oneline -5 -- docs/cases/2026-04-26-custos-edicts-wiring/spec.md
```

Expected: latest commit on the spec is iteration 3 (commit `dd0f285` or successor).

- [ ] **Pre-flight 3: Decisions.md exists with the four iteration-2/3 entries.**

Run:

```bash
ls /Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/decisions.md
grep -c "^## Entry:" /Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/decisions.md
```

Expected: file present; count returns `4` (Q1, Q2, Q3, iteration count override).

- [ ] **Pre-flight 4: Drift and staleness scripts exist.**

Run:

```bash
ls /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py /Users/milovan/projects/Consilium/claude/scripts/check-tribune-staleness.py
```

Expected: both files listed.

- [ ] **Pre-flight 5: Custos agent file is in place at user scope.**

Run:

```bash
ls "$HOME/.claude/agents/consilium-custos.md"
```

Expected: file listed.

If any pre-flight fails, halt and escalate to the Imperator.

---

## Task 1: Amend `docs/CONVENTIONS.md` — add "Audit Artifacts" section

> **Confidence: High** — the Imperator stamped Q1 (option A — amend CONVENTIONS to add the artifact); the spec section "What's Needed in CONVENTIONS" names the schema verbatim; the placement is named.

**Files:**
- Modify: `docs/CONVENTIONS.md` (insert new `## Audit Artifacts` section between the "Primary Artifacts" content and `## Phase 1 Case Scan`)

- [ ] **Step 1: Read the current state of `docs/CONVENTIONS.md`**

Use the Read tool on `/Users/milovan/projects/Consilium/docs/CONVENTIONS.md`. Confirm the anchor text (`Retros use \`retro.md\`.` on a line by itself, followed by a blank line, then `## Phase 1 Case Scan`) is intact.

- [ ] **Step 2: Apply the Edit**

Tool: Edit
File: `/Users/milovan/projects/Consilium/docs/CONVENTIONS.md`

old_string:

````
Retros use `retro.md`.

## Phase 1 Case Scan
````

new_string:

`````
Retros use `retro.md`.

## Audit Artifacts

A case folder may include `decisions.md` — an append-only audit log for decisions, overrides, and verdicts that affect the case but are not part of `spec.md`, `plan.md`, or `STATUS.md`.

**Required when** any of the following fires for the case:

- Imperator overrides a verifier finding.
- Custos returns a verdict (any of `BLOCKER`, `PATCH BEFORE DISPATCH`, `OK TO MARCH`); both walks logged when re-walk fires.
- Plan modification gate (per the `edicts` skill "Dispatching the Custos" phase) triggers and the Imperator decides.
- Iteration count exceeded by Imperator authority (Codex auto-feed cap of 2 surpassed).
- Any other consequential decision the actor wants preserved separately from the spec/plan substrate.

**Optional when** the case has no overrides, no Custos verdicts, no gate decisions, and no iteration overrides.

**Schema:**

````markdown
---
case: <slug matching the case folder name>
---

# Decisions

Per-case decision and audit log. Append-only. Each entry is a decision, override, or verdict that affects the case but is not part of the spec, plan, or STATUS itself.

## Entry: YYYY-MM-DD — <short title>

**Type:** [decision | override | verdict | revert | other]
**Actor:** [Imperator | Consul | Legatus | Custos | Praetor | Provocator | Censor | Tribunus | Medicus]
**Trigger:** <what surfaced this — e.g., "Custos returned BLOCKER on bash quoting at plan.md task 3 step 2">
**Decision:** <what was decided>
**Rationale:** <why; cite finding text or evidence verbatim where applicable>
**Plan SHA:** <`git rev-parse HEAD:<plan-path>` short SHA at the time of the entry; required for `verdict` and `revert` entries; optional for other types>
````

Entries are appended in chronological order. Old entries are never edited or removed (append-only discipline). A redaction or correction is itself a new entry of type `revert` referencing the prior entry.

## Phase 1 Case Scan
`````

- [ ] **Step 3: Read the file again to verify**

Use the Read tool on `/Users/milovan/projects/Consilium/docs/CONVENTIONS.md`. Confirm:
- New `## Audit Artifacts` heading appears between `Retros use \`retro.md\`.` and `## Phase 1 Case Scan`.
- Schema example is wrapped in a 4-backtick fence (so the inner `---` frontmatter delimiter renders as code, not as a section break).
- No duplicate `## Phase 1 Case Scan` heading.

- [ ] **Step 4: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add docs/CONVENTIONS.md
git -C /Users/milovan/projects/Consilium commit -m "docs(conventions): add audit artifacts section (decisions.md schema)"
```

---

## Task 2: Create `claude/skills/references/verification/templates/custos-verification.md`

> **Confidence: High** — spec section "What's Needed on the Edicts Side" point 2 names the filename, the structural precedent (`mini-checkit.md` for single-agent shape), the heading-skeleton precedent (`plan-verification.md`), and the per-section content rules (When to Dispatch / Agents / Dispatch / After). The Re-walk Marker schema is named verbatim by the spec.

**Files:**
- Create: `claude/skills/references/verification/templates/custos-verification.md`

- [ ] **Step 1: Confirm the path is empty**

Run:

```bash
ls /Users/milovan/projects/Consilium/claude/skills/references/verification/templates/custos-verification.md 2>&1 || echo "OK: file does not exist"
```

Expected: `OK: file does not exist` (or `No such file or directory`).

- [ ] **Step 2: Write the file**

Tool: Write
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/custos-verification.md`

content:

`````markdown
# Custos Verification Template

Dispatches the Custos to verify dispatch-readiness on a plan after Praetor+Provocator have cleared. Used by the edicts skill before "The Legion Awaits."

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else.

---

## When to Dispatch

After Praetor+Provocator have "returned clean" per the five-point gate defined in `claude/skills/edicts/SKILL.md` "Dispatching the Custos" phase:

1. No MISUNDERSTANDING currently in escalation.
2. No unresolved GAPs after the 2-iteration cap.
3. All CONCERNs explicitly handled (split-verifier conflict — one verifier SOUND, the other CONCERN — counts as CONCERN for handling purposes).
4. No silent plan modifications since plan verification cleared (plan-modification gate via `git diff <plan-path>` against the SHA the plan-verification dispatch saw).
5. Imperator overrides recorded in `decisions.md` (type `override`).

The Imperator may bypass via the strict skip whitelist defined in the dispatching phase. Default: dispatch.

---

## Agents

**Custos alone.** No parallel partner. Custos's walks are operational, not adversarial — pairing him would either duplicate his walks or pollute his fresh-eyes discipline.

Do NOT use `run_in_background`. The dispatcher waits for Custos to return before proceeding to "The Legion Awaits" or to a re-walk.

---

## Dispatch: Custos

```
Agent tool:
  subagent_type: "consilium-custos"
  description: "Custos: verify plan dispatch-readiness"
  mode: "auto"
  prompt: |
    ## The Artifact

    The following plan requires dispatch-readiness verification. It implements
    the spec included below. Both carry inline confidence annotations.

    ### The Plan
    {PASTE FULL PLAN CONTENT}

    ### The Spec It Implements
    {PASTE FULL SPEC CONTENT}

    ## Domain Knowledge

    Read directly from `$CONSILIUM_DOCS/doctrine/` for any walk that requires
    domain context. Walk 4 (Baseline) explicitly requires:
    - `$CONSILIUM_DOCS/doctrine/known-gaps.md`

    Other doctrine files are accessible via
    `$CONSILIUM_DOCS/doctrine/domain/MANIFEST.md` when a walk surfaces a
    domain question. Pre-loading excerpts is permitted by the protocol but
    not required by this template.

    ## Context Summary

    {PASTE STRUCTURED CONTEXT SUMMARY — same one used for Praetor+Provocator
    dispatch, verbatim. Independence Rule: no raw conversation, no Praetor or
    Provocator findings, no consul framing of the plan-verification cycle.}

    ## Re-walk Marker

    {OMIT THIS SECTION ON FIRST WALK.

    SECOND-WALK ONLY — populate with unified diff hunks of the patches applied
    between the first walk's PATCH BEFORE DISPATCH verdict and this re-walk.

    Format: standard `git diff` unified-hunk format. Line numbers reference
    the plan file. Multiple hunks separated by blank lines.

    Allowed content: diff hunks ONLY.
    Forbidden: prose, attribution to verifiers (no "Custos finding 1," no
    "addresses prior issue"), rationale text, references to finding categories
    (no MISUNDERSTANDING/GAP/CONCERN/SOUND tags), commentary on intent.

    The diff IS the marker. Walk 6 reads the diffs to detect cross-references
    that became stale in the unmodified surrounding sections. The Independence
    Rule is preserved at the conversation level via a Custos-specific
    carve-out — diff hunks of the artifact are revision metadata, not framing
    about prior verifier findings.}

    ## Your Mission

    You are Marcus Pernix, the Custos. Run your Six Walks per your agent file:

    1. Walk the Shell — read every bash block as zsh would execute it.
    2. Walk the Env — classify every runtime assumption.
    3. Walk the Tests — trace fixture → setup → action → assertion.
    4. Walk the Baseline — cross-check regression gates against `known-gaps.md`.
    5. Walk the Blast Radius — grep the other repo for negative claims.
    6. Walk the Document — re-read the artifact cold for stale wording.

    Cap findings at 8, ordered by execution risk.

    Produce one verdict — exactly one — from your three-verdict overlay:
    BLOCKER, PATCH BEFORE DISPATCH, or OK TO MARCH. No fourth option. No soft
    verdicts.

    Tag each finding with one of the four Codex categories (MISUNDERSTANDING,
    GAP, CONCERN, SOUND) plus the Walk that surfaced it. Provide chain of
    evidence for every finding.

    Include the mandatory **Do Not Widen** final section listing the
    magistrate-territory temptations you resisted (deep architecture critique
    → Provocator; plan-level reordering → Praetor; spec re-litigation →
    Censor; product scope → Imperator).

    ## Output Format

    Open with the verdict line — required, literal prefix `Verdict:`
    (case-sensitive on the prefix), value one of `BLOCKER`,
    `PATCH BEFORE DISPATCH`, `OK TO MARCH` (uppercase). No bold around the
    prefix. Trailing punctuation, surrounding whitespace, and bold around the
    value are tolerated by the dispatcher's parser.

    ```
    Verdict: <BLOCKER | PATCH BEFORE DISPATCH | OK TO MARCH>
    ```

    Then the findings, each tagged per Codex format with chain of evidence:

    **[CATEGORY] — [Walk N — brief title]**
    - Location: [file:line or section reference]
    - Failure mode: [what would fail at dispatch, or what claim is false]
    - Patch: [minimal change that resolves it, or "n/a" for SOUND/CONCERN]

    Then the mandatory **Do Not Widen** section.
```

---

## After Custos Returns

The dispatcher (consul-as-edicts in main session) acts on the verdict per the "Dispatching the Custos" phase in `edicts/SKILL.md`. Summary:

- **`OK TO MARCH`** → present attributed summary to Imperator, proceed to "The Legion Awaits."
- **`PATCH BEFORE DISPATCH`** → apply patches, re-dispatch Custos once with `## Re-walk Marker` populated. Maximum one re-walk.
- **`BLOCKER`** → halt, present finding to Imperator, await override-or-revise decision. Override requires explicit `override confirmed` (matcher tolerance per dispatching phase). Override recorded in `decisions.md` (type `override`).

**Failure modes:**

- Non-return / partial-result without parseable verdict → `BLOCKER` + escalate.
- Verdict line malformed (per the parsing contract in dispatching phase) → `BLOCKER` + escalate.
- Verdict-vs-finding-tag contradiction → honor verdict, flag contradiction to Imperator, log `decisions.md` entry.

All Custos verdicts (and any override) are logged in `decisions.md` per the CONVENTIONS audit-artifact schema.
`````

- [ ] **Step 3: Read the file to verify content landed**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/custos-verification.md`. Confirm:

- File starts with `# Custos Verification Template`.
- Sections present in order: When to Dispatch, Agents, Dispatch: Custos, After Custos Returns.
- The `Agent tool:` block is wrapped in a 3-backtick fence; the inner `Verdict:` example block uses 3-backtick fence inside the prompt body (renders as nested code).
- File ends with the `decisions.md per the CONVENTIONS audit-artifact schema.` paragraph.

- [ ] **Step 4: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add claude/skills/references/verification/templates/custos-verification.md
git -C /Users/milovan/projects/Consilium commit -m "feat(verification): add custos verification template"
```

---

## Task 3: Add Custos row to `protocol.md` dispatch table

> **Confidence: High** — spec section "What's Needed on the Edicts Side" point 3 names the exact row text. Spec also says "No other protocol changes" — this task touches only the table.

**Files:**
- Modify: `claude/skills/references/verification/protocol.md` (insert one row after "Adversarial stress-test" and before "Per-task mini-checkit" in the dispatch table at section 2)

- [ ] **Step 1: Read protocol.md to confirm the dispatch table is intact**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md`. Confirm the table at section 2 (currently lines 43–50) reads:

```
| Role | Subagent type |
|-|-|
| Spec verification | `consilium-censor` |
| Plan verification | `consilium-praetor` |
| Adversarial stress-test (spec, plan, or campaign) | `consilium-provocator` |
| Per-task mini-checkit | `consilium-tribunus` |
| Implementation and GAP fix | `consilium-soldier` |
| Reconnaissance scout | `consilium-scout` |
```

- [ ] **Step 2: Apply the Edit**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md`

old_string:

```
| Adversarial stress-test (spec, plan, or campaign) | `consilium-provocator` |
| Per-task mini-checkit | `consilium-tribunus` |
```

new_string:

```
| Adversarial stress-test (spec, plan, or campaign) | `consilium-provocator` |
| Dispatch-readiness verification | `consilium-custos` |
| Per-task mini-checkit | `consilium-tribunus` |
```

- [ ] **Step 3: Read protocol.md to verify**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md`. Confirm the new row appears between "Adversarial stress-test" and "Per-task mini-checkit", and the table renders cleanly (7 data rows total).

- [ ] **Step 4: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add claude/skills/references/verification/protocol.md
git -C /Users/milovan/projects/Consilium commit -m "chore(verification): add custos row to dispatch table"
```

---

## Task 4: Insert "Authoring for Custos" subsection in `edicts/SKILL.md`

> **Confidence: Medium** — spec gives a placement range ("after 'Are my symbols consistent?' paragraph, before the `---` separator") with an explicit predecessor-line cite at line 245 (Symbols), and writes the heading literally as `## Authoring for Custos` (H2). Plan honors the spec-literal predecessor (insertion immediately follows Symbols paragraph, preserves "Fixes are made inline..." as Review Before Dispatch's closing sentinel) but uses **H3** to subordinate the new section to its parent "Review Before Dispatch" — `## Authoring for Custos` (H2) would split the parent section mid-flow because "Fixes are made inline..." is the parent's closing sentinel, and an interleaving H2 makes it orphan. The H3 deviation must be recorded in `decisions.md` (see Step 5 below) so the Imperator may override.

**Files:**
- Modify: `claude/skills/edicts/SKILL.md` (insert `### Authoring for Custos` H3 subsection immediately after the "Are my symbols consistent?" paragraph, before the "Fixes are made inline..." paragraph)

- [ ] **Step 1: Read SKILL.md to confirm the anchor**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`. Confirm the anchor text (the "Are my symbols consistent?" paragraph immediately followed by a blank line and then "Fixes are made inline...") is intact.

- [ ] **Step 2: Apply the Edit**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`

old_string:

```
**Are my symbols consistent?** `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7 is not a clever evolution — it is a bug I have written into the Legatus's hand, costing him an hour when he hits it. Names match. Types match. Signatures match. I do not leave discovery work for soldiers.

Fixes are made inline. I do not re-review — I fix and advance. The march does not wait for a consul who second-guesses his own hand.
```

new_string:

````
**Are my symbols consistent?** `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7 is not a clever evolution — it is a bug I have written into the Legatus's hand, costing him an hour when he hits it. Names match. Types match. Signatures match. I do not leave discovery work for soldiers.

### Authoring for Custos

The Custos walks the operational layer the magistrates leave intact — shell quoting, env classification, baseline test status, blast-radius negative claims, document coherence after revision. Plans that touch shell, env, or baseline must be authored with his discipline in mind, not patched after he flags them.

**Quoting discipline.** Bracket-paths in bash blocks must be quoted: `cd "src/app/products/[id]"`, not `cd src/app/products/[id]`. zsh treats unquoted `[id]`, `**`, `?(...)` as glob characters; the soldier hits "no matches found" and the campaign halts before the first command runs.

**Env classification.** Every runtime variable named in a bash block belongs to exactly one bucket: exported env var, dotenv file, process-loaded env, registered tool name, MCP/app name, network resource, repo-local file. State the source explicitly when a guard depends on the variable. A `[ -n "$X" ]` check against a dotenv-loaded var the running shell never exported is a falsely-passing guard.

**Baseline.** Any "run full suite" or "all tests pass" claim is a regression gate that depends on baseline. Cross-check against `$CONSILIUM_DOCS/doctrine/known-gaps.md`. If known-bad tests fall in the suite, the gate must scope around them or accept their failure explicitly.

**Required reading when authoring plans that touch shell, env, or baseline:** `~/.claude/agents/consilium-custos.md` lines 100–110 — the "How I Work — The Six Walks" section. Read it directly. Reasoning from memory is forbidden by the Codex; the file is the source.

The Authoring Awareness raises the content bar. It does not change the plan template schema — tasks still use the existing `### Task N` / `**Files:**` / `- [ ] **Step**` shape.

Fixes are made inline. I do not re-review — I fix and advance. The march does not wait for a consul who second-guesses his own hand.
````

- [ ] **Step 3: Read SKILL.md to verify**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`. Confirm:

- New `### Authoring for Custos` H3 heading appears immediately after the "Are my symbols consistent?" paragraph.
- The paragraph beginning "The Custos walks the operational layer..." is present.
- The four labeled paragraphs (Quoting discipline / Env classification / Baseline / Required reading) are present in that order.
- The closing paragraph beginning "The Authoring Awareness raises the content bar..." is present.
- The "Fixes are made inline..." paragraph still follows the new subsection (preserved as Review Before Dispatch's closing sentinel).
- The `---` separator and `## Dispatching Verification` heading still follow.

- [ ] **Step 4: Record the H3 deviation in `decisions.md`**

Append to `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/decisions.md`:

```
## Entry: 2026-04-26 — Task 4 H3 deviation from spec literal H2

**Type:** decision
**Actor:** Consul
**Trigger:** Provocator GAP on plan iteration 1 — spec text writes `## Authoring for Custos` (H2) but spec wording calls the addition a "subsection." H2 placement between "Are my symbols consistent?" paragraph and "Fixes are made inline..." paragraph would split the parent `## Review Before Dispatch` section mid-flow and orphan its closing sentinel.
**Decision:** Use H3 (`### Authoring for Custos`) instead of spec-literal H2 to subordinate the new section to its parent "Review Before Dispatch."
**Rationale:** The spec uses the word "subsection" (parent-child relationship) but writes H2 markup (sibling relationship). The two are contradictory at the markdown structural level. H3 honors the conceptual subsection wording and preserves "Fixes are made inline..." as the parent section's closing sentinel; H2 would force a structural choice (orphan the closer, or move the closer above the new H2 — both invasive). Codex Deviation-as-Improvement Rule applies: cleaner structure is the better path. Imperator may override at the legion-awaits review by directing a re-edit to H2 (one-character change in the SKILL.md edit).
**Plan SHA:** <commit SHA after Task 4 commit lands>
```

- [ ] **Step 5: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add claude/skills/edicts/SKILL.md docs/cases/2026-04-26-custos-edicts-wiring/decisions.md
git -C /Users/milovan/projects/Consilium commit -m "feat(edicts): add authoring for custos subsection (H3 deviation logged)"
```

---

## Task 5: Insert "Dispatching the Custos" phase in `edicts/SKILL.md`

> **Confidence: Medium** — placement is High (between the `---` after "Dispatching Verification" and `## The Legion Awaits`); the operational substrate (skip syntax, verdict parsing, override matcher, failure handling, plan-modification gate) was iterated multiple times against verifier findings across spec iterations 1–3 and the result is detailed but the long-tail of operational corner cases may surface fresh. The Medium reflects the realistic state.

**Files:**
- Modify: `claude/skills/edicts/SKILL.md` (insert new `## Dispatching the Custos` H2 phase between the `---` separator that closes "Dispatching Verification" and the `## The Legion Awaits` heading)

- [ ] **Step 1: Read SKILL.md to confirm the anchor (post-Task-4 line numbers)**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`. Confirm the anchor text (end of "Dispatching Verification" content — the paragraph beginning "When findings are handled..." — followed by blank line, `---`, blank line, `## The Legion Awaits`) is intact. Note: line numbers will have shifted by ~12 lines after Task 4 landed; the Edit tool uses text anchors, not line numbers, so this is fine.

- [ ] **Step 2: Apply the Edit**

Tool: Edit
File: `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`

old_string:

```
When findings are handled, I present the summary to the Imperator with each finding attributed to the agent who caught it. Nothing is hidden. Nothing is smoothed over. He deserves to see the verifiers' work, not my selective rendering of it.

---

## The Legion Awaits
```

new_string:

`````
When findings are handled, I present the summary to the Imperator with each finding attributed to the agent who caught it. Nothing is hidden. Nothing is smoothed over. He deserves to see the verifiers' work, not my selective rendering of it.

---

## Dispatching the Custos

The magistrates have cleared the plan. They verified what the artifact says and means. One walk remains — Marcus Pernix verifies what the artifact does when a soldier executes it on this machine, in this shell, against this environment.

I dispatch the Custos only when Praetor+Provocator are "returned clean" — five conditions must hold:

1. **No MISUNDERSTANDING currently in escalation.** A MISUNDERSTANDING that was escalated to the Imperator and resolved (Imperator clarified, plan revised, decision logged in `decisions.md` of type `decision`) closes the escalation. The revised plan is eligible for Custos. Forced re-dispatch of Praetor+Provocator on every MISUNDERSTANDING resolution is NOT required — case-by-case at the Imperator review gate handles the rare re-skinned-misunderstanding risk.
2. **No unresolved GAPs after the 2-iteration cap.** GAPs the consul addressed in the auto-feed loop count as resolved. GAPs that exhausted the cap are escalations and disqualify the plan from Custos until the Imperator resolves them and the resolution is logged in `decisions.md`.
3. **All CONCERNs explicitly handled.** Adopted-and-revised, or rejected with reasoning per protocol section 6. **Split-verifier sub-clause:** when Praetor returns CONCERN on a surface and Provocator returns SOUND on the same surface (or vice versa), the SOUND from one verifier does NOT auto-neutralize the CONCERN from the other. The consul must explicitly handle the CONCERN and record the resolution in `decisions.md`.
4. **No silent plan modifications since plan verification cleared.** Run `git diff <plan-path>` (working tree vs HEAD; this assumes the standard flow — the consul commits the plan as part of plan-writing close-out, before announcing "Dispatching Praetor and Provocator"). If the diff is non-empty, announce: *"Plan modified since plan verification cleared — diff: <output>. Reply 'redispatch' to re-run plan verification, or 'proceed' to dispatch Custos."* Match the reply against the two tokens (case-insensitive, after the same trim rule used for skip syntax): `redispatch` or `re-dispatch` triggers re-run; `proceed`, `continue`, `go` triggers dispatch. Anything else (including bare `no`, `yes`, or vague replies) triggers one clarification: *"Reply 'redispatch' or 'proceed' — anything else needs clarification."* Log the gate decision in `decisions.md` (type `decision`). If the consul edited the plan post-verification but pre-commit (a flow violation), surface this directly to the Imperator: *"Plan was edited after plan verification but before being committed — the diff baseline is lost. Re-dispatch plan verification?"*
5. **Imperator overrides recorded.** Override means the Imperator explicitly directed the consul against the verifier's recommendation (e.g., *"revert that fix"* or *"proceed despite this finding"*) — log in `decisions.md` (type `override`). Implicit acceptance (Imperator agreed with consul handling without overriding) does NOT require a separate entry — the consul's handling is already in the summary.

I announce: "Dispatching the Custos for dispatch-readiness verification."

The Imperator may say "skip" to bypass. The recognition contract is **strict** (tighter than the existing Praetor+Provocator pattern — explicit grammar makes operator behavior auditable). Whitelist (case-insensitive, after the trim rule below):

- `skip`
- `skip custos`
- `no`
- `no custos`
- `no, skip`
- `nope`
- `cancel`
- `none`
- `don't`
- `stop`

**Trim rule** before matching: strip surrounding `**` (bold), `*` (italic), `` ` `` (code), `"` and `'` (straight quotes), `“`, `”`, `‘`, `’` (curly quotes — macOS auto-substitutes these for straight quotes by default), leading `> ` (blockquote), leading `- ` and `* ` (list markers), trailing whitespace, and trailing punctuation (`.`, `,`, `;`, `:`, `!`, `?`). Then normalize any remaining curly quotes to straight quotes (so smart-quote `don’t` matches `don't` in the whitelist). Lowercase. Compare against the whitelist. The trim+normalize rule is consistent with the override matcher's quote handling in the BLOCKER override flow below — both code paths strip and normalize quotes the same way.

Vague replies that do not match the whitelist (`not now`, `maybe later`, `up to you`, `hmm`, `idk`, `unsure`) trigger one clarification: *"Skip Custos, or proceed?"* Anything else proceeds to dispatch.

A skip declaration is honored only **before** the Agent tool call fires. Once in flight, the dispatcher acknowledges: *"Custos is mid-walk; verdict will land in 2–3 minutes. You can override the verdict on return."* On verdict return, present with note: *"Custos returned <verdict>; you pre-skipped. Proceed past the verdict, or honor it?"*

I read the protocol and the template before dispatch:

- `/Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md`
- `/Users/milovan/projects/Consilium/claude/skills/references/verification/templates/custos-verification.md`

I follow the template exactly. Custos walks alone — no parallel partner. He returns one of three verdicts.

### Verdict Action

Every `decisions.md` entry of type `verdict` or `revert` written from this phase MUST populate the `**Plan SHA:**` field with the output of `git rev-parse HEAD:<plan-path>` at the moment of the entry. The session-resumption check below depends on this SHA being recorded.

- **`OK TO MARCH`** — present the attributed summary to the Imperator (verdict, findings list including SOUND findings, mandatory Do Not Widen section). Proceed to "The Legion Awaits."

- **`PATCH BEFORE DISPATCH`** — apply the inline patches Custos named. Re-dispatch Custos once with a `## Re-walk Marker` section in the prompt naming the patches applied. **This is the only re-walk permitted.**
  - Marker contains **only** unified diff hunks. No prose, no attribution, no rationale, no reference to finding categories. (Schema lives in the template at `templates/custos-verification.md`.)
  - Patches between walks must be Custos-mandated only. The consul does NOT bundle unrelated edits (typo fixes, post-CONCERN revisions, scope expansions). If the consul notices an unrelated issue mid-patch, complete the patch, let Custos re-walk, then handle the unrelated issue afterward through normal channels.
  - Second walk `OK TO MARCH` → present summary, proceed to "The Legion Awaits."
  - Second walk `BLOCKER` → halt and escalate. Patches stay applied on disk (no auto-revert). Log both walks in `decisions.md` (type `verdict` for each) plus the patches applied between them. Imperator decides next steps; if "revert," the consul reverts via Edit and logs a `revert` entry in `decisions.md` referencing the prior `verdict` entry.
  - Second walk `PATCH BEFORE DISPATCH` again → escalate (treated as exhausted under the Codex 2-iteration cap).

- **`BLOCKER`** — halt the workflow. Show the Imperator the finding(s) and chain of evidence. The Imperator decides:
  - **Patch and re-dispatch full Praetor+Provocator+Custos cycle.**
  - **Patch and re-dispatch Custos only** (counted as the one allowed re-walk under PATCH BEFORE DISPATCH semantics; a second non-OK escalates).
  - **Override and proceed.** Require explicit confirmation: *"BLOCKER override — proceed to legion-awaits with [finding title] unresolved? Confirm with 'override confirmed.'"*
    - Override matcher tolerance: case-insensitive; trim surrounding whitespace, punctuation, and quotes; accept `override`, `override confirmed`, `OVERRIDE CONFIRMED`, `"override confirmed"`. Reject confirmations with extra content beyond punctuation/whitespace/quotes (e.g., `override confirmed, but be careful` triggers re-prompt: *"Confirmation must stand alone. Confirm with just 'override confirmed' or restate."*).
    - Override recorded in `decisions.md` (type `override`) with finding text and Imperator confirmation.
  - **Escalate beyond the consul.** The Imperator may invoke a different skill or pause the campaign entirely.

### Verdict Parsing Contract

The dispatcher reads the line beginning with `Verdict:` (literal prefix, case-sensitive on the prefix). Expected format:

```
Verdict: <BLOCKER | PATCH BEFORE DISPATCH | OK TO MARCH>
```

**Tolerance rules**, applied in order:

1. Strip leading and trailing whitespace from the entire line.
2. Strip surrounding `**` (markdown bold) from the verdict value.
3. Strip trailing punctuation (`.`, `,`, `;`, `:`, `!`, `?`) from the value.
4. Whitespace between `Verdict:` and the value is optional and stripped (so `Verdict:BLOCKER`, `Verdict: BLOCKER`, and `Verdict:  BLOCKER` all parse the value as `BLOCKER`).
5. Match the resulting value against the three exact uppercase strings.

**Parser scope:** scan top-to-bottom; ignore lines inside fenced code blocks (between ` ``` ` markers) to avoid demonstration-line collisions. The first matching `Verdict:` line outside any code fence is authoritative.

**Malformed cases** (treat as `BLOCKER` + escalate, with note *"Custos verdict malformed — treated as BLOCKER, full report attached"*):

- Missing `Verdict:` line outside any code fence.
- Multiple `Verdict:` lines outside code fences (ambiguous).
- Lowercase or mixed-case verdict value (`blocker`, `Blocker`).
- Verdict value with extra content beyond strippable punctuation/whitespace/bold (`BLOCKER (with caveats)`, `BLOCKER for now`, `BLOCKER OK TO MARCH`).
- Markdown-bold around the prefix (`**Verdict:**`) — the prefix match is case-sensitive on `Verdict:` literal; bolded prefix does not match.
- Verdict line with a value that is none of the three accepted strings.

### Verdict Authority on Inconsistency

If Custos's report contains contradictory finding tags (e.g., verdict `OK TO MARCH` with a finding tagged MISUNDERSTANDING, or verdict `BLOCKER` with no MISUNDERSTANDING or dispatch-preventing-GAP findings):

1. Honor the verdict (Custos's persona authority over the three-verdict overlay).
2. Flag the contradiction to the Imperator with the full Custos report attached: *"Custos's verdict and finding tags contradict — verdict honored, contradiction surfaced for review."*
3. Log a `decisions.md` entry (type `decision`) noting the contradiction and the dispatcher's resolution.

The contradiction is a Custos report bug, not a dispatcher decision.

### Failure / Abort Handling

- **Non-return** (subagent crash, OOM, network timeout, infinite loop): the Agent tool's completion signal indicates non-return.
- **Partial-result-with-failure**: if the Agent tool returns `failed` with a partial body, attempt to parse a verdict from the partial body per the parsing contract above. If a valid verdict parses, honor it with note *"Custos failed mid-report; verdict parsed from partial output."* If no valid verdict parses, treat as non-return: `BLOCKER` + escalate with note *"Custos dispatch did not return — treated as BLOCKER, no verdict available."*
- **Mid-dispatch skip**: see Skip Syntax above. Skip honored only before the Agent tool fires; in-flight dispatch runs to completion; on return, present verdict with the pre-skip note.
- **Re-walk inheritance**: the second walk after `PATCH BEFORE DISPATCH` inherits the same failure semantics — non-return on the second walk treats as `BLOCKER` + escalate. There is no re-re-walk.
- **Session termination**: if the main session terminates during a Custos dispatch, the in-flight Agent call is orphaned. On session resumption, run `git rev-parse HEAD:<plan-path>` to get the current plan SHA, then scan `decisions.md` for the most recent `verdict` entry whose `**Plan SHA:**` field matches. If no matching entry is present, the dispatch did not complete (or did not log) — announce: *"Custos dispatch from prior session has no recorded verdict for plan SHA `<sha>`. Re-dispatch, or proceed without?"* The Imperator decides; either choice is logged in `decisions.md` (type `decision`, with the current plan SHA recorded).

After verdict handling completes (or override is confirmed), proceed to "The Legion Awaits."

---

## The Legion Awaits
`````

- [ ] **Step 3: Read SKILL.md to verify**

Use the Read tool on `/Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md`. Confirm:

- New `## Dispatching the Custos` H2 heading appears between the `---` after "Dispatching Verification" and the `## The Legion Awaits` heading.
- All five "returned clean" gate conditions are present and numbered 1–5.
- Skip whitelist contains exactly 10 entries AND each entry matches the spec verbatim character-by-character: `skip`, `skip custos`, `no`, `no custos`, `no, skip`, `nope`, `cancel`, `none`, `don't`, `stop` (verify the apostrophe in `don't` is U+0027 not U+2019; verify the comma-space in `no, skip` is exactly `,` then one space). A typo in any phrase passes a count check but breaks Test 2 in `smoke-tests.md`.
- Trim rule lists straight quotes (`"`, `'`) AND curly quotes (`“`, `”`, `‘`, `’`) AND the Unicode normalization step.
- Gate #4 prompt uses the explicit reply tokens `redispatch` / `proceed` (not the older free-form "Re-dispatch plan verification, or proceed to Custos?" phrasing).
- Verdict Action subsection opens with the Plan SHA recording requirement.
- Verdict Action subsection covers all three verdicts (OK TO MARCH, PATCH BEFORE DISPATCH, BLOCKER).
- Verdict Parsing Contract subsection lists all six malformed cases.
- Failure / Abort Handling subsection covers all five failure modes; session-termination clause references the `**Plan SHA:**` field in decisions.md verdict entries.
- The new phase ends with "After verdict handling completes (or override is confirmed), proceed to 'The Legion Awaits.'" and a `---` separator before `## The Legion Awaits`.

- [ ] **Step 4: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add claude/skills/edicts/SKILL.md
git -C /Users/milovan/projects/Consilium commit -m "feat(edicts): wire custos dispatch between plan verification and legion"
```

---

## Task 6: Collateral-safety gates and smoke-test checklist

> **Confidence: High** — the collateral-safety gates are mechanical; smoke-test scenarios are mechanical applications of the spec's "Verification Expectations" section to the concrete dispatcher behavior.

**What these gates DO and DO NOT verify** (Provocator GAP on plan iteration 1, addressed inline):

The drift check (`check-codex-drift.py`) only validates that the canonical Codex matches the 6 user-scope agent files' Codex sections at `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,custos}.md`. It does NOT scan any file this plan modifies (`docs/CONVENTIONS.md`, `claude/skills/edicts/SKILL.md`, `claude/skills/references/verification/protocol.md`, the new template, the smoke-tests file).

The staleness check (`check-tribune-staleness.py`) only scans `claude/skills/tribune/` (and the plugin cache mirror). It does NOT scan any file this plan modifies.

**These gates therefore verify "no collateral damage to tribune wiring or agent-Codex parity," not "this work is clean."** Their value here is collateral-damage detection: confirming this work did not accidentally break adjacent systems. The actual verification of THIS work happens via:
1. Per-task Read-after-Edit verification steps (Step 3 of Tasks 1, 3, 4, 5; Step 3 of Task 2 and Task 6).
2. The 9 manual smoke tests in `smoke-tests.md` (run by the Imperator).
3. The CONVENTIONS lint (Step 6 below).

**Files:**
- Create: `docs/cases/2026-04-26-custos-edicts-wiring/smoke-tests.md`
- Run: `python3 /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py` (collateral-safety gate)
- Run: `python3 /Users/milovan/projects/Consilium/claude/scripts/check-tribune-staleness.py` (collateral-safety gate)

- [ ] **Step 1: Run the Codex drift collateral-safety gate**

Run:

```bash
python3 /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py
```

Expected: clean exit (exit code 0); no drift reported. **This gate does not validate this work's edits** — the script only checks 6 user-scope agent files, none of which this work modifies. A clean pass here means: this work did not accidentally break agent-Codex parity. If drift IS reported, the drift pre-existed this work; surface to the Legatus and the Legatus decides whether to address it before merging this work.

- [ ] **Step 2: Run the tribune staleness collateral-safety gate**

Run:

```bash
python3 /Users/milovan/projects/Consilium/claude/scripts/check-tribune-staleness.py
```

Expected: clean exit (exit code 0); no stale references reported. **This gate does not validate this work's edits** — the script only scans `claude/skills/tribune/` (and the plugin cache mirror), none of which this work modifies. A clean pass here means: this work did not accidentally break tribune skill staleness invariants. If staleness IS reported, it pre-existed this work; surface to the Legatus.

- [ ] **Step 3: Confirm the smoke-tests path is empty**

Run:

```bash
ls /Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/smoke-tests.md 2>&1 || echo "OK: file does not exist"
```

Expected: `OK: file does not exist`.

- [ ] **Step 4: Write `smoke-tests.md`**

Tool: Write
File: `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/smoke-tests.md`

content:

`````markdown
---
case: 2026-04-26-custos-edicts-wiring
type: smoke-tests
---

# Custos Edicts Wiring — Smoke Tests

Manual session-level tests for the Custos edicts wiring. Each test requires a fresh `/consul` session driving the wiring through the legion-awaits handoff. The implementing soldier produces this checklist; the Imperator (or a fresh session under his direction) executes each test.

The tests are not fully automatable — they exercise session-level dispatcher behavior across consul/Praetor/Provocator/Custos boundaries that are only realizable in real sessions. Tests 7 and 8 in particular are documentation-review tests of the parsing contract and failure-handling rules; the contract IS the test surface in this implementation, since the dispatcher is prose-driven, not code-driven.

---

## Test 1 — Happy Path

**Goal:** Confirm Custos dispatch fires automatically after Praetor+Provocator clear, returns OK TO MARCH on a clean plan, and proceeds to legion-awaits.

**Setup:**

1. Open `/consul` in a fresh session.
2. Brainstorm a trivial single-task case (e.g., "add a one-line comment to a doc file").
3. Approve the spec, issue edicts.

**Expected:**

- Edicts skill writes plan.md.
- Praetor+Provocator dispatch in parallel; both return SOUND.
- Edicts announces "Dispatching the Custos for dispatch-readiness verification."
- Custos returns `Verdict: OK TO MARCH` with at least one SOUND per walk.
- Edicts presents attributed summary to Imperator.
- Edicts proceeds to "The Legion Awaits" prompt.

**Pass criteria:** Custos dispatched without intervention; verdict returned; legion-awaits prompt reached.

---

## Test 2 — Skip Syntax (Whitelist Coverage)

**Goal:** Confirm each accepted skip phrase bypasses Custos; each vague phrase triggers clarification; non-listed replies proceed to dispatch.

**Setup:** For each phrase below, run a fresh `/consul` session through to the "Dispatching the Custos" announcement, then reply with the test phrase.

| Phrase | Expected behavior |
|-|-|
| `skip` | Bypass dispatch, proceed to legion-awaits |
| `skip custos` | Bypass dispatch, proceed to legion-awaits |
| `no` | Bypass dispatch, proceed to legion-awaits |
| `no custos` | Bypass dispatch, proceed to legion-awaits |
| `no, skip` | Bypass dispatch, proceed to legion-awaits |
| `nope` | Bypass dispatch, proceed to legion-awaits |
| `cancel` | Bypass dispatch, proceed to legion-awaits |
| `none` | Bypass dispatch, proceed to legion-awaits |
| `don't` | Bypass dispatch, proceed to legion-awaits |
| `stop` | Bypass dispatch, proceed to legion-awaits |
| `**skip**` (markdown bold) | Bypass dispatch (trim rule strips bold) |
| `> skip` (blockquote prefix) | Bypass dispatch (trim rule strips blockquote prefix) |
| `not now` | Clarification: "Skip Custos, or proceed?" |
| `maybe later` | Clarification: "Skip Custos, or proceed?" |
| `up to you` | Clarification: "Skip Custos, or proceed?" |
| `hmm` | Clarification: "Skip Custos, or proceed?" |
| `idk` | Clarification: "Skip Custos, or proceed?" |
| `unsure` | Clarification: "Skip Custos, or proceed?" |
| `go ahead` | Proceed to dispatch |
| `proceed` | Proceed to dispatch |

**Pass criteria:** Every whitelist phrase bypasses; every vague phrase clarifies; every non-listed reply proceeds.

---

## Test 3 — BLOCKER Path with Override (Matcher Tolerance)

**Goal:** Confirm Custos returns BLOCKER on a deliberately broken plan; workflow halts; Imperator override accepted with matcher tolerance; override recorded in `decisions.md`.

**Setup:**

1. Open `/consul`, draft a one-task plan with a deliberately unquoted bracket-path: `cd src/app/products/[id]`.
2. Approve spec, issue edicts. (Plan verification may catch this — if it does, override the Praetor/Provocator finding manually to force the broken plan into Custos.)
3. When Custos returns BLOCKER, attempt each override confirmation:

| Confirmation | Expected behavior |
|-|-|
| `override confirmed` | Accepted; proceed to legion-awaits; `decisions.md` entry of type `override` written |
| `OVERRIDE CONFIRMED` | Accepted (case-insensitive); proceed; entry written |
| `override` | Accepted (matcher accepts the bare word); proceed; entry written |
| `"override confirmed"` | Accepted (quotes stripped); proceed; entry written |
| `override confirmed, but be careful` | Rejected with re-prompt: "Confirmation must stand alone..." |
| `OK proceed with override` | Rejected with re-prompt |

**Pass criteria:** Custos returns BLOCKER for the unquoted bracket-path; clean confirmations accepted; tainted confirmations re-prompted; every accepted override produces an entry in `decisions.md` with finding text + Imperator confirmation.

---

## Test 4 — PATCH BEFORE DISPATCH Re-walk (Happy Path)

**Goal:** Confirm Custos returns PATCH BEFORE DISPATCH on a fixable issue; consul applies patches; re-walk fires once with `## Re-walk Marker` containing only diff hunks; second walk returns OK TO MARCH.

**Setup:**

1. Draft a one-task plan with a fixable issue (e.g., a stale phrase from a revised section, like an "## All Resolved" header above an open-question section).
2. Approve, issue edicts.
3. Custos returns PATCH BEFORE DISPATCH with the named patch.
4. Edicts skill applies patch via Edit tool.
5. Edicts re-dispatches Custos with `## Re-walk Marker` section.
6. Inspect the Marker: must contain ONLY unified diff hunks. No prose, no attribution, no rationale.
7. Custos second walk returns OK TO MARCH.

**Pass criteria:** Re-walk fires once; Marker conforms to schema (diff hunks only); second walk returns OK TO MARCH; legion-awaits proceeds.

---

## Test 5 — PATCH BEFORE DISPATCH Re-walk Failure with Revert

**Goal:** Confirm second-walk BLOCKER halts and escalates; patches stay applied on disk; both walks logged in `decisions.md`; Imperator-directed revert produces a `revert` entry.

**Setup:**

1. Draft a one-task plan with two issues: one trivial (Custos catches with PATCH BEFORE DISPATCH), one structural (Custos catches on the SECOND walk with BLOCKER).
2. Approve, issue edicts.
3. First walk returns PATCH BEFORE DISPATCH for issue 1; consul patches.
4. Second walk returns BLOCKER for issue 2.
5. Confirm: workflow halts; both walks logged in `decisions.md` (type `verdict` for each); patches stay on disk.
6. Imperator says "revert."
7. Confirm: consul reverts via Edit; `decisions.md` `revert` entry written referencing the prior `verdict` entry.

**Pass criteria:** No auto-revert before Imperator decision; both walks logged; revert produces correct entry.

---

## Test 6 — Plan Modification Gate

**Goal:** Confirm dispatcher detects plan modifications between plan-verification clear and Custos dispatch; announces diff; waits for Imperator decision; logs decision.

**Setup:**

1. Draft a plan, complete Praetor+Provocator clearance.
2. Before edicts dispatches Custos, manually edit `plan.md` (e.g., add a typo fix to a step description) and stage but do not commit.
3. Trigger the Custos dispatch step.
4. Confirm: dispatcher runs `git diff <plan-path>`; non-empty diff detected.
5. Dispatcher announces: "Plan modified since plan verification cleared — diff: <output>. Re-dispatch plan verification, or proceed to Custos?"
6. Imperator chooses (e.g., "proceed"). Decision logged in `decisions.md` (type `decision`).
7. Custos dispatched on the modified plan.

**Pass criteria:** Diff detected; Imperator prompted; decision logged; Custos dispatched on the modified plan after decision.

---

## Test 7 — Verdict Parser (Documentation Review of Enumerated Cases)

**Goal:** Confirm the Verdict Parsing Contract in `claude/skills/edicts/SKILL.md` "Dispatching the Custos" → "Verdict Parsing Contract" subsection covers each enumerated case correctly.

**Setup:** Read the contract section. For each pattern below, confirm the contract specifies the expected behavior. (Behavioral testing of the parser would require a code-level parser; the dispatcher is prose-driven, so the contract IS the test surface.)

| Pattern | Contract-specified behavior |
|-|-|
| `Verdict: BLOCKER` | Parses as BLOCKER (well-formed) |
| `Verdict: BLOCKER.` | Parses as BLOCKER (trailing punctuation stripped per tolerance rule 3) |
| `Verdict:BLOCKER` | Parses as BLOCKER (no space after colon per tolerance rule 4) |
| `Verdict: **BLOCKER**` | Parses as BLOCKER (bold value stripped per tolerance rule 2) |
| `Verdict: blocker` | Malformed → BLOCKER + escalate (lowercase value listed in malformed cases) |
| `Verdict: Blocker` | Malformed → BLOCKER + escalate (mixed-case value listed) |
| `Verdict: BLOCKER (with caveats)` | Malformed → BLOCKER + escalate (extra content listed) |
| `Verdict: BLOCKER for now` | Malformed → BLOCKER + escalate (extra content listed) |
| `Verdict: BLOCKER OK TO MARCH` | Malformed → BLOCKER + escalate (extra content listed) |
| `**Verdict:** BLOCKER` | Malformed → BLOCKER + escalate (bold prefix listed) |
| (no `Verdict:` line at all) | Malformed → BLOCKER + escalate (missing line listed) |
| Two `Verdict:` lines outside code fences | Malformed → BLOCKER + escalate (multiple lines listed) |
| `Verdict: BLOCKER` only inside a ` ``` ` fence | Malformed → BLOCKER + escalate (parser scope ignores fenced lines) |

**Pass criteria:** Each pattern is unambiguously addressed by the contract; no pattern slips through unhandled.

---

## Test 8 — Non-return / Partial-result (Documentation Review)

**Goal:** Confirm the Failure / Abort Handling subsection in the dispatching phase covers each failure mode correctly.

**Setup:** Read the subsection. For each scenario below, confirm the subsection specifies the expected behavior. (Behavioral simulation of Agent tool failures requires either modifying the dispatcher or mocking the Agent tool; neither is in scope for this work.)

| Scenario | Subsection-specified behavior |
|-|-|
| Agent tool returns `failed` with no body | BLOCKER + escalate, "no verdict available" note |
| Agent tool returns `failed` with partial body containing valid `Verdict: OK TO MARCH` | Verdict parsed and honored; "verdict parsed from partial output" note |
| Agent tool returns `failed` with partial body lacking parseable verdict | BLOCKER + escalate, "no verdict available" note |
| Mid-dispatch skip declaration after Agent tool fires | Skip note delivered; verdict honored on return; Imperator chooses |
| Second walk after PATCH BEFORE DISPATCH non-returns | BLOCKER + escalate (re-walk inheritance) |
| Session terminates mid-dispatch | On resumption, missing-entry detection prompts Imperator |

**Pass criteria:** Each scenario is unambiguously addressed; no scenario slips through unhandled.

---

## Test 9 — Session Termination Resumption

**Goal:** Confirm dispatcher detects missing verdict entry on session resumption and prompts the Imperator.

**Setup:**

1. Start a Custos dispatch (Test 1 setup is sufficient).
2. Before Custos returns, terminate the session (close the Claude Code conversation).
3. Open a fresh `/consul` session, navigate back to the case.
4. Consul checks `decisions.md` for a `verdict` entry matching the current case + plan SHA.
5. Confirm: no entry found; consul announces: "Custos dispatch from prior session has no recorded verdict. Re-dispatch, or proceed without?"
6. Imperator chooses; decision logged in `decisions.md`.

**Pass criteria:** Missing entry detected; Imperator prompted; decision logged.

---

## Final Gates (Automated, Run From Implementing Session)

- [ ] `python3 /Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py` — clean exit 0.
- [ ] `python3 /Users/milovan/projects/Consilium/claude/scripts/check-tribune-staleness.py` — clean exit 0.
- [ ] CONVENTIONS lint (manual review): `docs/CONVENTIONS.md` "Audit Artifacts" section parses cleanly; `decisions.md` schema example renders as a code block, not as a section break.

---

## Closure

The case is closed when:

1. All file edits committed (Tasks 1–6 of `plan.md`).
2. Final gates pass.
3. Tests 1–9 pass on the wired dispatcher (or the Imperator overrides specific failures with rationale logged in `decisions.md`).
4. STATUS.md updated to `closed` with `closed_at` set.
`````

- [ ] **Step 5: Read `smoke-tests.md` to verify content**

Use the Read tool on `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-custos-edicts-wiring/smoke-tests.md`. Confirm:

- Frontmatter present: `case: 2026-04-26-custos-edicts-wiring`, `type: smoke-tests`.
- Nine numbered tests present (Test 1 through Test 9).
- Final Gates and Closure sections present.

- [ ] **Step 6: Manual CONVENTIONS lint**

Open `/Users/milovan/projects/Consilium/docs/CONVENTIONS.md` in any markdown previewer (or read carefully). Confirm:

- New `## Audit Artifacts` section appears between Primary Artifacts and Phase 1 Case Scan.
- The schema example (wrapped in 4-backtick fence) renders as a code block — the inner `---` frontmatter delimiter does NOT break the surrounding section flow.
- No malformed Markdown.

If lint fails, fix inline and re-commit before Step 7.

- [ ] **Step 7: Commit**

Run:

```bash
git -C /Users/milovan/projects/Consilium add docs/cases/2026-04-26-custos-edicts-wiring/smoke-tests.md
git -C /Users/milovan/projects/Consilium commit -m "chore(custos-wiring): add smoke-tests checklist; drift+staleness gates pass"
```

---

## Order of Operations Summary

Sequential — each task may depend on the previous having landed cleanly:

1. **Pre-flight** — verify ground (no commits)
2. **Task 1** — CONVENTIONS amendment (foundation for `decisions.md` references in later tasks)
3. **Task 2** — Custos verification template (referenced by Task 5's dispatching phase)
4. **Task 3** — Protocol dispatch table row
5. **Task 4** — Authoring for Custos subsection in SKILL.md (smaller, lower in file)
6. **Task 5** — Dispatching the Custos phase in SKILL.md (larger, higher in file)
7. **Task 6** — Final gates + smoke-test checklist

Tasks 4 and 5 both touch `claude/skills/edicts/SKILL.md` but with text-anchored Edits, so order does not matter for correctness. They are listed in source-file order (Task 4's anchor is earlier in the file than Task 5's) for reading clarity.

The Soldier should commit after each task to keep the history granular. The Legatus may bundle commits if executing all tasks in one session.

---

## Hard Scope Reminders (from spec)

The Soldier MUST NOT:

- Modify `~/.claude/agents/consilium-custos.md` or `claude/skills/references/personas/custos.md`.
- Modify `claude/skills/legion/SKILL.md`, `claude/skills/march/SKILL.md`, or `claude/skills/consul/SKILL.md`.
- Edit any other section of `protocol.md` beyond the dispatch table row addition (specifically: do not touch section 8 "Depth Configuration" — the spec says "no other protocol changes" and the Custos persona file already specifies his Patrol-depth single-pass behavior).
- Backfill `decisions.md` to other case folders.
- Tighten the skip-syntax whitelist on existing Praetor+Provocator or Censor+Provocator dispatches in other skills.
- Modify the canonical Codex (`claude/skills/references/personas/consilium-codex.md`) or any agent's Codex section.
- Touch `claude/CLAUDE.md` unless a maintenance section claim is now inaccurate (e.g., a count of dispatching skills) — flag in the plan if discovered, do not silently edit.

If any task as written would violate one of these constraints, halt and surface to the Legatus.
