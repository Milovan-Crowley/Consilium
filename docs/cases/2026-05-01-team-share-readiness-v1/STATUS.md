---
status: closed
opened: 2026-05-01
closed: 2026-05-03
target: consilium
agent: codex
type: infra
sessions: 1
current_session: 1
---

## Current state

Implementation and final campaign review are complete. Final Censor, Praetor, and Provocator re-checks returned SOUND after the last packaging/proof gaps were patched.

Milovan's runtime fixes have landed on `main`. A fresh readiness pass confirmed the runtime parity and installed shared-docs checks are green on Milovan's machine, but the hardened spec now treats teammate portability as part of readiness because generated Codex config and shared-docs defaults can still assume Milovan-specific paths.

The execution plan is written at `docs/cases/2026-05-01-team-share-readiness-v1/plan.md`.

Milovan approved adding a bounded parallel-safe wave after Task 0. The plan now allows Tasks 1-4 to run under `consilium:phalanx`, then returns to `consilium:legion` for Tasks 5-8. Praetor found and the plan patched one wave-read overlap: Task 1 now reads only stable contract files during the wave. Praetor re-checked the patched callout and returned SOUND. Pre-dispatch review narrowed Task 4 wave verification to no-write syntax, fixture, and dry-run checks so generation and installed proof stay in Tasks 7-8.

Verifier pass completed after the first edict draft. Praetor, Provocator, and Custos found dispatch blockers in the first plan: missing dirty-baseline guard, bad Claude plugin paths, a missing Codex validator command, overbroad stale scans, brittle `rg` gates, missed active source files, missed `.version-bump.json`, and underspecified Claude/Codex install proof. A second pass found remaining source/doctrine and shared-docs guard gaps. The plan has been revised to absorb those findings, and the verifier decisions are recorded in `decisions.md`.

## What's next

- [x] Land the separate runtime hook/output-type changes.
- [x] Re-run readiness reconnaissance against the updated Claude/Codex surfaces.
- [x] Harden this spec into a phalanx-friendly master cleanup scope.
- [x] Milovan review/approval of master spec.
- [x] Issue edicts after approval.
- [x] Run verifier pass over edict and patch dispatch blockers.
- [x] Declare bounded Phalanx wave for Tasks 1-4 after Task 0.
- [x] Execute Task 0 dispatch baseline.
- [x] Execute Tasks 1-4 with `consilium:phalanx`; wave Tribunus returned SOUND.
- [x] Execute Tasks 5-7 sequentially; per-task Tribunus gates returned SOUND after Task 6 concern was patched.
- [x] Execute Task 8 installed readiness proof.
- [x] Run final campaign review; final Censor, Praetor, and Provocator re-checks returned SOUND.

## Implementation proof

Task 0 resolved `$CONSILIUM_DOCS` to `/Users/milovan/projects/Consilium/docs` and recorded the dirty baseline in `dispatch-baseline.md`.

Installed readiness proof was rerun under `set -euo pipefail` after adding the missing checker `--installed` modes. Passing commands:

```bash
bash claude/scripts/install-claude.sh
python3 claude/scripts/check-claude-install.py --repo "$(pwd)" --home "$HOME" --settings "$HOME/.claude/settings.json" --installed
bash codex/scripts/install-codex.sh --prune-agents
python3 runtimes/scripts/check-runtime-parity.py --installed
python3 codex/scripts/check-codex-config-portability.py --installed
python3 codex/scripts/check-shared-docs-adoption.py --installed
python3 codex/scripts/check-tribune-shared-docs.py --installed
```

Claude installer invalid-settings preflight proof also passed:

```bash
tmp_home="$(mktemp -d)"
mkdir -p "$tmp_home/.claude"
printf '{bad json\n' > "$tmp_home/.claude/settings.json"
if bash claude/scripts/install-claude.sh --home "$tmp_home" >/tmp/consilium-invalid-settings.out 2>/tmp/consilium-invalid-settings.err; then
  echo "installer unexpectedly accepted invalid JSON" >&2
  exit 1
fi
test ! -e "$tmp_home/.claude/agents"
test ! -e "$tmp_home/.claude/plugins/consilium"
rm -rf "$tmp_home"
```

