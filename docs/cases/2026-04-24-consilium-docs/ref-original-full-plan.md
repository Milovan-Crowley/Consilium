# Consilium Docs Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:march (strongly recommended for this plan — see execution-mode note at bottom) or consilium:legion to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `~/projects/consilium-docs` as the shared artifact + doctrine repo, migrate all historical Consilium artifacts into case folders, repoint Claude-Consilium agent surfaces to resolve via `$CONSILIUM_DOCS`, excise graphify across every affected surface (Claude-Consilium side), and migrate the case-lifecycle state machine from capital-`Status:` body prose to lowercase `status:` YAML in per-case STATUS.md frontmatter.

**Architecture:** Five atomic stages bracketed by a mechanical forbidden-window marker (`$CONSILIUM_DOCS/.migration-in-progress`). Stage 1 bootstraps the repo. Stage 2 moves doctrine + drops the marker + purges plugin cache. Stages 3–4 migrate historical artifacts and fold debugging-cases README into CONVENTIONS. Stage 5 repoints every Claude-Consilium agent-surface file (5 SKILLs + implementer-prompt + 5 canonical personas + 6 user-scope agents + protocol + 5 templates + 3 top-level docs), strips graphify from all of them, reframes the staleness script, migrates state-machine writes from body prose to STATUS.md YAML, bootstraps the Codex-adoption tracker case, and removes the marker as its final pre-commit step. Every SKILL gains a Phase 0 resolution block with three-layer defense (dir-exists + CONVENTIONS-marker-grep + migration-marker absence).

**Tech Stack:** Bash (lifecycle scripts + Phase 0 snippets), Python 3 (staleness-script reframe), Markdown edits across SKILLs + personas + verification templates. Two repos: `~/projects/Consilium` (source) and `~/projects/consilium-docs` (new). Plugin cache at `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/` (full-tree rsync in Stage 5 restores every Consilium skill, not just the migration-edited SKILLs). User-scope agents at `~/.claude/agents/consilium-*.md` (6 files; drift-script syncs 5 Codex sections, but frontmatter + mcpServers + Operational Notes are handled by Task 23.5's surgical edits).

---

## Critical Constraints

> **READ BEFORE EXECUTING. Violating these creates silent corruption.**

1. **State machine values are verbatim Medicus 7 + `referenced`.** Allowed states: `draft | rejected | approved | routed | contained | closed | referenced | abandoned`. Do NOT rename to `in-progress` / `shipped`. Legion + March + Tribune SKILLs today write these as body prose with capital `Status: <value>`; post-migration they write lowercase YAML `status: <value>` inside `$CONSILIUM_DOCS/cases/<slug>/STATUS.md` frontmatter. The state **strings** (`routed`, `closed`, `contained`, etc.) are verbatim — only storage location and field-label casing change. STATUS.md frontmatter also uses `closed_at` (not `shipped_at`). Task 20 (tribune) Step 5.5 and Task 21 (legion + march) Step 4.5 carry the storage migration.

2. **Forbidden window marker enforcement.** Stage 2 drops `$CONSILIUM_DOCS/.migration-in-progress`. Every SKILL's Phase 0 resolution block MUST check this marker and halt. Stage 5 removes the marker as its last pre-commit step. Inside the forbidden window (Stages 2-5), do NOT invoke Consul/Medicus/Edicts/Legion/March from a new session.

3. **Phase 0 resolution block is the canonical three-layer check.** Every Consilium SKILL Phase 0 runs this exact snippet:

   ```bash
   CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
   [ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
   [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
     echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
     exit 1
   }
   [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
     echo "consilium-docs migration in progress — halt."
     exit 1
   }
   ```

   Plus SKILL prose: *"if this Bash call returns non-zero, halt the session and do not proceed."* `exit 1` in bash does not halt Claude — the SKILL body's halt discipline does.

4. **No `cd` into `$CONSILIUM_DOCS`.** Phase 0 resolves the variable but does NOT change cwd. Target-repo CLAUDE.md must still load; scouts must read app code with natural relative paths.

5. **Stage 3 ordering: mv first, rm last.** Within Stage 3, all file moves (history-preserving `git mv` where possible, plain `mv` + `git add` when cross-repo) execute BEFORE any `rm -rf` of legacy directories. Single atomic commit. If crash mid-stage: `git reset --hard` restores pre-Stage-3 state.

6. **Claude-Consilium only.** Codex-Consilium side is Imperator's separate work. Stage 5 bootstraps a tracker case (`codex-consilium-docs-adoption`) so the gap is visible in INDEX.md until Imperator ships the Codex-side work.

---

## Dependencies and Sequencing

| Stage | Depends on | Commits | Parallelism within stage |
|-|-|-|-|
| Stage 1 (T1-T5) | None | 1 | Serial (scripts depend on dir structure) |
| Stage 2 (T6-T9) | Stage 1 | 2 (consilium-docs + Consilium) | Serial |
| Stage 3 (T10-T15) | Stage 2 | 1 atomic | Serial (mv operations before rm) |
| Stage 4 (T16-T17) | Stage 3 | 1 | Serial |
| Stage 5 (T18-T31) | Stage 4 | 1 atomic | Serial (cross-refs require earlier edits landed) |

---

## Stage 1 — Repo skeleton

### Task 1: Create directory structure + git init

> **Confidence: High** — straightforward filesystem + git operations.

**Files:**
- Create: `~/projects/consilium-docs/` (+ subdirs)

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p ~/projects/consilium-docs/{cases,doctrine,archive,scripts}
```

- [ ] **Step 2: Initialize git**

```bash
cd ~/projects/consilium-docs && git init
```

Expected: *"Initialized empty Git repository in /Users/milovan/projects/consilium-docs/.git/"*

- [ ] **Step 3: Verify structure**

```bash
ls -la ~/projects/consilium-docs/
```

Expected:
```
.git/
archive/
cases/
doctrine/
scripts/
```

---

### Task 2: Write INDEX.md + CONVENTIONS.md stub + README.md

> **Confidence: High** — stub content defined verbatim in spec § Stage 1.

**Files:**
- Create: `~/projects/consilium-docs/INDEX.md`
- Create: `~/projects/consilium-docs/CONVENTIONS.md`
- Create: `~/projects/consilium-docs/README.md`

- [ ] **Step 1: Write CONVENTIONS.md stub** (the identity marker — line 1 is load-bearing)

```bash
cat > ~/projects/consilium-docs/CONVENTIONS.md <<'EOF'
<!-- consilium-docs CONVENTIONS — do not remove this marker line -->
# Consilium Docs — Conventions

This file is the identity marker for `$CONSILIUM_DOCS` resolution AND the authoritative rule doc for case-folder conventions, STATUS.md schema, state machine, and collision rules.

Stage 1 stub. Complete content folds in at Stage 4 from the legacy debugging-cases README.

## Case folder conventions (Stage 1 stub)

- One case per folder under `cases/`.
- Folder name: `YYYY-MM-DD-<slug>` (first-session date).
- Session 1: `spec.md` + `plan.md` (unprefixed).
- Session N ≥ 2: `session-NN-<topic>-spec.md` + `session-NN-<topic>-plan.md`.
- Reference docs: `ref-<topic>.md`.
- Handoffs: `handoff-NN-to-MM.md`.
- Status tracking: `STATUS.md` (YAML frontmatter).
- Retro: `retro.md` (mandatory for features, optional-prompt for bugs).

## State machine (Stage 1 stub — 8 states, verbatim Medicus 7 + `referenced`)

Allowed `status:` values in STATUS.md:

- `draft` — scope shaping; spec not yet approved
- `rejected` — (bug) Medicus diagnosis declined by Imperator
- `approved` — spec/diagnosis approved; plan written or awaiting execution
- `routed` — execution picked up by Legion/March; work underway (string Legion+March write today)
- `contained` — (bug) fix shipped as containment; root cause pending (Phase 1 scan target)
- `closed` — all planned work complete + retro written (string Legion+March write at case-close today)
- `referenced` — closed but still actively linked by open cases (manual transition)
- `abandoned` — killed pre-close (7-day draft timeout or Imperator declaration)

(Full state machine rules, collision disambiguation, Phase 1 scan semantics, promotion triggers, and case-file template fold in at Stage 4 from the legacy debugging-cases README.)
EOF
```

- [ ] **Step 2: Write INDEX.md**

```bash
cat > ~/projects/consilium-docs/INDEX.md <<'EOF'
# Consilium Docs Index

Shared artifact + doctrine repo for Claude-Consilium and Codex-Consilium agents.

## Active work

Scan `cases/*/STATUS.md` for `status: draft | approved | routed` to surface here.

## Recently closed

Scan `cases/*/STATUS.md` for `status: closed` with `closed_at` within last 7 days.

## Doctrine

See `doctrine/` for shared known-gaps, lane guides, diagnosis packet, fix thresholds, voice + brand principles.

## Conventions

See `CONVENTIONS.md` for file-naming, STATUS.md schema, and case-lifecycle state machine rules.

## Banners

(Stage 5 inserts the Codex-adoption-pending banner here via `<!-- banner:codex-adoption-pending -->` comment markers; removed when that case ships.)
EOF
```

- [ ] **Step 3: Write README.md**

```bash
cat > ~/projects/consilium-docs/README.md <<'EOF'
# consilium-docs

Shared home for Consilium artifacts (specs, plans, debugging cases, hand-offs, retros) and doctrine (known-gaps, lane guides, packet template, voice + brand principles) across Claude-Consilium and Codex-Consilium forks.

Resolved by both agents via the `$CONSILIUM_DOCS` environment variable, fallback `~/projects/consilium-docs`.

Local-only git repo. No GitHub remote.

See:

- `INDEX.md` for navigation
- `CONVENTIONS.md` for file-naming + state machine rules
- `doctrine/` for shared doctrine
- `cases/` for case folders (features, bugs, infra)
- `archive/` for aged closed cases (manual move; no auto-archive)
- `scripts/` for lifecycle scripts (`case-new`, `case-session`, `case-close`)

## Identity marker

`CONVENTIONS.md` line 1 carries `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->`. SKILL Phase 0 resolution blocks grep for this marker to defend against stale env vars pointing at sibling directories.
EOF
```

- [ ] **Step 4: Write .gitignore** (keeps `.migration-in-progress` marker from being tracked across Stage 3/Stage 5 `git add -A` invocations)

```bash
cat > ~/projects/consilium-docs/.gitignore <<'EOF'
# Transient forbidden-window marker — present only during migration sessions
.migration-in-progress
EOF
```

- [ ] **Step 5: Verify marker line survives**

```bash
head -1 ~/projects/consilium-docs/CONVENTIONS.md
```

Expected: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->`

```bash
head -1 ~/projects/consilium-docs/CONVENTIONS.md | grep -q "consilium-docs CONVENTIONS" && echo "marker OK" || echo "marker MISSING"
```

Expected: `marker OK`

---

### Task 3: Write `case-new` script (collision-disambiguation included)

> **Confidence: High** — collision rule matches Medicus's existing debugging-cases pattern. Script is straightforward Bash.

**Files:**
- Create: `~/projects/consilium-docs/scripts/case-new`

- [ ] **Step 1: Write the script**

```bash
cat > ~/projects/consilium-docs/scripts/case-new <<'SCRIPT'
#!/usr/bin/env bash
# Create a new case folder with STATUS.md + spec.md stub.
# Usage: case-new <slug> --target <target> [--agent <agent>]
#
# --target is MANDATORY. The script fails fast rather than prompting interactively
# because agent sessions (Claude-Consilium, Codex-Consilium) have no interactive
# stdin — a bash `read` would hang. Human callers in a terminal must also pass
# --target; the inconvenience is small and the fail-fast behavior is predictable.
set -eu

if [[ $# -lt 1 ]]; then
  echo "Usage: case-new <slug> --target <divinipress-store|divinipress-backend|consilium|cross-repo> [--agent <claude|codex|both>]" >&2
  exit 2
fi

slug="$1"
shift

target=""
agent="claude"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) target="$2"; shift 2;;
    --agent) agent="$2"; shift 2;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac
done

if [[ -z "$target" ]]; then
  echo "error: --target is required (one of: divinipress-store, divinipress-backend, consilium, cross-repo)" >&2
  exit 2
fi

case "$target" in
  divinipress-store|divinipress-backend|consilium|cross-repo) ;;
  *) echo "error: --target must be one of: divinipress-store, divinipress-backend, consilium, cross-repo (got: $target)" >&2; exit 2;;
esac

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
[[ -d "$CONSILIUM_DOCS" ]] || { echo "consilium-docs not found at $CONSILIUM_DOCS" >&2; exit 1; }

today=$(date +%Y-%m-%d)
cases_dir="$CONSILIUM_DOCS/cases"
mkdir -p "$cases_dir"

# Collision-disambiguation: exact match with optional numeric suffix
base_name="${today}-${slug}"
final_slug="$base_name"
n=2
while [[ -d "$cases_dir/$final_slug" ]]; do
  final_slug="${base_name}-${n}"
  ((n++))
done

case_path="$cases_dir/$final_slug"
mkdir -p "$case_path"

cat >"$case_path/STATUS.md" <<EOF
---
status: draft
opened: $today
target: $target
agent: $agent
sessions: 1
current_session: 1
---

## Current state

(Scope shaping. Consul drafting spec.)

## What's next

- [ ] Imperator approves spec
- [ ] Consul writes plan

## Open questions

(none yet)
EOF

cat >"$case_path/spec.md" <<EOF
# $final_slug — Spec

(Draft. Consul writes design here after deliberation.)
EOF

echo "$case_path"
SCRIPT
chmod +x ~/projects/consilium-docs/scripts/case-new
```

- [ ] **Step 2: Smoke test the script**

```bash
CONSILIUM_DOCS=~/projects/consilium-docs ~/projects/consilium-docs/scripts/case-new smoke-test --target consilium --agent claude
```

Expected: prints path like `/Users/milovan/projects/consilium-docs/cases/2026-04-24-smoke-test`. Verify the folder exists with STATUS.md + spec.md.

- [ ] **Step 3: Test collision-disambiguation**

```bash
CONSILIUM_DOCS=~/projects/consilium-docs ~/projects/consilium-docs/scripts/case-new smoke-test --target consilium --agent claude
```

Expected: prints path ending in `-2` (e.g., `2026-04-24-smoke-test-2`). Different folder, both exist.

- [ ] **Step 4: Clean up smoke tests**

```bash
rm -rf ~/projects/consilium-docs/cases/2026-04-24-smoke-test ~/projects/consilium-docs/cases/2026-04-24-smoke-test-2
```

---

### Task 4: Write `case-session` script (session-1-convention handling)

> **Confidence: High** — session-1-detection logic specified in spec § Session numbering.

**Files:**
- Create: `~/projects/consilium-docs/scripts/case-session`

- [ ] **Step 1: Write the script**

```bash
cat > ~/projects/consilium-docs/scripts/case-session <<'SCRIPT'
#!/usr/bin/env bash
# Add a new session spec stub to an existing case folder.
# Usage: case-session <slug> <topic>
#
# Session-1-convention: if case has spec.md/plan.md but no session-NN-*.md files,
# the next session number is 02 (spec.md/plan.md = implicit session 1).
set -eu

if [[ $# -lt 2 ]]; then
  echo "Usage: case-session <slug> <topic>" >&2
  exit 2
fi

slug="$1"
topic="$2"

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
case_path="$CONSILIUM_DOCS/cases/$slug"
[[ -d "$case_path" ]] || { echo "case not found: $case_path" >&2; exit 1; }

max_n=0
shopt -s nullglob
for f in "$case_path"/session-[0-9][0-9]-*.md; do
  fname=$(basename "$f")
  n="${fname:8:2}"
  n=$((10#$n))
  if (( n > max_n )); then
    max_n=$n
  fi
done

if (( max_n == 0 )); then
  if [[ -f "$case_path/spec.md" ]] || [[ -f "$case_path/plan.md" ]]; then
    next_n=2
  else
    next_n=1
  fi
else
  next_n=$((max_n + 1))
fi

printf -v padded_n "%02d" "$next_n"
session_spec="$case_path/session-${padded_n}-${topic}-spec.md"

if [[ -e "$session_spec" ]]; then
  echo "file already exists: $session_spec" >&2
  exit 1
fi

cat >"$session_spec" <<EOF
# $slug — Session $padded_n: $topic

(Consul drafts session-scoped spec here. References master at spec.md.)
EOF

status="$case_path/STATUS.md"
if [[ -f "$status" ]]; then
  tmp=$(mktemp)
  awk -v next_n="$next_n" '
    BEGIN { in_fm=0 }
    /^---$/ { in_fm = !in_fm; print; next }
    in_fm && /^sessions:/ { print "sessions: " next_n; next }
    in_fm && /^current_session:/ { print "current_session: " next_n; next }
    { print }
  ' "$status" > "$tmp"
  mv "$tmp" "$status"
fi

echo "$session_spec"
SCRIPT
chmod +x ~/projects/consilium-docs/scripts/case-session
```

- [ ] **Step 2: Smoke test — new session on a case that only has spec.md/plan.md**

```bash
# Create a test case
CONSILIUM_DOCS=~/projects/consilium-docs ~/projects/consilium-docs/scripts/case-new session-test --target consilium --agent claude
# Add a plan.md (to simulate post-Stage-1 state)
touch ~/projects/consilium-docs/cases/2026-04-24-session-test/plan.md
# Add session-02
CONSILIUM_DOCS=~/projects/consilium-docs ~/projects/consilium-docs/scripts/case-session 2026-04-24-session-test backend-adapter
```

Expected: prints path ending in `session-02-backend-adapter-spec.md`. The script correctly skipped session-01 because spec.md/plan.md were present.

- [ ] **Step 3: Smoke test — another session**

```bash
CONSILIUM_DOCS=~/projects/consilium-docs ~/projects/consilium-docs/scripts/case-session 2026-04-24-session-test frontend-render
```

Expected: prints path ending in `session-03-frontend-render-spec.md`.

- [ ] **Step 4: Verify STATUS.md updated**

```bash
head -20 ~/projects/consilium-docs/cases/2026-04-24-session-test/STATUS.md
```

Expected: `sessions: 3` + `current_session: 3` in frontmatter.

- [ ] **Step 5: Clean up smoke test**

```bash
rm -rf ~/projects/consilium-docs/cases/2026-04-24-session-test
```

---

### Task 5: Write `case-close` script (differentiated retro discipline) + commit Stage 1

> **Confidence: High** — differentiated retro rules specified in spec § Lifecycle Scripts.

**Files:**
- Create: `~/projects/consilium-docs/scripts/case-close`

- [ ] **Step 1: Write the script**

```bash
cat > ~/projects/consilium-docs/scripts/case-close <<'SCRIPT'
#!/usr/bin/env bash
# Close a case — set status=closed + closed_at=today. Retro discipline
# differentiated: mandatory for features (has spec.md), prompt-then-skippable
# for bugs (has diagnosis.md, no spec.md).
# Usage: case-close <slug> [--skip-retro]
#
# --skip-retro skips the retro requirement on BUG cases only (cases with
# diagnosis.md but no spec.md). Feature cases always require retro.md.
# The script fails fast with an error instead of prompting interactively
# because agent sessions have no interactive stdin.
set -eu

if [[ $# -lt 1 ]]; then
  echo "Usage: case-close <slug> [--skip-retro]" >&2
  exit 2
fi

slug="$1"
shift

skip_retro=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-retro) skip_retro=1; shift;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac
done

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
case_path="$CONSILIUM_DOCS/cases/$slug"
[[ -d "$case_path" ]] || { echo "case not found: $case_path" >&2; exit 1; }

is_feature=0
is_bug=0
if [[ -f "$case_path/spec.md" ]]; then
  is_feature=1
elif [[ -f "$case_path/diagnosis.md" ]]; then
  is_bug=1
else
  echo "case has neither spec.md nor diagnosis.md — cannot classify for retro rule" >&2
  exit 1
fi

retro="$case_path/retro.md"

if (( is_feature )); then
  if [[ ! -f "$retro" ]]; then
    cat >"$retro" <<EOF
# $slug — Retrospective

## What we built

(fill)

## What we learned

(fill)

## What would we do differently

(fill)

## Patterns to promote

(fill)
EOF
    echo "retro.md template written at $retro. Fill it in, then re-run case-close. (Feature cases require retro — --skip-retro is bug-only.)" >&2
    exit 1
  fi
elif (( is_bug )); then
  if [[ ! -f "$retro" && $skip_retro -eq 0 ]]; then
    cat >"$retro" <<EOF
# $slug — Retrospective

## Should this become a known-gap doctrine entry?

(yes/no + reasoning)

## Root cause summary

(one paragraph)
EOF
    echo "retro.md template written at $retro. Either (a) fill it in and re-run case-close, or (b) re-invoke case-close $slug --skip-retro to close without a retro." >&2
    exit 1
  fi
fi

today=$(date +%Y-%m-%d)
status="$case_path/STATUS.md"
if [[ ! -f "$status" ]]; then
  echo "STATUS.md not found at $status" >&2
  exit 1
fi

tmp=$(mktemp)
awk -v today="$today" '
  BEGIN { in_fm=0; saw_closed_at=0 }
  /^---$/ {
    if (in_fm && !saw_closed_at) {
      print "closed_at: " today
    }
    in_fm = !in_fm
    print
    next
  }
  in_fm && /^status:/ { print "status: closed"; next }
  in_fm && /^closed_at:/ { print "closed_at: " today; saw_closed_at=1; next }
  { print }
' "$status" > "$tmp"
mv "$tmp" "$status"

echo "Case closed: $slug (status=closed, closed_at=$today)"
SCRIPT
chmod +x ~/projects/consilium-docs/scripts/case-close
```

- [ ] **Step 2: Verify all three scripts are executable**

```bash
ls -l ~/projects/consilium-docs/scripts/
```

Expected: all three (`case-new`, `case-session`, `case-close`) have `-rwxr-xr-x` permissions.

- [ ] **Step 3: First commit in consilium-docs**

```bash
cd ~/projects/consilium-docs
git add -A
git commit -m "initial skeleton: structure + stubs + lifecycle scripts"
```

Expected: commit succeeds with INDEX.md, CONVENTIONS.md, README.md, three scripts, empty dirs preserved via git's default empty-dir handling (may need `.gitkeep` files — add if dirs aren't tracked).

