# ESLint 9 + Flat Config Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `yarn lint` in `divinipress-store` (broken by Next.js 16 upgrade) by migrating from ESLint 8 + legacy `.eslintrc.json` to ESLint 9 + flat config (`eslint.config.mjs`), and ship a `lint:changed` primitive that lints only branch-modified files.

**Architecture:** Six file paths touched on a `fix/lint-migration-eslint9` branch off `develop`. Single squash-merged commit at PR merge. Direct `eslint-config-next/core-web-vitals` flat-array import (no `FlatCompat`); Next 16's flat config provides `react`, `react-hooks`, `import` (with TS resolver), `jsx-a11y`, `@next/next`, `typescript-eslint`, and globals. Project-specific overrides preserved (rule disables, `import/order` `pathGroups`, `sort-imports`). `.worktrees/**` ignored (critical: prevents `eslint .` from recursing into sibling stacked worktrees). `e2e/**` lintable (per Imperator decision). `yarn lint` exit code 0 or 1 = pass; 2 = fail.

**Tech Stack:** Node 22.22.2 (matches Medusa backend pin), Yarn 4.3.1 (existing project pin), ESLint 9, `eslint-config-next@16`, `eslint-config-prettier@10` (`/flat` subpath), `eslint-plugin-prettier@5`, bash 3.2 (macOS default — script intentionally compatible).

---

## Pre-flight assumptions

The Legatus / castra creates the worktree and branch BEFORE these tasks execute:

- Worktree at `/Users/milovan/projects/divinipress-store/.worktrees/fix-lint-migration-eslint9` (or castra-chosen path).
- Branch `fix/lint-migration-eslint9` checked out, based on `develop`.
- `git fetch origin` has run (so `origin/develop` exists locally for `lint:changed` testing).
- Working directory is clean.

The plan operates inside the worktree. All file paths are relative to the worktree root unless absolute.

---

## Task 1: Worktree precheck and broken baseline

> **Confidence: High** — direct verification commands; no ambiguity. Branch precheck added per Provocator R1 (operational hardening).

**Files:** none (read-only verification).

**Goal:** Confirm the worktree is on the right branch, then document the broken pre-migration state so the post-migration delta is provable.

- [ ] **Step 0: Verify worktree branch state**

Run: `git branch --show-current`

Expected output: `fix/lint-migration-eslint9`

If output is anything else: HALT. Report to Legatus. The pre-flight assumptions block (worktree on this branch) was not satisfied. Six commits to the wrong branch is not a recoverable state.

Also verify clean working tree:

Run: `git status --short`

Expected: empty output (no staged or modified files).

If output is non-empty: HALT. Report to Legatus. Uncommitted changes on entry mean either the worktree was set up incorrectly OR a previous run partially executed.

- [ ] **Step 1: Confirm the broken `yarn lint` script invocation**

Run: `yarn lint 2>&1 | head -20; echo "---exit:$?"`

Expected output contains: `Invalid project directory provided, no such directory: ...lint`

**The trailing exit code is the pipe's exit (head's), which is 0. The actual `yarn lint` exits 1 — that's the broken state being captured. Do NOT halt on `yarn lint` failure; the failure IS the verification.**

Capture the output to a scratch note for the PR description.

- [ ] **Step 2: Confirm the legacy ESLint 8 + flat-config-only `eslint-config-next@16` incompatibility**

Run: `./node_modules/.bin/eslint . 2>&1 | head -20; echo "---exit:$?"`

Expected output contains: `TypeError: Converting circular structure to JSON` and references `@eslint/eslintrc` and `react`.

Same exit-code semantics as Step 1 — the failure IS the verification. Do NOT halt.

Capture the output for the PR description.

- [ ] **Step 3: Note the captured outputs**

Both Step 1 and Step 2 outputs go into the PR description (Task 6 Step 2). No commit. No file changes.

---

## Task 2: Create `.nvmrc`

> **Confidence: High** — single-line file; value verified against backend pin per Imperator memory `reference_medusa_backend_boot.md`.

**Files:**
- Create: `.nvmrc`

- [ ] **Step 1: Create `.nvmrc` with pinned Node version**

Write file at `.nvmrc` with EXACT content (single line, trailing newline):

```
22.22.2
```

