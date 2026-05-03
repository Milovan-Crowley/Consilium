## Planning Standard

When you write a plan or build order, keep it compact and execution-grade:

- Goal: one sentence
- Scope in: explicit
- Scope out: explicit
- Plan scale: Patch, Feature, or Campaign
- Implementation shape: the chosen approach and coordination boundaries
- Optional `**Parallel-safe wave:**` line after Implementation shape when Files-block evidence proves one wave
- Ordered tasks: concrete, named, and verifiable
- Verification: which rank checks what, and when

Plans are **decision-complete** and **code-selective**. They tell the implementing rank the files, responsibilities, interfaces, acceptance criteria, verification, and already-made choices. They include exact code only when the snippet protects correctness better than prose: contracts, schemas, fragile domain logic, fixed literals, dangerous commands, or known failure examples.

Task size is a coherent implementation unit, not a micro-action and not an omnibus bucket. Ordinary implementation mechanics belong to the implementing rank unless the plan must constrain them to protect correctness.

Task shape:
- One clear owner rank
- One repo lane unless explicitly cross-repo
- Files, objective, decisions already made, acceptance, verification
- One verification point when the output can poison later steps
- No giant omnibus tasks

Files-block contract:
- Every task carries a `**Files:**` block. The writes set is the union of paths under `Create:`, `Modify:`, and `Test:`.
- Recognized sub-bullets are exactly `Create:`, `Modify:`, `Test:`, and `Read:`. Sub-bullets are mandatory; a flat path list under `**Files:**` is malformed.
- `Create:`, `Modify:`, and `Test:` entries are explicit file paths. No globs or wildcards are allowed in writes entries. Next.js bracketed route segments such as `[id]`, `[...slug]`, and `[[...slug]]` are literal path segments, not globs. A `Modify:` entry may include a line-range suffix for edits, but the file path remains the write path.
- `Read:` entries name files or path patterns the task depends on for context but does not write. Wildcards are allowed in `Read:` entries.
- A task with no writes uses the literal marker:

```markdown
**Files:**
- (none)
```

For reads-only work, keep `(none)` as the explicit empty writes marker and place `Read:` entries after it.
- Generator-run tasks invoking `python3 runtimes/scripts/generate.py` or `bash codex/scripts/install-codex.sh` do not enumerate generator-derived files under `Modify:`. Hand-edited files still appear under `Modify:`. Build commands such as `npm run build`, `tsc`, or `next build` do not receive this carve-out.

Parallel-safe wave callout:
- Use `**Parallel-safe wave:** tasks <task numbers> — Files-block write sets are disjoint, Read entries declared and non-overlapping with sibling writes.` only when the evidence earns it.
- The wave's writes set is exactly `Create:` + `Modify:` + `Test:`. `Read:` entries are required for every wave task and may not overlap sibling writes. `(none)` is the empty write set.
- Omit the callout when reads are missing, writes overlap, a sibling read/write overlap exists, or two wave tasks invoke the same recognized canonical generator command.
- At most one wave callout is allowed. Multi-wave structure returns to decomposition before plan execution.
