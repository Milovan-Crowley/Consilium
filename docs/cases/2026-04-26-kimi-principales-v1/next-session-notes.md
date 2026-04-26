# Next-Session Notes — Kimi Principales Integration

This file preserves the architectural decisions and verification findings deferred from the substrate-only `spec.md`. When the integration case begins in a separate session, this is the prepared ground — read it first.

---

## Substrate-iteration MISUNDERSTANDING (resolved — recorded for traceability)

### Resolved: SOUND-without-strong-evidence cannot be a "weak SOUND" state

Provocator caught during plan verification (iteration 1) that the substrate's downgrade routine flipped `evidence_strength` only, leaving `status: SOUND` intact — which then failed cross-field rule 2 ("SOUND requires strong evidence"), causing the docket to be replaced with a synthetic GAP. The "weak SOUND" doctrinal state was internally inconsistent.

**Resolution applied:** the wrapper's `downgradeWeakSound` flips `status` from SOUND to **CONCERN** when evidence is weak/empty, preserves `evidence_strength` on the finding so the officer can see why the wrapper distrusted it, and recomputes the docket's `overall` to reflect the new worst status. `requires_officer_review=true` remains. Spec Section 1 wording amended; plan Tasks 5, 11, 18 implement.

The Codex CONCERN verdict ("the verifier has an opinion the wrapper cannot validate") is the right home for this state — it stays inside the four-verdict vocabulary; no schema flags; rule 2 stays meaningful.

---

## Two Censor MISUNDERSTANDINGs (deferred — Imperator decision required for integration case)

### MISUNDERSTANDING #1 — Pre-officer dispatch corrupts the Independence Rule

**Codex:** *"Verifiers receive, and only receive: the artifact, domain knowledge from doctrine, the Consul's context summary, the confidence map. This is not negotiable."*

**Tension:** the pre-rescope Spec A architecture proposed including the merged Principales docket in the officer's dispatch context. The docket carries `status: MISUNDERSTANDING|GAP|CONCERN|SOUND` per finding — those are *verdicts*, not evidence. The Codex's closed list does not include "prior verdicts from another agent." Including the docket adds a fifth input class the Codex does not permit.

**Provocator independently confirmed this** as a GAP citing protocol Section 4: *"context summary must NOT include anything that would bias the verifier toward approval."* Two verifiers, one wall.

**Three resolution paths the integration case must choose between:**

(a) **Amend the Codex Independence Rule.** Explicitly enumerate "merged Principales docket" as a permitted fifth input, with doctrinal safeguards (officer-prompt audit-not-concur rule). Captures the full savings model — officer skim-and-confirms strong SOUNDs.

(b) **Docket-to-producer restructure.** Consul (the producer) receives Principales output as pre-officer fix-feedback, auto-fixes via the existing auto-feed loop, then dispatches officer cold on the cleaner artifact. Officer doctrine unchanged. Savings come from fewer iteration cycles, not officer skip.

(c) **Post-hoc check.** Officer reads cold first, then sees docket as comparison only. Smallest savings, weak fit.

**Consul's lean: (b).** Preserves Codex untouched, ships meaningful savings via fewer iterations, the auto-feed loop already does the work. (a) gets bigger savings but touches doctrine that has earned its weight. (c) is structurally awkward.

### MISUNDERSTANDING #2 — Schema's `officer` field + lane-officer assignment

**Tension:** the schema's per-docket `officer: censor|praetor|provocator|tribunus` field plus per-lane officer assignments could be read as encoding lane partitioning that breaks parallel-independent verification. The Censor read it that way even though my intent was "merged docket fed to both officers."

**Resolution applied to substrate spec:** dropped the `officer` field for v1. The integration case will decide whether to reintroduce it (and how to keep it from encoding partition) based on which path-1 resolution is chosen.

If path (a): re-introduce as routing hint only, with explicit prose that lanes are pre-officer scouting, both officers see the merged docket, conflict surface preserved.

If path (b): no field needed — Principales output goes to producer, never to officer.

If path (c): same as (a).

---

## GAPs and CONCERNs deferred (integration-dependent)

### From Censor