- [ ] **Step 2: Verify file content**

Run: `cat .nvmrc`

Expected output: `22.22.2` (one line).

- [ ] **Step 3: Note current Node version (informational only)**

Run: `node --version`

Expected: any version (informational). The shell may be on a Node version OTHER than 22.22.2 — that's expected because `.nvmrc` is a pin, not an autoswitch (see spec §4 caveat). `nvm use` is a shell function not available in non-interactive subshells, so the plan does NOT verify it via the soldier shell.

The pin's value is realized when (a) the Imperator manually runs `nvm use` in his interactive shell, or (b) Vercel and other Node-version-aware tools read `.nvmrc` automatically. Both happen outside this plan.

- [ ] **Step 4: Commit**

```bash
git add .nvmrc
git commit -m "chore(tooling): pin Node version to 22.22.2 via .nvmrc

Matches the divinipress-backend pinned Node version for context-switch
ergonomics. ESLint 9 and Next 16 are both well-tested on Node 22 LTS.

Pin only — autoswitch on cd requires shell hooks not configured here."
```

---

## Task 3: Create `scripts/lint-changed.sh`

> **Confidence: High** — script body verified by Censor + Provocator across two rounds; bash 3.2 compatibility confirmed empirically (`/bin/bash --version` on macOS Sequoia: `3.2.57(1)-release`); silent-failure modes (missing base ref, process-sub exit-code swallow, leading-dash filenames) all closed.

**Files:**
- Create: `scripts/lint-changed.sh`

- [ ] **Step 1: Confirm `scripts/` directory exists**

Run: `ls -ld scripts/`

Expected: directory exists (the project already has `scripts/pre-commit-validate.sh`).

- [ ] **Step 2: Create `scripts/lint-changed.sh` with EXACT content**

Write file at `scripts/lint-changed.sh`:

```bash
#!/usr/bin/env bash
# Lint only files changed on this branch versus the comparison base.
# Override base via env: LINT_BASE=origin/<branch> yarn lint:changed
set -euo pipefail

BASE="${LINT_BASE:-origin/develop}"

# Verify the base ref exists; otherwise exit loudly rather than silently
# reporting "No changed files" when git-diff fails.
if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  echo "lint:changed: base ref '$BASE' not found." >&2
  echo "Run: git fetch origin develop   (or set LINT_BASE=<existing-ref>)" >&2
  exit 1
fi

# Capture diff output to a temp file so we can detect runtime failures
# (process substitution swallows exit codes under set -e).
TMPFILE="$(mktemp -t lint-changed.XXXXXX)"
trap 'rm -f "$TMPFILE"' EXIT
if ! git diff --name-only -z --diff-filter=ACMR "$BASE"...HEAD > "$TMPFILE"; then
  echo "lint:changed: git diff failed against base $BASE." >&2
  exit 1
fi

# Build positional args from NUL-delimited git output.
# --diff-filter=ACMR: added, copied, modified, renamed.
# Skips deletions, type-changes, and unmerged paths.
# Bash 3.2 compatible (macOS default ships bash 3.2; no mapfile -d).
set --
while IFS= read -r -d '' file; do
  case "$file" in
    *.ts|*.tsx|*.js|*.jsx) set -- "$@" "$file" ;;
  esac
done < "$TMPFILE"

if [ "$#" -eq 0 ]; then
  echo "lint:changed: no changed TS/JS files vs $BASE."
  exit 0
fi

# `--` separates options from filenames so files starting with `-` are
# not interpreted as eslint flags.
exec eslint -- "$@"
```

- [ ] **Step 3: Set executable bit**

Run: `chmod +x scripts/lint-changed.sh`

- [ ] **Step 4: Verify shell parses the script (without invoking eslint)**

Run: `bash -n scripts/lint-changed.sh`

Expected: silent (no syntax errors). Non-zero exit means a syntax bug.

- [ ] **Step 5: Verify the precheck branch fires correctly**

Run: `LINT_BASE=does-not-exist-ref bash scripts/lint-changed.sh`

Expected: stderr contains `lint:changed: base ref 'does-not-exist-ref' not found.` and exit code 1.

(This validates the `git rev-parse --verify` precheck before lint is even configured. The precheck does not depend on ESLint.)

