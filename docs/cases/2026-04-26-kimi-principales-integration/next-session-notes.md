# Next-Session Notes — Kimi Principales Integration (HALTED)

**Status as of 2026-04-26:** This case is halted by Imperator decision after iteration 2 returned 4 unresolved MISUNDERSTANDINGs across two verifiers. The substrate (`docs/cases/2026-04-26-kimi-principales-v1/`) is enough for now. The lesson of two failed iterations is that the integration is harder to spec correctly than the brainstorm anticipated. A future v2 attempt should read this file first.

---

## What Was Attempted

**The architectural target:** wire the shipped Kimi Principales MCP substrate into the Consilium dispatch flow as a shadow-mode observability layer (Pillar Beta) plus a face-value PRD Pre-Attack Consul-side helper (Pillar Alpha). Two pillars. Three layers (Consul → Officer-Centurions → Kimi Principales). Goal: reduce the Imperator's 3-5 spec/plan revisions toward 1-and-done.

**The brainstorm that produced it.** Publius (this Consul) and Quintus (counter-Consul) iterated three rounds and converged on a five-pillar architecture: Doctrine-First Recon, Adversarial Spec Twin, Officer-Brief Compression Check, Pre-Officer Breadth Pass, Post-Verdict Reconciliation. The Imperator pushed back, chose a different model: 3-layer hierarchy with Officer-as-Centurion. Then pushed back further with the shadow-mode insight ("strictly additive for now until we know Kimi's capabilities") which became the final architectural shape.

**The Imperator's late additions during deliberation:**
- Adversarial self-play (flip-and-reseed) — deferred to substrate v2
- Kimi as test-writer — deferred to a Legion-side sibling case
- PRD Pre-Attack — adopted as Pillar Alpha
- Skepticism toward case-class taxonomy ("all my work is feature spec from PRDs") — collapsed Pillar A into a single fixed manifest

**Both iterations of the spec are preserved** at `spec.md` (iteration 2 is the current file content; iteration 1 lives in git history at commit `a461cbe`).

---

## What Killed Iteration 1 (resolved by Imperator, lessons preserved)

**MISUNDERSTANDING #1 — Pillar Alpha called `verify_lane` with arguments the substrate rejects at the boundary.** I specified `evidence_bundle.sources = []` and no claims; the substrate requires `min(1)` on both per `claude/mcps/principales/src/server.ts:31-44` and `pipeline/request-builder.ts:37-38`. Root cause: I treated `verify_lane` as fire-and-forget when it is a structured request requiring claim extraction + evidence assembly by the dispatcher.

**MISUNDERSTANDING #2 — Pillar Beta dispatch shape undefined for the same reason.** Same root cause. The dispatcher must construct 11 fields including `claims`, `evidence_bundle`, `artifact_slice`, `artifact_sha`, `run_id`, `bundle_id`, etc.

**Resolution:** Imperator confirmed Option 1 — build Pillar Alpha on Principales properly with claim extraction + lane-specific evidence assembly. Same approach for Pillar Beta with section-level claims.

**The lesson:** the substrate's `verify_lane` is **not** "give it text, get back a critique." It is "give it claims and evidence about an artifact slice; get back per-claim verdicts." Any future integration spec **must** read `server.ts` zod schema and `request-builder.ts` BEFORE specifying any dispatch mechanics. Read the source, not the brainstorm vocabulary.

---

## What Killed Iteration 2 (escalated; spec halted)

### MISUNDERSTANDING #1 — `prd-doctrine-alignment` profile assignment

**Caught by:** Censor.

**The error:** I assigned `prd-doctrine-alignment` the `principalis_grounded` profile reasoning that doctrine cross-check warranted the K2.6 escalation tier. Per `claude/skills/references/verification/principales.md:85`, **`principalis_grounded` is RESERVED for Mode B** — it requires host tools that v1 does not have. Every v1-enabled lane in `lanes.md` uses `principalis_light` or `principalis_adversarial`; not one uses `principalis_grounded`.

**The fix:** assign `principalis_light` like the other PRD lanes. Doctrine cross-check is text-pattern matching against pre-loaded doctrine excerpts in the evidence bundle; it does not require host tools.

**The lesson:** confirm substrate profile reservations before assigning profiles. The substrate doctrine is the contract; profile names that look meaningful in the brainstorm may have constraints that deny the assignment.

