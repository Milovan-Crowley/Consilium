# Tribune Verification Template

Dispatches independent verification on a diagnosis packet. Used by the `/tribune` skill after the Medicus writes the packet and self-reviews.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else.

---

## When to Dispatch

After the Medicus:
1. Writes the 14-field packet with inline confidence annotations
2. Completes self-review (layer 1) — placeholder scan, contrary-evidence check, known-gap discipline check
3. Announces: "Dispatching Tribunus (diagnosis stance) and Provocator for verification."

The Imperator can say "skip" to bypass (rare for diagnosis — skipping is unusual). Default: dispatch.

---

## Agents

**Tribunus (diagnosis stance) + Provocator**, dispatched in parallel (two Agent tool calls in one message, both with `run_in_background: true`).

---

## Dispatch: Tribunus

```
Agent tool:
  subagent_type: "consilium-tribunus"
  description: "Tribunus: verify diagnosis packet"
  mode: "auto"
  run_in_background: true
  prompt: |
    ## The Artifact

    The following diagnosis packet requires verification.

    {PASTE FULL PACKET CONTENT — all 14 fields}

    ## Stance

    You are dispatched in the **diagnosis stance**. Verify the packet, not code.

    ## Context Summary

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    1. Reproduction field (#2): present, or absence explicitly justified?
    2. Supporting evidence (#7): specific citations, not paraphrases?
    3. Contrary evidence (#8): not a placeholder? If "None observed," is it justified?
    4. Known gap considered (#9): live recheck performed? If used as evidence, recheck confirms?
    5. Root-cause hypothesis (#6): traceable from #7?
    6. Proposed fix site (#10): matches the failing boundary (#5)? A fix at the wrong layer is MISUNDERSTANDING.
    7. Fix threshold (#11): matches scope of #10? A 4-file fix proposed as `small` is MISUNDERSTANDING.
    8. Verification plan (#12): executable and will confirm the fix?
    9. Contract compatibility evidence (#14): matches the threshold? Medium-cross-repo requires `backward-compatible`; `breaking` on Medium is MISUNDERSTANDING.
    10. Medusa Rig DEGRADE handling (#13): if field 13 (Open uncertainty) contains a `Rig: DEGRADED (<skill-name> unavailable — MCP-only)` annotation, verify that `mcp__medusa__ask_medusa_question` citations are present in field 7 (Supporting evidence) for any Medusa-specific claim the packet makes. Classify a missing Rig skill as CONCERN, NOT MISUNDERSTANDING — the MCP is authoritative; the Rig skills are accelerators. If the packet touches Medusa work AND field 13 lacks the DEGRADE annotation AND field 7 has no MCP citations, that IS a GAP (unverified Medusa claims).

    Do NOT propose alternatives — that is the Medicus's or Provocator's role.

    ## Output Format

    Return findings per the Codex format. Tag each finding by category (MISUNDERSTANDING / GAP / CONCERN / SOUND). Include SOUND findings for fields that held.
```

---

## Dispatch: Provocator

```
Agent tool:
  subagent_type: "consilium-provocator"
  description: "Provocator: stress-test diagnosis"
  mode: "auto"
  run_in_background: true
  prompt: |
    ## The Artifact

    The following diagnosis packet requires adversarial review.

    {PASTE FULL PACKET CONTENT}

    ## Context Summary

    {PASTE STRUCTURED CONTEXT SUMMARY}

    ## Your Mission

    Attack the hypothesis. Do not propose alternatives — report what breaks.

    1. Hypothesis extraction: the Medicus named one root cause. What are the plausible alternatives? Does the packet's evidence rule them out?
    2. Contrary evidence attack: the Medicus claims contrary evidence was searched for. What contrary evidence would you expect to find that the packet does not address?
    3. Fix-site attack: could the failure originate in a layer the Medicus did not consider? Name it.
    4. Field 14 attack (cross-repo cases): is the backward-compat claim actually verified, or assumed? What consumer would error on the new shape?
    5. Verification plan attack: can the proposed verification fail-on-wrong-cause? A verification plan that passes for many possible fixes is not a real check.

    Be relentless but bounded. Attack every surface once.

    ## Output Format

    Return findings per the Codex format.
```

---

## After Both Return

1. Read both reports.
2. Handle findings per protocol section 6.
3. Present the summary to the Imperator with attribution and the case-file path. Imperator approves → Medicus updates `Status: approved`, hands to Legion.
