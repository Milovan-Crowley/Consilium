import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

import { MoonshotClient } from './moonshot/client.js';
import type { MoonshotResult } from './moonshot/types.js';
import type { buildRequest } from './pipeline/request-builder.js';
import { Semaphore } from './runtime/concurrency.js';
import { SessionBudget } from './runtime/budget.js';
import { logTelemetry } from './runtime/telemetry.js';
import { createVerifyLane } from './tools/verify-lane.js';
import { createHealth } from './tools/health.js';
import { createMode } from './tools/mode.js';

const VerifyLaneArgs = z
  .object({
    run_id: z.string(),
    artifact_id: z.string(),
    artifact_sha: z.string(),
    artifact_type: z.enum(['spec', 'plan', 'diagnosis', 'task', 'campaign']),
    lane: z.string(),
    bundle_id: z.string(),
    profile: z.enum(['principalis_light', 'principalis_grounded', 'principalis_adversarial', 'principalis_batch']),
    model: z.string().optional(),
    artifact_slice: z.string().min(1, 'artifact_slice must be non-empty'),
    evidence_bundle: z
      .object({
        sources: z.array(
          z
            .object({
              source_id: z.string(),
              source_type: z.enum(['artifact', 'repo', 'diff', 'doctrine', 'command', 'tool_result', 'upstream']),
              content: z.string(),
            })
            .strict(),
        ).min(1, 'evidence_bundle.sources must contain at least one source'),
      })
      .strict(),
    claims: z.array(z.object({ claim_id: z.string(), claim: z.string() }).strict()).min(1, 'claims must contain at least one claim'),
    max_completion_tokens: z.number().int().min(100).max(16000).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
  })
  .strict();

