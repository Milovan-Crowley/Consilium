import { describe, it, expect, vi } from 'vitest';
import { MoonshotClient, type MoonshotClientDeps, type AggregatedChatResponse } from '../src/moonshot/client.js';
import type { ScrubbableRequest } from '../src/pipeline/parameter-scrubber.js';

function makeMockChatCompletions(responses: Array<{ ok: true; content: string } | { ok: false; error: Error }>) {
  let i = 0;
  const create = vi.fn(async () => {
    const r = responses[i++];
    if (!r) throw new Error('mock exhausted');
    if (!r.ok) throw r.error;
    return {
      choices: [{ message: { content: r.content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };
  });
  return { create };
}

const baseRequest = {
  model: 'kimi-k2.5',
  messages: [{ role: 'user', content: 'test' }],
  max_completion_tokens: 100,
};

describe('Moonshot client', () => {
  it('returns content on first-try success', async () => {
    const mock = makeMockChatCompletions([{ ok: true, content: '{"ok": true}' }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe('{"ok": true}');
      expect(result.attempts).toBe(1);
    }
  });

  it('retries once on 429 then succeeds', async () => {
    const err: Error & { status?: number } = new Error('rate limited');
    err.status = 429;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: true, content: 'second-try' },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.attempts).toBe(2);
  });

  it('returns transport_failure after retry exhaustion on persistent 5xx', async () => {
    const err: Error & { status?: number } = new Error('upstream down');
    err.status = 503;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: false, error: err },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure_class).toBe('transport_failure');
    }
  });

  it('returns transport_failure on non-retryable error after one attempt', async () => {
    const err = new Error('weird');
    const mock = makeMockChatCompletions([{ ok: false, error: err }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
  });
});

describe('MoonshotClient.fromEnv (GAP-B fix: defensive timeout parsing)', () => {
  // Note: We can't easily intercept the OpenAI SDK constructor here without
  // a vi.mock setup. The defensive-parse logic is tested separately by
  // observing that fromEnv does not throw on malformed env values.

  it('does not throw on malformed CONSILIUM_KIMI_TIMEOUT_MS', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: 'sk-test',
      CONSILIUM_KIMI_TIMEOUT_MS: 'not-a-number',
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('does not throw on negative CONSILIUM_KIMI_TIMEOUT_MS', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: 'sk-test',
      CONSILIUM_KIMI_TIMEOUT_MS: '-1000',
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('throws clear error on placeholder MOONSHOT_API_KEY', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: '<from-vault>',
    } as NodeJS.ProcessEnv)).toThrow(/placeholder/);
  });
});

describe('Moonshot client truncation retry (GAP-C fix)', () => {
  // Spec Section 1: "Length truncation → retry once with higher cap, then synthetic GAP with
  // unverified_reason=truncation." These tests pin the soft-retry semantics that GAP-C added.

  function truncatedResponse(): AggregatedChatResponse {
    return {
      choices: [{ message: { content: '' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 10, completion_tokens: 100 },
    };
  }

  function successResponse(content: string): AggregatedChatResponse {
    return {
      choices: [{ message: { content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 50 },
    };
  }

  it('retries once with doubled cap on first truncation, then succeeds', async () => {
    const observed: ScrubbableRequest[] = [];
    const create = vi.fn(async (req: ScrubbableRequest) => {
      observed.push(req);
      return observed.length === 1 ? truncatedResponse() : successResponse('success on retry');
    });
    const client = new MoonshotClient({
      chatCompletionsCreate: create,
      sleep: () => Promise.resolve(),
    });
    const result = await client.complete({
      model: 'kimi-k2.5',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe('success on retry');
      expect(result.attempts).toBe(2);
    }
    expect(observed[0]?.max_completion_tokens).toBe(100);
    expect(observed[1]?.max_completion_tokens).toBe(200);
  });

  it('returns truncation failure when retry also truncates', async () => {
    const create = vi.fn(async () => truncatedResponse());
    const client = new MoonshotClient({
      chatCompletionsCreate: create,
      sleep: () => Promise.resolve(),
    });
    const result = await client.complete({
      model: 'kimi-k2.5',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure_class).toBe('truncation');
      expect(result.attempts).toBe(2);
    }
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('clamps doubled cap at 16000', async () => {
    const observed: ScrubbableRequest[] = [];
    const create = vi.fn(async (req: ScrubbableRequest) => {
      observed.push(req);
      return observed.length === 1 ? truncatedResponse() : successResponse('clamped retry');
    });
    const client = new MoonshotClient({
      chatCompletionsCreate: create,
      sleep: () => Promise.resolve(),
    });
    const result = await client.complete({
      model: 'kimi-k2.5',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 10000,
    });
    expect(result.ok).toBe(true);
    expect(observed[1]?.max_completion_tokens).toBe(16000); // clamped, not 20000
  });

  it('does not retry when max_completion_tokens already at 16000', async () => {
    const create = vi.fn(async () => truncatedResponse());
    const client = new MoonshotClient({
      chatCompletionsCreate: create,
      sleep: () => Promise.resolve(),
    });
    const result = await client.complete({
      model: 'kimi-k2.5',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 16000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure_class).toBe('truncation');
      expect(result.attempts).toBe(1);
    }
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('truncation retry does NOT consume transport-retry budget', async () => {
    // Sequence: truncate → 429 → success. With independent budgets this should succeed at attempts=3.
    // If truncation retry consumed the transport budget, the 429 would exhaust it and fail.
    const err: Error & { status?: number } = new Error('rate limited');
    err.status = 429;
    let call = 0;
    const create = vi.fn(async () => {
      call += 1;
      if (call === 1) return truncatedResponse();
      if (call === 2) throw err;
      return successResponse('made it through');
    });
    const client = new MoonshotClient({
      chatCompletionsCreate: create,
      sleep: () => Promise.resolve(),
    });
    const result = await client.complete({
      model: 'kimi-k2.5',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe('made it through');
      expect(result.attempts).toBe(3);
    }
    expect(create).toHaveBeenCalledTimes(3);
  });
});
