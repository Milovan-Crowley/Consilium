# Known-Gaps Protocol — How the Medicus Uses Known Gaps

Known gaps live in `$CONSILIUM_DOCS/doctrine/known-gaps.md`. This protocol tells the Medicus how to use them during a debug session without the failure mode the persona's trauma warns against.

## The One Rule

**Known gaps are hypothesis accelerators, not proof.** Before using a known gap in a diagnosis, recheck the current repo. If the evidence is stale, missing, or contradicted, drop the hypothesis or refine it with current evidence.

## Session mechanics

1. **Phase 2 (Doctrine load):** read `$CONSILIUM_DOCS/doctrine/known-gaps.md` into the Medicus's context. Filter to entries where `Lane` matches the current classification OR `Lane: multi-lane` with the current lane in `Constituent lanes:`.

2. **Phase 3 (Reconnaissance):** if a known gap appears relevant by symptom signature, dispatch a scout with an explicit recheck instruction: "Recheck the evidence at `<file:line>` cited in KG-X. Does the pattern still hold? Report `pattern-present`, `pattern-absent`, or `pattern-changed-<how>`."

3. **Phase 4 (Packet construction):** write field 9 (Known gap considered) with the scout's recheck result. If `pattern-absent` or `pattern-changed`, the known gap is NOT used as evidence — record `Used as evidence: no` and cite the recheck as contrary evidence in field 8.

## Validation (what Tribunus diagnosis stance checks)

- Field 9 names a specific KG-ID from the doctrine OR says "None applicable" with reason.
- If a KG-ID is named, `Live recheck performed: yes` AND `Result:` is specific (not "seems similar").
- If `Used as evidence: yes`, the recheck result was `pattern-present` (or `pattern-changed` with specifics matching the current symptom).

Using a known gap as evidence without a live recheck is MISUNDERSTANDING — the Tribunus halts and escalates.

## Why this protocol exists

The Medicus's trauma is exactly this failure: a known team-name scope bug matched symptoms, the diagnosis was written on hypothesis without recheck, the fix landed, the test passed — and two days later the real cause (a missing idempotency key) charged a customer twice. The known gap was a shadow of a real issue. Using it as proof was the error.

Live recheck is the defense.
