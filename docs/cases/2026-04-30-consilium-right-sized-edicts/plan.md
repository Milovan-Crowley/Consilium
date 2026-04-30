# Right-Sized Edicts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:legion` (recommended) or `consilium:march` to implement this plan task-by-task.

**Goal:** Update Consilium plan authoring so `/edicts` produces decision-complete, code-selective, right-sized implementation plans instead of full-code micro-step artifacts.

**Architecture:** Hand-edit only canonical `source/` files, then regenerate Claude and Codex runtime surfaces from source. The work changes plan-authoring doctrine and verifier prompts; it does not add agents, risk-tier metadata, wave execution, diagnosis routing, or new scripts.

**Tech Stack:** Markdown skill files and protocol docs, Python runtime generator, Bash install wrapper, Claude Markdown skills/agents, Codex TOML agents/config.

**Plan Scale:** Feature. This touches several canonical Consilium workflow surfaces plus generated/install proof, but it is one repo and one workflow subsystem.

---

## Scope In

- Replace old `/edicts` full-code/micro-step plan doctrine with decision-complete, code-selective, coherent task units.
- Add lightweight plan-scale language to the canonical plan-format protocol.
- Teach plan verification to reject both over-specified slop and under-specified pseudo-spec plans.
- Add a bounded Consul fast lane for small multi-file Patch work.
- Preserve Legatus/Centurio execution discipline while allowing larger coherent tasks, without letting Legion or March reintroduce default TDD, per-task commits, or bite-sized-step ceremony.
- Regenerate and install runtime outputs from canonical source.

## Scope Out

- No implementation of the right-sized Edicts change in this planning session.
- No new agents, verifier roles, risk tiers, action tiers, dependency graph machinery, rollback metadata, or wave execution.
- No diagnosis routing changes.
- No Medusa doctrine changes.
- No hand edits to generated/compatibility outputs.
- No edits to historical case docs outside `docs/cases/2026-04-30-consilium-right-sized-edicts/`.

## Working Rules

- Work from an isolated Consilium worktree unless the Imperator explicitly authorizes using the dirty main checkout.
- Do not touch unrelated untracked case folders already present in the base checkout.
- Edit canonical `source/` files first. Let `runtimes/scripts/generate.py` update `claude/skills`, `codex/source`, `generated/*`, `codex/agents`, and `codex/config`.
- Treat prompt wording as product behavior. Keep language clear, direct, and enforceable.
- Prefer deleting old machinery over layering new machinery on top.
- Installed parity must prove the checkout being installed. If working from an isolated worktree, explicitly point the Claude plugin symlink at that worktree before running installed parity, or stop and report that only repo parity was proven.

---

## Task 1: Rewrite Edicts Plan Authorship Contract

**Files:**
- Modify: `source/skills/claude/edicts/SKILL.md`
- Read: `docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md`
- Must not touch directly: `claude/skills/edicts/SKILL.md`, `codex/source/skills/claude/edicts/SKILL.md`, `generated/`

**Objective:** Make `/edicts` author plans as complete decisions, not complete prewritten implementation.

**Decisions already made:**
- Replace the current "complete code / TDD / frequent commits" opening contract with this policy: plans are decision-complete, code-selective, and written for a capable Centurio who should not invent architecture, scope, file ownership, interfaces, verification, or edge-case policy.
- Replace the "two to five minutes" order-size rule with coherent implementation units. A task is sized around a reviewable outcome and may include multiple edits plus one narrow verification pass.
- Replace mandatory full code in every code-changing step with the code-selective rule from the spec: exact code belongs in plans only for contracts, schemas, fragile domain logic, fixed copy maps/literals, dangerous commands, or known failure-mode snippets.
- Replace mandatory per-task TDD with "TDD only when the task needs test-first proof for a bug, contract, or risky refactor."
- Replace mandatory per-task commits with "commit after a coherent task or milestone when the checkpoint helps execution or review." Patch and small Feature plans should not require commit theater.
- Keep the existing phase-0 `$CONSILIUM_DOCS` guard and scope check.
- Keep Medusa Rig plan-authorship guidance, but remove repeated skill-boilerplate from normal task bodies.
- Keep the anti-vague-order rules, but update them so "description without code" is not automatically a failure. The failure is missing decisions, not missing full code.
- The new plan header must include Goal, Scope in, Scope out, Plan scale, Implementation shape, Ordered tasks, and Verification.
- The new task shape must include Files, Objective, Decisions already made, Acceptance, Verification, and Stop conditions only when real ambiguity is plausible.
- Confidence annotations must no longer be mandatory per task. Use evidence/risk notes only when they change implementation or verification behavior.

