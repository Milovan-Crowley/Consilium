# Team-Share Readiness V1 - Master Spec

## Status

Master spec draft. Do not issue edicts until Milovan approves this hardened scope.

This spec supersedes the earlier light draft. It is written after Milovan's runtime fixes landed and after a fresh read-only pass across root onboarding, Claude packaging, Codex packaging, inherited Superpowers surfaces, docs/case presentation, and readiness gates.

## Intent

Make the Consilium repo solid enough for Gavin and Ivan to use internally without Milovan narrating the repo's history or warning them which files are stale.

This is not public/open-source polish. The standard is internal team confidence: a teammate can clone the repo, understand what Consilium is, install the supported runtime surface, avoid inherited runtime traps, and know how to read the existing case history.

**Confidence: High** - Milovan explicitly set internal-team-only, Gavin/Ivan as the audience, Claude/Codex-only V1 support, and no implementation before spec approval.

## Audience

- Milovan
- Gavin
- Ivan

No public contributor, marketplace, open-source, or external customer audience is in scope for V1.

**Confidence: High** - explicit Imperator decision.

## Current Runtime Truth

The runtime core is real and currently passes local checks on Milovan's machine:

- `python3 runtimes/scripts/check-runtime-parity.py`
- `python3 runtimes/scripts/check-runtime-parity.py --installed`
- `python3 codex/scripts/check-shared-docs-adoption.py`
- `python3 codex/scripts/check-shared-docs-adoption.py --installed`
- `python3 codex/scripts/check-tribune-shared-docs.py --installed`
- `bash codex/scripts/install-codex-skills.sh --dry-run`

The repo also has real active Consilium runtime surfaces:

- `claude/AGENTS.md` and `claude/CLAUDE.md` identify the Claude runtime as Consilium.
- `claude/.claude-plugin/plugin.json` and `claude/.claude-plugin/marketplace.json` identify the Claude plugin as Consilium.
- `codex/README.md` explains the Codex adapter, root source, generated outputs, install-facing copies, and local install flow.
- `~/.claude/plugins/consilium` currently points at this repo's `claude/` runtime.
- `~/.agents/skills/tribune` currently points at this repo's `codex/skills/tribune`.

The first-clone surface is not yet ready:

- The repo root has no `README.md`, `AGENTS.md`, or `CLAUDE.md`.
- `claude/README.md` is still upstream Superpowers-facing.
- `claude/hooks/session-start` is active and still injects missing `using-superpowers` content.
- Cursor/OpenCode/Gemini/Copilot/Superpowers surfaces still exist inside the Claude package even though V1 support is Claude + Codex only.
- `docs/README.md` still says the docs are local-only with no GitHub remote, while the repo now has `origin https://github.com/Milovan-Crowley/Consilium.git`.
- `docs/cases/` is valuable history, but it is not consistently presented for a teammate; STATUS-less or unclassified working material exists, including out-of-scope current drafts, even though current conventions require `STATUS.md`.
- Generated Codex config currently hard-codes `/Users/milovan/.codex/agents/...`, while the installer installs to `$HOME/.codex/agents`.
- Codex config sync assumes `~/.codex/config.toml` exists and contains a `[features]` block.
- Active prompt/source/runtime bodies still contain Milovan absolute paths and inherited Superpowers references outside the obvious README/install-doc surfaces.

**Confidence: High** - verified by direct file reads, local checks, and independent Speculator returns on 2026-05-03.

## Decisions Locked For V1

1. V1 is internal team-share readiness only.
2. Supported runtimes are Claude and Codex only.
3. Cursor, OpenCode, Gemini, Copilot, and generic Superpowers runtime surfaces are not supported V1 surfaces.
4. Existing case history remains visible.
5. Current unrelated dirty/current case docs remain out of scope.
6. This spec does not issue edicts or implementation tasks.
7. Case-history/status incompleteness, including out-of-scope current drafts, is framed honestly; it is not repaired wholesale in V1.
8. Root `README.md`, root `AGENTS.md`, and root `CLAUDE.md` are required for V1 because the repo itself is now the teammate entrypoint.
9. The Claude `session-start` hook must be removed from active hook registration for V1. V1 should not retain a session-start reminder hook. Any retained file must be inactive historical/source material or deleted; no active surface may inject full skill bodies, reference `using-superpowers`, mention "this is not Superpowers," or present Consilium by comparison to Superpowers.
10. Codex readiness must prove teammate portability, not just Milovan-local parity.
11. Portability applies to active supported runtime content, source doctrine/protocol bodies, generated outputs, config snippets, and install output. It is not limited to `~/.codex/config.toml`.

**Confidence: High** - items 1-6 are explicit; items 7-11 are Consul synthesis from live repo truth and the Imperator's stated direction.

