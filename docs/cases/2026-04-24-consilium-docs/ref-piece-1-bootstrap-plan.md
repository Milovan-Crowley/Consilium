# Consilium Docs Repo Piece 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `consilium:march` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `~/projects/consilium-docs` as a non-destructive skeleton repo with lifecycle scripts, smoke tests, and cutover preflight inventory for the later Piece 2 migration.

**Architecture:** Piece 1 does not repoint, delete, purge, or edit any runtime Consilium surface. It creates the new docs repo, proves the case scripts work, records current source/cache/user-agent state, and leaves Claude-Consilium running exactly as it did before.

**Tech Stack:** Bash scripts, Markdown docs, local git. No Node/Python dependency is required for Piece 1.

---

## Critical Constraints

1. Do not edit `/Users/milovan/projects/Consilium/skills/**`.
2. Do not edit `/Users/milovan/.claude/agents/consilium-*.md`.
3. Do not edit or purge `/Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/**`.
4. Do not create `~/projects/consilium-docs/.migration-in-progress`.
5. Do not delete `skills/references/domain/`, `skills/tribune/references/`, `graphify-source/`, or any legacy docs.
6. Do not repoint any Consilium skill or agent to `$CONSILIUM_DOCS`.

Piece 1 succeeds only if runtime-surface hashes still match at the end.

---

### Task 1: Preflight and Repo Skeleton

> **Confidence: High** — creates only a new repo and directories; no runtime paths touched.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/`
- Create: `/Users/milovan/projects/consilium-docs/{cases,doctrine,archive,scripts,preflight}/`

- [ ] **Step 1: Confirm this is a fresh Piece 1 run**

```bash
test ! -e /Users/milovan/projects/consilium-docs || {
  echo "/Users/milovan/projects/consilium-docs already exists. Halt and inspect before continuing."
  exit 1
}
```

- [ ] **Step 2: Create the directory tree**

```bash
mkdir -p /Users/milovan/projects/consilium-docs/{cases,doctrine,archive,scripts,preflight}
```

- [ ] **Step 3: Initialize git**

```bash
git -C /Users/milovan/projects/consilium-docs init
```

Expected: git initializes an empty repo at `/Users/milovan/projects/consilium-docs/.git/`.

- [ ] **Step 4: Verify no migration marker exists**

```bash
test ! -e /Users/milovan/projects/consilium-docs/.migration-in-progress
```

Expected: exit 0.

---

### Task 2: Write Skeleton Docs

> **Confidence: High** — content is static and intentionally minimal.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/CONVENTIONS.md`
- Create: `/Users/milovan/projects/consilium-docs/INDEX.md`
- Create: `/Users/milovan/projects/consilium-docs/README.md`
- Create: `/Users/milovan/projects/consilium-docs/.gitignore`
- Create: `/Users/milovan/projects/consilium-docs/cases/.gitkeep`
- Create: `/Users/milovan/projects/consilium-docs/doctrine/.gitkeep`
- Create: `/Users/milovan/projects/consilium-docs/archive/.gitkeep`

- [ ] **Step 1: Create `CONVENTIONS.md`**

Use `apply_patch` or an editor to create `/Users/milovan/projects/consilium-docs/CONVENTIONS.md` with:

```markdown
<!-- consilium-docs CONVENTIONS — do not remove this marker line -->
# Consilium Docs — Conventions

This file is the identity marker for `$CONSILIUM_DOCS` resolution and the authoritative rule doc for case-folder conventions, STATUS.md schema, state machine, and collision rules.

Piece 1 stub. Piece 2 will fold in the full migrated conventions after the guarded cutover begins.

## Case folder conventions

- One case per folder under `cases/`.
- Folder name: `YYYY-MM-DD-<slug>` using the first-session date.
- Every case has `STATUS.md`.
- Feature, infra, and idea cases use `spec.md`.
- Bug cases use `diagnosis.md`.
- Session 1 feature/infra plan uses `plan.md`.
- Later sessions use `session-NN-<topic>-spec.md` and `session-NN-<topic>-plan.md`.
- Reference docs use `ref-<topic>.md`.
- Handoffs use `handoff-NN-to-MM.md`.
- Feature retros are mandatory at close. Bug retros are optional but prompted.

## State machine

Allowed `status:` values:

- `draft`
- `rejected`
- `approved`
- `routed`
- `contained`
- `closed`
- `referenced`
- `abandoned`
```

