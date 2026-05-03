# Spec Contract Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task.

**Goal:** Add the Tabularius Contract Inventory verifier to Consilium and wire the rule into both Claude Consul and Codex Consul runtime surfaces.

**Plan Scale:** Feature

**Implementation Shape:** Edit only canonical source files first: the Consul skill source, the Codex-consumed Consul routing protocol, one new role file, one manifest entry, and one verification template. Run the existing generator after all canonical edits are complete; generated and compatibility outputs are derived artifacts, never hand-edited. Install and installed-parity proof are a separate final task because repo-local generation does not prove the active user-scope runtime.

**Scope In:**
- Maintain this case's `STATUS.md`.
- Add the Contract Inventory rule to `source/skills/claude/consul/SKILL.md`.
- Add the same operational rule and Tabularius dispatch order to `source/protocols/consul-routing.md`.
- Add `source/roles/tabularius.md`.
- Add `consilium-tabularius` to `source/manifest.json`.
- Add `source/skills/claude/references/verification/templates/contract-inventory-verification.md`.
- Regenerate repo-local runtime outputs, install user-scope runtime files, and prove installed parity.

**Scope Out:**
- No Censor role change.
- No Provocator role or mission change.
- No edit to `source/skills/claude/references/verification/templates/spec-verification.md`.
- No new tools profile, generator profile, schema validator, or MCP-server special case.
- No change to Brief fields, Estimate-lite content, self-review items 1-5, edicts, legion, march, tribune, audit, or triumph flows.
- No backfill of Contract Inventory sections into old case specs.

**Verification:** `python3 runtimes/scripts/generate.py`; `python3 runtimes/scripts/check-runtime-parity.py`; install generated Claude agents into `$HOME/.claude/agents`; `bash codex/scripts/install-codex.sh`; `python3 runtimes/scripts/check-runtime-parity.py --installed`; targeted `rg` and `jq` checks named below.

---

### Task 0: Capture Preflight State And Case Convention

**Files:**
- Modify: `$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory/STATUS.md`
- Create: `$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory/ref-preflight/`
- Read: `$CONSILIUM_DOCS/CONVENTIONS.md`
- Read: `source/doctrine/common.md`

**Objective:** Establish the dirty-worktree and case-state baseline before implementation touches source or generated runtime files.

**Decisions already made:**
- Resolve and export `$CONSILIUM_DOCS` before reading or writing this case folder. Do not fall back to cwd-relative `docs/` paths for shared case artifacts.
- The case folder must include `STATUS.md` because `$CONSILIUM_DOCS/CONVENTIONS.md` requires it for every case.
- Set `status: routed` while this plan is ready for execution but implementation has not landed.
- Capture the exact pre-implementation git baseline before source edits:
  - base SHA from `git rev-parse HEAD`
  - human-readable status from `git status --short`
  - normalized dirty path list from `git diff --name-only`, `git diff --name-only --cached`, and `git ls-files --others --exclude-standard`
  - active Claude plugin symlink target resolved the same way `check-runtime-parity.py --installed` resolves it
- Store preflight evidence under `$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory/ref-preflight/`.
- Store a sorted JSON snapshot of every pre-existing manifest agent except `consilium-tabularius` under `ref-preflight/manifest-existing-agents.json`; Task 6 uses it to prove existing manifest agents were not changed while adding the new one.
- Later scope checks compare final state against this baseline. Do not treat unrelated files that were dirty before implementation as this campaign's changes.

**Acceptance:**
- `STATUS.md` exists with required frontmatter fields: `status`, `opened`, `target`, `agent`, `type`, `sessions`, and `current_session`.
- The implementer has a baseline that includes tracked and untracked files.
- The active Claude plugin symlink target is known before install decisions.

**Verification:**
- Run as one self-contained preflight block; do not rely on `CASE_DIR` persisting into later shell invocations:
  ```bash
  export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"
  [ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
  [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
    echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
    exit 1
  }
  [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
    echo "consilium-docs migration in progress - halt."
    exit 1
  }
  export CASE_DIR="$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory"
  mkdir -p "$CASE_DIR/ref-preflight"
  python3 -c 'import os; from pathlib import Path; text=Path(os.environ["CASE_DIR"], "STATUS.md").read_text(); required=["status:","opened:","target:","agent:","type:","sessions:","current_session:"]; missing=[field for field in required if field not in text]; raise SystemExit("missing STATUS fields: "+", ".join(missing) if missing else 0)'
  git rev-parse HEAD > "$CASE_DIR/ref-preflight/base-sha.txt"
  git status --short > "$CASE_DIR/ref-preflight/git-status-short.txt"
  { git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard; } | sort -u > "$CASE_DIR/ref-preflight/git-dirty-paths.txt"
  python3 - <<'PY' > "$CASE_DIR/ref-preflight/claude-plugin-symlink.txt"
from pathlib import Path
link = Path.home() / ".claude" / "plugins" / "consilium"
print(link.resolve(strict=False) if link.is_symlink() else "not-a-symlink")
PY
  jq -S '.agents | map(select(.name!="consilium-tabularius"))' source/manifest.json > "$CASE_DIR/ref-preflight/manifest-existing-agents.json"
  ```
