# 2026-04-26-kimi-principales-v1 — Spec (Substrate Only)

## Goal

Build the **Kimi Principales MCP** as a standalone substrate — a Moonshot-backed verification tool that takes a lane prompt + artifact slice + evidence bundle and returns a validated `principalis_docket.v1` JSON object. The tool exposes itself to any Claude Code session via standard MCP tool calls.

**Consilium integration is out of scope here.** No producer skill amendments, no officer prompt amendments, no protocol mode flag, no Codex changes. Those decisions live in a separate case after the substrate is in hand.

The substrate ships dormant: it exists, it can be invoked, it returns valid dockets, but nothing in the existing Consilium dispatch flow changes its behavior. Integration is the next deliberation.

## Source

- Reference plan at `/Volumes/Samsung SSD/Downloads/consilium_kimi_principales_implementation_plan.md` — Sections 1, 2, 5, 6, 7, 9 inform the substrate; Sections 10 (officer/protocol changes), 11 (phasing), 12 (test bloat), 14 (lane routing matrix) are deferred to the integration case.
- Verification on the broader (pre-rescope) Spec A surfaced two Censor MISUNDERSTANDINGs about *how Principales fit into officer dispatch* — both deferred. Their full chain of evidence is preserved in `next-session-notes.md`.
- Custos PATCH-BEFORE-DISPATCH findings — six gaps; the four that survive the substrate rescope are addressed inline in this version. The two that became moot (drift-check parity, agent-file insertion anchor) move to `next-session-notes.md`.
- Provocator findings — twelve total; the substrate-relevant subset (budget naming, vocabulary collision, sycophancy defense, schema-vs-transport error mapping, evidence-locator semantics) is addressed inline; the remainder is deferred.

## Background

Verification in Consilium today is pure markdown skills + the `Agent` tool dispatching Claude subagents. Officers (Censor, Praetor, Provocator, Tribunus, Custos) are spawned per dispatch, full-pass the artifact, render verdicts. Token cost is high; the breadth-vs-judgment ratio is not separated.

Kimi K2.5/K2.6 is dirt-cheap and structurally suited for sterile-clerk lane work. *How* Kimi output reaches officers — whether it bypasses the Independence Rule, whether dockets count as evidence or as prior verdicts, whether lanes encode officer ownership — is a doctrinal question the integration case will answer.

This case answers a smaller question: build the tool that performs lane-bounded Moonshot verification with strict schema discipline, evidence-locator validation, classic-fallback semantics on transport failure, telemetry, concurrency, and budget. The tool is callable; the integration is downstream.

## Architecture

```text
Caller (any Claude Code session, test harness, or future producer skill)
  ↓
mcp__principales__verify_lane({
  run_id, artifact_type, lane, profile,
  claims, artifact_slice, evidence_bundle,
  max_completion_tokens, timeout_ms
})
  ↓
MCP wrapper:
  parameter scrubber  → strips unsupported OpenAI params
  request builder     → lane prompt + artifact_slice + evidence_bundle + schema + cache key
  Moonshot client     → streaming Chat Completions, K2.5 default / K2.6 escalation
  schema validator    → cross-field rules
  locator validator   → every evidence locator must resolve to supplied bundle
  evidence validator  → SOUND-without-strong-evidence downgrades
  retry/fallback map  → transport / schema / length errors → docket fields
  ↓
Returns principalis_docket.v1 JSON
```

The wrapper enforces sterile-clerk discipline. Kimi cannot emit verdicts the schema does not recognize, evidence the wrapper cannot resolve, or "looks good" SOUNDs without locators.

## What's Needed

### 1. MCP server at `claude/mcps/principales/`

TypeScript per `mcp-server-dev:build-mcp-server` conventions. Three exposed tools:

- `mcp__principales__verify_lane(args) → docket` — primary entrypoint. One lane × one artifact slice × bounded evidence. Returns validated `principalis_docket.v1`.
- `mcp__principales__health() → { moonshot_reachable, budget_remaining_usd, queue_depth, breaker_state }` — operator visibility.
- `mcp__principales__mode() → string` — reads `CONSILIUM_VERIFICATION_MODE` env at MCP spawn. Returns the value verbatim; the substrate itself does not branch on it. **Reserved for the integration case.**

Internal modules:

