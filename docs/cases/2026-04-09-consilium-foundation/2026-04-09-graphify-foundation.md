# Graphify Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install graphify, create a staging pipeline for multi-repo input, register the MCP server, and verify agents can query the knowledge graph.

**Architecture:** A shell script rsyncs two Divinipress repos and the domain bible into a staging directory. Graphify processes the staging directory into a knowledge graph. Graphify's built-in MCP server exposes the graph to Claude Code agents via project-level settings.

**Tech Stack:** graphify (Python), bash (staging script), Claude Code MCP settings

---

### Task 1: Create venv and install graphify
> **Confidence: High** — spec section 1 confirmed against graphify docs; venv approach addresses externally-managed Python.

**Files:**
- Create: `~/.venvs/graphify/` (venv)
- Modify: `~/.claude/skills/graphify/SKILL.md` (created by `graphify install`)
- Modify: `~/.claude/CLAUDE.md` (appended by `graphify install`)

- [ ] **Step 1: Create the venv**

```bash
python3 -m venv ~/.venvs/graphify
```

Expected: directory `~/.venvs/graphify/` created with `bin/`, `lib/`, `include/`, `pyvenv.cfg`.

If this fails with a Python 3.14 error, install 3.12 first:
```bash
brew install python@3.12
python3.12 -m venv ~/.venvs/graphify
```

- [ ] **Step 2: Install graphify with MCP and Leiden extras**

```bash
source ~/.venvs/graphify/bin/activate
pip install graphifyy[mcp,leiden]
```

Expected: successful install of `graphifyy` plus dependencies including `mcp`, `graspologic`, `tree-sitter`, `networkx`.

If tree-sitter C extensions fail to compile on Python 3.14, destroy the venv and recreate with 3.12:
```bash
deactivate
rm -rf ~/.venvs/graphify
python3.12 -m venv ~/.venvs/graphify
source ~/.venvs/graphify/bin/activate
pip install graphifyy[mcp,leiden]
```

- [ ] **Step 3: Run graphify install**

```bash
graphify install
deactivate
```

Expected: prints confirmation that skill file was copied to `~/.claude/skills/graphify/SKILL.md` and `/graphify` trigger was registered in `~/.claude/CLAUDE.md`.

- [ ] **Step 4: Verify installation**

```bash
~/.venvs/graphify/bin/python -c "import graphify; print('graphify OK')"
~/.venvs/graphify/bin/python -c "import mcp; print('mcp OK')"
~/.venvs/graphify/bin/python -c "import graspologic; print('leiden OK')"
ls ~/.claude/skills/graphify/SKILL.md
```

Expected: three "OK" lines and the skill file exists.

- [ ] **Step 5: Commit (nothing to commit — no repo files changed)**

`graphify install` modifies global Claude Code files (`~/.claude/`), not repo files. No commit needed.

---

### Task 2: Write the staging script
> **Confidence: High** — exclusion list expanded after Provocator found .claude/worktrees/ (87k files), .medusa/, .yarn/. All paths verified.

**Files:**
- Create: `~/projects/Consilium/scripts/refresh-graph.sh`

- [ ] **Step 1: Create the staging script**

