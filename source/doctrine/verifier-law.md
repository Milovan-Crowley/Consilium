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
