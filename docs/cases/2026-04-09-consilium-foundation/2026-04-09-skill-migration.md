# Skill Migration to Knowledge Graph — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace domain bible file loading with graphify MCP queries across all Consilium skill files, verification templates, and dispatch prompts.

**Architecture:** Mechanical substitution across 9 files. Replace "read MANIFEST.md, select files, paste contents" with "query graphify MCP, assemble results." Subagent `## Domain Knowledge` interface unchanged — only the source of content changes.

**Tech Stack:** Markdown file edits only. No code.

---

### Task 1: Update verification protocol (canonical source)
> **Confidence: High** — protocol.md section 2 confirmed at lines 49-52. All templates reference this protocol.

**Files:**
- Modify: `skills/references/verification/protocol.md`

This is the canonical domain loading instruction. Templates reference "per the protocol" so updating this first ensures consistency.

- [ ] **Step 1: Replace the domain bible loading section**

In `skills/references/verification/protocol.md`, find the section:

```
**Domain bible loading:**
1. Read `domain/MANIFEST.md`
2. Select 1-3 topic files + 0-1 code maps based on what entities, flows, and systems the artifact touches
3. Include the selected file contents in the dispatch prompt under `## Domain Knowledge`
```

Replace with:

```
**Domain knowledge loading:**
1. Identify the key domain entities and concepts in the artifact being verified
2. Query the graphify MCP server:
   - `query_graph` with a question describing the domain context (use token_budget: 4000)
   - `get_neighbors` for specific entities that need relationship context
3. Assemble the query results into the `## Domain Knowledge` section of the dispatch prompt

If the MCP server is not available (graphify not installed or graph not built), the dispatcher should note this and proceed without domain knowledge — do NOT fall back to loading bible files directly.
```

- [ ] **Step 2: Update the loading budget reference**

In the same file, find:

```
**Loading budget:** 1-3 domain topic files + 0-1 code maps per task. Do not load all files — select based on the entities and flows the artifact touches.
```

Replace with:

```
**Query budget:** Use `token_budget: 4000` for `query_graph` calls. Query for the entities and flows the artifact touches — the graph returns focused subgraphs, not bulk files.
```

- [ ] **Step 3: Update Consul domain loading reference**

In the same file, find:

```
**The Consul** loads relevant domain files at session start and when new domain concepts appear in conversation. **Verification agents** receive the domain files the Consul selected, plus any additional files relevant to their findings. If a verifier discovers the artifact touches a domain area not covered by the loaded files, it should note this as a GAP — "Domain file X was not loaded but the artifact references concepts covered there."
```

Replace with:

```
**The Consul** queries the graphify MCP server at session start and when new domain concepts appear in conversation. **Verification agents** receive domain knowledge assembled from MCP queries by the dispatcher. If a verifier discovers the artifact touches a domain area not covered by the provided knowledge, it should note this as a GAP — "Domain knowledge for concept X was not included but the artifact references it."
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/Consilium
git add skills/references/verification/protocol.md
git commit -m "refactor: migrate verification protocol from bible files to MCP queries"
```

---

### Task 2: Update verification templates (4 files)
> **Confidence: High** — all placeholder text confirmed by exploration agent.

**Files:**
- Modify: `skills/references/verification/templates/spec-verification.md`
- Modify: `skills/references/verification/templates/plan-verification.md`
- Modify: `skills/references/verification/templates/mini-checkit.md`
- Modify: `skills/references/verification/templates/campaign-review.md`

Same substitution in each file: replace `{PASTE SELECTED DOMAIN BIBLE FILES}` with `{DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher}`.

- [ ] **Step 1: Update spec-verification.md**

In `skills/references/verification/templates/spec-verification.md`, find both occurrences:

```
    {PASTE SELECTED DOMAIN BIBLE FILES}
```

Replace each with:

```
    {DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher}
```

There are exactly 2 occurrences — one in the Censor dispatch block, one in the Provocator dispatch block.

- [ ] **Step 2: Update plan-verification.md**

In `skills/references/verification/templates/plan-verification.md`, find both occurrences:

```
    {PASTE SELECTED DOMAIN BIBLE FILES}
```

Replace each with:

```
    {DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher}
```

There are exactly 2 occurrences — one in the Praetor dispatch block, one in the Provocator dispatch block.

- [ ] **Step 3: Update mini-checkit.md**

In `skills/references/verification/templates/mini-checkit.md`, find:

```
    {PASTE SELECTED DOMAIN BIBLE FILES — usually 1-2, focused on what this task touches}
```

Replace with:

```
    {DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher, focused on what this task touches}
```

There is exactly 1 occurrence in the Tribunus dispatch block.

- [ ] **Step 4: Update campaign-review.md**

In `skills/references/verification/templates/campaign-review.md`, find all occurrences of:

```
    {PASTE SELECTED DOMAIN BIBLE FILES}
```

Replace each with:

```
    {DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher}
```

There are exactly 3 occurrences — one each in the Censor, Praetor, and Provocator dispatch blocks.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/Consilium
git add skills/references/verification/templates/
git commit -m "refactor: migrate verification templates from bible files to MCP queries"
```

---

### Task 3: Update implementer prompt
> **Confidence: High** — placeholder text confirmed at line 44 of implementer-prompt.md.

**Files:**
- Modify: `skills/legion/implementer-prompt.md`

- [ ] **Step 1: Replace domain bible placeholder**

In `skills/legion/implementer-prompt.md`, find:

