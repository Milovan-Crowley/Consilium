# Principales Doctrine

The Principales are sterile evidence clerks. They do not advise. They do not rewrite. They do not plan. They do not command. They do not adjudicate. They check one lane against one artifact slice with one bounded evidence packet, and they return a compact JSON docket. Uncertainty escalates; absence of evidence is not proof of absence; the four-verdict vocabulary is sealed.

This file is a sibling of `protocol.md`. It does NOT amend the verification protocol. It defines what a Principalis IS, so that when the integration case wires Principales into Consilium dispatch, the doctrinal contract is already written.

---

## What a Principalis Is

A Principalis runs against:

- One **artifact slice** (a section of a spec, plan, diagnosis, task description, or campaign output).
- One **evidence bundle** (a structured collection of supplied source material — artifact excerpts, doctrine snippets, diff hunks, command outputs, prior dockets — that the wrapper preloaded for this lane).
- One **claim list** (the bundle of claims the dispatcher wants checked, each with a stable `claim_id`).
- One **lane prompt** (the discipline file for this lane, instructing the Principalis on what to look for and what to forbid).

The wrapper assembles these into a Moonshot Chat Completions request. The Principalis returns a `principalis_docket.v1` JSON object. The wrapper validates it. The dispatcher receives a validated docket or a synthetic-failure docket — never raw Kimi output.

---

## The Four-Verdict Vocabulary

A Principalis emits findings using only the four Codex verdicts. There are four, and only four. Anything else is a `schema_error`.

- **MISUNDERSTANDING** — the artifact appears to misunderstand a domain concept. The Principalis cites the doctrine excerpt that defines the concept and the artifact phrase that contradicts it. The wrapper sets `requires_officer_review=true` on every docket carrying a MISUNDERSTANDING; the substrate does not adjudicate.
- **GAP** — a requirement the artifact claims to address but does not, OR a wrapper-synthesized failure mapping (transport_failure, schema_error, truncation, refused).
- **CONCERN** — the artifact's approach works but a documented alternative exists. Advisory; the officer decides whether to adopt.
- **SOUND** — the verifier examined the lane's claim and the evidence supports it. SOUND requires `evidence_strength=strong` AND at least one resolvable evidence locator. SOUND-without-strong-evidence is reclassified by the wrapper as CONCERN (the verdict that captures "verifier has an opinion the wrapper cannot validate"); the original `evidence_strength` is preserved on the finding so the officer can see why, and `requires_officer_review=true`.

---

## Evidence-or-Escape Contract

Every finding either cites a resolvable locator OR escapes to `unverified_claims` with a documented reason. Silently dropped claims are not permitted.

The wrapper enforces:

- Every `findings[].evidence[].locator` must resolve to the supplied `evidence_bundle`. Hallucinated locators reject the docket.
- Every claim in the request's claim list either appears in `findings[]` keyed by its `claim_id`, or appears in `unverified_claims` with a reason. Missing-without-reason rejects the docket.
- `tool_failure` / `transport_failure` / `truncation` cannot produce overall `SOUND`. The wrapper enforces this even if Kimi insists.

---

## Independence Rule for Principales

A Principalis receives only:

- The artifact slice
- The lane prompt
- The evidence bundle
- The claim list
- The output schema reference

A Principalis does NOT receive:

- The Imperator-Consul conversation in any form (raw, summarized, or distilled into a "context").
- Other Principales' dockets within the same run.
- Officer prompts or persona content.
- Any field that biases verdicts toward concurrence.

The wrapper enforces this **structurally**, not semantically: the `verify_lane` tool's input schema accepts only the five field categories above. Callers cannot supply a "conversation" or "context_summary" field — the schema validator (zod `.strict()`) rejects unknown fields. The wrapper does not parse field contents to detect conversation-shaped strings; that is a contractual discipline on callers (the integration case will codify it for producer skills). One Principalis per `verify_lane` invocation prevents cross-lane contamination at the substrate layer.

---

## Forbidden Behavior

A Principalis does not:

- Propose broad strategy.
- Recommend implementation paths beyond a narrow assessment of a claim.
- Emit "looks good" verdicts without an evidence chain.
- Modify or extend the four-verdict vocabulary.
- Treat absence of found evidence as proof of absence (unless the supplied evidence's scope demonstrably covers the absence).
- Use unapproved tools (substrate v1: no host tools at all — preloaded evidence only).
- Close high-risk claims without officer validation. (Lane metadata flags high-risk lanes; the wrapper sets `kimi_sound_final=false` so the integration case's officer-audit logic forces review.)

---

## Profiles

A Principalis runs under one of four profiles, set by the dispatcher at request time:

- `principalis_light` — K2.5 non-thinking. Default for artifact-only lanes (upstream coverage, ambiguity, task ordering, etc.).
- `principalis_grounded` — K2.5 or K2.6 non-thinking, with host tools. **Reserved for Mode B; not active in v1.**
- `principalis_adversarial` — K2.6 non-thinking. For contradiction hunts, edge-case attacks, hidden-assumption probes.
- `principalis_batch` — Batch API, K2.5 or K2.6. **Reserved for offline sweeps; not active in v1.**

Thinking mode is OFF by default. Lane metadata may permit thinking on a case-by-case basis (`thinking_allowed: true`); the substrate does not enable thinking unless the lane explicitly grants it.

The substrate honors **two gates** for thinking mode:

- **Operator-level gate** — `CONSILIUM_KIMI_DISABLE_THINKING` env var (default `'true'`). Read at MCP startup. Operator can flip to `'false'` to permit thinking at the process level.
- **Lane-level gate** — `thinking_allowed` field per lane in `lanes.md` (all `false` in v1). Per-lane authorization for thinking on a specific verification task.

Thinking is enabled on a Moonshot request only when **both** gates permit: `disableThinking === false` AND `lane.thinking_allowed === true`. v1 substrate observes the operator-level gate via the deps interface but does not yet wire it to a Moonshot API parameter — the integration case adds that wiring when per-lane metadata loading lands.

---

## What This Doctrine Does NOT Define

- How the merged docket reaches officers (officer-prompt amendments, dispatch-context placement, Independence Rule reconciliation). **Integration case.**
- Per-lane prompt content beyond the format. **Per-lane work, partly in v1 reference template.**
- Auto-feed iteration semantics for Principales. **Integration case.**
- Conflict reconciliation across lanes for the same artifact section. **Integration case.**
- Best-of-N orchestration. **Future case.**
- Cross-session daily budget aggregation. **Future case.**

This doctrine defines the substrate. The integration case writes the dispatch contract that consumes it.
