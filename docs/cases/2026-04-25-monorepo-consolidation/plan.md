# Consilium Monorepo Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `consilium:march`. The Imperator chose autonomous execution — the Legatus runs all 12 tasks end-to-end without per-task review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate three local repos (`Consilium`, `Consilium-codex`, `consilium-docs`) into a single private monorepo at `github.com/Milovan-Crowley/Consilium` with subdirs `claude/`, `codex/`, `docs/`, without breaking the live system at any step.

## March-mode discipline

The Legatus is the running Claude Code session. Three implications shape execution:

1. **No "fresh Claude Code session" tests.** The Legatus cannot open one. Where the plan needs session-time validation post-migration, the Legatus dispatches a fresh `consilium-soldier` or `consilium-tribunus` subagent (a separate Claude Code instance with its own context, same filesystem) and acts on the subagent's report.
2. **No per-task Imperator review.** The Legatus executes all tasks sequentially without pausing. The plan's built-in `Expected:` assertions and verification greps are the per-task gates. Final completion summary is the only Imperator-facing report at the end.
3. **Escalation, not checkpointing.** The Legatus pauses ONLY for these conditions:
   - A command fails and recovery requires a judgment call beyond the plan
   - A verification gate surfaces drift the plan didn't anticipate
   - A step is genuinely ambiguous (the Legatus asks rather than guesses)
   - Anything that's not a direct execution of a prescribed step

   On escalation: report the issue, the context, the recommended path forward, then wait for the Imperator's decision. Do not proceed without it.

   Stage 8 cleanup is deferred 24–48h and is the Imperator's call after the confidence period — not part of this march.

**Architecture:** Build the new monorepo at `Consilium-new/` alongside the three originals using `rsync -a` (preserves dotfiles, modes, attributes). Rewrite hardcoded paths in active runtime surfaces (Claude skills, Codex source/protocols, Codex doctrine, Codex maintenance scripts, six user-scope agents, two Claude maintenance scripts). Move the Codex jurisprudence (`consilium-codex.md`) to `docs/codex.md` so both runtimes reference one canonical source. `git init` the new repo and force-push to the existing GitHub remote, replacing the prior 163-commit history with a single fresh commit. Verify every runtime surface in isolation while old layouts remain on disk; swap with `mv` only after all gates pass; cleanup deferred 24–48 hours.

**Tech Stack:** bash, rsync, git, python (script refactors), Edit tool for file rewrites, ripgrep for verification.

---

### Task 1: Plugin cache symlink mechanism test (Spec Stage 1)

> **Confidence: High** — verified the cache directory is currently a regular directory with file copies, not a symlink. Stage 1 validates the symlink-following mechanism only; Stage 6 separately validates symlink-to-subdirectory deployment.

**Files:**
- Modify: `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` (replace with symlink)

- [ ] **Step 1: Verify the cache directory is currently a regular directory**

```bash
stat -f "%HT" /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
```