- **Moonshot client** — auth via `MOONSHOT_API_KEY`, streaming Chat Completions, retry on 429/5xx with bounded backoff. NO web/memory/internet tools enabled on Kimi side.
- **Request builder** — lane prompt template + artifact slice + evidence bundle + claim list + schema reference + escalation rules. Stable cache keys: `prompt_cache_key = artifact_sha:lane:session_family`, `safety_identifier = hashed(user)`. Never includes raw secrets or privileged identifiers.
- **Parameter scrubber** — strips arbitrary `temperature`, `top_p`, `n>1`, deprecated `functions`, `tool_choice="required"`, nonzero penalties, raw `max_tokens` (normalized to `max_completion_tokens`).
- **Schema validator** — enforces `principalis_docket.v1` cross-field rules (Section 2 below).
- **Evidence-locator validator** — every locator in `findings[].evidence[].locator` must resolve to the supplied `evidence_bundle`. Hallucinated locators → reject docket. **Note:** locator resolution proves evidence *exists*, not that it *supports the conclusion*. Semantic-hallucination defense is integration-layer work.
- **Evidence-quality validator** — SOUND with `evidence_strength != strong` or empty evidence array → downgrade the finding's `status` from `SOUND` to `CONCERN` (the Codex verdict that captures "the verifier has an opinion the wrapper cannot validate"), set `requires_officer_review=true`, and recompute the docket's `overall` to reflect the new worst-status. The `evidence_strength` value (`weak` or `none`) is preserved on the finding for officer audit. This eliminates the "weak SOUND" state — a SOUND verdict in the docket schema always carries strong evidence; weakly-evidenced findings are reclassified.
- **Retry/fallback mapper** — transport timeout / 429 / 5xx → bounded retry then synthetic GAP with `unverified_reason=transport_failure`. Schema validation failure → reject docket with `completion_status=schema_error`. Length truncation → retry once with higher cap, then synthetic GAP with `unverified_reason=truncation`.
- **Concurrency semaphore** — global cap from config plus per-profile sub-caps.
- **Budget tracker** — per-session in-memory (v1 limitation). The env var is named honestly: `CONSILIUM_KIMI_SESSION_BUDGET_USD`. Cross-session daily aggregation is out of scope.
- **Telemetry** — every dispatch logs `run_id, artifact_id, artifact_sha, lane, model, profile, attempt, prompt_tokens, completion_tokens, cached_tokens, finish_reason, latency_ms, schema_status, evidence_status, retry_count, breaker_status` to MCP stderr.

### 2. Schema — `principalis_docket.v1`

JSON Schema at `claude/mcps/principales/schemas/principalis_docket.v1.json`. Inherits the reference plan Section 6 shape with **two changes**:

1. **Drop the `officer` field.** No producer integration in this case means no consumer for the field. The integration case will decide whether to reintroduce it; deferring keeps v1 honest about what it actually does.
2. **Disambiguate transport-vs-tool failure.** The plan's `unverified_reason` enum included `tool_failure`; v1 has no host tools, so that value cannot legitimately occur. Add `transport_failure` (network/API timeout, 429, 5xx after retry exhaustion). Document `tool_failure` as reserved-for-future-use. The wrapper maps Moonshot transport errors to `transport_failure`, never to `tool_failure`.

Cross-field rules enforced at the wrapper:

1. `overall` is the worst material status among findings.
2. SOUND inadmissible unless every SOUND finding has at least one strong evidence item with a resolvable locator.
3. `completion_status != complete` forces `requires_officer_review=true`.
4. `transport_failure` / `missing_context` / `truncation` cannot produce overall `SOUND`.
5. `MISUNDERSTANDING` from Kimi is admissible but always sets `requires_officer_review=true`. The substrate does not adjudicate.
6. Empty `findings` allowed only when `overall=SOUND` AND `evidence_summary` exists.
7. Extra fields rejected.
8. Unsupported verdicts rejected (only `MISUNDERSTANDING | GAP | CONCERN | SOUND`).
9. Evidence locators must resolve to the supplied `evidence_bundle` — host-side check.
10. Required claims missing from findings → moved to `unverified_claims`, never silently omitted.

### 3. Doctrine — `claude/skills/references/verification/principales.md`

New file. Sterile-clerk doctrine. Defines what a Principalis IS:

- One lane, one artifact slice, one bounded evidence packet.
- Four-verdict vocabulary only: MISUNDERSTANDING / GAP / CONCERN / SOUND.
- Evidence-or-escape contract — every finding cites a resolvable locator, or the claim moves to `unverified_claims`.
- **Independence Rule for Principales.** Workers receive only artifact slice + lane prompt + evidence bundle + claim list + schema reference. They do NOT receive the Imperator-Consul conversation in any form. The wrapper rejects requests carrying conversation excerpts.
- **Forbidden:** broad strategy, implementation recommendations, "looks good" without evidence, Codex-vocabulary changes, treating absence of found evidence as proof of absence (unless tool scope proves it), unapproved tools, closing high-risk claims.