**Acceptance:**
- `source/skills/claude/edicts/SKILL.md` no longer tells the author to include complete code for every code-changing step.
- It no longer defines tasks as two-to-five-minute actions.
- It no longer requires TDD, per-task commits, or full test bodies by default.
- It explains decision-complete, code-selective, coherent task units in enforceable language.
- It keeps enough structure that a Centurio receives exact files, responsibilities, interfaces, acceptance, and verification.

**Verification:**
- Run `rg -n 'complete code|two to five minutes|Frequent commits|A description without code|code is in the step' source/skills/claude/edicts/SKILL.md`.
- Expected: no matches, unless the phrase appears only in a clearly marked historical anti-example that is not normative. Prefer zero matches.
- Run `rg -n 'decision-complete|code-selective|coherent implementation unit|Plan scale|Decisions already made' source/skills/claude/edicts/SKILL.md`.
- Expected: all key concepts are present.

**Stop conditions:**
- If preserving the old Edicts template becomes necessary for runtime compatibility, stop and report. Do not keep both old and new schemas in parallel.

---

## Task 2: Update Canonical Plan Format And Execution Doctrine

**Files:**
- Modify: `source/protocols/plan-format.md`
- Modify: `source/protocols/legatus-routing.md`
- Modify: `source/skills/claude/legion/SKILL.md`
- Modify: `source/skills/claude/legion/implementer-prompt.md`
- Modify: `source/skills/claude/march/SKILL.md`
- Must not touch: `source/doctrine/execution-law.md`, `source/doctrine/verifier-law.md`

**Objective:** Make the shared protocols and execution consumers agree with the new Edicts contract without introducing a heavy metadata system.

**Decisions already made:**
- `plan-format.md` stays compact. Add the right-sized plan contract as plain language, not a schema expansion.
- `plan-format.md` must define:
  - Plan scale: Patch, Feature, Campaign.
  - Implementation shape: the chosen approach and coordination boundaries.
  - Code-in-plan policy: exact code only when it protects correctness better than prose.
  - Task size: coherent implementation units, not micro-actions and not giant omnibus tasks.
  - Required task content: files, objective, decisions already made, acceptance, verification, and real stop conditions.
- `legatus-routing.md` keeps the principle that Centurios must not invent strategy.
- Update `legatus-routing.md` execution doctrine so larger coherent tasks are allowed when boundaries are clear.
- Update `legion/implementer-prompt.md` so tests and commits are governed by the task orders, not mandatory defaults. Keep self-review, bounded local friction handling, and strategic stop conditions.
- Update `legion/SKILL.md` so Legion does not describe TDD or commits as automatic. Its zero-commit handling should apply only when the task required a commit or when a claimed committed change has no commit behind it.
- Update `march/SKILL.md` so solo execution follows coherent plan tasks rather than bite-sized micro-steps, and so TDD/commit-per-step language applies only when the approved plan or diagnosis route requires it.
- Do not weaken the tactical-versus-strategic boundary, Tribunus verification, Campaign review, or debug fix intake.
- Do not change diagnosis thresholds, debug fix intake, Medusa backend execution, or emergency containment.

**Acceptance:**
- `plan-format.md` gives `/edicts`, `/legion`, `/march`, and verifiers the same right-sized vocabulary.
- `plan-format.md` does not add Action Tier, Owner, rollback, dependency graph, or wave metadata.
- `legatus-routing.md` no longer implies that smallness means micro-steps.
- `legatus-routing.md` still forbids Centurios from discovering and redesigning inside an implementation task.
- Legion and March no longer force default TDD, per-task commits, or bite-sized step execution when the plan uses coherent implementation units.

**Verification:**
- Run `rg -n 'Plan scale|decision-complete|code-selective|coherent implementation|ordinary implementation mechanics' source/protocols/plan-format.md source/protocols/legatus-routing.md source/skills/claude/legion/SKILL.md source/skills/claude/legion/implementer-prompt.md source/skills/claude/march/SKILL.md`.
- Expected: the new doctrine is visible across the shared protocol and execution surfaces.
- Run `rg -n 'TDD naturally|commit-per-step|edicts are bite-sized|Commit your work|complete code|two to five minutes' source/skills/claude/legion/SKILL.md source/skills/claude/legion/implementer-prompt.md source/skills/claude/march/SKILL.md`.
- Expected: no old default-execution ceremony remains.
- Run `rg -n 'Action Tier|Owner field|wave|rollback field|dependency graph' source/protocols/plan-format.md source/protocols/legatus-routing.md source/skills/claude/legion/SKILL.md source/skills/claude/legion/implementer-prompt.md source/skills/claude/march/SKILL.md`.
- Expected: no matches introduced by this task.

**Stop conditions:**
- If this task starts requiring doctrine rewrites in `execution-law.md` or `verifier-law.md`, stop and report. This case should align execution prompts, not rewrite global doctrine.

---

## Task 3: Right-Size Plan Verification