Expected stderr shape:

```text
<tmp>/.claude/settings.json: invalid JSON: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)
```

Repo-local Task 7 proof also passed:

```bash
python3 runtimes/scripts/generate.py
python3 runtimes/scripts/check-runtime-parity.py
bash codex/scripts/install-codex-agents.sh --validate-only
bash codex/scripts/install-codex-skills.sh --dry-run
python3 codex/scripts/check-shared-docs-adoption.py
python3 codex/scripts/check-tribune-shared-docs.py
git diff --check
```

Final active-surface stale-reference scan showed no unrecorded unsupported-runtime instructions. Exact command:

```bash
ACTIVE_SURFACES=(
  README.md AGENTS.md CLAUDE.md
  docs/README.md docs/INDEX.md docs/cases/README.md
  claude claude/.claude-plugin
  codex/README.md codex/scripts codex/config
  runtimes/scripts
  source generated codex/source codex/agents
)
rg --sort path -n "Superpowers|superpowers|\\.superpowers|OpenCode|Cursor|Gemini|Copilot|/Users/milovan" "${ACTIVE_SURFACES[@]}" || true
rg --sort path -n "consilium-principales|MOONSHOT|Moonshot|Kimi|check-codex-drift|All 5 agents" claude source/manifest.json generated/claude/agents codex/agents codex/README.md codex/scripts || true
rg --sort path -n "bash scripts/|python3 scripts/" codex/README.md codex/scripts || true
test ! -e claude/mcps/principales && echo "OK: claude/mcps/principales absent"
test ! -e claude/docs && echo "OK: claude/docs absent"
test ! -e claude/scripts/check-codex-drift.py && echo "OK: claude/scripts/check-codex-drift.py absent"
git status --short
```

Exact scan output:

```text
## active scan
claude/scripts/check-tribune-staleness.py:31:    (r"\bJesse\b", "superpowers authorship reference"),
claude/scripts/check-tribune-staleness.py:34:    (r"superpowers[:-]", "superpowers provenance marker"),
codex/README.md:44:- Runtime shared doctrine and Consilium artifacts live in `$CONSILIUM_DOCS`. On Milovan's machine the fallback is `/Users/milovan/projects/Consilium/docs`; teammates should export their own `consilium-docs` checkout path.
codex/README.md:53:Codex Consilium agents expect `$CONSILIUM_DOCS` to resolve to a valid `consilium-docs` checkout. The default is `/Users/milovan/projects/Consilium/docs`.
codex/scripts/check-codex-config-portability.py:47:    if "/Users/milovan" in text:
codex/scripts/check-codex-config-portability.py:48:        raise SystemExit(f"{label}: contains /Users/milovan")
codex/scripts/check-shared-docs-adoption.py:30:    (re.compile(r"/Users/milovan/projects/Consilium/codex/docs/consilium"), "local Codex docs/consilium path"),
codex/scripts/check-shared-docs-adoption.py:42:    (re.compile(r'export CONSILIUM_DOCS="\$\{CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs\}"'), "exported default CONSILIUM_DOCS"),
codex/scripts/check-shared-docs-adoption.py:52:    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',
codex/scripts/check-tribune-shared-docs.py:21:CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", "/Users/milovan/projects/Consilium/docs"))
codex/scripts/check-tribune-shared-docs.py:61:    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',
source/doctrine/common.md:19:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-arbiter.md:51:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-censor.md:51:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-centurio-back.md:68:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-centurio-front.md:65:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-centurio-primus.md:63:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-custos.md:154:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-interpres-back.md:57:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-interpres-front.md:51:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-praetor.md:54:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-provocator.md:53:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-speculator-back.md:65:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-speculator-front.md:64:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-speculator-primus.md:55:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-tabularius.md:65:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/claude/agents/consilium-tribunus.md:115:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-arbiter.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-censor.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-centurio-back.toml:65:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-centurio-front.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-centurio-primus.toml:60:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-consul.toml:91:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-custos.toml:151:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-interpres-back.toml:54:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-interpres-front.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-legatus.toml:111:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-praetor.toml:51:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-provocator.toml:50:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-speculator-back.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-speculator-front.toml:61:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-speculator-primus.toml:52:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-tabularius.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
generated/codex/agents/consilium-tribunus.toml:112:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/source/doctrine/common.md:19:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-arbiter.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-censor.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-centurio-back.toml:65:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-centurio-front.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-centurio-primus.toml:60:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-consul.toml:91:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-custos.toml:151:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-interpres-back.toml:54:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-interpres-front.toml:48:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-legatus.toml:111:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-praetor.toml:51:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-provocator.toml:50:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-speculator-back.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-speculator-front.toml:61:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-speculator-primus.toml:52:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-tabularius.toml:62:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
codex/agents/consilium-tribunus.toml:112:export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"

## active unsupported substrate scan
claude/scripts/check-claude-install.py:84:        plugin_link / "scripts" / "check-codex-drift.py",

## codex stale command scan

## retired path checks
OK: claude/mcps/principales absent
OK: claude/docs absent
OK: claude/scripts/check-codex-drift.py absent
```

