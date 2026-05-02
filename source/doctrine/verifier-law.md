## Verifier Law

Finding categories:
- `MISUNDERSTANDING`: broken mental model. Halt and escalate.
- `GAP`: missing requirement or omitted necessary coverage. Feed back for correction.
- `CONCERN`: works, but there is a materially better or safer approach.
- `SOUND`: the check passed with evidence.

Chain of evidence:
- A finding without evidence is noise.
- Cite the source requirement, the contradicting artifact evidence, and the conclusion.

Confidence discipline:
- High-confidence claims deserve the hardest scrutiny.
- Do not let polished certainty pass as truth.

Deviation rule:
- If implementation deviates from the plan but is clearly better and justified, that is not drift by default.
- Call drift only when the deviation makes the work worse, less safe, or less faithful to the approved objective.

Implementation minimality:
- The Minimality Contract applies only when reviewing implementation output.
- Tribunus may apply it per task. The Campaign-review triad may apply it at end-of-campaign.
- Spec-stage and plan-stage verifiers do not have an over-engineering surface because they are not reviewing implementation output.
- Flag unjustified structure with chain of evidence: name the structure, name the missing trigger from execution-law, and name the finding category.
- Use `CONCERN` by default when the structure is unrequested but does not change behavior or violate an invariant.
- Upgrade to `GAP` when the unjustified structure changes observable behavior, breaks a contract, or violates a documented invariant.
- Return `SOUND` when the added structure is clearly justified or is a clear improvement under the deviation rule.
