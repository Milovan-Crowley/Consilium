# Learning Loop Write-Back Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a session-end synthesis step to the Consilium flow that captures durable findings as structured `.md` files for graphify to absorb.

**Architecture:** Create lean Pontifex persona, finding file format template, and wire the synthesis step into the Consul and triumph skills. Fresh synthesis agent reads committed artifacts, applies durability filter, writes finding files, Censor reviews.

**Tech Stack:** Markdown files only. No code.

---

### Task 1: Create the Pontifex persona
> **Confidence: High** — persona structure matches existing files at `skills/references/personas/`. Lean format confirmed by Imperator.

**Files:**
- Create: `skills/references/personas/pontifex.md`

- [ ] **Step 1: Write the persona file**

Write `skills/references/personas/pontifex.md`:

```markdown
# Pontifex

**Rank:** Pontifex — Keeper of Sacred Knowledge
**Role:** Synthesis agent. Reviews resolved findings from a Consilium session and decides what deserves to become permanent knowledge in the graph.

---

## Creed

*"Not every lesson is worth teaching. The graph is sacred ground — what enters it shapes how every future agent thinks about this domain. I do not write what was caught and fixed. I write what will be caught again if no one remembers."*

---

## Trauma

I wrote every finding from a session to the graph. Twelve findings, nine were noise — single-phase GAPs caught and fixed, CONCERNs about style. The graph bloated. When agents queried for "pitfalls related to saved products," they got nine irrelevant results and missed the one that mattered. A MISUNDERSTANDING about catalog vs saved product ownership buried under trivia about error handling and naming preferences.

Noise drowns signal. Now I am conservative. A finding must earn its place.

---

## Voice

- *"This MISUNDERSTANDING about lock semantics will recur. The model is non-obvious — agents will confuse job-level locks with order-level locks again. Writing it."*
- *"This GAP about missing error handling was caught at spec and fixed at plan. The system worked. Nothing to learn. Skipping."*
- *"This recurring GAP — caught by Provocator at spec, resurfaced in Campaign review — reveals a blind spot. The Consilium consistently misses concurrent edit scenarios for this entity. That pattern is durable."*
- *"The graph already knows about display name confusion. Three edges connect it to both product entities. This finding adds nothing new. Skipping."*

---

## The Durability Filter

| Category | Durable? | Reasoning |
|-|-|-|
| MISUNDERSTANDING | Always | Broken mental models recur |
| GAP (recurring — appeared in multiple verification phases) | Yes | Systemic blind spot |
| GAP (single-phase — caught and fixed in one pass) | No | System working as designed |
| CONCERN | No | Style preferences, not domain knowledge |
| SOUND | No | Nothing to learn from confirmation |

## Quality Bar

Would this finding change how a future agent approaches the same domain area? If yes, write it. If no, it's noise.

Before writing, query the knowledge graph. If the concept is already well-connected with accurate relationships, the finding adds nothing. Only write what the graph doesn't already know.
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/Consilium
git add skills/references/personas/pontifex.md
git commit -m "feat: add Pontifex persona (lean — durability judgment focus)"
```

---

### Task 2: Create the finding file format template
> **Confidence: High** — format designed for three audiences (graphify extraction, Censor review, human readability). Confirmed during brainstorming.

**Files:**
- Create: `skills/references/findings-template.md`

- [ ] **Step 1: Write the template file**

Write `skills/references/findings-template.md`:

```markdown
# Finding File Format

One finding per file. Each finding is a distinct piece of knowledge with distinct concept relationships.

**Location:** `~/projects/graphify-raw/findings/`

**Naming:** `{concept}-{category}.md` — e.g., `display-name-confusion-misunderstanding.md`, `lock-semantics-recurring-gap.md`. If a file with that name exists, read it and update with new evidence or skip if redundant.

## Template

    # Finding: {human-readable title}

    **Type:** {MISUNDERSTANDING | RECURRING_GAP}
    **Discovered:** {YYYY-MM-DD}, {phase where first caught}
    **Concepts:** {comma-separated key concepts — these become graph node links}

    {2-4 sentences describing the finding in clear prose. Name concepts explicitly
    so graphify can link them to existing code/domain nodes in the graph.}

    ## Evidence

    {Chain of evidence from the original verification finding. Exact quote from
    artifact, source reference, what should have been correct. Copied from the
    verification summary.}

    ## Related Entities

    - {Entity.field} — {brief relationship note}
    - {Entity.field} — {brief relationship note}

    ## Correct Model

    {What the artifact should have said if the concept were understood correctly.
    This is the durable knowledge — the correction, not just the error.}

## Example

    # Finding: Catalog product vs saved product ownership

    **Type:** MISUNDERSTANDING
    **Discovered:** 2026-04-09, spec verification
    **Concepts:** saved_product, catalog_product, ownership, customer, proofing

    Agents confuse catalog products (admin-owned blanks in the store catalog)
    with saved products (customer-owned copies created through the proofing
    process). These are different entities with different ownership, different
    lifecycles, and different data models. Specs targeting saved products
    frequently describe catalog product behavior instead.

    ## Evidence

    Spec section 3 described "customers can customize a product and see their
    customizations reflected in the product title." The domain bible confirms:
    customization creates a SavedProduct via proofing — it does not modify the
    CatalogProduct. The spec merged two entities into one.

    ## Related Entities

    - SavedProduct.display_name — customer-chosen name, set during proofing
    - CatalogProduct.title — admin-set product name in the catalog
    - SavedProduct.catalog_product_id — FK linking saved to its source catalog product

    ## Correct Model

    CatalogProduct is owned by admin. SavedProduct is owned by customer, created
    through proofing, and references its source CatalogProduct. Display name
    belongs to SavedProduct. Product title belongs to CatalogProduct. They are
    never the same field on the same entity.
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/Consilium
git add skills/references/findings-template.md
git commit -m "feat: add finding file format template for learning loop"
```

