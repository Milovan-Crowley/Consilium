# Testing Consilium Agents — Manual Checklist

A lightweight procedure for verifying the user-scope Consilium agents haven't regressed. Run after non-trivial edits to agent files, persona sources, or the canonical Codex.

**Why manual:** The Consilium is a 6-agent system still actively iterating. Automated headless tests against persona content produce more noise than signal because "did the voice drift?" is an LLM-ish judgment. This checklist is fast (15 minutes total) and catches the regressions that matter. Build a proper harness later, when personas stabilize.

---

## When to run

Run this checklist after editing:

- Any file in `~/.claude/agents/consilium-*.md`
- Any persona at `skills/references/personas/*.md`
- The canonical Codex at `skills/references/personas/consilium-codex.md`
- Any verification template in `skills/references/verification/templates/`
- The SKILL files for `consul`, `edicts`, `legion`, or `march` (main-session personas)

Also run before promoting a Consilium release.

---

## Quick drift check (30 seconds)

```bash
python3 ~/projects/Consilium/scripts/check-codex-drift.py
```

**Expected:** `All 5 agents in sync with canonical Codex.`

**If drift is reported:**

1. Re-run with `--verbose` to see the diff.
2. If the canonical source is correct and the agents are stale, run `--sync` to rewrite the agent copies.
3. If an agent's Operational Notes section was clobbered in the sync, restore it by hand from git history.

---

## Scout round-trip (2 minutes)

**What we're testing:** The scout's terse voice, file:line discipline, and refusal to dump files.

**Procedure.** From any project (divinipress-store is fine), open a Claude Code session and ask:

> Use the Agent tool with `subagent_type: "consilium-scout"` and the prompt: "Does `src/app/_hooks/useSavedProduct.ts` exist in this project? If so, what's its default export and return shape?"

**Verify the response:**

- [ ] Under 150 words
- [ ] Contains a `file:line` reference OR a precise "No" with grep evidence
- [ ] Opens with the answer, not throat-clearing ("Let me check...", "I'll look into this...")
- [ ] Does not dump the whole file
- [ ] Does not include speculation about files not asked about
- [ ] Uses terse, direct voice with no hedging

**A failing scout check usually means:**

1. The agent file's persona body has drifted from canonical — run the drift check on the canonical scout source
2. The scout is being dispatched with a vague prompt — the scout persona requires focused questions

---

## Censor cold-read (5 minutes)

**What we're testing:** The Censor's domain verification discipline and MISUNDERSTANDING detection.

**Procedure.** Write a 10-line mini spec that contains a deliberate domain error. Example:

```markdown
# Mini Spec — Customer Rename Flow

When a customer renames a saved product, the product title updates
on the catalog. The customer sees the new title in their cart, on
the product detail page, and on future proofs. Admins managing the
catalog also see the rename in their inventory list.
```

This is deliberately wrong: `display_name` is on saved products, `title` is on catalog products. Renames never touch the catalog. Catalog products are shared across all customers.

Dispatch the Censor via `skills/references/verification/templates/spec-verification.md` with this mini spec, a one-line context summary, and a trivial confidence map (mark the rename requirement as High confidence to bait the Provocator, but we're only testing the Censor here).

**Verify the response:**

- [ ] Returns a MISUNDERSTANDING finding (not a GAP, not a CONCERN)
- [ ] Chain of evidence cites the specific domain concept being confused (saved product vs catalog product)
- [ ] Reasoning traces to the doctrine files or `$CONSILIUM_DOCS/doctrine/products.md`
- [ ] Does not soften the finding with "consider" or "might want to"
- [ ] Halts rather than proposing a fix (the Censor escalates MISUNDERSTANDINGs, doesn't patch them)

**A failing Censor check usually means:**

1. The `$CONSILIUM_DOCS` checkout is unreachable, so the Censor cannot cross-reference doctrine
2. The doctrine files no longer contain the saved_product/catalog_product distinction
3. The persona has drifted from canonical

---

## Tribunus mini-checkit (2 minutes)

**What we're testing:** The Tribunus's speed, focused scope, and deviation-as-improvement handling.

**Procedure.** Invent a minimal completed task output with a deliberate domain error:

```markdown
## Task 3 Output

Added a hook `useSavedProductDisplay` at `src/app/_hooks/useSavedProductDisplay.ts`:

```typescript
export function useSavedProductDisplay(id: string) {
  return useCatalogProduct(id, { select: (p) => p.title });
}
```

Tests passing. Committed.
```

And a matching plan step:

```markdown
### Task 3: Display name hook for saved products

Create a hook `useSavedProductDisplay` that reads the `display_name`
field from a customer's saved product. Should target the saved product
endpoint, not the catalog product endpoint.
```

Dispatch the Tribunus via `skills/references/verification/templates/mini-checkit.md`.

**Verify the response:**

- [ ] Returns MISUNDERSTANDING (wrong entity — should be display_name from saved product, not title from catalog)
- [ ] Returns in under 300 words
- [ ] Does not evaluate architecture or propose sweeping improvements (that's Campaign territory)
- [ ] Chain of evidence cites the plan step vs the implementation
- [ ] Does not offer code fixes (the Tribunus reports findings; fix dispatch is the Legatus's job)

---

## Consul voice check (3 minutes)

**What we're testing:** Whether the Consul speaks as Publius Auctor from message one. This catches regressions in `skills/consul/SKILL.md` persona inlining.

**Procedure.** Start a fresh Claude Code session in any project. Invoke:

```
/consilium:consul
```

Then say: "I want customers to be able to group their saved products into folders they can name."

**Verify the response:**

- [ ] Opens in the Consul's voice — uses "Imperator," "scout," "reconnaissance," or similar Roman terms naturally, not as glossary quotes
- [ ] Challenges or elevates the idea — does not just write down what you said
- [ ] Asks at most one question at a time
- [ ] Does NOT immediately start writing a spec
- [ ] Does NOT present a menu of three approaches and ask you to pick
- [ ] May reference the display_name incident or another trauma-level concern if domain concepts are unclear

**A failing Consul check usually means:**

1. The SKILL.md persona inline block was removed or corrupted
2. The skill is cached in a stale state — verify the plugin cache matches source
3. The Consul has drifted back into generic-assistant mode — regenerate the skill body from the canonical persona

---

## Full campaign dry-run (optional, for major releases)

Before cutting a Consilium release, run a real feature through the full pipeline:

1. Start with `/consilium:consul` — produce a spec on a small feature
2. Let it dispatch Censor + Provocator and handle findings
3. Invoke edicts — produce a plan
4. Let edicts dispatch Praetor + Provocator
5. Invoke legion — execute the plan
6. Verify: Tribunus fired after every task, Campaign triad fired after all tasks, finding attribution shown in summary

If any of these checkpoints are silently skipped, something is wrong with the SKILL.md files or the verification templates. Git-bisect the skills directory to find the regression.

---

## What this checklist does NOT cover

- **Agent output quality beyond format** — whether a finding is *correct* requires domain expertise; this checklist only verifies the agent is *producing findings in the right shape*
- **Cross-agent coordination** — whether the Legatus correctly handles conflicting findings between Censor and Provocator; test manually during real campaigns
- **MCP server availability** — if doctrine or serena are down, agents will degrade; check those separately

Build a proper integration test when the Consilium stabilizes and you stop iterating on personas weekly.
