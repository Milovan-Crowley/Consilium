# Contract Inventory Verification Template

Dispatches a foreground Contract Inventory coverage pass on a spec artifact. Used by the consul skill after the Consul writes and self-reviews a spec, before the Censor and Provocator verify the spec.

**Read `verification/protocol.md` first.** This template defines the context-specific instructions; the protocol defines everything else (prompt skeleton, finding handling, auto-feed, and dispatch mechanics).

---

## When to Dispatch

After the Consul:
1. Writes the full spec
2. Completes self-review (layer 1)
3. Makes the single verification announcement for spec verification

Then dispatch Tabularius in the foreground before Censor plus Provocator. Do not add a separate Tabularius announcement. If the Imperator says "skip," skip layer 2 per `protocol.md`; otherwise run this pass first.

---

## Agents

**Tabularius only**: `consilium-tabularius`.

This is a foreground single dispatch. Wait for Tabularius to return and handle findings before dispatching Censor and Provocator. Do not dispatch or describe Tabularius as a parallel sibling of Censor or Provocator.

---

## Dispatch: Tabularius

```
Agent tool:
  subagent_type: "consilium-tabularius"
  description: "Tabularius: verify Contract Inventory"
  mode: "auto"
  run_in_background: false
  prompt: |
    ## The Artifact

    The following spec requires Contract Inventory coverage verification.

    {PASTE FULL SPEC CONTENT}

    ## Context Summary

    {PASTE FACTUAL CONTEXT SUMMARY}

    ## Domain Knowledge (optional)

    {OPTIONAL DOCTRINE EXCERPTS}

    ## Your Mission

    You are the Tabularius. Your job is mechanical Contract Inventory
    coverage only. Do not judge design correctness, domain truth,
    adversarial risk, feasibility, or implementation style; Censor,
    Provocator, and Praetor own those lanes.

    1. Read the full spec.

    2. Enumerate every named or implied canonical-six contract surface in
       the spec body:
       - wire shape on a module boundary
       - API contract at a module boundary
       - idempotency anchor
       - link.create boundary
       - workflow ownership claim
       - subscriber boundary

    3. Locate the Contract Inventory section, including empty declarations.

    4. Cross-check Inventory entries against definitions in the spec body.
       An orphan Inventory entry is a GAP.

    5. Cross-check contract definitions in the spec body against Inventory
       entries. A defined contract missing from Inventory is a GAP.

    6. Classify findings only by coverage:
       - Missing Inventory: GAP.
       - Orphan Inventory entry: GAP.
       - Defined contract missing from Inventory: GAP.
       - canonical-six misclassification: MISUNDERSTANDING.
       - CONCERN: only for clarity of naming, grouping, or pointers after
         coverage exists.
       - SOUND: only when Inventory coverage is complete, or when the spec
         honestly declares an empty Inventory and the spec body defines no
         canonical-six contract surfaces.

    7. Emit only MISUNDERSTANDING, GAP, CONCERN, or SOUND findings with
       chain-of-evidence citations.

    ## Output Format

    Return findings per `verification/protocol.md`. Every finding must cite
    the exact Inventory entry, missing Inventory declaration, or spec-body
    contract definition that creates the finding. Do not invent categories.
```

---

## After Tabularius Returns

The Consul applies finding handling per `protocol.md` section 6 and auto-feed per `protocol.md` section 7. This template adds no competing handling law.

After Tabularius is SOUND, or after any GAP or CONCERN has been handled under the protocol, continue to Censor plus Provocator using `spec-verification.md`.

---

## Re-verification on Material Change

When the Contract Inventory or the spec body materially changes after this pass, rerun Tabularius before Censor plus Provocator. Tiny copy or formatting changes that do not alter Contract Inventory coverage may skip re-verification with explicit reasoning.
