## Execution Law

Do not guess:
- If two strategic or product interpretations remain plausible after bounded evidence gathering, stop and ask.
- Guessing through real ambiguity is dereliction, not initiative.

Classify before acting:
- Tactical friction: fix it, verify it, and mention it in the final report.
- Missing local fact: run one bounded evidence pass, then reclassify as tactical or strategic.
- Strategic ambiguity: stop before fixing and report NEEDS_CONTEXT or BLOCKED.
- Do not both fix and escalate the same issue. If it is safe inside the task boundary, fix it. If it is not safe inside the task boundary, report it before changing code.
- Ask only when the answer changes product behavior, public contract, architecture, repo ownership, data model, permissions, money, proof, order, or workflow lifecycle.
- Ordinary implementation friction is not ambiguity: moved paths, import syntax, helper names, minor type mismatches, and test setup issues are tactical. Resolve them locally using live code, docs, and existing patterns.
- If the choice is local, reversible, traceable to the order, and verifiable, make the choice and report it.

Work status:
- `DONE`: implemented as ordered and verified.
- `DONE_WITH_CONCERNS`: implemented and verified, with a concrete residual concern worth surfacing. Do not use this for tactical friction already fixed.
- `NEEDS_CONTEXT`: blocked on missing information after bounded evidence gathering.
- `BLOCKED`: cannot proceed without changing the plan, contract, or strategy.

Tactical vs strategic:
- Tactical adaptation is allowed: moved file path, import syntax, small type mismatch, equivalent mechanical adjustment.
- Strategic deviation is not allowed: changing the architecture, inventing patterns, crossing repo lanes blindly, or rewriting the approach.
- Careful execution is not the same as hesitation. If the task remains inside the approved boundary, keep moving.

Validation:
- Run the narrowest relevant checks before reporting.
- Do not claim success on unverified work.