- [ ] **Step 4: Verify empty dirs tracked**

```bash
git ls-tree --name-only HEAD
```

Expected: INDEX.md, CONVENTIONS.md, README.md, scripts/case-new, scripts/case-session, scripts/case-close. If `cases/`, `doctrine/`, `archive/` are missing from tracked paths, add `.gitkeep`:

```bash
touch ~/projects/consilium-docs/cases/.gitkeep ~/projects/consilium-docs/doctrine/.gitkeep ~/projects/consilium-docs/archive/.gitkeep
cd ~/projects/consilium-docs
git add -A
git commit --amend --no-edit
```

---

## Stage 2 — Migrate doctrine + drop marker + purge plugin cache

> **FORBIDDEN WINDOW OPENS HERE.** Marker file is dropped in Task 7. From Task 7 until Task 31 (Stage 5 final commit), NO Consul/Medicus/Edicts/Legion/March invocation from a new session. The migrating Legatus session already has the plan in context and does not need Phase 0 re-check mid-migration.

### Task 6: Copy doctrine files into consilium-docs/doctrine/

> **Confidence: High** — source paths verified during recon.

**Files:**
- Create: `~/projects/consilium-docs/doctrine/` (populated)

- [ ] **Step 1: Copy `skills/references/domain/*` into `doctrine/domain/`**

```bash
mkdir -p ~/projects/consilium-docs/doctrine/domain
cp -r ~/projects/Consilium/skills/references/domain/. ~/projects/consilium-docs/doctrine/domain/
```

- [ ] **Step 2: Promote `known-gaps.md` out of `domain/` (top-level doctrine)**

```bash
mv ~/projects/consilium-docs/doctrine/domain/known-gaps.md ~/projects/consilium-docs/doctrine/known-gaps.md
```

- [ ] **Step 3: Copy tribune references + lane-guides into `doctrine/`**

```bash
cp ~/projects/Consilium/skills/tribune/references/*.md ~/projects/consilium-docs/doctrine/
cp -r ~/projects/Consilium/skills/tribune/references/lane-guides ~/projects/consilium-docs/doctrine/
```

- [ ] **Step 4: Copy voice/brand from graphify-source**

```bash
cp ~/projects/Consilium/graphify-source/voice-principles.md ~/projects/consilium-docs/doctrine/
cp ~/projects/Consilium/graphify-source/brand-identity.md ~/projects/consilium-docs/doctrine/
```

- [ ] **Step 5: Verify doctrine tree structure**

```bash
find ~/projects/consilium-docs/doctrine -type f -name "*.md" | sort
```

Expected output includes: `known-gaps.md`, `lane-classification.md`, `diagnosis-packet.md`, `fix-thresholds.md`, `known-gaps-protocol.md`, `voice-principles.md`, `brand-identity.md`, `domain/MANIFEST.md`, `domain/<topic files>`, `lane-guides/<5 guide files>`.

- [ ] **Step 6: Commit in consilium-docs**

```bash
cd ~/projects/consilium-docs
git add -A
git commit -m "doctrine migration: import from Consilium/skills/references/domain + tribune/references + graphify-source voice/brand"
```

---

### Task 7: Drop migration-in-progress marker (forbidden window opens)

> **Confidence: High** — single-file create.

**Files:**
- Create: `~/projects/consilium-docs/.migration-in-progress`

- [ ] **Step 1: Drop the marker**

```bash
touch ~/projects/consilium-docs/.migration-in-progress
```

- [ ] **Step 2: Verify**

```bash
ls -la ~/projects/consilium-docs/.migration-in-progress
```

Expected: file exists.

- [ ] **Step 3: Verify marker is ignored by git** — the `.gitignore` written in Task 2 Step 4 lists `.migration-in-progress` so `git status` does not surface it and subsequent `git add -A` invocations (Stage 3 Task 15, Stage 5 Task 31) do not stage it.

```bash
cd ~/projects/consilium-docs && git status --short
```

Expected: `.migration-in-progress` does NOT appear in the output. If it does, the `.gitignore` is missing or malformed — halt and fix Task 2's `.gitignore` before proceeding.

The marker is deliberately ephemeral: present during the forbidden window, absent before Stage 1 and after Stage 5. The `.gitignore` rule keeps it from ever entering git history.

---

### Task 8: Full plugin cache purge

> **Confidence: High** — single-subtree nuke.

**Files:**
- Delete: `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/`

- [ ] **Step 1: Purge cache**

```bash
rm -rf ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
```

- [ ] **Step 2: Verify absence**

```bash
ls ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/
```

Expected: `skills/` subdirectory is gone. Other cache content (e.g., plugin.json manifest) may remain — that's fine.

Stage 5 will re-populate the cache as it edits each SKILL.

---

### Task 9: Remove migrated doctrine from Consilium + commit

> **Confidence: High** — mirrors the copy operations in Task 6.

**Files:**
- Delete: `~/projects/Consilium/skills/references/domain/`
- Delete: `~/projects/Consilium/skills/tribune/references/`

- [ ] **Step 1: Delete migrated doctrine source dirs**

```bash
rm -rf ~/projects/Consilium/skills/references/domain
rm -rf ~/projects/Consilium/skills/tribune/references
```

- [ ] **Step 2: Verify absence**

```bash
ls ~/projects/Consilium/skills/references/ ~/projects/Consilium/skills/tribune/
```

Expected: `skills/references/` contains `personas/` + `verification/` but NO `domain/`. `skills/tribune/` contains `SKILL.md` + `find-polluter.sh` but NO `references/`.

- [ ] **Step 3: Commit in Consilium**

```bash
cd ~/projects/Consilium
git add -A
git commit -m "remove migrated doctrine — now lives at consilium-docs/doctrine/"
```

---

## Stage 3 — Migrate historical artifacts into case folders

> **Within forbidden window.** All `mv` operations (history-preserving where intra-repo, plain move + git add when cross-repo) run first. Destructive `rm -rf` ops run LAST just before the single atomic commit. If crash mid-stage, `git reset --hard` in both repos restores pre-Stage-3 state.

### Task 10: Self-migration — this spec + its plan + abandoned tribune-resolution edict

> **Confidence: High** — self-reference mechanics specified in spec § Stage 3.
>
> **Ordering rationale:** move plan.md FIRST so that if the current Legatus session is compacted and has to re-read its instructions from disk, it finds them at the new path. The Legatus's in-memory copy of the plan is the primary instruction source during execution; moving the file mid-session does not interrupt the running plan. The disk copy matters as the recovery path, not as the live-read path.

**Files:**
- Create: `~/projects/consilium-docs/cases/2026-04-24-consilium-docs/`
- Move: this plan → `cases/2026-04-24-consilium-docs/plan.md`
- Move: spec v3 → `cases/2026-04-24-consilium-docs/spec.md`
- Move: abandoned edict → `cases/2026-04-24-consilium-docs/ref-tribune-resolution-plan.md`

- [ ] **Step 1: Create the case folder + inventory 2026-04-24 siblings**

```bash
mkdir -p ~/projects/consilium-docs/cases/2026-04-24-consilium-docs
```

Inventory check (catches any orphaned 2026-04-24 artifact the plan does not explicitly name — if this returns more than the 3 files this task moves, halt and surface to Imperator):

```bash
ls ~/projects/Consilium/docs/consilium/specs/2026-04-24-*.md 2>/dev/null
ls ~/projects/Consilium/docs/consilium/plans/2026-04-24-*.md 2>/dev/null
```

Expected total: exactly 3 files —
- `specs/2026-04-24-consilium-docs-repo.md`
- `plans/2026-04-24-consilium-docs-repo.md`
- `plans/2026-04-24-tribune-consilium-repo-resolution.md`

If any additional 2026-04-24 file exists, it is an orphaned artifact this plan has not accounted for. Halt and surface to Imperator before proceeding.

- [ ] **Step 2: Move plan.md FIRST (preserves on-disk recovery path for the Legatus instructions)**

```bash
mv ~/projects/Consilium/docs/consilium/plans/2026-04-24-consilium-docs-repo.md \
   ~/projects/consilium-docs/cases/2026-04-24-consilium-docs/plan.md
```

- [ ] **Step 3: Move spec.md**

```bash
mv ~/projects/Consilium/docs/consilium/specs/2026-04-24-consilium-docs-repo.md \
   ~/projects/consilium-docs/cases/2026-04-24-consilium-docs/spec.md
```

- [ ] **Step 4: Move abandoned tribune-resolution plan as ref-**

```bash
mv ~/projects/Consilium/docs/consilium/plans/2026-04-24-tribune-consilium-repo-resolution.md \
   ~/projects/consilium-docs/cases/2026-04-24-consilium-docs/ref-tribune-resolution-plan.md
```