## Non-Goals

- Public packaging or open-source contributor documentation.
- A public marketplace release.
- Security scrub beyond avoiding obviously wrong install/runtime guidance.
- Keeping Cursor, OpenCode, Gemini, Copilot, or inherited Superpowers surfaces alive.
- Reworking unrelated current case docs.
- Normalizing every case folder to current `STATUS.md` conventions.
- Implementing the separate runtime hook/output changes that already landed.
- Edicts, task assignments, or implementation steps before Milovan approves the spec.

**Confidence: High** - mostly explicit, with the historical case normalization exclusion inferred from "case history remains visible" plus "current unrelated docs out of scope."

## Contract Inventory

No canonical runtime contract surface is defined by this spec.

This campaign touches documentation, install packaging, active hook presentation, generated/install output clarity, and readiness checks. It does not define a product API wire shape, module-boundary API contract, idempotency anchor, link.create boundary, workflow ownership claim, or subscriber boundary.

**Confidence: High** - this is an infra/readiness spec, not a product contract spec.

## Desired End State

Gavin or Ivan can clone the repo and answer these questions in five minutes:

- What is Consilium?
- Which runtimes are supported in V1?
- Where is the source of truth?
- What is generated output?
- What is install output?
- How do I install or refresh Claude?
- How do I install or refresh Codex?
- What should I ignore because it is retired history or unsupported inherited surface?
- How do I read `docs/cases/` without mistaking old working material for current law?
- What command/checklist proves the repo is ready on my machine?

**Confidence: High** - direct translation of the team-share goal.

## Scope Lanes

### Lane 1: Root Orientation

Outcome: the repo root becomes the teammate entrypoint.

Required end state:

- Root `README.md` introduces Consilium as a Divinipress internal planning, diagnosis, and verification system.
- Root `README.md` explains that V1 supports Claude and Codex only.
- Root `README.md` maps `source/`, `generated/`, `claude/`, `codex/`, `docs/`, and installed runtime destinations.
- Root `AGENTS.md` gives agent-facing project rules for this repo without copying the full case history.
- Root `CLAUDE.md` exists and points Claude users at the active Consilium runtime, docs root, and install/reload expectations.
- Root orientation does not read like public marketing or upstream Superpowers documentation.

**Confidence: High** - root onboarding is missing and the repo is now the share surface.

### Lane 2: Claude Runtime Packaging

Outcome: Claude-facing files present Consilium directly and no longer route teammates through upstream Superpowers.

Required end state:

- `claude/README.md` is rewritten as Consilium Claude runtime documentation.
- `claude/AGENTS.md`, `claude/CLAUDE.md`, and `.claude-plugin` metadata remain Consilium-correct.
- Claude install/reload instructions are explicit enough for Gavin and Ivan to use from a clone of this repo.
- V1 provides or documents an executable Claude install/refresh path before the installed readiness gate. That path must install generated Claude agents to the teammate's Claude user-scope agent directory, point the Consilium Claude plugin registration at the current checkout's `claude/` directory, and tell the teammate to start a fresh Claude session.
- Active Claude `SessionStart` hook registration is removed for V1.
- Claude runtime docs state that V1 does not use a session-start hook.
- No active Claude hook injects full skill body content.
- No active Claude hook references `using-superpowers`.
- No active Claude hook includes a disclaimer such as "this is not Superpowers."
- No active Claude hook presents Consilium by comparison to Superpowers.

**Confidence: High** - live hook and README are stale; desired hook direction was explicit.

### Lane 3: Codex Runtime Packaging And Portability

Outcome: Codex setup works for Gavin and Ivan without relying on Milovan-only home paths or pre-existing config shape.

Required end state:

- `codex/README.md` remains the main Codex install/readiness guide but is tightened for repo-root command usage and teammate portability.
- Codex docs clearly distinguish root `source/`, root `generated/codex/`, `codex/` compatibility copies, `~/.codex/agents`, `~/.codex/config.toml`, and `~/.agents/skills/tribune`.
- The install path is explicit from repo root: `bash codex/scripts/install-codex.sh --prune-agents`.
- Fresh-user behavior is explicit and reliable: the installer either creates/updates the needed Codex config shape or stops with a teammate-readable preflight instruction before partial installation is mistaken for success.
- Config sync must handle missing `~/.codex/config.toml` and missing `[features]` deliberately; it must not depend on undocumented pre-existing Milovan config shape.
- Final proof must include a fresh-Codex-config simulation or equivalent preflight assertion covering both a missing `~/.codex/config.toml` and a config file without `[features]`.
- Generated or synced Codex config must not strand Gavin/Ivan on `/Users/milovan/.codex/agents/...`.
- Generated Codex agents and source-derived prompts must not contain Milovan-only absolute paths unless the path is an intentional default that also documents the teammate override.
- `$CONSILIUM_DOCS` defaults may remain documented for Milovan, but team instructions must tell Gavin/Ivan how to set it for their checkout if their paths differ.
- Final readiness must include a machine-checkable validation that installed Codex `config_file` paths and the skill symlink point at the current teammate checkout/user paths, not Milovan's path.