- [ ] **Step 2: Create `INDEX.md`**

Create `/Users/milovan/projects/consilium-docs/INDEX.md` with:

```markdown
# Consilium Docs Index

Shared artifact + doctrine repo for Claude-Consilium and Codex-Consilium agents.

## Active work

Piece 1 bootstrap in progress. Runtime agents still use legacy paths until Piece 2 ships.

## Recently closed

None yet.

## Doctrine

Doctrine migration is deferred to Piece 2.

## Conventions

See `CONVENTIONS.md`.

## Banners

No banners yet. Piece 2 owns cutover/adoption banners.
```

- [ ] **Step 3: Create `README.md`**

Create `/Users/milovan/projects/consilium-docs/README.md` with:

```markdown
# consilium-docs

Shared home for Consilium artifacts and doctrine.

Piece 1 creates the skeleton only. Claude-Consilium and Codex-Consilium are not repointed here until the later guarded cutover.

Local-only git repo. No GitHub remote.

See:

- `INDEX.md` for navigation
- `CONVENTIONS.md` for case conventions
- `cases/` for case folders
- `doctrine/` for shared doctrine after Piece 2
- `archive/` for manually archived cases
- `scripts/` for lifecycle scripts
- `preflight/` for Piece 2 cutover inventory
```

- [ ] **Step 4: Create `.gitignore` and directory keep files**

```bash
printf '%s\n' '# Transient migration guard — Piece 2 creates/removes this only' '.migration-in-progress' > /Users/milovan/projects/consilium-docs/.gitignore
touch /Users/milovan/projects/consilium-docs/cases/.gitkeep
touch /Users/milovan/projects/consilium-docs/doctrine/.gitkeep
touch /Users/milovan/projects/consilium-docs/archive/.gitkeep
```

- [ ] **Step 5: Verify marker line**

```bash
head -1 /Users/milovan/projects/consilium-docs/CONVENTIONS.md | rg "consilium-docs CONVENTIONS"
```

Expected: one matching line.

---

### Task 3: Write Lifecycle Scripts

> **Confidence: High** — script behavior is fully specified by the verified split spec.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/scripts/case-new`
- Create: `/Users/milovan/projects/consilium-docs/scripts/case-session`
- Create: `/Users/milovan/projects/consilium-docs/scripts/case-close`

- [ ] **Step 1: Create `scripts/case-new`**

Create `/Users/milovan/projects/consilium-docs/scripts/case-new` with:

```bash
#!/usr/bin/env bash
set -eu

usage() {
  echo "Usage: case-new <slug> --target <divinipress-store|divinipress-backend|consilium|cross-repo> --type <feature|bug|infra|idea> [--agent <claude|codex|both>]" >&2
}

if [ "$#" -lt 1 ]; then
  usage
  exit 2
fi

slug="$1"
shift

target=""
agent="claude"
case_type=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target) target="${2:-}"; shift 2 ;;
    --agent) agent="${2:-}"; shift 2 ;;
    --type) case_type="${2:-}"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

case "$target" in
  divinipress-store|divinipress-backend|consilium|cross-repo) ;;
  "") echo "error: --target is required" >&2; usage; exit 2 ;;
  *) echo "error: invalid --target: $target" >&2; exit 2 ;;
esac

case "$agent" in
  claude|codex|both) ;;
  *) echo "error: invalid --agent: $agent" >&2; exit 2 ;;
esac

case "$case_type" in
  feature|bug|infra|idea) ;;
  "") echo "error: --type is required" >&2; usage; exit 2 ;;
  *) echo "error: invalid --type: $case_type" >&2; exit 2 ;;
esac

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
[ -d "$CONSILIUM_DOCS" ] || { echo "consilium-docs not found at $CONSILIUM_DOCS" >&2; exit 1; }

