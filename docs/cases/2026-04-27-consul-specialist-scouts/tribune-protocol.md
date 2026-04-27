# Tribune Protocol — Consul Specialist Scouts

```yaml
schema_version: 1
plan_id: plan.md 97db3f0c2b9db80144844582914d3af9f8f67142
sampling_mode: every-3rd-task-by-plan-index
tasks:
  - task_id: task-1
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The created file is exactly /Users/milovan/projects/Consilium/claude/skills/consul/case-mining-prompt.md."
        - "The file contains the EXACT four section headings and only those headings: '## Mission', '## Input', '## Finding extraction (HETEROGENEOUS SHAPES)', '## Classification rules', '## Distillation rules', '## Output Schema', '## Operational', '## Failure / signal contract'."
        - "The file declares the output schema MUST contain exactly three '## ' compendium sections in order: '## Frontend Compendium', '## Backend Compendium', '## Integration Compendium'."
        - "The file states the empty-surface placeholder is the EXACT line '_No archive findings yet for this surface._'."
        - "The file commits the work via 'git add claude/skills/consul/case-mining-prompt.md' and 'git commit -m \"feat(consul-scouts/T1): author case-mining prompt template\"'."
      task-no-stubs:
        - "The file does not contain TODO, FIXME, XXX, or '...' placeholder content."
        - "The file is non-empty and the verification step `[ -s ... ] || exit 1` passes against the actual file."
        - "No section is left as a heading-only stub — every section has prose body."
      task-domain-correctness:
        - "Classification rule 'Finding cites file path under divinipress-backend/src/admin/ → frontend lane' is present verbatim, encoding the spec §4.1.1 sub-carve."
        - "The output schema constrains exactly three lane sections (frontend, backend, integration) — no fourth lane, no merge of lanes, matching spec §4.2 owned-surface taxonomy."
        - "The mining scout is identified as a generalist consilium-scout dispatch (zero-lane brainstorm per spec §4.3 step 7), not a specialist."
        - "The MINING_INCOMPLETE and MINING_NOTE failure-signal contracts are present and unambiguous."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-1"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: §4.1.1 admin sub-carve verbatim presence + §4.5 case-mining contract; this plan has no Divinipress doctrine surface — the spec.md is the doctrine. No prior tasks: this is plan-task-1 of the window so task-integration-prior is correctly omitted."

  - task_id: task-2
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The created file is exactly /Users/milovan/projects/Consilium/docs/cases/2026-04-27-consul-specialist-scouts/mined-compendia.md."
        - "The file contains exactly three '## ' headings: '## Frontend Compendium', '## Backend Compendium', '## Integration Compendium', in that order."
        - "Each compendium section opens with a 'last_refreshed: YYYY-MM-DD' line per the Step 9 schema validation."
        - "No '### ' sub-headings exist inside compendia (would break substitution into agent files at T3-T5)."
        - "Empty lanes use the EXACT placeholder line '_No archive findings yet for this surface._' rather than empty body."
      task-no-stubs:
        - "Bullets contain real file:line citations or are placeholders — no TODO, FIXME, or '<insert later>' text."
        - "The file is non-empty and the schema validation script Step 9 outputs 'OK: schema validation passed' against the actual file."
        - "No section is heading-only with no body content (every section has either bullets or the empty-surface placeholder)."
      task-domain-correctness:
        - "Classification correctly applies the spec §4.1.1 sub-carve: any cited finding under divinipress-backend/src/admin/ appears under '## Frontend Compendium', not '## Backend Compendium'."
        - "Findings citing meta-Consilium / infrastructure surfaces (skill files, agent files, ~/.claude/, /claude/skills/, hooks) are excluded from all three compendia per the T1 template's classification rule."
        - "Each lesson is one line and transferable (a generalized rule, not a verbatim case-specific quote) per the T1 template's distillation rule."
        - "Each non-empty lesson carries a *(case: <case-dir>, <verifier-role>: <finding-class>)* citation."
      task-integration-prior:
        - "The output schema written matches the EXACT three-section structure mandated by T1's case-mining-prompt.md (verifier reads claude/skills/consul/case-mining-prompt.md to compare)."
        - "The 'last_refreshed: YYYY-MM-DD' pattern in this file matches the date placeholder pattern declared in T1's Output Schema."
        - "If the integration compendium is empty, the placeholder line matches T1's mandated string exactly."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-2"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "claude/skills/consul/case-mining-prompt.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: classification correctness vs §4.1.1 admin sub-carve, schema-conformance to T1 template (the prior interface is the T1 template that mined-compendia.md must satisfy)."

  - task_id: task-3
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The created file is exactly /Users/milovan/.claude/agents/consilium-scout-frontend.md."
        - "The frontmatter declares 'name: consilium-scout-frontend' and includes Read, Grep, Glob, Skill, and the Serena MCP tools per the plan body."
        - "The frontmatter does NOT include Bash."
        - "The frontmatter does NOT include mcp__medusa or any Medusa MCP tool."
        - "The body contains the sections: '## Surface', '## You own', '## You refuse', '## Filesystem-access constraint (MVP)', '## Stance', '## The Invocation', '## Pitfalls Compendium', '## Operational Notes' (≥8 '## ' sections per Step 3 verification)."
        - "The audit-trail commit lands in the Consilium repo with subject containing 'consul-scouts/T3'."
      task-no-stubs:
        - "<FRONTEND_COMPENDIUM_BLOCK> placeholder is fully substituted with the Frontend Compendium block from mined-compendia.md — no literal '<FRONTEND_COMPENDIUM_BLOCK>' string survives in the file."
        - "The Pitfalls Compendium section either contains real bulleted lessons with citations OR the exact empty-surface placeholder; it is not a heading with empty body."
        - "The Invocation block is the full canonical Invocation from the Codex, not abbreviated or truncated."
        - "The verification block in Step 3 outputs 'OK: frontend agent file structure verified' against the actual file."
      task-domain-correctness:
        - "The 'Surface' section names BOTH /Users/milovan/projects/divinipress-store/ AND /Users/milovan/projects/divinipress-backend/src/admin/ as owned, with explicit §4.1.1 sub-carve reasoning."
        - "The 'You refuse' section names backend internals AND wire-shape claims AND business-logic interpretation as out of scope, and points to consilium-scout-backend / consilium-scout-integration / consilium-scout (generalist) as the correct siblings."
        - "The 'Filesystem-access constraint (MVP)' section explicitly declares the constraint is 'tool exclusion + prose discipline, not full structural enforcement' per spec §4.1.1."
        - "The 'Stance' section declares: 'You retrieve facts. You do not produce findings under Codex categories.' — the verifier-vs-retrieval distinction from spec §4.1."
        - "The refusal contract carries three elements only: subject named, sibling named, no claims about the refused subject."
      task-integration-prior:
        - "The Pitfalls Compendium content matches the '## Frontend Compendium' block in mined-compendia.md verbatim (the bullets, the last_refreshed line)."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-3"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "docs/cases/2026-04-27-consul-specialist-scouts/mined-compendia.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: §4.1.1 admin sub-carve presence, §4.2 You-own/You-refuse contract, §4.1 retrieval-not-verification stance, refusal-contract three-element shape; counterfactual sampling fires here (plan-index 3 is divisible by 3); audit-trail commit landed via --allow-empty (filesystem write happens at ~/.claude/agents/, outside the Consilium repo — the diff lane sees only the empty audit commit, so verification reads the agent file directly via Read at the recorded absolute path)."

  - task_id: task-4
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The created file is exactly /Users/milovan/.claude/agents/consilium-scout-backend.md."
        - "The frontmatter declares 'name: consilium-scout-backend' and includes Read, Grep, Glob, Bash, Skill, the Serena MCP tools, AND mcp__medusa__ask_medusa_question."
        - "The body contains ≥9 '## ' sections per Step 3 verification (the extra section vs T3 is '## Medusa MCP Usage (Medusa Rig body note)')."
        - "The audit-trail commit lands with subject containing 'consul-scouts/T4'."
      task-no-stubs:
        - "<BACKEND_COMPENDIUM_BLOCK> placeholder is fully substituted; no literal '<BACKEND_COMPENDIUM_BLOCK>' survives."
        - "The Invocation block is the full canonical Invocation, not abbreviated."
        - "The verification block in Step 3 outputs 'OK: backend agent file structure verified'."
        - "The Medusa MCP Usage section names the Rig fallback contract concretely (degraded prefix string + reasoning), not as a placeholder."
      task-domain-correctness:
        - "The 'Surface' section explicitly EXCLUDES src/admin/ and routes admin-UI questions to consilium-scout-frontend per spec §4.1.1 sub-carve."
        - "The 'You own' section enumerates Medusa-specific surfaces: src/api/, src/workflows/, src/modules/, src/links/, src/subscribers/."
        - "The 'You refuse' section explicitly names admin UI (src/admin/) as out-of-scope and routes to consilium-scout-frontend."
        - "The 'Stance' section carries the retrieval-not-verification declaration."
        - "The refusal contract carries three elements only: subject named, sibling named, no claims about the refused subject."
      task-integration-prior:
        - "The Pitfalls Compendium content matches the '## Backend Compendium' block in mined-compendia.md verbatim."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-4"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "docs/cases/2026-04-27-consul-specialist-scouts/mined-compendia.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: §4.1.1 admin EXCLUSION (this is the inverse of T3's admin INCLUSION — both must agree on the boundary), Medusa MCP tool inclusion as architectural contract; audit-trail commit pattern same as T3 (out-of-repo file, --allow-empty audit commit, verifier reads agent file directly)."

  - task_id: task-5
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The created file is exactly /Users/milovan/.claude/agents/consilium-scout-integration.md."
        - "The frontmatter declares 'name: consilium-scout-integration' and includes Read, Grep, Glob, Bash, Skill, Serena MCP tools, AND mcp__medusa__ask_medusa_question."
        - "The body contains ≥9 '## ' sections per Step 3 verification."
        - "The audit-trail commit lands with subject containing 'consul-scouts/T5'."
        - "If the integration compendium is empty, the soldier task completion message includes the exact handoff string per Step 4."
      task-no-stubs:
        - "<INTEGRATION_COMPENDIUM_BLOCK> placeholder is fully substituted (with bullets OR the exact empty-surface placeholder); no literal '<INTEGRATION_COMPENDIUM_BLOCK>' survives."
        - "The Invocation block is the full canonical Invocation."
        - "The verification block in Step 3 outputs 'OK: integration agent file structure verified'."
      task-domain-correctness:
        - "The 'Surface' section names the wire — SDK boundary, custom route shapes, shared cross-repo types — and explicitly excludes either side's internals."
        - "The 'You refuse' section explicitly states 'Walk to the boundary. Report the boundary. Do not enter either side's internals.'"
        - "The boundary discipline is named as PROSE-bound, not structurally enforced (consistent with §4.1.1 framing for the other two specialists)."
        - "The refusal contract carries three elements only: subject named as 'internal to <frontend|backend>', sibling named, no claims about internal logic."
      task-integration-prior:
        - "The Pitfalls Compendium content matches the '## Integration Compendium' block in mined-compendia.md (LAST '## ' section), excluding any trailing MINING_NOTE line per Step 1's extraction guidance."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-5"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "docs/cases/2026-04-27-consul-specialist-scouts/mined-compendia.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: walk-to-boundary refusal contract distinct from T3/T4 surface refusals (integration's refusal is 'internal to <side>', not 'wrong surface'); MINING_NOTE trailing-line exclusion when integration compendium is empty."

  - task_id: task-6
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/consul/SKILL.md."
        - "The diff REMOVES the two old paragraphs naming the bare consilium-scout: 'Codebase exploration. I dispatch scouts.' AND 'The scout carries the Invocation in its system prompt.'"
        - "The diff ADDS a new 'Codebase exploration — lane-driven specialist dispatch.' paragraph with seven numbered steps matching spec §4.3."
        - "The diff ADDS the pattern line 'think → state lane → confirm → dispatch.'"
        - "The diff ADDS the 'Each scout carries the Invocation in its system prompt.' replacement paragraph (plural form)."
        - "The verification step grep checks all pass per Step 3."
        - "The commit lands with subject containing 'consul-scouts/T6'."
      task-no-stubs:
        - "The added paragraphs contain no TODO, FIXME, or '<insert later>' text."
        - "All three specialist agent names (consilium-scout-frontend, consilium-scout-backend, consilium-scout-integration) appear in the new content (≥3 'consilium-scout-' occurrences)."
        - "The seven numbered steps each have prose body, not heading-only stubs."
      task-domain-correctness:
        - "The dispatch model encodes spec §4.3 step ordering: magistrate reading → confirmation → lane-matched dispatch → exchange → generalist fallback → self-correction → zero-lane case."
        - "Step 3 names the §4.1.1 admin sub-carve: 'divinipress-backend/src/admin/ (Medusa admin UI — owned by frontend per the §4.1.1 sub-carve)'."
        - "Step 6 names the Codex Auto-Feed Loop alignment ('Maximum 2 redispatch attempts')."
        - "Step 7 names zero-lane brainstorm dispatching the generalist consilium-scout, not a specialist."
        - "Surrounding Phase 1 paragraphs (Domain knowledge, Scope assessment, Medusa Rig during reconnaissance) are PRESERVED — Step 3 verification asserts each."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-6"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture (Consul SKILL is the architectural contract being modified); additional-scrutiny: §4.3 dispatch model verbatim encoding + surrounding paragraph preservation (T6 is the structural rewrite — T7 + T8 layer on top)."

  - task_id: task-7
    lanes_triggered: [task-plan-match, task-no-stubs, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/consul/SKILL.md."
        - "The diff REPLACES the 'Codebase ambiguity — I dispatch a scout to verify.' bullet with the lane-driven variant naming Phase 1 reference."
        - "The replacement bullet contains the EXACT phrase 'using the lane-driven dispatch model from Phase 1'."
        - "Surrounding 'Idea ambiguity' and 'Domain ambiguity' bullets are PRESERVED unchanged."
        - "The commit lands with subject containing 'consul-scouts/T7'."
      task-no-stubs:
        - "The replacement is a complete, well-formed bullet — no truncation, no TODO, no placeholder."
      task-integration-prior:
        - "Phase 1's lane-driven dispatch model added in T6 is referenced by Phase 3 — the cross-reference is valid (Phase 1 contains a 'lane-driven specialist dispatch' anchor as a result of T6)."
        - "The Ambiguity elimination paragraph T7 modifies still exists in the file (T6's edit shifted lines but did not delete this paragraph) per Step 1 precondition check."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-7"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "claude/skills/consul/SKILL.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture (light surface here — small reference back to Phase 1); additional-scrutiny: serialization with T6 (same file; T6 must land first); task-domain-correctness omitted because the surface is a one-line reference to lane-driven dispatch already verified at T6."

  - task_id: task-8
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness, task-integration-prior]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/consul/SKILL.md."
        - "The diff INSERTS '### Phase 1.5: Compendium Refresh Ritual' immediately before '### Phase 2: Deliberation'."
        - "The new section contains the Refresh trigger, Refresh procedure (5 steps), and Staleness signal sub-blocks."
        - "Step 3 verification asserts '### Phase 2: Deliberation' count is exactly 1 post-edit (no duplication)."
        - "The commit lands with subject containing 'consul-scouts/T8'."
      task-no-stubs:
        - "Each of the 5 refresh procedure steps has prose body — no TODO, no '...', no heading-only stubs."
        - "The Refresh trigger names the EXACT phrase 'refresh the pitfalls compendium' per Step 3 verification."
        - "The Staleness signal example is concrete (specific date format and case-name pattern), not abstract."
      task-domain-correctness:
        - "The refresh trigger is declared Consul-scoped — Medicus and Legatus do not initiate refreshes — matching spec §4.4."
        - "Step 2 of the refresh procedure dispatches the GENERALIST consilium-scout (zero-lane brainstorm), not a specialist — matching spec §4.5."
        - "Step 3 specifies overwrite (not append) semantics for mined-compendia.md regeneration."
        - "Step 4 specifies in-place agent file edits (replacing the prior block including the last_refreshed line)."
        - "The Staleness signal section explicitly states there is no automated reminder — matching spec §8 default 'manual Imperator request only'."
      task-integration-prior:
        - "The new section uses '### ' (sub-heading under Consul SKILL phases), consistent with the existing Phase 2/3/etc. structure preserved by T6 + T7."
        - "References to the case-mining-prompt template path (claude/skills/consul/case-mining-prompt.md) match the file created at T1."
        - "References to specialist agent file paths match the files created at T3-T5."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-8"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
      task-integration-prior:
        - {type: "diff", path: "<runtime>"}
        - {type: "prior-task-interface", path: "claude/skills/consul/SKILL.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
      task-integration-prior: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
      task-integration-prior: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: §4.4 refresh contract verbatim, §4.5 generalist (not specialist) for mining dispatch; insertion-point uniqueness (T6 + T7 must not have created a second '### Phase 2: Deliberation')."

  - task_id: task-9
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/tribune/SKILL.md."
        - "The diff REMOVES the singular 'Dispatch consilium-scout subagents.' guidance AND the orphan 'The scout carries the Invocation' paragraph (extended-window scope)."
        - "The diff ADDS the 'Map the case's debug lane' guidance with four lane → specialist mappings."
        - "The diff ADDS the 'Each specialist (and the retained generalist) carries the Invocation' replacement paragraph (plural form)."
        - "Step 3 verification asserts the singular 'The scout carries the Invocation' string no longer exists in the file."
        - "The commit lands with subject containing 'consul-scouts/T9'."
      task-no-stubs:
        - "The four lane mappings each name a real specialist agent — no TODO, no '<TBD>'."
        - "The plural 'Each specialist (and the retained generalist) carries the Invocation' paragraph has full body, not a stub."
      task-domain-correctness:
        - "The lane mappings match $CONSILIUM_DOCS/doctrine/lane-classification.md — storefront/storefront-super-admin/admin-dashboard → frontend; medusa-backend → backend; cross-repo → integration; unknown → generalist consilium-scout."
        - "The §4.1.1 sub-carve is named ('admin-dashboard files at divinipress-backend/src/admin/ are owned by the frontend specialist per spec §4.1.1 sub-carve')."
        - "The frontend specialist's Medusa MCP exclusion is explicitly called out ('do not dispatch it for Medusa-doctrine queries') — matching the T3 tool subset."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-9"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/doctrine/lane-classification.md"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: lane-classification.md mapping correctness (this is the only task in the plan that cites a real Divinipress doctrine file as the mapping source — verify the four debug lanes named align verbatim); counterfactual sampling fires here (plan-index 9 is divisible by 3); singular/plural prose coherence (orphan paragraph removal is the iteration-2 hardening)."

  - task_id: task-10
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/edicts/SKILL.md."
        - "The diff REPLACES the 'If I must dispatch a scout' paragraph with the lane-driven variant containing four specialist bullets."
        - "Step 3 verification asserts 'lane-driven dispatch model' is present and ≥3 'consilium-scout-' occurrences exist."
        - "The commit lands with subject containing 'consul-scouts/T10'."
      task-no-stubs:
        - "The four bullets each name a specialist with a concrete surface description — no TODO, no '<TBD>'."
        - "The 'Each scout carries the Invocation' replacement paragraph has full body."
      task-domain-correctness:
        - "The four bullets correctly map: divinipress-store/ + divinipress-backend/src/admin/ → consilium-scout-frontend; divinipress-backend/ excluding src/admin/ → consilium-scout-backend; wire (SDK/routes/types) → consilium-scout-integration; meta/zero-lane/triage → generalist consilium-scout."
        - "The §4.1.1 admin sub-carve is named in the frontend bullet."
        - "The generalist scout is described as 'meta-Consilium / infrastructure / zero-lane queries, or as triage fallback when lane reading fails' — matching spec §4.5 generalist role."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-10"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: surface-mapping equivalence with T6 (Consul Phase 1 must say the same thing as Edicts plan-recon — divergence is drift)."

  - task_id: task-11
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/skills/references/verification/protocol.md."
        - "The diff REPLACES the single '| Reconnaissance scout | consilium-scout |' row with FOUR rows (generalist + 3 specialists)."
        - "Step 3 verification asserts the row count is exactly 4 and all three specialist names are present."
        - "The commit lands with subject containing 'consul-scouts/T11'."
      task-no-stubs:
        - "Each of the four rows names a real agent with a concrete surface description — no '<TBD>' cells."
        - "Markdown table syntax is well-formed (no broken pipes, no truncated rows)."
      task-domain-correctness:
        - "The four rows correctly map: generalist (meta-Consilium / triage / non-Divinipress recon) → consilium-scout; frontend (divinipress-store/ + divinipress-backend/src/admin/) → consilium-scout-frontend; backend (divinipress-backend/ excluding src/admin/) → consilium-scout-backend; integration (cross-repo wire) → consilium-scout-integration."
        - "The §4.1.1 admin sub-carve is encoded in the frontend row's surface description."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-11"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: surface-mapping equivalence with T6 + T10 (the protocol table is the canonical dispatch reference — must say the same thing); markdown table syntax integrity (per CLAUDE.md table style: no box-drawing characters, minimum-separator format)."

  - task_id: task-12
    lanes_triggered: [task-plan-match, task-no-stubs, task-domain-correctness]
    claims_per_lane:
      task-plan-match:
        - "The modified file is /Users/milovan/projects/Consilium/claude/docs/testing-agents.md."
        - "The diff REPLACES the bare 'consilium-scout' reference (in the divinipress-store recon example whose subject path is src/app/_hooks/useSavedProduct.ts) with 'consilium-scout-frontend'."
        - "Step 3 verification asserts 'consilium-scout-frontend' is present in the file."
        - "The commit lands with subject containing 'consul-scouts/T12' AND ends with the T13 handoff signal: 'T13 (manual refusal verification) is Imperator/Legatus-only'."
      task-no-stubs:
        - "The replacement is a complete, well-formed reference — not a partial token."
      task-domain-correctness:
        - "The replacement is consilium-scout-FRONTEND (not backend or integration) because the subject path src/app/_hooks/useSavedProduct.ts is a divinipress-store/ path."
        - "Other consilium-scout references in the file (general-context, non-Divinipress) are preserved unchanged per the plan body's 'Other references should remain unchanged unless they are also Divinipress-recon' guidance."
        - "The T12 commit message handoff signal is present verbatim — this is load-bearing for T13's manual gate."
    evidence_sources_per_lane:
      task-plan-match:
        - {type: "plan-task-body", path: "plan.md#task-12"}
        - {type: "diff", path: "<runtime>"}
      task-no-stubs:
        - {type: "diff", path: "<runtime>"}
      task-domain-correctness:
        - {type: "diff", path: "<runtime>"}
        - {type: "doctrine", path: "$CONSILIUM_DOCS/cases/2026-04-27-consul-specialist-scouts/spec.md"}
    model_profile_per_lane:
      task-plan-match: principalis_light
      task-no-stubs: principalis_light
      task-domain-correctness: principalis_adversarial
    thinking_allowed_per_lane:
      task-plan-match: false
      task-no-stubs: false
      task-domain-correctness: false
    executor_notes: "domain-surface: meta-consilium-architecture; additional-scrutiny: lane assignment correctness for the example (storefront path → frontend specialist), preservation of non-Divinipress consilium-scout references, T12 commit-message handoff signal verbatim presence (load-bearing for T13 gate); counterfactual sampling fires here (plan-index 12 is divisible by 3)."

  - task_id: task-13
    lanes_triggered: []
    claims_per_lane: {}
    evidence_sources_per_lane: {}
    model_profile_per_lane: {}
    thinking_allowed_per_lane: {}
    executor_notes: "MANUAL TASK — Imperator/Legatus only; soldier toolkit lacks Agent dispatch. No code diff to verify (the only diff is a one-line spec status update conditional on PASS, which the Imperator/Legatus authors after running the three live refusal tests). Tribune-executor receives DONE_WITH_CONCERNS or a manual-completion signal from the Legatus and writes a tribune-log entry noting 'task-13: lanes_triggered empty by design (manual gate); patrol-mode fallback engaged; no Kimi dispatch; no code-side diff verifiable'. Cross-window: if the manual gate completes inside the 15-task window the executor logs the spec-status edit (single-line) under task-no-stubs-style Claude-side patrol; if the manual gate completes after window close, the next executor instance reads the prior tribune-log entry at spawn."
```
