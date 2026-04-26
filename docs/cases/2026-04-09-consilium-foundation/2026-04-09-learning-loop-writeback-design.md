# Learning Loop Write-Back — Design Spec

Sub-project of the Learning Loop (see `2026-04-09-learning-loop-design.md`). Adds a session-end step where durable findings from Consilium runs are written as structured `.md` files for graphify to absorb on next re-run.

## Scope

Add a synthesis step to the Consilium flow that runs after a session completes. A fresh subagent reads the session's committed artifacts (spec, plan, verification findings), applies a durability filter, cross-references the knowledge graph for duplicates, and writes durable findings as `.md` files to `graphify-raw/findings/`. The Censor reviews the finding files. Next graphify run absorbs them into the graph.

## What This Does NOT Cover

- Mid-session compounding (findings don't enter the graph until next graphify run)
- Process-level findings ("Consul consistently misses X") — domain findings only
- Pattern detection across findings (future spec)
- Active briefing at phase start (future spec)
- Modifying graph.json directly (findings are source files, not graph mutations)

---

## 1. When and How It Fires

The write-back step runs **once at session end**, after the full Consilium cycle completes. It does not interrupt the flow between phases.

**Trigger points:**
- After Campaign review completes (the natural end of a full spec → plan → execute cycle)
- When the Consul invokes the triumph skill (session close)
- The Consul announces: "Dispatching synthesis agent to capture durable findings."

The synthesis agent runs as a fresh subagent — isolated context, no strain from the long session. The Consul dispatches it the same way it dispatches Censor or Provocator.

> **Confidence: High** — Imperator explicitly chose end-of-session over inline checkpoints. "Learning as you're going" means across sessions, not within them.

---

## 2. What the Synthesis Agent Receives

The session's committed artifacts — not a conversation summary. The Consilium process produces documentation at every step, so the artifacts ARE the brief:

- **The spec** — with inline confidence annotations
- **The plan** — with task structure and confidence annotations
- **All verification findings** — spec verification (Censor + Provocator), plan verification (Praetor + Provocator), mini-checkit (Tribunus per task), Campaign review (triad). Each finding has chain of evidence per the Codex.
- **The verification summaries** — what was fixed (GAPs addressed), what was kept (CONCERNs not adopted), what passed (SOUNDs)

The synthesis agent also has MCP access to query the existing knowledge graph for duplicate checking.

> **Confidence: High** — Imperator confirmed artifacts are sufficient. "We would have the design spec, the plan doc, + the work done. The consul shouldn't even really need to brief more than that."

---

## 3. Durability Filter

Not every finding is worth preserving. The synthesis agent applies this filter:

| Category | Durable? | Reasoning |
|-|-|-|
| MISUNDERSTANDING | Always | Broken mental models recur. If an agent confused saved products with catalog products once, it will again. The graph should warn future agents. |
| GAP (recurring) | Yes | A gap that appeared in multiple verification phases (e.g., caught at spec AND resurfaced at Campaign) is systemic — the Consilium has a blind spot here. |
| GAP (single-phase) | No | Caught and fixed in one pass. That's the system working, not a learning moment. |
| CONCERN | No | Style preferences, not domain knowledge. |
| SOUND | No | Confirmed correct — nothing to learn from. |

**Recurring GAP detection:** The synthesis agent checks whether the same conceptual gap appeared in findings from different phases. "Missing error handling for payment failure" caught by Provocator at spec AND by Tribunus at task 5 = recurring. Same finding caught only by Provocator at spec = single-phase.

> **Confidence: High** — Imperator approved this filter during brainstorming. Domain-only scope confirmed.

---

## 4. Duplicate Checking

Before writing a finding file, the synthesis agent queries the knowledge graph:

1. `query_graph` with the finding's key concepts (token_budget: 4000) — does the graph already know about this?
2. Check if a finding file with the same name already exists in `graphify-raw/findings/`

**If the finding is already known in the graph:** Skip it. The graph already has this knowledge from a previous session or from the original domain bible extraction.

**If a finding file with the same name exists:** Read it. If the new evidence adds value (different context, additional related entities, stronger evidence), update the file. If it's redundant, skip it.

> **Confidence: High** — deduplication via naming convention and graph cross-reference. Two layers prevent noise accumulation.

---

## 5. Finding File Format

One finding per file. Each finding is a distinct piece of knowledge with distinct concept relationships.

**Location:** `~/projects/graphify-raw/findings/`

**Naming convention:** `{concept}-{category}.md` — e.g., `display-name-confusion-misunderstanding.md`, `lock-semantics-gap.md`

**Template:**

```markdown
# Finding: {human-readable title}

**Type:** {MISUNDERSTANDING | RECURRING_GAP}
**Discovered:** {date}, {phase where first caught}
**Concepts:** {comma-separated key concepts — these become graph node links}

{2-4 sentences describing the finding in clear prose. This is what graphify's
semantic extraction will process. Name the concepts explicitly so graphify
can link them to existing code/domain nodes.}

## Evidence

{The chain of evidence from the original verification finding. Copied from
the verification summary — exact quote from artifact, source reference,
what should have been correct.}

## Related Entities

- {Entity.field} — {brief note on the relationship}
- {Entity.field} — {brief note on the relationship}

## Correct Model

{What the artifact should have said if the concept were understood correctly.
This is the durable knowledge — the correction, not just the error.}
```

The structured sections (`**Type:**`, `**Concepts:**`, `## Related Entities`) help the Censor review efficiently and help graphify's semantic extraction create precise graph connections. The prose in the main body is what graphify extracts meaning from.

> **Confidence: High** — format designed to serve three audiences: graphify extraction, Censor review, and human readability. One finding per file gives each its own graph node.

---

## 6. Verification of Findings

After the synthesis agent writes finding files, the Consul dispatches the **Censor at Patrol depth** (single agent, single pass) to review them.

The Censor receives:
- The finding files
- MCP access to query the graph
- Instructions: "Verify these findings are accurate, correctly named, not duplicates of existing graph knowledge, and worth preserving."

**Finding categories the Censor can produce:**
- **SOUND** — finding is accurate and worth keeping
- **GAP** — finding is missing context or has incomplete evidence. Synthesis agent fixes.
- **MISUNDERSTANDING** — finding itself contains a domain error. Halt, escalate to Imperator.
- **CONCERN** — finding is technically correct but not worth the graph noise. Synthesis agent decides.

Standard auto-feed loop applies. Max 2 iterations before escalating.

> **Confidence: High** — uses existing verification pattern (Censor + Codex). Patrol depth is appropriate for a focused review of 1-5 finding files.

---

## 7. Integration Points

### Consul skill (skills/consul/SKILL.md)

Add a new checklist step after "Transition to implementation":

```
13. **Capture durable findings** — after Campaign review or at session close,
    dispatch synthesis agent to capture durable findings from the session's
    verification results. See learning-loop-writeback protocol.
```

### Triumph skill (consilium:triumph)

Add a step before final session close:

```
Before closing the session, dispatch the synthesis agent to capture durable
findings. This is the learning loop's write-back step — findings from this
session become graph knowledge for future sessions.
```

### Refresh-graph.sh

The staging script already copies everything in `graphify-raw/`. No changes needed — `findings/` is just another directory in the staging area. But graphify needs to be pointed at the staging dir which already includes findings.

Actually, findings live directly in `graphify-raw/findings/`, not in a source repo. They're already in the staging area. The `refresh-graph.sh` script rsyncs code repos into the staging area but doesn't need to touch findings — they're already there.

### Consilium Codex

No changes. The Codex defines finding categories and chain of evidence — the same categories apply to findings about findings. The durability filter is a new concept but it's operational guidance for the synthesis agent, not Codex law.

---

## 8. Pontifex Persona

Lean persona focused on the durability judgment. Shorter than the other personas — no elaborate operational doctrine. The operational doctrine is defined by the write-back protocol, not the persona.

**Location:** `skills/references/personas/pontifex.md`

**Identity:**
- **Name:** Pontifex — Keeper of Sacred Knowledge
- **Role:** Synthesis agent. Reviews resolved findings from a Consilium session and decides what deserves to become permanent knowledge in the graph.
- **Core judgment:** Distinguish signal from noise. Not every finding is a lesson. MISUNDERSTANDINGs reveal broken models that will recur. Recurring GAPs reveal systemic blind spots. Everything else is the system working as designed.

**Trauma:** Wrote every finding from a session to the graph. 12 findings, 9 were noise — single-phase GAPs that were caught and fixed, CONCERNs about style preferences. The graph bloated with trivia. When agents queried for "pitfalls related to saved products," they got 9 irrelevant results and missed the 1 that mattered. Noise drowns signal. Now the Pontifex is conservative — a finding must earn its place in the graph.

**Quality bar:** Would this finding change how a future agent approaches the same domain area? If yes, write it. If no, it's noise.

> **Confidence: High** — Imperator confirmed lean persona. Trauma and quality bar provide the conservatism we need without elaborate doctrine.

---

## 9. Deliverables

| Deliverable | Type | Location |
|-|-|-|
| Pontifex persona file | Create | `skills/references/personas/pontifex.md` |
| Finding file format template | Create | `skills/references/findings-template.md` |
| Consul skill update | Modify | `skills/consul/SKILL.md` — add checklist step 13 |
| Triumph skill update | Modify | `skills/triumph/SKILL.md` — add synthesis dispatch step |
| Findings directory | Create | `~/projects/graphify-raw/findings/` (empty, ready for first run) |

---

## Confidence Map

| Section | Confidence | Evidence |
|-|-|-|
| Session-end trigger (not inline) | High | Imperator chose async over inline — "learning as I'm going" means across sessions |
| Artifacts as brief (no Consul summary) | High | Imperator confirmed — "we would have the design spec, the plan doc, + the work done" |
| Durability filter | High | Imperator approved during brainstorming — MISUNDERSTANDINGs always, recurring GAPs yes, rest no |
| Domain-only scope | High | Imperator chose A — process meta-analysis deferred to Pattern Detection |
| Lean Pontifex persona | High | Imperator confirmed — "lean" |
| Consul dispatches, not Pontifex self-initiates | High | Imperator designed this — "consul write it directly, have an agent check it" evolved to fresh synthesis agent + Censor |
| Censor reviews findings (Patrol depth) | High | Imperator confirmed — "I'm thinking we should use a verifier persona right?" |
| One finding per file | High | Consul reasoning — granularity enables precise graph queries |
| Finding file format | Medium | Format designed for three audiences but untested with graphify extraction. First real run will validate. |
| Deduplication via naming + graph query | Medium | Logical but untested. Edge case: similar-but-distinct findings with same concept name. |
