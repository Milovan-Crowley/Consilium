import type { Docket } from '../docket/schema.js';
import { DocketSchema } from '../docket/schema.js';
import { applyCrossFieldRules } from '../docket/cross-field.js';
import { resolveLocators, type EvidenceBundle } from '../docket/locator.js';
import { downgradeWeakSound } from '../docket/evidence-quality.js';
import { buildRequest } from '../pipeline/request-builder.js';
import { mapFailureToDocket, type FailureContext } from '../pipeline/retry-mapper.js';
import type { MoonshotResult } from '../moonshot/types.js';

export interface VerifyLaneInput {
  run_id: string;
  artifact_id: string;
  artifact_sha: string;
  artifact_type: 'spec' | 'plan' | 'diagnosis' | 'task' | 'campaign';
  lane: string;
  bundle_id: string;
  profile: 'principalis_light' | 'principalis_grounded' | 'principalis_adversarial' | 'principalis_batch';
  model: string;
  artifact_slice: string;
  evidence_bundle: EvidenceBundle;
  claims: Array<{ claim_id: string; claim: string }>;
  max_completion_tokens: number;
  timeout_ms: number;
}

export interface VerifyLaneDeps {
  moonshot: { complete: (req: ReturnType<typeof buildRequest>) => Promise<MoonshotResult> };
  loadLaneTemplate: (lane: string) => Promise<string>;
  semaphore: { acquire: () => Promise<() => void> };
  budget: {
    charge: (usd: number) => void;
    breakerOpen: () => boolean;
    remaining: () => number;
    spent_usd: () => number;
  };
  telemetry: (event: {
    run_id: string; lane: string; model: string; attempt: number;
    prompt_tokens: number; completion_tokens: number; cached_tokens: number;
    finish_reason: string; latency_ms: number;
    schema_status: 'ok' | 'failed'; evidence_status: 'ok' | 'failed';
    retry_count: number; breaker_status: 'open' | 'closed';
  }) => void;
  now: () => string;
  // Allowlist of lane names whose prompt files exist on disk. Built at server startup
  // by reading the prompts/ directory. Lanes outside this set are refused without ever
  // touching Moonshot — protects against path traversal and accidental disabled-lane dispatch.
  allowedLanes: Set<string>;
  // Per-MCP-process session identifier, used in prompt_cache_key.
  sessionFamily: string;
  // Precomputed hashed user identifier for safety_identifier (no raw secret material).
  safetyIdentifier: string;
  // Operator-level thinking gate. Read from CONSILIUM_KIMI_DISABLE_THINKING at MCP startup.
  // v1 substrate does NOT send a thinking parameter to Moonshot — this flag is reserved
  // for the integration case to compose with per-lane `thinking_allowed` metadata.
  // When the integration case wires the actual Moonshot thinking API parameter, it will
  // be enabled per-call only when (disableThinking === false) AND (lane.thinking_allowed === true).
  disableThinking: boolean;
}

const PRICE_USD_PER_1M = {
  prompt: 0.3,
  completion: 0.5,
};

function priceUsd(prompt_tokens: number, completion_tokens: number): number {
  return (prompt_tokens / 1_000_000) * PRICE_USD_PER_1M.prompt
       + (completion_tokens / 1_000_000) * PRICE_USD_PER_1M.completion;
}