export async function startServer(): Promise<void> {
  const env = process.env;
  const defaultModel = env.CONSILIUM_KIMI_DEFAULT_MODEL ?? 'kimi-k2.5';
  const escalationModel = env.CONSILIUM_KIMI_ESCALATION_MODEL ?? 'kimi-k2.6';
  // Defensive env parsing: NaN/negative/non-numeric falls back to documented defaults.
  // Without these guards, a malformed CONSILIUM_KIMI_SESSION_BUDGET_USD silently produces
  // NaN (unbounded budget); malformed CONSILIUM_KIMI_MAX_CONCURRENCY produces NaN (deadlocked
  // semaphore — Semaphore.acquire never resolves). Mirrors the same guard used in
  // MoonshotClient.fromEnv for CONSILIUM_KIMI_TIMEOUT_MS; the two parses can drift if one is
  // updated and not the other, but both share the same default and guard, so v1 keeps them mirrored.
  const rawBudget = parseFloat(env.CONSILIUM_KIMI_SESSION_BUDGET_USD ?? '5');
  const budgetUsd = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 5;

  const rawConcurrency = parseInt(env.CONSILIUM_KIMI_MAX_CONCURRENCY ?? '4', 10);
  const concurrency = Number.isFinite(rawConcurrency) && rawConcurrency > 0 ? rawConcurrency : 4;

  const rawTimeout = parseInt(env.CONSILIUM_KIMI_TIMEOUT_MS ?? '45000', 10);
  const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 45000;

  const moonshot = MoonshotClient.fromEnv(env);
  const semaphore = new Semaphore(concurrency);
  const budget = new SessionBudget(budgetUsd);

  // Resolve prompts directory relative to dist/server.js -> ../prompts
  const here = path.dirname(fileURLToPath(import.meta.url));
  const promptsDir = path.resolve(here, '..', 'prompts');

  // Build allowedLanes set from prompts/*.md filenames at startup. A lane is callable
  // only if its prompt template exists on disk; this gives the substrate a single source
  // of truth for "what lanes are dispatchable" and guards against path-traversal lane names.
  // Lane names must be non-empty alphanumeric-with-hyphens identifiers (rejects ".md", "..md",
  // hidden files, and other accidental matches).
  const LANE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
  const allowedLanes = new Set(
    (await readdir(promptsDir))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -'.md'.length))
      .filter((name) => LANE_NAME_RE.test(name)),
  );

  // Per-MCP-process session family identifier — feeds into prompt_cache_key so that
  // repeat dispatches of the same artifact_sha:lane within a session can hit Moonshot's prompt cache.
  const sessionFamily = randomUUID();

  // Hashed user identifier for safety_identifier — never raw user material.
  const userMaterial = env.USER ?? env.LOGNAME ?? 'unknown';
  const safetyIdentifier = createHash('sha256').update(userMaterial).digest('hex').slice(0, 16);

  // MoonshotClient.complete accepts the wider ScrubbableRequest (its scrubParameters input shape
  // includes a string index signature for defense-in-depth). VerifyLaneDeps narrows the dep to
  // exactly the buildRequest output. The actual call is structurally sound — buildRequest's output
  // is a valid ScrubbableRequest — but TypeScript's parameter-contravariance check rejects the
  // direct assignment. A boundary cast at the wiring site is the tactical fix; behavior unchanged.
  const moonshotDep: { complete: (req: ReturnType<typeof buildRequest>) => Promise<MoonshotResult> } =
    moonshot as unknown as { complete: (req: ReturnType<typeof buildRequest>) => Promise<MoonshotResult> };

  const verifyLane = createVerifyLane({
    moonshot: moonshotDep,
    loadLaneTemplate: async (lane: string) => {
      const file = path.join(promptsDir, `${lane}.md`);
      return readFile(file, 'utf-8');
    },
    semaphore,
    budget,
    telemetry: (event) => logTelemetry(event, { stderr: process.stderr, env }),
    now: () => new Date().toISOString(),
    allowedLanes,
    sessionFamily,
    safetyIdentifier,
  });

  const health = createHealth({
    probe: async () => Boolean(env.MOONSHOT_API_KEY),
    budget,
    queueDepth: () => 0,
  });

  const mode = createMode({ env });

  const server = new Server(
    { name: 'consilium-principales', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'verify_lane',
        description: 'Run a single Principalis lane against an artifact slice + evidence bundle. Returns a validated principalis_docket.v1 JSON object.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['run_id', 'artifact_id', 'artifact_sha', 'artifact_type', 'lane', 'bundle_id', 'profile', 'artifact_slice', 'evidence_bundle', 'claims'],
          properties: {
            run_id: { type: 'string' },
            artifact_id: { type: 'string' },
            artifact_sha: { type: 'string' },
            artifact_type: { type: 'string', enum: ['spec', 'plan', 'diagnosis', 'task', 'campaign'] },
            lane: { type: 'string' },
            bundle_id: { type: 'string' },
            profile: { type: 'string', enum: ['principalis_light', 'principalis_grounded', 'principalis_adversarial', 'principalis_batch'] },
            model: { type: 'string' },
            artifact_slice: { type: 'string' },
            evidence_bundle: { type: 'object' },
            claims: { type: 'array' },
            max_completion_tokens: { type: 'number' },
            timeout_ms: { type: 'number' },
          },
        },
      },
      {
        name: 'health',
        description: 'Report MCP health: moonshot reachability, session budget remaining, queue depth, breaker state.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'mode',
        description: 'Return the value of CONSILIUM_VERIFICATION_MODE (substrate does not branch on this; reserved for integration case).',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'verify_lane') {
      const parsed = VerifyLaneArgs.parse(args);
      const docket = await verifyLane({
        ...parsed,
        model: parsed.model ?? (parsed.profile === 'principalis_adversarial' ? escalationModel : defaultModel),
        max_completion_tokens: parsed.max_completion_tokens ?? 2000,
        timeout_ms: parsed.timeout_ms ?? timeoutMs,
      });
      return { content: [{ type: 'text', text: JSON.stringify(docket) }] };
    }
    if (name === 'health') {
      return { content: [{ type: 'text', text: JSON.stringify(await health()) }] };
    }
    if (name === 'mode') {
      return { content: [{ type: 'text', text: await mode() }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