today=$(date +%Y-%m-%d)
cases_dir="$CONSILIUM_DOCS/cases"
mkdir -p "$cases_dir"

base_name="${today}-${slug}"
final_slug="$base_name"
n=2
while [ -d "$cases_dir/$final_slug" ]; do
  final_slug="${base_name}-${n}"
  n=$((n + 1))
done

case_path="$cases_dir/$final_slug"
mkdir -p "$case_path"

cat > "$case_path/STATUS.md" <<EOF
---
status: draft
opened: $today
target: $target
agent: $agent
type: $case_type
sessions: 1
current_session: 1
---

## Current state

Draft case created.

## What's next

- [ ] Fill the primary case artifact

## Open questions

(none yet)
EOF

if [ "$case_type" = "bug" ]; then
  cat > "$case_path/diagnosis.md" <<EOF
# $final_slug — Diagnosis

(Draft. Medicus writes the diagnosis packet here.)
EOF
else
  cat > "$case_path/spec.md" <<EOF
# $final_slug — Spec

(Draft. Consul writes the design here.)
EOF
fi

echo "$case_path"
```

- [ ] **Step 2: Create `scripts/case-session`**

Create `/Users/milovan/projects/consilium-docs/scripts/case-session` with:

```bash
#!/usr/bin/env bash
set -eu

if [ "$#" -lt 2 ]; then
  echo "Usage: case-session <case-folder-name> <topic>" >&2
  exit 2
fi

slug="$1"
topic="$2"

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
case_path="$CONSILIUM_DOCS/cases/$slug"
[ -d "$case_path" ] || { echo "case not found: $case_path" >&2; exit 1; }

if [ -f "$case_path/diagnosis.md" ] && [ ! -f "$case_path/spec.md" ]; then
  echo "bug cases do not use case-session: $slug" >&2
  exit 1
fi