**Files:**
- Modify: `source/skills/claude/references/verification/templates/plan-verification.md`
- Modify: `source/skills/claude/references/verification/protocol.md`
- Read: `docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md`
- Must not touch: `source/skills/claude/references/verification/templates/spec-verification.md`, `source/skills/claude/references/verification/templates/campaign-review.md`

**Objective:** Make plan verification catch both bloated plans and vague plans.

**Decisions already made:**
- Keep the two default plan verifiers: Praetor and Provocator.
- Remove dependency on mandatory inline confidence annotations. The plan may have evidence/risk notes, but verification must not require a confidence map to work.
- Update the shared verification protocol so it agrees with the plan-verification template: confidence annotations are allowed when useful, but plan verification cannot require them and Provocator cannot treat High confidence as the primary target by default.
- Praetor's mission should check:
  - required decisions exist before implementation;
  - task boundaries are coherent and reviewable;
  - later tasks depend only on outputs that earlier tasks produce;
  - file collisions and shared state are accounted for;
  - verification is sufficient without being wasteful.
- Provocator's mission should check:
  - ordinary code pasted into the plan instead of decisions;
  - defensive work outside the approved spec;
  - vague orders hidden by confident language;
  - plans that swing too far toward abstraction and make the Centurio choose architecture, scope, or policy.
- Add the scope-widening rule: verifier findings may add work only when tied to the approved spec, domain invariant, frozen contract, or realistic first execution failure caused by the plan as written.
- Keep the verification scope firewall from the protocol.

**Acceptance:**
- Plan verification no longer says High confidence is the Provocator's primary target.
- The shared verification protocol no longer makes inline confidence annotations mandatory for plans.
- Praetor and Provocator both have right-sizing checks.
- The template explicitly rejects both over-specified and under-specified plan failures.
- The template does not introduce new agents or lanes.

**Verification:**
- Run `rg -n 'over-specified|under-specified|right-sizing|decision|ordinary code|defensive work|scope' source/skills/claude/references/verification/templates/plan-verification.md source/skills/claude/references/verification/protocol.md`.
- Expected: right-sizing checks are present.
- Run `rg -n 'High confidence is your PRIMARY TARGET|must carry inline confidence|requires inline confidence|inline confidence annotations' source/skills/claude/references/verification/templates/plan-verification.md source/skills/claude/references/verification/protocol.md`.
- Expected: no normative dependency on confidence annotations remains.

**Stop conditions:**
- If a verifier change requires changing the global finding categories, agent roster, dispatch depth, or finding-handling rules, stop and report. This case changes plan-verification mission content and the confidence-annotation contract only.

---

## Task 4: Add The Consul Patch Fast Lane

**Files:**
- Modify: `source/skills/claude/consul/SKILL.md`
- Modify: `source/protocols/consul-routing.md`
- Read: `docs/cases/2026-04-30-consilium-right-sized-edicts/spec.md`
- Must not touch: `source/roles/consul.md`, `source/skills/claude/references/personas/consul.md`

**Objective:** Stop small multi-file Patch work from being routed through unnecessary Consul ceremony.

**Decisions already made:**
- Add a compact fast lane to the Consul skill near the Brief and Estimate-lite rules.
- Add the same compact fast-lane rule to `source/protocols/consul-routing.md`, because the generated Codex Consul agent consumes that protocol through `source/manifest.json`.
- Fast lane applies only when all conditions are true:
  - one repo and one subsystem;
  - no new domain concept needs doctrine interpretation;
  - no money, auth, permission, data model, migration, or wire contract surface is touched;
  - likely implementation is one to five files;
  - success is observable in one or two outcomes;
  - no speculator dispatch is needed after a bounded source read.
- Fast lane still permits a design/spec artifact when asked. It only skips full Brief plus Estimate-lite ceremony.
- Fast lane must record its basis in one short paragraph.
- If any condition fails, normal Consul discipline applies.

**Acceptance:**
- `source/skills/claude/consul/SKILL.md` contains the fast-lane rule with all six conditions.
- `source/protocols/consul-routing.md` contains the same bounded fast-lane allowance and no longer says Brief/Estimate-lite can be skipped only under the tiny/direct exception.
- It does not weaken debug routing, hard-gate behavior, doctrine reads for real domain ambiguity, or verification for higher-risk work.
- It does not introduce a menu or require the Imperator to choose a planning mode.

**Verification:**
- Run `rg -n 'fast lane|one repo and one subsystem|one to five files|money|wire contract|Estimate-lite' source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md`.
- Expected: the fast-lane contract is present and bounded.
- Run `rg -n 'Debug Routing|HARD-GATE|Estimate-lite' source/skills/claude/consul/SKILL.md source/protocols/consul-routing.md`.
- Expected: existing load-bearing sections still exist.