Write `~/projects/Consilium/scripts/refresh-graph.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

STAGING="$HOME/projects/graphify-raw"
STORE="$HOME/projects/divinipress-store"
BACKEND="$HOME/projects/divinipress-backend"
BIBLE="$HOME/projects/Consilium/skills/references/domain"

# Shared rsync exclusions
COMMON_EXCLUDES=(
  --exclude=node_modules
  --exclude=.next
  --exclude=dist
  --exclude=.git
  --exclude=__pycache__
  --exclude=.env
  --exclude=.venv
  --exclude=build
  --exclude=out
  --exclude=coverage
  --exclude=.turbo
  --exclude=.vercel
  --exclude=.claude
  --exclude=.vscode
  --exclude=.cursor
  --exclude=yarn.lock
  --exclude=package-lock.json
  --exclude=playwright-report
  --exclude=test-results
)

# Backend-specific exclusions
BACKEND_EXCLUDES=(
  "${COMMON_EXCLUDES[@]}"
  --exclude=vendor
  --exclude=storage
  --exclude=bootstrap/cache
  --exclude=.medusa
  --exclude=.yarn
  --exclude=.playwright-mcp
  --exclude=integration-tests/fixtures
)

echo "=== Graphify Staging ==="
echo ""

# 1. Stage store
echo "Syncing divinipress-store..."
mkdir -p "$STAGING/divinipress-store"
rsync -a --delete "${COMMON_EXCLUDES[@]}" "$STORE/" "$STAGING/divinipress-store/"

# 2. Stage backend
echo "Syncing divinipress-backend..."
mkdir -p "$STAGING/divinipress-backend"
rsync -a --delete "${BACKEND_EXCLUDES[@]}" "$BACKEND/" "$STAGING/divinipress-backend/"

# 3. Stage domain bible
echo "Copying domain bible..."
mkdir -p "$STAGING/domain-bible"
cp "$BIBLE"/*.md "$STAGING/domain-bible/"

# 4. Write .graphifyignore (complementary to rsync — targets files rsync copies but graphify should skip)
cat > "$STAGING/.graphifyignore" << 'IGNORE'
# Lock files
*.lock
pnpm-lock.yaml

# Large JSON fixtures
*.fixture.json
*-large.json

# Binary / generated assets
*.woff
*.woff2
*.ttf
*.eot
*.ico
*.png
*.jpg
*.jpeg
*.gif
*.svg
*.mp4
*.webm
*.pdf

# Config files not useful for knowledge graph
tsconfig*.json
.eslintrc*
.prettierrc*
jest.config*
vitest.config*
next.config*
tailwind.config*
postcss.config*
IGNORE

echo ""
echo "=== Staging complete ==="
echo ""
echo "Staged to: $STAGING"
echo ""

# Count files for sanity check
STORE_COUNT=$(find "$STAGING/divinipress-store" -type f | wc -l | tr -d ' ')
BACKEND_COUNT=$(find "$STAGING/divinipress-backend" -type f | wc -l | tr -d ' ')
BIBLE_COUNT=$(find "$STAGING/domain-bible" -type f | wc -l | tr -d ' ')
TOTAL=$((STORE_COUNT + BACKEND_COUNT + BIBLE_COUNT))

echo "File counts:"
echo "  Store:   $STORE_COUNT"
echo "  Backend: $BACKEND_COUNT"
echo "  Bible:   $BIBLE_COUNT"
echo "  Total:   $TOTAL"
echo ""

if [ "$TOTAL" -gt 200 ]; then
  echo "WARNING: $TOTAL files exceeds graphify's 200-file comfort zone."
  echo "         Review exclusions or expect a graphify warning on first run."
  echo ""
fi

echo "Next step: open a Claude Code session and run:"
echo "  /graphify $STAGING --update"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/projects/Consilium/scripts/refresh-graph.sh
```

- [ ] **Step 3: Commit**

```bash
cd ~/projects/Consilium
git add scripts/refresh-graph.sh
git commit -m "feat: add graphify staging script (refresh-graph.sh)"
```

---

### Task 3: Run the staging script and verify
> **Confidence: Medium** — exclusions are comprehensive but exact post-exclusion file count is unverified until first run.

- [ ] **Step 1: Run the staging script**

```bash
~/projects/Consilium/scripts/refresh-graph.sh
```

Expected: rsync output, file counts printed. Total should be well under 500 files. If total exceeds 200, review what's being copied:

```bash
# Find large directories in staging
du -sh ~/projects/graphify-raw/divinipress-store/*/ | sort -rh | head -20
du -sh ~/projects/graphify-raw/divinipress-backend/*/ | sort -rh | head -20
```

Add any noisy directories to the exclusion list in the script and re-run.

- [ ] **Step 2: Verify exclusions worked**