max_n=0
for f in "$case_path"/session-[0-9][0-9]-*.md; do
  [ -e "$f" ] || continue
  fname=$(basename "$f")
  n="${fname#session-}"
  n="${n%%-*}"
  n=$((10#$n))
  if [ "$n" -gt "$max_n" ]; then
    max_n="$n"
  fi
done

if [ "$max_n" -eq 0 ]; then
  if [ -f "$case_path/spec.md" ] || [ -f "$case_path/plan.md" ]; then
    next_n=2
  else
    next_n=1
  fi
else
  next_n=$((max_n + 1))
fi

padded_n=$(printf "%02d" "$next_n")
session_spec="$case_path/session-${padded_n}-${topic}-spec.md"

if [ -e "$session_spec" ]; then
  echo "file already exists: $session_spec" >&2
  exit 1
fi

cat > "$session_spec" <<EOF
# $slug — Session $padded_n: $topic

(Draft. Consul writes the session-scoped spec here.)
EOF

status="$case_path/STATUS.md"
if [ -f "$status" ]; then
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
```

- [ ] **Step 3: Create `scripts/case-close`**

Create `/Users/milovan/projects/consilium-docs/scripts/case-close` with:

```bash
#!/usr/bin/env bash
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: case-close <case-folder-name> [--skip-retro]" >&2
  exit 2
fi

slug="$1"
shift

skip_retro=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-retro) skip_retro=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

CONSILIUM_DOCS="${CONSILIUM_DOCS:-$HOME/projects/consilium-docs}"
case_path="$CONSILIUM_DOCS/cases/$slug"
[ -d "$case_path" ] || { echo "case not found: $case_path" >&2; exit 1; }

has_spec=0
has_diagnosis=0
[ -f "$case_path/spec.md" ] && has_spec=1
[ -f "$case_path/diagnosis.md" ] && has_diagnosis=1

if [ "$has_spec" -eq 1 ] && [ "$has_diagnosis" -eq 1 ]; then
  echo "ambiguous case shape: both spec.md and diagnosis.md exist" >&2
  exit 1
fi

if [ "$has_spec" -eq 0 ] && [ "$has_diagnosis" -eq 0 ]; then
  echo "unclassifiable case shape: neither spec.md nor diagnosis.md exists" >&2
  exit 1
fi

retro="$case_path/retro.md"

if [ "$has_spec" -eq 1 ]; then
  if [ ! -f "$retro" ]; then
    cat > "$retro" <<EOF
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
    echo "retro.md template written at $retro. Fill it in, then re-run case-close. Feature/infra/idea cases require retro." >&2
    exit 1
  fi
fi

if [ "$has_diagnosis" -eq 1 ]; then
  if [ ! -f "$retro" ] && [ "$skip_retro" -eq 0 ]; then
    cat > "$retro" <<EOF
# $slug — Retrospective

## Should this become a known-gap doctrine entry?

(yes/no + reasoning)

## Root cause summary

(one paragraph)
EOF
    echo "retro.md template written at $retro. Fill it in and re-run, or re-run with --skip-retro for bug cases." >&2
    exit 1
  fi
fi

status="$case_path/STATUS.md"
[ -f "$status" ] || { echo "STATUS.md not found: $status" >&2; exit 1; }

today=$(date +%Y-%m-%d)
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

echo "Case closed: $slug"
```

- [ ] **Step 4: Make scripts executable**

```bash
chmod +x /Users/milovan/projects/consilium-docs/scripts/case-new
chmod +x /Users/milovan/projects/consilium-docs/scripts/case-session
chmod +x /Users/milovan/projects/consilium-docs/scripts/case-close
```

---

### Task 4: Smoke-Test Lifecycle Scripts

> **Confidence: High** — tests cover happy paths and the two verified negative file-shape cases.

**Files:**
- Temporary create/delete: `/Users/milovan/projects/consilium-docs/cases/<today>-smoke-*`

- [ ] **Step 1: Set test variables**

```bash
export CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs
today=$(date +%Y-%m-%d)
```

- [ ] **Step 2: Feature case creates `spec.md`**

```bash
"$CONSILIUM_DOCS/scripts/case-new" smoke-feature --target consilium --agent claude --type feature
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-feature/STATUS.md"
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-feature/spec.md"
test ! -f "$CONSILIUM_DOCS/cases/${today}-smoke-feature/diagnosis.md"
```

- [ ] **Step 3: Bug case creates `diagnosis.md`**

```bash
"$CONSILIUM_DOCS/scripts/case-new" smoke-bug --target consilium --agent claude --type bug
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-bug/STATUS.md"
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-bug/diagnosis.md"
test ! -f "$CONSILIUM_DOCS/cases/${today}-smoke-bug/spec.md"
```

- [ ] **Step 4: Collision disambiguation appends `-2`**

```bash
"$CONSILIUM_DOCS/scripts/case-new" smoke-feature --target consilium --agent claude --type feature
test -d "$CONSILIUM_DOCS/cases/${today}-smoke-feature-2"
```

- [ ] **Step 5: `case-session` advances implicit session 1 to session 2**

```bash
touch "$CONSILIUM_DOCS/cases/${today}-smoke-feature/plan.md"
"$CONSILIUM_DOCS/scripts/case-session" "${today}-smoke-feature" backend-adapter
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-feature/session-02-backend-adapter-spec.md"
rg -n '^sessions: 2$|^current_session: 2$' "$CONSILIUM_DOCS/cases/${today}-smoke-feature/STATUS.md"
```

- [ ] **Step 6: Feature close blocks until retro exists**

```bash
if "$CONSILIUM_DOCS/scripts/case-close" "${today}-smoke-feature"; then
  echo "expected feature close to fail until retro is filled" >&2
  exit 1
fi
test -f "$CONSILIUM_DOCS/cases/${today}-smoke-feature/retro.md"
```

- [ ] **Step 7: Bug close accepts `--skip-retro`**

```bash
"$CONSILIUM_DOCS/scripts/case-close" "${today}-smoke-bug" --skip-retro
rg -n '^status: closed$|^closed_at: ' "$CONSILIUM_DOCS/cases/${today}-smoke-bug/STATUS.md"
```

- [ ] **Step 8: Ambiguous case shape halts**

```bash
"$CONSILIUM_DOCS/scripts/case-new" smoke-ambiguous --target consilium --agent claude --type feature
touch "$CONSILIUM_DOCS/cases/${today}-smoke-ambiguous/diagnosis.md"
if "$CONSILIUM_DOCS/scripts/case-close" "${today}-smoke-ambiguous"; then
  echo "expected ambiguous case close to fail" >&2
  exit 1
fi
```

- [ ] **Step 9: Unclassifiable case shape halts**

```bash
"$CONSILIUM_DOCS/scripts/case-new" smoke-unclassifiable --target consilium --agent claude --type idea
rm "$CONSILIUM_DOCS/cases/${today}-smoke-unclassifiable/spec.md"
if "$CONSILIUM_DOCS/scripts/case-close" "${today}-smoke-unclassifiable"; then
  echo "expected unclassifiable case close to fail" >&2
  exit 1
fi
```

- [ ] **Step 10: Clean smoke cases**

```bash
rm -rf "$CONSILIUM_DOCS/cases/${today}-smoke-feature" \
  "$CONSILIUM_DOCS/cases/${today}-smoke-feature-2" \
  "$CONSILIUM_DOCS/cases/${today}-smoke-bug" \
  "$CONSILIUM_DOCS/cases/${today}-smoke-ambiguous" \
  "$CONSILIUM_DOCS/cases/${today}-smoke-unclassifiable"
```

---

### Task 5: Record Cutover Inventory and Runtime Hash Baseline

> **Confidence: High** — read-only inventory over existing source/cache/user-agent surfaces.

**Files:**
- Create: `/Users/milovan/projects/consilium-docs/preflight/2026-04-24-cutover-inventory.md`
- Create: `/Users/milovan/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256`

- [ ] **Step 1: Write the inventory**

```bash
export CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs
inventory="$CONSILIUM_DOCS/preflight/2026-04-24-cutover-inventory.md"
{
  echo "# Consilium Docs Cutover Inventory — 2026-04-24"
  echo
  echo "## Consilium Source State"
  echo
  echo "- repo: /Users/milovan/projects/Consilium"
  echo "- sha: $(git -C /Users/milovan/projects/Consilium rev-parse HEAD)"
  echo
  echo '```text'
  git -C /Users/milovan/projects/Consilium status --short
  echo '```'
  echo
  echo "## consilium-docs Preexistence"
  echo
  echo "- Created by Piece 1 in this run."
  echo
  echo "## Source Doctrine Paths"
  echo
  for p in \
    /Users/milovan/projects/Consilium/skills/references/domain \
    /Users/milovan/projects/Consilium/skills/tribune/references \
    /Users/milovan/projects/Consilium/graphify-source
  do
    echo
    echo "### $p"
    echo "- exists: $([ -d "$p" ] && echo yes || echo no)"
    echo "- markdown_count: $(rg --files "$p" 2>/dev/null | rg '\.md$' | wc -l | tr -d ' ')"
    rg --files "$p" 2>/dev/null | sort | sed 's#^#- #'
  done
  echo
  echo "## Historical Artifact Inputs"
  for p in \
    /Users/milovan/projects/Consilium/docs/consilium/specs \
    /Users/milovan/projects/Consilium/docs/consilium/plans \
    /Users/milovan/projects/Consilium/docs/ideas \
    /Users/milovan/projects/Consilium/docs/consilium/debugging-cases
  do
    echo
    echo "### $p"
    rg --files "$p" 2>/dev/null | sort | sed 's#^#- #'
  done
  echo
  echo "## User-Scope Agents"
  rg --files /Users/milovan/.claude/agents | rg '/consilium-[^/]+\.md$' | sort | sed 's#^#- #'
  echo
  echo "## Plugin Cache Runtime Files"
  for p in \
    /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md \
    /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md \
    /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium/ROADMAP.md \
    /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills
  do
    if [ -e "$p" ]; then
      echo "- $p"
    else
      echo "- MISSING: $p"
    fi
  done
  echo
  echo "## Piece 2 Known Hazards"
  echo
  echo "- Phase 0 marker guard must not pass against the Piece 1 skeleton before cutover."
  echo "- Piece 2 must create .migration-in-progress, then install guard-only source/cache edits, then verify Phase 0 halts before any repoint/delete/purge."
  echo "- User-scope agent edits need non-skippable frontmatter validation."
  echo "- Plugin cache sync must include root docs if root docs are edited."
} > "$inventory"
```

- [ ] **Step 2: Write runtime hash baseline**

```bash
export CONSILIUM_DOCS=/Users/milovan/projects/consilium-docs
shasum -a 256 \
  /Users/milovan/projects/Consilium/skills/consul/SKILL.md \
  /Users/milovan/projects/Consilium/skills/edicts/SKILL.md \
  /Users/milovan/projects/Consilium/skills/tribune/SKILL.md \
  /Users/milovan/projects/Consilium/skills/legion/SKILL.md \
  /Users/milovan/projects/Consilium/skills/march/SKILL.md \
  /Users/milovan/.claude/agents/consilium-*.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/CLAUDE.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/CONSILIUM-VISION.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/docs/consilium/ROADMAP.md \
  /Users/milovan/.claude/plugins/cache/consilium-local/consilium/1.0.0/skills/*/SKILL.md \
  | sort > "$CONSILIUM_DOCS/preflight/2026-04-24-runtime-surface-baseline.sha256"
```

- [ ] **Step 3: Verify inventory sections exist**

```bash
rg -n '^## (Consilium Source State|consilium-docs Preexistence|Source Doctrine Paths|Historical Artifact Inputs|User-Scope Agents|Plugin Cache Runtime Files|Piece 2 Known Hazards)$' \
  /Users/milovan/projects/consilium-docs/preflight/2026-04-24-cutover-inventory.md
```

Expected: seven section hits.

- [ ] **Step 4: Verify hashes currently pass**

```bash
shasum -a 256 -c /Users/milovan/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256
```

Expected: every listed runtime surface reports `OK`.

---

### Task 6: Commit and Final Verification

> **Confidence: High** — final gates prove Piece 1 stayed non-destructive.

**Files:**
- Modify: `/Users/milovan/projects/consilium-docs/.git/` via commit

- [ ] **Step 1: Verify no migration marker exists**

```bash
test ! -e /Users/milovan/projects/consilium-docs/.migration-in-progress
```

Expected: exit 0.

- [ ] **Step 2: Verify runtime hashes still pass**

```bash
shasum -a 256 -c /Users/milovan/projects/consilium-docs/preflight/2026-04-24-runtime-surface-baseline.sha256
```

Expected: every listed runtime surface reports `OK`. If any hash fails, halt and report the drift.

- [ ] **Step 3: Commit the new repo skeleton**

```bash
git -C /Users/milovan/projects/consilium-docs add -A
git -C /Users/milovan/projects/consilium-docs commit -m "initial consilium-docs skeleton and Piece 1 preflight"
```

- [ ] **Step 4: Verify new repo is clean**

```bash
git -C /Users/milovan/projects/consilium-docs status --short
```

Expected: no output.

- [ ] **Step 5: Verify Consilium runtime files were not changed**

```bash
git -C /Users/milovan/projects/Consilium status --short
```

Expected while this spec/edict are uncommitted: only these docs may appear:

```text
?? docs/consilium/specs/2026-04-24-consilium-docs-split-design.md
?? docs/consilium/plans/2026-04-24-consilium-docs-piece-1-bootstrap.md
?? docs/consilium/plans/2026-04-24-consilium-docs-piece-2-cutover.md
```

If the spec/edict were already committed before execution, expected output is empty.

- [ ] **Step 6: Final report**

Report:

- consilium-docs commit SHA
- path to `preflight/2026-04-24-cutover-inventory.md`
- path to `preflight/2026-04-24-runtime-surface-baseline.sha256`
- confirmation that `.migration-in-progress` is absent
- confirmation that runtime hashes passed after commit
