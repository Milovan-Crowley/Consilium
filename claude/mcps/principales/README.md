# consilium-principales

Kimi Principales MCP — Moonshot-backed lane verification for Consilium.

Substrate only. Integration with Consilium dispatch lives in a separate case.

## Build

```bash
npm install
npm run build
```

## Test

```bash
npm test
```

## Configuration

Environment variables (set via Claude Code's `mcpServers` config):

- `MOONSHOT_API_KEY` — required. Never logged.
- `CONSILIUM_VERIFICATION_MODE` — read by `mode()` tool. Substrate does not branch on it.
- `CONSILIUM_KIMI_DEFAULT_MODEL` — default `kimi-k2.5`.
- `CONSILIUM_KIMI_ESCALATION_MODEL` — default `kimi-k2.6`.
- `CONSILIUM_KIMI_SESSION_BUDGET_USD` — default `5`. Per-session, in-memory.
- `CONSILIUM_KIMI_MAX_CONCURRENCY` — default `4`.
- `CONSILIUM_KIMI_TIMEOUT_MS` — default `45000`.
- `CONSILIUM_KIMI_DISABLE_THINKING` — operator-level thinking gate. Default `true` (thinking disabled). Read at MCP startup; plumbed through to `verify_lane` deps. v1 substrate does not yet wire it to a Moonshot API parameter (no current lane has `thinking_allowed: true`); the integration case adds the actual Moonshot wiring. Set to `false` to permit thinking at the process level for future lanes that opt in.

## Tools

- `mcp__principales__verify_lane(args) → docket` — primary entrypoint.
- `mcp__principales__health() → status` — operator visibility.
- `mcp__principales__mode() → string` — reads `CONSILIUM_VERIFICATION_MODE`.

See `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-kimi-principales-v1/spec.md` for the full design.