- Expected: exits zero, writes all preflight files, and does not require any shell variable to persist after the block.

**Stop conditions:** If `STATUS.md` cannot be brought into convention before source edits, stop and fix the case folder first.

### Task 1: Add The Tabularius Rank And Manifest Entry
> **Evidence:** Implements [spec §2 — The Tabularius Rank](spec.md#2-the-tabularius-rank) and [spec §5 — The Manifest Entry](spec.md#5-the-manifest-entry). Live generator evidence: `runtimes/scripts/generate.py` reads `source/manifest.json`, requires `nickname_candidates`, consumes `role_file`, includes `include_files`, renders Codex top-level `model` and `reasoning_effort`, and renders Claude frontmatter from `runtime_surfaces.claude.model` plus `tools_profile`.

**Files:**
- Create: `source/roles/tabularius.md`
- Modify: `source/manifest.json`
- Read: `source/roles/censor.md`
- Read: `source/roles/praetor.md`
- Read: `runtimes/scripts/generate.py`
- Do not touch: `generated/`, `codex/source/`, `codex/agents/`, `claude/skills/`

**Objective:** Declare the new Tabularius verifier rank in canonical source so both runtimes can generate it.

**Decisions already made:**
- The role file is compact, matching the existing role-file style: heading, rank, function, creed, ownership bullets, voice, output.
- The role identity is `Marcus Tabularius`, rank `Tabularius`, function `independent verifier of intra-spec contract coverage`.
- The creed is: `Every contract gets a name and a home, or it does not exist.`
- The role owns only enumeration and matching: canonical-six contract surfaces, Contract Inventory coverage, orphan Inventory entries, contract definitions missing from Inventory, and honest empty Inventory declarations.
- The role refuses design review, domain-correctness review, alternate architecture, and Censor/Provocator mission overlap.
- The manifest entry name is `consilium-tabularius`.
- Use `tools_profile: read` on the Claude runtime surface. Do not add `mcp_servers: []`; the current generator defaults omitted `mcp_servers` to Serena/Medusa, and this plan does not change that generator behavior.
- Use `runtime_surfaces.claude.surface: agent`, `enabled: true`, and `model: sonnet`.
- Use `runtime_surfaces.codex.surface: agent` and `enabled: true`.
- Use `sandbox_mode: read-only`.
- Use `role_file: roles/tabularius.md`.
- Include `doctrine/common.md`, `doctrine/medusa-backend.md`, `doctrine/cross-repo.md`, and `doctrine/verifier-law.md` so the generated agent has the standard verifier category law. The role file and verification template must explicitly enumerate the canonical-six contract types; do not rely on doctrine files to supply that vocabulary.
- Determine Codex `reasoning_effort` from the manifest state at implementation time:
  - If `consilium-praetor` is already Tier II with `reasoning_effort: medium`, set Tabularius to `model: gpt-5.5` and `reasoning_effort: medium`.
  - If the manifest is still uniformly `xhigh`, set Tabularius to `model: gpt-5.5` and `reasoning_effort: xhigh`. The model-tiering campaign will lower it later.
- `nickname_candidates` must be present because `generate.py` uses the field when rendering Codex config. Use `tabularius`, `marcus tabularius`, and `record keeper`.
- Do not modify generator code for Sonnet admission; current generator passes the Claude model string through without validation.

**Acceptance:**
- `source/roles/tabularius.md` exists and states the role's rank, function, creed, ownership, refusal boundaries, voice, and Codex-category output contract.
- `source/manifest.json` contains exactly one `consilium-tabularius` entry.
- The manifest entry has a valid `nickname_candidates` array, `tools_profile: read`, Claude `model: sonnet`, and Codex `model: gpt-5.5`.
- The manifest entry does not set `mcp_servers` to an empty list.
- No generated or compatibility file changes are hand-made in this task.

**Verification:**
- Run: `jq -r '.agents[] | select(.name=="consilium-tabularius") | [.name,.role_file,.sandbox_mode,.model,.reasoning_effort,.runtime_surfaces.claude.surface,.runtime_surfaces.claude.model,.runtime_surfaces.claude.tools_profile,.runtime_surfaces.codex.surface,(.include_files|join(","))] | @tsv' source/manifest.json`
- Expected: one line with `consilium-tabularius`, `roles/tabularius.md`, `read-only`, `gpt-5.5`, the selected reasoning effort, Claude `agent`, Claude `sonnet`, Claude `read`, Codex `agent`, and include files containing `doctrine/common.md`, `doctrine/medusa-backend.md`, `doctrine/cross-repo.md`, and `doctrine/verifier-law.md`.
- Run: `jq '[.agents[] | select(.name=="consilium-tabularius")] | length' source/manifest.json`
- Expected: `1`.
- Run: `for term in "Every contract gets a name and a home" "wire shape on a module boundary" "API contract at a module boundary" "idempotency anchor" "link.create boundary" "workflow ownership claim" "subscriber boundary" "Inventory entries without spec definitions" "contract definitions without Inventory entries" "MISUNDERSTANDING" "GAP" "CONCERN" "SOUND"; do rg -Fq "$term" source/roles/tabularius.md || { echo "missing $term"; exit 1; }; done`
- Expected: exits zero, proving every required role term is present.
- Run: `CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; diff -u "$CASE_DIR/ref-preflight/manifest-existing-agents.json" <(jq -S '.agents | map(select(.name!="consilium-tabularius"))' source/manifest.json)`
- Expected: no output; every pre-existing manifest agent is unchanged.

**Stop conditions:** If `source/manifest.json` has already changed to a schema that no longer uses `nickname_candidates`, `role_file`, `include_files`, or `runtime_surfaces`, stop and report the schema drift before editing.

### Task 2: Add Contract Inventory Discipline To Consul Routing
> **Evidence:** Implements [spec §1 — The Contract Inventory Rule](spec.md#1-the-contract-inventory-rule) and [spec §3 — Pre-Verification Dispatch in the Consul Flow](spec.md#3-pre-verification-dispatch-in-the-consul-flow). `source/manifest.json` includes `source/protocols/consul-routing.md` in the Codex `consilium-consul` body, so Codex Consul needs this rule in the protocol, not only in the Claude skill.

**Files:**
- Modify: `source/skills/claude/consul/SKILL.md`
- Modify: `source/protocols/consul-routing.md`
- Read: `source/manifest.json`
- Do not touch: `source/roles/censor.md`
- Do not touch: `source/skills/claude/references/verification/templates/spec-verification.md`
- Do not touch: `source/protocols/legatus-routing.md`
- Do not touch: `source/protocols/plan-format.md`

**Objective:** Make both Claude Consul and Codex Consul require Contract Inventory sections and run Tabularius before Censor plus Provocator unless verification is skipped at the single announcement point.

**Decisions already made:**
- In `source/skills/claude/consul/SKILL.md`, add the Contract Inventory rule inside Phase 3 near the existing Spec Discipline Rule and carve-outs.
- In `source/protocols/consul-routing.md`, add a compact operational section under Pre-Dispatch Shaping or immediately after the fast-lane rule. The wording must make clear that this protocol is the Codex-consumed Consul rule source.
- Update the Consul SKILL.md verification read-list so it reads `/Users/milovan/.claude/plugins/consilium/skills/references/verification/templates/contract-inventory-verification.md` before dispatching Tabularius. The new template is an operational input, not an orphan reference file.
- Update `source/protocols/consul-routing.md` to name `/Users/milovan/.claude/plugins/consilium/skills/references/verification/templates/contract-inventory-verification.md` as the Tabularius dispatch template. Do not name `source/skills/claude/...` as a runtime path; Codex may run outside this repo cwd.
- The canonical-six list is exactly: wire shape on a module boundary, API contract at a module boundary, idempotency anchor, link.create boundary, workflow ownership claim, subscriber boundary.
- A spec that touches any canonical-six surface must include a Contract Inventory section or equivalent unambiguous label.
- Each Inventory entry must name the surface with enough specificity to locate the corresponding contract definition elsewhere in the same spec.
- A spec that touches no contract surface must still declare an empty Inventory with a one-line reason.
- Do not turn Inventory into a schema. It is prose/list discipline, not metadata.
- Do not add a sixth self-review item. Tabularius is a separate pre-verification dispatch step after self-review.
- The verification announcement text is singular: `Dispatching Tabularius, Censor, and Provocator for verification.`
- If the Imperator says `skip` at that announcement, all verification is bypassed. If not skipped, Consul dispatches `consilium-tabularius` in the foreground first, handles findings under protocol rules, then dispatches Censor plus Provocator in parallel.
- Replace the existing Censor-plus-Provocator-only skip prompt. Do not leave the old verification announcement beside the new Tabularius-first flow.
- Tabularius GAPs are fixed inline and re-run before Censor plus Provocator. MISUNDERSTANDING halts. CONCERN is weighed. SOUND proceeds.
- Re-dispatch cap follows the existing verification protocol default, max 2 iterations before escalation.
- Preserve self-review items 1-5 exactly as items 1-5. Nearby prose may mention Tabularius after self-review, but the numbered list must not gain a new item.

**Acceptance:**
- Claude Consul source contains the Contract Inventory rule and empty-Inventory requirement.
- Claude Consul source contains the single-announcement skip contract and foreground Tabularius ordering before Censor plus Provocator.
- Claude Consul source references `contract-inventory-verification.md` in the pre-dispatch read-list.
- Codex Consul routing protocol contains the same operational requirements.
- Codex Consul routing protocol references `contract-inventory-verification.md` as the Tabularius dispatch template.
- Neither source surface leaves the old Censor-plus-Provocator-only skip paragraph alongside the new Tabularius flow.
- `source/roles/censor.md` and `source/skills/claude/references/verification/templates/spec-verification.md` are unchanged by this task.
- No Brief field, Estimate-lite field, or fast-lane condition is added or removed.

**Verification:**
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do for term in "Contract Inventory" "wire shape on a module boundary" "API contract at a module boundary" "idempotency anchor" "link.create boundary" "workflow ownership claim" "subscriber boundary" "empty Inventory"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero, proving both files contain every Inventory-rule term.
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do for term in "Dispatching Tabularius, Censor, and Provocator for verification" "consilium-tabularius" "foreground"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero, proving both files contain the dispatch order and single announcement.
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do rg -Fq "contract-inventory-verification.md" "$file" || { echo "$file missing contract-inventory-verification.md"; exit 1; }; done`
- Expected: exits zero, proving both files connect the new template to the Consul flow.
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do rg -Fq "/Users/milovan/.claude/plugins/consilium/skills/references/verification/templates/contract-inventory-verification.md" "$file" || { echo "$file missing runtime-safe template path"; exit 1; }; done; if rg -F "source/skills/claude/references/verification/templates/contract-inventory-verification.md" source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; then echo "cwd-sensitive source template path remains"; exit 1; fi`
- Expected: exits zero, proving the runtime path is plugin-symlink based rather than cwd-relative source.
- Run: `for file in source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; do count="$(rg -F "Dispatching Tabularius, Censor, and Provocator for verification" "$file" | wc -l | tr -d ' ')"; test "$count" = "1" || { echo "$file has $count Tabularius verification announcements"; exit 1; }; done; if rg -F 'Default on — I announce it. The Imperator can say "skip."' source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md; then echo "old standalone skip prompt remains"; exit 1; fi`
- Expected: exits zero, proving the new single announcement replaced the old skip prompt instead of coexisting with it.
- Run: `BASE_SHA="$(cat "${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory/ref-preflight/base-sha.txt")"; for term in "Goal" "Success metric" "Non-goals" "Domain concepts to verify" "Known constraints" "Unknowns" "Likely code surfaces" "Recon lanes" "Decision gates" "Intent" "Effects" "Terrain" "Forces" "Coordination" "Control" "one repo and one subsystem" "no new domain concept needs doctrine interpretation" "no money, auth, permission, data model, migration, or wire contract surface is touched" "likely implementation is one to five files" "success is observable in one or two outcomes" "no speculator dispatch is needed after a bounded source read" "Placeholder scan" "Internal consistency" "Scope check (decomposition)" "Ambiguity check" "Spec Discipline scope check"; do rg -Fq "$term" source/skills/claude/consul/SKILL.md || { echo "Consul invariant missing after edit: $term"; exit 1; }; done; if git diff -U0 "$BASE_SHA" -- source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md | rg -n '^-.*(Goal|Success metric|Non-goals|Domain concepts to verify|Known constraints|Unknowns|Likely code surfaces|Recon lanes|Decision gates|Intent|Effects|Terrain|Forces|Coordination|Control|Placeholder scan|Internal consistency|Scope check \\(decomposition\\)|Ambiguity check|Spec Discipline scope check)'; then exit 1; fi`
- Expected: exits zero, proving frozen Brief, Estimate-lite, patch fast-lane, and self-review invariants remain present and were not removed in the diff.
- Run: `CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; BASE_SHA="$(cat "$CASE_DIR/ref-preflight/base-sha.txt")"; { git diff --name-only "$BASE_SHA" -- source/skills/claude/references/verification/templates/spec-verification.md source/roles/censor.md source/protocols/legatus-routing.md source/protocols/plan-format.md; git diff --name-only --cached -- source/skills/claude/references/verification/templates/spec-verification.md source/roles/censor.md source/protocols/legatus-routing.md source/protocols/plan-format.md; } | sort -u > "$CASE_DIR/ref-preflight/task2-forbidden-paths.txt"; comm -13 "$CASE_DIR/ref-preflight/git-dirty-paths.txt" "$CASE_DIR/ref-preflight/task2-forbidden-paths.txt"`
- Expected: no output after subtracting the Task 0 dirty-path baseline; pre-existing dirty files are reported in the handoff but are not this task's failure.

**Stop conditions:** If adding the Tabularius step creates two separate `skip` prompts in the Consul flow, stop and fix the flow before continuing. The user gets one verification announcement, not a pre-Tabularius prompt plus another formal-verification prompt.

### Task 3: Add The Contract Inventory Verification Template
> **Evidence:** Implements [spec §4 — The Tabularius Verification Template](spec.md#4-the-tabularius-verification-template). Existing verification templates live under `source/skills/claude/references/verification/templates/`, and the shared protocol supplies prompt skeleton, finding handling, independence, and output category law.

**Files:**
- Create: `source/skills/claude/references/verification/templates/contract-inventory-verification.md`
- Read: `source/skills/claude/references/verification/templates/plan-verification.md`
- Read: `source/skills/claude/references/verification/protocol.md`
- Do not touch: `source/skills/claude/references/verification/templates/spec-verification.md`

**Objective:** Give Consul an operational dispatch template for the Tabularius pass without changing Censor or Provocator verification templates.

**Decisions already made:**
- The template starts with `# Contract Inventory Verification Template`.
- It states: read `verification/protocol.md` first.
- Dispatch timing is after Consul self-review and after the single verification announcement, before Censor plus Provocator.
- The only agent is `consilium-tabularius`.
- The template describes a foreground single dispatch. Do not describe it as a parallel sibling of Censor or Provocator.
- The prompt skeleton consumes the full spec, factual context summary, and optional doctrine excerpts, following the shared protocol structure.
- The Tabularius mission steps are:
  - read the full spec;
  - enumerate every named or implied canonical-six contract surface in the spec body: wire shape on a module boundary, API contract at a module boundary, idempotency anchor, link.create boundary, workflow ownership claim, subscriber boundary;
  - locate the Contract Inventory section, including empty declarations;
  - cross-check Inventory entries against definitions in the spec body;
  - cross-check contract definitions in the spec body against Inventory entries;
  - emit only MISUNDERSTANDING, GAP, CONCERN, or SOUND with chain-of-evidence citations.
- The template must classify missing Inventory, orphan Inventory entry, and defined contract missing from Inventory as GAP.
- The template must classify canonical-six misclassification as MISUNDERSTANDING.
- CONCERN is reserved for clarity of naming/grouping/pointers after coverage exists.
- SOUND requires either complete Inventory coverage or an honest empty Inventory.
- Handling rules reference the existing protocol sections for finding handling and auto-feed; do not restate a competing handling law.

**Acceptance:**
- The new template can be used by a Consul without inventing dispatch timing, agent name, mission steps, or output categories.
- It does not widen Tabularius into design correctness, domain truth, Censor work, or Provocator work.
- It does not edit the existing spec-verification template.

**Verification:**
- Run: `for term in "Contract Inventory Verification Template" "consilium-tabularius" "foreground" "canonical-six" "orphan Inventory" "defined contract missing from Inventory" "MISUNDERSTANDING" "GAP" "CONCERN" "SOUND"; do rg -Fq "$term" source/skills/claude/references/verification/templates/contract-inventory-verification.md || { echo "template missing $term"; exit 1; }; done`
- Expected: exits zero, proving the template contains dispatch identity, mission, and every required category mapping term.
- Run: `for term in "wire shape on a module boundary" "API contract at a module boundary" "idempotency anchor" "link.create boundary" "workflow ownership claim" "subscriber boundary"; do rg -Fq "$term" source/skills/claude/references/verification/templates/contract-inventory-verification.md || { echo "template missing $term"; exit 1; }; done`
- Expected: exits zero, proving all six canonical contract types are explicitly present in the template.
- Run: `git diff --name-only -- source/skills/claude/references/verification/templates/spec-verification.md`
- Expected: no output.

**Stop conditions:** If the template cannot define the mission without changing `verification/protocol.md`, stop and report. This campaign consumes the protocol; it does not amend it.

### Task 4: Regenerate Repo-Local Runtime Outputs
> **Evidence:** Implements the generation half of [spec §5 — The Manifest Entry](spec.md#5-the-manifest-entry) and the generation/install split in the spec Contract Inventory. `runtimes/scripts/generate.py` writes `generated/*`, syncs `codex/source`, syncs `codex/agents`, syncs `codex/config`, and syncs `claude/skills`.

**Files:**
- Modify by generator only: `generated/`
- Modify by generator only: `claude/skills/`
- Modify by generator only: `codex/source/`
- Modify by generator only: `codex/agents/`
- Modify by generator only: `codex/config/`
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Do not hand-edit: any generated or compatibility output

**Objective:** Derive every repo-local Claude and Codex runtime artifact from canonical source and prove repo parity before any user-scope install.

**Decisions already made:**
- Run generation only after Tasks 1-3 are complete.
- Do not edit generated files to fix output. If generated output is wrong, fix canonical source or manifest and re-run the generator.
- `generated/claude/agents/consilium-tabularius.md` must exist after generation because Tabularius is a Claude dispatchable agent.
- `generated/codex/agents/consilium-tabularius.toml` and `codex/agents/consilium-tabularius.toml` must exist after generation because Tabularius is a Codex dispatchable agent.
- `codex/source/manifest.json` and `codex/source/protocols/consul-routing.md` must be generator-synced compatibility copies, not manual patches.
- `claude/skills/consul/SKILL.md` must be generator-synced from `source/skills/claude/consul/SKILL.md`.
- Repo parity proof comes before installed parity proof.

**Acceptance:**
- Generator exits zero.
- Repo parity checker exits zero without `--installed`.
- Generated Claude and Codex Tabularius agent files exist.
- Compatibility copies contain the Contract Inventory rule because they were regenerated from source.

**Verification:**
- Run: `python3 runtimes/scripts/generate.py`
- Expected: exits zero and reports generated Codex agents, Claude agents, Claude skills, and compatibility paths.
- Run: `python3 runtimes/scripts/check-runtime-parity.py`
- Expected: `Consilium repo runtime parity check passed.`
- Run: `test -f generated/claude/agents/consilium-tabularius.md && test -f generated/codex/agents/consilium-tabularius.toml && test -f codex/agents/consilium-tabularius.toml`
- Expected: exits zero.
- Run: `for file in claude/skills/consul/SKILL.md codex/source/protocols/consul-routing.md; do for term in "Contract Inventory" "consilium-tabularius" "contract-inventory-verification.md"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero, proving generated compatibility routing and skill surfaces carry the new rule and template wiring.
- Run: `for file in generated/claude/agents/consilium-tabularius.md generated/codex/agents/consilium-tabularius.toml codex/agents/consilium-tabularius.toml; do rg -Fq "consilium-tabularius" "$file" || { echo "$file missing consilium-tabularius"; exit 1; }; done`
- Expected: exits zero, proving generated Tabularius agent files exist and name the new agent.

**Stop conditions:** If `python3 runtimes/scripts/check-runtime-parity.py` fails, stop and fix the source/generation mismatch before user-scope install. Do not install a repo-local mismatch.

### Task 5: Install Runtime Surfaces And Prove Installed Parity
> **Risk:** Installed parity is checkout-sensitive. `check-runtime-parity.py --installed` expects the active Claude plugin symlink to point at this checkout's `claude/` directory. The plugin symlink target must be checked unconditionally before install proof, even in the main checkout.

**Files:**
- Modify installed runtime: `$HOME/.claude/agents/consilium-*.md`
- Modify installed runtime through script: `$HOME/.codex/agents/consilium-*.toml`
- Modify installed runtime through script: `$HOME/.codex/config.toml`
- May modify symlink only with explicit intent: `$HOME/.claude/plugins/consilium`
- Read: `codex/scripts/install-codex.sh`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Read: `claude/scripts/check-codex-drift.py`
- Do not edit: source files during this task except to fix a parity failure discovered by the proof

**Objective:** Make the active user-scope Claude and Codex runtime match the generated repo outputs, then prove it.

**Decisions already made:**
- Install Claude dispatchable agents with `install`, not `cp`, so permissions are stable and the command is explicit.
- Install Codex agents, skills, and config through `bash codex/scripts/install-codex.sh`.
- Use `python3 runtimes/scripts/check-runtime-parity.py --installed` as the primary installed proof.
- `python3 claude/scripts/check-codex-drift.py` is a legacy wrapper around the same installed parity checker and should also pass for compatibility.
- Remove only the retired Claude agent files named by `runtimes/scripts/check-runtime-parity.py` before installed parity. Installing generated agents does not remove retired files, and installed parity intentionally fails when those stale files remain.
- If running from an isolated worktree and the active Claude plugin symlink points at another checkout, do not claim installed parity from this worktree until the symlink points at this worktree's `claude/` directory or the branch has been merged into the active checkout and install is rerun there.
- If running from the main checkout and the active Claude plugin symlink points at another checkout, intentionally repoint it to `$PWD/claude` before installed parity or defer installed parity. Do not assume main checkout means active runtime checkout.
- After install, fresh Claude and Codex sessions are required before relying on new Tabularius routing.

**Acceptance:**
- `generated/claude/agents/consilium-tabularius.md` is installed at `$HOME/.claude/agents/consilium-tabularius.md`.
- Codex install completes and registers `consilium-tabularius` in `$HOME/.codex/config.toml`.
- Stale retired Claude agent files named by the parity checker are absent from `$HOME/.claude/agents`.
- Installed parity checker exits zero.
- Legacy drift wrapper exits zero.
- The implementer report states whether install proof was run from the isolated worktree or deferred until the active checkout, with the exact reason.

**Verification:**
- Run: `install -d "$HOME/.claude/agents"`
- Expected: exits zero.
- Run: `install -m 0644 generated/claude/agents/consilium-*.md "$HOME/.claude/agents/"`
- Expected: exits zero.
- Run: `for retired in consilium-soldier.md consilium-scout.md consilium-provocator-overconfidence.md consilium-provocator-assumption.md consilium-provocator-failure-mode.md consilium-provocator-edge-case.md consilium-provocator-negative-claim.md; do rm -f "$HOME/.claude/agents/$retired"; done`
- Expected: exits zero and removes only retired Claude agent files that `check-runtime-parity.py --installed` rejects.
- Run before installed parity: `test -L "$HOME/.claude/plugins/consilium" || { echo "$HOME/.claude/plugins/consilium is not a symlink; stop before replacing it."; exit 1; }`
- Expected: exits zero before any symlink change.
- Run before installed parity:
  ```bash
  python3 - <<'PY'
from pathlib import Path
link = Path.home() / ".claude" / "plugins" / "consilium"
expected = (Path.cwd() / "claude").resolve()
target = link.resolve(strict=False)
if target != expected:
    print(f"Claude plugin points to {target}; expected {expected}")
PY
  ```
- Expected: prints nothing when already pointed at this checkout using the same resolved-path semantics as `check-runtime-parity.py`; if it prints a mismatch, choose intentionally between the next symlink command and deferring installed parity.
- If proving this checkout as the active runtime, run: `ln -sfn "$PWD/claude" "$HOME/.claude/plugins/consilium"`
- Expected: exits zero and makes the plugin symlink resolve to this checkout.
- Run: `bash codex/scripts/install-codex.sh`
- Expected: exits zero and ends with the fresh-thread notice.
- Run: `python3 runtimes/scripts/check-runtime-parity.py --installed`
- Expected: `Consilium repo and installed runtime parity check passed.`
- Run: `python3 claude/scripts/check-codex-drift.py`
- Expected: prints the legacy drift message, then the installed runtime parity pass message.
- Run: `rg -n '\\[agents\\.consilium-tabularius\\]' "$HOME/.codex/config.toml"`
- Expected: one registration block exists.
- Run: `for retired in consilium-soldier.md consilium-scout.md consilium-provocator-overconfidence.md consilium-provocator-assumption.md consilium-provocator-failure-mode.md consilium-provocator-edge-case.md consilium-provocator-negative-claim.md; do test ! -e "$HOME/.claude/agents/$retired" || { echo "retired Claude agent still installed: $retired"; exit 1; }; done`
- Expected: exits zero.

**Stop conditions:** If the active Claude plugin symlink cannot be safely pointed at the checkout being proved, stop and report repo parity plus the install blocker. Do not call the runtime live until installed parity passes.

### Task 6: Run Scope And Contract Regression Checks

**Files:**
- Read: `source/`
- Read: `generated/`
- Read: `claude/skills/`
- Read: `codex/source/`
- Read: `codex/agents/`
- Read: `$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory/spec.md`
- Read: `$CONSILIUM_DOCS/cases/2026-05-01-consul-spec-contract-inventory/plan.md`

**Objective:** Prove the implementation stayed inside the approved Tabularius campaign and did not leak into Censor, Provocator, Brief, Estimate-lite, self-review, or generator-profile work.

**Decisions already made:**
- Use static checks to catch stale claims and forbidden expansion.
- Do not update historical specs with Inventory sections.
- Do not add a stripped `read` tools profile.
- Do not alter `source/roles/censor.md`, `source/roles/provocator.md`, or `source/skills/claude/references/verification/templates/spec-verification.md`.
- Do not claim fresh sessions have picked up the change; state that fresh sessions are required after install.

**Acceptance:**
- Compared with the Task 0 preflight baseline, new or modified paths are limited to this case docs, canonical source surfaces from Tasks 1-3, and generator-derived runtime outputs from Task 4.
- No new source diff after Task 0 exists in Censor, Provocator, spec-verification template, plan-format, or legatus-routing.
- New generated outputs exist because the generator produced them, not because they were edited directly.
- The Contract Inventory finding mapping is visible: missing Inventory, orphan Inventory entry, and defined contract missing from Inventory are GAPs.

**Verification:**
- Run: `CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; { git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard; } | sort -u > "$CASE_DIR/ref-preflight/current-dirty-paths.txt"; comm -13 "$CASE_DIR/ref-preflight/git-dirty-paths.txt" "$CASE_DIR/ref-preflight/current-dirty-paths.txt"`
- Expected: only paths newly dirtied after Task 0 appear: this case folder plus `source/roles/tabularius.md`, `source/manifest.json`, `source/skills/claude/consul/SKILL.md`, `source/protocols/consul-routing.md`, `source/skills/claude/references/verification/templates/contract-inventory-verification.md`, and generator-derived `generated/`, `claude/skills/`, `codex/source/`, `codex/agents/`, `codex/config/`.
- Run: `BASE_SHA="$(cat "${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory/ref-preflight/base-sha.txt")"; CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; { git diff --name-only "$BASE_SHA"..HEAD; git diff --name-only "$BASE_SHA"; git ls-files --others --exclude-standard; } | sort -u > "$CASE_DIR/ref-preflight/scope-candidate-paths.txt"; comm -13 "$CASE_DIR/ref-preflight/git-dirty-paths.txt" "$CASE_DIR/ref-preflight/scope-candidate-paths.txt"`
- Expected: after subtracting the normalized Task 0 dirty-path baseline, committed, staged, unstaged, and untracked changes are limited to this case folder plus `source/roles/tabularius.md`, `source/manifest.json`, `source/skills/claude/consul/SKILL.md`, `source/protocols/consul-routing.md`, `source/skills/claude/references/verification/templates/contract-inventory-verification.md`, and generator-derived `generated/`, `claude/skills/`, `codex/source/`, `codex/agents/`, `codex/config/`.
- Run: `CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; diff -u "$CASE_DIR/ref-preflight/manifest-existing-agents.json" <(jq -S '.agents | map(select(.name!="consilium-tabularius"))' source/manifest.json)`
- Expected: no output; every pre-existing manifest agent is unchanged.
- Run: `CASE_DIR="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}/cases/2026-05-01-consul-spec-contract-inventory"; BASE_SHA="$(cat "$CASE_DIR/ref-preflight/base-sha.txt")"; { git diff --name-only "$BASE_SHA" -- source/roles/censor.md source/roles/provocator.md source/skills/claude/references/verification/templates/spec-verification.md source/protocols/legatus-routing.md source/protocols/plan-format.md; git diff --name-only --cached -- source/roles/censor.md source/roles/provocator.md source/skills/claude/references/verification/templates/spec-verification.md source/protocols/legatus-routing.md source/protocols/plan-format.md; } | sort -u > "$CASE_DIR/ref-preflight/forbidden-source-paths.txt"; comm -13 "$CASE_DIR/ref-preflight/git-dirty-paths.txt" "$CASE_DIR/ref-preflight/forbidden-source-paths.txt"`
- Expected: no output after subtracting the Task 0 dirty-path baseline.
- Run: `git diff -U0 -- source generated claude/skills codex/source codex/agents codex/config | rg -n '10th Brief|mcp_servers": \\[\\]|stripped tool profile|self-review item 6'`
- Expected: no output; `rg` exit code 1 is the passing result.
- Run: `for file in source/roles/tabularius.md source/skills/claude/references/verification/templates/contract-inventory-verification.md; do for term in "missing Inventory" "orphan Inventory" "defined contract missing from Inventory" "GAP" "CONCERN" "MISUNDERSTANDING" "SOUND"; do rg -Fq "$term" "$file" || { echo "$file missing $term"; exit 1; }; done; done`
- Expected: exits zero, proving the category mapping terms are present in both durable role and operational template.
- Run: `git diff --check`
- Expected: no whitespace errors.

**Stop conditions:** If the diff includes unrelated dirty files, do not stage or commit them. If an unrelated file is already dirty before the task, leave it alone and call it out in the report.

---

## Handoff Notes

- The current spec is draft for re-verification but approved enough for these edicts by direct Imperator command. Execute the plan only if the Imperator confirms the march.
- The model-tiering campaign is separate. This plan must not tier the fleet; it only chooses Tabularius's Codex reasoning effort based on whether tiering already landed.
- `source/skills/claude/references/verification/protocol.md` still contains a generic `model: opus` parenthetical. The spec freezes that protocol for this campaign, so do not edit it here; note a follow-up cleanup if it causes operator confusion after Tabularius lands.
- Fresh Claude and Codex sessions are required after install before testing new routing behavior.
