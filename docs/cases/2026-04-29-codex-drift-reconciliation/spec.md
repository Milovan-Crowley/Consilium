# Codex Drift Reconciliation Spec

## Purpose
> **Confidence: High** — live `python3 codex/scripts/check-shared-docs-adoption.py` passes, while `python3 codex/scripts/check-shared-docs-adoption.py --installed` fails for four installed agents.

Reconcile Consilium Codex runtime truth so future runtime upgrades are made against one clean chain:

`codex/source/*` -> `codex/agents/*.toml` -> `~/.codex/agents/*.toml`

The current unsafe state is that generated source artifacts and installed Codex agents disagree. Any model-routing, plan-format, minimality, or execution-law upgrade built before this reconciliation may appear correct in one layer and be absent or different in the layer Codex actually loads.

## Current Evidence
> **Confidence: High** — verified in this session against the live checkout and installed runtime.

The generated source check is clean:

```bash
python3 codex/scripts/check-shared-docs-adoption.py
# Codex shared-docs adoption check passed.
```

The installed parity check fails:

```bash
python3 codex/scripts/check-shared-docs-adoption.py --installed
```

It reports installed drift for:

- `~/.codex/agents/consilium-legatus.toml`
- `~/.codex/agents/consilium-centurio-front.toml`
- `~/.codex/agents/consilium-centurio-back.toml`
- `~/.codex/agents/consilium-centurio-primus.toml`

The installed-only changes are not random corruption. They include execution-behavior language such as:

- bounded evidence gathering before asking,
- classifying tactical friction before escalating,
- not both fixing and escalating the same issue,
- narrowing `DONE_WITH_CONCERNS` to verified residual concerns,
- keeping local, reversible, on-plan choices moving.

Those changes may be worth keeping, but they currently live in installed output rather than source truth.

## Desired Outcome
> **Confidence: High** — source/generated/installed parity is the explicit prerequisite for later Consilium runtime upgrades.

After this work:

- `codex/source/*` contains the accepted execution-law and role-language truth.
- `codex/agents/*.toml` is generated from that source truth.
- `~/.codex/agents/*.toml` matches generated artifacts exactly for every Consilium Codex agent.
- The installed parity check passes without `|| true`.
- Future upgrade specs can rely on source/generated/installed alignment instead of reverse-engineering installed runtime drift.

## Scope In
> **Confidence: High** — this lane is a prerequisite cleanup, not a feature upgrade.

This spec covers Codex runtime reconciliation only:

- Identify every generated-vs-installed Consilium Codex agent drift.
- For each installed-only delta, decide whether to promote it into `codex/source/*` or discard it.
- Promote accepted execution-law changes into the correct source file, likely `codex/source/doctrine/execution-law.md`.
- Promote accepted role-specific language into the relevant `codex/source/roles/*.md` files when the wording belongs to a role, not shared doctrine.
- Regenerate `codex/agents/*.toml` from source.
- Install regenerated agents into `~/.codex/agents`.
- Verify generated and installed parity.
- Document the fresh Codex session boundary after install.

## Scope Out
> **Confidence: High** — Milovan split the broader upgrade pile into separate lanes, and this is the base lane only.

This spec does not cover:

- Minimality contract wording.
- Consul Brief or Estimate-lite.
- Risk tiers or plan topology.
- Legion wave execution.
- model routing changes.
- light/heavy Claude or Codex agent variants.
- Claude user-scope agent changes.
- new lint or conflict-scan scripts.
- changes to verifier cadence.
- any rollback to old five-lane Provocator review.

## Reconciliation Rules
> **Confidence: Medium** — the exact promotion targets must be confirmed during implementation by reading the source role files, but the source/generated/installed rule is already established.

The implementer must not blindly overwrite installed runtime drift with generated artifacts.

For each drifted installed file:

- Compare installed runtime against generated runtime.
- Classify each meaningful installed-only delta as one of:
  - **Promote to source:** the delta is desired runtime behavior and belongs in source truth.
  - **Discard:** the delta is stale, accidental, or superseded by source.
  - **Needs decision:** the delta changes behavior enough that Milovan must approve before promotion or removal.
- Record the classification before running any install command that can overwrite installed runtime.
- Apply promoted shared behavior to shared source doctrine.
- Apply promoted role-specific behavior to the relevant role source file.
- Regenerate after source edits.
- Confirm generated artifacts contain the intended text.
- Install regenerated artifacts.
- Confirm installed artifacts exactly match generated artifacts.

If a delta is classified as **Needs decision**, implementation must stop before overwriting installed runtime.

## Required Verification
> **Confidence: High** — these commands are live in the repo, and the installed check currently exposes the problem.

The implementation is not complete unless all of these pass without masking failure:

```bash
python3 codex/scripts/generate_agents.py
python3 codex/scripts/check-shared-docs-adoption.py
python3 codex/scripts/check-shared-docs-adoption.py --installed
```

The install path must use the repository-supported installer:

```bash
bash codex/scripts/install-codex-agents.sh
```

If stale installed files need pruning, the implementation may use:

```bash
bash codex/scripts/install-codex-agents.sh --prune
```

The implementer must not append `|| true` to any reconciliation gate.

## Acceptance Criteria
> **Confidence: High** — these are observable outcomes rather than implementation preferences.

- `python3 codex/scripts/check-shared-docs-adoption.py` passes.
- `python3 codex/scripts/check-shared-docs-adoption.py --installed` passes.
- No installed Consilium Codex agent differs from its generated counterpart.
- A pre-install classification record exists for every meaningful installed-only Legatus and Centurion delta.
- Each recorded delta is classified as **Promote to source**, **Discard**, or **Needs decision** before any install command runs.
- Every **Promote to source** delta is present in `codex/source/*` before generation.
- Every **Discard** delta has a stated reason in the implementation report.
- No **Needs decision** delta is overwritten without Milovan approval.
- No Claude agent files under `~/.claude/agents` are modified by this lane.
- No model, reasoning-effort, or agent-variant changes are made by this lane.
- The final report tells Milovan that a fresh Codex session/thread is required to load the reinstalled agent definitions.

## Risks
> **Confidence: Medium** — the current installed deltas look intentional, but the original authoring context is not fully known from source alone.

The main risk is losing useful installed-only execution behavior by reinstalling from stale source. That is why promotion/discard classification is required before install.

The second risk is accepting installed drift as truth without moving it into source. That would preserve behavior for the current machine but keep future generated artifacts wrong.

The third risk is widening into the broader upgrade plan. This lane must stay prerequisite-only.

## Non-Blocking Follow-Ups
> **Confidence: High** — these follow-up lanes were intentionally split out for parallel specs.

After reconciliation is complete, separate specs may proceed for:

- minimality contract,
- Consul Brief / Estimate-lite,
- risk tiers and light plan topology,
- later Legion wave execution,
- later model-routing decisions.