### MISUNDERSTANDING #2 — Codex auto-feed loop misuse

**Caught by:** Provocator.

**The error:** I wrote "PRD GAPs auto-feed to the Imperator (the producer of the PRD), not the Consul" and cited Codex 56-58 + protocol 181. The Codex auto-feed loop has no concept of "auto-feeding to the Imperator." The Imperator is the **escalation** target after MISUNDERSTANDINGs and after two failed auto-feed iterations. The auto-feed loop only routes to Claude subagents.

**The fix:** reframe PRD GAP handling either as (a) "Consul absorbs into deliberation; Consul raises to Imperator as a deliberation question through the conversation channel — Consul behavior, not Codex auto-feed" or (b) "Pillar Alpha runs OUTSIDE the Codex auto-feed loop entirely; defines its own small routing rule that does not borrow Codex auto-feed language."

**The lesson:** when integrating something new with the Codex's existing protocols, do not borrow Codex vocabulary for new routing directions the Codex doesn't authorize. If the integration needs a new direction, name it explicitly as new, not as a Codex extension.

### MISUNDERSTANDING #3 — `linear-server` allowlist provenance fabricated

**Caught by:** Provocator.

**The error:** I wrote "verified `mcp__linear-server__*` is allowlisted in `~/.claude/settings.json:14`." The truth: line 14 is the **permission allowlist** (which tools auto-execute without prompting), not the MCP server registry. The actual `linear-server` MCP is registered in `~/.claude.json:752` and `2088`. The detection mechanism (try-and-catch on `mcp__linear-server__get_issue`) is **behaviorally correct**; my **citation** is wrong. A Soldier reading the spec to debug a broken Linear lookup will edit settings.json and find nothing relevant.

**The fix:** cite `~/.claude.json` as the actual MCP server registry; clarify the distinction between Claude Code's permission allowlist (settings.json) and its MCP server registry (.claude.json).

**The lesson:** "verified at file:line" is a confidence-boosting mechanism that requires literal verification, not approximate. If the Provocator catches a fabricated citation, the spec's other "verified" annotations become suspect by association. Don't cite without checking the file.

### MISUNDERSTANDING #4 — Shadow alarm "sidebar" mechanism doesn't exist

**Caught by:** Provocator.

**The error:** I described the shadow MISUNDERSTANDING surfacing as an "end-of-dispatch shadow alarm sidebar to Imperator with chain of evidence" and contrasted it against silent JSON-only burial. **Consilium has no sidebar primitive.** "Sidebar" is product UI vocabulary borrowed from Linear/Slack/Notion. The Consilium's only surfacing mechanism is plain conversational text emitted by the Consul/Legatus skill body — see `legion/SKILL.md:261-265` for the actual pattern ("Legatus reports to Imperator: 'Campaign review complete...'").

**The fix:** define the surfacing concretely in SKILL.md amendment terms — either (a) an end-of-dispatch summary block with a `### Shadow Alarm` heading containing bullet list of Kimi-only MISUNDERSTANDINGs and chain of evidence, or (b) a halt-style report that interrupts the normal dispatch summary ("Shadow alarm — Kimi flagged a MISUNDERSTANDING the officer did not. Pausing for your review."). The mechanism must be specified in the actual SKILL.md text the Soldier writes, not as an abstract "sidebar."

**The lesson:** when promising surfacing semantics, read the existing skill bodies first. The existing pattern is plain prose; if a new pattern is needed, design it concretely in SKILL.md syntax. Borrowing UI vocabulary from outside the Consilium produces specs that cannot be implemented as written. Two iterations in a row failed on this exact concern (iteration 1: silent JSON-only burial; iteration 2: fabricated sidebar). The third try should specify the prose mechanism explicitly.

---

## The 13 Iteration-2 GAPs

These would have auto-fed back to the Consul in iteration 3 if the Imperator had not chosen halt. Preserved here so a future Consul can pre-empt them.

### Doctrinal GAPs

