# Learning Loop & Knowledge Graph — Design Spec

## Overview

A self-improving knowledge system for Consilium. Graphify extracts structural + domain knowledge from both repos and the domain bible into a unified graph. An MCP server exposes it to agents via relationship traversal queries. A new persona (Pontifex) writes resolved findings back to the graph at natural checkpoints. The system gets sharper with every Consilium run.

## Motivation

The domain bible is hand-curated and static. Agents load entire files into context regardless of relevance. Verification findings are resolved and forgotten. The learning loop fixes all three: graphify compresses knowledge into a queryable graph, agents load only what's relevant via targeted queries, and findings accumulate as durable knowledge.

Inspired by [graphify](https://github.com/safishamsi/graphify) — Karpathy's `/raw` folder idea turned into a queryable knowledge graph with 71.5x token compression.

---

## Architecture

Three components:

### 1. Graphify (external, as-is)

Run graphify against both repos + domain bible files. Produces `graph.json`.

**Inputs:**
- Divinipress store repo
- Divinipress backend repo
- `skills/references/domain/*.md` (bible files — ingested as knowledge, not just code)
- Repo paths configured per machine (currently `~/projects/divinipress-store` and `~/projects/divinipress-backend`)

**Output:** `graph.json` — unified knowledge graph with code entities, domain concepts, relationships, pitfalls, all interconnected.

**Refresh:** Re-run periodically or on demand. Graphify caches by content hash — unchanged files skip extraction.

Use graphify as a black box. Don't fork or modify. Let upstream improvements land naturally.

### 2. MCP Server (custom, separate repo)

Loads `graph.json`, exposes query endpoints. Agents call it instead of loading bible files into context.

**Interface:**

| Endpoint | Purpose |
|-|-|
| `query(concept)` | Return all nodes/edges related to a concept |
| `traverse(from, to)` | Return the path between two concepts — how they relate |
| `pitfalls(concept)` | Return known traps, misunderstandings, and historical findings for a concept |
| `write_finding(finding)` | Pontifex's write endpoint — adds nodes/edges from resolved findings |

Read endpoints (first three) available to all agents. Write endpoint for Pontifex only.

Intentionally small interface. Add query types as real needs emerge.

### 3. Pontifex Persona (in Consilium)

New persona. Keeper of sacred knowledge. Bridge between what happened in a run and what the system knows permanently.

**Fires at three checkpoints:**

1. **Spec approved** — reads resolved Censor + Provocator findings. Captures: domain misunderstandings, missing concepts, challenged assumptions.
2. **Plan approved** — reads resolved Praetor + Provocator findings. Captures: feasibility traps, dependency issues, wrong codebase assumptions.
3. **Implementation complete** — reads resolved Campaign + Tribunus findings. Captures: what drifted, what broke, what patterns worked.

**What Pontifex does at each checkpoint:**
- Receives resolved findings (categorized, acted on — not raw)
- Decides what's durable vs one-off noise
- Writes durable insights to the graph via `write_finding`

**What Pontifex does NOT do:**
- Edit bible files directly. Bible is seed data for graphify. Manual edits → re-run graphify → graph absorbs.

Consul dispatches Pontifex at each checkpoint, same pattern as dispatching Censor or Praetor.

---

## Graph Schema

Intentionally rough. Let the shape emerge from real findings rather than over-specifying upfront.

**Example of what Pontifex might write:**
- New node: `{concept: "display_name_confusion", type: "pitfall", discovered: "2026-04-09"}`
- Edge: `display_name_confusion → product_name` (relation: "commonly_confused_with")
- Edge: `display_name_confusion → product_title` (relation: "commonly_confused_with")
- Edge: `display_name_confusion → frontend-display-name-spec` (relation: "discovered_during")

Schema will solidify after the first few real runs produce findings.

---

## Open Problems (For After Initial Setup)

### Active Briefing

Current design: Pontifex writes, graph stores, agents query. But agents have to know what to ask for. A Consul brainstorming saved products won't query "what went wrong last time with saved products" unless prompted.

**What's needed:** A briefing step at the start of each Consilium phase. Before the Consul does anything, the system queries the graph for findings related to the task and pre-loads relevant history. "Last time you touched proofing, Censor caught 3 MISUNDERSTANDINGs about lock semantics. Here's what was wrong and the fix."

Turns the graph from a passive store into an active memory. Consul gets a briefing, not a library card.

### Pattern Detection

Pontifex writes individual findings. Nobody's looking across them. "Agents confuse saved products and catalog products in 4 out of 5 runs" is more valuable than any single finding. That signal tells you the bible entry isn't clear enough — or that the concept is inherently confusing and needs extra scaffolding.

**What's needed:** Periodic analysis of accumulated findings to surface recurring patterns, frequency clusters, and systemic gaps. Could be Pontifex's job (expanded role) or a separate analytical step.

Both of these are future layers. Get graphify running, get the MCP server serving queries, get Pontifex writing findings. Then see where it wants to go.

---

## Relationship to Domain Bible

The bible files don't get deprecated. They get ingested.

Graphify processes them alongside the code repos. Domain concepts, pitfalls, relationships from the bible become nodes/edges in the graph, connected to the code entities they describe.

Over time the graph accumulates more knowledge than the bible alone (from Pontifex findings). The bible remains the manually editable layer — if you want to correct something, edit the bible, re-run graphify, graph absorbs the update.

---

## Relationship to Existing Consilium Skills

All skills that currently load domain bible files would shift to querying the MCP server:

| Skill | Current | After |
|-|-|-|
| Brainstorming (Consul) | Loads MANIFEST.md + selected bible files | Queries MCP server for concepts related to the task |
| Spec verification (Censor) | Receives bible files in prompt | Queries for domain rules relevant to the spec |
| Plan verification (Praetor) | Receives bible files in prompt | Queries for codebase structure relevant to the plan |
| Execution (Legatus/Tribunus) | Receives bible files in prompt | Queries for pitfalls related to the code being touched |
| Adversarial review (Provocator) | Receives bible files in prompt | Queries for historical findings to stress-test against |

Transition can be gradual. Skills can query the MCP server when available and fall back to loading bible files when it's not running.

---

## Implementation Sequence

1. **Run graphify** against both repos + bible files. See what the graph looks like.
2. **Build MCP server** — load graph.json, expose the 4 endpoints.
3. **Define Pontifex persona** — add to `skills/references/personas/`.
4. **Wire Pontifex into Consilium flow** — Consul dispatches at three checkpoints.
5. **Shift skills to query MCP server** — gradually replace bible file loading.
6. **Observe** — let real runs produce findings, see what patterns emerge, iterate.

Steps 1-2 are the foundation. Steps 3-5 are integration. Step 6 is where the learning loop actually starts compounding.

---

## Dependencies

- Graphify installed and working against both repos
- MCP server built and registered in Claude Code settings
- All Wave 1-4 sub-projects complete (personas, verification engine, reshaped skills generating findings)
- Pontifex persona defined and added to Consilium Codex