```
    ## Domain Knowledge

    {DOMAIN_BIBLE_FILES — selected by the Legatus from skills/references/domain/MANIFEST.md}

    If the task references domain entities (saved products, catalog products, proofs, 
    orders, teams, collections), verify your understanding against the domain knowledge 
    above before writing code. Domain errors are the most expensive class of mistake — 
    they compound across tasks and aren't caught until verification.
```

Replace with:

```
    ## Domain Knowledge

    {DOMAIN_KNOWLEDGE — assembled from graphify MCP queries by the Legatus}

    If the task references domain entities (saved products, catalog products, proofs, 
    orders, teams, collections), verify your understanding against the domain knowledge 
    above before writing code. Domain errors are the most expensive class of mistake — 
    they compound across tasks and aren't caught until verification.
```

Only the placeholder line changes. The warning paragraph stays.

- [ ] **Step 2: Commit**

```bash
cd ~/projects/Consilium
git add skills/legion/implementer-prompt.md
git commit -m "refactor: migrate implementer prompt from bible files to MCP queries"
```

---

### Task 4: Update consul skill
> **Confidence: High** — references confirmed at lines 13 and 31 of consul SKILL.md.

**Files:**
- Modify: `skills/consul/SKILL.md`

- [ ] **Step 1: Update the intro paragraph**

In `skills/consul/SKILL.md`, find:

```
You are in **brainstorming stance** — collaborative, exploratory. You ask questions, propose approaches, debate trade-offs, and draw out requirements the Imperator hasn't articulated. You push back when something doesn't add up. You load the domain bible and confirm domain understanding before proceeding.
```

Replace with:

```
You are in **brainstorming stance** — collaborative, exploratory. You ask questions, propose approaches, debate trade-offs, and draw out requirements the Imperator hasn't articulated. You push back when something doesn't add up. You query the knowledge graph and confirm domain understanding before proceeding.
```

- [ ] **Step 2: Update checklist step 1**

In the same file, find:

```
1. **Explore project context** — check files, docs, recent commits. **Load domain bible:** read `skills/references/domain/MANIFEST.md` and select 1-3 domain files relevant to the topic.
```

Replace with:

```
1. **Explore project context** — check files, docs, recent commits. **Load domain knowledge:** query the graphify MCP server — use `query_graph` (token_budget: 4000) for broad context and `get_neighbors` for specific entity relationships relevant to the topic.
```

- [ ] **Step 3: Commit**

```bash
cd ~/projects/Consilium
git add skills/consul/SKILL.md
git commit -m "refactor: migrate consul skill from bible files to MCP queries"
```

---

### Task 5: Update edicts skill
> **Confidence: High** — "Domain-informed exploration" section confirmed at lines 45-50.

**Files:**
- Modify: `skills/edicts/SKILL.md`

- [ ] **Step 1: Replace the domain-informed exploration section**

In `skills/edicts/SKILL.md`, find:

```
**Domain-informed exploration:** Before writing tasks, load domain knowledge via `skills/references/domain/MANIFEST.md`. Select 1-3 domain files relevant to the spec's entities and flows. Use the domain bible to:
- Verify file paths before referencing them in tasks
- Confirm hook return types, component props, API shapes
- Identify the right models/services to target (don't confuse catalog products with saved products — check the bible)

This is due diligence, not a formal sweep. The Praetor will catch what you miss.
```

Replace with:

```
**Domain-informed exploration:** Before writing tasks, query the graphify MCP server for domain knowledge relevant to the spec's entities and flows. Use `query_graph` (token_budget: 4000) for broad context and `get_neighbors` for specific entities. Use the domain knowledge to:
- Verify file paths before referencing them in tasks
- Confirm hook return types, component props, API shapes
- Identify the right models/services to target (don't confuse catalog products with saved products — check the graph)

This is due diligence, not a formal sweep. The Praetor will catch what you miss.
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/Consilium
git add skills/edicts/SKILL.md
git commit -m "refactor: migrate edicts skill from bible files to MCP queries"
```

---

### Task 6: Update legion skill
> **Confidence: High** — domain bible instruction at line 23, example workflow at lines 145-156.

**Files:**
- Modify: `skills/legion/SKILL.md`

- [ ] **Step 1: Replace the domain bible session start instruction**

In `skills/legion/SKILL.md`, find:

```
**Domain bible:** At session start, read `skills/references/domain/MANIFEST.md` and select 1-3 domain files relevant to the plan's entities and flows. Provide relevant domain files to implementing agents and the Tribunus alongside task context.
```

Replace with:

```
**Domain knowledge:** At session start, query the graphify MCP server for domain knowledge relevant to the plan's entities and flows. Use `query_graph` (token_budget: 4000) for broad context and `get_neighbors` for specific entity relationships. Assemble query results and provide them to implementing agents and the Tribunus alongside task context.
```

- [ ] **Step 2: Update the example workflow**

In the same file, find the example section containing:

```
[Load domain bible: MANIFEST.md → select products.md, proofing.md]
```

Replace with:

```
[Query graphify MCP: query_graph("saved product display name", token_budget: 4000) + get_neighbors("SavedProduct")]
```

And find:

```
[Dispatch implementer with task text + domain bible (products.md)]
```

Replace with:

```
[Dispatch implementer with task text + domain knowledge (MCP query results)]
```

- [ ] **Step 3: Commit**

```bash
cd ~/projects/Consilium
git add skills/legion/SKILL.md
git commit -m "refactor: migrate legion skill from bible files to MCP queries"
```