export function createVerifyLane(deps: VerifyLaneDeps) {
  return async (input: VerifyLaneInput): Promise<Docket> => {
    const ctx: FailureContext = {
      run_id: input.run_id,
      artifact_id: input.artifact_id,
      artifact_sha: input.artifact_sha,
      artifact_type: input.artifact_type,
      lane: input.lane,
      bundle_id: input.bundle_id,
      model: input.model,
      profile: input.profile,
      attempt: 1,
      started_at: deps.now(),
      finished_at: deps.now(),
    };

    // Lane allowlist: refuse unknown / disabled lanes before consuming budget or touching Moonshot.
    if (!deps.allowedLanes.has(input.lane)) {
      const failedAt = deps.now();
      return mapFailureToDocket('refused', { ...ctx, finished_at: failedAt });
    }

    if (deps.budget.breakerOpen()) {
      return mapFailureToDocket('refused', { ...ctx, finished_at: deps.now() });
    }

    const release = await deps.semaphore.acquire();
    const startedAt = deps.now();
    try {
      const template = await deps.loadLaneTemplate(input.lane);
      const req = buildRequest({
        lane: input.lane,
        laneTemplate: template,
        artifactSlice: input.artifact_slice,
        evidenceBundle: input.evidence_bundle,
        claims: input.claims,
        model: input.model,
        maxCompletionTokens: input.max_completion_tokens,
        artifactSha: input.artifact_sha,
        sessionFamily: deps.sessionFamily,
        safetyIdentifier: deps.safetyIdentifier,
      });
      const result = await deps.moonshot.complete(req);
      const finishedAt = deps.now();

      if (!result.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0,
          finish_reason: 'error', latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket(result.failure_class, { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Charge budget on success
      const cost = priceUsd(result.prompt_tokens, result.completion_tokens);
      deps.budget.charge(cost);

      // Parse the response as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(result.content);
      } catch {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Validate against zod schema (rule 7, 8 enforced by .strict() and enum)
      const zodResult = DocketSchema.safeParse(parsed);
      if (!zodResult.success) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      let docket = zodResult.data;

      // Verify Kimi-returned identifying fields match request inputs.
      // Kimi's role is sterile clerk: it does not influence its own metadata.
      // Drift on any of these fields rejects the docket.
      const fieldsMatch =
        docket.run_id === input.run_id &&
        docket.artifact_id === input.artifact_id &&
        docket.artifact_sha === input.artifact_sha &&
        docket.artifact_type === input.artifact_type &&
        docket.lane === input.lane &&
        docket.bundle_id === input.bundle_id &&
        docket.profile === input.profile &&
        docket.model === input.model;
      if (!fieldsMatch) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Rule 10 enforcement: every requested claim must appear in either findings or unverified_claims.
      const accountedFor = new Set<string>([
        ...docket.findings.map((f) => f.claim_id),
        ...docket.unverified_claims.map((u) => u.claim_id),
      ]);
      const missingClaims = input.claims.filter((c) => !accountedFor.has(c.claim_id));
      if (missingClaims.length > 0) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'ok',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Apply evidence-quality downgrade. Weakly-evidenced SOUND findings are flipped to CONCERN
      // and `overall` is recomputed; cross-field rule 2 then passes because no SOUND findings remain
      // without strong evidence.
      docket = downgradeWeakSound(docket);

      // Cross-field rules
      const cf = applyCrossFieldRules(docket);
      if (!cf.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'ok',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Locator resolution
      const lr = resolveLocators(docket, input.evidence_bundle);
      if (!lr.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'ok', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      deps.telemetry({
        run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
        prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
        finish_reason: result.finish_reason, latency_ms: 0,
        schema_status: 'ok', evidence_status: 'ok',
        retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
      });

      return docket;
    } catch (err) {
      // Defense-in-depth: any unexpected throw from loadLaneTemplate or buildRequest
      // (or anywhere else inside this try block) must still produce a synthetic-failure
      // docket so the dispatcher's "always returns a docket" contract holds. The Layer 1
      // Zod gate in server.ts catches the empty-bundle / empty-artifact cases at the MCP
      // boundary; this catch covers the deployment-race case (prompt file deleted between
      // startup-allowlist scan and dispatch) and any future caller path that bypasses
      // VerifyLaneArgs validation.
      const code = (err as { code?: unknown }).code;
      const isFsError = typeof code === 'string' &&
        ['ENOENT', 'EISDIR', 'EACCES', 'EPERM'].includes(code);
      const failureClass: 'refused' | 'schema_error' = isFsError ? 'refused' : 'schema_error';
      return mapFailureToDocket(failureClass, { ...ctx, finished_at: deps.now() });
    } finally {
      release();
    }
  };
}