1. **Lane double-fire on plan dispatches.** `migration-risk` and `literal-execution-failure` appear in BOTH the Praetor-on-plan and Provocator-on-plan rows of the Lane Mapping Table. Each plan-verify dispatch fires these lanes twice (once per officer's shadow set) → both writes target the same `<run_id>-<lane>.json` → re-introduces the writer-writer race the per-dispatch sub-files were designed to eliminate. **Fix:** include officer in sub-file name (`<run_id>-<officer>-<lane>.json`), OR specify single-fire-shared-by-both, OR remove the duplication.

2. **PRD producer ambiguity for auto-feed routing.** The spec assumes Imperator is the PRD producer. PRDs may be authored by others (Linear team members, vendors). When PRD is pasted from someone else's authorship, the producer-routing rule is undefined. **Fix:** define producer determination — Linear `created_by` for Linear-sourced; Imperator-by-default for pasted; opt-out via Imperator naming a different producer.

3. **Shadow MISUNDERSTANDING timing silence.** Between Kimi MISUNDERSTANDING emission and the end-of-dispatch surfacing, the officer-side auto-feed loop continues. If Kimi is correct, the Consul revises the spec on iteration 2 against an officer GAP set that does not reflect the deeper conceptual error. **Fix:** specify either (a) alarm surfaces after auto-feed completes (current implication, with documented cost) or (b) alarm surfaces immediately after Kimi emits, breaking the "campaign continues" claim.

4. **`findings_digest: string` is lossy.** The substrate emits per-claim verdicts that are load-bearing for the tally's promised drill-down ("show me Kimi-only findings for upstream-coverage") and Imperator tagging. A string digest doesn't preserve them. **Fix:** either replace with explicit per-claim record array, or store the FULL substrate docket as a sub-field.

### Operational GAPs

5. **Per-dispatch sub-file directory creation owner unstated.** The dispatching skill needs to create `docs/cases/<slug>/principales-shadow/` before fanning out parallel writes. First-fire-creates is racy. **Fix:** SKILL.md amendment requires `mkdir -p` (atomic, idempotent, recursive) in a single-threaded preamble before the parallel fan-out.

6. **Sanity test 4 implementation infeasible as vitest test.** "Capture officer dispatch prompts from both runs" describes the assertion not the mechanism. The dispatcher is a SKILL.md body executed by Claude, not a callable JS function. There is no test seam. **Fix:** either (a) refactor prompt-construction into a pure function callable from vitest (architectural change, possibly out of scope), or (b) demote test 4 from automated to Imperator-driven smoke alongside the tally smoke run, AND honestly acknowledge the Domain-Knowledge Independence Invariant has reviewer-discipline + smoke enforcement, not automated regression.

7. **Cost arithmetic understates by one iteration.** The auto-feed loop's "max 2 iterations" means initial dispatch + 2 revisions = **3 dispatches per artifact**, not 2. Corrected worst case ≈ $0.80/case (still well within $5 budget but the spec's "well within budget" defense was built on understated math).

8. **Long PRDs breach the 20-claim cap unbounded.** A 50-sentence PRD has more substantive claims than the spec's cap. **Fix:** specify chunked-dispatch with per-PRD ceiling, OR a "first-N-claims-only with warning" rule.

9. **`test/integration/` directory greenfield.** The spec says tests live there but the directory does not exist. **Fix:** SKILL.md / plan must explicitly create the subdirectory before writing test files.

10. **`run_id` uniqueness assumption.** The spec uses `<run_id>-<lane>.json` for sub-file names. If `run_id` is artifact-derived (`sha256(spec.md)`), two iterations of the same lane on unchanged sections collide on disk. **Fix:** specify UUID v4 generated per dispatch; never derived from artifact content.

### Documentation GAPs

11. **Tribune phase reference wrong.** Spec says "tribune Phase 6 dispatches Provocator at `tribune/SKILL.md:181`." Truth: Phase **5** (not 6) dispatches **Tribunus + Provocator** in parallel (not Provocator alone). Spec conclusion (tribune excluded from shadow dispatch in v1) is correct; reasoning chain broken.

12. **`/principales-tally` registration semantics unclear.** Spec says "update CLAUDE.md Commands section." Doesn't define: Commands vs Maintenance section? slash-arg drill-down syntax (`/principales-tally upstream-coverage`) vs free-form follow-up? expected invocation pattern? Soldier picks one and Imperator may discover the wrong choice in production.

13. **`prd-doctrine-alignment` evidence-bundle composition under-specified.** "PRD body + relevant doctrine excerpts" — `$CONSILIUM_DOCS/doctrine/` has 16+ files. The Consul has to make a runtime determination; over-includes produce noise, under-includes miss alignment failures. **Fix:** specify a concrete heuristic — "Always include codex.md. Conditionally include domain MANIFEST.md and any domain file the PRD title or first-paragraph keyword matches. Cap at 3 files, 200 lines each."