Expected output: `Directory` (confirms it's not already a symlink).

- [ ] **Step 2: Replace the cache directory with a symlink to the live repo**

```bash
rm -rf /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
ln -s /Users/milovan/projects/Consilium /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
```

- [ ] **Step 3: Verify the symlink resolves**

```bash
ls -la /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/
readlink /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
```

Expected: directory listing shows skills/, agents/, commands/, hooks/, .claude-plugin/, scripts/ at top level. `readlink` outputs `/Users/milovan/projects/Consilium`.

- [ ] **Step 4: Validate symlink contents resolve through the symlink**

The Legatus is itself a running Claude Code session and cannot open a fresh one to test session-time symlink-following. Instead, validate the symlink mechanism via filesystem checks the loader would also rely on: that resolving paths through the symlink lands at the correct content.

```bash
# Resolve a known file through the symlink and compare to the source
through_symlink=$(shasum -a 256 /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/consul/SKILL.md | cut -d' ' -f1)
direct=$(shasum -a 256 /Users/milovan/projects/Consilium/skills/consul/SKILL.md | cut -d' ' -f1)
echo "via symlink: $through_symlink"
echo "direct:      $direct"
[ "$through_symlink" = "$direct" ] && echo "SYMLINK RESOLVES OK" || echo "SYMLINK RESOLUTION FAILED"
```

Expected: `SYMLINK RESOLVES OK`. This validates that any process reading through the symlinked cache path lands at the live source content.

Session-time validation (whether Claude Code follows the symlink at startup) is verified retroactively the next time the Imperator opens Claude Code — if the loader rejects symlinks, skills fail to load and the Imperator runs the revert below. The migration's other stages do not depend on the symlink working; they create their own new monorepo and retarget the symlink at Stage 6.

**Revert if needed (Imperator runs this manually if his next Claude Code session fails to load skills):**

```bash
rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
mkdir -p /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
cp -R /Users/milovan/projects/Consilium/* /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/
```

No commit (operations are outside any git repo).

---

### Task 2: Build new monorepo via rsync (Spec Stage 2)

> **Confidence: High** — `rsync -a` preserves dotfiles, mode bits, executable flags, timestamps. Excludes `.serena/` (per-repo IDE caches will rebuild) and `.git/` (new repo gets fresh git in Stage 8). All other dotfiles (`.gitignore`, `.gitattributes`, `.claude-plugin/`, `.version-bump.json`) ARE copied.

**Files:**
- Create: `/Users/milovan/projects/Consilium-new/{claude,codex,docs}/`

- [ ] **Step 1: Create the new monorepo skeleton**

```bash
mkdir -p /Users/milovan/projects/Consilium-new/{claude,codex,docs}
```

- [ ] **Step 2: Copy Claude source into `claude/` subdir**

```bash
rsync -a --exclude='.serena/' --exclude='.git/' /Users/milovan/projects/Consilium/ /Users/milovan/projects/Consilium-new/claude/
```

Trailing slash on source is significant — copies contents, not the directory itself.

- [ ] **Step 3: Copy Codex source into `codex/` subdir**

```bash
rsync -a --exclude='.serena/' --exclude='.git/' --exclude='__pycache__/' /Users/milovan/projects/Consilium-codex/ /Users/milovan/projects/Consilium-new/codex/
```

- [ ] **Step 4: Copy docs source into `docs/` subdir**

```bash
rsync -a --exclude='.serena/' --exclude='.git/' /Users/milovan/projects/consilium-docs/ /Users/milovan/projects/Consilium-new/docs/
```

- [ ] **Step 5: Verify file counts match expectation**

```bash
echo "Claude source: $(find /Users/milovan/projects/Consilium -type f -not -path '*/.serena/*' -not -path '*/.git/*' | wc -l | tr -d ' ')"
echo "claude/ dest:  $(find /Users/milovan/projects/Consilium-new/claude -type f | wc -l | tr -d ' ')"
echo "Codex source:  $(find /Users/milovan/projects/Consilium-codex -type f -not -path '*/.serena/*' -not -path '*/.git/*' -not -path '*/__pycache__/*' | wc -l | tr -d ' ')"
echo "codex/ dest:   $(find /Users/milovan/projects/Consilium-new/codex -type f | wc -l | tr -d ' ')"
echo "Docs source:   $(find /Users/milovan/projects/consilium-docs -type f -not -path '*/.serena/*' -not -path '*/.git/*' | wc -l | tr -d ' ')"
echo "docs/ dest:    $(find /Users/milovan/projects/Consilium-new/docs -type f | wc -l | tr -d ' ')"
```

Expected: each source/dest pair has identical counts. Halt and investigate if any pair differs by more than zero.

- [ ] **Step 6: Verify dotfiles preserved**

```bash
ls -la /Users/milovan/projects/Consilium-new/claude/.gitignore /Users/milovan/projects/Consilium-new/claude/.claude-plugin/plugin.json /Users/milovan/projects/Consilium-new/claude/.version-bump.json
ls -la /Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md
```

Expected: all four files exist and are non-empty.

No commit (Consilium-new is not yet a git repo).

---

### Task 3: Move Codex jurisprudence to `docs/codex.md` and update drift check canonical (Spec Stage 3)

> **Confidence: High** — verified `check-codex-drift.py` reads `CANONICAL` once and iterates over `AGENTS`; only the CANONICAL constant changes.

**Files:**
- Move: `/Users/milovan/projects/Consilium-new/claude/skills/references/personas/consilium-codex.md` → `/Users/milovan/projects/Consilium-new/docs/codex.md`
- Modify: `/Users/milovan/projects/Consilium-new/claude/scripts/check-codex-drift.py` (line 26 + docstring lines 6–7)

- [ ] **Step 1: Move the jurisprudence file**

```bash
mv /Users/milovan/projects/Consilium-new/claude/skills/references/personas/consilium-codex.md /Users/milovan/projects/Consilium-new/docs/codex.md
```

- [ ] **Step 2: Verify the move**

```bash
ls -la /Users/milovan/projects/Consilium-new/docs/codex.md
ls -la /Users/milovan/projects/Consilium-new/claude/skills/references/personas/consilium-codex.md 2>&1 | head -1
```

Expected: first command shows the file at new location; second prints "No such file or directory".

- [ ] **Step 3: Update CANONICAL in `check-codex-drift.py`**

Apply this exact Edit operation to `/Users/milovan/projects/Consilium-new/claude/scripts/check-codex-drift.py`:

Find:
```python
CANONICAL = Path.home() / "projects" / "Consilium" / "skills" / "references" / "personas" / "consilium-codex.md"
```

Replace with:
```python
CANONICAL = Path.home() / "projects" / "Consilium" / "docs" / "codex.md"
```

- [ ] **Step 4: Update docstring lines 6–7 to match new canonical location**

Find:
```
carry a full copy of the Consilium Codex in their system prompt. The canonical source
lives at skills/references/personas/consilium-codex.md. This script detects drift.
```

Replace with:
```
carry a full copy of the Consilium Codex in their system prompt. The canonical source
lives at docs/codex.md. This script detects drift.
```

- [ ] **Step 5: Smoke-test the script reads the new canonical (do not run sync)**

```bash
python3 -c "
import sys
sys.path.insert(0, '/Users/milovan/projects/Consilium-new/claude/scripts')
from pathlib import Path
canonical = Path.home() / 'projects' / 'Consilium-new' / 'docs' / 'codex.md'
assert canonical.exists(), f'canonical missing: {canonical}'
content = canonical.read_text()
assert '# The Codex of the Consilium' in content, 'Codex header not found'
print('OK')
"
```

Expected: `OK`. (We use `Consilium-new` here for verification — the script's own CANONICAL points at `Consilium/docs/codex.md` which won't exist until Stage 7 swap.)

No commit (still pre-git).

---

### Task 4: Rewrite Claude-side hardcoded paths (Spec Stage 4a)

> **Confidence: High** — verified all 13 references in 5 files. Every `/Users/milovan/projects/Consilium/` reference in Claude-side files targets a Claude-runtime path; uniformly insert `claude/` after `/Consilium/`.

**Files:**
- Modify: `/Users/milovan/projects/Consilium-new/claude/skills/legion/SKILL.md` (7 path refs + Phase 0 fallback block)
- Modify: `/Users/milovan/projects/Consilium-new/claude/skills/edicts/SKILL.md` (2 path refs + Phase 0 fallback block)
- Modify: `/Users/milovan/projects/Consilium-new/claude/skills/consul/SKILL.md` (2 path refs + Phase 0 fallback block)
- Modify: `/Users/milovan/projects/Consilium-new/claude/skills/tribune/SKILL.md` (1 path ref + Phase 0 fallback block)
- Modify: `/Users/milovan/projects/Consilium-new/claude/skills/march/SKILL.md` (Phase 0 fallback block only — no other path refs)
- Modify: `/Users/milovan/projects/Consilium-new/claude/docs/claude-subagents-mcp-findings.md` (1 ref)
- Modify: `/Users/milovan/projects/Consilium-new/docs/codex.md` (prose reference at line 180 — file was moved here in Task 3)
- Modify: `/Users/milovan/projects/Consilium-new/claude/CLAUDE.md` (Maintenance section restructure)

- [ ] **Step 1: Rewrite `/Users/milovan/projects/Consilium/` → `/Users/milovan/projects/Consilium/claude/` in five files**

For each file below, use Edit with `replace_all: true`:

File: `/Users/milovan/projects/Consilium-new/claude/skills/legion/SKILL.md`
- old_string: `/Users/milovan/projects/Consilium/skills/`
- new_string: `/Users/milovan/projects/Consilium/claude/skills/`
- replace_all: true

File: `/Users/milovan/projects/Consilium-new/claude/skills/edicts/SKILL.md`
- old_string: `/Users/milovan/projects/Consilium/skills/`
- new_string: `/Users/milovan/projects/Consilium/claude/skills/`
- replace_all: true

File: `/Users/milovan/projects/Consilium-new/claude/skills/consul/SKILL.md`
- old_string: `/Users/milovan/projects/Consilium/skills/`
- new_string: `/Users/milovan/projects/Consilium/claude/skills/`
- replace_all: true

File: `/Users/milovan/projects/Consilium-new/claude/skills/tribune/SKILL.md`
- old_string: `Base directory for this skill: /Users/milovan/projects/Consilium/skills/tribune`
- new_string: `Base directory for this skill: /Users/milovan/projects/Consilium/claude/skills/tribune`

File: `/Users/milovan/projects/Consilium-new/claude/docs/claude-subagents-mcp-findings.md`
- old_string: `/Users/milovan/projects/Consilium/.../agents/`
- new_string: `/Users/milovan/projects/Consilium/claude/.../agents/`

- [ ] **Step 2: Rewrite Phase 0 fallback strings in five Claude SKILLs**

Five Claude-side SKILLs embed a Phase 0 fallback block resembling:

```
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
```

The fallback path needs to update from `$HOME/projects/consilium-docs` to `$HOME/projects/Consilium/docs`. The error message text and marker grep stay unchanged (they reference the doctrine concept, not the path).

For each of these five files, apply this Edit with `replace_all: true`:
- old_string: `CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"`
- new_string: `CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/Consilium/docs}"`
- replace_all: true

Files (one Edit per file, same old/new strings):
- `/Users/milovan/projects/Consilium-new/claude/skills/legion/SKILL.md` (block at lines 45-52)
- `/Users/milovan/projects/Consilium-new/claude/skills/consul/SKILL.md` (block at lines 86-93)
- `/Users/milovan/projects/Consilium-new/claude/skills/march/SKILL.md` (block at lines 39-46)
- `/Users/milovan/projects/Consilium-new/claude/skills/tribune/SKILL.md` (block at lines 116-123)
- `/Users/milovan/projects/Consilium-new/claude/skills/edicts/SKILL.md` (block at lines 85-92)

Verify all five rewritten:
```bash
for f in legion consul march tribune edicts; do
  echo "=== $f ==="
  rg -n "CONSILIUM_DOCS:-\\\$HOME/projects/(consilium-docs|Consilium/docs)" /Users/milovan/projects/Consilium-new/claude/skills/$f/SKILL.md
done
```

Expected: each file shows the NEW fallback (`Consilium/docs`); no matches for the OLD fallback (`consilium-docs`).

- [ ] **Step 3: Update prose reference in `docs/codex.md`**

The jurisprudence document was moved to `Consilium-new/docs/codex.md` in Task 3. Line 180 contains a prose reference to the old default path that needs updating. The path is wrapped in backticks in the source — the Edit must include them.

File: `/Users/milovan/projects/Consilium-new/docs/codex.md`
- old_string: ``defaulting to `/Users/milovan/projects/consilium-docs` when the dispatcher did not provide a value``
- new_string: ``defaulting to `/Users/milovan/projects/Consilium/docs` when the dispatcher did not provide a value``

- [ ] **Step 4: Verify no Claude-side stale paths remain**

```bash
rg -n "/Users/milovan/projects/Consilium/skills/" /Users/milovan/projects/Consilium-new/claude/skills/ /Users/milovan/projects/Consilium-new/claude/docs/ 2>/dev/null
rg -n "consilium-docs" /Users/milovan/projects/Consilium-new/claude/skills/ /Users/milovan/projects/Consilium-new/docs/codex.md 2>/dev/null | rg -v "consilium-docs (not found at|CONVENTIONS|migration|checkout)|is not a consilium-docs" | head
```

Expected: first command produces NO output. Second command (after filtering out legitimate concept/error references — including the "is not a consilium-docs checkout" error message wording) produces NO output — every PATH-bearing `consilium-docs` reference has been rewritten.

- [ ] **Step 5: Confirm rewritten count**

```bash
rg -c "/Users/milovan/projects/Consilium/claude/skills/" /Users/milovan/projects/Consilium-new/claude/skills/legion/SKILL.md /Users/milovan/projects/Consilium-new/claude/skills/edicts/SKILL.md /Users/milovan/projects/Consilium-new/claude/skills/consul/SKILL.md /Users/milovan/projects/Consilium-new/claude/skills/tribune/SKILL.md
```

Expected output:
```
.../legion/SKILL.md:7
.../edicts/SKILL.md:2
.../consul/SKILL.md:2
.../tribune/SKILL.md:1
```

- [ ] **Step 6: Restructure CLAUDE.md Maintenance section**

File: `/Users/milovan/projects/Consilium-new/claude/CLAUDE.md`

Find this block (the "Plugin cache sync" subsection — verify exact text by reading the file first; current line range ~37–47):

```
**Plugin cache sync.** After editing any skill source file under `skills/`, copy it to the plugin cache so the next Claude Code session picks up the change:

```bash
cp skills/<skill>/SKILL.md ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/<skill>/SKILL.md
```
```

Replace with:

```
**Plugin cache.** The plugin cache at `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` is symlinked to `/Users/milovan/projects/Consilium/claude/`. Edits to source under `claude/` are instantly live in the next session — no copy step needed.
```

Then find the "Repos" subsection:

```
## Repos

- Store: `/Users/milovan/projects/divinipress-store`
- Backend: `/Users/milovan/projects/divinipress-backend`
```

Replace with:

```
## Repos

- Consilium monorepo: `/Users/milovan/projects/Consilium` (this repo) — runtime-tuned source under `claude/`, `codex/`, doctrine + cases under `docs/`. The canonical jurisprudence Codex lives at `docs/codex.md`.
- Store: `/Users/milovan/projects/divinipress-store`
- Backend: `/Users/milovan/projects/divinipress-backend`
```

- [ ] **Step 7: Verify CLAUDE.md is updated**

```bash
rg -n "Plugin cache sync\." /Users/milovan/projects/Consilium-new/claude/CLAUDE.md
rg -n "docs/codex.md" /Users/milovan/projects/Consilium-new/claude/CLAUDE.md
```

Expected: first command shows NO output (subsection removed). Second shows ≥1 line (canonical jurisprudence reference present).

No commit.

---

### Task 5: Rewrite Codex-side hardcoded paths (Spec Stage 4b)

> **Confidence: High** — verified each reference. The README.md count is 6 refs (not 2 as the Censor reported); plan reflects actual surface.

**Files:**
- Modify: `/Users/milovan/projects/Consilium-new/codex/source/doctrine/common.md` (1 ref — the `$CONSILIUM_DOCS` fallback that propagates to all 15 generated TOMLs)
- Modify: `/Users/milovan/projects/Consilium-new/codex/source/protocols/consul-routing.md` (2 refs — discriminator paths)
- Modify: `/Users/milovan/projects/Consilium-new/codex/skills/tribune/SKILL.md` (2 refs — export fallback at lines 21 + 165)
- Modify: `/Users/milovan/projects/Consilium-new/codex/scripts/check-shared-docs-adoption.py` (3 refs: line 27 banned-regex KEPT-as-guard with new monorepo path; lines 39 + 49 are REQUIRED-presence patterns that pin the path string in `common.md` and generated TOMLs)
- Modify: `/Users/milovan/projects/Consilium-new/codex/scripts/check-tribune-shared-docs.py` (3 refs: line 18 default fallback; line 58 REQUIRED_SKILL_SNIPPETS literal pinned to the SKILL.md export line)
- Modify: `/Users/milovan/projects/Consilium-new/codex/evals/tasks/16-install-staleness.md` (1 ref)
- Modify: `/Users/milovan/projects/Consilium-new/codex/README.md` (6 refs across lines 5, 8, 43, 51, 139, 180)
- Leave as-is: `/Users/milovan/projects/Consilium-new/codex/RANK-MAPPING-AUDIT.md` (historical artifact per spec Stage 4e)
- Leave as-is in validator scripts: error message strings ("consilium-docs not found at..."), marker grep patterns ("consilium-docs CONVENTIONS"), test fixture markers. The marker line and error wording reference "consilium-docs" as a CONCEPT (the doctrine corpus identity); the migration only changes its physical location, not its name/identity. Validators correctly continue to verify the marker line.

- [ ] **Step 1: Update `$CONSILIUM_DOCS` fallback in `source/doctrine/common.md`**

File: `/Users/milovan/projects/Consilium-new/codex/source/doctrine/common.md`
- old_string: `export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"`
- new_string: `export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"`

- [ ] **Step 2: Update both discriminator paths in `source/protocols/consul-routing.md`**

File: `/Users/milovan/projects/Consilium-new/codex/source/protocols/consul-routing.md`

First Edit:
- old_string: `/Users/milovan/projects/Consilium-codex/skills/tribune`
- new_string: `/Users/milovan/projects/Consilium/codex/skills/tribune`
- replace_all: true

Second Edit (must run AFTER the first, since the second old_string is a substring after the first replacement may share characters):
- old_string: `/Users/milovan/projects/Consilium/skills/tribune`
- new_string: `/Users/milovan/projects/Consilium/claude/skills/tribune`
- replace_all: true

Verify after both:
```bash
rg -n "Consilium-codex/skills/tribune|/Consilium/skills/tribune" /Users/milovan/projects/Consilium-new/codex/source/protocols/consul-routing.md
```
Expected: NO output.

```bash
rg -n "Consilium/codex/skills/tribune|Consilium/claude/skills/tribune" /Users/milovan/projects/Consilium-new/codex/source/protocols/consul-routing.md
```
Expected: 2 matches (one each).

- [ ] **Step 3: Update banned-pattern regex in `check-shared-docs-adoption.py`**

File: `/Users/milovan/projects/Consilium-new/codex/scripts/check-shared-docs-adoption.py`
- old_string: `(re.compile(r"/Users/milovan/projects/Consilium-codex/docs/consilium"), "local Codex docs/consilium path"),`
- new_string: `(re.compile(r"/Users/milovan/projects/Consilium/codex/docs/consilium"), "local Codex docs/consilium path"),`

(Line 27. SAFETY GUARD that bans the stale local-docs path. Updated to ban the new monorepo equivalent. Do NOT delete.)

- [ ] **Step 4: Update REQUIRED-presence patterns in `check-shared-docs-adoption.py`**

These are validator pins that REQUIRE the new path string to appear in `common.md` and generated TOMLs. Without these updates, the install pipeline fails because `check_common()` and `check_agents()` would still demand the old `consilium-docs` literal.

File: `/Users/milovan/projects/Consilium-new/codex/scripts/check-shared-docs-adoption.py`

Edit 1 — line 39 (REQUIRED_COMMON_PATTERNS regex):
- old_string: `    (re.compile(r'export CONSILIUM_DOCS="\$\{CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs\}"'), "exported default CONSILIUM_DOCS"),`
- new_string: `    (re.compile(r'export CONSILIUM_DOCS="\$\{CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs\}"'), "exported default CONSILIUM_DOCS"),`

Edit 2 — line 49 (AGENT_REQUIRED_SNIPPETS literal):
- old_string: `    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"',`
- new_string: `    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',`

Lines 40, 41 (error message + marker grep regex) stay unchanged — those reference the marker concept and error wording, both of which are preserved across migration.

- [ ] **Step 5: Refactor `check-tribune-shared-docs.py`**

File: `/Users/milovan/projects/Consilium-new/codex/scripts/check-tribune-shared-docs.py`

Edit 1 (line 18 default fallback):
- old_string: `CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", "/Users/milovan/projects/consilium-docs"))`
- new_string: `CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", "/Users/milovan/projects/Consilium/docs"))`

Edit 2 (line 58 REQUIRED_SKILL_SNIPPETS literal):
- old_string: `    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"',`
- new_string: `    'export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"',`

Lines 102–104 (error messages and marker checks) and line 202 (test fixture marker write) stay unchanged.

- [ ] **Step 6: Update `Consilium-new/codex/skills/tribune/SKILL.md` export fallback**

`skills/tribune/SKILL.md` contains the same export-fallback line at lines 21 and 165 (both Phase 0 blocks). The validator at `check-tribune-shared-docs.py` line 58 (now updated in Step 5 to expect the new path) requires this skill file's export line to match.

File: `/Users/milovan/projects/Consilium-new/codex/skills/tribune/SKILL.md`
- old_string: `export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/consilium-docs}"`
- new_string: `export CONSILIUM_DOCS="${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}"`
- replace_all: true

(Two occurrences at lines 21 and 165; `replace_all: true` catches both. Other `consilium-docs` references on adjacent lines — error messages, marker text — stay unchanged because they refer to the doctrine concept, not the path.)

- [ ] **Step 7: Update `evals/tasks/16-install-staleness.md`**

File: `/Users/milovan/projects/Consilium-new/codex/evals/tasks/16-install-staleness.md`
- old_string: `/Users/milovan/projects/Consilium-codex/skills/tribune`
- new_string: `/Users/milovan/projects/Consilium/codex/skills/tribune`
- replace_all: true

- [ ] **Step 8: Update Codex README.md (6 refs across 6 distinct lines)**

File: `/Users/milovan/projects/Consilium-new/codex/README.md`

Edit 1 — line 5:
- old_string: `This repo is intentionally separate from the Claude-oriented source repo at [../Consilium](/Users/milovan/projects/Consilium). The two runtimes are not tuned the same way, and they should not share prompt source files.`
- new_string: `This is the Codex-runtime source within the Consilium monorepo. Sibling runtime source for Claude lives at [../claude](/Users/milovan/projects/Consilium/claude). The two runtimes are not tuned the same way, and they do not share prompt source files — the subdirectories make the separation explicit.`

Edit 2 — line 8:
- old_string: `- Claude source stays in `/Users/milovan/projects/Consilium``
- new_string: `- Claude source stays in `/Users/milovan/projects/Consilium/claude``

Edit 3 — line 43:
- old_string: `- Runtime shared doctrine and Consilium artifacts live in `$CONSILIUM_DOCS`, defaulting to `/Users/milovan/projects/consilium-docs``
- new_string: `- Runtime shared doctrine and Consilium artifacts live in `$CONSILIUM_DOCS`, defaulting to `/Users/milovan/projects/Consilium/docs``

Edit 4 — line 51:
- old_string: `Codex Consilium agents expect `$CONSILIUM_DOCS` to resolve to a valid `consilium-docs` checkout. The default is `/Users/milovan/projects/consilium-docs`.`
- new_string: `Codex Consilium agents expect `$CONSILIUM_DOCS` to resolve to a valid `consilium-docs` checkout. The default is `/Users/milovan/projects/Consilium/docs`.`

Edit 5 — line 139:
- old_string: `/Users/milovan/projects/Consilium-codex/skills/tribune`
- new_string: `/Users/milovan/projects/Consilium/codex/skills/tribune`

Edit 6 — line 180:
- old_string: `[evals/](/Users/milovan/projects/Consilium-codex/evals:1)`
- new_string: `[evals/](/Users/milovan/projects/Consilium/codex/evals:1)`

- [ ] **Step 9: Update `Consilium-new/docs/doctrine/known-gaps.md` line 11 — port-origin reference**

`docs/doctrine/known-gaps.md` line 11 contains a port-origin reference to the old Codex source path. Active doctrine, not historical — needs rewriting.

File: `/Users/milovan/projects/Consilium-new/docs/doctrine/known-gaps.md`
- old_string: ``/Users/milovan/projects/Consilium-codex/source/doctrine/divinipress-known-gaps.md``
- new_string: ``/Users/milovan/projects/Consilium/codex/source/doctrine/divinipress-known-gaps.md``

- [ ] **Step 10: Verify Codex side has no stale `/Users/milovan/projects/Consilium-codex` or `/Users/milovan/projects/consilium-docs` references in active files**

```bash
rg -n "/Users/milovan/projects/Consilium-codex" /Users/milovan/projects/Consilium-new/codex/ \
  --glob '!docs/consilium/plans/2026-04-23-tribune-phase-*' \
  --glob '!RANK-MAPPING-AUDIT.md'

rg -n "/Users/milovan/projects/consilium-docs" /Users/milovan/projects/Consilium-new/codex/ \
  --glob '!docs/consilium/plans/2026-04-23-tribune-phase-*' \
  --glob '!RANK-MAPPING-AUDIT.md'
```

Expected: NO output from either command (active files all rewritten; historical edict files and RANK-MAPPING-AUDIT.md correctly excluded).

No commit.

---

### Task 6: Rewrite user-scope agent paths (Spec Stage 4c)

> **Confidence: High** — audited all seven user-scope agents. Six (tribunus, censor, praetor, provocator, soldier, custos) contain the same `/Users/milovan/projects/consilium-docs` fallback line. `consilium-soldier.md` additionally contains hardcoded skill paths on line 329. `consilium-scout.md` has no refs.

**Files:**
- Modify: `/Users/milovan/.claude/agents/consilium-tribunus.md`
- Modify: `/Users/milovan/.claude/agents/consilium-censor.md`
- Modify: `/Users/milovan/.claude/agents/consilium-praetor.md`
- Modify: `/Users/milovan/.claude/agents/consilium-provocator.md`
- Modify: `/Users/milovan/.claude/agents/consilium-soldier.md` (two changes: descriptive fallback line + line 329 skill paths)
- Modify: `/Users/milovan/.claude/agents/consilium-custos.md`
- No change: `/Users/milovan/.claude/agents/consilium-scout.md`

- [ ] **Step 1: Update the descriptive `$CONSILIUM_DOCS` fallback line in six user-scope agents**

For each of the six agents below, apply this Edit (the line is identical across all six):

- old_string: `defaulting to `/Users/milovan/projects/consilium-docs` when the dispatcher did not provide a value`
- new_string: `defaulting to `/Users/milovan/projects/Consilium/docs` when the dispatcher did not provide a value`

Apply to:
- `/Users/milovan/.claude/agents/consilium-tribunus.md`
- `/Users/milovan/.claude/agents/consilium-censor.md`
- `/Users/milovan/.claude/agents/consilium-praetor.md`
- `/Users/milovan/.claude/agents/consilium-provocator.md`
- `/Users/milovan/.claude/agents/consilium-soldier.md`
- `/Users/milovan/.claude/agents/consilium-custos.md`

- [ ] **Step 2: Update line 329 skill paths in `consilium-soldier.md`**

File: `/Users/milovan/.claude/agents/consilium-soldier.md`

Edit:
- old_string: `Read `/Users/milovan/projects/Consilium/skills/gladius/SKILL.md` when your orders specify TDD discipline. Read `/Users/milovan/projects/Consilium/skills/tribune/SKILL.md` when you need to diagnose a bug.`
- new_string: `Read `/Users/milovan/projects/Consilium/claude/skills/gladius/SKILL.md` when your orders specify TDD discipline. Read `/Users/milovan/projects/Consilium/claude/skills/tribune/SKILL.md` when you need to diagnose a bug.`

- [ ] **Step 3: Verify all seven agents are clean**

```bash
for agent in tribunus scout censor praetor provocator soldier custos; do
  count=$(rg -c "/Users/milovan/projects/(Consilium/skills/|consilium-docs)" /Users/milovan/.claude/agents/consilium-$agent.md 2>/dev/null || echo 0)
  echo "consilium-$agent.md: $count stale refs"
done
```

Expected: every line shows `0 stale refs`.

```bash
rg -n "/Users/milovan/projects/Consilium/(claude/|docs)" /Users/milovan/.claude/agents/consilium-{tribunus,censor,praetor,provocator,soldier,custos}.md | wc -l | tr -d ' '
```

Expected: at least 7 (six fallback-line rewrites + 2 skill-path rewrites in soldier — actual count may vary if any agent had multiple refs but never less than 7).

These edits are made to live user-scope agent files at `~/.claude/agents/`, NOT to repo copies. They take effect on the next agent dispatch. No commit (these files are outside any repo).

---

### Task 7: Refactor Claude maintenance scripts (Spec Stage 4d)

> **Confidence: High** — verified `check-tribune-staleness.py` does not currently import `os`. Refactor adds the import and replaces the hardcoded path with env-var resolution.

**Files:**
- Modify: `/Users/milovan/projects/Consilium-new/claude/scripts/check-tribune-staleness.py`
- No change needed (already updated in Task 3): `/Users/milovan/projects/Consilium-new/claude/scripts/check-codex-drift.py`

- [ ] **Step 1: Add `import os` to `check-tribune-staleness.py`**

File: `/Users/milovan/projects/Consilium-new/claude/scripts/check-tribune-staleness.py`

Find:
```python
import json
import re
import sys
from pathlib import Path
```

Replace with:
```python
import json
import os
import re
import sys
from pathlib import Path
```

- [ ] **Step 2: Refactor the `CONSILIUM_DOCS` constant**

Find:
```python
CONSILIUM_DOCS = Path("/Users/milovan/projects/consilium-docs")
```

Replace with:
```python
CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", str(Path.home() / "projects" / "Consilium" / "docs")))
```

- [ ] **Step 3: Smoke-test the refactor with explicit env var**

```bash
CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs python3 -c "
import sys, os
sys.path.insert(0, '/Users/milovan/projects/Consilium-new/claude/scripts')
exec(open('/Users/milovan/projects/Consilium-new/claude/scripts/check-tribune-staleness.py').read().split('def ')[0])
print('CONSILIUM_DOCS:', CONSILIUM_DOCS)
print('DOCTRINE_DIR:', DOCTRINE_DIR)
assert str(CONSILIUM_DOCS) == '/Users/milovan/projects/Consilium-new/docs', f'expected new path, got {CONSILIUM_DOCS}'
print('OK')
"
```

Expected: prints `CONSILIUM_DOCS: /Users/milovan/projects/Consilium-new/docs`, then `OK`.

- [ ] **Step 4: Verify the refactor without env var (uses default)**

```bash
unset CONSILIUM_DOCS
python3 -c "
import sys
sys.path.insert(0, '/Users/milovan/projects/Consilium-new/claude/scripts')
exec(open('/Users/milovan/projects/Consilium-new/claude/scripts/check-tribune-staleness.py').read().split('def ')[0])
expected = '/Users/milovan/projects/Consilium/docs'
assert str(CONSILIUM_DOCS) == expected, f'expected default {expected}, got {CONSILIUM_DOCS}'
print('OK')
"
```

Expected: `OK`. (Default falls back to the post-swap monorepo location.)

No commit.

---

### Task 8: `git init` and force-push to GitHub (Spec Stage 5)

> **Confidence: High** — `git init -b main` forces local branch name to `main` (protects against `master` defaults). `git push -u --force` sets upstream tracking on the same call. Imperator accepted history reset; GitHub-side state beyond commits is acknowledged lost.

**Files:**
- Create: `/Users/milovan/projects/Consilium-new/.gitignore` (consolidate the three source `.gitignore`s)
- Initialize: `/Users/milovan/projects/Consilium-new/.git/`
- Push: `https://github.com/Milovan-Crowley/Consilium.git`

- [ ] **Step 1: Create root `.gitignore` with cross-cutting patterns; retain per-subdir `.gitignore` files**

Each source repo's `.gitignore` was copied by Stage 2 rsync to `claude/.gitignore`, `codex/.gitignore`, `docs/.gitignore`. KEEP these per-subdir files in place — their patterns are scoped to their subdirs (e.g., `codex/.gitignore` may ignore `codex/agents/*.toml` generated artifacts; if hoisted to root that pattern would also ignore `claude/agents/`). Create a root `.gitignore` for cross-cutting patterns only.

First inspect the three subdir `.gitignore`s using the Read tool (the bash-discipline hook denies leading `cat`):
- Read `/Users/milovan/projects/Consilium-new/claude/.gitignore`
- Read `/Users/milovan/projects/Consilium-new/codex/.gitignore`
- Read `/Users/milovan/projects/Consilium-new/docs/.gitignore`

Confirm none of them contain patterns that would over-ignore if hoisted (the cross-cutting set verified by recon: `.DS_Store`, `.serena/`, `node_modules/`, `__pycache__/`, `.migration-in-progress`).

Then create the root `.gitignore` using the Write tool (NOT a `cat > ... <<EOF` heredoc — the bash-discipline hook denies leading `cat`):

Write tool:
- file_path: `/Users/milovan/projects/Consilium-new/.gitignore`
- content (literal, with trailing newline):
```
.DS_Store
.serena/
__pycache__/
*.pyc
node_modules/
.migration-in-progress
```

Verify with the Read tool. Expected: file exists at root, contains the six lines above, and no extra content.

- [ ] **Step 2: Initialize the git repo with `main` as the default branch**

```bash
cd /Users/milovan/projects/Consilium-new
git init -b main
```

Expected: `Initialized empty Git repository in /Users/milovan/projects/Consilium-new/.git/` (or similar).

Verify:
```bash
git -C /Users/milovan/projects/Consilium-new branch --show-current
```
Expected: `main` (no commits yet, but the symbolic ref is set).

- [ ] **Step 3: Add the GitHub remote**

```bash
git -C /Users/milovan/projects/Consilium-new remote add origin https://github.com/Milovan-Crowley/Consilium.git
git -C /Users/milovan/projects/Consilium-new remote -v
```

Expected: prints `origin  https://github.com/Milovan-Crowley/Consilium.git (fetch)` and `(push)`.

- [ ] **Step 4: Stage and commit everything as a single fresh commit**

```bash
cd /Users/milovan/projects/Consilium-new
git add -A
git status --short | head -20
git commit -m "feat: consolidate Consilium, Consilium-codex, consilium-docs into monorepo with claude/, codex/, docs/ subdirs"
```

Expected: `git status` shows many `A` (added) entries; commit succeeds with a fresh SHA.

- [ ] **Step 5: Force-push, setting upstream tracking**

```bash
git -C /Users/milovan/projects/Consilium-new push -u --force origin main
```

Expected: `+ <old-sha>...<new-sha> main -> main (forced update)`. The 163-commit history on origin is replaced with the single new commit.

If the push fails mid-network, retry the same command — the local commit SHA is stable and the push is idempotent.

- [ ] **Step 6: Verify the GitHub state matches**

```bash
gh repo view Milovan-Crowley/Consilium --json defaultBranchRef,visibility,isPrivate | head -20
```

Expected: `defaultBranchRef.name = "main"`, `isPrivate: true`.

Optionally inspect the latest commit:
```bash
gh api repos/Milovan-Crowley/Consilium/commits/main --jq '.sha,.commit.message'
```

Expected: prints the new SHA and the commit message.

Commit already done in Step 4. Push done in Step 5.

---

### Task 9: Verification gates in isolation (Spec Stage 6)

> **Confidence: High** — every runtime surface and maintenance check is exercised against the new monorepo while the old repos remain on disk. If any gate fails, fix in `Consilium-new/`, re-run the affected steps; do not advance to Task 10.

**Files:**
- Modify temporarily: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/` (retarget symlink to new location)
- Modify temporarily: shell config (`~/.zshrc` or active shell's `$CONSILIUM_DOCS` export)
- Modify temporarily: `/Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md` (insert + remove unique marker for resolution check)

- [ ] **Step 1: Retarget plugin cache symlink to new monorepo's claude/ subdir**

```bash
rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
ln -s /Users/milovan/projects/Consilium-new/claude /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
readlink /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
```

Expected: prints `/Users/milovan/projects/Consilium-new/claude`.

- [ ] **Step 2: Export `$CONSILIUM_DOCS` to point at the new location**

```bash
export CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs
echo "CONSILIUM_DOCS=$CONSILIUM_DOCS"
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && echo "marker present" || echo "MARKER MISSING — HALT"
```

Expected: prints the new path and `marker present`.

- [ ] **Step 3: Insert a unique marker into `Consilium-new/docs/CONVENTIONS.md` for the resolution check**

The bash-discipline hook denies leading `sed` and `head`. Use Edit tool to insert the marker.

Edit tool:
- file_path: `/Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md`
- old_string: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->\n# Consilium Docs — Conventions`
- new_string: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->\n<!-- migration-marker-2026-04-25 — temporary, removed after Stage 6 verification -->\n# Consilium Docs — Conventions`

(The Edit tool's `\n` in old/new strings is interpreted literally — verify by reading the file's first two lines after the Edit. If the Edit tool doesn't accept `\n` as a literal newline placeholder, use the actual newline character in the prompt or split into a Read+Write sequence.)

Verify with Read tool: read the first 3 lines of `/Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md`. Expected: line 1 is the canonical marker, line 2 is the migration marker, line 3 is `# Consilium Docs — Conventions`.

- [ ] **Step 4: Verify the unique marker resolves via env-var Phase 0 — the Legatus runs the same check the skills run**

The Legatus runs Phase 0 directly with the new env var set, exercising the same file-resolution logic that any skill (Consul, Tribune, Legion) executes at the top of its body:

```bash
CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs bash -c '
[ -d "$CONSILIUM_DOCS" ] || { echo "FAIL: docs dir missing at $CONSILIUM_DOCS"; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || { echo "FAIL: marker line missing"; exit 1; }
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || { echo "FAIL: migration-in-progress flag set"; exit 1; }
rg -c "migration-marker-2026-04-25" "$CONSILIUM_DOCS/CONVENTIONS.md" > /tmp/marker-count
count=$(cat /tmp/marker-count)
[ "$count" = "1" ] && echo "OK: Phase 0 cleared and unique marker present (count=$count)" || echo "FAIL: marker count is $count"
'
```

Expected: `OK: Phase 0 cleared and unique marker present (count=1)`. Any `FAIL` line halts the migration.

The Legatus also dispatches a fresh consilium-soldier subagent to validate end-to-end — a subagent is a fresh Claude Code instance that exercises the actual session-time path resolution the Imperator's next session will use.

```
Agent tool dispatch:
  subagent_type: "consilium-soldier"
  description: "Stage-6 marker check"
  mode: "auto"
  prompt: |
    Run this single command and report the exact output:
      CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs rg -c "migration-marker-2026-04-25" "$CONSILIUM_DOCS/CONVENTIONS.md"
    
    Then read the first 3 lines of /Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md and report them verbatim.
    
    Report only those two pieces of output. No commentary.
```

Expected from soldier: count of `1` and the first 3 lines including the unique marker on line 2. If the soldier reports anything else, the migration halts and the Legatus escalates to the Imperator with the soldier's output.

- [ ] **Step 5: Remove the unique marker from CONVENTIONS.md**

The bash-discipline hook denies leading `sed` and `head`. Use Edit tool to remove the marker.

Edit tool:
- file_path: `/Users/milovan/projects/Consilium-new/docs/CONVENTIONS.md`
- old_string: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->\n<!-- migration-marker-2026-04-25 — temporary, removed after Stage 6 verification -->\n# Consilium Docs — Conventions`
- new_string: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->\n# Consilium Docs — Conventions`

Verify with Read tool: read the first 3 lines. Expected: line 1 is the canonical marker, line 2 is `# Consilium Docs — Conventions` (marker removed).

- [ ] **Step 6: Real subagent dispatch — exercise a user-scope agent end-to-end with explicit `$CONSILIUM_DOCS` resolution**

The Legatus dispatches a `consilium-tribunus` subagent against a tiny throwaway artifact AND requires the subagent to read a file from the new docs location, forcing actual `$CONSILIUM_DOCS` resolution against `Consilium-new/docs`. This validates: (a) user-scope agent file frontmatter parses, (b) persona body loads, (c) the subagent's process env or its own resolution lands at the new docs location, (d) the dispatch chain produces structured output.

Create the dummy artifact (Write tool, not `cat > ... <<EOF` heredoc, since the bash-discipline hook denies leading `cat`):

Write tool:
- file_path: `/tmp/consilium-stage-6-smoke/dummy-spec.md`
- content:
```
# Dummy spec for Stage 6 smoke test

This file exists solely to validate that a user-scope agent dispatches
correctly post-monorepo-migration AND can resolve $CONSILIUM_DOCS to the
new location. The agent should return a finding plus the requested file read.
```

(If `/tmp/consilium-stage-6-smoke/` doesn't exist, Bash `mkdir -p /tmp/consilium-stage-6-smoke` first — `mkdir` is not blocked by the hook.)

Then dispatch with explicit env-var contract in the prompt:

```
Agent tool:
  subagent_type: "consilium-tribunus"
  description: "Stage-6 user-scope agent smoke test"
  mode: "auto"
  prompt: |
    Stance: patrol.
    
    Required setup: this dispatch is a smoke test of the post-migration
    monorepo. Run this Bash command FIRST and report its output before
    your patrol verdict:
    
      CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs head -1 "$CONSILIUM_DOCS/CONVENTIONS.md"
    
    Expected first line: <!-- consilium-docs CONVENTIONS — do not remove this marker line -->
    
    Then patrol-verify the artifact below. Return a SOUND finding noting
    that you successfully resolved $CONSILIUM_DOCS to the new location AND
    the artifact loaded correctly.
    
    ## The Artifact
    
    {paste content of /tmp/consilium-stage-6-smoke/dummy-spec.md}
```

Expected: Tribunus reports the canonical marker line from `Consilium-new/docs/CONVENTIONS.md` AND returns a structured SOUND finding. If the marker line doesn't match, the subagent's resolution didn't reach the new location — halt and investigate. If the dispatch fails to spawn, Task 6 didn't land cleanly — investigate `~/.claude/agents/consilium-tribunus.md` frontmatter.

(Note: the Tribunus's persona body does NOT have its own Phase 0 block requiring `$CONSILIUM_DOCS` — it relies on the dispatcher to resolve. The inline `CONSILIUM_DOCS=...` prefix in the Bash command above is the explicit contract.)

- [ ] **Step 7: Run Codex install from new location**

The install pipeline invokes validators (`check-shared-docs-adoption.py`, `check-tribune-shared-docs.py`) that check `$CONSILIUM_DOCS` resolution. The Bash subprocess for this step does NOT inherit the export from Step 2 (each Bash tool call is a fresh subshell). Inline the env var in the command:

```bash
CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs bash -c 'cd /Users/milovan/projects/Consilium-new/codex && bash scripts/install-codex.sh 2>&1' | tail -20
```

Expected: install reports successful regeneration of TOMLs and copy to `~/.codex/agents/`. No errors. If `check-tribune-shared-docs.py` reports "consilium-docs checkout missing", the env var didn't propagate — investigate the bash invocation form.

- [ ] **Step 8: Spot-check 3 of 15 generated TOMLs for the new fallback**

```bash
for agent in consul censor praetor; do
  echo "--- consilium-$agent.toml ---"
  rg "CONSILIUM_DOCS:-" /Users/milovan/.codex/agents/consilium-$agent.toml | head -1
done
```

Expected: each line shows `${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}`. No `consilium-docs` substring (lowercase, hyphenated).

- [ ] **Step 9: Run `check-codex-drift.py` against new layout (via in-memory CANONICAL override)**

The script's CANONICAL constant points at `~/projects/Consilium/docs/codex.md` (post-swap path), which doesn't exist yet. The bash-discipline hook denies leading `sed` so the previously-prescribed mutate-and-revert isn't viable, and the script's `main()` is gated behind `if __name__ == "__main__":` so importlib-execute doesn't invoke validation. The reliable approach: load the script's source as text, override CANONICAL in memory before exec, and call `main()` directly. The on-disk file stays pristine.

```bash
python3 - <<'PYEOF'
import sys
import importlib.util
from pathlib import Path

script_path = Path("/Users/milovan/projects/Consilium-new/claude/scripts/check-codex-drift.py")
spec = importlib.util.spec_from_file_location("drift", script_path)
mod = importlib.util.module_from_spec(spec)

# Inject override BEFORE exec so module-level reassignment is overwritten after exec
spec.loader.exec_module(mod)
mod.CANONICAL = Path("/Users/milovan/projects/Consilium-new/docs/codex.md")

# Sanity-check the override took
assert mod.CANONICAL.exists(), f"override CANONICAL does not exist: {mod.CANONICAL}"
print(f"Running drift check with CANONICAL = {mod.CANONICAL}")

# Invoke main() directly
sys.argv = ["check-codex-drift.py"]
try:
    exit_code = mod.main()
except SystemExit as e:
    exit_code = e.code if isinstance(e.code, int) else 1
print(f"drift check exit code: {exit_code}")
sys.exit(exit_code)
PYEOF
```

Expected: prints `Running drift check with CANONICAL = ...new/docs/codex.md` followed by `drift check exit code: 0`. The on-disk script is never modified — verify with Read tool that line 26 still reads `CANONICAL = Path.home() / "projects" / "Consilium" / "docs" / "codex.md"`.

If exit code is non-zero, the drift script printed the drifted user-scope agents — fix in Task 6 and re-run Step 9.

(After Stage 7 swap, `Consilium/docs/codex.md` becomes the actual post-swap path, and the script runs unmodified. Task 10 Step 9 re-runs this check as part of the post-swap smoke test.)

- [ ] **Step 10: Run `check-tribune-staleness.py` against new layout**

```bash
CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs python3 /Users/milovan/projects/Consilium-new/claude/scripts/check-tribune-staleness.py 2>&1 | tail -15
```

Expected: script runs. Note that `TRIBUNE_DIR = REPO_ROOT / "skills" / "tribune"` resolves via `REPO_ROOT = Path(__file__).resolve().parent.parent` = `Consilium-new/claude/`, so `TRIBUNE_DIR = Consilium-new/claude/skills/tribune` — correct. If it reports stale references, investigate Task 4 completeness.

- [ ] **Step 11: Content-fidelity validation via sha256 sampling**

`rsync -a` already provides content integrity (CRC checks during transfer; the absence of error output from Task 2 is the primary fidelity signal). This step is a sanity probe — checking 4 representative unmodified files across diverse subdirs (a long markdown, a verification template, a shell script with executable bit, a top-level metadata file) catches gross issues like truncation or encoding flips. Full hash diff would be belt-and-suspenders; the sample suffices given rsync's own guarantees.

```bash
for f in skills/legion/implementer-prompt.md skills/references/verification/protocol.md hooks/bash-discipline.sh CHANGELOG.md; do
  src_hash=$(shasum -a 256 "/Users/milovan/projects/Consilium/$f" 2>/dev/null | cut -d' ' -f1)
  dst_hash=$(shasum -a 256 "/Users/milovan/projects/Consilium-new/claude/$f" 2>/dev/null | cut -d' ' -f1)
  if [ "$src_hash" = "$dst_hash" ] && [ -n "$src_hash" ]; then
    echo "OK $f"
  else
    echo "MISMATCH $f (src=$src_hash dst=$dst_hash)"
  fi
done
```

Expected: every line begins with `OK`. Any `MISMATCH` indicates content drift during rsync — halt and investigate (likely a partial copy or rsync error that escaped Task 2's exit-code check).

- [ ] **Step 12: Verify `consilium-marketplace/consilium` symlink target**

```bash
readlink /Users/milovan/projects/consilium-marketplace/consilium
ls /Users/milovan/projects/consilium-marketplace/consilium/ 2>&1 | head -5
```

Expected: `readlink` outputs `/Users/milovan/projects/Consilium`. `ls` resolves through the symlink to the OLD repo content (still at that path until Stage 7 mv). After Stage 7, the symlink resolves to the NEW monorepo content. Both states are valid.

If all 12 steps pass, Task 9 is complete. If any step fails, fix in `Consilium-new/` (re-run affected Tasks 4–7 as needed) and re-run Task 9 from the failing step.

No commit.

---

### Task 10: Swap (Spec Stage 7)

> **Confidence: High** — three filesystem `mv` operations + symlink retarget + env var update + Codex install rerun. Pre-swap discipline: close all live sessions to avoid stale path resolution.

**Files:**
- Move: `/Users/milovan/projects/Consilium` → `/Users/milovan/projects/Consilium-old`
- Move: `/Users/milovan/projects/Consilium-new` → `/Users/milovan/projects/Consilium`
- Modify: `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/` (retarget symlink to final location)
- Modify: shell config (`$CONSILIUM_DOCS` to final location)

- [ ] **Step 1: Pre-swap discipline — verify no other Claude/Codex processes**

The Legatus is itself a running Claude Code session and continues operating through the swap (the swap retargets paths but the Legatus's already-loaded context is unaffected). What must NOT be running is any OTHER Claude Code session or Codex agent process that has cached path resolution to the soon-to-be-moved directory.

```bash
# Count Claude/Codex processes excluding the current session and its children
this_pid=$$
ps -o pid=,ppid=,command= -A | grep -iE "claude|codex" | grep -v grep | grep -v " $this_pid " | head
```

Expected: empty output (no other claude/codex processes running). If any are found, the Legatus reports them to the Imperator and halts; the Imperator closes them before the swap proceeds.

The Legatus's own session is fine — `mv` of a directory does not invalidate already-open file handles, and Bash subcommands resolve paths fresh on each invocation.

- [ ] **Step 2: Rename old `Consilium` to `Consilium-old`**

```bash
mv /Users/milovan/projects/Consilium /Users/milovan/projects/Consilium-old
ls -d /Users/milovan/projects/Consilium-old
ls -d /Users/milovan/projects/Consilium 2>&1 | head -1
```

Expected: `Consilium-old` exists; `Consilium` lookup returns "No such file or directory".

- [ ] **Step 3: Rename `Consilium-new` to `Consilium`**

```bash
mv /Users/milovan/projects/Consilium-new /Users/milovan/projects/Consilium
ls -d /Users/milovan/projects/Consilium
```

Expected: `Consilium` exists, contains `claude/`, `codex/`, `docs/`, `.git/`, `.gitignore`.

- [ ] **Step 4: Retarget the plugin cache symlink to final location**

```bash
rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
ln -s /Users/milovan/projects/Consilium/claude /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
readlink /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
```

Expected: prints `/Users/milovan/projects/Consilium/claude`.

- [ ] **Step 5: Update shell config `$CONSILIUM_DOCS` to final location**

Edit the Imperator's shell config (`~/.zshrc` or wherever the env var is set) so future shells resolve `$CONSILIUM_DOCS` to the post-migration path.

Find any line resembling:
```
export CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs
```
or
```
export CONSILIUM_DOCS=/Users/milovan/projects/Consilium-new/docs
```

Replace with:
```
export CONSILIUM_DOCS=/Users/milovan/projects/Consilium/docs
```

If no such line exists in the shell config (the env var was set inline during Task 9), add the export now.

Apply to current shell:
```bash
export CONSILIUM_DOCS=/Users/milovan/projects/Consilium/docs
echo "CONSILIUM_DOCS=$CONSILIUM_DOCS"
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && echo "marker present" || echo "MARKER MISSING — HALT"
```

Expected: prints final path and `marker present`.

- [ ] **Step 6: Re-run Codex install from final location**

```bash
cd /Users/milovan/projects/Consilium/codex
bash scripts/install-codex.sh 2>&1 | tail -20
```

This regenerates TOMLs (with the now-correct fallback `${CONSILIUM_DOCS:-/Users/milovan/projects/Consilium/docs}`) and retargets `~/.agents/skills/tribune` symlink (per `install-codex-skills.sh`'s `ln -sfn`) to the final `Consilium/codex/skills/tribune`.

Verify:
```bash
readlink /Users/milovan/.agents/skills/tribune
```
Expected: `/Users/milovan/projects/Consilium/codex/skills/tribune`.

- [ ] **Step 7: Retarget the 11 Claude-skill symlinks under `~/.agents/skills/`**

`~/.agents/skills/` contains 11 Claude-side skill symlinks (castra, consul, edicts, forge, gladius, legion, march, phalanx, sententia, tribunal, triumph) that point at the OLD `/Users/milovan/projects/Consilium/skills/<name>` layout. After Stage 7 swap those paths don't exist (skills moved to `Consilium/claude/skills/`). The Codex install in Step 6 retargets only `tribune`; the other 11 must be retargeted manually.

```bash
for name in castra consul edicts forge gladius legion march phalanx sententia tribunal triumph; do
  src=/Users/milovan/projects/Consilium/claude/skills/$name
  dst=/Users/milovan/.agents/skills/$name
  if [ ! -d "$src" ]; then
    echo "MISSING SOURCE: $src — skipping $name"
    continue
  fi
  ln -sfn "$src" "$dst"
  echo "OK $name -> $(readlink "$dst")"
done
```

Expected: every line begins with `OK $name -> /Users/milovan/projects/Consilium/claude/skills/$name`. No `MISSING SOURCE` warnings.

(The `-n` flag on `ln -sfn` prevents following an existing symlink-to-directory; `-f` overwrites without error. Idempotent.)

- [ ] **Step 8: Retarget `consilium-marketplace/consilium` symlink to `Consilium/claude/`**

`/Users/milovan/projects/consilium-marketplace/.claude-plugin/marketplace.json` declares the plugin with `"source": "./consilium"` — expecting Claude-plugin layout (`agents/`, `skills/`, `commands/`, `hooks/`, `.claude-plugin/`) at the source's top level. Pre-migration the symlink target had this layout. Post-migration the monorepo root has `claude/`, `codex/`, `docs/` subdirs instead — the Claude-plugin layout now lives one level deeper at `Consilium/claude/`. Retarget the symlink so `./consilium` from the marketplace resolves to the right place.

```bash
rm /Users/milovan/projects/consilium-marketplace/consilium
ln -s /Users/milovan/projects/Consilium/claude /Users/milovan/projects/consilium-marketplace/consilium
readlink /Users/milovan/projects/consilium-marketplace/consilium
ls /Users/milovan/projects/consilium-marketplace/consilium/ | head
```

Expected: `readlink` outputs `/Users/milovan/projects/Consilium/claude`. `ls` shows `agents/`, `skills/`, `commands/`, `hooks/`, `.claude-plugin/`, `scripts/` — the Claude plugin layout.

- [ ] **Step 9: Update `~/.claude/settings.json` marketplace path**

`/Users/milovan/.claude/settings.json` line 206 registers the `consilium-local` marketplace with `"path": "/Users/milovan/projects/Consilium"`. Post-swap, that path resolves to the monorepo root which doesn't have `.claude-plugin/marketplace.json` (the marketplace declaration lives at `claude/.claude-plugin/marketplace.json`). Without this update, the next Claude Code session may fail to register the consilium plugin via marketplace validation.

Edit tool:
- file_path: `/Users/milovan/.claude/settings.json`
- old_string: `    "consilium-local": {
      "source": {
        "source": "directory",
        "path": "/Users/milovan/projects/Consilium"
      }
    }`
- new_string: `    "consilium-local": {
      "source": {
        "source": "directory",
        "path": "/Users/milovan/projects/Consilium/claude"
      }
    }`

Verify with Read tool. Expected: line 206 reads `"path": "/Users/milovan/projects/Consilium/claude"`.

- [ ] **Step 10: Final smoke test — Legatus + soldier subagent verify the live system**

The Legatus runs Phase 0 against the final monorepo location, then dispatches a fresh consilium-soldier subagent to validate end-to-end. The subagent loads as a fresh Claude Code instance and exercises the post-swap state.

```bash
# Phase 0 in the Legatus's environment
CONSILIUM_DOCS=/Users/milovan/projects/Consilium/docs bash -c '
[ -d "$CONSILIUM_DOCS" ] || { echo "FAIL: docs dir missing"; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || { echo "FAIL: marker missing"; exit 1; }
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || { echo "FAIL: migration-in-progress set"; exit 1; }
echo "OK: Phase 0 cleared at final location"
'
```

Then dispatch:

```
Agent tool:
  subagent_type: "consilium-soldier"
  description: "Stage-7 post-swap smoke test"
  mode: "auto"
  prompt: |
    Verify the post-swap monorepo loads correctly. Run these checks and report:
    
    1. Read the first 5 lines of /Users/milovan/projects/Consilium/claude/skills/consul/SKILL.md and verify the file exists and is non-empty.
    2. Read /Users/milovan/projects/Consilium/docs/codex.md line 1 and confirm it contains "Codex" or similar.
    3. Run: rg -c "Consilium/docs" /Users/milovan/projects/Consilium/codex/source/doctrine/common.md
       Expected: 1 (the post-migration fallback path is in place).
    4. Verify the plugin cache symlink: readlink /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
       Expected: /Users/milovan/projects/Consilium/claude
    
    Report each result with PASS or FAIL. If everything passes, return a single SOUND finding stating "post-swap state validated end-to-end."
```

Expected from soldier: all four checks PASS, single SOUND finding returned. If any check FAILs, the Legatus escalates to the Imperator with the failure details and the rollback path from Task 10 (revert mv operations + restore symlink + revert env var).

If the smoke test passes, Stage 7 is complete and the migration is live.

If any step in Task 10 fails after Step 3, the rollback path is:
```bash
mv /Users/milovan/projects/Consilium /Users/milovan/projects/Consilium-broken-monorepo
mv /Users/milovan/projects/Consilium-old /Users/milovan/projects/Consilium
rm /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
ln -s /Users/milovan/projects/Consilium /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0
export CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs  # original location
bash /Users/milovan/projects/Consilium-codex/scripts/install-codex.sh  # re-run from old Codex repo
```

- [ ] **Step 11: Stage 7 commit (the first commit AFTER live use)**

The Imperator's first edits in the new monorepo (e.g., this case file's STATUS update from `draft` to `routed`) should be committed and pushed to GitHub. This establishes the daily-commit rhythm that makes Stage 8 rollback "real" rather than "soft."

```bash
cd /Users/milovan/projects/Consilium
git status --short
# Stage and commit any post-swap edits to STATUS.md, etc.
git add docs/cases/2026-04-25-monorepo-consolidation/STATUS.md
git commit -m "chore: update monorepo migration case status post-swap"
git push origin main
```

---

### Task 11: Confidence period setup and Stage 8 instructions

> **Confidence: Medium** — Stage 8 cleanup is deferred 24–48 hours and is NOT executed as part of this march. This task documents the soft-rollback caveat and arms the Imperator with the steps for when the confidence period elapses.

**Files:** None modified directly. This task produces operational guidance.

- [ ] **Step 1: Update `STATUS.md` to reflect post-swap state**

File: `/Users/milovan/projects/Consilium/docs/cases/2026-04-25-monorepo-consolidation/STATUS.md`

Find:
```
status: draft
```

Replace with:
```
status: routed
```

(`CONVENTIONS.md` defines `contained` as a Tribune Phase 1 case-scan status for bug-recurrence observation. This is an `infra` case, not a bug — `routed` is the correct state for a case that has been moved through the planned workflow and awaits final closure. Per Praetor verification finding.)

Update the `## Current state` section:
```markdown
## Current state

Routed. Swap complete (Stage 7) on 2026-04-25. Monorepo live at `/Users/milovan/projects/Consilium` with `claude/`, `codex/`, `docs/` subdirs. Old layouts at `/Users/milovan/projects/Consilium-old`, `/Users/milovan/projects/Consilium-codex`, `/Users/milovan/projects/consilium-docs` remain on disk for the 24–48h confidence period. Stage 8 cleanup is the Imperator's call once confidence is established.

## What's next

- Daily use validates that `/consul`, `/tribune`, `/legion`, `/checkit`, and Codex agents all behave correctly.
- Commit and push regularly during the confidence period — the monorepo's git history is the real rollback path.
- After 24–48h of confident daily use, the Imperator runs Stage 8 cleanup (Step 2 below). Status transitions to `closed` with `closed_at: <YYYY-MM-DD>`.

## Open questions

(none)
```

- [ ] **Step 2: Document the Stage 8 cleanup commands (deferred, NOT executed in this march)**

When the Imperator decides the confidence period is over, the following commands run:

```bash
# Optional offline backups (recommended)
git -C /Users/milovan/projects/Consilium-old bundle create /tmp/consilium-old.bundle --all 2>/dev/null || echo "(no .git in Consilium-old; skipping bundle)"
git -C /Users/milovan/projects/Consilium-codex bundle create /tmp/consilium-codex.bundle --all 2>/dev/null || echo "(no .git in Consilium-codex; skipping bundle)"
git -C /Users/milovan/projects/consilium-docs bundle create /tmp/consilium-docs.bundle --all 2>/dev/null || echo "(no .git in consilium-docs; skipping bundle)"

# Destructive cleanup
rm -rf /Users/milovan/projects/Consilium-old
rm -rf /Users/milovan/projects/Consilium-codex
rm -rf /Users/milovan/projects/consilium-docs

# Update STATUS to closed
# Edit docs/cases/2026-04-25-monorepo-consolidation/STATUS.md:
#   status: closed
#   closed_at: <YYYY-MM-DD>
```

These commands are provided for the Imperator's reference. They are NOT executed by the legion or Legatus; the Imperator runs them manually after the confidence period.

- [ ] **Step 3: Commit the STATUS update**

```bash
cd /Users/milovan/projects/Consilium
git add docs/cases/2026-04-25-monorepo-consolidation/STATUS.md
git commit -m "chore: mark monorepo consolidation case routed post-swap"
git push origin main
```

The migration is now live and tracked. The Imperator returns to daily work.