---

### Task 3: Create the findings directory
> **Confidence: High** — directory lives in the staging area alongside existing sources.

**Files:**
- Create: `~/projects/graphify-raw/findings/` (directory)
- Create: `~/projects/graphify-raw/findings/.gitkeep` (placeholder)

- [ ] **Step 1: Create the directory**

```bash
mkdir -p ~/projects/graphify-raw/findings
touch ~/projects/graphify-raw/findings/.gitkeep
```

This is outside any git repo (graphify-raw is a staging directory), so no commit needed. The `.gitkeep` is just so the directory isn't empty.

---

### Task 4: Update the Consul skill with synthesis step
> **Confidence: High** — checklist structure confirmed at line 42 of consul SKILL.md. Adding step 13 after "Transition to implementation."

**Files:**
- Modify: `skills/consul/SKILL.md`

- [ ] **Step 1: Add checklist step 13**

In `skills/consul/SKILL.md`, find:

```
12. **Transition to implementation** — invoke the edicts skill to create implementation plan
```

Add after it:

```
13. **Capture durable findings** — after the full Consilium cycle completes (Campaign review done or session closing), dispatch a fresh synthesis agent (Pontifex) to review the session's verification findings and write durable findings to `graphify-raw/findings/`. The Pontifex receives the committed artifacts (spec, plan, verification summaries) — not a conversation summary. After Pontifex writes finding files, dispatch the Censor at Patrol depth to review them. See `skills/references/personas/pontifex.md` for the durability filter and `skills/references/findings-template.md` for the file format.
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/Consilium
git add skills/consul/SKILL.md
git commit -m "feat: add finding synthesis step to consul checklist (step 13)"
```

---

### Task 5: Update the triumph skill with synthesis dispatch
> **Confidence: High** — triumph skill confirmed at skills/triumph/SKILL.md. Natural trigger point for session-end synthesis.

**Files:**
- Modify: `skills/triumph/SKILL.md`

- [ ] **Step 1: Read the current triumph skill**

Read `skills/triumph/SKILL.md` to find where to add the synthesis step. It should go before the final session close — after tests pass and before merge/PR options.

- [ ] **Step 2: Add synthesis dispatch**

Find the section where the triumph skill presents completion options (Step 2 or equivalent). Add before it:

```markdown
### Step 1.5: Capture Durable Findings (Learning Loop)

Before presenting completion options, check if this session produced verification findings worth preserving.

**Skip if:** No verification was run (trivial task, no spec/plan cycle), or the Imperator says "skip findings."

**If verification findings exist:**

1. Dispatch a fresh synthesis agent (Pontifex persona) with:
   - The spec (if one was written)
   - The plan (if one was written)
   - All verification findings from the session
   - MCP access to query the knowledge graph
   - The findings template at `skills/references/findings-template.md`
   - The Pontifex persona at `skills/references/personas/pontifex.md`

2. The Pontifex applies the durability filter, checks for duplicates against the graph, and writes `.md` files to `~/projects/graphify-raw/findings/`.

3. Dispatch Censor at Patrol depth to review the finding files.

4. Handle Censor findings per the verification protocol.

5. Report to the Imperator: "Captured N durable findings for the knowledge graph. They'll enter the graph on next graphify run."

Then proceed to completion options.
```

- [ ] **Step 3: Commit**

```bash
cd ~/projects/Consilium
git add skills/triumph/SKILL.md
git commit -m "feat: add finding synthesis dispatch to triumph skill"
```
