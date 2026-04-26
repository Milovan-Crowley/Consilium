import OpenAI from 'openai';
import type { MoonshotRequest, MoonshotResult } from './types.js';
import { scrubParameters, type ScrubbableRequest, type ScrubbedRequest } from '../pipeline/parameter-scrubber.js';

// Aggregated, non-streaming-shape response that the deps function returns.
// fromEnv's implementation streams under the hood (spec Section 1 invariant) and aggregates.
// Mocks in tests return this shape directly without involving stream mechanics.
export interface AggregatedChatResponse {
  choices: Array<{ message: { content: string | null }; finish_reason: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    // Newer OpenAI SDK shape (4.70+): cached_tokens lives under prompt_tokens_details.
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

export interface MoonshotClientDeps {
  chatCompletionsCreate: (req: MoonshotRequest) => Promise<AggregatedChatResponse>;
  sleep: (ms: number) => Promise<void>;
}

const FROM_VAULT_LITERALS = new Set(['<from-vault>', '<FROM_VAULT>', 'from-vault', '']);

function isPlaceholderKey(key: string): boolean {
  return FROM_VAULT_LITERALS.has(key.trim());
}

export class MoonshotClient {
  constructor(private readonly deps: MoonshotClientDeps) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): MoonshotClient {
    const apiKey = env.MOONSHOT_API_KEY;
    if (!apiKey) throw new Error('MOONSHOT_API_KEY is not set');
    if (isPlaceholderKey(apiKey)) {
      // Refuse to start with the literal placeholder. Without this, the MCP would spawn,
      // every Moonshot call would 401, and every lane would synthesize transport_failure —
      // the Imperator would diagnose "Moonshot is broken" instead of "key is not in place."
      throw new Error(
        `MOONSHOT_API_KEY is set to a placeholder ("${apiKey}"). Replace with the real key from your vault and restart Claude Code.`,
      );
    }
    const baseURL = env.MOONSHOT_BASE_URL ?? 'https://api.moonshot.ai/v1';

    // Operator-level per-request timeout cap. Defensive against malformed env values:
    // NaN, non-positive, or non-numeric falls back to the documented default (45s).
    // Without this, a hung Moonshot stream would hold a semaphore slot for the SDK's
    // default 600s, eventually deadlocking all concurrent verify_lane calls.
    const rawTimeout = parseInt(env.CONSILIUM_KIMI_TIMEOUT_MS ?? '45000', 10);
    const timeout = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 45000;

    const sdk = new OpenAI({ apiKey, baseURL, timeout });
    return new MoonshotClient({
      chatCompletionsCreate: async (req): Promise<AggregatedChatResponse> => {
        // Spec invariant (Section 1): use streaming Chat Completions. Aggregate chunks
        // into a single AggregatedChatResponse so downstream logic (and test mocks)
        // see the same shape regardless of transport.
        const stream = await sdk.chat.completions.create(
          { ...(req as object), stream: true, stream_options: { include_usage: true } } as never,
        ) as unknown as AsyncIterable<{
          choices: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
          usage?: AggregatedChatResponse['usage'];
        }>;
        let content = '';
        let finish_reason = 'stop';
        let usage: AggregatedChatResponse['usage'] = undefined;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) content += delta;
          const fr = chunk.choices[0]?.finish_reason;
          if (fr) finish_reason = fr;
          if (chunk.usage) usage = chunk.usage;
        }
        return {
          choices: [{ message: { content }, finish_reason }],
          usage,
        };
      },
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
  }

  async complete(req: ScrubbableRequest, maxRetries = 1): Promise<MoonshotResult> {
    // Defense-in-depth: strip any unsupported OpenAI params before hitting Moonshot.
    // In v1, callers (verify_lane → buildRequest) produce already-clean requests, so this
    // is a no-op; it activates if future callers pass arbitrary params.
    const scrubbed = scrubParameters(req);
    let attempt = 0;          // transport-retry budget gauge (consumes maxRetries)
    let totalCalls = 0;       // real call count, reported as `attempts` in the result
    let lastError: unknown;
    let truncationRetried = false;
    let workingReq: ScrubbedRequest = scrubbed;
    while (attempt <= maxRetries) {
      attempt += 1;
      totalCalls += 1;
      try {
        const res = await this.deps.chatCompletionsCreate(workingReq);
        const choice = res.choices[0];
        if (!choice) {
          return { ok: false, failure_class: 'refused', message: 'no choices returned', attempts: totalCalls };
        }
        const content = choice.message.content ?? '';
        if (choice.finish_reason === 'length') {
          // Spec section 1: "Length truncation → retry once with higher cap, then synthetic GAP
          // with unverified_reason=truncation." The transport-retry budget is independent of this
          // soft retry, so we decrement `attempt` to keep the budget intact while `totalCalls`
          // keeps a faithful record of how many round-trips actually happened.
          if (!truncationRetried && workingReq.max_completion_tokens !== undefined) {
            const newCap = Math.min(workingReq.max_completion_tokens * 2, 16000);
            if (newCap > workingReq.max_completion_tokens) {
              truncationRetried = true;
              workingReq = { ...workingReq, max_completion_tokens: newCap };
              attempt -= 1; // soft retry — does not consume transport-retry budget
              continue;
            }
          }
          return { ok: false, failure_class: 'truncation', message: 'finish_reason=length', attempts: totalCalls };
        }
        // Defense-in-depth: an empty content body cannot be a valid docket. Surface a
        // refused failure class with a clear message so the diagnostic isn't a downstream
        // JSON.parse-of-empty-string masquerading as schema_error.
        if (content.trim() === '') {
          return { ok: false, failure_class: 'refused', message: 'empty content body', attempts: totalCalls };
        }
        return {
          ok: true,
          content,
          finish_reason: (choice.finish_reason as 'stop' | 'length' | 'tool_calls' | 'error') ?? 'stop',
          prompt_tokens: res.usage?.prompt_tokens ?? 0,
          completion_tokens: res.usage?.completion_tokens ?? 0,
          // OpenAI SDK 4.70+ exposes cached_tokens under prompt_tokens_details, not usage.cached_tokens.
          cached_tokens: res.usage?.prompt_tokens_details?.cached_tokens ?? 0,
          attempts: totalCalls,
        };
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number }).status;
        const retryable = status === 429 || (typeof status === 'number' && status >= 500);
        if (!retryable || attempt > maxRetries) break;
        await this.deps.sleep(Math.min(2000 * 2 ** (attempt - 1), 8000));
      }
    }
    const status = (lastError as { status?: number }).status;
    const message = (lastError as Error).message ?? String(lastError);
    return {
      ok: false,
      failure_class: 'transport_failure',
      message: status ? `${status}: ${message}` : message,
      attempts: totalCalls,
    };
  }
}