- **Confidence map delivery to Principales.** Spec wording must specify whether `artifact_slice` carries inline confidence annotations and whether confidence-targeting lanes (`confidence-map-sanity`, attack-vector framing in adversarial lanes) use confidence as primary attack vector.
- **"Strong evidence" operational threshold.** What makes evidence "strong" vs "weak" for officer-skip decision. Tied to MISUNDERSTANDING #1 resolution. Substrate currently relies on Kimi-set `evidence_strength` field; the integration spec must define what the *officer* trusts about this field.
- **Drift-check parity claim.** Depends on officer prompt amendment shape. Integration case must:
  - Use the correct script path: `python3 claude/scripts/check-codex-drift.py` (not the `claude/CLAUDE.md` Maintenance line's broken `python3 scripts/check-codex-drift.py`).
  - Specify explicit insertion anchor for the new `## When a Principales Docket Is Present` section relative to the Codex range. Drift script extracts the Codex slice as content between `# The Codex of the Consilium` and `## Operational Notes`. Insertion must land OUTSIDE that range — either before `# The Codex of the Consilium` (as a final subsection of `## Operational Doctrine`) or after `## Operational Notes` (as a new top-level section). Pick one and commit in the spec.
- **Drift-parity check applies to 6 agent files.** Substrate edits 0 of them; integration case edits 3 (Censor, Praetor, Provocator). The other 3 (Tribunus, Soldier, Custos) must remain bytewise identical to canonical Codex.

### From Provocator

- **Producer-side mode-flag race in concurrent sessions.** `CONSILIUM_VERIFICATION_MODE` is read at MCP spawn, per Claude Code session. A mid-day flip via shell export does not propagate to in-flight sessions. Integration spec must decide: per-session snapshot (current) or live-flippable file-backed flag, plus document Rollout Step 4 ("flip back if Kimi misbehaves") behavior — which only takes effect for newly-spawned sessions.
- **Officer prompt amendment lacks no-docket fallthrough.** The amended officer must explicitly handle the case where no docket is present (classic-fallback path triggered by MCP error mid-run). Amendment template needs an explicit `else` branch.
- **Auto-feed iteration 2 docket reuse undefined.** On iteration 2, the artifact_sha changes; prompt cache key misses; every lane re-dispatches at full cost. Integration spec must specify: (i) full re-dispatch (correct, expensive), (ii) lane-level docket cache by `artifact_section_sha:lane`, or (iii) only re-dispatch lanes whose findings were non-SOUND. Worst case today is ~30 lane dispatches per change cycle for a 5-lane spec with 2 iterations and 2 producers.
- **"Producer skills include the merged docket in the context summary" tension.** Same as MISUNDERSTANDING #1 — they are siblings.
- **Sycophantic Kimi defense — locator-valid-but-semantically-wrong evidence.** The substrate validates locators *exist*; the locator validator does not validate that quoted evidence *supports the conclusion*. Defense is officer-audit work in the integration case. Add a seeded fixture test that emits plausible-quote-wrong-conclusion dockets and verifies the officer catches it.
- **Conflict reconciliation across lanes.** The plan's claim_id formula was `{artifact_sha}:{section_id}:{claim_index}:{lane}` — including lane means cross-lane findings on the same section never collide on merge. Cross-lane disagreement is invisible. Integration spec must change the formula (drop `:{lane}`) OR add a cross-lane conflict detector that pairs findings by section_id alone.
- **Sanity test 4 covered only mode-flag dispatch, not error-path fallback.** Five fallback triggers exist (env-var classic, MCP unreachable, malformed docket, budget breaker, concurrency timeout); only one was tested. Integration spec adds tests for the other four.
- **No test for officer behavior in classic mode after amendment.** Integration spec adds a regression test confirming amended officer's classic-mode verdict is qualitatively equivalent to pre-amendment.
- **Spec text containing finding-shaped vocabulary may be misclassified by lane prompts.** Substrate spec's lane-prompt format documents the discipline rule; integration case enforces it across all lane prompts (especially meta-cases).
- **Schema-error vs transport-error fallback inconsistency.** Substrate now distinguishes them; integration case must specify what the producer skill does for each: schema_error → reject docket entirely, fall back to classic dispatch for the lane; transport_failure → synthetic GAP in the docket; budget_breaker → fall back to classic.

### From Custos

- **Drift-check script path is wrong everywhere it appears.** The script lives at `/Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py`. The pre-rescope spec, the `claude/CLAUDE.md` Maintenance section, and any other doctrine that names `scripts/check-codex-drift.py` are broken. Integration spec must use the correct path. **Worth a separate doctrine-fix edict** to fix `claude/CLAUDE.md` independently of integration work.
- **Agent-file amendment positional rule.** See Censor "drift-check parity" above — same finding from a different angle.
- **Custos vs MCP-smoke-test ambiguity in Verification Expectations.** Substrate spec separates them: Custos walks the plan, smoke test runs after install. Integration spec must keep this clean.

---

## Imperator-decision items (carry into integration deliberation)

1. **Independence Rule path.** (a) Codex amendment / (b) docket-to-producer / (c) post-hoc. Consul leans (b).
2. **Whether to reintroduce the `officer` field on the docket schema.** Depends on (1).
3. **`CONSILIUM_VERIFICATION_MODE` substrate.** Per-session env var snapshot (current) or live-flippable file-backed flag.
4. **Cross-session daily budget aggregation.** Per-session is current limitation; do we need cross-session daily?
5. **Drift-check fix scheduling.** Roll into integration case, or fire as its own doctrine-fix edict first?
6. **Best-of-N orchestration.** Imperator mentioned the option ("dirt-cheap means we can throw multiple agents at one task"). Schema supports it via independent run_ids; wrapper-level orchestration is unbuilt. Integration case or its own case?

---

## Findings preserved without action (substrate accepted them)

- **Provocator SOUND #1** — schema discipline architecture (wrapper-not-Kimi enforcement). Substrate preserves the architectural commitment.
- **Provocator SOUND #2** — out-of-scope enumeration is rigorous. Substrate keeps the same discipline (Hard Scope + Future Scope).
- **Provocator SOUND #3** — Decision 8 (file-level additiveness of officer amendment). Moot here; relevant to integration.
- **Censor SOUND #1** — Codex four-verdict vocabulary preserved in schema and protocol. Substrate keeps it.
- **Censor SOUND #2** — Medicus (skill) vs Tribunus (subagent) distinction correctly drawn. Carry forward.
- **Censor SOUND #3** — classic fallback as architectural contract. Moot here (no fallback path); relevant to integration.
- **Censor SOUND #4** — discipline transfer from reference plan is faithful. Carry forward.
- **Custos SOUND #1** — cross-references between spec and reference plan are accurate. Substrate continues to cite the same way.
- **Custos SOUND #2** — `/checkit not touched` survives cross-substrate grep. Carry forward.
- **Custos SOUND #3** — Codex-side parity deferral is honest. Substrate keeps the deferral.

---

## Substrate-iteration CONCERNs accepted with deferral (carry into integration case)

These were surfaced during Praetor + Provocator verification of the substrate plan (iteration 1) and accepted as v1-tolerable; the integration case should pick them up:

- **Budget tracker non-atomic.** `SessionBudget.charge()` and `breakerOpen()` are not synchronized. Concurrent `verify_lane` calls can each pass the breaker check before either charges, allowing modest overrun (worst case = MAX_CONCURRENCY × per-call cost beyond limit). Acceptable at v1 with $5 default budget and dirt-cheap Kimi; integration case may add atomic-charge-and-check.
- **Telemetry stderr backpressure.** `process.stderr.write(...)` is synchronous when stderr is piped. A slow consumer (Claude Code MCP transport) can fill the pipe buffer (~64KB on macOS) and block the event loop. Low-volume v1 won't hit this; high-frequency integration may. Future fix: async/buffered logger with backpressure awareness.
- **`redactSecrets` redacts only `MOONSHOT_API_KEY`.** Other env vars (e.g., `CONSILIUM_KIMI_*`) and arbitrary input data passed through telemetry are not redacted. v1 telemetry events do not include input content, so the leak surface is narrow today; integration case should extend `SECRET_ENV_KEYS` and audit any logging that includes prompt content.
- **Empty-evidence-bundle handling.** `buildRequest` throws synchronously if `evidence_bundle.sources.length === 0`. Caller responsibility today; integration case may add caller-side validation or convert this to a synthetic-failure docket.
- **Moonshot `response_format` + `prompt_cache_key` + `safety_identifier` + model IDs (`kimi-k2.5`/`kimi-k2.6`) are unverified against Moonshot's published API.** Substrate sends them; if Moonshot ignores or rejects, the smoke test (Task 21) reveals it. Integration case should add an explicit Moonshot-compat shim if any of these need transformation.
- **TDD "Expected: FAIL" phrasing in plan.** Tasks 3+ run `npm test` and expect the new test file to fail. Cumulative test runs include passing tests from prior tasks; the literal phrasing may confuse a soldier who reads "FAIL" without scoping. Plan does scope per-test in some places (`npm test -- evidence-quality`); the integration case (or a follow-up doctrine cleanup) can normalize all TDD steps to scoped invocations.
- **Lane stub Forbidden Behavior text inherited from `upstream-coverage.md`.** The substrate ships nine lane prompts as direct copies with only the Lane Definition section swapped; the Forbidden Behavior text is upstream-coverage-shaped (e.g., "quote BOTH the artifact AND the evidence source"). Integration case writes lane-specific Forbidden Behavior when the production lane prompts are matured.
- **MCP SDK pattern: `Server` (low-level) vs `McpServer` (high-level).** The `mcp-server-dev:build-mcp-server` skill recommends the higher-level `McpServer.registerTool()` pattern. The substrate uses the lower-level `Server` + `setRequestHandler(ListToolsRequestSchema, ...)` pattern. Both are valid SDK APIs; the substrate's choice works. Integration case may consolidate to `McpServer` for ergonomic alignment with the skill default if the soldier-or-Imperator finds the verbosity costly.

## Iteration-2 deferred CONCERNs (Provocator pass)

These were surfaced during iteration-2 verification of the post-fix plan and accepted as v1-tolerable; integration case picks them up:

- **Streaming aggregator has no automated test coverage.** The `MoonshotClient.fromEnv` streaming code path (`for await (const chunk of stream) ...`) is constructed live and bypassed by all unit/integration tests (mocks substitute `chatCompletionsCreate` and return the aggregated shape directly). Two silent failure modes: (1) Moonshot returns chunks without `delta.content` → aggregator builds `content === ''` → `complete()` now correctly maps to `refused: 'empty content body'` (defense-in-depth fix applied this iteration), but the underlying aggregation bug is undetected; (2) Moonshot deviates from OpenAI chunk shape → same path. Smoke test (Task 21) is the only line of defense. Integration case should add a streaming-aggregator unit test that drives `chatCompletionsCreate` with a hand-crafted async iterable and asserts on the aggregated `content`.
- **Rule-10 strict claim_id equality is brittle to Kimi reformatting.** Comparison is exact string equality. If Kimi paraphrases or trims claim_ids, valid dockets are rejected. v1 dispatchers control claim_id format (opaque ASCII identifiers); the integration case should either normalize on both ends or document the discipline in `principales.md`.
- **`safety_identifier` derives from `USER` env which can be empty under macOS LaunchAgent contexts.** Falls back to `LOGNAME` then literal `'unknown'`. All users sharing the fallback path share the same `safety_identifier`; Moonshot-side per-user dedupe collapses. Wrapper still works; only Moonshot analytics are degraded. Optional fix: log the `userMaterial` source on startup so the Imperator can confirm resolution without echoing the raw value.
- **Cross-session prompt-cache hit rate is bounded to one MCP process.** `sessionFamily = randomUUID()` regenerates per Claude Code restart, so cache keys vary across sessions. Whether this matches Moonshot's prompt-cache TTL semantics is unverified. Recommend telemetry capturing `prompt_cache_key` on every successful call so the Imperator can spot-check Moonshot dashboards for hit/miss patterns; integration case may switch to a stable session_family (e.g., `sha256(USER):day`).
- **`finish_reason` enum mismatch.** OpenAI SDK declares `'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null`; the wrapper narrows to `'stop' | 'length' | 'tool_calls' | 'error'` and silently re-types via `as`. If Moonshot returns `'content_filter'`, telemetry logs an unmodeled value. Cosmetic; fix by mapping unknown values to `'error'` explicitly.
- **Synthetic-failure dockets do not echo per-claim structure.** `mapFailureToDocket` returns one synthetic GAP that does not honor `input.claims[]`. Callers cannot trace per-claim status through a synthetic-failure path. Acceptable for v1 (callers see the lane refused at meta level); integration case may want to surface per-claim `unverified_claims` on failure too.

## Reading order for the integration case

1. This file.
2. The substrate spec at `spec.md` — what was built.
3. The reference plan at `/Volumes/Samsung SSD/Downloads/consilium_kimi_principales_implementation_plan.md` — Sections 10 (officer prompt changes) and 14 (lane routing matrix) become directly relevant.
4. The Codex at `docs/codex.md` — for path (a) and the audit-not-concur framing.
5. The verification protocol at `claude/skills/references/verification/protocol.md` — Section 4 (Context Summary Format), Section 6 (Finding Handling), and the new Section 12 (Verification Mode) the integration spec will add.