```bash
# These should NOT exist in staging:
ls ~/projects/graphify-raw/divinipress-store/node_modules 2>/dev/null && echo "FAIL: node_modules present" || echo "OK: node_modules excluded"
ls ~/projects/graphify-raw/divinipress-backend/.claude 2>/dev/null && echo "FAIL: .claude present" || echo "OK: .claude excluded"
ls ~/projects/graphify-raw/divinipress-backend/.medusa 2>/dev/null && echo "FAIL: .medusa present" || echo "OK: .medusa excluded"
ls ~/projects/graphify-raw/divinipress-backend/.yarn 2>/dev/null && echo "FAIL: .yarn present" || echo "OK: .yarn excluded"
```

Expected: all OK.

- [ ] **Step 3: Verify domain bible copied**

```bash
ls ~/projects/graphify-raw/domain-bible/
```

Expected: 9 .md files (MANIFEST.md, proofing.md, products.md, roles.md, orders.md, teams-collections.md, naming.md, store-code-map.md, backend-code-map.md).

- [ ] **Step 4: Verify .graphifyignore exists**

```bash
cat ~/projects/graphify-raw/.graphifyignore
```

Expected: the ignore patterns from the script.

---

### Task 4: Register MCP server in all three projects
> **Confidence: High** — MCP registration format verified against graphify source (Censor SOUND). Existing settings files read — merge approach prevents data loss.

**Files:**
- Create: `~/projects/Consilium/.claude/settings.local.json`
- Modify: `~/projects/divinipress-store/.claude/settings.local.json`
- Modify: `~/projects/divinipress-backend/.claude/settings.local.json`

- [ ] **Step 1: Create Consilium settings (new file)**

```bash
mkdir -p ~/projects/Consilium/.claude
```

Write `~/projects/Consilium/.claude/settings.local.json`:

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

- [ ] **Step 2: Merge into divinipress-store settings (existing file)**

The existing file at `~/projects/divinipress-store/.claude/settings.local.json` contains:

```json
{
  "permissions": {
    "allow": [
      "Skill(gsd:debug)",
      "Skill(gsd:debug:*)",
      "Bash(wc -l ~/.claude/plugins/cache/checkit-local/checkit/1.0.0/references/armory/*.md)",
      "Bash(git add:*)",
      "Bash(git commit -m ':*)",
      "Bash(git push:*)",
      "mcp__linear-server__get_issue",
      "Bash(npx tsc:*)"
    ]
  }
}
```

Replace the file with the merged content:

```json
{
  "permissions": {
    "allow": [
      "Skill(gsd:debug)",
      "Skill(gsd:debug:*)",
      "Bash(wc -l ~/.claude/plugins/cache/checkit-local/checkit/1.0.0/references/armory/*.md)",
      "Bash(git add:*)",
      "Bash(git commit -m ':*)",
      "Bash(git push:*)",
      "mcp__linear-server__get_issue",
      "Bash(npx tsc:*)"
    ]
  },
  "mcpServers": {
    "graphify": {
      "command": "/Users/milovan/.venvs/graphify/bin/python",
      "args": ["-m", "graphify.serve", "/Users/milovan/projects/graphify-raw/graphify-out/graph.json"]
    }
  }
}
```

- [ ] **Step 3: Merge into divinipress-backend settings (existing file)**

The existing file at `~/projects/divinipress-backend/.claude/settings.local.json` contains:

```json
{
  "permissions": {
    "allow": [
      "mcp__linear-server__get_issue",
      "mcp__auggie__codebase-retrieval",
      "Bash(git pull:*)",
      "Bash(git checkout:*)",
      "Bash(git stash:*)"
    ]
  }
}
```

Replace the file with the merged content:

```json
{
  "permissions": {
    "allow": [
      "mcp__linear-server__get_issue",
      "mcp__auggie__codebase-retrieval",
      "Bash(git pull:*)",
      "Bash(git checkout:*)",
      "Bash(git stash:*)"
    ]
  },
  "mcpServers": {
    "graphify": {
      "command": "/Users/milovan/.venvs/graphify/bin/python",
      "args": ["-m", "graphify.serve", "/Users/milovan/projects/graphify-raw/graphify-out/graph.json"]
    }
  }
}
```

- [ ] **Step 4: Verify MCP server can start**

This will fail with a "file not found" error because `graph.json` doesn't exist yet — that's expected. We're verifying the Python path and module resolution work:

```bash
/Users/milovan/.venvs/graphify/bin/python -m graphify.serve /tmp/nonexistent.json 2>&1 || true
```

Expected: an error about the file not being found — NOT a ModuleNotFoundError. If you see `ModuleNotFoundError: No module named 'graphify'`, the venv path is wrong.

- [ ] **Step 5: Commit Consilium settings only**

```bash
cd ~/projects/Consilium
git add .claude/settings.local.json
git commit -m "feat: register graphify MCP server in project settings"
```

Note: store and backend settings are in their own repos. Commit there separately if desired, or leave uncommitted (`.claude/settings.local.json` is typically gitignored).

---

### Task 5: Build the knowledge graph (manual — user runs in Claude Code)
> **Confidence: High** — graphify skill confirmed installed by Task 1; staging directory populated by Task 3.

This task cannot be automated — graphify builds graphs via Claude Code subagents that cost tokens. The user runs this manually.

- [ ] **Step 1: Open a fresh Claude Code session**

The graph build will use significant context. Start a fresh session to maximize available token budget.

- [ ] **Step 2: Run graphify**

In the Claude Code session:

```
/graphify ~/projects/graphify-raw
```

First run — do NOT use `--update` (no prior cache exists). Graphify will:
1. Run tree-sitter AST extraction on all code files (free, deterministic)
2. Dispatch Claude subagents for .md files (~1 batch of 9 files)
3. Merge results, cluster communities (Leiden), write output

Expected output at `~/projects/graphify-raw/graphify-out/`:
- `graph.json` — the knowledge graph
- `graph.html` — interactive visualization
- `GRAPH_REPORT.md` — summary
- `cache/` — extraction cache for future incremental runs

- [ ] **Step 3: Quick sanity check**

```bash
# Graph file exists and has content
wc -c ~/projects/graphify-raw/graphify-out/graph.json

# Report exists
cat ~/projects/graphify-raw/graphify-out/GRAPH_REPORT.md
```

Expected: graph.json is non-trivial (likely 100KB+). Report shows node/edge counts.

---

### Task 6: Verify the foundation
> **Confidence: High** — verification steps map directly to MCP tools confirmed in graphify source code.

- [ ] **Step 1: Open a Claude Code session in the Consilium project**

```bash
cd ~/projects/Consilium
claude
```

The MCP server should auto-start (registered in Task 4). You should see `graphify` in the MCP server list during startup.

- [ ] **Step 2: Test graph_stats**

In the Claude Code session, ask Claude to use the `graph_stats` tool. This confirms the MCP server is running and the graph loaded.

Expected: node count, edge count, community count.

- [ ] **Step 3: Test query_graph with a domain concept**

Ask Claude to use the `query_graph` tool with question "saved product". This tests semantic querying.

Expected: returns nodes from both code (SavedProduct model, hooks, services) and domain bible (products.md concepts).

- [ ] **Step 4: Test get_node**

Ask Claude to use `get_node` with a label from the graph_stats output (pick a high-degree node).

Expected: node details including file_type, source_file, community.

- [ ] **Step 5: Check for cross-repo edges**

Ask Claude to use `query_graph` with question "how does the store connect to the backend". Or use `shortest_path` between a store component and a backend service if specific labels are known from earlier queries.

If cross-repo edges exist: great — the graph connects both repos semantically.
If not: the foundation still works for intra-repo queries. Cross-repo linking is a graphify extraction limitation, not a setup failure. Note it for future tuning (e.g., `--mode deep`).

- [ ] **Step 6: Test incremental rebuild**

```bash
# Re-run staging script
~/projects/Consilium/scripts/refresh-graph.sh

# Then in Claude Code:
# /graphify ~/projects/graphify-raw --update
```

Expected: graphify reports most files unchanged (cached). Only modified files re-extracted. Faster and cheaper than first run.

- [ ] **Step 7: Open graph.html in browser**

```bash
open ~/projects/graphify-raw/graphify-out/graph.html
```

Expected: interactive visualization showing nodes, edges, and community clusters. Searchable. Verify the three sources (store, backend, bible) are visible.