This file is a sibling of `protocol.md`. It does NOT amend `protocol.md` (that's integration-case work).

### 4. Lane taxonomy — `claude/skills/references/verification/lanes.md`

New file. YAML lane registry with metadata. **All lanes declared as either `enabled: true` (substrate-callable) or `enabled: false` (placeholder for integration case).** Per-lane keys: `family`, `default_profile`, `evidence_required`, `tools` (empty in v1), `kimi_sound_final` (false in v1), `max_claims_per_bundle`, `max_completion_tokens`, `thinking_allowed` (false v1), `batch_allowed` (false v1).

V1 enabled lanes (callable but unwired): the spec lanes (`upstream-coverage`, `ambiguity-audit`, `confidence-map-sanity`, `contradiction-hunt`, `edge-case-attack`) and plan lanes (`task-ordering`, `undefined-references`, `test-command-plausibility`, `literal-execution-failure`, `migration-risk`). Other lane families (`codebase`, `types`, `api`, `medusa-*`, diagnosis, campaign) declared as `enabled: false` placeholders — integration case writes them.

Lane prompt templates live at `claude/mcps/principales/prompts/<lane>.md`. **One fully-written reference template** ships in v1 (`upstream-coverage.md`); other prompts are stubs. Prompt format (documented in `lanes.md`):

- Lane definition + sterile-clerk reminder
- Forbidden-behavior list (the file's role guard)
- Claim bundle slot
- Evidence packet slot
- Output schema reference
- Escalation rule
- **Vocabulary collision discipline.** A lane prompt whose artifact contains the four-verdict vocabulary as content (meta-cases verifying verification specs) MUST instruct Kimi not to treat artifact-quoted vocabulary as findings — only emit findings against the artifact's claims, not its prose.

### 5. Sanity tests

**Test runner: vitest.** Tests live at `claude/mcps/principales/test/`. Five tests gate the substrate:

1. **Schema rejects bad shapes.** Mock Moonshot client returns synthetic response with invalid verdict (`"FINE"`). Wrapper rejects, `completion_status=schema_error`, no docket emitted.
2. **SOUND-without-evidence downgrades to CONCERN.** Mock returns `overall=SOUND` with empty `findings[*].evidence`. Wrapper flips the finding's `status` from `SOUND` to `CONCERN`, recomputes `overall` accordingly, and sets `requires_officer_review=true`. The original `evidence_strength` is preserved.
3. **Evidence-locator hallucination rejected.** Mock returns SOUND with a locator that does NOT resolve in the supplied `evidence_bundle`. Wrapper rejects, `completion_status=schema_error`.
4. **Transport failure maps cleanly.** Mock client throws timeout. Wrapper retries once, then emits synthetic GAP with `unverified_reason=transport_failure`.
5. **Smoke test (Imperator-driven, manual).** Real Moonshot call, tiny artifact, stub lane prompt. Returns valid docket. Run once after MCP installs, hand-walked. Not automated.

Tests 1–4 are unit tests with a mocked Moonshot client. Test 5 is the integration smoke gate.

### 6. Configuration

Added to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "consilium-principales": {
      "command": "node",
      "args": ["/Users/milovan/projects/Consilium/claude/mcps/principales/dist/index.js"],
      "env": {
        "MOONSHOT_API_KEY": "<from-vault>",
        "CONSILIUM_VERIFICATION_MODE": "classic",
        "CONSILIUM_KIMI_DEFAULT_MODEL": "kimi-k2.5",
        "CONSILIUM_KIMI_ESCALATION_MODEL": "kimi-k2.6",
        "CONSILIUM_KIMI_SESSION_BUDGET_USD": "5",
        "CONSILIUM_KIMI_MAX_CONCURRENCY": "4",
        "CONSILIUM_KIMI_TIMEOUT_MS": "45000",
        "CONSILIUM_KIMI_DISABLE_THINKING": "true"
      }
    }
  }
}
```

**Important:** `~/.claude/settings.json` does NOT currently contain a top-level `mcpServers` key. Existing MCPs (medusa, serena, brave-search, context7) reach this user via the plugin mechanism (`enabledPlugins` + `extraKnownMarketplaces`). The plan **creates** the top-level `mcpServers` key for the first time. Coexistence with the plugin mechanism is verified during Test 5.

`CONSILIUM_VERIFICATION_MODE=classic` is the default. The substrate reads it via `mode()` but does not branch on it. The value is reserved for the integration case to flip.

## Invariants

- **Schema discipline is non-negotiable.** Every cross-field rule is enforced at the wrapper before the docket leaves the MCP. Kimi never slips past the schema.
- **Evidence locators resolve.** Host-side validation catches hallucinated locators at the substrate layer.
- **Independence Rule for Principales.** Workers receive only artifact + lane prompt + evidence + claim list + schema. The wrapper rejects requests carrying conversation excerpts in any field.
- **Codex vocabulary is sealed.** Four verdicts only. Anything else is a `schema_error`.
- **Substrate is dormant by default.** No producer skill, officer agent, or protocol file in Consilium changes its behavior because of this case. The MCP exists; nothing dispatches to it yet.
- **Budget is per-session, named honestly.** `CONSILIUM_KIMI_SESSION_BUDGET_USD`, not "daily" — the tracker is in-memory, scoped to one Claude Code session.

## Hard Scope Constraints

- **No producer skill amendments.** `claude/skills/{consul,edicts}/SKILL.md` are untouched.
- **No officer prompt amendments.** `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,custos}.md` are untouched.
- **No protocol amendment.** `claude/skills/references/verification/protocol.md` is untouched. No new "Verification Mode" section.
- **No Codex changes.** The Independence Rule is not amended.
- **No repo-grounded tools.** `read_file_slice`, `grep`, `symbol_search`, etc. are deferred. v1 is preloaded-evidence-only.
- **No Batch API.** Streaming Chat Completions only.
- **No best-of-N.** One Principalis per lane invocation.
- **No /checkit interaction.** Separate plugin, separate concern.
- **No drift-check run gate.** No agent files edited, so the drift-check is moot here. Its correct path (`python3 claude/scripts/check-codex-drift.py`, not `python3 scripts/check-codex-drift.py` per the broken `claude/CLAUDE.md` Maintenance line) is recorded in `next-session-notes.md` for the integration case.
- **No Codex Consilium parity.** The MCP is process-level and session-agnostic; the integration case (or a separate Codex-side case) decides parity later.

## Open Architectural Decisions Resolved

> **Confidence: High** unless noted.

1. **Substrate = MCP server.** Imperator confirmed.
2. **Default model = K2.5 non-thinking; escalation = K2.6 non-thinking.** No thinking mode in v1.
3. **Streaming Chat Completions only.** Batch deferred.
4. **One Principalis per lane.** Best-of-N deferred.
5. **Tools mode A — preloaded evidence only.** Mode B deferred.
6. **`officer` schema field dropped for v1.** No consumer; integration case decides whether to reintroduce.
7. **`unverified_reason` enum adds `transport_failure`, reserves `tool_failure` for future use.** Disambiguates v1's transport-only failure surface from future host-tool failures.
8. **Budget is per-session, named `SESSION` not `DAILY`.** Cross-session aggregation deferred.
9. **Lane prompts: format documented + one reference template fully written.** Other prompts are stubs; integration case writes them.
10. **Test runner = vitest.** Matches mcp-server-dev defaults.
11. **TypeScript code.**
12. **API key handling.** `MOONSHOT_API_KEY` lives in the MCP's env block. Never logged, never echoed in dockets, never put in `prompt_cache_key` or `safety_identifier`.
13. **`mode()` tool exposed but inert.** Returns env value verbatim; substrate does not branch on it. Reserved for integration case.
14. **`mcpServers` block in `~/.claude/settings.json` will be CREATED.** Does not exist today.

## Rollout

1. Land the implementation plan with the MCP installed and unit tests 1–4 passing.
2. Imperator runs Test 5 (smoke) once to confirm the Moonshot loop is alive.
3. Substrate sits dormant. Nothing in Consilium dispatches to it.
4. Integration case begins in a separate session — designs and ships the producer/officer/protocol wiring.

No promotion, no flag flip, no behavior change in existing flows. The MCP exists; that's the deliverable.

## Verification Expectations

The plan that implements this spec must be verified by `consilium-praetor` (feasibility, ordering, file collisions) and `consilium-provocator` (failure modes, brittle assumptions) in parallel before /march or /legion executes it.

The plan must include:
- Vitest configured at `claude/mcps/principales/`.
- Unit tests 1–4 as a final gate (passing required).
- Test 5 (smoke) called out as an Imperator-driven step after install — not a CI gate.
- A `consilium-custos` field-readiness walk on the **plan** to verify `mcpServers` key creation, env var declaration, file paths, and shell invocations are field-correct.

## Future Scope

Two follow-on cases are anticipated:

- **Integration case** — `docs/cases/<future-slug>-kimi-principales-integration/`. Wires the substrate into Consilium dispatch. Resolves the Independence Rule architecture (Codex amendment vs. docket-to-producer restructure vs. post-hoc check), drafts officer prompt amendments, drafts producer skill amendments, drafts protocol mode amendment, decides conflict-merge semantics, decides docket-reuse-on-iteration semantics. The full Censor/Provocator/Custos finding bundle from this verification round is preserved in `next-session-notes.md` as prepared ground.
- **Lane expansion case** — `docs/cases/<future-slug>-principales-broader-lanes/`. Mode B host-tool support, repo-grounded lanes (codebase, types, api, stubs, quality), diagnosis lanes (Tribune side), campaign-triad lanes, batch API offline sweeps. Likely sequenced after integration.