**Confidence: High** - local checks pass, but generated config currently hard-codes Milovan paths.

### Lane 4: Inherited Surface Triage

Outcome: inherited Superpowers and unsupported runtime surfaces are removed or explicitly retired, not left as active-looking docs.

Required end state:

- Cursor/OpenCode package surfaces are removed or clearly retired from V1 so teammates do not attempt to use them.
- `claude/.codex/INSTALL.md` and `claude/docs/README.codex.md` are removed or replaced with pointers to the real `codex/README.md`; they must not instruct users to clone `obra/superpowers`.
- `claude/.opencode/`, `claude/docs/README.opencode.md`, and `.cursor-plugin` surfaces do not remain active-looking V1 instructions.
- Legacy slash commands that route to nonexistent `superpowers:*` skills are removed or replaced with Consilium-correct commands only if those commands are truly supported.
- Inherited release notes/changelog surfaces are removed, archived, or reframed as upstream inheritance, not current Consilium release history.
- Visual companion assets that remain active are rebranded from Superpowers to Consilium.
- Active supported skill bodies and helper assets are swept for inherited Superpowers runtime traps, not just visible install docs.
- Any retained `~/.config/superpowers`, `docs/superpowers`, `Superpowers Brainstorming`, Gemini/OpenCode/Cursor, or similar inherited reference must be explicitly justified as inactive historical context; otherwise it is rewritten or removed.

Rule: no quarantine by default. Keep useful files by making them Consilium-correct. Remove unused files.

**Confidence: High** - live file evidence shows active-looking inherited surfaces across Claude package.

### Lane 5: Docs And Case Presentation

Outcome: docs and case history stay useful without confusing first-time teammates.

Required end state:

- `docs/README.md` no longer claims the docs repo has no GitHub remote.
- `docs/INDEX.md` helps a teammate find doctrine, conventions, active/current cases, and historical cases.
- `docs/cases/` is explained as planning/spec/diagnosis history, not onboarding and not automatically current runtime law.
- Current conventions remain authoritative for new cases.
- Case folders with missing or uneven `STATUS.md` are not repaired wholesale in V1; they are framed honestly as historical or unclassified working material, including out-of-scope current drafts.
- The docs presentation must not imply every STATUS-less case is old, closed, or safe to ignore.
- Current unrelated dirty case docs remain out of scope unless Milovan explicitly widens the campaign.

**Confidence: High** - case history preservation was explicit; framing-not-repair is the narrowest path that makes team use sane, with current STATUS-less drafts called out honestly.

### Lane 6: Final Readiness Gate

Outcome: a small proof gate says whether the repo is ready for Gavin and Ivan.

The final gate must prove three things:

1. Repo/runtime generation is internally consistent.
2. Installed Claude/Codex runtime surfaces point at this checkout.
3. Teammate portability hazards are gone or explicitly documented.

Required command/checklist shape from repo root:

```bash
python3 runtimes/scripts/generate.py
python3 runtimes/scripts/check-runtime-parity.py
python3 codex/scripts/check-shared-docs-adoption.py
python3 codex/scripts/check-tribune-shared-docs.py
bash codex/scripts/install-codex-skills.sh --dry-run
```

After install is intentionally allowed, the final installed gate must first run the documented Claude install/refresh path for the current checkout. If that path is not a single wrapper command, the implementation plan and readiness docs must list the exact command sequence.

After Claude refresh, the installed gate must include:

```bash
bash codex/scripts/install-codex.sh --prune-agents
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-shared-docs-adoption.py --installed
python3 codex/scripts/check-tribune-shared-docs.py --installed
readlink ~/.agents/skills/tribune
```

The gate must also include a human-readable teammate portability check:

