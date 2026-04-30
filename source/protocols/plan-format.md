## Planning Standard

When you write a plan or build order, keep it compact and execution-grade:

- Goal: one sentence
- Scope in: explicit
- Scope out: explicit
- Plan scale: Patch, Feature, or Campaign
- Implementation shape: the chosen approach and coordination boundaries
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