- [ ] **Step 5: Write STATUS.md for this case**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-24-consilium-docs/STATUS.md <<'EOF'
---
status: routed
opened: 2026-04-24
target: consilium
agent: claude
sessions: 2
current_session: 2
---

## Current state

Session 1 (tribune-consilium-repo-resolution) abandoned after round-1 verification surfaced scope gap (consul + edicts had same failure mode as tribune). Session 2 expanded scope to consilium-docs repo design. Spec v3 in execution; Stage 5 closes this case.

## What's next

- Complete Stages 3–5 of migration
- Final retro on case-close (feature, retro mandatory)

## Open questions

- `referenced` state auto-detection is a future follow-up case.
EOF
```

---

### Task 11: Migrate tribune-reshape case

> **Confidence: High** — spec + execution plan pair from the just-shipped tribune reshape campaign.

**Files:**
- Create: `~/projects/consilium-docs/cases/2026-04-23-tribune-reshape/`

- [ ] **Step 1: Create case folder**

```bash
mkdir -p ~/projects/consilium-docs/cases/2026-04-23-tribune-reshape
```

- [ ] **Step 2: Move spec + plan**

```bash
mv ~/projects/Consilium/docs/consilium/specs/2026-04-23-tribune-reshape-and-medusa-rig.md \
   ~/projects/consilium-docs/cases/2026-04-23-tribune-reshape/spec.md

mv ~/projects/Consilium/docs/consilium/plans/2026-04-23-tribune-reshape-and-medusa-rig-execution.md \
   ~/projects/consilium-docs/cases/2026-04-23-tribune-reshape/plan.md
```

- [ ] **Step 3: Write STATUS.md (closed, pre-mandatory-retro era)**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-23-tribune-reshape/STATUS.md <<'EOF'
---
status: closed
opened: 2026-04-23
closed_at: 2026-04-24
target: consilium
agent: claude
sessions: 1
current_session: 1
---

## Current state

Shipped 2026-04-24 after 37 commits / 39 tasks. Executed as a single logical session that required 5 Legatus march-sessions (compaction/recovery reasons) — the `sessions: 1` frontmatter reflects the single spec/plan pair, not the number of march-runs. Added Medicus persona, 14-field diagnosis packet, 6-lane taxonomy, debugging-cases pipeline, Tribunus stance-collapse, known-gaps doctrine, Medusa Rig companion-skill wiring. T38 acceptance test skipped per Imperator.

## What's next

(Case shipped. No open work.)

## Open questions

(None.)
EOF
```

- [ ] **Step 4: Write synthesized retro.md (case shipped before mandatory-retro rule)**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-23-tribune-reshape/retro.md <<'EOF'
# tribune-reshape — Retrospective

(Synthesized retro — case closed before the mandatory-retro rule landed in consilium-docs CONVENTIONS.)

## What we built

Tribune Reshape + Medusa Rig (single spec+plan pair; execution required 5 march-sessions owing to compaction/recovery, not 5 logical sessions). Medicus persona (Gaius Salvius Medicus) introduced. 14-field diagnosis packet. Six-lane taxonomy (storefront / storefront-super-admin / admin-dashboard / medusa-backend / cross-repo / unknown). Case-file state machine (draft/rejected/approved/routed/contained/closed/abandoned). Tribunus two-stance collapse (patrol + diagnosis). Known-gaps doctrine ported from Codex fork with live recheck. Medusa Rig companion skills wired into main-session skills + 5 user-scope agents.

## What we learned

Two-layer verification (Consul/Legatus self-review + Censor/Provocator/Praetor independent dispatch) caught three MISUNDERSTANDINGs across the campaign that would have shipped without the ceremony. The Rig fallback pattern (`Rig: DEGRADED (...)`) preserves discipline when skills aren't available.

## What would we do differently

Smoke-test scripts during spec authorship rather than waiting for Legatus execution.

## Patterns to promote

Case-file state machine generalizes beyond bugs — inspired the consilium-docs case-as-universal-unit architecture in the immediately-following case.
EOF
```

---

### Task 12: Migrate foundation cluster (2026-04-09 cluster) + ROADMAP + consul-improvements

> **Confidence: Medium** — 9 spec/plan pairs + ROADMAP + 1 ideation file. Large multi-session case representing the Consilium foundation work.

**Files:**
- Create: `~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/`

- [ ] **Step 1: Create case folder**

```bash
mkdir -p ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation
```

- [ ] **Step 2: Move all 2026-04-09 specs and plans** (absolute-path globs — do NOT rely on `cd` persistence between separate bash invocations)

```bash
for f in ~/projects/Consilium/docs/consilium/specs/2026-04-09-*.md; do
  mv "$f" ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/
done

for f in ~/projects/Consilium/docs/consilium/plans/2026-04-09-*.md; do
  mv "$f" ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/
done
```

Verify counts (every 2026-04-09 file must be gone from old locations):

```bash
[ $(ls ~/projects/Consilium/docs/consilium/specs/2026-04-09-*.md 2>/dev/null | wc -l) -eq 0 ] || { echo "leftover 2026-04-09 specs"; exit 1; }
[ $(ls ~/projects/Consilium/docs/consilium/plans/2026-04-09-*.md 2>/dev/null | wc -l) -eq 0 ] || { echo "leftover 2026-04-09 plans"; exit 1; }
ls ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/ | wc -l
```

Expected: both `ls` checks return zero counts. The final count is at least 20 (11 specs + 9 plans; two specs — `consul-skill-rewrite-design.md` and `learning-loop-design.md` — have no matching plan).

- [ ] **Step 3: Move ROADMAP as ref-roadmap.md**

```bash
mv ~/projects/Consilium/docs/consilium/ROADMAP.md \
   ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/ref-roadmap.md
```

- [ ] **Step 4: Move consul-improvements.md as its own draft case (date: git-created 2026-04-09)**

```bash
mkdir -p ~/projects/consilium-docs/cases/2026-04-09-consul-improvements
mv ~/projects/Consilium/docs/ideas/consul-improvements.md \
   ~/projects/consilium-docs/cases/2026-04-09-consul-improvements/spec.md

cat > ~/projects/consilium-docs/cases/2026-04-09-consul-improvements/STATUS.md <<'EOF'
---
status: draft
opened: 2026-04-09
target: consilium
agent: claude
sessions: 1
current_session: 1
---

## Current state

Ideation-stage draft migrated from docs/ideas/. No active work; kept for future reference.

## What's next

(Awaiting Imperator attention; if no progress in 7 days post-migration, Phase 1 scan auto-abandons.)

## Open questions

(inherited from original ideation file)
EOF
```

- [ ] **Step 5: Write STATUS.md for the foundation case**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/STATUS.md <<'EOF'
---
status: closed
opened: 2026-04-09
closed_at: 2026-04-10
target: consilium
agent: claude
sessions: 11
current_session: 11
---

## Current state

The foundation work that built Consilium itself. Nine spec+plan pairs plus two orphan design specs (no matching plan) migrated from 2026-04-09 — total 11 design documents folded into one case. The nine shipped pairs: brainstorming-writing-plans-reshape, domain-bible, graphify-foundation, knowledge-extraction, learning-loop-writeback, roman-personas, skill-migration, subagent-driven-dev-reshape, verification-engine. Two orphan specs with no matching plan (`consul-skill-rewrite-design.md` and `learning-loop-design.md` — the latter was subsumed by `learning-loop-writeback`). All collectively shipped as Consilium v1.

## What's next

(Case closed. Foundation built.)

## Open questions

(None.)
EOF
```

- [ ] **Step 6: Write synthesized retro.md**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-09-consilium-foundation/retro.md <<'EOF'
# consilium-foundation — Retrospective

(Synthesized retro — case closed before mandatory-retro rule.)

## What we built

The Consilium multi-agent system itself. Roman-themed persona hierarchy (Consul / Censor / Praetor / Legatus / Tribunus / Provocator / Medicus / Imperator). Codex with four finding categories (MISUNDERSTANDING / GAP / CONCERN / SOUND). Chain of evidence discipline. Verification engine with parallel Censor+Provocator dispatch. Modular domain bible. Graphify knowledge graph (later excised in the consilium-docs migration after proving unreliable).

## What we learned

Personas as system-prompt-baked identities scale better than conversation-passed persona docs. Independence Rule is load-bearing — verifiers compromised by conversation momentum become rubber stamps.

## Patterns to promote

Two-layer verification (producer self-review + independent verifier dispatch). Auto-feed GAP loop with max 2 iterations before Imperator escalation.
EOF
```

---

### Task 13: Migrate backend-specialization session-1 + graphify-pass-3

> **Confidence: High** — two cases, different statuses.

**Files:**
- Create: `~/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization/`
- Create: `~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/`

- [ ] **Step 1: Create case folders**

```bash
mkdir -p ~/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization
mkdir -p ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3
```

- [ ] **Step 2: Move backend-specialization spec (single artifact, no plan yet)**

```bash
mv ~/projects/Consilium/docs/consilium/specs/2026-04-21-consilium-backend-specialization-session-1.md \
   ~/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization/spec.md
```

- [ ] **Step 3: Write STATUS.md — routed (open case)**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-21-consilium-backend-specialization/STATUS.md <<'EOF'
---
status: routed
opened: 2026-04-21
target: consilium
agent: claude
sessions: 1
current_session: 1
---

## Current state

Session 1 spec drafted. No execution plan written yet. Case open pending further sessions.

## What's next

- Imperator review of session 1 spec
- Session 2 if approved

## Open questions

(Inherited from session 1 spec.)
EOF
```

- [ ] **Step 4: Move graphify-pass-3 spec + plan**

```bash
mv ~/projects/Consilium/docs/consilium/specs/2026-04-10-graphify-corpus-pass-3-migration.md \
   ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/spec.md

mv ~/projects/Consilium/docs/consilium/plans/2026-04-10-graphify-corpus-pass-3-execution.md \
   ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/plan.md
```

- [ ] **Step 5: Move DISCREPANCY_REPORT as ref-**

```bash
mv ~/projects/Consilium/graphify-source/DISCREPANCY_REPORT.md \
   ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/ref-discrepancy-report.md
```

- [ ] **Step 6: Move graphify-corpus-restructure ideation as ref-**

```bash
mv ~/projects/Consilium/docs/ideas/graphify-corpus-restructure.md \
   ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/ref-restructure-ideation.md
```

- [ ] **Step 7: Write STATUS.md for graphify-pass-3 — closed**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/STATUS.md <<'EOF'
---
status: closed
opened: 2026-04-10
closed_at: 2026-04-15
target: consilium
agent: claude
sessions: 1
current_session: 1
---

## Current state

Graphify corpus pass-3 migration shipped 2026-04-15. Moved domain bible from modular topic files + code maps into a graphify-ingestable corpus. DISCREPANCY_REPORT captured the cross-reference audit findings. Consumer of the corpus (graphify MCP) proved unreliable — excised entirely in the consilium-docs migration (2026-04-24).

## What's next

(Case closed. Graphify itself later excised.)

## Open questions

(None.)
EOF
```

- [ ] **Step 8: Synthesize retro.md for graphify-pass-3**

```bash
cat > ~/projects/consilium-docs/cases/2026-04-10-graphify-corpus-pass-3/retro.md <<'EOF'
# graphify-corpus-pass-3 — Retrospective

(Synthesized retro — case closed before mandatory-retro rule.)

## What we built

A graphify-ingestable corpus from the modular domain bible. Cross-reference audit surfaced 27 unverifiable claims across 25 files; 10 files received corrections. Pass-3 produced the final corpus that graphify consumed through April.

## What we learned

The corpus build was sound; the consumer wasn't. Graphify MCP queries never reliably returned the domain knowledge the corpus contained. The Medicus's Rig fallback (file-read if MCP fails) became the primary access path, eventually making graphify redundant.

## Patterns to promote

Cross-reference audit-before-ingest. The DISCREPANCY_REPORT pattern (explicit enumeration of corrections + unverifiables) is reusable for any corpus build.
EOF
```

---

### Task 14: Remaining `docs/consilium/` + `docs/ideas/` cleanup — destructive ops

> **Confidence: High** — all remaining files in these directories have been accounted for by earlier tasks or are explicitly out-of-scope (empty `pass-2/` dir).

**Files:**
- Delete: `~/projects/Consilium/docs/consilium/{specs,plans,ideas,debugging-cases,pass-2}/` + `ROADMAP.md`
- Delete: `~/projects/Consilium/graphify-source/`

- [ ] **Step 1: Verify no unaccounted-for files remain in migration source dirs**

```bash
ls ~/projects/Consilium/docs/consilium/specs/ 2>/dev/null
ls ~/projects/Consilium/docs/consilium/plans/ 2>/dev/null
ls ~/projects/Consilium/docs/ideas/ 2>/dev/null
ls ~/projects/Consilium/graphify-source/ 2>/dev/null
```

Expected: empty outputs (or "No such file or directory" if shell already cleaned earlier). If any file remains, STOP and classify it against the orphan-file rules before rm-ing.

**Note:** `docs/consilium/debugging-cases/README.md` still exists — it is folded into CONVENTIONS.md at Stage 4. Do NOT delete it in this task.

- [ ] **Step 2: Remove empty directories + ROADMAP.md**

```bash
rm -rf ~/projects/Consilium/docs/consilium/specs
rm -rf ~/projects/Consilium/docs/consilium/plans
rm -rf ~/projects/Consilium/docs/ideas
rm -rf ~/projects/Consilium/docs/consilium/pass-2
rm -f ~/projects/Consilium/docs/consilium/ROADMAP.md
rm -rf ~/projects/Consilium/graphify-source
```

- [ ] **Step 3: Verify Consilium docs/consilium/ state**

```bash
ls ~/projects/Consilium/docs/consilium/
```

Expected: only `debugging-cases/` directory remains (folded in Stage 4).

- [ ] **Step 4: Verify Consilium docs/ state**

```bash
ls ~/projects/Consilium/docs/
```

Expected: `CONSILIUM-VISION.md`, `README.codex.md`, `README.opencode.md`, `claude-subagents-mcp-findings.md`, `consilium/`, `testing-agents.md`, `testing.md`, `windows/`. NO `ideas/`.

- [ ] **Step 5: Verify Consilium root state**

```bash
ls ~/projects/Consilium/
```

Expected: no `graphify-source/` directory.

---

### Task 15: Commit Stage 3 atomically in both repos

> **Confidence: High** — single commit per repo, covering all Stage 3 operations.

- [ ] **Step 1: Sanity-check invariants before committing**

Stage 1 lifecycle scripts must still exist and be executable (Stage 3 did not touch them — defense against any rogue rm-rf that clipped them):

```bash
ls -l ~/projects/consilium-docs/scripts/ | awk '{print $1, $9}'
```

Expected: three entries — `case-new`, `case-session`, `case-close` — each with `-rwxr-xr-x` permissions. If any is missing, halt and investigate before committing.

Marker file must still be present:

```bash
[ -f ~/projects/consilium-docs/.migration-in-progress ] || { echo "marker missing — forbidden-window defense broken"; exit 1; }
```

- [ ] **Step 2: Commit in consilium-docs**

```bash
cd ~/projects/consilium-docs
git add -A
git commit -m "migrate historical artifacts into case folders (Stage 3)