- Claude plugin path points at the current checkout's `claude/` directory.
- The installed gate is invalid if no Claude install/refresh path exists before `check-runtime-parity.py --installed`.
- Fresh Codex config behavior is tested with a clean or simulated home/config, or with an equivalent dedicated preflight check, so a Milovan-local pass cannot hide a Gavin/Ivan first-install failure.
- Codex installed agent config is machine-checked so every Consilium `config_file` path points at the current user's `~/.codex/agents`, not `/Users/milovan`.
- Supported active source, generated, config, skill, and install-facing files are scanned for `/Users/milovan`; any remaining hit is either removed or recorded as an allowed local default with explicit teammate override instructions.
- Supported active source, generated, config, skill, and install-facing files are scanned for `Superpowers`, `superpowers`, `OpenCode`, `opencode`, `Cursor`, `Gemini`, and `Copilot`; any remaining hit is either inactive history, explicitly retired, or removed from the supported surface.
- `CONSILIUM_DOCS` resolves to the teammate's checkout `docs/` directory and passes the `CONVENTIONS.md` marker check.
- Root onboarding files exist and do not mention unsupported V1 runtimes as supported.
- Active first-party install docs do not instruct users to install upstream Superpowers.
- `claude/hooks/session-start` is not registered as an active hook.
- `git status --short` is clean except for intentionally uncommitted case/spec work before the share branch is declared ready.

**Confidence: Medium** - command list is verified locally; non-Milovan teammate portability still needs proof on a second machine or account.

## Phalanx Shape

This is a multi-wave campaign.

Wave 1 can run in parallel:

- Root orientation.
- Docs/case presentation.
- Codex documentation and preflight tightening.

Wave 2 can run after Wave 1 or partly in parallel with it:

- Claude README and hook cleanup.
- Inherited unsupported surface retirement.
- Visual companion and legacy command cleanup where active.

Wave 3 must run last:

- Final readiness gate.
- Installed Claude/Codex smoke.
- Portability proof.
- Spec/status update after proof.

Edicts must keep these lanes separate enough that implementation agents do not rewrite the same files without coordination. The later plan owns exact file tasks and sequencing.

**Confidence: Medium** - lanes are disjoint enough for phalanx work, but Edicts/Praetor must confirm file collisions before dispatch.

## Assumptions Baked In

- Root `CLAUDE.md` is required because Claude is a supported V1 runtime and first-clone orientation should not require entering `claude/` first.
- Case status drift is not a V1 cleanup target because repairing dozens of case folders, including current unrelated drafts, would expand scope without improving runtime readiness.
- Codex portability must be fixed or explicitly documented before Gavin/Ivan use the repo because current generated config and generated prompt bodies use Milovan-specific absolute paths.
- Active supported skill bodies need stale-reference coverage because teammates can hit them through normal Claude/Codex use, even if the top-level docs are clean.
- Claude `session-start` removal is a locked V1 product decision because the hook does not bring enough value for internal team use.

**Confidence: Medium** - these are Consul judgments from the evidence and the Imperator's prior decisions.

## Open Decision Gates Before Edicts

No Imperator decision blocks the master spec.

Milovan resolved the prior non-blocking hook decision: remove the Claude `session-start` hook from active registration for V1.

**Confidence: High** - the remaining hook direction is explicit.

## Success Criteria

- Root onboarding lets Gavin or Ivan understand the repo in five minutes.
- Claude and Codex are the only presented V1 runtimes.
- No active first-party install doc tells teammates to install upstream Superpowers.
- Cursor/OpenCode/Gemini/Copilot inherited surfaces are not active-looking V1 instructions.
- Active hooks do not inject stale or missing Superpowers content.
- The Claude `session-start` hook is not registered as an active V1 hook.
- Source, generated output, compatibility copies, and installed runtime files are clearly distinguished.
- A Claude install/refresh path exists and is run before installed parity is claimed.
- Fresh Codex config behavior is proven for missing config and missing `[features]` conditions, or a dedicated preflight blocks those states with clear instructions before partial install.
- Codex setup does not hard-code Milovan's home path for teammates.
- Active supported prompt/source/runtime bodies do not contain Milovan-only absolute paths unless the final gate explicitly lists the reference as an allowed local default with teammate override instructions.
- `$CONSILIUM_DOCS` setup is clear for non-Milovan machines.
- Case history remains available and intentionally framed as history plus STATUS-less/unclassified working material with uneven legacy completeness.
- The final readiness gate passes after implementation and install.

**Confidence: High** - these criteria directly test the stated team-share goal.

## Verification Notes

Spec hardening was informed by:

- Phase 0 `$CONSILIUM_DOCS` resolution to `/Users/milovan/projects/Consilium/docs`.
- Direct reads of the current draft spec and `STATUS.md`.
- Direct reads of root, `claude/`, `codex/`, `generated/`, `docs/`, and runtime scripts.
- Local runtime/readiness checks listed in Current Runtime Truth.
- Independent Speculator passes for root/docs, Claude/inherited surfaces, and Codex/readiness gates.

Verification of the final implementation must still occur after Edicts and execution. Passing on Milovan's machine is necessary but not sufficient; V1 should either be tested on a non-Milovan account/machine or include a deliberate portability proof that would catch the same path assumptions.

**Confidence: High** - current spec proof is strong; future implementation proof remains required.
