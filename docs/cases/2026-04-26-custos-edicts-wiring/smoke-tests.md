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