Case folders created:
- 2026-04-24-consilium-docs/ (this migration: spec + plan + abandoned tribune-resolution edict as ref)
- 2026-04-23-tribune-reshape/ (just-shipped tribune reshape campaign)
- 2026-04-21-consilium-backend-specialization/ (routed — open session 1)
- 2026-04-10-graphify-corpus-pass-3/ (closed; DISCREPANCY_REPORT + restructure ideation as refs)
- 2026-04-09-consul-improvements/ (draft — migrated ideation)
- 2026-04-09-consilium-foundation/ (closed; 11 specs + 9 plans + ROADMAP as ref)

All migrated cases carry STATUS.md reflecting end state; closed cases carry synthesized retro.md per retroactive rule."
```

- [ ] **Step 3: Commit in Consilium**

```bash
cd ~/projects/Consilium
git add -A
git commit -m "remove migrated specs/plans/ideas/ROADMAP; delete graphify-source (Stage 3)

All content migrated to consilium-docs/cases/. Only debugging-cases/README.md
remains in docs/consilium/ pending Stage 4 fold-in."
```

---

## Stage 4 — Fold debugging-cases README into CONVENTIONS

### Task 16: Replace CONVENTIONS.md stub with full content from debugging-cases README

> **Confidence: High** — full replacement; stub content gets subsumed by README content plus the case-folder conventions the stub carries.

**Files:**
- Modify: `~/projects/consilium-docs/CONVENTIONS.md` (full rewrite — stub replaced by merged content)
- Delete: `~/projects/Consilium/docs/consilium/debugging-cases/README.md`

- [ ] **Step 1: Read current debugging-cases README to confirm content**

```bash
cat ~/projects/Consilium/docs/consilium/debugging-cases/README.md
```

Review content; it covers: state machine, collision disambiguation rule, Phase 1 scan semantics, promotion-to-doctrine triggers, case-file template. All authoritative for CONVENTIONS.md.

- [ ] **Step 2: Write the full CONVENTIONS.md** (marker line preserved; stub replaced)

```bash
cat > ~/projects/consilium-docs/CONVENTIONS.md <<'EOF'
<!-- consilium-docs CONVENTIONS — do not remove this marker line -->
# Consilium Docs — Conventions

This file is the identity marker for `$CONSILIUM_DOCS` resolution AND the authoritative rule doc for case-folder conventions, STATUS.md schema, state machine, and collision rules. Read at the start of every Consul / Medicus / Edicts / Legion / March session.

## Case folder conventions

- One case per folder under `cases/`.
- Folder name: `YYYY-MM-DD-<slug>` (first-session date).
- Case naming is **Imperator-declared**, not Consul-inferred — except for Stage 3 retro-migration slugs (explicit scope carve-out for history preservation).

### Filename conventions (flat within case folders)

| File | When | Role |
|-|-|-|
| `STATUS.md` | Every case, always | Frontmatter + "what's live now" prose card |
| `spec.md` | Feature / infra cases | Master spec. Session 1's spec |
| `plan.md` | Feature / infra cases | Session 1's plan |
| `session-NN-<topic>-spec.md` | Session N > 1 | Session-scoped spec |
| `session-NN-<topic>-plan.md` | Session N > 1 | Session-scoped plan |
| `handoff-NN-to-MM.md` | Session closes mid-case | What N left for N+1 |
| `ref-<topic>.md` | Emergent knowledge | Cheatsheets, schemas, flow diagrams, prior-attempt artifacts |
| `diagnosis.md` | Bug cases | Medicus 14-field packet |
| `fix-plan.md` | Bug cases | Legion / march plan after diagnosis |
| `retro.md` | Feature: MANDATORY. Bug: optional-prompted | Post-close reflection |

Flat, not nested. `ls cases/<slug>/` shows everything.

### Collision disambiguation

If a case with the exact name already exists (two sessions on the same day with the same slug), append `-2`, `-3`, etc. to the slug portion (not the date). Example: `2026-04-25-checkout-fails/` already exists → next is `2026-04-25-checkout-fails-2/`. `case-new` performs this check automatically with:

```bash
ls cases/ | rg -x "^YYYY-MM-DD-<slug>(-[0-9]+)?$"
```

Exact match with optional numeric suffix, NOT prefix match — so unrelated slugs sharing a prefix (`checkout-fails-redirect` vs `checkout-fails`) are not treated as collisions.

## STATUS.md schema

```yaml
---
status: draft | rejected | approved | routed | contained | closed | referenced | abandoned
opened: YYYY-MM-DD
target: divinipress-store | divinipress-backend | consilium | cross-repo
agent: claude | codex | both
sessions: N
current_session: M
last_handoff: handoff-MM-to-NN.md   # when applicable
closed_at: YYYY-MM-DD               # only when status ∈ {closed, contained, referenced}
---

## Current state
(One-paragraph prose card.)

## What's next
(Bullet list, optional.)

## Open questions
(Bullet list, optional.)
```

## State machine — 8 states (verbatim Medicus 7 + `referenced`)

```
draft ──┬── approved ── routed ──┬── closed ──── referenced ──── archived
        │                         │
        ├── rejected* ── approved ├── contained* ── closed
        │                         │
        └── abandoned             └── abandoned

* bug-specific states
```

| State | Meaning | Who sets | Next states |
|-|-|-|-|
| `draft` | Scope shaping; spec not yet approved | Consul | `approved`, `rejected`, `abandoned` |
| `rejected` (bug) | Medicus diagnosis declined by Imperator | Medicus after Imperator Phase 7 rejection | `approved` (after rediagnosis) or `abandoned` |
| `approved` | Spec / diagnosis approved; plan written or awaiting execution | Consul / Medicus after Imperator approval | `routed`, `abandoned` |
| `routed` | Execution picked up by Legion / March; work underway (live string Legion + March write today) | Legatus on march start | `closed`, `contained`, `routed` (next session), `abandoned` |
| `contained` (bug) | Fix shipped as containment; root cause pending | Legatus at contain-dispatch | `closed` (when root cause resolved), `abandoned` |
| `closed` | All planned work complete + retro written | Legatus / Consul at case-close (via `case-close` script) | `referenced`, `archived` |
| `referenced` | Closed but still actively linked by open cases — keeps out of archive. **Manual transition for now.** | Imperator | `archived` when references clear |
| `abandoned` | Killed pre-close — 7-day draft timeout (auto via STATUS.md mtime) or Imperator declaration | Automatic / Imperator | `archived` |

### Draft timeout

A case with `status: draft` and no edit to its `STATUS.md` file within 7 days is tagged `abandoned` automatically on the next session's Phase 1 scan. Any edit to STATUS.md (Imperator annotation, Consul state update, session-bump) resets the timer. Sibling-file edits do NOT reset the timer — only STATUS.md.

### `contained` state

Bug-specific. Non-bug cases (features, infra) never enter `contained` — they go `routed → closed` directly.

### `referenced` state

Manual-transition for now. Auto-detection via cross-reference scan deferred to a future case.

## Phase 1 open-queue scan (Medicus)

At the start of every `/tribune` session, the Medicus scans for active-work cases that carry unresolved root-cause state:

```bash
find $CONSILIUM_DOCS/cases -maxdepth 2 -name STATUS.md | \
  xargs rg -l '^status: contained$'
```

Surfaces every case with `status: contained` for Imperator review of root-cause work. Separate mtime-based scan auto-abandons stale drafts.

## Promotion triggers

**Bug retros may promote to doctrine.** The `case-close` script prompts for this explicitly on bug cases. If the Imperator says yes, the retro's root-cause content is folded into `$CONSILIUM_DOCS/doctrine/known-gaps.md` as a new entry, per the format in that file.

## Case file template

`case-new` drops an initial STATUS.md + empty spec.md stub. `case-session` drops session-scoped spec stubs. `case-close` writes retro templates (mandatory-fill for features, optional-prompt for bugs) before setting `status: closed + closed_at`.
EOF
```

- [ ] **Step 3: Verify marker line is still present**

```bash
head -1 ~/projects/consilium-docs/CONVENTIONS.md
```

Expected: `<!-- consilium-docs CONVENTIONS — do not remove this marker line -->`

- [ ] **Step 4: Commit CONVENTIONS fold in consilium-docs**

```bash
cd ~/projects/consilium-docs
git add CONVENTIONS.md
git commit -m "fold debugging-cases README into CONVENTIONS (Stage 4)

Full state machine + Phase 1 scan + promotion triggers + case-file template
now live in the authoritative conventions doc. Stub replaced."
```

---

### Task 17: Delete the now-redundant debugging-cases README + commit in Consilium

> **Confidence: High** — content lives in CONVENTIONS.md now.

**Files:**
- Delete: `~/projects/Consilium/docs/consilium/debugging-cases/README.md`
- Delete: `~/projects/Consilium/docs/consilium/debugging-cases/` (empty after README removal)

- [ ] **Step 1: Delete README**

```bash
rm ~/projects/Consilium/docs/consilium/debugging-cases/README.md
```

- [ ] **Step 2: Verify directory is empty, then remove it**

```bash
ls -A ~/projects/Consilium/docs/consilium/debugging-cases 2>/dev/null
```

Expected: no output (directory is empty). If any file is listed, HALT — there were unmigrated case files. Return to Stage 3 and migrate them; then re-run.

```bash
rmdir ~/projects/Consilium/docs/consilium/debugging-cases
```

- [ ] **Step 3: Verify docs/consilium/ is now empty, then remove it**

```bash
ls -A ~/projects/Consilium/docs/consilium/ 2>/dev/null
```

Expected: no output. If any file or directory is listed, HALT — classify it against the orphan-file rules before proceeding. If empty:

```bash
rmdir ~/projects/Consilium/docs/consilium/
```

- [ ] **Step 4: Commit in Consilium**

```bash
cd ~/projects/Consilium
git add -A
git commit -m "fold debugging-cases README into consilium-docs CONVENTIONS; remove empty docs/consilium/ (Stage 4)"
```

---

## Stage 5 — Repoint agent surfaces + graphify excision + bootstrap + close window

> **The big one.** Single atomic commit covering: all SKILL edits + canonical persona edits (Task 23) + user-scope agent surgical edits (Task 23.5) + verification template edits + script rewrites + cross-ref audit + cache re-population (full-tree rsync) + Codex-adoption case bootstrap + INDEX banner + marker-file removal.
>
> **State-machine migration.** Task 20 + Task 21 rewrite state-write sites in tribune / legion / march SKILLs from capital-`Status:` body prose to lowercase `status:` YAML in `$CONSILIUM_DOCS/cases/<slug>/STATUS.md`. State strings are verbatim (Medicus 7 + `referenced`); only storage location + field-label casing change.
>
> **Graphify excision scope.** Plan-of-record: 5 SKILLs + implementer-prompt + 5 canonical personas + 6 user-scope agents (3 surfaces each: frontmatter `tools:`, `mcpServers:` list, Operational Notes) + protocol + 5 templates + known-gaps.md + CLAUDE.md + CONSILIUM-VISION.md. Total surfaces > 16; the spec's "16" was a lower bound that under-counted the user-scope agents' multiple graphify touchpoints. Drift-sync (Task 28 Step 2) handles only the Codex block inside 5 agents — it does NOT reach frontmatter/mcpServers/Operational Notes, which is why Task 23.5 exists.

### Task 18: Edit `skills/consul/SKILL.md` — Phase 0 + path repoint + graphify strip + `~/.codex/` cruft fix

> **Confidence: High** — Phase 0 block is canonical; path + graphify edits follow the Graphify Excision inventory in spec.

**Files:**
- Modify: `~/projects/Consilium/skills/consul/SKILL.md`

- [ ] **Step 1: Baseline — find current graphify + path references**

```bash
rg -n "graphify|query_graph|get_neighbors|~/\.codex/agents|docs/consilium/specs" ~/projects/Consilium/skills/consul/SKILL.md
```

Record what you find. Every hit needs handling in Steps 2-5.

- [ ] **Step 2: Insert Phase 0 block at the top of the Doctrine section (before "Phase 1" / "Reconnaissance")**

Find the current "## My Doctrine" heading and the first phase heading under it ("### Phase 1: Reconnaissance" or similar). Insert BEFORE that first phase:

```markdown
### Phase 0 — Resolve $CONSILIUM_DOCS

Before any reconnaissance or deliberation, I resolve where the consilium-docs repo lives and verify I am not inside a migration forbidden window. I do **not** change cwd — target-repo `CLAUDE.md` stays loaded, scouts read app code with natural relative paths.

```bash
CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS. Set CONSILIUM_DOCS=<path>."; exit 1; }
[ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" 2>/dev/null | grep -q "consilium-docs CONVENTIONS" || {
  echo "$CONSILIUM_DOCS is not a consilium-docs checkout (CONVENTIONS.md marker line missing or malformed)."
  exit 1
}
[ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] || {
  echo "consilium-docs migration in progress — halt."
  exit 1
}
```

**Halt discipline:** if this Bash call returns non-zero, I halt and do not proceed. `exit 1` in bash does not halt Claude — my own discipline honors the non-zero return.

Two address spaces: Consilium-owned artifacts (case files, doctrine, verification templates) resolve via `$CONSILIUM_DOCS/...` prefix. Target-repo code paths stay relative-to-cwd.
```

- [ ] **Step 3: Repoint spec-write path**

Find the line that reads something like `**I write the spec** to \`docs/consilium/specs/YYYY-MM-DD-<topic>-design.md\``. Replace with:

```markdown
**I write the spec** to `$CONSILIUM_DOCS/cases/<slug>/spec.md` for session 1 of a new case, or `$CONSILIUM_DOCS/cases/<slug>/session-NN-<topic>-spec.md` for later sessions of a multi-session case. The `<slug>` is Imperator-declared at the session-opening recon prompt (see below). For new cases, I invoke `$CONSILIUM_DOCS/scripts/case-new <slug> --target <target> --agent claude` which creates the folder, STATUS.md stub, and empty spec.md — I write into that pre-created spec.md.
```

- [ ] **Step 4: Add session-opening recon prompt**

