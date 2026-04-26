# Skill Migration to Knowledge Graph — Design Spec

Sub-project of the Learning Loop (see `2026-04-09-learning-loop-design.md`). Migrates all Consilium agents from loading domain bible files directly to querying the graphify MCP server.

## Scope

Replace domain bible file loading with graphify MCP queries across all 10 files that currently reference the MANIFEST.md → select files → paste contents pattern. Subagent interface unchanged — agents still receive a `## Domain Knowledge` section in their dispatch prompts. The content comes from graph queries instead of file reads.

## What This Does NOT Cover

- Modifying or deleting domain bible files (they remain as graphify input)
- Deleting MANIFEST.md (still the source material for graphify ingestion)
- Changing persona files or the Codex (philosophy unchanged, only mechanics)
- Changing the subagent `## Domain Knowledge` interface (agents still receive text)
- Graphify tuning (deep mode, exclusion changes)
- Pontifex persona (graph write-back)
- Graceful fallback to bible files if MCP is down (not supported — MCP starts on demand)

---

## 1. The New Dispatcher Workflow

### Current Pattern (all 10 files)

1. Read `skills/references/domain/MANIFEST.md`
2. Select 1-3 topic files + 0-1 code maps based on artifact scope
3. Read selected files
4. Paste contents into `## Domain Knowledge` section of dispatch prompt

### New Pattern

1. Extract key domain entities from the artifact/task (same judgment dispatchers use today)
2. Query MCP: `query_graph(question, token_budget: 4000)` for broad relevance
3. Query MCP: `get_neighbors(entity)` for specific relationships of key entities
4. Assemble query results into `## Domain Knowledge` section of dispatch prompt

Subagent interface unchanged — they still receive a `## Domain Knowledge` section with text. The content is graph-derived instead of file-pasted.

### Why This Is Better

- **Precision:** A `query_graph("saved product lifecycle")` returns a focused subgraph instead of the entire products.md (500+ lines).
- **Cross-domain connections:** The graph surfaces relationships the bible doesn't explicitly document (e.g., display_name permissions linking to company-scoped architecture).
- **Token efficiency:** Graph queries return relevant context, not bulk files. The `token_budget: 4000` parameter keeps results focused while providing equivalent depth to a medium bible file.
- **Compounds over time:** As Pontifex (future spec) writes findings back, the graph gets richer. Bible files are static; the graph grows.

### Dispatcher Guidance (canonical text for all files)

The following replaces the current "Domain bible loading" instruction wherever it appears:

```
**Domain knowledge loading:**
1. Identify the key domain entities and concepts in the artifact/task
2. Query the graphify MCP server:
   - `query_graph` with a question describing the domain context (use token_budget: 4000)
   - `get_neighbors` for specific entities that need relationship context
3. Assemble the query results into the `## Domain Knowledge` section of the dispatch prompt

If the MCP server is not available (graphify not installed or graph not built),
the dispatcher should note this and proceed without domain knowledge — do NOT
fall back to loading bible files directly.
```

---

## 2. File-by-File Migration Map

10 files need editing. Same substitution pattern in each.

### Skills (3 files)

| File | Section | Change |
|-|-|-|
| `skills/consul/SKILL.md` | Checklist step 1 | "Load domain bible: read MANIFEST.md and select 1-3 domain files" → new dispatcher guidance |
| `skills/consul/SKILL.md` | Domain awareness doctrine | "confirm against the loaded domain bible" → "confirm against the knowledge graph via MCP queries" |
| `skills/edicts/SKILL.md` | "Domain-informed exploration" | Replace MANIFEST.md + file reading instruction with new dispatcher guidance |
| `skills/legion/SKILL.md` | "Domain bible" session start instruction | Replace file loading with new dispatcher guidance |
| `skills/legion/SKILL.md` | Example workflow | Update to show MCP queries instead of file selection |

### Verification Protocol (1 file)

| File | Section | Change |
|-|-|-|
| `skills/references/verification/protocol.md` | Section 2 "Domain bible loading" (lines 49-52) | Replace the 3-step MANIFEST pattern with new dispatcher guidance. All templates reference the protocol, so this change cascades. |

### Verification Templates (4 files)

| File | Change |
|-|-|
| `templates/spec-verification.md` | `{PASTE SELECTED DOMAIN BIBLE FILES}` → `{DOMAIN KNOWLEDGE — assembled from graphify MCP queries}` in Censor and Provocator blocks |
| `templates/plan-verification.md` | Same in Praetor and Provocator blocks |
| `templates/mini-checkit.md` | Same in Tribunus block |
| `templates/campaign-review.md` | Same in all three triad blocks |

### Implementer Prompt (1 file)

| File | Change |
|-|-|
| `skills/legion/implementer-prompt.md` | `{DOMAIN_BIBLE_FILES — selected by the Legatus from skills/references/domain/MANIFEST.md}` → `{DOMAIN_KNOWLEDGE — assembled from graphify MCP queries by the Legatus}` |

### No Changes Needed

- **Persona files** — describe *what* agents do (verify against domain knowledge), not *how* they source it
- **Consilium Codex** — references "domain bible" as a concept; the concept remains, only the source changes
- **MANIFEST.md** — stays as graphify input, just no longer referenced by dispatcher instructions
- **Domain bible .md files** — stay as graphify input

---

## 3. Risks

**MCP not running:** If the graphify MCP server isn't available (never installed, graph not built, venv missing), agents get no domain knowledge. This is acceptable — MCP is registered in project settings and starts on demand. The fix is "complete the graphify foundation setup," not "fall back to bible files."

**Query quality:** Agents now depend on the graph being good. The deep-pass run already improved cross-repo edges significantly. If agents get weak results, the fix is improving the graph (re-run with better exclusions, add more source material), not reverting to bible files.

**Dispatcher query skill:** Dispatchers need to formulate good queries. This is the same judgment they already exercise when selecting bible files — "this task touches saved products and proofing, so I need products.md and proofing.md" becomes "this task touches saved products and proofing, so I query for those concepts." Same skill, different tool.

---

## Confidence Map

| Section | Confidence | Evidence |
|-|-|-|
| New dispatcher workflow | High | Imperator confirmed approach C (MCP-first), dispatcher-side querying, 4000 token budget |
| Subagent interface unchanged | High | Imperator agreed — dispatchers query, subagents receive assembled text |
| MANIFEST.md removal from workflow | High | Imperator confirmed — graph IS the manifest |
| Token budget 4000 | High | Imperator chose "more is more" over default 2000 |
| File migration map (10 files) | High | Exploration agent verified all touchpoints with line ranges |
| Edit pattern is mechanical | High | Same substitution across all files — replace "read MANIFEST, select files, paste" with "query MCP, assemble results" |
| No persona/Codex changes | High | Personas describe philosophy, not mechanics. Verified during exploration. |
| No fallback to bible files | High | Imperator selected approach C — clean separation, no dual-path |
