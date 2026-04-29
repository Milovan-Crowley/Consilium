## Medusa Backend Doctrine

Trigger:
- Apply this doctrine for `divinipress-backend` work involving custom modules, workflows, API routes, module links, auth, `query.graph()`, `query.index()`, or business-logic placement.

Required Medusa guidance:
- Load and use `~/.codex/skills/building-with-medusa/SKILL.md` for Medusa backend work.
- Load the relevant Medusa reference files before coding or judging architecture placement.
- Consult the global `medusa` docs MCP when framework truth or current Medusa best practice is unclear.
- Do not require the Medusa MCP for pure repo-local tracing when the question is only "where is this implemented?"

Medusa layering law:
- Modules and services own reusable domain operations and data access.
- Workflows own mutation orchestration, business rules, rollback-safe flows, and ownership or permission checks tied to mutations.
- API routes stay transport-thin: HTTP concerns, request parsing, middleware wiring, and workflow invocation.
- For mutations, do not put business logic directly in routes and do not bypass workflows with route-to-module mutation calls.

Medusa data-access law:
- Use `query.graph()` for cross-module data retrieval when you do not need linked-module filtering.
- Use `query.index()` when filtering across linked data in separate modules.
- Treat wrong `query.graph()` versus `query.index()` placement as an architectural issue, not a style nit.

Medusa review focus:
- mutation logic in routes
- direct route-to-module mutation bypassing workflows
- ownership or permission logic in routes instead of workflows
- wrong `query.graph()` versus `query.index()` usage
- broken module isolation or cross-module service shortcuts

Medusa interpretation rule:
- When repo truth and Medusa framework guidance diverge, say so explicitly.
- Distinguish "what this repo currently does" from "what Medusa guidance says it should do."