In the Reconnaissance / Phase 1 section (or wherever the Consul's opening dialogue lives), add:

```markdown
**Session-opening case identity:** I ask the Imperator at session start: *"Are we opening a new case or continuing an existing one? If continuing, which case and session number?"* Imperator answers deterministically. I do not infer from conversation drift.
```

- [ ] **Step 5: Strip graphify references**

For every `query_graph`, `get_neighbors`, `mcp__graphify__*`, or "graphify MCP" reference found in Step 1, replace with language about direct doctrine file reads:

Example replacement — find:
> *"query the graphify MCP server — `query_graph` (token_budget: 4000) for broad context, `get_neighbors` for specific entity relationships"*

Replace with:
> *"read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/` — known-gaps.md for recurring-bug memory, domain/MANIFEST.md for topic index, lane-classification.md + lane-guides/ for per-lane debugging patterns, voice-principles.md + brand-identity.md for Divinipress voice / positioning"*

- [ ] **Step 6: Fix `~/.codex/agents/` cruft**

Find every `~/.codex/agents/` in this file and replace with `~/.claude/agents/`:

```bash
rg -n "~/\.codex/agents" ~/projects/Consilium/skills/consul/SKILL.md
```

Use Edit to fix each occurrence (typically 1-2 hits).

- [ ] **Step 7: Verify edits landed**

```bash
rg -c "Phase 0 — Resolve \$CONSILIUM_DOCS|\$CONSILIUM_DOCS/cases|consilium-docs" ~/projects/Consilium/skills/consul/SKILL.md
rg -c "graphify|query_graph|get_neighbors|~/\.codex/agents" ~/projects/Consilium/skills/consul/SKILL.md
```

Expected: first command returns >= 3 matches; second returns 0.

---

### Task 19: Edit `skills/edicts/SKILL.md` — same pattern as consul

> **Confidence: High** — mirror of Task 18 with plan-write path.

**Files:**
- Modify: `~/projects/Consilium/skills/edicts/SKILL.md`

- [ ] **Step 1: Baseline grep**

```bash
rg -n "graphify|query_graph|get_neighbors|~/\.codex/agents|docs/consilium/plans" ~/projects/Consilium/skills/edicts/SKILL.md
```

- [ ] **Step 2: Insert Phase 0 block** at the top of the Doctrine / Reconnaissance section (same block text as Task 18 Step 2).

- [ ] **Step 3: Repoint plan-write path**

Find lines that read `Save edicts to: \`docs/consilium/plans/YYYY-MM-DD-<feature-name>.md\`` and similar. Replace with:

```markdown
Save edicts to `$CONSILIUM_DOCS/cases/<slug>/plan.md` for session 1, or `$CONSILIUM_DOCS/cases/<slug>/session-NN-<topic>-plan.md` for later sessions. For a new session on an existing case, I invoke `$CONSILIUM_DOCS/scripts/case-session <slug> <topic>` which creates the session-NN-*-spec.md stub and bumps STATUS.md session counters; I then write the session-NN-*-plan.md alongside it.
```

- [ ] **Step 4: Strip graphify references** — same pattern as Task 18 Step 5.

- [ ] **Step 5: Fix `~/.codex/agents/` cruft** — same pattern as Task 18 Step 6.

- [ ] **Step 6: Verify**

```bash
rg -c "Phase 0 — Resolve \$CONSILIUM_DOCS|\$CONSILIUM_DOCS/cases" ~/projects/Consilium/skills/edicts/SKILL.md
rg -c "graphify|query_graph|get_neighbors|~/\.codex/agents" ~/projects/Consilium/skills/edicts/SKILL.md
```

Expected: first >= 2; second = 0.

---

### Task 20: Edit `skills/tribune/SKILL.md` — Phase 0 + Phase 1 scan rewrite + doctrine repoint + graphify excision

> **Confidence: High** — tribune was the primary graphify consumer; largest edit.

**Files:**
- Modify: `~/projects/Consilium/skills/tribune/SKILL.md`

- [ ] **Step 1: Baseline grep**

```bash
rg -n "graphify|query_graph|get_neighbors|skills/tribune/references|skills/references/domain|docs/consilium/debugging-cases" ~/projects/Consilium/skills/tribune/SKILL.md
```

- [ ] **Step 2: Insert Phase 0 block** at the very top of the Eight-Step Workflow section, BEFORE existing `### Phase 1 — Summons` (or whatever the first phase heading is). The insertion must use `### Phase 0` (h3 to match the existing phase-heading level — lesson from abandoned tribune edict's round-1 Praetor finding). Block text same as Task 18 Step 2.

Additionally: update any prose referencing "Eight-Step Workflow" to "Nine-Step Workflow" OR add a one-line note that Phase 0 is a precondition (not part of the eight-step spine). Preferred: add the precondition note to preserve the section's existing "Eight-Step" naming.

Example insertion at the top of the section (ABOVE Phase 0):

```markdown
## The Eight-Step Workflow

Phase 0 is a precondition — it gates every session but is not part of the eight-step diagnosis spine. The numbered phases 1-8 below are the spine.
```

- [ ] **Step 3: Rewrite Phase 1 open-queue scan**

Find the section currently describing the open-queue scan (walks `docs/consilium/debugging-cases/`). Replace the scan mechanics with:

```markdown
**Open-queue scan.** Before accepting the new summons as the sole scope, I read `$CONSILIUM_DOCS/cases/` for any case whose STATUS.md carries `status: contained` (fix shipped as containment, root cause pending). These cases surface as active work requiring root-cause follow-up.

```bash
find "$CONSILIUM_DOCS/cases" -maxdepth 2 -name STATUS.md \
  | xargs rg -l '^status: contained$'
```

I also scan for stale drafts — cases with `status: draft` whose `STATUS.md` mtime is older than 7 days:

```bash
find "$CONSILIUM_DOCS/cases" -maxdepth 2 -name STATUS.md -mtime +7 \
  | xargs rg -l '^status: draft$'
```

Any stale drafts surfaced here transition to `status: abandoned` automatically in my STATUS.md edits for this session.
```

- [ ] **Step 4: Repoint doctrine reads**

Find Phase 2 (doctrine load) and rewrite any references to old paths:
- `skills/references/domain/known-gaps.md` → `$CONSILIUM_DOCS/doctrine/known-gaps.md`
- `skills/tribune/references/lane-classification.md` → `$CONSILIUM_DOCS/doctrine/lane-classification.md`
- `skills/tribune/references/lane-guides/` → `$CONSILIUM_DOCS/doctrine/lane-guides/`
- `skills/tribune/references/diagnosis-packet.md` → `$CONSILIUM_DOCS/doctrine/diagnosis-packet.md`
- `skills/tribune/references/fix-thresholds.md` → `$CONSILIUM_DOCS/doctrine/fix-thresholds.md`
- `skills/tribune/references/known-gaps-protocol.md` → `$CONSILIUM_DOCS/doctrine/known-gaps-protocol.md`

- [ ] **Step 5: Repoint case-file write path**

Find references to `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` and replace with `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`. Update collision-disambiguation prose to refer to the `case-new` script.

- [ ] **Step 5.5: Migrate state-writes from case body prose to STATUS.md YAML frontmatter**

Today's tribune SKILL writes state values as capital-`Status:` body prose inside the single debugging-case markdown file (see current SKILL around lines 116, 167, 173-175, 178). Post-migration, the authoritative state store is `$CONSILIUM_DOCS/cases/<slug>/STATUS.md`'s lowercase YAML frontmatter `status:` field — which is what CONVENTIONS.md, the tribune Phase 1 scan (Step 3 above), and `case-close` all expect. Leaving `Status:` body writes in place would fork the state machine.

For every state-write instruction the tribune SKILL carries today, rewrite it to target STATUS.md's frontmatter. Examples of the translation:

Before:
> *"After the Imperator approves the packet, I write `Status: approved` at the top of the case file."*

After:
> *"After the Imperator approves the packet, I update STATUS.md's `status:` field to `approved` via an awk-in-place rewrite of the YAML frontmatter (see `$CONSILIUM_DOCS/scripts/case-close` for the pattern; for non-close transitions, apply the same awk recipe against `$CONSILIUM_DOCS/cases/<slug>/STATUS.md`)."*

Transitions Medicus writes today that must move to STATUS.md:

| Transition | Today's body write | Post-migration STATUS.md write |
|-|-|-|
| Packet approved by Imperator | `Status: approved` | `status: approved` in STATUS.md frontmatter |
| Diagnosis declined by Imperator | `Status: rejected` | `status: rejected` in STATUS.md frontmatter |
| Work routed to Legatus | (Legion SKILL writes) | (Legion SKILL writes; see Task 21 Step 4.5) |
| Fix contained / root-cause pending | `Status: contained` | `status: contained` in STATUS.md frontmatter |
| Draft aborted | `Status: abandoned` | `status: abandoned` in STATUS.md frontmatter |

The state **strings** are verbatim (Medicus 7 + `referenced` preserved; no renames). Only the authoring location (STATUS.md frontmatter) and field-label casing (`status:` lowercase per YAML convention) change. The 8-state machine is unchanged.

For each state-write site the baseline grep in Step 1 surfaced, apply the translation pattern above. After editing, confirm no `^Status:` (capital) writes remain in tribune prose:

```bash
rg -n "^Status: (draft|rejected|approved|routed|contained|closed|referenced|abandoned)$" ~/projects/Consilium/skills/tribune/SKILL.md
```

Expected: 0 hits — every capital-`Status:` body write has moved to STATUS.md frontmatter with lowercase `status:`.

- [ ] **Step 6: Remove graphify Phase 2 branch**

Find any "graphify OR file-read" language in Phase 2 doctrine load. Remove the graphify branch entirely. Doctrine load is file-read only from `$CONSILIUM_DOCS/doctrine/`.

- [ ] **Step 7: Verify**

```bash
rg -c "Phase 0 — Resolve \$CONSILIUM_DOCS|\$CONSILIUM_DOCS/cases|\$CONSILIUM_DOCS/doctrine" ~/projects/Consilium/skills/tribune/SKILL.md
rg -c "graphify|query_graph|get_neighbors|skills/tribune/references|skills/references/domain|docs/consilium/debugging-cases" ~/projects/Consilium/skills/tribune/SKILL.md
rg -n "^Status: " ~/projects/Consilium/skills/tribune/SKILL.md
```

Expected: first command >= 5 (Phase 0 block + scan block + doctrine reads + case-file path); second = 0; third = 0 (no capital-`Status:` body writes remain).

---

### Task 21: Edit `skills/legion/SKILL.md` + `skills/march/SKILL.md` — Phase 0 + Debug Fix Intake path + graphify strip

> **Confidence: High** — both files follow the same pattern; grouped to reduce task count.

**Files:**
- Modify: `~/projects/Consilium/skills/legion/SKILL.md`
- Modify: `~/projects/Consilium/skills/march/SKILL.md`

- [ ] **Step 1: Baseline greps**

```bash
rg -n "graphify|query_graph|get_neighbors|docs/consilium/debugging-cases|fix-thresholds\.md" \
  ~/projects/Consilium/skills/legion/SKILL.md \
  ~/projects/Consilium/skills/march/SKILL.md
```

- [ ] **Step 2: Insert Phase 0 block** in BOTH files at the top of their Debug Fix Intake sections (the preamble before case-file reads). Block text same as Task 18 Step 2.

- [ ] **Step 3: Repoint case-file reads in Debug Fix Intake** — both files — from `docs/consilium/debugging-cases/YYYY-MM-DD-<slug>.md` to `$CONSILIUM_DOCS/cases/<slug>/diagnosis.md`.

- [ ] **Step 4: Repoint doctrine reads** — both files — any `fix-thresholds.md` or `lane-classification.md` references to `$CONSILIUM_DOCS/doctrine/fix-thresholds.md` etc.

- [ ] **Step 4.5: Migrate state-writes from case body prose to STATUS.md YAML frontmatter**

Today's Legion SKILL (around lines 361-365) and March SKILL (around lines 118-122) write state values as capital-`Status:` body prose inside the single debugging-case markdown file at intake and close. Post-migration, state lives as lowercase YAML `status:` in `$CONSILIUM_DOCS/cases/<slug>/STATUS.md`.

For each state-write site:

| Today's write | Location in current SKILL | Post-migration write |
|-|-|-|
| `Status: routed` at intake | Legion :361, March :118 | awk-in-place rewrite of `status:` in STATUS.md to `routed` |
| `Status: contained` at containment close | Legion :362, March :119 | awk-in-place rewrite of `status:` in STATUS.md to `contained` |
| `Status: closed` at full close | Legion :363-365, March :120-122 | **invoke `$CONSILIUM_DOCS/scripts/case-close <slug>`** which handles the `status:` + `closed_at:` rewrite AND the retro discipline |

The state **strings** (`routed`, `contained`, `closed`) are verbatim — preserving "zero renames" from Critical Constraint 1. Only storage location and field-label casing change.

Preferred pattern for intake and containment (no script exists for mid-lifecycle state changes — inline awk):

```bash
tmp=$(mktemp) && awk -v new="$NEW_STATUS" '
  BEGIN { in_fm=0 }
  /^---$/ { in_fm = !in_fm; print; next }
  in_fm && /^status:/ { print "status: " new; next }
  { print }
' "$CONSILIUM_DOCS/cases/$slug/STATUS.md" > "$tmp" && mv "$tmp" "$CONSILIUM_DOCS/cases/$slug/STATUS.md"
```

Close path uses the lifecycle script:

```bash
"$CONSILIUM_DOCS/scripts/case-close" "$slug"
```

The script writes `status: closed` + `closed_at: $today` + enforces retro discipline (feature = retro mandatory, bug = retro prompt-then-skippable).

After editing both SKILLs, confirm no `^Status:` (capital) body writes remain:

```bash
rg -n "^Status: (draft|rejected|approved|routed|contained|closed|referenced|abandoned)" \
  ~/projects/Consilium/skills/legion/SKILL.md \
  ~/projects/Consilium/skills/march/SKILL.md
```

Expected: 0 hits per file.

- [ ] **Step 5: Strip graphify references** — both files — remove any `graphify MCP` dispatch-prompt fragments, "query graphify" prose, etc.

- [ ] **Step 6: Verify both files**

```bash
rg -c "Phase 0 — Resolve \$CONSILIUM_DOCS|\$CONSILIUM_DOCS/cases|\$CONSILIUM_DOCS/doctrine" \
  ~/projects/Consilium/skills/legion/SKILL.md \
  ~/projects/Consilium/skills/march/SKILL.md
rg -c "graphify|query_graph|get_neighbors|docs/consilium/debugging-cases" \
  ~/projects/Consilium/skills/legion/SKILL.md \
  ~/projects/Consilium/skills/march/SKILL.md
rg -n "^Status: " \
  ~/projects/Consilium/skills/legion/SKILL.md \
  ~/projects/Consilium/skills/march/SKILL.md
```

Expected: first command shows >= 3 per file; second shows 0 per file; third shows 0 per file (no capital-`Status:` body writes remain).

---

### Task 22: Edit `skills/legion/implementer-prompt.md` — dispatch-prompt template

> **Confidence: High** — single-line fragment rewrite.

**Files:**
- Modify: `~/projects/Consilium/skills/legion/implementer-prompt.md`

- [ ] **Step 1: Find the graphify fragment**

```bash
rg -n "graphify" ~/projects/Consilium/skills/legion/implementer-prompt.md
```

Expected: line 42 contains `{DOMAIN_KNOWLEDGE — assembled from graphify MCP queries by the Legatus}` or similar.

- [ ] **Step 2: Rewrite with Edit tool**

Replace:
> `{DOMAIN_KNOWLEDGE — assembled from graphify MCP queries by the Legatus}`

With:
> `{DOMAIN_KNOWLEDGE — assembled from doctrine file reads at $CONSILIUM_DOCS/doctrine/ by the Legatus}`

- [ ] **Step 3: Verify**

```bash
rg -c "graphify|query_graph" ~/projects/Consilium/skills/legion/implementer-prompt.md
rg -c "\$CONSILIUM_DOCS/doctrine" ~/projects/Consilium/skills/legion/implementer-prompt.md
```

Expected: first = 0; second >= 1.

---

### Task 23: Edit canonical persona files — consul, medicus, scout, soldier, consilium-codex

> **Confidence: High** — graphify body references in 5 personas.

**Files:**
- Modify: `~/projects/Consilium/skills/references/personas/consul.md`
- Modify: `~/projects/Consilium/skills/references/personas/medicus.md`
- Modify: `~/projects/Consilium/skills/references/personas/scout.md`
- Modify: `~/projects/Consilium/skills/references/personas/soldier.md`
- Modify: `~/projects/Consilium/skills/references/personas/consilium-codex.md`

- [ ] **Step 1: Baseline grep across all five**

```bash
rg -n "graphify|query_graph|get_neighbors|mcp__graphify" \
  ~/projects/Consilium/skills/references/personas/consul.md \
  ~/projects/Consilium/skills/references/personas/medicus.md \
  ~/projects/Consilium/skills/references/personas/scout.md \
  ~/projects/Consilium/skills/references/personas/soldier.md \
  ~/projects/Consilium/skills/references/personas/consilium-codex.md
```

Expected hits per spec (round-2 inventory): scout.md line 63, soldier.md lines 72/78, plus any in consul/medicus/consilium-codex that surface.

- [ ] **Step 2: Edit `scout.md`** (line 63)

Replace the line (example):
> *"Query graphify for domain concepts when the question touches the domain."*

With:
> *"Read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/` when the question touches the domain (known-gaps.md, lane-guides/, domain/MANIFEST.md + topic files)."*

- [ ] **Step 3: Edit `soldier.md`** (lines 72, 78)

Line 72 — replace (example):
> *"Domain knowledge the Legatus pre-loaded from graphify"*

With:
> *"Domain knowledge the Legatus pre-loaded from doctrine file reads at `$CONSILIUM_DOCS/doctrine/`"*

Line 78 — replace (example):
> *"Query graphify directly for any domain concepts"*

With:
> *"Read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/` directly for any domain concepts"*

- [ ] **Step 4: Edit `consul.md`, `medicus.md`, `consilium-codex.md`** — any graphify references found in Step 1 get the same treatment: replace "graphify" verbiage with "`$CONSILIUM_DOCS/doctrine/`" file-read semantics.

- [ ] **Step 5: Verify**

```bash
rg -c "graphify|query_graph|get_neighbors|mcp__graphify" \
  ~/projects/Consilium/skills/references/personas/consul.md \
  ~/projects/Consilium/skills/references/personas/medicus.md \
  ~/projects/Consilium/skills/references/personas/scout.md \
  ~/projects/Consilium/skills/references/personas/soldier.md \
  ~/projects/Consilium/skills/references/personas/consilium-codex.md
```

Expected: all five report 0.

---

### Task 23.5: Strip graphify from 6 user-scope agents (frontmatter + mcpServers + Operational Notes)

> **Confidence: High** — drift-sync ONLY propagates the Codex block (between `# The Codex of the Consilium` and `## Operational Notes`). Frontmatter `tools:` allowlists, `mcpServers:` lists, and `## Operational Notes` body prose are NOT reached by drift-sync. Editing the 5 canonical persona files in Task 23 does NOT propagate to these runtime surfaces — six user-scope agents would still invoke graphify at runtime. This task closes that gap with surgical edits per file.

**Files (6):**
- Modify: `~/.claude/agents/consilium-censor.md`
- Modify: `~/.claude/agents/consilium-praetor.md`
- Modify: `~/.claude/agents/consilium-provocator.md`
- Modify: `~/.claude/agents/consilium-tribunus.md`
- Modify: `~/.claude/agents/consilium-soldier.md`
- Modify: `~/.claude/agents/consilium-scout.md`

Per file, three graphify surfaces are removed: (a) `tools:` allowlist entries starting with `mcp__graphify__`, (b) `mcpServers:` list entry `- graphify`, (c) Operational Notes body prose referencing graphify / MCP queries / domain-bible loading via graphify.

- [ ] **Step 1: Baseline grep across all 6 user-scope agents**

```bash
rg -n "graphify|query_graph|get_neighbors|mcp__graphify" \
  ~/.claude/agents/consilium-censor.md \
  ~/.claude/agents/consilium-praetor.md \
  ~/.claude/agents/consilium-provocator.md \
  ~/.claude/agents/consilium-tribunus.md \
  ~/.claude/agents/consilium-soldier.md \
  ~/.claude/agents/consilium-scout.md
```

Record each hit's file + line number + surface (frontmatter/mcpServers/body). Expect multiple hits per file.

- [ ] **Step 2: Per-file — strip `tools:` frontmatter entries**

For each of the 6 files, read the frontmatter `tools:` line (typically line 4) and remove every token matching `mcp__graphify__*`. The `tools:` line is a comma-separated list; delete each graphify entry along with its trailing comma-space (or leading comma-space if it's the final entry).

Example: a `tools:` line like
```yaml
tools: Read, Grep, Bash, mcp__graphify__query_graph, mcp__graphify__get_node, mcp__serena__find_symbol
```
becomes
```yaml
tools: Read, Grep, Bash, mcp__serena__find_symbol
```

- [ ] **Step 3: Per-file — strip `mcpServers:` list entries**

The `mcpServers:` YAML list block typically lives on lines 5-7. Remove the single-line entry `- graphify` (or `  - graphify`, preserving indentation). Leave `- serena` / `- medusa` entries untouched.

Example:
```yaml
mcpServers:
  - serena
  - graphify
  - medusa
```
becomes
```yaml
mcpServers:
  - serena
  - medusa
```

- [ ] **Step 4: Per-file — rewrite Operational Notes graphify prose**

Every user-scope agent file has an `## Operational Notes` section near the bottom describing how the agent loads domain knowledge. Replace any phrasing like "query graphify for domain concepts" / "graphify MCP access" / "graphify is unavailable, fall back to bible files" with the new doctrine-file-read semantics:

- "Read relevant doctrine files from `$CONSILIUM_DOCS/doctrine/`" (replaces "query graphify")
- "If `$CONSILIUM_DOCS` resolution fails, halt and surface to the dispatching persona" (replaces any graphify-degradation fallback)
- Remove any sentence describing graphify as the domain-knowledge authority.

Preserve any unrelated Operational Notes prose (Medusa Rig usage, session discipline, finding-format reminders).

- [ ] **Step 5: Per-file — verify surgical edits**

```bash
for f in ~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,scout}.md; do
  echo "=== $f ==="
  rg -c "graphify|query_graph|get_neighbors|mcp__graphify" "$f"
done
```

Expected: every file reports 0. If any file reports non-zero, re-read that file and address the remaining hits before proceeding.

- [ ] **Step 6: Syntactic sanity — confirm YAML frontmatter still parses**

```bash
for f in ~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier,scout}.md; do
  python3 -c "
import yaml, sys, pathlib
text = pathlib.Path('$f').read_text()
if not text.startswith('---'):
    print('NO FRONTMATTER: $f'); sys.exit(1)
_, fm, _ = text.split('---', 2)
try:
    yaml.safe_load(fm)
    print('OK: $f')
except yaml.YAMLError as e:
    print(f'YAML ERROR: $f — {e}'); sys.exit(1)
"
done
```

Expected: `OK:` for every file. Python's `yaml` module is available in the default macOS toolchain; if missing, skip this step and eyeball each frontmatter block manually.

---

### Task 24: Edit verification/protocol.md + 5 templates — strip graphify dispatch fragments

> **Confidence: High** — protocol has a section on graphify MCP access; templates carry `{DOMAIN KNOWLEDGE — assembled from graphify MCP queries}` fragments.

**Files:**
- Modify: `~/projects/Consilium/skills/references/verification/protocol.md`
- Modify: `~/projects/Consilium/skills/references/verification/templates/spec-verification.md`
- Modify: `~/projects/Consilium/skills/references/verification/templates/plan-verification.md`
- Modify: `~/projects/Consilium/skills/references/verification/templates/campaign-review.md`
- Modify: `~/projects/Consilium/skills/references/verification/templates/mini-checkit.md`
- Modify: `~/projects/Consilium/skills/references/verification/templates/tribune-verification.md`

- [ ] **Step 1: Baseline grep**

```bash
rg -n "graphify|query_graph|get_neighbors|mcp__graphify" \
  ~/projects/Consilium/skills/references/verification/protocol.md \
  ~/projects/Consilium/skills/references/verification/templates/*.md
```

- [ ] **Step 2: Edit protocol.md**

Find the "Domain knowledge loading" section (around line 56). Remove/rewrite the graphify MCP access description. Replace with:

```markdown
**Domain knowledge loading:**
The user-scope agents have direct filesystem access and read doctrine from `$CONSILIUM_DOCS/doctrine/` when they need domain context. The dispatcher MAY pre-load relevant doctrine content into the dispatch prompt's `## Domain Knowledge` section if it already has context from its own reconnaissance — but it is NOT required. When omitted, the agent reads the doctrine files itself as needed.
```

- [ ] **Step 3: Edit each template**

For each of the 5 template files, find every `{DOMAIN KNOWLEDGE — assembled from graphify MCP queries by the dispatcher}` dispatch-prompt fragment and rewrite to:

> `{DOMAIN KNOWLEDGE — assembled from $CONSILIUM_DOCS/doctrine/ file reads by the dispatcher (optional; agent reads directly when omitted)}`

Also remove any prose section describing graphify MCP access in each template.

- [ ] **Step 4: Verify**

```bash
rg -c "graphify|query_graph|get_neighbors|mcp__graphify" \
  ~/projects/Consilium/skills/references/verification/protocol.md \
  ~/projects/Consilium/skills/references/verification/templates/*.md
```

Expected: all report 0.

---

### Task 25: Rewrite `scripts/check-tribune-staleness.py` + delete `scripts/refresh-graph.sh`

> **Confidence: High** — reframe preserves existing discipline (7 legacy BANNED_PATTERNS, medusa-dev allowlist + installed_plugins.json resolution, test-writing smell regex set) and EXTENDS with three new reframe decisions. This is a reframe, not a replace.

**Files:**
- Modify: `~/projects/Consilium/scripts/check-tribune-staleness.py`
- Delete: `~/projects/Consilium/scripts/refresh-graph.sh`

- [ ] **Step 1: Delete refresh-graph.sh**

```bash
rm ~/projects/Consilium/scripts/refresh-graph.sh
```

- [ ] **Step 2: Rewrite check-tribune-staleness.py (preserve existing, add new)**

Existing discipline to PRESERVE (carried from tribune-reshape ship):

- `\bJesse\b` — superpowers authorship reference
- `\bClaude\s+(wrote|authored|said)\b` — Claude-as-author reference
- `\bCLAUDE\.md\b` — CLAUDE.md referenced as if tribune owns it
- `superpowers[:-]` — superpowers provenance marker
- `\bconsilium:gladius\b` / `\bconsilium:sententia\b` / `\bconsilium:tribunal\b` — external skill references
- Test-writing smell regex set (`\bwrite\s+(a\s+)?failing\s+test\b`, `\bimplement.*test\s+first\b`, `\btdd\s+cycle\b`)
- Medusa-dev allowlist (`medusa-dev:building-with-medusa`, `medusa-dev:building-storefronts`, `medusa-dev:building-admin-dashboard-customizations`) + `installed_plugins.json` → `installPath` resolution + cache filesystem check

Reframe decisions to ADD:

- **Banned-regex extensions**: `skills/tribune/references/`, `skills/references/domain/`, `docs/consilium/debugging-cases/` (legacy paths); graphify tokens (`graphify`, `query_graph`, `get_neighbors`, `mcp__graphify`); `~/.codex/agents/` (Claude-side should reference `~/.claude/agents/`).
- **Reference-existence**: any `$CONSILIUM_DOCS/doctrine/<file>` and `$CONSILIUM_DOCS/doctrine/<dir>/` refs must resolve (handles both `.md` file refs and trailing-slash directory refs like `lane-guides/`).
- **Scan scope**: keep scanning the tribune tree (SKILL.md + whatever else lands in `skills/tribune/`) plus the plugin cache mirror — drop references to `skills/tribune/references/` (which no longer exists post-Stage-2).

Full rewrite:

```bash
cat > ~/projects/Consilium/scripts/check-tribune-staleness.py <<'PY'
#!/usr/bin/env python3
"""
Post-migration staleness check for tribune — three check classes over source
tree (skills/tribune/) and plugin cache mirror. All banned-regex matches are
case-insensitive.

1. Banned-regex scan: detects stale references — both the pre-existing set
   (Jesse, Claude-as-author, superpowers markers, forbidden external-skill
   references) AND the post-migration set (legacy doctrine paths, graphify
   tokens, ~/.codex/agents).
2. Reference existence: every referenced file/dir/skill exists.
   - $CONSILIUM_DOCS/doctrine/<...> refs resolve against the doctrine tree
     (both `.md` files and trailing-slash directory references).
   - medusa-dev:<skill> refs resolve via installed_plugins.json -> installPath
     + cache filesystem check under <installPath>/skills/<skill-name>/.
3. Test-writing smell scan: guards against tribune SKILL regressing into
   production-test / TDD discipline (that belongs to Legatus/Soldier, not
   Medicus).

Usage:
    python3 scripts/check-tribune-staleness.py          # report (exit 0 clean / 1 findings)
    python3 scripts/check-tribune-staleness.py --verbose # report + unified matches
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parent.parent
TRIBUNE_DIR = REPO_ROOT / "skills" / "tribune"

CONSILIUM_DOCS = Path(os.environ.get("CONSILIUM_DOCS", Path.home() / "projects" / "consilium-docs"))
DOCTRINE_ROOT = CONSILIUM_DOCS / "doctrine"

PLUGINS_DIR = Path.home() / ".claude" / "plugins"
CACHE_DIR = PLUGINS_DIR / "cache"
INSTALLED_MANIFEST = PLUGINS_DIR / "installed_plugins.json"
TRIBUNE_CACHE_DIR = CACHE_DIR / "consilium-local" / "consilium" / "1.0.0" / "skills" / "tribune"

# Roots scanned by every check. Each root has a label used for finding prefixes
# so the reader can tell "this hit is in the source tree" from "this hit is in
# the cache mirror."
SCAN_ROOTS: list[tuple[Path, str]] = [
    (TRIBUNE_DIR, "src"),
    (TRIBUNE_CACHE_DIR, "cache"),
]

# Preserved from the tribune-reshape ship — guards against pre-reshape cruft
# re-appearing. Do NOT drop these without explicit Imperator direction.
PRE_EXISTING_BANS = [
    (r"\bJesse\b", "superpowers authorship reference"),
    (r"\bClaude\s+(wrote|authored|said)\b", "Claude-as-author reference"),
    (r"\bCLAUDE\.md\b", "CLAUDE.md referenced as if tribune owns it"),
    (r"superpowers[:-]", "superpowers provenance marker"),
    (r"\bconsilium:gladius\b", "external skill reference (should not appear in tribune)"),
    (r"\bconsilium:sententia\b", "external skill reference (should not appear in tribune)"),
    (r"\bconsilium:tribunal\b", "external skill reference (should not appear in tribune)"),
]

# Added by the consilium-docs migration (2026-04-24).
POST_MIGRATION_BANS = [
    (r"skills/tribune/references/", "legacy path — doctrine moved to $CONSILIUM_DOCS/doctrine/"),
    (r"skills/references/domain/", "legacy path — doctrine moved to $CONSILIUM_DOCS/doctrine/"),
    (r"docs/consilium/debugging-cases/", "legacy path — cases moved to $CONSILIUM_DOCS/cases/"),
    (r"\bgraphify\b|\bquery_graph\b|\bget_neighbors\b|mcp__graphify", "graphify was excised 2026-04-24"),
    (r"~/\.codex/agents/", "Claude-side should reference ~/.claude/agents/"),
]

BANNED_PATTERNS = PRE_EXISTING_BANS + POST_MIGRATION_BANS

ALLOWED_EXTERNAL_SKILLS = {
    "medusa-dev:building-with-medusa",
    "medusa-dev:building-storefronts",
    "medusa-dev:building-admin-dashboard-customizations",
}

MEDUSA_PLUGIN_KEY = "medusa-dev@medusa"

TEST_WRITING_SMELLS = [
    r"\bwrite\s+(a\s+)?failing\s+test\b",
    r"\bimplement.*test\s+first\b",
    r"\btdd\s+cycle\b",
]

# Doctrine references: `.md` files OR trailing-slash directory refs (e.g.,
# `$CONSILIUM_DOCS/doctrine/lane-guides/`). The trailing-slash form is required
# because Medicus iterates the lane-guides directory — a pin to a specific
# file would be more fragile than the directory reference.
DOCTRINE_FILE_REF = re.compile(r"\$CONSILIUM_DOCS/doctrine/([a-z0-9-]+(?:/[a-z0-9-]+)*\.md)")
DOCTRINE_DIR_REF = re.compile(r"\$CONSILIUM_DOCS/doctrine/([a-z0-9-]+(?:/[a-z0-9-]+)*)/(?!\S)")


def find_markdown_files(root: Path):
    if not root.is_dir():
        return
    for path in root.rglob("*.md"):
        yield path


def format_location(path: Path, root_label: str, line_num: int) -> str:
    try:
        rel = path.relative_to(REPO_ROOT)
    except ValueError:
        try:
            rel = Path("~") / path.relative_to(Path.home())
        except ValueError:
            rel = path
    return f"[{root_label}] {rel}:{line_num}"


def resolve_medusa_install_path():
    """
    Read installed_plugins.json and return (installPath as Path or None, error-or-None).

    Manifest shape (verified 2026-04-23):
      { "version": 2, "plugins": { "<plugin-key>": [ { "installPath": "...", ... } ], ... } }
    """
    if not INSTALLED_MANIFEST.exists():
        return None, f"MANIFEST_MISSING: {INSTALLED_MANIFEST}"
    try:
        manifest = json.loads(INSTALLED_MANIFEST.read_text())
    except (json.JSONDecodeError, OSError) as e:
        return None, f"MANIFEST_READ_FAILED: {INSTALLED_MANIFEST} — {e}"

    plugins = manifest.get("plugins", {})
    entries = plugins.get(MEDUSA_PLUGIN_KEY)
    if not entries:
        return None, f"PLUGIN_NOT_INSTALLED: {MEDUSA_PLUGIN_KEY} not present in manifest"
    install_path = entries[0].get("installPath")
    if not install_path:
        return None, f"MANIFEST_MALFORMED: {MEDUSA_PLUGIN_KEY} entry has no installPath"
    return Path(install_path), None


def check_banned_regex():
    findings = []
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for pattern, description in BANNED_PATTERNS:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, label, line_num)
                    findings.append(
                        f"BANNED_REGEX: {loc} — {description} (matched: {match.group(0)!r})"
                    )
    return findings


def check_reference_existence():
    findings = []

    # Doctrine file + directory refs (src + cache)
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for match in DOCTRINE_FILE_REF.finditer(text):
                ref_path = DOCTRINE_ROOT / match.group(1)
                if not ref_path.exists():
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, label, line_num)
                    findings.append(
                        f"MISSING_DOCTRINE_FILE: {loc} — {match.group(0)} names {ref_path} (does not exist)"
                    )
            for match in DOCTRINE_DIR_REF.finditer(text):
                # Skip DOCTRINE_FILE_REF collisions (the file pattern is a proper subset)
                if match.group(1).endswith(".md"):
                    continue
                ref_path = DOCTRINE_ROOT / match.group(1)
                if not ref_path.is_dir():
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, label, line_num)
                    findings.append(
                        f"MISSING_DOCTRINE_DIR: {loc} — {match.group(0)} names {ref_path} (not a directory)"
                    )

    # Medusa-dev allowlist + cache resolution (src + cache)
    medusa_install_path, medusa_err = resolve_medusa_install_path()
    if medusa_err:
        findings.append(medusa_err)

    skill_ref_pattern = re.compile(r"medusa-dev:([a-z-]+)")
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for match in skill_ref_pattern.finditer(text):
                skill_name = f"medusa-dev:{match.group(1)}"
                line_num = text[: match.start()].count("\n") + 1
                loc = format_location(md, label, line_num)
                if skill_name not in ALLOWED_EXTERNAL_SKILLS:
                    findings.append(
                        f"UNKNOWN_EXTERNAL_SKILL: {loc} — {skill_name} not in allowlist "
                        f"{sorted(ALLOWED_EXTERNAL_SKILLS)}"
                    )
                    continue
                if medusa_install_path is None:
                    continue
                skill_dir = medusa_install_path / "skills" / match.group(1)
                if not skill_dir.is_dir():
                    findings.append(
                        f"UNRESOLVED_MEDUSA_SKILL: {loc} — {skill_name} expected at "
                        f"{skill_dir} (per installed_plugins.json) but directory missing"
                    )

    if not DOCTRINE_ROOT.is_dir():
        findings.append(f"DOCTRINE_MISSING: {DOCTRINE_ROOT} is not a directory")

    return findings


def check_test_writing_smell():
    findings = []
    for root, label in SCAN_ROOTS:
        for md in find_markdown_files(root):
            text = md.read_text()
            for pattern in TEST_WRITING_SMELLS:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    line_num = text[: match.start()].count("\n") + 1
                    loc = format_location(md, label, line_num)
                    findings.append(
                        f"TEST_WRITING_SMELL: {loc} — test-writing guidance does not "
                        f"belong in tribune (matched: {match.group(0)!r})"
                    )
    return findings


def main():
    verbose = "--verbose" in sys.argv

    print("=== Tribune Staleness Check ===")
    print(f"Repo root: {REPO_ROOT}")
    print(f"Consilium docs: {CONSILIUM_DOCS}")
    print(f"Scanning: {TRIBUNE_DIR} (src) + {TRIBUNE_CACHE_DIR} (cache)")
    print(f"Plugin manifest: {INSTALLED_MANIFEST}")
    print()

    all_findings = []

    print("1. Banned-regex scan (pre-existing + post-migration; case-insensitive; src + cache)...")
    findings = check_banned_regex()
    all_findings.extend(findings)
    print(f"   {len(findings)} finding(s)")

    print("2. Reference existence check (doctrine files + doctrine dirs + medusa-dev cache)...")
    findings = check_reference_existence()
    all_findings.extend(findings)
    print(f"   {len(findings)} finding(s)")

    print("3. Test-writing smell check (src + cache)...")
    findings = check_test_writing_smell()
    all_findings.extend(findings)
    print(f"   {len(findings)} finding(s)")

    print()
    if all_findings:
        print(f"=== {len(all_findings)} finding(s) ===")
        for finding in all_findings:
            print(f"  - {finding}")
        sys.exit(1)
    else:
        print("=== Clean ===")
        sys.exit(0)


if __name__ == "__main__":
    main()
PY
chmod +x ~/projects/Consilium/scripts/check-tribune-staleness.py
```

- [ ] **Step 3: Test-run the reframed script**

```bash
python3 ~/projects/Consilium/scripts/check-tribune-staleness.py
echo "exit code: $?"
```

**Expect non-zero exit at this stage.** The cross-ref audit (Task 27), the tribune SKILL edit (Task 20), and the cache re-population (Task 28) have not yet landed, so legacy paths and graphify tokens still appear in the scanned text. The Legatus notes the exit code and proceeds — final validation at Task 30 must return zero. Do NOT pipe the invocation through `|| echo ...` — that masks the exit code and obscures what the later tasks must fix.

- [ ] **Step 4: Verify refresh-graph.sh is gone**

```bash
ls ~/projects/Consilium/scripts/
```

Expected: no `refresh-graph.sh`.

---

### Task 26: Rewrite `known-gaps.md:3` graphify reference in new doctrine location + update CLAUDE.md + CONSILIUM-VISION.md

> **Confidence: High** — three small surgical edits.

**Files:**
- Modify: `~/projects/consilium-docs/doctrine/known-gaps.md` (line 3)
- Modify: `~/projects/Consilium/CLAUDE.md`
- Modify: `~/projects/Consilium/docs/CONSILIUM-VISION.md`

- [ ] **Step 1: Fix known-gaps.md line 3 + verify**

Current line 3 in `~/projects/consilium-docs/doctrine/known-gaps.md` contains the phrase `"available to any verifier via graphify"` (verified against the repo pre-migration). Apply the surgical edit:

Find:
> `"available to any verifier via graphify"`

Replace with:
> `"read by any verifier directly from $CONSILIUM_DOCS/doctrine/known-gaps.md"`

If the Edit tool's literal-match call fails to find that exact phrase, the file has drifted — grep first:

```bash
rg -n "via graphify" ~/projects/consilium-docs/doctrine/known-gaps.md
```

Then fit the replacement to the actual text. After editing, confirm graphify is gone from this file:

```bash
rg -c "graphify" ~/projects/consilium-docs/doctrine/known-gaps.md
```

Expected: `0`.

- [ ] **Step 2: Update CLAUDE.md**

Find the `# graphify` section and remove it entirely. Find the "Post-plan graphify action" bullet in Maintenance and remove it. Find any references to the `/graphify` skill and remove them.

Add new Maintenance bullets:

```markdown
**`$CONSILIUM_DOCS` env var.** The Medicus, Consul, Edicts, Legion, and March SKILLs resolve the consilium-docs repo via `$CONSILIUM_DOCS` (fallback `$HOME/projects/consilium-docs`). If consilium-docs lives anywhere other than `~/projects/consilium-docs`, export the env var in your shell profile:

```bash
export CONSILIUM_DOCS=/absolute/path/to/consilium-docs
```

A missing env var with no fallback match halts any Consilium agent with a clear error.

**Cache sync — expanded scope.** After editing any SKILL, persona, or verification template, sync the plugin cache (full-tree rsync keeps every Consilium skill mirror current, not just the 5 edited in the migration):

```bash
rsync -a --delete ~/projects/Consilium/skills/ ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/
```
```

- [ ] **Step 3: Update CONSILIUM-VISION.md**

Find any graphify references in VISION.md and remove them. Add a Case Folder Model section (short — defers concrete rules to `$CONSILIUM_DOCS/CONVENTIONS.md`):

```markdown
## Case Folder Model

Every Consilium artifact — specs, plans, debugging cases, reference docs, handoffs, retros — lives inside a case folder at `$CONSILIUM_DOCS/cases/<date>-<slug>/`. Bugs are small cases (2-3 files); features are large cases (many files across many sessions). See `$CONSILIUM_DOCS/CONVENTIONS.md` for concrete file-naming, STATUS.md schema, and the 8-state case-lifecycle machine.

Doctrine (known-gaps, lane guides, packet template, voice + brand principles) lives at `$CONSILIUM_DOCS/doctrine/`, read by direct file access — graphify was excised 2026-04-24 after proving unreliable.
```

- [ ] **Step 4: Verify**

```bash
rg -n "graphify" ~/projects/Consilium/CLAUDE.md ~/projects/Consilium/docs/CONSILIUM-VISION.md
rg -n "graphify" ~/projects/consilium-docs/doctrine/known-gaps.md
```

Expected: first two show no hits (or only historical/archival mentions like "graphify excised"); third shows no hits.

---

### Task 27: Cross-reference audit — personas + verification + doctrine + user-scope agents

> **Confidence: Medium** — audit scope is broad but pattern is mechanical.

**Scope:** Claude-side surfaces only. `~/.codex/agents/` is Codex-fork territory and explicitly out of scope (tracked separately in the Codex-adoption case bootstrapped at Task 29). Migrated case content under `$CONSILIUM_DOCS/cases/2026-04-24-consilium-docs/{spec.md,plan.md}` is ALSO excluded — this spec and plan deliberately quote the legacy paths (the migration is the subject, not a bug).

**Files:**
- Modify: any file under `~/projects/Consilium/skills/references/personas/`, `~/projects/Consilium/skills/references/verification/`, `~/projects/consilium-docs/doctrine/`, or `~/.claude/agents/consilium-*.md` that carries bare-filename, legacy-path, or misrouted-path references.

- [ ] **Step 1: Find every candidate reference across the audit surfaces**

```bash
rg -n "skills/tribune/references|skills/references/domain|docs/consilium/debugging-cases|~/\.codex/agents" \
  ~/projects/Consilium/skills/references/personas/ \
  ~/projects/Consilium/skills/references/verification/ \
  ~/projects/consilium-docs/doctrine/ \
  ~/.claude/agents/consilium-censor.md \
  ~/.claude/agents/consilium-praetor.md \
  ~/.claude/agents/consilium-provocator.md \
  ~/.claude/agents/consilium-tribunus.md \
  ~/.claude/agents/consilium-soldier.md \
  ~/.claude/agents/consilium-scout.md
```

Record every hit. User-scope agents are in scope because drift-sync (Task 28) only propagates the Codex block between `# The Codex of the Consilium` and `## Operational Notes` — any path references in frontmatter, `## Operational Notes`, or body prose outside that block must be fixed by this audit.

- [ ] **Step 2: Also find bare-filename refs (doctrine files referenced without path prefix)**

```bash
rg -n "(?:known-gaps\.md|lane-classification\.md|diagnosis-packet\.md|fix-thresholds\.md|known-gaps-protocol\.md)" \
  ~/projects/Consilium/skills/references/personas/ \
  ~/projects/Consilium/skills/references/verification/ \
  ~/projects/consilium-docs/doctrine/ \
  ~/.claude/agents/consilium-censor.md \
  ~/.claude/agents/consilium-praetor.md \
  ~/.claude/agents/consilium-provocator.md \
  ~/.claude/agents/consilium-tribunus.md \
  ~/.claude/agents/consilium-soldier.md \
  ~/.claude/agents/consilium-scout.md \
  | rg -v "\$CONSILIUM_DOCS/doctrine"
```

This surfaces bare-filename refs that DON'T already carry the `$CONSILIUM_DOCS/doctrine/` prefix. Some are legitimate co-location refs inside `doctrine/` (same-dir references); others are cross-directory and need the prefix.

- [ ] **Step 3: Classify each hit**

For each hit from Steps 1 + 2:

- **Legacy path (`skills/tribune/references/*` or `skills/references/domain/*`)** → rewrite to `$CONSILIUM_DOCS/doctrine/<filename>`.
- **Bare filename inside `doctrine/`** referring to a SIBLING file in the same dir → leave unchanged (co-location).
- **Bare filename inside `doctrine/`** referring to a file in a DIFFERENT dir (e.g., `lane-guides/storefront-debugging.md` references `known-gaps.md` at doctrine root, OR `domain/MANIFEST.md` references the promoted `known-gaps.md` as a sibling when it now lives one level up) → rewrite to `$CONSILIUM_DOCS/doctrine/known-gaps.md`. Explicitly verify `domain/MANIFEST.md` row for `known-gaps.md` carries the prefixed path, since `known-gaps.md` was promoted out of `domain/` in Task 6 Step 2.
- **Bare filename outside `doctrine/`** (e.g., in `personas/`, `verification/`, or user-scope agent bodies) → rewrite to `$CONSILIUM_DOCS/doctrine/<filename>`.
- **Misrouted `~/.codex/agents/`** in Claude-fork files → rewrite to `~/.claude/agents/`.
- **Debugging-cases legacy path** → rewrite to `$CONSILIUM_DOCS/cases/`.

- [ ] **Step 4: Apply rewrites with Edit tool** — one per hit, targeted.

- [ ] **Step 5: Verify**

```bash
rg -n "skills/tribune/references|skills/references/domain|docs/consilium/debugging-cases|~/\.codex/agents" \
  ~/projects/Consilium/skills/references/personas/ \
  ~/projects/Consilium/skills/references/verification/ \
  ~/projects/consilium-docs/doctrine/ \
  ~/.claude/agents/consilium-censor.md \
  ~/.claude/agents/consilium-praetor.md \
  ~/.claude/agents/consilium-provocator.md \
  ~/.claude/agents/consilium-tribunus.md \
  ~/.claude/agents/consilium-soldier.md \
  ~/.claude/agents/consilium-scout.md
```

Expected: 0 hits (or, hits only inside explicit historical context like retro notes describing what was migrated). If hits appear in the migrated case content (`$CONSILIUM_DOCS/cases/2026-04-24-consilium-docs/{spec.md,plan.md}`), they are by design — the case content describes the migration and quotes the legacy paths. Those paths are NOT in the audit scope (per the task's scope note above).

---

### Task 28: Run drift-sync + re-populate plugin cache (full-tree rsync)

> **Confidence: High** — mechanical sync operations. Re-population uses a SINGLE rsync against the entire `skills/` tree rather than per-file cp, so every Consilium skill (not just the 5 migration-edited SKILLs) returns to the cache. Stage 2's `rm -rf skills/` nuked audit/, castra/, forge/, gladius/, phalanx/, sententia/, tribunal/, triumph/ — which still exist in source and must be restored.

**Files:**
- Modify: `~/.claude/agents/consilium-{censor,praetor,provocator,tribunus,soldier}.md` (via drift-sync; Codex block only)
- Create/modify: `~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/` subtree (full-tree rsync)

- [ ] **Step 1: Pre-sync guard — confirm canonical Codex is non-empty before sync**

```bash
[ -s ~/projects/Consilium/skills/references/personas/consilium-codex.md ] || { echo "canonical Codex missing or empty — sync aborted to avoid propagating emptiness to 5 user-scope agents"; exit 1; }
```

Expected: no output (exit 0). If non-zero, HALT and investigate Task 23's edits before proceeding.

- [ ] **Step 2: Propagate canonical persona edits to user-scope agents**

```bash
python3 ~/projects/Consilium/scripts/check-codex-drift.py --sync
```

Expected: reports drift count and writes fixes. Then verify:

```bash
python3 ~/projects/Consilium/scripts/check-codex-drift.py
```

Expected: `All 5 agents in sync with canonical Codex.`

> **Note on drift-sync scope.** `check-codex-drift.py --sync` only propagates the block between `# The Codex of the Consilium` and `## Operational Notes` — it does NOT edit frontmatter `tools:` allowlists, `mcpServers:` lists, or `## Operational Notes` body prose. Any graphify or legacy-path references in those regions are handled by the user-scope-agent surgical edits in Task 23.5 and the cross-reference audit in Task 27. This task's sync is scoped precisely to the Codex block — do not expand it.

- [ ] **Step 3: Full-tree rsync from source to cache**

```bash
mkdir -p ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
rsync -a --delete ~/projects/Consilium/skills/ \
  ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/
```

This restores every Consilium skill subtree — including audit/, castra/, forge/, gladius/, phalanx/, sententia/, tribunal/, triumph/ that Stage 2 nuked — plus the 5 migration-edited SKILLs and the implementer-prompt.md under legion/.

- [ ] **Step 4: Verify cache mirrors the source (whole tree)**

```bash
diff -rq ~/projects/Consilium/skills/ \
  ~/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/
```

Expected: no differences reported for any file. If `diff` surfaces a path missing from one side, re-run Step 3's rsync. `--delete` on rsync removes cache-only orphans; any remaining drift is a source-tree issue.

---

### Task 29: Bootstrap Codex-adoption tracker case + INDEX banner

> **Confidence: High** — uses `case-new` script + INDEX edit with comment-delimited markers.

**Files:**
- Create: `~/projects/consilium-docs/cases/<today>-codex-consilium-docs-adoption/`
- Modify: `~/projects/consilium-docs/INDEX.md`

- [ ] **Step 1: Create the adoption case**

```bash
cd ~/projects/consilium-docs
scripts/case-new codex-consilium-docs-adoption --target consilium --agent codex
```

Expected: prints path to new case folder. Verify:

```bash
ls ~/projects/consilium-docs/cases/*-codex-consilium-docs-adoption/
```

- [ ] **Step 2: Replace the case's spec.md with a real spec stub**

```bash
# Find the case folder (date-prefixed)
case_folder=$(ls -d ~/projects/consilium-docs/cases/*-codex-consilium-docs-adoption)
case_folder_name=$(basename "$case_folder")
cat > "$case_folder/spec.md" <<EOF
# codex-consilium-docs-adoption — Spec

## Goal

Mirror Claude-Consilium's consilium-docs migration on the Codex-Consilium fork. Bring Codex agent surfaces into alignment with \`\$CONSILIUM_DOCS\` resolution + case-folder conventions + 8-state machine + graphify excision.

## Scope

Imperator-owned. Claude-side is complete as of this case's open (Stage 5 commit of the parent consilium-docs migration). Codex-side needs the equivalent edits applied to the Codex fork's agent surfaces.

See Claude-side execution at \`\$CONSILIUM_DOCS/cases/2026-04-24-consilium-docs/plan.md\` for the pattern to mirror.

## Codex-side breakage known to exist as of this case open

The Claude-side migration removed \`skills/tribune/references/\` and \`skills/references/domain/\` from the Consilium repo. Codex-Consilium agents at \`~/.codex/agents/consilium-*.toml\` still reference those paths in their dispatch rules. Until Codex-side adoption lands:

- **Codex WRITES to old paths.** Specs/plans from Codex sessions land in \`Consilium-codex/docs/consilium/...\` (the forked tree), NOT in \`\$CONSILIUM_DOCS/cases/...\`. Migrate them manually case-by-case.
- **Codex READS from old paths that no longer exist in the Claude-Consilium source.** Codex dispatch rules pointing at \`skills/tribune/references/\` or \`skills/references/domain/\` will fail or serve empty content. **Recommended: halt \`/tribune\`, \`/consul\`, \`/edicts\` invocations on the Codex fork until this adoption case closes.** If that is not feasible, apply a targeted compatibility shim in Codex's local fork (symlink or stub doc) referencing the new \`\$CONSILIUM_DOCS/doctrine/\` paths — but that is a workaround, not the adoption.

## Success criteria

- Codex-Consilium SKILLs carry Phase 0 blocks resolving \`\$CONSILIUM_DOCS\` with the same three-layer check (dir-exists + CONVENTIONS-marker-grep + migration-marker absence).
- Codex-Consilium persona files + dispatch templates strip graphify references.
- Codex writes to \`\$CONSILIUM_DOCS/cases/<slug>/...\`, not to a forked \`docs/consilium/...\` directory.
- Codex reads doctrine from \`\$CONSILIUM_DOCS/doctrine/\`, not from legacy \`skills/tribune/references/\` or \`skills/references/domain/\` paths.
- INDEX.md banner removed when case closes.

## Historical cross-references preserved as-is

Migrated closed-case plans (e.g., \`\$CONSILIUM_DOCS/cases/2026-04-09-consilium-foundation/\*.md\`) carry internal references like \`Spec: docs/consilium/specs/<name>-design.md\`. Those paths no longer exist — the referenced specs live in the same case folder. These references are **preserved as historical artifacts**; they are not rewritten because the cases are closed and the references reflect the spec-plan pair state at shipping time.
EOF
```

- [ ] **Step 3: Add banner to INDEX.md with comment markers (dynamic date + Codex read-side warning)**

Edit `~/projects/consilium-docs/INDEX.md` — find the `## Banners` heading (from Stage 1 stub) and replace its placeholder using the `$case_folder_name` variable resolved in Step 2:

```bash
banner_block=$(cat <<BANNER
## Banners

<!-- banner:codex-adoption-pending -->
> ⚠ **Codex-side adoption pending.** Codex-Consilium still writes to old paths AND reads from \`skills/tribune/references/\` / \`skills/references/domain/\` which no longer exist in the Claude-Consilium source. Halt Codex Consilium invocations (\`/tribune\`, \`/consul\`, \`/edicts\`) until adoption ships, or apply a compatibility shim in the Codex fork. Tracked at \`cases/$case_folder_name/\`.
<!-- /banner:codex-adoption-pending -->
BANNER
)

python3 -c "
import pathlib, re
p = pathlib.Path.home() / 'projects' / 'consilium-docs' / 'INDEX.md'
text = p.read_text()
block = '''$banner_block'''
# Replace everything from '## Banners' to the next top-level '##' or EOF
text = re.sub(r'## Banners.*?(?=\n## |\Z)', block + '\n\n', text, flags=re.DOTALL)
p.write_text(text)
print('banner written')
"
```

The comment delimiters enable programmatic removal. When the adoption case ships, its `case-close` flow runs:

```bash
sed -i '' '/<!-- banner:codex-adoption-pending -->/,/<!-- \/banner:codex-adoption-pending -->/d' "$CONSILIUM_DOCS/INDEX.md"
```

(BSD sed on macOS requires the `''` empty-string after `-i`; GNU sed on Linux does not. Document whichever is appropriate for the Imperator's platform.)

- [ ] **Step 4: Verify banner landed with correct case-folder date**

```bash
rg -c "banner:codex-adoption-pending" ~/projects/consilium-docs/INDEX.md
```

Expected: 2 (open + close markers).

```bash
rg "cases/.*-codex-consilium-docs-adoption" ~/projects/consilium-docs/INDEX.md
```

Expected: one hit — the path reference inside the banner, matching the actual `$case_folder_name` (whatever today's date resolved to).

---

### Task 30: Run validation (staleness script + drift check) — expect clean

> **Confidence: High** — this is the gate before marker removal and commit.

**Files:** None — validation only.

- [ ] **Step 1: Run reframed staleness script**

```bash
python3 ~/projects/Consilium/scripts/check-tribune-staleness.py
```

Expected: `=== Clean ===`. If findings appear, diagnose and fix before proceeding. Common causes: missed cross-reference in Task 27, or tribune SKILL still carries a legacy path from Task 20.

- [ ] **Step 2: Run drift check**

```bash
python3 ~/projects/Consilium/scripts/check-codex-drift.py
```

Expected: `All 5 agents in sync with canonical Codex.`

If either validation fails, HALT here. Fix the finding. Re-run. Do not proceed to Task 31 until both are clean — the forbidden window must not close over a broken state.

---

### Task 31: Remove marker file + final atomic commit in both repos

> **Confidence: High** — this is the commit that closes the forbidden window.

**Files:**
- Delete: `~/projects/consilium-docs/.migration-in-progress`

- [ ] **Step 1: Remove the migration-in-progress marker**

```bash
rm ~/projects/consilium-docs/.migration-in-progress
```

- [ ] **Step 2: Verify marker is gone**

```bash
ls ~/projects/consilium-docs/.migration-in-progress 2>&1
```

Expected: `No such file or directory` (error).

- [ ] **Step 3: Commit in consilium-docs (Codex-adoption case + INDEX banner)**

```bash
cd ~/projects/consilium-docs
git add -A
git commit -m "open codex-consilium-docs-adoption tracker case + INDEX banner; close migration window (Stage 5)"
```

- [ ] **Step 4: Commit in Consilium (all agent-surface edits + staleness rewrite + refresh-graph.sh delete)**

```bash
cd ~/projects/Consilium
git add -A
git commit -m "repoint agent surfaces to consilium-docs; excise graphify (Stage 5)

- Phase 0 blocks added to 5 SKILLs (consul, edicts, tribune, legion, march).
- Graphify excised from 16 surfaces: 5 SKILLs + implementer-prompt + 5 personas +
  protocol + 5 templates + known-gaps.md + CLAUDE.md + CONSILIUM-VISION.md.
- Tribune SKILL Phase 1 scan rewritten to walk \$CONSILIUM_DOCS/cases/*/STATUS.md.
- Staleness script reframed with 3 explicit decisions; refresh-graph.sh deleted.
- Pre-existing ~/.codex/agents/ cruft fixed in consul + edicts SKILLs.
- Cross-reference audit complete across personas, verification, and doctrine.
- Plugin cache re-populated (SKILLs + personas + verification rsync).
- Drift-check --sync propagated persona edits to 5 user-scope agents.
- Staleness + drift checks clean.

Forbidden window closed. Agents write to \$CONSILIUM_DOCS on next invocation.
Codex-side adoption tracked at cases/2026-04-24-codex-consilium-docs-adoption/."
```

- [ ] **Step 5: Verify system whole — smoke-test Phase 0 resolution**

```bash
# Simulate the Phase 0 check from a target-repo cwd
cd /tmp
export CONSILIUM_DOCS="$HOME/projects/consilium-docs"
[ -d "$CONSILIUM_DOCS" ] && \
  [ -f "$CONSILIUM_DOCS/CONVENTIONS.md" ] && \
  head -1 "$CONSILIUM_DOCS/CONVENTIONS.md" | grep -q "consilium-docs CONVENTIONS" && \
  [ ! -f "$CONSILIUM_DOCS/.migration-in-progress" ] && \
  echo "Phase 0 passes" || echo "Phase 0 FAILS"
```

Expected: `Phase 0 passes`.

- [ ] **Step 6: Final report to Imperator**

```
Consilium-docs migration complete.

Stages: 5 of 5 shipped.
Tasks: 32 of 32 (incl. T23.5 user-scope agent surgical edits).
Commits: 7 (consilium-docs: 4; Consilium: 3).
Graphify excision: all Claude-side surfaces cleaned (5 SKILLs + implementer-prompt + 5 canonical personas + 6 user-scope agents × 3 surfaces each + protocol + 5 templates + known-gaps.md + CLAUDE.md + CONSILIUM-VISION.md); verified 0 remaining references.
State machine: migrated from body-prose 'Status: X' to lowercase YAML 'status: x' in per-case STATUS.md; state strings unchanged.
Forbidden window: opened Stage 2, closed Stage 5.
Codex adoption tracker: cases/<date>-codex-consilium-docs-adoption/ (banner visible in INDEX; warns of Codex read-side breakage).

Next Consul / Medicus / Legion / March invocation reads doctrine from \$CONSILIUM_DOCS/doctrine/
and writes artifacts to \$CONSILIUM_DOCS/cases/<slug>/.

Retro for this migration case (2026-04-24-consilium-docs) is mandatory —
run case-close when you're ready to reflect.
```

---

## Execution Mode Recommendation

> **Strongly recommend: `consilium:march` (solo Legatus execution in this session).**

Rationale: Stage 2's forbidden-window marker blocks any Consilium agent invoked from a new session (including Tribunus patrols and Soldier dispatches). Legion-mode would attempt Tribunus mini-checkits between tasks, each of which would trigger Phase 0 and halt. The migrating Legatus must run Stages 2-5 in one continuous session without dispatching fresh agents. `consilium:march` matches this constraint exactly: the Legatus executes the plan himself, presenting checkpoints for Imperator review at stage boundaries.

**If the Imperator picks legion mode anyway:** the Legatus must instruct the Tribunus explicitly at Tribunus dispatch time that this is a migration-in-progress session and to NOT perform Phase 0 check — but this defeats the forbidden-window defense. Not recommended.

## Post-Plan Follow-Ups (Imperator-tracked, not in this plan)

1. **Codex-side adoption.** Imperator runs sessions of the `codex-consilium-docs-adoption` case to mirror Claude-side edits on the Codex fork.
2. **Retro for the consilium-docs case itself** (`2026-04-24-consilium-docs`). Mandatory for features — `case-close` blocks until retro.md is filled.
3. **Future `case-scan-refs` script** for automatic `referenced`-state detection (currently manual-only).
4. **Future `case-archive` script** when shipped-case volume warrants it.