Exact final `git status --short` output:

```text
 M .planning/2026-05-01-consilium-tightening-briefing.md
 D claude/.codex/INSTALL.md
 D claude/.cursor-plugin/plugin.json
 D claude/.opencode/INSTALL.md
 D claude/.opencode/plugins/superpowers.js
 D claude/.version-bump.json
 D claude/CHANGELOG.md
 M claude/CLAUDE.md
 M claude/README.md
 D claude/RELEASE-NOTES.md
 D claude/commands/brainstorm.md
 D claude/commands/execute-plan.md
 D claude/commands/write-plan.md
 D claude/docs/CONSILIUM-VISION.md
 D claude/docs/README.codex.md
 D claude/docs/README.opencode.md
 D claude/docs/claude-subagents-mcp-findings.md
 D claude/docs/testing-agents.md
 D claude/docs/testing.md
 D claude/docs/windows/polyglot-hooks.md
 M claude/hooks/hooks-cursor.json
 M claude/hooks/hooks.json
 M claude/hooks/run-hook.cmd
 D claude/hooks/session-start
 D claude/mcps/principales/.gitignore
 D claude/mcps/principales/README.md
 D claude/mcps/principales/package-lock.json
 D claude/mcps/principales/package.json
 D claude/mcps/principales/prompts/ambiguity-audit.md
 D claude/mcps/principales/prompts/confidence-map-sanity.md
 D claude/mcps/principales/prompts/contradiction-hunt.md
 D claude/mcps/principales/prompts/edge-case-attack.md
 D claude/mcps/principales/prompts/literal-execution-failure.md
 D claude/mcps/principales/prompts/migration-risk.md
 D claude/mcps/principales/prompts/task-domain-correctness.md
 D claude/mcps/principales/prompts/task-integration-prior.md
 D claude/mcps/principales/prompts/task-no-stubs.md
 D claude/mcps/principales/prompts/task-ordering.md
 D claude/mcps/principales/prompts/task-plan-match.md
 D claude/mcps/principales/prompts/test-command-plausibility.md
 D claude/mcps/principales/prompts/undefined-references.md
 D claude/mcps/principales/prompts/upstream-coverage.md
 D claude/mcps/principales/schemas/principalis_docket.v1.json
 D claude/mcps/principales/src/docket/cross-field.ts
 D claude/mcps/principales/src/docket/evidence-quality.ts
 D claude/mcps/principales/src/docket/locator.ts
 D claude/mcps/principales/src/docket/schema.ts
 D claude/mcps/principales/src/index.ts
 D claude/mcps/principales/src/moonshot/client.ts
 D claude/mcps/principales/src/moonshot/types.ts
 D claude/mcps/principales/src/pipeline/parameter-scrubber.ts
 D claude/mcps/principales/src/pipeline/request-builder.ts
 D claude/mcps/principales/src/pipeline/retry-mapper.ts
 D claude/mcps/principales/src/runtime/budget.ts
 D claude/mcps/principales/src/runtime/concurrency.ts
 D claude/mcps/principales/src/runtime/telemetry.ts
 D claude/mcps/principales/src/server.ts
 D claude/mcps/principales/src/tools/health.ts
 D claude/mcps/principales/src/tools/mode.ts
 D claude/mcps/principales/src/tools/verify-lane.ts
 D claude/mcps/principales/test/cross-field.test.ts
 D claude/mcps/principales/test/disable-thinking.test.ts
 D claude/mcps/principales/test/evidence-quality.test.ts
 D claude/mcps/principales/test/health-mode.test.ts
 D claude/mcps/principales/test/locator.test.ts
 D claude/mcps/principales/test/moonshot-client.test.ts
 D claude/mcps/principales/test/parameter-scrubber.test.ts
 D claude/mcps/principales/test/prompt-discovery.test.ts
 D claude/mcps/principales/test/request-builder.test.ts
 D claude/mcps/principales/test/retry-mapper.test.ts
 D claude/mcps/principales/test/runtime.test.ts
 D claude/mcps/principales/test/sanity.test.ts
 D claude/mcps/principales/test/schema.test.ts
 D claude/mcps/principales/test/verify-lane.test.ts
 D claude/mcps/principales/tsconfig.json
 D claude/mcps/principales/vitest.config.ts
 D claude/scripts/bump-version.sh
 D claude/scripts/check-codex-drift.py
 M claude/skills/audit/SKILL.md
 M claude/skills/castra/SKILL.md
 M claude/skills/consul/SKILL.md
 M claude/skills/consul/scripts/frame-template.html
 M claude/skills/consul/scripts/start-server.sh
 M claude/skills/consul/scripts/stop-server.sh
 M claude/skills/consul/visual-companion.md
 M claude/skills/edicts/SKILL.md
 M claude/skills/legion/SKILL.md
 M codex/README.md
 M codex/agents/consilium-arbiter.toml
 M codex/agents/consilium-centurio-back.toml
 M codex/agents/consilium-centurio-front.toml
 M codex/agents/consilium-consul.toml
 M codex/agents/consilium-interpres-back.toml
 M codex/agents/consilium-interpres-front.toml
 M codex/agents/consilium-legatus.toml
 M codex/agents/consilium-speculator-back.toml
 M codex/agents/consilium-speculator-front.toml
 M codex/config/codex-config-snippet.toml
 M codex/scripts/install-codex-agents.sh
 M codex/scripts/install-codex-skills.sh
 M codex/scripts/install-codex.sh
 M codex/scripts/sync-codex-config.py
 M codex/source/doctrine/backend.md
 M codex/source/doctrine/frontend.md
 M codex/source/manifest.json
 M codex/source/protocols/consul-routing.md
 M codex/source/skills/claude/audit/SKILL.md
 M codex/source/skills/claude/castra/SKILL.md
 M codex/source/skills/claude/consul/SKILL.md
 M codex/source/skills/claude/consul/scripts/frame-template.html
 M codex/source/skills/claude/consul/scripts/start-server.sh
 M codex/source/skills/claude/consul/scripts/stop-server.sh
 M codex/source/skills/claude/consul/visual-companion.md
 M codex/source/skills/claude/edicts/SKILL.md
 M codex/source/skills/claude/legion/SKILL.md
 M docs/INDEX.md
 M docs/README.md
 M docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/STATUS.md
 M docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/hook-runtime-inventory.md
 M docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/plan.md
 M docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/spec.md
 M docs/cases/2026-05-01-team-share-readiness-v1/STATUS.md
 M docs/cases/2026-05-01-team-share-readiness-v1/spec.md
 M generated/claude/agents/consilium-arbiter.md
 M generated/claude/agents/consilium-centurio-back.md
 M generated/claude/agents/consilium-centurio-front.md
 M generated/claude/agents/consilium-interpres-back.md
 M generated/claude/agents/consilium-interpres-front.md
 M generated/claude/agents/consilium-speculator-back.md
 M generated/claude/agents/consilium-speculator-front.md
 M generated/claude/agents/consilium-tribunus.md
 M generated/claude/skills/audit/SKILL.md
 M generated/claude/skills/castra/SKILL.md
 M generated/claude/skills/consul/SKILL.md
 M generated/claude/skills/consul/scripts/frame-template.html
 M generated/claude/skills/consul/scripts/start-server.sh
 M generated/claude/skills/consul/scripts/stop-server.sh
 M generated/claude/skills/consul/visual-companion.md
 M generated/claude/skills/edicts/SKILL.md
 M generated/claude/skills/legion/SKILL.md
 M generated/codex/agents/consilium-arbiter.toml
 M generated/codex/agents/consilium-centurio-back.toml
 M generated/codex/agents/consilium-centurio-front.toml
 M generated/codex/agents/consilium-consul.toml
 M generated/codex/agents/consilium-interpres-back.toml
 M generated/codex/agents/consilium-interpres-front.toml
 M generated/codex/agents/consilium-legatus.toml
 M generated/codex/agents/consilium-speculator-back.toml
 M generated/codex/agents/consilium-speculator-front.toml
 M generated/codex/config/codex-config-snippet.toml
 M runtimes/scripts/check-runtime-parity.py
 M runtimes/scripts/generate.py
 M source/doctrine/backend.md
 M source/doctrine/frontend.md
 M source/manifest.json
 M source/protocols/consul-routing.md
 M source/skills/claude/audit/SKILL.md
 M source/skills/claude/castra/SKILL.md
 M source/skills/claude/consul/SKILL.md
 M source/skills/claude/consul/scripts/frame-template.html
 M source/skills/claude/consul/scripts/start-server.sh
 M source/skills/claude/consul/scripts/stop-server.sh
 M source/skills/claude/consul/visual-companion.md
 M source/skills/claude/edicts/SKILL.md
 M source/skills/claude/legion/SKILL.md
?? AGENTS.md
?? CLAUDE.md
?? README.md
?? claude/scripts/check-claude-install.py
?? claude/scripts/install-claude.sh
?? codex/scripts/check-codex-config-portability.py
?? docs/cases/2026-05-01-team-share-readiness-v1/decisions.md
?? docs/cases/2026-05-01-team-share-readiness-v1/dispatch-baseline.md
?? docs/cases/2026-05-01-team-share-readiness-v1/plan.md
?? docs/cases/README.md
```