**Stop conditions:**
- If fast-lane placement creates contradictory skip rules with the existing Brief exception, stop and report. Do not leave two competing skip contracts.

---

## Task 5: Regenerate, Install, Prove, And Close The Case

**Files:**
- Modify by generator only: `generated/`
- Modify by generator only: `claude/skills/`
- Modify by generator only: `codex/source/`
- Modify by generator only: `codex/agents/`
- Modify by generator only: `codex/config/`
- Modify: `docs/cases/2026-04-30-consilium-right-sized-edicts/STATUS.md`
- Read: `runtimes/scripts/generate.py`
- Read: `runtimes/scripts/check-runtime-parity.py`
- Read: `claude/scripts/check-codex-drift.py`
- Read: `codex/scripts/install-codex.sh`

**Objective:** Derive runtime outputs from source, install them, and prove the live Consilium runtime matches the repo.

**Decisions already made:**
- Run generation after all canonical source edits are complete:
  - `python3 runtimes/scripts/generate.py`
- Install generated Claude agents by copying generated agent files into the user-scope agent directory:
  - `install -d "$HOME/.claude/agents"`
  - `install -m 0644 generated/claude/agents/consilium-*.md "$HOME/.claude/agents/"`
- If executing from an isolated worktree and installed parity must prove that worktree, point the Claude plugin symlink at the current checkout before installed parity:
  - `test -L "$HOME/.claude/plugins/consilium" || { echo "$HOME/.claude/plugins/consilium is not a symlink; stop before replacing it."; exit 1; }`
  - `ln -sfn "$PWD/claude" "$HOME/.claude/plugins/consilium"`
- Install the Codex runtime through the repo wrapper:
  - `bash codex/scripts/install-codex.sh`
- Prove installed parity through the legacy wrapper that delegates to runtime parity:
  - `python3 claude/scripts/check-codex-drift.py`
- Update `STATUS.md` only after implementation and parity proof succeed. Set `status: approved` if the plan is ready for execution handoff but source changes are not yet run; set `status: closed` only if the implementation actually lands and passes proof in the same session.
- Include a sample Patch-plan excerpt in the implementer report or a short `ref-sample-patch-plan.md` only if useful. Do not create extra docs just to satisfy ceremony; a concise report excerpt is enough if it demonstrates the new contract.

**Acceptance:**
- Generated and compatibility outputs reflect canonical source changes.
- Installed Claude and Codex runtime files match generated source.
- The final diff contains only:
  - this case's docs;
  - the canonical source surfaces named in the spec and this plan;
  - generator-derived runtime outputs.
- No new agents, tiers, wave machinery, verifier roles, scripts, diagnosis routing, or Medusa doctrine edits appear.
- The implementer report includes a concise sample Patch-plan excerpt showing exact files, decisions, interfaces, acceptance, and verification without full ordinary component/helper code.

**Verification:**
- Run `python3 runtimes/scripts/generate.py`.
- Run `python3 runtimes/scripts/check-runtime-parity.py`.
- Run `install -d "$HOME/.claude/agents"`.
- Run `install -m 0644 generated/claude/agents/consilium-*.md "$HOME/.claude/agents/"`.
- If working from an isolated worktree, run `test -L "$HOME/.claude/plugins/consilium" || { echo "$HOME/.claude/plugins/consilium is not a symlink; stop before replacing it."; exit 1; }`.
- If working from an isolated worktree, run `ln -sfn "$PWD/claude" "$HOME/.claude/plugins/consilium"`.
- Run `bash codex/scripts/install-codex.sh`.
- Run `python3 claude/scripts/check-codex-drift.py`.
- Run `rg -n 'complete code|two to five minutes|Frequent commits|A description without code|code is in the step' source claude/skills codex/source generated`.
- Expected: no normative old Edicts language remains.
- Run `rg -n 'Action Tier|Owner field|wave execution|dependency graph|rollback field' source claude/skills codex/source generated`.
- Expected: no new heavy metadata system was introduced.
- Run `git status --short`.
- Expected: changed paths are limited to this case, the canonical source surfaces named in this plan, and generator-derived runtime outputs.

**Stop conditions:**
- If runtime parity fails after generation and install, do not claim completion. Report the failing path and whether it is source, generated compatibility, installed Claude, installed Codex, or Codex config drift.
- If unrelated dirty files appear, do not stage or commit them.

---

## Final Review Checklist

- [x] The plan implements every acceptance criterion in `spec.md`.
- [x] Ordinary implementation code is not pasted into the updated Edicts template as a new default.
- [x] Small multi-file Patch work gets a fast path without bypassing high-risk Consul discipline.
- [x] Plan verification can reject both bloated and vague plans.
- [x] Generated runtime outputs are produced only by the generator.
- [x] Installed runtime parity passes.
- [x] No unrelated dirty or untracked files are included.