---

## The 5 Iteration-2 CONCERNs

1. **Self-reference duplication cost.** 9 of 10 v1 lanes use spec-self-reference as evidence; same artifact text is sent twice per dispatch (artifact_slice + evidence_bundle.sources[0]). Cost ~$0.16/case for first dispatch in a session before prompt cache warms. Worth substrate v2 cleanup to permit empty `evidence_bundle.sources` when lane metadata permits.

2. **Missing sanity test 5 (Pillar Alpha control diff).** Spec accepts indirect contamination via Pillar Alpha → Consul cognition → officer brief. Adding a `CONSILIUM_PRINCIPALES_PRD_ATTACK=on` vs `=off` byte-diff sanity test would not block (Pillar Alpha SHOULD shape the brief — that's the design) but would log the magnitude of diff per case for the promotion-case decision.

3. **Indirect contamination risk model shallow.** Worst case: Imperator's PRD framing biases Pillar Alpha → biases Consul deliberation → biases spec → biases officer brief → officer SOUNDs the biased brief because it's internally consistent. Imperator never sees the contamination. Mitigation: per-case `prd-attack-impact.md` paragraph naming which Pillar Alpha findings shaped the spec — makes the chain auditable in `/principales-tally`.

4. **`lane_status` enum incomplete.** Missing `consul_skipped` (Imperator wave-off), `imperator_skipped` (env-var off), `prd_absent` (no PRD). Without these, the tally aggregator can't distinguish "shadow off this case" from "Kimi unreachable."

5. **"No Imperator-mediated cross-case contamination" invariant could be partially structural.** Spec acknowledges this is behavioral discipline. Could be partly structural: SKILL.md hard rule that "Consul does not read `principales-shadow/` directories during deliberation; only `/principales-tally` reads them." Imperator can audit violations from conversation log.

---

## What the Iteration-2 Spec Got RIGHT (preserve for v2)

- **Three-layer hierarchy** (Consul → Officer-Centurion → Principales) is the Imperator's chosen topology.
- **Shadow Mode for verifiers** as the v1 strategy preserves the Codex Independence Rule at the dispatch boundary without amendment. This is the architectural insight worth keeping.
- **Per-dispatch sub-files** (one `<run_id>-<lane>.json` per lane, separate `principales-shadow-tags.json` for Imperator tags) eliminates writer-writer races. Race-fix design is sound.
- **PRD source detection mechanism** (try-and-catch on `mcp__linear-server__get_issue`, paste fallback) is behaviorally correct.
- **Codex finding handling** for the four verdicts on PRD dockets (MISUNDERSTANDING halts, GAP/CONCERN to Consul absorption, SOUND audits) is structurally right (modulo the auto-feed-vocabulary MISUNDERSTANDING).
- **Indirect contamination acknowledged** in Invariants — the framing is doctrinally honest; the Codex spirit permits naming compromises.
- **march excluded from Campaign Review shadow** (no triad dispatch site) is correct.
- **Tribunus excluded from shadow** (patrol depth, ~30x dispatch volume inflation) is principled.
- **Codex untouched** — no amendment needed in shadow mode is the right call.
- **Substrate code untouched** — all changes are skill amendments + lane prompt content edits.

---

## The Imperator's Recommended Path Forward

> Per Imperator's halt selection: "Manual experiment: in next real Consul case, manually invoke `verify_lane` after officer dispatch on a few lanes; observe Kimi behavior and substrate friction. Use the experiment to inform a clean integration spec later (v0.5 — manual integration learnings)."

Concrete suggestion for the next real case (whoever picks this up next):

1. **Pick a real Consul case** — a normal feature spec from a Linear PRD.
2. **Manually invoke `mcp__principales__verify_lane`** after the Censor + Provocator return their verdicts. Use 2-3 lanes (e.g., `upstream-coverage`, `ambiguity-audit`, `contradiction-hunt`).
3. **Construct the dispatch contract by hand:**
   - Read the spec body
   - Extract section-level claims (one per section heading, ~10 claims)
   - Assemble evidence bundle per lane (doctrine excerpts for upstream-coverage; spec self-reference for ambiguity-audit and contradiction-hunt)
   - Pass these to `verify_lane`
4. **Compare manually** — diff Kimi findings against officer findings. Note overlap, divergence, time delta, cost, surprise.
5. **Write a brief `learnings.md`** in the case directory:
   - Did Kimi catch real GAPs? Which?
   - Did Kimi miss real GAPs? Which?
   - Did Kimi flag MISUNDERSTANDINGs? Were they real?
   - How long did construction-of-dispatch-contract take vs running-the-officer?
   - What surprised you?
6. **After ~5 real cases**, the manual learnings inform a v2 integration spec with empirical grounding.

The substrate is the platform. The integration is the application. We don't yet have enough application experience to know what the integration should look like.

---

## What I Would Tell My Future Self (The Consul's Lesson)

I have the same trauma as the Censor's catalog-vs-saved-product story. Twice now in this session — iteration 1 and iteration 2 — I asserted facts about the substrate I had not verified, and the Provocator caught me. The pattern:

- Iteration 1: I assumed `verify_lane` was fire-and-forget. Read `server.ts` after the Provocator caught me.
- Iteration 2: I assumed `principalis_grounded` was a fine profile choice. Read `principales.md:85` after the Censor caught me.
- Iteration 2: I assumed `linear-server` lived in settings.json. Read `~/.claude.json` after the Provocator caught me.
- Iteration 2: I assumed Consilium had a sidebar primitive. Read existing SKILL.md surfacing patterns after the Provocator caught me.

Each verification fix took one minute of file-reading I did not do upfront. The Consul's discipline ("I do not explore inline. When I need to verify something in the codebase, I dispatch a scout") was applied to broad recon and not applied to the specific substrate facts I was asserting. **For meta-specs that touch the verification system itself, the substrate IS the artifact under verification — read the substrate source and substrate doctrine inline during codification, not just during reconnaissance.**

If a future Consul takes this case up again: read `claude/mcps/principales/src/server.ts`, `request-builder.ts`, `verify-lane.ts`, `cross-field.ts`, `claude/skills/references/verification/principales.md`, and `lanes.md` IN FULL before drafting any dispatch mechanics. Read the existing skill bodies (`consul/SKILL.md`, `edicts/SKILL.md`, `legion/SKILL.md`) IN FULL before promising any surfacing semantics. The substrate is the contract; the existing skills are the deployment surface; the spec sits between them and is constrained by both.

---

## Reading Order for the v2 Attempt

1. **This file** — for the lesson and the unresolved findings catalog.
2. **`spec.md`** in this directory — for the architectural shape that survived iteration 2 (preserve what's right; address what's wrong).
3. **`docs/cases/2026-04-26-kimi-principales-v1/spec.md` and `next-session-notes.md`** — substrate context and the original deferred MISUNDERSTANDING #1.
4. **The substrate source** — `claude/mcps/principales/src/server.ts`, `pipeline/request-builder.ts`, `tools/verify-lane.ts`, `docket/cross-field.ts`, `docket/locator.ts`, `docket/schema.ts`. **Read these BEFORE writing dispatch mechanics.**
5. **The substrate doctrine** — `claude/skills/references/verification/principales.md` and `lanes.md`.
6. **The existing skill bodies** — `consul/SKILL.md`, `edicts/SKILL.md`, `legion/SKILL.md`, `tribune/SKILL.md`. **Read these BEFORE specifying surfacing semantics.**
7. **The Codex** — `docs/codex.md`, especially the Independence Rule (134-146), Auto-Feed Loop (124-130), Finding Categories (35-83). **Don't borrow Codex vocabulary for new routing directions.**
8. **The verification protocol** — `claude/skills/references/verification/protocol.md`.
9. **`~/.claude/settings.json` AND `~/.claude.json`** — distinguish permission allowlist from MCP server registry.

---

## Files Touched by This Case (preserved)

- `docs/cases/2026-04-26-kimi-principales-integration/spec.md` — iteration 2 spec, preserved as architectural reference (not for execution)
- `docs/cases/2026-04-26-kimi-principales-integration/next-session-notes.md` — this file
- Git history at `kimi-principales-v1` branch:
  - Commit `a461cbe` — iteration 1 spec
  - Commit `11f25d3` — iteration 2 spec

No skill files, no agent files, no MCP code, no Codex, no doctrine files were modified. The Consilium runtime is bytewise unchanged from before this session.