Remaining hits are allowed:

- `claude/scripts/check-tribune-staleness.py` contains stale-reference detector regexes.
- `claude/scripts/check-claude-install.py` contains a retired-path assertion for `check-codex-drift.py`; that is a guard, not active guidance.
- `codex/scripts/check-shared-docs-adoption.py` and `codex/scripts/check-tribune-shared-docs.py` contain the sanctioned `$CONSILIUM_DOCS` local default and checker patterns.
- `source/doctrine/common.md`, generated Claude agents, generated Codex agents, `codex/source/doctrine/common.md`, and installed-compatible agent files contain the sanctioned `$CONSILIUM_DOCS` default with override/failure guidance.
- `codex/README.md` documents Milovan's local fallback and tells teammates to export their own `$CONSILIUM_DOCS`.

`git status --short` still includes unrelated baseline-dirty files under `.planning/2026-05-01-consilium-tightening-briefing.md` and `docs/cases/2026-05-01-consilium-file-ownership-hook-marker-activation/`. Those were recorded as baseline noise in `dispatch-baseline.md` and remain outside the intended output for this implementation. The baseline is path-level proof, not content-fingerprint proof.

## Open questions

None blocking.

Milovan resolved the prior Claude `session-start` question: remove it from active V1 hook registration.

## Final review

Final narrow campaign re-checks returned SOUND after the last patch round:

- Praetor verified that the recorded final scan and `git status --short` blocks match live output, that retired Claude plugin paths are checked, and that installed/repo-local gates pass.
- Provocator verified that `~/.claude/plugins/consilium` no longer exposes `mcps/principales`, `docs`, or `scripts/check-codex-drift.py`, and that Codex install help is repo-root-valid.
- Censor verified the implemented state matches the V1 contract: internal team only, Claude + Codex only, no active `session-start`, no active Principales/Moonshot/Kimi substrate, and stale Claude docs removed from the shipped plugin.
