## Cross-Repo Doctrine

- Frontend and backend do not share the same truth surfaces.
- When roles, statuses, route contracts, or workflow transitions disagree, backend truth wins until proven otherwise.
- Use the Arbiter when a task depends on frontend and backend agreeing.
- Use repo-specific ranks by default. Generic rescue ranks are for reduced ambiguity, not first contact.
- If a fix needs both repos, split it or escalate it. Do not let one rank wander blind into the other repo.
