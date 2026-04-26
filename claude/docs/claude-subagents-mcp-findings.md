# Giving Claude Code Subagents MCP Tool Access

**Research findings from 2026-04-10 investigation. Applies to Claude Code 2.x.**

## TL;DR

- **Plugin-defined subagents cannot access MCP tools.** This is documented Anthropic security policy, not a bug. It will not be "fixed."
- **User-scoped subagents at `~/.claude/agents/*.md` CAN access MCP tools** via the explicit `mcpServers:` frontmatter field. This is the documented, supported workaround.
- **Built-in subagents** (`Explore`, `Plan`, `general-purpose`) are documented to inherit MCP from the main session, but in this environment they do not — root cause unknown, possibly related to the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` flag.
- **Working pattern proven:** `~/.claude/agents/code-navigator.md` with `mcpServers: [serena]` successfully accesses Serena in subagent contexts. Resolved `useCustomOrder` symbol in **1 tool call, 28.8k tokens, 8 seconds** vs. 3 tool calls (Grep+Glob+Read) for the equivalent Explore-based task.

## Why this matters

Claude Code subagents that can't access MCP tools fall back to `Grep + Glob + Read` for code navigation. On a TypeScript codebase of any size, this is 3-5x more expensive per navigation operation than a single LSP symbol lookup via Serena. For subagent-heavy workflows (consilium, checkit, impeccable, GSD-style orchestrators), this compounds into significant token waste across every PR.

## The discovery: it's documented security policy

From the official Claude Code subagents documentation at <https://code.claude.com/docs/en/sub-agents>, in the "Plugin subagents" subsection:

> *"For security reasons, plugin subagents do not support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields. These fields are ignored when loading agents from a plugin. If you need them, copy the agent file into `.claude/agents/` or `~/.claude/agents/`."*

This reframes the entire landscape of open bug reports on this topic. Multiple tickets ([#13605](https://github.com/anthropics/claude-code/issues/13605), [#21560](https://github.com/anthropics/claude-code/issues/21560), [#23374](https://github.com/anthropics/claude-code/issues/23374)) are "working as designed" from Anthropic's perspective — plugin-scoped agents are deliberately sandboxed from MCP access for security reasons.

**Implication:** Consilium, checkit, impeccable, and any other Claude Code plugin that ships subagents via its `agents/` directory will **never** have MCP tool access, no matter what configuration is tried. There is no fix. The only path is to rebuild them at user or project scope.

## The solution: explicit `mcpServers:` frontmatter binding

User-scoped subagents (at `~/.claude/agents/*.md`) support the full frontmatter spec, including the `mcpServers:` field. This is the official mechanism for attaching an already-configured MCP server to a specific agent.

Minimal working example:

```yaml
---
name: code-navigator
description: Symbol-level code navigation via Serena LSP. Use for any task involving finding where code is defined, finding callers of a function, or surgically editing function bodies in a TypeScript/JavaScript codebase.
tools: mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, Read, Grep, Glob
mcpServers:
  - serena
model: sonnet
---

You are a code navigation specialist. Use Serena tools for code symbols. Use Grep for text/comments.
```

### Key frontmatter fields

|-|-|
| `name` | Unique identifier, lowercase with hyphens |
| `description` | Auto-delegation trigger — describes when Claude should pick this agent |
| `tools` | **Allowlist** of specific tools the subagent can call. Include MCP tools with full `mcp__<server>__<tool>` names |
| `mcpServers` | **Explicit binding** of MCP servers to this subagent. Each entry is either a server name (referencing already-configured servers) or an inline definition |
| `model` | `sonnet` / `opus` / `haiku` / `inherit` — Sonnet is a good default for nav tasks |
| `permissionMode` | `default` / `acceptEdits` / `bypassPermissions` / `plan` — controls approval behavior |
| `skills` | Skills to load into the subagent at startup (useful — subagents don't inherit parent skills) |

The `tools` and `mcpServers` fields work together: `mcpServers` binds the server, `tools` allowlists which specific tools from that server can be called. Both are required for reliable operation.

## The empirical test

### Test 1: Explore subagent with user-scope Serena MCP
**Setup:** Serena registered at `~/.claude.json` user scope via `claude mcp add --scope user`. Verified connected in main session.

**Prompt:** *"Use the Explore subagent to find where `useCustomOrder` is defined."*

**Result:** Explore did not call `mcp__serena__find_symbol`. Fell back to `Grep` + `Glob` + `Read` — three tool calls to resolve one symbol. Never attempted Serena.

**Conclusion:** Despite docs claiming built-in subagents inherit all MCP tools from the parent session, this did not happen in the tested environment. Root cause unknown.

### Test 2: Custom `code-navigator` subagent with explicit `mcpServers:` binding
**Setup:** Wrote `~/.claude/agents/code-navigator.md` with `mcpServers: [serena]` frontmatter and Serena tools in the allowlist. Restarted Claude Code.

**Prompt:** *"Use the code-navigator subagent to find where `useCustomOrder` is defined and show me the symbol body."*

**Result:** Single `mcp__serena__find_symbol` call. Returned `src/app/_domain/custom-order/hooks/useCustomOrder.ts:7-23` with the full function body and a concise contextual explanation. **1 tool use, 28.8k tokens, 8 seconds.**

**Conclusion:** Explicit `mcpServers:` binding on a user-scoped agent works. This is the workaround.

## Trade-off analysis: when to use code-navigator vs direct orchestrator calls

Spawning a subagent has fixed overhead — the subagent's system prompt, inherited CLAUDE.md, tool definitions, and the delegation prompt all have to be loaded before any useful work happens. For the `code-navigator` agent, the observed fixed cost is roughly 25-30k tokens per invocation.

|-|Cost|Best for|
| **Direct Serena call in orchestrator** | ~500-2k tokens per lookup | Simple 1-2 symbol tasks, inline work during main session flow |
| **Delegate to `code-navigator`** | ~28k fixed + ~500/lookup | Complex 3+ symbol tasks, want to isolate from main context, avoid context rot on long sessions |
| **Delegate to `Explore` + pre-resolved context** | ~15-40k depending on scope | When you need Explore's broader exploration behavior but want it to skip the discovery phase. Orchestrator pre-resolves symbols with Serena, inlines them in the delegation prompt. |

**Rule of thumb:** If the task involves fewer than 3 symbol lookups and you don't need context isolation, call Serena directly in the orchestrator. Everything else, delegate to `code-navigator` or pre-resolve before delegating to a plugin-scoped agent.

## Implications for Consilium (and similar plugin-based workflows)

Consilium currently ships its subagents (`gladius`, `legion`, `castra`, `consul`, `tribune`, `tribunal`, `audit`, `sententia`, `edicts`, `march`, `phalanx`, `forge`, `triumph`) as plugin-defined agents at `/Users/milovan/projects/Consilium/claude/.../agents/`. Per the documented security policy, **none of these can have MCP tool access**. They all fall back to Grep+Read for code navigation.

### Migration paths (in order of invasiveness)

**Path A — Add a user-scoped worker pool (recommended).**
Keep the consilium plugin as-is for distribution. Create a small set of user-scoped worker agents at `~/.claude/agents/` that consilium orchestrators delegate *to*. Workers have MCP access; consilium agents stay portable.

Example: `consilium-gladius` at `~/.claude/agents/consilium-gladius.md` with `mcpServers: [serena]`. The plugin's actual `gladius` orchestrator detects the user-scoped worker and delegates code-navigation-heavy tasks to it. Plugin logic stays in the plugin; MCP access lives at user scope.

Cost: Need to update consilium's orchestration prompts to look for and delegate to user-scoped workers. Not trivial but contained.

**Path B — Copy key agents to user scope.**
Duplicate the 2-4 consilium agents that most benefit from MCP access (probably `gladius`, `legion`, `tribune`, maybe `forge`) into `~/.claude/agents/`. Add `mcpServers:` frontmatter. Use these user-scoped versions when MCP matters; fall back to plugin versions otherwise.

Cost: Maintenance burden — every consilium source update requires re-syncing the user-scoped copies. Drift risk.

**Path C — Rewrite consilium as user-scoped only.**
Abandon the plugin architecture. Ship consilium as a set of files that install to `~/.claude/agents/`, `~/.claude/commands/`, and `~/.claude/skills/` directly. Users install via a script, not the plugin marketplace.

Cost: Loses plugin distribution benefits. Loses `/plugin` install UX. Forces users to manage updates manually.

### Recommendation

**Path A** is the cleanest. The consilium plugin remains a distributable unit; the user-scoped workers are a local optimization each user creates once. You could ship example worker agents in the consilium docs ("here's a `consilium-gladius.md` template — put it in `~/.claude/agents/` to enable MCP access") without making them part of the plugin itself.

This also aligns with how GSD handles a similar problem — GSD injects skills into agents at spawn time via the `agent_skills` config rather than trying to make plugin agents inherit everything from the parent. Same philosophy: let the plugin be a plugin, move the MCP-dependent work to a layer outside the plugin boundary.

## Unresolved mysteries

### Why doesn't the built-in `Explore` subagent inherit MCP?

Per the official Claude Code docs (<https://code.claude.com/docs/en/sub-agents>):

> *"Subagents can use any of Claude Code's internal tools. By default, subagents inherit all tools from the main conversation, including MCP tools."*

Per multiple bug reports ([#13605](https://github.com/anthropics/claude-code/issues/13605), [#21560](https://github.com/anthropics/claude-code/issues/21560)):

> *"Built-in agents like `general-purpose` DO receive MCP tools"*

In this environment, they don't. `Explore` fell back to Grep without attempting any `mcp__serena__*` call. Possible causes (unverified):

1. **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`** — this experimental flag is set in `~/.claude/settings.json` and may change the agent-spawning code path, potentially interfering with tool inheritance. Worth flipping to `"0"` and re-testing.
2. **User-scope vs project-scope MCP inheritance** — Serena is registered at user scope (`~/.claude.json`). It's possible that user-scope MCP servers don't propagate to subagents the same way project-scope servers (in `.mcp.json` at repo root) do. Worth testing by adding Serena to a project-level `.mcp.json` alongside the user-scope registration.
3. **Bug specific to a Claude Code version** — possible but unverifiable without testing multiple versions.

Because the `code-navigator` workaround works regardless of which of these is true, resolving this mystery is not blocking. It's worth filing as a bug report with clean repro evidence.

### Does the `mcpServers:` inline definition form work as well as the server-name reference form?

Per docs, `mcpServers:` accepts either:

```yaml
# Server name reference (tested, works)
mcpServers:
  - serena

# Inline definition (untested)
mcpServers:
  serena:
    command: /opt/homebrew/bin/uvx
    args:
      - --from
      - git+https://github.com/oraios/serena
      - serena
      - start-mcp-server
```

Only the reference form has been empirically verified. Inline definitions should theoretically work and would let you ship self-contained agents that don't require the MCP server to be pre-registered, but this hasn't been tested.

## References

| Source | Content |
|-|-|
| <https://code.claude.com/docs/en/sub-agents> | Official Claude Code subagents documentation. Canonical frontmatter field reference. Contains the plugin security policy quote. |
| <https://code.claude.com/docs/en/settings> | Settings scope hierarchy. Clarifies where user, project, and local MCP configs live. |
| <https://github.com/anthropics/claude-code/issues/13605> | "Custom plugin subagents cannot access MCP tools" — documents the restriction with repro steps. |
| <https://github.com/anthropics/claude-code/issues/21560> | "Plugin-defined subagents cannot access MCP tools - breaks plugin ecosystem" — lists attempted workarounds that fail. |
| <https://github.com/anthropics/claude-code/issues/14714> | "Subagents don't inherit parent conversation's allowed tools" — related permission issue. |
| <https://github.com/anthropics/claude-code/issues/14496> | "Task tool subagents fail to access MCP tools with complex prompts" — edge case in inheritance. |
| <https://github.com/anthropics/claude-code/issues/13700> | Feature request for lazy-loaded agent-scoped MCPs. |
| <https://github.com/gsd-build/get-shit-done> | GSD framework — uses skill injection into agents as a workaround for a similar problem (not MCP inheritance, but skill inheritance). |
| <https://github.com/roddutra/agent-mcp-gateway> | MCP Gateway pattern — external proxy that provides per-subagent MCP controls. Overkill for most use cases but exists. |

## Working example: the full `code-navigator.md`

Location: `~/.claude/agents/code-navigator.md`. This is the working file that was empirically validated.

```yaml
---
name: code-navigator
description: Symbol-level code navigation and editing via Serena LSP. Use for any task involving finding where code is defined, finding callers of a function, understanding file structure, or surgically editing function bodies in a TypeScript/JavaScript codebase. Dramatically more token-efficient than Grep+Read+Edit for code symbol work. NOT for text/comment/config searches.
tools: mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__serena__list_dir, mcp__serena__find_file, mcp__serena__search_for_pattern, mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol, mcp__serena__rename_symbol, mcp__serena__safe_delete_symbol, mcp__serena__activate_project, mcp__serena__check_onboarding_performed, Read, Grep, Glob, Bash
mcpServers:
  - serena
model: sonnet
---

You are a code navigation and editing specialist for TypeScript/JavaScript codebases. You have direct Serena MCP access for symbol-level intelligence via Language Server Protocol.

## Use Serena for code symbols

A "code symbol" = any camelCase / PascalCase / snake_case function, class, method, variable, type, interface, enum, or React component name.

**Finding:**
- `mcp__serena__find_symbol("X")` — where X is defined. Never Grep a symbol name.
- `mcp__serena__find_referencing_symbols("X")` — all callers of X
- `mcp__serena__get_symbols_overview("path/file.ts")` — skim a file's structure without reading it
- `mcp__serena__find_file("pattern")` — file-name search
- `mcp__serena__search_for_pattern("regex")` — regex search across code files

**Editing:**
- `mcp__serena__replace_symbol_body(...)` — rewrite a function body without loading the whole file
- `mcp__serena__insert_after_symbol` / `insert_before_symbol` — inject code at symbol boundaries
- `mcp__serena__rename_symbol` — rename via LSP reference graph, not text matching
- `mcp__serena__safe_delete_symbol` — delete with reference checking

## Use built-in tools otherwise

- **Grep** for text, comments, TODOs, error strings, env vars (SCREAMING_SNAKE_CASE), config files, non-code content
- **Read** for non-code files (.md, .json, .yaml, tsconfig.json) or when Serena can't resolve a symbol you know exists
- **Glob** for file pattern matching
- **Bash** for running tsc, tests, lints, or other tooling

## Project activation

If a Serena call returns "no project activated", call `mcp__serena__activate_project("/absolute/path/to/project")` using the current working directory, then retry. Serena is configured with `--project-from-cwd` so it usually auto-detects.

## After symbol edits

Serena's symbol-editing tools (`replace_symbol_body`, `insert_after_symbol`, etc.) bypass Claude Code's built-in Edit pipeline, so native LSP auto-diagnostics may not trigger. After any symbol edit on a `.ts` / `.tsx` file, briefly Read the affected area to let LSP catch up and surface any diagnostics. Skip for trivial one-liner changes.

## Reporting

Report findings concisely — file:line references and specific symbol bodies, not entire file dumps. The orchestrator delegating to you is paying for every token you return.
```

## Reproduction steps for future verification

If Anthropic changes this behavior or if this environment drifts, verify the pattern still works with:

1. Confirm Serena is registered: `claude mcp list | grep serena` should show `✓ Connected`
2. Confirm the agent file exists: `ls ~/.claude/agents/code-navigator.md`
3. Fully quit and relaunch Claude Code (user agents load at session start)
4. Run the test prompt: *"Use the code-navigator subagent to find where `useCustomOrder` is defined and show me the symbol body."*
5. Expected: 1 tool use (`mcp__serena__find_symbol`), returns `src/app/_domain/custom-order/hooks/useCustomOrder.ts` with a line range and body
6. Failure mode: Falls back to Grep+Read → the mcpServers binding is broken or Serena isn't reachable from the subagent context

## Summary

The path forward for any Claude Code workflow that wants MCP-enabled subagents is clear: **define agents at user or project scope, not plugin scope, and use the `mcpServers:` frontmatter field to explicitly bind the servers you need.** Plugin agents are a dead end for MCP access and always will be.

For Consilium specifically, the migration does not require abandoning the plugin — it requires extracting the MCP-dependent work into user-scoped worker agents that the plugin orchestrators can delegate to. Path A in the migration section above is the recommended approach.
