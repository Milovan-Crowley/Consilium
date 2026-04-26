# Graphify Foundation — Design Spec

Sub-project of the Learning Loop (see `2026-04-09-learning-loop-design.md`). Covers steps 1-2 only: install graphify, build the staging pipeline, register the MCP server, confirm agents can query.

## Scope

Install graphify. Create a staging script that aggregates the two Divinipress repos and the domain bible into a single directory. Run graphify to produce a unified knowledge graph. Register graphify's built-in MCP server in the three projects that need it. Verify agents can query the graph.

## What This Does NOT Cover

- Pontifex persona (no write endpoint, no finding-to-graph pipeline)
- Skill migration (agents keep loading bible files as-is)
- Active briefing (pre-loading relevant history at phase start)
- Pattern detection (cross-finding analysis)
- Auto-refresh (no git hooks, no --watch mode)
- `--deep` mode (first run uses default extraction)

Each of these is a separate spec after the foundation proves out.

---

## 1. Installation

System Python (brew-managed 3.14) is externally-managed — `pip install` will fail. Install into a dedicated venv:

```bash
python3 -m venv ~/.venvs/graphify
source ~/.venvs/graphify/bin/activate
pip install graphifyy[mcp,leiden]
graphify install
deactivate
```

`graphifyy` (double-y) is the PyPI package name. The `[mcp]` extra installs the MCP server dependencies. The `[leiden]` extra installs community detection (Leiden clustering via graspologic) — required for the `get_community` MCP tool and community visualization in `graph.html`. `graphify install` copies the skill file to `~/.claude/skills/graphify/SKILL.md` and registers the `/graphify` trigger in `~/.claude/CLAUDE.md`.

If Python 3.14 causes tree-sitter or other C extension failures, use `python3.12` instead (install via `brew install python@3.12` if needed).

This gives us two capabilities:
- `/graphify` skill for building/rebuilding the graph
- `~/.venvs/graphify/bin/python -m graphify.serve` for querying it via MCP

### Dependencies

- Python 3.10+ (3.12 recommended if 3.14 has compatibility issues with C extensions)
- Dedicated venv at `~/.venvs/graphify/`
- No separate API keys. Graphify runs as a Claude Code skill — semantic extraction uses the session's Claude. Code files are free (tree-sitter AST). Only docs cost tokens.

---

## 2. Staging Script

### Why

Graphify takes a single root directory as input and does not follow symlinks. The three input sources live in different locations:

- `~/projects/divinipress-store`
- `~/projects/divinipress-backend`
- `~/projects/Consilium/skills/references/domain/*.md`

The staging script aggregates them into one directory.

### Location

`~/projects/Consilium/scripts/refresh-graph.sh`

### Behavior

1. Rsync `divinipress-store/` into `~/projects/graphify-raw/divinipress-store/` with `--delete` (removes files deleted from source), excluding: node_modules, .next, dist, .git, __pycache__, .env, .venv, build, out, coverage, .turbo, .vercel, .claude, .vscode, .cursor, yarn.lock, package-lock.json, playwright-report, test-results
2. Rsync `divinipress-backend/` into `~/projects/graphify-raw/divinipress-backend/` with `--delete`, excluding the same plus: vendor, storage, bootstrap/cache, .medusa, .yarn, .playwright-mcp, integration-tests/fixtures
3. Copy `Consilium/skills/references/domain/*.md` into `~/projects/graphify-raw/domain-bible/`
4. Write `.graphifyignore` into `~/projects/graphify-raw/` targeting files that rsync legitimately copies but graphify should skip (e.g., `*.lock`, `*.json` fixtures, binary assets, generated files). This is a complementary filter, not a duplicate of rsync exclusions.
5. Print instructions to run the graphify build

The `--delete` flag on rsync prevents stale files from accumulating in the staging directory. Without it, files deleted from the source repos would persist in staging and produce stale graph nodes.

The script does NOT run graphify itself. Graphify builds graphs through Claude Code's `/graphify` skill (it dispatches subagents for semantic extraction). After running the staging script, you run `/graphify ~/projects/graphify-raw --update` in a Claude Code session. This is deliberate — graph builds cost tokens and shouldn't be automated silently.

### Output

Graphify writes to `~/projects/graphify-raw/graphify-out/`:

- `graph.json` — the knowledge graph (NetworkX node_link_data format)
- `graph.html` — interactive visualization
- `GRAPH_REPORT.md` — summary of high-degree nodes
- `cache/` — SHA256-based content cache for incremental builds

### Incremental Behavior

The `--update` flag enables two-layer caching:
1. mtime manifest — skips files that haven't been touched since last run
2. SHA256 content cache — skips files whose content hasn't changed even if mtime differs

Unchanged files cost zero tokens on re-runs. Only modified or new files trigger extraction.

### First Run