- [ ] **Step 6: Commit**

```bash
git add scripts/lint-changed.sh
git commit -m "feat(tooling): add scripts/lint-changed.sh for branch-scoped lint

Lints only files changed on the current branch vs the comparison base
(default origin/develop, override via LINT_BASE env). Bash 3.2 compatible
for macOS default shell. Hardened against silent-failure modes:

- git rev-parse --verify precheck: missing base ref errors loud
- mktemp + explicit if-not capture: git diff runtime failures surface
  (process substitution swallows exit codes under set -e)
- exec eslint -- \"\$@\": leading-dash filenames passed as arguments
  (not interpreted as eslint flags)
- NUL-delimited file iteration: handles names with spaces/metacharacters

Will be wired into package.json scripts in the next commit."
```

---

## Task 4: Atomic config migration

> **Confidence: High** — every component (deps, config shape, ignores, pathGroups) verified by Censor + Provocator across two rounds via direct reads of `node_modules/eslint-config-next/`, `node_modules/eslint-config-prettier/`, and the project's `tsconfig.json`. **Medium residual:** the post-migration `yarn lint` violation count is unknown (Imperator declined dry-run); per Decision 2(a) this is expected — exit code 1 is acceptable, only exit code 2 is failure.

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Delete: `.eslintrc.json`
- Create: `eslint.config.mjs`
- Regenerate: `yarn.lock` (via `yarn install`)

This task lands the migration as a single atomic commit. Lint is broken in different ways at intermediate steps; the commit boundary is the consistent state.

- [ ] **Step 1: Update `package.json` `lint` script and add `lint:changed`**

Read `package.json` first. Then apply this exact replacement:

OLD:
```json
    "lint": "next lint",
```

NEW:
```json
    "lint": "eslint .",
    "lint:changed": "bash scripts/lint-changed.sh",
```

(The script ordering is alphabetical-adjacent; `lint:changed` immediately follows `lint`.)

- [ ] **Step 2: Update `package.json` `eslint` devDep**

OLD:
```json
    "eslint": "^8",
```

NEW:
```json
    "eslint": "^9",
```

- [ ] **Step 3: Update `package.json` `eslint-config-next` devDep**

OLD:
```json
    "eslint-config-next": "16.2.1",
```

NEW:
```json
    "eslint-config-next": "^16",
```

- [ ] **Step 4: Verify `package.json` edits**

Run: `grep -E '"(lint|lint:changed|eslint|eslint-config-next)"' package.json`

Expected output (order may vary by file position):
```
    "lint": "eslint .",
    "lint:changed": "bash scripts/lint-changed.sh",
    "eslint": "^9",
    "eslint-config-next": "^16",
```

If `eslint-config-prettier`, `eslint-plugin-import`, `eslint-plugin-prettier` ALSO appear (they will — `grep` matches substrings), that is correct and expected.

- [ ] **Step 5: Delete `.eslintrc.json` and stage the deletion (idempotent)**

Run:
```bash
if [ -f .eslintrc.json ]; then
  git rm .eslintrc.json
else
  echo ".eslintrc.json already absent (Step 5 idempotent re-run)"
fi
```

Verify: `ls -la .eslintrc.json 2>&1` should report "No such file or directory."

Verify the deletion is staged (only meaningful on first run):

`git status --short .eslintrc.json`

Expected: `D  .eslintrc.json` on first run, empty on idempotent re-run (deletion already committed in a prior partial run — the soldier should investigate that case before continuing).

- [ ] **Step 6: Create `eslint.config.mjs` with EXACT content**

Write file at `eslint.config.mjs`:

```js
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettierConfig from 'eslint-config-prettier/flat'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  // Ignore patterns calibrated to actual repo contents (verified via repo walk).
  // Note: `.next/**` covers build output AND Next's auto-generated type files
  // at `.next/types/**` and `.next/dev/types/**` — we never want to lint these.
  {
    ignores: [
      // Build outputs
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'public/**',

      // Generated Next files
      'next-env.d.ts',

      // Test artifacts (Playwright)
      'playwright-report/**',
      'test-results/**',
      '.playwright-mcp/**',

      // Vercel cache
      '.vercel/**',

      // Project-specific
      'src/_quarantine/**',          // CLAUDE.md hard rule — quarantined Fluent UI code
      '.worktrees/**',                // critical: prevents `eslint .` from
                                      // recursing into sibling stacked worktrees
                                      // and double-linting parent files
      'eslint.config.mjs',           // narrowed from `*.config.*` — only the
                                      // lint config itself. Other top-level
                                      // configs (next.config.ts, postcss.config.mjs,
                                      // playwright.config.ts) remain lintable.
    ],
  },

  // Next 16's flat config — brings react, react-hooks, import (with TS resolver),
  // jsx-a11y, @next/next, typescript-eslint parser, globals (browser+node).
  ...nextCoreWebVitals,

  // Project-specific overrides (rules previously in the legacy .eslintrc.json)
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      'react/no-unescaped-entities': 'off',

      'import/order': [
        'warn',
        {
          groups: ['type', ['external', 'builtin', 'internal']],
          pathGroups: [
            { pattern: '{react,react-dom}', group: 'type', position: 'before' },
            { pattern: '@lib/**', group: 'external', position: 'after' },
            { pattern: '@store/**', group: 'external', position: 'after' },
            { pattern: '@api/**', group: 'external', position: 'after' },
            { pattern: '@utils/**', group: 'external', position: 'after' },
            { pattern: '@hooks/**', group: 'external', position: 'after' },
            { pattern: '@config/**', group: 'external', position: 'after' },
            { pattern: '@interfaces/**', group: 'external', position: 'after' },
            { pattern: '@/**', group: 'external', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-dom'],
          distinctGroup: true,
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: false },
        },
      ],

      'sort-imports': [
        'warn',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
    },
  },

  // Prettier — disables stylistic rules that fight prettier. Must be last.
  prettierConfig,
]
```

- [ ] **Step 7: Run `yarn install` to regenerate lockfile and resolve new deps**

Run: `yarn install`

Expected: install completes successfully. Output should show `eslint@npm:9.x.x` and `eslint-config-next@npm:16.x.x` resolving.

If yarn install fails: read the error. Common causes are network/registry, peer-dep conflicts, or yarn cache corruption. Do NOT proceed until install succeeds.

- [ ] **Step 7a: Verify transitive deps are reachable from `eslint-config-next` (resolution-checked, not just presence-checked)**

Per Provocator R: a top-level `node_modules/globals` may exist as a transitive of an UNRELATED package (e.g., Storybook ships `globals@13`) while `eslint-config-next@16` requires `globals@16`. A `test -d` check would lie. The honest verification asks Node's resolver directly.

```bash
node -e "
const fromNext = (mod) => {
  try {
    const p = require.resolve(mod, { paths: [require.resolve('eslint-config-next/package.json')] });
    const v = require(p.replace(/\/[^/]+\.js$/, '/package.json')).version;
    console.log(mod + ': ' + v + ' (' + p + ')');
  } catch (e) {
    console.log(mod + ': UNRESOLVABLE — ' + e.message);
    process.exit(1);
  }
};
fromNext('globals');
fromNext('eslint-import-resolver-typescript');
fromNext('typescript-eslint');
"
```

Expected: three lines, each printing the package name + resolved version + path. Versions should satisfy `eslint-config-next@16`'s declared ranges (`globals 16.x`, `eslint-import-resolver-typescript ^3.x`, `typescript-eslint ^8.x`). The actual paths may be hoisted (`node_modules/<pkg>`) or nested (`node_modules/eslint-config-next/node_modules/<pkg>`) — both are correct as long as Node's resolver from `eslint-config-next` finds them.

Also verify the entrypoints the corrected config imports:

```bash
test -f node_modules/eslint-config-next/dist/core-web-vitals.js && echo "next/core-web-vitals: OK" || echo "next/core-web-vitals: MISSING"
test -f node_modules/eslint-config-prettier/flat.js && echo "prettier/flat: OK" || echo "prettier/flat: MISSING"
```

Expected: both end in `OK`.

If the node script exits 1 OR either `test -f` reports MISSING: HALT. Do not proceed to Step 8. Report to Legatus — spec risk-table covers this case (add the failing package as a direct devDep with the same caret version `eslint-config-next@16` declares).

- [ ] **Step 8: Verify `yarn lint` exits with code 0 or 1 (NOT 2), and verify rules actually loaded**

Run: `yarn lint; echo "exit=$?"`

Expected: the final line is `exit=1` (lint violations surfaced — the Imperator's stated expectation per Decision 2(a) and Provocator R's observation that the codebase has not been linted in some time; expanded React 19 / Server Component / a11y rule pack from `eslint-config-next@16` makes a non-trivial backlog near-certain).

**FAILURE MODES:**

- **`exit=2`** — structural config error. Schema validation failed, plugin failed to load, or rule failed to execute. Read the ESLint output from the top; first error trace identifies the structural problem. Do NOT commit; do NOT proceed to Step 9. Investigate, fix, re-verify.

- **`exit=0`** — SUSPICIOUS, not celebratory. Per Provocator R: the most likely explanations for zero violations on a previously-unlinted codebase are: (a) the `ignores` block accidentally excluded everything (malformed glob), (b) `nextCoreWebVitals` spread returned undefined (silent transient install issue), (c) ESLint walked zero files. Investigate before proceeding. Sanity check:

  ```bash
  yarn lint --debug 2>&1 | grep -E "Linting (.*ts|.*tsx|.*jsx?)" | head -5
  ```

  Expected: lines showing ESLint actually walking source files (e.g., `Linting /Users/milovan/.../src/app/page.tsx`). If this returns zero matches, the ignores block or `files:` matcher is wrong; halt and investigate.

- **`exit=1`** — expected and acceptable. Capture the violation count (`yarn lint 2>&1 | grep -E "(error|warning)" | wc -l`) for the PR description.

- [ ] **Step 9: Verify `yarn lint:changed` runs without error on a branch with no diff vs `origin/develop`**

(At this point in the migration, the branch HAS diffs vs `origin/develop` — the migration files. So `lint:changed` will lint package.json, eslint.config.mjs, scripts/lint-changed.sh, .nvmrc — but only the `.ts/.tsx/.js/.jsx` matches will be linted, which means none of the migration files. Output should be `lint:changed: no changed TS/JS files vs origin/develop.`)

Run: `yarn lint:changed; echo "exit=$?"`

Expected: stdout contains `no changed TS/JS files vs origin/develop` and the final line is `exit=0`.

If exit is non-zero: investigate. Most likely causes: `origin/develop` not fetched in this worktree (run `git fetch origin develop`), or `bash` resolves to non-bash shell (the script needs bash, not sh).

- [ ] **Step 10: Commit the atomic migration**

`.eslintrc.json` deletion was already staged in Step 5 via `git rm`. Add the remaining files:

```bash
git add package.json yarn.lock eslint.config.mjs
git status --short
```

Expected `git status --short` output (order may vary):
```
M  package.json
M  yarn.lock
A  eslint.config.mjs
D  .eslintrc.json
```

Then commit:

```bash
git commit -m "feat(tooling): migrate to ESLint 9 + flat config (eslint.config.mjs)

Restores yarn lint after Next 16 broke it (next lint was removed; ESLint 8
+ flat-only eslint-config-next@16 produced TypeError: Converting circular
structure to JSON).

Changes:
- package.json: lint script swaps next lint for eslint .; adds lint:changed
  delegating to scripts/lint-changed.sh; bumps eslint ^8 to ^9; loosens
  eslint-config-next 16.2.1 to ^16
- .eslintrc.json: deleted (legacy schema)
- eslint.config.mjs: new flat config. Direct import + spread of
  eslint-config-next/core-web-vitals (which is a flat-config array in 16.x).
  No FlatCompat, no second importPlugin registration, no resolver clobber —
  Next 16 provides all of that. eslint-config-prettier/flat subpath (package
  root is legacy-shaped). Project-specific rule overrides preserved bit-for-bit
  except pathGroups: dropped dead aliases (@layout, @components, @styles)
  per CLAUDE.md, added missing active aliases (@hooks, @config, @interfaces),
  replaced @/app/_domain/** with @/** catch-all for consistent generic-alias
  grouping. Ignores calibrated to actual repo contents — critically includes
  .worktrees/** to prevent eslint . from recursing into sibling stacked
  worktrees and double-linting parent files.
- yarn.lock: regenerated. globals, eslint-import-resolver-typescript,
  @eslint/eslintrc, typescript-eslint NOT added as direct devDeps — they
  ride in transitively via eslint-config-next@16.

Per Imperator Decision 2(a), yarn lint exit code 1 (rules fired) is
acceptable. Only exit code 2 (structural config error) is failure."
```

---

## Task 5: Smoke tests

> **Confidence: High** — tests directly map to spec success criteria #1, #2, #4, #7, #8.

**Files:** none (verification only).

- [ ] **Step 1: Verify success criterion #1 — `yarn lint` exit code boundary**

Run: `yarn lint; echo "exit=$?"`

Expected: `exit=0` or `exit=1`. Any other exit (especially `exit=2`) is a regression.

- [ ] **Step 2: Verify success criterion #2 — `lint:changed` reports clear error on missing base ref**

Run: `LINT_BASE=does-not-exist-ref-xyz yarn lint:changed; echo "exit=$?"`

Expected stderr: `lint:changed: base ref 'does-not-exist-ref-xyz' not found.`
Expected stdout includes: `Run: git fetch origin develop   (or set LINT_BASE=<existing-ref>)`
Expected: `exit=1`

- [ ] **Step 3: Verify success criterion #2 — `lint:changed` no-op on branch with no TS/JS diff**

Run: `yarn lint:changed; echo "exit=$?"`

Expected stdout: `lint:changed: no changed TS/JS files vs origin/develop.`
Expected: `exit=0`

- [ ] **Step 4: Verify success criterion #4 — direct devDeps are exactly the spec's set**

Run: `node -e "const p = require('./package.json'); const eslintDeps = Object.keys(p.devDependencies).filter(k => k.includes('eslint') || k === 'globals' || k === 'typescript-eslint'); console.log(eslintDeps.sort().join('\n'))"`

Expected output (each on its own line, sorted):
```
eslint
eslint-config-next
eslint-config-prettier
eslint-plugin-import
eslint-plugin-prettier
```

`globals`, `typescript-eslint`, `eslint-import-resolver-typescript`, `@eslint/eslintrc` MUST NOT appear in this list.

- [ ] **Step 5: Verify success criterion #7 — `yarn lint` does not recurse into `.worktrees/`**

This test ONLY meaningfully verifies the ignore when run from the parent repo (where `.worktrees/` actually contains sibling worktrees). Running it from inside the migration worktree's CWD vacuously passes because the worktree's CWD has no nested `.worktrees/`. Per Praetor + Provocator R both flagged this premise hole.

```bash
( cd /Users/milovan/projects/divinipress-store && yarn lint 2>&1 | grep -c '\.worktrees/' )
```

Expected output: `0` (zero matches).

If the count is non-zero: the `.worktrees/**` ignore is not taking effect from the parent repo. Investigate the ignore block in `eslint.config.mjs` — most likely the worktree directory is being walked because the ignore pattern is malformed.

**Caveat:** this step requires the parent repo to be on a branch where the migration is applied (either `develop` post-merge, or because the parent repo's checkout was switched to `fix/lint-migration-eslint9` for this test). If the parent is still on `develop` pre-merge, this step will run the OLD broken config and is not a meaningful verification — skip with a note for the Imperator to re-run post-merge.

- [ ] **Step 6: Verify success criterion #8 — fresh worktree smoke test**

This step requires a SECOND worktree of the migration branch to confirm nothing depends on machine-local state from the first.

From the parent repo (NOT this worktree):

```bash
cd /Users/milovan/projects/divinipress-store
git worktree add /tmp/lint-migration-smoketest fix/lint-migration-eslint9
cd /tmp/lint-migration-smoketest
yarn install
yarn lint; echo "exit=$?"
```

Expected: `yarn install` completes; `yarn lint` exits 0 or 1.

Cleanup (force-remove handles untracked files like `node_modules/` cache that may have been written by `yarn install`):

```bash
cd /Users/milovan/projects/divinipress-store
git worktree remove --force /tmp/lint-migration-smoketest
git worktree prune
```

If smoke test passes: success criterion #8 met. No commit (verification only).

If smoke test fails with a different result than the primary worktree: the migration depends on machine-local state somewhere. Investigate (most likely `node_modules` cached state, `nvm` shell hook, or untracked file).

---

## Task 6: Push branch and prepare PR description

> **Confidence: High** — standard git/gh workflow; PR description templated to project preferences (no Test Plan section per Imperator memory; no Co-Authored-By line per Imperator memory).

**Files:** none (push only).

- [ ] **Step 1: Push branch to origin**

Check first whether the remote branch already exists:

```bash
git ls-remote --heads origin 'fix/lint-migration-eslint9'
```

- **Empty output** (branch does not exist on remote) — proceed with first push:
  ```bash
  git push -u origin fix/lint-migration-eslint9
  ```
- **Non-empty output** (branch exists on remote) — verify your local is a fast-forward of remote:
  ```bash
  git fetch origin fix/lint-migration-eslint9
  git log --oneline origin/fix/lint-migration-eslint9..HEAD
  ```
  If the log shows YOUR commits (the migration), push:
  ```bash
  git push origin fix/lint-migration-eslint9
  ```
  If the push is rejected with non-fast-forward: HALT. Report to Legatus. The remote branch has commits you don't have locally — investigate before force-pushing (could be a previous attempt by Imperator or a colleague). Do NOT `--force` without explicit Imperator approval.

Expected outcome: branch is on origin with the migration commits. Remote tracking is set up.

- [ ] **Step 2: Write PR description to a tracked file the Imperator can use**

Per Provocator R: rendering the PR description inline as nested markdown fences breaks GitHub's renderer (outer 3-backtick fence closes at the first inner 3-backtick fence). Write the description to a file instead. The file is NOT committed to the branch — it lives only in the worktree for the Imperator to consume.

Write to `/tmp/lint-migration-pr-body.md` with the following content:

````markdown
## Summary

Restore `yarn lint` after Next.js 16 broke it. Migrate from ESLint 8 + legacy `.eslintrc.json` to ESLint 9 + flat config (`eslint.config.mjs`).

## What broke and why

1. **`next lint` was removed in Next 16.** `yarn lint` invoked `next lint` and produced:
   ```
   Invalid project directory provided, no such directory: .../lint
   ```

2. **ESLint 8 + flat-only `eslint-config-next@16` are incompatible.** Direct ESLint 8 invocation against the legacy `.eslintrc.json` produced:
   ```
   TypeError: Converting circular structure to JSON
       property 'configs' -> property 'flat' -> ... 'react' closes the circle
   ```

## What this PR does

- **`package.json`**: `lint` script swaps `next lint` for `eslint .`; new `lint:changed` script lints only branch-modified files vs `origin/develop`. Bumps `eslint` to `^9`, loosens `eslint-config-next` to `^16`.
- **`.eslintrc.json`**: deleted (legacy schema).
- **`eslint.config.mjs`**: new flat config. Direct `import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'` + spread (Next 16 ships flat-native; FlatCompat would double-wrap). `eslint-config-prettier/flat` subpath. Project-specific rule overrides preserved; `pathGroups` cleaned up (dropped dead `@layout`/`@components`/`@styles`; added missing `@hooks`/`@config`/`@interfaces`; `@/**` catch-all replaces `@/app/_domain/**`). Ignores calibrated to actual repo — critically includes `.worktrees/**`.
- **`scripts/lint-changed.sh`**: branch-scoped lint with `git rev-parse --verify` precheck, `mktemp`-captured git diff, `--diff-filter=ACMR`, NUL-delimited bash 3.2-compatible iteration, `exec eslint -- "$@"` separator.
- **`.nvmrc`**: pin `22.22.2` (matches backend pin for context-switch ergonomics).
- **`yarn.lock`**: regenerated. `globals`, `eslint-import-resolver-typescript`, `@eslint/eslintrc`, `typescript-eslint` NOT added as direct deps — all transitive via `eslint-config-next@16`.

## Notes for reviewers

- `yarn lint` will exit non-zero post-merge due to a pre-existing violation backlog (the codebase hasn't been linted since the Next 16 upgrade) plus the expanded React 19 / Server Component / a11y rule pack `eslint-config-next@16` ships. **Exit code 1 is acceptable; only exit code 2 (structural config error) is a regression.** Backlog cleanup is a separate future PR.
- For daily use, prefer `yarn lint:changed` — it lints only files modified vs `origin/develop`.
- Spec and verification trail at `consilium-docs/cases/2026-04-25-eslint-9-flat-config-migration/` (R1.1, two rounds of Censor + Provocator).

## Stacked-PR users

If you have an in-flight worktree branched from `develop`, cherry-pick this commit to make `yarn lint` work in your worktree while this PR sits in review:

```bash
git cherry-pick <merge-sha>
yarn install
```

The cherry-pick will deduplicate cleanly when you rebase your branch onto `develop` post-merge (single squash-merged commit; patch-id matches).
````

The four-backtick OUTER fence above is intentional — it allows three-backtick INNER fences to render correctly when the file is consumed.

Verify the file is written correctly:

```bash
ls -la /tmp/lint-migration-pr-body.md
wc -l /tmp/lint-migration-pr-body.md   # should be ~38 lines
```

- [ ] **Step 3: Print the gh CLI command for the Imperator (one-liner, no HEREDOC)**

The Imperator may run this himself, or open the PR via the GitHub UI:

```bash
gh pr create --base develop \
  --title "feat(tooling): ESLint 9 + flat config migration (post-Next 16)" \
  --body-file /tmp/lint-migration-pr-body.md
```

No commit. Branch is pushed; PR creation is the Imperator's hand-off. The PR body file at `/tmp/lint-migration-pr-body.md` will persist until the system clears `/tmp` (typically next reboot) — sufficient for the Imperator to invoke the command from any shell.

---

## Confidence map summary

| Task | Confidence | Notes |
|-|-|-|
| 1 — Worktree precheck and broken baseline | High | Branch + clean-tree precheck (Step 0) added per Provocator R; pipe-exit-code expectation called out per Provocator R. |
| 2 — Create `.nvmrc` | High | Single-line file; value verified against backend pin. `nvm use` verification dropped — `nvm` is a shell function, unavailable in non-interactive soldier subshells (per Provocator R). Replaced with informational `node --version`. |
| 3 — Create `scripts/lint-changed.sh` | High | Body verified by Censor + Provocator across two rounds; bash 3.2 compatibility confirmed empirically. |
| 4 — Atomic config migration | High (Medium residual on violation count) | Every component verified via package-source reads. Idempotent `git rm` (Step 5), resolution-checked transitive-dep verification via Node's resolver (Step 7a), and exit=0 sanity check (Step 8) all hardened per Provocator R. Violation count unknown but exit code 1 is acceptable per Imperator Decision 2(a); exit=0 now triggers investigation, not celebration. |
| 5 — Smoke tests | High | Tests map directly to spec success criteria. Step 5 (`.worktrees/` recursion test) now `cd`s to parent repo so the test premise actually holds (per Praetor + Provocator R). Step 6 (smoke worktree cleanup) uses `--force` per Provocator R. |
| 6 — Push branch + PR description | High | Push (Step 1) handles existing-remote-branch case explicitly per Provocator R. PR description (Step 2) written to `/tmp/lint-migration-pr-body.md` instead of stdout — uses 4-backtick outer fence so 3-backtick inner fences render correctly per Provocator R. Gh CLI command (Step 3) uses `--body-file` instead of HEREDOC process substitution — runs cleanly without manual paste. |

No Low ratings. The single Medium residual (Task 4 violation count) is structurally bounded by the success criterion: exit 0 (suspicious — sanity check) or 1 (expected) = pass, exit 2 = fail.

---

## Out-of-band notes

**For the Legatus before dispatching soldiers:** if Task 4 Step 8 fails with exit code 2, the campaign halts and reports back. Do not advance to Task 5. The structural failure must be diagnosed before the migration can ship — likely causes: a typo in the `eslint.config.mjs` body (especially the `import` paths), `node_modules/eslint-config-next/` not at version `^16` (verify with `cat node_modules/eslint-config-next/package.json | grep '"version"'`), or the `eslint-config-prettier/flat` subpath not present (verify with `ls node_modules/eslint-config-prettier/flat.js`).

**For the Imperator post-merge:** the PR description's "Stacked-PR users" section is the cherry-pick recipe for your existing in-flight worktrees. Apply per-worktree as those PRs come due for review.
