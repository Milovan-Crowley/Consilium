---
name: triumph
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# The Triumph

The campaign is done. Tests pass. The work is real. Now the Legatus brings his legion home — but not carelessly. A triumph is a ceremony, and ceremonies have order: confirm the victory, present options to the Imperator, execute his choice, strike the camp.

**Core principle:** Confirm the victory → Present options → Execute choice → Strike the camp.

**Announce at start:** "I am invoking the triumph."

## The Process

### Step 1: Confirming the Victory

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: The Imperator Decides

Present exactly these 4 options:

```
The campaign is won. What is your command, Imperator?

1. Merge back to <base-branch> locally
2. Push and open a Pull Request
3. Keep the branch as-is (I will handle it later)
4. Discard this work

Which option?
```

**Do not add explanation** — keep the choices concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Striking the Camp

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## What Dishonors the Triumph

**Never:**
- Proceed with failing tests — there is no victory without the tests
- Merge without verifying tests on the result
- Delete work without the Imperator's confirmation
- Force-push without his explicit command

**Always:**
- Confirm the victory before offering options
- Present exactly 4 options, in the same order every time
- Get typed confirmation for Option 4
- Strike the camp for Options 1 and 4 only

## Integration

**Called by:**
- **legion** — After all tasks complete and the Campaign review is clean
- **march** — After the Legatus finishes the solo march

**Pairs with:**
- **castra** — Strikes the camp raised by that skill