First run will not use `--update` (no prior cache exists). Expect:
- Code files: zero LLM cost (tree-sitter AST extraction)
- Domain bible .md files: ~1 subagent batch (9 files including MANIFEST.md and 2 code maps, well under the 20-25 file chunk size)
- The expanded rsync exclusions (especially `.claude/worktrees/`, `.medusa/`, `.yarn/`, lock files, and test fixtures) are critical — without them the backend alone contributes ~90k files and 2.8M words, far exceeding graphify's 200-file / 500k-word warning thresholds. With exclusions, the repos should be well within limits. Verify on first run.

---

## 3. MCP Server Registration

### Where

Project-level settings in all three Divinipress repos:

- `~/projects/Consilium/.claude/settings.local.json`
- `~/projects/divinipress-store/.claude/settings.local.json`
- `~/projects/divinipress-backend/.claude/settings.local.json`

Global settings (`~/.claude/settings.json`) stays untouched.

### Configuration

Add the `mcpServers` key to each file, **merging with existing content** (store and backend already have `permissions` blocks that must be preserved). Consilium needs `mkdir -p ~/projects/Consilium/.claude/` first — the directory does not exist yet.

The MCP server entry:

```json
{
  "mcpServers": {
    "graphify": {
      "command": "/Users/milovan/.venvs/graphify/bin/python",
      "args": ["-m", "graphify.serve", "/Users/milovan/projects/graphify-raw/graphify-out/graph.json"]
    }
  }
}
```

The `command` points to the venv's Python binary (not system `python`, which doesn't have graphify installed). Absolute path to graph.json. stdio transport — the server starts on demand per session, no persistent process.

### Available Tools

Graphify's MCP server exposes 7 read-only tools:

| Tool | Parameters | Purpose |
|-|-|-|
| `query_graph` | question (required), mode, depth, token_budget | Semantic queries against the graph |
| `get_node` | label (required) | Retrieve specific node info |
| `get_neighbors` | label (required), relation_filter | Find connected nodes |
| `get_community` | community_id (required) | All nodes in a Leiden community cluster |
| `god_nodes` | top_n | Highest-degree nodes in the graph |
| `graph_stats` | none | Graph overview (node/edge counts, communities) |
| `shortest_path` | source, target (required), max_hops | Trace relationship path between two concepts |

No write endpoint. Write capability (for Pontifex) is out of scope.

---

## 4. Verification Plan

After setup, confirm the foundation works:

1. `graph.json` exists and contains nodes from all three sources (store, backend, bible)
2. `graph.html` renders and shows a connected graph (not three isolated clusters)
3. MCP server starts: `python -m graphify.serve ~/projects/graphify-raw/graphify-out/graph.json`
4. From a Claude Code session in Consilium, use the `query_graph` tool with question "saved product" — confirm it returns relevant nodes from both code and domain bible
5. Check whether cross-repo edges exist (e.g., a store component linked to a backend endpoint). If the graph produces three isolated clusters instead, that's a graphify extraction limitation, not a setup failure — the foundation is still functional for intra-repo queries
6. Incremental works: re-run `refresh-graph.sh`, confirm only changed files are re-extracted

---

## Directory Layout

```
~/projects/
  Consilium/
    scripts/
      refresh-graph.sh              # staging + graphify runner
    .claude/
      settings.local.json           # MCP registration
  divinipress-store/
    .claude/
      settings.local.json           # MCP registration
  divinipress-backend/
    .claude/
      settings.local.json           # MCP registration
  graphify-raw/                     # staging directory (gitignored)
    divinipress-store/              # rsync'd source
    divinipress-backend/            # rsync'd source
    domain-bible/                   # copied .md files
    .graphifyignore
    graphify-out/                   # graphify output
      graph.json
      graph.html
      GRAPH_REPORT.md
      cache/
```

---

## Confidence Map

| Section | Confidence | Evidence |
|-|-|-|
| Installation | High | graphify docs confirm install; venv approach addresses externally-managed Python (Provocator catch) |
| Staging script approach | High | Imperator selected approach A; symlink limitation verified in graphify source (Censor SOUND) |
| Input sources | High | Imperator's original spec lists all three; confirmed in conversation |
| Rsync exclusions | High | Expanded after Provocator found .claude/worktrees/ (87k files), .medusa/, .yarn/. Now includes all known noise directories. Verify count on first run. |
| MCP registration format | High | graphify source confirms settings.json format (Censor SOUND); venv Python path corrected (Provocator catch); merge-not-overwrite clarified (both caught) |
| Project-level (not global) registration | High | Imperator explicitly chose project-level; format verified against existing settings files (Provocator SOUND) |
| Available MCP tools | High | All 7 tools verified against serve.py source code (Censor SOUND); [leiden] extra added for get_community (Censor catch) |
| First-run file count estimate | Medium | Exclusions address known large directories but exact post-exclusion count unverified. Will know on first run. |
| Incremental caching behavior | High | mtime manifest + SHA256 cache verified in source (Censor SOUND, Provocator SOUND); --delete in rsync prevents stale node accumulation (Provocator catch) |
